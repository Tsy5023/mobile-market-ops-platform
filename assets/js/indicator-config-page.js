/** 指标配置 · 指标库列表（只读详情） */

(function () {

  const PAGE_SIZE = window.TablePagination?.DEFAULT_PAGE_SIZE || 10;



  const ALGORITHM_SCENE_OPTIONS = [

    { value: 'traffic_rca', label: '流量运营根因分析' },

    { value: 'loss_control_rca', label: '控损运营根因分析' }

  ];



  const SCENE_LABEL_MAP = Object.fromEntries(

    ALGORITHM_SCENE_OPTIONS.map(o => [o.value, o.label])

  );



  const FORMAT_LABELS = { numeric: '数值', percent: '百分比', enum: '枚举' };



  const METRIC_DETAIL_SAMPLES = {

    KPI_FL_REV_001: {

      name: '流量总收入', code: 'KPI_FL_REV_001',

      period: '日', format: 'numeric',

      algorithmScenes: ['traffic_rca'],

      caliberBiz: '套餐内+套外+流量包收入合计',

      caliberTech: 'SELECT SUM(rev_total_amt) FROM dm_kpi_daily WHERE stat_date = ${biz_date}',

      desc: '流量运营核心收入指标，用于收入监控与根因分析。',

      warehouseTime: '2026-03-10 09:00:00',

      updatedAt: '2026-05-18 14:35:00'

    },

    KPI_CUS_CHURN_003: {

      name: '离网率', code: 'KPI_CUS_CHURN_003',

      period: '月', format: 'percent',

      algorithmScenes: ['loss_control_rca'],

      caliberBiz: '当月离网客户数/月初在网客户数×100%',

      caliberTech: 'churn_cnt / open_cnt * 100',

      desc: '离网维系场景核心监控指标。',

      warehouseTime: '2026-02-15 11:20:00',

      updatedAt: '2026-05-12 16:08:00'

    },

    KPI_LEGACY_088: {

      name: '2G流量收入（旧）', code: 'KPI_LEGACY_088',

      period: '日', format: 'numeric',

      algorithmScenes: [],

      caliberBiz: '已下线口径',

      caliberTech: '—',

      desc: '历史2G流量收入指标，已停用。',

      warehouseTime: '2024-08-01 10:00:00',

      updatedAt: '2026-01-10 09:30:00'

    }

  };



  if (window.DEMO_METRIC_EDIT_SAMPLES) {

    Object.assign(METRIC_DETAIL_SAMPLES, window.DEMO_METRIC_EDIT_SAMPLES);

  }



  let page = 1;



  function esc(s) {

    return String(s == null ? '' : s)

      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  }



  function normalizeStatus(status) {

    return status === 'disabled' ? 'disabled' : 'published';

  }



  function setRadio(name, value) {

    const el = document.querySelector(`input[name="${name}"][value="${value}"]`);

    if (el) el.checked = true;

  }



  function formatAlgorithmScenes(scenes) {

    const list = Array.isArray(scenes) ? scenes : [];

    if (!list.length) return '<span class="ic-algo-empty">—</span>';

    return list.map(v => {

      const label = SCENE_LABEL_MAP[v] || v;

      return `<span class="ic-algo-tag">${esc(label)}</span>`;

    }).join('');

  }



  function algorithmScenesText(scenes) {

    const list = Array.isArray(scenes) ? scenes : [];

    if (!list.length) return '—';

    return list.map(v => SCENE_LABEL_MAP[v] || v).join('、');

  }



  function fillDetailForm(data) {

    if (!data) return;

    const set = (id, val) => {

      const el = document.getElementById(id);

      if (el) el.value = val == null ? '' : val;

    };

    set('f-name', data.name);

    set('f-code', data.code);

    if (data.period) setRadio('period', data.period);

    if (data.format) setRadio('format', data.format);

    set('f-algorithm-scenes', algorithmScenesText(data.algorithmScenes));

    set('f-caliber-biz', data.caliberBiz);

    set('f-caliber-tech', data.caliberTech);

    set('f-desc', data.desc);

    set('f-warehouse-time', data.warehouseTime);

    set('f-updated-at', data.updatedAt);

  }



  function defaultDetailFromRow(code, libRow) {

    const name = libRow?.name || code;

    const approve = window.DEMO_APPROVE_DETAIL?.[code];

    return {

      name,

      code,

      period: libRow?.period || '月',

      format: libRow?.format || (/率/.test(name) ? 'percent' : 'numeric'),

      algorithmScenes: libRow?.algorithmScenes || [],

      caliberBiz: libRow?.caliberBiz || approve?.caliber || '—',

      caliberTech: libRow?.caliberTech || '—',

      desc: libRow?.desc || `${name}指标说明`,

      warehouseTime: libRow?.warehouseTime || '—',

      updatedAt: libRow?.updatedAt || '—'

    };

  }



  window.openMetricDetailModal = function (code) {

    const title = document.getElementById('detail-modal-title');

    if (title) title.textContent = '指标详情';

    const libRow = (window.DEMO_METRIC_LIBRARY || []).find(r => r.code === code);

    const data = METRIC_DETAIL_SAMPLES[code] || defaultDetailFromRow(code, libRow);

    fillDetailForm(data);

    if (typeof openModal === 'function') openModal('modal-metric-detail');

  };



  function getAllRows() {

    return (window.DEMO_METRIC_LIBRARY || []).map(r => ({

      ...r,

      status: normalizeStatus(r.status)

    }));

  }



  function getFilteredRows() {

    const q = (document.getElementById('search-metric')?.value || '').trim().toLowerCase();

    const statusFilter = document.getElementById('filter-metric-status')?.value || '';

    const sceneFilter = document.getElementById('filter-algorithm-scene')?.value || '';



    return getAllRows().filter(row => {

      const hay = (row.code + row.name).toLowerCase();

      if (q && !hay.includes(q)) return false;

      if (statusFilter && row.status !== statusFilter) return false;

      if (sceneFilter) {

        const scenes = Array.isArray(row.algorithmScenes) ? row.algorithmScenes : [];

        if (!scenes.includes(sceneFilter)) return false;

      }

      return true;

    });

  }



  function statusBadge(status) {

    const st = normalizeStatus(status);

    return st === 'disabled'

      ? '<span class="badge" style="background:#f1f5f9;color:#64748b">已停用</span>'

      : '<span class="badge badge-success">已发布</span>';

  }



  function renderPagination(total) {

    if (!window.TablePagination) return;

    const result = TablePagination.render('metric-table-pagination', {

      total,

      page,

      pageSize: PAGE_SIZE,

      onPageChange: nextPage => {

        page = nextPage;

        renderMetricLibraryTable();

      }

    });

    page = result.page;

  }



  window.renderMetricLibraryTable = function () {

    const tbody = document.querySelector('#metric-table tbody');

    if (!tbody) return;



    const filtered = getFilteredRows();

    const pageRows = TablePagination

      ? TablePagination.slice(filtered, page, PAGE_SIZE)

      : filtered;



    if (!pageRows.length) {

      tbody.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">暂无匹配指标</td></tr>';

      renderPagination(filtered.length);

      return;

    }



    tbody.innerHTML = pageRows.map(row => `

      <tr data-status="${row.status}" data-algorithm-scenes="${esc((row.algorithmScenes || []).join(','))}">

        <td><code class="id-chip">${esc(row.code)}</code></td>

        <td><strong>${esc(row.name)}</strong></td>

        <td>${esc(row.period || '—')}</td>

        <td>${esc(FORMAT_LABELS[row.format] || row.format || '—')}</td>

        <td class="ic-algo-scenes-cell">${formatAlgorithmScenes(row.algorithmScenes)}</td>

        <td>${esc(row.warehouseTime || '—')}</td>

        <td>${statusBadge(row.status)}</td>

        <td class="ic-col-ops"><button type="button" class="ic-detail-btn" onclick="openMetricDetailModal('${esc(row.code)}')">详情</button></td>

      </tr>`).join('');



    renderPagination(filtered.length);

  };



  window.filterMetricLibraryTable = function () {

    page = 1;

    renderMetricLibraryTable();

  };



  document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('filter-metric-status')?.addEventListener('change', () => {

      page = 1;

      renderMetricLibraryTable();

    });

    document.getElementById('filter-algorithm-scene')?.addEventListener('change', () => {

      page = 1;

      renderMetricLibraryTable();

    });

    renderMetricLibraryTable();

  });

})();

