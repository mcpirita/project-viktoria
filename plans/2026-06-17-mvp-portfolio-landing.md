# MVP: Лендинг-портфолио Виктории Мартяновой

**Статус:** активный
**Создан:** 2026-06-17 · **Обновлён:** 2026-06-19
**Цель:** англоязычный сайт-портфолио художника арт-департамента (кино/реклама, костюмы, сет-дизайн, пропсы, постановки). Сначала рабочий сайт (контент наполняем сами), затем своя админка для Виктории.

---

## Где мы сейчас

- **Код Фазы 1 (A–G) готов**, сайт в проде: https://project-viktoria.vercel.app (деплой = push в `main`, Vercel авто-выкатывает).
- **Фаза 1.5 (видео-лупы) — 8 из ~12 работ** играют self-hosted WebM+MP4 в гриде вместо тяжёлого Vimeo-iframe.
- **Фаза 1.6 (security) — закрыта** (заголовки + CSP + валидация URL).
- Сейчас **15 работ** (12 видео/реклама + 3 фото-проекта Tommy Cash).

**Следующий шаг:** докачать мастера `lascana`, `bmw-f74` с Vimeo в `~/Downloads/loop-masters/` → прогнать `make-loops.ts` → K6 (замеры) → добор контента от Виктории.

---

## Ключевые решения (не пересматривать без причины)

- **Без БД.** Контент-как-код (Фаза 1) → git-backed CMS Keystatic GitHub-mode (Фаза 2). Доступ за `lib/works.ts` (`getWorks`/`getWork`/`getCategories`) — смена источника локальна.
- **Контент = `index.json` на работу** в `src/content/works/<slug>/` + Zod-схема `Work` (`src/lib/schema.ts`, единый источник истины, валидация падает на `next build`). Картинки — `public/works/<slug>/`. Формат фиксирован под Keystatic → Фаза 2 drop-in.
- **Mobile-first** — основной сценарий заказчика. Один столбец, тач ≥44px, LCP-приоритет, явные размеры (CLS=0), `playsinline`.
- **Дизайн grid-first:** главная = курируемая сетка кадров на розовом поле («SELECTED WORKS:»), ~2-up крупные. Палитра rose/maroon editorial (референс Ranya El-Refaey), шрифт Fraunces. Шапка — компактный центрированный masthead (имя → меню `categories.ts` → marquee клиентов), без героя.
- **Видео:** свой `<VideoEmbed>`-фасад (youtube-nocookie / vimeo-dnt / mp4). В гриде — тихий автоплей-луп при появлении в зоне видимости (`AutoplayBackground.client.tsx` + IntersectionObserver); полный плеер — на карточке работы. `prefers-reduced-motion` → статичный постер.
- **Стек:** Next.js 16 (App Router, `cacheComponents: true`, async `params/cookies`, Turbopack) + React 19 + Tailwind v4 (CSS-first, без `tailwind.config.js`) + TS. Хостинг Vercel.
- **Медиа-пайплайн:** `sharp` + `heic-convert` (НЕ глобальный libvips) + `ffmpeg`. Деривативы в репо (без LFS), **оригиналы — вне репо** (`~/Downloads/...`).

---

## Фазы

### [x] Фаза 0. Референс и сбор материала
Референс разобран (Ranya), Commercials инвентаризирована, стек зафиксирован ресёрчем.

### [~] Фаза 1. Рабочий сайт
- [x] **A–G. Весь код витрины:** скаффолд, Zod-модель + `lib/works.ts`, image-пайплайн (`import-media.ts`), дизайн-система + `/style-guide`, копирайт EN (`content/copy-en.md`), компоненты (шапка, marquee, грид, карточка `/work/[slug]` с Final↔Process, About/Contact), `<VideoEmbed>`-фасад.
- [x] **Контент Виктории (частично):** имя VIKTORIA MARTJANOVA, Tallinn, роль, контакты (email/Instagram/IMDb), кредиты (режиссёр/оператор/PD/продакшн) внесены во все работы; таксономия категорий финализирована; 7 видео-ссылок + 3 фото-проекта Tommy Cash.
- [x] **I. Деплой:** Vercel, прод живой (2026-06-18).
- [ ] **Осталось от Виктории (не код):** title/production для 3 фото-проектов Tommy Cash; полный список клиентов; портрет (`assets/portrait/`); решить обложку Maison (глиняные тела vs хлеб); работы под пустые секции меню (costume/theatre).
- [ ] **J. Финальный QA:** mobile-first чеклист на реальном iPhone/Android + Lighthouse + проверка ссылок.

### [~] Фаза 1.5. Ускорение видео (самохостинг лупов)
Грид играет короткие сжатые WebM+MP4 из `/public` (−вес, мгновенный старт, без стороннего JS); Vimeo-плеер остаётся на карточке.

- [x] **K0/K4. Модель + провод.** `loopSrc` на `ResolvedWork`, автодетект из манифеста (`works/<slug>/loop`, `kind:"loop"`) или по файлам на диске. `AutoplayBackground` рендерит нативный `<video>` (webm+mp4, +480p mobile) при наличии лупа, иначе **fallback на Vimeo/YT**. Контракт манифеста: `{kind:"loop", loop:{webm,mp4}, loopMobile?, ...}`, пути root-относительные.
- [x] **K1. Пайплайн `scripts/make-loops.ts`.** `npx tsx scripts/make-loops.ts <file|dir> [--mobile] [--player] [--slug s]`. Сегмент ~7с → ≤800px → `-an` → VP9 + H.264. Идемпотентный кэш `.cache/loops.json`. Мёрж в манифест.
- [x] **K3. Прогон — 8 работ** (Delta + bolt-caromatherapy, highsnobiety-x-jameson, tele-2, tommy-lotto, victorinox, bolt-whatever-you-do, yale-smart-locks). Вес 76–706 КБ/файл.
- [x] **K5. Delta-плеер** 9.7 МБ → `player.mp4` (мастер удалён из репо, восстанавливается из `git show ce97a23:…`).
- [x] **K7. Фикс YouTube-бот-стенки + качество (2026-06-19).** YouTube вешал «Sign in to confirm you're not a bot» на фоновые autoplay-iframe в гриде (3 работы: adidas, bolt-interview, tommy-cash). Решение — самохостинг лупов и для них: исходники скачаны `yt-dlp --cookies-from-browser chrome` (стенка бьёт и по yt-dlp, куки обходят), нарезаны как у остальных. В гриде **0 сторонних iframe** → стенка невозможна. `adidas` (30с) — полный `player.mp4`, карточка ушла с YT совсем; `bolt-interview` (9:42) и `tommy-cash` (3:20) — луп в гриде, YouTube остаётся только на карточке по клику (могут показать стенку по тапу — допустимо). **Качество:** все лупы перекодированы 800→**1200px** (retina 2-up плитки были мыльными), CRF webm 32→30 / mp4 26→24; тяжёлые delta/tommy-cash поджаты (seg 5с, webm CRF 36).
- [ ] **K2/K3-добор.** `lascana`, `bmw-f74` — докачать с Vimeo (мастера в `~/Downloads/loop-masters/`, имя = slug, я разложу).
- [ ] **K6. Замеры/QA:** вес `/` до/после, число сторонних запросов, mobile, CLS=0, Lighthouse.

### [x] Фаза 1.6. Безопасность / hardening
Аудит 2026-06-18: 🟢 уязвимостей нет (статика, нет API/форм/`.env`/XSS). Укрепление сделано:
- [x] **S1.** Security-заголовки + CSP в `next.config.ts` (`frame-src` разрешает youtube-nocookie/vimeo).
- [x] **S2.** Валидация mp4-URL в `video/parse.ts` (только `https://` / `/…`).
- [~] **S3.** `npm audit` — 2 moderate (postcss, транзитивно через next, build-time, риск ≈0). ⚠️ `npm audit fix --force` НЕ запускать (откатит next до v9). Чинится обновлением Next.

### [ ] Фаза 2. Редактирование без разработчика (Keystatic, GitHub-mode)
Виктория сама управляет контентом, без БД. Поверх тех же файлов/путей: поменять внутренности `lib/works.ts` на `createReader()` (публичный API тот же), CRUD работ, загрузка кадров через пайплайн, bio/клиенты/контакты, auth = GitHub OAuth.
⚠️ Проверить Keystatic на точной версии Next 16.x перед стартом (доки отстают).

---

## Хендофф / гочи

- **Workspace:** `~/Project Виктория`. Запуск: `npm run dev`. Репо: `mcpirita/project-viktoria` (private).
- **⚠️ Деплой-ловушка Vercel:** коммитить ТОЛЬКО с `user.email = gubi.dima@gmail.com` (привязан к GitHub), иначе деплой блокируется (статус UNKNOWN, прод не обновляется).
- **Импорт фото:** `npx tsx scripts/import-media.ts <dir>` (перезаписывает манифест из дерева) ИЛИ `import-use-this.ts` (мёржит — безопаснее для точечного добавления).
- **Лупы:** `npx tsx scripts/make-loops.ts ~/Downloads/loop-masters/<slug>.mp4 --slug <slug> --mobile`.
- **После правок `index.json` нужен рестарт `next dev`** (контент читается через fs, hot-reload не ловит).
- **Next 16:** `new Date()` в серверном компоненте падает при пререндере (Cache Components) — год в футере захардкожен `© 2026`; для живого нужен клиентский остров.
- **Вес репо:** `public/works` ≈ 90+ МБ. При росте — дропнуть тир 400/2000 (`WIDTHS` в `import-media.ts` + перепрогон).
