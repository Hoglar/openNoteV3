import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useSession } from '../auth/Session';
import { useMutation, useResource } from '../../shared/api';
import type { Exercise, Star } from '../../shared/api';
import { Feedback, MarkdownEditor, useUnsaved, WriteGate } from '../../shared/Content';
import { WorkHeader } from './EasyWorkPage';

type StarFile = { version: 1; title: string; theory: string; exercises: Exercise[] };
export function parseStarFile(text: string): StarFile {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || Object.keys(data).sort().join(',') !== 'exercises,theory,title,version' || data.version !== 1 || typeof data.title !== 'string' || !data.title.trim() || data.title.length > 120 || typeof data.theory !== 'string' || !data.theory.trim() || data.theory.length > 50000 || !Array.isArray(data.exercises) || data.exercises.length > 50) throw new Error('Filen følger ikke stjernemal versjon 1. Bruk malen under.');
  const seen = new Set<string>();
  for (const exercise of data.exercises) {
    if (!exercise || typeof exercise !== 'object' || Object.keys(exercise).sort().join(',') !== 'answer,id,prompt' || typeof exercise.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(exercise.id) || seen.has(exercise.id) || typeof exercise.prompt !== 'string' || !exercise.prompt.trim() || exercise.prompt.length > 10000 || typeof exercise.answer !== 'string' || exercise.answer.length > 10000) throw new Error('Ugyldig oppgave. Bruk unike ID-er og tekstfeltene prompt og answer (maks 10 000 tegn).');
    seen.add(exercise.id);
  }
  return data;
}

export function EditStar() {
  const { id } = useParams(); const { user } = useSession(); const resource = useResource<Star>(`/api/stars/${id}/`);
  return <><WorkHeader title="Rediger stjerne" /><Feedback resource={resource} />{resource.data && <WriteGate>{resource.data.owner.id === user?.id ? <StarEditor key={resource.data.id} initial={resource.data} /> : <p>Bare eieren kan redigere originalstjernen.</p>}</WriteGate>}</>;
}

export function StarEditor({ initial }: { initial?: Star }) {
  const navigate = useNavigate(); const mutation = useMutation();
  const [title, setTitle] = useState(initial?.title || ''); const [theory, setTheory] = useState(initial?.theory || '');
  const [exercises, setExercises] = useState<Exercise[]>(initial?.exercises || []); const [index, setIndex] = useState(0); const [importError, setImportError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const dirty = title !== (initial?.title || '') || theory !== (initial?.theory || '') || JSON.stringify(exercises) !== JSON.stringify(initial?.exercises || []);
  const markSaved = useUnsaved(dirty); const current = exercises[index];
  function updateExercise(field: 'prompt' | 'answer', value: string) { setExercises(exercises.map((exercise, i) => i === index ? { ...exercise, [field]: value } : exercise)); }
  return <form className="content-form" onSubmit={event => { event.preventDefault(); void mutation.run(async () => {
    const result = await mutation.send<Star>(initial ? `/api/stars/${initial.id}/` : '/api/stars/', initial ? 'PATCH' : 'POST', { title, theory, exercises });
    markSaved(); navigate(`/easy-work/stars/${result.id}`);
  }); }}><p className="callout">Alt du lagrer er offentlig. {initial ? 'Endringene blir også synlige for alle som har lånt stjernen.' : 'Stjernen legges automatisk i kartet ditt.'}</p>
    <details className="import-panel"><summary>Importer innhold laget utenfor appen</summary><p>Last ned malen, fyll Markdown-feltene selv eller med AI, og importer JSON-filen. Kontroller innholdet før du lagrer.</p>
      <a className="text-link" href="/templates/star-v1.json" download>Last ned stjernemal (JSON)</a>
      <label>Importer stjernefil<input type="file" accept=".json,application/json" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; setImportError(''); setImportMessage('');
        if (dirty && !window.confirm('Erstatt de ulagrede feltene med innholdet fra filen?')) return;
        try { if (file.size > 512000) throw new Error('Filen kan ikke være større enn 500 kB.'); const data = parseStarFile(await file.text());
          setTitle(data.title); setTheory(data.theory); setExercises(data.exercises); setIndex(0); setImportMessage('Importert til editoren. Kontroller og lagre når du er klar.');
        } catch (cause) { setImportError(cause instanceof SyntaxError ? 'Ugyldig JSON. Kontroller komma, anførselstegn og doble bakstreker i matte.' : (cause as Error).message); }
      }} /></label>{importError && <p role="alert">{importError}</p>}<p role="status">{importMessage}</p>
    </details>
    <label>Tittel<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>
    <MarkdownEditor label="Teori" value={theory} onChange={setTheory} />
    <div className="section-heading"><h2>Oppgaver</h2><button type="button" disabled={exercises.length >= 50} onClick={() => { setExercises([...exercises, { id: crypto.randomUUID(), prompt: '', answer: '' }]); setIndex(exercises.length); }}>Legg til oppgave</button></div>
    {!exercises.length && <p className="muted">Du kan starte med teori og legge til oppgaver senere.</p>}
    {current && <section className="exercise-editor"><div className="actions"><label>Velg oppgave<select value={index} onChange={e => setIndex(Number(e.target.value))}>{exercises.map((exercise, i) => <option key={exercise.id} value={i}>Oppgave {i + 1}</option>)}</select></label>
      <button className="danger" type="button" onClick={() => { if (window.confirm('Fjern denne oppgaven? Endringen blir offentlig når du lagrer stjernen.')) { setExercises(exercises.filter((_, i) => i !== index)); setIndex(Math.max(0, index - 1)); } }}>Fjern oppgave</button></div>
      <MarkdownEditor label="Oppgavetekst" value={current.prompt} onChange={value => updateExercise('prompt', value)} maxLength={10000} />
      <MarkdownEditor label="Fasit (valgfritt)" value={current.answer} onChange={value => updateExercise('answer', value)} maxLength={10000} />
    </section>}
    {mutation.error && <p role="alert" className="error-box">{mutation.error}</p>}
    <div className="actions"><button className="primary-button" disabled={mutation.busy || !theory.trim() || exercises.some(e => !e.prompt.trim())}>{mutation.busy ? 'Lagrer …' : 'Lagre stjerne'}</button><Link to={initial ? `/easy-work/stars/${initial.id}` : '/easy-work'}>Avbryt</Link></div>
  </form>;
}
