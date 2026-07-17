/** 流量运营首页 · 指标目录（来源：【流量运营】首页概览指标list.xlsx） */
(function () {
  const PERIOD = {
    day: { label: '日', scale: 0.034 },
    week: { label: '周', scale: 0.24 },
    month: { label: '月', scale: 1 },
    quarter: { label: '季度', scale: 2.85 }
  };

  const MONTH_LABELS = ['12月', '1月', '2月', '3月', '4月', '5月'];

  function getMonthLabelSeries(endYear, endMonth) {
    const short = [];
    const full = [];
    for (let i = 5; i >= 0; i--) {
      let y = endYear;
      let m = endMonth - i;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      short.push(`${m}月`);
      full.push(`${y}年${m}月`);
    }
    return { short, full };
  }

  /** Excel 指标分类与指标名称 */
  const TRAFFIC_HOME_CATALOG = [
    {
      id: 'core',
      name: '核心指标',
      icon: 'fa-star',
      color: '#0d9488',
      metrics: [
        { id: 'tf-scale', name: '流量使用规模', unit: '万G', displayHint: '规模、环比', base: 12856, businessCaliber: '统计周期内全省移动用户产生的上网流量合计，含2G/4G/5G及WLAN，单位换算为万G。' },
        { id: 'tf-yoy-growth', name: '流量同比增幅', unit: '%', displayHint: '增幅、环比pp', base: 8.6, target: 10, businessCaliber: '当期流量使用规模与上年同期相比的增长幅度，反映流量大盘同比增速。' },
        { id: 'tf-revenue', name: '流量累计收入', unit: '万元', displayHint: '规模、环比', base: 28640, businessCaliber: '统计周期内由流量相关业务产生的累计收入，含套餐内流量费、套外流量费及流量增值业务收入。' },
        { id: 'tf-revenue-yoy', name: '流量累计收入同比增幅', unit: '%', displayHint: '增幅、环比pp', base: 5.2, businessCaliber: '当期流量累计收入与上年同期相比的增长幅度，衡量流量变现能力变化。' }
      ]
    },
    {
      id: 'mainline',
      name: '主线指标',
      icon: 'fa-route',
      color: '#2563eb',
      metrics: [
        { id: 'tf-contrib-device', name: '机_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 2.4, businessCaliber: '终端换机、升档及5G终端发展带来的流量增量，占全省流量同比增幅的贡献占比。' },
        { id: 'tf-contrib-package', name: '套_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 1.8, businessCaliber: '套餐升档、扩容及大流量套餐发展带来的流量增量，占流量同比增幅的贡献占比。' },
        { id: 'tf-contrib-network', name: '网_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 1.2, businessCaliber: '5G网络覆盖提升、登网率改善及网络质量优化带来的流量增量贡献占比。' },
        { id: 'tf-contrib-card-keep', name: '卡-以存带增_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 0.9, businessCaliber: '通过存量客户保有、合约续约及融合捆绑带动的新增流量贡献占比。' },
        { id: 'tf-contrib-card-grow', name: '卡-以增促存_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 0.7, businessCaliber: '新入网、副卡及家庭成员卡发展带动整体流量增长，对增幅的贡献占比。' },
        { id: 'tf-contrib-own', name: '用-自有产品_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 1.5, businessCaliber: '咪咕、移动云盘、视频彩铃等自有业务使用带来的流量增量贡献占比。' },
        { id: 'tf-contrib-external', name: '用-外部产品_流量增幅贡献', unit: '%', displayHint: '贡献、环比pp', base: 0.6, businessCaliber: '抖音、微信等外部APP使用带来的流量增量，占全省流量增幅的贡献占比。' }
      ]
    },
    {
      id: 'negative',
      name: '负面清单',
      icon: 'fa-triangle-exclamation',
      color: '#dc2626',
      metrics: [
        { id: 'tf-ultra-users', name: '超高流量用户数', unit: '户', displayHint: '规模、环比', base: 12480, watch: true, businessCaliber: '月人均流量超过设定阈值（如50GB）的客户数，用于识别大流量及异常使用客户。' },
        { id: 'tf-ultra-scale', name: '超高流量规模', unit: 'GB', displayHint: '规模、环比', base: 896000, watch: true, businessCaliber: '超高流量用户群体产生的流量合计，反映头部流量用户对全网流量的占用规模。' },
        { id: 'tf-ultra-ratio', name: '超高流量贡献比', unit: '%', displayHint: '贡献、环比pp', base: 18.6, alertAbove: 15, watch: true, businessCaliber: '超高流量用户流量占全省总流量的比例，衡量流量结构集中度与潜在风险。' }
      ]
    },
    {
      id: 'focus',
      name: '重点关注指标',
      icon: 'fa-bullseye',
      color: '#7c3aed',
      metrics: [
        { id: 'tf-2g-migrate', name: '2G终端月迁出率', unit: '%', displayHint: '迁出率、环比pp', base: 4.2, businessCaliber: '当月由2G终端更换为4G/5G终端的客户数，占月初2G终端客户数的比例。' },
        { id: 'tf-4g-migrate', name: '4G终端月迁出率', unit: '%', displayHint: '迁出率、环比pp', base: 2.8, businessCaliber: '当月由4G终端更换为5G终端的客户数，占月初4G终端客户数的比例。' },
        { id: 'tf-5g-old-migrate', name: '5G长机龄月迁出率', unit: '%', displayHint: '迁出率、环比pp', base: 1.6, businessCaliber: '使用5G终端超过24个月且当月完成换机的客户占比，反映长机龄终端更新进度。' },
        { id: 'tf-tariff-expand', name: '资费扩容当月完成量', unit: '户', displayHint: '规模、环比', base: 6840, businessCaliber: '当月完成套餐流量扩容、升档或叠加流量包办理的客户数。' },
        { id: 'tf-5g-adapt', name: '5G机套适配率', unit: '%', displayHint: '适配率、环比pp', base: 72.4, target: 75, businessCaliber: '5G终端客户中套餐档位与终端能力相匹配（建议使用5G套餐）的客户占比。' },
        { id: 'tf-5g-online', name: '5G登网率', unit: '%', displayHint: '登网率、环比pp', base: 68.2, target: 70, businessCaliber: '5G终端客户中当月有5G网络接入记录的客户占比，衡量5G网络实际使用渗透。' },
        { id: 'tf-5g-smart', name: '5G智网月发展量', unit: '户', displayHint: '规模、环比', base: 4280, businessCaliber: '当月新发展或开通5G智能网络（5G SA/智网）业务的客户数。' }
      ]
    }
  ];

  function hash(s, n) {
    let h = 0;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return Math.abs(h) % (n || 100);
  }

  function regionFactor(drill) {
    const s = drill || {};
    if (s.community) return 0.02;
    if (s.grid) return 0.05;
    if (s.county) return 0.12;
    if (s.city) return 0.22;
    return 1;
  }

  function regionKey(drill) {
    const s = drill || {};
    if (s.community) return 'c-' + s.community.id;
    if (s.grid) return 'g-' + s.grid.id;
    if (s.county) return 'co-' + s.county.id;
    if (s.city) return 'ci-' + s.city.id;
    return 'jx';
  }

  function getRegionLabel(drill) {
    const s = drill || {};
    if (s.community) return s.community.name;
    if (s.grid) return s.grid.name;
    if (s.county) return s.county.name;
    if (s.city) return s.city.name;
    return '江西省';
  }

  function formatValue(num, unit) {
    if (unit === '%') return (Math.round(num * 10) / 10).toFixed(1);
    if (unit === '户' || unit === '万元' || unit === 'GB') return Math.round(num).toLocaleString('zh-CN');
    if (unit === '万G') return (Math.round(num * 10) / 10).toLocaleString('zh-CN');
    return String(Math.round(num * 10) / 10);
  }

  function buildTrend(base, metricId, rk, period, decimals) {
    const drift = hash(metricId + rk + period, 12) / 100;
    const values = [];
    for (let i = 0; i < 6; i++) {
      const factor = 0.88 + (i * 0.024) + drift * (i % 2 ? 1 : -1);
      const v = base * factor * (0.96 + hash(metricId + i + rk, 8) / 200);
      values.push(decimals ? Math.round(v * 10) / 10 : Math.round(v));
    }
    values[5] = decimals ? Math.round(base * 10) / 10 : Math.round(base);
    return values;
  }

  function buildMom(metricId, rk, isPp) {
    const h = hash(metricId + rk + 'mom', 20);
    const up = h > 8;
    const val = (0.2 + (h % 10) / 10).toFixed(1);
    return {
      label: '环比',
      text: (up ? '+' : '-') + val + (isPp ? 'pp' : '%'),
      up
    };
  }

  function buildYoy(metricId, rk, isPp) {
    const h = hash(metricId + rk + 'yoy', 20);
    const up = h > 6;
    const val = (0.4 + (h % 12) / 10).toFixed(1);
    return {
      label: '同比',
      text: (up ? '+' : '-') + val + (isPp ? 'pp' : '%'),
      up
    };
  }

  function buildMomTrend(metricId, rk, isPp) {
    const suffix = isPp ? 'pp' : '%';
    return Array.from({ length: 6 }, (_, i) => {
      const h = hash(metricId + rk + i + 'momt', 24);
      const up = h > 10;
      const val = 0.1 + (h % 9) / 10;
      return {
        value: Math.round(val * 10) / 10 * (up ? 1 : -1),
        text: (up ? '+' : '-') + val.toFixed(1) + suffix
      };
    });
  }

  function buildYoyTrend(metricId, rk, isPp) {
    const suffix = isPp ? 'pp' : '%';
    return Array.from({ length: 6 }, (_, i) => {
      const h = hash(metricId + rk + i + 'yoyt', 24);
      const up = h > 8;
      const val = 0.3 + (h % 11) / 10;
      return {
        value: Math.round(val * 10) / 10 * (up ? 1 : -1),
        text: (up ? '+' : '-') + val.toFixed(1) + suffix
      };
    });
  }

  function isPercentHint(hint) {
    return /pp|增幅|贡献|迁出|适配|登网/.test(hint || '');
  }

  function buildMetricInstance(def, period, drill, monthMeta) {
    if (def.empty) {
      return {
        ...def,
        isEmpty: true,
        emptyReason: def.emptyReason || '当前月份暂无数据',
        value: null,
        valueText: null,
        mom: null,
        yoy: null,
        trend: [],
        momTrend: [],
        yoyTrend: [],
        monthLabels: monthMeta?.short || MONTH_LABELS,
        monthLabelsFull: monthMeta?.full || MONTH_LABELS,
        alert: false,
        regionLabel: getRegionLabel(drill)
      };
    }

    const sc = (PERIOD[period] || PERIOD.month).scale;
    const f = regionFactor(drill);
    const rk = regionKey(drill);
    const periodKey = period + (monthMeta?.full?.join('-') || '');
    const h = hash(def.id + rk + periodKey, 100);
    const isPct = def.unit === '%';
    const rawBase = def.base * sc * f * (0.96 + h / 500);
    const value = isPct ? Math.round(rawBase * 10) / 10 : rawBase;
    const isPp = isPercentHint(def.displayHint);
    const mom = buildMom(def.id, rk, isPp);
    const yoy = buildYoy(def.id, rk, isPp);
    const trend = buildTrend(value, def.id, rk, period, isPct);
    const momTrend = buildMomTrend(def.id, rk, isPp);
    const yoyTrend = buildYoyTrend(def.id, rk, isPp);
    let alert = !!def.watch;
    if (def.target != null && isPct) alert = alert || value < def.target;
    if (def.alertAbove != null && isPct) alert = alert || value > def.alertAbove;
    if (def.id === 'tf-yoy-growth') alert = alert || value < 10;

    return {
      ...def,
      value,
      valueText: formatValue(value, def.unit),
      mom,
      yoy,
      trend,
      momTrend,
      yoyTrend,
      monthLabels: monthMeta?.short || MONTH_LABELS,
      monthLabelsFull: monthMeta?.full || MONTH_LABELS,
      alert,
      regionLabel: getRegionLabel(drill)
    };
  }

  function buildAlerts(modules, drill) {
    const flagged = [];
    modules.forEach(mod => {
      mod.metrics.forEach(m => {
        if (!m.alert) return;
        flagged.push({
          id: 'alert-' + m.id,
          metricId: m.id,
          metricName: m.name,
          level: mod.id === 'negative' ? 'danger' : 'warning',
          rule: m.target != null
            ? `低于目标 ${m.target}${m.unit}`
            : m.alertAbove != null
              ? `超过阈值 ${m.alertAbove}${m.unit}`
              : '需重点关注',
          content: `${getRegionLabel(drill)} · 当前 ${m.valueText}${m.unit}，${m.mom.text}`,
          metricValue: m.valueText + m.unit,
          triggerValue: m.mom.text
        });
      });
    });
    return flagged.slice(0, 4);
  }

  window.TrafficHomeData = {
    PERIOD,
    MONTH_LABELS,
    getMonthLabelSeries,
    CATALOG: TRAFFIC_HOME_CATALOG,
    getRegionLabel,
    buildMetricInstance,

    getMetricDef(metricId) {
      for (const mod of TRAFFIC_HOME_CATALOG) {
        const m = mod.metrics.find(x => x.id === metricId);
        if (m) return { ...m, categoryId: mod.id, categoryName: mod.name };
      }
      return null;
    },

    build(period, drill, drillPeriod) {
      const dp = drillPeriod || window.jxDrillPeriod || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
      const monthMeta = getMonthLabelSeries(dp.year, dp.month);
      const customConfig = window.OverviewConfigStore?.getConfig('traffic-home.html');
      let modules;
      if (customConfig?.sections?.length && window.OverviewConfigRender) {
        modules = OverviewConfigRender.buildModulesFromConfig(customConfig, period, drill, dp);
      } else {
        modules = TRAFFIC_HOME_CATALOG.map(mod => ({
          ...mod,
          metrics: mod.metrics.map(m => buildMetricInstance(m, period, drill, monthMeta))
        }));
      }
      modules.push({
        id: 'empty-demo',
        name: '空值展示示例',
        icon: 'fa-circle-minus',
        color: '#94a3b8',
        metrics: [
          buildMetricInstance({
            id: 'tf-demo-empty-1',
            name: '国际漫游收入',
            unit: '万元',
            displayHint: '规模、环比',
            empty: true,
            emptyReason: '当前月份暂无数据',
            businessCaliber: '统计周期内国际漫游业务产生的收入合计。'
          }, period, drill, monthMeta),
          buildMetricInstance({
            id: 'tf-demo-empty-2',
            name: '政企专线收入',
            unit: '万元',
            displayHint: '规模、环比',
            empty: true,
            emptyReason: '当前月份暂无数据',
            businessCaliber: '政企客户专线业务产生的月收入。'
          }, period, drill, monthMeta)
        ]
      });
      return {
        period,
        drill,
        drillPeriod: dp,
        dataMonthLabel: `${dp.year}年${dp.month}月`,
        regionLabel: getRegionLabel(drill),
        modules,
        alerts: buildAlerts(modules, drill)
      };
    },

    getRegionChildren(drill) {
      const s = drill || {};
      const R = window.JIANGXI_REGION;
      if (!R) return [];

      if (!s.city) {
        return R.cities.map(c => ({
          id: c.id,
          name: c.name.replace('市', ''),
          drillTo: 'city',
          entity: c
        }));
      }
      if (!s.county) {
        return (s.city.counties || []).map(c => ({
          id: c.id,
          name: c.name,
          drillTo: 'county',
          entity: c
        }));
      }
      if (!s.grid) {
        return (s.county.grids || []).map(g => ({
          id: g.id,
          name: g.name,
          drillTo: 'grid',
          entity: g
        }));
      }
      if (!s.community) {
        return (s.grid.communities || []).map(c => ({
          id: c.id,
          name: c.name,
          drillTo: 'community',
          entity: c
        }));
      }
      return [];
    },

    getDrillRows(metricId, drill) {
      const def = TrafficHomeData.getMetricDef(metricId);
      if (!def) return [];
      const inst = buildMetricInstance(def, 'month', drill);
      const children = TrafficHomeData.getRegionChildren(drill);

      if (!children.length) {
        return [{
          name: getRegionLabel(drill),
          value: inst.valueText,
          unit: def.unit,
          label: def.name,
          drillTo: null,
          alert: inst.alert
        }];
      }

      return children.map(ch => {
        const v = inst.value * (0.35 + hash(ch.id + metricId, 50) / 80);
        const rowVal = def.unit === '%' ? Math.round(v * 10) / 10 : Math.round(v);
        return {
          id: ch.id,
          name: ch.name,
          value: formatValue(rowVal, def.unit),
          unit: def.unit,
          label: def.name,
          drillTo: ch.drillTo,
          alert: hash(ch.id + metricId + 'x', 8) < 2
        };
      });
    }
  };
})();
