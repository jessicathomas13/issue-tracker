using IssueTracker.Api.Data;
using IssueTracker.Api.DTOs;
using IssueTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueTracker.Api.Services;

public class CommentService
{
    private readonly AppDbContext _db;
    private readonly ProjectAuthorizationService _authz;

    public CommentService(AppDbContext db, ProjectAuthorizationService authz)
    {
        _db = db;
        _authz = authz;
    }

    public async Task<List<CommentDto>> GetCommentsAsync(int issueId, int requestingUserId)
    {
        var issue = await GetIssueOrThrowAsync(issueId);
        await _authz.RequireMembershipAsync(issue.ProjectId, requestingUserId);

        return await _db.Comments
            .Include(c => c.Author)
            .Where(c => c.IssueId == issueId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, c.Body, c.AuthorId, c.Author.Name, c.CreatedAt))
            .ToListAsync();
    }

    public async Task<CommentDto> AddCommentAsync(int issueId, CreateCommentRequest request, int authorId)
    {
        var issue = await GetIssueOrThrowAsync(issueId);
        await _authz.RequireRoleAsync(issue.ProjectId, authorId, ProjectRole.Member);

        var comment = new Comment
        {
            IssueId = issueId,
            AuthorId = authorId,
            Body = request.Body
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        var author = await _db.Users.FirstAsync(u => u.Id == authorId);
        return new CommentDto(comment.Id, comment.Body, authorId, author.Name, comment.CreatedAt);
    }

    private async Task<Issue> GetIssueOrThrowAsync(int issueId)
    {
        return await _db.Issues.FirstOrDefaultAsync(i => i.Id == issueId)
            ?? throw new KeyNotFoundException($"Issue {issueId} not found.");
    }
}
