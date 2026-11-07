import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type User = { id: string; displayName: string; needsDisplayName: boolean };
type Provider = { id: 'google' | 'github'; name: string; enabled: boolean };
type SessionData = { user: User | null; csrfToken: string; providers: Provider[] };
type Session = SessionData & {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  saveName: (displayName: string) => Promise<void>;
};
const SessionContext = createContext<Session | null>(null);

async function readResponse(response: Response) {
  if (!response.ok) {
    if (response.status === 403) throw new Error('Økten er utløpt eller forespørselen ble avvist. Last siden på nytt og prøv igjen.');
    if (response.status === 400) throw new Error('Bruk 2–40 tegn i visningsnavnet, uten kontrolltegn.');
    throw new Error('Tjenesten svarer ikke som forventet. Prøv igjen.');
  }
  return response.json();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData>({ user: null, csrfToken: '', providers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/session/', { credentials: 'same-origin', cache: 'no-store', signal });
      const result: SessionData = await readResponse(response);
      if (!signal?.aborted) setData(result);
    } catch {
      if (!signal?.aborted) setError('Kunne ikke hente innloggingen. Kontroller forbindelsen og prøv igjen.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function post(path: string, body?: object) {
    let response: Response;
    try {
      response = await fetch(path, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'X-CSRFToken': data.csrfToken, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : '{}',
      });
    } catch {
      throw new Error('Kunne ikke kontakte serveren. Prøv igjen.');
    }
    return readResponse(response);
  }

  async function signOut() {
    const result = await post('/api/auth/logout/');
    setData(current => ({ ...current, user: null, csrfToken: result.csrfToken }));
  }

  async function saveName(displayName: string) {
    const result = await post('/api/auth/profile/', { displayName });
    setData(current => ({ ...current, user: result.user }));
  }

  return <SessionContext.Provider value={{ ...data, loading, error, refresh, signOut, saveName }}>
    {children}
  </SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is missing');
  return session;
}
