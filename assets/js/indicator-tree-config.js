/** 指标树配置 - 列表页 */
(function () {
  const PAGE_SIZE = 10;
  let filtered = [...window.TREE_CONFIG_LIST];
  let page = 1;

  function getFilters() {
    return {
      name: (document.getElementById('f-name')?.value || '').trim(),
      scene: document.getElementById('f-scene')?.value || '',
      algorithmScene: document.getElementById('f-algorithm-scene')?.value || '',
      status: document.getElementById('f-status')?.value || ''
    };
  }

  function applyFilters() {
    const f = getFilters();
    filtered = TREE_CONFIG_LIST.filter(row => {
      if (f.scene && !row.scene.includes(f.scene)) return false;
      if (f.status && row.status !== f.status) return false;
      if (f.algorithmScene && window.resolveTreeAlgorithmScene(row) !== f.algorithmScene) return false;
      if (f.name && !row.name.includes(f.name) && !row.code.includes(f.name)) return false;
      return true;
    });
    page = 1;
    renderTable();
    renderPagination();
  }

  function renderStatus(row) {
    const s = TREE_STATUS_MAP[row.status] || TREE_STATUS_MAP.draft;
    return `<span class="status-dot-text"><span class="status-dot" style="background:${s.dot}"></span>${s.label}</span>`;
  }

  function renderAlgorithmScene(row) {
    const value = typeof window.resolveTreeAlgorithmScene === 'function'
      ? window.resolveTreeAlgorithmScene(row)
      : row.algorithmScene;
    return typeof window.formatAlgorithmSceneHtml === 'function'
      ? window.formatAlgorithmSceneHtml(value)
      : (window.getAlgorithmSceneLabel ? window.getAlgorithmSceneLabel(value) : '—');
  }

  function renderActions(row) {
    const ops = [];
    ops.push(`<a href="indicator-tree-editor.html?id=${row.code}&view=1" class="link-action">详情</a>`);
    if (row.status === 'online' || row.status === 'draft') {
      ops.push(`<a href="indicator-tree-editor.html?id=${row.code}" class="link-action">编辑</a>`);
    }
    if (row.status === 'online') {
      ops.push(`<a href="#" class="link-action" data-action="offline" data-code="${row.code}">下线</a>`);
    }
    ops.push(`<a href="indicator-tree-editor.html?copy=${row.code}" class="link-action">复制</a>`);
    return ops.join('');
  }

  function renderTable() {
    const tbody = document.getElementById('tree-config-tbody');
    const totalEl = document.getElementById('list-total');
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    if (totalEl) totalEl.textContent = filtered.length;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:40px">暂无数据</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(row => `
      <tr>
        <td><code style="font-size:12px">${row.code}</code></td>
        <td><strong>${row.name}</strong></td>
        <td class="cell-scene" title="${row.scene}">${row.scene}</td>
        <td class="ic-algo-scenes-cell">${renderAlgorithmScene(row)}</td>
        <td>${renderStatus(row)}</td>
        <td>${row.creator}</td>
        <td style="white-space:nowrap">${row.createdAt}</td>
        <td class="cell-actions">${renderActions(row)}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-action="offline"]').forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        if (confirm('确认下线该指标树？')) alert('已下线（演示）');
      };
    });
  }

  function renderPagination() {
    if (!window.TablePagination) return;
    const result = TablePagination.render('tree-pagination', {
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderTable();
        renderPagination();
      }
    });
    page = result.page;
  }

  function applyDemoScenarioDefaults() {
    const scene = document.getElementById('f-scene');
    const name = document.getElementById('f-name');
    const algo = document.getElementById('f-algorithm-scene');
    if (scene && window.DEMO_SCENARIO) {
      scene.value = window.DEMO_SCENARIO.sceneShort;
    }
    if (name && window.DEMO_SCENARIO) {
      name.value = window.DEMO_SCENARIO.treeName;
    }
    if (algo) algo.value = 'loss_control_rca';
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-query')?.addEventListener('click', applyFilters);
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.querySelectorAll('.tree-config-filter input, .tree-config-filter select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      filtered = [...TREE_CONFIG_LIST];
      page = 1;
      renderTable();
      renderPagination();
    });
    document.getElementById('f-name')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyFilters();
    });
    document.getElementById('f-algorithm-scene')?.addEventListener('change', applyFilters);
    document.getElementById('btn-create-tree')?.addEventListener('click', () => {
      location.href = 'indicator-tree-editor.html?mode=create';
    });
    if (window.DEMO_SCENARIO) applyDemoScenarioDefaults();
    else {
      renderTable();
      renderPagination();
    }
  });
})();
