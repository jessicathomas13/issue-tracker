import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject, getProjects } from '../api/projects'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { ProjectSummary } from '../types'

export function ProjectsPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadProjects() {
    if (!auth) return
    setLoading(true)
    setError('')
    try {
      setProjects(await getProjects(auth.token))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadProjects() }, [auth])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!auth) return
    setSaving(true)
    setError('')
    try {
      await createProject(auth.token, name, description)
      setName('')
      setDescription('')
      setShowCreate(false)
      await loadProjects()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Projects</h1>
          <p>Track active work and jump back into the projects you belong to.</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>+ New project</button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◇</div>
          <h2>No projects yet</h2>
          <p>Create your first project to start tracking issues.</p>
          <button className="primary-button" onClick={() => setShowCreate(true)}>Create project</button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <button key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="project-card-top">
                <div className="project-symbol">{project.name.slice(0, 2).toUpperCase()}</div>
                <span className="arrow">↗</span>
              </div>
              <h2>{project.name}</h2>
              <p>{project.description || 'No description added.'}</p>
              <div className="project-stats">
                <span><strong>{project.openIssueCount}</strong> open</span>
                <span className={project.overdueIssueCount ? 'danger-text' : ''}><strong>{project.overdueIssueCount}</strong> overdue</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}>
          <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header"><div><span className="eyebrow">New workspace</span><h2>Create project</h2></div><button className="icon-button" onClick={() => setShowCreate(false)}>×</button></div>
            <form className="stack-form" onSubmit={handleCreate}>
              <label>Project name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website redesign" required /></label>
              <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project for?" rows={4} /></label>
              <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create project'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
