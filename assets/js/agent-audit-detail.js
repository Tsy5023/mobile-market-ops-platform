/** 策略审核详情 */
(function () {
  const id = new URLSearchParams(location.search).get('id');
  let pollTimer = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function issueCount(record) {
    if (!record || record.status !== 'completed') return '—';
    return (Number(record.warnCount) || 0) + (Number(record.failCount) || 0);
  }

  function conclusionHtml(c, label) {
    if (c === 'fail' || c === 'warn') {
      return `<span class="audit-conclusion warn"><i class="fas fa-circle-exclamation icon-warn"></i>${esc(label || '疑似存在问题')}</span>`;
    }
    return `<span class="audit-conclusion pass"><span class="dot"></span>${esc(label || '通过')}</span>`;
  }

  function renderRuleTable(items) {
    if (!items || !items.length) {
      return '<p class="muted audit-rule-empty">暂无规则审核明细</p>';
    }
    return `<div class="table-scroll">
      <table class="data-table agent-data-table audit-rule-table audit-rule-table-flat">
        <thead>
          <tr>
            <th style="width:52px">序号</th>
            <th style="min-width:160px">规则名称</th>
            <th style="width:96px">审核字段</th>
            <th style="width:120px">结论</th>
            <th>审核说明</th>
          </tr>
        </thead>
        <tbody>${items.map(item => `
          <tr>
            <td>${item.seq}</td>
            <td>${esc(item.ruleName)}</td>
            <td>${esc(item.checkField)}</td>
            <td>${conclusionHtml(item.conclusion, item.conclusionLabel)}</td>
            <td class="audit-rule-analysis">${esc(item.analysis)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function renderStrategyBlock(s, index) {
    return `
      <article class="audit-strategy-block">
        <header class="audit-strategy-head">
          <div class="audit-strategy-head-item">
            <span class="audit-strategy-head-label">序号</span>
            <strong>${index + 1}</strong>
          </div>
          <div class="audit-strategy-head-item">
            <span class="audit-strategy-head-label">策略ID</span>
            <strong class="agent-id-code">${esc(s.strategyCode)}</strong>
          </div>
          <div class="audit-strategy-head-item audit-strategy-head-name">
            <span class="audit-strategy-head-label">策略名称</span>
            <strong>${esc(s.strategyName)}</strong>
          </div>
          <div class="audit-strategy-head-item">
            <span class="audit-strategy-head-label">渠道</span>
            <strong>${esc(s.channel)}</strong>
          </div>
          <div class="audit-strategy-head-item audit-strategy-head-conclusion">
            <span class="audit-strategy-head-label">审核结论</span>
            ${conclusionHtml(s.conclusion, s.conclusionLabel)}
          </div>
        </header>
        <div class="audit-strategy-rules">
          ${renderRuleTable(s.items)}
        </div>
      </article>`;
  }

  function renderPage() {
    const record = window.AgentAuditStore?.getRecord(id);
    const header = document.getElementById('audit-header');
    const wrap = document.getElementById('audit-strategies-wrap');
    const card = document.getElementById('audit-result-card');

    if (!record) {
      if (header) header.innerHTML = '<p class="muted">未找到审核记录</p>';
      return;
    }

    if (record.status === 'running') {
      if (header) {
        header.innerHTML = `
          <div class="kv"><label>审核ID</label><strong>${esc(record.id)}</strong></div>
          <div class="kv"><label>策略数量</label><strong>${record.strategyCount} 条</strong></div>
          <div class="kv"><label>任务状态</label><strong><span class="badge badge-info"><i class="fas fa-spinner fa-spin"></i> 智能体审核运行中</span></strong></div>
          <div class="kv"><label>审核人</label><strong>${esc(record.triggerBy)}</strong></div>
          <div class="kv"><label>提交时间</label><strong>${esc(record.triggeredAt)}</strong></div>`;
      }
      if (wrap) {
        wrap.innerHTML = `<div class="audit-running-placeholder muted">
          <i class="fas fa-robot"></i>
          <p>智能体正在按「策略审核规则管理」中启用的规则逐条分析 ${record.strategyCount} 条策略，请稍候…</p>
        </div>`;
      }
      if (card) card.style.opacity = '0.85';
      if (!window.__auditDetailFinishTimer) {
        window.__auditDetailFinishTimer = setTimeout(() => {
          window.__auditDetailFinishTimer = null;
          window.AgentAuditStore?.finishBatchAudit(id);
          renderPage();
        }, 2500);
      }
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          const r = window.AgentAuditStore?.getRecord(id);
          if (r && r.status === 'completed') {
            clearInterval(pollTimer);
            pollTimer = null;
            renderPage();
          }
        }, 600);
      }
      return;
    }

    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (card) card.style.opacity = '';

    if (header) {
      header.innerHTML = `
        <div class="kv"><label>审核ID</label><strong>${esc(record.id)}</strong></div>
        <div class="kv"><label>策略数量</label><strong>${record.strategyCount} 条</strong></div>
        <div class="kv"><label>通过 / 疑似存在问题</label><strong>${record.passCount} / ${issueCount(record)}</strong></div>
        <div class="kv"><label>审核人</label><strong>${esc(record.triggerBy)}</strong></div>
        <div class="kv"><label>完成时间</label><strong>${esc(record.completedAt)}</strong></div>`;
    }

    if (wrap) {
      const strategies = record.strategies || [];
      wrap.innerHTML = strategies.length
        ? `<div class="audit-strategy-list">${strategies.map((s, i) => renderStrategyBlock(s, i)).join('')}</div>`
        : '<p class="muted" style="padding:24px;text-align:center">暂无策略审核结果</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', renderPage);
  window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
    if (window.__auditDetailFinishTimer) clearTimeout(window.__auditDetailFinishTimer);
  });
})();
