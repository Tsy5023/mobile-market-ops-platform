/** 根因分析 - 三级标签树（取值：枚举 / 数值区间，含客群人数） */
(function () {
  const MAX_TAG_DEPTH = 3;

  /**
   * 标签定义
   * valueType: 'enum' | 'range'
   * values: [{ label, hit }]  hit 为客群人数
   */
  const TAG_DEF = {
    '近30日携转查询': {
      valueType: 'enum',
      values: [
        { label: '有查询', hit: '3,620' },
        { label: '无查询', hit: '8,240' }
      ],
      children: ['离网倾向', '异网接触频次']
    },
    '离网倾向': {
      valueType: 'enum',
      values: [
        { label: '高', hit: '2,850' },
        { label: '中', hit: '1,420' },
        { label: '低', hit: '980' }
      ],
      children: ['近7日异网接触', '携转意向评分']
    },
    '异网接触': {
      valueType: 'enum',
      values: [
        { label: '是', hit: '2,160' },
        { label: '否', hit: '5,680' }
      ],
      children: ['竞品APP安装', '异网短信触达']
    },
    '异网接触频次': {
      valueType: 'range',
      rangeDisplay: '(0~10)',
      values: [
        { label: '≥3次/月', hit: '1,280' },
        { label: '1-2次/月', hit: '2,040' },
        { label: '0次', hit: '4,520' }
      ],
      children: ['竞品APP安装']
    },
    '竞品APP安装': {
      valueType: 'enum',
      values: [{ label: '已安装', hit: '890' }, { label: '未安装', hit: '1,920' }],
      children: []
    },
    '异网短信触达': {
      valueType: 'enum',
      values: [{ label: '有', hit: '620' }, { label: '无', hit: '1,540' }],
      children: []
    },
    '近7日异网接触': {
      valueType: 'enum',
      values: [{ label: '有', hit: '760' }, { label: '无', hit: '2,090' }],
      children: []
    },
    '携转意向评分': {
      valueType: 'range',
      rangeDisplay: '(0~100)',
      values: [
        { label: '80-100分', hit: '420' },
        { label: '60-79分', hit: '680' },
        { label: '<60分', hit: '1,750' }
      ],
      children: []
    },
    '合约临近到期': {
      valueType: 'range',
      rangeDisplay: '(0~90)',
      values: [
        { label: '≤30天', hit: '2,150' },
        { label: '31-60天', hit: '1,860' },
        { label: '>60天', hit: '3,420' }
      ],
      children: ['续约意向', '专属优惠触达']
    },
    '续约意向': {
      valueType: 'enum',
      values: [{ label: '低', hit: '980' }, { label: '中', hit: '720' }, { label: '高', hit: '450' }],
      children: []
    },
    '专属优惠触达': {
      valueType: 'enum',
      values: [{ label: '未触达', hit: '1,120' }, { label: '已触达', hit: '640' }],
      children: []
    },
    '账单异议': {
      valueType: 'enum',
      values: [{ label: '有异议', hit: '1,256' }, { label: '无异议', hit: '6,840' }],
      children: ['服务不满', '欠费预警']
    },
    '服务不满': {
      valueType: 'enum',
      values: [{ label: '是', hit: '850' }, { label: '否', hit: '2,100' }],
      children: ['投诉历史']
    },
    '投诉历史': {
      valueType: 'range',
      rangeDisplay: '(0~5)',
      values: [
        { label: '≥2次/年', hit: '320' },
        { label: '1次/年', hit: '410' },
        { label: '0次', hit: '1,530' }
      ],
      children: []
    },
    '欠费预警': {
      valueType: 'range',
      rangeDisplay: '(0~500)',
      values: [
        { label: '≥100元', hit: '280' },
        { label: '1-99元', hit: '520' },
        { label: '0元', hit: '1,890' }
      ],
      children: []
    },
    '中高端降档预警': {
      valueType: 'enum',
      values: [{ label: '是', hit: '12,840' }, { label: '疑似', hit: '3,260' }],
      children: ['套餐降档倾向', 'ARPU连续下滑']
    },
    '套餐降档倾向': {
      valueType: 'enum',
      values: [{ label: '是', hit: '8,420' }, { label: '疑似', hit: '2,180' }],
      children: ['流量使用不足', '比价换套餐']
    },
    '比价换套餐': {
      valueType: 'enum',
      values: [{ label: '是', hit: '3,240' }, { label: '否', hit: '5,100' }],
      children: ['竞品套餐浏览']
    },
    '竞品套餐浏览': {
      valueType: 'range',
      rangeDisplay: '(0~30)',
      values: [
        { label: '≥5次/月', hit: '680' },
        { label: '1-4次/月', hit: '920' },
        { label: '0次', hit: '1,640' }
      ],
      children: []
    },
    'ARPU连续下滑': {
      valueType: 'range',
      rangeDisplay: '(0~300)',
      values: [
        { label: '连续3月', hit: '2,860' },
        { label: '连续2月', hit: '6,110' },
        { label: '单月', hit: '3,420' }
      ],
      children: ['套餐档位偏低', '套外费用占比']
    },
    '套餐档位偏低': {
      valueType: 'enum',
      values: [{ label: '是', hit: '4,720' }, { label: '否', hit: '2,390' }],
      children: []
    },
    '套外费用占比': {
      valueType: 'range',
      rangeDisplay: '(0~100)',
      values: [
        { label: '≥30%', hit: '1,120' },
        { label: '10-29%', hit: '980' },
        { label: '<10%', hit: '2,310' }
      ],
      children: []
    },
    '流量使用不足': {
      valueType: 'range',
      rangeDisplay: '(0~100)',
      values: [
        { label: '<30%', hit: '5,180' },
        { label: '30-60%', hit: '2,640' },
        { label: '>60%', hit: '1,120' }
      ],
      children: ['视频超套']
    },
    '视频超套': {
      valueType: 'enum',
      values: [{ label: '是', hit: '3,200' }, { label: '否', hit: '1,980' }],
      children: []
    },
    '活动到期降档': {
      valueType: 'enum',
      values: [{ label: '是', hit: '3,240' }, { label: '否', hit: '4,860' }],
      children: ['优惠到期未续']
    },
    '优惠到期未续': {
      valueType: 'enum',
      values: [{ label: '是', hit: '1,420' }, { label: '否', hit: '1,820' }],
      children: []
    },
    '沉默用户': {
      valueType: 'range',
      rangeDisplay: '(0~180)',
      values: [
        { label: '≥90天', hit: '2,680' },
        { label: '60-89天', hit: '1,540' },
        { label: '<60天', hit: '980' }
      ],
      children: ['APP零活跃']
    },
    'APP零活跃': {
      valueType: 'enum',
      values: [{ label: '是', hit: '1,860' }, { label: '否', hit: '820' }],
      children: []
    },
    '未办融合': {
      valueType: 'enum',
      values: [{ label: '是', hit: '8,620' }, { label: '否', hit: '12,400' }],
      children: ['家庭宽带未捆绑']
    },
    '家庭宽带未捆绑': {
      valueType: 'enum',
      values: [{ label: '是', hit: '4,280' }, { label: '否', hit: '4,340' }],
      children: ['宽带到期预警']
    },
    '宽带到期预警': {
      valueType: 'range',
      rangeDisplay: '(0~90)',
      values: [
        { label: '≤30天', hit: '920' },
        { label: '>30天', hit: '3,360' }
      ],
      children: []
    },
    '低接触客群': {
      valueType: 'enum',
      values: [{ label: '是', hit: '3,620' }, { label: '否', hit: '9,840' }],
      children: ['渠道流失风险', 'APP活跃低']
    },
    '渠道流失风险': {
      valueType: 'enum',
      values: [{ label: '高', hit: '3,100' }, { label: '中', hit: '1,820' }],
      children: ['厅店零接触天数']
    },
    '厅店零接触天数': {
      valueType: 'range',
      rangeDisplay: '(0~120)',
      values: [
        { label: '≥90天', hit: '1,420' },
        { label: '30-89天', hit: '980' },
        { label: '<30天', hit: '700' }
      ],
      children: []
    },
    'APP活跃低': {
      valueType: 'range',
      rangeDisplay: '(0~30)',
      values: [
        { label: '≤2次/月', hit: '2,940' },
        { label: '3-5次/月', hit: '1,680' },
        { label: '>5次/月', hit: '820' }
      ],
      children: ['自助渠道偏好']
    },
    '自助渠道偏好': {
      valueType: 'enum',
      values: [{ label: '是', hit: '2,940' }, { label: '否', hit: '1,120' }],
      children: []
    },
    '套外高依赖': {
      valueType: 'enum',
      values: [{ label: '是', hit: '4,260' }, { label: '否', hit: '5,300' }],
      children: ['流量突增未转化']
    },
    '流量突增未转化': {
      valueType: 'enum',
      values: [{ label: '是', hit: '4,260' }, { label: '否', hit: '2,180' }],
      children: []
    },
    '套餐外计费敏感': {
      valueType: 'enum',
      values: [{ label: '高敏感', hit: '2,860' }, { label: '一般', hit: '4,120' }],
      children: ['超套频次高']
    },
    '超套频次高': {
      valueType: 'range',
      rangeDisplay: '(0~10)',
      values: [
        { label: '≥3次/月', hit: '1,540' },
        { label: '1-2次/月', hit: '980' }
      ],
      children: []
    },
    '外呼未接通': {
      valueType: 'range',
      rangeDisplay: '(0~5)',
      values: [
        { label: '≥3次', hit: '680' },
        { label: '1-2次', hit: '420' },
        { label: '0次', hit: '320' }
      ],
      children: ['维系任务未完成']
    },
    '维系任务未完成': {
      valueType: 'enum',
      values: [{ label: '是', hit: '1,420' }, { label: '否', hit: '980' }],
      children: []
    },
    '专属权益未领取': {
      valueType: 'enum',
      values: [{ label: '未领取', hit: '860' }, { label: '已领取', hit: '420' }],
      children: []
    },
    '合约续约失败': {
      valueType: 'enum',
      values: [{ label: '是', hit: '620' }, { label: '否', hit: '1,840' }],
      children: ['专属优惠未触达']
    },
    '专属优惠未触达': {
      valueType: 'enum',
      values: [{ label: '是', hit: '4,260' }, { label: '否', hit: '2,180' }],
      children: []
    },
    '是否融合客户': {
      valueType: 'enum',
      values: [{ label: '是', hit: '28,640' }, { label: '否', hit: '42,180' }],
      children: []
    },
    '是否固移融合客户': {
      valueType: 'enum',
      values: [{ label: '是', hit: '18,420' }, { label: '否', hit: '52,400' }],
      children: []
    },
    '中高端高饱和': {
      valueType: 'range',
      rangeDisplay: '(0~100)',
      values: [{ label: '≥80%', hit: '12,860' }],
      children: []
    },
    '近3个月套餐活动到期客户': {
      valueType: 'enum',
      values: [{ label: '是', hit: '9,680' }, { label: '否', hit: '61,200' }],
      children: []
    },
    '是否我主异副': {
      valueType: 'enum',
      values: [{ label: '是', hit: '6,240' }, { label: '否', hit: '64,640' }],
      children: []
    },
    '低流量套餐偏好': {
      valueType: 'enum',
      values: [{ label: '是', hit: '13,980' }, { label: '否', hit: '56,860' }],
      children: []
    },
    '5G终端未换套餐': {
      valueType: 'enum',
      values: [{ label: '是', hit: '8,420' }, { label: '否', hit: '62,480' }],
      children: []
    }
  };

  const DEFAULT_CHILD_SUFFIX = ['关联行为', '风险细分'];

  function slug(s) {
    return String(s).replace(/\s+/g, '').slice(0, 24);
  }

  function hashTag(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
    return Math.abs(h);
  }

  function pickPrimary(values) {
    const v = (values && values[0]) || { label: '—', hit: '—' };
    return { valueLabel: v.label, valueHit: v.hit };
  }

  function sumHits(values) {
    return (values || []).reduce((acc, v) => {
      const n = parseInt(String(v.hit || '').replace(/[^\d]/g, ''), 10);
      return acc + (n || 0);
    }, 0);
  }

  function formatHit(n) {
    return n > 0 ? n.toLocaleString() : '—';
  }

  /** 区间型：统一为 (min~max) 展示，客群取各段合计 */
  function normalizeDef(raw, tagName) {
    const def = { ...raw };
    if (def.valueType !== 'range') return def;
    const h = hashTag(tagName);
    const display = def.rangeDisplay || `(0~${80 + h % 320})`;
    const total = sumHits(def.values) || (1200 + h % 800);
    def.rangeDisplay = display;
    def.values = [{ label: display, hit: formatHit(total) }];
    return def;
  }

  function getDef(tagName) {
    if (TAG_DEF[tagName]) return normalizeDef(TAG_DEF[tagName], tagName);
    const h = hashTag(tagName);
    const isRange = h % 3 === 0;
    return normalizeDef({
      valueType: isRange ? 'range' : 'enum',
      rangeDisplay: isRange ? `(0~${100 + h % 400})` : undefined,
      values: isRange
        ? [{ label: `(0~${100 + h % 400})`, hit: formatHit(1500 + h % 1200) }]
        : [
          { label: '是', hit: formatHit(1500 + h % 1200) },
          { label: '否', hit: formatHit(2800 + h % 2000) }
        ],
      children: []
    }, tagName);
  }

  function syntheticChildName(parentName, suffix, depth) {
    return parentName.replace(/客群|预警|倾向/g, '') + suffix;
  }

  function resolveChildren(tagName, def, depth) {
    if (def.children?.length) return def.children;
    if (depth >= MAX_TAG_DEPTH) return [];
    const h = hashTag(tagName + depth);
    if (h % 4 === 0) return [];
    return DEFAULT_CHILD_SUFFIX.map((s, i) => {
      const name = syntheticChildName(tagName, s, depth);
      if (TAG_DEF[name]) return name;
      return tagName + '·' + s;
    }).slice(0, depth === 1 ? 2 : 1);
  }

  function buildTagNode(tagName, depth, parentKey) {
    const key = parentKey ? parentKey + '/' + tagName : tagName;
    const def = getDef(tagName);
    const primary = pickPrimary(def.values);
    const childNames = resolveChildren(tagName, def, depth);

    const node = {
      id: 'tag-' + slug(key) + '-L' + depth,
      type: 'tag',
      tagLevel: depth,
      name: tagName,
      valueType: def.valueType,
      rangeDisplay: def.rangeDisplay || null,
      values: def.values,
      valueLabel: def.valueType === 'range' ? (def.rangeDisplay || primary.valueLabel) : primary.valueLabel,
      valueHit: primary.valueHit,
      children: []
    };

    if (childNames.length && depth < MAX_TAG_DEPTH) {
      node.children = childNames.map(childName => buildTagNode(childName, depth + 1, key));
    }

    return node;
  }

  function resolveTagId(tagName) {
    if (window.CUSTOMER_LABEL_LIST) {
      const exact = window.CUSTOMER_LABEL_LIST.find(r => r.name === tagName);
      if (exact) return exact.tagId;
      const fuzzy = window.CUSTOMER_LABEL_LIST.find(r =>
        tagName.includes(r.name) || r.name.includes(tagName)
      );
      if (fuzzy) return fuzzy.tagId;
    }
    const h = hashTag(tagName);
    return 'TAG_RC_' + String(1000 + h % 9000).padStart(4, '0');
  }

  function pickTagValue(tagName, index) {
    const def = getDef(tagName);
    const values = def.values || [];
    return values[index % values.length]?.label || '是';
  }

  function pickContextualNumericValue(tagName, h) {
    if (/ARPU|消费|收入|通服|账单|资费|金额/.test(tagName)) {
      return `${58 + h % 130} 元/月`;
    }
    if (/流量|GB|数据|超套|视频|定向/.test(tagName)) {
      return `${(8 + h % 42).toFixed(1)} GB`;
    }
    if (/次数|频次|查询|接触|办理|投诉/.test(tagName)) {
      return `≥${2 + h % 7} 次/月`;
    }
    if (/占比|渗透率|率/.test(tagName)) {
      return `${52 + h % 38}%`;
    }
    if (/连续|月数|周期/.test(tagName)) {
      return `连续 ${2 + h % 5} 个月`;
    }
    if (/年龄|龄/.test(tagName)) {
      return `${26 + h % 10}~${38 + h % 12} 岁`;
    }
    if (/在网|时长|网龄/.test(tagName)) {
      return `${12 + h % 48} 个月`;
    }
    return null;
  }

  window.resolveRcTagFeatureValue = function (tagName, index, branchRank) {
    const def = getDef(tagName);
    const h = hashTag(tagName + ':' + index + ':' + (branchRank || 0));

    if (def.valueType === 'range') {
      return def.rangeDisplay || def.values?.[0]?.label || `(0~${100 + h % 400})`;
    }

    const contextual = pickContextualNumericValue(tagName, h);
    if (contextual) return contextual;

    const kind = (index + h) % 4;
    if (kind === 0) {
      const values = def.values || [];
      return values[h % values.length]?.label || '是';
    }
    if (kind === 1) return `≥${3 + h % 12}`;
    if (kind === 2) return `(0~${100 + h % 500})`;
    return `${45 + h % 50}%`;
  };

  function parseScaleNum(scaleStr) {
    return parseInt(String(scaleStr || '').replace(/[^\d]/g, ''), 10) || 0;
  }

  function formatScaleNum(n) {
    return Math.max(0, n).toLocaleString('zh-CN') + ' 人';
  }

  function normalizeComboExpr(expr) {
    return String(expr || '').replace(/\s+OR\s+/gi, ' AND ').trim();
  }

  function buildComboRelationParts(expr, tagNames, index) {
    const normalized = normalizeComboExpr(expr);
    if (!normalized) {
      const names = tagNames.slice(0, Math.min(3, tagNames.length));
      const parts = [];
      names.forEach((name, i) => {
        if (i > 0) parts.push({ type: 'join', op: 'AND' });
        parts.push({ type: 'tag', tagName: name, value: pickTagValue(name, index + i) });
      });
      return parts;
    }

    const tokens = normalized.split(/\s+(AND|OR)\s+/i);
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 2) {
      chunks.push({ text: tokens[i].trim(), join: tokens[i + 1] || null });
    }

    const parts = [];
    chunks.forEach((chunk, i) => {
      if (i > 0) {
        parts.push({ type: 'join', op: (chunk.join || 'AND').toUpperCase() });
      }
      const matched = tagNames.find(n => chunk.text.includes(n));
      if (matched) {
        parts.push({ type: 'tag', tagName: matched, value: pickTagValue(matched, index + i) });
        return;
      }
      if (/[=><]/.test(chunk.text)) {
        parts.push({ type: 'raw', text: chunk.text.replace(/\s*AND\s*|\s*OR\s*/gi, ' ').trim() });
        return;
      }
      parts.push({ type: 'tag', tagName: chunk.text, value: pickTagValue(chunk.text, index + i) });
    });
    return parts;
  }

  function distributeComboScales(totalScale, count) {
    if (count <= 0) return [];
    if (count === 1) return [totalScale];

    const weights = [];
    for (let i = 0; i < count; i++) {
      weights.push(0.14 + (hashTag(String(totalScale) + i) % 22) / 100);
    }
    const wSum = weights.reduce((acc, w) => acc + w, 0);
    let nums = weights.map(w => Math.round(totalScale * w / wSum));
    const minEach = totalScale >= count * 1000
      ? 1000
      : Math.max(1, Math.floor(totalScale / count));
    nums = nums.map(n => Math.max(minEach, n));

    let sum = nums.reduce((acc, n) => acc + n, 0);
    let guard = 0;
    while (sum > totalScale && guard < 100000) {
      const idx = nums.indexOf(Math.max(...nums));
      if (nums[idx] <= minEach) break;
      nums[idx] -= 1;
      sum -= 1;
      guard += 1;
    }
    while (sum < totalScale) {
      nums[nums.length - 1] += 1;
      sum += 1;
    }
    return nums;
  }

  function pickHighContribTags(tags, minContrib, maxCount) {
    const min = minContrib == null ? 10 : minContrib;
    const max = maxCount == null ? 5 : maxCount;
    return [...(tags || [])]
      .filter(t => (t.contribution || 0) >= min)
      .sort((a, b) => (b.contribution || 0) - (a.contribution || 0))
      .slice(0, max);
  }

  function expandComboSources(tagItems, rules, subSegments, comboRules) {
    if (comboRules?.length) {
      return comboRules.map((r, i) => ({
        expr: normalizeComboExpr(r.expr),
        key: r.label || `combo-${i}`
      }));
    }

    const highTags = pickHighContribTags(tagItems, 10, 5);
    const tagNames = highTags.map(t => t.name);
    const sources = [];
    const seen = new Set();
    const addSource = (expr, key) => {
      const k = key || expr || 'default';
      if (seen.has(k)) return;
      seen.add(k);
      sources.push({ expr: expr || '', key: k });
    };

    subSegments.forEach(seg => {
      const rule = rules.find(r => r.label === seg.rule);
      if (rule?.expr) addSource(normalizeComboExpr(rule.expr), seg.rule || seg.name);
    });
    rules.forEach(r => addSource(normalizeComboExpr(r.expr), r.label));

    for (let i = 0; i < tagNames.length - 1 && sources.length < 6; i++) {
      for (let j = i + 1; j < Math.min(tagNames.length, i + 3) && sources.length < 6; j++) {
        addSource(`${tagNames[i]} AND ${tagNames[j]}`, `${tagNames[i]}_AND_${tagNames[j]}`);
      }
    }

    if (sources.length < 3 && tagNames.length >= 3) {
      addSource(`${tagNames[0]} AND ${tagNames[1]} AND ${tagNames[2]}`, 'triple_and');
      addSource(`${tagNames[0]} AND ${tagNames[1]}`, 'pair_and_0');
    }

    if (!sources.length) addSource('', 'default');
    return sources.slice(0, 6);
  }

  function normalizeContributionPct(rows) {
    const total = rows.reduce((acc, r) => acc + r.scaleNum, 0) || 1;
    rows.forEach(r => {
      r.contribution = Math.max(1, Math.round(r.scaleNum / total * 100));
    });
    const pctSum = rows.reduce((acc, r) => acc + r.contribution, 0);
    if (rows.length && pctSum !== 100) {
      rows[rows.length - 1].contribution += 100 - pctSum;
    }
  }

  function buildPortraitCombinations(branch, tags, subSegments) {
    const rules = branch.rules || [];
    const totalScale = parseScaleNum(branch.segment?.scaleLabel || branch.segment?.scale)
      || subSegments.reduce((acc, s) => acc + parseScaleNum(s.scale), 0);

    const sources = expandComboSources(tags, rules, subSegments, branch.comboRules);
    const scaleNums = distributeComboScales(totalScale, sources.length);

    let rows = sources.map((src, i) => ({
      relationParts: buildComboRelationParts(src.expr, tags.map(t => t.name), i),
      scaleNum: scaleNums[i] || 0,
      contribution: 0
    }));

    if (totalScale > 0 && rows.length) {
      const rowSum = rows.reduce((acc, r) => acc + r.scaleNum, 0);
      if (rowSum !== totalScale) {
        rows[rows.length - 1].scaleNum += totalScale - rowSum;
      }
    }

    normalizeContributionPct(rows);
    rows.forEach(r => { r.scaleLabel = formatScaleNum(r.scaleNum); });

    return {
      rows,
      totalScale,
      totalScaleLabel: formatScaleNum(totalScale)
    };
  }

  window.buildRcBranchPortraitData = function (branch) {
    const rawTags = (branch.tags || []).slice(0, 12);

    let tags;
    if (branch.portraitTags?.length) {
      tags = branch.portraitTags.map(t => ({
        tagId: resolveTagId(t.name),
        name: t.name,
        contribution: t.contribution
      })).sort((a, b) => (b.contribution || 0) - (a.contribution || 0));
    } else {
      const baseContrib = branch.contrib || 30;
      tags = rawTags.map((name, i) => {
        const contribution = Math.max(8, Math.round(baseContrib * Math.pow(0.82, i)));
        return { tagId: resolveTagId(name), name, contribution };
      }).sort((a, b) => b.contribution - a.contribution);
      const sum = tags.reduce((acc, t) => acc + t.contribution, 0) || 1;
      tags.forEach(t => { t.contribution = Math.max(1, Math.round(t.contribution / sum * 100)); });
      const tagSum = tags.reduce((acc, t) => acc + t.contribution, 0);
      if (tags.length && tagSum !== 100) tags[0].contribution += 100 - tagSum;
    }

    tags = tags.slice(0, 10);

    const subSegments = (branch.segments || []).map(s => ({
      rule: s.rule || '组合A',
      name: s.name,
      scale: String(s.scale || '').includes('人') ? s.scale : (s.scale || '—') + ' 人'
    }));
    if (!subSegments.length) {
      subSegments.push({
        rule: '组合A',
        name: branch.segment?.name || '链路客群',
        scale: branch.segment?.scaleLabel || '—'
      });
    }

    return {
      tags,
      combinations: buildPortraitCombinations(branch, tags, subSegments),
      subSegments
    };
  };

  window.buildRcMetricTagForest = function (branches) {
    return (branches || []).map(b => ({
      id: 'forest-' + b.rank,
      type: 'metric',
      rank: b.rank,
      name: b.metric,
      children: (b.tags || []).slice(0, 4).map(t => buildTagNode(t, 1, 'p' + b.rank))
    }));
  };

  window.buildRcAggregatedSegment = function (node, rcData) {
    const branches = rcData?.branches || [];
    const metricName = node?.name || '异动指标';
    const scales = branches.map(b => {
      const s = b.segment?.scale || b.segments?.[0]?.scale || '0';
      return parseInt(String(s).replace(/,/g, ''), 10) || 0;
    });
    const rawSum = scales.reduce((a, b) => a + b, 0);
    const converged = scales.length > 1 ? Math.round(rawSum * 0.62) : (scales[0] || 12840);

    const baseId = 'seg-high-downgrade';
    const full = typeof getSegmentById === 'function' ? getSegmentById(baseId) : null;
    const merged = full ? JSON.parse(JSON.stringify(full)) : {
      id: 'seg-agg',
      name: metricName + ' · 异动客群',
      scene: '中高端客户流失',
      scale: converged,
      scaleLabel: converged.toLocaleString('zh-CN') + ' 人'
    };
    merged.id = 'seg-agg-rc';
    merged.name = metricName + ' · 异动客群';
    merged.scale = converged;
    merged.scaleLabel = converged.toLocaleString('zh-CN') + ' 人';
    merged.sourceMetric = metricName;
    merged.metricValue = node?.value || '—';
    merged.metricMom = node?.mom || '—';
    merged.metricYoy = node?.yoy || '—';
    merged.baseSegmentId = baseId;
    merged.tagConvergence = [...new Set(branches.flatMap(b => (b.tags || []).slice(0, 2)))].slice(0, 6);
    merged.branchCount = branches.length;
    return merged;
  };
})();
