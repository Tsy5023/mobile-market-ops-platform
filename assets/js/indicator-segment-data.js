/** 指标客群分析 - 演示数据与画像可视化 */
(function () {
  const TAG_PALETTE = {
    behavior: { label: '行为特征', color: '#2563eb', bg: '#eff6ff' },
    value: { label: '价值特征', color: '#16a34a', bg: '#f0fdf4' },
    risk: { label: '风险特征', color: '#dc2626', bg: '#fef2f2' },
    preference: { label: '偏好特征', color: '#7c3aed', bg: '#f5f3ff' }
  };

  window.CUSTOMER_SEGMENT_OPTIONS = [
    {
      id: 'seg-high-downgrade',
      name: '中高端降档预警客群',
      scene: '中高端客户流失',
      scale: 12840,
      scaleLabel: '12,840 人',
      profile: {
        arpu: '¥ 118.6',
        ageMain: '30-45 岁',
        genderRatio: '男 58% / 女 42%',
        network: '5G 渗透率 72%',
        channelPref: '营业厅 + APP 双渠道',
        tags: ['合约临近到期', '近3月降档倾向', '全球通银卡+']
      },
      analytics: {
        gender: { male: 58, female: 42 },
        ageBands: [
          { label: '18-25', pct: 8 }, { label: '26-35', pct: 32 }, { label: '36-45', pct: 38 },
          { label: '46-55', pct: 16 }, { label: '55+', pct: 6 }
        ],
        behaviors: [
          { name: 'APP 月活', score: 68 }, { name: '套餐稳定性', score: 42 },
          { name: '投诉倾向', score: 35 }, { name: '融合绑定', score: 55 }
        ],
        tagCategories: {
          behavior: [
            { name: '近3月降档倾向', weight: 92 }, { name: 'APP 办理活跃', weight: 65 },
            { name: '热线咨询增多', weight: 48 }
          ],
          value: [
            { name: '全球通银卡+', weight: 78 }, { name: 'ARPU≥100', weight: 71 },
            { name: '家庭融合潜力', weight: 52 }
          ],
          risk: [
            { name: '合约≤60天到期', weight: 88 }, { name: '竞品接触', weight: 45 },
            { name: '余额不足预警', weight: 38 }
          ],
          preference: [
            { name: '营业厅偏好', weight: 62 }, { name: '套餐比价敏感', weight: 74 }
          ]
        },
        mindMap: {
          center: '中高端降档预警',
          branches: [
            { title: '价值特征', items: ['ARPU 118.6', '银卡及以上', '融合待拓展'] },
            { title: '行为特征', items: ['降档查询', 'APP 换套餐', '热线咨询'] },
            { title: '风险特征', items: ['合约到期', '竞品接触', '余额预警'] },
            { title: '渠道偏好', items: ['营业厅', '客户经理', 'APP 自助'] }
          ]
        }
      }
    },
    {
      id: 'seg-out-package',
      name: '客群画像分析',
      scene: '流量运营',
      scale: 9560,
      scaleLabel: '9,560 人',
      profile: {
        arpu: '¥ 76.2',
        ageMain: '18-35 岁',
        genderRatio: '男 52% / 女 48%',
        network: '4G 为主 61%',
        channelPref: '线上自助办理偏好',
        tags: ['月均套外>3次', '未办定向包', '账单异议历史']
      },
      analytics: {
        gender: { male: 52, female: 48 },
        ageBands: [
          { label: '18-25', pct: 28 }, { label: '26-35', pct: 42 }, { label: '36-45', pct: 18 },
          { label: '46-55', pct: 8 }, { label: '55+', pct: 4 }
        ],
        behaviors: [
          { name: '套外消费频次', score: 88 }, { name: '定向包渗透', score: 22 },
          { name: '账单异议', score: 56 }, { name: '线上自助', score: 74 }
        ],
        tagCategories: {
          behavior: [
            { name: '月均套外>3次', weight: 95 }, { name: '夜间流量偏高', weight: 58 },
            { name: '视频流量占比高', weight: 52 }
          ],
          value: [{ name: '中低 ARPU', weight: 70 }, { name: '单卡用户', weight: 62 }],
          risk: [
            { name: '账单异议历史', weight: 82 }, { name: '欠费风险', weight: 44 }
          ],
          preference: [
            { name: '线上自助办理', weight: 76 }, { name: '价格敏感', weight: 81 }
          ]
        },
        mindMap: {
          center: '套外高依赖',
          branches: [
            { title: '价值特征', items: ['ARPU 76.2', '套外贡献高', '低定向包渗透'] },
            { title: '行为特征', items: ['高频套外', '视频大流量', '自助缴费'] },
            { title: '风险特征', items: ['账单异议', '欠费预警', '流失倾向'] },
            { title: '产品偏好', items: ['通用流量包', '价格导向', '短期包'] }
          ]
        }
      }
    },
    {
      id: 'seg-video-pack',
      name: '视频定向包潜客客群',
      scene: '流量运营',
      scale: 22100,
      scaleLabel: '22,100 人',
      profile: {
        arpu: '¥ 92.4',
        ageMain: '22-40 岁',
        genderRatio: '男 49% / 女 51%',
        network: '5G 渗透率 68%',
        channelPref: 'APP / 短视频活跃',
        tags: ['视频流量占比高', '未订购定向包', '近7日活跃']
      },
      analytics: {
        gender: { male: 49, female: 51 },
        ageBands: [
          { label: '18-25', pct: 22 }, { label: '26-35', pct: 45 }, { label: '36-45', pct: 24 },
          { label: '46-55', pct: 7 }, { label: '55+', pct: 2 }
        ],
        behaviors: [
          { name: '视频流量占比', score: 91 }, { name: '定向包渗透', score: 18 },
          { name: 'APP 活跃', score: 82 }, { name: '5G 使用', score: 68 }
        ],
        tagCategories: {
          behavior: [
            { name: '视频流量占比高', weight: 94 }, { name: '近7日活跃', weight: 80 },
            { name: '短视频重度', weight: 72 }
          ],
          value: [{ name: '中 ARPU 提升空间', weight: 65 }, { name: '5G 用户', weight: 68 }],
          risk: [{ name: '未办包流失', weight: 40 }],
          preference: [
            { name: '爱奇艺/抖音偏好', weight: 85 }, { name: 'APP 订购偏好', weight: 78 }
          ]
        },
        mindMap: {
          center: '视频定向潜客',
          branches: [
            { title: '内容偏好', items: ['短视频', '长视频', '直播'] },
            { title: '行为特征', items: ['高视频流量', 'APP 活跃', '未办定向包'] },
            { title: '转化机会', items: ['定向包推荐', '联合会员', '5G 升级'] },
            { title: '触达渠道', items: ['APP Push', '短信', '视频内广告'] }
          ]
        }
      }
    },
    {
      id: 'seg-churn-risk',
      name: '离网高危预警客群',
      scene: '中高端客户流失',
      scale: 6840,
      scaleLabel: '6,840 人',
      profile: {
        arpu: '¥ 54.8',
        ageMain: '25-50 岁',
        genderRatio: '男 55% / 女 45%',
        network: '混合 4G/5G',
        channelPref: '热线 + 厅店',
        tags: ['近30日投诉', '余额不足预警', '竞品接触信号']
      },
      analytics: {
        gender: { male: 55, female: 45 },
        ageBands: [
          { label: '18-25', pct: 14 }, { label: '26-35', pct: 36 }, { label: '36-45', pct: 30 },
          { label: '46-55', pct: 14 }, { label: '55+', pct: 6 }
        ],
        behaviors: [
          { name: '投诉倾向', score: 78 }, { name: '余额充足度', score: 32 },
          { name: '竞品接触', score: 71 }, { name: '维系响应', score: 45 }
        ],
        tagCategories: {
          behavior: [
            { name: '近30日投诉', weight: 86 }, { name: '热线呼入频繁', weight: 62 }
          ],
          value: [{ name: '低 ARPU', weight: 68 }, { name: '单卡为主', weight: 55 }],
          risk: [
            { name: '竞品接触信号', weight: 90 }, { name: '余额不足预警', weight: 84 },
            { name: '离网申请倾向', weight: 76 }
          ],
          preference: [{ name: '热线+厅店', weight: 70 }]
        },
        mindMap: {
          center: '离网高危预警',
          branches: [
            { title: '风险信号', items: ['投诉', '欠费', '竞品'] },
            { title: '维系策略', items: ['专属优惠', '客户经理', '合约续签'] },
            { title: '行为轨迹', items: ['降消费', '停机查询', '携转咨询'] },
            { title: '价值挽回', items: ['挽留礼包', '融合捆绑'] }
          ]
        }
      }
    },
    {
      id: 'seg-contract-end',
      name: '合约到期敏感客群',
      scene: '中高端客户流失',
      scale: 4260,
      scaleLabel: '4,260 人',
      profile: {
        arpu: '¥ 135.2',
        ageMain: '35-55 岁',
        genderRatio: '男 61% / 女 39%',
        network: '5G 渗透率 81%',
        channelPref: '客户经理维系',
        tags: ['合约≤60天到期', '历史续约率低', '家庭融合潜力']
      },
      analytics: {
        gender: { male: 61, female: 39 },
        ageBands: [
          { label: '18-25', pct: 4 }, { label: '26-35', pct: 22 }, { label: '36-45', pct: 40 },
          { label: '46-55', pct: 26 }, { label: '55+', pct: 8 }
        ],
        behaviors: [
          { name: '续约意愿', score: 38 }, { name: '客户经理触达', score: 72 },
          { name: '融合潜力', score: 65 }, { name: '5G 使用', score: 81 }
        ],
        tagCategories: {
          behavior: [{ name: '历史续约率低', weight: 82 }, { name: '套餐比价', weight: 58 }],
          value: [{ name: '高 ARPU', weight: 88 }, { name: '家庭融合潜力', weight: 70 }],
          risk: [{ name: '合约≤60天到期', weight: 96 }],
          preference: [{ name: '客户经理维系', weight: 80 }]
        },
        mindMap: {
          center: '合约到期敏感',
          branches: [
            { title: '合约状态', items: ['≤60天到期', '续约率低'] },
            { title: '价值维系', items: ['高 ARPU', '融合推荐'] },
            { title: '触达方式', items: ['客户经理', '厅店邀约'] },
            { title: '挽留产品', items: ['续约礼包', '升档优惠'] }
          ]
        }
      }
    },
    {
      id: 'seg-family-fusion',
      name: '家庭融合拓展客群',
      scene: '家庭运营',
      scale: 15320,
      scaleLabel: '15,320 人',
      profile: {
        arpu: '¥ 98.7',
        ageMain: '28-48 岁',
        genderRatio: '男 54% / 女 46%',
        network: '宽带+移网融合 38%',
        channelPref: '社区厅店',
        tags: ['有宽带未融合', '多成员家庭', '电视业务空白']
      },
      analytics: {
        gender: { male: 54, female: 46 },
        ageBands: [
          { label: '18-25', pct: 10 }, { label: '26-35', pct: 38 }, { label: '36-45', pct: 35 },
          { label: '46-55', pct: 12 }, { label: '55+', pct: 5 }
        ],
        behaviors: [
          { name: '宽带持有', score: 85 }, { name: '融合渗透', score: 38 },
          { name: '家庭成员数', score: 72 }, { name: '电视业务', score: 25 }
        ],
        tagCategories: {
          behavior: [
            { name: '有宽带未融合', weight: 90 }, { name: '多成员家庭', weight: 84 }
          ],
          value: [{ name: '家庭 ARPU 提升', weight: 75 }],
          risk: [{ name: '异网宽带竞争', weight: 42 }],
          preference: [
            { name: '社区厅店', weight: 68 }, { name: '电视业务空白', weight: 80 }
          ]
        },
        mindMap: {
          center: '家庭融合拓展',
          branches: [
            { title: '家庭结构', items: ['多成员', '有宽带', '未融合'] },
            { title: '产品机会', items: ['融合包', '电视', '副卡'] },
            { title: '触达场景', items: ['社区厅', '装维上门'] },
            { title: '价值提升', items: ['全家共享', '宽带提速'] }
          ]
        }
      }
    },
    {
      id: 'seg-intl-roam',
      name: '国际漫游活跃客群',
      scene: '国际业务',
      scale: 3180,
      scaleLabel: '3,180 人',
      profile: {
        arpu: '¥ 186.5',
        ageMain: '28-45 岁',
        genderRatio: '男 57% / 女 43%',
        network: '5G 国际漫游支持',
        channelPref: 'APP 国漫专区',
        tags: ['近90日出境', '月包未订购', '高漫游消费']
      },
      analytics: {
        gender: { male: 57, female: 43 },
        ageBands: [
          { label: '18-25', pct: 12 }, { label: '26-35', pct: 48 }, { label: '36-45', pct: 32 },
          { label: '46-55', pct: 6 }, { label: '55+', pct: 2 }
        ],
        behaviors: [
          { name: '出境频次', score: 86 }, { name: '漫游消费', score: 92 },
          { name: '月包渗透', score: 28 }, { name: 'APP 国漫活跃', score: 78 }
        ],
        tagCategories: {
          behavior: [
            { name: '近90日出境', weight: 93 }, { name: '高漫游消费', weight: 88 }
          ],
          value: [{ name: '高 ARPU', weight: 90 }],
          risk: [{ name: '月包未订购', weight: 75 }],
          preference: [{ name: 'APP 国漫专区', weight: 82 }, { name: '商务出行', weight: 65 }]
        },
        mindMap: {
          center: '国际漫游活跃',
          branches: [
            { title: '出行特征', items: ['高频出境', '商务/旅游'] },
            { title: '产品缺口', items: ['月包未订', '多国包机会'] },
            { title: '消费特征', items: ['高漫游费', '5G 国际'] },
            { title: '触达', items: ['APP 专区', '出境提醒'] }
          ]
        }
      }
    },
    {
      id: 'seg-low-touch',
      name: '低接触流失风险客群',
      scene: '中高端客户流失',
      scale: 5100,
      scaleLabel: '5,100 人',
      profile: {
        arpu: '¥ 68.3',
        ageMain: '40-60 岁',
        genderRatio: '男 56% / 女 44%',
        network: '4G 为主',
        channelPref: '线下办理减少',
        tags: ['90天无厅店接触', 'APP 活跃低', '渠道流失风险']
      },
      analytics: {
        gender: { male: 56, female: 44 },
        ageBands: [
          { label: '18-25', pct: 5 }, { label: '26-35', pct: 18 }, { label: '36-45', pct: 28 },
          { label: '46-55', pct: 32 }, { label: '55+', pct: 17 }
        ],
        behaviors: [
          { name: '厅店接触', score: 18 }, { name: 'APP 活跃', score: 28 },
          { name: '自助渠道', score: 45 }, { name: '流失风险', score: 68 }
        ],
        tagCategories: {
          behavior: [
            { name: '90天无厅店接触', weight: 91 }, { name: 'APP 活跃低', weight: 85 }
          ],
          value: [{ name: '中低 ARPU', weight: 58 }],
          risk: [{ name: '渠道流失风险', weight: 88 }, { name: '沉默用户', weight: 72 }],
          preference: [{ name: '线下办理减少', weight: 76 }]
        },
        mindMap: {
          center: '低接触流失',
          branches: [
            { title: '接触缺失', items: ['无厅店', '低 APP'] },
            { title: '风险', items: ['渠道流失', '沉默'] },
            { title: '唤醒策略', items: ['短信', '外呼', '权益'] },
            { title: '渠道引导', items: ['APP 引导', '社区厅'] }
          ]
        }
      }
    }
  ];

  window.METRIC_SEGMENT_MAP = {
    'm-root': ['seg-out-package', 'seg-video-pack'],
    'm1': ['seg-video-pack'],
    'm1b': ['seg-high-downgrade', 'seg-contract-end'],
    'm1b1': ['seg-high-downgrade'],
    'm2': ['seg-out-package', 'seg-low-touch'],
    'm2a': ['seg-out-package'],
    'm2a1': ['seg-out-package', 'seg-low-touch'],
    'm3': ['seg-video-pack'],
    'm3a': ['seg-video-pack'],
    'h-root': ['seg-high-downgrade'],
    'h1': ['seg-high-downgrade', 'seg-contract-end'],
    'h2': ['seg-churn-risk', 'seg-high-downgrade'],
    'c-root': ['seg-churn-risk'],
    'c1': ['seg-churn-risk'],
    'f-root': ['seg-family-fusion'],
    'i-root': ['seg-intl-roam']
  };

  window.getSegmentById = function (id) {
    const row = (window.CUSTOMER_SEGMENT_OPTIONS || []).find(s => s.id === id);
    return row ? JSON.parse(JSON.stringify(row)) : null;
  };

  window.cloneSegmentRefs = function (ids) {
    return (ids || []).map(id => window.getSegmentById(id)).filter(Boolean);
  };

  window.enrichTreeSegments = function (root) {
    if (!root) return root;
    function walk(node) {
      if (!node.segments || !node.segments.length) {
        let ids = window.METRIC_SEGMENT_MAP[node.id];
        if ((!ids || !ids.length) && typeof window.resolveHeChurnSegmentIds === 'function') {
          ids = window.resolveHeChurnSegmentIds(node);
        }
        if (ids && ids.length) node.segments = window.cloneSegmentRefs(ids);
      }
      (node.children || []).forEach(walk);
    }
    walk(root);
    return root;
  };

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function renderDonutChart(gender, size) {
    const m = gender?.male ?? 50;
    const f = gender?.female ?? 50;
    const r = 36;
    const c = 2 * Math.PI * r;
    const mLen = (m / 100) * c;
    const fLen = (f / 100) * c;
    return `
      <div class="seg-chart-donut-wrap">
        <svg class="seg-chart-donut" viewBox="0 0 88 88" width="${size || 88}" height="${size || 88}">
          <circle cx="44" cy="44" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="12"/>
          <circle cx="44" cy="44" r="${r}" fill="none" stroke="#2563eb" stroke-width="12"
            stroke-dasharray="${mLen} ${c}" stroke-dashoffset="0" transform="rotate(-90 44 44)"/>
          <circle cx="44" cy="44" r="${r}" fill="none" stroke="#ec4899" stroke-width="12"
            stroke-dasharray="${fLen} ${c}" stroke-dashoffset="${-mLen}" transform="rotate(-90 44 44)"/>
          <text x="44" y="42" text-anchor="middle" font-size="11" fill="#64748b">性别</text>
          <text x="44" y="54" text-anchor="middle" font-size="10" fill="#0f172a" font-weight="600">${m}:${f}</text>
        </svg>
        <div class="seg-chart-legend">
          <span><i class="dot" style="background:#2563eb"></i>男 ${m}%</span>
          <span><i class="dot" style="background:#ec4899"></i>女 ${f}%</span>
        </div>
      </div>`;
  }

  function renderAgeBars(ageBands) {
    const bands = ageBands || [];
    const max = Math.max(...bands.map(b => b.pct), 1);
    return `
      <div class="seg-chart-bars">
        ${bands.map(b => `
          <div class="seg-bar-row">
            <span class="seg-bar-label">${esc(b.label)}</span>
            <div class="seg-bar-track"><div class="seg-bar-fill" style="width:${(b.pct / max) * 100}%"></div></div>
            <span class="seg-bar-pct">${b.pct}%</span>
          </div>`).join('')}
      </div>`;
  }

  function renderBehaviorBars(behaviors) {
    const list = behaviors || [];
    return `
      <div class="seg-chart-bars seg-chart-behavior">
        ${list.map(b => `
          <div class="seg-bar-row">
            <span class="seg-bar-label">${esc(b.name)}</span>
            <div class="seg-bar-track"><div class="seg-bar-fill behavior" style="width:${b.score}%"></div></div>
            <span class="seg-bar-pct">${b.score}</span>
          </div>`).join('')}
      </div>`;
  }

  /** 各维度 — 业务人员可读标题与说明 */
  const DIM_BUSINESS = {
    behavior: {
      question: '他们平时怎么用？',
      intro: '从上网、办业务和换套餐等习惯，判断客户是否还在稳定使用。'
    },
    value: {
      question: '消费价值怎么样？',
      intro: '看每月花多少钱、用什么档位，还有没有提升空间。'
    },
    risk: {
      question: '有没有流失风险？',
      intro: '看投诉、欠费、合约快到期、接触其他运营商等情况。'
    },
    preference: {
      question: '喜欢怎么办理业务？',
      intro: '看客户更愿意去营业厅、找客户经理，还是自己用手机办。'
    }
  };

  const PORTRAIT_DIM_ICONS = {
    behavior: 'fa-mobile-screen',
    value: 'fa-wallet',
    risk: 'fa-shield-halved',
    preference: 'fa-store'
  };

  /** 特征 — 业务化表述（标题、含义、具体表现） */
  const TRAIT_BUSINESS_PRESETS = {
    '近3月降档倾向': {
      title: '有换更便宜套餐的想法',
      meaning: '不少客户最近在对比低档套餐，存在降档或流失风险，建议提前挽留。',
      facts: [
        '约 7 成客户会主动打开低档套餐页面',
        '平均每周查看比价页面 2 次以上',
        '咨询「降档/换低价套餐」的电话比上月明显增加'
      ]
    },
    'APP 办理活跃': {
      title: '习惯用手机自助办理',
      meaning: '客户愿意通过 APP 查账单、改套餐，适合推送 App 内活动与提醒。',
      facts: [
        '超过 6 成客户每月登录 APP 超过 15 天',
        '平均每月在 APP 上办理或查询业务 1～2 次',
        '账单查询是最高频操作之一'
      ]
    },
    '热线咨询增多': {
      title: '经常打客服电话咨询',
      meaning: '咨询量上升往往伴随不满或犹豫，可结合话术与专属优惠跟进。',
      facts: [
        '人均每月拨打客服约 1～2 次',
        '套餐、资费类咨询占四成以上',
        '部分来电会升级为投诉工单'
      ]
    },
    '合约≤60天到期': {
      title: '合约快到期了',
      meaning: '合约将在两个月内到期，是续约、升档或挽留的关键窗口期。',
      facts: [
        '绝大多数客户合约剩余不足 60 天',
        '已发送到期提醒的约占 8 成',
        '主动打开续约页面的客户仍偏少，需主动触达'
      ]
    },
    '竞品接触': {
      title: '接触过其他运营商',
      meaning: '收到异网营销或查询携转，说明正在被竞对挖角，需尽快干预。',
      facts: [
        '约 3 成客户收到过异网优惠短信',
        '一小部分客户查询过携号转网',
        '双卡或副卡新增略有上升'
      ]
    },
    '月均套外>3次': {
      title: '经常产生套外流量费',
      meaning: '套餐外费用高，客户对资费敏感，适合推荐定向包或升档套餐。',
      facts: [
        '超 7 成客户每月套外计费超过 3 次',
        '套外费用常占账单两成左右',
        '半数左右客户会忽略超套提醒短信'
      ]
    },
    '视频流量占比高': {
      title: '爱看视频，流量消耗大',
      meaning: '视频类应用用得多，是推视频定向包、联合会员的合适人群。',
      facts: [
        '视频流量常占当月总流量一半以上',
        '晚上 8～11 点是使用高峰',
        '抖音、爱奇艺等应用使用最频繁'
      ]
    },
    '近30日投诉': {
      title: '最近有投诉记录',
      meaning: '近期有过不满反馈，服务体验需重点修复，避免进一步流失。',
      facts: [
        '人均近月投诉不到 1 单，但群体占比不低',
        '服务类问题占多数',
        '仍有重复投诉，需闭环回访'
      ]
    },
    '竞品接触信号': {
      title: '有明显携转或降档意向',
      meaning: '已出现携转查询、降档申请等强信号，建议客户经理优先外呼。',
      facts: [
        '约 1 成客户登记过携转意向',
        '两成左右接到异网营销电话',
        '降档类申请环比上升'
      ]
    },
    '有宽带未融合': {
      title: '有宽带但没办融合包',
      meaning: '家里已有宽带却未办融合，适合推荐家庭融合套餐提升粘性。',
      facts: [
        '9 成以上仅有宽带、未办融合',
        '不少家庭已 6 个月以上未升级套餐',
        '平均每户有 2～3 张手机卡，有捆绑空间'
      ]
    },
    '90天无厅店接触': {
      title: '很久没去营业厅了',
      meaning: '长期无线下接触，关系变弱，适合短信、外呼或社区厅活动召回。',
      facts: [
        '9 成以上客户 90 天内无厅店记录',
        '最近主要通过热线或 APP 接触',
        '一年内很少享受装维或厅店服务'
      ]
    },
    '全球通银卡+': {
      title: '中高端存量客户',
      meaning: '全球通银卡及以上，消费相对稳定，适合保有与升档营销。',
      facts: ['月均消费高于普通用户', '对专属服务有一定感知', '家庭融合仍有拓展机会']
    },
    '套餐比价敏感': {
      title: '对价格特别敏感',
      meaning: '换套餐前会比价，推活动时要突出性价比与赠费。',
      facts: ['活动页停留时间长', '低档套餐关注度高', '对赠费、减免反应明显']
    }
  };

  const SEGMENT_PORTRAIT_SUMMARY = {
    'seg-high-downgrade': '这是一群<strong>月均消费约 118 元</strong>的中高端客户，以 30～45 岁为主。近期<strong>降档、比价换套餐</strong>的行为增多，且不少人的<strong>合约即将到期</strong>，建议优先做续约与专属挽留。',
    'seg-out-package': '这群客户<strong>套外流量费偏高</strong>，多为年轻用户，习惯<strong>线上自助办理</strong>。适合推荐定向流量包或升档，并关注<strong>账单异议</strong>带来的不满。',
    'seg-video-pack': '客户<strong>爱刷视频、流量消耗大</strong>，但<strong>还没办视频定向包</strong>。可通过 APP 推送定向包、联合会员，转化空间较大。',
    'seg-churn-risk': '属于<strong>离网风险较高</strong>人群：近期有投诉、余额偏紧，且<strong>接触过其他运营商</strong>。建议客户经理优先外呼、提供挽留方案。',
    'seg-contract-end': '以<strong>高消费、合约快到期</strong>客户为主，历史续约率不高，需<strong>客户经理主动维系</strong>，可结合融合业务提升黏性。',
    'seg-family-fusion': '家里<strong>有宽带但未办融合</strong>的家庭用户较多，适合推荐<strong>融合套餐、电视业务</strong>，通过社区厅、装维上门触达。',
    'seg-intl-roam': '经常<strong>出国或漫游</strong>的高消费客户，<strong>还没订漫游月包</strong>的不少，可在出境前通过 APP 推送国漫优惠。',
    'seg-low-touch': '长期<strong>很少来营业厅、APP 也不常打开</strong>，和客户关系在变淡，适合用外呼、权益活动等方式唤醒。'
  };

  function weightToLevel(weight) {
    if (weight >= 80) return { label: '需重点关注', cls: 'high' };
    if (weight >= 55) return { label: '值得留意', cls: 'mid' };
    return { label: '表现一般', cls: 'low' };
  }

  function buildTraitBusiness(tag) {
    const preset = TRAIT_BUSINESS_PRESETS[tag.name];
    const level = weightToLevel(tag.weight);
    if (preset) {
      return { ...preset, weight: tag.weight, level };
    }
    return {
      title: tag.name,
      meaning: `该特征在本客群中较${level.label === '需重点关注' ? '突出' : '明显'}，可作为营销或维系时的参考依据。`,
      facts: [
        `约 ${Math.min(95, tag.weight + 5)}% 的客户符合该特征`,
        level.label === '需重点关注' ? '近一个月表现持续增强' : '近期整体较平稳',
        '建议结合属地活动或专属优惠跟进'
      ],
      weight: tag.weight,
      level
    };
  }

  function buildPortraitDims(analytics) {
    if (analytics.portraitDims?.length) return analytics.portraitDims;
    const cats = analytics.tagCategories || {};
    return Object.keys(TAG_PALETTE).map(key => {
      const tags = cats[key] || [];
      if (!tags.length) return null;
      const meta = TAG_PALETTE[key];
      return {
        key,
        title: meta.label,
        color: meta.color,
        bg: meta.bg,
        icon: PORTRAIT_DIM_ICONS[key] || 'fa-circle',
        traits: tags.map(t => buildTraitBusiness(t))
      };
    }).filter(Boolean);
  }

  function getPortraitSummary(seg) {
    if (SEGMENT_PORTRAIT_SUMMARY[seg.id]) return SEGMENT_PORTRAIT_SUMMARY[seg.id];
    const p = seg.profile || {};
    const tags = (seg.analytics?.tagCategories?.risk || [])
      .concat(seg.analytics?.tagCategories?.behavior || [])
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map(t => t.name);
    const tagText = tags.length ? `，尤其需关注「${tags.join('」「')}」` : '';
    return `该客群约 <strong>${esc(seg.scaleLabel || '')}</strong>，主力为 ${esc(p.ageMain || '各年龄段')}，月均消费约 ${esc(p.arpu || '—')}${tagText}。`;
  }

  function renderPortraitAnalysis(analytics, seg) {
    const dims = buildPortraitDims(analytics);
    if (!dims.length) return '<p class="segment-empty">暂无画像分析数据</p>';
    const summary = getPortraitSummary(seg || {});
    return `
      <div class="portrait-biz-wrap">
        <div class="portrait-one-liner">
          <div class="portrait-one-liner-icon"><i class="fas fa-lightbulb"></i></div>
          <div class="portrait-one-liner-body">
            <strong>客群特点（一句话）</strong>
            <p>${summary}</p>
          </div>
        </div>
        <div class="portrait-biz-grid">
          ${dims.map(dim => {
            const biz = DIM_BUSINESS[dim.key] || { question: dim.title, intro: '' };
            return `
            <section class="portrait-biz-dim" style="--dim-color:${dim.color};--dim-bg:${dim.bg}">
              <header class="portrait-biz-dim-head">
                <span class="portrait-biz-dim-icon"><i class="fas ${dim.icon}"></i></span>
                <div>
                  <h6 class="portrait-biz-dim-q">${esc(biz.question)}</h6>
                  <span class="portrait-biz-dim-tag">${esc(dim.title)}</span>
                </div>
              </header>
              <p class="portrait-biz-dim-intro">${esc(biz.intro)}</p>
              <div class="portrait-biz-traits">
                ${dim.traits.map(tr => `
                  <article class="portrait-biz-trait">
                    <div class="portrait-biz-trait-top">
                      <h6 class="portrait-biz-trait-title">${esc(tr.title)}</h6>
                      <span class="biz-level ${tr.level.cls}">${esc(tr.level.label)}</span>
                    </div>
                    <p class="portrait-biz-trait-meaning">${esc(tr.meaning)}</p>
                    <div class="portrait-biz-facts-title">具体表现</div>
                    <ul class="portrait-biz-facts">
                      ${(tr.facts || []).map(f => `<li><i class="fas fa-check"></i>${esc(f)}</li>`).join('')}
                    </ul>
                  </article>`).join('')}
              </div>
            </section>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderSegmentDetail(seg) {
    const a = seg.analytics || {};
    const p = seg.profile || {};
    return `
      <article class="segment-profile-card segment-profile-rich">
        <div class="segment-profile-head">
          <div>
            <h4 class="segment-profile-name">${esc(seg.name)}</h4>
            <span class="segment-profile-scene">${esc(seg.scene || '—')}</span>
          </div>
          <div class="segment-profile-scale">
            <span class="scale-num">${esc(seg.scaleLabel || (seg.scale ? seg.scale.toLocaleString() + ' 人' : '—'))}</span>
            <span class="scale-label">客群规模</span>
          </div>
        </div>

        <div class="segment-kpi-strip">
          <div class="seg-kpi"><span class="k">月均 ARPU</span><span class="v">${esc(p.arpu || '—')}</span></div>
          <div class="seg-kpi"><span class="k">主力年龄</span><span class="v">${esc(p.ageMain || '—')}</span></div>
          <div class="seg-kpi"><span class="k">网络</span><span class="v">${esc(p.network || '—')}</span></div>
          <div class="seg-kpi"><span class="k">渠道偏好</span><span class="v">${esc(p.channelPref || '—')}</span></div>
        </div>

        <div class="segment-viz-grid">
          <div class="segment-viz-card">
            <h5 class="segment-viz-title"><i class="fas fa-chart-pie"></i> 性别结构</h5>
            ${renderDonutChart(a.gender)}
          </div>
          <div class="segment-viz-card">
            <h5 class="segment-viz-title"><i class="fas fa-chart-column"></i> 年龄分布</h5>
            ${renderAgeBars(a.ageBands)}
          </div>
          <div class="segment-viz-card">
            <h5 class="segment-viz-title"><i class="fas fa-list-check"></i> 关键行为表现</h5>
            ${renderBehaviorBars(a.behaviors)}
          </div>
        </div>

      </article>`;
  }

  function bindSegmentSubTabs(segments, container) {
    const tabs = container.querySelectorAll('.segment-sub-tab');
    const body = container.querySelector('#segment-detail-body');
    if (!tabs.length || !body) return;
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const seg = segments.find(s => s.id === tab.dataset.segId);
        if (seg) body.innerHTML = renderSegmentDetail(seg);
      });
    });
  }

  window.renderAggregatedSegmentCard = function (agg, options) {
    const opts = options || {};
    const p = opts.idPrefix || 'seg';
    const minimal = !!opts.minimal;
    const dispatchCompact = !!opts.dispatchCompact;
    const rootCauseFlow = !!opts.rootCauseFlow;
    if (dispatchCompact) {
      return `
      <div class="agg-segment-hero agg-segment-dispatch-compact">
        <div class="agg-segment-main-card">
          <p class="agg-segment-scale"><i class="fas fa-users"></i> ${esc(agg.scaleLabel)}</p>
          <div class="agg-segment-actions">
            <button type="button" class="btn btn-primary btn-block" id="btn-${p}-strategy">
              <i class="fas fa-bullhorn"></i> 创建营销策略
            </button>
          </div>
        </div>
      </div>`;
    }
    if (rootCauseFlow) {
      return `
      <div class="agg-segment-hero agg-segment-rc-flow">
        <div class="agg-segment-main-card">
          <div class="agg-segment-head">
            <div class="agg-segment-head-row">
              <h4 class="rc-card-section-title">异动客群</h4>
              <span class="agg-segment-info icon-caliber-wrap" tabindex="0" aria-label="异动客群说明">
                <i class="fas fa-circle-info"></i>
                <span class="tooltip-caliber">异动客群由根因链路客群汇聚后去重</span>
              </span>
            </div>
          </div>
          <p class="rc-card-scale agg-segment-scale"><i class="fas fa-users"></i> ${esc(agg.scaleLabel)}</p>
          <div class="agg-segment-actions">
            <button type="button" class="btn btn-primary" id="btn-${p}-strategy">
              <i class="fas fa-bullhorn"></i> 创建营销策略
            </button>
            <button type="button" class="btn btn-outline" id="btn-${p}-segment-dispatch">
              <i class="fas fa-users-cog"></i> 客群调度
            </button>
          </div>
        </div>
      </div>`;
    }
    return `
      <div class="agg-segment-hero">
        <div class="agg-segment-main-card">
          <div class="agg-segment-head">
            <span class="badge badge-primary">汇聚客群</span>
            <h3 class="agg-segment-title">${esc(agg.name)}</h3>
            <p class="agg-segment-scale"><i class="fas fa-users"></i> ${esc(agg.scaleLabel)}</p>
          </div>
          ${minimal ? '' : `
          <div class="agg-convergence-block">
            <h4>汇聚标签</h4>
            <div class="agg-tag-row">${(agg.tagConvergence || []).map(t => `<span class="tag-chip tag-chip-v">${esc(t)}</span>`).join('') || '<span class="muted">—</span>'}</div>
          </div>`}
          <div class="agg-segment-actions">
            <button type="button" class="btn btn-primary btn-seg-portrait-open" id="btn-${p}-portrait" data-seg-portrait="1">
              <i class="fas fa-map-location-dot"></i> 客群画像分析
            </button>
            <button type="button" class="btn btn-outline" id="btn-${p}-strategy">
              <i class="fas fa-bullhorn"></i> 创建营销策略
            </button>
          </div>
        </div>
      </div>`;
  };

  function renderAggregatedSegmentHero(agg) {
    return window.renderAggregatedSegmentCard(agg, { idPrefix: 'seg', minimal: true });
  }

  window.bindAggregatedSegmentActions = function (rootEl, idPrefix, aggOverride) {
    const p = idPrefix || 'seg';
    const scope = rootEl || document;
    const showPortrait = scope.querySelector('#btn-' + p + '-portrait');
    const strategy = scope.querySelector('#btn-' + p + '-strategy');
    showPortrait?.addEventListener('click', () => {
      const agg = aggOverride || window._rcAggregatedSegment;
      if (typeof window.openSegmentCityPortraitModal === 'function') {
        window.openSegmentCityPortraitModal(agg);
      }
    });
    strategy?.addEventListener('click', () => {
      const agg = aggOverride || window._rcAggregatedSegment;
      if (typeof window.navigateToStrategyCreate === 'function') {
        window.navigateToStrategyCreate(agg, { from: idPrefix === 'rc-seg' ? 'root-cause' : 'segment' });
      } else {
        window.location.href = 'strategy-create.html';
      }
    });
    const segDispatch = scope.querySelector('#btn-' + p + '-segment-dispatch');
    segDispatch?.addEventListener('click', () => {
      const agg = aggOverride || window._rcAggregatedSegment;
      if (!agg) {
        window.alert('暂未生成汇聚客群，请等待根因分析完成后再试');
        return;
      }
      const cityDrill = window.jxDrillState?.city && !window.jxDrillState?.county;
      const hintMsg = cityDrill
        ? '已选择地市，按区县下钻异动关联客群规模，勾选区县后填写工单并指派区县负责人。\n\n是否继续进入客群调度？'
        : '省级按地市下钻异动关联客群规模，勾选地市后填写工单并指派地市负责人。\n\n是否继续进入客群调度？';
      if (!window.confirm(hintMsg)) return;
      if (typeof window.navigateToSegmentDispatch === 'function') {
        window.navigateToSegmentDispatch(agg);
        return;
      }
      try {
        const payload = {
          name: agg.name,
          scaleLabel: agg.scaleLabel,
          sourceMetric: agg.sourceMetric,
          nodeId: agg.nodeId || agg.id
        };
        sessionStorage.setItem('jxSegmentDispatchCtx', JSON.stringify(payload));
        localStorage.setItem('jxSegmentDispatchCtx', JSON.stringify(payload));
      } catch (e) { /* ignore */ }
      window.location.href = 'segment-dispatch.html';
    });
  };

  function renderSegmentSplitHeatmapFixed(node) {
    if (!window.SegmentSplitData) {
      return '<p class="segment-empty">客群分群数据未加载</p>';
    }
    const mx = SegmentSplitData.getMatrix(node);
    const fmt = SegmentSplitData.formatNum;
    const multiCol = mx.columns.length > 1;

    const attrSpans = {};
    mx.rows.forEach(r => {
      attrSpans[r.attr] = (attrSpans[r.attr] || 0) + 1;
    });
    const attrRendered = {};

    const metricHeader = multiCol
      ? `<tr>
          <th colspan="3" class="seg-heat-corner-sticky"></th>
          <th colspan="${mx.columns.length}" class="seg-heat-metric-banner">${esc(mx.metricBanner)}</th>
        </tr>
        <tr>
          <th class="seg-heat-th-sticky seg-heat-attr">客群属性</th>
          <th class="seg-heat-th-sticky seg-heat-name">客群名称</th>
          <th class="seg-heat-th-sticky seg-heat-count">客群数量</th>
          ${mx.columns.map(c => `<th class="seg-heat-th-metric">${esc(c.name)}</th>`).join('')}
        </tr>`
      : `<tr>
          <th class="seg-heat-th-sticky seg-heat-attr">客群属性</th>
          <th class="seg-heat-th-sticky seg-heat-name">客群名称</th>
          <th class="seg-heat-th-sticky seg-heat-count">客群数量</th>
          <th class="seg-heat-th-val">指标值</th>
          <th class="seg-heat-th-metric seg-heat-banner-cell">${esc(mx.metricBanner)}</th>
          <th class="seg-heat-th-pp">环比(PP)</th>
        </tr>`;

    const fmtPlain = SegmentSplitData.formatNumPlain || fmt;

    const bodyRows = mx.rows.map(row => {
      let attrTd = '';
      if (!attrRendered[row.attr]) {
        attrRendered[row.attr] = true;
        attrTd = `<td class="seg-heat-td-attr" rowspan="${attrSpans[row.attr]}">${esc(row.attr)}</td>`;
      }

      const dataCells = multiCol
        ? row.cells.map(c => `
            <td class="seg-heat-td-val ${c.cellClass}" style="${c.cellStyle}" title="${esc(c.metricName)}：贡献 ${fmt(c.contribution)}">
              ${fmtPlain(c.contribution)}
            </td>`).join('')
        : (() => {
            const c = row.cells[0];
            return `
            <td class="seg-heat-td-val seg-heat-plain">${c.value.toLocaleString()}</td>
            <td class="seg-heat-td-val ${c.cellClass}" style="${c.cellStyle}">${fmtPlain(c.contribution)}</td>
            <td class="seg-heat-td-val ${c.pp >= 0 ? 'seg-heat-pos-text' : 'seg-heat-neg-text'}">${fmtPlain(c.pp)}</td>`;
          })();

      return `<tr>
        ${attrTd}
        <td class="seg-heat-td-name">${esc(row.name)}</td>
        <td class="seg-heat-td-count">${row.count.toLocaleString()}</td>
        ${dataCells}
      </tr>`;
    }).join('');

    const total = mx.totalRow;
    const totalRowHtml = total ? (() => {
      const dataCells = multiCol
        ? total.cells.map(c => `
            <td class="seg-heat-td-val seg-heat-total-val" style="${c.cellStyle}">${fmtPlain(c.contribution)}</td>`).join('')
        : (() => {
            const c = total.cells[0];
            return `
            <td class="seg-heat-td-val seg-heat-total-val" style="background:#dc2626;color:#fff">—</td>
            <td class="seg-heat-td-val seg-heat-total-val" style="${c.cellStyle}">${fmtPlain(c.contribution)}</td>
            <td class="seg-heat-td-val seg-heat-total-val" style="${c.cellStyle}">${fmtPlain(c.pp)}</td>`;
          })();
      return `<tr class="seg-heat-row-total">
        <td class="seg-heat-td-attr seg-heat-total-label" colspan="2">${esc(total.name)}</td>
        <td class="seg-heat-td-count seg-heat-total-val" style="background:#dc2626;color:#fff">${total.count.toLocaleString()}</td>
        ${dataCells}
      </tr>`;
    })() : '';

    return `
      <div class="seg-split-dashboard">
        <div class="seg-split-head">
          <div>
            <h4 class="seg-split-title">${esc(mx.title)}</h4>
            <p class="seg-split-desc">基于 <strong>${esc(mx.metricTitle)}</strong>，按一类～六类共 <strong>46</strong> 个客群细分展示指标贡献（含合计行）；
            <span class="seg-heat-legend-inline"><i class="seg-leg-pos"></i>正向（绿）</span>
            <span class="seg-heat-legend-inline"><i class="seg-leg-neg"></i>负向（红）</span>。
            切换指标树节点可查看对应分析结果。</p>
          </div>
          <div class="seg-split-stats">
            <span>合计 <strong>${mx.totalCount.toLocaleString()}</strong></span>
            <span>正向客群 <strong class="up">${mx.summary.positive}</strong></span>
            <span>负向客群 <strong class="down">${mx.summary.negative}</strong></span>
          </div>
        </div>
        <div class="seg-heat-scroll">
          <table class="seg-heat-table">
            <thead>${metricHeader}</thead>
            <tbody>${bodyRows}${totalRowHtml}</tbody>
          </table>
        </div>
      </div>`;
  }

  window.renderMetricSegmentPanel = function (node, containerId) {
    const el = document.getElementById(containerId || 'metric-segment-panel');
    if (!el || !node) return;
    el.innerHTML = renderSegmentSplitHeatmapFixed(node);
  };
})();
