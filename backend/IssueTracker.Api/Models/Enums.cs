namespace IssueTracker.Api.Models;

public enum IssueStatus
{
    Backlog = 0,
    InProgress = 1,
    InReview = 2,
    Done = 3
}

public enum IssuePriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public enum ProjectRole
{
    Viewer = 0,
    Member = 1,
    Admin = 2
}
