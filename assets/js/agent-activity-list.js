/** 活动列表 */
(function () {
  const PAGE_SIZE = 10;
  const CURRENT_USER = '张明';
  let page = 1;
  let activeTab = 'all';
  let pendingStrategyId = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getFilters() {
    return {
      strategyId: (document.getElementById('af-strategy-id')?.value || '').trim().toLowerCase(),
      name: (document.getElementById('af-strategy-name')?.value || '').trim().toLowerCase(),
      start: document.getElementById('af-create-start')?.value || '',
      end: document.getElementById('af-create-end')?.value || '',
      status: document.getElementById('af-status')?.value || '',
      businessLine: document.getElementById('af-business-line')?.value || '',
      channel: (document.getElementById('af-channel')?.value || '').trim().toLowerCase(),
      position: (document.getElementById('af-position')?.value || '').trim().toLowerCase(),
      product: (document.getElementById('af-product')?.value || '').trim().toLowerCase(),
      productCode: (document.getElementById('af-product-code')?.value || '').trim().toLowerCase(),
      businessType: document.getElementById('af-business-type')?.value || ''
    };
  }

  function matchTab(row) {
    if (activeTab === 'mine' || activeTab === 'my_strategy') return row.creator === CURRENT_USER;
    if (activeTab === 'excellent') return row.status === 'completed' || row.status === 'executing';
    return true;
  }

  function getFiltered() {
    const f = getFilters();
    return (window.AgentActivityStore?.getActivities() || []).filter(row => {
      if (!matchTab(row)) return false;
      const sid = String(row.strategyId || row.strategyCode || '').toLowerCase();
      if (f.strategyId && !sid.includes(f.strategyId)) return false;
      if (f.name && !String(row.name || '').toLowerCase().includes(f.name)) return false;
      if (f.status && row.strategyStatus !== f.status) return false;
      if (f.businessLine && row.businessLine !== f.businessLine) return false;
      if (f.channel && !String(row.channelLabel || '').toLowerCase().includes(f.channel)) return false;
      if (f.position && !String(row.operationPosition || '').toLowerCase().includes(f.position)) return false;
      if (f.product && !String(row.productInfo || '').toLowerCase().includes(f.product)) return false;
      if (f.productCode && !String(row.productCode || '').toLowerCase().includes(f.productCode)) return false;
      if (f.businessType && row.businessType !== f.businessType) return false;
      if (f.start || f.end) {
        const d = (row.createdAt || '').slice(0, 10);
        if (f.start && d && d < f.start) return false;
        if (f.end && d && d > f.end) return false;
      }
      return true;
    });
  }

  function renderList() {
    const tbody = document.getElementById('activity-tbody');
    const countEl = document.getElementById('activity-count');
    if (!tbody) return;
    const list = getFiltered();
    if (countEl) countEl.textContent = `共 ${list.length} 条`;
    const rows = window.TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><span class="agent-id-code">${esc(r.strategyId || r.strategyCode)}</span></td>
        <td class="cell-ellipsis" title="${esc(r.name)}"><strong>${esc(r.name)}</strong></td>
        <td class="cell-ellipsis" title="${esc(r.channelLabel)}">${esc(r.channelLabel || '—')}</td>
        <td class="cell-ellipsis" title="${esc(r.operationPosition)}">${esc(r.operationPosition || '—')}</td>
        <td class="cell-ellipsis" title="${esc(r.productInfo)}">${esc(r.productInfo || '—')}</td>
        <td>${esc(r.customerCount || '—')}</td>
        <td>${esc(r.businessType || '—')}</td>
        <td>${esc(r.businessLine || '—')}</td>
        <td>${esc(r.serviceTag || '—')}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-diag="${esc(r.id)}">策略诊断</a>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="10" class="muted" style="text-align:center;padding:24px">暂无活动策略</td></tr>';

    tbody.querySelectorAll('[data-diag]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        openDiagModal(a.dataset.diag);
      });
    });

    if (window.TablePagination) {
      const result = TablePagination.render('activity-pagination', {
        total: list.length,
        page,
        pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
  }

  function openDiagModal(id) {
    const row = window.AgentActivityStore?.getActivity(id);
    if (!row) return;
    pendingStrategyId = id;
    document.getElementById('diag-trigger-preview').innerHTML = `
      <p><strong>策略：</strong>${esc(row.name)}</p>
      <p><strong>策略ID：</strong>${esc(row.strategyId || row.strategyCode)}</p>
      <p><strong>渠道：</strong>${esc(row.channelLabel || '—')}</p>`;
    if (typeof openModal === 'function') openModal('modal-diag-trigger');
    else document.getElementById('modal-diag-trigger')?.classList.add('show');
  }

  function confirmDiag() {
    const row = window.AgentActivityStore?.getActivity(pendingStrategyId);
    if (!row) return;
    const record = window.AgentDiagnosisStore?.triggerDiagnosis(row);
    pendingStrategyId = null;
    if (typeof closeModal === 'function') closeModal('modal-diag-trigger');
    else document.getElementById('modal-diag-trigger')?.classList.remove('show');
    if (record) {
      location.href = 'agent-diagnosis-list.html?highlight=' + encodeURIComponent(record.id);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#activity-tabs [data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('#activity-tabs [data-tab]').forEach(b => b.classList.toggle('active', b === btn));
        page = 1;
        renderList();
      });
    });

    document.getElementById('btn-af-search')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('btn-af-reset')?.addEventListener('click', () => {
      ['af-strategy-id', 'af-strategy-name', 'af-create-start', 'af-create-end', 'af-channel', 'af-position', 'af-product', 'af-product-code'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      ['af-status', 'af-business-line', 'af-business-type'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      page = 1;
      renderList();
    });
    document.getElementById('btn-diag-trigger-confirm')?.addEventListener('click', confirmDiag);
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
