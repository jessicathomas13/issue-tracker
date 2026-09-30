using IssueTracker.Api.DTOs;
using IssueTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IssueTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly ProjectService _projectService;

    public ProjectsController(ProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectSummaryDto>>> GetMyProjects()
    {
        var projects = await _projectService.GetProjectsForUserAsync(this.GetUserId());
        return Ok(projects);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectSummaryDto>> CreateProject(CreateProjectRequest request)
    {
        var project = await _projectService.CreateProjectAsync(request, this.GetUserId());
        return CreatedAtAction(nameof(GetMyProjects), new { id = project.Id }, project);
    }

    [HttpGet("{projectId}/members")]
    public async Task<ActionResult<List<ProjectMemberDto>>> GetMembers(int projectId)
    {
        var members = await _projectService.GetMembersAsync(projectId, this.GetUserId());
        return Ok(members);
    }

    [HttpPost("{projectId}/members")]
    public async Task<ActionResult> AddMember(int projectId, AddProjectMemberRequest request)
    {
        await _projectService.AddMemberAsync(projectId, request, this.GetUserId());
        return NoContent();
    }

    [HttpPatch("{projectId}/members/{userId}/role")]
    public async Task<ActionResult> UpdateMemberRole(int projectId, int userId, UpdateProjectMemberRoleRequest request)
    {
        await _projectService.UpdateMemberRoleAsync(projectId, userId, request, this.GetUserId());

        return NoContent();
    }
}
