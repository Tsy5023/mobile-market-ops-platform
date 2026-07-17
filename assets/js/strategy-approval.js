/** 策略审批（630） */
(function () {
  const KEY = 'jxStrategyApprovals';
  const PAGE_SIZE = 10;
  let activeTab = 'pending';
  let page = 1;
  let filtered = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function readList() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeList(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function ensureSeed() {
    if (!readList()) writeList([...window.STRATEGY_APPROVAL_SEED]);
  }

  window.JxApprovalStore = {
    getAll() {
      ensureSeed();
      return readList() || [];
    },
    saveAll(list) {
      writeList(list);
    },
    getPending() {
      return this.getAll().filter(r => r.status === 'pending');
    },
    getApproved() {
      return this.getAll().filter(r => r.status === 'approved' || r.status === 'rejected');
    },
    addPending(strategy) {
      const list = this.getAll();
      if (list.some(r => r.strategyId === strategy.id && r.status === 'pending')) return;
      list.unshift({
        id: 'APR-' + Date.now(),
        strategyId: strategy.id,
        strategyCode: strategy.strategyCode || strategy.id,
        activityName: strategy.name,
        nodeName: '审批',
        type: '营销活动',
        scene: strategy.createSource === '智推策略' ? '智推策略场景' : '单策略场景',
        submitter: strategy.creator || '—',
        submittedAt: strategy.submittedAt || new Date().toLocaleString('zh-CN', { hour12: false }),
        status: 'pending',
        approvalType: '策略',
        source: 'IOP',
        creator: strategy.creator || '—'
      });
      this.saveAll(list);
    },
    approve(id, result, opinion) {
      const list = this.getAll();
      const i = list.findIndex(r => r.id === id);
      if (i < 0) return null;
      const rec = list[i];
      rec.status = result === 'pass' ? 'approved' : 'rejected';
      rec.approvalResult = result === 'pass' ? '通过' : '驳回';
      rec.approvalOpinion = opinion || '';
      rec.approvedAt = new Date().toLocaleString('zh-CN', { hour12: false });
      rec.approver = '管**';
      list[i] = rec;
      this.saveAll(list);
      if (window.JxStrategyStore && rec.strategyId) {
        const s = window.JxStrategyStore.getStrategy(rec.strategyId);
        if (s) {
          window.JxStrategyStore.upsertStrategy({
            ...s,
            status: result === 'pass' ? 'pending_exec' : 'approval_rejected',
            approvalOpinion: result === 'reject' ? opinion : ''
          });
        }
      }
      return rec;
    }
  };

  function parseDatePart(datetime) {
    return String(datetime || '').slice(0, 10);
  }

  function matchDateRange(dateStr, start, end) {
    if (!dateStr) return false;
    if (start && dateStr < start) return false;
    if (end && dateStr > end) return false;
    return true;
  }

  function getFilters() {
    return {
      submitter: (document.getElementById('appr-f-submitter')?.value || '').trim().toLowerCase(),
      submitStart: document.getElementById('appr-f-submit-start')?.value || '',
      submitEnd: document.getElementById('appr-f-submit-end')?.value || '',
      approver: (document.getElementById('appr-f-approver')?.value || '').trim().toLowerCase(),
      approveStart: document.getElementById('appr-f-approve-start')?.value || '',
      approveEnd: document.getElementById('appr-f-approve-end')?.value || ''
    };
  }

  function syncTabUi() {
    const isApproved = activeTab === 'approved';
    document.querySelectorAll('.appr-filter-approved-only').forEach(el => {
      el.toggleAttribute('hidden', !isApproved);
    });
    renderTableHead();
  }

  function renderTableHead() {
    const thead = document.getElementById('approval-thead');
    if (!thead) return;
    const approvedCols = activeTab === 'approved'
      ? '<th>审批人</th><th>审批时间</th>'
      : '';
    thead.innerHTML = `
      <tr>
        <th style="width:48px">序号</th>
        <th>审批策略</th>
        <th>提交人</th>
        <th>提交时间</th>
        ${approvedCols}
        <th style="width:88px">操作</th>
      </tr>`;
  }

  function getColspan() {
    return activeTab === 'approved' ? 7 : 5;
  }

  function applyFilters() {
    const f = getFilters();
    const base = activeTab === 'pending'
      ? window.JxApprovalStore.getPending()
      : window.JxApprovalStore.getApproved();
    filtered = base.filter(row => {
      if (f.submitter && !(row.submitter || '').toLowerCase().includes(f.submitter)) return false;
      if ((f.submitStart || f.submitEnd) && !matchDateRange(parseDatePart(row.submittedAt), f.submitStart, f.submitEnd)) return false;
      if (activeTab === 'approved') {
        if (f.approver && !(row.approver || '').toLowerCase().includes(f.approver)) return false;
        if ((f.approveStart || f.approveEnd) && !matchDateRange(parseDatePart(row.approvedAt), f.approveStart, f.approveEnd)) return false;
      }
      return true;
    });
    page = 1;
    renderTable();
    renderPagination();
  }

  function renderStrategyCell(row) {
    return `
      <div class="appr-activity-cell">
        <code style="font-size:11px;color:#64748b">${esc(row.strategyCode)}</code>
        <a href="#" class="link-action sc-strategy-name-link" data-view-strategy="${esc(row.strategyId)}">${esc(row.activityName)}</a>
      </div>`;
  }

  function renderTable() {
    const tbody = document.getElementById('approval-tbody');
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${getColspan()}" style="text-align:center;color:#94a3b8;padding:40px">暂无数据</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((row, i) => {
      const ops = activeTab === 'pending'
        ? `<button type="button" class="btn btn-primary btn-sm" data-appr-act="${esc(row.id)}">审批</button>`
        : `<span class="badge ${row.status === 'approved' ? 'badge-success' : 'badge-danger'}">${esc(row.approvalResult || '—')}</span>`;
      const approvedCells = activeTab === 'approved'
        ? `<td>${esc(row.approver || '—')}</td><td style="white-space:nowrap;font-size:12px">${esc(row.approvedAt || '—')}</td>`
        : '';
      return `
      <tr data-appr-id="${esc(row.id)}">
        <td>${start + i + 1}</td>
        <td>${renderStrategyCell(row)}</td>
        <td>${esc(row.submitter)}</td>
        <td style="white-space:nowrap;font-size:12px">${esc(row.submittedAt)}</td>
        ${approvedCells}
        <td class="cell-actions">${ops}</td>
      </tr>`;
    }).join('');
  }

  function renderPagination() {
    if (!window.TablePagination) return;
    const result = TablePagination.render('approval-pagination', {
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderTable();
        renderPagination();
      }
    });
    page = result.page;
  }

  let pendingApprovalId = null;

  function syncOpinionLabel() {
    const isReject = document.querySelector('input[name="appr-result"][value="reject"]')?.checked;
    const label = document.getElementById('appr-opinion-label');
    const ta = document.getElementById('appr-opinion');
    if (label) {
      label.classList.toggle('req', !!isReject);
      label.textContent = isReject ? '驳回理由' : '审批意见';
    }
    if (ta) ta.placeholder = isReject ? '请填写驳回理由' : '选填，最多500字';
  }

  function showApprovalModal() {
    const modal = document.getElementById('modal-strategy-approval');
    if (!modal) return;
    if (typeof openModal === 'function') openModal('modal-strategy-approval');
    else modal.classList.add('show');
  }

  function hideApprovalModal() {
    if (typeof closeModal === 'function') closeModal('modal-strategy-approval');
    else document.getElementById('modal-strategy-approval')?.classList.remove('show');
  }

  function openApprovalModal(id) {
    pendingApprovalId = id;
    const rec = window.JxApprovalStore.getAll().find(r => r.id === id);
    const title = document.getElementById('approval-modal-title');
    if (title && rec) title.textContent = `审批 · ${rec.activityName}`;
    const passRadio = document.querySelector('input[name="appr-result"][value="pass"]');
    if (passRadio) passRadio.checked = true;
    const opinion = document.getElementById('appr-opinion');
    if (opinion) opinion.value = '';
    syncOpinionLabel();
    showApprovalModal();
  }

  function submitApproval() {
    const result = document.querySelector('input[name="appr-result"]:checked')?.value;
    const opinion = (document.getElementById('appr-opinion')?.value || '').trim();
    if (!result) { window.alert('请选择审批结果'); return; }
    if (result === 'reject' && !opinion) { window.alert('审批驳回需填写理由'); return; }
    window.JxApprovalStore.approve(pendingApprovalId, result, opinion);
    hideApprovalModal();
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('approval-tbody')) return;
    ensureSeed();

    document.getElementById('approval-tbody').addEventListener('click', e => {
      const apprBtn = e.target.closest('[data-appr-act]');
      if (apprBtn) {
        e.preventDefault();
        openApprovalModal(apprBtn.dataset.apprAct);
        return;
      }
      const nameLink = e.target.closest('[data-view-strategy]');
      if (nameLink) {
        e.preventDefault();
        const strategyId = nameLink.dataset.viewStrategy;
        if (strategyId && typeof window.showJxStrategyDetail === 'function') {
          window.showJxStrategyDetail(strategyId);
        }
      }
    });

    document.querySelectorAll('[data-appr-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.apprTab;
        document.querySelectorAll('[data-appr-tab]').forEach(b => b.classList.toggle('active', b.dataset.apprTab === activeTab));
        syncTabUi();
        applyFilters();
      });
    });

    document.getElementById('btn-appr-query')?.addEventListener('click', applyFilters);
    document.getElementById('btn-appr-reset')?.addEventListener('click', () => {
      document.querySelectorAll('#appr-filter input, #appr-filter select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      applyFilters();
    });

    document.querySelectorAll('input[name="appr-result"]').forEach(radio => {
      radio.addEventListener('change', syncOpinionLabel);
    });

    document.getElementById('btn-appr-submit')?.addEventListener('click', submitApproval);

    document.getElementById('modal-strategy-approval')?.addEventListener('click', e => {
      if (e.target.id === 'modal-strategy-approval') hideApprovalModal();
    });
    syncTabUi();
    applyFilters();
  });
})();
