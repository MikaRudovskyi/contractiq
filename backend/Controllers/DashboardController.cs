using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ContractIqDbContext _db;

    public DashboardController(ContractIqDbContext db)
    {
        _db = db;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var in30Days = now.AddDays(30);

        var activeContractors = await _db.Contractors.CountAsync(c => c.Status == ContractorStatus.Active);
        var activeContracts = await _db.Contracts.CountAsync(c => c.Status == ContractStatus.Active);
        var pendingWorkOrders = await _db.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.Open || w.Status == WorkOrderStatus.Review);
        var overduePayments = await _db.Payments.CountAsync(p => p.Status == PaymentStatus.Overdue);
        var totalContractValue = await _db.Contracts.Where(c => c.Status == ContractStatus.Active).SumAsync(c => c.TotalValue);
        var paidThisMonth = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Paid && p.PaidDate >= monthStart)
            .SumAsync(p => p.Amount);
        var documentsExpiringSoon = await _db.Documents
            .CountAsync(d => d.ExpiresAt != null && d.ExpiresAt <= in30Days && d.ExpiresAt >= now);
        var contractsEndingSoon = await _db.Contracts
            .CountAsync(c => c.Status == ContractStatus.Active && c.EndDate <= in30Days.AddDays(60));

        return Ok(new DashboardStatsDto(
            activeContractors, activeContracts, pendingWorkOrders, overduePayments,
            totalContractValue, paidThisMonth, documentsExpiringSoon, contractsEndingSoon
        ));
    }

    [HttpGet("payments-chart")]
    public async Task<ActionResult<IEnumerable<ChartPointDto>>> GetPaymentsChart([FromQuery] int months = 6)
    {
        var now = DateTime.UtcNow;
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));

        var payments = await _db.Payments
            .Where(p => p.CreatedAt >= start)
            .Select(p => new { p.Amount, p.Status, p.PaidDate, p.ScheduledDate, p.CreatedAt })
            .ToListAsync();

        var result = new List<ChartPointDto>();
        for (var i = 0; i < months; i++)
        {
            var monthDate = start.AddMonths(i);
            var monthLabel = monthDate.ToString("MMM");

            var paid = payments.Where(p => p.Status == PaymentStatus.Paid && p.PaidDate.HasValue
                && p.PaidDate.Value.Year == monthDate.Year && p.PaidDate.Value.Month == monthDate.Month)
                .Sum(p => p.Amount);

            var scheduled = payments.Where(p =>
                p.ScheduledDate.Year == monthDate.Year && p.ScheduledDate.Month == monthDate.Month)
                .Sum(p => p.Amount);

            result.Add(new ChartPointDto(monthLabel, paid, scheduled));
        }

        return Ok(result);
    }

    [HttpGet("activity")]
    public async Task<ActionResult<IEnumerable<ActivityItemDto>>> GetActivity([FromQuery] int take = 10)
    {
        var items = await _db.ActivityLogs
            .AsNoTracking()
            .Include(a => a.Actor)
            .OrderByDescending(a => a.Timestamp)
            .Take(take)
            .Select(a => new ActivityItemDto(
                a.Id, a.Type.ToString(), a.Action, a.Subject,
                a.Actor != null ? a.Actor.Name : "Система", a.Timestamp))
            .ToListAsync();

        return Ok(items);
    }
}
