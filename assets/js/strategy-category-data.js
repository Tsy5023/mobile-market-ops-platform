/** 策略分类 · 演示数据（客群 / 工单 / 预警） */
(function () {
  const STATUS_MAP = {
    draft: { label: '草稿', cls: 'badge-secondary' },
    pending: { label: '待启用', cls: 'badge-warning' },
    running: { label: '执行中', cls: 'badge-success' },
    paused: { label: '已暂停', cls: 'badge-info' },
    stopped: { label: '已结束', cls: 'badge-secondary' }
  };

  const STRATEGIES = [
    /* ===== 客群类 ===== */
    {
      id: 'ST-SEG-001',
      category: 'segment',
      name: '中高端离网挽留专项',
      subType: '离网维系',
      status: 'running',
      owner: '省公司存量部',
      updatedAt: '2026-05-20',
      summary: '针对离网风险客群开展外呼+短信组合触达，主推专属续约优惠包。',
      segment: '离网风险客群',
      scaleLabel: '4,280 人',
      product: '专属续约优惠包',
      channel: '外呼 + 短信',
      cities: '南昌, 赣州, 上饶',
      period: '2026-05-01 ~ 2026-06-30',
      goal: '降低离网率 1.2pp，续约转化率 ≥ 18%',
      rules: ['客群标签：离网评分 ≥ 75', '排除近 30 天已触达用户', 'ARPU ≥ 88 元'],
      steps: ['圈选目标客群', '配置触达话术与优惠', '联动调度派发外呼任务', '跟踪转化与复盘']
    },
    {
      id: 'ST-SEG-002',
      category: 'segment',
      name: '降档拦截融合升级',
      subType: '降档防控',
      status: 'pending',
      owner: '南昌分公司',
      updatedAt: '2026-05-18',
      summary: '识别降档倾向高价值客户，通过融合升档礼包与厅店协同拦截降档。',
      segment: '降档倾向高价值客群',
      scaleLabel: '12,840 人',
      product: '融合升档礼包',
      channel: 'APP + 厅店',
      cities: '全省',
      period: '2026-05-15 ~ 2026-07-15',
      goal: '降档拦截率 ≥ 65%',
      rules: ['近 3 月账单波动异常', '主套餐档位 ≥ 88 元', '未办理融合业务'],
      steps: ['客群圈选与分层', '配置升档权益包', 'APP 弹窗 + 厅店话术', '效果评估']
    },
    {
      id: 'ST-SEG-003',
      category: 'segment',
      name: '视频大流量定向包推荐',
      subType: '加包增收',
      status: 'running',
      owner: '流量运营室',
      updatedAt: '2026-05-19',
      summary: '面向视频高耗流量但未办定向包用户，推送视频权益包提升 ARPU。',
      segment: '视频大流量未办定向包',
      scaleLabel: '18,200 人',
      product: '视频定向流量包',
      channel: '中国移动 APP',
      cities: '全省',
      period: '2026-04-01 ~ 2026-06-30',
      goal: '定向包办理率 ≥ 12%',
      rules: ['月视频流量占比 ≥ 45%', '未订购视频定向包', '5G 终端用户优先'],
      steps: ['标签圈客', 'APP 场景化推荐', '短信二次提醒', '转化跟踪']
    },
    {
      id: 'ST-SEG-004',
      category: 'segment',
      name: '合约到期续约提醒',
      subType: '合约运营',
      status: 'draft',
      owner: '九江分公司',
      updatedAt: '2026-05-12',
      summary: '合约到期前 60 天分层触达，引导续约或升档。',
      segment: '合约到期 60 天内',
      scaleLabel: '2,150 人',
      product: '合约续约补贴',
      channel: '外呼',
      cities: '九江, 宜春',
      period: '2026-06-01 ~ 2026-08-31',
      goal: '续约率 ≥ 70%',
      rules: ['合约剩余天数 ≤ 60', '排除已续约用户'],
      steps: ['到期清单导入', '外呼脚本配置', '派发执行', '续约闭环']
    },
    /* ===== 工单类 ===== */
    {
      id: 'ST-WO-001',
      category: 'workorder',
      name: '网格上门挽留工单策略',
      subType: '离网挽留',
      status: 'running',
      owner: '省公司市场部',
      updatedAt: '2026-05-21',
      summary: '对接调度中心，将高离网风险客户封装为网格待办工单，下派至指定网格经理上门执行挽留。',
      dispatchLink: 'dispatch-assign.html?tab=strategy',
      taskTemplate: '网格上门挽留任务',
      executeTarget: '网格经理 / 微格长',
      executeMode: '线下网格执行',
      sla: '24 小时内首次触达',
      volume: 860,
      cities: '南昌, 赣州',
      period: '2026-05-01 ~ 2026-06-30',
      workflow: [
        { step: '策略配置', desc: '定义触发条件、工单字段与执行要求' },
        { step: '封装调度任务', desc: '调用调度中心 API，生成待执行工单批次' },
        { step: '下派执行对象', desc: '按地市/网格归属自动分配至网格经理' },
        { step: '线下执行回单', desc: '网格上门触达并回传执行结果' },
        { step: '闭环复核', desc: '调度中心汇总回单，策略侧跟踪转化' }
      ],
      config: {
        trigger: '离网评分 ≥ 80 且近 7 日未触达',
        workorderType: '营销挽留工单',
        priority: '高',
        requiredFields: ['客户姓名', '联系电话', '挽留话术', '推荐产品', '最晚完成时间']
      },
      recentOrders: [
        { id: 'WO-202605-1201', grid: '南昌·红谷滩微格 03', assignee: '王网格', status: '待执行', due: '2026-05-23' },
        { id: 'WO-202605-1202', grid: '赣州·章贡微格 07', assignee: '李网格', status: '执行中', due: '2026-05-22' },
        { id: 'WO-202605-1198', grid: '南昌·东湖微格 01', assignee: '张网格', status: '已完成', due: '2026-05-21' }
      ]
    },
    {
      id: 'ST-WO-002',
      category: 'workorder',
      name: '厅店账单异议核查工单',
      subType: '服务修复',
      status: 'running',
      owner: '省公司客服部',
      updatedAt: '2026-05-19',
      summary: '基于服务敏感客群策略，自动生成厅店核查工单，由指定厅店经理线下核实账单并关怀回访。',
      dispatchLink: 'dispatch-assign.html?tab=strategy',
      taskTemplate: '厅店账单核查任务',
      executeTarget: '厅店经理 / 值班店长',
      executeMode: '厅店线下执行',
      sla: '48 小时内完成核查',
      volume: 420,
      cities: '南昌, 景德镇',
      period: '2026-04-20 ~ 2026-05-31',
      workflow: [
        { step: '策略命中', desc: '账单异议标签命中后自动触发' },
        { step: '工单生成', desc: '调度中心创建厅店待办' },
        { step: '厅店下派', desc: '按号码归属厅店分配执行人' },
        { step: '线下核查', desc: '厅店核实账单并现场解释' },
        { step: '回单归档', desc: '上传核查结论与客户反馈' }
      ],
      config: {
        trigger: '近 30 日投诉账单类 ≥ 1 次',
        workorderType: '服务核查工单',
        priority: '中',
        requiredFields: ['异议账单月份', '核查结论', '客户满意度', '是否降档风险']
      },
      recentOrders: [
        { id: 'WO-202605-0988', grid: '景德镇·珠山厅店', assignee: '陈店长', status: '执行中', due: '2026-05-24' },
        { id: 'WO-202605-0985', grid: '南昌·八一厅店', assignee: '刘经理', status: '已完成', due: '2026-05-20' }
      ]
    },
    {
      id: 'ST-WO-003',
      category: 'workorder',
      name: '农村微格融合推广工单',
      subType: '融合拓展',
      status: 'pending',
      owner: '上饶分公司',
      updatedAt: '2026-05-15',
      summary: '将农村融合商机客群封装为微格推广工单，下派至指定微格团队开展入户营销。',
      dispatchLink: 'dispatch-assign.html',
      taskTemplate: '微格融合入户任务',
      executeTarget: '农村微格团队',
      executeMode: '线下网格执行',
      sla: '72 小时内首次入户',
      volume: 1250,
      cities: '上饶, 抚州',
      period: '2026-06-01 ~ 2026-08-31',
      workflow: [
        { step: '圈选农村融合潜客', desc: '基于宽带覆盖与终端标签' },
        { step: '批量生成工单', desc: '调度中心按微格拆分任务包' },
        { step: '微格认领', desc: '微格长确认并分配队员' },
        { step: '入户营销', desc: '线下讲解融合套餐' },
        { step: '办理回单', desc: '录入办理结果与失败原因' }
      ],
      config: {
        trigger: '农村区域 + 未融合 + 宽带潜客',
        workorderType: '融合推广工单',
        priority: '中',
        requiredFields: ['入户时间', '推荐套餐', '办理结果', '下次跟进时间']
      },
      recentOrders: []
    },
    /* ===== 预警类 ===== */
    {
      id: 'ST-AL-001',
      category: 'alert',
      name: '套外费用异常根因应对策略',
      subType: '指标改善',
      status: 'running',
      owner: '流量运营室',
      updatedAt: '2026-05-21',
      summary: '基于套外收入占比指标溯源，定位高套外依赖客群根因，输出定向加包策略改善指标。',
      linkedIndicator: '套外收入占比',
      indicatorPath: '收入类 > 套外收入 > 套外收入占比',
      alertLevel: '橙色预警',
      rootCause: '部分大流量用户未办理定向/加油包，导致套外计费占比偏高；赣州、上饶地市尤为突出。',
      analysisSource: '指标溯源 + 根因分析引擎',
      targetImprovement: '套外收入占比下降 0.8pp（30 日内）',
      cities: '赣州, 上饶, 全省',
      period: '2026-05-10 ~ 2026-06-30',
      actions: [
        { title: '精准圈选套外高依赖客群', desc: '套外费用 / 账单 > 15% 且未办加油包' },
        { title: '推送流量加油包策略', desc: 'APP + 短信组合推荐 10/20GB 加油包' },
        { title: '高价值用户外呼干预', desc: 'ARPU ≥ 100 元用户优先外呼解释与办理' },
        { title: '效果回写指标树', desc: '每日回写套外占比变化，验证根因是否消除' }
      ],
      metrics: [
        { name: '套外收入占比', before: '12.6%', target: '11.8%', current: '12.1%' },
        { name: '加油包办理率', before: '8.2%', target: '14%', current: '10.5%' },
        { name: '涉及用户数', before: '—', target: '—', current: '9,560 人' }
      ]
    },
    {
      id: 'ST-AL-002',
      category: 'alert',
      name: '5G 渗透率滞后改善策略',
      subType: '结构优化',
      status: 'running',
      owner: '省公司市场部',
      updatedAt: '2026-05-18',
      summary: '5G 渗透率连续两月低于目标，根因分析指向 4G 终端存量与套餐未升档，输出终端换机+升档组合策略。',
      linkedIndicator: '5G 渗透率',
      indicatorPath: '用户类 > 5G 发展 > 5G 渗透率',
      alertLevel: '黄色预警',
      rootCause: '4G 终端占比仍达 38%；部分 5G 套餐未有效激活；九江、宜春升档营销不足。',
      analysisSource: '指标预警 + 多维下钻',
      targetImprovement: '5G 渗透率提升 2pp（60 日内）',
      cities: '九江, 宜春, 全省',
      period: '2026-05-01 ~ 2026-07-31',
      actions: [
        { title: '4G 终端换机潜客圈选', desc: '机龄 > 24 月且流量高消耗' },
        { title: '5G 升档权益包推送', desc: '厅店 + APP 双渠道升档激励' },
        { title: '终端合约捆绑', desc: '联合终端公司推出换机补贴' },
        { title: '周度指标复盘', desc: '按地市跟踪渗透率改善进度' }
      ],
      metrics: [
        { name: '5G 渗透率', before: '58.2%', target: '60.2%', current: '59.1%' },
        { name: '5G 套餐升档率', before: '6.1%', target: '9%', current: '7.4%' },
        { name: '换机办理量', before: '—', target: '—', current: '3,280 台' }
      ]
    },
    {
      id: 'ST-AL-003',
      category: 'alert',
      name: '离网率突增根因应对策略',
      subType: '风险防控',
      status: 'pending',
      owner: '存量运营室',
      updatedAt: '2026-05-16',
      summary: '南昌离网率突增触发红色预警，根因定位为竞品携转促销；输出专项挽留与竞品对标策略。',
      linkedIndicator: '离网率',
      indicatorPath: '保有类 > 离网管控 > 离网率',
      alertLevel: '红色预警',
      rootCause: '竞品在南昌开展高额携转补贴；中高端客户咨询携转量上升 42%。',
      analysisSource: '指标溯源 + 竞品情报 + 客服话务分析',
      targetImprovement: '离网率回落至 3.8% 以下',
      cities: '南昌',
      period: '2026-05-15 ~ 2026-06-15',
      actions: [
        { title: '携转咨询用户即时拦截', desc: '10086 话务触发实时挽留脚本' },
        { title: '竞品对标优惠包', desc: '针对高价值用户提供专项续约礼包' },
        { title: '网格上门攻坚', desc: '联动工单策略下发网格挽留任务' },
        { title: '日度离网监测', desc: '离网率超阈值自动升级预警' }
      ],
      metrics: [
        { name: '离网率', before: '4.5%', target: '3.8%', current: '4.1%' },
        { name: '携转拦截成功率', before: '—', target: '55%', current: '48%' },
        { name: '专项触达量', before: '—', target: '—', current: '1,240 人' }
      ]
    }
  ];

  const TAB_META = {
    segment: {
      label: '客群类策略',
      icon: 'fa-users',
      desc: '面向特定客群的精准营销策略；含江西省营销策略列表、创建派发与效果跟踪闭环。'
    },
    workorder: {
      label: '工单类策略',
      icon: 'fa-clipboard-list',
      desc: '支持对接调度中心，基于策略配置封装调度中心任务，生成待执行的工单，将工单下派给指定执行对象，通过线下网格进行策略执行。'
    },
    alert: {
      label: '预警类策略',
      icon: 'fa-triangle-exclamation',
      desc: '支持基于指标溯源与根因分析智能生成预警类策略，精准定位短板问题，输出针对性策略，实现针对指标根因分析的策略应对，助力运营指标提升改善。'
    }
  };

  window.StrategyCategoryData = {
    STATUS_MAP,
    TAB_META,
    getAll() {
      return STRATEGIES.slice();
    },
    getByCategory(cat) {
      return STRATEGIES.filter(s => s.category === cat);
    },
    getById(id) {
      return STRATEGIES.find(s => s.id === id) || null;
    }
  };
})();
