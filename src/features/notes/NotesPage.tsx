import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router';
import { useSession } from '../auth/Session';
import { dateLabel, useMutation, useResource } from '../../shared/api';
import type { Comment, Note, NoteSummary, Page, StarSummary } from '../../shared/api';
import { CopyMarkdown, Feedback, Markdown, MarkdownEditor, Pagination, useUnsaved, WriteGate } from '../../shared/Content';
import { StarPicker } from '../easy-work/StarPicker';

export function NotesPage() {
  return <section className="content-page feature-page"><Routes>
    <Route index element={<NoteList />} />
    <Route path="new" element={<><Header title="Nytt notat" /><WriteGate><NoteEditor /></WriteGate></>} />
    <Route path=":id/edit" element={<EditNote />} />
    <Route path=":id" element={<NoteDetail />} />
    <Route path="*" element={<p>Siden finnes ikke. <Link to="/notes">Til notater</Link></p>} />
  </Routes></section>;
}

function Header({ title = 'Notater' }: { title?: string }) {
  return <header className="page-heading"><p className="eyebrow">Læringslogg / Notater</p><h1>{title}</h1></header>;
}

function NoteList() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const resource = useResource<Page<NoteSummary>>(`/api/notes/?${params}`);
  return <><Header /><div className="toolbar"><p className="muted">Tanker, forklaringer og det du lærer underveis.</p><Link className="primary-button" to="new">Nytt notat +</Link></div>
    <form key={params.toString()} className="filter-bar" onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const next = new URLSearchParams();
      if (form.get('q')) next.set('q', String(form.get('q')));
      for (const tag of String(form.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)) next.append('tag', tag);
      if (params.get('star')) next.set('star', params.get('star')!);
      setParams(next);
    }}><label>Søk i notater<input name="q" defaultValue={params.get('q') || ''} placeholder="Tittel eller innhold" /></label>
      <label>Temaer<input name="tags" defaultValue={params.getAll('tag').join(', ')} placeholder="matematikk, integrasjon" /></label><button type="submit">Søk og filtrer</button>
      {params.size > 0 && <button type="button" onClick={() => setParams({})}>Nullstill</button>}
    </form>
    {params.get('star') && <p className="callout">Viser notater knyttet til <Link to={`/easy-work/stars/${params.get('star')}`}>denne stjernen</Link>.</p>}
    <Feedback resource={resource} />
    {resource.data && <><div className="card-list">{resource.data.results.map(note => <article className="content-card" key={note.id}>
      <p className="meta">{note.owner.displayName} · {dateLabel(note.updated_at)}</p><h2><Link to={note.id}>{note.title}</Link></h2>
      <div className="tags">{note.tags.map(tag => <button key={tag} onClick={() => { const next = new URLSearchParams(params); next.delete('page'); next.delete('tag'); next.append('tag', tag); setParams(next); }}>{tag}</button>)}</div>
    </article>)}</div>{!resource.data.count && <div className="empty-state"><h2>Plass til nye tanker</h2><p>Ingen notater passer søket ennå. Skriv det første, eller prøv et annet søk.</p></div>}
      <Pagination data={resource.data} page={page} onPage={n => { const next = new URLSearchParams(params); next.set('page', String(n)); setParams(next); }} /></>}
  </>;
}

function EditNote() {
  const { id } = useParams(); const { user } = useSession();
  const resource = useResource<Note>(`/api/notes/${id}/`);
  return <><Header title="Rediger notat" /><Feedback resource={resource} />{resource.data && <WriteGate>{resource.data.owner.id === user?.id ? <NoteEditor key={resource.data.id} initial={resource.data} /> : <p>Dette notatet eies av en annen bruker.</p>}</WriteGate>}</>;
}

function NoteEditor({ initial }: { initial?: Note }) {
  const navigate = useNavigate(); const mutation = useMutation();
  const [title, setTitle] = useState(initial?.title || ''); const [body, setBody] = useState(initial?.body || '');
  const [tags, setTags] = useState(initial?.tags.join(', ') || ''); const [stars, setStars] = useState<StarSummary[]>(initial?.stars || []);
  const dirty = title !== (initial?.title || '') || body !== (initial?.body || '') || tags !== (initial?.tags.join(', ') || '') || JSON.stringify(stars.map(s => s.id)) !== JSON.stringify((initial?.stars || []).map(s => s.id));
  const markSaved = useUnsaved(dirty);
  return <form className="content-form" onSubmit={event => { event.preventDefault(); void mutation.run(async () => {
    const result = await mutation.send<Note>(initial ? `/api/notes/${initial.id}/` : '/api/notes/', initial ? 'PATCH' : 'POST', { title, body, tags: tags.split(',').map(t => t.trim()).filter(Boolean), star_ids: stars.map(s => s.id) });
    markSaved(); navigate(`/notes/${result.id}`);
  }); }}>
    <p className="callout">Når du lagrer, kan alle lese notatet.</p>
    <label>Tittel<input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} required /></label>
    <MarkdownEditor label="Notattekst" value={body} onChange={setBody} />
    <label>Temaetiketter<input value={tags} onChange={e => setTags(e.target.value)} placeholder="matematikk, integrasjon" /><span className="muted">Skill med komma. Inntil ti temaer.</span></label>
    <StarPicker selected={stars} onChange={setStars} />
    {mutation.error && <p className="error-box" role="alert">{mutation.error}</p>}
    <div className="actions"><button className="primary-button" disabled={mutation.busy || !body.trim()} type="submit">{mutation.busy ? 'Lagrer …' : 'Lagre notat'}</button><Link to={initial ? `/notes/${initial.id}` : '/notes'}>Avbryt</Link></div>
  </form>;
}

function NoteDetail() {
  const { id } = useParams(); const { user } = useSession(); const navigate = useNavigate(); const mutation = useMutation();
  const resource = useResource<Note>(`/api/notes/${id}/`); const note = resource.data;
  return <><Link className="back-link" to="/notes">← Alle notater</Link><Feedback resource={resource} />{note && <>
    <Header title={note.title} /><p className="meta">{note.owner.displayName} · Oppdatert {dateLabel(note.updated_at)}</p>
    <div className="tags">{note.tags.map(tag => <Link key={tag} to={`/notes?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div>
    <article className="reading-content"><Markdown text={note.body} /></article>
    {note.stars.length > 0 && <div className="related"><h2>Tilknyttede stjerner</h2>{note.stars.map(star => <Link key={star.id} to={`/easy-work/stars/${star.id}`}>✦ {star.title}</Link>)}</div>}
    <div className="actions"><CopyMarkdown text={note.body} />{user?.id === note.owner.id && <><Link to="edit">Rediger notat</Link><button className="danger" disabled={mutation.busy} onClick={() => {
      if (window.confirm('Slett notatet og alle kommentarene? Dette kan ikke angres.')) void mutation.run(async () => { await mutation.send(`/api/notes/${id}/`, 'DELETE'); navigate('/notes'); });
    }}>Slett notat</button></>}</div>
    {mutation.error && <p role="alert">{mutation.error}</p>}<Comments key={id} noteId={id!} />
  </>}</>;
}

function Comments({ noteId }: { noteId: string }) {
  const { user } = useSession(); const [page, setPage] = useState(1); const [body, setBody] = useState('');
  const [editing, setEditing] = useState<Comment | null>(null); const [editText, setEditText] = useState('');
  const mutation = useMutation(); const resource = useResource<Page<Comment>>(`/api/notes/${noteId}/comments/?page=${page}`);
  const [notice, setNotice] = useState(''); useUnsaved(!!body || (!!editing && editText !== editing.body));
  return <section className="comments"><h2>Kommentarer</h2><Feedback resource={resource} />
    {resource.data && <><div className="card-list">{resource.data.results.map(comment => <article className="comment" key={comment.id}>
      <p className="meta">{comment.owner.displayName} · {dateLabel(comment.created_at)}</p>
      {editing?.id === comment.id ? <form onSubmit={event => { event.preventDefault(); void mutation.run(async () => {
        await mutation.send(`/api/notes/${noteId}/comments/${comment.id}/`, 'PATCH', { body: editText }); setEditing(null); resource.reload();
      }); }}><MarkdownEditor label="Rediger kommentar" value={editText} onChange={setEditText} maxLength={10000} />
        <div className="actions"><button disabled={mutation.busy || !editText.trim()}>Lagre kommentar</button><button type="button" onClick={() => { if (editText === comment.body || window.confirm('Forkaste kommentarendringene?')) setEditing(null); }}>Avbryt redigering</button></div></form>
        : <><Markdown text={comment.body} /><div className="actions"><CopyMarkdown text={comment.body} />{user?.id === comment.owner.id && <>
          <button disabled={!!editing} onClick={() => { setEditing(comment); setEditText(comment.body); }}>Rediger kommentar</button>
          <button disabled={mutation.busy} className="danger" onClick={() => { if (window.confirm('Slett kommentaren?')) void mutation.run(async () => {
            await mutation.send(`/api/notes/${noteId}/comments/${comment.id}/`, 'DELETE'); if (resource.data?.results.length === 1 && page > 1) setPage(page - 1); else resource.reload();
          }); }}>Slett kommentar</button></>}</div></>}
    </article>)}</div><Pagination data={resource.data} page={page} onPage={setPage} />{resource.data.count === 0 && <p className="muted">Ingen kommentarer ennå.</p>}</>}
    <WriteGate><form onSubmit={event => { event.preventDefault(); void mutation.run(async () => {
      await mutation.send(`/api/notes/${noteId}/comments/`, 'POST', { body }); setBody(''); setNotice('Kommentaren er lagret.');
      const last = Math.ceil(((resource.data?.count || 0) + 1) / 20); setPage(last); resource.reload();
    }); }}><MarkdownEditor label="Ny kommentar" value={body} onChange={setBody} maxLength={10000} /><button disabled={mutation.busy || !body.trim()}>Legg til kommentar</button></form></WriteGate>
    {mutation.error && <p role="alert" className="error-box">{mutation.error}</p>}<p role="status">{notice}</p>
  </section>;
}
