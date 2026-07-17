/** 预警记录存储（基于预警规则每日触发结果，演示） */
(function () {
  const KEY = 'jxAlertRecords';
  const LEGACY_KEY = 'jxIndicatorAlerts';
  const SCHEMA_VERSION = 3;

  const SEED = [
    {
      id: 'AER-JX-001',
      ruleId: 'ALR-JX-001',
      ruleName: '高额停机超过6个月客户',
      ruleDescription: '识别高额欠费停机超过6个月的中高端客户，触发后推送地市看管人核查。',
      triggerDate: '2026-05-28',
      triggerTime: '2026-05-28 08:00:12',
      totalMetrics: 2,
      abnormalMetrics: 1,
      notifyPushed: true,
      notifyPushedAt: '2026-05-28 08:00:35',
      notifyChannels: ['短信'],
      notifyRecipients: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-006', name: '赵磊', meta: '南昌市分公司 · 市场部 · 地市运营主管' }
      ],
      notifyLogs: [
        { recipientId: 'u-001', recipientName: '张明', recipientMeta: '江西省公司 · 市场部 · 省公司运营主管', channel: '短信', status: 'success', pushedAt: '2026-05-28 08:00:35' },
        { recipientId: 'u-006', recipientName: '赵磊', recipientMeta: '南昌市分公司 · 市场部 · 地市运营主管', channel: '短信', status: 'success', pushedAt: '2026-05-28 08:00:36' }
      ],
      items: [
        {
          metricId: 'kpi-churn-001',
          metricName: '离网预警客户数',
          metricCode: 'KPI_CUS_CHURN_001',
          level: '地市级',
          scopeLabel: '南昌市',
          ruleExpr: '高于 5000',
          actualValue: '5280',
          isAbnormal: true,
          content: '离网预警客户数 5280，高于阈值 5000'
        },
        {
          metricId: 'kpi-churn-001',
          metricName: '离网预警客户数',
          metricCode: 'KPI_CUS_CHURN_001',
          level: '地市级',
          scopeLabel: '赣州市',
          ruleExpr: '高于 5000',
          actualValue: '4120',
          isAbnormal: false,
          content: '离网预警客户数 4120，未超过阈值 5000'
        }
      ]
    },
    {
      id: 'AER-JX-002',
      ruleId: 'ALR-JX-002',
      ruleName: '套外收入环比波动预警',
      ruleDescription: '套外收入绝对值低于预期阈值时告警。',
      triggerDate: '2026-05-28',
      triggerTime: '2026-05-28 08:00:18',
      totalMetrics: 1,
      abnormalMetrics: 1,
      notifyPushed: true,
      notifyPushedAt: '2026-05-28 08:00:40',
      notifyChannels: ['短信', '邮件'],
      notifyRecipients: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-004', name: '刘伟', meta: '江西省公司 · 流量运营中心 · 流量运营分析' }
      ],
      notifyLogs: [
        { recipientId: 'u-001', recipientName: '张明', recipientMeta: '江西省公司 · 市场部 · 省公司运营主管', channel: '短信', status: 'success', pushedAt: '2026-05-28 08:00:40' },
        { recipientId: 'u-001', recipientName: '张明', recipientMeta: '江西省公司 · 市场部 · 省公司运营主管', channel: '邮件', status: 'success', pushedAt: '2026-05-28 08:00:41' },
        { recipientId: 'u-004', recipientName: '刘伟', recipientMeta: '江西省公司 · 流量运营中心 · 流量运营分析', channel: '短信', status: 'success', pushedAt: '2026-05-28 08:00:40' },
        { recipientId: 'u-004', recipientName: '刘伟', recipientMeta: '江西省公司 · 流量运营中心 · 流量运营分析', channel: '邮件', status: 'failed', pushedAt: '2026-05-28 08:00:42' }
      ],
      items: [
        {
          metricId: 'kpi-fl-rev-003',
          metricName: '套外收入',
          metricCode: 'KPI_FL_REV_003',
          level: '省级',
          scopeLabel: '江西省',
          ruleExpr: '低于 1200万',
          actualValue: '1156万',
          isAbnormal: true,
          content: '套外收入 1156万，低于阈值 1200万'
        }
      ]
    },
    {
      id: 'AER-JX-003',
      ruleId: 'ALR-JX-001',
      ruleName: '高额停机超过6个月客户',
      ruleDescription: '识别高额欠费停机超过6个月的中高端客户，触发后推送地市看管人核查。',
      triggerDate: '2026-05-27',
      triggerTime: '2026-05-27 08:00:09',
      totalMetrics: 2,
      abnormalMetrics: 0,
      notifyPushed: false,
      notifyPushedAt: '',
      notifyChannels: ['短信'],
      notifyRecipients: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-006', name: '赵磊', meta: '南昌市分公司 · 市场部 · 地市运营主管' }
      ],
      notifyLogs: [],
      items: [
        {
          metricId: 'kpi-churn-001',
          metricName: '离网预警客户数',
          metricCode: 'KPI_CUS_CHURN_001',
          level: '地市级',
          scopeLabel: '南昌市',
          ruleExpr: '高于 5000',
          actualValue: '4680',
          isAbnormal: false,
          content: '离网预警客户数 4680，未超过阈值 5000'
        },
        {
          metricId: 'kpi-churn-001',
          metricName: '离网预警客户数',
          metricCode: 'KPI_CUS_CHURN_001',
          level: '地市级',
          scopeLabel: '赣州市',
          ruleExpr: '高于 5000',
          actualValue: '3950',
          isAbnormal: false,
          content: '离网预警客户数 3950，未超过阈值 5000'
        }
      ]
    },
    {
      id: 'AER-JX-004',
      ruleId: 'ALR-JX-004',
      ruleName: '流量饱和度超限预警',
      ruleDescription: '流量饱和度超过100%触发预警，推送升档营销任务。',
      triggerDate: '2026-05-27',
      triggerTime: '2026-05-27 08:00:15',
      totalMetrics: 2,
      abnormalMetrics: 2,
      notifyPushed: true,
      notifyPushedAt: '2026-05-27 08:00:38',
      notifyChannels: ['短信', '邮件'],
      notifyRecipients: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-011', name: '黄强', meta: '九江市分公司 · 市场部 · 地市运营主管' },
        { id: 'u-009', name: '吴敏', meta: '上饶市分公司 · 存量运营部 · 存量运营' }
      ],
      notifyLogs: [
        { recipientId: 'u-001', recipientName: '张明', recipientMeta: '江西省公司 · 市场部 · 省公司运营主管', channel: '短信', status: 'success', pushedAt: '2026-05-27 08:00:38' },
        { recipientId: 'u-001', recipientName: '张明', recipientMeta: '江西省公司 · 市场部 · 省公司运营主管', channel: '邮件', status: 'success', pushedAt: '2026-05-27 08:00:39' },
        { recipientId: 'u-011', recipientName: '黄强', recipientMeta: '九江市分公司 · 市场部 · 地市运营主管', channel: '短信', status: 'success', pushedAt: '2026-05-27 08:00:38' },
        { recipientId: 'u-011', recipientName: '黄强', recipientMeta: '九江市分公司 · 市场部 · 地市运营主管', channel: '邮件', status: 'success', pushedAt: '2026-05-27 08:00:40' },
        { recipientId: 'u-009', recipientName: '吴敏', recipientMeta: '上饶市分公司 · 存量运营部 · 存量运营', channel: '短信', status: 'success', pushedAt: '2026-05-27 08:00:39' },
        { recipientId: 'u-009', recipientName: '吴敏', recipientMeta: '上饶市分公司 · 存量运营部 · 存量运营', channel: '邮件', status: 'success', pushedAt: '2026-05-27 08:00:41' }
      ],
      items: [
        {
          metricId: 'tf-sat',
          metricName: '流量饱和度',
          metricCode: 'KPI_FL_SAT_001',
          level: '地市级',
          scopeLabel: '九江市',
          ruleExpr: '高于 100%',
          actualValue: '108%',
          isAbnormal: true,
          content: '流量饱和度 108%，高于阈值 100%'
        },
        {
          metricId: 'tf-sat',
          metricName: '流量饱和度',
          metricCode: 'KPI_FL_SAT_001',
          level: '地市级',
          scopeLabel: '上饶市',
          ruleExpr: '高于 100%',
          actualValue: '112%',
          isAbnormal: true,
          content: '流量饱和度 112%，高于阈值 100%'
        }
      ]
    },
    {
      id: 'AER-JX-005',
      ruleId: 'ALR-JX-002',
      ruleName: '套外收入环比波动预警',
      ruleDescription: '套外收入绝对值低于预期阈值时告警。',
      triggerDate: '2026-05-26',
      triggerTime: '2026-05-26 08:00:11',
      totalMetrics: 1,
      abnormalMetrics: 0,
      notifyPushed: false,
      notifyPushedAt: '',
      notifyChannels: ['短信', '邮件'],
      notifyRecipients: [
        { id: 'u-001', name: '张明', meta: '江西省公司 · 市场部 · 省公司运营主管' },
        { id: 'u-004', name: '刘伟', meta: '江西省公司 · 流量运营中心 · 流量运营分析' }
      ],
      notifyLogs: [],
      items: [
        {
          metricId: 'kpi-fl-rev-003',
          metricName: '套外收入',
          metricCode: 'KPI_FL_REV_003',
          level: '省级',
          scopeLabel: '江西省',
          ruleExpr: '低于 1200万',
          actualValue: '1218万',
          isAbnormal: false,
          content: '套外收入 1218万，未低于阈值 1200万'
        }
      ]
    },
    {
      id: 'AER-JX-006',
      ruleId: 'ALR-JX-005',
      ruleName: '5G登网率连续下滑预警',
      ruleDescription: '5G登网率处于合理区间内视为正常，区间外触发预警。',
      triggerDate: '2026-05-25',
      triggerTime: '2026-05-25 08:00:08',
      totalMetrics: 1,
      abnormalMetrics: 1,
      notifyPushed: true,
      notifyPushedAt: '2026-05-25 08:00:30',
      notifyChannels: ['短信'],
      notifyRecipients: [
        { id: 'u-011', name: '黄强', meta: '九江市分公司 · 市场部 · 地市运营主管' }
      ],
      notifyLogs: [
        { recipientId: 'u-011', recipientName: '黄强', recipientMeta: '九江市分公司 · 市场部 · 地市运营主管', channel: '短信', status: 'success', pushedAt: '2026-05-25 08:00:30' }
      ],
      items: [
        {
          metricId: 'tf-5g-rate',
          metricName: '5G登网率',
          metricCode: 'KPI_5G_RATE_001',
          level: '省级',
          scopeLabel: '江西省',
          ruleExpr: '在区间外 85%~98%',
          actualValue: '82.4%',
          isAbnormal: true,
          content: '5G登网率 82.4%，低于合理区间下限 85%'
        }
      ]
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
      try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
    }
  }

  ensureSeed();

  window.AlertRecordStore = {
    getAll() {
      return read() || SEED;
    },
    getById(id) {
      return this.getAll().find(r => r.id === id) || null;
    },
    getByRuleAndDate(ruleId, triggerDate) {
      return this.getAll().find(r => r.ruleId === ruleId && r.triggerDate === triggerDate) || null;
    },
    getEnrichedById(id) {
      const record = this.getById(id);
      return window.AlertRecordCommon?.enrichRecord(record) || record;
    },
    getAllEnriched() {
      return this.getAll().map(r => window.AlertRecordCommon?.enrichRecord(r) || r);
    }
  };

  /** @deprecated 兼容旧引用 */
  window.IndicatorAlertStore = window.AlertRecordStore;
})();
