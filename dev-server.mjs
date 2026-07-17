import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = resolve(import.meta.dirname);
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 5_000);
const TDSP_API_ORIGIN = (process.env.TDSP_API_ORIGIN || 'https://api.tdsp.online').replace(/\/+$/, '');
const TDSP_API_HOST = process.env.TDSP_API_HOST || '';
const LEADER_SCHEDULE_URL = process.env.LEADER_SCHEDULE_URL || `${TDSP_API_ORIGIN}/api/leader-schedule`;

const proxyRoutes = {
  '/__coingecko_price_proxy__': () =>
    'https://api.coingecko.com/api/v3/simple/price?ids=cardano,bitcoin&vs_currencies=usd',
  '/__geckoterminal_price_proxy__': () =>
    'https://api.geckoterminal.com/api/v2/simple/networks/cardano/token_price/3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e,6d06570ddd778ec7c0cca09d381eca194e90c8cffa7582879735dbde584552,b6a7467ea1deb012808ef4e87b5ff371e85f7142d7b356a40d9b42a0436f726e75636f70696173205b76696120436861696e506f72742e696f5d',
  '/__dashboard_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/dashboard`,
  '/__committee_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/committee`,
  '/__health_proxy__': () =>
    `${TDSP_API_ORIGIN}/health`,
  '/__pool_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/pool`,
  '/__leader_schedule_proxy__': () =>
    LEADER_SCHEDULE_URL,
  '/__starch_proxy__': url => {
    const teamId = String(url.searchParams.get('teamId') || '').toUpperCase();
    return /^[0-9A-F]{6}$/.test(teamId)
      ? `${TDSP_API_ORIGIN}/api/starch/${encodeURIComponent(teamId)}`
      : null;
  },
  '/__proposal_votes_proxy__': url => {
    const proposalId = url.searchParams.get('proposalId');
    return proposalId
      ? `${TDSP_API_ORIGIN}/api/proposal/${encodeURIComponent(proposalId)}/votes`
      : null;
  },
  '/__drep_directory_proxy__': url => {
    const type = url.searchParams.get('type');
    if (type === 'metadata') return `${TDSP_API_ORIGIN}/api/dreps/metadata`;
    if (type === 'info') return `${TDSP_API_ORIGIN}/api/dreps/info`;
    return null;
  },
  '/__drep_detail_proxy__': url => {
    const drepId = url.searchParams.get('drepId');
    return drepId
      ? `${TDSP_API_ORIGIN}/api/drep/${encodeURIComponent(drepId)}`
      : null;
  },
  '/__metadata_proxy__': url => {
    const metadataUrl = url.searchParams.get('url');
    return isAllowedMetadataUrl(metadataUrl) ? metadataUrl : null;
  }
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonld': 'application/ld+json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function isAllowedMetadataUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (isPrivateOrLocalHost(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return true;

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4) return false;

  const [a, b] = ipv4.slice(1).map(Number);
  return a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

async function proxyRequest(target, res) {
  const upstream = await requestUpstream(target);
  res.writeHead(upstream.statusCode, {
    'cache-control': 'no-store',
    'content-type': upstream.contentType || 'application/json; charset=utf-8'
  });
  res.end(upstream.body);
}

function requestUpstream(target) {
  return new Promise((resolveRequest, rejectRequest) => {
    const targetUrl = new URL(target);
    const requestFn = targetUrl.protocol === 'http:' ? httpRequest : httpsRequest;
    const headers = {
      accept: 'application/json,text/plain,*/*',
      'user-agent': 'tdsp-local-dev-server'
    };
    if (TDSP_API_HOST && targetUrl.host !== TDSP_API_HOST) {
      headers.host = TDSP_API_HOST;
    }
    let settled = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      clearTimeout(wallClockTimeout);
      rejectRequest(error);
    };
    const complete = payload => {
      if (settled) return;
      settled = true;
      clearTimeout(wallClockTimeout);
      resolveRequest(payload);
    };
    const wallClockTimeout = setTimeout(() => {
      req.destroy(new Error(`Upstream timed out after ${UPSTREAM_TIMEOUT_MS}ms`));
    }, UPSTREAM_TIMEOUT_MS);
    const req = requestFn(targetUrl, {
      headers,
      servername: TDSP_API_HOST || targetUrl.hostname
    }, upstream => {
      const chunks = [];
      upstream.on('data', chunk => chunks.push(chunk));
      upstream.on('end', () => {
        complete({
          body: Buffer.concat(chunks),
          contentType: upstream.headers['content-type'],
          statusCode: upstream.statusCode || 502
        });
      });
    });

    req.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
      req.destroy(new Error(`Upstream timed out after ${UPSTREAM_TIMEOUT_MS}ms`));
    });
    req.on('error', fail);
    req.end();
  });
}

function getStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = decoded === '/' ? '/index.html' : decoded;
  const filePath = normalize(join(ROOT, requested));
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${sep}`)) return null;
  return filePath;
}

async function serveStatic(pathname, res) {
  const filePath = getStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    await readFile(filePath);
  } catch {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': contentTypes[extname(filePath)] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const route = proxyRoutes[url.pathname];

  try {
    if (route) {
      const target = route(url);
      if (!target) {
        sendJson(res, 400, { error: 'Missing or invalid proxy parameter' });
        return;
      }
      console.log(`${req.method} ${url.pathname} -> ${target}`);
      await proxyRequest(target, res);
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    console.warn(`${req.method} ${url.pathname} failed: ${error instanceof Error ? error.message : error}`);
    sendJson(res, 502, { error: error instanceof Error ? error.message : 'Proxy request failed' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`TDSP local dev server running at http://${HOST}:${PORT}/`);
  console.log(`TDSP API origin: ${TDSP_API_ORIGIN}`);
  if (TDSP_API_HOST) console.log(`TDSP API host header/SNI: ${TDSP_API_HOST}`);
});
