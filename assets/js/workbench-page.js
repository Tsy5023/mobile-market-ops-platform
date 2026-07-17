/** 运营工作台 · 工单 / 策略 / 预警聚合 */
(function () {
  const LIMIT = 6;

  const MODULES = {
    workorder: {
      title: '我的工单',
      icon: 'fa-clipboard-list',
      moreHref: 'dispatch-assign.html?tab=metric',
      tabs: [
        { id: 'mine', label: '我发起的' },
        { id: 'todo', label: '我待办的' },
        { id: 'approval', label: '待审批' }
      ]
    },
    strategy: {
      title: '我的策略',
      icon: 'fa-chess-knight',
      moreHref: 'strategy-category.html?tab=segment',
      tabs: [
        { id: 'mine', label: '我发起的' },
        { id: 'approval', label: '待审批' }
      ]
    },
    alert: {
      title: '我的预警',
      icon: 'fa-bell',
      moreHref: 'alert-rules.html',
      tabs: [
        { id: 'mine', label: '我发起的' },
        { id: 'approval', label: '待审批' }
      ]
    }
  };

  const state = {
    workorder: 'mine',
    strategy: 'mine',
    alert: 'mine'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getUser() {
    return window.MetricDispatchStore?.getCurrentUser?.()
      || window.MetricDispatchCurrentUser
      || { name: '张明', org: '省公司运营部' };
  }

  function isAssignee(sub, user) {
    return sub?.assignee?.name === user.name
      || sub?.assignee?.userId === user.id
      || sub?.claimedBy === user.name;
  }

  function subStatusBadge(status) {
    const map = window.MetricDispatchStore?.STATUS_LABELS || {};
    const label = map[status] || status || '—';
    const cls = status === 'completed' ? 'badge-success'
      : status === 'pending_claim' ? 'badge-warning'
        : status === 'executing' ? 'badge-primary' : 'badge-info';
    return `<span class="badge ${cls}">${esc(label)}</span>`;
  }

  function strategyStatusBadge(status) {
    const st = window.JxStrategyStore?.getDisplayStatus?.({ status })
      || { cls: 'badge-info', label: status || '—' };
    return `<span class="badge ${st.cls}">${esc(st.label)}</span>`;
  }

  function alertLevelBadge(level) {
    const cls = window.AlertRulesStore?.levelClass?.(level) || 'alert-level-yellow';
    return `<span class="badge ${cls}">${esc(level || '—')}</span>`;
  }

  function rowLink(href) {
    return href ? ` data-href="${esc(href)}"` : '';
  }

  /* —— 工单 —— */
  function fetchWorkOrders(tab) {
    const user = getUser();
    const store = window.MetricDispatchStore;
    if (!store) return [];

    if (tab === 'mine') {
      return store.getAll()
        .filter(p => p.createdBy === user.name)
        .map(p => ({
          key: p.id,
          col1: `<code class="id-chip">${esc(p.id)}</code>`,
          col2: `<div class="wb-title-cell"><strong>${esc(p.metricName || p.workOrderTitle || '—')}</strong><small>${esc(p.treeName || p.segmentName || '')}</small></div>`,
          col3: subStatusBadge(p.status),
          col4: esc(p.dispatchedAt || '—'),
          href: `task-category.html?detail=${encodeURIComponent(p.id)}`
        }));
    }

    if (tab === 'todo') {
      const active = new Set(['pending_claim', 'executing', 'collaborating', 'transferred']);
      return store.getAllSubTaskRows()
        .filter(({ parent, subTask }) => {
          if (!active.has(subTask.status)) return false;
          return isAssignee(subTask, user) || parent.createdBy === user.name;
        })
        .map(({ parent, subTask }) => ({
          key: subTask.id,
          col1: `<code class="id-chip">${esc(subTask.id)}</code>`,
          col2: `<div class="wb-title-cell"><strong>${esc(parent.metricName || parent.workOrderTitle || '—')}</strong><small>${esc(subTask.scopeLabel || '—')}${parent.createdBy === user.name && !isAssignee(subTask, user) ? ' · 待督办' : ''}</small></div>`,
          col3: subStatusBadge(subTask.status),
          col4: esc(subTask.claimedAt || parent.dispatchedAt || '—'),
          href: `dispatch-assign.html?tab=metric&subTask=${encodeURIComponent(subTask.id)}`
        }));
    }

    // 待审批：他人提交待审 + 本人派发待认领督办
    const rows = [];
    store.getAll().forEach((parent) => {
      if (parent.approvalStatus === 'pending_approval' && parent.createdBy !== user.name) {
        rows.push({
          key: parent.id + '-apr',
          col1: `<code class="id-chip">${esc(parent.id)}</code>`,
          col2: `<div class="wb-title-cell"><strong>${esc(parent.metricName || parent.workOrderTitle || '—')}</strong><small>${esc(parent.createdBy || '—')} · 调度审批</small></div>`,
          col3: '<span class="badge badge-warning">待审批</span>',
          col4: esc(parent.dispatchedAt || '—'),
          href: `task-category.html?detail=${encodeURIComponent(parent.id)}`
        });
      }
      if (parent.createdBy === user.name) {
        (parent.subTasks || []).filter(st => st.status === 'pending_claim').forEach((subTask) => {
          rows.push({
            key: subTask.id + '-claim',
            col1: `<code class="id-chip">${esc(subTask.id)}</code>`,
            col2: `<div class="wb-title-cell"><strong>${esc(parent.metricName || '—')}</strong><small>${esc(subTask.scopeLabel || '—')} · 待认领</small></div>`,
            col3: '<span class="badge badge-warning">待审批</span>',
            col4: esc(parent.dispatchedAt || '—'),
            href: `dispatch-assign.html?tab=metric&subTask=${encodeURIComponent(subTask.id)}`
          });
        });
      }
    });
    return rows;
  }

  /* —— 策略 —— */
  function fetchStrategies(tab) {
    const user = getUser();

    if (tab === 'mine') {
      if (!window.JxStrategyStore) return [];
      return JxStrategyStore.getStrategies()
        .filter(s => s.creator === user.name)
        .map(s => ({
          key: s.id,
          col1: `<code class="id-chip">${esc(s.strategyCode || s.id)}</code>`,
          col2: `<div class="wb-title-cell"><strong>${esc(s.name)}</strong><small>${esc(s.segment || '—')} · ${esc(s.scaleLabel || '')}</small></div>`,
          col3: strategyStatusBadge(s.status),
          col4: esc(s.createdAt || '—'),
          href: `strategy-category.html?tab=segment`
        }));
    }

    if (!window.JxApprovalStore) return [];
    return JxApprovalStore.getPending().map(r => ({
      key: r.id,
      col1: `<code class="id-chip">${esc(r.strategyCode || r.id)}</code>`,
      col2: `<div class="wb-title-cell"><strong>${esc(r.activityName || '—')}</strong><small>${esc(r.submitter || '—')} · ${esc(r.scene || '')}</small></div>`,
      col3: '<span class="badge badge-warning">待审批</span>',
      col4: esc(r.submittedAt || '—'),
      href: 'strategy-approval.html'
    }));
  }

  /* —— 预警 —— */
  function fetchAlerts(tab) {
    const user = getUser();
    const rules = window.AlertRulesStore?.getAll?.() || [];

    if (tab === 'mine') {
      return rules
        .filter(r => (r.creator || '张明') === user.name)
        .map(r => ({
          key: r.id,
          col1: `<code class="id-chip">${esc(r.id)}</code>`,
          col2: `<div class="wb-title-cell"><strong>${esc(r.name)}</strong><small>${esc(r.metricName || '—')}</small></div>`,
          col3: alertLevelBadge(r.level),
          col4: esc(r.updatedAt || r.createdAt || '—'),
          href: 'alert-rules.html'
        }));
    }

    return rules
      .filter(r => r.approvalStatus === 'pending_approval')
      .map(r => ({
        key: r.id,
        col1: `<code class="id-chip">${esc(r.id)}</code>`,
        col2: `<div class="wb-title-cell"><strong>${esc(r.name)}</strong><small>${esc(r.creator || '—')} · ${esc(r.metricName || '')}</small></div>`,
        col3: '<span class="badge badge-warning">待审批</span>',
        col4: esc(r.submittedAt || r.createdAt || '—'),
        href: 'alert-rules.html'
      }));
  }

  const FETCHERS = {
    workorder: fetchWorkOrders,
    strategy: fetchStrategies,
    alert: fetchAlerts
  };

  const TABLE_HEAD = {
    workorder: {
      mine: ['任务编号', '工单主题', '状态', '发起时间'],
      todo: ['子任务编号', '工单主题', '状态', '更新时间'],
      approval: ['编号', '工单主题', '状态', '提交时间']
    },
    strategy: {
      mine: ['策略编码', '策略名称', '状态', '创建时间'],
      approval: ['策略编码', '策略名称', '状态', '提交时间']
    },
    alert: {
      mine: ['规则编号', '预警规则', '等级', '更新时间'],
      approval: ['规则编号', '预警规则', '状态', '提交时间']
    }
  };

  function renderTable(moduleId, tab) {
    const fetcher = FETCHERS[moduleId];
    const heads = TABLE_HEAD[moduleId]?.[tab] || [];
    const rows = fetcher ? fetcher(tab) : [];
    const total = rows.length;
    const visible = rows.slice(0, LIMIT);

    if (!visible.length) {
      return '<div class="wb-empty">暂无数据</div>';
    }

    return `
      <div class="table-scroll">
        <table class="data-table wb-table">
          <thead><tr>${heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${visible.map(r => `
              <tr${rowLink(r.href)}>
                <td>${r.col1}</td>
                <td>${r.col2}</td>
                <td>${r.col3}</td>
                <td>${r.col4}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${total > LIMIT ? `<div class="wb-empty" style="padding:10px;border-top:1px solid #f1f5f9">还有 ${total - LIMIT} 条，点击右上角「更多」查看全部</div>` : ''}`;
  }

  function tabCount(moduleId, tabId) {
    const fetcher = FETCHERS[moduleId];
    return fetcher ? fetcher(tabId).length : 0;
  }

  function renderModule(moduleId) {
    const mod = MODULES[moduleId];
    const activeTab = state[moduleId];
    const tabsHtml = mod.tabs.map(t => {
      const cnt = tabCount(moduleId, t.id);
      return `<button type="button" class="wb-module-tab${t.id === activeTab ? ' active' : ''}" data-wb-module="${moduleId}" data-wb-tab="${t.id}">${esc(t.label)}<span class="wb-tab-count">${cnt}</span></button>`;
    }).join('');

    return `
      <section class="card wb-module" id="wb-module-${moduleId}">
        <div class="wb-module-header">
          <h2 class="wb-module-title"><i class="fas ${mod.icon}"></i> ${esc(mod.title)}</h2>
          <a class="wb-module-more" href="${esc(mod.moreHref)}">更多 <i class="fas fa-angle-right"></i></a>
        </div>
        <nav class="wb-module-tabs" aria-label="${esc(mod.title)}">${tabsHtml}</nav>
        <div class="wb-module-body" id="wb-body-${moduleId}">${renderTable(moduleId, activeTab)}</div>
      </section>`;
  }

  function switchTab(moduleId, tabId) {
    state[moduleId] = tabId;
    const mod = document.getElementById(`wb-module-${moduleId}`);
    if (!mod) return;
    mod.querySelectorAll('.wb-module-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.wbTab === tabId);
    });
    const body = document.getElementById(`wb-body-${moduleId}`);
    if (body) body.innerHTML = renderTable(moduleId, tabId);
  }

  function bindEvents(root) {
    root.querySelectorAll('.wb-module-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.wbModule, btn.dataset.wbTab);
      });
    });
    root.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-href]');
      if (tr?.dataset.href) location.href = tr.dataset.href;
    });
  }

  function initFromUrl() {
    const params = new URLSearchParams(location.search);
    if (params.get('wo')) state.workorder = params.get('wo');
    if (params.get('st')) state.strategy = params.get('st');
    if (params.get('al')) state.alert = params.get('al');
  }

  window.initWorkbenchPage = function () {
    const root = document.getElementById('wb-modules-root');
    if (!root) return;

    if (window.MetricDispatchStore && !MetricDispatchStore.getAll().length) {
      MetricDispatchStore.resetDemoData?.();
    }

    initFromUrl();
    root.innerHTML = ['workorder', 'strategy', 'alert'].map(renderModule).join('');
    bindEvents(root);
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('wb-modules-root')) initWorkbenchPage();
  });
})();
