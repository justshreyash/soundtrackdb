const { getSpotifyToken } = require('./totp');
const { commitToken } = require('./github');

const CLIENT_ID = 'd8a5ed958d274c2e8ee717e6a4b0971d';
const APP_VERSION = '1.2.84.359.g17db506e';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';

const fs = require('fs');
const path = require('path');

let cachedToken = null;
let cachedClientToken = null;
let expiresAt = 0;
let clientTokenExpiresAt = 0;

function loadLocalToken() {
  try {
    const p = path.join(__dirname, '../tokens.json');
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const entry = data.tokens?.[0];
      if (entry?.access_token) {
        const generatedAt = new Date(entry.generated_at).getTime();
        const expiresIn = (entry.expires_in || 3600) * 1000;
        // If still valid (with 5-minute safety buffer)
        if (Date.now() < generatedAt + expiresIn - 300000) {
          expiresAt = generatedAt + expiresIn - 300000;
          return entry.access_token;
        }
      }
    }
  } catch {}
  return null;
}

cachedToken = loadLocalToken();

async function fetchClientToken() {
  try {
    const res = await fetch('https://clienttoken.spotify.com/v1/clienttoken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_data: {
          client_version: APP_VERSION,
          client_id: CLIENT_ID,
          js_sdk_data: {
            device_brand: 'unknown',
            device_model: 'unknown',
            os: 'linux',
            os_version: 'unknown',
            device_id: Math.random().toString(36).slice(2),
            device_type: 'computer',
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.granted_token?.token || data.client_token || null;
    const ttl = data.granted_token?.expires_after_seconds || 3600;
    if (token) clientTokenExpiresAt = Date.now() + ttl * 1000;
    return token;
  } catch {
    return null;
  }
}

async function refreshToken() {
  try {
    const tokenData = await getSpotifyToken();
    const token = typeof tokenData === 'string' ? tokenData : tokenData.accessToken;
    cachedToken = token;
    expiresAt = Date.now() + 30 * 60 * 1000;
    await commitToken(token);
  } catch {}
}

async function getToken(force = false) {
  if (!force && cachedToken && Date.now() < expiresAt) return cachedToken;
  await refreshToken();
  return cachedToken;
}

async function getClientToken() {
  if (cachedClientToken && Date.now() < clientTokenExpiresAt) return cachedClientToken;
  cachedClientToken = await fetchClientToken();
  return cachedClientToken;
}

function startScheduler(intervalMinutes = 30) {
  const cron = require('node-cron');
  const expr = `*/${intervalMinutes} * * * *`;
  cron.schedule(expr, refreshToken);
  refreshToken();
  fetchClientToken().then(t => { cachedClientToken = t; });
}

module.exports = { getToken, getClientToken, refreshToken, startScheduler };
