import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-key';
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
