/** 智能体管理 · 策略审核演示数据与存储 */
(function () {
  const AUDIT_KEY = 'agentStrategyAuditRecords';

  const AUDIT_CATEGORIES = [
    { id: 'AC-001', name: '基础信息审核', code: 'basic_info', description: '策略基本信息、敏感词等合规审核', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-22 09:00:00' },
    { id: 'AC-002', name: '排期与渠道审核', code: 'schedule_channel', description: '策略排期、渠道执行时间规范审核', status: 'enabled', updatedBy: '李敏', updatedAt: '2026-05-22 09:05:00' },
    { id: 'AC-003', name: '客群产品审核', code: 'segment_product', description: '客群、产品及转化率审核', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-21 16:00:00' },
    { id: 'AC-004', name: '外呼管控审核', code: 'outbound_control', description: '区域外呼、独立排呼配额审核', status: 'enabled', updatedBy: '张明', updatedAt: '2026-05-21 16:30:00' }
  ];

  window.AUDIT_FIELD_OPTIONS = [
    { value: 'strategy_basic', label: '策略基本信息' },
    { value: 'strategy_schedule', label: '策略排期信息' },
    { value: 'segment', label: '策略客群信息' },
    { value: 'product', label: '策略产品信息' },
    { value: 'conversion_rate', label: '策略转化率' },
    { value: 'region_outbound', label: '区域外呼' },
    { value: 'independent_outbound', label: '独立排呼' },
    { value: 'sensitive_words', label: '敏感词' },
    { value: 'channel_exec_time', label: '渠道执行时间' }
  ];

  window.getAuditFieldLabel = function (value) {
    const opt = (window.AUDIT_FIELD_OPTIONS || []).find(o => o.value === value);
    return opt ? opt.label : (window.getStrategyFieldLabel?.(value) || value || '—');
  };

  const AUDIT_RULES = [
    {
      id: 'AR-001', name: '策略审核助手对策略基本信息审核', categoryId: 'AC-001', field: 'strategy_basic',
      detail: '主要审核策略基本信息是否有错别字等文字规范问题', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:00:00'
    },
    {
      id: 'AR-002', name: '策略审核助手对策略排期信息审核', categoryId: 'AC-002', field: 'strategy_schedule',
      detail: '主要审核策略的排期是否符合规范要求', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:05:00'
    },
    {
      id: 'AR-003', name: '策略审核助手对策略客群信息审核', categoryId: 'AC-003', field: 'segment',
      detail: '主要审核客群的规模和客群的标签是否过期', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:10:00'
    },
    {
      id: 'AR-004', name: '策略审核助手对策略产品信息审核', categoryId: 'AC-003', field: 'product',
      detail: '主要审核客群和产品的互斥依赖关系', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:15:00'
    },
    {
      id: 'AR-005', name: '策略审核助手对策略转化率审核', categoryId: 'AC-003', field: 'conversion_rate',
      detail: '审核策略的产品历史转化率是否低于某个阈值', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:20:00'
    },
    {
      id: 'AR-006', name: '策略审核助手对策略区域外呼审核', categoryId: 'AC-004', field: 'region_outbound',
      detail: '审核区域外呼的配额和预计要执行的号码总数是否超出', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:25:00'
    },
    {
      id: 'AR-007', name: '策略审核助手对策略独立排呼审核', categoryId: 'AC-004', field: 'independent_outbound',
      detail: '审核区域独立外呼的配额和预计要执行的号码总数是否超出', status: 'enabled',
      updatedBy: '张明', updatedAt: '2026-05-22 10:30:00'
    },
    {
      id: 'AR-008', name: '策略审核助手对策略敏感词审核', categoryId: 'AC-001', field: 'sensitive_words',
      detail: '审核策略文案、名称等是否包含敏感词', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:35:00'
    },
    {
      id: 'AR-009', name: '策略审核助手对策略渠道执行时间审核', categoryId: 'AC-002', field: 'channel_exec_time',
      detail: '审核渠道执行时间是否包含晚上或者节假日等不合规时段', status: 'enabled',
      updatedBy: '李敏', updatedAt: '2026-05-22 10:40:00'
    }
  ];

  const AUDIT_SAMPLES = {
    'AR-001': { status: 'pass', analysis: '策略基本信息未发现错别字或明显文字规范问题。' },
    'AR-002': { status: 'pass', analysis: '策略排期符合规范，起止时间配置合理。' },
    'AR-003': { status: 'warn', analysis: '客群规模 394,090 人偏大；部分客群标签已超过有效期，建议更新标签规则。' },
    'AR-004': { status: 'pass', analysis: '客群与产品互斥依赖关系校验通过，未发现冲突配置。' },
    'AR-005': { status: 'warn', analysis: '产品历史转化率 2.1%，低于阈值 3.0%，建议评估策略可行性。' },
    'AR-006': { status: 'warn', analysis: '预计执行号码 12.8 万，超出区域外呼配额 10 万，存在超配额风险。' },
    'AR-007': { status: 'pass', analysis: '独立排呼配额充足，预计执行号码总数未超出配额上限。' },
    'AR-008': { status: 'pass', analysis: '未发现敏感词命中，策略文案符合合规要求。' },
    'AR-009': { status: 'warn', analysis: '渠道执行时间包含 20:00-22:00 时段，涉及晚间触达，建议调整或补充审批。' }
  };

  const FIELD_CHECK_LABEL = {
    strategy_basic: '策略基本信息',
    strategy_schedule: '策略排期信息',
    segment: '策略客群信息',
    product: '策略产品信息',
    conversion_rate: '策略转化率',
    region_outbound: '区域外呼',
    independent_outbound: '独立排呼',
    sensitive_words: '敏感词',
    channel_exec_time: '渠道执行时间'
  };

  function readAudit() {
    try {
      const raw = localStorage.getItem(AUDIT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeAudit(list) {
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function nextId(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase();
  }

  function mutateList(list, record, removeId) {
    const i = list.findIndex(x => x.id === (removeId || record?.id));
    if (removeId && i >= 0) list.splice(i, 1);
    else if (record && i >= 0) list[i] = { ...list[i], ...record };
    else if (record) list.unshift(record);
  }

  function buildStrategyAuditItems(strategy) {
    const enabled = (window.AgentAuditRuleStore?.getAll() || AUDIT_RULES).filter(r => r.status === 'enabled');
    const scaleStr = String(strategy?.scaleNum || strategy?.customerCount || '394090').replace(/[^\d]/g, '') || '394090';
    return enabled.map((rule, i) => {
      const sample = AUDIT_SAMPLES[rule.id] || {
        status: 'pass',
        analysis: `按规则「${rule.name}」审核：${rule.detail || '未发现明显问题。'}`
      };
      const status = sample.status;
      let analysis = sample.analysis.replace(/394,090|394090/g, Number(scaleStr).toLocaleString('zh-CN'));
      if (strategy?.name && rule.id === 'AR-001') {
        analysis = analysis.replace('策略基本信息', `策略「${strategy.name}」基本信息`);
      }
      return {
        seq: i + 1,
        ruleId: rule.id,
        ruleName: rule.name,
        checkField: FIELD_CHECK_LABEL[rule.field] || window.getAuditFieldLabel(rule.field),
        conclusion: status,
        conclusionLabel: status === 'warn' || status === 'fail' ? '疑似存在问题' : '通过',
        analysis
      };
    });
  }

  function strategyConclusion(items) {
    if (items.some(x => x.conclusion === 'fail')) return 'fail';
    if (items.some(x => x.conclusion === 'warn')) return 'warn';
    return 'pass';
  }

  function conclusionLabel(c) {
    if (c === 'warn' || c === 'fail') return '疑似存在问题';
    return '通过';
  }

  function buildStrategyResult(strategy) {
    const items = buildStrategyAuditItems(strategy);
    const conclusion = strategyConclusion(items);
    return {
      strategyId: strategy.id,
      strategyCode: strategy.strategyCode || strategy.strategyId || strategy.id,
      strategyName: strategy.name,
      channel: strategy.channelLabel || strategy.channel || '—',
      conclusion,
      conclusionLabel: conclusionLabel(conclusion),
      items
    };
  }

  window.AgentAuditRuleCategoryStore = {
    getAll: () => AUDIT_CATEGORIES,
    add(payload) {
      const row = { id: nextId('AC'), status: 'enabled', updatedBy: '李敏', updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), ...payload };
      AUDIT_CATEGORIES.unshift(row);
      return row;
    },
    update(id, payload) {
      const i = AUDIT_CATEGORIES.findIndex(c => c.id === id);
      if (i >= 0) AUDIT_CATEGORIES[i] = { ...AUDIT_CATEGORIES[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    },
    remove(id) { mutateList(AUDIT_CATEGORIES, null, id); },
    toggleStatus(id) {
      const row = AUDIT_CATEGORIES.find(c => c.id === id);
      if (row) row.status = row.status === 'enabled' ? 'disabled' : 'enabled';
    }
  };

  window.AgentAuditRuleStore = {
    getAll: () => AUDIT_RULES,
    add(payload) {
      const row = { id: nextId('AR'), status: 'enabled', updatedBy: '李敏', updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), ...payload };
      AUDIT_RULES.unshift(row);
      return row;
    },
    update(id, payload) {
      const i = AUDIT_RULES.findIndex(r => r.id === id);
      if (i >= 0) AUDIT_RULES[i] = { ...AUDIT_RULES[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    },
    remove(id) { mutateList(AUDIT_RULES, null, id); },
    toggleStatus(id) {
      const row = AUDIT_RULES.find(r => r.id === id);
      if (row) row.status = row.status === 'enabled' ? 'disabled' : 'enabled';
    }
  };

  window.AgentAuditStore = {
    getRecords() { return readAudit(); },
    getRecord(id) { return readAudit().find(r => r.id === id) || null; },
    deleteRecord(id) { writeAudit(readAudit().filter(r => r.id !== id)); },
    /** 提交批量审批任务（运行中） */
    submitBatchAudit(strategies) {
      const list = Array.isArray(strategies) ? strategies.filter(Boolean) : [];
      if (!list.length) return null;
      const record = {
        id: nextId('AUDIT'),
        status: 'running',
        triggerBy: '张明',
        triggeredAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        completedAt: null,
        strategyCount: list.length,
        passCount: '—',
        warnCount: '—',
        failCount: '—',
        conclusion: null,
        conclusionLabel: '—',
        pendingStrategies: list.map(s => ({ ...s })),
        strategies: []
      };
      const all = readAudit();
      all.unshift(record);
      writeAudit(all);
      return record;
    },
    /** 完成批量审批，按启用规则生成各策略审核结果 */
    finishBatchAudit(id) {
      const all = readAudit();
      const i = all.findIndex(r => r.id === id);
      if (i < 0 || all[i].status !== 'running') return all[i] || null;
      const pending = all[i].pendingStrategies || [];
      const results = pending.map(buildStrategyResult);
      const passCount = results.filter(r => r.conclusion === 'pass').length;
      const warnCount = results.filter(r => r.conclusion === 'warn').length;
      const failCount = results.filter(r => r.conclusion === 'fail').length;
      const batchConclusion = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';
      all[i] = {
        ...all[i],
        status: 'completed',
        completedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        passCount,
        warnCount,
        failCount,
        conclusion: batchConclusion,
        conclusionLabel: conclusionLabel(batchConclusion),
        strategies: results,
        pendingStrategies: []
      };
      writeAudit(all);
      return all[i];
    },
    /** 兼容：立即完成批量审核 */
    triggerBatchAudit(strategies) {
      const record = this.submitBatchAudit(strategies);
      if (!record) return null;
      return this.finishBatchAudit(record.id);
    },
    getRunningRecords() {
      return readAudit().filter(r => r.status === 'running');
    }
  };
})();
