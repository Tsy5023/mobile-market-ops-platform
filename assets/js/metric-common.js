/** 指标类页面通用交互 */
function initTabs(container) {
  const root = typeof container === 'string' ? document.querySelector(container) : container;
  if (!root) return;
  const tabs = root.querySelectorAll('[data-tab]');
  const panels = root.querySelectorAll('[data-panel]');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t === btn));
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === id));
    });
  });
}

function initCompareTabs(container) {
  const root = typeof container === 'string' ? document.querySelector(container) : container;
  if (!root) return;
  root.querySelectorAll('.compare-tabs').forEach(wrap => {
    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.target);
        if (target) target.textContent = btn.dataset.label || btn.textContent;
      });
    });
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

document.addEventListener('click', e => {
  const closeBtn = e.target.closest('[data-close-modal]');
  if (closeBtn) {
    closeModal(closeBtn.dataset.closeModal);
    return;
  }
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

function bindTreeSelect(selector, onSelect) {
  document.querySelectorAll(selector + ' .node-row').forEach(row => {
    row.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll(selector + ' .node-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      if (onSelect) onSelect(row.dataset.id, row.dataset.name);
    });
  });
}

function bindDrillPath() {
  document.querySelectorAll('.drill-path [data-level]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const level = a.dataset.level;
      document.querySelectorAll('.drill-path .crumb').forEach((c, i) => {
        c.style.display = parseInt(c.dataset.level, 10) <= parseInt(level, 10) ? '' : 'none';
      });
    });
  });
}
