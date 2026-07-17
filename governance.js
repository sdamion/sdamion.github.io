const DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard';
const COMMITTEE_INFO_API_URL = 'https://api.tdsp.online/api/committee';
const PROPOSAL_VOTES_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const DREP_METADATA_API_URL = 'https://api.tdsp.online/api/dreps/metadata';
const DREP_INFO_API_URL = 'https://api.tdsp.online/api/dreps/info';
const DREP_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/drep';
const REMOTE_METADATA_API_URL = 'https://api.tdsp.online/api/metadata';
const LOCAL_DASHBOARD_PROXY_PATH = '/__dashboard_proxy__';
const LOCAL_COMMITTEE_PROXY_PATH = '/__committee_proxy__';
const LOCAL_PROPOSAL_VOTES_PROXY_PATH = '/__proposal_votes_proxy__';
const LOCAL_DREP_DIRECTORY_PROXY_PATH = '/__drep_directory_proxy__';
const LOCAL_DREP_DETAIL_PROXY_PATH = '/__drep_detail_proxy__';
const LOCAL_METADATA_PROXY_PATH = '/__metadata_proxy__';
const ACTIVE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const EPOCH_DURATION_SECONDS = 432000;
const CARDANO_MAINNET_EPOCH_ZERO_MS = Date.parse('2017-09-23T21:44:51Z');
const APPROVAL_GRACE_PERIOD_SECONDS = 300;
const TREASURY_NET_CHANGE_LIMIT_ADA = 350_000_000;
const TREASURY_NET_CHANGE_LIMIT_LOVELACE = TREASURY_NET_CHANGE_LIMIT_ADA * 1_000_000;
const TREASURY_BUDGET_YEAR_START_EPOCH = 604;
const TREASURY_BUDGET_YEAR_EPOCHS = 73;

let governanceRefreshTimer = null;
let epochCountdownTimer = null;
let epochEndsAtMs = null;
let currentEpochNumber = null;
let lastActiveRenderSignature = '';
let governanceState = null;
let governanceGroupsState = null;
let committeeInfoState = null;
const proposalVotesCache = new Map();
const committeeMemberStatsCache = new Map();
const drepMetadataCache = new Map();
let drepDirectoryPromise = null;
let drepInfoPromise = null;
let drepStatsPromise = null;
let committeeInfoPromise = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    setupGovernanceMenuKeyboard();
    removeDrepPowerSplitCard();
    ensureEpochCountdownCard();
    setupGovernanceSummaryActionCards();
    setupConstitutionalCommitteeCard();
    setupDrepDirectoryCard();
    loadCurrentEpoch();
    loadGovernanceActions();
    loadDrepDirectory().catch(() => {});
}

function setupGovernanceMenuKeyboard() {
    document.removeEventListener('keydown', handleGovernanceMenuEscape);
    document.addEventListener('keydown', handleGovernanceMenuEscape);
}

function handleGovernanceMenuEscape(event) {
    if (event.key !== 'Escape') return;
    const overlays = document.querySelectorAll('.governance-menu-overlay');
    const topOverlay = overlays[overlays.length - 1];
    if (typeof topOverlay?.governanceCloseOverlay === 'function') {
        topOverlay.governanceCloseOverlay();
    }
}

function setupDrepDirectoryCard() {
    const card = document.getElementById('gov-drep-card');
    bindGovernanceMenuTrigger(card, openDrepDirectoryOverlay);
}

function setupConstitutionalCommitteeCard() {
    const card = document.getElementById('gov-committee-card');
    bindGovernanceMenuTrigger(card, openConstitutionalCommitteeOverlay);
}

function setupGovernanceSummaryActionCards() {
    [
        { id: 'gov-active-card', groupKey: 'active', title: 'Active Governance Actions', emptyMessage: 'No active actions found.' },
        { id: 'gov-approved-card', groupKey: 'approved', title: 'Approved Governance Actions', emptyMessage: 'No approved actions found.' },
        { id: 'gov-rejected-card', groupKey: 'rejected', title: 'Rejected Governance Actions', emptyMessage: 'No rejected actions found.' },
        { id: 'gov-info-card', groupKey: 'info', title: 'Info Actions', emptyMessage: 'No info actions found.' }
    ].forEach(config => {
        const card = document.getElementById(config.id);
        const open = () => openGovernanceActionGroupOverlay(config.groupKey, config.title, config.emptyMessage);
        bindGovernanceMenuTrigger(card, open);
    });
}

function bindGovernanceMenuTrigger(element, openMenu) {
    if (!element) return;
    const activate = event => {
        element.focus({ preventScroll: true });
        openMenu(event);
    };
    element.addEventListener('click', activate);
    element.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activate(event);
    });
}

function removeDrepPowerSplitCard() {
    const powerSplit = document.getElementById('gov-drep-power-split');
    const card = powerSplit?.closest('.governance-summary-box');
    if (card) card.remove();
}

function ensureEpochCountdownCard() {
    if (document.getElementById('menu-epoch')) return;
    if (document.getElementById('gov-epoch-countdown')) return;

    const epochElement = document.getElementById('menu-epoch');
    if (epochElement?.parentElement) return;

    const summary = document.getElementById('governance-summary');
    if (!summary) return;
    const card = document.createElement('div');
    const value = document.createElement('strong');
    const label = document.createElement('span');

    value.id = 'gov-epoch-countdown';
    value.textContent = '--';
    label.textContent = 'Epoch ends in';

    card.appendChild(value);
    card.appendChild(label);
    summary.appendChild(card);
}

async function loadCurrentEpoch() {
    const epochElement = document.getElementById('menu-epoch');
    if (!epochElement) return;

    updateEpochCountdownFromMainnetClock();
}

async function loadGovernanceActions() {
    const groups = {
        active: document.getElementById('governance-active'),
        approved: document.getElementById('governance-approved'),
        rejected: document.getElementById('governance-rejected'),
        info: document.getElementById('governance-info')
    };

    try {
        const dashboardPayload = await fetchGovernanceDashboardPayload();
        governanceState = dashboardPayload;
        const proposals = getGovernanceProposalsFromDashboardPayload(dashboardPayload);
        if (!proposals.length) {
            throw new Error('No governance proposals found in dashboard payload');
        }
        const grouped = groupGovernanceProposals(proposals);
        governanceGroupsState = grouped;

        renderGovernanceGroupIfPresent(groups.active, grouped.active, 'No active actions found.');
        renderGovernanceGroupIfPresent(groups.approved, grouped.approved, 'No approved actions found.');
        renderGovernanceGroupIfPresent(groups.rejected, grouped.rejected, 'No rejected actions found.');
        renderGovernanceGroupIfPresent(groups.info, grouped.info, 'No info actions found.');
        await updateGovernanceCounts(grouped);
        lastActiveRenderSignature = getGovernanceGroupSignature(grouped.active);
        updateEpochDisplayFromDashboardPayload(dashboardPayload);
        scheduleActiveRefresh();
    } catch (error) {
        Object.values(groups).forEach(group => {
            if (!group) return;
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
        rejected: document.getElementById('governance-rejected'),
        info: document.getElementById('governance-info')
    };

    const dashboardPayload = await fetchGovernanceDashboardPayload().catch(() => null);
    if (!dashboardPayload) return;
    governanceState = dashboardPayload;
    updateEpochDisplayFromDashboardPayload(dashboardPayload);
    const proposals = getGovernanceProposalsFromDashboardPayload(dashboardPayload);
    const grouped = groupGovernanceProposals(proposals);
    const activeProposals = grouped.active;
    governanceGroupsState = grouped;

    const nextSignature = getGovernanceGroupSignature(activeProposals);
    if (nextSignature === lastActiveRenderSignature) return;

    renderGovernanceGroupIfPresent(groups.active, grouped.active, 'No active actions found.');
    renderGovernanceGroupIfPresent(groups.approved, grouped.approved, 'No approved actions found.');
    renderGovernanceGroupIfPresent(groups.rejected, grouped.rejected, 'No rejected actions found.');
    renderGovernanceGroupIfPresent(groups.info, grouped.info, 'No info actions found.');
    await updateGovernanceCounts(grouped);
    lastActiveRenderSignature = nextSignature;
}

function scheduleActiveRefresh() {
    if (governanceRefreshTimer !== null) return;

    governanceRefreshTimer = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        refreshActiveGovernanceGroup().catch(() => {});
    }, ACTIVE_REFRESH_INTERVAL_MS);
}

async function fetchGovernanceDashboardPayload() {
    return shouldUseLocalDashboardProxy()
        ? fetchJson(LOCAL_DASHBOARD_PROXY_PATH)
        : fetchJson(DASHBOARD_API_URL);
}

function shouldUseLocalDashboardProxy() {
    const host = window.location.hostname;
    return host === '127.0.0.1' || host === 'localhost';
}

function getProposalVotesApiUrl(proposalId) {
    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_VOTES_PROXY_PATH}?${params.toString()}`;
    }

    return `${PROPOSAL_VOTES_API_BASE_URL}/${encodeURIComponent(proposalId)}/votes`;
}

function getDashboardEpoch(payload) {
    const firstItem = Array.isArray(payload?.data) ? payload.data[0] : null;
    const firstProposal = Array.isArray(payload?.proposals) ? payload.proposals[0] : null;
    const candidates = [
        payload?.epoch,
        payload?.epoch_no,
        payload?.current_epoch,
        payload?.tip?.[0]?.epoch_no,
        firstProposal?.voting_summary?.epoch_no,
        firstProposal?.vote_summary?.epoch_no,
        firstProposal?.proposed_epoch,
        firstItem?.voting_summary?.epoch_no,
        firstItem?.vote_summary?.epoch_no,
        firstItem?.proposal?.proposed_epoch,
        firstItem?.proposed_epoch
    ];

    return candidates.map(Number).find(Number.isFinite) ?? null;
}

function getDashboardTip(payload = governanceState) {
    if (Array.isArray(payload?.tip) && payload.tip.length) return payload.tip[0];
    return payload?.tip || null;
}

function updateEpochDisplayFromDashboardPayload(payload) {
    updateEpochCountdownFromMainnetClock();
}

function updateEpochCountdownFromDashboardPayload(payload) {
    updateEpochCountdownFromMainnetClock();
}

function updateEpochCountdownFromMainnetClock() {
    const clockEpoch = getClockEpochSnapshot();
    currentEpochNumber = clockEpoch.epoch;
    epochEndsAtMs = clockEpoch.endsAtMs;
    const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
    updateEpochCountdownDisplay(remainingSeconds);
    startEpochCountdownTimer();
}

function getClockEpochSnapshot(nowMs = Date.now()) {
    const epochDurationMs = EPOCH_DURATION_SECONDS * 1000;
    const elapsedEpochs = Math.max(Math.floor((nowMs - CARDANO_MAINNET_EPOCH_ZERO_MS) / epochDurationMs), 0);
    return {
        epoch: elapsedEpochs,
        endsAtMs: CARDANO_MAINNET_EPOCH_ZERO_MS + ((elapsedEpochs + 1) * epochDurationMs)
    };
}

function startEpochCountdownTimer() {
    if (epochCountdownTimer !== null) return;

    epochCountdownTimer = window.setInterval(() => {
        if (!Number.isFinite(epochEndsAtMs)) {
            updateEpochCountdownDisplay(null);
            return;
        }
        const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
        if (remainingSeconds <= 0) {
            rollEpochCountdownForward();
            return;
        }
        updateEpochCountdownDisplay(remainingSeconds);
    }, 1000);
}

function rollEpochCountdownForward() {
    if (!Number.isFinite(epochEndsAtMs)) {
        updateEpochCountdownDisplay(null);
        return;
    }

    const epochDurationMs = EPOCH_DURATION_SECONDS * 1000;
    const elapsedEpochs = Math.max(Math.floor((Date.now() - epochEndsAtMs) / epochDurationMs) + 1, 1);
    epochEndsAtMs += elapsedEpochs * epochDurationMs;
    if (Number.isFinite(currentEpochNumber)) currentEpochNumber += elapsedEpochs;

    const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
    updateEpochCountdownDisplay(remainingSeconds);
}

function updateEpochCountdownDisplay(remainingSeconds) {
    const menuEpochElement = document.getElementById('menu-epoch');
    if (menuEpochElement) {
        const epochText = Number.isFinite(currentEpochNumber) ? `Epoch ${currentEpochNumber}` : 'Epoch ...';
        menuEpochElement.textContent = Number.isFinite(remainingSeconds)
            ? `${epochText} ${formatEpochCountdown(remainingSeconds)} left`
            : epochText;
        return;
    }

    const countdownElement = document.getElementById('gov-epoch-countdown');
    if (!countdownElement) return;
    countdownElement.textContent = Number.isFinite(remainingSeconds)
        ? formatEpochCountdown(remainingSeconds)
        : '--';
}

function formatEpochCountdown(totalSeconds) {
    const seconds = Math.max(Math.floor(totalSeconds), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(remainingSeconds).padStart(2, '0')
    ].join(':');
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let detail = '';
        try {
            const payload = await response.json();
            detail = payload?.detail || payload?.error || '';
        } catch {
            detail = '';
        }
        throw new Error(detail ? `HTTP ${response.status}: ${detail}` : `HTTP ${response.status}`);
    }
    return response.json();
}

function getCommitteeInfoApiUrl() {
    return shouldUseLocalDashboardProxy() ? LOCAL_COMMITTEE_PROXY_PATH : COMMITTEE_INFO_API_URL;
}

async function fetchCommitteeInfoPayload() {
    if (!committeeInfoPromise) {
        committeeInfoPromise = fetchJson(getCommitteeInfoApiUrl())
            .then(payload => {
                committeeInfoState = payload;
                return payload;
            })
            .catch(error => {
                committeeInfoPromise = null;
                throw error;
            });
    }

    return committeeInfoPromise;
}

function getGovernanceProposalsFromDashboardPayload(payload) {
    const proposals = Array.isArray(payload?.proposals) ? payload.proposals : [];
    if (proposals.length) {
        return proposals
            .map(item => normalizeGovernanceProposal(
                item?.proposal || item,
                item?.voting_summary || item?.vote_summary || item?.summary || item?.vote_percentages || item?.votePercentages || null,
                item
            ))
            .filter(proposal => proposal?.proposal_id);
    }

    const items = Array.isArray(payload?.data) ? payload.data : [];
    return items
        .map(item => normalizeGovernanceProposal(
            item?.proposal || item,
            item?.voting_summary || item?.vote_summary || item?.summary || item?.vote_percentages || item?.votePercentages || null,
            item
        ))
        .filter(proposal => proposal?.proposal_id);
}

function normalizeGovernanceProposal(proposal, linkedSummary = null, container = null) {
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
    let rawVoteSummary = normalizeVotingSummary(
        linkedSummary
        || container?.voting_summary
        || container?.vote_summary
        || container?.summary
        || container?.vote_percentages
        || container?.votePercentages
        || proposal?.voteSummary
        || proposal?.voting_summary
        || proposal?.summary
        || proposal?.vote_summary
        || proposal?.votes
        || proposal?.voting
        || null
    );
    if (!hasStructuredVoteSummary(rawVoteSummary)) {
        rawVoteSummary = normalizeGenericVotePercentages(
            container?.vote_percentages
            || container?.votePercentages
            || proposal?.vote_percentages
            || proposal?.votePercentages
            || null,
            normalized
        );
    }
    normalized.voteSummary = hasStructuredVoteSummary(rawVoteSummary) ? rawVoteSummary : null;
    normalized.voteDisplay = getVoteDisplayFromProposalSummary(normalized.voteSummary, normalized);
    normalized.votePercentages = normalized.voteDisplay?.percentages || null;
    applyDerivedGovernanceStatus(normalized, container || proposal);
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
        drep_yes_pct: pickFirstNumber(
            summary.drep_yes_pct, summary.drep_yes_percentage, summary.drep_yes_percent, summary.drepYesPct, summary.drepYesPercentage,
            summary.drep?.yes_pct, summary.drep?.yes_percentage, summary.drep?.yes_percent, summary.drep?.yesPct, summary.drep?.yesPercentage, summary.drep?.yes,
            summary.drep_votes?.yes_pct, summary.drep_votes?.yes_percentage, summary.drep_votes?.yes, summary.drepVotes?.yesPct, summary.drepVotes?.yesPercentage, summary.drepVotes?.yes,
            summary.votes?.drep?.yes_pct, summary.votes?.drep?.yes_percentage, summary.votes?.drep?.yes
        ),
        drep_no_pct: pickFirstNumber(
            summary.drep_no_pct, summary.drep_no_percentage, summary.drep_no_percent, summary.drepNoPct, summary.drepNoPercentage,
            summary.drep?.no_pct, summary.drep?.no_percentage, summary.drep?.no_percent, summary.drep?.noPct, summary.drep?.noPercentage, summary.drep?.no,
            summary.drep_votes?.no_pct, summary.drep_votes?.no_percentage, summary.drep_votes?.no, summary.drepVotes?.noPct, summary.drepVotes?.noPercentage, summary.drepVotes?.no,
            summary.votes?.drep?.no_pct, summary.votes?.drep?.no_percentage, summary.votes?.drep?.no
        ),
        drep_abstain_pct: pickFirstNumber(
            summary.drep_abstain_pct, summary.drep_abstain_percentage, summary.drep_abstain_percent, summary.drepAbstainPct, summary.drepAbstainPercentage,
            summary.drep?.abstain_pct, summary.drep?.abstain_percentage, summary.drep?.abstain_percent, summary.drep?.abstainPct, summary.drep?.abstainPercentage, summary.drep?.abstain,
            summary.drep_votes?.abstain_pct, summary.drep_votes?.abstain_percentage, summary.drep_votes?.abstain, summary.drepVotes?.abstainPct, summary.drepVotes?.abstainPercentage, summary.drepVotes?.abstain,
            summary.votes?.drep?.abstain_pct, summary.votes?.drep?.abstain_percentage, summary.votes?.drep?.abstain
        ),
        pool_yes_pct: pickFirstNumber(
            summary.pool_yes_pct, summary.pool_yes_percentage, summary.pool_yes_percent, summary.poolYesPct, summary.poolYesPercentage,
            summary.spo_yes_pct, summary.spo_yes_percentage, summary.spo_yes_percent, summary.spoYesPct, summary.spoYesPercentage,
            summary.pool?.yes_pct, summary.pool?.yes_percentage, summary.pool?.yes_percent, summary.pool?.yesPct, summary.pool?.yesPercentage, summary.pool?.yes,
            summary.spo?.yes_pct, summary.spo?.yes_percentage, summary.spo?.yes_percent, summary.spo?.yesPct, summary.spo?.yesPercentage, summary.spo?.yes,
            summary.pool_votes?.yes_pct, summary.pool_votes?.yes_percentage, summary.pool_votes?.yes, summary.poolVotes?.yesPct, summary.poolVotes?.yesPercentage, summary.poolVotes?.yes,
            summary.spo_votes?.yes_pct, summary.spo_votes?.yes_percentage, summary.spo_votes?.yes, summary.spoVotes?.yesPct, summary.spoVotes?.yesPercentage, summary.spoVotes?.yes,
            summary.votes?.pool?.yes_pct, summary.votes?.pool?.yes_percentage, summary.votes?.pool?.yes,
            summary.votes?.spo?.yes_pct, summary.votes?.spo?.yes_percentage, summary.votes?.spo?.yes
        ),
        pool_no_pct: pickFirstNumber(
            summary.pool_no_pct, summary.pool_no_percentage, summary.pool_no_percent, summary.poolNoPct, summary.poolNoPercentage,
            summary.spo_no_pct, summary.spo_no_percentage, summary.spo_no_percent, summary.spoNoPct, summary.spoNoPercentage,
            summary.pool?.no_pct, summary.pool?.no_percentage, summary.pool?.no_percent, summary.pool?.noPct, summary.pool?.noPercentage, summary.pool?.no,
            summary.spo?.no_pct, summary.spo?.no_percentage, summary.spo?.no_percent, summary.spo?.noPct, summary.spo?.noPercentage, summary.spo?.no,
            summary.pool_votes?.no_pct, summary.pool_votes?.no_percentage, summary.pool_votes?.no, summary.poolVotes?.noPct, summary.poolVotes?.noPercentage, summary.poolVotes?.no,
            summary.spo_votes?.no_pct, summary.spo_votes?.no_percentage, summary.spo_votes?.no, summary.spoVotes?.noPct, summary.spoVotes?.noPercentage, summary.spoVotes?.no,
            summary.votes?.pool?.no_pct, summary.votes?.pool?.no_percentage, summary.votes?.pool?.no,
            summary.votes?.spo?.no_pct, summary.votes?.spo?.no_percentage, summary.votes?.spo?.no
        ),
        pool_abstain_pct: pickFirstNumber(
            summary.pool_abstain_pct, summary.pool_abstain_percentage, summary.pool_abstain_percent, summary.poolAbstainPct, summary.poolAbstainPercentage,
            summary.spo_abstain_pct, summary.spo_abstain_percentage, summary.spo_abstain_percent, summary.spoAbstainPct, summary.spoAbstainPercentage,
            summary.pool?.abstain_pct, summary.pool?.abstain_percentage, summary.pool?.abstain_percent, summary.pool?.abstainPct, summary.pool?.abstainPercentage, summary.pool?.abstain,
            summary.spo?.abstain_pct, summary.spo?.abstain_percentage, summary.spo?.abstain_percent, summary.spo?.abstainPct, summary.spo?.abstainPercentage, summary.spo?.abstain,
            summary.pool_votes?.abstain_pct, summary.pool_votes?.abstain_percentage, summary.pool_votes?.abstain, summary.poolVotes?.abstainPct, summary.poolVotes?.abstainPercentage, summary.poolVotes?.abstain,
            summary.spo_votes?.abstain_pct, summary.spo_votes?.abstain_percentage, summary.spo_votes?.abstain, summary.spoVotes?.abstainPct, summary.spoVotes?.abstainPercentage, summary.spoVotes?.abstain,
            summary.votes?.pool?.abstain_pct, summary.votes?.pool?.abstain_percentage, summary.votes?.pool?.abstain,
            summary.votes?.spo?.abstain_pct, summary.votes?.spo?.abstain_percentage, summary.votes?.spo?.abstain
        ),
        committee_yes_pct: pickFirstNumber(summary.committee_yes_pct, summary.committee?.yes_pct, summary.committee?.yes),
        committee_no_pct: pickFirstNumber(summary.committee_no_pct, summary.committee?.no_pct, summary.committee?.no),
        drep_yes_votes_cast: pickFirstNumber(summary.drep_yes_votes_cast, summary.drep?.yes_votes_cast, summary.drep_yes_votes),
        drep_no_votes_cast: pickFirstNumber(summary.drep_no_votes_cast, summary.drep?.no_votes_cast, summary.drep_no_votes),
        drep_abstain_votes_cast: pickFirstNumber(summary.drep_abstain_votes_cast, summary.drep?.abstain_votes_cast, summary.drep_abstain_votes),
        drep_active_yes_vote_power: pickFirstNumber(summary.drep_active_yes_vote_power, summary.drep?.active_yes_vote_power, summary.drep_yes_vote_power, summary.drep?.yes_vote_power, summary.drep_yes_stake),
        drep_active_no_vote_power: pickFirstNumber(summary.drep_active_no_vote_power, summary.drep?.active_no_vote_power, summary.drep_no_vote_power, summary.drep?.no_vote_power, summary.drep_no_stake),
        drep_yes_vote_power: pickFirstNumber(summary.drep_yes_vote_power, summary.drep?.yes_vote_power, summary.drep_yes_stake),
        drep_no_vote_power: pickFirstNumber(summary.drep_no_vote_power, summary.drep?.no_vote_power, summary.drep_no_stake),
        drep_active_abstain_vote_power: pickFirstNumber(summary.drep_active_abstain_vote_power, summary.drep?.active_abstain_vote_power, summary.drep_abstain_vote_power, summary.drep?.abstain_vote_power),
        drep_always_abstain_vote_power: pickFirstNumber(summary.drep_always_abstain_vote_power, summary.drep?.always_abstain_vote_power),
        drep_always_no_confidence_vote_power: pickFirstNumber(summary.drep_always_no_confidence_vote_power, summary.drep?.always_no_confidence_vote_power),
        pool_yes_votes_cast: pickFirstNumber(summary.pool_yes_votes_cast, summary.spo_yes_votes_cast, summary.pool?.yes_votes_cast, summary.pool_yes_votes),
        pool_no_votes_cast: pickFirstNumber(summary.pool_no_votes_cast, summary.spo_no_votes_cast, summary.pool?.no_votes_cast, summary.pool_no_votes),
        pool_abstain_votes_cast: pickFirstNumber(summary.pool_abstain_votes_cast, summary.spo_abstain_votes_cast, summary.pool?.abstain_votes_cast, summary.pool_abstain_votes),
        pool_yes_vote_power: pickFirstNumber(summary.pool_yes_vote_power, summary.spo_yes_vote_power, summary.pool?.yes_vote_power, summary.pool_yes_stake),
        pool_no_vote_power: pickFirstNumber(summary.pool_no_vote_power, summary.spo_no_vote_power, summary.pool?.no_vote_power, summary.pool_no_stake),
        pool_active_abstain_vote_power: pickFirstNumber(summary.pool_active_abstain_vote_power, summary.spo_active_abstain_vote_power, summary.pool?.active_abstain_vote_power),
        pool_abstain_vote_power: pickFirstNumber(summary.pool_abstain_vote_power, summary.spo_abstain_vote_power, summary.pool?.abstain_vote_power, summary.pool_abstain_stake)
    };
}

function normalizeGenericVotePercentages(percentages, proposal) {
    if (!percentages || typeof percentages !== 'object') return null;

    const yes = pickFirstNumber(
        percentages.yes_pct,
        percentages.yes_percentage,
        percentages.yesPercent,
        percentages.yes
    );
    const no = pickFirstNumber(
        percentages.no_pct,
        percentages.no_percentage,
        percentages.noPercent,
        percentages.no
    );
    const abstain = pickFirstNumber(
        percentages.abstain_pct,
        percentages.abstain_percentage,
        percentages.abstainPercent,
        percentages.abstain,
        Number.isFinite(yes) && Number.isFinite(no) ? 100 - yes - no : null
    );

    if (![yes, no, abstain].every(Number.isFinite)) return null;

    if (usesPoolVoting(proposal)) {
        return {
            pool_yes_pct: yes,
            pool_no_pct: no,
            pool_abstain_pct: abstain
        };
    }

    return {
        drep_yes_pct: yes,
        drep_no_pct: no,
        drep_abstain_pct: abstain
    };
}

function hasStructuredVoteSummary(summary) {
    if (!summary || typeof summary !== 'object') return false;

    return [
        summary.drep_yes_pct,
        summary.drep_no_pct,
        summary.drep_abstain_pct,
        summary.pool_yes_pct,
        summary.pool_no_pct,
        summary.pool_abstain_pct,
        summary.drep_yes_votes_cast,
        summary.drep_no_votes_cast,
        summary.drep_abstain_votes_cast,
        summary.pool_yes_votes_cast,
        summary.pool_no_votes_cast,
        summary.pool_abstain_votes_cast,
        summary.drep_yes_vote_power,
        summary.drep_no_vote_power,
        summary.pool_yes_vote_power,
        summary.pool_no_vote_power
    ].some(value => Number.isFinite(Number(value)));
}

function pickFirstNumber(...values) {
    for (const value of values) {
        const number = normalizePercentageNumber(value);
        if (Number.isFinite(number)) return number;
    }
    return null;
}

function normalizePercentageNumber(value) {
    if (value === null || value === undefined || value === '') return NaN;
    const number = Number(value);
    if (!Number.isFinite(number)) return NaN;
    return number;
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
    }, { active: [], approved: [], rejected: [], info: [] });

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
    const votePowerPercentages = getPercentagesFromVotePower(summary, prefix);
    if (votePowerPercentages) return votePowerPercentages;

    const voteCountPercentages = getPercentagesFromVoteCounts(summary, prefix);
    if (voteCountPercentages) return voteCountPercentages;

    const yes = normalizePercentageNumber(summary[`${prefix}_yes_pct`]);
    const no = normalizePercentageNumber(summary[`${prefix}_no_pct`]);
    if (![yes, no].every(Number.isFinite)) return null;
    const total = yes + no;
    if (total <= 0) return null;
    return {
        yes: (yes / total) * 100,
        no: (no / total) * 100,
        abstain: 0
    };
}

function getPercentagesFromVoteCounts(summary, prefix) {
    const yes = Number(summary[`${prefix}_yes_votes_cast`]) || 0;
    const no = Number(summary[`${prefix}_no_votes_cast`]) || 0;
    const total = yes + no;
    if (total <= 0) return null;
    return {
        yes: (yes / total) * 100,
        no: (no / total) * 100,
        abstain: 0
    };
}

function getPercentagesFromVotePower(summary, prefix) {
    const yes = pickFirstNumber(
        summary[`${prefix}_yes_vote_power`],
        summary[`${prefix}_active_yes_vote_power`],
        summary[`${prefix}_yes_stake`]
    ) || 0;
    const no = pickFirstNumber(
        summary[`${prefix}_no_vote_power`],
        summary[`${prefix}_active_no_vote_power`],
        summary[`${prefix}_no_stake`]
    ) || 0;
    const total = yes + no;
    if (total <= 0) return null;
    return {
        yes: (yes / total) * 100,
        no: (no / total) * 100,
        abstain: 0
    };
}

function usesPoolVoting(proposal) {
    return proposal?.proposal_type === 'HardForkInitiation'
        || proposal?.proposal_type === 'ParameterChange';
}

function getGovernanceStatus(proposal) {
    if (proposal?.proposal_type === 'InfoAction') return 'info';
    if (meetsGovernanceApprovalThreshold(proposal)) return 'approved';
    if (proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return 'rejected';
    if (proposal.ratified_epoch !== null || proposal.enacted_epoch !== null) return 'approved';
    return 'active';
}

function meetsGovernanceApprovalThreshold(proposal) {
    const yes = Number(proposal?.votePercentages?.yes);
    if (!Number.isFinite(yes)) return false;
    if (!hasPassedExpirationGracePeriod(proposal)) return false;

    if (proposal?.voteDisplay?.source === 'pool') {
        return yes >= 50;
    }

    return yes >= 67;
}

function hasPassedExpirationGracePeriod(proposal) {
    const expirationEpoch = Number(proposal?.expiration);
    if (!Number.isFinite(expirationEpoch)) return false;

    const clockEpoch = getClockEpochSnapshot();
    const currentEpoch = clockEpoch.epoch;
    const currentEpochSlot = Math.floor((Date.now() - CARDANO_MAINNET_EPOCH_ZERO_MS) / 1000) % EPOCH_DURATION_SECONDS;

    if (!Number.isFinite(currentEpoch) || !Number.isFinite(currentEpochSlot)) return false;
    if (currentEpoch < expirationEpoch) return false;
    if (currentEpoch === expirationEpoch) return false;

    const elapsedSinceExpirationEnd = ((currentEpoch - expirationEpoch - 1) * EPOCH_DURATION_SECONDS) + currentEpochSlot;
    return elapsedSinceExpirationEnd >= APPROVAL_GRACE_PERIOD_SECONDS;
}

function shouldShowVotePercentages(proposal) {
    return Boolean(proposal?.proposal_id);
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

function renderGovernanceGroupIfPresent(container, proposals, emptyMessage) {
    if (!container) return;
    renderGovernanceGroup(container, proposals, emptyMessage);
}

function createGovernanceCard(proposal, options = {}) {
    const card = document.createElement('button');
    card.className = 'governance-card governance-menu-card';
    card.type = 'button';
    card.dataset.proposalId = proposal.proposal_id;
    const handleClick = options.onClick || (event => {
        openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
    });
    card.addEventListener('click', handleClick);

    const title = document.createElement('span');
    title.className = 'governance-title';
    title.textContent = getProposalTitle(proposal);

    const expiration = document.createElement('span');
    expiration.className = 'governance-expiration';
    expiration.textContent = getExpirationText(proposal);

    const metadataItems = getActiveGovernanceCardMetadata(proposal);
    const votes = document.createElement('span');
    if (!proposal.votePercentages) {
        votes.className = 'governance-votes vote-neutral';
        votes.textContent = 'Open for live votes';
    } else {
        votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source)}`;
        votes.textContent = formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source);
    }

    card.appendChild(title);
    card.appendChild(expiration);
    metadataItems.forEach(item => {
        const detail = document.createElement('span');
        detail.className = 'governance-card-detail';
        detail.textContent = `${item.label} ${item.value}`;
        card.appendChild(detail);
    });
    if (shouldShowVotePercentages(proposal)) card.appendChild(votes);

    return card;
}

function appendGovernanceDialogHeader(dialog, title, close, leadingNodes = [], meta = null) {
    const header = document.createElement('header');
    header.className = 'overlay-dialog-header';

    const copy = document.createElement('div');
    copy.className = 'overlay-dialog-header-copy';
    leadingNodes.forEach(node => copy.appendChild(node));
    copy.appendChild(title);
    if (meta) copy.appendChild(meta);

    header.appendChild(copy);
    header.appendChild(close);
    dialog.appendChild(header);
}

function appendGovernanceDialogBody(dialog, ...nodes) {
    const body = document.createElement('div');
    body.className = 'overlay-dialog-body';
    nodes.forEach(node => body.appendChild(node));
    dialog.appendChild(body);
}

function createGovernanceMenuOverlay(options) {
    const {
        id,
        titleId,
        titleText,
        closeLabel,
        closeOverlay,
        bodyNodes = [],
        leadingNodes = [],
        overlayClass = 'governance-drep-overlay',
        dialogClass = 'governance-drep-dialog',
        titleTag = 'h3',
        headerMeta = '',
        returnFocus = document.activeElement
    } = options;

    const overlay = document.createElement('div');
    overlay.className = `governance-overlay governance-menu-overlay ${overlayClass}`.trim();
    overlay.id = id;
    overlay.governanceReturnFocus = returnFocus;
    overlay.governanceCloseOverlay = closeOverlay;
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = `governance-dialog ${dialogClass}`.trim();
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', titleId);

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', closeLabel);
    close.textContent = 'Close';
    close.addEventListener('click', closeOverlay);

    const title = document.createElement(titleTag);
    title.id = titleId;
    if (titleTag !== 'h2') title.className = 'governance-drep-title';
    title.textContent = titleText;

    const meta = document.createElement('span');
    meta.className = 'governance-menu-header-meta';
    meta.dataset.governanceMenuHeaderMeta = 'true';
    meta.textContent = headerMeta;

    appendGovernanceDialogHeader(dialog, title, close, leadingNodes, meta);
    appendGovernanceDialogBody(dialog, ...bodyNodes);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    close.focus();

    return { overlay, dialog, close, title, meta };
}

function updateGovernanceMenuHeaderMeta(id, text) {
    const meta = document.querySelector(
        `#${id} [data-governance-menu-header-meta="true"]`
    );
    if (meta) meta.textContent = text;
}

function removeGovernanceMenuOverlay(id) {
    const overlay = document.getElementById(id);
    const returnFocus = overlay?.governanceReturnFocus;
    if (overlay) overlay.remove();
    if (returnFocus?.isConnected) returnFocus.focus();
}

function openGovernanceActionGroupOverlay(groupKey, titleText, emptyMessage) {
    closeGovernanceActionGroupOverlay();

    const proposals = governanceGroupsState?.[groupKey]
        || groupGovernanceProposals(getGovernanceProposalsFromDashboardPayload(governanceState || {}))[groupKey]
        || [];
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, emptyMessage);

    createGovernanceMenuOverlay({
        id: 'governance-action-group-overlay',
        titleId: 'governance-action-group-title',
        titleText,
        closeLabel: `Close ${titleText}`,
        closeOverlay: closeGovernanceActionGroupOverlay,
        bodyNodes: [panel],
        headerMeta: `${proposals.length.toLocaleString('en-US')} actions`
    });
}

function closeGovernanceActionGroupOverlay() {
    removeGovernanceMenuOverlay('governance-action-group-overlay');
}

function openGovernanceStatusActionsOverlay(titleText, proposals, returnFocus) {
    closeGovernanceStatusActionsOverlay();

    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, 'No governance actions found.');

    createGovernanceMenuOverlay({
        id: 'governance-status-actions-overlay',
        titleId: 'governance-status-actions-title',
        titleText,
        closeLabel: `Close ${titleText}`,
        closeOverlay: closeGovernanceStatusActionsOverlay,
        bodyNodes: [panel],
        headerMeta: `${proposals.length.toLocaleString('en-US')} actions`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus
    });
}

function closeGovernanceStatusActionsOverlay() {
    removeGovernanceMenuOverlay('governance-status-actions-overlay');
}

function getTreasuryBudgetMetadata(proposal) {
    if (proposal?.proposal_type !== 'TreasuryWithdrawals') return [];

    const usedThisYear = getTreasuryBudgetUsedThisYear();
    const remaining = Math.max(TREASURY_NET_CHANGE_LIMIT_LOVELACE - usedThisYear, 0);

    return [
        {
            label: 'Net change limit',
            value: formatCompactAdaFromLovelace(TREASURY_NET_CHANGE_LIMIT_LOVELACE, { fixedFractionDigits: 2 })
        },
        {
            label: 'Used this year',
            value: formatCompactAdaFromLovelace(usedThisYear, { fixedFractionDigits: 2 })
        },
        {
            label: 'To be allocated',
            value: formatCompactAdaFromLovelace(remaining, { fixedFractionDigits: 2 })
        }
    ];
}

function updateTreasuryBudgetBar() {
    const usedThisYear = getTreasuryBudgetUsedThisYear();
    const remaining = Math.max(TREASURY_NET_CHANGE_LIMIT_LOVELACE - usedThisYear, 0);
    const activeAskTotal = getActiveTreasuryProposalAskTotal();
    const afterTotalSpend = remaining - activeAskTotal;

    setBudgetBarItem('gov-budget-limit', 'Net change limit', formatCompactAdaFromLovelace(TREASURY_NET_CHANGE_LIMIT_LOVELACE, { fixedFractionDigits: 2 }));
    setBudgetBarItem('gov-budget-used', 'Used this year', formatCompactAdaFromLovelace(usedThisYear, { fixedFractionDigits: 2 }));
    setBudgetBarItem(
        'gov-budget-remaining',
        'To be allocated',
        formatCompactAdaFromLovelace(remaining, { fixedFractionDigits: 2 }),
        false,
        getBudgetAmountTone(remaining)
    );
    setBudgetBarItem(
        'gov-budget-after-spend',
        'After total spend',
        `${afterTotalSpend < 0 ? '-' : ''}${formatCompactAdaFromLovelace(Math.abs(afterTotalSpend), { fixedFractionDigits: 2 })}`,
        afterTotalSpend < 0,
        getBudgetAmountTone(afterTotalSpend)
    );
}

function setBudgetBarItem(id, label, amount, isNegative = false, amountTone = '') {
    const element = document.getElementById(id);
    if (!element) return;

    element.textContent = '';
    element.classList.toggle('is-negative', isNegative);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'governance-budget-label';
    labelSpan.textContent = label;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'governance-budget-amount';
    if (amountTone) amountSpan.classList.add(`is-${amountTone}`);
    amountSpan.textContent = amount;

    element.appendChild(labelSpan);
    element.appendChild(amountSpan);
}

function getBudgetAmountTone(value) {
    const ratio = Number(value) / TREASURY_NET_CHANGE_LIMIT_LOVELACE;
    if (!Number.isFinite(ratio) || ratio < 0.25) return 'red';
    if (ratio < 0.5) return 'orange';
    return 'green';
}

function getTreasuryBudgetUsedThisYear() {
    const proposals = Array.isArray(governanceState?.proposals)
        ? getGovernanceProposalsFromDashboardPayload(governanceState)
        : [];
    const yearEndEpoch = TREASURY_BUDGET_YEAR_START_EPOCH + TREASURY_BUDGET_YEAR_EPOCHS;

    return proposals.reduce((sum, proposal) => {
        if (proposal?.proposal_type !== 'TreasuryWithdrawals') return sum;
        if (getGovernanceStatus(proposal) !== 'approved') return sum;

        const proposedEpoch = Number(proposal?.proposed_epoch);
        if (!Number.isFinite(proposedEpoch)) return sum;
        if (proposedEpoch < TREASURY_BUDGET_YEAR_START_EPOCH || proposedEpoch >= yearEndEpoch) return sum;

        return sum + getProposalTotalAskLovelace(proposal);
    }, 0);
}

function getActiveTreasuryProposalAskTotal() {
    const proposals = Array.isArray(governanceState?.proposals)
        ? getGovernanceProposalsFromDashboardPayload(governanceState)
        : [];

    return proposals.reduce((sum, proposal) => {
        if (proposal?.proposal_type !== 'TreasuryWithdrawals') return sum;
        if (getGovernanceStatus(proposal) !== 'active') return sum;
        return sum + getProposalTotalAskLovelace(proposal);
    }, 0);
}

function getActiveGovernanceCardMetadata(proposal) {
    const items = [];
    const totalAsk = getProposalTotalAskLovelace(proposal);
    if (Number.isFinite(totalAsk) && totalAsk > 0) {
        items.push({
            label: 'Total ask',
            value: formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })
        });
    }

    const netChangeLimit = getProposalNetChangeLimit(proposal);
    if (netChangeLimit) {
        items.push({
            label: 'Net change limit',
            value: netChangeLimit
        });
    }

    return items;
}

function getGovernanceActionHeaderMeta(proposal) {
    const totalAsk = getProposalTotalAskLovelace(proposal);
    if (!Number.isFinite(totalAsk) || totalAsk <= 0) return '';
    return `Total ask ${formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })}`;
}

function getProposalTotalAskLovelace(proposal) {
    const withdrawalAmounts = Array.isArray(proposal?.withdrawal)
        ? proposal.withdrawal
            .map(entry => Number(entry?.amount))
            .filter(Number.isFinite)
        : [];
    if (withdrawalAmounts.length) {
        return withdrawalAmounts.reduce((sum, value) => sum + value, 0);
    }

    const rewardValues = proposal?.meta_json?.body?.onChain?.gov_action?.rewards;
    if (Array.isArray(rewardValues) && rewardValues.length) {
        return rewardValues
            .map(entry => Number(entry?.value))
            .filter(Number.isFinite)
            .reduce((sum, value) => sum + value, 0);
    }

    const contents = proposal?.proposal_description?.contents;
    if (Array.isArray(contents)) {
        let total = 0;
        collectNumericWithdrawalAmounts(contents, value => {
            total += value;
        });
        if (total > 0) return total;
    }

    return 0;
}

function collectNumericWithdrawalAmounts(value, onAmount) {
    if (Array.isArray(value)) {
        value.forEach(entry => collectNumericWithdrawalAmounts(entry, onAmount));
        return;
    }

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        onAmount(value);
        return;
    }

    if (!value || typeof value !== 'object') return;

    if (value.amount !== undefined) {
        const amount = Number(value.amount);
        if (Number.isFinite(amount) && amount > 0) onAmount(amount);
    }
}

function getProposalNetChangeLimit(proposal) {
    const rawValue = findValueByNormalizedKey(proposal?.param_proposal, 'netchangelimit')
        ?? findValueByNormalizedKey(proposal?.meta_json?.body?.onChain, 'netchangelimit')
        ?? findValueByNormalizedKey(proposal?.proposal_description, 'netchangelimit')
        ?? findValueByNormalizedKey(proposal?.meta_json, 'netchangelimit');

    return formatGovernanceMetaValue(rawValue);
}

function findValueByNormalizedKey(value, targetKey) {
    if (!value || typeof value !== 'object') return null;

    if (Array.isArray(value)) {
        for (const entry of value) {
            const match = findValueByNormalizedKey(entry, targetKey);
            if (match !== null && match !== undefined) return match;
        }
        return null;
    }

    for (const [key, entryValue] of Object.entries(value)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedKey === targetKey) return entryValue;
        if (entryValue && typeof entryValue === 'object') {
            const nestedMatch = findValueByNormalizedKey(entryValue, targetKey);
            if (nestedMatch !== null && nestedMatch !== undefined) return nestedMatch;
        }
    }

    return null;
}

function formatGovernanceMetaValue(value) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isInteger(value)
            ? value.toLocaleString('en-US')
            : value.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
    if (typeof value === 'string') return value.trim();
    return '';
}

function openGovernanceOverlay(proposal, options = {}) {
    closeGovernanceOverlay();

    const headerContext = document.createElement('div');
    headerContext.className = 'governance-action-header-context';

    const type = document.createElement('span');
    type.className = 'governance-type';
    type.textContent = formatProposalType(proposal.proposal_type);

    const meta = document.createElement('p');
    meta.className = 'governance-action-header-epoch';
    meta.textContent = getProposalMeta(proposal);
    headerContext.append(type, meta);

    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    const voteDetailsContainer = document.createElement('div');
    voteDetailsContainer.className = 'governance-vote-details';
    voteDetailsContainer.dataset.proposalId = proposal.proposal_id;
    addVoteDetailsState(voteDetailsContainer, 'Loading vote details...');
    content.appendChild(voteDetailsContainer);

    const embeddedImages = extractGovernanceImageCandidates(proposal);

    addDetailRow(content, 'Action ID', proposal.proposal_id);
    addDetailRow(content, 'Transaction', proposal.proposal_tx_hash);

    const body = proposal.meta_json?.body || proposal.meta_json || {};
    addMarkdownDetailSection(content, 'Abstract', body.abstract);
    addMarkdownDetailSection(content, 'Motivation', body.motivation);
    addMarkdownDetailSection(content, 'Rationale', body.rationale);
    addEmbeddedGovernanceImages(content, proposal, embeddedImages);

    createGovernanceMenuOverlay({
        id: 'governance-overlay',
        titleId: 'governance-dialog-title',
        titleText: getProposalTitle(proposal),
        closeLabel: 'Close governance action',
        closeOverlay: closeGovernanceOverlay,
        bodyNodes: [content],
        leadingNodes: [headerContext],
        headerMeta: getGovernanceActionHeaderMeta(proposal),
        overlayClass: 'governance-action-detail-overlay',
        titleTag: 'h2',
        returnFocus: options.returnFocus
    });
    loadProposalVoteDetails(proposal, voteDetailsContainer).catch(() => {
        if (!voteDetailsContainer.isConnected) return;
        addVoteDetailsState(voteDetailsContainer, 'Vote details could not be loaded.');
    });
}

function closeGovernanceOverlay() {
    closeDrepVotesOverlay();
    closeSpoVotesOverlay();
    removeGovernanceMenuOverlay('governance-overlay');
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

function addMarkdownDetailSection(container, label, value) {
    if (value === null || value === undefined || value === '') return;
    const cleanValue = sanitizeGovernanceMarkdown(cleanGovernanceText(String(value)));
    if (!cleanValue) return;

    const section = document.createElement('section');
    section.className = 'governance-markdown-section';

    const heading = document.createElement('strong');
    heading.textContent = label;

    const body = document.createElement('div');
    body.className = 'governance-markdown';
    renderMarkdown(body, cleanValue);

    section.appendChild(heading);
    section.appendChild(body);
    container.appendChild(section);
}

function addEmbeddedGovernanceImages(container, proposal, candidates = extractGovernanceImageCandidates(proposal)) {
    if (!candidates.length) return;

    const section = document.createElement('section');
    section.className = 'governance-markdown-section';

    const heading = document.createElement('strong');
    heading.textContent = candidates.length === 1 ? 'Image' : 'Images';
    section.appendChild(heading);

    candidates.forEach(candidate => {
        const imageLink = document.createElement('a');
        imageLink.href = candidate.src;
        imageLink.target = '_blank';
        imageLink.rel = 'noopener noreferrer';

        const image = document.createElement('img');
        image.className = 'governance-detail-image';
        image.src = candidate.src;
        image.alt = candidate.alt || 'Governance action image';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';

        imageLink.appendChild(image);
        section.appendChild(imageLink);
    });

    container.appendChild(section);
}

function extractGovernanceImageCandidates(proposal) {
    const results = [];
    const seen = new Set();
    const sources = [
        proposal?.meta_json,
        proposal?.meta_json?.body,
        proposal?.proposal_description
    ];

    sources.forEach(source => collectGovernanceImageCandidates(source, results, seen));
    return results;
}

function collectGovernanceImageCandidates(value, results, seen, keyHint = '') {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
        extractGovernanceImageCandidatesFromString(value, keyHint).forEach(candidate => {
            if (!seen.has(candidate.src)) {
                seen.add(candidate.src);
                results.push(candidate);
            }
        });
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(entry => collectGovernanceImageCandidates(entry, results, seen, keyHint));
        return;
    }

    if (typeof value !== 'object') return;

    Object.entries(value).forEach(([key, entry]) => {
        const nestedHint = [keyHint, key].filter(Boolean).join('.');
        collectGovernanceImageCandidates(entry, results, seen, nestedHint);
    });
}

function extractGovernanceImageCandidatesFromString(value, keyHint = '') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    const candidates = [];
    const seen = new Set();
    const addCandidate = candidate => {
        if (!candidate || seen.has(candidate.src)) return;
        seen.add(candidate.src);
        candidates.push(candidate);
    };

    const directCandidate = normalizeGovernanceImageCandidate(trimmed, keyHint);
    if (directCandidate) addCandidate(directCandidate);

    const markdownMatches = trimmed.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g);
    for (const match of markdownMatches) {
        const src = normalizeImageSource(match[2], keyHint || match[1]);
        if (src) addCandidate({ src, alt: match[1] || 'Governance action image' });
    }

    const htmlMatches = trimmed.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi);
    for (const match of htmlMatches) {
        const src = normalizeImageSource(match[1], keyHint || match[2]);
        if (src) addCandidate({ src, alt: match[2] || 'Governance action image' });
    }

    const dataImageMatches = trimmed.matchAll(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/gi);
    for (const match of dataImageMatches) {
        const src = normalizeImageSource(match[0], keyHint);
        if (src) addCandidate({ src, alt: 'Governance action image' });
    }

    const urlMatches = trimmed.matchAll(/(?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+/gi);
    for (const match of urlMatches) {
        const src = normalizeImageSource(match[0], keyHint);
        if (src) addCandidate({ src, alt: 'Governance action image' });
    }

    const parsedJson = parseEmbeddedJson(trimmed);
    if (parsedJson) {
        collectGovernanceImageCandidates(parsedJson, candidates, seen, keyHint);
    }

    return candidates;
}

function normalizeGovernanceImageCandidate(value, keyHint = '') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const markdownMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (markdownMatch) {
        const src = normalizeImageSource(markdownMatch[2], keyHint);
        return src ? { src, alt: markdownMatch[1] || 'Governance action image' } : null;
    }

    const src = normalizeImageSource(trimmed, keyHint);
    return src ? { src, alt: 'Governance action image' } : null;
}

function normalizeImageSource(value, keyHint = '') {
    if (!value) return '';

    const normalizedKeyHint = String(keyHint).toLowerCase();

    if (value.startsWith('data:image/')) {
        return value;
    }

    if (/^<svg[\s>]/i.test(value)) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
    }

    const normalizedUrl = normalizeMetadataUrl(value);
    if (/^(https?:\/\/|ipfs:\/\/)/i.test(value)) {
        return isRenderableImageUrl(normalizedUrl, normalizedKeyHint) ? normalizedUrl : '';
    }

    if (looksLikeBase64Image(value, normalizedKeyHint)) {
        return `data:image/png;base64,${value.replace(/\s+/g, '')}`;
    }

    return '';
}

function looksLikeBase64Image(value, keyHint = '') {
    const compact = value.replace(/\s+/g, '');
    if (compact.length < 120) return false;
    if (!/^[A-Za-z0-9+/=]+$/.test(compact)) return false;

    const imageHintPattern = /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i;
    if (imageHintPattern.test(keyHint)) return true;

    return /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR|PHN2Zy)/.test(compact);
}

function parseEmbeddedJson(value) {
    if (!value || value.length < 2) return null;

    const startsLikeJson = (
        (value.startsWith('{') && value.endsWith('}'))
        || (value.startsWith('[') && value.endsWith(']'))
    );
    if (!startsLikeJson) return null;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function addVoteDetailsState(container, message) {
    container.textContent = '';
    const text = document.createElement('p');
    text.className = 'small-text';
    text.textContent = message;
    container.appendChild(text);
}

async function loadProposalVoteDetails(proposal, container) {
    if (!proposal?.proposal_id || !container?.isConnected) return;

    const payload = await fetchProposalVotesPayload(proposal.proposal_id);
    if (!container.isConnected || container.dataset.proposalId !== proposal.proposal_id) return;

    const detailProposal = mergeProposalVoteDetails(proposal, payload);
    updateGovernanceCardVotes(proposal.proposal_id, detailProposal);
    renderVoteDetailsPanel(container, detailProposal, payload);

    if (!container.childNodes.length) {
        addVoteDetailsState(container, 'No vote details found for this action.');
    }
}

async function fetchProposalVotesPayload(proposalId) {
    if (proposalVotesCache.has(proposalId)) return proposalVotesCache.get(proposalId);

    const request = fetchJson(getProposalVotesApiUrl(proposalId));
    proposalVotesCache.set(proposalId, request);

    try {
        return await request;
    } catch (error) {
        proposalVotesCache.delete(proposalId);
        throw error;
    }
}

function mergeProposalVoteDetails(proposal, payload) {
    const detail = extractProposalVoteDetail(payload, proposal.proposal_id);
    if (!detail && !payload?.votes?.dreps) return proposal;

    const detailSummary = normalizeVotingSummary(
        detail?.voting_summary
        || detail?.vote_summary
        || detail?.summary
        || detail?.vote_percentages
        || detail?.votePercentages
        || detail
    );
    const voteListSummary = getVotingSummaryFromProposalVotesPayload(payload);
    const summary = hasStructuredVoteSummary(detailSummary)
        ? detailSummary
        : proposal.voteSummary || voteListSummary;

    const nextProposal = {
        ...proposal,
        hasLiveVotePercentages: Boolean(payload?.votes?.dreps),
        voteSummary: hasStructuredVoteSummary(summary) ? summary : proposal.voteSummary
    };
    nextProposal.voteDisplay = getVoteDisplayFromProposalSummary(nextProposal.voteSummary, nextProposal) || proposal.voteDisplay;
    nextProposal.votePercentages = nextProposal.voteDisplay?.percentages || proposal.votePercentages;
    return nextProposal;
}

function updateGovernanceCardVotes(proposalId, proposal) {
    if (!proposalId || !proposal?.votePercentages) return;

    const card = document.querySelector(`.governance-card[data-proposal-id="${CSS.escape(proposalId)}"]`);
    const votes = card?.querySelector('.governance-votes');
    if (!votes) return;

    votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source)}`;
    votes.textContent = formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source);
}

function getVotingSummaryFromProposalVotesPayload(payload) {
    const dreps = payload?.votes?.dreps;
    if (!dreps || typeof dreps !== 'object') return null;

    const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
        ? payload.drep_info
        : {};
    const getBucket = key => Array.isArray(dreps[key]) ? dreps[key] : [];
    const getVotePower = vote => {
        const info = drepInfo[vote?.voter_id]
            || drepInfo[vote?.drep_id]
            || drepInfo[vote?.voter_hex]
            || drepInfo[vote?.hex]
            || null;
        const value = vote?.amount
            ?? vote?.vote_power
            ?? vote?.voting_power
            ?? vote?.stake
            ?? vote?.lovelace
            ?? info?.amount
            ?? info?.vote_power
            ?? info?.voting_power
            ?? info?.stake
            ?? info?.lovelace;
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : 0;
    };

    const yesVotes = getBucket('yes');
    const noVotes = getBucket('no');
    const abstainVotes = getBucket('abstain');
    const yesPower = yesVotes.reduce((sum, vote) => sum + getVotePower(vote), 0);
    const noPower = noVotes.reduce((sum, vote) => sum + getVotePower(vote), 0);
    const abstainPower = abstainVotes.reduce((sum, vote) => sum + getVotePower(vote), 0);
    const yesNoPower = yesPower + noPower;
    const percentageBase = yesNoPower;

    return {
        drep_yes_votes_cast: yesVotes.length,
        drep_no_votes_cast: noVotes.length,
        drep_abstain_votes_cast: abstainVotes.length,
        drep_active_yes_vote_power: yesPower,
        drep_yes_vote_power: yesPower,
        drep_active_no_vote_power: noPower,
        drep_no_vote_power: noPower,
        drep_active_abstain_vote_power: abstainPower,
        drep_yes_pct: percentageBase > 0 ? (yesPower / percentageBase) * 100 : 0,
        drep_no_pct: percentageBase > 0 ? (noPower / percentageBase) * 100 : 0,
        drep_abstain_pct: 0
    };
}

function extractProposalVoteDetail(payload, proposalId) {
    if (!payload) return null;

    if (Array.isArray(payload)) {
        return payload.find(item => matchesProposalId(item, proposalId)) || payload[0] || null;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.find(item => matchesProposalId(item, proposalId)) || payload.data[0] || null;
    }

    if (payload?.proposal || payload?.voting_summary || payload?.vote_summary || payload?.summary) {
        return payload;
    }

    return null;
}

function matchesProposalId(item, proposalId) {
    const itemProposalId = item?.proposal_id
        || item?.proposal?.proposal_id
        || item?.id
        || item?.proposalId;
    return itemProposalId === proposalId;
}

function renderVoteDetailsPanel(container, proposal, payload) {
    container.textContent = '';

    const summary = proposal?.voteSummary;
    const drepVotes = getDrepVotes(payload);
    const notVotedDreps = getNotVotedDreps(payload, drepVotes);
    const drepBreakdown = getDrepStakeBreakdown(summary, notVotedDreps);

    if (drepBreakdown.length) {
        container.appendChild(createDrepVoteChartSection(drepBreakdown, drepVotes));
    }

    const spoVoteSection = createSpoVoteSummarySection(summary, getSpoVotes(payload));
    if (spoVoteSection) {
        container.appendChild(spoVoteSection);
    }
}

function createSpoVoteSummarySection(summary, spoVotes = []) {
    if (!summary) return null;

    const yesPower = Number(summary.pool_yes_vote_power) || 0;
    const noPower = Number(summary.pool_no_vote_power) || 0;
    const abstainPower = Number(
        summary.pool_active_abstain_vote_power
        ?? summary.pool_abstain_vote_power
    ) || 0;
    const hasSpoVoteList = spoVotes.length > 0;
    const votesByChoice = {
        yes: spoVotes.filter(vote => String(vote?.vote || '').toLowerCase() === 'yes'),
        no: spoVotes.filter(vote => String(vote?.vote || '').toLowerCase() === 'no'),
        abstain: spoVotes.filter(vote => String(vote?.vote || '').toLowerCase() === 'abstain')
    };
    const yesCount = hasSpoVoteList ? votesByChoice.yes.length : Number(summary.pool_yes_votes_cast) || 0;
    const noCount = hasSpoVoteList ? votesByChoice.no.length : Number(summary.pool_no_votes_cast) || 0;
    const abstainCount = hasSpoVoteList ? votesByChoice.abstain.length : Number(summary.pool_abstain_votes_cast) || 0;

    if (!(yesPower || noPower || abstainPower || yesCount || noCount || abstainCount)) {
        return null;
    }

    const countedPower = yesPower + noPower;
    const countedVotes = yesCount + noCount;
    const items = [
        {
            key: 'yes',
            label: 'Yes',
            color: '#34d399',
            count: yesCount,
            value: yesPower,
            votes: votesByChoice.yes,
            votePowerPercentage: countedPower > 0
                ? (yesPower / countedPower) * 100
                : countedVotes > 0 ? (yesCount / countedVotes) * 100 : null
        },
        {
            key: 'no',
            label: 'No',
            color: '#f87171',
            count: noCount,
            value: noPower,
            votes: votesByChoice.no,
            votePowerPercentage: countedPower > 0
                ? (noPower / countedPower) * 100
                : countedVotes > 0 ? (noCount / countedVotes) * 100 : null
        },
        {
            key: 'abstain',
            label: 'Abstain',
            color: '#60a5fa',
            count: abstainCount,
            value: 0,
            displayValue: abstainPower,
            votes: votesByChoice.abstain,
            excludedFromPercentage: true
        }
    ];

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-spo-vote-summary';

    const title = document.createElement('strong');
    title.textContent = 'SPO vote overview';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    const chartItems = countedPower > 0
        ? items
        : items.map(item => ({
            ...item,
            value: item.excludedFromPercentage ? 0 : item.count,
            unit: 'votes'
        }));
    layout.appendChild(createVotePieChart(chartItems));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    items.forEach(item => {
        legend.appendChild(createGovernanceStatBox({
            label: item.label,
            detail: formatVoteLegendDetail(item, []),
            color: item.color,
            onClick: event => openSpoVotesOverlay(item, event.currentTarget)
        }));
    });

    layout.appendChild(legend);
    section.append(title, layout);
    return section;
}

function openSpoVotesOverlay(item, returnFocus) {
    closeSpoVotesOverlay();

    const votes = Array.isArray(item?.votes) ? item.votes : [];
    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    renderSpoVotesList(panel, votes, item.label);

    createGovernanceMenuOverlay({
        id: 'governance-spo-votes-overlay',
        titleId: 'governance-spo-votes-title',
        titleText: `SPO ${item.label} votes`,
        closeLabel: `Close SPO ${item.label} votes`,
        closeOverlay: closeSpoVotesOverlay,
        bodyNodes: [panel],
        headerMeta: `${votes.length.toLocaleString('en-US')} SPOs`,
        overlayClass: 'governance-nested-overlay',
        returnFocus
    });
}

function closeSpoVotesOverlay() {
    removeGovernanceMenuOverlay('governance-spo-votes-overlay');
}

function renderSpoVotesList(container, votes, voteLabel) {
    if (!votes.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = `No SPO ${voteLabel.toLowerCase()} votes found.`;
        container.appendChild(message);
        return;
    }

    const sortedVotes = [...votes].sort((left, right) => (
        getSpoVoteIdentifier(left).localeCompare(getSpoVoteIdentifier(right))
    ));

    const fragment = document.createDocumentFragment();
    sortedVotes.forEach((vote, index) => {
        const poolId = getSpoVoteIdentifier(vote);
        const row = document.createElement('div');
        row.className = 'governance-cc-member governance-menu-card';

        const number = document.createElement('strong');
        number.textContent = String(index + 1);

        const copy = document.createElement('div');
        copy.className = 'governance-drep-member-copy';

        const name = document.createElement('span');
        name.className = 'governance-cc-member-hash';
        name.textContent = getSpoVoteDisplayName(vote);

        const choice = document.createElement('span');
        choice.className = 'governance-cc-member-meta';
        choice.textContent = `Voted ${formatVoteChoice(vote?.vote)}`;

        const poolDetails = document.createElement('span');
        poolDetails.className = 'governance-cc-member-stats';
        poolDetails.textContent = getSpoVoteDetails(vote);

        const idLine = document.createElement('div');
        idLine.className = 'governance-drep-id-line';

        const id = document.createElement('span');
        id.className = 'governance-cc-member-meta governance-drep-id';
        id.textContent = poolId || 'Unknown pool';

        idLine.appendChild(id);
        if (poolId) idLine.appendChild(createGovernanceCopyButton(poolId, 'pool ID'));

        copy.append(name, choice);
        if (poolDetails.textContent) copy.appendChild(poolDetails);
        copy.appendChild(idLine);
        row.append(number, copy);
        fragment.appendChild(row);
    });

    container.appendChild(fragment);
}

function getSpoVoteDisplayName(vote) {
    const ticker = firstNonEmptyText(vote?.ticker, vote?.pool_ticker, vote?.poolTicker);
    const name = firstNonEmptyText(vote?.pool_name, vote?.poolName, vote?.name) || 'No Name';
    return ticker ? `${ticker} - ${name}` : name;
}

function getSpoVoteDetails(vote) {
    const status = firstNonEmptyText(vote?.pool_status, vote?.poolStatus);
    const activeStake = Number(vote?.active_stake ?? vote?.activeStake);
    return [
        status ? `Status: ${status}` : null,
        Number.isFinite(activeStake) && activeStake > 0
            ? `Active stake: ${formatCompactAdaFromLovelace(activeStake)}`
            : null
    ].filter(Boolean).join(' • ');
}

function getSpoVoteIdentifier(vote) {
    return firstNonEmptyText(
        vote?.voter_id,
        vote?.voterId,
        vote?.pool_id,
        vote?.poolId,
        vote?.voter_hex,
        vote?.id
    );
}

function createDrepVoteChartSection(breakdown, drepVotes) {
    const section = document.createElement('section');
    section.className = 'governance-vote-chart';

    const title = document.createElement('strong');
    title.textContent = 'DRep vote overview';
    section.appendChild(title);

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    layout.appendChild(createVotePieChart(breakdown));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';

    breakdown.forEach(item => {
        legend.appendChild(createVoteLegendItem(item, drepVotes));
    });

    layout.appendChild(legend);
    section.appendChild(layout);

    return section;
}

function createVotePieChart(breakdown) {
    const chart = document.createElement('div');
    chart.className = 'governance-pie-chart';
    const segments = getPieChartSegments(breakdown);
    chart.style.background = buildPieChartGradient(segments);

    const total = breakdown.reduce((sum, item) => sum + item.value, 0);
    const usesVoteCounts = breakdown.some(item => item.unit === 'votes');
    const center = document.createElement('div');
    center.className = 'governance-pie-chart-center';

    const centerLabel = document.createElement('span');
    centerLabel.textContent = usesVoteCounts ? 'Votes counted' : 'Total voting power';

    const centerValue = document.createElement('strong');
    centerValue.textContent = usesVoteCounts
        ? formatInteger(total)
        : formatCompactAdaFromLovelace(total, { fixedFractionDigits: 2 });

    center.append(centerLabel, centerValue);
    chart.appendChild(center);

    segments.forEach(segment => {
        const label = createPieAmountLabel(segment);
        if (label) chart.appendChild(label);
    });

    return chart;
}

function createVoteLegendItem(item, drepVotes) {
    const interactive = ['no', 'not-voted', 'abstain', 'always-abstain', 'always-no-confidence', 'yes'].includes(item.key);
    const element = createGovernanceStatBox({
        label: item.label,
        detail: formatVoteLegendDetail(item, drepVotes),
        color: item.color,
        statusClass: item.key === 'not-voted' ? 'is-not-voted' : '',
        onClick: interactive ? () => openDrepVotesOverlay(item, drepVotes) : null
    });
    if (interactive) {
        element.dataset.voteGroup = item.key;
    }
    return element;
}

function createGovernanceStatBox({ label, detail, color, statusClass = '', onClick = null }) {
    const element = document.createElement(onClick ? 'button' : 'div');
    element.className = `governance-vote-legend-item governance-stat-box${onClick ? ' is-clickable' : ''}${statusClass ? ` ${statusClass}` : ''}`;
    if (onClick) {
        element.type = 'button';
        element.setAttribute('aria-haspopup', 'dialog');
        element.addEventListener('click', onClick);
    }

    const swatch = document.createElement('span');
    swatch.className = 'governance-vote-swatch';
    swatch.style.backgroundColor = color;

    const text = document.createElement('span');
    text.className = 'governance-vote-legend-copy';

    const labelElement = document.createElement('strong');
    labelElement.textContent = label;

    const value = document.createElement('span');
    value.textContent = detail;

    text.appendChild(labelElement);
    text.appendChild(value);
    element.appendChild(swatch);
    element.appendChild(text);
    return element;
}

function formatVoteLegendDetail(item, drepVotes) {
    return [
        Number.isFinite(item.count) ? `${item.count} votes` : null,
        formatCompactAdaFromLovelace(item.displayValue ?? item.value),
        Number.isFinite(item.voteCountPercentage) ? formatPercentage(item.voteCountPercentage) : null,
        Number.isFinite(item.votePowerPercentage) ? formatPercentage(item.votePowerPercentage) : null,
        item.excludedFromPercentage ? 'not counted' : null
    ].filter(Boolean).join(' • ');
}

function renderDrepDetailsPanel(container, item, drepVotes) {
    container.textContent = '';
    container.hidden = false;
    container.dataset.activeGroup = item.key;

    if (item.key === 'not-voted') {
        renderNoVotesList(container, item.votes || [], item.label);
        return;
    }

    if (item.key === 'always-abstain' || item.key === 'always-no-confidence') {
        const title = document.createElement('strong');
        title.textContent = item.label;

        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'This API only provides stake totals for this bucket, not individual DRep IDs.';

        container.appendChild(title);
        container.appendChild(message);
        return;
    }

    const votes = drepVotes.filter(vote => String(vote?.vote || '').toLowerCase() === mapBreakdownKeyToVote(item.key));
    renderNoVotesList(container, votes, item.label);
}

function openDrepVotesOverlay(item, drepVotes) {
    closeDrepVotesOverlay();

    const panel = document.createElement('div');
    panel.className = 'governance-no-votes governance-no-votes-expanded';
    renderDrepDetailsPanel(panel, item, drepVotes);

    createGovernanceMenuOverlay({
        id: 'governance-drep-overlay',
        titleId: 'governance-drep-title',
        titleText: item.label,
        closeLabel: 'Close DRep list',
        closeOverlay: closeDrepVotesOverlay,
        bodyNodes: [panel],
        headerMeta: `${Number.isFinite(Number(item.count)) ? Number(item.count).toLocaleString('en-US') : 0} entries`,
        overlayClass: 'governance-nested-overlay'
    });
}

function closeDrepVotesOverlay() {
    removeGovernanceMenuOverlay('governance-drep-overlay');
}

function openDrepDirectoryOverlay() {
    closeDrepDirectoryOverlay();

    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading DRep data...';
    panel.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-drep-directory-overlay',
        titleId: 'governance-drep-directory-title',
        titleText: 'DReps',
        closeLabel: 'Close DRep directory',
        closeOverlay: closeDrepDirectoryOverlay,
        bodyNodes: [panel],
        headerMeta: 'Loading DReps…'
    });

    loadDrepDirectoryOverlay(panel).catch(() => {
        if (!panel.isConnected) return;
        panel.textContent = '';
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'DRep data could not be loaded.';
        panel.appendChild(message);
    });
}

function closeDrepDirectoryOverlay() {
    closeDrepStatusListOverlay();
    closeDrepActionHistoryOverlay();
    removeGovernanceMenuOverlay('governance-drep-directory-overlay');
}

async function loadDrepDirectoryOverlay(container) {
    const [infoPayload, directory] = await Promise.all([
        fetchDrepInfoPayload(),
        loadDrepDirectory()
    ]);
    if (!container.isConnected) return;

    const uniqueDreps = new Map();
    unwrapDrepEntries(infoPayload).forEach(entry => {
        const identifiers = getDrepEntryIdentifiers(entry);
        const primaryIdentifier = identifiers[0];
        if (!primaryIdentifier || uniqueDreps.has(primaryIdentifier)) return;
        const name = identifiers
            .map(identifier => directory.get(identifier) || directory.get(shortenDrepIdentifier(identifier)))
            .find(Boolean) || extractDrepNameFromEntry(entry) || primaryIdentifier;
        uniqueDreps.set(primaryIdentifier, {
            id: primaryIdentifier,
            name,
            votingPower: getDrepEntryVotingPower(entry),
            active: entry?.active === true
        });
    });

    const dreps = Array.from(uniqueDreps.values())
        .sort((left, right) => right.votingPower - left.votingPower || left.name.localeCompare(right.name));
    updateGovernanceMenuHeaderMeta(
        'governance-drep-directory-overlay',
        `${dreps.length.toLocaleString('en-US')} DReps`
    );
    renderDrepDirectory(container, dreps);
}

function renderDrepDirectory(container, dreps, options = {}) {
    container.textContent = '';
    if (!dreps.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No DRep data available.';
        container.appendChild(message);
        return;
    }

    if (options.showChart !== false) {
        container.appendChild(createDrepDirectoryStatusChart(dreps));
    }

    const fragment = document.createDocumentFragment();
    dreps.forEach((drep, index) => {
        const row = document.createElement('div');
        row.className = 'governance-cc-member governance-menu-card';

        const number = document.createElement('strong');
        number.textContent = String(index + 1);

        const copy = document.createElement('div');
        copy.className = 'governance-drep-member-copy';
        const name = document.createElement('span');
        name.className = 'governance-cc-member-hash';
        name.textContent = drep.name;

        const power = document.createElement('span');
        power.className = 'governance-cc-member-stats';
        power.textContent = `Voting power: ${formatCompactAdaFromLovelace(drep.votingPower)}`;

        const status = document.createElement('span');
        status.className = 'governance-cc-member-meta governance-drep-member-status';
        status.textContent = drep.active ? 'Active' : 'Inactive';
        row.classList.add(drep.active ? 'governance-drep-member--active' : 'governance-drep-member--inactive');

        const idLine = document.createElement('div');
        idLine.className = 'governance-drep-id-line';

        const id = document.createElement('span');
        id.className = 'governance-cc-member-meta governance-drep-id';
        id.textContent = drep.id;

        const copyId = createGovernanceCopyButton(drep.id, 'DRep ID');
        idLine.appendChild(id);
        idLine.appendChild(copyId);

        copy.appendChild(name);
        copy.appendChild(power);
        copy.appendChild(status);
        copy.appendChild(idLine);
        row.appendChild(number);
        row.appendChild(copy);
        row.classList.add('governance-cc-member-clickable');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Show votes by ${drep.name}`);
        bindGovernanceMenuTrigger(row, () => openDrepActionHistoryOverlay(drep));
        fragment.appendChild(row);
    });
    container.appendChild(fragment);
}

function createDrepDirectoryStatusChart(dreps) {
    const activeDreps = dreps.filter(drep => drep.active);
    const inactiveDreps = dreps.filter(drep => !drep.active);
    const groups = [
        {
            key: 'active',
            label: 'Active',
            color: '#34d399',
            dreps: activeDreps,
            value: activeDreps.reduce((sum, drep) => sum + drep.votingPower, 0)
        },
        {
            key: 'inactive',
            label: 'Inactive',
            color: '#fb7185',
            dreps: inactiveDreps,
            value: inactiveDreps.reduce((sum, drep) => sum + drep.votingPower, 0)
        }
    ];
    const totalPower = groups.reduce((sum, group) => sum + group.value, 0);
    const segments = getPieChartSegments(groups);

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-drep-status-chart';

    const title = document.createElement('strong');
    title.textContent = 'DRep Status';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    const chart = document.createElement('div');
    chart.className = 'governance-pie-chart';
    chart.style.background = buildPieChartGradient(segments);

    const center = document.createElement('div');
    center.className = 'governance-pie-chart-center';
    const centerLabel = document.createElement('span');
    centerLabel.textContent = 'Total voting power';
    const centerValue = document.createElement('strong');
    centerValue.textContent = formatCompactAdaFromLovelace(totalPower, { fixedFractionDigits: 2 });
    center.append(centerLabel, centerValue);
    chart.appendChild(center);

    segments.forEach(segment => {
        const label = createDrepDirectoryPowerLabel(segment);
        if (label) chart.appendChild(label);
    });

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        legend.appendChild(createDrepDirectoryLegendItem(group, totalPower));
    });

    layout.appendChild(chart);
    layout.appendChild(legend);
    section.appendChild(title);
    section.appendChild(layout);
    return section;
}

function createDrepDirectoryPowerLabel(segment) {
    if (!segment.value) return null;

    const label = document.createElement('span');
    label.className = 'governance-pie-label';
    label.textContent = formatCompactAdaFromLovelace(segment.value);

    const radians = ((segment.mid - 90) * Math.PI) / 180;
    const radius = segment.end - segment.start < 18 ? 57 : 48;
    label.style.left = `${50 + Math.cos(radians) * radius}%`;
    label.style.top = `${50 + Math.sin(radians) * radius}%`;
    return label;
}

function createDrepDirectoryLegendItem(group, totalPower) {
    const percentage = totalPower > 0 ? (group.value / totalPower) * 100 : 0;
    return createGovernanceStatBox({
        label: group.label,
        detail: `${group.dreps.length.toLocaleString('en-US')} DReps • ${formatCompactAdaFromLovelace(group.value)} • ${formatPercentage(percentage)}`,
        color: group.color,
        onClick: event => openDrepStatusListOverlay(
            `${group.label} DReps`,
            group.dreps,
            event.currentTarget
        )
    });
}

function openDrepStatusListOverlay(titleText, dreps, returnFocus) {
    closeDrepStatusListOverlay();

    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    renderDrepDirectory(panel, dreps, { showChart: false });

    createGovernanceMenuOverlay({
        id: 'governance-drep-status-overlay',
        titleId: 'governance-drep-status-title',
        titleText,
        closeLabel: `Close ${titleText}`,
        closeOverlay: closeDrepStatusListOverlay,
        bodyNodes: [panel],
        headerMeta: `${dreps.length.toLocaleString('en-US')} DReps`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus
    });
}

function closeDrepStatusListOverlay() {
    removeGovernanceMenuOverlay('governance-drep-status-overlay');
}

function createGovernanceCopyButton(value, label) {
    const button = document.createElement('button');
    button.className = 'pool-copy-icon-button governance-drep-copy-button';
    button.type = 'button';
    button.textContent = '⧉';
    button.setAttribute('aria-label', `Copy ${label}`);
    button.title = `Copy ${label}`;
    button.addEventListener('keydown', event => event.stopPropagation());
    button.addEventListener('click', async event => {
        event.stopPropagation();
        const originalLabel = button.textContent;
        const originalAriaLabel = button.getAttribute('aria-label') || '';

        try {
            await copyGovernanceText(value);
            button.textContent = 'Copied';
            button.setAttribute('aria-label', `Copied ${label}`);
        } catch {
            button.textContent = 'Copy failed';
        }

        setTimeout(() => {
            button.textContent = originalLabel;
            button.setAttribute('aria-label', originalAriaLabel);
        }, 1400);
    });
    return button;
}

async function copyGovernanceText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
}

function openDrepActionHistoryOverlay(drep) {
    closeDrepActionHistoryOverlay();

    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading DRep votes...';
    panel.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-drep-actions-overlay',
        titleId: 'governance-drep-actions-title',
        titleText: drep.name,
        closeLabel: `Close votes by ${drep.name}`,
        closeOverlay: closeDrepActionHistoryOverlay,
        bodyNodes: [panel],
        headerMeta: 'Loading actions…',
        overlayClass: 'governance-action-detail-overlay'
    });

    fetchJson(getDrepDetailApiUrl(drep.id))
        .then(payload => renderDrepActionHistory(panel, payload))
        .catch(() => {
            if (!panel.isConnected) return;
            panel.textContent = '';
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'DRep votes could not be loaded.';
            panel.appendChild(message);
        });
}

function closeDrepActionHistoryOverlay() {
    removeGovernanceMenuOverlay('governance-drep-actions-overlay');
}

function renderDrepActionHistory(container, payload) {
    if (!container.isConnected) return;
    container.textContent = '';
    const voteStats = payload?.vote_stats || {};
    const actionsById = new Map((Array.isArray(voteStats.actions) ? voteStats.actions : [])
        .map(action => [String(action?.proposal_id || ''), action]));
    const registrationTime = Number(voteStats.registration_time);
    const proposals = getGovernanceActionsForCommitteeOverview();
    const rows = proposals
        .filter(proposal => isGovernanceActionApplicableToDrep(proposal, registrationTime))
        .map(proposal => ({ action: actionsById.get(String(proposal.proposal_id || '')) || null, proposal }))
        .sort((left, right) => (Number(right.proposal.block_time) || 0) - (Number(left.proposal.block_time) || 0));
    updateGovernanceMenuHeaderMeta(
        'governance-drep-actions-overlay',
        `${rows.length.toLocaleString('en-US')} actions`
    );
    const closedRows = rows.filter(row => isExpiredGovernanceActionForCommitteeStats(row.proposal));
    const voted = closedRows.filter(row => row.action).length;
    const notVoted = Math.max(closedRows.length - voted, 0);
    const active = Math.max(rows.length - closedRows.length, 0);
    const notVotedProposals = closedRows.filter(row => !row.action).map(row => row.proposal);
    const votedProposals = closedRows.filter(row => row.action).map(row => row.proposal);
    const activeProposals = rows
        .filter(row => !isExpiredGovernanceActionForCommitteeStats(row.proposal))
        .map(row => row.proposal);
    const notApplicableProposals = proposals
        .filter(proposal => !isGovernanceActionApplicableToDrep(proposal, registrationTime));
    const notApplicable = notApplicableProposals.length;

    container.appendChild(createDrepActionHistoryChart({
        voted,
        notVoted,
        active,
        notApplicable,
        votedProposals,
        notVotedProposals,
        activeProposals,
        notApplicableProposals,
        total: proposals.length
    }));

    if (!rows.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No applicable governance actions found for this DRep.';
        container.appendChild(message);
        return;
    }

    rows.forEach(({ action, proposal }) => {
        const card = createGovernanceCard(proposal, {
            onClick: event => openGovernanceOverlay(proposal, { returnFocus: event.currentTarget })
        });
        const vote = document.createElement('span');
        const voteChoice = action ? formatVoteChoice(action?.vote || action?.vote_bucket) : null;
        const isClosed = isExpiredGovernanceActionForCommitteeStats(proposal);
        vote.className = `governance-votes ${voteChoice === 'Yes'
            ? 'vote-green'
            : voteChoice === 'No' || (!voteChoice && isClosed)
                ? 'vote-red'
                : 'vote-neutral'}`;
        vote.textContent = voteChoice
            ? `DRep voted ${voteChoice}`
            : isClosed
                ? 'DRep not voted'
                : 'DRep not voted yet';
        card.appendChild(vote);
        container.appendChild(card);
    });
}

function isGovernanceActionApplicableToDrep(proposal, registrationTime) {
    if (!Number.isFinite(registrationTime)) return true;
    const blockTime = Number(proposal?.block_time);
    return !Number.isFinite(blockTime) || blockTime >= registrationTime;
}

function createDrepActionHistoryChart(stats) {
    const {
        voted,
        notVoted,
        active,
        notApplicable,
        votedProposals,
        notVotedProposals,
        activeProposals,
        notApplicableProposals,
        total
    } = stats;
    const closedTotal = voted + notVoted;
    const votedPct = closedTotal > 0 ? (voted / closedTotal) * 100 : 0;
    const notVotedPct = closedTotal > 0 ? (notVoted / closedTotal) * 100 : 0;
    const container = document.createElement('div');
    container.className = 'governance-drep-history-chart';

    renderConstitutionalCommitteeVoteTotalsChart(container, {
        voted,
        notVoted,
        total: closedTotal,
        votedPct,
        notVotedPct
    }, {
        title: 'Voting Stats',
        totalLabel: `${total} total actions`,
        stackLegend: true,
        prependLegendItems: [{
            label: 'Active',
            detail: `${active} actions`,
            color: '#60a5fa',
            onClick: event => openGovernanceStatusActionsOverlay(
                'DRep Active',
                activeProposals,
                event.currentTarget
            )
        }],
        onVotedClick: event => openGovernanceStatusActionsOverlay(
            'DRep Voted',
            votedProposals,
            event.currentTarget
        ),
        onNotVotedClick: event => openGovernanceStatusActionsOverlay(
            'DRep Not Voted',
            notVotedProposals,
            event.currentTarget
        ),
        extraLegendItems: [{
            label: 'Not Applicable',
            detail: `${notApplicable} actions`,
            color: '#94a3b8',
            onClick: event => openGovernanceStatusActionsOverlay(
                'DRep Not Applicable',
                notApplicableProposals,
                event.currentTarget
            )
        }]
    });
    return container;
}

function openConstitutionalCommitteeOverlay() {
    closeConstitutionalCommitteeOverlay();

    const members = getConstitutionalCommitteeMembers(committeeInfoState || governanceState);
    const panel = document.createElement('div');
    panel.className = 'governance-cc-members';
    renderConstitutionalCommitteeMembers(panel, members, members.length ? null : 'Loading Constitutional Committee members...');

    const chartPanel = document.createElement('div');
    chartPanel.className = 'governance-cc-quorum-chart';
    chartPanel.dataset.ccQuorumChart = 'true';
    renderConstitutionalCommitteeQuorumChart(chartPanel, committeeInfoState || governanceState);

    createGovernanceMenuOverlay({
        id: 'governance-cc-overlay',
        titleId: 'governance-cc-title',
        titleText: 'Constitutional Committee Members',
        closeLabel: 'Close Constitutional Committee members',
        closeOverlay: closeConstitutionalCommitteeOverlay,
        bodyNodes: [chartPanel, panel],
        headerMeta: `${members.length.toLocaleString('en-US')} members`
    });
    fetchCommitteeInfoPayload()
        .then(payload => {
            if (!panel.isConnected) return;
            renderConstitutionalCommitteeQuorumChart(chartPanel, payload);
            const fetchedMembers = getConstitutionalCommitteeMembers(payload);
            updateGovernanceMenuHeaderMeta(
                'governance-cc-overlay',
                `${fetchedMembers.length.toLocaleString('en-US')} members`
            );
            if (
                getConstitutionalCommitteeMembersSignature(fetchedMembers) === getConstitutionalCommitteeMembersSignature(members)
                && hasConstitutionalCommitteeBackendStats(members)
            ) return;
            renderConstitutionalCommitteeMembers(panel, fetchedMembers);
        })
        .catch(() => {
            if (!panel.isConnected || members.length) return;
            renderConstitutionalCommitteeMembers(panel, [], 'Constitutional Committee members could not be loaded.');
        });
}

function closeConstitutionalCommitteeOverlay() {
    closeConstitutionalCommitteeActionsOverlay();
    removeGovernanceMenuOverlay('governance-cc-overlay');
}

function renderConstitutionalCommitteeMembers(container, members, emptyMessage = null) {
    container.textContent = '';

    if (!members.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = emptyMessage || 'Constitutional Committee members could not be loaded.';
        container.appendChild(message);
        return;
    }

    const enrichedMembers = enrichConstitutionalCommitteeMembersWithSinceEpoch(members, governanceState);

    enrichedMembers.forEach((member, index) => {
        const row = document.createElement('div');
        row.className = 'governance-cc-member governance-menu-card';

        const number = document.createElement('strong');
        number.textContent = String(index + 1);

        const copy = document.createElement('div');
        const hash = document.createElement('span');
        hash.className = 'governance-cc-member-hash';
        hash.textContent = member.name || `CC Member ${index + 1}`;

        const meta = document.createElement('span');
        meta.className = 'governance-cc-member-meta';
        meta.textContent = [
            member.expiresEpoch ? `expires epoch ${member.expiresEpoch}` : ''
        ].filter(Boolean).join(' • ');
        const stats = document.createElement('span');
        stats.className = 'governance-cc-member-stats';
        stats.dataset.ccMemberIndex = String(index);
        stats.textContent = 'Voting stats loading...';

        copy.appendChild(hash);
        copy.appendChild(meta);
        copy.appendChild(stats);
        row.appendChild(number);
        row.appendChild(copy);
        row.classList.add('governance-cc-member-clickable');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Show governance actions for ${member.name || `CC Member ${index + 1}`}`);
        bindGovernanceMenuTrigger(row, () => openConstitutionalCommitteeActionsOverlay(member));
        container.appendChild(row);
    });

    loadConstitutionalCommitteeMemberSummaryStats(enrichedMembers, container).catch(() => {
        container.querySelectorAll('.governance-cc-member-stats').forEach(element => {
            element.textContent = 'Voting stats unavailable';
        });
    });
}

function openConstitutionalCommitteeActionsOverlay(member) {
    closeConstitutionalCommitteeActionsOverlay();

    const panel = document.createElement('div');
    panel.className = 'governance-cc-actions';
    renderConstitutionalCommitteeActionShell(panel, member);

    createGovernanceMenuOverlay({
        id: 'governance-cc-actions-overlay',
        titleId: 'governance-cc-actions-title',
        titleText: member.name || 'Constitutional Committee Member',
        closeLabel: 'Close Constitutional Committee voting overview',
        closeOverlay: closeConstitutionalCommitteeActionsOverlay,
        bodyNodes: [panel],
        headerMeta: `${getGovernanceActionsForCommitteeMember(member).length.toLocaleString('en-US')} actions`
    });

    if (hasConstitutionalCommitteeBackendActionStats(member)) {
        renderConstitutionalCommitteeBackendActionStats(member, panel);
        return;
    }

    loadConstitutionalCommitteeActionVotes(member, panel).catch(() => {
        if (!panel.isConnected) return;
        panel.textContent = '';
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Governance action votes could not be loaded.';
        panel.appendChild(message);
    });
}

function closeConstitutionalCommitteeActionsOverlay() {
    removeGovernanceMenuOverlay('governance-cc-actions-overlay');
}

function getGovernanceActionsForCommitteeOverview() {
    return getGovernanceProposalsFromDashboardPayload(governanceState || {})
        .sort((a, b) => (Number(b.block_time) || 0) - (Number(a.block_time) || 0));
}

function getGovernanceActionsForCommitteeMember(member) {
    const sinceEpoch = Number(member?.sinceEpoch);
    return getGovernanceActionsForCommitteeOverview()
        .filter(proposal => isGovernanceActionInCommitteeMemberTerm(proposal, member));
}

function isGovernanceActionInCommitteeMemberTerm(proposal, member) {
    const sinceEpoch = Number(member?.sinceEpoch);
    const proposalEpoch = Number(proposal?.proposed_epoch);
    if (!Number.isFinite(proposalEpoch)) return true;
    if (Number.isFinite(sinceEpoch) && proposalEpoch < sinceEpoch) return false;

    const expiresEpoch = Number(member?.expiresEpoch);
    return !Number.isFinite(expiresEpoch) || proposalEpoch < expiresEpoch;
}

function getConstitutionalCommitteeMemberProposalStats(member) {
    const proposals = getGovernanceActionsForCommitteeMember(member);
    const applicable = proposals.filter(isConstitutionalCommitteeMemberVoteApplicable);
    const closed = applicable.filter(isExpiredGovernanceActionForCommitteeStats);

    return {
        total: proposals.length,
        applicable: closed.length,
        open: Math.max(applicable.length - closed.length, 0),
        notApplicable: Math.max(proposals.length - applicable.length, 0),
        closed
    };
}

function renderConstitutionalCommitteeActionLoading(container, complete, total) {
    container.textContent = '';
    const message = document.createElement('p');
    message.className = 'small-text';
    message.textContent = total > 0
        ? `Loading governance action votes ${complete}/${total}...`
        : 'No governance actions found.';
    container.appendChild(message);
}

async function loadConstitutionalCommitteeMemberSummaryStats(members, container) {
    if (hasConstitutionalCommitteeBackendActionStatsForMembers(members)) {
        updateConstitutionalCommitteeMemberSummaryStats(
            container,
            members.map(getConstitutionalCommitteeBackendMemberSummaryStats)
        );
        return;
    }

    const proposals = getGovernanceActionsForCommitteeOverview()
        .filter(isConstitutionalCommitteeMemberVoteApplicable)
        .filter(isExpiredGovernanceActionForCommitteeStats);
    const cacheKey = getConstitutionalCommitteeMemberStatsCacheKey(members, proposals);

    if (!proposals.length) {
        updateConstitutionalCommitteeMemberSummaryStats(container, members.map(member => {
            const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
            return {
                voted: 0,
                total: 0,
                open: proposalStats.open,
                notApplicable: proposalStats.notApplicable,
                all: proposalStats.total
            };
        }));
        return;
    }

    if (committeeMemberStatsCache.has(cacheKey)) {
        const cachedStats = await committeeMemberStatsCache.get(cacheKey);
        if (!container.isConnected) return;
        updateConstitutionalCommitteeMemberSummaryStats(container, cachedStats);
        return;
    }

    const statsPromise = calculateConstitutionalCommitteeMemberSummaryStats(members, proposals);
    committeeMemberStatsCache.set(cacheKey, statsPromise);
    const stats = await statsPromise;
    committeeMemberStatsCache.set(cacheKey, stats);
    if (!container.isConnected) return;
    updateConstitutionalCommitteeMemberSummaryStats(container, stats);
}

async function calculateConstitutionalCommitteeMemberSummaryStats(members, proposals) {
    const stats = members.map(member => {
        const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
        return {
            voted: 0,
            total: 0,
            open: proposalStats.open,
            notApplicable: proposalStats.notApplicable,
            all: proposalStats.total
        };
    });
    let nextIndex = 0;
    const workerCount = Math.min(4, proposals.length);

    async function worker() {
        while (nextIndex < proposals.length) {
            const proposal = proposals[nextIndex];
            nextIndex += 1;
            let payload = null;

            try {
                payload = await fetchProposalVotesPayload(proposal.proposal_id);
            } catch {
                payload = null;
            }

            members.forEach((member, memberIndex) => {
                if (!isGovernanceActionInCommitteeMemberTerm(proposal, member)) return;
                stats[memberIndex].total += 1;
                if (payload && findConstitutionalCommitteeVoteForMember(payload, member)) {
                    stats[memberIndex].voted += 1;
                }
            });
        }
    }

    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return stats;
}

function getConstitutionalCommitteeMemberStatsCacheKey(members, proposals) {
    const memberKey = getConstitutionalCommitteeMembersSignature(members);
    const proposalKey = proposals
        .map(proposal => [
            proposal?.proposal_id || '',
            proposal?.expiration || '',
            proposal?.expired_epoch || '',
            proposal?.dropped_epoch || '',
            proposal?.enacted_epoch || ''
        ].join(':'))
        .join('|');

    return `${memberKey}::${proposalKey}`;
}

function getConstitutionalCommitteeMembersSignature(members) {
    return (Array.isArray(members) ? members : [])
        .map(member => [
            member?.name || '',
            member?.expiresEpoch || '',
            member?.sinceEpoch || '',
            Array.from(getConstitutionalCommitteeVoteCandidateIds(member)).join(',')
        ].join(':'))
        .join('|');
}

function hasConstitutionalCommitteeBackendStats(members) {
    return Array.isArray(members) && members.length > 0 && members.every(member => (
        member?.voteStats
        && Number.isFinite(Number(member.voteStats.total))
        && Number.isFinite(Number(member.voteStats.voted))
    ));
}

function hasConstitutionalCommitteeBackendActionStats(member) {
    return Array.isArray(member?.voteStats?.actions) && member.voteStats.actions.length > 0;
}

function hasConstitutionalCommitteeBackendActionStatsForMembers(members) {
    return Array.isArray(members) && members.length > 0 && members.every(hasConstitutionalCommitteeBackendActionStats);
}

function getConstitutionalCommitteeBackendMemberSummaryStats(member) {
    const actionStatsById = new Map((member.voteStats?.actions || [])
        .map(action => [String(action.proposalId || action.proposal_id || ''), action]));
    const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
    const stats = {
        voted: 0,
        total: proposalStats.applicable,
        open: proposalStats.open,
        notApplicable: proposalStats.notApplicable,
        all: proposalStats.total
    };

    proposalStats.closed.forEach(proposal => {
        const actionStats = actionStatsById.get(String(proposal.proposal_id || ''));
        if (!actionStats) return;
        if (actionStats.voted) stats.voted += 1;
    });

    return stats;
}

function updateConstitutionalCommitteeMemberSummaryStats(container, stats) {
    stats.forEach((item, index) => {
        const element = container.querySelector(`.governance-cc-member-stats[data-cc-member-index="${index}"]`);
        if (!element) return;

        if (!item.total) {
            element.textContent = `No expired actions yet • Not applicable ${Number(item.notApplicable) || 0}`;
            return;
        }

        const votedPct = (item.voted / item.total) * 100;
        const notVotedPct = ((item.total - item.voted) / item.total) * 100;
        element.textContent = '';

        const voted = document.createElement('span');
        voted.textContent = `Voted ${formatPercentage(votedPct)}`;
        const separator = document.createElement('span');
        separator.className = 'governance-cc-member-stats-separator';
        separator.textContent = ' • ';
        const notVoted = document.createElement('span');
        notVoted.className = 'governance-cc-member-stats-missing';
        notVoted.textContent = `Not voted ${formatPercentage(notVotedPct)}`;
        const notApplicableSeparator = document.createElement('span');
        notApplicableSeparator.className = 'governance-cc-member-stats-separator';
        notApplicableSeparator.textContent = ' • ';
        const notApplicable = document.createElement('span');
        notApplicable.className = 'governance-cc-member-stats-not-applicable';
        notApplicable.textContent = `Not applicable ${Number(item.notApplicable) || 0}`;

        element.appendChild(voted);
        element.appendChild(separator);
        element.appendChild(notVoted);
        element.appendChild(notApplicableSeparator);
        element.appendChild(notApplicable);
    });
}

async function loadConstitutionalCommitteeActionVotes(member, container) {
    const proposals = getGovernanceActionsForCommitteeMember(member);
    if (!proposals.length) {
        renderConstitutionalCommitteeActionLoading(container, 0, 0);
        return;
    }

    const results = new Array(proposals.length);
    let nextIndex = 0;
    let completed = 0;
    const workerCount = Math.min(4, proposals.length);

    async function worker() {
        while (nextIndex < proposals.length) {
            const index = nextIndex;
            nextIndex += 1;
            const proposal = proposals[index];
            let vote = null;
            let error = null;

            try {
                const payload = await fetchProposalVotesPayload(proposal.proposal_id);
                vote = findConstitutionalCommitteeVoteForMember(payload, member);
            } catch (err) {
                error = err;
            }

            results[index] = { proposal, vote, error };
            completed += 1;
            if (container.isConnected) {
                updateConstitutionalCommitteeActionCard(container, proposal, vote, error);
            }
        }
    }

    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    if (!container.isConnected) return;
    updateConstitutionalCommitteeVoteChart(container, results.filter(Boolean), member);
}

function findConstitutionalCommitteeVoteForMember(payload, member) {
    const candidates = getConstitutionalCommitteeVoteCandidateIds(member);
    const committeeVotes = payload?.votes?.committee || {};

    for (const bucket of ['yes', 'no', 'abstain', 'unknown']) {
        const votes = Array.isArray(committeeVotes[bucket]) ? committeeVotes[bucket] : [];
        const vote = votes.find(item => {
            const voterIds = [item?.voter_id, item?.voter_hex, item?.cc_hot_id, item?.cc_hot_hex]
                .map(normalizeCommitteeVoteIdentifier)
                .filter(Boolean);
            return voterIds.some(id => candidates.has(id));
        });
        if (vote) return { ...vote, voteBucket: bucket };
    }

    return null;
}

function getConstitutionalCommitteeVoteCandidateIds(member) {
    return new Set([
        member?.hotId,
        member?.hotHex,
        member?.id
    ].map(normalizeCommitteeVoteIdentifier).filter(Boolean));
}

function normalizeCommitteeVoteIdentifier(value) {
    return String(value || '').trim().toLowerCase();
}

function renderConstitutionalCommitteeActionShell(container, member) {
    const proposals = getGovernanceActionsForCommitteeMember(member);
    container.textContent = '';

    if (!proposals.length) {
        renderConstitutionalCommitteeActionLoading(container, 0, 0);
        return;
    }

    const chartSlot = document.createElement('div');
    chartSlot.dataset.ccVoteChart = 'true';
    renderConstitutionalCommitteeVoteChartContent(chartSlot, [], true, member);
    container.appendChild(chartSlot);

    proposals.forEach(proposal => {
        container.appendChild(createConstitutionalCommitteeGovernanceCard(proposal));
    });
}

function renderConstitutionalCommitteeBackendActionStats(member, container) {
    const actionStatsById = new Map((member.voteStats?.actions || [])
        .map(action => [String(action.proposalId || action.proposal_id || ''), action]));
    const proposals = getGovernanceActionsForCommitteeMember(member);
    const results = [];

    proposals.forEach(proposal => {
        const actionStats = actionStatsById.get(String(proposal.proposal_id || ''));
        if (!actionStats) {
            updateConstitutionalCommitteeActionCardPending(container, proposal);
            return;
        }

        const vote = actionStats.voted
            ? {
                vote: actionStats.vote || actionStats.voteBucket || actionStats.vote_bucket,
                voteBucket: actionStats.voteBucket || actionStats.vote_bucket
            }
            : null;
        results.push({ proposal, vote, error: null });
        updateConstitutionalCommitteeActionCard(container, proposal, vote, null);
    });

    updateConstitutionalCommitteeVoteChart(container, results, member);
}

function updateConstitutionalCommitteeActionCardPending(container, proposal) {
    const card = findConstitutionalCommitteeActionCard(container, proposal?.proposal_id);
    if (!card) return;

    const status = card.querySelector('[data-cc-vote-status="true"]');
    if (!status) return;

    status.className = 'governance-votes vote-neutral';
    status.textContent = 'CC vote cache pending';
}

function createConstitutionalCommitteeGovernanceCard(proposal) {
    const card = createGovernanceCard(proposal, {
        onClick: event => {
            openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
        }
    });
    card.dataset.ccProposalId = proposal.proposal_id || '';

    const status = document.createElement('span');
    status.className = 'governance-votes vote-neutral';
    status.dataset.ccVoteStatus = 'true';
    status.textContent = getInitialConstitutionalCommitteeActionStatus(proposal);
    card.appendChild(status);

    return card;
}

function getInitialConstitutionalCommitteeActionStatus(proposal) {
    if (!isConstitutionalCommitteeMemberVoteApplicable(proposal)) return 'CC vote not applicable';
    return 'Checking CC vote...';
}

function updateConstitutionalCommitteeActionCard(container, proposal, vote, error) {
    const card = findConstitutionalCommitteeActionCard(container, proposal?.proposal_id);
    if (!card) return;

    const isExpiredForStats = isExpiredGovernanceActionForCommitteeStats(proposal);
    const isApplicable = isConstitutionalCommitteeMemberVoteApplicable(proposal);
    const status = card.querySelector('[data-cc-vote-status="true"]');
    if (!status) return;

    if (!isApplicable) {
        status.className = 'governance-votes vote-neutral';
        status.textContent = 'CC vote not applicable';
        return;
    }

    if (vote) {
        status.className = 'governance-votes vote-green';
        status.textContent = `CC voted ${formatVoteChoice(vote.vote || vote.voteBucket)}`;
        return;
    }

    if (error) {
        status.className = 'governance-votes vote-neutral';
        status.textContent = 'CC vote data unavailable';
        return;
    }

    if (isExpiredForStats) {
        status.className = 'governance-votes vote-red';
        status.textContent = 'CC not voted';
        return;
    }

    status.className = 'governance-votes vote-neutral';
    status.textContent = 'CC Member not voted yet';
}

function findConstitutionalCommitteeActionCard(container, proposalId) {
    return Array.from(container.querySelectorAll('[data-cc-proposal-id]'))
        .find(card => card.dataset.ccProposalId === String(proposalId || '')) || null;
}

function updateConstitutionalCommitteeVoteChart(container, results, member) {
    const chartSlot = container.querySelector('[data-cc-vote-chart="true"]');
    if (!chartSlot) return;
    renderConstitutionalCommitteeVoteChartContent(chartSlot, results, false, member);
}

function renderConstitutionalCommitteeVoteChartContent(container, results, isLoading = false, member = null) {
    const eligibleResults = results.filter(result => (
        isConstitutionalCommitteeMemberVoteApplicable(result.proposal)
        && isExpiredGovernanceActionForCommitteeStats(result.proposal)
    ));
    const voted = eligibleResults.filter(result => result.vote).length;
    const total = eligibleResults.length;
    const notVoted = Math.max(total - voted, 0);
    const votedPct = total > 0 ? (voted / total) * 100 : 0;
    const notVotedPct = total > 0 ? (notVoted / total) * 100 : 0;
    const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
    const votedProposals = eligibleResults
        .filter(result => result.vote)
        .map(result => result.proposal);
    const notVotedProposals = eligibleResults
        .filter(result => !result.vote)
        .map(result => result.proposal);
    const activeProposals = getGovernanceActionsForCommitteeMember(member)
        .filter(isConstitutionalCommitteeMemberVoteApplicable)
        .filter(proposal => !isExpiredGovernanceActionForCommitteeStats(proposal));
    const notApplicableProposals = getGovernanceActionsForCommitteeOverview()
        .filter(proposal => isGovernanceActionInCommitteeMemberTerm(proposal, member))
        .filter(proposal => !isConstitutionalCommitteeMemberVoteApplicable(proposal));

    renderConstitutionalCommitteeVoteTotalsChart(container, {
        voted,
        notVoted,
        total,
        votedPct,
        notVotedPct
    }, {
        isLoading,
        title: 'Voting Stats',
        loadingLabel: 'CC vote status',
        totalLabel: `${proposalStats.total} total actions`,
        stackLegend: true,
        prependLegendItems: [{
            label: 'Active',
            detail: `${proposalStats.open} actions`,
            color: '#60a5fa',
            onClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
                'CC Member Active',
                activeProposals,
                event.currentTarget
            )
        }],
        onVotedClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
            'CC Member Voted',
            votedProposals,
            event.currentTarget
        ),
        onNotVotedClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
            'CC Member Not Voted',
            notVotedProposals,
            event.currentTarget
        ),
        extraLegendItems: [
            {
                label: 'Not Applicable',
                detail: `${proposalStats.notApplicable} actions`,
                color: '#94a3b8',
                onClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
                    'CC Member Not Applicable',
                    notApplicableProposals,
                    event.currentTarget
                )
            }
        ]
    });
}

function renderConstitutionalCommitteeQuorumChart(container, payload) {
    const stats = getConstitutionalCommitteeQuorumStats(payload);
    renderConstitutionalCommitteeVoteTotalsChart(container, stats || {
        voted: 0,
        notVoted: 0,
        total: 0,
        closedTotal: 0,
        notApplicable: 0,
        votedPct: 0,
        notVotedPct: 0,
        votedProposals: [],
        notVotedProposals: [],
        notApplicableProposals: []
    }, {
        isLoading: !stats,
        title: 'Voting Stats',
        loadingLabel: 'CC quorum status',
        totalLabel: stats ? `${stats.total} applicable / ${stats.notApplicable} not applicable` : '',
        stackLegend: true,
        onVotedClick: stats ? event => openGovernanceStatusActionsOverlay(
            'CC Voted',
            stats.votedProposals,
            event.currentTarget
        ) : null,
        onNotVotedClick: stats ? event => openGovernanceStatusActionsOverlay(
            'CC Not Voted',
            stats.notVotedProposals,
            event.currentTarget
        ) : null,
        extraLegendItems: [{
            label: 'Not Applicable',
            detail: `${stats?.notApplicable || 0} actions`,
            color: '#94a3b8',
            onClick: stats ? event => openGovernanceStatusActionsOverlay(
                'CC Not Applicable',
                stats.notApplicableProposals,
                event.currentTarget
            ) : null
        }]
    });
}

function renderConstitutionalCommitteeVoteTotalsChart(container, stats, options = {}) {
    container.textContent = '';
    const { voted, notVoted, total, votedPct, notVotedPct } = stats;
    const isLoading = options.isLoading === true;

    const chart = document.createElement('section');
    chart.className = 'governance-vote-chart';

    const title = document.createElement('strong');
    title.textContent = options.title || 'CC vote overview';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    const donut = document.createElement('div');
    donut.className = 'governance-pie-chart';
    donut.style.background = isLoading
        ? 'var(--line)'
        : `conic-gradient(#34d399 0 ${votedPct}%, #fb7185 ${votedPct}% 100%)`;

    const center = document.createElement('div');
    center.className = 'governance-pie-chart-center';
    const count = document.createElement('strong');
    count.textContent = isLoading ? 'Loading' : `${formatPercentage(votedPct)} voted`;
    const label = document.createElement('span');
    label.textContent = isLoading ? options.loadingLabel || 'CC vote status' : options.totalLabel || `${voted} of ${total} actions`;
    center.appendChild(label);
    center.appendChild(count);
    donut.appendChild(center);

    const legend = document.createElement('div');
    legend.className = `governance-vote-legend ${options.stackLegend
        ? 'governance-vote-legend--stacked'
        : 'governance-vote-legend--inline'}`;
    (options.prependLegendItems || []).forEach(item => {
        legend.appendChild(createGovernanceStatBox({
            label: item.label,
            detail: item.detail,
            color: item.color,
            onClick: item.onClick
        }));
    });
    legend.appendChild(createConstitutionalCommitteeVoteLegendItem(
        'Voted',
        voted,
        votedPct,
        'voted',
        options.onVotedClick
    ));
    legend.appendChild(createConstitutionalCommitteeVoteLegendItem(
        'Not Voted',
        notVoted,
        notVotedPct,
        'missing',
        options.onNotVotedClick
    ));
    (options.extraLegendItems || []).forEach(item => {
        legend.appendChild(createGovernanceStatBox({
            label: item.label,
            detail: item.detail,
            color: item.color,
            statusClass: 'is-not-applicable',
            onClick: item.onClick
        }));
    });

    layout.appendChild(donut);
    layout.appendChild(legend);
    chart.appendChild(title);
    chart.appendChild(layout);
    container.appendChild(chart);
}

function isConstitutionalCommitteeVoteApplicable(proposal) {
    return proposal?.proposal_type !== 'NewCommittee'
        && proposal?.proposal_description?.tag !== 'UpdateCommittee';
}

function isConstitutionalCommitteeMemberVoteApplicable(proposal) {
    return isConstitutionalCommitteeVoteApplicable(proposal)
        && proposal?.proposal_type !== 'InfoAction'
        && proposal?.proposal_type !== 'NoConfidence';
}

function isExpiredGovernanceActionForCommitteeStats(proposal) {
    if (!proposal) return false;
    if (proposal.expired_epoch !== null || proposal.dropped_epoch !== null) return true;
    if (proposal.enacted_epoch !== null || proposal.ratified_epoch !== null) return true;

    const expirationEpoch = Number(proposal.expiration);
    if (!Number.isFinite(expirationEpoch)) return false;

    const clockEpoch = getClockEpochSnapshot();
    const currentEpoch = Number(clockEpoch?.epoch);
    return Number.isFinite(currentEpoch) && currentEpoch > expirationEpoch;
}

function createConstitutionalCommitteeVoteLegendItem(label, count, percentage, status, onClick = null) {
    return createGovernanceStatBox({
        label,
        detail: `${formatPercentage(percentage)} • ${count} actions`,
        color: status === 'voted' ? '#34d399' : '#fb7185',
        statusClass: status === 'voted' ? 'is-voted' : 'is-not-voted',
        onClick
    });
}

function formatVoteChoice(value) {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('yes')) return 'Yes';
    if (normalized.includes('no')) return 'No';
    if (normalized.includes('abstain')) return 'Abstain';
    return 'Unknown';
}

function hideDrepDetailsPanel(container) {
    container.textContent = '';
    container.hidden = true;
    container.dataset.activeGroup = '';
}

function renderNoVotesList(container, votes, headingLabel = 'DRep votes') {
    const title = document.createElement('strong');
    title.textContent = `${headingLabel} (${votes.length})`;

    const list = document.createElement('div');
    list.className = 'governance-no-votes-list';

    const sortedVotes = [...votes].sort((left, right) => getDrepVotePowerValue(right) - getDrepVotePowerValue(left));

    sortedVotes.forEach(vote => {
        const row = document.createElement('div');
        row.className = 'governance-no-vote-row';
        const normalizedVote = String(vote?.vote || '').toLowerCase();
        if (normalizedVote === 'yes') row.classList.add('is-yes');
        if (normalizedVote === 'no') row.classList.add('is-no');
        if (normalizedVote === 'not voted') row.classList.add('is-no');
        if (normalizedVote === 'abstain') row.classList.add('is-abstain');

        const copy = document.createElement('div');
        copy.className = 'governance-no-vote-copy';

        const nameLine = document.createElement('div');
        nameLine.className = 'governance-no-vote-name-line';

        const name = document.createElement('strong');
        name.className = 'governance-no-vote-name';
        name.textContent = getDrepPrimaryDisplayName(vote);

        const power = document.createElement('span');
        power.className = 'governance-no-vote-power';
        power.textContent = getDrepVotePowerLabel(vote);

        nameLine.appendChild(name);
        if (power.textContent) nameLine.appendChild(power);

        const id = document.createElement('span');
        id.className = 'governance-no-vote-id';
        id.textContent = getDrepVoteIdentifier(vote) || 'Unknown DRep';

        copy.appendChild(nameLine);
        copy.appendChild(id);
        row.appendChild(copy);
        list.appendChild(row);

        resolveDrepDisplayName(vote, name, { skipDetailLookup: true }).catch(() => {});
    });

    container.appendChild(title);
    container.appendChild(list);
}

function getDrepDisplayName(vote) {
    const resolvedName = vote?.resolvedDrepName
        || vote?.drep_name
        || vote?.drepName
        || vote?.name;
    const identifier = getDrepVoteIdentifier(vote);

    if (resolvedName && identifier) return `${resolvedName} | ${identifier}`;
    return resolvedName || identifier || 'Unknown DRep';
}

function getDrepPrimaryDisplayName(vote) {
    return vote?.resolvedDrepName
        || vote?.drep_name
        || vote?.drepName
        || vote?.name
        || getDrepVoteIdentifier(vote)
        || 'Unknown DRep';
}

async function resolveDrepDisplayName(vote, target, options = {}) {
    const name = await resolveDrepNameFromApi(vote, options);
    if (!name || !target?.isConnected) return;

    vote.resolvedDrepName = name;
    target.textContent = getDrepPrimaryDisplayName(vote);
}

function getDrepVoteIdentifier(vote) {
    return vote?.voter_id
        || vote?.voterId
        || vote?.drep_id
        || vote?.drepId
        || vote?.voter_hex
        || vote?.id
        || '';
}

function getDrepVotePowerLabel(vote) {
    const value = getDrepVotePowerValue(vote);
    if (!value) return '';
    return `Voting power: ${formatCompactAdaFromLovelace(value)}`;
}

function getDrepVotePowerValue(vote) {
    const value = vote?.amount
        ?? vote?.vote_power
        ?? vote?.voting_power
        ?? vote?.stake
        ?? vote?.lovelace;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

async function resolveDrepNameFromApi(vote, options = {}) {
    const directName = vote?.resolvedDrepName || vote?.drep_name || vote?.drepName || vote?.name;
    if (directName) return directName;

    const lookupId = normalizeDrepIdentifier(
        getDrepVoteIdentifier(vote)
    );

    if (lookupId) {
        const directory = await loadDrepDirectory().catch(() => null);
        const directoryName = directory?.get(lookupId) || directory?.get(shortenDrepIdentifier(lookupId)) || null;
        if (directoryName) return directoryName;

        if (!options.skipDetailLookup) {
            const detailName = await fetchDrepNameById(lookupId).catch(() => null);
            if (detailName) return detailName;
        }
    }

    const metadataUrl = normalizeMetadataUrl(vote?.meta_url || vote?.metaUrl);
    if (!metadataUrl) return null;

    const cacheKey = `${lookupId || metadataUrl}:${metadataUrl}`;
    if (!drepMetadataCache.has(cacheKey)) {
        drepMetadataCache.set(cacheKey, fetchDrepMetadataName(metadataUrl));
    }

    return drepMetadataCache.get(cacheKey).catch(() => null);
}

async function loadDrepDirectory() {
    if (!drepDirectoryPromise) {
        drepDirectoryPromise = fetchDrepDirectory();
    }
    return drepDirectoryPromise;
}

async function fetchDrepDirectory() {
    const [metadataPayload, infoPayload] = await Promise.allSettled([
        fetchJson(getDrepMetadataApiUrl()),
        fetchDrepInfoPayload()
    ]);

    const directory = new Map();
    if (metadataPayload.status === 'fulfilled') {
        addDrepDirectoryEntries(directory, metadataPayload.value);
    }
    if (infoPayload.status === 'fulfilled') {
        addDrepDirectoryEntries(directory, infoPayload.value);
    }

    return directory;
}

function fetchDrepInfoPayload() {
    if (!drepInfoPromise) {
        drepInfoPromise = fetchJson(getDrepInfoApiUrl()).catch(error => {
            drepInfoPromise = null;
            throw error;
        });
    }
    return drepInfoPromise;
}

async function fetchDrepNameById(drepId) {
    const normalizedId = normalizeDrepIdentifier(drepId);
    if (!normalizedId) return null;

    const cacheKey = `detail:${normalizedId}`;
    if (!drepMetadataCache.has(cacheKey)) {
        drepMetadataCache.set(cacheKey, fetchJson(getDrepDetailApiUrl(normalizedId))
            .then(payload => {
                const entry = Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload;
                return extractDrepNameFromEntry(entry);
            }));
    }

    return drepMetadataCache.get(cacheKey).catch(() => null);
}

function addDrepDirectoryEntries(directory, payload) {
    const entries = unwrapDrepEntries(payload);
    entries.forEach(entry => {
        const name = extractDrepNameFromEntry(entry);
        if (!name) return;

        getDrepEntryIdentifiers(entry).forEach(identifier => {
            directory.set(identifier, name);
            const shortened = shortenDrepIdentifier(identifier);
            if (shortened) directory.set(shortened, name);
        });
    });
}

function unwrapDrepEntries(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.dreps)) return payload.dreps;
    if (Array.isArray(payload?.items)) return payload.items;
    if (payload && typeof payload === 'object') return Object.values(payload).filter(Boolean);
    return [];
}

function extractDrepNameFromEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    const authorNames = Array.isArray(entry.authors)
        ? entry.authors.map(author => author?.name).filter(Boolean)
        : [];
    if (authorNames.length) return authorNames[0];

    const metadata = entry.metadata || {};
    const metaJson = entry.meta_json || metadata.meta_json || {};
    const body = entry.body || metadata.body || metaJson.body || {};

    return firstNonEmptyText(
        body.dRepName,
        body.drepName,
        body.givenName,
        body.given_name,
        body.name,
        body.title,
        entry.name,
        entry.title,
        entry.given_name,
        entry.givenName,
        entry.display_name,
        entry.displayName,
        metadata.name,
        metadata.title,
        metadata.givenName,
        metadata.given_name,
        metaJson.name,
        metaJson.title
    );
}

function getDrepEntryIdentifiers(entry) {
    return [
        entry?.voter_id,
        entry?.voterId,
        entry?.voter_hex,
        entry?.drep_id,
        entry?.drepId,
        entry?.id,
        entry?.hex,
        entry?.credential,
        entry?.view,
        entry?.bech32,
        entry?.drep_hash,
        entry?.drepHash,
        entry?.drep?.id,
        entry?.drep?.view,
        entry?.drep?.hex,
        entry?.drep?.bech32,
        entry?.metadata?.voter_id,
        entry?.metadata?.voterId,
        entry?.metadata?.drep_id
    ]
        .map(normalizeDrepIdentifier)
        .filter(Boolean);
}

function normalizeDrepIdentifier(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
}

function shortenDrepIdentifier(value) {
    const normalized = normalizeDrepIdentifier(value);
    if (!normalized) return '';
    return normalized.startsWith('drep1') ? normalized.slice(5) : normalized;
}

async function fetchDrepMetadataName(url) {
    const fetchUrl = getDrepMetadataFetchUrl(url);
    if (!fetchUrl) throw new Error('Unsupported DRep metadata URL');

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    return extractDrepMetadataName(payload);
}

function extractDrepMetadataName(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const authorNames = Array.isArray(payload.authors)
        ? payload.authors.map(author => author?.name).filter(Boolean)
        : [];
    if (authorNames.length) return authorNames[0];

    const body = payload.body || {};
    return firstNonEmptyText(
        body.dRepName,
        body.drepName,
        body.givenName,
        body.given_name,
        body.name,
        body.title,
        payload.name,
        payload.title,
        payload.givenName,
        payload.given_name
    );
}

function firstNonEmptyText(...values) {
    for (const value of values) {
        const text = extractTextValue(value);
        if (text) return text;
    }
    return null;
}

function extractTextValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value !== 'object') return String(value).trim();

    return (
        extractTextValue(value['@value'])
        || extractTextValue(value.value)
        || extractTextValue(value.text)
        || extractTextValue(value.label)
        || extractTextValue(value.name)
        || ''
    );
}

function normalizeMetadataUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${trimmed.slice('ipfs://'.length)}`;
    }

    return trimmed;
}

function getDrepMetadataApiUrl() {
    if (shouldUseLocalDashboardProxy()) {
        return `${LOCAL_DREP_DIRECTORY_PROXY_PATH}?type=metadata`;
    }
    return DREP_METADATA_API_URL;
}

function getDrepInfoApiUrl() {
    if (shouldUseLocalDashboardProxy()) {
        return `${LOCAL_DREP_DIRECTORY_PROXY_PATH}?type=info`;
    }
    return DREP_INFO_API_URL;
}

function getDrepDetailApiUrl(drepId) {
    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ drepId });
        return `${LOCAL_DREP_DETAIL_PROXY_PATH}?${params.toString()}`;
    }
    return `${DREP_DETAIL_API_BASE_URL}/${encodeURIComponent(drepId)}`;
}

function getDrepMetadataFetchUrl(url) {
    const normalizedUrl = normalizeMetadataUrl(url);
    if (!isAllowedBrowserMetadataUrl(normalizedUrl)) return '';

    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ url: normalizedUrl });
        return `${LOCAL_METADATA_PROXY_PATH}?${params.toString()}`;
    }
    const params = new URLSearchParams({ url: normalizedUrl });
    return `${REMOTE_METADATA_API_URL}?${params.toString()}`;
}

function isAllowedBrowserMetadataUrl(url) {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        return parsed.hostname === 'ipfs.io';
    } catch {
        return false;
    }
}

function mapBreakdownKeyToVote(key) {
    if (key === 'yes') return 'yes';
    if (key === 'no') return 'no';
    if (key === 'abstain') return 'abstain';
    return null;
}

function getDrepStakeBreakdown(summary, notVotedDreps = []) {
    if (!summary) return [];

    const yesVotePower = pickFirstNumber(
        summary.drep_yes_vote_power,
        summary.drep_active_yes_vote_power
    ) ?? 0;
    const noVotePowerTotal = pickFirstNumber(
        summary.drep_no_vote_power,
        summary.drep_active_no_vote_power
    ) ?? 0;
    const activeNoVotePower = pickFirstNumber(
        summary.drep_active_no_vote_power,
        summary.drep_no_vote_power
    ) ?? 0;
    const notVotedPower = Math.max(0, noVotePowerTotal - activeNoVotePower);
    const abstainVotePower = Number(summary.drep_active_abstain_vote_power) || 0;
    const yesVoteCount = Number(summary.drep_yes_votes_cast) || 0;
    const noVoteCount = Number(summary.drep_no_votes_cast) || 0;
    const abstainVoteCount = Number(summary.drep_abstain_votes_cast) || 0;

    const items = [
        {
            key: 'yes',
            label: 'Yes',
            value: yesVotePower,
            count: yesVoteCount,
            color: '#34d399'
        },
        {
            key: 'no',
            label: 'No',
            value: activeNoVotePower,
            count: noVoteCount,
            color: '#f87171'
        },
        {
            key: 'not-voted',
            label: 'Not voted',
            value: notVotedPower,
            count: notVotedDreps.length,
            votes: notVotedDreps,
            color: '#fb7185'
        },
        {
            key: 'abstain',
            label: 'Abstain ADA',
            value: 0,
            displayValue: abstainVotePower,
            count: abstainVoteCount,
            color: '#60a5fa',
            excludedFromPercentage: true
        }
    ];

    const representedPower = items.reduce((sum, item) => sum + item.value, 0);
    return items
        .filter(item => item.value > 0 || item.excludedFromPercentage && (item.count > 0 || Number(item.displayValue) > 0))
        .map(item => ({
            ...item,
            votePowerPercentage: representedPower > 0
                ? (item.value / representedPower) * 100
                : 0
        }));
}

function getPieChartSegments(items) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (!total) return [];

    let start = 0;
    return items.map(item => {
        const span = (item.value / total) * 360;
        const end = start + span;
        const segment = {
            ...item,
            start,
            end,
            mid: start + span / 2
        };
        start = end;
        return segment;
    });
}

function buildPieChartGradient(items) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (!total) return 'conic-gradient(#334155 0deg 360deg)';

    return `conic-gradient(${items.map(item => `${item.color} ${item.start}deg ${item.end}deg`).join(', ')})`;
}

function getDrepVotes(payload) {
    const dreps = payload?.votes?.dreps;
    if (Array.isArray(dreps)) return dreps;
    if (!dreps || typeof dreps !== 'object') return [];

    const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
        ? payload.drep_info
        : {};

    return ['yes', 'no', 'abstain', 'unknown'].flatMap(key => {
        const bucket = dreps[key];
        if (!Array.isArray(bucket)) return [];

        return bucket.map(vote => {
            const info = drepInfo[vote?.voter_id]
                || drepInfo[vote?.drep_id]
                || drepInfo[vote?.voter_hex]
                || drepInfo[vote?.hex]
                || null;

            if (!info) return vote;

            return {
                ...info,
                ...vote,
                amount: vote?.amount ?? info?.amount ?? '',
                drep_id: vote?.drep_id || info?.drep_id || vote?.voter_id || '',
                voter_hex: vote?.voter_hex || info?.hex || ''
            };
        });
    });
}

function getSpoVotes(payload) {
    const spos = payload?.votes?.spos
        ?? payload?.votes?.spo
        ?? payload?.votes?.pools;
    const spoInfo = payload?.spo_info && typeof payload.spo_info === 'object'
        ? payload.spo_info
        : {};
    const enrichVote = vote => {
        const identifier = getSpoVoteIdentifier(vote);
        return {
            ...(spoInfo[identifier] || {}),
            ...vote
        };
    };

    if (Array.isArray(spos)) return spos.map(enrichVote);
    if (!spos || typeof spos !== 'object') return [];

    return ['yes', 'no', 'abstain', 'unknown'].flatMap(key => {
        const bucket = spos[key];
        if (!Array.isArray(bucket)) return [];
        return bucket.map(vote => enrichVote({
            ...vote,
            vote: vote?.vote || key
        }));
    });
}

function getNotVotedDreps(payload, drepVotes) {
    const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
        ? payload.drep_info
        : {};
    const votedIds = new Set(drepVotes.flatMap(vote => getDrepVoteIdentifierCandidates(vote)));

    return Object.entries(drepInfo)
        .filter(([identifier, info]) => !getDrepVoteIdentifierCandidates({ ...info, drep_id: identifier }).some(id => votedIds.has(id)))
        .map(([identifier, info]) => ({
            ...info,
            vote: 'Not voted',
            drep_id: info?.drep_id || identifier,
            voter_id: info?.voter_id || info?.drep_id || identifier,
            voter_hex: info?.voter_hex || info?.hex || ''
        }));
}

function getDrepVoteIdentifierCandidates(vote) {
    return [
        vote?.voter_id,
        vote?.voterId,
        vote?.drep_id,
        vote?.drepId,
        vote?.voter_hex,
        vote?.hex,
        vote?.id
    ]
        .map(normalizeDrepIdentifier)
        .filter(Boolean);
}

function getDrepVoteCountPercentage(key, drepVotes) {
    const voteKey = mapBreakdownKeyToVote(key);
    if (!voteKey) return null;

    const totalVotes = drepVotes.length;
    if (!totalVotes) return 0;

    const matchingVotes = drepVotes.filter(vote => String(vote?.vote || '').toLowerCase() === voteKey).length;
    return (matchingVotes / totalVotes) * 100;
}

function createPieAmountLabel(segment) {
    if (!segment.value) return null;

    const label = document.createElement('span');
    label.className = 'governance-pie-label';
    label.textContent = formatPercentage((segment.end - segment.start) / 360 * 100);

    const radians = ((segment.mid - 90) * Math.PI) / 180;
    const radius = segment.end - segment.start < 18 ? 57 : 48;
    const x = 50 + (Math.cos(radians) * radius);
    const y = 50 + (Math.sin(radians) * radius);

    label.style.left = `${x}%`;
    label.style.top = `${y}%`;
    return label;
}

function cleanGovernanceText(text) {
    return text
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function sanitizeGovernanceMarkdown(text) {
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return true;

            if (/^\[[^\]]+\]:\s*<?data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return false;
            if (/^<?data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return false;
            if (/^!\[[^\]]*\]\(data:image\/[a-z0-9.+-]+;base64,[^)]+\)$/i.test(trimmed)) return false;

            return true;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function appendRichText(container, text) {
    const urlPattern = /((?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+)/g;
    let lastIndex = 0;

    text.replace(urlPattern, (url, _match, offset) => {
        if (offset > lastIndex) {
            container.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const cleanUrl = url.replace(/[.,;:!?]+$/, '');
        const trailing = url.slice(cleanUrl.length);

        const imageSrc = normalizeImageSource(cleanUrl);
        if (imageSrc) {
            const imageLink = document.createElement('a');
            imageLink.href = imageSrc;
            imageLink.target = '_blank';
            imageLink.rel = 'noopener noreferrer';

            const image = document.createElement('img');
            image.className = 'governance-detail-image';
            image.src = imageSrc;
            image.alt = 'Governance action image';
            image.loading = 'lazy';
            image.referrerPolicy = 'no-referrer';

            imageLink.appendChild(image);
            container.appendChild(imageLink);
        } else {
            const link = document.createElement('a');
            link.href = cleanUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.referrerPolicy = 'no-referrer';
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

function renderMarkdown(container, markdown) {
    const lines = cleanGovernanceText(markdown).replace(/\r\n?/g, '\n').split('\n');
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];

        if (!line.trim()) {
            index += 1;
            continue;
        }

        if (line.trim().startsWith('```')) {
            const language = line.trim().slice(3).trim();
            index += 1;
            const codeLines = [];
            while (index < lines.length && !lines[index].trim().startsWith('```')) {
                codeLines.push(lines[index]);
                index += 1;
            }
            if (index < lines.length) index += 1;

            const pre = document.createElement('pre');
            pre.className = 'governance-markdown-code';
            if (language) pre.dataset.language = language;
            pre.textContent = codeLines.join('\n');
            container.appendChild(pre);
            continue;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = Math.min(6, headingMatch[1].length + 1);
            const heading = document.createElement(`h${level}`);
            appendMarkdownInline(heading, headingMatch[2].trim());
            container.appendChild(heading);
            index += 1;
            continue;
        }

        if (isMarkdownTable(lines, index)) {
            const { element, nextIndex } = renderMarkdownTable(lines, index);
            container.appendChild(element);
            index = nextIndex;
            continue;
        }

        if (/^>\s?/.test(line)) {
            const quoteLines = [];
            while (index < lines.length && /^>\s?/.test(lines[index])) {
                quoteLines.push(lines[index].replace(/^>\s?/, ''));
                index += 1;
            }

            const blockquote = document.createElement('blockquote');
            renderMarkdown(blockquote, quoteLines.join('\n'));
            container.appendChild(blockquote);
            continue;
        }

        if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
            const { element, nextIndex } = renderMarkdownList(lines, index);
            container.appendChild(element);
            index = nextIndex;
            continue;
        }

        const paragraphLines = [];
        while (index < lines.length) {
            const current = lines[index];
            if (!current.trim()) break;
            if (current.trim().startsWith('```')) break;
            if (/^(#{1,6})\s+/.test(current)) break;
            if (/^>\s?/.test(current)) break;
            if (/^\s*([-*+])\s+/.test(current) || /^\s*\d+\.\s+/.test(current)) break;
            if (isMarkdownTable(lines, index)) break;
            paragraphLines.push(current.trim());
            index += 1;
        }

        const paragraph = document.createElement('p');
        appendMarkdownInline(paragraph, paragraphLines.join(' '));
        container.appendChild(paragraph);
    }
}

function renderMarkdownList(lines, startIndex) {
    const ordered = /^\s*\d+\.\s+/.test(lines[startIndex]);
    const list = document.createElement(ordered ? 'ol' : 'ul');
    let index = startIndex;

    while (index < lines.length) {
        const line = lines[index];
        if (ordered && !/^\s*\d+\.\s+/.test(line)) break;
        if (!ordered && !/^\s*[-*+]\s+/.test(line)) break;

        const item = document.createElement('li');
        const text = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '');
        appendMarkdownInline(item, text);
        list.appendChild(item);
        index += 1;
    }

    return { element: list, nextIndex: index };
}

function isMarkdownTable(lines, index) {
    if (index + 1 >= lines.length) return false;
    const header = lines[index];
    const separator = lines[index + 1];
    return header.includes('|') && /^[\s|:-]+$/.test(separator.trim()) && separator.includes('-');
}

function renderMarkdownTable(lines, startIndex) {
    const table = document.createElement('table');
    table.className = 'governance-markdown-table';

    const headerCells = splitMarkdownTableRow(lines[startIndex]);
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headerCells.forEach(cellText => {
        const th = document.createElement('th');
        appendMarkdownInline(th, cellText);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let index = startIndex + 2;
    while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        const bodyRow = document.createElement('tr');
        splitMarkdownTableRow(lines[index]).forEach(cellText => {
            const td = document.createElement('td');
            appendMarkdownInline(td, cellText);
            bodyRow.appendChild(td);
        });
        tbody.appendChild(bodyRow);
        index += 1;
    }

    table.appendChild(tbody);
    return { element: table, nextIndex: index };
}

function splitMarkdownTableRow(row) {
    return row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim());
}

function appendMarkdownInline(container, text) {
    const tokens = tokenizeMarkdownInline(text);
    tokens.forEach(token => appendMarkdownToken(container, token));
}

function tokenizeMarkdownInline(text) {
    const tokens = [];
    let index = 0;

    while (index < text.length) {
        const remaining = text.slice(index);

        let match = remaining.match(/^!\[([^\]]*)\]\(([^)\s]+)\)/);
        if (match) {
            tokens.push({ type: 'image', alt: match[1], src: match[2] });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+|ipfs:\/\/[^)\s]+)\)/);
        if (match) {
            tokens.push({ type: 'link', label: match[1], href: match[2] });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^`([^`]+)`/);
        if (match) {
            tokens.push({ type: 'code', text: match[1] });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^\*\*([^*]+)\*\*/);
        if (match) {
            tokens.push({ type: 'strong', children: tokenizeMarkdownInline(match[1]) });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^\*([^*]+)\*/);
        if (match) {
            tokens.push({ type: 'em', children: tokenizeMarkdownInline(match[1]) });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^((?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+)/);
        if (match) {
            tokens.push({ type: 'link', label: match[1], href: match[1] });
            index += match[0].length;
            continue;
        }

        const nextSpecial = remaining.search(/(!?\[|`|\*\*|\*|https?:\/\/|ipfs:\/\/)/);
        if (nextSpecial === -1) {
            tokens.push({ type: 'text', text: remaining });
            break;
        }
        if (nextSpecial > 0) {
            tokens.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
            index += nextSpecial;
            continue;
        }

        tokens.push({ type: 'text', text: remaining[0] });
        index += 1;
    }

    return tokens;
}

function appendMarkdownToken(container, token) {
    if (token.type === 'text') {
        container.appendChild(document.createTextNode(token.text));
        return;
    }

    if (token.type === 'code') {
        const code = document.createElement('code');
        code.textContent = token.text;
        container.appendChild(code);
        return;
    }

    if (token.type === 'link') {
        const link = document.createElement('a');
        link.href = normalizeMetadataUrl(token.href);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.referrerPolicy = 'no-referrer';
        link.textContent = token.label;
        container.appendChild(link);
        return;
    }

    if (token.type === 'image') {
        const imageSrc = normalizeImageSource(token.src, token.alt);
        if (!imageSrc) {
            container.appendChild(document.createTextNode(token.alt || token.src));
            return;
        }

        const imageLink = document.createElement('a');
        imageLink.href = imageSrc;
        imageLink.target = '_blank';
        imageLink.rel = 'noopener noreferrer';

        const image = document.createElement('img');
        image.className = 'governance-detail-image';
        image.src = imageSrc;
        image.alt = token.alt || 'Governance action image';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';

        imageLink.appendChild(image);
        container.appendChild(imageLink);
        return;
    }

    const element = document.createElement(token.type === 'strong' ? 'strong' : 'em');
    token.children.forEach(child => appendMarkdownToken(element, child));
    container.appendChild(element);
}

function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function isRenderableImageUrl(url, keyHint = '') {
    if (isImageUrl(url)) return true;
    return /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i.test(keyHint);
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
    return parts.join(' - ');
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

function formatVotePercentages(percentages, label = null, summary = null, source = null) {
    if (!percentages) return '';

    const parts = [
        `Yes ${formatPercentage(percentages.yes)}`,
        `No - Not Voted ${formatPercentage(percentages.no)}`
    ];
    return parts.join(' | ');
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

async function updateGovernanceCounts(groups) {
    setText('gov-active-count', getCollectionLength(groups.active));
    setText('gov-approved-count', getCollectionLength(groups.approved));
    setText('gov-rejected-count', getCollectionLength(groups.rejected));
    setText('gov-info-count', getCollectionLength(groups.info));
    setText('gov-info-last-action', formatLatestInfoActionEpoch(groups.info));
    setText('gov-active-ask', formatGovernanceAskAmount(groups.active));
    setText('gov-approved-ask', formatGovernanceAskAmount(groups.approved));
    setText('gov-rejected-ask', formatGovernanceAskAmount(groups.rejected));
    setText('gov-committee-count', formatGovernanceCount(
        getConstitutionalCommitteeMemberCount(governanceState, groups)
    ));
    fetchCommitteeInfoPayload()
        .then(payload => {
            setText('gov-committee-count', formatGovernanceCount(
                getConstitutionalCommitteeMemberCount(payload || governanceState, groups)
            ));
            updateConstitutionalCommitteeQuorumScore(payload);
        })
        .catch(() => {});

    const cachedDrepStats = getDashboardDrepStats(governanceState);
    if (cachedDrepStats) renderDrepSummaryStats(cachedDrepStats);

    try {
        const drepStats = await getDrepStats(groups);
        renderDrepSummaryStats(drepStats);
    } catch {
        if (!cachedDrepStats) {
            setText('gov-drep-count', '0');
            setText('gov-drep-total-power', 'VPower 0 ADA');
        }
    }

    updateTreasuryBudgetBar();
}

function formatLatestInfoActionEpoch(proposals) {
    const epochs = (Array.isArray(proposals) ? proposals : [])
        .map(proposal => Number(proposal?.proposed_epoch))
        .filter(Number.isFinite);
    if (!epochs.length) return 'Last action epoch --';
    return `Last action epoch ${Math.max(...epochs)}`;
}

function getDashboardDrepStats(payload) {
    const summary = payload?.drep_summary || payload?.drepSummary;
    if (!summary) return null;

    const count = Number(summary.total_count ?? summary.totalCount ?? summary.count);
    const activeCount = Number(summary.active_count ?? summary.activeCount);
    const inactiveCount = Number(summary.inactive_count ?? summary.inactiveCount);
    const totalPower = Number(summary.total_voting_power ?? summary.totalVotingPower ?? summary.total_power);
    if (![count, activeCount, inactiveCount, totalPower].every(Number.isFinite)) return null;
    return { count, activeCount, inactiveCount, totalPower };
}

function renderDrepSummaryStats(stats) {
    setText('gov-drep-count', stats.count.toLocaleString('en-US'));
    setText('gov-drep-total-power', `VPower ${formatCompactAdaFromLovelace(stats.totalPower, { fixedFractionDigits: 2 })}`);
}

function getConstitutionalCommitteeMemberCount(payload, groups = null) {
    const members = getConstitutionalCommitteeMembers(payload);
    if (members.length) return members.length;

    const explicitCount = pickFirstNumber(
        payload?.active_member_count,
        payload?.committee_member_count,
        payload?.constitutional_committee_member_count,
        payload?.constitutionalCommitteeMemberCount,
        payload?.committee?.member_count,
        payload?.committee?.members_count,
        payload?.committee?.members?.length,
        payload?.constitutional_committee?.member_count,
        payload?.constitutional_committee?.members_count,
        payload?.constitutional_committee?.members?.length
    );
    if (Number.isFinite(explicitCount) && explicitCount > 0) return Math.round(explicitCount);

    const activeProposals = Array.isArray(groups?.active) ? groups.active : [];
    const activeCount = getMaxCommitteeMemberCountFromProposals(activeProposals);
    if (activeCount > 0) return activeCount;

    const proposals = Array.isArray(payload?.proposals)
        ? payload.proposals
        : Array.isArray(payload?.data)
            ? payload.data
            : [];

    return getMaxCommitteeMemberCountFromProposals(proposals);
}

function updateConstitutionalCommitteeQuorumScore(payload) {
    const stats = getConstitutionalCommitteeQuorumStats(payload);
    setText('gov-committee-voted', Number.isFinite(stats?.votedPct)
        ? `Voted ${formatPercentage(stats.votedPct)}`
        : 'Voted --%');
}

function getConstitutionalCommitteeQuorumStats(payload) {
    const numerator = Number(payload?.quorum?.numerator ?? payload?.quorum_numerator);
    const denominator = Number(payload?.quorum?.denominator ?? payload?.quorum_denominator);
    const quorumNumerator = Number.isFinite(numerator) && numerator > 0 ? numerator : 2;
    const quorumDenominator = Number.isFinite(denominator) && denominator > 0 ? denominator : 3;
    const groups = governanceGroupsState || groupGovernanceProposals(
        getGovernanceProposalsFromDashboardPayload(governanceState || {})
    );
    const closedProposals = [...(groups.approved || []), ...(groups.rejected || [])];
    const proposals = closedProposals.filter(isConstitutionalCommitteeVoteApplicable);
    const members = getConstitutionalCommitteeMembers(payload);
    const currentCommitteeStartEpoch = getCurrentConstitutionalCommitteeStartEpoch(members);

    if (!members.length) return null;

    let evaluatedActions = 0;
    let quorumActions = 0;
    const votedProposals = [];
    const notVotedProposals = [];
    const evaluatedProposalIds = new Set();
    proposals.forEach(proposal => {
        const actionEpoch = getConstitutionalCommitteeVoteEpoch(proposal);
        const usesHistoricalSummary = Number.isFinite(currentCommitteeStartEpoch)
            && Number.isFinite(actionEpoch)
            && actionEpoch < currentCommitteeStartEpoch;
        const participation = usesHistoricalSummary
            ? getHistoricalConstitutionalCommitteeParticipation(proposal.voteSummary)
            : getCurrentConstitutionalCommitteeParticipation(members, proposal.proposal_id, proposal.voteSummary);
        if (!participation) return;

        evaluatedActions += 1;
        evaluatedProposalIds.add(proposal.proposal_id);
        if (participation.votes * quorumDenominator >= participation.members * quorumNumerator) {
            quorumActions += 1;
            votedProposals.push(proposal);
        } else {
            notVotedProposals.push(proposal);
        }
    });

    if (evaluatedActions <= 0) return null;
    const notVotedActions = evaluatedActions - quorumActions;
    const votedPct = (quorumActions / evaluatedActions) * 100;
    const notApplicableProposals = closedProposals
        .filter(proposal => !evaluatedProposalIds.has(proposal.proposal_id));
    return {
        voted: quorumActions,
        notVoted: notVotedActions,
        total: evaluatedActions,
        closedTotal: closedProposals.length,
        notApplicable: closedProposals.length - evaluatedActions,
        votedProposals,
        notVotedProposals,
        notApplicableProposals,
        votedPct,
        notVotedPct: 100 - votedPct
    };
}

function getCurrentConstitutionalCommitteeStartEpoch(members) {
    const epochs = enrichConstitutionalCommitteeMembersWithSinceEpoch(members, governanceState)
        .map(member => Number(member.sinceEpoch))
        .filter(Number.isFinite);
    return epochs.length ? Math.min(...epochs) : null;
}

function getConstitutionalCommitteeVoteEpoch(proposal) {
    return pickFirstNumber(
        proposal?.voteSummary?.epoch_no,
        proposal?.ratified_epoch,
        proposal?.enacted_epoch,
        proposal?.dropped_epoch,
        proposal?.expired_epoch,
        proposal?.expiration,
        proposal?.proposed_epoch
    );
}

function getCurrentConstitutionalCommitteeParticipation(members, proposalId, summary) {
    const actionVotes = getConstitutionalCommitteeActionVotes(members, proposalId);
    const hasCompleteMemberVotes = actionVotes.length === members.length;
    const votes = hasCompleteMemberVotes
        ? actionVotes.filter(action => {
            if (!action.voted) return false;
            const vote = String(action.voteBucket || action.vote || '').toLowerCase();
            return vote === 'yes' || vote === 'no';
        }).length
        : (Number(summary?.committee_yes_votes_cast) || 0)
            + (Number(summary?.committee_no_votes_cast) || 0);

    return { votes, members: members.length };
}

function getHistoricalConstitutionalCommitteeParticipation(summary) {
    if (!summary || typeof summary !== 'object') return null;

    const yesVotes = Number(summary.committee_yes_votes_cast) || 0;
    const noVotes = Number(summary.committee_no_votes_cast) || 0;
    const abstainVotes = Number(summary.committee_abstain_votes_cast) || 0;
    const yesPct = normalizePercentageNumber(summary.committee_yes_pct);
    const noPct = normalizePercentageNumber(summary.committee_no_pct);
    const possibleMemberCounts = [yesVotes + noVotes + abstainVotes];

    if (yesVotes > 0 && yesPct > 0) {
        possibleMemberCounts.push(Math.round(yesVotes / (yesPct / 100)));
    }
    if (noVotes > 0 && noPct > 0) {
        possibleMemberCounts.push(Math.round(noVotes / (noPct / 100)));
    }

    const members = Math.max(...possibleMemberCounts);
    return members > 0 ? { votes: yesVotes + noVotes, members } : null;
}

function getConstitutionalCommitteeActionVotes(members, proposalId) {
    const normalizedProposalId = String(proposalId || '');
    if (!normalizedProposalId) return [];

    return members
        .map(member => member.voteStats?.actions?.find(action => (
            action.proposalId === normalizedProposalId && action.applicable !== false
        )))
        .filter(Boolean);
}

function getMaxCommitteeMemberCountFromProposals(proposals) {
    if (!Array.isArray(proposals)) return 0;

    return proposals.reduce((maxCount, proposal) => {
        const summary = proposal?.voteSummary || proposal?.voting_summary || proposal?.vote_summary || proposal?.summary || {};
        return Math.max(maxCount, getCommitteeVotesCastCountFromSummary(summary));
    }, 0);
}

function getConstitutionalCommitteeMembers(payload) {
    const explicitMembers = unwrapConstitutionalCommitteeMembers(payload);
    if (explicitMembers.length) return explicitMembers;

    const proposals = Array.isArray(payload?.proposals)
        ? payload.proposals
        : Array.isArray(payload?.data)
            ? payload.data
            : [];

    return getConstitutionalCommitteeMembersFromProposals(proposals);
}

function unwrapConstitutionalCommitteeMembers(payload) {
    const memberSources = [
        payload?.members,
        payload?.committee?.members,
        payload?.constitutional_committee?.members,
        payload?.constitutionalCommittee?.members,
        payload?.constitutional_committee_members,
        payload?.committee_members
    ];

    for (const source of memberSources) {
        if (!Array.isArray(source)) continue;
        const members = source
            .map(normalizeConstitutionalCommitteeMember)
            .filter(Boolean)
            .filter(isActiveConstitutionalCommitteeMember);
        if (members.length) return dedupeConstitutionalCommitteeMembers(members);
    }

    return [];
}

function getConstitutionalCommitteeMembersFromProposals(proposals) {
    if (!Array.isArray(proposals)) return [];

    const committeeActions = proposals
        .filter(proposal => proposal?.proposal_type === 'NewCommittee' || proposal?.proposal_description?.tag === 'UpdateCommittee')
        .filter(proposal => proposal?.enacted_epoch !== null && proposal?.enacted_epoch !== undefined)
        .sort((a, b) => {
            const aEpoch = Number(a.enacted_epoch ?? a.ratified_epoch ?? a.proposed_epoch ?? 0);
            const bEpoch = Number(b.enacted_epoch ?? b.ratified_epoch ?? b.proposed_epoch ?? 0);
            return aEpoch - bEpoch;
        });

    const members = new Map();
    committeeActions.forEach(proposal => {
        const contents = Array.isArray(proposal?.proposal_description?.contents)
            ? proposal.proposal_description.contents
            : [];
        const removed = Array.isArray(contents[1]) ? contents[1] : [];
        const added = contents[2] && typeof contents[2] === 'object' ? contents[2] : {};

        removed
            .map(normalizeConstitutionalCommitteeMember)
            .filter(Boolean)
            .forEach(member => members.delete(member.id));

        Object.entries(added).forEach(([rawId, expiresEpoch]) => {
            const member = normalizeConstitutionalCommitteeMember({ id: rawId, expiresEpoch });
            if (member) members.set(member.id, member);
        });
    });

    return Array.from(members.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeConstitutionalCommitteeMember(entry) {
    if (!entry) return null;

    if (typeof entry === 'string') {
        return {
            id: entry,
            type: getConstitutionalCommitteeMemberType(entry),
            expiresEpoch: null
        };
    }

    if (typeof entry !== 'object') return null;

    const rawId = entry.cc_cold_id
        || entry.cc_cold_hex
        || entry.id
        || entry.hash
        || entry.keyHash
        || entry.key_hash
        || entry.scriptHash
        || entry.script_hash
        || entry.credential
        || entry.committee_credential
        || '';
    const id = normalizeConstitutionalCommitteeMemberId(rawId, entry);
    if (!id) return null;

    const type = entry.type
        || entry.credential_type
        || getConstitutionalCommitteeMemberType(id, entry);

    return {
        id,
        name: entry.name || null,
        hotId: entry.cc_hot_id || entry.cc_hot_hex || null,
        hotHex: entry.cc_hot_hex || null,
        status: entry.status || null,
        type,
        expiresEpoch: pickFirstNumber(entry.expiresEpoch, entry.expiration_epoch, entry.epoch, entry.expires_epoch),
        hasScript: entry.cc_cold_has_script ?? entry.cc_hot_has_script ?? null,
        voteStats: normalizeConstitutionalCommitteeMemberVoteStats(entry.voteStats || entry.vote_stats)
    };
}

function normalizeConstitutionalCommitteeMemberVoteStats(stats) {
    if (!stats || typeof stats !== 'object') return null;

    return {
        voted: pickFirstNumber(stats.voted, stats.voted_count),
        notVoted: pickFirstNumber(stats.notVoted, stats.not_voted, stats.not_voted_count),
        total: pickFirstNumber(stats.total, stats.total_actions),
        votedPct: pickFirstNumber(stats.votedPct, stats.voted_pct),
        notVotedPct: pickFirstNumber(stats.notVotedPct, stats.not_voted_pct),
        cachedActions: pickFirstNumber(stats.cachedActions, stats.cached_actions),
        totalActions: pickFirstNumber(stats.totalActions, stats.total_actions),
        actions: normalizeConstitutionalCommitteeMemberActionStats(stats.actions)
    };
}

function normalizeConstitutionalCommitteeMemberActionStats(actions) {
    if (!Array.isArray(actions)) return [];

    return actions
        .map(action => ({
            proposalId: action?.proposalId || action?.proposal_id || '',
            voted: action?.voted === true,
            vote: action?.vote || null,
            voteBucket: action?.voteBucket || action?.vote_bucket || null,
            applicable: action?.applicable !== false,
            final: action?.final !== false
        }))
        .filter(action => action.proposalId);
}

function normalizeConstitutionalCommitteeMemberId(rawId, entry = null) {
    const id = String(rawId || '').trim();
    if (!id) return '';
    if (id.includes('-')) return id;
    if (entry?.scriptHash || entry?.script_hash) return `scriptHash-${id}`;
    if (entry?.keyHash || entry?.key_hash) return `keyHash-${id}`;
    return id;
}

function getConstitutionalCommitteeMemberType(id, entry = null) {
    const value = String(id || '').toLowerCase();
    if (value.startsWith('cc_cold') || value.startsWith('cc_hot')) return 'Committee credential';
    if (value.includes('scripthash') || entry?.scriptHash || entry?.script_hash) return 'Script hash';
    if (value.includes('keyhash') || entry?.keyHash || entry?.key_hash) return 'Key hash';
    return 'Credential';
}

function dedupeConstitutionalCommitteeMembers(members) {
    return Array.from(new Map(members.map(member => [member.id, member])).values());
}

function isActiveConstitutionalCommitteeMember(member) {
    return String(member?.status || '').toLowerCase() !== 'resigned';
}

function enrichConstitutionalCommitteeMembersWithSinceEpoch(members, payload = governanceState) {
    const sinceEpochByKey = getConstitutionalCommitteeSinceEpochMap(payload);
    return members.map(member => ({
        ...member,
        sinceEpoch: pickFirstNumber(
            member.sinceEpoch,
            member.since_epoch,
            sinceEpochByKey.get(normalizeCommitteeMemberLookupKey(member.id)),
            sinceEpochByKey.get(normalizeCommitteeMemberLookupKey(member.hotId)),
            sinceEpochByKey.get(normalizeCommitteeMemberLookupKey(member.hotHex)),
            sinceEpochByKey.get(normalizeCommitteeMemberLookupKey(member.name))
        )
    }));
}

function getConstitutionalCommitteeSinceEpochMap(payload) {
    const proposals = Array.isArray(payload?.proposals)
        ? payload.proposals
        : Array.isArray(payload?.data)
            ? payload.data
            : [];
    const sinceEpochByKey = new Map();

    proposals
        .filter(proposal => proposal?.proposal_type === 'NewCommittee' || proposal?.proposal_description?.tag === 'UpdateCommittee')
        .filter(proposal => proposal?.enacted_epoch !== null && proposal?.enacted_epoch !== undefined)
        .sort((a, b) => Number(a.enacted_epoch) - Number(b.enacted_epoch))
        .forEach(proposal => {
            const enactedEpoch = Number(proposal.enacted_epoch);
            if (!Number.isFinite(enactedEpoch)) return;

            const contents = Array.isArray(proposal?.proposal_description?.contents)
                ? proposal.proposal_description.contents
                : [];
            const added = contents[2] && typeof contents[2] === 'object' ? contents[2] : {};

            Object.keys(added).forEach(rawId => {
                const member = normalizeConstitutionalCommitteeMember({ id: rawId });
                if (member?.id) setCommitteeSinceEpoch(sinceEpochByKey, member.id, enactedEpoch);
            });

            getCommitteeMemberRowsFromProposalMetadata(proposal).forEach(row => {
                if (row.name) setCommitteeSinceEpoch(sinceEpochByKey, row.name, enactedEpoch);
                row.credentials.forEach(credential => setCommitteeSinceEpoch(sinceEpochByKey, credential, enactedEpoch));
            });
        });

    return sinceEpochByKey;
}

function getCommitteeMemberRowsFromProposalMetadata(proposal) {
    const body = proposal?.meta_json?.body || {};
    const text = [body.abstract, body.rationale, body.motivation].filter(Boolean).join('\n');

    return String(text)
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.includes('|'))
        .map(line => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.replace(/\*\*/g, '').trim()))
        .filter(row => row.length >= 2 && !row.every(isMarkdownSeparatorCell))
        .map(row => {
            const credentials = row.map(normalizeCommitteeMemberLookupKey).filter(Boolean);
            const name = row.find(cell => {
                const trimmed = cell.trim();
                return trimmed
                    && !normalizeCommitteeMemberLookupKey(trimmed)
                    && !isMarkdownSeparatorCell(trimmed)
                    && !/^\d+$/.test(trimmed)
                    && !/^member$/i.test(trimmed);
            }) || '';
            return { name, credentials };
        })
        .filter(row => row.name || row.credentials.length);
}

function isMarkdownSeparatorCell(value) {
    return /^:?-{2,}:?$/.test(String(value || '').trim());
}

function setCommitteeSinceEpoch(map, key, epoch) {
    const normalized = normalizeCommitteeMemberLookupKey(key);
    if (!normalized || map.has(normalized)) return;
    map.set(normalized, epoch);
}

function normalizeCommitteeMemberLookupKey(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const bech32 = raw.match(/cc_(?:cold|hot)1[0-9a-z]+/i)?.[0];
    if (bech32) return bech32.toLowerCase();

    const hex = raw
        .replace(/^script[-_]?hash[-_]?/i, '')
        .replace(/^key[-_]?hash[-_]?/i, '')
        .trim()
        .toLowerCase();
    if (/^[0-9a-f]{56,64}$/.test(hex)) return hex;

    return raw.toLowerCase();
}

function getCommitteeVotesCastCountFromSummary(summary) {
    if (!summary || typeof summary !== 'object') return 0;

    const yesVotes = Number(summary.committee_yes_votes_cast) || 0;
    const noVotes = Number(summary.committee_no_votes_cast) || 0;
    const abstainVotes = Number(summary.committee_abstain_votes_cast) || 0;
    return yesVotes + noVotes + abstainVotes;
}

function formatGovernanceCount(count) {
    return Number.isFinite(count) && count > 0 ? Math.round(count).toLocaleString('en-US') : '0';
}

function formatGovernanceAskAmount(proposals) {
    const totalAsk = Array.isArray(proposals)
        ? proposals.reduce((sum, proposal) => sum + getProposalTotalAskLovelace(proposal), 0)
        : 0;

    return totalAsk
        ? formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })
        : '0 ADA';
}

async function getDrepStats(groups) {
    if (!drepStatsPromise) {
        drepStatsPromise = fetchDrepStats();
    }

    const baseStats = await drepStatsPromise;
    return {
        count: baseStats.count,
        totalPower: baseStats.totalPower,
        activeCount: baseStats.activeCount,
        inactiveCount: baseStats.inactiveCount
    };
}

async function fetchDrepStats() {
    const payload = await fetchDrepInfoPayload();
    const entries = unwrapDrepEntries(payload);
    const uniqueDreps = new Map();

    entries.forEach(entry => {
        const identifiers = getDrepEntryIdentifiers(entry);
        const primaryIdentifier = identifiers[0];
        if (!primaryIdentifier || uniqueDreps.has(primaryIdentifier)) return;

        uniqueDreps.set(primaryIdentifier, {
            votingPower: getDrepEntryVotingPower(entry),
            active: entry?.active === true
        });
    });

    let totalPower = 0;
    let activeCount = 0;
    uniqueDreps.forEach(value => {
        totalPower += value.votingPower;
        if (value.active) activeCount += 1;
    });

    return {
        count: uniqueDreps.size,
        totalPower,
        activeCount,
        inactiveCount: uniqueDreps.size - activeCount
    };
}

function getDrepEntryVotingPower(entry) {
    const value = entry?.amount
        ?? entry?.voting_power
        ?? entry?.vote_power
        ?? entry?.stake
        ?? entry?.lovelace;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
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
    return `${(lovelace / 1_000_000).toLocaleString('en-US')} ADA`;
}

function formatPercentage(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    const rounded = Math.round(number * 100) / 100;
    return `${rounded.toLocaleString('en-US')}%`;
}

function formatCompactAdaFromLovelace(value, options = {}) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return value;

    const ada = lovelace / 1_000_000;
    const absAda = Math.abs(ada);
    const fixedFractionDigits = Number.isInteger(options.fixedFractionDigits) ? options.fixedFractionDigits : null;
    const compactUnits = [
        { value: 1_000_000_000_000, suffix: 'T' },
        { value: 1_000_000_000, suffix: 'B' },
        { value: 1_000_000, suffix: 'M' },
        { value: 1_000, suffix: 'K' }
    ];

    for (const unit of compactUnits) {
        if (absAda >= unit.value) {
            const compactValue = ada / unit.value;
            const digits = fixedFractionDigits ?? (Math.abs(compactValue) >= 100 ? 0 : Math.abs(compactValue) >= 10 ? 1 : 2);
            const formattedValue = fixedFractionDigits === null
                ? compactValue.toFixed(digits).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')
                : compactValue.toFixed(digits);
            return `${formattedValue}${unit.suffix} ADA`;
        }
    }

    return `${ada.toLocaleString('en-US', {
        minimumFractionDigits: fixedFractionDigits ?? 0,
        maximumFractionDigits: fixedFractionDigits ?? 2
    })} ADA`;
}
