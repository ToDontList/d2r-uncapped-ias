import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// These are UI contracts transcribed from the v1.8.2 fixtures, NOT calls to core.js.
// Each test gets a fresh browser context/localStorage and loads the real modules.
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await use(page);
    expect(errors, 'No browser runtime or resource-loading errors').toEqual([]);
  },
});

const weapons = {
  sword: 'w4', twoSword: 'w9', spear: 'w75', bow: 'w94', crossbow: 'w110',
  claw: 'w118', wrist: 'w120', slowClaw: 'w121', fastClaw: 'w124',
};
const classCases = [
  ['ama', '아마존', 10, 6], ['sor', '원소술사', 12, 7],
  ['nec', '강령술사', 9, 5], ['pal', '성기사', 7, 4],
  ['bar', '야만용사', 7, 4], ['dru', '드루이드', 9, 5],
  ['ass', '암살자', 7, 4], ['war', '악마술사', 9, 5],
];
const csvHeader = ['손', '프레임', '필요 총 EIAS', '필요 장비 IAS(%)',
  '초당 판정 주기(이론)', '상한 초과', '변신 연타 구간(F)', '사이클(F)'];

async function selectWhirlwind(page, char = 'ass') {
  await page.goto('/');
  await page.locator('#class').selectOption(char);
  await expect(page.locator('#attack option[value="whirl"]')).toHaveCount(1);
  await page.locator('#attack').selectOption('whirl');
  await expect(page.locator('#accuracy')).toHaveText('훨윈드 이론 계산');
}

async function dualClaws(page) {
  await selectWhirlwind(page);
  await expect(page.locator('#dual')).toBeEnabled();
  await page.locator('#dual').check();
  await page.locator('#weaponMain').selectOption(weapons.fastClaw);
  await page.locator('#weaponOff').selectOption(weapons.slowClaw);
  await expect(page.locator('#offBox')).toBeVisible();
  await expect(page.locator('#offTab')).toBeVisible();
  await expect(page.locator('#wsmMain')).toHaveValue('-30');
  await expect(page.locator('#wsmOff')).toHaveValue('10');
}

async function expectHands(page, main, off, combined, eias) {
  await expect(page.locator('#mainFrame')).toHaveText(`${main}F`);
  await expect(page.locator('#offFrame')).toHaveText(`${off}F`);
  await expect(page.locator('#currentFrame')).toHaveText(String(combined));
  await expect(page.locator('#totalEias')).toHaveText(eias);
}

async function tableRows(page) {
  return page.locator('#bpRows tr').evaluateAll(rows => rows.map(row =>
    Array.from(row.cells, cell => cell.textContent)));
}

async function downloadCSV(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#exportCSV').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('D2R_Reimagined_IAS_breakpoints.csv');
  expect(await download.failure()).toBeNull();
  const bytes = await readFile(await download.path());
  expect([...bytes.subarray(0, 3)], 'UTF-8 BOM for Korean spreadsheet text').toEqual([239, 187, 191]);
  const text = bytes.toString('utf8').slice(1);
  expect(text).toContain('\r\n');
  expect(text.replaceAll('\r\n', '')).not.toMatch(/[\r\n]/);
  // This export has no comma/quote/newline-bearing fields. Exact width is intentional.
  const [header, ...rows] = text.split('\r\n').map(line => line.split(','));
  expect(header).toEqual(csvHeader);
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(row).toHaveLength(8);
    expect(row.join(',')).not.toMatch(/NaN|undefined|Infinity/);
    expect(row[4]).toMatch(/^\d+\.\d{3}$/);
    expect(row.slice(6)).toEqual(['', '']);
  }
  return rows;
}

function expectCSVMatchesTable(rows, hand, table, cap = null) {
  const exported = rows.filter(row => row[0] === hand);
  expect(exported).toHaveLength(table.length);
  for (let i = 0; i < table.length; i++) {
    const [frame, eias, ias, rate] = table[i];
    const row = exported[i];
    expect(Number(row[1])).toBe(Number(frame.replace('F', '')));
    expect(Number(row[2])).toBe(Number(eias));
    expect(row[3]).toBe(ias === '스킬 공속 필요' ? ias : ias.replace(/[,%]/g, ''));
    // CSV has three decimals and the screen has two; permit only rounding difference.
    expect(Math.abs(Number(row[4]) - Number(rate))).toBeLessThanOrEqual(0.0051);
    expect(row[5]).toBe(cap !== null && Number(eias) > cap ? 'Y' : 'N');
    if (i) expect(Number(row[2])).toBeGreaterThan(Number(exported[i - 1][2]));
  }
  expect(exported.at(-1)[1]).toBe('1');
}

for (const [char, name, baseline, withIAS] of classCases) {
  test(`${name}: select Whirlwind, update IAS, render and export the single-hand table`, async ({ page }) => {
    await selectWhirlwind(page, char);
    await expect(page.locator('#class option:checked')).toContainText(name);
    await page.locator('#weaponMain').selectOption(weapons.sword);
    await expect(page.locator('#wsmMain')).toHaveValue('0');
    await expect(page.locator('#currentFrame')).toHaveText(String(baseline));
    await expect(page.locator('#totalEias')).toHaveText('0');
    await expect(page.locator('#tableCurrent td').first()).toHaveText(`${baseline}F`);
    await expect(page.locator('#offBox')).toBeHidden();
    await expect(page.locator('#offTab')).toBeHidden();
    await expect(page.locator('#handResults')).toBeHidden();
    if (['bar', 'ass'].includes(char)) await expect(page.locator('#dual')).toBeEnabled();
    else await expect(page.locator('#dual')).toBeDisabled();
    await expect(page.locator('#aps')).toContainText('판정 주기 · 실제 명중 횟수와 다름');
    await expect(page.locator('#resultMessage')).toContainText('게임 실측 미검증');
    await page.locator('#iasGear').fill('120');
    await expect(page.locator('#totalEias')).toHaveText('+60');
    await expect(page.locator('#currentFrame')).toHaveText(String(withIAS));
    await expect(page.locator('#tableCurrent td').first()).toHaveText(`${withIAS}F`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth),
      'The frame table must scroll inside its card, not widen the entire mobile page')
      .toBeLessThanOrEqual(page.viewportSize().width);
    const table = await tableRows(page);
    const csv = await downloadCSV(page);
    expect(new Set(csv.map(row => row[0]))).toEqual(new Set(['주무기']));
    expectCSVMatchesTable(csv, '주무기', table);
  });
}

test('Assassin: independent weapon IAS, gear IAS, manual WSM, hand tabs and single-hand toggle', async ({ page }) => {
  await dualClaws(page);
  await expectHands(page, 5, 8, 7, '+30 / -10');
  await expect(page.locator('#frameLabel')).toHaveText('쌍수 훨윈드 예상 판정 간격');
  await expect(page.locator('#nextBP')).toHaveText('4F · +49 EIAS');
  await expect(page.locator('#tableCurrent td').first()).toHaveText('5F');
  await page.locator('#iasOff').fill('120');
  await expectHands(page, 5, 4, 5, '+30 / +50');
  await page.locator('#offTab').click();
  await expect(page.locator('#tableCurrent td').first()).toHaveText('4F');
  await page.locator('#iasMain').fill('120');
  await expectHands(page, 3, 4, 4, '+90 / +50');
  await page.locator('#iasMain').fill('0');
  await page.locator('#iasOff').fill('0');
  await page.locator('#iasGear').fill('120');
  await expectHands(page, 3, 4, 4, '+90 / +50');
  await page.locator('#iasGear').fill('0');
  await page.locator('#wsmMain').fill('0');
  await expectHands(page, 7, 8, 8, '0 / -10');
  await page.locator('#wsmOff').fill('0');
  await expectHands(page, 7, 7, 7, '0 / 0');
  await page.locator('#weaponMain').selectOption(weapons.fastClaw);
  await page.locator('#weaponOff').selectOption(weapons.slowClaw);
  await expectHands(page, 5, 8, 7, '+30 / -10');
  await page.locator('#dual').uncheck();
  await expect(page.locator('#currentFrame')).toHaveText('5');
  await expect(page.locator('#handResults')).toBeHidden();
  await expect(page.locator('#offTab')).toBeHidden();
  await expect(page.locator('[data-hand="main"]')).toHaveClass('active');
  await expect(page.locator('#tableCurrent td').first()).toHaveText('5F');
  const csv = await downloadCSV(page);
  expect(csv.every(row => row[0] === '주무기')).toBe(true);
  expectCSVMatchesTable(csv, '주무기', await tableRows(page));
  await page.locator('#dual').check();
  await expectHands(page, 5, 8, 7, '+30 / -10');
});

test('Assassin: swapping both weapons with their IAS preserves the combined interval', async ({ page }) => {
  await dualClaws(page);
  await page.locator('#iasOff').fill('120');
  await expectHands(page, 5, 4, 5, '+30 / +50');
  await page.locator('#weaponMain').selectOption(weapons.slowClaw);
  await page.locator('#weaponOff').selectOption(weapons.fastClaw);
  await page.locator('#iasMain').fill('120');
  await page.locator('#iasOff').fill('0');
  await expectHands(page, 4, 5, 5, '+50 / +30');
  await expect(page.locator('#wsmMain')).toHaveValue('10');
  await expect(page.locator('#wsmOff')).toHaveValue('-30');
  await page.reload();
  await expectHands(page, 4, 5, 5, '+50 / +30');
});

test('Assassin: the 23/24 EIAS boundary updates the result, current row and next breakpoint', async ({ page }) => {
  await selectWhirlwind(page);
  await page.locator('#weaponMain').selectOption(weapons.wrist);
  await page.locator('#iasMain').fill('29'); // floor(120*29/149) = 23
  await expect(page.locator('#totalEias')).toHaveText('+23');
  await expect(page.locator('#currentFrame')).toHaveText('6');
  await expect(page.locator('#tableCurrent td').first()).toHaveText('6F');
  await expect(page.locator('#nextBP')).toHaveText('5F · +24 EIAS');
  await page.locator('#iasMain').fill('30'); // EIAS 24
  await expect(page.locator('#currentFrame')).toHaveText('5');
  await expect(page.locator('#tableCurrent td').nth(1)).toHaveText('+24');
  await expect(page.locator('#nextBP')).toHaveText('4F · +49 EIAS');
  await page.locator('#iasMain').fill('29');
  await expect(page.locator('#currentFrame')).toHaveText('6');
});

test('Assassin: CSV contains both complete hand tables with independent required IAS', async ({ page }) => {
  await dualClaws(page);
  await page.locator('#iasOff').fill('120');
  const mainTable = await tableRows(page);
  await page.locator('#offTab').click();
  const offTable = await tableRows(page);
  // Export from the off tab still includes both hands, in main/off order.
  const csv = await downloadCSV(page);
  expect(csv).toHaveLength(mainTable.length + offTable.length);
  expect(csv.slice(0, mainTable.length).every(row => row[0] === '주무기')).toBe(true);
  expectCSVMatchesTable(csv, '주무기', mainTable);
  expectCSVMatchesTable(csv, '보조무기', offTable);
  expect(csv.find(row => row[0] === '주무기' && row[2] === '49'))
    .toEqual(['주무기', '4', '49', '23', '6.250', 'N', '', '']);
  expect(csv.find(row => row[0] === '보조무기' && row[2] === '49'))
    .toEqual(['보조무기', '4', '49', '0', '6.250', 'N', '', '']);
  expect(csv.at(-1)).toEqual(['보조무기', '1', '270', '스킬 공속 필요', '25.000', 'N', '', '']);
  // A later edit must affect the next download, without a page reload.
  await page.locator('#iasOff').fill('0');
  const updated = await downloadCSV(page);
  expect(updated.find(row => row[0] === '보조무기' && row[2] === '49')?.[3]).toBe('117');
});

test('cap selection updates frames, table markings and CSV without hiding unreachable rows', async ({ page }) => {
  await selectWhirlwind(page, 'sor');
  await page.locator('#weaponMain').selectOption(weapons.twoSword);
  await page.locator('[data-field="other"]').fill('1000');
  await expect(page.locator('#currentFrame')).toHaveText('1');
  await page.locator('#cap').selectOption('500');
  await expect(page.locator('#currentFrame')).toHaveText('2');
  await expect(page.locator('#totalEias')).toHaveText('+1000');
  await expect(page.locator('#resultMessage')).toContainText('계산에는 +500만 적용');
  await expect(page.locator('#tableCurrent td').first()).toHaveText('2F');
  await expect(page.locator('#bpRows .cap-row')).toHaveCount(1);
  const csv = await downloadCSV(page);
  expectCSVMatchesTable(csv, '주무기', await tableRows(page), 500);
  expect(csv.at(-1)).toEqual(['주무기', '1', '601', '0', '25.000', 'Y', '', '']);
  await page.locator('#cap').selectOption('none');
  await expect(page.locator('#currentFrame')).toHaveText('1');
  await expect(page.locator('#bpRows .cap-row')).toHaveCount(0);
  expect((await downloadCSV(page)).at(-1)[5]).toBe('N');
});

test('Assassin: both hands show the cap warning while raw EIAS stays visible', async ({ page }) => {
  await dualClaws(page);
  await page.locator('[data-field="other"]').fill('1000');
  await page.locator('#cap').selectOption('500');
  await expectHands(page, 1, 1, 1, '+1030 / +990');
  await expect(page.locator('#resultMessage')).toContainText('보조무기에도 같은 상한');
  await expect(page.locator('#resultMessage')).toContainText('계산에는 +500만 적용');
});

test('invalid weapons are filtered and replaced when entering Whirlwind or dual wield', async ({ page }) => {
  await selectWhirlwind(page);
  for (const id of ['w0', weapons.bow, weapons.crossbow]) {
    await expect(page.locator(`#weaponMain option[value="${id}"]`)).toHaveCount(0);
  }
  await page.locator('#weaponMain').selectOption(weapons.sword);
  await page.locator('#dual').check();
  for (const hand of ['Main', 'Off']) {
    await expect(page.locator(`#weapon${hand} option`)).toHaveCount(21);
    await expect(page.locator(`#weapon${hand} optgroup`)).toHaveAttribute('label', '클러');
    await expect(page.locator(`#weapon${hand} option[value="${weapons.sword}"]`)).toHaveCount(0);
  }
  await expect(page.locator('#currentFrame')).not.toHaveText('—');
  await page.locator('#class').selectOption('bar');
  await page.locator('#weaponMain').selectOption(weapons.bow);
  await page.locator('#attack').selectOption('whirl');
  await expect(page.locator('#weaponMain')).not.toHaveValue(weapons.bow);
  await expect(page.locator(`#weaponMain option[value="${weapons.claw}"]`)).toHaveCount(0);
  await page.locator('#weaponMain').selectOption(weapons.spear);
  await page.locator('#dual').check();
  await expect(page.locator('#weaponMain')).not.toHaveValue(weapons.spear);
  await expect(page.locator(`#weaponMain option[value="${weapons.spear}"]`)).toHaveCount(0);
  await page.locator('#weaponMain').selectOption(weapons.twoSword);
  await page.locator('#weaponOff').selectOption(weapons.sword);
  await expectHands(page, 7, 7, 7, '0 / 0');
});

for (const [char, search] of [['ass', 'Crystal Sword'], ['bar', ' / Spear']]) {
  test(`${char}: an incompatible search cannot strand the UI when dual wield is enabled`, async ({ page }) => {
    await selectWhirlwind(page, char);
    await page.locator('#searchMain').fill(search);
    await page.locator('#wsmMain').fill('77');
    await page.locator('#dual').check();
    await expect(page.locator('#weaponMain')).toHaveValue(char === 'ass' ? weapons.claw : 'w1');
    await expect(page.locator('#wsmMain')).toHaveValue(char === 'ass' ? '-10' : '-20');
    await expect(page.locator('#searchMain')).toHaveValue('');
    await expect(page.locator('#currentFrame')).toHaveText(char === 'ass' ? '6' : '5');
    await expect(page.locator('#bpRows .current-row')).toHaveCount(1);
    const csv = await downloadCSV(page);
    expect(new Set(csv.map(row => row[0]))).toEqual(new Set(['주무기', '보조무기']));
    const selected = await page.locator('#weaponMain').inputValue();
    await page.reload();
    await expect(page.locator('#weaponMain')).toHaveValue(selected);
  });
}

for (const source of ['shared URL', 'localStorage']) {
  test(`invalid restored dual-claw combination is normalized from ${source}`, async ({ page }) => {
    const state = { char: 'ass', form: 'human', attack: 'whirl', dual: true,
      weaponMain: weapons.bow, weaponOff: weapons.sword, wsmMain: 77, wsmOff: 88 };
    if (source === 'shared URL') {
      const encoded = Buffer.from(JSON.stringify(state)).toString('base64');
      await page.goto(`/?s=${encodeURIComponent(encoded)}`);
    } else {
      await page.goto('/');
      await page.evaluate(value => localStorage.setItem('ias_reimagined_v1', JSON.stringify(value)), state);
      await page.reload();
    }
    await expect(page.locator('#dual')).toBeChecked();
    await expect(page.locator('#weaponMain')).toHaveValue(weapons.claw);
    await expect(page.locator('#weaponOff')).toHaveValue(weapons.claw);
    await expect(page.locator('#wsmMain')).toHaveValue('-10');
    await expect(page.locator('#wsmOff')).toHaveValue('-10');
    await expectHands(page, 6, 6, 6, '+10 / +10');
    expect(new Set((await downloadCSV(page)).map(row => row[0])))
      .toEqual(new Set(['주무기', '보조무기']));
  });
}
