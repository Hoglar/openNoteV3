import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router';
import { AppShell } from './AppShell';
import { HomePage } from './HomePage';
import { SessionProvider } from '../features/auth/Session';
import { LoginPage } from '../features/auth/LoginPage';
import { PlaceholderPage } from '../shared/PlaceholderPage';

const NotesPage = lazy(() => import('../features/notes/NotesPage').then(module => ({ default: module.NotesPage })));
const EasyWorkPage = lazy(() => import('../features/easy-work/EasyWorkPage').then(module => ({ default: module.EasyWorkPage })));

export function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="notes/*" element={<Suspense fallback={<p className="content-page" role="status">Åpner Notater …</p>}><NotesPage /></Suspense>} />
          <Route path="easy-work/*" element={<Suspense fallback={<p className="content-page" role="status">Åpner Easy Work …</p>}><EasyWorkPage /></Suspense>} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={
            <PlaceholderPage eyebrow="404 / Ukjent adresse" title="Siden finnes ikke">
              <p>Vi finner ikke siden du leter etter.</p>
              <Link className="primary-button" to="/">Til startsiden<span aria-hidden="true">↗</span></Link>
            </PlaceholderPage>
          } />
        </Route>
      </Routes>
    </SessionProvider>
  );
}
