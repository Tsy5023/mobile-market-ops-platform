/** 运营概览配置页：专区列表 → 配置编辑 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let currentPageKey = '';
  let draftConfig = null;

  function newSectionId() {
    return 'sec-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function showListView() {
    document.getElementById('ovcfg-list-view')?.removeAttribute('hidden');
    document.getElementById('ovcfg-edit-view')?.setAttribute('hidden', '');
    currentPageKey = '';
    draftConfig = null;
    renderZoneList();
  }

  function showEditView(pageKey) {
    currentPageKey = pageKey;
    const saved = OverviewConfigStore.getConfig(pageKey);
    draftConfig = saved
      ? JSON.parse(JSON.stringify(saved))
      : { pageKey, sections: [] };

    document.getElementById('ovcfg-list-view')?.setAttribute('hidden', '');
    document.getElementById('ovcfg-edit-view')?.removeAttribute('hidden');

    const profile = OverviewConfigStore.getProfile(pageKey);
    const titleEl = document.getElementById('ovcfg-edit-title');
    const subEl = document.getElementById('ovcfg-edit-sub');
    if (titleEl) titleEl.textContent = profile?.label || '专区配置';
    if (subEl) subEl.textContent = profile?.group || '';

    renderEditor();
    updateEditMeta();
  }

  function renderZoneList() {
    const tbody = document.getElementById('ovcfg-zone-tbody');
    const countEl = document.getElementById('ovcfg-zone-count');
    if (!tbody) return;

    const profiles = OverviewConfigStore.getProfiles();
    if (countEl) countEl.textContent = `共 ${profiles.length} 个专区`;

    tbody.innerHTML = profiles.map(p => {
      const stats = OverviewConfigStore.getProfileStats(p.pageKey);
      return `<tr>
        <td>
          <div class="ovcfg-zone-cell">
            <span class="ovcfg-zone-icon" style="--zone-color:${esc(p.color || '#2563eb')}"><i class="fas ${esc(p.icon || 'fa-chart-pie')}"></i></span>
            <div class="ovcfg-zone-info">
              <strong>${esc(p.label)}</strong>
              <span class="muted">${esc(p.desc || p.group)}</span>
              <span class="ovcfg-zone-group-tag">${esc(p.group)}</span>
            </div>
          </div>
        </td>
        <td><span class="ovcfg-stat-num">${stats.sectionCount}</span> 个</td>
        <td><span class="ovcfg-stat-num">${stats.metricCount}</span> 个</td>
        <td class="muted">${esc(stats.updatedAt || '—')}</td>
        <td class="cell-actions">
          <button type="button" class="btn btn-primary btn-sm ovcfg-btn-config" data-page-key="${esc(p.pageKey)}"><i class="fas fa-sliders"></i> 配置</button>
          <button type="button" class="btn btn-outline btn-sm ovcfg-btn-preview" data-page-key="${esc(p.pageKey)}"><i class="fas fa-eye"></i></button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.ovcfg-btn-config').forEach(btn => {
      btn.addEventListener('click', () => showEditView(btn.dataset.pageKey));
    });
    tbody.querySelectorAll('.ovcfg-btn-preview').forEach(btn => {
      btn.addEventListener('click', () => openSavedPreview(btn.dataset.pageKey));
    });
  }

  function updateEditMeta() {
    const sections = draftConfig?.sections || [];
    const metricCount = sections.reduce((n, s) => n + (s.metrics?.length || 0), 0);
    const secEl = document.getElementById('ovcfg-section-count');
    const metEl = document.getElementById('ovcfg-metric-count');
    const updated = document.getElementById('ovcfg-updated-at');
    if (secEl) secEl.textContent = String(sections.length);
    if (metEl) metEl.textContent = String(metricCount);
    if (updated) updated.textContent = draftConfig?.updatedAt || '尚未保存';
  }

  function renderRowActions({ upClass, downClass, delClass, disableUp, disableDown }) {
    return `<div class="ovcfg-row-actions" role="group" aria-label="排序与删除">
      <button type="button" class="ovcfg-icon-btn ${upClass}" ${disableUp ? 'disabled' : ''} title="上移"><i class="fas fa-chevron-up"></i></button>
      <button type="button" class="ovcfg-icon-btn ${downClass}" ${disableDown ? 'disabled' : ''} title="下移"><i class="fas fa-chevron-down"></i></button>
      <span class="ovcfg-action-sep" aria-hidden="true"></span>
      <button type="button" class="ovcfg-icon-btn ovcfg-icon-btn-danger ${delClass}" title="删除"><i class="fas fa-trash-can"></i></button>
    </div>`;
  }

  function renderEditor() {
    const wrap = document.getElementById('ovcfg-sections');
    if (!wrap) return;
    const sections = draftConfig.sections || [];
    if (!sections.length) {
      wrap.innerHTML = `<div class="ovcfg-empty">
        <i class="fas fa-layer-group"></i>
        <p>暂未配置一级标题，请点击下方「添加一级标题」。</p>
      </div>`;
      updateEditMeta();
      return;
    }

    wrap.innerHTML = sections.map((sec, idx) => `
      <div class="ovcfg-section-card" data-section-id="${esc(sec.id)}">
        <div class="ovcfg-section-head">
          <span class="ovcfg-section-order">${idx + 1}</span>
          <input type="text" class="ovcfg-section-title" value="${esc(sec.title || '')}" placeholder="请输入一级标题"/>
          ${renderRowActions({
            upClass: 'ovcfg-move-up',
            downClass: 'ovcfg-move-down',
            delClass: 'ovcfg-del-section',
            disableUp: idx === 0,
            disableDown: idx === sections.length - 1
          })}
        </div>
        <div class="ovcfg-metrics-block">
          <div class="ovcfg-metrics-head">
            <span class="ovcfg-metrics-label">指标列表 <em>${(sec.metrics || []).length}</em></span>
            <button type="button" class="btn btn-primary btn-sm ovcfg-add-metric" data-section-id="${esc(sec.id)}"><i class="fas fa-plus"></i> 添加指标</button>
          </div>
          <div class="ovcfg-metrics-list">
            ${(sec.metrics || []).length ? (sec.metrics || []).map((m, mi) => `
              <div class="ovcfg-metric-row" data-metric-id="${esc(m.metricId)}">
                <div class="ovcfg-metric-main">
                  <span class="ovcfg-metric-index">${mi + 1}</span>
                  <div class="ovcfg-metric-text">
                    <strong>${esc(m.metricName)}</strong>
                    <code>${esc(m.metricCode || m.metricId)}</code>
                  </div>
                </div>
                ${renderRowActions({
                  upClass: 'ovcfg-metric-up',
                  downClass: 'ovcfg-metric-down',
                  delClass: 'ovcfg-metric-del',
                  disableUp: mi === 0,
                  disableDown: mi === sec.metrics.length - 1
                })}
              </div>`).join('') : `<div class="ovcfg-metrics-empty">暂未添加指标，点击右上角「添加指标」</div>`}
          </div>
        </div>
      </div>`).join('');

    bindSectionEvents(wrap);
    updateEditMeta();
  }

  function bindSectionEvents(wrap) {
    wrap.querySelectorAll('.ovcfg-section-card').forEach(card => {
      const sectionId = card.dataset.sectionId;
      const sec = draftConfig.sections.find(s => s.id === sectionId);
      if (!sec) return;

      card.querySelector('.ovcfg-section-title')?.addEventListener('input', e => { sec.title = e.target.value; });

      card.querySelector('.ovcfg-del-section')?.addEventListener('click', () => {
        if (!confirm('确定删除该一级标题及其下所有指标？')) return;
        draftConfig.sections = draftConfig.sections.filter(s => s.id !== sectionId);
        renderEditor();
      });

      card.querySelector('.ovcfg-move-up')?.addEventListener('click', () => moveSection(sectionId, -1));
      card.querySelector('.ovcfg-move-down')?.addEventListener('click', () => moveSection(sectionId, 1));
      card.querySelector('.ovcfg-add-metric')?.addEventListener('click', () => openMetricPicker(sectionId));

      card.querySelectorAll('.ovcfg-metric-row[data-metric-id]').forEach(row => {
        const metricId = row.dataset.metricId;
        row.querySelector('.ovcfg-metric-del')?.addEventListener('click', () => {
          sec.metrics = (sec.metrics || []).filter(m => m.metricId !== metricId);
          renderEditor();
        });
        row.querySelector('.ovcfg-metric-up')?.addEventListener('click', () => moveMetric(sec, metricId, -1));
        row.querySelector('.ovcfg-metric-down')?.addEventListener('click', () => moveMetric(sec, metricId, 1));
      });
    });
  }

  function moveSection(sectionId, delta) {
    const list = draftConfig.sections;
    const i = list.findIndex(s => s.id === sectionId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    renderEditor();
  }

  function moveMetric(sec, metricId, delta) {
    const list = sec.metrics || [];
    const i = list.findIndex(m => m.metricId === metricId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    renderEditor();
  }

  function addSection() {
    const i = draftConfig.sections.length;
    draftConfig.sections.push({
      id: newSectionId(),
      title: '',
      icon: OverviewConfigStore.SECTION_ICONS[i % OverviewConfigStore.SECTION_ICONS.length],
      color: OverviewConfigStore.SECTION_COLORS[i % OverviewConfigStore.SECTION_COLORS.length],
      metrics: []
    });
    renderEditor();
  }

  function collectDraftFromDom() {
    document.querySelectorAll('.ovcfg-section-card').forEach(card => {
      const sec = draftConfig.sections.find(s => s.id === card.dataset.sectionId);
      if (!sec) return;
      sec.title = card.querySelector('.ovcfg-section-title')?.value?.trim() || sec.title;
      if (!sec.icon) {
        const i = draftConfig.sections.indexOf(sec);
        sec.icon = OverviewConfigStore.SECTION_ICONS[i % OverviewConfigStore.SECTION_ICONS.length];
      }
      if (!sec.color) {
        const i = draftConfig.sections.indexOf(sec);
        sec.color = OverviewConfigStore.SECTION_COLORS[i % OverviewConfigStore.SECTION_COLORS.length];
      }
    });
  }

  function validateDraft() {
    for (const sec of draftConfig.sections) {
      if (!sec.title?.trim()) {
        alert('请填写所有一级标题');
        return false;
      }
    }
    return true;
  }

  function saveDraft() {
    collectDraftFromDom();
    if (!validateDraft()) return;
    OverviewConfigStore.saveConfig(currentPageKey, draftConfig);
    draftConfig = OverviewConfigStore.getConfig(currentPageKey);
    updateEditMeta();
    alert('配置已保存');
  }

  function openPreview() {
    collectDraftFromDom();
    if (!validateDraft()) return;
    sessionStorage.setItem('ovcfg_preview_draft', JSON.stringify({
      pageKey: currentPageKey,
      config: draftConfig
    }));
    window.open(`overview-config-preview.html?page=${encodeURIComponent(currentPageKey)}&draft=1`, '_blank');
  }

  function openSavedPreview(pageKey) {
    window.open(`overview-config-preview.html?page=${encodeURIComponent(pageKey)}`, '_blank');
  }

  let pickerTargetSectionId = null;
  let ovcfgMetricPickerRows = [];
  let ovcfgMetricPickerPage = 1;
  let ovcfgPendingMetricIds = new Set();
  const OVCFG_METRIC_PICKER_PAGE_SIZE = 10;
  const OVCFG_ALGO_LABELS = {
    traffic_rca: '流量运营根因分析',
    loss_control_rca: '控损运营根因分析'
  };

  function getOvcfgMetricOptions() {
    return (window.METRIC_OPTIONS || []).map(row => {
      const code = (row.code || '').toUpperCase();
      let algorithmScenes = Array.isArray(row.algorithmScenes) ? row.algorithmScenes : [];
      if (!algorithmScenes.length) {
        if (/FL_REV|ROAM|EU_|FAMILY|HALL/.test(code)) algorithmScenes = ['traffic_rca'];
        else if (/CHURN|HE_|HCD|CUS_CHURN/.test(code)) algorithmScenes = ['loss_control_rca'];
      }
      return { ...row, algorithmScenes };
    });
  }

  function formatOvcfgAlgoScenes(scenes) {
    const list = Array.isArray(scenes) ? scenes : [];
    if (!list.length) return '—';
    return list.map(v => OVCFG_ALGO_LABELS[v] || v).join('、');
  }

  function openMetricPicker(sectionId) {
    pickerTargetSectionId = sectionId;
    ovcfgPendingMetricIds = new Set();
    ovcfgMetricPickerPage = 1;
    const kw = document.getElementById('ovcfg-mp-keyword');
    if (kw) kw.value = '';
    const algo = document.getElementById('ovcfg-mp-algorithm-scene');
    if (algo) algo.value = '';
    searchOvcfgMetricPicker();
    openModal('modal-ovcfg-metric-pick');
  }

  function closeOvcfgMetricPicker() {
    closeModal('modal-ovcfg-metric-pick');
    pickerTargetSectionId = null;
  }

  function searchOvcfgMetricPicker() {
    const keyword = (document.getElementById('ovcfg-mp-keyword')?.value || '').trim();
    const algoScene = document.getElementById('ovcfg-mp-algorithm-scene')?.value || '';
    ovcfgMetricPickerRows = getOvcfgMetricOptions().filter(row => {
      if (keyword && !row.name.includes(keyword) && !(row.code || '').includes(keyword)) return false;
      if (algoScene) {
        const scenes = row.algorithmScenes || [];
        if (!scenes.includes(algoScene)) return false;
      }
      return true;
    });
    ovcfgMetricPickerPage = 1;
    renderOvcfgMetricPickerTable();
  }

  function renderOvcfgMetricPickerTable() {
    const tbody = document.getElementById('ovcfg-mp-tbody');
    const pagination = document.getElementById('ovcfg-mp-pagination');
    if (!tbody) return;

    const sec = draftConfig?.sections?.find(s => s.id === pickerTargetSectionId);
    const existingIds = new Set((sec?.metrics || []).map(m => m.metricId));

    const start = (ovcfgMetricPickerPage - 1) * OVCFG_METRIC_PICKER_PAGE_SIZE;
    const pageRows = ovcfgMetricPickerRows.slice(start, start + OVCFG_METRIC_PICKER_PAGE_SIZE);
    tbody.innerHTML = pageRows.map(row => {
      const disabled = existingIds.has(row.id);
      const checked = ovcfgPendingMetricIds.has(row.id);
      return `
      <tr class="${checked ? 'selected' : ''} ${disabled ? 'is-disabled' : ''}" data-metric-id="${esc(row.id)}">
        <td><input type="checkbox" class="ovcfg-metric-pick-cb" value="${esc(row.id)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}/></td>
        <td>${esc(row.code)}</td>
        <td><strong>${esc(row.name)}</strong>${disabled ? ' <span class="muted">(已添加)</span>' : ''}</td>
        <td>${esc(row.granularity || row.alertLevel || '—')}</td>
        <td>${esc(formatOvcfgAlgoScenes(row.algorithmScenes))}</td>
        <td>${esc(row.period || '—')}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">暂无指标</td></tr>';

    tbody.querySelectorAll('tr[data-metric-id]').forEach(tr => {
      if (tr.classList.contains('is-disabled')) return;
      tr.addEventListener('click', e => {
        if (e.target.closest('.ovcfg-metric-pick-cb')) return;
        const cb = tr.querySelector('.ovcfg-metric-pick-cb');
        if (!cb || cb.disabled) return;
        cb.checked = !cb.checked;
        if (cb.checked) ovcfgPendingMetricIds.add(tr.dataset.metricId);
        else ovcfgPendingMetricIds.delete(tr.dataset.metricId);
        tr.classList.toggle('selected', cb.checked);
      });
    });
    tbody.querySelectorAll('.ovcfg-metric-pick-cb').forEach(cb => {
      cb.addEventListener('click', e => e.stopPropagation());
      cb.addEventListener('change', () => {
        const tr = cb.closest('tr[data-metric-id]');
        if (cb.checked) ovcfgPendingMetricIds.add(cb.value);
        else ovcfgPendingMetricIds.delete(cb.value);
        tr?.classList.toggle('selected', cb.checked);
      });
    });

    if (window.TablePagination && pagination) {
      const result = TablePagination.render(pagination, {
        total: ovcfgMetricPickerRows.length,
        page: ovcfgMetricPickerPage,
        pageSize: OVCFG_METRIC_PICKER_PAGE_SIZE,
        onPageChange: p => {
          ovcfgMetricPickerPage = p;
          renderOvcfgMetricPickerTable();
        }
      });
      ovcfgMetricPickerPage = result.page;
    }
  }

  function confirmOvcfgMetricPicker() {
    if (!pickerTargetSectionId) return;
    if (!ovcfgPendingMetricIds.size) {
      alert('请至少选择一个指标');
      return;
    }
    const section = draftConfig.sections.find(s => s.id === pickerTargetSectionId);
    if (!section) return;
    section.metrics = section.metrics || [];
    const existing = new Set(section.metrics.map(m => m.metricId));
    let added = 0;
    ovcfgPendingMetricIds.forEach(id => {
      if (existing.has(id)) return;
      const ref = window.getMetricById?.(id) || getOvcfgMetricOptions().find(m => m.id === id);
      if (!ref) return;
      section.metrics.push({
        metricId: ref.id,
        metricCode: ref.code,
        metricName: ref.name
      });
      existing.add(id);
      added += 1;
    });
    closeOvcfgMetricPicker();
    renderEditor();
    if (!added) alert('所选指标均已存在，未新增');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ovcfg-zone-tbody')) return;

    document.getElementById('btn-ovcfg-back-list')?.addEventListener('click', showListView);
    document.getElementById('btn-ovcfg-add-section')?.addEventListener('click', addSection);
    document.getElementById('btn-ovcfg-save')?.addEventListener('click', saveDraft);
    document.getElementById('btn-ovcfg-preview')?.addEventListener('click', openPreview);
    document.getElementById('ovcfg-mp-search')?.addEventListener('click', searchOvcfgMetricPicker);
    document.getElementById('ovcfg-mp-keyword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchOvcfgMetricPicker();
    });
    document.getElementById('ovcfg-mp-algorithm-scene')?.addEventListener('change', searchOvcfgMetricPicker);
    document.getElementById('ovcfg-mp-confirm')?.addEventListener('click', confirmOvcfgMetricPicker);
    document.querySelectorAll('[data-close-modal="modal-ovcfg-metric-pick"]').forEach(btn => {
      btn.addEventListener('click', closeOvcfgMetricPicker);
    });

    const params = new URLSearchParams(location.search);
    const pageKey = params.get('page');
    if (pageKey && OverviewConfigStore.getProfile(pageKey)) {
      showEditView(pageKey);
    } else {
      showListView();
    }
  });
})();
