/** 策略诊断/审核评价数据与存储 */
(function () {
  const DIAG_KEY = 'agentDiagnosisFeedbackRecords';
  const AUDIT_KEY = 'agentAuditFeedbackRecords';

  function read(key, seed) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    write(key, seed);
    return seed.slice();
  }

  function write(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function nextId(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }

  function inRange(timeStr, start, end) {
    const d = (timeStr || '').slice(0, 10);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }

  function buildDiagnosisSeed() {
    const rows = [
      { strategyId: '10008320', ruleCategory: '策略基本信息', ruleName: '电热问候2222', checkField: '策略名称', rating: 'like', ratingTime: '2025-12-29 18:00:15' },
      { strategyId: '10008320', ruleCategory: '策略渠道信息', ruleName: '活动用语敏感词诊断', checkField: '活动用语', rating: 'dislike', ratingTime: '2025-12-29 15:02:21', comment: '敏感词识别不准确' },
      { strategyId: '1003583', ruleCategory: '策略客群信息', ruleName: '策略间重叠客群规模诊断', checkField: '重叠客群规模', rating: 'like', ratingTime: '2025-12-29 14:21:22' },
      { strategyId: '10008263', ruleCategory: '策略基本信息', ruleName: '投放周期诊断', checkField: '投放周期', rating: 'like', ratingTime: '2025-12-29 14:21:40' },
      { strategyId: '10008401', ruleCategory: '策略客群信息', ruleName: '客群规模诊断', checkField: '客群规则', rating: 'dislike', ratingTime: '2025-12-28 16:30:11', comment: '规模预估偏差较大' },
      { strategyId: '10008355', ruleCategory: '策略渠道信息', ruleName: '渠道规则诊断', checkField: '渠道规则', rating: 'like', ratingTime: '2025-12-28 11:05:33' },
      { strategyId: '10008290', ruleCategory: '策略基本信息', ruleName: '策略名称诊断', checkField: '策略名称', rating: 'like', ratingTime: '2025-12-27 09:18:44' },
      { strategyId: '10008422', ruleCategory: '策略客群信息', ruleName: '客群标签诊断', checkField: '客群规则', rating: 'dislike', ratingTime: '2025-12-26 17:42:08', comment: '标签过期未提示' },
      { strategyId: '10008312', ruleCategory: '策略渠道信息', ruleName: '渠道规则诊断', checkField: '渠道规则', rating: 'like', ratingTime: '2025-12-26 14:55:19' },
      { strategyId: '10008378', ruleCategory: '策略基本信息', ruleName: '投放周期诊断', checkField: '投放周期', rating: 'like', ratingTime: '2025-12-25 10:22:37' },
      { strategyId: '10008450', ruleCategory: '策略产品信息', ruleName: '产品规则诊断', checkField: '产品规则', rating: 'dislike', ratingTime: '2025-12-24 15:11:02', comment: '产品互斥判断有误' },
      { strategyId: '10008201', ruleCategory: '策略客群信息', ruleName: '客群规模诊断', checkField: '客群规则', rating: 'like', ratingTime: '2025-12-24 09:40:55' },
      { strategyId: '10008501', ruleCategory: '策略渠道信息', ruleName: '活动用语敏感词诊断', checkField: '活动用语', rating: 'like', ratingTime: '2025-12-23 18:33:21' },
      { strategyId: '10008463', ruleCategory: '策略基本信息', ruleName: '策略名称诊断', checkField: '策略名称', rating: 'dislike', ratingTime: '2025-12-23 11:20:44', comment: '命名规范建议不清晰' },
      { strategyId: '10008320', ruleCategory: '策略客群信息', ruleName: '客群标签诊断', checkField: '客群规则', rating: 'like', ratingTime: '2025-12-22 16:08:12' },
      { strategyId: '10008263', ruleCategory: '策略渠道信息', ruleName: '渠道规则诊断', checkField: '渠道规则', rating: 'like', ratingTime: '2025-12-22 10:15:33' },
      { strategyId: '1003583', ruleCategory: '策略基本信息', ruleName: '投放周期诊断', checkField: '投放周期', rating: 'like', ratingTime: '2025-12-21 14:44:28' },
      { strategyId: '10008422', ruleCategory: '策略产品信息', ruleName: '产品规则诊断', checkField: '产品规则', rating: 'dislike', ratingTime: '2025-12-20 09:55:17', comment: '未识别产品依赖冲突' },
      { strategyId: '10008355', ruleCategory: '策略客群信息', ruleName: '策略间重叠客群规模诊断', checkField: '重叠客群规模', rating: 'like', ratingTime: '2025-12-19 17:30:06' },
      { strategyId: '10008290', ruleCategory: '策略渠道信息', ruleName: '活动用语敏感词诊断', checkField: '活动用语', rating: 'like', ratingTime: '2025-12-18 11:12:49' },
      { strategyId: '10008401', ruleCategory: '策略基本信息', ruleName: '策略名称诊断', checkField: '策略名称', rating: 'like', ratingTime: '2025-12-17 15:28:33' },
      { strategyId: '10008378', ruleCategory: '策略客群信息', ruleName: '客群规模诊断', checkField: '客群规则', rating: 'dislike', ratingTime: '2025-12-16 10:05:22', comment: '诊断结论与人工复核不一致' },
      { strategyId: '10008501', ruleCategory: '策略渠道信息', ruleName: '渠道规则诊断', checkField: '渠道规则', rating: 'like', ratingTime: '2025-12-15 14:18:41' },
      { strategyId: '10008201', ruleCategory: '策略基本信息', ruleName: '投放周期诊断', checkField: '投放周期', rating: 'like', ratingTime: '2025-12-14 09:33:15' },
      { strategyId: '10008450', ruleCategory: '策略客群信息', ruleName: '客群标签诊断', checkField: '客群规则', rating: 'like', ratingTime: '2025-12-13 16:42:58' },
      { strategyId: '10008312', ruleCategory: '策略产品信息', ruleName: '产品规则诊断', checkField: '产品规则', rating: 'dislike', ratingTime: '2025-12-12 11:27:36', comment: '建议缺少可执行说明' }
    ];
    return rows.map((r, i) => ({
      id: 'DF-' + String(i + 1).padStart(4, '0'),
      evaluator: '超级管理员',
      processed: false,
      processedAt: null,
      processedBy: null,
      ...r
    }));
  }

  function buildAuditSeed() {
    const rows = [
      { strategyId: '10008422', ruleCategory: '策略客群信息', ruleName: '可执行客群规模审核', checkField: '可执行客群规模', rating: 'like', ratingTime: '2025-12-26 14:12:34' },
      { strategyId: '10008320', ruleCategory: '策略渠道信息', ruleName: '活动用语敏感词审核', checkField: '活动用语', rating: 'dislike', ratingTime: '2025-12-26 09:11:06', comment: '误判正常营销用语' },
      { strategyId: '10008463', ruleCategory: '策略客群信息', ruleName: '策略间重叠客群规模审核', checkField: '重叠客群规模', rating: 'dislike', ratingTime: '2025-12-26 09:11:06', comment: '重叠规模计算偏高' },
      { strategyId: '10008312', ruleCategory: '策略基本信息', ruleName: '策略基本信息审核', checkField: '策略基本信息', rating: 'like', ratingTime: '2025-12-26 09:11:06' },
      { strategyId: '10008263', ruleCategory: '策略排期与渠道', ruleName: '策略排期信息审核', checkField: '策略排期信息', rating: 'like', ratingTime: '2025-12-25 16:20:11' },
      { strategyId: '10008355', ruleCategory: '外呼管控', ruleName: '区域外呼审核', checkField: '区域外呼', rating: 'dislike', ratingTime: '2025-12-25 10:05:44', comment: '外呼配额提示不明确' },
      { strategyId: '10008401', ruleCategory: '策略客群信息', ruleName: '策略客群信息审核', checkField: '策略客群信息', rating: 'like', ratingTime: '2025-12-24 14:33:28' },
      { strategyId: '10008290', ruleCategory: '策略产品信息', ruleName: '策略产品信息审核', checkField: '策略产品信息', rating: 'like', ratingTime: '2025-12-23 11:18:52' },
      { strategyId: '10008378', ruleCategory: '策略渠道信息', ruleName: '渠道执行时间审核', checkField: '渠道执行时间', rating: 'dislike', ratingTime: '2025-12-22 09:42:17', comment: '节假日规则未识别' },
      { strategyId: '10008450', ruleCategory: '策略基本信息', ruleName: '策略敏感词审核', checkField: '敏感词', rating: 'like', ratingTime: '2025-12-21 15:55:03' },
      { strategyId: '10008501', ruleCategory: '策略客群信息', ruleName: '策略转化率审核', checkField: '策略转化率', rating: 'like', ratingTime: '2025-12-20 10:28:41' },
      { strategyId: '10008201', ruleCategory: '外呼管控', ruleName: '策略独立排呼审核', checkField: '独立排呼', rating: 'dislike', ratingTime: '2025-12-19 17:11:29', comment: '排呼上限建议不合理' }
    ];
    return rows.map((r, i) => ({
      id: 'AF-' + String(i + 1).padStart(4, '0'),
      evaluator: '超级管理员',
      processed: false,
      processedAt: null,
      processedBy: null,
      ...r
    }));
  }

  function createStore(key, seedBuilder, usageType) {
    return {
      getAll() { return read(key, seedBuilder()); },
      saveAll(list) { write(key, list); },
      deleteByIds(ids) {
        const set = new Set(ids);
        const next = read(key, seedBuilder()).filter(r => !set.has(r.id));
        write(key, next);
        return next.length;
      },
      markProcessed(ids, operator) {
        const set = new Set(ids);
        const all = read(key, seedBuilder());
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        all.forEach(r => {
          if (set.has(r.id) && r.rating === 'dislike' && !r.processed) {
            r.processed = true;
            r.processedAt = now;
            r.processedBy = operator || '超级管理员';
          }
        });
        write(key, all);
        return all;
      },
      unmarkProcessed(ids) {
        const set = new Set(ids);
        const all = read(key, seedBuilder());
        all.forEach(r => {
          if (set.has(r.id) && r.rating === 'dislike' && r.processed) {
            r.processed = false;
            r.processedAt = null;
            r.processedBy = null;
          }
        });
        write(key, all);
        return all;
      },
      filter({ start, end, rating, kw } = {}) {
        return read(key, seedBuilder()).filter(r => {
          if (!inRange(r.ratingTime, start, end)) return false;
          if (rating && r.rating !== rating) return false;
          if (kw) {
            const blob = (r.strategyId + r.ruleCategory + r.ruleName + r.checkField + r.evaluator).toLowerCase();
            if (!blob.includes(kw.toLowerCase())) return false;
          }
          return true;
        });
      },
      getReportStats(start, end) {
        const list = read(key, seedBuilder()).filter(r => inRange(r.ratingTime, start, end));
        const likes = list.filter(r => r.rating === 'like').length;
        const dislikes = list.filter(r => r.rating === 'dislike').length;
        const processedDislikes = list.filter(r => r.rating === 'dislike' && r.processed).length;
        const pendingDislikes = dislikes - processedDislikes;
        const byCategory = {};
        list.forEach(r => {
          byCategory[r.ruleCategory] = byCategory[r.ruleCategory] || { like: 0, dislike: 0 };
          byCategory[r.ruleCategory][r.rating]++;
        });
        const byRule = {};
        list.forEach(r => {
          byRule[r.ruleName] = byRule[r.ruleName] || { like: 0, dislike: 0 };
          byRule[r.ruleName][r.rating]++;
        });
        return { total: list.length, likes, dislikes, processedDislikes, pendingDislikes, byCategory, byRule };
      },
      getUsageStats(start, end) {
        let taskCount = 0;
        let strategyCount = 0;
        if (usageType === 'diagnosis') {
          const records = window.AgentDiagnosisStore?.getRecords?.() || [];
          const inPeriod = records.filter(r => inRange(r.triggeredAt || r.createdAt, start, end));
          taskCount = inPeriod.length;
          strategyCount = inPeriod.reduce((n, r) => n + (r.strategyCount || 1), 0);
        } else {
          const records = window.AgentAuditStore?.getRecords?.() || [];
          const inPeriod = records.filter(r => inRange(r.triggeredAt || r.completedAt, start, end));
          taskCount = inPeriod.length;
          strategyCount = inPeriod.reduce((n, r) => n + (r.strategyCount || 0), 0);
        }
        const feedbackInPeriod = read(key, seedBuilder()).filter(r => inRange(r.ratingTime, start, end));
        const evaluators = new Set(feedbackInPeriod.map(r => r.evaluator)).size;
        const coverage = strategyCount > 0 ? Math.min(100, Math.round((feedbackInPeriod.length / strategyCount) * 100)) : 0;
        return {
          taskCount: taskCount || (usageType === 'diagnosis' ? 18 : 6),
          strategyCount: strategyCount || (usageType === 'diagnosis' ? 42 : 28),
          feedbackCount: feedbackInPeriod.length,
          evaluatorCount: evaluators || 3,
          coverage: coverage || Math.round((feedbackInPeriod.length / 30) * 100)
        };
      }
    };
  }

  window.AgentDiagnosisFeedbackStore = createStore(DIAG_KEY, buildDiagnosisSeed, 'diagnosis');
  window.AgentAuditFeedbackStore = createStore(AUDIT_KEY, buildAuditSeed, 'audit');
})();
