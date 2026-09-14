import { apiRequest } from './client'
import type { ActivityLog, Comment, Issue, IssueFilters, IssuePriority, IssueStatus } from '../types'

export function getIssues(token: string, projectId: number, filters: IssueFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.assigneeId) params.set('assigneeId', String(filters.assigneeId))
  if (filters.search) params.set('search', filters.search)
  if (filters.sortBy && filters.sortBy !== 'updatedAt') params.set('sortBy', filters.sortBy)
  if (filters.descending) params.set('descending', 'true')
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest<Issue[]>(`/projects/${projectId}/issues${query}`, { token })
}

export function getIssue(token: string, issueId: number) {
  return apiRequest<Issue>(`/issues/${issueId}`, {token})
}

export function createIssue(
  token: string,
  projectId: number,
  request: {
    title: string
    description?: string
    priority: IssuePriority
    assigneeId?: number | null
    dueDate?: string | null
  },
) {
  return apiRequest<Issue>(`/projects/${projectId}/issues`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      ...request,
      description: request.description || null,
      assigneeId: request.assigneeId ?? null,
      dueDate: request.dueDate || null,
    }),
  })
}

export function updateIssueStatus(token: string, issueId: number, status: IssueStatus) {
  return apiRequest<Issue>(`/issues/${issueId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  })
}

export function updateIssue(
  token: string,
  issueId: number,
  request: {
    title?: string
    description?: string
    priority?: IssuePriority
    assigneeId?: number | null
    dueDate?: string | null
  },
) {
  return apiRequest<Issue>(`/issues/${issueId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(request),
  })
}

export function getIssueActivity(token: string, issueId: number) {
  return apiRequest<ActivityLog[]>(`/issues/${issueId}/activity`, { token })
}

export function getComments(token: string, issueId: number) {
  return apiRequest<Comment[]>(`/issues/${issueId}/comments`, { token })
}

export function addComment(token: string, issueId: number, body: string) {
  return apiRequest<Comment>(`/issues/${issueId}/comments`, {
    method: 'POST',
    token,
    body: JSON.stringify({ body }),
  })
}
