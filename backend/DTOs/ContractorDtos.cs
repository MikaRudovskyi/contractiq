using ContractIQ.Api.Models;

namespace ContractIQ.Api.DTOs;

public record ContractorDto(
    Guid Id,
    string Name,
    string LegalName,
    string Code,
    string Status,
    string Category,
    List<string> Tags,
    string ContactPerson,
    string Email,
    string Phone,
    decimal Rating,
    int ActiveContracts,
    decimal TotalPaid,
    decimal PendingAmount,
    int DocumentsExpiring,
    string Region,
    string? Notes,
    DateTime CreatedAt
);

public record CreateContractorRequest(
    string Name,
    string LegalName,
    string Code,
    string Category,
    string ContactPerson,
    string Email,
    string Phone,
    string Region,
    List<string>? Tags,
    string? Notes
);

public record UpdateContractorRequest(
    string? Name,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Status,
    string? Category,
    List<string>? Tags,
    string? Notes
);
