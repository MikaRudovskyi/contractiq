namespace ContractIQ.Api.Models;

public class WorkOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Open;
    public decimal Amount { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime Deadline { get; set; }

    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedById { get; set; }
    public User? ReviewedBy { get; set; }

    public int AttachmentsCount { get; set; } = 0;
    public string? Notes { get; set; }

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
