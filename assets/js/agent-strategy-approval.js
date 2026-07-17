/** 策略审批管理 */
(function () {
  const PAGE_SIZE = 10;
  let page = 1;
  const selectedIds = new Set();

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function statusBadge(status) {
    const st = window.JxStrategyStore?.statusLabel(status) || { cls: 'badge-info', label: status || '—' };
    return `<span class="badge ${esc(st.cls)}">${esc(st.label)}</span>`;
  }

  function getFilters() {
    return {
      strategyId: (document.getElementById('sa-strategy-id')?.value || '').trim().toLowerCase(),
      name: (document.getElementById('sa-strategy-name')?.value || '').trim().toLowerCase(),
      status: document.getElementById('sa-status')?.value || '',
      channel: (document.getElementById('sa-channel')?.value || '').trim().toLowerCase(),
      businessType: document.getElementById('sa-business-type')?.value || ''
    };
  }

  function getFiltered() {
    const f = getFilters();
    return (window.AgentActivityStore?.getActivities() || []).filter(row => {
      const sid = String(row.strategyId || row.strategyCode || '').toLowerCase();
      if (f.strategyId && !sid.includes(f.strategyId)) return false;
      if (f.name && !String(row.name || '').toLowerCase().includes(f.name)) return false;
      if (f.status && row.strategyStatus !== f.status) return false;
      if (f.channel && !String(row.channelLabel || '').toLowerCase().includes(f.channel)) return false;
      if (f.businessType && row.businessType !== f.businessType) return false;
      return true;
    });
  }

  function updateSelectionUI() {
    const btn = document.getElementById('btn-smart-audit');
    const selEl = document.getElementById('sa-selected');
    const n = selectedIds.size;
    if (btn) btn.disabled = n === 0;
    if (selEl) selEl.textContent = n > 0 ? `已选 ${n} 条` : '';
  }

  function syncCheckAll(rows) {
    const checkAll = document.getElementById('sa-check-all');
    if (!checkAll) return;
    const ids = rows.map(r => r.id);
    checkAll.checked = ids.length > 0 && ids.every(id => selectedIds.has(id));
    checkAll.indeterminate = !checkAll.checked && ids.some(id => selectedIds.has(id));
  }

  function renderList() {
    const tbody = document.getElementById('sa-tbody');
    const countEl = document.getElementById('sa-count');
    if (!tbody) return;
    const list = getFiltered();
    if (countEl) countEl.textContent = `共 ${list.length} 条`;
    const rows = window.TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><input type="checkbox" class="sa-row-check" data-id="${esc(r.id)}" ${selectedIds.has(r.id) ? 'checked' : ''}/></td>
        <td><span class="agent-id-code">${esc(r.strategyId || r.strategyCode)}</span></td>
        <td class="cell-ellipsis" title="${esc(r.name)}"><strong>${esc(r.name)}</strong></td>
        <td class="cell-ellipsis" title="${esc(r.channelLabel)}">${esc(r.channelLabel || '—')}</td>
        <td>${statusBadge(r.strategyStatus)}</td>
        <td>${esc(r.businessType || '—')}</td>
        <td>${esc(r.businessLine || '—')}</td>
        <td>${esc(r.creator || '—')}</td>
        <td class="agent-cell-time">${esc((r.createdAt || '').slice(0, 16))}</td>
      </tr>
    `).join('') || '<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">暂无策略数据</td></tr>';

    tbody.querySelectorAll('.sa-row-check').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedIds.add(cb.dataset.id);
        else selectedIds.delete(cb.dataset.id);
        updateSelectionUI();
        syncCheckAll(rows);
      });
    });

    syncCheckAll(rows);
    updateSelectionUI();

    if (window.TablePagination) {
      const result = TablePagination.render('sa-pagination', {
        total: list.length,
        page,
        pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
  }

  function openAuditModal() {
    const strategies = Array.from(selectedIds)
      .map(id => window.AgentActivityStore?.getActivity(id))
      .filter(Boolean);
    if (!strategies.length) return;
    const preview = document.getElementById('sa-audit-preview');
    if (preview) {
      preview.innerHTML = `
        <p><strong>已选策略：</strong>${strategies.length} 条</p>
        <ul class="audit-preview-list">${strategies.slice(0, 5).map(s =>
          `<li>${esc(s.strategyId || s.strategyCode)} · ${esc(s.name)}</li>`
        ).join('')}${strategies.length > 5 ? `<li class="muted">… 等共 ${strategies.length} 条</li>` : ''}</ul>`;
    }
    if (typeof openModal === 'function') openModal('modal-sa-audit');
    else document.getElementById('modal-sa-audit')?.classList.add('show');
  }

  function confirmAudit() {
    const strategies = Array.from(selectedIds)
      .map(id => window.AgentActivityStore?.getActivity(id))
      .filter(Boolean);
    if (!strategies.length) return;
    const btn = document.getElementById('btn-sa-audit-confirm');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中…'; }
    const record = window.AgentAuditStore?.submitBatchAudit(strategies);
    selectedIds.clear();
    updateSelectionUI();
    if (typeof closeModal === 'function') closeModal('modal-sa-audit');
    else document.getElementById('modal-sa-audit')?.classList.remove('show');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> 确认提交'; }
    if (record) {
      location.href = 'agent-audit-list.html?highlight=' + encodeURIComponent(record.id);
    }
  }

  function resetFilters() {
    ['sa-strategy-id', 'sa-strategy-name', 'sa-channel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['sa-status', 'sa-business-type'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    page = 1;
    renderList();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sa-check-all')?.addEventListener('change', e => {
      const list = getFiltered();
      const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
      if (e.target.checked) rows.forEach(r => selectedIds.add(r.id));
      else rows.forEach(r => selectedIds.delete(r.id));
      renderList();
    });

    document.getElementById('btn-smart-audit')?.addEventListener('click', openAuditModal);
    document.getElementById('btn-sa-search')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('btn-sa-reset')?.addEventListener('click', resetFilters);
    document.getElementById('btn-sa-audit-confirm')?.addEventListener('click', confirmAudit);
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.closeModal;
        if (typeof closeModal === 'function') closeModal(id);
        else document.getElementById(id)?.classList.remove('show');
      });
    });
    renderList();
  });
})();
