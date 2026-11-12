/* ===================== 1. Пульт ===================== */

const pultState = { tab: 'today', scope: 'team', stage: null, showLater: false };
const journalState = { period: '30', block: 'all', kind: 'all', q: '' };
const catState = { view: 'work', kind: 'all', q: '' };

function bucketOf(a) {
  if (a.sev === 'crit' || a.sev === 'serious') return 'overdue';
  if (a.sev === 'warn' || a.sev === 'good') return 'today';
  if (a.due && days(TODAY, a.due) <= 0) return 'today';
  if (a.due && days(TODAY, a.due) <= 7) return 'week';
  return 'later';
}

const WD_S = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MON_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dayTitle = (d) => `${WD_S[d.getDay()]}, ${d.getDate()} ${MON_G[d.getMonth()]}${d.getFullYear() !== TODAY.getFullYear() ? ' ' + d.getFullYear() : ''}`;

function pultTaskFilter(S) {
  return (a) => (S.scope === 'team' || a.e.owner === ME || (a.rule === 'needsd' && dutyNow() === ME)) && (!S.stage || S.stage.includes(a.e.stage));
}

/* ---------- вкладка «Сегодня» ---------- */
function renderToday(S) {
  const { now, later } = buildTasks(pultTaskFilter(S));
  const by = (ks) => EXPERIMENTS.filter((e) => ks.includes(e.stage));
  const tiles = [
    { k: ['enabling'], label: 'Включаются', foot: () => { const s = by(['enabling']).filter((e) => e.alerts.some((a) => a.rule === 'stuck')).length; return s ? `<b>${s} стоит</b>` : 'по плану'; } },
    { k: ['collecting'], label: 'Сбор данных', foot: () => `${by(['collecting']).filter((e) => e.lookAt && e.type !== 'holdout' && days(TODAY, e.lookAt) <= 7).length} готовы на неделе` },
    { k: ['ready'], label: 'Готовы к анализу', foot: () => { const n = by(['ready']).filter((e) => !e.decision).length; return n ? `<b>${n} без решения</b>` : 'всё разобрано'; } },
    { k: ['rollout'], label: 'Раскатка решения', foot: () => 'по плану' },
    { k: ['cleanup'], label: 'Чистка', foot: () => { const n = by(['cleanup']).filter((e) => e.alerts.some((a) => a.sev === 'serious')).length; return n ? `<b>${n} просрочено</b>` : 'в сроке'; } },
  ];

  const live = EXPERIMENTS.filter((e) => ['collecting', 'ready'].includes(e.stage) && e.platform === 'Запущен').sort((a, b) => (a.lookAt || 0) - (b.lookAt || 0));
  const liveF = [];
  live.forEach((e) => { let g = liveF.find((x) => x.fid === e.fid); if (!g) { g = { fid: e.fid, tests: [] }; liveF.push(g); } g.tests.push(e); });
  const moving = EXPERIMENTS.filter((e) => ['enabling', 'rollout'].includes(e.stage));

  return `
    <div class="tiles compact">
      ${tiles.map((t) => { const on = S.stage && S.stage.join() === t.k.join(); return `<button class="tile ${on ? 'on' : ''}" data-stage="${t.k.join(',')}">
        <span class="lbl">${stageDot(t.k[0])}${t.label}</span><span class="row" style="align-items:baseline;gap:8px"><span class="val">${by(t.k).length}</span><span class="foot">${t.foot()}</span></span></button>`; }).join('')}
    </div>
    <div class="grid-2" style="grid-template-columns:minmax(0,1fr) 380px">
      <div>
        <div class="section-label" style="margin-top:0">Сделать <span class="cnt">${now.length}</span>${S.stage ? `<span style="text-transform:none;letter-spacing:0" class="muted">· ${STAGE[S.stage[0]].name}</span><button class="btn sm ghost" data-stage="">Сбросить</button>` : ''}</div>
        <div class="tasks">${now.map((t) => taskRow(t)).join('') || '<div class="empty" style="padding:14px 16px">Всё сделано</div>'}</div>
        ${later.length ? `<button class="later-toggle" data-later>${S.showLater ? 'Скрыть' : `Позже и к сведению · ${later.length}`} <span style="display:inline-block;transform:rotate(${S.showLater ? -90 : 90}deg)">›</span></button>
        ${S.showLater ? `<div class="tasks">${later.map((t) => taskRow(t)).join('')}</div>` : ''}` : ''}
      </div>
      <div class="stack" style="gap:14px;position:sticky;top:64px">
        <div class="card"><div class="card-h"><h3>В эфире</h3><span class="sp"></span><span class="small muted">${live.length}</span></div>
          <div class="card-b">
          ${liveF.map((g) => g.tests.length === 1
    ? `<div class="lrow"><a href="#" data-open="${g.tests[0].id}" class="lname" title="${esc(g.tests[0].short)}">${esc(g.tests[0].short)}</a>${readinessBar(g.tests[0], true)}</div>`
    : `<div class="lrow"><a href="#" data-open="${g.tests[0].id}" class="lname" title="${esc(g.tests[0].feature)}">${esc(g.tests[0].feature)}</a><span class="small muted">${g.tests.length} ${plural(g.tests.length, 'тест', 'теста', 'тестов')}</span></div>
      ${g.tests.map((t) => `<div class="lrow sub"><a href="#" data-open="${t.id}" class="lname">${esc(t.label)}</a>${readinessBar(t, true)}</div>`).join('')}`).join('')}
          </div></div>
        <div class="card"><div class="card-h"><h3>Включение по блокам</h3></div>
          <div class="card-b">
          ${moving.map((e) => `<div class="lrow"><a href="#" data-open="${e.id}" class="lname" title="${esc(e.short)}">${esc(e.short)}</a><span class="row" style="gap:8px">${miniBlocks(e)}<span class="small nowrap ${e.nextPlan ? 'muted' : ''}" style="${e.nextPlan ? '' : 'color:#8a5d00;font-weight:600'}">${e.nextPlan ? fmt(e.nextPlan.d) : 'стоит'}</span></span></div>`).join('')}
          </div></div>
      </div>
    </div>`;
}

/* ---------- вкладка «Журнал включений» ---------- */
function renderJournal() {
  const J = journalState;
  const all = [];
  EXPERIMENTS.forEach((e) => e.events.forEach((ev) => { if (ev.b && ['beta', 'ab', 'on', 'pause', 'plan'].includes(ev.t)) all.push({ e, ev }); }));
  const blockOk = (ev) => J.block === 'all' || (J.block === 'Бета+' ? ev.b !== 'all' && ev.b.includes('Бета+') : ev.b === 'all' || ev.b.includes(J.block));
  const kindOk = (e) => J.kind === 'all' || (J.kind === 'ab' ? e.type !== 'rollout' : e.type === 'rollout');
  const q = J.q.trim().toLowerCase();
  const qOk = (x) => !q || `${x.e.short} ${x.ev.sd || ''} ${x.e.key}`.toLowerCase().includes(q);
  const from = J.period === 'all' ? null : addDays(TODAY, -Number(J.period));
  const list = all.filter((x) => blockOk(x.ev) && kindOk(x.e) && qOk(x));
  const future = list.filter((x) => x.ev.t === 'plan' && x.ev._d > TODAY).sort((a, b) => a.ev._d - b.ev._d);
  const past = list.filter((x) => x.ev.t !== 'plan' && x.ev._d <= TODAY && (!from || x.ev._d >= from)).sort((a, b) => b.ev._d - a.ev._d);

  const kind = (ev) => ev.t === 'ab' ? ['ab', 'АБ'] : ev.t === 'on' ? ['on', ev.v || 'вкл'] : ev.t === 'beta' ? ['beta', 'Бета+'] : ev.t === 'pause' ? ['pause', 'стоп'] : ['plan', ev.v || 'АБ'];
  const row = (x) => { const [k, l] = kind(x.ev); return `<div class="jl${x.ev._d > TODAY ? ' fut' : ''}" data-open="${x.e.id}">
    <span class="jl-when">${x.ev._d > TODAY ? fmt(x.ev._d) : ''}</span>
    <span class="jk k-${k}" title="${k === 'ab' ? 'Включён АБ' : k === 'on' ? 'Включено значение' : k === 'beta' ? 'Бета+' : k === 'pause' ? 'АБ остановлен' : 'Запланировано'}">${esc(l.length > 6 ? 'вкл' : l)}</span>
    <span class="jl-name">${esc(x.e.short)}${x.e.type === 'rollout' ? ' <span class="muted small">без АБ</span>' : ''}</span>
    <span class="jl-blk">${esc(x.ev.b.includes && x.ev.b.includes('Бета+') ? 'Бета+' : blockList(x.ev.b))}</span>
    <span class="jl-sd">${x.ev.sd || ''}</span>
    ${avatar(x.e.owner)}
  </div>`; };
  const groups = [];
  past.forEach((x) => { const k = fmt(x.ev._d, true); let g = groups.find((y) => y.k === k); if (!g) { g = { k, d: x.ev._d, items: [] }; groups.push(g); } g.items.push(x); });

  let summary = '';
  if (J.block !== 'all') {
    const abN = J.block === 'Бета+' ? 0 : EXPERIMENTS.filter((e) => e.st[J.block]?.s === 'ab').length;
    const onN = J.block === 'Бета+' ? EXPERIMENTS.filter((e) => e.beta && e.stage !== 'done').length : EXPERIMENTS.filter((e) => e.st[J.block]?.s === 'on').length;
    summary = `<div class="jsum">Сейчас на ${J.block === 'Бета+' ? 'Бета+' : 'блоке ' + J.block}: ${J.block === 'Бета+' ? '' : `<b>${abN}</b> АБ · `}<b>${onN}</b> включено</div>`;
  }

  return `
    <div class="row wrap" style="gap:10px;margin-bottom:14px">
      <div class="seg">${[['7', '7 дней'], ['30', '30 дней'], ['365', 'Год'], ['all', 'Всё']].map(([k, n]) => `<button class="${J.period === k ? 'on' : ''}" data-jp="${k}">${n}</button>`).join('')}</div>
      <select class="sel" id="j-block"><option value="all">Все блоки</option>${['Бета+', ...ALL_BLOCKS].map((b) => `<option ${J.block === b ? 'selected' : ''} value="${b}">${b === 'Бета+' ? b : 'Блок ' + b}</option>`).join('')}</select>
      <div class="seg">${[['all', 'Все'], ['ab', 'С АБ'], ['noab', 'Без АБ']].map(([k, n]) => `<button class="${J.kind === k ? 'on' : ''}" data-jk="${k}">${n}</button>`).join('')}</div>
      <span class="sp"></span>
      <div class="search" style="min-width:260px">${ICON.search}<input id="j-q" value="${esc(J.q)}" placeholder="Фича, SD, рубильник"></div>
    </div>
    ${summary}
    <div class="jfeed">
      ${future.length ? `<div class="jday">Запланировано <span class="cnt">${future.length}</span></div>${future.map(row).join('')}` : ''}
      ${groups.map((g) => `<div class="jday">${dayTitle(g.d)} <span class="cnt">${g.items.length}</span></div>${g.items.map(row).join('')}`).join('') || '<div class="empty" style="padding:16px">За период включений нет</div>'}
    </div>`;
}

/* ---------- вкладка «Все фичи» ---------- */
function featureRowsData() {
  return Object.values(FEATURES).map((f) => {
    const work = f.tests.filter((t) => t.stage !== 'done');
    const sevOf = (t) => (t.alerts.some((a) => a.sev !== 'info') ? SEV_ORDER[t.alerts.find((a) => a.sev !== 'info').sev] : 9);
    const doneAt = (t) => t.d.rolloutDoneAt || t.d.decisionAt || t.d.platformEnd || t.d.created;
    const primary = work.slice().sort((a, b) => sevOf(a) - sevOf(b) || STAGE[a.stage].i - STAGE[b.stage].i)[0] || f.tests.slice().sort((a, b) => doneAt(b) - doneAt(a))[0];
    const status = work.length ? 'work' : 'onall';
    const evs = f.tests.flatMap((t) => t.events.filter((ev) => ev._d <= TODAY)).sort((a, b) => b._d - a._d);
    return { f, work, primary, status, last: evs[0], hasAb: f.tests.some((t) => t.type !== 'rollout'), hasNoAb: f.tests.some((t) => t.type === 'rollout'), doneAt: doneAt(primary), sev: sevOf(primary) };
  });
}

function renderFeatures() {
  const C = catState;
  const rows = featureRowsData();
  const q = C.q.trim().toLowerCase();
  const hay = (r) => [r.f.name, ...r.f.tests.flatMap((t) => [t.key, t.seg, ...t.toggles.map((x) => x.n), ...t.events.map((ev) => ev.sd || '')])].join(' ').toLowerCase();
  const kindOk = (r) => C.kind === 'all' || (C.kind === 'ab' ? r.hasAb : r.hasNoAb);
  const views = [['work', 'В работе'], ['onall', 'Включены на всех'], ['all', 'Все']];
  const inView = (r, v) => v === 'all' || r.status === v;
  let list = rows.filter((r) => kindOk(r) && (q ? hay(r).includes(q) : inView(r, C.view)));
  list.sort((a, b) => (a.status === 'work' && b.status === 'work') ? a.sev - b.sev || STAGE[a.primary.stage].i - STAGE[b.primary.stage].i : a.status !== b.status ? (a.status === 'work' ? -1 : 1) : b.doneAt - a.doneAt);

  const tr = (r) => { const e = r.primary; const sev = e.alerts.find((a) => a.sev !== 'info');
    return `<tr class="clickable" data-open="${e.id}">
      <td style="width:28px;padding-right:0">${sev ? sevIcon(sev.sev) : ''}</td>
      <td class="fname"><b>${esc(r.f.name)}</b> <span class="muted small nowrap">${r.f.tests.length > 1 ? `${r.f.tests.length} ${plural(r.f.tests.length, 'тест', 'теста', 'тестов')}` : e.type === 'rollout' ? 'без АБ' : e.tag}</span></td>
      <td class="nowrap">${r.status === 'work' ? `${stageDot(e.stage)} ${STAGE[e.stage].name}` : `<span class="muted">на всех с</span> ${fmt(r.doneAt, true)}`}</td>
      <td>${miniBlocks(e)}</td>
      <td class="flast">${r.last ? `<span class="muted tnum">${fmt(r.last._d)}</span> ${esc(r.last.txt)}` : ''}</td>
      <td class="nowrap small">${esc(r.status === 'work' ? testBrief(e) : outcome(e))}</td>
      <td>${avatar(e.owner)}</td>
    </tr>`; };

  return `
    <div class="row wrap" style="gap:10px;margin-bottom:14px">
      <div class="seg">${views.map(([k, n]) => `<button class="${C.view === k && !q ? 'on' : ''}" data-cv="${k}">${n}<span class="cnt">${rows.filter((r) => kindOk(r) && inView(r, k)).length}</span></button>`).join('')}</div>
      <div class="seg">${[['all', 'Все'], ['ab', 'С АБ'], ['noab', 'Без АБ']].map(([k, n]) => `<button class="${C.kind === k ? 'on' : ''}" data-ck="${k}">${n}</button>`).join('')}</div>
      <span class="sp"></span>
      <div class="search" style="min-width:300px">${ICON.search}<input id="c-q" value="${esc(C.q)}" placeholder="Поиск по всем фичам: название, тогл, SD"></div>
    </div>
    ${q ? `<div class="small muted" style="margin:-6px 0 10px">Найдено во всех фичах: ${list.length}</div>` : ''}
    <div class="card" style="overflow-x:auto"><table class="t cat"><tbody>${list.map(tr).join('') || '<tr><td class="empty" style="padding:16px">Ничего не найдено</td></tr>'}</tbody></table></div>`;
}

/* ---------- экран ---------- */
function renderPult(root) {
  const S = pultState;
  const { now } = buildTasks(pultTaskFilter(S));
  const body = S.tab === 'journal' ? renderJournal() : S.tab === 'features' ? renderFeatures() : renderToday(S);
  root.innerHTML = `${appHead()}
  <div class="page">
    <div class="page-title" style="margin-bottom:6px">
      <div class="grow"><h1>Пульт</h1><div class="sub">${WD[TODAY.getDay()]}, ${TODAY.getDate()} ${MON_G[TODAY.getMonth()]} · дежурство по включению: ${dutyNow() === ME ? 'вы' : dutyNow()}, дальше ${DUTY[1].who}</div></div>
      ${S.tab === 'today' ? `<div class="seg"><button class="${S.scope === 'team' ? 'on' : ''}" data-scope="team">Вся команда</button><button class="${S.scope === 'mine' ? 'on' : ''}" data-scope="mine">Мои</button></div>` : ''}
    </div>
    <div class="utabs">
      <button class="${S.tab === 'today' ? 'on' : ''}" data-pt="today">Сегодня <span class="cnt">${now.length}</span></button>
      <button class="${S.tab === 'journal' ? 'on' : ''}" data-pt="journal">Журнал включений</button>
      <button class="${S.tab === 'features' ? 'on' : ''}" data-pt="features">Все фичи <span class="cnt">${Object.keys(FEATURES).length}</span></button>
    </div>
    ${body}
  </div>`;

  const rr = () => renderPult(root);
  const keepFocus = (id) => { const n = $('#' + id); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
  $$('[data-pt]', root).forEach((b) => b.onclick = () => { S.tab = b.dataset.pt; rr(); });
  $$('[data-scope]', root).forEach((b) => b.onclick = () => { S.scope = b.dataset.scope; rr(); });
  $$('[data-stage]', root).forEach((b) => b.onclick = () => { const v = b.dataset.stage; S.stage = !v || (S.stage && S.stage.join() === v) ? null : v.split(','); rr(); });
  const lt = $('[data-later]', root); if (lt) lt.onclick = () => { S.showLater = !S.showLater; rr(); };
  $$('[data-jp]', root).forEach((b) => b.onclick = () => { journalState.period = b.dataset.jp; rr(); });
  $$('[data-jk]', root).forEach((b) => b.onclick = () => { journalState.kind = b.dataset.jk; rr(); });
  const jb = $('#j-block'); if (jb) jb.onchange = () => { journalState.block = jb.value; rr(); };
  const jq = $('#j-q'); if (jq) jq.addEventListener('input', () => { journalState.q = jq.value; rr(); keepFocus('j-q'); });
  $$('[data-cv]', root).forEach((b) => b.onclick = () => { catState.view = b.dataset.cv; catState.q = ''; rr(); });
  $$('[data-ck]', root).forEach((b) => b.onclick = () => { catState.kind = b.dataset.ck; rr(); });
  const cq = $('#c-q'); if (cq) cq.addEventListener('input', () => { catState.q = cq.value; rr(); keepFocus('c-q'); });
}

VIEWS.pult = { render: renderPult };
