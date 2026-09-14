namespace IssueTracker.Api.Models;

public class Comment
{
    public int Id { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int IssueId { get; set; }
    public Issue Issue { get; set; } = null!;

    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
}

// One row per meaningful change to an issue. Written automatically by IssueService whenever status/assignee/priority changes.
public class ActivityLogEntry
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty; // e.g. "Status changed from Backlog to In Progress"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int IssueId { get; set; }
    public Issue Issue { get; set; } = null!;

    public int ActorId { get; set; }
    public User Actor { get; set; } = null!;
}
