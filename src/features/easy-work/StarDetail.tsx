import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useSession } from '../auth/Session';
import { dateLabel, useMutation, useResource } from '../../shared/api';
import type { Practice, Sky, Star } from '../../shared/api';
import { Feedback, Markdown } from '../../shared/Content';
import { WorkHeader } from './EasyWorkPage';

export function StarDetail() {
  const { id } = useParams(); const { user } = useSession(); const navigate = useNavigate(); const mutation = useMutation();
  const resource = useResource<Star>(`/api/stars/${id}/`); const sky = useResource<Sky>(user ? `/api/map/?owner=${user.id}` : null);
  const star = resource.data; const inMap = sky.data?.entries.some(e => e.star.id === id) || false; const canWrite = !!user && !user.needsDisplayName;
  const [target, setTarget] = useState('');
  return <><Link className="back-link" to="/easy-work">← Easy Work</Link><Feedback resource={resource} />{star && <>
    <WorkHeader title={star.title} /><p className="meta">Av {star.owner.displayName} · Oppdatert {dateLabel(star.updated_at)}</p>
    <div className="actions">{canWrite && <button disabled={mutation.busy || sky.loading || !!sky.error} onClick={() => {
      if (inMap && !window.confirm('Fjern stjernen og forbindelsene fra ditt kart? Originalen og egen øvingshistorikk beholdes.')) return;
      void mutation.run(async () => { await mutation.send(inMap ? `/api/map/${id}/` : '/api/map/', inMap ? 'DELETE' : 'POST', inMap ? undefined : { star: id }); sky.reload(); });
    }}>{inMap ? 'Fjern fra mitt kart' : 'Legg i mitt kart'}</button>}
      {user?.id === star.owner.id && <Link to="edit">Rediger stjerne</Link>}
      <button onClick={() => {
        const blob = new Blob([JSON.stringify({ version: 1, title: star.title, theory: star.theory, exercises: star.exercises }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'stjerne.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>Eksporter stjerne</button>
    </div>
    {!canWrite && <p className="callout"><Link to="/login">{user ? 'Velg visningsnavn' : 'Logg inn'}</Link> for å legge stjernen i ditt kart og registrere øving.</p>}
    {user && <Feedback resource={sky} />}{mutation.error && <p className="error-box" role="alert">{mutation.error}</p>}
    <section className="reading-content"><h2>Teori</h2><Markdown text={star.theory} /></section>
    <Exercises key={`${star.id}-${user?.id || 'guest'}`} star={star} canPractice={canWrite && inMap} />
    <section className="related"><h2>Notater om temaet</h2><Link to={`/notes?star=${star.id}`}>Se tilknyttede notater →</Link></section>
    {inMap && sky.data && <section className="connections"><h2>Forbindelser i mitt kart</h2><p className="muted">Koble temaet til kunnskap som hører sammen.</p>
      <form className="filter-bar" onSubmit={event => { event.preventDefault(); void mutation.run(async () => { await mutation.send('/api/connections/', 'POST', { source: id, target }); setTarget(''); sky.reload(); }); }}>
        <label>Koble til<select value={target} onChange={e => setTarget(e.target.value)}><option value="">Velg en stjerne</option>{sky.data.entries.filter(e => e.star.id !== id && !sky.data!.connections.some(c => (c.source === id && c.target === e.star.id) || (c.target === id && c.source === e.star.id))).map(e => <option key={e.star.id} value={e.star.id}>{e.star.title}</option>)}</select></label><button disabled={mutation.busy || !target}>Lag forbindelse</button>
      </form>
      <ul className="connection-list">{sky.data.connections.filter(c => c.source === id || c.target === id).map(connection => {
        const other = sky.data!.entries.find(e => e.star.id === (connection.source === id ? connection.target : connection.source));
        return <li key={connection.id}><Link to={`/easy-work/stars/${other?.star.id}`}>{other?.star.title}</Link><button disabled={mutation.busy} onClick={() => void mutation.run(async () => { await mutation.send(`/api/connections/${connection.id}/`, 'DELETE'); sky.reload(); })}>Fjern forbindelse<span className="sr-only"> til {other?.star.title}</span></button></li>;
      })}</ul>
    </section>}
    {user?.id === star.owner.id && <details className="delete-original"><summary>Sletting av original</summary><p>Sletting fjerner stjernen, forbindelsene og øvingsdata fra alle kart som bruker den. Tilknyttede notater og andre stjerner beholdes.</p>
      <button className="danger" disabled={mutation.busy} onClick={() => { if (window.confirm('Slett originalstjernen fra ALLE kart, med forbindelser og øvingsdata? Dette kan ikke angres.')) void mutation.run(async () => { await mutation.send(`/api/stars/${id}/`, 'DELETE'); navigate('/easy-work'); }); }}>Slett originalstjernen</button>
    </details>}
  </>}</>;
}

function Exercises({ star, canPractice }: { star: Star; canPractice: boolean }) {
  const { user } = useSession(); const [index, setIndex] = useState(0); const [showAnswer, setShowAnswer] = useState(false);
  const [notice, setNotice] = useState(''); const mutation = useMutation();
  const progress = useResource<Practice>(user ? `/api/stars/${star.id}/practice/` : null); const [saved, setSaved] = useState<Practice | null>(null);
  const data = saved || progress.data; const current = star.exercises[index];
  function move(next: number) { setIndex(next); setShowAnswer(false); setNotice(''); }
  return <section className="practice-section"><div className="section-heading"><h2>Øv litt</h2>{data && <span className="meta">{data.repetitions} fullføringer registrert</span>}</div>
    {user && <Feedback resource={progress} />}{data?.last_practiced && <p className="meta">Sist øvd: {dateLabel(data.last_practiced)}</p>}
    {current ? <div className="exercise-card"><p className="eyebrow">Oppgave {index + 1} av {star.exercises.length}{data?.completed.includes(current.id) ? ' · Gjort i denne runden' : ''}</p><Markdown text={current.prompt} />
      {current.answer && <><button onClick={() => setShowAnswer(!showAnswer)} aria-expanded={showAnswer}>{showAnswer ? 'Skjul fasit' : 'Vis fasit'}</button>{showAnswer && <div className="answer"><Markdown text={current.answer} /></div>}</>}
      <div className="exercise-navigation"><button disabled={index === 0 || mutation.busy} onClick={() => move(index - 1)}>Forrige oppgave</button>
        <button className="primary-button" disabled={!canPractice || mutation.busy || progress.loading || !!progress.error || data?.completed.includes(current.id)} onClick={() => void mutation.run(async () => {
          const result = await mutation.send<Practice>(`/api/stars/${star.id}/practice/`, 'POST', { exercise_id: current.id, revision: star.updated_at }); setSaved(result); setShowAnswer(false);
          const next = star.exercises.findIndex((e, i) => i > index && !result.completed.includes(e.id));
          const remaining = star.exercises.findIndex(e => !result.completed.includes(e.id));
          if (next >= 0) setIndex(next); else if (remaining >= 0) setIndex(remaining);
          setNotice(result.completed.length === star.exercises.length ? 'Alle oppgavene er gjort i denne runden. Godt jobbet!' : 'Øvingen er lagret.');
        })}>{mutation.busy ? 'Lagrer …' : 'Gjort – neste'}</button>
        <button disabled={index === star.exercises.length - 1 || mutation.busy} onClick={() => move(index + 1)}>Neste oppgave</button></div>
      {!canPractice && user && <p className="muted">Legg stjernen i ditt kart for å registrere øving.</p>}
    </div> : <p className="muted">Stjernen har foreløpig bare teori. Eieren kan legge til oppgaver senere.</p>}
    {canPractice && data && data.completed.length > 0 && <button disabled={mutation.busy} onClick={() => { if (window.confirm('Start ny runde? Markeringene nullstilles, men øvingshistorikken beholdes.')) void mutation.run(async () => {
      setSaved(await mutation.send<Practice>(`/api/stars/${star.id}/practice/`, 'POST', { reset: true })); move(0);
    }); }}>Start ny runde</button>}
    <p role="status">{notice}</p>{mutation.error && <p role="alert" className="error-box">{mutation.error}</p>}
  </section>;
}
