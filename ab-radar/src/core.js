/* ===================================================================
   Ядро демо: даты, производные поля, правила-напоминалки,
   общие компоненты (стадии, блоки, готовность), паспорт эксперимента.
   =================================================================== */

const DAY = 864e5;
const D = (s) => { if (!s || s.includes('DD')) return null; const [d, m, y] = s.split('.').map(Number); return new Date(y, m - 1, d); };
const TODAY = D(TODAY_STR);
const days = (a, b) => Math.round((b - a) / DAY);
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d, y = false) => d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}${y ? '.' + d.getFullYear() : ''}` : '—';
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MON_FULL = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const fmtH = (d) => d ? `${d.getDate()} ${MON[d.getMonth()]}` : '—';
const WD = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return a; if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b; return c; };
const dn = (n) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;
const rel = (d) => {
  if (!d) return '';
  const n = days(TODAY, d);
  if (n === 0) return 'сегодня';
  if (n === 1) return 'завтра';
  if (n === -1) return 'вчера';
  return n > 0 ? `через ${dn(n)}` : `${dn(-n)} назад`;
};
const num = (v) => { const d = Math.min(2, Math.max(1, (String(v).split('.')[1] || '').length)); return Math.abs(v).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }); };
const sgn = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(v)}`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (n) => n.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const STAGE = Object.fromEntries(STAGES.map((s, i) => [s.k, { ...s, i }]));
const SEV_ORDER = { crit: 0, serious: 1, warn: 2, good: 3, info: 4 };
const SEV_NAME = { crit: 'Критично', serious: 'Важно', warn: 'Внимание', good: 'Можно действовать', info: 'К сведению' };

/* ---------- иконки ---------- */
const ICON = {
  crit: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 4.5v4.2M8 11.2v.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  serious: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 3.5 13.5 12.5h-11L8 3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 7.2v2.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.6"/><path d="M8 5.5V8l1.8 1.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 7.3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="4.8" r="1.1" fill="currentColor"/></svg>',
  good: '<svg viewBox="0 0 16 16" fill="none"><path d="m4 8.3 2.6 2.6L12 5.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><rect x="5" y="5" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 10V4a1 1 0 0 1 1-1h6" stroke="currentColor" stroke-width="1.4"/></svg>',
  search: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ext: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bell: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none"><path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.2H3L4 11Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.5 13.6a1.6 1.6 0 0 0 3 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  flag: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M4 14V2.5M4 3h7l-1.5 2.5L11 8H4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
};
const sevIcon = (sev) => `<span class="sev ${sev}" title="${SEV_NAME[sev]}">${ICON[sev]}</span>`;

/* ---------- производные поля ---------- */
const ALL_BLOCKS = BLOCKS;

function convName(e) {
  return `[${TEAM.name}] ${TEAM.platform}. ${e.feature}. №${e.iter} Ветка: ${e.branch} ${e.ver}. ${e.range}. ${e.launch}`;
}

function computeBlocks(e) {
  const st = {}; const plan = {}; let beta = null; let lastMove = null; let nextPlan = null;
  const evs = [...e.events].sort((a, b) => a._d - b._d);
  for (const ev of evs) {
    if (!ev.b) continue;
    const list = ev.b === 'all' ? ALL_BLOCKS : ev.b;
    if (ev.t === 'plan') {
      if (ev._d > TODAY) {
        list.forEach((b) => { if (!plan[b]) plan[b] = { d: ev._d, v: ev.v, sd: ev.sd }; });
        if (!nextPlan || ev._d < nextPlan.d) nextPlan = { d: ev._d, blocks: list, sd: ev.sd, v: ev.v };
      }
      continue;
    }
    if (ev._d > TODAY) continue;
    if (list.includes('Бета+')) { beta = { s: 'on', v: ev.v, d: ev._d }; continue; }
    list.forEach((b) => { st[b] = { s: ev.t, v: ev.v, d: ev._d }; delete plan[b]; });
    if (['ab', 'on'].includes(ev.t)) lastMove = ev._d;
  }
  return { st, plan, beta, lastMove, nextPlan };
}

function prepare(e) {
  e.events.forEach((ev) => { ev._d = D(ev.d); });
  e.d = Object.fromEntries(Object.entries(e.dates).map(([k, v]) => [k, D(v)]));
  e.name = convName(e);
  e.short = `${e.feature}`;
  e.tag = `№${e.iter} · ${e.ver}`;
  const fa = e.d.fullAt;
  e.minAt = fa && e.minDays ? addDays(fa, e.minDays) : null;
  e.planEnd = e.d.planEnd || (fa && e.planDays ? addDays(fa, e.planDays) : null);
  const endAt = e.d.platformEnd && e.d.platformEnd < TODAY ? e.d.platformEnd : TODAY;
  e.dayN = fa ? days(fa, endAt) : null;
  Object.assign(e, computeBlocks(e));
  e.coverage = ALL_BLOCKS.filter((b) => e.st[b] && ['ab', 'on'].includes(e.st[b].s)).length;
  e.onCount = ALL_BLOCKS.filter((b) => e.st[b] && e.st[b].s === 'on').length;
  e.flags = e.flags || [];
  e.blockers = e.blockers || null;
  e.alerts = alertsFor(e);
  e.topSev = e.alerts.length ? e.alerts.reduce((m, a) => (SEV_ORDER[a.sev] < SEV_ORDER[m] ? a.sev : m), 'info') : null;
}

function blockList(list) {
  if (list === 'all' || (Array.isArray(list) && list.length === ALL_BLOCKS.length)) return 'все блоки';
  const L = [...list];
  const si = L.filter((b) => b.startsWith('SI'));
  const rest = L.filter((b) => !b.startsWith('SI'));
  const parts = [];
  if (rest.length) parts.push(rest.join(', '));
  if (si.length === 4) parts.push('SI1–SI4'); else if (si.length) parts.push(si.join(', '));
  return parts.join(', ');
}

function dutyNow() { return DUTY.find((x) => x.now).who; }

/* ---------- правила-напоминалки ---------- */
function alertsFor(e) {
  const A = [];
  const add = (sev, title, sub, due, act, rule) => A.push({ sev, title, sub, due, act, rule, e });
  const t = TODAY;

  if (e.blockers) add('warn', `Блокер: ${e.blockers}`, 'Пока блокер не снят, тест не стартует. Дату старта нельзя запланировать', null, { k: 'open', label: 'Открыть' }, 'blocker');
  if (e.type === 'ab' && !e.metric) add('warn', 'Не заполнена целевая метрика', 'Без неё не посчитать минимальный срок и выборку, а значит и дату, когда смотреть результаты', null, { k: 'open', label: 'Заполнить' }, 'nometric');

  if (e.stage === 'ready') {
    if (e.platform === 'Завершён' && !e.decision) {
      const n = days(e.d.platformEnd, t);
      if (n >= 3) add('crit', `Тест завершён ${dn(n)} назад, а решения нет`, 'Платформа посчитала итог, но вывод и следующий шаг (раскатка, перезапуск, откат) не записаны', e.d.platformEnd, { k: 'decide', label: 'Записать решение' }, 'nodecision');
      else add('good', 'Тест завершён: разберите результаты', 'Итог посчитан на платформе', e.d.platformEnd, { k: 'decide', label: 'Записать решение' }, 'nodecision');
    }
    if (e.platform === 'Запущен' && !e.decision && e.planEnd && e.planEnd < t) {
      const n = days(e.planEnd, t);
      add('crit', `Идёт на ${dn(n)} дольше плана`, `Результаты можно было смотреть с ${fmt(e.minAt)}, но их никто не разобрал. Трафик всё ещё делится между вариантами`, e.planEnd, { k: 'results', label: 'Смотреть результаты' }, 'overdue');
    }
  }

  if (e.stage === 'collecting' && e.type !== 'holdout' && e.minAt) {
    const n = days(t, e.minAt);
    if (n <= 0) add('good', 'Можно смотреть результаты', `Набран минимальный срок (${dn(e.minDays)}) и выборка`, e.minAt, { k: 'results', label: 'Смотреть результаты' }, 'canlook');
    else add('info', `Результаты можно смотреть с ${fmtH(e.minAt)}`, `День ${e.dayN} из ${e.planDays}, выборка ${e.sample}%. Если смотреть раньше, выводы будут ненадёжными`, e.minAt, { k: 'remind', label: 'Напомнить мне' }, 'upcoming');
  }

  if (e.type === 'holdout' && e.holdout) {
    add('info', `Срез холдаута ${fmtH(D(e.holdout.next))}`, `${e.holdout.lastNote}. Держим до ${e.holdout.until}`, D(e.holdout.next), { k: 'remind', label: 'Напомнить мне' }, 'holdout');
  }

  if (['enabling', 'rollout'].includes(e.stage)) {
    const np = e.nextPlan;
    const what = e.stage === 'rollout' ? `включение ${e.decision?.winner || ''}` : 'включение АБ';
    if (!np) {
      const n = e.lastMove ? days(e.lastMove, t) : 0;
      if (n >= 3) add('warn', `Включение стоит ${dn(n)}`, `Включено на ${e.coverage} из ${ALL_BLOCKS.length} блоков, следующий шаг не запланирован`, e.lastMove, { k: 'plan', label: 'Запланировать шаг' }, 'stuck');
    } else {
      const n = days(t, np.d);
      if (!np.sd && n <= 1) add('warn', `${n === 0 ? 'Сегодня' : 'Завтра'} ${what}: блоки ${blockList(np.blocks)}`, `SD-заявки пока нет. Дежурный по включению: ${dutyNow()}`, t, { k: 'sd', label: 'Создать SD-заявку' }, 'needsd');
      else add('info', `${rel(np.d)[0].toUpperCase() + rel(np.d).slice(1)}: ${what}, блоки ${blockList(np.blocks)}`, np.sd ? `Заявка ${np.sd} создана` : 'Заявку нужно создать за день до включения', np.d, { k: 'open', label: 'Открыть' }, 'nextstep');
    }
  }

  if (e.platform === 'Новый' && !e.d.enableStart && !e.d.plannedStart && !e.blockers && e.d.created) {
    const n = days(e.d.created, t);
    if (n >= 14) add('warn', `Черновик на АБ-платформе висит ${dn(n)}`, e.type === 'rollout' ? 'Фичу раскатили без АБ. Черновик теста лучше архивировать, чтобы он не путал' : 'Тест заведён, но не запущен. Запустите его или отправьте в архив', e.d.created, { k: 'archive', label: 'Архивировать черновик' }, 'draft');
  }

  if (e.stage === 'cleanup' && e.d.rolloutDoneAt) {
    const todo = e.toggles.filter((x) => x.st === 'todo');
    const n = days(e.d.rolloutDoneAt, t);
    if (todo.length && n >= 30) add('serious', `Раскатано ${dn(n)} назад, тоглы не удалены (${todo.length})`, todo.map((x) => x.n).join(', '), addDays(e.d.rolloutDoneAt, 30), { k: 'cleanup', label: 'В «Удаление тоглов»' }, 'toggles');
    else if (todo.length) add('info', `Запланировать удаление тоглов (${todo.length})`, `${todo.map((x) => x.n).join(', ')}. Срок: ${fmtH(addDays(e.d.rolloutDoneAt, 30))}`, addDays(e.d.rolloutDoneAt, 30), { k: 'cleanup', label: 'В «Удаление тоглов»' }, 'toggles');
  }

  if (['enabling', 'collecting', 'ready'].includes(e.stage) && e.type !== 'holdout' && e.cross.mixed >= 90) {
    add('warn', `Пересечения: ${e.cross.mixed}% выборки в других тестах`, `Пересекается с: ${e.cross.with.map((id) => EX[id] ? `${EX[id].feature} №${EX[id].iter}` : id).join('; ')}. Проверьте, не смешиваются ли эффекты`, null, { k: 'cross', label: 'Посмотреть' }, 'cross');
  }

  if (e.stage === 'release' && e.d.plannedStart) {
    const r = RELEASES.find((x) => x.v === e.release);
    add('info', `Старт АБ ${fmtH(e.d.plannedStart)}, после раскатки релиза ${e.release}`, `Релиз ${e.release} выходит ${r ? r.d : ''}. Пилот на бете уже включён`, e.d.plannedStart, { k: 'open', label: 'Открыть' }, 'release');
  }

  return A.sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev]);
}

const EX = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));
function prepareAll() { EXPERIMENTS.forEach(prepare); }
prepareAll();
const allAlerts = () => EXPERIMENTS.flatMap((e) => e.alerts).sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev] || ((a.due || TODAY) - (b.due || TODAY)));

function outcome(e) {
  if (e.flags.includes('stopped')) return 'Остановлен досрочно';
  if (!e.decision) return '';
  if (e.results?.direction === 'noninf') return `Не хуже контроля · ${e.decision.winner}`;
  const w = e.variants.find((v) => v.v === e.decision.winner);
  if (w && !w.control) return `Победил ${e.decision.winner}`;
  return 'Нет эффекта';
}

/* ---------- маленькие компоненты ---------- */
const stageDot = (k) => `<span class="dot" style="background:${STAGE[k].color}"></span>`;
const stageChip = (k) => `<span class="chip stage-chip" title="${esc(STAGE[k].hint)}">${stageDot(k)}${STAGE[k].name}</span>`;
const avatar = (n, lg) => `<span class="avatar${lg ? ' lg' : ''}" title="${esc(n)}">${initials(n)}</span>`;
const platChip = (p) => {
  const map = { 'Запущен': 'Запущен', 'Завершён': 'Завершён', 'Новый': 'Новый', 'Нет': '—' };
  return `<span class="chip outline" title="Статус на АБ-платформе">АБ-платформа: ${map[p] || p}</span>`;
};
const typeChip = (e) => e.type === 'holdout' ? '<span class="chip">Холдаут</span>' : e.type === 'rollout' ? '<span class="chip">Без АБ</span>' : '';

function cellState(e, b) {
  const s = e.st[b]; const p = e.plan[b];
  if (s && ['ab', 'on'].includes(s.s)) return { cls: s.s, txt: s.s === 'ab' ? 'АБ' : (s.v || 'вкл'), tip: `${s.s === 'ab' ? 'Идёт АБ' : 'Включено ' + (s.v || '')} с ${fmt(s.d)}` };
  if (p) return { cls: 'plan', txt: fmt(p.d), tip: `Запланировано на ${fmt(p.d, true)}${p.sd ? ' · ' + p.sd : ' · SD ещё не создана'}` };
  if (s && s.s === 'pause') return { cls: 'pause', txt: '—', tip: `АБ остановлен ${fmt(s.d)}, клиенты на ${s.v || 'контроле'}` };
  return { cls: '', txt: '', tip: 'Не включено' };
}

const BM_COLS = (beta = true) => {
  const c = [];
  if (beta) c.push({ h: 'Бета+', beta: true }, { gap: true });
  ALL_BLOCKS.forEach((b) => { c.push({ h: b }); if (b === 'ГФ' || b === '7' || b === '4' || b === '1') c.push({ gap: true }); });
  return c;
};
const bmTemplate = (fixed) => BM_COLS().map((c) => (c.gap ? '6px' : fixed ? (c.beta ? '40px' : fixed) : 'minmax(30px, auto)')).join(' ');
const bmHeader = (fixed) => `<div class="bm-grid" style="grid-template-columns:${bmTemplate(fixed)}">${BM_COLS().map((c) => (c.gap ? '<span></span>' : `<span class="hd" style="min-width:0">${c.h}</span>`)).join('')}</div>`;

function blockMatrix(e, { head = true, beta = true, fixed = null } = {}) {
  const cols = [];
  if (beta) cols.push({ h: 'Бета+', c: e.beta ? { cls: 'on', txt: e.beta.v && e.beta.v.length <= 4 ? e.beta.v : 'вкл', tip: `Бета+: включено ${e.beta.v || ''} с ${fmt(e.beta.d)}` } : { cls: '', txt: '', tip: 'Бета+: не включено' } });
  if (beta) cols.push({ gap: true });
  ALL_BLOCKS.forEach((b, i) => {
    cols.push({ h: b, c: cellState(e, b) });
    if (b === 'ГФ' || b === '7' || b === '4' || b === '1') cols.push({ gap: true });
  });
  const tpl = fixed && beta ? bmTemplate(fixed) : cols.map((c) => (c.gap ? '6px' : 'minmax(30px, auto)')).join(' ');
  return `<div class="bm-grid" style="grid-template-columns:${tpl}">
    ${head ? cols.map((c) => (c.gap ? '<span></span>' : `<span class="hd">${c.h}</span>`)).join('') : ''}
    ${cols.map((c) => (c.gap ? '<span></span>' : `<span class="bm"><span class="c ${c.c.cls}" data-tip="<b>${esc(c.h)}</b><br>${esc(c.c.tip)}">${esc(c.c.txt)}</span></span>`)).join('')}
  </div>`;
}

function miniBlocks(e) {
  const parts = ALL_BLOCKS.map((b) => {
    const c = cellState(e, b);
    const sep = (b === 'ГФ' || b === '7' || b === '4' || b === '1') ? '<i class="sep"></i>' : '';
    return `<i class="${c.cls}"></i>${sep}`;
  }).join('');
  return `<span class="mini-bm" data-tip="${esc(miniTip(e))}">${parts}</span>`;
}
function miniTip(e) {
  const on = e.coverage; const p = Object.keys(e.plan).length;
  let s = `<b>Блоки: ${on} из ${ALL_BLOCKS.length}</b>`;
  if (p) s += `<br>Запланировано ещё ${p}${e.nextPlan ? ', следующий шаг ' + fmt(e.nextPlan.d) : ''}`;
  if (e.lastMove) s += `<br><span class="tmuted">Последнее движение ${fmt(e.lastMove)}</span>`;
  return s;
}

const bmLegend = () => `<div class="bm-legend">
  <span><i class="ab"></i>Идёт АБ</span><span><i class="on"></i>Включено значение</span>
  <span><i class="plan"></i>Запланировано</span><span><i class="pause"></i>АБ остановлен</span><span><i></i>Не включено</span></div>`;

/* Готовность результатов: можно ли уже смотреть */
function readiness(e) {
  if (!e.d.fullAt || !e.minAt) return null;
  const total = e.planDays; const n = Math.min(e.dayN, total);
  const over = e.planEnd && TODAY > e.planEnd && !e.decision && e.platform === 'Запущен';
  const canLook = TODAY >= e.minAt;
  return { n, total, pct: Math.min(100, (e.dayN / total) * 100), minPct: (e.minDays / total) * 100, canLook, over };
}
function readinessBar(e, compact) {
  const r = readiness(e);
  if (!r) return '';
  if (e.type === 'holdout') return `<div class="meter-row"><span class="nowrap">Холдаут · срез ${fmt(D(e.holdout.next))}</span></div>`;
  const cls = r.over ? 'over' : r.canLook ? 'ready' : '';
  const label = r.over ? `<b style="color:var(--crit)">+${dn(days(e.planEnd, TODAY))} сверх плана</b>`
    : e.d.platformEnd ? `<b style="color:#b4501f">завершён ${fmt(e.d.platformEnd)}</b>`
    : r.canLook ? '<b style="color:#b4501f">можно смотреть</b>'
    : `смотреть ${rel(e.minAt)}`;
  return `<div class="meter-row" data-tip="<b>День ${e.dayN} из ${r.total}</b><br>Можно смотреть с ${fmt(e.minAt, true)} (минимум ${dn(e.minDays)})<br>План окончания: ${fmt(e.planEnd, true)}<br>Выборка: ${e.sample}% от расчётной">
    <div class="meter ${cls}"><b style="width:${r.pct}%"></b><span class="tick" style="left:calc(${r.minPct}% - 1px)"></span></div>
    <span class="nowrap">${compact ? '' : `день ${e.dayN}/${r.total} · `}${label}</span></div>`;
}

function alertRow(a, { showExp = true, compact = false, meta = true } = {}) {
  const e = a.e;
  return `<div class="alert ${a.sev}">
    ${sevIcon(a.sev)}
    <div class="a-body">
      <div class="a-title">${esc(a.title)}</div>
      ${showExp ? `<div class="a-sub"><a href="#" data-open="${e.id}">${esc(e.short)}</a> <span class="muted">${e.tag}</span></div>` : ''}
      ${compact ? '' : `<div class="a-sub">${esc(a.sub)}</div>`}
      ${compact || !meta ? '' : `<div class="a-meta">${stageChip(e.stage)}${avatar(e.owner)}<span class="small ink2">${esc(e.owner)}</span>${a.due ? `<span class="small muted">· ${a.sev === 'crit' || a.sev === 'serious' ? 'с' : ''} ${fmt(a.due)} (${rel(a.due)})</span>` : ''}</div>`}
    </div>
    <div class="a-act">
      <button class="btn sm ${a.sev === 'crit' || a.sev === 'good' ? 'primary' : ''}" data-act="${a.act.k}" data-id="${e.id}">${esc(a.act.label)}</button>
      <button class="btn sm ghost" data-act="snooze" data-id="${e.id}" title="Отложить">Отложить</button>
    </div>
  </div>`;
}

/* ---------- паспорт эксперимента (общий для всех вариантов) ---------- */
const VAR_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const DARK_TEXT = ['#eda100'];

function splitBar(e) {
  let i = 0;
  const vs = e.variants.map((v) => ({ ...v, color: v.control ? '#898781' : VAR_COLORS[i++] }));
  return `<div class="split">${vs.map((v) => `<div class="${DARK_TEXT.includes(v.color) ? 'dk' : ''}" style="flex:${v.share};background:${v.color}" data-tip="<b>${v.v}</b> · ${v.share}%<br>${esc(v.name)}">${v.share >= 5 ? v.share + '%' : ''}</div>`).join('')}</div>
  <div class="stack" style="margin-top:10px;gap:5px">${vs.map((v) => `<div class="row small"><span class="dot" style="background:${v.color};border-radius:2px"></span><span class="mono" style="width:38px">${v.v}</span><span class="ink2 grow">${esc(v.name)}${v.control ? ' <span class="chip" style="height:18px">контроль</span>' : ''}</span><span class="tnum muted">${v.share}%</span></div>`).join('')}</div>`;
}

function forest(e) {
  const R = e.results;
  if (!R || !R.rows) return '';
  const rows = R.rows.filter((r) => !r.control);
  const ctrl = R.rows.find((r) => r.control);
  const lo = Math.min(0, R.threshold ?? 0, ...rows.map((r) => r.lo));
  const hi = Math.max(0, ...rows.map((r) => r.hi));
  const padv = (hi - lo) * 0.12 || 0.5;
  const L = lo - padv, H = hi + padv;
  const x = (v) => ((v - L) / (H - L)) * 100;
  const verdict = (r) => {
    if (r.verdict) return { c: '#2a78d6', t: `${r.verdict} · в пределах порога` };
    if (!r.sig) return { c: '#898781', t: 'незначимо' };
    const good = R.direction === 'down' ? r.delta < 0 : r.delta > 0;
    return good ? { c: '#2a78d6', t: `значимо ${r.delta > 0 ? '↑' : '↓'} · за гипотезу` } : { c: '#e34948', t: `значимо ${r.delta > 0 ? '↑' : '↓'} · против гипотезы` };
  };
  return `<div class="forest">
    <div class="forest-row head"><span>Вариант</span><span>Значение</span><span>Разница с контролем, п.п. (95% ДИ)</span><span>Вывод</span></div>
    <div class="forest-row"><span><span class="mono">${ctrl.v}</span> ${ctrl.label ? esc(ctrl.label) : 'контроль'}</span><span class="tnum">${num(ctrl.value)} %</span><span class="small muted">база для сравнения</span><span></span></div>
    ${rows.map((r) => { const vd = verdict(r); return `<div class="forest-row" data-tip="<b>${r.label || r.v}</b><br>${num(r.value)} % (Δ ${sgn(r.delta)} п.п.)<br>95% ДИ: ${sgn(r.lo)} … ${sgn(r.hi)}">
      <span><span class="mono">${r.v}</span> ${r.label ? esc(r.label) : esc((e.variants.find((v) => v.v === r.v) || {}).name || '')}</span>
      <span class="tnum">${num(r.value)} %</span>
      <div class="forest-plot">
        <span class="zero" style="left:${x(0)}%"></span>
        ${R.threshold != null ? `<span class="thr" style="left:${x(R.threshold)}%" title="Порог «не хуже»"></span>` : ''}
        <span class="ci" style="left:${x(r.lo)}%;width:${x(r.hi) - x(r.lo)}%;background:${vd.c}"></span>
        <span class="pt" style="left:${x(r.delta)}%;background:${vd.c}"></span>
      </div>
      <span class="small"><span class="tnum" style="font-weight:600">${sgn(r.delta)}</span> <span class="ink2">${vd.t}</span></span>
    </div>`; }).join('')}
    <div class="forest-row" style="border:0;padding-top:2px"><span></span><span></span><div class="small muted" style="position:relative;height:16px">${[lo, 0, hi].filter((v, i, a) => a.indexOf(v) === i).map((v) => `<span style="position:absolute;left:${x(v)}%;transform:translateX(-50%)" class="tnum">${v === 0 ? '0' : sgn(v)}</span>`).join('')}</div><span></span></div>
  </div>
  ${R.threshold != null ? `<div class="small muted" style="margin-top:6px">Красная линия — порог «не хуже»: ${sgn(R.threshold)} п.п.</div>` : ''}`;
}

function stepper(e) {
  const cur = STAGE[e.stage].i;
  const dateFor = { prep: e.d.created, enabling: e.d.enableStart, collecting: e.d.fullAt, ready: e.minAt && e.minAt <= TODAY ? e.minAt : null, rollout: e.decision ? D(e.decision.d) : null, cleanup: e.d.rolloutDoneAt, done: e.d.cleanupDoneAt };
  return `<div class="stepper">${STAGES.map((s, i) => `<div class="step ${i < cur ? 'done' : i === cur ? 'cur' : ''}" style="--c:${s.color}" title="${esc(s.hint)}"><span class="bar"></span><span>${s.name}<br><small>${dateFor[s.k] && i <= cur ? fmt(dateFor[s.k]) : '&nbsp;'}</small></span></div>`).join('')}</div>`;
}

function journal(e) {
  const evs = [...e.events].sort((a, b) => b._d - a._d);
  const color = { ab: 'var(--st-collecting)', on: 'var(--st-cleanup)', beta: 'var(--st-release)', pause: '#898781', plan: '#898781', result: 'var(--st-ready)', decision: 'var(--st-rollout)', sys: '#141413', toggle: 'var(--st-cleanup)', note: '#c3c2b7' };
  return `<div class="journal">${evs.map((ev) => `<div class="jrow ${ev._d > TODAY ? 'future' : ''}">
    <span class="jd">${fmt(ev._d, true)}</span>
    <span class="jdot"><i style="${ev._d > TODAY ? '' : 'background:' + color[ev.t]}"></i></span>
    <span class="jtxt">${ev.t === 'sys' ? '<span class="chip" style="height:18px;margin-right:6px">авто</span>' : ''}${esc(ev.txt)}${ev.b ? ` <span class="blk">· ${esc(blockList(ev.b))}</span>` : ''}${ev.v && ev.t !== 'ab' && !ev.txt.includes(ev.v) ? ` <span class="mono">${ev.v}</span>` : ''}${ev.sd ? `<span class="sd">${ev.sd}</span>` : ''}</span>
  </div>`).join('')}</div>`;
}

function toggleList(e) {
  if (!e.toggles.length) return '<div class="empty">Тоглов и рубильников нет</div>';
  const st = { todo: ['Не удалён', 'warn'], planned: ['Запланирован', 'info'], done: ['Удалён', 'good'] };
  return `<div class="stack" style="gap:6px">${e.toggles.map((x) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)">
    ${sevIcon(st[x.st][1])}
    <span class="grow"><span class="mono">${esc(x.n)}</span> <span class="muted small">· ${x.kind}</span>${x.where ? `<br><span class="small ink2">${esc(x.where)}</span>` : ''}</span>
    <span class="sev-label ${st[x.st][1]}">${st[x.st][0]}</span>
  </div>`).join('')}</div>`;
}

function crossBlock(e) {
  const c = e.cross;
  if (!c.clean && !c.mixed) return '<div class="empty">Нет пересечений: тест ещё не запущен или запущен без АБ</div>';
  return `<div class="split" style="height:22px"><div style="flex:${Math.max(c.clean, 1)};background:#1baf7a" data-tip="Чистая выборка: ${c.clean}%">${c.clean >= 8 ? c.clean + '%' : ''}</div><div style="flex:${c.mixed};background:#eb6834" data-tip="Смешанная: ${c.mixed}%">${c.mixed >= 8 ? c.mixed + '%' : ''}</div></div>
  <div class="row small ink2" style="margin-top:8px;gap:16px"><span class="row" style="gap:6px"><span class="dot" style="background:#1baf7a"></span>Чистых ${c.clean}%</span><span class="row" style="gap:6px"><span class="dot" style="background:#eb6834"></span>Смешанных ${c.mixed}%</span></div>
  ${c.with.length ? `<div class="small" style="margin-top:10px">Пересекается с: ${c.with.map((id) => EX[id] ? `<a href="#" data-open="${id}">${esc(EX[id].short)} №${EX[id].iter}</a>` : id).join(', ')}</div>` : ''}`;
}

function decisionBlock(e) {
  if (e.decision) {
    return `<div class="row" style="align-items:flex-start;gap:12px">${avatar(e.decision.who, true)}<div class="grow"><div><b>${esc(e.decision.who)}</b> <span class="muted small">${e.decision.d}</span></div><div style="margin-top:2px">${esc(e.decision.text)}</div>${e.decision.winner ? `<div style="margin-top:8px"><span class="chip">Итоговое значение: <span class="mono">${e.decision.winner}</span></span></div>` : ''}</div></div>`;
  }
  if (['ready'].includes(e.stage)) return `<div class="row"><span class="grow ink2">Решение ещё не записано. После записи сервис сам предложит план раскатки по блокам и задачу на удаление тоглов.</span><button class="btn primary" data-act="decide" data-id="${e.id}">Записать решение</button></div>`;
  return '<div class="empty">Решение принимается после сбора данных</div>';
}

function passportHTML(e) {
  const r = RELEASES.find((x) => x.v === e.release);
  return `
  <div class="drawer-head">
    <button class="btn ghost sm x" data-close>${ICON.x}</button>
    <div class="row wrap" style="margin-bottom:8px">${stageChip(e.stage)}${platChip(e.platform)}${typeChip(e)}${e.flags.includes('stopped') ? '<span class="chip">Остановлен досрочно</span>' : ''}<span class="chip outline">Релиз ${e.release}${r ? ' · ' + r.d.slice(0, 5) : ''}</span></div>
    <h2>${esc(e.feature)} <span class="muted" style="font-weight:500">№${e.iter}</span></h2>
    <div class="row wrap small ink2" style="margin-top:6px;gap:12px">
      <span class="row" style="gap:6px">${avatar(e.owner)}${esc(e.owner)}</span>
      <span>Рубильник <span class="mono" style="color:var(--ink)">${e.key}</span></span>
      <span>Ветка: ${esc(e.branch)} ${e.ver}</span>
    </div>
    <div class="conv-name"><span class="nowrap">Имя по конвенции</span><code>${esc(e.name)}</code><button class="btn ghost sm" data-copy="${esc(e.name)}" title="Скопировать">${ICON.copy}</button></div>
    <div class="row wrap small" style="margin-top:10px;gap:14px">
      <a href="#" data-act="link">Аналитика в Confluence ${ICON.ext}</a>
      <a href="#" data-act="link">АБ-платформа ${ICON.ext}</a>
      <a href="#" data-act="link">Строка в тираже ${ICON.ext}</a>
      <a href="#" data-act="link">Дашборд метрик ${ICON.ext}</a>
    </div>
  </div>
  <div class="drawer-body">
    ${e.alerts.length ? `<div class="stack">${e.alerts.map((a) => alertRow(a, { showExp: false, meta: false })).join('')}</div>` : ''}
    <div class="sec"><h3>Жизненный цикл</h3>${stepper(e)}</div>

    ${e.type !== 'rollout' && e.d.fullAt ? `<div class="sec"><h3>Когда смотреть результаты <span class="sp"></span>${readiness(e)?.canLook ? '<span class="sev-label good">Уже можно</span>' : `<span class="sev-label info">${e.minAt ? 'С ' + fmt(e.minAt, true) : ''}</span>`}</h3>
      ${readinessBar(e)}
      <div class="kv" style="margin-top:14px">
        <dt>На всех блоках с</dt><dd>${fmt(e.d.fullAt, true)} · ${e.d.platformEnd ? 'шёл' : 'идёт'} ${dn(e.dayN)}</dd>
        <dt>Минимальный срок</dt><dd>${dn(e.minDays)} → можно смотреть с <b>${fmt(e.minAt, true)}</b></dd>
        <dt>План окончания</dt><dd>${fmt(e.planEnd, true)}${e.d.platformEnd ? ` · фактически завершён ${fmt(e.d.platformEnd, true)}` : ''}</dd>
        <dt>Выборка</dt><dd>${e.sample}% от расчётной${e.subtests ? '<br>' + e.subtests.map((s) => `<span class="small ink2">${esc(s.name)}: ${s.sample}%</span>`).join('<br>') : ''}</dd>
      </div></div>` : ''}

    <div class="sec"><h3>Гипотеза и метрики</h3>
      <p>${esc(e.hypothesis)}</p>
      <div class="kv" style="margin-top:12px">
        <dt>Целевая метрика</dt><dd>${e.metric ? esc(e.metric) : '<span class="sev-label warn">Не заполнена</span>'}</dd>
        ${e.metric2 ? `<dt>Доп. метрика</dt><dd>${esc(e.metric2)}</dd>` : ''}
        ${e.blockers ? `<dt>Блокеры</dt><dd><span class="sev-label warn">${esc(e.blockers)}</span></dd>` : '<dt>Блокеры</dt><dd class="muted">Нет</dd>'}
      </div>
    </div>

    <div class="sec"><h3>Варианты и сплит</h3>${splitBar(e)}</div>

    ${e.results ? `<div class="sec"><h3>Результаты <span class="sp"></span>${e.results.status === 'ready' ? '<span class="sev-label serious">Посчитаны, не разобраны</span>' : e.results.status === 'invalid' ? '<span class="sev-label crit">Невалидны</span>' : '<span class="sev-label good">Разобраны</span>'}</h3>
      ${e.metric ? `<div class="small muted" style="margin-bottom:8px">${esc(e.metric)}</div>` : ''}
      ${forest(e)}
      <div class="small ink2" style="margin-top:10px">${esc(e.results.note)}</div></div>` : ''}

    <div class="sec"><h3>Решение</h3>${decisionBlock(e)}</div>

    <div class="sec"><h3>Где включено <span class="sp"></span><span class="small muted" style="font-weight:400">${e.coverage} из ${ALL_BLOCKS.length} блоков</span></h3>
      <div style="overflow-x:auto">${blockMatrix(e)}</div>
      <div style="margin-top:12px">${bmLegend()}</div>
    </div>

    <div class="sec"><h3>Журнал <span class="sp"></span><button class="btn sm" data-act="addevent" data-id="${e.id}">${ICON.plus} Событие</button></h3>${journal(e)}</div>

    <div class="sec"><h3>Тоглы и рубильники</h3>${toggleList(e)}</div>

    <div class="sec"><h3>Пересечения с другими АБ-тестами</h3>${crossBlock(e)}</div>
  </div>`;
}

function openPassport(id) {
  const e = EX[id]; if (!e) return;
  const dr = $('#drawer');
  dr.innerHTML = passportHTML(e);
  dr.classList.add('open');
  $('#scrim').classList.add('open');
  dr.querySelector('.drawer-body').scrollTop = 0;
}
function closePassport() { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); }

/* ---------- модалки и действия ---------- */
function toast(msg) {
  const t = $('#toast');
  t.innerHTML = `<span class="sev good" style="background:#2c3b2c;color:#9be39b">${ICON.good}</span>${msg}`;
  t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="modal">${html}</div>`; m.classList.add('open'); }
function closeModal() { $('#modal').classList.remove('open'); }

function rolloutPlan(start) {
  const steps = [['ГФ'], ['12', '9', '8', '7'], ['6', '5', '4'], ['3', '2', '1'], ['SI1', 'SI2', 'SI3', 'SI4']];
  let d = start; const out = [];
  for (const s of steps) {
    while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
    out.push({ d, b: s }); d = addDays(d, 1);
  }
  return out;
}

function decideModal(e) {
  const vs = e.variants;
  const best = e.results?.rows?.filter((r) => !r.control && r.sig).sort((a, b) => (e.results.direction === 'down' ? a.delta - b.delta : b.delta - a.delta))[0];
  const plan = rolloutPlan(addDays(TODAY, 1));
  openModal(`
  <div class="modal-h"><div class="grow"><h2>Записать решение</h2><div class="small ink2" style="margin-top:4px">${esc(e.feature)} №${e.iter}</div></div><button class="btn ghost sm" data-mclose>${ICON.x}</button></div>
  <div class="modal-b">
    <div class="field"><label>Что делаем</label>
      <div class="opt-list" data-group="kind">
        <label class="opt sel"><input type="radio" name="kind" checked> <span><b>Раскатываем победителя</b><br><span class="small ink2">Включаем выбранный вариант на все блоки</span></span></label>
        <label class="opt"><input type="radio" name="kind"> <span><b>Оставляем контроль</b><br><span class="small ink2">Эффекта нет или он отрицательный. Гипотезу закрываем</span></span></label>
        <label class="opt"><input type="radio" name="kind"> <span><b>Перезапуск, новая итерация №${e.iter + 1}</b><br><span class="small ink2">Сервис соберёт имя по конвенции и заведёт черновик</span></span></label>
        <label class="opt"><input type="radio" name="kind"> <span><b>Продлить тест</b><br><span class="small ink2">Укажите новую дату и причину</span></span></label>
      </div></div>
    <div class="field"><label>Победивший вариант</label>
      <select class="sel" style="width:100%">${vs.map((v) => `<option ${best && best.v === v.v ? 'selected' : ''}>${v.v} — ${esc(v.name)}</option>`).join('')}</select>
      ${best ? `<span class="small muted">Подсказка: лучший значимый результат у ${best.v} (${sgn(best.delta)} п.п.)</span>` : ''}
    </div>
    <div class="field"><label>Комментарий для тиража</label><textarea placeholder="Почему так решили, что смотрели"></textarea></div>
    <div class="field"><label>Что сделать автоматически</label>
      <label class="check"><input type="checkbox" checked> <span>Создать план раскатки по блокам: ${plan.map((p) => `${fmt(p.d)} — ${blockList(p.b)}`).join('; ')}</span></label>
      <label class="check"><input type="checkbox" checked> <span>Через 30 дней после полной раскатки напомнить удалить <span class="mono">${e.key}</span> и лишние ветки</span></label>
      <label class="check"><input type="checkbox" checked> <span>Записать итог в Confluence-аналитику и строку тиража</span></label>
    </div>
  </div>
  <div class="modal-f"><button class="btn" data-mclose>Отмена</button><button class="btn primary" data-confirm-decide="${e.id}">Сохранить решение</button></div>`);
}

function sdModal(e) {
  const np = e.nextPlan;
  openModal(`
  <div class="modal-h"><div class="grow"><h2>SD-заявка на включение</h2><div class="small ink2" style="margin-top:4px">Текст собран из паспорта. Останется только отправить</div></div><button class="btn ghost sm" data-mclose>${ICON.x}</button></div>
  <div class="modal-b">
    <div class="kv">
      <dt>Фича / рубильник</dt><dd class="mono">${e.key}</dd>
      <dt>Значение</dt><dd>${e.stage === 'rollout' ? (e.decision?.winner || '') : 'АБ: ' + e.variants.map((v) => v.v + ' — ' + v.share + '%').join(', ')}</dd>
      <dt>Среда</dt><dd>ПРОМ</dd>
      <dt>Блоки</dt><dd>${np ? blockList(np.blocks) : '—'}</dd>
      <dt>Дата</dt><dd>${np ? fmt(np.d, true) : '—'}</dd>
      <dt>Проверка конфига</dt><dd><span class="sev-label good">Значение совпадает с бетой (ветка _beta)</span></dd>
      <dt>Ссылка на аналитику</dt><dd><a href="#">Confluence · ${esc(e.feature)}</a></dd>
      <dt>Исполнитель</dt><dd>${dutyNow()} (дежурный по включению)</dd>
    </div>
  </div>
  <div class="modal-f"><button class="btn" data-mclose>Отмена</button><button class="btn" data-copy="Заявка: ${esc(e.key)}">Скопировать текст</button><button class="btn primary" data-confirm-sd="${e.id}">Создать заявку</button></div>`);
}

function addEventModal(e) {
  openModal(`
  <div class="modal-h"><div class="grow"><h2>Новое событие</h2><div class="small ink2" style="margin-top:4px">Вместо свободного текста в ячейке тиража: блоки и значение обновят матрицу сами</div></div><button class="btn ghost sm" data-mclose>${ICON.x}</button></div>
  <div class="modal-b">
    <div class="row" style="gap:12px">
      <div class="field grow"><label>Дата</label><input type="text" value="${fmt(TODAY, true)}"></div>
      <div class="field grow"><label>Что произошло</label><select class="sel"><option>Включён АБ</option><option>Включено значение</option><option>Запланировано включение</option><option>АБ остановлен</option><option>Заметка</option></select></div>
    </div>
    <div class="field"><label>Блоки</label>
      <div class="row wrap" style="gap:6px">${['Бета+', ...ALL_BLOCKS].map((b) => `<label class="chip outline" style="cursor:pointer"><input type="checkbox" style="margin:0 4px 0 0">${b}</label>`).join('')}</div>
      <div class="row" style="gap:6px"><button class="btn sm ghost">ГФ</button><button class="btn sm ghost">12, 9, 8, 7</button><button class="btn sm ghost">6, 5, 4</button><button class="btn sm ghost">3, 2, 1</button><button class="btn sm ghost">SI1–SI4</button><button class="btn sm ghost">Все</button></div>
    </div>
    <div class="row" style="gap:12px">
      <div class="field grow"><label>Значение / версия</label><input type="text" placeholder="2.0"></div>
      <div class="field grow"><label>SD-заявка</label><input type="text" placeholder="SD000…"></div>
    </div>
    <div class="field"><label>Комментарий</label><textarea placeholder="Необязательно"></textarea></div>
  </div>
  <div class="modal-f"><button class="btn" data-mclose>Отмена</button><button class="btn primary" data-confirm-generic="Событие добавлено, матрица блоков обновлена">Добавить</button></div>`);
}

function newTestModal() {
  openModal(`
  <div class="modal-h"><div class="grow"><h2>Новый АБ-тест</h2><div class="small ink2" style="margin-top:4px">Имя собирается по конвенции автоматически</div></div><button class="btn ghost sm" data-mclose>${ICON.x}</button></div>
  <div class="modal-b" id="nt">
    <div class="row" style="gap:12px">
      <div class="field" style="width:140px"><label>Платформа</label><select class="sel" data-nt="platform"><option>Android</option><option>iOS</option></select></div>
      <div class="field grow"><label>Название фичи (без «АБ-тест»)</label><input type="text" data-nt="feature" value="Стиль уведомлений. Выводим 4+ стили"></div>
    </div>
    <div class="row" style="gap:12px">
      <div class="field" style="width:110px"><label>№ итерации</label><input type="text" data-nt="iter" value="15"></div>
      <div class="field grow"><label>Суть теста (ветка)</label><input type="text" data-nt="branch" value="описание стиля Мини"></div>
      <div class="field" style="width:90px"><label>Версия</label><input type="text" data-nt="ver" value="V2"></div>
    </div>
    <div class="row" style="gap:12px">
      <div class="field grow"><label>Варианты рубильника</label><input type="text" data-nt="range" value="54.0-56.0"></div>
      <div class="field grow"><label>Дата запуска</label><input type="text" data-nt="launch" value="24.11.2026"></div>
    </div>
    <div class="row" style="gap:12px">
      <div class="field grow"><label>Целевая метрика</label><input type="text" value="Конверсия в установку стиля «Мини»"></div>
      <div class="field" style="width:150px"><label>Мин. срок, дней</label><input type="text" value="14"></div>
    </div>
    <div class="conv-name" style="margin-top:0"><span class="nowrap">Имя</span><code id="nt-name"></code></div>
    <div class="small muted">Сервис подскажет, что №14 уже был (V1), и предложит поднять версию сути теста при перезапуске.</div>
  </div>
  <div class="modal-f"><button class="btn" data-mclose>Отмена</button><button class="btn primary" data-confirm-generic="Черновик создан: строка в тираже и тест на АБ-платформе">Создать черновик</button></div>`);
  const upd = () => {
    const v = (k) => $(`[data-nt="${k}"]`).value;
    $('#nt-name').textContent = `[${TEAM.name}] ${v('platform')}. ${v('feature')}. №${v('iter')} Ветка: ${v('branch')} ${v('ver')}. ${v('range')}. ${v('launch')}`;
  };
  $$('#nt [data-nt]').forEach((i) => i.addEventListener('input', upd)); upd();
}

function applyDecision(id) {
  const e = EX[id];
  const plan = rolloutPlan(addDays(TODAY, 1));
  const best = e.results?.rows?.filter((r) => !r.control && r.sig).sort((a, b) => (e.results.direction === 'down' ? a.delta - b.delta : b.delta - a.delta))[0];
  const winner = (best && best.v) || e.variants.find((v) => !v.control).v;
  e.decision = { d: fmt(TODAY, true), who: ME, winner, text: `Раскатываем ${winner} на всех. План раскатки создан автоматически.` };
  e.stage = 'rollout';
  e.platform = 'Завершён';
  if (e.results) e.results.status = 'reviewed';
  e.events.push({ d: fmt(TODAY, true), t: 'decision', txt: `Решение: раскатываем ${winner}` });
  plan.forEach((p, i) => e.events.push({ d: fmt(p.d, true), t: 'plan', b: p.b, v: winner, txt: `План: включить ${winner}`, sd: i === 0 ? 'SD0002460' + (100 + Math.floor(Math.random() * 800)) : undefined }));
  prepare(e);
  closeModal();
  toast('Решение записано. План раскатки и напоминание об удалении тоглов созданы');
  rerender();
  if ($('#drawer').classList.contains('open')) openPassport(id);
}

/* ---------- tooltip ---------- */
function initTips() {
  const tip = $('#tip');
  document.addEventListener('mouseover', (ev) => {
    const el = ev.target.closest('[data-tip]');
    if (!el) { tip.classList.remove('show'); return; }
    tip.innerHTML = el.getAttribute('data-tip');
    tip.classList.add('show');
  });
  document.addEventListener('mousemove', (ev) => {
    if (!tip.classList.contains('show')) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
}

/* ---------- маршрутизация ---------- */
const VIEWS = {};
let currentView = 'overview';
function rerender() { (VIEWS[currentView] || VIEWS.overview).render($('#view')); }
function route() {
  const h = (location.hash || '#overview').slice(1);
  currentView = VIEWS[h] ? h : 'overview';
  $$('.demo-tabs a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + currentView));
  closePassport();
  rerender();
  window.scrollTo(0, 0);
}

function appHead(extra = '') {
  return `<div class="app-head">
    <div class="logo"><span class="logo-mark">Р</span>Радар АБ</div>
    <span class="team-pick">[${TEAM.name}] · ${TEAM.platform} ${ICON.chev}</span>
    <div class="search">${ICON.search}<input placeholder="Фича, рубильник, SD, №итерации…"></div>
    <span class="sp"></span>${extra}
    <button class="btn" data-act="newtest">${ICON.plus} Новый АБ-тест</button>
    <span class="row" style="gap:8px">${avatar(ME, true)}</span>
  </div>`;
}

/* ---------- глобальные обработчики ---------- */
function initGlobal() {
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    const open = t.closest('[data-open]');
    if (open) { ev.preventDefault(); openPassport(open.dataset.open); return; }
    if (t.closest('[data-close]') || t.id === 'scrim') { closePassport(); return; }
    if (t.closest('[data-mclose]') || t.id === 'modal') { closeModal(); return; }
    const cp = t.closest('[data-copy]');
    if (cp) { navigator.clipboard?.writeText(cp.dataset.copy).catch(() => {}); toast('Скопировано'); return; }
    const cd = t.closest('[data-confirm-decide]');
    if (cd) { applyDecision(cd.dataset.confirmDecide); return; }
    const cs = t.closest('[data-confirm-sd]');
    if (cs) {
      const e = EX[cs.dataset.confirmSd];
      if (e.nextPlan) { const ev = e.events.find((x) => x.t === 'plan' && x._d && x._d.getTime() === e.nextPlan.d.getTime()); if (ev) ev.sd = 'SD0002461' + (100 + Math.floor(Math.random() * 800)); }
      prepare(e); closeModal(); toast('SD-заявка создана и привязана к шагу включения'); rerender();
      if ($('#drawer').classList.contains('open')) openPassport(e.id);
      return;
    }
    const cg = t.closest('[data-confirm-generic]');
    if (cg) { closeModal(); toast(cg.dataset.confirmGeneric); return; }
    const opt = t.closest('.opt');
    if (opt) { const g = opt.parentElement; $$('.opt', g).forEach((o) => o.classList.remove('sel')); opt.classList.add('sel'); }
    const act = t.closest('[data-act]');
    if (act) {
      ev.preventDefault();
      const e = EX[act.dataset.id];
      switch (act.dataset.act) {
        case 'decide': decideModal(e); break;
        case 'results': openPassport(e.id); setTimeout(() => { const s = $$('#drawer .sec').find((x) => x.textContent.startsWith('Результаты')); s && s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 260); break;
        case 'sd': sdModal(e); break;
        case 'plan': sdModal(e); break;
        case 'addevent': addEventModal(e); break;
        case 'newtest': newTestModal(); break;
        case 'snooze': toast('Отложено до завтра 10:00'); break;
        case 'remind': toast(`Напомню ${e.minAt ? fmtH(e.minAt) : 'в день среза'} в 10:00`); break;
        case 'archive': toast('Черновик на АБ-платформе отправлен в архив'); break;
        case 'cleanup': toast('Добавлено в «Удаление тоглов, ч. 22» (релиз 17.16)'); break;
        case 'cross': openPassport(e.id); setTimeout(() => { const s = $$('#drawer .sec').find((x) => x.textContent.startsWith('Пересечения')); s && s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 260); break;
        case 'link': toast('В рабочей версии откроется внешняя ссылка'); break;
        case 'open': default: if (e) openPassport(e.id);
      }
    }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { closeModal(); closePassport(); } });
  window.addEventListener('hashchange', route);
}
