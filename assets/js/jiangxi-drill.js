/** 江西省地域下钻：省 → 市 → 县 → 网格 → 小区（级联选择 + 账期） */
window.JIANGXI_REGION = {
  province: '江西省',
  cities: [
    {
      id: 'gz', name: '赣州市',
      counties: [
        { id: 'zg', name: '章贡区', grids: [{ id: 'g5', name: '章贡网格01', communities: [{ id: 'c6', name: '南门口小区' }] }] },
        { id: 'nk', name: '南康区', grids: [{ id: 'g5a', name: '南康网格01', communities: [{ id: 'c6a', name: '蓉江小区' }] }] },
        { id: 'gx', name: '赣县区', grids: [{ id: 'g5b', name: '赣县网格01', communities: [{ id: 'c6b', name: '梅林小区' }] }] },
        { id: 'xf', name: '信丰县', grids: [{ id: 'g5c', name: '信丰网格01', communities: [{ id: 'c6c', name: '嘉定小区' }] }] },
        { id: 'dy', name: '大余县', grids: [{ id: 'g5d', name: '大余网格01', communities: [{ id: 'c6d', name: '南安小区' }] }] },
        { id: 'rj', name: '瑞金市', grids: [{ id: 'g5e', name: '瑞金网格01', communities: [{ id: 'c6e', name: '红都小区' }] }] },
        { id: 'ln', name: '龙南市', grids: [{ id: 'g5f', name: '龙南网格01', communities: [{ id: 'c6f', name: '东江小区' }] }] },
        { id: 'yd', name: '于都县', grids: [{ id: 'g5g', name: '于都网格01', communities: [{ id: 'c6g', name: '贡江小区' }] }] }
      ]
    },
    {
      id: 'nc', name: '南昌市',
      counties: [
        {
          id: 'dh', name: '东湖区',
          grids: [
            { id: 'g1', name: '东湖网格01', communities: [{ id: 'c1', name: '紫金城小区' }, { id: 'c2', name: '阳明路小区' }] },
            { id: 'g2', name: '东湖网格02', communities: [{ id: 'c3', name: '青山湖花园' }] }
          ]
        },
        { id: 'xh', name: '西湖区', grids: [{ id: 'g3', name: '西湖网格01', communities: [{ id: 'c4', name: '绳金塔社区' }] }] }
      ]
    },
    { id: 'sr', name: '上饶市', counties: [{ id: 'xx', name: '信州区', grids: [{ id: 'g6', name: '信州网格01', communities: [{ id: 'c7', name: '三江花园' }] }] }] },
    { id: 'yc', name: '宜春市', counties: [{ id: 'yz', name: '袁州区', grids: [{ id: 'g7', name: '袁州网格01', communities: [{ id: 'c8', name: '明月小区' }] }] }] },
    {
      id: 'jj', name: '九江市',
      counties: [
        { id: 'xl', name: '浔阳区', grids: [{ id: 'g4', name: '浔阳网格01', communities: [{ id: 'c5', name: '甘棠小区' }] }] }
      ]
    },
    { id: 'ja', name: '吉安市', counties: [{ id: 'ja-main', name: '吉州主城区', grids: [{ id: 'ja-g1', name: '吉州网格01', communities: [{ id: 'ja-c1', name: '吉州花园小区' }] }] }] },
    { id: 'fz', name: '抚州市', counties: [{ id: 'fz-main', name: '临川主城区', grids: [{ id: 'fz-g1', name: '临川网格01', communities: [{ id: 'fz-c1', name: '临川花园小区' }] }] }] },
    { id: 'jdz', name: '景德镇市', counties: [{ id: 'jdz-main', name: '珠山主城区', grids: [{ id: 'jdz-g1', name: '珠山网格01', communities: [{ id: 'jdz-c1', name: '珠山花园小区' }] }] }] },
    { id: 'px', name: '萍乡市', counties: [{ id: 'px-main', name: '安源主城区', grids: [{ id: 'px-g1', name: '安源网格01', communities: [{ id: 'px-c1', name: '安源花园小区' }] }] }] },
    { id: 'xy', name: '新余市', counties: [{ id: 'xy-main', name: '渝水主城区', grids: [{ id: 'xy-g1', name: '渝水网格01', communities: [{ id: 'xy-c1', name: '渝水花园小区' }] }] }] },
    { id: 'yt', name: '鹰潭市', counties: [{ id: 'yt-main', name: '月湖主城区', grids: [{ id: 'yt-g1', name: '月湖网格01', communities: [{ id: 'yt-c1', name: '月湖花园小区' }] }] }] }
  ]
};

/** 各地市补充区县（演示用，与现有数据合并） */
const JX_EXTRA_COUNTIES = {
  nc: ['青云谱区', '青山湖区', '新建区', '红谷滩区', '南昌县', '进贤县', '安义县'],
  gz: ['宁都县', '兴国县', '会昌县', '寻乌县', '石城县', '上犹县', '崇义县', '定南县', '全南县', '安远县'],
  jj: ['濂溪区', '柴桑区', '瑞昌市', '共青城市', '庐山市', '武宁县', '修水县', '永修县', '德安县', '都昌县', '湖口县', '彭泽县'],
  sr: ['广丰区', '广信区', '玉山县', '铅山县', '横峰县', '弋阳县', '余干县', '鄱阳县', '万年县', '婺源县', '德兴市'],
  yc: ['樟树市', '丰城市', '高安市', '万载县', '上高县', '宜丰县', '靖安县', '铜鼓县', '奉新县'],
  ja: ['青原区', '井冈山市', '吉安县', '吉水县', '峡江县', '新干县', '永丰县', '泰和县', '遂川县', '万安县', '安福县', '永新县'],
  fz: ['东乡区', '南城县', '黎川县', '南丰县', '崇仁县', '乐安县', '宜黄县', '金溪县', '资溪县', '广昌县'],
  jdz: ['昌江区', '浮梁县', '乐平市'],
  px: ['湘东区', '莲花县', '上栗县', '芦溪县'],
  xy: ['分宜县'],
  yt: ['余江区', '贵溪市']
};

/** 仅含「主城区」占位区县的地市 → 完整区县列表 */
const JX_REPLACE_COUNTIES = {
  ja: ['吉州区', '青原区', '井冈山市', '吉安县', '吉水县', '峡江县', '新干县', '永丰县', '泰和县', '遂川县', '万安县', '安福县', '永新县'],
  fz: ['临川区', '东乡区', '南城县', '黎川县', '南丰县', '崇仁县', '乐安县', '宜黄县', '金溪县', '资溪县', '广昌县'],
  jdz: ['珠山区', '昌江区', '浮梁县', '乐平市'],
  px: ['安源区', '湘东区', '莲花县', '上栗县', '芦溪县'],
  xy: ['渝水区', '分宜县'],
  yt: ['月湖区', '余江区', '贵溪市']
};


function jxBuildGridsForCounty(countyName, countyId, count) {
  const n = count || 4;
  const stem = countyName.replace(/(区|县|市)$/, '');
  return Array.from({ length: n }, (_, i) => {
    const seq = String(i + 1).padStart(2, '0');
    const gid = `${countyId}-g${seq}`;
    return {
      id: gid,
      name: `${stem}网格${seq}`,
      communities: [{ id: `${gid}-c1`, name: `${stem}示范小区${seq}` }]
    };
  });
}

function jxMakeCounty(cityId, name, index) {
  const id = `${cityId}-c${String(index + 1).padStart(2, '0')}`;
  return { id, name, grids: jxBuildGridsForCounty(name, id, 4) };
}

function enrichJiangxiRegion() {
  if (!window.JIANGXI_REGION?.cities) return;
  window.JIANGXI_REGION.cities.forEach(city => {
    const onlyPlaceholder = city.counties?.length === 1 && /主城区/.test(city.counties[0]?.name || '');
    if (onlyPlaceholder && JX_REPLACE_COUNTIES[city.id]) {
      city.counties = JX_REPLACE_COUNTIES[city.id].map((name, i) => jxMakeCounty(city.id, name, i));
      return;
    }
    const existing = new Set((city.counties || []).map(c => c.name));
    const extras = JX_EXTRA_COUNTIES[city.id] || [];
    extras.forEach(name => {
      if (existing.has(name)) return;
      city.counties.push(jxMakeCounty(city.id, name, city.counties.length));
      existing.add(name);
    });
    (city.counties || []).forEach(county => {
      if (!county.grids?.length) {
        county.grids = jxBuildGridsForCounty(county.name, county.id, 4);
      } else if (county.grids.length < 4) {
        const stem = county.name.replace(/(区|县|市)$/, '');
        const base = county.grids.length;
        for (let i = base; i < 4; i++) {
          const seq = String(i + 1).padStart(2, '0');
          const gid = `${county.id}-g${seq}`;
          county.grids.push({
            id: gid,
            name: `${stem}网格${seq}`,
            communities: [{ id: `${gid}-c1`, name: `${stem}示范小区${seq}` }]
          });
        }
      }
    });
  });
}

enrichJiangxiRegion();

window.getJxCountiesForCity = function (cityId) {
  const city = window.JIANGXI_REGION?.cities?.find(c => c.id === cityId);
  return city?.counties || [];
};

window.getJxGridsForCounty = function (cityId, countyId) {
  const county = window.getJxCountiesForCity(cityId).find(c => c.id === countyId);
  return county?.grids || [];
};

window.jxDrillState = { city: null, county: null, grid: null, community: null };

const now = new Date();
window.jxDrillPeriod = {
  year: now.getFullYear(),
  month: now.getMonth() + 1
};

function notifyDrillChange() {
  if (typeof window.onJxDrillChange === 'function') window.onJxDrillChange(window.jxDrillState);
}

function notifyPeriodChange() {
  if (typeof window.onJxPeriodChange === 'function') window.onJxPeriodChange(window.jxDrillPeriod);
}

function resetDrill(level) {
  const s = window.jxDrillState;
  if (level === 'province') { s.city = s.county = s.grid = s.community = null; }
  else if (level === 'city') { s.county = s.grid = s.community = null; }
  else if (level === 'county') { s.grid = s.community = null; }
  else if (level === 'grid') { s.community = null; }
}

function fillSelect(sel, items, placeholder, selectedId) {
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(it => `<option value="${it.id}"${it.id === selectedId ? ' selected' : ''}>${it.name}</option>`).join('');
  sel.disabled = items.length === 0;
}

function syncStateFromSelects() {
  const s = window.jxDrillState;
  const cityId = document.getElementById('jx-cascade-city')?.value;
  const countyId = document.getElementById('jx-cascade-county')?.value;
  const gridId = document.getElementById('jx-cascade-grid')?.value;
  const commId = document.getElementById('jx-cascade-community')?.value;

  s.city = cityId ? JIANGXI_REGION.cities.find(c => c.id === cityId) : null;
  s.county = s.city && countyId ? s.city.counties.find(c => c.id === countyId) : null;
  s.grid = s.county && gridId ? s.county.grids.find(g => g.id === gridId) : null;
  s.community = s.grid && commId ? s.grid.communities.find(c => c.id === commId) : null;
}

function refreshCascadeSelects() {
  const s = window.jxDrillState;
  const citySel = document.getElementById('jx-cascade-city');
  const countySel = document.getElementById('jx-cascade-county');
  const gridSel = document.getElementById('jx-cascade-grid');
  const commSel = document.getElementById('jx-cascade-community');

  fillSelect(citySel, JIANGXI_REGION.cities, '选择地市', s.city?.id);
  fillSelect(countySel, s.city ? s.city.counties : [], '选择区县', s.county?.id);
  fillSelect(gridSel, s.county ? s.county.grids : [], '选择网格', s.grid?.id);
  fillSelect(commSel, s.grid ? s.grid.communities : [], '选择小区', s.community?.id);

  if (countySel) countySel.disabled = !s.city;
  if (gridSel) gridSel.disabled = !s.county;
  if (commSel) commSel.disabled = !s.grid;
}

function updateDrillBreadcrumb() {
  const el = document.getElementById('jx-drill-breadcrumb');
  if (!el) return;
  const s = window.jxDrillState;
  const crumbs = [{ level: 'province', label: JIANGXI_REGION.province }];
  if (s.city) crumbs.push({ level: 'city', label: s.city.name });
  if (s.county) crumbs.push({ level: 'county', label: s.county.name });
  if (s.grid) crumbs.push({ level: 'grid', label: s.grid.name });
  if (s.community) crumbs.push({ level: 'community', label: s.community.name });

  el.innerHTML = crumbs.map((c, i) => {
    const sep = i > 0 ? '<span class="jx-bc-sep">›</span>' : '';
    const isLast = i === crumbs.length - 1;
    return sep + (isLast
      ? `<span class="jx-bc-current">${c.label}</span>`
      : `<button type="button" class="jx-bc-link" data-reset="${c.level}">${c.label}</button>`);
  }).join('');

  el.querySelectorAll('[data-reset]').forEach(btn => {
    btn.addEventListener('click', () => {
      resetDrill(btn.dataset.reset);
      refreshCascadeSelects();
      updateDrillBreadcrumb();
      notifyDrillChange();
    });
  });
}

function bindRegionPanelToggle(bar) {
  const toggle = document.getElementById('jx-drill-region-toggle');
  const panel = document.getElementById('jx-drill-region-panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    toggle.setAttribute('aria-expanded', String(willOpen));
  });

  if (window._jxRegionPanelDocBound) return;
  window._jxRegionPanelDocBound = true;
  document.addEventListener('click', (e) => {
    const drillBar = document.getElementById('jx-drill-bar');
    const regionPanel = document.getElementById('jx-drill-region-panel');
    const regionToggle = document.getElementById('jx-drill-region-toggle');
    if (!drillBar || !regionPanel || !regionToggle) return;
    if (!drillBar.contains(e.target)) {
      regionPanel.hidden = true;
      regionToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function bindCascadeEvents(bar) {
  const citySel = document.getElementById('jx-cascade-city');
  const countySel = document.getElementById('jx-cascade-county');
  const gridSel = document.getElementById('jx-cascade-grid');
  const commSel = document.getElementById('jx-cascade-community');
  const periodInput = document.getElementById('jx-period-month');
  const resetBtn = document.getElementById('jx-drill-reset');

  const afterDrillChange = () => {
    updateDrillBreadcrumb();
    notifyDrillChange();
  };

  citySel?.addEventListener('change', () => {
    const id = citySel.value;
    resetDrill('province');
    window.jxDrillState.city = id ? JIANGXI_REGION.cities.find(c => c.id === id) : null;
    refreshCascadeSelects();
    afterDrillChange();
  });

  countySel?.addEventListener('change', () => {
    const id = countySel.value;
    resetDrill('city');
    window.jxDrillState.county = id && window.jxDrillState.city
      ? window.jxDrillState.city.counties.find(c => c.id === id) : null;
    refreshCascadeSelects();
    afterDrillChange();
  });

  gridSel?.addEventListener('change', () => {
    const id = gridSel.value;
    resetDrill('county');
    window.jxDrillState.grid = id && window.jxDrillState.county
      ? window.jxDrillState.county.grids.find(g => g.id === id) : null;
    refreshCascadeSelects();
    afterDrillChange();
  });

  commSel?.addEventListener('change', () => {
    const id = commSel.value;
    window.jxDrillState.community = id && window.jxDrillState.grid
      ? window.jxDrillState.grid.communities.find(c => c.id === id) : null;
    afterDrillChange();
  });

  periodInput?.addEventListener('change', () => {
    const val = periodInput.value;
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    window.jxDrillPeriod = { year: y, month: m };
    notifyPeriodChange();
  });

  resetBtn?.addEventListener('click', () => {
    resetDrill('province');
    refreshCascadeSelects();
    afterDrillChange();
    const panel = document.getElementById('jx-drill-region-panel');
    const toggle = document.getElementById('jx-drill-region-toggle');
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });

  if (!bar._jxDrillBound) {
    bar._jxDrillBound = true;
  }
}

function renderLegacyDrillBar(bar) {
  const s = window.jxDrillState;
  const parts = [{ level: 'province', label: JIANGXI_REGION.province, reset: () => resetDrill('province') }];
  if (s.city) parts.push({ level: 'city', label: s.city.name, reset: () => resetDrill('city') });
  if (s.county) parts.push({ level: 'county', label: s.county.name, reset: () => resetDrill('county') });
  if (s.grid) parts.push({ level: 'grid', label: s.grid.name, reset: () => resetDrill('grid') });
  if (s.community) parts.push({ level: 'community', label: s.community.name, reset: () => resetDrill('community') });

  let html = '<span class="drill-label">地域下钻：</span>';
  parts.forEach((p, i) => {
    if (i > 0) html += '<span class="sep">›</span>';
    const isLast = i === parts.length - 1;
    html += isLast
      ? `<span class="crumb-current">${p.label}</span>`
      : `<a href="#" data-reset="${p.level}">${p.label}</a>`;
  });

  function getNextLevelOptions() {
    if (!s.city) return { placeholder: '下钻至市 ▼', items: JIANGXI_REGION.cities.map(c => ({ id: c.id, name: c.name })) };
    if (!s.county) return { placeholder: '下钻至县 ▼', items: s.city.counties.map(c => ({ id: c.id, name: c.name })) };
    if (!s.grid) return { placeholder: '下钻至网格 ▼', items: s.county.grids.map(g => ({ id: g.id, name: g.name })) };
    if (!s.community) return { placeholder: '下钻至小区 ▼', items: s.grid.communities.map(c => ({ id: c.id, name: c.name })) };
    return null;
  }

  const next = getNextLevelOptions();
  if (next) {
    html += `<select class="drill-select" id="drill-next-select"><option value="">${next.placeholder}</option>`;
    next.items.forEach(it => { html += `<option value="${it.id}">${it.name}</option>`; });
    html += '</select>';
  } else {
    html += '<span class="drill-done"><i class="fas fa-check-circle"></i> 已至小区层级</span>';
  }
  if (s.city) {
    html += '<button type="button" class="btn btn-outline btn-drill-back" style="margin-left:auto;padding:4px 10px;font-size:12px"><i class="fas fa-undo"></i> 返回上级</button>';
  }

  bar.className = 'drill-path';
  bar.innerHTML = html;
  bar.querySelectorAll('a[data-reset]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      resetDrill(a.dataset.reset);
      renderJiangxiDrill();
      notifyDrillChange();
    });
  });
  const sel = document.getElementById('drill-next-select');
  if (sel) {
    sel.addEventListener('change', e => {
      const id = e.target.value;
      if (!id) return;
      if (!s.city) s.city = JIANGXI_REGION.cities.find(x => x.id === id);
      else if (!s.county) s.county = s.city.counties.find(x => x.id === id);
      else if (!s.grid) s.grid = s.county.grids.find(x => x.id === id);
      else if (!s.community) s.community = s.grid.communities.find(x => x.id === id);
      e.target.value = '';
      renderJiangxiDrill();
      notifyDrillChange();
    });
  }
  bar.querySelector('.btn-drill-back')?.addEventListener('click', () => {
    if (s.community) s.community = null;
    else if (s.grid) s.grid = null;
    else if (s.county) s.county = null;
    else if (s.city) s.city = null;
    renderJiangxiDrill();
    notifyDrillChange();
  });
}

function renderCompactDrillBar(bar, showTreeActions) {
  const p = window.jxDrillPeriod;
  const monthVal = `${p.year}-${String(p.month).padStart(2, '0')}`;
  const treeActions = showTreeActions ? `
        <span class="jx-toolbar-divider" aria-hidden="true"></span>
        <button type="button" class="btn btn-outline btn-sm" id="btn-tree-alert-list">
          <i class="fas fa-bell"></i> 异动指标
          <span class="jx-alert-count-badge" id="tree-alert-count-badge" hidden>0</span>
        </button>
        <button type="button" class="btn btn-outline btn-sm" id="btn-tree-anomaly-report"><i class="fas fa-file-lines"></i> 根因分析报告</button>
        <button type="button" class="btn btn-outline btn-sm" id="btn-tree-dispatch-records"><i class="fas fa-list-check"></i> 调度记录</button>` : '';

  bar.className = 'drill-path jx-drill-toolbar jx-drill-toolbar-compact';
  bar.innerHTML = `
    <div class="jx-drill-compact-row">
      <div class="jx-drill-region-wrap">
        <div class="jx-drill-region-chip">
          <i class="fas fa-location-dot jx-drill-region-icon" aria-hidden="true"></i>
          <span class="jx-drill-breadcrumb" id="jx-drill-breadcrumb"></span>
          <button type="button" class="btn btn-ghost btn-sm jx-drill-region-toggle" id="jx-drill-region-toggle" aria-expanded="false" aria-controls="jx-drill-region-panel">
            <i class="fas fa-sliders"></i> 切换地域
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-icon-only" id="jx-drill-reset" title="重置为全省" aria-label="重置为全省"><i class="fas fa-rotate-left"></i></button>
        </div>
        <div class="jx-drill-region-panel" id="jx-drill-region-panel" hidden>
          <div class="jx-cascade-group jx-cascade-group-compact">
            <select class="jx-cascade-select jx-cascade-select-compact" id="jx-cascade-city" aria-label="地市"></select>
            <span class="jx-cascade-sep"><i class="fas fa-chevron-right"></i></span>
            <select class="jx-cascade-select jx-cascade-select-compact" id="jx-cascade-county" aria-label="区县" disabled></select>
            <span class="jx-cascade-sep"><i class="fas fa-chevron-right"></i></span>
            <select class="jx-cascade-select jx-cascade-select-compact" id="jx-cascade-grid" aria-label="网格" disabled></select>
            <span class="jx-cascade-sep"><i class="fas fa-chevron-right"></i></span>
            <select class="jx-cascade-select jx-cascade-select-compact" id="jx-cascade-community" aria-label="小区" disabled></select>
          </div>
        </div>
      </div>
      <div class="jx-period-group jx-period-group-compact">
        <label class="jx-period-label-wrap" for="jx-period-month">
          <i class="fas fa-calendar-days"></i>
          <span>数据月份</span>
        </label>
        <input type="month" class="jx-period-input jx-period-input-compact" id="jx-period-month" value="${monthVal}" max="${monthVal}"/>
        ${treeActions}
      </div>
    </div>
  `;

  refreshCascadeSelects();
  bindCascadeEvents(bar);
  updateDrillBreadcrumb();
  bindRegionPanelToggle(bar);

  if (showTreeActions) {
    bar.querySelector('#btn-tree-alert-list')?.addEventListener('click', () => {
      if (typeof window.openTreeAlertMetricsModal === 'function') window.openTreeAlertMetricsModal();
    });
    bar.querySelector('#btn-tree-anomaly-report')?.addEventListener('click', () => {
      if (typeof window.openTreeAnomalyReportModal === 'function') window.openTreeAnomalyReportModal();
    });
    bar.querySelector('#btn-tree-dispatch-records')?.addEventListener('click', () => {
      if (typeof window.openTreeDispatchRecordsModal === 'function') window.openTreeDispatchRecordsModal();
    });
  }
}

window.renderJiangxiDrill = function () {
  const bar = document.getElementById('jx-drill-bar');
  if (!bar) return;

  const isTreeDetail = document.body.classList.contains('page-indicator-tree-detail');
  const isTrafficHome = document.body.classList.contains('page-traffic-home');
  if (!isTreeDetail && !isTrafficHome) {
    renderLegacyDrillBar(bar);
    return;
  }

  renderCompactDrillBar(bar, isTreeDetail);
};
