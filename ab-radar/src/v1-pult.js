/* ===================== 1. Пульт ===================== */

const pultState = { scope: 'team', stage: null };

function bucketOf(a) {
  if (a.sev === 'crit' || a.sev === 'serious') return 'overdue';
  if (a.sev === 'warn' || a.sev === 'good') return 'today';
  if (a.due && days(TODAY, a.due) <= 0) return 'today';
  if (a.due && days(TODAY, a.due) <= 7) return 'week';
  return 'later';
}

function renderPult(root) {
  const S = pultState;
  let alerts = allAlerts();
  if (S.scope === 'mine') alerts = alerts.filter((a) => a.e.owner === ME || (a.rule === 'needsd' && dutyNow() === ME));
  if (S.stage) alerts = alerts.filter((a) => S.stage.includes(a.e.stage));

  const B = { overdue: [], today: [], week: [], later: [] };
  alerts.forEach((a) => B[bucketOf(a)].push(a));
  B.week.sort((a, b) => a.due - b.due); B.later.sort((a, b) => (a.due || 0) - (b.due || 0));

  const by = (ks) => EXPERIMENTS.filter((e) => ks.includes(e.stage));
  const tiles = [
    { k: ['enabling'], label: 'Включаются', foot: () => { const s = by(['enabling']).filter((e) => e.alerts.some((a) => a.rule === 'stuck')).length; return s ? `<b>${s} застряло</b>` : 'по плану'; } },
    { k: ['collecting'], label: 'Сбор данных', foot: () => { const w = by(['collecting']).filter((e) => e.minAt && days(TODAY, e.minAt) <= 7 && e.type !== 'holdout').length; return `${w} можно смотреть на этой неделе`; } },
    { k: ['ready'], label: 'Готовы к анализу', foot: () => { const n = by(['ready']).filter((e) => !e.decision).length; return n ? `<b>${n} без решения</b>` : 'всё разобрано'; } },
    { k: ['rollout'], label: 'Раскатка решения', foot: () => { const e = by(['rollout'])[0]; return e && e.nextPlan ? `следующий шаг ${fmt(e.nextPlan.d)}` : 'нет шагов'; } },
    { k: ['cleanup'], label: 'Ждут чистки', foot: () => { const n = by(['cleanup']).filter((e) => e.alerts.some((a) => a.sev === 'serious')).length; return n ? `<b>${n} дольше 30 дней</b>` : 'в сроке'; } },
  ];

  const live = EXPERIMENTS.filter((e) => ['collecting', 'ready'].includes(e.stage) && e.platform === 'Запущен')
    .sort((a, b) => (a.minAt || 0) - (b.minAt || 0));
  const moving = EXPERIMENTS.filter((e) => ['enabling', 'rollout'].includes(e.stage));
  const finished = EXPERIMENTS.filter((e) => e.decision && days(D(e.decision.d), TODAY) <= 45 && e.type !== 'rollout')
    .sort((a, b) => D(b.decision.d) - D(a.decision.d));

  const bucket = (key, title, list, hint) => `
    <div class="section-label">${title} <span class="cnt">${list.length}</span>${hint ? `<span style="text-transform:none;letter-spacing:0;font-weight:400" class="muted">${hint}</span>` : ''}</div>
    ${list.length ? `<div class="stack">${list.map((a) => alertRow(a)).join('')}</div>` : '<div class="empty">Ничего нет</div>'}`;

  const h = TODAY;
  root.innerHTML = `${appHead()}
  <div class="page">
    <div class="page-title">
      <div class="grow"><h1>Доброе утро, ${ME.split(' ')[0]}</h1>
        <div class="sub">${WD[h.getDay()][0].toUpperCase() + WD[h.getDay()].slice(1)}, ${h.getDate()} ${['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][h.getMonth()]} · ${B.overdue.length + B.today.length} дел требуют внимания, из них ${B.overdue.length} просрочено · вы дежурите по включению на этой неделе</div></div>
      <div class="seg" id="scope"><button class="${S.scope === 'team' ? 'on' : ''}" data-scope="team">Вся команда</button><button class="${S.scope === 'mine' ? 'on' : ''}" data-scope="mine">Мои</button></div>
    </div>

    <div class="tiles">
      ${tiles.map((t) => { const n = by(t.k).length; const on = S.stage && S.stage.join() === t.k.join(); return `<button class="tile ${on ? 'on' : ''}" data-stage="${t.k.join(',')}">
        <span class="lbl">${stageDot(t.k[0])}${t.label}</span><span class="val">${n}</span><span class="foot">${t.foot()}</span></button>`; }).join('')}
    </div>
    ${S.stage ? `<div class="row" style="margin:-8px 0 8px"><span class="chip">Фильтр: ${STAGE[S.stage[0]].name}</span><button class="btn sm ghost" data-stage="">Сбросить</button></div>` : ''}

    <div class="grid-2">
      <div>
        ${bucket('overdue', 'Просрочено', B.overdue)}
        ${bucket('today', 'Сделать сегодня', B.today)}
        ${bucket('week', 'На этой неделе', B.week, ' до ' + fmt(addDays(TODAY, 7)))}
        ${bucket('later', 'Позже', B.later)}
      </div>
      <div class="stack" style="gap:16px;position:sticky;top:64px">
        <div class="card"><div class="card-h"><h3>Сейчас в эфире</h3><span class="sp"></span><span class="small muted">${live.length} ${plural(live.length, 'тест', 'теста', 'тестов')}</span></div>
          <div class="card-b stack" style="gap:12px">
          ${live.map((e) => `<div class="stack" style="gap:4px"><div class="row"><a href="#" data-open="${e.id}" class="grow" style="color:var(--ink);font-weight:550">${esc(e.short)}</a><span class="muted small nowrap">${e.tag}</span></div>${readinessBar(e)}</div>`).join('')}
          </div></div>

        <div class="card"><div class="card-h"><h3>Включение по блокам</h3></div>
          <div class="card-b stack" style="gap:12px">
          ${moving.map((e) => `<div class="stack" style="gap:6px"><div class="row">${stageDot(e.stage)}<a href="#" data-open="${e.id}" class="grow" style="color:var(--ink);font-weight:550">${esc(e.short)}</a></div>
            <div class="row">${miniBlocks(e)}<span class="small muted nowrap">${e.coverage}/${ALL_BLOCKS.length}</span></div>
            <div class="small ink2">${e.nextPlan ? `Дальше: ${fmt(e.nextPlan.d)} — ${blockList(e.nextPlan.blocks)} ${e.nextPlan.sd ? '<span class="mono muted">' + e.nextPlan.sd + '</span>' : '<span class="sev-label warn">нет SD</span>'}` : '<span class="sev-label warn">Следующий шаг не запланирован</span>'}</div></div>`).join('')}
          <div style="margin-top:4px">${bmLegend()}</div>
          </div></div>

        <div class="card"><div class="card-h"><h3>Недавно завершены</h3></div>
          <div class="card-b stack" style="gap:10px">
          ${finished.map((e) => { const out = outcome(e); return `<div class="row"><a href="#" data-open="${e.id}" class="grow" style="color:var(--ink)">${esc(e.short)} <span class="muted small">№${e.iter}</span></a><span class="chip">${out}</span></div>`; }).join('')}
          </div></div>

        <div class="card"><div class="card-h"><h3>Дежурные по включению</h3></div>
          <div class="card-b stack" style="gap:8px">
          ${DUTY.map((d) => `<div class="row">${avatar(d.who)}<span class="grow ${d.now ? '' : 'ink2'}" style="${d.now ? 'font-weight:600' : ''}">${d.who}${d.who === ME ? ' (вы)' : ''}</span><span class="small muted tnum">${d.week}</span>${d.now ? '<span class="chip">сейчас</span>' : ''}</div>`).join('')}
          </div></div>
      </div>
    </div>
  </div>`;

  $$('[data-scope]', root).forEach((b) => b.addEventListener('click', () => { S.scope = b.dataset.scope; renderPult(root); }));
  $$('[data-stage]', root).forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.stage; S.stage = !v || (S.stage && S.stage.join() === v) ? null : v.split(','); renderPult(root);
  }));
}

VIEWS.pult = { render: renderPult };
