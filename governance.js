const KOIOS_PROPOSALS_URL = 'https://api.koios.rest/api/v1/proposal_list?order=block_time.desc&limit=500';
const KOIOS_VOTES_URL = 'https://api.koios.rest/api/v1/vote_list?limit=10000&select=proposal_id,vote,voter_role';
const KOIOS_TIP_URL = 'https://api.koios.rest/api/v1/tip';
const KOIOS_VOTING_SUMMARY_URL = 'https://api.koios.rest/api/v1/proposal_voting_summary';
const LOCAL_PROXY_PATH = '/__koios_proxy__?url=';
const DEFAULT_CORS_PROXY_URLS = [
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://api.codetabs.com/v1/proxy?quest='
];
const SUMMARY_CORS_PROXY_URLS = [
    'https://cors.utilitytool.app/',
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://api.codetabs.com/v1/proxy?quest='
];
const GOVERNANCE_CACHE_TTL_MS = 5 * 60 * 1000;
const GOVERNANCE_PROPOSALS_CACHE_KEY = 'tdsp-governance-proposals-v1';
const GOVERNANCE_ACTIVE_VOTES_TTL_MS = 60 * 1000;
const ACTIVE_REFRESH_INTERVAL_MS = 60 * 1000;
let governanceRefreshTimer = null;
let lastActiveRenderSignature = '';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    loadGovernanceActions();
}

async function loadGovernanceActions() {
    const groups = {
        active: document.getElementById('governance-active'),
        approved: document.getElementById('governance-approved'),
        rejected: document.getElementById('governance-rejected')
    };

    if (!groups.active || !groups.approved || !groups.rejected) return;

    try {
        const proposals = await fetchGovernanceProposals();
        const grouped = groupGovernanceProposals(proposals);
        resetGovernanceVotes([
            ...grouped.active,
            ...grouped.approved,
            ...grouped.rejected
        ]);

        renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
        renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
        renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
        updateGovernanceCounts(grouped);
        lastActiveRenderSignature = getGovernanceGroupSignature(grouped.active);

        const currentEpoch = await fetchCurrentEpoch().catch(() => null);
        setCurrentEpoch(currentEpoch, proposals);

        const groupResults = await Promise.allSettled([
            hydrateGovernanceGroup('active', grouped.active, groups.active, currentEpoch, 'No active actions found.'),
            hydrateGovernanceGroup('approved', grouped.approved, groups.approved, currentEpoch, 'No approved actions found.'),
            hydrateGovernanceGroup('rejected', grouped.rejected, groups.rejected, currentEpoch, 'No rejected actions found.')
        ]);

        void groupResults;
        scheduleActiveRefresh();
    } catch (error) {
        Object.values(groups).forEach(group => {
            group.textContent = '';
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Governance actions could not be loaded. Open GovTool for the full overview.';
            group.appendChild(message);
        });
    }
}

async function hydrateGovernanceGroup(groupName, proposals, container, currentEpoch, emptyMessage) {
    const votes = await fetchGovernanceVotesForGroup(groupName, proposals, currentEpoch).catch(() => []);
    const percentages = shouldShowPercentagesForGroup(groupName)
        ? await fetchGovernancePercentagesForGroup(groupName, proposals, currentEpoch).catch(() => ({}))
        : null;

    enrichGovernanceVotes(proposals, votes, percentages);
    renderGovernanceGroup(container, proposals, emptyMessage);
}

async function fetchGovernanceProposals() {
    const proxied = await fetchCachedJson(GOVERNANCE_PROPOSALS_CACHE_KEY, KOIOS_PROPOSALS_URL);
    return Array.isArray(proxied) ? proxied : [];
}

async function fetchGovernanceVotesForGroup(groupName, proposals, currentEpoch) {
    const proposalIds = proposals
        .map(proposal => proposal?.proposal_id)
        .filter(Boolean);
    if (!proposalIds.length) return [];

    const cacheKey = getGovernanceVotesCacheKey(groupName, proposalIds, currentEpoch);
    const cacheTtlMs = getGovernanceVotesCacheTtl(groupName);
    const proxied = await fetchCachedJson(cacheKey, getGovernanceVotesUrl(proposalIds), cacheTtlMs);
    return Array.isArray(proxied) ? proxied : [];
}

async function fetchCurrentEpoch() {
    const tip = await fetchViaProxy(KOIOS_TIP_URL);
    const epoch = Array.isArray(tip) ? tip[0]?.epoch_no : tip?.epoch_no;
    return Number(epoch);
}

async function fetchGovernancePercentagesForGroup(groupName, proposals, currentEpoch) {
    if (groupName === 'rejected') return {};

    const summaries = await Promise.all(proposals.map(async proposal => {
        const proposalId = proposal?.proposal_id;
        if (!proposalId) return null;

        const cacheKey = getGovernanceSummaryCacheKey(groupName, proposalId, currentEpoch);
        const ttlMs = getGovernanceVotesCacheTtl(groupName);
        const url = `${KOIOS_VOTING_SUMMARY_URL}?_proposal_id=${encodeURIComponent(proposalId)}`;

        try {
            const payload = await fetchCachedJson(cacheKey, url, ttlMs);
            const summary = Array.isArray(payload) ? payload[0] : payload;
            return summary ? [proposalId, getVoteDisplayFromProposalSummary(summary, proposal)] : null;
        } catch (error) {
            return null;
        }
    }));

    return Object.fromEntries(summaries.filter(Boolean));
}

function shouldShowPercentagesForGroup(groupName) {
    return groupName === 'active' || groupName === 'approved';
}

async function fetchViaProxy(url) {
    if (shouldUseLocalProxy()) {
        return fetchJson(`${LOCAL_PROXY_PATH}${encodeURIComponent(url)}`);
    }

    let lastError = null;
    const proxyUrls = getProxyUrlsForTarget(url);

    for (const proxyUrl of proxyUrls) {
        try {
            return await fetchJson(buildProxyRequestUrl(proxyUrl, url));
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Proxy request failed');
}

function getProxyUrlsForTarget(url) {
    return url.startsWith(KOIOS_VOTING_SUMMARY_URL)
        ? SUMMARY_CORS_PROXY_URLS
        : DEFAULT_CORS_PROXY_URLS;
}

function buildProxyRequestUrl(proxyUrl, targetUrl) {
    if (proxyUrl === 'https://cors.utilitytool.app/') {
        return `${proxyUrl}${encodeURIComponent(targetUrl)}`;
    }

    return `${proxyUrl}${encodeURIComponent(targetUrl)}`;
}

function shouldUseLocalProxy() {
    const host = window.location.hostname;
    return host === '127.0.0.1' || host === 'localhost';
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function fetchCachedJson(cacheKey, url, ttlMs = GOVERNANCE_CACHE_TTL_MS) {
    const cached = readCache(cacheKey, ttlMs);
    if (cached) return cached;

    const data = await fetchViaProxy(url);
    writeCache(cacheKey, data);
    return data;
}

function getGovernanceVotesUrl(proposalIds) {
    return `${KOIOS_VOTES_URL}&proposal_id=in.(${proposalIds.join(',')})`;
}

function getGovernanceVotesCacheKey(groupName, proposalIds, currentEpoch) {
    if (groupName === 'active') {
        return `tdsp-governance-votes-v3:active:${proposalIds.join('|')}`;
    }

    return `tdsp-governance-votes-v3:${groupName}:epoch-${currentEpoch}:${proposalIds.join('|')}`;
}

function getGovernanceSummaryCacheKey(groupName, proposalId, currentEpoch) {
    if (groupName === 'active') {
        return `tdsp-governance-summary-v1:active:${proposalId}`;
    }

    return `tdsp-governance-summary-v1:${groupName}:epoch-${currentEpoch}:${proposalId}`;
}

function getGovernanceVotesCacheTtl(groupName) {
    return groupName === 'active' ? GOVERNANCE_ACTIVE_VOTES_TTL_MS : Number.POSITIVE_INFINITY;
}

function readCache(cacheKey, ttlMs) {
    try {
        const raw = window.localStorage.getItem(cacheKey);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.savedAt || !('data' in parsed)) return null;
        if (Number.isFinite(ttlMs) && (Date.now() - parsed.savedAt) > ttlMs) return null;
        return parsed.data;
    } catch (error) {
        return null;
    }
}

function writeCache(cacheKey, data) {
    try {
        window.localStorage.setItem(cacheKey, JSON.stringify({
            savedAt: Date.now(),
            data
        }));
    } catch (error) {
        // Ignore quota and storage access failures.
    }
}

function groupGovernanceProposals(proposals) {
    const groups = proposals.reduce((grouped, proposal) => {
        grouped[getGovernanceStatus(proposal)].push(proposal);
        return grouped;
    }, { active: [], approved: [], rejected: [] });

    groups.active.sort((a, b) => {
        const aTime = Number(a.block_time) || 0;
        const bTime = Number(b.block_time) || 0;
        return aTime - bTime;
    });

    return groups;
}

function resetGovernanceVotes(proposals) {
    proposals.forEach(proposal => {
        proposal.voteSummary = createEmptyVoteSummary();
        proposal.voteDisplay = null;
        proposal.votePercentages = null;
    });
}

function enrichGovernanceVotes(proposals, votes, percentageMap = null) {
    resetGovernanceVotes(proposals);

    const summariesByProposal = votes.reduce((accumulator, vote) => {
        if (vote?.voter_role !== 'DRep' || !vote?.proposal_id) return accumulator;

        const proposalId = vote.proposal_id;
        const summary = accumulator[proposalId] || createEmptyVoteSummary();
        const voteKey = String(vote.vote || '').toLowerCase();

        if (voteKey === 'yes') {
            summary.drep_yes_votes_cast += 1;
        } else if (voteKey === 'no') {
            summary.drep_no_votes_cast += 1;
        } else if (voteKey === 'abstain') {
            summary.drep_abstain_votes_cast += 1;
        }

        accumulator[proposalId] = summary;
        return accumulator;
    }, {});

    proposals.forEach(proposal => {
        proposal.voteSummary = summariesByProposal[proposal.proposal_id] || createEmptyVoteSummary();
        proposal.voteDisplay = percentageMap?.[proposal.proposal_id] || null;
        proposal.votePercentages = proposal.voteDisplay?.percentages || null;
    });
}

function createEmptyVoteSummary() {
    return {
        drep_yes_votes_cast: 0,
        drep_no_votes_cast: 0,
        drep_abstain_votes_cast: 0
    };
}

function setCurrentEpoch(currentEpoch, proposals) {
    const epochElement = document.getElementById('menu-epoch');
    if (!epochElement) return;

    const epoch = Number.isFinite(currentEpoch)
        ? currentEpoch
        : proposals.reduce((highest, proposal) => {
            const value = Number(proposal?.proposed_epoch);
            return Number.isFinite(value) ? Math.max(highest, value) : highest;
        }, 0);

    epochElement.textContent = epoch ? `Epoch ${epoch}` : '';
}

function scheduleActiveRefresh() {
    if (governanceRefreshTimer !== null) return;

    governanceRefreshTimer = window.setInterval(() => {
        refreshActiveGovernanceGroup().catch(() => {});
    }, ACTIVE_REFRESH_INTERVAL_MS);
}

async function refreshActiveGovernanceGroup() {
    const container = document.getElementById('governance-active');
    if (!container) return;

    const proposals = await fetchGovernanceProposals().catch(() => null);
    if (!Array.isArray(proposals)) return;

    const currentEpoch = await fetchCurrentEpoch().catch(() => null);
    setCurrentEpoch(currentEpoch, proposals);

    const grouped = groupGovernanceProposals(proposals);
    const activeProposals = grouped.active;
    const activeVotes = await fetchGovernanceVotesForGroup('active', activeProposals, currentEpoch).catch(() => null);
    if (!Array.isArray(activeVotes)) return;

    const activePercentages = await fetchGovernancePercentagesForGroup('active', activeProposals, currentEpoch).catch(() => null);
    if (!activePercentages) return;

    enrichGovernanceVotes(activeProposals, activeVotes, activePercentages);

    const nextSignature = getGovernanceGroupSignature(activeProposals);
    if (nextSignature === lastActiveRenderSignature) return;

    renderGovernanceGroup(container, activeProposals, 'No active actions found.');
    setText('gov-active-count', activeProposals.length);
    lastActiveRenderSignature = nextSignature;
}

function getGovernanceGroupSignature(proposals) {
    return JSON.stringify(proposals.map(proposal => ({
        proposal_id: proposal.proposal_id,
        status: getGovernanceStatus(proposal),
        expiration: proposal.expiration,
        ratified_epoch: proposal.ratified_epoch,
        enacted_epoch: proposal.enacted_epoch,
        expired_epoch: proposal.expired_epoch,
        dropped_epoch: proposal.dropped_epoch,
        votePercentages: proposal.votePercentages,
        voteSummary: proposal.voteSummary
    })));
}

function getVoteDisplayFromProposalSummary(summary, proposal) {
    if (!summary) return null;

    const poolHasCastVotes = (Number(summary.pool_yes_votes_cast) || 0)
        + (Number(summary.pool_no_votes_cast) || 0)
        + (Number(summary.pool_abstain_votes_cast) || 0) > 0;
    const poolHasVotePower = (Number(summary.pool_yes_vote_power) || 0) > 0
        || (Number(summary.pool_no_vote_power) || 0) > 0
        || (Number(summary.pool_active_abstain_vote_power) || 0) > 0;

    if ((poolHasCastVotes || poolHasVotePower) && usesPoolVoting(proposal)) {
        const poolPercentages = getPercentagesFromSummary(summary, 'pool');
        if (poolPercentages) {
            return { source: 'pool', label: 'SPO', percentages: poolPercentages };
        }
    }

    const drepPercentages = getPercentagesFromSummary(summary, 'drep');
    if (drepPercentages) {
        return { source: 'drep', label: 'DRep', percentages: drepPercentages };
    }

    return null;
}

function getPercentagesFromSummary(summary, prefix) {
    const yes = Number(summary[`${prefix}_yes_pct`]);
    const no = Number(summary[`${prefix}_no_pct`]);
    const explicitAbstain = Number(summary[`${prefix}_abstain_pct`]);
    const abstain = Number.isFinite(explicitAbstain) ? explicitAbstain : Math.max(0, 100 - yes - no);

    if (![yes, no, abstain].every(Number.isFinite)) return null;

    return { yes, no, abstain };
}

function usesPoolVoting(proposal) {
    return proposal?.proposal_type === 'HardForkInitiation'
        || proposal?.proposal_type === 'ParameterChange';
}

function getGovernanceStatus(proposal) {
    if (proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return 'rejected';
    if (proposal.ratified_epoch !== null || proposal.enacted_epoch !== null) return 'approved';
    return 'active';
}

function renderGovernanceGroup(container, proposals, emptyMessage) {
    container.textContent = '';

    if (!proposals.length) {
        const empty = document.createElement('p');
        empty.className = 'small-text';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    proposals.forEach(proposal => {
        container.appendChild(createGovernanceCard(proposal));
    });
}

function createGovernanceCard(proposal) {
    const card = document.createElement('button');
    card.className = 'governance-card';
    card.type = 'button';
    card.addEventListener('click', () => openGovernanceOverlay(proposal));

    const title = document.createElement('span');
    title.className = 'governance-title';
    title.textContent = getProposalTitle(proposal);

    const expiration = document.createElement('span');
    expiration.className = 'governance-expiration';
    expiration.textContent = getExpirationText(proposal);

    const votes = document.createElement('span');
    votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source)}`;
    votes.textContent = formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label);

    card.appendChild(title);
    card.appendChild(expiration);
    if (shouldShowVotePercentages(proposal) && votes.textContent) card.appendChild(votes);

    return card;
}

function openGovernanceOverlay(proposal) {
    closeGovernanceOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'governance-overlay';
    overlay.id = 'governance-overlay';
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeGovernanceOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'governance-dialog-title');

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close governance action');
    close.textContent = 'Close';
    close.addEventListener('click', closeGovernanceOverlay);

    const type = document.createElement('span');
    type.className = 'governance-type';
    type.textContent = formatProposalType(proposal.proposal_type);

    const title = document.createElement('h2');
    title.id = 'governance-dialog-title';
    title.textContent = getProposalTitle(proposal);

    const meta = document.createElement('p');
    meta.className = 'small-text';
    meta.textContent = getProposalMeta(proposal);

    const content = document.createElement('div');
    content.className = 'governance-detail-content';

    addDetailRow(content, 'Action ID', proposal.proposal_id);
    addDetailRow(content, 'Transaction', proposal.proposal_tx_hash);
    addDetailRow(content, 'Type', formatProposalType(proposal.proposal_type));
    addDetailRow(content, 'Proposed epoch', proposal.proposed_epoch);
    addDetailRow(content, 'Expiration epoch', proposal.expiration);
    addDetailRow(content, 'Ratified epoch', proposal.ratified_epoch);
    addDetailRow(content, 'Enacted epoch', proposal.enacted_epoch);
    addDetailRow(content, 'Expired epoch', proposal.expired_epoch);
    addDetailRow(content, 'Dropped epoch', proposal.dropped_epoch);
    if (shouldShowVotePercentages(proposal)) {
        addDetailRow(content, `${proposal.voteDisplay?.label || 'Vote'} percentages`, formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label));
    }
    addVoteSummaryRows(content, proposal.voteSummary);
    addDetailRow(content, 'Deposit', formatLovelace(proposal.deposit));
    addDetailRow(content, 'Return address', proposal.return_address);
    addDetailRow(content, 'Metadata URL', proposal.meta_url);

    const body = proposal.meta_json?.body || proposal.meta_json || {};
    addDetailRow(content, 'Abstract', body.abstract);
    addDetailRow(content, 'Motivation', body.motivation);
    addDetailRow(content, 'Rationale', body.rationale);

    if (proposal.proposal_description) {
        const raw = document.createElement('pre');
        raw.className = 'governance-json';
        raw.textContent = JSON.stringify(proposal.proposal_description, null, 2);
        const label = document.createElement('strong');
        label.textContent = 'On-chain action';
        content.appendChild(label);
        content.appendChild(raw);
    }

    dialog.appendChild(close);
    dialog.appendChild(type);
    dialog.appendChild(title);
    dialog.appendChild(meta);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    close.focus();
    document.addEventListener('keydown', handleGovernanceOverlayKeydown);
}

function closeGovernanceOverlay() {
    const overlay = document.getElementById('governance-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', handleGovernanceOverlayKeydown);
}

function handleGovernanceOverlayKeydown(event) {
    if (event.key === 'Escape') closeGovernanceOverlay();
}

function addDetailRow(container, label, value) {
    if (value === null || value === undefined || value === '') return;
    const cleanValue = cleanGovernanceText(String(value));
    if (!cleanValue) return;

    const row = document.createElement('div');
    row.className = 'governance-detail-row';

    const key = document.createElement('strong');
    key.textContent = label;

    const text = document.createElement('span');
    appendRichText(text, cleanValue);

    row.appendChild(key);
    row.appendChild(text);
    container.appendChild(row);
}

function addVoteSummaryRows(container, summary) {
    if (!summary) return;

    addDetailRow(container, 'DRep yes votes', summary.drep_yes_votes_cast);
    addDetailRow(container, 'DRep no votes', summary.drep_no_votes_cast);
    addDetailRow(container, 'DRep abstain votes', summary.drep_abstain_votes_cast);
}

function cleanGovernanceText(text) {
    return text
        .replace(/^\s*\[image\d*\]:\s*<[^>]*>\s*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function appendRichText(container, text) {
    const urlPattern = /(https?:\/\/[^\s<>"')\]]+)/g;
    let lastIndex = 0;

    text.replace(urlPattern, (url, _match, offset) => {
        if (offset > lastIndex) {
            container.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const cleanUrl = url.replace(/[.,;:!?]+$/, '');
        const trailing = url.slice(cleanUrl.length);

        if (isImageUrl(cleanUrl)) {
            const imageLink = document.createElement('a');
            imageLink.href = cleanUrl;
            imageLink.target = '_blank';
            imageLink.rel = 'noopener noreferrer';

            const image = document.createElement('img');
            image.className = 'governance-detail-image';
            image.src = cleanUrl;
            image.alt = 'Governance action image';
            image.loading = 'lazy';

            imageLink.appendChild(image);
            container.appendChild(imageLink);
        } else {
            const link = document.createElement('a');
            link.href = cleanUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = cleanUrl;
            container.appendChild(link);
        }

        if (trailing) {
            container.appendChild(document.createTextNode(trailing));
        }

        lastIndex = offset + url.length;
        return url;
    });

    if (lastIndex < text.length) {
        container.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
}

function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function getProposalTitle(proposal) {
    return proposal.meta_json?.body?.title
        || proposal.meta_json?.title
        || `${formatProposalType(proposal.proposal_type)} governance action`;
}

function getProposalMeta(proposal) {
    const parts = [`Epoch ${proposal.proposed_epoch}`];
    if (proposal.expiration !== null) parts.push(`expires ${proposal.expiration}`);
    if (proposal.enacted_epoch !== null) parts.push(`enacted ${proposal.enacted_epoch}`);
    if (proposal.ratified_epoch !== null) parts.push(`ratified ${proposal.ratified_epoch}`);
    if (proposal.expired_epoch !== null) parts.push(`expired ${proposal.expired_epoch}`);
    if (proposal.dropped_epoch !== null) parts.push(`dropped ${proposal.dropped_epoch}`);
    return parts.join(' / ');
}

function getExpirationText(proposal) {
    if (proposal.expired_epoch !== null) return `Expired epoch ${proposal.expired_epoch}`;
    if (proposal.dropped_epoch !== null) return `Dropped epoch ${proposal.dropped_epoch}`;
    if (proposal.expiration !== null) return `Expires epoch ${proposal.expiration}`;
    return 'No expiration data';
}

function shouldShowVotePercentages(proposal) {
    const status = getGovernanceStatus(proposal);
    return status === 'active' || status === 'approved';
}

function formatVotePercentages(percentages, label = null) {
    if (!percentages) return '';

    const prefix = label ? `${label} ` : '';

    return [
        `${prefix}Yes ${formatPercentage(percentages.yes)}`,
        `No ${formatPercentage(percentages.no)}`,
        `Abstain ${formatPercentage(percentages.abstain)}`
    ].join(' | ');
}

function getVoteColorClass(percentages, source = 'drep') {
    const yes = Number(percentages?.yes);
    if (!Number.isFinite(yes)) return 'vote-neutral';
    if (source === 'pool') {
        if (yes >= 50) return 'vote-green';
        if (yes >= 25) return 'vote-orange';
        return 'vote-red';
    }
    if (yes >= 67) return 'vote-green';
    if (yes >= 33.5) return 'vote-orange';
    return 'vote-red';
}

function updateGovernanceCounts(groups) {
    setText('gov-active-count', groups.active.length);
    setText('gov-approved-count', groups.approved.length);
    setText('gov-rejected-count', groups.rejected.length);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
}

function formatProposalType(type) {
    return String(type || 'Governance')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ');
}

function formatLovelace(value) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return value;
    return `${(lovelace / 1_000_000).toLocaleString()} ADA`;
}

function formatPercentage(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    const rounded = Math.round(number * 100) / 100;
    return `${rounded.toLocaleString()}%`;
}
