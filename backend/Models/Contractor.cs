namespace ContractIQ.Api.Models;

public class Contractor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // ЄДРПОУ / ІПН
    public ContractorStatus Status { get; set; } = ContractorStatus.Pending;
    public ContractorCategory Category { get; set; }
    public List<string> Tags { get; set; } = new();
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal Rating { get; set; } = 0;
    public string Region { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
