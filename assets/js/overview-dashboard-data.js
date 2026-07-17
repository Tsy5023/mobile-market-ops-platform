/** 江西移动省公司市场部 · 领导视角指标数据 */
(function () {
  const CITIES = [
    { id: 'nc', name: '南昌' }, { id: 'gz', name: '赣州' }, { id: 'jj', name: '九江' },
    { id: 'sr', name: '上饶' }, { id: 'yc', name: '宜春' }, { id: 'ja', name: '吉安' },
    { id: 'fz', name: '抚州' }, { id: 'jdz', name: '景德镇' }, { id: 'px', name: '萍乡' },
    { id: 'xy', name: '新余' }, { id: 'yt', name: '鹰潭' }
  ];

  const COUNTIES = {
    nc: ['东湖区', '西湖区', '青山湖区', '红谷滩区'],
    gz: ['章贡区', '南康区', '赣县区'],
    jj: ['浔阳区', '濂溪区', '柴桑区'],
    sr: ['信州区', '广丰区'],
    yc: ['袁州区', '樟树市']
  };

  const PERIOD = {
    day: { label: '日', scale: 0.034 },
    week: { label: '周', scale: 0.24 },
    month: { label: '月', scale: 1 },
    quarter: { label: '季度', scale: 2.85 }
  };

  function hash(id, n) {
    let h = 0;
    const s = String(id);
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h) % n;
  }

  function cityValues(seed, base, spread, unit) {
    return CITIES.map((c, i) => ({
      id: c.id,
      name: c.name,
      value: Math.round(base * (0.48 + ((seed + i * 13) % spread) / 100) * 10) / 10,
      unit: unit || ''
    })).sort((a, b) => b.value - a.value);
  }

  function countyValues(cityId, base, unit) {
    const names = COUNTIES[cityId] || ['主城区', '开发区', '县域'];
    return names.map((name, i) => ({
      name,
      value: Math.round(base * (0.22 + i * 0.2) * 10) / 10,
      unit: unit || ''
    }));
  }

  function cityScoreboard() {
    return CITIES.map((c, i) => {
      const completion = 72 + (hash(c.id, 28) % 22);
      const churn = (3.6 + (hash(c.id, 12) / 10)).toFixed(1);
      const netAdd = 2800 + hash(c.id, 4000);
      const alert = completion < 80 || parseFloat(churn) >= 5;
      return {
        id: c.id,
        name: c.name,
        revenue: (2.2 + (hash(c.id, 25) / 10)).toFixed(1),
        completion,
        netAdd,
        churn: parseFloat(churn),
        arpu: (84 + (hash(c.id, 8) / 2)).toFixed(1),
        alert
      };
    }).sort((a, b) => b.completion - a.completion);
  }

  window.OverviewDashboardData = {
    CITIES,
    COUNTIES,
    PERIOD,

    getRegionLabel(region) {
      if (region?.level === 'county') return region.countyName;
      if (region?.level === 'city') return region.cityName;
      return '江西省';
    },

    build(period, region) {
      const sc = (PERIOD[period] || PERIOD.month).scale;
      const isProvince = !region || region.level === 'province';
      const cityFactor = region?.level === 'city' ? 0.22 : region?.level === 'county' ? 0.06 : 1;

      const revenueTarget = Math.round(32 * sc * cityFactor * 100) / 100;
      const completionPct = isProvince && period === 'month' ? 78.6 : 88.5;
      const revenue = Math.round(revenueTarget * (completionPct / 100) * 100) / 100;
      const netAdd = Math.round(42800 * sc * cityFactor);
      const churnRate = region?.level === 'city' && region.cityId === 'jj' ? 5.1 : 4.2;

      return {
        period,
        region,
        core: [
          {
            key: 'revenue',
            label: '当月累计运营收入',
            value: revenue,
            unit: '亿元',
            yoy: '+5.2%',
            mom: '+1.8%',
            yoyUp: true,
            momUp: true,
            drillKey: 'revenue',
            alert: false
          },
          {
            key: 'completion',
            label: '收入目标完成率',
            value: completionPct,
            unit: '%',
            sub: `目标 ${revenueTarget} 亿 · 实际 ${revenue} 亿`,
            progress: completionPct,
            drillKey: 'revenue',
            alert: completionPct < 80
          },
          {
            key: 'netAdd',
            label: '当月净增客户数',
            value: netAdd,
            unit: '户',
            yoy: '+3.6%',
            yoyUp: true,
            drillKey: 'newCust',
            alert: false
          },
          {
            key: 'arpu',
            label: '客户 ARPU',
            value: (86.4 + (region?.level === 'city' ? 2 : 0)).toFixed(1),
            unit: '元',
            trend: [82.1, 83.2, 84.0, 85.1, 85.9, 86.4],
            drillKey: 'arpu',
            alert: false
          },
          {
            key: 'heScale',
            label: '中高端客户规模',
            value: (428.6 * cityFactor).toFixed(1),
            unit: '万户',
            yoy: '+2.1%',
            yoyUp: true,
            drillKey: 'heScale',
            alert: false
          },
          {
            key: 'fusionAdd',
            label: '融合客户净增',
            value: Math.round(18600 * sc * cityFactor),
            unit: '户',
            mom: '+4.8%',
            momUp: true,
            drillKey: 'fusion',
            alert: false
          }
        ],
        mini: [
          { label: '新增客户', value: Math.round(68200 * sc * cityFactor), unit: '户', drillKey: 'newCust' },
          { label: '离网率', value: churnRate + '%', alert: churnRate >= 5, drillKey: 'churn' },
          { label: '维系成功率', value: '34.2%', unit: '', up: true },
          { label: '5G 渗透率', value: '62.4%', drillKey: 'g5' },
          { label: '流量收入占比', value: '41.2%', drillKey: 'trafficRev' },
          { label: '携出预警客户', value: Math.round(12800 * cityFactor), unit: '户', alert: true, drillKey: 'portOut' },
          { label: '降档办理量', value: Math.round(8420 * sc * cityFactor), unit: '笔', alert: true },
          { label: '活动 ROI', value: '142%', grade: 'A' }
        ],
        user: {
          newCustomers: { value: Math.round(68200 * sc * cityFactor), rank: cityValues(1, 6200 * sc, 50, '户') },
          portIn: { value: Math.round(15600 * sc * cityFactor), unit: '户' },
          portOut: { value: Math.round(12800 * sc * cityFactor), unit: '户', alert: true, drillKey: 'portOut' },
          churnRate: { value: churnRate, threshold: 5, series: [3.7, 3.9, 4.0, 4.2, 4.8, churnRate], alert: churnRate >= 5, drillKey: 'churn' },
          retainRate: { value: 34.2, target: 32, series: [30.1, 31.2, 32.5, 33.0, 33.8, 34.2] },
          heNetAdd: { value: Math.round(8200 * sc * cityFactor), unit: '户' },
          activeRate: { parts: [{ label: '活跃', pct: 78.6, color: '#22c55e' }, { label: '沉默', pct: 21.4, color: '#e2e8f0' }] },
          g5Penetration: { value: 62.4, cities: cityValues(5, 62, 35, '%') },
          contractExpire: { value: Math.round(24600 * cityFactor), unit: '户', drillKey: 'contract' }
        },
        valueOps: {
          revenueMix: [
            { label: '流量相关', pct: 41.2, color: '#3b82f6' },
            { label: '语音', pct: 18.5, color: '#8b5cf6' },
            { label: '增值/家庭', pct: 28.3, color: '#14b8a6' },
            { label: '其他', pct: 12.0, color: '#cbd5e1' }
          ],
          trafficRevShare: { value: 41.2, mom: '+0.8pp', momUp: true, drillKey: 'trafficRev' },
          outPackageRev: { value: (3.8 * sc * cityFactor).toFixed(1), unit: '亿元', mom: '-2.4%', momUp: false, alert: true },
          familyFusion: { value: 58.6, target: 65, drillKey: 'fusion' },
          upgrade5g: { value: 12.8, mom: '+1.2pp', momUp: true },
          downgrade: { value: Math.round(8420 * sc * cityFactor), unit: '笔', alert: true, cities: cityValues(9, 800, 40, '笔') },
          digitalRevShare: { value: 36.4, trend: [32, 33.5, 34.2, 35.1, 35.8, 36.4] }
        },
        channel: {
          newShare: [
            { name: '营业厅', pct: 38, color: '#3b82f6' },
            { name: '线上', pct: 28, color: '#8b5cf6' },
            { name: '社会渠道', pct: 24, color: '#14b8a6' },
            { name: '政企', pct: 10, color: '#94a3b8' }
          ],
          funnel: [
            { stage: '触达客户', count: Math.round(128000 * cityFactor) },
            { stage: '意向客户', count: Math.round(45600 * cityFactor) },
            { stage: '办理成功', count: Math.round(18240 * cityFactor) }
          ],
          onlineRate: 46.8,
          hallRank: cityValues(2, 1200, 45, '笔').slice(0, 5),
          perCapita: { hall: 8.2, online: 12.6, social: 6.4, unit: '笔/人' }
        },
        campaign: {
          participants: Math.round(156000 * sc * (cityFactor < 1 ? 0.35 : 1)),
          dayMom: '+2.4%',
          dayMomUp: true,
          convertRate: 18.6,
          roi: 142,
          roiGrade: 'A',
          budgetUsed: 68,
          activities: [
            { name: '中高端离网挽留专项', scale: '4.28万', progress: 86, status: '进行中' },
            { name: '5G 升档有礼', scale: '18.6万', progress: 72, status: '进行中' },
            { name: '融合家庭礼包', scale: '12.4万', progress: 58, status: '进行中' },
            { name: '存量续约补贴', scale: '2.15万', progress: 91, status: '即将结束', alert: true }
          ]
        },
        cityBoard: cityScoreboard(),
        alerts: [
          { type: 'danger', text: '全省收入完成率 78.6% 低于 80% 预警线，序时进度落后', link: 'indicator-insight.html' },
          { type: 'warning', text: '九江离网率 5.1% 超阈值，建议启动专项维系', link: 'indicator-alert.html' },
          { type: 'warning', text: '赣州降档办理量周环比 +15%，需关注价值流失', link: 'indicator-alert.html' },
          { type: 'info', text: '3 场重点活动本周触达未达目标，请督导地市加码', link: 'strategy-recommend.html' }
        ]
      };
    },

    getDrillRows(metricKey, region) {
      const labels = {
        revenue: { name: '运营收入', unit: '亿元', base: 4.2 },
        newCust: { name: '新增客户', unit: '户', base: 8200 },
        churn: { name: '离网率', unit: '%', base: 4.2 },
        arpu: { name: 'ARPU', unit: '元', base: 86 },
        g5: { name: '5G渗透率', unit: '%', base: 62 },
        heScale: { name: '中高端规模', unit: '万户', base: 42 },
        fusion: { name: '融合净增', unit: '户', base: 1800 },
        trafficRev: { name: '流量收入占比', unit: '%', base: 41 },
        portOut: { name: '携出预警', unit: '户', base: 1200 },
        contract: { name: '合约到期', unit: '户', base: 2400 }
      };
      const meta = labels[metricKey] || labels.revenue;

      if (region.level === 'county' && region.cityId) {
        return countyValues(region.cityId, meta.base, meta.unit).map(r => ({
          ...r, label: meta.name, unit: meta.unit
        }));
      }
      if (region.level === 'city' && region.cityId) {
        return countyValues(region.cityId, meta.base, meta.unit).map(r => ({
          ...r, label: meta.name, unit: meta.unit, drillTo: 'county'
        }));
      }
      const vals = [4.2, 2.8, 3.6, 3.1, 2.5, 2.4, 2.2, 1.8, 1.2, 1.0, 0.9];
      return CITIES.map((c, i) => ({
        id: c.id,
        name: c.name,
        value: metricKey === 'churn' ? (3.5 + hash(c.id, 15) / 10) : vals[i] || meta.base,
        label: meta.name,
        unit: meta.unit,
        drillTo: 'city'
      }));
    }
  };
})();
