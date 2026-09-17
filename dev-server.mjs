import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { gunzipSync } from 'node:zlib';

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
const SPO_DIRECTORY_URL = normalizeAllowedApiUrl(
  process.env.SPO_DIRECTORY_URL || `${TDSP_API_ORIGIN}/api/spos/directory`,
  'SPO_DIRECTORY_URL'
);
const RETIRED_SPO_DIRECTORY_URL = normalizeAllowedApiUrl(
  process.env.RETIRED_SPO_DIRECTORY_URL || `${TDSP_API_ORIGIN}/api/spos/retired`,
  'RETIRED_SPO_DIRECTORY_URL'
);
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
  '/__raffle_admin_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin`,
  '/__raffle_admin_draw_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/draw`,
  '/__raffle_admin_exclusions_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/exclusions`,
  '/__raffle_admin_users_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/users`,
  '/__raffle_admin_lost_stake_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/lost-stake`,
  '/__raffle_admin_lost_stake_message_state_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/lost-stake/message-state`,
  '/__raffle_admin_anchor_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/admin/anchor`,
  '/__raffle_delegator_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/delegator`,
  '/__raffle_prizes_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/raffle/prizes`,
  '/__raffle_prize_image_proxy__': url => {
    const file = String(url.searchParams.get('file') || '').trim();
    return /^[0-9a-f]+\.(png|jpg|webp|gif|svg)$/i.test(file)
      ? `${TDSP_API_ORIGIN}/api/raffle/prize-image/${encodeURIComponent(file)}`
      : null;
  },
  '/__mithril_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/mithril`,
  '/__icebreaker_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/icebreaker`,
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
  '/__proposal_rationale_proxy__': url => {
    const proposalId = String(url.searchParams.get('proposalId') || '').toLowerCase();
    const drepId = String(url.searchParams.get('drepId') || '').toLowerCase();
    if (!/^gov_action1[0-9a-z]{20,140}$/.test(proposalId) || !/^(drep1[0-9a-z]{20,140}|[0-9a-f]{56,64})$/.test(drepId)) {
      return null;
    }
    const lang = String(url.searchParams.get('lang') || '').trim();
    const params = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return `${TDSP_API_ORIGIN}/api/proposal/${encodeURIComponent(proposalId)}/drep/${encodeURIComponent(drepId)}/rationale${params}`;
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
  '/__drep_directory_proxy__': url => {
    const type = url.searchParams.get('type');
    if (type === 'directory') return `${TDSP_API_ORIGIN}/api/dreps/directory`;
    if (type === 'metadata-compact') return `${TDSP_API_ORIGIN}/api/dreps/metadata/compact`;
    if (type === 'metadata') return `${TDSP_API_ORIGIN}/api/dreps/metadata`;
    if (type === 'info') return `${TDSP_API_ORIGIN}/api/dreps/info`;
    return null;
  },
  '/__drep_council_proxy__': () => `${TDSP_API_ORIGIN}/api/dreps/council`,
  '/__drep_correlation_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/dreps/correlation`,
  '/__drep_vote_stats_proxy__': url => {
    const ids = String(url.searchParams.get('ids') || '')
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(value => /^drep1[0-9a-z]{20,120}$/.test(value) || /^[0-9a-f]{56}$/.test(value))
      .slice(0, 50);
    const params = ids.length ? `?ids=${encodeURIComponent(ids.join(','))}` : '';
    return `${TDSP_API_ORIGIN}/api/dreps/vote-stats${params}`;
  },
  '/__drep_detail_proxy__': url => {
    const drepId = url.searchParams.get('drepId');
    return drepId
      ? `${TDSP_API_ORIGIN}/api/drep/${encodeURIComponent(drepId)}`
      : null;
  },
  '/__spo_directory_proxy__': () =>
    SPO_DIRECTORY_URL,
  '/__retired_spo_directory_proxy__': () =>
    RETIRED_SPO_DIRECTORY_URL,
  '/__spo_rescan_status_proxy__': () =>
    `${TDSP_API_ORIGIN}/api/spos/rescan/status`,
  '/__spo_detail_proxy__': url => {
    const poolId = String(url.searchParams.get('poolId') || '').toLowerCase();
    return /^pool1[0-9a-z]{20,120}$/.test(poolId)
      ? `${TDSP_API_ORIGIN}/api/spo/${encodeURIComponent(poolId)}`
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

function cachedRecordName(entry) {
  return [
    entry?.name,
    entry?.given_name,
    entry?.meta_json?.body?.givenName,
    entry?.meta_json?.body?.name,
    entry?.metadata?.name
  ].map(value => String(value || '').trim()).find(Boolean) || null;
}

async function getDirectoryCompatibilityPayload(pathname, url) {
  if (pathname === '/__drep_directory_proxy__' && url.searchParams.get('type') === 'directory') {
    const [metadata, info] = await Promise.all([
      requestJson(`${TDSP_API_ORIGIN}/api/dreps/metadata`),
      requestJson(`${TDSP_API_ORIGIN}/api/dreps/info`)
    ]);
    const dreps = Object.values(info || {}).filter(Boolean).map(entry => {
      const drepId = entry?.drep_id || entry?.drep_id_bech32 || null;
      const metadataEntry = metadata?.[drepId] || metadata?.[entry?.hex] || null;
      return {
        drep_id: drepId,
        hex: entry?.hex || null,
        name: cachedRecordName(metadataEntry) || cachedRecordName(entry) || drepId,
        active: entry?.active === true,
        amount: entry?.amount || '0'
      };
    }).filter(entry => entry.drep_id || entry.hex);
    return { count: dreps.length, dreps };
  }

  if (pathname === '/__spo_directory_proxy__') {
    const payload = await requestJson(`${TDSP_API_ORIGIN}/api/spos`);
    return {
      updated_at: payload?.updated_at || null,
      activity_checked_at: payload?.activity_checked_at || null,
      count: Number(payload?.count) || 0,
      active_count: Number(payload?.active_count) || 0,
      inactive_count: Number(payload?.inactive_count) || 0,
      total_delegated_lovelace: payload?.total_delegated_lovelace || '0',
      spos: (payload?.spos || []).map(spo => {
        const relays = Array.isArray(spo?.relays) ? spo.relays : [];
        const providers = [...new Map(relays
          .map(relay => relay?.provider)
          .filter(provider => provider?.id && provider?.name)
          .map(provider => [provider.id, provider.name])).values()];
        return {
          pool_id: spo?.pool_id || null,
          name: spo?.name || null,
          ticker: spo?.ticker || null,
          delegated_lovelace: spo?.delegated_lovelace || '0',
          delegator_count: Number(spo?.delegator_count) || 0,
          saturation_pct: Number(spo?.saturation_pct) || 0,
          status: spo?.status || null,
          pledge_lovelace: spo?.pledge_lovelace || '0',
          live_pledge_lovelace: spo?.live_pledge_lovelace || '0',
          active: typeof spo?.active === 'boolean' ? spo.active : null,
          pledge_met: typeof spo?.pledge_met === 'boolean' ? spo.pledge_met : null,
          relay_active: typeof spo?.relay_active === 'boolean' ? spo.relay_active : null,
          relay_check_required: spo?.relay_check_required === true,
          active_relay_count: Number(spo?.active_relay_count) || 0,
          inactive_reasons: Array.isArray(spo?.inactive_reasons) ? spo.inactive_reasons : [],
          relays,
          cloud_hosting_type: relays.length && relays.every(relay => relay?.provider?.id)
            ? 'cloud-spo'
            : 'spo',
          cloud_service: providers.join(', ')
        };
      })
    };
  }

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
        '/__raffle_admin_draw_proxy__',
        '/__raffle_admin_exclusions_proxy__',
        '/__raffle_admin_users_proxy__',
        '/__raffle_admin_lost_stake_proxy__',
        '/__raffle_admin_lost_stake_message_state_proxy__',
        '/__raffle_admin_anchor_proxy__',
        '/__raffle_delegator_proxy__',
        '/__raffle_prizes_proxy__',
        '/__raffle_prize_image_proxy__'
      ].includes(url.pathname)) {
        const allowedMethods = url.pathname === '/__raffle_admin_proxy__' || url.pathname === '/__raffle_admin_lost_stake_proxy__' || url.pathname === '/__raffle_delegator_proxy__' || url.pathname === '/__raffle_prizes_proxy__' || url.pathname === '/__raffle_prize_image_proxy__'
          ? new Set(['GET'])
          : url.pathname === '/__raffle_admin_exclusions_proxy__' || url.pathname === '/__raffle_admin_users_proxy__' || url.pathname === '/__raffle_admin_lost_stake_message_state_proxy__'
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
        (
          url.pathname === '/__drep_directory_proxy__' &&
          url.searchParams.get('type') === 'directory'
        ) ||
        [
          '/__drep_detail_proxy__',
          '/__drep_vote_stats_proxy__',
          '/__drep_correlation_proxy__',
          '/__proposal_votes_proxy__',
          '/__proposal_rationale_proxy__',
          '/__spo_directory_proxy__',
          '/__retired_spo_directory_proxy__',
          '/__spo_rescan_status_proxy__',
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
      if (
        url.pathname === '/__drep_directory_proxy__' &&
        url.searchParams.get('type') === 'metadata-compact'
      ) {
        let upstream = await requestUpstream(target, { timeoutMs: 30_000 });
        if (upstream.statusCode === 404) {
          upstream = await requestUpstream(
            `${TDSP_API_ORIGIN}/api/dreps/metadata`,
            { timeoutMs: 30_000 }
          );
        }
        res.writeHead(upstream.statusCode, {
          'cache-control': 'no-store',
          'content-type': upstream.contentType || 'application/json; charset=utf-8'
        });
        res.end(req.method === 'HEAD' ? undefined : upstream.body);
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

server.listen(PORT, HOST, () => {
  console.log(`TDSP local dev server running at http://${HOST}:${PORT}/`);
  console.log(`TDSP API origin: ${TDSP_API_ORIGIN}`);
  if (TDSP_API_HOST) console.log(`TDSP API host header/SNI: ${TDSP_API_HOST}`);
});
