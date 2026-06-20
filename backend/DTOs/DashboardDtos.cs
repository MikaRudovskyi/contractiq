namespace ContractIQ.Api.DTOs;

public record DashboardStatsDto(
    int ActiveContractors,
    int ActiveContracts,
    int PendingWorkOrders,
    int OverduePayments,
    decimal TotalContractValue,
    decimal PaidThisMonth,
    int DocumentsExpiringSoon,
    int ContractsEndingSoon
);

public record ChartPointDto(string Month, decimal Paid, decimal Scheduled);

public record ActivityItemDto(
    Guid Id,
    string Type,
    string Action,
    string Subject,
    string Actor,
    DateTime Timestamp
);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, UserDto User);

public record UserDto(Guid Id, string Name, string Email, string Role);
