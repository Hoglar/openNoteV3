import { test, expect } from '@playwright/test';

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
    await expect(page.getByRole('link', { name: 'Logg inn', exact: true })).toBeVisible();
  }
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Siden finnes ikke' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Apper' })).toBeVisible();
  await page.getByRole('link', { name: 'Til startsiden' }).click();
  await expect(page).toHaveURL('/');
});

test('demo session survives app changes, resets on reload, and logs out', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Logg inn', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Simuler innlogging' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
  await page.getByRole('link', { name: 'Easy Work', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Logg ut' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Logg inn', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Logg inn', exact: true }).click();
  await page.getByRole('button', { name: 'Simuler innlogging' }).click();
  await page.getByRole('link', { name: 'Notater', exact: true }).click();
  await page.getByRole('button', { name: 'Logg ut' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Logg inn', exact: true })).toBeVisible();
});

test('responsive panels, centered ACTION, and keyboard navigation', async ({ page }, testInfo) => {
  await page.goto('/');
  const mobile = testInfo.project.name === 'mobile';
  const panel = await page.getByRole('main').boundingBox();
  const heading = await page.getByRole('heading', { name: 'ACTION' }).boundingBox();
  expect(panel).not.toBeNull();
  expect(heading).not.toBeNull();
  expect(panel!.x).toBe(mobile ? 56 : 200);
  expect(Math.abs(heading!.x + heading!.width / 2 - (panel!.x + panel!.width / 2))).toBeLessThan(2);
  expect(Math.abs(heading!.y + heading!.height / 2 - (panel!.y + panel!.height / 2))).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (mobile) await expect(page.locator('.nav-label').first()).toBeHidden();
  else await expect(page.locator('.nav-label').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('startside.png') });

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Hopp til innhold' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'openNote – startside' })).toBeFocused();
  await page.keyboard.press('Tab');
  const notes = page.getByRole('link', { name: 'Notater', exact: true });
  await expect(notes).toBeFocused();
  expect(await notes.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  if (mobile) await expect(notes.locator('.nav-tooltip')).toBeVisible();
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
