namespace ContractIQ.Api.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public Guid ContractorId { get; set; }
    public Contractor? Contractor { get; set; }

    public Guid? WorkOrderId { get; set; }
    public WorkOrder? WorkOrder { get; set; }

    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Scheduled;

    public DateTime ScheduledDate { get; set; }
    public DateTime? PaidDate { get; set; }

    public string Description { get; set; } = string.Empty;
    public string? InvoiceNumber { get; set; }

    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
