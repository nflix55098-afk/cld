# ТЗ: цветные теги «Цель» и «Продукт» в Радаре АБ

Документ для исполнителя (человека или LLM). Описывает доработку `radar-ab/index.html`: колонка «Цель · продукт» с цветными тегами, фильтры по тегам, подсветка одинаковых тегов, редактирование в паспорте эксперимента, страница справочника и напоминание о незаполненных тегах.

Визуальный эталон — `radar-ab/mockups/tags-color-mockup.html`. Откройте его в браузере и сверяйтесь. В нём нарисованы все экраны ниже. Макет статичный, и его код нельзя копировать как есть: он дорисовывает DOM поверх готовой страницы. Нужна нормальная реализация внутри рендер-функций.

---

## 0. Как устроен проект и правила работы

- `radar-ab/index.html` — один файл без сборки и фреймворков. Внутри по порядку:
  1. `<style id="fonts">` — встроенные шрифты в base64. **Не трогать и не читать целиком**, это ~130 КБ.
  2. `<style>` — дизайн-система: токены в `:root`, база, компоненты, экраны, адаптив (медиазапросы в конце).
  3. `<script>` — демо-данные (`EXPERIMENTS`, `FEATURE_META`…), ядро (`prepare`, `alertsFor`, хелперы), паспорт (`passportHTML`), модалки, роутинг (`VIEWS`, `route`, `rerender`), экраны `renderOverview`, `renderPult`, `renderRegistry`, `renderAssistant`.
- Правила дизайн-системы описаны в `radar-ab/DESIGN.md`. Прочитайте его до начала работы.
- **Не ломать существующее.** Не переименовывайте функции и классы, не меняйте логику стадий, напоминаний, решений и раскатки. Добавляйте код, переписывайте только указанные места.
- Стиль кода как в файле: стрелочные функции, HTML в шаблонных строках, любой пользовательский текст — через `esc()`, выборки — через `$` / `$$`. Состояние экрана хранится в объектах `*State`, перерисовка — через `rerender()` или `render*(root)`.
- Цвета берите из CSS-переменных `:root`. Единственное исключение — палитра тегов из раздела 2.
- **Не используйте класс `.x`.** Он уже занят кнопкой закрытия паспорта (`.drawer .x { position: absolute }`). Для крестика внутри тега используйте `.tx`.
- Текст интерфейса — по-русски, коротко и по делу, как в существующих экранах.

## 1. Что получится в итоге

1. На экране «Статус по А/Б-тестам» во вкладке «А/Б-тесты» появится колонка **«Цель · продукт»**. Она есть во всех трёх видах: «Активные», «Завершённые», «Готовятся». Верхняя строка ячейки — цели, нижняя — продукт.
2. У каждого значения тега свой цвет из фиксированной палитры. **Цели** рисуются капсулами, **продукты** — прямоугольниками со скруглёнными углами. Статусы (точки стадий, иконки важности) остаются квадратными, поэтому с тегами их не спутать.
3. Над таблицей появятся **фильтры** «Цель ▾», «Продукт ▾», «Тип гипотезы ▾», выбранные значения показываются чипами, рядом есть «Сбросить» и счётчик «N из M тестов».
4. **Легенда** со всеми целями и продуктами. При **наведении на тег** такие же теги остаются яркими, остальные гаснут. **Клик по тегу** добавляет его в фильтр.
5. В **«Умном тираже»** продукт показывается в заголовке фичи, цели — под каждым тестом. Фильтры такие же.
6. Во вкладке **«Все фичи»** тоже есть колонка «Цель · продукт». **«Журнал включений»** фильтруется по тегам, но чипы в его строках не показываются.
7. В **паспорте эксперимента** в разделе «Гипотеза» появятся поля «Цель» (несколько значений), «Продукт» (несколько значений, общий для фичи) и «Тип гипотезы» (одно значение).
8. В **форме «Новая строка в тираже»** — те же три поля.
9. Новый экран **«Справочник тегов»** (`#dictionary`): цели, продукты и типы гипотез, редактирование, выбор цвета из палитры, архив и слияние.
10. Новое **напоминание**: у теста в работе не заполнена цель или продукт.

## 2. Палитра и внешний вид

### 2.1. Палитра тегов

Двенадцать пастельных цветов, контраст текста на заливке не ниже 6:1. Красного и сигнального оранжевого в палитре нет: в интерфейсе они означают «просрочено» (`--crit`) и «готов к анализу» (`--st-ready`). Свободный выбор цвета не делать — только эта палитра.

```js
/* Палитра тегов: [заливка, текст, название] */
const TAG_PALETTE = {
  peach: ['#fddccb', '#8a3410', 'Персик'],  sky:   ['#d5e7fb', '#134e85', 'Небо'],
  lilac: ['#e9dcf9', '#57298a', 'Лаванда'], teal:  ['#c9ece6', '#0a5a52', 'Бирюза'],
  lime:  ['#e3efc4', '#465a0c', 'Лайм'],    rose:  ['#fad5e2', '#891c4a', 'Роза'],
  mint:  ['#d2f0da', '#19602f', 'Мята'],    slate: ['#dfe4ee', '#2e3d5c', 'Сланец'],
  sand:  ['#f4e3c4', '#684811', 'Песок'],   stone: ['#e6e1da', '#4a4036', 'Камень'],
  aqua:  ['#cdebf0', '#0b5262', 'Аква'],    peri:  ['#dde0fb', '#2f3a9c', 'Барвинок'],
};
```

Правила:
- **Внутри одного измерения цвет не повторяется.** Две цели не могут быть одного цвета, два продукта тоже. Цель и продукт могут совпасть по цвету: их различает форма.
- Новому тегу автоматически предлагается первый свободный цвет в этом измерении.
- «Цель не выбрана» и «Продукт не выбран» — без заливки: белый фон, пунктирная рамка цвета `#d9a400`, текст `var(--warn-text)`.
- Тип гипотезы цвета не получает: серый моноширинный чип. Значение у теста одно, искать по нему глазами не нужно.

### 2.2. Иконки

```js
const TAG_ICON = {
  goal: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="6" r="1.7" fill="currentColor"/></svg>',
  product: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="1.4" y="1.4" width="9.2" height="9.2" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.4 4.8h9.2" stroke="currentColor" stroke-width="1.3"/></svg>',
  type: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 9.5 5 5.5l2 2 3-4.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
```

### 2.3. CSS

Добавьте отдельным блоком перед разделом «Адаптив» основного `<style>` (комментарий `Адаптив: 1440 → 1280 …`). Медиа-правила из конца блока перенесите в соответствующие медиазапросы или оставьте отдельными `@media` в конце файла.

```css
/* ---------- теги: цвет — у значения, форма — у измерения ---------- */
.tg { display: inline-flex; align-items: center; gap: 5px; height: 21px; padding: 0 7px 0 5px; border-radius: 4px; border: 0; font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap; cursor: pointer; transition: opacity .15s, box-shadow .12s; }
.tg svg { width: 11px; height: 11px; flex: none; opacity: .7; }
.tg.c { background: var(--tb); color: var(--tf); }
.tg.c.goal { border-radius: 11px; padding: 0 9px 0 6px; }
.tg.c:hover, .tg.c:focus-visible { outline: none; box-shadow: inset 0 0 0 1.5px var(--tf); }
.tg.none { padding: 0 9px 0 6px; border-radius: 11px; background: var(--white); color: var(--warn-text); outline: 1px dashed #d9a400; outline-offset: -1px; }
.tg.type { font-family: var(--mono); font-size: 10.5px; font-stretch: 87.5%; background: var(--paper-2); color: var(--ink-2); padding: 0 6px; cursor: default; }
.tg .tx { margin-left: 4px; opacity: .7; font-size: 11px; }
.tg button { display: grid; place-items: center; width: 15px; height: 15px; margin: 0 -4px 0 2px; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .6); color: var(--tf); font-size: 11px; line-height: 1; cursor: pointer; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tags + .tags { margin-top: 4px; }
.tg-more { display: inline-flex; align-items: center; height: 21px; font-family: var(--mono); font-size: 10px; color: var(--muted); }
td.tagcol { width: 300px; }
td.tagcol .tags:first-child { min-width: 268px; }

/* легенда */
.tlegend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: -2px 0 16px; padding: 10px 12px; border-radius: var(--r); background: var(--white); box-shadow: 0 0 0 1px var(--rule); }
.tlegend .sep { width: 1px; height: 18px; margin: 0 8px; background: var(--rule-2); }

/* подсветка одинаковых тегов */
.tg-hl .tg.c:not(.on), .tg-hl .tg.none { opacity: .2; }
.tg-hl .tg.on { box-shadow: inset 0 0 0 1.5px var(--tf); }
.tg-hl tr:has(.tg.on) td { background: rgba(255, 255, 255, .8); }

/* фильтры */
.fwrap { position: relative; display: inline-flex; }
.fbtn { display: inline-flex; align-items: center; gap: 6px; height: var(--h); padding: 0 10px; border-radius: var(--r-sm); border: 1px solid var(--rule-2); background: var(--white); font-size: var(--fs-base); font-weight: 500; color: var(--ink); cursor: pointer; }
.fbtn svg.i { width: 12px; height: 12px; color: var(--muted); }
.fbtn .n { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 2px; background: var(--ink); color: var(--paper); font-family: var(--mono); font-size: 10px; }
.fbtn.on { border-color: var(--ink); }
.fbtn.open { border-color: var(--cobalt); box-shadow: var(--focus-ring); }
.fpop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 30; width: 340px; max-height: 420px; overflow-y: auto; padding: 8px; border-radius: var(--r); background: var(--white); box-shadow: var(--shadow-pop); }
.fpop .search { margin-bottom: 6px; }
.fo { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px; border-radius: var(--r-sm); font-size: var(--fs-base); cursor: pointer; }
.fo:hover { background: var(--paper); }
.fo input { margin: 0; width: 15px; height: 15px; accent-color: var(--ink); }
.fo b { font-family: var(--mono); font-size: 10.5px; font-weight: 400; color: var(--muted); }
.fo .full { display: block; margin-top: 3px; font-size: 11.5px; color: var(--muted); }
.fpop-sep { height: 1px; margin: 6px 0; background: var(--rule); }
.fpop-f { display: flex; align-items: center; gap: 8px; padding: 6px 4px 2px 8px; font-size: 11.5px; color: var(--muted); }
.fpop-f .sp { flex: 1; }
.fchips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; margin: -2px 0 16px; }
.fchips .tg { height: 26px; font-size: 12.5px; }
.fchips .tg.goal { border-radius: 13px; }
.fchips .or { font-family: var(--mono); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.fchips .cnt { margin-left: auto; font-family: var(--mono); font-size: 11px; color: var(--muted); }

/* поле тегов в паспорте и форме */
.kv dd.tagdd { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.tag-add { display: inline-grid; place-items: center; width: 21px; height: 21px; border: 1px dashed var(--rule-2); border-radius: 4px; background: none; color: var(--muted); font-size: 13px; line-height: 1; cursor: pointer; }
.tags-edit { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; width: 100%; min-height: 31px; padding: 4px 6px; border-radius: var(--r-sm); background: var(--white); box-shadow: 0 0 0 1px var(--cobalt), var(--focus-ring); }
.fpop.right { left: auto; right: 0; width: 380px; }

/* справочник */
.dict { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 40px; align-items: start; }
.dict table.t td { vertical-align: top; }
.dict td.num { font-family: var(--mono); font-size: 12px; }
.dict .st-on { font-size: 12.5px; font-weight: 600; color: var(--good-text); white-space: nowrap; }
.dict .st-arch { font-size: 12.5px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.dict tr.arch td { color: var(--muted); }
.dict tr.arch .tg { opacity: .55; }
.dict tr.edit-row > td { padding: 18px 16px 16px; background: var(--white); box-shadow: inset 0 0 0 1.5px var(--cobalt); }
.ed-grid { display: grid; grid-template-columns: 1.3fr 1fr 1.5fr 1fr; gap: 16px; align-items: start; }
.ed-f { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--rule); }
.sws { display: grid; grid-template-columns: repeat(6, 28px); gap: 6px; }
.sw { position: relative; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: var(--tb); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .06); cursor: pointer; }
.sw i { position: absolute; inset: 9px; border-radius: 50%; background: var(--tf); opacity: 0; }
.sw.on { box-shadow: 0 0 0 2px var(--white), 0 0 0 4px var(--ink); }
.sw.on i { opacity: 1; inset: 10px; }
.sw.used i { opacity: .55; inset: 11px; }
.sw:disabled { cursor: not-allowed; }

@media (max-width: 1024px) { .dict { grid-template-columns: minmax(0, 1fr); } .ed-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px) {
  .tlegend { display: none; }
  td.tagcol { width: auto; }
  td.tagcol .tags:first-child { min-width: 0; }
  .fpop, .fpop.right { position: fixed; left: 12px; right: 12px; top: auto; bottom: 12px; width: auto; max-height: 70vh; }
  .ed-grid { grid-template-columns: minmax(0, 1fr); }
}
```

## 3. Модель данных

Весь блок ниже вставьте в `<script>` **сразу после `const FEATURE_META = { … };`** и до `prepareAll()`. Справочник нужен функции `alertsFor`, а она вызывается из `prepare()`.

### 3.1. Справочник

```js
/* Справочник тегов: цели — общие для всех команд, продукты — свои у команды */
const TAG_DICT = {
  goal: [
    { id: 'cr', name: 'Увеличиваем CR в подключение', short: 'CR в подключение', color: 'peach', desc: 'Доля клиентов, подключивших уведомления после показа' },
    { id: 'retain', name: 'Лучше удерживаем', short: 'Удержание', color: 'sky', desc: 'Меньше отключений и возвратов к бесплатному тарифу' },
    { id: 'inflow', name: 'Увеличиваем входящий поток', short: 'Входящий поток', color: 'lilac', desc: 'Больше клиентов доходят до экрана подключения' },
    { id: 'safe', name: 'Не даём сделать хуже', short: 'Не хуже', color: 'teal', desc: 'Переезды и редизайны: метрика не должна упасть' },
    { id: 'growth-old', name: 'Рост подключений', short: 'Рост подключений', color: 'stone', desc: 'Дубль: старая формулировка', archived: true, mergedInto: 'cr', mergedAt: '03.10.2026' },
  ],
  product: [
    { id: 'ops', name: 'Уведомления об операциях', short: 'Уведомления об операциях', color: 'lime' },
    { id: 'shared', name: 'Совместные уведомления', short: 'Совместные уведомления', color: 'rose' },
    { id: 'activation', name: 'Подключение уведомлений', short: 'Подключение уведомлений', color: 'mint' },
    { id: 'settings', name: 'Настройки уведомлений', short: 'Настройки уведомлений', color: 'slate' },
    { id: 'styles', name: 'Стили уведомлений', short: 'Стили уведомлений', color: 'sand' },
    { id: 'feed', name: 'Лента уведомлений', short: 'Лента уведомлений', color: 'stone' },
  ],
};
/* Тип гипотезы: одно значение на тест, не тег. Значение up/down/noninf совпадает с results.direction */
const HYP_TYPES = [
  { id: 'up', name: 'Рост метрики', short: '↑ рост', desc: 'Значимый рост целевой метрики — за гипотезу' },
  { id: 'down', name: 'Падение метрики', short: '↓ падение', desc: 'Значимое снижение целевой метрики — за гипотезу' },
  { id: 'noninf', name: 'Тест на не ухудшение', short: '≥ не хуже', desc: 'Весь доверительный интервал выше порога — «не хуже»' },
  { id: 'aa', name: 'Проверка сплитовалки', short: 'A/A', desc: 'Значимая разница означает проблему сплита' },
];
```

### 3.2. Привязка к демо-данным

**Продукт хранится на фиче**: все тесты фичи наследуют его. **Цели** по умолчанию берутся с фичи, а у отдельного теста их можно переопределить через поле `e.goals`.

```js
const FEATURE_TAGS = {
  'f-return2': { products: ['ops'], goals: ['retain', 'cr'] },
  'f-return1': { products: ['ops'], goals: ['retain'] },
  'f-free-reason': { products: ['ops'], goals: ['retain'] },
  'f-banner-cms': { products: ['ops'], goals: ['safe'] },
  'f-react': { products: ['ops'], goals: [] },               /* цель не выбрана — для демонстрации напоминания */
  'f-pay-spasibo': { products: ['ops', 'settings'], goals: ['retain'] },
  'f-detail-styles': { products: ['ops', 'styles'], goals: [] },
  'f-kps': { products: ['ops'], goals: ['safe'] },
  'f-activ': { products: ['activation'], goals: ['cr'] },
  'f-activ-price': { products: ['activation'], goals: ['cr', 'inflow'] },
  'f-style': { products: ['styles'], goals: ['retain'] },
  'f-br-cms': { products: ['shared'], goals: ['safe', 'cr'] },
  'f-br-settings': { products: ['shared'], goals: ['safe'] },
  'f-cards': { products: ['settings'], goals: ['cr'] },
  'f-shtorka': { products: ['settings'], goals: ['cr'] },
  'f-dep-switch': { products: ['settings'], goals: ['safe'] },
  'f-feed-off': { products: ['feed'], goals: ['safe'] },
};
/* Тип гипотезы для тестов, у которых ещё нет результатов */
const TEST_HYP = { 'free-reason': 'up', reactions2: 'up', 'banner-cms': 'noninf', activ34: 'up', 'ap-0': 'up', 'ap-59': 'up', 'ap-99': 'up', 'pay-spasibo': 'up', shtorka2: 'up', 'detail-styles': 'up' };
```

Фичи из истории, которых нет в этом списке, остаются без тегов. Это нормально: напоминание о тегах срабатывает только для тестов в работе.

### 3.3. Хелперы

```js
const tagDef = (kind, id) => TAG_DICT[kind].find((t) => t.id === id);
const liveTags = (kind) => TAG_DICT[kind].filter((t) => !t.archived);
const featTags = (fid) => (FEATURE_TAGS[fid] = FEATURE_TAGS[fid] || { products: [], goals: [] });
function goalsOf(e) { return (e.goals || featTags(e.fid).goals).filter((id) => tagDef('goal', id)); }
function productsOf(e) { return featTags(e.fid).products.filter((id) => tagDef('product', id)); }
function hypOf(e) { if (e.type === 'rollout') return null; return e.hypType || e.results?.direction || TEST_HYP[e.id] || null; }

function tagChip(kind, id, { extra = '', filter = true } = {}) {
  const t = tagDef(kind, id); if (!t) return '';
  const [bg, fg] = TAG_PALETTE[t.color];
  return `<span class="tg c ${kind}" data-k="${kind}:${id}"${filter ? ` data-tagf="${kind}:${id}" role="button" tabindex="0"` : ''} style="--tb:${bg};--tf:${fg}" title="${kind === 'goal' ? 'Цель' : 'Продукт'}: ${esc(t.name)}${filter ? ' — нажмите, чтобы отфильтровать' : ''}">${TAG_ICON[kind]}${esc(t.short || t.name)}${extra}</span>`;
}
const noTag = (kind) => `<span class="tg none" title="Не заполнено — сервис напомнит">${TAG_ICON[kind]}${kind === 'goal' ? 'Цель не выбрана' : 'Продукт не выбран'}</span>`;
function tagList(kind, ids, max) {
  if (!ids.length) return noTag(kind);
  const more = ids.length - max;
  return ids.slice(0, max).map((id) => tagChip(kind, id)).join('') + (more > 0 ? `<span class="tg-more" title="${esc(ids.slice(max).map((id) => tagDef(kind, id).name).join(', '))}">+${more}</span>` : '');
}
/* Ячейка «Цель · продукт»: до 2 целей и 1 продукта, остальное — «+N» */
function tagCell(e) {
  return `<td class="tagcol wide" data-label="Цель · продукт"><div class="tags">${tagList('goal', goalsOf(e), 2)}</div><div class="tags">${tagList('product', productsOf(e), 1)}</div></td>`;
}
const hypChip = (e) => { const h = HYP_TYPES.find((x) => x.id === hypOf(e)); return h ? `<span class="tg type" title="${esc(h.name)}">${h.short}</span>` : '<span class="muted small">не задан</span>'; };
```

У фич без АБ (`e.type === 'rollout'`) тоже есть цель и продукт, но нет типа гипотезы.

## 4. Фильтр по тегам

### 4.1. Состояние и логика

Состояние одно на всё приложение. Фильтр сохраняется при переключении вкладок «А/Б-тесты» / «Журнал» / «Все фичи» и при переходе между «Статусом» и «Умным тиражом».

```js
const tagFilter = { goal: [], product: [], type: [], open: null, q: '' };   /* значение '__none' — «не выбрано» */
function tagOk(e) {
  const ok = (sel, vals) => !sel.length || sel.some((v) => (v === '__none' ? !vals.length : vals.includes(v)));
  const h = hypOf(e);
  return ok(tagFilter.goal, goalsOf(e)) && ok(tagFilter.product, productsOf(e)) && ok(tagFilter.type, h ? [h] : []);
}
const tagFilterOn = () => tagFilter.goal.length + tagFilter.product.length + tagFilter.type.length > 0;
```

- Внутри одного списка — «или», между списками — «и».
- В каждом списке есть пункт «Не выбрано» (`'__none'`), чтобы найти тесты без тегов.
- Число напротив пункта — сколько тестов текущего вида получится с этим значением, если не учитывать фильтр того же списка (фасетный подсчёт).
- **Напоминания фильтр не скрывает.** Плашка «Напоминания» и показатели в шапке («Активные / Ждут решения / Просрочено») считаются без учёта тегов: иначе просроченное можно случайно спрятать фильтром.

### 4.2. Разметка панели

Напишите функцию `tagFilterBar(listForCounts)`. Она возвращает три кнопки и, если список открыт, выпадающий список под нужной кнопкой.

- Кнопка: `<span class="fwrap"><button class="fbtn [on] [open]" data-tf-open="goal">иконка Цель <span class="n">2</span>▾</button>…</span>`. Счётчик `.n` показывается, только если что-то выбрано.
- Выпадающий список `.fpop` содержит:
  1. поиск (`<input id="tf-q">`);
  2. пункты `.fo`: галочка `data-tf-toggle="goal:cr"`, затем цветной тег (`tagChip(..., { filter: false })`), под ним полное название `.full`, справа число;
  3. разделитель, затем пункт «Не выбрано»;
  4. подвал: «Внутри списка — «или», между списками — «и»» и кнопка-карандаш `data-tf-dict="goal"`, которая ведёт в справочник.
- Для «Типа гипотезы» в пунктах вместо цветного тега — серый `.tg.type`, а «Не выбрано» подписано «Не задан».
- Строка выбранного под панелью (`tagFilterChips(shown, total)`) показывается, только если `tagFilterOn()`. В ней:
  - выбранные значения цветными тегами с кнопкой `×` (`data-tf-remove="goal:cr"`);
  - между значениями одного списка — серое «или», между списками — «и»;
  - кнопка `data-tf-reset` «Сбросить»;
  - справа счётчик «5 из 12 активных тестов».

### 4.3. Обработчики

Добавьте их делегированием в **начало** обработчика `click` внутри `initGlobal()`, до проверки `[data-open]`. Иначе клик по тегу в строке откроет паспорт.

```js
const tf = t.closest('[data-tagf]');          /* клик по тегу в таблице — добавить в фильтр */
if (tf) { ev.preventDefault(); ev.stopPropagation(); const [k, id] = tf.dataset.tagf.split(':'); if (!tagFilter[k].includes(id)) tagFilter[k].push(id); rerender(); return; }
const to = t.closest('[data-tf-open]');
if (to) { tagFilter.open = tagFilter.open === to.dataset.tfOpen ? null : to.dataset.tfOpen; tagFilter.q = ''; rerender(); $('#tf-q')?.focus(); return; }
const tt = t.closest('[data-tf-toggle]');
if (tt) { ev.preventDefault(); const [k, id] = tt.dataset.tfToggle.split(':'); const a = tagFilter[k]; a.includes(id) ? a.splice(a.indexOf(id), 1) : a.push(id); rerender(); $('#tf-q')?.focus(); return; }
const tr = t.closest('[data-tf-remove]');
if (tr) { const [k, id] = tr.dataset.tfRemove.split(':'); tagFilter[k] = tagFilter[k].filter((x) => x !== id); rerender(); return; }
if (t.closest('[data-tf-reset]')) { tagFilter.goal = []; tagFilter.product = []; tagFilter.type = []; rerender(); return; }
const td = t.closest('[data-tf-dict]');
if (td) { dictState.tab = td.dataset.tfDict; tagFilter.open = null; location.hash = '#dictionary'; return; }
if (tagFilter.open && !t.closest('.fwrap')) { tagFilter.open = null; rerender(); }   /* клик мимо закрывает список */
```

- `Esc` закрывает открытый список: добавьте это в существующий обработчик `keydown`.
- Поиск `#tf-q` по событию `input` записывает значение в `tagFilter.q`, перерисовывает экран и возвращает фокус в конец строки. Так уже сделано для `#ab-q` через `keepFocus`.
- `Enter` и пробел на теге с `tabindex="0"` работают как клик.

### 4.4. Подсветка при наведении

Сделайте делегированием в `initTips()` или отдельной функцией, которую вызывает `initGlobal()`:

```js
document.addEventListener('mouseover', (ev) => {
  const t = ev.target.closest('.tg.c[data-k]');
  const legend = t?.closest('.tlegend');
  const card = legend ? legend.nextElementSibling : t?.closest('.card');
  $$('.tg-hl').forEach((c) => { if (c !== card) { c.classList.remove('tg-hl'); $$('.tg.on', c).forEach((x) => x.classList.remove('on')); } });
  if (!t || !card) return;
  card.classList.add('tg-hl');
  $$('.tg.on', card).forEach((x) => x.classList.remove('on'));
  $$(`.tg[data-k="${t.dataset.k}"]`, card).forEach((x) => x.classList.add('on'));
});
```

Наведение на тег в легенде подсвечивает таблицу под ней (`legend.nextElementSibling`). Класс контейнера — `tg-hl`, не `hl`: `tr.hl` уже занят подсветкой строки в таблице истории фичи.

## 5. Где показывать теги

### 5.1. «Статус по А/Б-тестам» → вкладка «А/Б-тесты» (`renderAB`)

1. Отфильтруйте списки: после строк `const active = …`, `const finished = …`, `const prep = …` добавьте `.filter(tagOk)`. Нефильтрованные копии сохраните для счётчиков фильтра и строки «N из M». Числа в сегменте «Активные / Завершённые / Готовятся» показывают отфильтрованное количество.
2. Колонка в виде «Активные»: в шаблоне `row` вставьте `${tagCell(e)}` сразу после `<td class="tcol">…</td>`. Заголовок: `<th>Тест и фича</th><th>Цель · продукт</th><th>Блоки</th>…`. В строке группы `tr.grp` замените `colspan="5"` на `colspan="6"`.
3. То же в видах «Завершённые» и «Готовятся»: колонка идёт после «Тест и фича», заголовок добавляется.
4. Панель: в `.toolbar` после сегмента `.seg` вставьте `${tagFilterBar(…)}`. Под панелью, перед таблицей, — `${tagFilterChips(…)}`. Между панелью и таблицей — легенда:
   ```js
   const tagLegend = () => `<div class="tlegend"><span class="label">Цели</span>${liveTags('goal').map((t) => tagChip('goal', t.id)).join('')}<span class="sep"></span><span class="label">Продукты</span>${liveTags('product').map((t) => tagChip('product', t.id)).join('')}</div>`;
   ```
5. Если после фильтра пусто: `<div class="empty pad">Нет тестов с такими тегами · <button class="btn link" data-tf-reset>Сбросить фильтр</button></div>`.

### 5.2. Вкладка «Все фичи» (`renderFeatures`)

- Фича проходит фильтр, если ему соответствует хотя бы один её тест: `r.f.tests.some(tagOk)`.
- После колонки «Фича» добавьте колонку «Цель · продукт». Цели — объединение целей всех тестов фичи в работе (а если тестов в работе нет — всех), продукты — `featTags(fid).products`.
- Панель фильтров и строка выбранного — как в 5.1. Легенду здесь не показывайте.

### 5.3. Вкладка «Журнал включений» (`renderJournal`)

- В `list` добавьте условие `tagOk(x.e)`.
- Панель фильтров — в `.toolbar`, строка выбранного — над лентой.
- Чипы в строках журнала не показывайте: строки плотные.

### 5.4. «Умный тираж» (`renderRegistry`, `regRow`, `featureRows`)

- `list` фильтруется через `tagOk`. В подписи фичи «· N скрыто фильтром» учитывайте и фильтр по тегам.
- Панель фильтров — во второй `.toolbar`, после поля поиска; строка выбранного — под ней.
- **Заголовок фичи** (`tr.feat` в `featureRows`): после ссылки `.fn` выведите продукты фичи (`tagList('product', …, 2)`).
- **Строка теста** (`regRow`): под `.rmeta` добавьте `<div class="tags" style="margin-top:6px">…</div>` с целями теста. Если строка не вложенная (у фичи один тест), в тот же блок допишите продукты.
- В заголовке колонки «Фича · стадия · блокеры» вместо «блокеры» напишите «теги»: блокер уже виден в мета-строке.

### 5.5. Паспорт эксперимента (`passportHTML`, вкладка «Обзор», раздел «Гипотеза»)

1. Перенесите раздел «Гипотеза» выше «Жизненного цикла»: сразу после блока задач `.tasks`.
2. В начало `.kv` этого раздела добавьте три строки:
   - **Цель.** `<dd class="tagdd">` с цветными тегами (`tagChip(..., { filter: false })`) и кнопкой `.tag-add` «+» (`data-tagedit="goal"`).
   - **Продукт.** То же с `data-tagedit="product"`. Под полем подпись `small muted`: «Общий для фичи: N тестов». Изменение применяется ко всем тестам фичи.
   - **Тип гипотезы.** `hypChip(e)` и кнопка «Изменить» (`data-tagedit="type"`). Справа короткое пояснение из `HYP_TYPES[].desc`.
   - Для фич без АБ строки «Тип гипотезы» нет. Блок «Цель / Продукт» тогда добавляется в раздел «Описание».
3. Редактирование: состояние `passEdit = { kind: null, q: '' }`. При `passEdit.kind === 'goal' | 'product'`:
   - вместо чипов показывается поле `.tags-edit`: выбранные теги с крестиком `<span class="tx">×</span>` (`data-tagrm`) и курсор ввода;
   - под полем — выпадающий список `.fpop.right` со списком значений и галочками, поиском «Найти или создать цель» и подвалом «Нет нужной цели? · Изменить справочник».
   - При `passEdit.kind === 'type'` открывается такой же список с радио-кнопками из `HYP_TYPES`.
4. Где сохраняются изменения:
   - цели — в `e.goals`;
   - продукты — в `featTags(e.fid).products`;
   - тип — в `e.hypType`. Если у теста есть `e.results` и выбран тип не `aa`, запишите то же значение в `e.results.direction`: от него зависят вывод «за гипотезу / против» и выбор победителя.
5. После любого изменения вызовите `prepare(e)` (у теста пересчитаются напоминания) и `rerender()`, затем снова откройте паспорт на той же вкладке: `openPassport(e.id)`. Покажите тост: «Теги обновлены».
6. Закрытие: клик мимо поля или `Esc`. В текущем коде `Esc` закрывает паспорт — пусть сначала закрывается выпадающий список, а паспорт только при втором нажатии.
7. В шапку паспорта (`.p-chips`) после «Релиз …» добавьте продукты фичи цветными тегами без фильтрации.

### 5.6. Форма «Новая строка в тираже» (`newTestModal`)

- Во всех трёх режимах добавьте поле «Продукт». В режиме «Новая итерация в фиче» продукт подставляется из выбранной фичи.
- В режимах с АБ добавьте поля «Цель» (несколько значений) и «Тип гипотезы» (одно значение). В режиме «Фича без АБ» — только «Цель» и «Продукт».
- Поля сделайте строкой чекбоксов-тегов (`.blk-picks` с цветными `.tg` вместо `.chip`). Выбранный тег — с рамкой `inset 0 0 0 1.5px var(--tf)`, невыбранный — с `opacity: .45`.
- Значения из формы в данные не записываются: демо по кнопке «Создать черновик» только показывает тост. Оставьте это поведение.

## 6. Экран «Справочник тегов» (`#dictionary`)

- Новый `VIEWS.dictionary = { render: renderDictionary }`. На демо-панели (вариантах концепта) его нет. Есть шапка продукта `appHead()`.
- **Как попасть.** Сделайте `.team-pick` в `appHead()` кнопкой с меню из одного пункта «Справочники тегов», который ведёт на `#dictionary`. Второй путь — карандаш в любом списке тегов.
- **Шапка экрана:**
  - eyebrow «Команда [Уведомления] · Android»;
  - заголовок «Справочник тегов»;
  - подзаголовок «Цели — общие для всех команд, продукты — свои у команды. Удалить нельзя, только в архив: старые тесты не теряют теги».
- **Вкладки** `.utabs`: «Цели N», «Продукты N», «Тип гипотезы 4». Состояние: `dictState = { tab: 'goal', edit: null, q: '', showArchive: false }`.
- **Панель:** поиск, переключатель `.toggle` «Показать архив», справа кнопка `primary` «Добавить цель» (или «Добавить продукт»).
- **Таблица** `.card > table.t`, колонки:
  - «Название» — жирным; у архивного добавьте под ним «слита с «…» 03.10»;
  - «Как выглядит» — `tagChip`;
  - «Описание»;
  - «Тестов» — сколько тестов из `EXPERIMENTS` использует тег, посчитать через `goalsOf` / `productsOf`;
  - «Статус» — «Активна» / «В архиве»;
  - действия: «Изменить» и «В архив» (у архивных — «Вернуть»).
- **Редактирование** — строка `tr.edit-row`, которая заменяет обычную, с сеткой `.ed-grid`:
  - поля «Название», «На чипе» (короткое имя), «Цвет» и «Так будет в таблице» (живой предпросмотр тега);
  - «Цвет» — 12 кружков `.sw` с переменными `--tb` / `--tf`, выбранный — `.on`; цвета, занятые другими значениями этого измерения, — `.used` и `disabled` с подсказкой «Уже у «…»»;
  - для целей и продуктов — выпадающий список «Слить с…» (`select.sel`). При слиянии все упоминания этого id в `FEATURE_TAGS` и `e.goals` заменяются на выбранный, тег уходит в архив с `mergedInto`;
  - подвал `.ed-f`: подсказка «Красного и сигнального оранжевого в палитре нет: в интерфейсе они означают «просрочено» и «готов к анализу»», кнопки «Отмена» и «Сохранить».
- **Новый тег** — строка в режиме редактирования вверху таблицы. Цвет — первый свободный, id — `t + Date.now()`.
- **Проверки:** название не пустое; короткое имя не длиннее 28 символов, иначе подсказка «Длинное имя растянет колонку»; дублей по названию нет.
- После сохранения — тост «Справочник обновлён», изменения сразу видны на всех экранах.
- **Архив.** Архивный тег не предлагается в выпадающих списках и легенде, но остаётся на старых тестах — в таблице с `opacity: .55`.
- **Вкладка «Тип гипотезы»** только для чтения: четыре строки из `HYP_TYPES` с пояснением и пометкой «Влияет на вывод «за гипотезу / против» в результатах».
- **Справа** колонка `.dict-side` из трёх заметок, как в макете: «Фиксированная палитра», «Один цвет — одно значение», «Кто меняет: цели — владелец процесса АБ, продукты — лид команды».

## 7. Напоминание о незаполненных тегах

В `alertsFor(e)` после правила `nometric` добавьте:

```js
if (['prep', 'release', 'enabling', 'collecting'].includes(e.stage)) {
  const miss = [!goalsOf(e).length && 'цель', !productsOf(e).length && 'продукт'].filter(Boolean);
  if (miss.length) add('warn', `Не заполнен${miss.length > 1 ? 'ы' : 'а'} ${miss.join(' и ')}`, 'Без тегов тест не найдётся фильтром и не попадёт в сводку по целям', null, { k: 'open', label: 'Заполнить' }, 'notags');
}
```

- В `TASK` добавьте `notags: 'Заполнить теги'`.
- В `shortOf` добавьте `case 'notags': return 'цель или продукт не выбраны';`.
- В `RULES` (обзор, раздел «Правила-напоминалки») после строки «Не заполнено обязательное» добавьте `['warn', 'Не заполнены теги', 'Тест в работе без цели или продукта: его не найти фильтром']`.

После этого напоминание появится у двух тестов: «Реакции на переводы в СБОЛ» и «Детализация транзакционных уведомлений…». В демо-данных у их фич нет цели. Это ожидаемо.

## 8. Адаптив и доступность

- **≤ 720 px.** Таблицы с классом `stacked` превращаются в карточки. Ячейка `td.tagcol` (`wide`, с `data-label="Цель · продукт"`) идёт отдельной строкой во всю ширину. Легенда скрыта. Выпадающие списки фильтра и паспорта открываются панелью снизу экрана (см. CSS).
- **Сенсорные экраны.** Наведения нет, подсветка не работает, а клик по тегу добавляет его в фильтр. Этого достаточно.
- **Клавиатура.** Теги в таблице фокусируются (`tabindex="0"`), `Enter` и пробел добавляют тег в фильтр. В выпадающих списках работают Tab, пробел на чекбоксе и `Esc`.
- **Контраст.** Цвета брать только из `TAG_PALETTE`, текст на заливке — второй элемент пары. Своих цветов не добавлять.
- Подписи `title` на тегах: «Цель: полное название — нажмите, чтобы отфильтровать».

## 9. Что не делать

- Не перекрашивать стадии, важность и ячейки блоков, не менять токены `:root`.
- Не добавлять цвет к типу гипотезы.
- Не скрывать напоминания и показатели шапки фильтром по тегам.
- Не трогать `<style id="fonts">`, радар на обзоре, ассистента и демо-панель вариантов.
- Не добавлять внешних библиотек, шрифтов и запросов в сеть.

## 10. Критерии готовности

1. Во всех трёх видах «А/Б-тестов», во «Всех фичах» и в «Умном тираже» видны цветные теги. Цвет каждого значения одинаковый на всех экранах.
2. Фильтр «Цель: CR в подключение или Удержание» + «Продукт: Уведомления об операциях» во вкладке «Активные» оставляет **5 из 12** тестов: три сегмента «Вернуть уведомления об операциях. Версия 2», «Показываем причину бесплатности…» и «Оплата уведомлений бонусами «Спасибо»».
3. Фильтр «Цель: Не выбрано» в «Активных» оставляет «Реакции на переводы в СБОЛ».
4. Клик по тегу в строке добавляет его в фильтр и **не открывает** паспорт. Клик по строке вне тега открывает паспорт, как раньше.
5. Наведение на тег в таблице или легенде гасит остальные теги таблицы.
6. В паспорте можно добавить и убрать цель, сменить продукт (меняется у всех тестов фичи) и тип гипотезы. Смена типа у теста с результатами меняет вывод в форест-плоте.
7. В справочнике можно изменить название, короткое имя и цвет цели. Изменение сразу видно в таблице. Занятый цвет выбрать нельзя. Архивная цель пропадает из фильтра, но остаётся на старых тестах.
8. У теста без цели появляется напоминание «Заполнить теги», а при заполнении цели исчезает.
9. Фильтр сохраняется при переходе между вкладками «Статуса» и в «Умный тираж».
10. В консоли браузера нет ошибок. Функциональность, которая была до доработки, работает: запись решения, SD-заявка, новый тест, журнал, чат ассистента.

## 11. Как проверить

В окружении есть Playwright с Chromium (`require('playwright')`).

1. Откройте `index.html#pult`, `#registry`, `#dictionary` и паспорт (`openPassport('style14')`) на ширине 1440 и 390 px. Сделайте скриншоты, сверьте с `mockups/tags-color-mockup.html`. Проверьте, что:
   - колонка не уже 268 px на десктопе;
   - две короткие цели помещаются в одну строку;
   - ничего не обрезается и не налезает.
2. Пройдите сценарии из раздела 10 кликами через Playwright и соберите `pageerror` и `console.error`. Ошибок быть не должно.
3. Повторите проверку на 1024 и 1280 px.
4. Если что-то разъехалось, исправьте и повторите проверку.

## 12. Документация

В `radar-ab/DESIGN.md` добавьте раздел «Теги»:
- цвет — у значения, форма — у измерения;
- палитра из 12 цветов без красного и сигнального оранжевого;
- тип гипотезы без цвета;
- фильтр не скрывает напоминания.
