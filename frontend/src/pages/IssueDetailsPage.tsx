import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addComment,
  getComments,
  getIssue,
  getIssueActivity,
  updateIssue,
  updateIssueStatus,
} from '../api/issues'
import { getProjectMembers } from '../api/projects'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type {
  ActivityLog,
  Comment,
  Issue,
  IssuePriority,
  IssueStatus,
  ProjectMember,
  ProjectRole,
} from '../types'

function prettyStatus(status: string) {
    return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
    Backlog: ['InProgress'],
    InProgress: ['InReview', 'Backlog'],
    InReview: ['Done', 'InProgress'],
    Done: ['InProgress'],
}

export function IssueDetailsPage() {
    const { projectId, issueId } = useParams()

    const projectIdNumber = Number(projectId)
    const issueIdNumber = Number(issueId)

    const { auth } = useAuth()

    const [issue, setIssue] = useState<Issue | null>(null)
    const [members, setMembers] = useState<ProjectMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [comments, setComments] = useState<Comment[]>([])
    const [activity, setActivity] = useState<ActivityLog[]>([])
    const [commentBody, setCommentBody] = useState('')
    const [postingComment, setPostingComment] = useState(false)

    const [savingField, setSavingField] = useState<'priority' | 'assignee' | 'status' | null>(null)

    const [actionError, setActionError] = useState('')

    const [editingDetails, setEditingDetails] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editDueDate, setEditDueDate] = useState('')
    const [savingDetails, setSavingDetails] = useState(false)

    const myRole: ProjectRole | undefined = members.find((member) => member.userId === auth?.userId)?.role

    const canEdit =
        myRole === 'Member' ||
        myRole === 'Admin'

    useEffect(() => {
        async function loadIssue() {
        if (
            !auth ||
            !Number.isFinite(projectIdNumber) ||
            !Number.isFinite(issueIdNumber)
        ) {
            return
        }

        setLoading(true)
        setError('')

        try {
            const [issueData, memberData, commentData, activityData] = await Promise.all([
                getIssue(auth.token, issueIdNumber),
                getProjectMembers(auth.token, projectIdNumber),
                getComments(auth.token, issueIdNumber),
                getIssueActivity(auth.token, issueIdNumber),
            ])

            setIssue(issueData)
            setMembers(memberData)
            setComments(commentData)
            setActivity(activityData)
        } catch (err) {
            setError(
            err instanceof ApiError
                ? err.message
                : 'Unable to load issue.',
            )
        } finally {
            setLoading(false)
        }
        }

        void loadIssue()
    }, [
        auth,
        projectIdNumber,
        issueIdNumber,
    ])

    async function handlePriorityChange(priority: IssuePriority) {
        if (!auth || !issue || priority === issue.priority) {
            return
        }

        setSavingField('priority')
        setActionError('')

        try {
            const updatedIssue = await updateIssue(
            auth.token,
            issue.id,
            {
                priority,

                // Keep the current assignee so changing priority does not accidentally unassign the issue.
                assigneeId: issue.assigneeId,
            },
            )

            setIssue(updatedIssue)
            await refreshActivity()
        } catch (err) {
            setActionError(
            err instanceof ApiError
                ? err.message
                : 'Unable to update priority.',
            )
        } finally {
            setSavingField(null)
        }
    }

    async function handleAssigneeChange(value: string) {
        if (!auth || !issue) {
            return
        }

        const assigneeId =
            value === ''
            ? null
            : Number(value)

        if (assigneeId === issue.assigneeId) {
            return
        }

        setSavingField('assignee')
        setActionError('')

        try {
            const updatedIssue = await updateIssue(
            auth.token,
            issue.id,
            {
                assigneeId,
            },
            )

            setIssue(updatedIssue)
            await refreshActivity()
        } catch (err) {
            setActionError(
            err instanceof ApiError
                ? err.message
                : 'Unable to update assignee.',
            )
        } finally {
            setSavingField(null)
        }
    }

    async function handleStatusChange(status: IssueStatus) {
        if (!auth || !issue || status === issue.status) {
            return
        }

        setSavingField('status')
        setActionError('')

        try {
            const updatedIssue = await updateIssueStatus(auth.token, issue.id, status)

            setIssue(updatedIssue)
            await refreshActivity()
        } catch (err) {
            setActionError(
            err instanceof ApiError
                ? err.message
                : 'Unable to update status.',
            )
        } finally {
            setSavingField(null)
        }
    }

    async function handleAddComment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!auth || !issue || !commentBody.trim()) {
            return
        }

        setPostingComment(true)
        setActionError('')

        try {
            const newComment = await addComment(
            auth.token,
            issue.id,
            commentBody.trim(),
            )

            setComments((current) => [
            ...current,
            newComment,
            ])

            setCommentBody('')
        } catch (err) {
            setActionError(
            err instanceof ApiError
                ? err.message
                : 'Unable to add comment.',
            )
        } finally {
            setPostingComment(false)
        }
    }

    async function refreshActivity() {
        if (!auth || !issue) {
            return
        }

        const activityData = await getIssueActivity(auth.token, issue.id)

        setActivity(activityData)
    }

    function startEditingDetails() {
        if (!issue) return

        setEditTitle(issue.title)
        setEditDescription(issue.description ?? '')
        setEditDueDate(issue.dueDate
            ? issue.dueDate.slice(0, 10)
            : '',
        )
        
        setActionError('')
        setEditingDetails(true)
    }

    
    function cancelEditingDetails() {
        setEditingDetails(false)
        setActionError('')
    }

    async function handleSaveDetails(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!auth || !issue) {
            return
        }

        if (!editTitle.trim()) {
            setActionError('Title is required.')
            return
        }

        setSavingDetails(true)
        setActionError('')

        try {
            const updatedIssue = await updateIssue(
                auth.token,
                issue.id,
                {
                    title: editTitle.trim(),
                    description: editDescription.trim(),

                    // Important with the current PATCH implementation:
                    // preserve the existing assignee.
                    assigneeId: issue.assigneeId,

                    dueDate: editDueDate
                    ? new Date(
                        `${editDueDate}T23:59:59`,
                        ).toISOString()
                    : issue.dueDate,
                },
            )

            setIssue(updatedIssue)
            setEditingDetails(false)
        } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Unable to update issue details.')
        } finally {
            setSavingDetails(false)
        }
    }

    if (loading) {
        return (
        <div className="page-wrap">
            <div className="empty-state">
            Loading issue…
            </div>
        </div>
        )
    }

    if (error || !issue) {
        return (
        <div className="page-wrap">
            <div className="error-banner">
            {error || 'Issue not found.'}
            </div>
        </div>
        )
    }

    return (
        <div className="page-wrap">

        <Link
            className="back-link"
            to={`/projects/${projectIdNumber}`}
        >
            ← Back to issues
        </Link>

        {actionError && (
            <div className="error-banner">
                {actionError}
            </div>
        )}

        {savingField && (
            <p className="saving-text">
                Saving…
            </p>
        )}

        <header className="issue-detail-header">
            <div>
            <span className="eyebrow">
                Issue #{issue.id}
            </span>

            {editingDetails ? (
                <input
                    className="issue-title-input"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    autoFocus
                />
                ) : (
                <h1>{issue.title}</h1>
            )}

            <p>
                Reported by {issue.reporterName}
            </p>
            </div>

            <div className="issue-header-actions">
                {canEdit && !editingDetails && (
                    <button
                        className="edit-details-button"
                        type="button"
                        onClick={startEditingDetails}
                    >
                    Edit details
                    </button>
            )}

            <span className="status-pill">
                {prettyStatus(issue.status)}
            </span>
            </div>
        </header>

        <div className="issue-detail-grid">

            <main className="issue-main-card">

            <section>
                <span className="eyebrow">
                Description
                </span>

                {editingDetails ? (
                    <textarea
                        className="issue-description-input"
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        rows={7}
                        placeholder="Add a description..."
                    />
                    ) : (
                    <p className="issue-detail-description">
                        {issue.description || 'No description provided.'}
                    </p>
                )}

                {editingDetails && (
                    <form
                        className="issue-edit-actions"
                        onSubmit={handleSaveDetails}
                    >
                        <button
                            className="secondary-button"
                            type="button"
                            disabled={savingDetails}
                            onClick={cancelEditingDetails}
                        >
                        Cancel
                        </button>

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={savingDetails || !editTitle.trim()}
                        >
                        {savingDetails
                            ? 'Saving…'
                            : 'Save changes'}
                        </button>
                    </form>
                )}
            </section>

            <section className="issue-detail-section">
            <div className="section-heading">
                <div>
                <span className="eyebrow">
                    Discussion
                </span>

                <h2>
                    Comments
                </h2>
                </div>

                <span className="section-count">
                {comments.length}
                </span>
            </div>

            {comments.length === 0 ? (
                <p className="muted-text">
                No comments yet.
                </p>
            ) : (
                <div className="comment-list">
                {comments.map((comment) => (
                    <article
                    className="comment-item"
                    key={comment.id}
                    >
                    <div className="comment-meta">
                        <strong>
                        {comment.authorName}
                        </strong>

                        <span>
                        {new Date(
                            comment.createdAt,
                        ).toLocaleString()}
                        </span>
                    </div>

                    <p>
                        {comment.body}
                    </p>
                    </article>
                ))}
                </div>
            )}

            {canEdit && (
                <form
                className="comment-form"
                onSubmit={handleAddComment}
                >
                <textarea
                    placeholder="Add a comment..."
                    value={commentBody}
                    onChange={(event) =>
                    setCommentBody(event.target.value)
                    }
                    rows={3}
                />

                <div className="comment-actions">
                    <button
                    className="primary-button"
                    disabled={
                        postingComment ||
                        !commentBody.trim()
                    }
                    type="submit"
                    >
                    {postingComment
                        ? 'Posting...'
                        : 'Add comment'}
                    </button>
                </div>
                </form>
            )}
            </section>

            <section className="issue-detail-section">
            <div className="section-heading">
                <div>
                <span className="eyebrow">
                    History
                </span>

                <h2>
                    Activity
                </h2>
                </div>
            </div>

            {activity.length === 0 ? (
                <p className="muted-text">
                No activity recorded yet.
                </p>
            ) : (
                <div className="activity-list">
                {activity.map((entry) => (
                    <div
                    className="activity-item"
                    key={entry.id}
                    >
                    <div className="activity-dot" />

                    <div>
                        <p>
                        <strong>
                            {entry.actorName}
                        </strong>{' '}
                        {entry.description}
                        </p>

                        <span>
                        {new Date(
                            entry.createdAt,
                        ).toLocaleString()}
                        </span>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </section>

            </main>

            <aside className="issue-sidebar-card">

            <div className="issue-field">
                <span>Priority</span>

                {canEdit ? (
                    <select
                    className="detail-select"
                    value={issue.priority}
                    disabled={savingField !== null}
                    onChange={(event) => void handlePriorityChange(event.target.value as IssuePriority)}
                    >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    </select>
                ) : (
                    <strong>{issue.priority}</strong>
                )}
            </div>

            <div className="issue-field">
            <span>Status</span>

            {canEdit ? (
                <select
                className="detail-select"
                value={issue.status}
                disabled={savingField !== null}
                onChange={(event) => void handleStatusChange(event.target.value as IssueStatus)}
                >
                <option value={issue.status}>
                    {prettyStatus(issue.status)}
                </option>

                {STATUS_TRANSITIONS[issue.status].map(
                    (status) => (
                    <option
                        key={status}
                        value={status}
                    >
                        {prettyStatus(status)}
                    </option>
                    ),
                )}
                </select>
            ) : (
                <strong>
                {prettyStatus(issue.status)}
                </strong>
            )}
            </div>

            <div className="issue-field">
            <span>Assignee</span>

            {canEdit ? (
                <select
                className="detail-select"
                value={issue.assigneeId ?? ''}
                disabled={savingField !== null}
                onChange={(event) => void handleAssigneeChange(event.target.value)}
                >
                <option value="">
                    Unassigned
                </option>

                {members.map((member) => (
                    <option
                    key={member.userId}
                    value={member.userId}
                    >
                    {member.name}
                    </option>
                ))}
                </select>
            ) : (
                <strong>
                {issue.assigneeName || 'Unassigned'}
                </strong>
            )}
            </div>

            <div className="issue-field">
                <span>Reporter</span>

                <strong>
                {issue.reporterName}
                </strong>
            </div>

            <div className="issue-field">
                <span>Due date</span>

                {editingDetails ? (
                    <input
                        className="detail-date-input"
                        type="date"
                        value={editDueDate}
                        onChange={(event) => setEditDueDate(event.target.value)}
                    />
                ) : (
                    <strong
                        className={issue.isOverdue ? 'danger-text' : ''}
                    >
                    {issue.dueDate
                        ? new Date(issue.dueDate).toLocaleDateString()
                        : 'No due date'}
                    </strong>
                )}
            </div>

            <div className="issue-field">
                <span>Your access</span>

                <strong>
                {myRole || 'Unknown'}
                </strong>
            </div>

            <div className="issue-field">
                <span>Editing</span>

                <strong>
                {canEdit
                    ? 'Allowed'
                    : 'Read only'}
                </strong>
            </div>

            </aside>

        </div>

        </div>
    )
}