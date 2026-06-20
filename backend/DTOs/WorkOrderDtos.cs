namespace ContractIQ.Api.DTOs;

public record WorkOrderDto(
    Guid Id,
    Guid ContractId,
    string ContractNumber,
    string ContractorName,
    string Title,
    string Description,
    string Status,
    decimal Amount,
    DateTime SubmittedAt,
    DateTime Deadline,
    DateTime? ReviewedAt,
    string? ReviewedByName,
    int AttachmentsCount,
    string? Notes
);

public record CreateWorkOrderRequest(
    Guid ContractId,
    string Title,
    string Description,
    decimal Amount,
    DateTime Deadline
);

public record ReviewWorkOrderRequest(
    string Decision, // "accept" | "reject"
    string? Notes
);
