import { apiRequest } from './client'
import type { ProjectMember, ProjectRole, ProjectSummary } from '../types'

export function getProjects(token: string) {
  return apiRequest<ProjectSummary[]>('/projects', { token })
}

export async function createProject(token: string, name: string, description: string) {
  await apiRequest<unknown>('/projects', {
    method: 'POST',
    token,
    body: JSON.stringify({ name, description: description || null }),
  })
}

export function getProjectMembers(token: string, projectId: number) {
  return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, { token })
}

export function addProjectMember(token: string, projectId: number, email: string, role: ProjectRole) {
  return apiRequest<void>(`/projects/${projectId}/members`, {
    method: 'POST',
    token,
    body: JSON.stringify({ email, role }),
  })
}

export function updateProjectMemberRole(token: string, projectId: number, userId: number, role: ProjectRole) {
  return apiRequest<void>(`/projects/${projectId}/members/${userId}/role`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ role }),
    })
}
