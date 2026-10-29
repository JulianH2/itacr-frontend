'use strict';

/**
 * Static server of the PWA on Azure App Service (ITACR-57). It replaces `pm2 serve`, which cannot send HTTP headers, so the
 * app can answer with `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` (CWE-1021, clickjacking).
 * It has no dependencies: the deploy copies this file next to `index.html`, and the startup command is `node server.cjs`.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const DEFAULT_PORT = 8080;

/** Sent with every answer, so no other site can put the app inside a frame. */
const SECURITY_HEADERS = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Files the browser must ask about every time, so a new deploy and a new service worker are picked up. */
const NO_CACHE_FILES = new Set([
  'index.html',
  'ngsw.json',
  'ngsw-worker.js',
  'safety-worker.js',
  'manifest.webmanifest',
]);

/**
 * Where a request path lives inside `root`, or null when it points outside of it. An unknown path without an extension is a
 * route of the app, so it gets `index.html` (what `pm2 serve --spa` did); an unknown file with an extension is a real 404.
 */
function resolveFile(root, requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) {
    return null;
  }

  const candidate = path.normalize(path.join(root, decoded));
  if (candidate !== root && !candidate.startsWith(root + path.sep)) {
    return null;
  }

  if (isFile(candidate)) {
    return candidate;
  }

  return path.extname(decoded) === '' ? path.join(root, 'index.html') : null;
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function send(response, status, headers, body) {
  response.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  response.end(body);
}

function sendNotFound(response, request) {
  send(
    response,
    404,
    { 'Content-Type': 'text/plain; charset=utf-8' },
    request.method === 'HEAD' ? '' : 'Not found',
  );
}

/** Creates the server for the files of `root`. It does not listen yet. */
function createServer(root) {
  const base = path.resolve(root);

  return http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      send(response, 405, { Allow: 'GET, HEAD' }, '');
      return;
    }

    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    const file = resolveFile(base, pathname);
    if (file === null) {
      sendNotFound(response, request);
      return;
    }

    // The file can disappear between resolveFile and here (a deploy replacing the folder); that is a 404, not a crash.
    let stats;
    try {
      stats = fs.statSync(file);
    } catch {
      sendNotFound(response, request);
      return;
    }
    const headers = {
      'Content-Type': CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': stats.size,
      'Last-Modified': stats.mtime.toUTCString(),
    };
    if (NO_CACHE_FILES.has(path.basename(file))) {
      headers['Cache-Control'] = 'no-cache';
    }

    response.writeHead(200, { ...SECURITY_HEADERS, ...headers });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    fs.createReadStream(file)
      .on('error', () => response.destroy())
      .pipe(response);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  createServer(__dirname).listen(port, () => {
    console.log(`ITACR frontend listening on port ${port}`);
  });
}

module.exports = { SECURITY_HEADERS, createServer, resolveFile };
