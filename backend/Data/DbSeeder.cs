using ContractIQ.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ContractIqDbContext db)
    {
        if (await db.Users.AnyAsync()) return; // already seeded

        var manager = new User
        {
            Name = "Ковальчук Олена",
            Email = "o.kovalchuk@buildpro.ua",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo12345!"),
            Role = UserRole.Manager
        };
        var finance = new User
        {
            Name = "Мельник Віктор",
            Email = "v.melnyk@buildpro.ua",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo12345!"),
            Role = UserRole.Finance
        };
        var admin = new User
        {
            Name = "Адмін Системи",
            Email = "admin@buildpro.ua",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin12345!"),
            Role = UserRole.Admin
        };
        db.Users.AddRange(manager, finance, admin);

        var project1 = new Project { Name = "Адмінбудівля Бориспіль" };
        var project2 = new Project { Name = "ЖК \"Сонячний\"" };
        var project3 = new Project { Name = "БЦ \"Панорама\"" };
        db.Projects.AddRange(project1, project2, project3);

        var c1 = new Contractor
        {
            Name = "ТОВ \"Техбуд Сервіс\"", LegalName = "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ \"ТЕХБУД СЕРВІС\"",
            Code = "38471209", Status = ContractorStatus.Active, Category = ContractorCategory.Construction,
            Tags = new List<string> { "бетон", "фундамент", "каркас" },
            ContactPerson = "Василенко Михайло", Email = "vasylenko@techbud.ua", Phone = "+380671234567",
            Rating = 4.5m, Region = "Київська обл."
        };
        var c2 = new Contractor
        {
            Name = "БК \"Альфа Буд\"", LegalName = "БУДІВЕЛЬНА КОМПАНІЯ \"АЛЬФА БУД\" ТОВ",
            Code = "29834711", Status = ContractorStatus.Active, Category = ContractorCategory.Construction,
            Tags = new List<string> { "покрівля", "оздоблення" },
            ContactPerson = "Петренко Ірина", Email = "petrenko@alphabud.ua", Phone = "+380509876543",
            Rating = 4.8m, Region = "м. Київ"
        };
        var c3 = new Contractor
        {
            Name = "ФОП Гриценко В.О.", LegalName = "ФІЗИЧНА ОСОБА-ПІДПРИЄМЕЦЬ ГРИЦЕНКО ВАСИЛЬ ОЛЕГОВИЧ",
            Code = "2947381920", Status = ContractorStatus.Active, Category = ContractorCategory.Electrical,
            Tags = new List<string> { "електрика", "слабкострум" },
            ContactPerson = "Гриценко Василь", Email = "gritsenko@gmail.com", Phone = "+380934567890",
            Rating = 4.2m, Region = "м. Київ"
        };
        var c4 = new Contractor
        {
            Name = "ТОВ \"КліматТех\"", LegalName = "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ \"КЛІМАТТЕХ\"",
            Code = "41293847", Status = ContractorStatus.Active, Category = ContractorCategory.Hvac,
            Tags = new List<string> { "вентиляція", "кондиціонування" },
            ContactPerson = "Сидоренко Олег", Email = "sydorenko@klimattech.ua", Phone = "+380442223344",
            Rating = 3.9m, Region = "Харківська обл."
        };
        db.Contractors.AddRange(c1, c2, c3, c4);

        await db.SaveChangesAsync(); // need IDs before referencing FKs below

        var ct1 = new Contract
        {
            Number = "2025-14", Title = "Будівництво адмінбудівлі — земляні роботи та фундамент",
            ContractorId = c1.Id, Status = ContractStatus.Active, Type = ContractType.Milestone,
            TotalValue = 3_200_000, PaidAmount = 1_920_000,
            StartDate = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 9, 30, 0, 0, 0, DateTimeKind.Utc),
            ManagerId = manager.Id, ProjectId = project1.Id, CompletionPercent = 60,
            Tags = new List<string> { "фундамент", "пріоритет" }
        };
        var ct2 = new Contract
        {
            Number = "2025-18", Title = "Покрівельні роботи — 3 корпуси",
            ContractorId = c2.Id, Status = ContractStatus.Active, Type = ContractType.Fixed,
            TotalValue = 1_450_000, PaidAmount = 580_000,
            StartDate = new DateTime(2025, 4, 15, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 7, 31, 0, 0, 0, DateTimeKind.Utc),
            ManagerId = manager.Id, ProjectId = project2.Id, CompletionPercent = 40,
            Tags = new List<string> { "покрівля" }
        };
        var ct3 = new Contract
        {
            Number = "2025-21", Title = "Вентиляція та кондиціонування — офісна будівля",
            ContractorId = c4.Id, Status = ContractStatus.Active, Type = ContractType.TimeMaterial,
            TotalValue = 980_000, PaidAmount = 245_000,
            StartDate = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 10, 15, 0, 0, 0, DateTimeKind.Utc),
            ManagerId = manager.Id, ProjectId = project3.Id, CompletionPercent = 25,
            Tags = new List<string> { "hvac" }
        };
        db.Contracts.AddRange(ct1, ct2, ct3);

        await db.SaveChangesAsync();

        db.WorkOrders.AddRange(
            new WorkOrder
            {
                ContractId = ct1.Id, Title = "Акт виконаних робіт №47 — армування фундаменту, секція Б",
                Description = "Виконано армування та заливку фундаментної плити секції Б площею 420 м².",
                Status = WorkOrderStatus.Review, Amount = 480_000,
                SubmittedAt = DateTime.UtcNow.AddDays(-3), Deadline = DateTime.UtcNow.AddDays(2),
                AttachmentsCount = 6
            },
            new WorkOrder
            {
                ContractId = ct3.Id, Title = "Акт №3 — монтаж повітроводів 3-й поверх",
                Description = "Встановлено 240 пм повітроводів, кріплення та герметизація стиків.",
                Status = WorkOrderStatus.Open, Amount = 180_000,
                SubmittedAt = DateTime.UtcNow.AddDays(-1), Deadline = DateTime.UtcNow.AddDays(5),
                AttachmentsCount = 3
            }
        );

        db.Documents.AddRange(
            new Document
            {
                ContractorId = c1.Id, Title = "Ліцензія на будівельну діяльність",
                Type = DocumentType.License, Status = DocumentStatus.Approved,
                UploadedAt = DateTime.UtcNow.AddMonths(-5), ExpiresAt = DateTime.UtcNow.AddDays(13),
                FileName = "license_techbud_2024.pdf", FileSizeBytes = 2_100_000, StoragePath = "/seed/license_techbud.pdf"
            },
            new Document
            {
                ContractorId = c3.Id, Title = "Страховий поліс відповідальності",
                Type = DocumentType.Insurance, Status = DocumentStatus.Pending,
                UploadedAt = DateTime.UtcNow.AddDays(-8), ExpiresAt = DateTime.UtcNow.AddDays(12),
                FileName = "insurance_gritsenko.pdf", FileSizeBytes = 850_000, StoragePath = "/seed/insurance_gritsenko.pdf"
            }
        );

        db.Payments.AddRange(
            new Payment
            {
                ContractId = ct1.Id, ContractorId = c1.Id, Amount = 320_000,
                Status = PaymentStatus.Paid, ScheduledDate = DateTime.UtcNow.AddDays(-13),
                PaidDate = DateTime.UtcNow.AddDays(-13), Description = "Оплата акту №45 — земляні роботи",
                InvoiceNumber = "INV-2025-0089", ApprovedById = finance.Id
            },
            new Payment
            {
                ContractId = ct3.Id, ContractorId = c4.Id, Amount = 180_000,
                Status = PaymentStatus.Scheduled, ScheduledDate = DateTime.UtcNow.AddDays(9),
                Description = "Оплата акту №3 — повітроводи", InvoiceNumber = "INV-2025-0101"
            },
            new Payment
            {
                ContractId = ct1.Id, ContractorId = c1.Id, Amount = 480_000,
                Status = PaymentStatus.Overdue, ScheduledDate = DateTime.UtcNow.AddDays(-8),
                Description = "Оплата акту №47 — армування, секція Б", InvoiceNumber = "INV-2025-0097"
            }
        );

        await db.SaveChangesAsync();
    }
}
