import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preserveCourseIds } from '../scripts/scrapeFcu.js';

const execute = promisify(execFile);
const scraper = fileURLToPath(new URL('../scripts/scrapeFcu.js', import.meta.url));
const official = { sub_name: '測試當期課程', scr_teacher: '測試教師', scr_selcode: '0001',
  scr_credit: 3, scr_period: '(一)03-05 測試教室 測試教師' };

test('refresh preserves favorite identities through reordering, removal and teacher corrections', () => {
  const existing = [
    { course: '舊課', teacher: '教師甲', semester: '115-1', selCode: '0001', source: 'fcu_scrape', id: 'saved-favorite' },
    { course: '另一課', teacher: '教師乙', semester: '115-1', selCode: '0002', source: 'fcu_scrape' },
  ];
  const refreshed = preserveCourseIds([
    { ...existing[1], teacher: '修正教師' },
    { course: '新課', teacher: '教師丙', semester: '115-1', selCode: '0003' },
    { ...existing[0], semester: '115-2' },
  ], existing);
  assert.equal(refreshed[0].id, '另一課|教師乙|115-1|fcu_scrape|1');
  assert.equal(refreshed[1].id, 'fcu|115-1|0003');
  assert.equal(refreshed[2].id, 'fcu|115-2|0001', 'a new term must not reuse an old favorite');
  assert.equal(preserveCourseIds([{ ...existing[0], teacher: '修正教師' }], existing)[0].id, 'saved-favorite');
});

async function withScraperFixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'course-catalog-'));
  const requests = [];
  let mode = 'ok';
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const payload = JSON.parse(body);
    requests.push(payload);
    const failed = mode === 'partial' && payload.typeOptions.weekPeriod.week === '3';
    res.writeHead(failed ? 503 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items: mode === 'empty' || failed ? [] : [official] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const out = join(directory, 'catalog.json');
  const scrape = () => execute(process.execPath, [scraper, '--year', '115', '--sms', '1', '--delay', '0', '--out', out], {
    env: { ...process.env, FCU_BASE_URL: `http://127.0.0.1:${server.address().port}` }, timeout: 15000,
  });
  try { await run({ out, requests, scrape, setMode: value => { mode = value; } }); }
  finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
}

test('default scraper replaces historical rows with only the requested term and keeps current IDs', async () => {
  await withScraperFixture(async ({ out, requests, scrape }) => {
    await writeFile(out, JSON.stringify([
      { course: '測試當期課程', teacher: '測試教師', semester: '115-1', selCode: '0001', id: 'keep-favorite' },
      { course: '歷史課程', teacher: '測試教師', semester: '114-2', selCode: '0001', id: 'old' },
    ]));
    await scrape();
    const courses = JSON.parse(await readFile(out, 'utf8'));
    assert.equal(courses.length, 1);
    assert.equal(courses[0].semester, '115-1');
    assert.equal(courses[0].id, 'keep-favorite');
    assert.equal(requests.length, 8);
    assert.ok(requests.every(request => request.baseOptions.year === '115' && request.baseOptions.sms === '1'));
  });
});

test('empty or partial school responses cannot replace the existing catalog', async () => {
  await withScraperFixture(async ({ out, scrape, setMode }) => {
    const previous = '[{"course":"保留原清單","teacher":"測試教師"}]';
    await writeFile(out, previous);
    for (const mode of ['empty', 'partial']) {
      setMode(mode);
      await assert.rejects(scrape());
      assert.equal(await readFile(out, 'utf8'), previous);
    }
  });
});

test('historical scrape and merge flags cannot write to the website directory', async () => {
  for (const flag of ['--include-history', '--merge']) {
    await assert.rejects(execute(process.execPath, [scraper, '--year', '115', '--sms', '1', flag]), error => {
      assert.match(error.stderr, /public/);
      return true;
    });
  }
});
