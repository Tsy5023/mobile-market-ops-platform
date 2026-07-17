/** 任务分类 · 业务主管查看调度任务整体与子任务进度 */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let page = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showView(view) {
    document.getElementById('task-category-list-view')?.classList.toggle('active', view === 'list');
    document.getElementById('task-category-detail-view')?.classList.toggle('active', view === 'detail');
  }

  function renderStats() {
    if (!window.MetricDispatchStore) return;
    const list = MetricDispatchStore.getAll();
    const all = list;
    document.getElementById('stat-metric-total').textContent = String(list.length);
    document.getElementById('stat-metric-dept').textContent = String(
      list.filter(d => d.dispatchMode === 'dept').length
    );
    document.getElementById('stat-metric-city').textContent = String(
      list.filter(d => d.dispatchMode !== 'dept').length
    );
    const subTotal = all.reduce((a, p) => a + (p.subTasks || []).length, 0);
    const el = document.getElementById('stat-sub-total');
    if (el) el.textContent = String(subTotal);
  }

  function getFilteredList() {
    const kw = (document.getElementById('task-category-kw')?.value || '').trim().toLowerCase();
    const modeFilter = document.getElementById('task-mode-filter')?.value || '';

    let list = MetricDispatchStore.getAll();
    if (!list.length) {
      MetricDispatchStore.resetDemoData();
      list = MetricDispatchStore.getAll();
    }
    if (kw) {
      list = list.filter(p =>
        (p.id + p.metricName + p.treeName).toLowerCase().includes(kw)
      );
    }
    if (modeFilter) {
      list = list.filter(p => MetricDispatchStore.dispatchModeLabel(p.dispatchMode) === modeFilter);
    }
    return list;
  }

  function renderPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('task-category-pagination', {
      total,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderList();
      }
    });
    page = result.page;
  }

  function renderList() {
    const tbody = document.getElementById('task-category-tbody');
    const countEl = document.getElementById('task-category-count');
    if (!tbody) return;
    if (!window.MetricDispatchStore) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:32px">数据模块未加载，请检查 metric-dispatch-store.js</td></tr>';
      renderPagination(0);
      return;
    }

    const list = getFilteredList();
    const pageRows = TablePagination
      ? TablePagination.slice(list, page, PAGE_SIZE)
      : list;

    if (countEl) countEl.textContent = `共 ${list.length} 个调度任务`;

    tbody.innerHTML = pageRows.map(p => {
      try {
        return typeof window.renderTaskCategoryParentRow === 'function'
          ? renderTaskCategoryParentRow(p)
          : '';
      } catch (err) {
        console.error(err);
        return '';
      }
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:32px">暂无调度任务</td></tr>';

    renderPagination(list.length);

    if (typeof window.bindTaskCategoryListActions === 'function') {
      bindTaskCategoryListActions(tbody);
    }
  }

  window.taskCategoryShowDetail = function (parentId) {
    showDetail(parentId);
  };

  function showDetail(parentId) {
    const body = document.getElementById('task-category-detail-body');
    const parent = MetricDispatchStore?.getById(parentId);
    if (!body) return;
    body.innerHTML = typeof window.renderTaskCategoryParentDetail === 'function'
      ? renderTaskCategoryParentDetail(parent)
      : '<p class="muted">未找到任务</p>';
    const title = document.getElementById('task-category-detail-title');
    if (title) title.textContent = parent ? parent.metricName : '调度任务详情';
    showView('detail');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('task-category-tbody')) return;
    renderStats();
    const params = new URLSearchParams(location.search);
    const detailId = params.get('detail');
    if (detailId) {
      showDetail(detailId);
    } else {
      showView('list');
      renderList();
    }
    document.getElementById('btn-task-category-filter')?.addEventListener('click', () => {
      page = 1;
      renderList();
    });
    document.getElementById('btn-reset-task-demo')?.addEventListener('click', () => {
      if (window.MetricDispatchStore) MetricDispatchStore.resetDemoData();
      page = 1;
      renderStats();
      renderList();
      alert('已恢复演示数据（共 ' + MetricDispatchStore.getAll().length + ' 条）');
    });
    document.getElementById('btn-task-category-back')?.addEventListener('click', () => {
      location.href = 'task-category.html';
    });
  });
})();
