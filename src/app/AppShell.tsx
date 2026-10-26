import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useDemoSession } from '../features/auth/DemoSession';
import { Icon } from '../shared/Icon';

const titles: Record<string, string> = {
  '/': 'Startside', '/notes': 'Notater', '/easy-work': 'Easy Work', '/login': 'Logg inn',
};

export function AppShell() {
  const { isSignedIn, signOut } = useDemoSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const workspace = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = `${titles[pathname] ?? 'Siden finnes ikke'} · openNote`;
    workspace.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Hopp til innhold</a>
      <aside className="sidebar" aria-label="Sidepanel">
        <Link to="/" className="brand nav-item" aria-label="openNote – startside">
          <span className="brand-icon"><Icon name="brand" /></span>
          <span className="brand-name">open<span>Note</span></span>
          <span className="nav-tooltip" aria-hidden="true">Startside</span>
        </Link>
        <div className="sidebar-divider" />
        <nav className="app-nav" aria-label="Apper">
          <p className="nav-caption">Arbeidsrom</p>
          <NavLink to="/notes" className="nav-item" aria-label="Notater">
            <Icon name="notes" /><span className="nav-label">Notater</span>
            <span className="nav-tooltip" aria-hidden="true">Notater</span>
          </NavLink>
          <NavLink to="/easy-work" className="nav-item" aria-label="Easy Work">
            <Icon name="network" /><span className="nav-label">Easy Work</span>
            <span className="nav-tooltip" aria-hidden="true">Easy Work</span>
          </NavLink>
        </nav>
        <div className="session-nav">
          <div className="sidebar-divider" />
          {isSignedIn ? (
            <button className="nav-item session-control" aria-label="Logg ut" onClick={() => {
              signOut();
              navigate('/');
            }}>
              <Icon name="logout" /><span className="nav-label">Logg ut</span>
              <span className="nav-tooltip" aria-hidden="true">Logg ut</span>
            </button>
          ) : (
            <NavLink to="/login" className="nav-item session-control" aria-label="Logg inn">
              <Icon name="login" /><span className="nav-label">Logg inn</span>
              <span className="nav-tooltip" aria-hidden="true">Logg inn</span>
            </NavLink>
          )}
        </div>
      </aside>
      <main id="workspace" className="workspace" ref={workspace} tabIndex={-1}>
        <Outlet />
      </main>
      <span className="sr-only" role="status">{titles[pathname] ?? 'Siden finnes ikke'}</span>
    </div>
  );
}
