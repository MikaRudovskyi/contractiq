namespace ContractIQ.Api.Models;

public enum ContractorStatus
{
    Pending,
    Active,
    Suspended,
    Blacklisted
}

public enum ContractorCategory
{
    Construction,
    Electrical,
    Plumbing,
    Hvac,
    It,
    Logistics,
    Cleaning,
    Security,
    Design,
    Other
}

public enum ContractStatus
{
    Draft,
    Active,
    Completed,
    Disputed,
    Terminated
}

public enum ContractType
{
    Fixed,
    TimeMaterial,
    Milestone
}

public enum WorkOrderStatus
{
    Open,
    InProgress,
    Review,
    Accepted,
    Rejected
}

public enum DocumentType
{
    Contract,
    License,
    Insurance,
    TaxCertificate,
    WorkOrder,
    CompletionAct,
    Invoice,
    Other
}

public enum DocumentStatus
{
    Pending,
    Approved,
    Rejected,
    Expired
}

public enum PaymentStatus
{
    Scheduled,
    Processing,
    Paid,
    Overdue,
    Disputed
}

public enum UserRole
{
    Admin,
    Manager,
    Finance,
    Viewer
}
