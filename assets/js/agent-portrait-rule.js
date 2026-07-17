/** 策略客群多维分析规则 TAB */
window.initAgentPortraitRuleTab = function (prefix) {
  const p = prefix || 'pr';
  const el = id => document.getElementById(`${p}-${id}`);
  const PAGE_SIZE = 10;
  const MAX_DIM = 20;
  let page = 1;
  let editingId = null;
  let formTags = [];
  let pickerDraft = [];

  const Store = () => window.AgentPortraitRuleStore;
  const Catalog = () => window.AgentTagCatalog;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function statusBadge(s) {
    return s === 'enabled' ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-info">停用</span>';
  }
  function tagLabel(tag) { return Catalog()?.formatTagLabel(tag) || '—'; }
  function tagsSummary(tags) { return Catalog()?.formatTagsSummary(tags) || '—'; }
  function cloneTags(tags) { return (tags || []).map(t => ({ ...t })); }

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
      const dims = tagsSummary(r.tags || []);
      return `<tr>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td>${esc(r.name)}</td>
        <td class="agent-cell-ellipsis" title="${esc(r.description)}">${esc(r.description || '—')}</td>
        <td class="agent-cell-ellipsis" title="${esc(dims)}">${esc(dims)}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="agent-cell-time">${esc(r.updatedAt)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-edit="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action ${en ? 'link-warn' : 'link-success'}" data-toggle="${esc(r.id)}">${en ? '停用' : '启用'}</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无画像分析规则</td></tr>';

    tbody.querySelectorAll('[data-edit]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openForm(a.dataset.edit); }));
    tbody.querySelectorAll('[data-toggle]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); Store().toggleStatus(a.dataset.toggle); renderList(); }));
    tbody.querySelectorAll('[data-del]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (confirm('确定删除该分析规则？')) { Store().remove(a.dataset.del); renderList(); } }));

    if (window.TablePagination) {
      const result = TablePagination.render(`${p}-list-pagination`, {
        total: list.length, page, pageSize: PAGE_SIZE, onPageChange: np => { page = np; renderList(); }
      });
      page = result.page;
    }
  }

  function renderFormTags() {
    const placeholder = el('dim-picker-placeholder');
    const chips = el('dim-picker-chips');
    if (!chips || !placeholder) return;
    if (!formTags.length) {
      placeholder.style.display = '';
      chips.innerHTML = '';
      return;
    }
    placeholder.style.display = 'none';
    chips.innerHTML = formTags.map(t => `
      <span class="sd-dim-chip">${esc(tagLabel(t))}
        <button type="button" data-remove-tag="${esc(t.id)}" aria-label="移除">&times;</button>
      </span>`).join('');
    chips.querySelectorAll('[data-remove-tag]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        formTags = formTags.filter(x => x.id !== btn.dataset.removeTag);
        renderFormTags();
      });
    });
  }

  function openForm(id) {
    editingId = id || null;
    const titleEl = el('form-title');
    if (titleEl) titleEl.textContent = id ? '编辑分析规则' : '新增分析规则';
    const row = id ? Store().getAll().find(x => x.id === id) : null;
    if (el('form-id')) el('form-id').value = row?.id || '';
    if (el('f-name')) el('f-name').value = row?.name || '';
    if (el('f-desc')) el('f-desc').value = row?.description || '';
    formTags = cloneTags(row?.tags || []);
    renderFormTags();
    if (typeof openModal === 'function') openModal(`${p}-modal-form`);
  }

  function fillTypeFilter() {
    const sel = el('dim-filter-type');
    if (!sel) return;
    const types = Catalog()?.getTypes() || [];
    sel.innerHTML = '<option value="">全部类型</option>' + types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  }

  function getFilteredTags() {
    const kw = (el('dim-filter-kw')?.value || '').trim().toLowerCase();
    const type = el('dim-filter-type')?.value || '';
    return (Catalog()?.getAll() || []).filter(t => {
      const blob = (t.code + '-' + t.name + t.name).toLowerCase();
      if (kw && !blob.includes(kw)) return false;
      if (type && t.type !== type) return false;
      return true;
    });
  }

  function renderPickerSelected() {
    const box = el('dim-selected-box');
    if (!box) return;
    if (!pickerDraft.length) {
      box.classList.add('empty');
      box.innerHTML = '';
      return;
    }
    box.classList.remove('empty');
    box.innerHTML = pickerDraft.map(t => `
      <span class="sd-dim-chip">${esc(tagLabel(t))}
        <button type="button" data-pick-remove="${esc(t.id)}" aria-label="移除">&times;</button>
      </span>`).join('');
    box.querySelectorAll('[data-pick-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        pickerDraft = pickerDraft.filter(x => x.id !== btn.dataset.pickRemove);
        renderPickerSelected();
        renderPickerTable();
      });
    });
  }

  function renderPickerTable() {
    const tbody = el('dim-tbody');
    const checkAll = el('dim-check-all');
    if (!tbody) return;
    const list = getFilteredTags();
    const selectedIds = new Set(pickerDraft.map(t => t.id));
    tbody.innerHTML = list.map(t => `
      <tr>
        <td><input type="checkbox" class="dim-row-check" data-id="${esc(t.id)}" ${selectedIds.has(t.id) ? 'checked' : ''}/></td>
        <td>${esc(tagLabel(t))}</td>
        <td>${esc(t.type)}</td>
      </tr>`).join('') || '<tr><td colspan="3" class="muted" style="text-align:center;padding:20px">无匹配标签</td></tr>';

    tbody.querySelectorAll('.dim-row-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const tag = Catalog()?.getById(cb.dataset.id);
        if (!tag) return;
        if (cb.checked) {
          if (pickerDraft.length >= MAX_DIM) { cb.checked = false; alert('最多可选 20 个维度'); return; }
          if (!pickerDraft.some(x => x.id === tag.id)) pickerDraft.push({ ...tag });
        } else {
          pickerDraft = pickerDraft.filter(x => x.id !== tag.id);
        }
        renderPickerSelected();
        syncCheckAll();
      });
    });

    if (checkAll) {
      const visibleIds = list.map(t => t.id);
      checkAll.checked = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
      checkAll.indeterminate = !checkAll.checked && visibleIds.some(id => selectedIds.has(id));
    }
  }

  function syncCheckAll() {
    const checkAll = el('dim-check-all');
    if (!checkAll) return;
    const list = getFilteredTags();
    const selectedIds = new Set(pickerDraft.map(t => t.id));
    const visibleIds = list.map(t => t.id);
    checkAll.checked = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    checkAll.indeterminate = !checkAll.checked && visibleIds.some(id => selectedIds.has(id));
  }

  function openDimPicker() {
    pickerDraft = cloneTags(formTags);
    if (el('dim-filter-kw')) el('dim-filter-kw').value = '';
    if (el('dim-filter-type')) el('dim-filter-type').value = '';
    renderPickerSelected();
    renderPickerTable();
    if (typeof openModal === 'function') openModal(`${p}-modal-dim-picker`);
  }

  fillTypeFilter();
  el('btn-search')?.addEventListener('click', () => { page = 1; renderList(); });
  el('dim-picker-trigger')?.addEventListener('click', openDimPicker);
  el('dim-picker-trigger')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDimPicker(); }
  });
  el('dim-btn-search')?.addEventListener('click', renderPickerTable);
  el('dim-clear-all')?.addEventListener('click', e => {
    e.preventDefault();
    pickerDraft = [];
    renderPickerSelected();
    renderPickerTable();
  });
  el('dim-check-all')?.addEventListener('change', e => {
    const list = getFilteredTags();
    if (e.target.checked) {
      list.forEach(t => {
        if (pickerDraft.length >= MAX_DIM) return;
        if (!pickerDraft.some(x => x.id === t.id)) pickerDraft.push({ ...t });
      });
      if (pickerDraft.length >= MAX_DIM && list.length > MAX_DIM) alert('最多可选 20 个维度');
    } else {
      const visible = new Set(list.map(t => t.id));
      pickerDraft = pickerDraft.filter(t => !visible.has(t.id));
    }
    renderPickerSelected();
    renderPickerTable();
  });
  el('dim-btn-confirm')?.addEventListener('click', () => {
    formTags = cloneTags(pickerDraft);
    renderFormTags();
    if (typeof closeModal === 'function') closeModal(`${p}-modal-dim-picker`);
  });
  el('rule-form')?.addEventListener('submit', e => {
    e.preventDefault();
    if (!formTags.length) { alert('请至少选择一个分析维度'); return; }
    const payload = {
      name: el('f-name').value.trim(),
      description: el('f-desc').value.trim(),
      tags: cloneTags(formTags)
    };
    if (editingId) Store().update(editingId, payload);
    else Store().add(payload);
    if (typeof closeModal === 'function') closeModal(`${p}-modal-form`);
    renderList();
  });
  renderList();

  return { openForm, renderList };
};
