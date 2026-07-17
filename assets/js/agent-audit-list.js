/** AI策略审核列表 */
(function () {
  const PAGE_SIZE = 10;
  const RUN_MS = 2500;
  let page = 1;
  let pollTimer = null;
  const highlight = new URLSearchParams(location.search).get('highlight');
  const finishTimers = new Map();

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }


  function statusBadge(status) {
    if (status === 'running') return '<span class="badge badge-info"><i class="fas fa-spinner fa-spin"></i> 运行中</span>';
    return '<span class="badge badge-success">已完成</span>';
  }

  function scheduleFinish(record) {
    if (!record || record.status !== 'running' || finishTimers.has(record.id)) return;
    const delay = record.id === highlight ? RUN_MS : Math.max(500, RUN_MS - 800);
    const timer = setTimeout(() => {
      finishTimers.delete(record.id);
      window.AgentAuditStore?.finishBatchAudit(record.id);
      renderList();
    }, delay);
    finishTimers.set(record.id, timer);
  }

  function processRunning() {
    (window.AgentAuditStore?.getRunningRecords() || []).forEach(scheduleFinish);
  }

  function getFiltered() {
    const kw = (document.getElementById('al-kw')?.value || '').trim().toLowerCase();
    return (window.AgentAuditStore?.getRecords() || []).filter(r => {
      if (!kw) return true;
      const names = (r.strategies || []).map(s => s.strategyName).join(' ');
      const blob = (r.id + names).toLowerCase();
      return blob.includes(kw);
    });
  }

  function renderList() {
    const tbody = document.getElementById('al-tbody');
    const countEl = document.getElementById('al-count');
    if (!tbody) return;
    const list = getFiltered();
    if (countEl) countEl.textContent = `共 ${list.length} 条`;
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;

    tbody.innerHTML = rows.map(r => {
      const hl = r.id === highlight ? ' style="background:#eff6ff"' : '';
      const done = r.status === 'completed';
      const detailLink = done
        ? `<a href="agent-audit-detail.html?id=${encodeURIComponent(r.id)}" class="link-action">查看详情</a>`
        : `<span class="muted" style="font-size:12px">审核中…</span>`;
      const issue = done && typeof r.warnCount === 'number'
        ? (r.warnCount + (Number(r.failCount) || 0))
        : '—';
      return `<tr${hl}>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td>${r.strategyCount}</td>
        <td>${esc(issue)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${esc(r.triggerBy)}</td>
        <td class="agent-cell-time">${esc(done ? r.completedAt : r.triggeredAt)}</td>
        <td class="cell-actions">
          ${detailLink}
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无审核记录，请从策略审批管理勾选策略发起 AI 智能审批</td></tr>';

    tbody.querySelectorAll('[data-del]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('确定删除该审核记录？')) return;
        const tid = finishTimers.get(a.dataset.del);
        if (tid) { clearTimeout(tid); finishTimers.delete(a.dataset.del); }
        window.AgentAuditStore.deleteRecord(a.dataset.del);
        renderList();
      });
    });

    if (TablePagination) {
      const result = TablePagination.render('al-pagination', {
        total: list.length, page, pageSize: PAGE_SIZE, onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }

    processRunning();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-al-search')?.addEventListener('click', () => { page = 1; renderList(); });
    renderList();
    pollTimer = setInterval(() => {
      if ((window.AgentAuditStore?.getRunningRecords() || []).length) renderList();
    }, 800);
  });

  window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
    finishTimers.forEach(t => clearTimeout(t));
  });
})();
