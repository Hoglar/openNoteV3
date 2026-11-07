import { useState } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router';
import { useSession } from '../auth/Session';
import { useResource } from '../../shared/api';
import type { Author, Page, Sky, StarSummary } from '../../shared/api';
import { Feedback, Pagination, WriteGate } from '../../shared/Content';
import { StarDetail } from './StarDetail';
import { EditStar, StarEditor } from './StarEditor';

export function EasyWorkPage() {
  return <section className="content-page feature-page"><Routes>
    <Route index element={<MapPage />} />
    <Route path="new" element={<><WorkHeader title="Ny stjerne" /><WriteGate><StarEditor /></WriteGate></>} />
    <Route path="stars/:id/edit" element={<EditStar />} />
    <Route path="stars/:id" element={<StarDetail />} />
    <Route path="*" element={<p>Siden finnes ikke. <Link to="/easy-work">Til Easy Work</Link></p>} />
  </Routes></section>;
}

export function WorkHeader({ title = 'Easy Work' }: { title?: string }) {
  return <header className="page-heading"><p className="eyebrow">Kunnskap / Små steg, over tid</p><h1>{title}</h1></header>;
}

function MapPage() {
  const { user, loading } = useSession(); const [params, setParams] = useSearchParams();
  const owner = params.get('owner'); const [query, setQuery] = useState('');
  const resource = useResource<Sky>(loading ? null : `/api/map/${owner ? `?owner=${encodeURIComponent(owner)}` : ''}`);
  return <><WorkHeader /><div className="toolbar"><p className="muted">Et sted å holde kunnskapen levende.</p><Link className="primary-button" to="new">Ny stjerne +</Link></div>
    <div className="section-heading"><h2>{resource.data?.owner ? `${resource.data.owner.displayName}s himmel` : 'Din stjernehimmel'}</h2>
      {owner && user && <button onClick={() => { setParams({}); setQuery(''); }}>Mitt kart</button>}</div>
    <label>Søk i dette kartet<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Finn et tema …" /></label>
    <Feedback resource={resource} />
    {resource.data && <StarMap key={owner || user?.id || 'empty'} sky={resource.data} query={query} />}
    {!user && <p className="callout"><Link to="/login">Logg inn</Link> for å bygge din egen himmel. Du kan lese alle stjerner og kart uten konto.</p>}
    <div className="discovery-grid"><section><h2>Stjernebibliotek</h2><p className="muted">Finn et tema og lån stjernen inn i ditt kart.</p><StarLibrary /></section>
      <section><h2>Utforsk andres kart</h2><MapOwners onSelect={id => { setParams({ owner: id }); setQuery(''); }} /></section></div>
  </>;
}

function StarMap({ sky, query }: { sky: Sky; query: string }) {
  const [selected, setSelected] = useState<string | null>(null); const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered || selected;
  const matches = sky.entries.filter(e => e.star.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const chosen = sky.entries.find(e => e.star.id === selected);
  const points = new Map(sky.entries.map(e => [e.star.id, e]));
  return <><div className="sky-viewport" aria-label="Stjernekart" tabIndex={0}><div className="star-sky">
    <svg className="constellations" viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true">{sky.connections.filter(edge => edge.source === active || edge.target === active || (!!query && matches.some(m => m.star.id === edge.source || m.star.id === edge.target))).map(edge => {
      const source = points.get(edge.source); const target = points.get(edge.target);
      return source && target ? <line key={edge.id} x1={source.x * 10} y1={source.y * 6.5} x2={target.x * 10} y2={target.y * 6.5} /> : null;
    })}</svg>
    {sky.entries.map(entry => <button key={entry.star.id} className={`sky-star ${active === entry.star.id ? 'highlighted' : ''} ${query && !matches.includes(entry) ? 'dimmed' : ''}`}
      style={{ left: `${entry.x}%`, top: `${entry.y}%` }} aria-label={entry.star.title} aria-pressed={selected === entry.star.id}
      onMouseEnter={() => setHovered(entry.star.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(entry.star.id)} onBlur={() => setHovered(null)} onClick={() => setSelected(entry.star.id)}>
      <span className="star-dot" /><span className="star-name">{entry.star.title}</span></button>)}
    {!sky.entries.length && <div className="sky-empty"><span aria-hidden="true">✧</span><h3>Alt begynner med én stjerne</h3><p>Lag et tema eller finn en stjerne i biblioteket.</p></div>}
  </div></div><p className="map-help muted">Pek eller fokuser for å se stjernebildet. Trykk for å velge. På små skjermer kan kartet rulles.</p>
    {chosen && <div className="selected-star"><div><span className="meta">Valgt stjerne · {chosen.star.owner.displayName}</span><h3>{chosen.star.title}</h3></div><Link className="primary-button" to={`stars/${chosen.star.id}`}>Åpne stjerne →</Link></div>}
    {query && <div className="search-results" aria-live="polite"><p>{matches.length} treff i kartet</p>{matches.map(entry => <Link key={entry.star.id} to={`stars/${entry.star.id}`}>✦ {entry.star.title}</Link>)}</div>}
  </>;
}

function StarLibrary() {
  const [query, setQuery] = useState(''); const [page, setPage] = useState(1);
  const resource = useResource<Page<StarSummary>>(`/api/stars/?q=${encodeURIComponent(query)}&page=${page}`);
  return <><label>Søk i biblioteket<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Fourier, Markdown, fysikk …" /></label><Feedback resource={resource} />
    {resource.data && <><div className="library-list">{resource.data.results.map(star => <Link className="library-item" key={star.id} to={`stars/${star.id}`}><span className="star-glyph" aria-hidden="true">✦</span><span><strong>{star.title}</strong><span className="meta">{star.owner.displayName} · {star.exercise_count} oppgaver</span></span><span aria-hidden="true">↗</span></Link>)}</div>
      {!resource.data.count && <p className="muted">Ingen stjerner funnet.</p>}<Pagination data={resource.data} page={page} onPage={setPage} /></>}
  </>;
}

function MapOwners({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(''); const [page, setPage] = useState(1);
  const resource = useResource<Page<Author>>(`/api/map-owners/?q=${encodeURIComponent(query)}&page=${page}`);
  return <><label>Søk etter visningsnavn<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label><Feedback resource={resource} />
    {resource.data && <><div className="library-list">{resource.data.results.map(owner => <button className="library-item" key={owner.id} onClick={() => onSelect(owner.id)}>{owner.displayName}<span aria-hidden="true">↗</span></button>)}</div>
      {!resource.data.count && <p className="muted">Ingen kart funnet.</p>}<Pagination data={resource.data} page={page} onPage={setPage} /></>}
  </>;
}
