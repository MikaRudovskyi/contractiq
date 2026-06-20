using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Models;
using ContractIQ.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractsController : ControllerBase
{
    private readonly ContractIqDbContext _db;
    private readonly IActivityService _activity;

    public ContractsController(ContractIqDbContext db, IActivityService activity)
    {
        _db = db;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] Guid? contractorId)
    {
        var query = _db.Contracts
            .AsNoTracking()
            .Include(c => c.Contractor)
            .Include(c => c.Manager)
            .Include(c => c.Project)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.Number.Contains(s) ||
                c.Title.ToLower().Contains(s) ||
                c.Contractor!.Name.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ContractStatus>(status, true, out var st))
            query = query.Where(c => c.Status == st);

        if (contractorId.HasValue)
            query = query.Where(c => c.ContractorId == contractorId.Value);

        var contracts = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        var ids = contracts.Select(c => c.Id).ToList();
        var workOrderCounts = await _db.WorkOrders.Where(w => ids.Contains(w.ContractId))
            .GroupBy(w => w.ContractId).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();
        var documentCounts = await _db.Documents.Where(d => d.ContractId != null && ids.Contains(d.ContractId.Value))
            .GroupBy(d => d.ContractId!.Value).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

        var result = contracts.Select(c => MapToDto(
            c,
            workOrderCounts.FirstOrDefault(w => w.Key == c.Id)?.Count ?? 0,
            documentCounts.FirstOrDefault(d => d.Key == c.Id)?.Count ?? 0
        ));

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDto>> GetById(Guid id)
    {
        var c = await _db.Contracts
            .AsNoTracking()
            .Include(x => x.Contractor)
            .Include(x => x.Manager)
            .Include(x => x.Project)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c is null) return NotFound();

        var workOrdersCount = await _db.WorkOrders.CountAsync(w => w.ContractId == id);
        var documentsCount = await _db.Documents.CountAsync(d => d.ContractId == id);

        return Ok(MapToDto(c, workOrdersCount, documentsCount));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ContractDto>> Create(CreateContractRequest request)
    {
        if (!Enum.TryParse<ContractType>(request.Type, true, out var type))
            return BadRequest(new { message = "Невірний тип договору" });

        var contractor = await _db.Contractors.FindAsync(request.ContractorId);
        if (contractor is null) return BadRequest(new { message = "Підрядника не знайдено" });

        if (contractor.Status != ContractorStatus.Active)
            return BadRequest(new { message = "Договір можна створити лише з активним підрядником" });

        if (await _db.Contracts.AnyAsync(c => c.Number == request.Number))
            return Conflict(new { message = "Договір з таким номером вже існує" });

        var managerId = GetUserId();

        var contract = new Contract
        {
            Number = request.Number,
            Title = request.Title,
            ContractorId = request.ContractorId,
            Type = type,
            Status = ContractStatus.Draft,
            TotalValue = request.TotalValue,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            ProjectId = request.ProjectId,
            ManagerId = managerId,
            Tags = request.Tags ?? new List<string>()
        };

        _db.Contracts.Add(contract);
        await _db.SaveChangesAsync();

        await _activity.LogAsync(ActivityType.Contract, "створено", $"Договір №{contract.Number}", managerId, contract.Id.ToString());

        var full = await _db.Contracts.Include(c => c.Contractor).Include(c => c.Manager).Include(c => c.Project)
            .FirstAsync(c => c.Id == contract.Id);

        return CreatedAtAction(nameof(GetById), new { id = contract.Id }, MapToDto(full, 0, 0));
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ContractDto>> Update(Guid id, UpdateContractRequest request)
    {
        var contract = await _db.Contracts.Include(c => c.Contractor).Include(c => c.Manager).Include(c => c.Project)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (contract is null) return NotFound();

        if (request.Title is not null) contract.Title = request.Title;
        if (request.TotalValue.HasValue) contract.TotalValue = request.TotalValue.Value;
        if (request.EndDate.HasValue) contract.EndDate = DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc);
        if (request.CompletionPercent.HasValue) contract.CompletionPercent = Math.Clamp(request.CompletionPercent.Value, 0, 100);
        if (request.Tags is not null) contract.Tags = request.Tags;

        if (request.Status is not null)
        {
            if (!Enum.TryParse<ContractStatus>(request.Status, true, out var status))
                return BadRequest(new { message = "Невірний статус" });

            // Block activating a contract if the contractor has an expired required document
            if (status == ContractStatus.Active)
            {
                var hasExpiredDocs = await _db.Documents.AnyAsync(d =>
                    d.ContractorId == contract.ContractorId &&
                    (d.Type == DocumentType.License || d.Type == DocumentType.Insurance) &&
                    d.ExpiresAt != null && d.ExpiresAt < DateTime.UtcNow);

                if (hasExpiredDocs)
                    return BadRequest(new { message = "Неможливо активувати договір: у підрядника протермінований обов'язковий документ (ліцензія/страхування)" });
            }

            contract.Status = status;

            if (status == ContractStatus.Completed)
                await _activity.LogAsync(ActivityType.Contract, "закрито", $"Договір №{contract.Number}", GetUserId(), contract.Id.ToString());
        }

        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var workOrdersCount = await _db.WorkOrders.CountAsync(w => w.ContractId == id);
        var documentsCount = await _db.Documents.CountAsync(d => d.ContractId == id);

        return Ok(MapToDto(contract, workOrdersCount, documentsCount));
    }

    private static ContractDto MapToDto(Contract c, int workOrdersCount, int documentsCount) =>
        new(
            c.Id, c.Number, c.Title, c.ContractorId, c.Contractor?.Name ?? "",
            c.Status.ToString(), c.Type.ToString(), c.TotalValue, c.PaidAmount,
            c.StartDate, c.EndDate, c.ManagerId, c.Manager?.Name,
            c.ProjectId, c.Project?.Name, c.CompletionPercent, c.Tags,
            workOrdersCount, documentsCount, c.CreatedAt
        );

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
