/** 演示统一场景：中高端客户流失 */
(function () {
  window.DEMO_SCENARIO = {
    sceneShort: '中高端客户流失',
    sceneFull: '公众市场 / 存量运营 / 中高端客户流失',
    treeId: 'tree-he-churn',
    treeCode: '202605220001',
    treeName: '中高端客户流失指标树',
    categoryKey: 'stock',
    categoryLabel: '存量运营',
    domain: '存量运营',
    metricCount: 42,
    updatedAt: '2026-05-22 09:00'
  };

  /** 算法使用场景（与指标配置一致） */
  window.ALGORITHM_SCENE_OPTIONS = [
    { value: 'traffic_rca', label: '流量运营根因分析' },
    { value: 'loss_control_rca', label: '控损运营根因分析' }
  ];

  window.getAlgorithmSceneLabel = function (value) {
    const opt = (window.ALGORITHM_SCENE_OPTIONS || []).find(o => o.value === value);
    return opt ? opt.label : (value ? String(value) : '—');
  };

  window.formatAlgorithmSceneHtml = function (value) {
    const label = window.getAlgorithmSceneLabel(value);
    if (!value || label === '—') return '<span class="ic-algo-empty">—</span>';
    return `<span class="ic-algo-tag">${String(label).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
  };

  window.isHeChurnTreeNode = function (node) {
    if (!node) return false;
    const id = String(node.id || '');
    return id.startsWith('hcd-') || id === 'n-he-root' || id.startsWith('n-he-');
  };

  window.resolveInsightTreeId = function (id) {
    const t = (window.INDICATOR_TREES || []).find(x => x.id === id);
    if (t && (t.id === 'tree-traffic-flow' || t.categoryKey === 'traffic' || t.configCode === '202605280001')) {
      return window.TRAFFIC_FLOW_INSIGHT_ID || 'tree-traffic-flow';
    }
    if (t && (t.id === 'tree-he-churn' || t.name === '中高端客户流失指标树' || t.configCode === '202605220001')) {
      return window.HE_CHURN_INSIGHT_ID || 'tree-he-churn';
    }
    return id || window.DEMO_SCENARIO?.treeId || 'tree-he-churn';
  };

  window.getHeChurnMetricMetaByName = function (name) {
    return (window.HE_CHURN_METRICS || []).find(m => m.name === name) || null;
  };

  window.resolveHeChurnSegmentIds = function (node) {
    if (!node || typeof window.isHeChurnTreeNode !== 'function' || !window.isHeChurnTreeNode(node)) return null;
    const mapped = window.METRIC_SEGMENT_MAP?.[node.id];
    if (mapped?.length) return mapped;
    const id = node.id || '';
    const n = node.name || '';
    if (id.startsWith('hcd-s2') || /离网|携转|预警|沉默/.test(n)) return ['seg-churn-risk', 'seg-high-downgrade'];
    if (id.startsWith('hcd-s3') || /降档|异议|活跃|厅店|接触|办理量/.test(n)) return ['seg-high-downgrade', 'seg-low-touch'];
    if (id.startsWith('hcd-s4') || /维系|外呼|续约|权益|触达/.test(n)) return ['seg-contract-end', 'seg-churn-risk'];
    if (id.startsWith('hcd-s5') || /ARPU|收入|损失|回升/.test(n)) return ['seg-high-downgrade', 'seg-churn-risk'];
    if (id.startsWith('hcd-s1') || /规模|全球通|合约|融合|银卡|金卡/.test(n)) return ['seg-high-downgrade', 'seg-contract-end'];
    return ['seg-high-downgrade', 'seg-churn-risk'];
  };

  window.getHeChurnMetricDetailCopy = function (node) {
    const name = node?.name || '指标';
    if (/离网|预警/.test(name)) {
      return '该指标反映中高端客户流失风险，建议结合离网高危预警、携转查询等客群制定挽留策略。';
    }
    if (/降档|ARPU|损失/.test(name)) {
      return '该指标与价值流失密切相关，建议关注降档预警客群并推送续约或升档方案。';
    }
    if (/接触|活跃|厅店|异议|办理/.test(name)) {
      return '该指标体现客户行为异动，建议对低接触、账单异议客群加强触达与体验修复。';
    }
    if (/维系|外呼|续约|权益/.test(name)) {
      return '该指标衡量挽留动作成效，可下钻查看合约到期敏感客群并优化外呼策略。';
    }
    return '该指标属于中高端客户流失监测体系，可结合趋势、根因与客群分析制定运营动作。';
  };

  window.isHeChurnMetricName = function (name) {
    const n = String(name || '');
    return /流失|离网|降档|携转|ARPU|续约|维系|预警|沉默|降档|外呼|合约|全球通|融合捆绑|行为异动|收入损失/.test(n);
  };

  /** 指标配置页 — 指标库演示行 */
  window.DEMO_METRIC_LIBRARY = [
    { code: 'KPI_HCD_001', name: '中高端客户流失规模', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-01-08 10:20:00', updatedAt: '2026-05-20 14:35:00', caliberBiz: '统计周期内发生流失（含离网、携转出网）的中高端客户数', caliberTech: 'COUNT(DISTINCT msisdn) FROM dm_he_churn_m WHERE churn_flag = 1', desc: '中高端客户流失规模核心监控指标，支撑控损运营根因分析。' },
    { code: 'KPI_HCD_002', name: '中高端客户规模', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-01-08 10:25:00', updatedAt: '2026-05-19 11:10:00', caliberBiz: 'ARPU≥89元或全球通银卡及以上客户数', caliberTech: 'COUNT(DISTINCT msisdn) FROM dm_he_base_m', desc: '中高端客户规模基础指标。' },
    { code: 'KPI_HCD_008', name: '离网预警客户数', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-02-12 09:15:00', updatedAt: '2026-05-18 16:42:00', caliberBiz: '模型识别7日内高离网概率客户数', caliberTech: 'COUNT(*) FROM dm_churn_risk_m WHERE risk_score >= 80', desc: '离网预警模型输出客群规模。' },
    { code: 'KPI_HCD_009', name: '中高端离网率', period: '月', format: 'percent', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-02-12 09:20:00', updatedAt: '2026-05-21 09:30:00', caliberBiz: '当月离网客户数/月初中高端客户数×100%', caliberTech: 'churn_cnt / he_base_cnt * 100', desc: '中高端离网率衍生指标。' },
    { code: 'KPI_HCD_015', name: '降档预警客户数', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-03-05 14:00:00', updatedAt: '2026-05-17 10:05:00', caliberBiz: '近30日有降档倾向或比价行为客户数', caliberTech: 'COUNT(*) FROM dm_downgrade_risk_m', desc: '降档防控场景预警指标。' },
    { code: 'KPI_HCD_017', name: '套餐降档办理量', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-04-18 11:30:00', updatedAt: '2026-05-22 08:50:00', caliberBiz: '当月办理降档业务笔数', caliberTech: 'COUNT(order_id) FROM dm_downgrade_ord_m', desc: '套餐降档办理量统计指标。' },
    { code: 'KPI_HCD_020', name: '账单异议工单量', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-04-20 15:40:00', updatedAt: '2026-05-16 13:22:00', caliberBiz: '当月账单相关投诉工单量', caliberTech: 'COUNT(ticket_id) FROM dm_complaint_m WHERE type = \'账单异议\'', desc: '服务修复场景关联指标。' },
    { code: 'KPI_HCD_031', name: '中高端客户ARPU', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-01-15 09:00:00', updatedAt: '2026-05-19 14:18:00', caliberBiz: '中高端客户月均出账收入，剔除政企专线', caliberTech: 'SUM(arpu_amt)/COUNT(msisdn)', desc: '中高端客户价值衡量指标。' },
    { code: 'KPI_HCD_035', name: '流失带来月收入损失', period: '月', format: 'numeric', algorithmScenes: ['loss_control_rca'], status: 'disabled', warehouseTime: '2025-11-20 10:00:00', updatedAt: '2026-03-01 09:00:00', caliberBiz: '离网客户预估月收入损失合计', caliberTech: 'SUM(loss_amt) FROM dm_churn_loss_m', desc: '已停用，由新口径指标替代。' },
    { code: 'KPI_HCD_026', name: '维系成功率', period: '月', format: 'percent', algorithmScenes: ['loss_control_rca'], status: 'published', warehouseTime: '2026-03-22 16:10:00', updatedAt: '2026-05-15 17:30:00', caliberBiz: '成功挽留客户数/离网预警客户数×100%', caliberTech: 'retain_cnt / risk_cnt * 100', desc: '离网维系成效评估指标。' }
  ];

  window.DEMO_METRIC_APPROVAL = [
    { code: 'KPI_HCD_017', name: '套餐降档办理量', caliber: '当月办理降档业务笔数，含主动降档与活动到期降档', direction: '负向', period: '月', unit: '笔', source: '经分系统', change: '新增发布', user: '李敏', time: '2026-05-21 16:20' },
    { code: 'KPI_HCD_012', name: '携转查询客户数', caliber: '近30日携号转网查询客户数', direction: '负向', period: '月', unit: '户', source: 'IOP', change: '新增发布', user: '王芳', time: '2026-05-20 11:05' },
    { code: 'KPI_HCD_031', name: '中高端客户ARPU', caliber: '中高端客户月均出账收入', direction: '正向', period: '月', unit: '元/户', source: '经分系统', change: '口径变更', user: '陈磊', time: '2026-05-19 14:18' },
    { code: 'KPI_HCD_016', name: '沉默流失风险客户数', caliber: '90天低接触且消费下滑客户数', direction: '负向', period: '月', unit: '户', source: 'IOP', change: '数据源变更', user: '刘洋', time: '2026-05-18 09:42' },
    { code: 'KPI_HCD_028', name: '专属优惠挽回成功率', caliber: '专属优惠方案挽回成功占比', direction: '正向', period: '月', unit: '%', source: 'IOP', change: '新增发布', user: '赵敏', time: '2026-05-17 10:30' }
  ];

  const SCENE = window.DEMO_SCENARIO.sceneFull;

  window.DEMO_METRIC_EDIT_SAMPLES = {
    KPI_HCD_001: {
      name: '中高端客户流失规模', code: 'KPI_HCD_001',
      period: '月', format: 'numeric',
      algorithmScenes: ['loss_control_rca'],
      caliberBiz: '统计周期内发生流失（含离网、携转出网）的中高端客户数',
      caliberTech: 'COUNT(DISTINCT msisdn) FROM dm_he_churn_m WHERE churn_flag = 1',
      desc: '中高端客户流失规模核心监控指标，支撑控损运营根因分析。',
      warehouseTime: '2026-01-08 10:20:00',
      updatedAt: '2026-05-20 14:35:00'
    },
    KPI_HCD_009: {
      name: '中高端离网率', code: 'KPI_HCD_009',
      period: '月', format: 'percent',
      algorithmScenes: ['loss_control_rca'],
      caliberBiz: '当月离网客户数/月初中高端客户数×100%',
      caliberTech: 'churn_cnt / he_base_cnt * 100',
      desc: '中高端离网率衍生指标。',
      warehouseTime: '2026-02-12 09:20:00',
      updatedAt: '2026-05-21 09:30:00'
    },
    KPI_HCD_031: {
      name: '中高端客户ARPU', code: 'KPI_HCD_031',
      period: '月', format: 'numeric',
      algorithmScenes: ['loss_control_rca'],
      caliberBiz: '中高端客户月均出账收入，剔除政企专线',
      caliberTech: 'SUM(arpu_amt)/COUNT(msisdn)',
      desc: '中高端客户价值衡量指标。',
      warehouseTime: '2026-01-15 09:00:00',
      updatedAt: '2026-05-19 14:18:00'
    }
  };

  window.DEMO_APPROVE_DETAIL = {
    KPI_HCD_017: { caliber: '当月办理降档业务笔数', direction: '负向', domain: '存量运营', period: '月', unit: '笔', source: '经分系统' },
    KPI_HCD_012: { caliber: '近30日携号转网查询客户数', direction: '负向', domain: '存量运营', period: '月', unit: '户', source: 'IOP' },
    KPI_HCD_031: { caliber: '中高端客户月均出账收入', direction: '正向', domain: '存量运营', period: '月', unit: '元/户', source: '经分系统' },
    KPI_HCD_016: { caliber: '90天低接触且消费下滑客户数', direction: '负向', domain: '存量运营', period: '月', unit: '户', source: 'IOP' },
    KPI_HCD_028: { caliber: '专属优惠方案挽回成功占比', direction: '正向', domain: '存量运营', period: '月', unit: '%', source: 'IOP' }
  };

  /** 根因分析 — 中高端客户流失场景归因模板 */
  window.getHeChurnRootCauseBranches = function (metricName) {
    const n = metricName || '';
    if (/离网|流失风险|预警/.test(n)) {
      return [
        { metric: '携转查询客户数', value: '1.86万', contrib: 38, mom: '+8.4%', tags: ['近30日携转查询', '异网接触', '离网倾向', '合约临近到期', '账单异议'], rules: [{ label: '组合A', expr: '离网倾向 AND 近30日携转查询' }, { label: '组合B', expr: '合约临近到期 OR 账单异议' }], segments: [{ rule: '组合A', name: '离网风险客群', scale: '4,280' }, { rule: '组合B', name: '合约到期敏感客群', scale: '2,150' }] },
        { metric: '降档预警客户数', value: '2.15万', contrib: 32, mom: '+6.3%', tags: ['套餐降档倾向', '比价换套餐', 'ARPU连续下滑', '中高端降档预警'], rules: [{ label: '组合A', expr: '套餐降档倾向 AND 比价换套餐' }], segments: [{ rule: '组合A', name: '降档倾向高价值客群', scale: '12,840' }] },
        { metric: '账单异议工单量', value: '1,256', contrib: 22, mom: '+14.6%', tags: ['账单异议', '服务不满', '投诉历史', '欠费预警'], rules: [{ label: '组合A', expr: '账单异议 AND 服务不满' }], segments: [{ rule: '组合A', name: '服务敏感客群', scale: '1,850' }] }
      ];
    }
    if (/降档|ARPU|收入损失/.test(n)) {
      return [
        { metric: '套餐降档办理量', value: '8,420', contrib: 40, mom: '+11.2%', tags: ['套餐降档倾向', '活动到期降档', '比价换套餐', '中高端降档预警'], rules: [{ label: '组合A', expr: '中高端降档预警 AND 套餐降档倾向' }, { label: '组合B', expr: '活动到期降档 OR 比价换套餐' }], segments: [{ rule: '组合A', name: '降档倾向高价值客群', scale: '12,840' }, { rule: '组合B', name: '活动到期降档客群', scale: '3,240' }] },
        { metric: '中高端离网率', value: '0.82%', contrib: 28, mom: '+0.05pp', tags: ['离网倾向', '近30日携转查询', '沉默用户'], rules: [{ label: '组合A', expr: '离网倾向 AND 近30日携转查询' }], segments: [{ rule: '组合A', name: '离网风险客群', scale: '4,280' }] },
        { metric: '融合捆绑渗透率', value: '76.4%', contrib: 18, mom: '+1.1pp', tags: ['未办融合', '家庭宽带未捆绑', '合约临近到期'], rules: [{ label: '组合A', expr: '未办融合 AND 家庭宽带未捆绑' }], segments: [{ rule: '组合A', name: '家庭融合拓展客群', scale: '8,620' }] }
      ];
    }
    if (/接触|活跃|沉默|厅店|APP/.test(n)) {
      return [
        { metric: '90天零厅店接触占比', value: '9.8%', contrib: 36, mom: '+1.2pp', tags: ['低接触客群', '渠道流失风险', 'APP活跃低', '自助渠道偏好'], rules: [{ label: '组合A', expr: '低接触客群 AND 渠道流失风险' }, { label: '组合B', expr: 'APP活跃低 OR 自助渠道偏好' }], segments: [{ rule: '组合A', name: '低接触流失风险客群', scale: '3,620' }, { rule: '组合B', name: '线上偏好客群', scale: '2,940' }] },
        { metric: '外呼触达率', value: '68.5%', contrib: 30, mom: '+2.8pp', tags: ['外呼未接通', '维系任务未完成', '专属权益未领取'], rules: [{ label: '组合A', expr: '外呼未接通 AND 维系任务未完成' }], segments: [{ rule: '组合A', name: '触达不足预警客群', scale: '1,420' }] },
        { metric: '维系成功率', value: '34.2%', contrib: 20, mom: '+1.4pp', tags: ['合约续约失败', '专属优惠未触达'], rules: [{ label: '组合A', expr: '合约临近到期 AND 专属优惠未触达' }], segments: [{ rule: '组合A', name: '合约到期敏感客群', scale: '4,260' }] }
      ];
    }
    return [
      { metric: '离网预警客户数', value: '4.28万', contrib: 35, mom: '+5.2%', tags: ['中高端降档预警', '离网倾向', '近30日携转查询', '合约临近到期'], rules: [{ label: '组合A', expr: '中高端降档预警 AND 离网倾向' }, { label: '组合B', expr: '近30日携转查询 OR 合约临近到期' }], segments: [{ rule: '组合A', name: '中高端降档预警客群', scale: '12,840' }, { rule: '组合B', name: '离网风险客群', scale: '4,280' }] },
      { metric: '降档预警客户数', value: '2.15万', contrib: 33, mom: '+6.3%', tags: ['套餐降档倾向', '比价换套餐', 'ARPU连续下滑'], rules: [{ label: '组合A', expr: '套餐降档倾向 AND ARPU连续下滑' }], segments: [{ rule: '组合A', name: '降档倾向高价值客群', scale: '12,840' }] },
      { metric: '沉默流失风险客户数', value: '3.62万', contrib: 24, mom: '+4.1%', tags: ['低接触客群', '渠道流失风险', '沉默用户'], rules: [{ label: '组合A', expr: '低接触客群 OR 渠道流失风险' }], segments: [{ rule: '组合A', name: '低接触流失风险客群', scale: '3,620' }] }
    ];
  };

  window.buildHeChurnAnomalyReport = function (metricName, detectType, branches) {
    const topMetrics = branches.slice(0, 2).map(b => b.metric).join('、');
    const summary = `「${metricName}」在<strong>中高端客户流失</strong>场景下出现异常，主要与 ${topMetrics} 等指标联动走弱，建议结合降档预警、离网风险与低接触客群标签组合施策。`;
    const points = detectType === 'rule'
      ? [
          '预警规则连续 2 个周期命中，与流失风险监测分支指标同向恶化。',
          '降档办理、携转查询、账单异议等行为异动信号同步抬升。',
          '建议优先对高贡献归因路径下发维系任务，并联动客群分析 Tab 查看画像。'
        ]
      : [
          '异常检测模型评分超过阈值，流失规模子项指标贡献度居前。',
          '多路径归因显示标签组合可解释主要波动，需分路径制定挽留方案。',
          '建议对模型高置信区间先行外呼触达并推送专属续约优惠。'
        ];
    return { title: '中高端客户流失 · 异常原因分析', summary, points, generatedAt: '2026-05-22 09:30' };
  };

  window.fillHeChurnAlertPanel = function (node) {
    if (typeof renderMetricAlertPanel === 'function') renderMetricAlertPanel(node);
  };

  function statusBadge(status) {
    const map = {
      published: '<span class="badge badge-success">已发布</span>',
      pending: '<span class="badge badge-warning">待审批</span>',
      draft: '<span class="badge badge-info">草稿</span>',
      disabled: '<span class="badge" style="background:#f1f5f9;color:#64748b">已停用</span>'
    };
    return map[status] || map.published;
  }

  function directionBadge(dir) {
    return dir === '负向'
      ? '<span class="badge badge-danger">负向</span>'
      : '<span class="badge badge-success">正向</span>';
  }

  window.renderDemoMetricLibraryTable = function () {
    if (typeof window.renderMetricLibraryTable === 'function') {
      window.renderMetricLibraryTable();
    }
  };

  window.renderDemoApprovalTable = function () {
    const tbody = document.querySelector('.approval-table tbody');
    if (!tbody || !window.DEMO_METRIC_APPROVAL) return;
    tbody.innerHTML = DEMO_METRIC_APPROVAL.map(row => `
      <tr>
        <td><input type="checkbox"/></td>
        <td>${row.code}</td>
        <td><strong>${row.name}</strong></td>
        <td class="cell-ellipsis" title="${row.caliber}">${row.caliber.slice(0, 20)}…</td>
        <td>${directionBadge(row.direction)}</td>
        <td>${DEMO_SCENARIO.domain}</td>
        <td>${row.period}</td>
        <td>${row.unit}</td>
        <td>${row.source}</td>
        <td><span class="badge badge-info">${row.change}</span></td>
        <td>${row.user}</td>
        <td>${row.time}</td>
        <td><span class="badge badge-warning">待审批</span></td>
        <td class="cell-actions">
          <button class="btn btn-primary" style="padding:4px 10px;font-size:12px" onclick="openApproveModal('${row.code}','${row.name}','${row.change}')">审批</button>
          <button class="btn btn-outline" style="padding:4px 10px;font-size:12px">驳回</button>
        </td>
      </tr>`).join('');
  };

  window.fillHeChurnDimensionPanel = function (node) {
    const tbody = document.querySelector('#modal-metric-detail [data-tab="dimension"] tbody');
    if (!tbody) return;
    const val = node?.value || '—';
    tbody.innerHTML = `
      <tr><td>南昌市</td><td>${val}</td><td>32%</td><td><span class="badge badge-danger">-3.2%</span></td></tr>
      <tr><td>九江市</td><td>385万</td><td>28%</td><td><span class="badge badge-success">+1.1%</span></td></tr>
      <tr><td>赣州市</td><td>312万</td><td>23%</td><td><span class="badge badge-warning">-0.8%</span></td></tr>
      <tr><td>全球通金卡</td><td>28.6%</td><td>18%</td><td><span class="badge badge-danger">-1.5pp</span></td></tr>
      <tr><td>合约到期客户</td><td>2.15万</td><td>12%</td><td><span class="badge badge-danger">+6.3%</span></td></tr>`;
  };
})();
