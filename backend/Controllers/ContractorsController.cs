using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Models;
using ContractIQ.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/contractors")]
[Authorize]
public class ContractorsController : ControllerBase
{
    private readonly ContractIqDbContext _db;
    private readonly IActivityService _activity;

    public ContractorsController(ContractIqDbContext db, IActivityService activity)
    {
        _db = db;
        _activity = activity;
    }

    // GET /api/contractors?search=&status=&category=&page=1&pageSize=20
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractorDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Contractors.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(s) ||
                c.Code.Contains(s) ||
                c.ContactPerson.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ContractorStatus>(status, true, out var st))
            query = query.Where(c => c.Status == st);

        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<ContractorCategory>(category, true, out var cat))
            query = query.Where(c => c.Category == cat);

        var contractors = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                Contractor = c,
                ActiveContracts = c.Contracts.Count(ct => ct.Status == ContractStatus.Active),
                TotalPaid = c.Payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => p.Amount),
                PendingAmount = c.Payments.Where(p => p.Status == PaymentStatus.Scheduled || p.Status == PaymentStatus.Overdue).Sum(p => p.Amount),
                DocumentsExpiring = c.Documents.Count(d => d.ExpiresAt != null && d.ExpiresAt <= DateTime.UtcNow.AddDays(30) && d.ExpiresAt >= DateTime.UtcNow)
            })
            .ToListAsync();

        var result = contractors.Select(x => MapToDto(x.Contractor, x.ActiveContracts, x.TotalPaid, x.PendingAmount, x.DocumentsExpiring));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractorDto>> GetById(Guid id)
    {
        var c = await _db.Contractors.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();

        var activeContracts = await _db.Contracts.CountAsync(ct => ct.ContractorId == id && ct.Status == ContractStatus.Active);
        var totalPaid = await _db.Payments.Where(p => p.ContractorId == id && p.Status == PaymentStatus.Paid).SumAsync(p => p.Amount);
        var pending = await _db.Payments.Where(p => p.ContractorId == id && (p.Status == PaymentStatus.Scheduled || p.Status == PaymentStatus.Overdue)).SumAsync(p => p.Amount);
        var docsExpiring = await _db.Documents.CountAsync(d => d.ContractorId == id && d.ExpiresAt != null && d.ExpiresAt <= DateTime.UtcNow.AddDays(30) && d.ExpiresAt >= DateTime.UtcNow);

        return Ok(MapToDto(c, activeContracts, totalPaid, pending, docsExpiring));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ContractorDto>> Create(CreateContractorRequest request)
    {
        if (!Enum.TryParse<ContractorCategory>(request.Category, true, out var category))
            return BadRequest(new { message = "Невірна категорія" });

        if (await _db.Contractors.AnyAsync(c => c.Code == request.Code))
            return Conflict(new { message = "Підрядник з таким кодом ЄДРПОУ/ІПН вже існує" });

        var contractor = new Contractor
        {
            Name = request.Name,
            LegalName = request.LegalName,
            Code = request.Code,
            Category = category,
            Status = ContractorStatus.Pending,
            ContactPerson = request.ContactPerson,
            Email = request.Email,
            Phone = request.Phone,
            Region = request.Region,
            Tags = request.Tags ?? new List<string>(),
            Notes = request.Notes
        };

        _db.Contractors.Add(contractor);
        await _db.SaveChangesAsync();

        await _activity.LogAsync(ActivityType.Contractor, "додано", contractor.Name, GetUserId(), contractor.Id.ToString());

        return CreatedAtAction(nameof(GetById), new { id = contractor.Id }, MapToDto(contractor, 0, 0, 0, 0));
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<ContractorDto>> Update(Guid id, UpdateContractorRequest request)
    {
        var contractor = await _db.Contractors.FindAsync(id);
        if (contractor is null) return NotFound();

        if (request.Name is not null) contractor.Name = request.Name;
        if (request.ContactPerson is not null) contractor.ContactPerson = request.ContactPerson;
        if (request.Email is not null) contractor.Email = request.Email;
        if (request.Phone is not null) contractor.Phone = request.Phone;
        if (request.Notes is not null) contractor.Notes = request.Notes;
        if (request.Tags is not null) contractor.Tags = request.Tags;

        if (request.Status is not null)
        {
            if (!Enum.TryParse<ContractorStatus>(request.Status, true, out var status))
                return BadRequest(new { message = "Невірний статус" });
            contractor.Status = status;
        }

        if (request.Category is not null)
        {
            if (!Enum.TryParse<ContractorCategory>(request.Category, true, out var category))
                return BadRequest(new { message = "Невірна категорія" });
            contractor.Category = category;
        }

        contractor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapToDto(contractor, 0, 0, 0, 0));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contractor = await _db.Contractors.FindAsync(id);
        if (contractor is null) return NotFound();

        var hasActiveContracts = await _db.Contracts.AnyAsync(c => c.ContractorId == id && c.Status == ContractStatus.Active);
        if (hasActiveContracts)
            return BadRequest(new { message = "Неможливо видалити підрядника з активними договорами" });

        _db.Contractors.Remove(contractor);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ContractorDto MapToDto(Contractor c, int activeContracts, decimal totalPaid, decimal pendingAmount, int docsExpiring) =>
        new(
            c.Id, c.Name, c.LegalName, c.Code,
            c.Status.ToString(), c.Category.ToString(), c.Tags,
            c.ContactPerson, c.Email, c.Phone, c.Rating,
            activeContracts, totalPaid, pendingAmount, docsExpiring,
            c.Region, c.Notes, c.CreatedAt
        );

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
