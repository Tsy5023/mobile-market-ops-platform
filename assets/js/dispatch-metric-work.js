/** 指标调度 · 任务分类（主管）与调度派发（执行人）视图 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function subStatusBadge(st) {
    const labels = window.MetricDispatchStore?.STATUS_LABELS || {};
    const text = labels[st] || st;
    const cls = {
      pending_claim: 'badge-warning',
      executing: 'badge-success',
      collaborating: 'badge-info',
      transferred: 'badge-secondary',
      completed: 'badge-info'
    }[st] || 'badge-secondary';
    return `<span class="badge ${cls}">${esc(text)}</span>`;
  }

  function parentStatusBadge(st) {
    if (st === 'completed') return '<span class="badge badge-info">已完成</span>';
    if (st === 'pending') return '<span class="badge badge-warning">待启动</span>';
    return '<span class="badge badge-success">进行中</span>';
  }

  function progressBar(pct, prog) {
    return `
      <div class="dispatch-progress-wrap">
        <div class="dispatch-progress-head">
          <span>子任务进度</span>
          <strong>${pct}%</strong>
          <span class="muted">（${prog.done}/${prog.total} 已完成）</span>
        </div>
        <div class="dispatch-progress-track">
          <div class="dispatch-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="dispatch-progress-legend">
          <span><i class="dot pending"></i>待认领 ${prog.pending}</span>
          <span><i class="dot running"></i>处理中 ${prog.executing}</span>
          <span><i class="dot done"></i>已完成 ${prog.done}</span>
        </div>
      </div>`;
  }

  function formatResponsible(st) {
    const name = st.claimedBy || st.assignee?.name || '待指派';
    const dept = st.assignee?.dept || st.assignee?.org || '';
    return dept
      ? `<strong>${esc(name)}</strong><br><small class="muted">${esc(dept)}</small>`
      : `<strong>${esc(name)}</strong>`;
  }

  function formatSubTaskSource(st, parentSt, isChild) {
    if (isChild && parentSt) {
      return `<span class="muted">转派自 ${esc(parentSt.assignee?.name || '上级')}</span>`;
    }
    return '<span class="muted">省公司派发</span>';
  }

  function subTaskMetricCells(parent, st) {
    const snap = st.metricSnapshot || {};
    const momVal = snap.mom || parent.metricMom || '';
    const momHtml = momVal
      ? `<span class="badge ${String(momVal).startsWith('-') ? 'badge-danger' : 'badge-success'}">${esc(momVal)}</span>`
      : '<span class="badge badge-secondary">+0.0%</span>';
    if (parent.dispatchMode === 'city') {
      return `
        <td><strong>${esc(st.scopeLabel || st.assignee?.org || '—')}</strong></td>
        <td><strong>${esc(snap.metricValue || parent.metricValue || '—')}</strong></td>
        <td>${esc(snap.targetValue || parent.metricTarget || '—')}</td>
        <td>${momHtml}</td>`;
    }
    return `
      <td><strong>${esc(st.scopeLabel || st.assignee?.dept || '—')}</strong></td>
      <td><strong>${esc(snap.metricValue || parent.metricValue || '—')}</strong></td>
      <td>${esc(snap.targetValue || parent.metricTarget || '—')}</td>
      <td>${momHtml}</td>`;
  }

  function renderSubTaskRows(parent) {
    const subs = parent.subTasks || [];
    const sorted = [...subs].sort((a, b) => {
      if (a.parentSubTaskId && !b.parentSubTaskId) return 1;
      if (!a.parentSubTaskId && b.parentSubTaskId) return -1;
      return 0;
    });
    const regionCol = parent.dispatchMode === 'city' ? '地市' : '部门';
    return sorted.map((st, idx) => {
      const isChild = !!st.parentSubTaskId;
      const parentSt = isChild ? subs.find(s => s.id === st.parentSubTaskId) : null;
      return `
        <tr class="${isChild ? 'sub-task-child' : ''}">
          <td class="muted">${idx + 1}</td>
          ${subTaskMetricCells(parent, st)}
          <td class="assignee-cell">${formatResponsible(st)}</td>
          <td>${subStatusBadge(st.status)}</td>
          <td>${formatSubTaskSource(st, parentSt, isChild)}</td>
        </tr>`;
    }).join('');
  }

  function tableActions(buttons) {
    return `<td class="list-actions-cell"><div class="list-actions">${buttons.join('')}</div></td>`;
  }

  /** 任务分类 · 父任务列表行 */
  window.renderTaskCategoryParentRow = function (parent) {
    const prog = MetricDispatchStore.getParentProgress(parent);
    const mode = MetricDispatchStore.dispatchModeLabel(parent.dispatchMode);
    const actions = tableActions([
      `<button type="button" class="btn btn-primary btn-sm" data-tc-action="detail" data-parent-id="${esc(parent.id)}">查看进度</button>`,
      `<button type="button" class="btn btn-ghost btn-sm" data-tc-action="urge" data-parent-id="${esc(parent.id)}">催办</button>`
    ]);
    return `
      <tr data-parent-id="${esc(parent.id)}">
        <td><code class="id-chip">${esc(parent.id)}</code></td>
        <td><span class="badge ${parent.dispatchMode === 'dept' ? 'badge-info' : 'badge-secondary'}">${esc(mode)}</span></td>
        <td><strong>${esc(parent.metricName)}</strong><br><small class="muted">${esc(parent.treeName)}</small></td>
        <td><span class="tc-progress-text">${prog.done}/${prog.total} 已完成</span></td>
        <td>${parentStatusBadge(parent.status)}</td>
        <td>${esc(parent.dispatchedAt)}</td>
        ${actions}
      </tr>`;
  };

  window.renderTaskCategoryParentDetail = function (parent) {
    if (!parent) return '<p class="muted">未找到调度任务</p>';
    const prog = MetricDispatchStore.getParentProgress(parent);
    const regionCol = parent.dispatchMode === 'city' ? '地市' : '部门';
    const modeLabel = MetricDispatchStore.dispatchModeLabel(parent.dispatchMode);
    const modeCls = parent.dispatchMode === 'dept' ? 'badge-info' : 'badge-secondary';
    const momVal = parent.metricMom || '';
    const momHtml = momVal
      ? `<span class="tc-mom ${String(momVal).startsWith('-') ? 'neg' : 'pos'}">${esc(momVal)}</span>`
      : '';
    return `
      <div class="tc-overview">
        <div class="tc-overview-head">
          <div class="tc-overview-head-main">
            <div class="tc-overview-tags">
              <span class="badge ${modeCls}">${esc(modeLabel)}</span>
              ${parentStatusBadge(parent.status)}
            </div>
            <h2 class="tc-overview-metric">${esc(parent.metricName)}</h2>
            <div class="tc-overview-id"><code class="id-chip">${esc(parent.id)}</code></div>
          </div>
          <div class="tc-overview-progress-ring">
            <div class="tc-progress-circle" style="--pct:${prog.pct}">
              <span class="tc-progress-pct">${prog.pct}%</span>
              <span class="tc-progress-sub">${prog.done}/${prog.total}</span>
            </div>
            <span class="tc-progress-label">子任务完成</span>
          </div>
        </div>
        <div class="tc-overview-metrics">
          <div class="tc-overview-metric-card">
            <span class="k">全省指标值</span>
            <span class="v">${esc(parent.metricValue)}</span>
            ${momHtml}
          </div>
          <div class="tc-overview-metric-card accent">
            <span class="k">目标值</span>
            <span class="v">${esc(parent.metricTarget || '—')}</span>
          </div>
          <div class="tc-overview-metric-card">
            <span class="k">所属指标树</span>
            <span class="v v-sm">${esc(parent.treeName)}</span>
          </div>
          <div class="tc-overview-metric-card">
            <span class="k">派发时间</span>
            <span class="v v-sm">${esc(parent.dispatchedAt)}</span>
          </div>
        </div>
        <div class="tc-overview-meta">
          <div class="tc-meta-item"><span class="k">发起人</span><span>${esc(parent.createdBy || '张明')}</span></div>
          <div class="tc-meta-item"><span class="k">发起部门</span><span>${esc(parent.createdByOrg || '省公司运营部')}</span></div>
          <div class="tc-meta-item"><span class="k">待认领</span><strong>${prog.pending}</strong></div>
          <div class="tc-meta-item"><span class="k">处理中</span><strong>${prog.executing}</strong></div>
          <div class="tc-meta-item"><span class="k">已完成</span><strong>${prog.done}</strong></div>
        </div>
        ${parent.remark ? `
        <div class="tc-overview-remark">
          <span class="k"><i class="fas fa-clipboard-list"></i> 调度要求</span>
          <p>${esc(parent.remark)}</p>
        </div>` : ''}
      </div>
      <div class="card tc-subtasks-card">
        <div class="card-header">
          <span><i class="fas fa-tasks"></i> 子任务处理进度</span>
          <span class="muted" style="font-size:12px;font-weight:normal">共 ${prog.total} 个子任务</span>
        </div>
        <div class="card-body table-scroll" style="padding:0">
          <table class="data-table tc-subtasks-table">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>${regionCol}</th>
                <th>指标值</th>
                <th>目标值</th>
                <th>环比</th>
                <th>负责人</th>
                <th>状态</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>${renderSubTaskRows(parent) || '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无子任务</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  };

  /** 调度派发 · 子任务列表行（列顺序与表头一致） */
  window.renderDispatchSubTaskRow = function (row) {
    const { parent, subTask: st } = row;
    const assigneeLabel = MetricDispatchStore.formatAssigneeLabel(st.assignee);
    const btns = [
      `<button type="button" class="btn btn-primary btn-sm" data-da-action="detail" data-sub-task-id="${esc(st.id)}">详情</button>`
    ];
    return `
      <tr data-sub-task-id="${esc(st.id)}">
        <td><code class="id-chip">${esc(st.id)}</code></td>
        <td><strong>${esc(parent.metricName)}</strong></td>
        <td>${esc(parent.treeName)}</td>
        <td><span class="badge ${parent.dispatchMode === 'dept' ? 'badge-info' : 'badge-secondary'}">${esc(MetricDispatchStore.dispatchModeLabel(parent.dispatchMode))}</span></td>
        <td>${esc(assigneeLabel)}</td>
        <td>${subStatusBadge(st.status)}</td>
        <td>${esc(parent.dispatchedAt)}</td>
        ${tableActions(btns)}
      </tr>`;
  };

  window.bindTaskCategoryListActions = function (root) {
    const scope = root || document;
    scope.querySelectorAll('[data-tc-action="detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.parentId;
        if (typeof window.taskCategoryShowDetail === 'function') {
          window.taskCategoryShowDetail(id);
        } else {
          location.href = 'task-category.html?detail=' + encodeURIComponent(id);
        }
      });
    });
    scope.querySelectorAll('[data-tc-action="urge"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.parentId;
        MetricDispatchStore.urgeParentTask(id);
        alert('已向各子任务负责人发送催办提醒（演示）');
      });
    });
  };

  window.bindDispatchSubTaskListActions = function (root) {
    const scope = root || document;
    scope.querySelectorAll('[data-da-action="detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.subTaskId;
        if (typeof window.dispatchShowSubTaskDetail === 'function') {
          window.dispatchShowSubTaskDetail(id);
        } else {
          location.href = 'dispatch-assign.html?tab=metric&subTask=' + encodeURIComponent(id);
        }
      });
    });
  };

  function resolveMetricNodeForDispatch(parent) {
    if (typeof window.getTreeDetail === 'function') {
      try {
        const detail = window.getTreeDetail(parent.treeId);
        function findNode(n, id) {
          if (!n) return null;
          if (n.id === id) return n;
          for (const c of n.children || []) {
            const f = findNode(c, id);
            if (f) return f;
          }
          return null;
        }
        const found = findNode(detail?.root, parent.metricId);
        if (found) {
          return { ...found, status: found.status || 'alert', alert: found.alert !== false };
        }
      } catch (e) { /* ignore */ }
    }
    return {
      id: parent.metricId,
      name: parent.metricName,
      value: parent.metricValue,
      mom: parent.metricMom || '-2.1%',
      yoy: '-1.2%',
      status: 'alert',
      alert: true
    };
  }

  function renderDispatchRootCausePanel() {
    return `
      <div class="card dispatch-rc-panel" style="margin-top:12px">
        <div class="card-header">
          <span><i class="fas fa-sitemap"></i> 根因分析</span>
        </div>
        <div class="card-body dispatch-rc-body">
          <div id="dispatch-root-cause-flow"></div>
        </div>
      </div>`;
  }

  window.mountDispatchRootCauseFlow = function (parent) {
    const node = resolveMetricNodeForDispatch(parent);
    if (typeof window.renderRootCauseFlow !== 'function') return;
    window.renderRootCauseFlow(node, 'dispatch-root-cause-flow');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (typeof window.scheduleRcTagLayouts === 'function') {
          window.scheduleRcTagLayouts();
        }
      });
    });
  };

  /** 调度派发 · 子任务详情 + 操作 */
  window.renderDispatchSubTaskDetail = function (parent, subTask) {
    if (!parent || !subTask) return '<p class="muted">未找到子任务</p>';
    const canAct = ['executing', 'collaborating'].includes(subTask.status);
    const canTransfer = ['executing', 'collaborating', 'pending_claim'].includes(subTask.status);
    const canCollab = parent.dispatchMode === 'dept' && canAct;
    const snap = subTask.metricSnapshot || {};
    const taskReq = subTask.remark || parent.remark || '—';

    return `
      <div class="metric-dispatch-action-bar" data-sub-task-id="${esc(subTask.id)}">
        <button type="button" class="btn btn-outline btn-sm" data-st-action="transfer" ${canTransfer ? '' : 'disabled'}><i class="fas fa-share"></i> 转派</button>
        <button type="button" class="btn btn-outline btn-sm" data-st-action="collab" ${canCollab ? '' : 'disabled'}><i class="fas fa-people-arrows"></i> 协同</button>
        <button type="button" class="btn btn-ghost btn-sm" data-st-action="complete" ${canAct ? '' : 'disabled'}><i class="fas fa-check"></i> 标记完成</button>
      </div>
      <div class="card">
        <div class="card-header">
          <span>子任务 · ${esc(parent.metricName)}</span>
        </div>
        <div class="card-body">
          <div class="metric-dispatch-detail-summary">
            <div>
              <div class="muted" style="font-size:12px">指标当前值</div>
              <div style="font-size:20px;font-weight:700">${esc(snap.metricValue || parent.metricValue)}</div>
            </div>
            <div>
              <div class="muted" style="font-size:12px">指标目标值</div>
              <div style="font-size:20px;font-weight:700;color:#0d9488">${esc(snap.targetValue || parent.metricTarget || '—')}</div>
            </div>
            <div>
              <div class="muted" style="font-size:12px">环比</div>
              <div style="font-size:18px;font-weight:700">${esc(snap.mom || '—')}</div>
            </div>
          </div>
          <div class="detail-kv-grid" style="margin-top:14px">
            <div class="detail-kv"><span class="k">调度任务编号</span><code class="id-chip">${esc(parent.id)}</code></div>
            <div class="detail-kv"><span class="k">子任务编号</span><code class="id-chip">${esc(subTask.id)}</code></div>
            <div class="detail-kv"><span class="k">调度方式</span><span>${esc(MetricDispatchStore.dispatchModeLabel(parent.dispatchMode))}</span></div>
            <div class="detail-kv"><span class="k">调度对象</span><strong>${esc(MetricDispatchStore.formatAssigneeLabel(subTask.assignee))}</strong></div>
            <div class="detail-kv"><span class="k">子任务状态</span>${subStatusBadge(subTask.status)}</div>
            <div class="detail-kv"><span class="k">所属指标树</span><span>${esc(parent.treeName)}</span></div>
          </div>
          <div class="dispatch-task-requirement">
            <div class="k">调度任务要求</div>
            <p>${esc(taskReq)}</p>
          </div>
        </div>
      </div>
      ${renderDispatchRootCausePanel()}
      ${(subTask.transferLog || []).length ? `
      <div class="card" style="margin-top:12px">
        <div class="card-header"><span>转派记录</span></div>
        <div class="card-body">
          <ul class="dispatch-log-list">
            ${subTask.transferLog.map(l => `<li>${esc(l.at)} · ${esc(l.by)} → ${esc((l.targets || []).join('；'))}</li>`).join('')}
          </ul>
        </div>
      </div>` : ''}`;
  };

  window.bindDispatchSubTaskActions = function (parent, subTask, rootEl) {
    const root = rootEl || document.getElementById('metric-dispatch-detail-body');
    const bar = root?.querySelector('.metric-dispatch-action-bar');
    if (!bar || !subTask) return;

    bar.querySelector('[data-st-action="collab"]')?.addEventListener('click', () => {
      if (typeof window.openDispatchCollabModal === 'function') {
        window.openDispatchCollabModal(parent, subTask);
      }
    });

    bar.querySelector('[data-st-action="transfer"]')?.addEventListener('click', () => {
      if (typeof window.openDispatchTransferModal === 'function') {
        window.openDispatchTransferModal(parent, subTask);
      }
    });

    bar.querySelector('[data-st-action="complete"]')?.addEventListener('click', () => {
      if (!confirm('确认将该子任务标记为已完成？')) return;
      MetricDispatchStore.completeSubTask(subTask.id);
      alert('子任务已完成');
      location.href = 'dispatch-assign.html?tab=metric';
    });
  };

  window.openDispatchCollabModal = function (parent, subTask) {
    const modal = document.getElementById('modal-dispatch-collab');
    const body = document.getElementById('dispatch-collab-body');
    if (!modal || !body) return;
    const staff = MetricDispatchStore.getDeptStaffByDept(subTask.assignee.dept)
      .filter(u => u.id !== subTask.assignee.userId);
    body.innerHTML = `
      <p class="muted" style="font-size:13px;margin-bottom:12px">部门内部协同（${esc(subTask.assignee.dept)}）</p>
      <div class="form-field full">
        <label>协同成员（可多选）</label>
        <div class="dispatch-pick-chips">
          ${staff.map(u => `
            <label class="dispatch-dept-user-chip">
              <input type="checkbox" name="collab-member" value="${esc(u.name)}"/>
              <span class="name">${esc(u.name)}</span>
              <span class="sub">${esc(u.role)}</span>
            </label>`).join('')}
        </div>
      </div>
      <div class="form-field full">
        <label>协同说明</label>
        <textarea id="collab-note" rows="2" placeholder="协同目标、分工等"></textarea>
      </div>`;
    modal.dataset.subTaskId = subTask.id;
    if (typeof openModal === 'function') openModal('modal-dispatch-collab');
  };

  window.openDispatchTransferModal = function (parent, subTask) {
    const modal = document.getElementById('modal-dispatch-transfer');
    const body = document.getElementById('dispatch-transfer-body');
    if (!modal || !body) return;

    if (parent.dispatchMode === 'dept') {
      const staff = MetricDispatchStore.getDeptStaffByDept(subTask.assignee.dept)
        .filter(u => u.name !== subTask.assignee.name);
      body.innerHTML = `
        <p class="muted" style="font-size:13px;margin-bottom:12px">向 <strong>${esc(subTask.assignee.dept)}</strong> 内转派</p>
        <div class="dispatch-pick-chips">
          ${staff.map(u => `
            <label class="dispatch-dept-user-chip">
              <input type="checkbox" name="transfer-target" value="${esc(u.id)}"
                data-name="${esc(u.name)}" data-org="${esc(u.org)}" data-role="${esc(u.role)}" data-dept="${esc(u.dept)}"/>
              <span class="name">${esc(u.name)}</span>
              <span class="sub">${esc(u.role)}</span>
            </label>`).join('')}
        </div>`;
    } else {
      const counties = MetricDispatchStore.getCityCounties(subTask.scopeId);
      body.innerHTML = `
        <p class="muted" style="font-size:13px;margin-bottom:12px">向 <strong>${esc(subTask.scopeLabel)}</strong> 下区县维度转派</p>
        <div class="dispatch-pick-chips">
          ${counties.map(c => `
            <label class="dispatch-dept-user-chip">
              <input type="checkbox" name="transfer-county" value="${esc(c.id)}" data-name="${esc(c.name)}"/>
              <span class="name">${esc(c.name)}</span>
            </label>`).join('') || '<span class="muted">暂无区县配置</span>'}
        </div>`;
    }
    modal.dataset.subTaskId = subTask.id;
    modal.dataset.parentId = parent.id;
    if (typeof openModal === 'function') openModal('modal-dispatch-transfer');
  };
})();
