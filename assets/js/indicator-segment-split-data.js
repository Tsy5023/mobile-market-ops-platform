/**
 * 指标客群分析 · 「一分：客户分群」客群清单（与原型图完全一致）
 * 客群属性：一类～六类；客群名称、客群数量按图配置；第 47 行为合计
 */
(function () {
  function hash(s, n) {
    let h = 0;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return Math.abs(h) % (n || 1000);
  }

  /** 46 个客群（一类 8 + 二类 6 + 三类 4 + 四类 10 + 五类 10 + 六类 8） */
  const SEGMENT_SPLIT_47 = [
    // —— 一类（8）——
    { id: 'seg-01', attr: '一类', name: '全球通2G换机客群', count: 25758 },
    { id: 'seg-02', attr: '一类', name: '全球通3G换机客群', count: 11452 },
    { id: 'seg-03', attr: '一类', name: '动感地带2G换机客群', count: 38127 },
    { id: 'seg-04', attr: '一类', name: '动感地带3G换机客群', count: 24118 },
    { id: 'seg-05', attr: '一类', name: '神州行2G换机客群', count: 147215 },
    { id: 'seg-06', attr: '一类', name: '神州行3G换机客群', count: 105742 },
    { id: 'seg-07', attr: '一类', name: '4G终端未换卡客群', count: 86420 },
    { id: 'seg-08', attr: '一类', name: '4G终端已换卡未用4G客群', count: 52318 },
    // —— 二类（6）——
    { id: 'seg-09', attr: '二类', name: '流量高价值低渗透客群', count: 42157 },
    { id: 'seg-10', attr: '二类', name: '流量高价值中渗透客群', count: 38524 },
    { id: 'seg-11', attr: '二类', name: '流量高价值高渗透客群', count: 31245 },
    { id: 'seg-12', attr: '二类', name: '流量中价值低渗透客群', count: 52840 },
    { id: 'seg-13', attr: '二类', name: '流量中价值中渗透客群', count: 45612 },
    { id: 'seg-14', attr: '二类', name: '流量中价值高渗透客群', count: 38970 },
    // —— 三类（4）——
    { id: 'seg-15', attr: '三类', name: '流量低价值低渗透客群', count: 61240 },
    { id: 'seg-16', attr: '三类', name: '流量低价值中渗透客群', count: 48730 },
    { id: 'seg-17', attr: '三类', name: '流量低价值高渗透客群', count: 35420 },
    { id: 'seg-18', attr: '三类', name: '流量零价值客群', count: 28950 },
    // —— 四类（10）——
    { id: 'seg-19', attr: '四类', name: '语音高价值低饱和客群', count: 32450 },
    { id: 'seg-20', attr: '四类', name: '语音高价值中饱和客群', count: 28760 },
    { id: 'seg-21', attr: '四类', name: '语音高价值高饱和客群', count: 25140 },
    { id: 'seg-22', attr: '四类', name: '语音中价值低饱和客群', count: 41230 },
    { id: 'seg-23', attr: '四类', name: '语音中价值中饱和客群', count: 36890 },
    { id: 'seg-24', attr: '四类', name: '语音中价值高饱和客群', count: 33560 },
    { id: 'seg-25', attr: '四类', name: '语音低价值低饱和客群', count: 52480 },
    { id: 'seg-26', attr: '四类', name: '语音低价值中饱和客群', count: 46120 },
    { id: 'seg-27', attr: '四类', name: '语音低价值高饱和客群', count: 39870 },
    { id: 'seg-28', attr: '四类', name: '语音零价值客群', count: 31240 },
    // —— 五类（10）——
    { id: 'seg-29', attr: '五类', name: '宽带高价值低渗透客群', count: 28450 },
    { id: 'seg-30', attr: '五类', name: '宽带高价值中渗透客群', count: 24680 },
    { id: 'seg-31', attr: '五类', name: '宽带高价值高渗透客群', count: 21340 },
    { id: 'seg-32', attr: '五类', name: '宽带中价值低渗透客群', count: 36720 },
    { id: 'seg-33', attr: '五类', name: '宽带中价值中渗透客群', count: 32450 },
    { id: 'seg-34', attr: '五类', name: '宽带中价值高渗透客群', count: 29180 },
    { id: 'seg-35', attr: '五类', name: '宽带低价值低渗透客群', count: 45230 },
    { id: 'seg-36', attr: '五类', name: '宽带低价值中渗透客群', count: 40120 },
    { id: 'seg-37', attr: '五类', name: '宽带低价值高渗透客群', count: 35670 },
    { id: 'seg-38', attr: '五类', name: '宽带零价值客群', count: 27890 },
    // —— 六类（8）——
    { id: 'seg-39', attr: '六类', name: '数字化服务高价值客群', count: 32140 },
    { id: 'seg-40', attr: '六类', name: '数字化服务中价值客群', count: 45680 },
    { id: 'seg-41', attr: '六类', name: '数字化服务低价值客群', count: 52470 },
    { id: 'seg-42', attr: '六类', name: '数字化服务零价值客群', count: 38920 },
    { id: 'seg-43', attr: '六类', name: '集团成员高价值客群', count: 28450 },
    { id: 'seg-44', attr: '六类', name: '集团成员中价值客群', count: 41230 },
    { id: 'seg-45', attr: '六类', name: '集团成员低价值客群', count: 56780 },
    { id: 'seg-46', attr: '六类', name: '集团成员零价值客群', count: 32460 }
  ];

  const SEGMENT_TOTAL_COUNT = 1245782;

  function resolveMetricColumns(node) {
    if (!node) return [{ id: 'default', name: '高价值贡献度(PP)' }];
    const children = (node.children || []).filter(c => c && c.name);
    if (children.length) {
      return children.slice(0, 12).map(c => ({ id: c.id, name: c.name }));
    }
    return [{ id: node.id, name: node.name }];
  }

  function parseMom(momStr) {
    if (!momStr) return 0;
    const m = String(momStr).match(/([+-]?\d+\.?\d*)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function contributionFor(metricId, segmentId, node) {
    const h = hash(metricId + '|' + segmentId, 10000);
    const mom = parseMom(node?.mom);
    const isAlert = node?.status === 'alert' || node?.alert;
    let v = (h % 200 - 100) / 100 + mom * 0.08;
    if (isAlert) v -= 0.12;
    if (segmentId === 'seg-18' || segmentId === 'seg-28' || segmentId === 'seg-38' || segmentId === 'seg-42' || segmentId === 'seg-46') {
      v -= 0.15;
    }
    if (segmentId === 'seg-01' || segmentId === 'seg-11' || segmentId === 'seg-21' || segmentId === 'seg-31' || segmentId === 'seg-39' || segmentId === 'seg-43') {
      v += 0.1;
    }
    return Math.round(v * 100) / 100;
  }

  function metricRawValue(metricId, segmentId, node) {
    const c = contributionFor(metricId, segmentId, node);
    const scale = SEGMENT_SPLIT_47.find(s => s.id === segmentId)?.count || 1000;
    return Math.round(c * scale / 10000 * 100) / 100;
  }

  function ppValue(metricId, segmentId, node) {
    const h = hash('pp|' + metricId + '|' + segmentId, 1000);
    const mom = parseMom(node?.mom);
    return Math.round((mom * 0.3 + (h % 30 - 15) / 10) * 10) / 10;
  }

  function cellClass(v) {
    if (v > 0) return 'seg-heat-pos';
    if (v < 0) return 'seg-heat-neg';
    return 'seg-heat-zero';
  }

  function intensityStyle(v) {
    const cls = cellClass(v);
    const abs = Math.min(Math.abs(v), 2);
    const alpha = 0.12 + (abs / 2) * 0.55;
    if (cls === 'seg-heat-pos') return `background:rgba(22,163,74,${alpha.toFixed(2)})`;
    if (cls === 'seg-heat-neg') return `background:rgba(220,38,38,${alpha.toFixed(2)})`;
    return `background:rgba(250,204,21,${(0.08 + abs * 0.05).toFixed(2)})`;
  }

  function buildTotalRow(columns, rows) {
    const cells = columns.map((col, ci) => {
      const sum = rows.reduce((a, r) => a + (r.cells[ci]?.contribution || 0), 0);
      const v = Math.round(sum * 100) / 100;
      return {
        metricId: col.id,
        metricName: col.name,
        contribution: v,
        value: 0,
        pp: 0,
        cellClass: 'seg-heat-total-val',
        cellStyle: 'background:#dc2626;color:#fff;font-weight:700'
      };
    });
    return {
      id: 'seg-total',
      attr: '',
      name: '合计',
      count: SEGMENT_TOTAL_COUNT,
      isTotal: true,
      cells
    };
  }

  window.SegmentSplitData = {
    segments: SEGMENT_SPLIT_47,

    getMatrix(node) {
      const columns = resolveMetricColumns(node);
      const rows = SEGMENT_SPLIT_47.map(seg => {
        const cells = columns.map(col => {
          const contrib = contributionFor(col.id, seg.id, node);
          return {
            metricId: col.id,
            metricName: col.name,
            contribution: contrib,
            value: metricRawValue(col.id, seg.id, node),
            pp: ppValue(col.id, seg.id, node),
            cellClass: cellClass(contrib),
            cellStyle: intensityStyle(contrib)
          };
        });
        return { ...seg, cells };
      });

      const totalRow = buildTotalRow(columns, rows);

      return {
        title: '一分：客户分群',
        metricTitle: node?.name || '指标',
        metricBanner: columns.length === 1
          ? '高价值贡献度 (PP)'
          : `${node?.name || '指标'} · 子指标贡献分解`,
        columns,
        rows,
        totalRow,
        totalCount: SEGMENT_TOTAL_COUNT,
        summary: {
          positive: rows.filter(r => r.cells.some(c => c.contribution > 0)).length,
          negative: rows.filter(r => r.cells.some(c => c.contribution < 0)).length
        }
      };
    },

    formatNum(n) {
      if (n == null || isNaN(n)) return '—';
      const s = Number(n).toFixed(2);
      return n > 0 ? '+' + s : s;
    },

    formatNumPlain(n) {
      if (n == null || isNaN(n)) return '—';
      return Number(n).toFixed(2);
    }
  };
})();
