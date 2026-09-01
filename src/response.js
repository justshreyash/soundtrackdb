const PROVIDER = 'CNF1G';
const CREATOR = 'shreyash';

function respond(res, statusCode, data) {
  res.status(statusCode).set({
    'Content-Type': 'application/json; charset=utf-8',
    'X-API-Provider': PROVIDER,
    'X-API-Creator': CREATOR,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-cache',
  }).send(JSON.stringify({
    provider: PROVIDER,
    creator: CREATOR,
    success: true,
    ...data,
  }, null, 2));
}

function respondError(res, statusCode, message) {
  res.status(statusCode).set({
    'Content-Type': 'application/json; charset=utf-8',
    'X-API-Provider': PROVIDER,
    'X-API-Creator': CREATOR,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-cache',
  }).send(JSON.stringify({
    provider: PROVIDER,
    creator: CREATOR,
    success: false,
    error: message,
  }, null, 2));
}

module.exports = {
  respond,
  respondError,
  PROVIDER,
  CREATOR,
};