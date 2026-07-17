/** 指标地域异动分析 + 指标/策略调度弹窗 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.formatRegionNameWithAlert = function (name, alert) {
    if (!alert) return name || '';
    const base = String(name || '').replace(/【异动】$/, '');
    return `${base}【异动】`;
  };

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  const JX_CITY_ORDER = ['gz', 'nc', 'sr', 'yc', 'jj', 'ja', 'fz', 'jdz', 'px', 'xy', 'yt'];
  window.JX_CITY_ORDER = JX_CITY_ORDER;
  window.JX_CITY_ORDER_MAP = Object.fromEntries(JX_CITY_ORDER.map((id, i) => [id, i]));

  const ALL_JX_CITIES = [
    { id: 'gz', name: '赣州市' },
    { id: 'nc', name: '南昌市' },
    { id: 'sr', name: '上饶市' },
    { id: 'yc', name: '宜春市' },
    { id: 'jj', name: '九江市' },
    { id: 'ja', name: '吉安市' },
    { id: 'fz', name: '抚州市' },
    { id: 'jdz', name: '景德镇市' },
    { id: 'px', name: '萍乡市' },
    { id: 'xy', name: '新余市' },
    { id: 'yt', name: '鹰潭市' }
  ];

  const CITY_WEIGHTS = {
    nc: 0.18, gz: 0.16, jj: 0.12, sr: 0.11, yc: 0.10,
    ja: 0.09, fz: 0.08, jdz: 0.07, px: 0.05, xy: 0.04, yt: 0.04
  };

  window.getAllJxCities = function () {
    return ALL_JX_CITIES.map(c => ({ ...c }));
  };

  function getCities() {
    if (typeof window.getAllJxCities === 'function') return window.getAllJxCities();
    return ALL_JX_CITIES.map(c => ({ ...c }));
  }

  function isLowerBetterMetric(node, baseVal) {
    const name = node?.name || '';
    return /%/.test(baseVal) && parseFloat(baseVal) < 30
      && /流失|降档|离网|异常|预警|投诉/.test(name);
  }

  function calcProgressPct(metricValNum, targetValNum, lowerBetter) {
    if (!targetValNum) return 0;
    const raw = lowerBetter
      ? (targetValNum / Math.max(metricValNum, 0.01)) * 100
      : (metricValNum / targetValNum) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  function progressLevel(pct) {
    if (pct >= 100) return 'ok';
    if (pct >= 80) return 'warn';
    return 'bad';
  }

  function isUnachievedRow(row) {
    return (row?.targetProgress ?? 0) < 100;
  }

  function renderCustodianInfo(person, isDefault) {
    if (!person) return '';
    const org = person.org || '—';
    const dept = person.dept || '—';
    return `
      <div class="assign-custodian-info${isDefault ? ' is-default' : ''}">
        ${isDefault ? '<span class="badge badge-success">默认看管人</span>' : ''}
        <div class="custodian-detail-grid">
          <div class="custodian-detail-item"><span class="k">姓名</span><strong>${esc(person.name || '—')}</strong></div>
          <div class="custodian-detail-item"><span class="k">公司名称</span><span>${esc(org)}</span></div>
          <div class="custodian-detail-item"><span class="k">部门</span><span>${esc(dept)}</span></div>
        </div>
      </div>`;
  }

  function staffOptionLabel(u) {
    return `${u.name} · ${u.org} · ${u.dept || '—'}`;
  }

  function buildCityMetricRow(node, city, h, drillCity) {
    const baseVal = String(node?.value || '—');
    const isPctMetric = /%/.test(baseVal) && !/pp/.test(baseVal);
    const deltaSuffix = isPctMetric ? 'pp' : '%';
    const deltaDigits = isPctMetric ? 2 : 1;
    const momVal = ((h % 100) / 10 - 5.5) + (drillCity && drillCity.id === city.id ? -1.5 : 0);
    const mom = (momVal >= 0 ? '+' : '-') + Math.abs(momVal).toFixed(deltaDigits) + deltaSuffix;
    const yoyVal = ((h % 76) / 10 - 3.8) + (drillCity && drillCity.id === city.id ? -1.2 : 0);
    const yoy = (yoyVal >= 0 ? '+' : '-') + Math.abs(yoyVal).toFixed(deltaDigits) + deltaSuffix;
    const weight = CITY_WEIGHTS[city.id] || 0.08;
    const factor = 0.76 + (h % 44) / 100;
    const lowerBetter = isLowerBetterMetric(node, baseVal);

    let metricValNum;
    let targetValNum;
    let metricValue;
    let targetValue;

    if (/%/.test(baseVal)) {
      const base = parseFloat(baseVal) || 0;
      metricValNum = base + momVal / 10;
      metricValue = (metricValNum >= 0 ? '+' : '') + metricValNum.toFixed(1) + '%';
      targetValNum = lowerBetter ? base * 0.88 : base * 1.05;
      targetValue = (targetValNum >= 0 ? '' : '') + targetValNum.toFixed(1) + '%';
    } else if (/亿/.test(baseVal)) {
      const base = parseFloat(baseVal) || 1;
      metricValNum = base * weight * 11 * factor;
      targetValNum = metricValNum * (1.04 + (h % 12) / 100);
      metricValue = metricValNum.toFixed(2) + '亿';
      targetValue = targetValNum.toFixed(2) + '亿';
    } else if (/万/.test(baseVal)) {
      const base = parseFloat(baseVal) || 100;
      metricValNum = base * weight * 11 * factor;
      targetValNum = metricValNum * (1.04 + (h % 12) / 100);
      const mNum = Math.round(metricValNum);
      const tNum = Math.round(targetValNum);
      if (/¥|元/.test(baseVal)) {
        metricValue = '¥ ' + mNum.toLocaleString('zh-CN') + '万';
        targetValue = '¥ ' + tNum.toLocaleString('zh-CN') + '万';
      } else {
        metricValue = mNum.toLocaleString('zh-CN') + '万';
        targetValue = tNum.toLocaleString('zh-CN') + '万';
      }
    } else {
      metricValNum = (h % 50 + 10) + (h % 10) / 10;
      targetValNum = metricValNum * (1.06 + (h % 8) / 100);
      metricValue = metricValNum.toFixed(1);
      targetValue = targetValNum.toFixed(1);
    }

    const targetProgress = calcProgressPct(metricValNum, targetValNum, lowerBetter);
    const alert = node?.alert || node?.status === 'alert'
      ? h % 3 !== 2
      : momVal <= -2.2 || targetProgress < 80;

    return {
      cityId: city.id,
      cityName: city.name,
      metricValue,
      metricValNum,
      targetValue,
      targetValNum,
      targetProgress,
      progressLevel: progressLevel(targetProgress),
      mom,
      momVal,
      yoy,
      yoyVal,
      alert,
      selected: false
    };
  }

  window.buildMetricRegionRows = function (node, drillCtx) {
    const cities = getCities();
    const seed = hashStr((node?.id || '') + (drillCtx?.city?.id || 'jx'));
    const drillCity = drillCtx?.city;

    return cities.map(city => {
      const h = hashStr(city.id + seed);
      return buildCityMetricRow(node, city, h, drillCity);
    });
  };

  function sortRegionRows(rows, sortBy, sortDir) {
    const dir = sortDir === 'asc' ? 1 : -1;
    const cityOrderMap = window.JX_CITY_ORDER_MAP || {};
    return [...rows].sort((a, b) => {
      let av;
      let bv;
      if (sortBy === 'city') {
        av = cityOrderMap[a.cityId] ?? 99;
        bv = cityOrderMap[b.cityId] ?? 99;
        if (av === bv) return a.cityName.localeCompare(b.cityName, 'zh-CN');
        return (av - bv) * dir;
      }
      if (sortBy === 'metricValue') {
        av = a.metricValNum;
        bv = b.metricValNum;
      } else if (sortBy === 'targetValue') {
        av = a.targetValNum;
        bv = b.targetValNum;
      } else if (sortBy === 'targetProgress') {
        av = a.targetProgress;
        bv = b.targetProgress;
      } else if (sortBy === 'yoy') {
        av = a.yoyVal;
        bv = b.yoyVal;
      } else {
        av = a.momVal;
        bv = b.momVal;
      }
      if (av === bv) return a.cityName.localeCompare(b.cityName, 'zh-CN');
      return (av - bv) * dir;
    });
  }

  function renderTargetProgressCell(r) {
    return `
      <td class="metric-target-progress-cell">
        <div class="metric-target-progress-head">
          <span class="metric-target-pct is-${r.progressLevel}">${r.targetProgress}%</span>
        </div>
        <div class="metric-target-progress-track" title="达成 ${r.targetProgress}%">
          <div class="metric-target-progress-bar is-${r.progressLevel}" style="width:${r.targetProgress}%"></div>
        </div>
      </td>`;
  }

  function sortIcon(sortBy, sortDir, col) {
    if (sortBy !== col) return '<i class="fas fa-sort sort-muted"></i>';
    return sortDir === 'asc'
      ? '<i class="fas fa-sort-up sort-active"></i>'
      : '<i class="fas fa-sort-down sort-active"></i>';
  }

  window.renderMetricRegionSelectBody = function (node, options) {
    const opts = options || {};
    const selectable = opts.selectable !== false;
    const compact = !!opts.compact;
    const showTarget = opts.showTarget !== false && !compact;
    const sortBy = opts.sortBy || 'city';
    const sortDir = opts.sortDir || 'asc';
    const drillCtx = opts.drillCtx || {
      city: window.jxDrillState?.city || null,
      county: window.jxDrillState?.county || null
    };
    const sourceRows = opts.rows || window.buildMetricRegionRows(node, drillCtx);
    const rows = sortRegionRows(sourceRows, sortBy, sortDir);
    const alertCount = sourceRows.filter(r => r.alert).length;
    const normalCount = sourceRows.length - alertCount;
    const achievedCount = sourceRows.filter(r => r.targetProgress >= 100).length;
    const unachievedCount = sourceRows.length - achievedCount;
    const hideIntro = opts.hideIntro !== false && selectable;
    const hideAchievedStats = opts.hideAchievedStats ?? !showTarget;
    const hideSummary = opts.hideSummary === true || selectable;
    const hideToolbar = opts.hideToolbar === true || selectable;

    const checkedIds = opts.checkedIds || [];
    const hideStatusCol = selectable || !!opts.hideStatus;

    return `
      <div class="metric-region-panel${compact ? ' metric-region-panel-compact' : ''}${selectable ? ' metric-region-panel-wizard' : ''}" data-metric-region-panel>
        ${hideIntro ? '' : `<p class="metric-region-intro">指标 <strong>${esc(node?.name || '—')}</strong></p>`}
        ${hideSummary ? '' : `
        <div class="metric-region-summary metric-region-summary-4${hideAchievedStats ? ' metric-region-summary-2' : ''}">
          <div class="metric-region-stat"><span class="k">正常城市</span><span class="v">${normalCount} 个</span></div>
          <div class="metric-region-stat"><span class="k">异动城市</span><span class="v text-alert">${alertCount} 个</span></div>
          ${hideAchievedStats ? '' : `
          <div class="metric-region-stat"><span class="k">达成指标城市</span><span class="v text-ok">${achievedCount} 个</span></div>
          <div class="metric-region-stat"><span class="k">未达成指标城市</span><span class="v text-warn">${unachievedCount} 个</span></div>`}
        </div>`}
        ${selectable && !hideToolbar ? `
          <div class="metric-region-toolbar">
            <label><input type="checkbox" id="region-select-all-alert"/> 勾选全部异动指标</label>
            <label><input type="checkbox" id="region-select-all-unachieved"/> 勾选全部不达标指标</label>
            <span class="metric-region-toolbar-hint">共 ${rows.length} 个地市 · 点击表头可排序</span>
          </div>` : ''}
        <div class="table-scroll metric-region-table-wrap">
          <table class="data-table metric-region-table metric-region-unified-table">
            <thead>
              <tr>
                ${selectable ? '<th style="width:44px"><span class="sr-only">选择</span></th>' : ''}
                <th class="metric-region-sort-th${sortBy === 'city' ? ' is-active' : ''}" data-sort-col="city">
                  地市 ${sortIcon(sortBy, sortDir, 'city')}
                </th>
                <th class="metric-region-sort-th${sortBy === 'metricValue' ? ' is-active' : ''}" data-sort-col="metricValue">
                  指标值 ${sortIcon(sortBy, sortDir, 'metricValue')}
                </th>
                <th class="metric-region-sort-th${sortBy === 'yoy' ? ' is-active' : ''}" data-sort-col="yoy">
                  同比 ${sortIcon(sortBy, sortDir, 'yoy')}
                </th>
                <th class="metric-region-sort-th${sortBy === 'mom' ? ' is-active' : ''}" data-sort-col="mom">
                  环比 ${sortIcon(sortBy, sortDir, 'mom')}
                </th>
                ${showTarget ? `
                <th class="metric-region-sort-th${sortBy === 'targetValue' ? ' is-active' : ''}" data-sort-col="targetValue">
                  目标值 ${sortIcon(sortBy, sortDir, 'targetValue')}
                </th>
                <th class="metric-region-sort-th${sortBy === 'targetProgress' ? ' is-active' : ''}" data-sort-col="targetProgress" style="min-width:120px">
                  达成进度 ${sortIcon(sortBy, sortDir, 'targetProgress')}
                </th>` : ''}
                ${hideStatusCol ? '' : '<th style="width:72px">状态</th>'}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr class="${selectable ? '' : (r.alert ? 'row-alert' : '')}" data-city-id="${esc(r.cityId)}">
                  ${selectable ? `<td><input type="checkbox" class="region-row-check" data-city-id="${esc(r.cityId)}"${checkedIds.includes(r.cityId) ? ' checked' : ''}/></td>` : ''}
                  <td class="city-name-cell"><strong>${esc(r.cityName)}</strong></td>
                  <td><strong>${esc(r.metricValue)}</strong></td>
                  <td><span class="badge ${r.yoyVal < 0 ? 'badge-danger' : 'badge-success'}">${esc(r.yoy || '—')}</span></td>
                  <td><span class="badge ${r.momVal < 0 ? 'badge-danger' : 'badge-success'}">${esc(r.mom)}</span></td>
                  ${showTarget ? `<td><span class="metric-target-val">${esc(r.targetValue)}</span></td>${renderTargetProgressCell(r)}` : ''}
                  ${hideStatusCol ? '' : `<td>${r.alert ? '<span class="badge badge-danger">异动</span>' : '<span class="muted">正常</span>'}</td>`}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  };

  function collectCheckedCityIds(root) {
    return [...(root?.querySelectorAll('.region-row-check:checked') || [])].map(cb => cb.dataset.cityId);
  }

  function metricRegionSelectOpts(state, extra) {
    const opts = extra || {};
    return {
      selectable: state.selectable !== false,
      compact: !!state.compact,
      showTarget: state.showTarget !== false && !state.compact,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      rows: state.regionRows,
      drillCtx: state.drillCtx,
      hideSummary: state.hideSummary === true || state.selectable !== false,
      hideToolbar: state.hideToolbar === true || state.selectable !== false,
      hideAchievedStats: state.hideAchievedStats,
      checkedIds: opts.checkedIds,
      ...opts
    };
  }

  function bindMetricRegionSelectEvents(panel, state, onChange) {
    if (!panel) return;

    panel.querySelector('#region-select-all-alert')?.addEventListener('change', e => {
      const on = e.target.checked;
      const other = panel.querySelector('#region-select-all-unachieved');
      if (on && other) other.checked = false;
      panel.querySelectorAll('.region-row-check').forEach(cb => {
        const row = state.regionRows.find(r => r.cityId === cb.dataset.cityId);
        if (row?.alert) cb.checked = on;
      });
    });

    panel.querySelector('#region-select-all-unachieved')?.addEventListener('change', e => {
      const on = e.target.checked;
      const other = panel.querySelector('#region-select-all-alert');
      if (on && other) other.checked = false;
      panel.querySelectorAll('.region-row-check').forEach(cb => {
        const row = state.regionRows.find(r => r.cityId === cb.dataset.cityId);
        if (row && isUnachievedRow(row)) cb.checked = on;
      });
    });

    panel.querySelectorAll('.metric-region-sort-th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sortCol;
        if (!col) return;
        if (state.sortBy === col) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else {
          state.sortBy = col;
          state.sortDir = (col === 'mom' || col === 'city') ? 'asc' : col === 'targetProgress' ? 'desc' : 'desc';
        }
        const checkedIds = collectCheckedCityIds(panel);
        const host = panel.parentElement;
        if (!host) return;
        panel.outerHTML = window.renderMetricRegionSelectBody(state.node, metricRegionSelectOpts(state, { checkedIds }));
        bindMetricRegionSelectEvents(host.querySelector('[data-metric-region-panel]'), state, onChange);
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  window.renderInlineSegmentPortrait = function (node, containerId) {
    const el = document.getElementById(containerId || 'metric-segment-portrait-inline');
    if (!el || !node) return;
    const drillCtx = { city: window.jxDrillState?.city || null };
    const state = {
      node,
      drillCtx,
      regionRows: window.buildMetricRegionRows(node, drillCtx),
      sortBy: 'city',
      sortDir: 'asc',
      selectable: false,
      compact: true,
      hideSummary: true,
      hideToolbar: true,
      hideAchievedStats: true
    };
    el.innerHTML = `
      <div class="segment-inline-portrait-block segment-inline-portrait-compact">
        <h4 class="segment-block-title"><i class="fas fa-map-location-dot"></i> 客群画像分析 · 地市维度</h4>
        ${window.renderMetricRegionSelectBody(node, metricRegionSelectOpts(state))}
      </div>`;
    bindMetricRegionSelectEvents(el.querySelector('[data-metric-region-panel]'), state);
  };

  let wizardState = null;

  function dispatchModeLabel(mode) {
    return mode === 'dept' ? '跨部门调度' : '跨地市调度';
  }

  function woStatusBadge(st) {
    const labels = window.MetricDispatchStore?.STATUS_LABELS || {};
    const text = labels[st] || st || '—';
    const map = {
      pending_claim: 'badge-warning',
      claimed: 'badge-success',
      collaborating: 'badge-info',
      redispatched: 'badge-info',
      running: 'badge-success',
      pending: 'badge-warning',
      done: 'badge-info',
      completed: 'badge-info'
    };
    return `<span class="badge ${map[st] || 'badge-secondary'}">${esc(text)}</span>`;
  }

  function clearWizardModeStepLayout(body) {
    body?.classList.remove('dispatch-wizard-mode-step');
  }

  function syncDispatchModeSelection(body, mode) {
    wizardState.dispatchMode = mode === 'dept' ? 'dept' : 'city';
    body.querySelectorAll('.dispatch-mode-card').forEach(card => {
      const isOn = card.querySelector('input[name="dispatch-mode"]')?.value === wizardState.dispatchMode;
      card.classList.toggle('is-selected', isOn);
      card.setAttribute('aria-checked', isOn ? 'true' : 'false');
      const input = card.querySelector('input[name="dispatch-mode"]');
      if (input) input.checked = isOn;
    });
  }

  function renderDispatchWizardStepBar(activeStep) {
    const isDept = wizardState?.dispatchMode === 'dept';
    const cityDirect = wizardState?.cityDirect;
    const steps = isDept
      ? [
          { key: 0, label: '选择调度方式' },
          { key: 1, label: '选择部门' }
        ]
      : cityDirect
        ? [
            { key: 1, label: '选择地市' },
            { key: 2, label: '确认派发' }
          ]
        : [
            { key: 0, label: '选择调度方式' },
            { key: 1, label: '选择地市' },
            { key: 2, label: '确认派发' }
          ];
    return `<div class="dispatch-wizard-steps" role="list">${steps.map((s, i) => {
      const cls = s.key < activeStep ? 'done' : s.key === activeStep ? 'active' : '';
      return `<div class="dw-step ${cls}" role="listitem">
        <span class="dw-step-num">${i + 1}</span>
        <span class="dw-step-label">${esc(s.label)}</span>
      </div>`;
    }).join('')}</div>`;
  }

  function renderDispatchWizardMetricHero() {
    const node = wizardState?.node;
    if (!node) return '';
    const mom = node.mom || '—';
    const momNum = parseFloat(String(mom).replace(/[^0-9.-]/g, '')) || 0;
    return `
      <div class="dispatch-wizard-metric-hero">
        <div class="dwm-hero-main">
          <span class="dwm-hero-label">调度指标</span>
          <strong class="dwm-hero-name">${esc(node.name)}</strong>
        </div>
        <div class="dwm-hero-stats">
          <div class="dwm-stat"><span class="k">全省指标值</span><span class="v">${esc(node.value || '—')}</span></div>
          <div class="dwm-stat"><span class="k">环比</span><span class="v ${momNum < 0 ? 'is-down' : 'is-up'}">${esc(mom)}</span></div>
        </div>
      </div>`;
  }

  function refreshWizardStepBar(body, activeStep) {
    const bar = body?.querySelector('.dispatch-wizard-steps');
    if (!bar) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = renderDispatchWizardStepBar(activeStep);
    bar.replaceWith(wrap.firstElementChild);
  }

  function bindDispatchModeStepInteractions(body) {
    const cards = [...body.querySelectorAll('.dispatch-mode-card')];

    function selectMode(mode) {
      syncDispatchModeSelection(body, mode);
      refreshWizardStepBar(body, 0);
    }

    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        const val = card.querySelector('input[name="dispatch-mode"]')?.value;
        if (val) selectMode(val);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const val = card.querySelector('input[name="dispatch-mode"]')?.value;
          if (val) selectMode(val);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          cards[(idx + 1) % cards.length]?.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          cards[(idx - 1 + cards.length) % cards.length]?.focus();
        }
      });
    });

    body.querySelectorAll('input[name="dispatch-mode"]').forEach(r => {
      r.addEventListener('change', () => selectMode(r.value));
    });
  }

  function renderWizardStep0() {
    const body = document.getElementById('metric-dispatch-wizard-body');
    const foot = document.getElementById('metric-dispatch-wizard-foot');
    if (!body || !wizardState?.node) return;

    body.classList.add('dispatch-wizard-mode-step');
    const deptSel = wizardState.dispatchMode === 'dept';
    body.innerHTML = `
      <div class="dispatch-wizard-shell dispatch-wizard-shell--mode">
        ${renderDispatchWizardStepBar(0)}
        ${renderDispatchWizardMetricHero()}
        <div class="dispatch-mode-step" role="radiogroup" aria-label="选择调度方式">
          <p class="dispatch-mode-intro">请选择调度范围：跨部门面向部门主管协同，跨地市按地市勾选并指派看管人。</p>
          <div class="dispatch-mode-cards dispatch-mode-cards-compact">
            <label class="dispatch-mode-card${deptSel ? ' is-selected' : ''}" tabindex="0" aria-checked="${deptSel}">
              <input type="radio" name="dispatch-mode" value="dept"${deptSel ? ' checked' : ''}/>
              <span class="dispatch-mode-card-check" aria-hidden="true"><i class="fas fa-check"></i></span>
              <span class="dispatch-mode-card-icon dept"><i class="fas fa-building"></i></span>
              <span class="dispatch-mode-card-text">
                <span class="dispatch-mode-card-label">跨部门调度</span>
                <span class="dispatch-mode-card-desc">向部门主管派发协同核查任务</span>
              </span>
            </label>
            <label class="dispatch-mode-card${!deptSel ? ' is-selected' : ''}" tabindex="0" aria-checked="${!deptSel}">
              <input type="radio" name="dispatch-mode" value="city"${!deptSel ? ' checked' : ''}/>
              <span class="dispatch-mode-card-check" aria-hidden="true"><i class="fas fa-check"></i></span>
              <span class="dispatch-mode-card-icon city"><i class="fas fa-map-location-dot"></i></span>
              <span class="dispatch-mode-card-text">
                <span class="dispatch-mode-card-label">跨地市调度</span>
                <span class="dispatch-mode-card-desc">勾选异动或关注地市并指派负责人</span>
              </span>
            </label>
          </div>
        </div>
      </div>`;

    foot.innerHTML = `
      <button type="button" class="btn btn-outline" data-close-modal="modal-metric-dispatch">取消</button>
      <button type="button" class="btn btn-primary" id="btn-metric-dispatch-mode-next">下一步 <i class="fas fa-arrow-right"></i></button>`;

    bindDispatchModeStepInteractions(body);
    body.querySelector('.dispatch-mode-card.is-selected')?.focus();

    document.getElementById('btn-metric-dispatch-mode-next')?.addEventListener('click', () => {
      const sel = body.querySelector('input[name="dispatch-mode"]:checked');
      wizardState.dispatchMode = sel?.value === 'dept' ? 'dept' : 'city';
      clearWizardModeStepLayout(body);
      if (wizardState.dispatchMode === 'dept') renderWizardDeptStep2();
      else renderWizardStep1();
    });
  }

  function renderWizardDeptStep2() {
    const body = document.getElementById('metric-dispatch-wizard-body');
    const foot = document.getElementById('metric-dispatch-wizard-foot');
    clearWizardModeStepLayout(body);
    const node = wizardState.node;
    const pool = window.MetricDispatchStore?.getDeptSupervisorPool() || [];
    const byDept = {};
    pool.forEach(u => {
      if (!byDept[u.dept]) byDept[u.dept] = [];
      byDept[u.dept].push(u);
    });
    const checked = wizardState.deptUserIds || [];

    body.innerHTML = `
      <div class="dispatch-wizard-shell dispatch-wizard-shell--fill">
        ${renderDispatchWizardStepBar(1)}
        ${renderDispatchWizardMetricHero()}
        <div class="dispatch-dept-panel dispatch-wizard-fill">
        <p class="dispatch-step-caption">跨部门调度 · 已选 <strong id="dept-pick-count">${checked.length}</strong> 人</p>
        <div class="dispatch-dept-toolbar">
          <label><input type="checkbox" id="dept-select-all-coc"/> 全选客户运营中心</label>
        </div>
        <div class="dispatch-dept-groups">
          ${Object.keys(byDept).map(dept => `
            <div class="dispatch-dept-group">
              <div class="dispatch-dept-group-title">${esc(dept)}</div>
              <div class="dispatch-dept-user-list">
                ${byDept[dept].map(u => `
                  <label class="dispatch-dept-user-chip">
                    <input type="checkbox" class="dept-user-check" value="${esc(u.id)}" data-dept="${esc(u.dept)}"${checked.includes(u.id) ? ' checked' : ''}/>
                    <span class="name">${esc(u.name)}</span>
                    <span class="sub">${esc(u.role)}</span>
                  </label>`).join('')}
              </div>
            </div>`).join('')}
        </div>
        <div class="form-field full dispatch-dept-remark">
          <label>派发说明</label>
          <textarea id="metric-dispatch-remark-dept" rows="2" placeholder="请各部门协同核查指标异动原因与改善举措">${esc(wizardState.globalRemark || '')}</textarea>
        </div>
        </div>
      </div>`;

    foot.innerHTML = `
      <button type="button" class="btn btn-outline" id="btn-metric-dispatch-dept-back"><i class="fas fa-arrow-left"></i> 上一步</button>
      <button type="button" class="btn btn-primary" id="btn-metric-dispatch-dept-submit"><i class="fas fa-paper-plane"></i> 确认派发</button>`;

    function syncCount() {
      const ids = [...body.querySelectorAll('.dept-user-check:checked')].map(cb => cb.value);
      wizardState.deptUserIds = ids;
      const el = document.getElementById('dept-pick-count');
      if (el) el.textContent = String(ids.length);
    }

    body.querySelectorAll('.dept-user-check').forEach(cb => cb.addEventListener('change', syncCount));

    body.querySelector('#dept-select-all-coc')?.addEventListener('change', e => {
      const on = e.target.checked;
      body.querySelectorAll('.dept-user-check[data-dept="客户运营中心"]').forEach(cb => { cb.checked = on; });
      syncCount();
    });

    document.getElementById('btn-metric-dispatch-dept-back')?.addEventListener('click', () => renderWizardStep0());

    document.getElementById('btn-metric-dispatch-dept-submit')?.addEventListener('click', () => {
      syncCount();
      const ids = wizardState.deptUserIds || [];
      if (!ids.length) {
        alert('请至少选择一位部门主管');
        return;
      }
      const poolAll = window.MetricDispatchStore.getDeptSupervisorPool();
      const deptAssignees = ids.map(id => poolAll.find(x => x.id === id)).filter(Boolean);
      const treeName = document.getElementById('page-title')?.textContent || '指标树';
      const treeId = new URLSearchParams(location.search).get('id') || 'tree-traffic-flow';
      const record = window.MetricDispatchStore.create({
        dispatchMode: 'dept',
        metricId: node.id,
        metricName: node.name,
        treeId,
        treeName,
        metricValue: node.value,
        deptAssignees,
        remark: document.getElementById('metric-dispatch-remark-dept')?.value || '',
        drillPath: '江西省 · 跨部门',
        regions: [],
        assignees: []
      });

      if (typeof closeModal === 'function') closeModal('modal-metric-dispatch');
      if (confirm(`跨部门指标调度已创建（任务 ${record.id}）。\n· 任务分类可查看工单\n· 被调度人可在调度派发认领\n是否前往调度派发？`)) {
        window.location.href = 'dispatch-assign.html?tab=metric&detail=' + encodeURIComponent(record.id);
      }
    });
  }

  function getSelectedRegions(root) {
    const rows = [];
    root?.querySelectorAll('.region-row-check:checked').forEach(cb => {
      const cityId = cb.dataset.cityId;
      const row = wizardState?.regionRows?.find(r => r.cityId === cityId);
      if (row) rows.push({ ...row });
    });
    return rows;
  }

  function renderWizardStep1() {
    const body = document.getElementById('metric-dispatch-wizard-body');
    const foot = document.getElementById('metric-dispatch-wizard-foot');
    if (!body || !wizardState?.node) return;
    clearWizardModeStepLayout(body);
    body.innerHTML = `
      <div class="dispatch-wizard-shell dispatch-wizard-shell--fill">
        ${wizardState.cityDirect ? '' : renderDispatchWizardStepBar(1)}
        ${renderDispatchWizardMetricHero()}
        ${window.renderMetricRegionSelectBody(wizardState.node, metricRegionSelectOpts(wizardState, {
          checkedIds: wizardState.checkedIds || []
        }))}
      </div>`;
    foot.innerHTML = `
      <button type="button" class="btn btn-outline" id="btn-metric-dispatch-city-back"><i class="fas fa-arrow-left"></i> 上一步</button>
      <button type="button" class="btn btn-primary" id="btn-metric-dispatch-next">下一步 <i class="fas fa-arrow-right"></i></button>`;

    bindMetricRegionSelectEvents(body.querySelector('[data-metric-region-panel]'), wizardState);

    document.getElementById('btn-metric-dispatch-city-back')?.addEventListener('click', () => {
      if (wizardState?.cityDirect && typeof closeModal === 'function') {
        closeModal('modal-metric-dispatch');
        return;
      }
      renderWizardStep0();
    });

    document.getElementById('btn-metric-dispatch-next')?.addEventListener('click', () => {
      const selected = getSelectedRegions(body);
      if (!selected.length) {
        alert('请至少勾选一个地市');
        return;
      }
      wizardState.selectedRegions = selected;
      wizardState.checkedIds = selected.map(r => r.cityId);
      renderWizardStep2();
    });
  }

  function defaultWorkOrderDue() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(18, 0, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function defaultWorkOrderTitle(node) {
    return `${node?.name || '指标'} · 指标调度`;
  }

  function getDefaultAssigneeInfo(cityId, node) {
    const def = window.MetricDispatchStore?.getCityCustodian(cityId, node);
    if (!def?.name) return null;
    return {
      id: def.id || `default-${cityId}`,
      name: def.name,
      org: def.org || '',
      dept: def.dept || def.org || '',
      role: def.role || '',
      source: 'default'
    };
  }

  function getCityAssigneeInfo(cityId, node) {
    const saved = wizardState.cityAssigneeInfo?.[cityId];
    if (saved?.name) return saved;
    return getDefaultAssigneeInfo(cityId, node);
  }

  function renderAssigneeCellHtml(r, node) {
    const info = getCityAssigneeInfo(r.cityId, node);
    const name = info?.name || '未设置';
    return `
      <div class="dispatch-wo-assignee-display">
        <span class="dispatch-wo-assignee-name">${esc(name)}</span>
        <button type="button" class="btn-link btn-dispatch-change-assignee"
                data-city-id="${esc(r.cityId)}" data-city-name="${esc(r.cityName)}">修改</button>
      </div>`;
  }

  function getOrgUnitForCity(cityId, cityName) {
    const org = window.JX_ORG_SYSTEM;
    if (!org) return null;
    const unit = org.units.find(u => u.id === cityId);
    if (unit) return unit;

    const def = window.MetricDispatchStore?.getCityCustodian(cityId, wizardState?.node);
    const cityKey = (cityName || '').replace(/市$/, '');
    const pool = (window.MetricDispatchStore?.getStaffPool() || []).filter(u =>
      cityKey && (u.org || '').includes(cityKey)
    );
    const deptId = `${cityId}-default`;
    const syntheticPersons = [];
    if (def?.name) {
      syntheticPersons.push({
        id: def.id || `def-${cityId}`,
        name: def.name,
        role: def.role || '地市看管人',
        unitId: cityId,
        deptId
      });
    }
    pool.forEach(p => {
      if (!syntheticPersons.some(x => x.id === p.id)) {
        syntheticPersons.push({
          id: p.id,
          name: p.name,
          role: p.role || '',
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

  function ensureDispatchAssigneeModal() {
    if (document.getElementById('modal-dispatch-assignee-pick')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="modal-dispatch-assignee-pick">
        <div class="modal-box modal-dispatch-assignee-pick">
          <div class="modal-head">
            <strong id="dispatch-assignee-pick-title">选择工单接收人</strong>
            <button type="button" class="modal-close" data-close-modal="modal-dispatch-assignee-pick">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="dispatch-assignee-search">
              <i class="fas fa-search"></i>
              <input type="search" id="dispatch-assignee-search" placeholder="搜索姓名" autocomplete="off"/>
            </div>
            <div class="dispatch-assignee-org-tree" id="dispatch-assignee-org-tree"></div>
          </div>
        </div>
      </div>`);

    const searchInput = document.getElementById('dispatch-assignee-search');
    searchInput?.addEventListener('input', () => {
      if (wizardState?._pickerCityId) {
        renderDispatchAssigneeOrgTree(wizardState._pickerCityId, wizardState._pickerCityName, searchInput.value);
      }
    });
  }

  function renderDispatchAssigneeOrgTree(cityId, cityName, keyword) {
    const wrap = document.getElementById('dispatch-assignee-org-tree');
    const org = window.JX_ORG_SYSTEM;
    if (!wrap || !org) {
      if (wrap) wrap.innerHTML = '<p class="muted">组织架构数据未加载</p>';
      return;
    }

    const kw = (keyword || '').trim().toLowerCase();
    const unit = getOrgUnitForCity(cityId, cityName);
    if (!unit) {
      wrap.innerHTML = '<p class="muted">暂无该地市组织架构</p>';
      return;
    }

    const unitPersons = unit._syntheticPersons
      || org.persons.filter(p => p.unitId === unit.id);

    let html = `<div class="dispatch-org-unit-head"><i class="fas fa-building"></i> ${esc(unit.name)}</div>`;

    if (kw) {
      const matched = unitPersons.filter(p => p.name.toLowerCase().includes(kw));
      const provMatched = org.persons.filter(p =>
        p.unitId === 'jx-prov' && p.name.toLowerCase().includes(kw)
      );
      if (!matched.length && !provMatched.length) {
        wrap.innerHTML = '<p class="muted" style="padding:16px;text-align:center">未找到匹配人员</p>';
        return;
      }
      if (matched.length) {
        html += `<div class="dispatch-org-dept">本地市</div>`;
        matched.forEach(p => { html += renderDispatchOrgPersonBtn(p, org, unit); });
      }
      if (provMatched.length) {
        html += `<div class="dispatch-org-dept">省公司（跨地市指派）</div>`;
        provMatched.forEach(p => { html += renderDispatchOrgPersonBtn(p, org); });
      }
      wrap.innerHTML = html;
      bindDispatchOrgPersonClicks(wrap, org);
      return;
    }

    unit.depts.forEach(dept => {
      const persons = unitPersons.filter(p => p.deptId === dept.id);
      if (!persons.length) return;
      html += `<div class="dispatch-org-dept">${esc(dept.name)}</div>`;
      persons.forEach(p => { html += renderDispatchOrgPersonBtn(p, org, unit); });
    });

    wrap.innerHTML = html || '<p class="muted" style="padding:16px;text-align:center">暂无可选人员</p>';
    bindDispatchOrgPersonClicks(wrap, org);
  }

  function renderDispatchOrgPersonBtn(person, org, unitOverride) {
    const unit = unitOverride || org.units.find(u => u.id === person.unitId);
    const dept = unit?.depts?.find(d => d.id === person.deptId);
    const meta = [unit?.name, dept?.name, person.role].filter(Boolean).join(' · ');
    return `<button type="button" class="dispatch-org-person" data-person-id="${esc(person.id)}">
      <span class="dispatch-org-person-name">${esc(person.name)}</span>
      <span class="dispatch-org-person-meta muted">${esc(meta)}</span>
    </button>`;
  }

  function bindDispatchOrgPersonClicks(wrap, org) {
    wrap.querySelectorAll('.dispatch-org-person').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = org.persons.find(x => x.id === btn.dataset.personId);
        const synthetic = !p && wizardState?._pickerCityId
          ? getOrgUnitForCity(wizardState._pickerCityId, wizardState._pickerCityName)
            ?._syntheticPersons?.find(x => x.id === btn.dataset.personId)
          : null;
        const person = p || synthetic;
        if (!person || !wizardState?._pickerCityId) return;

        const unit = org.units.find(u => u.id === person.unitId)
          || getOrgUnitForCity(wizardState._pickerCityId, wizardState._pickerCityName)
          || { name: wizardState._pickerCityName || '地市分公司', depts: [] };
        const dept = unit.depts?.find(d => d.id === person.deptId);

        wizardState.cityAssigneeInfo = wizardState.cityAssigneeInfo || {};
        wizardState.cityAssigneeInfo[wizardState._pickerCityId] = {
          id: person.id,
          name: person.name,
          org: unit.name || '',
          dept: dept?.name || '',
          role: person.role || '',
          source: 'org'
        };
        wizardState.cityAssignees = wizardState.cityAssignees || {};
        wizardState.cityAssignees[wizardState._pickerCityId] = `org:${person.id}`;

        if (typeof closeModal === 'function') closeModal('modal-dispatch-assignee-pick');
        updateAssigneeCellDisplay(wizardState._pickerCityId);
      });
    });
  }

  function updateAssigneeCellDisplay(cityId) {
    const cell = document.querySelector(`.dispatch-wo-table tr[data-city-id="${cityId}"] .dispatch-wo-assignee-display`);
    const info = getCityAssigneeInfo(cityId, wizardState?.node);
    if (!cell) return;
    const nameEl = cell.querySelector('.dispatch-wo-assignee-name');
    if (nameEl) nameEl.textContent = info?.name || '未设置';
  }

  function openDispatchAssigneePicker(cityId, cityName) {
    ensureDispatchAssigneeModal();
    wizardState._pickerCityId = cityId;
    wizardState._pickerCityName = cityName;
    const title = document.getElementById('dispatch-assignee-pick-title');
    if (title) title.textContent = `选择工单接收人 · ${cityName}`;
    const searchInput = document.getElementById('dispatch-assignee-search');
    if (searchInput) searchInput.value = '';
    renderDispatchAssigneeOrgTree(cityId, cityName, '');
    if (typeof openModal === 'function') openModal('modal-dispatch-assignee-pick');
    if (searchInput) setTimeout(() => searchInput.focus(), 200);
  }

  function renderDispatchWoForm(node) {
    const defaultTitle = defaultWorkOrderTitle(node);
    const titleVal = wizardState.workOrderTitle || defaultTitle;
    const descVal = wizardState.workOrderRemark || wizardState.globalRemark || '';
    const dueVal = wizardState.workOrderDueAt || defaultWorkOrderDue();
    return `
      <div class="dispatch-wo-form">
        <div class="dispatch-wo-form-grid">
          <div class="form-field">
            <label>工单类型</label>
            <input type="text" class="dispatch-wo-readonly" readonly value="指标调度工单"/>
          </div>
          <div class="form-field">
            <label class="req" for="metric-dispatch-wo-title">工单标题</label>
            <input type="text" id="metric-dispatch-wo-title" placeholder="请输入工单标题" value="${esc(titleVal)}"/>
          </div>
          <div class="form-field full">
            <label class="req" for="metric-dispatch-wo-desc">工单派发说明</label>
            <textarea id="metric-dispatch-wo-desc" rows="2" placeholder="请填写派发背景、协同要求等">${esc(descVal)}</textarea>
          </div>
          <div class="form-field">
            <label class="req" for="metric-dispatch-wo-due">工单完成时间</label>
            <input type="datetime-local" id="metric-dispatch-wo-due" value="${esc(dueVal)}"/>
          </div>
        </div>
      </div>`;
  }

  function renderWizardStep2() {
    const body = document.getElementById('metric-dispatch-wizard-body');
    const foot = document.getElementById('metric-dispatch-wizard-foot');
    clearWizardModeStepLayout(body);
    const node = wizardState.node;
    const regions = wizardState.selectedRegions || [];
    const cityRequirements = wizardState.cityRequirements || {};

    const tableRows = regions.map(r => {
      const reqVal = esc(cityRequirements[r.cityId] || '');
      return `
        <tr data-city-id="${esc(r.cityId)}">
          <td class="city-name-cell"><strong>${esc(r.cityName)}</strong></td>
          <td><strong>${esc(r.metricValue)}</strong></td>
          <td><span class="badge ${r.yoyVal < 0 ? 'badge-danger' : 'badge-success'}">${esc(r.yoy || '—')}</span></td>
          <td><span class="badge ${r.momVal < 0 ? 'badge-danger' : 'badge-success'}">${esc(r.mom)}</span></td>
          <td class="dispatch-wo-assignee-cell">${renderAssigneeCellHtml(r, node)}</td>
          <td>
            <input type="text" class="dispatch-wo-requirement-input" name="city-req-${esc(r.cityId)}"
                   value="${reqVal}" placeholder="填写该地市工单要求"/>
          </td>
        </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="dispatch-wizard-shell dispatch-wizard-shell--fill">
        ${wizardState.cityDirect ? '' : renderDispatchWizardStepBar(2)}
        ${wizardState.cityDirect ? '' : renderDispatchWizardMetricHero()}
        <div class="dispatch-wizard-step2-scroll dispatch-wizard-fill">
          ${renderDispatchWoForm(node)}
          <div class="dispatch-wo-table-section">
            <div class="dispatch-wo-table-head">
              <strong>地市工单明细</strong>
              <span class="muted">已选 ${regions.length} 个地市 · 可修改接收人与工单要求</span>
            </div>
            <div class="table-scroll dispatch-wo-table-wrap">
              <table class="data-table dispatch-wo-table">
                <thead>
                  <tr>
                    <th>地市</th>
                    <th>指标值</th>
                    <th>同比</th>
                    <th>环比</th>
                    <th style="min-width:140px">工单接收人</th>
                    <th style="min-width:220px">工单要求</th>
                  </tr>
                </thead>
                <tbody>${tableRows || '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">暂无地市</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;

    foot.innerHTML = `
      <button type="button" class="btn btn-outline" id="btn-metric-dispatch-back"><i class="fas fa-arrow-left"></i> 上一步</button>
      <button type="button" class="btn btn-primary" id="btn-metric-dispatch-submit"><i class="fas fa-paper-plane"></i> 确认派发</button>`;

    function saveStep2Draft() {
      wizardState.workOrderType = '指标调度工单';
      wizardState.workOrderTitle = document.getElementById('metric-dispatch-wo-title')?.value?.trim() || '';
      wizardState.workOrderRemark = document.getElementById('metric-dispatch-wo-desc')?.value?.trim() || '';
      wizardState.workOrderDueAt = document.getElementById('metric-dispatch-wo-due')?.value || '';
      wizardState.globalRemark = wizardState.workOrderRemark;
      wizardState.cityRequirements = {};
      regions.forEach(r => {
        wizardState.cityRequirements[r.cityId] =
          body.querySelector(`input[name="city-req-${r.cityId}"]`)?.value?.trim() || '';
      });
    }

    body.querySelectorAll('.btn-dispatch-change-assignee').forEach(btn => {
      btn.addEventListener('click', () => {
        const cityId = btn.dataset.cityId;
        const cityName = btn.dataset.cityName || cityId;
        if (cityId) openDispatchAssigneePicker(cityId, cityName);
      });
    });

    document.getElementById('btn-metric-dispatch-back')?.addEventListener('click', () => {
      saveStep2Draft();
      wizardState.checkedIds = (wizardState.selectedRegions || []).map(r => r.cityId);
      renderWizardStep1();
    });
    document.getElementById('btn-metric-dispatch-submit')?.addEventListener('click', () => {
      saveStep2Draft();
      const title = wizardState.workOrderTitle;
      const desc = wizardState.workOrderRemark;
      const due = wizardState.workOrderDueAt;
      if (!title) {
        alert('请输入工单标题');
        document.getElementById('metric-dispatch-wo-title')?.focus();
        return;
      }
      if (!desc) {
        alert('请输入工单派发说明');
        document.getElementById('metric-dispatch-wo-desc')?.focus();
        return;
      }
      if (!due) {
        alert('请选择工单完成时间');
        document.getElementById('metric-dispatch-wo-due')?.focus();
        return;
      }
      const assignees = [];
      for (const r of regions) {
        const info = getCityAssigneeInfo(r.cityId, node);
        if (!info?.name) {
          alert(`请为 ${r.cityName} 选择工单接收人`);
          return;
        }
        assignees.push({
          cityId: r.cityId,
          cityName: r.cityName,
          name: info.name,
          org: info.org || '',
          dept: info.dept || info.org || '',
          role: info.role || '',
          userId: info.id
        });
      }

      const treeName = document.getElementById('page-title')?.textContent || '指标树';
      const treeId = new URLSearchParams(location.search).get('id') || 'tree-traffic-flow';
      const record = window.MetricDispatchStore.create({
        dispatchMode: 'city',
        workOrderType: '指标调度工单',
        workOrderTitle: title,
        workOrderDueAt: due,
        metricId: node.id,
        metricName: node.name,
        treeId,
        treeName,
        metricValue: node.value,
        regions: regions.map((r, i) => ({
          ...r,
          cityRemark: wizardState.cityRequirements?.[r.cityId] || '',
          dispatchStatus: r.alert ? (i % 2 === 0 ? 'running' : 'pending') : 'running'
        })),
        assignees,
        remark: desc,
        drillPath: window.jxDrillState?.city?.name ? `江西省 › ${window.jxDrillState.city.name}` : '江西省'
      });

      if (typeof closeModal === 'function') closeModal('modal-metric-dispatch');
      if (confirm(`已创建调度任务 ${record.id}，并拆分为 ${(record.subTasks || []).length} 个子任务。\n是否前往任务分类查看整体进度？`)) {
        window.location.href = 'task-category.html?detail=' + encodeURIComponent(record.id);
      }
    });
  }

  window.openMetricDispatchWizard = function (node, options) {
    if (!node || !window.MetricDispatchStore) return;
    const prechecked = (options && options.precheckedCityIds) || [];
    wizardState = {
      node,
      dispatchMode: 'city',
      cityDirect: true,
      deptUserIds: [],
      drillCtx: { city: window.jxDrillState?.city || null },
      regionRows: window.buildMetricRegionRows(node, { city: window.jxDrillState?.city }),
      sortBy: 'city',
      sortDir: 'asc',
      selectable: true,
      showTarget: false,
      hideSummary: true,
      hideToolbar: true,
      hideAchievedStats: true,
      checkedIds: prechecked.slice(),
      cityRemarks: {},
      cityRequirements: {},
      cityAssignees: {},
      cityAssigneeInfo: {},
      workOrderType: '指标调度工单',
      workOrderTitle: '',
      workOrderRemark: '',
      workOrderDueAt: '',
      globalRemark: ''
    };
    renderWizardStep1();
    if (typeof openModal === 'function') openModal('modal-metric-dispatch');
  };

  window.openStrategyDispatchFromMetric = function (node) {
    const segIds = typeof resolveTrafficFlowSegmentIds === 'function' && window.isTrafficFlowTreeNode?.(node)
      ? resolveTrafficFlowSegmentIds(node)
      : typeof resolveHeChurnSegmentIds === 'function'
        ? resolveHeChurnSegmentIds(node)
        : null;
    const segId = segIds?.[0] || 'seg-high-downgrade';
    const seg = typeof getSegmentById === 'function' ? getSegmentById(segId) : null;
    const agg = {
      name: (seg?.name || '指标关联客群') + ' · ' + (node?.name || ''),
      scaleLabel: seg?.scaleLabel || '8,000 人',
      sourceMetric: node?.name,
      metricValue: node?.value || '—',
      metricMom: node?.mom || '—',
      metricYoy: node?.yoy || '—',
      nodeId: node?.id
    };
    if (typeof window.navigateToStrategyCreate === 'function') {
      window.navigateToStrategyCreate(agg, {
        from: 'metric-tree',
        metricName: node?.name,
        metricValue: node?.value,
        metricMom: node?.mom,
        metricYoy: node?.yoy
      });
    } else {
      window.location.href = 'strategy-create.html?metric=' + encodeURIComponent(node?.name || '');
    }
  };

  function cityDispatchStatusBadge(st, alert) {
    if (st === 'done') return '<span class="badge badge-info">已反馈</span>';
    if (st === 'pending') return '<span class="badge badge-warning">待处理</span>';
    if (alert) return '<span class="badge badge-danger">跟进中</span>';
    return '<span class="badge badge-success">执行中</span>';
  }

  function taskStatusBadge(st) {
    if (st === 'completed') return '<span class="badge badge-info">已完成</span>';
    if (st === 'pending') return '<span class="badge badge-warning">待处理</span>';
    return '<span class="badge badge-success">执行中</span>';
  }

  window.renderMetricDispatchDetail = function (record) {
    if (!record) return '<p class="muted">未找到任务</p>';

    const me = window.MetricDispatchStore?.getCurrentUser();
    const treeUrl = window.MetricDispatchStore?.getMetricTreeUrl(record) || '#';
    const mode = record.dispatchMode || 'city';
    const modeBadge = mode === 'dept'
      ? '<span class="badge badge-info">跨部门调度</span>'
      : '<span class="badge badge-secondary">跨地市调度</span>';

    const actionBar = `
      <div class="metric-dispatch-action-bar" data-dispatch-id="${esc(record.id)}">
        <a href="${esc(treeUrl)}" class="btn btn-outline btn-sm"><i class="fas fa-sitemap"></i> 查看指标树</a>
        ${mode === 'dept' ? `
          <button type="button" class="btn btn-primary btn-sm" data-md-action="claim" ${!canClaimDept(record, me) ? 'disabled' : ''}><i class="fas fa-hand"></i> 认领工单</button>
          <button type="button" class="btn btn-outline btn-sm" data-md-action="collab"><i class="fas fa-people-arrows"></i> 协同</button>
          <button type="button" class="btn btn-outline btn-sm" data-md-action="redispatch"><i class="fas fa-share"></i> 再次派发</button>
        ` : ''}
        <a href="task-category.html?highlight=${encodeURIComponent(record.id)}" class="btn btn-ghost btn-sm"><i class="fas fa-folder-tree"></i> 任务分类</a>
      </div>`;

    if (mode === 'dept') {
      const assignees = record.deptAssignees || [];
      const rows = assignees.map((a, idx) => `
        <tr>
          <td class="muted">${idx + 1}</td>
          <td><strong>${esc(a.dept)}</strong></td>
          <td class="assignee-cell">
            <div class="name">${esc(a.name)}</div>
            <div class="sub">${esc(a.org)} · ${esc(a.role)}${a.fromRedispatch ? ' · 再次派发' : ''}</div>
          </td>
          <td>${a.claimedBy ? esc(a.claimedBy) : '<span class="muted">—</span>'}</td>
          <td>${(a.collaborators || []).length ? esc(a.collaborators.map(c => c.name).join('、')) : '<span class="muted">—</span>'}</td>
          <td>${woStatusBadge(a.status)}</td>
        </tr>`).join('');

      return `
        ${actionBar}
        <div class="card metric-dispatch-detail-head">
          <div class="card-header">
            <span><i class="fas fa-clipboard-list"></i> 调度任务信息</span>
            <span>${modeBadge} ${taskStatusBadge(record.status)}</span>
          </div>
          <div class="card-body">
            <div class="metric-dispatch-detail-summary">
              <div>
                <div class="muted" style="font-size:12px;margin-bottom:4px">调度指标</div>
                <div class="summary-metric">${esc(record.metricName)}</div>
              </div>
              <div>
                <div class="muted" style="font-size:12px">全省参考值</div>
                <div style="font-size:18px;font-weight:700">${esc(record.metricValue)}</div>
              </div>
            </div>
            <div class="detail-kv-grid" style="margin-top:16px">
              <div class="detail-kv"><span class="k">任务 ID</span><code class="id-chip">${esc(record.id)}</code></div>
              <div class="detail-kv"><span class="k">调度方式</span><span>跨部门调度</span></div>
              <div class="detail-kv"><span class="k">所属指标树</span><span>${esc(record.treeName)}</span></div>
              <div class="detail-kv"><span class="k">发起人</span><span>${esc(record.createdBy)} · ${esc(record.createdByOrg || '')}</span></div>
              <div class="detail-kv"><span class="k">派发时间</span><span>${esc(record.dispatchedAt)}</span></div>
              <div class="detail-kv"><span class="k">调度人数</span><strong>${assignees.length} 人</strong></div>
              <div class="detail-kv full"><span class="k">派发说明</span><span>${esc(record.remark || '—')}</span></div>
            </div>
          </div>
        </div>
        <div class="card metric-dispatch-city-card" style="margin-top:16px">
          <div class="card-header">
            <span><i class="fas fa-building"></i> 跨部门调度对象</span>
            <span class="muted" style="font-size:12px;font-weight:normal">被调度人可在本页认领、协同或向本部门内再次派发</span>
          </div>
          <div class="card-body table-scroll" style="padding:0">
            <table class="data-table metric-dispatch-city-table">
              <thead>
                <tr>
                  <th style="width:48px">序号</th>
                  <th>部门</th>
                  <th>负责人</th>
                  <th>认领人</th>
                  <th>协同成员</th>
                  <th>工单状态</th>
                </tr>
              </thead>
              <tbody>${rows || '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">暂无</td></tr>'}</tbody>
            </table>
          </div>
        </div>`;
    }

    const regions = record.regions || [];
    const cityRows = regions.map((r, idx) => {
      const a = (record.assignees || []).find(x => x.cityId === r.cityId);
      const citySt = r.dispatchStatus || (record.status === 'completed' ? 'done' : 'running');
      const momNum = parseFloat(String(r.mom || '0').replace(/[^0-9.-]/g, '')) || 0;
      const alert = r.alert || momNum < -2;
      return `
        <tr class="${alert ? 'row-alert' : ''}">
          <td class="muted">${idx + 1}</td>
          <td class="city-name-cell"><strong>${esc(r.cityName)}</strong></td>
          <td><strong>${esc(r.metricValue)}</strong></td>
          <td><span class="badge ${momNum < 0 ? 'badge-danger' : 'badge-success'}">${esc(r.mom)}</span></td>
          <td>${alert ? '<span class="badge badge-danger"><i class="fas fa-triangle-exclamation"></i> 异动</span>' : '<span class="muted">正常</span>'}</td>
          <td class="assignee-cell">
            ${a
              ? `<div class="name">${esc(a.name)}</div><div class="sub">${esc(a.org || '—')} · ${esc(a.dept || a.org || '—')}</div>`
              : '<span class="muted">—</span>'}
          </td>
          <td class="city-remark-cell">${r.cityRemark ? esc(r.cityRemark) : '<span class="muted">—</span>'}</td>
          <td>${cityDispatchStatusBadge(citySt, alert)}</td>
        </tr>`;
    }).join('');

    return `
      ${actionBar}
      <div class="card metric-dispatch-detail-head">
        <div class="card-header">
          <span><i class="fas fa-clipboard-list"></i> 调度任务信息</span>
          <span>${modeBadge} ${taskStatusBadge(record.status)}</span>
        </div>
        <div class="card-body">
          <div class="metric-dispatch-detail-summary">
            <div>
              <div class="muted" style="font-size:12px;margin-bottom:4px">调度指标</div>
              <div class="summary-metric">${esc(record.metricName)}</div>
            </div>
            <div>
              <div class="muted" style="font-size:12px">全省参考值</div>
              <div style="font-size:18px;font-weight:700">${esc(record.metricValue)}</div>
            </div>
          </div>
          <div class="detail-kv-grid" style="margin-top:16px">
            <div class="detail-kv"><span class="k">任务 ID</span><code class="id-chip">${esc(record.id)}</code></div>
            <div class="detail-kv"><span class="k">调度方式</span><span>跨地市调度</span></div>
            <div class="detail-kv"><span class="k">所属指标树</span><span>${esc(record.treeName)}</span></div>
            <div class="detail-kv"><span class="k">发起人</span><span>${esc(record.createdBy || '—')}</span></div>
            <div class="detail-kv"><span class="k">调度区域</span><span>${esc(record.drillPath || '江西省')}</span></div>
            <div class="detail-kv"><span class="k">派发时间</span><span>${esc(record.dispatchedAt)}</span></div>
            <div class="detail-kv"><span class="k">调度地市数</span><strong>${regions.length} 个</strong></div>
            <div class="detail-kv full"><span class="k">派发说明</span><span>${esc(record.remark || '—')}</span></div>
          </div>
        </div>
      </div>

      <div class="card metric-dispatch-city-card" style="margin-top:16px">
        <div class="card-header">
          <span><i class="fas fa-map-location-dot"></i> 调度地市明细</span>
          <span class="muted" style="font-size:12px;font-weight:normal">共 ${regions.length} 条 · 展示各地市指标值与负责人</span>
        </div>
        <div class="card-body table-scroll" style="padding:0">
          <table class="data-table metric-dispatch-city-table">
            <thead>
              <tr>
                <th style="width:48px">序号</th>
                <th>地市</th>
                <th>指标值</th>
                <th>环比</th>
                <th>异动</th>
                <th>负责人</th>
                <th>地市备注</th>
                <th>子任务状态</th>
              </tr>
            </thead>
            <tbody>
              ${cityRows || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无地市数据</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  };

  function canClaimDept(record, me) {
    if (!record || record.dispatchMode !== 'dept' || !me) return false;
    return (record.deptAssignees || []).some(a =>
      a.name === me.name && a.status === 'pending_claim'
    );
  }

  function getMyDeptAssignee(record, me) {
    return (record.deptAssignees || []).find(a => a.name === me.name || a.userId === me.id);
  }

  window.bindMetricDispatchDetailActions = function (record, rootEl) {
    const root = rootEl || document.getElementById('metric-dispatch-detail-body');
    const bar = root?.querySelector('.metric-dispatch-action-bar');
    if (!bar || !record) return;
    const me = window.MetricDispatchStore.getCurrentUser();

    bar.querySelector('[data-md-action="claim"]')?.addEventListener('click', () => {
      const a = getMyDeptAssignee(record, me);
      if (!a) {
        alert('当前身份无法认领。请在调度派发页右上角将「演示身份」切换为被调度人（如李娜），再认领工单。');
        return;
      }
      MetricDispatchStore.claimWorkOrder(record.id, a.userId);
      alert('工单已认领，状态更新为「已认领」');
      window.location.reload();
    });

    bar.querySelector('[data-md-action="collab"]')?.addEventListener('click', () => {
      const a = getMyDeptAssignee(record, me) || (record.deptAssignees || [])[0];
      if (!a) return;
      const members = prompt('请输入协同成员姓名，多人用顿号分隔', '吴倩、郑浩');
      if (members == null) return;
      const list = members.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
      const note = prompt('协同说明（选填）', record.remark || '');
      MetricDispatchStore.startCollaboration(record.id, a.userId, note, list);
      alert('已进入协同状态');
      window.location.reload();
    });

    bar.querySelector('[data-md-action="redispatch"]')?.addEventListener('click', () => {
      const a = getMyDeptAssignee(record, me) || (record.deptAssignees || [])[0];
      if (!a) return;
      const staff = MetricDispatchStore.getDeptStaffByDept(a.dept).filter(u => u.id !== a.userId);
      if (!staff.length) {
        alert('本部门无可派发人员');
        return;
      }
      const pick = prompt(
        '再次派发（仅限本部门内）\n可选：\n' + staff.map((u, i) => `${i + 1}. ${u.name}（${u.role}）`).join('\n') + '\n\n请输入序号，多个用逗号分隔',
        '1'
      );
      if (pick == null) return;
      const idxs = pick.split(/[,，、]/).map(s => parseInt(s.trim(), 10) - 1).filter(n => !isNaN(n));
      const ids = idxs.map(i => staff[i]?.id).filter(Boolean);
      if (!ids.length) {
        alert('未选择有效人员');
        return;
      }
      MetricDispatchStore.redispatchWithinDept(record.id, a.userId, ids);
      alert('已再次派发给本部门同事，工单状态已更新');
      window.location.reload();
    });
  };
})();
