namespace ContractIQ.Api.DTOs;

public record PaymentDto(
    Guid Id,
    Guid ContractId,
    string ContractNumber,
    Guid ContractorId,
    string ContractorName,
    Guid? WorkOrderId,
    decimal Amount,
    string Status,
    DateTime ScheduledDate,
    DateTime? PaidDate,
    string Description,
    string? InvoiceNumber,
    string? ApprovedByName,
    DateTime CreatedAt
);

public record CreatePaymentRequest(
    Guid ContractId,
    Guid ContractorId,
    Guid? WorkOrderId,
    decimal Amount,
    DateTime ScheduledDate,
    string Description,
    string? InvoiceNumber
);

public record UpdatePaymentStatusRequest(
    string Status, // scheduled | processing | paid | overdue | disputed
    DateTime? PaidDate
);
