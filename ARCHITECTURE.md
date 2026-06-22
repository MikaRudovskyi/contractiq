# ContractIQ — Architecture Canvas
 
> SaaS platform for managing contractors and subcontractors in construction and engineering companies.
> Stack: React + TypeScript (frontend) · C# .NET Web API (backend) · PostgreSQL (database)
 
🇺🇦 *Українську версію цього документа дивись нижче.*
 
---
 
## 0. The Problem and the Product
 
General contractors managing 20–100+ subcontractors at once lose control over three things:
1. **Documents** — licenses, insurance, tax certificates expire unnoticed → legal/financial risk.
2. **Work orders** — proof of completed work lives in email/Excel/paper → disputes, payment delays.
3. **Payments** — disconnected from work orders and contracts → overpayments, late payments, loss of contractor trust.
**ContractIQ** is a single system for tracking contractors, contracts, work orders, documents, and payments, with an end-to-end link between them (Contractor → Contract → Work Order → Payment).
 
---
 
## 1. Content Inventory
 
### First-order entities (frequent use, central to the data model)
 
| Entity | Description | Interaction frequency |
|---|---|---|
| **Contractor** | Legal/individual entity performing work: details, contacts, rating, category | Very high |
| **Contract** | Agreement with a contractor: amounts, terms, payment type, project link | Very high |
| **Work Order** | Request to confirm a scope of work within a contract | Very high |
| **Payment** | A financial transaction linked to a contract/work order | High |
 
### Second-order entities (supporting, periodic use)
 
| Entity | Description |
|---|---|
| **Document** | A file (license, insurance, work order, invoice) with an expiry date and review status |
| **Project** | A construction/contract object grouping several contracts |
| **User** | An employee of the client company with a role (admin/manager/finance/viewer) |
| **Tag / Category** | Classification of contractors and contracts (type of work, priority) |
 
### Third-order entities (system-level, rarely accessed directly)
 
| Entity | Description |
|---|---|
| **Activity Log** | An audit trail of status changes — who/when/what |
| **Notification** | Triggers: document expiry, work order deadline, overdue payment |
| **Contract Template** | Reusable sets of contract terms |
 
---
 
## 2. Navigation Hierarchy
 
Section names follow the user's own language (project manager, finance officer), not abstract labels.
 
```
├── Dashboard                       (level 1 — overview)
│
├── Contractors                     (level 1)
│   └── Contractor Card             (level 2)
│       ├── Profile & details       (level 3 — tab)
│       ├── Contractor's contracts  (level 3 — tab)
│       ├── Contractor's documents  (level 3 — tab)
│       └── Payment history         (level 3 — tab)
│
├── Contracts                       (level 1)
│   └── Contract Card               (level 2)
│       ├── Terms & milestones      (tab)
│       ├── Work orders on contract (tab)
│       └── Contract documents      (tab)
│
├── Work Orders                     (level 1 — kanban: Submitted → Review → Accepted/Rejected)
│
├── Payments                        (level 1 — registry + calendar)
│
├── Documents                       (level 1 — cross-cutting registry of all documents, filterable by "expiring soon")
│
├── Analytics                       (level 1 — reports, spend breakdown, ratings)
│
└── Settings                        (level 1)
    ├── Profile & team
    ├── Access roles
    └── Contract templates
```
 
Maximum 3 levels: Section → Object → Tab. No hidden fourth-level submenus.
 
---
 
## 3. Core User Flows
 
### Flow 1 — Onboarding a new contractor (Manager)
1. Dashboard → "Contractors" → "Add Contractor" button.
2. Fill out the form: legal name, tax ID, contact person, work category.
3. Upload required documents (license, insurance) — the system immediately flags missing ones.
4. Save with status "Pending" → automatic notification to the Finance role for review.
5. Finance confirms the documents → status changes to "Active".
### Flow 2 — Creating a contract and linking it to a project (Manager)
1. "Contracts" → "New Contract".
2. Select a contractor (only those with "Active" status — blocked for "Suspended"/"Blacklisted").
3. Choose a payment type: fixed price / time-and-materials / milestone-based.
4. Set the amount, terms, and link to a project.
5. The contract is saved as "Draft" → moved to "Active" once both parties sign.
### Flow 3 — Submitting and approving a work order (Contractor → Manager)
1. The contractor (via a portal, or manually by the manager) submits a work order: description of work, amount, photo evidence.
2. The work order appears in the "Submitted" kanban column.
3. The manager opens the card, checks the attachments, moves it to "Review".
4. Decision: "Accept" → a payment is automatically scheduled; or "Reject" → a mandatory comment explaining the reason, and the work order is returned to the contractor.
### Flow 4 — Processing a payment (Finance)
1. "Payments" → filter by "Scheduled", sorted by date.
2. Finance opens the record, checks the linked work order and invoice.
3. Marks it "Processing" → after the transfer, "Paid" with a date and transaction number.
4. If the due date passes without action, the system automatically marks it "Overdue" and raises a dashboard alert.
### Flow 5 — Monitoring document expiry (Manager/Finance)
1. The dashboard shows an "Expiring Documents" block (≤30 days).
2. Clicking through to "Documents" with the filter pre-applied.
3. The manager contacts the contractor and requests an updated document.
4. Uploading a new version archives the old document; the new one goes through review again.
---
 
## 4. Friction Points
 
| # | Friction moment | Why it happens | Architectural mitigation |
|---|---|---|---|
| 1 | **Creating a contract with a contractor whose documents are out of date** | The manager doesn't notice an expired license until it's too late | The backend blocks moving a contract to "Active" if a required document has expired — the error is shown immediately on save |
| 2 | **Ambiguity around a rejected work order** | The contractor doesn't understand why the work order was rejected and resubmits the same file | A comment is mandatory on rejection (minimum 10 characters) and is shown to the contractor along with the status |
| 3 | **Mismatch between work order amount and remaining contract budget** | Accepting a work order could exceed the contract's totalValue without warning | When confirming a work order, the system shows a live calculation — "remaining budget after confirmation" — before the final click |
| 4 | **Loss of context when moving between Payments and Contracts** | Finance sees a payment amount but doesn't immediately understand which scope of work it covers | Every payment record always shows the linked work order number and a short description of the work inline, with no need to navigate elsewhere |
 
---
 
## 5. Taxonomy and Filtering
 
Goal: any record can be found in 2–3 actions.
 
**Contractors** are filtered by: status (active/pending/suspended/blacklisted) × work category (10 categories: construction, electrical, plumbing, HVAC, IT, logistics, cleaning, security, design, other) × free-text search (name / tax ID / contact person).
 
**Contracts** are filtered by: status (5 states) × payment type (3 types) × free-text search (number / title / contractor).
 
**Work orders** are organized as a kanban board by status (4 columns) — this is the filtering itself; an additional list view allows sorting by deadline.
 
**Payments** are filtered by: status (5 states) × free-text search (invoice / contract / contractor); default sort is by nearest due date first.
 
**Documents** are filtered by: document type (8 types) × free-text search; an additional "quick filter" from the dashboard — "expiring within 30 days" — passed as a query parameter.
 
Rule: no entity has more than 3 simultaneous filter axes — beyond that, users lose orientation.
 
---
 
## 6. Screen Map
 
| Screen | Function | Links to |
|---|---|---|
| **Dashboard** | KPI overview, alerts, payment chart, recent activity | Contractors, Contracts, Work Orders, Documents (via alerts) |
| **Contractors List** | Registry with filters, statuses, ratings | Contractor Card, Create Form |
| **Contractor Card** | Details + tabs (contracts/documents/payments) | Contract Card, Documents |
| **Contracts List** | Registry with completion progress, amounts | Contract Card, Create Form |
| **Contract Card** | Terms, milestones, linked work orders and documents | Work Orders, Documents |
| **Work Orders Kanban** | Workflow for confirming completed work | Work Order Card (modal) |
| **Payments List** | Transaction registry, statuses, overdue tracking | Contract Card, Contractor Card |
| **Documents Registry** | All documents in the system, review status, expiry date | Contractor/Contract Card (document source) |
| **Analytics** | Spend breakdown by category, contractor ratings | — (terminal screen) |
| **Settings → Profile** | Current user's data | — |
| **Settings → Team** | Managing access roles (admin/manager/finance/viewer) | — |
| **Settings → Templates** | Library of contract templates | Contract Create Form (loading a template) |
 
Connectivity: all third-order screens (Cards) are reachable via at least two paths — directly from a list, and through a related entity (for example, a Contract Card opens both from the contracts list and from a contractor's tab).
 
---
 
## 7. Development Prioritization
 
### MVP (launch with one pilot client)
- Contractors: CRUD, statuses, basic search.
- Contracts: CRUD, linked to a contractor, completion progress.
- Work orders: submission → approval/rejection (no kanban, simple list).
- Payments: manual creation and status changes.
- Dashboard: key figures only (no charts).
**Why:** these five entities form the minimal end-to-end cycle "contractor → money". Without this cycle, the product doesn't solve any of the three core problems. The kanban board, analytics, and document management are valuable, but not critical for the first validation of the value proposition.
 
### V1 (commercial launch)
- Documents: full registry, expiry dates, automatic expiry alerts.
- Work orders: kanban view, attachments/photo evidence.
- Dashboard: payment charts, activity feed, contracts ending soon.
- Access roles (admin/manager/finance/viewer) with restricted actions.
- Email notifications for expirations and deadlines.
**Why:** document management and automatic alerts are exactly what's sold to a B2B client as "you'll never miss an expired license again." Access roles become necessary as soon as more than 1–2 people work in the system.
 
### V2 (scaling and differentiation)
- Contractor portal (self-service submission of work orders and documents, without manager involvement).
- Analytics: ratings, budget forecasting, export to accounting systems.
- Contract templates and automatic PDF generation.
- Real-time work order status updates via SignalR (multiple managers working simultaneously).
- Banking API integration for automatic payment confirmation.
**Why:** a contractor portal halves the manager's operational workload, but requires separate authentication and UX — justified only after the product is validated at V1. Real-time updates via SignalR only become necessary at a scale of 50+ concurrent users, which is atypical for MVP/V1 clients.
 
---
 
## Technical Fit with the Stack
 
- **PostgreSQL**: a relational model fits perfectly — clear foreign keys between Contractor → Contract → WorkOrder → Payment, and Contractor/Contract → Document (a polymorphic link via nullable contractorId/contractId).
- **.NET Web API**: REST endpoints for each entity (`/api/contractors`, `/api/contracts`, `/api/work-orders`, `/api/payments`, `/api/documents`) plus a dedicated `/api/dashboard/stats` for aggregated metrics. SignalR is optional for V2 (live kanban updates).
- **React + TypeScript**: a type-safe data model (see `src/types/index.ts` in the prototype) allows safely extending entities without runtime errors when adding new fields in V1/V2.
---
---
 
# ContractIQ — Архітектурний Canvas (Українська версія)
 
> SaaS-платформа для управління підрядниками та субпідрядниками в будівельних і інжинірингових компаніях.
> Стек: React + TypeScript (frontend) · C# .NET Web API (backend) · PostgreSQL (БД)
 
---
 
## 0. Проблема та продукт
 
Генпідрядники, керуючі 20–100+ субпідрядниками одночасно, втрачають контроль над трьома речами:
1. **Документи** — ліцензії, страховки, податкові довідки протерміновуються непомітно → юридичний/фінансовий ризик.
2. **Акти виконаних робіт** — підтвердження факту виконання живе в email/Excel/паперах → суперечки, затримки оплат.
3. **Виплати** — без прив'язки до актів і договорів → переплати, прострочення, втрата довіри підрядників.
**ContractIQ** — єдина система обліку підрядників, договорів, актів робіт, документів і виплат із наскрізним зв'язком між ними (Підрядник → Договір → Акт → Виплата).
 
---
 
## 1. Інвентар контенту
 
### Сутності першого порядку (часте використання, центральні в моделі даних)
 
| Сутність | Опис | Частота взаємодії |
|---|---|---|
| **Підрядник (Contractor)** | Юр./фіз. особа-виконавець: реквізити, контакти, рейтинг, категорія | Дуже висока |
| **Договір (Contract)** | Угода з підрядником: суми, терміни, тип оплати, прив'язка до проєкту | Дуже висока |
| **Акт виконаних робіт (WorkOrder)** | Заявка на підтвердження обсягу робіт у межах договору | Дуже висока |
| **Виплата (Payment)** | Грошова транзакція, прив'язана до договору/акту | Висока |
 
### Сутності другого порядку (підтримуючі, періодичне використання)
 
| Сутність | Опис |
|---|---|
| **Документ (Document)** | Файл (ліцензія, страховка, акт, рахунок) із терміном дії та статусом перевірки |
| **Проєкт (Project)** | Об'єкт будівництва/контракту, що групує кілька договорів |
| **Користувач (User)** | Співробітник компанії-замовника з роллю (admin/manager/finance/viewer) |
| **Тег / Категорія** | Класифікація підрядників і договорів (тип робіт, пріоритет) |
 
### Сутності третього порядку (системні, рідкісне пряме звернення)
 
| Сутність | Опис |
|---|---|
| **Журнал дій (ActivityLog)** | Аудит-трейл змін статусів, хто/коли/що |
| **Сповіщення (Notification)** | Тригери: протермінування документа, дедлайн акту, прострочена виплата |
| **Шаблон договору (ContractTemplate)** | Повторно використовувані шаблони умов |
 
---
 
## 2. Ієрархія навігації
 
Мова розділів — те, як говорить сам користувач (менеджер проєкту, фінансист), а не абстрактні ярлики.
 
```
├── Дашборд                         (рівень 1 — огляд)
│
├── Підрядники                      (рівень 1)
│   └── Картка підрядника           (рівень 2)
│       ├── Профіль і реквізити     (рівень 3 — вкладка)
│       ├── Договори підрядника     (рівень 3 — вкладка)
│       ├── Документи підрядника    (рівень 3 — вкладка)
│       └── Історія виплат          (рівень 3 — вкладка)
│
├── Договори                        (рівень 1)
│   └── Картка договору             (рівень 2)
│       ├── Умови та етапи          (вкладка)
│       ├── Акти робіт по договору  (вкладка)
│       └── Документи договору      (вкладка)
│
├── Акти виконаних робіт            (рівень 1 — канбан: На розгляді → Перевірка → Прийнято/Відхилено)
│
├── Виплати                         (рівень 1 — реєстр + календар)
│
├── Документи                       (рівень 1 — наскрізний реєстр усіх документів з фільтром "закінчується термін")
│
├── Аналітика                       (рівень 1 — звіти, розподіл витрат, рейтинги)
│
└── Налаштування                    (рівень 1)
    ├── Профіль і команда
    ├── Ролі доступу
    └── Шаблони договорів
```
 
Максимум 3 рівні: Розділ → Об'єкт → Вкладка. Жодних прихованих підменю четвертого рівня.
 
---
 
## 3. Основні користувацькі потоки
 
### Потік 1 — Реєстрація нового підрядника (Manager)
1. Дашборд → "Підрядники" → кнопка "Додати підрядника".
2. Заповнення форми: юр. назва, ЄДРПОУ/ІПН, контактна особа, категорія робіт.
3. Завантаження обов'язкових документів (ліцензія, страховка) — система одразу позначає відсутні.
4. Збереження зі статусом "Очікує" → автоматичне сповіщення Finance-ролі на перевірку.
5. Finance підтверджує документи → статус змінюється на "Активний".
### Потік 2 — Створення договору і прив'язка до проєкту (Manager)
1. "Договори" → "Новий договір".
2. Вибір підрядника (тільки зі статусом "Активний" — заблоковано для "Призупинено"/"Заблоковано").
3. Вибір типу оплати: фіксована ціна / час-і-матеріали / по етапах.
4. Визначення суми, термінів, прив'язка до проєкту.
5. Договір зберігається як "Чернетка" → після підпису обома сторонами переводиться в "Активний".
### Потік 3 — Подання й підтвердження акту виконаних робіт (Contractor → Manager)
1. Підрядник (через портал або менеджер вручну) подає акт: опис робіт, сума, фотофіксація.
2. Акт з'являється в колонці "На розгляді" канбану.
3. Менеджер відкриває картку, перевіряє вкладення, переміщує в "Перевірка".
4. Рішення: "Прийняти" → автоматично створюється запланована виплата; або "Відхилити" → обов'язковий коментар з причиною, акт повертається підряднику.
### Потік 4 — Обробка виплати (Finance)
1. "Виплати" → фільтр "Заплановані" сортує за датою.
2. Finance відкриває запис, перевіряє прив'язаний акт і рахунок.
3. Позначає "В обробці" → після переказу — "Оплачено" з датою і номером транзакції.
4. Якщо дата сплати минула без дії — система автоматично позначає "Прострочено" і піднімає алерт на дашборді.
### Потік 5 — Моніторинг протермінування документів (Manager/Finance)
1. Дашборд показує блок "Документи закінчуються" (≤30 днів).
2. Перехід у "Документи" з попередньо застосованим фільтром.
3. Менеджер зв'язується з підрядником, запитує оновлений документ.
4. Завантаження нової версії → старий документ архівується, новий проходить повторну перевірку.
---
 
## 4. Точки тертя
 
| # | Момент тертя | Чому виникає | Пом'якшення в архітектурі |
|---|---|---|---|
| 1 | **Створення договору з підрядником без актуальних документів** | Менеджер не бачить, що ліцензія протермінована, поки не пізно | Бекенд блокує перехід договору в "Активний", якщо є протермінований обов'язковий документ — помилка показується одразу при спробі зберегти |
| 2 | **Неоднозначність відхиленого акту** | Підрядник не розуміє, чому акт відхилено, повторно подає той самий файл | Поле коментаря при відхиленні — обов'язкове (мінімум 10 символів), показується підряднику разом зі статусом |
| 3 | **Розсинхрон між сумою акту і залишком бюджету договору** | Прийняття акту може перевищити totalValue договору без попередження | При підтвердженні акту система показує live-розрахунок: "залишок бюджету після підтвердження" перед фінальним кліком |
| 4 | **Втрата контексту при переході між Виплатами і Договорами** | Finance бачить суму виплати, але не одразу розуміє, за який саме обсяг робіт вона | Кожен запис виплати завжди показує прив'язаний номер акту й короткий опис робіт інлайн, без переходу на іншу сторінку |
 
---
 
## 5. Таксономія і фільтрація
 
Мета: будь-який запис знаходиться за 2–3 дії.
 
**Підрядники** фільтруються за: статус (active/pending/suspended/blacklisted) × категорія робіт (10 категорій: будівництво, електрика, сантехніка, HVAC, IT, логістика, прибирання, охорона, дизайн, інше) × вільний пошук (назва / ЄДРПОУ / контактна особа).
 
**Договори** фільтруються за: статус (5 станів) × тип оплати (3 типи) × вільний пошук (номер / назва / підрядник).
 
**Акти робіт** організовані канбаном за статусом (4 колонки) — це сама фільтрація; додатковий перехід у списковий вигляд для сортування за дедлайном.
 
**Виплати** фільтруються за: статус (5 станів) × вільний пошук (рахунок / договір / підрядник); сортування за замовчуванням — найближчий дедлайн зверху.
 
**Документи** фільтруються за: тип документа (8 типів) × вільний пошук; додатковий "швидкий фільтр" з дашборду — "закінчується протягом 30 днів", що передається як query-параметр.
 
Правило: жодна сутність не має більше 3 одночасних осей фільтрації — це межа, після якої користувач втрачає орієнтацію.
 
---
 
## 6. Карта екранів
 
| Екран | Функція | Веде на |
|---|---|---|
| **Дашборд** | Огляд KPI, алерти, графік виплат, останні дії | Підрядники, Договори, Акти, Документи (через алерти) |
| **Список підрядників** | Реєстр з фільтрами, статусами, рейтингом | Картка підрядника, Форма створення |
| **Картка підрядника** | Деталі + вкладки (договори/документи/виплати) | Картка договору, Документи |
| **Список договорів** | Реєстр з прогресом виконання, сумами | Картка договору, Форма створення |
| **Картка договору** | Умови, етапи, пов'язані акти й документи | Акти робіт, Документи |
| **Канбан актів робіт** | Робочий процес підтвердження виконаних робіт | Картка акту (модальне вікно) |
| **Список виплат** | Реєстр транзакцій, статуси, прострочення | Картка договору, Картка підрядника |
| **Реєстр документів** | Всі документи системи, статус перевірки, термін дії | Картка підрядника/договору (джерело документа) |
| **Аналітика** | Розподіл витрат за категоріями, рейтинг підрядників | — (термінальний екран) |
| **Налаштування → Профіль** | Дані поточного користувача | — |
| **Налаштування → Команда** | Керування ролями доступу (admin/manager/finance/viewer) | — |
| **Налаштування → Шаблони** | Бібліотека шаблонів договорів | Форма створення договору (підвантаження шаблону) |
 
Зв'язність: усі екрани третього порядку (Картки) досяжні мінімум двома шляхами — напряму зі списку і через пов'язану сутність (наприклад, Картка договору відкривається і зі списку договорів, і з вкладки підрядника).
 
---
 
## 7. Пріоритизація розробки
 
### MVP (запуск з одним пілотним клієнтом)
- Підрядники: CRUD, статуси, базовий пошук.
- Договори: CRUD, прив'язка до підрядника, прогрес виконання.
- Акти робіт: подання → підтвердження/відхилення (без канбану, простий список).
- Виплати: ручне створення і зміна статусу.
- Дашборд: лише ключові цифри (без графіків).
**Чому так:** ці п'ять сутностей формують мінімальний наскрізний цикл "підрядник → гроші". Без цього циклу продукт не вирішує жодної з трьох ключових проблем. Канбан, аналітика і документообіг — цінні, але не критичні для першого підтвердження ціннісної пропозиції.
 
### V1 (комерційний запуск)
- Документи: повний реєстр, терміни дії, автоалерти про протермінування.
- Акти робіт: канбан-вигляд, вкладення/фотофіксація.
- Дашборд: графіки виплат, активність, договори що закінчуються.
- Ролі доступу (admin/manager/finance/viewer) з обмеженням дій.
- Email-сповіщення про протермінування і дедлайни.
**Чому так:** документообіг і автоматичні алерти — це саме те, що продається B2B-клієнту як "більше не пропустимо протермінування ліцензії". Ролі доступу необхідні, щойно в системі працює більше ніж 1-2 людини.
 
### V2 (масштабування і диференціація)
- Портал для підрядника (самостійне подання актів і документів, без участі менеджера).
- Аналітика: рейтинги, прогнозування бюджету, експорт у бухгалтерські системи.
- Шаблони договорів і автогенерація PDF.
- Real-time оновлення статусів акту через SignalR (одночасна робота кількох менеджерів).
- Інтеграція з банківським API для автоматичного підтвердження факту оплати.
**Чому так:** портал для підрядника знижує операційне навантаження на менеджера вдвічі, але вимагає окремої авторизації і UX — це виправдано тільки після підтвердження продукту на V1. Real-time через SignalR стає потрібним лише за масштабу 50+ одночасних користувачів, що нетипово для MVP/V1 клієнтів.
 
---
 
## Технічна відповідність стеку
 
- **PostgreSQL**: реляційна модель ідеально підходить — чіткі FK між Contractor → Contract → WorkOrder → Payment, та Contractor/Contract → Document (полиморфна прив'язка через nullable contractorId/contractId).
- **.NET Web API**: REST-ендпоінти на кожну сутність (`/api/contractors`, `/api/contracts`, `/api/work-orders`, `/api/payments`, `/api/documents`) + окремий `/api/dashboard/stats` для агрегованих показників. SignalR — опційно для V2 (живі оновлення канбану).
- **React + TypeScript**: типобезпечна модель даних (див. `src/types/index.ts` у прототипі) дозволяє безпечно розширювати сутності без runtime-помилок при додаванні нових полів у V1/V2.
