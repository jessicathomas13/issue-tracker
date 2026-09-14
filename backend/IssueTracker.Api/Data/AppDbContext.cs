using IssueTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ActivityLogEntry> ActivityLogEntries => Set<ActivityLogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // A user can belong to the same project only once.
        modelBuilder.Entity<ProjectMember>().HasIndex(pm => new { pm.ProjectId, pm.UserId }).IsUnique();

        modelBuilder.Entity<ProjectMember>().HasOne(pm => pm.Project).WithMany(p => p.Members).HasForeignKey(pm => pm.ProjectId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProjectMember>().HasOne(pm => pm.User).WithMany(u => u.ProjectMemberships).HasForeignKey(pm => pm.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Issue>().HasOne(i => i.Project).WithMany(p => p.Issues).HasForeignKey(i => i.ProjectId).OnDelete(DeleteBehavior.Cascade);

        // Restrict, not cascade: deleting a user shouldn't silently delete every issue they reported or were assigned. Reassign/null it out first.
        modelBuilder.Entity<Issue>().HasOne(i => i.Assignee).WithMany(u => u.AssignedIssues).HasForeignKey(i => i.AssigneeId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Issue>().HasOne(i => i.Reporter).WithMany().HasForeignKey(i => i.ReporterId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comment>().HasOne(c => c.Issue).WithMany(i => i.Comments).HasForeignKey(c => c.IssueId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>().HasOne(c => c.Author).WithMany(u => u.Comments).HasForeignKey(c => c.AuthorId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActivityLogEntry>().HasOne(a => a.Issue).WithMany(i => i.ActivityLog).HasForeignKey(a => a.IssueId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityLogEntry>().HasOne(a => a.Actor).WithMany().HasForeignKey(a => a.ActorId).OnDelete(DeleteBehavior.Restrict);

        // Store enums as their string name in SQL Server instead of an int, so the database is self-describing if anyone queries it directly.
        modelBuilder.Entity<Issue>().Property(i => i.Status).HasConversion<string>().HasMaxLength(20);

        modelBuilder.Entity<Issue>().Property(i => i.Priority).HasConversion<string>().HasMaxLength(20);

        modelBuilder.Entity<ProjectMember>().Property(pm => pm.Role).HasConversion<string>().HasMaxLength(20);
    }
}
