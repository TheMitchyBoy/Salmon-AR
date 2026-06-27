'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const store = require('./lib/store');
const auth = require('./lib/auth');
const { streamBodyToFile } = require('./lib/upload');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mind': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function serveFile(res, filePath, reqMethod = 'GET') {
  const ext = path.extname(filePath).toLowerCase();
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  };

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    headers['Content-Length'] = stat.size;
    if (reqMethod === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleApi(req, res, urlPath) {
  if (urlPath === '/api/health' && req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      adminEnabled: auth.adminEnabled(),
      dataDir: store.DATA_DIR,
      maxUploadMB: Math.round(MAX_UPLOAD_BYTES / (1024 * 1024)),
      recommendedImageEdge: 1280,
    });
  }

  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = JSON.parse((await readBody(req, 1024 * 64)).toString('utf8'));
      const result = auth.login(body.password || '');
      if (!result.ok) return json(res, 401, { error: result.error });
      return json(res, 200, { token: result.token });
    } catch {
      return json(res, 400, { error: 'Invalid request body' });
    }
  }

  if (urlPath === '/api/targets/active' && req.method === 'GET') {
    const active = store.getActiveTarget();
    if (!active) {
      return json(res, 404, { error: 'No active target set' });
    }
    const headers = {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fs.statSync(active.filePath).size,
      'Cache-Control': 'no-cache',
      'X-Target-Id': active.meta.id,
      'X-Target-Name': encodeURIComponent(active.meta.name),
    };
    res.writeHead(200, headers);
    fs.createReadStream(active.filePath).pipe(res);
    return;
  }

  if (urlPath === '/api/targets' && req.method === 'GET') {
    if (!auth.requireAdmin(req, res)) return;
    return json(res, 200, store.listTargets());
  }

  if (urlPath === '/api/targets' && req.method === 'POST') {
    if (!auth.requireAdmin(req, res)) return;
    try {
      const contentType = (req.headers['content-type'] || '').toLowerCase();

      // Preferred: raw binary upload (avoids huge base64 JSON payloads that crash fetch).
      if (contentType.includes('application/octet-stream')) {
        const tempId = crypto.randomBytes(8).toString('hex');
        const tempPath = path.join(store.TARGETS_DIR, `${tempId}.upload.tmp`);

        const bytes = await streamBodyToFile(req, tempPath, MAX_UPLOAD_BYTES);
        if (!bytes) {
          fs.unlink(tempPath, () => {});
          return json(res, 400, { error: 'Empty upload body' });
        }

        let imageNames = [];
        const rawNames = req.headers['x-image-names'];
        if (rawNames) {
          try {
            imageNames = JSON.parse(decodeURIComponent(rawNames));
          } catch {
            try {
              imageNames = JSON.parse(rawNames);
            } catch {
              fs.unlink(tempPath, () => {});
              return json(res, 400, { error: 'Invalid X-Image-Names header' });
            }
          }
        }

        let name = 'Untitled target set';
        const rawName = req.headers['x-target-name'];
        if (rawName) {
          try {
            name = decodeURIComponent(rawName);
          } catch {
            name = rawName;
          }
        }

        const entry = store.createTargetFromFile({ name, imageNames, sourcePath: tempPath });
        return json(res, 201, entry);
      }

      const body = JSON.parse((await readBody(req, MAX_UPLOAD_BYTES)).toString('utf8'));
      if (!body.mindBase64) return json(res, 400, { error: 'mindBase64 is required' });
      const mindBuffer = Buffer.from(body.mindBase64, 'base64');
      if (!mindBuffer.length) return json(res, 400, { error: 'mindBase64 is empty' });

      const entry = store.createTarget({
        name: body.name,
        imageNames: body.imageNames || [],
        mindBuffer,
      });
      return json(res, 201, entry);
    } catch (err) {
      console.error('POST /api/targets failed:', err);
      if (err.message && err.message.includes('too large')) {
        return json(res, 413, { error: err.message });
      }
      if (err.message && err.message.includes('Could not save')) {
        return json(res, 507, { error: err.message });
      }
      return json(res, 400, { error: err.message || 'Invalid request body' });
    }
  }

  const activateMatch = urlPath.match(/^\/api\/targets\/([a-f0-9]+)\/activate$/);
  if (activateMatch && req.method === 'PUT') {
    if (!auth.requireAdmin(req, res)) return;
    const ok = store.setActive(activateMatch[1]);
    return json(res, ok ? 200 : 404, ok ? { ok: true } : { error: 'Target not found' });
  }

  const deleteMatch = urlPath.match(/^\/api\/targets\/([a-f0-9]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    if (!auth.requireAdmin(req, res)) return;
    const ok = store.deleteTarget(deleteMatch[1]);
    return json(res, ok ? 200 : 404, ok ? { ok: true } : { error: 'Target not found' });
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (urlPath.startsWith('/api/')) {
    try {
      await handleApi(req, res, urlPath);
    } catch (err) {
      console.error('API error:', err);
      json(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let staticPath = urlPath;
  if (staticPath === '/' || staticPath === '') staticPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, staticPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  serveFile(res, filePath, req.method);
});

server.listen(PORT, HOST, () => {
  store.listTargets();
  console.log(`Salmon AR server listening on http://${HOST}:${PORT}`);
  console.log(`Admin dashboard: http://${HOST}:${PORT}/admin.html`);
  console.log(`Data directory: ${store.DATA_DIR}`);
  if (!auth.adminEnabled()) {
    console.warn('ADMIN_PASSWORD is not set — admin uploads are disabled.');
  }
});
