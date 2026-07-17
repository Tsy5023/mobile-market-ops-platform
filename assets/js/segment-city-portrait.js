/** 客群画像 - 江西省地市维度异动分析弹窗 */
(function () {
  const EXTRA_JX_CITIES = [
    { id: 'jdz', name: '景德镇市' },
    { id: 'px', name: '萍乡市' },
    { id: 'xy', name: '新余市' },
    { id: 'yt', name: '鹰潭市' },
    { id: 'ja', name: '吉安市' },
    { id: 'fz', name: '抚州市' }
  ];

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function getAllJxCities() {
    if (typeof window.getAllJxCities === 'function') return window.getAllJxCities();
    const base = (window.JIANGXI_REGION?.cities || []).map(c => ({ id: c.id, name: c.name }));
    const names = new Set(base.map(c => c.name));
    EXTRA_JX_CITIES.forEach(c => {
      if (!names.has(c.name)) base.push(c);
    });
    const orderMap = window.JX_CITY_ORDER_MAP || {};
    return base.sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
  }

  window.buildSegmentCityPortraitData = function (agg) {
    const cities = getAllJxCities();
    const totalStr = String(agg?.scaleLabel || '12840').replace(/[^\d]/g, '');
    const baseTotal = parseInt(totalStr, 10) || 12840;
    const seed = hashStr(agg?.name || 'seg');

    const rows = cities.map((city, i) => {
      const h = hashStr(city.id + seed);
      const weight = 0.55 + (h % 90) / 100;
      const scale = Math.round((baseTotal / cities.length) * weight * (i < 3 ? 1.35 : 1));
      const momVal = ((h % 100) / 10 - 5.5) + (i < 4 ? -1.2 : 0);
      const mom = (momVal >= 0 ? '+' : '') + momVal.toFixed(1) + '%';
      return {
        cityId: city.id,
        cityName: city.name,
        scale,
        scaleLabel: scale.toLocaleString() + ' 人',
        share: ((scale / baseTotal) * 100).toFixed(1) + '%',
        mom,
        momVal,
        highlight: momVal <= -2.5
      };
    });

    rows.sort((a, b) => a.momVal - b.momVal);
    return rows;
  };

  function renderCityBars(rows) {
    const maxScale = Math.max(...rows.map(r => r.scale), 1);
    return rows.map(r => {
      const w = Math.max(8, Math.round((r.scale / maxScale) * 100));
      const barCls = r.highlight ? 'seg-city-bar is-alert' : 'seg-city-bar';
      return `
        <div class="seg-city-bar-row${r.highlight ? ' is-highlight' : ''}">
          <span class="seg-city-name">${r.cityName}</span>
          <div class="seg-city-bar-track"><div class="${barCls}" style="width:${w}%"></div></div>
          <span class="seg-city-scale">${r.scaleLabel}</span>
          <span class="seg-city-mom ${r.momVal < 0 ? 'neg' : 'pos'}">${r.mom}</span>
        </div>`;
    }).join('');
  }

  window.renderSegmentCityPortraitBody = function (agg) {
    const rows = window.buildSegmentCityPortraitData(agg);
    const highlights = rows.filter(r => r.highlight);
    const topCity = highlights[0] || rows[0];

    return `
      <p class="seg-city-intro">
        以<strong>江西省</strong>各地市为分析粒度，对客群「${agg?.name || '—'}」进行地域分布与环比异动扫描。
        当前异动突出地市：<strong class="text-alert">${topCity?.cityName || '—'}</strong>（环比 ${topCity?.mom || '—'}）。
      </p>
      <div class="seg-city-summary">
        <div class="seg-city-stat"><span class="k">覆盖地市</span><span class="v">${rows.length} 个</span></div>
        <div class="seg-city-stat"><span class="k">异动突出</span><span class="v text-alert">${highlights.length} 个</span></div>
        <div class="seg-city-stat"><span class="k">客群规模</span><span class="v">${agg?.scaleLabel || '—'}</span></div>
      </div>
      <div class="seg-city-chart-card">
        <h4><i class="fas fa-chart-bar"></i> 各地市客群规模与环比</h4>
        <div class="seg-city-bars">${renderCityBars(rows)}</div>
      </div>
      <table class="data-table seg-city-table">
        <thead>
          <tr><th>地市</th><th>客群规模</th><th>占比</th><th>环比</th><th>异动</th></tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr class="${r.highlight ? 'row-alert' : ''}">
              <td><strong>${r.cityName}</strong></td>
              <td>${r.scaleLabel}</td>
              <td>${r.share}</td>
              <td><span class="badge ${r.momVal < 0 ? 'badge-danger' : 'badge-success'}">${r.mom}</span></td>
              <td>${r.highlight ? '<span class="badge badge-danger">突出</span>' : '<span class="muted">—</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  };

  window.openSegmentCityPortraitModal = function (agg) {
    const modal = document.getElementById('modal-segment-city-portrait');
    const title = document.getElementById('seg-city-modal-title');
    const body = document.getElementById('seg-city-modal-body');
    if (!modal || !body) return;

    if (title) {
      title.textContent = '客群画像 · 地市维度（江西省）';
    }
    const sub = document.getElementById('seg-city-modal-subtitle');
    if (sub) {
      sub.textContent = agg?.name ? `分析客群：${agg.name}` : '';
    }
    body.innerHTML = window.renderSegmentCityPortraitBody(agg || {});
    if (typeof openModal === 'function') openModal('modal-segment-city-portrait');
  };
})();
