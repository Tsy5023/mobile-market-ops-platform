/** 根因分析 · 报告式展示（底部 AI 小结） */
(function () {
  const MONTH_LABELS = [
    '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11',
    '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05'
  ];
  const CITY_PALETTE = [
    '#2563eb', '#0ea5e9', '#14b8a6', '#10b981', '#84cc16', '#eab308',
    '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6'
  ];
  const CITY_WEIGHTS = {
    nc: 0.18, gz: 0.16, jj: 0.12, sr: 0.11, yc: 0.10,
    ja: 0.09, fz: 0.08, jdz: 0.07, px: 0.05, xy: 0.04, yt: 0.04
  };
  let _chartUid = 0;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function resolveMetricUnit(node, rawVal) {
    const name = node?.name || '';
    const val = String(rawVal ?? node?.value ?? '');
    if (/%/.test(val) || (/率|占比/.test(name) && !/量/.test(name))) return '%';
    if (/万元/.test(val) || (/万/.test(val) && /元/.test(val))) return '万元';
    if (/万G/.test(val) || (/万/.test(val) && /G/.test(val))) return '万G';
    if (/亿/.test(val) && /元/.test(val)) return '亿元';
    if (/G/.test(val) && /流量|GB|数据/.test(name)) return 'G';
    if (/万人/.test(val) || (/万/.test(val) && /人|客户|用户|客群/.test(name))) return '万人';
    if (/万户/.test(val) || (/户/.test(val) && /户/.test(name))) return '万户';
    if (/万/.test(val) && !/元|G|人|户/.test(val)) return '万';
    if (/收入|金额|ARPU|通服/.test(name)) return '万元';
    return '';
  }

  function axisValueLabel(unit) {
    if (!unit) return '指标值';
    return `指标值（${unit}）`;
  }

  function appendUnit(formatted, unit) {
    if (!unit || unit === '%' || /[%万亿元G]$/.test(formatted)) return formatted;
    return formatted + unit;
  }

  function parseMetricNum(val, node) {
    const s = String(val || '');
    const m = s.replace(/,/g, '').match(/([\d.]+)/);
    let num = m ? parseFloat(m[1]) : 100 + (hashStr(s) % 500);
    if (/万/.test(s)) num *= 10000;
    return num;
  }

  function fmtNum(v, unit) {
    if (unit === '%') return (+v).toFixed(2) + '%';
    if (unit === '万元' || unit === '亿元' || unit === '元') {
      const n = +v;
      const suffix = unit === '亿元' ? '亿元' : '万元';
      if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿';
      if (n >= 10000) return (n / 10000).toFixed(2) + '万';
      return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
    }
    if (unit === '万G' || unit === 'G') {
      const n = +v;
      if (unit === '万G' || n >= 10000) return (n / 10000).toFixed(2) + '万G';
      return n.toFixed(1) + 'G';
    }
    if (unit === '万人' || unit === '万户' || unit === '万') {
      const n = +v;
      if (n >= 10000) return (n / 10000).toFixed(2) + '万';
      return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
    }
    return Number.isInteger(v) ? String(v) : (+v).toFixed(1);
  }

  function fmtMetricValue(val, node) {
    const unit = resolveMetricUnit(node, val);
    const n = fmtNum(parseMetricNum(val, node), unit);
    return appendUnit(n, unit);
  }

  function getCities() {
    if (typeof window.getAllJxCities === 'function') {
      return window.getAllJxCities();
    }
    if (typeof window.buildSegmentCityPortraitData === 'function' && window._rcAggregatedSegment) {
      return window.buildSegmentCityPortraitData(window._rcAggregatedSegment).map(r => ({
        id: r.cityId,
        name: r.cityName
      }));
    }
    if (window.JIANGXI_REGION?.cities?.length) {
      return window.JIANGXI_REGION.cities.map(c => ({ id: c.id, name: c.name }));
    }
    return [
      { id: 'nc', name: '南昌市' }, { id: 'gz', name: '赣州市' }, { id: 'sr', name: '上饶市' },
      { id: 'jj', name: '九江市' }, { id: 'yc', name: '宜春市' }, { id: 'ja', name: '吉安市' },
      { id: 'fz', name: '抚州市' }, { id: 'jdz', name: '景德镇市' }, { id: 'px', name: '萍乡市' },
      { id: 'xy', name: '新余市' }, { id: 'yt', name: '鹰潭市' }
    ];
  }

  function getJxCityById(cityId) {
    return window.JIANGXI_REGION?.cities?.find(c => c.id === cityId) || null;
  }

  function getCountiesForCity(cityId) {
    if (typeof window.getJxCountiesForCity === 'function') {
      return window.getJxCountiesForCity(cityId);
    }
    return getJxCityById(cityId)?.counties || [];
  }

  function getGridsForCounty(cityId, countyId) {
    if (typeof window.getJxGridsForCounty === 'function') {
      return window.getJxGridsForCounty(cityId, countyId);
    }
    return getCountiesForCity(cityId).find(c => c.id === countyId)?.grids || [];
  }

  function barItemName(part) {
    return part?.name || part?.cityName || part?.countyName || part?.gridName || '—';
  }

  function buildRegionParts(node, regions, parentTotal, seedSuffix) {
    if (!regions?.length) return [];
    const seed = hashStr((node?.id || node?.name || 'm') + ':' + seedSuffix);
    const monthTotal = Math.max(+parentTotal || 0, 1);
    const weights = regions.map((r, i) => {
      const h = hashStr(seedSuffix + ':' + r.id + ':' + seed);
      return 0.06 + (h % 94) / 1000 + (regions.length - i) * 0.015;
    });
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
    const parts = regions.map((r, i) => {
      const value = monthTotal * (weights[i] / weightSum);
      const mom = assignCityMonthlyMom(r.id, i, regions.length, seed);
      const prevValue = mom !== 0 ? value / (1 + mom / 100) : value;
      return {
        id: r.id,
        name: r.name,
        value,
        mom,
        momLabel: (mom >= 0 ? '+' : '') + mom.toFixed(1) + '%',
        prevValue
      };
    });
    let sum = parts.reduce((a, p) => a + p.value, 0);
    if (parts.length && Math.abs(sum - monthTotal) > 1e-6) {
      parts[parts.length - 1].value += monthTotal - sum;
      sum = monthTotal;
    }
    parts.forEach(p => {
      p.share = sum ? p.value / sum : 0;
      p.sharePct = +(p.share * 100).toFixed(1);
    });
    parts.sort((a, b) => b.value - a.value);
    return parts;
  }

  function buildCityLevelBarPayload(cityData) {
    return {
      level: 'city',
      monthLabel: cityData.monthLabel,
      total: cityData.total,
      scopeLabel: `江西省 ${cityData.parts.length} 个地市`,
      parts: cityData.parts.map(p => ({
        ...p,
        id: p.cityId,
        name: p.cityName,
        drillable: !!getCountiesForCity(p.cityId).length,
        drillTarget: { level: 'county', cityId: p.cityId, cityName: p.cityName, parentValue: p.value }
      }))
    };
  }

  function buildCountyLevelBarPayload(node, cityId, cityName, parentValue) {
    const counties = getCountiesForCity(cityId);
    const parts = buildRegionParts(node, counties, parentValue, 'county:' + cityId).map(p => {
      const hasGrids = !!getGridsForCounty(cityId, p.id).length;
      return {
        ...p,
        drillable: hasGrids,
        drillTarget: hasGrids
          ? { level: 'grid', cityId, cityName, countyId: p.id, countyName: p.name, parentValue: p.value }
          : null
      };
    });
    return {
      level: 'county',
      monthLabel: MONTH_LABELS[MONTH_LABELS.length - 1],
      total: parentValue,
      scopeLabel: `${cityName} · ${parts.length} 个区县`,
      cityId,
      cityName,
      parts
    };
  }

  function buildGridLevelBarPayload(node, cityId, cityName, countyId, countyName, parentValue) {
    const grids = getGridsForCounty(cityId, countyId);
    const parts = buildRegionParts(node, grids, parentValue, 'grid:' + cityId + ':' + countyId).map(p => ({
      ...p,
      drillable: false,
      drillTarget: null
    }));
    return {
      level: 'grid',
      monthLabel: MONTH_LABELS[MONTH_LABELS.length - 1],
      total: parentValue,
      scopeLabel: `${cityName} · ${countyName} · ${parts.length} 个网格`,
      cityId,
      cityName,
      countyId,
      countyName,
      parts
    };
  }

  function resolveCityChartLayoutOpts(parts, opts) {
    const n = parts?.length || 0;
    if (n <= 5) return { ...opts, compact: true };
    return { ...opts, compact: false };
  }

  function cityChartLevelTitle(level) {
    if (level === 'county') return '区县数据';
    if (level === 'grid') return '网格数据';
    return '地市数据';
  }

  function renderDrillCrumbHtml(crumbs) {
    return (crumbs || []).map((c, i) => {
      const sep = i > 0 ? '<span class="rc-chart-drill-crumb-sep">›</span>' : '';
      const isLast = i === crumbs.length - 1;
      if (isLast) {
        return `${sep}<span class="rc-chart-drill-crumb-item is-current">${esc(c.label)}</span>`;
      }
      return `${sep}<button type="button" class="rc-chart-drill-crumb-link" data-rc-drill-crumb-idx="${i}">${esc(c.label)}</button>`;
    }).join('');
  }

  function buildCityChartBreadcrumb(payload) {
    const crumbs = [{ label: '江西省', level: 'city' }];
    if (payload.level === 'county' || payload.level === 'grid') {
      crumbs.push({ label: payload.cityName, level: 'county', cityId: payload.cityId });
    }
    if (payload.level === 'grid') {
      crumbs.push({ label: payload.countyName, level: 'grid', countyId: payload.countyId });
    }
    return crumbs;
  }

  function cityWeight(city, seed) {
    if (CITY_WEIGHTS[city.id]) return CITY_WEIGHTS[city.id];
    const h = hashStr(city.id + seed);
    return 0.04 + (h % 80) / 1000;
  }

  function buildTrendSeries(node) {
    const seed = hashStr(node?.id || node?.name || 'm');
    const unit = resolveMetricUnit(node, node?.value);
    const base = parseMetricNum(node?.value, node);
    const values = MONTH_LABELS.map((_, i) => {
      const drift = Math.sin((seed % 17) / 3 + i * 0.42) * base * 0.07;
      const trend = (i - 5.5) * base * 0.009;
      const season = Math.cos(i * 0.85) * base * 0.025;
      const v = Math.max(base * 0.78, base + drift + trend + season);
      return unit === '%' ? +v.toFixed(2) : Math.round(v);
    });
    const momChanges = monthOverMonth(values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const maxIdx = values.indexOf(maxVal);
    const minIdx = values.indexOf(minVal);
    const totalMom = values.length > 1
      ? ((values[values.length - 1] - values[0]) / values[0] * 100)
      : 0;
    return {
      labels: MONTH_LABELS,
      values,
      unit,
      momChanges,
      stats: {
        avg,
        maxVal,
        minVal,
        maxLabel: MONTH_LABELS[maxIdx],
        minLabel: MONTH_LABELS[minIdx],
        totalMom: +totalMom.toFixed(1)
      }
    };
  }

  /** 为各地市生成有升有降的环比（确定性，与柱图一致） */
  function assignCityMonthlyMom(cityId, index, total, seed) {
    const profiles = [-7.8, -5.6, -4.2, -2.9, -1.4, 0.6, 2.1, 3.5, 5.8, 4.4, 6.9, -3.3, 7.5, -6.1, 1.8];
    const base = profiles[(index + (seed % profiles.length)) % profiles.length];
    const jitter = ((hashStr(cityId + String(seed)) % 11) - 5) * 0.12;
    return +Math.max(-11, Math.min(11, base + jitter)).toFixed(1);
  }

  function buildCityImpactData(node, metricRaw) {
    const cities = getCities();
    const seed = hashStr(node?.id || node?.name || 'm');
    const base = parseMetricNum(metricRaw ?? node?.value, node);
    const monthLabel = MONTH_LABELS[MONTH_LABELS.length - 1];
    const monthTotal = base;
    const weights = cities.map(c => cityWeight(c, seed));
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
    const parts = cities.map((c, ci) => {
      const value = monthTotal * (weights[ci] / weightSum);
      const mom = assignCityMonthlyMom(c.id, ci, cities.length, seed);
      const prevValue = mom !== 0 ? value / (1 + mom / 100) : value;
      return {
        cityId: c.id,
        cityName: c.name,
        value,
        mom,
        momLabel: (mom >= 0 ? '+' : '') + mom.toFixed(1) + '%',
        prevValue
      };
    });
    let sum = parts.reduce((a, p) => a + p.value, 0);
    if (parts.length && Math.abs(sum - monthTotal) > 1e-6) {
      const last = parts[parts.length - 1];
      last.value += monthTotal - sum;
      sum = monthTotal;
    }
    parts.forEach(p => {
      p.share = sum ? p.value / sum : 0;
      p.sharePct = +(p.share * 100).toFixed(1);
    });
    parts.sort((a, b) => b.value - a.value);
    const rank = parts.map(p => ({
      cityId: p.cityId,
      cityName: p.cityName,
      value: p.value,
      contrib: p.sharePct,
      mom: p.mom,
      momLabel: p.momLabel,
      prevValue: p.prevValue
    }));
    return { monthLabel, total: monthTotal, parts, rank };
  }

  const CITY_TREND_MONTHS = 6;
  const CHART_PAD_R = 14;
  const CHART_PAD_T = 10;
  const CHART_PAD_B = 36;
  const CHART_PLOT_H = 172;
  const CHART_PLOT_H_COMPACT = 158;
  const CHART_SLOT_W = 46;
  const CHART_SLOT_W_COMPACT = 28;
  const CITY_COL_GAP = 36;
  const CITY_COL_GAP_COMPACT = 28;
  const COMPACT_CHART_VIEW_W = 540;
  const CHART_PAD_R_MOM = 46;
  /** 地市柱图：同模块内仅用蓝色系，避免彩虹色 */
  const CITY_CHART_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#0ea5e9', '#0284c7'];

  function formatAxisTick(v, unit) {
    const n = +v;
    if (!Number.isFinite(n)) return '0';
    if (unit === '%') return (Number.isInteger(n) ? n : n.toFixed(1)) + '%';
    if (unit === '万元' || unit === '亿元' || unit === '元') {
      if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
      if (n >= 10000) {
        const wan = n / 10000;
        return (Number.isInteger(wan) ? wan : +wan.toFixed(1)) + '万';
      }
      return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
    }
    if (unit === '万G' || unit === 'G') {
      if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万G';
      return n.toFixed(0) + 'G';
    }
    if (unit === '万人' || unit === '万户' || unit === '万') {
      if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
      return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(0);
    }
    return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
  }

  /** 纵轴固定等距刻度，如 10万、20万、30万 */
  function buildFixedYScale(dataMax, tickTarget) {
    const max = Math.max(+dataMax || 0, 1);
    const target = tickTarget || 5;
    const rawStep = max / target;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / magnitude;
    let niceNorm = 10;
    if (norm <= 1) niceNorm = 1;
    else if (norm <= 2) niceNorm = 2;
    else if (norm <= 5) niceNorm = 5;
    const step = niceNorm * magnitude;
    const axisMax = Math.max(step, Math.ceil(max / step) * step);
    const ticks = [];
    for (let v = 0; v <= axisMax + step * 0.001; v += step) {
      ticks.push(+v.toFixed(6));
      if (ticks.length > 8) break;
    }
    return { ticks, min: 0, max: axisMax, step };
  }

  function estimateChartPadL(ticks, unit) {
    const labels = (ticks || []).map(v => formatAxisTick(v, unit));
    const maxLen = Math.max(...labels.map(s => String(s).length), 3);
    return Math.max(58, Math.ceil(maxLen * 7.5 + 22));
  }

  function cityBarMomClass(mom) {
    const n = Number(mom) || 0;
    if (n < -0.05) return 'down';
    if (n > 0.05) return 'up';
    return 'flat';
  }

  function barGradientStops(kind) {
    const map = {
      trend: { top: '#7ec8ff', bottom: '#3b82f6' }
    };
    return map[kind] || map.trend;
  }

  function barLabelYs(yTop, padT) {
    const momY = yTop - 5;
    const valueY = yTop - 17;
    return { valueY, momY };
  }

  function barValueLabelY(yTop, padT) {
    return yTop - 8;
  }

  function renderYAxisTitle(padL, padT, unit, title, opts) {
    const label = title || axisValueLabel(unit);
    const y = yAxisTitleY(padT);
    const alignLeft = opts?.alignLeft;
    const x = alignLeft ? Math.max(6, padL - 4) : padL;
    const anchor = alignLeft ? 'start' : 'middle';
    return `<text x="${x}" y="${y}" class="rc-axis-y-title" text-anchor="${anchor}" dominant-baseline="auto">${esc(label)}</text>`;
  }

  function renderYAxisTitleRight(chartW, padR, padT, title) {
    const y = yAxisTitleY(padT);
    return `<text x="${chartW - padR}" y="${y}" class="rc-axis-y-title rc-axis-y-title-right" text-anchor="middle" dominant-baseline="auto">${esc(title)}</text>`;
  }

  function yAxisTitleY(padT) {
    return Math.max(16, padT - 24);
  }

  function yAxisLineTop(padT) {
    return padT;
  }

  function formatWanTick(v) {
    const n = +v;
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) >= 100) return String(Math.round(n));
    return n.toFixed(1).replace(/\.0$/, '');
  }

  function buildMomYScale(momValues) {
    const moms = (momValues || []).map(m => Number(m) || 0);
    const dataMin = Math.min(...moms, 0);
    const dataMax = Math.max(...moms, 0);
    const span = Math.max(dataMax - dataMin, 8);
    const pad = Math.max(2, span * 0.2);
    let min = Math.floor((dataMin - pad) / 5) * 5;
    let max = Math.ceil((dataMax + pad) / 5) * 5;
    if (max - min < 10) {
      const mid = (max + min) / 2;
      min = mid - 10;
      max = mid + 10;
    }
    const step = (max - min) / 5;
    const ticks = [];
    for (let i = 0; i <= 5; i++) {
      ticks.push(+(min + step * i).toFixed(1));
    }
    return { min, max, ticks };
  }

  function momToY(mom, scale, padT, innerH) {
    return padT + innerH - ((mom - scale.min) / (scale.max - scale.min || 1)) * innerH;
  }

  function renderAxisYRight(padR, padT, innerH, scale, chartW, padL) {
    const axisX = chartW - padR;
    const tickX = axisX + 6;
    return scale.ticks.map(v => {
      const y = momToY(v, scale, padT, innerH);
      const label = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
      return `
        <text x="${tickX}" y="${y}" class="rc-report-axis-tick rc-axis-y-right" text-anchor="start" dominant-baseline="middle">${esc(label)}</text>`;
    }).join('') + `
        <line x1="${axisX}" y1="${yAxisLineTop(padT)}" x2="${axisX}" y2="${padT + innerH}" class="rc-chart-axis-line rc-chart-axis-line-right"/>`;
  }

  function renderBarGradientDefs(uid, kinds) {
    const items = kinds.map(k => {
      const stops = barGradientStops(k);
      const gid = `rc-bar-grad-${uid}-${k}`;
      return `
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${stops.top}"/>
          <stop offset="100%" stop-color="${stops.bottom}"/>
        </linearGradient>`;
    }).join('');
    return `<defs>${items}</defs>`;
  }

  function barGradientFill(uid, kind) {
    return `url(#rc-bar-grad-${uid}-${kind})`;
  }

  function compactBarValueLabel(v, unit) {
    return formatAxisTick(v, unit);
  }

  function buildChartFrame(opts) {
    const compact = opts?.compact;
    const yTitleH = compact ? 36 : 22;
    const plotH = compact ? CHART_PLOT_H_COMPACT : CHART_PLOT_H;
    const padT = (compact ? 32 : CHART_PAD_T) + yTitleH;
    const padB = CHART_PAD_B;
    const h = padT + plotH + padB;
    return {
      padT,
      padB,
      padR: CHART_PAD_R,
      plotH,
      innerH: plotH,
      h,
      xLabelY: padT + plotH + 14,
      xTitleY: padT + plotH + 28
    };
  }

  function wrapChartSvg(uid, w, h, innerHtml, opts) {
    const compact = opts?.compact;
    const aria = opts?.ariaLabel || '图表';
    const wrapCls = compact ? ' rc-chart-wrap-fit' : ' rc-chart-scroll-x';
    const ratio = compact ? 'none' : 'xMidYMid meet';
    return `
      <div class="rc-report-chart-wrap rc-chart-wrap-wide${wrapCls}" data-chart-root="${uid}">
        <div class="rc-chart-tooltip" hidden></div>
        <svg viewBox="0 0 ${w} ${h}" class="rc-report-chart rc-report-chart-wide" preserveAspectRatio="${ratio}" role="img" aria-label="${esc(aria)}">
          ${innerHtml}
        </svg>
      </div>`;
  }

  function renderProse(items) {
    const rows = (Array.isArray(items) ? items : [items])
      .filter(Boolean)
      .map(item => {
        if (typeof item === 'string') return `<p>${esc(item)}</p>`;
        const label = item.label
          ? `<span class="rc-v6-prose-label">${esc(item.label)}</span>`
          : '';
        return `<p>${label}${esc(item.text)}</p>`;
      })
      .join('');
    return rows ? `<div class="rc-v6-prose">${rows}</div>` : '';
  }

  function buildCityMonthlyTrends(node, cityData, monthCount) {
    const months = monthCount || CITY_TREND_MONTHS;
    const cities = getCities();
    const seed = hashStr(node?.id || node?.name || 'm');
    const base = parseMetricNum(node?.value, node);
    const labels = MONTH_LABELS.slice(-months);
    const rankMap = Object.fromEntries((cityData?.rank || []).map(r => [r.cityId, r]));

    return cities.map(c => {
      const w = cityWeight(c, seed);
      const citySeed = hashStr(c.id + seed);
      const values = labels.map((_, i) => {
        const drift = Math.sin((citySeed % 17) / 3 + i * 0.5) * base * w * 0.1;
        const trend = (i - (months - 1) / 2) * base * w * 0.015 * (citySeed % 3 === 0 ? -1 : 1);
        return Math.max(0, base * w * (0.92 + i * 0.018) + drift + trend);
      });
      const first = values[0];
      const last = values[values.length - 1];
      const prev = values.length > 1 ? values[values.length - 2] : first;
      const changePct = first ? +((last - first) / first * 100).toFixed(1) : 0;
      const rankInfo = rankMap[c.id] || {};
      const recentMom = rankInfo.mom != null
        ? +Number(rankInfo.mom).toFixed(1)
        : (prev ? +((last - prev) / prev * 100).toFixed(1) : 0);
      return {
        cityId: c.id,
        cityName: c.name,
        changePct,
        recentMom,
        recentMomLabel: rankInfo.momLabel || ((recentMom >= 0 ? '+' : '') + recentMom.toFixed(1) + '%'),
        changeLabel: (changePct >= 0 ? '+' : '') + changePct.toFixed(1) + '%',
        momLabel: rankInfo.momLabel,
        contrib: rankInfo.contrib || 0,
        status: recentMom < -0.05 ? 'deteriorated' : recentMom > 0.05 ? 'improved' : 'stable'
      };
    }).sort((a, b) => b.contrib - a.contrib);
  }

  function buildTrendInterpretation6M(trend, node, d) {
    const mom = d?.step1?.mom || node?.mom || '—';
    const n = CITY_TREND_MONTHS;
    const labels = trend.labels.slice(-n);
    const vals = trend.values.slice(-n);
    const last = vals[vals.length - 1];
    const first = vals[0];
    const prev = vals[vals.length - 2];
    const chg = prev ? ((last - prev) / prev * 100) : 0;
    const chgStr = chg.toFixed(1);
    const periodMom = first ? ((last - first) / first * 100).toFixed(1) : '0.0';
    const maxIdx = vals.indexOf(Math.max(...vals));
    const minIdx = vals.indexOf(Math.min(...vals));
    const metricName = d?.metricName || node?.name || '指标';
    const lastLabel = appendUnit(fmtNum(last, trend.unit), trend.unit);
    return [
      `AI 基于近 ${n} 个月数据分析：「${metricName}」${+periodMom < 0 ? '整体呈下行承压' : '整体波动上行'}，区间累计变动 ${periodMom}%，最新账期 ${lastLabel}，环比 ${mom}。`,
      `近 ${n} 月走势高点在 ${labels[maxIdx]}（${appendUnit(fmtNum(vals[maxIdx], trend.unit), trend.unit)}），低点在 ${labels[minIdx]}（${appendUnit(fmtNum(vals[minIdx], trend.unit), trend.unit)}）。`,
      chg < -3
        ? `最近账期环比 ${chgStr}%，走弱幅度有所扩大，建议结合地市分层与根因链路同步排查。`
        : chg < 0
          ? `最近账期环比 ${chgStr}%，小幅回落，需关注冲量后的持续性与结构性拖累。`
          : `最近账期环比 ${chgStr}%，走势相对平稳，宜保持周度跟踪并前置干预恶化地市。`
    ].join('');
  }

  function buildCityStatusText(cityLocation, cityData) {
    const rankMap = Object.fromEntries((cityData?.rank || []).map(r => [r.cityId, r]));
    const momLabelOf = c => {
      const rank = rankMap[c.cityId];
      return rank?.momLabel || c.recentMomLabel || c.momLabel || '—';
    };
    const down = cityLocation.deteriorated || [];
    const up = cityLocation.improved || [];
    const parts = [];
    if (down.length && up.length) {
      parts.push(`环比数据分析：全省 11 个地市分化明显，${down.length} 个环比下降、${up.length} 个环比上升。`);
    } else if (down.length) {
      parts.push(`环比数据分析：${down.length} 个地市环比下降，全省承压。`);
    } else if (up.length) {
      parts.push(`环比数据分析：${up.length} 个地市环比上升，整体走势偏稳。`);
    } else {
      parts.push('环比数据分析：各地市环比整体持平。');
    }
    if (down.length) {
      parts.push(`环比下降地市：${down.slice(0, 6).map(c => `${c.cityName.replace('市', '')}（${momLabelOf(c)}）`).join('、')}${down.length > 6 ? ' 等' : ''}，对全省指标形成主要拖累。`);
    }
    if (up.length) {
      parts.push(`环比上升地市：${up.slice(0, 6).map(c => `${c.cityName.replace('市', '')}（${momLabelOf(c)}）`).join('、')}${up.length > 6 ? ' 等' : ''}，可作为稳盘与经验复制重点。`);
    }
    return parts.join('');
  }

  function buildCityAnalysisNarrative(node, cityData, trend, d) {
    const monthCount = CITY_TREND_MONTHS;
    const cityTrends = buildCityMonthlyTrends(node, cityData, monthCount);
    const improved = cityTrends.filter(c => c.status === 'improved');
    const deteriorated = cityTrends.filter(c => c.status === 'deteriorated');
    const metricName = d?.metricName || node?.name || '指标';
    const top3 = cityData.rank.slice(0, 3);
    const top3Share = top3.reduce((s, r) => s + r.contrib, 0).toFixed(1);

    const lines = [
      `按地市拆解「${metricName}」：${top3.map(r => r.cityName).join('、')} 贡献居前，合计占全省 ${top3Share}%。`,
      deteriorated.length
        ? `环比下降地市（${deteriorated.length} 个）：${deteriorated.slice(0, 5).map(c => `${c.cityName}（${c.recentMomLabel || c.momLabel}）`).join('、')}${deteriorated.length > 5 ? ' 等' : ''}，对全省指标形成主要拖累。`
        : '各地市环比整体平稳或上升，未见明显下降地市。',
      improved.length
        ? `环比上升地市（${improved.length} 个）：${improved.slice(0, 5).map(c => `${c.cityName}（${c.recentMomLabel || c.momLabel}）`).join('、')}${improved.length > 5 ? ' 等' : ''}，可作为稳盘与经验复制重点。`
        : '暂无明显环比上升地市，建议优先在规模靠前地市开展结构优化。'
    ];
    return { lines, cityTrends, monthCount };
  }

  function renderTrendInterpretation(lines) {
    return `<div class="rc-trend-interpret">${(lines || []).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
  }

  function renderCityAnalysisTable(cityTrends, monthCount) {
    const rows = (cityTrends || []).map(c => {
      const statusBadge = c.status === 'improved'
        ? '<span class="badge badge-success">好转</span>'
        : '<span class="badge badge-danger">恶化</span>';
      const momCls = c.recentMom < 0 ? 'neg' : 'pos';
      return `<tr>
        <td>${esc(c.cityName)}</td>
        <td>近 ${monthCount} 月 ${esc(c.changeLabel)}</td>
        <td class="${momCls}">${esc(c.recentMomLabel)}</td>
        <td>${esc(String(c.contrib))}%</td>
        <td>${statusBadge}</td>
      </tr>`;
    }).join('');
    return `
      <div class="table-scroll rc-city-trend-table-wrap">
        <table class="data-table rc-city-trend-table">
          <thead>
            <tr>
              <th>地市</th>
              <th>近 ${monthCount} 月波动</th>
              <th>最近环比</th>
              <th>指标贡献</th>
              <th>态势</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderCityAnalysisContent(node, cityData, trend, d) {
    const { lines, cityTrends, monthCount } = buildCityAnalysisNarrative(node, cityData, trend, d);
    return `
      <div class="rc-city-analysis-narrative">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
      ${renderCityAnalysisTable(cityTrends, monthCount)}
      ${renderCityBarChart(cityData, trend.unit)}`;
  }

  function monthOverMonth(vals) {
    return vals.slice(1).map((v, i) => {
      const prev = vals[i];
      const chg = prev ? ((v - prev) / prev * 100) : 0;
      return { label: MONTH_LABELS[i + 1], chg: +chg.toFixed(1), value: v };
    });
  }

  function isTrafficFlowRevenue(node, d) {
    const name = node?.name || d?.metricName || '';
    return name === '流量收入';
  }

  function buildAiSummary(node, trend, cityData, d, agg, cityRows) {
    const mom = node?.mom || '—';
    const vals = trend.values;
    const last = vals[vals.length - 1];
    const prev = vals[vals.length - 2];
    const chg = prev ? ((last - prev) / prev * 100) : 0;
    const chgStr = chg.toFixed(1);
    const maxIdx = vals.indexOf(Math.max(...vals));
    const minIdx = vals.indexOf(Math.min(...vals));
    const top3 = cityData.rank.slice(0, 3);
    const top3Share = top3.reduce((s, r) => s + r.contrib, 0).toFixed(1);
    const alertCities = cityRows.filter(r => r.highlight);
    const metricMom = agg?.metricMom || d?.step1?.mom || '—';
    const momNeg = String(metricMom).startsWith('-');

    const branches = window._rcBranchData || [];
    const topBranch = branches[0];
    const trafficRev = isTrafficFlowRevenue(node, d);
    const branchNames = branches.map(b => `「${b.metric}」`).join('、');

    const points = trafficRev ? [
      {
        title: '指标趋势',
        text: `「流量收入」近 12 个月整体承压，最新值 ${appendUnit(fmtNum(last, trend.unit), trend.unit)}，环比 ${mom}。${chg < 0 ? `近两个月降幅有所扩大（最近账期 ${chgStr}%），需重点关注 5 月后的回落节奏。` : `最近账期环比 ${chgStr}%，波动幅度可控，但仍需盯住月末冲量后的回落。`}波峰、波谷分别出现在 ${trend.labels[maxIdx]}、${trend.labels[minIdx]}。`
      },
      {
        title: '地市影响',
        text: `${cityData.monthLabel} 全省流量收入 ${appendUnit(fmtNum(cityData.total, trend.unit), trend.unit)}，${top3.map(r => r.cityName).join('、')} 三地合计占 ${top3Share}%。${top3[0]?.cityName} 贡献最高（${top3[0]?.contrib}%），${top3[0]?.mom < -2 ? '也是本轮走弱最明显的地市，建议优先复盘 5G 与超套两类客群结构。' : '整体走势相对平稳，可作为稳盘基本盘。'}`
      },
      {
        title: '客群根因',
        text: `从指标树拆解看，流量收入异常主要由 ${branchNames} 三条路径解释，合计覆盖汇聚客群 ${agg?.scaleLabel || '—'}。${topBranch ? `其中 ${topBranch.metric} 贡献最高（${topBranch.contrib}%），对应 ${topBranch.segment?.name || '重点客群'}。` : ''}${alertCities.length ? `${alertCities.map(r => r.cityName).join('、')} 等地市客群环比波动较大，宜与链路画像联动分析。` : ''}`
      }
    ] : [
      {
        title: '指标趋势',
        text: `「${node?.name || '指标'}」近 12 个月呈${chg < 0 ? '波动下行' : '波动上行'}走势，最新值 ${appendUnit(fmtNum(last, trend.unit), trend.unit)}，环比 ${mom}。波峰与波谷出现在 ${trend.labels[maxIdx]}、${trend.labels[minIdx]}，最近账期环比 ${chgStr}%。${chg < -3 ? '近两个月走弱扩大，建议加强日粒度盯盘。' : '建议维持周度跟踪，关注月末冲量后的回落。'}`
      },
      {
        title: '地市影响',
        text: `${cityData.monthLabel} 江西省 ${cityData.rank.length} 个地市合计 ${appendUnit(fmtNum(cityData.total, trend.unit), trend.unit)}，${top3.map(r => r.cityName).join('、')} 合计占比 ${top3Share}%。${top3[0]?.cityName} 贡献最高（${top3[0]?.contrib}%），${top3[0]?.mom < -2 ? '环比走弱明显，是全省波动主要拖累地市。' : '走势相对平稳。'}建议对 ${top3.slice(0, 2).map(r => r.cityName).join('、')} 等重点地市开展结构复盘。`
      },
      {
        title: '客群根因',
        text: agg
          ? `根因链路识别 ${branches.length} 条传导路径，汇聚客群「${agg.name}」规模 ${agg.scaleLabel}，关联指标环比 ${metricMom}。${topBranch ? `主路径为「${topBranch.metric}」，贡献 ${topBranch.contrib || '—'}%。` : ''}${momNeg ? '客群规模随指标同步承压。' : '客群规模整体平稳。'}${alertCities.length ? `${alertCities.map(r => r.cityName).join('、')} 等地市客群环比异动突出。` : ''}`
          : '建议结合根因传导链路，从贡献最高的路径指标入手，对异动客群按地市拆解分析。'
      }
    ];

    return { points, cityRows, agg, branches, trafficRev };
  }

  function buildSegmentOpsAdvice(agg, cityRows, d, branches, trafficRev) {
    if (!agg) {
      return {
        intro: '建议结合根因传导链路，对汇聚客群按地市规模分层，优先在高规模地市开展精准营销。',
        items: [
          '梳理贡献最高的传导路径，明确可运营的关键过程指标。',
          '按地市客群规模排序，优先覆盖规模前列地市开展触达。',
          '运营后 7 天回溯指标与客群规模变化，评估成效并迭代策略。'
        ]
      };
    }

    const sortedByScale = [...cityRows].sort((a, b) => b.scale - a.scale);
    const topCities = sortedByScale.slice(0, 3);
    const totalScale = sortedByScale.reduce((s, r) => s + r.scale, 0) || 1;
    const top3Share = topCities.reduce((s, r) => s + r.scale, 0) / totalScale * 100;
    const alertCities = cityRows.filter(r => r.highlight);
    const metricMom = agg.metricMom || d?.step1?.mom || '—';
    const momNeg = String(metricMom).startsWith('-');
    const topBranch = branches[0];
    const cityCount = cityRows.length || 11;

    if (trafficRev) {
      const seg5g = branches.find(b => /5G/.test(b.metric || ''));
      const segOver = branches.find(b => /超套/.test(b.metric || ''));
      const segSuppress = branches.find(b => /抑制/.test(b.metric || ''));
      const intro = `本次异常共汇聚 ${agg?.scaleLabel || '—'} 客户，覆盖全省 ${cityCount} 个地市。${topCities.map(r => r.cityName).join('、')} 规模居前，合计约占 ${top3Share.toFixed(1)}%。三条链路分别对应 5G 使用不足、超套结构波动和 4G 抑制迁出，宜分路径施策。`;
      const items = [
        `5G 链路：优先在 ${topCities.slice(0, 2).map(r => r.cityName).join('、')} 对「${seg5g?.segment?.name || '5G智网流量受损客群'}」开展升档包与融合加固营销。`,
        `超套链路：针对「${segOver?.segment?.name || '超套结构波动客群'}」，推荐定向包、加油包组合，缓解套外波动。`,
        `抑制链路：面向「${segSuppress?.segment?.name || '4G抑制迁出客群'}」，通过触达唤醒与终端升档活动释放存量流量。`,
        alertCities.length
          ? `${alertCities.map(r => r.cityName).join('、')} 客群环比波动明显，可作为三类策略的优先试点地市。`
          : '建议先在规模靠前地市小范围试点，验证后再全省推广。'
      ];
      return { intro, items };
    }

    const intro = `汇聚客群「${agg.name}」总规模为 ${agg.scaleLabel}，覆盖江西省 ${cityCount} 个地市。${topCities.map(r => `${r.cityName}（${r.scaleLabel}）`).join('、')} 客群规模居前，合计约占 ${top3Share.toFixed(1)}%。${topBranch ? `主传导路径为「${topBranch.metric}」，贡献 ${topBranch.contrib || '—'}%。` : ''}`;

    const items = [
      `建议优先对 ${topCities.map(r => r.cityName).join('、')} 等客群规模较大的地市开展精准营销，集中资源触达高价值用户。`,
      alertCities.length
        ? `${alertCities.map(r => r.cityName).join('、')} 等地市客群环比异动明显，宜同步开展分层保有与挽留动作。`
        : '各地市客群环比整体平稳，可在高规模地市稳存基础上择机扩面营销。',
      momNeg
        ? '当前关联指标呈走弱态势，建议先在高规模地市试点运营动作，验证后再向全省推广。'
        : '建议结合客群标签与主传导路径，在高规模地市开展结构优化类营销活动。'
    ];

    return { intro, items };
  }

  function pickLocalFeatureValue(tagName, index, branchRank) {
    let h = 0;
    const seed = tagName + ':' + index + ':' + (branchRank || 0);
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i);
    h = Math.abs(h);
    const modes = ['是', '高', `≥${3 + h % 12}`, `(0~${100 + h % 400})`, `${45 + h % 50}%`];
    return modes[(index + h) % modes.length];
  }

  function buildBranchFeatureTags(branch) {
    const rank = branch.rank || 1;
    if (branch.portraitTags?.length) {
      return branch.portraitTags.slice(0, 5).map((t, i) => ({
        name: t.name,
        value: typeof window.resolveRcTagFeatureValue === 'function'
          ? window.resolveRcTagFeatureValue(t.name, i, rank)
          : pickLocalFeatureValue(t.name, i, rank)
      }));
    }

    const portrait = typeof window.buildRcBranchPortraitData === 'function'
      ? window.buildRcBranchPortraitData(branch)
      : null;
    const tagNames = (portrait?.tags || []).slice(0, 5).map(t => t.name);
    const fallback = (branch.tags || []).slice(0, 5);
    const names = tagNames.length ? tagNames : fallback;

    return names.map((name, i) => ({
      name,
      value: typeof window.resolveRcTagFeatureValue === 'function'
        ? window.resolveRcTagFeatureValue(name, i, rank)
        : pickLocalFeatureValue(name, i, rank)
    }));
  }

  function formatComboPartsHtml(parts, valueMap) {
    return (parts || []).map(p => {
      if (p.type === 'join') {
        const label = p.op === 'OR' ? '或' : '且';
        return `<span class="rc-ai-combo-op">${label}</span>`;
      }
      if (p.type === 'raw') {
        return `<span class="rc-ai-combo-tag">${esc(p.text)}</span>`;
      }
      const val = valueMap[p.tagName] || p.value;
      return `<span class="rc-ai-combo-tag">${esc(p.tagName)}=${esc(val)}</span>`;
    }).join('');
  }

  function buildFallbackComboParts(features, ruleExpr) {
    if (ruleExpr) {
      const tokens = String(ruleExpr).split(/\s+(AND|OR)\s+/i);
      const parts = [];
      for (let i = 0; i < tokens.length; i += 2) {
        if (i > 0) {
          parts.push({ type: 'join', op: (tokens[i - 1] || 'AND').toUpperCase() });
        }
        const token = tokens[i].trim();
        const feat = features.find(f => token.includes(f.name) || f.name.includes(token));
        parts.push({
          type: 'tag',
          tagName: feat?.name || token,
          value: feat?.value || '是'
        });
      }
      return parts;
    }
    return features.slice(0, 3).flatMap((f, i) => {
      const head = i > 0 ? [{ type: 'join', op: 'AND' }] : [];
      return head.concat([{ type: 'tag', tagName: f.name, value: f.value }]);
    });
  }

  function buildFeatureComboExprs(features, branch) {
    const names = features.map(f => f.name);
    if (!names.length) return [];

    const exprs = [];
    const seen = new Set();
    const add = (expr) => {
      const normalized = String(expr || '').trim();
      if (!normalized || seen.has(normalized)) return;
      const tokens = normalized.split(/\s+(AND|OR)\s+/i).filter((_, i) => i % 2 === 0);
      const allKnown = tokens.length && tokens.every(t => {
        const token = t.trim();
        return names.some(n => token.includes(n) || n.includes(token));
      });
      if (!allKnown) return;
      seen.add(normalized);
      exprs.push(normalized);
    };

    (branch.comboRules || branch.rules || []).forEach(r => add(r.expr));

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        add(`${names[i]} AND ${names[j]}`);
      }
    }

    if (names.length >= 3) {
      add(`${names[0]} AND ${names[1]} AND ${names[2]}`);
    }

    for (let i = 0; i < names.length - 1; i++) {
      add(`${names[i]} OR ${names[i + 1]}`);
    }

    if (names.length === 1) add(names[0]);

    return exprs.slice(0, 5);
  }

  function buildBranchFeatureCombos(branch, features) {
    const valueMap = Object.fromEntries(features.map(f => [f.name, f.value]));
    const exprs = buildFeatureComboExprs(features, branch);

    return exprs.map((expr, i) => {
      const parts = buildFallbackComboParts(features, expr);
      return {
        index: i + 1,
        html: formatComboPartsHtml(parts, valueMap)
      };
    }).filter(c => c.html);
  }

  function buildBranchSegmentTraits(branch) {
    const seg = branch.segment || {};
    const features = buildBranchFeatureTags(branch);
    const traitNames = features.map(f => f.name).join('/');
    const scale = seg.scaleLabel || seg.scale || '—';
    let intro = `客群「${seg.name || '链路客群'}」，规模 ${scale}。`;
    if (branch.segmentInsight) {
      intro += branch.segmentInsight;
    } else if (traitNames) {
      intro += `典型特征包括 ${traitNames.replace(/\//g, '、')}。`;
    }
    const combos = features.length ? buildBranchFeatureCombos(branch, features) : [];
    return { intro, features, combos, traitNames };
  }

  function renderBranchSegmentAnalysis(branch) {
    const { intro } = buildBranchSegmentTraits(branch);
    return `
      <div class="rc-ai-chain-seg">
        <p class="rc-ai-chain-seg-intro">${esc(intro)}</p>
      </div>`;
  }

  function renderBranchChainItem(branch) {
    const segHtml = renderBranchSegmentAnalysis(branch);
    const metricLabel = branch.metric ? ` · ${branch.metric}` : '';
    const lead = branch.conductionSummary || branch.chainLead || '';
    return `
      <div class="rc-ai-summary-chain-item">
        <h5 class="rc-ai-summary-chain-head">指标根因链路 ${branch.rank}${esc(metricLabel)} · 解释贡献 ${esc(String(branch.contrib ?? '—'))}%</h5>
        ${lead ? `<p class="rc-ai-chain-lead">${esc(lead)}</p>` : ''}
        ${segHtml}
      </div>`;
  }

  function renderSection(no, title, lead, dataHtml) {
    return `
      <section class="rc-report-section">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">${esc(no)}</span>${esc(title)}</h3>
        ${lead ? `<p class="rc-report-lead">${esc(lead)}</p>` : ''}
        <div class="rc-report-data">${dataHtml}</div>
      </section>`;
  }

  function renderAiSummaryPanel(summary, d) {
    const ordinals = ['一', '二', '三'];
    const items = (summary.points || []).map((p, i) =>
      `<li><strong>${ordinals[i] || i + 1}、${esc(p.title)}：</strong>${esc(p.text)}</li>`
    ).join('');

    const branches = window._rcBranchData || [];
    const chainBlocks = branches.map(b => renderBranchChainItem(b)).join('');

    const segmentOps = summary.segmentOps || buildSegmentOpsAdvice(
      summary.agg,
      summary.cityRows || [],
      d,
      branches,
      summary.trafficRev
    );
    const opsItems = (segmentOps.items || []).map(s => `<li>${esc(s)}</li>`).join('');
    const segmentOpsHtml = `
      <div class="rc-ai-summary-segment-ops">
        <h4 class="rc-ai-summary-segment-ops-head">运营建议</h4>
        <p class="rc-ai-summary-segment-ops-intro">${esc(segmentOps.intro)}</p>
        ${opsItems ? `<ul class="rc-ai-list rc-ai-summary-segment-ops-list">${opsItems}</ul>` : ''}
      </div>`;

    return `
      <section class="rc-report-section rc-report-ai-summary-section">
        <h3 class="rc-report-section-title"><i class="fas fa-wand-magic-sparkles"></i> AI小结</h3>
        <div class="rc-report-ai-summary-body">
          <ul class="rc-ai-list rc-ai-summary-points">${items}</ul>
          ${chainBlocks ? `
            <div class="rc-ai-summary-chains rc-ai-summary-chains-flat">
              <h4 class="rc-ai-summary-chains-title">根因链路解读</h4>
              ${chainBlocks}
            </div>` : ''}
          ${segmentOpsHtml}
        </div>
      </section>`;
  }

  function barSlotGeom(i, count, padL, innerW, barRatio) {
    const ratio = barRatio == null ? 0.48 : barRatio;
    const slot = innerW / count;
    const bw = slot * ratio;
    const x = padL + i * slot + (slot - bw) / 2;
    const cx = x + bw / 2;
    return { x, bw, cx, slot };
  }

  function buildYTicks(min, max, count) {
    const scale = buildFixedYScale(max - min, count || 5);
    return scale.ticks.map(v => v + (min || 0));
  }

  function renderAxisY(padL, padT, innerH, scale, unit, chartW, padR, tickFormatter) {
    const ticks = Array.isArray(scale) ? scale : scale.ticks;
    const min = Array.isArray(scale) ? scale[0] : scale.min;
    const max = Array.isArray(scale) ? scale[scale.length - 1] : scale.max;
    const right = chartW - (padR == null ? CHART_PAD_R : padR);
    const tickX = padL - 6;
    const fmt = tickFormatter || (v => formatAxisTick(v, unit));
    return ticks.map(v => {
      const y = padT + innerH - ((v - min) / (max - min || 1)) * innerH;
      return `
        <line x1="${padL}" y1="${y}" x2="${right}" y2="${y}" class="rc-chart-grid"/>
        <text x="${tickX}" y="${y}" class="rc-report-axis-tick" text-anchor="end" dominant-baseline="middle">${esc(fmt(v))}</text>`;
    }).join('') + `
        <line x1="${padL}" y1="${yAxisLineTop(padT)}" x2="${padL}" y2="${padT + innerH}" class="rc-chart-axis-line"/>`;
  }

  function valueToY(v, scale, padT, innerH) {
    const min = scale.min;
    const max = scale.max;
    return padT + innerH - ((v - min) / (max - min || 1)) * innerH;
  }

  function tipAttr(title, lines) {
    const safe = s => String(s).replace(/"/g, '&quot;');
    return `data-chart-tip="${safe(title)}" data-chart-lines="${safe(lines.join('|'))}"`;
  }

  function renderTrendChart(trend, metricName, opts) {
    const compact = opts?.compact;
    const chartValueInWan = opts?.chartValueInWan;
    const yAxisTitleLeft = opts?.yAxisTitleLeft;
    const uid = 'rc-chart-' + (++_chartUid);
    const rawVals = trend.values;
    const vals = chartValueInWan ? rawVals.map(v => v / 10000) : rawVals;
    const n = vals.length;
    const yScale = buildFixedYScale(Math.max(...vals, 1), 5);
    const frame = buildChartFrame({ compact });
    const { padT, padR, innerH, h, xLabelY } = frame;
    const tickUnit = chartValueInWan ? '万' : trend.unit;
    const padL = estimateChartPadL(yScale.ticks, tickUnit);
    const valueFmt = chartValueInWan
      ? v => formatWanTick(v)
      : v => formatAxisTick(v, trend.unit);
    const slotW = compact
      ? (COMPACT_CHART_VIEW_W - padL - CHART_PAD_R) / n
      : CHART_SLOT_W;
    const w = compact ? COMPACT_CHART_VIEW_W : padL + CHART_PAD_R + n * slotW;
    const innerW = w - padL - padR;
    const geoms = vals.map((_, i) => barSlotGeom(i, n, padL, innerW));
    const points = vals.map((v, i) => {
      const { cx } = geoms[i];
      return `${cx},${valueToY(v, yScale, padT, innerH)}`;
    }).join(' ');
    const bars = vals.map((v, i) => {
      const { x, bw } = geoms[i];
      const yTop = valueToY(v, yScale, padT, innerH);
      const yBase = valueToY(0, yScale, padT, innerH);
      const bh = Math.max(0, yBase - yTop);
      const rawV = rawVals[i];
      const prev = i > 0 ? rawVals[i - 1] : rawV;
      const momPct = prev ? ((rawV - prev) / prev * 100).toFixed(1) : '0';
      const valLabel = chartValueInWan
        ? formatWanTick(v) + '万'
        : appendUnit(fmtNum(rawV, trend.unit), trend.unit);
      const valShort = chartValueInWan
        ? formatWanTick(v)
        : compactBarValueLabel(rawV, trend.unit);
      const tip = tipAttr(trend.labels[i], [
        `指标：${metricName}`,
        `账期：${trend.labels[i]}`,
        `指标值：${valLabel}`,
        `环比：${+momPct >= 0 ? '+' : ''}${momPct}%`
      ]);
      const { cx } = geoms[i];
      const valueY = barValueLabelY(yTop, padT);
      return `
        <rect x="${x}" y="${yTop}" width="${bw}" height="${bh}" rx="3" ry="3"
          fill="${barGradientFill(uid, 'trend')}" class="rc-report-bar rc-chart-hit" ${tip}/>
        <text x="${cx}" y="${valueY}" class="rc-bar-value-label rc-chart-value-label" text-anchor="middle">${esc(valShort)}</text>`;
    }).join('');
    const lineOverlay = compact ? '' : `
          <polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="2" class="rc-chart-line"/>
          ${vals.map((v, i) => {
            const { cx } = geoms[i];
            const y = valueToY(v, yScale, padT, innerH);
            const valLabel = chartValueInWan
              ? formatWanTick(v) + '万'
              : appendUnit(fmtNum(rawVals[i], trend.unit), trend.unit);
            const tip = tipAttr(trend.labels[i], [`指标值：${valLabel}`]);
            return `<circle cx="${cx}" cy="${y}" r="3.5" fill="#3b82f6" stroke="#fff" stroke-width="1.5" class="rc-chart-hit" ${tip}/>`;
          }).join('')}`;
    const xLabels = trend.labels.map((lb, i) => {
      const { cx } = geoms[i];
      const short = lb.replace('2025-', '25/').replace('2026-', '26/');
      return `<text x="${cx}" y="${xLabelY}" class="rc-report-axis-tick rc-axis-tick-sm rc-chart-axis-label" text-anchor="middle" dominant-baseline="middle">${esc(short)}</text>`;
    }).join('');
    const hint = compact
      ? ''
      : `<p class="rc-report-sub rc-chart-unit-hint">纵轴：${esc(yAxisTitleLeft || axisValueLabel(trend.unit))} · 指标：${esc(metricName)}</p>`;
    const legend = compact
      ? `<div class="rc-chart-bar-legend"><span class="rc-chart-legend-item"><i class="rc-legend-swatch rc-legend-swatch-trend"></i>指标值</span></div>`
      : '';
    const svg = `
          ${renderBarGradientDefs(uid, ['trend'])}
          ${renderYAxisTitle(padL, padT, trend.unit, yAxisTitleLeft)}
          ${renderAxisY(padL, padT, innerH, yScale, tickUnit, w, CHART_PAD_R, valueFmt)}
          ${bars}
          ${lineOverlay}
          ${xLabels}`;
    return `${hint}${wrapChartSvg(uid, w, h, svg, { compact, ariaLabel: '近12个月趋势' })}${legend}`;
  }

  function renderCityBarChart(barPayload, unit, opts) {
    const payload = barPayload?.level
      ? barPayload
      : buildCityLevelBarPayload(barPayload);
    const layoutOpts = resolveCityChartLayoutOpts(payload.parts, opts || {});
    const compact = layoutOpts?.compact;
    const dualMomAxis = layoutOpts?.dualMomAxis;
    const chartValueInWan = layoutOpts?.chartValueInWan;
    const enableDrill = layoutOpts?.enableDrill !== false;
    const uid = 'rc-chart-' + (++_chartUid);
    const parts = payload.parts;
    const n = parts.length;
    const valueOf = p => chartValueInWan ? p.value / 10000 : p.value;
    const maxVal = Math.max(...parts.map(valueOf), 1);
    const yScale = buildFixedYScale(maxVal, 5);
    const frame = buildChartFrame({ compact });
    const { padT, innerH, h, xLabelY } = frame;
    const padRMom = dualMomAxis ? CHART_PAD_R_MOM : CHART_PAD_R;
    const tickUnit = chartValueInWan ? '万' : unit;
    const padL = estimateChartPadL(yScale.ticks, tickUnit);
    const colGap = compact
      ? (COMPACT_CHART_VIEW_W - padL - padRMom) / Math.max(n, 1)
      : CITY_COL_GAP;
    const barW = compact ? COMPACT_CHART_VIEW_W : padL + padRMom + n * colGap;
    const innerBarW = barW - padL - padRMom;
    const momScale = dualMomAxis ? buildMomYScale(parts.map(p => p.mom ?? 0)) : null;
    const yAxisTitleLeft = layoutOpts?.yAxisTitleLeft || (chartValueInWan ? '流量收入（万）' : undefined);
    const yAxisTitleRight = layoutOpts?.yAxisTitleRight || '环比';
    const valueFmt = chartValueInWan
      ? v => formatWanTick(v)
      : v => formatAxisTick(v, unit);
    const levelLabel = payload.level === 'county' ? '区县' : payload.level === 'grid' ? '网格' : '地市';

    const bars = parts.map((p, i) => {
      const itemName = barItemName(p);
      const { x, bw, cx } = barSlotGeom(i, n, padL, innerBarW);
      const chartVal = valueOf(p);
      const yTop = valueToY(chartVal, yScale, padT, innerH);
      const yBase = valueToY(0, yScale, padT, innerH);
      const bh = Math.max(0, yBase - yTop);
      const valLabel = chartValueInWan
        ? formatWanTick(chartVal) + '万'
        : appendUnit(fmtNum(p.value, unit), unit);
      const valShort = chartValueInWan
        ? formatWanTick(chartVal)
        : compactBarValueLabel(p.value, unit);
      const mom = p.mom ?? 0;
      const momLabel = p.momLabel || ((mom >= 0 ? '+' : '') + mom.toFixed(1) + '%');
      const prevLabel = p.prevValue != null
        ? (chartValueInWan
          ? formatWanTick(p.prevValue / 10000) + '万'
          : appendUnit(fmtNum(p.prevValue, unit), unit))
        : '—';
      const momDir = mom < -0.05 ? '环比下降' : mom > 0.05 ? '环比上升' : '环比持平';
      const tip = tipAttr(itemName, [
        `账期：${payload.monthLabel}`,
        `${levelLabel}：${itemName}`,
        `指标值：${valLabel}`,
        `上期值：${prevLabel}`,
        `环比：${momLabel}（${momDir}）`,
        `占比：${p.sharePct}%`
      ]);
      const valueY = barValueLabelY(yTop, padT);
      const xShort = itemName.replace(/市$|区$|县$/, '');
      const canDrill = enableDrill && p.drillable && p.drillTarget;
      const drillAttrs = canDrill
        ? ` data-rc-drill-bar="1" data-drill-level="${esc(p.drillTarget.level)}" data-drill-city-id="${esc(p.drillTarget.cityId || '')}" data-drill-city-name="${esc(p.drillTarget.cityName || '')}" data-drill-county-id="${esc(p.drillTarget.countyId || '')}" data-drill-county-name="${esc(p.drillTarget.countyName || '')}" data-drill-parent-value="${p.drillTarget.parentValue ?? p.value}"`
        : '';
      const barCls = canDrill ? 'rc-report-bar rc-chart-hit rc-chart-drill-bar' : 'rc-report-bar rc-chart-hit';
      const momDot = dualMomAxis ? (() => {
        const dotY = momToY(mom, momScale, padT, innerH);
        const momDirCls = cityBarMomClass(mom);
        const dotCls = momDirCls === 'up' ? 'rc-mom-dot-up' : momDirCls === 'down' ? 'rc-mom-dot-down' : 'rc-mom-dot-flat';
        const momTip = tipAttr(itemName, [`环比：${momLabel}`]);
        return `<circle cx="${cx}" cy="${dotY}" r="4.5" class="rc-mom-dot ${dotCls} rc-chart-hit" ${momTip}/>`;
      })() : '';
      const momText = dualMomAxis ? '' : (() => {
        const momCls = cityBarMomClass(mom);
        const { momY } = barLabelYs(yTop, padT);
        return `<text x="${cx}" y="${momY}" class="rc-bar-mom-label rc-bar-mom-${momCls}" text-anchor="middle">${esc(momLabel)}</text>`;
      })();
      return `
        <rect x="${x}" y="${yTop}" width="${bw}" height="${bh}" rx="3" ry="3"
          fill="${barGradientFill(uid, 'trend')}" class="${barCls}" ${tip}${drillAttrs}/>
        <text x="${cx}" y="${valueY}" class="rc-bar-value-label rc-chart-value-label" text-anchor="middle">${esc(valShort)}</text>
        ${momText}
        ${momDot}
        <text x="${cx}" y="${xLabelY}" class="rc-report-axis-tick rc-axis-tick-sm rc-city-x-label rc-chart-axis-label" text-anchor="middle" dominant-baseline="middle">${esc(xShort)}</text>`;
    }).join('');

    const legend = dualMomAxis
      ? `<div class="rc-chart-bar-legend">
        <span class="rc-chart-legend-item"><i class="rc-legend-swatch rc-legend-swatch-trend"></i>指标值</span>
        <span class="rc-chart-legend-item"><i class="rc-legend-dot rc-legend-dot-up"></i>环比增长</span>
        <span class="rc-chart-legend-item"><i class="rc-legend-dot rc-legend-dot-down"></i>环比下降</span>
      </div>`
      : `<div class="rc-chart-bar-legend">
        <span class="rc-chart-legend-item"><i class="rc-legend-swatch rc-legend-swatch-trend"></i>指标值</span>
        <span class="rc-chart-legend-item rc-legend-mom-up">环比上升</span>
        <span class="rc-chart-legend-item rc-legend-mom-down">环比下降</span>
        <span class="rc-chart-legend-item rc-legend-mom-flat">环比持平</span>
      </div>`;

    const svg = `
          ${renderBarGradientDefs(uid, ['trend'])}
          ${renderYAxisTitle(padL, padT, unit, yAxisTitleLeft, { alignLeft: true })}
          ${dualMomAxis ? renderYAxisTitleRight(barW, padRMom, padT, yAxisTitleRight) : ''}
          ${renderAxisY(padL, padT, innerH, yScale, tickUnit, barW, padRMom, valueFmt)}
          ${dualMomAxis ? renderAxisYRight(padRMom, padT, innerH, momScale, barW, padL) : ''}
          ${bars}`;
    return `${wrapChartSvg(uid, barW, h, svg, { compact, ariaLabel: cityChartLevelTitle(payload.level) + '柱状图' })}${legend}`;
  }

  function renderCityDrillChartBlock(initialPayload, unit, chartOpts) {
    const crumbHtml = renderDrillCrumbHtml(buildCityChartBreadcrumb(initialPayload));
    return `
      <div class="rc-v6-city-drill-chart" data-rc-city-drill>
        <div class="rc-v6-chart-toolbar">
          <div class="rc-v6-chart-toolbar-main">
            <h4 class="rc-v6-block-title" data-rc-drill-title>${esc(cityChartLevelTitle(initialPayload.level))}</h4>
          </div>
          <nav class="rc-chart-drill-crumb" data-rc-drill-crumb ${initialPayload.level === 'city' ? 'hidden' : ''}>${crumbHtml}</nav>
        </div>
        <div class="rc-chart-drill-host" data-rc-drill-host>
          ${renderCityBarChart(initialPayload, unit, chartOpts)}
        </div>
      </div>`;
  }

  function mountCityDrillChart(block, payload, unit, chartOpts) {
    const host = block.querySelector('[data-rc-drill-host]');
    const titleEl = block.querySelector('[data-rc-drill-title]');
    const crumbEl = block.querySelector('[data-rc-drill-crumb]');
    if (!host) return;
    host.innerHTML = renderCityBarChart(payload, unit, chartOpts);
    if (titleEl) titleEl.textContent = cityChartLevelTitle(payload.level);
    if (crumbEl) {
      crumbEl.hidden = payload.level === 'city';
      crumbEl.innerHTML = renderDrillCrumbHtml(buildCityChartBreadcrumb(payload));
    }
    bindChartTooltips(host);
  }

  function bindCityChartDrill(root, ctx) {
    const block = root.querySelector('[data-rc-city-drill]');
    if (!block || block._rcDrillBound) return;
    block._rcDrillBound = true;

    const chartOpts = {
      compact: true,
      dualMomAxis: !!ctx.trafficRev,
      chartValueInWan: !!ctx.trafficRev,
      yAxisTitleLeft: ctx.trafficRev ? '流量收入（万）' : undefined,
      yAxisTitleRight: ctx.trafficRev ? '环比' : undefined,
      enableDrill: true
    };

    const cityRoot = buildCityLevelBarPayload(ctx.cityData);
    const state = {
      root: cityRoot,
      segments: [cityRoot]
    };
    block._rcDrillState = state;
    block._rcDrillCtx = { node: ctx.node, unit: ctx.trend.unit, chartOpts };

    const refreshDrillView = () => {
      const { unit, chartOpts: opts } = block._rcDrillCtx;
      const current = state.segments[state.segments.length - 1];
      mountCityDrillChart(block, current, unit, opts);
    };

    const navigateToCrumb = (index) => {
      const idx = Number(index);
      if (!Number.isFinite(idx) || idx < 0 || idx >= state.segments.length - 1) return;
      state.segments = state.segments.slice(0, idx + 1);
      refreshDrillView();
    };

    const drillTo = (target) => {
      const { node } = block._rcDrillCtx;
      let next;
      if (target.level === 'county') {
        next = buildCountyLevelBarPayload(node, target.cityId, target.cityName, target.parentValue);
      } else if (target.level === 'grid') {
        next = buildGridLevelBarPayload(
          node, target.cityId, target.cityName, target.countyId, target.countyName, target.parentValue
        );
      }
      if (!next) return;
      state.segments.push(next);
      refreshDrillView();
    };

    block.addEventListener('click', e => {
      const crumbBtn = e.target.closest('[data-rc-drill-crumb-idx]');
      if (crumbBtn) {
        navigateToCrumb(crumbBtn.getAttribute('data-rc-drill-crumb-idx'));
        return;
      }
      const bar = e.target.closest('[data-rc-drill-bar]');
      if (bar) {
        drillTo({
          level: bar.dataset.drillLevel,
          cityId: bar.dataset.drillCityId,
          cityName: bar.dataset.drillCityName,
          countyId: bar.dataset.drillCountyId,
          countyName: bar.dataset.drillCountyName,
          parentValue: parseFloat(bar.dataset.drillParentValue)
        });
      }
    });
  }

  function bindChartTooltips(root) {
    root.querySelectorAll('[data-chart-root]').forEach(wrap => {
      const tip = wrap.querySelector('.rc-chart-tooltip');
      if (!tip) return;
      const show = (e, el) => {
        const title = el.getAttribute('data-chart-tip') || '';
        const lines = (el.getAttribute('data-chart-lines') || '').split('|').filter(Boolean);
        tip.innerHTML = `
          <strong class="rc-tip-title">${esc(title)}</strong>
          ${lines.map(l => `<span class="rc-tip-line">${esc(l)}</span>`).join('')}`;
        tip.hidden = false;
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left + 12;
        const y = e.clientY - rect.top - 8;
        tip.style.left = Math.min(x, rect.width - 180) + 'px';
        tip.style.top = Math.max(y, 8) + 'px';
      };
      const hide = () => { tip.hidden = true; };
      wrap.querySelectorAll('.rc-chart-hit').forEach(hit => {
        hit.addEventListener('mouseenter', e => show(e, hit));
        hit.addEventListener('mousemove', e => show(e, hit));
        hit.addEventListener('mouseleave', hide);
      });
    });
  }

  function momTrendPhrase(mom) {
    const n = parseMomNum(mom);
    if (n <= -5) return '大幅走弱';
    if (n < 0) return '环比回落';
    if (n >= 5) return '明显回升';
    if (n > 0) return '小幅回升';
    return '基本持平';
  }

  function buildConductionLinkExplain(from, to, isLastLink, anomalyName) {
    const a = from.name || '';
    const b = to.name || '';
    const aTrend = momTrendPhrase(from.mom);
    const bTrend = momTrendPhrase(to.mom);

    if (/登网/.test(a) && /DOU|流量/.test(b)) {
      return `「${a}」${aTrend}，说明部分用户虽有 5G 条件但未稳定登网，拉低了「${b}」${bTrend}，人均流量释放不足。`;
    }
    if (/DOU|流量/.test(a) && /5G智网|流量贡献/.test(b)) {
      return `「${a}」${aTrend}，直接拖累「${b}」${bTrend}，是流量规模未能有效放大的关键环节。`;
    }
    if (/终端/.test(a) && /(登网|DOU|5G)/.test(b)) {
      return `「${a}」${aTrend}，影响终端侧有效登网与使用，进而传导至「${b}」${bTrend}。`;
    }
    if (/超套|套外/.test(a) && /客群|客户/.test(b)) {
      return `「${a}」${aTrend}，带动「${b}」${bTrend}，套外用量结构变化会直接抬升计费波动压力。`;
    }
    if (/占比|渗透率/.test(a)) {
      return `「${a}」${aTrend}，改变客群结构占比，进而影响「${b}」${bTrend}。`;
    }
    if (/迁出|抑制|4G/.test(a)) {
      return `「${a}」${aTrend}，抑制存量有效流量释放，传导至「${b}」${bTrend}，形成结构性拖累。`;
    }
    if (/营业厅|渠道|办理/.test(a)) {
      return `「${a}」${aTrend}，线下触达与办理走弱，减少有效业务转化，进而影响「${b}」${bTrend}。`;
    }
    if (/活跃|APP/.test(a)) {
      return `「${a}」${aTrend}，自助渠道承接不足，间接拖累「${b}」${bTrend}。`;
    }
    if (/流失|降档|保有/.test(a)) {
      return `「${a}」${aTrend}，客群稳定性下降，传导至「${b}」${bTrend}，需优先开展保有干预。`;
    }
    if (isLastLink) {
      return `「${a}」${aTrend}，是「${anomalyName}」${bTrend}的重要过程驱动，建议从该环节入手排查。`;
    }
    return `「${a}」${aTrend}，业务上逐级传导至「${b}」${bTrend}。`;
  }

  function buildBranchConductionNarrative(branch, anomalyName, anomalyMom) {
    const chain = (branch.chain || []).slice();
    const leafName = branch.metric;
    if (leafName && !chain.some(m => m.name === leafName)) {
      chain.push({ name: leafName, value: branch.value, mom: branch.mom });
    } else if (leafName) {
      const idx = chain.findIndex(m => m.name === leafName);
      if (idx >= 0) {
        chain[idx] = { ...chain[idx], value: branch.value || chain[idx].value, mom: branch.mom || chain[idx].mom };
      }
    }

    const flowSteps = chain.length ? chain : [{ name: leafName || '过程指标', value: branch.value, mom: branch.mom }];
    const pathText = flowSteps.map(m => m.name).concat([anomalyName]).join(' → ');
    const headline = branch.chainLead
      || `沿传导路径「${pathText}」，是「${anomalyName}」异动的重要解释路径之一（影响度 ${branch.contrib ?? '—'}%）。`;

    const links = [];
    for (let i = 0; i < flowSteps.length; i++) {
      const next = i === flowSteps.length - 1
        ? { name: anomalyName, mom: anomalyMom, isAnomaly: true }
        : flowSteps[i + 1];
      links.push(buildConductionLinkExplain(flowSteps[i], next, i === flowSteps.length - 1, anomalyName));
    }

    const closing = branch.conductionSummary
      || branch.segmentInsight
      || (branch.segment?.name
        ? `综合来看，该路径主要影响「${branch.segment.name}」（${branch.segment.scaleLabel || branch.segment.scale || '—'}），建议结合链路过程指标开展精准运营。`
        : '建议沿该传导路径，从波动最大的过程指标入手开展专项复盘。');

    return { headline, pathText, links, closing };
  }

  function enrichBranchesConduction(branches, d, node) {
    const anomalyName = d?.metricName || node?.name || '异常指标';
    const anomalyMom = d?.step1?.mom || node?.mom || '—';
    return (branches || []).map(b => ({
      ...b,
      conductionNarrative: buildBranchConductionNarrative(b, anomalyName, anomalyMom)
    }));
  }

  function shortCauseTitle(branch) {
    const metric = branch?.metric || '';
    if (/5G/.test(metric)) return '5G 智网月流量走弱，套餐升档与登网释放不足';
    if (/超套/.test(metric)) return '超套收入结构波动，套外依赖客群不稳固';
    if (/抑制|4G/.test(metric)) return '4G 存量迁出抑制，终端升级带动不足';
    if (/套外/.test(metric)) return '套外收入依赖偏高，套餐内结构承压';
    if (/营业厅|渠道/.test(metric)) return '线下渠道办理走弱，触达转化不足';
    if (/APP|活跃/.test(metric)) return 'APP 活跃偏低，自助渠道承接不足';
    if (/流失/.test(metric)) return '流失风险客群扩大，保有压力上升';
    return `${metric || '主传导指标'}传导偏弱`;
  }

  function parseScaleNum(label) {
    const n = parseInt(String(label || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function parseMomNum(mom) {
    const n = parseFloat(String(mom || '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  /** 影响范围：环比下滑的地市数量 */
  function buildImpactScopeLabel(cityData) {
    const rank = cityData?.rank || [];
    const declined = rank.filter(r => {
      const mom = typeof r.mom === 'number' ? r.mom : parseMomNum(r.momLabel ?? r.mom);
      return mom < 0;
    }).length;
    return `${declined}地市环比下滑`;
  }

  function formatCustomerMagnitude(num) {
    const n = Math.round(Number(num) || 0);
    return `${n.toLocaleString('zh-CN')} 人`;
  }

  function buildReportContext(node, d, trend, cityData, agg, cityRows) {
    const branches = enrichBranchesConduction(window._rcBranchData || d?.branches || [], d, node);
    const top = branches[0];
    const trafficRev = isTrafficFlowRevenue(node, d);
    const mom = d?.step1?.mom || node?.mom || '—';
    const momNum = parseMomNum(mom);
    const momNeg = momNum < 0;
    const branchScale = branches.reduce((sum, b) => {
      const segList = b.segments || [];
      if (segList.length) return sum + segList.reduce((s, seg) => s + parseScaleNum(seg.scale), 0);
      return sum + parseScaleNum(b.segment?.scale || b.segment?.scaleLabel);
    }, 0);
    const affectedNum = parseScaleNum(agg?.scaleLabel || agg?.scale) || branchScale || 20162;
    const cityTrends = buildCityMonthlyTrends(node, cityData, CITY_TREND_MONTHS);
    const top2Share = (cityData.rank || []).slice(0, 2).reduce((s, r) => s + (r.contrib || 0), 0);

    let oneLine;
    if (trafficRev && momNeg) {
      oneLine = '流量收入出现明显异动，首要原因是 5G 使用未充分释放，叠加超套结构与 4G 迁出压制，共同拖累全省流量收入表现。';
    } else {
      const metricName = d?.metricName || node?.name || '指标';
      oneLine = `「${metricName}」出现${momNeg ? '走弱' : '波动'}异动，主传导路径「${top?.metric || '—'}」解释力居前，需按根因链路分路径施策。`;
    }

    let levelKey = 'mild';
    let levelLabel = '🟡 轻微';
    if (momNum <= -5 || Math.abs(momNum) >= 8) { levelKey = 'severe'; levelLabel = '🔴 严重'; }
    else if (momNum <= -2) { levelKey = 'moderate'; levelLabel = '🟠 中度'; }

    const negativeMonths = (trend.momChanges || []).filter(m => m.chg < 0).length;
    const lastTwo = (trend.momChanges || []).slice(-2);
    const worsening = lastTwo.length >= 2 && lastTwo.every(m => m.chg < 0);

    const scopeLabel = buildImpactScopeLabel(cityData);
    const scopeType = top2Share >= 45 ? 'regional' : 'province';

    const timePattern = buildTimePatternAnalysis(trend);
    const cityLocation = buildCityLocationAnalysis(cityData, cityTrends);
    const valueTiers = buildValueTierData(agg);
    const dispatchCities = cityLocation.focusCities.length
      ? cityLocation.focusCities
      : cityTrends.filter(c => c.status === 'deteriorated').slice(0, 3);

    const segmentAiSummary = buildSegmentAiSummary(cityRows, agg, branches, trafficRev);
    const currentMetricValue = fmtMetricValue(d?.step1?.value || node?.value, node);
    const segmentReasonAnalysis = buildSegmentReasonAnalysis(cityRows, cityData, cityTrends, trafficRev);
    const segmentCityCards = buildSegmentCityCards(cityRows, cityData);
    const arpuTiers = buildArpuTierData(agg, trafficRev);
    const douTags = buildDouTagDistribution(agg, trafficRev);
    const segmentDimensionTexts = buildSegmentDimensionTexts(cityRows, cityData, arpuTiers, douTags, agg, trafficRev);
    const actionRecommendations = buildActionRecommendations({
      dispatchCities, branches, trafficRev, momNeg, cityLocation,
      metricName: d?.metricName || node?.name,
      agg, segmentCityCards, cityRows
    });

    return {
      node, d, trend, cityData, agg, cityRows, branches, trafficRev, mom, momNeg,
      oneLine, levelKey, levelLabel, scopeLabel, scopeType,
      durationMonths: Math.max(negativeMonths, 2),
      worsening,
      currentMetricValue,
      customerMagnitude: formatCustomerMagnitude(affectedNum),
      cityTrends, cityLocation, timePattern, valueTiers, dispatchCities, segmentAiSummary,
      segmentReasonAnalysis, segmentCityCards, arpuTiers, douTags, segmentDimensionTexts,
      actionRecommendations
    };
  }

  function buildSegmentReasonAnalysis(cityRows, cityData, cityTrends, trafficRev) {
    const rankMap = Object.fromEntries((cityData?.rank || []).map(r => [r.cityId, r]));
    const topRows = [...(cityRows || [])].sort((a, b) => b.scale - a.scale).slice(0, 3);
    const topNames = topRows.map(r => r.cityName.replace('市', ''));
    const incomeShare = topRows.reduce((s, r) => s + (rankMap[r.cityId]?.contrib || 0), 0).toFixed(1);
    const volatileCount = (cityTrends || []).filter(c => c.status === 'deteriorated').length;
    if (trafficRev && topNames.length >= 2) {
      return `${topNames.join('、')}三地收入合计占 ${incomeShare}%，根因客群规模及波动在以上区域最为突出，建议作为先期试点区域开展分路径精准运营，验证成效后再逐步推广至全省。`;
    }
    if (topNames.length >= 2) {
      return `${topNames.join('、')}三地根因客群规模居前，合计收入占比 ${incomeShare}%，且 ${volatileCount || '多'} 个地市近月客群波动明显，建议优先在上述区域开展保有与结构优化试点。`;
    }
    return '根因客群在地市间分布相对集中，建议优先在规模靠前且波动明显的地市开展干预试点。';
  }

  function buildArpuTierData(agg, trafficRev) {
    const total = parseScaleNum(agg?.scaleLabel) || 20000;
    const specs = trafficRev
      ? [
        { tier: '高 ARPU（≥100元）', ratio: 34, note: '贡献收入占比高，对流量收入波动敏感' },
        { tier: '中 ARPU（50-100元）', ratio: 41, note: '规模主体，升档与套餐匹配是关键' },
        { tier: '低 ARPU（<50元）', ratio: 25, note: '单价偏低但基数大，需防止进一步降档流失' }
      ]
      : [
        { tier: '高 ARPU（≥100元）', ratio: 28, note: '价值贡献高，异动对整体指标拉动明显' },
        { tier: '中 ARPU（50-100元）', ratio: 45, note: '客群规模最大，是稳盘与结构优化的主战场' },
        { tier: '低 ARPU（<50元）', ratio: 27, note: '需关注保有与升档空间，避免低价值固化' }
      ];
    return specs.map(s => ({
      ...s,
      count: Math.round(total * s.ratio / 100),
      countLabel: Math.round(total * s.ratio / 100).toLocaleString() + ' 人'
    }));
  }

  function buildDouTagDistribution(agg, trafficRev) {
    const total = parseScaleNum(agg?.scaleLabel) || 20000;
    const specs = trafficRev
      ? [
        { tag: '高 DOU（≥20G）', ratio: 22, trend: '回落', insight: '高用量客户流量释放放缓，对 5G 智网贡献拖累最大' },
        { tag: '中 DOU（5-20G）', ratio: 48, trend: '波动', insight: '主力用量带，套餐档位与真实用量错配问题突出' },
        { tag: '低 DOU（<5G）', ratio: 30, trend: '拖累', insight: '低活跃客群占比偏高，拉低整体 DOU 与流量贡献' }
      ]
      : [
        { tag: '高 DOU（≥20G）', ratio: 18, trend: '波动', insight: '高用量客户对套外与超套结构变化更敏感' },
        { tag: '中 DOU（5-20G）', ratio: 52, trend: '承压', insight: '规模占比最高，是异动客群的主体构成' },
        { tag: '低 DOU（<5G）', ratio: 30, trend: '平稳', insight: '低用量客群相对稳定，但升档潜力有限' }
      ];
    return specs.map(s => ({
      ...s,
      count: Math.round(total * s.ratio / 100),
      countLabel: Math.round(total * s.ratio / 100).toLocaleString() + ' 人'
    }));
  }

  function buildSegmentDimensionTexts(cityRows, cityData, arpuTiers, douTags, agg, trafficRev) {
    const sorted = [...(cityRows || [])].sort((a, b) => b.scale - a.scale);
    const top3 = sorted.slice(0, 3);
    const rankMap = Object.fromEntries((cityData?.rank || []).map(r => [r.cityId, r]));
    const top3Income = top3.reduce((s, r) => s + (rankMap[r.cityId]?.contrib || 0), 0).toFixed(1);
    const volatile = sorted.filter(r => r.highlight || r.momVal <= -2.5);
    const topArpu = arpuTiers.reduce((a, b) => (a.ratio > b.ratio ? a : b));
    const stressedDou = douTags.find(d => d.trend === '回落' || d.trend === '承压') || douTags[1];

    return {
      city: sorted.length
        ? `全省 ${sorted.length} 个地市均有根因客群覆盖。${top3.map(r => r.cityName.replace('市', '')).join('、')} 规模居前，合计收入占比约 ${top3Income}%。${volatile.length ? `${volatile.slice(0, 3).map(r => r.cityName.replace('市', '')).join('、')} 等地市环比波动突出，建议优先投放干预资源。` : '各地市波动相对平稳，可按规模梯度推进。'}`
        : '暂无地市维度客群数据。',
      arpu: `按 ARPU 分层，${topArpu.tier.replace(/（.*?）/, '')}客群占比 ${topArpu.ratio}%（${topArpu.countLabel}），${topArpu.note}。${trafficRev ? '流量收入异动场景下，中高价 ARPU 客群的套餐匹配与升档空间尤为关键。' : '建议针对高 ARPU 客群开展保有，对中低 ARPU 客群推进升档与结构优化。'}`,
      dou: `按流量 DOU 分布，${stressedDou.tag} 客群占比 ${stressedDou.ratio}%（${stressedDou.countLabel}），近月${stressedDou.trend}。${stressedDou.insight}。${agg?.name ? `与汇聚客群「${agg.name}」的典型用网特征高度吻合。` : ''}`
    };
  }

  function buildSegmentCityCards(cityRows, cityData) {
    const rankMap = Object.fromEntries((cityData?.rank || []).map(r => [r.cityId, r]));
    return [...(cityRows || [])]
      .sort((a, b) => b.scale - a.scale)
      .map((r, i) => {
        const rank = rankMap[r.cityId];
        return {
          index: i + 1,
          cityName: r.cityName,
          scaleLabel: r.scaleLabel,
          incomeShare: rank ? `${rank.contrib}%` : r.share
        };
      });
  }

  function buildActionRecommendations(ctx) {
    const {
      branches, trafficRev, agg, segmentCityCards, cityRows, metricName, momNeg
    } = ctx;
    const topCities = (segmentCityCards || []).slice(0, 3).map(c => c.cityName.replace('市', ''));
    const cityHint = topCities.length ? `重点覆盖 ${topCities.join('、')} 等规模靠前地市。` : '';

    if (trafficRev && branches.length) {
      const seg5g = branches.find(b => /5G智网/.test(b.metric || ''));
      const segOver = branches.find(b => /超套/.test(b.metric || ''));
      const segSuppress = branches.find(b => /抑制/.test(b.metric || ''));
      return [
        {
          title: `优先处置：${seg5g?.segment?.name || '5G智网流量受损客群'}`,
          text: `该客群与 5G 智网月流量贡献链路直接相关，规模 ${seg5g?.segment?.scaleLabel || '—'}。建议手段：开展 5G 升档包与融合加固营销、机套适配专项触达、登网激活短信推送，推动终端客户向有效登网转化。${cityHint}`
        },
        {
          title: `重点优化：${segOver?.segment?.name || '超套结构波动客群'}`,
          text: `该客群承载超套链路传导压力，规模 ${segOver?.segment?.scaleLabel || '—'}。建议手段：组合推荐定向流量包与加油包、对超套高依赖客户开展套餐结构优化，抑制套外波动对流量收入的拖累。${cityHint}`
        },
        {
          title: `同步干预：${segSuppress?.segment?.name || '4G抑制迁出客群'}`,
          text: `该客群反映 4G 迁出抑制与套餐扩容走弱，规模 ${segSuppress?.segment?.scaleLabel || '—'}。建议手段：推进终端升档与触达唤醒活动、套餐扩容升档专项发展，释放存量有效流量。${cityHint}`
        }
      ];
    }

    const topBranch = branches[0];
    const sorted = [...(cityRows || [])].sort((a, b) => b.scale - a.scale);
    const topSeg = sorted[0];
    const items = [];
    if (topBranch?.segment?.name) {
      items.push({
        title: `优先处置：${topBranch.segment.name}`,
        text: `主传导路径「${topBranch.metric}」对应客群规模 ${topBranch.segment.scaleLabel || '—'}，建议围绕该链路过程指标开展精准保有与结构优化。${cityHint}`
      });
    }
    branches.slice(1, 3).forEach(b => {
      if (!b.segment?.name) return;
      items.push({
        title: `协同关注：${b.segment.name}`,
        text: `解释贡献 ${b.contrib ?? '—'}%，建议结合「${b.metric}」传导路径开展分层触达与套餐匹配优化。`
      });
    });
    if (!items.length) {
      items.push({
        title: `优先处置：${agg?.name || '异动汇聚客群'}`,
        text: `建议对规模居前的根因客群开展分层干预，${momNeg ? '当前指标环比走弱，宜设定 2 周核查与 1 月改善目标。' : '宜建立周度跟踪机制。'}${topSeg ? `优先覆盖 ${topSeg.cityName.replace('市', '')} 等地市。` : ''}`
      });
    }
    return items;
  }

  function buildTimePatternAnalysis(trend) {
    const changes = trend.momChanges || [];
    const vals = trend.values || [];
    if (changes.length < 3) return { type: 'cyclical', label: '周期性波动', text: '近月指标在区间内反复波动，暂未形成单边趋势。' };
    const last3 = changes.slice(-3).map(c => c.chg);
    const lastDrop = last3[last3.length - 1];
    const prevDrop = last3[last3.length - 2];
    const range = Math.max(...vals) - Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const volatility = range / (avg || 1);
    if (lastDrop < -8 && lastDrop < prevDrop * 1.8) {
      return { type: 'cliff', label: '突然断崖', text: `最近账期环比骤降 ${lastDrop.toFixed(1)}%，较前月明显放大，属于突然断崖式走弱，需立即排查结构性事件。` };
    }
    if (last3.filter(c => c < 0).length >= 2 && Math.abs(lastDrop) < 5) {
      return { type: 'slow', label: '缓慢下降', text: '近 3 个月环比连续走弱但幅度可控，属于缓慢下降型异动，宜持续跟踪并提前干预。' };
    }
    if (volatility > 0.12) {
      return { type: 'cyclical', label: '周期性波动', text: '指标在账期间呈现峰谷交替，整体属于周期性波动，需区分季节性因素与结构性拖累。' };
    }
    return { type: 'slow', label: '缓慢下降', text: '指标整体呈缓慢走弱，建议结合地市与客群结构定位主要拖累来源。' };
  }

  function buildCityLocationAnalysis(cityData, cityTrends) {
    const rank = cityData.rank || [];
    const rankMap = Object.fromEntries(rank.map(r => [r.cityId, r]));
    const top2 = rank.slice(0, 2);
    const top2Share = top2.reduce((s, r) => s + (r.contrib || 0), 0);
    const deteriorated = cityTrends.filter(c => c.status === 'deteriorated');
    const improved = cityTrends.filter(c => c.status === 'improved');
    const isRegional = top2Share >= 45;
    let text;
    if (isRegional) {
      text = `当前异动呈现「区域集中型」，主要集中在 ${top2.map(r => r.cityName.replace('市', '')).join('与')}，合计占比约 ${top2Share.toFixed(0)}%。`;
    } else {
      text = '当前异动呈现「全省扩散型」，多数地市同步承压，需从全省层面统筹施策。';
    }
    if (deteriorated.length && improved.length) {
      text += ` 环比维度：${deteriorated.length} 个地市下降、${improved.length} 个地市增长，地市间走势分化。`;
    }
    const mapCityMom = c => ({
      cityId: c.cityId,
      cityName: c.cityName,
      recentMomLabel: rankMap[c.cityId]?.momLabel || c.recentMomLabel || c.momLabel,
      momLabel: rankMap[c.cityId]?.momLabel || c.recentMomLabel || c.momLabel,
      changeLabel: rankMap[c.cityId]?.momLabel || c.recentMomLabel || c.changeLabel,
      contrib: c.contrib ?? rankMap[c.cityId]?.contrib
    });
    const focusCities = (deteriorated.length ? deteriorated : rank.slice(0, 3).map(r => ({
      cityId: r.cityId,
      cityName: r.cityName,
      momLabel: r.momLabel,
      contrib: r.contrib
    }))).map(mapCityMom);
    return {
      text,
      isRegional,
      top2Share,
      focusCities,
      deteriorated: deteriorated.map(mapCityMom),
      improved: improved.map(mapCityMom)
    };
  }

  function buildValueTierData(agg) {
    const total = parseScaleNum(agg?.scaleLabel) || 20000;
    const ratios = [32, 41, 27];
    const labels = ['高价值', '中价值', '低价值'];
    return labels.map((tier, i) => ({
      tier,
      ratio: ratios[i],
      count: Math.round(total * ratios[i] / 100),
      countLabel: Math.round(total * ratios[i] / 100).toLocaleString() + ' 人'
    }));
  }

  function buildSegmentAiSummary(cityRows, agg, branches, trafficRev) {
    const topCity = (cityRows || []).find(r => r.highlight) || cityRows?.[0];
    const cityName = topCity?.cityName?.replace('市', '') || '南昌';
    const segName = agg?.name || branches[0]?.segment?.name || '异动客群';
    if (/家庭|融合/.test(segName)) {
      return `${cityName}地区高价值家庭客户受影响最严重，建议优先在该区域开展保有与升档动作。`;
    }
    if (trafficRev) {
      return `${cityName}地区 5G 智网与超套相关客群受影响最严重，需分路径开展精准运营。`;
    }
    return `${cityName}地区「${segName}」规模占比最高且环比承压，建议作为首批干预对象。`;
  }

  function renderTrendWindowChart(trend, metricName, windowMonths, opts) {
    const n = windowMonths || 13;
    const labels = trend.labels.slice(-n);
    const values = trend.values.slice(-n);
    const subTrend = { ...trend, labels, values };
    return renderTrendChart(subTrend, metricName, opts);
  }

  function renderCityRankTable(cityData) {
    const rows = (cityData.rank || []).map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${esc(r.cityName)}</strong></td>
        <td>${esc(appendUnit(fmtNum(r.value, ''), ''))}</td>
        <td>${esc(String(r.contrib))}%</td>
        <td class="${r.mom < 0 ? 'neg' : 'pos'}">${esc(r.momLabel || '—')}</td>
      </tr>`).join('');
    return `
      <div class="table-scroll rc-city-rank-table-wrap">
        <table class="data-table rc-city-rank-table">
          <thead><tr><th>排名</th><th>地市</th><th>指标值</th><th>贡献占比</th><th>环比</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderSection1Summary(ctx) {
    return `
      <section class="rc-report-section rc-v6-section">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">①</span>异动指标摘要</h3>
        ${renderProse({ label: 'AI 摘要', text: ctx.oneLine })}
        <div class="rc-v6-status-grid">
          <div class="rc-v6-status-card">
            <span class="k">当前指标值</span><strong>${esc(ctx.currentMetricValue)}</strong>
          </div>
          <div class="rc-v6-status-card">
            <span class="k">影响范围</span><strong>${esc(ctx.scopeLabel)}</strong>
          </div>
          <div class="rc-v6-status-card">
            <span class="k">环比</span><strong>${esc(ctx.mom)}</strong>
          </div>
          <div class="rc-v6-status-card">
            <span class="k">影响客户规模</span><strong>${esc(ctx.customerMagnitude)}</strong>
          </div>
        </div>
      </section>`;
  }

  function renderSection2Location(ctx) {
    const chartOpts = {
      compact: true,
      dualMomAxis: !!ctx.trafficRev,
      chartValueInWan: !!ctx.trafficRev,
      yAxisTitleLeft: ctx.trafficRev ? '流量收入（万）' : undefined,
      yAxisTitleRight: ctx.trafficRev ? '环比' : undefined,
      enableDrill: true
    };
    const cityPayload = buildCityLevelBarPayload(ctx.cityData);
    return `
      <section class="rc-report-section rc-v6-section">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">②</span>异动指标定位</h3>
        <div class="rc-v6-dual-chart-row">
          <div class="rc-v6-chart-panel">
            ${renderCityDrillChartBlock(cityPayload, ctx.trend.unit, chartOpts)}
          </div>
          <div class="rc-v6-chart-panel">
            <h4 class="rc-v6-block-title">时间数据（近 ${CITY_TREND_MONTHS} 个月）</h4>
            ${renderTrendWindowChart(ctx.trend, ctx.d.metricName, CITY_TREND_MONTHS, chartOpts)}
          </div>
        </div>
      </section>`;
  }

  function renderSection3Drivers(ctx) {
    const cards = ctx.branches.map((b, i) => {
      const narrative = b.conductionNarrative || {};
      const pathText = narrative.pathText || '';
      const summary = b.conductionSummary || narrative.closing || '';
      return `
        <div class="rc-v6-driver-card">
          <div class="rc-v6-driver-head">
            <span class="rc-v6-driver-rank">链路 ${i + 1}</span>
            <span class="rc-v6-driver-metric">${esc(b.metric || '—')}</span>
            <span class="rc-v6-driver-contrib">影响度 ${esc(String(b.contrib ?? '—'))}%</span>
          </div>
          <div class="rc-v6-driver-body">
            ${pathText ? `<p class="rc-v6-driver-path">传导路径：${esc(pathText)}</p>` : ''}
            ${summary ? `<p class="rc-v6-driver-summary">${esc(summary)}</p>` : ''}
          </div>
        </div>`;
    }).join('');
    return `
      <section class="rc-report-section rc-v6-section">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">③</span>异动驱动因素</h3>
        <p class="rc-report-lead muted">基于指标树拆解的三条根因传导链路，按过程指标逐级归因至流量收入异动。</p>
        <div class="rc-v6-driver-grid">${cards || '<p class="muted">暂无驱动因素</p>'}</div>
      </section>`;
  }

  function renderSection4Chain(chainHtml) {
    return `
      <section class="rc-report-section rc-v6-section rc-report-section-segment">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">④</span>异动指标根因链路分析</h3>
        <div class="rc-report-causal-wrap">${chainHtml || ''}</div>
      </section>`;
  }

  function renderSegmentCityCardGrid(cards) {
    if (!cards?.length) return '<p class="muted">暂无地市客群数据</p>';
    return `
      <div class="rc-v6-city-tier-grid rc-v6-city-rank-row">
        ${cards.map(c => `
          <div class="rc-v6-city-tier-card rc-v6-city-rank-card">
            <div class="rc-v6-city-tier-head">
              <span class="rc-v6-city-card-no">${esc(c.index)}</span>
              <span class="rc-v6-city-card-name">${esc(c.cityName.replace('市', ''))}</span>
            </div>
            <div class="rc-v6-city-tier-scale">${esc(c.scaleLabel.replace(' 人', ''))}<span class="u">人</span></div>
            <div class="rc-v6-city-tier-meta">
              <span>占比 ${esc(c.incomeShare)}</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function renderSection5Segment(ctx) {
    return `
      <section class="rc-report-section rc-v6-section">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">⑤</span>异动客群分析</h3>
        <h4 class="rc-v6-block-title">地市客群规模排名 <span class="rc-v6-block-sub">（按规模降序 · 全省 ${ctx.segmentCityCards?.length || 0} 个地市）</span></h4>
        ${renderSegmentCityCardGrid(ctx.segmentCityCards)}
      </section>`;
  }

  function renderArpuTierSection(arpuTiers) {
    const rows = (arpuTiers || []).map(t => `
      <div class="rc-v6-tier-row">
        <span class="rc-v6-tier-label">${esc(t.tier)}</span>
        <div class="rc-v6-tier-track"><div class="rc-v6-tier-bar rc-v6-tier-bar-arpu" style="width:${t.ratio}%"></div></div>
        <span class="rc-v6-tier-val">${esc(t.countLabel)}（${t.ratio}%）</span>
      </div>`).join('');
    return `
      <div class="rc-v6-dimension-block">
        <div class="rc-v6-tier-chart">${rows}</div>
      </div>`;
  }

  function renderDouTagSection(douTags) {
    const cards = (douTags || []).map(d => `
      <div class="rc-v6-dou-card">
        <div class="rc-v6-dou-card-head">
          <strong>${esc(d.tag)}</strong>
          <span class="rc-v6-dou-trend">${esc(d.trend)}</span>
        </div>
        <div class="rc-v6-dou-scale">${esc(d.countLabel)} <span class="muted">· ${d.ratio}%</span></div>
        <p class="rc-v6-dou-insight">${esc(d.insight)}</p>
      </div>`).join('');
    return `<div class="rc-v6-dou-grid">${cards}</div>`;
  }

  function formatDispatchCitySuggestion(dispatchCities, cityRows) {
    const rowMap = Object.fromEntries((cityRows || []).map(r => [r.cityId, r]));
    const parts = (dispatchCities || []).map(c => {
      const row = rowMap[c.cityId] || {};
      const name = c.cityName || row.cityName || '—';
      const scale = row.scaleLabel || '—';
      const share = row.share || (c.contrib != null ? `${c.contrib}%` : '—');
      const mom = row.mom || c.momLabel || c.changeLabel || c.recentMomLabel || '—';
      return `${name}（客群规模 ${scale}，占比 ${share}，环比 ${mom}）`;
    });
    if (!parts.length) return '';
    return `结合客群规模，建议优先调度以下地市客群进行指标干预：${parts.join('、')}。`;
  }

  function renderSection6Actions(ctx) {
    const recItems = (ctx.actionRecommendations || []).map(r => `
      <li class="rc-v6-rec-item">
        <strong>${esc(r.title)}</strong>
        <p>${esc(r.text)}</p>
      </li>`).join('');
    const dispatchList = formatDispatchCitySuggestion(ctx.dispatchCities, ctx.cityRows);
    const cityIds = (ctx.dispatchCities || []).map(c => c.cityId).filter(Boolean).join(',');
    return `
      <section class="rc-report-section rc-v6-section rc-v6-section-action">
        <h3 class="rc-report-section-title"><span class="rc-report-sec-no">⑥</span>处置建议</h3>
        <p class="rc-report-lead">结合上文三条根因链路与地市客群排名，建议优先对以下客群开展干预，并匹配相应运营手段。</p>
        <ul class="rc-v6-rec-list">${recItems}</ul>
        ${dispatchList ? renderProse({ label: '建议调度地市', text: dispatchList }) : ''}
        ${cityIds ? `<div class="rc-v6-action-foot">
          <button type="button" class="btn btn-primary" data-rc-dispatch-all data-city-ids="${esc(cityIds)}"><i class="fas fa-paper-plane"></i> 批量一键调度</button>
        </div>` : ''}
      </section>`;
  }

  function bindRcReportActions(root, node, ctx) {
    root.querySelector('[data-rc-dispatch-all]')?.addEventListener('click', e => {
      const ids = (e.currentTarget.dataset.cityIds || '').split(',').filter(Boolean);
      if (typeof window.openMetricDispatchWizard === 'function') {
        window.openMetricDispatchWizard(node, { precheckedCityIds: ids });
      }
    });
  }

  function formatKpiValue(node, raw) {
    return fmtMetricValue(raw, node);
  }

  window.renderRcAnalysisReport = function (d, node, containerId, hooks) {
    const el = document.getElementById(containerId || 'root-cause-flow');
    if (!el || !d?.isAlert) return;

    _chartUid = 0;
    const trend = buildTrendSeries(node);
    const cityData = buildCityImpactData(node, d?.step1?.value || node?.value);
    const agg = window._rcAggregatedSegment;
    const cityRows = agg && typeof window.buildSegmentCityPortraitData === 'function'
      ? window.buildSegmentCityPortraitData(agg) : [];
    const ctx = buildReportContext(node, d, trend, cityData, agg, cityRows);
    const chainHtml = hooks?.renderChainSectionHtml
      ? hooks.renderChainSectionHtml(d, node, containerId)
      : (hooks?.renderCausalSectionHtml ? hooks.renderCausalSectionHtml(d, node, containerId) : '');
    el.innerHTML = `
      <article class="rc-report rc-report-v6">
        ${renderSection1Summary(ctx)}
        ${renderSection2Location(ctx)}
        ${renderSection3Drivers(ctx)}
        ${renderSection4Chain(chainHtml)}
        ${renderSection5Segment(ctx)}
        ${renderSection6Actions(ctx)}
      </article>`;

    bindChartTooltips(el);
    bindCityChartDrill(el, ctx);
    bindRcReportActions(el, node, ctx);
    if (typeof hooks?.afterRender === 'function') hooks.afterRender();
  };
})();
