/**
 * 指标库统一数据源（与指标配置模块一致，供看管人等模块选用）
 */
(function () {
  const DEFAULT_LIBRARY = [
    { code: 'KPI_FL_REV_001', name: '流量总收入', scene: '公众市场 / 流量运营 / 收入分析' },
    { code: 'KPI_FL_REV_002', name: '套餐内收入', scene: '公众市场 / 流量运营 / 收入分析' },
    { code: 'KPI_FL_REV_010', name: '视频定向包收入', scene: '公众市场 / 流量运营 / 收入分析' },
    { code: 'KPI_CUS_CHURN_003', name: '离网率', scene: '公众市场 / 存量运营 / 离网维系' },
    { code: 'KPI_HE_003', name: '中高端客户离网率', scene: '公众市场 / 存量运营 / 中高端客户运营' },
    { code: 'KPI_CHURN_001', name: '离网预警客户数', scene: '公众市场 / 存量运营 / 离网维系' },
    { code: 'KPI_HCD_001', name: '中高端客户流失风险指数', scene: '公众市场 / 存量运营 / 中高端客户流失' },
    { code: 'KPI_HCD_009', name: '中高端离网率', scene: '公众市场 / 存量运营 / 中高端客户流失' },
    { code: 'KPI_FAMILY_001', name: '家庭融合客户数', scene: '公众市场 / 家庭运营 / 融合增收' },
    { code: 'KPI_ROAM_001', name: '累计_国漫流量月包产品订购量', scene: '公众市场 / 国际业务运营 / 国际业务' }
  ];

  if (!window.DEMO_METRIC_LIBRARY) {
    window.DEMO_METRIC_LIBRARY = DEFAULT_LIBRARY.map(m => ({
      ...m,
      caliber: '—',
      direction: '正向',
      source: '经分系统',
      status: 'published'
    }));
  }

  window.getIndicatorMetricLibrary = function () {
    const map = new Map();
    (window.DEMO_METRIC_LIBRARY || []).forEach(m => {
      if (m.code) map.set(m.code, { code: m.code, name: m.name, scene: m.scene || '' });
    });
    (window.METRIC_OPTIONS || []).forEach(m => {
      if (m.code && !map.has(m.code)) map.set(m.code, { code: m.code, name: m.name, scene: m.scene || '' });
    });
    (window.HE_CHURN_METRICS || []).forEach(m => {
      if (m.code && !map.has(m.code)) map.set(m.code, { code: m.code, name: m.name, scene: m.scene || '' });
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  };

  window.getMetricByCode = function (code) {
    return window.getIndicatorMetricLibrary().find(m => m.code === code) || null;
  };
})();
