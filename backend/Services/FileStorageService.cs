namespace ContractIQ.Api.Services;

public interface IFileStorageService
{
    /// <summary>
    /// Зберігає файл на диску під унікальним ім'ям і повертає відносний шлях,
    /// який слід зберегти в полі Document.StoragePath.
    /// </summary>
    Task<string> SaveAsync(IFormFile file, CancellationToken ct = default);

    /// <summary>
    /// Повертає абсолютний шлях на диску для відносного StoragePath, або null якщо файл не існує.
    /// </summary>
    string? GetAbsolutePath(string storagePath);

    void Delete(string storagePath);
}

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    // Дозволені розширення — захист від завантаження виконуваних/скриптових файлів.
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".zip"
    };

    private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 МБ

    public LocalFileStorageService(IConfiguration config, IWebHostEnvironment env)
    {
        var configuredPath = config["FileStorage:RootPath"];
        _rootPath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(env.ContentRootPath, "App_Data", "documents")
            : configuredPath;

        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(IFormFile file, CancellationToken ct = default)
    {
        if (file.Length == 0)
            throw new InvalidOperationException("Файл порожній");

        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException($"Файл перевищує максимальний розмір {MaxFileSizeBytes / 1024 / 1024} МБ");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
            throw new InvalidOperationException($"Тип файлу {extension} не підтримується. Дозволено: {string.Join(", ", AllowedExtensions)}");

        // Унікальне ім'я на диску, щоб уникнути колізій і обходу шляхів (path traversal).
        var safeFileName = $"{Guid.NewGuid():N}{extension}";

        // Розкладаємо по підпапках за датою, щоб одна директорія не розросталась до десятків тисяч файлів.
        var now = DateTime.UtcNow;
        var subFolder = Path.Combine(now.Year.ToString(), now.Month.ToString("D2"));
        var targetDir = Path.Combine(_rootPath, subFolder);
        Directory.CreateDirectory(targetDir);

        var fullPath = Path.Combine(targetDir, safeFileName);

        await using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        // Відносний шлях, який зберігаємо в БД — переносимий між машинами/середовищами (завжди з '/').
        return Path.Combine(subFolder, safeFileName).Replace(Path.DirectorySeparatorChar, '/').Replace('\\', '/');
    }

    public string? GetAbsolutePath(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return null;

        // Захист від path traversal: забороняємо ".." у відносному шляху.
        if (storagePath.Contains("..")) return null;

        var fullPath = Path.Combine(_rootPath, storagePath.Replace('/', Path.DirectorySeparatorChar));
        return File.Exists(fullPath) ? fullPath : null;
    }

    public void Delete(string storagePath)
    {
        var path = GetAbsolutePath(storagePath);
        if (path is not null) File.Delete(path);
    }
}
