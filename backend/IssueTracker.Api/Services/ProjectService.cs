using IssueTracker.Api.Data;
using IssueTracker.Api.DTOs;
using IssueTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueTracker.Api.Services;

public class ProjectService
{
    private readonly AppDbContext _db;
    private readonly ProjectAuthorizationService _authz;

    public ProjectService(AppDbContext db, ProjectAuthorizationService authz)
    {
        _db = db;
        _authz = authz;
    }

    public async Task<List<ProjectSummaryDto>> GetProjectsForUserAsync(int userId)
    {
        var projectIds = await _db.ProjectMembers
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.ProjectId)
            .ToListAsync();

        var now = DateTime.UtcNow;

        return await _db.Projects
            .Where(p => projectIds.Contains(p.Id))
            .Select(p => new ProjectSummaryDto(
                p.Id,
                p.Name,
                p.Description,
                p.Issues.Count(i => i.Status != IssueStatus.Done),
                p.Issues.Count(i => i.Status != IssueStatus.Done && i.DueDate != null && i.DueDate < now)))
            .ToListAsync();
    }

    public async Task<ProjectSummaryDto> CreateProjectAsync(CreateProjectRequest request, int creatorUserId)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description
        };

        project.Members.Add(new ProjectMember
        {
            UserId = creatorUserId,
            Role = ProjectRole.Admin
        });

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return new ProjectSummaryDto(project.Id, project.Name, project.Description, 0, 0);
    }

    public async Task<List<ProjectMemberDto>> GetMembersAsync(int projectId, int requestingUserId)
    {
        await _authz.RequireMembershipAsync(projectId, requestingUserId);

        return await _db.ProjectMembers
            .Where(pm => pm.ProjectId == projectId)
            .Select(pm => new ProjectMemberDto(pm.UserId, pm.User.Name, pm.User.Email, pm.Role))
            .ToListAsync();
    }

    public async Task AddMemberAsync(int projectId, AddProjectMemberRequest request, int requestingUserId)
    {
        // Only admins can add members
        await _authz.RequireRoleAsync(projectId, requestingUserId, ProjectRole.Admin);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new KeyNotFoundException($"No user found with email {request.Email}.");

        var alreadyMember = await _db.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == user.Id);

        if (alreadyMember)
        {
            throw new InvalidOperationException("This user is already a member of the project.");
        }

        _db.ProjectMembers.Add(new ProjectMember
        {
            ProjectId = projectId,
            UserId = user.Id,
            Role = request.Role
        });

        await _db.SaveChangesAsync();
    }
}
