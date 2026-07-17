/** 主动渠道资源排期 - 按月配置云南各地市州渠道额度 */
(function () {
  const KEY = 'jxAgentChannelSchedule';
  const SCHEMA = 'jxAgentChannelScheduleV6';

  /** 主动渠道（额度按渠道 × 月份 × 地市配置） */
  window.ACTIVE_CHANNEL_OPTIONS = [
    { value: 'independent_outbound', label: '独立排呼' },
    { value: 'region_outbound', label: '区域外呼' },
    { value: 'ch_10085', label: '10085外呼营销' },
    { value: 'ch_cmcc_app', label: '中国移动APP' },
    { value: 'ch_10086_popup', label: '10086呼入弹屏' },
    { value: 'sms_push', label: '短信主动推送' }
  ];

  window.ACTIVE_CHANNEL_LABEL = Object.fromEntries(
    window.ACTIVE_CHANNEL_OPTIONS.map(c => [c.value, c.label])
  );

  /**
   * 云南省地市州（16 个）
   * 展示名与正式行政区划名称一致
   */
  window.YUNNAN_CITY_OPTIONS = [
    { value: 'yn_km', label: '昆明市' },
    { value: 'yn_qj', label: '曲靖市' },
    { value: 'yn_yx', label: '玉溪市' },
    { value: 'yn_bs', label: '保山市' },
    { value: 'yn_zt', label: '昭通市' },
    { value: 'yn_lj', label: '丽江市' },
    { value: 'yn_pe', label: '普洱市' },
    { value: 'yn_lc', label: '临沧市' },
    { value: 'yn_cx', label: '楚雄彝族自治州' },
    { value: 'yn_hh', label: '红河哈尼族彝族自治州' },
    { value: 'yn_ws', label: '文山壮族苗族自治州' },
    { value: 'yn_bn', label: '西双版纳傣族自治州' },
    { value: 'yn_dl', label: '大理白族自治州' },
    { value: 'yn_dh', label: '德宏傣族景颇族自治州' },
    { value: 'yn_nj', label: '怒江傈僳族自治州' },
    { value: 'yn_dq', label: '迪庆藏族自治州' }
  ];

  window.YUNNAN_CITY_LABEL = Object.fromEntries(
    window.YUNNAN_CITY_OPTIONS.map(c => [c.value, c.label])
  );

  const CHANNEL_CAPACITY = {
    independent_outbound: {
      unit: '通',
      hint: '指该地市当月可执行的外呼通次上限。'
    },
    region_outbound: {
      unit: '通',
      hint: '指该地市当月可执行的外呼通次上限。'
    },
    ch_10085: {
      unit: '通',
      hint: '指该地市当月可执行的外呼通次上限。'
    },
    ch_cmcc_app: {
      unit: '次',
      hint: '指该地市当月可承载的曝光 / 触达量上限。'
    },
    ch_10086_popup: {
      unit: '次',
      hint: '指该地市当月可触发的弹屏展示次数上限。'
    },
    sms_push: {
      unit: '条',
      hint: '指该地市当月可派发的短信条数上限。'
    }
  };

  function nowStr() {
    return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
  }

  function nextId() {
    return 'CRS-' + Date.now().toString(36).toUpperCase().slice(-8) +
      Math.random().toString(36).slice(2, 5).toUpperCase();
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }

  function normalizeMonth(raw) {
    const s = String(raw || '').trim();
    const m = s.match(/^(\d{4})[-/年]?(\d{1,2})/);
    if (!m) return '';
    return `${m[1]}-${pad(Number(m[2]))}`;
  }

  function normalizeRow(r) {
    if (!r) return r;
    const monthlyQuota = Number(r.monthlyQuota) || 0;
    const usedQuota = Math.max(0, Number(r.usedQuota) || 0);
    return {
      id: r.id,
      channel: r.channel,
      month: normalizeMonth(r.month) || currentMonth(),
      city: r.city,
      monthlyQuota,
      usedQuota: Math.min(usedQuota, monthlyQuota || usedQuota),
      remark: r.remark || '',
      updatedBy: r.updatedBy || '',
      updatedAt: r.updatedAt || '',
      createdAt: r.createdAt || ''
    };
  }

  function remainingOf(r) {
    const monthly = Number(r.monthlyQuota) || 0;
    const used = Number(r.usedQuota) || 0;
    return Math.max(0, monthly - used);
  }

  function buildSeed() {
    const month = currentMonth();
    const stamp = nowStr();
    const bases = {
      independent_outbound: 120000,
      region_outbound: 50000,
      ch_10085: 80000,
      ch_cmcc_app: 500000,
      ch_10086_popup: 30000,
      sms_push: 2000000
    };
    const rows = [];
    window.ACTIVE_CHANNEL_OPTIONS.forEach((ch, ci) => {
      const base = bases[ch.value] || 10000;
      window.YUNNAN_CITY_OPTIONS.forEach((city, i) => {
        const factor = 1 - (i % 5) * 0.08;
        const monthlyQuota = Math.round(base * factor * (1 - (ci % 3) * 0.05));
        const usedQuota = Math.round(monthlyQuota * (0.25 + (i % 4) * 0.12));
        rows.push({
          id: 'CRS-S' + pad(rows.length + 1),
          channel: ch.value,
          month,
          city: city.value,
          monthlyQuota,
          usedQuota,
          remark: i === 0 ? '本月基准配额' : '',
          updatedBy: ['张明', '李敏', '王磊', '陈敏'][i % 4],
          updatedAt: stamp,
          createdAt: stamp
        });
      });
    });
    return rows;
  }

  function read() {
    try {
      if (localStorage.getItem(SCHEMA) !== '1') return null;
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem(SCHEMA, '1');
    } catch (e) { /* ignore */ }
  }

  function load() {
    const cached = read();
    if (Array.isArray(cached) && cached.length) {
      return cached.map(normalizeRow).filter(r => r.channel && r.month && r.city);
    }
    const seed = buildSeed();
    write(seed);
    return seed;
  }

  let _list = load();

  function channelLabel(code) {
    return window.ACTIVE_CHANNEL_LABEL[code] || code || '—';
  }

  function cityLabel(code) {
    return window.YUNNAN_CITY_LABEL[code] || code || '—';
  }

  function formatCapacity(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    return Math.round(num).toLocaleString('zh-CN');
  }

  function capacityHint(channel) {
    const meta = CHANNEL_CAPACITY[channel];
    const specific = meta?.hint || '指该地市当月可用于策略执行的资源上限。';
    return `按当前渠道填写当月额度。${specific}`;
  }

  function capacityPlaceholder(channel) {
    const unit = CHANNEL_CAPACITY[channel]?.unit || '次';
    return `请输入本月额度（${unit}）`;
  }

  function resolveChannelCode(raw) {
    const s = String(raw || '').trim();
    const hit = window.ACTIVE_CHANNEL_OPTIONS.find(c => c.value === s || c.label === s);
    return hit ? hit.value : s;
  }

  function resolveCityCode(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const hit = window.YUNNAN_CITY_OPTIONS.find(c =>
      c.value === s ||
      c.label === s ||
      c.label.replace(/市$|自治州$/, '') === s.replace(/市$|自治州$/, '')
    );
    return hit ? hit.value : s;
  }

  function cityOrderIndex(code) {
    const i = window.YUNNAN_CITY_OPTIONS.findIndex(c => c.value === code);
    return i >= 0 ? i : 999;
  }

  window.AgentChannelScheduleStore = {
    channelLabel,
    cityLabel,
    formatCapacity,
    capacityHint,
    capacityPlaceholder,
    remainingOf,
    currentMonth,
    normalizeMonth,
    cityOrderIndex,

    getChannels() {
      return window.ACTIVE_CHANNEL_OPTIONS.slice();
    },

    getCities() {
      return window.YUNNAN_CITY_OPTIONS.slice();
    },

    getAll() {
      return _list.slice().sort((a, b) => {
        const m = String(b.month).localeCompare(String(a.month));
        if (m) return m;
        const c = String(a.channel).localeCompare(String(b.channel));
        if (c) return c;
        return cityOrderIndex(a.city) - cityOrderIndex(b.city);
      });
    },

    query({ channel, month, city, keyword } = {}) {
      const mon = month ? normalizeMonth(month) : '';
      const kw = String(keyword || '').trim().toLowerCase();
      return this.getAll()
        .filter(r => {
          if (channel && r.channel !== channel) return false;
          if (mon && r.month !== mon) return false;
          if (city && r.city !== city) return false;
          if (kw) {
            const hay = `${cityLabel(r.city)} ${r.city} ${channelLabel(r.channel)}`.toLowerCase();
            if (!hay.includes(kw)) return false;
          }
          return true;
        })
        .sort((a, b) => cityOrderIndex(a.city) - cityOrderIndex(b.city));
    },

    getById(id) {
      const r = _list.find(x => x.id === id);
      return r ? normalizeRow(r) : null;
    },

    getByKey(channel, month, city) {
      const mon = normalizeMonth(month);
      return _list.find(r =>
        r.channel === channel && r.month === mon && r.city === city
      ) || null;
    },

    save(record) {
      const row = normalizeRow({
        ...record,
        updatedAt: nowStr(),
        updatedBy: record.updatedBy || '李敏'
      });
      const idx = _list.findIndex(r => r.id === row.id);
      if (idx >= 0) {
        row.createdAt = _list[idx].createdAt || row.createdAt;
        _list[idx] = row;
      } else {
        const exist = this.getByKey(row.channel, row.month, row.city);
        if (exist) {
          row.id = exist.id;
          row.createdAt = exist.createdAt;
          const i2 = _list.findIndex(r => r.id === exist.id);
          _list[i2] = row;
        } else {
          row.id = row.id || nextId();
          row.createdAt = row.createdAt || nowStr();
          _list.unshift(row);
        }
      }
      write(_list);
      return row;
    },

    /**
     * 新增 / 覆盖一条地市月额度
     * @returns {{ created:boolean, updated:boolean, row:object }}
     */
    upsertOne(payload) {
      const channel = payload.channel;
      const month = normalizeMonth(payload.month);
      const city = payload.city;
      const exist = this.getByKey(channel, month, city);
      const row = this.save({
        ...(exist || {}),
        id: exist?.id || nextId(),
        channel,
        month,
        city,
        monthlyQuota: Number(payload.monthlyQuota) || 0,
        usedQuota: payload.usedQuota != null && payload.usedQuota !== ''
          ? Number(payload.usedQuota)
          : (exist?.usedQuota || 0),
        remark: payload.remark || '',
        updatedBy: payload.updatedBy || '李敏',
        createdAt: exist?.createdAt
      });
      return { created: !exist, updated: !!exist, row };
    },

    remove(id) {
      _list = _list.filter(r => r.id !== id);
      write(_list);
      return true;
    },

    /**
     * 批量导入
     * [{ channel, month, city, monthlyQuota, usedQuota?, remark? }]
     */
    importRows(rows) {
      let created = 0;
      let updated = 0;
      (rows || []).forEach(raw => {
        const channel = resolveChannelCode(raw.channel);
        const city = resolveCityCode(raw.city);
        const month = normalizeMonth(raw.month);
        if (!channel || !city || !month) return;
        if (!window.ACTIVE_CHANNEL_LABEL[channel]) return;
        if (!window.YUNNAN_CITY_LABEL[city]) return;
        const monthlyQuota = Number(String(raw.monthlyQuota ?? '').replace(/,/g, '')) || 0;
        const result = this.upsertOne({
          channel,
          month,
          city,
          monthlyQuota,
          remark: raw.remark || '',
          updatedBy: '批量导入'
        });
        if (result.created) created += 1;
        else updated += 1;
      });
      return { created, updated };
    },

    resetDemo() {
      _list = buildSeed();
      write(_list);
      return this.getAll();
    }
  };
})();
