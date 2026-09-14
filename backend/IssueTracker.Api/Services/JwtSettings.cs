namespace IssueTracker.Api.Services;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "IssueTracker.Api";
    public string Audience { get; set; } = "IssueTracker.Client";
    public int ExpiryMinutes { get; set; } = 60 * 8;
}
