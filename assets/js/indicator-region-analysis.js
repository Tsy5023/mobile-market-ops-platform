/**
 * 指标树 · 地域分析：指标购物车、多维地域表格下钻、分析模板
 */
(function () {
  const TEMPLATE_KEY = 'jxRegionAnalysisTemplates';
  const MAX_METRICS = 8;
  const LEVEL_LABELS = { city: '地市', county: '区县', grid: '网格', community: '小区' };

  const cart = [];
  const expanded = new Set();
  let currentTreeId = '';
  let currentTreeName = '';
  let activePresetId = '';
  /** @type {{ mode: 'province-cities' } | { mode: 'city-counties', cityId: string } | null} */
  let activeRegionView = null;

  /** 内置常用分析模板（首次使用时写入本地存储） */
  const PRESET_TEMPLATES = [
    {
      id: 'preset-province-traffic',
      name: '省级流量运营重点指标',
      desc: '江西省各地市流量运营重点指标对比分析',
      matchPattern: '流量|套餐|5G|宽带|离网|ARPU|增收|渗透',
      regionView: 'province-cities'
    },
    {
      id: 'preset-ganzhou-traffic',
      name: '赣州市流量运营重点指标',
      desc: '赣州市各区县流量运营重点指标对比分析',
      matchPattern: '流量|套餐|5G|宽带|离网|ARPU|增收|渗透',
      regionView: 'city-counties',
      cityId: 'gz'
    }
  ];

  const LEGACY_PRESET_IDS = [
    'preset-leader-l1', 'preset-churn-risk', 'preset-scale', 'preset-retain'
  ];

  let tplFormMode = 'save';
  let tplFormTargetId = '';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function periodSeed() {
    const p = window.jxDrillPeriod || { year: 2026, month: 5 };
    const s = window.jxDrillState || {};
    return `${p.year}-${p.month}|${s.city?.id || ''}|${s.county?.id || ''}`;
  }

  function collectMetricLeaves(root, list) {
    if (!root) return list;
    if (root.type !== 'category' && root.id) list.push(root);
    (root.children || []).forEach(c => collectMetricLeaves(c, list));
    return list;
  }

  function resolveTemplateMetricIds(tpl) {
    const root = window._currentTreeRoot;
    if (!root || !tpl) return [];
    if (tpl.metrics?.length) {
      return tpl.metrics.map(m => m.id).filter(id => !!findNodeInTree(root, id) || tpl.metrics.some(m => m.id === id));
    }
    if (tpl.metricIds?.length) {
      return tpl.metricIds.filter(id => !!findNodeInTree(root, id));
    }
    if (tpl.matchPattern) {
      const re = new RegExp(tpl.matchPattern);
      return collectMetricLeaves(root, [])
        .filter(n => re.test(n.name || ''))
        .slice(0, MAX_METRICS)
        .map(n => n.id);
    }
    return [];
  }

  function presetToStored(t) {
    return {
      id: t.id,
      name: t.name,
      desc: t.desc,
      metricIds: t.metricIds || [],
      matchPattern: t.matchPattern || '',
      regionView: t.regionView || '',
      cityId: t.cityId || '',
      savedAt: ''
    };
  }

  function syncRegionViewFromTemplate(tpl) {
    if (tpl?.regionView === 'province-cities') {
      activeRegionView = { mode: 'province-cities' };
      return;
    }
    if (tpl?.regionView === 'city-counties') {
      activeRegionView = { mode: 'city-counties', cityId: tpl.cityId || 'gz' };
      return;
    }
    activeRegionView = null;
  }

  function ensureTemplates() {
    let list = readTemplates().filter(t => !LEGACY_PRESET_IDS.includes(t.id));
    let changed = list.length !== readTemplates().length;
    PRESET_TEMPLATES.forEach(t => {
      const existing = list.find(item => item.id === t.id);
      if (existing) {
        existing.name = t.name;
        existing.desc = t.desc;
        if (t.metricIds?.length) existing.metricIds = t.metricIds;
        if (t.matchPattern) existing.matchPattern = t.matchPattern;
        existing.regionView = t.regionView || '';
        existing.cityId = t.cityId || '';
        changed = true;
      } else {
        list.unshift(presetToStored(t));
        changed = true;
      }
    });
    if (changed || !readTemplates().length) writeTemplates(list);
    return list;
  }

  function openTplForm(mode, templateId) {
    tplFormMode = mode;
    tplFormTargetId = templateId || '';
    const titleEl = document.getElementById('region-tpl-form-title');
    const nameEl = document.getElementById('region-tpl-form-name');
    const descEl = document.getElementById('region-tpl-form-desc');
    if (!titleEl || !nameEl || !descEl) return;

    if (mode === 'edit') {
      const tpl = ensureTemplates().find(t => t.id === templateId);
      if (!tpl) return;
      titleEl.textContent = '编辑分析模板';
      nameEl.value = tpl.name || '';
      descEl.value = tpl.desc || '';
    } else {
      titleEl.textContent = '保存分析模板';
      nameEl.value = currentTreeName ? currentTreeName + ' · 地域分析' : '';
      descEl.value = '';
    }

    if (typeof openModal === 'function') openModal('modal-region-tpl-form');
    else document.getElementById('modal-region-tpl-form')?.classList.add('show');
    setTimeout(() => nameEl.focus(), 50);
  }

  function closeTplForm() {
    if (typeof closeModal === 'function') closeModal('modal-region-tpl-form');
    else document.getElementById('modal-region-tpl-form')?.classList.remove('show');
    tplFormMode = 'save';
    tplFormTargetId = '';
  }

  function confirmTplForm() {
    const nameEl = document.getElementById('region-tpl-form-name');
    const descEl = document.getElementById('region-tpl-form-desc');
    const name = nameEl?.value?.trim();
    const desc = descEl?.value?.trim() || '';
    if (!name) {
      alert('请输入模板名称');
      nameEl?.focus();
      return;
    }

    const tpls = ensureTemplates();
    if (tplFormMode === 'edit') {
      const tpl = tpls.find(t => t.id === tplFormTargetId);
      if (!tpl) return;
      tpl.name = name;
      tpl.desc = desc;
      writeTemplates(tpls);
      closeTplForm();
      renderPresetTemplates();
      return;
    }

    if (!cart.length) {
      alert('请先加入至少一个指标再保存模板');
      return;
    }
    const item = {
      id: 'ra-tpl-' + Date.now(),
      name,
      desc,
      treeId: currentTreeId,
      treeName: currentTreeName,
      regionView: activeRegionView?.mode === 'city-counties' ? 'city-counties'
        : (activeRegionView?.mode === 'province-cities' ? 'province-cities' : ''),
      cityId: activeRegionView?.cityId || '',
      metrics: cart.map(m => {
        const t = getMetricTarget(m);
        return {
          id: m.id, name: m.name, value: m.value, mom: m.mom, yoy: m.yoy, alert: m.alert,
          targetNum: t.targetNum, targetDisplay: t.targetDisplay, lowerBetter: t.lowerBetter
        };
      }),
      savedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    };
    tpls.unshift(item);
    writeTemplates(tpls.slice(0, 30));
    closeTplForm();
    renderPresetTemplates();
    alert('模板已保存：' + item.name);
  }

  function deleteTemplate(templateId) {
    const tpl = ensureTemplates().find(t => t.id === templateId);
    if (!tpl) return;
    if (!confirm('确定删除模板「' + tpl.name + '」？')) return;
    const tpls = readTemplates().filter(t => t.id !== templateId);
    writeTemplates(tpls);
    if (activePresetId === templateId) {
      activePresetId = '';
      activeRegionView = null;
    }
    renderPresetTemplates();
    renderTable();
  }

  function renderPresetTemplates() {
    const wrap = document.getElementById('region-preset-templates');
    if (!wrap) return;
    const templates = ensureTemplates();
    wrap.innerHTML = `
      <div class="region-preset-head">
        <span class="region-preset-title">常用分析模板</span>
        <button type="button" class="btn btn-outline btn-sm" id="btn-region-save-analysis-tpl">
          <i class="fas fa-save"></i> 保存分析模板
        </button>
      </div>
      <div class="region-preset-grid">
        ${templates.length ? templates.map(t => `
          <div class="region-preset-card${activePresetId === t.id ? ' is-active' : ''}"
               data-preset-id="${esc(t.id)}">
            <span class="region-preset-name">${esc(t.name)}</span>
            <span class="region-preset-desc">${esc(t.desc || '暂无备注')}</span>
            <div class="region-preset-card-actions">
              <button type="button" class="region-preset-action-btn" data-preset-edit="${esc(t.id)}" title="编辑">
                <i class="fas fa-pen"></i>
              </button>
              <button type="button" class="region-preset-action-btn is-delete" data-preset-delete="${esc(t.id)}" title="删除">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('') : '<p class="muted" style="grid-column:1/-1;margin:0;font-size:12px">暂无模板，请先保存分析模板</p>'}
      </div>`;
  }

  function bindPresetTemplateEvents() {
    const wrap = document.getElementById('region-preset-templates');
    if (!wrap || wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    wrap.addEventListener('click', e => {
      const editBtn = e.target.closest('[data-preset-edit]');
      if (editBtn) {
        e.stopPropagation();
        openTplForm('edit', editBtn.dataset.presetEdit);
        return;
      }
      const deleteBtn = e.target.closest('[data-preset-delete]');
      if (deleteBtn) {
        e.stopPropagation();
        deleteTemplate(deleteBtn.dataset.presetDelete);
        return;
      }
      const saveBtn = e.target.closest('#btn-region-save-analysis-tpl');
      if (saveBtn) {
        e.stopPropagation();
        if (!cart.length) {
          alert('请先加入至少一个指标再保存模板');
          return;
        }
        openTplForm('save');
        return;
      }
      const card = e.target.closest('[data-preset-id]');
      if (card) {
        window.RegionAnalysis.applyPreset(card.dataset.presetId);
      }
    });
  }

  function getCities() {
    if (typeof window.getAllJxCities === 'function') return window.getAllJxCities();
    return (window.JIANGXI_REGION?.cities || []).map(c => ({ id: c.id, name: c.name }));
  }

  function syntheticCity(cityMeta) {
    const short = cityMeta.name.replace(/市$/, '');
    return {
      id: cityMeta.id,
      name: cityMeta.name,
      counties: [
        {
          id: cityMeta.id + '-main',
          name: short + '主城区',
          grids: [
            {
              id: cityMeta.id + '-g1',
              name: short + '网格01',
              communities: [
                { id: cityMeta.id + '-c1', name: short + '花园小区' },
                { id: cityMeta.id + '-c2', name: short + '中心社区' }
              ]
            },
            {
              id: cityMeta.id + '-g2',
              name: short + '网格02',
              communities: [{ id: cityMeta.id + '-c3', name: short + '新城小区' }]
            }
          ]
        },
        {
          id: cityMeta.id + '-dev',
          name: short + '开发区',
          grids: [
            {
              id: cityMeta.id + '-g3',
              name: short + '开发区网格',
              communities: [{ id: cityMeta.id + '-c4', name: short + '产业园小区' }]
            }
          ]
        }
      ]
    };
  }

  function resolveCityEntity(cityMeta) {
    const found = (window.JIANGXI_REGION?.cities || []).find(c => c.id === cityMeta.id);
    return found || syntheticCity(cityMeta);
  }

  function metricSnapshot(node) {
    const snap = {
      id: node.id,
      name: node.name,
      value: node.value,
      mom: node.mom,
      yoy: node.yoy,
      alert: node.status === 'alert' || node.alert === true
    };
    const target = getMetricTarget(snap);
    return { ...snap, ...target };
  }

  /** 是否为率类指标（展示/对比按达标率 %） */
  function isRateStyleMetric(metric) {
    const name = metric?.name || '';
    const v = String(metric?.value || '');
    return /%/.test(v) || /率|占比|份额|达标|渗透|完成度/.test(name);
  }

  /** 越低越好的率类指标（流失率、投诉率等） */
  function isLowerBetterMetric(metric) {
    const name = metric?.name || '';
    const v = String(metric?.value || '');
    return /%/.test(v) && parseFloat(v) < 30 && /流失|降档|离网|异常|预警|投诉|负面|退订/.test(name);
  }

  /**
   * 指标目标值：统一按达标率口径（非收入等绝对值目标）
   * @returns {{ targetNum: number, targetDisplay: string, lowerBetter: boolean, targetKind: string }}
   */
  function getMetricTarget(metric) {
    const lowerBetter = isLowerBetterMetric(metric);
    const h = hashStr(metric.id || metric.name || '');
    let targetNum;

    if (isRateStyleMetric(metric) && lowerBetter) {
      const base = parseFloat(String(metric.value)) || 12;
      targetNum = Math.round(Math.max(3, base * 0.88) * 10) / 10;
    } else {
      targetNum = 88 + (h % 9);
    }

    const targetDisplay = lowerBetter
      ? `≤ ${targetNum.toFixed(1)}%`
      : `≥ ${targetNum.toFixed(1)}%`;

    return {
      targetNum,
      targetDisplay,
      lowerBetter,
      targetKind: '达标率'
    };
  }

  /** 各地域达标率（用于与目标值比较；非率类指标也折算为达标率展示） */
  function complianceRateForRegion(metric, pathKey) {
    const parts = pathKey.split('|');
    const depth = parts.length;
    const depthFactor = { 1: 1, 2: 0.985, 3: 0.97, 4: 0.955 }[depth] || 0.94;
    const h = hashStr(metric.id + '|' + pathKey + '|' + periodSeed());

    if (isRateStyleMetric(metric) && /%/.test(String(metric.value || ''))) {
      if (depth === 1 && typeof window.buildMetricRegionRows === 'function') {
        const cityMeta = getCities().find(c => c.id === parts[0]);
        if (cityMeta) {
          const rows = window.buildMetricRegionRows(metric, {});
          const cityRow = rows.find(r => r.cityId === parts[0]);
          if (cityRow?.metricValNum != null) {
            const num = Math.round(Math.abs(cityRow.metricValNum) * depthFactor * 10) / 10;
            return { num, display: num.toFixed(1) + '%' };
          }
        }
      }
      const base = parseFloat(String(metric.value)) || 90;
      const jitter = (h % 100) / 10 - 5;
      const num = Math.round((base + jitter * 0.75) * depthFactor * 10) / 10;
      return { num, display: num.toFixed(1) + '%' };
    }

    const num = Math.round((73 + (h % 26) + (h % 7) / 10) * depthFactor * 10) / 10;
    return { num, display: num.toFixed(1) + '%' };
  }

  function meetsTarget(actualNum, targetNum, lowerBetter) {
    if (lowerBetter) return actualNum <= targetNum;
    return actualNum >= targetNum;
  }

  function valueCompareClass(actualNum, metric) {
    const target = getMetricTarget(metric);
    return meetsTarget(actualNum, target.targetNum, target.lowerBetter)
      ? ' val-above-target'
      : ' val-below-target';
  }

  function rowPathKey(level, ids) {
    return ids.filter(Boolean).join('|');
  }

  function appendGridSubtree(list, city, county, grid, baseIndent) {
    const gridKey = rowPathKey('grid', [city.id, county.id, grid.id]);
    list.push({
      level: 'grid',
      key: 'grid:' + gridKey,
      pathKey: gridKey,
      name: grid.name,
      indent: baseIndent,
      hasChildren: (grid.communities || []).length > 0
    });
    if (!expanded.has('grid:' + gridKey)) return;
    (grid.communities || []).forEach(comm => {
      const commKey = rowPathKey('community', [city.id, county.id, grid.id, comm.id]);
      list.push({
        level: 'community',
        key: 'community:' + commKey,
        pathKey: commKey,
        name: comm.name,
        indent: baseIndent + 1,
        hasChildren: false
      });
    });
  }

  function appendCountySubtree(list, city, county, baseIndent) {
    const countyKey = rowPathKey('county', [city.id, county.id]);
    list.push({
      level: 'county',
      key: 'county:' + countyKey,
      pathKey: countyKey,
      name: county.name,
      indent: baseIndent,
      hasChildren: (county.grids || []).length > 0
    });
    if (!expanded.has('county:' + countyKey)) return;
    (county.grids || []).forEach(grid => {
      appendGridSubtree(list, city, county, grid, baseIndent + 1);
    });
  }

  function appendCitySubtree(list, city, baseIndent) {
    const cityKey = rowPathKey('city', [city.id]);
    list.push({
      level: 'city',
      key: 'city:' + cityKey,
      pathKey: cityKey,
      name: city.name,
      indent: baseIndent,
      hasChildren: (city.counties || []).length > 0
    });
    if (!expanded.has('city:' + cityKey)) return;
    (city.counties || []).forEach(county => {
      appendCountySubtree(list, city, county, baseIndent + 1);
    });
  }

  function buildRegionRows() {
    if (activeRegionView?.mode === 'province-cities') {
      const list = [];
      getCities().forEach(cityMeta => {
        appendCitySubtree(list, resolveCityEntity(cityMeta), 0);
      });
      return list;
    }

    if (activeRegionView?.mode === 'city-counties') {
      const list = [];
      const cityId = activeRegionView.cityId || 'gz';
      const cityMeta = getCities().find(c => c.id === cityId) || { id: cityId, name: '赣州市' };
      const city = resolveCityEntity(cityMeta);
      (city.counties || []).forEach(county => {
        appendCountySubtree(list, city, county, 0);
      });
      return list;
    }

    const list = [];
    const drill = window.jxDrillState || {};
    let cities = getCities();
    if (drill.city) cities = cities.filter(c => c.id === drill.city.id);

    cities.forEach(cityMeta => {
      const city = resolveCityEntity(cityMeta);
      const cityKey = rowPathKey('city', [city.id]);
      list.push({
        level: 'city',
        key: 'city:' + cityKey,
        pathKey: cityKey,
        name: city.name,
        indent: 0,
        hasChildren: (city.counties || []).length > 0
      });
      if (!expanded.has('city:' + cityKey)) return;
      let counties = city.counties || [];
      if (drill.county) counties = counties.filter(c => c.id === drill.county.id);
      counties.forEach(county => {
        const countyKey = rowPathKey('county', [city.id, county.id]);
        list.push({
          level: 'county',
          key: 'county:' + countyKey,
          pathKey: countyKey,
          name: county.name,
          indent: 1,
          hasChildren: (county.grids || []).length > 0
        });
        if (!expanded.has('county:' + countyKey)) return;
        let grids = county.grids || [];
        if (drill.grid) grids = grids.filter(g => g.id === drill.grid.id);
        grids.forEach(grid => {
          const gridKey = rowPathKey('grid', [city.id, county.id, grid.id]);
          list.push({
            level: 'grid',
            key: 'grid:' + gridKey,
            pathKey: gridKey,
            name: grid.name,
            indent: 2,
            hasChildren: (grid.communities || []).length > 0
          });
          if (!expanded.has('grid:' + gridKey)) return;
          (grid.communities || []).forEach(comm => {
            const commKey = rowPathKey('community', [city.id, county.id, grid.id, comm.id]);
            list.push({
              level: 'community',
              key: 'community:' + commKey,
              pathKey: commKey,
              name: comm.name,
              indent: 3,
              hasChildren: false
            });
          });
        });
      });
    });
    return list;
  }

  function updateCartBadge() {
    const badge = document.getElementById('region-analysis-count');
    const fab = document.getElementById('btn-region-analysis');
    const n = cart.length;
    if (badge) {
      badge.textContent = String(n);
      badge.classList.toggle('is-zero', n === 0);
    }
    if (fab) fab.classList.toggle('has-items', n > 0);
  }

  function playFlyAnimation(fromEl) {
    const fab = document.getElementById('btn-region-analysis');
    if (!fromEl || !fab) return;
    const r1 = fromEl.getBoundingClientRect();
    const r2 = fab.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'region-cart-fly-ghost';
    ghost.innerHTML = '<i class="fas fa-map-marked-alt"></i>';
    document.body.appendChild(ghost);
    const size = 36;
    ghost.style.width = size + 'px';
    ghost.style.height = size + 'px';
    ghost.style.left = (r1.left + r1.width / 2 - size / 2) + 'px';
    ghost.style.top = (r1.top + r1.height / 2 - size / 2) + 'px';
    ghost.animate([
      {
        left: (r1.left + r1.width / 2 - size / 2) + 'px',
        top: (r1.top + r1.height / 2 - size / 2) + 'px',
        opacity: 1,
        transform: 'scale(1)'
      },
      {
        left: (r2.left + r2.width / 2 - size / 2) + 'px',
        top: (r2.top + r2.height / 2 - size / 2) + 'px',
        opacity: 0.15,
        transform: 'scale(0.35)'
      }
    ], { duration: 520, easing: 'cubic-bezier(0.22, 0.85, 0.25, 1)', fill: 'forwards' })
      .onfinish = () => {
        ghost.remove();
        fab.classList.add('region-analysis-bump');
        setTimeout(() => fab.classList.remove('region-analysis-bump'), 320);
      };
  }

  function readTemplates() {
    try {
      const raw = localStorage.getItem(TEMPLATE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeTemplates(list) {
    try {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function findNodeInTree(root, id) {
    if (!root) return null;
    if (root.id === id) return root;
    for (const c of root.children || []) {
      const f = findNodeInTree(c, id);
      if (f) return f;
    }
    return null;
  }

  /** 解析指标节点，供指标调度向导使用 */
  function resolveMetricNodeForDispatch(metricId) {
    const cartItem = cart.find(m => m.id === metricId);
    const treeNode = findNodeInTree(window._currentTreeRoot, metricId);
    if (treeNode) return treeNode;
    if (!cartItem) return null;
    return {
      id: cartItem.id,
      name: cartItem.name,
      value: cartItem.value,
      mom: cartItem.mom,
      yoy: cartItem.yoy,
      status: cartItem.alert ? 'alert' : 'normal',
      alert: cartItem.alert
    };
  }

  function openMetricDispatchFromRegion(metricId) {
    const node = resolveMetricNodeForDispatch(metricId);
    if (!node) {
      alert('未找到该指标，请返回指标树重新加入');
      return;
    }
    if (typeof window.openMetricDispatchWizard !== 'function') {
      alert('指标调度功能未加载');
      return;
    }
    window.openMetricDispatchWizard(node);
  }

  function renderTable() {
    const wrap = document.getElementById('region-analysis-table-wrap');
    const permHint = document.getElementById('region-analysis-perm-hint');
    if (!wrap) return;
    if (!cart.length) {
      if (permHint) permHint.hidden = true;
      wrap.innerHTML = '<div class="region-analysis-empty"><i class="fas fa-map"></i><p>请选择上方常用分析模板，或从指标树悬停菜单将指标加入地域分析</p></div>';
      return;
    }
    if (permHint) permHint.hidden = false;
    const regionRows = buildRegionRows();
    const metricCount = cart.length;
    const thead = `
      <tr>
        <th class="region-col-sticky region-col-name">地域</th>
        ${cart.map((m, i) => `
          <th class="region-metric-th${m.alert ? ' is-alert' : ''}"
              data-metric-idx="${i}"
              data-metric-id="${esc(m.id)}"
              title="${esc(m.name)}">
            <div class="region-metric-th-inner">
              <span class="region-metric-drag-handle" draggable="true" title="拖拽调整列顺序"><i class="fas fa-grip-vertical"></i></span>
              <div class="region-metric-th-meta">
                <span class="region-metric-title">${esc(m.name)}</span>
                <button type="button" class="region-metric-dispatch-link" data-dispatch-metric="${esc(m.id)}">指标调度</button>
              </div>
              <button type="button" class="region-metric-remove" data-remove-metric="${esc(m.id)}" title="移除此指标"><i class="fas fa-times"></i></button>
            </div>
          </th>`).join('')}
      </tr>`;
    const targetRow = `
      <tr class="region-row region-row-target">
        <td class="region-col-sticky region-col-name">
          <div class="region-name-cell region-target-name">
            <span class="region-name-text">目标值（全省）</span>
          </div>
        </td>
        ${cart.map(m => {
          const t = getMetricTarget(m);
          return `<td class="region-val-cell region-target-cell" title="${esc(m.name)} · 全省统一目标 ${esc(t.targetDisplay)}">
            <strong>${esc(t.targetDisplay)}</strong>
          </td>`;
        }).join('')}
      </tr>`;

    const tbody = regionRows.map(row => {
      const toggle = row.hasChildren
        ? `<button type="button" class="region-expand-btn${expanded.has(row.key) ? ' is-expanded' : ''}" data-toggle-key="${esc(row.key)}" aria-label="展开"><i class="fas fa-chevron-right"></i></button>`
        : '<span class="region-expand-placeholder"></span>';
      const levelTag = row.indent > 0 ? `<span class="region-level-tag">${LEVEL_LABELS[row.level]}</span>` : '';
      const cells = cart.map(m => {
        const { num, display } = complianceRateForRegion(m, row.pathKey);
        const cmpCls = valueCompareClass(num, m);
        return `<td class="region-val-cell${cmpCls}" title="达标率 ${esc(display)}"><strong>${esc(display)}</strong></td>`;
      }).join('');
      return `
        <tr class="region-row region-row-${row.level}" data-region-key="${esc(row.key)}">
          <td class="region-col-sticky region-col-name" style="--indent:${row.indent}">
            <div class="region-name-cell">${toggle}<span class="region-name-text">${esc(row.name)}</span>${levelTag}</div>
          </td>
          ${cells}
        </tr>`;
    }).join('');

    wrap.innerHTML = `
      <table class="data-table region-analysis-table" style="--metric-count:${metricCount}">
        <thead>${thead}</thead>
        <tbody>${targetRow}${tbody}</tbody>
      </table>`;

    wrap.querySelectorAll('[data-toggle-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.toggleKey;
        if (expanded.has(key)) expanded.delete(key);
        else expanded.add(key);
        renderTable();
      });
    });
    wrap.querySelectorAll('[data-remove-metric]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        removeMetric(btn.dataset.removeMetric);
        renderTable();
        updateCartBadge();
      });
    });
    wrap.querySelectorAll('[data-dispatch-metric]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openMetricDispatchFromRegion(btn.dataset.dispatchMetric);
      });
    });
    bindMetricColumnDrag(wrap);
  }

  function bindMetricColumnDrag(wrap) {
    let dragFromIdx = null;
    wrap.querySelectorAll('.region-metric-drag-handle').forEach(handle => {
      handle.addEventListener('dragstart', e => {
        const th = handle.closest('.region-metric-th');
        dragFromIdx = parseInt(th?.dataset.metricIdx, 10);
        if (isNaN(dragFromIdx)) return;
        e.dataTransfer.setData('text/plain', String(dragFromIdx));
        e.dataTransfer.effectAllowed = 'move';
        th?.classList.add('is-dragging');
      });
      handle.addEventListener('dragend', () => {
        dragFromIdx = null;
        wrap.querySelectorAll('.region-metric-th').forEach(t => {
          t.classList.remove('is-dragging', 'is-drag-over');
        });
      });
    });
    wrap.querySelectorAll('.region-metric-th').forEach(th => {
      th.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        th.classList.add('is-drag-over');
      });
      th.addEventListener('dragleave', e => {
        if (!th.contains(e.relatedTarget)) th.classList.remove('is-drag-over');
      });
      th.addEventListener('drop', e => {
        e.preventDefault();
        th.classList.remove('is-drag-over');
        const toIdx = parseInt(th.dataset.metricIdx, 10);
        const fromIdx = dragFromIdx ?? parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx === toIdx) return;
        const [item] = cart.splice(fromIdx, 1);
        cart.splice(toIdx, 0, item);
        renderTable();
      });
    });
  }

  function removeMetric(id) {
    const i = cart.findIndex(m => m.id === id);
    if (i >= 0) cart.splice(i, 1);
  }

  function setTreeContext(treeId, treeName) {
    currentTreeId = treeId || '';
    currentTreeName = treeName || '';
  }

  window.RegionAnalysis = {
    getCart() { return cart.map(m => ({ ...m })); },

    addMetric(node, sourceEl) {
      if (!node?.id) return false;
      setTreeContext(
        new URLSearchParams(location.search).get('id') || '',
        document.getElementById('page-title')?.textContent || ''
      );
      const exists = cart.some(m => m.id === node.id);
      if (exists) {
        playFlyAnimation(sourceEl);
        return false;
      }
      if (cart.length >= MAX_METRICS) {
        alert(`最多同时分析 ${MAX_METRICS} 个指标，请先移除部分指标`);
        return false;
      }
      activePresetId = '';
      activeRegionView = null;
      cart.push({
        ...metricSnapshot(node),
        treeId: currentTreeId,
        treeName: currentTreeName
      });
      updateCartBadge();
      playFlyAnimation(sourceEl);
      return true;
    },

    clearCart() {
      cart.length = 0;
      expanded.clear();
      activePresetId = '';
      activeRegionView = null;
      updateCartBadge();
      renderPresetTemplates();
      renderTable();
    },

    applyPreset(presetId) {
      const tpl = ensureTemplates().find(t => t.id === presetId);
      const root = window._currentTreeRoot;
      if (!tpl || !root) {
        alert('指标树尚未加载');
        return;
      }
      let ids = resolveTemplateMetricIds(tpl);
      if (!ids.length && tpl.metrics?.length) {
        ids = tpl.metrics.map(m => m.id);
      }
      if (!ids.length) {
        ids = collectMetricLeaves(root, [])
          .filter(n => n.status === 'alert' || n.alert)
          .slice(0, 6)
          .map(n => n.id);
      }
      if (!ids.length) {
        ids = collectMetricLeaves(root, []).slice(0, 6).map(n => n.id);
      }
      if (!ids.length) {
        alert('当前指标树未匹配到该模板指标，请手动加入');
        return;
      }
      cart.length = 0;
      expanded.clear();
      activePresetId = presetId;
      syncRegionViewFromTemplate(tpl);
      if (tpl.metrics?.length) {
        tpl.metrics.forEach(m => {
          const node = findNodeInTree(root, m.id);
          if (node) cart.push({ ...metricSnapshot(node), treeId: tpl.treeId || currentTreeId, treeName: tpl.treeName || currentTreeName });
          else cart.push({ ...m, treeId: tpl.treeId || currentTreeId, treeName: tpl.treeName || currentTreeName });
        });
      } else {
        ids.forEach(id => {
          const node = findNodeInTree(root, id);
          if (node) cart.push({ ...metricSnapshot(node), treeId: currentTreeId, treeName: currentTreeName });
        });
      }
      if (!activeRegionView) {
        getCities().forEach(c => expanded.add('city:' + c.id));
        if (window.jxDrillState?.city) {
          expanded.add('city:' + window.jxDrillState.city.id);
          if (window.jxDrillState.county) {
            expanded.add('county:' + rowPathKey('county', [window.jxDrillState.city.id, window.jxDrillState.county.id]));
          }
        }
      }
      updateCartBadge();
      renderPresetTemplates();
      renderTable();
    },

    refreshForContext() {
      renderTable();
    },

    openModal() {
      const modal = document.getElementById('modal-region-analysis');
      if (!modal) return;
      setTreeContext(
        new URLSearchParams(location.search).get('id') || '',
        document.getElementById('page-title')?.textContent || ''
      );
      renderPresetTemplates();
      renderTable();
      if (typeof openModal === 'function') openModal('modal-region-analysis');
      else modal.classList.add('show');
    },

    applyTemplate(templateId) {
      this.applyPreset(templateId);
    },

    saveTemplate() {
      if (!cart.length) {
        alert('请先加入至少一个指标再保存模板');
        return;
      }
      openTplForm('save');
    },

    init() {
      updateCartBadge();
      bindPresetTemplateEvents();
      document.getElementById('btn-region-tpl-form-confirm')?.addEventListener('click', confirmTplForm);
      const openPanel = () => this.openModal();
      document.getElementById('btn-region-analysis')?.addEventListener('click', openPanel);
      const params = new URLSearchParams(location.search);
      const tplId = params.get('regionTpl');
      if (tplId) {
        setTimeout(() => this.applyTemplate(tplId), 600);
      }
      if (params.get('regionAnalysis') === '1' && cart.length) {
        setTimeout(() => this.openModal(), 700);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const fab = document.getElementById('btn-region-analysis');
    if (!fab) return;
    if (!document.body.classList.contains('page-indicator-tree-detail')) {
      fab.remove();
      document.getElementById('modal-region-analysis')?.remove();
      return;
    }
    window.RegionAnalysis.init();
  });
})();
