/** 策略诊断详情 */
(function () {
  const id = new URLSearchParams(location.search).get('id');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtCount(n) {
    const num = Number(n) || 0;
    return num.toLocaleString('zh-CN');
  }

  function conclusionHtml(item) {
    if (item.conclusion === 'warn') {
      return `<span class="diag-conclusion warn"><i class="fas fa-circle-exclamation icon-warn"></i>${esc(item.conclusionLabel)}</span>`;
    }
    return `<span class="diag-conclusion ok"><span class="dot"></span>${esc(item.conclusionLabel)}</span>`;
  }

  function renderRehearsalFilters(item) {
    if (!item.filters || !item.filters.length) {
      return '<span class="muted">未配置过滤规则</span>';
    }
    return `<table class="portrait-value-table rehearsal-filter-table">
      <thead><tr><th style="width:48px">序号</th><th>过滤规则</th><th style="width:110px">过滤客户数</th><th style="width:110px">剩余客户数</th></tr></thead>
      <tbody>${item.filters.map(f => `
        <tr>
          <td>${f.seq}</td>
          <td>${esc(f.filterName)}</td>
          <td class="text-warn">${fmtCount(f.filteredCount)}</td>
          <td>${fmtCount(f.remainingCount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  function renderRehearsalSummary(item) {
    return `<div class="rehearsal-summary">
      <div><span class="muted">初始客群</span><strong>${fmtCount(item.initialCount)}</strong></div>
      <div><span class="muted">预演后</span><strong>${fmtCount(item.finalCount)}</strong></div>
    </div>`;
  }

  function renderTagValues(tag) {
    if (!tag.values || !tag.values.length) {
      return '<span class="muted">暂无分析数据</span>';
    }
    return `<div class="portrait-tag-block">
      <div class="portrait-tag-title">${esc(tag.tagName)} <span class="muted">(${esc(tag.tagType)})</span></div>
      <table class="portrait-value-table">
        <thead><tr><th>取值</th><th style="width:88px">占比</th><th style="width:110px">客群人数</th></tr></thead>
        <tbody>${tag.values.map(v => `
          <tr>
            <td>${esc(v.label)}</td>
            <td>${esc(v.ratioLabel || (v.ratio + '%'))}</td>
            <td>${fmtCount(v.count)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function renderPortraitCell(item) {
    if (!item.tags || !item.tags.length) {
      return '<span class="muted">未配置分析维度</span>';
    }
    return item.tags.map(renderTagValues).join('');
  }

  function renderPortraitDimension(item) {
    if (!item.tags || !item.tags.length) return '—';
    return item.tags.map(t => esc(t.tagName)).join('、');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const record = window.AgentDiagnosisStore?.getRecord(id);
    if (!record) {
      document.getElementById('diag-header').innerHTML = '<p class="muted">未找到诊断记录</p>';
      return;
    }

    document.getElementById('diag-header').innerHTML = `
      <div class="kv"><label>策略ID</label><strong>${esc(record.strategyCode)}</strong></div>
      <div class="kv"><label>策略名称</label><strong>${esc(record.strategyName)}</strong></div>
      <div class="kv"><label>渠道</label><strong>${esc(record.channel)}</strong></div>
      <div class="kv"><label>诊断时间</label><strong>${esc(record.completedAt)}</strong></div>`;

    const rehearsalItems = record.rehearsalItems && record.rehearsalItems.length
      ? record.rehearsalItems
      : (window.AgentDiagnosisStore.buildRehearsalResults
        ? window.AgentDiagnosisStore.buildRehearsalResults({ scaleNum: 394090 })
        : []);

    const rehearsalTbody = document.getElementById('diag-rehearsal-tbody');
    rehearsalTbody.innerHTML = rehearsalItems.length
      ? rehearsalItems.map(item => `
        <tr>
          <td>${item.seq}</td>
          <td><strong>${esc(item.ruleName)}</strong></td>
          <td class="rehearsal-summary-cell">${renderRehearsalSummary(item)}</td>
          <td class="portrait-result-cell">${renderRehearsalFilters(item)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="muted" style="text-align:center;padding:24px">暂无预演结果</td></tr>';

    const tbody = document.getElementById('diag-items-tbody');
    tbody.innerHTML = (record.items || []).map(item => `
      <tr>
        <td>${item.seq}</td>
        <td><strong>${esc(item.ruleName)}</strong></td>
        <td>${esc(item.checkField)}</td>
        <td>${conclusionHtml(item)}</td>
        <td class="diag-analysis-cell">${esc(item.analysis)}</td>
      </tr>
    `).join('');

    const portraitItems = record.portraitItems && record.portraitItems.length
      ? record.portraitItems
      : (window.AgentDiagnosisStore.buildPortraitResults
        ? window.AgentDiagnosisStore.buildPortraitResults({ scaleNum: 394090 })
        : []);

    const portraitTbody = document.getElementById('diag-portrait-tbody');
    portraitTbody.innerHTML = portraitItems.length
      ? portraitItems.map(item => `
        <tr>
          <td>${item.seq}</td>
          <td><strong>${esc(item.ruleName)}</strong></td>
          <td class="portrait-dim-cell">${renderPortraitDimension(item)}</td>
          <td class="portrait-result-cell">${renderPortraitCell(item)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="muted" style="text-align:center;padding:24px">暂无画像分析结果</td></tr>';
  });
})();
