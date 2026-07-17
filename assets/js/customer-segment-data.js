/** 客群管理 - 演示数据 */
window.SEGMENT_STATUS_MAP = {
  active: { label: '生效', cls: 'badge-success' },
  expired: { label: '失效', cls: 'badge-secondary' },
  draft: { label: '草稿', cls: 'badge-warning' }
};

/** 为列表兼容保留简要字段；详情使用 metrics / tags 数组 */
function seg(row) {
  return {
    relatedMetrics: (row.metrics || []).map(m => m.name).join('、') || '—',
    relatedTags: (row.tags || []).map(t => t.name).join('、') || '—',
    ...row
  };
}

window.CUSTOMER_SEGMENT_STATIC_SEED = [
  seg({
    id: 'SCAI-DEMO-2026001',
    name: '沉默用户唤醒异动客群',
    bizCaliber: 'AI根因分析汇聚：沉默用户唤醒率异动，关联低接触、超套敏感等标签收敛',
    effectiveDate: '2026-05-28',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    showcase: true,
    scaleLabel: '8,640 人',
    metrics: [
      { code: 'tf-16', name: '沉默用户唤醒率', value: '12.3%', mom: '-2.8%', yoy: '-1.5%', tagValue: '异动' }
    ],
    tags: [
      { name: '低接触', value: '90天零厅店接触' },
      { name: '超套敏感', value: '月超套>50元' }
    ]
  }),
  seg({
    id: 'SCAI-DEMO-2026002',
    name: '离网风险汇聚客群',
    bizCaliber: 'AI根因分析汇聚：中高端离网风险指数升高，多链路客群合并',
    effectiveDate: '2026-05-25',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    showcase: true,
    scaleLabel: '4,280 人',
    metrics: [
      { code: 'KPI_HCD_001', name: '中高端客户流失风险指数', value: '86.2', mom: '+3.4%', yoy: '+5.8%', tagValue: '高风险' }
    ],
    tags: [
      { name: '离网预警', value: 'IOP Top10%' },
      { name: '携转查询', value: '近30日有' }
    ]
  }),
  seg({
    id: 'SCDP-DEMO-2026001',
    name: '流量异动客群 · 南昌市',
    bizCaliber: '客群调度下发（江西省），关联指标「沉默用户唤醒率」',
    effectiveDate: '2026-05-28',
    expiryDate: '2026-06-10',
    status: 'active',
    source: 'dispatch',
    showcase: true,
    scaleLabel: '1,555 人',
    dispatchTaskId: 'MDP-JX-2026-SEG-002',
    regionScope: { cityId: 'nc', cityName: '南昌市' },
    metrics: [
      { code: 'tf-16', name: '沉默用户唤醒率', value: '10.1%', mom: '-4.2%', yoy: '—' }
    ],
    tags: [
      { name: '调度范围', value: '南昌市' },
      { name: '客群占比', value: '18.0%' }
    ]
  }),
  seg({
    id: 'SCDP-DEMO-2026002',
    name: '流量异动客群 · 赣州市',
    bizCaliber: '客群调度下发（江西省），关联指标「沉默用户唤醒率」',
    effectiveDate: '2026-05-28',
    expiryDate: '2026-06-10',
    status: 'active',
    source: 'dispatch',
    showcase: true,
    scaleLabel: '1,382 人',
    dispatchTaskId: 'MDP-JX-2026-SEG-002',
    regionScope: { cityId: 'gz', cityName: '赣州市' },
    metrics: [
      { code: 'tf-16', name: '沉默用户唤醒率', value: '11.8%', mom: '-3.1%', yoy: '—' }
    ],
    tags: [
      { name: '调度范围', value: '赣州市' },
      { name: '客群占比', value: '16.0%' }
    ]
  }),
  seg({
    id: 'SCDP-DEMO-2026003',
    name: '离网风险客群 · 章贡区',
    bizCaliber: '客群调度下发（江西省 › 赣州市），关联指标「离网风险客群规模」',
    effectiveDate: '2026-05-25',
    expiryDate: '2026-06-05',
    status: 'active',
    source: 'dispatch',
    showcase: true,
    scaleLabel: '1,120 人',
    dispatchTaskId: 'MDP-JX-2026-SEG-001',
    regionScope: { cityId: 'gz', cityName: '赣州市', countyId: 'zg', countyName: '章贡区' },
    metrics: [
      { code: 'he-seg-1', name: '离网风险客群规模', value: '2,860 人', mom: '+2.1%', yoy: '—' }
    ],
    tags: [
      { name: '调度范围', value: '章贡区' },
      { name: '客群占比', value: '39.2%' }
    ]
  }),
  seg({
    id: 'SCYY0220260428001',
    name: '套外敏感汇聚客群',
    bizCaliber: '套外计费占比高且近月超套频次上升的客户',
    effectiveDate: '2026-03-18',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_FL_REV_003', name: '套外收入', value: '0.52亿', mom: '-3.10%', yoy: '-1.8%', tagValue: '超套敏感' }
    ],
    tags: [
      { name: '套外高依赖', value: '是' },
      { name: '流量突增未转化', value: '近30日≥2次' }
    ]
  }),
  seg({
    id: 'SCYY0220260428002',
    name: '近三月降档',
    bizCaliber: '近90日内办理主资费降档的中高端客户',
    effectiveDate: '2026-03-15',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_HCD_001', name: '中高端客户流失风险指数', value: '82.6', mom: '+2.1%', yoy: '+4.5%', tagValue: '高风险' },
      { code: 'KPI_DOWN_001', name: '降档办理量', value: '1,286', mom: '+15.2%', yoy: '+8.3%', tagValue: '升档拦截' }
    ],
    tags: [
      { name: '降档敏感', value: '高' },
      { name: '套餐降档倾向', value: '90日内' },
      { name: 'ARPU连续下滑', value: '≥2月' }
    ]
  }),
  seg({
    id: 'SCYY0220260428003',
    name: '近二月降档',
    bizCaliber: '近60日内降档客户',
    effectiveDate: '2026-03-10',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_DOWN_001', name: '降档办理量', value: '892', mom: '+11.4%', yoy: '+6.1%', tagValue: '降档倾向' }
    ],
    tags: [
      { name: '降档敏感', value: '中' },
      { name: '主资费降档', value: '60日内' }
    ]
  }),
  seg({
    id: 'SCYY0220260428004',
    name: '合约到期预警客群',
    bizCaliber: '合约30天内到期且近90天零厅店接触',
    effectiveDate: '2026-02-28',
    expiryDate: '2026-12-31',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_CONTRACT_001', name: '合约在网客户占比', value: '68.4%', mom: '-0.6pp', yoy: '-1.2pp', tagValue: '合约到期' },
      { code: 'KPI_CONTACT_001', name: '厅店接触率', value: '42.1%', mom: '-3.2pp', yoy: '-5.0pp', tagValue: '低接触' }
    ],
    tags: [
      { name: '合约临近到期', value: '≤30天' },
      { name: '低接触客群', value: '90天零接触' }
    ]
  }),
  seg({
    id: 'SCYY0220260428005',
    name: '高流失风险指数客群',
    bizCaliber: '流失风险指数≥80分',
    effectiveDate: '2026-02-20',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_HCD_001', name: '中高端客户流失风险指数', value: '86.2', mom: '+3.4%', yoy: '+5.8%', tagValue: '≥80分' },
      { code: 'KPI_HE_003', name: '中高端客户离网率', value: '0.92%', mom: '+0.05pp', yoy: '+0.08pp', tagValue: '离网风险' }
    ],
    tags: [
      { name: '高流失风险', value: '指数≥80' },
      { name: '近30日携转查询', value: '有' }
    ]
  }),
  seg({
    id: 'SCYY0220260428006',
    name: '流量超套敏感客户',
    bizCaliber: '月超套金额>50元且饱和度>100%',
    effectiveDate: '2026-02-15',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_FL_SAT_001', name: '流量饱和度', value: '118%', mom: '+6.2%', yoy: '+9.1%', tagValue: '超套' },
      { code: 'KPI_FL_REV_003', name: '套外收入', value: '186万', mom: '-4.2%', yoy: '-2.5%', tagValue: '套外依赖' }
    ],
    tags: [
      { name: '超套', value: '月超套>50元' },
      { name: '视频超套', value: '是' }
    ]
  }),
  seg({
    id: 'SCYY0220260428007',
    name: '5G未渗透高价值客户',
    bizCaliber: 'ARPU≥120且未办理5G套餐',
    effectiveDate: '2026-02-01',
    expiryDate: '2026-08-01',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_5G_001', name: '5G套餐渗透率', value: '62.3%', mom: '+1.1pp', yoy: '+3.4pp', tagValue: '升档潜客' },
      { code: 'KPI_ARPU_001', name: '折后ARPU', value: '128元', mom: '+0.8%', yoy: '+2.1%', tagValue: '高价值' }
    ],
    tags: [
      { name: '5G潜客', value: '未办5G套餐' },
      { name: 'ARPU', value: '≥120元' }
    ]
  }),
  seg({
    id: 'SCYY0220260428008',
    name: '离网预警外呼名单',
    bizCaliber: 'IOP离网预警模型Top10%',
    effectiveDate: '2026-01-20',
    expiryDate: '—',
    status: 'active',
    source: 'ai',
    metrics: [
      { code: 'KPI_CHURN_001', name: '离网预警客户数', value: '4.28万', mom: '+2.15%', yoy: '+3.2%', tagValue: '预警Top10%' }
    ],
    tags: [
      { name: '离网预警', value: 'IOP Top10%' },
      { name: '高额停机', value: '>6个月' }
    ]
  }),
  seg({
    id: 'SCYY0220260428009',
    name: '家庭融合待拓展',
    bizCaliber: '单卡高价值未办融合',
    effectiveDate: '2026-01-10',
    expiryDate: '—',
    status: 'draft',
    source: 'ai',
    metrics: [
      { code: 'KPI_FUSION_001', name: '融合捆绑渗透率', value: '54.6%', mom: '+0.4pp', yoy: '+1.8pp', tagValue: '融合潜客' }
    ],
    tags: [
      { name: '融合潜客', value: '单卡高价值' },
      { name: '未办融合', value: '是' }
    ]
  }),
  seg({
    id: 'SCYY0220260428010',
    name: '国际漫游高消费',
    bizCaliber: '近3月漫游消费>200元',
    effectiveDate: '2025-12-01',
    expiryDate: '2026-06-30',
    status: 'expired',
    source: 'ai',
    metrics: [
      { code: 'KPI_ROAM_001', name: '国际漫游收入', value: '328万', mom: '-1.2%', yoy: '+4.6%', tagValue: '高消费' }
    ],
    tags: [
      { name: '国际漫游', value: '3月>200元' },
      { name: '国漫月包', value: '未订购' }
    ]
  })
];

window.CUSTOMER_SEGMENT_LIST = window.CUSTOMER_SEGMENT_STATIC_SEED.map(seg);
