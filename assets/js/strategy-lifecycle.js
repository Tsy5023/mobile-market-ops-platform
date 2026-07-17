/** 策略全生命周期：创建 → 调度派发 → 评估优化（江西移动演示） */
(function () {
  const KEYS = {
    strategies: 'jxStrategyRecords',
    dispatch: 'jxDispatchRecords',
    eval: 'jxStrategyEvalRecords',
    pendingDispatch: 'jxPendingDispatchStrategyId',
    pendingEval: 'jxPendingEvalStrategyId'
  };

  const CHANNEL_LABELS = {
    outbound: '外呼',
    sms: '短信',
    app: '中国移动 APP',
    hall: '营业厅 / 厅店'
  };

  const SEED_STRATEGIES = [
    { id: 'ST-JX-2026-001', strategyCode: '202605271104318177060', name: '中高端离网挽留专项', type: '离网维系', createSource: '单策略', event: '—', segment: '离网风险客群', scaleLabel: '4,280 人', product: '专属续约优惠包', channel: 'ch_10085', channelLabel: '10085外呼营销', cities: '南昌,赣州,上饶', status: 'executing', iopSyncStatus: 'sync_ok', period: '2026-05-01 ~ 2026-06-30', owner: '省公司存量部', creator: '李娜', createdAt: '2026-05-28 09:12:00', updatedAt: '2026-05-28 14:20:00', dispatchTaskId: 'DSP-JX-001', evalId: 'EVL-JX-001', groupScene: '公众市场', operationScene: '离网维系', activityType: '精准营销', activityGoal: '离网挽留', strategyDesc: '针对中高端离网风险客群开展专项挽留' },
    { id: 'ST-JX-2026-002', strategyCode: '202605271104318177061', name: '降档拦截融合升级', type: '降档防控', createSource: '智推策略', event: '降档预警', segment: '降档倾向高价值客群', scaleLabel: '12,840 人', product: '融合升档礼包', channel: 'ch_cmcc_app', channelLabel: '中国移动APP', cities: '全省', status: 'pending_approval', iopSyncStatus: 'pending', period: '2026-05-15 ~ 2026-07-15', owner: '南昌分公司', creator: '王磊', createdAt: '2026-05-27 16:40:00', updatedAt: '2026-05-27 18:05:00', groupScene: '公众市场', operationScene: '中高端客户运营', activityType: '关怀营销', activityGoal: '升档增收', strategyDesc: '降档倾向客户融合升档推荐' },
    { id: 'ST-JX-2026-003', strategyCode: '202605271104318177062', name: '合约到期续约提醒', type: '合约运营', createSource: '单策略', event: '合约到期', segment: '合约到期敏感客群', scaleLabel: '2,150 人', product: '合约续约补贴', channel: 'ch_10085', channelLabel: '10085外呼营销', cities: '九江,宜春', status: 'draft', period: '2026-06-01 ~ 2026-08-31', owner: '九江分公司', creator: '陈敏', createdAt: '2026-05-26 11:05:00', updatedAt: '2026-05-26 11:05:00', groupScene: '公众市场', operationScene: '合约运营', activityType: '精准营销', activityGoal: '合约续约', strategyDesc: '合约到期前30天续约提醒' },
    { id: 'ST-JX-2026-004', strategyCode: '202605271104318177063', name: '账单异议关怀回访', type: '服务修复', createSource: '单策略', event: '账单异议', segment: '服务敏感客群', scaleLabel: '1,850 人', product: '账单减免券', channel: 'ch_hall_net', channelLabel: '营业厅网台', cities: '南昌,景德镇', status: 'executing', iopSyncStatus: 'sync_failed', period: '2026-04-20 ~ 2026-05-31', owner: '省公司客服部', creator: '孙悦', createdAt: '2026-05-25 14:22:00', updatedAt: '2026-05-26 09:30:00', dispatchTaskId: 'DSP-JX-002', evalId: 'EVL-JX-002', groupScene: '公众市场', operationScene: '离网维系', activityType: '关怀营销', activityGoal: '离网挽留', strategyDesc: '账单异议客户关怀回访' },
    { id: 'ST-JX-2026-005', strategyCode: '202605271104318177064', name: '低接触客群唤醒', type: '活跃提升', createSource: '智推策略', event: '沉默唤醒', segment: '低接触流失风险客群', scaleLabel: '3,620 人', product: '流量加油包', channel: 'ch_10086_popup', channelLabel: '10086呼入弹屏', cities: '全省', status: 'completed', iopSyncStatus: 'sync_ok', period: '2026-03-01 ~ 2026-04-30', owner: '省公司市场部', creator: '马超', createdAt: '2026-05-20 10:30:00', updatedAt: '2026-04-30 18:00:00', dispatchTaskId: 'DSP-JX-003', evalId: 'EVL-JX-003', groupScene: '公众市场', operationScene: '流量运营', activityType: '促销营销', activityGoal: '价值提升', strategyDesc: '低接触客户唤醒触达' },
    { id: 'ST-JX-2026-006', strategyCode: '202605271104318177065', name: '5G 升档专项触达', type: '升档营销', createSource: '单策略', event: '升档推荐', segment: '5G 升档意向客群', scaleLabel: '8,960 人', product: '5G 畅享升档包', channel: 'ch_cmcc_app', channelLabel: '中国移动APP', cities: '全省', status: 'pending_exec', iopSyncStatus: 'sync_failed', period: '2026-05-10 ~ 2026-06-30', owner: '省公司市场部', creator: '张明', createdAt: '2026-05-24 08:50:00', updatedAt: '2026-05-25 16:12:00', groupScene: '公众市场', operationScene: '流量运营', activityType: '精准营销', activityGoal: '升档增收', strategyDesc: '5G升档意向客户专项触达' },
    { id: 'ST-JX-2026-007', strategyCode: '202605271104318177066', name: 'coc标签沉淀客群400专项', type: '离网维系', createSource: '单策略', event: '标签沉淀', segment: 'coc标签沉淀客群400', scaleLabel: '6,200 人', product: '专属续约优惠包', channel: 'ch_10085', channelLabel: '10085外呼营销', cities: '全省', status: 'approval_rejected', iopSyncStatus: 'pending', period: '2026-05-27 ~ 2026-05-28', owner: '省公司存量部', creator: 'admin', createdAt: '2026-05-27 11:04:31', updatedAt: '2026-05-27 15:40:00', groupScene: '公众市场', operationScene: '中高端客户运营', activityType: '精准营销', activityGoal: '离网挽留', strategyDesc: 'coc标签沉淀客群专项营销', approvalOpinion: '渠道配置不完整，请补充外呼话术' }
  ];

  const SEED_DISPATCH = [
    { id: 'DSP-JX-001', strategyId: 'ST-JX-2026-001', target: '外呼坐席池-A', volume: 4280, cities: '南昌,赣州,上饶', status: 'running', dispatchedAt: '2026-05-02 09:00' },
    { id: 'DSP-JX-002', strategyId: 'ST-JX-2026-004', target: '网格经理+厅店', volume: 1850, cities: '南昌,景德镇', status: 'running', dispatchedAt: '2026-04-22 14:30' },
    { id: 'DSP-JX-003', strategyId: 'ST-JX-2026-005', target: '短信+APP推送', volume: 3620, cities: '全省', status: 'completed', dispatchedAt: '2026-03-05 10:00' }
  ];

  const SEED_EVAL = [
    { id: 'EVL-JX-001', strategyId: 'ST-JX-2026-001', execProgress: 92, reachRate: '72.4%', convertRate: '18.6%' },
    { id: 'EVL-JX-002', strategyId: 'ST-JX-2026-004', execProgress: 85, reachRate: '65.8%', convertRate: '14.2%' },
    { id: 'EVL-JX-003', strategyId: 'ST-JX-2026-005', execProgress: 100, reachRate: '81.2%', convertRate: '9.4%' }
  ];

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function nextId(prefix) {
    return prefix + '-JX-' + Date.now().toString(36).toUpperCase();
  }

  const STRATEGY_SCHEMA = 'jxStrategySchemaV4';

  function ensureSeed() {
    let schemaOk = false;
    try {
      schemaOk = localStorage.getItem('jxStrategySchemaVer') === STRATEGY_SCHEMA;
    } catch (e) { /* ignore */ }
    if (!schemaOk || !read(KEYS.strategies)) {
      write(KEYS.strategies, SEED_STRATEGIES);
      try { localStorage.setItem('jxStrategySchemaVer', STRATEGY_SCHEMA); } catch (e) { /* ignore */ }
    }
    if (!read(KEYS.dispatch)) write(KEYS.dispatch, SEED_DISPATCH);
    if (!read(KEYS.eval)) write(KEYS.eval, SEED_EVAL);
  }

  ensureSeed();

  window.JxStrategyStore = {
    getStrategies() {
      return read(KEYS.strategies) || SEED_STRATEGIES;
    },
    saveStrategies(list) {
      write(KEYS.strategies, list);
    },
    getStrategy(id) {
      return this.getStrategies().find(s => s.id === id) || null;
    },
    upsertStrategy(record) {
      const list = this.getStrategies();
      const i = list.findIndex(s => s.id === record.id);
      if (i >= 0) list[i] = { ...list[i], ...record };
      else list.unshift(record);
      this.saveStrategies(list);
      return record;
    },
    getDispatches() {
      return read(KEYS.dispatch) || SEED_DISPATCH;
    },
    getDispatchByStrategy(strategyId) {
      return this.getDispatches().find(d => d.strategyId === strategyId) || null;
    },
    getEvals() {
      return read(KEYS.eval) || SEED_EVAL;
    },
    getEvalByStrategy(strategyId) {
      return this.getEvals().find(e => e.strategyId === strategyId) || null;
    },
    channelLabel(key, sub) {
      const main = CHANNEL_LABELS[key] || key;
      if (!sub || sub === '无') return main;
      return main + '+' + (CHANNEL_LABELS[sub] || sub);
    },
    createStrategyFromForm(fd, segmentCtx, channelsMeta, productsMeta, existingId) {
      if (typeof productsMeta === 'string' && !existingId) {
        existingId = productsMeta;
        productsMeta = null;
      }
      const channels = channelsMeta || [];
      const products = Array.isArray(productsMeta) ? productsMeta : [];
      const channelLabel = channels.length
        ? channels.map(c => c.displayLabel || c.channelName || c.typeLabel || '').join(' + ')
        : '—';
      const channel = channels[0]?.channelId || channels[0]?.typeKey || 'ch_cmcc_app';
      const start = fd.get('startDate');
      const end = fd.get('endDate');
      const prev = existingId ? this.getStrategy(existingId) : null;
      const id = existingId || nextId('ST');
      const record = {
        id,
        name: fd.get('strategyName'),
        type: fd.get('strategyType'),
        segment: segmentCtx?.segmentName || '—',
        segmentId: segmentCtx?.segmentId || segmentCtx?.segmentCode || '',
        segmentSource: segmentCtx?.segmentSource || '',
        dispatchTaskId: segmentCtx?.dispatchTaskId || '',
        scaleLabel: segmentCtx?.scaleLabel || '—',
        refineTags: segmentCtx?.refineTags || [],
        refineTagRules: segmentCtx?.refineTagRules || [],
        sourceMetric: segmentCtx?.sourceMetric || '',
        metricValue: segmentCtx?.metricValue || '',
        metricMom: segmentCtx?.metricMom || '',
        metricYoy: segmentCtx?.metricYoy || '',
        product: fd.get('productMain') || products.map(p => p.name).join('、'),
        products,
        channel,
        channelLabel,
        channels,
        cities: segmentCtx?.cities || '全省',
        priority: prev?.priority || 50,
        period: `${start} ~ ${end}`,
        strategyCode: prev?.strategyCode || ('2026' + Date.now().toString().slice(-12)),
        createSource: '单策略',
        event: '—',
        status: 'pending_approval',
        iopSyncStatus: 'pending',
        strategyDesc: fd.get('strategyDesc'),
        specialTopic: fd.get('specialTopic') || '',
        groupScene: fd.get('groupScene') || '',
        operationScene: fd.get('operationScene') || '',
        marketingTemplate: fd.get('marketingTemplate') || '',
        activityType: fd.get('activityType') || '',
        activityGoal: fd.get('activityGoal') || '',
        approvalAdmin: fd.get('approvalAdmin') || '',
        sensitiveGroup: fd.get('sensitiveGroup') || '',
        creator: prev?.creator || '张明',
        createdAt: prev?.createdAt || new Date().toLocaleString('zh-CN', { hour12: false })
      };
      this.upsertStrategy(record);
      return record;
    },
    saveDraftFromForm(fd, segmentCtx, channelsMeta, productsMeta, existingId) {
      if (typeof productsMeta === 'string' && !existingId) {
        existingId = productsMeta;
        productsMeta = null;
      }
      const record = this.createStrategyFromForm(fd, segmentCtx, channelsMeta, productsMeta, existingId);
      record.status = 'draft';
      if (existingId) {
        const prev = this.getStrategy(existingId);
        if (prev?.iopSyncStatus) record.iopSyncStatus = prev.iopSyncStatus;
      }
      this.upsertStrategy(record);
      return record;
    },
    createDispatch(strategyId, form) {
      const strategy = this.getStrategy(strategyId);
      if (!strategy) return null;
      const dispatch = {
        id: nextId('DSP'),
        strategyId,
        strategyName: strategy.name,
        target: form.target,
        volume: form.volume,
        cities: form.cities || strategy.cities,
        gridScope: form.gridScope,
        execDate: form.execDate,
        remark: form.remark,
        status: 'running',
        dispatchedAt: new Date().toLocaleString('zh-CN', { hour12: false })
      };
      const list = this.getDispatches();
      list.unshift(dispatch);
      write(KEYS.dispatch, list);
      this.upsertStrategy({
        ...strategy,
        status: 'running',
        iopSyncStatus: 'sync_ok',
        dispatchTaskId: dispatch.id
      });
      const evalList = this.getEvals();
      if (!evalList.some(e => e.strategyId === strategyId)) {
        evalList.unshift({
          id: nextId('EVL'),
          strategyId,
          execProgress: 0,
          reachRate: '—',
          convertRate: '—'
        });
        write(KEYS.eval, evalList);
      }
      return dispatch;
    },
    refreshEvalMetrics(strategyId) {
      const evalList = this.getEvals();
      let ev = evalList.find(e => e.strategyId === strategyId);
      if (!ev) {
        ev = { id: nextId('EVL'), strategyId };
        evalList.unshift(ev);
      }
      ev.execProgress = Math.round(75 + Math.random() * 22);
      ev.reachRate = (60 + Math.random() * 25).toFixed(1) + '%';
      ev.convertRate = (8 + Math.random() * 14).toFixed(1) + '%';
      ev.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false });
      write(KEYS.eval, evalList);
      return ev;
    },
    setPendingDispatch(strategyId) {
      sessionStorage.setItem(KEYS.pendingDispatch, strategyId);
    },
    getPendingDispatch() {
      return sessionStorage.getItem(KEYS.pendingDispatch);
    },
    clearPendingDispatch() {
      sessionStorage.removeItem(KEYS.pendingDispatch);
    },
    setPendingEval(strategyId) {
      sessionStorage.setItem(KEYS.pendingEval, strategyId);
    },
    getPendingEval() {
      return sessionStorage.getItem(KEYS.pendingEval);
    },
    clearPendingEval() {
      sessionStorage.removeItem(KEYS.pendingEval);
    },
    STATUS_MAP: {
      draft: ['badge-info', '草稿'],
      rehearsing: ['badge-warning', '预演中'],
      rehearsal_done: ['badge-primary', '预演完成'],
      rehearsal_failed: ['badge-danger', '预演失败'],
      pending_approval: ['badge-warning', '审批中'],
      approval_rejected: ['badge-danger', '审批退回'],
      pending_exec: ['badge-primary', '待执行'],
      pending_publish: ['badge-primary', '待发布'],
      executing: ['badge-success', '执行中'],
      paused: ['badge-warning', '暂停'],
      completed: ['badge-success', '完成'],
      terminated: ['badge-danger', '终止'],
      running: ['badge-success', '执行中'],
      approved: ['badge-primary', '待执行'],
      pending: ['badge-warning', '审批中'],
      stopped: ['badge-danger', '终止']
    },
    statusLabel(status) {
      const [cls, label] = this.STATUS_MAP[status] || ['badge-info', status];
      return { cls, label };
    },
    getEffectiveStatus(strategy) {
      if (!strategy) return '';
      return strategy.status;
    },
    getDisplayStatus(strategy) {
      if (!strategy) return { cls: 'badge-secondary', label: '—', key: '' };
      const st = this.statusLabel(strategy.status);
      return { ...st, key: strategy.status };
    },
    getSyncDisplayStatus(strategy) {
      if (!strategy) return { cls: 'badge-secondary', label: '—', key: '' };
      const sync = strategy.iopSyncStatus;
      if (sync === 'syncing') return { cls: 'badge-warning', label: '同步中', key: 'syncing' };
      if (sync === 'sync_ok') return { cls: 'badge-success', label: '同步成功', key: 'sync_ok' };
      if (sync === 'sync_failed') return { cls: 'badge-danger', label: '同步失败', key: 'sync_failed' };
      return { cls: 'badge-secondary', label: '—', key: 'none' };
    },
    matchesStatusFilter(strategy, filter) {
      if (!filter) return true;
      if (filter === 'executing') return strategy.status === 'executing' || strategy.status === 'running';
      return strategy.status === filter;
    },
    matchesSyncFilter(strategy, filter) {
      if (!filter) return true;
      const sync = strategy.iopSyncStatus || 'none';
      if (filter === 'syncing') return sync === 'syncing';
      if (filter === 'sync_ok') return sync === 'sync_ok';
      if (filter === 'sync_failed') return sync === 'sync_failed';
      return true;
    },
    getRowOperations(strategy) {
      const ops = [];
      const st = strategy.status;
      const sync = strategy.iopSyncStatus;
      if (st === 'draft' || st === 'approval_rejected') {
        ops.push('submit', 'edit', 'delete');
      } else if (sync === 'sync_failed' || st === 'rehearsal_failed') {
        ops.push('sync', 'edit', 'delete');
      } else if (st === 'pending_exec' || st === 'pending_publish') {
        ops.push('sync', 'edit');
      }
      return ops;
    },
    submitStrategy(id) {
      const s = this.getStrategy(id);
      if (!s) return null;
      const record = { ...s, status: 'pending_approval', submittedAt: new Date().toLocaleString('zh-CN', { hour12: false }) };
      this.upsertStrategy(record);
      if (window.JxApprovalStore) window.JxApprovalStore.addPending(record);
      return record;
    },
    deleteStrategy(id) {
      const list = this.getStrategies().filter(s => s.id !== id);
      this.saveStrategies(list);
    },
    syncStrategy(id) {
      const s = this.getStrategy(id);
      if (!s) return null;
      this.upsertStrategy({ ...s, iopSyncStatus: 'syncing' });
      const self = this;
      setTimeout(() => {
        const cur = self.getStrategy(id);
        if (!cur) return;
        const ok = Math.random() > 0.25;
        self.upsertStrategy({
          ...cur,
          iopSyncStatus: ok ? 'sync_ok' : 'sync_failed',
          status: ok && cur.status === 'pending_exec' ? 'executing' : cur.status
        });
        if (typeof window.renderStrategyRecommendList === 'function') window.renderStrategyRecommendList();
      }, 800);
      return s;
    }
  };

  const inPages = () => window.location.pathname.includes('/pages/');

  window.JxStrategyLinks = {
    list: () => (inPages() ? 'strategy-category.html?tab=segment' : 'pages/strategy-category.html?tab=segment'),
    create: () => (inPages() ? 'strategy-create.html' : 'pages/strategy-create.html'),
    dispatchList: () => (inPages() ? 'dispatch-assign.html' : 'pages/dispatch-assign.html') + '?tab=strategy',
    dispatchDetail: (strategyId) =>
      (inPages() ? 'dispatch-assign.html' : 'pages/dispatch-assign.html')
      + '?tab=strategy&strategyId=' + encodeURIComponent(strategyId),
    evalList: () => (inPages() ? 'strategy-eval.html' : 'pages/strategy-eval.html'),
    evalDetail: (strategyId) =>
      (inPages() ? 'strategy-eval.html' : 'pages/strategy-eval.html')
      + '?strategyId=' + encodeURIComponent(strategyId)
  };

  window.navigateToDispatchAssign = function (strategyId) {
    window.location.href = strategyId
      ? JxStrategyLinks.dispatchDetail(strategyId)
      : JxStrategyLinks.dispatchList();
  };

  window.navigateToStrategyEval = function (strategyId) {
    window.location.href = strategyId
      ? JxStrategyLinks.evalDetail(strategyId)
      : JxStrategyLinks.evalList();
  };
})();
