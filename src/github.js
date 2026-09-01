const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'tokens.json';
const LOCAL_PATH = path.join(__dirname, '../tokens.json');

function buildPayload(accessToken) {
  return {
    tokens: [
      {
        access_token: accessToken,
        generated_at: new Date().toISOString(),
        expires_in: 3600,
        source: 'totp',
      },
    ],
    last_updated: new Date().toISOString(),
    source: 'cnf1g-sptfy-api',
  };
}

function saveLocally(payload) {
  try {
    fs.writeFileSync(LOCAL_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch {}
}

async function pushToGitHub(payload) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return;

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'cnf1g-sptfy-api',
  };

  let sha = null;
  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      sha = (await res.json()).sha;
    }
  } catch {}

  const encoded = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
  const body = {
    message: `chore: refresh token [${new Date().toISOString()}]`,
    content: encoded,
    ...(sha ? { sha } : {}),
  };

  try {
    await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  } catch {}
}

async function commitToken(accessToken) {
  const payload = buildPayload(accessToken);
  saveLocally(payload);
  await pushToGitHub(payload);
}

module.exports = {
  commitToken,
};