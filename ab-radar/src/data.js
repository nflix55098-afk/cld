/* ===================================================================
   Демо-данные. Сюжеты взяты со страницы тиража и АБ-платформы,
   но люди, номера SD, ключи и ссылки — вымышленные.
   «Сегодня» в демо — 11.11.2026.
   =================================================================== */

const TODAY_STR = '11.11.2026';
const ME = 'Анна К.';

const TEAM = { name: 'Уведомления', platform: 'Android' };

const PEOPLE = ['Анна К.', 'Дмитрий П.', 'Мария С.', 'Игорь Л.', 'Ольга В.'];

/* Очередь дежурных по включению (как «Очередность включающих фичи» на странице тиража) */
const DUTY = [
  { who: 'Анна К.', week: '09.11 – 15.11', now: true },
  { who: 'Дмитрий П.', week: '16.11 – 22.11' },
  { who: 'Мария С.', week: '23.11 – 29.11' },
  { who: 'Игорь Л.', week: '30.11 – 06.12' },
  { who: 'Ольга В.', week: '07.12 – 13.12' },
];

/* Порядок включения по блокам — как на тираже: ГФ → 12, 9, 8, 7 → 6, 5, 4 → 3, 2, 1 → SI1–SI4 */
const BLOCKS = ['ГФ', '12', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'SI1', 'SI2', 'SI3', 'SI4'];

const RELEASES = [
  { v: '17.11', d: '24.08.2026' },
  { v: '17.12', d: '14.09.2026' },
  { v: '17.13', d: '05.10.2026' },
  { v: '17.14', d: '27.10.2026' },
  { v: '17.15', d: '16.11.2026' },
  { v: '17.16', d: '07.12.2026' },
  { v: '17.17', d: '12.01.2027' },
];

/* Единый жизненный цикл АБ-теста — общий для всех вариантов сервиса */
const STAGES = [
  { k: 'prep',       name: 'Подготовка',       color: '#898781', hint: 'Аналитика, гипотеза, метрики, варианты рубильника, тест заведён на платформе' },
  { k: 'release',    name: 'Ждёт релиза',      color: '#6250d6', hint: 'Код в релизе, пилот на бете; старт АБ — после раскатки релиза' },
  { k: 'enabling',   name: 'Включение',        color: '#eda100', hint: 'SD-заявки и поблочное включение: ГФ → 12, 9, 8, 7 → … → SI1–SI4' },
  { k: 'collecting', name: 'Сбор данных',      color: '#2a78d6', hint: 'АБ на всех блоках, копим выборку. Смотреть результаты пока рано' },
  { k: 'ready',      name: 'Готов к анализу',  color: '#eb6834', hint: 'Минимальный срок и выборка набраны: смотрим результаты, записываем решение' },
  { k: 'rollout',    name: 'Раскатка решения', color: '#1baf7a', hint: 'Победивший вариант включаем на все блоки' },
  { k: 'cleanup',    name: 'Чистка',           color: '#008300', hint: 'Удаляем тоглы, рубильники и неиспользуемые ветки АБ' },
  { k: 'done',       name: 'Архив',            color: '#c3c2b7', hint: 'Результат и решение зафиксированы, всё убрано' },
];

/* ------------------------------------------------------------------
   Эксперименты
   t событий: note | sys | beta | ab | on | pause | plan | result | decision | toggle
   b: массив блоков, 'all' — все 15 блоков, ['Бета+'] — бета
   ------------------------------------------------------------------ */
const EXPERIMENTS = [
  {
    id: 'style14',
    feature: 'Стиль уведомлений. Выводим 4+ стили',
    iter: 14, branch: 'описание стиля Стандарт', ver: 'V1', range: '48.0-53.0', launch: '25.09.2026',
    key: 'pushStyleDescriptionAb', release: '17.12', owner: 'Ольга В.',
    type: 'ab', platform: 'Завершён', stage: 'ready',
    hypothesis: 'Если на экране стилей изменить описание стиля «Стандарт», то уменьшится конверсия в установку стиля «Стандарт» и увеличится конверсия в установку остальных стилей.',
    metric: 'Конверсия в установку стиля «Стандарт»', metric2: 'Конверсия в установку остальных стилей',
    minDays: 28, planDays: 39, sample: 100,
    dates: { created: '16.09.2026', enableStart: '22.09.2026', fullAt: '26.09.2026', platformEnd: '04.11.2026' },
    variants: [
      { v: '48.0', name: 'Классический стиль, который банк использует более 20 лет', share: 16 },
      { v: '49.0', name: 'Классический формат уведомлений от банка', share: 16 },
      { v: '50.0', name: 'Обычные уведомления от банка', share: 16 },
      { v: '51.0', name: 'Обычные уведомления от банка, как у всех', share: 16 },
      { v: '52.0', name: 'Формальный язык без эмоциональной окраски', share: 16 },
      { v: '53.0', name: 'Контроль — текущее описание', share: 20, control: true },
    ],
    results: {
      status: 'ready', direction: 'down',
      note: 'Платформа посчитала итог 04.11. Разбора и решения пока нет.',
      rows: [
        { v: '53.0', value: 38.4, control: true },
        { v: '48.0', value: 36.3, delta: -2.1, lo: -3.0, hi: -1.2, sig: true },
        { v: '49.0', value: 37.0, delta: -1.4, lo: -2.3, hi: -0.5, sig: true },
        { v: '50.0', value: 37.8, delta: -0.6, lo: -1.5, hi: 0.3, sig: false },
        { v: '51.0', value: 37.5, delta: -0.9, lo: -1.8, hi: 0.1, sig: false },
        { v: '52.0', value: 35.1, delta: -3.3, lo: -4.2, hi: -2.4, sig: true },
      ],
    },
    decision: null,
    events: [
      { d: '16.09.2026', t: 'note', txt: 'Аналитика согласована, тест заведён на АБ-платформе' },
      { d: '22.09.2026', t: 'beta', b: ['Бета+'], v: '48.0–53.0', txt: 'Включено в Бета+ на всех блоках', sd: 'SD0001900412' },
      { d: '24.09.2026', t: 'ab', b: ['ГФ', '12', '9', '8', '7'], txt: 'Запущен АБ 16×5 / 20', sd: 'SD0001921870' },
      { d: '25.09.2026', t: 'ab', b: ['6', '5', '4', '3', '2', '1'], txt: 'Запущен АБ', sd: 'SD0001934025' },
      { d: '26.09.2026', t: 'ab', b: ['SI1', 'SI2', 'SI3', 'SI4'], txt: 'Запущен АБ — все блоки', sd: 'SD0001940118' },
      { d: '24.10.2026', t: 'sys', txt: 'Набран минимальный срок (28 дней) и выборка — можно смотреть результаты' },
      { d: '04.11.2026', t: 'pause', b: 'all', v: '53.0', txt: 'АБ-платформа: тест завершён, все клиенты на контроле 53.0' },
    ],
    toggles: [
      { n: 'pushStyleDescriptionAb', kind: 'рубильник', st: 'todo' },
      { n: 'Ветки описаний 48.0–52.0 в CMS', kind: 'конфиг', st: 'todo' },
    ],
    cross: { clean: 1, mixed: 99, with: ['cards1', 'br-cms2', 'activ33'] },
  },

  {
    id: 'br-cms2',
    feature: 'Близкие рядом. Перевод лендинга на CMS',
    iter: 2, branch: 'переход от БР к СУ', ver: 'V1', range: '1.0-2.0', launch: '01.10.2026',
    key: 'closeOnesLandingCmsAb', release: '17.13', owner: 'Игорь Л.',
    type: 'ab', platform: 'Завершён', stage: 'rollout',
    hypothesis: 'Если заменить текст в шторке лендинга, то конверсия в подключение СУ не упадёт (проверка «не хуже», порог −1 п.п.).',
    metric: 'Конверсия в подключение СУ', metric2: 'Доля отказов на лендинге',
    minDays: 28, planDays: 34, sample: 100,
    dates: { created: '24.09.2026', enableStart: '29.09.2026', fullAt: '01.10.2026', platformEnd: '04.11.2026', decisionAt: '07.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль — текущий лендинг', share: 50, control: true },
      { v: '2.0', name: 'Лендинг из CMS с новым текстом в шторке', share: 50 },
    ],
    results: {
      status: 'reviewed', direction: 'noninf', threshold: -1.0,
      note: 'Конверсия не упала: −0,2 п.п., весь доверительный интервал выше порога −1 п.п.',
      rows: [
        { v: '1.0', value: 12.4, control: true },
        { v: '2.0', value: 12.2, delta: -0.2, lo: -0.7, hi: 0.3, sig: false, verdict: 'не хуже' },
      ],
    },
    decision: { d: '07.11.2026', who: 'Игорь Л.', winner: '2.0', text: 'Раскатываем 2.0 на всех клиентов. Старый лендинг выпиливаем в 17.16.' },
    events: [
      { d: '24.09.2026', t: 'note', txt: 'Настроили лендинг в CMS по аналогии с iOS' },
      { d: '29.09.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включено в Бета+ со значением 2.0', sd: 'SD0002069810' },
      { d: '30.09.2026', t: 'ab', b: ['ГФ', '12', '9', '8', '7', '6', '5', '4', '3', '2', '1'], txt: 'Запущен АБ 50/50', sd: 'SD0002081544' },
      { d: '01.10.2026', t: 'ab', b: ['SI1', 'SI2', 'SI3', 'SI4'], txt: 'Запущен АБ — все блоки', sd: 'SD0002099031' },
      { d: '29.10.2026', t: 'sys', txt: 'Набран минимальный срок (28 дней) — можно смотреть результаты' },
      { d: '04.11.2026', t: 'pause', b: 'all', v: '1.0', txt: 'АБ-платформа: тест завершён' },
      { d: '06.11.2026', t: 'result', txt: 'Результаты разобраны: «не хуже» подтверждено' },
      { d: '07.11.2026', t: 'decision', txt: 'Решение: раскатываем 2.0 на всех' },
      { d: '09.11.2026', t: 'on', b: ['ГФ'], v: '2.0', txt: 'Включено 2.0 на пром ГФ', sd: 'SD0002433371' },
      { d: '10.11.2026', t: 'on', b: ['12', '9', '8', '7'], v: '2.0', txt: 'Включено 2.0', sd: 'SD0002441092' },
      { d: '12.11.2026', t: 'plan', b: ['6', '5', '4'], v: '2.0', txt: 'План: включить 2.0', sd: 'SD0002448830' },
      { d: '13.11.2026', t: 'plan', b: ['3', '2', '1'], v: '2.0', txt: 'План: включить 2.0', sd: 'SD0002450117' },
      { d: '16.11.2026', t: 'plan', b: ['SI1', 'SI2', 'SI3', 'SI4'], v: '2.0', txt: 'План: включить 2.0' },
    ],
    toggles: [
      { n: 'closeOnesLandingCmsAb', kind: 'рубильник', st: 'todo' },
      { n: 'Старый нативный лендинг БР', kind: 'фича', st: 'planned', where: 'Удаление тоглов, ч. 22 · 17.16' },
    ],
    cross: { clean: 14, mixed: 86, with: ['style14', 'cards1'] },
  },

  {
    id: 'cards1',
    feature: 'Карточки под номером телефона',
    iter: 1, branch: 'разный состав карточек', ver: 'V1', range: '5.0-7.0', launch: '22.09.2026',
    key: 'rightCardInSettings', release: '17.12', owner: 'Мария С.',
    type: 'ab', platform: 'Завершён', stage: 'cleanup',
    hypothesis: 'Состав карточек под номером телефона положительно повлияет на подключение стилей и уведомлений.',
    metric: 'Подключение стилей/уведомлений с экрана настроек', metric2: 'CTR карточек',
    minDays: 21, planDays: 28, sample: 100,
    dates: { created: '16.09.2026', enableStart: '24.09.2026', fullAt: '29.09.2026', platformEnd: '23.10.2026', decisionAt: '28.10.2026', rolloutDoneAt: '05.11.2026' },
    variants: [
      { v: '5.0', name: '3 карточки (2 про стиль и 1 про маскота) — как сейчас', share: 34, control: true },
      { v: '6.0', name: '2 карточки про стиль', share: 33 },
      { v: '7.0', name: '2 карточки: стиль + тонкие настройки', share: 33 },
    ],
    results: {
      status: 'reviewed', direction: 'up',
      note: 'Выиграл вариант 6.0: +0,35 п.п. (+4,1 % отн.), значимо.',
      rows: [
        { v: '5.0', value: 8.60, control: true },
        { v: '6.0', value: 8.95, delta: 0.35, lo: 0.12, hi: 0.58, sig: true },
        { v: '7.0', value: 8.70, delta: 0.10, lo: -0.13, hi: 0.33, sig: false },
      ],
    },
    decision: { d: '28.10.2026', who: 'Мария С.', winner: '6.0', text: 'Раскатываем 6.0 на всех. Ветки 5.0 и 7.0 удаляем из кода.' },
    events: [
      { d: '16.09.2026', t: 'note', txt: 'Запускаем новый АБ: 5.0 — 3 карточки, 6.0 — 2 про стиль, 7.0 — стиль + тонкие настройки' },
      { d: '24.09.2026', t: 'ab', b: ['ГФ', '12', '9', '8', '7'], txt: 'Запущен АБ 34/33/33', sd: 'SD0001923340' },
      { d: '25.09.2026', t: 'ab', b: ['6', '5', '4'], txt: 'Запущен АБ', sd: 'SD0001935561' },
      { d: '28.09.2026', t: 'ab', b: ['3', '2'], txt: 'Запущен АБ', sd: 'SD0001951207' },
      { d: '29.09.2026', t: 'ab', b: ['1', 'SI1', 'SI2', 'SI3', 'SI4'], txt: 'Запущен АБ — все блоки', sd: 'SD0001960644' },
      { d: '20.10.2026', t: 'sys', txt: 'Набран минимальный срок (21 день) — можно смотреть результаты' },
      { d: '23.10.2026', t: 'pause', b: 'all', v: '5.0', txt: 'АБ-платформа: тест завершён' },
      { d: '27.10.2026', t: 'result', txt: 'Выиграл вариант 6.0' },
      { d: '28.10.2026', t: 'decision', txt: 'Решение: раскатываем 6.0' },
      { d: '30.10.2026', t: 'on', b: ['ГФ', '12', '9', '8', '7'], v: '6.0', txt: 'Включено 6.0', sd: 'SD0002392210' },
      { d: '03.11.2026', t: 'on', b: ['6', '5', '4', '3', '2', '1'], v: '6.0', txt: 'Включено 6.0', sd: 'SD0002408870' },
      { d: '05.11.2026', t: 'on', b: ['SI1', 'SI2', 'SI3', 'SI4'], v: '6.0', txt: 'Включено 6.0 — все блоки', sd: 'SD0002419305' },
      { d: '06.11.2026', t: 'toggle', txt: 'Удаление веток 5.0 и 7.0 добавлено в «Удаление тоглов, ч. 22»' },
    ],
    toggles: [
      { n: 'rightCardInSettings: ветки 5.0, 7.0', kind: 'рубильник', st: 'planned', where: 'Удаление тоглов, ч. 22 · 17.16' },
      { n: 'leftCardInSettings', kind: 'конфиг', st: 'todo' },
      { n: 'cardsInSettings', kind: 'конфиг', st: 'done', where: 'Удаление тоглов, ч. 21' },
    ],
    cross: { clean: 9, mixed: 91, with: ['style14', 'br-cms2'] },
  },

  {
    id: 'activ33',
    feature: 'Активация клиента с 1 продуктом',
    iter: 33, branch: 'Заголовок', ver: 'V2', range: '87.0-88.0', launch: '01.10.2026',
    key: 'activationTitleAb', release: '17.12', owner: 'Дмитрий П.',
    type: 'ab', platform: 'Завершён', stage: 'done',
    hypothesis: 'Заголовок «С уведомлениями спокойнее» может увеличить количество подключаемых уведомлений.',
    metric: 'Подключение уведомлений', metric2: '',
    minDays: 14, planDays: 14, sample: 100,
    dates: { created: '28.09.2026', enableStart: '30.09.2026', fullAt: '30.09.2026', platformEnd: '14.10.2026', decisionAt: '21.10.2026', cleanupDoneAt: '30.10.2026' },
    variants: [
      { v: '87.0', name: 'Контроль — текущий заголовок', share: 50, control: true },
      { v: '88.0', name: '«С уведомлениями спокойнее»', share: 50 },
    ],
    results: {
      status: 'reviewed', direction: 'up',
      note: 'Значимой разницы нет: +0,3 п.п., интервал пересекает ноль.',
      rows: [
        { v: '87.0', value: 15.2, control: true },
        { v: '88.0', value: 15.5, delta: 0.3, lo: -0.4, hi: 1.0, sig: false },
      ],
    },
    decision: { d: '21.10.2026', who: 'Дмитрий П.', winner: '87.0', text: 'Эффекта нет. Оставляем текущий заголовок, гипотезу закрываем.' },
    events: [
      { d: '30.09.2026', t: 'ab', b: 'all', txt: 'Запущен АБ 50/50 — все блоки', sd: 'SD0002080023' },
      { d: '14.10.2026', t: 'pause', b: 'all', v: '87.0', txt: 'АБ-платформа: тест завершён' },
      { d: '20.10.2026', t: 'result', txt: 'Нет значимой разницы' },
      { d: '21.10.2026', t: 'decision', txt: 'Оставляем контроль' },
      { d: '30.10.2026', t: 'toggle', txt: 'Рубильник удалён в «Удаление тоглов, ч. 21»' },
    ],
    toggles: [{ n: 'activationTitleAb', kind: 'рубильник', st: 'done', where: 'Удаление тоглов, ч. 21' }],
    cross: { clean: 3, mixed: 97, with: ['style14'] },
  },

  {
    id: 'activ32',
    feature: 'Активация клиента с 1 продуктом',
    iter: 32, branch: 'Заголовок «Спокойнее за ваши деньги»', ver: 'V1', range: '85.0-86.0', launch: '21.09.2026',
    key: 'activationTitleAb', release: '17.12', owner: 'Дмитрий П.',
    type: 'ab', platform: 'Завершён', stage: 'done', flags: ['stopped'],
    hypothesis: 'Заголовок «Спокойнее за ваши деньги» может увеличить количество подключаемых уведомлений.',
    metric: 'Подключение уведомлений', metric2: '',
    minDays: 14, planDays: 14, sample: 64,
    dates: { created: '18.09.2026', enableStart: '22.09.2026', fullAt: '22.09.2026', platformEnd: '02.10.2026', decisionAt: '02.10.2026', cleanupDoneAt: '02.10.2026' },
    variants: [
      { v: '85.0', name: 'Контроль', share: 50, control: true },
      { v: '86.0', name: '«Спокойнее за ваши деньги»', share: 50 },
    ],
    results: { status: 'invalid', note: 'Остановлен досрочно: ошибка в разметке события подключения. Данные невалидны.' },
    decision: { d: '02.10.2026', who: 'Дмитрий П.', winner: null, text: 'Останавливаем, чиним разметку, перезапускаем как №33 (V2).' },
    events: [
      { d: '22.09.2026', t: 'ab', b: 'all', txt: 'Запущен АБ 50/50 — все блоки', sd: 'SD0001911540' },
      { d: '02.10.2026', t: 'pause', b: 'all', v: '85.0', txt: 'Остановлен досрочно: ошибка разметки' },
      { d: '02.10.2026', t: 'decision', txt: 'Перезапуск как №33' },
    ],
    toggles: [],
    cross: { clean: 5, mixed: 95, with: [] },
  },

  {
    id: 'free-reason',
    feature: 'Показываем причину бесплатности уведомлений об операциях',
    iter: 1, branch: 'причина бесплатности на экране', ver: 'V1', range: '1.0-2.0', launch: '05.11.2026',
    key: 'freeNotificationsReasonAb', release: '17.13', owner: 'Анна К.',
    type: 'ab', platform: 'Запущен', stage: 'collecting',
    hypothesis: 'Если объяснить клиенту, почему уведомления для него бесплатны, то снизится доля отключений уведомлений об операциях.',
    metric: 'Доля отключений уведомлений за 14 дней', metric2: 'Обращения в поддержку по теме уведомлений',
    minDays: 14, planDays: 28, sample: 24,
    dates: { created: '28.10.2026', enableStart: '30.10.2026', fullAt: '05.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль', share: 50, control: true },
      { v: '2.0', name: 'Плашка с причиной бесплатности', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '28.10.2026', t: 'note', txt: 'Тест заведён на АБ-платформе' },
      { d: '30.10.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включено в Бета+ со значением 2.0', sd: 'SD0002401177' },
      { d: '03.11.2026', t: 'ab', b: ['ГФ'], txt: 'Запущен АБ на пром ГФ', sd: 'SD0002404520' },
      { d: '04.11.2026', t: 'ab', b: ['12', '9', '8', '7'], txt: 'Запущен АБ', sd: 'SD0002411960' },
      { d: '05.11.2026', t: 'ab', b: ['6', '5', '4', '3', '2', '1', 'SI1', 'SI2', 'SI3', 'SI4'], txt: 'Запущен АБ — все блоки', sd: 'SD0002417702' },
    ],
    toggles: [{ n: 'freeNotificationsReasonAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 22, mixed: 78, with: ['activ-price', 'banner-cms'] },
  },

  {
    id: 'activ-price',
    feature: 'Активация клиента с 1 продуктом. Лендинги под ценовые сегменты',
    iter: 1, branch: 'лендинг по цене', ver: 'V1', range: '1.0-2.0', launch: '05.11.2026',
    key: 'activationLandingPriceAb', release: '17.13', owner: 'Дмитрий П.',
    type: 'ab', platform: 'Запущен', stage: 'collecting',
    hypothesis: 'Если показывать лендинг, учитывающий ценовой сегмент клиента, то конверсия в подключение вырастет во всех трёх сегментах.',
    metric: 'Конверсия лендинга в подключение', metric2: 'Отключения в первые 7 дней',
    minDays: 14, planDays: 21, sample: 27,
    subtests: [
      { name: 'Сегмент 0 ₽', sample: 28 },
      { name: 'Сегмент 59 ₽', sample: 31 },
      { name: 'Сегмент 99 ₽', sample: 22 },
    ],
    dates: { created: '27.10.2026', enableStart: '31.10.2026', fullAt: '05.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль — общий лендинг', share: 50, control: true },
      { v: '2.0', name: 'Лендинг под сегмент', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '31.10.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включено в Бета+ (3 рубильника)', sd: 'SD0002399030' },
      { d: '05.11.2026', t: 'ab', b: 'all', txt: 'Запущены 3 АБ-теста (0 ₽, 59 ₽, 99 ₽) — все блоки', sd: 'SD0002418811' },
    ],
    toggles: [
      { n: 'activationLandingPrice0Ab', kind: 'рубильник', st: 'todo' },
      { n: 'activationLandingPrice59Ab', kind: 'рубильник', st: 'todo' },
      { n: 'activationLandingPrice99Ab', kind: 'рубильник', st: 'todo' },
    ],
    cross: { clean: 22, mixed: 78, with: ['free-reason', 'banner-cms'] },
  },

  {
    id: 'reactions2',
    feature: 'Реакции на переводы в СБОЛ',
    iter: 2, branch: 'обновлённые реакции', ver: 'V1', range: '1.0-2.0', launch: '04.11.2026',
    key: 'moneyTransferReactAb', release: '17.12', owner: 'Игорь Л.',
    type: 'ab', platform: 'Запущен', stage: 'enabling',
    hypothesis: 'Обновлённый набор реакций увеличит долю переводов, на которые получатель отвечает реакцией.',
    metric: 'Доля переводов с реакцией получателя', metric2: 'Повторные переводы в течение 7 дней',
    minDays: 14, planDays: 28, sample: 6,
    dates: { created: '15.08.2026', enableStart: '04.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль — текущие реакции', share: 50, control: true },
      { v: '2.0', name: 'Обновлённые реакции', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '17.08.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включили на бете ГФ', sd: 'SD0001596020' },
      { d: '04.11.2026', t: 'ab', b: ['ГФ'], txt: 'Старт тиража обновлённых реакций, АБ 50/50', sd: 'SD0002410388' },
      { d: '05.11.2026', t: 'ab', b: ['12', '7'], txt: 'Запущен АБ', sd: 'SD0002417015' },
    ],
    toggles: [{ n: 'moneyTransferReactAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 41, mixed: 59, with: ['banner-cms'] },
  },

  {
    id: 'banner-cms',
    feature: 'Перенести продающий баннер в ИО на CMS',
    iter: 1, branch: 'баннер из CMS', ver: 'V1', range: '1.0-2.0', launch: '03.11.2026',
    key: 'sellingBannerCmsAb', release: '17.12', owner: 'Анна К.',
    type: 'ab', platform: 'Запущен', stage: 'collecting',
    hypothesis: 'Перенос баннера в CMS не снизит конверсию в подключение уведомлений (проверка «не хуже»).',
    metric: 'Конверсия баннера в подключение', metric2: 'CTR баннера',
    minDays: 14, planDays: 21, sample: 41,
    dates: { created: '22.10.2026', enableStart: '29.10.2026', fullAt: '03.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль — нативный баннер', share: 50, control: true },
      { v: '2.0', name: 'Баннер из CMS', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '29.10.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включено в Бета+', sd: 'SD0002388090' },
      { d: '03.11.2026', t: 'ab', b: 'all', txt: 'Запущен АБ 50/50 — все блоки', sd: 'SD0002405233' },
    ],
    toggles: [{ n: 'sellingBannerCmsAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 30, mixed: 70, with: ['free-reason', 'activ-price', 'reactions2'] },
  },

  {
    id: 'return-push-price',
    feature: 'Вернуть уведомления об операциях. Версия 2. Ценовые сегменты (99/59/0 ₽)',
    iter: 1, branch: 'возврат по цене', ver: 'V1', range: '1.0-2.0', launch: '04.08.2026',
    key: 'returnNotificationsPriceAb', release: '17.11', owner: 'Мария С.',
    type: 'ab', platform: 'Запущен', stage: 'ready',
    hypothesis: 'Предложение вернуть уведомления с учётом ценового сегмента увеличит долю возвратов во всех сегментах.',
    metric: 'Доля клиентов, вернувших уведомления', metric2: 'Отток через 30 дней',
    minDays: 21, planDays: 28, sample: 100,
    subtests: [
      { name: 'returnNotificationsPrice1Ab · 99 ₽', sample: 100 },
      { name: 'returnNotificationsPrice2Ab · 59 ₽', sample: 100 },
      { name: 'returnNotificationsPrice3Ab · 0 ₽', sample: 100 },
    ],
    dates: { created: '24.07.2026', enableStart: '29.07.2026', fullAt: '04.08.2026' },
    variants: [
      { v: '1.0', name: 'Контроль', share: 50, control: true },
      { v: '2.0', name: 'Предложение с учётом сегмента', share: 50 },
    ],
    results: {
      status: 'ready', direction: 'up',
      note: 'Итоги на платформе готовы с 01.09 — их никто не разбирал. Тест всё ещё идёт.',
      rows: [
        { v: '1.0', value: 6.1, control: true, label: 'Контроль' },
        { v: '2.0', value: 6.9, delta: 0.8, lo: 0.3, hi: 1.3, sig: true, label: '99 ₽' },
        { v: '2.0', value: 6.6, delta: 0.5, lo: 0.1, hi: 0.9, sig: true, label: '59 ₽' },
        { v: '2.0', value: 8.0, delta: 1.9, lo: 1.2, hi: 2.6, sig: true, label: '0 ₽' },
      ],
    },
    decision: null,
    events: [
      { d: '29.07.2026', t: 'note', txt: 'Запускаем АБ на все блоки, рубильники 50/50' },
      { d: '04.08.2026', t: 'ab', b: 'all', txt: 'Запущен АБ 50/50 для Price1Ab, Price2Ab, Price3Ab', sd: 'SD0001455012' },
      { d: '25.08.2026', t: 'sys', txt: 'Набран минимальный срок (21 день) — можно смотреть результаты' },
      { d: '01.09.2026', t: 'sys', txt: 'Плановая дата окончания (28 дней). Тест не остановлен' },
    ],
    toggles: [
      { n: 'returnNotificationsPrice1Ab', kind: 'рубильник', st: 'todo' },
      { n: 'returnNotificationsPrice2Ab', kind: 'рубильник', st: 'todo' },
      { n: 'returnNotificationsPrice3Ab', kind: 'рубильник', st: 'todo' },
    ],
    cross: { clean: 2, mixed: 98, with: ['feed-off', 'style14', 'free-reason'] },
  },

  {
    id: 'shtorka2',
    feature: 'Шторка детализации для уведомлений «Уведомления не подключены»',
    iter: 2, branch: 'повторное включение', ver: 'V2', range: '3.0-4.0', launch: 'DD.MM.YYYY',
    key: 'notConnectedSheetAb', release: '17.14', owner: 'Ольга В.',
    type: 'ab', platform: 'Новый', stage: 'prep',
    blockers: 'Ждём правку текстов в CMS от бэка',
    hypothesis: 'Шторка с детализацией для клиентов без уведомлений увеличит подключения из ленты операций.',
    metric: '', metric2: '',
    minDays: 14, planDays: 28, sample: 0,
    dates: { created: '20.10.2026' },
    variants: [
      { v: '3.0', name: 'Контроль', share: 50, control: true },
      { v: '4.0', name: 'Шторка с детализацией', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '12.08.2026', t: 'note', txt: 'Итерация №1 остановлена: некорректные тексты' },
      { d: '20.10.2026', t: 'note', txt: 'Готовим к повторному включению, тест заведён на платформе' },
      { d: '21.10.2026', t: 'beta', b: ['Бета+'], v: '4.0', txt: 'Включено в Бета+ на всех блоках', sd: 'SD0002288101' },
    ],
    toggles: [{ n: 'notConnectedSheetAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 0, mixed: 0, with: [] },
  },

  {
    id: 'feed-off',
    feature: 'Лента уведомлений более не доступна',
    iter: 1, branch: 'отключение ленты', ver: 'V1', range: '1.0-3.0', launch: '04.06.2026',
    key: 'notificationFeedOffAb', release: '17.8', owner: 'Анна К.',
    type: 'holdout', platform: 'Запущен', stage: 'collecting',
    hypothesis: 'Отключение старой ленты уведомлений не ухудшит вовлечённость в раздел «Уведомления». Холдаут 3 % держим до конца года.',
    metric: 'MAU раздела «Уведомления»', metric2: 'Обращения в поддержку',
    minDays: 30, planDays: 210, sample: 100,
    holdout: { until: '31.12.2026', every: 30, last: '01.11.2026', next: '01.12.2026', lastNote: 'Срез 01.11: −0,1 % MAU, незначимо' },
    dates: { created: '28.05.2026', enableStart: '04.06.2026', fullAt: '09.06.2026', planEnd: '31.12.2026' },
    variants: [
      { v: '0.0', name: 'Лента отключена (раскатанное решение)', share: 97 },
      { v: '1.0', name: 'Холдаут: лента доступна', share: 1, control: true },
      { v: '2.0', name: 'Холдаут: лента + баннер', share: 1 },
      { v: '3.0', name: 'Холдаут: лента в настройках', share: 1 },
    ],
    results: {
      status: 'reviewed', direction: 'noninf', threshold: -1.0,
      note: 'Последний срез 01.11: эффекта нет. Следующий срез — 01.12.',
      rows: [
        { v: '1.0', value: 100, control: true, label: 'Холдаут' },
        { v: '0.0', value: 99.9, delta: -0.1, lo: -0.6, hi: 0.4, sig: false, label: 'Лента отключена', verdict: 'не хуже' },
      ],
    },
    decision: null,
    events: [
      { d: '04.06.2026', t: 'ab', b: ['ГФ'], txt: 'Включен АБ 97/1/1/1 на пром ГФ', sd: 'SD0000836964' },
      { d: '05.06.2026', t: 'ab', b: ['12', '9', '8', '7', '6', '5', '4'], txt: 'Включен АБ', sd: 'SD0000842871' },
      { d: '08.06.2026', t: 'ab', b: ['3', '2', '1'], txt: 'Включен АБ', sd: 'SD0000861190' },
      { d: '09.06.2026', t: 'ab', b: ['SI1', 'SI2', 'SI3', 'SI4'], txt: 'Включен АБ — все блоки', sd: 'SD0000870402' },
      { d: '01.10.2026', t: 'result', txt: 'Срез холдаута: эффекта нет' },
      { d: '01.11.2026', t: 'result', txt: 'Срез холдаута: −0,1 % MAU, незначимо' },
    ],
    toggles: [{ n: 'notificationFeedOffAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 2, mixed: 98, with: ['return-push-price'] },
  },

  {
    id: 'pay-spasibo',
    feature: 'Оплата уведомлений бонусами «Спасибо»',
    iter: 1, branch: 'оплата бонусами', ver: 'V1', range: '1.0-2.0', launch: '03.11.2026',
    key: 'payNotificationsBonusAb', release: '17.13', owner: 'Дмитрий П.',
    type: 'ab', platform: 'Запущен', stage: 'enabling',
    hypothesis: 'Возможность оплатить уведомления бонусами снизит отключения из-за платы.',
    metric: 'Отключения уведомлений из-за платы', metric2: 'Доля оплат бонусами',
    minDays: 14, planDays: 28, sample: 4,
    dates: { created: '27.10.2026', enableStart: '03.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль', share: 50, control: true },
      { v: '2.0', name: 'Оплата бонусами доступна', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '02.11.2026', t: 'note', txt: 'Решили сначала включить только на пром ГФ' },
      { d: '03.11.2026', t: 'ab', b: ['ГФ'], txt: 'Включили АБ на пром ГФ', sd: 'SD0002404711' },
      { d: '12.11.2026', t: 'plan', b: ['12', '9', '8', '7'], txt: 'План: включить АБ' },
      { d: '13.11.2026', t: 'plan', b: ['6', '5', '4', '3', '2', '1'], txt: 'План: включить АБ' },
      { d: '16.11.2026', t: 'plan', b: ['SI1', 'SI2', 'SI3', 'SI4'], txt: 'План: включить АБ' },
    ],
    toggles: [{ n: 'payNotificationsBonusAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 60, mixed: 40, with: [] },
  },

  {
    id: 'detail-styles',
    feature: 'Детализация транзакционных уведомлений с поддержкой стилей (шторка)',
    iter: 1, branch: 'шторка детализации', ver: 'V1', range: '1.0-2.0', launch: '24.11.2026',
    key: 'txDetailsSheetAb', release: '17.15', owner: 'Мария С.',
    type: 'ab', platform: 'Новый', stage: 'release',
    hypothesis: 'Детализация в виде шторки со стилями увеличит переходы в настройки стиля.',
    metric: 'Переходы в настройки стиля из детализации', metric2: 'Время на экране детализации',
    minDays: 14, planDays: 28, sample: 0,
    dates: { created: '03.11.2026', plannedStart: '24.11.2026' },
    variants: [
      { v: '1.0', name: 'Контроль — экран детализации', share: 50, control: true },
      { v: '2.0', name: 'Шторка со стилями', share: 50 },
    ],
    results: null, decision: null,
    events: [
      { d: '03.11.2026', t: 'note', txt: 'Тест заведён на АБ-платформе' },
      { d: '06.11.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включено на ГФ бете для пилотного списка', sd: 'SD0002521458' },
      { d: '16.11.2026', t: 'note', txt: 'Плановая раскатка релиза 17.15' },
      { d: '24.11.2026', t: 'plan', b: ['ГФ'], txt: 'План: старт АБ на пром ГФ' },
    ],
    toggles: [{ n: 'txDetailsSheetAb', kind: 'рубильник', st: 'todo' }],
    cross: { clean: 0, mixed: 0, with: [] },
  },

  {
    id: 'br-settings',
    feature: 'Близкие рядом. Страница настроек из CMS',
    iter: 1, branch: 'настройки из CMS', ver: 'V1', range: '1.0-2.0', launch: 'DD.MM.YYYY',
    key: 'closeOnesSettingsCms', release: '17.12', owner: 'Игорь Л.',
    type: 'rollout', platform: 'Новый', stage: 'cleanup',
    hypothesis: 'Перенос страницы настроек в CMS без изменения UI. Решили катить без АБ после FF-раскаток.',
    metric: '', metric2: '',
    minDays: 0, planDays: 0, sample: 0,
    dates: { created: '14.09.2026', decisionAt: '24.09.2026', rolloutStart: '25.09.2026', rolloutDoneAt: '07.10.2026' },
    variants: [{ v: '2.0', name: 'Страница из CMS', share: 100 }],
    results: null,
    decision: { d: '24.09.2026', who: 'Игорь Л.', winner: '2.0', text: 'Катим без АБ, сразу на всех после FF-раскаток. Черновик теста на платформе не нужен.' },
    events: [
      { d: '14.09.2026', t: 'note', txt: 'Подготовлен АБ-тест на платформе (не запущен)' },
      { d: '24.09.2026', t: 'decision', txt: 'Решили катить без АБ' },
      { d: '25.09.2026', t: 'beta', b: ['Бета+'], v: '2.0', txt: 'Включено 2.0 на ГФ бета+', sd: 'SD0002034090' },
      { d: '01.10.2026', t: 'on', b: ['ГФ'], v: '2.0', txt: 'Включено 2.0 на пром ГФ', sd: 'SD0002099904' },
      { d: '02.10.2026', t: 'on', b: ['12', '7'], v: '2.0', txt: 'Включено 2.0', sd: 'SD0002115296' },
      { d: '05.10.2026', t: 'on', b: ['9', '8', '6', '5'], v: '2.0', txt: 'Включено 2.0', sd: 'SD0002132621' },
      { d: '06.10.2026', t: 'on', b: ['4', '3', '2', '1'], v: '2.0', txt: 'Включено 2.0', sd: 'SD0002152061' },
      { d: '07.10.2026', t: 'on', b: ['SI1', 'SI2', 'SI3', 'SI4'], v: '2.0', txt: 'Включено 2.0 — все блоки', sd: 'SD0002163057' },
    ],
    toggles: [
      { n: 'closeOnesSettingsCms', kind: 'тогл', st: 'todo' },
      { n: 'Черновик АБ-теста на платформе', kind: 'АБ-черновик', st: 'todo' },
    ],
    cross: { clean: 0, mixed: 0, with: [] },
  },

  {
    id: 'return-push-v1',
    feature: 'Вернуть уведомления об операциях',
    iter: 1, branch: 'возврат уведомлений', ver: 'V2', range: '1.0-4.0', launch: '04.06.2026',
    key: 'returnNotificationsAb', release: '17.8', owner: 'Анна К.',
    type: 'ab', platform: 'Завершён', stage: 'cleanup',
    hypothesis: 'Предложение вернуть уведомления об операциях увеличит долю клиентов с включёнными уведомлениями.',
    metric: 'Доля клиентов, вернувших уведомления', metric2: '',
    minDays: 21, planDays: 50, sample: 100,
    dates: { created: '21.05.2026', enableStart: '04.06.2026', fullAt: '09.06.2026', platformEnd: '29.07.2026', decisionAt: '29.07.2026', rolloutDoneAt: '04.08.2026' },
    variants: [
      { v: '3.0', name: 'Контроль (перезапуск 17.06)', share: 50, control: true },
      { v: '4.0', name: 'Предложение вернуть уведомления', share: 50 },
    ],
    results: {
      status: 'reviewed', direction: 'up', note: 'Победил 4.0: +1,4 п.п., значимо.',
      rows: [
        { v: '3.0', value: 4.2, control: true },
        { v: '4.0', value: 5.6, delta: 1.4, lo: 0.9, hi: 1.9, sig: true },
      ],
    },
    decision: { d: '29.07.2026', who: 'Анна К.', winner: '4.0', text: 'Останавливаем АБ, включаем 4.0 на все блоки.' },
    events: [
      { d: '04.06.2026', t: 'ab', b: ['ГФ'], txt: 'Включили АБ 50/50 на пром ГФ', sd: 'SD0000832377' },
      { d: '05.06.2026', t: 'ab', b: ['12', '9', '8', '7', '6', '5'], txt: 'Включили АБ', sd: 'SD0000843496' },
      { d: '09.06.2026', t: 'ab', b: ['4', '3', '2', '1', 'SI1', 'SI2', 'SI3', 'SI4'], txt: 'Включили АБ — все блоки', sd: 'SD0000879115' },
      { d: '17.06.2026', t: 'note', txt: 'Перезапуск АБ: 1.0 = 3.0, 2.0 = 4.0', sd: 'SD0000951499' },
      { d: '29.07.2026', t: 'decision', txt: 'Останавливаем АБ, включаем 4.0' },
      { d: '30.07.2026', t: 'on', b: ['ГФ', '12'], v: '4.0', txt: 'Включен 4.0', sd: 'SD0001418401' },
      { d: '31.07.2026', t: 'on', b: ['9', '8', '7', '6', '5'], v: '4.0', txt: 'Включен 4.0', sd: 'SD0001429132' },
      { d: '03.08.2026', t: 'on', b: ['4', '3', '2', '1'], v: '4.0', txt: 'Включен 4.0', sd: 'SD0001446791' },
      { d: '04.08.2026', t: 'on', b: ['SI1', 'SI2', 'SI3', 'SI4'], v: '4.0', txt: 'Включен 4.0 — все блоки', sd: 'SD0001461049' },
    ],
    toggles: [
      { n: 'returnNotificationsAb', kind: 'рубильник', st: 'todo' },
      { n: 'Ветки 1.0–3.0 в коде', kind: 'фича', st: 'todo' },
      { n: 'DBPU_RETURN_NOTIFICATIONS_ENABLED', kind: 'тогл', st: 'todo' },
    ],
    cross: { clean: 0, mixed: 0, with: [] },
  },
];
