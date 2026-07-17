/** 策略评估：活动执行列表 */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let page = 1;

  const ACTIVITY_ROWS = [
    { id: 'ACT-JX-2026-001', name: '中高端离网挽留专项', city: '南昌市', county: '东湖区', channel: '10085外呼营销', totalUsers: 4280, contactUsers: 3102, successUsers: 796, execTime: '2026-05-02 09:00 ~ 2026-06-30' },
    { id: 'ACT-JX-2026-002', name: '中高端离网挽留专项', city: '赣州市', county: '章贡区', channel: '10085外呼营销', totalUsers: 3560, contactUsers: 2588, successUsers: 612, execTime: '2026-05-02 09:00 ~ 2026-06-30' },
    { id: 'ACT-JX-2026-003', name: '账单异议关怀回访', city: '南昌市', county: '西湖区', channel: '营业厅网台', totalUsers: 1120, contactUsers: 986, successUsers: 214, execTime: '2026-04-22 14:30 ~ 2026-05-31' },
    { id: 'ACT-JX-2026-004', name: '账单异议关怀回访', city: '景德镇市', county: '珠山区', channel: '营业厅网台', totalUsers: 730, contactUsers: 642, successUsers: 138, execTime: '2026-04-22 14:30 ~ 2026-05-31' },
    { id: 'ACT-JX-2026-005', name: '低接触客群唤醒', city: '上饶市', county: '信州区', channel: '10086呼入弹屏', totalUsers: 1860, contactUsers: 1512, successUsers: 142, execTime: '2026-03-05 10:00 ~ 2026-04-30' },
    { id: 'ACT-JX-2026-006', name: '低接触客群唤醒', city: '宜春市', county: '袁州区', channel: '中国移动APP', totalUsers: 1760, contactUsers: 1428, successUsers: 134, execTime: '2026-03-05 10:00 ~ 2026-04-30' },
    { id: 'ACT-JX-2026-007', name: '5G 升档专项触达', city: '九江市', county: '浔阳区', channel: '中国移动APP', totalUsers: 2980, contactUsers: 2316, successUsers: 418, execTime: '2026-05-10 08:00 ~ 2026-06-30' },
    { id: 'ACT-JX-2026-008', name: '5G 升档专项触达', city: '抚州市', county: '临川区', channel: '中国移动APP', totalUsers: 2140, contactUsers: 1688, successUsers: 302, execTime: '2026-05-10 08:00 ~ 2026-06-30' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatCount(n) {
    return Number(n).toLocaleString('zh-CN');
  }

  function getFilteredRows() {
    const nameKw = (document.getElementById('eval-filter-name')?.value || '').trim().toLowerCase();
    const channel = document.getElementById('eval-filter-channel')?.value || '';

    let rows = ACTIVITY_ROWS.slice();
    if (nameKw) rows = rows.filter(r => r.name.toLowerCase().includes(nameKw));
    if (channel) rows = rows.filter(r => r.channel === channel);
    return rows;
  }

  function renderPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('eval-list-pagination', {
      total,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderEvalList();
      }
    });
    page = result.page;
  }

  function renderEvalList() {
    const tbody = document.getElementById('eval-list-tbody');
    const countEl = document.getElementById('eval-list-count');
    if (!tbody) return;

    const rows = getFilteredRows();
    const pageRows = TablePagination
      ? TablePagination.slice(rows, page, PAGE_SIZE)
      : rows;

    if (countEl) countEl.textContent = `共 ${rows.length} 条`;

    tbody.innerHTML = pageRows.length ? pageRows.map(r => `
      <tr>
        <td><code class="id-chip">${esc(r.id)}</code></td>
        <td><strong>${esc(r.name)}</strong></td>
        <td>${esc(r.city)}</td>
        <td>${esc(r.county)}</td>
        <td>${esc(r.channel)}</td>
        <td>${formatCount(r.totalUsers)}</td>
        <td>${formatCount(r.contactUsers)}</td>
        <td>${formatCount(r.successUsers)}</td>
        <td style="white-space:nowrap;font-size:12px">${esc(r.execTime)}</td>
      </tr>`).join('')
      : '<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">暂无匹配的活动执行记录</td></tr>';

    renderPagination(rows.length);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('eval-view-list')) return;
    renderEvalList();
    document.getElementById('btn-eval-filter')?.addEventListener('click', () => {
      page = 1;
      renderEvalList();
    });
    document.getElementById('eval-filter-name')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        page = 1;
        renderEvalList();
      }
    });
    document.getElementById('eval-filter-channel')?.addEventListener('change', () => {
      page = 1;
      renderEvalList();
    });
  });
})();
