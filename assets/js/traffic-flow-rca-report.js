/** 流量运营指标树根因分析报告（v1.2 结构） */
(function () {
  const CITY_NAMES = (window.JX_CITY_ORDER || ['gz', 'nc', 'sr', 'yc', 'jj', 'ja', 'fz', 'jdz', 'px', 'xy', 'yt'])
    .map(id => window.JIANGXI_REGION?.cities?.find(c => c.id === id)?.name)
    .filter(Boolean);
  const FALLBACK_CITIES = ['南昌市', '赣州市', '九江市', '上饶市', '宜春市', '吉安市', '抚州市', '景德镇市', '萍乡市', '新余市', '鹰潭市'];

  function hash(s) {
    let h = 0;
    for (let i = 0; i < String(s || '').length; i++) h = ((h << 5) - h) + String(s).charCodeAt(i);
    return Math.abs(h);
  }

  function findNode(root, name) {
    if (!root) return null;
    if (root.name === name) return root;
    for (const c of root.children || []) {
      const f = findNode(c, name);
      if (f) return f;
    }
    return null;
  }

  function findSubtree(root, idOrName) {
    if (!root) return null;
    if (root.id === idOrName || root.name === idOrName) return root;
    for (const c of root.children || []) {
      const f = findSubtree(c, idOrName);
      if (f) return f;
    }
    return null;
  }

  function walkMetrics(node, list) {
    if (!node) return;
    if (node.type !== 'category') {
      list.push({
        id: node.id,
        name: node.name,
        value: node.value || '—',
        mom: node.mom || '—',
        yoy: node.yoy || '—',
        alert: node.alert === true || node.status === 'alert'
      });
    }
    (node.children || []).forEach(c => walkMetrics(c, list));
  }

  function parseMomNum(mom) {
    const s = String(mom || '').replace(/[−—]/g, '-').replace(/pp/g, '').replace(/%/g, '').replace(/\+/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function isMigrationGood(name) {
    return /迁出|迁转|迁网|换机/.test(name || '');
  }

  function isPositiveTrend(metric) {
    const momN = parseMomNum(metric.mom);
    if (isMigrationGood(metric.name)) return momN > 0;
    return momN > 0;
  }

  function isNegativeTrend(metric) {
    if (!metric.alert) return false;
    return !isPositiveTrend(metric);
  }

  function isGoodTrendMetric(metric) {
    if (!isPositiveTrend(metric)) return false;
    if (!metric.alert) return true;
    return isMigrationGood(metric.name);
  }

  function metricSnapshot(node) {
    if (!node) return null;
    const value = node.value || '—';
    const mom = node.mom || '—';
    return {
      name: node.name,
      value,
      mom,
      displayMom: formatBranchMom(value, mom),
      alert: node.alert === true || node.status === 'alert'
    };
  }

  /** 百分比指标：环比按「本期 − 上期」的百分点（pp）展示 */
  function formatBranchMom(value, mom) {
    const rawMom = String(mom || '—');
    if (!rawMom || rawMom === '—') return '—';

    const isPctValue = /%/.test(String(value || '')) && !/pp/i.test(String(value || ''));
    if (!isPctValue) return rawMom;

    const cur = parseValueNum(value);
    const momN = parseMomNum(rawMom);
    if (isNaN(momN)) return rawMom;

    let pp = momN;
    if (/pp/i.test(rawMom)) {
      pp = momN;
    } else if (!isNaN(cur)) {
      // 上期 = 本期 − 环比百分点；演示数据中 mom 数值即该差值
      const prev = cur - momN;
      pp = +(cur - prev).toFixed(2);
    }

    const sign = pp > 0 ? '+' : '';
    return `${sign}${Number(pp).toFixed(2)}pp`;
  }

  function pickTop(list, n, pred) {
    return list.filter(pred).slice(0, n);
  }

  function sortByAbsMom(list) {
    return [...list].sort((a, b) => Math.abs(parseMomNum(b.mom)) - Math.abs(parseMomNum(a.mom)));
  }

  function buildReason(metric, branches) {
    const hit = (branches || []).find(b => (b.chainMetrics || []).some(m => m.name === metric.name));
    if (hit?.conductionSummary) return hit.conductionSummary;
    const chain = (branches || []).find(b => b.metric === metric.name);
    if (chain?.conductionSummary) return chain.conductionSummary;
    return `该指标环比${metric.mom}，与所在分支传导链路中上下游指标同向波动，需结合套餐结构、终端迁转与登网使用行为综合研判。`;
  }

  function buildMainlineSection(subtree, config, branches) {
    const metrics = [];
    walkMetrics(subtree, metrics);
    const branchNodes = (config.branchNames || []).map(n => findNode(subtree, n)).filter(Boolean);
    const branchesData = branchNodes.map(metricSnapshot);
    const badPool = sortByAbsMom(metrics.filter(isNegativeTrend));
    const goodPool = sortByAbsMom(metrics.filter(isGoodTrendMetric));
    const badMetrics = pickTop(badPool, 3, () => true).map(m => ({
      ...m,
      reason: buildReason(m, branches)
    }));
    const goodMetrics = pickTop(goodPool, 3, () => true);
    const summaries = config.summaries || [];
    if (!summaries.length && badMetrics.length) {
      summaries.push(
        `${config.shortName}板块共有 ${badMetrics.length} 项发展异常指标，${goodMetrics.length} 项趋势向好指标，异常主要集中在套餐适配与终端迁转环节。`,
        badMetrics[0] ? `「${badMetrics[0].name}」环比 ${badMetrics[0].mom}，${badMetrics[0].reason}` : '',
        goodMetrics[0] ? `「${goodMetrics[0].name}」环比 ${goodMetrics[0].mom}，对板块流量释放形成正向支撑。` : ''
      );
    }
    return {
      title: config.title,
      shortName: config.shortName,
      branches: branchesData,
      badMetrics,
      goodMetrics,
      summaries: summaries.filter(Boolean).slice(0, 3),
      branchChart: branchesData.map(b => ({
        name: (b.name || '').replace(/-流量增幅贡献$/, ''),
        value: Math.max(0.1, Math.abs(parseMomNum(b.mom)))
      }))
    };
  }

  function parseValueNum(value) {
    const s = String(value || '').replace(/,/g, '').replace(/[−—]/g, '-');
    const m = s.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  }

  function valueSuffix(value) {
    const s = String(value || '');
    if (/万元/.test(s)) return '万元';
    if (/万G/.test(s)) return '万G';
    if (/万/.test(s)) return '万';
    if (/%/.test(s)) return '%';
    if (/人/.test(s)) return '人';
    if (/元/.test(s)) return '元';
    if (/pp/.test(s)) return 'pp';
    return '';
  }

  function formatWithSuffix(num, suffix, digits) {
    if (isNaN(num)) return '—';
    const d = digits != null ? digits : (Math.abs(num) >= 100 ? 1 : 2);
    const body = num.toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
    return body + (suffix || '');
  }

  function formatChangeRate(mom) {
    const n = parseMomNum(mom);
    if (isNaN(n) && (!mom || mom === '—')) return '—';
    const raw = String(mom || '');
    if (/pp/i.test(raw)) {
      const sign = n > 0 ? '+' : '';
      return `${sign}${n.toFixed(2)}pp`;
    }
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
  }

  /** 由当月值与环比反推上月值（演示） */
  function derivePrevMonthValue(value, mom) {
    const cur = parseValueNum(value);
    const rate = parseMomNum(mom);
    const suffix = valueSuffix(value);
    if (isNaN(cur)) return '—';
    if (/pp/i.test(String(mom || ''))) {
      return formatWithSuffix(cur - rate, suffix);
    }
    if (Math.abs(1 + rate / 100) < 1e-6) return formatWithSuffix(cur, suffix);
    return formatWithSuffix(cur / (1 + rate / 100), suffix);
  }

  function enrichAlertMetric(m) {
    const changeRate = formatChangeRate(m.mom);
    const changeRateNum = Math.abs(parseMomNum(m.mom));
    return {
      name: m.name,
      prevValue: derivePrevMonthValue(m.value, m.mom),
      currValue: m.value || '—',
      changeRate,
      changeRateNum,
      mom: m.mom,
      value: m.value
    };
  }

  function buildCityCharts(periodLabel) {
    const cities = CITY_NAMES.length ? CITY_NAMES : FALLBACK_CITIES;
    const scale = cities.map((c, i) => +(18 + (hash(c + periodLabel) % 12) + i * 0.6).toFixed(1));
    const flowIncrement = cities.map((c, i) => {
      const v = 0.8 + (hash(c + 'incAbs') % 40) / 10 + (i % 3) * 0.15;
      return +v.toFixed(2);
    });
    const flowGrowth = cities.map((c, i) => {
      const v = (hash(c + 'inc') % 20) - 8 + (i % 3) * 2;
      return +v.toFixed(1);
    });
    const revenue = cities.map((c, i) => {
      const v = 8 + (hash(c + 'revAbs') % 18) + i * 0.4;
      return +v.toFixed(1);
    });
    const revenueGrowth = cities.map((c, i) => {
      const v = (hash(c + 'rev') % 16) - 10 + (i % 4);
      return +v.toFixed(1);
    });
    return {
      categories: cities,
      scaleChart: {
        title: '流量规模',
        barName: '流量规模(万G)',
        barUnit: '万G',
        values: scale
      },
      flowGrowthChart: {
        title: '流量增量 / 流量增幅',
        barName: '流量增量(万G)',
        barUnit: '万G',
        lineName: '流量增幅(%)',
        values: flowIncrement,
        rates: flowGrowth
      },
      revenueChart: {
        title: '流量收入 / 流量收入增幅',
        barName: '流量收入(万元)',
        barUnit: '万元',
        lineName: '流量收入增幅(%)',
        values: revenue,
        rates: revenueGrowth
      }
    };
  }

  function buildActions(alerts, mainlines) {
    const focusCities = (CITY_NAMES.length ? CITY_NAMES : FALLBACK_CITIES).slice(0, 4).join('、');
    const topAlert = alerts[0]?.name || '流量收入';
    return [
      {
        title: '稳住套外与超套结构，守住流量收入基本盘',
        problem: `「${topAlert}」及套-流量增幅贡献走弱，套外依赖与套餐适配不足叠加影响收入稳定性。`,
        audience: `套外高依赖、视频超套及近3个月套餐活动到期客户；重点盯控 ${focusCities} 等地市。`,
        action: '对超套敏感客群推送融合升档与定向流量包组合，同步在 APP 账单页强化套餐扩容提醒与权益触达。',
        expected: '改善流量收入、套-流量增幅贡献及流量超套客群规模表现。'
      },
      {
        title: '打通机套网协同，释放5G有效使用',
        problem: '5G终端增长未能有效转化为智网流量贡献，机套适配与登网使用环节存在断点。',
        audience: '5G终端未换套餐、低流量套餐偏好及拍照5G终端非5G网络用户。',
        action: '开展机套适配专项运营，对登网不足用户推送5G网络设置指引与智网产品体验包，联动终端换机触点强化套餐匹配。',
        expected: '提升5G机套适配率、5G登网率及5G智网月流量贡献。'
      },
      {
        title: '抑制存量沉默，减缓流量释放受阻',
        problem: '4G终端迁出放缓叠加套餐扩容升档走弱，流量抑制客群规模抬升。',
        audience: '低接触客群、APP活跃下降及沉默用户，重点覆盖存量高价值区域。',
        action: '对沉默及低接触用户开展权益唤醒与扩容升档邀约，结合网龄活动提升套餐扩容完成量。',
        expected: '改善流量抑制客群、套餐扩容升档扩及当月流量（万G）等规模类指标。'
      }
    ];
  }

  window.buildTrafficFlowTreeReport = function (root, treeName) {
    const branches = typeof window.buildTrafficFlowRevenueRcaBranches === 'function'
      ? window.buildTrafficFlowRevenueRcaBranches()
      : [];
    const period = window.jxDrillPeriod || { year: 2026, month: 5 };
    const periodLabel = `${period.year}年${period.month}月`;

    const flowScale = findNode(root, '当年累计流量（万G）') || findNode(root, '当月流量（万G）');
    const flowIncrement = findNode(root, '当月流量环比') || findNode(root, '流量增幅');
    const flowRevenue = findNode(root, '流量收入');
    const flowRevenueInc = findNode(root, '流量收入')?.mom ? { mom: flowRevenue.mom } : null;

    const allAlerts = [];
    walkMetrics(root, allAlerts);
    const alerts = allAlerts.filter(m => m.alert);
    const topAlerts = sortByAbsMom(alerts).slice(0, 5).map(enrichAlertMetric);
    const cityCharts = buildCityCharts(periodLabel);

    const mainlineConfigs = [
      {
        subtreeKey: '三条主线：1-底线-吃饱喝好',
        title: '1、底线：吃饱喝好',
        shortName: '机套网',
        branchNames: ['机-流量增幅贡献', '套-流量增幅贡献', '网-流量增幅贡献'],
        summaries: [
          '机套网三条分支中，套-流量增幅贡献环比走弱最为突出，套餐精准扩容与机套适配环节对流量释放形成制约。',
          '2G终端迁出率提升对终端结构优化形成支撑，但5G机套适配与登网转化仍不足以对冲套内流量增长放缓。',
          '需同步推进终端迁转、套餐扩容与5G登网协同，避免「有机无套、有套无用」的结构性失衡。'
        ]
      },
      {
        subtreeKey: '三条主线：2-基线-拖家带口',
        title: '2、基线：拖家带口',
        shortName: '卡',
        branchNames: ['以存带增-流量增幅贡献', '以增促存-流量增幅贡献'],
        summaries: [
          '以存带增分支流量增幅贡献明显为负，存量客户价值挖掘与融合加固节奏放缓。',
          '有效新增与网龄活动等正向指标仍有一定支撑，但尚不足以扭转存量侧拖累。',
          '建议强化存量融合运营与升档维系，防止存量客户流量与价值双降。'
        ]
      },
      {
        subtreeKey: '三条主线：3-高线-赏心悦目',
        title: '3、高线：赏心悦目',
        shortName: '用',
        branchNames: ['自有蜂窝网驻留产品-流量增幅贡献', '外部蜂窝网驻留产品-流量增幅贡献'],
        summaries: [
          '自有蜂窝网驻留产品贡献保持增长，但算力类等细分产品发展出现波动。',
          '外部蜂窝网驻留产品增幅平稳，对高线板块形成一定补充。',
          '高线板块需在做大自有产品规模的同时，关注发展节奏波动产品的结构优化。'
        ]
      }
    ];

    const mainlines = mainlineConfigs.map(cfg => {
      const subtree = findSubtree(root, cfg.subtreeKey);
      return buildMainlineSection(subtree || root, cfg, branches);
    });

    const overviewIntro = `${periodLabel}，全省累计流量规模 ${flowScale?.value || '194.4万G'}，流量增量/增幅指标显示 ${flowIncrement?.value || '+15.6%'}（环比 ${flowIncrement?.mom || '+8.5%'}），流量收入 ${flowRevenue?.value || '162.5万元'}（环比 ${flowRevenue?.mom || '-1.6%'}）。`;
    const overviewTrend = '整体发展趋势：流量规模较去年仍有提升，但流量增量波动下降、流量增幅呈放缓趋势；与此同时流量收入出现下滑，规模增长与收入兑现之间的剪刀差扩大。';

    return {
      template: 'traffic-flow-v12',
      title: '流量运营指标树根因分析报告',
      subtitle: treeName || '流量运营',
      generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      period: periodLabel,
      overview: {
        intro: overviewIntro,
        trend: overviewTrend,
        alertCount: alerts.length,
        topAlerts: topAlerts.map(a => ({
          name: a.name,
          prevValue: a.prevValue,
          currValue: a.currValue,
          changeRate: a.changeRate,
          value: a.currValue,
          mom: a.changeRate
        })),
        kpiCards: [
          { label: '累计流量规模', value: flowScale?.value || '194.4万G', sub: `环比 ${flowScale?.mom || '+3.6%'}` },
          { label: '流量增幅', value: flowIncrement?.value || '+15.6%', sub: `环比 ${flowIncrement?.mom || '+8.5%'}` },
          { label: '流量收入', value: flowRevenue?.value || '162.5万元', sub: `环比 ${flowRevenue?.mom || '-1.6%'}` },
          { label: '异动指标数', value: String(alerts.length), sub: '发展异动' }
        ]
      },
      cityCharts,
      alertBarChart: topAlerts.map(a => ({
        name: a.name.length > 8 ? a.name.slice(0, 8) + '…' : a.name,
        fullName: a.name,
        value: a.changeRateNum || 1,
        changeRate: a.changeRate
      })),
      mainlines,
      actions: buildActions(alerts, mainlines),
      causalBranches: branches.slice(0, 3).map(b => ({
        title: b.metric,
        chain: (b.chainMetrics || []).map(m => m.name),
        summary: b.conductionSummary
      }))
    };
  };

  window.isTrafficFlowTreeReport = function (root, treeName) {
    const name = treeName || '';
    if (/流量运营/.test(name)) return true;
    if (root?.id === 'tf-root' || root?.name === '流量运营') return true;
    return !!findNode(root, '一个目标');
  };
})();
