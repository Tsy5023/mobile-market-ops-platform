import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../assets/js/indicator-tree-he-churn-data.js');

const SCENE = '公众市场 / 存量运营 / 中高端客户流失';
const CODE = '202605220001';
const INSIGHT_ID = 'tree-he-churn';

function m(id, code, name) {
  return { id, code, name, scene: SCENE, granularity: '省份', period: '月' };
}

const metrics = [
  m('kpi-hcd-001', 'KPI_HCD_001', '中高端客户流失规模'),
  m('kpi-hcd-002', 'KPI_HCD_002', '中高端客户规模'),
  m('kpi-hcd-003', 'KPI_HCD_003', '全球通银卡及以上占比'),
  m('kpi-hcd-004', 'KPI_HCD_004', '金卡及以上占比'),
  m('kpi-hcd-005', 'KPI_HCD_005', '银卡客户占比'),
  m('kpi-hcd-006', 'KPI_HCD_006', '合约在网客户占比'),
  m('kpi-hcd-007', 'KPI_HCD_007', '融合捆绑渗透率'),
  m('kpi-hcd-008', 'KPI_HCD_008', '离网预警客户数'),
  m('kpi-hcd-009', 'KPI_HCD_009', '中高端离网率'),
  m('kpi-hcd-010', 'KPI_HCD_010', '主动离网率'),
  m('kpi-hcd-011', 'KPI_HCD_011', '被动离网率'),
  m('kpi-hcd-012', 'KPI_HCD_012', '携转查询客户数'),
  m('kpi-hcd-013', 'KPI_HCD_013', '异网携转查询量'),
  m('kpi-hcd-014', 'KPI_HCD_014', '本网携入查询量'),
  m('kpi-hcd-015', 'KPI_HCD_015', '降档预警客户数'),
  m('kpi-hcd-016', 'KPI_HCD_016', '沉默流失风险客户数'),
  m('kpi-hcd-017', 'KPI_HCD_017', '套餐降档办理量'),
  m('kpi-hcd-018', 'KPI_HCD_018', '主动降档量'),
  m('kpi-hcd-019', 'KPI_HCD_019', '活动到期降档量'),
  m('kpi-hcd-020', 'KPI_HCD_020', '账单异议工单量'),
  m('kpi-hcd-021', 'KPI_HCD_021', 'APP活跃下降客户占比'),
  m('kpi-hcd-022', 'KPI_HCD_022', '厅店接触频次下降客户占比'),
  m('kpi-hcd-023', 'KPI_HCD_023', '90天零厅店接触占比'),
  m('kpi-hcd-024', 'KPI_HCD_024', '自助渠道替代占比'),
  m('kpi-hcd-025', 'KPI_HCD_025', '外呼触达率'),
  m('kpi-hcd-026', 'KPI_HCD_026', '维系成功率'),
  m('kpi-hcd-027', 'KPI_HCD_027', '合约续约成功率'),
  m('kpi-hcd-028', 'KPI_HCD_028', '专属优惠挽回成功率'),
  m('kpi-hcd-029', 'KPI_HCD_029', '续约办理量'),
  m('kpi-hcd-030', 'KPI_HCD_030', '专属权益领取率'),
  m('kpi-hcd-031', 'KPI_HCD_031', '中高端客户ARPU'),
  m('kpi-hcd-032', 'KPI_HCD_032', '语音ARPU'),
  m('kpi-hcd-033', 'KPI_HCD_033', '流量ARPU'),
  m('kpi-hcd-034', 'KPI_HCD_034', '增值ARPU'),
  m('kpi-hcd-035', 'KPI_HCD_035', '流失带来月收入损失'),
  m('kpi-hcd-036', 'KPI_HCD_036', '降档损失ARPU'),
  m('kpi-hcd-037', 'KPI_HCD_037', '挽回后ARPU回升幅度')
];
const metricByName = Object.fromEntries(metrics.map((x) => [x.name, x]));

function L(id, name, value, yoy, mom, status, caliber, alert) {
  const met = metricByName[name];
  return { id, name, metric: met, value, yoy, mom, status, caliber, alert: !!alert, children: [] };
}
function G(id, name, value, yoy, mom, status, caliber, children, alert) {
  return { id, name, value, yoy, mom, status, caliber, alert: !!alert, children };
}

const insightRoot = G(
  'hcd-root',
  '中高端客户流失规模',
  '8.42万',
  '+12.4%',
  '+5.2%',
  'alert',
  '统计周期内发生流失（含离网、携转出网）的中高端客户数，单位：户',
  [
    G('hcd-s1', '客群规模与结构', '328万', '+2.1%', '+0.8%', 'normal', '中高端客户总量及结构指标', [
      L('hcd-s1-1', '中高端客户规模', '328万', '+2.1%', '+0.8%', 'normal', 'ARPU≥89元或全球通银卡及以上'),
      G('hcd-s1-2', '全球通银卡及以上占比', '62.4%', '+1.2pp', '+0.5pp', 'normal', '银卡及以上等级客户占比', [
        L('hcd-s1-2a', '金卡及以上占比', '28.6%', '+0.8pp', '+0.3pp', 'normal', '金卡、白金、钻石等级占比'),
        L('hcd-s1-2b', '银卡客户占比', '33.8%', '+0.4pp', '+0.2pp', 'normal', '全球通银卡客户占比')
      ]),
      L('hcd-s1-3', '合约在网客户占比', '71.2%', '-1.5pp', '-0.6pp', 'alert', '有效合约客户/中高端客户', true),
      L('hcd-s1-4', '融合捆绑渗透率', '76.4%', '+3.2pp', '+1.1pp', 'normal', '办理融合业务客户占比')
    ]),
    G('hcd-s2', '流失风险监测', '—', '—', '—', 'alert', '离网、携转、降档等风险类指标', [
      L('hcd-s2-1', '离网预警客户数', '4.28万', '+12.4%', '+5.2%', 'alert', '模型识别7日内高离网概率客户', true),
      G('hcd-s2-2', '中高端离网率', '0.82%', '-0.1pp', '+0.05pp', 'alert', '当月离网/月初中高端客户', [
        L('hcd-s2-2a', '主动离网率', '0.51%', '+0.02pp', '+0.04pp', 'alert', '客户主动申请离网占比', true),
        L('hcd-s2-2b', '被动离网率', '0.31%', '-0.12pp', '+0.01pp', 'normal', '欠费销户等被动离网占比')
      ], true),
      G('hcd-s2-3', '携转查询客户数', '1.86万', '+18.6%', '+8.4%', 'alert', '近30日携号转网查询客户', [
        L('hcd-s2-3a', '异网携转查询量', '1.42万', '+22.1%', '+9.6%', 'alert', '向异网发起携转查询量', true),
        L('hcd-s2-3b', '本网携入查询量', '0.44万', '+8.2%', '+3.1%', 'normal', '本网作为携入方查询量')
      ], true),
      L('hcd-s2-4', '降档预警客户数', '2.15万', '+15.8%', '+6.3%', 'alert', '近30日有降档倾向或比价行为客户', true),
      L('hcd-s2-5', '沉默流失风险客户数', '3.62万', '+9.4%', '+4.1%', 'alert', '90天低接触且消费下滑客户', true)
    ], true),
    G('hcd-s3', '行为异动信号', '—', '—', '—', 'alert', '客户使用与办理行为异常', [
      G('hcd-s3-1', '套餐降档办理量', '8,420', '+24.6%', '+11.2%', 'alert', '当月办理降档业务笔数', [
        L('hcd-s3-1a', '主动降档量', '5,180', '+28.4%', '+13.5%', 'alert', '客户主动申请降档', true),
        L('hcd-s3-1b', '活动到期降档量', '3,240', '+18.2%', '+7.8%', 'alert', '优惠到期自动降档', true)
      ], true),
      L('hcd-s3-2', '账单异议工单量', '1,256', '+32.1%', '+14.6%', 'alert', '当月账单相关投诉工单', true),
      L('hcd-s3-3', 'APP活跃下降客户占比', '18.6%', '+4.2pp', '+2.1pp', 'alert', '近30日APP活跃环比下降客户', true),
      G('hcd-s3-4', '厅店接触频次下降客户占比', '14.2%', '+3.8pp', '+1.6pp', 'alert', '厅店接触频次环比下降客户', [
        L('hcd-s3-4a', '90天零厅店接触占比', '9.8%', '+2.6pp', '+1.2pp', 'alert', '90天无线下厅店接触', true),
        L('hcd-s3-4b', '自助渠道替代占比', '22.4%', '+5.1pp', '+2.4pp', 'normal', '自助渠道办理占比提升')
      ], true)
    ], true),
    G('hcd-s4', '维系触达与成效', '—', '—', '—', 'normal', '挽留动作与结果指标', [
      L('hcd-s4-1', '外呼触达率', '68.5%', '+5.2pp', '+2.8pp', 'normal', '预警客户外呼接通占比'),
      G('hcd-s4-2', '维系成功率', '34.2%', '+3.6pp', '+1.4pp', 'normal', '成功挽留/离网预警客户', [
        L('hcd-s4-2a', '合约续约成功率', '41.8%', '+4.1pp', '+1.8pp', 'normal', '合约到期客户续约成功占比'),
        L('hcd-s4-2b', '专属优惠挽回成功率', '28.6%', '+2.8pp', '+1.1pp', 'normal', '专属优惠方案挽回占比')
      ]),
      L('hcd-s4-3', '续约办理量', '12,640', '+8.4%', '+4.2%', 'normal', '当月合约续约办理笔数'),
      L('hcd-s4-4', '专属权益领取率', '52.3%', '+6.8pp', '+3.2pp', 'normal', '全球通专属权益领取占比')
    ]),
    G('hcd-s5', '价值与收入影响', '—', '—', '—', 'alert', '流失与降档对收入的影响', [
      G('hcd-s5-1', '中高端客户ARPU', '¥128.6', '+1.5%', '-0.3%', 'alert', '中高端客户月均ARPU', [
        L('hcd-s5-1a', '语音ARPU', '¥18.2', '-2.1%', '-0.8%', 'normal', '语音出账月均'),
        L('hcd-s5-1b', '流量ARPU', '¥62.4', '+2.8%', '+0.5%', 'normal', '流量出账月均'),
        L('hcd-s5-1c', '增值ARPU', '¥48.0', '+0.6%', '-0.4%', 'alert', '增值业务出账月均', true)
      ], true),
      L('hcd-s5-2', '流失带来月收入损失', '¥2,860万', '+18.4%', '+9.2%', 'alert', '离网客户预估月收入损失', true),
      L('hcd-s5-3', '降档损失ARPU', '¥12.4', '+22.6%', '+10.8%', 'alert', '降档客户户均ARPU损失', true),
      L('hcd-s5-4', '挽回后ARPU回升幅度', '¥8.6', '+4.2%', '+1.8%', 'normal', '成功挽回客户ARPU回升均值')
    ], true)
  ],
  true
);

function countNodes(n) {
  let c = 1;
  (n.children || []).forEach((ch) => {
    c += countNodes(ch);
  });
  return c;
}

function toInsight(n) {
  const o = {
    id: n.id,
    name: n.name,
    value: n.value,
    yoy: n.yoy,
    mom: n.mom,
    status: n.status,
    caliber: n.caliber,
    children: (n.children || []).map(toInsight)
  };
  if (n.alert) o.alert = true;
  return o;
}

function toEditor(n, isRoot) {
  const eid = isRoot ? 'n-he-root' : 'n-he-' + n.id.replace('hcd-', '');
  const hasKids = n.children && n.children.length;
  if (hasKids) {
    return {
      id: eid,
      name: n.name,
      type: 'category',
      metricId: '',
      metricCode: '',
      metricName: '',
      children: n.children.map((c) => toEditor(c))
    };
  }
  const met = n.metric || metricByName[n.name];
  return {
    id: eid,
    name: n.name,
    type: 'metric',
    metricId: met?.id || '',
    metricCode: met?.code || '',
    metricName: met?.name || n.name,
    children: []
  };
}

const editorTree = {
  meta: {
    name: '中高端客户流失指标树',
    region: '全国',
    granularity: '省份',
    scene: SCENE,
    description:
      '面向中高端客户流失场景的端到端指标树：覆盖客群结构、流失风险、行为异动、维系成效与收入影响，支撑预警、归因与客群联动分析。'
  },
  nodes: toEditor(insightRoot, true)
};

const segmentMap = {
  'hcd-root': ['seg-high-downgrade', 'seg-churn-risk'],
  'hcd-s1': ['seg-high-downgrade'],
  'hcd-s1-1': ['seg-high-downgrade'],
  'hcd-s1-3': ['seg-contract-end'],
  'hcd-s2': ['seg-churn-risk', 'seg-high-downgrade'],
  'hcd-s2-1': ['seg-churn-risk'],
  'hcd-s2-2': ['seg-churn-risk', 'seg-high-downgrade'],
  'hcd-s2-2a': ['seg-churn-risk'],
  'hcd-s2-3': ['seg-churn-risk'],
  'hcd-s2-3a': ['seg-churn-risk'],
  'hcd-s2-4': ['seg-high-downgrade'],
  'hcd-s2-5': ['seg-low-touch'],
  'hcd-s3': ['seg-high-downgrade', 'seg-low-touch'],
  'hcd-s3-1': ['seg-high-downgrade'],
  'hcd-s3-1a': ['seg-high-downgrade'],
  'hcd-s3-2': ['seg-churn-risk'],
  'hcd-s3-3': ['seg-low-touch'],
  'hcd-s3-4a': ['seg-low-touch'],
  'hcd-s4-2': ['seg-contract-end', 'seg-churn-risk'],
  'hcd-s5-1': ['seg-high-downgrade'],
  'hcd-s5-2': ['seg-churn-risk'],
  'hcd-s5-3': ['seg-high-downgrade']
};

const insightJson = toInsight(insightRoot);
const nodeCount = countNodes(insightRoot);

const out =
  '/** 中高端客户流失 — 指标树演示数据（配置 + 洞察） */\n' +
  '(function () {\n' +
  "  window.HE_CHURN_TREE_CODE = '" +
  CODE +
  "';\n" +
  "  window.HE_CHURN_INSIGHT_ID = '" +
  INSIGHT_ID +
  "';\n" +
  '  window.HE_CHURN_METRIC_COUNT = ' +
  nodeCount +
  ';\n' +
  '  window.HE_CHURN_METRICS = ' +
  JSON.stringify(metrics, null, 2) +
  ';\n\n' +
  '  const insightRoot = ' +
  JSON.stringify(insightJson, null, 2) +
  ';\n\n' +
  '  window.getHeChurnEditorTree = function () {\n' +
  '    return ' +
  JSON.stringify(editorTree, null, 2) +
  ';\n' +
  '  };\n\n' +
  '  window.getHeChurnInsightDetail = function () {\n' +
  '    return {\n' +
  "      name: '中高端客户流失指标树',\n" +
  "      category: '中高端保有',\n" +
  '      root: JSON.parse(JSON.stringify(insightRoot))\n' +
  '    };\n' +
  '  };\n\n' +
  '  window.HE_CHURN_SEGMENT_MAP = ' +
  JSON.stringify(segmentMap, null, 2) +
  ';\n\n' +
  '  window.registerHeChurnTreeData = function () {\n' +
  '    const existing = new Set((window.METRIC_OPTIONS || []).map(function (m) { return m.id; }));\n' +
  '    window.HE_CHURN_METRICS.forEach(function (m) {\n' +
  '      if (!existing.has(m.id)) window.METRIC_OPTIONS.push(m);\n' +
  '    });\n' +
  '    window.TREE_EDITOR_DATA = window.TREE_EDITOR_DATA || {};\n' +
  '    window.TREE_EDITOR_DATA[window.HE_CHURN_TREE_CODE] = window.getHeChurnEditorTree();\n' +
  '    Object.assign(window.METRIC_SEGMENT_MAP || (window.METRIC_SEGMENT_MAP = {}), window.HE_CHURN_SEGMENT_MAP);\n' +
  '    if (window.TREE_DETAIL_DATA) {\n' +
  '      window.TREE_DETAIL_DATA[window.HE_CHURN_INSIGHT_ID] = window.getHeChurnInsightDetail();\n' +
  '    }\n' +
  '  };\n' +
  '})();\n';

fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath, 'nodes:', nodeCount);
