import { Link, Route, Routes } from 'react-router';
import { AppShell } from './AppShell';
import { HomePage } from './HomePage';
import { DemoSessionProvider } from '../features/auth/DemoSession';
import { LoginPage } from '../features/auth/LoginPage';
import { NotesPage } from '../features/notes/NotesPage';
import { EasyWorkPage } from '../features/easy-work/EasyWorkPage';
import { PlaceholderPage } from '../shared/PlaceholderPage';

export function App() {
  return (
    <DemoSessionProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="easy-work" element={<EasyWorkPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={
            <PlaceholderPage eyebrow="404 / Ukjent adresse" title="Siden finnes ikke">
              <p>Vi finner ikke siden du leter etter.</p>
              <Link className="primary-button" to="/">Til startsiden<span aria-hidden="true">↗</span></Link>
            </PlaceholderPage>
          } />
        </Route>
      </Routes>
    </DemoSessionProvider>
  );
}
