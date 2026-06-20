using ContractIQ.Api.Data;
using ContractIQ.Api.Models;

namespace ContractIQ.Api.Services;

public interface IActivityService
{
    Task LogAsync(ActivityType type, string action, string subject, Guid? actorId, string? entityId = null);
}

public class ActivityService : IActivityService
{
    private readonly ContractIqDbContext _db;

    public ActivityService(ContractIqDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(ActivityType type, string action, string subject, Guid? actorId, string? entityId = null)
    {
        _db.ActivityLogs.Add(new ActivityLog
        {
            Type = type,
            Action = action,
            Subject = subject,
            ActorId = actorId,
            EntityId = entityId,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
