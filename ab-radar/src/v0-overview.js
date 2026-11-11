/* ===================== Обзор концептов ===================== */

const CONCEPTS = [
  {
    id: 'pult', n: 1, name: 'Пульт', tag: 'Центр внимания: «что нужно сделать сегодня»',
    idea: 'Главный экран — список дел, который сервис собирает сам по правилам: просрочено, сделать сегодня, на этой неделе. Сверху сводка по стадиям, справа — что сейчас в эфире.',
    best: 'Ежедневная работа продакта и аналитика: открыл утром и сразу видишь, что горит',
    pros: ['Напрямую решает «мы забываем»: просроченное само поднимается наверх', 'Действие в один клик: записать решение, создать SD, отложить', 'Понятен без обучения'],
    cons: ['Плохо показывает общую картину во времени', 'Если правила настроены неточно, будет шум'],
  },
  {
    id: 'board', n: 2, name: 'Конвейер', tag: 'Канбан по жизненному циклу АБ-теста',
    idea: 'Колонки — 8 стадий от подготовки до архива. Карточка показывает то, что важно именно на её стадии: блоки при включении, дни до результатов при сборе, тоглы при чистке. При переходе между стадиями сервис просит заполнить обязательное.',
    best: 'Еженедельный синк команды и руководитель: где узкое место, что застряло',
    pros: ['Видно узкие места: например, много тестов в «Готов к анализу»', 'Чек-листы на переходах не дают пропустить шаг', 'Привычный формат доски'],
    cons: ['Сроки и пересечения видны хуже, чем на таймлайне', 'При 30+ тестах колонки становятся длинными'],
  },
  {
    id: 'timeline', n: 3, name: 'Таймлайн', tag: 'Тесты на шкале времени вместе с релизами',
    idea: 'Каждый тест — полоса с фазами: включение, сбор данных, «можно смотреть», анализ, раскатка, чистка. Вертикальные линии — релизы и сегодняшний день. Снизу график загрузки: сколько тестов идёт одновременно.',
    best: 'Планирование: когда стартовать, когда ждать результатов, где тесты накладываются',
    pros: ['Сразу видно «можно смотреть с…» и просрочки', 'Пересечения и загрузка по неделям на одном экране', 'Связь с релизным календарём'],
    cons: ['Не подходит для ежедневных действий', 'Тяжело читать на маленьком экране'],
  },
  {
    id: 'registry', n: 4, name: 'Умный тираж', tag: 'Эволюция текущей страницы тиража',
    idea: 'Та же таблица «Релиз — Фича — Блокеры — Где включено — Даты — АБ», но вместо цвета ячейки — стадия, вместо текста дат — матрица блоков и структурный журнал. Сохранённые представления: «Активные АБ», «Готовы к анализу», «Ждут чистки тоглов».',
    best: 'Плавный переход с Confluence: команда работает в знакомой структуре',
    pros: ['Минимальная смена привычек', 'Матрица блоков показывает, где что включено', 'Конвенция имени и проверка беты встроены в форму'],
    cons: ['Сам по себе не напоминает: нужен слой уведомлений', 'Таблица остаётся плотной'],
  },
  {
    id: 'assistant', n: 5, name: 'Ассистент', tag: 'Сервис живёт в мессенджере: дайджесты и кнопки',
    idea: 'Минимум интерфейса: бот присылает утренний дайджест и события («тест завершился», «можно смотреть»), а решение, SD-заявку и удаление тоглов можно оформить прямо в чате. Веб-страница нужна только для настроек и истории.',
    best: 'Команды, которые не хотят открывать ещё один сервис',
    pros: ['Напоминание приходит туда, где люди и так сидят', 'Быстрые ответы кнопками', 'Еженедельная сводка для руководителя без усилий'],
    cons: ['Нет общей картины: нужна хотя бы одна веб-страница', 'Риск, что сообщения начнут игнорировать'],
  },
];

const NEEDS = [
  ['Какие тесты активны', [2, 2, 2, 2, 1]],
  ['Какие в процессе включения и на каких блоках', [1, 2, 1, 2, 1]],
  ['Какие закончены и с каким результатом', [1, 2, 1, 2, 1]],
  ['Можно ли уже смотреть результаты', [2, 2, 2, 1, 2]],
  ['Не забывать: решения, раскатки, тоглы', [2, 1, 1, 0, 2]],
  ['Связь с релизами', [0, 1, 2, 2, 0]],
  ['Пересечения тестов', [1, 0, 2, 1, 0]],
  ['Несколько АБ-тестов в одной фиче', [2, 2, 2, 2, 1]],
  ['Порог входа для команды', [2, 2, 1, 2, 2]],
];

const RULES = [
  ['crit', 'Тест завершён, решения нет', 'Через 3 дня после окончания теста на платформе, если решение не записано'],
  ['crit', 'Тест идёт дольше плана', 'План окончания прошёл, а тест на платформе всё ещё «Запущен»'],
  ['serious', 'Тоглы не удалены', 'Через 30 дней после раскатки на 100 %, если рубильники и ветки не удалены'],
  ['warn', 'Включение застряло', 'Больше 3 дней нет движения по блокам и следующий шаг не запланирован'],
  ['warn', 'Нет SD-заявки на завтра', 'Включение по плану завтра, а заявки нет. Уведомление уходит дежурному'],
  ['warn', 'Висит черновик', 'Тест заведён на платформе больше 14 дней назад и не запущен'],
  ['warn', 'Сильные пересечения', '90 % выборки или больше попадает в другие тесты'],
  ['warn', 'Не заполнено обязательное', 'Нет целевой метрики, гипотезы или ссылки на аналитику'],
  ['warn', 'Выборка не успевает', 'При текущем темпе 100 % выборки наберётся позже плановой даты окончания (типично для маленьких сегментов)'],
  ['good', 'Можно смотреть результаты', 'Набраны и минимальный срок, и 100 % выборки. Для каждого теста фичи считается отдельно'],
  ['info', 'Скоро', 'Результаты через N дней, срез холдаута, старт после релиза'],
];

function renderOverview(root) {
  const counts = Object.fromEntries(STAGES.map((s) => [s.k, EXPERIMENTS.filter((e) => e.stage === s.k).length]));
  const crit = mergedAlerts().filter((a) => a.sev === 'crit' || a.sev === 'serious');
  const mark = (v) => v === 2 ? '<span class="row" style="gap:6px"><span class="dot" style="background:#141413"></span>Сильно</span>'
    : v === 1 ? '<span class="row ink2" style="gap:6px"><span class="dot" style="background:#fff;box-shadow:inset 0 0 0 2px #52514e"></span>Частично</span>'
    : '<span class="muted">—</span>';

  root.innerHTML = `
  <div class="page" style="max-width:1200px">
    <div style="padding:20px 0 8px">
      <div class="chip" style="margin-bottom:12px">Концепт-демо · данные иллюстративные · «сегодня» — 11.11.2026</div>
      <h1 style="font-size:30px;line-height:1.2;max-width:860px">Радар АБ: пять вариантов сервиса, который следит за АБ-тестами и тиражом вместо нас</h1>
      <p class="ink2" style="font-size:16px;margin-top:10px;max-width:860px">Сервис объединяет страницу тиража и АБ-платформу. Он показывает, какой тест на какой стадии, когда можно смотреть результаты и что мы забыли сделать. Все пять вариантов работают на одних данных и одной модели жизненного цикла, отличается только главный экран.</p>
    </div>

    <div class="grid-2" style="grid-template-columns:1fr 1fr;margin-top:20px">
      <div class="card"><div class="card-h"><h3>Что не так сейчас</h3></div><div class="card-b stack" style="gap:10px">
        <div class="row" style="align-items:flex-start;gap:10px"><span class="chip">211 стр.</span><span>Страница тиража выросла до 211 страниц PDF и 440+ ссылок на аналитику. Активные тесты теряются среди архивных</span></div>
        <div class="row" style="align-items:flex-start;gap:10px"><span class="chip">цвет</span><span>Статус передаётся цветом ячейки (белый, жёлтый, зелёный, красный). Отфильтровать или посчитать по нему нельзя</span></div>
        <div class="row" style="align-items:flex-start;gap:10px"><span class="chip">текст</span><span>Ход включения записывается текстом: «29.10 — ГФ 9 12 13…», «02.11 — 6 5 4 3». По нему не понять, где тест включён сейчас</span></div>
        <div class="row" style="align-items:flex-start;gap:10px"><span class="chip">N тестов</span><span>У одной фичи бывает несколько АБ-тестов: три ссылки в одной ячейке (0, 59 и 99 ₽), итерации №32 → №33, перезапуски «1.0 = 3.0, 2.0 = 4.0». У каждого теста свой срок, результат и решение, а в тираже это одна строка</span></div>
        <div class="row" style="align-items:flex-start;gap:10px"><span class="chip">2 места</span><span>АБ-платформа живёт отдельно и не знает о блоках, SD-заявках, тоглах и решениях. Тираж не знает, завершился ли тест</span></div>
        <div class="row" style="align-items:flex-start;gap:10px"><span class="chip">память</span><span>Когда смотреть результаты, кто дежурит, что пора удалить — всё держится в головах</span></div>
      </div></div>
      <div class="card"><div class="card-h"><h3>Что сервис нашёл бы сегодня в демо-данных</h3><span class="sp"></span><span class="sev-label crit">${crit.length} просрочено</span></div><div class="card-b stack">
        ${crit.slice(0, 4).map((a) => `<div class="row" style="align-items:flex-start;gap:10px">${sevIcon(a.sev)}<span><b>${esc(a.title)}</b><br><a href="#" data-open="${a.e.id}">${esc(a.group ? a.e.feature : a.e.short)}</a> <span class="muted small">${a.group ? a.group.length + ' АБ-теста фичи' : a.e.tag}</span></span></div>`).join('')}
        <div class="small muted">Эти сюжеты взяты со страницы тиража: например, АБ по ценовым сегментам с 04.08 до сих пор числится в «Запущенные и в процессе запуска».</div>
      </div></div>
    </div>

    <div class="section-label" style="margin-top:28px">На какие вопросы отвечает сервис</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
      ${[['Что сейчас запущено?', 'Список активных тестов и где они включены'], ['Что в процессе включения?', 'Матрица блоков, план шагов, SD-заявки'], ['Что закончилось и что показало?', 'Итог, решение, победитель'], ['Можно ли уже смотреть?', 'Счётчик дней и выборки, дата «можно смотреть»'], ['Что мы забыли?', 'Правила-напоминалки и дайджест']].map(([q, a], i) => `<div class="card" style="padding:14px 16px"><div class="muted small" style="margin-bottom:6px">${i + 1}</div><div style="font-weight:650">${q}</div><div class="small ink2" style="margin-top:4px">${a}</div></div>`).join('')}
    </div>

    <div class="section-label" style="margin-top:28px">Единый жизненный цикл АБ-теста <span class="cnt">общий для всех вариантов</span></div>
    <div class="card" style="padding:16px">
      <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">
        ${STAGES.map((s) => `<div class="stack" style="gap:6px"><span style="height:6px;border-radius:3px;background:${s.color}"></span><div class="row" style="gap:6px;font-weight:650;font-size:13px">${s.name}<span class="muted tnum" style="font-weight:500">${counts[s.k]}</span></div><div class="small ink2">${s.hint}</div></div>`).join('')}
      </div>
      <div class="small muted" style="margin-top:12px">Стадия заменяет цвет ячейки тиража: белый → «Подготовка», жёлтый → «Включение», зелёный → «Раскатка решения» и дальше, красный → флаг «остановлен/выключен». Цифра рядом — сколько тестов на стадии в демо.</div>
    </div>

    <div class="section-label" style="margin-top:28px">Фича и её АБ-тесты <span class="cnt">тоже общее для всех вариантов</span></div>
    <div class="card" style="padding:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
        <div><div style="font-weight:650">Фича = строка тиража</div><div class="small ink2" style="margin-top:4px">Ссылка на аналитику, релиз, блокеры, история итераций («что уже пробовали»), задача на удаление тоглов. Внутри — один или несколько АБ-тестов.</div></div>
        <div><div style="font-weight:650">Параллельные тесты</div><div class="small ink2" style="margin-top:4px">Один запуск, разные сегменты или рубильники: лендинги 0 / 59 / 99 ₽, <span class="mono">returnNotificationsPrice1/2/3Ab</span>. У каждого своя выборка и поэтому своя дата «можно смотреть», свой результат и своё решение: где-то раскатываем, где-то оставляем контроль.</div></div>
        <div><div style="font-weight:650">Последовательные итерации</div><div class="small ink2" style="margin-top:4px">№32 → №33, стиль уведомлений №1…№14, перезапуск с новой версией сути (V1 → V2). Сервис связывает их в историю фичи и при создании следующего теста сам предлагает номер и версию по конвенции.</div></div>
      </div>
      <div class="small muted" style="margin-top:12px">В Пульте и Ассистенте напоминания по тестам одной фичи склеиваются в одну строку со списком тестов. В Конвейере их можно свернуть в одну карточку, в Таймлайне — сгруппировать по фичам, в Умном тираже фича — строка, а тесты — вложенные строки. В паспорте есть переключатель между тестами фичи.</div>
    </div>

    <div class="section-label" style="margin-top:28px">Пять вариантов</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px">
      ${CONCEPTS.map((c) => `<div class="card" style="display:flex;flex-direction:column">
        <div style="padding:16px 16px 0"><div class="row"><span class="logo-mark" style="width:26px;height:26px;font-size:12px">${c.n}</span><h2>${c.name}</h2></div>
        <div style="font-weight:600;margin-top:8px">${c.tag}</div>
        <p class="ink2" style="margin-top:6px;font-size:13px">${c.idea}</p>
        <div class="small" style="margin-top:10px"><span class="muted">Лучше всего для:</span> ${c.best}</div></div>
        <div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12.5px">
          <div><div class="sev-label good" style="margin-bottom:4px">Плюсы</div>${c.pros.map((p) => `<div style="margin-bottom:4px">${p}</div>`).join('')}</div>
          <div><div class="sev-label serious" style="margin-bottom:4px">Минусы</div>${c.cons.map((p) => `<div style="margin-bottom:4px">${p}</div>`).join('')}</div>
        </div>
        <div style="margin-top:auto;padding:0 16px 16px"><a class="btn primary" href="#${c.id}" style="text-decoration:none">Открыть демо →</a></div>
      </div>`).join('')}
      <div class="card" style="display:flex;flex-direction:column;background:var(--surface-2)">
        <div style="padding:16px"><div class="row"><span class="logo-mark" style="width:26px;height:26px;font-size:12px;background:#52514e">+</span><h2>Паспорт эксперимента</h2></div>
        <div style="font-weight:600;margin-top:8px">Общий элемент всех вариантов</div>
        <p class="ink2" style="margin-top:6px;font-size:13px">Одна карточка заменяет строку тиража и страницу АБ-платформы: жизненный цикл, «когда смотреть», варианты и сплит, результаты с доверительными интервалами, решение, матрица блоков, журнал с SD, тоглы, пересечения. Открывается кликом по тесту в любом варианте.</p></div>
        <div style="margin-top:auto;padding:0 16px 16px"><button class="btn" data-open="style14">Открыть пример паспорта</button></div>
      </div>
    </div>

    <div class="section-label" style="margin-top:28px">Насколько вариант закрывает потребность</div>
    <div class="card" style="overflow-x:auto">
      <table class="t"><thead><tr><th style="position:static">Потребность</th>${CONCEPTS.map((c) => `<th style="position:static">${c.n}. ${c.name}</th>`).join('')}</tr></thead>
      <tbody>${NEEDS.map(([n, v]) => `<tr><td>${n}</td>${v.map((x) => `<td>${mark(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    </div>

    <div class="grid-2" style="grid-template-columns:1.2fr 1fr;margin-top:28px">
      <div>
        <div class="section-label" style="margin-top:0">Правила-напоминалки <span class="cnt">работают во всех вариантах</span></div>
        <div class="card"><table class="t"><tbody>
          ${RULES.map(([s, n, w]) => `<tr><td style="width:28px">${sevIcon(s)}</td><td style="font-weight:600;white-space:nowrap">${n}</td><td class="ink2">${w}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
      <div>
        <div class="section-label" style="margin-top:0">Рекомендация</div>
        <div class="card" style="padding:18px">
          <p style="font-size:15px"><b>Первая версия: «Пульт» с паспортом эксперимента и уведомлениями из «Ассистента».</b></p>
          <p class="ink2" style="margin-top:8px">Это сильнее всего бьёт в главную боль, «мы забываем»: просроченное само поднимается наверх и приходит в мессенджер, а решение записывается в один клик.</p>
          <p class="ink2" style="margin-top:8px">«Умный тираж» — вторым шагом, вместо таблицы в Confluence. «Конвейер» и «Таймлайн» дешевле всего делать как переключаемые виды над теми же данными: доска для синка, таймлайн для планирования.</p>
          <div class="divider" style="margin:14px 0"></div>
          <div class="small muted">Что важно решить до старта: единое правило «когда можно смотреть» (минимальный срок и выборка), кто владелец решения по тесту и кто дежурит по включению.</div>
        </div>
      </div>
    </div>
  </div>`;
}

VIEWS.overview = { render: renderOverview };
