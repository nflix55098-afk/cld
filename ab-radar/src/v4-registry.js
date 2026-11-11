/* ===================== 4. Умный тираж ===================== */

const regState = { view: 'active', tab: 'features', byRelease: true, open: new Set(['style14']) };
const REG_VIEWS = [
  { k: 'all', name: 'Все', f: () => true },
  { k: 'active', name: 'Активные АБ', f: (e) => e.type !== 'rollout' && ['enabling', 'collecting', 'ready', 'rollout'].includes(e.stage) },
  { k: 'enabling', name: 'Включаются', f: (e) => ['enabling', 'rollout'].includes(e.stage) },
  { k: 'ready', name: 'Готовы к анализу', f: (e) => e.stage === 'ready' || e.alerts.some((a) => a.rule === 'canlook') },
  { k: 'prep', name: 'В подготовке', f: (e) => ['prep', 'release'].includes(e.stage) },
  { k: 'cleanup', name: 'Ждут чистки', f: (e) => e.stage === 'cleanup' },
  { k: 'noab', name: 'Без АБ', f: (e) => e.type === 'rollout' },
  { k: 'done', name: 'Архив', f: (e) => e.stage === 'done' },
];

function lastEvent(e) {
  const past = e.events.filter((ev) => ev._d <= TODAY).sort((a, b) => b._d - a._d)[0];
  return past;
}

function abCell(e) {
  if (e.type === 'rollout') {
    const c = e.check || {};
    const st = c.done ? `<span class="sev-label good">${esc(c.done.split(':')[0])}</span>` : e.d.rolloutDoneAt && c.days ? `<span class="small ink2">проверка ${fmt(addDays(e.d.rolloutDoneAt, c.days))}</span>` : e.pilot ? `<span class="small ink2">пилот с ${e.pilot.since.slice(0, 5)}</span>` : `<span class="small ink2">проверка через ${c.days || 7} дн. после 100 %</span>`;
    return `<span class="chip">Без АБ</span><div style="margin-top:4px">${st}</div>` + (e.alerts.some((a) => a.rule === 'draft') ? '<div class="small"><span class="sev-label warn">Висит черновик</span></div>' : '');
  }
  if (['prep', 'release'].includes(e.stage)) return `<span class="small ink2">${e.platform === 'Новый' ? 'Создан на платформе' : ''}${e.d.plannedStart ? `<br>старт ${fmt(e.d.plannedStart)}` : ''}</span>`;
  if (['collecting', 'enabling'].includes(e.stage) && e.d.fullAt) return readinessBar(e, true);
  if (e.stage === 'enabling') return '<span class="small ink2">Отсчёт начнётся после включения на всех блоках</span>';
  if (e.stage === 'ready') return `${readinessBar(e, true)}<div class="small" style="margin-top:4px"><span class="sev-label serious">Нет решения</span></div>`;
  if (e.decision) {
    return `<span class="chip">${outcome(e)}</span><div class="small muted" style="margin-top:4px">решение ${e.decision.d.slice(0, 5)}</div>`;
  }
  return '';
}

function togglesCell(e) {
  if (!e.toggles.length) return '<span class="muted">—</span>';
  const todo = e.toggles.filter((x) => x.st === 'todo').length;
  const pl = e.toggles.filter((x) => x.st === 'planned').length;
  const done = e.toggles.filter((x) => x.st === 'done').length;
  const late = e.alerts.some((a) => a.rule === 'toggles' && a.sev === 'serious');
  if (!['cleanup', 'done'].includes(e.stage)) return `<span class="small muted nowrap" data-tip="${esc(e.toggles.map((x) => x.n).join(', '))}">${e.toggles.length} шт.</span>`;
  return `<div class="small">${done ? `<div class="sev-label good">${done} удалено</div>` : ''}${pl ? `<div class="sev-label info">${pl} в плане</div>` : ''}${todo ? `<div class="sev-label ${late ? 'serious' : 'warn'}">${todo} не удалено${late ? ' > 30 дн.' : ''}</div>` : ''}</div>`;
}

function regRow(e, S, nested = false) {
  const le = lastEvent(e);
  const isOpen = S.open.has(e.id);
  const sev = e.alerts.find((a) => ['crit', 'serious', 'warn'].includes(a.sev));
  return `<tr class="clickable" data-row="${e.id}">
    <td style="width:28px;padding-right:0"><button class="btn ghost sm" data-expand="${e.id}" style="padding:0 4px;transform:rotate(${isOpen ? 0 : -90}deg)">${ICON.chev}</button></td>
    <td style="min-width:240px;max-width:300px;${nested ? 'padding-left:28px;border-left:3px solid var(--line-2)' : ''}">
      ${nested ? `<a href="#" data-open="${e.id}" style="font-weight:600;color:var(--ink)">АБ-тест: ${esc(e.label)}</a>` : `<a href="#" data-open="${e.id}" style="font-weight:600;color:var(--ink)">${esc(e.feature)}</a>`}
      <div class="row wrap small muted" style="gap:2px 6px;margin-top:2px"><span class="nowrap">${e.tag}</span><span class="mono" style="font-size:11px">${e.key}</span>${!nested && pastOf(featureOf(e)).length ? `<span class="nowrap" title="Прошлые итерации фичи">· ${pastOf(featureOf(e)).length} в истории</span>` : ''}</div>
      <div class="row wrap" style="gap:6px;margin-top:6px">${stageChip(e.stage)}${e.type === 'rollout' ? '<span class="small muted">без АБ</span>' : `<span class="small muted">платформа: ${e.platform}</span>`}${e.blockers ? `<span class="chip" style="background:#fef4dc;color:#8a5d00" data-tip="${esc(e.blockers)}">Есть блокер</span>` : ''}</div>
      ${sev ? `<div class="row small" style="gap:6px;margin-top:6px;align-items:flex-start">${sevIcon(sev.sev)}<span>${esc(sev.title)}</span></div>` : ''}
    </td>
    <td>${blockMatrix(e, { head: false, fixed: '33px' })}</td>
    <td style="min-width:180px;max-width:230px">
      ${le ? `<div class="small"><span class="muted tnum">${fmt(le._d)}</span> ${esc(le.txt)}${le.sd ? ` <span class="mono" style="color:var(--accent)">${le.sd}</span>` : ''}</div>` : ''}
      ${e.nextPlan ? `<div class="small" style="margin-top:4px"><span class="muted">Дальше ${fmt(e.nextPlan.d)}:</span> ${blockList(e.nextPlan.blocks)}${e.nextPlan.sd ? '' : ' <span class="sev-label warn">нет SD</span>'}</div>` : ''}
    </td>
    <td style="min-width:150px;max-width:180px">${abCell(e)}</td>
    <td>${togglesCell(e)}</td>
  </tr>
  ${isOpen ? `<tr><td></td><td colspan="5" style="background:var(--surface-2)">
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:24px">
      <div><div class="row" style="margin-bottom:6px"><b class="grow">Журнал</b><button class="btn sm" data-act="addevent" data-id="${e.id}">${ICON.plus} Событие</button></div>${journal(e)}</div>
      <div class="stack" style="gap:12px">
        <div><b>Гипотеза</b><div class="small ink2" style="margin-top:4px">${esc(e.hypothesis)}</div></div>
        <div class="conv-name" style="margin:0"><code>${esc(e.name)}</code><button class="btn ghost sm" data-copy="${esc(e.name)}">${ICON.copy}</button></div>
        <div><b>Тоглы</b><div style="margin-top:4px">${toggleList(e)}</div></div>
        <div class="row"><button class="btn sm primary" data-open="${e.id}">Открыть паспорт</button>${e.stage === 'ready' ? `<button class="btn sm" data-act="decide" data-id="${e.id}">Записать решение</button>` : ''}${['enabling', 'rollout'].includes(e.stage) ? `<button class="btn sm" data-act="sd" data-id="${e.id}">SD на следующий шаг</button>` : ''}</div>
      </div>
    </div>
  </td></tr>` : ''}`;
}

function featureRows(f, items, S) {
  if (f.tests.length === 1) return items.map((e) => regRow(e, S)).join('');
  const hidden = f.tests.length - items.length;
  const worst = f.tests.flatMap((t) => t.alerts).filter((a) => ['crit', 'serious', 'warn'].includes(a.sev)).sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev])[0];
  const stages = [...new Set(f.tests.map((t) => t.stage))];
  return `<tr><td></td><td colspan="5" style="padding-top:14px">
      <div class="row wrap" style="gap:8px"><a href="#" data-open="${items[0].id}" style="font-weight:650;color:var(--ink);font-size:14px">${esc(f.name)}</a>
      <span class="chip">${f.tests.length} ${plural(f.tests.length, 'АБ-тест', 'АБ-теста', 'АБ-тестов')} · ${featureKind(f)}</span>
      ${stages.map((k) => stageChip(k)).join('')}
      ${f.history.length ? `<span class="small muted">и ещё ${f.history.length} ${plural(f.history.length, 'итерация', 'итерации', 'итераций')} раньше</span>` : ''}
      ${hidden ? `<span class="small muted">${hidden} не попадают в фильтр</span>` : ''}
      ${worst ? `<span class="row small" style="gap:6px">${sevIcon(worst.sev)}${esc(worst.title)}</span>` : ''}</div>
      <div class="small muted" style="margin-top:4px">Одна строка тиража и одна аналитика. Ниже — тесты, у каждого свои блоки, сроки, результат и решение</div>
    </td></tr>${items.map((e) => regRow(e, S, true)).join('')}`;
}

function rowsFor(list, S) {
  const fids = [...new Set(list.map((e) => e.fid))];
  return fids.map((fid) => featureRows(FEATURES[fid], list.filter((e) => e.fid === fid), S)).join('');
}

function renderRegistry(root) {
  const S = regState;
  const V = REG_VIEWS.find((v) => v.k === S.view);
  const list = EXPERIMENTS.filter(V.f);
  const relOf = (v) => RELEASES.find((r) => r.v === v);
  const rels = [...new Set(list.map((e) => e.release))].sort((a, b) => parseFloat(b.split('.')[1]) - parseFloat(a.split('.')[1]));

  const toggles = EXPERIMENTS.flatMap((e) => e.toggles.map((t) => ({ ...t, e })));
  const tg = {
    late: toggles.filter((t) => t.st === 'todo' && t.e.alerts.some((a) => a.rule === 'toggles' && a.sev === 'serious')),
    todo: toggles.filter((t) => t.st === 'todo' && ['cleanup'].includes(t.e.stage) && !t.e.alerts.some((a) => a.rule === 'toggles' && a.sev === 'serious')),
    planned: toggles.filter((t) => t.st === 'planned'),
    later: toggles.filter((t) => t.st === 'todo' && !['cleanup', 'done'].includes(t.e.stage)),
    done: toggles.filter((t) => t.st === 'done'),
  };

  const head = `<tr><th></th><th>Фича · стадия · блокеры</th><th style="padding-bottom:6px"><div style="margin-bottom:4px">Где сейчас включено</div>${bmHeader('33px')}</th><th>Последнее событие · дальше</th><th>АБ</th><th>Тоглы</th></tr>`;

  root.innerHTML = `${appHead()}
  <style>.reg td .bm, .reg td .bm .c { width: 100%; min-width: 0; } .reg td .bm .c { font-size: 9.5px; padding: 0 1px; } .reg th .bm-grid .hd { font-size: 10px; } .reg table.t td, .reg table.t th { padding-left: 10px; padding-right: 10px; } .reg .meter-row { flex-wrap: wrap; row-gap: 2px; } .reg .meter-row .nowrap { white-space: normal; } .reg .meter-row .meter { flex: 1 1 100%; }</style>
  <div class="page" style="max-width:none">
    <div class="page-title">
      <div class="grow"><h1>Тиражирование фич · Android</h1><div class="sub">Та же структура, что в Confluence, только вместо цвета ячейки — стадия, а вместо текста с датами — матрица блоков и журнал</div></div>
      <div class="seg"><button class="${S.tab === 'features' ? 'on' : ''}" data-tab="features">Фичи и АБ-тесты</button><button class="${S.tab === 'toggles' ? 'on' : ''}" data-tab="toggles">Удаление тоглов <span class="cnt">${tg.late.length + tg.todo.length}</span></button></div>
    </div>

    ${S.tab === 'features' ? `
    <div class="row wrap" style="margin-bottom:14px;gap:10px">
      <div class="seg">${REG_VIEWS.map((v) => `<button class="${S.view === v.k ? 'on' : ''}" data-view="${v.k}">${v.name}<span class="cnt">${EXPERIMENTS.filter(v.f).length}</span></button>`).join('')}</div>
      <span class="toggle ${S.byRelease ? 'on' : ''}" id="rg-rel"><i></i>Группировать по релизам</span>
      <span class="sp"></span>${bmLegend()}
    </div>
    <div class="card reg" style="overflow-x:auto">
      <table class="t"><thead>${head}</thead><tbody>
      ${S.byRelease ? rels.map((r) => { const items = list.filter((e) => e.release === r); const rr = relOf(r); return `<tr><td colspan="6" style="background:var(--surface-3);padding:8px 12px;font-weight:650">Релиз ${r}${rr ? ` <span class="muted" style="font-weight:500">· ${rr.d}${D(rr.d) > TODAY ? ' · ещё не вышел' : ''}</span>` : ''} <span class="muted" style="font-weight:500">· ${new Set(items.map((e) => e.fid)).size} ${plural(new Set(items.map((e) => e.fid)).size, 'фича', 'фичи', 'фич')}, ${items.length} ${plural(items.length, 'тест', 'теста', 'тестов')}</span></td></tr>${rowsFor(items, S)}`; }).join('')
        : rowsFor(list, S)}
      </tbody></table>
      ${list.length ? '' : '<div class="empty" style="padding:24px">В этом представлении пусто</div>'}
    </div>
    <div class="row small muted" style="margin-top:10px;gap:16px"><span>Сохранённые представления заменяют поиск по цвету ячеек</span><span>·</span><span>Каждое событие в журнале обновляет матрицу блоков</span><span>·</span><a href="#" data-act="newtest">Создать тест с именем по конвенции</a></div>
    ` : `
    <div class="grid-2" style="grid-template-columns:1.5fr 1fr">
      <div class="stack" style="gap:16px">
        ${[['Просрочено: раскатано больше 30 дней назад', tg.late, 'serious'], ['Пора планировать', tg.todo, 'warn'], ['Запланировано в «Удаление тоглов»', tg.planned, 'info'], ['Удалить после завершения теста', tg.later, null], ['Удалено', tg.done, 'good']].map(([t, arr, sv]) => `
        <div class="card"><div class="card-h">${sv ? sevIcon(sv) : ''}<h3>${t}</h3><span class="muted small">${arr.length}</span><span class="sp"></span>${sv === 'serious' || sv === 'warn' ? `<button class="btn sm" data-act="cleanup" data-id="${arr[0]?.e.id || ''}">Добавить все в ч. 22</button>` : ''}</div>
          <div class="card-b">${arr.length ? `<table class="t"><tbody>${(sv === null ? arr.slice(0, 5) : arr).map((x) => `<tr><td><span class="mono">${esc(x.n)}</span><div class="small muted">${x.kind}</div></td><td><a href="#" data-open="${x.e.id}">${esc(x.e.short)}</a> <span class="small muted">${x.e.tag}</span></td><td class="small ink2 nowrap">${x.where ? esc(x.where) : x.e.d.rolloutDoneAt ? `раскатано ${fmt(x.e.d.rolloutDoneAt)}` : STAGE[x.e.stage].name}</td></tr>`).join('')}</tbody></table>${sv === null && arr.length > 5 ? `<div class="small muted" style="padding-top:10px">и ещё ${arr.length - 5}: появятся в «Пора планировать», когда тест раскатят</div>` : ''}` : '<div class="empty">Нет</div>'}</div></div>`).join('')}
      </div>
      <div class="card" style="padding:16px;position:sticky;top:64px">
        <h3>Как это работает</h3>
        <div class="stack small ink2" style="margin-top:10px;gap:8px">
          <div>Сервис собирает рубильники, тоглы и конфиги из паспортов тестов: всё, что может требовать удаления (тогл, рубильник в лончере или конфиге, метрики, неиспользуемые ветки АБ, фича).</div>
          <div>Сразу после раскатки на 100 % элемент попадает в «Пора планировать», а через 30 дней — в «Просрочено» с напоминанием владельцу.</div>
          <div>Кнопка «Добавить в ч. 22» создаёт пункт в очередной странице «[Android] Удаление тоглов, конфига, Launcher» и привязывает её к релизу.</div>
        </div>
        <div class="divider" style="margin:14px 0"></div>
        <div class="kv small"><dt>Текущая часть</dt><dd>Удаление тоглов, ч. 22</dd><dt>Релиз</dt><dd>17.16 · 07.12.2026</dd><dt>В плане</dt><dd>${tg.planned.length} элемента</dd></div>
      </div>
    </div>`}
  </div>`;

  $$('[data-tab]', root).forEach((b) => b.onclick = () => { S.tab = b.dataset.tab; renderRegistry(root); });
  $$('[data-view]', root).forEach((b) => b.onclick = () => { S.view = b.dataset.view; renderRegistry(root); });
  const rg = $('#rg-rel'); if (rg) rg.onclick = () => { S.byRelease = !S.byRelease; renderRegistry(root); };
  $$('[data-expand]', root).forEach((b) => b.onclick = (ev) => { ev.stopPropagation(); const id = b.dataset.expand; S.open.has(id) ? S.open.delete(id) : S.open.add(id); renderRegistry(root); });
  $$('tr[data-row]', root).forEach((tr) => tr.addEventListener('click', (ev) => {
    if (ev.target.closest('a,button,[data-tip]')) return;
    const id = tr.dataset.row; S.open.has(id) ? S.open.delete(id) : S.open.add(id); renderRegistry(root);
  }));
}

VIEWS.registry = { render: renderRegistry };
