/** 预警记录管理：基于预警规则每日触发结果 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let pageNum = 1;
  const pageSize = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;

  function filterList() {
    const kw = (document.getElementById('alert-record-filter-rule')?.value || '').trim().toLowerCase();
    const dateFrom = document.getElementById('alert-record-date-from')?.value || '';
    const dateTo = document.getElementById('alert-record-date-to')?.value || '';

    let list = AlertRecordStore.getAll();
    if (kw) {
      list = list.filter(r =>
        (r.ruleName + (r.ruleDescription || '')).toLowerCase().includes(kw)
      );
    }
    if (dateFrom) list = list.filter(r => r.triggerDate >= dateFrom);
    if (dateTo) list = list.filter(r => r.triggerDate <= dateTo);
    list.sort((a, b) => {
      const dateCmp = String(b.triggerDate).localeCompare(String(a.triggerDate));
      if (dateCmp !== 0) return dateCmp;
      return String(b.triggerTime || '').localeCompare(String(a.triggerTime || ''));
    });
    return list;
  }

  function renderMetricCount(total) {
    return `<span class="alert-record-metric-count">${esc(total)} 条</span>`;
  }

  function renderAbnormalCount(abnormal) {
    if (!abnormal) {
      return '<span class="alert-record-metric-count alert-record-count-normal">0 条</span>';
    }
    return `<span class="alert-record-metric-count alert-record-count-abnormal">${esc(abnormal)} 条</span>`;
  }

  function renderPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('alert-record-pagination', {
      total,
      page: pageNum,
      pageSize,
      onPageChange: nextPage => {
        pageNum = nextPage;
        renderTable();
      }
    });
    pageNum = result.page;
  }

  function detailHref(recordId) {
    return `alert-record-detail.html?id=${encodeURIComponent(recordId)}`;
  }

  function renderTable() {
    const tbody = document.getElementById('alert-record-tbody');
    const countEl = document.getElementById('alert-record-count');
    if (!tbody) return;

    const all = filterList();
    const total = all.length;
    if (countEl) countEl.textContent = `共 ${total} 条`;

    const pageRows = window.TablePagination
      ? TablePagination.slice(all, pageNum, pageSize)
      : all;

    tbody.innerHTML = pageRows.map(r => `<tr>
        <td><strong>${esc(r.ruleName)}</strong></td>
        <td>${esc(r.triggerDate)}</td>
        <td>${renderMetricCount(r.totalMetrics)}</td>
        <td>${renderAbnormalCount(r.abnormalMetrics)}</td>
        <td>${esc(r.triggerTime || '—')}</td>
        <td><a class="btn-link" href="${detailHref(r.id)}">详情</a></td>
      </tr>`).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">暂无预警记录</td></tr>';

    renderPagination(total);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('alert-record-tbody')) return;

    document.getElementById('btn-alert-record-search')?.addEventListener('click', () => {
      pageNum = 1;
      renderTable();
    });
    document.getElementById('btn-alert-record-reset')?.addEventListener('click', () => {
      const ruleInput = document.getElementById('alert-record-filter-rule');
      const fromInput = document.getElementById('alert-record-date-from');
      const toInput = document.getElementById('alert-record-date-to');
      if (ruleInput) ruleInput.value = '';
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      pageNum = 1;
      renderTable();
    });

    renderTable();
  });
})();
