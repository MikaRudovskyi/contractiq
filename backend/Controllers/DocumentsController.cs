using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Models;
using ContractIQ.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly ContractIqDbContext _db;
    private readonly IActivityService _activity;
    private readonly IFileStorageService _fileStorage;

    public DocumentsController(ContractIqDbContext db, IActivityService activity, IFileStorageService fileStorage)
    {
        _db = db;
        _activity = activity;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] bool? expiringSoon,
        [FromQuery] Guid? contractorId)
    {
        var expiredIds = await _db.Documents
            .Where(d => d.ExpiresAt != null && d.ExpiresAt < DateTime.UtcNow && d.Status != DocumentStatus.Expired)
            .Select(d => d.Id).ToListAsync();

        if (expiredIds.Count > 0)
        {
            await _db.Documents.Where(d => expiredIds.Contains(d.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.Status, DocumentStatus.Expired));
        }

        var query = _db.Documents.AsNoTracking().Include(d => d.Contractor).Include(d => d.UploadedBy).AsQueryable();

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<DocumentType>(type, true, out var t))
            query = query.Where(d => d.Type == t);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(d => d.Title.ToLower().Contains(s) ||
                (d.Contractor != null && d.Contractor.Name.ToLower().Contains(s)));
        }

        if (expiringSoon == true)
        {
            var threshold = DateTime.UtcNow.AddDays(30);
            query = query.Where(d => d.ExpiresAt != null && d.ExpiresAt <= threshold && d.ExpiresAt >= DateTime.UtcNow);
        }

        if (contractorId.HasValue)
            query = query.Where(d => d.ContractorId == contractorId.Value);

        var items = await query.OrderByDescending(d => d.UploadedAt).ToListAsync();
        return Ok(items.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentDto>> GetById(Guid id)
    {
        var d = await _db.Documents.AsNoTracking().Include(x => x.Contractor).Include(x => x.UploadedBy)
            .FirstOrDefaultAsync(x => x.Id == id);
        return d is null ? NotFound() : Ok(MapToDto(d));
    }

    public class UploadDocumentForm
    {
        public IFormFile File { get; set; } = null!;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public Guid? ContractorId { get; set; }
        public Guid? ContractId { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentDto>> Upload([FromForm] UploadDocumentForm form)
    {
        var file = form.File;
        var title = form.Title;
        var type = form.Type;
        var contractorId = form.ContractorId;
        var contractId = form.ContractId;
        var expiresAt = form.ExpiresAt;
        var notes = form.Notes;

        if (contractorId is null && contractId is null)
            return BadRequest(new { message = "Документ повинен бути прив'язаний до підрядника або договору" });

        if (!Enum.TryParse<DocumentType>(type, true, out var docType))
            return BadRequest(new { message = "Невірний тип документа" });

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Файл не передано" });

        string storagePath;
        try
        {
            storagePath = await _fileStorage.SaveAsync(file);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var document = new Document
        {
            ContractorId = contractorId,
            ContractId = contractId,
            Title = title,
            Type = docType,
            ExpiresAt = expiresAt.HasValue ? DateTime.SpecifyKind(expiresAt.Value, DateTimeKind.Utc) : null,
            FileName = file.FileName,
            FileSizeBytes = file.Length,
            StoragePath = storagePath,
            Notes = notes,
            UploadedById = GetUserId(),
            Status = DocumentStatus.Pending
        };

        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        await _activity.LogAsync(ActivityType.Document, "завантажено", document.Title, GetUserId(), document.Id.ToString());

        var full = await _db.Documents.Include(d => d.Contractor).Include(d => d.UploadedBy).FirstAsync(d => d.Id == document.Id);
        return CreatedAtAction(nameof(GetById), new { id = document.Id }, MapToDto(full));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var document = await _db.Documents.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        if (document is null) return NotFound();

        var absolutePath = _fileStorage.GetAbsolutePath(document.StoragePath);
        if (absolutePath is null)
            return NotFound(new { message = "Файл не знайдено на сервері" });

        var contentType = GetContentType(document.FileName);
        var stream = new FileStream(absolutePath, FileMode.Open, FileAccess.Read);
        return File(stream, contentType, document.FileName);
    }

    private static string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    [HttpPost("{id:guid}/review")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<DocumentDto>> Review(Guid id, ReviewDocumentRequest request)
    {
        var document = await _db.Documents.Include(d => d.Contractor).Include(d => d.UploadedBy).FirstOrDefaultAsync(d => d.Id == id);
        if (document is null) return NotFound();

        document.Status = request.Decision.Equals("approve", StringComparison.OrdinalIgnoreCase)
            ? DocumentStatus.Approved
            : DocumentStatus.Rejected;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(document));
    }

    private static DocumentDto MapToDto(Document d) => new(
        d.Id, d.ContractorId, d.ContractId, d.Contractor?.Name,
        d.Title, d.Type.ToString(), d.Status.ToString(),
        d.UploadedAt, d.ExpiresAt, d.UploadedBy?.Name,
        d.FileSizeBytes, d.FileName, d.Notes
    );

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
