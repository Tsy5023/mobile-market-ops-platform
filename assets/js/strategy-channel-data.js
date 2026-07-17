/** 营销策略 · 渠道触点（630 开放 4 个：中国移动APP、10086呼入弹屏、10085外呼营销、营业厅网台） */
window.STRATEGY_CHANNEL_CATEGORIES = [
  {
    key: 'ec',
    label: '电商',
    channels: [
      { id: 'ch_cmcc_app', name: '中国移动APP', enabled: true },
      { id: 'tp_l1_ec', name: '一级电渠', enabled: false },
      { id: 'tp_l1_pro', name: '一级执衍-专业公司', enabled: false },
      { id: 'tp_hewoxin', name: '和我信', enabled: false },
      { id: 'tp_hewo_find', name: '和我信发现', enabled: false },
      { id: 'tp_push', name: '线上-消息推送', enabled: false },
      { id: 'tp_hewo_l1', name: '和我信发现(一级)', enabled: false },
      { id: 'tp_free_pick', name: '随心选', enabled: false },
      { id: 'tp_share', name: '共享中心', enabled: false },
      { id: 'tp_terminal_viz', name: '泛终端质量可视化(未开发)', enabled: false },
      { id: 'tp_sandbox', name: '作战沙盘', enabled: false }
    ]
  },
  {
    key: 'online',
    label: '在线',
    channels: [
      { id: 'ch_10086_popup', name: '10086呼入弹屏', enabled: true },
      { id: 'ch_10085', name: '10085外呼营销', enabled: true },
      { id: 'tp_pop', name: '产品运营平台', enabled: false },
      { id: 'tp_ivr_mkt', name: 'IVR营销', enabled: false },
      { id: 'tp_10088', name: '10088外呼', enabled: false }
    ]
  },
  {
    key: 'physical',
    label: '实体',
    channels: [
      { id: 'ch_hall_net', name: '营业厅网台', enabled: true },
      { id: 'tp_install', name: '装维随销', enabled: false },
      { id: 'tp_gov', name: '政企专区', enabled: false },
      { id: 'tp_gdt', name: '广点通', enabled: false },
      { id: 'tp_smart_grid', name: '网格通-作战地图', enabled: false },
      { id: 'tp_smart_office', name: '智办公', enabled: false },
      { id: 'tp_huni', name: '护你', enabled: false },
      { id: 'tp_wework', name: '企业微信', enabled: false },
      { id: 'tp_compare', name: '网格通-问查算比', enabled: false }
    ]
  },
  {
    key: 'sms',
    label: '短信',
    channels: [
      { id: 'tp_5g_cloud', name: '5G云卡', enabled: false },
      { id: 'tp_5g_msg', name: '5G消息', enabled: false },
      { id: 'tp_sms', name: '10086短信', enabled: false },
      { id: 'tp_content_sms', name: '内容短信', enabled: false },
      { id: 'tp_sms_attach', name: '短信夹带', enabled: false }
    ]
  },
  {
    key: 'other',
    label: '其他',
    channels: [
      { id: 'tp_hewo_coupon', name: '和我信卡券中心', enabled: false },
      { id: 'tp_ivr_nav', name: 'IVR语音导航', enabled: false },
      { id: 'tp_esop', name: 'ESOP/集客APP', enabled: false },
      { id: 'tp_madian', name: '码店', enabled: false },
      { id: 'tp_sms_hall', name: '短厅', enabled: false },
      { id: 'tp_video_mms', name: '视频彩铃', enabled: false },
      { id: 'tp_online_store', name: '线上门店', enabled: false },
      { id: 'tp_client_connect', name: '客户通(营销小助手、摆摊小精灵、行销小魔方)', enabled: false },
      { id: 'tp_l1_migu', name: '一级咪咕渠道', enabled: false },
      { id: 'tp_h5_slot', name: 'H5买运营位', enabled: false },
      { id: 'tp_l1_net', name: '一级互联网渠道', enabled: false },
      { id: 'tp_front', name: '营业前台', enabled: false },
      { id: 'tp_opp', name: '商机中心', enabled: false },
      { id: 'tp_test', name: '测试触点', enabled: false }
    ]
  }
];

window.STRATEGY_CHANNEL_TOUCHPOINTS = window.STRATEGY_CHANNEL_CATEGORIES.flatMap(c => c.channels);

window.STRATEGY_HALL_SLOTS = [
  '默认运营位-全队伍',
  '实时渠道',
  '网格直销',
  '客户经理',
  '装维随销',
  '弹窗专属'
];

window.STRATEGY_CHANNEL_BY_ID = Object.fromEntries(
  STRATEGY_CHANNEL_TOUCHPOINTS.map(c => [c.id, c])
);
