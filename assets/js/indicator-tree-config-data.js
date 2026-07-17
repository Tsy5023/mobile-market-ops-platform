/** 指标树配置 - 列表与编辑器演示数据 */
window.TREE_CONFIG_LIST = [
  {
    code: '202605280001',
    name: '流量运营',
    scene: '公众市场 / 流量运营',
    status: 'online',
    version: 1,
    region: '江西省',
    granularity: '省份',
    creator: '张明',
    createdAt: '2026-05-28 10:00:00',
    modifier: '张明',
    modifiedAt: '2026-05-28 10:00:00',
    validFrom: '2026-05-28',
    validTo: '2099-12-31',
    insightId: 'tree-traffic-flow',
    metricCount: 331,
    algorithmScene: 'traffic_rca'
  },
  {
    code: '202605220001',
    name: '中高端客户流失指标树',
    scene: '公众市场 / 存量运营 / 中高端客户流失',
    status: 'online',
    version: 1,
    region: '全国',
    granularity: '省份',
    creator: '李敏',
    createdAt: '2026-05-22 09:00:00',
    modifier: '李敏',
    modifiedAt: '2026-05-22 09:00:00',
    validFrom: '2026-05-22',
    validTo: '2099-12-31',
    insightId: 'tree-he-churn',
    metricCount: 42,
    algorithmScene: 'loss_control_rca'
  },
  { code: '202605159249', name: '月度离网客户规模', scene: '公众市场 / 存量运营 / 中高端客户运营', status: 'draft', version: 1, region: '全国', granularity: '省份', creator: '超级管理员', createdAt: '2026-05-15 14:22:33', modifier: '超级管理员', modifiedAt: '2026-05-15 14:22:33', validFrom: '2026-05-15', validTo: '2099-12-31' },
  { code: '202605159248', name: '中高端客户运营', scene: '公众市场 / 存量运营 / 中高端客户运营', status: 'online', version: 3, region: '全国', granularity: '集团', creator: '超级管理员', createdAt: '2026-05-15 14:22:33', modifier: '超级管理员', modifiedAt: '2026-05-15 14:22:33', validFrom: '2026-05-15', validTo: '2099-12-31' },
  { code: '202605159247', name: '中高端客户运营', scene: '公众市场 / 存量运营 / 中高端客户运营', status: 'online', version: 4, region: '全国', granularity: '集团', creator: '超级管理员', createdAt: '2026-05-15 14:22:33', modifier: '超级管理员', modifiedAt: '2026-05-15 14:22:33', validFrom: '2026-05-15', validTo: '2099-12-31' },
  { code: '202605159246', name: '中高端客户运营', scene: '公众市场 / 存量运营 / 中高端客户运营', status: 'online', version: 5, region: '全国', granularity: '集团', creator: '超级管理员', createdAt: '2026-05-15 14:22:33', modifier: '超级管理员', modifiedAt: '2026-05-15 14:22:33', validFrom: '2026-05-15', validTo: '2099-12-31' },
  { code: '202605159245', name: '流量收入分析指标树', scene: '公众市场 / 流量运营 / 收入分析', status: 'online', version: 2, region: '江西省', granularity: '省份', creator: '张明', createdAt: '2026-05-14 10:15:00', modifier: '李敏', modifiedAt: '2026-05-18 09:30:00', validFrom: '2026-05-01', validTo: '2099-12-31', algorithmScene: 'traffic_rca' },
  { code: '202605159244', name: '离网维系监控指标树', scene: '公众市场 / 存量运营 / 离网维系', status: 'draft', version: 1, region: '全国', granularity: '省份', creator: '李敏', createdAt: '2026-05-13 16:40:00', modifier: '李敏', modifiedAt: '2026-05-13 16:40:00', validFrom: '', validTo: '', algorithmScene: 'loss_control_rca' },
  { code: '202605159243', name: '家庭融合运营指标树', scene: '公众市场 / 家庭运营 / 融合增收', status: 'online', version: 1, region: '江西省', granularity: '地市', creator: '王芳', createdAt: '2026-05-12 11:20:00', modifier: '王芳', modifiedAt: '2026-05-19 14:00:00', validFrom: '2026-05-12', validTo: '2099-12-31' },
  { code: '202605159242', name: '国际漫游收入指标树', scene: '公众市场 / 国际业务运营', status: 'offline', version: 2, region: '全国', granularity: '集团', creator: '超级管理员', createdAt: '2026-05-10 09:00:00', modifier: '超级管理员', modifiedAt: '2026-05-20 08:00:00', validFrom: '2026-01-01', validTo: '2026-05-19' }
];

// 生成更多列表数据至 40 条
(function () {
  const scenes = ['公众市场 / 存量运营 / 中高端客户运营', '公众市场 / 流量运营 / 收入分析', '公众市场 / 离网维系', '公众市场 / 家庭运营'];
  const algoScenes = ['loss_control_rca', 'traffic_rca', 'loss_control_rca', 'traffic_rca'];
  const names = ['价值提升指标树', '5G渗透指标树', '套餐结构指标树', '渠道效能指标树'];
  const statuses = ['online', 'online', 'draft', 'draft'];
  let i = 0;
  while (TREE_CONFIG_LIST.length < 40) {
    const s = statuses[i % statuses.length];
    TREE_CONFIG_LIST.push({
      code: '20260515' + String(9200 - TREE_CONFIG_LIST.length).padStart(4, '0'),
      name: names[i % names.length] + (TREE_CONFIG_LIST.length > 8 ? ' ' + TREE_CONFIG_LIST.length : ''),
      scene: scenes[i % scenes.length],
      algorithmScene: algoScenes[i % algoScenes.length],
      status: s,
      version: (i % 5) + 1,
      region: i % 2 ? '江西省' : '全国',
      granularity: ['集团', '省份', '地市'][i % 3],
      creator: '超级管理员',
      createdAt: '2026-05-' + String(10 + (i % 10)).padStart(2, '0') + ' 10:00:00',
      modifier: '超级管理员',
      modifiedAt: '2026-05-20 12:00:00',
      validFrom: s === 'draft' ? '' : '2026-05-01',
      validTo: s === 'offline' ? '2026-05-19' : (s === 'draft' ? '' : '2099-12-31')
    });
    i++;
  }
})();

window.TREE_STATUS_MAP = {
  draft: { label: '草稿', dot: '#94a3b8', badge: 'badge-info' },
  online: { label: '上线', dot: '#16a34a', badge: 'badge-success' },
  offline: { label: '下线', dot: '#64748b', badge: 'badge-warning' },
  published: { label: '上线', dot: '#16a34a', badge: 'badge-success' },
  publishing: { label: '草稿', dot: '#94a3b8', badge: 'badge-info' }
};

window.resolveTreeAlgorithmScene = function (row) {
  if (!row) return '';
  if (row.algorithmScene) return row.algorithmScene;
  const hay = (row.scene || '') + (row.name || '');
  if (/流量/.test(hay)) return 'traffic_rca';
  if (/流失|离网|控损|中高端/.test(hay)) return 'loss_control_rca';
  return '';
};

window.getDefaultEditorTree = function () {
  return {
    meta: {
      name: '',
      scene: '公众市场 / 国际业务运营 / 国际业务运营',
      algorithmScene: '',
      description: ''
    },
    nodes: {
      id: 'n1',
      name: '请选择指标',
      type: 'metric',
      metricId: '',
      metricCode: '',
      metricName: '',
      children: []
    }
  };
};

function hashEditorMetric(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function demoPctFromId(id, role) {
  const h = hashEditorMetric(id + role);
  const v = (h % 24) - 8;
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
}

function demoValueFromMetric(metricId, metricName) {
  const name = metricName || '';
  const h = hashEditorMetric(metricId || name);
  if (/率|%|占比|渗透/.test(name)) return (5 + (h % 180) / 10).toFixed(1) + '%';
  if (/万/.test(name) || /收入|ARPU/.test(name)) return '¥ ' + (800 + h % 4200).toLocaleString('zh-CN') + '万';
  if (/亿/.test(name)) return (1 + (h % 80) / 10).toFixed(2) + '亿';
  return (1000 + h % 9000).toLocaleString('zh-CN');
}

window.convertEditorNodeToDetail = function (node) {
  if (!node) return null;
  if (node.type === 'category') {
    return {
      id: node.id,
      name: node.name,
      type: 'category',
      children: (node.children || []).map(c => window.convertEditorNodeToDetail(c)).filter(Boolean)
    };
  }
  const main = typeof window.getMetricById === 'function' ? window.getMetricById(node.metricId) : null;
  const name = node.name || node.metricName || main?.name || '—';
  const alert = hashEditorMetric(node.id) % 6 === 0;
  return {
    id: node.id,
    name,
    value: demoValueFromMetric(node.metricId, name),
    yoy: demoPctFromId(node.metricId || node.id, 'yoy'),
    mom: demoPctFromId(node.metricId || node.id, 'mom'),
    status: alert ? 'alert' : 'normal',
    alert,
    caliber: main ? (name + ' · 业务口径（指标库）') : '—',
    children: (node.children || []).map(c => window.convertEditorNodeToDetail(c)).filter(Boolean)
  };
};

window.getDetailFromEditorTree = function (editorTree) {
  if (!editorTree?.nodes) return null;
  return {
    name: editorTree.meta?.name || '指标树',
    category: editorTree.meta?.scene || '',
    root: window.convertEditorNodeToDetail(editorTree.nodes)
  };
};

/** 可选指标列表（单指标，非指标组） */
window.METRIC_OPTIONS = [
  { id: 'kpi-fl-rev-001', code: 'KPI_FL_REV_001', name: '流量总收入', scene: '公众市场 / 流量运营 / 收入分析', granularity: '省份', period: '日', unit: '万元', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-fl-rev-002', code: 'KPI_FL_REV_002', name: '套餐内收入', scene: '公众市场 / 流量运营 / 收入分析', granularity: '省份', period: '日', unit: '万元', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-fl-rev-003', code: 'KPI_FL_REV_003', name: '套外收入', scene: '公众市场 / 流量运营 / 收入分析', granularity: '省份', period: '日', unit: '万元', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-fl-rev-010', code: 'KPI_FL_REV_010', name: '视频定向包收入', scene: '公众市场 / 流量运营 / 收入分析', granularity: '省份', period: '日', unit: '万元', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-roam-001', code: 'KPI_ROAM_001', name: '累计_国漫流量月包产品订购量', scene: '公众市场 / 国际业务运营 / 国际业务', granularity: '省份', period: '月', unit: '户', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-roam-002', code: 'KPI_ROAM_002', name: '当月_国漫流量月包产品订购量', scene: '公众市场 / 国际业务运营 / 国际业务', granularity: '省份', period: '月', unit: '户', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-eu-001', code: 'KPI_EU_001', name: '累计_欧洲多国流量包产品订购量', scene: '公众市场 / 国际业务运营 / 国际业务', granularity: '省份', period: '月', unit: '户', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-he-001', code: 'KPI_HE_001', name: '中高端客户规模', scene: '公众市场 / 存量运营 / 中高端客户运营', granularity: '省份', period: '月', unit: '户', algorithmScenes: ['loss_control_rca'] },
  { id: 'kpi-he-002', code: 'KPI_HE_002', name: '中高端客户ARPU', scene: '公众市场 / 存量运营 / 中高端客户运营', granularity: '省份', period: '月', unit: '元', algorithmScenes: ['loss_control_rca'] },
  { id: 'kpi-he-003', code: 'KPI_HE_003', name: '中高端客户离网率', scene: '公众市场 / 存量运营 / 中高端客户运营', granularity: '省份', period: '月', unit: '%', algorithmScenes: ['loss_control_rca'] },
  { id: 'kpi-churn-001', code: 'KPI_CUS_CHURN_001', name: '离网预警客户数', scene: '公众市场 / 存量运营 / 离网维系', granularity: '省份', period: '周', unit: '户', algorithmScenes: ['loss_control_rca'] },
  { id: 'kpi-churn-002', code: 'KPI_CUS_CHURN_003', name: '离网率', scene: '公众市场 / 存量运营 / 离网维系', granularity: '省份', period: '月', unit: '%', algorithmScenes: ['loss_control_rca'] },
  { id: 'kpi-churn-003', code: 'KPI_CHURN_003', name: '维系成功率', scene: '公众市场 / 存量运营 / 离网维系', granularity: '省份', period: '周', unit: '%', algorithmScenes: ['loss_control_rca'] },
  { id: 'kpi-hall-001', code: 'KPI_HALL_001', name: '营业厅办理量', scene: '公众市场 / 渠道运营 / 厅店运营', granularity: '区县', period: '月', unit: '笔', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-hall-002', code: 'KPI_HALL_002', name: '营业厅触点转化率', scene: '公众市场 / 渠道运营 / 厅店运营', granularity: '区县', period: '月', unit: '%', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-family-001', code: 'KPI_FAMILY_001', name: '家庭融合客户数', scene: '公众市场 / 家庭运营 / 融合增收', granularity: '地市', period: '月', unit: '户', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-family-002', code: 'KPI_FAMILY_002', name: '融合套餐收入', scene: '公众市场 / 家庭运营 / 融合增收', granularity: '地市', period: '月', unit: '万元', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-family-003', code: 'KPI_FAMILY_003', name: '宽带新增用户数', scene: '公众市场 / 家庭运营 / 融合增收', granularity: '地市', period: '月', unit: '户', algorithmScenes: ['traffic_rca'] },
  { id: 'kpi-grid-001', code: 'KPI_GRID_001', name: '网格流量负荷', scene: '公众市场 / 流量运营 / 网格运营', granularity: '网格', period: '日', unit: '%', algorithmScenes: ['traffic_rca'] }
];

window.getMetricById = function (id) {
  return (window.METRIC_OPTIONS || []).find(m => m.id === id) || null;
};

/** 按配置编码加载已保存的指标树画布（演示） */
window.getEditorTreeByCode = function (code) {
  const data = (window.TREE_EDITOR_DATA || {})[code];
  return data ? JSON.parse(JSON.stringify(data)) : null;
};
