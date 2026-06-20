using ContractIQ.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Data;

public class ContractIqDbContext : DbContext
{
    public ContractIqDbContext(DbContextOptions<ContractIqDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Contractor> Contractors => Set<Contractor>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ── User ──
        b.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
        });

        // ── Contractor ──
        b.Entity<Contractor>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Category).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Rating).HasPrecision(3, 2);
            e.Property(x => x.Tags).HasColumnType("text[]");
        });

        // ── Project ──
        b.Entity<Project>(e =>
        {
            e.HasIndex(x => x.Name);
        });

        // ── Contract ──
        b.Entity<Contract>(e =>
        {
            e.HasIndex(x => x.Number).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.TotalValue).HasPrecision(14, 2);
            e.Property(x => x.PaidAmount).HasPrecision(14, 2);
            e.Property(x => x.Tags).HasColumnType("text[]");

            e.HasOne(x => x.Contractor)
                .WithMany(c => c.Contracts)
                .HasForeignKey(x => x.ContractorId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Manager)
                .WithMany(u => u.ManagedContracts)
                .HasForeignKey(x => x.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.Project)
                .WithMany(p => p.Contracts)
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── WorkOrder ──
        b.Entity<WorkOrder>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Amount).HasPrecision(14, 2);

            e.HasOne(x => x.Contract)
                .WithMany(c => c.WorkOrders)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Document ──
        b.Entity<Document>(e =>
        {
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

            e.HasOne(x => x.Contractor)
                .WithMany(c => c.Documents)
                .HasForeignKey(x => x.ContractorId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Contract)
                .WithMany(c => c.Documents)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.UploadedBy)
                .WithMany()
                .HasForeignKey(x => x.UploadedById)
                .OnDelete(DeleteBehavior.SetNull);

            // A document must belong to at least a contractor or a contract
            e.ToTable(t => t.HasCheckConstraint(
                "CK_Document_HasOwner",
                "\"ContractorId\" IS NOT NULL OR \"ContractId\" IS NOT NULL"));
        });

        // ── Payment ──
        b.Entity<Payment>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Amount).HasPrecision(14, 2);

            e.HasOne(x => x.Contract)
                .WithMany(c => c.Payments)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Contractor)
                .WithMany(c => c.Payments)
                .HasForeignKey(x => x.ContractorId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.WorkOrder)
                .WithMany(w => w.Payments)
                .HasForeignKey(x => x.WorkOrderId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.ApprovedBy)
                .WithMany()
                .HasForeignKey(x => x.ApprovedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── ActivityLog ──
        b.Entity<ActivityLog>(e =>
        {
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Actor).WithMany().HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => x.Timestamp);
        });
    }
}
