import { useState } from 'react';
import { useResource } from '../../shared/api';
import type { Page, StarSummary } from '../../shared/api';
import { Feedback, Pagination } from '../../shared/Content';

export function StarPicker({ selected, onChange }: { selected: StarSummary[]; onChange: (stars: StarSummary[]) => void }) {
  const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const [open, setOpen] = useState(false);
  const resource = useResource<Page<StarSummary>>(open ? `/api/stars/?q=${encodeURIComponent(query)}&page=${page}` : null);
  return <fieldset className="star-picker"><legend>Koble til stjerner (valgfritt)</legend>
    <div className="tags">{selected.map(star => <button key={star.id} type="button" onClick={() => onChange(selected.filter(s => s.id !== star.id))}>✦ {star.title} ×<span className="sr-only"> Fjern kobling</span></button>)}</div>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Lukk stjernesøk' : 'Finn stjerner'}</button>
    {open && <><label>Søk etter stjerne<input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label><Feedback resource={resource} />
      {resource.data && <><div className="picker-results">{resource.data.results.map(star => <label key={star.id}>
        <input type="checkbox" checked={selected.some(s => s.id === star.id)} disabled={selected.length >= 10 && !selected.some(s => s.id === star.id)} onChange={e => onChange(e.target.checked ? [...selected, star] : selected.filter(s => s.id !== star.id))} />
        {star.title} <span className="muted">· {star.owner.displayName}</span></label>)}</div>{!resource.data.count && <p>Ingen stjerner funnet.</p>}
        <Pagination data={resource.data} page={page} onPage={setPage} /></>}
    </>}
  </fieldset>;
}
