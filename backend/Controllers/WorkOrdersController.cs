using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Models;
using ContractIQ.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/work-orders")]
[Authorize]
public class WorkOrdersController : ControllerBase
{
    private readonly ContractIqDbContext _db;
    private readonly IActivityService _activity;

    public WorkOrdersController(ContractIqDbContext db, IActivityService activity)
    {
        _db = db;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkOrderDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] Guid? contractId)
    {
        var query = _db.WorkOrders
            .AsNoTracking()
            .Include(w => w.Contract).ThenInclude(c => c!.Contractor)
            .Include(w => w.ReviewedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkOrderStatus>(status, true, out var st))
            query = query.Where(w => w.Status == st);

        if (contractId.HasValue)
            query = query.Where(w => w.ContractId == contractId.Value);

        var items = await query.OrderByDescending(w => w.SubmittedAt).ToListAsync();
        return Ok(items.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkOrderDto>> GetById(Guid id)
    {
        var w = await _db.WorkOrders
            .AsNoTracking()
            .Include(x => x.Contract).ThenInclude(c => c!.Contractor)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id);

        return w is null ? NotFound() : Ok(MapToDto(w));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<WorkOrderDto>> Create(CreateWorkOrderRequest request)
    {
        var contract = await _db.Contracts.Include(c => c.Contractor).FirstOrDefaultAsync(c => c.Id == request.ContractId);
        if (contract is null) return BadRequest(new { message = "Договір не знайдено" });

        if (contract.Status != ContractStatus.Active)
            return BadRequest(new { message = "Акт можна подати лише по активному договору" });

        var workOrder = new WorkOrder
        {
            ContractId = request.ContractId,
            Title = request.Title,
            Description = request.Description,
            Amount = request.Amount,
            Deadline = DateTime.SpecifyKind(request.Deadline, DateTimeKind.Utc),
            Status = WorkOrderStatus.Open
        };

        _db.WorkOrders.Add(workOrder);
        await _db.SaveChangesAsync();

        await _activity.LogAsync(ActivityType.WorkOrder, "подано", $"{workOrder.Title} — {contract.Contractor!.Name}", GetUserId(), workOrder.Id.ToString());

        var full = await _db.WorkOrders.Include(w => w.Contract).ThenInclude(c => c!.Contractor).FirstAsync(w => w.Id == workOrder.Id);
        return CreatedAtAction(nameof(GetById), new { id = workOrder.Id }, MapToDto(full));
    }

    // Core business flow: review (accept/reject) a work order.
    // Accepting automatically schedules a payment — this is the heart of the
    // "Підрядник → Договір → Акт → Виплата" chain described in the architecture canvas.
    [HttpPost("{id:guid}/review")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<WorkOrderDto>> Review(Guid id, ReviewWorkOrderRequest request)
    {
        var workOrder = await _db.WorkOrders
            .Include(w => w.Contract).ThenInclude(c => c!.Contractor)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (workOrder is null) return NotFound();

        if (workOrder.Status is WorkOrderStatus.Accepted or WorkOrderStatus.Rejected)
            return BadRequest(new { message = "Цей акт вже обробено" });

        var userId = GetUserId();

        if (request.Decision.Equals("accept", StringComparison.OrdinalIgnoreCase))
        {
            var contract = workOrder.Contract!;
            var remainingBudget = contract.TotalValue - contract.PaidAmount;

            if (workOrder.Amount > remainingBudget)
                return BadRequest(new
                {
                    message = $"Сума акту ({workOrder.Amount:N0}) перевищує залишок бюджету договору ({remainingBudget:N0})"
                });

            workOrder.Status = WorkOrderStatus.Accepted;
            workOrder.ReviewedAt = DateTime.UtcNow;
            workOrder.ReviewedById = userId;

            // Automatically schedule the corresponding payment
            var payment = new Payment
            {
                ContractId = contract.Id,
                ContractorId = contract.ContractorId,
                WorkOrderId = workOrder.Id,
                Amount = workOrder.Amount,
                Status = PaymentStatus.Scheduled,
                ScheduledDate = DateTime.UtcNow.AddDays(10),
                Description = $"Оплата акту — {workOrder.Title}"
            };
            _db.Payments.Add(payment);

            await _activity.LogAsync(ActivityType.WorkOrder, "підтверджено", $"{workOrder.Title} — {contract.Contractor!.Name}", userId, workOrder.Id.ToString());
        }
        else if (request.Decision.Equals("reject", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(request.Notes) || request.Notes.Trim().Length < 10)
                return BadRequest(new { message = "При відхиленні акту обов'язково вкажіть причину (мінімум 10 символів)" });

            workOrder.Status = WorkOrderStatus.Rejected;
            workOrder.ReviewedAt = DateTime.UtcNow;
            workOrder.ReviewedById = userId;
            workOrder.Notes = request.Notes;

            await _activity.LogAsync(ActivityType.WorkOrder, "відхилено", $"{workOrder.Title} — {workOrder.Contract!.Contractor!.Name}", userId, workOrder.Id.ToString());
        }
        else
        {
            return BadRequest(new { message = "Decision має бути 'accept' або 'reject'" });
        }

        await _db.SaveChangesAsync();
        return Ok(MapToDto(workOrder));
    }

    private static WorkOrderDto MapToDto(WorkOrder w) => new(
        w.Id, w.ContractId, w.Contract?.Number ?? "", w.Contract?.Contractor?.Name ?? "",
        w.Title, w.Description, w.Status.ToString(), w.Amount,
        w.SubmittedAt, w.Deadline, w.ReviewedAt, w.ReviewedBy?.Name,
        w.AttachmentsCount, w.Notes
    );

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
