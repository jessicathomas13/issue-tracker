using IssueTracker.Api.Data;
using IssueTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueTracker.Api.Services;

public class ForbiddenProjectAccessException : Exception
{
    public ForbiddenProjectAccessException(string message) : base(message) { }
}

/// <summary>
/// Central place for "is this user allowed to do this in this project" checks.
/// Kept separate from IssueService/ProjectService so the rule isn't duplicated or accidentally skipped in one of several endpoints.
/// </summary>
public class ProjectAuthorizationService
{
    private readonly AppDbContext _db;

    public ProjectAuthorizationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ProjectRole> RequireMembershipAsync(int projectId, int userId)
    {
        var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

        if (membership is null)
        {
            throw new ForbiddenProjectAccessException("You do not have access to this project.");
        }

        return membership.Role;
    }

    public async Task RequireRoleAsync(int projectId, int userId, ProjectRole minimumRole)
    {
        var role = await RequireMembershipAsync(projectId, userId);
        if (role < minimumRole)
        {
            throw new ForbiddenProjectAccessException(
                $"This action requires at least {minimumRole} access to the project.");
        }
    }
}
