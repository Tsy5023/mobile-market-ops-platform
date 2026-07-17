function isDevelopedPage(file){
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
    return '<li class="'+(hasActive?'open':'')+'"><div class="l2-label" onclick="this.parentElement.classList.toggle(\'open\')"><i class="fas fa-folder"></i> '+c.label+'</div><ul class="menu-l3">'+c.pages.map(p=>'<a href="'+p.file+'" class="'+(p.file===activeFile?'active':'')+'">'+pageMenuLabel(p.file,p.label)+'</a>').join('')+'</ul></li>';
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
document.addEventListener('DOMContentLoaded',()=>initLayout(CURRENT_PAGE));