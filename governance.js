const DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard';
const ACTIVE_REFRESH_INTERVAL_MS = 60 * 1000;

let governanceRefreshTimer = null;
let lastActiveRenderSignature = '';
let governanceState = null;

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
        const dashboard = governanceState || await fetchGovernanceDashboard();
        const epoch = getDashboardEpoch(dashboard);
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
        const dashboard = await fetchGovernanceDashboard();
        governanceState = dashboard;
        const proposals = getDashboardGovernanceProposals(dashboard);
        if (!proposals.length) {
            throw new Error('No governance proposals found in dashboard payload');
        }
        const grouped = groupGovernanceProposals(proposals);

        renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
        renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
        renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
        updateGovernanceCounts(grouped);
        lastActiveRenderSignature = getGovernanceGroupSignature(grouped.active);
        updateEpochDisplayFromDashboard(dashboard);
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
    const groups = {
        active: document.getElementById('governance-active'),
        approved: document.getElementById('governance-approved'),
        rejected: document.getElementById('governance-rejected')
    };
    if (!groups.active || !groups.approved || !groups.rejected) return;

    const dashboard = await fetchGovernanceDashboard().catch(() => null);
    if (!dashboard) return;
    governanceState = dashboard;
    updateEpochDisplayFromDashboard(dashboard);
    const proposals = getDashboardGovernanceProposals(dashboard);
    const grouped = groupGovernanceProposals(proposals);
    const activeProposals = grouped.active;

    const nextSignature = getGovernanceGroupSignature(activeProposals);
    if (nextSignature === lastActiveRenderSignature) return;

    renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
    renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
    renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
    updateGovernanceCounts(grouped);
    lastActiveRenderSignature = nextSignature;
}

function scheduleActiveRefresh() {
    if (governanceRefreshTimer !== null) return;

    governanceRefreshTimer = window.setInterval(() => {
        refreshActiveGovernanceGroup().catch(() => {});
    }, ACTIVE_REFRESH_INTERVAL_MS);
}

async function fetchGovernanceDashboard() {
    return fetchJson(DASHBOARD_API_URL);
}

function getDashboardEpoch(dashboard) {
    const candidates = [
        dashboard?.epoch,
        dashboard?.current_epoch,
        dashboard?.epoch_no,
        dashboard?.tip?.epoch_no,
        dashboard?.governance?.epoch,
        dashboard?.governance?.current_epoch,
        dashboard?.governance?.tip?.epoch_no,
        dashboard?.data?.epoch,
        dashboard?.data?.current_epoch,
        dashboard?.data?.tip?.epoch_no
    ];

    return candidates.map(Number).find(Number.isFinite) ?? null;
}

function updateEpochDisplayFromDashboard(dashboard) {
    const epochElement = document.getElementById('menu-epoch');
    if (!epochElement) return;

    const epoch = getDashboardEpoch(dashboard);
    epochElement.textContent = Number.isFinite(epoch) ? `Epoch ${epoch}` : '';
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function getDashboardGovernanceProposals(dashboard) {
    const proposals = extractProposalCollection(dashboard);
    return proposals.map(normalizeGovernanceProposal).filter(proposal => proposal?.proposal_id);
}

function extractProposalCollection(dashboard) {
    const directCandidates = [
        dashboard?.proposals,
        dashboard?.governance?.proposals,
        dashboard?.governance?.actions,
        dashboard?.governance,
        dashboard?.data?.proposals,
        dashboard?.data?.governance?.proposals,
        dashboard?.data?.governance?.actions,
        dashboard?.data?.governance,
        dashboard?.dashboard?.proposals,
        dashboard?.dashboard?.governance?.proposals,
        dashboard?.dashboard?.governance?.actions
    ];

    for (const candidate of directCandidates) {
        const proposals = normalizeProposalCollection(candidate);
        if (proposals.length) return proposals;
    }

    return findProposalCollectionDeep(dashboard) || [];
}

function normalizeProposalCollection(candidate) {
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === 'object') {
        const values = Object.values(candidate);
        if (values.length && values.every(value => value && typeof value === 'object' && !Array.isArray(value))) {
            const proposalLikeCount = values.filter(isProposalLike).length;
            if (proposalLikeCount >= Math.max(1, Math.ceil(values.length / 2))) {
                return values;
            }
        }
    }

    return [];
}

function findProposalCollectionDeep(root, seen = new Set()) {
    if (!root || typeof root !== 'object' || seen.has(root)) return null;
    seen.add(root);

    const direct = normalizeProposalCollection(root);
    if (direct.length) return direct;

    for (const value of Object.values(root)) {
        if (!value || typeof value !== 'object') continue;

        const nested = findProposalCollectionDeep(value, seen);
        if (nested?.length) return nested;
    }

    return null;
}

function isProposalLike(value) {
    return Boolean(
        value
        && typeof value === 'object'
        && (
            value.proposal_id
            || value.gov_action_id
            || value.action_id
            || value.proposal_tx_hash
            || value.proposal_type
            || value.meta_json?.body?.title
            || value.metadata?.body?.title
        )
    );
}

function normalizeGovernanceProposal(proposal) {
    const normalized = { ...proposal };
    normalized.proposal_id = proposal?.proposal_id || proposal?.id || proposal?.gov_action_id || proposal?.action_id || '';
    normalized.proposal_tx_hash = proposal?.proposal_tx_hash || proposal?.tx_hash || proposal?.transaction_hash || '';
    normalized.proposal_type = proposal?.proposal_type || proposal?.type || proposal?.gov_action_type || 'Governance';
    normalized.block_time = proposal?.block_time ?? proposal?.created_at ?? proposal?.createdAt ?? proposal?.time ?? 0;
    normalized.proposed_epoch = coerceNullableNumber(proposal?.proposed_epoch ?? proposal?.proposal_epoch ?? proposal?.epoch);
    normalized.expiration = coerceNullableNumber(proposal?.expiration ?? proposal?.expires_epoch ?? proposal?.expired_after_epoch);
    normalized.ratified_epoch = coerceNullableNumber(proposal?.ratified_epoch ?? proposal?.ratifiedEpoch);
    normalized.enacted_epoch = coerceNullableNumber(proposal?.enacted_epoch ?? proposal?.enactedEpoch);
    normalized.expired_epoch = coerceNullableNumber(proposal?.expired_epoch ?? proposal?.expiredEpoch);
    normalized.dropped_epoch = coerceNullableNumber(proposal?.dropped_epoch ?? proposal?.droppedEpoch);
    normalized.deposit = proposal?.deposit ?? proposal?.deposit_lovelace ?? '';
    normalized.return_address = proposal?.return_address ?? proposal?.returnAddress ?? '';
    normalized.meta_url = proposal?.meta_url ?? proposal?.metadata_url ?? proposal?.url ?? '';
    normalized.meta_json = proposal?.meta_json ?? proposal?.metadata ?? proposal?.meta ?? {};
    normalized.proposal_description = proposal?.proposal_description ?? proposal?.description ?? null;
    normalized.voteSummary = normalizeVotingSummary(
        proposal?.voteSummary
        || proposal?.voting_summary
        || proposal?.summary
        || proposal?.vote_summary
        || null
    );
    normalized.voteDisplay = getVoteDisplayFromProposalSummary(normalized.voteSummary, normalized);
    normalized.votePercentages = normalized.voteDisplay?.percentages || null;
    applyDerivedGovernanceStatus(normalized, proposal);
    return normalized;
}

function applyDerivedGovernanceStatus(normalized, rawProposal) {
    const rawStatus = String(
        rawProposal?.status
        || rawProposal?.proposal_status
        || rawProposal?.governance_status
        || rawProposal?.state
        || ''
    ).toLowerCase();

    if (rawStatus.includes('reject') || rawStatus.includes('drop') || rawStatus.includes('expire')) {
        normalized.dropped_epoch = normalized.dropped_epoch ?? normalized.proposed_epoch ?? 0;
        return;
    }

    if (rawStatus.includes('approve') || rawStatus.includes('ratif') || rawStatus.includes('enact')) {
        normalized.ratified_epoch = normalized.ratified_epoch ?? normalized.proposed_epoch ?? 0;
    }
}

function normalizeVotingSummary(summary) {
    if (!summary || typeof summary !== 'object') return null;
    return {
        ...summary,
        drep_yes_pct: pickFirstNumber(summary.drep_yes_pct, summary.drep_yes_percentage, summary.drep?.yes_pct, summary.drep?.yes),
        drep_no_pct: pickFirstNumber(summary.drep_no_pct, summary.drep_no_percentage, summary.drep?.no_pct, summary.drep?.no),
        drep_abstain_pct: pickFirstNumber(summary.drep_abstain_pct, summary.drep_abstain_percentage, summary.drep?.abstain_pct, summary.drep?.abstain),
        pool_yes_pct: pickFirstNumber(summary.pool_yes_pct, summary.pool_yes_percentage, summary.spo_yes_pct, summary.spo_yes_percentage, summary.pool?.yes_pct, summary.pool?.yes),
        pool_no_pct: pickFirstNumber(summary.pool_no_pct, summary.pool_no_percentage, summary.spo_no_pct, summary.spo_no_percentage, summary.pool?.no_pct, summary.pool?.no),
        pool_abstain_pct: pickFirstNumber(summary.pool_abstain_pct, summary.pool_abstain_percentage, summary.spo_abstain_pct, summary.spo_abstain_percentage, summary.pool?.abstain_pct, summary.pool?.abstain),
        committee_yes_pct: pickFirstNumber(summary.committee_yes_pct, summary.committee?.yes_pct, summary.committee?.yes),
        committee_no_pct: pickFirstNumber(summary.committee_no_pct, summary.committee?.no_pct, summary.committee?.no),
        drep_yes_votes_cast: pickFirstNumber(summary.drep_yes_votes_cast, summary.drep?.yes_votes_cast, summary.drep_yes_votes),
        drep_no_votes_cast: pickFirstNumber(summary.drep_no_votes_cast, summary.drep?.no_votes_cast, summary.drep_no_votes),
        drep_abstain_votes_cast: pickFirstNumber(summary.drep_abstain_votes_cast, summary.drep?.abstain_votes_cast, summary.drep_abstain_votes),
        drep_yes_vote_power: pickFirstNumber(summary.drep_yes_vote_power, summary.drep?.yes_vote_power, summary.drep_yes_stake),
        drep_no_vote_power: pickFirstNumber(summary.drep_no_vote_power, summary.drep?.no_vote_power, summary.drep_no_stake),
        drep_always_abstain_vote_power: pickFirstNumber(summary.drep_always_abstain_vote_power, summary.drep?.always_abstain_vote_power),
        drep_always_no_confidence_vote_power: pickFirstNumber(summary.drep_always_no_confidence_vote_power, summary.drep?.always_no_confidence_vote_power),
        pool_yes_votes_cast: pickFirstNumber(summary.pool_yes_votes_cast, summary.spo_yes_votes_cast, summary.pool?.yes_votes_cast, summary.pool_yes_votes),
        pool_no_votes_cast: pickFirstNumber(summary.pool_no_votes_cast, summary.spo_no_votes_cast, summary.pool?.no_votes_cast, summary.pool_no_votes),
        pool_abstain_votes_cast: pickFirstNumber(summary.pool_abstain_votes_cast, summary.spo_abstain_votes_cast, summary.pool?.abstain_votes_cast, summary.pool_abstain_votes),
        pool_yes_vote_power: pickFirstNumber(summary.pool_yes_vote_power, summary.spo_yes_vote_power, summary.pool?.yes_vote_power, summary.pool_yes_stake),
        pool_no_vote_power: pickFirstNumber(summary.pool_no_vote_power, summary.spo_no_vote_power, summary.pool?.no_vote_power, summary.pool_no_stake),
        pool_active_abstain_vote_power: pickFirstNumber(summary.pool_active_abstain_vote_power, summary.spo_active_abstain_vote_power, summary.pool?.active_abstain_vote_power)
    };
}

function pickFirstNumber(...values) {
    for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
    }
    return null;
}

function coerceNullableNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
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
