/** 主动渠道资源排期 · 渠道+月份主范围下的地市额度列表 */
(function () {
  let pendingDeleteId = null;
  let pendingImportFile = null;
  let detailId = null;
  let editingId = null;

  const Store = () => window.AgentChannelScheduleStore;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fillSelect(el, options, { allLabel, value } = {}) {
    if (!el) return;
    const opts = [];
    if (allLabel) opts.push(`<option value="">${esc(allLabel)}</option>`);
    (options || []).forEach(o => {
      opts.push(`<option value="${esc(o.value)}">${esc(o.label)}</option>`);
    });
    el.innerHTML = opts.join('');
    if (value != null) el.value = value;
  }

  function updateQuotaHint(channel) {
    const hint = document.getElementById('f-quota-hint');
    const input = document.getElementById('f-quota');
    if (hint) hint.textContent = Store().capacityHint(channel);
    if (input) input.placeholder = Store().capacityPlaceholder(channel);
  }

  function currentScope() {
    return {
      channel: document.getElementById('scope-channel')?.value || '',
      month: document.getElementById('scope-month')?.value || ''
    };
  }

  function updateScopeHint() {
    const { channel, month } = currentScope();
    const el = document.getElementById('scope-hint');
    if (!el) return;
    if (!channel || !month) {
      el.textContent = '请先选择主动渠道与排期月份，列表将展示该范围内的地市额度';
      return;
    }
    el.textContent = `当前查看：${Store().channelLabel(channel)} · ${month}`;
  }

  function initScopeAndForm() {
    const channels = Store().getChannels();
    const cities = Store().getCities();
    const month = Store().currentMonth();
    const firstChannel = channels[0]?.value || '';

    fillSelect(document.getElementById('scope-channel'), channels, { value: firstChannel });
    const sm = document.getElementById('scope-month');
    if (sm) sm.value = month;

    fillSelect(document.getElementById('filter-city'), cities, {
      allLabel: '全部地市州',
      value: ''
    });

    fillSelect(document.getElementById('f-channel'), channels, { value: firstChannel });
    fillSelect(document.getElementById('f-city'), cities, { value: cities[0]?.value || '' });
    const fMonth = document.getElementById('f-month');
    if (fMonth) fMonth.value = month;
    updateQuotaHint(firstChannel);
    updateScopeHint();
  }

  function setFormLocks(isEdit) {
    const ch = document.getElementById('f-channel');
    const month = document.getElementById('f-month');
    const city = document.getElementById('f-city');
    // 仅编辑时锁定维度键；新增时可自由选择渠道 / 月份 / 地市
    [ch, month, city].forEach(el => {
      if (!el) return;
      el.disabled = !!isEdit;
    });
    const usedRow = document.getElementById('f-used-row');
    if (usedRow) usedRow.hidden = !isEdit;
  }

  function renderList() {
    const tbody = document.getElementById('list-tbody');
    const countEl = document.getElementById('list-count');
    if (!tbody) return;

    const { channel, month } = currentScope();
    const cityFilter = document.getElementById('filter-city')?.value || '';

    if (!channel || !month) {
      if (countEl) countEl.textContent = '';
      tbody.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">请先选择主动渠道与排期月份</td></tr>`;
      return;
    }

    // 始终按云南地市固定顺序铺开，切换渠道也不改变地市顺序
    const dataMap = {};
    Store().query({ channel, month }).forEach(r => { dataMap[r.city] = r; });
    let cities = Store().getCities();
    if (cityFilter) cities = cities.filter(c => c.value === cityFilter);

    const configured = cities.filter(c => dataMap[c.value]).length;
    if (countEl) countEl.textContent = `已配置 ${configured} / ${cities.length} 个地市州`;

    tbody.innerHTML = cities.map(city => {
      const r = dataMap[city.value];
      if (!r) {
        return `<tr class="acs-row-empty">
          <td>${esc(city.label)}</td>
          <td class="muted">—</td>
          <td class="muted">—</td>
          <td class="muted">—</td>
          <td class="muted">—</td>
          <td class="muted">—</td>
          <td class="ops">
            <a href="#" class="link-action" data-act="create" data-city="${esc(city.value)}">新增</a>
          </td>
        </tr>`;
      }
      const remain = Store().remainingOf(r);
      const low = remain <= (Number(r.monthlyQuota) || 0) * 0.15;
      return `<tr>
        <td>${esc(city.label)}</td>
        <td>${esc(Store().formatCapacity(r.monthlyQuota))}</td>
        <td>${esc(Store().formatCapacity(r.usedQuota))}</td>
        <td class="${low ? 'text-warn' : ''}">${esc(Store().formatCapacity(remain))}</td>
        <td>${esc(r.updatedBy || '—')}</td>
        <td>${esc(r.updatedAt || '—')}</td>
        <td class="ops">
          <a href="#" class="link-action" data-act="detail" data-id="${esc(r.id)}">详情</a>
          <a href="#" class="link-action" data-act="edit" data-id="${esc(r.id)}">编辑</a>
          <a href="#" class="link-action link-danger" data-act="delete" data-id="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-act]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        if (a.dataset.act === 'create') openCreate(a.dataset.city);
        else if (a.dataset.act === 'detail') showDetail(a.dataset.id);
        else if (a.dataset.act === 'edit') openEdit(a.dataset.id);
        else if (a.dataset.act === 'delete') openDelete(a.dataset.id);
      });
    });
  }

  function showDetail(id) {
    const r = Store().getById(id);
    const body = document.getElementById('detail-body');
    if (!r || !body) return;
    detailId = r.id;
    const remain = Store().remainingOf(r);
    body.innerHTML = `
      <div class="acs-form-rows">
        <div class="acs-form-row">
          <label>主动渠道</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(Store().channelLabel(r.channel))}</div></div>
        </div>
        <div class="acs-form-row">
          <label>排期月份</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(r.month)}</div></div>
        </div>
        <div class="acs-form-row">
          <label>地市州</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(Store().cityLabel(r.city))}</div></div>
        </div>
        <div class="acs-form-row">
          <label>本月额度</label>
          <div class="acs-form-control">
            <div class="acs-form-readonly">${esc(Store().formatCapacity(r.monthlyQuota))}</div>
            <p class="acs-form-hint">${esc(Store().capacityHint(r.channel))}</p>
          </div>
        </div>
        <div class="acs-form-row">
          <label>已占用额度</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(Store().formatCapacity(r.usedQuota))}</div></div>
        </div>
        <div class="acs-form-row">
          <label>剩余额度</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(Store().formatCapacity(remain))}</div></div>
        </div>
        <div class="acs-form-row">
          <label>备注</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(r.remark || '—')}</div></div>
        </div>
        <div class="acs-form-row">
          <label>更新人</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(r.updatedBy || '—')}</div></div>
        </div>
        <div class="acs-form-row">
          <label>更新时间</label>
          <div class="acs-form-control"><div class="acs-form-readonly">${esc(r.updatedAt || '—')}</div></div>
        </div>
      </div>`;
    if (typeof openModal === 'function') openModal('modal-detail');
  }

  function openCreate(preferredCity) {
    editingId = null;
    document.getElementById('form-title').textContent = '新增额度';
    document.getElementById('schedule-form')?.reset();
    document.getElementById('f-id').value = '';
    setFormLocks(false);

    const { channel, month } = currentScope();
    const channels = Store().getChannels();
    const cities = Store().getCities();
    const ch = channel || channels[0]?.value || '';
    const mon = month || Store().currentMonth();
    const cityFilter = document.getElementById('filter-city')?.value || '';

    document.getElementById('f-channel').value = ch;
    document.getElementById('f-month').value = mon;
    document.getElementById('f-city').value = preferredCity || cityFilter || cities[0]?.value || '';
    const usedView = document.getElementById('f-used-view');
    if (usedView) usedView.textContent = '—';
    updateQuotaHint(ch);

    if (typeof openModal === 'function') openModal('modal-form');
  }

  function openEdit(id) {
    const r = Store().getById(id);
    if (!r) return;
    editingId = r.id;
    detailId = r.id;
    document.getElementById('form-title').textContent = '编辑额度';
    document.getElementById('f-id').value = r.id;
    document.getElementById('f-channel').value = r.channel;
    document.getElementById('f-month').value = r.month;
    document.getElementById('f-city').value = r.city;
    document.getElementById('f-quota').value = r.monthlyQuota;
    const usedView = document.getElementById('f-used-view');
    if (usedView) usedView.textContent = Store().formatCapacity(r.usedQuota);
    document.getElementById('f-remark').value = r.remark || '';
    updateQuotaHint(r.channel);
    setFormLocks(true);

    if (typeof closeModal === 'function') closeModal('modal-detail');
    if (typeof openModal === 'function') openModal('modal-form');
  }

  function submitForm(e) {
    e.preventDefault();
    const channel = document.getElementById('f-channel')?.value;
    const month = document.getElementById('f-month')?.value;
    const city = document.getElementById('f-city')?.value;
    const monthlyQuota = Number(document.getElementById('f-quota')?.value);
    const remark = (document.getElementById('f-remark')?.value || '').trim();
    const isEdit = !!editingId;

    if (!channel) { window.alert('请选择主动渠道'); return; }
    if (!month) { window.alert('请选择排期月份'); return; }
    if (!city) { window.alert('请选择地市州'); return; }
    if (!Number.isFinite(monthlyQuota) || monthlyQuota < 0) {
      window.alert('请填写有效的本月额度');
      return;
    }

    if (!isEdit) {
      const exist = Store().getByKey(channel, month, city);
      if (exist) {
        const ok = window.confirm(
          `当前新增配置与历史配置重叠（${Store().channelLabel(channel)} · ${month} · ${Store().cityLabel(city)}），会覆盖历史本月额度（已占用额度保留），是否继续？`
        );
        if (!ok) return;
      }
    }

    if (isEdit) {
      const old = Store().getById(editingId);
      Store().save({
        id: editingId,
        channel,
        month,
        city,
        monthlyQuota,
        usedQuota: old?.usedQuota || 0,
        remark,
        updatedBy: '李敏'
      });
    } else {
      Store().upsertOne({
        channel,
        month,
        city,
        monthlyQuota,
        remark,
        updatedBy: '李敏'
      });
    }

    document.getElementById('scope-channel').value = channel;
    document.getElementById('scope-month').value = Store().normalizeMonth(month);
    document.getElementById('filter-city').value = '';
    updateScopeHint();
    editingId = null;
    setFormLocks(false);

    if (typeof closeModal === 'function') closeModal('modal-form');
    window.alert(isEdit ? '已保存修改' : '已新增该地市额度');
    renderList();
  }

  function openDelete(id) {
    const r = Store().getById(id);
    if (!r) return;
    pendingDeleteId = r.id;
    const preview = document.getElementById('delete-preview');
    if (preview) {
      preview.innerHTML = `<strong>${esc(Store().cityLabel(r.city))}</strong>
        <br/>${esc(Store().channelLabel(r.channel))} · ${esc(r.month)}
        <br/><span class="muted">本月额度 ${esc(Store().formatCapacity(r.monthlyQuota))} · 剩余 ${esc(Store().formatCapacity(Store().remainingOf(r)))}</span>`;
    }
    if (typeof closeModal === 'function') closeModal('modal-detail');
    if (typeof openModal === 'function') openModal('modal-delete');
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    Store().remove(pendingDeleteId);
    pendingDeleteId = null;
    detailId = null;
    editingId = null;
    if (typeof closeModal === 'function') closeModal('modal-delete');
    renderList();
  }

  function openImport() {
    pendingImportFile = null;
    const nameEl = document.getElementById('import-file-name');
    if (nameEl) nameEl.textContent = '';
    const file = document.getElementById('import-file');
    if (file) file.value = '';
    document.getElementById('btn-import-confirm')?.toggleAttribute('disabled', true);
    if (typeof openModal === 'function') openModal('modal-import');
  }

  function setImportFile(file) {
    if (file && !/\.xlsx?$/i.test(file.name || '')) {
      window.alert('仅支持上传 Excel（.xlsx / .xls）文件');
      pendingImportFile = null;
      const nameEl = document.getElementById('import-file-name');
      if (nameEl) nameEl.textContent = '';
      document.getElementById('btn-import-confirm')?.toggleAttribute('disabled', true);
      const input = document.getElementById('import-file');
      if (input) input.value = '';
      return;
    }
    pendingImportFile = file || null;
    const nameEl = document.getElementById('import-file-name');
    if (nameEl) nameEl.textContent = file ? `已选择：${file.name}` : '';
    document.getElementById('btn-import-confirm')?.toggleAttribute('disabled', !file);
  }

  function cellText(v) {
    if (v == null || v === '') return '';
    if (v instanceof Date && !isNaN(v.getTime())) {
      return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}`;
    }
    if (typeof v === 'number' && window.XLSX?.SSF && v > 20000 && v < 80000) {
      try {
        const d = window.XLSX.SSF.parse_date_code(v);
        if (d) return `${d.y}-${String(d.m).padStart(2, '0')}`;
      } catch (e) { /* ignore */ }
    }
    return String(v).trim();
  }

  function downloadTemplate(e) {
    e.preventDefault();
    if (typeof window.XLSX === 'undefined') {
      window.alert('Excel 组件未加载，请刷新页面后重试');
      return;
    }
    const wb = window.XLSX.utils.book_new();
    const { channel, month } = currentScope();
    const mon = month || Store().currentMonth();
    const ch = Store().getChannels().find(c => c.value === channel) || Store().getChannels()[0];

    const tipRows = [
      ['填写说明：请从字典页复制渠道ID、地市ID；排期月份格式 YYYY-MM；同渠道同月同地市重复导入将覆盖本月额度（已占用额度由系统保留，不可手工导入）'],
      [],
      ['渠道名称', '渠道ID', '地市名称', '地市ID', '排期月份', '本月额度', '备注'],
      [ch?.label || '独立排呼', ch?.value || 'independent_outbound', '昆明市', 'yn_km', mon, 120000, '示例'],
      [ch?.label || '独立排呼', ch?.value || 'independent_outbound', '曲靖市', 'yn_qj', mon, 100000, '']
    ];
    const wsData = window.XLSX.utils.aoa_to_sheet(tipRows);
    wsData['!cols'] = [
      { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }
    ];
    window.XLSX.utils.book_append_sheet(wb, wsData, '额度导入');

    const dictRows = [
      ['【渠道字典】'],
      ['渠道名称', '渠道ID'],
      ...Store().getChannels().map(c => [c.label, c.value]),
      [],
      ['【云南省地市州字典】'],
      ['地市名称', '地市ID'],
      ...Store().getCities().map(c => [c.label, c.value])
    ];
    const wsDict = window.XLSX.utils.aoa_to_sheet(dictRows);
    wsDict['!cols'] = [{ wch: 28 }, { wch: 24 }];
    window.XLSX.utils.book_append_sheet(wb, wsDict, '渠道地市字典');

    window.XLSX.writeFile(wb, '主动渠道资源排期导入模板.xlsx');
  }

  function findHeaderRow(matrix) {
    for (let i = 0; i < Math.min(matrix.length, 20); i++) {
      const joined = (matrix[i] || []).map(c => String(c == null ? '' : c)).join('|');
      if (joined.includes('本月额度') || (joined.includes('渠道ID') && joined.includes('地市'))) {
        return i;
      }
    }
    return -1;
  }

  function parseExcelRows(workbook) {
    const preferred = ['额度导入', '排期导入', 'Sheet1'];
    const sheetName = preferred.find(n => workbook.SheetNames.includes(n)) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    const headerIdx = findHeaderRow(matrix);
    if (headerIdx < 0) return [];
    const header = (matrix[headerIdx] || []).map(h => String(h || '').trim());
    const idx = (...keys) => header.findIndex(h => keys.some(k => h.includes(k)));
    const iChannelId = idx('渠道ID');
    const iChannelName = idx('渠道名称', '主动渠道');
    const iCityId = idx('地市ID', '地市州ID');
    const iCityName = idx('地市名称', '地市州');
    const iMonth = idx('排期月份', '月份');
    const iQuota = idx('本月额度', '额度');
    const iRemark = idx('备注');

    return matrix.slice(headerIdx + 1).map(row => {
      const cols = (row || []).map(cellText);
      const channel = (iChannelId >= 0 ? cols[iChannelId] : '') || (iChannelName >= 0 ? cols[iChannelName] : '');
      const city = (iCityId >= 0 ? cols[iCityId] : '') || (iCityName >= 0 ? cols[iCityName] : '');
      return {
        channel,
        city,
        month: iMonth >= 0 ? cols[iMonth] : '',
        monthlyQuota: iQuota >= 0 ? cols[iQuota] : '',
        remark: iRemark >= 0 ? cols[iRemark] : ''
      };
    }).filter(r => r.channel && r.city && r.month && !String(r.channel).includes('填写说明'));
  }

  function confirmImport() {
    if (!pendingImportFile) return;
    if (typeof window.XLSX === 'undefined') {
      window.alert('Excel 组件未加载，请刷新页面后重试');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result);
        const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
        const rows = parseExcelRows(workbook);
        if (!rows.length) {
          window.alert('未解析到有效数据，请使用最新 Excel 导入模板');
          return;
        }
        const result = Store().importRows(rows);
        // 导入后切换到首行对应的查看范围，完成闭环
        const first = rows[0];
        if (first) {
          const ch = Store().getChannels().find(c =>
            c.value === first.channel || c.label === first.channel
          );
          if (ch) document.getElementById('scope-channel').value = ch.value;
          const mon = Store().normalizeMonth(first.month);
          if (mon) document.getElementById('scope-month').value = mon;
          document.getElementById('filter-city').value = '';
          updateScopeHint();
        }
        if (typeof closeModal === 'function') closeModal('modal-import');
        window.alert(`导入完成：新增 ${result.created} 条，覆盖 ${result.updated} 条`);
        renderList();
      } catch (err) {
        window.alert('Excel 解析失败，请确认文件格式正确');
      }
    };
    reader.onerror = () => window.alert('文件读取失败');
    reader.readAsArrayBuffer(pendingImportFile);
  }

  function bindImportUi() {
    const zone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('import-file');
    document.getElementById('import-pick')?.addEventListener('click', e => {
      e.preventDefault();
      fileInput?.click();
    });
    fileInput?.addEventListener('change', () => setImportFile(fileInput.files?.[0]));
    zone?.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone?.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
    zone?.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      setImportFile(e.dataTransfer?.files?.[0]);
    });
    document.getElementById('import-template')?.addEventListener('click', downloadTemplate);
    document.getElementById('btn-import-confirm')?.addEventListener('click', confirmImport);
  }

  function onScopeChange() {
    updateScopeHint();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('list-tbody')) return;

    initScopeAndForm();
    bindImportUi();

    document.getElementById('scope-channel')?.addEventListener('change', onScopeChange);
    document.getElementById('scope-month')?.addEventListener('change', onScopeChange);

    document.getElementById('btn-search')?.addEventListener('click', () => {
      renderList();
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.getElementById('filter-city').value = '';
      renderList();
    });

    document.getElementById('f-channel')?.addEventListener('change', () => {
      updateQuotaHint(document.getElementById('f-channel').value);
    });

    document.getElementById('btn-create')?.addEventListener('click', openCreate);
    document.getElementById('btn-import')?.addEventListener('click', openImport);
    document.getElementById('schedule-form')?.addEventListener('submit', submitForm);
    document.getElementById('btn-detail-delete')?.addEventListener('click', () => {
      if (detailId) openDelete(detailId);
    });
    document.getElementById('btn-detail-edit')?.addEventListener('click', () => {
      if (detailId) openEdit(detailId);
    });
    document.getElementById('btn-delete-confirm')?.addEventListener('click', confirmDelete);

    renderList();
  });
})();
