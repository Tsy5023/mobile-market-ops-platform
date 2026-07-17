/** 指标看管人 - 组织选择 + 指标库多选 */
(function () {
  const PAGE_SIZE = 10;
  let list = [...window.INDICATOR_CARETAKER_LIST];
  let filtered = [...list];
  let page = 1;
  let modalMode = 'add';
  let editingId = null;
  let selectedMetrics = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function objTypeLabel(t) {
    return t === 'dept' ? '部门' : '人员';
  }

  function objTypeBadge(t) {
    const cls = t === 'dept' ? 'badge-obj-dept' : 'badge-obj-person';
    return `<span class="badge ${cls}">${objTypeLabel(t)}</span>`;
  }

  function getFilters() {
    return {
      objType: document.getElementById('f-obj-type')?.value || '',
      obj: (document.getElementById('f-obj')?.value || '').trim(),
      metric: (document.getElementById('f-metric')?.value || '').trim()
    };
  }

  function rowObjectText(row) {
    return typeof resolveCaretakerObjectLabel === 'function'
      ? resolveCaretakerObjectLabel(row)
      : row.objectName || '—';
  }

  function rowMetricsText(row) {
    return typeof formatCaretakerMetrics === 'function'
      ? formatCaretakerMetrics(row)
      : '—';
  }

  function applyFilters() {
    const f = getFilters();
    filtered = list.filter(row => {
      if (f.objType && row.objectType !== f.objType) return false;
      if (f.obj && !rowObjectText(row).includes(f.obj)) return false;
      if (f.metric) {
        const mt = rowMetricsText(row);
        const codes = (row.metrics || []).map(m => m.code).join(' ');
        if (!mt.includes(f.metric) && !codes.includes(f.metric)) return false;
      }
      return true;
    });
    page = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = document.getElementById('caretaker-tbody');
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:40px">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((row, i) => `
      <tr data-id="${esc(row.id)}">
        <td>${start + i + 1}</td>
        <td>${objTypeBadge(row.objectType)}</td>
        <td><strong>${esc(rowObjectText(row))}</strong></td>
        <td class="cell-ellipsis" title="${esc(rowMetricsText(row))}">${esc(rowMetricsText(row))}</td>
        <td style="white-space:nowrap">${esc(row.createdAt)}</td>
        <td>${esc(row.creator)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-act="detail">详情</a>
          <a href="#" class="link-action" data-act="edit">修改</a>
          <a href="#" class="link-action" data-act="delete">删除</a>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-act]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const id = a.closest('tr')?.dataset.id;
        const row = list.find(r => r.id === id);
        if (!row) return;
        if (a.dataset.act === 'detail') openCaretakerModal('detail', row);
        else if (a.dataset.act === 'edit') openCaretakerModal('edit', row);
        else if (a.dataset.act === 'delete') deleteRow(row);
      });
    });
  }

  function renderPagination() {
    if (!window.TablePagination) return;
    const result = TablePagination.render('caretaker-pagination', {
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

  function resolveDeptLabel(unitId, deptId) {
    const unit = (window.JX_ORG_SYSTEM?.units || []).find(u => u.id === unitId);
    const dept = unit?.depts?.find(d => d.id === deptId);
    return typeof deptDisplayName === 'function'
      ? deptDisplayName(unit, dept)
      : (unit && dept ? `${unit.name} · ${dept.name}` : '');
  }

  function renderDeptTree() {
    const tree = document.getElementById('fm-dept-tree');
    if (!tree) return;
    const units = window.JX_ORG_SYSTEM?.units || [];
    tree.innerHTML = units.map(unit => `
      <div class="org-tree-unit" data-unit-id="${esc(unit.id)}">
        <button type="button" class="org-tree-unit-head" aria-expanded="true">
          <i class="fas fa-chevron-down org-tree-expand-icon"></i>
          <i class="fas fa-building org-tree-unit-icon"></i>
          <span>${esc(unit.name)}</span>
        </button>
        <div class="org-tree-unit-body">
          ${(unit.depts || []).map(dept => `
            <button type="button" class="org-tree-dept-node"
              data-unit-id="${esc(unit.id)}"
              data-dept-id="${esc(dept.id)}"
              data-label="${esc(unit.name + ' · ' + dept.name)}">
              <i class="fas fa-sitemap org-tree-dept-icon"></i>
              <span>${esc(dept.name)}</span>
            </button>`).join('')}
        </div>
      </div>`).join('');

    tree.querySelectorAll('.org-tree-unit-head').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const unit = btn.closest('.org-tree-unit');
        const body = unit?.querySelector('.org-tree-unit-body');
        const expanded = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        unit?.classList.toggle('is-collapsed', !expanded);
        if (body) body.hidden = !expanded;
        const icon = btn.querySelector('.org-tree-expand-icon');
        if (icon) icon.className = `fas ${expanded ? 'fa-chevron-down' : 'fa-chevron-right'} org-tree-expand-icon`;
      });
    });

    tree.querySelectorAll('.org-tree-dept-node').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        setDeptSelection(btn.dataset.unitId, btn.dataset.deptId, btn.dataset.label);
        closeDeptPanel();
      });
    });
  }

  function setDeptSelection(unitId, deptId, label) {
    const unitInput = document.getElementById('fm-unit-id');
    const deptInput = document.getElementById('fm-dept-id');
    const labelEl = document.getElementById('fm-dept-label');
    if (unitInput) unitInput.value = unitId || '';
    if (deptInput) deptInput.value = deptId || '';
    if (labelEl) {
      labelEl.textContent = label || resolveDeptLabel(unitId, deptId) || '请选择所属部门';
      labelEl.classList.toggle('muted', !unitId || !deptId);
    }
    document.querySelectorAll('.org-tree-dept-node').forEach(node => {
      node.classList.toggle('is-selected',
        node.dataset.unitId === unitId && node.dataset.deptId === deptId);
    });
    fillPersonOptions(unitId, deptId);
  }

  function clearDeptSelection() {
    setDeptSelection('', '', '请选择所属部门');
    const labelEl = document.getElementById('fm-dept-label');
    if (labelEl) labelEl.classList.add('muted');
  }

  function openDeptPanel() {
    const panel = document.getElementById('fm-dept-panel');
    const trigger = document.getElementById('fm-dept-trigger');
    if (!panel || trigger?.disabled) return;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }

  function closeDeptPanel() {
    const panel = document.getElementById('fm-dept-panel');
    const trigger = document.getElementById('fm-dept-trigger');
    if (panel) panel.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
  }

  function toggleDeptPanel() {
    const panel = document.getElementById('fm-dept-panel');
    if (panel?.hidden) openDeptPanel();
    else closeDeptPanel();
  }

  function bindDeptTreeSelect() {
    renderDeptTree();
    document.getElementById('fm-dept-trigger')?.addEventListener('click', e => {
      e.stopPropagation();
      toggleDeptPanel();
    });
    document.addEventListener('click', e => {
      const wrap = document.getElementById('fm-dept-tree-select');
      if (wrap && !wrap.contains(e.target)) closeDeptPanel();
    });
  }

  function fillPersonOptions(unitId, deptId, personId) {
    const sel = document.getElementById('fm-person');
    if (!sel) return;
    sel.innerHTML = '<option value="">请选择人员</option>';
    if (!unitId || !deptId) {
      sel.disabled = true;
      return;
    }
    const persons = (window.JX_ORG_SYSTEM?.persons || []).filter(
      p => p.unitId === unitId && p.deptId === deptId
    );
    sel.disabled = persons.length === 0;
    persons.forEach(p => {
      sel.innerHTML += `<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.role)}</option>`;
    });
    if (personId) sel.value = personId;
  }

  function togglePersonField() {
    const type = document.getElementById('fm-obj-type')?.value;
    const wrap = document.querySelector('.field-fm-person');
    if (wrap) wrap.style.display = type === 'person' ? '' : 'none';
  }

  function renderMetricChips() {
    const el = document.getElementById('fm-metric-chips');
    if (!el) return;
    if (!selectedMetrics.length) {
      el.innerHTML = '<span class="muted">请点击下方按钮从指标库选择</span>';
      return;
    }
    el.innerHTML = selectedMetrics.map(m =>
      `<span class="metric-pick-chip">${esc(m.name)} <code>${esc(m.code)}</code></span>`
    ).join('');
  }

  function renderMetricPickList(keyword) {
    const wrap = document.getElementById('metric-pick-list');
    if (!wrap) return;
    const kw = (keyword || '').trim().toLowerCase();
    const lib = typeof getIndicatorMetricLibrary === 'function' ? getIndicatorMetricLibrary() : [];
    const items = lib.filter(m =>
      !kw || m.code.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw)
    );
    wrap.innerHTML = items.map(m => {
      const checked = selectedMetrics.some(s => s.code === m.code);
      return `
        <label class="metric-pick-item">
          <input type="checkbox" value="${esc(m.code)}" ${checked ? 'checked' : ''}/>
          <span class="metric-pick-item-meta">
            <strong>${esc(m.name)}</strong>
            <code>${esc(m.code)}</code>
            <span class="muted">${esc(m.scene)}</span>
          </span>
        </label>`;
    }).join('') || '<p class="muted" style="padding:12px">无匹配指标</p>';
  }

  function syncOrgFromRow(row) {
    if (!row) return;
    setDeptSelection(row.unitId, row.deptId, resolveDeptLabel(row.unitId, row.deptId));
    if (row.objectType === 'person') {
      fillPersonOptions(row.unitId, row.deptId, row.personId);
    }
    togglePersonField();
  }

  function openCaretakerModal(mode, row) {
    modalMode = mode;
    editingId = row?.id || null;
    const readonly = mode === 'detail';
    document.getElementById('caretaker-modal-title').textContent =
      mode === 'add' ? '新建指标看管人' : mode === 'edit' ? '修改指标看管人' : '看管人详情';
    document.getElementById('caretaker-modal-foot').style.display = readonly ? 'none' : 'flex';
    document.getElementById('caretaker-form-wrap')?.classList.toggle('modal-detail-readonly', readonly);

    closeDeptPanel();
    selectedMetrics = row?.metrics ? row.metrics.map(m => ({ ...m })) : [];
    renderMetricChips();

    if (row) {
      document.getElementById('fm-obj-type').value = row.objectType;
      syncOrgFromRow(row);
    } else {
      document.getElementById('fm-obj-type').value = 'person';
      clearDeptSelection();
      fillPersonOptions('', '');
      togglePersonField();
    }

    const ids = ['fm-obj-type', 'fm-dept-trigger', 'fm-person', 'btn-pick-metrics'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = readonly;
    });

    togglePersonField();
    if (typeof openModal === 'function') openModal('modal-caretaker');
  }

  function deleteRow(row) {
    if (!confirm(`确认删除看管配置：${rowObjectText(row)}？`)) return;
    list = list.filter(r => r.id !== row.id);
    applyFilters();
  }

  function collectFormData() {
    const objectType = document.getElementById('fm-obj-type')?.value;
    const unitId = document.getElementById('fm-unit-id')?.value;
    const deptId = document.getElementById('fm-dept-id')?.value;
    if (!unitId || !deptId || !selectedMetrics.length) return null;

    if (objectType === 'person') {
      const personId = document.getElementById('fm-person')?.value;
      if (!personId) return null;
      return { objectType, unitId, deptId, personId, metrics: selectedMetrics.map(m => ({ ...m })) };
    }
    return { objectType, unitId, deptId, metrics: selectedMetrics.map(m => ({ ...m })) };
  }

  function saveCaretaker() {
    const data = collectFormData();
    if (!data) {
      alert('请完整选择所属部门、看管人员（如适用），并至少选择一个看管指标');
      return;
    }
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    if (modalMode === 'edit' && editingId) {
      const row = list.find(r => r.id === editingId);
      if (row) Object.assign(row, data, { createdAt: row.createdAt, creator: row.creator });
    } else {
      list.unshift({
        id: 'ic-' + Date.now(),
        ...data,
        createdAt: now,
        creator: '李敏'
      });
    }
    applyFilters();
    document.querySelector('[data-close-modal="modal-caretaker"]')?.click();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-query')?.addEventListener('click', applyFilters);
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.querySelectorAll('#caretaker-filter input, #caretaker-filter select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      filtered = [...list];
      page = 1;
      renderTable();
      renderPagination();
    });
    document.getElementById('btn-add')?.addEventListener('click', () => openCaretakerModal('add'));
    document.getElementById('btn-caretaker-save')?.addEventListener('click', saveCaretaker);

    bindDeptTreeSelect();

    document.getElementById('fm-obj-type')?.addEventListener('change', () => {
      togglePersonField();
      fillPersonOptions(
        document.getElementById('fm-unit-id')?.value,
        document.getElementById('fm-dept-id')?.value
      );
    });

    document.getElementById('btn-pick-metrics')?.addEventListener('click', () => {
      renderMetricPickList(document.getElementById('metric-pick-search')?.value);
      if (typeof openModal === 'function') openModal('modal-metric-pick');
    });
    document.getElementById('metric-pick-search')?.addEventListener('input', e => {
      renderMetricPickList(e.target.value);
    });
    document.getElementById('btn-metric-pick-ok')?.addEventListener('click', () => {
      const lib = typeof getIndicatorMetricLibrary === 'function' ? getIndicatorMetricLibrary() : [];
      const codes = [];
      document.querySelectorAll('#metric-pick-list input:checked').forEach(inp => codes.push(inp.value));
      selectedMetrics = codes.map(code => {
        const m = lib.find(x => x.code === code);
        return m ? { code: m.code, name: m.name } : { code, name: code };
      });
      renderMetricChips();
      document.querySelector('[data-close-modal="modal-metric-pick"]')?.click();
    });

    ['f-obj', 'f-metric'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyFilters();
      });
    });

    renderTable();
    renderPagination();
  });
})();
