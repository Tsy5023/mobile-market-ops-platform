/** 智能体管理 · 策略诊断演示数据与存储 */
(function () {
  const DIAG_KEY = 'agentStrategyDiagnosisRecords';

  window.STRATEGY_FIELD_OPTIONS = [
    { value: 'segment', label: '客群规则' },
    { value: 'product', label: '产品规则' },
    { value: 'product_mutex', label: '产品互斥' },
    { value: 'channel', label: '渠道规则' },
    { value: 'outbound_channel', label: '外呼渠道' },
    { value: 'region_outbound', label: '区域外呼' },
    { value: 'independent_outbound', label: '独立排呼' },
    { value: 'conversion_rate', label: '策略转化率' },
    { value: 'sensitive_words', label: '敏感词' },
    { value: 'operation_position', label: '运营位规则' },
    { value: 'delivery_cycle', label: '投放周期' },
    { value: 'strategy_name', label: '策略名称' },
    { value: 'business_type', label: '业务类型' }
  ];

  window.getStrategyFieldLabel = function (value) {
    const opt = (window.STRATEGY_FIELD_OPTIONS || []).find(o => o.value === value);
    return opt ? opt.label : (value || '—');
  };

  const RULE_CATEGORIES = [
    { id: 'RC-001', name: '基础合规', code: 'basic_compliance', description: '策略基础信息合规性检查', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-20 10:00:00' },
    { id: 'RC-002', name: '客群质量', code: 'segment_quality', description: '客群规模、标签与规则合理性', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-19 14:30:00' },
    { id: 'RC-003', name: '渠道投放', code: 'channel_delivery', description: '渠道与运营位配置诊断', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-18 09:15:00' },
    { id: 'RC-004', name: '产品匹配', code: 'product_match', description: '产品与客群匹配度、产品互斥关系诊断', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-22 09:00:00' },
    { id: 'RC-005', name: '外呼管控', code: 'outbound_control', description: '外呼渠道、区域外呼与独立排呼诊断', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-22 09:05:00' }
  ];

  const DIAGNOSIS_RULES = [
    { id: 'DR-001', name: '投放周期诊断', categoryId: 'RC-001', field: 'delivery_cycle', detail: '校验策略投放起止时间是否合理，是否覆盖完整营销周期', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-21 11:00:00' },
    { id: 'DR-002', name: '客群规模诊断', categoryId: 'RC-002', field: 'segment', detail: '校验客群规模是否过小或异常波动', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-21 11:05:00' },
    { id: 'DR-003', name: '客群标签诊断', categoryId: 'RC-002', field: 'segment', detail: '校验客群标签规则是否互斥或遗漏关键条件', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-20 15:20:00' },
    { id: 'DR-004', name: '产品规则诊断', categoryId: 'RC-004', field: 'product', detail: '校验推荐产品与客群画像是否匹配', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-20 15:25:00' },
    { id: 'DR-005', name: '渠道规则诊断', categoryId: 'RC-003', field: 'channel', detail: '校验渠道与运营位组合是否冲突或重复触达', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-19 09:30:00' },
    { id: 'DR-006', name: '策略名称诊断', categoryId: 'RC-001', field: 'strategy_name', detail: '校验策略名称是否规范、是否存在歧义', status: 'disabled', updatedBy: '李敏', updatedAt: '2026-05-18 10:00:00' },
    {
      id: 'DR-007', name: '策略诊断助手对策略产品互斥诊断', categoryId: 'RC-004', field: 'product_mutex',
      detail: '主要诊断策略中推荐产品与客户已订产品是否存在互斥冲突，避免无法办理或引起客诉', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:00:00'
    },
    {
      id: 'DR-008', name: '策略诊断助手对策略外呼渠道诊断', categoryId: 'RC-003', field: 'outbound_channel',
      detail: '主要诊断策略外呼渠道配置是否合理，是否存在与其他渠道重复触达或资源浪费', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:05:00'
    },
    {
      id: 'DR-009', name: '策略诊断助手对策略区域外呼渠道诊断', categoryId: 'RC-005', field: 'region_outbound',
      detail: '主要诊断策略区域外呼渠道配额及跨区外呼是否符合管控要求', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:10:00'
    },
    {
      id: 'DR-010', name: '策略诊断助手对策略独立排呼渠道诊断', categoryId: 'RC-005', field: 'independent_outbound',
      detail: '主要诊断策略独立排呼渠道配置及排呼上限是否合理，是否超出配额', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:15:00'
    },
    {
      id: 'DR-011', name: '策略诊断助手对策略转化率诊断', categoryId: 'RC-002', field: 'conversion_rate',
      detail: '主要诊断策略历史转化率是否低于同类型策略平均水平，评估策略有效性', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:20:00'
    },
    {
      id: 'DR-012', name: '策略诊断助手对策略敏感词诊断', categoryId: 'RC-001', field: 'sensitive_words',
      detail: '主要诊断策略活动用语、话术文案是否包含敏感词或违规表述', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:25:00'
    }
  ];

  const REHEARSAL_FILTER_OPTIONS = [
    { id: 'contact_freq', name: '接触频次过滤' },
    { id: 'product_mutex', name: '产品互斥过滤' },
    { id: 'subscription', name: '订购关系过滤' },
    { id: 'activity_priority', name: '活动优先级过滤' },
    { id: 'black_white_list', name: '黑白名单过滤' },
    { id: 'dnd', name: '免打扰规则过滤' },
    { id: 'sms_unsub', name: '短信退订客户过滤' }
  ];

  const REHEARSAL_FILTER_RATIOS = {
    contact_freq: 0.028,
    product_mutex: 0.018,
    subscription: 0.012,
    activity_priority: 0.009,
    black_white_list: 0.015,
    dnd: 0.011,
    sms_unsub: 0.007
  };

  const REHEARSAL_RULES = [
    {
      id: 'RH-001', name: '标准客群预演', description: '按当前客群规则预演最终可触达规模', status: 'enabled',
      filters: ['contact_freq', 'product_mutex', 'subscription', 'activity_priority', 'black_white_list', 'dnd', 'sms_unsub'],
      updatedBy: '李敏', updatedAt: '2026-05-21 10:00:00'
    },
    {
      id: 'RH-002', name: '融合升档预演', description: '降档倾向客群预演升档转化规模', status: 'enabled',
      filters: ['contact_freq', 'product_mutex', 'subscription', 'black_white_list'],
      updatedBy: '张明', updatedAt: '2026-05-20 14:00:00'
    },
    {
      id: 'RH-003', name: '大流量加包预演', description: '视频高耗流量用户预演办理规模', status: 'disabled',
      filters: ['contact_freq', 'dnd', 'sms_unsub'],
      updatedBy: '张明', updatedAt: '2026-05-19 11:30:00'
    }
  ];

  const PORTRAIT_RULES = [
    {
      id: 'PR-001', name: '年龄分布分析', description: '输出客群年龄结构典型画像', status: 'enabled',
      tags: [
        { id: '45', code: '45', name: '生日', type: '个人' },
        { id: '12', code: '12', name: '年龄', type: '个人' }
      ],
      updatedBy: '李敏', updatedAt: '2026-05-21 09:00:00'
    },
    {
      id: 'PR-002', name: 'ARPU分层分析', description: '按ARPU档位分析客群价值结构', status: 'enabled',
      tags: [
        { id: '88', code: '88', name: 'ARPU档位', type: '个人' },
        { id: '102', code: '102', name: '套餐类型', type: '个人' }
      ],
      updatedBy: '李敏', updatedAt: '2026-05-20 16:00:00'
    },
    {
      id: 'PR-003', name: '终端类型分析', description: '5G/4G终端占比与换机倾向', status: 'enabled',
      tags: [
        { id: '156', code: '156', name: '终端类型', type: '个人' },
        { id: '157', code: '157', name: '机龄', type: '个人' }
      ],
      updatedBy: '张明', updatedAt: '2026-05-19 13:20:00'
    }
  ];

  /** 标签库（分析维度选择） */
  const TAG_CATALOG = [
    { id: '45', code: '45', name: '生日', type: '个人' },
    { id: '12', code: '12', name: '年龄', type: '个人' },
    { id: '88', code: '88', name: 'ARPU档位', type: '个人' },
    { id: '102', code: '102', name: '套餐类型', type: '个人' },
    { id: '156', code: '156', name: '终端类型', type: '个人' },
    { id: '157', code: '157', name: '机龄', type: '个人' },
    { id: '175', code: '175', name: '演示测试1', type: '个人' },
    { id: '176', code: '176', name: '演示测试2', type: '个人' },
    { id: '201', code: '201', name: '地市', type: '个人' },
    { id: '202', code: '202', name: '区县', type: '个人' },
    { id: '301', code: '301', name: '家庭宽带', type: '家庭' },
    { id: '302', code: '302', name: '家庭成员数', type: '家庭' },
    { id: '401', code: '401', name: '行业类型', type: '政企' },
    { id: '402', code: '402', name: '企业规模', type: '政企' }
  ];

  const TAG_TYPE_OPTIONS = ['个人', '家庭', '政企'];

  const PORTRAIT_VALUE_SAMPLES = {
    '45': [
      { label: '18-25岁', ratio: 12.3 },
      { label: '26-35岁', ratio: 28.6 },
      { label: '36-45岁', ratio: 42.1 },
      { label: '46岁以上', ratio: 17.0 }
    ],
    '12': [
      { label: '18-25岁', ratio: 12.3 },
      { label: '26-35岁', ratio: 28.6 },
      { label: '36-45岁', ratio: 42.1 },
      { label: '46岁以上', ratio: 17.0 }
    ],
    '88': [
      { label: '80元以下', ratio: 18.5 },
      { label: '80-120元', ratio: 38.2 },
      { label: '120-200元', ratio: 28.4 },
      { label: '200元以上', ratio: 14.9 }
    ],
    '102': [
      { label: '5G套餐', ratio: 61.3 },
      { label: '4G套餐', ratio: 32.7 },
      { label: '其他', ratio: 6.0 }
    ],
    '156': [
      { label: '5G终端', ratio: 61.0 },
      { label: '4G终端', ratio: 35.2 },
      { label: '其他', ratio: 3.8 }
    ],
    '157': [
      { label: '1年以内', ratio: 22.4 },
      { label: '1-3年', ratio: 45.6 },
      { label: '3年以上', ratio: 32.0 }
    ],
    '201': [
      { label: '南昌', ratio: 24.8 },
      { label: '赣州', ratio: 18.2 },
      { label: '九江', ratio: 12.5 },
      { label: '其他地市', ratio: 44.5 }
    ]
  };

  const DEFAULT_PORTRAIT_VALUES = [
    { label: '取值A', ratio: 35.0 },
    { label: '取值B', ratio: 40.0 },
    { label: '取值C', ratio: 25.0 }
  ];

  window.AgentTagCatalog = {
    getAll: () => TAG_CATALOG.slice(),
    getTypes: () => TAG_TYPE_OPTIONS.slice(),
    getById: id => TAG_CATALOG.find(t => t.id === id),
    formatTagLabel(tag) {
      if (!tag) return '—';
      return `${tag.code}-${tag.name}`;
    },
    formatTagsSummary(tags) {
      const list = Array.isArray(tags) ? tags : [];
      if (!list.length) return '—';
      return list.map(t => window.AgentTagCatalog.formatTagLabel(t)).join('、');
    }
  };

  window.AgentRehearsalFilterOptions = {
    getAll: () => REHEARSAL_FILTER_OPTIONS.slice(),
    getById: id => REHEARSAL_FILTER_OPTIONS.find(o => o.id === id),
    formatFiltersSummary(filterIds) {
      const ids = Array.isArray(filterIds) ? filterIds : [];
      if (!ids.length) return '—';
      return ids.map(id => {
        const opt = REHEARSAL_FILTER_OPTIONS.find(o => o.id === id);
        return opt ? opt.name : id;
      }).join('、');
    }
  };

  function buildPortraitResults(strategy) {
    const total = strategy?.scaleNum || 394090;
    const enabled = PORTRAIT_RULES.filter(r => r.status === 'enabled');
    return enabled.map((rule, i) => {
      const tags = (rule.tags || []).map(tag => {
        const samples = PORTRAIT_VALUE_SAMPLES[tag.id] || DEFAULT_PORTRAIT_VALUES;
        const values = samples.map(v => ({
          label: v.label,
          ratio: v.ratio,
          ratioLabel: v.ratio.toFixed(1) + '%',
          count: Math.round(total * v.ratio / 100)
        }));
        return {
          tagId: tag.id,
          tagCode: tag.code,
          tagName: window.AgentTagCatalog.formatTagLabel(tag),
          tagType: tag.type,
          values
        };
      });
      return {
        seq: i + 1,
        ruleId: rule.id,
        ruleName: rule.name,
        description: rule.description,
        tags
      };
    });
  }

  function buildRehearsalResults(strategy) {
    const base = strategy?.scaleNum || 394090;
    const initial = Math.round(base * 1.14);
    const enabled = REHEARSAL_RULES.filter(r => r.status === 'enabled');
    return enabled.map((rule, ri) => {
      let remaining = initial;
      const filters = (rule.filters || []).map((fid, i) => {
        const opt = REHEARSAL_FILTER_OPTIONS.find(o => o.id === fid) || { name: fid };
        const ratio = REHEARSAL_FILTER_RATIOS[fid] || 0.01;
        const filtered = Math.min(Math.max(Math.round(remaining * ratio), 0), Math.max(remaining - 1, 0));
        remaining -= filtered;
        return {
          seq: i + 1,
          filterId: fid,
          filterName: opt.name,
          filteredCount: filtered,
          remainingCount: remaining
        };
      });
      return {
        seq: ri + 1,
        ruleId: rule.id,
        ruleName: rule.name,
        description: rule.description,
        initialCount: initial,
        finalCount: remaining,
        filters
      };
    });
  }

  const SAMPLE_RESULTS = {
    delivery_cycle: { status: 'ok', analysis: '策略投放周期配置合理，覆盖完整营销窗口。' },
    segment_scale: { status: 'warn', analysis: '客群规模 394,090 人，较同类策略偏大，建议复核标签条件是否过宽。' },
    segment_tag: { status: 'ok', analysis: '客群标签规则未发现互斥冲突，预演规模与配置一致。' },
    product: { status: 'ok', analysis: '推荐产品与客群画像匹配度良好，未发现明显错配。' },
    channel: { status: 'warn', analysis: '外呼与APP双渠道存在重复触达风险，建议调整触达优先级。' },
    strategy_name: { status: 'warn', analysis: '策略名称「现在才」语义不清晰，测试环境返回可能存在歧义。' },
    product_mutex: { status: 'warn', analysis: '发现策略推荐产品与客群已订产品存在互斥关系，约 12.6% 客户无法办理，建议调整产品组合。' },
    outbound_channel: { status: 'warn', analysis: '外呼渠道与短信渠道存在重复触达风险，建议优化渠道组合或设置触达优先级。' },
    region_outbound: { status: 'ok', analysis: '区域外呼渠道配置符合管控要求，未发现跨区超额外呼。' },
    independent_outbound: { status: 'warn', analysis: '独立排呼渠道配置接近配额上限（92%），建议关注排呼资源占用。' },
    conversion_rate: { status: 'warn', analysis: '策略历史转化率 1.8%，低于同类型策略平均水平 2.5%，建议优化客群或产品组合。' },
    sensitive_words: { status: 'ok', analysis: '活动用语、话术文案未发现敏感词或违规表述。' }
  };

  const RULE_RESULT_META = {
    'DR-001': { sampleKey: 'delivery_cycle', checkField: '投放周期' },
    'DR-002': { sampleKey: 'segment_scale', checkField: '客群规模' },
    'DR-003': { sampleKey: 'segment_tag', checkField: '客群标签' },
    'DR-004': { sampleKey: 'product', checkField: '产品规则' },
    'DR-005': { sampleKey: 'channel', checkField: '渠道规则' },
    'DR-006': { sampleKey: 'strategy_name', checkField: '策略名称' },
    'DR-007': { sampleKey: 'product_mutex', checkField: '产品互斥' },
    'DR-008': { sampleKey: 'outbound_channel', checkField: '外呼渠道' },
    'DR-009': { sampleKey: 'region_outbound', checkField: '区域外呼' },
    'DR-010': { sampleKey: 'independent_outbound', checkField: '独立排呼' },
    'DR-011': { sampleKey: 'conversion_rate', checkField: '策略转化率' },
    'DR-012': { sampleKey: 'sensitive_words', checkField: '敏感词' }
  };

  function readDiag() {
    try {
      const raw = localStorage.getItem(DIAG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeDiag(list) {
    try {
      localStorage.setItem(DIAG_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function nextId(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase();
  }

  function buildResultItems(strategy) {
    const enabled = DIAGNOSIS_RULES.filter(r => r.status === 'enabled');
    const scaleLabel = String(strategy?.scaleNum || '394,090');
    return enabled.map((rule, i) => {
      const meta = RULE_RESULT_META[rule.id] || { sampleKey: rule.field, checkField: window.getStrategyFieldLabel(rule.field) };
      const sample = SAMPLE_RESULTS[meta.sampleKey] || { status: 'ok', analysis: `按规则「${rule.name}」诊断：${rule.detail || '未发现明显问题。'}` };
      return {
        seq: i + 1,
        ruleId: rule.id,
        ruleName: rule.name,
        checkField: meta.checkField,
        conclusion: sample.status === 'warn' ? 'warn' : 'ok',
        conclusionLabel: sample.status === 'warn' ? '可能存在问题' : '诊断完成',
        analysis: sample.analysis.replace(/394,090|394090/g, scaleLabel)
      };
    });
  }

  window.AgentDiagnosisStore = {
    getCategories: () => RULE_CATEGORIES.slice(),
    getCategoryById: id => RULE_CATEGORIES.find(c => c.id === id),
    getRules: () => DIAGNOSIS_RULES.slice(),
    getRuleById: id => DIAGNOSIS_RULES.find(r => r.id === id),
    getRehearsalRules: () => REHEARSAL_RULES.slice(),
    getPortraitRules: () => PORTRAIT_RULES.slice(),

    getRecords() {
      return readDiag();
    },
    getRecord(id) {
      return readDiag().find(r => r.id === id) || null;
    },
    getRecordsByStrategy(strategyId) {
      return readDiag().filter(r => r.strategyId === strategyId);
    },
    deleteRecord(id) {
      writeDiag(readDiag().filter(r => r.id !== id));
    },
    buildPortraitResults(strategy) {
      return buildPortraitResults(strategy);
    },
    buildRehearsalResults(strategy) {
      return buildRehearsalResults(strategy);
    },
    triggerDiagnosis(strategy) {
      if (!strategy) return null;
      const rehearsalItems = buildRehearsalResults(strategy);
      const finalScale = rehearsalItems[0]?.finalCount;
      const record = {
        id: nextId('DIAG'),
        strategyId: strategy.id,
        strategyCode: strategy.strategyCode || strategy.id,
        strategyName: strategy.name,
        channel: strategy.channelLabel || strategy.channel || '—',
        status: 'completed',
        triggerBy: '张明',
        strategyCreator: strategy.creator || '—',
        triggeredAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        completedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        rehearsalItems,
        rehearsalScale: finalScale != null ? finalScale.toLocaleString('zh-CN') + ' 人' : (strategy.scaleLabel || '—'),
        portraitItems: buildPortraitResults(strategy),
        items: buildResultItems(strategy)
      };
      const list = readDiag();
      list.unshift(record);
      writeDiag(list);
      return record;
    }
  };

  /** 活动列表策略数据（扩展 IOP 字段） */
  window.AgentActivityStore = {
    getActivities() {
      const base = (window.JxStrategyStore && window.JxStrategyStore.getStrategies()) || [];
      return base.map(s => ({
        ...s,
        strategyId: s.strategyCode || s.id,
        operationPosition: s.operationPosition || (s.channelLabel || '').includes('APP') ? 'APP首页Banner' : '外呼默认运营位',
        productInfo: s.product || '—',
        productCode: s.productCode || 'PD-' + (s.strategyCode || '').slice(-8),
        customerCount: s.scaleLabel || '—',
        scaleNum: parseInt(String(s.scaleLabel || '0').replace(/[^\d]/g, ''), 10) || 0,
        businessType: s.activityType || '精准营销',
        businessLine: s.groupScene || '公众市场',
        serviceTag: s.operationScene || s.type || '—',
        strategyStatus: s.status || 'draft',
        createdAt: s.createdAt || s.updatedAt || '—'
      }));
    },
    getActivity(id) {
      return this.getActivities().find(a => a.id === id || a.strategyCode === id) || null;
    }
  };

  /** 规则 CRUD（演示：内存可变） */
  function mutateList(list, record, removeId) {
    const i = list.findIndex(x => x.id === (removeId || record?.id));
    if (removeId && i >= 0) list.splice(i, 1);
    else if (record && i >= 0) list[i] = { ...list[i], ...record };
    else if (record) list.unshift(record);
  }

  window.AgentRuleCategoryStore = {
    getAll: () => RULE_CATEGORIES,
    add(payload) {
      const row = { id: nextId('RC'), status: 'enabled', updatedBy: '李敏', updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), ...payload };
      RULE_CATEGORIES.unshift(row);
      return row;
    },
    update(id, payload) {
      const i = RULE_CATEGORIES.findIndex(c => c.id === id);
      if (i >= 0) RULE_CATEGORIES[i] = { ...RULE_CATEGORIES[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    },
    remove(id) { mutateList(RULE_CATEGORIES, null, id); },
    toggleStatus(id) {
      const row = RULE_CATEGORIES.find(c => c.id === id);
      if (row) row.status = row.status === 'enabled' ? 'disabled' : 'enabled';
    }
  };

  window.AgentDiagnosisRuleStore = {
    getAll: () => DIAGNOSIS_RULES,
    add(payload) {
      const row = { id: nextId('DR'), status: 'enabled', updatedBy: '李敏', updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), ...payload };
      DIAGNOSIS_RULES.unshift(row);
      return row;
    },
    update(id, payload) {
      const i = DIAGNOSIS_RULES.findIndex(r => r.id === id);
      if (i >= 0) DIAGNOSIS_RULES[i] = { ...DIAGNOSIS_RULES[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    },
    remove(id) { mutateList(DIAGNOSIS_RULES, null, id); },
    toggleStatus(id) {
      const row = DIAGNOSIS_RULES.find(r => r.id === id);
      if (row) row.status = row.status === 'enabled' ? 'disabled' : 'enabled';
    }
  };

  window.AgentRehearsalRuleStore = {
    getAll: () => REHEARSAL_RULES,
    add(payload) {
      const row = {
        id: nextId('RH'),
        status: 'enabled',
        filters: [],
        updatedBy: '李敏',
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        ...payload
      };
      REHEARSAL_RULES.unshift(row);
      return row;
    },
    update(id, payload) {
      const i = REHEARSAL_RULES.findIndex(r => r.id === id);
      if (i >= 0) REHEARSAL_RULES[i] = { ...REHEARSAL_RULES[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    },
    remove(id) { mutateList(REHEARSAL_RULES, null, id); },
    toggleStatus(id) {
      const row = REHEARSAL_RULES.find(r => r.id === id);
      if (row) row.status = row.status === 'enabled' ? 'disabled' : 'enabled';
    }
  };

  window.AgentPortraitRuleStore = {
    getAll: () => PORTRAIT_RULES,
    add(payload) {
      const row = {
        id: nextId('PR'),
        status: 'enabled',
        tags: [],
        updatedBy: '李敏',
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        ...payload
      };
      PORTRAIT_RULES.unshift(row);
      return row;
    },
    update(id, payload) {
      const i = PORTRAIT_RULES.findIndex(r => r.id === id);
      if (i >= 0) PORTRAIT_RULES[i] = { ...PORTRAIT_RULES[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    },
    remove(id) { mutateList(PORTRAIT_RULES, null, id); },
    toggleStatus(id) {
      const row = PORTRAIT_RULES.find(r => r.id === id);
      if (row) row.status = row.status === 'enabled' ? 'disabled' : 'enabled';
    }
  };
})();
