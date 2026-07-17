/** 客户标签管理 */
(function () {
  const PAGE_SIZE = 10;
  let filtered = [...window.CUSTOMER_LABEL_LIST];
  let page = 1;

  const DETAIL_FIELDS = [
    { key: 'name', label: '标签名称' },
    { key: 'tagId', label: '标签 id' },
    { key: 'bizCaliber', label: '业务口径', full: true, textarea: true },
    { key: 'expiryTime', label: '失效时间' },
    { key: 'updateCycle', label: '更新周期' },
    { key: 'isSensitive', label: '是否敏感' },
    { key: 'tagCategory', label: '标签分类' },
    { key: 'tagType', label: '标签类型' },
    { key: 'evalCategory', label: '评估分类' },
    { key: 'bizType', label: '业务类型' },
    { key: 'createdAt', label: '创建时间', full: true }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function sensitiveBadge(val) {
    if (val === '是') return '<span class="badge badge-warning">是</span>';
    return '<span class="badge badge-info">否</span>';
  }

  function getFilters() {
    return {
      tagId: (document.getElementById('f-tag-id')?.value || '').trim(),
      name: (document.getElementById('f-name')?.value || '').trim(),
      tagCategory: document.getElementById('f-category')?.value || '',
      tagType: document.getElementById('f-type')?.value || '',
      isSensitive: document.getElementById('f-sensitive')?.value || '',
      bizType: document.getElementById('f-biz-type')?.value || ''
    };
  }

  function applyFilters() {
    const f = getFilters();
    filtered = CUSTOMER_LABEL_LIST.filter(row => {
      if (f.tagId && !row.tagId.includes(f.tagId)) return false;
      if (f.name && !row.name.includes(f.name)) return false;
      if (f.tagCategory && row.tagCategory !== f.tagCategory) return false;
      if (f.tagType && row.tagType !== f.tagType) return false;
      if (f.isSensitive && row.isSensitive !== f.isSensitive) return false;
      if (f.bizType && row.bizType !== f.bizType) return false;
      return true;
    });
    page = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = document.getElementById('label-tbody');
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:40px">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(row => `
      <tr data-tag-id="${esc(row.tagId)}">
        <td><strong>${esc(row.name)}</strong></td>
        <td><code style="font-size:12px">${esc(row.tagId)}</code></td>
        <td>${esc(row.tagCategory)}</td>
        <td>${esc(row.tagType)}</td>
        <td>${sensitiveBadge(row.isSensitive)}</td>
        <td>${esc(row.updateCycle)}</td>
        <td>${esc(row.bizType)}</td>
        <td class="cell-actions"><a href="#" class="link-action" data-act="detail">详情</a></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-act="detail"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const tagId = a.closest('tr')?.dataset.tagId;
        const row = CUSTOMER_LABEL_LIST.find(r => r.tagId === tagId);
        if (row) showDetail(row);
      });
    });
  }

  function showDetail(row) {
    const body = document.getElementById('label-detail-body');
    if (!body) return;
    body.innerHTML = `
      <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
        ${DETAIL_FIELDS.map(f => {
          const val = row[f.key] ?? '—';
          const span = f.full ? ' style="grid-column:1/-1"' : '';
          if (f.textarea) {
            return `<div class="form-field"${span}><label>${esc(f.label)}</label><textarea readonly rows="2">${esc(val)}</textarea></div>`;
          }
          return `<div class="form-field"${span}><label>${esc(f.label)}</label><input readonly value="${esc(val)}"/></div>`;
        }).join('')}
      </div>`;
    if (typeof openModal === 'function') openModal('modal-label-detail');
    else document.getElementById('modal-label-detail')?.classList.add('show');
  }

  function renderPagination() {
    if (!window.TablePagination) return;
    const result = TablePagination.render('label-pagination', {
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
    document.getElementById('btn-query')?.addEventListener('click', applyFilters);
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.querySelectorAll('#label-filter input, #label-filter select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      filtered = [...CUSTOMER_LABEL_LIST];
      page = 1;
      renderTable();
      renderPagination();
    });
    ['f-name', 'f-tag-id'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyFilters();
      });
    });
    renderTable();
    renderPagination();
  });
})();
