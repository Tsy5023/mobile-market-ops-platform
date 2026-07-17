/** 策略创建成功 Toast */
(function () {
  const TOAST_KEY = 'jxStrategyCreateSuccess';
  const LIST_LINK = 'strategy-category.html?tab=segment';

  window.showStrategyCreateSuccessToast = function () {
    let show = false;
    try {
      show = sessionStorage.getItem(TOAST_KEY) === '1';
      if (show) sessionStorage.removeItem(TOAST_KEY);
    } catch (e) { /* ignore */ }

    if (!show) return;

    let el = document.getElementById('strategy-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'strategy-toast';
      el.className = 'strategy-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }

    el.innerHTML =
      '创建成功，策略将自动同步 IOP，您可在' +
      `<a href="${LIST_LINK}">策略中心-策略分类-客群类策略</a>中查看该策略状态。`;

    requestAnimationFrame(() => {
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 8000);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('strategy-list-tbody') || document.getElementById('sc-category-root')) {
      window.showStrategyCreateSuccessToast();
    }
  });
})();
