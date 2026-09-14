using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace IssueTracker.Api.Controllers;

public static class ControllerExtensions
{
    public static int GetUserId(this ControllerBase controller)
    {
        var raw = controller.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? controller.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (raw is null || !int.TryParse(raw, out var userId))
        {
            throw new UnauthorizedAccessException("Request is missing a valid user identity.");
        }

        return userId;
    }
}
