/** 客群趋势监控 · 列表持久化与趋势数据生成 */
(function () {
  const STORAGE_KEY = 'jxMonitorSegments';

  function hash(s, n) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h) % (n || 100);
  }

  const DEFAULT_MONITOR = [
    { id: 'mon-1', segmentId: 'seg-high-downgrade', name: '中高端降档预警客群', scale: 12840, owner: '省公司市场部', updateCycle: '日', stability: 72, valueScore: 88, createdAt: '2026-03-01' },
    { id: 'mon-2', segmentId: 'seg-out-package', name: '套外高依赖客群', scale: 9560, owner: '流量运营室', updateCycle: '日', stability: 65, valueScore: 62, createdAt: '2026-03-15' },
    { id: 'mon-3', segmentId: 'seg-video-pack', name: '视频大流量未办定向包', scale: 18200, owner: '流量运营室', updateCycle: '周', stability: 81, valueScore: 74, createdAt: '2026-04-01' },
    { id: 'mon-4', segmentId: 'seg-churn-risk', name: '离网高风险客群', scale: 6420, owner: '存量运营室', updateCycle: '日', stability: 58, valueScore: 45, createdAt: '2026-04-10' },
    { id: 'mon-5', segmentId: 'seg-contract-end', name: '合约到期 60 天内', scale: 24600, owner: '存量运营室', updateCycle: '日', stability: 90, valueScore: 79, createdAt: '2026-04-20' }
  ];

  function monthLabels(n) {
    const labels = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(2026, 4 - i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return labels;
  }

  function seriesFromEnd(endVal, n, spread, decimals) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const factor = 0.82 + (hash(String(endVal) + i, spread) / 100) * 0.2;
      const v = endVal * factor * (0.92 + i * 0.016);
      arr.push(decimals ? Math.round(v * 10) / 10 : Math.round(v));
    }
    arr[n - 1] = endVal;
    return arr;
  }

  const STAB_LEVELS = ['低稳定', '中稳定', '高稳定'];
  const VAL_LEVELS = ['低价值', '中价值', '高价值'];

  function monthWeightsFor(item, stabTier, valTier, monthIdx) {
    const weights = [];
    for (let s = 0; s < 3; s++) {
      for (let v = 0; v < 3; v++) {
        const dist = Math.abs(s - stabTier) + Math.abs(v - valTier);
        const w = Math.max(4, 14 - dist * 3) + hash(item.id + 'w' + s + v, 6);
        weights.push(w * (1 + monthIdx * 0.004 * (v - 1.2)) * (1 + monthIdx * 0.003 * (s - 1.2)));
      }
    }
    return weights;
  }

  /** 3×3 矩阵：按稳定度×价值度切分客群总规模，并生成各格近 6 期人数序列 */
  function buildMatrixSplit(item, labels, scaleValues) {
    const n = labels.length;
    const stabTier = item.stability >= 72 ? 2 : item.stability >= 52 ? 1 : 0;
    const valTier = item.valueScore >= 72 ? 2 : item.valueScore >= 52 ? 1 : 0;

    const gridByMonth = [];
    for (let i = 0; i < n; i++) {
      const weights = monthWeightsFor(item, stabTier, valTier, i);
      const wSum = weights.reduce((a, b) => a + b, 0);
      const total = scaleValues[i];
      const counts = weights.map(w => Math.floor(total * w / wSum));
      let allocated = counts.reduce((a, b) => a + b, 0);
      counts[counts.length - 1] += total - allocated;
      gridByMonth.push(counts);
    }

    const cellList = [];
    for (let s = 2; s >= 0; s--) {
      for (let v = 0; v < 3; v++) {
        const idx = s * 3 + v;
        const normalized = gridByMonth.map(row => row[idx]);
        const last = normalized[n - 1];
        const prev = normalized[n - 2] || last;
        const first = normalized[0] || last;
        const totalNow = scaleValues[n - 1] || 1;
        const totalPrev = scaleValues[n - 2] || totalNow;
        const shareNow = Math.round(last / totalNow * 1000) / 10;
        const sharePrev = totalPrev > 0 ? Math.round(prev / totalPrev * 1000) / 10 : 0;
        cellList.push({
          id: 's' + s + 'v' + v,
          stabIdx: s,
          valIdx: v,
          stabLabel: STAB_LEVELS[s],
          valLabel: VAL_LEVELS[v],
          label: STAB_LEVELS[s] + ' · ' + VAL_LEVELS[v],
          tier: s === 2 && v === 2 ? 'star' : s === 2 ? 'stable' : v === 2 ? 'volatile' : s === 0 && v === 0 ? 'watch' : 'mid',
          values: normalized,
          count: last,
          prevCount: prev,
          momDelta: last - prev,
          share: shareNow,
          sharePrev,
          shareDelta: Math.round((shareNow - sharePrev) * 10) / 10,
          momPct: Math.round((prev > 0 ? (last - prev) / prev * 100 : 0) * 10) / 10,
          periodPct: Math.round((first > 0 ? (last - first) / first * 100 : 0) * 10) / 10
        });
      }
    }

    const lastIdx = n - 1;
    const prevIdx = Math.max(0, lastIdx - 1);
    const totalNow = scaleValues[lastIdx];
    const totalPrev = scaleValues[prevIdx] || totalNow;
    const totalMomDelta = totalNow - totalPrev;
    const totalMomPct = totalPrev > 0 ? ((totalNow - totalPrev) / totalPrev * 100) : 0;
    const dominant = cellList.slice().sort((a, b) => b.count - a.count)[0];

    const monthLabel = labels[lastIdx] || '本月';
    const prevLabel = labels[prevIdx] || '上月';

    const expanded = cellList.filter(c => c.momDelta > 0).sort((a, b) => b.momDelta - a.momDelta);
    const contracted = cellList.filter(c => c.momDelta < 0).sort((a, b) => a.momDelta - b.momDelta);

    let migrationScore = 0;
    cellList.forEach(c => {
      migrationScore += (c.stabIdx * 3 + c.valIdx) * c.momDelta;
    });
    const migrationNorm = totalNow > 0 ? migrationScore / totalNow : 0;

    let direction = 'stable';
    let headline = '近 1 个月各矩阵单元人数变化较小，客群结构基本稳定。';
    if (migrationNorm > 0.008 && expanded.some(c => c.stabIdx >= 1 && c.valIdx >= 1)) {
      direction = 'upgrade';
      headline = '近 1 个月客群向高稳定、高价值矩阵单元迁移，结构呈优化趋势。';
    } else if (migrationNorm < -0.008 && contracted.some(c => c.stabIdx === 0 || c.valIdx === 0)) {
      direction = 'downgrade';
      headline = '近 1 个月低稳定或低价值单元扩容明显，需警惕结构下沉。';
    } else if (expanded.length >= 2 && contracted.length >= 2) {
      direction = 'mixed';
      headline = '近 1 个月矩阵内部分化：部分单元显著扩容、部分收缩，宜分格施策。';
    }

    const fmtDelta = (d) => (d > 0 ? '+' : '') + d.toLocaleString();
    const bullets = [
      `${prevLabel} → ${monthLabel}：客群总规模 ${totalPrev.toLocaleString()} → ${totalNow.toLocaleString()} 人（${fmtDelta(totalMomDelta)} 人，${totalMomPct >= 0 ? '+' : ''}${totalMomPct.toFixed(1)}%）。`,
      `当前最大子群「${dominant.label}」${dominant.count.toLocaleString()} 人，占 ${dominant.share}%。`,
      expanded.length
        ? `近 1 月扩容最多：${expanded.slice(0, 3).map(c => `「${c.label}」${fmtDelta(c.momDelta)} 人（${c.momPct >= 0 ? '+' : ''}${c.momPct}%）`).join('；')}。`
        : '近 1 月暂无显著扩容单元。',
      contracted.length
        ? `近 1 月收缩最多：${contracted.slice(0, 3).map(c => `「${c.label}」${fmtDelta(c.momDelta)} 人（${c.momPct}%）`).join('；')}。`
        : ''
    ].filter(Boolean);

    const quadrant = item.stability >= 70 && item.valueScore >= 70 ? 'star'
      : item.stability >= 70 ? 'stable' : item.valueScore >= 70 ? 'volatile' : 'watch';

    return {
      version: 3,
      stabilityLevels: STAB_LEVELS,
      valueLevels: VAL_LEVELS,
      cells: cellList,
      total: totalNow,
      monthLabel,
      prevLabel,
      summary: {
        direction,
        headline,
        bullets,
        dominant: { label: dominant.label, count: dominant.count, share: dominant.share },
        totalMomDelta,
        totalMomPct: Math.round(totalMomPct * 10) / 10
      },
      stability: item.stability,
      valueScore: item.valueScore,
      quadrant
    };
  }

  function enrichTrends(item) {
    const labels = monthLabels(6);
    const scale = seriesFromEnd(item.scale, 6, 40);
    const h = hash(item.id, 50);
    return {
      labels,
      scale: {
        values: scale,
        unit: '人',
        mom: ((scale[5] - scale[4]) / scale[4] * 100).toFixed(1) + '%',
        momUp: scale[5] >= scale[4],
        yoy: '+4.8%',
        peak: Math.max(...scale),
        valley: Math.min(...scale)
      },
      structure: {
        g5Share: seriesFromEnd(38 + (h % 15), 6, 30, true),
        highValueShare: seriesFromEnd(32 + (h % 12), 6, 35, true),
        fusionShare: seriesFromEnd(48 + (h % 10), 6, 28, true),
        unit: '%',
        desc: '高价值客户占比、5G 渗透率、融合绑定占比'
      },
      value: {
        arpu: seriesFromEnd(86 + (h % 20), 6, 25, true),
        unit: '元',
        revenueContrib: seriesFromEnd(2.8 + (h % 10) / 10, 6, 20, true),
        revenueUnit: '亿元'
      },
      stability: {
        churnRate: seriesFromEnd(4.2 + (h % 8) / 10, 6, 22, true),
        silentRate: seriesFromEnd(22 + (h % 6), 6, 18, true),
        retainSuccess: seriesFromEnd(34 + (h % 10), 6, 24, true),
        unit: '%'
      },
      cityTop: [
        { name: '南昌', scale: Math.round(item.scale * 0.22), pct: 22 },
        { name: '赣州', scale: Math.round(item.scale * 0.18), pct: 18 },
        { name: '九江', scale: Math.round(item.scale * 0.14), pct: 14 },
        { name: '上饶', scale: Math.round(item.scale * 0.12), pct: 12 },
        { name: '其他', scale: Math.round(item.scale * 0.34), pct: 34 }
      ],
      matrix: buildMatrixSplit(item, labels, scale),
      alerts: [
        { level: scale[5] >= scale[4] ? 'info' : 'warning', text: `规模月环比 ${((scale[5] - scale[4]) / scale[4] * 100).toFixed(1)}%` },
        { level: 'info', text: `近 6 月 ${labels[0]} → ${labels[5]} 连续监测中` }
      ]
    };
  }

  function enrichItem(raw) {
    const item = { ...raw };
    if (!item.trend || !item.trend.labels || item.trend.matrix?.version !== 3) {
      item.trend = enrichTrends(item);
    }
    item.lastUpdate = item.lastUpdate || '2026-05-21 08:00';
    item.scene = item.scene || (window.CUSTOMER_SEGMENT_OPTIONS || []).find(s => s.id === item.segmentId)?.scene || '流量运营';
    return item;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) return list.map(enrichItem);
      }
    } catch (e) { /* ignore */ }
    return DEFAULT_MONITOR.map(enrichItem);
  }

  function save(list) {
    const slim = list.map(m => {
      const { trend, ...rest } = m;
      return rest;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  }

  window.MonitorSegmentStore = {
    getAll() {
      return load();
    },

    getById(id) {
      return load().find(m => m.id === id) || null;
    },

    addFromSegment(segmentId) {
      const list = load();
      if (list.some(m => m.segmentId === segmentId)) {
        return { ok: false, message: '该客群已在监控列表中' };
      }
      const seg = (window.CUSTOMER_SEGMENT_OPTIONS || []).find(s => s.id === segmentId);
      if (!seg) return { ok: false, message: '未找到客群' };
      const scale = typeof seg.scale === 'number' ? seg.scale : parseInt(String(seg.scale).replace(/\D/g, ''), 10) || 10000;
      const h = hash(segmentId, 100);
      const item = enrichItem({
        id: 'mon-' + Date.now(),
        segmentId,
        name: seg.name,
        scale,
        owner: '省公司市场部',
        updateCycle: '日',
        stability: 60 + (h % 35),
        valueScore: 55 + (h % 40),
        createdAt: new Date().toISOString().slice(0, 10),
        scene: seg.scene
      });
      list.push(item);
      save(list);
      return { ok: true, item };
    },

    remove(id) {
      const list = load().filter(m => m.id !== id);
      save(list);
      return { ok: true };
    },

    getAvailableSegments() {
      const monitored = new Set(load().map(m => m.segmentId));
      return (window.CUSTOMER_SEGMENT_OPTIONS || [])
        .filter(s => s.id && s.scale && !monitored.has(s.id));
    },

    enrichItem
  };
})();
