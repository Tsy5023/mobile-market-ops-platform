/** 历史会话管理 */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let page = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getFiltered() {
    const kw = (document.getElementById('chat-filter-kw')?.value || '').trim().toLowerCase();
    const start = document.getElementById('chat-filter-start')?.value || '';
    const end = document.getElementById('chat-filter-end')?.value || '';
    return AgentAssistantData.sessions.filter(s => {
      const d = s.chatTime.slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (kw) {
        const blob = (s.sessionId + s.userId + s.userName + s.lastQuestion).toLowerCase();
        if (!blob.includes(kw)) return false;
      }
      return true;
    });
  }

  function renderList() {
    const tbody = document.getElementById('chat-tbody');
    const countEl = document.getElementById('chat-count');
    if (!tbody) return;
    const list = getFiltered();
    const rows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    if (countEl) countEl.textContent = `共 ${list.length} 条`;

    tbody.innerHTML = rows.map(s => `
      <tr>
        <td><span class="agent-id-code">${esc(s.sessionId)}</span></td>
        <td><span class="agent-id-code">${esc(s.userId)}</span></td>
        <td>${esc(s.userName)}</td>
        <td class="agent-cell-time">${esc(s.chatTime)}</td>
        <td class="agent-cell-ellipsis" title="${esc(s.lastQuestion)}">${esc(s.lastQuestion)}</td>
        <td class="cell-actions">
          <a href="#" class="link-action" data-detail="${esc(s.sessionId)}">查看详情</a>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">暂无会话记录</td></tr>';

    tbody.querySelectorAll('[data-detail]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); showDetail(a.dataset.detail); });
    });

    if (window.TablePagination) {
      const result = TablePagination.render('chat-pagination', {
        total: list.length,
        page,
        pageSize: PAGE_SIZE,
        onPageChange: p => { page = p; renderList(); }
      });
      page = result.page;
    }
  }

  function showDetail(sessionId) {
    const s = AgentAssistantData.sessions.find(x => x.sessionId === sessionId);
    if (!s) return;
    document.getElementById('chat-detail-title').textContent = '对话详情';
    document.getElementById('chat-detail-meta').innerHTML = `
      <div class="agent-form-vertical agent-form-readonly">
        <div class="form-field">
          <label>会话ID</label>
          <div class="readonly-value"><span class="agent-id-code">${esc(s.sessionId)}</span></div>
        </div>
        <div class="form-field">
          <label>用户ID</label>
          <div class="readonly-value"><span class="agent-id-code">${esc(s.userId)}</span></div>
        </div>
        <div class="form-field">
          <label>用户姓名</label>
          <div class="readonly-value">${esc(s.userName)}</div>
        </div>
        <div class="form-field">
          <label>对话时间</label>
          <div class="readonly-value">${esc(s.chatTime)}</div>
        </div>
        <div class="form-field">
          <label>最近问题</label>
          <div class="readonly-value">${esc(s.lastQuestion)}</div>
        </div>
      </div>`;
    const wrap = document.getElementById('chat-detail-messages');
    wrap.innerHTML = s.messages.map(m => `
      <div class="chat-bubble ${m.role}">
        <div>${esc(m.text)}</div>
        <div class="chat-bubble-meta">${m.role === 'user' ? '用户' : '知识助手'} · ${esc(m.time)}</div>
      </div>
    `).join('');
    if (typeof openModal === 'function') openModal('modal-chat-detail');
  }

  function exportCsv(filename, header, rows) {
    const lines = rows.map(cols =>
      cols.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob(['\ufeff' + header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportSessionQa() {
    const start = document.getElementById('chat-filter-start')?.value || '2026-05-01';
    const end = document.getElementById('chat-filter-end')?.value || '2026-05-31';
    const rows = AgentAssistantData.exportSessionQaPairs(start, end);
    if (!rows.length) {
      alert('所选时间范围内暂无会话问答数据');
      return;
    }
    exportCsv(
      `会话问题导出_${start}_${end}.csv`,
      '会话ID,用户ID,用户姓名,提问,答案',
      rows.map(r => [r.sessionId, r.userId, r.userName, r.question, r.answer])
    );
  }

  function renderAnalysis() {
    const start = document.getElementById('analysis-start')?.value || '2026-05-01';
    const end = document.getElementById('analysis-end')?.value || '2026-05-31';
    const data = AgentAssistantData.analyzeUsage(start, end);
    const el = document.getElementById('analysis-result');
    if (!el) return;

    el.innerHTML = `
      <p class="muted" style="font-size:12px;margin:0 0 12px">分析区间：${esc(start)} 至 ${esc(end)}</p>
      <div class="agent-analysis-grid">
        <div class="agent-stat-card"><div class="k">会话总数</div><div class="v">${data.totalSessions}</div></div>
        <div class="agent-stat-card"><div class="k">提问次数</div><div class="v">${data.totalQuestions || 0}</div></div>
        <div class="agent-stat-card"><div class="k">活跃用户数</div><div class="v">${data.totalUsers}</div></div>
      </div>

      <section class="agent-analysis-section">
        <h4><i class="fas fa-users"></i> 用户使用数据</h4>
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>用户ID</th><th>用户姓名</th><th>会话次数</th><th>提问次数</th></tr></thead>
            <tbody>
              ${data.userStats.map(u => `
                <tr>
                  <td>${esc(u.userId)}</td>
                  <td>${esc(u.userName)}</td>
                  <td>${u.sessions}</td>
                  <td>${u.questions}</td>
                </tr>`).join('') || '<tr><td colspan="4" class="muted" style="text-align:center">暂无数据</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function bindEvents() {
    document.getElementById('btn-chat-search')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('btn-chat-reset')?.addEventListener('click', () => {
      document.getElementById('chat-filter-kw').value = '';
      document.getElementById('chat-filter-start').value = '2026-05-01';
      document.getElementById('chat-filter-end').value = '2026-05-31';
      page = 1;
      renderList();
    });
    document.getElementById('btn-export-session-qa')?.addEventListener('click', exportSessionQa);
    document.getElementById('btn-qa-analysis')?.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal('modal-qa-analysis');
      renderAnalysis();
    });
    document.getElementById('btn-run-analysis')?.addEventListener('click', renderAnalysis);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderList();
  });
})();
