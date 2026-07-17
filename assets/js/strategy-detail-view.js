/** 策略详情弹窗（策略分类 / 策略审批共用） */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.showJxStrategyDetail = function (strategyOrId) {
    const s = typeof strategyOrId === 'string'
      ? window.JxStrategyStore?.getStrategy(strategyOrId)
      : strategyOrId;
    const body = document.getElementById('strategy-detail-body');
    const title = document.getElementById('strategy-detail-title');
    if (!body || !s) return;

    if (title) title.textContent = s.name || '策略详情';
    const st = window.JxStrategyStore?.getDisplayStatus(s) || { cls: 'badge-info', label: '—' };
    const syncSt = window.JxStrategyStore?.getSyncDisplayStatus(s) || { cls: 'badge-secondary', label: '—' };
    const products = (s.products || []).map(p => p.name).join('、') || s.product || '—';
    const channels = (s.channels || []).map(c => c.channelName || c.displayLabel).join('、') || s.channelLabel || '—';
    const period = (s.period || '').replace('~', ' 到 ');

    body.innerHTML = `
      <div class="strategy-detail-section">
        <h4>策略基本信息</h4>
        <div class="detail-kv-grid">
          <div class="detail-kv"><span class="k">策略名称</span><strong>${esc(s.name)}</strong></div>
          <div class="detail-kv"><span class="k">策略编号</span><code>${esc(s.strategyCode || s.id)}</code></div>
          <div class="detail-kv"><span class="k">投放周期</span><strong>${esc(period)}</strong></div>
          <div class="detail-kv"><span class="k">IOP策略状态</span><span class="badge ${st.cls}">${esc(st.label)}</span></div>
          <div class="detail-kv"><span class="k">IOP同步状态</span><span class="badge ${syncSt.cls}">${esc(syncSt.label)}</span></div>
          <div class="detail-kv"><span class="k">策略类型</span><strong>${esc(s.type)}</strong></div>
          <div class="detail-kv"><span class="k">专题</span><strong>${esc(s.specialTopic || '—')}</strong></div>
          <div class="detail-kv"><span class="k">集团场景</span><strong>${esc(s.groupScene || '—')}</strong></div>
          <div class="detail-kv"><span class="k">运营场景</span><strong>${esc(s.operationScene || '—')}</strong></div>
          <div class="detail-kv"><span class="k">营销模板</span><strong>${esc(s.marketingTemplate || '—')}</strong></div>
          <div class="detail-kv"><span class="k">活动类型</span><strong>${esc(s.activityType || '—')}</strong></div>
          <div class="detail-kv"><span class="k">活动目的</span><strong>${esc(s.activityGoal || '—')}</strong></div>
          <div class="detail-kv"><span class="k">审批超管</span><strong>${esc(s.approvalAdmin || '—')}</strong></div>
          <div class="detail-kv"><span class="k">敏感用户群</span><strong>${esc(s.sensitiveGroup || '—')}</strong></div>
          <div class="detail-kv"><span class="k">创建来源</span><strong>${esc(s.createSource || '—')}</strong></div>
          <div class="detail-kv"><span class="k">创建人</span><strong>${esc(s.creator || '—')}</strong></div>
          <div class="detail-kv full"><span class="k">策略描述</span><strong>${esc(s.strategyDesc || '—')}</strong></div>
        </div>
      </div>
      <div class="strategy-detail-section">
        <h4>来源客群</h4>
        <div class="detail-kv-grid">
          <div class="detail-kv"><span class="k">客群名称</span><strong>${esc(s.segment)}</strong></div>
          <div class="detail-kv"><span class="k">客群规模</span><strong>${esc(s.scaleLabel || '—')}</strong></div>
          <div class="detail-kv"><span class="k">来源指标</span><strong>${esc(s.sourceMetric || '—')}</strong></div>
          <div class="detail-kv"><span class="k">指标值</span><strong>${esc(s.metricValue || '—')}</strong></div>
        </div>
      </div>
      <div class="strategy-detail-section">
        <h4>产品配置</h4>
        <p>${esc(products)}</p>
      </div>
      <div class="strategy-detail-section">
        <h4>渠道配置</h4>
        <p>${esc(channels)}</p>
      </div>`;

    const modal = document.getElementById('modal-strategy-detail');
    if (typeof openModal === 'function') openModal('modal-strategy-detail');
    else if (modal) modal.classList.add('show');
  };
})();
