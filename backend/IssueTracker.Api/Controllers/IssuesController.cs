using IssueTracker.Api.DTOs;
using IssueTracker.Api.Models;
using IssueTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IssueTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public class IssuesController : ControllerBase
{
    private readonly IssueService _issueService;

    public IssuesController(IssueService issueService)
    {
        _issueService = issueService;
    }

    [HttpGet("projects/{projectId}/issues")]
    public async Task<ActionResult<List<IssueDto>>> GetIssues(
        int projectId,
        [FromQuery] IssueStatus? status,
        [FromQuery] IssuePriority? priority,
        [FromQuery] int? assigneeId,
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] bool descending = false)
    {
        var filter = new IssueFilterQuery(status, priority, assigneeId, search, sortBy, descending);
        var issues = await _issueService.GetIssuesAsync(projectId, this.GetUserId(), filter);
        return Ok(issues);
    }

    [HttpGet("issues/{issueId}")]
    public async Task<ActionResult<IssueDto>> GetIssue(int issueId)
    {
        var issue = await _issueService.GetIssueAsync(issueId, this.GetUserId());

        return Ok(issue);
    }

    [HttpPost("projects/{projectId}/issues")]
    public async Task<ActionResult<IssueDto>> CreateIssue(int projectId, CreateIssueRequest request)
    {
        var issue = await _issueService.CreateIssueAsync(projectId, request, this.GetUserId());
        return CreatedAtAction(nameof(GetIssues), new { projectId }, issue);
    }

    [HttpPatch("issues/{issueId}")]
    public async Task<ActionResult<IssueDto>> UpdateIssue(int issueId, UpdateIssueRequest request)
    {
        var issue = await _issueService.UpdateIssueAsync(issueId, request, this.GetUserId());
        return Ok(issue);
    }

    [HttpPatch("issues/{issueId}/status")]
    public async Task<ActionResult<IssueDto>> UpdateStatus(int issueId, UpdateIssueStatusRequest request)
    {
        var issue = await _issueService.UpdateStatusAsync(issueId, request, this.GetUserId());
        return Ok(issue);
    }

    [HttpGet("issues/{issueId}/activity")]
    public async Task<ActionResult<List<ActivityLogDto>>> GetActivity(int issueId)
    {
        var activity = await _issueService.GetActivityLogAsync(issueId, this.GetUserId());
        return Ok(activity);
    }
}
