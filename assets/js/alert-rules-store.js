/** 预警规则存储（演示） */
(function () {
  const KEY = 'jxAlertRules';
  const SCHEMA_VERSION = 6;
  const PROVINCE = '江西省';

  const SEED = [
    {
      id: 'ALR-JX-001',
      name: '高额停机超过6个月客户',
      description: '识别高额欠费停机超过6个月的中高端客户，触发后推送地市看管人核查。',
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDate: '2026-01-01',
      effectiveDateStart: '2026-01-01',
      effectiveDateEnd: '2026-12-31',
      notifySms: true,
      notifyEmail: false,
      notifySiteMsg: true,
      notifyTemplates: {
        sms: {
          title: '【指标预警】{预警规则名称}',
          content: '【市场运营】{预警时间}触发预警：规则「{预警规则名称}」命中异常。指标「{预警指标}」（{监控范围}）当前值 {异常值}{指标单位}，条件：{计算规则}。请及时登录平台处理。'
        },
        email: {
          title: '【指标预警】{预警规则名称} · {预警指标}',
          content: '尊敬的用户，您好：\n\n于 {预警时间}，预警规则「{预警规则名称}」触发告警。\n\n规则说明：{预警规则描述}\n预警指标：{预警指标}\n监控范围：{监控范围}\n指标单位：{指标单位}\n异常数值：{异常值}\n触发条件：{计算规则}\n\n请登录移动市场运营平台查看详情并处理。'
        },
        site: {
          title: '指标预警：{预警指标}',
          content: '【预警通知】{预警时间}\n规则：{预警规则名称}\n指标：{预警指标} · {监控范围}\n异常：{异常值}{指标单位}（{计算规则}）\n请点击消息中心查看详情并跟进处理。'
        }
      },
      recipients: ['u-001', 'u-006'],
      recipientNames: ['张明', '赵磊'],
      recipientDetails: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-006', name: '赵磊', meta: '南昌市分公司 · 市场部 · 地市运营主管' }
      ],
      status: 'enabled',
      conditions: [
        {
          metricId: 'kpi-churn-001',
          metricName: '离网预警客户数',
          metricCode: 'KPI_CUS_CHURN_001',
          level: '地市级',
          cityIds: ['nc', 'gz'],
          cityNames: ['南昌市', '赣州市'],
          operator: '高于',
          threshold: '5000'
        }
      ],
      metricId: 'kpi-churn-001',
      metricName: '离网预警客户数',
      metricCode: 'KPI_CUS_CHURN_001',
      createdAt: '2026-04-10 10:20:00',
      updatedAt: '2026-05-20 14:35:00',
      creator: '张明',
      approvalStatus: 'approved'
    },
    {
      id: 'ALR-JX-002',
      name: '套外收入环比波动预警',
      description: '套外收入绝对值低于预期阈值时告警。',
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDate: '2026-03-01',
      effectiveDateStart: '2026-03-01',
      effectiveDateEnd: '2026-12-31',
      notifySms: true,
      notifyEmail: true,
      recipients: ['u-001', 'u-004'],
      recipientNames: ['张明', '刘伟'],
      recipientDetails: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-004', name: '刘伟', meta: '江西省公司 · 流量运营中心 · 流量运营分析' }
      ],
      status: 'enabled',
      conditions: [
        {
          metricId: 'kpi-fl-rev-003',
          metricName: '套外收入',
          metricCode: 'KPI_FL_REV_003',
          level: '省级',
          province: PROVINCE,
          operator: '低于',
          threshold: '1200万'
        }
      ],
      metricId: 'kpi-fl-rev-003',
      metricName: '套外收入',
      metricCode: 'KPI_FL_REV_003',
      createdAt: '2026-03-15 09:00:00',
      updatedAt: '2026-05-18 11:22:00',
      creator: '张明',
      approvalStatus: 'approved'
    },
    {
      id: 'ALR-JX-003',
      name: '中高端离网率阈值监控',
      description: '离网率处于异常区间外时触发预警复核。',
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDate: '2026-02-01',
      effectiveDateStart: '2026-02-01',
      effectiveDateEnd: '2026-12-31',
      notifySms: false,
      notifyEmail: true,
      recipients: ['u-007'],
      recipientNames: ['孙丽'],
      recipientDetails: [
        { id: 'u-007', name: '孙丽', meta: '赣州市分公司 · 存量运营部 · 存量运营' }
      ],
      status: 'disabled',
      conditions: [
        {
          metricId: 'kpi-he-003',
          metricName: '中高端客户离网率',
          metricCode: 'KPI_HE_003',
          level: '区县级',
          cityId: 'gz',
          cityName: '赣州市',
          countyId: 'zg',
          countyName: '章贡区',
          operator: '在区间外',
          thresholdMin: '0.5%',
          thresholdMax: '2.5%'
        }
      ],
      metricId: 'kpi-he-003',
      metricName: '中高端客户离网率',
      metricCode: 'KPI_HE_003',
      createdAt: '2026-02-20 16:40:00',
      updatedAt: '2026-04-02 09:15:00',
      creator: '孙悦',
      approvalStatus: 'approved'
    },
    {
      id: 'ALR-JX-004',
      name: '流量饱和度超限预警',
      description: '流量饱和度超过100%触发预警，推送升档营销任务。',
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDate: '2026-04-01',
      effectiveDateStart: '2026-04-01',
      effectiveDateEnd: '2026-12-31',
      notifySms: true,
      notifyEmail: true,
      recipients: ['u-001', 'u-011', 'u-009'],
      recipientNames: ['张明', '黄强', '吴敏'],
      status: 'enabled',
      conditions: [
        {
          metricId: 'tf-sat',
          metricName: '流量饱和度',
          metricCode: 'KPI_FL_SAT_001',
          level: '地市级',
          cityIds: ['jj', 'sr'],
          cityNames: ['九江市', '上饶市'],
          operator: '高于',
          threshold: '100%'
        }
      ],
      metricId: 'tf-sat',
      metricName: '流量饱和度',
      metricCode: 'KPI_FL_SAT_001',
      createdAt: '2026-05-22 11:10:00',
      updatedAt: '2026-05-22 11:10:00',
      creator: '张明',
      approvalStatus: 'approved'
    },
    {
      id: 'ALR-JX-005',
      name: '5G登网率连续下滑预警',
      description: '5G登网率处于合理区间内视为正常，区间外触发预警。',
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDate: '2026-05-28',
      effectiveDateStart: '2026-05-28',
      effectiveDateEnd: '2026-12-31',
      notifySms: true,
      notifyEmail: false,
      recipients: ['u-011'],
      recipientNames: ['黄强'],
      status: 'disabled',
      conditions: [
        {
          metricId: 'tf-5g-rate',
          metricName: '5G登网率',
          metricCode: 'KPI_5G_RATE_001',
          level: '省级',
          province: PROVINCE,
          operator: '在区间内',
          thresholdMin: '85%',
          thresholdMax: '98%'
        }
      ],
      metricId: 'tf-5g-rate',
      metricName: '5G登网率',
      metricCode: 'KPI_5G_RATE_001',
      createdAt: '2026-05-28 15:30:00',
      updatedAt: '2026-05-28 15:30:00',
      creator: '王磊',
      approvalStatus: 'pending_approval',
      submittedAt: '2026-05-28 15:30:00'
    },
    {
      id: 'ALR-JX-006',
      name: '离网风险客群规模突增预警',
      description: '离网风险客群规模增幅超过8%时触发预警复核。',
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDate: '2026-05-29',
      effectiveDateStart: '2026-05-29',
      effectiveDateEnd: '2026-12-31',
      notifySms: false,
      notifyEmail: true,
      recipients: ['u-008', 'u-007'],
      recipientNames: ['周涛', '孙丽'],
      status: 'disabled',
      conditions: [
        {
          metricId: 'he-churn-risk',
          metricName: '离网风险客群规模',
          metricCode: 'KPI_HE_RISK_001',
          level: '区县级',
          cityId: 'nc',
          cityName: '南昌市',
          countyId: 'dh',
          countyName: '东湖区',
          operator: '高于',
          threshold: '8%'
        }
      ],
      metricId: 'he-churn-risk',
      metricName: '离网风险客群规模',
      metricCode: 'KPI_HE_RISK_001',
      createdAt: '2026-05-29 09:15:00',
      updatedAt: '2026-05-29 09:15:00',
      creator: '李娜',
      approvalStatus: 'pending_approval',
      submittedAt: '2026-05-29 09:15:00'
    }
  ];

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem(KEY + '_version', String(SCHEMA_VERSION));
    } catch (e) { /* ignore */ }
  }

  function ensureSeed() {
    const version = Number(localStorage.getItem(KEY + '_version') || 0);
    if (!read() || version < SCHEMA_VERSION) {
      write(SEED);
    }
  }

  ensureSeed();

  function nextId() {
    return 'ALR-JX-' + Date.now().toString(36).toUpperCase();
  }

  function nowStr() {
    return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  window.AlertRulesStore = {
    getAll() {
      return read() || SEED;
    },
    getById(id) {
      return this.getAll().find(r => r.id === id) || null;
    },
    save(record) {
      const list = this.getAll();
      const i = list.findIndex(r => r.id === record.id);
      record.updatedAt = nowStr();
      if (i >= 0) list[i] = record;
      else {
        record.createdAt = record.createdAt || nowStr();
        list.unshift(record);
      }
      write(list);
      return record;
    },
    create(payload) {
      const primary = payload.conditions?.[0];
      return this.save({
        id: nextId(),
        status: 'enabled',
        createdAt: nowStr(),
        updatedAt: nowStr(),
        metricName: primary?.metricName || payload.metricName || '—',
        metricCode: primary?.metricCode || '',
        metricId: primary?.metricId || payload.metricId,
        ...payload
      });
    },
    toggleStatus(id) {
      const r = this.getById(id);
      if (!r) return null;
      r.status = r.status === 'enabled' ? 'disabled' : 'enabled';
      return this.save(r);
    },
    levelClass(level) {
      if (/红/.test(level)) return 'alert-level-red';
      if (/橙/.test(level)) return 'alert-level-orange';
      return 'alert-level-yellow';
    }
  };
})();
