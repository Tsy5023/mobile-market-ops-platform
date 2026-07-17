/** 客群洞察 */
(function () {
  const MONITOR_PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  let monitorPage = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function maskPhone(p) {
    const s = String(p);
    return s.length >= 11 ? s.slice(0, 3) + '****' + s.slice(-4) : s;
  }

  let activeTab = 'single';
  let tagCart = [];
  let cartRules = [];
  let expandedDims = new Set(['natural']);
  let tagGlobalKw = '';
  let tagRegion = 'province';
  const dimFilterState = {};

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.ci-page-tabs button').forEach(b => {
      b.classList.toggle('active', b.dataset.ciTab === tab);
    });
    document.querySelectorAll('.ci-tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'ci-panel-' + tab);
    });
    if (tab === 'segment') renderSegmentPanel();
    if (tab === 'tags') {
      renderTagDimensions();
      updateTagBottomBar();
    }
    if (tab === 'monitor') renderMonitorList();
    document.getElementById('ci-tag-bottom-bar')?.classList.toggle('hidden', tab !== 'tags');
    document.getElementById('ci-cart-float')?.classList.add('hidden');
  }

  function renderSingleCustomer(c) {
    const el = document.getElementById('ci-single-result');
    if (!el) return;
    if (!c) {
      el.innerHTML = '<div class="ci-single-empty"><p class="muted">请输入 11 位手机号后点击查询</p><p class="muted" style="font-size:12px">演示号：13807010001、13979128888</p></div>';
      return;
    }

    const dl = c.dimLabels || {};
    const dimBlock = (title, items, pos) => `
      <div class="ci-4d-block ci-4d-${pos}">
        <h5>${esc(title)}</h5>
        ${(items || []).map(t => `<div class="ci-4d-tag"><span>${esc(t.name)}</span><strong>${esc(t.value)}</strong></div>`).join('')}
      </div>`;

    el.innerHTML = `
      <section class="ci-basic-row">
        <div class="ci-info-card ci-info-identity">
          <div class="ci-avatar"><i class="fas fa-user"></i></div>
          <div class="ci-id-main">
            <div class="name">${esc(c.name)}</div>
            <div class="sub">${c.age}岁 · ${esc(c.status)} · ${esc(c.city)}</div>
            <div class="oneid">OneID：${esc(c.oneId)}</div>
          </div>
        </div>
        <div class="ci-info-card">
          <h4>基础个人信息</h4>
          <ul class="ci-info-list">
            <li><span>用户星级</span><strong>${esc(c.starLevel)}</strong></li>
            <li><span>客户品牌</span><strong>${esc(c.brand)}</strong></li>
            <li><span>3个月均 ARPU</span><strong>¥ ${c.arpu3m ?? c.arpu}</strong></li>
            <li><span>月 incoming MOU</span><strong>${c.mou} 分钟</strong></li>
            <li><span>3个月均 DOU</span><strong>${c.dou3m ?? c.dou} GB</strong></li>
          </ul>
        </div>
        <div class="ci-info-card">
          <h4>自然人手机号识别</h4>
          <ul class="ci-info-list">
            <li><span>手机号码</span><strong>${maskPhone(c.msisdn)}</strong></li>
            <li><span>在网状态</span><strong>${esc(c.status)}</strong></li>
            <li><span>实名状态</span><strong>${esc(c.realName || '已实名')}</strong></li>
            <li><span>主套餐</span><strong>${esc(c.package)}</strong></li>
            <li><span>全球通</span><strong>${esc(c.globalLevel)}</strong></li>
          </ul>
        </div>
        <div class="ci-info-card">
          <h4>车辆信息</h4>
          <ul class="ci-info-list">
            ${(c.vehicle || []).map(v => `<li><span>${esc(v.label)}</span><strong>${esc(v.value)}</strong></li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="ci-4d-section">
        <h3 class="ci-section-title"><i class="fas fa-th"></i> 四维自然人标签</h3>
        <div class="ci-4d-layout">
          ${dimBlock('自然属性', dl.natural, 'top')}
          ${dimBlock('社会属性', dl.social, 'left')}
          <div class="ci-4d-center">
            <div class="ci-4d-center-inner">
              <i class="fas fa-fingerprint"></i>
              <span>自然人<br/>标签视图</span>
            </div>
          </div>
          ${dimBlock('行为属性', dl.behavior, 'right')}
          ${dimBlock('价值属性', dl.value, 'bottom')}
        </div>
      </section>

      <section class="ci-marketing-section">
        <div class="ci-marketing-head">
          <h3 class="ci-section-title"><i class="fas fa-route"></i> 自然人营销轨迹</h3>
          <div class="ci-marketing-filters">
            <select id="ci-mkt-line"><option value="${esc(c.msisdn)}">${maskPhone(c.msisdn)}</option></select>
            <input type="date" value="2026-04-01"/> <span class="muted">至</span> <input type="date" value="2026-05-21"/>
          </div>
        </div>
        <div class="ci-timeline">
          ${(c.marketing || []).map(m => `
            <div class="ci-timeline-item">
              <div class="ci-tl-time">${esc(m.time)}</div>
              <div class="ci-tl-body">
                <span class="badge badge-info">${esc(m.channel)}</span>
                <strong>${esc(m.content)}</strong>
                <span class="muted">· ${esc(m.result)}</span>
              </div>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function renderSegmentPanel() {
    const sel = document.getElementById('ci-segment-select');
    const body = document.getElementById('ci-segment-body');
    if (!sel || !body) return;
    const list = CustomerInsightData.getSegmentList();
    if (!sel.options.length) {
      sel.innerHTML = list.map(s => `<option value="${esc(s.id)}">${esc(s.name)}（${esc(s.scaleLabel || s.scale)}）</option>`).join('');
      sel.addEventListener('change', () => renderSegmentPanel());
    }
    const seg = list.find(s => s.id === sel.value) || list[0];
    if (!seg) { body.innerHTML = '<p class="muted">暂无客群数据</p>'; return; }
    const clusters = [
      { name: '高价值稳定簇', pct: 38, traits: ['ARPU≥100', '融合绑定', '低离网风险'] },
      { name: '价格敏感簇', pct: 34, traits: ['降档查询', '套外偏高', '营业厅偏好'] },
      { name: '沉默唤醒簇', pct: 28, traits: ['低 DOU', 'APP 沉默', '合约将到期'] }
    ];
    const affinity = CustomerInsightData.productAffinity(seg.id);
    const a = seg.analytics || {};
    body.innerHTML = `
      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="stat-card"><div><div class="label">客群规模</div><div class="value">${esc(seg.scaleLabel || seg.scale)}</div></div></div>
        <div class="stat-card"><div><div class="label">场景</div><div class="value" style="font-size:14px">${esc(seg.scene)}</div></div></div>
        <div class="stat-card"><div><div class="label">主 ARPU</div><div class="value">${esc(seg.profile?.arpu || '—')}</div></div></div>
        <div class="stat-card"><div><div class="label">5G/网络</div><div class="value" style="font-size:14px">${esc(seg.profile?.network || '—')}</div></div></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><i class="fas fa-project-diagram"></i> 自动化特征聚类</div>
        <div class="card-body"><div class="ci-cluster-grid">${clusters.map(c => `
          <div class="ci-cluster-card"><h4>${esc(c.name)}</h4><div class="pct">${c.pct}%</div>
          <p class="muted" style="font-size:11px;margin:8px 0 0">${c.traits.map(t => esc(t)).join(' · ')}</p></div>`).join('')}
        </div>${a.mindMap ? `<p class="muted" style="font-size:12px;margin-top:12px"><strong>画像摘要：</strong>${esc(a.mindMap.center)}</p>` : ''}</div>
      </div>
      <div class="card"><div class="card-header"><i class="fas fa-link"></i> 特征与目标产品关联度</div>
        <div class="card-body table-scroll"><table class="data-table ci-affinity-table">
          <thead><tr><th>产品</th><th>类型</th><th>得分</th><th>等级</th></tr></thead>
          <tbody>${affinity.map(p => `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.type)}</td>
            <td class="${p.score >= 85 ? 'score-high' : p.score >= 65 ? 'score-mid' : 'score-low'}">${p.score}</td>
            <td><span class="badge badge-success">${p.level}</span></td></tr>`).join('')}
        </tbody></table></div></div>`;
  }

  function getDimFilter(dimId) {
    if (!dimFilterState[dimId]) dimFilterState[dimId] = { sub: '全部', local: '', sort: 'refs' };
    return dimFilterState[dimId];
  }

  function renderTagCard(tag, inCart) {
    const badges = `${tag.hot ? '<span class="ci-badge-hot">火</span>' : ''}${tag.isNew ? '<span class="ci-badge-new">新</span>' : ''}`;
    const caliber = tag.sql
      ? `<code class="ci-tag-sql">${esc(tag.sql)}</code>`
      : `<p class="ci-tag-caliber">${esc(tag.caliber)}</p>`;
    return `
      <article class="ci-tag-market-card ${inCart ? 'in-cart' : ''}" data-tag-id="${esc(tag.id)}">
        <div class="ci-tag-card-top">
          <h4>${esc(tag.name)} ${badges}</h4>
          <span class="ci-conv-pill">营销转化率 ${tag.conversionRate}%</span>
        </div>
        <div class="ci-tag-card-meta">
          <span>日期周期 ${esc(tag.dateCycle)}</span>
          <span class="ci-type-pill">${esc(tag.tagType)}</span>
          <span class="ci-cycle-pill ${tag.cycle === '日标签' ? 'daily' : ''}">${esc(tag.cycle)}</span>
        </div>
        ${caliber}
        <div class="ci-tag-card-stats">
          <span>本群引用 <strong>${tag.groupRefs}</strong></span>
          <span>策略引用 <strong>${tag.strategyRefs}</strong></span>
          <span class="muted">更新 ${esc(tag.updateTime)}</span>
        </div>
        <div class="ci-tag-card-actions">
          <button type="button" class="btn-link">详情</button>
          <button type="button" class="btn-link">分析</button>
          <button type="button" class="ci-cart-icon-btn ${inCart ? 'active' : ''}" data-add-tag="${esc(tag.id)}" title="加入购物车">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </article>`;
  }

  function renderTagDimensions() {
    const root = document.getElementById('ci-tag-dimensions');
    if (!root) return;
    root.innerHTML = CustomerInsightData.TAG_DIMENSIONS.map(dim => {
      const f = getDimFilter(dim.id);
      const tags = CustomerInsightData.filterTags(dim.id, {
        keyword: tagGlobalKw,
        subCategory: f.sub,
        localKw: f.local,
        sort: f.sort
      });
      return `
      <div class="ci-dim-block ${expandedDims.has(dim.id) ? 'open' : ''}" data-dim="${dim.id}">
        <div class="ci-dim-head">
          <h3>${esc(dim.name)} <span class="ci-dim-count">(${dim.totalCount || dim.tags.length})</span></h3>
          <button type="button" class="btn-link ci-dim-toggle">${expandedDims.has(dim.id) ? '折叠' : '展开'}</button>
        </div>
        <div class="ci-dim-body">
          <div class="ci-dim-toolbar">
            <div class="ci-sub-tabs">${dim.subCategories.map(s =>
              `<button type="button" class="ci-sub-tab ${f.sub === s ? 'active' : ''}" data-dim="${dim.id}" data-sub="${esc(s)}">${esc(s)}</button>`
            ).join('')}</div>
            <div class="ci-dim-toolbar-right">
              <input type="text" class="ci-dim-local-search" placeholder="搜索板块内标签" data-dim="${dim.id}" value="${esc(f.local)}"/>
              <select class="ci-dim-sort" data-dim="${dim.id}">
                <option value="refs" ${f.sort === 'refs' ? 'selected' : ''}>引用次数</option>
                <option value="time" ${f.sort === 'time' ? 'selected' : ''}>发布时间</option>
              </select>
            </div>
          </div>
          <div class="ci-tag-market-grid">${tags.map(t => renderTagCard(t, tagCart.some(c => c.id === t.id))).join('')}</div>
          ${!tags.length ? '<p class="muted" style="padding:12px">无匹配标签</p>' : ''}
        </div>
      </div>`;
    }).join('');

    root.querySelectorAll('.ci-dim-head').forEach(head => {
      head.addEventListener('click', e => {
        if (e.target.closest('.ci-dim-local-search, .ci-sub-tab, .ci-dim-sort')) return;
        const id = head.closest('.ci-dim-block').dataset.dim;
        if (expandedDims.has(id)) expandedDims.delete(id); else expandedDims.add(id);
        head.closest('.ci-dim-block').classList.toggle('open');
        head.querySelector('.ci-dim-toggle').textContent = expandedDims.has(id) ? '折叠' : '展开';
      });
    });
    root.querySelectorAll('.ci-sub-tab').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        getDimFilter(btn.dataset.dim).sub = btn.dataset.sub;
        renderTagDimensions();
      });
    });
    root.querySelectorAll('.ci-dim-local-search').forEach(inp => {
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('input', () => {
        getDimFilter(inp.dataset.dim).local = inp.value;
        renderTagDimensions();
      });
    });
    root.querySelectorAll('.ci-dim-sort').forEach(sel => {
      sel.addEventListener('click', e => e.stopPropagation());
      sel.addEventListener('change', () => {
        getDimFilter(sel.dataset.dim).sort = sel.value;
        renderTagDimensions();
      });
    });
    root.querySelectorAll('[data-add-tag]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); toggleTagInCart(btn.dataset.addTag); });
    });
    updateTagBottomBar();
  }

  function findTag(id) {
    for (const dim of CustomerInsightData.TAG_DIMENSIONS) {
      const t = dim.tags.find(x => x.id === id);
      if (t) return { ...t, dimension: dim.name };
    }
    return null;
  }

  function toggleTagInCart(tagId) {
    const idx = tagCart.findIndex(t => t.id === tagId);
    if (idx >= 0) {
      tagCart.splice(idx, 1);
      cartRules = cartRules.filter(r => r.tagId !== tagId);
    } else {
      const tag = findTag(tagId);
      if (tag) {
        tagCart.push(tag);
        cartRules.push({
          tagId: tag.id, tagName: tag.name,
          join: cartRules.length ? '且' : '',
          operator: '等于',
          value: (tag.values && tag.values[0]) || ''
        });
      }
    }
    renderTagDimensions();
    updateTagBottomBar();
  }

  function updateTagBottomBar() {
    const n = tagCart.length;
    const est = CustomerInsightData.estimateCustomers(n);
    document.getElementById('ci-cart-count-bottom') && (document.getElementById('ci-cart-count-bottom').textContent = n);
    document.getElementById('ci-est-customers') && (document.getElementById('ci-est-customers').textContent = est.toLocaleString());
    document.getElementById('ci-est-time') && (document.getElementById('ci-est-time').textContent = (0.8 + n * 0.35).toFixed(1) + 's');
    const badge = document.getElementById('ci-cart-count');
    if (badge) badge.textContent = n;
  }

  function renderCartModal() {
    const list = document.getElementById('ci-cart-list');
    const rules = document.getElementById('ci-cart-rules');
    if (!list) return;
    if (!tagCart.length) {
      list.innerHTML = '<p class="muted">购物车为空</p>';
      if (rules) rules.innerHTML = '';
      return;
    }
    list.innerHTML = tagCart.map(t => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9">
        <span><strong>${esc(t.name)}</strong> <span class="muted">(${esc(t.dimension)})</span></span>
        <button type="button" class="btn-link text-alert" data-remove-tag="${esc(t.id)}">移除</button>
      </div>`).join('');
    list.querySelectorAll('[data-remove-tag]').forEach(btn => {
      btn.addEventListener('click', () => toggleTagInCart(btn.dataset.removeTag));
    });
    if (rules) {
      rules.innerHTML = '<h4 style="margin:0 0 10px;font-size:13px">标签组合（且/或）</h4>' +
        cartRules.map((r, i) => {
          const tag = findTag(r.tagId);
          const vals = (tag?.values || []).map(v => `<option value="${esc(v)}" ${v === r.value ? 'selected' : ''}>${esc(v)}</option>`).join('');
          return `<div class="ci-rule-row" data-rule-idx="${i}">
            ${i > 0 ? `<select class="ci-rule-join" data-field="join">${['且','或'].map(j => `<option ${r.join===j?'selected':''}>${j}</option>`).join('')}</select>` : ''}
            <strong>${esc(r.tagName)}</strong>
            <select data-field="operator" class="ci-rule-join"><option ${r.operator==='等于'?'selected':''}>等于</option><option>不等于</option></select>
            ${vals ? `<select data-field="value" class="ci-rule-join">${vals}</select>` : '<input data-field="value" class="ci-rule-join" placeholder="取值"/>' }
          </div>`;
        }).join('');
      rules.querySelectorAll('.ci-rule-row').forEach(row => {
        const idx = parseInt(row.dataset.ruleIdx, 10);
        row.querySelectorAll('[data-field]').forEach(sel => {
          sel.addEventListener('change', () => { cartRules[idx][sel.dataset.field] = sel.value; });
          sel.addEventListener('input', () => { if (sel.dataset.field === 'value') cartRules[idx].value = sel.value; });
        });
      });
    }
  }

  function openCartModal() {
    renderCartModal();
    document.getElementById('modal-ci-cart')?.classList.add('show');
  }

  function submitSegmentFromCart() {
    if (!tagCart.length) { window.alert('请先添加标签'); return; }
    const name = document.getElementById('ci-new-segment-name')?.value?.trim() || '自定义标签客群';
    const expr = cartRules.map((r, i) => (i > 0 ? r.join + ' ' : '') + `${r.tagName} ${r.operator} ${r.value || '—'}`).join(' ');
    window.alert(`客群已生成（演示）\n\n名称：${name}\n规则：${expr}\n预估：${CustomerInsightData.estimateCustomers(tagCart.length).toLocaleString()} 人`);
    document.getElementById('modal-ci-cart')?.classList.remove('show');
  }

  function trendBars(values, labels, unit, color) {
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const h = 120;
    return `
      <div class="ci-trend-chart-wrap">
        <div class="ci-trend-bars">${values.map((v, i) => {
          const barH = Math.max(12, Math.round(((v - min * 0.9) / (max - min * 0.9 || 1)) * h));
          return `<div class="bar-col">
            <span class="bar-val">${typeof v === 'number' && v > 1000 ? v.toLocaleString() : v}${unit || ''}</span>
            <div class="bar" style="height:${barH}px;background:${color || '#2563eb'}"></div>
            <span class="lbl">${esc(labels[i] || '')}</span>
          </div>`;
        }).join('')}</div>
      </div>`;
  }

  function trendLineSvg(values, labels, color) {
    const w = 520;
    const h = 140;
    const pad = 28;
    const max = Math.max(...values) * 1.08;
    const min = Math.min(...values) * 0.92;
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return { x, y, v };
    });
    const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
    const stroke = color || '#2563eb';
    return `<svg class="ci-line-chart" viewBox="0 0 ${w} ${h}" width="100%">
      ${labels.map((lb, i) => {
        const x = pad + (i / (labels.length - 1 || 1)) * (w - pad * 2);
        return `<text x="${x}" y="${h - 6}" text-anchor="middle" font-size="9" fill="#94a3b8">${esc(lb)}</text>`;
      }).join('')}
      <polyline fill="none" stroke="${stroke}" stroke-width="2.5" points="${poly}"/>
      ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#fff" stroke="${stroke}" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="9" fill="#475569">${typeof p.v === 'number' && p.v > 999 ? p.v.toLocaleString() : p.v}</text>`).join('')}
    </svg>`;
  }

  function trendTable(headers, rows) {
    return `<table class="data-table ci-trend-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function fmtPct(n, signed) {
    const v = Number(n) || 0;
    const prefix = signed && v > 0 ? '+' : '';
    return prefix + v.toFixed(1) + '%';
  }

  function fmtDeltaNum(n) {
    const v = Number(n) || 0;
    return (v > 0 ? '+' : '') + v.toLocaleString();
  }

  function renderMatrixAnalysis(matrix, labels) {
    if (!matrix?.cells?.length) {
      return '<p class="muted">暂无矩阵切分数据</p>';
    }
    const sm = matrix.summary || {};
    const dirClass = { upgrade: 'ci-matrix-dir-up', downgrade: 'ci-matrix-dir-down', mixed: 'ci-matrix-dir-mix', stable: 'ci-matrix-dir-flat' }[sm.direction] || 'ci-matrix-dir-flat';
    const dirIcon = { upgrade: 'fa-arrow-trend-up', downgrade: 'fa-arrow-trend-down', mixed: 'fa-shuffle', stable: 'fa-minus' }[sm.direction] || 'fa-minus';
    const prevLabel = matrix.prevLabel || (labels.length > 1 ? labels[labels.length - 2] : '上月');
    const monthLabel = matrix.monthLabel || (labels.length ? labels[labels.length - 1] : '本月');

    const cellByKey = {};
    matrix.cells.forEach(c => { cellByKey[c.stabIdx + '-' + c.valIdx] = c; });

    const renderCell = (c) => {
      if (!c) return '<div class="ci-matrix-cell ci-matrix-cell-empty"></div>';
      const chgCls = c.momDelta > 0 ? 'up' : c.momDelta < 0 ? 'down' : 'flat';
      const shareCls = c.shareDelta > 0 ? 'up' : c.shareDelta < 0 ? 'down' : 'flat';
      return `
        <div class="ci-matrix-cell mx-${c.id}" title="${esc(c.label)}">
          <div class="ci-mx-count">${c.count.toLocaleString()}</div>
          <div class="ci-mx-change ${chgCls}">较上月 ${fmtDeltaNum(c.momDelta)} 人 · ${fmtPct(c.momPct, true)}</div>
          <div class="ci-mx-meta">占比 ${c.share}% · <span class="${shareCls}">${c.shareDelta >= 0 ? '+' : ''}${c.shareDelta}pp</span></div>
        </div>`;
    };

    const stabOrder = [2, 1, 0];
    let chartGrid = `
      <div class="ci-mx-corner">
        <span>稳定度</span>
        <span class="ci-mx-axis-x-hint">价值度 →</span>
      </div>`;
    matrix.valueLevels.forEach(l => {
      chartGrid += `<div class="ci-mx-axis-x">${esc(l)}</div>`;
    });
    stabOrder.forEach(s => {
      chartGrid += `<div class="ci-mx-axis-y">${esc(matrix.stabilityLevels[s])}</div>`;
      for (let v = 0; v < 3; v++) {
        chartGrid += renderCell(cellByKey[s + '-' + v]);
      }
    });

    const tableRows = matrix.cells.map(c => {
      const chgCls = c.momDelta > 0 ? 'up' : c.momDelta < 0 ? 'down' : '';
      const shareCls = c.shareDelta > 0 ? 'up' : c.shareDelta < 0 ? 'down' : '';
      return [
        esc(c.label),
        (c.prevCount || 0).toLocaleString() + ' 人',
        c.count.toLocaleString() + ' 人',
        `<span class="${chgCls}">${fmtDeltaNum(c.momDelta)} 人（${fmtPct(c.momPct, true)}）</span>`,
        c.share + '%',
        `<span class="${shareCls}">${c.shareDelta >= 0 ? '+' : ''}${c.shareDelta}pp</span>`
      ];
    });

    const flowItems = matrix.cells.slice()
      .sort((a, b) => Math.abs(b.momDelta) - Math.abs(a.momDelta))
      .slice(0, 6)
      .map(c => {
        const chgCls = c.momDelta > 0 ? 'up' : c.momDelta < 0 ? 'down' : 'flat';
        return `<li class="ci-mx-flow-item ${chgCls}">
          <span class="ci-mx-flow-label">${esc(c.label)}</span>
          <span class="ci-mx-flow-val">${fmtDeltaNum(c.momDelta)} 人 · ${fmtPct(c.momPct, true)}</span>
        </li>`;
      }).join('');

    return `
      <div class="ci-matrix-summary ${dirClass}">
        <div class="ci-matrix-summary-icon"><i class="fas ${dirIcon}"></i></div>
        <div class="ci-matrix-summary-body">
          <strong>近 1 月结构变化判断（${esc(prevLabel)} → ${esc(monthLabel)}）</strong>
          <p>${esc(sm.headline || '')}</p>
          <ul>${(sm.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        </div>
      </div>

      <p class="muted ci-trend-summary">
        将客群按<strong>稳定度</strong>×<strong>价值度</strong>切分为 9 个子群，展示<strong>近 1 个月</strong>各格人数与占比变化（当前合计 <strong>${(matrix.total || 0).toLocaleString()} 人</strong>）。
      </p>

      <div class="ci-matrix-9-wrap ci-matrix-9-full">
        <div class="ci-matrix-chart-layout">${chartGrid}</div>
      </div>

      <div class="ci-mx-flow-panel">
        <h5 class="ci-matrix-table-title">近 1 月变化幅度 TOP</h5>
        <ul class="ci-mx-flow-list">${flowItems}</ul>
      </div>

      <h5 class="ci-matrix-table-title">近 1 月各矩阵单元变化明细</h5>
      ${trendTable(['矩阵单元', esc(prevLabel) + '人数', esc(monthLabel) + '人数', '人数变化', '本月占比', '占比变化'], tableRows)}
    `;
  }

  function renderMonitorPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('ci-monitor-pagination', {
      total,
      page: monitorPage,
      pageSize: MONITOR_PAGE_SIZE,
      onPageChange: nextPage => {
        monitorPage = nextPage;
        renderMonitorList();
      }
    });
    monitorPage = result.page;
  }

  function renderMonitorList() {
    const tbody = document.getElementById('ci-monitor-tbody');
    const countEl = document.getElementById('ci-monitor-count');
    if (!tbody) return;
    const list = window.MonitorSegmentStore?.getAll() || [];
    if (countEl) countEl.textContent = `共 ${list.length} 个`;

    const pageRows = TablePagination
      ? TablePagination.slice(list, monitorPage, MONITOR_PAGE_SIZE)
      : list;

    if (!pageRows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无监控客群，请点击「添加监控客群」</td></tr>';
      renderMonitorPagination(list.length);
      return;
    }
    tbody.innerHTML = pageRows.map(m => `
      <tr>
        <td><strong>${esc(m.name)}</strong><br/><span class="muted" style="font-size:11px">${esc(m.scene || '')}</span></td>
        <td>${m.scale.toLocaleString()} 人</td>
        <td>${esc(m.owner)}</td>
        <td><span class="badge badge-info">${esc(m.updateCycle)}</span></td>
        <td>${m.stability}</td>
        <td>${m.valueScore}</td>
        <td class="muted" style="font-size:11px">${esc((m.lastUpdate || '').slice(0, 16))}</td>
        <td class="ci-monitor-actions">
          <button type="button" class="btn btn-primary btn-sm" data-monitor-detail="${esc(m.id)}">趋势详情</button>
          <button type="button" class="btn btn-outline btn-sm text-alert" data-monitor-delete="${esc(m.id)}">删除</button>
        </td>
      </tr>`).join('');
    renderMonitorPagination(list.length);
    tbody.querySelectorAll('[data-monitor-detail]').forEach(btn => {
      btn.addEventListener('click', () => openMonitorDetail(btn.dataset.monitorDetail));
    });
    tbody.querySelectorAll('[data-monitor-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = MonitorSegmentStore.getById(btn.dataset.monitorDelete);
        if (!item) return;
        if (window.confirm(`确定将「${item.name}」移出监控清单？`)) {
          MonitorSegmentStore.remove(btn.dataset.monitorDelete);
          renderMonitorList();
        }
      });
    });
  }

  function openAddMonitorModal() {
    const sel = document.getElementById('ci-monitor-add-select');
    const available = MonitorSegmentStore.getAvailableSegments();
    if (!sel) return;
    if (!available.length) {
      sel.innerHTML = '<option value="">暂无可添加客群（均已监控）</option>';
    } else {
      sel.innerHTML = available.map(s =>
        `<option value="${esc(s.id)}">${esc(s.name)}（${esc(s.scaleLabel || s.scale)}）</option>`
      ).join('');
    }
    document.getElementById('modal-ci-monitor-add')?.classList.add('show');
  }

  function openMonitorDetail(id) {
    const m = MonitorSegmentStore.getById(id);
    if (!m) return;
    const t = m.trend;
    const labels = t.labels || [];
    const body = document.getElementById('ci-monitor-detail-body');
    if (!body || !t) return;

    const scale = t.scale;
    const struct = t.structure;
    const val = t.value;
    const stab = t.stability;
    const mx = t.matrix || {};

    const scaleRows = labels.map((lb, i) => [
      esc(lb),
      scale.values[i].toLocaleString() + ' 人',
      i > 0 ? ((scale.values[i] - scale.values[i - 1]) / scale.values[i - 1] * 100).toFixed(1) + '%' : '—'
    ]);

    body.innerHTML = `
      <div class="ci-monitor-detail-head">
        <div class="ci-monitor-kpis">
          <div class="ci-mkpi"><span>当前规模</span><strong>${m.scale.toLocaleString()} 人</strong></div>
          <div class="ci-mkpi"><span>月环比</span><strong class="${scale.momUp ? 'up' : 'down'}">${scale.mom}</strong></div>
        </div>
        <div class="ci-monitor-alerts">${(t.alerts || [])
          .filter(a => !/价值指数|价值度指数|稳定度指数|稳定性指数|参考定位/.test(a.text || ''))
          .map(a => `<span class="ci-malert ${a.level}">${esc(a.text)}</span>`).join('')}</div>
      </div>

      <div class="ci-monitor-tabs" id="ci-monitor-detail-tabs">
        <button type="button" class="active" data-mtab="scale">规模趋势</button>
        <button type="button" data-mtab="structure">结构变化</button>
        <button type="button" data-mtab="value">价值变化</button>
        <button type="button" data-mtab="stability">稳定性</button>
        <button type="button" data-mtab="matrix">矩阵分析</button>
        <button type="button" data-mtab="city">地市分布</button>
      </div>

      <div class="ci-monitor-tab-panels">
        <section class="ci-mtab-panel active" data-mpanel="scale">
          <h4>客群规模趋势（近 6 个月）</h4>
          <p class="muted ci-trend-summary">峰值 ${scale.peak.toLocaleString()} 人 · 谷值 ${scale.valley.toLocaleString()} 人 · 同比 ${scale.yoy}</p>
          ${trendLineSvg(scale.values, labels, '#2563eb')}
          ${trendBars(scale.values, labels, '', '#3b82f6')}
          ${trendTable(['月份', '规模', '环比'], scaleRows)}
        </section>

        <section class="ci-mtab-panel" data-mpanel="structure">
          <h4>客群结构变化趋势</h4>
          <p class="muted ci-trend-summary">${esc(struct.desc)}</p>
          <div class="ci-legend-inline">
            <span><i style="background:#8b5cf6"></i>5G 渗透率</span>
            <span><i style="background:#2563eb"></i>高价值占比</span>
            <span><i style="background:#14b8a6"></i>融合绑定占比</span>
          </div>
          ${trendLineSvg(struct.g5Share, labels, '#8b5cf6')}
          <div class="ci-dual-charts">
            <div><h5>高价值客户占比 (%)</h5>${trendBars(struct.highValueShare, labels, '%', '#2563eb')}</div>
            <div><h5>融合绑定占比 (%)</h5>${trendBars(struct.fusionShare, labels, '%', '#14b8a6')}</div>
          </div>
          ${trendTable(['月份', '5G渗透%', '高价值%', '融合%'], labels.map((lb, i) => [
            esc(lb), struct.g5Share[i] + '%', struct.highValueShare[i] + '%', struct.fusionShare[i] + '%'
          ]))}
        </section>

        <section class="ci-mtab-panel" data-mpanel="value">
          <h4>客群价值变化趋势</h4>
          <p class="muted ci-trend-summary">月均 ARPU 与估算收入贡献（亿元）</p>
          ${trendLineSvg(val.arpu, labels, '#d97706')}
          <div class="ci-dual-charts">
            <div><h5>月均 ARPU（元）</h5>${trendBars(val.arpu, labels, '', '#d97706')}</div>
            <div><h5>收入贡献（亿元）</h5>${trendBars(val.revenueContrib, labels, '', '#f59e0b')}</div>
          </div>
          ${trendTable(['月份', 'ARPU(元)', '收入贡献(亿)'], labels.map((lb, i) => [
            esc(lb), val.arpu[i], val.revenueContrib[i]
          ]))}
        </section>

        <section class="ci-mtab-panel" data-mpanel="stability">
          <h4>客群稳定性分析</h4>
          <p class="muted ci-trend-summary">离网率越低、维系成功率越高表示稳定性越好</p>
          <div class="ci-dual-charts">
            <div><h5>离网率 (%)</h5>${trendBars(stab.churnRate, labels, '%', '#dc2626')}</div>
            <div><h5>维系成功率 (%)</h5>${trendBars(stab.retainSuccess, labels, '%', '#16a34a')}</div>
          </div>
          <div><h5>沉默用户占比 (%)</h5>${trendBars(stab.silentRate, labels, '%', '#94a3b8')}</div>
          ${trendTable(['月份', '离网率', '沉默率', '维系成功率'], labels.map((lb, i) => [
            esc(lb), stab.churnRate[i] + '%', stab.silentRate[i] + '%', stab.retainSuccess[i] + '%'
          ]))}
        </section>

        <section class="ci-mtab-panel" data-mpanel="matrix">
          <h4>矩阵结构变化趋势（近 1 月）</h4>
          ${renderMatrixAnalysis(mx, labels)}
        </section>

        <section class="ci-mtab-panel" data-mpanel="city">
          <h4>地市规模分布（当前月）</h4>
          ${trendBars((t.cityTop || []).map(c => c.scale), (t.cityTop || []).map(c => c.name), ' 人', '#0d9488')}
          ${trendTable(['地市', '规模', '占比'], (t.cityTop || []).map(c => [
            esc(c.name), c.scale.toLocaleString() + ' 人', c.pct + '%'
          ]))}
        </section>
      </div>`;

    body.querySelectorAll('#ci-monitor-detail-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.mtab;
        body.querySelectorAll('#ci-monitor-detail-tabs button').forEach(b => b.classList.toggle('active', b === btn));
        body.querySelectorAll('.ci-mtab-panel').forEach(p => p.classList.toggle('active', p.dataset.mpanel === tab));
      });
    });

    document.getElementById('ci-monitor-detail-title').textContent = '客群趋势详情 · ' + m.name;
    document.getElementById('modal-ci-monitor')?.classList.add('show');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ci-insight-root')) return;

    document.querySelectorAll('.ci-page-tabs button').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.ciTab));
    });

    document.getElementById('btn-ci-search')?.addEventListener('click', () => {
      renderSingleCustomer(CustomerInsightData.lookupCustomer(document.getElementById('ci-phone-input')?.value));
    });
    document.getElementById('ci-phone-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-ci-search')?.click();
    });

    document.getElementById('ci-tag-global-search')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        tagGlobalKw = e.target.value;
        renderTagDimensions();
      }
    });
    document.getElementById('btn-ci-tag-search')?.addEventListener('click', () => {
      tagGlobalKw = document.getElementById('ci-tag-global-search')?.value || '';
      renderTagDimensions();
    });
    document.querySelectorAll('.ci-region-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tagRegion = btn.dataset.region;
        document.querySelectorAll('.ci-region-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    document.getElementById('ci-open-cart-rules')?.addEventListener('click', openCartModal);
    document.getElementById('btn-ci-create-group')?.addEventListener('click', () => {
      if (!tagCart.length) { openCartModal(); return; }
      openCartModal();
    });
    document.getElementById('btn-ci-create-portrait')?.addEventListener('click', () => {
      if (!tagCart.length) { window.alert('请先选择标签'); return; }
      switchTab('segment');
      window.alert('将基于已选 ' + tagCart.length + ' 个标签生成群体画像（演示）');
    });
    document.getElementById('btn-ci-submit-segment')?.addEventListener('click', submitSegmentFromCart);
    document.getElementById('btn-ci-monitor-add')?.addEventListener('click', openAddMonitorModal);
    document.getElementById('btn-ci-monitor-add-confirm')?.addEventListener('click', () => {
      const id = document.getElementById('ci-monitor-add-select')?.value;
      if (!id) { window.alert('请选择客群'); return; }
      const res = MonitorSegmentStore.addFromSegment(id);
      if (!res.ok) { window.alert(res.message); return; }
      document.getElementById('modal-ci-monitor-add')?.classList.remove('show');
      renderMonitorList();
    });
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => document.getElementById(btn.dataset.closeModal)?.classList.remove('show'));
    });

    renderSingleCustomer(null);
    switchTab('single');
  });
})();
