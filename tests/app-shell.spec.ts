import { test, expect } from '@playwright/test';

const anonymousSession = {
  user: null, csrfToken: 'test-csrf',
  providers: [{ id: 'google', name: 'Google', enabled: false }, { id: 'github', name: 'GitHub', enabled: false }],
};

// UI contract tests; PostgreSQL and OAuth callback handling are tested in backend/.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session/', route => route.fulfill({ json: anonymousSession }));
  await page.route(/\/api\/(notes|stars|map|map-owners)\/(\?.*)?$/, route => route.fulfill({
    json: new URL(route.request().url()).pathname === '/api/map/'
      ? { owner: null, entries: [], connections: [] }
      : { count: 0, next: null, previous: null, results: [] },
  }));
});

test('start page, client navigation and browser history', async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(main).toHaveText('ACTION');
  await expect(page.locator('nav [aria-current="page"]')).toHaveCount(0);

  // A full reload destroys this marker. It must survive client navigation.
  await page.evaluate(() => Reflect.set(window, '__navigationMarker', 'same-document'));
  await page.getByRole('link', { name: 'Notater', exact: true }).click();
  await expect(page).toHaveURL('/notes');
  await expect(page.getByRole('heading', { name: 'Notater', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Notater', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'Easy Work', exact: true }).click();
  await expect(page).toHaveURL('/easy-work');
  await expect(page.getByRole('heading', { name: 'Easy Work', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/notes');
  await page.goForward();
  await expect(page).toHaveURL('/easy-work');
  expect(await page.evaluate(() => Reflect.get(window, '__navigationMarker'))).toBe('same-document');
  await page.getByRole('link', { name: 'openNote – startside' }).click();
  await expect(main).toHaveText('ACTION');
});

test('public deep links, reload and unknown URL', async ({ page }) => {
  for (const [path, title] of [['/notes', 'Notater'], ['/easy-work', 'Easy Work'], ['/login', 'Logg inn']]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('complementary').getByRole('link', { name: 'Logg inn', exact: true })).toBeVisible();
  }
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Siden finnes ikke' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Apper' })).toBeVisible();
  await page.getByRole('link', { name: 'Til startsiden' }).click();
  await expect(page).toHaveURL('/');
});

test('server session survives reload; failed logout preserves state', async ({ page }) => {
  let signedIn = true;
  let failLogout = true;
  await page.route('**/api/auth/session/', route => route.fulfill({ json: {
    ...anonymousSession,
    user: signedIn ? { id: 'test-id', displayName: 'Månestjerne', needsDisplayName: false } : null,
  } }));
  await page.route('**/api/auth/logout/', async route => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers()['x-csrftoken']).toBe('test-csrf');
    if (failLogout) await route.fulfill({ status: 503, json: {} });
    else { signedIn = false; await route.fulfill({ json: { user: null, csrfToken: 'new-csrf' } }); }
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
  await page.getByRole('link', { name: 'Easy Work', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
  await page.getByRole('button', { name: 'Logg ut' }).click();
  await expect(page.getByRole('alert')).toContainText('Prøv igjen');
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
  failLogout = false;
  await page.getByRole('button', { name: 'Logg ut' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Logg inn', exact: true })).toBeVisible();
});

test('unconfigured providers and network retry are clear', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Fortsett med Google' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Fortsett med GitHub' })).toBeDisabled();
  await expect(page.getByText('Google-innlogging er ikke satt opp ennå.')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.route('**/api/auth/session/', route => route.fulfill({ status: 503, json: {} }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Kunne ikke hente');
  await page.route('**/api/auth/session/', route => route.fulfill({ json: anonymousSession }));
  await page.getByRole('button', { name: 'Prøv igjen' }).click();
  await expect(page.getByRole('button', { name: 'Fortsett med Google' })).toBeDisabled();
});

test('new user chooses a display name with validation feedback', async ({ page }) => {
  await page.route('**/api/auth/session/', route => route.fulfill({ json: {
    ...anonymousSession, user: { id: 'test-id', displayName: '', needsDisplayName: true },
  } }));
  let failSave = true;
  await page.route('**/api/auth/profile/', async route => {
    if (failSave) await route.fulfill({ status: 400, json: {} });
    else {
      expect(route.request().postDataJSON()).toEqual({ displayName: 'Månestjerne' });
      expect(route.request().headers()['x-csrftoken']).toBe('test-csrf');
      await route.fulfill({ json: { user: { id: 'test-id', displayName: 'Månestjerne', needsDisplayName: false } } });
    }
  });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Velg visningsnavn' })).toBeVisible();
  await page.getByLabel('Visningsnavn', { exact: true }).fill('Månestjerne');
  await page.getByRole('button', { name: 'Lagre visningsnavn' }).click();
  await expect(page.getByRole('alert')).toContainText('2–40 tegn');
  failSave = false;
  await page.getByRole('button', { name: 'Lagre visningsnavn' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
});

test('provider login posts CSRF and a fixed callback', async ({ page }) => {
  await page.route('**/api/auth/session/', route => route.fulfill({ json: {
    ...anonymousSession, providers: [{ id: 'google', name: 'Google', enabled: true }],
  } }));
  await page.route('**/_allauth/browser/v1/auth/provider/redirect', async route => {
    expect(route.request().method()).toBe('POST');
    const form = new URLSearchParams(route.request().postData() ?? '');
    expect(Object.fromEntries(form)).toEqual({ provider: 'google', process: 'login', callback_url: '/login', csrfmiddlewaretoken: 'test-csrf' });
    await route.fulfill({ status: 302, headers: { location: '/login?error=provider' } });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Fortsett med Google' }).click();
  await expect(page.getByRole('alert')).toContainText('avbrutt eller mislyktes');
});

test('responsive panels, centered ACTION, and keyboard navigation', async ({ page }, testInfo) => {
  await page.goto('/');
  const mobile = testInfo.project.name === 'mobile';
  const panel = await page.getByRole('main').boundingBox();
  const heading = await page.getByRole('heading', { name: 'ACTION' }).boundingBox();
  expect(panel).not.toBeNull();
  expect(heading).not.toBeNull();
  expect(panel!.x).toBe(56);
  expect(Math.abs(heading!.x + heading!.width / 2 - (panel!.x + panel!.width / 2))).toBeLessThan(2);
  expect(Math.abs(heading!.y + heading!.height / 2 - (panel!.y + panel!.height / 2))).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('.nav-label').first()).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('startside.png') });

  if (!mobile) {
    for (const name of ['openNote – startside', 'Notater', 'Easy Work', 'Logg inn']) {
      const item = page.getByRole('link', { name, exact: true });
      await expect(item.locator('.nav-tooltip')).toBeHidden();
      await item.hover();
      await expect(item.locator('.nav-tooltip')).toBeVisible();
      expect(await page.getByRole('main').boundingBox()).toEqual(panel);
      await page.mouse.move(600, 300);
      await expect(item.locator('.nav-tooltip')).toBeHidden();
    }
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Hopp til innhold' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'openNote – startside' })).toBeFocused();
  await page.keyboard.press('Tab');
  const notes = page.getByRole('link', { name: 'Notater', exact: true });
  await expect(notes).toBeFocused();
  expect(await notes.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await expect(notes.locator('.nav-tooltip')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/notes');
  // Remove hover/focus tooltips from the visual review of the content page.
  await page.getByRole('main').focus();
  await page.screenshot({ path: testInfo.outputPath('notater.png') });

  // Simulate future long content to check the shell's scrolling contract.
  const sidebar = page.getByRole('complementary');
  const before = await sidebar.boundingBox();
  await page.getByRole('main').evaluate(el => {
    const longContent = document.createElement('div');
    longContent.style.height = '2000px';
    el.append(longContent);
    el.scrollTop = 500;
  });
  expect(await page.getByRole('main').evaluate(el => el.scrollTop)).toBe(500);
  expect(await sidebar.boundingBox()).toEqual(before);
  await expect(page.getByRole('link', { name: 'Logg inn', exact: true })).toBeInViewport();
});
