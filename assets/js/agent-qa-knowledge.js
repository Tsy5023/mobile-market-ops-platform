/** 知识问答管理 */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let page = 1;
  let editingId = null;
  let pendingDeleteId = null;
  let pendingDisableId = null;
  let pendingImportFile = null;
  let detailViewId = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function statusBadge(status) {
    return status === 'enabled'
      ? '<span class="badge badge-success">启用</span>'
      : '<span class="badge badge-info">停用</span>';
  }

  function fillCategorySelects() {
    const opts = '<option value="">全部分类</option>' +
      AgentAssistantData.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    const filter = document.getElementById('qa-filter-cat');
    const form = document.getElementById('qa-form-category');
    if (filter) filter.innerHTML = opts;
    if (form) {
      form.innerHTML = AgentAssistantData.categories.map(c =>
        `<option value="${esc(c)}">${esc(c)}</option>`
      ).join('');
    }
  }

  function getFiltered() {
    const kw = (document.getElementById('qa-filter-kw')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('qa-filter-cat')?.value || '';
    const st = document.getElementById('qa-filter-status')?.value || '';
    return AgentQaStore.getAll().filter(r => {
      const blob = (r.id + r.question + r.answer).toLowerCase();
      if (kw && !blob.includes(kw)) return false;
      if (cat && r.category !== cat) return false;
      if (st && r.status !== st) return false;
      return true;
    });
  }

  function renderList() {
    const tbody = document.getElementById('qa-tbody');
    const countEl = document.getElementById('qa-count');
    if (!tbody) return;
    const list = getFiltered();
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    if (countEl) countEl.textContent = `共 ${list.length} 条`;

    tbody.innerHTML = rows.map(r => {
      const enabled = r.status === 'enabled';
      const toggleLabel = enabled ? '停用' : '启用';
      return `
      <tr>
        <td><span class="agent-id-code">${esc(r.id)}</span></td>
        <td class="agent-cell-ellipsis" title="${esc(r.question)}">${esc(r.question)}</td>
        <td class="agent-cell-ellipsis agent-cell-ellipsis-wide" title="${esc(r.answer)}">${esc(r.answer)}</td>
        <td>${esc(r.category)}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="agent-cell-muted">${esc(r.updatedBy || '—')}</td>
        <td class="agent-cell-time">${esc(r.updatedAt)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-view="${esc(r.id)}">查看</a>
          <a href="#" class="link-action" data-edit="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action ${enabled ? 'link-warn' : 'link-success'}" data-toggle="${esc(r.id)}">${toggleLabel}</a>
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无问答配置</td></tr>';

    tbody.querySelectorAll('[data-view]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); showDetail(a.dataset.view); });
    });
    tbody.querySelectorAll('[data-edit]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openForm(a.dataset.edit); });
    });
    tbody.querySelectorAll('[data-toggle]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); toggleStatus(a.dataset.toggle); });
    });
    tbody.querySelectorAll('[data-del]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openDeleteConfirm(a.dataset.del); });
    });

    if (window.TablePagination) {
      const result = TablePagination.render('qa-pagination', {
        total: list.length,
        page,
        pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
  }

  function renderDetailBody(r) {
    return `
      <div class="agent-form-vertical agent-form-readonly">
        <div class="form-field">
          <label>问答ID</label>
          <div class="readonly-value"><span class="agent-id-code">${esc(r.id)}</span></div>
        </div>
        <div class="form-field">
          <label>状态</label>
          <div class="readonly-value">${statusBadge(r.status)}</div>
        </div>
        <div class="form-field">
          <label>分类</label>
          <div class="readonly-value">${esc(r.category)}</div>
        </div>
        <div class="form-field">
          <label>问题</label>
          <div class="readonly-value">${esc(r.question)}</div>
        </div>
        <div class="form-field">
          <label>答案</label>
          <div class="readonly-value pre-wrap">${esc(r.answer)}</div>
        </div>
        <div class="form-field">
          <label>更新人</label>
          <div class="readonly-value">${esc(r.updatedBy || '—')}</div>
        </div>
        <div class="form-field">
          <label>更新时间</label>
          <div class="readonly-value">${esc(r.updatedAt)}</div>
        </div>
      </div>`;
  }

  function showDetail(id) {
    const r = AgentQaStore.getById(id);
    if (!r) return;
    detailViewId = id;
    document.getElementById('qa-detail-title').textContent = '问答详情';
    document.getElementById('qa-detail-sub').textContent = r.id + ' · ' + r.category;
    document.getElementById('qa-detail-body').innerHTML = renderDetailBody(r);
    if (typeof openModal === 'function') openModal('modal-qa-detail');
  }

  function openForm(id) {
    editingId = id || null;
    const form = document.getElementById('qa-form');
    const titleEl = document.getElementById('qa-form-title');
    const subEl = document.getElementById('qa-form-sub');

    if (id) {
      const r = AgentQaStore.getById(id);
      if (!r) return;
      titleEl.textContent = '编辑问答';
      subEl.textContent = '修改问答ID ' + r.id + ' 的内容';
      form.question.value = r.question;
      form.answer.value = r.answer;
      form.category.value = r.category;
      form.status.value = r.status;
      document.getElementById('qa-form-id').value = r.id;
    } else {
      titleEl.textContent = '新增问答';
      subEl.textContent = '填写用户常见问题与标准答案，保存后知识助手即可命中';
      form.reset();
      form.status.value = 'enabled';
      document.getElementById('qa-form-id').value = '';
    }

    if (typeof closeModal === 'function') closeModal('modal-qa-detail');
    if (typeof openModal === 'function') openModal('modal-qa-form');
  }

  function toggleStatus(id, skipConfirm) {
    const r = AgentQaStore.getById(id);
    if (!r) return;
    if (r.status === 'enabled' && !skipConfirm) {
      openDisableConfirm(id);
      return;
    }
    AgentQaStore.toggleStatus(id);
    renderList();
    if (detailViewId === id) {
      const updated = AgentQaStore.getById(id);
      if (updated) {
        document.getElementById('qa-detail-body').innerHTML = renderDetailBody(updated);
      }
    }
  }

  function openDisableConfirm(id) {
    const r = AgentQaStore.getById(id);
    if (!r || r.status !== 'enabled') return;
    pendingDisableId = id;
    document.getElementById('qa-disable-preview').innerHTML = `
      <div class="qa-disable-id"><span class="agent-id-code">${esc(r.id)}</span> ${statusBadge(r.status)}</div>
      <p class="qa-disable-q"><strong>问：</strong>${esc(r.question)}</p>
      <p class="qa-disable-a"><strong>答：</strong>${esc(r.answer)}</p>`;
    if (typeof openModal === 'function') openModal('modal-qa-disable');
  }

  function confirmDisable() {
    if (!pendingDisableId) return;
    const id = pendingDisableId;
    pendingDisableId = null;
    if (typeof closeModal === 'function') closeModal('modal-qa-disable');
    toggleStatus(id, true);
  }

  function openDeleteConfirm(id) {
    const r = AgentQaStore.getById(id);
    if (!r) return;
    pendingDeleteId = id;
    document.getElementById('qa-delete-preview').innerHTML = `
      <div class="qa-delete-id"><span class="agent-id-code">${esc(r.id)}</span> ${statusBadge(r.status)}</div>
      <p class="qa-delete-q"><strong>问：</strong>${esc(r.question)}</p>
      <p class="qa-delete-a"><strong>答：</strong>${esc(r.answer)}</p>`;
    if (typeof openModal === 'function') openModal('modal-qa-delete');
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const deletedId = pendingDeleteId;
    AgentQaStore.remove(deletedId);
    pendingDeleteId = null;
    if (typeof closeModal === 'function') closeModal('modal-qa-delete');
    if (detailViewId === deletedId) {
      detailViewId = null;
      if (typeof closeModal === 'function') closeModal('modal-qa-detail');
    }
    renderList();
  }

  function exportCsv() {
    const rows = AgentQaStore.getAll();
    const header = '问答ID,问题,答案,分类,状态';
    const lines = rows.map(r =>
      [r.id, r.question, r.answer, r.category, r.status === 'enabled' ? '启用' : '停用']
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob(['\ufeff' + header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '知识问答配置_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  }

  function downloadImportTemplate() {
    const header = '问答ID,问题,答案,分类,状态';
    const sample = ',流量收入指标的业务口径是什么？,流量收入指统计周期内用户套餐及增值业务产生的收入总和，不含一次性终端补贴。,指标口径,启用';
    const blob = new Blob(['\ufeff' + header + '\n' + sample + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '知识问答导入模板.csv';
    a.click();
  }

  function setImportFile(file) {
    pendingImportFile = file || null;
    const nameEl = document.getElementById('qa-import-file-name');
    const confirmBtn = document.getElementById('btn-qa-import-confirm');
    const dropzone = document.getElementById('qa-import-dropzone');
    if (nameEl) {
      nameEl.textContent = file ? `已选择：${file.name}` : '';
    }
    if (confirmBtn) confirmBtn.disabled = !file;
    if (dropzone) dropzone.classList.toggle('has-file', !!file);
  }

  function openImportModal() {
    setImportFile(null);
    const input = document.getElementById('qa-import-file');
    if (input) input.value = '';
    if (typeof openModal === 'function') openModal('modal-qa-import');
  }

  function processImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importCsv(reader.result);
      setImportFile(null);
      const input = document.getElementById('qa-import-file');
      if (input) input.value = '';
      if (typeof closeModal === 'function') closeModal('modal-qa-import');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function importCsv(text) {
    const lines = text.trim().split(/\r?\n/).slice(1);
    const rows = lines.map(line => {
      const parts = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
      const cols = parts.map(p => p.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
      const hasId = cols.length >= 5;
      return {
        question: hasId ? cols[1] : cols[0],
        answer: hasId ? cols[2] : cols[1],
        category: hasId ? cols[3] : cols[2],
        status: (hasId ? cols[4] : cols[3]) === '停用' ? 'disabled' : 'enabled',
        updatedBy: '批量导入'
      };
    }).filter(r => r.question && r.answer);
    AgentQaStore.importRows(rows);
    page = 1;
    renderList();
    alert(`成功导入 ${rows.length} 条问答`);
  }

  function handleImportFileSelect(file) {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'txt'].includes(ext)) {
      alert('请选择 .csv 或 .txt 格式的文件');
      return;
    }
    setImportFile(file);
  }

  function bindImportEvents() {
    const dropzone = document.getElementById('qa-import-dropzone');
    const fileInput = document.getElementById('qa-import-file');

    document.getElementById('btn-qa-import')?.addEventListener('click', openImportModal);
    document.getElementById('qa-import-template')?.addEventListener('click', e => {
      e.preventDefault();
      downloadImportTemplate();
    });
    document.getElementById('qa-import-pick')?.addEventListener('click', e => {
      e.preventDefault();
      fileInput?.click();
    });
    document.getElementById('btn-qa-import-confirm')?.addEventListener('click', () => {
      if (pendingImportFile) processImportFile(pendingImportFile);
    });
    document.getElementById('btn-qa-disable-confirm')?.addEventListener('click', confirmDisable);

    fileInput?.addEventListener('change', e => {
      handleImportFileSelect(e.target.files?.[0]);
    });

    if (!dropzone) return;

    dropzone.addEventListener('click', e => {
      if (e.target.closest('#qa-import-pick')) return;
      fileInput?.click();
    });

    dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone.addEventListener('dragleave', e => {
      if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('is-dragover');
    });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      handleImportFileSelect(e.dataTransfer?.files?.[0]);
    });
  }

  function bindEvents() {
    document.getElementById('btn-qa-search')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('btn-qa-create')?.addEventListener('click', () => openForm());
    document.getElementById('btn-detail-to-edit')?.addEventListener('click', () => {
      if (detailViewId) openForm(detailViewId);
    });
    document.getElementById('btn-qa-delete-confirm')?.addEventListener('click', confirmDelete);
    document.getElementById('btn-qa-export')?.addEventListener('click', exportCsv);
    bindImportEvents();
    document.getElementById('qa-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        question: form.question.value.trim(),
        answer: form.answer.value.trim(),
        category: form.category.value,
        status: form.status.value,
        updatedBy: '李敏'
      };
      if (!payload.question || !payload.answer) return;
      if (editingId) {
        AgentQaStore.update(editingId, payload);
      } else {
        AgentQaStore.add(payload);
      }
      if (typeof closeModal === 'function') closeModal('modal-qa-form');
      editingId = null;
      page = 1;
      renderList();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillCategorySelects();
    bindEvents();
    renderList();
  });
})();
