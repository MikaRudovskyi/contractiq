namespace ContractIQ.Api.DTOs;

public record DocumentDto(
    Guid Id,
    Guid? ContractorId,
    Guid? ContractId,
    string? ContractorName,
    string Title,
    string Type,
    string Status,
    DateTime UploadedAt,
    DateTime? ExpiresAt,
    string? UploadedByName,
    long FileSizeBytes,
    string FileName,
    string? Notes
);

// CreateDocumentRequest видалено — завантаження документів тепер відбувається через
// multipart/form-data ендпоінт POST /api/documents/upload (параметри через [FromForm], не JSON DTO).

public record ReviewDocumentRequest(string Decision); // "approve" | "reject"
