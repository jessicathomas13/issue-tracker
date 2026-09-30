# Issue Tracker

Full-stack issue tracking application built with ASP.NET Core, React, TypeScript, Entity Framework Core, and SQL Server.

The app supports project-based permissions, issue workflows, comments, filtering, and activity history.

## Features

- JWT authentication
- Project-level roles: Viewer, Member, Admin
- Create and manage projects
- Create and update issues
- Assign users and set priorities
- Controlled issue status transitions
- Comments and issue activity history
- Search and filter issues
- Project membership management
- Role-based authorization enforced by the API
- Centralized exception handling
- Unit tests for business rules and authorization

## Tech Stack

**Backend**
- C#
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- JWT authentication
- xUnit

**Frontend**
- React
- TypeScript
- Vite
- React Router

## Issue Workflow

Issues follow a controlled workflow:

```text
Backlog ↔ In Progress ↔ In Review → Done
                 ↑                  |
                 └──────────────────┘
