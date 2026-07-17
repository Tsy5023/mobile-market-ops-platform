/** 流量运营首页 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let period = 'month';
  let tooltipEl = null;

  function ensureTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'ov-chart-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function positionTooltip(tip, e) {
    tip.style.left = (e.clientX + 12) + 'px';
    tip.style.top = (e.clientY + 12) + 'px';
  }

  function bindTooltip(el, text) {
    if (!el || !text) return;
    const tip = ensureTooltip();
    el.addEventListener('mouseenter', e => {
      tip.textContent = text;
      tip.classList.remove('is-rich');
      tip.classList.add('show');
      positionTooltip(tip, e);
    });
    el.addEventListener('mousemove', e => positionTooltip(tip, e));
    el.addEventListener('mouseleave', () => tip.classList.remove('show'));
  }

  function bindHtmlTooltip(el, html) {
    if (!el || !html) return;
    const tip = ensureTooltip();
    el.addEventListener('mouseenter', e => {
      tip.innerHTML = html;
      tip.classList.add('show', 'is-rich');
      positionTooltip(tip, e);
    });
    el.addEventListener('mousemove', e => positionTooltip(tip, e));
    el.addEventListener('mouseleave', () => {
      tip.classList.remove('show', 'is-rich');
      tip.innerHTML = '';
    });
  }

  function bindTips(root) {
    root?.querySelectorAll('[data-tip]').forEach(el => bindTooltip(el, el.getAttribute('data-tip')));
  }

  function buildChartTipHtml(metric, index) {
    const fullLabels = metric.monthLabelsFull || metric.monthLabels || TrafficHomeData.MONTH_LABELS;
    const values = metric.trend || [];
    const momItem = metric.momTrend?.[index];
    const yoyItem = metric.yoyTrend?.[index];
    const month = fullLabels[index] || '';
    const valText = formatTrendValue(values[index], metric.unit);
    const momText = typeof momItem === 'object' ? momItem.text : '—';
    const yoyText = typeof yoyItem === 'object' ? yoyItem.text : '—';
    return `<div class="tf-chart-tip">
      <strong>${esc(metric.name)}</strong>
      <div class="tf-chart-tip-period">${esc(month)}</div>
      <div><span class="k">指标值</span>${esc(valText)}</div>
      <div><span class="k">同比</span>${esc(yoyText)}</div>
      <div><span class="k">环比</span>${esc(momText)}</div>
    </div>`;
  }

  function bindChartHover(cardEl, metric) {
    cardEl?.querySelectorAll('[data-point-index]').forEach(el => {
      const i = parseInt(el.dataset.pointIndex, 10);
      if (Number.isNaN(i)) return;
      bindHtmlTooltip(el, buildChartTipHtml(metric, i));
    });
  }

  function trendHtml(item) {
    if (!item) return '';
    const cls = item.up ? 'up' : 'down';
    return `<span class="tf-trend ${cls}">${esc(item.label)} ${esc(item.text)}</span>`;
  }

  function formatTrendValue(v, unit) {
    if (unit === '%') return v.toFixed(1) + unit;
    return (typeof v === 'number' ? v.toLocaleString('zh-CN') : v) + unit;
  }

  function trendChart(metric) {
    const values = metric.trend || [];
    const momTrend = metric.momTrend || [];
    const labels = metric.monthLabels || TrafficHomeData.MONTH_LABELS;
    const w = 300;
    const h = 96;
    const padL = 6;
    const padR = 6;
    const padT = 10;
    const padB = 22;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    const vMax = Math.max(...values) * 1.08;
    const vMin = 0;
    const vRange = vMax - vMin || 1;

    const momNums = momTrend.map(m => (typeof m === 'object' ? m.value : m));
    const mMax = Math.max(...momNums, 0.5);
    const mMin = Math.min(...momNums, -0.5);
    const mRange = mMax - mMin || 1;

    const slotW = innerW / values.length;
    const toX = i => padL + slotW * i + slotW / 2;
    const baseY = padT + innerH;
    const toValueY = v => padT + (1 - (v - vMin) / vRange) * innerH;
    const toMomY = v => padT + (1 - (v - mMin) / mRange) * innerH;
    const barWidth = Math.min(22, slotW * 0.52);

    const momPts = momNums.map((v, i) => `${toX(i)},${toMomY(v)}`).join(' ');

    const barsAndZones = values.map((v, i) => {
      const cx = toX(i);
      const barX = cx - barWidth / 2;
      const barY = toValueY(v);
      const barH = baseY - barY;
      const zoneX = padL + slotW * i;
      const momY = toMomY(momNums[i]);
      return `<rect class="tf-chart-hover-zone" x="${zoneX}" y="${padT}" width="${slotW}" height="${innerH}" data-point-index="${i}" rx="2"/>
        <rect class="tf-chart-bar" x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" rx="2" data-point-index="${i}"/>
        <circle cx="${cx}" cy="${momY}" r="3" class="tf-line-dot tf-line-dot-mom" data-point-index="${i}"/>`;
    }).join('');

    const xLabels = labels.map((lb, i) =>
      `<text x="${toX(i)}" y="${h - 4}" text-anchor="middle" class="tf-chart-xlabel">${esc(lb)}</text>`
    ).join('');

    return `<div class="tf-metric-chart-wrap" data-metric-chart="${esc(metric.id)}">
      <div class="tf-chart-legend">
        <span><i class="tf-legend-bar"></i>指标值</span>
        <span><i class="tf-legend-dot tf-legend-mom"></i>环比</span>
      </div>
      <svg class="tf-metric-chart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        ${barsAndZones}
        <polyline class="tf-chart-line tf-chart-line-mom" fill="none" points="${momPts}"/>
        ${xLabels}
      </svg>
    </div>`;
  }

  function metricCard(metric) {
    if (metric.isEmpty && window.OverviewConfigRender?.renderEmptyMetricCard) {
      return OverviewConfigRender.renderEmptyMetricCard(metric, true);
    }

    const alertCls = metric.alert ? ' is-alert' : '';
    return `
      <article class="tf-metric-card${alertCls}" data-metric-id="${esc(metric.id)}">
        <div class="tf-metric-card-top">
          <h4 class="tf-metric-card-title">
            <span class="tf-metric-name-text">${esc(metric.name)}</span>
            <span class="icon-caliber-wrap tf-metric-caliber" title="业务口径">
              <i class="fas fa-circle-info"></i>
              <div class="tooltip-caliber">${esc(metric.businessCaliber || '暂无业务口径说明')}</div>
            </span>
          </h4>
          <button type="button" class="btn btn-outline btn-sm" data-metric-dispatch="${esc(metric.id)}" title="指标调度"><i class="fas fa-bullseye"></i> 调度</button>
        </div>
        <div class="tf-metric-card-value-row">
          <strong class="tf-metric-main-value">${esc(metric.valueText)}<small>${esc(metric.unit)}</small></strong>
          ${trendHtml(metric.yoy)}
          ${trendHtml(metric.mom)}
        </div>
        <div class="tf-metric-card-chart">${trendChart(metric)}</div>
      </article>`;
  }

  function renderModules(d) {
    const root = document.getElementById('tf-modules-root');
    if (!root) return;
    root.innerHTML = (d.modules || []).map(mod => `
      <section class="tf-module" id="tf-module-${esc(mod.id)}">
        <header class="tf-module-head" style="--module-color:${esc(mod.color)}">
          <h3><i class="fas ${esc(mod.icon)}"></i> ${esc(mod.name)}</h3>
          <span class="tf-module-count muted">${mod.metrics.length} 项指标</span>
        </header>
        <div class="tf-metric-card-grid">
          ${mod.metrics.map(m => metricCard(m)).join('')}
        </div>
      </section>
    `).join('');

    bindModuleActions(root, d);
    root.querySelectorAll('.tf-metric-card').forEach(card => {
      const metricId = card.dataset.metricId;
      const found = findMetric(d, metricId);
      if (found?.metric?.isEmpty) return;
      if (found) bindChartHover(card, found.metric);
    });
  }

  function bindModuleActions(root, d) {
    root.querySelectorAll('[data-metric-dispatch]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        dispatchMetric(btn.dataset.metricDispatch, d);
      });
    });
  }

  function findMetric(d, metricId) {
    for (const mod of d.modules || []) {
      const m = mod.metrics.find(x => x.id === metricId);
      if (m) return { metric: m, module: mod };
    }
    return null;
  }

  function dispatchMetric(metricId, d) {
    const found = findMetric(d, metricId);
    if (!found) return;
    const { metric } = found;
    const node = {
      id: metric.id,
      name: metric.name,
      value: metric.valueText + metric.unit,
      mom: metric.mom?.text || '—',
      status: metric.alert ? 'alert' : 'normal',
      alert: metric.alert
    };
    if (typeof window.openMetricDispatchWizard === 'function') {
      window.openMetricDispatchWizard(node);
    } else {
      window.alert('指标调度组件未加载');
    }
  }

  function render() {
    const d = TrafficHomeData.build(period, window.jxDrillState || {}, window.jxDrillPeriod);
    renderModules(d);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('tf-dashboard')) return;
    window.jxDrillState = window.jxDrillState || { city: null, county: null, grid: null, community: null };
    window.onJxDrillChange = () => render();
    window.onJxPeriodChange = () => render();
    window.renderJiangxiDrill?.();
    render();
  });
})();
