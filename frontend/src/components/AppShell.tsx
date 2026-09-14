import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AppShell() {
  const { auth, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">IT</div>
          <div className="brand-copy">
            <strong>Issue Tracker</strong>
            <span>Workspace</span>
          </div>
        </div>
        <nav>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Projects
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{auth?.name?.slice(0, 1).toUpperCase()}</div>
          <div className="user-copy">
            <strong>{auth?.name}</strong>
            <span>{auth?.email}</span>
          </div>
          <button className="icon-button" onClick={signOut} aria-label="Sign out">↪</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
