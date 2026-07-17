/** 营销策略创建（客群 · 策略信息 · 产品 · 渠道） */
(function () {
  const PRODUCT_PAGE_SIZE = 10;
  const PUSH_METHODS = ['全量推送', '偏好推送'];
  const OUTBOUND_TYPES = ['营销外呼', '关怀外呼', '挽留外呼'];
  const APP_SLOTS = ['默认运营位', '首页Banner', '我的专属优惠'];
  const POPUP_SLOTS = ['默认弹屏位', '账单页弹屏', '客服工作台弹屏'];

  /** @type {typeof STRATEGY_PRODUCT_CATALOG} */
  let selectedProducts = [];
  /** @type {string[]} */
  let selectedChannelIds = [];
  /** @type {Record<string, object>} */
  let channelConfigs = {};
  let activeChannelId = null;
  let productPickerPage = 1;
  let productPickerKw = '';
  /** @type {string|null} */
  let productPickerDraftId = null;
  /** @type {Set<string>} */
  let channelPickerDraft = new Set();

  let segmentCtx = null;
  let editingStrategyId = null;

  /** 客群选择弹窗状态 */
  let segmentPickState = {
    selectedSegmentId: null,
    keyword: ''
  };
  let segmentPickPage = 1;
  const SEGMENT_PICK_PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;

  const SEGMENT_SCALE_POOL = [4280, 8640, 12840, 6200, 3850, 15600, 42800, 8920, 2140, 3280];

  function segmentStatusBadge(status) {
    const m = window.SEGMENT_STATUS_MAP?.[status];
    return m ? `<span class="badge ${m.cls}">${m.label}</span>` : esc(status);
  }

  function getSegmentList() {
    return window.CustomerSegmentStore?.getAll() || window.CUSTOMER_SEGMENT_LIST || [];
  }

  function segmentSourceBadge(source) {
    if (window.CustomerSegmentStore?.sourceBadge) {
      return window.CustomerSegmentStore.sourceBadge(source);
    }
    return source === 'dispatch'
      ? '<span class="badge-source-dispatch">客群调度</span>'
      : '<span class="badge-source-ai">AI根因生成</span>';
  }

  function segmentSourceLabel(source) {
    if (window.CustomerSegmentStore?.sourceLabel) {
      return window.CustomerSegmentStore.sourceLabel(source);
    }
    return source === 'dispatch' ? '客群调度' : 'AI根因生成';
  }

  function deriveSegmentScale(row) {
    if (row?.scaleLabel) return row.scaleLabel;
    const list = getSegmentList();
    const idx = list.findIndex(s => s.id === row.id);
    const n = SEGMENT_SCALE_POOL[(idx >= 0 ? idx : 0) % SEGMENT_SCALE_POOL.length];
    return n.toLocaleString('zh-CN') + ' 人';
  }

  function buildAggFromSegmentRow(row) {
    const metric = row.metrics?.[0];
    return {
      id: row.id,
      name: row.name,
      scaleLabel: deriveSegmentScale(row),
      sourceMetric: metric?.name || '—',
      metricValue: metric?.value || '—',
      metricMom: metric?.mom || '—',
      metricYoy: metric?.yoy || '—',
      tagConvergence: (row.tags || []).slice(0, 6).map(t => t.name)
    };
  }

  function getFilteredSegmentPickList() {
    const kw = (segmentPickState.keyword || '').trim();
    return getSegmentList().filter(row => {
      if (!kw) return true;
      return row.name.includes(kw) || row.id.includes(kw);
    });
  }

  function syncSegmentPickFoot() {
    const btnConfirm = document.getElementById('btn-segment-pick-confirm');
    const row = getSegmentList().find(s => s.id === segmentPickState.selectedSegmentId);
    if (btnConfirm) {
      btnConfirm.toggleAttribute('disabled', !row || row.status !== 'active');
    }
  }

  function renderSegmentPickTable() {
    const tbody = document.getElementById('segment-pick-tbody');
    if (!tbody) return;
    const list = getFilteredSegmentPickList();
    const pageRows = window.TablePagination
      ? TablePagination.slice(list, segmentPickPage, SEGMENT_PICK_PAGE_SIZE)
      : list;

    if (window.TablePagination) {
      const result = TablePagination.render('segment-pick-pagination', {
        total: list.length,
        page: segmentPickPage,
        pageSize: SEGMENT_PICK_PAGE_SIZE,
        onPageChange: nextPage => {
          segmentPickPage = nextPage;
          renderSegmentPickTable();
        }
      });
      segmentPickPage = result.page;
    }

    if (!pageRows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:32px">暂无匹配客群</td></tr>';
      syncSegmentPickFoot();
      return;
    }
    tbody.innerHTML = pageRows.map(row => {
      const selectable = row.status === 'active';
      const checked = segmentPickState.selectedSegmentId === row.id;
      return `
        <tr class="segment-pick-row${checked ? ' is-selected' : ''}${selectable ? '' : ' is-disabled'}" data-segment-id="${esc(row.id)}" data-segment-status="${esc(row.status)}">
          <td>
            <input type="radio" name="segment-pick" value="${esc(row.id)}"${checked ? ' checked' : ''}${selectable ? '' : ' disabled'}/>
          </td>
          <td class="cell-ellipsis" title="${esc(row.id)}"><code>${esc(row.id)}</code></td>
          <td class="cell-ellipsis" title="${esc(row.name)}"><strong>${esc(row.name)}</strong></td>
          <td>${segmentSourceBadge(row.source)}</td>
          <td><strong>${esc(row.scaleLabel || deriveSegmentScale(row))}</strong></td>
          <td class="cell-ellipsis tag-caliber-cell" title="${esc(row.bizCaliber)}">${esc(row.bizCaliber)}</td>
          <td>${esc(row.effectiveDate)}</td>
          <td>${segmentStatusBadge(row.status)}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.segment-pick-row:not(.is-disabled)').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.matches('input[type="radio"]')) return;
        const id = tr.dataset.segmentId;
        segmentPickState.selectedSegmentId = id;
        const radio = tr.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        tbody.querySelectorAll('.segment-pick-row').forEach(r => r.classList.toggle('is-selected', r.dataset.segmentId === id));
        syncSegmentPickFoot();
      });
    });
    tbody.querySelectorAll('input[name="segment-pick"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        segmentPickState.selectedSegmentId = radio.value;
        tbody.querySelectorAll('.segment-pick-row').forEach(r => {
          r.classList.toggle('is-selected', r.dataset.segmentId === radio.value);
        });
        syncSegmentPickFoot();
      });
    });
    syncSegmentPickFoot();
  }

  function resetSegmentPickModal() {
    segmentPickState = { selectedSegmentId: null, keyword: '' };
    segmentPickPage = 1;
    const kwEl = document.getElementById('segment-pick-kw');
    if (kwEl) kwEl.value = '';
    renderSegmentPickTable();
  }

  function openSegmentPickModal() {
    resetSegmentPickModal();
    if (typeof openModal === 'function') openModal('modal-segment-pick');
  }

  function applySegmentPickFilters() {
    segmentPickState.keyword = (document.getElementById('segment-pick-kw')?.value || '').trim();
    segmentPickState.selectedSegmentId = null;
    segmentPickPage = 1;
    renderSegmentPickTable();
  }

  function confirmSegmentPick() {
    const row = getSegmentList().find(s => s.id === segmentPickState.selectedSegmentId);
    if (!row) {
      window.alert('请选择客群');
      return;
    }
    if (row.status !== 'active') {
      window.alert('请选择生效状态的客群');
      return;
    }
    const agg = buildAggFromSegmentRow(row);
    segmentCtx = typeof window.saveStrategyCreateContext === 'function'
      ? window.saveStrategyCreateContext(agg, {
          from: 'segment-manage',
          segmentCode: row.id,
          segmentSource: row.source || 'ai',
          dispatchTaskId: row.dispatchTaskId || ''
        })
      : {
          segmentId: row.id,
          segmentName: row.name,
          scaleLabel: agg.scaleLabel,
          sourceMetric: agg.sourceMetric,
          metricValue: agg.metricValue,
          metricMom: agg.metricMom,
          metricYoy: agg.metricYoy,
          tagConvergence: agg.tagConvergence
        };
    if (typeof closeModal === 'function') closeModal('modal-segment-pick');
    fillSegment();
  }

  function defaultChannelConfig(channelId) {
    const base = { pushMethod: '全量推送', smartScript: false };
    if (channelId === 'ch_10085') {
      return {
        ...base,
        outboundType: '',
        marketingText: '',
        targetRule: '',
        taskDesc: '',
        attachmentName: ''
      };
    }
    if (channelId === 'ch_cmcc_app') {
      return { ...base, operationSlot: '默认运营位' };
    }
    if (channelId === 'ch_hall_net') {
      return {
        ...base,
        operationSlots: ['默认运营位-全队伍'],
        slotConfigs: {
          '默认运营位-全队伍': { recommendText: '' }
        }
      };
    }
    if (channelId === 'ch_10086_popup') {
      return {
        ...base,
        operationSlot: '',
        marketingText: '',
        smsTemplate: '',
        customerRule: '',
        activityPolicy: ''
      };
    }
    return base;
  }

  function syncProductHidden() {
    const hidden = document.getElementById('product-main-hidden');
    if (hidden) hidden.value = selectedProducts.map(p => p.name).join('、');
  }

  function renderSelectedProducts() {
    const box = document.getElementById('strategy-product-selected');
    if (!box) return;
    if (!selectedProducts.length) {
      box.innerHTML = '<p class="muted product-empty-hint">暂未选择产品，请点击上方按钮添加</p>';
      syncProductHidden();
      return;
    }
    box.innerHTML = `
      <div class="product-selected-chips">
        ${selectedProducts.map(p => `
          <div class="product-selected-chip">
            <strong>${esc(p.name)}</strong>
            <span class="muted">${esc(p.code)}</span>
            <button type="button" class="product-chip-remove" data-remove-product="${esc(p.id)}" aria-label="移除">×</button>
          </div>`).join('')}
      </div>`;
    box.querySelectorAll('[data-remove-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedProducts = selectedProducts.filter(p => p.id !== btn.dataset.removeProduct);
        renderSelectedProducts();
      });
    });
    syncProductHidden();
  }

  function getFilteredProducts() {
    const kw = productPickerKw.trim().toLowerCase();
    return (window.STRATEGY_PRODUCT_CATALOG || []).filter(p => {
      if (p.tab !== 'main') return false;
      if (!kw) return true;
      return (p.name + p.code).toLowerCase().includes(kw);
    });
  }

  function renderProductPickerChips() {
    const el = document.getElementById('product-picker-chips');
    if (!el) return;
    const catalog = window.STRATEGY_PRODUCT_CATALOG || [];
    const picked = catalog.find(p => p.id === productPickerDraftId);
    if (!picked) {
      el.innerHTML = '<span class="muted" style="font-size:12px">请点击下方列表选择一项主产品</span>';
      return;
    }
    el.innerHTML = `
      <span class="product-picker-chip product-picker-chip--single">
        <strong>${esc(picked.name)}</strong>
        <span class="muted">${esc(picked.code)}</span>
        <button type="button" data-draft-remove="${esc(picked.id)}" aria-label="清除">×</button>
      </span>`;
    el.querySelector('[data-draft-remove]')?.addEventListener('click', () => {
      productPickerDraftId = null;
      renderProductPickerChips();
      renderProductPickerTable();
    });
  }

  function renderProductPickerTable() {
    const tbody = document.getElementById('product-picker-tbody');
    const pag = document.getElementById('product-picker-pagination');
    if (!tbody) return;
    const list = getFilteredProducts();
    const totalPages = Math.max(1, Math.ceil(list.length / PRODUCT_PAGE_SIZE));
    if (productPickerPage > totalPages) productPickerPage = totalPages;
    const start = (productPickerPage - 1) * PRODUCT_PAGE_SIZE;
    const rows = list.slice(start, start + PRODUCT_PAGE_SIZE);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px">暂无主产品</td></tr>';
    } else {
      tbody.innerHTML = rows.map((p, i) => {
        const selected = productPickerDraftId === p.id;
        return `
        <tr class="product-picker-row${selected ? ' is-selected' : ''}" data-product-row="${esc(p.id)}">
          <td><input type="radio" name="product-pick" value="${esc(p.id)}"${selected ? ' checked' : ''} aria-label="选择 ${esc(p.name)}"/></td>
          <td>${start + i + 1}</td>
          <td><strong>${esc(p.name)}</strong><br/><span class="muted" style="font-size:12px">${esc(p.code)}</span></td>
          <td>${esc(p.goodsType)}</td>
          <td>${esc(p.bizCategory)}</td>
          <td style="white-space:nowrap;font-size:12px">${esc(p.effective)}</td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('[data-product-row]').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.closest('input[type="radio"]')) return;
          productPickerDraftId = row.dataset.productRow;
          renderProductPickerChips();
          renderProductPickerTable();
        });
        const radio = row.querySelector('input[type="radio"]');
        radio?.addEventListener('change', () => {
          if (radio.checked) {
            productPickerDraftId = radio.value;
            renderProductPickerChips();
            renderProductPickerTable();
          }
        });
      });
    }

    if (pag && window.TablePagination) {
      const result = TablePagination.render(pag, {
        total: list.length,
        page: productPickerPage,
        pageSize: PRODUCT_PAGE_SIZE,
        onPageChange: nextPage => {
          productPickerPage = nextPage;
          renderProductPickerTable();
        }
      });
      productPickerPage = result.page;
    }
  }

  function openProductPickerModal() {
    productPickerDraftId = selectedProducts[0]?.id || null;
    productPickerPage = 1;
    productPickerKw = '';
    const kw = document.getElementById('product-picker-kw');
    if (kw) kw.value = '';
    renderProductPickerChips();
    renderProductPickerTable();
    if (typeof openModal === 'function') openModal('modal-product-picker');
  }

  function confirmProductPicker() {
    if (!productPickerDraftId) {
      window.alert('请选择一个主产品');
      return;
    }
    const catalog = window.STRATEGY_PRODUCT_CATALOG || [];
    const picked = catalog.find(p => p.id === productPickerDraftId);
    selectedProducts = picked ? [picked] : [];
    renderSelectedProducts();
    if (typeof closeModal === 'function') closeModal('modal-product-picker');
  }

  function sortChannelsInCategory(channels) {
    const enabled = channels.filter(c => c.enabled);
    const disabled = channels.filter(c => !c.enabled);
    return [...enabled, ...disabled];
  }

  function renderChannelTouchItem(tp) {
    const selected = channelPickerDraft.has(tp.id);
    const disabled = !tp.enabled;
    return `
      <button type="button"
        class="channel-touch-item${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}"
        data-channel-id="${esc(tp.id)}"
        ${disabled ? 'disabled title="暂未开放"' : ''}>
        ${disabled
          ? '<span class="channel-touch-tag channel-touch-tag--off">未开放</span>'
          : '<span class="channel-touch-tag channel-touch-tag--ok">可选</span>'}
        <span class="channel-touch-name">${esc(tp.name)}</span>
        ${selected ? '<i class="fas fa-check-circle channel-touch-check" aria-hidden="true"></i>' : ''}
      </button>`;
  }

  function renderChannelTouchGrid() {
    const grid = document.getElementById('channel-touch-grid');
    if (!grid) return;
    const categories = window.STRATEGY_CHANNEL_CATEGORIES || [];
    grid.innerHTML = categories.map(cat => {
      const sortedChannels = sortChannelsInCategory(cat.channels);
      const enabledCount = cat.channels.filter(c => c.enabled).length;
      const channelCells = sortedChannels.length
        ? sortedChannels.map(tp => renderChannelTouchItem(tp)).join('')
        : '<p class="muted channel-category-empty">暂无开放渠道</p>';
      return `
      <div class="channel-category-block${!cat.channels.length ? ' channel-category-block--empty' : ''}">
        <div class="channel-category-head">
          <strong>${esc(cat.label)}</strong>
          <span class="muted channel-category-count">${enabledCount} 个可选</span>
        </div>
        <div class="channel-touch-grid-inner">
          ${channelCells}
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.channel-touch-item:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.channelId;
        if (channelPickerDraft.has(id)) channelPickerDraft.delete(id);
        else channelPickerDraft.add(id);
        renderChannelTouchGrid();
      });
    });
  }

  function openChannelPickerModal() {
    channelPickerDraft = new Set(selectedChannelIds);
    renderChannelTouchGrid();
    if (typeof openModal === 'function') openModal('modal-channel-picker');
  }

  function confirmChannelPicker() {
    const next = [...channelPickerDraft];
    next.forEach(id => {
      if (!channelConfigs[id]) channelConfigs[id] = defaultChannelConfig(id);
    });
    Object.keys(channelConfigs).forEach(id => {
      if (!next.includes(id)) delete channelConfigs[id];
    });
    selectedChannelIds = next;
    if (!activeChannelId || !selectedChannelIds.includes(activeChannelId)) {
      activeChannelId = selectedChannelIds[0] || null;
    }
    renderChannelTabsAndPanels();
    if (typeof closeModal === 'function') closeModal('modal-channel-picker');
  }

  function renderChannelTabsAndPanels() {
    const tabs = document.getElementById('strategy-channel-tabs');
    const panels = document.getElementById('strategy-channel-panels');
    if (!tabs || !panels) return;

    if (!selectedChannelIds.length) {
      tabs.innerHTML = '';
      panels.innerHTML = '<p class="muted channel-empty-hint">暂未选择渠道，请点击上方按钮添加</p>';
      return;
    }

    tabs.innerHTML = selectedChannelIds.map(id => {
      const ch = window.STRATEGY_CHANNEL_BY_ID?.[id];
      return `
        <button type="button" class="channel-tab-btn${id === activeChannelId ? ' active' : ''}" data-channel-tab="${esc(id)}">
          ${esc(ch?.name || id)}
          <span class="channel-tab-close" data-remove-channel="${esc(id)}" title="移除">×</span>
        </button>`;
    }).join('');

    tabs.querySelectorAll('[data-channel-tab]').forEach(btn => {
      btn.addEventListener('click', e => {
        if (e.target.closest('[data-remove-channel]')) return;
        activeChannelId = btn.dataset.channelTab;
        renderChannelTabsAndPanels();
      });
    });
    tabs.querySelectorAll('[data-remove-channel]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.removeChannel;
        selectedChannelIds = selectedChannelIds.filter(x => x !== id);
        delete channelConfigs[id];
        if (activeChannelId === id) activeChannelId = selectedChannelIds[0] || null;
        renderChannelTabsAndPanels();
      });
    });

    panels.innerHTML = selectedChannelIds.map(id => `
      <div class="channel-config-panel${id === activeChannelId ? ' active' : ''}" data-channel-panel="${esc(id)}">
        ${renderChannelConfigForm(id)}
      </div>`).join('');
    bindChannelConfigEvents();
  }

  function renderPushMethod(name, cfg) {
    return `
      <div class="form-field full">
        <label class="req">推送方式</label>
        <div class="radio-inline">
          ${PUSH_METHODS.map(m => `
            <label><input type="radio" name="${name}_push" value="${esc(m)}"${cfg.pushMethod === m ? ' checked' : ''}/> ${esc(m)}</label>
          `).join('')}
        </div>
      </div>`;
  }

  function renderTextarea(label, name, value, max, required, placeholder) {
    const len = (value || '').length;
    const ph = placeholder || `您还可以输入${max}个字`;
    return `
      <div class="form-field full">
        <label${required ? ' class="req"' : ''}>${esc(label)}</label>
        <div class="textarea-counter-wrap">
          <textarea name="${name}" rows="4" maxlength="${max}" data-counter="${name}" placeholder="${esc(ph)}">${esc(value || '')}</textarea>
          <span class="textarea-counter" data-counter-for="${name}">${len}/${max}</span>
        </div>
      </div>`;
  }

  function renderFileUploadField(label, prefix, fileName, required) {
    return `
      <div class="form-field full">
        <label${required ? ' class="req"' : ''}>${esc(label)}</label>
        <div class="channel-upload-row">
          <input type="file" id="${prefix}_attachment" class="channel-file-input" data-cfg-key="attachmentName" accept=".doc,.docx,.pdf,.xls,.xlsx,.txt,.zip,.rar"/>
          <button type="button" class="btn btn-primary btn-sm channel-upload-btn" data-upload-trigger="${prefix}">点击上传</button>
          <span class="channel-upload-name muted" data-upload-name="${prefix}">${esc(fileName || '未选择文件')}</span>
        </div>
      </div>`;
  }

  function renderChannelConfigForm(channelId) {
    const cfg = channelConfigs[channelId] || defaultChannelConfig(channelId);
    channelConfigs[channelId] = cfg;
    const prefix = channelId;

    if (channelId === 'ch_10085') {
      return `
        <div class="form-grid channel-form-grid">
          ${renderPushMethod(prefix, cfg)}
          <div class="form-field">
            <label class="req">外呼类型</label>
            <select name="${prefix}_outboundType" data-cfg-key="outboundType">
              <option value="">请选择外呼类型</option>
              ${OUTBOUND_TYPES.map(o => `<option${cfg.outboundType === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
            </select>
          </div>
          ${renderTextarea('营销用语', `${prefix}_marketingText`, cfg.marketingText, 300, true)}
          ${renderTextarea('营销(服务)目标客户及提取原则', `${prefix}_targetRule`, cfg.targetRule, 300, true)}
          ${renderTextarea('任务描述及要求', `${prefix}_taskDesc`, cfg.taskDesc, 300, true, '说明任务完成目标，例如：办理合约等')}
          ${renderFileUploadField('外呼需求附件（含需求正文、外呼脚本、客服文档等）', prefix, cfg.attachmentName, true)}
        </div>`;
    }

    if (channelId === 'ch_cmcc_app') {
      return `
        <div class="form-grid channel-form-grid">
          ${renderPushMethod(prefix, cfg)}
          <div class="form-field">
            <label class="req">运营位</label>
            <select name="${prefix}_operationSlot" data-cfg-key="operationSlot">
              ${APP_SLOTS.map(o => `<option${cfg.operationSlot === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
            </select>
          </div>
        </div>`;
    }

    if (channelId === 'ch_hall_net') {
      const slots = cfg.operationSlots || ['默认运营位-全队伍'];
      return `
        <div class="form-grid channel-form-grid">
          ${renderPushMethod(prefix, cfg)}
          <div class="form-field full">
            <label class="req">运营位</label>
            <div class="slot-tag-pick" data-channel="${esc(channelId)}">
              ${(window.STRATEGY_HALL_SLOTS || []).map(s => `
                <button type="button" class="slot-tag-btn${slots.includes(s) ? ' active' : ''}" data-slot-tag="${esc(s)}">${esc(s)}</button>
              `).join('')}
            </div>
          </div>
          ${slots.map(slot => {
            const sc = (cfg.slotConfigs || {})[slot] || { recommendText: '' };
            return `
              <div class="hall-slot-card" data-slot-card="${esc(slot)}">
                <div class="hall-slot-card-head">
                  <strong>${esc(slot)}</strong>
                </div>
                ${renderTextarea('推荐营销用语', `hall_slot_text_${slot}`, sc.recommendText, 300, true)}
              </div>`;
          }).join('')}
        </div>`;
    }

    if (channelId === 'ch_10086_popup') {
      return `
        <div class="form-grid channel-form-grid">
          ${renderPushMethod(prefix, cfg)}
          <div class="form-field">
            <label class="req">运营位</label>
            <select name="${prefix}_operationSlot" data-cfg-key="operationSlot">
              <option value="">请选择运营位</option>
              ${POPUP_SLOTS.map(o => `<option${cfg.operationSlot === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
            </select>
          </div>
          ${renderTextarea('营销用语', `${prefix}_marketingText`, cfg.marketingText, 300, true)}
          ${renderTextarea('短信模板', `${prefix}_smsTemplate`, cfg.smsTemplate, 300, true)}
          ${renderTextarea('客户群规则描述', `${prefix}_customerRule`, cfg.customerRule, 500, true)}
          ${renderTextarea('活动政策', `${prefix}_activityPolicy`, cfg.activityPolicy, 300, true)}
        </div>`;
    }

    return '<p class="muted">暂无配置项</p>';
  }

  function bindChannelConfigEvents() {
    const panel = document.querySelector(`[data-channel-panel="${activeChannelId}"]`);
    if (!panel) return;

    panel.querySelectorAll('[data-cfg-key]').forEach(el => {
      const key = el.dataset.cfgKey;
      const handler = () => {
        if (!channelConfigs[activeChannelId]) return;
        if (el.type === 'checkbox') channelConfigs[activeChannelId][key] = el.checked;
        else channelConfigs[activeChannelId][key] = el.value;
      };
      el.addEventListener('change', handler);
      if (el.tagName === 'TEXTAREA') el.addEventListener('input', handler);
    });

    panel.querySelectorAll(`input[name="${activeChannelId}_push"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked && channelConfigs[activeChannelId]) {
          channelConfigs[activeChannelId].pushMethod = radio.value;
        }
      });
    });

    panel.querySelectorAll('[data-counter]').forEach(ta => {
      ta.addEventListener('input', () => {
        const counter = panel.querySelector(`[data-counter-for="${ta.dataset.counter}"]`);
        if (counter) counter.textContent = `${ta.value.length}/${ta.maxLength}`;
        const m = ta.name.match(new RegExp(`^${activeChannelId}_(.+)$`));
        if (m && channelConfigs[activeChannelId]) channelConfigs[activeChannelId][m[1]] = ta.value;
        const hall = ta.name.match(/^hall_slot_text_(.+)$/);
        if (hall && channelConfigs[activeChannelId]) {
          const slot = hall[1];
          if (!channelConfigs[activeChannelId].slotConfigs) channelConfigs[activeChannelId].slotConfigs = {};
          if (!channelConfigs[activeChannelId].slotConfigs[slot]) channelConfigs[activeChannelId].slotConfigs[slot] = {};
          channelConfigs[activeChannelId].slotConfigs[slot].recommendText = ta.value;
        }
      });
    });

    panel.querySelectorAll('[data-slot-field]').forEach(el => {
      el.addEventListener('change', () => {
        const slot = el.dataset.slot;
        if (!channelConfigs[activeChannelId]) return;
        if (!channelConfigs[activeChannelId].slotConfigs) channelConfigs[activeChannelId].slotConfigs = {};
        if (!channelConfigs[activeChannelId].slotConfigs[slot]) channelConfigs[activeChannelId].slotConfigs[slot] = {};
        const field = el.dataset.slotField;
        channelConfigs[activeChannelId].slotConfigs[slot][field] = el.type === 'checkbox' ? el.checked : el.value;
      });
    });

    panel.querySelectorAll('.slot-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.slotTag;
        const cfg = channelConfigs[activeChannelId];
        if (!cfg) return;
        const slots = cfg.operationSlots || [];
        if (slots.includes(slot)) {
          cfg.operationSlots = slots.filter(s => s !== slot);
          delete (cfg.slotConfigs || {})[slot];
        } else {
          cfg.operationSlots = [...slots, slot];
          if (!cfg.slotConfigs) cfg.slotConfigs = {};
          cfg.slotConfigs[slot] = { recommendText: '' };
        }
        renderChannelTabsAndPanels();
      });
    });

    panel.querySelectorAll('[data-upload-trigger]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefix = btn.dataset.uploadTrigger;
        panel.querySelector(`#${prefix}_attachment`)?.click();
      });
    });
    panel.querySelectorAll('.channel-file-input').forEach(input => {
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        const name = file ? file.name : '';
        if (channelConfigs[activeChannelId]) {
          channelConfigs[activeChannelId].attachmentName = name;
        }
        const label = panel.querySelector(`[data-upload-name="${activeChannelId}"]`);
        if (label) label.textContent = name || '未选择文件';
      });
    });
  }

  let segmentPickEventsBound = false;

  function bindSegmentPickEvents() {
    const readonly = document.getElementById('strategy-segment-readonly');
    if (readonly && !readonly.dataset.segmentPickBound) {
      readonly.dataset.segmentPickBound = '1';
      readonly.addEventListener('click', e => {
        if (e.target.closest('#btn-open-segment-pick, #btn-change-segment')) {
          openSegmentPickModal();
        }
      });
    }
    if (segmentPickEventsBound) return;
    segmentPickEventsBound = true;
    document.getElementById('btn-segment-pick-search')?.addEventListener('click', applySegmentPickFilters);
    document.getElementById('btn-segment-pick-reset')?.addEventListener('click', resetSegmentPickModal);
    document.getElementById('btn-segment-pick-confirm')?.addEventListener('click', confirmSegmentPick);
    document.getElementById('segment-pick-kw')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') applySegmentPickFilters();
    });
  }

  function renderSegmentEmptyState() {
    return `
      <div class="strategy-segment-empty">
        <div class="strategy-segment-empty-icon"><i class="fas fa-users"></i></div>
        <h4>尚未选择客群</h4>
        <p class="muted">请从客群列表中选择一个目标客群。</p>
        <button type="button" class="btn btn-primary" id="btn-open-segment-pick">
          <i class="fas fa-list-check"></i> 选择客群
        </button>
      </div>`;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function collectChannelsFromForm() {
    return selectedChannelIds.map(id => {
      const ch = window.STRATEGY_CHANNEL_BY_ID?.[id] || { id, name: id };
      return {
        channelId: id,
        channelName: ch.name,
        displayLabel: ch.name,
        typeKey: id,
        typeLabel: ch.name,
        config: JSON.parse(JSON.stringify(channelConfigs[id] || {}))
      };
    });
  }

  function validateBeforeSubmit() {
    if (!selectedProducts.length) {
      window.alert('请选择一个主产品');
      return false;
    }
    if (!selectedChannelIds.length) {
      window.alert('请至少选择一个渠道');
      return false;
    }
    return true;
  }

  function getSegmentContextForSubmit() {
    if (!segmentCtx) return null;
    return {
      ...segmentCtx,
      refineTagRules: [],
      refineTags: []
    };
  }

  function fillSegment() {
    segmentCtx = typeof window.getStrategyCreateContext === 'function' ? window.getStrategyCreateContext() : null;
    const box = document.getElementById('strategy-segment-readonly');
    if (!box) return;

    if (!segmentCtx) {
      box.innerHTML = renderSegmentEmptyState();
      bindSegmentPickEvents();
      return;
    }

    box.innerHTML = `
      <div class="strategy-segment-card">
        <div class="strategy-segment-detail">
          <div class="strategy-seg-row strategy-seg-row-name">
            <span class="k">客群名称</span>
            <strong>${esc(segmentCtx.segmentName || '—')}</strong>
            <button type="button" class="btn btn-outline btn-sm" id="btn-change-segment"><i class="fas fa-rotate"></i> 更换客群</button>
          </div>
          <div class="strategy-seg-row"><span class="k">客群来源</span><strong>${esc(segmentSourceLabel(segmentCtx.segmentSource))}</strong></div>
          <div class="strategy-seg-row"><span class="k">客群规模</span><strong>${esc(segmentCtx.scaleLabel || '—')}</strong></div>
        </div>
      </div>`;

    bindSegmentPickEvents();

    const nameInput = document.getElementById('strategy-name');
    if (nameInput && !nameInput.value) {
      nameInput.value = (segmentCtx.segmentName || '客群') + '·江西专项策略';
    }
  }

  function loadDraftForEdit(id) {
    const s = window.JxStrategyStore?.getStrategy(id);
    if (!s) return;
    editingStrategyId = id;
    segmentCtx = {
      segmentName: s.segment,
      scaleLabel: s.scaleLabel,
      sourceMetric: s.sourceMetric || '',
      metricValue: s.metricValue || '',
      metricMom: s.metricMom || '',
      metricYoy: s.metricYoy || ''
    };
    fillSegment();

    const form = document.getElementById('strategy-create-form');
    if (!form) return;
    form.querySelector('[name="strategyName"]').value = s.name || '';
    form.querySelector('[name="strategyType"]').value = s.type || '';
    const period = (s.period || '').split('~').map(x => x.trim());
    if (period[0]) form.querySelector('[name="startDate"]').value = period[0];
    if (period[1]) form.querySelector('[name="endDate"]').value = period[1];
    form.querySelector('[name="strategyDesc"]').value = s.strategyDesc || '';
    if (s.groupScene) form.querySelector('[name="groupScene"]').value = s.groupScene;
    if (s.operationScene) form.querySelector('[name="operationScene"]').value = s.operationScene;
    if (s.activityType) form.querySelector('[name="activityType"]').value = s.activityType;
    if (s.activityGoal) form.querySelector('[name="activityGoal"]').value = s.activityGoal;

    if (s.products?.length) {
      selectedProducts = s.products.slice(0, 1);
    } else if (s.product) {
      selectedProducts = (window.STRATEGY_PRODUCT_CATALOG || []).filter(p => p.name === s.product);
    }
    renderSelectedProducts();

    const chs = s.channels || [];
    selectedChannelIds = chs.map(ch => ch.channelId || ch.typeKey).filter(Boolean);
    channelConfigs = {};
    chs.forEach(ch => {
      const id = ch.channelId || ch.typeKey;
      channelConfigs[id] = ch.config || defaultChannelConfig(id);
    });
    activeChannelId = selectedChannelIds[0] || null;
    renderChannelTabsAndPanels();
  }

  function getReturnUrl() {
    try {
      const ref = document.referrer;
      if (ref && !ref.includes('strategy-create')) return ref;
    } catch (e) { /* ignore */ }
    return 'strategy-category.html?tab=segment';
  }

  function markCreateSuccessAndGo() {
    try { sessionStorage.setItem('jxStrategyCreateSuccess', '1'); } catch (e) { /* ignore */ }
    window.location.href = getReturnUrl();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('strategy-create-form')) return;

    if (window.CustomerSegmentStore?.importFromDispatchRecords) {
      window.CustomerSegmentStore.importFromDispatchRecords();
    }

    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');

    if (editId && window.JxStrategyStore) {
      loadDraftForEdit(editId);
    } else {
      if (params.get('pick') === '1' && typeof window.clearStrategyCreateContext === 'function') {
        window.clearStrategyCreateContext();
      }
      fillSegment();
      renderSelectedProducts();
      renderChannelTabsAndPanels();
    }

    bindSegmentPickEvents();
    if (!editId && params.get('pick') === '1' && !segmentCtx) {
      openSegmentPickModal();
    }

    document.getElementById('btn-open-product-picker')?.addEventListener('click', openProductPickerModal);
    document.getElementById('btn-product-picker-confirm')?.addEventListener('click', confirmProductPicker);
    document.getElementById('product-picker-kw')?.addEventListener('input', e => {
      productPickerKw = e.target.value;
      productPickerPage = 1;
      renderProductPickerTable();
    });
    document.getElementById('btn-open-channel-picker')?.addEventListener('click', openChannelPickerModal);
    document.getElementById('btn-channel-picker-confirm')?.addEventListener('click', confirmChannelPicker);
    document.getElementById('btn-strategy-draft')?.addEventListener('click', () => {
      const ctx = getSegmentContextForSubmit();
      if (!ctx) {
        window.alert('请先选择客群');
        return;
      }
      if (!validateBeforeSubmit()) return;
      const form = document.getElementById('strategy-create-form');
      const fd = new FormData(form);
      const channels = collectChannelsFromForm();
      window.JxStrategyStore?.saveDraftFromForm(fd, ctx, channels, selectedProducts, editingStrategyId || undefined);
      alert('草稿已保存');
      window.location.href = 'strategy-category.html?tab=segment';
    });

    document.getElementById('strategy-create-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target;
      const ctx = getSegmentContextForSubmit();
      if (!ctx) {
        window.alert('请先选择客群');
        return;
      }
      if (!validateBeforeSubmit()) return;
      const fd = new FormData(form);
      const channels = collectChannelsFromForm();
      const record = window.JxStrategyStore?.createStrategyFromForm(
        fd, ctx, channels, selectedProducts, editingStrategyId || undefined
      );
      if (record) markCreateSuccessAndGo();
    });
  });
})();
