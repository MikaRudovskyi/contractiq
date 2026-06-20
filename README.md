# ContractIQ

A SaaS platform for managing contractors and subcontractors in construction and engineering companies. An end-to-end cycle — *Contractor → Contract → Work Order → Payment* — with built-in tracking of documents (licenses, insurance) and their expiry dates.

The full architecture document (information architecture, user flows, screen map, MVP→V1→V2 prioritization) is available in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

🇺🇦 *Українську версію цього README дивись нижче.*

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, React Router, Recharts |
| Backend | C# / .NET 9, ASP.NET Core Web API, Entity Framework Core |
| Database | PostgreSQL |
| Auth | JWT, role-based access (Admin / Manager / Finance / Viewer) |
| File storage | Local server-side storage (contractor documents) |

## Repository Structure
contractiq/

├── frontend/          — React application (UI)

├── backend/           — ASP.NET Core Web API

└── ARCHITECTURE.md    — project architecture canvas

## Quick Start

Detailed setup instructions are in each part's README:
- [`backend/README.md`](./backend/README.md) — running the API, database setup, test accounts
- [`frontend/README.md`](./frontend/README.md) — running the UI, connecting to the API

In short, two steps:

```bash
cd backend
docker compose up -d
dotnet ef database update
dotnet run

cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with a test account (`o.kovalchuk@buildpro.ua` / `Demo12345!`).

## Core Features

- **Contractors** — registry with categories, ratings, statuses (active/suspended/blacklisted)
- **Contracts** — payment types (fixed/milestone/time-and-materials), completion progress
- **Work Orders** — kanban-style approval flow; acceptance automatically schedules a payment
- **Payments** — registry with overdue tracking, role-restricted status changes (Finance/Admin)
- **Documents** — real server-side file storage, expiry tracking, automatic flagging of expired documents
- **Dashboard & Analytics** — aggregated KPIs, payment charts, spend breakdown by category

## Business Rules Enforced on the Backend (not just in the UI)

- A contract cannot be activated if the contractor has an expired license or insurance
- A contract can only be created for a contractor with an "Active" status
- Accepting a work order automatically checks that the amount doesn't exceed the contract's remaining budget, and schedules the corresponding payment
- Rejecting a work order requires a mandatory comment explaining the reason

---

# ContractIQ (Українська версія)

SaaS-платформа для управління підрядниками та субпідрядниками в будівельних і інжинірингових компаніях. Наскрізний цикл «Підрядник → Договір → Акт виконаних робіт → Виплата» з контролем документів (ліцензій, страховок) та їх термінів дії.

Повний архітектурний документ (інформаційна архітектура, користувацькі потоки, карта екранів, пріоритизація MVP→V1→V2) — у [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Стек

| Шар | Технології |
|---|---|
| Frontend | React, TypeScript, React Router, Recharts |
| Backend | C# / .NET 9, ASP.NET Core Web API, Entity Framework Core |
| База даних | PostgreSQL |
| Авторизація | JWT, рольовий доступ (Admin / Manager / Finance / Viewer) |
| Файлове сховище | Локальне зберігання на диску сервера (документи підрядників) |

## Структура репозиторію
contractiq/

├── frontend/          — React-застосунок (інтерфейс)

├── backend/           — ASP.NET Core Web API

└── ARCHITECTURE.md    — архітектурний canvas проєкту

## Швидкий старт

Детальні інструкції — в README кожної частини:
- [`backend/README.md`](./backend/README.md) — запуск API, налаштування бази даних, тестові акаунти
- [`frontend/README.md`](./frontend/README.md) — запуск інтерфейсу, підключення до API

Стисло, у два кроки:

```bash
cd backend
docker compose up -d
dotnet ef database update
dotnet run

cd frontend
npm install
npm run dev
```

Відкрий `http://localhost:5173`, увійди тестовим акаунтом (`o.kovalchuk@buildpro.ua` / `Demo12345!`).

## Основний функціонал

- **Підрядники** — реєстр з категоріями, рейтингом, статусами (активний/призупинено/заблоковано)
- **Договори** — типи оплати (фіксована/по етапах/час-і-матеріали), прогрес виконання
- **Акти виконаних робіт** — канбан-процес підтвердження; прийняття автоматично створює виплату
- **Виплати** — реєстр з контролем прострочень, рольове обмеження на зміну статусу (Finance/Admin)
- **Документи** — реальне зберігання файлів на сервері, контроль терміну дії, автоматичне позначення протермінованих
- **Дашборд та аналітика** — агреговані показники, графік виплат, розподіл витрат за категоріями

## Бізнес-правила, реалізовані на backend (не лише в інтерфейсі)

- Договір не можна активувати, якщо в підрядника протермінована ліцензія чи страхування
- Договір можна створити лише з підрядником у статусі «Активний»
- Прийняття акту автоматично перевіряє, що сума не перевищує залишок бюджету договору, і створює відповідну виплату
- Відхилення акту вимагає обов'язкового коментаря з причиною
