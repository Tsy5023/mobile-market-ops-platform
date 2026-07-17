/** 策略诊断/审核评价管理 · 共享页面逻辑 */
(function () {
  const cfg = window.STRATEGY_FEEDBACK_CONFIG;
  if (!cfg) return;

  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  const PREFIX = cfg.prefix || 'sf';
  const ROW_ACTIONS_ONLY = !!cfg.rowActionsOnly;
  let page = 1;
  let selected = new Set();

  function store() { return window[cfg.storeName]; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function ratingHtml(r) {
    if (r.rating === 'like') return '<span class="rating-like"><i class="fas fa-thumbs-up"></i> 点赞</span>';
    const processed = r.processed ? '<span class="badge badge-success" style="margin-left:6px;font-size:11px">已处理</span>' : '';
    return '<span class="rating-dislike"><i class="fas fa-thumbs-down"></i> 点踩</span>' + processed;
  }

  function getFilters() {
    return {
      start: document.getElementById(PREFIX + '-start')?.value || '',
      end: document.getElementById(PREFIX + '-end')?.value || '',
      rating: document.getElementById(PREFIX + '-rating')?.value || '',
      kw: (document.getElementById(PREFIX + '-kw')?.value || '').trim()
    };
  }

  function getFiltered() {
    return store()?.filter(getFilters()) || [];
  }

  function updateBatchButtons() {
    if (ROW_ACTIONS_ONLY) return;
    const list = getFiltered();
    const selectedRows = list.filter(r => selected.has(r.id));
    const dislikePending = selectedRows.filter(r => r.rating === 'dislike' && !r.processed);
    const btnMark = document.getElementById('btn-' + PREFIX + '-mark');
    const btnDel = document.getElementById('btn-' + PREFIX + '-delete');
    if (btnMark) btnMark.disabled = !dislikePending.length;
    if (btnDel) btnDel.disabled = !selectedRows.length;
  }

  function updateSelectionUI() {
    if (ROW_ACTIONS_ONLY) return;
    const list = getFiltered();
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
    const chkAll = document.getElementById(PREFIX + '-chk-all');
    if (chkAll) chkAll.checked = allChecked;
    updateBatchButtons();
  }

  function exportCsv() {
    const list = getFiltered();
    const header = '策略ID,规则分类,规则名称,校验字段,评价人,评价结果,处理状态,评价时间,点踩原因';
    const lines = list.map(r => [
      r.strategyId, r.ruleCategory, r.ruleName, r.checkField, r.evaluator,
      r.rating === 'like' ? '点赞' : '点踩',
      r.rating === 'dislike' ? (r.processed ? '已处理' : '待处理') : '—',
      r.ratingTime, r.comment || ''
    ].map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\ufeff' + header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = cfg.exportPrefix + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderList() {
    const tbody = document.getElementById(PREFIX + '-tbody');
    const countEl = document.getElementById(PREFIX + '-count');
    if (!tbody) return;
    const list = getFiltered();
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    if (countEl) countEl.textContent = `共 ${list.length} 条`;

    tbody.innerHTML = rows.map((r, idx) => {
      const seq = (page - 1) * PAGE_SIZE + idx + 1;
      let processLink = '';
      if (r.rating === 'dislike') {
        if (!r.processed) {
          processLink = `<a href="#" class="link-action link-success" data-mark="${esc(r.id)}">标记已处理</a>`;
        } else {
          processLink = `<a href="#" class="link-action link-warn" data-unmark="${esc(r.id)}">取消标记</a>`;
        }
      }
      const checkCell = ROW_ACTIONS_ONLY ? '' : `<td><input type="checkbox" class="${PREFIX}-chk" data-id="${esc(r.id)}" ${selected.has(r.id) ? 'checked' : ''}/></td>`;
      return `<tr>
        ${checkCell}
        <td>${seq}</td>
        <td><span class="agent-id-code">${esc(r.strategyId)}</span></td>
        <td>${esc(r.ruleCategory)}</td>
        <td>${esc(r.ruleName)}</td>
        <td>${esc(r.checkField)}</td>
        <td>${esc(r.evaluator)}</td>
        <td>${ratingHtml(r)}</td>
        <td class="agent-cell-time">${esc(r.ratingTime)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-detail="${esc(r.id)}">详情</a>
          ${processLink}
          <a href="#" class="link-action link-danger" data-del="${esc(r.id)}">删除</a>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="${ROW_ACTIONS_ONLY ? 9 : 10}" class="muted" style="text-align:center;padding:24px">暂无评价记录</td></tr>`;

    if (!ROW_ACTIONS_ONLY) {
      tbody.querySelectorAll('.' + PREFIX + '-chk').forEach(chk => {
        chk.addEventListener('change', () => {
          const id = chk.dataset.id;
          if (chk.checked) selected.add(id); else selected.delete(id);
          updateSelectionUI();
        });
      });
    }
    tbody.querySelectorAll('[data-detail]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); showDetail(a.dataset.detail); });
    });
    tbody.querySelectorAll('[data-mark]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        store()?.markProcessed([a.dataset.mark]);
        renderList();
      });
    });
    tbody.querySelectorAll('[data-unmark]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('确定取消该条点踩评价的已处理标记？')) return;
        store()?.unmarkProcessed([a.dataset.unmark]);
        renderList();
      });
    });
    tbody.querySelectorAll('[data-del]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('确定删除该评价记录？')) return;
        selected.delete(a.dataset.del);
        store()?.deleteByIds([a.dataset.del]);
        renderList();
      });
    });

    if (TablePagination) {
      const result = TablePagination.render(PREFIX + '-pagination', {
        total: list.length, page, pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
    updateSelectionUI();
  }

  function showDetail(id) {
    const r = store()?.getAll().find(x => x.id === id);
    if (!r) return;
    document.getElementById('modal-' + PREFIX + '-detail-body').innerHTML = `
      <div class="agent-form-vertical agent-form-readonly">
        <div class="form-field"><label>策略ID</label><div class="readonly-value"><span class="agent-id-code">${esc(r.strategyId)}</span></div></div>
        <div class="form-field"><label>规则分类</label><div class="readonly-value">${esc(r.ruleCategory)}</div></div>
        <div class="form-field"><label>规则名称</label><div class="readonly-value">${esc(r.ruleName)}</div></div>
        <div class="form-field"><label>校验字段</label><div class="readonly-value">${esc(r.checkField)}</div></div>
        <div class="form-field"><label>评价人</label><div class="readonly-value">${esc(r.evaluator)}</div></div>
        <div class="form-field"><label>评价结果</label><div class="readonly-value">${ratingHtml(r)}</div></div>
        <div class="form-field"><label>评价时间</label><div class="readonly-value">${esc(r.ratingTime)}</div></div>
        ${r.rating === 'dislike' ? `
        <div class="form-field"><label>点踩原因</label><div class="readonly-value">${esc(r.comment || '—')}</div></div>
        <div class="form-field"><label>处理状态</label><div class="readonly-value">${r.processed ? `已处理（${esc(r.processedBy)} · ${esc(r.processedAt)}）` : '待处理'}</div></div>` : ''}
      </div>`;
    if (typeof openModal === 'function') openModal('modal-' + PREFIX + '-detail');
  }

  function renderReport() {
    const start = document.getElementById(PREFIX + '-report-start')?.value || '2025-12-01';
    const end = document.getElementById(PREFIX + '-report-end')?.value || '2025-12-31';
    const stats = store()?.getReportStats(start, end) || {};
    const usage = store()?.getUsageStats(start, end) || {};
    const el = document.getElementById(PREFIX + '-report-body');
    if (!el) return;

    const catRows = Object.entries(stats.byCategory || {}).map(([name, v]) => {
      const total = (v.like || 0) + (v.dislike || 0);
      const likePct = total ? Math.round((v.like / total) * 100) : 0;
      return `<tr><td>${esc(name)}</td><td>${v.like || 0}</td><td>${v.dislike || 0}</td><td>
        <div class="feedback-bar"><span class="like" style="width:${likePct}%"></span></div>
        <span class="muted" style="font-size:11px">点赞 ${likePct}%</span></td></tr>`;
    }).join('') || '<tr><td colspan="4" class="muted">暂无数据</td></tr>';

    el.innerHTML = `
      <p class="muted" style="font-size:12px;margin:0 0 12px">统计周期：${esc(start)} 至 ${esc(end)}</p>
      <h4 style="margin:0 0 10px;font-size:14px">评价情况</h4>
      <div class="agent-analysis-grid" style="margin-bottom:16px">
        <div class="agent-stat-card"><div class="k">评价总数</div><div class="v">${stats.total || 0}</div></div>
        <div class="agent-stat-card"><div class="k">点赞</div><div class="v" style="color:#16a34a">${stats.likes || 0}</div></div>
        <div class="agent-stat-card"><div class="k">点踩</div><div class="v" style="color:#dc2626">${stats.dislikes || 0}</div></div>
        <div class="agent-stat-card"><div class="k">点踩待处理</div><div class="v" style="color:#d97706">${stats.pendingDislikes || 0}</div></div>
      </div>
      <table class="data-table agent-data-table" style="margin-bottom:20px">
        <thead><tr><th>规则分类</th><th>点赞</th><th>点踩</th><th>满意度</th></tr></thead>
        <tbody>${catRows}</tbody>
      </table>
      <h4 style="margin:0 0 10px;font-size:14px">功能使用数据</h4>
      <div class="agent-analysis-grid">
        <div class="agent-stat-card"><div class="k">${cfg.usageTaskLabel}</div><div class="v">${usage.taskCount || 0}</div></div>
        <div class="agent-stat-card"><div class="k">${cfg.usageStrategyLabel}</div><div class="v">${usage.strategyCount || 0}</div></div>
        <div class="agent-stat-card"><div class="k">评价人次</div><div class="v">${usage.feedbackCount || 0}</div></div>
        <div class="agent-stat-card"><div class="k">评价覆盖率</div><div class="v">${usage.coverage || 0}%</div></div>
      </div>`;
  }

  function resetFilters() {
    const start = document.getElementById(PREFIX + '-start');
    const end = document.getElementById(PREFIX + '-end');
    const rating = document.getElementById(PREFIX + '-rating');
    const kw = document.getElementById(PREFIX + '-kw');
    if (start) start.value = cfg.defaultStart || '2025-12-01';
    if (end) end.value = cfg.defaultEnd || '2025-12-31';
    if (rating) rating.value = '';
    if (kw) kw.value = '';
    page = 1;
    selected.clear();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-' + PREFIX + '-search')?.addEventListener('click', () => { page = 1; selected.clear(); renderList(); });
    document.getElementById('btn-' + PREFIX + '-reset')?.addEventListener('click', resetFilters);
    document.getElementById('btn-' + PREFIX + '-export')?.addEventListener('click', exportCsv);
    document.getElementById('btn-' + PREFIX + '-report')?.addEventListener('click', () => {
      renderReport();
      if (typeof openModal === 'function') openModal('modal-' + PREFIX + '-report');
    });
    document.getElementById('btn-' + PREFIX + '-report-run')?.addEventListener('click', renderReport);
    if (!ROW_ACTIONS_ONLY) {
      document.getElementById('btn-' + PREFIX + '-mark')?.addEventListener('click', () => {
        const ids = Array.from(selected);
        const pending = (store()?.getAll() || []).filter(r => ids.includes(r.id) && r.rating === 'dislike' && !r.processed);
        if (!pending.length) return;
        if (!confirm(`确定将 ${pending.length} 条点踩评价标记为已处理？`)) return;
        store()?.markProcessed(pending.map(r => r.id));
        selected.clear();
        renderList();
      });
      document.getElementById('btn-' + PREFIX + '-delete')?.addEventListener('click', () => {
        const ids = Array.from(selected);
        if (!ids.length) return;
        if (!confirm(`确定删除选中的 ${ids.length} 条评价记录？`)) return;
        store()?.deleteByIds(ids);
        selected.clear();
        renderList();
      });
      document.getElementById(PREFIX + '-chk-all')?.addEventListener('change', e => {
        const list = getFiltered();
        const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
        rows.forEach(r => { if (e.target.checked) selected.add(r.id); else selected.delete(r.id); });
        renderList();
      });
    }
    renderList();
  });
})();
