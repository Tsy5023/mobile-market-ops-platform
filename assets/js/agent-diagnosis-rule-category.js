/** 策略诊断规则分类管理 */
(function () {
  const PAGE_SIZE = 10;
  let page = 1;
  let editingId = null;
  const Store = () => window.AgentRuleCategoryStore;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function statusBadge(s) {
    return s === 'enabled' ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-info">停用</span>';
  }

  function resolveCategoryCode(name, existingCode) {
    if (existingCode) return existingCode;
    const slug = String(name || '').trim().toLowerCase()
      .replace(/[^\w]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return slug || `cat_${Date.now().toString(36)}`;
  }

  function getFiltered() {
    const kw = (document.getElementById('filter-kw')?.value || '').trim().toLowerCase();
    const st = document.getElementById('filter-status')?.value || '';
    return Store().getAll().filter(r => {
      if (kw && !String(r.name || '').toLowerCase().includes(kw)) return false;
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
        <td class="agent-cell-ellipsis" title="${esc(r.description)}">${esc(r.description || '—')}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="agent-cell-muted">${esc(r.updatedBy)}</td>
        <td class="agent-cell-time">${esc(r.updatedAt)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-edit="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action ${en ? 'link-warn' : 'link-success'}" data-toggle="${esc(r.id)}">${en ? '停用' : '启用'}</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无分类</td></tr>';

    tbody.querySelectorAll('[data-edit]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openForm(a.dataset.edit); }));
    tbody.querySelectorAll('[data-toggle]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); Store().toggleStatus(a.dataset.toggle); renderList(); }));
    tbody.querySelectorAll('[data-del]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (confirm('确定删除该分类？')) { Store().remove(a.dataset.del); renderList(); } }));

    if (TablePagination) {
      const result = TablePagination.render('list-pagination', { total: list.length, page, pageSize: PAGE_SIZE, onPageChange: p => { page = p; renderList(); } });
      page = result.page;
    }
  }

  function openForm(id) {
    editingId = id || null;
    document.getElementById('form-title').textContent = id ? '编辑分类' : '新增分类';
    const row = id ? Store().getAll().find(x => x.id === id) : null;
    document.getElementById('form-id').value = row?.id || '';
    document.getElementById('f-name').value = row?.name || '';
    document.getElementById('f-desc').value = row?.description || '';
    if (typeof openModal === 'function') openModal('modal-form');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-create')?.addEventListener('click', () => openForm());
    document.getElementById('btn-search')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('rule-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      const existing = editingId ? Store().getAll().find(x => x.id === editingId) : null;
      const payload = {
        name,
        code: resolveCategoryCode(name, existing?.code),
        description: document.getElementById('f-desc').value.trim()
      };
      if (editingId) Store().update(editingId, payload);
      else Store().add(payload);
      if (typeof closeModal === 'function') closeModal('modal-form');
      renderList();
    });
    renderList();
  });
})();
