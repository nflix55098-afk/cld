/* ===================== 3. Таймлайн ===================== */

const tlState = { range: 'aug', group: 'feature', hideDone: false };
const TL_RANGES = {
  jun: { label: 'Июн – дек', from: '01.06.2026', to: '31.12.2026' },
  aug: { label: 'Авг – дек', from: '01.08.2026', to: '31.12.2026' },
  oct: { label: 'Окт – дек', from: '01.10.2026', to: '31.12.2026' },
};
const PHASE = {
  prep: { name: 'Подготовка', css: 'background:#c3c2b7;height:6px;top:15px' },
  enabling: { name: 'Включение', css: 'background:var(--st-enabling)' },
  collecting: { name: 'Сбор данных', css: 'background:var(--st-collecting)' },
  overdue: { name: 'Сверх плана', css: 'background:repeating-linear-gradient(45deg,#d03b3b 0 3px,#f2c4c4 3px 6px)' },
  ready: { name: 'Анализ и решение', css: 'background:var(--st-ready)' },
  rollout: { name: 'Раскатка решения', css: 'background:var(--st-rollout)' },
  cleanup: { name: 'Чистка тоглов', css: 'background:var(--st-cleanup)' },
  pilot: { name: 'Пилот (без АБ)', css: 'background:repeating-linear-gradient(45deg,#6250d6 0 3px,#d9d4f6 3px 6px)' },
  plan: { name: 'План', css: 'background:rgba(42,120,214,.12);box-shadow:inset 0 0 0 1px rgba(42,120,214,.55)' },
  planroll: { name: 'План раскатки', css: 'background:rgba(27,175,122,.14);box-shadow:inset 0 0 0 1px rgba(27,175,122,.7)' },
};

function phasesOf(e) {
  const P = []; const T = TODAY;
  const push = (k, from, to) => { if (from && to && to > from) P.push({ k, from, to }); };
  if (e.type === 'rollout') {
    if (e.stage === 'prep' || e.pilot) push('prep', e.d.created, e.pilot ? D(e.pilot.since) : T);
    if (e.pilot) push('pilot', D(e.pilot.since), e.d.rolloutStart || T);
    push('rollout', e.d.rolloutStart, e.d.rolloutDoneAt || T);
    if (!e.d.rolloutDoneAt && e.nextPlan) { const last = Object.values(e.plan).reduce((m, p) => (p.d > m ? p.d : m), T); push('planroll', T, last); }
    push('cleanup', e.d.rolloutDoneAt, e.d.cleanupDoneAt || T);
    return P;
  }
  if (e.stage === 'prep') { push('prep', e.d.created, T); return P; }
  if (e.stage === 'release') { push('prep', e.d.created, T); push('plan', e.d.plannedStart, addDays(e.d.plannedStart, e.planDays)); return P; }
  push('enabling', e.d.enableStart, e.d.fullAt || T);
  if (e.d.fullAt) {
    if (e.type === 'holdout') { push('collecting', e.d.fullAt, T); push('plan', T, e.planEnd); }
    else {
      const endC = e.d.platformEnd || (e.decision ? D(e.decision.d) : T);
      const pe = e.planEnd;
      push('collecting', e.d.fullAt, endC < pe ? endC : pe);
      if (endC > pe) push('overdue', pe, endC);
      if (e.d.platformEnd) push('ready', e.d.platformEnd, e.decision ? D(e.decision.d) : T);
      if (e.stage === 'collecting') push('plan', T, pe);
    }
  } else if (e.stage === 'enabling' && e.nextPlan) {
    const last = Object.values(e.plan).reduce((m, p) => (p.d > m ? p.d : m), T);
    push('plan', T, last);
  }
  if (e.decision && (e.d.rolloutDoneAt || e.stage === 'rollout')) {
    push('rollout', D(e.decision.d), e.d.rolloutDoneAt || T);
    if (!e.d.rolloutDoneAt) { const last = Object.values(e.plan).reduce((m, p) => (p.d > m ? p.d : m), T); push('planroll', T, last); }
  }
  if (e.d.rolloutDoneAt && e.type !== 'rollout') push('cleanup', e.d.rolloutDoneAt, e.d.cleanupDoneAt || T);
  if (e.stage === 'done' && !e.d.rolloutDoneAt && e.d.cleanupDoneAt && e.decision) push('cleanup', D(e.decision.d), e.d.cleanupDoneAt);
  return P;
}

function renderTimeline(root) {
  const S = tlState; const R = TL_RANGES[S.range];
  const R0 = D(R.from), R1 = D(R.to); const span = days(R0, R1);
  const x = (d) => Math.max(0, Math.min(100, (days(R0, d) / span) * 100));
  let list = EXPERIMENTS.filter((e) => !(S.hideDone && e.stage === 'done'));

  let groups;
  if (S.group === 'stage') groups = STAGES.map((s) => ({ key: s.k, title: s.name, color: s.color, items: list.filter((e) => e.stage === s.k) })).filter((g) => g.items.length);
  else if (S.group === 'feature') {
    const fids = [...new Set(list.map((e) => e.fid))];
    const urgency = (fid) => Math.min(...list.filter((e) => e.fid === fid).map((e) => (e.stage === 'done' ? 99 : STAGE[e.stage].i)));
    fids.sort((a, b) => urgency(a) - urgency(b));
    const multi = fids.filter((fid) => list.filter((e) => e.fid === fid).length > 1);
    const single = fids.filter((fid) => !multi.includes(fid));
    groups = multi.map((fid) => { const f = FEATURES[fid]; return { key: fid, feature: f, title: f.name, items: list.filter((e) => e.fid === fid) }; });
    if (single.length) groups.push({ key: 'single', title: 'Фичи с одним тестом в работе', items: single.flatMap((fid) => list.filter((e) => e.fid === fid)), keepOrder: true });
  } else {
    const rels = [...new Set(list.map((e) => e.release))].sort();
    groups = rels.map((r) => ({ key: r, title: `Релиз ${r}`, items: list.filter((e) => e.release === r) }));
  }
  groups.forEach((g) => !g.keepOrder && g.items.sort((a, b) => (a.d.enableStart || a.d.created || a.d.plannedStart) - (b.d.enableStart || b.d.created || b.d.plannedStart)));

  // месяцы и недели
  const months = []; let m = new Date(R0.getFullYear(), R0.getMonth(), 1);
  while (m <= R1) { const nx = new Date(m.getFullYear(), m.getMonth() + 1, 1); months.push({ from: m < R0 ? R0 : m, to: nx > R1 ? R1 : nx, name: MON_FULL[m.getMonth()] }); m = nx; }
  const weeks = []; let w = new Date(R0); while (w.getDay() !== 1) w = addDays(w, 1);
  while (w < R1) { weeks.push(w); w = addDays(w, 7); }

  const releases = RELEASES.map((r) => ({ ...r, _d: D(r.d) })).filter((r) => r._d >= R0 && r._d <= R1);

  const row = (e) => {
    const ph = phasesOf(e);
    const bars = ph.map((p) => {
      if (p.to < R0 || p.from > R1) return '';
      const l = x(p.from), r = x(p.to);
      const clipL = p.from < R0;
      const tip = `<b>${PHASE[p.k].name}</b><br>${fmt(p.from, true)} – ${fmt(p.to, true)} · ${dn(days(p.from, p.to))}`;
      return `<span class="ph" style="left:calc(${l}% + 1px);width:calc(${Math.max(r - l, 0.3)}% - 2px);${PHASE[p.k].css};${clipL ? 'border-top-left-radius:0;border-bottom-left-radius:0' : ''}" data-tip="${tip}"></span>`;
    }).join('');
    const flag = e.lookAt && e.type === 'ab' && e.lookAt >= R0 && e.lookAt <= R1 && !['done'].includes(e.stage)
      ? `<span class="flag" style="left:${x(e.lookAt)}%" data-tip="<b>Можно смотреть результаты</b><br>с ${fmt(e.lookAt, true)}<br><span class='tmuted'>минимум ${dn(e.minDays)} и 100% выборки</span>">${ICON.flag}</span>` : '';
    const byF = S.group === 'feature' && featureOf(e).tests.length > 1;
    const name = byF ? e.label : e.short;
    const sev = e.alerts.find((a) => ['crit', 'serious', 'warn'].includes(a.sev));
    return `<div class="tl-row">
      <div class="tl-lab" ${byF ? 'style="padding-left:28px"' : ''}><a href="#" data-open="${e.id}" class="tl-name" title="${esc(e.short)}">${esc(name)}</a>
        <div class="row small muted" style="gap:6px">${sev ? sevIcon(sev.sev) : ''}<span>${e.tag}</span>${S.group !== 'stage' ? stageDot(e.stage) + `<span>${STAGE[e.stage].name}</span>` : `<span>· ${e.release}</span>`}${e.type === 'rollout' ? '<span>· без АБ</span>' : ''}${!byF && pastOf(featureOf(e)).length ? `<span title="Прошлые итерации фичи">· +${pastOf(featureOf(e)).length} в истории</span>` : ''}</div></div>
      <div class="tl-plot">${bars}${flag}</div>
    </div>`;
  };

  // загрузка по неделям: сколько АБ одновременно в эфире
  const live = (e, a, b) => {
    if (e.type === 'rollout') return false;
    let s = e.d.enableStart || e.d.plannedStart; if (!s) return false;
    let f = e.d.platformEnd || (e.decision ? D(e.decision.d) : null) || (e.type === 'holdout' ? e.planEnd : null) || e.planEnd || addDays(TODAY, 21);
    if (e.stage === 'ready' && !e.d.platformEnd && !e.decision) f = addDays(TODAY, 7);
    return s < b && f > a;
  };
  const load = weeks.map((wk) => ({ wk, n: EXPERIMENTS.filter((e) => live(e, wk, addDays(wk, 7))).length, future: wk > TODAY }));
  const maxN = Math.max(...load.map((l) => l.n), 1);
  const yMax = Math.ceil(maxN / 2) * 2;

  root.innerHTML = `${appHead()}
  <style>
    .tl { background: var(--surface); border-radius: var(--r); box-shadow: var(--shadow); }
    .tl-head { border-radius: var(--r) var(--r) 0 0; }
    .tl-head, .tl-row, .tl-grp, .tl-chart { display: grid; grid-template-columns: 300px 1fr; }
    .tl-head { position: sticky; top: 48px; z-index: 5; background: var(--surface-2); border-bottom: 1px solid var(--line); }
    .tl-head .tl-lab { padding: 10px 16px; font-size: 12px; color: var(--muted); font-weight: 600; }
    .tl-axis { position: relative; height: 58px; }
    .tl-axis .mo { position: absolute; top: 6px; font-size: 12px; font-weight: 600; color: var(--ink-2); padding-left: 6px; border-left: 1px solid var(--line-2); height: 50px; }
    .tl-axis .rel { position: absolute; bottom: 3px; transform: translateX(-50%); font-size: 10.5px; color: var(--ink-2); background: var(--surface); border-radius: 4px; padding: 0 4px; box-shadow: inset 0 0 0 1px var(--line-2); white-space: nowrap; }
    .tl-axis .today { position: absolute; top: 22px; transform: translateX(-50%); font-size: 10.5px; color: #fff; background: #141413; border-radius: 4px; padding: 0 5px; white-space: nowrap; z-index: 2; }
    .tl-body { position: relative; }
    .tl-grid { position: absolute; top: 0; bottom: 0; left: 300px; right: 0; pointer-events: none; }
    .tl-grid .vl { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line); }
    .tl-grid .vr { position: absolute; top: 0; bottom: 0; width: 1px; background: #c9c8c0; }
    .tl-grid .vt { position: absolute; top: 0; bottom: 0; width: 2px; background: #141413; margin-left: -1px; z-index: 3; }
    .tl-grp { background: var(--surface-2); border-bottom: 1px solid var(--line); border-top: 1px solid var(--line); }
    .tl-grp > div:first-child { padding: 8px 16px; font-size: 12.5px; font-weight: 650; display: flex; align-items: center; gap: 8px; }
    .tl-row { border-bottom: 1px solid var(--line); min-height: 46px; }
    .tl-row:hover { background: #fbfbf9; }
    .tl-lab { padding: 6px 16px; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .tl-lab .row { flex-wrap: wrap; row-gap: 0; } .tl-lab .row span { white-space: nowrap; }
    .tl-name { color: var(--ink); font-weight: 550; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tl-plot { position: relative; height: 46px; }
    .ph { position: absolute; top: 12px; height: 14px; border-radius: 4px; cursor: default; z-index: 4; }
    .flag { position: absolute; top: 28px; margin-left: -6px; color: #141413; z-index: 5; line-height: 0; cursor: default; }
    .tl-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: var(--ink-2); }
    .tl-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .tl-legend i { width: 18px; height: 10px; border-radius: 3px; display: inline-block; }
    .tl-chart { border-top: 1px solid var(--line); }
    .colw { position: absolute; bottom: 20px; display: flex; justify-content: center; }
    .col { width: 100%; max-width: 18px; height: 100%; border-radius: 4px 4px 0 0; background: var(--st-collecting); }
    .col.fut { background: #b7d3f6; }
    .col.cur { background: #1c5cab; }
  </style>
  <div class="page" style="max-width:none">
    <div class="page-title">
      <div class="grow"><h1>Таймлайн тестов и релизов</h1><div class="sub">Каждая полоса — жизнь теста по фазам. Флажок — дата, с которой можно смотреть результаты. Вертикальные линии — релизы и сегодняшний день</div></div>
    </div>
    <div class="row wrap" style="margin-bottom:14px;gap:10px">
      <div class="seg">${Object.entries(TL_RANGES).map(([k, r]) => `<button class="${S.range === k ? 'on' : ''}" data-range="${k}">${r.label}</button>`).join('')}</div>
      <div class="seg"><button class="${S.group === 'feature' ? 'on' : ''}" data-group="feature">По фичам</button><button class="${S.group === 'stage' ? 'on' : ''}" data-group="stage">По стадиям</button><button class="${S.group === 'release' ? 'on' : ''}" data-group="release">По релизам</button></div>
      <span class="toggle ${S.hideDone ? 'on' : ''}" id="tl-hide"><i></i>Скрыть архив</span>
      <span class="sp"></span>
      <div class="tl-legend">${['enabling', 'collecting', 'overdue', 'ready', 'rollout', 'cleanup', 'pilot', 'plan'].map((k) => `<span><i style="${PHASE[k].css};height:10px;top:0"></i>${PHASE[k].name}</span>`).join('')}<span>${ICON.flag} Можно смотреть</span></div>
    </div>

    <div class="tl">
      <div class="tl-head"><div class="tl-lab">Тест</div>
        <div class="tl-axis">
          ${months.map((mo) => `<span class="mo" style="left:${x(mo.from)}%">${mo.name}</span>`).join('')}
          ${releases.map((r) => `<span class="rel" style="left:${x(r._d)}%" data-tip="<b>Релиз ${r.v}</b><br>${r.d}">${r.v}</span>`).join('')}
          <span class="today" style="left:${x(TODAY)}%">Сегодня ${fmt(TODAY)}</span>
        </div></div>
      <div class="tl-body">
        <div class="tl-grid">
          ${months.map((mo) => `<span class="vl" style="left:${x(mo.from)}%"></span>`).join('')}
          ${releases.map((r) => `<span class="vr" style="left:${x(r._d)}%"></span>`).join('')}
          <span class="vt" style="left:${x(TODAY)}%"></span>
        </div>
        ${groups.map((g) => g.feature
          ? `<div class="tl-grp"><div style="grid-column:1/-1;flex-wrap:wrap"><span class="dot" style="background:#141413"></span>${esc(g.title)}<span class="chip" style="height:18px;font-weight:500">${g.items.length} ${plural(g.items.length, 'тест', 'теста', 'тестов')} · ${featureKind(g.feature)}</span>${g.feature.history.length ? `<span class="muted" style="font-weight:500">и ещё ${g.feature.history.length} ${plural(g.feature.history.length, 'итерация', 'итерации', 'итераций')} раньше</span>` : ''}</div></div>${g.items.map(row).join('')}`
          : `<div class="tl-grp"><div style="grid-column:1/-1">${g.color ? `<span class="dot" style="background:${g.color}"></span>` : ''}${esc(g.title)}<span class="muted" style="font-weight:500">${g.items.length}</span></div></div>${g.items.map(row).join('')}`).join('')}
      </div>
      <div class="tl-chart">
        <div class="tl-lab" style="padding:14px 16px"><div style="font-weight:650;font-size:13px">АБ-тестов в эфире одновременно</div><div class="small muted">по неделям; светлые столбцы — по текущим планам. Чем выше, тем больше смешанной выборки</div></div>
        <div style="position:relative;height:130px">
          <span style="position:absolute;left:0;right:0;bottom:20px;height:1px;background:var(--line-2)"></span>
          <span style="position:absolute;left:0;right:0;bottom:${20 + 90 * 0.5}px;height:1px;background:var(--line)"></span>
          <span class="small muted" style="position:absolute;right:4px;bottom:${22 + 90 * 0.5}px">${yMax / 2}</span>
          <span style="position:absolute;left:0;right:0;bottom:110px;height:1px;background:var(--line)"></span>
          <span class="small muted" style="position:absolute;right:4px;bottom:112px">${yMax}</span>
          ${load.map((l) => { const cur = TODAY >= l.wk && TODAY < addDays(l.wk, 7); const left = x(l.wk), wd = x(addDays(l.wk, 7)) - left; return `<div class="colw" style="left:${left}%;width:${wd}%;padding:0 2px;height:${(l.n / yMax) * 90}px" data-tip="<b>Неделя с ${fmt(l.wk)}</b><br>${l.n} ${plural(l.n, 'тест', 'теста', 'тестов')} в эфире${l.future ? ' (по плану)' : ''}"><span class="col ${cur ? 'cur' : l.future ? 'fut' : ''}"></span></div>`; }).join('')}
          ${(() => { const pk = load.reduce((a, b) => (b.n > a.n ? b : a)); return `<span class="small" style="position:absolute;bottom:${24 + (pk.n / yMax) * 90}px;left:${x(pk.wk)}%;white-space:nowrap;font-weight:600">пик: ${pk.n}</span>`; })()}
        </div>
      </div>
    </div>
  </div>`;

  $$('[data-range]', root).forEach((b) => b.onclick = () => { S.range = b.dataset.range; renderTimeline(root); });
  $$('[data-group]', root).forEach((b) => b.onclick = () => { S.group = b.dataset.group; renderTimeline(root); });
  $('#tl-hide').onclick = () => { S.hideDone = !S.hideDone; renderTimeline(root); };
}

VIEWS.timeline = { render: renderTimeline };
