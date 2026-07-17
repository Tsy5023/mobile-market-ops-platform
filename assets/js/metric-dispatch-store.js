/**
 * 指标调度：父任务（调度任务）+ 子任务（派发给具体执行人）
 * 任务分类 · 业务主管看整体与子任务进度
 * 调度派发 · 执行人处理子任务（认领 / 转派 / 协同）
 */
(function () {
  const KEY = 'jxMetricDispatchRecords';
  const SCHEMA_VER = 'jxMetricDispatchSchemaV6';
  let _memoryList = null;

  window.MetricDispatchCurrentUser = {
    id: 'u-zhangming',
    name: '张明',
    org: '省公司运营部',
    role: '业务主管',
    dept: '省公司运营部'
  };

  const CITY_CUSTODIANS = {
    nc: { id: 'u1', name: '王磊', org: '南昌分公司', dept: '市场经营部', role: '地市看管人', phone: '138****1201' },
    jj: { id: 'u3', name: '陈敏', org: '九江分公司', dept: '存量运营部', role: '地市看管人', phone: '139****3302' },
    gz: { id: 'u4', name: '刘洋', org: '赣州分公司', dept: '市场经营部', role: '地市看管人', phone: '137****8803' },
    sr: { id: 'u5', name: '赵静', org: '上饶分公司', dept: '渠道运营部', role: '地市看管人', phone: '136****5604' },
    yc: { id: 'u6', name: '周强', org: '宜春分公司', dept: '市场经营部', role: '地市看管人', phone: '135****9905' },
    jdz: { name: '吴芳', org: '景德镇分公司', dept: '客户服务部', role: '地市看管人' },
    px: { name: '郑浩', org: '萍乡分公司', dept: '市场经营部', role: '地市看管人' },
    xy: { name: '孙丽', org: '新余分公司', dept: '存量运营部', role: '地市看管人' },
    yt: { name: '马超', org: '鹰潭分公司', dept: '市场经营部', role: '地市看管人' },
    ja: { name: '胡军', org: '吉安分公司', dept: '渠道运营部', role: '地市看管人' },
    fz: { name: '林娜', org: '抚州分公司', dept: '市场经营部', role: '地市看管人' }
  };

  const STAFF_POOL = [
    { id: 'u1', name: '王磊', org: '南昌分公司', role: '网格经理', dept: '东湖网格' },
    { id: 'u2', name: '李芳', org: '南昌分公司', role: '营业厅店长', dept: '西湖营业厅' },
    { id: 'u3', name: '陈敏', org: '九江分公司', role: '网格经理', dept: '浔阳网格' },
    { id: 'u4', name: '刘洋', org: '赣州分公司', role: '网格经理', dept: '章贡网格' },
    { id: 'u5', name: '赵静', org: '上饶分公司', role: '客户经理', dept: '信州网格' },
    { id: 'u6', name: '周强', org: '宜春分公司', role: '网格经理', dept: '袁州网格' }
  ];

  const DEPT_SUPERVISOR_POOL = [
    { id: 'ds1', name: '李娜', org: '客户运营中心', role: '业务主管', dept: '客户运营中心', phone: '138****2201' },
    { id: 'ds2', name: '周凯', org: '客户运营中心', role: '运营主管', dept: '客户运营中心', phone: '139****2202' },
    { id: 'ds3', name: '孙悦', org: '客户运营中心', role: '存量运营主管', dept: '客户运营中心', phone: '137****2203' },
    { id: 'ds4', name: '马超', org: '市场部', role: '业务主管', dept: '市场部', phone: '136****3301' },
    { id: 'ds5', name: '胡婷', org: '市场部', role: '渠道主管', dept: '市场部', phone: '135****3302' }
  ];

  const DEPT_STAFF_POOL = [
    { id: 'ds1-1', name: '吴倩', org: '客户运营中心', role: '运营专员', dept: '客户运营中心' },
    { id: 'ds1-2', name: '郑浩', org: '客户运营中心', role: '数据分析', dept: '客户运营中心' },
    { id: 'ds2', name: '周凯', org: '客户运营中心', role: '运营主管', dept: '客户运营中心' },
    { id: 'ds3', name: '孙悦', org: '客户运营中心', role: '存量运营主管', dept: '客户运营中心' },
    { id: 'ds4-1', name: '钱丽', org: '市场部', role: '活动策划', dept: '市场部' }
  ];

  /** 地市下钻维度（区县） */
  const CITY_COUNTIES = {
    nc: [
      { id: 'nc-dh', name: '东湖区' }, { id: 'nc-xh', name: '西湖区' }, { id: 'nc-qsh', name: '青山湖区' }
    ],
    gz: [
      { id: 'gz-zg', name: '章贡区' }, { id: 'gz-ng', name: '南康区' }, { id: 'gz-gx', name: '赣县区' }
    ],
    jj: [
      { id: 'jj-xs', name: '浔阳区' }, { id: 'jj-ls', name: '濂溪区' }, { id: 'jj-xy', name: '修水县' }
    ]
  };

  const STATUS_LABELS = {
    pending_claim: '待认领',
    executing: '执行中',
    collaborating: '协同中',
    transferred: '已转派',
    completed: '已完成',
    pending: '待启动',
    running: '进行中',
    completed_parent: '已完成'
  };

  function nowStr() {
    return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  function nextParentId() {
    return 'MDP-JX-' + Date.now().toString(36).toUpperCase();
  }

  function nextSubId(parentId, seq) {
    return parentId + '-ST' + String(seq).padStart(2, '0');
  }

  function makeSubTask(parentId, seq, opts) {
    return {
      id: nextSubId(parentId, seq),
      parentId,
      scopeType: opts.scopeType,
      scopeId: opts.scopeId,
      scopeLabel: opts.scopeLabel,
      assignee: {
        userId: opts.assignee.userId || opts.assignee.id,
        name: opts.assignee.name,
        org: opts.assignee.org,
        role: opts.assignee.role,
        dept: opts.assignee.dept || opts.assignee.org
      },
      status: 'pending_claim',
      claimedBy: null,
      claimedAt: null,
      collaborators: [],
      collabNote: '',
      transferLog: [],
      parentSubTaskId: opts.parentSubTaskId || null,
      remark: opts.remark || '',
      metricSnapshot: opts.metricSnapshot || null
    };
  }

  function buildSubTasksForCreate(record) {
    const subs = [];
    let seq = 1;
    if (record.dispatchMode === 'dept') {
      const list = record.deptAssignees || [];
      list.forEach(a => {
        subs.push(makeSubTask(record.id, seq++, {
          scopeType: 'dept',
          scopeId: a.dept || a.org,
          scopeLabel: a.dept || a.org,
          assignee: a,
          remark: record.remark,
          metricSnapshot: {
            metricValue: record.metricValue,
            targetValue: record.metricTarget || record.metricValue,
            mom: record.metricMom || '+0.0%',
            alert: true
          }
        }));
      });
    } else if (record.dispatchMode === 'segment') {
      const regions = record.regions || [];
      const assignees = record.assignees || [];
      const isCityLevel = record.segmentLevel === 'city'
        || (!record.segmentLevel && regions.some(r => r.cityId && !r.countyId));
      regions.forEach(r => {
        const a = isCityLevel
          ? (assignees.find(x => x.cityId === r.cityId) || {})
          : (assignees.find(x => x.countyId === r.countyId) || {});
        subs.push(makeSubTask(record.id, seq++, {
          scopeType: isCityLevel ? 'city' : 'county',
          scopeId: isCityLevel ? r.cityId : r.countyId,
          scopeLabel: isCityLevel ? r.cityName : r.countyName,
          assignee: {
            userId: a.userId || a.id || a.name,
            name: a.name || '—',
            org: a.org || (isCityLevel ? '地市分公司' : '赣州市分公司'),
            role: a.role || (isCityLevel ? '地市负责人' : '区县运营'),
            dept: a.dept || a.org || '—'
          },
          remark: (isCityLevel ? r.cityRemark : r.countyRemark) || record.remark,
          metricSnapshot: {
            segmentName: record.segmentName,
            segmentScale: r.scaleLabel,
            proportion: r.proportion
          }
        }));
      });
    } else {
      const regions = record.regions || [];
      const assignees = record.assignees || [];
      regions.forEach(r => {
        const a = assignees.find(x => x.cityId === r.cityId) || {};
        const cust = CITY_CUSTODIANS[r.cityId] || {};
        subs.push(makeSubTask(record.id, seq++, {
          scopeType: 'city',
          scopeId: r.cityId,
          scopeLabel: r.cityName,
          assignee: {
            userId: cust.id || a.name,
            name: a.name || cust.name,
            org: a.org || cust.org,
            role: a.role || cust.role,
            dept: a.org || cust.org
          },
          remark: r.cityRemark || record.remark,
          metricSnapshot: {
            metricValue: r.metricValue,
            targetValue: r.targetValue || record.metricTarget || record.metricValue,
            mom: r.mom,
            yoy: r.yoy,
            alert: r.alert
          }
        }));
      });
    }
    return subs;
  }

  function migrateLegacy(record) {
    if (record.subTasks && record.subTasks.length) return record;
    record.subTasks = buildSubTasksForCreate(record);
    if (record.dispatchMode === 'dept' && record.deptAssignees) {
      record.deptAssignees.forEach((a, i) => {
        const st = record.subTasks[i];
        if (!st) return;
        if (a.status === 'claimed') { st.status = 'executing'; st.claimedBy = a.claimedBy; }
        else if (a.status === 'collaborating') { st.status = 'collaborating'; st.collaborators = a.collaborators || []; }
        else if (a.status === 'redispatched') st.status = 'transferred';
      });
    }
    return record;
  }

  function allSubTasks(record) {
    return record.subTasks || [];
  }

  function rootSubTasks(record) {
    return allSubTasks(record).filter(s => !s.parentSubTaskId);
  }

  function aggregateParentStatus(record) {
    const subs = allSubTasks(record);
    if (!subs.length) return record.status || 'pending';
    if (subs.every(s => s.status === 'completed')) return 'completed';
    if (subs.every(s => s.status === 'pending_claim')) return 'pending';
    return 'running';
  }

  function calcProgress(record) {
    const subs = allSubTasks(record);
    const total = subs.length || 1;
    const done = subs.filter(s => s.status === 'completed').length;
    const executing = subs.filter(s => ['executing', 'collaborating', 'transferred'].includes(s.status)).length;
    const pending = subs.filter(s => s.status === 'pending_claim').length;
    const pct = Math.round((done / total) * 100);
    return { total, done, executing, pending, pct };
  }

  const SEED = [
    {
      id: 'MDP-JX-2026-001',
      dispatchMode: 'city',
      metricId: 'tf-0',
      metricName: '当月上网流量增幅',
      treeId: 'tree-traffic-flow',
      treeName: '流量运营指标树',
      metricValue: '+8.2%',
      metricTarget: '+10.0%',
      metricMom: '-1.4%',
      regions: [
        { cityId: 'nc', cityName: '南昌市', metricValue: '+5.1%', targetValue: '+8.6%', mom: '-2.8%', alert: true },
        { cityId: 'gz', cityName: '赣州市', metricValue: '+6.4%', targetValue: '+8.6%', mom: '-3.2%', alert: true },
        { cityId: 'jj', cityName: '九江市', metricValue: '+7.2%', targetValue: '+8.6%', mom: '-1.6%', alert: true }
      ],
      assignees: [
        { cityId: 'nc', cityName: '南昌市', name: '王磊', org: '南昌分公司', role: '地市看管人' },
        { cityId: 'gz', cityName: '赣州市', name: '刘洋', org: '赣州分公司', role: '地市看管人' },
        { cityId: 'jj', cityName: '九江市', name: '陈敏', org: '九江分公司', role: '地市看管人' }
      ],
      dispatchedAt: '2026-07-08 09:30',
      remark: '流量异动地市专项核查，请三地市限期反馈',
      drillPath: '江西省',
      createdBy: '张明',
      createdByOrg: '省公司运营部',
      subTasks: []
    },
    {
      id: 'MDP-JX-2026-DEPT-002',
      dispatchMode: 'dept',
      metricId: 'he-churn-1',
      metricName: '中高端客户流失率',
      treeId: 'tree-he-churn',
      treeName: '中高端客户流失指标树',
      metricValue: '2.8%',
      metricTarget: '2.5%',
      metricMom: '+0.3%',
      dispatchedAt: '2026-05-29 14:20',
      remark: '请客户运营中心协同分析流失根因并制定保有方案',
      drillPath: '江西省 · 跨部门',
      createdBy: '张明',
      createdByOrg: '省公司运营部',
      deptAssignees: [
        { id: 'ds1', userId: 'ds1', name: '李娜', org: '客户运营中心', role: '业务主管', dept: '客户运营中心' },
        { id: 'ds3', userId: 'ds3', name: '孙悦', org: '客户运营中心', role: '存量运营主管', dept: '客户运营中心' }
      ],
      subTasks: []
    },
    {
      id: 'MDP-JX-2026-003',
      dispatchMode: 'dept',
      metricId: 'tf-value',
      metricName: '套餐升档成功率',
      treeId: 'tree-traffic-flow',
      treeName: '流量运营指标树',
      metricValue: '68.5%',
      metricTarget: '72.0%',
      metricMom: '-2.1%',
      dispatchedAt: '2026-07-10 11:00',
      remark: '市场部牵头制定升档专项营销方案',
      createdBy: '张明',
      createdByOrg: '省公司运营部',
      deptAssignees: [
        { id: 'ds4', userId: 'ds4', name: '马超', org: '市场部', role: '业务主管', dept: '市场部' }
      ],
      subTasks: []
    },
    {
      id: 'MDP-JX-2026-004',
      dispatchMode: 'city',
      metricId: 'tf-16',
      metricName: '沉默用户唤醒率',
      treeId: 'tree-traffic-flow',
      treeName: '流量运营指标树',
      metricValue: '12.3%',
      metricTarget: '15.0%',
      metricMom: '-2.8%',
      regions: [
        { cityId: 'nc', cityName: '南昌市', metricValue: '10.1%', targetValue: '12.0%', mom: '-4.2%', alert: true },
        { cityId: 'sr', cityName: '上饶市', metricValue: '11.8%', targetValue: '12.0%', mom: '-3.1%', alert: true }
      ],
      assignees: [
        { cityId: 'nc', cityName: '南昌市', name: '王磊', org: '南昌分公司', role: '地市看管人' },
        { cityId: 'sr', cityName: '上饶市', name: '赵静', org: '上饶分公司', role: '地市看管人' }
      ],
      dispatchedAt: '2026-05-26 16:45',
      remark: '沉默用户专项唤醒，南昌/上饶重点跟进',
      createdBy: '张明',
      createdByOrg: '省公司运营部',
      subTasks: []
    },
    {
      id: 'MDP-JX-2026-005',
      dispatchMode: 'city',
      metricId: 'kpi-arpu',
      metricName: '出账 ARPU 环比',
      treeId: 'tree-traffic-flow',
      treeName: '流量运营指标树',
      metricValue: '-1.2%',
      metricTarget: '+0.5%',
      metricMom: '-1.2%',
      regions: [{ cityId: 'gz', cityName: '赣州市', metricValue: '-2.1%', targetValue: '+0.5%', mom: '-3.5%', alert: true }],
      assignees: [{ cityId: 'gz', cityName: '赣州市', name: '刘洋', org: '赣州分公司', role: '地市看管人' }],
      dispatchedAt: '2026-05-30 08:15',
      remark: '赣州 ARPU 下滑专项复盘',
      createdBy: '张明',
      subTasks: []
    },
    {
      id: 'MDP-JX-2026-SEG-001',
      dispatchMode: 'segment',
      segmentLevel: 'county',
      workOrderType: '客群调度工单',
      workOrderTitle: '离网风险客群 · 赣州专项触达',
      workOrderDueAt: '2026-06-05',
      segmentName: '离网风险客群',
      metricId: 'he-seg-1',
      metricName: '离网风险客群规模',
      treeId: 'tree-he-churn',
      treeName: '中高端客户流失指标树',
      scaleLabel: '2,860 人',
      regions: [
        { countyId: 'zg', countyName: '章贡区', cityId: 'gz', cityName: '赣州市', scaleLabel: '1,120 人', proportion: '39.2%' },
        { countyId: 'nk', countyName: '南康区', cityId: 'gz', cityName: '赣州市', scaleLabel: '980 人', proportion: '34.3%' }
      ],
      assignees: [
        { countyId: 'zg', countyName: '章贡区', cityId: 'gz', cityName: '赣州市', name: '刘洋', org: '赣州分公司', role: '区县负责人', userId: 'u4' },
        { countyId: 'nk', countyName: '南康区', cityId: 'gz', cityName: '赣州市', name: '郑浩', org: '赣州分公司', role: '区县负责人', userId: 'u-staff-gz' }
      ],
      dispatchedAt: '2026-05-25 10:20',
      remark: '赣州离网风险客群专项保有，请区县限期反馈触达进度',
      drillPath: '江西省 › 赣州市',
      createdBy: '张明',
      createdByOrg: '省公司运营部',
      subTasks: []
    },
    {
      id: 'MDP-JX-2026-SEG-002',
      dispatchMode: 'segment',
      segmentLevel: 'city',
      workOrderType: '客群调度工单',
      workOrderTitle: '流量异动客群 · 省级地市协同',
      workOrderDueAt: '2026-06-10',
      segmentName: '流量异动客群',
      metricId: 'tf-16',
      metricName: '沉默用户唤醒率',
      treeId: 'tree-traffic-flow',
      treeName: '流量运营指标树',
      scaleLabel: '8,640 人',
      regions: [
        { cityId: 'nc', cityName: '南昌市', scaleLabel: '1,555 人', proportion: '18.0%' },
        { cityId: 'gz', cityName: '赣州市', scaleLabel: '1,382 人', proportion: '16.0%' },
        { cityId: 'sr', cityName: '上饶市', scaleLabel: '950 人', proportion: '11.0%' }
      ],
      assignees: [
        { cityId: 'nc', cityName: '南昌市', name: '王磊', org: '南昌分公司', role: '地市负责人', userId: 'u1' },
        { cityId: 'gz', cityName: '赣州市', name: '刘洋', org: '赣州分公司', role: '地市负责人', userId: 'u4' },
        { cityId: 'sr', cityName: '上饶市', name: '赵静', org: '上饶分公司', role: '地市负责人', userId: 'u5' }
      ],
      dispatchedAt: '2026-05-28 14:30',
      remark: '流量异动关联客群省级调度，请地市限期反馈触达方案',
      drillPath: '江西省',
      createdBy: '张明',
      createdByOrg: '省公司运营部',
      subTasks: []
    }
  ];

  function applySeedSubTaskStates() {
    SEED.forEach(r => {
      r.subTasks = buildSubTasksForCreate(r);
      if (r.id === 'MDP-JX-2026-001') {
        r.subTasks[0].status = 'executing';
        r.subTasks[0].claimedBy = '王磊';
        r.subTasks[0].claimedAt = '2026-05-28 10:20';
        r.subTasks[1].status = 'pending_claim';
        r.subTasks[2].status = 'completed';
        r.subTasks[2].claimedBy = '陈敏';
        r.subTasks[2].completedAt = '2026-05-29 17:00';
      }
      if (r.id === 'MDP-JX-2026-DEPT-002') {
        r.subTasks[0].status = 'pending_claim';
        r.subTasks[1].status = 'collaborating';
        r.subTasks[1].claimedBy = '孙悦';
        r.subTasks[1].collaborators = [{ name: '吴倩', joinedAt: '2026-05-29 15:00' }];
        r.subTasks.forEach(st => {
          if (st.metricSnapshot) st.metricSnapshot.mom = st.metricSnapshot.mom || '+0.3%';
        });
      }
      if (r.id === 'MDP-JX-2026-003') {
        r.subTasks[0].status = 'executing';
        r.subTasks[0].claimedBy = '马超';
        r.subTasks.forEach(st => {
          if (st.metricSnapshot) st.metricSnapshot.mom = st.metricSnapshot.mom || '-2.1%';
        });
      }
      if (r.id === 'MDP-JX-2026-004') {
        r.subTasks[0].status = 'transferred';
        r.subTasks[0].claimedBy = '王磊';
        r.subTasks[0].transferLog = [{ at: '2026-05-27 09:00', by: '王磊', targets: ['南昌市 · 东湖区 → 王磊'] }];
        const child = makeSubTask(r.id, 99, {
          scopeType: 'county',
          scopeId: 'nc-dh',
          scopeLabel: '南昌市 · 东湖区',
          assignee: { userId: 'u1-nc-dh', name: '王磊', org: '南昌分公司', role: '区县执行人', dept: '南昌分公司' },
          parentSubTaskId: r.subTasks[0].id,
          status: 'executing',
          claimedBy: '王磊',
          metricSnapshot: r.subTasks[0].metricSnapshot
        });
        child.status = 'executing';
        child.claimedBy = '王磊';
        r.subTasks.push(child);
        r.subTasks[1].status = 'pending_claim';
      }
      if (r.id === 'MDP-JX-2026-005') {
        r.subTasks[0].status = 'pending_claim';
      }
      if (r.id === 'MDP-JX-2026-SEG-001') {
        r.subTasks[0].status = 'executing';
        r.subTasks[0].claimedBy = '刘洋';
        r.subTasks[1].status = 'pending_claim';
      }
      if (r.id === 'MDP-JX-2026-SEG-002') {
        r.subTasks[0].status = 'executing';
        r.subTasks[0].claimedBy = '王磊';
        r.subTasks[1].status = 'pending_claim';
        r.subTasks[2].status = 'pending_claim';
      }
      r.status = aggregateParentStatus(r);
    });
  }

  applySeedSubTaskStates();

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function cloneSeed() {
    return JSON.parse(JSON.stringify(SEED));
  }

  function isValidList(list) {
    return Array.isArray(list) && list.length > 0
      && list.every(r => r.subTasks && r.subTasks.length > 0);
  }

  function loadWorkingList() {
    if (isValidList(_memoryList)) return _memoryList;
    let list = null;
    let schemaOk = false;
    try {
      schemaOk = localStorage.getItem('jxMetricDispatchSchemaV3') === SCHEMA_VER;
    } catch (e) { /* ignore */ }
    if (schemaOk) {
      try {
        const raw = read();
        if (Array.isArray(raw) && raw.length) {
          list = raw.map(r => migrateLegacy(JSON.parse(JSON.stringify(r))));
        }
      } catch (e) { /* ignore */ }
    }
    if (!isValidList(list)) {
      list = cloneSeed();
    }
    _memoryList = list;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem('jxMetricDispatchSchemaV3', SCHEMA_VER);
    } catch (e) { /* ignore */ }
    return _memoryList;
  }

  function write(list) {
    _memoryList = list;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem('jxMetricDispatchSchemaV3', SCHEMA_VER);
    } catch (e) { /* ignore */ }
  }

  loadWorkingList();

  function normalize(record) {
    const r = migrateLegacy({ ...record });
    r.status = aggregateParentStatus(r);
    return r;
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function isAssignee(sub, me) {
    return sub.assignee?.name === me.name || sub.assignee?.userId === me.id;
  }

  window.MetricDispatchStore = {
    STATUS_LABELS,

    getCityCustodian(cityId, metricNode) {
      if (metricNode?.defaultCustodian) return metricNode.defaultCustodian;
      return CITY_CUSTODIANS[cityId] || null;
    },
    getStaffPool() { return STAFF_POOL.slice(); },
    getDeptSupervisorPool() { return DEPT_SUPERVISOR_POOL.slice(); },
    getDeptStaffByDept(dept) { return DEPT_STAFF_POOL.filter(u => u.dept === dept); },
    getCityCounties(cityId) { return (CITY_COUNTIES[cityId] || []).slice(); },
    getCurrentUser() { return { ...window.MetricDispatchCurrentUser }; },

    getAll() {
      return loadWorkingList().map(normalize);
    },
    getById(id) {
      const r = this.getAll().find(d => d.id === id);
      return r ? normalize({ ...r }) : null;
    },
    getSubTaskById(subTaskId) {
      for (const p of this.getAll()) {
        const st = (p.subTasks || []).find(s => s.id === subTaskId);
        if (st) return { parent: p, subTask: { ...st } };
      }
      return null;
    },
    save(record) {
      const list = loadWorkingList().map(r => migrateLegacy(JSON.parse(JSON.stringify(r))));
      const norm = normalize({ ...record });
      const i = list.findIndex(d => d.id === norm.id);
      if (i >= 0) list[i] = norm;
      else list.unshift(norm);
      write(list);
      return norm;
    },
    create(payload) {
      const user = this.getCurrentUser();
      const record = normalize({
        id: nextParentId(),
        status: 'pending',
        dispatchedAt: nowStr(),
        createdBy: user.name,
        createdByOrg: user.org,
        dispatchMode: 'city',
        subTasks: [],
        ...payload
      });
      record.subTasks = buildSubTasksForCreate(record);
      record.status = aggregateParentStatus(record);
      return this.save(record);
    },

    /** 任务分类 · 全部父任务（演示：不按账号过滤） */
    getParentTasksForSupervisor() {
      return this.getAll();
    },

    getParentProgress(parent) {
      return calcProgress(parent);
    },

    /** 调度派发 · 全部子任务（演示：不按账号过滤） */
    getSubTasksForAssignee() {
      return this.getAllSubTaskRows();
    },

    getAllSubTaskRows() {
      const rows = [];
      this.getAll().forEach(parent => {
        (parent.subTasks || []).forEach(st => {
          rows.push({ parent, subTask: st });
        });
      });
      return rows;
    },

    /** 演示环境重置为内置样例数据 */
    resetDemoData() {
      _memoryList = cloneSeed();
      write(_memoryList);
      return this.getAll();
    },

    formatAssigneeLabel(assignee) {
      if (!assignee) return '—';
      const name = assignee.name || '—';
      const dept = assignee.dept || assignee.org || '';
      return dept ? name + '（' + dept + '）' : name;
    },

    /** 主管催办（演示） */
    urgeParentTask(parentId) {
      const p = this.getById(parentId);
      if (!p) return null;
      p.lastUrgedAt = nowStr();
      p.urgeCount = (p.urgeCount || 0) + 1;
      return this.save(p);
    },

    claimSubTask(subTaskId) {
      const found = this.getSubTaskById(subTaskId);
      if (!found) return null;
      const { parent, subTask } = found;
      const me = this.getCurrentUser();
      if (subTask.status !== 'pending_claim') return null;
      subTask.status = 'executing';
      subTask.claimedBy = me.name;
      subTask.claimedAt = nowStr();
      const list = parent.subTasks.map(s => s.id === subTaskId ? subTask : s);
      return this.save({ ...parent, subTasks: list });
    },

    collaborateSubTask(subTaskId, memberNames, note) {
      const found = this.getSubTaskById(subTaskId);
      if (!found) return null;
      const { parent, subTask } = found;
      if (parent.dispatchMode !== 'dept') return null;
      if (!['executing', 'collaborating'].includes(subTask.status)) return null;
      const me = this.getCurrentUser();
      const dept = subTask.assignee.dept;
      subTask.status = 'collaborating';
      subTask.collabNote = note || '';
      subTask.collaborators = (memberNames || []).map(name => ({
        name,
        dept,
        joinedAt: nowStr()
      }));
      const list = parent.subTasks.map(s => s.id === subTaskId ? subTask : s);
      return this.save({ ...parent, subTasks: list });
    },

    transferSubTask(subTaskId, targets) {
      const found = this.getSubTaskById(subTaskId);
      if (!found) return null;
      const { parent, subTask } = found;
      const me = this.getCurrentUser();
      if (!['executing', 'collaborating', 'pending_claim'].includes(subTask.status)) return null;

      let newSubs = [];
      const seqBase = (parent.subTasks || []).length + 1;

      if (parent.dispatchMode === 'dept') {
        const dept = subTask.assignee.dept;
        targets.forEach((t, i) => {
          newSubs.push(makeSubTask(parent.id, seqBase + i, {
            scopeType: 'dept',
            scopeId: dept,
            scopeLabel: dept + ' · ' + (t.role || ''),
            assignee: t,
            parentSubTaskId: subTask.id,
            remark: '由 ' + me.name + ' 转派'
          }));
        });
      } else {
        const cityId = subTask.scopeId;
        const counties = targets.length ? targets : this.getCityCounties(cityId);
        counties.forEach((c, i) => {
          const staff = STAFF_POOL.find(u => u.org === subTask.assignee.org) || STAFF_POOL[0];
          newSubs.push(makeSubTask(parent.id, seqBase + i, {
            scopeType: 'county',
            scopeId: c.id,
            scopeLabel: subTask.scopeLabel + ' · ' + c.name,
            assignee: {
              userId: staff.id + '-' + c.id,
              name: staff.name,
              org: staff.org,
              role: '区县执行人',
              dept: staff.org
            },
            parentSubTaskId: subTask.id,
            remark: '由 ' + me.name + ' 下钻转派至区县',
            metricSnapshot: subTask.metricSnapshot
          }));
        });
      }

      subTask.status = 'transferred';
      subTask.transferLog = subTask.transferLog || [];
      subTask.transferLog.push({
        at: nowStr(),
        by: me.name,
        targets: newSubs.map(n => n.scopeLabel + ' → ' + n.assignee.name)
      });

      const updated = parent.subTasks.map(s => (s.id === subTask.id ? subTask : s));
      return this.save({ ...parent, subTasks: [...updated, ...newSubs] });
    },

    completeSubTask(subTaskId) {
      const found = this.getSubTaskById(subTaskId);
      if (!found) return null;
      const { parent, subTask } = found;
      subTask.status = 'completed';
      subTask.completedAt = nowStr();
      const list = parent.subTasks.map(s => s.id === subTaskId ? subTask : s);
      return this.save({ ...parent, subTasks: list });
    },

    getMetricTreeUrl(record) {
      const treeId = record.treeId || 'tree-traffic-flow';
      const metricId = record.metricId || '';
      return 'indicator-tree-detail.html?id=' + encodeURIComponent(treeId)
        + (metricId ? '&metricId=' + encodeURIComponent(metricId) : '');
    },

    dispatchModeLabel(mode) {
      return mode === 'dept' ? '跨部门调度' : '跨地市调度';
    },

    dispatchTypeLabel(mode) {
      if (mode === 'segment') return '客群调度';
      if (mode === 'strategy') return '策略调度';
      return '指标调度';
    }
  };
})();
