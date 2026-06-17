# Site Copy (EN) — single source of truth

> Язык сайта — только английский. Этот файл — единый источник копирайта.
> Мета-комментарии для Дмитрия по-русски, сам копирайт — English only.
> Где факта нет — честный `[PLACEHOLDER: …]`, не выдумка. Каждый плейсхолдер
> = вопрос к Виктории (сводный список в конце файла).
>
> Тон: editorial, сдержанный, без маркетинговой воды. Формат подписи работ —
> `CLIENT, TITLE, PRODUCTION` (как у референса Ranya El-Refaey).

---

## 1. Hero

Имя на экране: **VIKTORIA MARTJANOVA** ✅ (выбрано Викторией, 2026-06-17 —
паспортное написание, совпадает с email/IMDb).

Строка-роль под именем: ✅ **выбран вариант C** (Виктория, 2026-06-17):

> `ART DEPARTMENT — COSTUME, SET, PROPS, PRODUCTION DESIGN`

_(не выбранные: A `ART DEPARTMENT FOR FILM & ADVERTISING`,
B `COSTUME, SET & PRODUCTION DESIGN FOR FILM & ADVERTISING`.)_

---

## 2. Bio

Известно ✅: Tallinn-based; ~10 лет опыта; costume / wardrobe, set design,
props, production design + собственные постановки.
НЕ известно: гражданство/происхождение (опц., по образцу «ANGLO-EGYPTIAN»).

### Short (1–2 sentences)

> VIKTORIA MARTJANOVA IS A TALLINN-BASED ART DEPARTMENT ARTIST WORKING
> ACROSS FILM AND ADVERTISING — COSTUME, SET DESIGN, PROPS AND PRODUCTION
> DESIGN.

### Extended (3–4 sentences)

> VIKTORIA MARTJANOVA IS A TALLINN-BASED ART DEPARTMENT ARTIST WORKING
> ACROSS FILM AND ADVERTISING. WITH OVER A DECADE ON SET, SHE MOVES
> BETWEEN COSTUME AND WARDROBE, SET DESIGN, PROPS AND PRODUCTION DESIGN,
> SHAPING THE LOOK OF A SCENE FROM CONCEPT TO SET. ALONGSIDE COMMISSIONED
> WORK SHE DEVELOPS HER OWN STAGE PRODUCTIONS, BRINGING A DESIGNER'S EYE
> TO EVERY BRIEF.

_(Город Tallinn и «over a decade» (≈10 лет) подставлены ✅. Происхождение
по образцу «ANGLO-EGYPTIAN» — опционально, если Виктория захочет добавить.
Список клиентов в bio не дублирую — он в marquee CLIENTS, блок 5.)_

---

## 3. Work captions

Формат: `CLIENT, TITLE, PRODUCTION`.
Title указан только там, где очевиден из папки. Production неизвестен по всем
10 проектам — плейсхолдер. Title под ❓ в works-list оставлен плейсхолдером
(не выдумываю).

1. `ADIDAS, [PLACEHOLDER: title — уточнить], [PLACEHOLDER: production]`
2. `BMW, [PLACEHOLDER: title — модель F74? уточнить], [PLACEHOLDER: production]`
3. `BOLT, [PLACEHOLDER: title — "Interview"? уточнить], [PLACEHOLDER: production]`
4. `BOLT, WHATEVER YOU'RE DOING, THERE'S A BOLT FOR THAT, [PLACEHOLDER: production]`
5. `DELTA AIR LINES, [PLACEHOLDER: title — уточнить], [PLACEHOLDER: production]` — _✅ бренд = Delta Air Lines_
6. `JAMESON × HIGHSNOBIETY, AROMA, [PLACEHOLDER: production]`
7. `JAMESON × HIGHSNOBIETY, COFFEE, [PLACEHOLDER: production]`
8. `JAMESON × HIGHSNOBIETY, SMOOTH, [PLACEHOLDER: production]`
9. `LASCANA, [PLACEHOLDER: title — уточнить], [PLACEHOLDER: production]`
10. `TELE2, #SCREENFREEHOLIDAYS, [PLACEHOLDER: production]`
11. `TOMMY CASH, EUROVISION, [PLACEHOLDER: production]` — _✅ категория = MUSIC VIDEO (не commercial)_
12. `VICTORINOX, [PLACEHOLDER: title — уточнить], [PLACEHOLDER: production]`

_(Jameson × Highsnobiety — три ролика (Aroma / Coffee / Smooth) разведены в
три подписи; на сайте можно показать как один проект из трёх кадров — решит
вёрстка. Нумерация 1–12 из-за разбивки Jameson; проектов по-прежнему 10.)_

---

## 4. Categories (фильтры в шапке)

Лейблы капсом, в столбик (как у референса).

✅ Набор подтверждён Викторией (2026-06-17), порядок = порядок фильтров в шапке:

| Лейбл (EN) | enum-значение |
|---|---|
| `COMMERCIAL` | `commercial` |
| `MUSIC VIDEO` | `music-video` |
| `EDITORIAL` | `editorial` |
| `FILM` | `film` |
| `THEATER` | `theater` |
| `ART` | `art` |

_(Реализовано в `src/lib/schema.ts` (`CATEGORIES`) и `src/components/site/categories.ts`
(`CATEGORY_LABELS`). На поверхности показываем только те категории, где есть работы
(`getCategories()` возвращает присутствующие). Сейчас наполнена `commercial`;
Tommy Cash уйдёт в `music-video` при добавлении.)_

---

## 5. Header / nav микрокопия

- Имя слева: `VIKTORIA MARTJANOVA`
- Линк справа: `CONTACT`
- Живые часы в шапке (как у референса): формат `13:36:08` — деталь, не текст.
- Лейбл блока клиентов: `CLIENTS:`
- Лейбл сетки работ: `SELECTED WORKS:`
- Маркер фильтра (если нужен «показать всё»): `ALL`

Marquee клиентов (бегущая строка) — заполняется реальными брендами из работ.
Подтверждённые из works-list:

> `ADIDAS · BMW · BOLT · DELTA · JAMESON · HIGHSNOBIETY · LASCANA · TELE2 · TOMMY CASH · VICTORINOX`

_(`[PLACEHOLDER: остальные клиенты — попросить у Виктории полный список
брендов / артистов / продакшенов для marquee]`.)_

---

## 6. Contact-блок

Структура (капсом, как у референса). Все значения — плейсхолдеры, фактов нет.

```
CONTACT

EMAIL        martjanovaviktoria@gmail.com          ✅
INSTAGRAM    @fake.versace.v                       ✅
IMDB         imdb.com/name/nm11979739              ✅
AGENCY       [PLACEHOLDER: агентство + агентский email — есть ли агентство?]
```

_(У референса было `PERSONAL` (личный email) + агентский email + логотип
агентства Vision Artists. Если у Виктории агентства нет — строку AGENCY убрать,
оставить EMAIL / INSTAGRAM / IMDB.)_

---

## 7. About-секция

Связный абзац для страницы/секции About (разворачивает Extended bio выше).
Слева — портрет (`assets/portrait/`), справа — этот текст.

> VIKTORIA MARTJANOVA IS A TALLINN-BASED ART
> DEPARTMENT ARTIST WORKING ACROSS FILM AND ADVERTISING. HER WORK SPANS
> COSTUME AND WARDROBE, SET DESIGN, PROPS AND PRODUCTION DESIGN — SHAPING
> THE LOOK OF A SCENE FROM FIRST CONCEPT TO THE FINISHED SET. SHE ALSO
> WRITES AND STAGES HER OWN PRODUCTIONS, TREATING EVERY PROJECT, COMMERCIAL
> OR PERSONAL, AS A COMPLETE VISUAL WORLD.
>
> SELECTED CLIENTS INCLUDE ADIDAS, BMW, BOLT, JAMESON, LASCANA, TELE2 AND
> VICTORINOX. `[PLACEHOLDER: добить список клиентов от Виктории]`

_(Второй абзац (clients) — по образцу bio референса, который заканчивался
списком клиентов. Можно опустить, если marquee CLIENTS уже несёт эту нагрузку.)_

---

## Сводка PLACEHOLDER — вопросы к Виктории

✅ **Закрыто (2026-06-17):** имя — VIKTORIA MARTJANOVA · город — Tallinn ·
опыт — ~10 лет · роль — вариант C · email — martjanovaviktoria@gmail.com ·
Instagram — @fake.versace.v · IMDb — nm11979739 · категории (6, набор финален) ·
Delta = Delta Air Lines · Tommy Cash/Eurovision = music video · происхождение — не добавляем.

**Осталось (в основном — данные по работам):**

**Работы (по 10 проектам) — ГЛАВНЫЙ блок для фазы H:**
1. Title для: Adidas, BMW (модель F74?), Bolt Interview, Delta, Lascana, Victorinox.
2. Production (продакшн/агентство) — по ВСЕМ 10 проектам.
3. Видео-ссылки (Vimeo/YouTube) — по всем, где хотим показать ролик.

**Мелочи:**
4. Агентство — есть ли? Если да: название + агентский email. (Если нет — строку убираем.)
5. Полный список клиентов/брендов для marquee (сейчас 10 из работ — добить остальными).

**Портрет:**
6. Фото Виктории для секции About → в `assets/portrait/`.

---

**Статус копирайта:** почти готов. Закрыты все факты о Виктории (имя, город, опыт,
роль, контакты, категории). Осталось — данные по работам (titles/production/видео
для фазы H), агентство, полный список клиентов, портрет.
