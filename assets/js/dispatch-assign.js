/** 调度派发：指标调度 + 策略调度 */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let metricPage = 1;
  let strategyPage = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function metricStatusBadge(st) {
    if (st === 'completed') return '<span class="badge badge-info">已完成</span>';
    if (st === 'pending') return '<span class="badge badge-warning">待处理</span>';
    return '<span class="badge badge-success">执行中</span>';
  }

  function showMetricHubView(view) {
    const isDetail = view === 'detail';
    document.getElementById('dispatch-metric-list-view')?.classList.toggle('active', !isDetail);
    document.getElementById('dispatch-metric-detail-view')?.classList.toggle('active', isDetail);
    document.getElementById('dispatch-hub-metric')?.classList.toggle('is-detail-view', isDetail);
    document.getElementById('dispatch-hub-tabs')?.classList.toggle('dispatch-chrome-hidden', isDetail);
    document.body.classList.toggle('dispatch-metric-detail-active', isDetail);
  }

  function dispatchModeLabel(d) {
    return d.dispatchMode === 'dept' ? '跨部门' : '跨地市';
  }

  function subTaskStatusFilterMatch(st, filter) {
    if (!filter) return true;
    if (filter === 'pending_claim') return st === 'pending_claim';
    if (filter === 'executing') return ['executing', 'collaborating', 'transferred'].includes(st);
    if (filter === 'completed') return st === 'completed';
    return true;
  }

  function renderMetricPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('metric-dispatch-pagination', {
      total,
      page: metricPage,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        metricPage = nextPage;
        renderMetricDispatchList();
      }
    });
    metricPage = result.page;
  }

  function renderMetricDispatchList() {
    const tbody = document.getElementById('metric-dispatch-list-tbody');
    const countEl = document.getElementById('metric-dispatch-list-count');
    if (!tbody || !window.MetricDispatchStore) return;

    const kw = (document.getElementById('metric-dispatch-filter')?.value || '').trim().toLowerCase();
    const st = document.getElementById('metric-dispatch-status-filter')?.value || '';
    const mode = document.getElementById('metric-dispatch-mode-filter')?.value || '';

    let rows = MetricDispatchStore.getAllSubTaskRows();
    if (kw) {
      rows = rows.filter(({ parent, subTask }) =>
        (parent.id + parent.metricName + subTask.id + subTask.scopeLabel).toLowerCase().includes(kw)
      );
    }
    if (st) rows = rows.filter(({ subTask }) => subTaskStatusFilterMatch(subTask.status, st));
    if (mode) rows = rows.filter(({ parent }) => parent.dispatchMode === mode);

    if (countEl) countEl.textContent = `共 ${rows.length} 条子任务`;

    const pageRows = TablePagination
      ? TablePagination.slice(rows, metricPage, PAGE_SIZE)
      : rows;

    tbody.innerHTML = pageRows.map(row =>
      typeof window.renderDispatchSubTaskRow === 'function'
        ? renderDispatchSubTaskRow(row)
        : ''
    ).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无子任务，请点击「恢复演示数据」。</td></tr>';

    renderMetricPagination(rows.length);

    if (typeof window.bindDispatchSubTaskListActions === 'function') {
      bindDispatchSubTaskListActions(tbody);
    }
  }

  window.dispatchRefreshMetricList = function () {
    renderMetricDispatchList();
  };

  window.dispatchShowSubTaskDetail = function (subTaskId) {
    showMetricSubTaskDetail(subTaskId);
  };

  function showMetricSubTaskDetail(subTaskId) {
    const body = document.getElementById('metric-dispatch-detail-body');
    const found = window.MetricDispatchStore?.getSubTaskById(subTaskId);
    if (!body) return;
    if (!found) {
      body.innerHTML = '<p class="muted">未找到子任务</p>';
      showMetricHubView('detail');
      return;
    }
    const { parent, subTask } = found;
    const title = document.getElementById('metric-dispatch-detail-title');
    if (title) title.textContent = parent.metricName;
    body.innerHTML = typeof window.renderDispatchSubTaskDetail === 'function'
      ? renderDispatchSubTaskDetail(parent, subTask)
      : '<p class="muted">详情组件未加载</p>';
    if (typeof window.bindDispatchSubTaskActions === 'function') {
      bindDispatchSubTaskActions(parent, subTask, body);
    }
    if (typeof window.mountDispatchRootCauseFlow === 'function') {
      mountDispatchRootCauseFlow(parent);
    }
    showMetricHubView('detail');
  }

  /** 兼容旧链接 ?detail=父任务ID → 打开第一个子任务 */
  function showMetricDispatchDetail(parentId) {
    const parent = MetricDispatchStore?.getById(parentId);
    const first = (parent?.subTasks || []).find(s => !s.parentSubTaskId) || parent?.subTasks?.[0];
    if (first) showMetricSubTaskDetail(first.id);
    else showMetricSubTaskDetail(parentId);
  }

  function bindDispatchModals() {
    document.getElementById('btn-dispatch-collab-submit')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-dispatch-collab');
      const subTaskId = modal?.dataset.subTaskId;
      const members = [...document.querySelectorAll('#dispatch-collab-body input[name="collab-member"]:checked')]
        .map(cb => cb.value);
      const note = document.getElementById('collab-note')?.value || '';
      if (!members.length) { alert('请选择协同成员'); return; }
      MetricDispatchStore.collaborateSubTask(subTaskId, members, note);
      if (typeof closeModal === 'function') closeModal('modal-dispatch-collab');
      alert('已进入部门内部协同');
      location.reload();
    });

    document.getElementById('btn-dispatch-transfer-submit')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-dispatch-transfer');
      const subTaskId = modal?.dataset.subTaskId;
      const found = MetricDispatchStore.getSubTaskById(subTaskId);
      if (!found) return;
      const { parent, subTask } = found;
      let targets = [];
      if (parent.dispatchMode === 'dept') {
        targets = [...document.querySelectorAll('#dispatch-transfer-body input[name="transfer-target"]:checked')]
          .map(cb => ({
            id: cb.value,
            name: cb.dataset.name,
            org: cb.dataset.org,
            role: cb.dataset.role,
            dept: cb.dataset.dept
          }));
      } else {
        targets = [...document.querySelectorAll('#dispatch-transfer-body input[name="transfer-county"]:checked')]
          .map(cb => ({ id: cb.value, name: cb.dataset.name }));
      }
      if (!targets.length) { alert('请选择转派对象'); return; }
      MetricDispatchStore.transferSubTask(subTaskId, targets);
      if (typeof closeModal === 'function') closeModal('modal-dispatch-transfer');
      alert('转派成功，已生成下级子任务');
      location.reload();
    });
  }

  function switchHubTab(tab) {
    document.querySelectorAll('#dispatch-hub-tabs button').forEach(b => {
      const on = b.dataset.hubTab === tab;
      b.classList.toggle('active', on);
    });
    document.getElementById('dispatch-hub-metric')?.classList.toggle('active', tab === 'metric');
    document.getElementById('dispatch-hub-strategy')?.classList.toggle('active', tab === 'strategy');
  }

  function initDispatchHub() {
    const params = new URLSearchParams(location.search);
    const hubTab = params.get('tab') || 'metric';
    const metricDetail = params.get('detail');

    switchHubTab(hubTab);

    if (hubTab === 'metric') {
      const subTaskId = params.get('subTask');
      bindDispatchModals();
      if (subTaskId) {
        showMetricSubTaskDetail(subTaskId);
      } else if (metricDetail) {
        showMetricDispatchDetail(metricDetail);
      } else {
        let all = MetricDispatchStore.getAll();
        if (!all.length) MetricDispatchStore.resetDemoData();
        showMetricHubView('list');
        renderMetricDispatchList();
        document.getElementById('btn-metric-dispatch-filter')?.addEventListener('click', () => {
          metricPage = 1;
          renderMetricDispatchList();
        });
        document.getElementById('btn-reset-metric-demo')?.addEventListener('click', () => {
          MetricDispatchStore.resetDemoData();
          metricPage = 1;
          renderMetricDispatchList();
          alert('已恢复演示数据');
        });
      }
    }

    document.querySelectorAll('#dispatch-hub-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.hubTab;
        if (t === 'metric') {
          window.location.href = 'dispatch-assign.html?tab=metric';
        } else {
          window.location.href = 'dispatch-assign.html?tab=strategy';
        }
      });
    });
  }

  function parseVolume(scaleLabel) {
    return parseInt(String(scaleLabel || '').replace(/[^\d]/g, ''), 10) || 1000;
  }

  function showView(view) {
    document.getElementById('dispatch-view-list')?.classList.toggle('active', view === 'list');
    document.getElementById('dispatch-view-detail')?.classList.toggle('active', view === 'detail');
  }

  function renderStrategyPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('dispatch-list-pagination', {
      total,
      page: strategyPage,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        strategyPage = nextPage;
        renderDispatchList();
      }
    });
    strategyPage = result.page;
  }

  function renderDispatchList() {
    const tbody = document.getElementById('dispatch-list-tbody');
    const countEl = document.getElementById('dispatch-list-count');
    if (!tbody || !window.JxStrategyStore) return;

    const kw = (document.getElementById('dispatch-filter-id')?.value || '').trim().toLowerCase();
    const stFilter = document.getElementById('dispatch-filter-status')?.value || '';

    let strategies = JxStrategyStore.getStrategies().filter(s =>
      ['approved', 'pending', 'running', 'stopped'].includes(s.status)
    );

    if (kw) {
      strategies = strategies.filter(s =>
        (s.id + s.name).toLowerCase().includes(kw)
      );
    }

    const rows = strategies.map(s => {
      const d = JxStrategyStore.getDispatchByStrategy(s.id);
      let dispatchStatus = 'none';
      if (d) dispatchStatus = d.status === 'completed' ? 'completed' : 'running';
      return { strategy: s, dispatch: d, dispatchStatus };
    });

    const filtered = stFilter
      ? rows.filter(r => r.dispatchStatus === stFilter)
      : rows;

    if (countEl) countEl.textContent = `共 ${filtered.length} 条`;

    const pageRows = TablePagination
      ? TablePagination.slice(filtered, strategyPage, PAGE_SIZE)
      : filtered;

    tbody.innerHTML = pageRows.map(({ strategy: s, dispatch: d, dispatchStatus }) => {
      const dispatchBadge = dispatchStatus === 'none'
        ? '<span class="badge badge-warning">待派发</span>'
        : dispatchStatus === 'running'
          ? '<span class="badge badge-success">执行中</span>'
          : '<span class="badge badge-info">已完成</span>';
      const href = JxStrategyLinks.dispatchDetail(s.id);
      return `<tr>
        <td><code class="id-chip">${esc(s.id)}</code></td>
        <td><strong>${esc(s.name)}</strong><br><small class="muted">${esc(s.type)}</small></td>
        <td>${d ? `<code class="id-chip">${esc(d.id)}</code>` : '<span class="muted">—</span>'}</td>
        <td>${d ? esc(d.target) : '—'}</td>
        <td>${d ? (d.volume?.toLocaleString?.() || d.volume) : '—'}</td>
        <td>${esc(d?.cities || s.cities || '—')}</td>
        <td>${dispatchBadge}</td>
        <td><a href="${href}" class="btn btn-primary btn-sm">${d ? '查看详情' : '去派发'}</a></td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无记录</td></tr>';

    renderStrategyPagination(filtered.length);
  }

  function renderDispatchDetail(strategyId) {
    const s = JxStrategyStore.getStrategy(strategyId);
    const d = JxStrategyStore.getDispatchByStrategy(strategyId);
    const idEl = document.getElementById('dispatch-detail-strategy-id');
    const body = document.getElementById('dispatch-detail-body');
    if (!s || !body) {
      alert('未找到策略：' + strategyId);
      window.location.href = JxStrategyLinks.dispatchList();
      return;
    }

    if (idEl) idEl.textContent = strategyId;

    const strategyCard = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span>关联策略信息</span>
          <a href="${JxStrategyLinks.list()}" class="btn btn-ghost btn-sm">策略中心</a>
        </div>
        <div class="card-body">
          <div class="strategy-segment-card">
            <div class="strategy-seg-row"><span class="k">策略 ID</span><code class="id-chip">${esc(s.id)}</code></div>
            <div class="strategy-seg-row"><span class="k">策略名称</span><strong>${esc(s.name)}</strong></div>
            <div class="strategy-seg-row"><span class="k">目标客群</span><span>${esc(s.segment)} · ${esc(s.scaleLabel || '')}</span></div>
            <div class="strategy-seg-row"><span class="k">产品/渠道</span><span>${esc(s.product)} · ${esc(s.channelLabel || s.channel)}</span></div>
            <div class="strategy-seg-row"><span class="k">生效周期</span><span>${esc(s.period)}</span></div>
          </div>
        </div>
      </div>`;

    if (d) {
      const st = d.status === 'running'
        ? '<span class="badge badge-success">执行中</span>'
        : '<span class="badge badge-info">已完成</span>';
      body.innerHTML = strategyCard + `
        <div class="card">
          <div class="card-header"><span>派发任务详情</span><span>${st}</span></div>
          <div class="card-body">
            <div class="detail-kv-grid">
              <div class="detail-kv"><span class="k">派发任务 ID</span><code class="id-chip">${esc(d.id)}</code></div>
              <div class="detail-kv"><span class="k">派发时间</span><span>${esc(d.dispatchedAt)}</span></div>
              <div class="detail-kv"><span class="k">派发对象</span><span>${esc(d.target)}</span></div>
              <div class="detail-kv"><span class="k">派发量级</span><span>${d.volume?.toLocaleString?.() || d.volume} 人</span></div>
              <div class="detail-kv"><span class="k">覆盖地市</span><span>${esc(d.cities)}</span></div>
              <div class="detail-kv"><span class="k">网格范围</span><span>${esc(d.gridScope || '—')}</span></div>
              <div class="detail-kv"><span class="k">执行日期</span><span>${esc(d.execDate || '—')}</span></div>
              <div class="detail-kv full"><span class="k">派发说明</span><span>${esc(d.remark || '—')}</span></div>
            </div>
          </div>
        </div>`;
      return;
    }

    body.innerHTML = strategyCard + `
      <div class="card">
        <div class="card-header"><span>新建派发任务</span></div>
        <div class="card-body">
          <form id="dispatch-form" class="strategy-form">
            <input type="hidden" name="strategyId" value="${esc(strategyId)}"/>
            <div class="form-grid">
              <div class="form-field">
                <label class="req">派发对象</label>
                <select name="target" required>
                  <option>外呼坐席池-A（省中心）</option>
                  <option>外呼坐席池-B（地市外包）</option>
                  <option>网格经理+厅店店员</option>
                  <option>短信+APP 自动通道</option>
                </select>
              </div>
              <div class="form-field">
                <label class="req">派发量级</label>
                <input type="number" name="volume" id="dispatch-volume" value="${parseVolume(s.scaleLabel)}" required/>
              </div>
              <div class="form-field">
                <label class="req">覆盖地市</label>
                <input type="text" name="cities" id="dispatch-cities" value="${esc(s.cities || '全省')}" required/>
              </div>
              <div class="form-field">
                <label>网格范围</label>
                <select name="gridScope">
                  <option>按策略网格优先级自动匹配</option>
                  <option>仅高价值网格</option>
                  <option>离网率高网格优先</option>
                </select>
              </div>
              <div class="form-field">
                <label class="req">执行日期</label>
                <input type="date" name="execDate" value="2026-05-28" required/>
              </div>
              <div class="form-field full">
                <label>派发说明</label>
                <textarea name="remark" rows="2" placeholder="任务说明、注意事项"></textarea>
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> 确认派发</button>
          </form>
        </div>
      </div>`;

    document.getElementById('dispatch-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const dispatch = JxStrategyStore.createDispatch(strategyId, {
        target: fd.get('target'),
        volume: parseInt(fd.get('volume'), 10) || 0,
        cities: fd.get('cities'),
        gridScope: fd.get('gridScope'),
        execDate: fd.get('execDate'),
        remark: fd.get('remark')
      });
      if (!dispatch) return;
      if (confirm(`派发成功（任务 ${dispatch.id}）。是否查看该策略的评估？`)) {
        window.location.href = JxStrategyLinks.evalDetail(strategyId);
      } else {
        renderDispatchDetail(strategyId);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dispatch-view-list')) return;

    initDispatchHub();

    const params = new URLSearchParams(location.search);
    const strategyId = params.get('strategyId');
    const hubTab = params.get('tab') || 'metric';

    if (hubTab !== 'strategy') return;

    if (strategyId) {
      showView('detail');
      renderDispatchDetail(strategyId);
    } else {
      showView('list');
      renderDispatchList();
      document.getElementById('btn-dispatch-filter')?.addEventListener('click', () => {
        strategyPage = 1;
        renderDispatchList();
      });
    }
  });
})();
