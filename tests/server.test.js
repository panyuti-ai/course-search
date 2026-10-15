import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.AI_PROVIDER = 'anthropic';
process.env.JWT_SECRET = 'test-secret';

let server;
let baseUrl;

before(async () => {
  const { app } = await import('../server.js');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('health endpoint reports the service is running', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: 'course-search' });
});

test('the main page and core frontend assets are served', async () => {
  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /id="search-view"/);
  assert.match(html, /id="planner-view"/);
  assert.match(html, /id="floating-timetable"/);
  assert.match(html, /data-i18n-text="pdf-privacy-notice"/);
  assert.match(html, /src="fcu-seal\.png"/);
  assert.match(html, /src="app\.js"/);

  const logoResponse = await fetch(`${baseUrl}/fcu-seal.png`);
  assert.equal(logoResponse.status, 200);
  assert.match(logoResponse.headers.get('content-type') || '', /^image\/png/);
  assert.ok((await logoResponse.arrayBuffer()).byteLength > 1000);
});

test('protected planner APIs reject anonymous requests', async () => {
  const response = await fetch(`${baseUrl}/api/planner-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 401);
});

test('NID login URL uses the official FCU OAuth host', async () => {
  const response = await fetch(`${baseUrl}/api/auth/nid-url`);
  const payload = await response.json();
  const loginUrl = new URL(payload.url);

  assert.equal(response.status, 200);
  assert.equal(loginUrl.hostname, 'opendata.fcu.edu.tw');
  assert.ok(loginUrl.searchParams.get('client_id'));
  assert.ok(loginUrl.searchParams.get('client_url'));
});

test('outline index reports actual coverage without issuing upstream calls', async () => {
  const response=await fetch(`${baseUrl}/api/course-outlines?semester=115-1`);
  const data=await response.json();
  assert.equal(response.status,200);
  assert.ok(data.coverage.total>3000);
  assert.equal(data.coverage.fetched,Object.keys(data.previews).length);
  assert.ok(data.coverage.summarized<=data.coverage.fetched);
});
test('outline endpoint rejects malformed and nonexistent course identities', async () => {
  assert.equal((await fetch(`${baseUrl}/api/course-outline?semester=115-1&selCode=bad`)).status,400);
  assert.equal((await fetch(`${baseUrl}/api/course-outline?semester=999-1&selCode=9999`)).status,404);
  assert.equal((await fetch(`${baseUrl}/api/course-outline?semester=114-2&selCode=1793`)).status,404);
  assert.equal((await fetch(`${baseUrl}/api/course-grade-rules?semester=114-2&selCode=1793`)).status,404);
});

test('website exposes only the current official catalog, with legacy inputs kept outside public', async () => {
  const response = await fetch(`${baseUrl}/fcu_courses.json`);
  const courses = await response.json();
  assert.deepEqual([...new Set(courses.map(course => course.semester))], ['115-1']);
  for (const file of ['courses.json', 'converted_coursesd.json', 'data.json', 'opt_all_courses_with_experience.json']) {
    assert.equal((await fetch(`${baseUrl}/${file}`)).status, 404, `${file} should not be served`);
  }
  const index = await (await fetch(`${baseUrl}/api/course-outlines`)).json();
  assert.equal(index.coverage.semester, '115-1');
  assert.equal(index.coverage.total, courses.length);
});

test('assistant validates current offerings even when an older client sends historical or invented candidates', async () => {
  const catalog = JSON.parse(await readFile(new URL('../public/fcu_courses.json', import.meta.url), 'utf8'));
  const offering = catalog.find(course => course.teacher && course.times.length && course.times.length <= 12);
  const course = { id: 'valid-current', course: offering.course, teacher: offering.teacher,
    timeSlots: offering.times, credits: offering.credits, semester: offering.semester, selCode: offering.selCode };
  const originalFetch = globalThis.fetch;
  let prompt;
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith(baseUrl)) return originalFetch(url, options);
    assert.equal(new URL(url).hostname, 'api.anthropic.com');
    prompt = JSON.parse(options.body).messages[0].content;
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify({
      reply: '使用當期候選課程。', actions: [{ type: 'add', ref: 'C1' }, { type: 'add', ref: 'C2' }, { type: 'add', ref: 'C3' }],
    }) }] }) };
  };
  try {
    const response = await originalFetch(`${baseUrl}/api/planner-chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ nid: 'catalog-test' }, 'test-secret')}` },
      body: JSON.stringify({ message: '推薦可以加入的課', planner: {
        selected: [{ id: 'user-existing', course: '個人已存課程', timeSlots: ['FRI14'], credits: 1 }],
        candidates: [
          { id: 'historical', course: '電路電子學', teacher: '蔡鈺鼎', timeSlots: ['WED6','WED7','WED8'] },
          { ...course, id: 'stale-term', semester: '114-2' },
          { ...course, id: 'invented', course: '虛構課程' },
          course,
        ],
      } }),
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(result.actions.map(action => action.courseId), ['valid-current']);
    assert.doesNotMatch(prompt, /電路電子學|虛構課程/);
    assert.match(prompt, /115-1 校方開課清單/);
    assert.match(prompt, /個人已存課程/, 'selected snapshots remain available for discussion and removal');
  } finally { globalThis.fetch = originalFetch; }
});
