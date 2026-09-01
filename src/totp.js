const { createHmac } = require('crypto');

const TOTP_VERSION = '61';
const TOTP_SECRET = [
  44, 55, 47, 42, 70, 40, 34, 114,
  76, 74, 50, 111, 120, 97, 75, 76,
  94, 102, 43, 69, 49, 120, 118, 80,
  64, 78,
];
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';

function computeTotp(serverTime) {
  const transformed = TOTP_SECRET.map((v, i) => v ^ ((i % 33) + 9));
  const secretStr = transformed.join('');
  const keyBuf = Buffer.from(secretStr);
  const counter = Math.floor(serverTime / 30);
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  timeBuf.writeUInt32BE(counter & 0xffffffff, 4);

  const hmac = createHmac('sha1', keyBuf).update(timeBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

async function getSpotifyToken(cookie = null) {
  const serverTimeRes = await fetch('https://open.spotify.com/api/server-time', {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: 'https://open.spotify.com/',
    },
  });

  if (!serverTimeRes.ok) {
    throw new Error(`Failed to fetch server time: HTTP ${serverTimeRes.status}`);
  }

  const { serverTime } = await serverTimeRes.json();
  const totp = computeTotp(serverTime);
  const params = new URLSearchParams({
    reason: 'transport',
    productType: 'web-player',
    totp,
    totpVer: TOTP_VERSION,
    ts: String(serverTime),
  });

  const headers = {
    'User-Agent': UA,
    Accept: 'application/json',
    Referer: 'https://open.spotify.com/',
  };
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`https://open.spotify.com/api/token?${params}`, { headers });

  if (!res.ok) {
    throw new Error(`Failed to fetch access token: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.accessToken) {
    throw new Error('No access token in response');
  }

  return data;
}

module.exports = {
  getSpotifyToken,
  computeTotp,
};