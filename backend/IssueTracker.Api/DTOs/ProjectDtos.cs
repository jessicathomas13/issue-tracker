using IssueTracker.Api.Models;

namespace IssueTracker.Api.DTOs;

public record CreateProjectRequest(string Name, string? Description);

public record ProjectSummaryDto(int Id, string Name, string? Description, int OpenIssueCount, int OverdueIssueCount);

public record ProjectMemberDto(int UserId, string Name, string Email, ProjectRole Role);

public record AddProjectMemberRequest(string Email, ProjectRole Role);
