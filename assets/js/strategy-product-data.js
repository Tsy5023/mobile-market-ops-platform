/** 营销策略 · 产品选择演示数据 */
window.STRATEGY_PRODUCT_TABS = [
  { key: 'main', label: '主产品' },
  { key: 'fusion', label: '融合产品' },
  { key: 'series', label: '同系列产品' },
  { key: 'mutex', label: '互斥产品' }
];

window.STRATEGY_PRODUCT_CATALOG = [
  { id: 'P001', code: '7910012345', name: '家庭融合', tab: 'main', goodsType: '虚拟产品', groupType: '产品组', bizCategory: '服务关怀', effective: '2023-06-15 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P002', code: '7910012346', name: '云硬盘', tab: 'main', goodsType: '集团套餐', groupType: '商品组', bizCategory: '家庭组网', effective: '2023-06-15 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P003', code: '7910012347', name: '5G升档流量包', tab: 'main', goodsType: '虚拟产品', groupType: '产品组', bizCategory: '流量权益包', effective: '2023-08-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P004', code: '7910012348', name: '专属续约优惠包', tab: 'main', goodsType: '虚拟产品', groupType: '产品组', bizCategory: '服务关怀', effective: '2024-01-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P005', code: '7910012349', name: '合约续约补贴', tab: 'main', goodsType: '虚拟产品', groupType: '付费规则', bizCategory: '服务关怀', effective: '2024-03-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P006', code: '7910021001', name: '融合升档礼包', tab: 'fusion', goodsType: '集团套餐', groupType: '商品组', bizCategory: '家庭组网', effective: '2023-09-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P007', code: '7910021002', name: '宽带+电视融合包', tab: 'fusion', goodsType: '宽带套餐', groupType: '产品组', bizCategory: '家庭组网', effective: '2023-10-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P008', code: '7910031001', name: '账单减免券', tab: 'series', goodsType: '虚拟产品', groupType: '产品组', bizCategory: '服务关怀', effective: '2024-02-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P009', code: '7910031002', name: '话费返还券', tab: 'series', goodsType: '虚拟产品', groupType: '产品组', bizCategory: '服务关怀', effective: '2024-02-01 00:00:00', expiry: '2099-12-31 00:00:00' },
  { id: 'P010', code: '7910041001', name: '升档互斥包A', tab: 'mutex', goodsType: '虚拟产品', groupType: '产品组', bizCategory: '流量权益包', effective: '2024-04-01 00:00:00', expiry: '2099-12-31 00:00:00' }
];

(function () {
  const names = ['畅享套餐', '智享套餐', '权益加油包', '宽带提速包', 'FTTR体验包'];
  const tabs = ['main', 'fusion', 'series', 'mutex'];
  const types = ['虚拟产品', '集团套餐', '宽带套餐'];
  const groups = ['产品组', '商品组', '付费规则'];
  const cats = ['服务关怀', '家庭组网', '流量权益包'];
  let n = STRATEGY_PRODUCT_CATALOG.length;
  while (STRATEGY_PRODUCT_CATALOG.length < 50) {
    n++;
    STRATEGY_PRODUCT_CATALOG.push({
      id: 'P' + String(n).padStart(3, '0'),
      code: '79100' + String(5000 + n),
      name: names[n % names.length] + (n > 10 ? ' ' + n : ''),
      tab: tabs[n % tabs.length],
      goodsType: types[n % types.length],
      groupType: groups[n % groups.length],
      bizCategory: cats[n % cats.length],
      effective: '2023-06-15 00:00:00',
      expiry: '2099-12-31 00:00:00'
    });
  }
})();
