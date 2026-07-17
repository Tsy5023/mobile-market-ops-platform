/** 策略审核规则管理 */
(function () {
  const PAGE_SIZE = 10;
  let page = 1;
  let editingId = null;
  const Store = () => window.AgentAuditRuleStore;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function statusBadge(s) {
    return s === 'enabled' ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-info">停用</span>';
  }
  function catName(id) {
    const c = window.AgentAuditRuleCategoryStore?.getAll().find(x => x.id === id);
    return c ? c.name : '—';
  }

  function fillSelects() {
    const cats = window.AgentAuditRuleCategoryStore?.getAll() || [];
    const catOpts = cats.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const filterCat = document.getElementById('filter-cat');
    const fCat = document.getElementById('f-cat');
    if (filterCat) filterCat.innerHTML = '<option value="">全部分类</option>' + catOpts;
    if (fCat) fCat.innerHTML = catOpts;
    const fieldOpts = (window.AUDIT_FIELD_OPTIONS || window.STRATEGY_FIELD_OPTIONS || []).map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
    const ff = document.getElementById('filter-field');
    const fField = document.getElementById('f-field');
    if (ff) ff.innerHTML = '<option value="">全部字段</option>' + fieldOpts;
    if (fField) fField.innerHTML = fieldOpts;
  }

  function getFiltered() {
    const kw = (document.getElementById('filter-kw')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('filter-cat')?.value || '';
    const field = document.getElementById('filter-field')?.value || '';
    const st = document.getElementById('filter-status')?.value || '';
    return Store().getAll().filter(r => {
      if (kw && !r.name.toLowerCase().includes(kw)) return false;
      if (cat && r.categoryId !== cat) return false;
      if (field && r.field !== field) return false;
      if (st && r.status !== st) return false;
      return true;
    });
  }

  function renderList() {
    const tbody = document.getElementById('list-tbody');
    const list = getFiltered();
    document.getElementById('list-count').textContent = `共 ${list.length} 条`;
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    tbody.innerHTML = rows.map(r => {
      const en = r.status === 'enabled';
      return `<tr>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td>${esc(r.name)}</td>
        <td>${esc(catName(r.categoryId))}</td>
        <td>${esc(window.getAuditFieldLabel?.(r.field) || r.field)}</td>
        <td class="agent-cell-ellipsis" title="${esc(r.detail)}">${esc(r.detail)}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="agent-cell-time">${esc(r.updatedAt)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-edit="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action ${en ? 'link-warn' : 'link-success'}" data-toggle="${esc(r.id)}">${en ? '停用' : '启用'}</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无审核规则</td></tr>';

    tbody.querySelectorAll('[data-edit]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openForm(a.dataset.edit); }));
    tbody.querySelectorAll('[data-toggle]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); Store().toggleStatus(a.dataset.toggle); renderList(); }));
    tbody.querySelectorAll('[data-del]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (confirm('确定删除该规则？')) { Store().remove(a.dataset.del); renderList(); } }));

    if (TablePagination) {
      const result = TablePagination.render('list-pagination', { total: list.length, page, pageSize: PAGE_SIZE, onPageChange: p => { page = p; renderList(); } });
      page = result.page;
    }
  }

  function openForm(id) {
    editingId = id || null;
    fillSelects();
    document.getElementById('form-title').textContent = id ? '编辑规则' : '新增规则';
    const row = id ? Store().getAll().find(x => x.id === id) : null;
    document.getElementById('form-id').value = row?.id || '';
    document.getElementById('f-name').value = row?.name || '';
    document.getElementById('f-cat').value = row?.categoryId || '';
    document.getElementById('f-field').value = row?.field || '';
    document.getElementById('f-detail').value = row?.detail || '';
    if (typeof openModal === 'function') openModal('modal-form');
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillSelects();
    document.getElementById('btn-create')?.addEventListener('click', () => openForm());
    document.getElementById('btn-search')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('rule-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('f-name').value.trim(),
        categoryId: document.getElementById('f-cat').value,
        field: document.getElementById('f-field').value,
        detail: document.getElementById('f-detail').value.trim()
      };
      if (editingId) Store().update(editingId, payload);
      else Store().add(payload);
      if (typeof closeModal === 'function') closeModal('modal-form');
      renderList();
    });
    renderList();
  });
})();
