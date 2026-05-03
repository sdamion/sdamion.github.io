const KOIOS_PROPOSALS_URL = 'https://api.koios.rest/api/v1/proposal_list?order=block_time.desc&limit=500';
const KOIOS_TIP_URL = 'https://api.koios.rest/api/v1/tip';
const KOIOS_VOTING_SUMMARY_URL = 'https://api.koios.rest/api/v1/proposal_voting_summary';
const LOCAL_PROXY_PATH = '/__koios_proxy__?url=';
const DEFAULT_CORS_PROXY_URLS = [
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://api.codetabs.com/v1/proxy?quest='
];
const SUMMARY_CORS_PROXY_URLS = [
    'https://bypass.cors.rest/proxy?url=',
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://api.codetabs.com/v1/proxy?quest='
];
const ACTIVE_REFRESH_INTERVAL_MS = 60 * 1000;

let governanceRefreshTimer = null;
let lastActiveRenderSignature = '';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    loadCurrentEpoch();
    loadGovernanceActions();
}

async function loadCurrentEpoch() {
    const epochElement = document.getElementById('menu-epoch');
    if (!epochElement) return;

    try {
        const tip = await fetchViaProxy(KOIOS_TIP_URL);
        const epoch = Array.isArray(tip) ? tip[0]?.epoch_no : tip?.epoch_no;
        epochElement.textContent = Number.isFinite(epoch) ? `Epoch ${epoch}` : '';
    } catch (error) {
        epochElement.textContent = '';
    }
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

        enrichGovernanceVotes([
            ...grouped.active,
            ...grouped.approved,
            ...grouped.rejected
        ]).then(() => {
            renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
            renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
            renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
            updateGovernanceCounts(grouped);
            lastActiveRenderSignature = getGovernanceGroupSignature(grouped.active);
        }).catch(() => {});

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

async function refreshActiveGovernanceGroup() {
    const container = document.getElementById('governance-active');
    if (!container) return;

    const proposals = await fetchGovernanceProposals().catch(() => null);
    if (!Array.isArray(proposals)) return;

    const grouped = groupGovernanceProposals(proposals);
    const activeProposals = grouped.active;
    resetGovernanceVotes(activeProposals);

    const summariesByProposal = await fetchGovernanceSummaries(activeProposals).catch(() => null);
    if (!summariesByProposal) return;

    applyGovernanceSummaries(activeProposals, summariesByProposal);

    const nextSignature = getGovernanceGroupSignature(activeProposals);
    if (nextSignature === lastActiveRenderSignature) return;

    renderGovernanceGroup(container, activeProposals, 'No active actions found.');
    updateGovernanceCounts({
        active: activeProposals,
        approved: document.querySelectorAll('#governance-approved .governance-card'),
        rejected: document.querySelectorAll('#governance-rejected .governance-card')
    });
    lastActiveRenderSignature = nextSignature;
}

function scheduleActiveRefresh() {
    if (governanceRefreshTimer !== null) return;

    governanceRefreshTimer = window.setInterval(() => {
        refreshActiveGovernanceGroup().catch(() => {});
    }, ACTIVE_REFRESH_INTERVAL_MS);
}

async function fetchGovernanceProposals() {
    const proxied = await fetchViaProxy(KOIOS_PROPOSALS_URL);
    return Array.isArray(proxied) ? proxied : [];
}

async function fetchGovernanceVoteSummary(proposalId) {
    if (!proposalId) return null;

    const url = `${KOIOS_VOTING_SUMMARY_URL}?_proposal_id=${encodeURIComponent(proposalId)}`;
    const summary = await fetchViaProxy(url);
    return Array.isArray(summary) ? summary[0] || null : null;
}

async function fetchGovernanceSummaries(proposals) {
    const proposalIds = proposals
        .map(proposal => proposal?.proposal_id)
        .filter(Boolean);

    const summaries = await mapWithConcurrency(proposalIds, 6, async proposalId => ({
        proposalId,
        summary: await fetchGovernanceVoteSummary(proposalId).catch(() => null)
    }));

    return Object.fromEntries(
        summaries
            .filter(entry => entry?.proposalId)
            .map(entry => [entry.proposalId, entry.summary])
    );
}

async function enrichGovernanceVotes(proposals) {
    const summariesByProposal = await fetchGovernanceSummaries(proposals);
    applyGovernanceSummaries(proposals, summariesByProposal);
}

function applyGovernanceSummaries(proposals, summariesByProposal) {
    proposals.forEach(proposal => {
        const summary = summariesByProposal[proposal.proposal_id] || null;
        proposal.voteSummary = summary;
        proposal.voteDisplay = getVoteDisplayFromProposalSummary(summary, proposal);
        proposal.votePercentages = proposal.voteDisplay?.percentages || null;
    });
}

async function fetchViaProxy(url) {
    if (shouldUseLocalProxy()) {
        return fetchJson(`${LOCAL_PROXY_PATH}${encodeURIComponent(url)}`);
    }

    let lastError = null;
    const proxyUrls = url.startsWith(KOIOS_VOTING_SUMMARY_URL)
        ? SUMMARY_CORS_PROXY_URLS
        : DEFAULT_CORS_PROXY_URLS;

    for (const proxyUrl of proxyUrls) {
        try {
            return await fetchJson(`${proxyUrl}${encodeURIComponent(url)}`);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Proxy request failed');
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

function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let index = 0;

    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
        while (index < items.length) {
            const currentIndex = index;
            index += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    });

    return Promise.all(workers).then(() => results);
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
        proposal.voteSummary = null;
        proposal.voteDisplay = null;
        proposal.votePercentages = null;
    });
}

function getVoteDisplayFromProposalSummary(summary, proposal) {
    if (!summary) return null;

    const poolHasRealVotes = (Number(summary.pool_yes_votes_cast) || 0)
        + (Number(summary.pool_no_votes_cast) || 0)
        + (Number(summary.pool_abstain_votes_cast) || 0) > 0;
    const poolHasRealPower = (Number(summary.pool_yes_vote_power) || 0) > 0
        || (Number(summary.pool_no_vote_power) || 0) > 0
        || (Number(summary.pool_active_abstain_vote_power) || 0) > 0;

    if (usesPoolVoting(proposal) && (poolHasRealVotes || poolHasRealPower)) {
        const percentages = getPercentagesFromSummary(summary, 'pool');
        if (percentages) {
            return { source: 'pool', label: 'SPO', percentages };
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

function shouldShowVotePercentages(proposal) {
    const status = getGovernanceStatus(proposal);
    return status === 'active' || status === 'approved';
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
    addVoteSummaryRows(content, proposal.voteSummary, proposal.voteDisplay?.source);
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

function addVoteSummaryRows(container, summary, source) {
    if (!summary) return;

    if (source === 'pool') {
        addDetailRow(container, 'SPO yes votes', summary.pool_yes_votes_cast);
        addDetailRow(container, 'SPO no votes', summary.pool_no_votes_cast);
        addDetailRow(container, 'SPO abstain votes', summary.pool_abstain_votes_cast);
        return;
    }

    addDetailRow(container, 'DRep yes votes', summary.drep_yes_votes_cast);
    addDetailRow(container, 'DRep yes stake', formatCompactAdaFromLovelace(summary.drep_yes_vote_power));
    addDetailRow(container, 'DRep no votes', summary.drep_no_votes_cast);
    addDetailRow(container, 'DRep no stake', formatCompactAdaFromLovelace(summary.drep_no_vote_power));
    addDetailRow(container, 'DRep abstain votes', summary.drep_abstain_votes_cast);
    addDetailRow(container, 'DRep always abstain stake', formatCompactAdaFromLovelace(summary.drep_always_abstain_vote_power));
    addDetailRow(container, 'DRep always no-confidence stake', formatCompactAdaFromLovelace(summary.drep_always_no_confidence_vote_power));
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

function formatVotePercentages(percentages, label = null) {
    if (!percentages) return '';

    const prefix = label ? `${label} ` : '';
    return [
        `${prefix}Yes ${formatPercentage(percentages.yes)}`,
        `No ${formatPercentage(percentages.no)}`,
        `Abstain ${formatPercentage(percentages.abstain)}`
    ].join(' | ');
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
        voteDisplay: proposal.voteDisplay,
        votePercentages: proposal.votePercentages
    })));
}

function updateGovernanceCounts(groups) {
    setText('gov-active-count', getCollectionLength(groups.active));
    setText('gov-approved-count', getCollectionLength(groups.approved));
    setText('gov-rejected-count', getCollectionLength(groups.rejected));
}

function getCollectionLength(collection) {
    return Array.isArray(collection) ? collection.length : collection.length || 0;
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

function formatCompactAdaFromLovelace(value) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return value;

    const ada = lovelace / 1_000_000;
    return `${new Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(ada)} ADA`;
}
