import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function readJson(relativePath) {
  const url = new URL(`../${relativePath}`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

test('course data files contain usable course records', async () => {
  const files = [
    'public/courses.json',
    'public/fcu_courses.json',
    'public/course_reviews.json'
  ];

  for (const file of files) {
    const records = await readJson(file);
    assert.ok(Array.isArray(records), `${file} should be an array`);
    assert.ok(records.length > 0, `${file} should not be empty`);
    assert.equal(
      records.filter((record) => typeof record?.course !== 'string' || !record.course.trim()).length,
      0,
      `${file} contains a record without a course name`
    );
    assert.equal(
      records.filter((record) => typeof record?.teacher !== 'string').length,
      0,
      `${file} contains a record without a teacher field`
    );
  }
});

test('official FCU records keep scheduling fields in the expected shape', async () => {
  const records = await readJson('public/fcu_courses.json');
  assert.ok(records.length > 1000, 'official course data is unexpectedly small');
  assert.equal(records.filter((record) => !Array.isArray(record.times)).length, 0);
  assert.equal(records.filter((record) => typeof record.semester !== 'string').length, 0);
});

test('every supported language includes the PDF privacy notice', async () => {
  const i18nSource = await readFile(new URL('../public/i18n.js', import.meta.url), 'utf8');
  const matches = i18nSource.match(/'pdf-privacy-notice':/g) || [];
  assert.equal(matches.length, 5);
});

test('confirmation and toast messages exist in every supported language', async () => {
  const i18nSource = await readFile(new URL('../public/i18n.js', import.meta.url), 'utf8');
  const keys = [
    'clear-favorites-title',
    'clear-favorites-confirm',
    'favorites-cleared',
    'planner-export-empty',
    'planner-unpin-title',
    'planner-unpin-action'
  ];

  for (const key of keys) {
    const matches = i18nSource.match(new RegExp(`'${key}':`, 'g')) || [];
    assert.equal(matches.length, 5, `${key} should exist in all five languages`);
  }
});

test('frontend does not use native alert or confirm dialogs', async () => {
  const appSource = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(appSource, /\b(?:alert|confirm)\s*\(/);
});
