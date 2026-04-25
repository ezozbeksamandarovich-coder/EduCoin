const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { URL } = require('url');
const Database = require('better-sqlite3');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = path.join(ROOT, 'data', 'educoin.db');
const SEEDED_USERS_PATH = path.join(ROOT, 'data', 'users.json');
const DOWNLOADS_DIR = path.join(ROOT, 'downloads');
const ALLOWED_ROLES = new Set(['student', 'teacher', 'manager', 'director', 'admin']);
const DOWNLOAD_ARTIFACTS = [
  { id: 'windows', filename: 'EduCoin-Setup.exe', label: 'Windows .exe' },
  { id: 'android', filename: 'EduCoin-Mobile.apk', label: 'Android .apk' },
];

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

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeText(value, fallback = '') {
  const normalized = String(value ?? fallback).trim();
  return normalized || fallback;
}

function normalizeRole(role) {
  const normalized = normalizeText(role, 'student').toLowerCase();
  return ALLOWED_ROLES.has(normalized) ? normalized : 'student';
}

function normalizeActive(value) {
  return !(value === false || value === 0 || value === '0' || value === 'false') ? 1 : 0;
}

function normalizeUserRecord(user, index = 0) {
  const username = normalizeText(user?.username, `user${index + 1}`);
  const name = normalizeText(user?.name || user?.fullName, username);
  const fullName = normalizeText(user?.fullName, name);

  return {
    id: normalizeText(user?.id, `u${Date.now()}_${index}`),
    username,
    password: String(user?.password || 'password123'),
    role: normalizeRole(user?.role),
    name,
    fullName,
    email: normalizeText(user?.email, ''),
    code: normalizeText(user?.code, username),
    avatar: user?.avatar ? String(user.avatar) : null,
    coins: Number(user?.coins || 0),
    active: normalizeActive(user?.active),
    createdAt: normalizeText(user?.createdAt, new Date().toISOString()),
  };
}

function sanitizeUsers(users) {
  const byUsername = new Map();
  const usedIds = new Set();

  (Array.isArray(users) ? users : []).forEach((user, index) => {
    const normalized = normalizeUserRecord(user, index);
    byUsername.set(normalized.username.toLowerCase(), normalized);
  });

  if (![...byUsername.values()].some((user) => user.role === 'admin')) {
    const admin = normalizeUserRecord(
      {
        id: 'u001',
        username: 'admin',
        password: 'DeveloperE',
        role: 'admin',
        name: 'Admin',
        fullName: 'Admin',
        email: 'admin@educoin.uz',
        code: 'admin001',
        coins: 0,
        active: 1,
        createdAt: '2024-01-01T00:00:00Z',
      },
      0
    );
    byUsername.set(admin.username.toLowerCase(), admin);
  }

  return [...byUsername.values()].map((user, index) => {
    let nextId = user.id;
    if (!nextId || usedIds.has(nextId)) {
      nextId = `u${Date.now()}_${index}`;
    }
    usedIds.add(nextId);
    return { ...user, id: nextId };
  });
}

function getDownloadStatus() {
  return DOWNLOAD_ARTIFACTS.map((artifact) => {
    const filePath = path.join(DOWNLOADS_DIR, artifact.filename);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        return {
          ...artifact,
          exists: true,
          href: `/downloads/${artifact.filename}`,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        };
      }
    } catch {
      // ignore missing files
    }

    return {
      ...artifact,
      exists: false,
      href: `/downloads/${artifact.filename}`,
      size: 0,
      updatedAt: null,
    };
  });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    fullName TEXT,
    email TEXT,
    code TEXT,
    avatar TEXT,
    coins INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    createdAt TEXT
  );
`);

function seedUsersIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;
  const seededUsers = sanitizeUsers(readJsonFile(SEEDED_USERS_PATH, []));
  const insert = db.prepare(`
    INSERT INTO users (id, username, password, role, name, fullName, email, code, avatar, coins, active, createdAt)
    VALUES (@id, @username, @password, @role, @name, @fullName, @email, @code, @avatar, @coins, @active, @createdAt)
  `);
  const tx = db.transaction((users) => {
    users.forEach((u, i) => {
      insert.run(normalizeUserRecord(u, i));
    });
  });
  tx(seededUsers);
}

function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY createdAt ASC').all().map((u) => ({
    ...u,
    coins: Number(u.coins || 0),
    active: Boolean(u.active),
  }));
}

function replaceAllUsers(users) {
  const nextUsers = sanitizeUsers(users);
  const insert = db.prepare(`
    INSERT INTO users (id, username, password, role, name, fullName, email, code, avatar, coins, active, createdAt)
    VALUES (@id, @username, @password, @role, @name, @fullName, @email, @code, @avatar, @coins, @active, @createdAt)
  `);
  const wipe = db.prepare('DELETE FROM users');
  const tx = db.transaction((nextUsers) => {
    wipe.run();
    nextUsers.forEach((u, i) => {
      insert.run(normalizeUserRecord(u, i));
    });
  });
  tx(nextUsers);
  return nextUsers;
}
seedUsersIfEmpty();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk.toString();
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
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
        ? 'no-cache, must-revalidate'
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (requestUrl.pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, app: 'EduCoin API', storage: 'file-db' });
    return;
  }

  if (requestUrl.pathname === '/api/downloads/status' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, items: getDownloadStatus() });
    return;
  }

  if (requestUrl.pathname === '/api/users' && req.method === 'GET') {
    sendJson(res, 200, getAllUsers());
    return;
  }

  if (requestUrl.pathname === '/api/users' && req.method === 'PUT') {
    readBody(req)
      .then((payload) => {
        if (!Array.isArray(payload)) {
          sendJson(res, 400, { ok: false, message: 'Users payload array bo\'lishi kerak' });
          return;
        }
        const savedUsers = replaceAllUsers(payload);
        sendJson(res, 200, { ok: true, count: savedUsers.length });
      })
      .catch((error) => {
        sendJson(res, 400, { ok: false, message: error.message || 'Bad request' });
      });
    return;
  }

  if (requestUrl.pathname === '/api/login' && req.method === 'POST') {
    readBody(req)
      .then((payload) => {
        const username = String(payload.username || '').trim().toLowerCase();
        const password = String(payload.password || '');
        const found = getAllUsers().find((user) => {
          const candidates = [
            String(user.username || '').toLowerCase(),
            String(user.name || '').toLowerCase(),
            String(user.fullName || '').toLowerCase(),
          ];
          const userPassword = String(user.password || '');
          return candidates.includes(username) && userPassword === password && user.active !== false;
        });
        if (!found) {
          sendJson(res, 401, { success: false, message: 'Login yoki parol xato' });
          return;
        }
        sendJson(res, 200, {
          success: true,
          message: 'Muvaffaqiyatli login',
          user: found,
        });
      })
      .catch((error) => {
        sendJson(res, 400, { success: false, message: error.message || 'Bad request' });
      });
    return;
  }

  if (requestUrl.pathname.startsWith('/api/dashboard/') && req.method === 'GET') {
    const role = decodeURIComponent(requestUrl.pathname.slice('/api/dashboard/'.length)).toLowerCase();
    const users = getAllUsers();
    const current = users.find((user) => user.role === role && user.active) || users.find((user) => user.active) || null;
    sendJson(res, 200, {
      role,
      coins: Number(current?.coins || 0),
      message: current
        ? `${current.name} uchun dashboard ma'lumotlari`
        : "Dashboard ma'lumotlari tayyor",
    });
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
