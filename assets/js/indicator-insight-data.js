/** 指标树列表与详情演示数据 */
window.INDICATOR_TREES = [
  { id: 'tree-traffic-flow', name: '流量运营', category: '流量运营', categoryKey: 'traffic', metricCount: 331, updatedAt: '2026-05-28 10:00', hasAlert: true, scene: '公众市场 / 流量运营', configCode: '202605280001' },
  { id: 'tree-he-churn', name: '中高端客户流失指标树', category: '存量运营', categoryKey: 'stock', metricCount: 42, updatedAt: '2026-05-22 09:00', hasAlert: true, scene: '公众市场 / 存量运营 / 中高端客户流失', configCode: '202605220001' }
];

window.TREE_DETAIL_DATA = {
  'tree-flow-rev': {
    name: '流量收入分析指标树',
    category: '流量运营',
    root: {
      id: 'm-root', name: '流量总收入', value: '2.86亿', yoy: '+8.2%', mom: '+4.2%',
      status: 'normal', caliber: '套餐内收入+套外收入+流量包收入合计，日更新，单位：元',
      alert: false,
      children: [
        {
          id: 'm1', name: '套餐内收入', value: '1.62亿', yoy: '+6.1%', mom: '+3.1%', status: 'normal',
          caliber: '用户套餐内流量计费收入，不含套外',
          children: [
            {
              id: 'm1a', name: '5G套餐内收入', value: '0.98亿', yoy: '+12.4%', mom: '+6.8%', status: 'normal', caliber: '5G套餐内流量收入',
              children: [
                { id: 'm1a1', name: '5G畅享套餐收入', value: '0.58亿', yoy: '+14%', mom: '+7%', status: 'normal', caliber: '5G畅享档套餐收入', children: [] },
                { id: 'm1a2', name: '5G尊享套餐收入', value: '0.40亿', yoy: '+10%', mom: '+6%', status: 'normal', caliber: '5G尊享档套餐收入', children: [] }
              ]
            },
            {
              id: 'm1b', name: '4G套餐内收入', value: '0.64亿', yoy: '-2.1%', mom: '-1.2%', status: 'alert', caliber: '4G套餐内流量收入', alert: true,
              children: [
                { id: 'm1b1', name: '4G飞享套餐', value: '0.38亿', yoy: '-3.2%', mom: '-1.8%', status: 'alert', caliber: '4G飞享档收入', alert: true, children: [] },
                { id: 'm1b2', name: '4G任我用', value: '0.26亿', yoy: '-0.5%', mom: '-0.2%', status: 'normal', caliber: '4G任我用收入', children: [] }
              ]
            }
          ]
        },
        {
          id: 'm2', name: '套外收入', value: '0.71亿', yoy: '-5.3%', mom: '-2.4%', status: 'alert',
          caliber: '套餐外流量计费收入', alert: true,
          children: [
            {
              id: 'm2a', name: '套外流量费', value: '0.52亿', yoy: '-6.8%', mom: '-3.1%', status: 'alert', caliber: '纯套外流量费用', alert: true,
              children: [
                { id: 'm2a1', name: '超套流量费', value: '0.35亿', yoy: '-8.1%', mom: '-4.2%', status: 'alert', caliber: '超出套餐流量费', alert: true, children: [] },
                { id: 'm2a2', name: '国际套外费', value: '0.17亿', yoy: '-2.0%', mom: '+0.5%', status: 'normal', caliber: '国际漫游套外', children: [] }
              ]
            },
            { id: 'm2b', name: '套外增值', value: '0.19亿', yoy: '+1.2%', mom: '+0.5%', status: 'normal', caliber: '套外增值业务', children: [] }
          ]
        },
        {
          id: 'm3', name: '流量包收入', value: '0.53亿', yoy: '+15.2%', mom: '+8.9%', status: 'normal',
          caliber: '各类流量包订购收入',
          children: [
            {
              id: 'm3a', name: '视频定向包', value: '0.21亿', yoy: '+22%', mom: '+11%', status: 'normal', caliber: '视频定向流量包',
              children: [
                { id: 'm3a1', name: '爱奇艺定向包', value: '0.09亿', yoy: '+25%', mom: '+12%', status: 'normal', caliber: '爱奇艺合作定向包', children: [] },
                { id: 'm3a2', name: '抖音定向包', value: '0.12亿', yoy: '+20%', mom: '+10%', status: 'normal', caliber: '抖音合作定向包', children: [] }
              ]
            },
            { id: 'm3b', name: '通用流量包', value: '0.32亿', yoy: '+10%', mom: '+6%', status: 'normal', caliber: '通用流量包收入', children: [] }
          ]
        }
      ]
    }
  },
  'tree-high-end': {
    name: '中高端保有核心指标树',
    category: '中高端保有',
    root: {
      id: 'h-root', name: '中高端客户规模', value: '328万', yoy: '+2.1%', mom: '+0.8%', status: 'normal',
      caliber: 'ARPU≥89元或全球通等级银卡及以上客户数',
      children: [
        { id: 'h1', name: '中高端ARPU', value: '¥128.6', yoy: '+1.5%', mom: '-0.3%', status: 'alert', caliber: '中高端客户月均ARPU', alert: true, children: [] },
        { id: 'h2', name: '离网率', value: '0.82%', yoy: '-0.1pp', mom: '+0.05pp', status: 'alert', caliber: '当月离网/月初中高端客户', alert: true, children: [] },
        { id: 'h3', name: '融合渗透率', value: '76.4%', yoy: '+3.2pp', mom: '+1.1pp', status: 'normal', caliber: '融合业务办理占比', children: [] }
      ]
    }
  },
  'tree-churn': {
    name: '离网维系监控指标树',
    category: '离网维系',
    root: {
      id: 'c-root', name: '离网规模', value: '1.24万', yoy: '-8.2%', mom: '-2.1%', status: 'normal',
      caliber: '当月离网客户数',
      children: [
        { id: 'c1', name: '离网率', value: '1.85%', yoy: '-0.2pp', mom: '+0.08pp', status: 'alert', caliber: '离网客户/月初客户', alert: true, children: [] },
        { id: 'c2', name: '挽回率', value: '32.6%', yoy: '+4.1pp', mom: '+1.2pp', status: 'normal', caliber: '成功挽留/离网预警客户', children: [] }
      ]
    }
  },
  'tree-family': {
    name: '家庭融合运营指标树',
    category: '家庭运营',
    root: {
      id: 'f-root', name: '家庭融合包渗透率', value: '42.8%', yoy: '+5.6pp', mom: '+2.1pp', status: 'normal',
      caliber: '办理融合包家庭/全量家庭',
      children: [
        { id: 'f1', name: '家庭宽带新增', value: '8,420', yoy: '+12%', mom: '+6%', status: 'normal', caliber: '当月新增家庭宽带', children: [] }
      ]
    }
  },
  'tree-intl': {
    name: '国际业务运营指标树',
    category: '国际业务运营',
    root: {
      id: 'i-root', name: '国际漫游收入', value: '0.38亿', yoy: '+18%', mom: '+9%', status: 'normal',
      caliber: '国际漫游及出境业务收入',
      children: [
        { id: 'i1', name: '漫游客户数', value: '56万', yoy: '+22%', mom: '+8%', status: 'normal', caliber: '当月有漫游行为客户', children: [] }
      ]
    }
  }
};

// 默认详情数据（未单独配置的树复用流量收入结构并改名）
window.getTreeDetail = function(id) {
  const resolvedId = typeof window.resolveInsightTreeId === 'function'
    ? window.resolveInsightTreeId(id)
    : id;
  let detail;
  if (resolvedId === 'tree-traffic-flow' && typeof window.getTrafficFlowInsightDetail === 'function') {
    detail = window.getTrafficFlowInsightDetail();
  } else if (resolvedId === 'tree-he-churn' && typeof window.getHeChurnInsightDetail === 'function') {
    detail = window.getHeChurnInsightDetail();
  } else if (window.TREE_DETAIL_DATA[resolvedId]) {
    detail = JSON.parse(JSON.stringify(window.TREE_DETAIL_DATA[resolvedId]));
  } else {
    const t = window.INDICATOR_TREES.find(x => x.id === id);
    const fallbackId = window.HE_CHURN_INSIGHT_ID || 'tree-he-churn';
    if (typeof window.getHeChurnInsightDetail === 'function' && window.TREE_DETAIL_DATA[fallbackId]) {
      detail = window.getHeChurnInsightDetail();
    } else {
      detail = JSON.parse(JSON.stringify(window.TREE_DETAIL_DATA[fallbackId] || window.TREE_DETAIL_DATA['tree-flow-rev']));
    }
    if (t) { detail.name = t.name; detail.category = t.category || '中高端客户流失'; }
  }
  if (typeof window.getDetailFromEditorTree === 'function' && typeof window.getEditorTreeByCode === 'function') {
    const cfg = (window.TREE_CONFIG_LIST || []).find(
      r => r.insightId === resolvedId || r.insightId === id || r.code === id || r.code === resolvedId
    );
    if (cfg) {
      const ed = window.getEditorTreeByCode(cfg.code);
      if (ed) {
        const fromEditor = window.getDetailFromEditorTree(ed);
        if (fromEditor?.root) detail = fromEditor;
      }
    }
  }

  if (detail?.root && typeof window.enrichTreeSegments === 'function') {
    window.enrichTreeSegments(detail.root);
  }
  return detail;
};

window.CATEGORY_TABS = [
  { key: 'all', label: '全部' },
  { key: 'traffic', label: '流量运营' },
  { key: 'stock', label: '存量运营' },
  { key: 'niche', label: '细分市场运营' }
];
