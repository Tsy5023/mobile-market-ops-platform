/**
 * 从 Excel「江西指标树建设-指标数据梳理（流量运营）v3.3」生成演示数据
 * 规则：第 1 行表头；A 列根指标；B 列起按「分组/指标名称」列类型建树；
 * 若指标后分组列为空则下一指标列作为其子指标。
 * 运行: node scripts/build-traffic-flow-tree.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XLSX_PATH = 'C:/Users/AI/Desktop/江西指标树建设-指标数据梳理（流量运营）v3.3.xlsx';
const OUT_PATH = path.join(ROOT, 'assets/js/indicator-tree-traffic-flow-data.js');

const SCENE = '公众市场 / 流量运营';
const CODE = '202605280001';
const INSIGHT_ID = 'tree-traffic-flow';
const TREE_DISPLAY_NAME = '流量运营';

const COLS = (() => {
  const list = [];
  for (let i = 0; i < 26; i++) list.push(String.fromCharCode(65 + i));
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) list.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j));
  }
  return list;
})();

async function loadWorkbook() {
  const dest = path.join(ROOT, '.tmp-xlsx-parse');
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const zipPath = path.join(dest, 'book.zip');
  fs.copyFileSync(XLSX_PATH, zipPath);
  const { execSync } = await import('child_process');
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${path.join(dest, 'x')}' -Force"`,
    { stdio: 'pipe' }
  );
  const sharedXml = fs.readFileSync(path.join(dest, 'x/xl/sharedStrings.xml'), 'utf8');
  const sheet1 = fs.readFileSync(path.join(dest, 'x/xl/worksheets/sheet1.xml'), 'utf8');
  let sheet2 = '';
  const sheet2Path = path.join(dest, 'x/xl/worksheets/sheet2.xml');
  if (fs.existsSync(sheet2Path)) sheet2 = fs.readFileSync(sheet2Path, 'utf8');
  fs.rmSync(dest, { recursive: true, force: true });
  return { sharedXml, sheet1, sheet2 };
}

function parseSharedStrings(xml) {
  const strings = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = re.exec(xml))) {
    const t = m[1].match(/<t[^>]*>([\s\S]*?)<\/t>/);
    let s = t ? t[1] : '';
    s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    strings.push(s);
  }
  return strings;
}

function parseSheetRows(sheetXml, strings) {
  const rows = [];
  const rowRe = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(sheetXml))) {
    const rNum = parseInt(rm[1], 10);
    const cells = {};
    const cellRe = /<c r="([A-Z]+)(\d+)"([^>]*)>(?:<v>([\s\S]*?)<\/v>)?/g;
    let cm;
    const rowInner = rm[2];
    while ((cm = cellRe.exec(rowInner))) {
      const col = cm[1];
      const attrs = cm[3] || '';
      const raw = cm[4];
      if (raw === undefined) continue;
      let val = raw;
      if (attrs.includes('t="s"')) val = strings[parseInt(raw, 10)] || '';
      cells[col] = val;
    }
    rows.push({ r: rNum, cells });
  }
  return rows;
}

/** 解析表头：B 列起识别分组列 / 指标列 */
function parseColumnMeta(headerRow) {
  const meta = {};
  let maxColIdx = 0;
  for (const col of COLS) {
    const h = (headerRow.cells[col] || '').trim();
    if (!h) continue;
    maxColIdx = Math.max(maxColIdx, COLS.indexOf(col));
    if (/分组/.test(h)) meta[col] = 'category';
    else if (/指标/.test(h)) meta[col] = 'metric';
    else meta[col] = /名称/.test(h) ? 'metric' : 'category';
  }
  const dataCols = COLS.slice(COLS.indexOf('B'), maxColIdx + 1).filter((c) => meta[c]);
  return { meta, dataCols };
}

/**
 * 按稀疏行构建树：每行从左到右填充路径；空单元格继承左侧路径；
 * 分组列为分类节点（无指标值），指标列为指标节点。
 */
function buildTreeFromSheet(rows) {
  const header = rows.find((r) => r.r === 1);
  if (!header) throw new Error('缺少表头行');
  const { meta, dataCols } = parseColumnMeta(header);

  const root = { name: '', nodeType: 'metric', children: [] };
  const stack = {};

  function findParent(col) {
    const idx = dataCols.indexOf(col);
    for (let i = idx - 1; i >= 0; i--) {
      const c = dataCols[i];
      if (stack[c]) return stack[c];
    }
    return root;
  }

  function clearStackAfter(col) {
    const idx = dataCols.indexOf(col);
    for (let i = idx + 1; i < dataCols.length; i++) delete stack[dataCols[i]];
  }

  function ensureChild(parent, name, nodeType) {
    if (!parent.children) parent.children = [];
    let ch = parent.children.find((x) => x.name === name && x.nodeType === nodeType);
    if (!ch) {
      ch = { name, nodeType, children: [] };
      parent.children.push(ch);
    }
    return ch;
  }

  for (const row of rows) {
    if (row.r < 2) continue;
    const a = (row.cells.A || '').trim();
    if (a) root.name = a;

    for (const col of dataCols) {
      const val = (row.cells[col] || '').trim();
      if (!val) continue;
      const nodeType = meta[col];
      const parent = findParent(col);
      const node = ensureChild(parent, val, nodeType);
      stack[col] = node;
      clearStackAfter(col);
    }
  }

  if (!root.name) {
    const firstA = rows.find((r) => r.r >= 2 && (r.cells.A || '').trim());
    root.name = firstA ? firstA.cells.A.trim() : '流量运营根指标';
  }
  return root;
}

function parseAttributions(sheet2Xml, strings) {
  if (!sheet2Xml) return {};
  const rows = parseSheetRows(sheet2Xml, strings);
  const byMetric = {};
  for (const row of rows) {
    if (row.r < 2) continue;
    const metricName = (row.cells.C || '').trim();
    const attr = (row.cells.E || '').trim();
    const typ = (row.cells.F || '').trim();
    if (!metricName || !attr) continue;
    if (!byMetric[metricName]) byMetric[metricName] = { metrics: [], tags: [] };
    if (typ === '指标') byMetric[metricName].metrics.push(attr);
    else if (typ === '标签') byMetric[metricName].tags.push(attr);
  }
  return byMetric;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function genValue(name, id) {
  const h = hash(id + name);
  if (/占比|率|渗透率|份额|饱和度|迁出/.test(name)) {
    const v = 8 + (h % 72);
    return `${v}.${h % 10}%`;
  }
  if (/增幅|提升|贡献/.test(name)) {
    const sign = h % 3 === 0 ? '-' : '+';
    return `${sign}${(h % 18) + 1}.${h % 10}%`;
  }
  if (/DOU|流量|万G|GB|TB/.test(name) && !/占比/.test(name)) {
    return `${((h % 1800) + 200) / 10}万G`;
  }
  if (/ARPU|金额|收入|单价|超套/.test(name)) {
    return `¥${((h % 120) + 35)}.${h % 10}`;
  }
  if (/客户数|人数|规模|领取|办理|发展|升档|降档|用户/.test(name)) {
    if (h % 4 === 0) return `${((h % 900) + 100) / 10}万`;
    return `${(h % 90) + 10}万`;
  }
  return `${(h % 500) + 50}.${h % 10}万`;
}

function genYoyMom(name, id, alert) {
  const h = hash(id + 'ym');
  const ySign = alert ? '-' : '+';
  const mSign = alert && h % 2 === 0 ? '-' : '+';
  if (/占比|率|渗透率|份额|饱和度|pp/.test(name)) {
    return { yoy: `${ySign}${(h % 5) + 1}.${h % 10}pp`, mom: `${mSign}${(h % 3) + 1}.${(h + 3) % 10}pp` };
  }
  return { yoy: `${ySign}${(h % 12) + 2}.${h % 10}%`, mom: `${mSign}${(h % 8) + 1}.${(h + 2) % 10}%` };
}

function shouldAlert(name, id) {
  const h = hash(id);
  if (/降档|流失|双降|单降|超套|价值下降|异网|流失损失|沉默|迁出/.test(name)) return h % 3 !== 0;
  if (/增幅|贡献|升档|融合率|续约/.test(name)) return h % 5 === 0;
  return h % 7 === 0;
}

function countMetricNodes(node) {
  let n = node.nodeType === 'metric' ? 1 : 0;
  for (const ch of node.children || []) n += countMetricNodes(ch);
  return n;
}

function skeletonToInsight(node, pathIds, attrMap, metricList, idxRef, inheritedAttr) {
  const id = pathIds.join('-') || 'tf-root';
  const name = node.name;
  const isCategory = node.nodeType === 'category';

  if (isCategory) {
    const out = {
      id,
      name,
      type: 'category',
      children: []
    };
    (node.children || []).forEach((ch, i) => {
      out.children.push(skeletonToInsight(ch, [...pathIds, i], attrMap, metricList, idxRef, inheritedAttr));
    });
    return out;
  }

  const alert = shouldAlert(name, id);
  const { yoy, mom } = genYoyMom(name, id, alert);
  const value = genValue(name, id);
  const caliber = `流量运营场景指标 · ${name} · 统计粒度：省份 · 更新周期：月 · 口径见江西流量运营指标树梳理表 v3.3`;

  const attr = attrMap[name] || inheritedAttr || {};
  const relatedTags = attr.tags?.length ? attr.tags.slice(0, 8) : [];
  const relatedMetrics = attr.metrics?.length ? attr.metrics.slice(0, 6) : [];
  const childAttr = attrMap[name] || (attr.tags?.length || attr.metrics?.length ? attr : inheritedAttr);

  idxRef.n += 1;
  const metricCode = `KPI_TF_${String(idxRef.n).padStart(3, '0')}`;
  metricList.push({
    id: `kpi-tf-${idxRef.n}`,
    code: metricCode,
    name,
    scene: SCENE,
    granularity: '省份',
    period: '月'
  });

  const out = {
    id,
    name,
    type: 'metric',
    metric: { id: `kpi-tf-${idxRef.n}`, code: metricCode, name, scene: SCENE, granularity: '省份', period: '月' },
    value,
    yoy,
    mom,
    status: alert ? 'alert' : 'normal',
    caliber,
    alert,
    relatedTags,
    relatedMetrics,
    children: []
  };

  (node.children || []).forEach((ch, i) => {
    out.children.push(skeletonToInsight(ch, [...pathIds, i], attrMap, metricList, idxRef, childAttr));
  });
  return out;
}

const SEG_ALIAS = {
  'seg-tf-downgrade': 'seg-high-downgrade',
  'seg-tf-churn-risk': 'seg-churn-risk',
  'seg-tf-dou-high': 'seg-out-package',
  'seg-tf-fusion': 'seg-contract-end',
  'seg-tf-scale': 'seg-video-pack'
};

function buildSegmentMap(root, map = {}) {
  function walk(n) {
    if (n.type === 'category') {
      (n.children || []).forEach(walk);
      return;
    }
    const ids = [];
    if (n.alert || n.status === 'alert') {
      if (/降档|ARPU|价值|超套|资费/.test(n.name || '')) ids.push('seg-tf-downgrade');
      if (/流失|双降|单降|沉默|异网|迁出/.test(n.name || '')) ids.push('seg-tf-churn-risk');
      if (/5G|DOU|流量|套外|饱和|万G/.test(n.name || '')) ids.push('seg-tf-dou-high');
      if (/融合|合约|宽带/.test(n.name || '')) ids.push('seg-tf-fusion');
    }
    if (!ids.length && /客户数|规模|用户/.test(n.name || '')) ids.push('seg-tf-scale');
    if (ids.length) map[n.id] = [...new Set(ids.map((k) => SEG_ALIAS[k] || k))];
    (n.children || []).forEach(walk);
  }
  walk(root);
  return map;
}

const { sharedXml, sheet1, sheet2 } = await loadWorkbook();
const strings = parseSharedStrings(sharedXml);
const rows1 = parseSheetRows(sheet1, strings);
const skeleton = buildTreeFromSheet(rows1);
const attrMap = parseAttributions(sheet2, strings);

const metricList = [];
const idxRef = { n: 0 };
const insightRoot = skeletonToInsight(skeleton, ['tf'], attrMap, metricList, idxRef);
const metricCount = countMetricNodes(skeleton);
const segmentMap = buildSegmentMap(insightRoot);

const js = `/** 流量运营指标树 — 由 Excel v3.3 梳理表自动生成，请勿手改 */
(function () {
  window.TRAFFIC_FLOW_TREE_CODE = '${CODE}';
  window.TRAFFIC_FLOW_INSIGHT_ID = '${INSIGHT_ID}';
  window.TRAFFIC_FLOW_METRIC_COUNT = ${metricCount};
  window.TRAFFIC_FLOW_METRICS = ${JSON.stringify(metricList, null, 2)};

  const insightRoot = ${JSON.stringify(insightRoot, null, 2)};

  window.getTrafficFlowInsightDetail = function () {
    return {
      name: '${TREE_DISPLAY_NAME}',
      category: '流量运营',
      root: JSON.parse(JSON.stringify(insightRoot))
    };
  };

  window.TRAFFIC_FLOW_SEGMENT_MAP = ${JSON.stringify(segmentMap, null, 2)};

  window.isTrafficFlowTreeNode = function (node) {
    if (!node) return false;
    const id = String(node.id || '');
    return id.startsWith('tf-');
  };

  window.resolveTrafficFlowSegmentIds = function (node) {
    if (!node || !window.isTrafficFlowTreeNode(node)) return null;
    const mapped = window.TRAFFIC_FLOW_SEGMENT_MAP?.[node.id];
    if (mapped?.length) return mapped;
    if (/降档|ARPU|超套|价值/.test(node.name || '')) return ['seg-tf-downgrade', 'seg-tf-churn-risk'];
    if (/流失|双降|单降|沉默|异网|迁出/.test(node.name || '')) return ['seg-tf-churn-risk'];
    if (/DOU|流量|5G|套外|饱和|万G/.test(node.name || '')) return ['seg-tf-dou-high'];
    if (/融合|合约|宽带/.test(node.name || '')) return ['seg-tf-fusion'];
    return ['seg-tf-scale', 'seg-tf-dou-high'];
  };

  window.getTrafficFlowMetricDetailCopy = function (node) {
    const name = node?.name || '指标';
    const tags = (node.relatedTags || []).slice(0, 3).join('、');
    if (/降档|ARPU|价值下降|超套/.test(name)) {
      return '该指标与流量价值转化及资费风险相关' + (tags ? '，关联标签：' + tags + '。' : '。') + '建议查看根因分析与降档风险客群。';
    }
    if (/DOU|流量|5G|饱和|万G/.test(name)) {
      return '该指标反映流量规模与使用结构' + (tags ? '，可结合：' + tags + '。' : '。') + '建议对比套餐内/套外结构变化。';
    }
    if (/流失|双降|单降|异网|迁出/.test(name)) {
      return '该指标体现客户流失与用量下滑风险，建议联动离网维系与融合加固策略。';
    }
    return '该指标属于流量运营监测体系，可结合趋势、根因、客群与关联标签制定运营动作。';
  };

  window.getTrafficFlowRootCauseBranches = function (node) {
    const name = node?.name || '指标';
    const tags = node?.relatedTags || [];
    const relatedMetrics = node?.relatedMetrics || [];
    const tagPool = tags.length ? tags : ['是否融合客户', '是否固移融合客户', '中高端高饱和', '近3个月套餐活动到期客户', '是否我主异副'];
    if (relatedMetrics.length) {
      return relatedMetrics.slice(0, 3).map(function (m, i) {
        return {
          metric: m, value: '—', contrib: 38 - i * 8, mom: '+5.2%',
          tags: tagPool.slice(0, 5),
          rules: [{ label: '组合A', expr: (tagPool[0] || '标签A') + ' AND ' + (tagPool[1] || '标签B') }],
          segments: [{ rule: '组合A', name: name + '·重点客群', scale: '12,480' }]
        };
      });
    }
    return [
      { metric: '当月_降档量', value: '1.28万', contrib: 36, mom: '+8.2%', tags: tagPool,
        rules: [{ label: '组合A', expr: '折后ARPU环比下降>30% AND 套餐降档倾向' }],
        segments: [{ rule: '组合A', name: '降档风险客群', scale: '12,480' }] },
      { metric: '当月_升档量', value: '2.06万', contrib: 28, mom: '+4.6%', tags: tagPool.slice(0, 4),
        rules: [{ label: '组合A', expr: '5G升档意向 AND 流量饱和度>=80%' }],
        segments: [{ rule: '组合A', name: '升档机会客群', scale: '18,620' }] }
    ];
  };

  window.buildTrafficFlowAnomalyReport = function (metricName, detectType, branches) {
    const top = branches.slice(0, 2).map((b) => b.metric).join('、');
    return {
      title: '流量运营 · 异常根因分析报告',
      summary: '「' + metricName + '」在<strong>流量运营</strong>场景出现异常，主要联动指标：' + top + '。建议结合关联标签组合进行精准施策。',
      points: detectType === 'rule'
        ? ['预警规则连续命中，与流量规模/客户价值分支指标同向波动。', '降档、超套、双降等标签组合贡献度靠前。', '建议优先对高贡献路径下发流量包升档与融合加固任务。']
        : ['异常检测模型评分超阈，用量结构类子指标贡献显著。', '归因路径显示多标签可解释波动，需分路径制定运营方案。', '建议对高饱和、近到期客群先行触达。'],
      generatedAt: '2026-05-28 10:00'
    };
  };

  window.fillTrafficFlowAlertPanel = function (node) {
    if (typeof renderMetricAlertPanel === 'function') renderMetricAlertPanel(node);
  };

  window.registerTrafficFlowTreeData = function () {
    const existing = new Set((window.METRIC_OPTIONS || []).map(function (m) { return m.id; }));
    window.TRAFFIC_FLOW_METRICS.forEach(function (m) {
      if (!existing.has(m.id)) window.METRIC_OPTIONS.push(m);
    });
    Object.assign(window.METRIC_SEGMENT_MAP || (window.METRIC_SEGMENT_MAP = {}), window.TRAFFIC_FLOW_SEGMENT_MAP);
    if (window.TREE_DETAIL_DATA) {
      window.TREE_DETAIL_DATA[window.TRAFFIC_FLOW_INSIGHT_ID] = window.getTrafficFlowInsightDetail();
    }
    if (window.INDICATOR_TREES) {
      const t = window.INDICATOR_TREES.find(function (x) { return x.id === window.TRAFFIC_FLOW_INSIGHT_ID; });
      if (t) {
        t.name = '${TREE_DISPLAY_NAME}';
        t.metricCount = ${metricCount};
        t.updatedAt = '2026-05-28 10:00';
      }
    }
  };

  window.registerTrafficFlowTreeData();
})();
`;

fs.writeFileSync(OUT_PATH, js, 'utf8');
console.log('Wrote', OUT_PATH);
console.log('Root:', insightRoot.name, 'Metrics:', metricCount, 'KPI records:', metricList.length);
console.log('Categories+metrics nodes:', JSON.stringify(insightRoot).match(/"type":"category"/g)?.length || 0, 'categories');
