/** 运营概览首页指标配置存储 */
(function () {
  const KEY = 'jxOverviewConfig';
  const SCHEMA_VERSION = 1;

  const PROFILES = [
    { pageKey: 'overview.html', label: '运营概览', group: '运营概览', icon: 'fa-chart-pie', color: '#2563eb', desc: '全省经营研判首页指标模块' },
    { pageKey: 'traffic-home.html', label: '流量运营概览（630）', group: '运营专区 · 流量运营', icon: 'fa-chart-line', color: '#0d9488', desc: '流量规模、主线贡献与重点监控指标' },
    { pageKey: 'churn-retention.html', label: '离网维系', group: '运营专区 · 存量运营', icon: 'fa-user-shield', color: '#dc2626', desc: '离网预警与维系成效指标' },
    { pageKey: 'family-fusion.html', label: '家庭融合运营', group: '运营专区 · 存量运营', icon: 'fa-house-user', color: '#7c3aed', desc: '家庭融合与宽带增收指标' },
    { pageKey: 'high-end-retention.html', label: '中高端保有', group: '运营专区 · 存量运营', icon: 'fa-gem', color: '#d97706', desc: '中高端客户规模与价值保有' },
    { pageKey: 'international-market.html', label: '国际市场', group: '运营专区 · 细分市场', icon: 'fa-globe', color: '#0891b2', desc: '国际漫游与跨境业务指标' }
  ];

  const SECTION_COLORS = ['#2563eb', '#0d9488', '#7c3aed', '#dc2626', '#d97706', '#0891b2'];
  const SECTION_ICONS = ['fa-star', 'fa-route', 'fa-bullseye', 'fa-chart-line', 'fa-users', 'fa-coins'];

  function catalogToSections(catalog) {
    return (catalog || []).map((mod, i) => ({
      id: mod.id || `sec-${i}`,
      title: mod.name,
      icon: mod.icon || SECTION_ICONS[i % SECTION_ICONS.length],
      color: mod.color || SECTION_COLORS[i % SECTION_COLORS.length],
      metrics: (mod.metrics || []).map(m => ({
        metricId: m.id,
        metricCode: m.code || '',
        metricName: m.name
      }))
    }));
  }

  function defaultOverviewSections() {
    return [
      {
        id: 'ov-core',
        title: '核心经营指标',
        icon: 'fa-star',
        color: '#2563eb',
        metrics: [
          { metricId: 'kpi-fl-rev-001', metricCode: 'KPI_FL_REV_001', metricName: '流量总收入' },
          { metricId: 'kpi-he-001', metricCode: 'KPI_HE_001', metricName: '中高端客户规模' },
          { metricId: 'kpi-churn-002', metricCode: 'KPI_CUS_CHURN_003', metricName: '离网率' }
        ]
      },
      {
        id: 'ov-value',
        title: '收入与价值',
        icon: 'fa-coins',
        color: '#0d9488',
        metrics: [
          { metricId: 'kpi-fl-rev-003', metricCode: 'KPI_FL_REV_003', metricName: '套外收入' },
          { metricId: 'kpi-he-002', metricCode: 'KPI_HE_002', metricName: '中高端客户ARPU' },
          { metricId: 'kpi-family-002', metricCode: 'KPI_FAMILY_002', metricName: '融合套餐收入' }
        ]
      }
    ];
  }

  function trafficHomeDefaultSections() {
    return catalogToSections([
      {
        id: 'core', name: '核心指标', icon: 'fa-star', color: '#0d9488',
        metrics: [
          { id: 'tf-scale', name: '流量使用规模' },
          { id: 'tf-yoy-growth', name: '流量同比增幅' },
          { id: 'tf-revenue', name: '流量累计收入' },
          { id: 'tf-revenue-yoy', name: '流量累计收入同比增幅' }
        ]
      },
      {
        id: 'mainline', name: '主线指标', icon: 'fa-route', color: '#2563eb',
        metrics: [
          { id: 'tf-contrib-device', name: '机_流量增幅贡献' },
          { id: 'tf-contrib-package', name: '套_流量增幅贡献' },
          { id: 'tf-contrib-network', name: '网_流量增幅贡献' }
        ]
      },
      {
        id: 'negative', name: '负面清单', icon: 'fa-triangle-exclamation', color: '#dc2626',
        metrics: [
          { id: 'tf-ultra-users', name: '超高流量用户数' },
          { id: 'tf-ultra-ratio', name: '超高流量贡献比' }
        ]
      },
      {
        id: 'focus', name: '重点关注指标', icon: 'fa-bullseye', color: '#7c3aed',
        metrics: [
          { id: 'tf-5g-adapt', name: '5G机套适配率' },
          { id: 'tf-5g-online', name: '5G登网率' }
        ]
      }
    ]);
  }

  function buildDefaultSeed() {
    const seed = {};
    PROFILES.forEach(p => {
      if (p.pageKey === 'traffic-home.html') {
        seed[p.pageKey] = {
          pageKey: p.pageKey,
          sections: trafficHomeDefaultSections(),
          updatedAt: '2026-05-28 10:00:00'
        };
      } else if (p.pageKey === 'overview.html') {
        seed[p.pageKey] = {
          pageKey: p.pageKey,
          sections: defaultOverviewSections(),
          updatedAt: '2026-05-28 10:00:00'
        };
      } else {
        seed[p.pageKey] = {
          pageKey: p.pageKey,
          sections: [
            {
              id: 'sec-default',
              title: '核心指标',
              icon: 'fa-star',
              color: '#2563eb',
              metrics: [
                { metricId: 'kpi-he-001', metricCode: 'KPI_HE_001', metricName: '中高端客户规模' },
                { metricId: 'kpi-churn-002', metricCode: 'KPI_CUS_CHURN_003', metricName: '离网率' }
              ]
            }
          ],
          updatedAt: '2026-05-28 10:00:00'
        };
      }
    });
    return seed;
  }

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeAll(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map));
      localStorage.setItem(KEY + '_version', String(SCHEMA_VERSION));
    } catch (e) { /* ignore */ }
  }

  function ensureSeed() {
    const version = Number(localStorage.getItem(KEY + '_version') || 0);
    if (!readAll() || version < SCHEMA_VERSION) {
      writeAll(buildDefaultSeed());
    }
  }

  function nowStr() {
    return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  window.OverviewConfigStore = {
    PROFILES,
    SECTION_COLORS,
    SECTION_ICONS,

    getProfiles() {
      return PROFILES.slice();
    },

    getProfile(pageKey) {
      return PROFILES.find(p => p.pageKey === pageKey) || null;
    },

    getProfileStats(pageKey) {
      const config = this.getConfig(pageKey);
      const sections = config?.sections || [];
      const metricCount = sections.reduce((n, s) => n + (s.metrics?.length || 0), 0);
      return {
        sectionCount: sections.length,
        metricCount,
        updatedAt: config?.updatedAt || ''
      };
    },

    getAllConfigs() {
      ensureSeed();
      return readAll() || buildDefaultSeed();
    },

    getConfig(pageKey) {
      const all = this.getAllConfigs();
      return all[pageKey] ? JSON.parse(JSON.stringify(all[pageKey])) : null;
    },

    saveConfig(pageKey, config) {
      const all = this.getAllConfigs();
      all[pageKey] = {
        ...config,
        pageKey,
        updatedAt: nowStr()
      };
      writeAll(all);
      return all[pageKey];
    },

    resetConfig(pageKey) {
      const defaults = buildDefaultSeed();
      const all = this.getAllConfigs();
      if (defaults[pageKey]) {
        all[pageKey] = { ...defaults[pageKey], updatedAt: nowStr() };
        writeAll(all);
      }
      return all[pageKey] || null;
    }
  };

  ensureSeed();
})();
