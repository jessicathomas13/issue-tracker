export type IssueStatus = 'Backlog' | 'InProgress' | 'InReview' | 'Done'
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type ProjectRole = 'Viewer' | 'Member' | 'Admin'

export interface AuthResponse {
  token: string
  userId: number
  name: string
  email: string
}

export interface ProjectSummary {
  id: number
  name: string
  description: string | null
  openIssueCount: number
  overdueIssueCount: number
}

export interface ProjectMember {
  userId: number
  name: string
  email: string
  role: ProjectRole
}

export interface Issue {
  id: number
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  dueDate: string | null
  isOverdue: boolean
  projectId: number
  assigneeId: number | null
  assigneeName: string | null
  reporterId: number
  reporterName: string
  createdAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: number
  description: string
  actorName: string
  createdAt: string
}

export interface Comment {
  id: number
  body: string
  authorId: number
  authorName: string
  createdAt: string
}

export interface IssueFilters {
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: number
  search?: string
  sortBy?: 'priority' | 'duedate' | 'status' | 'updatedAt'
  descending?: boolean
}
