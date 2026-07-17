/** 根因分析：传导链路 → 异常指标 → 汇聚客群 */
window.RC_STEPS = [
  { id: 1, title: '传导链路' },
  { id: 2, title: '异常指标' },
  { id: 3, title: '汇聚客群' }
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 链路深度：链路1→1个上游，链路2→2个，链路3→3个，循环 */
function chainUpstreamCount(rank) {
  return ((rank - 1) % 3) + 1;
}

function deriveYoy(mom) {
  const m = String(mom || '');
  if (m.startsWith('-')) return '-2.8%';
  if (m.startsWith('+')) return '+1.6%';
  return '—';
}

function withTrendFields(m) {
  const mom = m.mom || '—';
  return { ...m, mom, yoy: m.yoy && m.yoy !== '—' ? m.yoy : deriveYoy(mom) };
}

function lookupMetricCaliber(name, node, branch) {
  if (node && node.name === name && node.caliber) return node.caliber;
  if (branch && branch.metric === name && branch.caliber) return branch.caliber;
  const pools = [window.TRAFFIC_FLOW_METRICS, window.METRIC_OPTIONS].filter(Boolean);
  for (let pi = 0; pi < pools.length; pi++) {
    const hit = (pools[pi] || []).find(x => x.name === name);
    if (hit && (hit.businessCaliber || hit.caliber)) return hit.businessCaliber || hit.caliber;
  }
  if (/关联度/.test(name)) {
    return `「${name}」：衡量该标签因子与异常指标联动波动的关联强度，数值越高说明传导解释力越强。`;
  }
  return `「${name}」：按统一业务口径汇总统计，用于根因传导链路中上下游指标联动的归因分析。`;
}

function pickUpstreamMetrics(branch, anomalyName, allBranches, count) {
  const pool = [];
  const pushUnique = m => {
    if (!m?.name || m.name === anomalyName) return;
    if (pool.some(x => x.name === m.name)) return;
    pool.push(withTrendFields(m));
  };

  pushUnique({ name: branch.metric, value: branch.value || '—', mom: branch.mom || '—' });
  (allBranches || []).forEach(b => pushUnique({ name: b.metric, value: b.value || '—', mom: b.mom || '—' }));
  (branch.tags || []).slice(0, 3).forEach((t, i) => {
    pushUnique({ name: t + '关联度', value: '—', mom: i % 2 ? '+2.1%' : '-1.4%' });
  });

  const fallbacks = ['上游传导指标A', '上游传导指标B', '上游传导指标C'];
  let fi = 0;
  while (pool.length < count && fi < fallbacks.length) {
    pushUnique({ name: fallbacks[fi], value: '—', mom: '—' });
    fi++;
  }
  return pool.slice(0, count);
}

/** 根因链路单条最多展示的指标数 */
const RC_CHAIN_MAX_METRICS = 4;

/**
 * 将分层链路压平为单链：同层多指标按顺序串联，去除重复节点，避免多指标汇聚到同一子指标。
 */
function linearizeChainLayers(chainLayers) {
  if (!Array.isArray(chainLayers) || !chainLayers.length) return [];
  const linear = [];
  const seen = new Set();
  chainLayers.forEach(layer => {
    const items = Array.isArray(layer) ? layer : [layer];
    items.forEach(m => {
      const name = m && m.name;
      if (!name || seen.has(name)) return;
      seen.add(name);
      linear.push(m);
    });
  });
  return linear;
}

/** 截断链路，保留靠近异常指标一侧的最多 RC_CHAIN_MAX_METRICS 个指标 */
function limitRootCauseChain(chain, terminalMetric) {
  if (!Array.isArray(chain) || chain.length <= RC_CHAIN_MAX_METRICS) return chain || [];
  const terminal = terminalMetric || chain[chain.length - 1]?.name;
  let start = chain.length - RC_CHAIN_MAX_METRICS;
  if (terminal) {
    const idx = chain.findIndex(m => m.name === terminal);
    if (idx >= 0) {
      start = Math.max(0, Math.min(start, idx - (RC_CHAIN_MAX_METRICS - 1)));
    }
  }
  return chain.slice(start, start + RC_CHAIN_MAX_METRICS);
}

function enrichMetricChainItem(m, node, branch) {
  return {
    ...withTrendFields(m),
    caliber: m.caliber || lookupMetricCaliber(m.name, node, branch)
  };
}

function buildBranchPortrait(branch) {
  const tags = (branch.tags || []).slice(0, 5);
  const baseContrib = branch.contrib || 30;
  const relations = ['且', '或', '且'];

  const tagItems = tags.map((name, i) => {
    const contribution = Math.max(10, Math.round(baseContrib * (1 - i * 0.16)));
    const valuePool = ['是', '高', '≥3次/月', '连续3月', '有查询'];
    return {
      name,
      value: valuePool[i % valuePool.length],
      contribution,
      relation: i > 0 ? relations[i % relations.length] : null,
      reason: contribution >= baseContrib * 0.7
        ? `该标签在本链路客群中命中率显著高于全量，对「${branch.segment?.name || '链路客群'}」解释力达 ${contribution}%`
        : `与链路内其他标签形成组合筛选，贡献度 ${contribution}%`
    };
  });

  const combinations = (branch.rules || []).map((r, i) => ({
    label: r.label,
    expr: r.expr,
    contribution: Math.max(15, Math.round(baseContrib * (0.88 - i * 0.12)))
  }));

  if (!combinations.length && tagItems.length >= 2) {
    combinations.push({
      label: '主组合',
      expr: tagItems.slice(0, 2).map(t => t.name).join(' AND '),
      contribution: Math.round(baseContrib * 0.82)
    });
  }

  return { tags: tagItems, combinations };
}

const RC_FALLBACK_BRANCH_TEMPLATES = [
  {
    metric: '关联传导指标B', value: '—', contrib: 22, mom: '+2.1%',
    tags: ['结构波动', '关联度偏高'],
    rules: [{ label: '组合A', expr: '结构波动 AND 关联度偏高' }],
    segments: [{ rule: '组合A', name: '链路关联客群B', scale: '6,820' }]
  },
  {
    metric: '关联传导指标C', value: '—', contrib: 18, mom: '-1.2%',
    tags: ['用量异动', '客群偏移'],
    rules: [{ label: '组合A', expr: '用量异动 OR 客群偏移' }],
    segments: [{ rule: '组合A', name: '链路关联客群C', scale: '5,460' }]
  }
];

function ensureBranchTemplates(templates) {
  const list = (templates || []).slice();
  let fi = 0;
  while (list.length < 3) {
    list.push(RC_FALLBACK_BRANCH_TEMPLATES[fi % RC_FALLBACK_BRANCH_TEMPLATES.length]);
    fi += 1;
  }
  return list.slice(0, 3);
}

function enrichBranchesWithChains(node, branches) {
  const anomalyName = node.name || '异常指标';

  return (branches || []).map((b, i) => {
    const rank = b.rank || i + 1;
    const upstreamCount = chainUpstreamCount(rank);
    let chainLayers = [];
    let chain;
    if ((b.chainLayers || []).length) {
      chain = linearizeChainLayers(b.chainLayers).map(m => enrichMetricChainItem(m, node, b));
    } else if ((b.chainMetrics || b.chain || []).length) {
      chain = (b.chainMetrics || b.chain).map(m => ({
        ...withTrendFields(m),
        caliber: m.caliber || lookupMetricCaliber(m.name, node, b)
      }));
    } else {
      chain = pickUpstreamMetrics(b, anomalyName, branches, upstreamCount).map(m => ({
        ...m,
        caliber: lookupMetricCaliber(m.name, node, b)
      }));
    }
    chain = limitRootCauseChain(chain, b.metric);

    const segList = b.segments || [];
    const segRaw = segList[0] || { name: (b.metric || '链路') + '关联客群', scale: '8,420' };
    const totalSegNum = segList.reduce((acc, s) => {
      const n = parseInt(String(s.scale || '').replace(/[^\d]/g, ''), 10);
      return acc + (n || 0);
    }, 0);
    const displayScale = totalSegNum > 0
      ? totalSegNum.toLocaleString('zh-CN')
      : String(segRaw.scale || '8,420');
    const scaleLabel = String(displayScale).includes('人') ? displayScale : displayScale + ' 人';
    const segment = {
      name: b.segmentName || segRaw.name,
      scale: displayScale,
      scaleLabel
    };

    return {
      ...b,
      rank,
      upstreamCount,
      chainLayers,
      chain,
      segment,
      portrait: typeof window.buildRcBranchPortraitData === 'function'
        ? window.buildRcBranchPortraitData({ ...b, segment })
        : buildBranchPortrait({ ...b, segment })
    };
  });
}

window.buildRootCauseData = function (node) {
  const isAlert = node.status === 'alert' || node.alert;
  const metricName = node.name || '';
  const useTraffic = typeof window.isTrafficFlowTreeNode === 'function' && window.isTrafficFlowTreeNode(node);
  const useChurn = !useTraffic && ((typeof window.isHeChurnTreeNode === 'function' && window.isHeChurnTreeNode(node))
    || (typeof window.isHeChurnMetricName === 'function' && window.isHeChurnMetricName(metricName)));
  const detectType = isAlert
    ? (useChurn || (node.id && String(node.id).includes('2')) ? 'rule' : 'model')
    : 'none';

  let branchTemplates;
  if (useTraffic && typeof window.getTrafficFlowRootCauseBranches === 'function') {
    branchTemplates = window.getTrafficFlowRootCauseBranches(node);
  } else if (useChurn && typeof window.getHeChurnRootCauseBranches === 'function') {
    branchTemplates = window.getHeChurnRootCauseBranches(metricName);
  } else if (metricName.includes('套外')) {
    branchTemplates = [
      {
        metric: '套餐内收入', value: '¥ 1,268万', contrib: 35, mom: '-3.1%',
        tags: ['中高端降档预警', '套餐降档倾向', 'ARPU连续下滑'],
        rules: [{ label: '组合A', expr: '中高端降档预警 AND 套餐降档倾向' }],
        segments: [{ rule: '组合A', name: '降档倾向高价值客群', scale: '12,840' }]
      },
      {
        metric: '超套流量费', value: '¥ 186万', contrib: 32, mom: '-4.2%',
        tags: ['套外高依赖', '流量突增未转化', '视频超套'],
        rules: [{ label: '组合A', expr: '套外高依赖 AND 流量突增未转化' }],
        segments: [{ rule: '组合A', name: '套外高依赖客群', scale: '8,320' }]
      },
      {
        metric: '定向包渗透率', value: '22.6%', contrib: 24, mom: '-1.8pp',
        tags: ['未办定向包', '视频流量占比高', '账单异议历史'],
        rules: [{ label: '组合A', expr: '未办定向包 AND 视频流量占比高' }],
        segments: [{ rule: '组合A', name: '定向包潜客客群', scale: '6,180' }]
      }
    ];
  } else {
    branchTemplates = [
      {
        metric: '套外收入', value: '¥ 428万', contrib: 36, mom: '-2.4%',
        tags: ['套外高依赖', '套餐外计费敏感'],
        rules: [{ label: '组合A', expr: '套外高依赖 AND 套餐外计费敏感' }],
        segments: [{ rule: '组合A', name: '套外敏感客群', scale: '9,560' }]
      },
      {
        metric: '营业厅办理量', value: '8,420 笔', contrib: 28, mom: '-18.2%',
        tags: ['低接触客群', '渠道流失风险'],
        rules: [{ label: '组合A', expr: '低接触客群 OR 渠道流失风险' }],
        segments: [{ rule: '组合A', name: '渠道流失风险客群', scale: '5,100' }]
      },
      {
        metric: 'APP活跃率', value: '41.2%', contrib: 20, mom: '-3.6pp',
        tags: ['APP活跃低', '自助渠道偏好'],
        rules: [{ label: '组合A', expr: 'APP活跃低 OR 自助渠道偏好' }],
        segments: [{ rule: '组合A', name: '低活跃客群', scale: '4,280' }]
      }
    ];
  }

  if (!isAlert) {
    return { isAlert: false, metricName: node.name, step1: { conclusion: '指标处于正常区间，未触发预警规则或模型异常检测。' }, branches: [] };
  }

  const step1Base = {
    value: node.value,
    mom: node.mom,
    yoy: node.yoy,
    detectSource: detectType,
    detectLabel: detectType === 'rule' ? '预警规则命中' : '模型检测发现',
    detectDetail: detectType === 'rule'
      ? '触发规则：波动率环比下降 > 2% 且连续 2 个周期'
      : '异常检测模型评分 0.87（阈值 0.75）'
  };
  const report = buildStep1Report(node, metricName, detectType, branchTemplates, step1Base);
  const templates = ensureBranchTemplates(branchTemplates);
  const rawBranches = templates.map((b, i) => ({ id: 'b' + i, rank: i + 1, ...b }));
  const branches = enrichBranchesWithChains(node, rawBranches);

  return {
    isAlert: true,
    metricName: node.name,
    step1: { ...step1Base, report },
    branches
  };
};

function buildStep1Report(node, metricName, detectType, branches, step1) {
  if (typeof window.buildStructuredAnomalyReport === 'function') {
    return window.buildStructuredAnomalyReport({
      metricName,
      detectType,
      detectSource: step1?.detectSource || detectType,
      branches,
      value: step1?.value || node?.value,
      mom: step1?.mom || node?.mom
    });
  }
  const topMetrics = branches.slice(0, 2).map(b => b.metric).join('、');
  return {
    title: '根因分析报告',
    summary: `「${metricName}」出现异常波动，${topMetrics} 贡献度居前。`,
    points: ['预警规则连续命中。'],
    generatedAt: '2026-05-20 09:30'
  };
}

function renderAnomalyCell(d, rowSpan) {
  const momCls = String(d.step1.mom || '').startsWith('-') ? 'neg' : 'pos';
  return `
    <div class="rc-cell rc-col-anomaly rc-anomaly-span rc-cell-row-center" style="grid-row:1 / span ${rowSpan};grid-column:2">
      <div class="rc-anomaly-wrap">
        <div class="anomaly-metric-card" id="anomaly-metric-card">
          <h4 class="rc-card-section-title">异常指标</h4>
          <strong class="rc-card-name anomaly-card-title">${esc(d.metricName)}</strong>
          <div class="rc-card-metrics anomaly-card-metrics">
            <span class="rc-card-value metric-val">${esc(d.step1.value)}</span>
            <span class="rc-card-trend rc-trend-yoy metric-yoy">同比 ${esc(d.step1.yoy || '—')}</span>
            <span class="rc-card-trend rc-trend-mom metric-mom ${momCls}">环比 ${esc(d.step1.mom || '—')}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderSegmentCell(agg, rowSpan, containerId) {
  const dispatchCompact = containerId === 'dispatch-root-cause-flow';
  const cardHtml = typeof window.renderAggregatedSegmentCard === 'function'
    ? window.renderAggregatedSegmentCard(agg, { idPrefix: 'rc-seg', minimal: true, dispatchCompact, rootCauseFlow: !dispatchCompact })
    : `<p class="segment-empty">暂无汇聚客群</p>`;
  return `
    <div class="rc-cell rc-col-agg rc-segment-span rc-cell-row-center" style="grid-row:1 / span ${rowSpan};grid-column:3">
      <div class="rc-segment-col-wrap rc-align-center" id="rc-segment-col-wrap">${cardHtml}</div>
    </div>`;
}

function renderChainNode(m, idx, total, isLastNode) {
  const momCls = String(m.mom || '').startsWith('-') ? 'neg' : 'pos';
  const isLast = isLastNode != null ? isLastNode : idx === total - 1;
  const caliber = m.caliber || lookupMetricCaliber(m.name);
  return `
    <div class="rc-chain-node${isLast ? ' rc-chain-node-last' : ''}" data-chain-idx="${idx}">
      <div class="rc-chain-node-head">
        <strong class="rc-card-name rc-chain-node-name">${esc(m.name)}</strong>
        <span class="icon-caliber-wrap rc-chain-metric-caliber" tabindex="0" aria-label="业务口径">
          <i class="fas fa-circle-info"></i>
          <span class="tooltip-caliber">${esc(caliber)}</span>
        </span>
      </div>
      <div class="rc-card-metrics rc-chain-node-stats">
        <span class="rc-card-value rc-chain-node-val">${esc(m.value)}</span>
        <span class="rc-card-trend rc-trend-mom rc-chain-node-mom ${momCls}">环比 ${esc(m.mom || '—')}</span>
      </div>
    </div>`;
}

function renderChainLayers(chainLayers) {
  const lastLayerIdx = chainLayers.length - 1;
  return chainLayers.map((layer, li) => `
      <div class="rc-chain-layer" data-layer="${li}">
        ${layer.map((m, ni) => renderChainNode(
          m,
          ni,
          layer.length,
          li === lastLayerIdx && ni === layer.length - 1
        )).join('')}
      </div>`).join('');
}

function renderBranchRow(b, rowIndex, opts) {
  const row = rowIndex + 1;
  const hideChainLlm = opts && opts.hideChainLlm;
  const seg = b.segment || {};
  const chainLayers = b.chainLayers || [];
  const chain = b.chain || [];
  const chainHtml = chainLayers.length
    ? `<div class="rc-metric-chain rc-metric-chain--dag">${renderChainLayers(chainLayers)}</div>`
    : `<div class="rc-metric-chain rc-metric-chain--converge">${chain.map((m, i) => renderChainNode(m, i, chain.length, i === chain.length - 1)).join('')}</div>`;
  const llmBtn = hideChainLlm ? '' : `
          <button type="button" class="btn btn-outline btn-sm btn-rc-chain-llm" data-branch-rank="${b.rank}">
            <i class="fas fa-wand-magic-sparkles"></i> 链路分析
          </button>`;
  return `
    <div class="rc-cell rc-col-chain rc-cell-row-center" style="grid-row:${row};grid-column:1">
      <div class="rc-chain-panel" id="rc-chain-panel-${b.rank}" data-branch-rank="${b.rank}">
        <div class="rc-chain-head">
          <h4 class="rc-card-section-title">指标根因链路 ${b.rank}</h4>${llmBtn}
        </div>
        ${chainHtml}
        <div class="rc-chain-segment-bar" id="rc-branch-seg-${b.rank}" data-branch-rank="${b.rank}">
          <div class="rc-chain-seg-sub">
            <span class="rc-card-scale rc-branch-seg-scale"><i class="fas fa-users"></i> ${esc(seg.scaleLabel || '—')}</span>
            <button type="button" class="btn btn-outline btn-sm btn-rc-chain-portrait" data-branch-rank="${b.rank}">
              <i class="fas fa-chart-pie"></i> 画像分析
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function ensureRcLinksSvg(grid) {
  let svg = grid.querySelector('.rc-links-overlay-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'rc-links-overlay-svg');
    svg.setAttribute('aria-hidden', 'true');
    grid.insertBefore(svg, grid.firstChild);
  }
  const w = Math.max(grid.scrollWidth, grid.offsetWidth);
  const h = Math.max(grid.scrollHeight, grid.offsetHeight);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.style.width = w + 'px';
  svg.style.height = h + 'px';
  return svg;
}

function anchorBoxEdge(svg, el, edge) {
  if (!svg || !el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const clientX = edge === 'right' ? r.right : edge === 'left' ? r.left : r.left + r.width / 2;
  const clientY = r.top + r.height / 2;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const sp = pt.matrixTransform(ctm.inverse());
  return { x: Math.round(sp.x), y: Math.round(sp.y) };
}

function anchorEdgeAtClientY(svg, el, edge, clientY) {
  if (!svg || !el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const y = Math.max(r.top + 4, Math.min(r.bottom - 4, clientY));
  const clientX = edge === 'right' ? r.right : edge === 'left' ? r.left : r.left + r.width / 2;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = y;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const sp = pt.matrixTransform(ctm.inverse());
  return { x: Math.round(sp.x), y: Math.round(sp.y) };
}

function buildBezierPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const c1x = Math.round(x1 + dx * 0.44);
  const c1y = Math.round(y1 + dy * 0.06);
  const c2x = Math.round(x2 - dx * 0.36);
  const c2y = Math.round(y2 - dy * 0.06);
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

function cubicBezierPoint(x0, y0, x1, y1, x2, y2, x3, y3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  return {
    x: uu * u * x0 + 3 * uu * t * x1 + 3 * u * tt * x2 + tt * t * x3,
    y: uu * u * y0 + 3 * uu * t * y1 + 3 * u * tt * y2 + tt * t * y3
  };
}

function pushContribLabel(labels, x, y, contrib) {
  if (contrib == null || contrib === '') return;
  const text = `影响程度 ${contrib}%`;
  const w = Math.max(84, text.length * 7 + 20);
  const hw = Math.round(w / 2);
  labels.push(
    `<g class="rc-flow-contrib-label" transform="translate(${Math.round(x)},${Math.round(y)})">` +
    `<rect class="rc-flow-contrib-bg" x="${-hw}" y="-11" width="${w}" height="22" rx="11"/>` +
    `<text class="rc-flow-contrib-text" text-anchor="middle" dominant-baseline="central">${text}</text>` +
    '</g>'
  );
}

function pushFlowGroup(paths, d, delaySec, extraClass) {
  const delay = delaySec != null ? delaySec : 0;
  const dur = 1.65;
  const begin = delay > 0 ? ` begin="${delay.toFixed(2)}s"` : '';
  const cls = extraClass ? `rc-flow-group ${extraClass}` : 'rc-flow-group';
  paths.push(
    `<g class="${cls}">` +
    `<path class="rc-flow-link-track" d="${d}"/>` +
    `<path class="rc-flow-link-energy" pathLength="100" d="${d}" stroke-dasharray="20 80">` +
    `<animate attributeName="stroke-dashoffset" values="100;0" dur="${dur}s" repeatCount="indefinite"${begin}/>` +
    '</path></g>'
  );
}

/** 链内指标间曲线传导：右缘中点 → 下一指标左缘中点 */
function drawInternalChainLink(paths, x1, y1, x2, y2) {
  if (x2 <= x1 + 4) return;
  const dx = x2 - x1;
  const c1x = Math.round(x1 + dx * 0.45);
  const c2x = Math.round(x2 - dx * 0.45);
  const d = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
  pushFlowGroup(paths, d);
}

/** 末指标 → 异常指标左边框（按末指标高度精确接入） */
function drawConvergeToAnomaly(paths, labels, start, lastNodeEl, anomalyCard, svg, contrib) {
  if (!start || !lastNodeEl || !anomalyCard) return;
  const lr = lastNodeEl.getBoundingClientRect();
  const clientY = lr.top + lr.height / 2;
  const end = anchorEdgeAtClientY(svg, anomalyCard, 'left', clientY);
  if (!end) return;

  let sx = start.x;
  let sy = start.y;
  if (end.x <= sx + 4) {
    const panel = lastNodeEl.closest('.rc-chain-panel');
    const panelRight = panel ? anchorBoxEdge(svg, panel, 'right') : null;
    const panelLeft = panel ? anchorBoxEdge(svg, panel, 'left') : null;
    if (panelRight && end.x > panelRight.x + 4) {
      sx = panelRight.x;
    } else if (panelLeft && end.x > panelLeft.x + 20) {
      sx = Math.round((panelLeft.x + end.x) / 2);
    } else {
      sx = end.x - 40;
    }
    sx = Math.min(sx, end.x - 12);
  }
  if (end.x <= sx + 4) return;

  const dx = end.x - sx;
  const dy = end.y - sy;
  const c1x = Math.round(sx + dx * 0.44);
  const c1y = Math.round(sy + dy * 0.06);
  const c2x = Math.round(end.x - dx * 0.36);
  const c2y = Math.round(end.y - dy * 0.06);
  const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
  pushFlowGroup(paths, d);
  const mid = cubicBezierPoint(sx, sy, c1x, c1y, c2x, c2y, end.x, end.y, 0.5);
  pushContribLabel(labels, mid.x, mid.y, contrib);
}

function drawFlowSmoothLink(paths, x1, y1, x2, y2) {
  if (Math.abs(x2 - x1) < 3 && Math.abs(y2 - y1) < 3) return;
  pushFlowGroup(paths, buildBezierPath(x1, y1, x2, y2));
}

function bindRcSegmentActions() {
  if (typeof window.bindAggregatedSegmentActions === 'function') {
    const wrap = document.getElementById('rc-segment-col-wrap');
    if (wrap) window.bindAggregatedSegmentActions(wrap, 'rc-seg', window._rcAggregatedSegment);
  }
}

function bindRcBranchPortraitActions(branches) {
  const grid = document.getElementById('rc-canvas-grid');
  if (!grid) return;
  grid.querySelectorAll('.btn-rc-chain-portrait').forEach(btn => {
    btn.addEventListener('click', () => {
      const rank = parseInt(btn.dataset.branchRank, 10);
      const branch = (branches || window._rcBranchData || []).find(b => b.rank === rank);
      if (typeof window.openRcChainPortraitModal === 'function') {
        window.openRcChainPortraitModal(branch);
      }
    });
  });
}

function wireRcBranchLlmActions(d, branches) {
  if (typeof window.bindRcBranchLlmActions !== 'function') return;
  window.bindRcBranchLlmActions(branches, {
    metricName: d.metricName,
    value: d.step1?.value,
    mom: d.step1?.mom,
    yoy: d.step1?.yoy,
    detectLabel: d.step1?.detectLabel
  });
}

/** 传导链路 → 异常指标 → 汇聚客群 */
window.layoutRcAllOverlayLinks = function () {
  const grid = document.getElementById('rc-canvas-grid');
  const anomalyCard = document.getElementById('anomaly-metric-card');
  if (!grid || !anomalyCard) return;

  const svg = ensureRcLinksSvg(grid);
  const paths = [];
  const labels = [];

  grid.querySelectorAll('.rc-chain-panel').forEach(panel => {
    const rank = parseInt(panel.dataset.branchRank, 10);
    const branch = (window._rcBranchData || []).find(b => b.rank === rank);
    const contrib = branch?.contrib;
    const layers = [...panel.querySelectorAll('.rc-chain-layer')];

    if (layers.length) {
      for (let li = 0; li < layers.length - 1; li++) {
        const fromNodes = [...layers[li].querySelectorAll('.rc-chain-node')];
        const toNodes = [...layers[li + 1].querySelectorAll('.rc-chain-node')];
        const pairs = Math.min(fromNodes.length, toNodes.length);
        for (let pi = 0; pi < pairs; pi++) {
          const from = anchorBoxEdge(svg, fromNodes[pi], 'right');
          const to = anchorBoxEdge(svg, toNodes[pi], 'left');
          if (from && to) drawInternalChainLink(paths, from.x, from.y, to.x, to.y);
        }
      }
      const lastLayer = layers[layers.length - 1];
      const lastNode = lastLayer.querySelector('.rc-chain-node-last')
        || lastLayer.querySelector('.rc-chain-node:last-child');
      if (lastNode) {
        const start = anchorBoxEdge(svg, lastNode, 'right');
        drawConvergeToAnomaly(paths, labels, start, lastNode, anomalyCard, svg, contrib);
      }
      return;
    }

    const nodes = [...panel.querySelectorAll('.rc-chain-node')];
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = anchorBoxEdge(svg, nodes[i], 'right');
      const to = anchorBoxEdge(svg, nodes[i + 1], 'left');
      if (from && to) drawInternalChainLink(paths, from.x, from.y, to.x, to.y);
    }
    const lastNode = panel.querySelector('.rc-chain-node-last') || nodes[nodes.length - 1];
    if (lastNode) {
      const start = anchorBoxEdge(svg, lastNode, 'right');
      drawConvergeToAnomaly(paths, labels, start, lastNode, anomalyCard, svg, contrib);
    }
  });

  const aggCard = document.querySelector('#rc-segment-col-wrap .agg-segment-main-card')
    || document.querySelector('#rc-segment-col-wrap .agg-segment-hero');
  if (aggCard && anomalyCard) {
    const anomalyOut = anchorBoxEdge(svg, anomalyCard, 'right');
    const aggIn = anchorBoxEdge(svg, aggCard, 'left');
    if (anomalyOut && aggIn) {
      drawFlowSmoothLink(paths, anomalyOut.x, anomalyOut.y, aggIn.x, aggIn.y);
    }
  }

  const linkLayer = svg.querySelector('g.rc-links-layer');
  const pathHtml = paths.join('');
  const labelHtml = labels.join('');
  if (linkLayer) {
    linkLayer.innerHTML = pathHtml;
  } else {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'rc-links-layer');
    g.innerHTML = pathHtml;
    svg.appendChild(g);
  }
  let labelLayer = svg.querySelector('g.rc-contrib-labels-layer');
  if (!labelLayer) {
    labelLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelLayer.setAttribute('class', 'rc-contrib-labels-layer');
    svg.appendChild(labelLayer);
  }
  labelLayer.innerHTML = labelHtml;
};

window.layoutRcMetricToForestLinks = window.layoutRcAllOverlayLinks;
window.layoutAnomalyLinks = window.layoutRcAllOverlayLinks;

window.syncRcCol3Width = function () {
  const grid = document.getElementById('rc-canvas-grid');
  if (!grid?.classList.contains('rc-canvas-grid-3')) return;

  const RC_COL_GAP = 14;
  grid.style.width = '100%';
  grid.style.maxWidth = '100%';
  grid.style.columnGap = `${RC_COL_GAP}px`;
  grid.style.justifyItems = 'stretch';

  const hasSegment = !!grid.querySelector('.rc-col-agg');
  // 左：最宽链路卡片 · 中：弹性区（异常指标居中）· 右：异动客群贴边
  grid.style.gridTemplateColumns = hasSegment
    ? 'max-content 1fr max-content'
    : 'max-content 1fr';
};

function scheduleRcLayouts() {
  bindAnomalyLinksRelayout();
  requestAnimationFrame(() => {
    if (typeof window.syncRcCol3Width === 'function') window.syncRcCol3Width();
    requestAnimationFrame(() => {
      if (typeof window.syncRcCol3Width === 'function') window.syncRcCol3Width();
      requestAnimationFrame(() => {
        if (typeof window.layoutRcAllOverlayLinks === 'function') window.layoutRcAllOverlayLinks();
        requestAnimationFrame(() => {
          if (typeof window.layoutRcAllOverlayLinks === 'function') window.layoutRcAllOverlayLinks();
        });
      });
    });
  });
}

window.scheduleRcTagLayouts = scheduleRcLayouts;

function bindAnomalyLinksRelayout() {
  if (window._rcLinkRelayoutBound) return;
  window._rcLinkRelayoutBound = true;
  const relayout = () => requestAnimationFrame(() => scheduleRcLayouts());
  const scrollEl = document.querySelector('.rc-canvas-scroll') || document.querySelector('.rc-matrix-wrap');
  const modalBody = document.querySelector('#modal-metric-detail .modal-body');
  scrollEl?.addEventListener('scroll', relayout, { passive: true });
  modalBody?.addEventListener('scroll', relayout, { passive: true });
  window.addEventListener('resize', relayout);
}

window.renderRootCauseFlow = function (node, containerId) {
  const el = document.getElementById(containerId || 'root-cause-flow');
  if (!el) return;
  const d = buildRootCauseData(node);

  if (!d.isAlert) {
    window._rcAggregatedSegment = null;
    window._rcBranchData = [];
    el.innerHTML = `
      <div class="rc-matrix-wrap">
        <div class="rc-canvas-scroll">
        <div class="rc-canvas-grid rc-canvas-normal">
          <div class="rc-flow-normal">
            <i class="fas fa-circle-check"></i>
            <p><strong>${esc(d.metricName)}</strong> 当前无异常</p>
            <p class="sub">${esc(d.step1.conclusion)}</p>
          </div>
        </div>
        </div>
      </div>`;
    return;
  }

  const n = d.branches.length;
  window._rcBranchData = d.branches;

  let agg = null;
  if (typeof window.buildRcAggregatedSegment === 'function') {
    agg = window.buildRcAggregatedSegment(node, d);
    agg.nodeId = node.id;
    const treeParams = new URLSearchParams(location.search);
    const rawTreeId = treeParams.get('id') || window.DEMO_SCENARIO?.treeId || '';
    if (rawTreeId) {
      agg.treeId = typeof window.resolveInsightTreeId === 'function'
        ? window.resolveInsightTreeId(rawTreeId)
        : rawTreeId;
    }
    window._rcAggregatedSegment = agg;
  }

  const isDispatchCompact = containerId === 'dispatch-root-cause-flow';
  const hideChainLlm = !isDispatchCompact;

  const chainMatrixHtml = `
    <div class="rc-matrix-wrap rc-report-matrix" style="--branch-rows:${n}">
      <div class="rc-canvas-scroll">
        <div class="rc-canvas-grid rc-canvas-grid-3" id="rc-canvas-grid">
          ${d.branches.map((b, i) => renderBranchRow(b, i, { hideChainLlm })).join('')}
          ${renderAnomalyCell(d, n)}
          ${agg ? renderSegmentCell(agg, n, containerId) : ''}
        </div>
      </div>
    </div>`;

  if (!isDispatchCompact && typeof window.renderRcAnalysisReport === 'function') {
    window._rcAnomalyReport = d.step1.report;
    window.renderRcAnalysisReport(d, node, containerId, {
      renderChainSectionHtml: () => chainMatrixHtml,
      afterRender: () => {
        bindRcSegmentActions();
        bindRcBranchPortraitActions(d.branches);
        scheduleRcLayouts();
      }
    });
    return;
  }

  el.innerHTML = `
    <div class="rc-matrix-wrap rc-report-matrix" style="--branch-rows:${n}">
      <div class="rc-canvas-scroll">
        <div class="rc-canvas-grid rc-canvas-grid-3" id="rc-canvas-grid">
          ${d.branches.map((b, i) => renderBranchRow(b, i, { hideChainLlm })).join('')}
          ${renderAnomalyCell(d, n)}
          ${agg ? renderSegmentCell(agg, n, containerId) : ''}
        </div>
      </div>
    </div>`;
  window._rcAnomalyReport = d.step1.report;
  bindRcSegmentActions();
  bindRcBranchPortraitActions(d.branches);
  wireRcBranchLlmActions(d, d.branches);
  scheduleRcLayouts();
};
