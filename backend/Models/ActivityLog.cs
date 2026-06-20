namespace ContractIQ.Api.Models;

public enum ActivityType
{
    Payment,
    Document,
    Contract,
    WorkOrder,
    Contractor
}

public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ActivityType Type { get; set; }
    public string Action { get; set; } = string.Empty; // "створено", "підтверджено", "відхилено", ...
    public string Subject { get; set; } = string.Empty; // human-readable label
    public Guid? ActorId { get; set; }
    public User? Actor { get; set; }
    public string? EntityId { get; set; } // id of the related entity, as string for flexibility
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
