/** 列表底部分页组件（统一样式，与指标树配置列表一致） */
(function () {
  const DEFAULT_PAGE_SIZE = 10;

  function clampPage(page, totalPages) {
    const tp = Math.max(1, totalPages);
    return Math.min(Math.max(1, page), tp);
  }

  function buildPageButtons(currentPage, totalPages, maxVisible) {
    const max = maxVisible || 6;
    if (totalPages <= max) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = start + max - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - max + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  /**
   * @param {string|HTMLElement} container
   * @param {{ total: number, page: number, pageSize?: number, onPageChange: (page:number)=>void, showPageSize?: boolean, showGoto?: boolean, maxVisible?: number, unit?: string }} options
   * @returns {{ page: number, totalPages: number }}
   */
  function render(container, options) {
    const wrap = typeof container === 'string' ? document.getElementById(container) : container;
    if (!wrap) return { page: 1, totalPages: 1 };

    const total = Math.max(0, options.total || 0);
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = clampPage(options.page || 1, totalPages);
    const showPageSize = options.showPageSize !== false;
    const showGoto = options.showGoto !== false;
    const unit = options.unit || '项数据';
    const maxVisible = options.maxVisible || 6;
    const visible = buildPageButtons(page, totalPages, maxVisible);

    let buttonsHtml = visible.map(n =>
      `<button type="button" class="page-btn${n === page ? ' active' : ''}" data-p="${n}" aria-label="第 ${n} 页"${n === page ? ' aria-current="page"' : ''}>${n}</button>`
    ).join('');

    if (totalPages > maxVisible && visible[visible.length - 1] < totalPages) {
      if (visible[visible.length - 1] < totalPages - 1) {
        buttonsHtml += '<span class="page-ellipsis" aria-hidden="true">…</span>';
      }
      if (!visible.includes(totalPages)) {
        buttonsHtml += `<button type="button" class="page-btn" data-p="${totalPages}" aria-label="第 ${totalPages} 页">${totalPages}</button>`;
      }
    }

    wrap.classList.add('table-pagination');
    wrap.innerHTML = `
      <span class="page-total">共 <strong>${total}</strong> ${unit}</span>
      <div class="page-controls">
        ${showPageSize ? `<select class="page-size-select" disabled aria-label="每页条数"><option>${pageSize} 条/页</option></select>` : ''}
        <button type="button" class="page-btn page-btn-nav" data-p="prev" aria-label="上一页"${page <= 1 ? ' disabled' : ''}>&lt;</button>
        ${buttonsHtml}
        <button type="button" class="page-btn page-btn-nav" data-p="next" aria-label="下一页"${page >= totalPages ? ' disabled' : ''}>&gt;</button>
        ${showGoto ? `<span class="page-goto">前往 <input type="number" class="page-goto-input" min="1" max="${totalPages}" value="${page}" aria-label="跳转页码"/> 页</span>` : ''}
      </div>`;

    wrap.querySelectorAll('.page-btn[data-p]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const p = btn.dataset.p;
        let next = page;
        if (p === 'prev') next = Math.max(1, page - 1);
        else if (p === 'next') next = Math.min(totalPages, page + 1);
        else next = parseInt(p, 10);
        if (typeof options.onPageChange === 'function') options.onPageChange(next);
      });
    });

    const gotoInput = wrap.querySelector('.page-goto-input');
    if (gotoInput) {
      const go = () => {
        const next = clampPage(parseInt(gotoInput.value, 10) || 1, totalPages);
        if (next !== page && typeof options.onPageChange === 'function') {
          options.onPageChange(next);
        }
      };
      gotoInput.addEventListener('change', go);
      gotoInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      });
    }

    return { page, totalPages };
  }

  function slice(list, page, pageSize) {
    const ps = pageSize || DEFAULT_PAGE_SIZE;
    const start = (Math.max(1, page) - 1) * ps;
    return list.slice(start, start + ps);
  }

  window.TablePagination = {
    DEFAULT_PAGE_SIZE,
    render,
    slice,
    clampPage
  };
})();
