/** 客群管理 - 查询与详情 */
(function () {
  const PAGE_SIZE = 10;
  let filtered = [];
  let page = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getSegmentList() {
    return window.CustomerSegmentStore?.getAll() || window.CUSTOMER_SEGMENT_LIST || [];
  }

  function sourceBadge(row) {
    if (window.CustomerSegmentStore?.sourceBadge) {
      return window.CustomerSegmentStore.sourceBadge(row?.source);
    }
    return row?.source === 'dispatch'
      ? '<span class="badge-source-dispatch">客群调度</span>'
      : '<span class="badge-source-ai">AI根因生成</span>';
  }

  function sourceLabel(row) {
    if (window.CustomerSegmentStore?.sourceLabel) {
      return window.CustomerSegmentStore.sourceLabel(row?.source);
    }
    return row?.source === 'dispatch' ? '客群调度' : 'AI根因生成';
  }

  function statusBadge(status) {
    const m = window.SEGMENT_STATUS_MAP[status] || SEGMENT_STATUS_MAP.draft;
    return `<span class="badge ${m.cls}">${m.label}</span>`;
  }

  function momClass(mom) {
    const s = String(mom || '');
    return s.startsWith('-') || s.includes('降') ? 'metric-val-neg' : 'metric-val-pos';
  }

  function getFilters() {
    return {
      name: (document.getElementById('f-name')?.value || '').trim(),
      code: (document.getElementById('f-code')?.value || '').trim(),
      status: document.getElementById('f-status')?.value || '',
      source: document.getElementById('f-source')?.value || ''
    };
  }

  function applyFilters() {
    const f = getFilters();
    const list = getSegmentList();
    filtered = list.filter(row => {
      if (f.name && !row.name.includes(f.name)) return false;
      if (f.code && !row.id.includes(f.code)) return false;
      if (f.status && row.status !== f.status) return false;
      if (f.source && row.source !== f.source) return false;
      return true;
    });
    page = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = document.getElementById('segment-tbody');
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:40px">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(row => `
      <tr data-id="${esc(row.id)}">
        <td class="cell-ellipsis" title="${esc(row.id)}"><code>${esc(row.id)}</code></td>
        <td class="cell-ellipsis" title="${esc(row.name)}"><strong>${esc(row.name)}</strong></td>
        <td>${sourceBadge(row)}</td>
        <td><strong>${esc(row.scaleLabel || '—')}</strong></td>
        <td class="cell-ellipsis" title="${esc(row.bizCaliber)}">${esc(row.bizCaliber)}</td>
        <td>${esc(row.effectiveDate)}</td>
        <td>${esc(row.expiryDate)}</td>
        <td>${statusBadge(row.status)}</td>
        <td class="seg-col-ops"><a href="#" class="link-action" data-act="detail">详情</a></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-act="detail"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const id = a.closest('tr')?.dataset.id;
        const row = getSegmentList().find(r => r.id === id);
        if (row) showDetail(row);
      });
    });
  }

  function renderMetricsBlock(metrics) {
    const list = metrics || [];
    if (!list.length) {
      return '<p class="muted seg-detail-empty">暂无关联指标</p>';
    }
    return `
      <table class="data-table seg-detail-rel-table">
        <thead>
          <tr>
            <th>指标名称</th>
            <th>指标编码</th>
            <th>指标值</th>
            <th>环比</th>
            <th>同比</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(m => `
            <tr>
              <td><strong>${esc(m.name)}</strong></td>
              <td><code>${esc(m.code || '—')}</code></td>
              <td><strong>${esc(m.value || '—')}</strong></td>
              <td><span class="${momClass(m.mom)}">${esc(m.mom || '—')}</span></td>
              <td><span class="${momClass(m.yoy)}">${esc(m.yoy || '—')}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function renderTagsBlock(tags) {
    const list = tags || [];
    if (!list.length) {
      return '<p class="muted seg-detail-empty">暂无关联标签</p>';
    }
    return `
      <div class="seg-detail-tag-grid">
        ${list.map(t => `
          <div class="seg-detail-tag-item">
            <span class="tag-name">${esc(t.name)}</span>
            <span class="tag-val">${esc(t.value || '—')}</span>
          </div>`).join('')}
      </div>`;
  }

  function showDetail(row) {
    const body = document.getElementById('segment-detail-body');
    if (!body) return;
    const metrics = row.metrics || [];
    const displayTags = (row.tags || []).filter(t => t.name !== '调度任务');

    body.innerHTML = `
      <div class="seg-detail-base form-grid" style="grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
        <div class="form-field"><label>客群编码</label><input readonly value="${esc(row.id)}"/></div>
        <div class="form-field"><label>客群名称</label><input readonly value="${esc(row.name)}"/></div>
        <div class="form-field"><label>来源</label><input readonly value="${esc(sourceLabel(row))}"/></div>
        <div class="form-field"><label>状态</label><input readonly value="${SEGMENT_STATUS_MAP[row.status]?.label || row.status}"/></div>
        <div class="form-field"><label>客群规模</label><input readonly value="${esc(row.scaleLabel || '—')}"/></div>
        <div class="form-field" style="grid-column:1/-1"><label>业务口径</label><textarea readonly rows="2">${esc(row.bizCaliber)}</textarea></div>
        <div class="form-field"><label>生效日期</label><input readonly value="${esc(row.effectiveDate)}"/></div>
        <div class="form-field"><label>失效日期</label><input readonly value="${esc(row.expiryDate)}"/></div>
      </div>
      <div class="seg-detail-section">
        <h4 class="seg-detail-section-title"><i class="fas fa-chart-line"></i> 关联指标 <span class="muted">共 ${metrics.length} 项</span></h4>
        ${renderMetricsBlock(metrics)}
      </div>
      <div class="seg-detail-section">
        <h4 class="seg-detail-section-title"><i class="fas fa-tags"></i> 关联标签 <span class="muted">共 ${displayTags.length} 项</span></h4>
        ${renderTagsBlock(displayTags)}
      </div>`;
    if (typeof openModal === 'function') openModal('modal-segment-detail');
    else document.getElementById('modal-segment-detail')?.classList.add('show');
  }

  function renderPagination() {
    if (!window.TablePagination) return;
    const result = TablePagination.render('segment-pagination', {
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderTable();
        renderPagination();
      }
    });
    page = result.page;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.CustomerSegmentStore?.importFromDispatchRecords) {
      window.CustomerSegmentStore.importFromDispatchRecords();
    }
    filtered = [...getSegmentList()];

    document.getElementById('btn-query')?.addEventListener('click', applyFilters);
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.querySelectorAll('#segment-filter input, #segment-filter select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      filtered = [...getSegmentList()];
      page = 1;
      renderTable();
      renderPagination();
    });
    ['f-name', 'f-code'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyFilters();
      });
    });
    renderTable();
    renderPagination();
  });
})();
