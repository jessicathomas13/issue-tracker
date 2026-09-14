using IssueTracker.Api.DTOs;
using IssueTracker.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IssueTracker.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/issues/{issueId}/comments")]
public class CommentsController : ControllerBase
{
    private readonly CommentService _commentService;

    public CommentsController(CommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CommentDto>>> GetComments(int issueId)
    {
        var comments = await _commentService.GetCommentsAsync(issueId, this.GetUserId());
        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<CommentDto>> AddComment(int issueId, CreateCommentRequest request)
    {
        var comment = await _commentService.AddCommentAsync(issueId, request, this.GetUserId());
        return Ok(comment);
    }
}
