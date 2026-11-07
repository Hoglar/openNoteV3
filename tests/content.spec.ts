import { test, expect } from '@playwright/test';
import type { Page as BrowserPage } from '@playwright/test';
import type { Note, Star, Comment } from '../src/shared/api';

const author = { id: 'author', displayName: 'Ada' };
const now = '2026-11-07T08:00:00Z';
const example: Star = { id: 'star-1', title: 'Integrasjon', owner: author, theory: '## Kort repetisjon\n\n$$\\int 2x\\,dx = x^2+C$$', updated_at: now,
  exercises: [{ id: 'one', prompt: 'Finn integralet av $2x$.', answer: '$x^2+C$' }, { id: 'two', prompt: 'Finn integralet av $3x^2$.', answer: '$x^3+C$' }] };
const emptyPage = (results: unknown[]) => ({ count: results.length, results, next: null, previous: null });

async function fixture(page: BrowserPage, signedIn = true) {
  const notes: Note[] = []; const stars: Star[] = [structuredClone(example), { ...structuredClone(example), id: 'star-2', title: 'Fourier-rekker' }];
  const comments: Comment[] = []; const completed: string[] = []; let repetitions = 0;
  let entries = stars.map((star, index) => ({ star: { ...star, exercise_count: star.exercises.length }, x: 15 + index * 25, y: 28 + index * 25 }));
  let connections = [{ id: 1, source: 'star-1', target: 'star-2' }];
  let failSave = false;
  await page.route('**/api/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname; const method = request.method();
    const body = method === 'POST' || method === 'PATCH' ? request.postDataJSON() : null;
    const ok = (json: unknown, status = 200) => route.fulfill({ json, status });
    if (method !== 'GET') expect(request.headers()['x-csrftoken']).toBe('test-csrf');
    if (path === '/api/auth/session/') return ok({ user: signedIn ? { ...author, needsDisplayName: false } : null, csrfToken: 'test-csrf', providers: [] });
    if (path === '/api/map/') {
      if (method === 'POST' && !entries.some(e => e.star.id === body.star)) { const star = stars.find(s => s.id === body.star)!; entries.push({ star: { ...star, exercise_count: star.exercises.length }, x: 30, y: 30 }); }
      return ok({ owner: author, entries, connections });
    }
    if (/^\/api\/map\/[^/]+\/$/.test(path) && method === 'DELETE') { const id = path.split('/')[3]; entries = entries.filter(e => e.star.id !== id); connections = connections.filter(c => c.source !== id && c.target !== id); return route.fulfill({ status: 204 }); }
    if (path === '/api/map-owners/') return ok(emptyPage([author]));
    if (path === '/api/stars/') {
      if (method === 'POST') { const star = { ...body, id: 'star-new', owner: author, updated_at: now }; stars.push(star); entries.push({ star: { ...star, exercise_count: star.exercises.length }, x: 60, y: 40 }); return ok(star, 201); }
      return ok(emptyPage(stars.filter(s => s.title.toLowerCase().includes((url.searchParams.get('q') || '').toLowerCase())).map(s => ({ ...s, exercise_count: s.exercises.length }))));
    }
    const starRoute = path.match(/^\/api\/stars\/([^/]+)\/(practice\/)?$/);
    if (starRoute) {
      const star = stars.find(s => s.id === starRoute[1]);
      if (!star) return ok({}, 404);
      if (starRoute[2]) {
        if (body?.reset) completed.length = 0;
        else if (method === 'POST' && !completed.includes(body.exercise_id)) { completed.push(body.exercise_id); repetitions++; expect(body.revision).toBe(now); }
        return ok({ completed, repetitions, last_practiced: repetitions ? now : null });
      }
      if (method === 'PATCH') Object.assign(star, body);
      return ok(star);
    }
    if (path === '/api/notes/') {
      if (method === 'POST') {
        if (failSave) return ok({ detail: 'Midlertidig feil' }, 503);
        const note = { ...body, id: 'note-1', owner: author, updated_at: now, stars: stars.filter(s => body.star_ids.includes(s.id)) };
        notes.push(note); return ok(note, 201);
      }
      const q = (url.searchParams.get('q') || '').toLowerCase(); const tags = url.searchParams.getAll('tag');
      return ok(emptyPage(notes.filter(n => (n.title + n.body).toLowerCase().includes(q) && tags.every(tag => n.tags.includes(tag)))));
    }
    const commentRoute = path.match(/^\/api\/notes\/[^/]+\/comments\/(?:([^/]+)\/)?$/);
    if (commentRoute) {
      if (method === 'POST') { const comment = { ...body, id: 'comment-1', owner: author, created_at: now, updated_at: now }; comments.push(comment); return ok(comment, 201); }
      if (method === 'PATCH') { const comment = comments.find(c => c.id === commentRoute[1])!; Object.assign(comment, body); return ok(comment); }
      if (method === 'DELETE') { comments.splice(comments.findIndex(c => c.id === commentRoute[1]), 1); return route.fulfill({ status: 204 }); }
      return ok(emptyPage(comments));
    }
    const noteRoute = path.match(/^\/api\/notes\/([^/]+)\/$/);
    if (noteRoute) {
      const note = notes.find(n => n.id === noteRoute[1]); if (!note) return ok({}, 404);
      if (method === 'PATCH') Object.assign(note, body, { stars: stars.filter(s => body.star_ids.includes(s.id)) });
      if (method === 'DELETE') { notes.splice(notes.indexOf(note), 1); return route.fulfill({ status: 204 }); }
      return ok(note);
    }
    throw new Error(`Unmocked request: ${method} ${path}`);
  });
  return { notes, stars, failSave: (value: boolean) => { failSave = value; } };
}

async function editorPreview(page: BrowserPage, label: string, mobile: boolean) {
  if (mobile) await page.getByRole('group', { name: `${label}: visning` }).getByRole('button', { name: 'Forhåndsvis', exact: true }).click();
}

// Stateful API mocks exercise UI behavior; the corresponding business rules use PostgreSQL tests.
test('write, preview, retry, edit and find a note; flat Markdown comments', async ({ page }, testInfo) => {
  const state = await fixture(page); const mobile = testInfo.project.name === 'mobile';
  await page.goto('/notes'); await page.getByRole('link', { name: 'Nytt notat +' }).click();
  await page.getByLabel('Tittel', { exact: true }).fill('Min Fourier-logg');
  const markdown = '## Et lite steg\n\n$$\\int_0^\\pi \\sin(x)\\,dx = 2$$\n\n```js\nconst x = 2;\n```';
  await page.getByLabel('Notattekst', { exact: true }).fill(markdown);
  await editorPreview(page, 'Notattekst', mobile);
  await expect(page.locator('.editor-preview .katex')).toBeVisible();
  if (mobile) { await page.getByRole('group', { name: 'Notattekst: visning' }).getByRole('button', { name: 'Skriv', exact: true }).click(); await expect(page.getByLabel('Notattekst', { exact: true })).toHaveValue(markdown); }
  await page.getByLabel('Temaetiketter').fill('matematikk, fourier');
  await page.getByRole('button', { name: 'Finn stjerner', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Integrasjon' }).check();
  state.failSave(true); await page.getByRole('button', { name: 'Lagre notat', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Prøv igjen'); await expect(page.getByLabel('Notattekst', { exact: true })).toHaveValue(markdown);
  state.failSave(false); await page.getByRole('button', { name: 'Lagre notat', exact: true }).click();
  await expect(page).toHaveURL('/notes/note-1'); await expect(page.getByRole('heading', { name: 'Min Fourier-logg' })).toBeVisible();
  await expect(page.getByRole('link', { name: '✦ Integrasjon' })).toBeVisible();
  await page.getByLabel('Ny kommentar', { exact: true }).fill('**Enig**: $x^2$'); await page.getByRole('button', { name: 'Legg til kommentar' }).click();
  await expect(page.locator('.comment .katex')).toBeVisible();
  await page.getByRole('button', { name: 'Rediger kommentar', exact: true }).click();
  await page.getByLabel('Rediger kommentar', { exact: true }).fill('Oppdatert kommentar'); await page.getByRole('button', { name: 'Lagre kommentar', exact: true }).click();
  await expect(page.locator('.comment')).toContainText('Oppdatert kommentar');
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { Reflect.set(window, '__copied', text); } }, configurable: true }); });
  await page.locator('.comment').getByRole('button', { name: 'Kopier Markdown' }).click();
  expect(await page.evaluate(() => Reflect.get(window, '__copied'))).toBe('Oppdatert kommentar');
  await page.getByRole('link', { name: 'Rediger notat', exact: true }).click(); await expect(page.getByLabel('Notattekst', { exact: true })).toHaveValue(markdown);
  await page.getByLabel('Tittel', { exact: true }).fill('Fourier – repetert'); await page.getByRole('button', { name: 'Lagre notat', exact: true }).click();
  await page.getByRole('link', { name: '← Alle notater' }).click();
  await page.getByLabel('Søk i notater').fill('repetert'); await page.getByLabel('Temaer', { exact: true }).fill('matematikk, fourier'); await page.getByRole('button', { name: 'Søk og filtrer' }).click();
  await expect(page.getByRole('heading', { name: 'Fourier – repetert' })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Fourier – repetert' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('notes.png') });
});

test('unsaved navigation can be cancelled and harmful Markdown stays inert', async ({ page }, testInfo) => {
  await fixture(page); await page.goto('/notes/new');
  await page.getByLabel('Tittel', { exact: true }).fill('Trygg tekst');
  await page.getByLabel('Notattekst', { exact: true }).fill('<script>window.pwned=true</script>\n\n![image](https://example.invalid/secret.png)\n\n[bad](javascript:alert(1))\n\n$\\href{javascript:alert(1)}{x}$\n\n$$\n\\begin{aligned}a&=b+c\\\\d&=e+f\\end{aligned}\n$$');
  await editorPreview(page, 'Notattekst', testInfo.project.name === 'mobile');
  await expect(page.locator('.editor-preview img, .editor-preview script, .editor-preview a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.locator('.editor-preview .katex-display .katex')).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'pwned'))).toBeUndefined();
  page.once('dialog', dialog => dialog.dismiss()); await page.getByRole('link', { name: 'Easy Work', exact: true }).click();
  await expect(page).toHaveURL('/notes/new'); await expect(page.getByLabel('Tittel', { exact: true })).toHaveValue('Trygg tekst');
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('link', { name: 'Easy Work', exact: true }).click();
  await expect(page).toHaveURL('/easy-work');
});

test('map selection, search and per-user exercise rounds', async ({ page }, testInfo) => {
  await fixture(page); await page.goto('/easy-work');
  const star = page.getByRole('button', { name: 'Integrasjon', exact: true });
  await expect(page.locator('.constellations line')).toHaveCount(0);
  await star.focus(); await expect(page.locator('.constellations line')).toHaveCount(1);
  await star.click(); await page.getByRole('link', { name: 'Åpne stjerne →' }).click();
  await expect(page.getByRole('heading', { name: 'Integrasjon', exact: true })).toBeVisible();
  await expect(page.locator('.answer')).toHaveCount(0); await page.getByRole('button', { name: 'Vis fasit', exact: true }).click(); await expect(page.locator('.answer .katex')).toBeVisible();
  await page.getByRole('button', { name: 'Gjort – neste' }).click();
  await expect(page.locator('.exercise-card .eyebrow')).toContainText('Oppgave 2 av 2');
  await page.getByRole('button', { name: 'Gjort – neste' }).click(); await expect(page.getByText('Alle oppgavene er gjort i denne runden. Godt jobbet!')).toBeVisible();
  await page.reload(); await expect(page.getByText('2 fullføringer registrert')).toBeVisible(); await expect(page.getByRole('button', { name: 'Gjort – neste' })).toBeDisabled();
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Start ny runde' }).click(); await expect(page.getByRole('button', { name: 'Gjort – neste' })).toBeEnabled();
  await page.getByRole('link', { name: '← Easy Work' }).click(); await page.getByLabel('Søk i dette kartet').fill('fourier');
  await expect(page.locator('.search-results')).toContainText('1 treff'); await expect(page.locator('.sky-star.dimmed')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('sky.png') });
});

test('import a star template, preserve exercise IDs and edit the original', async ({ page }) => {
  const state = await fixture(page); await page.goto('/easy-work/new');
  await page.getByText('Importer innhold laget utenfor appen').click();
  await page.getByLabel('Importer stjernefil').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('alert')).toContainText('Ugyldig JSON');
  await page.getByLabel('Importer stjernefil').setInputFiles('public/templates/star-v1.json');
  await expect(page.getByLabel('Tittel', { exact: true })).toHaveValue('Integrasjon – små repetisjoner');
  await page.getByRole('button', { name: 'Lagre stjerne', exact: true }).click();
  await expect(page).toHaveURL('/easy-work/stars/star-new');
  expect(state.stars.at(-1)?.exercises.map(e => e.id)).toEqual(['potens-01', 'potens-02']);
  await page.getByRole('link', { name: 'Rediger stjerne', exact: true }).click();
  await page.getByLabel('Tittel', { exact: true }).fill('Min første stjerne'); await page.getByRole('button', { name: 'Lagre stjerne', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Min første stjerne' })).toBeVisible();
  expect(state.stars.at(-1)?.exercises[0].id).toBe('potens-01');
});

test('anonymous readers see content and errors, but no editing controls', async ({ page }) => {
  await fixture(page, false); await page.goto('/easy-work/stars/star-1');
  await expect(page.getByRole('heading', { name: 'Integrasjon', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rediger stjerne' })).toHaveCount(0); await expect(page.getByRole('button', { name: 'Gjort – neste' })).toBeDisabled();
  await page.goto('/notes/new'); await expect(page.getByLabel('Tittel', { exact: true })).toHaveCount(0); await expect(page.getByText('for å skrive og lagre.', { exact: false })).toBeVisible();
  await page.route('**/api/stars/missing/', route => route.fulfill({ status: 404, json: {} }));
  await page.goto('/easy-work/stars/missing'); await expect(page.getByRole('alert')).toContainText('kan ha blitt slettet');
});
