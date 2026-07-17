/** 根因分析报告 iframe 渲染 */
(function () {
  const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#319795', '#dd6b20', '#d53f8c'];
  const chartInstances = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function momClass(mom) {
    const s = String(mom || '');
    return /^[-−]/.test(s) ? 'neg' : 'pos';
  }

  function loadReportPayload() {
    try {
      const raw = sessionStorage.getItem('rcaReportPayload');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function initChart(domId, option) {
    const dom = document.getElementById(domId);
    if (!dom || !window.echarts) return null;
    const chart = echarts.init(dom);
    chart.setOption(option);
    chartInstances.push(chart);
    return chart;
  }

  function renderMetricTable(rows, emptyText) {
    if (!rows?.length) return `<p class="muted">${esc(emptyText)}</p>`;
    const hasAlertCols = rows.some(r => r.prevValue != null || r.currValue != null || r.changeRate != null);
    if (hasAlertCols) {
      return `<table class="data-table"><thead><tr>
        <th>指标名称</th><th>上月值</th><th>当月值</th><th>变化率</th>
      </tr></thead><tbody>${
        rows.map(r => `<tr>
          <td>${esc(r.name)}</td>
          <td>${esc(r.prevValue)}</td>
          <td>${esc(r.currValue)}</td>
          <td class="${momClass(r.changeRate)}">${esc(r.changeRate)}</td>
        </tr>`).join('')
      }</tbody></table>`;
    }
    return `<table class="data-table"><thead><tr><th>指标名称</th><th>指标值</th><th>环比</th></tr></thead><tbody>${
      rows.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.value)}</td><td class="${momClass(r.mom)}">${esc(r.mom)}</td></tr>`).join('')
    }</tbody></table>`;
  }

  function renderBadMetricTable(rows, emptyText) {
    if (!rows?.length) return `<p class="muted">${esc(emptyText)}</p>`;
    return `<table class="data-table"><thead><tr>
      <th style="width:18%">指标名称</th>
      <th style="width:12%">指标值</th>
      <th style="width:12%">环比</th>
      <th>说明</th>
    </tr></thead><tbody>${
      rows.map(r => `<tr>
        <td>${esc(r.name)}</td>
        <td>${esc(r.value)}</td>
        <td class="${momClass(r.mom)}">${esc(r.mom)}</td>
        <td class="metric-reason-cell">${esc(r.reason || '—')}</td>
      </tr>`).join('')
    }</tbody></table>`;
  }

  function renderBranchPills(branches) {
    if (!branches?.length) return '';
    return `<div class="branch-pills">${branches.map(b => {
      const momText = b.displayMom || b.mom || '—';
      const cls = momClass(momText);
      return `<div class="branch-pill">
        <div class="branch-pill-name">${esc(b.name)}</div>
        <div class="branch-pill-metrics">
          <span class="branch-pill-value">${esc(b.value)}</span>
          <span class="branch-pill-divider"></span>
          <span class="branch-pill-mom mom-${cls === 'neg' ? 'neg' : 'pos'}">环比 ${esc(momText)}</span>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderMainlineSection(ml) {
    const badBlock = ml.badMetrics?.length
      ? `<h4 class="mainline-subhead">主要发展异常指标</h4>${renderBadMetricTable(ml.badMetrics, '暂无发展异常指标')}`
      : '';
    const goodBlock = ml.goodMetrics?.length
      ? `<h4 class="mainline-subhead">主要趋势向好指标</h4>${renderMetricTable(ml.goodMetrics, '暂无趋势向好指标')}`
      : '';
    const summaryBlock = ml.summaries?.length
      ? `<h4 class="mainline-subhead">${esc(ml.shortName || '')}版块小结</h4><ol class="mainline-summary">${ml.summaries.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`
      : '';
    return `
      <article class="mainline-card">
        <h3 class="mainline-title">${esc(ml.title)}</h3>
        ${renderBranchPills(ml.branches)}
        ${badBlock}
        ${goodBlock}
        ${summaryBlock}
      </article>`;
  }

  function renderActions(actions) {
    return `<div class="action-grid">${(actions || []).map((a, i) => `
      <div class="action-card">
        <h4>${i + 1}、${esc(a.title)}</h4>
        <div class="action-kv"><strong>影响问题：</strong>${esc(a.problem)}</div>
        <div class="action-kv"><strong>目标客群：</strong>${esc(a.audience)}</div>
        <div class="action-kv"><strong>运营动作：</strong>${esc(a.action)}</div>
        <div class="action-kv"><strong>预期改善：</strong>${esc(a.expected)}</div>
      </div>`).join('')}</div>`;
  }

  function renderCausalChains(chains) {
    if (!chains?.length) return '';
    return `<div class="chain-grid">${chains.map(c => `
      <div class="chain-section">
        <h3>${esc(c.title)}</h3>
        <div class="chain-flow">${(c.chain || []).map((n, i) =>
          `${i ? '<span class="chain-arrow">→</span>' : ''}<span class="chain-node">${esc(n)}</span>`
        ).join('')}</div>
        <p class="chain-summary">${esc(c.summary)}</p>
      </div>`).join('')}</div>`;
  }

  function getBackUrl() {
    try {
      return sessionStorage.getItem('rcaReportBackUrl') || 'indicator-insight.html';
    } catch (e) {
      return 'indicator-insight.html';
    }
  }

  function buildScaleChartOption(categories, chart) {
    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: [chart.barName],
        bottom: 4,
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#64748b' }
      },
      grid: { left: 48, right: 18, top: 28, bottom: 72 },
      xAxis: { type: 'category', data: categories, axisLabel: { rotate: 35, fontSize: 10 } },
      yAxis: {
        type: 'value',
        name: chart.barUnit || '万G',
        axisLabel: { fontSize: 11 },
        nameTextStyle: { fontSize: 11, color: '#64748b' }
      },
      series: [{
        name: chart.barName,
        type: 'bar',
        data: chart.values || [],
        itemStyle: { color: '#3182ce' },
        barMaxWidth: 22,
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          color: '#334155',
          formatter: function (p) { return p.value; }
        }
      }]
    };
  }

  function buildDualMetricChartOption(categories, chart, colors) {
    const barColor = colors?.bar || '#3182ce';
    const lineColor = colors?.line || '#e53e3e';
    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: [chart.barName, chart.lineName],
        bottom: 4,
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#64748b' }
      },
      grid: { left: 48, right: 48, top: 28, bottom: 72 },
      xAxis: { type: 'category', data: categories, axisLabel: { rotate: 35, fontSize: 10 } },
      yAxis: [
        {
          type: 'value',
          name: chart.barUnit || '指标值',
          position: 'left',
          axisLabel: { fontSize: 11 },
          nameTextStyle: { fontSize: 11, color: '#64748b' },
          splitLine: { lineStyle: { color: '#e2e8f0' } }
        },
        {
          type: 'value',
          name: '增幅(%)',
          position: 'right',
          axisLabel: { fontSize: 11, formatter: '{value}%' },
          nameTextStyle: { fontSize: 11, color: '#64748b' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: chart.barName,
          type: 'bar',
          yAxisIndex: 0,
          data: chart.values || [],
          itemStyle: { color: barColor },
          barMaxWidth: 20,
          label: {
            show: true,
            position: 'top',
            fontSize: 9,
            color: '#334155',
            formatter: function (p) { return p.value; }
          }
        },
        {
          name: chart.lineName,
          type: 'line',
          yAxisIndex: 1,
          data: chart.rates || [],
          smooth: false,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2, color: lineColor },
          itemStyle: { color: lineColor },
          label: {
            show: true,
            position: 'top',
            fontSize: 9,
            color: lineColor,
            formatter: function (p) { return p.value + '%'; }
          },
          z: 3
        }
      ]
    };
  }

  function buildAlertBarOption(data) {
    const names = data.map(d => d.name);
    const values = data.map(d => d.value);
    return {
      tooltip: {
        trigger: 'axis',
        formatter: function (p) {
          const i = p[0]?.dataIndex;
          const item = data[i];
          return item ? `${item.fullName}<br/>变化率：${item.changeRate || values[i]}` : '';
        }
      },
      grid: { left: 120, right: 30, top: 20, bottom: 20 },
      xAxis: { type: 'value', name: '|变化率|', axisLabel: { fontSize: 11 } },
      yAxis: { type: 'category', data: names.slice().reverse(), axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar',
        data: values.slice().reverse(),
        itemStyle: { color: '#e53e3e', borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 22
      }]
    };
  }

  function buildBranchOption(data, title) {
    return {
      title: { text: title, left: 'center', textStyle: { fontSize: 12, color: '#475569' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', name: '环比波动(pp/%)', axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: {
          color: function (p) { return COLORS[p.dataIndex % COLORS.length]; },
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 36
      }]
    };
  }

  function renderTrafficFlowReport(report) {
    const root = document.getElementById('report-root');
    if (!root) return;
    const ov = report.overview || {};
    const backUrl = getBackUrl();
    const causalHtml = renderCausalChains(report.causalBranches);
    const hasCausal = !!causalHtml;
    root.innerHTML = `
      <div class="report-page-bar">
        <a class="report-back-btn" href="${esc(backUrl)}"><i class="fas fa-arrow-left"></i> 返回指标树</a>
        <div class="report-page-bar-meta">
          <span>${esc(report.subtitle || '')}</span>
          <span>${esc(report.period || '')}</span>
        </div>
        <div class="report-page-bar-actions">
          <button type="button" class="report-print-btn" onclick="window.print()"><i class="fas fa-print"></i> 打印</button>
        </div>
      </div>

      <header class="report-header">
        <h1>${esc(report.title)}</h1>
        <div class="subtitle">${esc(report.subtitle)} · ${esc(report.period)}</div>
        <div class="meta">
          <span>生成时间：${esc(report.generatedAt)}</span>
          <span>异动指标：${esc(ov.alertCount)} 项</span>
        </div>
      </header>

      <section class="card" id="sec-overview">
        <h2>一、整体情况</h2>
        <p>${esc(ov.intro)}</p>
        <p>${esc(ov.trend)}</p>
        <div class="metrics-grid">
          ${(ov.kpiCards || []).map(k => `
            <div class="metric-card${/收入/.test(k.label) && /-/.test(k.sub) ? ' alert' : ''}">
              <div class="metric-value">${esc(k.value)}</div>
              <div class="metric-label">${esc(k.label)}</div>
              <div class="metric-sub">${esc(k.sub)}</div>
            </div>`).join('')}
        </div>
        <h3>地市情况</h3>
        <div class="rca-city-charts-row">
          <div class="rca-city-chart-panel">
            <div class="rca-city-chart-title">${esc((report.cityCharts && report.cityCharts.scaleChart && report.cityCharts.scaleChart.title) || '流量规模')}</div>
            <div id="chart-city-scale" class="echarts-box echarts-box-inline"></div>
          </div>
          <div class="rca-city-chart-panel">
            <div class="rca-city-chart-title">${esc((report.cityCharts && report.cityCharts.flowGrowthChart && report.cityCharts.flowGrowthChart.title) || '流量增量 / 流量增幅')}</div>
            <div id="chart-city-flow" class="echarts-box echarts-box-inline"></div>
          </div>
          <div class="rca-city-chart-panel">
            <div class="rca-city-chart-title">${esc((report.cityCharts && report.cityCharts.revenueChart && report.cityCharts.revenueChart.title) || '流量收入 / 流量收入增幅')}</div>
            <div id="chart-city-revenue" class="echarts-box echarts-box-inline"></div>
          </div>
        </div>
        <h3>指标树异动概况</h3>
        <p>影响整个指标树的发展异动指标共 <strong>${esc(ov.alertCount)}</strong> 项，按变化率取 TOP5：</p>
        ${renderMetricTable(ov.topAlerts, '暂无异动指标')}
      </section>

      <section class="card" id="sec-mainline">
        <h2>二、运营主线</h2>
        <div class="mainline-grid">
          ${(report.mainlines || []).map(ml => renderMainlineSection(ml)).join('')}
        </div>
      </section>

      ${hasCausal ? `<section class="card" id="sec-causal">
        <h2>关键传导链路</h2>
        ${causalHtml}
      </section>` : ''}

      <section class="card" id="sec-actions">
        <h2>三、建议行动</h2>
        ${renderActions(report.actions)}
      </section>

      <div class="report-footer">
        <p>本报告由智能根因分析系统自动生成 — ${esc(report.generatedAt)}</p>
      </div>`;

    const cityCharts = report.cityCharts || {};
    const cats = cityCharts.categories || [];
    if (cityCharts.scaleChart) {
      initChart('chart-city-scale', buildScaleChartOption(cats, cityCharts.scaleChart));
    }
    if (cityCharts.flowGrowthChart) {
      initChart('chart-city-flow', buildDualMetricChartOption(cats, cityCharts.flowGrowthChart, {
        bar: '#38a169',
        line: '#0d9488'
      }));
    }
    if (cityCharts.revenueChart) {
      initChart('chart-city-revenue', buildDualMetricChartOption(cats, cityCharts.revenueChart, {
        bar: '#6366f1',
        line: '#e53e3e'
      }));
    }
  }

  function renderLegacyFallback(report) {
    const root = document.getElementById('report-root');
    if (!root) return;
    const backUrl = getBackUrl();
    root.innerHTML = `
      <div class="report-page-bar">
        <a class="report-back-btn" href="${esc(backUrl)}"><i class="fas fa-arrow-left"></i> 返回</a>
      </div>
      <header class="report-header">
        <h1>${esc(report?.title || '根因分析报告')}</h1>
        <div class="meta"><span>${esc(report?.generatedAt || '—')}</span></div>
      </header>
      <section class="card">
        <h2>分析报告</h2>
        <p>${esc(report?.summary || '暂无报告内容，请从指标树重新打开根因分析报告。')}</p>
      </section>`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    let report = loadReportPayload();
    if (!report && params.get('metric')) {
      report = {
        title: '根因分析报告',
        subtitle: params.get('metric'),
        generatedAt: params.get('generatedAt') || '—',
        summary: `针对「${params.get('metric')}」的异常根因分析。`
      };
    }
    if (!report) {
      document.getElementById('report-loading').textContent = '未找到报告数据，请从指标树重新打开。';
      return;
    }
    if (report.template === 'traffic-flow-v12') {
      renderTrafficFlowReport(report);
    } else {
      renderLegacyFallback(report);
    }
    window.addEventListener('resize', () => chartInstances.forEach(c => c.resize()));
  });
})();
