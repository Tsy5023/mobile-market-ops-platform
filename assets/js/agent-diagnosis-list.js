/** AI策略诊断列表 */
(function () {
  const PAGE_SIZE = 10;
  let page = 1;
  const highlight = new URLSearchParams(location.search).get('highlight');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getStrategyCreator(record) {
    if (record.strategyCreator) return record.strategyCreator;
    const activity = window.AgentActivityStore?.getActivity(record.strategyId);
    if (activity?.creator) return activity.creator;
    return record.triggerBy || '—';
  }

  function getFiltered() {
    const kw = (document.getElementById('dl-kw')?.value || '').trim().toLowerCase();
    return (window.AgentDiagnosisStore?.getRecords() || []).filter(r => {
      if (!kw) return true;
      const blob = (r.id + r.strategyCode + r.strategyName).toLowerCase();
      return blob.includes(kw);
    });
  }

  function renderList() {
    const tbody = document.getElementById('dl-tbody');
    const countEl = document.getElementById('dl-count');
    if (!tbody) return;
    const list = getFiltered();
    if (countEl) countEl.textContent = `共 ${list.length} 条`;
    const rows = window.TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;

    tbody.innerHTML = rows.map(r => {
      const hl = r.id === highlight ? ' style="background:#eff6ff"' : '';
      return `
      <tr${hl}>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td>${esc(r.strategyCode)}</td>
        <td class="cell-ellipsis" title="${esc(r.strategyName)}">${esc(r.strategyName)}</td>
        <td>${esc(getStrategyCreator(r))}</td>
        <td class="agent-cell-time">${esc(r.completedAt || r.triggeredAt)}</td>
        <td><span class="badge badge-success">已完成</span></td>
        <td class="cell-actions">
          <a href="agent-diagnosis-detail.html?id=${encodeURIComponent(r.id)}" class="link-action">查看详情</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无诊断记录，请从活动列表触发策略诊断</td></tr>';

    tbody.querySelectorAll('[data-del]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('确定删除该诊断记录？')) return;
        window.AgentDiagnosisStore.deleteRecord(a.dataset.del);
        renderList();
      });
    });

    if (window.TablePagination) {
      const result = TablePagination.render('dl-pagination', {
        total: list.length,
        page,
        pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-dl-search')?.addEventListener('click', () => { page = 1; renderList(); });
    renderList();
  });
})();
