const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const resolved = path.resolve(ROOT, `.${normalized}`);
  return resolved.startsWith(ROOT) ? resolved : null;
}

function tryFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

function resolveRequestPath(urlPath) {
  const safePath = safeResolve(urlPath);
  if (!safePath) {
    return null;
  }

  if (tryFile(safePath)) {
    return safePath;
  }

  if (!path.extname(safePath) && tryFile(`${safePath}.html`)) {
    return `${safePath}.html`;
  }

  const directoryIndex = path.join(safePath, 'index.html');
  if (tryFile(directoryIndex)) {
    return directoryIndex;
  }

  return null;
}

const COMPRESSIBLE = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml']);

function wantsGzip(req) {
  const enc = (req.headers['accept-encoding'] || '').toLowerCase();
  return enc.includes('gzip');
}

function serveFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const cache =
    ext === '.html'
      ? 'no-store'
      : ext === '.css' || ext === '.js'
        ? 'public, max-age=86400'
        : 'public, max-age=604800';

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
  };

  const useGzip = wantsGzip(req) && COMPRESSIBLE.has(ext);
  if (useGzip) {
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  }

  res.writeHead(200, headers);

  const raw = fs.createReadStream(filePath);
  if (useGzip) {
    raw.pipe(zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED })).pipe(res);
  } else {
    raw.pipe(res);
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const requestPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = resolveRequestPath(requestPath);

  if (!filePath) {
    sendJson(res, 404, { error: 'File not found', path: requestPath });
    return;
  }

  if (req.method === 'HEAD') {
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end();
    return;
  }

  serveFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log(`EduCoin local server running at http://localhost:${PORT}`);
});
