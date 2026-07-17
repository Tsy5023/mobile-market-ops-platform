const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const NAV = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/js/nav-data.js'), 'utf8')
  .replace(/^window\.NAV_DATA=/, '').replace(/;[\s\S]*$/, ''));

const PAGE_META = {};
const PAGE_TYPES = {
  'overview.html': 'dashboard',
  'traffic-home.html': 'dashboard',
  'international-market.html': 'dashboard',
  'indicator-insight.html': 'chart',
  'customer-insight.html': 'chart',
  'behavior-insight.html': 'chart',
  'efficiency-eval.html': 'chart',
  'strategy-eval.html': 'chart',
  'workbench.html': 'workbench'
};
const DESC = {
  'overview.html': '全局 KPI、趋势与运营健康度一览',
  'traffic-home.html': '体系化流量指标看板：规模、价值转化、客户与用量、来源分析；异常告警与指标调度；省市县格穿透',
  'churn-retention.html': '离网预警客户识别与挽留策略执行',
  'family-fusion.html': '家庭宽带/融合包拓展与成员增收',
  'high-end-retention.html': '高价值客户保有与权益运营',
  'international-market.html': '出境漫游、国际业务细分市场运营',
  'indicator-insight.html': '多维度指标下钻分析与异常发现',
  'customer-insight.html': '单客户画像、客群聚类、四维标签圈客、核心客群趋势监控',
  'behavior-insight.html': 'APP/渠道行为轨迹与偏好分析',
  'care-insight.html': '客户经理看管成效与覆盖分析',
  'opportunity-insight.html': '潜在商机挖掘与转化漏斗',
  'strategy-category.html': '营销策略分类体系与标签管理',
  'strategy-recommend.html': '智能策略推荐与匹配规则',
  'strategy-coordinate.html': '跨渠道策略编排与冲突检测',
  'task-category.html': '运营任务类型与模板定义',
  'task-aggregate.html': '多渠道任务汇聚与去重',
  'dispatch-priority.html': '任务优先级规则与动态调整',
  'process-manage.html': '运营流程设计与版本管理',
  'dispatch-assign.html': '任务派发至网格/坐席/外呼',
  'execution-track.html': '任务执行进度与闭环跟踪',
  'dispatch-collab.html': '跨部门协同与工单联动',
  'efficiency-eval.html': '活动/策略 ROI 与效能评分',
  'strategy-eval.html': '策略 A/B 效果评估与迭代建议',
  'workbench.html': '个人待办、快捷入口与消息中心',
  'alert-rules.html': '预警阈值与规则引擎配置',
  'indicator-alert.html': '基于预警规则的每日触发结果',
  'alert-record-detail.html': '预警规则单日触发结果明细',
  'alert-notify.html': '告警通知渠道与订阅管理',
  'indicator-config.html': '指标定义、口径与数据源',
  'indicator-tree.html': '指标层级树与下钻路径',
  'workbench-config.html': '运营概览与专区首页指标模块配置',
  'overview-config-preview.html': '运营概览配置预览',
  'knowledge-base.html': '运营知识文档与案例库',
  'agent-chat-history.html': '知识查询助手历史会话、对话详情与问题分析',
  'agent-qa-knowledge.html': '知识查询助手常用问答配置，增删改查与批量导入导出',
  'agent-qa-feedback.html': '用户对知识问答点赞点踩评价查询与详情',
  'agent-activity-list.html': '策略活动列表，支持筛选与触发 IOP 智能体策略诊断',
  'agent-diagnosis-list.html': '查看策略诊断记录，支持查看详情与删除',
  'agent-diagnosis-detail.html': '按诊断规则展示 AI 诊断结论与分析结果',
  'agent-diagnosis-rule-category.html': '诊断规则分类的增删改查与启用停用',
  'agent-diagnosis-rule.html': '诊断、预演、多维分析规则的统一配置入口',
  'agent-audit-list.html': '批量 AI 策略审核记录，支持查看详情与删除',
  'agent-strategy-approval.html': '浏览待审策略，勾选多条发起 AI 智能审批，或查看智能审核任务',
  'agent-audit-detail.html': '按策略展示 AI 审核规则结论与说明',
  'agent-audit-rule-category.html': '审核规则分类的增删改查与启用停用',
  'agent-audit-rule.html': '配置策略审核规则，供智能体辅助业务人员审核策略',
  'agent-diagnosis-feedback.html': '诊断规则评价反馈，支持导出、点踩处理与评价报告',
  'agent-audit-feedback.html': '审核规则评价反馈，支持导出、点踩处理与评价报告',
};

Object.values(NAV).forEach(mod => {
  mod.children.forEach(l2 => {
    l2.pages.forEach(pg => {
      PAGE_META[pg.file] = {
        title: pg.label,
        desc: DESC[pg.file] || `${pg.label}功能演示页面`,
        l1: mod.label,
        l2: l2.label,
        type: PAGE_TYPES[pg.file] || (pg.file.includes('config') || pg.file.includes('rules') || pg.file.includes('priority') || pg.file.includes('category') || pg.file.includes('process') || pg.file.includes('notify') ? 'config' : 'list')
      };
    });
  });
});

const HERO_IMGS = {
  dashboard: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop',
  chart: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop',
  list: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=400&fit=crop',
  config: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=400&fit=crop',
  workbench: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=400&fit=crop'
};

function stats() {
  const items = [
    ['fa-users', '#dbeafe', '#2563eb', '活跃用户数', '1,284,560', '+5.2%', 'up'],
    ['fa-signal', '#dcfce7', '#16a34a', '5G 渗透率', '68.4%', '+2.1%', 'up'],
    ['fa-coins', '#fef3c7', '#ca8a04', 'ARPU', '¥ 89.6', '+0.8%', 'up'],
    ['fa-bullseye', '#fce7f3', '#db2777', '营销转化率', '12.7%', '-0.3%', 'down']
  ];
  return `<div class="stat-grid">${items.map(([icon, bg, color, label, val, trend, dir]) =>
    `<div class="stat-card"><div class="icon" style="background:${bg};color:${color}"><i class="fas ${icon}"></i></div><div><div class="value">${val}</div><div class="label">${label}</div><div class="trend ${dir}"><i class="fas fa-arrow-${dir === 'up' ? 'up' : 'down'}"></i> ${trend} 较上月</div></div></div>`
  ).join('')}</div>`;
}

function chartCard(title) {
  const bars = [65, 82, 45, 90, 72, 88, 56];
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return `<div class="card"><div class="card-header"><span>${title}</span><a href="#" class="btn btn-outline"><i class="fas fa-download"></i> 导出</a></div><div class="card-body"><div class="chart-bars">${bars.map((h, i) =>
    `<div class="bar-wrap"><div class="bar" style="height:${h}%"></div><span class="bar-label">${labels[i]}</span></div>`
  ).join('')}</div></div></div>`;
}

function tableCard(title, rows) {
  const defaultRows = [
    ['华南大区', '广州', '128,450', '<span class="badge badge-success">正常</span>'],
    ['华东大区', '上海', '115,230', '<span class="badge badge-warning">关注</span>'],
    ['华北大区', '北京', '98,760', '<span class="badge badge-success">正常</span>'],
    ['西南大区', '成都', '76,540', '<span class="badge badge-info">优化中</span>'],
    ['西北大区', '西安', '54,320', '<span class="badge badge-danger">预警</span>']
  ];
  const data = rows || defaultRows;
  return `<div class="card"><div class="card-header"><span>${title}</span><button class="btn btn-primary"><i class="fas fa-plus"></i> 新建</button></div><div class="card-body" style="padding:0"><table class="data-table"><thead><tr><th>区域</th><th>地市</th><th>指标值</th><th>状态</th></tr></thead><tbody>${data.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function filterBar() {
  return `<div class="filter-bar"><select><option>全部区域</option><option>华南</option><option>华东</option></select><select><option>近7天</option><option>近30天</option><option>本季度</option></select><input type="text" placeholder="搜索关键词..." style="min-width:200px"/><button class="btn btn-primary"><i class="fas fa-search"></i> 查询</button><button class="btn btn-outline"><i class="fas fa-redo"></i> 重置</button></div>`;
}

/** 已手工开发的页面：重新生成时跳过 */
const DEVELOPED_PAGES = new Set([
  'indicator-insight.html',
  'indicator-config.html',
  'indicator-tree.html',
  'indicator-tree-detail.html',
  'indicator-tree-editor.html',
  'strategy-recommend.html',
  'strategy-eval.html',
  'strategy-create.html',
  'dispatch-assign.html',
  'workbench.html',
  'alert-rules.html',
  'indicator-alert.html',
  'alert-record-detail.html',
  'overview.html',
  'agent-chat-history.html',
  'agent-qa-knowledge.html',
  'agent-qa-feedback.html',
  'agent-activity-list.html',
  'agent-diagnosis-list.html',
  'agent-diagnosis-detail.html',
  'agent-diagnosis-feedback.html',
  'agent-diagnosis-rule-category.html',
  'agent-diagnosis-rule.html',
  'agent-audit-list.html',
  'agent-strategy-approval.html',
  'agent-audit-detail.html',
  'agent-audit-feedback.html',
  'agent-audit-rule-category.html',
  'agent-audit-rule.html',
  'agent-rehearsal-rule.html',
  'agent-portrait-rule.html'
]);

function pageDesigning(meta) {
  return `<div class="page-design-placeholder">
  <div class="page-design-icon"><i class="fas fa-pen-ruler"></i></div>
  <h2>页面设计中</h2>
  <p class="page-design-hint">「${meta.title}」功能正在规划与设计中，暂未开放演示数据与业务操作。</p>
  <p class="page-design-desc">${meta.desc}</p>
</div>`;
}

function pageContent(file, meta) {
  if (!DEVELOPED_PAGES.has(file)) {
    return pageDesigning(meta);
  }
  const type = meta.type;
  const hero = `<div class="hero-banner" style="background-image:url('${HERO_IMGS[type] || HERO_IMGS.list}')"><div class="overlay"><h2>${meta.title}</h2><p>${meta.desc}</p></div></div>`;
  if (type === 'dashboard') {
    return hero + stats() + `<div class="grid-3">${chartCard('核心指标趋势')}${tableCard('区域运营明细')}</div>`;
  }
  if (type === 'chart') {
    return hero + stats() + `<div class="grid-2">${chartCard('趋势分析')}${chartCard('对比分析')}</div>` + tableCard('洞察明细数据');
  }
  if (type === 'workbench') {
    return `<div class="grid-3"><div class="card"><div class="card-header">我的待办 <span class="badge badge-danger">8</span></div><div class="card-body"><table class="data-table"><tbody><tr><td>离网挽留任务 #2841</td><td><span class="badge badge-warning">紧急</span></td></tr><tr><td>策略审批 - 5G 升级包</td><td><span class="badge badge-info">待办</span></td></tr><tr><td>指标预警复核</td><td><span class="badge badge-danger">超时</span></td></tr></tbody></table></div></div><div class="card"><div class="card-header">快捷入口</div><div class="card-body"><div class="quick-grid"><a class="quick-item" href="traffic-home.html"><i class="fas fa-chart-line"></i><span>流量运营</span></a><a class="quick-item" href="indicator-insight.html"><i class="fas fa-lightbulb"></i><span>指标洞察</span></a><a class="quick-item" href="dispatch-assign.html"><i class="fas fa-paper-plane"></i><span>调度派发</span></a><a class="quick-item" href="alert-rules.html"><i class="fas fa-bell"></i><span>预警规则</span></a><a class="quick-item" href="strategy-recommend.html"><i class="fas fa-magic"></i><span>策略推荐</span></a><a class="quick-item" href="knowledge-base.html"><i class="fas fa-book"></i><span>知识库</span></a></div></div></div></div>`;
  }
  if (type === 'config') {
    return hero + filterBar() + `<div class="grid-2"><div class="card"><div class="card-header">配置项</div><div class="card-body"><p style="font-size:13px;color:#64748b;margin-bottom:12px">演示配置表单区域，后续可接入真实表单组件。</p><div style="display:grid;gap:12px"><label style="font-size:13px">名称 <input style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px" value="默认配置项"/></label><label style="font-size:13px">状态 <select style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px"><option>启用</option><option>停用</option></select></label><button class="btn btn-primary"><i class="fas fa-save"></i> 保存配置</button></div></div></div>${tableCard('配置记录')}</div>`;
  }
  return hero + filterBar() + tableCard(`${meta.title}列表`);
}

function layoutJs() {
  return `function isDevelopedPage(file){
  return Array.isArray(window.DEVELOPED_PAGES) && DEVELOPED_PAGES.indexOf(file) >= 0;
}
function pageMenuLabel(file, label){
  return label + (isDevelopedPage(file) ? '<span class="menu-dev-star"> *</span>' : '');
}
function findModuleByPage(file){
  for(const k of Object.keys(NAV_DATA)){
    const m=NAV_DATA[k];
    for(const c of m.children){
      for(const p of c.pages){ if(p.file===file) return {module:m,l2:c,page:p}; }
    }
  }
  return null;
}
function renderTopNav(activeModuleId){
  const el=document.getElementById('nav-l1');
  if(!el) return;
  el.innerHTML=Object.values(NAV_DATA).map(m=>
    '<a href="#" data-module="'+m.id+'" class="'+(m.id===activeModuleId?'active':'')+'"><i class="fas '+m.icon+'"></i> '+m.label+'</a>'
  ).join('');
  el.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    const mod=NAV_DATA[a.dataset.module];
    location.href='../index.html?module='+mod.id;
  }));
}
function renderSidebar(activeModuleId, activeFile){
  const mod=NAV_DATA[activeModuleId];
  const el=document.getElementById('sidebar-menu');
  if(!mod||!el) return;
  document.getElementById('sidebar-module-title').textContent=mod.label;
  el.innerHTML=mod.children.map((c,i)=>{
    const hasActive=c.pages.some(p=>p.file===activeFile);
    return '<li class="'+(hasActive?'open':'')+'"><div class="l2-label" onclick="this.parentElement.classList.toggle(\\'open\\')"><i class="fas fa-folder"></i> '+c.label+'</div><ul class="menu-l3">'+c.pages.map(p=>'<a href="'+p.file+'" class="'+(p.file===activeFile?'active':'')+'">'+pageMenuLabel(p.file,p.label)+'</a>').join('')+'</ul></li>';
  }).join('');
}
function initLayout(currentFile){
  if(window.self!==window.top) document.body.classList.add('embedded');
  const hit=findModuleByPage(currentFile);
  if(!hit) return;
  renderTopNav(hit.module.id);
  renderSidebar(hit.module.id, currentFile);
  const meta=PAGE_META[currentFile]||{};
  document.title=meta.title+' - 移动市场运营平台';
}
document.addEventListener('DOMContentLoaded',()=>initLayout(CURRENT_PAGE));`;
}

function pageHtml(file, meta) {
  const content = pageContent(file, meta);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${meta.title} - 移动市场运营平台</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="../assets/css/common.css"/>
  <script src="../assets/js/nav-data.js"></script>
  <script>const CURRENT_PAGE='${file}';</script>
</head>
<body>
<div class="app-shell">
  <header class="top-nav">
    <div class="brand"><span>移动市场运营平台</span></div>
    <nav class="nav-l1" id="nav-l1"></nav>
    <div class="top-actions">
      <span><i class="fas fa-bell"></i> 消息 <strong style="color:#fbbf24">3</strong></span>
      <span>张明 · 省公司运营</span>
      <div class="avatar"></div>
    </div>
  </header>
  <div class="main-row">
    <aside class="sidebar">
      <div class="sidebar-title" id="sidebar-module-title">模块</div>
      <ul class="menu-l2" id="sidebar-menu"></ul>
    </aside>
    <div class="content-wrap">
      <main class="content-area">
        <div class="breadcrumb"><a href="../index.html">首页</a> / ${meta.l1} / ${meta.l2} / ${meta.title}</div>
        <div class="page-header"><h1>${meta.title}</h1><p>${meta.desc}</p></div>
        ${content}
      </main>
    </div>
  </div>
</div>
<script src="../assets/js/layout.js"></script>
</body>
</html>`;
}

function indexHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>移动市场运营平台 - 原型演示</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <link rel="stylesheet" href="assets/css/common.css"/>
  <style>
    html,body{height:100%;overflow:hidden}
    .content-area{padding:0!important}
    #main-frame{width:100%;height:100%;border:none;display:block;background:#f1f5f9}
    .demo-badge{background:rgba(255,255,255,.2);padding:4px 10px;border-radius:6px;font-size:12px}
  </style>
  <script src="assets/js/nav-data.js"></script>
</head>
<body>
<div class="app-shell">
  <header class="top-nav">
    <div class="brand"><span>移动市场运营平台</span></div>
    <nav class="nav-l1" id="nav-l1"></nav>
    <div class="top-actions">
      <span><i class="fas fa-bell"></i> 消息</span>
      <span>演示账号</span>
      <div class="avatar"></div>
    </div>
  </header>
  <div class="main-row">
    <aside class="sidebar">
      <div class="sidebar-title" id="sidebar-module-title">运营概览</div>
      <ul class="menu-l2" id="sidebar-menu"></ul>
    </aside>
    <div class="content-wrap">
      <main class="content-area">
        <iframe id="main-frame" src="pages/overview.html" title="主内容区"></iframe>
      </main>
    </div>
  </div>
</div>
<script>
const params=new URLSearchParams(location.search);
let activeModule=params.get('module')||'overview';
const frame=document.getElementById('main-frame');
function isDevelopedPage(file){
  return Array.isArray(window.DEVELOPED_PAGES) && DEVELOPED_PAGES.indexOf(file) >= 0;
}
function pageMenuLabel(file, label){
  return label + (isDevelopedPage(file) ? '<span class="menu-dev-star"> *</span>' : '');
}
function renderTopNav(){
  const el=document.getElementById('nav-l1');
  el.innerHTML=Object.values(NAV_DATA).map(m=>'<a href="#" data-module="'+m.id+'" class="'+(m.id===activeModule?'active':'')+'">'+m.label+'</a>').join('');
  el.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();switchModule(a.dataset.module);});
}
function renderSidebar(activeFile){
  const mod=NAV_DATA[activeModule];
  document.getElementById('sidebar-module-title').textContent=mod.label;
  const el=document.getElementById('sidebar-menu');
  el.innerHTML=mod.children.map(c=>{
    const open=c.pages.some(p=>p.file===activeFile);
    return '<li class="'+(open?'open':'')+'"><div class="l2-label" onclick="this.parentElement.classList.toggle(\\'open\\')"><i class="fas fa-folder"></i> '+c.label+'</div><ul class="menu-l3">'+c.pages.map(p=>'<a href="#" data-page="'+p.file+'" data-label="'+p.label+'" class="'+(p.file===activeFile?'active':'')+'">'+pageMenuLabel(p.file,p.label)+'</a>').join('')+'</ul></li>';
  }).join('');
  el.querySelectorAll('.menu-l3 a').forEach(a=>a.onclick=e=>{e.preventDefault();loadPage(a.dataset.page,a.dataset.label);});
}
function loadPage(file,label){
  frame.src='pages/'+file;
  renderSidebar(file);
}
function switchModule(moduleId){
  activeModule=moduleId;
  const mod=NAV_DATA[moduleId];
  renderTopNav();
  loadPage(mod.defaultPage, mod.children[0].pages[0].label);
  history.replaceState({},'', '?module='+moduleId);
}
renderTopNav();
loadPage(NAV_DATA[activeModule].defaultPage);
frame.addEventListener('load',()=>{
  try{
    const href=frame.contentWindow.location.pathname;
    const file=href.split('/').pop();
    if(file&&file.endsWith('.html')) renderSidebar(file);
  }catch(e){}
});
</script>
</body>
</html>`;
}

// Generate layout.js
fs.writeFileSync(path.join(ROOT, 'assets/js/layout.js'), layoutJs());

// Generate index
fs.writeFileSync(path.join(ROOT, 'index.html'), indexHtml());

// Update PAGE_META in nav-data
const navOut = 'window.NAV_DATA=' + JSON.stringify(NAV, null, 2) + ';\nwindow.DEVELOPED_PAGES=' + JSON.stringify([...DEVELOPED_PAGES].sort()) + ';\nwindow.PAGE_META=' + JSON.stringify(PAGE_META, null, 2) + ';';
fs.writeFileSync(path.join(ROOT, 'assets/js/nav-data.js'), navOut);

// Generate pages
Object.keys(PAGE_META).forEach(file => {
  if (DEVELOPED_PAGES.has(file)) {
    console.log('skip (developed):', file);
    return;
  }
  fs.writeFileSync(path.join(ROOT, 'pages', file), pageHtml(file, PAGE_META[file]));
  console.log('page:', file);
});

// README
fs.writeFileSync(path.join(ROOT, 'README.md'), `# 移动市场运营平台 - 高保真 HTML 原型

## 使用方式
1. 用浏览器打开 \`index.html\`（推荐 Chrome / Edge）
2. 顶部为一级功能，左侧为二/三级菜单，中间 iframe 加载各页面
3. 也可直接打开 \`pages/\` 下任意 HTML 独立演示

## 目录
- \`index.html\` - 主入口（iframe 壳）
- \`pages/*.html\` - 31 个功能页面
- \`assets/css/common.css\` - 统一样式
- \`assets/js/nav-data.js\` - 导航与页面元数据
- \`assets/js/layout.js\` - 子页面布局脚本

## 重新生成
\`\`\`bash
node build-full.js
\`\`\`
`);

console.log('Done. Pages:', Object.keys(PAGE_META).length);
