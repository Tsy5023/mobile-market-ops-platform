/** 策略分类 · Tab 切换 */
(function () {
  const PLACEHOLDER_TEXT = {
    workorder: '工单类策略模块正在规划中，敬请期待。',
    alert: '预警类策略模块正在规划中，敬请期待。'
  };

  function switchTab(tab) {
    document.querySelectorAll('.sc-type-tabs button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scTab === tab);
    });
    const segPanel = document.getElementById('sc-segment-recommend-panel');
    const placeholder = document.getElementById('sc-placeholder-panel');
    const placeholderText = document.getElementById('sc-placeholder-text');

    if (tab === 'segment') {
      if (segPanel) segPanel.style.display = '';
      if (placeholder) placeholder.style.display = 'none';
      if (typeof window.renderStrategyRecommendList === 'function') {
        window.renderStrategyRecommendList();
      }
    } else {
      if (segPanel) segPanel.style.display = 'none';
      if (placeholder) placeholder.style.display = '';
      if (placeholderText) placeholderText.textContent = PLACEHOLDER_TEXT[tab] || '功能待设计，敬请期待。';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('sc-category-root')) return;

    document.querySelectorAll('.sc-type-tabs button').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.scTab));
    });

    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'segment' || tab === 'workorder' || tab === 'alert') switchTab(tab);
    else switchTab('segment');
  });
})();
