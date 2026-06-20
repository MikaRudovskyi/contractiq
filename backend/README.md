# ContractIQ.Api — Backend (C# / .NET Web API)

REST API на C# (.NET 9, ASP.NET Core) з PostgreSQL для системи ContractIQ. Реалізує ту саму модель даних, що й React-фронтенд: підрядники, договори, акти виконаних робіт, документи, виплати.

## Що потрібно встановити (одноразово)

1. **.NET 9 SDK** — https://dotnet.microsoft.com/download/dotnet/9.0
   Перевірка після встановлення: `dotnet --version` (має показати 9.x)
2. **PostgreSQL** — або локально (https://www.postgresql.org/download/), або через Docker (рекомендовано, простіше).
3. **Docker Desktop** (опціонально, але зручно) — https://www.docker.com/products/docker-desktop

## Крок 1 — Запустити базу даних

Якщо є Docker:
```
cd ContractIQ.Api
docker compose up -d
```
Це піднімає PostgreSQL на `localhost:5432` з базою `contractiq` (логін `postgres` / пароль `postgres`).

Якщо ставиш PostgreSQL без Docker — створи базу даних `contractiq` і поправ рядок підключення в `appsettings.json` (поле `ConnectionStrings:DefaultConnection`) під свої логін/пароль.

## Крок 2 — Встановити інструмент міграцій EF Core (одноразово)

```
dotnet tool install --global dotnet-ef
```

## Крок 3 — Створити і застосувати міграцію бази даних

```
cd ContractIQ.Api
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Якщо хочеш, можеш пропустити `dotnet ef database update` — застосунок сам застосує міграції та засіє тестові дані при старті (це налаштовано в `Program.cs` через `db.Database.Migrate()`).

## Крок 4 — Запустити API

```
dotnet run
```

Після старту:
- Swagger UI (документація і ручне тестування API): **http://localhost:5080/swagger**
- API доступний на: **http://localhost:5080/api/...**

## Тестові облікові записи (створюються автоматично при першому старті)

| Email | Пароль | Роль |
|---|---|---|
| `o.kovalchuk@buildpro.ua` | `Demo12345!` | Manager |
| `v.melnyk@buildpro.ua` | `Demo12345!` | Finance |
| `admin@buildpro.ua` | `Admin12345!` | Admin |

Спочатку зроби `POST /api/auth/login` з email+паролем — отримаєш JWT-токен. Далі цей токен передавай у заголовку `Authorization: Bearer <токен>` для всіх інших запитів (у Swagger є кнопка "Authorize" для цього).

## Підключення React-фронтенду до цього backend

У фронтенд-проєкті (`ContractIQ` з папки frontend) потрібно:
1. Замінити імпорти з `services/mockData.ts` на реальні HTTP-запити (через `fetch` або `axios`) на `http://localhost:5080/api/...`.
2. Зберігати отриманий JWT-токен (наприклад, у React-стейті або контексті) і додавати його в заголовок кожного запиту.

Якщо хочеш — можу одразу написати шар `apiClient.ts` у фронтенді, який замінить мок-дані на справжні запити до цього API.

## Основні ендпоінти

| Метод | Шлях | Опис |
|---|---|---|
| POST | `/api/auth/login` | Логін, отримання JWT |
| GET | `/api/contractors` | Список підрядників (фільтри: search, status, category) |
| POST | `/api/contractors` | Створити підрядника |
| PATCH | `/api/contractors/{id}` | Оновити підрядника |
| GET | `/api/contracts` | Список договорів |
| POST | `/api/contracts` | Створити договір |
| PATCH | `/api/contracts/{id}` | Оновити статус/умови договору |
| GET | `/api/work-orders` | Список актів робіт |
| POST | `/api/work-orders` | Подати акт |
| POST | `/api/work-orders/{id}/review` | Прийняти/відхилити акт (автоматично створює виплату при прийнятті) |
| GET | `/api/payments` | Список виплат |
| PATCH | `/api/payments/{id}/status` | Змінити статус виплати |
| GET | `/api/documents` | Реєстр документів |
| POST | `/api/documents/upload` | Завантажити файл документа (multipart/form-data) — зберігає файл на диску і створює запис у БД |
| GET | `/api/documents/{id}/download` | Скачати файл документа |
| POST | `/api/documents/{id}/review` | Затвердити/відхилити документ |
| GET | `/api/dashboard/stats` | Агреговані показники для дашборду |
| GET | `/api/dashboard/payments-chart` | Дані для графіка виплат |
| GET | `/api/dashboard/activity` | Останні дії (журнал) |

## Структура проєкту

```
ContractIQ.Api/
├── Controllers/      — REST-ендпоінти (по одному контролеру на сутність)
├── Models/           — EF Core entity-класи (таблиці БД)
├── DTOs/             — об'єкти запитів/відповідей API (не світимо EF-моделі напряму)
├── Data/             — DbContext, конфігурація моделі, сідер тестових даних
├── Services/         — JWT-генерація, логування активності
├── Program.cs        — точка входу, конфігурація DI/auth/CORS/Swagger
└── appsettings.json  — рядок підключення до БД, налаштування JWT
```

## Важливі бізнес-правила, реалізовані на backend

- **Договір не можна активувати**, якщо у підрядника протермінована ліцензія або страховка (перевірка в `ContractsController.Update`).
- **Договір можна створити лише з активним підрядником** (`ContractsController.Create`).
- **Прийняття акту виконаних робіт автоматично створює запис виплати** і перевіряє, що сума акту не перевищує залишок бюджету договору (`WorkOrdersController.Review`).
- **Відхилення акту вимагає коментаря** мінімум 10 символів — це усуває одну з точок тертя, описаних в архітектурному документі.
- Прострочені виплати та протерміновані документи **позначаються автоматично** при кожному читанні списку (в продакшені це варто перенести у фоновий job, наприклад через `IHostedService` або Hangfire).

## Зберігання файлів документів

Файли документів (ліцензії, страховки, акти тощо) зберігаються **на диску сервера**, у папці:

```
ContractIQ.Api/App_Data/documents/{рік}/{місяць}/{унікальне-ім'я}.{розширення}
```

Папка `App_Data` створюється автоматично при першому завантаженні файлу — нічого додатково налаштовувати не потрібно.

**Дозволені формати:** PDF, Word (.doc/.docx), Excel (.xls/.xlsx), зображення (.jpg/.jpeg/.png), .zip
**Максимальний розмір файлу:** 25 МБ

Якщо хочеш зберігати файли в іншому місці (наприклад, на окремому диску чи мережевій папці), познач шлях у `appsettings.json`:

```json
"FileStorage": {
  "RootPath": "D:\\ContractIQ-Files"
}
```

Якщо залишити `RootPath` порожнім (як за замовчуванням) — файли зберігаються всередині папки проєкту, у `App_Data/documents`.

**Важливо:** папка `App_Data` додана в `.gitignore` — файли документів не потраплять у git-репозиторій. Для production-розгортання подбай про резервне копіювання цієї папки окремо від бази даних.

## Якщо потрібно перейти на .NET 10

Проєкт написано під .NET 9 (поточна стабільна довгострокова підтримка на момент написання). Якщо у тебе встановлено .NET 10 — достатньо змінити `<TargetFramework>net9.0</TargetFramework>` на `net10.0` у файлі `ContractIQ.Api.csproj`, решта коду сумісна без змін.
