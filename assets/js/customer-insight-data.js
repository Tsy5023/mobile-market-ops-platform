/** 客群洞察 · 演示数据 */
(function () {
  function enrichTags(dim, subCats, seedTags) {
    const extra = [];
    seedTags.forEach((t, i) => {
      extra.push({
        ...t,
        tagId: t.tagId || `TAG_${dim.id.toUpperCase()}_${1000 + i}`,
        subCategory: t.subCategory || subCats[1 + (i % (subCats.length - 1))],
        tagType: t.tagType || (t.values?.length > 2 ? '枚举型' : '指标型'),
        dateCycle: t.dateCycle || t.updateTime?.replace(/-/g, '') || '20260526',
        conversionRate: t.conversionRate || (8 + (i * 3.7) % 25).toFixed(2),
        groupRefs: t.groupRefs ?? 12 + i * 3,
        strategyRefs: t.strategyRefs ?? 4 + i,
        hot: t.hot || i === 0,
        isNew: t.isNew || i === 2,
        sql: t.sql || null
      });
    });
    return extra;
  }

  const TAG_DIMENSIONS = [
    {
      id: 'natural',
      name: '自然属性',
      icon: 'fa-leaf',
      color: '#2563eb',
      totalCount: 322,
      subCategories: ['全部', '基础属性', '地域属性', '家庭属性', '设备属性', '身份属性'],
      tags: enrichTags({ id: 'natural' }, ['全部', '基础属性', '地域属性', '家庭属性'], [
        { id: 't-age', name: '年龄段', subCategory: '基础属性', caliber: '按身份证出生年份划分 5 档年龄段', updateTime: '2026-05-20', cycle: '月标签', values: ['18-25', '26-35', '36-45', '46-55', '55+'], conversionRate: 12.4 },
        { id: 't-gender', name: '性别', subCategory: '基础属性', caliber: '实名登记性别', updateTime: '2026-05-20', cycle: '月标签', values: ['男', '女'] },
        { id: 't-city', name: '常驻地市', subCategory: '地域属性', caliber: '近 90 日驻留时长最长地市', updateTime: '2026-05-21', cycle: '月标签', values: ['南昌', '赣州', '九江'], hot: true, conversionRate: 18.19 },
        { id: 't-net-age', name: '客户网龄(日)', subCategory: '基础属性', caliber: '开户至今天数', updateTime: '2026-05-21', cycle: '日标签', values: [], tagType: '指标型', sql: 'select normal_month from dw.user_net_age where msisdn = ?', conversionRate: 15.6, isNew: true },
        { id: 't-county', name: '常驻区县', subCategory: '地域属性', caliber: '近 90 日驻留最长区县', updateTime: '2026-05-20', cycle: '月标签', values: ['东湖区', '章贡区', '浔阳区'] },
        { id: 't-device', name: '终端品牌', subCategory: '设备属性', caliber: '近 30 日主用终端品牌', updateTime: '2026-05-21', cycle: '日标签', values: ['华为', '苹果', '小米', 'OPPO', '其他'] },
        { id: 't-5g-term', name: '5G 终端', subCategory: '设备属性', caliber: '是否使用 5G 终端', updateTime: '2026-05-21', cycle: '日标签', values: ['是', '否'] },
        { id: 't-family-mem', name: '家庭成员数', subCategory: '家庭属性', caliber: '融合/亲情网成员数推断', updateTime: '2026-05-19', cycle: '月标签', values: ['1', '2', '3', '4+'] }
      ])
    },
    {
      id: 'social',
      name: '社会属性',
      icon: 'fa-users',
      color: '#8b5cf6',
      totalCount: 186,
      subCategories: ['全部', '职业', '教育', '身份', '社群'],
      tags: enrichTags({ id: 'social' }, ['全部', '职业', '教育'], [
        { id: 't-job', name: '职业类型', subCategory: '职业', caliber: '大数据职业标签模型输出', updateTime: '2026-05-18', cycle: '月标签', values: ['学生', '白领', '蓝领', '自由职业'] },
        { id: 't-youth', name: '职场青年', subCategory: '职业', caliber: '年龄22-35且职业为白领/蓝领', updateTime: '2026-05-20', cycle: '月标签', values: ['是', '否'], hot: true, conversionRate: 21.3 },
        { id: 't-edu', name: '学历层次', subCategory: '教育', caliber: '外部数据+模型推断', updateTime: '2026-05-15', cycle: '月标签', values: ['高中及以下', '大专', '本科', '研究生'] },
        { id: 't-global', name: '全球通等级', subCategory: '身份', caliber: '全球通评定等级', updateTime: '2026-05-20', cycle: '月标签', values: ['银卡', '金卡', '白金卡', '钻石卡', '非全球通'] },
        { id: 't-group', name: '集团成员', subCategory: '身份', caliber: '是否集团单位成员', updateTime: '2026-05-20', cycle: '月标签', values: ['是', '否'] },
        { id: 't-community', name: '社群活跃', subCategory: '社群', caliber: '近30日社群类APP活跃', updateTime: '2026-05-21', cycle: '日标签', values: ['高', '中', '低'] }
      ])
    },
    {
      id: 'behavior',
      name: '行为属性',
      icon: 'fa-chart-line',
      color: '#0d9488',
      totalCount: 428,
      subCategories: ['全部', '流量', 'APP', '渠道', '偏好'],
      tags: enrichTags({ id: 'behavior' }, ['全部', '流量', 'APP'], [
        { id: 't-dou', name: '月均 DOU 档位', subCategory: '流量', caliber: '近 3 个月月均上网流量分档', updateTime: '2026-05-21', cycle: '日标签', values: ['<1GB', '1-5GB', '5-20GB', '20GB+'], conversionRate: 16.8 },
        { id: 't-video', name: '视频偏好', subCategory: '偏好', caliber: '视频类 APP 流量占比>40%', updateTime: '2026-05-21', cycle: '日标签', values: ['是', '否'], hot: true },
        { id: 't-sport', name: '运动爱好', subCategory: '偏好', caliber: '体育类APP或内容偏好', updateTime: '2026-05-21', cycle: '日标签', values: ['是', '否'] },
        { id: 't-game', name: '游戏爱好', subCategory: '偏好', caliber: '游戏类APP时长占比', updateTime: '2026-05-21', cycle: '日标签', values: ['是', '否'] },
        { id: 't-migu', name: '咪咕快游访问天数', subCategory: 'APP', caliber: '近30日咪咕快游访问天数', updateTime: '2026-05-21', cycle: '日标签', values: [], tagType: '指标型', isNew: true },
        { id: 't-app-active', name: 'APP 月活', subCategory: 'APP', caliber: '中国移动 APP 近 30 日登录', updateTime: '2026-05-21', cycle: '日标签', values: ['高活跃', '中活跃', '低活跃', '沉默'] },
        { id: 't-channel', name: '办理渠道偏好', subCategory: '渠道', caliber: '近 6 月业务办理主渠道', updateTime: '2026-05-20', cycle: '月标签', values: ['营业厅', 'APP', '热线'] },
        { id: 't-outpkg', name: '套外频次', subCategory: '流量', caliber: '近 3 月套外流量费>0 次数', updateTime: '2026-05-21', cycle: '日标签', values: ['0次', '1-2次', '3次以上'], conversionRate: 19.2 }
      ])
    },
    {
      id: 'value',
      name: '价值属性',
      icon: 'fa-coins',
      color: '#d97706',
      totalCount: 256,
      subCategories: ['全部', '收入', '套餐', '风险', '融合'],
      tags: enrichTags({ id: 'value' }, ['全部', '收入', '风险'], [
        { id: 't-arpu', name: 'ARPU 档位', subCategory: '收入', caliber: '近 3 月折后 ARPU 分档', updateTime: '2026-05-20', cycle: '月标签', values: ['<50', '50-80', '80-120', '120+'], hot: true, conversionRate: 22.1 },
        { id: 't-star', name: '用户星级', subCategory: '收入', caliber: '综合价值评定星级1-5星', updateTime: '2026-05-20', cycle: '月标签', values: ['1星', '2星', '3星', '4星', '5星'] },
        { id: 't-5g', name: '5G 套餐', subCategory: '套餐', caliber: '当前主套餐是否 5G', updateTime: '2026-05-20', cycle: '月标签', values: ['是', '否'] },
        { id: 't-fusion', name: '融合绑定', subCategory: '融合', caliber: '宽带+手机融合', updateTime: '2026-05-19', cycle: '月标签', values: ['已融合', '未融合'] },
        { id: 't-churn', name: '离网风险分', subCategory: '风险', caliber: '离网预测模型分档', updateTime: '2026-05-21', cycle: '日标签', values: ['低', '中', '高'], conversionRate: 14.5 },
        { id: 't-down', name: '降档倾向', subCategory: '风险', caliber: '近 90 日降档查询/办理', updateTime: '2026-05-21', cycle: '日标签', values: ['无', '有'] }
      ])
    }
  ];

  const BASE_CUSTOMER = {
    age: 31,
    status: '正常',
    oneId: 'JX2026052800182934',
    starLevel: '4星',
    brand: '动感地带·校园版',
    arpu3m: 118.6,
    mou: 286,
    dou3m: 18.2,
    realName: '已实名',
    lines: [{ msisdn: '13807010001', status: '正常', package: '5G 畅享 129 元' }],
    vehicle: [
      { label: '有车一族', value: '是' },
      { label: '新能源/混动', value: '否' },
      { label: '近30日加油站', value: '2 次' }
    ],
    dimLabels: {
      natural: [
        { name: '家庭有老人', value: '否' }, { name: '家庭有小孩', value: '是' },
        { name: '家庭成员数', value: '3人' }, { name: '参与家庭共享', value: '是' }
      ],
      behavior: [
        { name: '运动爱好', value: '是' }, { name: '科技爱好', value: '是' },
        { name: '游戏爱好', value: '否' }, { name: '咪咕快游访问', value: '8天' }
      ],
      social: [{ name: '职场青年', value: '是' }],
      value: [
        { name: 'ARPU档位', value: '120+' }, { name: '融合绑定', value: '已融合' }
      ]
    },
    marketing: [
      { time: '2026-05-18 14:22', channel: 'APP推送', content: '5G升档有礼', result: '已触达' },
      { time: '2026-05-12 10:05', channel: '短信', content: '合约续约提醒', result: '已阅读' },
      { time: '2026-05-02 16:40', channel: '营业厅', content: '套餐咨询', result: '已办理加包' },
      { time: '2026-04-20 09:15', channel: '外呼', content: '满意度回访', result: '接通' }
    ]
  };

  const DEMO_CUSTOMERS = {
    '13807010001': {
      ...BASE_CUSTOMER,
      msisdn: '13807010001',
      name: '王**',
      city: '南昌市',
      package: '5G 畅享 129 元',
      arpu: 118.6,
      netAge: '5年+',
      globalLevel: '全球通金卡',
      dou: '18.2 GB',
      tags: ['视频偏好', 'APP 高活跃', '融合已绑定']
    },
    '13979128888': {
      ...BASE_CUSTOMER,
      msisdn: '13979128888',
      name: '李**',
      city: '赣州市',
      age: 28,
      starLevel: '3星',
      brand: '4G 飞享',
      package: '4G 飞享 88 元',
      arpu: 76.2,
      arpu3m: 76.2,
      netAge: '3-5年',
      globalLevel: '非全球通',
      dou: '8.4 GB',
      dou3m: 8.4,
      vehicle: [
        { label: '有车一族', value: '否' },
        { label: '新能源/混动', value: '—' },
        { label: '近30日加油站', value: '0 次' }
      ],
      tags: ['套外偏高', '营业厅偏好', '离网风险-中']
    }
  };

  const PRODUCTS = [
    { id: 'p1', name: '5G 升档礼包', type: '升档' },
    { id: 'p2', name: '视频定向流量包', type: '加包' },
    { id: 'p3', name: '家庭融合礼包', type: '融合' },
    { id: 'p4', name: '全球通尊享权益', type: '保有' },
    { id: 'p5', name: '合约续约补贴', type: '续约' }
  ];

  const MONITOR_SEGMENTS = [
    { id: 'mon-1', name: '中高端降档预警客群', scale: 12840, owner: '省公司市场部', updateCycle: '日', stability: 72, valueScore: 88, trend: { scale: [11800, 12100, 12400, 12600, 12840], structure: [32, 34, 35, 36, 38], value: [82, 84, 85, 87, 88] }, segmentId: 'seg-high-downgrade' },
    { id: 'mon-2', name: '套外高依赖客群', scale: 9560, owner: '流量运营室', updateCycle: '日', stability: 65, valueScore: 62, trend: { scale: [10200, 10000, 9800, 9600, 9560], structure: [28, 27, 26, 25, 24], value: [58, 59, 60, 61, 62] }, segmentId: 'seg-out-package' },
    { id: 'mon-3', name: '视频大流量未办定向包', scale: 18200, owner: '流量运营室', updateCycle: '周', stability: 81, valueScore: 74, trend: { scale: [16800, 17200, 17600, 17900, 18200], structure: [40, 41, 42, 43, 44], value: [70, 71, 72, 73, 74] }, segmentId: 'seg-video-pack' },
    { id: 'mon-4', name: '离网高风险客群', scale: 6420, owner: '存量运营室', updateCycle: '日', stability: 58, valueScore: 45, trend: { scale: [7200, 7000, 6800, 6600, 6420], structure: [22, 21, 20, 19, 18], value: [42, 43, 44, 44, 45] }, segmentId: 'seg-churn-risk' },
    { id: 'mon-5', name: '合约到期 60 天内', scale: 24600, owner: '存量运营室', updateCycle: '日', stability: 90, valueScore: 79, trend: { scale: [22000, 22800, 23500, 24100, 24600], structure: [48, 49, 50, 51, 52], value: [75, 76, 77, 78, 79] }, segmentId: 'seg-contract-end' }
  ];

  function productAffinity(segmentId) {
    const base = {
      'seg-high-downgrade': [92, 45, 78, 88, 95],
      'seg-out-package': [55, 94, 48, 40, 52],
      'seg-video-pack': [62, 96, 58, 44, 50],
      'seg-churn-risk': [48, 52, 65, 72, 88],
      'seg-contract-end': [70, 60, 82, 75, 93],
      'seg-family-fusion': [58, 42, 95, 68, 72],
      'seg-intl-roam': [40, 35, 30, 85, 55],
      'seg-low-touch': [38, 45, 40, 35, 42]
    };
    const scores = base[segmentId] || [60, 60, 60, 60, 60];
    return PRODUCTS.map((p, i) => ({
      ...p,
      score: scores[i] || 60,
      level: scores[i] >= 85 ? '高' : scores[i] >= 65 ? '中' : '低'
    })).sort((a, b) => b.score - a.score);
  }

  function lookupCustomer(msisdn) {
    const key = String(msisdn || '').replace(/\s/g, '');
    if (DEMO_CUSTOMERS[key]) return DEMO_CUSTOMERS[key];
    if (/^1[3-9]\d{9}$/.test(key)) {
      return { ...BASE_CUSTOMER, msisdn: key, name: '张**', city: '九江市', package: '5G 畅享 99 元', arpu: 92.4, arpu3m: 92.4, netAge: '1-3年', globalLevel: '全球通银卡', dou: '12.6 GB', dou3m: 12.6 };
    }
    return null;
  }

  function filterTags(dimId, opts) {
    const dim = TAG_DIMENSIONS.find(d => d.id === dimId);
    if (!dim) return [];
    let list = [...dim.tags];
    const kw = (opts?.keyword || '').trim().toLowerCase();
    const sub = opts?.subCategory || '全部';
    const local = (opts?.localKw || '').trim().toLowerCase();
    if (kw) list = list.filter(t => (t.name + t.tagId + t.caliber).toLowerCase().includes(kw));
    if (sub && sub !== '全部') list = list.filter(t => t.subCategory === sub);
    if (local) list = list.filter(t => (t.name + t.caliber).toLowerCase().includes(local));
    const sort = opts?.sort || 'refs';
    if (sort === 'refs') list.sort((a, b) => (b.groupRefs + b.strategyRefs) - (a.groupRefs + a.strategyRefs));
    if (sort === 'time') list.sort((a, b) => String(b.updateTime).localeCompare(String(a.updateTime)));
    return list;
  }

  function estimateCustomers(tagCount) {
    return Math.max(8000, Math.round(280000 / Math.pow(1.35, tagCount)));
  }

  window.CustomerInsightData = {
    TAG_DIMENSIONS,
    PRODUCTS,
    MONITOR_SEGMENTS,
    lookupCustomer,
    productAffinity,
    filterTags,
    estimateCustomers,
    getSegmentList() {
      return (window.CUSTOMER_SEGMENT_OPTIONS || []).filter(s => s.id && s.scale);
    }
  };
})();
