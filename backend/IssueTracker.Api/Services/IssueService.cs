using IssueTracker.Api.Data;
using IssueTracker.Api.DTOs;
using IssueTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueTracker.Api.Services;

public class IssueService
{
    private readonly AppDbContext _db;
    private readonly ProjectAuthorizationService _authz;
    private readonly ActivityLogService _activityLog;

    public IssueService(AppDbContext db, ProjectAuthorizationService authz, ActivityLogService activityLog)
    {
        _db = db;
        _authz = authz;
        _activityLog = activityLog;
    }

    public async Task<List<IssueDto>> GetIssuesAsync(int projectId, int requestingUserId, IssueFilterQuery filter)
    {
        await _authz.RequireMembershipAsync(projectId, requestingUserId);

        var query = _db.Issues
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .Where(i => i.ProjectId == projectId)
            .AsQueryable();

        if (filter.Status is not null)
            query = query.Where(i => i.Status == filter.Status);

        if (filter.Priority is not null)
            query = query.Where(i => i.Priority == filter.Priority);

        if (filter.AssigneeId is not null)
            query = query.Where(i => i.AssigneeId == filter.AssigneeId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(i => i.Title.Contains(term) || (i.Description != null && i.Description.Contains(term)));
        }

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "priority" => filter.Descending ? query.OrderByDescending(i => i.Priority) : query.OrderBy(i => i.Priority),
            "duedate" => filter.Descending ? query.OrderByDescending(i => i.DueDate) : query.OrderBy(i => i.DueDate),
            "status" => filter.Descending ? query.OrderByDescending(i => i.Status) : query.OrderBy(i => i.Status),
            _ => filter.Descending ? query.OrderByDescending(i => i.UpdatedAt) : query.OrderBy(i => i.UpdatedAt)
        };

        var issues = await query.ToListAsync();
        return issues.Select(ToDto).ToList();
    }

    public async Task<IssueDto> GetIssueAsync(int issueId, int requestingUserId)
    {
        var issue = await GetIssueOrThrowAsync(issueId);

        await _authz.RequireMembershipAsync(
            issue.ProjectId,
            requestingUserId
        );

        return await LoadDtoAsync(issueId);
    }

    public async Task<IssueDto> CreateIssueAsync(int projectId, CreateIssueRequest request, int reporterId)
    {
        await _authz.RequireRoleAsync(projectId, reporterId, ProjectRole.Member);

        if (request.AssigneeId is not null)
        {
            await EnsureAssigneeIsProjectMemberAsync(projectId, request.AssigneeId.Value);
        }

        var issue = new Issue
        {
            ProjectId = projectId,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            AssigneeId = request.AssigneeId,
            DueDate = request.DueDate,
            ReporterId = reporterId,
            Status = IssueStatus.Backlog
        };

        _db.Issues.Add(issue);
        await _db.SaveChangesAsync();

        _activityLog.RecordCreated(issue, reporterId);
        await _db.SaveChangesAsync();

        return await LoadDtoAsync(issue.Id);
    }

    public async Task<IssueDto> UpdateStatusAsync(int issueId, UpdateIssueStatusRequest request, int actorId)
    {
        var issue = await GetIssueOrThrowAsync(issueId);
        await _authz.RequireRoleAsync(issue.ProjectId, actorId, ProjectRole.Member);

        // This is the rule that matters most: reject the move before anything is written, so an illegal transition never reaches the database.
        IssueStatusValidator.EnsureValidTransition(issue.Status, request.Status);

        var previousStatus = issue.Status;
        issue.Status = request.Status;
        issue.UpdatedAt = DateTime.UtcNow;

        _activityLog.RecordStatusChange(issue, actorId, previousStatus, request.Status);
        await _db.SaveChangesAsync();

        return await LoadDtoAsync(issue.Id);
    }

    public async Task<IssueDto> UpdateIssueAsync(int issueId, UpdateIssueRequest request, int actorId)
    {
        var issue = await GetIssueOrThrowAsync(issueId);
        await _authz.RequireRoleAsync(issue.ProjectId, actorId, ProjectRole.Member);

        if (request.Title is not null) issue.Title = request.Title;
        if (request.Description is not null) issue.Description = request.Description;

        if (request.Priority is not null && request.Priority != issue.Priority)
        {
            _activityLog.RecordPriorityChange(issue, actorId, issue.Priority, request.Priority.Value);
            issue.Priority = request.Priority.Value;
        }

        if (request.DueDate is not null) issue.DueDate = request.DueDate;

        if (request.AssigneeId != issue.AssigneeId)
        {
            string? fromName = issue.Assignee?.Name;
            string? toName = null;

            if (request.AssigneeId is not null)
            {
                var assignee = await EnsureAssigneeIsProjectMemberAsync(issue.ProjectId, request.AssigneeId.Value);
                toName = assignee.Name;
            }

            _activityLog.RecordAssigneeChange(issue, actorId, fromName, toName);
            issue.AssigneeId = request.AssigneeId;
        }

        issue.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await LoadDtoAsync(issue.Id);
    }

    public async Task<List<ActivityLogDto>> GetActivityLogAsync(int issueId, int requestingUserId)
    {
        var issue = await GetIssueOrThrowAsync(issueId);
        await _authz.RequireMembershipAsync(issue.ProjectId, requestingUserId);

        return await _db.ActivityLogEntries
            .Include(a => a.Actor)
            .Where(a => a.IssueId == issueId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ActivityLogDto(a.Id, a.Description, a.Actor.Name, a.CreatedAt))
            .ToListAsync();
    }

    private async Task<User> EnsureAssigneeIsProjectMemberAsync(int projectId, int userId)
    {
        var membership = await _db.ProjectMembers
            .Include(pm => pm.User)
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

        if (membership is null)
        {
            throw new InvalidOperationException("Cannot assign an issue to someone who isn't a project member.");
        }

        return membership.User;
    }

    private async Task<Issue> GetIssueOrThrowAsync(int issueId)
    {
        return await _db.Issues.Include(i => i.Assignee).FirstOrDefaultAsync(i => i.Id == issueId)
            ?? throw new KeyNotFoundException($"Issue {issueId} not found.");
    }

    private async Task<IssueDto> LoadDtoAsync(int issueId)
    {
        var issue = await _db.Issues
            .Include(i => i.Assignee)
            .Include(i => i.Reporter)
            .FirstAsync(i => i.Id == issueId);

        return ToDto(issue);
    }

    private static IssueDto ToDto(Issue i) => new(
        i.Id,
        i.Title,
        i.Description,
        i.Status,
        i.Priority,
        i.DueDate,
        i.Status != IssueStatus.Done && i.DueDate is not null && i.DueDate < DateTime.UtcNow,
        i.ProjectId,
        i.AssigneeId,
        i.Assignee?.Name,
        i.ReporterId,
        i.Reporter.Name,
        i.CreatedAt,
        i.UpdatedAt);
}
