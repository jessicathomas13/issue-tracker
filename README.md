# Issue Tracker

A lightweight Jira/Linear-style issue tracker. Backend built with ASP.NET Core, EF Core, and SQL Server; a React + TypeScript frontend consumes the API.

## Backend setup

Requirements: .NET 8 SDK, SQL Server (LocalDB is fine for local dev).

```bash
cd IssueTracker.Api
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

Swagger UI comes up at `https://localhost:<port>/swagger` in development. Register a user via `POST /api/auth/register`, log in via `POST /api/auth/login`, then paste the returned token into Swagger's "Authorize" button (as `Bearer <token>`) to call the rest of the API.

Before running for real, move the `Jwt:Secret` value out of `appsettings.json` and into user secrets (`dotnet user-secrets set "Jwt:Secret" "<value>"`) or an environment variable — it's committed as a placeholder only so the project runs out of the box.

## Running tests

```bash
cd IssueTracker.Tests
dotnet test
```

## Architecture notes

- **Status transitions** are enforced by `IssueStatusValidator`, a standalone state machine rather than inline checks scattered across the service layer. Illegal moves (e.g. Backlog -> Done) are rejected before anything touches the database.
- **Authorization** lives in `ProjectAuthorizationService`. Every project-scoped action (creating an issue, changing status, adding a member) checks project membership and role through this one service, so the rule can't be accidentally skipped in one endpoint.
- **Activity log** entries are written automatically by `IssueService`/`ActivityLogService` whenever status, assignee, or priority changes — never written directly by a controller — so the log stays a trustworthy audit trail rather than something callers can forget to update.
- **Exceptions map to HTTP status codes** centrally via `ExceptionHandlingMiddleware`, instead of repeating try/catch blocks in every controller action.

## Project structure

```
IssueTracker.Api/
  Models/       entities (User, Project, ProjectMember, Issue, Comment, ActivityLogEntry)
  Data/         EF Core DbContext + relationship configuration
  DTOs/         request/response shapes
  Services/     business logic, auth, authorization, activity logging
  Controllers/  API endpoints
IssueTracker.Tests/
  unit tests (status state machine) + authorization tests against EF Core's in-memory provider
frontend/
  React + TypeScript client (see frontend/README.md)
```

## Data model

- A `User` can belong to multiple `Project`s through `ProjectMember`, which also carries a `ProjectRole` (Viewer/Member/Admin) used for authorization.
- An `Issue` belongs to one `Project`, has one `Reporter` and an optional `Assignee` (both `User`s), and can have many `Comment`s and `ActivityLogEntry` rows.
- Deleting a `Project` cascades to its `Issue`s; deleting a `User` does **not** cascade to issues they reported or were assigned (`DeleteBehavior.Restrict`), since silently deleting work history on user deletion would be a bug, not a feature.
