/** 单条指标根因链路 · 链路分析 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parseMom(val) {
    const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function buildBranchSteps(branch, anomalyMeta) {
    const steps = (branch.chain || []).map(m => ({
      name: m.name,
      value: m.value || '—',
      mom: m.mom || '—',
      isAnomaly: false
    }));
    const leaf = branch.metric;
    if (leaf && !steps.some(s => s.name === leaf)) {
      steps.push({
        name: leaf,
        value: branch.value || '—',
        mom: branch.mom || '—',
        isAnomaly: false,
        isLeaf: true
      });
    } else if (leaf) {
      steps.forEach(s => { if (s.name === leaf) s.isLeaf = true; });
    }
    steps.push({
      name: anomalyMeta.metricName || '异常指标',
      value: anomalyMeta.value || '—',
      mom: anomalyMeta.mom || '—',
      isAnomaly: true
    });
    return steps;
  }

  function pickKeyImpactMetric(steps, branch) {
    const candidates = steps.filter(s => !s.isAnomaly);
    if (!candidates.length) return null;
    let best = candidates[0];
    let bestScore = -1;
    candidates.forEach((s, i) => {
      let score = Math.abs(parseMom(s.mom));
      if (s.name === branch.metric || s.isLeaf) score += 10;
      if (i === candidates.length - 1) score += 4;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    });
    return best;
  }

  function buildBranchLlmContext(branch, anomalyMeta) {
    const steps = buildBranchSteps(branch, anomalyMeta);
    const keyMetric = pickKeyImpactMetric(steps, branch);
    const pathText = steps.map(s => s.name).join(' → ');
    return {
      rank: branch.rank || 1,
      pathText,
      steps,
      keyMetric,
      branchContrib: branch.contrib ?? '—',
      segmentName: branch.segment?.name || '—',
      segmentScale: branch.segment?.scaleLabel || branch.segment?.scale || '—',
      tags: (branch.tags || []).slice(0, 4),
      ruleExpr: branch.rules?.[0]?.expr || '',
      anomalyMeta
    };
  }

  function renderMetricBriefList(steps) {
    return steps.map(s => {
      const momCls = parseMom(s.mom) < 0 ? 'neg' : 'pos';
      const tag = s.isAnomaly ? ' <span class="rc-llm-metric-tag">异常结果</span>' : '';
      return `<li><strong>${esc(s.name)}</strong>${tag} · ${esc(s.value)} · 环比 <span class="${momCls}">${esc(s.mom)}</span></li>`;
    }).join('');
  }

  function generateBranchAnalysis(ctx, opts) {
    const inline = opts && opts.inline;
    const am = ctx.anomalyMeta || {};
    const key = ctx.keyMetric;
    const keyMom = parseMom(key?.mom);
    const momNeg = String(am.mom).startsWith('-');
    const flowMetrics = ctx.steps.filter(s => !s.isAnomaly);
    const headingTag = inline ? 'h4' : 'h3';

    if (inline) {
      return '';
    }

    const keyExplain = key
      ? `其中<strong>「${esc(key.name)}」</strong>对结果指标影响最大（当前 ${esc(key.value)}，环比 <span class="${keyMom < 0 ? 'neg' : 'pos'}">${esc(key.mom)}</span>），建议优先从该指标入手开展运营。`
      : '';

    const tagHint = ctx.tags.length
      ? `关联客群「${esc(ctx.segmentName)}」（${esc(ctx.segmentScale)}），可结合 ${ctx.tags.slice(0, 3).join('、')} 等标签缩小运营范围。`
      : `关联客群「${esc(ctx.segmentName)}」（${esc(ctx.segmentScale)}）。`;

    const opsSuggestions = [
      `优先盯防「${key?.name || '关键指标'}」，开展专项复盘与纠偏动作，避免问题向「${am.metricName}」进一步放大。`,
      tagHint,
      '7 天后回溯关键指标与结果指标变化，评估运营成效。'
    ];

    return `
      <h3>链路分析</h3>
      <div class="rc-llm-analysis-unified">
        <p>
          本条为<strong>指标根因链路 ${ctx.rank}</strong>，对「<strong>${esc(am.metricName)}</strong>」（${esc(am.value)}，环比 ${esc(am.mom)}）的解释贡献为 <strong>${ctx.branchContrib}%</strong>。
          链路按 <span class="rc-llm-path-inline">${esc(ctx.pathText)}</span> 依次关联，涉及 ${flowMetrics.length} 个过程指标。
          ${keyExplain}
        </p>
        <ul class="rc-llm-metric-brief-list">${renderMetricBriefList(ctx.steps)}</ul>
      </div>
      <${headingTag} class="rc-llm-ops-title">运营建议</${headingTag}>
      <p>建议<strong>从「${esc(key?.name || '关键指标')}」入手</strong>，而非仅对结果指标「${esc(am.metricName)}」做泛化干预。${momNeg ? '当前指标呈走弱态势，宜尽快在驱动侧采取针对性措施。' : '当前以结构性波动为主，宜精准施策、避免过度干预。'}</p>
      <ul class="rc-ai-list">${opsSuggestions.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
  }

  function buildAnomalyMeta(anomalyMeta) {
    const meta = anomalyMeta || {};
    return {
      metricName: meta.metricName || '异常指标',
      value: meta.value || '—',
      mom: meta.mom || '—',
      yoy: meta.yoy || '—',
      detectLabel: meta.detectLabel || '异常检测'
    };
  }

  window.renderRcBranchAnalysisHtml = function (branch, anomalyMeta, opts) {
    if (!branch) return '';
    const llmCtx = buildBranchLlmContext(branch, buildAnomalyMeta(anomalyMeta));
    return generateBranchAnalysis(llmCtx, opts);
  };

  window.openRcChainLlmModal = function (branch, anomalyMeta) {
    if (!branch) return;
    const modalId = 'modal-rc-chain-llm';
    const bodyEl = document.getElementById('rc-chain-llm-body');
    const titleEl = document.getElementById('rc-chain-llm-title');
    const subEl = document.getElementById('rc-chain-llm-subtitle');
    if (!bodyEl) return;

    const rank = branch.rank || 1;
    const meta = anomalyMeta || {};
    const llmCtx = buildBranchLlmContext(branch, buildAnomalyMeta(anomalyMeta));

    if (titleEl) titleEl.textContent = `链路分析 · 指标根因链路 ${rank}`;
    if (subEl) {
      subEl.textContent = `解释贡献 ${llmCtx.branchContrib}% · 目标指标 ${meta.metricName || '—'}`;
    }

    bodyEl.innerHTML = `<div class="rc-chain-llm-content llm-content">${generateBranchAnalysis(llmCtx)}</div>`;
    if (typeof openModal === 'function') openModal(modalId);
  };

  window.bindRcBranchLlmActions = function (branches, anomalyMeta) {
    const grid = document.getElementById('rc-canvas-grid');
    if (!grid) return;
    grid.querySelectorAll('.btn-rc-chain-llm').forEach(btn => {
      btn.addEventListener('click', () => {
        const rank = parseInt(btn.dataset.branchRank, 10);
        const branch = (branches || window._rcBranchData || []).find(b => b.rank === rank);
        if (branch) window.openRcChainLlmModal(branch, anomalyMeta);
      });
    });
  };
})();
