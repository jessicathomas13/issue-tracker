using IssueTracker.Api.Models;

namespace IssueTracker.Api.Services;

public class InvalidStatusTransitionException : Exception
{
    public InvalidStatusTransitionException(IssueStatus from, IssueStatus to)
        : base($"Cannot move an issue from {from} to {to}.") { }
}

/// <summary>
/// Encodes which issue status transitions are legal. Kept as a small, standalone, easily-unit-tested class rather than inline "if" checks scattered through the service layer.
///
/// Rules:
///  - Backlog -> InProgress, InProgress -> InReview, InReview -> Done: normal forward flow.
///  - InReview -> InProgress: reviewer sends it back for changes.
///  - InProgress -> Backlog: work gets deprioritized.
///  - Done -> InProgress: reopening a completed issue.
///  - Everything else (e.g. Backlog -> Done, Done -> Backlog, same -> same) is rejected.
/// </summary>
public static class IssueStatusValidator
{
    private static readonly Dictionary<IssueStatus, HashSet<IssueStatus>> AllowedTransitions = new()
    {
        [IssueStatus.Backlog] = new() { IssueStatus.InProgress },
        [IssueStatus.InProgress] = new() { IssueStatus.InReview, IssueStatus.Backlog },
        [IssueStatus.InReview] = new() { IssueStatus.Done, IssueStatus.InProgress },
        [IssueStatus.Done] = new() { IssueStatus.InProgress },
    };

    public static bool CanTransition(IssueStatus from, IssueStatus to)
    {
        if (from == to) return false;
        return AllowedTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to);
    }

    // Throws if the transition isn't legal; no-op if it is
    public static void EnsureValidTransition(IssueStatus from, IssueStatus to)
    {
        if (!CanTransition(from, to))
        {
            throw new InvalidStatusTransitionException(from, to);
        }
    }
}
