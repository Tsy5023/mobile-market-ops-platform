/** 指标看管人 - 江西省组织与演示数据 */
/** 江西省统一组织/权限系统同步的组织架构（演示） */
window.JX_ORG_SYSTEM = {
  units: [
    {
      id: 'jx-prov',
      name: '江西省公司',
      depts: [
        { id: 'jx-mkt', name: '市场部' },
        { id: 'jx-he', name: '中高端客户运营中心' },
        { id: 'jx-flow', name: '流量运营中心' },
        { id: 'jx-intl', name: '国际业务部' }
      ]
    },
    {
      id: 'nc',
      name: '南昌市分公司',
      depts: [
        { id: 'nc-mkt', name: '市场部' },
        { id: 'nc-cust', name: '客户运营中心' },
        { id: 'nc-churn', name: '离网维系中心' }
      ]
    },
    {
      id: 'jj',
      name: '九江市分公司',
      depts: [
        { id: 'jj-mkt', name: '市场部' },
        { id: 'jj-cust', name: '客户运营中心' }
      ]
    },
    {
      id: 'gz',
      name: '赣州市分公司',
      depts: [
        { id: 'gz-mkt', name: '市场部' },
        { id: 'gz-retain', name: '存量运营部' }
      ]
    },
    {
      id: 'sr',
      name: '上饶市分公司',
      depts: [{ id: 'sr-mkt', name: '市场部' }]
    },
    {
      id: 'yc',
      name: '宜春市分公司',
      depts: [{ id: 'yc-cust', name: '客户维系中心' }]
    },
    {
      id: 'ja',
      name: '吉安市分公司',
      depts: [
        { id: 'ja-mkt', name: '市场部' },
        { id: 'ja-cust', name: '客户运营中心' }
      ]
    },
    {
      id: 'fz',
      name: '抚州市分公司',
      depts: [{ id: 'fz-mkt', name: '市场部' }]
    },
    {
      id: 'jdz',
      name: '景德镇市分公司',
      depts: [{ id: 'jdz-mkt', name: '市场部' }]
    },
    {
      id: 'px',
      name: '萍乡市分公司',
      depts: [{ id: 'px-mkt', name: '市场部' }]
    },
    {
      id: 'xy',
      name: '新余市分公司',
      depts: [{ id: 'xy-cust', name: '客户运营中心' }]
    },
    {
      id: 'yt',
      name: '鹰潭市分公司',
      depts: [{ id: 'yt-mkt', name: '市场部' }]
    }
  ],
  persons: [
    { id: 'u-001', name: '张明', role: '省公司运营主管', unitId: 'jx-prov', deptId: 'jx-mkt' },
    { id: 'u-002', name: '李敏', role: '系统配置员', unitId: 'jx-prov', deptId: 'jx-mkt' },
    { id: 'u-003', name: '王芳', role: '中高端运营经理', unitId: 'jx-prov', deptId: 'jx-he' },
    { id: 'u-004', name: '刘伟', role: '流量运营分析', unitId: 'jx-prov', deptId: 'jx-flow' },
    { id: 'u-005', name: '陈静', role: '国际业务专员', unitId: 'jx-prov', deptId: 'jx-intl' },
    { id: 'u-006', name: '赵磊', role: '地市运营主管', unitId: 'nc', deptId: 'nc-mkt' },
    { id: 'u-007', name: '孙丽', role: '存量运营', unitId: 'gz', deptId: 'gz-retain' },
    { id: 'u-008', name: '周涛', role: '客户运营', unitId: 'nc', deptId: 'nc-cust' },
    { id: 'u-009', name: '吴敏', role: '市场分析', unitId: 'sr', deptId: 'sr-mkt' },
    { id: 'u-010', name: '郑华', role: '维系专员', unitId: 'yc', deptId: 'yc-cust' },
    { id: 'u-011', name: '黄强', role: '离网维系', unitId: 'jj', deptId: 'jj-cust' },
    { id: 'u-012', name: '林娜', role: '国际业务', unitId: 'jx-prov', deptId: 'jx-intl' },
    { id: 'u-013', name: '何军', role: '流量经营', unitId: 'nc', deptId: 'nc-mkt' },
    { id: 'u-014', name: '超级管理员', role: '系统管理员', unitId: 'jx-prov', deptId: 'jx-mkt' }
  ]
};

function deptDisplayName(unit, dept) {
  return unit && dept ? `${unit.name} · ${dept.name}` : '';
}

window.resolveCaretakerObjectLabel = function (row) {
  if (!row) return '—';
  if (row.objectType === 'dept') {
    const unit = JX_ORG_SYSTEM.units.find(u => u.id === row.unitId);
    const dept = unit?.depts?.find(d => d.id === row.deptId);
    return deptDisplayName(unit, dept) || row.objectName || '—';
  }
  const p = JX_ORG_SYSTEM.persons.find(x => x.id === row.personId);
  if (p) {
    return `${p.name} · ${p.role}`;
  }
  return row.objectName || '—';
};

window.formatCaretakerMetrics = function (row) {
  if (row.metrics?.length) {
    return row.metrics.map(m => m.name).join('、');
  }
  return row.metricGroup || '—';
};

window.INDICATOR_CARETAKER_LIST = [
  { id: 'ic-001', objectType: 'person', personId: 'u-014', unitId: 'jx-prov', deptId: 'jx-mkt', metrics: [{ code: 'KPI_HCD_001', name: '中高端客户流失风险指数' }], createdAt: '2026-03-26 16:35:04', creator: '超级管理员' },
  { id: 'ic-002', objectType: 'person', personId: 'u-002', unitId: 'jx-prov', deptId: 'jx-mkt', metrics: [{ code: 'KPI_HCD_001', name: '中高端客户流失风险指数' }, { code: 'KPI_CHURN_001', name: '离网预警客户数' }], createdAt: '2026-03-25 14:20:11', creator: '李敏' },
  { id: 'ic-003', objectType: 'dept', unitId: 'jx-prov', deptId: 'jx-mkt', metrics: [{ code: 'KPI_FL_REV_001', name: '流量总收入' }], createdAt: '2026-03-24 09:15:33', creator: '系统管理员' },
  { id: 'ic-004', objectType: 'dept', unitId: 'jx-prov', deptId: 'jx-he', metrics: [{ code: 'KPI_HCD_001', name: '中高端客户流失风险指数' }], createdAt: '2026-03-23 11:42:08', creator: '王芳' },
  { id: 'ic-005', objectType: 'dept', unitId: 'nc', deptId: 'nc-mkt', metrics: [{ code: 'KPI_FL_REV_001', name: '流量总收入' }, { code: 'KPI_FL_REV_010', name: '视频定向包收入' }], createdAt: '2026-03-22 16:08:45', creator: '张明' },
  { id: 'ic-006', objectType: 'person', personId: 'u-005', unitId: 'jx-prov', deptId: 'jx-intl', metrics: [{ code: 'KPI_ROAM_001', name: '累计_国漫流量月包产品订购量' }], createdAt: '2026-03-21 10:30:22', creator: '陈静' },
  { id: 'ic-007', objectType: 'dept', unitId: 'jj', deptId: 'jj-cust', metrics: [{ code: 'KPI_CHURN_001', name: '离网预警客户数' }], createdAt: '2026-03-20 15:55:17', creator: '刘伟' },
  { id: 'ic-008', objectType: 'person', personId: 'u-006', unitId: 'nc', deptId: 'nc-mkt', metrics: [{ code: 'KPI_FL_REV_002', name: '套餐内收入' }], createdAt: '2026-03-19 08:40:56', creator: '赵磊' },
  { id: 'ic-009', objectType: 'dept', unitId: 'gz', deptId: 'gz-retain', metrics: [{ code: 'KPI_HCD_009', name: '中高端离网率' }], createdAt: '2026-03-18 13:22:41', creator: '孙丽' },
  { id: 'ic-010', objectType: 'person', personId: 'u-001', unitId: 'jx-prov', deptId: 'jx-mkt', metrics: [{ code: 'KPI_CUS_CHURN_003', name: '离网率' }], createdAt: '2026-03-17 17:11:09', creator: '周涛' },
  { id: 'ic-011', objectType: 'dept', unitId: 'sr', deptId: 'sr-mkt', metrics: [{ code: 'KPI_FL_REV_001', name: '流量总收入' }], createdAt: '2026-03-16 09:48:33', creator: '吴敏' },
  { id: 'ic-012', objectType: 'person', personId: 'u-010', unitId: 'yc', deptId: 'yc-cust', metrics: [{ code: 'KPI_HE_003', name: '中高端客户离网率' }], createdAt: '2026-03-15 14:05:28', creator: '郑华' },
  { id: 'ic-013', objectType: 'dept', unitId: 'yc', deptId: 'yc-cust', metrics: [{ code: 'KPI_CHURN_001', name: '离网预警客户数' }], createdAt: '2026-03-14 11:33:15', creator: '黄强' },
  { id: 'ic-014', objectType: 'person', personId: 'u-012', unitId: 'jx-prov', deptId: 'jx-intl', metrics: [{ code: 'KPI_ROAM_001', name: '累计_国漫流量月包产品订购量' }], createdAt: '2026-03-13 16:20:44', creator: '林娜' },
  { id: 'ic-015', objectType: 'dept', unitId: 'jx-prov', deptId: 'jx-he', metrics: [{ code: 'KPI_HCD_001', name: '中高端客户流失风险指数' }, { code: 'KPI_CHURN_001', name: '离网预警客户数' }], createdAt: '2026-03-12 10:12:07', creator: '李敏' },
  { id: 'ic-016', objectType: 'person', personId: 'u-013', unitId: 'nc', deptId: 'nc-mkt', metrics: [{ code: 'KPI_FL_REV_001', name: '流量总收入' }, { code: 'KPI_FL_REV_010', name: '视频定向包收入' }], createdAt: '2026-03-11 08:55:39', creator: '何军' }
];
