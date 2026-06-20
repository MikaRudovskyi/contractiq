using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Models;
using ContractIQ.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly ContractIqDbContext _db;
    private readonly IActivityService _activity;

    public PaymentsController(ContractIqDbContext db, IActivityService activity)
    {
        _db = db;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] Guid? contractorId,
        [FromQuery] string? search)
    {
        var query = _db.Payments
            .AsNoTracking()
            .Include(p => p.Contract)
            .Include(p => p.Contractor)
            .Include(p => p.ApprovedBy)
            .AsQueryable();

        // Auto-flag overdue payments on read (in production this would be a scheduled job)
        var overdueIds = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Scheduled && p.ScheduledDate < DateTime.UtcNow)
            .Select(p => p.Id)
            .ToListAsync();

        if (overdueIds.Count > 0)
        {
            await _db.Payments.Where(p => overdueIds.Contains(p.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Status, PaymentStatus.Overdue));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PaymentStatus>(status, true, out var st))
            query = query.Where(p => p.Status == st);

        if (contractorId.HasValue)
            query = query.Where(p => p.ContractorId == contractorId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.Contractor!.Name.ToLower().Contains(s) ||
                p.Contract!.Number.Contains(s) ||
                (p.InvoiceNumber != null && p.InvoiceNumber.ToLower().Contains(s)));
        }

        var items = await query.OrderBy(p => p.ScheduledDate).ToListAsync();
        return Ok(items.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PaymentDto>> GetById(Guid id)
    {
        var p = await _db.Payments
            .AsNoTracking()
            .Include(x => x.Contract).Include(x => x.Contractor).Include(x => x.ApprovedBy)
            .FirstOrDefaultAsync(x => x.Id == id);

        return p is null ? NotFound() : Ok(MapToDto(p));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Finance,Manager")]
    public async Task<ActionResult<PaymentDto>> Create(CreatePaymentRequest request)
    {
        var contract = await _db.Contracts.FindAsync(request.ContractId);
        if (contract is null) return BadRequest(new { message = "Договір не знайдено" });

        var payment = new Payment
        {
            ContractId = request.ContractId,
            ContractorId = request.ContractorId,
            WorkOrderId = request.WorkOrderId,
            Amount = request.Amount,
            ScheduledDate = DateTime.SpecifyKind(request.ScheduledDate, DateTimeKind.Utc),
            Description = request.Description,
            InvoiceNumber = request.InvoiceNumber,
            Status = PaymentStatus.Scheduled
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        var full = await _db.Payments.Include(p => p.Contract).Include(p => p.Contractor).Include(p => p.ApprovedBy)
            .FirstAsync(p => p.Id == payment.Id);

        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, MapToDto(full));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<ActionResult<PaymentDto>> UpdateStatus(Guid id, UpdatePaymentStatusRequest request)
    {
        var payment = await _db.Payments
            .Include(p => p.Contract)
            .Include(p => p.Contractor)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return NotFound();

        if (!Enum.TryParse<PaymentStatus>(request.Status, true, out var status))
            return BadRequest(new { message = "Невірний статус" });

        var userId = GetUserId();
        payment.Status = status;

        if (status == PaymentStatus.Paid)
        {
            payment.PaidDate = request.PaidDate.HasValue
                ? DateTime.SpecifyKind(request.PaidDate.Value, DateTimeKind.Utc)
                : DateTime.UtcNow;
            payment.ApprovedById = userId;

            // Keep the contract's running total in sync
            payment.Contract!.PaidAmount += payment.Amount;

            await _activity.LogAsync(
                ActivityType.Payment, "виконано",
                $"{payment.Amount:N0} — {payment.Contractor!.Name}", userId, payment.Id.ToString());
        }

        await _db.SaveChangesAsync();

        var full = await _db.Payments.Include(p => p.Contract).Include(p => p.Contractor).Include(p => p.ApprovedBy)
            .FirstAsync(p => p.Id == id);

        return Ok(MapToDto(full));
    }

    private static PaymentDto MapToDto(Payment p) => new(
        p.Id, p.ContractId, p.Contract?.Number ?? "", p.ContractorId, p.Contractor?.Name ?? "",
        p.WorkOrderId, p.Amount, p.Status.ToString(), p.ScheduledDate, p.PaidDate,
        p.Description, p.InvoiceNumber, p.ApprovedBy?.Name, p.CreatedAt
    );

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
