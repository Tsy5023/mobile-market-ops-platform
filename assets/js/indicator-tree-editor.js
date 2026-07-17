/** 指标树创建/编辑 - 画布 + 节点属性 */
(function () {
  const params = new URLSearchParams(location.search);
  const isView = params.get('view') === '1';
  const isCreate = params.get('mode') === 'create';
  const treeId = params.get('id') || params.get('copy');

  let treeData = getDefaultEditorTree();
  let selectedId = null;
  let zoom = 1;
  const metricPickerPageSize = 10;

  const FORMAT_LABELS = { numeric: '数值', percent: '百分比', enum: '枚举' };
  const ALGO_MISMATCH_TIP = '该指标算法使用场景和指标树算法使用场景不同，指标树只展示指标数据，不会对该指标进行根因分析。如需根因分析，可在“指标配置”模块中修改该指标算法使用场景。';

  function resolveMetricAlgorithmScenes(row) {
    if (!row) return [];
    if (Array.isArray(row.algorithmScenes) && row.algorithmScenes.length) return row.algorithmScenes;
    const lib = (window.DEMO_METRIC_LIBRARY || []).find(m => m.code === row.code);
    if (lib?.algorithmScenes?.length) return lib.algorithmScenes;
    const code = (row.code || '').toUpperCase();
    if (/FL_REV|ROAM|EU_|FAMILY|HALL/.test(code)) return ['traffic_rca'];
    if (/CHURN|HE_|HCD|CUS_CHURN/.test(code)) return ['loss_control_rca'];
    return [];
  }

  function formatMetricAlgoScenesCell(scenes) {
    const list = Array.isArray(scenes) ? scenes : [];
    if (!list.length) return '—';
    if (typeof window.formatAlgorithmSceneHtml === 'function') {
      return list.map(v => window.formatAlgorithmSceneHtml(v)).join('');
    }
    return list.map(v => (window.getAlgorithmSceneLabel ? window.getAlgorithmSceneLabel(v) : v)).join('、');
  }

  function getTreeAlgorithmScene() {
    return treeData.meta?.algorithmScene
      || document.getElementById('meta-algorithm-scene')?.value
      || '';
  }

  function isMetricAlgoSceneMismatch(node) {
    if (!node || node.type !== 'metric' || !node.metricId) return false;
    const treeScene = getTreeAlgorithmScene();
    if (!treeScene) return false;
    const metric = getMetric(node.metricId);
    if (!metric) return false;
    const scenes = resolveMetricAlgorithmScenes(metric);
    if (!scenes.length) return true;
    return !scenes.includes(treeScene);
  }

  function enrichMetricRow(row) {
    const lib = (window.DEMO_METRIC_LIBRARY || []).find(m => m.code === row.code);
    const format = lib?.format || (/率/.test(row.name || '') ? 'percent' : 'numeric');
    return {
      ...row,
      formatLabel: FORMAT_LABELS[format] || format || '—',
      updatedAt: lib?.updatedAt || row.updatedAt || '2026-05-20 12:00:00',
      algorithmScenes: resolveMetricAlgorithmScenes(row)
    };
  }

  function getMetricOptions() {
    return (window.METRIC_OPTIONS || []).map(enrichMetricRow);
  }

  let metricPickerRows = getMetricOptions();
  let metricPickerPage = 1;
  let pendingMetricId = '';

  function findNode(node, id) {
    if (node.id === id) return node;
    for (const c of node.children || []) {
      const f = findNode(c, id);
      if (f) return f;
    }
    return null;
  }

  function genId() {
    return 'n' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function scheduleTreeLinks() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => layoutTreeLinks());
    });
  }

  function renderCanvas() {
    const inner = document.getElementById('editor-canvas-inner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="tree-canvas-host" id="tree-canvas-host">
        <svg class="tree-editor-links" id="tree-editor-links" aria-hidden="true"></svg>
        <div class="tree-flow-root" id="tree-flow-root">${renderNode(treeData.nodes, true)}</div>
      </div>`;
    bindCanvasEvents();
    if (selectedId) selectNode(selectedId);
    scheduleTreeLinks();
  }

  function renderNode(node, isRoot) {
    const selected = node.id === selectedId ? ' selected' : '';
    const isCategory = node.type === 'category';
    const typeCls = isCategory ? ' is-node-category' : ' is-node-metric';
    const typeLabel = isCategory ? '节点指标' : '业务指标';
    const name = node.name || (isCategory ? '节点指标' : '请选择指标');
    const kids = node.children || [];
    const childrenHtml = kids.length
      ? `<div class="tree-flow-children">${kids.map(c => `
          <div class="tree-flow-branch">${renderNode(c, false)}</div>`).join('')}</div>`
      : '';

    const actionsHtml = !isView
      ? `<div class="node-card-actions">
          <button type="button" class="node-btn node-btn-add" data-add="${node.id}" title="添加子节点"><i class="fas fa-plus"></i></button>
          ${!isRoot ? `<button type="button" class="node-btn node-btn-del" data-del="${node.id}" title="删除节点"><i class="fas fa-minus"></i></button>` : ''}
        </div>`
      : '';

    const algoMismatch = isMetricAlgoSceneMismatch(node);
    const warnHtml = algoMismatch
      ? `<span class="node-algo-warn"><i class="fas fa-circle-exclamation"></i><span class="node-algo-warn-tip">${ALGO_MISMATCH_TIP}</span></span>`
      : '';

    return `
      <div class="tree-flow-node-wrap">
        <div class="canvas-node-card${typeCls}${selected}" data-id="${node.id}" tabindex="0">
          <div class="node-card-body">
            <div class="node-card-head-row">
              <span class="node-type-badge">${typeLabel}</span>
              ${warnHtml}
            </div>
            <span class="node-card-title">${name}</span>
          </div>
          ${actionsHtml}
        </div>
        ${childrenHtml}
      </div>`;
  }

  function validateTreeBeforeSave() {
    if (treeData.nodes.type !== 'metric') {
      alert('指标树根节点必须是「业务指标」，请为根节点绑定节点指标');
      return false;
    }
    if (!treeData.nodes.metricId) {
      alert('请为根节点（业务指标）选择节点指标');
      return false;
    }
    return true;
  }

  /** 父节点右端 → 子节点左端，多子节点用竖向总线 */
  function layoutTreeLinks() {
    const host = document.getElementById('tree-canvas-host');
    const svg = document.getElementById('tree-editor-links');
    if (!host || !svg) return;

    const hostRect = host.getBoundingClientRect();
    const w = Math.max(host.scrollWidth, host.offsetWidth);
    const h = Math.max(host.scrollHeight, host.offsetHeight);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const segments = [];

    function linkParentChildren(parentId) {
      const parentEl = host.querySelector(`.canvas-node-card[data-id="${parentId}"]`);
      const node = findNode(treeData.nodes, parentId);
      if (!parentEl || !node || !(node.children || []).length) return;

      const childEls = node.children
        .map(c => host.querySelector(`.canvas-node-card[data-id="${c.id}"]`))
        .filter(Boolean);
      if (!childEls.length) return;

      const pRect = parentEl.getBoundingClientRect();
      const x1 = pRect.right - hostRect.left;
      const y1 = pRect.top - hostRect.top + pRect.height / 2;

      const childPoints = childEls.map(el => {
        const r = el.getBoundingClientRect();
        return {
          x2: r.left - hostRect.left,
          y2: r.top - hostRect.top + r.height / 2
        };
      });

      if (childPoints.length === 1) {
        const { x2, y2 } = childPoints[0];
        const bend = x1 + Math.max(32, (x2 - x1) * 0.42);
        segments.push(`M ${x1} ${y1} L ${bend} ${y1} L ${bend} ${y2} L ${x2} ${y2}`);
        return;
      }

      const busX = x1 + 28;
      const ys = childPoints.map(p => p.y2);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      segments.push(`M ${x1} ${y1} L ${busX} ${y1}`);
      segments.push(`M ${busX} ${minY} L ${busX} ${maxY}`);
      childPoints.forEach(({ x2, y2 }) => {
        segments.push(`M ${busX} ${y2} L ${x2} ${y2}`);
      });
    }

    function walk(node) {
      linkParentChildren(node.id);
      (node.children || []).forEach(walk);
    }
    walk(treeData.nodes);

    svg.innerHTML = segments.map(d => `<path class="tree-link-path" d="${d}"/>`).join('');
  }

  function bindCanvasEvents() {
    document.querySelectorAll('.canvas-node-card').forEach(el => {
      el.onclick = e => {
        if (e.target.closest('.node-btn')) return;
        selectNode(el.dataset.id);
      };
    });
    document.querySelectorAll('[data-add]').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        addChild(btn.dataset.add);
      };
    });
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        removeNode(btn.dataset.del);
      };
    });
  }

  function switchSideTab(tab) {
    document.querySelectorAll('#editor-side-tabs [data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.side-panel-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tab);
    });
  }

  function selectNode(id) {
    selectedId = id;
    document.querySelectorAll('.canvas-node-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.id === id);
    });
    switchSideTab('node');
    const node = findNode(treeData.nodes, id);
    if (!node) return;

    resolveNodeMetric(node);
    document.getElementById('node-name').value = node.name || '';
    document.getElementById('node-type').value = node.type || 'metric';
    fillNodeMetricForm(node);
    toggleMetricFields(node.type);

    if (isView) {
      document.querySelectorAll('#panel-node input, #panel-node select, #panel-node textarea, #panel-node button').forEach(el => {
        el.disabled = true;
      });
    }
  }

  function showTreeMetaPanel() {
    selectedId = null;
    document.querySelectorAll('.canvas-node-card').forEach(c => c.classList.remove('selected'));
    switchSideTab('meta');
    initMetaForm();
  }

  function showNodePanel() {
    selectNode(selectedId || treeData.nodes.id);
  }

  function bindSidePanelTabs() {
    const wrap = document.getElementById('editor-side-panel-wrap');
    if (!wrap) return;
    wrap.querySelectorAll('#editor-side-tabs [data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'meta') showTreeMetaPanel();
        else showNodePanel();
      });
    });
  }

  function toggleMetricFields(type) {
    const show = type === 'metric';
    document.querySelectorAll('.field-metric-only').forEach(el => {
      el.style.display = show ? '' : 'none';
    });
    const isRoot = selectedId === treeData.nodes.id;
    document.querySelectorAll('.field-node-type').forEach(el => {
      el.style.display = isRoot ? 'none' : '';
    });
    if (isRoot) {
      const typeSel = document.getElementById('node-type');
      if (typeSel) {
        typeSel.value = 'metric';
        typeSel.disabled = true;
      }
    } else {
      const typeSel = document.getElementById('node-type');
      if (typeSel) typeSel.disabled = isView;
    }
  }

  function getMetric(id) {
    return typeof window.getMetricById === 'function' ? window.getMetricById(id) : null;
  }

  function resolveNodeMetric(node) {
    if (!node || node.metricId) return;
    const legacyName = node.metricName || node.defaultMetric || node.metricGroup || '';
    if (!legacyName) return;
    const found = (window.METRIC_OPTIONS || []).find(
      m => m.name === legacyName || m.code === legacyName
    );
    if (found) {
      node.metricId = found.id;
      node.metricCode = found.code;
      node.metricName = found.name;
    }
  }

  function formatMetricDisplay(name, code, id) {
    const label = name || '';
    const metricId = code || id || '';
    if (!label) return '';
    if (!metricId) return label;
    return `${label}（${metricId}）`;
  }

  function fillMetricPickFields(node, idKey, codeKey, nameKey, inputId, hiddenId, hiddenCode) {
    resolveNodeMetric(node);
    const elName = document.getElementById(inputId);
    const elId = document.getElementById(hiddenId);
    const elCode = document.getElementById(hiddenCode);
    const name = node[nameKey] || '';
    const code = node[codeKey] || '';
    const id = node[idKey] || '';
    if (elName) elName.value = formatMetricDisplay(name, code, id);
    if (elId) elId.value = id;
    if (elCode) elCode.value = code;
  }

  function fillNodeMetricForm(node) {
    fillMetricPickFields(node, 'metricId', 'metricCode', 'metricName', 'node-metric', 'node-metric-id', 'node-metric-code');
  }

  function applyMetricPick(metric) {
    if (!selectedId || !metric) return;
    const node = findNode(treeData.nodes, selectedId);
    if (!node) return;

    node.type = 'metric';
    node.metricId = metric.id;
    node.metricCode = metric.code;
    node.metricName = metric.name;
    const nameInput = document.getElementById('node-name').value.trim();
    if (!nameInput || nameInput === '请选择指标') {
      node.name = metric.name;
      document.getElementById('node-name').value = node.name;
    }
    document.getElementById('node-type').value = 'metric';
    toggleMetricFields('metric');

    fillNodeMetricForm(node);
    const card = document.querySelector(`.canvas-node-card[data-id="${selectedId}"] .node-card-title`);
    if (card) card.textContent = node.name;
    renderCanvas();
  }

  function syncNodeFromForm() {
    if (!selectedId) return;
    const node = findNode(treeData.nodes, selectedId);
    if (!node) return;

    node.type = document.getElementById('node-type').value;
    const defaultName = node.type === 'category' ? '节点指标' : '请选择指标';
    node.name = document.getElementById('node-name').value.trim() || defaultName;
    if (node.type === 'category') {
      node.metricId = '';
      node.metricCode = '';
      node.metricName = '';
    } else {
      const metricId = document.getElementById('node-metric-id')?.value || '';
      const metric = metricId ? getMetric(metricId) : null;
      node.metricId = metricId;
      node.metricCode = document.getElementById('node-metric-code')?.value || metric?.code || '';
      node.metricName = metric?.name || node.metricName || '';
    }

    if (node.type === 'metric' && node.metricName) {
      const nameInput = document.getElementById('node-name').value.trim();
      if (!nameInput || nameInput === '请选择指标') {
        node.name = node.metricName;
        document.getElementById('node-name').value = node.name;
      }
    }

    const card = document.querySelector(`.canvas-node-card[data-id="${selectedId}"] .node-card-title`);
    if (card) card.textContent = node.name;
    renderCanvas();
    selectNode(selectedId, false);
  }

  function addChild(parentId) {
    const parent = findNode(treeData.nodes, parentId);
    if (!parent) return;
    if (!parent.children) parent.children = [];

    const child = {
      id: genId(),
      name: '节点指标',
      type: 'category',
      metricId: '',
      metricCode: '',
      metricName: '',
      children: []
    };
    parent.children.push(child);
    renderCanvas();
    selectNode(child.id);
  }

  function removeNode(id) {
    if (id === treeData.nodes.id) return alert('根节点不可删除');
    function removeFrom(parent) {
      if (!parent.children) return false;
      const idx = parent.children.findIndex(c => c.id === id);
      if (idx >= 0) {
        parent.children.splice(idx, 1);
        return true;
      }
      return parent.children.some(c => removeFrom(c));
    }
    if (!removeFrom(treeData.nodes)) return;
    if (selectedId === id) selectNode(treeData.nodes.id);
    renderCanvas();
  }

  function syncMetaFromForm() {
    treeData.meta.name = document.getElementById('meta-name').value;
    treeData.meta.scene = document.getElementById('meta-scene').value;
    const prevAlgo = treeData.meta.algorithmScene;
    treeData.meta.algorithmScene = document.getElementById('meta-algorithm-scene')?.value || '';
    treeData.meta.description = document.getElementById('meta-desc').value;
    if (prevAlgo !== treeData.meta.algorithmScene) renderCanvas();
  }

  function initMetaForm() {
    const m = treeData.meta;
    document.getElementById('meta-name').value = m.name;
    document.getElementById('meta-scene').value = m.scene;
    const algoEl = document.getElementById('meta-algorithm-scene');
    if (algoEl) algoEl.value = m.algorithmScene || '';
    document.getElementById('meta-desc').value = m.description;
    updateDescCount();
  }

  function updateDescCount() {
    const el = document.getElementById('meta-desc');
    const cnt = document.getElementById('meta-desc-count');
    if (el && cnt) cnt.textContent = (el.value || '').length;
  }

  function loadTreeFromConfig(code, isCopy) {
    const row = TREE_CONFIG_LIST.find(r => r.code === code);
    const saved = typeof getEditorTreeByCode === 'function' ? getEditorTreeByCode(code) : null;
    if (saved) {
      treeData = saved;
      if (isCopy) treeData.meta.name = (treeData.meta.name || '') + '（副本）';
    } else if (row) {
      treeData.meta.name = row.name + (isCopy ? '（副本）' : '');
      if (row.scene) treeData.meta.scene = row.scene;
      const algo = typeof window.resolveTreeAlgorithmScene === 'function'
        ? window.resolveTreeAlgorithmScene(row)
        : row.algorithmScene;
      if (algo) treeData.meta.algorithmScene = algo;
    }
    if (!treeData.meta.algorithmScene && row) {
      const algo = typeof window.resolveTreeAlgorithmScene === 'function'
        ? window.resolveTreeAlgorithmScene(row)
        : '';
      if (algo) treeData.meta.algorithmScene = algo;
    }
  }

  function initPageMode() {
    const title = document.getElementById('editor-page-title');
    if (isView) {
      if (title) title.textContent = '指标树详情';
      document.querySelectorAll('.editor-actions .btn').forEach(btn => {
        if (btn.textContent.includes('发布') || btn.textContent.includes('草稿')) btn.style.display = 'none';
      });
      document.querySelectorAll('#panel-meta input, #panel-meta select, #panel-meta textarea').forEach(el => {
        el.disabled = true;
      });
      if (treeId) loadTreeFromConfig(treeId, false);
    } else if (isCreate) {
      if (title) title.textContent = '指标树创建';
    } else if (treeId) {
      if (title) title.textContent = '指标树编辑';
      loadTreeFromConfig(treeId, !!params.get('copy'));
    }
  }

  function openLocalModal(id) {
    document.getElementById(id)?.classList.add('show');
  }

  function closeLocalModal(id) {
    document.getElementById(id)?.classList.remove('show');
  }

  function renderMetricPickerTable() {
    const tbody = document.getElementById('metric-pick-tbody');
    const pagination = document.getElementById('metric-pick-pagination');
    if (!tbody) return;

    const start = (metricPickerPage - 1) * metricPickerPageSize;
    const pageRows = metricPickerRows.slice(start, start + metricPickerPageSize);
    tbody.innerHTML = pageRows.map(row => `
      <tr class="${row.id === pendingMetricId ? 'selected' : ''}" data-metric-id="${row.id}">
        <td><input type="radio" name="metric-pick-radio" value="${row.id}" ${row.id === pendingMetricId ? 'checked' : ''}/></td>
        <td>${row.code}</td>
        <td><strong>${row.name}</strong></td>
        <td class="metric-pick-algo-cell">${formatMetricAlgoScenesCell(row.algorithmScenes)}</td>
        <td>${row.formatLabel}</td>
        <td>${row.updatedAt}</td>
        <td>${row.period}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('tr[data-metric-id]').forEach(row => {
      row.addEventListener('click', () => {
        pendingMetricId = row.dataset.metricId;
        renderMetricPickerTable();
      });
    });

    if (window.TablePagination) {
      const result = TablePagination.render(pagination, {
        total: metricPickerRows.length,
        page: metricPickerPage,
        pageSize: metricPickerPageSize,
        onPageChange: nextPage => {
          metricPickerPage = nextPage;
          renderMetricPickerTable();
        }
      });
      metricPickerPage = result.page;
    }
  }

  function searchMetrics() {
    const keyword = (document.getElementById('mp-keyword')?.value || '').trim();
    const algoScene = document.getElementById('mp-algorithm-scene')?.value || '';
    metricPickerRows = getMetricOptions().filter(row => {
      if (keyword && !row.name.includes(keyword) && !row.code.includes(keyword)) return false;
      if (algoScene) {
        const scenes = row.algorithmScenes || [];
        if (!scenes.includes(algoScene)) return false;
      }
      return true;
    });
    metricPickerPage = 1;
    renderMetricPickerTable();
  }

  function openMetricPickerModal() {
    if (!selectedId) return alert('请先选择一个节点');
    const node = findNode(treeData.nodes, selectedId);
    if (!node) return;
    if (node.type === 'category') {
      return alert('节点类型为「节点指标」时无需绑定指标，请将节点类型改为「业务指标」');
    }
    resolveNodeMetric(node);
    const titleEl = document.getElementById('metric-pick-modal-title');
    if (titleEl) titleEl.textContent = '选择节点指标';
    pendingMetricId = node.metricId || '';
    const kw = document.getElementById('mp-keyword');
    if (kw) kw.value = '';
    const algoFilter = document.getElementById('mp-algorithm-scene');
    if (algoFilter) algoFilter.value = getTreeAlgorithmScene() || '';
    searchMetrics();
    openLocalModal('modal-metric-pick');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPageMode();
    initMetaForm();
    renderCanvas();
    bindSidePanelTabs();
    showTreeMetaPanel();

    document.getElementById('editor-canvas')?.addEventListener('click', e => {
      if (e.target.id === 'editor-canvas' || e.target.classList.contains('editor-canvas-bg')) showTreeMetaPanel();
    });

    ['node-name', 'node-type'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', syncNodeFromForm);
      document.getElementById(id)?.addEventListener('change', () => {
        if (id === 'node-type') toggleMetricFields(document.getElementById('node-type').value);
        syncNodeFromForm();
      });
    });

    document.querySelectorAll('.metric-pick-trigger').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        openMetricPickerModal();
      });
    });

    ['meta-name', 'meta-scene', 'meta-algorithm-scene', 'meta-desc'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', syncMetaFromForm);
      document.getElementById(id)?.addEventListener('change', syncMetaFromForm);
    });
    document.getElementById('meta-desc')?.addEventListener('input', updateDescCount);

    document.getElementById('btn-cancel')?.addEventListener('click', () => {
      if (confirm('确定离开？未保存内容将丢失')) location.href = 'indicator-tree.html';
    });
    document.getElementById('btn-draft')?.addEventListener('click', () => {
      syncMetaFromForm();
      syncNodeFromForm();
      if (!validateTreeBeforeSave()) return;
      alert('草稿已保存（演示）');
    });
    document.getElementById('btn-preview')?.addEventListener('click', () => {
      const row = treeId ? TREE_CONFIG_LIST.find(r => r.code === treeId) : null;
      const insightId = row?.insightId || window.HE_CHURN_INSIGHT_ID;
      if (insightId && (treeId === window.HE_CHURN_TREE_CODE || row?.insightId)) {
        location.href = 'indicator-tree-detail.html?id=' + insightId;
        return;
      }
      alert('预览：将打开指标洞察下钻视图（演示）');
    });
    document.getElementById('btn-publish')?.addEventListener('click', () => {
      syncMetaFromForm();
      syncNodeFromForm();
      if (!treeData.meta.name.trim()) return alert('请填写指标树名称');
      if (!validateTreeBeforeSave()) return;
      alert('已提交发布（演示）');
      location.href = 'indicator-tree.html';
    });

    document.getElementById('zoom-in')?.addEventListener('click', () => {
      zoom = Math.min(1.4, zoom + 0.1);
      applyZoom();
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
      zoom = Math.max(0.6, zoom - 0.1);
      applyZoom();
    });
    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      zoom = 1;
      applyZoom();
    });

    document.getElementById('mp-search')?.addEventListener('click', searchMetrics);
    document.getElementById('mp-keyword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchMetrics();
    });
    document.getElementById('mp-algorithm-scene')?.addEventListener('change', searchMetrics);
    document.getElementById('mp-confirm')?.addEventListener('click', () => {
      const metric = getMetric(pendingMetricId);
      if (!metric) return alert('请选择指标');
      applyMetricPick(metric);
      closeLocalModal('modal-metric-pick');
    });

    document.addEventListener('click', e => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) closeLocalModal(closeBtn.dataset.closeModal);
      if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
    });

    document.getElementById('editor-canvas')?.addEventListener('scroll', scheduleTreeLinks);
    window.addEventListener('resize', scheduleTreeLinks);
  });

  function applyZoom() {
    const inner = document.getElementById('editor-canvas-inner');
    if (inner) inner.style.transform = `scale(${zoom})`;
    scheduleTreeLinks();
  }
})();
