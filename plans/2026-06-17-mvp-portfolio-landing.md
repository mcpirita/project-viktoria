# MVP: Лендинг-портфолио Виктории Мартяновой

**Статус:** активный
**Дата создания:** 2026-06-17
**Последнее обновление:** 2026-06-18 (**Оркестрация 3 параллельных агентов по Фазам 1.5+1.6.** Запущены непересекающиеся по файлам потоки: (1) security S1+S3 → `next.config.ts`; (2) loop-интеграция K0+K4+S2 → `lib/works.ts`/`schema.ts`/`WorkGrid`/`AutoplayBackground`/`parse.ts`; (3) loop-пайплайн K1+K5 → новый `scripts/make-loops.ts`+медиа. Оркестратор свёл рассогласование контракта манифеста ридер↔писатель. Сделано: **K0,K1,K4,K5,S1,S2 ✅**, K3 частично (только Delta), S3 проверено. Заблокировано внешне: **K2** (мастера с Vimeo) → K3-массово → K6. `tsc` чист, `next build` зелёный (21 стр.). Прежнее: **+Фаза 1.6 «Безопасность / hardening»** — провели аудит безопасности, состояние 🟢 хорошее, уязвимостей нет; в план внесены 3 необязательных пункта укрепления «в глубину»: S1 security-заголовки, S2 валидация видео-URL, S3 мониторинг `npm audit`. Прежнее: **+Фаза 1.5 «Ускорение загрузки видео»** — стратегия A, самохостинг сжатых лупов WebM+MP4 для грида вместо iframe-Vimeo, исходники качаем с Vimeo; ffmpeg-пайплайн `make-loops.ts`; спланировано, не реализовано. Прежнее: **+3 фото-работы Tommy Cash** — adidas / Maison Margiela / снегоход, категория `set-props`, между видео; «смешанный ряд» в `WorkGrid`: компактная фото-полоса 3-в-ряд внутри крупной 2-up сетки; мобильный — 1 колонка; теперь 15 работ; импорт через `import-use-this.ts`, мёрж в манифест. Прежнее: редизайн шапки + автоплей видео; A–G + H2)
**Цель:** Англоязычный сайт-портфолио художника арт-департамента (кино/реклама, костюмы, сет-дизайн, пропсы, постановки). Сначала рабочий сайт (контент наполняем сами), затем своя админка для самостоятельного редактирования Викторией.

---

## Контекст

Виктория — художник арт-департамента в кино и рекламе: costume / wardrobe, set design, props, production design, собственные постановки. Работ **очень много**, они уже в наличии. Аудитория — продакшены, режиссёры, агентства.

Сайт продаёт визуалом — работы на первом месте. Язык **только английский**.

**Стратегия (решено с Дмитрием):**
- **Фаза 1 — рабочий сайт.** Контент (фото/видео) добавляем сами на старте. Цель — живой сайт в интернете.
- **Фаза 2 — своя админка.** Виктория сама добавляет/редактирует работы. Делаем после запуска сайта.

**Главная «проблема» проекта (на чём оптимизируем все решения):** очень большой объём работ + Виктория должна редактировать сама в Фазе 2. Отсюда два сквозных принципа: (1) **index-first подача**, а не сетка-стена; (2) **формат контента и путей к картинкам фиксируем под Keystatic уже в Фазе 1**, чтобы Фаза 2 встала без миграции.

---

## Решённое (стратегия)

- **Роль:** художник арт-департамента (кино + реклама), костюмы, сет-дизайн, пропсы, постановки.
- **Язык сайта:** только английский.
- **Работы:** много, уже есть в наличии.
- **Подход к редактированию:** ✅ отложено на Фазу 2. Фаза 1 наполняется вручную нами.
- **Data-слой:** ✅ **БАЗЫ ДАННЫХ НЕ БУДЕТ** (арх-сверка 2026-06-17). Контент-как-код в Фазе 1, git-backed CMS в Фазе 2. Railway stateless, контент в git.
- **Репозиторий-абстракция:** ✅ доступ к данным за `lib/works.ts` (`getWorks`/`getWork`/`getCategories`).
- **Палитра:** ✅ близко к референсу — розово-бордовый editorial (как у Ranya). Финал — на дизайне.
- **Референс:** ✅ Ranya El-Refaey (`research/reference-ranya-el-refaey.md`).
- **Контент-модель:** ✅ объект **Work** + список Clients + Bio + Contact.
- **Категории:** ✅ несколько, заполняются постепенно. Первая — **Commercials** (`content/works-list.md`, 10 проектов).
- **Видео:** ✅ встраиваем ссылками Vimeo/YouTube.
- **Backstage / process:** ✅ показываем обязательно (`final[]` + `process[]` в схеме).
- **Оригиналы медиа:** остаются вне репо (источник); в репо — только лёгкие веб-версии.

---

## Технические решения (ресёрч прецедентов, 2026-06-17)

Подтверждено 5 параллельными ресёрч-агентами. Все выборы — под главную «проблему» (объём + самостоятельное редактирование).

### Сквозное требование: безупречно на телефоне (mobile-first)
Заказчики (кастинг-директора, агентства, режиссёры) смотрят сайт **с телефона между делом** — это основной сценарий, не запасной. Проектируем сначала мобайл, десктоп — расширение. Конкретные критерии (проверяются в J):
- **Один палец, один столбец.** Index-list, карточка проекта, About/Contact читаются и листаются вертикально без горизонтального скролла и зума. Hover-кадр на мобиле деградирует в видимый inline-кадр/тап (hover нельзя — он там не работает).
- **Тач-таргеты ≥ 44px**, фильтры/контакты/кнопка play — крупные, нажимаемые большим пальцем.
- **Мгновенно открывается на 4G.** LCP-кадр приоритетный, остальное lazy; AVIF/WebP + явные размеры (нет CLS-дёрганья при подгрузке).
- **Видео — постер + тап**, без автоплея тяжёлого на мобиле (трафик/батарея); `playsinline` обязателен (iOS).
- **Шапка-минимум на узком экране:** имя + бургер/компакт-фильтры + Contact всегда в один тап; marquee и часы не ломают раскладку.
- **Типографика читаема без зума:** базовый размер тела ≥16px, подписи `Client, Title, Production` не схлопываются.
- **Проверка на реальном железе** (или эмуляции): iPhone (Safari) + Android (Chrome), узкий и средний экран.

### Дизайн / UX

> **⚠️ Пересмотр подхода фазы F (2026-06-17, Дмитрий): index-first → grid-first.**
> Index-list (кадр только по hover/тапу) делал экран пустым — работы не читались сразу.
> Решение: главная теперь **видимая курируемая СЕТКА** превью-кадров (фото + видео-постеры)
> на розовом поле, как в референсе Ranya («SELECTED WORKS:»). Работы видны за пару секунд,
> без наведения. Проблема «сетка-стена» решается НЕ возвратом к списку, а **курированием**:
> на главной ~8–12 featured-работ (поле `Work.featured` + `getFeatured()`), полный архив —
> глубже (путь заложен). Раскладка живая: первые 2 плитки крупные (верхний ряд), остальные
> мельче 3-в-ряд; mobile — 1 колонка. Фильтры по-прежнему пере-раскладывают ту же сетку
> in-place. Видео-плитки: маркер play; при наличии `Work.video` играют через `<VideoEmbed>`
> in-place, иначе ведут на карточку. Старый `WorkIndex.tsx` + его CSS (`.index-row`,
> `.floating-preview`) удалены. Текст ниже — исходное (index-first) решение, оставлен как история.

- **Index-first, не grid-first.** Главная — типографический список работ (`Client, Title, Production`) с показом кадра по hover (desktop) / тапу (mobile). Сетка кадров — внутри карточки проекта. Это главный рычаг против «склада миниатюр».
- **Курирование:** ~8–12 featured-работ на поверхности; полный архив — на клик глубже.
- **Sticky-шапка:** имя слева · категории-фильтры в центре · Contact + живые часы справа. Фильтры пере-ранжируют тот же индекс in-place (без перезагрузки).
- **Marquee клиентов** — горизонтальная бегущая строка (social proof).
- **Подпись = `Client, Title, Production`** строго в одном формате (+ опц. Role/Year). Никаких свободных описаний.
- **4–6 категорий**, не больше (Film · Advertising · Costume · Set & Props · Productions — финал после разбора работ).
- **Final ↔ Process** внутри карточки — `useState<'final'|'process'>` + CSS view-transition, без библиотеки.
- **Анти-паттерны:** сетка-стена на 200 картинок; свободные подписи; автоплей тяжёлого видео на mobile; >6 категорий; картинки без явных размеров (CLS).

### Стек и сборка
- **Next.js 16** (App Router) + **React 19** + **Tailwind v4** (CSS-first, `@import "tailwindcss"` + `@theme`, без `tailwind.config.js`, PostCSS-плагин) + **TypeScript** (≥5.1, Node ≥20.9).
- **Next 16 особенности:** кеш opt-in → включить `cacheComponents: true`, использовать `"use cache"`; `params`/`searchParams`/`cookies` теперь async; Turbopack по умолчанию; `output: 'standalone'` для Railway; `next/image` дефолты изменились (`qualities: [75]`, `minimumCacheTTL` 4h).

### Data-слой (контент-как-код)
- **Plain-файлы + Zod**, без Velite/Contentlayer (Contentlayer заброшен; тулинг избыточен для плоской модели).
- **Контент = один файл на работу** в `src/content/works/<slug>/` (формат под Keystatic-коллекцию), картинки — `public/works/<slug>/`. Zod-валидация при загрузке.
- **`lib/works.ts` с async-сигнатурами уже сейчас** (`getWorks`/`getWork`/`getCategories`) → Фаза 2 (Keystatic Reader API) = правка одного файла, компоненты не трогаем.
- **Zod-схема `Work`** = единый источник истины, типы через `z.infer`, валидация падает на `next build` при кривом контенте. Поля: `title, client, production, category(enum), final[], process[], video?(url), order, slug?(из title)`.
- `category` — **поле**, не роут. Роут проекта — `/work/[slug]`, наполняется через `generateStaticParams` из репозитория.

### Image-пайплайн (build-time, локально перед коммитом)
- **`sharp` (prebuilt) + `heic-convert` (WASM)** для HEIC. **НЕ** глобальный libvips (на macOS хрупко: хардкод путей, Rosetta unsupported, ломается на `brew upgrade vips`).
- **`ffmpeg`** (system, `brew install ffmpeg`) — постер-кадр из MOV/mp4.
- Blur-плейсхолдер — самим sharp (20px → base64 webp), без plaiceholder.
- Скрипт `scripts/import-media.ts` (`tsx`): вход `~/…/<slug>/` → выход `public/works/<slug>/<name>-{400,800,1200,2000}.{webp,avif}` + `content/works.manifest.json` (`width/height/aspectRatio/blurDataURL/widths`).
- **Идемпотентность:** кэш по `mtime+size` (`.cache/media.json`, gitignored) → повторный прогон пропускает обработанное.
- `sharp(buf).rotate()` — учесть EXIF-ориентацию (iPhone HEIC часто повёрнуты). Не апскейлить (`widths.filter(w => w <= intrinsic)`).
- **Репо:** обычный git, **без LFS**. Оптимизированные деривативы малы. **Оригиналы HEIC/MOV — вне репо** (внешний бэкап). Следить за общим размером (капнуть верхнюю ширину ~1600–2000, при нужде дропнуть 400px-тир).

### Видео
- **Один свой `<VideoEmbed>`-фасад** (не набор библиотек): `provider = youtube | vimeo | mp4`. Постер = **собственный кадр Вики** (потому платформенные миниатюры не нужны).
- Server-shell с poster в `aspect-ratio`-боксе (нет CLS) → по клику client-island монтирует iframe с `autoplay=1`.
- `youtube-nocookie.com` + `?rel=0&playsinline=1`; Vimeo `?dnt=1&playsinline=1`; mp4 `<video preload="none" playsInline>`. GDPR-чисто для EU/Mitja.
- `lite-vimeo-embed` — **мёртв (2023)**, не брать. `react-lite-youtube-embed` жив, но YouTube-only — не нужен.
- **Лайтбокс** (full-screen) — `yet-another-react-lightbox` (актив., React 19, Video-плагин), только если понадобится модалка.

### Фаза 2 CMS
- **Keystatic (GitHub mode)** — единственный под «без БД + stateless Railway + картинки в репо». Коммитит через GitHub API, auth = GitHub OAuth (один редактор).
- **Tina дисквалифицирована** — self-hosted требует Redis/Mongo (ломает «без БД»).
- **Чтобы Фаза 2 встала drop-in:** формат файла-работы и путь `public/works/<slug>` фиксируем сейчас; `lib/works.ts` меняет только внутренности (`createReader()`), публичный API тот же.
- Caveat: проверить Keystatic на точной версии Next 16.x перед стартом Фазы 2 (доки отстают на «Next 14»).

---

## Карта параллелизации реализации (DAG)

Что можно делать одновременно, а что строго последовательно. Если задействуем несколько агентов — раскладка такая.

```
A. Скаффолд (Next 16 + Tailwind v4 + TS, next.config, структура папок)   ← ПЕРВЫЙ, блокирует всё
        │
        ├──────────────┬──────────────────────┬───────────────────────┐
        ▼              ▼                        ▼                       ▼
B. Zod-схема Work   C. Image-пайплайн      D. Дизайн-система       E. Копирайт EN
   + lib/works.ts      scripts/import-         (палитра, шрифты,      (hero, bio,
   (репозиторий,       media.ts                Tailwind @theme,        contacts) —
   async)              (НЕЗАВИСИМ от B:        layout-примитивы)       контент, не код
        │              работает с файлами)          │                       │
        │                    │                      │                       │
        └──────┬─────────────┴──────────┬───────────┘                       │
               ▼                         ▼                                   │
   F. Компоненты витрины          G. <VideoEmbed>-фасад                     │
      (шапка+часы, marquee,          (НЕЗАВИСИМ: чистый                     │
      index-list+hover, карточка     UI-компонент, нужен лишь               │
      проекта, About/Contact)        тип Work из B)                         │
               │                         │                                   │
               └────────────┬────────────┴───────────────────────────────────┘
                            ▼
              H. Наполнение реальным контентом
                 (прогон Commercials через C → файлы-работы по схеме B +
                  метаданные/видео-ссылки от Вики)   ← ЖДЁТ данные от Виктории
                            │
                            ▼
              I. Деплой на Railway (standalone) + домен + проверка mobile/desktop
                            │
                            ▼
              J. Финальный QA (Lighthouse, CLS, mobile, ссылки)
```

**Параллельные группы:**
- После **A** одновременно: **B, C, D, E** (4 независимых потока).
- После B+D готовы: **F**; **G** параллельно F (нужен только тип `Work`).
- **E** (копирайт) идёт параллельно всему техническому.

**Строго последовательно (нельзя параллелить):**
- **A → всё** (скаффолд первый).
- **B → F** (компоненты читают репозиторий).
- **F+C+H → I** (деплой после готового сайта с контентом).
- **H ждёт метаданные/видео-ссылки от Виктории** — внешняя блокировка, не разработка.

---

## Фазы

### [x] Фаза 0. Референс и сбор материала
- [x] Референс получен и разобран — Ranya El-Refaey.
- [x] Категория Commercials инвентаризирована (`content/works-list.md`).
- [x] Ресёрч прецедентов (5 агентов): дизайн, data-слой, image-пайплайн, видео, Фаза-2 CMS — стек зафиксирован.
- [~] Сбор работ продолжается: ждём остальные категории + метаданные/видео-ссылки от Вики. Медиа ещё не перенесены в проект.

### [ ] Фаза 1. Рабочий сайт (контент наполняем сами)
Цель — живой сайт в интернете на реальном контенте Виктории. Порядок — по DAG выше.

- [x] **A. Скаффолд:** Next.js **16.2.9** + Tailwind v4 (CSS-first, без `tailwind.config.js`) + TS; `next.config.ts` (`cacheComponents: true`, `output: 'standalone'`, `images`); структура `src/content/works`, `src/lib`, `scripts`, `public/works`; git init + `.gitignore`. React 19.2.7, Tailwind 4.3.1. `next build` зелёный.
- [x] **B. Контент-модель:** Zod-схема `Work` в `src/lib/schema.ts` (формат **`index.json` на работу** в `src/content/works/<slug>/`), типы через `z.infer`; `src/lib/works.ts` (async `getWorks`/`getWork`/`getCategories`, build-time Zod-валидация, опц. обогащение из манифеста). enum категорий: `commercials|film|music-video|costume|set-props|productions`. 2 фикстуры (`bolt-whatever`, `jameson-aroma`). Установлен `zod`. **Контракт ключа манифеста сведён с C** оркестратором (`works/<slug>/<name>`).
- [x] **C. Image-пайплайн:** `scripts/import-media.ts` (sharp 0.35 + heic-convert 2.1 + ffmpeg 8.1). Прогнан на `~/Downloads/Commercials`: **146 записей** (134 фото + 12 видео-постеров), responsive WebP/AVIF {400,800,1200,2000} + blur + `content/works.manifest.json` + кэш `.cache/media.json` (идемпотентность подтверждена: 3-й прогон 146/146 из кэша за 0.95с). `public/works/**` ≈ **89 МБ**. Маппинг папок→slug задокументирован.
- [x] **D. Дизайн-система:** палитра rose/maroon editorial (paper `#fbf7f4`, rose `#f3d9d2`, maroon `#5c1d24`), шрифт **Fraunces** (next/font), `@theme`-токены в `globals.css`, примитивы `src/components/ui/` (`Container/Section/Hairline/Button/Typography`), демо-роут `/style-guide`. Mobile-first (body ≥16px, тач-таргеты).
- [x] **E. Копирайт (EN):** `content/copy-en.md` — hero (3 варианта), bio (кратк./разверн.), 10 подписей `Client, Title, Production`, категории, микрокопия, contact-блок. **Частично:** факты Виктории (город, Production, email, агентство, видео-ссылки) помечены PLACEHOLDER — 13 вопросов к Виктории в конце файла.
- [x] **F. Компоненты витрины:** sticky-шапка (имя · фильтры · CONTACT+живые часы) → marquee клиентов → ~~index-list с hover-кадром~~ **курируемая СЕТКА работ (grid-first, см. пересмотр выше)** → карточка `/work/[slug]` (`generateStaticParams`, сетка + Final↔Process через `useState` + View Transitions API) → About/Contact. Острова в `src/components/site/`. Mobile-first чеклист пройден (один столбец, тач ≥44px, нет гориз. скролла, LCP priority, playsinline). `next build` зелёный, роуты пререндерятся.
- [x] **F2. Grid-first переделка главной (2026-06-17):** заменил index-list на видимую сетку.
  - `src/components/site/WorkGrid.tsx` — новый клиент-остров: плитки (постер + подпись `WorkCaption`) на розовом поле, фильтр по `active` in-place, живая раскладка (2 крупные сверху / 3-в-ряд ниже / 1 кол. на mobile), play-маркер на видео-работах, анти-CLS (явный `aspect-ratio`, blur, первые 2 `priority`).
  - Видео: при `Work.video` плитка = `<VideoEmbed>` (постер→тап→плеер) in-place; пока ссылок нет — ведёт на карточку, но с маркером play. Детект видео: `video` ИЛИ `kind==="video-poster"` (манифест C) ИЛИ категория `music-video`.
  - Механика featured: поле `Work.featured` в Zod-схеме + `getFeatured(limit=12)` в `lib/works.ts` (если ничего не помечено — первые N по `order`; сейчас все 10 показываются). Путь «показать все» = `getWorks()`, заложен.
  - `image.ts`/`ImageMeta` пробрасывают `kind`; `IndexEntry` получил `isVideo`/`video`.
  - `Showcase` теперь рендерит `WorkGrid` на `tone="rose"`; About переведён на `tone="paper"` (чтобы два розовых блока не сливались). Ритм: hero(paper) → marquee → сетка(rose) → About(paper) → Contact(rose-gradient).
  - Удалены: `WorkIndex.tsx` и мёртвый CSS (`.index-row*`, `.floating-preview`, `@keyframes preview-in`).
  - `next build` зелёный; `/` рендерит все 10 кадров, 3 play-маркера (delta, highsnobiety, tommy-cash), сетка 1 колонка на mobile.
- [x] **G. `<VideoEmbed>`-фасад:** `src/components/VideoEmbed.tsx` + `video/parse.ts` — facade-паттерн (постер → по тапу iframe), `provider=youtube|vimeo|mp4` (автодетект из URL), youtube-nocookie / vimeo dnt / mp4 preload=none, aspect-ratio-бокс (нет CLS), playsinline, тач-таргет 64px.
- [~] **H. Наполнение** 🔒 **ЧАСТИЧНО разблокирована (2026-06-17 Виктория дала факты о себе):** ✅ закрыто и внесено в код/копирайт — имя **VIKTORIA MARTJANOVA**, Tallinn, ~10 лет, роль, email/Instagram/IMDb (живые ссылки в Contact), таксономия категорий финализирована (`commercial, music-video, editorial, film, theater, art`), Delta = Delta Air Lines, Tommy Cash = music video.
- [~] **H2. Съёмочная группа + 2 новых проекта (2026-06-17, из `Commercials/New Info`):** Виктория прислала info-документы (режиссёр/оператор/продакшн/агентство/роль) по всем направлениям + медиа двух новых работ.
  - **Схема B расширена:** добавлены `role` (роль Виктории) и `credits {director, dop, productionDesigner?, agency?, starring?}`; `title` ослаблен до `default("")` (для роликов без отдельного названия карточка показывает клиента, подпись опускает строку title). Поля автоматически проходят через `ResolvedWork`.
  - **Метаданные внесены во все 10 существующих работ:** Production-компании + роль + кредиты (напр. Delta — Art Director, PD Arthur de Borman, dir Anna Himma, W+K; Lascana — Serviceplan, starring Victoria Swarovski; Victorinox — Publicis Zürich; Jameson — Cuba Films · Renegade Berlin; Tommy Eurovision — Props, dir Alina Pasok).
  - **2 новых проекта добавлены** (прогнаны через `import-media.ts`, +11 деривативов, манифест 146→157): `tommy-lotto` (Tommy Cash × Eesti Loto, Wedia, dir Dima Dobrovolskis) и `bolt-caromatherapy` (Caromathérapy by Bolt, Wedia, dir Esko Bros). Источники скопированы в `~/Downloads/Commercials/{Tommy Lotto, Bolt Caromatherapy}`. **Итого 12 работ.**
  - **Карточка проекта** (`work/[slug]/page.tsx`) рендерит блок кредитов (`<dl>` Role/Director/DOP/Production Design/Agency/Starring/Production — только заполненные строки); placeholder `[PRODUCTION — TBC]` убран.
  - **Пустые архивы** «Tommy pregnant» и «Tommy Cash x Maison Margiela» (zip без содержимого) — пропущены, медиа нет.
  - `next build` зелёный (13 роутов /work/*), существующие 89 МБ деривативов не тронуты (кэш).
  - **Видео-ссылки (2026-06-17, Виктория прислала 7):** внесены в `video` для `highsnobiety-x-jameson, tommy-lotto, lascana, victorinox, adidas (YT), bmw-f74, bolt-interview (YT)`. Хранятся чистыми URL (парсер игнорит query). Эти плитки теперь играют in-place на гриде + плеер на карточке. Bolt-ссылку (YT) разрешил по заголовку видео → «Reverse Interview» = `bolt-interview`.
  - **Агентство-представитель — решено НЕ добавлять (2026-06-17, Дмитрий):** строка `AGENCY` удалена из секции Contact (`page.tsx`). Contact теперь = Email · Instagram · IMDb. _(Per-project agency-кредиты Serviceplan/Publicis Zürich в карточках — это реальные продакшн-кредиты из документов Виктории, оставлены.)_
  - **Осталось от Виктории:** видео-ссылки для остальных 5 работ (`bolt-whatever-you-do, bolt-caromatherapy, delta, tele-2, tommy-cash-eurovisioon`), полный список клиентов, портрет (`assets/portrait/`).
- [x] **F3. Правки витрины (2026-06-17, Дмитрий):**
  - **Видео muted по умолчанию.** Все встроенные плееры играли со звуком (и при тапе по нескольким — одновременно, какофония). В `video/parse.ts` `buildEmbedSrc` добавлены `mute=1` (YouTube) / `muted=1` (Vimeo); в `VideoFacade.client.tsx` нативному `<video>` (mp4) добавлен `muted`. Звук включается из контролов плеера по желанию зрителя.
  - **Ровная сетка.** Прежняя раскладка (2 крупные сверху + 3-в-ряд) при 12 работах оставляла «сироту» в последнем ряду. `WorkGrid.tsx`: новый ритм-мозаика на 6-кол lg-гриде — цикл из 5 плиток (ряд из 2 крупных `span-3` + ряд из 3 средних `span-2`), каждый ряд заполняет все 6 колонок (`isWide(i) = i % 5 < 2`). Крупные плитки `aspect-[3/2]` на lg, на sm/mobile всё к `4/3` для ровной высоты. sm — чистый 2-up, mobile — 1 колонка.
  - **Кастомный курсор** (`CustomCursor.client.tsx` + стили в `globals.css`): бордовая точка 1:1 + трейлинг-кольцо с easing, кольцо растёт / точка гаснет над кликабельным (`a, button, …`). Только pointer-fine (desktop), уважает `prefers-reduced-motion` (кольцо без трейла), нативный курсор скрыт только пока остров активен (`.has-custom-cursor`). Смонтирован в `layout.tsx`.
  - `npx tsc --noEmit` чисто, `next build` зелёный (17 страниц).
- [ ] **I. Деплой** 🔒 **ЗАБЛОКИРОВАНА — после H:** GitHub → Railway (standalone, без volume), домен, проверка mobile/desktop.
- [ ] **J. QA** 🔒 **ЗАБЛОКИРОВАНА — после I:** сквозной mobile-first-чеклист на реальном iPhone/Android + Lighthouse (mobile), CLS, проверка ссылок.

### [ ] Фаза 1.5. Ускорение загрузки видео (самохостинг лупов)
**Проблема (Дмитрий, 2026-06-18):** видео грузятся медленно. Диагноз: (1) грид играет фон через **iframe Vimeo** (`AutoplayBackground`) — тяжёлый плеер-JS + холодный старт 1–3 c на плитку, при нескольких видимых плитках — куча сторонних запросов; (2) Delta `img-9474.mp4` = **9.3 МБ** без сжатия/WebM/ресайза.

**Ресёрч прецедентов (2026-06-18):** фоновые лупы НЕ грузят через iframe-плеер — берут короткий немой клип, режут аудио на уровне файла, ужимают под реальный размер показа (≤800px), отдают **WebM (VP9/AV1) + MP4 (H.264)** (−30–50% веса, старт почти мгновенный, без стороннего JS). Видео-CDN (Mux/Cloudflare Stream/Bunny) — для масштаба, но платно и ломает «без БД». Источники: [Next.js Videos guide](https://nextjs.org/docs/app/guides/videos), [ImageKit](https://imagekit.io/blog/nextjs-video-optimization/), [пример −60% bandwidth](https://katerina198b.medium.com/optimising-videos-in-next-js-4fbf823c8c3c), [Mux](https://www.mux.com/articles/the-best-video-apis-right-now).

**Стратегия (решено с Дмитрием, 2026-06-18): A — самохостинг лупов.** Грид играет короткие сжатые WebM+MP4 из `/public`; Vimeo-facade остаётся в полном плеере на карточке работы. Бесплатно, «живой» грид (Phase H) сохраняется, вписывается в content-as-code / no-DB. Исходники — **скачиваем мастера с Vimeo**. (Отвергнуты: B видео-CDN — платно/инфраструктура; C только-постер — грид теряет «жизнь».)

- [x] **K0. Контент-модель лупа.** ✅ Реализовано (2026-06-18, оркестрация 3 агентов). `LoopSrc {webm,mp4,loop480?}` + `loopSrc: LoopSrc|null` на `ResolvedWork`; `resolveLoop` в `lib/works.ts` двухступенчатый: (1) manifest-запись `works/<slug>/loop` (`kind:"loop"`), (2) автодетект по наличию `loop-720.{webm,mp4}` на диске — без правки `index.json`. Поле `loopStart` в Zod-схеме (дефолт 0). **Контракт манифеста сведён оркестратором** (ридер↔писатель рассогласовались: ридер ждал `entry.webm`, писатель дал `entry.loop.webm` без ведущего `/`): канон — `{kind:"loop", loop:{webm,mp4}, loopMobile?:{webm,mp4}, width/height/aspectRatio/durationSeconds/widths/files}`, пути root-относительные, ридер нормализует ведущим `/`. Конвенция: пайплайн пишет `public/works/<slug>/loop-720.{webm,mp4}` (+ опц. `loop-480.*` под mobile) и регистрирует деривативы в манифесте (как постеры). `lib/works.ts` отдаёт `loopSrc {webm, mp4}`; **автодетект по наличию файла** — без ручного редактирования `index.json` (меньше трения, Keystatic-совместимо). Опц. поле `loopStart` в `index.json` — с какой секунды резать (по умолчанию 0).
- [x] **K1. ffmpeg-пайплайн нарезки.** ✅ `scripts/make-loops.ts` создан. CLI: `npx tsx scripts/make-loops.ts <file-or-dir> [--player] [--mobile] [--slug s] [--seg n] [--*-crf n]`. Сегмент ~6–8с (с `loopStart`) → ресайз ≤800px → `-an` → WebM `libvpx-vp9 -crf 32` + MP4 `libx264 -crf 26 +faststart`. Идемпотентность: кэш `.cache/loops.json` по `mtime+size`+fingerprint флагов. Мёрж в манифест (не перезапись). Батч-layout `<dir>/<slug>/master.*` или `<dir>/<slug>.mp4`. Новый `scripts/make-loops.ts` (sharp/ffmpeg уже в проекте, ffmpeg 8.1). На вход мастер per work → сегмент ~6–8 c → ресайз по ширине ≤800px (CSS `object-cover` доделывает кроп) → `-an` (срез аудио) → **WebM** `libvpx-vp9 -crf 32 -b:v 0` + **MP4** `libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart`. Цель веса: **200–800 КБ/луп**. Идемпотентность + кэш `.cache` как в `import-media.ts`.
- [ ] **K2. Скачать мастера с Vimeo** 🔒 **ВНЕШНИЙ БЛОК (ждёт Дмитрия/Викторию):** `yt-dlp` (проверить/`brew install`). ⚠️ для приватных без download — нужны cookies/логин Виктории либо включить download на Vimeo. Мастера во временную папку, в репо не коммитим. Пайплайн (K1) уже готов их принять батчем.
- [~] **K3. Прогон пайплайна** — ✅ **8 из ~12 видео-работ имеют self-hosted лупы** (Delta + 7 от Дмитрия, 2026-06-18): `bolt-caromatherapy, highsnobiety-x-jameson, tele-2, tommy-lotto, victorinox, bolt-whatever-you-do, yale-smart-locks`. Все 720+480 (`--mobile`), вес 76–706 КБ/файл, в коридоре. Резолв через манифест-контракт проверен, `next build` зелёный. **Осталось:** `lascana, bmw-f74` (Vimeo — Дмитрий докачает позже); YouTube-работы `adidas, bolt-interview, tommy-cash-eurovisioon` остаются на YT-фасаде (чужие каналы, не самохостим). Мастера — в `~/Downloads/loop-masters/` (вне репо).
- [x] **K4. Провод в грид.** ✅ `AutoplayBackground.client.tsx` получил проп `loop?: LoopSrc` → нативный `<video muted loop playsInline preload="metadata">` с `<source>` webm+mp4 (480p через `media`-квери), IntersectionObserver mount/unmount, постер снизу, фейд по `onLoadedData`, `prefers-reduced-motion` → постер. `WorkGrid.tsx`: видео-плитка = `isVideo && (loopSrc || video)`, при `loopSrc` Vimeo-iframe НЕ монтируется. **Fallback на Vimeo/YT сохранён** для работ без лупа (15 из 16 сейчас). `next build` зелёный, регрессий нет.
- [x] **K5. Delta + полный плеер.** ✅ `img-9474.mp4` (9.7 МБ) → `make-loops.ts --player` → `player.mp4` **1.18 МБ** (H.264 540p, faststart); `index.json` Delta `video` переключён на `/works/delta/player.mp4`; мастер `img-9474.mp4` удалён из репо (−9.7 МБ). Грид Delta играет луп `loop-720` (mp4 577 КБ / webm 978 КБ). _Caveat: Delta — аномально тяжёлый зернистый 60fps-исходник, webm чуть выше коридора 800 КБ; дефолты скрипта спековые, под нормальные Vimeo-мастера._
- [ ] **K6. Замеры/QA.** 🔒 после K3 (реальные лупы на всех работах). До/после: вес `/`, число сторонних запросов, время до «оживления» грида; mobile (iPhone/Android), `reduced-motion` (остаётся постер), **CLS=0**, Lighthouse (mobile). Зафиксировать цифры в итоге плана.

**Критерий готовности:** на главной грид «оживает» почти мгновенно, без стороннего плеер-JS на видимых плитках; Delta-mp4 < ~1.5 МБ; полный просмотр на карточке работает как раньше.

### [ ] Фаза 1.6. Безопасность / hardening (перед продакшеном)
**Аудит (2026-06-18):** провели проверку безопасности. **Состояние — 🟢 хорошее.** Сайт — статическая витрина: нет API-роутов, нет server actions, нет `.env`, нет приёма пользовательского ввода и форм. Чисто по XSS (`dangerouslySetInnerHTML`/`eval`/`innerHTML` отсутствуют), path traversal в `/work/[slug]` невозможен (slug сверяется со списком известных работ), контент валидируется Zod на build-time, секретов в коде и истории git нет, `.env` корректно в `.gitignore`, видео-iframe через `youtube-nocookie`/Vimeo с экранированием ID. **Уязвимостей нет.** Ниже — необязательное укрепление «в глубину», низкий приоритет.

- [x] **S1. HTTP security-заголовки.** ✅ `headers()` в `next.config.ts` для `/:path*`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` (2y, includeSubDomains, preload), `Content-Security-Policy`. CSP: `default-src 'self'`, `frame-src` = `youtube-nocookie.com` + `player.vimeo.com` (видео не ломается), `media-src 'self' blob:` (self-hosted mp4/лупы), `img-src 'self' data: blob:` (blur), `style/script-src 'self' 'unsafe-inline'` (Tailwind/Next), `frame-ancestors 'none'`. Проверено `curl -I` на `next start` — все 5 заголовков отдаются. Добавить `headers()` в `next.config.ts`: `X-Frame-Options: DENY` (или CSP `frame-ancestors`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, базовый `Content-Security-Policy` (учесть `youtube-nocookie.com`/`player.vimeo.com` для `frame-src`). Защита от кликджекинга/sniffing — не закрывает дыру, а снижает класс рисков.
- [x] **S2. Валидация схемы видео-URL.** ✅ `isSafeFileUrl` в `video/parse.ts`: для mp4 пропускает только `https://…` или root-относительные `/…`, отбрасывает `//`, `javascript:`, `data:`, `http:`. Небезопасный URL бросает ошибку → вызывающий код падает на постер. В `parseVideo`/`VideoFacade` для mp4 пропускать только `https://` и `/…` (отбрасывать `javascript:`/`data:` и пр.). Риск теоретический (контент пишем мы, не из браузера), но дёшево.
- [~] **S3. `npm audit` — мониторинг.** ✅ Проверено (2026-06-18): **2 moderate** ([postcss XSS](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)), транзитивно через `next` (`next/node_modules/postcss`), build-time стрингификация CSS — реальный риск ≈ 0. Действий не предпринято (правильно). ⚠️ `npm audit fix --force` поставил бы `next@9.3.3` — НЕ запускать. Чинится обновлением Next. 2 moderate ([postcss XSS](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)) тянутся транзитивно через `next`, это **build-time** инструмент (стрингификация CSS), реальный риск ≈ 0. ⚠️ `npm audit fix --force` НЕ запускать — он откатывает `next` до v9 и ломает проект. Чинится патчем Next — просто обновлять Next по мере выхода версий.

**Критерий готовности:** security-заголовки отдаются на проде (проверить через `curl -I` / securityheaders.com); mp4-URL валидируется по схеме; `npm audit` под наблюдением, без «force»-фиксов.

### [ ] Фаза 2. Редактирование без разработчика (git-backed CMS)
Цель — Виктория сама управляет контентом, БЕЗ БД.
- [ ] Подключить **Keystatic (GitHub mode)**: коллекция `works` поверх тех же файлов/путей, что и Фаза 1.
- [ ] Поменять внутренности `lib/works.ts` на `createReader()` — публичный API тот же, компоненты не трогаем.
- [ ] CRUD работ (добавить/редактировать/удалить, порядок, категория) → пишет в те же файлы.
- [ ] Загрузка кадров → прогон через image-пайплайн → коммит в репо (без бакета).
- [ ] Редактирование bio, клиентов, контактов.
- [ ] Авторизация — GitHub OAuth (один редактор).

---

## Итог

_(заполняется по мере выполнения)_

Реализован целиком: нет — **код Фазы 1 (A–G) готов и зелёный**, осталось наполнение реальными данными Виктории (H) и деплой (I/J).

**Сделано (на 2026-06-17):** каркас проекта; разобран референс (Ranya); определена контент-модель и стратегия; инвентаризирована Commercials; ресёрч прецедентов 5 агентами — стек зафиксирован; **реализована вся кодовая часть Фазы 1 (A–G) оркестрацией параллельных агентов по DAG за 3 волны:**
- **Волна 0:** A (скаффолд Next 16.2.9 + Tailwind v4 + TS) + E (копирайт EN, параллельно как контент).
- **Волна 1:** B (Zod-схема + `lib/works.ts`), C (image-пайплайн, 146 деривативов из Commercials), D (дизайн-система rose/maroon + Fraunces + `/style-guide`), G (VideoEmbed-фасад) — 4 агента параллельно.
- **Волна 2:** F (витрина: шапка+часы, marquee, index-list с hover/тап, карточка проекта, About/Contact).
- Оркестратор свёл рассогласование контракта B↔C (ключ манифеста `works/<slug>/<name>`), проверил `next build` после каждой волны — зелёный.

Итог кода: `next build` зелёный, роуты `/`, `/style-guide`, `/work/[slug]` (+ 2 фикстуры) пререндерятся, tsc чист. `public/works` ≈ 89 МБ деривативов.

**Заблокировано (не разработка):**
- **H — ждёт Викторию:** Title (6 проектов), Production (все 10), видео-ссылки, уточнения по Delta / Tommy Cash, bio-факты (город/опыт), контакты (email/агентство/Instagram/IMDb), портрет. Все места помечены PLACEHOLDER в `content/copy-en.md` (13 вопросов) и в верстке F.
- **I/J — после H:** деплой Railway + домен, затем финальный mobile-first QA + Lighthouse.

**Следующий шаг:** собрать у Виктории недостающие метаданные/видео-ссылки/контакты/портрет (см. `content/copy-en.md` и `content/works-list.md` → блок «Что нужно от Виктории») → фаза H (заменить фикстуры на реальные работы, прогнав медиа через `scripts/import-media.ts`) → I (деплой) → J (QA).

**Хендофф:** workspace `~/Project Виктория`. Источник медиа — `~/Downloads/Commercials`. Запуск: `npm run dev`. Импорт медиа: `npx tsx scripts/import-media.ts ~/Downloads/Commercials`. Всё состояние — в этом файле.

**Редизайн 2026-06-18 (фидбэк Виктории — «выглядит коряво»):** три правки по её замечаниям.
1. **Шапка.** Убрана дублирующая структура (герой `Costume, Set & Props…` + имя + фильтры + «all/commercial/music video»). Теперь компактный центрированный masthead из рядов: (1) имя по центру → (2) курируемое меню по центру `ALL · COMMERCIAL · COSTUME · SET & PROPS · MUSIC VIDEO · THEATRE` → (3) бегущая строка клиентов. Герой-секция удалена целиком. Меню — фиксированный `MENU` в `categories.ts` (НЕ `getCategories`), показывается всегда; пустые секции (costume/set-props/theatre — пока без работ) дают «Coming soon» в гриде.
2. **Категории.** В enum (`schema.ts`) добавлены `costume`, `set-props`; `theater`-лейбл → `THEATRE`. editorial/film/art оставлены резервом, в меню не выводятся.
3. **Видео оживлено.** Видео-плитки больше не статичный постер с кнопкой play — теперь тихий автоплей-петля при попадании в зону видимости (`AutoplayBackground.client.tsx` + IntersectionObserver, rootMargin 200px, размонтаж при уходе). Vimeo `background=1`, YouTube `mute+loop+controls=0` (`buildBackgroundSrc` в `parse.ts`), mp4 — native `<video loop muted>`. Постер всегда снизу, плеер фейдится поверх только после `onLoad`/`onLoadedData` → нет чёрного мелькания и graceful при заблокированном автоплее; `prefers-reduced-motion` оставляет статичный постер. Клик по плитке открывает полную работу (`/work/<slug>`). Это маскирует слабые исходные стопкадры, на которые жаловалась Виктория.

Проверено: `tsc` чист, `next build` зелёный, скриншоты desktop+mobile (headless Chrome с `--autoplay-policy=no-user-gesture-required`) — сетка показывает живые кадры видео, шапка компактна и центрирована. **Осталось от Виктории** (не код): качественные исходные фото вместо видео-стопкадров для фото-работ; разметка работ по costume/set-props/theatre, чтобы наполнить пустые секции меню.

**Правки по фидбэку 2026-06-18 (вторая итерация — «нравится, но…»):**
1. **Грид → ровные 2-в-ряд.** Жалоба: 3-в-ряд выглядит неаккуратно, окна мелкие. Убрал мозаику (2 крупные / 3 средние / band) из `WorkGrid.tsx` — выпилены `TileKind`, `SPAN_CLASS`, `layout()`. Теперь простая равная сетка: mobile 1 кол. → sm/lg 2 кол., единый ratio `aspect-[4/3]` (mobile) → `aspect-[3/2]` (sm+), все плитки крупные, ряды всегда заполнены. `sizes` упрощён до `(min-width:640px) 48vw, 100vw`.
2. **Отступ под шапкой.** Жалоба: слишком много места между шапкой и работами. В `Showcase.tsx` секции works добавлен `className="!pt-[clamp(1.25rem,3vw,2.25rem)]"` (перебивает дефолтный `py-[clamp(3rem,8vw,7rem)]` Section). «SELECTED WORKS:» теперь сразу под marquee.
3. **Новые работы — отложены** (решение Дмитрия): источников новых работ нет (`~/Downloads/Commercials` = те же 12; «Tommy pregnant» и «Maison Margiela» пусты). Добавим, когда Виктория пришлёт медиа/видео-ссылки.

Проверено: `tsc` чист, `next build` зелёный (18 страниц), скриншот desktop 1440 — грид ровный 2-up, отступ убран.

**Фото-работы Tommy Cash + смешанный ряд (2026-06-18, третья итерация):** Виктория прислала медиа — добавлены **3 фото-проекта** (категория `set-props`, без видео → ведут себя как фото-плитки), между видео-работами:
- `adidas-tommy-cash` — adidas Originals BY TOMMY CASH (3 кадра, обложка — длинные туфли на шахматном полу);
- `maison-margiela-tommy-cash` — Maison Margiela × Tommy Cash (2 кадра: глиняные тела (обложка) + хлеб-«шлёпанцы»);
- `tommy-cash-social` — снегоход / прорубь (1 кадр).
- Поставлены на позиции **3–5**, порядок остальных работ сдвинут (теперь **15 работ**). `getFeatured()` поднят `12 → 20` — иначе новые вытолкнули бы последние за лимит.
- **Импорт — через `scripts/import-use-this.ts`** (он МЁРЖИТ в манифест, не трогая остальные). `import-media.ts` здесь опасен: перезаписывает весь манифест из дерева Commercials и затёр бы 106 entries (включая курированные «use-this»/постеры). ITEMS скрипта обновлены под 6 кадров; источники — `~/Downloads/Commercials/Tommy Cash` + `…/Tommy Cash x Maison Margiela` (Maison-файлы переименованы из SaveClip-мусора в чистые имена).
- **Смешанный ряд в `WorkGrid.tsx`** (фидбэк Дмитрия: уплотнить, но сохранить фидбэк Виктории про крупные 2-up). Новая `toBlocks()` режет ленту на блоки: смежный ран из **≥2 фото-плиток** → компактная полоса (`band`, на desktop 3-в-ряд, квадраты), всё остальное (видео + одиночные фото) → крупная 2-up сетка. Одиночное фото (`bolt-caromatherapy`) остаётся крупным → ряды нигде не рвутся. Мобильный — всё в 1 колонку (по проекту в ряд, по просьбе Дмитрия).
- Проверено: `next build` зелёный (21 стр.), скриншоты desktop 1440 + mobile 390 (headless Chrome).
- **Осталось от Виктории:** title/production/режиссёр для трёх новых проектов (пока пусто); решить, оставлять ли обложкой Maison «глиняные тела» (обнажённые глиняные фигуры) или сменить на «хлеб».

### Замеченные нюансы (для следующей сессии)
- **Next 16 Cache Components** отвергает `new Date()` в серверном компоненте при пререндере — F захардкодил год в футере `© 2026`. Для живого года нужен клиентский остров или `connection()`.
- **Вес репо:** `public/works` ≈ 89 МБ (полноразмерные фото ×4 тира ×2 формата). При росте — дропнуть тир 400 или 2000 (одна константа `WIDTHS` в `import-media.ts` + перепрогон).
- **Фикстуры B** (`still-01` и т.п.) ссылаются на несуществующие файлы — это норма Фазы 1, F рендерит плейсхолдер-блоки; фаза H заменит на manifest-имена (напр. реальные ключи `adidas`, `lascana`, `victorinox`).
