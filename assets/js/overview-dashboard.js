/** 业务指挥中心首页 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let period = 'month';
  let region = { level: 'province' };
  let drillMetric = null;
  let tooltipEl = null;

  function ensureTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'ov-chart-tooltip';
      tooltipEl.id = 'ov-chart-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function bindTooltip(el, text) {
    if (!el || !text) return;
    const tip = ensureTooltip();
    el.addEventListener('mouseenter', e => {
      tip.textContent = text;
      tip.classList.add('show');
      moveTip(e);
    });
    el.addEventListener('mousemove', moveTip);
    el.addEventListener('mouseleave', () => tip.classList.remove('show'));
    function moveTip(ev) {
      tip.style.left = (ev.clientX + 12) + 'px';
      tip.style.top = (ev.clientY + 12) + 'px';
    }
  }

  function arrowTrend(label, val, up) {
    const icon = up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    const cls = up ? 'up' : 'down';
    return `<span class="ov-trend-pair">${label} <span class="ov-trend ${cls}"><i class="fas ${icon}"></i> ${esc(val)}</span></span>`;
  }

  function hBarChart(items, horizontal) {
    const max = Math.max(...items.map(i => i.pct ?? i.value ?? 0), 1);
    return `<div class="ov-hbars">${items.map(i => {
      const v = i.pct ?? i.value;
      const w = Math.round((v / max) * 100);
      const tip = `${i.name}: ${v}${i.unit || (i.pct != null ? '%' : '')}`;
      return `<div class="ov-hbar-row" data-tip="${esc(tip)}" ${i.drillId ? `data-drill-city="${esc(i.drillId || i.id)}"` : ''}>
        <span class="ov-hbar-label">${esc(i.name)}</span>
        <div class="ov-hbar-track"><div class="ov-hbar-fill" style="width:${w}%;background:${i.color || '#3b82f6'}"></div></div>
        <span class="ov-hbar-val">${v}${i.unit || (i.pct != null ? '%' : '')}</span>
      </div>`;
    }).join('')}</div>`;
  }

  function vBarRank(items) {
    const max = Math.max(...items.map(i => i.value), 1);
    return `<div class="ov-vbars">${items.slice(0, 8).map(i => {
      const h = Math.max(12, Math.round((i.value / max) * 100));
      const tip = `${i.name}: ${i.value.toLocaleString()}户`;
      return `<div class="ov-vbar-col" data-tip="${esc(tip)}">
        <div class="ov-vbar" style="height:${h}%"></div>
        <span class="ov-vbar-name">${esc(i.name)}</span>
      </div>`;
    }).join('')}</div>`;
  }

  function trendLine(series, w, h) {
    const pad = 8;
    const max = Math.max(...series) * 1.05;
    const min = Math.min(...series) * 0.95;
    const range = max - min || 1;
    const pts = series.map((v, i) => {
      const x = pad + (i / (series.length - 1 || 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return { x, y, v };
    });
    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    const circles = pts.map((p, i) =>
      `<circle class="ov-line-dot" cx="${p.x}" cy="${p.y}" r="4" data-tip="${esc('第' + (i + 1) + '期: ' + p.v + (typeof p.v === 'number' && p.v < 50 ? ' GB/户' : ''))}"/>`
    ).join('');
    return `<svg class="ov-line-chart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <polyline fill="none" stroke="#2563eb" stroke-width="2" points="${line}"/>
      ${circles}
    </svg>`;
  }

  function lineWithThreshold(series, threshold, w, h) {
    const pad = 8;
    const max = Math.max(...series, threshold) * 1.1;
    const min = Math.min(...series, threshold) * 0.9;
    const range = max - min || 1;
    const pts = series.map((v, i) => {
      const x = pad + (i / (series.length - 1 || 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return { x, y, v };
    });
    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    const thY = pad + (1 - (threshold - min) / range) * (h - pad * 2);
    const circles = pts.map((p, i) =>
      `<circle class="ov-line-dot" cx="${p.x}" cy="${p.y}" r="4" data-tip="${esc('第' + (i + 1) + '期: ' + p.v + '%')}"/>`
    ).join('');
    return `<svg class="ov-line-chart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <line x1="${pad}" y1="${thY}" x2="${w - pad}" y2="${thY}" stroke="#f59e0b" stroke-dasharray="4 3" stroke-width="1.5"/>
      <text x="${w - pad - 2}" y="${thY - 4}" text-anchor="end" font-size="9" fill="#d97706">阈值 ${threshold}%</text>
      <polyline fill="none" stroke="#2563eb" stroke-width="2" points="${line}"/>
      ${circles}
    </svg>`;
  }

  function pie(parts) {
    let acc = 0;
    const stops = parts.map(p => {
      const s = acc; acc += p.pct;
      return `${p.color} ${s}% ${acc}%`;
    }).join(', ');
    return `<div class="ov-pie-wrap">
      <div class="ov-pie" style="background:conic-gradient(${stops})" data-tip="点击查看构成"></div>
      <div class="ov-pie-legend">${parts.map(p =>
        `<span data-tip="${esc(p.label + ' ' + p.pct + '%')}"><i style="background:${p.color}"></i>${esc(p.label)} ${p.pct}%</span>`
      ).join('')}</div>
    </div>`;
  }

  function funnel(stages) {
    const max = stages[0].count;
    return `<div class="ov-funnel">${stages.map((s, i) => {
      const w = Math.max(30, Math.round((s.count / max) * 100));
      const rate = i > 0 ? Math.round((s.count / stages[i - 1].count) * 1000) / 10 : null;
      const tip = `${s.stage}: ${s.count.toLocaleString()}人${rate ? '，转化率' + rate + '%' : ''}`;
      return `<div class="ov-funnel-step" style="--fw:${w}%" data-tip="${esc(tip)}">
        <div class="ov-funnel-bar"><span>${esc(s.stage)}</span><strong>${s.count.toLocaleString()}</strong></div>
        ${rate != null ? `<div class="ov-funnel-rate">${rate}%</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  function sparkline(values, w, h) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    }).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="ov-spark">${values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `<circle cx="${x}" cy="${y}" r="3" class="ov-line-dot" data-tip="${esc('第' + (i + 1) + '月: ¥' + v)}"/>`;
    }).join('')}<polyline fill="none" stroke="#2563eb" stroke-width="2" points="${pts}"/></svg>`;
  }

  function bindChartTips(root) {
    root?.querySelectorAll('[data-tip]').forEach(el => bindTooltip(el, el.getAttribute('data-tip')));
  }

  function metricBlock(title, body, opts) {
    const alert = opts?.alert ? ' is-alert' : '';
    const drill = opts?.drill ? ` data-drill="${opts.drill}"` : '';
    return `<div class="ov-metric-block${alert}"${drill}><h4 class="ov-metric-title">${esc(title)}</h4>${body}</div>`;
  }

  function bindDrill(root) {
    root?.querySelectorAll('[data-drill]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => openDrill(el.dataset.drill));
    });
  }

  function renderCore(d) {
    const el = document.getElementById('ov-core-kpis');
    if (!el) return;
    el.innerHTML = d.core.map(k => {
      let body = `<div class="ov-kpi-hero-value">${typeof k.value === 'number' ? k.value.toLocaleString() : k.value}<small>${esc(k.unit)}</small></div>`;
      if (k.yoy) body += `<div class="ov-kpi-hero-trends">${arrowTrend('同比', k.yoy, k.yoyUp)}${k.mom ? ' ' + arrowTrend('环比', k.mom, k.momUp) : ''}</div>`;
      if (k.progress != null) body += `<div class="ov-progress"><div class="ov-progress-bar" style="width:${Math.min(100, k.progress)}%"></div></div>`;
      if (k.trend) body += `<div class="ov-kpi-hero-chart">${sparkline(k.trend, 180, 40)}</div><div class="ov-kpi-hero-sub muted">近 6 个月</div>`;
      if (k.sub) body += `<div class="ov-kpi-hero-sub muted">${esc(k.sub)}</div>`;
      return `<article class="ov-kpi-hero ${k.alert ? 'is-alert' : ''}" data-drill="${esc(k.drillKey || '')}">
        <div class="ov-kpi-hero-label">${esc(k.label)}</div>${body}</article>`;
    }).join('');
    bindDrill(el);
    bindChartTips(el);
  }

  function renderMini(d) {
    const el = document.getElementById('ov-mini-kpis');
    if (!el) return;
    el.innerHTML = d.mini.map(m => `
      <div class="ov-mini-card ${m.alert ? 'is-alert' : ''}" ${m.drillKey ? `data-drill="${m.drillKey}"` : ''}>
        <span class="ov-mini-label">${esc(m.label)}</span>
        <span class="ov-mini-value">${typeof m.value === 'number' ? m.value.toLocaleString() : esc(m.value)}${m.unit ? '<small>' + esc(m.unit) + '</small>' : ''}</span>
        ${m.grade ? `<span class="ov-roi-badge sm">${m.grade}</span>` : ''}
      </div>`).join('');
    bindDrill(el);
  }

  function renderUser(d) {
    const u = d.user;
    const panel = document.getElementById('ov-panel-user');
    if (!panel) return;
    panel.innerHTML = `
      <div class="ov-metric-grid-3">
        ${metricBlock('新增客户数', `
          <div class="ov-metric-num">${u.newCustomers.value.toLocaleString()}<small>户</small></div>
          <p class="ov-metric-desc">含携号转入 · 地市排名</p>${vBarRank(u.newCustomers.rank)}`, { drill: 'newCust' })}
        ${metricBlock('携号转入 / 携出预警', `
          <div class="ov-metric-row-2">
            <div><span class="muted">转入</span><strong>${u.portIn.value.toLocaleString()}</strong> 户</div>
            <div class="${u.portOut.alert ? 'text-alert' : ''}"><span class="muted">携出预警</span><strong data-drill="portOut">${u.portOut.value.toLocaleString()}</strong> 户</div>
          </div>`, { alert: u.portOut.alert })}
        ${metricBlock('离网率', `
          <div class="ov-metric-num ${u.churnRate.alert ? 'is-alert' : ''}">${u.churnRate.value}<small>%</small></div>
          <p class="ov-metric-desc">阈值 ${u.churnRate.threshold}%</p>
          ${lineWithThreshold(u.churnRate.series, u.churnRate.threshold, 280, 72)}`, { drill: 'churn', alert: u.churnRate.alert })}
        ${metricBlock('维系成功率', `
          <div class="ov-metric-num">${u.retainRate.value}<small>%</small></div>
          <p class="ov-metric-desc">目标 ${u.retainRate.target}%</p>
          ${trendLine(u.retainRate.series, 280, 56)}`)}
        ${metricBlock('中高端客户净增', `
          <div class="ov-metric-num">${u.heNetAdd.value.toLocaleString()}<small>${u.heNetAdd.unit}</small></div>
          <p class="ov-metric-desc">全球通 / 尊享等中高端新增</p>`, { drill: 'heScale' })}
        ${metricBlock('活跃客户占比', `
          <div class="ov-metric-num">${u.activeRate.parts[0].pct}<small>%</small></div>
          ${pie(u.activeRate.parts)}`)}
        ${metricBlock('5G 客户渗透率', `
          <div class="ov-metric-num">${u.g5Penetration.value}<small>%</small></div>
          <div class="ov-progress"><div class="ov-progress-bar g5" style="width:${u.g5Penetration.value}%"></div></div>
          ${hBarChart(u.g5Penetration.cities.map(c => ({ name: c.name, value: c.value, unit: '%' })))}`, { drill: 'g5' })}
        ${metricBlock('合约到期客户数', `
          <div class="ov-metric-num">${u.contractExpire.value.toLocaleString()}<small>${u.contractExpire.unit}</small></div>
          <p class="ov-metric-desc">60 天内到期 · 需续约攻坚</p>`, { drill: 'contract' })}
      </div>`;
    bindDrill(panel);
    bindChartTips(panel);
  }

  function renderValueOps(d) {
    const v = d.valueOps;
    const panel = document.getElementById('ov-panel-value');
    if (!panel) return;
    panel.innerHTML = `
      <div class="ov-metric-grid-3">
        ${metricBlock('市场收入结构', `
          <p class="ov-metric-desc">语音 / 流量 / 增值家庭等构成</p>
          ${pie(v.revenueMix)}`)}
        ${metricBlock('流量相关收入占比', `
          <div class="ov-metric-num">${v.trafficRevShare.value}<small>%</small></div>
          ${arrowTrend('环比', v.trafficRevShare.mom, v.trafficRevShare.momUp)}
          <p class="ov-metric-desc">流量收入 ÷ 总运营收入</p>`, { drill: 'trafficRev' })}
        ${metricBlock('套外收入（收入口径）', `
          <div class="ov-metric-num ${v.outPackageRev.alert ? 'is-alert' : ''}">${v.outPackageRev.value}<small>${v.outPackageRev.unit}</small></div>
          ${arrowTrend('环比', v.outPackageRev.mom, v.outPackageRev.momUp)}
          <p class="ov-metric-desc">关注套外贡献而非流量 GB</p>`, { alert: v.outPackageRev.alert })}
        ${metricBlock('家庭融合渗透率', `
          <div class="ov-metric-num">${v.familyFusion.value}<small>%</small></div>
          <div class="ov-progress"><div class="ov-progress-bar" style="width:${v.familyFusion.value}%"></div></div>
          <p class="ov-metric-desc">目标 ${v.familyFusion.target}%</p>`, { drill: 'fusion' })}
        ${metricBlock('5G 套餐升档率', `
          <div class="ov-metric-num">${v.upgrade5g.value}<small>%</small></div>
          ${arrowTrend('环比', v.upgrade5g.mom, v.upgrade5g.momUp)}
          <p class="ov-metric-desc">升档客户 ÷ 5G 在网客户</p>`)}
        ${metricBlock('降档办理量', `
          <div class="ov-metric-num is-alert">${v.downgrade.value.toLocaleString()}<small>${v.downgrade.unit}</small></div>
          <p class="ov-metric-desc">异动地市 TOP3</p>
          ${hBarChart(v.downgrade.cities.slice(0, 3).map(c => ({ name: c.name, value: c.value, unit: '笔' })))}`, { alert: true })}
        ${metricBlock('数字化收入占比', `
          <div class="ov-metric-num">${v.digitalRevShare.value}<small>%</small></div>
          <p class="ov-metric-desc">线上 / APP / 电子渠道收入</p>
          ${trendLine(v.digitalRevShare.trend, 280, 56)}`)}
      </div>`;
    bindDrill(panel);
    bindChartTips(panel);
  }

  function renderCityBoard(d) {
    const el = document.getElementById('ov-city-board');
    if (!el) return;
    el.innerHTML = `<table class="data-table ov-city-table">
      <thead><tr>
        <th>排名</th><th>地市</th><th>收入(亿)</th><th>完成率</th><th>净增(户)</th><th>离网率</th><th>ARPU(元)</th><th>状态</th>
      </tr></thead>
      <tbody>${d.cityBoard.map((r, i) => `
        <tr class="${r.alert ? 'row-alert' : ''}" data-drill-city="${esc(r.id)}">
          <td>${i + 1}</td>
          <td><strong>${esc(r.name)}</strong></td>
          <td>${r.revenue}</td>
          <td><span class="${r.completion < 80 ? 'text-alert' : ''}">${r.completion}%</span></td>
          <td>${r.netAdd.toLocaleString()}</td>
          <td><span class="${r.churn >= 5 ? 'text-alert' : ''}">${r.churn}%</span></td>
          <td>${r.arpu}</td>
          <td>${r.alert ? '<span class="badge badge-danger">需关注</span>' : '<span class="badge badge-success">正常</span>'}</td>
        </tr>`).join('')}
      </tbody></table>`;
    el.querySelectorAll('[data-drill-city]').forEach(tr => {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        const c = OverviewDashboardData.CITIES.find(x => x.id === tr.dataset.drillCity);
        region = { level: 'city', cityId: c.id, cityName: c.name };
        syncRegionSelect();
        render();
      });
    });
  }

  function renderChannel(d) {
    const ch = d.channel;
    const panel = document.getElementById('ov-panel-channel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="ov-metric-grid-2">
        ${metricBlock('各渠道新增客户占比', hBarChart(ch.newShare))}
        ${metricBlock('渠道转化漏斗', `<p class="ov-metric-desc">办理成功 ÷ 触达</p>${funnel(ch.funnel)}`)}
        ${metricBlock('线上渠道办理占比', `
          <div class="ov-metric-num xl">${ch.onlineRate}<small>%</small></div>
          <div class="ov-progress"><div class="ov-progress-bar online" style="width:${ch.onlineRate}%"></div></div>`)}
        ${metricBlock('营业厅产能 TOP5', `
          <p class="ov-metric-desc">当月业务办理笔数</p>
          ${hBarChart(ch.hallRank.map(c => ({ name: c.name, value: c.value, unit: c.unit || '笔' })))}`)}
        ${metricBlock('人均产能（笔/人）', `
          <div class="ov-metric-row-3">
            <div><span class="muted">营业厅</span><strong>${ch.perCapita.hall}</strong></div>
            <div><span class="muted">线上</span><strong>${ch.perCapita.online}</strong></div>
            <div><span class="muted">社会</span><strong>${ch.perCapita.social}</strong></div>
          </div>`)}
      </div>`;
    bindChartTips(panel);
  }

  function renderCampaign(d) {
    const cp = d.campaign;
    const panel = document.getElementById('ov-panel-campaign');
    if (!panel) return;
    panel.innerHTML = `
      <div class="ov-campaign-top">
        <div class="ov-metric-block">
          <h4 class="ov-metric-title">重点活动参与客户数</h4>
          <div class="ov-metric-num">${cp.participants.toLocaleString()}<small>人</small></div>
          ${arrowTrend('日环比', cp.dayMom, cp.dayMomUp)}
        </div>
        <div class="ov-metric-block">
          <h4 class="ov-metric-title">活动转化率</h4>
          <div class="ov-metric-num">${cp.convertRate}<small>%</small></div>
          <div class="ov-progress"><div class="ov-progress-bar" style="width:${cp.convertRate}%"></div></div>
        </div>
        <div class="ov-metric-block">
          <h4 class="ov-metric-title">活动 ROI</h4>
          <div class="ov-metric-num">${cp.roi}<small>%</small></div>
          <span class="ov-roi-badge">${cp.roiGrade} 级</span>
          <p class="ov-metric-desc">预算执行 ${cp.budgetUsed}%</p>
        </div>
      </div>
      <h4 class="ov-sub-title">在营重点活动</h4>
      <div class="ov-act-list">${cp.activities.map(a => `
        <div class="ov-act-row ${a.alert ? 'is-alert' : ''}">
          <div><strong>${esc(a.name)}</strong><span class="muted"> · ${esc(a.scale)} · ${esc(a.status)}</span></div>
          <div class="ov-act-progress"><div style="width:${a.progress}%"></div></div>
          <span>${a.progress}%</span>
        </div>`).join('')}</div>`;
    bindChartTips(panel);
  }

  function renderAlerts(d) {
    const el = document.getElementById('ov-bottom-alerts');
    if (!el) return;
    el.innerHTML = d.alerts.map(a => `
      <a href="${esc(a.link)}" class="ov-bottom-alert ${a.type}"><i class="fas fa-circle-exclamation"></i>${esc(a.text)}</a>
    `).join('');
  }

  function set(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function syncRegionSelect() {
    const citySel = document.getElementById('ov-city-select');
    const countySel = document.getElementById('ov-county-select');
    if (!citySel) return;
    if (region.level === 'province') {
      citySel.value = '';
      if (countySel) { countySel.value = ''; countySel.disabled = true; }
    } else if (region.level === 'city') {
      citySel.value = region.cityId || '';
      fillCounties(region.cityId);
      if (countySel) countySel.disabled = false;
    } else if (region.level === 'county') {
      citySel.value = region.cityId || '';
      fillCounties(region.cityId);
      if (countySel) {
        countySel.disabled = false;
        countySel.value = region.countyName || '';
      }
    }
  }

  function fillCounties(cityId) {
    const countySel = document.getElementById('ov-county-select');
    if (!countySel) return;
    const list = OverviewDashboardData.COUNTIES[cityId] || [];
    countySel.innerHTML = '<option value="">选择区县</option>' +
      list.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }

  function openDrill(metricKey) {
    drillMetric = metricKey;
    const modal = document.getElementById('ov-drill-modal');
    const body = document.getElementById('ov-drill-body');
    const crumbs = document.getElementById('ov-drill-crumbs');
    if (!modal || !body) return;

    const rows = OverviewDashboardData.getDrillRows(metricKey, region);
    const meta = rows[0] || {};

    if (crumbs) {
      const parts = [{ level: 'province', label: '江西省' }];
      if (region.level === 'city' || region.level === 'county') {
        parts.push({ level: 'city', label: region.cityName, cityId: region.cityId });
      }
      if (region.level === 'county') {
        parts.push({ level: 'county', label: region.countyName });
      }
      crumbs.innerHTML = parts.map((p, i) =>
        `${i ? '<span class="sep">›</span>' : ''}<button type="button" class="ov-crumb" data-level="${p.level}" ${p.cityId ? `data-city="${p.cityId}"` : ''}>${esc(p.label)}</button>`
      ).join('');
      crumbs.querySelectorAll('.ov-crumb').forEach(btn => {
        btn.addEventListener('click', () => {
          const lv = btn.dataset.level;
          if (lv === 'province') region = { level: 'province' };
          else if (lv === 'city') region = { level: 'city', cityId: btn.dataset.city, cityName: btn.textContent };
          syncRegionSelect();
          render();
          openDrill(drillMetric);
        });
      });
    }

    document.getElementById('ov-drill-title').textContent =
      `指标下钻 · ${meta.label || metricKey}（${OverviewDashboardData.getRegionLabel(region)}）`;

    body.innerHTML = `<table class="data-table ov-drill-table">
      <thead><tr><th>区域</th><th>${esc(meta.label || '数值')}</th><th>操作</th></tr></thead>
      <tbody>${rows.map(r => {
        const canDrill = region.level === 'province' && r.drillTo === 'city';
        const canCounty = region.level === 'city' && r.drillTo === 'county';
        const action = canDrill
          ? `<button type="button" class="btn-link" data-go-city="${esc(r.id)}">下钻地市</button>`
          : canCounty
            ? `<button type="button" class="btn-link" data-go-county="${esc(r.name)}">下钻区县</button>`
            : '<span class="muted">—</span>';
        return `<tr>
          <td><strong>${esc(r.name)}</strong></td>
          <td>${r.value}${esc(r.unit || '')}</td>
          <td>${action}</td>
        </tr>`;
      }).join('')}
      </tbody></table>`;

    body.querySelectorAll('[data-go-city]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = OverviewDashboardData.CITIES.find(x => x.id === btn.dataset.goCity);
        region = { level: 'city', cityId: c.id, cityName: c.name };
        syncRegionSelect();
        render();
        openDrill(drillMetric);
      });
    });
    body.querySelectorAll('[data-go-county]').forEach(btn => {
      btn.addEventListener('click', () => {
        region = { ...region, level: 'county', countyName: btn.dataset.goCounty };
        syncRegionSelect();
        render();
        openDrill(drillMetric);
      });
    });

    modal.classList.add('show');
  }

  function render() {
    const d = OverviewDashboardData.build(period, region);
    const hint = document.getElementById('ov-period-label');
    if (hint) {
      hint.textContent = `统计周期：${OverviewDashboardData.PERIOD[period]?.label || '月'} · ${OverviewDashboardData.getRegionLabel(region)}`;
    }
    renderCore(d);
    if (window.OverviewConfigRender) {
      OverviewConfigRender.renderPageSections('overview.html', 'ov-config-modules-root', {
        period,
        renderOptions: { showDispatch: false }
      });
    }
    renderMini(d);
    renderUser(d);
    renderValueOps(d);
    renderCityBoard(d);
    renderChannel(d);
    renderCampaign(d);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('ov-dashboard')) return;

    const citySel = document.getElementById('ov-city-select');
    if (citySel) {
      citySel.innerHTML = '<option value="">全省</option>' +
        OverviewDashboardData.CITIES.map(c => `<option value="${c.id}">${c.name}市</option>`).join('');
      citySel.addEventListener('change', () => {
        const id = citySel.value;
        if (!id) {
          region = { level: 'province' };
          document.getElementById('ov-county-select').disabled = true;
        } else {
          const name = citySel.options[citySel.selectedIndex].text.replace('市', '');
          region = { level: 'city', cityId: id, cityName: name };
          fillCounties(id);
          document.getElementById('ov-county-select').disabled = false;
        }
        render();
      });
    }

    document.getElementById('ov-county-select')?.addEventListener('change', e => {
      const name = e.target.value;
      if (!name || region.level !== 'city') return;
      region = { ...region, level: 'county', countyName: name };
      render();
    });

    document.querySelectorAll('#ov-period-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        period = btn.dataset.period;
        document.querySelectorAll('#ov-period-tabs button').forEach(b => {
          b.classList.toggle('active', b.dataset.period === period);
        });
        render();
      });
    });

    document.querySelectorAll('[data-close-modal="ov-drill-modal"]').forEach(btn => {
      btn.addEventListener('click', () => document.getElementById('ov-drill-modal')?.classList.remove('show'));
    });

    render();
  });
})();
