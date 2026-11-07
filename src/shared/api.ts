import { useEffect, useState } from 'react';
import { useSession } from '../features/auth/Session';

export type Author = { id: string; displayName: string };
export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type StarSummary = { id: string; title: string; owner: Author; exercise_count: number; updated_at: string };
export type Exercise = { id: string; prompt: string; answer: string };
export type Star = Omit<StarSummary, 'exercise_count'> & { theory: string; exercises: Exercise[] };
export type NoteSummary = { id: string; title: string; owner: Author; tags: string[]; updated_at: string };
export type Note = NoteSummary & { body: string; stars: StarSummary[] };
export type Comment = { id: string; body: string; owner: Author; created_at: string; updated_at: string };
export type Sky = { owner: Author | null; entries: { star: StarSummary; x: number; y: number }[];
  connections: { id: number; source: string; target: string }[] };
export type Practice = { completed: string[]; repetitions: number; last_practiced: string | null };

function describe(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(describe).join(' ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key === 'detail' ? '' : key + ': '}${describe(item)}`).join(' ');
  return '';
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options }); }
  catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new Error('Kunne ikke kontakte serveren. Prøv igjen.');
  }
  if (!response.ok) {
    if (response.status === 404) throw new Error('Innholdet finnes ikke. Det kan ha blitt slettet.');
    if (response.status === 403) throw new Error('Du har ikke tilgang til denne handlingen. Kontroller innloggingen og prøv igjen.');
    const detail = await response.json().catch(() => null);
    throw new Error(response.status === 400 ? describe(detail) || 'Kontroller feltene.' : 'Serveren kunne ikke fullføre. Prøv igjen.');
  }
  return response.status === 204 ? undefined as T : response.json();
}

export function useResource<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: string | null; loading: boolean }>({ path, data: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ path, data: null, error: null, loading: !!path });
    if (path) void api<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ path, data, error: null, loading: false });
    }).catch(cause => {
      if (!controller.signal.aborted) setState({ path, data: null, error: cause.message, loading: false });
    });
    return () => controller.abort();
  }, [path, revision]);
  return { ...(state.path === path ? state : { data: null, error: null, loading: !!path }), reload: () => setRevision(n => n + 1) };
}

export function useMutation() {
  const { csrfToken } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
    return api<T>(path, { method, headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken }, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  async function run(task: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await task(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Handlingen mislyktes. Prøv igjen.'); }
    finally { setBusy(false); }
  }
  return { busy, error, run, send };
}

export function dateLabel(value: string) { return new Date(value).toLocaleString('nb-NO', { dateStyle: 'medium', timeStyle: 'short' }); }
