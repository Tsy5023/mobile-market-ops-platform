/** 策略预演规则 TAB */
window.initAgentRehearsalRuleTab = function (prefix) {
  const p = prefix || 'rh';
  const el = id => document.getElementById(`${p}-${id}`);
  const PAGE_SIZE = 10;
  let page = 1;
  let editingId = null;
  const Store = () => window.AgentRehearsalRuleStore;
  const FilterOpts = () => window.AgentRehearsalFilterOptions;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function statusBadge(s) {
    return s === 'enabled' ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-info">停用</span>';
  }

  function filtersSummary(row) {
    if (row.filters && row.filters.length) return FilterOpts()?.formatFiltersSummary(row.filters) || '—';
    return row.segmentRule || '—';
  }

  function renderFilterCheckboxes(selected) {
    const box = el('f-filters');
    if (!box) return;
    const ids = new Set(selected || []);
    const opts = FilterOpts()?.getAll() || [];
    box.innerHTML = opts.map(o => `
      <label class="sd-checkbox-item">
        <input type="checkbox" name="${p}-filters" value="${esc(o.id)}" ${ids.has(o.id) ? 'checked' : ''}/>
        <span>${esc(o.name)}</span>
      </label>`).join('');
  }

  function getSelectedFilters() {
    return Array.from(document.querySelectorAll(`#${p}-f-filters input[name="${p}-filters"]:checked`)).map(cb => cb.value);
  }

  function getFiltered() {
    const kw = (el('filter-kw')?.value || '').trim().toLowerCase();
    const st = el('filter-status')?.value || '';
    return Store().getAll().filter(r => {
      if (kw && !r.name.toLowerCase().includes(kw)) return false;
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
      const summary = filtersSummary(r);
      return `<tr>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td>${esc(r.name)}</td>
        <td class="agent-cell-ellipsis" title="${esc(r.description)}">${esc(r.description || '—')}</td>
        <td class="agent-cell-ellipsis" title="${esc(summary)}">${esc(summary)}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="agent-cell-time">${esc(r.updatedAt)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-edit="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action ${en ? 'link-warn' : 'link-success'}" data-toggle="${esc(r.id)}">${en ? '停用' : '启用'}</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无预演规则</td></tr>';

    tbody.querySelectorAll('[data-edit]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openForm(a.dataset.edit); }));
    tbody.querySelectorAll('[data-toggle]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); Store().toggleStatus(a.dataset.toggle); renderList(); }));
    tbody.querySelectorAll('[data-del]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (confirm('确定删除该预演规则？')) { Store().remove(a.dataset.del); renderList(); } }));

    if (window.TablePagination) {
      const result = TablePagination.render(`${p}-list-pagination`, {
        total: list.length, page, pageSize: PAGE_SIZE, onPageChange: np => { page = np; renderList(); }
      });
      page = result.page;
    }
  }

  function openForm(id) {
    editingId = id || null;
    const titleEl = el('form-title');
    if (titleEl) titleEl.textContent = id ? '编辑预演规则' : '新增预演规则';
    const row = id ? Store().getAll().find(x => x.id === id) : null;
    if (el('form-id')) el('form-id').value = row?.id || '';
    if (el('f-name')) el('f-name').value = row?.name || '';
    if (el('f-desc')) el('f-desc').value = row?.description || '';
    renderFilterCheckboxes(row?.filters || []);
    if (typeof openModal === 'function') openModal(`${p}-modal-form`);
  }

  renderFilterCheckboxes([]);
  el('btn-search')?.addEventListener('click', () => { page = 1; renderList(); });
  el('rule-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const filters = getSelectedFilters();
    if (!filters.length) { alert('请至少选择一项预演规则配置'); return; }
    const payload = {
      name: el('f-name').value.trim(),
      description: el('f-desc').value.trim(),
      filters
    };
    if (editingId) Store().update(editingId, payload);
    else Store().add(payload);
    if (typeof closeModal === 'function') closeModal(`${p}-modal-form`);
    renderList();
  });
  renderList();

  return { openForm, renderList };
};
