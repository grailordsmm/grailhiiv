import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('VPS refresh sends the bearer token and reports failed feeds', async () => {
  const secret = 'test-secret';
  let received;
  const server = createServer((request, response) => {
    received = request.headers.authorization;
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ checked: 2, failed: 1 }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const child = spawn(process.execPath, ['scripts/refresh-news.mjs'], {
      env: { ...process.env, NEWS_CRON_SECRET: secret, NEWS_REFRESH_URL: `http://127.0.0.1:${server.address().port}/api/news/refresh` },
      stdio: 'ignore',
    });
    const [code] = await once(child, 'exit');
    assert.equal(code, 1);
    assert.equal(received, `Bearer ${secret}`);
  } finally { server.close(); }
});

test('VPS refresh refuses to send its secret to non-local HTTP', async () => {
  const child = spawn(process.execPath, ['scripts/refresh-news.mjs'], {
    env: { ...process.env, NEWS_CRON_SECRET: 'test-secret', NEWS_REFRESH_URL: 'http://example.com/api/news/refresh' },
    stdio: 'ignore',
  });
  const [code] = await once(child, 'exit');
  assert.equal(code, 1);
});

test('VPS refresh succeeds when all feeds refresh', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ checked: 2, failed: 0 }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const child = spawn(process.execPath, ['scripts/refresh-news.mjs'], {
      env: { ...process.env, NEWS_CRON_SECRET: 'test-secret', NEWS_REFRESH_URL: `http://127.0.0.1:${server.address().port}/api/news/refresh` },
      stdio: 'ignore',
    });
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
  } finally { server.close(); }
});
