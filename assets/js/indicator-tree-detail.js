/** 横向指标树渲染、趋势图、指标详情弹窗 */
(function () {
  const expanded = new Set();

  const DRAWER_CITY_ORDER = window.JX_CITY_ORDER || ['gz', 'nc', 'sr', 'yc', 'jj', 'ja', 'fz', 'jdz', 'px', 'xy', 'yt'];
  const DRAWER_CITY_ORDER_MAP = window.JX_CITY_ORDER_MAP || Object.fromEntries(DRAWER_CITY_ORDER.map((id, i) => [id, i]));

  let drawerMetricNode = null;
  let drawerSortBy = 'city';
  let drawerSortDir = 'asc';
  let drawerCityRows = [];
  let treeAlertPage = 1;
  let treeDispatchPage = 1;
  const TREE_LIST_PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;

  function formatPeriodMonthValue(period) {
    if (!period || period.year == null) return '';
    const month = Math.max(1, Math.min(12, Number(period.month) || 1));
    return `${period.year}-${String(month).padStart(2, '0')}`;
  }

  function getDefaultTreeDispatchMonth() {
    return formatPeriodMonthValue(window.jxDrillPeriod)
      || formatPeriodMonthValue({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  }

  function getSelectedTreeDispatchMonth() {
    const input = document.getElementById('tree-dispatch-records-month');
    if (input?.value) return input.value;
    return getDefaultTreeDispatchMonth();
  }

  function recordMatchesDispatchMonth(record, monthVal) {
    if (!monthVal) return true;
    const raw = String(record.sortKey || record.createdAt || '');
    const match = raw.match(/(\d{4})[-/](\d{1,2})/);
    if (!match) return false;
    const key = `${match[1]}-${String(Number(match[2])).padStart(2, '0')}`;
    return key === monthVal;
  }

  const TREND_CONFIG = {
    day: { count: 30, label: '近30日' },
    week: { count: 12, label: '近12周' },
    month: { count: 6, label: '近6个月' },
    year: { count: 6, label: '近6年' }
  };

  let currentTrendPeriod = 'day';
  let currentMetricNode = null;
  let trendPointsData = [];
  let hoverMetricNode = null;
  let hoverHideTimer = null;
  const HOVER_HIDE_DELAY = 220;
  let treeZoom = 1;
  let treePanX = 0;
  let treePanY = 0;
  let treeCanvasDidPan = false;
  const TREE_ZOOM_MIN = 0.6;
  const TREE_ZOOM_MAX = 1.5;
  const TREE_ZOOM_STEP = 0.1;
  const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  function isHoverPopoverTarget(el) {
    if (!el) return false;
    return !!(
      el.closest?.('.metric-node-card') ||
      el.closest?.('#metric-hover-popover') ||
      el.id === 'metric-hover-popover'
    );
  }

  function cancelHideHoverPopover() {
    if (hoverHideTimer) {
      clearTimeout(hoverHideTimer);
      hoverHideTimer = null;
    }
  }

  function scheduleHideHoverPopover() {
    cancelHideHoverPopover();
    hoverHideTimer = setTimeout(() => {
      hoverHideTimer = null;
      hideMetricHoverPopover();
    }, HOVER_HIDE_DELAY);
  }

  const METRIC_ACTIONS = [
    { tab: 'rootcause', label: '根因分析', icon: 'fa-sitemap' }
  ];

  const METRIC_DISPATCH_ACTIONS = [
    { action: 'metric-dispatch', label: '指标调度', icon: 'fa-bullseye' }
  ];

  const METRIC_SEGMENT_DISPATCH_ACTION = {
    action: 'segment-dispatch',
    label: '客群调度',
    icon: 'fa-users-cog'
  };

  function isAlert(node) {
    return node.status === 'alert' || node.alert === true;
  }

  function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return Math.abs(h);
  }

  function periodRegionSeed() {
    const p = window.jxDrillPeriod || { year: 2026, month: 5 };
    const s = window.jxDrillState || {};
    return `${p.year}-${p.month}|${s.city?.id || ''}|${s.county?.id || ''}|${s.grid?.id || ''}|${s.community?.id || ''}`;
  }

  /** 按账期与地域下钻微调展示值（演示） */
  function isPercentMetricValue(v) {
    const s = String(v || '');
    return /%/.test(s) && !/pp/.test(s);
  }

  function formatMetricDelta(delta, isPct, fallbackSuffix) {
    const n = parseFloat(delta);
    if (isNaN(n)) return '—';
    const sign = n >= 0 ? '+' : '-';
    if (isPct || fallbackSuffix === 'pp') {
      return sign + Math.abs(n).toFixed(2) + 'pp';
    }
    if (fallbackSuffix === '%') return sign + Math.abs(n).toFixed(1) + '%';
    return sign + Math.abs(n).toFixed(1);
  }

  function adjustMetricDisplay(node) {
    if (!node || node.type === 'category') return { value: node?.value, yoy: node?.yoy, mom: node?.mom };
    const h = hashSeed((node.id || node.name) + periodRegionSeed());
    const depth = [window.jxDrillState?.city, window.jxDrillState?.county, window.jxDrillState?.grid, window.jxDrillState?.community]
      .filter(Boolean).length;
    const jitter = ((h % 17) - 8) / 100 - depth * 0.008;
    const v = String(node.value || '');
    const isPct = isPercentMetricValue(v);

    let value = v;
    let yoy = node.yoy || '—';
    let mom = node.mom || '—';

    if (/%|pp/.test(v)) {
      const n = parseFloat(v);
      if (!isNaN(n)) {
        const adj = Math.round((n + jitter * 12) * 10) / 10;
        value = v.includes('pp') ? adj.toFixed(1) + 'pp' : adj.toFixed(1) + '%';
      }
    } else if (/万/.test(v)) {
      const n = parseFloat(v);
      if (!isNaN(n)) {
        const adj = Math.round(n * (1 + jitter) * 100) / 100;
        value = adj.toFixed(2) + '万';
      }
    } else if (/亿/.test(v)) {
      const n = parseFloat(v);
      if (!isNaN(n)) {
        const adj = Math.round(n * (1 + jitter * 0.5) * 100) / 100;
        value = adj.toFixed(2) + '亿';
      }
    }

    const momSign = (h % 3) === 0 ? -1 : 1;
    if (yoy !== '—' && /[+-]?[\d.]/.test(String(yoy))) {
      const yn = parseFloat(yoy);
      if (!isNaN(yn)) {
        const adj = yn + (h % 5) * 0.08 * momSign;
        yoy = formatMetricDelta(adj, isPct, yoy.includes('pp') ? 'pp' : '%');
      }
    }
    if (mom !== '—' && /[+-]?[\d.]/.test(String(mom))) {
      const mn = parseFloat(mom);
      if (!isNaN(mn)) {
        const adj = mn + (h % 5) * 0.1 * momSign;
        mom = formatMetricDelta(adj, isPct, mom.includes('pp') ? 'pp' : '%');
      }
    }
    return { value, yoy, mom };
  }

  function seededSeries(seed, n, base) {
    const arr = [];
    let v = base;
    for (let i = 0; i < n; i++) {
      const r = Math.sin(seed * 12.7 + i * 0.85) * 0.08 + Math.cos(i * 0.4) * 0.05;
      v = v * (1 + r);
      arr.push(v);
    }
    return arr;
  }

  function buildLabels(period, count) {
    const labels = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      if (period === 'day') {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push({
          short: `${d.getMonth() + 1}/${d.getDate()}`,
          full: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        });
      } else if (period === 'week') {
        labels.push({ short: `第${count - i}周`, full: `近第${count - i}周` });
      } else if (period === 'month') {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        labels.push({
          short: `${d.getMonth() + 1}月`,
          full: `${d.getFullYear()}年${d.getMonth() + 1}月`
        });
      } else {
        labels.push({ short: `${now.getFullYear() - i}`, full: `${now.getFullYear() - i}年` });
      }
    }
    return labels;
  }

  function formatTrendValue(raw, node) {
    const v = node?.value || '';
    if (v.includes('亿')) return (raw / 100).toFixed(2) + '亿';
    if (v.includes('万') && !v.includes('亿')) return Math.round(raw * 100).toLocaleString();
    if (v.includes('%')) return raw.toFixed(2) + '%';
    if (v.includes('¥')) return '¥' + raw.toFixed(1);
    return raw.toFixed(1);
  }

  function getTrendAxisMeta(node, period) {
    const v = node?.value || '';
    let yTitle = '指标值';
    if (v.includes('%')) yTitle = '指标值（%）';
    else if (v.includes('亿')) yTitle = '指标值（亿元）';
    else if (v.includes('万')) yTitle = '指标值（万户/万次）';
    else if (v.includes('¥')) yTitle = '指标值（元）';

    const xTitles = {
      day: '统计日期',
      week: '统计周次',
      month: '统计月份',
      year: '统计年份'
    };
    return { yTitle, xTitle: xTitles[period] || xTitles.day };
  }

  function formatYTick(raw, node) {
    const v = node?.value || '';
    if (v.includes('亿')) return (raw / 100).toFixed(1);
    if (v.includes('万') && !v.includes('亿')) return Math.round(raw);
    if (v.includes('%')) return raw.toFixed(1);
    if (v.includes('¥')) return raw.toFixed(0);
    return raw.toFixed(0);
  }

  function calcTarget(node) {
    const v = node?.value || '';
    if (v.includes('%')) return '95.0%';
    if (v.includes('亿')) {
      const n = parseFloat(v);
      if (!isNaN(n)) return (n * 1.08).toFixed(2) + '亿';
    }
    if (v.includes('万')) return v.replace(/[\d.]+/, m => String(Math.round(+m * 1.05)));
    return '—';
  }

  function hideTrendTooltip() {
    const tip = document.getElementById('trend-tooltip');
    if (tip) tip.classList.remove('show');
  }

  function showTrendTooltip(pt, clientX, clientY) {
    const tip = document.getElementById('trend-tooltip');
    const box = document.querySelector('.trend-chart-interactive');
    if (!tip || !box) return;
    const rect = box.getBoundingClientRect();
    const momCls = pt.mom.startsWith('+') ? 'up' : pt.mom.startsWith('-') ? 'down' : '';
    const yoyCls = pt.yoy.startsWith('+') ? 'up' : pt.yoy.startsWith('-') ? 'down' : '';
    tip.innerHTML = `
      <div class="trend-tip-date">${pt.labelFull}</div>
      <div class="trend-tip-value">${pt.display}</div>
      <div class="trend-tip-row"><span>环比</span><em class="${momCls}">${pt.mom}</em></div>
      <div class="trend-tip-row"><span>同比</span><em class="${yoyCls}">${pt.yoy}</em></div>
    `;
    tip.classList.add('show');
    let left = clientX - rect.left + 14;
    let top = clientY - rect.top - 88;
    if (left > rect.width - 168) left = left - 180;
    if (top < 8) top = 8;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';

    const guide = document.getElementById('trend-hover-guide');
    if (guide) guide.setAttribute('transform', `translate(${pt.x}, 0)`);
  }

  function renderTrendChart(period, node) {
    const cfg = TREND_CONFIG[period] || TREND_CONFIG.day;
    const wrap = document.getElementById('trend-chart-wrap');
    const titleEl = document.getElementById('trend-chart-title');
    if (!wrap) return;

    hideTrendTooltip();
    const axisMeta = getTrendAxisMeta(node, period);
    const seed = (node?.id || 'm').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const gradId = 'areaGrad-' + seed;
    const base = 80 + (seed % 30);
    const series = seededSeries(seed, cfg.count, base);
    const labelObjs = buildLabels(period, cfg.count);
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const w = 800;
    const h = 260;
    const pad = { left: 62, right: 28, top: 28, bottom: 52 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const step = plotW / (cfg.count - 1);
    const plotBottom = pad.top + plotH;

    trendPointsData = series.map((v, i) => {
      const prev = i > 0 ? series[i - 1] : v;
      const momPct = ((v - prev) / prev * 100).toFixed(1);
      const mom = (momPct >= 0 ? '+' : '') + momPct + '%';
      const yoy = (Math.sin(i + seed) * 4 + 3).toFixed(1);
      const yoyStr = (yoy >= 0 ? '+' : '') + yoy + '%';
      const x = pad.left + i * step;
      const y = pad.top + plotH - ((v - min) / range) * plotH;
      return {
        x,
        y,
        display: formatTrendValue(v, node),
        labelFull: labelObjs[i].full,
        labelShort: labelObjs[i].short,
        mom,
        yoy: yoyStr,
        raw: v
      };
    });

    const yTickCount = 5;
    const yTicks = Array.from({ length: yTickCount }, (_, i) => {
      const val = min + (range * i) / (yTickCount - 1);
      const y = pad.top + plotH - ((val - min) / range) * plotH;
      return { val, y, label: formatYTick(val, node) };
    });

    const gridLines = yTicks.map(t =>
      `<line class="trend-grid-line" x1="${pad.left}" y1="${t.y.toFixed(1)}" x2="${w - pad.right}" y2="${t.y.toFixed(1)}"/>`
    ).join('');

    const yLabels = yTicks.map(t =>
      `<text class="trend-axis-tick trend-y-tick" x="${pad.left - 10}" y="${t.y + 4}" text-anchor="end">${t.label}</text>`
    ).join('');

    const showEvery = period === 'day' ? 5 : period === 'week' ? 2 : 1;
    const xLabels = trendPointsData.map((p, i) => {
      const show = period === 'month' || period === 'year' || i % showEvery === 0 || i === trendPointsData.length - 1;
      if (!show) return '';
      return `<text class="trend-axis-tick trend-x-tick" x="${p.x}" y="${plotBottom + 22}" text-anchor="middle">${p.labelShort}</text>`;
    }).join('');

    const linePoints = trendPointsData.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPoints = `${pad.left},${plotBottom} ${linePoints} ${pad.left + plotW},${plotBottom}`;

    const dots = trendPointsData.map((p, i) =>
      `<circle class="trend-chart-point-halo" cx="${p.x}" cy="${p.y}" r="10" data-idx="${i}"/>
       <circle class="trend-chart-point" cx="${p.x}" cy="${p.y}" r="5" data-idx="${i}"/>`
    ).join('');

    wrap.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" class="trend-chart-svg" id="trend-svg" role="img" aria-label="${cfg.label}指标趋势图">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.28"/>
            <stop offset="85%" stop-color="#60a5fa" stop-opacity="0.06"/>
            <stop offset="100%" stop-color="#93c5fd" stop-opacity="0"/>
          </linearGradient>
          <filter id="trendLineShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#2563eb" flood-opacity="0.25"/>
          </filter>
        </defs>
        <rect class="trend-plot-bg" x="${pad.left}" y="${pad.top}" width="${plotW}" height="${plotH}" rx="8"/>
        ${gridLines}
        <line class="trend-axis-line" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${plotBottom}"/>
        <line class="trend-axis-line" x1="${pad.left}" y1="${plotBottom}" x2="${w - pad.right}" y2="${plotBottom}"/>
        ${yLabels}
        ${xLabels}
        <text class="trend-axis-title trend-y-axis-title" x="16" y="${pad.top + plotH / 2}" transform="rotate(-90, 16, ${pad.top + plotH / 2})">${axisMeta.yTitle}</text>
        <text class="trend-axis-title trend-x-axis-title" x="${pad.left + plotW / 2}" y="${h - 10}" text-anchor="middle">${axisMeta.xTitle}</text>
        <g id="trend-hover-guide" class="trend-hover-guide" opacity="0">
          <line x1="0" y1="${pad.top}" x2="0" y2="${plotBottom}" stroke="#2563eb" stroke-width="1" stroke-dasharray="4 3" opacity="0.45"/>
        </g>
        <polygon class="trend-area" fill="url(#${gradId})" points="${areaPoints}"/>
        <polyline class="trend-line" fill="none" points="${linePoints}" filter="url(#trendLineShadow)"/>
        ${dots}
      </svg>
    `;

    if (titleEl) {
      titleEl.textContent = `${cfg.label} · ${node?.name || '指标'}走势`;
    }

    const bindPoint = (el) => {
      el.addEventListener('mouseenter', e => {
        const idx = +el.dataset.idx;
        const guide = document.getElementById('trend-hover-guide');
        if (guide) guide.setAttribute('opacity', '1');
        showTrendTooltip(trendPointsData[idx], e.clientX, e.clientY);
      });
      el.addEventListener('mousemove', e => {
        const idx = +el.dataset.idx;
        showTrendTooltip(trendPointsData[idx], e.clientX, e.clientY);
      });
      el.addEventListener('mouseleave', () => {
        hideTrendTooltip();
        const guide = document.getElementById('trend-hover-guide');
        if (guide) guide.setAttribute('opacity', '0');
      });
    };

    wrap.querySelectorAll('.trend-chart-point, .trend-chart-point-halo').forEach(bindPoint);
    wrap.addEventListener('mouseleave', () => {
      hideTrendTooltip();
      const guide = document.getElementById('trend-hover-guide');
      if (guide) guide.setAttribute('opacity', '0');
    });
  }

  function isVerboseCaliber(text) {
    const s = String(text || '');
    return s.length > 72 || s.includes('口径见') || s.includes('统计粒度') || s.includes('流量运营场景指标');
  }

  function buildSimpleCaliber(name) {
    if (!name) return '暂无口径说明';
    if (/率|占比|份额|迁出率/.test(name)) return `统计「${name}」，按月中高端/全量客户占比计算`;
    if (/收入|收支|ARPU/.test(name)) return `统计「${name}」金额，按月汇总，单位：元`;
    if (/流量|万G|GB|用量/.test(name)) return `统计「${name}」规模，按月汇总`;
    if (/客户|用户|户|笔|人数/.test(name)) return `统计「${name}」规模，按月汇总，单位：户`;
    if (/离网|流失|迁出|预警/.test(name)) return `统计「${name}」相关客户规模或风险，按月汇总`;
    return `统计「${name}」指标值，T+1 按月更新`;
  }

  function simplifyVerboseCaliber(raw) {
    const parts = String(raw).split('·').map(s => s.trim()).filter(Boolean);
    const metricPart = parts.find(p =>
      !p.includes('流量运营场景指标') &&
      !p.includes('统计粒度') &&
      !p.includes('更新周期') &&
      !p.includes('口径见')
    );
    if (!metricPart) return null;
    const label = metricPart.replace(/（[^）]*）/g, '').trim();
    if (/率|占比|份额/.test(label)) return `统计${label}，按省汇总，月更新`;
    if (/收入|收支/.test(label)) return `统计${label}金额，按省汇总，单位：元，月更新`;
    if (/流量|万G/.test(label)) return `统计${label}规模，按省汇总，月更新`;
    return `统计${label}，按省汇总，月更新`;
  }

  function resolveMetricCaliber(node) {
    if (!node || node.type === 'category') return '—';
    if (node._displayCaliber) return node._displayCaliber;
    const raw = node.caliber;
    if (raw && !isVerboseCaliber(raw)) return raw;
    if (raw && isVerboseCaliber(raw)) {
      const simplified = simplifyVerboseCaliber(raw);
      if (simplified) return simplified;
    }
    return buildSimpleCaliber(node.name);
  }

  window.resolveMetricCaliber = resolveMetricCaliber;

  function enrichTreeMetricCalibers(root) {
    function walk(n) {
      if (!n) return;
      if (n.type !== 'category') {
        n._displayCaliber = resolveMetricCaliber(n);
      }
      (n.children || []).forEach(walk);
    }
    walk(root);
  }

  function fillCommonStats(node) {
    const set = (id, text, cls) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.className = 'value' + (cls ? ' ' + cls : '');
    };
    set('common-current', node.value);
    set('common-target', calcTarget(node));
    set('common-yoy', node.yoy || '—', (node.yoy || '').startsWith('-') ? 'neg' : 'pos');
    set('common-mom', node.mom || '—', (node.mom || '').startsWith('-') ? 'neg' : 'pos');
  }

  function buildMetricMetaFields(node) {
    const now = new Date();
    const updatedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:08`;
    const isTraffic = typeof isTrafficFlowTreeNode === 'function' && isTrafficFlowTreeNode(node);
    const kpiMeta = isTraffic
      ? (node.metric || (window.TRAFFIC_FLOW_METRICS || []).find(m => m.name === node.name))
      : (typeof getHeChurnMetricMetaByName === 'function' ? getHeChurnMetricMetaByName(node.name) : null);
    const isChurn = !isTraffic && ((typeof isHeChurnTreeNode === 'function' && isHeChurnTreeNode(node))
      || (typeof isHeChurnMetricName === 'function' && isHeChurnMetricName(node.name)));
    const period = kpiMeta?.period || (node.name?.includes('率') || node.name?.includes('占比') ? '月' : '月');
    return {
      caliber: resolveMetricCaliber(node),
      code: kpiMeta?.code || '—',
      updatedAt,
      source: isChurn ? '经分系统, IOP' : '经分系统, 流量经营分析平台',
      frequency: period === '周' ? 'T+1（周）' : period === '日' ? 'T+1（日）' : 'T+1（月）',
      scene: kpiMeta?.scene || (isTraffic ? '公众市场 / 流量运营' : (isChurn && window.DEMO_SCENARIO ? window.DEMO_SCENARIO.sceneFull : '—'))
    };
  }

  window.buildMetricMetaFields = buildMetricMetaFields;

  function fillMetaInfo(node) {
    const meta = buildMetricMetaFields(node);
    const elUpdated = document.getElementById('modal-meta-updated');
    if (elUpdated) elUpdated.textContent = meta.updatedAt;
    const elCal = document.getElementById('modal-metric-caliber');
    if (elCal) {
      elCal.textContent = meta.caliber;
      elCal.title = meta.caliber || '';
    }
    const elCode = document.getElementById('modal-metric-code');
    if (elCode) elCode.textContent = meta.code;
  }

  function countDescendantMetrics(node) {
    const stats = { total: 0, alert: 0 };
    if (!node) return stats;
    (node.children || []).forEach(child => {
      if (child.type === 'category') {
        const sub = countDescendantMetrics(child);
        stats.total += sub.total;
        stats.alert += sub.alert;
      } else {
        stats.total += 1;
        if (isAlert(child)) stats.alert += 1;
        const sub = countDescendantMetrics(child);
        stats.total += sub.total;
        stats.alert += sub.alert;
      }
    });
    return stats;
  }

  function renderNode(node, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isExp = expanded.has(node.id);
    const isCategory = node.type === 'category';
    const alertCls = !isCategory && isAlert(node) ? ' alert' : '';
    const categoryCls = isCategory ? ' is-category' : '';
    const depthCls = depth === 0 ? ' is-root' : '';

    const card = document.createElement('div');
    card.className = 'metric-node-card' + alertCls + categoryCls + depthCls;
    card.dataset.id = node.id;
    if (isCategory) {
      card.innerHTML = `
      <div class="node-title-row">
        <span class="node-name" title="${node.name}"><i class="fas fa-folder-open node-folder-icon"></i>${node.name}</span>
      </div>`;
    } else {
      const disp = adjustMetricDisplay(node);
      card.innerHTML = `
      <div class="node-head">
        <span class="node-name" title="${node.name}">${node.name}</span>
        <span class="icon-caliber-wrap" title="业务口径">
          <i class="fas fa-circle-info"></i>
          <div class="tooltip-caliber">${node.caliber || '暂无口径说明'}</div>
        </span>
      </div>
      <div class="node-metrics-row">
        <span class="node-value">${disp.value || '—'}</span>
        <span class="mom ${(disp.mom || '').startsWith('-') || (disp.mom || '').startsWith('−') ? 'neg' : 'pos'}">环${disp.mom || '—'}</span>
      </div>`;

      card.addEventListener('click', e => {
        if (e.target.closest('.icon-caliber-wrap')) return;
        if (treeCanvasDidPan) return;
        if (drawerMetricNode && drawerMetricNode.id === node.id) {
          closeMetricRegionDrawer();
          return;
        }
        openMetricRegionDrawer(node);
      });
    }

    if (!isCategory) {
      card.addEventListener('mouseenter', () => {
        cancelHideHoverPopover();
        showMetricHoverPopover(node, card);
      });
      card.addEventListener('mouseleave', e => {
        if (isHoverPopoverTarget(e.relatedTarget)) return;
        scheduleHideHoverPopover();
      });
    }

    const branch = document.createElement('div');
    branch.className = 'h-tree-branch';

    const nodeRow = document.createElement('div');
    nodeRow.className = 'h-tree-node-row';
    nodeRow.appendChild(card);

    if (hasChildren) {
      const stats = countDescendantMetrics(node);
      const total = stats.total;
      const alertCount = stats.alert;
      const connWrap = document.createElement('div');
      connWrap.className = 'h-connector-wrap' + (isExp ? ' expanded' : '');
      const tip = isExp
        ? '收起子指标'
        : `包含${total}个指标，其中有${alertCount}个异动指标`;
      const sizeCls = String(alertCount).length + String(total).length >= 4 ? ' is-wide' : ' is-md';
      connWrap.innerHTML = `
        <div class="h-connector-line"></div>
        <button type="button" class="h-connector-toggle${isExp ? '' : ' has-num'}${isExp ? '' : sizeCls}"
                title="${tip}">
          ${isExp
            ? '<i class="fas fa-chevron-left"></i>'
            : `<span class="h-connector-num"><em class="h-connector-alert">${alertCount}</em><span class="h-connector-sep">/</span><span class="h-connector-total">${total}</span></span>`}
        </button>
      `;
      connWrap.querySelector('button').addEventListener('click', e => {
        e.stopPropagation();
        if (expanded.has(node.id)) expanded.delete(node.id);
        else expandThroughCategoriesUntilMetric(node);
        renderHorizontalTree(window._currentTreeRoot);
      });
      nodeRow.appendChild(connWrap);
    }

    branch.appendChild(nodeRow);

    if (hasChildren && isExp) {
      const childUl = document.createElement('ul');
      node.children.forEach(child => {
        const li = document.createElement('li');
        li.appendChild(renderNode(child, depth + 1));
        childUl.appendChild(li);
      });
      branch.appendChild(childUl);
    }

    return branch;
  }

  function showMetricHoverPopover(node, cardEl) {
    cancelHideHoverPopover();
    hoverMetricNode = node;
    const pop = document.getElementById('metric-hover-popover');
    const canvas = document.getElementById('h-tree-canvas');
    const actionsEl = document.getElementById('metric-hover-actions');
    const nameEl = document.getElementById('metric-hover-name');
    if (!pop || !canvas || !actionsEl || !cardEl) return;

    document.querySelectorAll('.metric-node-card').forEach(c => c.classList.remove('hover-active'));
    cardEl.classList.add('hover-active');
    if (nameEl) nameEl.textContent = node.name;

    actionsEl.innerHTML =
      METRIC_DISPATCH_ACTIONS.map(a => `
      <button type="button" class="metric-hover-action metric-hover-dispatch" data-action="${a.action}">
        <i class="fas ${a.icon}"></i>
        <span>${a.label}</span>
      </button>
    `).join('') +
      (isAlert(node) ? `
      <button type="button" class="metric-hover-action metric-hover-seg-dispatch" data-action="${METRIC_SEGMENT_DISPATCH_ACTION.action}">
        <i class="fas ${METRIC_SEGMENT_DISPATCH_ACTION.icon}"></i>
        <span>${METRIC_SEGMENT_DISPATCH_ACTION.label}</span>
      </button>` : '') +
      '<div class="metric-hover-divider"></div>' +
      METRIC_ACTIONS.map(a => `
      <button type="button" class="metric-hover-action" data-tab="${a.tab}">
        <i class="fas ${a.icon}"></i>
        <span>${a.label}</span>
      </button>
    `).join('');
    actionsEl.querySelectorAll('.metric-hover-action[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        hideMetricHoverPopover();
        if (action === 'metric-dispatch' && typeof openMetricDispatchWizard === 'function') {
          openMetricDispatchWizard(node);
        } else if (action === 'segment-dispatch') {
          const agg = buildAlertSegmentAgg(node);
          if (typeof resolveTreeDetailId === 'function') agg.treeId = resolveTreeDetailId();
          if (typeof window.navigateToSegmentDispatch === 'function') {
            window.navigateToSegmentDispatch(agg);
          } else {
            window.alert('客群调度模块未加载');
          }
        }
      });
    });
    actionsEl.querySelectorAll('.metric-hover-action[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => openMetricDetail(node, btn.dataset.tab));
    });

    pop.classList.remove('is-hidden');
    const rect = cardEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    let left = rect.right - canvasRect.left + 10;
    let top = rect.top - canvasRect.top;
    const maxLeft = canvas.clientWidth - 180;
    if (left > maxLeft) left = Math.max(8, rect.left - canvasRect.left - 178);
    if (top < 8) top = 8;
    if (top > canvas.clientHeight - 120) top = Math.max(8, canvas.clientHeight - 120);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function hideMetricHoverPopover() {
    cancelHideHoverPopover();
    hoverMetricNode = null;
    document.getElementById('metric-hover-popover')?.classList.add('is-hidden');
    document.querySelectorAll('.metric-node-card').forEach(c => c.classList.remove('hover-active'));
  }

  function bindHoverPopover() {
    const pop = document.getElementById('metric-hover-popover');
    const canvas = document.getElementById('h-tree-canvas');
    if (!pop || !canvas || canvas._hoverPopBound) return;
    canvas._hoverPopBound = true;
    pop.addEventListener('mouseenter', cancelHideHoverPopover);
    pop.addEventListener('mouseleave', e => {
      if (isHoverPopoverTarget(e.relatedTarget)) return;
      scheduleHideHoverPopover();
    });
  }

  window.layoutHorizontalTreeLinks = function () {
    const host = document.getElementById('h-tree-canvas');
    const space = document.getElementById('h-tree-zoom-space');
    const svg = document.getElementById('h-tree-links-svg');
    const root = window._currentTreeRoot;
    if (!host || !space || !svg || !root) return;

    const spaceRect = space.getBoundingClientRect();
    const w = Math.max(space.offsetWidth || 0, host.clientWidth);
    const h = Math.max(space.offsetHeight || 0, host.clientHeight);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';

    const segments = [];

    function anchorOf(el, side) {
      const r = el.getBoundingClientRect();
      return {
        x: (side === 'right' ? r.right : r.left) - spaceRect.left,
        y: r.top - spaceRect.top + r.height / 2
      };
    }

    function linkParentChildren(parentId) {
      const parentEl = space.querySelector(`.metric-node-card[data-id="${parentId}"]`);
      const node = findTreeNode(root, parentId);
      if (!parentEl || !node || !(node.children || []).length || !expanded.has(parentId)) return;

      const childEls = node.children
        .map(c => space.querySelector(`.metric-node-card[data-id="${c.id}"]`))
        .filter(Boolean);
      if (!childEls.length) return;

      const p = anchorOf(parentEl, 'right');
      const childPoints = childEls.map(el => anchorOf(el, 'left'));
      const minChildX = Math.min(...childPoints.map(c => c.x));
      const gap = minChildX - p.x;
      if (gap < 8) return;

      const busX = p.x + Math.max(12, Math.min(gap * 0.5, gap - 6));

      if (childPoints.length === 1) {
        const c = childPoints[0];
        segments.push(`M ${p.x} ${p.y} L ${busX} ${p.y} L ${busX} ${c.y} L ${c.x} ${c.y}`);
        return;
      }

      const ys = childPoints.map(c => c.y);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      segments.push(`M ${p.x} ${p.y} L ${busX} ${p.y}`);
      segments.push(`M ${busX} ${minY} L ${busX} ${maxY}`);
      childPoints.forEach(c => segments.push(`M ${busX} ${c.y} L ${c.x} ${c.y}`));
    }

    function walk(n) {
      if (n.children?.length && expanded.has(n.id)) {
        linkParentChildren(n.id);
        n.children.forEach(walk);
      }
    }
    walk(root);

    svg.innerHTML = segments.length
      ? segments.map(d => `<path class="h-tree-link-path" d="${d}"/>`).join('')
      : '';
  };

  function syncTreeCanvasViewportHeight() {
    const stage = document.getElementById('h-tree-stage') || document.querySelector('.tree-detail-stage');
    const canvas = document.getElementById('h-tree-canvas');
    if (!stage || !canvas) return;
    if (stage.classList.contains('is-tree-fullscreen') || document.fullscreenElement === stage) {
      canvas.style.height = '';
      stage.style.removeProperty('--tree-canvas-h');
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const contentArea = canvas.closest('.content-area');
    const styles = contentArea ? getComputedStyle(contentArea) : null;
    const bottomPad = styles ? (parseFloat(styles.paddingBottom) || 12) : 12;
    // 贴近视口底部，仅保留内容区内边距 + 少量安全间距
    const gap = 8;
    const available = Math.floor(window.innerHeight - rect.top - bottomPad - gap);
    const minH = window.innerHeight < 720 ? 360 : 420;
    const maxH = Math.max(window.innerHeight - 120, minH);
    const next = Math.max(minH, Math.min(available, maxH));
    stage.style.setProperty('--tree-canvas-h', next + 'px');
    canvas.style.height = next + 'px';
  }

  window.syncTreeCanvasViewportHeight = syncTreeCanvasViewportHeight;

  function syncTreeZoomSpace() {
    const panLayer = document.getElementById('h-tree-pan-layer');
    const inner = document.getElementById('h-tree-zoom-inner');
    const space = document.getElementById('h-tree-zoom-space');
    const label = document.getElementById('h-tree-zoom-label');
    if (!inner || !space) return;
    if (panLayer) panLayer.style.transform = `translate(${treePanX}px, ${treePanY}px)`;
    inner.style.transform = `scale(${treeZoom})`;
    const w = Math.ceil(Math.max(inner.offsetWidth, 1) * treeZoom);
    const h = Math.ceil(Math.max(inner.offsetHeight, 1) * treeZoom);
    space.style.width = w + 'px';
    space.style.height = h + 'px';
    if (label) label.textContent = Math.round(treeZoom * 100) + '%';
  }

  function applyTreeZoom(nextZoom) {
    const canvas = document.getElementById('h-tree-canvas');
    const prev = treeZoom || 1;
    treeZoom = Math.max(TREE_ZOOM_MIN, Math.min(TREE_ZOOM_MAX, Math.round(nextZoom * 100) / 100));
    if (canvas && prev > 0 && canvas.clientWidth) {
      const cx = canvas.clientWidth / 2 - treePanX;
      const cy = canvas.clientHeight / 2 - treePanY;
      const ratio = treeZoom / prev;
      treePanX = canvas.clientWidth / 2 - cx * ratio;
      treePanY = canvas.clientHeight / 2 - cy * ratio;
    }
    syncTreeZoomSpace();
    requestAnimationFrame(() => requestAnimationFrame(() => layoutHorizontalTreeLinks()));
  }

  function resetTreeCanvasView() {
    treeZoom = 1;
    treePanX = 24;
    treePanY = 56;
    syncTreeZoomSpace();
    requestAnimationFrame(() => requestAnimationFrame(() => layoutHorizontalTreeLinks()));
  }

  function getTreeMaxDepth(node) {
    if (!node) return 0;
    let max = 0;
    (function walk(n, depth) {
      if (depth > max) max = depth;
      (n.children || []).forEach(c => walk(c, depth + 1));
    })(node, 0);
    return max;
  }

  function depthLabel(n) {
    if (n <= 10) return CN_NUM[n] || String(n);
    return String(n);
  }

  function refreshQuickExpandMenu(root) {
    const wrap = document.getElementById('h-tree-quick-expand');
    const menu = document.getElementById('h-tree-quick-expand-menu');
    if (!wrap || !menu) return;
    const maxDepth = getTreeMaxDepth(root);
    if (maxDepth < 1) {
      wrap.classList.add('is-empty');
      menu.innerHTML = '';
      return;
    }
    wrap.classList.remove('is-empty');
    const items = [];
    for (let d = 1; d <= maxDepth; d++) {
      items.push(`<button type="button" class="h-tree-quick-expand-item" role="menuitem" data-expand-depth="${d}">展开${depthLabel(d)}级</button>`);
    }
    menu.innerHTML = `<div class="h-tree-quick-expand-menu-panel">${items.join('')}</div>`;
    menu.querySelectorAll('[data-expand-depth]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const depth = Number(btn.getAttribute('data-expand-depth'));
        if (window._currentTreeRoot && depth > 0) expandTreeToDepth(window._currentTreeRoot, depth);
        wrap.classList.remove('is-open');
        document.getElementById('btn-tree-quick-expand')?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function bindQuickExpandMenu() {
    const wrap = document.getElementById('h-tree-quick-expand');
    const btn = document.getElementById('btn-tree-quick-expand');
    if (!wrap || !btn || wrap._quickBound) return;
    wrap._quickBound = true;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeMetricSearch();
      const open = wrap.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const SEARCH_PAGE_SIZE = 20;
  let searchMatches = [];
  let searchRenderedCount = 0;
  let searchQuery = '';
  let searchInputTimer = null;
  let pendingSearchFocusId = null;

  function closeMetricSearch() {
    const wrap = document.getElementById('h-tree-metric-search');
    const btn = document.getElementById('btn-tree-metric-search');
    if (!wrap) return;
    wrap.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
  }

  function openMetricSearch() {
    const wrap = document.getElementById('h-tree-metric-search');
    const btn = document.getElementById('btn-tree-metric-search');
    const input = document.getElementById('h-tree-metric-search-input');
    const quick = document.getElementById('h-tree-quick-expand');
    if (!wrap) return;
    quick?.classList.remove('is-open');
    document.getElementById('btn-tree-quick-expand')?.setAttribute('aria-expanded', 'false');
    wrap.classList.add('is-open');
    btn?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      input?.focus();
      input?.select();
    });
  }

  function collectSearchableNodes(root) {
    const list = [];
    function walk(n, pathNames) {
      if (!n) return;
      list.push({
        id: n.id,
        name: n.name || '',
        type: n.type === 'category' ? 'category' : 'metric',
        alert: n.type !== 'category' && isAlert(n),
        path: pathNames.join(' / ')
      });
      const next = pathNames.concat(n.name || '');
      (n.children || []).forEach(c => walk(c, next));
    }
    walk(root, []);
    return list;
  }

  function fuzzyMatchText(text, query) {
    const n = String(text || '').toLowerCase();
    const q = String(query || '').trim().toLowerCase();
    if (!q) return false;
    if (n.includes(q)) return true;
    let i = 0;
    for (let k = 0; k < n.length; k++) {
      if (n[k] === q[i]) i++;
      if (i >= q.length) return true;
    }
    return false;
  }

  function scoreSearchMatch(name, query) {
    const n = String(name || '').toLowerCase();
    const q = String(query || '').trim().toLowerCase();
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.includes(q)) return 2;
    return 3;
  }

  function runMetricSearch(query) {
    searchQuery = String(query || '').trim();
    searchMatches = [];
    searchRenderedCount = 0;
    const root = window._currentTreeRoot;
    if (!searchQuery || !root) {
      renderSearchResultList(true);
      return;
    }
    searchMatches = collectSearchableNodes(root)
      .filter(item => fuzzyMatchText(item.name, searchQuery) || fuzzyMatchText(item.path, searchQuery))
      .sort((a, b) => {
        const sa = scoreSearchMatch(a.name, searchQuery);
        const sb = scoreSearchMatch(b.name, searchQuery);
        if (sa !== sb) return sa - sb;
        return String(a.name).localeCompare(String(b.name), 'zh');
      });
    renderSearchResultList(true);
  }

  function appendSearchResultItems(items) {
    const list = document.getElementById('h-tree-metric-search-list');
    if (!list) return;
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'h-tree-metric-search-item' + (item.alert ? ' is-alert' : '');
      btn.setAttribute('role', 'option');
      btn.dataset.nodeId = item.id;
      const typeIco = item.type === 'category'
        ? '<i class="fas fa-folder h-tree-metric-search-type-ico is-category" title="分类节点"></i>'
        : '<i class="fas fa-chart-line h-tree-metric-search-type-ico is-metric" title="指标节点"></i>';
      const alertIco = item.alert
        ? '<i class="fas fa-exclamation-triangle h-tree-metric-search-alert-ico" title="异动指标"></i>'
        : '';
      btn.innerHTML = `
        <span class="h-tree-metric-search-icons">${typeIco}${alertIco}</span>
        <span class="h-tree-metric-search-body">
          <span class="h-tree-metric-search-name">${escHtml(item.name)}</span>
          ${item.path ? `<span class="h-tree-metric-search-path" title="${escHtml(item.path)}">${escHtml(item.path)}</span>` : ''}
        </span>`;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        jumpToTreeSearchNode(item.id);
      });
      list.appendChild(btn);
    });
  }

  function renderSearchResultList(reset) {
    const list = document.getElementById('h-tree-metric-search-list');
    const meta = document.getElementById('h-tree-metric-search-meta');
    if (!list) return;
    if (reset) {
      list.innerHTML = '';
      searchRenderedCount = 0;
    }
    if (!searchQuery) {
      if (meta) meta.textContent = '';
      list.innerHTML = '<div class="h-tree-metric-search-hint">输入关键词，模糊匹配指标或分类</div>';
      return;
    }
    if (!searchMatches.length) {
      if (meta) meta.textContent = '未找到匹配结果';
      list.innerHTML = '<div class="h-tree-metric-search-empty">无匹配的指标或分类</div>';
      return;
    }
    if (meta) meta.textContent = `共 ${searchMatches.length} 条结果`;
    const next = searchMatches.slice(searchRenderedCount, searchRenderedCount + SEARCH_PAGE_SIZE);
    appendSearchResultItems(next);
    searchRenderedCount += next.length;
    list.querySelector('.h-tree-metric-search-loading')?.remove();
    if (searchRenderedCount < searchMatches.length) {
      const tip = document.createElement('div');
      tip.className = 'h-tree-metric-search-loading';
      tip.textContent = '向下滚动加载更多…';
      list.appendChild(tip);
    }
  }

  function loadMoreSearchResults() {
    if (searchRenderedCount >= searchMatches.length) return;
    const list = document.getElementById('h-tree-metric-search-list');
    list?.querySelector('.h-tree-metric-search-loading')?.remove();
    const next = searchMatches.slice(searchRenderedCount, searchRenderedCount + SEARCH_PAGE_SIZE);
    appendSearchResultItems(next);
    searchRenderedCount += next.length;
    if (searchRenderedCount < searchMatches.length) {
      const tip = document.createElement('div');
      tip.className = 'h-tree-metric-search-loading';
      tip.textContent = '向下滚动加载更多…';
      list?.appendChild(tip);
    }
  }

  function focusTreeNodeCard(nodeId) {
    const canvas = document.getElementById('h-tree-canvas');
    const card = Array.from(document.querySelectorAll('.metric-node-card'))
      .find(el => el.dataset.id === String(nodeId));
    if (!canvas || !card) {
      pendingSearchFocusId = null;
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2 - canvasRect.left;
    const cardCenterY = cardRect.top + cardRect.height / 2 - canvasRect.top;
    treePanX += canvas.clientWidth / 2 - cardCenterX;
    treePanY += canvas.clientHeight / 2 - cardCenterY;
    syncTreeZoomSpace();
    layoutHorizontalTreeLinks();
    document.querySelectorAll('.metric-node-card.is-search-flash').forEach(el => {
      el.classList.remove('is-search-flash');
    });
    card.classList.add('is-search-flash');
    window.clearTimeout(focusTreeNodeCard._flashTimer);
    focusTreeNodeCard._flashTimer = window.setTimeout(() => {
      card.classList.remove('is-search-flash');
    }, 1800);
    pendingSearchFocusId = null;
  }

  function jumpToTreeSearchNode(nodeId) {
    const root = window._currentTreeRoot;
    if (!root || !nodeId) return;
    const path = findPathToNode(root, nodeId);
    if (!path?.length) return;
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i].children?.length) expanded.add(path[i].id);
    }
    pendingSearchFocusId = nodeId;
    closeMetricSearch();
    renderHorizontalTree(root);
  }

  function bindMetricSearch() {
    const wrap = document.getElementById('h-tree-metric-search');
    const btn = document.getElementById('btn-tree-metric-search');
    const input = document.getElementById('h-tree-metric-search-input');
    const list = document.getElementById('h-tree-metric-search-list');
    if (!wrap || !btn || wrap._searchBound) return;
    wrap._searchBound = true;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) closeMetricSearch();
      else openMetricSearch();
    });

    input?.addEventListener('input', () => {
      window.clearTimeout(searchInputTimer);
      searchInputTimer = window.setTimeout(() => {
        runMetricSearch(input.value);
      }, 160);
    });

    input?.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeMetricSearch();
        btn.focus();
      }
    });

    list?.addEventListener('scroll', () => {
      if (!list) return;
      if (list.scrollTop + list.clientHeight >= list.scrollHeight - 36) {
        loadMoreSearchResults();
      }
    });

    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) closeMetricSearch();
    });

    if (!searchQuery) renderSearchResultList(true);
  }

  function toggleTreeFullscreen() {
    const stage = document.getElementById('h-tree-stage') || document.querySelector('.tree-detail-stage');
    if (!stage) return;
    const btn = document.getElementById('btn-tree-fullscreen');
    const exitFs = () => {
      stage.classList.remove('is-tree-fullscreen');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
        btn.title = '全屏';
      }
      requestAnimationFrame(() => {
        syncTreeCanvasViewportHeight();
        syncTreeZoomSpace();
        layoutHorizontalTreeLinks();
      });
    };
    const enterFs = () => {
      stage.classList.add('is-tree-fullscreen');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
        btn.title = '退出全屏';
      }
      requestAnimationFrame(() => {
        syncTreeCanvasViewportHeight();
        syncTreeZoomSpace();
        layoutHorizontalTreeLinks();
      });
    };

    if (document.fullscreenElement === stage) {
      document.exitFullscreen?.().finally(exitFs);
      return;
    }
    if (stage.classList.contains('is-tree-fullscreen') && !document.fullscreenElement) {
      exitFs();
      return;
    }

    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (req) {
      Promise.resolve(req.call(stage)).then(enterFs).catch(enterFs);
    } else {
      enterFs();
    }
  }

  function isTreeCanvasPanIgnoreTarget(el) {
    if (!el || !el.closest) return true;
    return !!el.closest(
      '.metric-node-card, .h-connector-toggle, .h-connector-count, .h-tree-canvas-toolbar, .metric-hover-popover, button, a, input, select, textarea'
    );
  }

  window.bindTreeCanvasViewControls = function () {
    const canvas = document.getElementById('h-tree-canvas');
    if (!canvas || canvas._treeViewBound) return;
    canvas._treeViewBound = true;

    let panning = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;
    let moved = false;
    let rafId = 0;

    function applyPanFrame() {
      rafId = 0;
      syncTreeZoomSpace();
    }

    function onPointerMove(e) {
      if (!panning || (pointerId != null && e.pointerId !== pointerId)) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        moved = true;
        hideMetricHoverPopover();
      }
      treePanX = startPanX + dx;
      treePanY = startPanY + dy;
      if (!rafId) rafId = requestAnimationFrame(applyPanFrame);
      e.preventDefault();
    }

    function onPointerUp(e) {
      if (!panning || (pointerId != null && e.pointerId !== pointerId)) return;
      panning = false;
      pointerId = null;
      canvas.classList.remove('is-panning');
      if (moved) {
        treeCanvasDidPan = true;
        setTimeout(() => { treeCanvasDidPan = false; }, 0);
      }
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      try { canvas.releasePointerCapture?.(e.pointerId); } catch (_) { /* ignore */ }
    }

    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (isTreeCanvasPanIgnoreTarget(e.target)) return;
      panning = true;
      moved = false;
      treeCanvasDidPan = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startPanX = treePanX;
      startPanY = treePanY;
      canvas.classList.add('is-panning');
      try { canvas.setPointerCapture?.(e.pointerId); } catch (_) { /* ignore */ }
      document.addEventListener('pointermove', onPointerMove, { passive: false });
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
      e.preventDefault();
    });

    document.getElementById('btn-tree-zoom-in')?.addEventListener('click', () => {
      applyTreeZoom(treeZoom + TREE_ZOOM_STEP);
    });
    document.getElementById('btn-tree-zoom-out')?.addEventListener('click', () => {
      applyTreeZoom(treeZoom - TREE_ZOOM_STEP);
    });
    document.getElementById('btn-tree-fullscreen')?.addEventListener('click', () => {
      toggleTreeFullscreen();
    });
    document.getElementById('btn-tree-view-reset')?.addEventListener('click', () => {
      resetTreeCanvasView();
    });

    document.addEventListener('fullscreenchange', () => {
      const stage = document.getElementById('h-tree-stage') || document.querySelector('.tree-detail-stage');
      const btn = document.getElementById('btn-tree-fullscreen');
      if (!document.fullscreenElement) {
        stage?.classList.remove('is-tree-fullscreen');
        if (btn) {
          btn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
          btn.title = '全屏';
        }
      }
      requestAnimationFrame(() => {
        syncTreeZoomSpace();
        layoutHorizontalTreeLinks();
      });
    });

    bindQuickExpandMenu();
    bindMetricSearch();
    treePanX = 24;
    treePanY = 56;
    syncTreeZoomSpace();
  };

  function findTreeNode(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    for (const c of node.children || []) {
      const found = findTreeNode(c, id);
      if (found) return found;
    }
    return null;
  }

  window.renderHorizontalTree = function (root) {
    window._currentTreeRoot = root;
    const container = document.getElementById('h-tree-container');
    if (!container || !root) return;
    enrichTreeMetricCalibers(root);
    if (!expanded.has(root.id)) expanded.add(root.id);
    const tree = document.createElement('div');
    tree.className = 'h-tree';
    tree.appendChild(renderNode(root, 0));
    container.innerHTML = '';
    container.appendChild(tree);
    bindHoverPopover();
    updateTreeAlertBadge();
    refreshQuickExpandMenu(root);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      syncTreeCanvasViewportHeight();
      syncTreeZoomSpace();
      layoutHorizontalTreeLinks();
      if (pendingSearchFocusId) focusTreeNodeCard(pendingSearchFocusId);
    }));
  };

  function sortDrawerRows(rows, sortBy, sortDir) {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortBy === 'city') {
        const ai = DRAWER_CITY_ORDER_MAP[a.cityId] ?? 99;
        const bi = DRAWER_CITY_ORDER_MAP[b.cityId] ?? 99;
        return (ai - bi) * dir;
      }
      let av;
      let bv;
      if (sortBy === 'metricValue') {
        av = a.metricValNum;
        bv = b.metricValNum;
      } else if (sortBy === 'yoy') {
        av = a.yoyVal;
        bv = b.yoyVal;
      } else {
        av = a.momVal;
        bv = b.momVal;
      }
      if (av === bv) {
        const ai = DRAWER_CITY_ORDER_MAP[a.cityId] ?? 99;
        const bi = DRAWER_CITY_ORDER_MAP[b.cityId] ?? 99;
        return ai - bi;
      }
      return (av - bv) * dir;
    });
  }

  function drawerSortIcon(col) {
    if (drawerSortBy !== col) return '<i class="fas fa-sort sort-muted"></i>';
    return drawerSortDir === 'asc'
      ? '<i class="fas fa-sort-up sort-active"></i>'
      : '<i class="fas fa-sort-down sort-active"></i>';
  }

  function drawerSortLabel(col) {
    if (col === 'city') return '地市';
    if (col === 'metricValue') return '指标值';
    if (col === 'yoy') return '同比';
    return '环比';
  }

  function renderDrawerMetricChart(rows) {
    const max = Math.max(...rows.map(r => Math.abs(r.metricValNum || 0)), 0.01);
    return `<div class="metric-drawer-hbars">${rows.map(r => {
      const w = Math.round((Math.abs(r.metricValNum || 0) / max) * 100);
      return `<div class="metric-drawer-hbar-row">
        <span class="metric-drawer-hbar-label">
          <strong>${escHtml(r.cityName)}</strong>
        </span>
        <div class="metric-drawer-hbar-track">
          <div class="metric-drawer-hbar-fill" style="width:${w}%;background:#3b82f6"></div>
        </div>
        <span class="metric-drawer-hbar-val"><strong>${escHtml(r.metricValue)}</strong></span>
        <span class="metric-drawer-hbar-meta">
          <span class="${momTrendClass(r.yoy)}">同${escHtml(r.yoy || '—')}</span>
          <span class="${momTrendClass(r.mom)}">环${escHtml(r.mom || '—')}</span>
        </span>
      </div>`;
    }).join('')}</div>`;
  }

  function renderMetricRegionDrawer() {
    const body = document.getElementById('metric-region-drawer-body');
    if (!body || !drawerMetricNode) return;
    const rows = sortDrawerRows(drawerCityRows, drawerSortBy, drawerSortDir);
    const sortCols = ['city', 'metricValue', 'yoy', 'mom'];
    body.innerHTML = `
      <div class="metric-drawer-chart-wrap">
        <div class="metric-drawer-chart-toolbar">
          <span class="muted">各地市指标对比</span>
          <div class="metric-drawer-sort-btns">
            ${sortCols.map(col => `
              <button type="button" class="metric-drawer-sort-btn${drawerSortBy === col ? ' is-active' : ''}"
                      data-drawer-sort="${col}">
                ${drawerSortLabel(col)} ${drawerSortIcon(col)}
              </button>`).join('')}
          </div>
        </div>
        ${renderDrawerMetricChart(rows)}
      </div>`;

    body.querySelectorAll('[data-drawer-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.dataset.drawerSort;
        if (!col) return;
        if (drawerSortBy === col) drawerSortDir = drawerSortDir === 'asc' ? 'desc' : 'asc';
        else {
          drawerSortBy = col;
          drawerSortDir = col === 'city' ? 'asc' : 'desc';
        }
        renderMetricRegionDrawer();
      });
    });
  }

  function openMetricRegionDrawer(node) {
    if (!node || node.type === 'category') return;
    drawerMetricNode = node;
    drawerSortBy = 'city';
    drawerSortDir = 'asc';
    const drillCtx = { city: window.jxDrillState?.city || null };
    const allRows = typeof window.buildMetricRegionRows === 'function'
      ? window.buildMetricRegionRows(node, drillCtx)
      : [];
    drawerCityRows = DRAWER_CITY_ORDER
      .map(id => allRows.find(r => r.cityId === id))
      .filter(Boolean);
    if (!drawerCityRows.length) drawerCityRows = allRows;

    document.getElementById('metric-region-drawer-title').textContent = node.name || '—';
    const disp = adjustMetricDisplay(node);
    const sub = document.getElementById('metric-region-drawer-sub');
    if (sub) sub.textContent = `全省 ${disp.value || '—'} · 环${disp.mom || '—'}`;

    renderMetricRegionDrawer();
    document.getElementById('metric-region-drawer')?.removeAttribute('hidden');
    document.body.classList.add('metric-region-drawer-open');
    document.querySelectorAll('.metric-node-card').forEach(c => c.classList.remove('drawer-active'));
    const activeCard = document.querySelector(`.metric-node-card[data-id="${node.id}"]`);
    if (activeCard) activeCard.classList.add('drawer-active');
  }

  function closeMetricRegionDrawer() {
    drawerMetricNode = null;
    document.getElementById('metric-region-drawer')?.setAttribute('hidden', '');
    document.body.classList.remove('metric-region-drawer-open');
    document.querySelectorAll('.metric-node-card.drawer-active').forEach(c => c.classList.remove('drawer-active'));
  }

  function bindMetricRegionDrawer() {
    document.getElementById('btn-close-region-drawer')?.addEventListener('click', closeMetricRegionDrawer);
    document.getElementById('btn-drawer-root-cause')?.addEventListener('click', () => {
      const node = drawerMetricNode;
      if (!node) return;
      closeMetricRegionDrawer();
      if (typeof openMetricDetail === 'function') openMetricDetail(node, 'rootcause');
    });
    document.getElementById('btn-drawer-metric-dispatch')?.addEventListener('click', () => {
      const node = drawerMetricNode;
      if (!node) return;
      closeMetricRegionDrawer();
      if (typeof openMetricDispatchWizard === 'function') openMetricDispatchWizard(node);
    });
  }

  window.openMetricRegionDrawer = openMetricRegionDrawer;
  window.closeMetricRegionDrawer = closeMetricRegionDrawer;
  window.refreshMetricRegionDrawerIfOpen = function () {
    if (drawerMetricNode) openMetricRegionDrawer(drawerMetricNode);
  };

  window.updateTreeAlertBadge = function () {
    const badge = document.getElementById('tree-alert-count-badge');
    if (!badge) return;
    const count = collectTreeAlertMetrics(window._currentTreeRoot).length;
    badge.textContent = String(count);
    badge.hidden = count <= 0;
  };

  window.expandAllTree = function (root) {
    function walk(n) {
      if (n.children?.length) {
        expanded.add(n.id);
        n.children.forEach(walk);
      }
    }
    walk(root);
    renderHorizontalTree(root);
  };

  /**
   * 展开节点；若子级全是分类则继续向下展开，直到某一层出现指标节点为止。
   */
  function expandThroughCategoriesUntilMetric(node) {
    if (!node?.children?.length) return;
    expanded.add(node.id);
    const kids = node.children;
    if (kids.some(c => c.type !== 'category')) return;
    kids.forEach(c => expandThroughCategoriesUntilMetric(c));
  }

  window.expandTreeToDepth = function (root, maxDepth) {
    function walk(n, depth) {
      if (!n?.children?.length) return;
      if (depth < maxDepth) {
        expanded.add(n.id);
        n.children.forEach(c => walk(c, depth + 1));
        return;
      }
      // 到达目标层级后：分类分支继续连展，直到该层出现指标
      if (n.type === 'category') expandThroughCategoriesUntilMetric(n);
    }
    expanded.clear();
    if (root) walk(root, 0);
    renderHorizontalTree(root);
  };

  function findFirstMetricNode(node) {
    if (!node) return null;
    if (node.type !== 'category') return node;
    for (const c of node.children || []) {
      const f = findFirstMetricNode(c);
      if (f) return f;
    }
    return null;
  }

  function findPathToNode(root, targetId, path) {
    if (!root) return null;
    const p = path ? [...path, root] : [root];
    if (root.id === targetId) return p;
    for (const c of root.children || []) {
      const found = findPathToNode(c, targetId, p);
      if (found) return found;
    }
    return null;
  }

  window.expandTreeToFirstMetrics = function (root) {
    expanded.clear();
    if (!root?.children?.length) {
      renderHorizontalTree(root);
      return;
    }
    expanded.add(root.id);
    root.children.forEach(branch => {
      if (branch.type === 'category') expandThroughCategoriesUntilMetric(branch);
      else if (branch.children?.length) expanded.add(branch.id);
    });
    renderHorizontalTree(root);
  };

  window.collapseAllTree = function (root) {
    expanded.clear();
    expanded.add(root.id);
    renderHorizontalTree(root);
  };

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function momTrendClass(v) {
    const s = String(v || '');
    return /^[-−]/.test(s) ? 'metric-val-neg' : 'metric-val-pos';
  }

  /** 收集指标树内全部异动指标（叶子/指标节点） */
  window.collectTreeAlertMetrics = function (root) {
    const list = [];
    function walk(n) {
      if (!n) return;
      if (n.type !== 'category' && isAlert(n)) {
        const adj = adjustMetricDisplay(n);
        list.push({
          id: n.id,
          name: n.name,
          value: adj.value,
          yoy: adj.yoy,
          mom: adj.mom,
          node: n
        });
      }
      (n.children || []).forEach(walk);
    }
    walk(root || window._currentTreeRoot);
    return list;
  };

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function estimateAlertSegmentScale(node) {
    if (typeof window.buildRootCauseData === 'function' && typeof window.buildRcAggregatedSegment === 'function') {
      const rc = window.buildRootCauseData(node);
      if (rc?.isAlert) {
        const agg = window.buildRcAggregatedSegment(node, rc);
        if (agg?.scaleLabel) return agg.scaleLabel;
      }
    }
    const n = 3200 + (hashStr(node?.id || node?.name || '') % 15000);
    return n.toLocaleString('zh-CN') + ' 人';
  }

  function buildAlertSegmentAgg(node, item) {
    if (typeof window.buildRootCauseData === 'function' && typeof window.buildRcAggregatedSegment === 'function') {
      const rc = window.buildRootCauseData(node);
      if (rc?.isAlert) {
        const agg = window.buildRcAggregatedSegment(node, rc);
        agg.nodeId = node.id;
        applySegmentDrillContext(agg);
        return agg;
      }
    }
    const adj = item || adjustMetricDisplay(node);
    const scaleLabel = estimateAlertSegmentScale(node);
    const baseName = (node?.name || '异动指标').replace(/指标$/, '').trim();
    const agg = {
      name: `${baseName}异动客群`,
      scaleLabel,
      sourceMetric: node?.name || '',
      nodeId: node?.id || '',
      metricValue: adj?.value || node?.value || '—',
      metricMom: adj?.mom || node?.mom || '—',
      treeId: typeof resolveTreeDetailId === 'function' ? resolveTreeDetailId() : '',
      treeName: document.getElementById('breadcrumb-name')?.textContent || '指标树',
      drillLevel: 'province'
    };
    applySegmentDrillContext(agg);
    return agg;
  }

  function applySegmentDrillContext(agg) {
    const city = window.jxDrillState?.city;
    if (!city || window.jxDrillState?.county) return agg;
    agg.drillLevel = 'city';
    agg.cityId = city.id;
    agg.cityName = city.name;
    agg.drillPath = `江西省 › ${city.name}`;
    if (!agg.treeName) {
      agg.treeName = document.getElementById('breadcrumb-name')?.textContent || '指标树';
    }
    return agg;
  }

  function runRegionAnalysisForNode(node) {
    if (!node || !window.RegionAnalysis) return;
    const card = document.querySelector(`.metric-node-card[data-id="${node.id}"]`);
    const added = RegionAnalysis.addMetric(node, card);
    if (added) {
      const tip = document.createElement('div');
      tip.className = 'region-cart-toast';
      tip.textContent = '已加入地域分析';
      document.body.appendChild(tip);
      requestAnimationFrame(() => tip.classList.add('show'));
      setTimeout(() => {
        tip.classList.remove('show');
        setTimeout(() => tip.remove(), 300);
      }, 1200);
    }
  }

  function renderTreeAlertListTable() {
    const tbody = document.getElementById('tree-alert-list-tbody');
    if (!tbody) return;
    const alerts = collectTreeAlertMetrics(window._currentTreeRoot).map(a => ({
      ...a,
      scaleLabel: estimateAlertSegmentScale(a.node)
    }));
    const titleEl = document.getElementById('tree-alert-list-title');
    const summaryEl = document.getElementById('tree-alert-summary');
    const footHint = document.getElementById('tree-alert-foot-hint');
    const treeName = document.getElementById('breadcrumb-name')?.textContent || '指标树';
    if (titleEl) titleEl.textContent = `异动指标 · ${treeName}`;

    if (!alerts.length) {
      if (summaryEl) summaryEl.hidden = true;
      if (footHint) footHint.textContent = '';
      tbody.innerHTML = '<tr><td colspan="6" class="tree-alert-empty"><i class="fas fa-circle-check"></i><p>当前账期与地域下无异动指标</p></td></tr>';
      if (window.TablePagination) {
        TablePagination.render('tree-alert-list-pagination', {
          total: 0,
          page: 1,
          pageSize: TREE_LIST_PAGE_SIZE,
          onPageChange: () => {}
        });
      }
      return;
    }

    if (summaryEl) {
      summaryEl.hidden = false;
      summaryEl.innerHTML = `
        <div class="tree-alert-summary-card">
          <span class="tree-alert-summary-card-k">异动指标数</span>
          <strong class="tree-alert-summary-card-v is-alert">${alerts.length}</strong>
        </div>
        <div class="tree-alert-summary-card">
          <span class="tree-alert-summary-card-k">关联客群总规模（估算）</span>
          <strong class="tree-alert-summary-card-v">${escHtml(estimateTotalSegmentScale(alerts))}</strong>
        </div>`;
    }
    if (footHint) footHint.textContent = '';

    const pageRows = window.TablePagination
      ? TablePagination.slice(alerts, treeAlertPage, TREE_LIST_PAGE_SIZE)
      : alerts;

    if (window.TablePagination) {
      const result = TablePagination.render('tree-alert-list-pagination', {
        total: alerts.length,
        page: treeAlertPage,
        pageSize: TREE_LIST_PAGE_SIZE,
        onPageChange: nextPage => {
          treeAlertPage = nextPage;
          renderTreeAlertListTable();
        }
      });
      treeAlertPage = result.page;
    }

    tbody.innerHTML = pageRows.map(a => `
      <tr data-metric-id="${escHtml(a.id)}">
        <td>
          <div class="tree-alert-name-cell">
            <span class="tree-alert-dot" aria-hidden="true"></span>
            <strong>${escHtml(a.name)}</strong>
          </div>
        </td>
        <td><strong>${escHtml(a.value)}</strong></td>
        <td><span class="${momTrendClass(a.yoy)}">${escHtml(a.yoy)}</span></td>
        <td><span class="${momTrendClass(a.mom)}">${escHtml(a.mom)}</span></td>
        <td><span class="tree-alert-scale"><i class="fas fa-users"></i> ${escHtml(a.scaleLabel)}</span></td>
        <td class="tree-alert-ops">
          <button type="button" class="tree-alert-op-btn" data-tree-alert-act="dispatch" title="指标调度"><i class="fas fa-bullseye"></i> 指标调度</button>
          <button type="button" class="tree-alert-op-btn" data-tree-alert-act="seg-dispatch" title="客群调度"><i class="fas fa-users-cog"></i> 客群调度</button>
          <button type="button" class="tree-alert-op-btn" data-tree-alert-act="rootcause" title="根因分析"><i class="fas fa-sitemap"></i> 根因分析</button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-tree-alert-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('tr')?.dataset.metricId;
        const item = alerts.find(x => x.id === id);
        const node = item?.node || findTreeNode(window._currentTreeRoot, id);
        if (!node) return;
        const act = btn.dataset.treeAlertAct;
        if (typeof closeModal === 'function') closeModal('modal-tree-alert-list');
        if (act === 'dispatch' && typeof openMetricDispatchWizard === 'function') openMetricDispatchWizard(node);
        else if (act === 'seg-dispatch') {
          const agg = buildAlertSegmentAgg(node, item);
          if (typeof resolveTreeDetailId === 'function') agg.treeId = resolveTreeDetailId();
          if (typeof window.navigateToSegmentDispatch === 'function') {
            window.navigateToSegmentDispatch(agg);
          } else {
            window.alert('客群调度模块未加载');
          }
        }
        else if (act === 'rootcause') openMetricDetail(node, 'rootcause');
      });
    });
  }

  function estimateTotalSegmentScale(alerts) {
    const total = alerts.reduce((sum, a) => {
      const m = String(a.scaleLabel || '').replace(/,/g, '').match(/([\d.]+)/);
      return sum + (m ? parseFloat(m[1]) : 0);
    }, 0);
    if (!total) return '—';
    return total.toLocaleString('zh-CN') + ' 人';
  }

  window.openTreeAlertMetricsModal = function () {
    treeAlertPage = 1;
    renderTreeAlertListTable();
    if (typeof openModal === 'function') openModal('modal-tree-alert-list');
  };

  window.openTreeAnomalyReportModal = function () {
    const root = window._currentTreeRoot;
    const treeName = document.getElementById('breadcrumb-name')?.textContent || '指标树';
    if (typeof window.buildTreeAnomalyReport !== 'function' || typeof window.openAnomalyReportModal !== 'function') {
      alert('分析报告组件未加载');
      return;
    }
    const report = window.buildTreeAnomalyReport(root, treeName);
    window.openAnomalyReportModal(report);
  };

  function escDispatchHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function resolveTreeDetailId() {
    const params = new URLSearchParams(location.search);
    const raw = params.get('id') || window.DEMO_SCENARIO?.treeId || 'tree-he-churn';
    return typeof resolveInsightTreeId === 'function' ? resolveInsightTreeId(raw) : raw;
  }

  function mapStrategySceneToTreeId(strategy) {
    const scene = strategy?.operationScene || '';
    if (scene === '流量运营') return 'tree-traffic-flow';
    if (['离网维系', '中高端客户运营', '合约运营'].includes(scene)) return 'tree-he-churn';
    return null;
  }

  function dispatchTypeBadgeClass(type) {
    if (type === '客群调度') return 'dispatch-type-segment';
    if (type === '策略调度') return 'dispatch-type-strategy';
    return 'dispatch-type-metric';
  }

  function collectTreeMetricIds(root) {
    const ids = new Set();
    function walk(n) {
      if (!n) return;
      if (n.id) ids.add(n.id);
      (n.children || []).forEach(walk);
    }
    walk(root || window._currentTreeRoot);
    return ids;
  }

  function collectTreeDispatchRecords(treeId) {
    const rows = [];
    const treeMetricIds = collectTreeMetricIds(window._currentTreeRoot);

    if (window.MetricDispatchStore) {
      MetricDispatchStore.getAll()
        .filter(r => {
          if ((r.treeId || '') === treeId) return true;
          if (r.dispatchMode === 'segment' && r.metricId && treeMetricIds.has(r.metricId)) return true;
          return false;
        })
        .forEach(r => {
          const type = MetricDispatchStore.dispatchTypeLabel(r.dispatchMode);
          rows.push({
            id: r.id,
            name: r.workOrderTitle || r.segmentName || r.metricName || '—',
            type,
            createdAt: r.dispatchedAt || r.createdAt || '—',
            creator: r.createdBy || '—',
            detailUrl: 'task-category.html?detail=' + encodeURIComponent(r.id),
            sortKey: r.dispatchedAt || r.createdAt || ''
          });
        });
    }

    if (window.JxStrategyStore) {
      JxStrategyStore.getDispatches().forEach(d => {
        const strategy = JxStrategyStore.getStrategy(d.strategyId);
        if (!strategy) return;
        if (mapStrategySceneToTreeId(strategy) !== treeId) return;
        rows.push({
          id: d.id,
          name: strategy.name,
          type: '策略调度',
          createdAt: d.dispatchedAt || strategy.createdAt || '—',
          creator: strategy.creator || '—',
          detailUrl: typeof JxStrategyLinks?.dispatchDetail === 'function'
            ? JxStrategyLinks.dispatchDetail(strategy.id)
            : 'dispatch-assign.html?tab=strategy&strategyId=' + encodeURIComponent(strategy.id),
          sortKey: d.dispatchedAt || strategy.createdAt || ''
        });
      });
    }

    return rows.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey), 'zh-CN'));
  }

  function renderTreeDispatchRecordsTable() {
    const tbody = document.getElementById('tree-dispatch-records-tbody');
    const hint = document.getElementById('tree-dispatch-records-hint');
    const title = document.getElementById('tree-dispatch-records-title');
    if (!tbody) return;

    const treeId = resolveTreeDetailId();
    const treeName = document.getElementById('breadcrumb-name')?.textContent || '指标树';
    const monthVal = getSelectedTreeDispatchMonth();
    const allRecords = collectTreeDispatchRecords(treeId);
    const records = allRecords.filter(r => recordMatchesDispatchMonth(r, monthVal));

    if (title) title.textContent = treeName + ' · 调度记录';
    if (hint) {
      hint.textContent = records.length
        ? `共 ${records.length} 条`
        : '';
    }

    const pageRows = window.TablePagination
      ? TablePagination.slice(records, treeDispatchPage, TREE_LIST_PAGE_SIZE)
      : records;

    if (window.TablePagination) {
      const result = TablePagination.render('tree-dispatch-records-pagination', {
        total: records.length,
        page: treeDispatchPage,
        pageSize: TREE_LIST_PAGE_SIZE,
        onPageChange: nextPage => {
          treeDispatchPage = nextPage;
          renderTreeDispatchRecordsTable();
        }
      });
      treeDispatchPage = result.page;
    }

    const emptyTip = '该月份暂无调度工单';

    tbody.innerHTML = pageRows.length
      ? pageRows.map(r => `
        <tr>
          <td><code class="id-chip">${escDispatchHtml(r.id)}</code></td>
          <td><strong>${escDispatchHtml(r.name)}</strong></td>
          <td><span class="dispatch-type-badge ${dispatchTypeBadgeClass(r.type)}">${escDispatchHtml(r.type)}</span></td>
          <td>${escDispatchHtml(r.createdAt)}</td>
          <td>${escDispatchHtml(r.creator)}</td>
          <td class="tree-alert-ops">
            <a href="${escDispatchHtml(r.detailUrl)}" class="btn btn-ghost btn-sm">详情</a>
          </td>
        </tr>
      `).join('')
      : `<tr><td colspan="6" class="muted tree-dispatch-empty-tip">${escDispatchHtml(emptyTip)}</td></tr>`;
  }

  window.openTreeDispatchRecordsModal = function () {
    treeDispatchPage = 1;
    const monthInput = document.getElementById('tree-dispatch-records-month');
    if (monthInput) monthInput.value = getDefaultTreeDispatchMonth();
    renderTreeDispatchRecordsTable();
    if (typeof openModal === 'function') openModal('modal-tree-dispatch-records');
  };

  function bindTreeDispatchRecordsMonthFilter() {
    const monthInput = document.getElementById('tree-dispatch-records-month');
    if (!monthInput || monthInput.dataset.bound === '1') return;
    monthInput.dataset.bound = '1';
    monthInput.addEventListener('change', () => {
      treeDispatchPage = 1;
      renderTreeDispatchRecordsTable();
    });
  }

  window.openMetricDetail = function (node, tab) {
    if (!node || node.type === 'category') return;
    hideMetricHoverPopover();
    currentMetricNode = node;
    window.currentMetricNode = node;
    document.querySelectorAll('.metric-node-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector('.metric-node-card[data-id="' + node.id + '"]');
    if (card) card.classList.add('selected');

    document.getElementById('modal-metric-name').textContent = node.name;
    fillMetaInfo(node);
    fillCommonStats(node);
    const metaPanel = document.getElementById('metric-meta-panel-rc');
    if (metaPanel) metaPanel.hidden = false;

    if (typeof renderRootCauseFlow === 'function') renderRootCauseFlow(node);
    switchDetailTab('rootcause');
    openModal('modal-metric-detail');
  };

  window.switchDetailTab = function (tab) {
    document.querySelectorAll('.detail-modal-tabs button').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.detail-tab-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.tab === tab);
    });
    if (tab === 'rootcause') {
      requestAnimationFrame(() => {
        if (typeof scheduleRcTagLayouts === 'function') scheduleRcTagLayouts();
      });
    }
  };

  function initTreeDetailNoticeBar() {
    const bar = document.getElementById('jx-tree-notice-bar');
    if (!bar) return;
    const KEY = 'jxTreeDetailNoticeDismissed';
    try {
      if (localStorage.getItem(KEY) === '1') {
        bar.hidden = true;
        return;
      }
    } catch (e) { /* ignore */ }
    bar.querySelector('[data-dismiss-tree-notice]')?.addEventListener('click', () => {
      bar.hidden = true;
      try {
        localStorage.setItem(KEY, '1');
      } catch (e) { /* ignore */ }
      requestAnimationFrame(() => {
        syncTreeCanvasViewportHeight();
        syncTreeZoomSpace();
        layoutHorizontalTreeLinks();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTreeDetailNoticeBar();
    bindMetricRegionDrawer();
    bindTreeDispatchRecordsMonthFilter();
    document.querySelectorAll('.detail-modal-tabs button').forEach(btn => {
      btn.addEventListener('click', () => switchDetailTab(btn.dataset.tab));
    });
    bindHoverPopover();
    window.addEventListener('resize', () => {
      syncTreeCanvasViewportHeight();
      requestAnimationFrame(() => {
        syncTreeZoomSpace();
        layoutHorizontalTreeLinks();
      });
      if (hoverMetricNode) {
        const card = document.querySelector('.metric-node-card.hover-active');
        if (card) showMetricHoverPopover(hoverMetricNode, card);
      }
    });
    syncTreeCanvasViewportHeight();
    requestAnimationFrame(() => syncTreeCanvasViewportHeight());
  });
})();
