/** 运营概览配置预览 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getPageKey() {
    return new URLSearchParams(location.search).get('page') || 'overview.html';
  }

  function isDraftPreview() {
    return new URLSearchParams(location.search).get('draft') === '1';
  }

  function loadConfig() {
    const pageKey = getPageKey();
    if (isDraftPreview()) {
      try {
        const raw = sessionStorage.getItem('ovcfg_preview_draft');
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.pageKey === pageKey && parsed.config) return parsed.config;
      } catch (e) { /* ignore */ }
    }
    return OverviewConfigStore.getConfig(pageKey);
  }

  function renderPreview() {
    const pageKey = getPageKey();
    const profile = OverviewConfigStore.getProfile(pageKey);
    const config = loadConfig();
    const titleEl = document.getElementById('ovcfg-preview-title');
    const subEl = document.getElementById('ovcfg-preview-sub');
    const root = document.getElementById('ovcfg-preview-root');
    const emptyEl = document.getElementById('ovcfg-preview-empty');

    if (titleEl) titleEl.textContent = profile?.label || '首页预览';
    if (subEl) {
      subEl.textContent = isDraftPreview()
        ? '预览模式 · 展示当前未保存的配置效果'
        : '预览模式 · 展示已保存的配置效果';
    }

    if (!config?.sections?.length || !root) {
      if (root) root.innerHTML = '';
      emptyEl?.removeAttribute('hidden');
      return;
    }
    emptyEl?.setAttribute('hidden', '');

    const modules = OverviewConfigRender.buildModulesFromConfig(config, 'month', {}, null);
    root.innerHTML = OverviewConfigRender.renderModulesHtml(modules, { showDispatch: false });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ovcfg-preview-root')) return;
    renderPreview();
  });
})();
