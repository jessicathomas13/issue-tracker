using IssueTracker.Api.Data;
using IssueTracker.Api.Models;

namespace IssueTracker.Api.Services;

/// <summary>
/// Writes activity log entries. Called from IssueService whenever a tracked field changes (never called directly from a controller) so the log stays a reliable record rather than something callers can forget to update.
/// </summary>
public class ActivityLogService
{
    private readonly AppDbContext _db;

    public ActivityLogService(AppDbContext db)
    {
        _db = db;
    }

    public void RecordStatusChange(Issue issue, int actorId, IssueStatus from, IssueStatus to)
        => Record(issue, actorId, $"changed status from {from} to {to}");

    public void RecordAssigneeChange(Issue issue, int actorId, string? fromName, string? toName)
        => Record(issue, actorId,
            fromName is null
                ? $"assigned the issue to {toName}"
                : toName is null
                    ? $"unassigned the issue (was {fromName})"
                    : $"reassigned the issue from {fromName} to {toName}");

    public void RecordPriorityChange(Issue issue, int actorId, IssuePriority from, IssuePriority to)
        => Record(issue, actorId, $"changed priority from {from} to {to}");

    public void RecordCreated(Issue issue, int actorId)
        => Record(issue, actorId, "created the issue");

    private void Record(Issue issue, int actorId, string description)
    {
        _db.ActivityLogEntries.Add(new ActivityLogEntry
        {
            IssueId = issue.Id,
            ActorId = actorId,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
    }
}
