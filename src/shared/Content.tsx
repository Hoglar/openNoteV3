import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useBlocker } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useSession } from '../features/auth/Session';
import type { Page } from './api';

export function Markdown({ text }: { text: string }) {
  return <div className="markdown"><ReactMarkdown skipHtml disallowedElements={['img']}
    remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { trust: false, maxExpand: 500, maxSize: 10, strict: 'error' }]]}
    components={{ a: ({ children, href }) => <a href={href} rel="noopener noreferrer">{children}</a> }}>{text}</ReactMarkdown></div>;
}

export function MarkdownEditor({ label, value, onChange, maxLength = 50000 }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  const [preview, setPreview] = useState(false);
  const id = useId();
  return <div className={`markdown-editor ${preview ? 'show-preview' : ''}`}>
    <div className="editor-tabs" role="group" aria-label={`${label}: visning`}>
      <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Skriv</button>
      <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Forhåndsvis</button>
    </div>
    <div className="editor-source"><label htmlFor={id}>{label}</label><textarea id={id} value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} rows={10} /></div>
    <div className="editor-preview"><span className="field-label">Forhåndsvisning</span>{value ? <Markdown text={value} /> : <p className="muted">Teksten din vises her.</p>}</div>
    <p className="editor-help muted">Markdown: **fet**, `kode` og $x^2$. Formelblokk: $$ på en egen linje før og etter formelen.</p>
  </div>;
}

export function useUnsaved(dirty: boolean) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const blocker = useBlocker(() => dirtyRef.current);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Du har ulagrede endringer. Vil du forkaste dem og forlate siden?')) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  return () => { dirtyRef.current = false; };
}

export function WriteGate({ children }: { children: ReactNode }) {
  const { user, loading, error } = useSession();
  if (loading) return <p role="status">Henter innlogging …</p>;
  if (error) return <p role="alert">{error} <Link to="/login">Åpne innlogging</Link></p>;
  if (!user || user.needsDisplayName) return <p className="callout"><Link to="/login">{user ? 'Velg visningsnavn' : 'Logg inn'}</Link> for å skrive og lagre. Alt innhold er offentlig.</p>;
  return children;
}

export function Feedback({ resource }: { resource: { loading: boolean; error: string | null; reload: () => void } }) {
  if (resource.loading) return <p role="status">Henter innhold …</p>;
  if (resource.error) return <div className="error-box" role="alert">{resource.error} <button onClick={resource.reload}>Prøv igjen</button></div>;
  return null;
}

export function Pagination({ data, page, onPage }: { data: Page<unknown>; page: number; onPage: (page: number) => void }) {
  if (data.count <= 20) return null;
  return <nav className="pagination" aria-label="Resultatsider"><button type="button" disabled={!data.previous} onClick={() => onPage(page - 1)}>Forrige side</button>
    <span>Side {page} · {data.count} treff</span><button type="button" disabled={!data.next} onClick={() => onPage(page + 1)}>Neste side</button></nav>;
}

export function CopyMarkdown({ text }: { text: string }) {
  const [message, setMessage] = useState('');
  return <span className="copy-control"><button type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setMessage('Kopiert'); }
    catch { setMessage('Kunne ikke kopiere. Marker og kopier teksten manuelt.'); }
  }}>Kopier Markdown</button><span role="status">{message}</span>{message.startsWith('Kunne') && <textarea aria-label="Markdown til kopiering" value={text} readOnly />}</span>;
}
