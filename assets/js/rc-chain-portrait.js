/** 根因链路 · 客群画像分析弹窗 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const CONTRIB_TIP_TAG = '标签贡献度：从标签维度衡量该标签对指标异常的解释力，各标签贡献度之和不必等于 100%，可能存在多个标签共同解释异常。';
  const TAG_LIST_TOP_N = 10;
  const HINT_TAG_LIST = '通过分析1025个标签，结合标签覆盖率、路径深度、指标权重和路径权重进行融合校正，得到最终全局标签贡献度及排名计算单指标贡献度并选出 Top10。';
  const HINT_TAG_COMBO = '结合Top10标签，逐层识别异常客群中贡献度较高的标签及其组合关系，最终汇总形成该根因链路的异动客群。';

  function renderSectionHint(text) {
    return `<p class="rc-portrait-section-hint rc-portrait-section-hint--head muted">${esc(text)}</p>`;
  }

  function renderContribTh(label, tip) {
    return `<span class="rc-portrait-contrib-th">${esc(label)}<span class="icon-caliber-wrap rc-portrait-contrib-tip" tabindex="0" aria-label="贡献度说明"><i class="fas fa-circle-info"></i><span class="tooltip-caliber">${esc(tip)}</span></span></span>`;
  }

  function contribBar(pct) {
    const w = Math.min(100, Math.max(0, pct));
    return `
      <div class="rc-portrait-contrib-bar" aria-hidden="true">
        <span class="rc-portrait-contrib-fill" style="width:${w}%"></span>
      </div>`;
  }

  function renderTagTable(tags) {
    if (!tags?.length) {
      return '<p class="muted rc-portrait-empty">暂无标签数据</p>';
    }
    const sorted = [...tags].sort((a, b) => (b.contribution || 0) - (a.contribution || 0));
    const topTags = sorted.slice(0, TAG_LIST_TOP_N);
    return `
      <div class="table-scroll rc-portrait-table-wrap">
        <table class="data-table rc-portrait-tag-table">
          <thead>
            <tr>
              <th style="width:140px">标签ID</th>
              <th>标签名称</th>
              <th style="width:140px">${renderContribTh('标签贡献度', CONTRIB_TIP_TAG)}</th>
            </tr>
          </thead>
          <tbody>
            ${topTags.map(t => `
              <tr>
                <td><code class="rc-portrait-tag-id">${esc(t.tagId || '—')}</code></td>
                <td><strong>${esc(t.name || '—')}</strong></td>
                <td>
                  <span class="rc-portrait-table-contrib">${t.contribution ?? '—'}%</span>
                  ${contribBar(t.contribution || 0)}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderRelationParts(parts) {
    if (!parts?.length) return '<span class="muted">—</span>';
    return `<span class="rc-portrait-combo-expr">${parts.map(p => {
      if (p.type === 'join') {
        const label = p.op === 'OR' ? '或' : '且';
        return `<span class="rc-portrait-combo-op${p.op === 'OR' ? ' is-or' : ' is-and'}" aria-label="${label}">${label}</span>`;
      }
      if (p.type === 'raw') {
        return `<span class="rc-portrait-combo-tag">${esc(p.text)}</span>`;
      }
      return `<span class="rc-portrait-combo-tag">${esc(p.tagName)} = ${esc(p.value)}</span>`;
    }).join('')}</span>`;
  }

  function renderComboTable(combinations) {
    const rows = combinations?.rows || [];
    if (!rows.length) {
      return '<p class="muted rc-portrait-empty">暂无标签组合数据</p>';
    }
    const totalLabel = combinations.totalScaleLabel || '—';

    return `
      <div class="table-scroll rc-portrait-table-wrap">
        <table class="data-table rc-portrait-combo-table">
          <thead>
            <tr>
              <th>标签取值关系</th>
              <th style="width:140px">客群人数</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${renderRelationParts(r.relationParts)}</td>
                <td><strong>${esc(r.scaleLabel || '—')}</strong></td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="rc-portrait-combo-total">
              <td><strong>合计</strong></td>
              <td><strong>${esc(totalLabel)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  }

  function renderComboSection(combinations) {
    return `
      <section class="rc-portrait-section">
        <h4 class="rc-portrait-section-title"><i class="fas fa-link"></i> 标签组合</h4>
        ${renderSectionHint(HINT_TAG_COMBO)}
        ${renderComboTable(combinations)}
      </section>`;
  }

  window.openRcChainPortraitModal = function (branch) {
    if (!branch) return;
    const seg = branch.segment || {};
    let portrait = branch.portrait || {};
    if (typeof window.buildRcBranchPortraitData === 'function') {
      portrait = window.buildRcBranchPortraitData(branch);
    }
    const titleEl = document.getElementById('rc-portrait-modal-title');
    const subEl = document.getElementById('rc-portrait-modal-subtitle');
    const bodyEl = document.getElementById('rc-portrait-modal-body');
    if (!bodyEl) return;

    if (titleEl) titleEl.textContent = '画像分析 · ' + (seg.name || '链路客群');
    if (subEl) {
      subEl.textContent = `链路 ${branch.rank || '—'} · 规模 ${seg.scaleLabel || seg.scale || '—'} · 贡献 ${branch.contrib || '—'}%`;
    }

    bodyEl.innerHTML = `
      <div class="rc-portrait-layout">
        <section class="rc-portrait-section">
          <h4 class="rc-portrait-section-title"><i class="fas fa-tags"></i> 标签列表</h4>
          ${renderSectionHint(HINT_TAG_LIST)}
          ${renderTagTable(portrait.tags)}
        </section>
        ${renderComboSection(portrait.combinations)}
      </div>`;

    if (typeof openModal === 'function') openModal('modal-rc-chain-portrait');
  };
})();
