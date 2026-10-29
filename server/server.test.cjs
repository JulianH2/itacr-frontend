'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it, mock } = require('node:test');

const { createServer } = require('./server.cjs');

describe('static server of the PWA (ITACR-57)', () => {
  let root;
  let server;
  let baseUrl;

  before(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'itacr-server-'));
    fs.writeFileSync(path.join(root, 'index.html'), '<html>app</html>');
    fs.writeFileSync(path.join(root, 'main-ABC123.js'), 'console.log(1)');
    fs.writeFileSync(path.join(root, 'ngsw.json'), '{}');
    fs.mkdirSync(path.join(root, 'assets'));
    fs.writeFileSync(path.join(root, 'assets', 'photo.webp'), 'webp');
    server = createServer(root);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('should forbid framing the app on every answer', async () => {
    for (const route of ['/', '/main-ABC123.js', '/login', '/missing.js']) {
      const response = await fetch(baseUrl + route);

      assert.equal(
        response.headers.get('content-security-policy'),
        "frame-ancestors 'none'",
        route,
      );
      assert.equal(response.headers.get('x-frame-options'), 'DENY', route);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff', route);
    }
  });

  it('should answer a route of the app with index.html, like the SPA mode it replaces', async () => {
    const response = await fetch(baseUrl + '/orders/detail/abc');

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(await response.text(), '<html>app</html>');
  });

  it('should serve a file with its content type', async () => {
    const script = await fetch(baseUrl + '/main-ABC123.js');
    const photo = await fetch(baseUrl + '/assets/photo.webp');

    assert.match(script.headers.get('content-type'), /text\/javascript/);
    assert.equal(photo.headers.get('content-type'), 'image/webp');
  });

  it('should answer 404 for a missing file with an extension', async () => {
    const response = await fetch(baseUrl + '/nope.js');

    assert.equal(response.status, 404);
  });

  it('should ask the browser to check index.html and the service worker files every time', async () => {
    const index = await fetch(baseUrl + '/');
    const ngsw = await fetch(baseUrl + '/ngsw.json');
    const script = await fetch(baseUrl + '/main-ABC123.js');

    assert.equal(index.headers.get('cache-control'), 'no-cache');
    assert.equal(ngsw.headers.get('cache-control'), 'no-cache');
    assert.equal(script.headers.get('cache-control'), null);
  });

  it('should not leave the folder of the app when the path tries to', async () => {
    const outside = path.join(path.dirname(root), 'secret.txt');
    fs.writeFileSync(outside, 'secret');
    try {
      for (const route of ['/%2e%2e/secret.txt', '/..%2fsecret.txt', '/%00']) {
        const response = await fetch(baseUrl + route);
        assert.notEqual(await response.text(), 'secret', route);
      }
    } finally {
      fs.rmSync(outside);
    }
  });

  it('should answer 404, and keep running, when a file disappears while it is being served', async () => {
    const target = path.join(root, 'main-ABC123.js');
    const realStat = fs.statSync;
    let calls = 0;
    const stat = mock.method(fs, 'statSync', (file, ...rest) => {
      if (file === target && ++calls === 2) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      }
      return realStat(file, ...rest);
    });
    try {
      const response = await fetch(baseUrl + '/main-ABC123.js');

      assert.equal(response.status, 404);
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
    } finally {
      stat.mock.restore();
    }

    assert.equal((await fetch(baseUrl + '/')).status, 200);
  });

  it('should only accept GET and HEAD', async () => {
    const post = await fetch(baseUrl + '/', { method: 'POST' });
    const head = await fetch(baseUrl + '/', { method: 'HEAD' });

    assert.equal(post.status, 405);
    assert.equal(post.headers.get('x-frame-options'), 'DENY');
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  });
});
