/* ===================== 5. Ассистент в мессенджере ===================== */

const chatState = { msgs: null, flow: null, settings: { daily: true, weekly: true, escalate: true, ev: [true, true, true, true, true, true, false] } };

function digestHTML() {
  const al = mergedAlerts();
  const B = { overdue: [], today: [], week: [] };
  al.forEach((a) => { const b = bucketOf(a); if (B[b]) B[b].push(a); });
  B.week.sort((a, b) => a.due - b.due);
  const line = (a) => `<div class="cm-li">${sevIcon(a.sev)}<span><a href="#" data-open="${a.e.id}">${esc(a.group ? a.e.feature : a.e.short)}</a> <span class="muted">${a.group ? a.group.length + ' теста' : a.e.tag}</span><br><span class="ink2">${esc(a.title)}</span></span></div>`;
  return `<div style="font-weight:650;margin-bottom:6px">Сводка по АБ-тестам · [${TEAM.name}] ${TEAM.platform} · ${TODAY.getDate()} ноября</div>
    <div class="ink2" style="margin-bottom:10px">${(() => { const a = EXPERIMENTS.filter((e) => ['collecting', 'ready'].includes(e.stage) && e.platform === 'Запущен').length; const b = EXPERIMENTS.filter((e) => ['enabling', 'rollout'].includes(e.stage)).length; const c = EXPERIMENTS.filter((e) => e.stage === 'ready' && !e.decision).length; return `В эфире ${a} ${plural(a, 'тест', 'теста', 'тестов')}, включаются ${b}, ждут решения ${c}.`; })()}</div>
    <div class="cm-sec">Просрочено · ${B.overdue.length}</div>${B.overdue.map(line).join('')}
    <div class="cm-sec">Сделать сегодня · ${B.today.length}</div>${B.today.slice(0, 4).map(line).join('')}${B.today.length > 4 ? `<div class="muted small" style="padding-left:28px">и ещё ${B.today.length - 4}</div>` : ''}
    <div class="cm-sec">На этой неделе · ${B.week.length}</div>${B.week.map(line).join('')}`;
}

function statusCard(e) {
  return `<div style="font-weight:650">${esc(e.short)} <span class="muted">${e.tag}</span></div>
  <div class="row wrap" style="margin:6px 0">${stageChip(e.stage)}<span class="chip outline">АБ-платформа: ${e.platform}</span></div>
  <div class="row" style="margin:6px 0">${miniBlocks(e)}<span class="small muted">${e.coverage}/${ALL_BLOCKS.length} блоков</span></div>
  ${e.d.fullAt ? readinessBar(e) : ''}
  ${e.nextPlan ? `<div class="small ink2" style="margin-top:6px">Следующий шаг: ${fmt(e.nextPlan.d)} — ${blockList(e.nextPlan.blocks)}</div>` : ''}
  ${e.alerts[0] ? `<div class="row small" style="margin-top:8px;gap:6px;align-items:flex-start">${sevIcon(e.alerts[0].sev)}<span>${esc(e.alerts[0].title)}</span></div>` : ''}`;
}

function initChat() {
  const s14 = EX.style14; const pay = EX['pay-spasibo']; const rp = EX['rp-99'];
  chatState.msgs = [
    { from: 'bot', time: '10:00', html: digestHTML(), btns: [{ l: 'Открыть Пульт', a: 'goto:pult' }, { l: 'Только мои', a: 'mine' }] },
    { from: 'bot', time: '10:00', html: `<div class="cm-ev">${sevIcon('crit')}<b>Решение не записано уже 7 дней</b></div>Тест <a href="#" data-open="style14">${esc(s14.short)} №14</a> завершился на АБ-платформе 04.11. Результаты посчитаны: у трёх вариантов значимое снижение конверсии в «Стандарт», как и предполагала гипотеза.<div class="muted small" style="margin-top:4px">Владелец: ${s14.owner}. Если решения не будет до 13.11, напишу руководителю.</div>`, btns: [{ l: 'Записать решение', a: 'decide', primary: true }, { l: 'Показать результаты', a: 'open:style14' }, { l: 'Напомнить через 2 дня', a: 'snooze2' }] },
    { from: 'bot', time: '10:01', html: `<div class="cm-ev">${sevIcon('warn')}<b>Завтра включение без SD-заявки</b></div><a href="#" data-open="pay-spasibo">${esc(pay.short)}</a>: 12.11 по плану блоки 12, 9, 8, 7. Вы дежурная по включению на этой неделе. Значение в бете совпадает с веткой _beta, можно заводить.`, btns: [{ l: 'Создать SD', a: 'sd', primary: true }, { l: 'Перенести на день', a: 'move' }] },
    { from: 'bot', time: '10:01', html: `<div class="cm-ev">${sevIcon('warn')}<b>Пилот идёт 13 дней, решения о раскатке нет</b></div><a href="#" data-open="dep-switch">${esc(EX['dep-switch'].feature)}</a>. АБ по этой фиче не планируется: технический переезд. На пилотной группе 2 замечания, оба исправлены.`, btns: [{ l: 'Раскатать на всех по плану', a: 'pilotgo', primary: true }, { l: 'Продлить пилот на неделю', a: 'pilotext' }] },
    { from: 'bot', time: '10:01', html: `<div class="cm-ev">${sevIcon('crit')}<b>3 теста фичи идут на 71 день дольше плана</b></div><a href="#" data-open="rp-99">${esc(rp.feature)}</a>: результаты готовы с 25.08, трафик всё ещё делится 50/50. Результаты по сегментам разные:<div class="cm-plan">${['rp-99', 'rp-59', 'rp-0'].map((id) => `<div><a href="#" data-open="${id}">${esc(EX[id].label)}</a> · ${esc(testBrief(EX[id]))}</div>`).join('')}</div>`, btns: [{ l: 'Раскатать 2.0 в 99 ₽ и 0 ₽, в 59 ₽ оставить контроль', a: 'rpdecide', primary: true }, { l: 'Решать по каждому отдельно', a: 'open:rp-99' }, { l: 'Это не мой тест', a: 'reassign' }] },
  ];
}

function botSay(html, btns) { chatState.msgs.push({ from: 'bot', time: '10:0' + Math.min(9, chatState.msgs.length), html, btns }); }
function meSay(text) { chatState.msgs.push({ from: 'me', time: '10:0' + Math.min(9, chatState.msgs.length), html: esc(text) }); }

function chatAct(a, root) {
  const [k, arg] = a.split(':');
  const e = EX.style14;
  switch (k) {
    case 'goto': location.hash = '#' + arg; return;
    case 'open': openPassport(arg); return;
    case 'mine': meSay('Только мои');
      botSay(`Ваши тесты (${ME}):<br>${EXPERIMENTS.filter((x) => x.owner === ME && x.stage !== 'done').map((x) => `<div class="cm-li">${stageDot(x.stage)}<span><a href="#" data-open="${x.id}">${esc(x.short)}</a><br><span class="ink2">${STAGE[x.stage].name}${x.alerts[0] ? ' · ' + esc(x.alerts[0].title) : ''}</span></span></div>`).join('')}`); break;
    case 'decide':
      if (e.decision) { botSay('По этому тесту решение уже записано.'); break; }
      meSay('Записать решение');
      botSay('Какой вариант победил? Лучший значимый результат у <b>52.0</b> «Формальный язык без эмоциональной окраски»: −3,3 п.п. конверсии в «Стандарт», как и предполагала гипотеза.',
        [{ l: '52.0', a: 'win:52.0', primary: true }, { l: '48.0', a: 'win:48.0' }, { l: '49.0', a: 'win:49.0' }, { l: 'Оставить контроль', a: 'win:ctrl' }, { l: 'Перезапуск №15', a: 'win:restart' }]); break;
    case 'win': {
      if (arg === 'ctrl' || arg === 'restart') { meSay(arg === 'ctrl' ? 'Оставить контроль' : 'Перезапуск №15'); botSay(arg === 'ctrl' ? 'Записал: оставляем контроль 53.0. Через 30 дней напомню удалить рубильник pushStyleDescriptionAb.' : 'Завёл черновик: «[Уведомления] Android. Стиль уведомлений. Выводим 4+ стили. №15 Ветка: описание стиля Стандарт V2. 54.0-59.0. DD.MM.YYYY». Заполните варианты в паспорте.'); break; }
      meSay(arg);
      const plan = rolloutPlan(addDays(TODAY, 1));
      chatState.flow = arg;
      botSay(`Записал: победил <b>${arg}</b>. Раскатать на все блоки по стандартному плану?<div class="cm-plan">${plan.map((p) => `<div><span class="tnum muted">${fmt(p.d)}</span> ${blockList(p.b)}</div>`).join('')}</div>`, [{ l: 'Да, создать план и SD', a: 'confirm', primary: true }, { l: 'Пока не раскатываем', a: 'later' }]); break;
    }
    case 'confirm':
      meSay('Да, создать план и SD');
      if (!e.decision) {
        e.decision = { d: fmt(TODAY, true), who: ME, winner: chatState.flow || '52.0', text: `Раскатываем ${chatState.flow || '52.0'} на всех. Решение записано через бота.` };
        e.stage = 'rollout'; e.results.status = 'reviewed';
        e.events.push({ d: fmt(TODAY, true), t: 'decision', txt: `Решение: раскатываем ${e.decision.winner}` });
        rolloutPlan(addDays(TODAY, 1)).forEach((p, i) => e.events.push({ d: fmt(p.d, true), t: 'plan', b: p.b, v: e.decision.winner, txt: `План: включить ${e.decision.winner}`, sd: i === 0 ? 'SD0002460512' : undefined }));
        prepare(e);
      }
      botSay(`<div class="cm-ev">${sevIcon('good')}<b>Готово</b></div>Решение записано в паспорт, тираж и аналитику в Confluence. План раскатки создан, SD на ГФ: <span class="mono">SD0002460512</span>. Через 30 дней после раскатки напомню удалить <span class="mono">pushStyleDescriptionAb</span>.`, [{ l: 'Открыть паспорт', a: 'open:style14' }]); break;
    case 'rpdecide':
      meSay('Раскатать 2.0 в 99 ₽ и 0 ₽, в 59 ₽ оставить контроль');
      if (!EX['rp-99'].decision) ['rp-99', 'rp-59', 'rp-0'].forEach((id) => decideOne(EX[id]));
      botSay(`<div class="cm-ev">${sevIcon('good')}<b>Записал 3 решения</b></div><div class="cm-plan">${['rp-99', 'rp-59', 'rp-0'].map((id) => `<div>${esc(EX[id].label)} · ${esc(outcome(EX[id]))}</div>`).join('')}</div>Остановил АБ, создал план раскатки 2.0 для двух сегментов и задачу на удаление <span class="mono">returnNotificationsPrice2Ab</span>. Тесты 59 ₽ и 99/0 ₽ дальше живут каждый своей стадией.`, [{ l: 'Открыть паспорт', a: 'open:rp-59' }]); break;
    case 'pilotgo': {
      meSay('Раскатать на всех по плану');
      const d = EX['dep-switch'];
      if (d.stage === 'release') {
        rolloutPlan(addDays(TODAY, 1)).forEach((p, i) => d.events.push({ d: fmt(p.d, true), t: 'plan', b: p.b, v: '2.0', txt: 'План: включить 2.0', sd: i === 0 ? 'SD0002462411' : undefined }));
        d.stage = 'enabling'; d.dates.rolloutStart = fmt(addDays(TODAY, 1), true); prepare(d);
      }
      botSay(`<div class="cm-ev">${sevIcon('good')}<b>План раскатки создан</b></div><div class="cm-plan">${rolloutPlan(addDays(TODAY, 1)).map((p) => `<div><span class="tnum muted">${fmt(p.d)}</span> ${blockList(p.b)}</div>`).join('')}</div>Через 7 дней после 100 % напомню проверить расхождения настроек и обращения: это контрольная точка вместо АБ.`); break;
    }
    case 'pilotext': meSay('Продлить пилот на неделю'); botSay('Продлил пилот до 18.11. Напомню в этот день.'); break;
    case 'later': meSay('Пока не раскатываем'); botSay('Хорошо, победитель записан, раскатку не планирую. Напомню через неделю.'); break;
    case 'snooze2': meSay('Напомнить через 2 дня'); botSay('Напомню 13.11 в 10:00. Если решения не будет, напишу руководителю.'); break;
    case 'sd': meSay('Создать SD'); botSay(`<div class="cm-ev">${sevIcon('good')}<b>Заявка создана</b></div><span class="mono">SD0002461337</span>: <span class="mono">payNotificationsBonusAb</span>, АБ 50/50, ПРОМ, блоки 12, 9, 8, 7, на 12.11.2026. Привязал её к шагу включения в тираже.`); break;
    case 'move': meSay('Перенести на день'); botSay('Перенёс шаг на 13.11. Остальные шаги сдвинулись на день: 6–1 на 16.11, SI1–SI4 на 17.11.'); break;
    case 'reassign': meSay('Это не мой тест'); botSay('Понял. Владелец по паспорту — Мария С., ей уже отправлено. Кому ещё переслать?', PEOPLE.filter((p) => p !== ME).map((p) => ({ l: p, a: 'sent' }))); break;
    case 'sent': meSay('Отправить'); botSay('Отправлено.'); break;
    case 'cmd':
      if (arg === 'status') { meSay('/статус стиль 14'); botSay(statusCard(EX.style14)); }
      if (arg === 'status2') { meSay('/статус реакции'); botSay(statusCard(EX.reactions2), [{ l: 'Запланировать следующий шаг', a: 'plan2', primary: true }]); }
      if (arg === 'feat') { const f = FEATURES['f-activ-price']; meSay('/статус лендинги'); botSay(`<div style="font-weight:650">${esc(f.name)}</div><div class="small muted" style="margin-bottom:6px">${f.tests.length} АБ-теста · ${featureKind(f)}</div>${f.tests.map((t) => `<div style="margin:6px 0"><a href="#" data-open="${t.id}">${esc(t.label)}</a>${readinessBar(t)}</div>`).join('')}<div class="small ink2">Сегмент 99 ₽ маленький: выборка набирается медленнее, к плановой дате 03.12 не успеет.</div>`, [{ l: 'Продлить 99 ₽ до 07.12', a: 'extend', primary: true }, { l: 'Напомнить, когда будет готов 59 ₽', a: 'remind59' }]); }
      if (arg === 'hist') {
        const f = FEATURES['f-activ']; const past = pastOf(f); const c = (k) => past.filter((h) => h.kind === k).length;
        meSay('/история активация');
        botSay(`<div style="font-weight:650">${esc(f.name)}</div><div class="small ink2" style="margin:2px 0 8px">${past.length} тестов с ${esc(past[0].when)}: побед ${c('win')}, без эффекта ${c('none')}, остановлено ${c('stop')}. Сейчас идёт №34.</div>
          <div class="hstrip sm" style="margin-bottom:8px">${past.map((h) => `<i style="background:${HCOLOR[h.kind]}" data-tip="<b>${esc(h.it)} · ${esc(h.theme)}</b><br>${esc(h.what)}<br>${esc(h.out)}"></i>`).join('')}<i class="now"></i></div>
          <div class="small"><b>По теме №34 «Иллюстрация»:</b> ${past.filter((h) => h.theme === 'Иллюстрация').map((h) => `${esc(h.it)} — ${esc(h.out.toLowerCase())}`).join(', ')}. Маскот уже был в №19, тогда без эффекта.</div>`, [{ l: 'Открыть историю', a: 'open:activ34' }]);
      }
      if (arg === 'duty') { meSay('/дежурный'); botSay(`На этой неделе включает <b>${dutyNow()}</b> (вы). Дальше: ${DUTY.filter((d) => !d.now).map((d) => `${d.who} — ${d.week}`).join('; ')}.`); }
      if (arg === 'digest') { meSay('/сводка'); botSay(digestHTML()); }
      break;
    case 'extend': meSay('Продлить 99 ₽ до 07.12'); botSay('Продлил тест «сегмент 99 ₽» до 07.12 и обновил дату на АБ-платформе. Остальные сегменты идут по плану.'); break;
    case 'remind59': meSay('Напомнить, когда будет готов 59 ₽'); botSay(`Напомню ${fmtH(EX['ap-59'].lookAt)} в 10:00, когда сегмент 59 ₽ наберёт выборку.`); break;
    case 'plan2': meSay('Запланировать следующий шаг'); botSay('Предлагаю: 12.11 — 9, 8, 6, 5; 13.11 — 4, 3, 2, 1; 16.11 — SI1–SI4. Создать шаги и SD?', [{ l: 'Создать', a: 'plan2ok', primary: true }, { l: 'Изменить даты', a: 'open:reactions2' }]); break;
    case 'plan2ok': meSay('Создать'); botSay(`<div class="cm-ev">${sevIcon('good')}<b>План создан</b></div>3 шага включения добавлены в тираж, SD на 12.11 заведена.`); break;
  }
  renderAssistant(root, true);
}

function renderAssistant(root, keepScroll) {
  if (!chatState.msgs) initChat();
  const S = chatState.settings;
  const EVS = ['Тест завершился на АБ-платформе', 'Можно смотреть результаты', 'Тест идёт дольше плана', 'Включение застряло', 'Завтра включение без SD (дежурному)', 'Пора удалять тоглы', 'Мой тест пересекается с новым'];
  const weekly = {
    live: EXPERIMENTS.filter((e) => ['collecting', 'ready'].includes(e.stage) && e.platform === 'Запущен').length,
    dec: EXPERIMENTS.filter((e) => e.decision && days(D(e.decision.d), TODAY) <= 7).length,
    over: mergedAlerts().filter((a) => a.sev === 'crit' || a.sev === 'serious').length,
  };

  root.innerHTML = `
  <style>
    .asst { display:grid; grid-template-columns: minmax(0, 640px) minmax(320px, 1fr); gap: 24px; align-items: start; }
    .msgr { background: var(--surface); border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; display:flex; flex-direction:column; height: calc(100vh - 140px); min-height: 560px; }
    .msgr-h { display:flex; align-items:center; gap:10px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
    .msgr-b { flex:1; overflow-y:auto; padding: 16px; display:flex; flex-direction:column; gap: 12px; background: #f6f6f3; }
    .cm { display:flex; gap:8px; align-items:flex-end; max-width: 92%; }
    .cm.me { align-self:flex-end; flex-direction: row-reverse; }
    .bub { background: var(--surface); border-radius: 14px 14px 14px 4px; padding: 10px 12px; box-shadow: 0 0 0 1px var(--ring); font-size: 13.5px; }
    .cm.me .bub { background: #141413; color: #fff; border-radius: 14px 14px 4px 14px; box-shadow:none; }
    .bub .t { font-size: 11px; color: var(--muted); margin-top: 6px; text-align: right; }
    .cm.me .bub .t { color: #a9a8a0; }
    .cm-btns { display:flex; flex-wrap:wrap; gap:6px; margin-top: 10px; }
    .cm-sec { font-size: 11.5px; font-weight: 650; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 10px 0 4px; }
    .cm-li { display:flex; gap:8px; align-items:flex-start; padding: 3px 0; font-size: 13px; }
    .cm-ev { display:flex; gap:8px; align-items:center; margin-bottom: 4px; }
    .cm-plan { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); font-size: 12.5px; display:flex; flex-direction:column; gap:2px; }
    .msgr-f { border-top: 1px solid var(--line); padding: 10px 12px; display:flex; flex-direction:column; gap: 8px; }
    .cmds { display:flex; gap:6px; flex-wrap:wrap; }
    .cmds button { border:0; background: var(--surface-3); border-radius: 14px; padding: 4px 10px; font-size: 12px; cursor:pointer; font-family: var(--mono); }
    .cmds button:hover { background: var(--line); }
    .inp { display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 20px; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); color: var(--muted); font-size: 13px; }
    .bot-ava { width: 32px; height: 32px; border-radius: 10px; background:#141413; color:#fff; display:grid; place-items:center; font-weight:700; flex: 0 0 32px; }
    .set-row { display:flex; align-items:center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
    .set-row:last-child { border-bottom: 0; }
  </style>
  <div class="page">
    <div class="page-title"><div class="grow"><h1>Ассистент в мессенджере</h1><div class="sub">Сервис сам пишет, когда что-то произошло или пора действовать. Решение, SD-заявку и перенос шага можно оформить кнопками в чате. Нажимайте кнопки — сценарий интерактивный</div></div></div>
    <div class="asst">
      <div class="msgr">
        <div class="msgr-h"><span class="bot-ava">Р</span><div class="grow"><div style="font-weight:650">Радар АБ</div><div class="small muted">бот · команда [${TEAM.name}] ${TEAM.platform}</div></div><span class="chip">корпоративный мессенджер</span></div>
        <div class="msgr-b" id="chat">
          <div class="small muted" style="text-align:center">Сегодня</div>
          ${chatState.msgs.map((m, i) => `<div class="cm ${m.from}">${m.from === 'bot' ? '<span class="bot-ava" style="width:26px;height:26px;flex-basis:26px;font-size:11px;border-radius:8px">Р</span>' : ''}
            <div class="bub">${m.html}${m.btns ? `<div class="cm-btns">${m.btns.map((b) => `<button class="btn sm ${b.primary ? 'primary' : ''}" data-chat="${b.a}">${esc(b.l)}</button>`).join('')}</div>` : ''}<div class="t">${m.time}</div></div></div>`).join('')}
        </div>
        <div class="msgr-f">
          <div class="cmds"><button data-chat="cmd:digest">/сводка</button><button data-chat="cmd:status">/статус стиль 14</button><button data-chat="cmd:status2">/статус реакции</button><button data-chat="cmd:feat">/статус лендинги</button><button data-chat="cmd:hist">/история активация</button><button data-chat="cmd:duty">/дежурный</button></div>
          <div class="inp">Напишите команду или вопрос: «что можно смотреть на этой неделе?»</div>
        </div>
      </div>

      <div class="stack" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Что и когда присылать</h3></div><div class="card-b">
          <div class="set-row"><span class="toggle ${S.daily ? 'on' : ''}" data-set="daily"><i></i></span><span class="grow"><b>Утренняя сводка</b><br><span class="small ink2">по будням в 10:00, лично и в канал команды</span></span></div>
          <div class="set-row" style="flex-direction:column;align-items:stretch;gap:4px"><b>Сразу, когда случилось</b>
            ${EVS.map((n, i) => `<label class="row small" style="gap:8px;padding:3px 0;cursor:pointer"><span class="toggle ${S.ev[i] ? 'on' : ''}" data-ev="${i}"><i></i></span>${n}</label>`).join('')}
          </div>
          <div class="set-row"><span class="toggle ${S.escalate ? 'on' : ''}" data-set="escalate"><i></i></span><span class="grow"><b>Эскалация</b><br><span class="small ink2">если решение не записано 9 дней после окончания теста, написать руководителю</span></span></div>
          <div class="set-row"><span class="grow"><b>Тихие часы</b><br><span class="small ink2">20:00 – 09:00 и выходные, кроме критичного</span></span></div>
        </div></div>

        <div class="card"><div class="card-h"><span class="toggle ${S.weekly ? 'on' : ''}" data-set="weekly"><i></i></span><h3>Сводка руководителю</h3><span class="sp"></span><span class="small muted">пн, 10:00</span></div>
          <div class="card-b">
            <div class="bub" style="box-shadow:0 0 0 1px var(--line);background:var(--surface-2)">
              <div style="font-weight:650;margin-bottom:8px">АБ-тесты [${TEAM.name}] за неделю</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
                <div><div class="small muted">В эфире</div><div style="font-size:22px;font-weight:650">${weekly.live}</div></div>
                <div><div class="small muted">Решений за неделю</div><div style="font-size:22px;font-weight:650">${weekly.dec}</div></div>
                <div><div class="small muted">Просрочено</div><div style="font-size:22px;font-weight:650">${weekly.over}</div></div>
              </div>
              <div class="small"><b>Итоги:</b> «Близкие рядом, лендинг на CMS №2» — не хуже контроля, раскатываем 2.0. «Карточки под номером телефона №1» — победил 6.0, раскатано на 100 %.</div>
              <div class="small" style="margin-top:6px"><b>Нужно внимание:</b> «Стиль уведомлений №14» без решения 7 дней; АБ по ценовым сегментам идёт на 71 день дольше плана.</div>
            </div>
          </div></div>

        <div class="card" style="padding:16px"><h3>Почему это работает</h3>
          <div class="stack small ink2" style="margin-top:8px;gap:6px">
            <div>Напоминание приходит туда, где команда и так сидит, без нового сервиса во вкладке.</div>
            <div>Каждое сообщение заканчивается действием: записать, создать, перенести, переназначить.</div>
            <div>Ответ из чата сразу попадает в паспорт, строку тиража и аналитику, переносить вручную не нужно.</div>
          </div></div>
      </div>
    </div>
  </div>`;

  const chat = $('#chat'); chat.scrollTop = keepScroll ? chat.scrollHeight : 0;
  $$('[data-chat]', root).forEach((b) => b.onclick = (ev) => { ev.preventDefault(); chatAct(b.dataset.chat, root); });
  $$('[data-set]', root).forEach((t) => t.onclick = () => { S[t.dataset.set] = !S[t.dataset.set]; renderAssistant(root); });
  $$('[data-ev]', root).forEach((t) => t.onclick = (ev) => { ev.preventDefault(); S.ev[+t.dataset.ev] = !S.ev[+t.dataset.ev]; renderAssistant(root); });
}

VIEWS.assistant = { render: (root) => renderAssistant(root, false) };
