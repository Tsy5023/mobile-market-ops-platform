/** 从指标/客群环节跳转策略中心创建页 */
(function () {
  const STORAGE_KEY = 'jxStrategyCreateContext';

  window.saveStrategyCreateContext = function (agg, extra) {
    const payload = {
      segmentId: agg?.id || '',
      segmentName: agg?.name || '汇聚客群',
      scaleLabel: agg?.scaleLabel || '—',
      sourceMetric: agg?.sourceMetric || extra?.metricName || '',
      metricValue: agg?.metricValue || extra?.metricValue || '',
      metricMom: agg?.metricMom || extra?.metricMom || agg?.mom || '',
      metricYoy: agg?.metricYoy || extra?.metricYoy || agg?.yoy || '',
      tagConvergence: agg?.tagConvergence || [],
      savedAt: new Date().toISOString(),
      ...(extra || {})
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* ignore */ }
    return payload;
  };

  window.getStrategyCreateContext = function () {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  window.clearStrategyCreateContext = function () {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  };

  window.navigateToStrategyCreate = function (agg, extra) {
    window.saveStrategyCreateContext(agg, extra);
    const base = window.location.pathname.includes('/pages/')
      ? 'strategy-create.html'
      : 'pages/strategy-create.html';
    window.location.href = base;
  };
})();
