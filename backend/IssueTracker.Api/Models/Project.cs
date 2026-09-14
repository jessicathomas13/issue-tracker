namespace IssueTracker.Api.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}

// Join entity: who belongs to a project, and what they're allowed to do in it. Modelled explicitly (rather than a simple many-to-many) so we have somewhere to hang the ProjectRole used by authorization checks.
public class ProjectMember
{
    public int Id { get; set; }

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ProjectRole Role { get; set; } = ProjectRole.Member;
}
