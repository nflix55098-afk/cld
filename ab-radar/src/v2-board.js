/* ===================== 2. Конвейер (канбан) ===================== */

const boardState = { release: 'all', owner: 'all', problems: false, showDone: true };

const TRANSITION_RULES = {
  enabling: ['Целевая метрика и минимальный срок заполнены', 'Сплит и версии рубильника совпадают с АБ-платформой', 'Значение в бете совпадает с конфигом в ветке _beta', 'Есть план включения по блокам и SD на первый шаг'],
  collecting: ['АБ включён на всех 15 блоках', 'Дата «можно смотреть» рассчитана'],
  ready: ['Набран минимальный срок или тест завершён на платформе'],
  rollout: ['Записано решение и победивший вариант', 'Итог записан в аналитику', 'Создан план раскатки по блокам'],
  cleanup: ['Победитель включён на всех блоках', 'Создана задача «Удаление тоглов» с номером части и релизом'],
  done: ['Рубильники и ветки удалены', 'Черновики на АБ-платформе архивированы'],
};

function cardBody(e) {
  switch (e.stage) {
    case 'prep':
      return `<div class="small ink2">Создан ${fmt(e.d.created)} · ${e.blockers ? `<span class="sev-label warn">${esc(e.blockers)}</span>` : 'без блокеров'}</div>`;
    case 'release': {
      const r = RELEASES.find((x) => x.v === e.release);
      return `<div class="small ink2">Релиз ${e.release} · ${r ? r.d.slice(0, 5) : ''} → старт АБ ${fmt(e.d.plannedStart)}</div>${e.beta ? '<div class="small muted">Пилот на бете включён</div>' : ''}`;
    }
    case 'enabling':
    case 'rollout':
      return `<div class="row">${miniBlocks(e)}<span class="small muted">${e.coverage}/${ALL_BLOCKS.length}</span></div>
        <div class="small ink2">${e.nextPlan ? `Дальше ${fmt(e.nextPlan.d)}: ${blockList(e.nextPlan.blocks)}` : '<span class="sev-label warn">Нет следующего шага</span>'}</div>`;
    case 'collecting':
      return readinessBar(e, true);
    case 'ready':
      return `${readinessBar(e, true)}<div class="small ink2">${e.d.platformEnd ? `Завершён ${fmt(e.d.platformEnd)}` : `Платформа: ${e.platform}`} · решения нет</div>`;
    case 'cleanup': {
      const done = e.toggles.filter((x) => x.st === 'done').length;
      return `<div class="row small ink2"><span class="grow">Тоглы удалены: ${done} из ${e.toggles.length}</span></div>
        <div class="meter" style="background:#d9ecd9"><b style="width:${(done / Math.max(1, e.toggles.length)) * 100}%;background:var(--st-cleanup)"></b></div>`;
    }
    case 'done': {
      return `<div class="small ink2">${outcome(e)} · ${e.decision ? fmt(D(e.decision.d)) : ''}</div>`;
    }
    default: return '';
  }
}

function stageAge(e) {
  const map = { prep: e.d.created, release: e.d.created, enabling: e.d.enableStart, collecting: e.d.fullAt, ready: e.d.platformEnd || e.minAt, rollout: e.decision ? D(e.decision.d) : null, cleanup: e.d.rolloutDoneAt, done: e.d.cleanupDoneAt || (e.decision ? D(e.decision.d) : null) };
  const d = map[e.stage];
  return d ? days(d, TODAY) : null;
}

function boardCard(e) {
  const top = e.alerts.filter((a) => ['crit', 'serious', 'warn'].includes(a.sev));
  const age = stageAge(e);
  const edge = top.length ? `box-shadow: inset 3px 0 0 var(--${top[0].sev}), var(--shadow)` : '';
  return `<div class="kcard" draggable="true" data-id="${e.id}" style="${edge}">
    <div class="row" style="align-items:flex-start"><a href="#" data-open="${e.id}" class="grow ktitle">${esc(e.short)}</a></div>
    <div class="row small muted" style="gap:6px"><span>${e.tag}</span>·<span>${e.release}</span>${e.type === 'holdout' ? '· <span>холдаут</span>' : ''}${e.type === 'rollout' ? '· <span>без АБ</span>' : ''}</div>
    ${cardBody(e)}
    ${top.length ? `<div class="stack" style="gap:4px">${top.slice(0, 2).map((a) => `<div class="row small" style="gap:6px;align-items:flex-start">${sevIcon(a.sev)}<span>${esc(a.title)}</span></div>`).join('')}</div>` : ''}
    <div class="row" style="margin-top:2px">${avatar(e.owner)}<span class="small muted grow nowrap" style="overflow:hidden;text-overflow:ellipsis">${esc(e.owner)}</span>${age != null ? `<span class="small nowrap ${age > 14 && !['done', 'collecting'].includes(e.stage) ? '' : 'muted'}" title="Дней на текущей стадии">${age} дн. на стадии</span>` : ''}</div>
  </div>`;
}

function renderBoard(root) {
  const S = boardState;
  let list = EXPERIMENTS.slice();
  if (S.release !== 'all') list = list.filter((e) => e.release === S.release);
  if (S.owner !== 'all') list = list.filter((e) => e.owner === S.owner);
  if (S.problems) list = list.filter((e) => e.alerts.some((a) => ['crit', 'serious', 'warn'].includes(a.sev)));
  const stages = S.showDone ? STAGES : STAGES.filter((s) => s.k !== 'done');
  const rels = [...new Set(EXPERIMENTS.map((e) => e.release))].sort();

  root.innerHTML = `${appHead()}
  <style>
    .board { display:grid; grid-template-columns: repeat(${stages.length}, minmax(220px, 1fr)); gap: 12px; overflow-x: auto; padding-bottom: 12px; }
    .kcol { background: #ebeae6; border-radius: 12px; padding: 10px; display:flex; flex-direction:column; gap: 8px; min-height: 420px; }
    .kcol.drop { background: #e1e8f3; box-shadow: inset 0 0 0 2px #2a78d6; }
    .kcol-h { display:flex; align-items:center; gap:8px; padding: 2px 4px 6px; font-weight: 650; font-size: 13px; }
    .kcol-h .cnt { color: var(--muted); font-weight: 500; }
    .kcol-h .bar { height: 4px; border-radius: 2px; flex: 0 0 18px; }
    .kcol-sub { font-size: 11.5px; color: var(--ink-2); padding: 0 4px 4px; min-height: 32px; }
    .kcard { background: var(--surface); border-radius: 10px; box-shadow: var(--shadow); padding: 10px 12px; display:flex; flex-direction:column; gap: 7px; cursor: grab; }
    .kcard:hover { box-shadow: 0 0 0 1px var(--line-2), 0 3px 10px rgba(0,0,0,.07); }
    .kcard.dragging { opacity: .4; }
    .ktitle { color: var(--ink); font-weight: 600; font-size: 13px; line-height: 1.3; }
    .kcard .mini-bm { gap: 1px; } .kcard .mini-bm i { width: 7px; height: 7px; } .kcard .mini-bm i.sep { width: 3px; }
    .kwarn { font-size: 11.5px; padding: 6px 8px; border-radius: 8px; background: #fdeee7; color: #8a3a16; }
  </style>
  <div class="page" style="max-width:none">
    <div class="page-title">
      <div class="grow"><h1>Конвейер АБ-тестов</h1><div class="sub">Перетащите карточку в следующую колонку: сервис покажет чек-лист перехода</div></div>
    </div>
    <div class="row wrap" style="margin-bottom:16px;gap:10px">
      <select class="sel" id="f-rel"><option value="all">Все релизы</option>${rels.map((r) => `<option ${S.release === r ? 'selected' : ''} value="${r}">Релиз ${r}</option>`).join('')}</select>
      <select class="sel" id="f-own"><option value="all">Все владельцы</option>${PEOPLE.map((p) => `<option ${S.owner === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      <span class="toggle ${S.problems ? 'on' : ''}" id="f-prob"><i></i>Только с проблемами</span>
      <span class="toggle ${S.showDone ? 'on' : ''}" id="f-done"><i></i>Показывать архив</span>
      <span class="sp"></span>
      <span class="small muted">Левая цветная полоса на карточке — самое серьёзное предупреждение</span>
    </div>
    <div class="board">
      ${stages.map((s) => { const items = list.filter((e) => e.stage === s.k); const bottleneck = s.k === 'ready' && items.length >= 2;
        return `<div class="kcol" data-stage="${s.k}">
          <div class="kcol-h"><span class="bar" style="background:${s.color}"></span>${s.name}<span class="cnt">${items.length}</span></div>
          <div class="kcol-sub">${s.hint}</div>
          ${bottleneck ? `<div class="kwarn">Узкое место: ${items.length} теста ждут разбора. Новые тесты лучше не запускать, пока эти не разобраны</div>` : ''}
          ${items.map(boardCard).join('') || '<div class="empty" style="text-align:center">Пусто</div>'}
        </div>`; }).join('')}
    </div>
  </div>`;

  $('#f-rel').onchange = (ev) => { S.release = ev.target.value; renderBoard(root); };
  $('#f-own').onchange = (ev) => { S.owner = ev.target.value; renderBoard(root); };
  $('#f-prob').onclick = () => { S.problems = !S.problems; renderBoard(root); };
  $('#f-done').onclick = () => { S.showDone = !S.showDone; renderBoard(root); };

  let dragId = null;
  $$('.kcard', root).forEach((c) => {
    c.addEventListener('dragstart', (ev) => { dragId = c.dataset.id; c.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; });
    c.addEventListener('dragend', () => c.classList.remove('dragging'));
  });
  $$('.kcol', root).forEach((col) => {
    col.addEventListener('dragover', (ev) => { ev.preventDefault(); col.classList.add('drop'); });
    col.addEventListener('dragleave', () => col.classList.remove('drop'));
    col.addEventListener('drop', (ev) => { ev.preventDefault(); col.classList.remove('drop'); if (dragId) transitionModal(EX[dragId], col.dataset.stage, root); });
  });
}

function transitionModal(e, to, root) {
  if (e.stage === to) return;
  const rules = TRANSITION_RULES[to] || ['Подтвердите переход'];
  const auto = {
    'АБ включён на всех 15 блоках': e.coverage === ALL_BLOCKS.length,
    'Целевая метрика и минимальный срок заполнены': !!e.metric,
    'Записано решение и победивший вариант': !!e.decision,
    'Победитель включён на всех блоках': e.onCount === ALL_BLOCKS.length,
    'Набран минимальный срок или тест завершён на платформе': (e.minAt && e.minAt <= TODAY) || e.platform === 'Завершён',
  };
  const items = rules.map((r) => ({ r, ok: auto[r] !== undefined ? auto[r] : null }));
  const blocked = items.some((i) => i.ok === false);
  openModal(`
    <div class="modal-h"><div class="grow"><h2>Перевести в «${STAGE[to].name}»</h2><div class="small ink2" style="margin-top:4px">${esc(e.short)} ${e.tag} · сейчас: ${STAGE[e.stage].name}</div></div><button class="btn ghost sm" data-mclose>${ICON.x}</button></div>
    <div class="modal-b">
      <div class="small ink2">Чек-лист перехода. Пункты, которые сервис проверяет сам, отмечены автоматически</div>
      <div class="stack" style="gap:6px">${items.map((i) => `<label class="check" style="padding:8px 10px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink)">
        ${i.ok === null ? '<input type="checkbox">' : i.ok ? sevIcon('good') : sevIcon('crit')}
        <span class="grow">${i.r}${i.ok === false ? '<br><span class="small" style="color:var(--crit)">Не выполнено: проверьте паспорт</span>' : i.ok ? '<br><span class="small muted">Проверено автоматически</span>' : ''}</span></label>`).join('')}</div>
      ${to === 'rollout' && !e.decision ? `<div class="alert warn">${sevIcon('warn')}<div class="a-body"><div class="a-title">Сначала запишите решение</div><div class="a-sub">План раскатки создастся из него автоматически</div></div><div class="a-act"><button class="btn sm primary" data-act="decide" data-id="${e.id}">Записать решение</button></div></div>` : ''}
    </div>
    <div class="modal-f"><button class="btn" data-mclose>Отмена</button><button class="btn primary" id="tr-ok" ${blocked ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>Перевести</button></div>`);
  const ok = $('#tr-ok');
  if (!blocked) ok.onclick = () => { e.stage = to; prepare(e); closeModal(); toast(`Перенесено в «${STAGE[to].name}»`); renderBoard(root); };
}

VIEWS.board = { render: renderBoard };
