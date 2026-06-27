'use strict';

const crypto = require('crypto');

function adminSecret() {
  return String(process.env.ADMIN_PASSWORD || '').trim();
}

function adminEnabled() {
  return adminSecret().length > 0;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** Stable token — does not expire; changes only if ADMIN_PASSWORD changes. */
function issueToken() {
  return crypto
    .createHmac('sha256', adminSecret())
    .update('salmon-ar-admin-v1')
    .digest('hex');
}

function isAuthorized(req) {
  if (!adminEnabled()) return false;

  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const provided = match[1].trim();
  if (!provided) return false;

  // Current stable token
  if (safeEqual(provided, issueToken())) return true;

  // Direct password (fallback if client sends password as bearer)
  if (safeEqual(provided, adminSecret())) return true;

  return false;
}

function login(password) {
  if (!adminEnabled()) {
    return { ok: false, error: 'Admin is not configured. Set ADMIN_PASSWORD on the server.' };
  }

  const attempt = String(password).trim();
  if (!safeEqual(attempt, adminSecret())) {
    return { ok: false, error: 'Invalid password.' };
  }

  return { ok: true, token: issueToken() };
}

function requireAdmin(req, res) {
  if (!adminEnabled()) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Admin is not configured. Set ADMIN_PASSWORD on the server.' }));
    return false;
  }
  if (!isAuthorized(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not signed in. Enter your admin password again.' }));
    return false;
  }
  return true;
}

module.exports = {
  adminEnabled,
  login,
  isAuthorized,
  requireAdmin,
};
