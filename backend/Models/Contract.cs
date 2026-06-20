namespace ContractIQ.Api.Models;

public class Contract
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    public Guid ContractorId { get; set; }
    public Contractor? Contractor { get; set; }

    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public ContractType Type { get; set; }

    public decimal TotalValue { get; set; }
    public decimal PaidAmount { get; set; } = 0;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public Guid? ManagerId { get; set; }
    public User? Manager { get; set; }

    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    public int CompletionPercent { get; set; } = 0;
    public List<string> Tags { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkOrder> WorkOrders { get; set; } = new List<WorkOrder>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
