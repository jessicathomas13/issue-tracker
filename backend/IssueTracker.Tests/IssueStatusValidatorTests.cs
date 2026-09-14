using IssueTracker.Api.Models;
using IssueTracker.Api.Services;
using Xunit;

namespace IssueTracker.Tests;

public class IssueStatusValidatorTests
{
    [Theory]
    [InlineData(IssueStatus.Backlog, IssueStatus.InProgress)]
    [InlineData(IssueStatus.InProgress, IssueStatus.InReview)]
    [InlineData(IssueStatus.InReview, IssueStatus.Done)]
    [InlineData(IssueStatus.InReview, IssueStatus.InProgress)]
    [InlineData(IssueStatus.InProgress, IssueStatus.Backlog)]
    [InlineData(IssueStatus.Done, IssueStatus.InProgress)]
    public void CanTransition_AllowsValidMoves(IssueStatus from, IssueStatus to)
    {
        Assert.True(IssueStatusValidator.CanTransition(from, to));
    }

    [Theory]
    [InlineData(IssueStatus.Backlog, IssueStatus.Done)]
    [InlineData(IssueStatus.Backlog, IssueStatus.InReview)]
    [InlineData(IssueStatus.Done, IssueStatus.Backlog)]
    [InlineData(IssueStatus.InProgress, IssueStatus.Done)]
    [InlineData(IssueStatus.Backlog, IssueStatus.Backlog)]
    public void CanTransition_RejectsInvalidMoves(IssueStatus from, IssueStatus to)
    {
        Assert.False(IssueStatusValidator.CanTransition(from, to));
    }

    [Fact]
    public void EnsureValidTransition_ThrowsWithFromAndToInMessage()
    {
        var ex = Assert.Throws<InvalidStatusTransitionException>(() => IssueStatusValidator.EnsureValidTransition(IssueStatus.Backlog, IssueStatus.Done));

        Assert.Contains("Backlog", ex.Message);
        Assert.Contains("Done", ex.Message);
    }

    [Fact]
    public void EnsureValidTransition_DoesNotThrowForValidMove()
    {
        var exception = Record.Exception(() => IssueStatusValidator.EnsureValidTransition(IssueStatus.Backlog, IssueStatus.InProgress));

        Assert.Null(exception);
    }
}
