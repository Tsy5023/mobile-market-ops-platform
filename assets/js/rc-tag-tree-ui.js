/** 根因分析 - 横向三级标签树（取值在标签上，与画布统一滚动） */
(function () {
  const TIER_LABELS = { 1: '一级标签', 2: '二级标签', 3: '三级标签' };

  window.expandRcTagForestDefaults = function () {};

  function renderValueBlock(node) {
    const valueType = node.valueType || 'enum';

    if (valueType === 'range') {
      const rangeText = node.rangeDisplay || node.valueLabel || '(0~100)';
      const hit = node.valueHit || '—';
      return `
        <div class="rc-tag-card-values">
          <div class="rc-tag-card-stats">
            <span class="rc-tag-stat rc-tag-stat-primary">
              <span class="rc-stat-k">取值</span>
              <span class="rc-stat-v rc-stat-range">${rangeText}</span>
            </span>
            <span class="rc-tag-stat">
              <span class="rc-stat-k">客群</span>
              <span class="rc-stat-v rc-stat-hit">${hit} 人</span>
            </span>
          </div>
        </div>`;
    }

    const values = node.values && node.values.length ? node.values : [
      { label: node.valueLabel || '—', hit: node.valueHit || '—' }
    ];
    const primary = values[0];

    return `
      <div class="rc-tag-card-values">
        <div class="rc-tag-card-stats">
          <span class="rc-tag-stat rc-tag-stat-primary">
            <span class="rc-stat-k">取值</span>
            <span class="rc-stat-v">${primary.label}</span>
          </span>
          <span class="rc-tag-stat">
            <span class="rc-stat-k">客群</span>
            <span class="rc-stat-v rc-stat-hit">${primary.hit} 人</span>
          </span>
        </div>
      </div>`;
  }

  function renderTagCard(node) {
    if (node.type === 'metric') {
      return `
        <div class="rc-tag-card is-metric-root" data-id="${node.id}">
          <span class="rc-tag-card-tier">归因指标</span>
          <span class="rc-tag-card-name" title="${node.name}">${node.name}</span>
          <span class="rc-tag-card-meta">路径 ${node.rank}</span>
        </div>`;
    }

    const tier = TIER_LABELS[node.tagLevel] || '标签';
    const hasChildren = node.children && node.children.length > 0;
    const portIn = '<span class="rc-tag-port-in" aria-hidden="true"></span>';
    const portOut = hasChildren ? '<span class="rc-tag-port-out" aria-hidden="true"></span>' : '';

    return `
      <div class="rc-tag-card is-tag is-tag-L${node.tagLevel || 1}" data-id="${node.id}" data-level="${node.tagLevel}">
        ${portIn}${portOut}
        <span class="rc-tag-card-tier">${tier}</span>
        <span class="rc-tag-card-name" title="${node.name}">${node.name}</span>
        ${renderValueBlock(node)}
      </div>`;
  }

  function renderBranch(node) {
    const hasChildren = node.children && node.children.length > 0;
    let html = '<div class="rc-h-tree-branch">';
    html += '<div class="rc-h-tree-node-head">';
    html += renderTagCard(node);
    if (hasChildren) {
      html += '<div class="h-connector-wrap rc-tag-connector expanded" aria-hidden="true"><div class="h-connector-line"></div></div>';
    }
    html += '</div>';
    if (hasChildren) {
      html += `<ul>${node.children.map(c => `<li>${renderBranch(c)}</li>`).join('')}</ul>`;
    }
    html += '</div>';
    return html;
  }

  window.renderRcTagRowPanel = function (rowForest) {
    if (!rowForest) return '<p class="segment-empty">暂无关联标签</p>';
    const l1Html = (rowForest.children || []).map(t =>
      `<li class="rc-l1-root-item">${renderBranch(t)}</li>`
    ).join('');
    return `
      <div class="rc-tag-tree-row" id="rc-tag-row-${rowForest.rank}" data-rank="${rowForest.rank}">
        <div class="rc-h-tree-canvas" id="rc-h-tree-canvas-${rowForest.rank}">
          <svg class="rc-h-tree-links-svg" id="rc-h-tree-links-${rowForest.rank}" aria-hidden="true"></svg>
          <div class="rc-h-tree rc-h-tree-l1-roots">
            <ul class="rc-l1-root-list">${l1Html || '<li class="rc-l1-empty">暂无关联标签</li>'}</ul>
          </div>
        </div>
      </div>`;
  };

  window.renderRcTagForestPanel = function (forest) {
    return (forest || []).map(row => window.renderRcTagRowPanel(row)).join('');
  };

  window.bindRcTagTreeExpand = function () {};

  function anchorInHost(host, el, edge) {
    if (!host || !el) return null;
    const elR = el.getBoundingClientRect();
    if (!elR.width && !elR.height) return null;
    const svg = host.querySelector('.rc-h-tree-links-svg');
    if (svg) {
      const clientX = edge === 'right' ? elR.right : elR.left;
      const clientY = elR.top + elR.height / 2;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const sp = pt.matrixTransform(ctm.inverse());
        return { x: Math.round(sp.x), y: Math.round(sp.y) };
      }
    }
    const hostR = host.getBoundingClientRect();
    const x = (edge === 'right' ? elR.right : elR.left) - hostR.left + host.scrollLeft;
    const y = elR.top - hostR.top + host.scrollTop + elR.height / 2;
    return { x: Math.round(x), y: Math.round(y) };
  }

  function anchorTagPort(host, card, edge) {
    if (!host || !card) return null;
    const port = card.querySelector(edge === 'right' ? '.rc-tag-port-out' : '.rc-tag-port-in');
    return anchorInHost(host, port || card, edge);
  }

  function drawOrtho(segments, x1, y1, x2, y2) {
    if (Math.abs(x2 - x1) < 12) {
      segments.push(`M ${x1} ${y1} L ${x2} ${y2}`);
      return;
    }
    const bend = x1 + Math.max(24, (x2 - x1) * 0.45);
    segments.push(`M ${x1} ${y1} L ${bend} ${y1} L ${bend} ${y2} L ${x2} ${y2}`);
  }

  window.layoutRcTagRowTreeLinks = function (rank) {
    const host = document.getElementById('rc-h-tree-canvas-' + rank);
    const svg = document.getElementById('rc-h-tree-links-' + rank);
    if (!host || !svg) return;

    const w = Math.max(host.scrollWidth, host.offsetWidth, 1);
    const h = Math.max(host.scrollHeight, host.offsetHeight, 1);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';

    const segments = [];

    host.querySelectorAll('.rc-h-tree-branch').forEach(branchEl => {
      const card = branchEl.querySelector(':scope > .rc-h-tree-node-head > .rc-tag-card.is-tag');
      const childBranches = branchEl.querySelectorAll(':scope > ul > li > .rc-h-tree-branch');
      if (!card || !childBranches.length) return;

      const start = anchorTagPort(host, card, 'right');
      if (!start) return;

      const childPoints = [...childBranches]
        .map(b => b.querySelector(':scope > .rc-h-tree-node-head > .rc-tag-card.is-tag'))
        .filter(Boolean)
        .map(el => anchorTagPort(host, el, 'left'))
        .filter(Boolean);

      if (!childPoints.length) return;

      if (childPoints.length === 1) {
        const t = childPoints[0];
        drawOrtho(segments, start.x, start.y, t.x - 1, t.y);
        return;
      }

      const busX = start.x + Math.max(32, (childPoints[0].x - start.x) * 0.38);
      segments.push(`M ${start.x} ${start.y} L ${busX} ${start.y}`);
      const ys = [start.y, ...childPoints.map(p => p.y)];
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      if (minY !== maxY) segments.push(`M ${busX} ${minY} L ${busX} ${maxY}`);
      childPoints.forEach(t => segments.push(`M ${busX} ${t.y} L ${t.x - 1} ${t.y}`));
    });

    svg.innerHTML = segments.length
      ? segments.map(d => `<path class="rc-h-tree-link-path" d="${d}"/>`).join('')
      : '';
  };

  window.layoutAllRcTagTreeLinks = function (forest) {
    (forest || []).forEach(f => window.layoutRcTagRowTreeLinks(f.rank));
  };
})();
