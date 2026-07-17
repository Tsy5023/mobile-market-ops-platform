/** 知识查询助手 · 右下角对话浮窗（智能体管理页） */
(function () {
  const AGENT_PAGES = ['agent-chat-history.html', 'agent-qa-knowledge.html', 'agent-qa-feedback.html'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  const state = {
    open: false,
    historyOpen: false,
    conversationId: null,
    messages: [],
    isThinking: false,
    thinkingTimer: null,
    thinkingAborted: false,
    viewingHistory: false
  };

  let els = {};

  function shouldMount() {
    return typeof CURRENT_PAGE !== 'undefined' && AGENT_PAGES.includes(CURRENT_PAGE);
  }

  function injectHtml() {
    if (document.getElementById('agent-chat-widget-root')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="agent-chat-widget-root">
  <button type="button" class="agent-chat-fab" id="agent-chat-fab" aria-label="打开知识查询助手">
    <span class="agent-chat-fab-avatar"><i class="fas fa-robot"></i></span>
    <span class="agent-chat-fab-label">AI助手</span>
  </button>
  <div class="agent-chat-panel" id="agent-chat-panel" role="dialog" aria-label="知识查询助手">
    <div class="agent-chat-header">
      <span class="agent-chat-header-title">知识查询助手</span>
      <div class="agent-chat-header-actions">
        <button type="button" class="agent-chat-icon-btn" id="agent-chat-new" aria-label="开启新问答">
          <i class="fas fa-plus"></i>
          <span class="agent-chat-tooltip" role="tooltip">开启新问答将清空当前页面数据</span>
        </button>
        <button type="button" class="agent-chat-icon-btn" id="agent-chat-history-btn" title="历史对话">
          <i class="fas fa-clock-rotate-left"></i>
        </button>
        <button type="button" class="agent-chat-icon-btn" id="agent-chat-close" title="关闭">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    <div class="agent-chat-history-pop" id="agent-chat-history-pop">
      <div class="agent-chat-history-head">
        <span class="agent-chat-history-head-title"><i class="fas fa-clock-rotate-left"></i> 历史对话</span>
        <span class="agent-chat-history-count" id="agent-chat-history-count">0 条</span>
      </div>
      <div class="agent-chat-history-search">
        <input type="text" id="agent-chat-history-kw" placeholder="检索对话标题…"/>
      </div>
      <div class="agent-chat-history-list" id="agent-chat-history-list"></div>
    </div>
    <div class="agent-chat-body" id="agent-chat-body"></div>
    <div class="agent-chat-footer">
      <div class="agent-chat-input-wrap">
        <textarea class="agent-chat-input" id="agent-chat-input" rows="2"
          placeholder="请将您遇到的问题告诉我，使用 Shift + Enter 可换行"></textarea>
        <button type="button" class="agent-chat-send" id="agent-chat-send" aria-label="发送">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
      <p class="agent-chat-disclaimer">内容由 AI 生成，仅供参考</p>
    </div>
  </div>
</div>`);
  }

  function cacheEls() {
    els = {
      fab: document.getElementById('agent-chat-fab'),
      panel: document.getElementById('agent-chat-panel'),
      body: document.getElementById('agent-chat-body'),
      input: document.getElementById('agent-chat-input'),
      send: document.getElementById('agent-chat-send'),
      historyPop: document.getElementById('agent-chat-history-pop'),
      historyList: document.getElementById('agent-chat-history-list'),
      historyKw: document.getElementById('agent-chat-history-kw'),
      historyCount: document.getElementById('agent-chat-history-count')
    };
  }

  function togglePanel(open) {
    state.open = open != null ? open : !state.open;
    els.panel.classList.toggle('is-open', state.open);
    els.fab.classList.toggle('is-open', state.open);
    if (state.open) {
      renderMessages();
      els.input.focus();
    } else {
      closeHistoryPop();
    }
  }

  function closeHistoryPop() {
    state.historyOpen = false;
    els.historyPop.classList.remove('is-open');
  }

  function toggleHistoryPop() {
    state.historyOpen = !state.historyOpen;
    els.historyPop.classList.toggle('is-open', state.historyOpen);
    if (state.historyOpen) renderHistoryList();
  }

  function isInitialState() {
    return !state.messages.length && !state.viewingHistory;
  }

  function renderQuickQuestions() {
    const questions = AgentAssistantData.getQuickQuestions(6);
    if (!questions.length) return '';
    return `
      <div class="agent-chat-quick-list">
        ${questions.map(q => `
          <button type="button" class="agent-chat-quick-item" data-quick="${esc(q)}">${esc(q)}</button>
        `).join('')}
      </div>`;
  }

  function renderWelcome() {
    return `
      <div class="agent-chat-msg-row assistant">
        <div class="agent-chat-bot-avatar"><i class="fas fa-robot"></i></div>
        <div class="agent-chat-msg-col agent-chat-welcome">
          <div class="agent-chat-bubble assistant">${esc(AgentAssistantData.greeting)}</div>
          ${renderQuickQuestions()}
        </div>
      </div>`;
  }

  function renderSources(sources) {
    if (!sources || !sources.length) return '';
    const links = sources.map(doc => {
      const url = AgentAssistantData.docPreviewUrl(doc.id);
      return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">
        <i class="fas fa-file-lines"></i>${esc(doc.title)}</a>`;
    }).join('');
    return `
      <div class="agent-chat-sources">
        <div class="agent-chat-sources-label">参考文档</div>
        ${links}
      </div>`;
  }

  function renderMessageHtml(m) {
    if (m.role === 'user') {
      return `
        <div class="agent-chat-msg-row user">
          <div class="agent-chat-msg-col">
            <div class="agent-chat-bubble user">${esc(m.text)}</div>
          </div>
        </div>`;
    }
    if (m.role === 'thinking') {
      return `
        <div class="agent-chat-msg-row assistant" id="agent-chat-thinking-row">
          <div class="agent-chat-bot-avatar"><i class="fas fa-robot"></i></div>
          <div class="agent-chat-msg-col">
            <div class="agent-chat-think-status is-thinking">
              思考中<span class="agent-chat-think-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
            <div class="agent-chat-bubble assistant" style="color:#64748b;font-size:12px">正在检索知识库并生成回答…</div>
            <button type="button" class="agent-chat-stop-btn" id="agent-chat-stop">终止回答</button>
          </div>
        </div>`;
    }
    const thinkLabel = m.thinkDone ? '思考完成' : '';
    return `
      <div class="agent-chat-msg-row assistant">
        <div class="agent-chat-bot-avatar"><i class="fas fa-robot"></i></div>
        <div class="agent-chat-msg-col">
          ${thinkLabel ? `<div class="agent-chat-think-status">${thinkLabel}</div>` : ''}
          <div class="agent-chat-bubble assistant">
            ${esc(m.text)}
            ${renderSources(m.sources)}
          </div>
        </div>
      </div>`;
  }

  function renderMessages() {
    let html = '';
    if (isInitialState()) {
      html = renderWelcome();
    } else {
      html = state.messages.map(renderMessageHtml).join('');
    }
    els.body.innerHTML = html;
    els.body.scrollTop = els.body.scrollHeight;

    els.body.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isThinking) return;
        askQuestion(btn.dataset.quick);
      });
    });

    const stopBtn = document.getElementById('agent-chat-stop');
    if (stopBtn) stopBtn.addEventListener('click', stopThinking);
  }

  function persistConversation() {
    if (!state.messages.length) return;
    if (!state.conversationId) state.conversationId = 'CONV-' + Date.now();
    const userMsgs = state.messages.filter(m => m.role === 'user');
    const title = (userMsgs[0]?.text || '新对话').slice(0, 80);
    const payload = {
      id: state.conversationId,
      title,
      updatedAt: formatTime(new Date()),
      messages: state.messages
        .filter(m => m.role !== 'thinking')
        .map(m => ({
          role: m.role,
          text: m.text,
          time: m.time,
          sources: m.sources || [],
          hasAnswer: m.hasAnswer
        }))
    };
    AgentChatHistoryStore.upsert(payload);
  }

  function askQuestion(text) {
    const q = String(text || '').trim();
    if (!q || state.isThinking) return;

    state.viewingHistory = false;
    state.messages.push({ role: 'user', text: q, time: formatTime(new Date()) });
    state.isThinking = true;
    state.thinkingAborted = false;
    state.messages.push({ role: 'thinking' });
    renderMessages();
    els.send.disabled = true;

    const delay = 1400 + Math.random() * 1200;
    state.thinkingTimer = setTimeout(() => {
      state.messages = state.messages.filter(m => m.role !== 'thinking');
      if (state.thinkingAborted) {
        state.thinkingAborted = false;
        state.isThinking = false;
        els.send.disabled = false;
        renderMessages();
        return;
      }
      const reply = AgentAssistantData.chatReply(q);
      state.messages.push({
        role: 'assistant',
        text: reply.answer,
        time: formatTime(new Date()),
        sources: reply.sources || [],
        hasAnswer: reply.hasAnswer,
        thinkDone: true
      });
      state.isThinking = false;
      els.send.disabled = false;
      persistConversation();
      renderMessages();
    }, delay);
  }

  function stopThinking() {
    if (!state.isThinking) return;
    state.thinkingAborted = true;
    clearTimeout(state.thinkingTimer);
    state.messages = state.messages.filter(m => m.role !== 'thinking');
    state.isThinking = false;
    els.send.disabled = false;
    renderMessages();
  }

  function startNewChat() {
    if (state.isThinking) stopThinking();
    state.conversationId = null;
    state.messages = [];
    state.viewingHistory = false;
    els.input.value = '';
    closeHistoryPop();
    renderMessages();
  }

  function loadConversation(conv) {
    if (!conv) return;
    if (state.isThinking) stopThinking();
    state.conversationId = conv.id;
    state.messages = (conv.messages || []).map(m => ({
      ...m,
      thinkDone: m.role === 'assistant'
    }));
    state.viewingHistory = true;
    closeHistoryPop();
    renderMessages();
  }

  function renderHistoryList() {
    const kw = (els.historyKw.value || '').trim().toLowerCase();
    const all = AgentChatHistoryStore.getAll();
    let list = all;
    if (kw) list = list.filter(r => (r.title || '').toLowerCase().includes(kw));

    if (els.historyCount) {
      els.historyCount.textContent = (kw ? list.length + ' / ' : '') + all.length + ' 条';
    }

    if (!list.length) {
      els.historyList.innerHTML = kw
        ? '<div class="agent-chat-history-empty"><i class="fas fa-search"></i>未找到匹配的对话</div>'
        : '<div class="agent-chat-history-empty"><i class="fas fa-comments"></i>暂无历史对话<br/>开始提问后会自动保存记录</div>';
      return;
    }

    els.historyList.innerHTML = list.map(r => {
      const active = state.conversationId === r.id;
      return `
      <div class="agent-chat-history-item${active ? ' is-active' : ''}" data-hid="${esc(r.id)}">
        <div class="agent-chat-history-item-main" data-view-id="${esc(r.id)}">
          <div class="agent-chat-history-title-row">
            <i class="fas fa-message"></i>
            <span class="agent-chat-history-title" data-title-id="${esc(r.id)}">${esc(r.title || '未命名对话')}</span>
            <button type="button" class="agent-chat-history-edit" data-edit-id="${esc(r.id)}" title="编辑标题" aria-label="编辑标题">
              <i class="fas fa-pen"></i>
            </button>
          </div>
          <div class="agent-chat-history-time"><i class="far fa-clock"></i>${esc(r.updatedAt)}</div>
        </div>
        <button type="button" class="agent-chat-history-del" data-del-id="${esc(r.id)}" title="删除" aria-label="删除">
          <i class="fas fa-trash-can"></i>
        </button>
      </div>`;
    }).join('');

    els.historyList.querySelectorAll('[data-view-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.agent-chat-history-edit') || e.target.closest('.agent-chat-history-title-input')) return;
        const conv = AgentChatHistoryStore.getById(el.dataset.viewId);
        loadConversation(conv);
      });
    });

    els.historyList.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('确定删除该历史对话？')) return;
        const id = btn.dataset.delId;
        AgentChatHistoryStore.remove(id);
        if (state.conversationId === id) startNewChat();
        renderHistoryList();
      });
    });

    els.historyList.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const item = btn.closest('.agent-chat-history-item');
        const titleEl = item?.querySelector('[data-title-id]');
        if (titleEl) startTitleEdit(titleEl, item);
      });
    });

    els.historyList.querySelectorAll('[data-title-id]').forEach(el => {
      el.addEventListener('dblclick', e => {
        e.stopPropagation();
        const item = el.closest('.agent-chat-history-item');
        startTitleEdit(el, item);
      });
    });
  }

  function startTitleEdit(el, item) {
    const id = el.dataset.titleId;
    const row = AgentChatHistoryStore.getById(id);
    if (!row || el.tagName === 'INPUT') return;
    if (item) item.classList.add('is-editing');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'agent-chat-history-title-input';
    input.value = row.title || '';
    input.dataset.titleId = id;
    const rowWrap = el.closest('.agent-chat-history-title-row');
    rowWrap.replaceChild(input, el);
    input.focus();
    input.select();

    function commit() {
      const title = input.value.trim() || '未命名对话';
      AgentChatHistoryStore.updateTitle(id, title);
      renderHistoryList();
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); renderHistoryList(); }
    });
    input.addEventListener('click', e => e.stopPropagation());
  }

  function sendFromInput() {
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = '';
    askQuestion(text);
  }

  function bindEvents() {
    els.fab.addEventListener('click', () => togglePanel());
    document.getElementById('agent-chat-close').addEventListener('click', () => togglePanel(false));
    document.getElementById('agent-chat-new').addEventListener('click', startNewChat);
    document.getElementById('agent-chat-history-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleHistoryPop();
    });
    els.send.addEventListener('click', sendFromInput);
    els.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFromInput();
      }
    });
    els.historyKw.addEventListener('input', renderHistoryList);

    document.addEventListener('click', e => {
      if (!state.historyOpen) return;
      if (els.historyPop.contains(e.target) || e.target.closest('#agent-chat-history-btn')) return;
      closeHistoryPop();
    });
  }

  function mount() {
    if (!shouldMount() || !window.AgentAssistantData) return;
    injectHtml();
    cacheEls();
    bindEvents();
  }

  window.AgentChatWidget = { mount };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
