/** 知识查询助手 · 演示数据 */
(function () {
  const USERS = [
    { userId: 'U10021', userName: '张明' },
    { userId: 'U10035', userName: '李敏' },
    { userId: 'U10048', userName: '王磊' },
    { userId: 'U10062', userName: '陈静' },
    { userId: 'U10077', userName: '刘洋' },
    { userId: 'U10089', userName: '赵婷' },
    { userId: 'U10102', userName: '孙悦' },
    { userId: 'U10115', userName: '周强' }
  ];

  const QA_CATEGORIES = ['流量运营', '指标口径', '系统操作', '策略调度', '客群标签'];

  const SAMPLE_QUESTIONS = [
    '流量收入指标的业务口径是什么？',
    '如何查看指标树的根因分析？',
    '5G智网月流量贡献指标在哪里配置？',
    '预警规则如何设置环比阈值？',
    '客群调度任务怎么下发到地市？',
    '指标看管人如何绑定？',
    '流量超套客群定义是什么？',
    '策略审批流程有哪些节点？',
    '本月南昌流量收入是多少？',
    '离网维系策略怎么创建？',
    '客户标签从哪里同步？',
    '工作台待办任务如何办结？',
    'IOP 标签更新周期是多久？',
    '指标异常如何派单？',
    '融合套餐升档规则在哪查？'
  ];

  const SAMPLE_ANSWERS = [
    '流量收入指套餐内流量计费收入与套外流量收入之和，统计粒度为省份、更新周期为月，详见指标树「流量收入增」节点口径说明。',
    '在指标洞察中选择异常指标，打开详情抽屉后切换至「根因分析」Tab，可查看传导链路与客群画像。',
    '路径：基础功能 → 配置管理 → 指标树配置，在「网-流量增幅贡献 → 5G智网」分支下维护。',
    '进入基础功能 → 监控预警管理 → 预警规则，新增规则并配置阈值/波动率/环比等计算条件即可。',
    '在调度中心 → 调度派发中创建任务，选择目标客群与执行渠道后提交审批并派发。',
    '基础功能 → 配置管理 → 指标看管人，按组织与指标维度绑定看管人员或部门。',
    '流量超套客群指当月套外流量计费超过套餐内配额的客户集合，见指标树「其中：超套运营」分支。',
    '策略创建后进入待审批，由部门负责人审批通过后同步 IOP 并进入待执行/执行中状态。',
    '抱歉，当前演示环境未接入实时数仓，请在指标洞察中按地市下钻查询最新账期数据。',
    '能力中心 → 策略中心 → 策略分类，选择客群类策略模板创建离网维系专项即可。',
    '基础功能 → 客群和标签管理 → 客户标签管理，标签由 IOP 平台定时同步。',
    '基础功能 → 运营工作台，在「我的待办」中打开任务处理并填写执行反馈后办结。',
    'IOP 客户标签默认按日增量、按月全量更新，具体以标签元数据中的更新周期为准。',
    '指标预警命中后可在工作台或指标预警列表中一键发起调度派单。',
    '该问题暂无标准知识条目，建议联系市场部流量运营接口人确认最新升档政策。'
  ];

  function pick(arr, i) { return arr[i % arr.length]; }

  function buildMessages(sessionId, user, baseTime, qIdx) {
    const q = SAMPLE_QUESTIONS[qIdx];
    const a = SAMPLE_ANSWERS[qIdx];
    const t0 = new Date(baseTime);
    return [
      { role: 'user', text: q, time: formatTime(t0) },
      { role: 'assistant', text: a, time: formatTime(new Date(t0.getTime() + 8000)), hasAnswer: !a.startsWith('抱歉') && !a.startsWith('该问题暂无') }
    ];
  }

  function formatTime(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function buildSessions() {
    const list = [];
    for (let i = 0; i < 48; i++) {
      const user = pick(USERS, i);
      const day = new Date('2026-05-01');
      day.setDate(day.getDate() + (i % 28));
      day.setHours(8 + (i % 10), (i * 7) % 60, 0);
      const qIdx = i % SAMPLE_QUESTIONS.length;
      const sessionId = 'CHAT-' + String(20260501001 + i);
      const messages = buildMessages(sessionId, user, day, qIdx);
      list.push({
        id: sessionId,
        sessionId,
        userId: user.userId,
        userName: user.userName,
        chatTime: formatTime(day),
        messageCount: messages.length,
        lastQuestion: messages[0].text,
        messages
      });
    }
    return list.sort((a, b) => b.chatTime.localeCompare(a.chatTime));
  }

  function buildQaKnowledge() {
    return SAMPLE_QUESTIONS.map((q, i) => ({
      id: 'QA-' + String(1001 + i),
      question: q,
      answer: SAMPLE_ANSWERS[i],
      category: pick(QA_CATEGORIES, i),
      status: i % 7 === 0 ? 'disabled' : 'enabled',
      hitCount: 120 - i * 5 + (i % 3) * 12,
      updatedAt: `2026-05-${String(10 + (i % 18)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:30:00`,
      updatedBy: pick(USERS, i).userName
    }));
  }

  function buildFeedbacks(sessions) {
    const list = [];
    sessions.forEach((s, i) => {
      if (i % 3 !== 0) return;
      const rating = i % 5 === 0 ? 'dislike' : 'like';
      list.push({
        id: 'FB-' + String(5001 + list.length),
        sessionId: s.sessionId,
        userId: s.userId,
        userName: s.userName,
        question: s.lastQuestion,
        answer: s.messages[1]?.text || '—',
        rating,
        ratingLabel: rating === 'like' ? '点赞' : '点踩',
        ratingTime: s.messages[1]?.time || s.chatTime,
        comment: rating === 'dislike' ? pick(['回答不够具体', '未解决我的问题', '数据不准确'], i) : '',
        processed: false,
        processedAt: null,
        processedBy: null
      });
    });
    return list.sort((a, b) => b.ratingTime.localeCompare(a.ratingTime));
  }

  const QA_FB_KEY = 'agentQaFeedbackRecords';

  function readQaFeedbacks() {
    try {
      const raw = localStorage.getItem(QA_FB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const seed = buildFeedbacks(SESSIONS);
    try { localStorage.setItem(QA_FB_KEY, JSON.stringify(seed)); } catch (e) { /* ignore */ }
    return seed.slice();
  }

  function writeQaFeedbacks(list) {
    try { localStorage.setItem(QA_FB_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function inDateRange(timeStr, start, end) {
    const d = (timeStr || '').slice(0, 10);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }

  function exportSessionQaPairs(startDate, endDate) {
    const start = startDate || '2026-05-01';
    const end = endDate || '2026-05-31';
    const rows = [];
    SESSIONS.filter(s => inDateRange(s.chatTime, start, end)).forEach(s => {
      s.messages.forEach((m, i) => {
        if (m.role !== 'user') return;
        const next = s.messages[i + 1];
        const answer = next && next.role === 'assistant' ? next.text : '';
        rows.push({
          sessionId: s.sessionId,
          userId: s.userId,
          userName: s.userName,
          question: m.text,
          answer
        });
      });
    });
    return rows;
  }

  const SESSIONS = buildSessions();
  const QA_LIST = buildQaKnowledge();
  const FEEDBACKS = buildFeedbacks(SESSIONS);

  const DOCUMENTS = [
    { id: 'DOC-001', title: '流量收入指标口径说明', fileName: '流量收入指标口径说明.pdf', category: '指标口径' },
    { id: 'DOC-002', title: '指标树根因分析操作手册', fileName: '指标树根因分析操作手册.pdf', category: '系统操作' },
    { id: 'DOC-003', title: '5G智网流量贡献配置指南', fileName: '5G智网流量贡献配置指南.pdf', category: '流量运营' },
    { id: 'DOC-004', title: '预警规则配置规范', fileName: '预警规则配置规范.pdf', category: '监控预警' },
    { id: 'DOC-005', title: '调度派发与客群下发流程', fileName: '调度派发与客群下发流程.pdf', category: '策略调度' },
    { id: 'DOC-006', title: '指标看管人绑定说明', fileName: '指标看管人绑定说明.pdf', category: '配置管理' },
    { id: 'DOC-007', title: '流量超套客群定义与运营策略', fileName: '流量超套客群定义与运营策略.pdf', category: '流量运营' },
    { id: 'DOC-008', title: '策略审批流程说明', fileName: '策略审批流程说明.pdf', category: '策略调度' },
    { id: 'DOC-009', title: '客户标签同步与IOP对接说明', fileName: '客户标签同步与IOP对接说明.pdf', category: '客群标签' },
    { id: 'DOC-010', title: '运营工作台待办处理指南', fileName: '运营工作台待办处理指南.pdf', category: '系统操作' }
  ];

  const QUESTION_DOC_MAP = {
    '流量收入指标的业务口径是什么？': ['DOC-001'],
    '如何查看指标树的根因分析？': ['DOC-002'],
    '5G智网月流量贡献指标在哪里配置？': ['DOC-003'],
    '预警规则如何设置环比阈值？': ['DOC-004'],
    '客群调度任务怎么下发到地市？': ['DOC-005'],
    '指标看管人如何绑定？': ['DOC-006'],
    '流量超套客群定义是什么？': ['DOC-007'],
    '策略审批流程有哪些节点？': ['DOC-008'],
    '客户标签从哪里同步？': ['DOC-009'],
    '工作台待办任务如何办结？': ['DOC-010']
  };

  function getDocById(id) {
    return DOCUMENTS.find(d => d.id === id);
  }

  function resolveSources(question) {
    const ids = QUESTION_DOC_MAP[question] || [];
    if (ids.length) return ids.map(getDocById).filter(Boolean);
    const qLower = question.toLowerCase();
    if (qLower.includes('流量') || qLower.includes('收入')) return [getDocById('DOC-001')].filter(Boolean);
    if (qLower.includes('根因') || qLower.includes('指标树')) return [getDocById('DOC-002')].filter(Boolean);
    if (qLower.includes('预警') || qLower.includes('阈值')) return [getDocById('DOC-004')].filter(Boolean);
    return [];
  }

  function chatReply(question) {
    const q = String(question || '').trim();
    if (!q) return { answer: '', sources: [], hasAnswer: false };
    const enabled = (window.AgentQaStore ? AgentQaStore.getAll() : QA_LIST)
      .filter(r => r.status === 'enabled');
    const exact = enabled.find(r => r.question === q) ||
      QA_LIST.find(r => r.question === q);
    if (exact) {
      const noAns = exact.answer.startsWith('抱歉') || exact.answer.startsWith('该问题暂无');
      return {
        answer: exact.answer,
        sources: noAns ? [] : resolveSources(exact.question),
        hasAnswer: !noAns
      };
    }
    const fuzzy = enabled.find(r =>
      q.includes(r.question.slice(0, 8)) || r.question.includes(q.slice(0, 8))
    );
    if (fuzzy) {
      const noAns = fuzzy.answer.startsWith('抱歉') || fuzzy.answer.startsWith('该问题暂无');
      return {
        answer: fuzzy.answer,
        sources: noAns ? [] : resolveSources(fuzzy.question),
        hasAnswer: !noAns
      };
    }
    return {
      answer: '抱歉，当前知识库暂未收录该问题的标准答案。您可尝试换个问法，或联系系统管理员补充问答配置。',
      sources: [],
      hasAnswer: false
    };
  }

  function getQuickQuestions(limit) {
    const n = limit || 6;
    const list = (window.AgentQaStore ? AgentQaStore.getAll() : QA_LIST)
      .filter(r => r.status === 'enabled' && !r.answer.startsWith('抱歉') && !r.answer.startsWith('该问题暂无'));
    return list.slice(0, n).map(r => r.question);
  }

  const CHAT_GREETING = '您好，我是知识查询助手。您可以向我咨询指标口径、系统操作、策略调度等问题，也可以点击下方快捷问题开始对话。';

  window.AgentChatHistoryStore = {
    _key: 'agent-chat-widget-history',
    _list: [],
    _load() {
      try {
        const raw = localStorage.getItem(this._key);
        this._list = raw ? JSON.parse(raw) : [];
      } catch (e) {
        this._list = [];
      }
    },
    _save() {
      try {
        localStorage.setItem(this._key, JSON.stringify(this._list));
      } catch (e) { /* ignore */ }
    },
    getAll() {
      if (!this._list.length && !localStorage.getItem(this._key)) this._load();
      else if (!this._list.length) this._load();
      return this._list.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    getById(id) {
      return this.getAll().find(r => r.id === id);
    },
    upsert(conversation) {
      const idx = this._list.findIndex(r => r.id === conversation.id);
      if (idx >= 0) this._list[idx] = conversation;
      else this._list.unshift(conversation);
      this._save();
      return conversation;
    },
    updateTitle(id, title) {
      const row = this.getById(id);
      if (!row) return null;
      row.title = title;
      row.updatedAt = formatTime(new Date());
      this.upsert(row);
      return row;
    },
    remove(id) {
      this._list = this._list.filter(r => r.id !== id);
      this._save();
    }
  };
  AgentChatHistoryStore._load();

  window.AgentAssistantData = {
    sessions: SESSIONS,
    qaList: QA_LIST,
    feedbacks: FEEDBACKS,
    categories: QA_CATEGORIES,
    documents: DOCUMENTS,
    greeting: CHAT_GREETING,
    getQuickQuestions,
    chatReply,
    getDocById,
    docPreviewUrl(docId) {
      const base = location.pathname.includes('/pages/') ? 'agent-doc-preview.html' : 'pages/agent-doc-preview.html';
      return base + '?id=' + encodeURIComponent(docId);
    },
    analyzeUsage(startDate, endDate) {
      const start = startDate || '2026-05-01';
      const end = endDate || '2026-05-31';
      const inRange = SESSIONS.filter(s => inDateRange(s.chatTime, start, end));
      const userMap = {};
      inRange.forEach(s => {
        if (!userMap[s.userId]) {
          userMap[s.userId] = { userId: s.userId, userName: s.userName, sessions: 0, questions: 0 };
        }
        userMap[s.userId].sessions += 1;
        userMap[s.userId].questions += s.messageCount / 2 | 0;
      });
      const totalQuestions = inRange.reduce((sum, s) => sum + (s.messageCount / 2 | 0), 0);
      return {
        range: { start, end },
        totalSessions: inRange.length,
        totalQuestions,
        totalUsers: Object.keys(userMap).length,
        userStats: Object.values(userMap).sort((a, b) => b.sessions - a.sessions)
      };
    },
    exportSessionQaPairs
  };

  window.AgentQaFeedbackStore = {
    getAll() { return readQaFeedbacks(); },
    filter({ start, end, rating, kw } = {}) {
      return readQaFeedbacks().filter(r => {
        if (!inDateRange(r.ratingTime, start, end)) return false;
        if (rating && r.rating !== rating) return false;
        if (kw) {
          const blob = (r.userId + r.userName + r.question + r.answer).toLowerCase();
          if (!blob.includes(kw.toLowerCase())) return false;
        }
        return true;
      });
    },
    markProcessed(ids, operator) {
      const set = new Set(ids);
      const all = readQaFeedbacks();
      const now = formatTime(new Date());
      all.forEach(r => {
        if (set.has(r.id) && r.rating === 'dislike' && !r.processed) {
          r.processed = true;
          r.processedAt = now;
          r.processedBy = operator || '超级管理员';
        }
      });
      writeQaFeedbacks(all);
      return all;
    },
    unmarkProcessed(ids) {
      const set = new Set(ids);
      const all = readQaFeedbacks();
      all.forEach(r => {
        if (set.has(r.id) && r.rating === 'dislike' && r.processed) {
          r.processed = false;
          r.processedAt = null;
          r.processedBy = null;
        }
      });
      writeQaFeedbacks(all);
      return all;
    }
  };

  window.AgentQaStore = {
    _list: QA_LIST.map(r => ({ ...r })),
    getAll() { return this._list.slice(); },
    getById(id) { return this._list.find(r => r.id === id); },
    add(row) {
      const item = { ...row, id: 'QA-' + Date.now(), updatedAt: formatTime(new Date()) };
      this._list.unshift(item);
      return item;
    },
    update(id, patch) {
      const idx = this._list.findIndex(r => r.id === id);
      if (idx < 0) return null;
      this._list[idx] = { ...this._list[idx], ...patch, updatedAt: formatTime(new Date()) };
      return this._list[idx];
    },
    remove(id) {
      const idx = this._list.findIndex(r => r.id === id);
      if (idx >= 0) this._list.splice(idx, 1);
    },
    toggleStatus(id) {
      const row = this.getById(id);
      if (!row) return null;
      const next = row.status === 'enabled' ? 'disabled' : 'enabled';
      return this.update(id, { status: next });
    },
    importRows(rows) {
      rows.forEach(r => {
        if (!r.question || !r.answer) return;
        this.add({
          question: r.question,
          answer: r.answer,
          category: r.category || '系统操作',
          status: r.status === 'disabled' ? 'disabled' : 'enabled',
          hitCount: 0,
          updatedBy: r.updatedBy || '批量导入'
        });
      });
    }
  };
})();
