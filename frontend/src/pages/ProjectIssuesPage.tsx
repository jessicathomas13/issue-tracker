import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createIssue, getIssues, updateIssueStatus } from '../api/issues'
import { getProjectMembers } from '../api/projects'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Issue, IssuePriority, IssueStatus, ProjectMember, ProjectRole } from '../types'

const statusOrder: IssueStatus[] = ['Backlog', 'InProgress', 'InReview', 'Done']
const priorityOrder: IssuePriority[] = ['Low', 'Medium', 'High', 'Urgent']

function prettyStatus(status: IssueStatus) {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function ProjectIssuesPage() {
  const { projectId } = useParams()
  const id = Number(projectId)
  const { auth } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<IssueStatus | ''>('')
  const [priority, setPriority] = useState<IssuePriority | ''>('')
  const [showCreate, setShowCreate] = useState(false)

  const myRole: ProjectRole | undefined = members.find((member) => member.userId === auth?.userId)?.role
  const canEdit = myRole === 'Member' || myRole === 'Admin'

  async function loadData() {
    if (!auth || !Number.isFinite(id)) return
    setLoading(true)
    setError('')
    try {
      const [issueData, memberData] = await Promise.all([
        getIssues(auth.token, id),
        getProjectMembers(auth.token, id),
      ])
      setIssues(issueData)
      setMembers(memberData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load project data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [auth, id])

  const filteredIssues = useMemo(() => {
    const term = search.trim().toLowerCase()
    return issues.filter((issue) => {
      if (status && issue.status !== status) return false
      if (priority && issue.priority !== priority) return false
      if (term && !issue.title.toLowerCase().includes(term) && !issue.description?.toLowerCase().includes(term)) return false
      return true
    })
  }, [issues, search, status, priority])

  async function moveIssue(issue: Issue, nextStatus: IssueStatus) {
    if (!auth || !canEdit || nextStatus === issue.status) return
    setError('')
    try {
      const updated = await updateIssueStatus(auth.token, issue.id, nextStatus)
      setIssues((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That status transition is not allowed.')
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header compact">
        <div>
          <span className="eyebrow">Project #{id}</span>
          <h1>Issues</h1>
          <p>{myRole ? `Your access: ${myRole}` : 'Project workspace'}</p>
        </div>
        {canEdit && <button className="primary-button" onClick={() => setShowCreate(true)}>+ New issue</button>}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="toolbar">
        <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues…" />
        <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus | '')}>
          <option value="">All statuses</option>
          {statusOrder.map((item) => <option key={item} value={item}>{prettyStatus(item)}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority | '')}>
          <option value="">All priorities</option>
          {priorityOrder.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <span className="issue-count">{filteredIssues.length} issue{filteredIssues.length === 1 ? '' : 's'}</span>
      </section>

      {loading ? (
        <div className="empty-state">Loading issues…</div>
      ) : (
        <div className="issue-table-wrap">
          <table className="issue-table">
            <thead>
              <tr><th>Issue</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th></tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <div className="issue-title">
                      <span className="issue-id">
                        #{issue.id}
                      </span>

                      <Link
                        className="issue-link"
                        to={`/projects/${id}/issues/${issue.id}`}
                      >
                        {issue.title}
                      </Link>
                    </div>
                    {issue.description && <span className="issue-description">{issue.description}</span>}
                  </td>
                  <td>
                    {canEdit ? (
                      <select className={`status-select status-${issue.status.toLowerCase()}`} value={issue.status} onChange={(e) => void moveIssue(issue, e.target.value as IssueStatus)}>
                        {statusOrder.map((item) => <option key={item} value={item}>{prettyStatus(item)}</option>)}
                      </select>
                    ) : <span className="status-pill">{prettyStatus(issue.status)}</span>}
                  </td>
                  <td><span className={`priority priority-${issue.priority.toLowerCase()}`}>{issue.priority}</span></td>
                  <td>{issue.assigneeName || <span className="muted">Unassigned</span>}</td>
                  <td className={issue.isOverdue ? 'danger-text' : ''}>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredIssues.length && <div className="table-empty">No issues match these filters.</div>}
        </div>
      )}

      {showCreate && auth && (
        <CreateIssueModal
          members={members}
          onClose={() => setShowCreate(false)}
          onCreate={async (values) => {
            const created = await createIssue(auth.token, id, values)
            setIssues((current) => [created, ...current])
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

function CreateIssueModal({ members, onClose, onCreate }: {
  members: ProjectMember[]
  onClose: () => void
  onCreate: (values: { title: string; description?: string; priority: IssuePriority; assigneeId?: number | null; dueDate?: string | null }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('Medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onCreate({
        title,
        description,
        priority,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create issue.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal wide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header"><div><span className="eyebrow">New work item</span><h2>Create issue</h2></div><button className="icon-button" onClick={onClose}>×</button></div>
        <form className="stack-form" onSubmit={submit}>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the issue" required /></label>
          <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Add context, acceptance criteria, or notes…" /></label>
          <div className="form-grid">
            <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)}>{priorityOrder.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Assignee<select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}><option value="">Unassigned</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
            <label>Due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create issue'}</button></div>
        </form>
      </section>
    </div>
  )
}
