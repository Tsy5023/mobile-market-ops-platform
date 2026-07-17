/** 根因分析报告 - 弹窗展示（嵌入 rca-report-view.html） */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function pickFeatures(branches, metricName) {
    const tags = [];
    (branches || []).forEach(b => (b.tags || []).forEach(t => {
      if (!tags.includes(t)) tags.push(t);
    }));
    const defaults = [
      '近30日携转查询', '离网倾向', '套餐降档倾向', 'ARPU连续下滑',
      '合约临近到期', '账单异议', '低接触客群', '渠道流失风险'
    ];
    const pool = tags.length >= 5 ? tags : defaults;
    const seed = hash(metricName || 'm');
    return pool.slice(0, 8).map((name, i) => ({
      id: 'feat_' + (seed % 9000 + 1000 + i),
      name,
      shapDay: (0.012 + (seed % 80) / 1000 + i * 0.0012).toFixed(4),
      shapMonth: (0.038 + (seed % 60) / 1000 + i * 0.002).toFixed(4),
      contribDay: (38 + (seed + i * 7) % 25).toFixed(1),
      contribMonth: (35 + (seed + i * 11) % 30).toFixed(1),
      direction: '正向'
    }));
  }

  function topN(features, key, n) {
    return [...features].sort((a, b) => parseFloat(b[key]) - parseFloat(a[key])).slice(0, n);
  }

  /** 保留结构化元数据，供根因流程步骤条等使用 */
  window.buildStructuredAnomalyReport = function (ctx) {
    const metricName = ctx.metricName || '核心指标';
    const branches = ctx.branches || [];
    const detectType = ctx.detectType || ctx.detectSource || 'rule';
    const value = ctx.value || '—';
    const mom = ctx.mom || '—';
    const topMetrics = branches.slice(0, 3).map(b => b.metric);
    const features = pickFeatures(branches, metricName);
    const dayTop = topN(features, 'shapDay', 5);
    const monthTop = topN(features, 'shapMonth', 5);
    const dayOverlap = dayTop.filter(d => monthTop.some(m => m.name === d.name)).length;

    const causalChain = topMetrics.length >= 2
      ? topMetrics.join(' → ') + ' → ' + metricName
      : (topMetrics[0] || '行为异动指标') + ' → ' + metricName;

    return {
      title: '根因分析报告',
      subtitle: metricName,
      metricName,
      generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      detectLabel: detectType === 'rule' ? '预警规则命中' : '异常检测模型',
      value,
      mom,
      summary: `本次分析旨在定位导致「${metricName}」指标异常的根本原因。Top 10 关键特征重合度为 ${dayOverlap}/10。`,
      overview: { metric: metricName, causalChain },
      chartDay: dayTop.map(f => ({ label: f.name.slice(0, 6) + '…', value: parseFloat(f.shapDay) })),
      chartMonth: monthTop.map(f => ({ label: f.name.slice(0, 6) + '…', value: parseFloat(f.shapMonth) }))
    };
  };

  window.buildTreeAnomalyReport = function (root, treeName) {
    if (typeof window.isTrafficFlowTreeReport === 'function'
      && typeof window.buildTrafficFlowTreeReport === 'function'
      && window.isTrafficFlowTreeReport(root, treeName)) {
      return window.buildTrafficFlowTreeReport(root, treeName);
    }
    const alerts = typeof window.collectTreeAlertMetrics === 'function'
      ? window.collectTreeAlertMetrics(root)
      : [];
    const name = treeName || '指标树';
    const branches = alerts.slice(0, 5).map(a => ({
      metric: a.name,
      value: a.value,
      mom: a.mom,
      tags: []
    }));
    if (!branches.length) {
      branches.push({ metric: '核心指标', value: '—', mom: '—', tags: [] });
    }
    const report = window.buildStructuredAnomalyReport({
      metricName: name,
      branches,
      detectType: 'rule',
      value: alerts.length ? `${alerts.length} 项异动` : '—',
      mom: alerts[0]?.mom || '—'
    });
    report.title = '根因分析报告';
    report.subtitle = name;
    return report;
  };

  /** 兼容旧调用 */
  window.renderAnomalyReportHtml = function () {
    return '<p class="muted">报告已升级为独立模板页展示</p>';
  };

  window.openAnomalyReportModal = function (report) {
    try {
      sessionStorage.setItem('rcaReportPayload', JSON.stringify(report || {}));
      const back = location.pathname.split('/').pop() + (location.search || '');
      sessionStorage.setItem('rcaReportBackUrl', back || 'indicator-tree-detail.html');
    } catch (e) { /* ignore */ }

    const metric = report?.subtitle || report?.metricName
      || window.currentMetricNode?.name || '';
    const params = new URLSearchParams();
    if (metric) params.set('metric', metric);
    const generatedAt = report?.generatedAt
      || new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    params.set('generatedAt', generatedAt);
    if (report?.template) params.set('tpl', report.template);

    location.href = 'rca-report-view.html?' + params.toString();
  };
})();
