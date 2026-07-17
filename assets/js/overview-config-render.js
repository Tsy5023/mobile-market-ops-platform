/** 运营概览配置：指标数据构建与首页渲染 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hash(s, n) {
    let h = 0;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return Math.abs(h) % (n || 100);
  }

  function metricDefFromOption(m) {
    if (!m) return null;
    const isPct = /率|增幅|贡献|适配|登网|迁出|比/.test(m.name);
    const unit = isPct ? '%' : (/户|数/.test(m.name) ? '户' : '万元');
    return {
      id: m.id,
      code: m.code,
      name: m.name,
      unit,
      displayHint: isPct ? '增幅、环比pp' : '规模、环比',
      base: isPct ? (3 + hash(m.id, 15)) : (500 + hash(m.id, 8000)),
      businessCaliber: m.scene || '指标业务口径说明待补充。'
    };
  }

  function resolveMetricDef(metricRef) {
    const id = metricRef.metricId || metricRef.id;
    const tfDef = window.TrafficHomeData?.getMetricDef?.(id);
    if (tfDef) return { ...tfDef };
    const lib = window.getMetricById?.(id);
    if (lib) return metricDefFromOption(lib);
    return {
      id,
      code: metricRef.metricCode || '',
      name: metricRef.metricName || id,
      unit: '%',
      displayHint: '规模、环比',
      base: 10 + hash(id, 50),
      businessCaliber: '暂无业务口径说明'
    };
  }

  function createEmptyMetricInstance(def, reason) {
    return {
      ...def,
      isEmpty: true,
      emptyReason: reason || def.emptyReason || '当前月份暂无数据',
      value: null,
      valueText: null,
      mom: null,
      yoy: null,
      trend: [],
      momTrend: [],
      yoyTrend: [],
      monthLabels: [],
      alert: false
    };
  }

  function buildModulesFromConfig(config, period, drill, drillPeriod) {
    if (!config?.sections?.length) return [];
    const p = period || 'month';
    const d = drill || {};
    const dp = drillPeriod || window.jxDrillPeriod || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    const monthMeta = window.TrafficHomeData?.getMonthLabelSeries?.(dp.year, dp.month);

    return config.sections.map((sec, i) => {
      const metrics = (sec.metrics || []).map(ref => {
        if (ref.empty) {
          return createEmptyMetricInstance(resolveMetricDef(ref), ref.emptyReason);
        }
        const def = resolveMetricDef(ref);
        if (window.TrafficHomeData?.buildMetricInstance) {
          return window.TrafficHomeData.buildMetricInstance(def, p, d, monthMeta);
        }
        return {
          ...def,
          valueText: String(def.base),
          mom: { label: '环比', text: '+1.2%', up: true },
          yoy: { label: '同比', text: '+2.4%', up: true },
          trend: [def.base * 0.9, def.base * 0.92, def.base * 0.95, def.base * 0.97, def.base * 0.99, def.base],
          momTrend: [],
          monthLabels: monthMeta?.short || ['12月', '1月', '2月', '3月', '4月', '5月'],
          alert: false
        };
      });
      return {
        id: sec.id || `sec-${i}`,
        name: sec.title || `分组${i + 1}`,
        icon: sec.icon || 'fa-chart-line',
        color: sec.color || '#2563eb',
        metrics
      };
    }).filter(mod => mod.metrics.length);
  }

  function renderModulesHtml(modules, options) {
    const opts = options || {};
    const showDispatch = opts.showDispatch !== false;
    return (modules || []).map(mod => `
      <section class="tf-module ov-config-module" id="tf-module-${esc(mod.id)}">
        <header class="tf-module-head" style="--module-color:${esc(mod.color)}">
          <h3><i class="fas ${esc(mod.icon)}"></i> ${esc(mod.name)}</h3>
          <span class="tf-module-count muted">${mod.metrics.length} 项指标</span>
        </header>
        <div class="tf-metric-card-grid">
          ${mod.metrics.map(m => renderMetricCard(m, showDispatch)).join('')}
        </div>
      </section>`).join('');
  }

  function renderMetricCard(metric, showDispatch) {
    if (metric.isEmpty) return renderEmptyMetricCard(metric, showDispatch);

    const alertCls = metric.alert ? ' is-alert' : '';
    const dispatchBtn = showDispatch
      ? `<button type="button" class="btn btn-outline btn-sm" data-metric-dispatch="${esc(metric.id)}" title="指标调度"><i class="fas fa-bullseye"></i> 调度</button>`
      : '';
    const mom = metric.mom ? `<span class="tf-trend ${metric.mom.up ? 'up' : 'down'}">${esc(metric.mom.label)} ${esc(metric.mom.text)}</span>` : '';
    const yoy = metric.yoy ? `<span class="tf-trend ${metric.yoy.up ? 'up' : 'down'}">${esc(metric.yoy.label)} ${esc(metric.yoy.text)}</span>` : '';
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
          ${dispatchBtn}
        </div>
        <div class="tf-metric-card-value-row">
          <strong class="tf-metric-main-value">${esc(metric.valueText)}<small>${esc(metric.unit)}</small></strong>
          ${yoy}
          ${mom}
        </div>
      </article>`;
  }

  function renderEmptyMetricCard(metric, showDispatch) {
    const dispatchBtn = showDispatch
      ? `<button type="button" class="btn btn-outline btn-sm" data-metric-dispatch="${esc(metric.id)}" title="指标调度"><i class="fas fa-bullseye"></i> 调度</button>`
      : '';
    return `
      <article class="tf-metric-card is-empty" data-metric-id="${esc(metric.id)}">
        <div class="tf-metric-card-top">
          <h4 class="tf-metric-card-title">
            <span class="tf-metric-name-text">${esc(metric.name)}</span>
            <span class="icon-caliber-wrap tf-metric-caliber" title="业务口径">
              <i class="fas fa-circle-info"></i>
              <div class="tooltip-caliber">${esc(metric.businessCaliber || '暂无业务口径说明')}</div>
            </span>
          </h4>
          ${dispatchBtn}
        </div>
        <div class="tf-metric-empty-body">
          <div class="tf-metric-empty-icon" aria-hidden="true"><i class="fas fa-chart-column"></i></div>
          <div class="tf-metric-empty-value">--</div>
          <p class="tf-metric-empty-hint">${esc(metric.emptyReason || '当前月份暂无数据')}</p>
        </div>
      </article>`;
  }

  function renderPageSections(pageKey, containerId, ctx) {
    const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el || !window.OverviewConfigStore) return false;
    const config = OverviewConfigStore.getConfig(pageKey);
    if (!config?.sections?.length) {
      el.innerHTML = '';
      el.hidden = true;
      return false;
    }
    const modules = buildModulesFromConfig(
      config,
      ctx?.period || 'month',
      ctx?.drill || window.jxDrillState || {},
      ctx?.drillPeriod || window.jxDrillPeriod
    );
    if (!modules.length) {
      el.innerHTML = '';
      el.hidden = true;
      return false;
    }
    el.hidden = false;
    el.innerHTML = renderModulesHtml(modules, ctx?.renderOptions);
    if (typeof ctx?.onRendered === 'function') ctx.onRendered(el, modules);
    return true;
  }

  window.OverviewConfigRender = {
    resolveMetricDef,
    createEmptyMetricInstance,
    buildModulesFromConfig,
    renderModulesHtml,
    renderMetricCard,
    renderEmptyMetricCard,
    renderPageSections
  };
})();
