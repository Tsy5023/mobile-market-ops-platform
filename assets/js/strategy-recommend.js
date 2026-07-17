/** 策略分类 · 客群类策略列表 */
(function () {
  const PAGE_SIZE = 10;
  let page = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const CURRENT_USER = '张明';

  function getFilters() {
    return {
      keyword: (document.getElementById('filter-keyword')?.value || '').trim().toLowerCase(),
      creator: document.getElementById('filter-creator')?.value || '',
      start: document.getElementById('filter-start')?.value || '',
      end: document.getElementById('filter-end')?.value || '',
      status: document.getElementById('filter-status')?.value || '',
      syncStatus: document.getElementById('filter-sync-status')?.value || '',
      channel: document.getElementById('filter-channel')?.value || ''
    };
  }

  function populateCreatorFilterOptions() {
    const sel = document.getElementById('filter-creator');
    if (!sel || !window.JxStrategyStore) return;
    const prev = sel.value;
    const creators = [...new Set(
      JxStrategyStore.getStrategies().map(s => s.creator).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    sel.innerHTML = `
      <option value="">全部创建人</option>
      <option value="__mine__">我创建的</option>
      ${creators.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}`;
    if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
  }

  function matchesCreatorFilter(strategy, creatorFilter) {
    if (!creatorFilter) return true;
    if (creatorFilter === '__mine__') return strategy.creator === CURRENT_USER;
    return strategy.creator === creatorFilter;
  }

  function filterList() {
    if (!window.JxStrategyStore) return [];
    const f = getFilters();
    return JxStrategyStore.getStrategies().filter(s => {
      if (!JxStrategyStore.matchesStatusFilter(s, f.status)) return false;
      if (!JxStrategyStore.matchesSyncFilter(s, f.syncStatus)) return false;
      if (!matchesCreatorFilter(s, f.creator)) return false;
      if (f.channel && !(s.channelLabel || '').includes(f.channel)) return false;
      if (f.keyword) {
        const hay = (s.strategyCode + s.name + s.id).toLowerCase();
        if (!hay.includes(f.keyword)) return false;
      }
      if (f.start || f.end) {
        const periodStart = (s.period || '').split('~')[0]?.trim();
        if (f.start && periodStart && periodStart < f.start) return false;
        if (f.end && periodStart && periodStart > f.end) return false;
      }
      return true;
    });
  }

  function renderOpBtn(type, id, label, icon, variant) {
    return `<button type="button" class="sc-ops-btn sc-ops-btn--${variant || 'default'}" data-op="${type}" data-id="${esc(id)}">
      <i class="fas ${icon}"></i><span>${label}</span>
    </button>`;
  }

  function renderRowOps(s) {
    const ops = JxStrategyStore.getRowOperations(s);
    if (!ops.length) return '<span class="muted">—</span>';
    const map = {
      sync: ['同步', 'fa-rotate', 'primary'],
      submit: ['提交', 'fa-paper-plane', 'primary'],
      edit: ['修改', 'fa-pen', 'default'],
      delete: ['删除', 'fa-trash-can', 'danger']
    };
    return `<div class="sc-ops-group" data-op-count="${ops.length}">${ops.map(op => renderOpBtn(op, s.id, map[op][0], map[op][1], map[op][2])).join('')}</div>`;
  }

  function showStrategyDetail(s) {
    if (typeof window.showJxStrategyDetail === 'function') {
      window.showJxStrategyDetail(s);
    }
  }

  function handleRowAction(id, op) {
    const s = JxStrategyStore.getStrategy(id);
    if (!s) return;
    if (op === 'edit') {
      window.location.href = 'strategy-create.html?edit=' + encodeURIComponent(id);
      return;
    }
    if (op === 'delete') {
      if (confirm('确认删除该策略？')) {
        JxStrategyStore.deleteStrategy(id);
        renderList();
      }
      return;
    }
    if (op === 'submit') {
      JxStrategyStore.submitStrategy(id);
      alert('已提交审批，可在「策略审批」中处理');
      renderList();
      return;
    }
    if (op === 'sync') {
      JxStrategyStore.syncStrategy(id);
      renderList();
    }
  }

  function renderPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('strategy-list-pagination', {
      total,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderList();
      }
    });
    page = result.page;
  }

  function renderList() {
    const tbody = document.getElementById('strategy-list-tbody');
    const countEl = document.getElementById('strategy-list-count');
    if (!tbody || !window.JxStrategyStore) return;

    const list = filterList();
    if (countEl) countEl.textContent = `共 ${list.length} 条`;

    const start = (page - 1) * PAGE_SIZE;
    const rows = list.slice(start, start + PAGE_SIZE);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">暂无策略</td></tr>';
      renderPagination(0);
      return;
    }

    tbody.innerHTML = rows.map((s, i) => {
      const st = JxStrategyStore.getDisplayStatus(s);
      const syncSt = JxStrategyStore.getSyncDisplayStatus(s);
      const period = (s.period || '—').replace('~', ' 到 ');
      return `<tr data-id="${esc(s.id)}">
        <td>${start + i + 1}</td>
        <td>
          <div class="sc-strategy-name-cell">
            <code style="font-size:11px;color:#64748b">${esc(s.strategyCode || s.id)}</code>
            <a href="#" class="link-action sc-strategy-name-link" data-view-detail="${esc(s.id)}">${esc(s.name)}</a>
          </div>
        </td>
        <td style="white-space:nowrap;font-size:12px">${esc(period)}</td>
        <td style="white-space:nowrap;font-size:12px;color:#64748b">${esc(s.updatedAt || s.createdAt || '—')}</td>
        <td style="font-size:12px">${esc(s.channelLabel || '—')}</td>
        <td style="font-size:12px">${esc(s.creator || '—')}</td>
        <td><span class="badge ${st.cls}">${esc(st.label)}</span></td>
        <td><span class="badge ${syncSt.cls}">${esc(syncSt.label)}</span></td>
        <td class="strategy-ops sc-col-ops">${renderRowOps(s)}</td>
      </tr>`;
    }).join('');

    renderPagination(list.length);
  }

  function resetFilters() {
    document.querySelectorAll('#strategy-filter-form input, #strategy-filter-form select').forEach(el => {
      if (el.type === 'date' || el.type === 'text') el.value = '';
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
    });
    page = 1;
    renderList();
  }

  window.renderStrategyRecommendList = renderList;

  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('strategy-list-tbody');
    if (!tbody) return;

    tbody.addEventListener('click', e => {
      const link = e.target.closest('[data-view-detail]');
      if (link) {
        e.preventDefault();
        const s = JxStrategyStore.getStrategy(link.dataset.viewDetail);
        if (s) showStrategyDetail(s);
        return;
      }
      const btn = e.target.closest('[data-op]');
      if (btn) {
        e.preventDefault();
        handleRowAction(btn.dataset.id, btn.dataset.op);
      }
    });

    document.getElementById('btn-strategy-filter')?.addEventListener('click', () => { page = 1; renderList(); });
    document.getElementById('btn-strategy-reset')?.addEventListener('click', resetFilters);
    document.getElementById('filter-keyword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { page = 1; renderList(); }
    });
    document.getElementById('modal-strategy-detail')?.addEventListener('click', e => {
      if (e.target.id === 'modal-strategy-detail') {
        if (typeof closeModal === 'function') closeModal('modal-strategy-detail');
        else e.target.classList.remove('show');
      }
    });
    populateCreatorFilterOptions();
    renderList();
  });
})();
