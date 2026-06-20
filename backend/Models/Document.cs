namespace ContractIQ.Api.Models;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Polymorphic attachment: belongs to a contractor and/or a contract
    public Guid? ContractorId { get; set; }
    public Contractor? Contractor { get; set; }

    public Guid? ContractId { get; set; }
    public Contract? Contract { get; set; }

    public string Title { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Pending;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    public Guid? UploadedById { get; set; }
    public User? UploadedBy { get; set; }

    public long FileSizeBytes { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;

    public string? Notes { get; set; }
}
