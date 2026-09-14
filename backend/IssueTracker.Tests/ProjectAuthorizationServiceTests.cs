using IssueTracker.Api.Data;
using IssueTracker.Api.Models;
using IssueTracker.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace IssueTracker.Tests;

public class ProjectAuthorizationServiceTests
{
    private static AppDbContext BuildInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task RequireMembershipAsync_ThrowsForNonMember()
    {
        await using var db = BuildInMemoryContext();
        var project = new Project { Name = "Test Project" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        var authz = new ProjectAuthorizationService(db);

        // userId 999 was never added as a ProjectMember for this project.
        await Assert.ThrowsAsync<ForbiddenProjectAccessException>(() => authz.RequireMembershipAsync(project.Id, userId: 999));
    }

    [Fact]
    public async Task RequireRoleAsync_ThrowsWhenMemberRoleIsBelowMinimum()
    {
        await using var db = BuildInMemoryContext();
        var user = new User { Name = "Viewer", Email = "viewer@test.com", PasswordHash = "x" };
        var project = new Project { Name = "Test Project" };
        db.Users.Add(user);
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        db.ProjectMembers.Add(new ProjectMember { ProjectId = project.Id, UserId = user.Id, Role = ProjectRole.Viewer });
        await db.SaveChangesAsync();

        var authz = new ProjectAuthorizationService(db);

        // A Viewer can't perform an action that requires at least Member access.
        await Assert.ThrowsAsync<ForbiddenProjectAccessException>(() => authz.RequireRoleAsync(project.Id, user.Id, ProjectRole.Member));
    }

    [Fact]
    public async Task RequireRoleAsync_SucceedsWhenRoleMeetsMinimum()
    {
        await using var db = BuildInMemoryContext();
        var user = new User { Name = "Admin", Email = "admin@test.com", PasswordHash = "x" };
        var project = new Project { Name = "Test Project" };
        db.Users.Add(user);
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        db.ProjectMembers.Add(new ProjectMember { ProjectId = project.Id, UserId = user.Id, Role = ProjectRole.Admin });
        await db.SaveChangesAsync();

        var authz = new ProjectAuthorizationService(db);

        var exception = await Record.ExceptionAsync(() => authz.RequireRoleAsync(project.Id, user.Id, ProjectRole.Member));

        Assert.Null(exception);
    }
}
