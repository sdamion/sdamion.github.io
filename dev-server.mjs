import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = resolve(import.meta.dirname);
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 5_000);
const AI_UPSTREAM_TIMEOUT_MS = Number(process.env.AI_UPSTREAM_TIMEOUT_MS || 130_000);
const PUBLIC_TDSP_API_ORIGIN = 'https://api.tdsp.online';
const TDSP_API_ORIGIN = normalizeAllowedApiOrigin(
  process.env.TDSP_API_ORIGIN || PUBLIC_TDSP_API_ORIGIN,
  'TDSP_API_ORIGIN'
);
const METADATA_API_ORIGIN = normalizeAllowedApiOrigin(
  process.env.METADATA_API_ORIGIN || TDSP_API_ORIGIN,
  'METADATA_API_ORIGIN'
);
const PRICE_API_ORIGIN = normalizeAllowedApiOrigin(
  process.env.PRICE_API_ORIGIN || TDSP_API_ORIGIN,
  'PRICE_API_ORIGIN'
);
const TDSP_API_HOST = process.env.TDSP_API_HOST || '';
const LEADER_SCHEDULE_URL = normalizeAllowedApiUrl(
  process.env.LEADER_SCHEDULE_URL || `${TDSP_API_ORIGIN}/api/leader-schedule`,
  'LEADER_SCHEDULE_URL'
);
const STARCH_POOL_URL = normalizeAllowedApiUrl(
  process.env.STARCH_POOL_URL || `${TDSP_API_ORIGIN}/api/starch/pools`,
  'STARCH_POOL_URL'
);
const NEWS_API_URL = normalizeAllowedApiUrl(
  process.env.NEWS_API_URL || `${TDSP_API_ORIGIN}/api/news`,
  'NEWS_API_URL'
);
const CARDANO_EVENTS_API_URL = normalizeAllowedApiUrl(
  process.env.CARDANO_EVENTS_API_URL || `${TDSP_API_ORIGIN}/api/events`,
  'CARDANO_EVENTS_API_URL'
);
const CIPS_API_URL = normalizeAllowedApiUrl(
  process.env.CIPS_API_URL || `${TDSP_API_ORIGIN}/api/cips`,
  'CIPS_API_URL'
);
const CATALYST_BUSINESS_API_URL = normalizeAllowedApiUrl(
  process.env.CATALYST_BUSINESS_API_URL || `${TDSP_API_ORIGIN}/api/catalyst/businesses`,
  'CATALYST_BUSINESS_API_URL'
);
const CATALYST_PROPOSALS_API_URL = (
  normalizeAllowedApiUrl(
    process.env.CATALYST_PROPOSALS_API_URL || `${TDSP_API_ORIGIN}/api/catalyst/proposals`,
    'CATALYST_PROPOSALS_API_URL'
  )
).replace(/\/+$/, '');
const CATALYST_PILOT_2026_API_URL = normalizeAllowedApiUrl(
  process.env.CATALYST_PILOT_2026_API_URL || `${TDSP_API_ORIGIN}/api/catalyst/pilot-2026`,
  'CATALYST_PILOT_2026_API_URL'
);
const CATALYST_PROPOSAL_DETAIL_API_BASE_URL = (
  normalizeAllowedApiUrl(
    process.env.CATALYST_PROPOSAL_DETAIL_API_BASE_URL || `${TDSP_API_ORIGIN}/api/catalyst/proposal`,
    'CATALYST_PROPOSAL_DETAIL_API_BASE_URL'
  )
).replace(/\/+$/, '');
const CATALYST_PROPOSAL_SUMMARY_API_BASE_URL = (
  normalizeAllowedApiUrl(
    process.env.CATALYST_PROPOSAL_SUMMARY_API_BASE_URL || `${TDSP_API_ORIGIN}/api/catalyst/proposal`,
    'CATALYST_PROPOSAL_SUMMARY_API_BASE_URL'
  )
).replace(/\/+$/, '');


const CONSTITUTION_CHAT_API_URL = normalizeAllowedApiUrl(
  process.env.CONSTITUTION_CHAT_API_URL || `${TDSP_API_ORIGIN}/api/constitution/chat`,
  'CONSTITUTION_CHAT_API_URL'
);
const CONSTITUTION_CHAT_FEEDBACK_API_URL = normalizeAllowedApiUrl(
  process.env.CONSTITUTION_CHAT_FEEDBACK_API_URL || `${TDSP_API_ORIGIN}/api/constitution/chat/feedback`,
  'CONSTITUTION_CHAT_FEEDBACK_API_URL'
);
const CONSTITUTION_DOCUMENT_API_URL = normalizeAllowedApiUrl(
  process.env.CONSTITUTION_DOCUMENT_API_URL || `${TDSP_API_ORIGIN}/api/constitution/document`,
  'CONSTITUTION_DOCUMENT_API_URL'
);

function isLocalApiHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    /^127(?:\.\d{1,3}){3}$/.test(host) ||
    /^192\.168\.(?:1|4)\.\d{1,3}$/.test(host);
}

function isAllowedApiUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol === 'https:' && ['api.tdsp.online', 'www.thedutchstakepool.com'].includes(url.hostname.toLowerCase())) return true;
    return (url.protocol === 'http:' || url.protocol === 'https:') && isLocalApiHost(url.hostname);
  } catch {
    return false;
  }
}

function normalizeAllowedApiUrl(value, name) {
  const candidate = String(value || '').trim();
  if (isAllowedApiUrl(candidate)) return candidate;
  throw new Error(`${name} must use localhost, 192.168.1.x, 192.168.4.x for tests or ${PUBLIC_TDSP_API_ORIGIN}.`);
}

function normalizeAllowedApiOrigin(value, name) {
  const candidate = normalizeAllowedApiUrl(value, name);
  return new URL(candidate).origin.replace(/\/+$/, '');
}

function appendLanguageParam(target, url) {
  const language = String(url.searchParams.get('lang') || '').trim();
  if (!language) return target;
  const separator = target.includes('?') ? '&' : '?';
  return `${target}${separator}lang=${encodeURIComponent(language)}`;
}

const proxyRoutes = {
  '/__prices_proxy__': () =>
    `${PRICE_API_ORIGIN}/api/prices`,
  '/__news_proxy__': () =>
    NEWS_API_URL,
  '/__events_proxy__': () =>
    CARDANO_EVENTS_API_URL,
  '/__cips_proxy__': url =>
    appendLanguageParam(CIPS_API_URL, url),
  '/__dashboard_proxy__': url =>
    appendLanguageParam(`${TDSP_API_ORIGIN}/api/dashboard`, url),
  '/__dashboard_compact_proxy__': url =>
    appendLanguageParam(`${TDSP_API_ORIGIN}/api/dashboard/compact`, url),
  '/__treasury_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/treasury`,
  '/__treasury_administrators_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/treasury/administrators`,
  '/__catalyst_business_proxy__': () =>
    CATALYST_BUSINESS_API_URL,
  '/__funding_recipients_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/funding/recipients`,
  '/__funding_overview_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/funding/overview`,
  '/__catalyst_proposals_proxy__': url => {
    if (url.searchParams.get('type') === 'funds') {
      return appendLanguageParam(`${CATALYST_PROPOSALS_API_URL}/funds`, url);
    }
    const fundName = String(url.searchParams.get('fund') || '').trim();
    return fundName && fundName.length <= 100
      ? appendLanguageParam(`${CATALYST_PROPOSALS_API_URL}?fund=${encodeURIComponent(fundName)}`, url)
      : appendLanguageParam(CATALYST_PROPOSALS_API_URL, url);
  },
  '/__catalyst_pilot_2026_proxy__': url =>
    appendLanguageParam(CATALYST_PILOT_2026_API_URL, url),
  '/__catalyst_proposal_detail_proxy__': url => {
    const proposalId = String(url.searchParams.get('proposalId') || '').trim();
    return /^[0-9A-Za-z-]{1,100}$/.test(proposalId)
      ? appendLanguageParam(`${CATALYST_PROPOSAL_DETAIL_API_BASE_URL}/${encodeURIComponent(proposalId)}`, url)
      : null;
  },
  '/__catalyst_proposal_summary_proxy__': url => {
    const proposalId = String(url.searchParams.get('proposalId') || '').trim();
    return /^[0-9A-Za-z-]{1,100}$/.test(proposalId)
      ? appendLanguageParam(`${CATALYST_PROPOSAL_SUMMARY_API_BASE_URL}/${encodeURIComponent(proposalId)}/summary`, url)
      : null;
  },
  '/__constitution_chat_proxy__': () =>
    CONSTITUTION_CHAT_API_URL,
  '/__constitution_chat_feedback_proxy__': () =>
    CONSTITUTION_CHAT_FEEDBACK_API_URL,
  '/__constitution_document_proxy__': url =>
    appendLanguageParam(CONSTITUTION_DOCUMENT_API_URL, url),
  '/__committee_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/committee/directory`,
  '/__committee_member_proxy__': url => {
    const memberId = String(url.searchParams.get('memberId') || '').toLowerCase();
    return memberId
      ? `${TDSP_API_ORIGIN}/api/committee/member/${encodeURIComponent(memberId)}`
      : null;
  },
  '/__health_proxy__': () =>
    `${TDSP_API_ORIGIN}/health`,
  '/__sqlite_status_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/sqlite/status`,
  '/__pool_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/pool`,
  '/__raffle_auth_challenge_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/auth/challenge`,
  '/__raffle_auth_verify_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/auth/verify`,
  '/__website_status_proxy__': () => `${TDSP_API_ORIGIN}/api/raffle/admin/website-status`,
  '/__raffle_admin_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin`,


  '/__raffle_admin_users_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/users`,


  '/__raffle_delegator_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/delegator`,


  '/__mithril_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/mithril`,
  '/__leader_schedule_proxy__': () =>
    LEADER_SCHEDULE_URL,
  '/__stake_status_proxy__': url => {
    const stakeAddress = String(url.searchParams.get('stakeAddress') || '').toLowerCase();
    const refresh = url.searchParams.get('refresh') === '1' ? '?refresh=1' : '';
    return /^stake1[0-9a-z]{20,120}$/.test(stakeAddress)
      ? `${TDSP_API_ORIGIN}/api/stake-status/${encodeURIComponent(stakeAddress)}${refresh}`
      : null;
  },
  '/__starch_proxy__': url => {
    const teamId = String(url.searchParams.get('teamId') || '').toUpperCase();
    return /^[0-9A-F]{6}$/.test(teamId)
      ? `${TDSP_API_ORIGIN}/api/starch/${encodeURIComponent(teamId)}`
      : null;
  },
  '/__starch_pools_proxy__': () =>
    STARCH_POOL_URL,
  '/__starch_directory_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/starch/directory/compact`,
  '/__proposal_votes_proxy__': url => {
    const proposalId = url.searchParams.get('proposalId');
    return proposalId
      ? `${TDSP_API_ORIGIN}/api/proposal/${encodeURIComponent(proposalId)}/votes`
      : null;
  },

  '/__proposal_detail_proxy__': url => {
    const proposalId = String(url.searchParams.get('proposalId') || '').toLowerCase();
    return /^gov_action1[0-9a-z]{20,120}$/.test(proposalId)
      ? appendLanguageParam(`${TDSP_API_ORIGIN}/api/proposal/${encodeURIComponent(proposalId)}`, url)
      : null;
  },
  '/__proposal_summary_proxy__': url => {
    const proposalId = String(url.searchParams.get('proposalId') || '').toLowerCase();
    return /^gov_action1[0-9a-z]{20,120}$/.test(proposalId)
      ? appendLanguageParam(`${TDSP_API_ORIGIN}/api/proposal/${encodeURIComponent(proposalId)}/summary`, url)
      : null;
  },


  '/__metadata_proxy__': url => {
    const metadataUrl = url.searchParams.get('url');
    const refresh = url.searchParams.get('refresh') === '1' ? '&refresh=1' : '';
    return isAllowedMetadataUrl(metadataUrl)
      ? `${METADATA_API_ORIGIN}/api/metadata?url=${encodeURIComponent(metadataUrl)}${refresh}`
      : null;
  }
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonld': 'application/ld+json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.toml': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp'
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function requestJson(target, timeoutMs = 30_000) {
  const upstream = await requestUpstream(target, { timeoutMs });
  if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
    const error = new Error(`Upstream returned HTTP ${upstream.statusCode}`);
    error.statusCode = upstream.statusCode;
    throw error;
  }
  return JSON.parse(upstream.body.toString('utf8'));
}


async function getDirectoryCompatibilityPayload(pathname, url) {


  if (pathname === '/__committee_proxy__') {
    const payload = await requestJson(`${TDSP_API_ORIGIN}/api/committee`);
    const actionStats = new Map();
    const members = (payload?.members || []).map(member => {
      for (const action of member?.vote_stats?.actions || []) {
        const proposalId = String(action?.proposal_id || '');
        if (!proposalId || action?.applicable === false) continue;
        const stats = actionStats.get(proposalId) || { proposal_id: proposalId, member_entries: 0, votes: 0 };
        stats.member_entries += 1;
        const vote = String(action?.vote_bucket || action?.vote || '').toLowerCase();
        if (action?.voted === true && (vote === 'yes' || vote === 'no')) stats.votes += 1;
        actionStats.set(proposalId, stats);
      }
      return {
        cc_cold_id: member?.cc_cold_id || null,
        cc_cold_hex: member?.cc_cold_hex || null,
        cc_hot_id: member?.cc_hot_id || null,
        cc_hot_hex: member?.cc_hot_hex || null,
        expiration_epoch: member?.expiration_epoch ?? null,
        name: member?.name || null,
        status: member?.status || null,
        vote_stats: member?.vote_stats ? { ...member.vote_stats, actions: undefined } : null
      };
    });
    return {
      updated_at: payload?.updated_at || null,
      quorum: payload?.quorum || null,
      member_count: Number(payload?.member_count) || members.length,
      active_member_count: Number(payload?.active_member_count) || members.length,
      resigned_member_count: Number(payload?.resigned_member_count) || 0,
      vote_stats: payload?.vote_stats || null,
      action_stats: [...actionStats.values()],
      members
    };
  }

  if (pathname === '/__committee_member_proxy__') {
    const payload = await requestJson(`${TDSP_API_ORIGIN}/api/committee`);
    const memberId = String(url.searchParams.get('memberId') || '').toLowerCase();
    const member = (payload?.members || []).find(entry => [
      entry?.cc_cold_id,
      entry?.cc_cold_hex,
      entry?.cc_hot_id,
      entry?.cc_hot_hex
    ].some(candidate => String(candidate || '').toLowerCase() === memberId));
    if (!member) return null;
    return { updated_at: payload?.updated_at || null, member };
  }

  if (pathname === '/__starch_directory_proxy__') {
    const payload = await requestJson(`${TDSP_API_ORIGIN}/api/starch/directory`);
    return {
      updated_at: payload?.updated_at || null,
      miner_count: Number(payload?.miner_count) || 0,
      company_count: Number(payload?.company_count) || 0,
      miners: (payload?.miners || []).map(miner => ({ id: miner?.id, name: miner?.name })),
      companies: (payload?.companies || []).map(company => ({
        id: company?.id,
        name: company?.name,
        balance: Number(company?.balance) || 0,
        weekly_blocks: Number(company?.weekly_blocks) || 0,
        miner_count: Number(company?.miner_count) || 0,
        stats_resolved: company?.stats_resolved === true
      }))
    };
  }

  return null;
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

async function proxyRequest(target, res, options = {}) {
  const upstream = await requestUpstream(target, options);
  res.writeHead(upstream.statusCode, {
    'cache-control': 'no-store',
    ...(upstream.sessionToken ? { 'x-tdsp-session': upstream.sessionToken } : {}),
    'content-type': upstream.contentType || 'application/json; charset=utf-8'
  });
  res.end(upstream.body);
}

function proxyStreamingRequest(target, res, options = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const targetUrl = new URL(target);
    const requestFn = targetUrl.protocol === 'http:' ? httpRequest : httpsRequest;
    const headers = {
      accept: 'application/x-ndjson,application/json',
      'user-agent': 'tdsp-local-dev-server'
    };
    if (options.body) {
      headers['content-type'] = 'application/json';
      headers['content-length'] = String(options.body.length);
    }
    if (TDSP_API_HOST && targetUrl.host !== TDSP_API_HOST) headers.host = TDSP_API_HOST;
    const timeoutMs = options.timeoutMs || UPSTREAM_TIMEOUT_MS;
    let headersSent = false;
    const req = requestFn(targetUrl, {
      headers,
      method: options.method || 'GET',
      servername: TDSP_API_HOST || targetUrl.hostname
    }, upstream => {
      headersSent = true;
      res.writeHead(upstream.statusCode || 502, {
        'cache-control': upstream.headers['cache-control'] || 'no-store, no-transform',
        'content-type': upstream.headers['content-type'] || 'application/x-ndjson; charset=utf-8',
        'x-accel-buffering': 'no'
      });
      upstream.on('data', chunk => res.write(chunk));
      upstream.on('end', () => {
        res.end();
        resolveRequest();
      });
      upstream.on('error', error => {
        res.destroy(error);
        rejectRequest(error);
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Upstream timed out after ${timeoutMs}ms`));
    });
    req.on('error', error => {
      if (headersSent) res.destroy(error);
      rejectRequest(error);
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}

function requestUpstream(target, options = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const targetUrl = new URL(target);
    const requestFn = targetUrl.protocol === 'http:' ? httpRequest : httpsRequest;
    const headers = {
      accept: 'application/json,text/plain,*/*',
      'accept-encoding': 'gzip',
      'user-agent': 'tdsp-local-dev-server'
    };
    if (options.body) {
      headers['content-type'] = 'application/json';
      headers['content-length'] = String(options.body.length);
    }
    if (options.authorization) headers.authorization = options.authorization;
    if (options.origin) headers.origin = options.origin;
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
    const timeoutMs = options.timeoutMs || UPSTREAM_TIMEOUT_MS;
    const wallClockTimeout = setTimeout(() => {
      req.destroy(new Error(`Upstream timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    const req = requestFn(targetUrl, {
      headers,
      method: options.method || 'GET',
      servername: TDSP_API_HOST || targetUrl.hostname
    }, upstream => {
      const chunks = [];
      upstream.on('data', chunk => chunks.push(chunk));
      upstream.on('end', () => {
        try {
          const encodedBody = Buffer.concat(chunks);
          const body = upstream.headers['content-encoding'] === 'gzip'
            ? gunzipSync(encodedBody)
            : encodedBody;
          complete({
            body,
            contentType: upstream.headers['content-type'],
            sessionToken: upstream.headers['x-tdsp-session'],
            statusCode: upstream.statusCode || 502
          });
        } catch (error) {
          fail(error);
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Upstream timed out after ${timeoutMs}ms`));
    });
    req.on('error', fail);
    req.end(options.body);
  });
}

async function readRequestBody(req, maxBytes = 8192) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error('Request body is too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function getStaticPath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const segments = decoded.replace(/\\/g, '/').split('/');
  if (segments.some(part => part.startsWith('.') || ['node_modules', 'tests', 'test', 'portfolio-src'].includes(part))) return null;
  if (decoded.includes('\0') || decoded.includes('\\')) return null;
  const requested = decoded === '/' ? '/index.html' : decoded;
  if (!Object.hasOwn(contentTypes, extname(requested))) return null;
  if (/\/(?:package(?:-lock)?|tsconfig[^/]*)\.json$/i.test(requested)) return null;
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
    const canonical = await realpath(filePath);
    if (getStaticPath(`/${canonical.slice(ROOT.length + 1)}`) !== canonical || !(await stat(canonical)).isFile()) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
  } catch {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-type': contentTypes[extname(filePath)] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(res);
}

export const server = createServer(async (req, res) => {
  let url;
  try {
    const origin = new URL(`http://${req.headers.host || 'localhost'}`);
    url = new URL(req.url || '/', origin);
    const hosts = new Set(['localhost', '127.0.0.1', '[::1]', HOST]);
    if (!hosts.has(origin.hostname) || url.origin !== origin.origin || (req.headers.origin && req.headers.origin !== origin.origin)) throw new Error('Untrusted local origin');
  } catch {
    res.writeHead(403);res.end('Forbidden');return;
  }
  const route = proxyRoutes[url.pathname];

  try {
    if (url.pathname.startsWith('/api/portfolio/')) {
      if (!/^\/api\/portfolio\/(session|cardano|markets|price|historical-prices|historical-btc-prices|historical-fx-prices|vault|auth\/(?:config|passkeys\/(?:register|login)\/(?:options|verify)|dashboard\/session|logout))$/.test(url.pathname) || !['GET', 'POST'].includes(req.method)) {
        sendJson(res, 404, { error: 'Portfolio endpoint not found' });
        return;
      }
      const body = req.method === 'POST' ? await readRequestBody(req, url.pathname === '/api/portfolio/vault' ? 32 * 1024 * 1024 : 8192) : null;
      await proxyRequest(`${process.env.PORTFOLIO_API_ORIGIN || TDSP_API_ORIGIN}${url.pathname}`, res, {
        method: req.method, body, authorization: String(req.headers.authorization || ''), origin: String(req.headers.origin || ''), timeoutMs: 45000
      });
      return;
    }
    if (route) {
      const target = route(url);
      if (!target) {
        sendJson(res, 400, { error: 'Missing or invalid proxy parameter' });
        return;
      }
      console.log(`${req.method} ${url.pathname} -> ${target}`);
      if (url.pathname === '/__constitution_chat_proxy__') {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }
        const body = await readRequestBody(req);
        await proxyStreamingRequest(target, res, {
          method: 'POST',
          body,
          timeoutMs: AI_UPSTREAM_TIMEOUT_MS
        });
        return;
      }
      if (url.pathname === '/__constitution_chat_feedback_proxy__') {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }
        const body = await readRequestBody(req);
        await proxyRequest(target, res, {
          method: 'POST',
          body,
          timeoutMs: AI_UPSTREAM_TIMEOUT_MS
        });
        return;
      }
      if ([
        '/__raffle_auth_challenge_proxy__',
        '/__raffle_auth_verify_proxy__',
        '/__raffle_admin_proxy__',
        '/__website_status_proxy__',


        '/__raffle_admin_users_proxy__',


        '/__raffle_delegator_proxy__',


      ].includes(url.pathname)) {
        const allowedMethods = url.pathname === '/__website_status_proxy__' || url.pathname === '/__raffle_admin_proxy__' || url.pathname === '/__raffle_delegator_proxy__'
          ? new Set(['GET'])
          : url.pathname === '/__raffle_admin_users_proxy__'
            ? new Set(['POST', 'PUT'])
            : new Set(['POST']);
        if (!allowedMethods.has(req.method || 'GET')) {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }
        const body = req.method === 'POST' || req.method === 'PUT' ? await readRequestBody(req) : null;
        await proxyRequest(target, res, {
          method: req.method,
          body,
          authorization: String(req.headers.authorization || ''),
          timeoutMs: 30_000
        });
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      if (
        [


          '/__proposal_votes_proxy__',


          '/__committee_proxy__',
          '/__committee_member_proxy__',
          '/__starch_directory_proxy__'
        ].includes(url.pathname)
      ) {
        const upstream = await requestUpstream(target, { timeoutMs: 30_000 });
        if (upstream.statusCode !== 404) {
          res.writeHead(upstream.statusCode, {
            'cache-control': 'no-store',
            'content-type': upstream.contentType || 'application/json; charset=utf-8'
          });
          res.end(req.method === 'HEAD' ? undefined : upstream.body);
          return;
        }
        const fallbackPayload = await getDirectoryCompatibilityPayload(url.pathname, url);
        if (fallbackPayload) {
          sendJson(res, 200, fallbackPayload);
        } else {
          sendJson(res, 404, { error: 'Directory record was not found' });
        }
        return;
      }

      await proxyRequest(target, res);
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    console.warn(`${req.method} ${url.pathname} failed: ${error instanceof Error ? error.message : error}`);
    sendJson(
      res,
      Number(error?.statusCode) || 502,
      { error: error instanceof Error ? error.message : 'Proxy request failed' }
    );
  }
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(PORT, HOST, () => {
  console.log(`TDSP local dev server running at http://${HOST}:${PORT}/`);
  console.log(`TDSP API origin: ${TDSP_API_ORIGIN}`);
  if (TDSP_API_HOST) console.log(`TDSP API host header/SNI: ${TDSP_API_HOST}`);
});
