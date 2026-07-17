/** 预警规则：列表 + 新增/编辑表单（指标 + 树形多选范围） */
(function () {
  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;
  const METRIC_PICKER_PAGE_SIZE = 10;
  const OPERATOR_OPTIONS = ['高于', '低于', '在区间内', '在区间外'];
  const RANGE_OPERATORS = ['在区间内', '在区间外'];
  const PROVINCE_NAME = '江西省';
  /** 演示：u-001 省级账号；可改为 u-006 体验市级账号（南昌市） */
  const DEMO_USER_ID = 'u-001';
  const FORMAT_LABELS = { numeric: '数值', percent: '百分比', enum: '枚举' };
  const ALGO_LABELS = {
    traffic_rca: '流量运营根因分析',
    loss_control_rca: '控损运营根因分析'
  };
  const GRANULARITY_LEVEL_MAP = {
    '省份': '省级',
    '地市': '地市级',
    '区县': '区县级',
    '网格': '网格级'
  };
  const NOTIFY_CHANNEL_DEFS = [
    { key: 'sms', field: 'notifySms', label: '短信' },
    { key: 'email', field: 'notifyEmail', label: '邮件' },
    { key: 'site', field: 'notifySiteMsg', label: '站内消息' }
  ];
  const DEFAULT_NOTIFY_TEMPLATES = {
    sms: {
      title: '【指标预警】{预警规则名称}',
      content: '【市场运营】{预警时间}触发预警：规则「{预警规则名称}」命中异常。指标「{预警指标}」（{监控范围}）当前值 {异常值}{指标单位}，条件：{计算规则}。请及时登录平台处理。'
    },
    email: {
      title: '【指标预警】{预警规则名称} · {预警指标}',
      content: '尊敬的用户，您好：\n\n于 {预警时间}，预警规则「{预警规则名称}」触发告警。\n\n规则说明：{预警规则描述}\n预警指标：{预警指标}\n监控范围：{监控范围}\n指标单位：{指标单位}\n异常数值：{异常值}\n触发条件：{计算规则}\n\n请登录移动市场运营平台查看详情并处理。\n\n—— 移动市场运营平台'
    },
    site: {
      title: '指标预警：{预警指标}',
      content: '【预警通知】{预警时间}\n规则：{预警规则名称}\n指标：{预警指标} · {监控范围}\n异常：{异常值}{指标单位}（{计算规则}）\n请点击消息中心查看详情并跟进处理。'
    }
  };
  const NOTIFY_PLACEHOLDERS = [
    { token: '{预警时间}', desc: '预警触发时间' },
    { token: '{预警规则名称}', desc: '规则名称' },
    { token: '{预警规则描述}', desc: '规则描述' },
    { token: '{预警指标}', desc: '异常指标名称' },
    { token: '{监控范围}', desc: '指标监控范围' },
    { token: '{指标单位}', desc: '指标计量单位' },
    { token: '{异常值}', desc: '触发时的指标值' },
    { token: '{计算规则}', desc: '运算符与阈值' }
  ];
  /** 指标预警填充示例（演示数据） */
  const NOTIFY_TEMPLATE_SAMPLE = {
    '{预警时间}': '2026-05-28 08:15:00',
    '{预警规则名称}': '套外收入环比波动预警',
    '{预警规则描述}': '套外收入绝对值低于预期阈值时告警。',
    '{预警指标}': '套外收入',
    '{监控范围}': '江西省',
    '{指标单位}': '万元',
    '{异常值}': '1,286.5',
    '{计算规则}': '低于 1,500'
  };

  let page = 1;
  let editingId = null;
  let conditionRowSeed = 0;
  let selectedRecipients = [];
  let selectedMetric = null;
  let selectedMetricLevel = '省级';
  let metricPickerRows = [];
  let metricPickerPage = 1;
  let metricPickerStep = 1;
  let pendingMetricIds = new Set();
  let notifyTemplates = cloneDefaultNotifyTemplates();
  let editingTemplateChannel = null;
  let notifyTemplateFocusTarget = 'content';
  let selectedRecipientUnitId = 'jx-prov';

  function cloneDefaultNotifyTemplates() {
    const out = {};
    NOTIFY_CHANNEL_DEFS.forEach(ch => {
      const d = DEFAULT_NOTIFY_TEMPLATES[ch.key] || { title: '', content: '' };
      out[ch.key] = { title: d.title || '', content: d.content || '' };
    });
    return out;
  }

  function normalizeNotifyTemplate(raw, channelKey) {
    const fallback = DEFAULT_NOTIFY_TEMPLATES[channelKey] || { title: '', content: '' };
    if (raw == null) return { title: fallback.title || '', content: fallback.content || '' };
    if (typeof raw === 'string') {
      return { title: fallback.title || '', content: raw };
    }
    return {
      title: String(raw.title != null ? raw.title : (fallback.title || '')),
      content: String(raw.content != null ? raw.content : (fallback.content || ''))
    };
  }

  function applyNotifyPlaceholders(text) {
    let out = text || '';
    NOTIFY_PLACEHOLDERS.forEach(p => {
      out = out.split(p.token).join(NOTIFY_TEMPLATE_SAMPLE[p.token] || p.token);
    });
    return out;
  }

  function getCurrentAccount() {
    const org = window.JX_ORG_SYSTEM;
    const person = org?.persons?.find(p => p.id === DEMO_USER_ID)
      || org?.persons?.find(p => p.id === 'u-001');
    const unit = org?.units?.find(u => u.id === person?.unitId);
    const isProvincial = person?.unitId === 'jx-prov';
    return {
      person,
      unit,
      accountLevel: isProvincial ? 'provincial' : 'city',
      cityId: isProvincial ? null : person?.unitId
    };
  }

  function rowUniqueKey(metricId, scopeKey) {
    return `${metricId}:${scopeKey}`;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showView(view) {
    document.getElementById('alert-rules-list-view')?.classList.toggle('active', view === 'list');
    document.getElementById('alert-rules-form-view')?.classList.toggle('active', view === 'form');
  }

  function normalizeLevel(level) {
    if (!level) return '省级';
    if (level === '地市') return '地市级';
    if (level === '网格') return '网格级';
    return level;
  }

  function resolveMetricLevel(metric) {
    if (!metric) return '省级';
    if (metric.alertLevel) return normalizeLevel(metric.alertLevel);
    return GRANULARITY_LEVEL_MAP[metric.granularity] || '省级';
  }

  function resolveMetricUnit(metric) {
    if (!metric) return '—';
    if (metric.unit) return metric.unit;
    const name = metric.name || '';
    if (/率$|占比$|贡献$|转化率|负荷/.test(name)) return '%';
    if (/ARPU/.test(name)) return '元';
    if (/收入/.test(name)) return '万元';
    if (/客户数|用户数|办理量|订购量|规模/.test(name)) return '户';
    return '—';
  }

  function setWizardBtnVisible(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = !visible;
    el.style.display = visible ? '' : 'none';
  }

  function setMetricPickerStep(step) {
    metricPickerStep = step;
    const isStep1 = step === 1;
    const step1 = document.getElementById('arf-mp-step1');
    const step2 = document.getElementById('arf-mp-step2');
    if (step1) step1.hidden = !isStep1;
    if (step2) step2.hidden = isStep1;
    setWizardBtnVisible('arf-mp-next', isStep1);
    setWizardBtnVisible('arf-mp-prev', !isStep1);
    setWizardBtnVisible('arf-mp-confirm', !isStep1);
    document.getElementById('arf-mp-modal-title').textContent = isStep1
      ? '选择预警指标'
      : '指标层级与范围';
    const stepper = document.getElementById('arf-mp-steps');
    stepper?.classList.toggle('is-step2', !isStep1);
    stepper?.querySelectorAll('.alert-mp-stepper-item').forEach(el => {
      const itemStep = Number(el.dataset.step);
      el.classList.toggle('is-active', itemStep === step);
      el.classList.toggle('is-done', itemStep < step);
    });
  }

  function getJxCities() {
    if (window.JIANGXI_REGION?.cities?.length) {
      return window.JIANGXI_REGION.cities.map(c => ({ id: c.id, name: c.name }));
    }
    if (typeof window.getAllJxCities === 'function') return window.getAllJxCities();
    return [];
  }

  function getCityById(cityId) {
    return window.JIANGXI_REGION?.cities?.find(c => c.id === cityId) || null;
  }

  function getCountiesByCityId(cityId) {
    const city = getCityById(cityId);
    return (city?.counties || []).map(c => ({ id: c.id, name: c.name }));
  }

  function getCountyById(cityId, countyId) {
    return getCityById(cityId)?.counties?.find(c => c.id === countyId) || null;
  }

  function getGridsByCounty(cityId, countyId) {
    const county = getCountyById(cityId, countyId);
    return (county?.grids || []).map(g => ({ id: g.id, name: g.name }));
  }

  function renderScopeLevelTag(level) {
    const normalized = normalizeLevel(level);
    const cls = normalized === '省级' ? 'alert-scope-level-tag alert-scope-level-province'
      : normalized === '地市级' ? 'alert-scope-level-tag alert-scope-level-city'
      : normalized === '区县级' ? 'alert-scope-level-tag alert-scope-level-county'
      : 'alert-scope-level-tag';
    const text = normalized === '省级' ? '省级' : normalized;
    return `<span class="${cls}">${esc(text)}</span>`;
  }

  function renderLevelBadgeHtml(level) {
    const normalized = normalizeLevel(level);
    const cls = normalized === '省级' ? 'alert-level-badge alert-level-badge-province'
      : normalized === '地市级' ? 'alert-level-badge alert-level-badge-city'
      : normalized === '区县级' ? 'alert-level-badge alert-level-badge-county'
      : 'alert-level-badge';
    const text = normalized === '省级' ? '省级' : normalized;
    return `<span class="${cls}">${esc(text)}</span>`;
  }

  function getScopeOptionsForAccount() {
    const account = getCurrentAccount();
    const options = [{ key: 'province', label: PROVINCE_NAME, level: '省级' }];
    if (account.accountLevel === 'provincial') {
      getJxCities().forEach(c => {
        options.push({ key: `city:${c.id}`, label: c.name, level: '地市级' });
      });
    } else if (account.cityId) {
      getCountiesByCityId(account.cityId).forEach(c => {
        options.push({ key: `county:${account.cityId}:${c.id}`, label: c.name, level: '区县级' });
      });
    }
    return options;
  }

  function renderScopeCheckList() {
    const wrap = document.getElementById('arf-mp-scope-list');
    const hint = document.getElementById('arf-mp-scope-hint');
    if (!wrap) return;

    const account = getCurrentAccount();
    const options = getScopeOptionsForAccount();
    if (hint) {
      hint.textContent = account.accountLevel === 'provincial'
        ? '省级账号可选江西省及各地市（可多选）'
        : `市级账号可选江西省及${account.unit?.name || '本市'}下各区县（可多选）`;
    }

    wrap.innerHTML = options.map(opt => `
      <label class="alert-region-check-item">
        <input type="checkbox" class="arf-mp-scope-cb" value="${esc(opt.key)}" data-level="${esc(opt.level)}"/>
        <span class="alert-region-check-label">${esc(opt.label)}</span>
        ${renderScopeLevelTag(opt.level)}
      </label>`).join('') || '<p class="muted alert-region-empty">暂无可选范围</p>';
  }

  function renderSelectedMetricsSummary() {
    const wrap = document.getElementById('arf-mp-selected-metrics-list');
    if (!wrap) return;
    const metrics = [...pendingMetricIds]
      .map(id => window.getMetricById?.(id))
      .filter(Boolean);
    wrap.innerHTML = metrics.map(m => `
      <span class="alert-mp-selected-tag">
        <strong>${esc(m.name)}</strong>
        <code>${esc(m.code)}</code>
      </span>`).join('') || '<span class="muted">—</span>';
  }

  function collectScopeSelectionsFromWizard() {
    return Array.from(document.querySelectorAll('#arf-mp-scope-list .arf-mp-scope-cb:checked'))
      .map(cb => ({ key: cb.value, level: normalizeLevel(cb.dataset.level || '省级') }));
  }

  function validateMetricWizardStep2() {
    const selections = collectScopeSelectionsFromWizard();
    if (!selections.length) {
      alert('请至少选择一个指标层级与范围');
      return false;
    }
    return true;
  }

  function applyMetricWizardResult(metrics, scopeSelections) {
    const existingKeys = new Set(
      Array.from(document.querySelectorAll('#alert-rule-conditions .alert-rule-condition-row'))
        .map(r => r.dataset.uniqueKey)
        .filter(Boolean)
    );

    let added = 0;
    metrics.forEach(metric => {
      const enriched = enrichMetricRow(metric);
      scopeSelections.forEach(({ key, level }) => {
        const uniqueKey = rowUniqueKey(enriched.id, key);
        if (existingKeys.has(uniqueKey)) return;
        const scope = parseScopeKey(key);
        if (!scope) return;
        addConditionRow({
          metricId: enriched.id,
          metricName: enriched.name,
          metricCode: enriched.code,
          metricUnit: enriched.unit,
          level,
          scopeKey: key,
          uniqueKey,
          scopePayload: scope,
          operator: '高于',
          threshold: '',
          ...scope
        });
        existingKeys.add(uniqueKey);
        added += 1;
      });
    });

    if (metrics.length && !selectedMetric) {
      selectedMetric = enrichMetricRow(metrics[0]);
    } else if (metrics.length) {
      selectedMetric = enrichMetricRow(metrics[0]);
    }

    updateGlobalMetricUi();
    updateConditionsEmptyState();
    return added;
  }

  function resolveMetricAlgorithmScenes(row) {
    if (!row) return [];
    if (Array.isArray(row.algorithmScenes) && row.algorithmScenes.length) return row.algorithmScenes;
    const code = (row.code || '').toUpperCase();
    if (/FL_REV|ROAM|EU_|FAMILY|HALL/.test(code)) return ['traffic_rca'];
    if (/CHURN|HE_|HCD|CUS_CHURN/.test(code)) return ['loss_control_rca'];
    return [];
  }

  function enrichMetricRow(row) {
    const format = /率/.test(row.name || '') ? 'percent' : 'numeric';
    return {
      ...row,
      formatLabel: FORMAT_LABELS[format] || '数值',
      updatedAt: row.updatedAt || '2026-05-20 12:00:00',
      algorithmScenes: resolveMetricAlgorithmScenes(row),
      alertLevel: resolveMetricLevel(row),
      unit: resolveMetricUnit(row)
    };
  }

  function getMetricOptions() {
    return (window.METRIC_OPTIONS || []).map(enrichMetricRow);
  }

  function formatAlgoScenes(scenes) {
    const list = Array.isArray(scenes) ? scenes : [];
    if (!list.length) return '—';
    return list.map(v => ALGO_LABELS[v] || v).join('、');
  }

  function getPersonMeta(person) {
    const org = window.JX_ORG_SYSTEM;
    if (!person || !org) return '';
    const unit = org.units.find(u => u.id === person.unitId);
    const dept = unit?.depts?.find(d => d.id === person.deptId);
    return [unit?.name, dept?.name, person.role].filter(Boolean).join(' · ');
  }

  function scopeKeyOf(cond) {
    if (!cond) return '';
    if (cond.scopeKey) return cond.scopeKey;
    const level = normalizeLevel(cond.level);
    if (level === '省级') return 'province';
    if (level === '地市级') {
      const id = cond.cityId || (cond.cityIds || [])[0];
      return id ? `city:${id}` : '';
    }
    if (level === '区县级' && cond.cityId && cond.countyId) {
      return `county:${cond.cityId}:${cond.countyId}`;
    }
    if (level === '网格级' && cond.cityId && cond.countyId && cond.gridId) {
      return `grid:${cond.cityId}:${cond.countyId}:${cond.gridId}`;
    }
    return '';
  }

  function formatScopeLabel(cond) {
    if (!cond) return '—';
    const level = normalizeLevel(cond.level);
    if (level === '省级') return PROVINCE_NAME;
    if (level === '地市级') {
      return cond.cityName || getJxCities().find(c => c.id === cond.cityId)?.name || '—';
    }
    if (level === '区县级') {
      const city = cond.cityName || getJxCities().find(c => c.id === cond.cityId)?.name || '';
      const county = cond.countyName || getCountiesByCityId(cond.cityId).find(c => c.id === cond.countyId)?.name || '';
      return [city, county].filter(Boolean).join(' · ') || '—';
    }
    if (level === '网格级') {
      return [cond.cityName, cond.countyName, cond.gridName].filter(Boolean).join(' · ') || '—';
    }
    return '—';
  }

  function summarizeMetrics(rule) {
    const conds = rule?.conditions || [];
    if (!conds.length) return rule?.metricName || '—';
    const names = [...new Set(conds.map(c => {
      const m = window.getMetricById?.(c.metricId);
      return m?.name || c.metricName || c.metricId;
    }).filter(Boolean))];
    return names.join('、') || '—';
  }

  function summarizeScope(cond) {
    if (!cond) return '';
    const level = normalizeLevel(cond.level || (Array.isArray(cond.levels) ? cond.levels[0] : ''));
    const scope = formatScopeLabel({ ...cond, level });
    return scope ? `${level} · ${scope}` : level;
  }

  function summarizeNotify(rule) {
    const ways = [];
    NOTIFY_CHANNEL_DEFS.forEach(ch => {
      if (rule?.[ch.field]) ways.push(ch.label);
    });
    return ways.length ? ways.join('、') : '—';
  }

  function loadNotifyTemplatesFromRule(rule) {
    notifyTemplates = cloneDefaultNotifyTemplates();
    if (!rule?.notifyTemplates) return;
    NOTIFY_CHANNEL_DEFS.forEach(ch => {
      if (rule.notifyTemplates[ch.key] != null) {
        notifyTemplates[ch.key] = normalizeNotifyTemplate(rule.notifyTemplates[ch.key], ch.key);
      }
    });
  }

  function renderNotifyPlaceholderList() {
    const wrap = document.getElementById('arf-notify-placeholder-list');
    if (!wrap) return;
    wrap.innerHTML = NOTIFY_PLACEHOLDERS.map(p => `
      <button type="button" class="alert-notify-placeholder-chip" data-token="${esc(p.token)}" title="${esc(p.desc)}">
        <code>${esc(p.token)}</code>
        <span>${esc(p.desc)}</span>
      </button>`).join('');
    wrap.querySelectorAll('.alert-notify-placeholder-chip').forEach(btn => {
      btn.addEventListener('click', () => insertNotifyPlaceholder(btn.dataset.token));
    });
  }

  function fillNotifyTemplatePreview(title, content) {
    const subjectEl = document.getElementById('arf-notify-template-preview-subject');
    const bodyEl = document.getElementById('arf-notify-template-preview');
    if (subjectEl) subjectEl.textContent = applyNotifyPlaceholders(title);
    if (bodyEl) bodyEl.textContent = applyNotifyPlaceholders(content) || '—';
  }

  function refreshNotifyTemplatePreviewFromInputs() {
    const subject = document.getElementById('arf-notify-template-subject')?.value || '';
    const content = document.getElementById('arf-notify-template-content')?.value || '';
    fillNotifyTemplatePreview(subject, content);
  }

  function getNotifyTemplateFocusEl() {
    if (notifyTemplateFocusTarget === 'title') {
      return document.getElementById('arf-notify-template-subject');
    }
    return document.getElementById('arf-notify-template-content');
  }

  function insertNotifyPlaceholder(token) {
    const el = getNotifyTemplateFocusEl();
    if (!el || !token) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + token + after;
    const pos = start + token.length;
    el.focus();
    el.setSelectionRange(pos, pos);
    refreshNotifyTemplatePreviewFromInputs();
  }

  function openNotifyTemplateModal(channelKey) {
    const channel = NOTIFY_CHANNEL_DEFS.find(c => c.key === channelKey);
    if (!channel) return;
    editingTemplateChannel = channelKey;
    notifyTemplateFocusTarget = 'title';
    const title = document.getElementById('arf-notify-template-title');
    if (title) title.textContent = `${channel.label} · 通知模板`;
    const tpl = normalizeNotifyTemplate(notifyTemplates[channelKey], channelKey);
    const subject = document.getElementById('arf-notify-template-subject');
    const ta = document.getElementById('arf-notify-template-content');
    if (subject) subject.value = tpl.title || '';
    if (ta) ta.value = tpl.content || '';
    fillNotifyTemplatePreview(tpl.title, tpl.content);
    renderNotifyPlaceholderList();
    if (typeof openModal === 'function') openModal('modal-alert-notify-template');
    requestAnimationFrame(() => subject?.focus());
  }

  function saveNotifyTemplateFromModal() {
    if (!editingTemplateChannel) return;
    const subject = (document.getElementById('arf-notify-template-subject')?.value || '').trim();
    const content = (document.getElementById('arf-notify-template-content')?.value || '').trim();
    if (!subject) {
      alert('模板标题不能为空');
      return;
    }
    if (!content) {
      alert('模板内容不能为空');
      return;
    }
    notifyTemplates[editingTemplateChannel] = { title: subject, content };
    editingTemplateChannel = null;
    if (typeof closeModal === 'function') closeModal('modal-alert-notify-template');
  }

  function resetNotifyTemplateInModal() {
    if (!editingTemplateChannel) return;
    const tpl = normalizeNotifyTemplate(DEFAULT_NOTIFY_TEMPLATES[editingTemplateChannel], editingTemplateChannel);
    const subject = document.getElementById('arf-notify-template-subject');
    const ta = document.getElementById('arf-notify-template-content');
    if (subject) subject.value = tpl.title || '';
    if (ta) ta.value = tpl.content || '';
    fillNotifyTemplatePreview(tpl.title, tpl.content);
  }

  function bindNotifyTemplateUi() {
    document.querySelectorAll('.alert-notify-template-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openNotifyTemplateModal(btn.dataset.channel);
      });
    });
    document.getElementById('arf-notify-template-save')?.addEventListener('click', saveNotifyTemplateFromModal);
    document.getElementById('arf-notify-template-reset')?.addEventListener('click', resetNotifyTemplateInModal);
    const subject = document.getElementById('arf-notify-template-subject');
    const content = document.getElementById('arf-notify-template-content');
    subject?.addEventListener('focus', () => { notifyTemplateFocusTarget = 'title'; });
    content?.addEventListener('focus', () => { notifyTemplateFocusTarget = 'content'; });
    subject?.addEventListener('input', refreshNotifyTemplatePreviewFromInputs);
    content?.addEventListener('input', refreshNotifyTemplatePreviewFromInputs);
  }

  function formatEffectiveRange(rule) {
    const start = rule?.effectiveDateStart || rule?.effectiveDate || '—';
    const end = rule?.effectiveDateEnd || '—';
    if (start === '—' && end === '—') return '—';
    return `${start} ~ ${end}`;
  }

  function getRuleEffectiveStart(rule) {
    return rule?.effectiveDateStart || rule?.effectiveDate || '';
  }

  function getRuleEffectiveEnd(rule) {
    return rule?.effectiveDateEnd || rule?.effectiveDateStart || rule?.effectiveDate || '';
  }

  function getFilteredList() {
    const kw = (document.getElementById('alert-rules-filter-kw')?.value || '').trim().toLowerCase();
    const st = document.getElementById('alert-rules-filter-status')?.value || '';
    const dateStart = document.getElementById('alert-rules-filter-date-start')?.value || '';
    const dateEnd = document.getElementById('alert-rules-filter-date-end')?.value || '';
    let list = AlertRulesStore.getAll();
    if (kw) {
      list = list.filter(r =>
        (r.name + (r.description || '')).toLowerCase().includes(kw)
      );
    }
    if (st) list = list.filter(r => r.status === st);
    if (dateStart) {
      list = list.filter(r => {
        const end = getRuleEffectiveEnd(r);
        return end && end >= dateStart;
      });
    }
    if (dateEnd) {
      list = list.filter(r => {
        const start = getRuleEffectiveStart(r);
        return start && start <= dateEnd;
      });
    }
    return list;
  }

  function renderPagination(total) {
    if (!window.TablePagination) return;
    const result = TablePagination.render('alert-rules-pagination', {
      total,
      page,
      pageSize: PAGE_SIZE,
      onPageChange: nextPage => {
        page = nextPage;
        renderList();
      }
    });
    page = result.page;
  }

  function renderList() {
    const tbody = document.getElementById('alert-rules-tbody');
    const countEl = document.getElementById('alert-rules-count');
    if (!tbody || !window.AlertRulesStore) return;

    const list = getFilteredList();
    const pageRows = TablePagination ? TablePagination.slice(list, page, PAGE_SIZE) : list;
    if (countEl) countEl.textContent = `共 ${list.length} 条`;

    tbody.innerHTML = pageRows.map(r => {
      const enabled = r.status === 'enabled';
      return `<tr>
        <td><strong>${esc(r.name)}</strong></td>
        <td class="cell-desc">${esc(r.description)}</td>
        <td>${esc(formatEffectiveRange(r))}</td>
        <td>${esc(r.createdAt)}</td>
        <td>${esc(r.updatedAt)}</td>
        <td><span class="badge ${enabled ? 'badge-success' : 'badge-info'}">${enabled ? '启用' : '停用'}</span></td>
        <td class="cell-actions">
          <button type="button" class="btn-link" data-edit="${esc(r.id)}">编辑</button>
          <button type="button" class="btn-link" data-toggle="${esc(r.id)}">${enabled ? '停用' : '启用'}</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">暂无预警规则</td></tr>';

    renderPagination(list.length);
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openForm(btn.dataset.edit));
    });
    tbody.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        AlertRulesStore.toggleStatus(btn.dataset.toggle);
        renderList();
      });
    });
  }

  function updateGlobalMetricUi() {
    const idInput = document.getElementById('arf-global-metric-id');
    if (idInput) idInput.value = selectedMetric?.id || '';
  }

  function updateConditionsEmptyState() {
    const empty = document.getElementById('arf-conditions-empty');
    const wrap = document.getElementById('alert-rule-conditions');
    if (!empty || !wrap) return;
    empty.style.display = wrap.children.length ? 'none' : '';
  }

  function bindConditionRowEvents(row) {
    const opSel = row.querySelector('.arf-cond-op');
    const updateRangeUi = () => {
      const isRange = RANGE_OPERATORS.includes(opSel?.value);
      row.querySelector('.arf-cond-val-single')?.classList.toggle('hidden', isRange);
      row.querySelector('.arf-cond-val-range')?.classList.toggle('hidden', !isRange);
    };
    opSel?.addEventListener('change', updateRangeUi);
    updateRangeUi();
    row.querySelector('.arf-cond-del')?.addEventListener('click', () => {
      row.remove();
      updateConditionsEmptyState();
    });
  }

  function addConditionRow(data) {
    const wrap = document.getElementById('alert-rule-conditions');
    if (!wrap) return;

    const metric = data?.metricId
      ? (window.getMetricById?.(data.metricId) || selectedMetric)
      : selectedMetric;
    if (!metric && !data?.metricId) return;

    const level = normalizeLevel(data?.level || resolveMetricLevel(metric));
    const scopeKey = scopeKeyOf(data) || data?.scopeKey || '';
    const uniqueKey = data?.uniqueKey || rowUniqueKey(data?.metricId || metric?.id || '', scopeKey);
    const scopeLabel = formatScopeLabel({ ...data, level });
    const metricLabel = metric
      ? `${metric.name}（${metric.code}）`
      : (data?.metricName || '—');
    const metricUnit = data?.metricUnit || resolveMetricUnit(metric);
    const op = data?.operator || '高于';
    const isRange = RANGE_OPERATORS.includes(op);
    const id = 'cond-' + (++conditionRowSeed);

    const row = document.createElement('div');
    row.className = 'alert-rule-condition-row';
    row.dataset.rowId = id;
    row.dataset.scopeKey = scopeKey;
    row.dataset.uniqueKey = uniqueKey;
    row.innerHTML = `
      <input type="hidden" class="arf-cond-metric-id" value="${esc(data?.metricId || metric?.id || '')}"/>
      <input type="hidden" class="arf-cond-metric-unit" value="${esc(metricUnit)}"/>
      <input type="hidden" class="arf-cond-level" value="${esc(level)}"/>
      <input type="hidden" class="arf-cond-scope-key" value="${esc(scopeKey)}"/>
      <input type="hidden" class="arf-cond-scope-json" value="${esc(JSON.stringify(data?.scopePayload || buildScopePayloadFromData(data)))}"/>
      <div class="arf-cond-metric-display" title="${esc(metricLabel)}">${esc(metric?.name || data?.metricName || '—')}</div>
      <div class="arf-cond-level-display">${renderLevelBadgeHtml(level)}</div>
      <div class="arf-cond-scope-display" title="${esc(scopeLabel)}">${esc(scopeLabel)}</div>
      <div class="arf-cond-unit-display">${esc(metricUnit)}</div>
      <div class="arf-cond-calc">
        <select class="arf-cond-op" name="cond_op_${id}">
          ${OPERATOR_OPTIONS.map(o => `<option ${o === op ? 'selected' : ''}>${esc(o)}</option>`).join('')}
        </select>
        <input type="text" class="arf-cond-val-single ${isRange ? 'hidden' : ''}" placeholder="阈值" value="${esc(data?.threshold || '')}"/>
        <div class="arf-cond-val-range ${isRange ? '' : 'hidden'}">
          <input type="text" class="arf-cond-val-min" placeholder="下限" value="${esc(data?.thresholdMin || '')}"/>
          <span class="arf-cond-range-sep">~</span>
          <input type="text" class="arf-cond-val-max" placeholder="上限" value="${esc(data?.thresholdMax || '')}"/>
        </div>
      </div>
      <button type="button" class="btn-link text-danger arf-cond-del" title="删除"><i class="fas fa-trash"></i> 删除</button>`;
    wrap.appendChild(row);
    bindConditionRowEvents(row);
    updateConditionsEmptyState();
  }

  function buildScopePayloadFromData(data) {
    if (!data) return {};
    const level = normalizeLevel(data.level);
    const payload = { level, province: PROVINCE_NAME };
    if (level === '地市级') {
      payload.cityId = data.cityId || (data.cityIds || [])[0];
      payload.cityName = data.cityName || (data.cityNames || [])[0];
    } else if (level === '区县级') {
      payload.cityId = data.cityId;
      payload.cityName = data.cityName;
      payload.countyId = data.countyId;
      payload.countyName = data.countyName;
    } else if (level === '网格级') {
      payload.cityId = data.cityId;
      payload.cityName = data.cityName;
      payload.countyId = data.countyId;
      payload.countyName = data.countyName;
      payload.gridId = data.gridId;
      payload.gridName = data.gridName;
    }
    return payload;
  }

  function parseScopeKey(key) {
    if (key === 'province') {
      return { scopeKey: key, level: '省级', province: PROVINCE_NAME };
    }
    const cityMatch = key.match(/^city:(.+)$/);
    if (cityMatch) {
      const cityId = cityMatch[1];
      const city = getJxCities().find(c => c.id === cityId);
      return {
        scopeKey: key,
        level: '地市级',
        province: PROVINCE_NAME,
        cityId,
        cityName: city?.name || cityId
      };
    }
    const countyMatch = key.match(/^county:([^:]+):(.+)$/);
    if (countyMatch) {
      const cityId = countyMatch[1];
      const countyId = countyMatch[2];
      const city = getJxCities().find(c => c.id === cityId);
      const county = getCountyById(cityId, countyId);
      return {
        scopeKey: key,
        level: '区县级',
        province: PROVINCE_NAME,
        cityId,
        cityName: city?.name,
        countyId,
        countyName: county?.name || countyId
      };
    }
    const gridMatch = key.match(/^grid:([^:]+):([^:]+):(.+)$/);
    if (gridMatch) {
      const cityId = gridMatch[1];
      const countyId = gridMatch[2];
      const gridId = gridMatch[3];
      const city = getJxCities().find(c => c.id === cityId);
      const county = getCountyById(cityId, countyId);
      const grid = county?.grids?.find(g => g.id === gridId);
      return {
        scopeKey: key,
        level: '网格级',
        province: PROVINCE_NAME,
        cityId,
        cityName: city?.name,
        countyId,
        countyName: county?.name,
        gridId,
        gridName: grid?.name || gridId
      };
    }
    return null;
  }

  function collectConditions() {
    const rows = document.querySelectorAll('#alert-rule-conditions .alert-rule-condition-row');
    return Array.from(rows).map(row => {
      const metricId = row.querySelector('.arf-cond-metric-id')?.value;
      const level = row.querySelector('.arf-cond-level')?.value;
      const scopeKey = row.querySelector('.arf-cond-scope-key')?.value;
      let scopePayload = {};
      try {
        scopePayload = JSON.parse(row.querySelector('.arf-cond-scope-json')?.value || '{}');
      } catch (e) { /* ignore */ }
      const operator = row.querySelector('.arf-cond-op')?.value;
      const threshold = row.querySelector('.arf-cond-val-single')?.value?.trim();
      const thresholdMin = row.querySelector('.arf-cond-val-min')?.value?.trim();
      const thresholdMax = row.querySelector('.arf-cond-val-max')?.value?.trim();
      const metric = window.getMetricById?.(metricId);
      const metricUnit = row.querySelector('.arf-cond-metric-unit')?.value
        || resolveMetricUnit(metric);

      const base = {
        metricId,
        metricName: metric?.name || scopePayload.metricName,
        metricCode: metric?.code,
        metricUnit: metricUnit || resolveMetricUnit(metric),
        level: normalizeLevel(level),
        operator,
        threshold,
        thresholdMin,
        thresholdMax,
        scopeKey,
        province: PROVINCE_NAME,
        ...scopePayload
      };

      if (base.level === '地市级' && base.cityId) {
        base.cityIds = [base.cityId];
        base.cityNames = [base.cityName].filter(Boolean);
      }
      return base;
    }).filter(c => {
      if (!c.metricId || !c.level || !c.operator) return false;
      if (c.level === '地市级' && !c.cityId && !c.cityIds?.length) return false;
      if (c.level === '区县级' && (!c.cityId || !c.countyId)) return false;
      if (c.level === '网格级' && (!c.cityId || !c.countyId || !c.gridId)) return false;
      if (RANGE_OPERATORS.includes(c.operator)) return c.thresholdMin && c.thresholdMax;
      return !!c.threshold;
    });
  }

  function searchMetricPicker() {
    const keyword = (document.getElementById('arf-mp-keyword')?.value || '').trim();
    const algoScene = document.getElementById('arf-mp-algorithm-scene')?.value || '';
    metricPickerRows = getMetricOptions().filter(row => {
      if (keyword && !row.name.includes(keyword) && !row.code.includes(keyword)) return false;
      if (algoScene) {
        const scenes = row.algorithmScenes || [];
        if (!scenes.includes(algoScene)) return false;
      }
      return true;
    });
    metricPickerPage = 1;
    renderMetricPickerTable();
  }

  function renderMetricPickerTable() {
    const tbody = document.getElementById('arf-metric-pick-tbody');
    const pagination = document.getElementById('arf-metric-pick-pagination');
    if (!tbody) return;

    const start = (metricPickerPage - 1) * METRIC_PICKER_PAGE_SIZE;
    const pageRows = metricPickerRows.slice(start, start + METRIC_PICKER_PAGE_SIZE);
    tbody.innerHTML = pageRows.map(row => `
      <tr class="${pendingMetricIds.has(row.id) ? 'selected' : ''}" data-metric-id="${esc(row.id)}">
        <td><input type="checkbox" class="arf-metric-pick-cb" value="${esc(row.id)}" ${pendingMetricIds.has(row.id) ? 'checked' : ''}/></td>
        <td>${esc(row.code)}</td>
        <td><strong>${esc(row.name)}</strong></td>
        <td>${esc(row.unit || resolveMetricUnit(row))}</td>
        <td>${esc(formatAlgoScenes(row.algorithmScenes))}</td>
        <td>${esc(row.period || '—')}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">暂无指标</td></tr>';

    tbody.querySelectorAll('tr[data-metric-id]').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.closest('.arf-metric-pick-cb')) return;
        const cb = tr.querySelector('.arf-metric-pick-cb');
        if (!cb) return;
        cb.checked = !cb.checked;
        if (cb.checked) pendingMetricIds.add(tr.dataset.metricId);
        else pendingMetricIds.delete(tr.dataset.metricId);
        tr.classList.toggle('selected', cb.checked);
      });
    });
    tbody.querySelectorAll('.arf-metric-pick-cb').forEach(cb => {
      cb.addEventListener('click', e => e.stopPropagation());
      cb.addEventListener('change', () => {
        const tr = cb.closest('tr[data-metric-id]');
        if (cb.checked) pendingMetricIds.add(cb.value);
        else pendingMetricIds.delete(cb.value);
        tr?.classList.toggle('selected', cb.checked);
      });
    });

    if (window.TablePagination && pagination) {
      const result = TablePagination.render(pagination, {
        total: metricPickerRows.length,
        page: metricPickerPage,
        pageSize: METRIC_PICKER_PAGE_SIZE,
        onPageChange: nextPage => {
          metricPickerPage = nextPage;
          renderMetricPickerTable();
        }
      });
      metricPickerPage = result.page;
    }
  }

  function openMetricPicker() {
    pendingMetricIds = new Set();
    metricPickerStep = 1;
    const kw = document.getElementById('arf-mp-keyword');
    if (kw) kw.value = '';
    const algo = document.getElementById('arf-mp-algorithm-scene');
    if (algo) algo.value = '';
    searchMetricPicker();
    setMetricPickerStep(1);
    openModal('modal-alert-metric-pick');
  }

  function goMetricPickerStep2() {
    if (!pendingMetricIds.size) {
      alert('请至少选择一个指标');
      return;
    }
    renderSelectedMetricsSummary();
    renderScopeCheckList();
    setMetricPickerStep(2);
  }

  function goMetricPickerStep1() {
    setMetricPickerStep(1);
  }

  function confirmMetricWizard() {
    if (metricPickerStep === 1) {
      goMetricPickerStep2();
      return;
    }
    if (!pendingMetricIds.size) {
      alert('请至少选择一个指标');
      return;
    }
    if (!validateMetricWizardStep2()) return;

    const metrics = [...pendingMetricIds]
      .map(id => window.getMetricById?.(id))
      .filter(Boolean);
    const scopeSelections = collectScopeSelectionsFromWizard();
    const added = applyMetricWizardResult(metrics, scopeSelections);
    closeModal('modal-alert-metric-pick');
    if (!added) {
      alert('所选指标与范围均已存在，未新增规则行');
    }
  }

  function renderRecipientChips() {
    const wrap = document.getElementById('arf-recipient-chips');
    if (!wrap) return;
    if (!selectedRecipients.length) {
      wrap.innerHTML = '<p class="muted alert-recipient-empty">暂未添加接收人</p>';
      return;
    }
    wrap.innerHTML = selectedRecipients.map(p => `
      <span class="alert-recipient-chip" data-person-id="${esc(p.id)}">
        <span class="alert-recipient-chip-name">${esc(p.name)}</span>
        <small class="muted">${esc(p.meta || '')}</small>
        <button type="button" class="alert-recipient-chip-remove" title="移除" data-remove-id="${esc(p.id)}"><i class="fas fa-times"></i></button>
      </span>`).join('');

    wrap.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRecipients = selectedRecipients.filter(p => p.id !== btn.dataset.removeId);
        renderRecipientChips();
        renderRecipientStaffList(document.getElementById('arf-recipient-search')?.value || '');
        updateRecipientPickCount();
      });
    });
  }

  function updateRecipientPickCount() {
    const el = document.getElementById('arf-recipient-pick-count');
    if (!el) return;
    const n = selectedRecipients.length;
    el.textContent = n ? `已选 ${n} 人` : '暂未选择接收人';
  }

  function personToRecipient(person) {
    return {
      id: person.id,
      name: person.name,
      unitId: person.unitId,
      deptId: person.deptId,
      role: person.role,
      meta: getPersonMeta(person)
    };
  }

  function renderRecipientUnitList() {
    const wrap = document.getElementById('arf-recipient-unit-list');
    const org = window.JX_ORG_SYSTEM;
    if (!wrap || !org) {
      if (wrap) wrap.innerHTML = '<p class="muted">组织架构未加载</p>';
      return;
    }

    const prov = org.units.find(u => u.id === 'jx-prov');
    const cities = org.units.filter(u => u.id !== 'jx-prov');
    const renderUnitBtn = unit => {
      const count = org.persons.filter(p => p.unitId === unit.id).length;
      const active = unit.id === selectedRecipientUnitId ? ' is-active' : '';
      return `<button type="button" class="alert-recipient-unit-item${active}" data-unit-id="${esc(unit.id)}">
        <span class="alert-recipient-unit-name">${esc(unit.name)}</span>
        <span class="alert-recipient-unit-count">${count} 人</span>
      </button>`;
    };

    let html = '';
    if (prov) html += renderUnitBtn(prov);
    if (cities.length) {
      html += `<div class="alert-recipient-unit-section">地市公司</div>`;
      html += cities.map(renderUnitBtn).join('');
    }
    wrap.innerHTML = html;

    wrap.querySelectorAll('.alert-recipient-unit-item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRecipientUnitId = btn.dataset.unitId;
        renderRecipientUnitList();
        renderRecipientStaffList(document.getElementById('arf-recipient-search')?.value || '');
        const unit = org.units.find(u => u.id === selectedRecipientUnitId);
        const label = document.getElementById('arf-recipient-unit-label');
        if (label) label.textContent = unit ? `· ${unit.name}` : '';
      });
    });

    const unit = org.units.find(u => u.id === selectedRecipientUnitId);
    const label = document.getElementById('arf-recipient-unit-label');
    if (label) label.textContent = unit ? `· ${unit.name}` : '';
  }

  function renderRecipientStaffList(keyword) {
    const wrap = document.getElementById('arf-recipient-staff-list');
    const org = window.JX_ORG_SYSTEM;
    if (!wrap || !org) {
      if (wrap) wrap.innerHTML = '<p class="muted">组织架构未加载</p>';
      return;
    }

    const unit = org.units.find(u => u.id === selectedRecipientUnitId) || org.units[0];
    if (!selectedRecipientUnitId && unit) selectedRecipientUnitId = unit.id;

    const kw = (keyword || '').trim().toLowerCase();
    const selectedIds = new Set(selectedRecipients.map(p => p.id));
    const unitPersons = org.persons.filter(p => p.unitId === unit.id);
    const filteredPersons = kw
      ? unitPersons.filter(p => {
        const dept = unit.depts?.find(d => d.id === p.deptId);
        const hay = `${p.name} ${p.role} ${dept?.name || ''}`.toLowerCase();
        return hay.includes(kw);
      })
      : unitPersons;

    if (!filteredPersons.length) {
      wrap.innerHTML = `<p class="muted alert-recipient-staff-empty">${kw ? '未找到匹配员工' : '该公司暂无员工'}</p>`;
      return;
    }

    const byDept = {};
    filteredPersons.forEach(p => {
      const key = p.deptId || '_';
      if (!byDept[key]) byDept[key] = [];
      byDept[key].push(p);
    });

    let html = '';
    Object.keys(byDept).forEach(deptId => {
      const dept = unit.depts?.find(d => d.id === deptId);
      if (dept) html += `<div class="alert-recipient-staff-dept">${esc(dept.name)}</div>`;
      byDept[deptId].forEach(person => {
        const checked = selectedIds.has(person.id);
        const deptName = unit.depts?.find(d => d.id === person.deptId)?.name || '';
        html += `
          <label class="alert-recipient-staff-item${checked ? ' is-selected' : ''}">
            <input type="checkbox" class="arf-recipient-staff-cb" data-person-id="${esc(person.id)}" ${checked ? 'checked' : ''}/>
            <span class="alert-recipient-staff-main">
              <strong>${esc(person.name)}</strong>
              <small class="muted">${esc(person.role)}${deptName ? ` · ${esc(deptName)}` : ''}</small>
            </span>
          </label>`;
      });
    });

    wrap.innerHTML = html;
    wrap.querySelectorAll('.arf-recipient-staff-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const person = org.persons.find(p => p.id === cb.dataset.personId);
        if (!person) return;
        const idx = selectedRecipients.findIndex(p => p.id === person.id);
        if (cb.checked && idx < 0) {
          selectedRecipients.push(personToRecipient(person));
        } else if (!cb.checked && idx >= 0) {
          selectedRecipients.splice(idx, 1);
        }
        renderRecipientChips();
        cb.closest('.alert-recipient-staff-item')?.classList.toggle('is-selected', cb.checked);
        updateRecipientPickCount();
      });
    });
  }

  function renderRecipientPicker() {
    renderRecipientUnitList();
    renderRecipientStaffList(document.getElementById('arf-recipient-search')?.value || '');
    updateRecipientPickCount();
  }

  function openRecipientPicker() {
    selectedRecipientUnitId = 'jx-prov';
    const search = document.getElementById('arf-recipient-search');
    if (search) search.value = '';
    renderRecipientPicker();
    openModal('modal-alert-recipient-pick');
  }

  function resolveRecipientsFromRule(r) {
    const org = window.JX_ORG_SYSTEM;
    if (r?.recipientDetails?.length) return r.recipientDetails.map(p => ({ ...p }));
    const ids = r?.recipients || [];
    return ids.map(id => {
      const person = org?.persons?.find(p => p.id === id);
      if (person) return personToRecipient(person);
      return { id, name: (r.recipientNames || []).find((_, i) => ids[i] === id) || id, meta: '' };
    }).filter(Boolean);
  }

  function migrateLegacyRule(r) {
    if (!r) return r;
    const migrated = { ...r };
    if (!migrated.monitorMode && migrated.remindFreq) {
      migrated.monitorMode = migrated.remindFreq === '天' ? '按天'
        : migrated.remindFreq === '周' ? '按周'
        : migrated.remindFreq === '月' ? '按月' : migrated.remindFreq;
    }
    migrated.monitorMode = migrated.monitorMode || '按天';
    if (!migrated.monitorTime && migrated.remindTime) migrated.monitorTime = migrated.remindTime;
    migrated.monitorTime = migrated.monitorTime || '08:00';
    if (!migrated.effectiveDateStart && migrated.effectiveDate) {
      migrated.effectiveDateStart = migrated.effectiveDate;
    }
    if (!migrated.effectiveDateEnd) {
      migrated.effectiveDateEnd = migrated.effectiveDateStart || migrated.effectiveDate || '2099-12-31';
    }
    if (migrated.notifySms == null && migrated.remindSms) migrated.notifySms = migrated.remindSms === '是';
    if (migrated.conditions?.length) {
      migrated.conditions = migrated.conditions.map(c => {
        let operator = c.operator;
        if (operator === '大于' || operator === '大于等于') operator = '高于';
        else if (operator === '小于') operator = '低于';
        let level = normalizeLevel(c.level || (Array.isArray(c.levels) ? c.levels[0] : '省级'));
        const next = { ...c, level, operator, province: c.province || PROVINCE_NAME };

        if (level === '地市级') {
          if (!next.cityId && next.cityIds?.length) {
            next.cityId = next.cityIds[0];
            next.cityName = next.cityNames?.[0] || getJxCities().find(x => x.id === next.cityId)?.name;
          } else if (!next.cityIds?.length && next.cityId) {
            next.cityIds = [next.cityId];
            next.cityNames = [next.cityName].filter(Boolean);
          }
        }
        next.scopeKey = scopeKeyOf(next);
        return next;
      });
    }
    return migrated;
  }

  function expandLegacyMultiCityConditions(conditions) {
    const expanded = [];
    (conditions || []).forEach(c => {
      const level = normalizeLevel(c.level);
      if (level === '地市级' && (c.cityIds || []).length > 1) {
        c.cityIds.forEach((cityId, i) => {
          expanded.push({
            ...c,
            cityId,
            cityName: c.cityNames?.[i] || getJxCities().find(x => x.id === cityId)?.name,
            cityIds: [cityId],
            cityNames: [c.cityNames?.[i]].filter(Boolean),
            scopeKey: `city:${cityId}`
          });
        });
      } else {
        expanded.push(c);
      }
    });
    return expanded;
  }

  function openForm(id) {
    editingId = id || null;
    selectedMetric = null;
    selectedMetricLevel = '省级';
    const title = document.getElementById('alert-rules-form-title');
    const form = document.getElementById('alert-rule-form');
    if (title) title.textContent = id ? '编辑预警规则' : '新增规则';

    const r = migrateLegacyRule(id ? AlertRulesStore.getById(id) : null);
    const set = (sel, val) => {
      const el = form?.querySelector(sel);
      if (el) el.value = val == null ? '' : val;
    };

    set('[name="name"]', r?.name || '');
    set('[name="description"]', r?.description || '');
    set('[name="effectiveDateStart"]', r?.effectiveDateStart || r?.effectiveDate || '2026-05-28');
    set('[name="effectiveDateEnd"]', r?.effectiveDateEnd || '2099-12-31');

    const smsCb = form?.querySelector('[name="notifySms"]');
    const emailCb = form?.querySelector('[name="notifyEmail"]');
    const siteCb = form?.querySelector('[name="notifySiteMsg"]');
    if (smsCb) smsCb.checked = !!r?.notifySms;
    if (emailCb) emailCb.checked = !!r?.notifyEmail;
    if (siteCb) siteCb.checked = !!r?.notifySiteMsg;
    loadNotifyTemplatesFromRule(r);

    selectedRecipients = resolveRecipientsFromRule(r);
    renderRecipientChips();

    const condWrap = document.getElementById('alert-rule-conditions');
    if (condWrap) condWrap.innerHTML = '';

    const conds = expandLegacyMultiCityConditions(r?.conditions || []);
    if (conds.length) {
      const firstMetric = window.getMetricById?.(conds[0].metricId);
      selectedMetric = firstMetric ? enrichMetricRow(firstMetric) : null;
      selectedMetricLevel = normalizeLevel(conds[0].level || '省级');
      conds.forEach(c => addConditionRow(c));
    }
    updateGlobalMetricUi();
    updateConditionsEmptyState();

    showView('form');
  }

  function saveForm(e) {
    e.preventDefault();
    const form = e.target;
    const notifySms = !!form.querySelector('[name="notifySms"]')?.checked;
    const notifyEmail = !!form.querySelector('[name="notifyEmail"]')?.checked;
    const notifySiteMsg = !!form.querySelector('[name="notifySiteMsg"]')?.checked;
    const conditions = collectConditions();
    const effectiveDateStart = form.querySelector('[name="effectiveDateStart"]')?.value;
    const effectiveDateEnd = form.querySelector('[name="effectiveDateEnd"]')?.value;

    const payload = {
      name: form.querySelector('[name="name"]')?.value?.trim(),
      description: form.querySelector('[name="description"]')?.value?.trim(),
      monitorMode: '按天',
      monitorTime: '08:00',
      monitorWeekdays: [],
      effectiveDateStart,
      effectiveDateEnd,
      effectiveDate: effectiveDateStart,
      notifySms,
      notifyEmail,
      notifySiteMsg,
      notifyTemplates: { ...Object.fromEntries(Object.entries(notifyTemplates).map(([k, v]) => [k, { title: v.title || '', content: v.content || '' }])) },
      recipients: selectedRecipients.map(p => p.id),
      recipientNames: selectedRecipients.map(p => p.name),
      recipientDetails: selectedRecipients.map(p => ({ ...p })),
      conditions
    };

    if (!payload.name || !payload.description) {
      alert('请填写必填项');
      return;
    }
    if (!effectiveDateStart || !effectiveDateEnd) {
      alert('请选择预警规则生效日期');
      return;
    }
    if (effectiveDateStart > effectiveDateEnd) {
      alert('生效开始日期不能晚于结束日期');
      return;
    }
    if (!notifySms && !notifyEmail && !notifySiteMsg) {
      alert('请至少选择一种提醒方式（短信、邮件或站内消息）');
      return;
    }
    if (!selectedRecipients.length) {
      alert('请至少添加一位接收人');
      return;
    }
    if (!conditions.length) {
      alert('请通过「添加预警指标」配置指标层级与监控范围，并填写计算规则');
      return;
    }

    const primary = conditions[0];
    payload.metricId = primary.metricId;
    payload.metricName = primary.metricName;
    payload.metricCode = primary.metricCode;

    if (editingId) {
      AlertRulesStore.save({ ...AlertRulesStore.getById(editingId), ...payload });
    } else {
      AlertRulesStore.create(payload);
    }
    showView('list');
    renderList();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('alert-rules-list-view')) return;

    document.getElementById('btn-alert-rules-search')?.addEventListener('click', () => {
      page = 1;
      renderList();
    });
    document.getElementById('btn-alert-rule-create')?.addEventListener('click', () => openForm());
    document.getElementById('btn-alert-rule-back')?.addEventListener('click', () => {
      showView('list');
      renderList();
    });
    document.getElementById('alert-rule-form')?.addEventListener('submit', saveForm);
    document.getElementById('btn-alert-add-recipient')?.addEventListener('click', openRecipientPicker);
    document.getElementById('btn-alert-add-metric')?.addEventListener('click', openMetricPicker);
    document.getElementById('arf-mp-next')?.addEventListener('click', goMetricPickerStep2);
    document.getElementById('arf-mp-prev')?.addEventListener('click', goMetricPickerStep1);
    document.getElementById('arf-mp-confirm')?.addEventListener('click', confirmMetricWizard);
    document.getElementById('arf-mp-search')?.addEventListener('click', searchMetricPicker);
    document.getElementById('arf-mp-keyword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchMetricPicker();
    });
    document.getElementById('arf-mp-algorithm-scene')?.addEventListener('change', searchMetricPicker);
    document.getElementById('arf-recipient-search')?.addEventListener('input', e => {
      renderRecipientStaffList(e.target.value);
    });

    bindNotifyTemplateUi();
    renderList();
  });
})();
