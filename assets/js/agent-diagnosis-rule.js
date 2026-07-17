/** 策略诊断规则 TAB */
window.initAgentDiagnosisRuleTab = function (prefix) {
  const p = prefix || 'dr';
  const el = id => document.getElementById(`${p}-${id}`);
  const PAGE_SIZE = 10;
  let page = 1;
  let editingId = null;
  const Store = () => window.AgentDiagnosisRuleStore;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function statusBadge(s) {
    return s === 'enabled' ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-info">停用</span>';
  }
  function catName(id) {
    const c = window.AgentRuleCategoryStore?.getAll().find(x => x.id === id);
    return c ? c.name : '—';
  }

  function fillSelects() {
    const cats = window.AgentRuleCategoryStore?.getAll() || [];
    const catOpts = cats.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const filterCat = el('filter-cat');
    const fCat = el('f-cat');
    if (filterCat) filterCat.innerHTML = '<option value="">全部分类</option>' + catOpts;
    if (fCat) fCat.innerHTML = catOpts;
    const fieldOpts = (window.STRATEGY_FIELD_OPTIONS || []).map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
    const ff = el('filter-field');
    const fField = el('f-field');
    if (ff) ff.innerHTML = '<option value="">全部字段</option>' + fieldOpts;
    if (fField) fField.innerHTML = fieldOpts;
  }

  function getFiltered() {
    const kw = (el('filter-kw')?.value || '').trim().toLowerCase();
    const cat = el('filter-cat')?.value || '';
    const field = el('filter-field')?.value || '';
    const st = el('filter-status')?.value || '';
    return Store().getAll().filter(r => {
      if (kw && !r.name.toLowerCase().includes(kw)) return false;
      if (cat && r.categoryId !== cat) return false;
      if (field && r.field !== field) return false;
      if (st && r.status !== st) return false;
      return true;
    });
  }

  function renderList() {
    const tbody = el('list-tbody');
    if (!tbody) return;
    const list = getFiltered();
    const countEl = el('list-count');
    if (countEl) countEl.textContent = `共 ${list.length} 条`;
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    tbody.innerHTML = rows.map(r => {
      const en = r.status === 'enabled';
      return `<tr>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td>${esc(r.name)}</td>
        <td>${esc(catName(r.categoryId))}</td>
        <td>${esc(window.getStrategyFieldLabel(r.field))}</td>
        <td class="agent-cell-ellipsis" title="${esc(r.detail)}">${esc(r.detail)}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="agent-cell-time">${esc(r.updatedAt)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-edit="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action ${en ? 'link-warn' : 'link-success'}" data-toggle="${esc(r.id)}">${en ? '停用' : '启用'}</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无诊断规则</td></tr>';

    tbody.querySelectorAll('[data-edit]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openForm(a.dataset.edit); }));
    tbody.querySelectorAll('[data-toggle]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); Store().toggleStatus(a.dataset.toggle); renderList(); }));
    tbody.querySelectorAll('[data-del]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (confirm('确定删除该规则？')) { Store().remove(a.dataset.del); renderList(); } }));

    if (window.TablePagination) {
      const result = TablePagination.render(`${p}-list-pagination`, {
        total: list.length, page, pageSize: PAGE_SIZE, onPageChange: np => { page = np; renderList(); }
      });
      page = result.page;
    }
  }

  function openForm(id) {
    editingId = id || null;
    fillSelects();
    const titleEl = el('form-title');
    if (titleEl) titleEl.textContent = id ? '编辑规则' : '新增规则';
    const row = id ? Store().getAll().find(x => x.id === id) : null;
    if (el('form-id')) el('form-id').value = row?.id || '';
    if (el('f-name')) el('f-name').value = row?.name || '';
    if (el('f-cat')) el('f-cat').value = row?.categoryId || '';
    if (el('f-field')) el('f-field').value = row?.field || '';
    if (el('f-detail')) el('f-detail').value = row?.detail || '';
    if (typeof openModal === 'function') openModal(`${p}-modal-form`);
  }

  fillSelects();
  el('btn-search')?.addEventListener('click', () => { page = 1; renderList(); });
  el('rule-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const payload = {
      name: el('f-name').value.trim(),
      categoryId: el('f-cat').value,
      field: el('f-field').value,
      detail: el('f-detail').value.trim()
    };
    if (editingId) Store().update(editingId, payload);
    else Store().add(payload);
    if (typeof closeModal === 'function') closeModal(`${p}-modal-form`);
    renderList();
  });
  renderList();

  return { openForm, renderList };
};
