/* ===================== 1. Пульт ===================== */

const pultState = { tab: 'ab', scope: 'team', stage: null, showLater: false };
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

/* ---------- вкладка «А/Б-тесты» ---------- */
const abState = { view: 'active', fin: 'all', q: '', showRemind: false };

const isAbTest = (e) => e.type !== 'rollout';
const isFinished = (e) => isAbTest(e) && (e.platform === 'Завершён' || !!e.decision);
const isActive = (e) => isAbTest(e) && !isFinished(e) && ['enabling', 'collecting', 'ready'].includes(e.stage);
const isPreparing = (e) => isAbTest(e) && !isFinished(e) && ['prep', 'release'].includes(e.stage);

function splitText(e) {
  const sh = e.variants.map((v) => v.share);
  const parts = [];
  sh.forEach((x) => { const last = parts[parts.length - 1]; if (last && last.v === x) last.n++; else parts.push({ v: x, n: 1 }); });
  return parts.map((p) => (p.n > 2 ? `${p.v}×${p.n}` : Array(p.n).fill(p.v).join(' / '))).join(' / ');
}

function testCell(e) {
  return `<a href="#" data-open="${e.id}" class="tname" title="${esc(e.feature)}">${esc(e.feature)}</a>
    <div class="tsub"><span class="nowrap">№${e.iter}${e.seg ? ' · ' + esc(e.seg) : ''}</span> · <span>${esc(e.seg ? e.key : e.branch)}</span></div>`;
}

function finClass(e) {
  if (!e.decision) return 'nodec';
  if (e.flags.includes('stopped')) return 'stop';
  const o = outcome(e);
  return o.startsWith('Победил') || o.startsWith('Не хуже') ? 'win' : 'none';
}

function renderAB(S) {
  const A = abState;
  const mine = (e) => S.scope === 'team' || e.owner === ME;
  const q = A.q.trim().toLowerCase();
  const qOk = (e) => !q || `${e.feature} ${e.seg || ''} ${e.branch} ${e.key} №${e.iter}`.toLowerCase().includes(q);
  const active = EXPERIMENTS.filter((e) => isActive(e) && mine(e));
  const finished = EXPERIMENTS.filter((e) => isFinished(e) && mine(e));
  const prep = EXPERIMENTS.filter((e) => isPreparing(e) && mine(e));
  const { now, later } = buildTasks(pultTaskFilter(S));
  const critN = now.filter((t) => t.main.sev === 'crit' || t.main.sev === 'serious').length;

  const remind = `<div class="remind ${A.showRemind ? 'open' : ''}">
    <button class="remind-bar" data-remind>${ICON.bell}<b>Напоминания</b><span class="chip" style="height:20px">${now.length}</span>${critN ? `<span class="sev-label crit">${critN} ${plural(critN, 'просрочено', 'просрочено', 'просрочено')}</span>` : ''}<span class="sp"></span><span class="small" style="color:var(--accent)">${A.showRemind ? 'Скрыть' : 'Показать'}</span></button>
    ${A.showRemind ? `<div class="tasks" style="border-radius:0 0 var(--r) var(--r);box-shadow:none;border-top:1px solid var(--line)">${now.map((t) => taskRow(t)).join('')}</div>
      ${later.length ? `<button class="later-toggle" data-later style="padding-left:14px">${S.showLater ? 'Скрыть' : `Позже и к сведению · ${later.length}`}</button>${S.showLater ? `<div class="tasks" style="box-shadow:none;border-top:1px solid var(--line);border-radius:0">${later.map((t) => taskRow(t)).join('')}</div>` : ''}` : ''}` : ''}
  </div>`;

  let table = '';
  if (A.view === 'active') {
    const groups = [['ready', 'Готовы к анализу'], ['collecting', 'Сбор данных'], ['enabling', 'Включаются']]
      .map(([k, n]) => ({ k, n, items: active.filter((e) => e.stage === k && qOk(e)).sort((a, b) => (a.lookAt || TODAY) - (b.lookAt || TODAY)) }))
      .filter((g) => g.items.length);
    const row = (e) => {
      const sev = e.alerts.find((a) => a.sev !== 'info');
      return `<tr class="clickable" data-open="${e.id}">
        <td class="ic">${sev ? `<span data-tip="${esc(sev.title)}">${sevIcon(sev.sev)}</span>` : ''}</td>
        <td class="tcol">${testCell(e)}</td>
        <td class="nowrap">${e.type === 'holdout' ? '<span class="chip" style="height:18px">холдаут</span>' : `<span class="small">${esc(splitText(e))}</span>`}<div class="tsub">${e.variants.length} ${plural(e.variants.length, 'вариант', 'варианта', 'вариантов')}</div></td>
        <td class="nowrap">${miniBlocks(e)}<div class="tsub">${e.coverage} из ${ALL_BLOCKS.length}${e.nextPlan ? ` · дальше ${fmt(e.nextPlan.d)}` : e.coverage < ALL_BLOCKS.length ? ' · <span style="color:#8a5d00">стоит</span>' : ''}</div></td>
        <td class="nowrap">${e.d.fullAt ? `день ${e.dayN} из ${e.planDays}` : '—'}<div class="tsub">${e.d.fullAt ? `с ${fmt(e.d.fullAt)}` : e.d.enableStart ? `включается с ${fmt(e.d.enableStart)}` : ''}</div></td>
        <td class="nowrap tnum">${e.d.fullAt ? e.sample + '%' : '—'}</td>
        <td class="rcol">${e.d.fullAt ? readinessBar(e, true) : '<span class="small muted">после 100 % блоков</span>'}</td>
        <td class="nowrap tnum">${e.cross.mixed ? `<span class="${e.cross.mixed >= 90 ? 'sev-label warn' : ''}" data-tip="${e.cross.mixed}% выборки попадает в другие тесты">${e.cross.mixed}%</span>` : '—'}</td>
        <td>${avatar(e.owner)}</td>
      </tr>`;
    };
    table = groups.length ? `<table class="t abt"><thead><tr><th></th><th>Тест и фича</th><th>Сплит</th><th>Блоки</th><th>Срок</th><th>Выборка</th><th>Итоги</th><th>Пересечения</th><th></th></tr></thead><tbody>
      ${groups.map((g) => `<tr class="grp"><td colspan="9">${stageDot(g.k)} ${g.n} <span class="muted">${g.items.length}</span></td></tr>${g.items.map(row).join('')}`).join('')}
    </tbody></table>` : '<div class="empty" style="padding:16px">Активных тестов нет</div>';
  } else if (A.view === 'finished') {
    const filters = [['all', 'Все'], ['nodec', 'Без решения'], ['win', 'Победы'], ['none', 'Без эффекта'], ['stop', 'Остановлены']];
    const list = finished.filter((e) => qOk(e) && (A.fin === 'all' || finClass(e) === A.fin))
      .sort((a, b) => (b.d.platformEnd || b.d.decisionAt || TODAY) - (a.d.platformEnd || a.d.decisionAt || TODAY));
    const stageNow = (e) => !e.decision ? '<span class="sev-label serious">Ждёт решения</span>' : `${stageDot(e.stage)} ${e.stage === 'done' ? 'Закрыт' : STAGE[e.stage].name}`;
    const row = (e) => {
      const best = e.results?.rows?.find((x) => !x.control);
      const end = e.d.platformEnd || e.d.decisionAt;
      return `<tr class="clickable" data-open="${e.id}">
        <td class="tcol">${testCell(e)}</td>
        <td class="nowrap">${fmt(e.d.fullAt || e.d.enableStart, true)} – ${fmt(end, true)}<div class="tsub">${e.d.fullAt && end ? dn(days(e.d.fullAt, end)) : ''}</div></td>
        <td>${e.decision ? `<span class="chip">${esc(outcome(e))}</span>` : '<span class="sev-label serious">Нет решения</span>'}<div class="tsub">${best && e.results.status !== 'invalid' ? `${sgn(best.delta)} п.п. · ${best.verdict || (best.sig ? 'значимо' : 'незначимо')}` : e.results?.status === 'invalid' ? 'данные невалидны' : ''}</div></td>
        <td class="small ink2" style="max-width:260px">${esc(e.metric || '—')}</td>
        <td class="nowrap">${e.decision ? `${avatar(e.decision.who)} <span class="small">${e.decision.d.slice(0, 5)}${D(e.decision.d).getFullYear() !== TODAY.getFullYear() ? '.' + D(e.decision.d).getFullYear() : ''}</span>` : '<span class="muted">—</span>'}</td>
        <td class="nowrap small">${stageNow(e)}</td>
      </tr>`;
    };
    table = `<div class="row wrap" style="gap:10px;padding:12px 12px 0">
        <div class="seg">${filters.map(([k, n]) => `<button class="${A.fin === k ? 'on' : ''}" data-fin="${k}">${n}<span class="cnt">${finished.filter((e) => k === 'all' || finClass(e) === k).length}</span></button>`).join('')}</div></div>
      <table class="t abt" style="margin-top:8px"><thead><tr><th>Тест и фича</th><th>Период</th><th>Итог</th><th>Целевая метрика</th><th>Решение</th><th>Сейчас</th></tr></thead><tbody>
      ${list.map(row).join('') || '<tr><td colspan="6" class="empty" style="padding:16px">Нет тестов</td></tr>'}</tbody></table>`;
  } else {
    const row = (e) => `<tr class="clickable" data-open="${e.id}">
      <td class="tcol">${testCell(e)}</td>
      <td class="nowrap">${stageDot(e.stage)} ${STAGE[e.stage].name}</td>
      <td class="nowrap">${e.d.plannedStart ? `старт ${fmt(e.d.plannedStart, true)}` : '<span class="muted">дата не назначена</span>'}<div class="tsub">релиз ${e.release}</div></td>
      <td>${e.blockers ? `<span class="sev-label warn">${esc(e.blockers)}</span>` : '<span class="muted">—</span>'}</td>
      <td>${avatar(e.owner)}</td>
    </tr>`;
    table = `<table class="t abt"><thead><tr><th>Тест и фича</th><th>Стадия</th><th>Старт</th><th>Блокер</th><th></th></tr></thead><tbody>${prep.filter(qOk).map(row).join('') || '<tr><td colspan="5" class="empty" style="padding:16px">Нет тестов</td></tr>'}</tbody></table>`;
  }

  return `
    ${remind}
    <div class="row wrap" style="gap:10px;margin:16px 0 12px">
      <h2 style="margin-right:8px">${A.view === 'active' ? 'Активные А/Б-тесты' : A.view === 'finished' ? 'Завершённые А/Б-тесты' : 'Готовятся к запуску'}</h2>
      <div class="seg">${[['active', 'Активные', active.length], ['finished', 'Завершённые', finished.length], ['prep', 'Готовятся', prep.length]].map(([k, n, c]) => `<button class="${A.view === k ? 'on' : ''}" data-abv="${k}">${n}<span class="cnt">${c}</span></button>`).join('')}</div>
      <span class="sp"></span>
      <div class="search" style="min-width:280px">${ICON.search}<input id="ab-q" value="${esc(A.q)}" placeholder="Тест, фича, рубильник, №"></div>
    </div>
    <div class="card" style="overflow-x:auto">${table}</div>`;
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
  const body = S.tab === 'journal' ? renderJournal() : S.tab === 'features' ? renderFeatures() : renderAB(S);
  root.innerHTML = `${appHead()}
  <div class="page">
    <div class="page-title" style="margin-bottom:6px">
      <div class="grow"><h1>Пульт</h1><div class="sub">${WD[TODAY.getDay()]}, ${TODAY.getDate()} ${MON_G[TODAY.getMonth()]} · дежурство по включению: ${dutyNow() === ME ? 'вы' : dutyNow()}, дальше ${DUTY[1].who}</div></div>
      ${S.tab === 'ab' ? `<div class="seg"><button class="${S.scope === 'team' ? 'on' : ''}" data-scope="team">Вся команда</button><button class="${S.scope === 'mine' ? 'on' : ''}" data-scope="mine">Мои</button></div>` : ''}
    </div>
    <div class="utabs">
      <button class="${S.tab === 'ab' ? 'on' : ''}" data-pt="ab">А/Б-тесты <span class="cnt">${EXPERIMENTS.filter(isActive).length}</span></button>
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
  const rb = $('[data-remind]', root); if (rb) rb.onclick = () => { abState.showRemind = !abState.showRemind; rr(); };
  $$('[data-abv]', root).forEach((b) => b.onclick = () => { abState.view = b.dataset.abv; rr(); });
  $$('[data-fin]', root).forEach((b) => b.onclick = () => { abState.fin = b.dataset.fin; rr(); });
  const aq = $('#ab-q'); if (aq) aq.addEventListener('input', () => { abState.q = aq.value; rr(); keepFocus('ab-q'); });
  $$('[data-jp]', root).forEach((b) => b.onclick = () => { journalState.period = b.dataset.jp; rr(); });
  $$('[data-jk]', root).forEach((b) => b.onclick = () => { journalState.kind = b.dataset.jk; rr(); });
  const jb = $('#j-block'); if (jb) jb.onchange = () => { journalState.block = jb.value; rr(); };
  const jq = $('#j-q'); if (jq) jq.addEventListener('input', () => { journalState.q = jq.value; rr(); keepFocus('j-q'); });
  $$('[data-cv]', root).forEach((b) => b.onclick = () => { catState.view = b.dataset.cv; catState.q = ''; rr(); });
  $$('[data-ck]', root).forEach((b) => b.onclick = () => { catState.kind = b.dataset.ck; rr(); });
  const cq = $('#c-q'); if (cq) cq.addEventListener('input', () => { catState.q = cq.value; rr(); keepFocus('c-q'); });
}

VIEWS.pult = { render: renderPult };
