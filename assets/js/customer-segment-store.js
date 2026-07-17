/** 客群管理存储：静态种子 + 客群调度下发同步 */
(function () {
  const KEY = 'jxCustomerDispatchSegments';
  const IMPORT_KEY = 'jxCustomerDispatchImportedIds';
  const SCHEMA_VER = 'jxCustomerSegmentStoreV1';

  window.SEGMENT_SOURCE_MAP = {
    ai: { label: 'AI根因生成', cls: 'badge-source-ai' },
    dispatch: { label: '客群调度', cls: 'badge-source-dispatch' }
  };

  function todayStr() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseScaleNumber(label) {
    const m = String(label || '').replace(/,/g, '').match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function wrapSegment(row) {
    const fn = window.seg || function (r) {
      return {
        relatedMetrics: (r.metrics || []).map(m => m.name).join('、') || '—',
        relatedTags: (r.tags || []).map(t => t.name).join('、') || '—',
        ...r
      };
    };
    return fn(row);
  }

  function readDispatchSegments() {
    try {
      if (localStorage.getItem('jxCustomerSegmentSchema') !== SCHEMA_VER) return [];
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeDispatchSegments(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem('jxCustomerSegmentSchema', SCHEMA_VER);
    } catch (e) { /* ignore */ }
  }

  function readImportedIds() {
    try {
      const raw = localStorage.getItem(IMPORT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function markImported(dispatchId) {
    const ids = readImportedIds();
    if (!ids.includes(dispatchId)) {
      ids.push(dispatchId);
      try { localStorage.setItem(IMPORT_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
    }
  }

  function buildDispatchSegmentId(dispatchId, scopeId) {
    const safe = String(dispatchId || 'DP').replace(/[^A-Za-z0-9]/g, '').slice(-12);
    return `SCDP-${safe}-${scopeId}`;
  }

  function buildDispatchSegmentRow(record, region, subTask) {
    const scopeId = region.countyId || region.cityId;
    const scopeName = region.countyName || region.cityName;
    const cityName = region.cityName || '';
    const metricName = record.metricName || record.sourceMetric || '—';
    const metricValue = record.metricValue || '—';
    const metricMom = record.metricMom || '—';
    const drillPath = record.drillPath || '江西省';
    const due = (record.workOrderDueAt || '').split('T')[0] || '—';

    return wrapSegment({
      id: buildDispatchSegmentId(record.id, scopeId),
      name: `${record.segmentName || '异动客群'} · ${scopeName}`,
      bizCaliber: `客群调度下发（${drillPath}），关联指标「${metricName}」`,
      effectiveDate: (record.dispatchedAt || todayStr()).slice(0, 10),
      expiryDate: due,
      status: 'active',
      source: 'dispatch',
      scaleLabel: region.scaleLabel || record.scaleLabel || '—',
      scaleNum: parseScaleNumber(region.scaleLabel || record.scaleLabel),
      dispatchTaskId: record.id,
      dispatchSubTaskId: subTask?.id || '',
      regionScope: {
        cityId: region.cityId || '',
        cityName: region.cityName || cityName,
        countyId: region.countyId || '',
        countyName: region.countyName || ''
      },
      metrics: [{
        code: record.metricId || '—',
        name: metricName,
        value: metricValue,
        mom: metricMom,
        yoy: '—',
        tagValue: scopeName
      }],
      tags: [
        { name: '调度范围', value: scopeName },
        { name: '客群占比', value: region.proportion || '—' }
      ]
    });
  }

  function segmentSortRank(row) {
    if (row.showcase && row.source === 'ai') return 0;
    if (row.showcase && row.source === 'dispatch') return 1;
    if (row.source === 'dispatch') return 2;
    if (row.source === 'ai') return 3;
    return 4;
  }

  function sortForDisplay(list) {
    return [...list].sort((a, b) => {
      const ra = segmentSortRank(a);
      const rb = segmentSortRank(b);
      if (ra !== rb) return ra - rb;
      return String(b.effectiveDate || '').localeCompare(String(a.effectiveDate || ''), 'zh-CN');
    });
  }

  function mergeAll() {
    const staticSeed = (window.CUSTOMER_SEGMENT_STATIC_SEED || window.CUSTOMER_SEGMENT_LIST || []).map(wrapSegment);
    const dispatchRows = readDispatchSegments().map(wrapSegment);
    const map = new Map();
    staticSeed.forEach(r => map.set(r.id, r));
    dispatchRows.forEach(r => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    const merged = sortForDisplay([...map.values()]);
    window.CUSTOMER_SEGMENT_LIST = merged;
    return merged;
  }

  window.CustomerSegmentStore = {
    getAll() {
      return mergeAll();
    },

    reload() {
      return mergeAll();
    },

    sourceLabel(source) {
      return window.SEGMENT_SOURCE_MAP[source]?.label || source || '—';
    },

    sourceBadge(source) {
      const m = window.SEGMENT_SOURCE_MAP[source] || window.SEGMENT_SOURCE_MAP.ai;
      return `<span class="${m.cls}">${m.label}</span>`;
    },

    syncFromDispatch(record) {
      if (!record || record.dispatchMode !== 'segment') return [];
      const list = readDispatchSegments().filter(r => r.dispatchTaskId !== record.id);
      const subs = record.subTasks || [];
      const created = (record.regions || []).map(region => {
        const scopeId = region.countyId || region.cityId;
        const sub = subs.find(st => st.scopeId === scopeId);
        return buildDispatchSegmentRow(record, region, sub);
      });
      writeDispatchSegments([...list, ...created]);
      markImported(record.id);
      return this.reload();
    },

    importFromDispatchRecords() {
      if (!window.MetricDispatchStore?.getAll) return this.reload();
      const imported = new Set(readImportedIds());
      window.MetricDispatchStore.getAll()
        .filter(r => r.dispatchMode === 'segment' && !imported.has(r.id))
        .forEach(r => this.syncFromDispatch(r));
      return this.reload();
    }
  };

  if (typeof window.seg === 'undefined' && window.CUSTOMER_SEGMENT_STATIC_SEED) {
    window.CUSTOMER_SEGMENT_LIST = window.CUSTOMER_SEGMENT_STATIC_SEED.map(wrapSegment);
  }
  window.CustomerSegmentStore.importFromDispatchRecords();
})();
