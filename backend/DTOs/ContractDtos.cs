namespace ContractIQ.Api.DTOs;

public record ContractDto(
    Guid Id,
    string Number,
    string Title,
    Guid ContractorId,
    string ContractorName,
    string Status,
    string Type,
    decimal TotalValue,
    decimal PaidAmount,
    DateTime StartDate,
    DateTime EndDate,
    Guid? ManagerId,
    string? ManagerName,
    Guid? ProjectId,
    string? ProjectName,
    int CompletionPercent,
    List<string> Tags,
    int WorkOrdersCount,
    int DocumentsCount,
    DateTime CreatedAt
);

public record CreateContractRequest(
    string Number,
    string Title,
    Guid ContractorId,
    string Type,
    decimal TotalValue,
    DateTime StartDate,
    DateTime EndDate,
    Guid? ProjectId,
    List<string>? Tags
);

public record UpdateContractRequest(
    string? Title,
    string? Status,
    decimal? TotalValue,
    DateTime? EndDate,
    int? CompletionPercent,
    List<string>? Tags
);
