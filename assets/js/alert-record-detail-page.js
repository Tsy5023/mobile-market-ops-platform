/** 预警记录详情页 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getRecordId() {
    return new URLSearchParams(location.search).get('id') || '';
  }

  function pushStatusBadge(status) {
    if (status === 'success') return '<span class="badge badge-success">成功</span>';
    if (status === 'failed') return '<span class="badge badge-danger">失败</span>';
    return '<span class="badge badge-info">—</span>';
  }

  function channelIcon(channel) {
    return channel === '短信' ? 'fa-comment-sms' : 'fa-envelope';
  }

  function renderSummary(record) {
    const summaryEl = document.getElementById('ard-summary');
    if (!summaryEl) return;
    summaryEl.innerHTML = `
      <div class="alert-record-summary-item">
        <span class="label">预警规则</span>
        <strong>${esc(record.ruleName)}</strong>
      </div>
      <div class="alert-record-summary-item">
        <span class="label">规则描述</span>
        <span>${esc(record.ruleDescription || '—')}</span>
      </div>
      <div class="alert-record-summary-item">
        <span class="label">触发日期</span>
        <strong>${esc(record.triggerDate || '—')}</strong>
      </div>
      <div class="alert-record-summary-item">
        <span class="label">触发时间</span>
        <strong>${esc(record.triggerTime || '—')}</strong>
      </div>
      <div class="alert-record-summary-item">
        <span class="label">预警指标</span>
        <strong>${esc(record.totalMetrics)} 条</strong>
      </div>
      <div class="alert-record-summary-item">
        <span class="label">异常指标</span>
        <strong class="${record.abnormalMetrics ? 'text-danger' : 'text-success'}">${esc(record.abnormalMetrics)} 条</strong>
      </div>`;
  }

  function renderNotify(record) {
    const summaryEl = document.getElementById('ard-notify-summary');
    const tbody = document.getElementById('ard-notify-tbody');
    const countEl = document.getElementById('ard-notify-count');
    const logs = record.notifyLogs || [];

    if (countEl) {
      countEl.textContent = record.notifyPushed ? `共 ${logs.length} 条推送记录` : '未触发推送';
    }

    if (summaryEl) {
      if (!record.notifyPushed) {
        summaryEl.innerHTML = `
          <div class="alert-record-notify-empty">
            <i class="fas fa-bell-slash"></i>
            <p>本次监控无异常指标，未向接收人推送预警通知。</p>
            <p class="muted">规则已配置接收人：${esc((record.notifyRecipients || []).map(p => p.name).join('、') || '—')}</p>
          </div>`;
      } else {
        const channels = (record.notifyChannels || []).map(ch =>
          `<span class="alert-notify-tag ${ch === '短信' ? 'alert-notify-tag-sms' : 'alert-notify-tag-email'}"><i class="fas ${channelIcon(ch)}"></i> ${esc(ch)}</span>`
        ).join(' ');
        summaryEl.innerHTML = `
          <div class="alert-record-notify-meta">
            <div class="alert-record-notify-meta-item">
              <span class="label">推送状态</span>
              <span class="badge badge-success">已推送</span>
            </div>
            <div class="alert-record-notify-meta-item">
              <span class="label">推送时间</span>
              <strong>${esc(record.notifyPushedAt || record.triggerTime || '—')}</strong>
            </div>
            <div class="alert-record-notify-meta-item">
              <span class="label">推送渠道</span>
              <div class="alert-notify-channels-inline">${channels || '<span class="muted">—</span>'}</div>
            </div>
            <div class="alert-record-notify-meta-item">
              <span class="label">接收人数</span>
              <strong>${esc((record.notifyRecipients || []).length)} 人</strong>
            </div>
          </div>`;
      }
    }

    if (tbody) {
      if (!record.notifyPushed || !logs.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center;padding:20px">暂无推送记录</td></tr>';
        return;
      }
      tbody.innerHTML = logs.map(log => `<tr>
        <td><strong>${esc(log.recipientName)}</strong></td>
        <td class="cell-meta">${esc(log.recipientMeta || '—')}</td>
        <td><span class="alert-notify-tag ${log.channel === '短信' ? 'alert-notify-tag-sms' : 'alert-notify-tag-email'}"><i class="fas ${channelIcon(log.channel)}"></i> ${esc(log.channel)}</span></td>
        <td>${pushStatusBadge(log.status)}</td>
        <td>${esc(log.pushedAt || '—')}</td>
      </tr>`).join('');
    }
  }

  function renderItems(record) {
    const tbody = document.getElementById('ard-detail-tbody');
    const countEl = document.getElementById('ard-item-count');
    const items = record.items || [];
    if (countEl) countEl.textContent = `共 ${items.length} 条`;
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
      const resultBadge = item.isAbnormal
        ? '<span class="badge badge-danger">异常</span>'
        : '<span class="badge badge-success">正常</span>';
      return `<tr class="${item.isAbnormal ? 'is-abnormal-row' : ''}">
        <td><strong>${esc(item.metricName)}</strong><br><small class="muted">${esc(item.metricCode || '')}</small></td>
        <td>${esc(item.level || '—')}</td>
        <td>${esc(item.scopeLabel || '—')}</td>
        <td>${esc(item.ruleExpr || '—')}</td>
        <td>${esc(item.actualValue || '—')}</td>
        <td>${resultBadge}</td>
        <td class="cell-alert-content">${esc(item.content || '—')}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无指标明细</td></tr>';
  }

  function showNotFound() {
    document.getElementById('ard-page-title').textContent = '预警记录详情';
    document.getElementById('ard-page-sub').textContent = '';
    document.getElementById('ard-summary')?.setAttribute('hidden', '');
    document.getElementById('ard-notify-card')?.setAttribute('hidden', '');
    document.getElementById('ard-results-card')?.setAttribute('hidden', '');
    document.getElementById('ard-not-found')?.removeAttribute('hidden');
  }

  function renderDetail() {
    const recordId = getRecordId();
    const record = recordId ? AlertRecordStore.getEnrichedById(recordId) : null;
    if (!record) {
      showNotFound();
      return;
    }

    document.title = `${record.ruleName} - 预警记录详情 - 移动市场运营平台`;
    const titleEl = document.getElementById('ard-page-title');
    const subEl = document.getElementById('ard-page-sub');
    if (titleEl) titleEl.textContent = record.ruleName || '预警记录详情';
    if (subEl) {
      subEl.textContent = `触发日期 ${record.triggerDate || '—'} · ${record.triggerTime || '—'}`;
    }

    renderSummary(record);
    renderNotify(record);
    renderItems(record);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ard-detail-tbody')) return;
    renderDetail();
  });
})();
