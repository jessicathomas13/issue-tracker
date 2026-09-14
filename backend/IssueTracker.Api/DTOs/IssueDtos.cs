using IssueTracker.Api.Models;

namespace IssueTracker.Api.DTOs;

public record CreateIssueRequest(string Title, string? Description, IssuePriority Priority, int? AssigneeId, DateTime? DueDate);

public record UpdateIssueStatusRequest(IssueStatus Status);

public record UpdateIssueRequest(string? Title, string? Description, IssuePriority? Priority, int? AssigneeId, DateTime? DueDate);

public record IssueDto(
    int Id,
    string Title,
    string? Description,
    IssueStatus Status,
    IssuePriority Priority,
    DateTime? DueDate,
    bool IsOverdue,
    int ProjectId,
    int? AssigneeId,
    string? AssigneeName,
    int ReporterId,
    string ReporterName,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CreateCommentRequest(string Body);

public record CommentDto(int Id, string Body, int AuthorId, string AuthorName, DateTime CreatedAt);

public record ActivityLogDto(int Id, string Description, string ActorName, DateTime CreatedAt);

public record IssueFilterQuery(IssueStatus? Status, IssuePriority? Priority, int? AssigneeId, string? Search, string? SortBy, bool Descending = false);
