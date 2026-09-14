import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { auth, signIn } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (auth) return <Navigate to="/projects" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await register(name, email, password)
      signIn(response)
      navigate('/projects')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="brand-mark large">IT</div>
        <div className="auth-heading">
          <span className="eyebrow">Issue Tracker</span>
          <h1>Create your account</h1>
          <p>Start a workspace and keep project work visible from backlog to done.</p>
        </div>
        <form onSubmit={handleSubmit} className="stack-form">
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" /></label>
          {error && <div className="error-banner">{error}</div>}
          <button className="primary-button full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </div>
  )
}
