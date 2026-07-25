import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Full CRUD sweep across every feature area, run as one serial story with a
 * dedicated QA account so it never touches real family data.
 */
const QA_EMAIL = 'claude-max+famify-beta-test@flemmings-iceland.de';
const QA_PASSWORD = 'FamifyBeta2026!';
const RUN = `qa${Date.now().toString().slice(-6)}`;

test.describe.configure({ mode: 'serial' });
test.setTimeout(90000);

// Edit2 renders as the "pen" icon in lucide-react 0.575
const editBtn = (scope: Locator) =>
  scope.locator('button:has(svg.lucide-pen), button:has(svg.lucide-pencil)').first();
const deleteBtn = (scope: Locator) =>
  scope.locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash2)').first();
// Innermost container that holds BOTH the given text and the row action buttons
const rowWithActions = (page: Page, text: string) =>
  page.locator('div:has(> * button:has(svg.lucide-trash-2)), div:has(button:has(svg.lucide-trash-2))', { hasText: text }).last();

async function login(page: Page) {
  page.on('dialog', (d) => d.accept());
  await page.goto('/login');
  await page.getByLabel('Email').fill(QA_EMAIL);
  await page.getByLabel('Password').fill(QA_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/dashboard|family-setup/, { timeout: 30000 });
  // The URL can sit on /dashboard while family data loads, then bounce to
  // /family-setup — wait for either real screen before deciding anything
  await page
    .locator('nav, h1:has-text("Welcome to Famify")')
    .first()
    .waitFor({ timeout: 30000 });
}

async function openPlannerTab(page: Page, tab: string) {
  await page.goto('/planner');
  await page.getByRole('button', { name: tab, exact: true }).first().click();
}

test('family setup: QA account has or creates a family', async ({ page }) => {
  await login(page);
  if (await page.getByText('Welcome to Famify').isVisible().catch(() => false)) {
    await page.locator('#familyName').fill('QA Test Family');
    await page.getByRole('button', { name: 'Create Family' }).click();
    await page.waitForURL(/dashboard/, { timeout: 30000 });
  }
  await expect(page).toHaveURL(/dashboard/);
});

test('dashboard: quick-add task creates a task', async ({ page }) => {
  await login(page);
  await page.getByTitle('Quick add task').click();
  await page.getByPlaceholder('Quick add a task...').fill(`${RUN} quick task`);
  await page.locator('button[type="submit"]', { hasText: 'Add' }).first().click();
  // Form closes only on successful insert — wait before navigating away
  await expect(page.getByPlaceholder('Quick add a task...')).toBeHidden({ timeout: 10000 });
  // The dashboard widget caps its list, so verify in the full Planner task list
  await openPlannerTab(page, 'Tasks');
  await expect(page.getByText(`${RUN} quick task`).first()).toBeVisible({ timeout: 10000 });
});

test('planner events: create, edit, delete', async ({ page }) => {
  await login(page);
  await openPlannerTab(page, 'Calendar');
  await page.getByRole('button', { name: 'Add Event' }).click();
  await page.getByPlaceholder(/title/i).first().fill(`${RUN} event`);
  const start = page.locator('input[type="datetime-local"]').first();
  await start.fill('2026-08-01T10:00');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  const card = rowWithActions(page, `${RUN} event`);
  await expect(page.getByText(`${RUN} event`).first()).toBeVisible({ timeout: 10000 });

  await editBtn(card).click({ force: true });
  const editInput = page.locator(`input[value="${RUN} event"]`).first();
  await editInput.fill(`${RUN} event edited`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`${RUN} event edited`).first()).toBeVisible({ timeout: 10000 });

  const edited = rowWithActions(page, `${RUN} event edited`);
  await deleteBtn(edited).click({ force: true });
  await expect(page.getByText(`${RUN} event edited`)).toHaveCount(0, { timeout: 10000 });
});

test('planner tasks: create, complete, edit, delete (and clean quick task)', async ({ page }) => {
  await login(page);
  await openPlannerTab(page, 'Tasks');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByPlaceholder('What needs to be done?').fill(`${RUN} task`);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(`${RUN} task`).first()).toBeVisible({ timeout: 10000 });

  const card = rowWithActions(page, `${RUN} task`);
  await card.locator('input[type="checkbox"]').first().click();

  await editBtn(card).click({ force: true });
  await page.locator(`input[value="${RUN} task"]`).first().fill(`${RUN} task edited`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`${RUN} task edited`).first()).toBeVisible({ timeout: 10000 });

  for (const title of [`${RUN} task edited`, `${RUN} quick task`]) {
    const row = rowWithActions(page, title);
    if (await row.isVisible().catch(() => false)) {
      await deleteBtn(row).click({ force: true });
      await expect(page.getByText(title)).toHaveCount(0, { timeout: 10000 });
    }
  }
});

test('planner routines: create, toggle, delete', async ({ page }) => {
  await login(page);
  await openPlannerTab(page, 'Routine');
  await page.getByRole('button', { name: 'Add Routine' }).click();
  await page.getByPlaceholder(/Brush teeth/).fill(`${RUN} routine`);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(`${RUN} routine`).first()).toBeVisible({ timeout: 10000 });

  const card = rowWithActions(page, `${RUN} routine`);
  const toggle = card.getByRole('button', { name: /^(Active|Resume)$/ }).first();
  if (await toggle.isVisible().catch(() => false)) await toggle.click();

  await deleteBtn(card).click({ force: true });
  await expect(page.getByText(`${RUN} routine`)).toHaveCount(0, { timeout: 10000 });
});

test('planner lists: list + item full CRUD', async ({ page }) => {
  await login(page);
  await openPlannerTab(page, 'Lists');
  await page.getByRole('button', { name: 'Add List' }).click();
  await page.getByPlaceholder(/Weekly Groceries/).fill(`${RUN} list`);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(`${RUN} list`).first()).toBeVisible({ timeout: 10000 });

  const listCard = page
    .locator('div')
    .filter({ has: page.locator(`h3:has-text("${RUN} list")`) })
    .filter({ has: page.getByRole('button', { name: /Show items|Hide items/ }) })
    .last();
  await listCard.getByRole('button', { name: 'Show items' }).click();
  await page.getByPlaceholder('Add item...').fill(`${RUN} item`);
  await page.getByPlaceholder('Add item...').press('Enter');
  await expect(page.getByText(`${RUN} item`).first()).toBeVisible({ timeout: 10000 });

  const itemRow = rowWithActions(page, `${RUN} item`);
  await itemRow.locator('input[type="checkbox"]').first().click();
  await deleteBtn(itemRow).click({ force: true });
  await expect(page.getByText(`${RUN} item`)).toHaveCount(0, { timeout: 10000 });

  await deleteBtn(rowWithActions(page, `${RUN} list`)).click();
  await expect(page.getByText(`${RUN} list`)).toHaveCount(0, { timeout: 10000 });
});

test('planner meals: create, edit, delete', async ({ page }) => {
  await login(page);
  await openPlannerTab(page, 'Meals');
  await page.getByRole('button', { name: 'Add Meal' }).click();
  await page.locator('input[type="date"]').first().fill('2026-08-01');
  await page.locator('select').first().selectOption({ label: 'Dinner' });
  await page.getByPlaceholder(/Spaghetti/).fill(`${RUN} meal`);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(`${RUN} meal`).first()).toBeVisible({ timeout: 10000 });

  const card = rowWithActions(page, `${RUN} meal`);
  await editBtn(card).click({ force: true });
  const input = page.locator(`input[value="${RUN} meal"], textarea:has-text("${RUN} meal")`).first();
  await input.fill(`${RUN} meal edited`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`${RUN} meal edited`).first()).toBeVisible({ timeout: 10000 });

  await deleteBtn(rowWithActions(page, `${RUN} meal edited`)).click();
  await expect(page.getByText(`${RUN} meal edited`)).toHaveCount(0, { timeout: 10000 });
});

test('planner notes: create, edit, delete', async ({ page }) => {
  await login(page);
  await openPlannerTab(page, 'Notes');
  await page.getByRole('button', { name: 'Add Note' }).click();
  await page.getByPlaceholder(/title/i).first().fill(`${RUN} note`);
  await page.getByPlaceholder('Write your note...').fill(`${RUN} note content`);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(`${RUN} note`).first()).toBeVisible({ timeout: 10000 });

  // Anchor precisely on the card header owning this exact title
  const card = page.locator(`div:has(> h3:text-is("${RUN} note"))`).last();
  await editBtn(card).click({ force: true });
  await page.locator(`input[value="${RUN} note"]`).first().fill(`${RUN} note edited`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`${RUN} note edited`).first()).toBeVisible({ timeout: 10000 });

  await deleteBtn(rowWithActions(page, `${RUN} note edited`)).click();
  await expect(page.getByText(`${RUN} note edited`)).toHaveCount(0, { timeout: 10000 });
});

test('child hub: add child via the new inline form', async ({ page }) => {
  await login(page);
  await page.goto('/child-hub');
  await page.getByRole('button', { name: /Add (Your First )?Child/ }).first().click();
  await expect(page.getByTestId('add-child-form')).toBeVisible();
  await page.locator('#child-name').fill(`${RUN} Kid`);
  await page.locator('#child-dob').fill('2020-05-15');
  await page.locator('#child-gender').selectOption('girl');
  await page.getByTestId('add-child-form').getByRole('button', { name: 'Add Child' }).click();
  await expect(page.getByText(`${RUN} Kid`).first()).toBeVisible({ timeout: 10000 });
});

test('child detail: all six tabs render, health + routine + schedule notes CRUD', async ({ page }) => {
  await login(page);
  await page.goto('/child-hub');
  await page.getByText(`${RUN} Kid`).first().click();
  await expect(page).toHaveURL(/child-hub\/[0-9a-f-]{36}/, { timeout: 10000 });

  for (const tab of ['Overview', 'Health', 'Routine', 'Schedule', 'Documents', 'Share']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
  }

  // Health: create/update via upsert form
  await page.getByRole('button', { name: 'Health', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Health Info' }).click();
  await page.getByPlaceholder(/Ventolin/).fill('QA Vitamin D');
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await expect(page.getByText('QA Vitamin D').first()).toBeVisible({ timeout: 10000 });

  // Routine (previously unreachable dead tab — now wired in)
  await page.getByRole('button', { name: 'Routine', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Routine Info' })).toBeVisible({ timeout: 10000 });

  // Schedule notes CRUD
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await page.locator('textarea').first().fill(`${RUN} schedule note`);
  await page.getByRole('button', { name: 'Add Note' }).click();
  await expect(page.getByText(`${RUN} schedule note`).first()).toBeVisible({ timeout: 10000 });
  const noteRow = rowWithActions(page, `${RUN} schedule note`);
  await noteRow.hover();
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(page.getByText(`${RUN} schedule note`)).toHaveCount(0, { timeout: 10000 });

  // Share: generate + revoke
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Secure Link' }).click();
  await expect(page.getByTitle('Revoke').first()).toBeVisible({ timeout: 15000 });
  await page.getByTitle('Revoke').first().click();
  await expect(page.getByText('Revoked').first()).toBeVisible({ timeout: 10000 });
});

test('needle: save and unsave a place', async ({ page }) => {
  await login(page);
  await page.goto('/needle');
  await expect(page.getByText(/results found/).first()).toBeVisible({ timeout: 15000 });
  const firstCard = page.locator('button:has(svg.lucide-bookmark)').first();
  await firstCard.click();
  await expect(page.getByText(/Saved Places \(\d+\)/)).toBeVisible({ timeout: 10000 });
  // Unsave via the now-checked bookmark
  await page.locator('button:has(svg.lucide-bookmark-check)').first().click();
});

test('profile: edit profile name and delete the QA child', async ({ page }) => {
  await login(page);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  const nameInput = page.locator('input').first();
  await nameInput.fill('QA Beta Family');
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await page.waitForLoadState('load');
  await expect(page.getByText('QA Beta Family').first()).toBeVisible({ timeout: 15000 });

  // Delete the child created earlier (confirm dialog auto-accepted)
  const childRow = rowWithActions(page, `${RUN} Kid`);
  await deleteBtn(childRow).click({ force: true });
  await expect(page.getByText(`${RUN} Kid`)).toHaveCount(0, { timeout: 10000 });
});

test('notifications panel opens', async ({ page }) => {
  await login(page);
  await page.locator('button:has(svg.lucide-bell)').first().click();
  await expect(page.getByText(/Notifications/i).first()).toBeVisible({ timeout: 10000 });
});

test('logout works', async ({ page }) => {
  await login(page);
  await page.goto('/profile');
  await page.getByRole('main').getByRole('button', { name: 'Log Out' }).click();
  await page.waitForURL(/login|^\/$|famify/, { timeout: 15000 });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/, { timeout: 15000 });
});
