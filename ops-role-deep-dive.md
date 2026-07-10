# Ops Role — Deep Dive

> Детальное описание работы Ops для оценки объёма и capacity. После понимания этой роли — подключаем DE Sales, UK Sales, Tenders.
> 2026-04-28

---

## Содержание

- [Кто такой Ops и кто им быть может](#кто-такой-ops-и-кто-им-быть-может)
- [Что Ops производит — главный output](#что-ops-производит--главный-output)
- [Setup phase — первые 14 дней по дням](#setup-phase--первые-14-дней-по-дням)
- [Дневная рутина: time-by-time](#дневная-рутина-time-by-time)
- [Производство одного Dossier — пошагово](#производство-одного-dossier--пошагово)
- [Capacity calculation — сколько Dossier'ов в день реалистично](#capacity-calculation--сколько-dossierов-в-день-реалистично)
- [Quality control — как мерить качество Dossier](#quality-control--как-мерить-качество-dossier)
- [Ramp-up curve: Week 1 → Week 12](#ramp-up-curve-week-1--week-12)
- [Бутылочные горлышки и риски](#бутылочные-горлышки-и-риски)
- [Когда Ops становится перегруженным — triggers для расширения](#когда-ops-становится-перегруженным--triggers-для-расширения)
- [KPI Ops — еженедельный дашборд](#kpi-ops--еженедельный-дашборд)
- [Артефакты Ops — что должно быть в Notion/Drive](#артефакты-ops--что-должно-быть-в-notiondrive)

---

## Кто такой Ops и кто им быть может

### Профиль человека

Ops — это **Research Operations Specialist + Sales Engineer**. Не Marketing Manager, не «помощник по операционке», не junior assistant.

**Минимально необходимые навыки:**

| Навык | Уровень | Зачем |
|---|---|---|
| **Английский** | C1+ | Шаблоны, AI promptовка, UK research |
| **Немецкий** | B2+ | DE-источники, чтение пресс-релизов, понимание контекста |
| **Excel/Sheets** | продвинутый | Триггер-таблицы, dashboard, formula-based filtering |
| **CRM** (любая) | базовая логика | Pipedrive/HubSpot pipeline mgmt |
| **Web scraping basics** | желательно | Browse.ai, n8n, Zapier — без code |
| **AI prompting** | критично | Claude/GPT для Dossier generation |
| **Структурное мышление** | критично | Чёткие шаблоны, repeatable процессы |
| **Внимание к деталям** | критично | Ошибки в Dossier = проигранные сделки |
| **Industry domain knowledge** | bonus | Знание архитектуры/девелопмента ускоряет |

**Анти-паттерны (кого НЕ брать):**
- Sales-человека, который «может попутно». Ops требует фокуса 100% времени.
- Junior без опыта B2B-process. Кривая обучения слишком крутая.
- Творческого человека без operational discipline. Будет «креативить» вместо стандартизации.

**Идеальный кандидат:**
- 2–4 года опыта в B2B SDR/BDR/Sales Ops
- Опыт работы с CRM и automation tools
- Понимание B2B-процесса в любой industry
- Любит data + structure
- Можно junior, если есть menter и 2 недели обучения

### Engagement model

- Full-time или 4 дня в неделю minimum
- Не разделять с другими функциями (нельзя «Ops + content», получится 0 + 0)
- Salary range Berlin: €3.5–5.5к/мес gross для middle-level или €25–35/час contractor
- KPI-bonus: €200–500/мес за достижение Dossier quality + capacity targets

---

## Что Ops производит — главный output

### Основной артефакт: Dossier

Один Dossier = 1–2 страницы A4, на одного prospect, со всем что нужно Sales для звонка + email.

**Структура Dossier (10 секций):**

1. Company snapshot
2. Key decision-makers
3. Active project (триггер)
4. Visual gap analysis
5. Why us — relevant evidence (3 cases + testimonial)
6. Phone script (talk track)
7. Voicemail script
8. Post-call email template
9. Research sources
10. Priority + notes

Полный шаблон → в `sales-execution-plan.md`.

### Вторичные артефакты

- **Proposal'ы** (после meeting'ов от Sales) — 1 proposal на каждую запрос Sales
- **Weekly KPI report** для Founder
- **Updated trigger sources list** (постоянное улучшение)
- **Quality feedback loop** с Sales (что работает / что нет)

---

## Setup phase — первые 14 дней по дням

### Week 1 — Tools & Infrastructure

#### Day 1 (Понедельник)
**Тема: CRM + Email infrastructure**
- [ ] 09:00–11:00 — Pipedrive account setup
  - Создать pipeline stages (9 stages — см. sales-execution-plan.md)
  - Создать custom fields (12 fields)
  - Настроить teams: Ops / DE Sales / UK Sales / Founder
- [ ] 11:00–13:00 — Email infrastructure
  - Регистрация поддомена `team.2mb.studio`
  - Настройка DKIM, SPF, DMARC
  - Создание 6 inbox'ов (по 2 на каждого Sales + Ops)
- [ ] 14:00–17:00 — Email warm-up запуск
  - Smartlead account
  - Подключение всех 6 inbox'ов
  - **Запуск warm-up на 14 дней** (это критично, иначе всё outbound через email сдвигается)

**Output Day 1:** CRM пустой но настроенный + email warm-up идёт

#### Day 2 (Вторник)
**Тема: Phone + Calendar**
- [ ] 09:00–11:00 — Aircall setup
  - DE local mobile number
  - DE landline
  - UK local mobile number
  - UK landline
  - Recording + auto-transcription включить
  - Интеграция с Pipedrive
- [ ] 11:00–13:00 — Calendly Pro
  - 3 meeting types на каждого Sales (Discovery 20m, Deep dive 45m, Creative review 60m)
  - Buffer 15 мин до/после
  - Auto-add to CRM
  - Routing rules (DE leads → DE Sales, UK leads → UK Sales)
- [ ] 14:00–17:00 — LinkedIn Sales Navigator
  - 3 seats (Ops, DE Sales, UK Sales)
  - Создать saved searches:
    - DACH residential dev (5 фильтров)
    - DACH luxury villa (5 фильтров)
    - DACH architects (3 фильтра)
    - UK residential dev (5 фильтров)
    - UK luxury / BTR (5 фильтров)

**Output Day 2:** Phone + calendar + LI готовы

#### Day 3 (Среда)
**Тема: Enrichment & Data tools**
- [ ] 09:00–11:00 — Apollo.io
  - Account + API key
  - Подключение к LinkedIn для enrichment
  - Test 10 enrichments на pilot-prospects
- [ ] 11:00–13:00 — Browse.ai
  - Создание шаблона для аудита проектной страницы:
    - Извлечь количество визуализаций
    - Дату последнего обновления
    - Тип контента (rendering / floor plan / animation / 360)
    - Качество (по разрешению)
- [ ] 14:00–17:00 — News + RSS monitoring
  - Google Alerts на топ-30 DACH companies + топ-30 UK companies
  - RSS readers (Feedly Pro): competitionline, immobilienmanager, propertyweek, etc.
  - Slack notifications channel для new triggers

**Output Day 3:** Enrichment + monitoring готовы

#### Day 4 (Четверг)
**Тема: AI infrastructure**
- [ ] 09:00–11:00 — Claude API account (Anthropic) или OpenAI
  - API key, billing setup
  - Test prompts для Dossier generation
- [ ] 11:00–13:00 — Vector database
  - Qdrant self-hosted (или Pinecone free tier)
  - Schema для cases: id, name, scale, type, style, region, year, embedding
- [ ] 14:00–17:00 — Embed все 49 cases
  - Извлечь данные из `_data/cases-en.json` (уже есть в репозитории!)
  - Generate embeddings (OpenAI text-embedding-3-small)
  - Загрузить в Qdrant
  - Test semantic search: «65 unit residential modern facade Berlin» → должно вернуть top 3 релевантных

**Output Day 4:** AI + vector DB готовы, 49 cases embedded

#### Day 5 (Пятница)
**Тема: Workflow automation**
- [ ] 09:00–13:00 — n8n setup (или Make.com / Zapier)
  - Workflow 1: New trigger → CRM record → enrichment chain
  - Workflow 2: Enrichment complete → AI Dossier draft → notification к Ops
  - Workflow 3: Ops approve Dossier → handoff Sales + email notification
- [ ] 14:00–17:00 — Smartlead templates
  - 5 post-call email templates (DE)
  - 5 post-call email templates (EN)
  - Подключение к Pipedrive (logging activities)

**Output Day 5:** End-to-end automation pipeline собран

### Week 2 — Pilot & Calibration

#### Day 6–7 (Понедельник–Вторник)
**Тема: Pilot — 5 manual Dossier'ов**
- [ ] Выбрать 5 реальных DACH-prospects с public триггерами (легко найти на competitionline + immobilienmanager)
- [ ] **Сделать 5 Dossier'ов вручную, без AI** — чтобы понять:
  - Какие данные критичны
  - Какие источники работают
  - Какая структура удобна Sales
- [ ] Каждый Dossier ~60–90 мин manual research
- [ ] Total: 7–10 часов на 5 Dossier'ов

**Output Day 6–7:** 5 baseline Dossier'ов как образец качества

#### Day 8 (Среда)
**Тема: AI prompt calibration**
- [ ] 09:00–13:00 — Создание prompts для AI Dossier generation
  - Master prompt (full Dossier)
  - Sub-prompts (по секциям: company snapshot, gap analysis, phone script)
  - Example-based prompting (few-shot с 3 manual Dossier'ами)
- [ ] 14:00–17:00 — Test AI generation
  - Прогнать те же 5 prospects через AI pipeline
  - Сравнить с manual-baseline
  - Найти gaps: что AI не схватывает

**Output Day 8:** AI pipeline даёт 70–80% качества vs manual

#### Day 9–10 (Четверг–Пятница)
**Тема: Iteration + готовность к scaling**
- [ ] Doработать prompts на основе тестов
- [ ] Создать **Dossier Quality Checklist** (что Ops проверяет в каждом AI-draft):
  - Company snapshot factually correct? ✓
  - Decision-maker правильно identified? ✓
  - Trigger accurate (с датой)? ✓
  - Visual gap analysis based on real screenshots? ✓
  - Top 3 cases действительно релевантны? ✓
  - Phone script звучит professional, не AI-generated? ✓
  - Email tone matches? ✓
- [ ] Test full pipeline на 5 новых prospects → измерить time-to-Dossier

**Target Day 10:** Time-to-Dossier <30 минут (с AI), готовность к Week 3 production

### Week 2 buffer days

День 11–14 — buffer для починки того, что не сработало в setup:
- Email deliverability проверка (warm-up прогресс)
- AI prompt refinement
- CRM workflow debugging
- Дополнительные интеграции если нужно

**К концу Week 2:** Ops готов производить 5–8 Dossier'ов/день в Week 3.

---

## Дневная рутина: time-by-time

### Стандартный рабочий день Ops (Week 5+, mature mode)

| Время | Задача | Длит. |
|---|---|---|
| **08:30** | Inbox check (Slack notifications + email overnight) | 15 мин |
| **08:45** | Trigger scan: Feedly + LinkedIn Sales Nav alerts + Google Alerts | 45 мин |
| **09:30** | Standup с DE Sales + UK Sales (15 мин) | 15 мин |
| **09:45** | **Triage**: 25–30 candidate triggers → выбор 12–15 для Dossier | 30 мин |
| **10:15** | Запуск AI auto-research pipeline (10 prospects параллельно) | 5 мин launch + 25 мин wait |
| **10:45** | **Dossier review batch 1** (5 Dossier'ов × 18 мин) | 90 мин |
| **12:15** | Lunch | 45 мин |
| **13:00** | **Dossier review batch 2** (5 Dossier'ов × 18 мин) | 90 мин |
| **14:30** | Handoff в CRM + уведомления Sales | 15 мин |
| **14:45** | Inbound processing (web form, Calendly, ad replies) | 30 мин |
| **15:15** | **Proposal generation** (1–2 proposal'а от Sales requests) | 90 мин |
| **16:45** | KPI dashboard update + log | 15 мин |
| **17:00** | Trigger sources improvement + new sources research | 30 мин |
| **17:30** | End of day |

**Total productive time: ~8 часов**
**Output:** 10 Dossier'ов + 1–2 proposals + admin

### Flex-day variations

**Понедельник** (heavy planning):
- +30 мин на weekly trigger review
- +30 мин на dashboard для пятничного review
- −1 Dossier батч

**Пятница** (review day):
- 16:00–17:00 — pipeline review meeting с Founder
- −2 Dossier'а в производстве

**Когда proposals накапливаются** (после первых meeting'ов):
- 2 proposals в день блокируют 1 Dossier-batch
- Решение: либо Ops жертвует objem Dossier'ов, либо attaches proposal generation на end-of-day

---

## Производство одного Dossier — пошагово

### Полный workflow от триггера до handoff

#### Шаг 1: Triage (3 мин) — manual
**Решение: делать Dossier или нет?**

Quick checklist:
- [ ] Триггер verified (есть public-источник, не слух)
- [ ] Company size в ICP-диапазоне (10–500 employees)
- [ ] Есть проект с конкретными датами / scale
- [ ] Нет recent contact в CRM (не повторяемся)

Если 4/4 → продолжаем. Если <4 → отбрасываем.

#### Шаг 2: Auto-enrichment (5 мин wait — параллелизуется)

Запускается через n8n workflow:

```
Input: company name + project name + URL
  ↓
[Apollo.io API] → contacts (3–5 decision-makers с email/phone/LinkedIn)
  ↓
[PhantomBuster] → primary contact LinkedIn profile (last activity)
  ↓
[Browse.ai] → project page audit (current visualizations)
  ↓
[NewsAPI] → press releases last 90 days
  ↓
[Wayback API] → project page history
  ↓
Output: JSON bundle со всеми данными
```

#### Шаг 3: AI Dossier generation (3 мин — auto)

Claude API call с master prompt:

```
Input: 
- Enrichment JSON
- ICP definition for этого сегмента
- 49 case database (vector)
- Reference: 5 baseline Dossier'ов (few-shot)

Output:
- Sections 1–5 (company, contacts, project, gap, evidence)
- Phone script draft (Section 6)
- VM script draft (Section 7)
- Email template draft (Section 8)
```

#### Шаг 4: Case matching (30 сек — auto)

```
Input: project description (scale, type, style, region)
  ↓
[Embedding generation OpenAI]
  ↓
[Qdrant semantic search top-5]
  ↓
[Re-rank by metadata match]
  ↓
Output: top 3 cases с обоснованием релевантности
```

#### Шаг 5: Human review (15 мин) — Ops

**Quality checklist** (см. выше):
- Company snapshot — 2 мин
- Decision-maker verification (LinkedIn URL → клик → проверка) — 2 мин
- Trigger date verification — 1 мин
- Visual gap analysis (открыть проектную страницу, проверить скриншоты) — 4 мин
- Top 3 cases — действительно релевантны? — 2 мин
- Phone script — звучит professional? — 2 мин
- Email tone — match? — 1 мин
- Set priority A/B/C — 30 сек
- Push notification к Sales — 30 сек

#### Шаг 6: Handoff (1 мин) — Ops

- Pipedrive: stage `Dossier Ready`
- Assign к DE Sales или UK Sales
- Slack notification: «New Dossier ready: [Company] / [Project] — Priority [A/B/C]»

### Time per Dossier (mature mode):

| Шаг | Time |
|---|---|
| Triage | 3 мин |
| Auto-enrichment wait | 5 мин (параллелизуется) |
| AI generation | 3 мин (параллелизуется) |
| Case matching | 30 сек (параллелизуется) |
| Human review | 15 мин |
| Handoff | 1 мин |
| **Total active human time** | **~20 мин** |
| **Total wall clock time** | **~25 мин** |

Параллелизация позволяет запускать 5–10 Dossier'ов в pipeline одновременно. Human review — последовательный, это и есть боттлнек capacity.

---

## Capacity calculation — сколько Dossier'ов в день реалистично

### Math

Working day: 8 productive hours = 480 minutes
Fixed overhead (standup, lunch, trigger scan, inbound, admin): ~3 часа = 180 minutes
**Available for Dossier production:** 5 hours = 300 minutes

При 20 минут активного времени на Dossier: **15 Dossier'ов теоретический максимум**

Реалистично с учётом:
- Context switching между задачами
- Вопросы от Sales по Dossier'ам
- Inbound нагрузка
- Иногда более сложные Dossier'ы (40 мин, не 20)
- Proposals (отдельный блок 60–120 мин/день)

**Реалистичный target по неделям:**

| Период | Dossier/день | Dossier/неделя | Mode |
|---|---|---|---|
| **Week 1–2** | 2–3 | 10–15 | Setup mode, manual baseline |
| **Week 3–4** | 5–7 | 25–35 | AI calibrating |
| **Week 5–6** | 7–10 | 35–50 | AI mature, calibration done |
| **Week 7–8** | 10–12 | 50–60 | Optimized |
| **Week 9–12** | 12–15 | 60–75 | Mature production |
| **Beyond Week 12** | 15+ | 75+ | Need 2nd Ops or junior researcher |

### Capacity vs Sales demand

Один Sales-человек может реально обработать **75–100 outbound attempts в неделю** (calls + emails + LinkedIn).

Если Ops готовит 60 Dossier'ов в неделю на 2 Sales человек = 30 на каждого = достаточно для **75 outbound attempts** (каждый Dossier обычно генерирует 2–3 touches).

**Bottleneck inversion:** в Week 5–8, Ops может производить больше, чем Sales может обработать. Это норма — лучше иметь backlog quality Dossier'ов, чем простаивающий Sales.

### Distribution between DE and UK

Default split:
- 60% Dossier'ов → DE Sales (DACH рынок, phone-first, более ёмкий)
- 40% Dossier'ов → UK Sales (UK рынок, email-first hybrid)

Может меняться based on conversion data в Week 4 review.

---

## Quality control — как мерить качество Dossier

### Daily quality check (Ops self-review)

Перед handoff'ом — internal checklist (6 пунктов):
- [ ] Все факты verified (никакой выдумки от AI)
- [ ] Decision-maker актуальный (LinkedIn проверен)
- [ ] Триггер с датой
- [ ] Visual gap основан на realных скринах, не общих фразах
- [ ] Phone script natural sounding, не «AI-bot»
- [ ] Cases действительно похожи на их проект

Если 6/6 ✓ → ship. Если <6 → доработка.

### Weekly quality feedback от Sales

Sales оценивает каждый Dossier по 5-балльной шкале сразу после звонка:
- Точность данных (1–5)
- Полезность phone script (1–5)
- Релевантность cases (1–5)
- Helpfulness в целом (1–5)

В Pipedrive custom field `dossier_quality_score` (avg 4 показателей).

**Target average:** 4.0+ через 4 недели, 4.5+ через 8 недель.

### Failure modes — что чинить если score падает

| Симптом | Root cause | Fix |
|---|---|---|
| «Wrong decision-maker» | Apollo data outdated | Manual LinkedIn double-check |
| «Visual gap analysis generic» | Browse.ai не достал данные | Improve scraping selectors |
| «Phone script sounds AI» | Prompt слишком generic | Few-shot с лучшими manual Dossier'ами |
| «Cases not relevant» | Vector search overfits | Re-tag cases, refine embeddings |
| «Triggers from 6 months ago» | RSS не отфильтровал по дате | Add date filter в trigger logic |

---

## Ramp-up curve: Week 1 → Week 12

| Неделя | Mode | Capacity | Activities |
|---|---|---|---|
| **1** | Setup | 0 Dossier | Tools install, integrations |
| **2** | Pilot | 2–3/день manual | Calibration, prompt building |
| **3** | Production start | 5–6/день | DE Sales начинает с первыми Dossier'ами |
| **4** | UK launch | 6–8/день | Adding UK pipeline + tenders quals |
| **5** | Full ramp | 8–10/день | Both Sales tracks, proposals start |
| **6** | Optimization | 10–12/день | Process refinement, tooling tweaks |
| **7–8** | Stable production | 10–12/день | Sustainable pace |
| **9–12** | Optimized | 12–15/день | Auto-improvements, less manual time |

### Что НЕ происходит автоматически — должны быть triggers

- В Week 4: review baseline metrics, adjust if pipeline misbalanced
- В Week 8: первый serious quality review с Sales feedback
- В Week 12: capacity check — нужен 2-й researcher или нет

---

## Бутылочные горлышки и риски

### Risk 1: AI prompts не дают consistent quality

**Симптом:** Score 3/5 вместо 4/5, Sales жалуется
**Mitigation:**
- Few-shot prompting с manually-curated примерами
- Sub-prompts вместо master prompt
- Human review на 100% Dossier'ов в первые 8 недель (не 50%)
- A/B test разные prompt versions

### Risk 2: Email warm-up не закончен → all email touches уходят в спам

**Симптом:** 0 reply rate, hard bounces
**Mitigation:** 
- НЕ начинать sending до Day 14 warm-up
- Постепенный ramp-up: 10/день → 20/день → 50/день в течение 2 недель после warm-up
- Monitor sender reputation (GlockApps weekly)

### Risk 3: LinkedIn Sales Navigator account гэт banned за scraping

**Симптом:** Account suspended
**Mitigation:**
- НЕ использовать массовый scraping
- PhantomBuster с conservative limits (50 profiles/день)
- Rotation между accounts если scaling

### Risk 4: Apollo enrichment data outdated → Dossiers содержат wrong contacts

**Симптом:** Sales reaches wrong person, embarrassing
**Mitigation:** 
- Manual LinkedIn check каждого primary contact (3 мин на каждого)
- Apollo refresh каждый месяц
- Backup enrichment через Hunter.io если Apollo failed

### Risk 5: Ops перегорит к Week 6

**Симптом:** Quality падает, Dossier'ов меньше, sick leaves
**Mitigation:**
- Чёткие 8-часовые рабочие дни (не «working until done»)
- 1 «admin Friday» в месяц (catch-up, no new Dossier'ов)
- Bonus за достижение KPI = motivation
- Honest conversation на Week 4 review: всё ок?

### Risk 6: Founder перегружает Ops «попутными» задачами

**Симптом:** Ops занят дизайном слайдов / отвечает на нерелевантные emails
**Mitigation:**
- Чёткое job description (не «универсальный помощник»)
- Все «попутные» запросы → через Founder, который защищает время Ops
- Если не хватает рук на admin → отдельный VA на $500/мес

---

## Когда Ops становится перегруженным — triggers для расширения

| Trigger | Action |
|---|---|
| 3 недели подряд <8 Dossier/день при working full-time | Hire junior researcher (€1.5–2к/мес) |
| Quality score <3.5 средний 2 недели | Audit prompts + workflow + взять week pause |
| Backlog Dossier'ов >40 unprocessed | Pause new triggers, разобраться с backlog |
| Proposal time >120 мин среднее | PandaDoc templates обновить или hire proposal writer |
| Inbound нагрузка >2 часа/день | Перевести inbound на DE Sales или dedicated AE |

---

## KPI Ops — еженедельный дашборд

Google Sheets, обновляется каждую пятницу:

### Section 1: Production volume

| Метрика | Week N | Target |
|---|---|---|
| Dossiers сгенерированных (DE) | 25 | 30 |
| Dossiers сгенерированных (UK) | 15 | 20 |
| Total Dossiers | 40 | 50 |
| Среднее время на Dossier | 22 мин | <20 мин |
| AI auto-pipeline uptime | 95% | 98% |

### Section 2: Quality

| Метрика | Week N | Target |
|---|---|---|
| Avg Dossier quality score (Sales rating) | 4.1/5 | 4.5/5 |
| Dossier rejection rate (sent back to redo) | 5% | <3% |
| Wrong-contact rate | 2% | <1% |
| Cases relevance score | 4.3/5 | 4.5/5 |

### Section 3: Pipeline health

| Метрика | Week N |
|---|---|
| Dossiers в pipeline (`Researching` stage) | 5 |
| Dossiers готовых (`Ready` stage, не взятых Sales) | 8 |
| Dossiers в work (`1st Call` stage) | 32 |
| Конверсия Dossier → Conversation | 35% |
| Конверсия Dossier → Meeting | 12% |

### Section 4: Tools/cost

| Метрика | Week N |
|---|---|
| Apollo enrichments used | 250 / 500 quota |
| Browse.ai pages scraped | 80 / 250 quota |
| Claude API tokens used | 2.1M / no limit |
| Smartlead emails sent | 320 / 5000 quota |
| Total tool cost this month | €720 |

### Section 5: Proposals

| Метрика | Week N |
|---|---|
| Proposals generated | 5 |
| Avg time to proposal | 75 мин |
| Proposals sent → Quote signed conversion | TBD |

---

## Артефакты Ops — что должно быть в Notion/Drive

```
/Ops Workspace/
  ├── 00 — Master playbook
  │   ├── ICP definitions (DE + UK)
  │   ├── Productized packages (3) — DE/EN versions
  │   ├── Phone scripts library (5 DE + 5 UK)
  │   ├── VM scripts library (5 DE + 5 UK)
  │   ├── Email templates library (5 DE + 5 UK)
  │   └── Dossier quality checklist
  │
  ├── 01 — Trigger sources
  │   ├── DACH source list (URLs, RSS, scrapers)
  │   ├── UK source list
  │   ├── LinkedIn Sales Nav saved searches
  │   └── Source improvement log
  │
  ├── 02 — Cases database
  │   ├── 49 cases tagged spreadsheet
  │   ├── Vector embedding pipeline scripts
  │   └── Case PDFs (для attachment в emails)
  │
  ├── 03 — Testimonials database
  │   ├── 10–15 client testimonials с тегами
  │   └── PDF formatting templates
  │
  ├── 04 — AI prompts library
  │   ├── Master Dossier prompt (versioned)
  │   ├── Sub-prompts по секциям
  │   ├── Few-shot examples
  │   └── Prompt testing log
  │
  ├── 05 — Active Dossiers (working folder)
  │   └── [Date]_[Company]_[Project]/
  │       ├── enrichment_data.json
  │       ├── ai_draft.md
  │       ├── final_dossier.pdf
  │       └── handoff_notes.md
  │
  ├── 06 — Proposals library
  │   ├── Proposal template (PandaDoc)
  │   └── Sent proposals archive
  │
  ├── 07 — KPI Dashboard
  │   └── Weekly KPI Google Sheet (auto-updated)
  │
  └── 08 — Process documentation
      ├── Daily checklist
      ├── Weekly checklist
      ├── Monthly review template
      └── Setup playbook (для replacement Ops)
```

---

## Ключевые цифры для понимания

**Минимальный setup:**
- 14 дней до production-ready
- €600–1000/мес на tool stack
- 1 full-time human (Ops)

**Stable production (Week 8+):**
- 50–75 Dossier'ов/неделю
- 5–8 proposals/неделю  
- 8 рабочих часов/день, sustainable
- Quality 4.5/5 average

**Когда нужен 2-й Ops:**
- Sales-команда требует >75 Dossier'ов/неделю стабильно
- Founder хочет добавить 3-ю географию
- Tenders pipeline требует separate research support

**Окупаемость:**
- Если 1 закрытая сделка = €30к (mid-range pre-sales pack)
- Total Ops cost / месяц: salary €4к + tools €800 = €4.8к
- Break-even: 1 сделка / 6 месяцев работы Ops
- Реалистично: 4–8 закрытых сделок / 6 месяцев = ROI 5–10x

---

## Финальная мысль перед стартом

Эта роль — **не junior assistant, а core sales engineer**. Если найдёшь правильного человека, всё остальное (DE Sales, UK Sales, Tenders) встанет на рельсы сами по себе — потому что они получают качественные ингредиенты для работы. Если экономишь на этой роли — рушится вся пирамида.

**Совет:** не запускай DE/UK Sales до Week 3. Дай Ops 14 дней чистого setup'а. Иначе Sales будут сидеть без Dossier'ов и думать, что outbound «не работает».
