/** 客群调度：省级按地市 / 地市按区县下钻拆分派发 */
(function () {
  const SEGMENT_CTX_KEY = 'jxSegmentDispatchCtx';
  const CITY_WEIGHTS = {
    nc: 0.18, gz: 0.16, jj: 0.12, sr: 0.11, yc: 0.10,
    ja: 0.09, fz: 0.08, jdz: 0.07, px: 0.05, xy: 0.04, yt: 0.04
  };

  let wizardState = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parseScaleNumber(label) {
    const m = String(label || '').replace(/,/g, '').match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 12840;
  }

  function formatScale(n) {
    return Math.max(100, Math.round(n)).toLocaleString('zh-CN') + ' 人';
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function isCountyMode(state) {
    return state?.mode === 'county';
  }

  function resolveTreeDetailId(raw) {
    const id = raw || '';
    if (!id) return '';
    return typeof window.resolveInsightTreeId === 'function' ? window.resolveInsightTreeId(id) : id;
  }

  function getReturnTreeDetailHref() {
    const id = wizardState?.treeId || window.getSegmentDispatchContext()?.treeId || '';
    if (id) return 'indicator-tree-detail.html?id=' + encodeURIComponent(id);
    return 'indicator-tree-detail.html';
  }

  function applySegmentDispatchBackLinks() {
    const href = getReturnTreeDetailHref();
    document.querySelectorAll('.segment-dispatch-back-tree').forEach(el => {
      el.setAttribute('href', href);
    });
  }

  function getAllCities() {
    if (typeof window.getAllJxCities === 'function') return window.getAllJxCities();
    if (window.JIANGXI_REGION?.cities?.length) {
      return window.JIANGXI_REGION.cities.map(c => ({ id: c.id, name: c.name }));
    }
    return [];
  }

  function getCityById(cityId) {
    return window.JIANGXI_REGION?.cities?.find(c => c.id === cityId) || null;
  }

  function getCountiesForCity(cityId) {
    const storeList = window.MetricDispatchStore?.getCityCounties?.(cityId) || [];
    const regionCity = getCityById(cityId);
    const regionList = (regionCity?.counties || []).map(c => ({ id: c.id, name: c.name }));
    const merged = [];
    const seen = new Set();
    [...storeList, ...regionList].forEach(c => {
      if (!c?.id || seen.has(c.id)) return;
      seen.add(c.id);
      merged.push({ id: c.id, name: c.name });
    });
    return merged;
  }

  function computeCityScale(totalScaleNum, cityId) {
    const cities = getAllCities();
    const weights = cities.map(c => CITY_WEIGHTS[c.id] || (1 / Math.max(cities.length, 1)));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    const idx = cities.findIndex(c => c.id === cityId);
    const ratio = idx >= 0 ? weights[idx] / sum : 1 / Math.max(cities.length, 1);
    return Math.max(100, Math.round(totalScaleNum * ratio));
  }

  window.normalizeSegmentDispatchAgg = function (agg) {
    if (!agg) return null;
    const scaleRaw = agg.scaleLabel || agg.scale;
    let scaleLabel = scaleRaw ? String(scaleRaw) : '';
    if (scaleLabel && !scaleLabel.includes('人')) scaleLabel += ' 人';
    if (!scaleLabel) scaleLabel = '12,840 人';

    const city = window.jxDrillState?.city;
    let drillLevel = agg.drillLevel || 'province';
    let cityId = agg.cityId || '';
    let cityName = agg.cityName || '';
    if (!cityId && city && !window.jxDrillState?.county) {
      drillLevel = 'city';
      cityId = city.id;
      cityName = city.name;
    }

    return {
      name: agg.name || agg.segmentName || '异动客群',
      scaleLabel,
      sourceMetric: agg.sourceMetric || agg.metricName || '',
      nodeId: agg.nodeId || agg.id || '',
      metricValue: agg.metricValue || '',
      metricMom: agg.metricMom || '',
      baseSegmentId: agg.baseSegmentId || '',
      treeId: agg.treeId || '',
      treeName: agg.treeName || '',
      drillLevel,
      cityId,
      cityName,
      drillPath: agg.drillPath || (cityName ? `江西省 › ${cityName}` : '江西省')
    };
  };

  window.saveSegmentDispatchContext = function (agg) {
    const normalized = window.normalizeSegmentDispatchAgg(agg);
    if (!normalized) return false;
    try {
      sessionStorage.setItem(SEGMENT_CTX_KEY, JSON.stringify(normalized));
      localStorage.setItem(SEGMENT_CTX_KEY, JSON.stringify(normalized));
      return true;
    } catch (e) {
      return false;
    }
  };

  window.getSegmentDispatchContext = function () {
    try {
      const raw = sessionStorage.getItem(SEGMENT_CTX_KEY) || localStorage.getItem(SEGMENT_CTX_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return window.normalizeSegmentDispatchAgg(parsed);
    } catch (e) {
      return null;
    }
  };

  window.navigateToSegmentDispatch = function (agg) {
    const data = agg || window._rcAggregatedSegment;
    if (!data) {
      window.alert('暂未生成异动客群，请从指标洞察异动指标进入');
      return;
    }
    const payload = { ...data };
    if (!payload.treeId) {
      const params = new URLSearchParams(location.search);
      const raw = params.get('id') || window.DEMO_SCENARIO?.treeId || '';
      if (raw) payload.treeId = resolveTreeDetailId(raw);
    }
    if (!payload.treeName) {
      payload.treeName = document.getElementById('breadcrumb-name')?.textContent || '指标树';
    }
    if (!window.saveSegmentDispatchContext(payload)) {
      window.alert('客群数据保存失败，请重试');
      return;
    }
    window.location.href = 'segment-dispatch.html';
  };

  function sortRegionRows(rows, key, dir) {
    const mult = dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (key === 'scale') return mult * (a.scaleNum - b.scaleNum);
      const pa = parseFloat(String(a.proportion));
      const pb = parseFloat(String(b.proportion));
      return mult * (pa - pb);
    });
  }

  function sortIcon(sortBy, sortDir, col) {
    if (sortBy !== col) return '<i class="fas fa-sort sort-muted" title="点击排序"></i>';
    return sortDir === 'asc'
      ? '<i class="fas fa-sort-up sort-active" title="升序，点击切换"></i>'
      : '<i class="fas fa-sort-down sort-active" title="降序，点击切换"></i>';
  }

  function renderSortTh(label, key) {
    const active = wizardState.sortKey === key;
    return `<th class="segment-sort-th${active ? ' is-active' : ''}" data-sort-key="${key}" role="button" tabindex="0" title="点击排序">
      ${label} ${sortIcon(wizardState.sortKey, wizardState.sortDir, key)}
    </th>`;
  }

  function buildCityRows(totalScaleNum, nodeId) {
    const cities = getAllCities();
    const weights = cities.map(c => CITY_WEIGHTS[c.id] || (1 / Math.max(cities.length, 1)));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    return cities.map((city, i) => {
      const ratio = weights[i] / sum;
      const scaleNum = Math.round(totalScaleNum * ratio);
      return {
        regionId: city.id,
        regionName: city.name,
        cityId: city.id,
        cityName: city.name,
        scaleNum,
        scaleLabel: formatScale(scaleNum),
        proportion: (ratio * 100).toFixed(1) + '%'
      };
    });
  }

  function buildCountyRows(cityId, cityName, totalScaleNum, nodeId) {
    const counties = getCountiesForCity(cityId);
    if (!counties.length) return [];
    const weights = counties.map(c => 0.8 + (hashStr(c.id + (nodeId || 'seg')) % 40) / 100);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    return counties.map((county, i) => {
      const ratio = weights[i] / sum;
      const scaleNum = Math.round(totalScaleNum * ratio);
      return {
        regionId: county.id,
        regionName: county.name,
        countyId: county.id,
        countyName: county.name,
        cityId,
        cityName,
        scaleNum,
        scaleLabel: formatScale(scaleNum),
        proportion: (ratio * 100).toFixed(1) + '%'
      };
    });
  }

  function defaultWorkOrderDue() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function normalizeWorkOrderDueDate(raw) {
    const val = String(raw || '').trim();
    if (!val) return '';
    return val.split('T')[0];
  }

  function getDefaultCityAssignee(cityId) {
    const def = window.MetricDispatchStore?.getCityCustodian?.(cityId);
    if (!def?.name) return null;
    return {
      id: def.id || `default-${cityId}`,
      name: def.name,
      org: def.org || '',
      dept: def.dept || def.org || '',
      role: def.role || '地市负责人',
      source: 'default'
    };
  }

  function getDefaultCountyAssignee(cityId, cityName, countyId) {
    const cityKey = (cityName || '').replace(/市$/, '');
    const pool = (window.MetricDispatchStore?.getStaffPool?.() || []).filter(u =>
      cityKey && (u.org || '').includes(cityKey)
    );
    if (pool.length) {
      const p = pool[hashStr(countyId) % pool.length];
      return {
        id: p.id,
        name: p.name,
        org: p.org || `${cityName}分公司`,
        dept: p.dept || p.org || '',
        role: p.role || '区县负责人',
        source: 'default'
      };
    }
    const cityDef = getDefaultCityAssignee(cityId);
    if (cityDef?.name) {
      return {
        ...cityDef,
        id: cityDef.id || `county-${countyId}`,
        role: '区县负责人'
      };
    }
    return null;
  }

  function getAssigneeInfo(regionId) {
    const saved = wizardState.assigneeInfo?.[regionId];
    if (saved?.name) return saved;
    const row = (wizardState.regionRows || []).find(r => r.regionId === regionId);
    if (!row) return null;
    if (isCountyMode(wizardState)) {
      return getDefaultCountyAssignee(row.cityId, row.cityName, row.countyId);
    }
    return getDefaultCityAssignee(row.cityId);
  }

  function getOrgUnitForCity(cityId, cityName) {
    const org = window.JX_ORG_SYSTEM;
    if (!org) return null;
    const unit = org.units.find(u => u.id === cityId);
    if (unit) return unit;

    const def = window.MetricDispatchStore?.getCityCustodian?.(cityId);
    const cityKey = (cityName || '').replace(/市$/, '');
    const pool = (window.MetricDispatchStore?.getStaffPool?.() || []).filter(u =>
      cityKey && (u.org || '').includes(cityKey)
    );
    const deptId = `${cityId}-default`;
    const syntheticPersons = [];
    if (def?.name) {
      syntheticPersons.push({
        id: def.id || `def-${cityId}`,
        name: def.name,
        role: def.role || '地市负责人',
        unitId: cityId,
        deptId
      });
    }
    pool.forEach(p => {
      if (!syntheticPersons.some(x => x.id === p.id)) {
        syntheticPersons.push({
          id: p.id,
          name: p.name,
          role: p.role || '区县负责人',
          unitId: cityId,
          deptId
        });
      }
    });
    return {
      id: cityId,
      name: cityName || '地市分公司',
      depts: [{ id: deptId, name: def?.dept || '市场经营部' }],
      _syntheticPersons: syntheticPersons
    };
  }

  function renderAssigneeCell(regionId) {
    const info = getAssigneeInfo(regionId);
    const name = info?.name || '未设置';
    return `
      <div class="dispatch-wo-assignee-display">
        <span class="dispatch-wo-assignee-name">${esc(name)}</span>
        <button type="button" class="btn-link btn-segment-change-assignee" data-region-id="${esc(regionId)}">修改</button>
      </div>`;
  }

  function ensureAssigneeModal() {
    if (document.getElementById('modal-segment-assignee-pick')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="modal-segment-assignee-pick">
        <div class="modal-box modal-dispatch-assignee-pick">
          <div class="modal-head">
            <strong id="segment-assignee-pick-title">选择工单接收人</strong>
            <button type="button" class="modal-close" data-close-modal="modal-segment-assignee-pick"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="dispatch-assignee-search">
              <i class="fas fa-search"></i>
              <input type="search" id="segment-assignee-search" placeholder="搜索姓名" autocomplete="off"/>
            </div>
            <div class="dispatch-assignee-org-tree" id="segment-assignee-org-tree"></div>
          </div>
        </div>
      </div>`);
    document.getElementById('segment-assignee-search')?.addEventListener('input', e => {
      if (wizardState?._pickerCityId) {
        renderAssigneeOrgTree(wizardState._pickerCityId, wizardState._pickerCityName, e.target.value);
      }
    });
  }

  function renderPersonBtn(person, org, unitOverride) {
    const unit = unitOverride || org.units.find(u => u.id === person.unitId);
    const dept = unit?.depts?.find(d => d.id === person.deptId);
    const meta = [unit?.name, dept?.name, person.role].filter(Boolean).join(' · ');
    return `<button type="button" class="dispatch-org-person" data-person-id="${esc(person.id)}">
      <span class="dispatch-org-person-name">${esc(person.name)}</span>
      <span class="dispatch-org-person-meta muted">${esc(meta)}</span>
    </button>`;
  }

  function bindPersonClicks(wrap, org) {
    wrap.querySelectorAll('.dispatch-org-person').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = org.persons.find(x => x.id === btn.dataset.personId)
          || wizardState?._pickerUnit?._syntheticPersons?.find(x => x.id === btn.dataset.personId);
        if (!p || !wizardState?._pickerRegionId) return;
        const unit = getOrgUnitForCity(wizardState._pickerCityId, wizardState._pickerCityName) || { name: '', depts: [] };
        const dept = unit.depts?.find(d => d.id === p.deptId);
        wizardState.assigneeInfo = wizardState.assigneeInfo || {};
        wizardState.assigneeInfo[wizardState._pickerRegionId] = {
          id: p.id,
          name: p.name,
          org: unit.name || '',
          dept: dept?.name || '',
          role: p.role || (isCountyMode(wizardState) ? '区县负责人' : '地市负责人'),
          source: 'org'
        };
        if (typeof closeModal === 'function') closeModal('modal-segment-assignee-pick');
        updateAssigneeCell(wizardState._pickerRegionId);
      });
    });
  }

  function renderAssigneeOrgTree(cityId, cityName, keyword) {
    const wrap = document.getElementById('segment-assignee-org-tree');
    const org = window.JX_ORG_SYSTEM;
    if (!wrap || !org) {
      if (wrap) wrap.innerHTML = '<p class="muted">组织架构数据未加载</p>';
      return;
    }
    const kw = (keyword || '').trim().toLowerCase();
    const unit = getOrgUnitForCity(cityId, cityName);
    wizardState._pickerUnit = unit;
    if (!unit) {
      wrap.innerHTML = '<p class="muted">暂无该地市组织架构</p>';
      return;
    }

    const unitPersons = unit._syntheticPersons || org.persons.filter(p => p.unitId === unit.id);
    let html = `<div class="dispatch-org-unit-head"><i class="fas fa-building"></i> ${esc(unit.name)}</div>`;

    if (kw) {
      const matched = unitPersons.filter(p => p.name.toLowerCase().includes(kw));
      const provMatched = org.persons.filter(p => p.unitId === 'jx-prov' && p.name.toLowerCase().includes(kw));
      if (!matched.length && !provMatched.length) {
        wrap.innerHTML = '<p class="muted" style="padding:16px;text-align:center">未找到匹配人员</p>';
        return;
      }
      if (matched.length) {
        html += `<div class="dispatch-org-dept">${esc(cityName || '本地市')}</div>`;
        matched.forEach(p => { html += renderPersonBtn(p, org, unit); });
      }
      if (provMatched.length) {
        html += '<div class="dispatch-org-dept">省公司</div>';
        provMatched.forEach(p => { html += renderPersonBtn(p, org); });
      }
      wrap.innerHTML = html;
      bindPersonClicks(wrap, org);
      return;
    }

    unit.depts.forEach(dept => {
      const persons = unitPersons.filter(p => p.deptId === dept.id);
      if (!persons.length) return;
      html += `<div class="dispatch-org-dept">${esc(dept.name)}</div>`;
      persons.forEach(p => { html += renderPersonBtn(p, org, unit); });
    });
    wrap.innerHTML = html || '<p class="muted" style="padding:16px;text-align:center">暂无可选人员</p>';
    bindPersonClicks(wrap, org);
  }

  function updateAssigneeCell(regionId) {
    const cell = document.querySelector(`tr[data-region-id="${regionId}"] .dispatch-wo-assignee-cell`);
    if (!cell) return;
    const info = getAssigneeInfo(regionId);
    const nameEl = cell.querySelector('.dispatch-wo-assignee-name');
    if (nameEl) nameEl.textContent = info?.name || '未设置';
  }

  function openAssigneePicker(regionId) {
    const row = (wizardState.selectedRegions || wizardState.regionRows || []).find(r => r.regionId === regionId);
    if (!row) return;
    ensureAssigneeModal();
    wizardState._pickerRegionId = regionId;
    wizardState._pickerCityId = row.cityId;
    wizardState._pickerCityName = row.cityName;
    const title = document.getElementById('segment-assignee-pick-title');
    const scopeLabel = isCountyMode(wizardState) ? row.countyName : row.cityName;
    if (title) title.textContent = `选择工单接收人 · ${scopeLabel}`;
    const search = document.getElementById('segment-assignee-search');
    if (search) search.value = '';
    renderAssigneeOrgTree(row.cityId, row.cityName, '');
    if (typeof openModal === 'function') openModal('modal-segment-assignee-pick');
    if (search) setTimeout(() => search.focus(), 200);
  }

  function bindSortHandlers(container, rerender) {
    container.querySelectorAll('.segment-sort-th').forEach(th => {
      const onSort = () => {
        const key = th.dataset.sortKey;
        if (!key) return;
        if (wizardState.sortKey === key) {
          wizardState.sortDir = wizardState.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          wizardState.sortKey = key;
          wizardState.sortDir = 'desc';
        }
        rerender();
      };
      th.addEventListener('click', onSort);
      th.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSort();
        }
      });
    });
  }

  function getStep1Copy() {
    if (isCountyMode(wizardState)) {
      return {
        hint: `已选择 ${wizardState.cityName}，按区县下钻客群规模，勾选需要调度的区县`,
        tableTitle: `${wizardState.cityName} · 区县客群分布`,
        unitLabel: '区县',
        nameCol: '区县'
      };
    }
    return {
      hint: '省级视角按地市下钻客群规模，勾选需要调度的地市',
      tableTitle: '江西省 · 地市客群分布',
      unitLabel: '地市',
      nameCol: '地市'
    };
  }

  function renderStep1() {
    const main = document.getElementById('segment-dispatch-main');
    const foot = document.getElementById('segment-dispatch-foot');
    if (!main || !wizardState) return;

    const rows = sortRegionRows(
      wizardState.regionRows || [],
      wizardState.sortKey || 'scale',
      wizardState.sortDir || 'desc'
    );
    const checked = wizardState.checkedRegionIds || [];
    const copy = getStep1Copy();

    main.innerHTML = `
      <div class="segment-dispatch-hero">
        <div class="segment-dispatch-hero-card">
          <span class="k">异动客群</span>
          <strong class="segment-dispatch-seg-name">${esc(wizardState.segmentName)}</strong>
          ${wizardState.sourceMetric ? `<p class="muted" style="margin:4px 0 0;font-size:12px">关联指标：${esc(wizardState.sourceMetric)}</p>` : ''}
          <p class="segment-dispatch-total-scale"><i class="fas fa-users"></i> 客群总规模 <strong>${esc(wizardState.scaleLabel)}</strong></p>
          <p class="muted segment-dispatch-hero-hint">${esc(copy.hint)}</p>
        </div>
      </div>
      <div class="segment-dispatch-table-section">
        <div class="segment-dispatch-table-head">
          <strong>${esc(copy.tableTitle)}</strong>
          <span class="muted segment-dispatch-select-count">已选 ${checked.length} / ${rows.length} 个${copy.unitLabel}</span>
        </div>
        <div class="table-scroll">
          <table class="data-table segment-dispatch-table">
            <thead>
              <tr>
                <th style="width:44px"><input type="checkbox" id="segment-region-check-all" ${checked.length === rows.length && rows.length ? 'checked' : ''}/></th>
                <th>${esc(copy.nameCol)}</th>
                ${renderSortTh('客群规模', 'scale')}
                ${renderSortTh('客群占比', 'proportion')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr data-region-id="${esc(r.regionId)}">
                  <td><input type="checkbox" class="segment-region-check" data-region-id="${esc(r.regionId)}"${checked.includes(r.regionId) ? ' checked' : ''}/></td>
                  <td><strong>${esc(r.regionName)}</strong></td>
                  <td><strong>${esc(r.scaleLabel)}</strong></td>
                  <td>${esc(r.proportion)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    foot.innerHTML = `
      <a href="${getReturnTreeDetailHref()}" class="btn btn-outline">取消</a>
      <button type="button" class="btn btn-primary" id="btn-segment-dispatch-next">下一步 <i class="fas fa-arrow-right"></i></button>`;

    bindSortHandlers(main, renderStep1);

    const checkAll = document.getElementById('segment-region-check-all');
    checkAll?.addEventListener('change', () => {
      wizardState.checkedRegionIds = checkAll.checked ? rows.map(r => r.regionId) : [];
      renderStep1();
    });
    main.querySelectorAll('.segment-region-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.regionId;
        const set = new Set(wizardState.checkedRegionIds || []);
        if (cb.checked) set.add(id);
        else set.delete(id);
        wizardState.checkedRegionIds = [...set];
        const head = main.querySelector('.segment-dispatch-select-count');
        if (head) head.textContent = `已选 ${wizardState.checkedRegionIds.length} / ${rows.length} 个${copy.unitLabel}`;
        if (checkAll) checkAll.checked = wizardState.checkedRegionIds.length === rows.length;
      });
    });
    document.getElementById('btn-segment-dispatch-next')?.addEventListener('click', () => {
      if (!wizardState.checkedRegionIds?.length) {
        window.alert(`请至少勾选一个${copy.unitLabel}`);
        return;
      }
      wizardState.selectedRegions = rows.filter(r => wizardState.checkedRegionIds.includes(r.regionId));
      renderStep2();
    });
  }

  function renderWoForm() {
    const titleVal = wizardState.workOrderTitle || `${wizardState.segmentName || '客群'} · 客群调度`;
    const descVal = wizardState.workOrderRemark || '';
    const dueVal = normalizeWorkOrderDueDate(wizardState.workOrderDueAt) || defaultWorkOrderDue();
    return `
      <div class="dispatch-wo-form">
        <div class="dispatch-wo-form-grid">
          <div class="form-field">
            <label>工单类型</label>
            <input type="text" class="dispatch-wo-readonly" readonly value="客群调度工单"/>
          </div>
          <div class="form-field">
            <label class="req" for="segment-dispatch-wo-title">工单标题</label>
            <input type="text" id="segment-dispatch-wo-title" value="${esc(titleVal)}"/>
          </div>
          <div class="form-field full">
            <label class="req" for="segment-dispatch-wo-desc">工单派发说明</label>
            <textarea id="segment-dispatch-wo-desc" rows="2" placeholder="请填写派发背景、协同要求等">${esc(descVal)}</textarea>
          </div>
          <div class="form-field">
            <label class="req" for="segment-dispatch-wo-due">工单完成日期</label>
            <input type="date" id="segment-dispatch-wo-due" value="${esc(dueVal)}"/>
          </div>
        </div>
      </div>`;
  }

  function renderStep2() {
    const main = document.getElementById('segment-dispatch-main');
    const foot = document.getElementById('segment-dispatch-foot');
    const regions = wizardState.selectedRegions || [];
    const reqs = wizardState.regionRequirements || {};
    const countyMode = isCountyMode(wizardState);

    main.innerHTML = `
      <div class="segment-dispatch-step2">
        ${renderWoForm()}
        <div class="dispatch-wo-table-section">
          <div class="dispatch-wo-table-head">
            <strong>${countyMode ? '区县工单明细' : '地市工单明细'}</strong>
            <span class="muted">已选 ${regions.length} 个${countyMode ? '区县' : '地市'} · 指派${countyMode ? '区县' : '地市'}负责人</span>
          </div>
          <div class="table-scroll dispatch-wo-table-wrap">
            <table class="data-table dispatch-wo-table">
              <thead>
                <tr>
                  <th>${countyMode ? '区县' : '地市'}</th>
                  <th>客群规模</th>
                  <th>客群占比</th>
                  <th style="min-width:140px">工单接收人</th>
                  <th style="min-width:220px">工单要求</th>
                </tr>
              </thead>
              <tbody>
                ${regions.map(r => `
                  <tr data-region-id="${esc(r.regionId)}">
                    <td><strong>${esc(r.regionName)}</strong></td>
                    <td><strong>${esc(r.scaleLabel)}</strong></td>
                    <td>${esc(r.proportion)}</td>
                    <td class="dispatch-wo-assignee-cell">${renderAssigneeCell(r.regionId)}</td>
                    <td>
                      <input type="text" class="dispatch-wo-requirement-input" name="region-req-${esc(r.regionId)}"
                             value="${esc(reqs[r.regionId] || '')}" placeholder="填写工单要求"/>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    foot.innerHTML = `
      <button type="button" class="btn btn-outline" id="btn-segment-dispatch-back"><i class="fas fa-arrow-left"></i> 上一步</button>
      <button type="button" class="btn btn-primary" id="btn-segment-dispatch-submit"><i class="fas fa-paper-plane"></i> 确认派发</button>`;

    main.querySelectorAll('.btn-segment-change-assignee').forEach(btn => {
      btn.addEventListener('click', () => openAssigneePicker(btn.dataset.regionId));
    });
    document.getElementById('btn-segment-dispatch-back')?.addEventListener('click', () => renderStep1());
    document.getElementById('btn-segment-dispatch-submit')?.addEventListener('click', submitDispatch);
  }

  function saveStep2Draft() {
    wizardState.workOrderTitle = document.getElementById('segment-dispatch-wo-title')?.value?.trim() || '';
    wizardState.workOrderRemark = document.getElementById('segment-dispatch-wo-desc')?.value?.trim() || '';
    wizardState.workOrderDueAt = normalizeWorkOrderDueDate(document.getElementById('segment-dispatch-wo-due')?.value || '');
    wizardState.regionRequirements = {};
    (wizardState.selectedRegions || []).forEach(r => {
      const input = document.querySelector(`input[name="region-req-${r.regionId}"]`);
      wizardState.regionRequirements[r.regionId] = input?.value?.trim() || '';
    });
  }

  function submitDispatch() {
    saveStep2Draft();
    const title = wizardState.workOrderTitle;
    const desc = wizardState.workOrderRemark;
    const due = wizardState.workOrderDueAt;
    if (!title) { window.alert('请输入工单标题'); return; }
    if (!desc) { window.alert('请输入工单派发说明'); return; }
    if (!due) { window.alert('请选择工单完成日期'); return; }

    const countyMode = isCountyMode(wizardState);
    const assignees = [];
    for (const r of wizardState.selectedRegions || []) {
      const info = getAssigneeInfo(r.regionId);
      if (!info?.name) {
        window.alert(`请为 ${r.regionName} 选择工单接收人`);
        return;
      }
      if (countyMode) {
        assignees.push({
          countyId: r.countyId,
          countyName: r.countyName,
          cityId: r.cityId,
          cityName: r.cityName,
          name: info.name,
          org: info.org || '',
          dept: info.dept || info.org || '',
          role: info.role || '区县负责人',
          userId: info.id
        });
      } else {
        assignees.push({
          cityId: r.cityId,
          cityName: r.cityName,
          name: info.name,
          org: info.org || '',
          dept: info.dept || info.org || '',
          role: info.role || '地市负责人',
          userId: info.id
        });
      }
    }

    const regions = wizardState.selectedRegions.map(r => {
      const remark = wizardState.regionRequirements?.[r.regionId] || '';
      if (countyMode) {
        return {
          countyId: r.countyId,
          countyName: r.countyName,
          cityId: r.cityId,
          cityName: r.cityName,
          scaleLabel: r.scaleLabel,
          proportion: r.proportion,
          countyRemark: remark
        };
      }
      return {
        cityId: r.cityId,
        cityName: r.cityName,
        scaleLabel: r.scaleLabel,
        proportion: r.proportion,
        cityRemark: remark
      };
    });

    const record = window.MetricDispatchStore?.create({
      dispatchMode: 'segment',
      segmentLevel: countyMode ? 'county' : 'city',
      workOrderType: '客群调度工单',
      workOrderTitle: title,
      workOrderDueAt: due,
      segmentName: wizardState.segmentName,
      scaleLabel: wizardState.scaleLabel,
      metricName: wizardState.sourceMetric || wizardState.segmentName,
      metricId: wizardState.nodeId || '',
      treeName: wizardState.treeName || '指标树',
      treeId: wizardState.treeId || '',
      regions,
      assignees,
      remark: desc,
      drillPath: wizardState.drillPath || (countyMode ? `江西省 › ${wizardState.cityName}` : '江西省')
    });

    if (!record) {
      window.alert('派发失败，请稍后重试');
      return;
    }
    if (window.CustomerSegmentStore?.syncFromDispatch) {
      window.CustomerSegmentStore.syncFromDispatch(record);
    }
    if (confirm(`已创建客群调度任务 ${record.id}，并拆分为 ${(record.subTasks || []).length} 个子任务。\n是否前往任务分类查看整体进度？`)) {
      window.location.href = 'task-category.html?detail=' + encodeURIComponent(record.id);
    } else {
      window.location.href = getReturnTreeDetailHref();
    }
  }

  function initWizard(agg) {
    const normalized = window.normalizeSegmentDispatchAgg(agg) || agg;
    const provinceScale = parseScaleNumber(normalized.scaleLabel);
    const countyMode = normalized.drillLevel === 'city' && !!normalized.cityId;
    let displayScale = provinceScale;
    let regionRows = [];

    if (countyMode) {
      displayScale = computeCityScale(provinceScale, normalized.cityId);
      regionRows = buildCountyRows(
        normalized.cityId,
        normalized.cityName,
        displayScale,
        normalized.nodeId
      );
    } else {
      regionRows = buildCityRows(provinceScale, normalized.nodeId);
    }

    wizardState = {
      mode: countyMode ? 'county' : 'province',
      segmentName: normalized.name || '异动客群',
      scaleLabel: formatScale(displayScale),
      sourceMetric: normalized.sourceMetric || '',
      nodeId: normalized.nodeId || '',
      treeId: normalized.treeId || '',
      treeName: normalized.treeName || '指标树',
      cityId: normalized.cityId || '',
      cityName: normalized.cityName || '',
      drillPath: normalized.drillPath || (countyMode ? `江西省 › ${normalized.cityName}` : '江西省'),
      regionRows,
      checkedRegionIds: [],
      selectedRegions: [],
      assigneeInfo: {},
      regionRequirements: {},
      workOrderTitle: '',
      workOrderRemark: '',
      workOrderDueAt: '',
      sortKey: 'scale',
      sortDir: 'desc'
    };
    applySegmentDispatchBackLinks();
    renderStep1();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('segment-dispatch-main')) return;
    const agg = window.getSegmentDispatchContext();
    if (!agg) {
      document.getElementById('segment-dispatch-main').innerHTML = `
        <div class="segment-dispatch-empty">
          <i class="fas fa-users-slash"></i>
          <p>未找到客群数据，请从指标洞察异动指标悬停菜单进入</p>
          <a href="indicator-insight.html" class="btn btn-outline">返回指标洞察</a>
          <a href="indicator-tree-detail.html" class="btn btn-primary segment-dispatch-back-tree">返回指标树</a>
        </div>`;
      applySegmentDispatchBackLinks();
      return;
    }
    initWizard(agg);
  });
})();
