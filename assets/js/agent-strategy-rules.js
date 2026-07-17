/** 策略规则管理 · TAB 切换 */
(function () {
  const TABS = {
    diagnosis: {
      label: '诊断规则',
      intro: '配置策略诊断规则：选择策略字段（客群、产品、渠道等）并设置诊断细节，IOP 智能体按启用规则对策略进行诊断。',
      icon: 'fa-stethoscope',
      createLabel: '新增规则',
      panelId: 'panel-diagnosis'
    },
    rehearsal: {
      label: '预演规则',
      intro: '配置策略预演规则，选择特殊名单及营销频次等过滤项，诊断时按规则逐条预演并展示过滤客户数。',
      icon: 'fa-users-viewfinder',
      createLabel: '新增预演规则',
      panelId: 'panel-rehearsal'
    },
    portrait: {
      label: '多维分析规则',
      intro: '配置客群画像分析规则，诊断时自动按规则输出典型客群画像，并在诊断详情中展示分析结果。',
      icon: 'fa-chart-pie',
      createLabel: '新增分析规则',
      panelId: 'panel-portrait'
    }
  };

  let currentTab = 'diagnosis';
  const tabApis = {};

  function switchTab(tab) {
    if (!TABS[tab]) tab = 'diagnosis';
    currentTab = tab;

    document.querySelectorAll('.agent-rule-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    Object.keys(TABS).forEach(key => {
      const panel = document.getElementById(TABS[key].panelId);
      if (panel) panel.hidden = key !== tab;
    });

    const meta = TABS[tab];
    const intro = document.getElementById('rule-intro');
    if (intro) {
      intro.innerHTML = `<i class="fas ${meta.icon}"></i><div>${meta.intro}</div>`;
    }
    const createBtn = document.getElementById('btn-create');
    if (createBtn) {
      createBtn.innerHTML = `<i class="fas fa-plus"></i> ${meta.createLabel}`;
      createBtn.onclick = () => {
        const api = tabApis[tab];
        if (api?.openForm) api.openForm();
      };
    }

    const url = new URL(location.href);
    url.searchParams.set('tab', tab);
    history.replaceState(null, '', url);
  }

  document.addEventListener('DOMContentLoaded', () => {
    tabApis.diagnosis = window.initAgentDiagnosisRuleTab('dr');
    tabApis.rehearsal = window.initAgentRehearsalRuleTab('rh');
    tabApis.portrait = window.initAgentPortraitRuleTab('pr');

    document.querySelectorAll('.agent-rule-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    const tab = new URLSearchParams(location.search).get('tab') || 'diagnosis';
    switchTab(TABS[tab] ? tab : 'diagnosis');
  });
})();
