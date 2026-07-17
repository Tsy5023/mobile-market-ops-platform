/** 问答评价管理 */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let page = 1;

  function store() { return window.AgentQaFeedbackStore; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getFilters() {
    return {
      kw: (document.getElementById('fb-filter-kw')?.value || '').trim(),
      rating: document.getElementById('fb-filter-rating')?.value || '',
      start: document.getElementById('fb-filter-start')?.value || '',
      end: document.getElementById('fb-filter-end')?.value || ''
    };
  }

  function getFiltered() {
    return store()?.filter(getFilters()) || [];
  }

  function ratingHtml(r) {
    if (r.rating === 'like') {
      return '<span class="rating-like"><i class="fas fa-thumbs-up"></i> 点赞</span>';
    }
    const processed = r.processed ? '<span class="badge badge-success" style="margin-left:6px;font-size:11px">已处理</span>' : '';
    return '<span class="rating-dislike"><i class="fas fa-thumbs-down"></i> 点踩</span>' + processed;
  }

  function renderList() {
    const tbody = document.getElementById('fb-tbody');
    const countEl = document.getElementById('fb-count');
    if (!tbody) return;
    const list = getFiltered();
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    if (countEl) countEl.textContent = `共 ${list.length} 条`;

    tbody.innerHTML = rows.map(r => {
      let processLink = '';
      if (r.rating === 'dislike') {
        if (!r.processed) {
          processLink = `<a href="#" class="link-action link-success" data-mark="${esc(r.id)}">标记已处理</a>`;
        } else {
          processLink = `<a href="#" class="link-action link-warn" data-unmark="${esc(r.id)}">取消标记</a>`;
        }
      }
      return `
      <tr>
        <td><span class="agent-id-code">${esc(r.userId)}</span></td>
        <td>${esc(r.userName)}</td>
        <td class="agent-cell-ellipsis" title="${esc(r.question)}">${esc(r.question)}</td>
        <td class="agent-cell-ellipsis agent-cell-ellipsis-wide" title="${esc(r.answer)}">${esc(r.answer)}</td>
        <td>${ratingHtml(r)}</td>
        <td class="agent-cell-time">${esc(r.ratingTime)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-detail="${esc(r.id)}">查看详情</a>
          ${processLink}
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无评价记录</td></tr>';

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

    if (window.TablePagination) {
      const result = TablePagination.render('fb-pagination', {
        total: list.length,
        page,
        pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
  }

  function showDetail(id) {
    const r = store()?.getAll().find(x => x.id === id);
    if (!r) return;
    document.getElementById('fb-detail-body').innerHTML = `
      <div class="agent-form-vertical agent-form-readonly">
        <div class="form-field">
          <label>用户ID</label>
          <div class="readonly-value"><span class="agent-id-code">${esc(r.userId)}</span></div>
        </div>
        <div class="form-field">
          <label>用户姓名</label>
          <div class="readonly-value">${esc(r.userName)}</div>
        </div>
        <div class="form-field">
          <label>会话ID</label>
          <div class="readonly-value"><span class="agent-id-code">${esc(r.sessionId)}</span></div>
        </div>
        <div class="form-field">
          <label>评价时间</label>
          <div class="readonly-value">${esc(r.ratingTime)}</div>
        </div>
        <div class="form-field">
          <label>评价结果</label>
          <div class="readonly-value">${ratingHtml(r)}</div>
        </div>
        ${r.rating === 'dislike' ? `
        <div class="form-field">
          <label>点踩原因</label>
          <div class="readonly-value">${esc(r.comment || '—')}</div>
        </div>
        <div class="form-field">
          <label>处理状态</label>
          <div class="readonly-value">${r.processed ? `已处理（${esc(r.processedBy)} · ${esc(r.processedAt)}）` : '待处理'}</div>
        </div>` : ''}
        <div class="form-field">
          <label>用户问题</label>
          <div class="readonly-value">${esc(r.question)}</div>
        </div>
        <div class="form-field">
          <label>回答答案</label>
          <div class="readonly-value pre-wrap">${esc(r.answer)}</div>
        </div>
      </div>`;
    if (typeof openModal === 'function') openModal('modal-fb-detail');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-fb-search')?.addEventListener('click', () => { page = 1; renderList(); });
    renderList();
  });
})();
