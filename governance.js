const GOVERNANCE_IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
const DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard';
const COMPACT_DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard/compact';
const COMMITTEE_INFO_API_URL = 'https://api.tdsp.online/api/committee/directory';
const COMMITTEE_MEMBER_API_BASE_URL = 'https://api.tdsp.online/api/committee/member';
const PROPOSAL_VOTES_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_SUMMARY_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_RATIONALE_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const DREP_INFO_API_URL = 'https://api.tdsp.online/api/dreps/directory';
const DREP_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/drep';
const DREP_VOTE_STATS_API_URL = 'https://api.tdsp.online/api/dreps/vote-stats';
const DREP_CORRELATION_API_URL = 'https://api.tdsp.online/api/dreps/correlation';
const TDSP_DREP_ID = 'drep1yg5gkkyxwwr7d6qflf2qqp6drkp9432h6cvtmun0dqthusqlkz8hj';
const TDSP_DREP_FALLBACK_NAME = 'DamionDutch';
const SPO_DIRECTORY_API_URL = 'https://api.tdsp.online/api/spos/directory';
const SPO_RESCAN_STATUS_API_URL = 'https://api.tdsp.online/api/spos/rescan/status';
const SPO_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/spo';
const REMOTE_METADATA_API_URL = 'https://api.tdsp.online/api/metadata';
const TREASURY_API_URL = 'https://api.tdsp.online/api/treasury';
const TREASURY_ADMINISTRATORS_API_URL = 'https://api.tdsp.online/api/treasury/administrators';
const CATALYST_BUSINESS_API_URL = 'https://api.tdsp.online/api/catalyst/businesses';
const FUNDING_RECIPIENTS_API_URL = 'https://api.tdsp.online/api/funding/recipients';
const FUNDING_OVERVIEW_API_URL = 'https://api.tdsp.online/api/funding/overview';
const CATALYST_PROPOSALS_API_URL = 'https://api.tdsp.online/api/catalyst/proposals';
const CATALYST_PROPOSAL_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/catalyst/proposal';
const CATALYST_PROPOSAL_SUMMARY_API_BASE_URL = 'https://api.tdsp.online/api/catalyst/proposal';
const CIPS_API_URL = 'https://api.tdsp.online/api/cips';
const CONSTITUTION_CHAT_API_URL = 'https://api.tdsp.online/api/constitution/chat';
const CONSTITUTION_CHAT_FEEDBACK_API_URL = 'https://api.tdsp.online/api/constitution/chat/feedback';
const CONSTITUTION_DOCUMENT_API_URL = 'https://api.tdsp.online/api/constitution/document';
const LOCAL_DASHBOARD_PROXY_PATH = '/__dashboard_proxy__';
const LOCAL_COMPACT_DASHBOARD_PROXY_PATH = '/__dashboard_compact_proxy__';
const LOCAL_COMMITTEE_PROXY_PATH = '/__committee_proxy__';
const LOCAL_COMMITTEE_MEMBER_PROXY_PATH = '/__committee_member_proxy__';
const LOCAL_PROPOSAL_VOTES_PROXY_PATH = '/__proposal_votes_proxy__';
const LOCAL_PROPOSAL_DETAIL_PROXY_PATH = '/__proposal_detail_proxy__';
const LOCAL_PROPOSAL_SUMMARY_PROXY_PATH = '/__proposal_summary_proxy__';
const LOCAL_PROPOSAL_RATIONALE_PROXY_PATH = '/__proposal_rationale_proxy__';
const LOCAL_DREP_DIRECTORY_PROXY_PATH = '/__drep_directory_proxy__';
const LOCAL_DREP_DETAIL_PROXY_PATH = '/__drep_detail_proxy__';
const LOCAL_DREP_VOTE_STATS_PROXY_PATH = '/__drep_vote_stats_proxy__';
const LOCAL_DREP_CORRELATION_PROXY_PATH = '/__drep_correlation_proxy__';
const LOCAL_SPO_DIRECTORY_PROXY_PATH = '/__spo_directory_proxy__';
const LOCAL_SPO_RESCAN_STATUS_PROXY_PATH = '/__spo_rescan_status_proxy__';
const LOCAL_SPO_DETAIL_PROXY_PATH = '/__spo_detail_proxy__';
const LOCAL_METADATA_PROXY_PATH = '/__metadata_proxy__';
const LOCAL_TREASURY_PROXY_PATH = '/__treasury_proxy__';
const LOCAL_TREASURY_ADMINISTRATORS_PROXY_PATH = '/__treasury_administrators_proxy__';
const LOCAL_CATALYST_BUSINESS_PROXY_PATH = '/__catalyst_business_proxy__';
const LOCAL_FUNDING_RECIPIENTS_PROXY_PATH = '/__funding_recipients_proxy__';
const LOCAL_FUNDING_OVERVIEW_PROXY_PATH = '/__funding_overview_proxy__';
const LOCAL_CATALYST_PROPOSALS_PROXY_PATH = '/__catalyst_proposals_proxy__';
const LOCAL_CATALYST_PROPOSAL_DETAIL_PROXY_PATH = '/__catalyst_proposal_detail_proxy__';
const LOCAL_CATALYST_PROPOSAL_SUMMARY_PROXY_PATH = '/__catalyst_proposal_summary_proxy__';
const LOCAL_CIPS_PROXY_PATH = '/__cips_proxy__';
const LOCAL_CONSTITUTION_CHAT_PROXY_PATH = '/__constitution_chat_proxy__';
const LOCAL_CONSTITUTION_CHAT_FEEDBACK_PROXY_PATH = '/__constitution_chat_feedback_proxy__';
const LOCAL_CONSTITUTION_DOCUMENT_PROXY_PATH = '/__constitution_document_proxy__';
const GOVERNANCE_MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const ACTIVE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const DREP_TOP10_BACKGROUND_REFRESH_MAX_AGE_MS = 60 * 60 * 1000;
const EPOCH_CHANGE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EPOCH_CHANGE_REFRESH_WINDOW_MS = 60 * 60 * 1000;
const GOVERNANCE_NOTIFICATION_STORAGE_KEY = 'tdsp-governance-notification-state-v1';
const GOVERNANCE_ACTION_ALERT_YES_THRESHOLD = 67;
const GOVERNANCE_INFO_ACTION_ALERT_YES_THRESHOLD = 50;
const EPOCH_DURATION_SECONDS = 432000;
const CARDANO_MAINNET_EPOCH_ZERO_MS = Date.parse('2017-09-23T21:44:51Z');
const APPROVAL_GRACE_PERIOD_SECONDS = 300;
const DREP_STATS_EXCLUDED_PROPOSAL_IDS = new Set([
    'gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525',
    'gov_action1k2jertppnnndejjcglszfqq4yzw8evzrd2nt66rr6rqlz54xp0zsq05ecsn'
]);
const TREASURY_RECIPIENT_ADMINISTRATORS = Object.freeze({
    stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr: 'Intersect Treasury Reserve Smart Contract',
    stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v: 'Intersect Treasury Reserve Smart Contract',
    stake17x3n2krrld46qms4f4hzqqxzjgaf59u3fecvl6eh8scmaacjqmvjw: 'Harmonic Labs',
    stake1790c5a0h3qwkxquehkdg746ccaa3hdfzgp7ckx6wzdpp7lq6ysdg0: 'Blink Labs',
    stake17x2x5cv4nlwptph8kxvnyw93pp2sp54dk54dpfp2ax7fkggaj3ty4: 'UTxO Company / Siban Labs',
    stake1u99m2kxsvdwlulg4l6qwjrpvayzrzwk0fugnvu3uklfqtws257z0g: 'Orion Fund / Arouet Holdings',
    stake17xnev6rc25xwz8kg4qae8lq6dcg964z00py5gqgxd387pncv8fq8g: 'Amaru - Matthias Benkort',
    stake17xd74ehu0l4d5mx0sfz4fd0r5jvw4v2jqkkfyjxrlwvnkhccrqj9l: 'Amaru - Arnaud Bailly',
    stake17xrh74lqhhxgzelfsn0wq5kcm4e5dmluprlcpg5mq30p5yqhgk7k8: 'Amaru - Pi Lanningham',
    stake17xrqac8khkprtpp2jz90mpkujjwye8dt6a9sjewrvjudx9ggg4u5y: 'Amaru - Damien Czapla',
    stake178jztxzwynajcp4dva5gy9udmmnwg7ueffvf4c7hpjqhc7gtj5nzz: 'Amaru 2025 contingency multisig',
    stake1790mk0jjjhppr36ethwj8kewpgyrxyc7q6qucl4gqru96dqh6k4q9: 'Amaru core development - Matthias Benkort',
    stake179r8gmryz5wrwvlxm6g4s4u9ssdz656z95hwjnk9rgamedqpl4qd7: 'Amaru operations - Damien Czapla',
    stake17yezq8wpaqnssdjvd3p220uf7e6nzjae44w6yu625y965rg8en39a: 'Amaru network testing - Paolo Veronelli',
    stake178a5gxtm0ynzw80f80rsps3a5dwem43swsekpnctd0wuwxs0hc220: 'Amaru middleware - Pi Lanningham',
    stake178ndhlcfy30t38z0tql64fpg8ply93r37xrgvdagfpsz5nsttyvhp: 'Amaru 2026 contingency multisig',
    stake1u92flcyspwcp92lmgs0p47vdjrrek96l07cv3v6033wddfc8h620a: 'Tastenkunst GmbH'
});
const SPO_CLOUD_PROVIDER_KEYS = new Set([
    'aws', 'azure', 'google-cloud', 'oracle-cloud', 'alibaba-cloud',
    'ibm-cloud', 'tencent-cloud', 'huawei-cloud', 'ovh', 'digitalocean',
    'netcup', 'hetzner', 'akamai', 'vultr', 'scaleway', 'contabo'
]);
const TDSP_POOL_ID = 'pool1zfd0gl76h3f0ammgp4gu0qvt99qcqkn5a895wv0q779d6p9dz5u';
const DAMION_DREP_ID = 'drep1yg5gkkyxwwr7d6qflf2qqp6drkp9432h6cvtmun0dqthusqlkz8hj';
let governanceRefreshTimer = null;
let epochChangeRefreshTimer = null;
let epochChangeRefreshStartedAtMs = 0;
let lastActiveRenderSignature = '';
let governanceState = null;
let governanceGroupsState = null;
let committeeInfoState = null;
const proposalVotesCache = new Map();
const proposalDetailsCache = new Map();
const committeeMemberStatsCache = new Map();
const drepMetadataCache = new Map();
let drepDirectoryPromise = null;
let drepInfoPromise = null;
let drepStatsPromise = null;
let drepDirectoryState = null;
let drepVoteStatsPayloadPromises = new Map();
let drepCorrelationPayloadPromise = null;
let topDrepCorrelationPayload = null;
let spoDirectoryPromise = null;
let spoDirectoryState = null;
let committeeInfoPromise = null;
let treasuryPromise = null;
let treasuryAdministratorsPromise = null;
let treasuryAdministratorsState = null;
let treasuryState = null;
let catalystBusinessPromise = null;
let fundingRecipientsPromise = null;
let fundingOverviewPromise = null;
let fundingOverviewState = null;
let fundingRecipientsState = null;
let catalystBusinessState = null;
let catalystFundDirectoryPromise = null;
let catalystFundDirectoryState = null;
let catalystProposalDirectoryPromise = null;
let catalystProposalDirectoryState = null;
let cipDirectoryPromise = null;
let cipDirectoryState = null;
const catalystProposalDetailsCache = new Map();
let treasuryHistoryChart = null;
let governanceMeshPromise = null;
let tdspDrepStatsPromise = null;
const fetchResponse = window.TDSPRuntime.fetchResponse;
const fetchJson = window.TDSPRuntime.fetchJson;
const formatCompactAdaFromLovelace = window.TDSPRuntime.formatCompactAdaFromLovelace;
const bindGovernanceMenuTrigger = (element, openMenu) => window.TDSPRuntime.bindMenuTrigger(element, openMenu, {
    datasetKey: 'governanceMenuBound',
    errorMessage: 'Governance menu could not be opened.'
});
const governanceCips = window.TDSPCips.create({
    addDetailRow,
    addMarkdownDetailSection,
    cleanText: cleanGovernanceText,
    createBotContext: createCipBotContext,
    createCopyButton: createGovernanceCopyButton,
    createMenuOverlay: createGovernanceMenuOverlay,
    createSectionBotContext: createWebsiteSectionBotContext,
    getState: () => cipDirectoryState,
    loadDirectory: loadCipDirectory,
    removeMenuOverlay: removeGovernanceMenuOverlay,
    updateMenuBotContext: updateGovernanceOverlayBotContext,
    updateMenuHeaderMeta: updateGovernanceMenuHeaderMeta
});
const governanceNcl = window.TDSPNcl.create({
    createMenuOverlay: createGovernanceMenuOverlay,
    createSectionBotContext: createWebsiteSectionBotContext,
    createStatBox: createGovernanceStatBox,
    formatCompactAda: formatCompactAdaFromLovelace,
    getClockEpochSnapshot,
    getGovernanceProposals: () => getGovernanceProposalsFromDashboardPayload(governanceState || {}),
    getProposalAsk: getProposalTotalAskLovelace,
    getProposalStatus: getGovernanceStatus,
    getProposalType: getEffectiveProposalType,
    getTreasuryWithdrawals: () => Array.isArray(treasuryState?.treasury_withdrawals)
        ? treasuryState.treasury_withdrawals
        : [],
    openActionsOverlay: openGovernanceStatusActionsOverlay,
    removeMenuOverlay: removeGovernanceMenuOverlay
});
const governanceNotifications = window.TDSPGovernanceNotifications.create({
    actionThreshold: GOVERNANCE_ACTION_ALERT_YES_THRESHOLD,
    getProposalTitle,
    getProposalType: getEffectiveProposalType,
    infoActionThreshold: GOVERNANCE_INFO_ACTION_ALERT_YES_THRESHOLD,
    storageKey: GOVERNANCE_NOTIFICATION_STORAGE_KEY
});
const governanceEpochClock = window.TDSPEpochClock.create({
    epochDurationSeconds: EPOCH_DURATION_SECONDS,
    epochZeroMs: CARDANO_MAINNET_EPOCH_ZERO_MS,
    onEpochRollover: () => {
        updateNclEpochCountdown();
        schedulePostEpochGovernanceRefresh();
    }
});
const governanceVoteData = window.TDSPVoteData.create({
    getSpoVoteIdentifier,
    normalizeIdentifier: normalizeGovernanceIdentifier,
    pickFirstNumber
});
const governanceDrepUtils = window.TDSPDrepUtils.create();
const governanceProposalDisplay = window.TDSPProposalDisplay.create({
    formatPercentage,
    getApprovalThreshold: getGovernanceApprovalThreshold,
    getEffectiveProposalType,
    getGovernanceStatus
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    setupGovernanceMenuCards();
    loadCurrentEpoch();
    const hasGovernanceDashboard = Boolean(document.querySelector('#governance, #drep, #gov-spo-card'));
    if (!hasGovernanceDashboard) return;
    removeDrepPowerSplitCard();
    ensureEpochCountdownCard();
    setupTdspDrepStatsCards();
    loadGovernanceActions();
    loadDrepDirectory().catch(() => {});
    loadSpoDirectory().catch(() => {});
    pollSpoRescanStatus();
    loadTreasuryData().catch(() => {});
    loadCatalystFundDirectory().catch(() => {
        window.TDSPRuntime.setText('gov-catalyst-proposals-count', 'Unavailable');
        window.TDSPRuntime.setText('gov-catalyst-funds-count', '$0');
    });
    loadCipDirectory().catch(() => {
        window.TDSPRuntime.setText('gov-cip-count', 'Unavailable');
        window.TDSPRuntime.setText('gov-cip-status', 'CIP cache unavailable');
    });
}

let governanceAssistant = null;

function getGovernanceAssistant() {
    if (governanceAssistant) return governanceAssistant;
    governanceAssistant = window.TDSPGovernanceAssistant.create({
        isLocalPreview: GOVERNANCE_IS_LOCAL_PREVIEW,
        chatApiUrl: CONSTITUTION_CHAT_API_URL,
        feedbackApiUrl: CONSTITUTION_CHAT_FEEDBACK_API_URL,
        documentApiUrl: CONSTITUTION_DOCUMENT_API_URL,
        localChatPath: LOCAL_CONSTITUTION_CHAT_PROXY_PATH,
        localFeedbackPath: LOCAL_CONSTITUTION_CHAT_FEEDBACK_PROXY_PATH,
        localDocumentPath: LOCAL_CONSTITUTION_DOCUMENT_PROXY_PATH,
        fetchJson,
        fetchResponse,
        createOverlay: createGovernanceMenuOverlay,
        removeOverlay: removeGovernanceMenuOverlay,
        getTopOverlay: getTopGovernanceMenuOverlay,
        getRequestContext: getConstitutionChatRequestContext
    });
    return governanceAssistant;
}

function openConstitutionAssistantOverlay(context = null, returnFocus = document.getElementById('tdspbot-open')) {
    return getGovernanceAssistant().open(context, returnFocus);
}

function closeConstitutionAssistantOverlay() {
    return getGovernanceAssistant().close();
}

function openConstitutionDocumentOverlay() {
    return getGovernanceAssistant().openDocument();
}

function closeConstitutionDocumentOverlay() {
    return getGovernanceAssistant().closeDocument();
}

function getConstitutionChatApiUrl() {
    return getGovernanceAssistant().getChatApiUrl();
}

function setupGovernanceMenuCards() {
    [
        ['gov-treasury-card', openTreasuryOverlay],
        ['gov-business-card', openBusinessOverlay],
        ['gov-catalyst-proposals-card', openCatalystFundsOverlay],
        ['gov-cips-card', openCipDirectoryOverlay],
        ['gov-spo-card', openSpoDirectoryOverlay],
        ['spo-nakamoto-card', event => openSpoNakamotoOverlay(event?.currentTarget)],
        ['gov-committee-card', openConstitutionalCommitteeOverlay],
        ['gov-drep-card', openDrepDirectoryOverlay],
        ['gov-drep-top10-card', openTopDrepPowerOverlay],
        ['gov-ncl-card', event => openNclSummaryOverlay(event?.currentTarget || document.getElementById('gov-ncl-card'))],
        ['gov-active-card', () => openGovernanceActionGroupOverlay(
            'active',
            'Active Governance Actions',
            'No active actions found.',
            'Governance Actions'
        )],
        ['gov-rejected-card', () => openGovernanceActionGroupOverlay(
            'rejected',
            'Rejected Governance Actions',
            'No rejected actions found.',
            'Rejected Actions'
        )],
        ['tdspbot-open', event => openConstitutionAssistantOverlay(null, event.currentTarget)],
        ['constitution-document-open', openConstitutionDocumentOverlay]
    ].forEach(([id, openMenu]) => {
        const element = document.getElementById(id);
        if (id === 'tdspbot-open' && element?.dataset.siteBotBound === 'true') return;
        bindGovernanceMenuTrigger(element, openMenu);
    });
}

async function loadCatalystFundDirectory() {
    const payload = await fetchCatalystFundDirectoryPayload();
    catalystFundDirectoryState = payload;
    updateCatalystTreasuryFundingSummary();
    return payload;
}

async function loadCipDirectory() {
    const payload = await fetchCipDirectoryPayload();
    cipDirectoryState = payload;
    const cips = Array.isArray(payload?.cips) ? payload.cips : [];
    const acceptedCount = cips.filter(cip => /^accepted$/i.test(String(cip?.status || ''))).length;
    window.TDSPRuntime.setText('gov-cip-count', cips.length.toLocaleString('en-US'));
    window.TDSPRuntime.setText(
        'gov-cip-status',
        acceptedCount
            ? `${acceptedCount.toLocaleString('en-US')} accepted`
            : 'Cardano Improvement Proposals'
    );
    return payload;
}

async function loadTreasuryData() {
    const [payload, catalystPayload] = await Promise.all([
        fetchTreasuryPayload(),
        fetchCatalystBusinessPayload().catch(() => null)
    ]);
    treasuryState = payload;
    catalystBusinessState = catalystPayload;
    const treasuryLovelace = getTreasuryLovelace(payload);
    if (!Number.isFinite(treasuryLovelace)) throw new Error('Treasury amount is unavailable');

    window.TDSPRuntime.setText('gov-treasury-amount', window.TDSPRuntime.formatTileAdaFromLovelace(treasuryLovelace, { fixedFractionDigits: 2 }));
    const latestIncome = getTreasuryIncomeLovelace(payload);
    const latestEpoch = getTreasuryEpoch(payload);
    window.TDSPRuntime.setText('gov-treasury-epoch', `Treasury Epoch ${latestEpoch ?? '--'}`);
    window.TDSPRuntime.setText(
        'gov-treasury-income',
        Number.isFinite(latestIncome)
            ? `Income ${window.TDSPRuntime.formatTileAdaFromLovelace(latestIncome, { fixedFractionDigits: 2 })}`
            : 'Income ₳ --'
    );
    updateBusinessSummary(payload, catalystPayload);
    if (governanceState) updateNclSummaryTile();
    updateCatalystTreasuryFundingSummary();
}

function fetchTreasuryPayload() {
    if (!treasuryPromise) {
        const url = GOVERNANCE_IS_LOCAL_PREVIEW ? LOCAL_TREASURY_PROXY_PATH : TREASURY_API_URL;
        treasuryPromise = fetchJson(url).catch(error => {
            treasuryPromise = null;
            throw error;
        });
    }
    return treasuryPromise;
}

function fetchTreasuryAdministratorsPayload() {
    if (!treasuryAdministratorsPromise) {
        const url = GOVERNANCE_IS_LOCAL_PREVIEW
            ? LOCAL_TREASURY_ADMINISTRATORS_PROXY_PATH
            : TREASURY_ADMINISTRATORS_API_URL;
        treasuryAdministratorsPromise = fetchJson(url).then(payload => {
            treasuryAdministratorsState = payload;
            return payload;
        }).catch(error => {
            treasuryAdministratorsPromise = null;
            throw error;
        });
    }
    return treasuryAdministratorsPromise;
}

function fetchCatalystBusinessPayload() {
    if (!catalystBusinessPromise) {
        const url = GOVERNANCE_IS_LOCAL_PREVIEW
            ? LOCAL_CATALYST_BUSINESS_PROXY_PATH
            : CATALYST_BUSINESS_API_URL;
        catalystBusinessPromise = fetchJson(url).catch(error => {
            catalystBusinessPromise = null;
            throw error;
        });
    }
    return catalystBusinessPromise;
}

function fetchFundingRecipientsPayload() {
    if (!fundingRecipientsPromise) {
        const url = GOVERNANCE_IS_LOCAL_PREVIEW
            ? LOCAL_FUNDING_RECIPIENTS_PROXY_PATH
            : FUNDING_RECIPIENTS_API_URL;
        fundingRecipientsPromise = fetchJson(url).then(payload => {
            fundingRecipientsState = payload;
            return payload;
        }).catch(error => {
            fundingRecipientsPromise = null;
            throw error;
        });
    }
    return fundingRecipientsPromise;
}

function fetchFundingOverviewPayload() {
    if (!fundingOverviewPromise) {
        const url = GOVERNANCE_IS_LOCAL_PREVIEW
            ? LOCAL_FUNDING_OVERVIEW_PROXY_PATH
            : FUNDING_OVERVIEW_API_URL;
        fundingOverviewPromise = fetchJson(url).then(payload => {
            fundingOverviewState = payload;
            return payload;
        }).catch(error => {
            fundingOverviewPromise = null;
            throw error;
        });
    }
    return fundingOverviewPromise;
}

function fetchCatalystFundDirectoryPayload() {
    if (!catalystFundDirectoryPromise) {
        const url = getCatalystProposalsApiUrl({ funds: true });
        catalystFundDirectoryPromise = fetchJson(url).catch(error => {
            catalystFundDirectoryPromise = null;
            throw error;
        });
    }
    return catalystFundDirectoryPromise;
}

function fetchCatalystProposalDirectoryPayload() {
    if (!catalystProposalDirectoryPromise) {
        const url = getCatalystProposalsApiUrl();
        catalystProposalDirectoryPromise = fetchJson(url)
            .then(payload => {
                catalystProposalDirectoryState = payload;
                return payload;
            })
            .catch(error => {
                catalystProposalDirectoryPromise = null;
                throw error;
            });
    }
    return catalystProposalDirectoryPromise;
}

function getCatalystProposalsApiUrl(options = {}) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams();
        if (options.funds) params.set('type', 'funds');
        if (options.fundName) params.set('fund', options.fundName);
        return `${LOCAL_CATALYST_PROPOSALS_PROXY_PATH}?${params.toString()}`;
    }
    if (options.funds) return `${CATALYST_PROPOSALS_API_URL}/funds`;
    const params = new URLSearchParams();
    if (options.fundName) params.set('fund', options.fundName);
    return `${CATALYST_PROPOSALS_API_URL}${params.size ? `?${params.toString()}` : ''}`;
}

function fetchCipDirectoryPayload() {
    if (!cipDirectoryPromise) {
        cipDirectoryPromise = fetchJson(getCipsApiUrl()).catch(error => {
            cipDirectoryPromise = null;
            throw error;
        });
    }
    return cipDirectoryPromise;
}

function getCipsApiUrl() {
    return GOVERNANCE_IS_LOCAL_PREVIEW ? LOCAL_CIPS_PROXY_PATH : CIPS_API_URL;
}

async function openCipDirectoryOverlay(returnFocus = document.activeElement) {
    return governanceCips.openDirectoryOverlay(returnFocus);
}

function closeCipDirectoryOverlay() {
    governanceCips.closeDirectoryOverlay();
}

function openCipDetailOverlay(cip, returnFocus) {
    governanceCips.openDetailOverlay(cip, returnFocus);
}

function closeCipDetailOverlay() {
    governanceCips.closeDetailOverlay();
}

async function openTreasuryOverlay() {
    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading treasury data...';
    content.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-treasury-overlay',
        titleId: 'governance-treasury-title',
        titleText: 'Cardano Treasury',
        closeLabel: 'Close Cardano treasury',
        closeOverlay: closeTreasuryOverlay,
        bodyNodes: [content],
        headerMeta: treasuryState ? getTreasuryHeaderAmount(treasuryState) : 'Loading...',
        botContext: createTreasuryBotContext(treasuryState)
    });

    try {
        const payload = treasuryState || await fetchTreasuryPayload();
        treasuryState = payload;
        if (!content.isConnected) return;
        await renderTreasuryDetails(content, payload);
        updateGovernanceOverlayBotContext('governance-treasury-overlay', createTreasuryBotContext(payload), content);
        updateGovernanceMenuHeaderMeta(
            'governance-treasury-overlay',
            getTreasuryHeaderAmount(payload),
            content
        );
    } catch {
        if (!content.isConnected) return;
        content.textContent = '';
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Treasury data could not be loaded.';
        content.appendChild(message);
    }
}

function closeTreasuryOverlay() {
    if (treasuryHistoryChart) {
        treasuryHistoryChart.destroy();
        treasuryHistoryChart = null;
    }
    removeGovernanceMenuOverlay('governance-treasury-overlay');
}

async function renderTreasuryDetails(container, payload) {
    container.textContent = '';
    addDetailRow(container, 'Updated', formatTreasuryTimestamp(payload?.updated_at));

    const treasuryWithdrawals = getTreasuryWithdrawals(payload);
    const chart = await createTreasuryHistoryChart(payload, treasuryWithdrawals);
    if (chart) container.appendChild(chart);

    if (!treasuryWithdrawals.length) {
        const empty = window.TDSPRuntime.createSmallText('No enacted treasury withdrawals available.');
        container.appendChild(empty);
        return;
    }

    const administratorPayload = await fetchTreasuryAdministratorsPayload().catch(() => null);
    const administratorGroups = Array.isArray(administratorPayload?.groups)
        ? administratorPayload.groups
        : getTreasuryAdministratorGroups(treasuryWithdrawals);
    container.appendChild(createTreasuryAdministratorList(administratorGroups));
}

function createTreasuryAdministratorList(groupsOrWithdrawals) {
    const groups = Array.isArray(groupsOrWithdrawals?.[0]?.withdrawals)
        ? groupsOrWithdrawals
        : getTreasuryAdministratorGroups(groupsOrWithdrawals);
    const total = groups.reduce((sum, group) => sum + group.value, 0);
    const section = document.createElement('section');

    const title = document.createElement('strong');
    title.textContent = 'Withdrawals by administrator';

    const list = document.createElement('div');
    list.className = 'governance-list governance-action-group-list';
    groups.forEach(group => {
        const percentage = total > 0 ? (group.value / total) * 100 : 0;
        list.appendChild(createTreasuryAdministratorCard(group, percentage));
    });

    section.append(title, list);
    return section;
}

function createTreasuryAdministratorCard(group, percentage) {
    const companyUrls = getTreasuryBusinessWebsiteUrls({
        ...group,
        catalystProjects: []
    });
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card governance-business-card';
    card.dataset.searchText = [
        group.label,
        ...group.withdrawals.flatMap(withdrawal => (
            Array.isArray(withdrawal?.proposers) ? withdrawal.proposers : []
        ))
    ].filter(Boolean).join(' ');
    card.dataset.sortName = group.label;
    card.dataset.sortAmount = String(group.value);
    card.dataset.sortProjects = String(group.withdrawals.length);

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
        openTreasuryAdministratorWithdrawalsOverlay(group, event.currentTarget);
    }, {
        datasetKey: 'administratorBound',
        errorMessage: 'Treasury administrator could not be opened.'
    });

    const amount = createFundingRecipientAmountRow(group.value, group.adaValue, false);
    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: group.label,
        primaryNode: amount,
        detailItems: [
            `${group.withdrawals.length.toLocaleString('en-US')} withdrawal${group.withdrawals.length === 1 ? '' : 's'}`,
            formatPercentage(percentage)
        ]
    });
    card.appendChild(openButton);

    const companyLinks = createTreasuryBusinessWebsiteLinks(companyUrls);
    if (companyLinks) card.appendChild(companyLinks);

    const companyLogo = createTreasuryBusinessLogo(companyUrls, group?.label);
    if (companyLogo) {
        card.classList.add('has-company-logo');
        card.appendChild(companyLogo);
    }
    return card;
}

function getTreasuryAdministratorGroups(withdrawals) {
    const groups = new Map();
    withdrawals.forEach(withdrawal => {
        const recipientAdministrator = getTreasuryWithdrawalAdministrator(withdrawal)
            || String(withdrawal?.stake_address || '').trim()
            || 'Unknown administrator';
        const administrator = /^Amaru\b/i.test(recipientAdministrator)
            ? 'PRAGMA'
            : normalizeTreasuryBusinessName(recipientAdministrator);
        const group = groups.get(administrator) || {
            key: administrator,
            label: administrator,
            value: 0,
            adaValue: 0,
            withdrawals: []
        };
        group.value += Number(withdrawal?.amount_usd) || 0;
        group.adaValue += Number(withdrawal?.amount_ada) || 0;
        group.withdrawals.push(withdrawal);
        groups.set(administrator, group);
    });

    return [...groups.values()]
        .sort((left, right) => right.value - left.value);
}

function getTreasuryWithdrawalAdministrator(withdrawal) {
    const address = String(withdrawal?.stake_address || '');
    return TREASURY_RECIPIENT_ADMINISTRATORS[address] || null;
}

function openTreasuryAdministratorWithdrawalsOverlay(group, returnFocus) {
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    group.withdrawals.forEach(withdrawal => {
        panel.appendChild(createTreasuryWithdrawalCard(withdrawal));
    });

    createGovernanceMenuOverlay({
        id: 'governance-treasury-administrator-overlay',
        titleId: 'governance-treasury-administrator-title',
        titleText: group.label,
        closeLabel: `Close withdrawals for ${group.label}`,
        closeOverlay: closeTreasuryAdministratorWithdrawalsOverlay,
        bodyNodes: [panel],
        headerMeta: `${group.withdrawals.length.toLocaleString('en-US')} withdrawals • ${formatCatalystCurrencyAmount(group.value, 'USD', true)}`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        botContext: createTreasuryAdministratorBotContext(group)
    });
}

function closeTreasuryAdministratorWithdrawalsOverlay() {
    removeGovernanceMenuOverlay('governance-treasury-administrator-overlay');
}

function getTreasuryBusinessGroups(payload, catalystPayload = catalystBusinessState) {
    const groups = new Map();
    getTreasuryWithdrawals(payload).forEach(withdrawal => {
        const proposer = getTreasuryBusinessName(withdrawal);
        const key = proposer.toLocaleLowerCase('en-US');
        const group = groups.get(key) || {
            key,
            label: proposer,
            value: 0,
            adaValue: 0,
            usdPending: false,
            withdrawals: [],
            catalystProjects: []
        };
        if (hasNumericValue(withdrawal?.amount_usd)) {
            group.value += Number(withdrawal.amount_usd);
        } else {
            group.usdPending = true;
        }
        group.adaValue += Number(withdrawal?.amount_ada) || 0;
        group.withdrawals.push(withdrawal);
        groups.set(key, group);
    });
    getCatalystBusinessProjects(catalystPayload).forEach(project => {
        const business = resolveTreasuryBusinessText(project?.business);
        if (!business) return;
        const key = business.toLocaleLowerCase('en-US');
        const group = groups.get(key) || {
            key,
            label: business,
            value: 0,
            adaValue: 0,
            usdPending: false,
            withdrawals: [],
            catalystProjects: []
        };
        if (hasNumericValue(project?.amount_received_usd)) {
            group.value += Number(project.amount_received_usd);
        } else {
            group.usdPending = true;
        }
        group.adaValue += Number(project?.amount_received_ada) || 0;
        group.catalystProjects.push(project);
        groups.set(key, group);
    });
    return [...groups.values()].sort((left, right) => (
        right.value - left.value
        || left.label.localeCompare(right.label)
    ));
}

function getCatalystTeamSearchTerms(project) {
    return [
        project?.business,
        ...(Array.isArray(project?.submitters) ? project.submitters : []),
        ...(Array.isArray(project?.team) ? project.team : [])
    ].flatMap(member => typeof member === 'string' ? [member] : [
        member?.name,
        member?.username
    ]).flatMap(value => {
        const raw = String(value || '').trim();
        const normalized = normalizeCatalystTeamMemberDisplayName(raw);
        return [raw, normalized].filter(Boolean);
    });
}

function getCatalystMultiSearchQueries(normalizedQuery) {
    return String(normalizedQuery || '')
        .split(',')
        .map(query => query.trim())
        .filter(Boolean);
}

function matchesCatalystMultiSearch(searchTerms, queries) {
    if (!queries.length) return false;
    const normalizedTerms = searchTerms
        .map(window.TDSPRuntime.normalizeSearchText)
        .map(term => term.trim())
        .filter(Boolean);
    const exactBusinessQueries = new Set(
        Object.values(TREASURY_BUSINESS_ALIASES)
            .map(window.TDSPRuntime.normalizeSearchText)
            .map(term => term.trim())
            .filter(Boolean)
    );
    return queries.some(query => normalizedTerms.some(term => {
        if (!exactBusinessQueries.has(query)) return term.includes(query);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(term);
    }));
}

function getFundingRecipientSearchTerms(group) {
    return [
        group?.label,
        ...(Array.isArray(group?.catalystProjects)
            ? group.catalystProjects.flatMap(getCatalystTeamSearchTerms)
            : []),
        ...(Array.isArray(group?.withdrawals)
            ? group.withdrawals.flatMap(withdrawal => (
                Array.isArray(withdrawal?.proposers) ? withdrawal.proposers : []
            ))
            : [])
    ].filter(Boolean);
}

function getCatalystProposalUsdTotals(proposals) {
    return (Array.isArray(proposals) ? proposals : []).reduce((totals, proposal) => ({
        asked: totals.asked + (Number(proposal?.amount_requested_usd) || 0),
        received: totals.received + (Number(proposal?.amount_received_usd) || 0)
    }), { asked: 0, received: 0 });
}

function getCatalystFundTotals(funds) {
    return (Array.isArray(funds) ? funds : []).reduce((totals, fund) => ({
        count: totals.count + (Number(fund?.proposal_count) || 0),
        fundedUsd: totals.fundedUsd + (Number(fund?.requested_amount) || 0),
        claimedUsd: totals.claimedUsd + (Number(fund?.claimed_amount) || 0),
        fundedAda: totals.fundedAda + (Number(fund?.requested_ada) || 0),
        claimedAda: totals.claimedAda + (Number(fund?.claimed_ada) || 0)
    }), {
        count: 0,
        fundedUsd: 0,
        claimedUsd: 0,
        fundedAda: 0,
        claimedAda: 0
    });
}

function getApprovedGovernanceFundingActions() {
    const approved = Array.isArray(governanceGroupsState?.approved)
        ? governanceGroupsState.approved
        : [];
    return approved;
}

function getApprovedGovernanceFundingTotals(actions = getApprovedGovernanceFundingActions()) {
    const totals = actions.reduce((runningTotals, proposal) => {
        const lovelace = getProposalTotalAskLovelace(proposal);
        const ada = Number.isFinite(lovelace) ? lovelace / 1_000_000 : 0;
        const usd = getApprovedTreasuryFundingUsd(proposal);
        const hasUsd = Number.isFinite(Number(usd));
        return {
            count: runningTotals.count + 1,
            usd: runningTotals.usd + (hasUsd ? Number(usd) : 0),
            ada: runningTotals.ada + (Number(ada) || 0),
            usdCount: runningTotals.usdCount + (hasUsd ? 1 : 0),
            usdMissingCount: runningTotals.usdMissingCount + (hasUsd ? 0 : 1)
        };
    }, { count: 0, usd: 0, ada: 0, usdCount: 0, usdMissingCount: 0 });
    return {
        ...totals,
        usdPending: totals.usdCount === 0 && totals.ada > 0
    };
}

function getApprovedTreasuryFundingUsd(proposal) {
    const directUsd = Number(proposal?.amount_usd ?? proposal?.requested_usd ?? proposal?.total_amount_usd);
    if (Number.isFinite(directUsd) && directUsd > 0) return directUsd;

    const withdrawalUsd = getTreasuryWithdrawals(treasuryState || {})
        .filter(withdrawal => withdrawal?.action_id === proposal?.proposal_id)
        .reduce((sum, withdrawal) => sum + (Number(withdrawal?.amount_usd) || 0), 0);
    if (withdrawalUsd > 0) return withdrawalUsd;
    return NaN;
}

function updateCatalystTreasuryFundingSummary() {
    const funds = Array.isArray(catalystFundDirectoryState?.funds)
        ? catalystFundDirectoryState.funds
        : [];
    const catalystTotals = getCatalystFundTotals(funds);
    const treasuryTotals = getApprovedGovernanceFundingTotals();
    const totalCount = catalystTotals.count + treasuryTotals.count;
    const totalUsd = catalystTotals.claimedUsd + treasuryTotals.usd;
    window.TDSPRuntime.setText(
        'gov-catalyst-proposals-count',
        totalCount ? totalCount.toLocaleString('en-US') : '0'
    );
    window.TDSPRuntime.setText(
        'gov-catalyst-funds-count',
        formatCatalystCurrencyAmount(totalUsd, 'USD', true)
    );
}

function getFundingRecipientUsdTotals(groups) {
    return (Array.isArray(groups) ? groups : []).reduce((totals, group) => {
        const catalystAsked = group.catalystProjects.reduce(
            (sum, project) => sum + (Number(project?.amount_requested_usd) || 0),
            0
        );
        const treasuryAsked = group.withdrawals.reduce(
            (sum, withdrawal) => sum + (Number(withdrawal?.amount_usd) || 0),
            0
        );
        return {
            asked: totals.asked + catalystAsked + treasuryAsked,
            received: totals.received + (Number(group?.value) || 0),
            pending: totals.pending || group?.usdPending === true
        };
    }, { asked: 0, received: 0, pending: false });
}

function getCatalystBusinessProjects(payload) {
    return (Array.isArray(payload?.projects) ? payload.projects : []).flatMap(project => {
        const amountUsd = Number(project?.amount_received_usd);
        const legacyAmountAda = Number(project?.amount_received_lovelace) / 1_000_000;
        const id = String(project?.id || '').trim();
        const title = String(project?.title || '').trim();
        if (
            !id
            || !title
            || (
                (!Number.isFinite(amountUsd) || amountUsd <= 0)
                && (!Number.isFinite(legacyAmountAda) || legacyAmountAda <= 0)
            )
        ) return [];
        const sourceAmountAda = Number(project?.amount_received);
        const amountAda = project?.currency === 'ADA' && Number.isFinite(sourceAmountAda)
            ? sourceAmountAda
            : Number.isFinite(legacyAmountAda) && legacyAmountAda > 0
                ? legacyAmountAda
                : null;
        return [{
            id,
            title,
            business: resolveCatalystBusinessName(project?.business),
            currency: project?.currency || null,
            amount_received_usd: hasNumericValue(project?.amount_received_usd)
                ? amountUsd
                : null,
            amount_requested_usd: Number(project?.amount_requested_usd),
            amount_received_ada: Number.isFinite(amountAda) ? amountAda : null,
            amount_requested_ada: project?.currency === 'ADA'
                && Number.isFinite(Number(project?.amount_requested))
                ? Number(project.amount_requested)
                : null,
            amount_received_lovelace: project?.amount_received_lovelace || null,
            amount_requested_lovelace: project?.amount_requested_lovelace || null,
            project_status: project?.project_status || null,
            funding_status: project?.funding_status || null,
            fund_name: project?.fund_name || null,
            submitters: Array.isArray(project?.submitters) ? project.submitters : [],
            source: project?.source || payload?.source || 'project_catalyst_official',
            website: project?.website || null,
            source_url: project?.source_url || null
        }];
    });
}

const fundingDirectory = window.TDSPFundingDirectory.create();
const TREASURY_BUSINESS_ALIASES = fundingDirectory.businessAliases;
const TREASURY_BUSINESS_WEBSITES = fundingDirectory.businessWebsites;
const TREASURY_BUSINESS_LOGOS = fundingDirectory.businessLogos;
const TREASURY_BUSINESS_LOGOS_BY_DOMAIN = fundingDirectory.businessLogosByDomain;

function normalizeCatalystTeamMemberDisplayName(value) {
    return fundingDirectory.normalizeTeamMemberDisplayName(value);
}

function normalizeTreasuryBusinessName(value) {
    return fundingDirectory.normalizeBusinessName(value);
}

function resolveTreasuryBusinessText(value) {
    return fundingDirectory.resolveBusinessText(value);
}

function resolveTreasuryAdministratorBusinessText(value) {
    return fundingDirectory.resolveAdministratorBusinessText(value);
}

function resolveCatalystBusinessName(value) {
    return fundingDirectory.resolveCatalystBusinessName(value);
}

function getTreasuryBusinessName(withdrawal) {
    return fundingDirectory.getTreasuryBusinessName(withdrawal);
}

function updateBusinessSummary(payload, catalystPayload = catalystBusinessState) {
    const groups = Array.isArray(fundingRecipientsState?.groups)
        ? fundingRecipientsState.groups
        : getTreasuryBusinessGroups(payload, catalystPayload);
    const total = Number(fundingRecipientsState?.totals?.received_usd) || groups.reduce((sum, group) => sum + group.value, 0);
    const usdPending = fundingRecipientsState?.totals?.pending === true || groups.some(group => group.usdPending);
    window.TDSPRuntime.setText('gov-business-count', groups.length.toLocaleString('en-US'));
    window.TDSPRuntime.setText(
        'gov-business-total-usd',
        usdPending
            ? 'USD updating'
            : formatCatalystCurrencyAmount(total, 'USD', true)
    );
}

async function openBusinessOverlay(returnFocus = document.activeElement) {
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading Catalyst/Treasury recipients...';
    panel.appendChild(loading);

    let groups = [];
    let directoryReady = false;
    let renderedSignature = '';
    const renderRecipients = normalizedQuery => {
        if (!directoryReady) return false;
        const queries = getCatalystMultiSearchQueries(normalizedQuery);
        const matchingGroups = queries.length
            ? groups.filter(group => matchesCatalystMultiSearch(
                getFundingRecipientSearchTerms(group),
                queries
            ))
            : [];
        const showMatches = matchingGroups.length > 0;
        const visibleGroups = showMatches ? matchingGroups : groups;
        const signature = showMatches
            ? `recipients:${matchingGroups.map(group => group.key).join('|')}`
            : 'recipients:all';
        if (signature === renderedSignature) return showMatches;
        renderedSignature = signature;
        panel.replaceChildren();
        visibleGroups.forEach(group => {
            panel.appendChild(createTreasuryBusinessCard(group));
        });
        if (!visibleGroups.length) {
            const empty = window.TDSPRuntime.createSmallText('No Catalyst/Treasury recipient data is available yet.');
            panel.appendChild(empty);
        }
        const totals = getFundingRecipientUsdTotals(visibleGroups);
        updateGovernanceMenuHeaderMeta(
            'governance-business-overlay',
            totals.pending
                ? 'Asked/received USD updating'
                : `Asked ${formatCatalystCurrencyAmount(totals.asked, 'USD', true)} • Received ${formatCatalystCurrencyAmount(totals.received, 'USD', true)}`,
            panel
        );
        return showMatches;
    };

    createGovernanceMenuOverlay({
        id: 'governance-business-overlay',
        titleId: 'governance-business-title',
        titleText: 'Catalyst/Treasury Recipients',
        closeLabel: 'Close Catalyst/Treasury recipients',
        closeOverlay: closeBusinessOverlay,
        bodyNodes: [panel],
        headerMeta: 'Loading...',
        returnFocus,
        rootTitle: 'Catalyst/Treasury Recipients',
        defaultSort: 'amount-desc',
        searchPlaceholder: 'Search proposers or team members, separated by commas',
        onSearch: renderRecipients,
        botContext: createWebsiteSectionBotContext('Catalyst/Treasury Recipients', {
            title: 'Catalyst/Treasury Recipients',
            summary: 'Funding recipients from Catalyst and enacted treasury withdrawals'
        })
    });

    try {
        const recipientPayload = await fetchFundingRecipientsPayload().catch(() => null);
        let payload = treasuryState;
        let catalystPayload = catalystBusinessState;
        if (Array.isArray(recipientPayload?.groups)) {
            groups = recipientPayload.groups;
            fundingRecipientsState = recipientPayload;
        } else {
            [payload, catalystPayload] = await Promise.all([
                treasuryState || fetchTreasuryPayload(),
                catalystBusinessState || fetchCatalystBusinessPayload().catch(() => null)
            ]);
            treasuryState = payload;
            catalystBusinessState = catalystPayload;
            groups = getTreasuryBusinessGroups(payload, catalystPayload);
        }
        if (!panel.isConnected) return;
        directoryReady = true;
        renderedSignature = '';
        renderRecipients('');
        updateGovernanceOverlayBotContext(
            'governance-business-overlay',
            createWebsiteSectionBotContext('Catalyst/Treasury Recipients', {
                title: 'Catalyst/Treasury Recipients',
                count: groups.length,
                amount_usd: Number(recipientPayload?.totals?.received_usd) || getFundingRecipientUsdTotals(groups).received,
                summary: `${groups.length.toLocaleString('en-US')} recipients`
            }),
            panel
        );
        updateBusinessSummary(payload, catalystPayload);
    } catch {
        if (!panel.isConnected) return;
        panel.textContent = '';
        const error = document.createElement('p');
        error.className = 'small-text';
        error.textContent = 'Funding recipient data could not be loaded.';
        panel.appendChild(error);
    }
}

function createCatalystFundingStatusChart(payload) {
    const status = getCatalystFundingStatus(payload);
    if (!status || status.requested <= 0) return null;

    const groups = [
        {
            key: 'claimed',
            label: 'Claimed',
            value: status.claimed,
            color: '#34d399',
            currency: 'USD',
            projects: status.projects.filter(project => (
                Number(project.claimed_usd) > 0
            )),
            amountField: 'claimed_usd',
            requestedField: 'requested_usd'
        },
        {
            key: 'not-claimed',
            label: 'Not Claimed',
            value: status.notClaimed,
            color: '#fb7185',
            currency: 'USD',
            projects: status.projects.filter(project => (
                Number(project.not_claimed_usd) > 0
            )),
            amountField: 'not_claimed_usd',
            requestedField: 'requested_usd'
        }
    ].filter(group => group.value > 0);
    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = 'Catalyst funding status';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    layout.appendChild(createUniversalPieChart(groups, {
        labelFormatter: segment => (
            ((segment.end - segment.start) / 360) >= 0.03
                ? formatCatalystCurrencyAmount(segment.value, 'USD', true)
                : ''
        ),
        onSegmentClick: (segment, returnFocus) => (
            openCatalystFundingProjectsOverlay(segment, returnFocus)
        ),
        showSegmentSeparators: true
    }));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        const percentage = status.requested > 0
            ? (group.value / status.requested) * 100
            : 0;
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${formatCatalystCurrencyAmount(group.value, 'USD')} • ${formatPercentage(percentage)}`,
            color: group.color,
            onClick: event => openCatalystFundingProjectsOverlay(group, event.currentTarget)
        }));
    });

    const projects = document.createElement('span');
    projects.className = 'governance-card-detail';
    projects.textContent = `${status.projectCount.toLocaleString('en-US')} in-progress projects`;

    layout.appendChild(legend);
    section.append(title, projects, layout);
    return section;
}

function createCatalystProposalFundingOverview(funds, proposals, businessPayload, approvedGovernanceActions = [], overviewPayload = fundingOverviewState) {
    const detailedProjects = getCatalystFundingProjects(businessPayload);
    const detailsById = new Map(
        detailedProjects.map(project => [String(project?.id || ''), project])
    );
    const directoryProjects = (Array.isArray(proposals) ? proposals : []).flatMap(project => {
            const requestedUsd = Number(project?.amount_requested_usd);
            if (!Number.isFinite(requestedUsd) || requestedUsd <= 0) return [];
            const claimedUsd = Math.min(
                Math.max(Number(project?.amount_received_usd) || 0, 0),
                requestedUsd
            );
            const currency = String(project?.currency || '').toUpperCase();
            const detail = detailsById.get(String(project?.id || '')) || {};
            return [{
                ...detail,
                ...project,
                currency,
                amount_requested: currency === 'ADA'
                    ? Number(project?.amount_requested_ada ?? project?.amount_requested) || 0
                    : project?.amount_requested,
                amount_received: currency === 'ADA'
                    ? Number(project?.amount_received_ada ?? project?.amount_received) || 0
                    : project?.amount_received,
                requested_usd: requestedUsd,
                claimed_usd: claimedUsd,
                not_claimed_usd: Math.max(requestedUsd - claimedUsd, 0)
            }];
        });
    const projects = directoryProjects.length ? directoryProjects : detailedProjects;
    const claimed = (Array.isArray(funds) ? funds : []).reduce(
        (sum, fund) => sum + (Number(fund?.claimed_amount) || 0),
        0
    );
    const unclaimed = (Array.isArray(funds) ? funds : []).reduce(
        (sum, fund) => sum + (Number(fund?.not_claimed_amount) || 0),
        0
    );
    const fallbackClaimed = projects.reduce(
        (sum, project) => sum + (Number(project?.claimed_usd) || 0),
        0
    );
    const fallbackUnclaimed = projects.reduce(
        (sum, project) => sum + (Number(project?.not_claimed_usd) || 0),
        0
    );
    const totalClaimed = claimed > 0 ? claimed : fallbackClaimed;
    const totalUnclaimed = unclaimed > 0 ? unclaimed : fallbackUnclaimed;
    const treasuryTotals = getApprovedGovernanceFundingTotals(approvedGovernanceActions);
    const totalTreasury = Number(treasuryTotals.usd) || 0;

    const createGroup = (key, label, value, color, field, adaValueOverride = null) => {
        const matchingProjects = projects.filter(project => Number(project?.[field]) > 0);
        const adaValue = adaValueOverride ?? matchingProjects.reduce((sum, project) => {
            if (String(project?.currency || '').toUpperCase() !== 'ADA') return sum;
            const requestedAda = Math.max(Number(project?.amount_requested) || 0, 0);
            const receivedAda = Math.min(
                Math.max(Number(project?.amount_received) || 0, 0),
                requestedAda
            );
            return sum + (
                key === 'claimed'
                    ? receivedAda
                    : Math.max(requestedAda - receivedAda, 0)
            );
        }, 0);
        return {
            key,
            label,
            value,
            color,
            currency: 'USD',
            projects: matchingProjects,
            amountField: field,
            requestedField: 'requested_usd',
            adaValue,
            rootTitle: 'Catalyst/Treasury Funding'
        };
    };
    const cachedGroups = Array.isArray(overviewPayload?.groups) ? overviewPayload.groups : [];
    const groups = cachedGroups.length
        ? cachedGroups.map(group => {
            const key = String(group?.key || '').trim();
            if (key === 'approved-governance') {
                return {
                    key,
                    label: group?.label || 'Approved Treasury',
                    value: Number(group?.value) || 0,
                    color: group?.color || '#fbbf24',
                    currency: group?.currency || 'USD',
                    actions: approvedGovernanceActions,
                    adaValue: Number(group?.adaValue) || treasuryTotals.ada,
                    rootTitle: 'Catalyst/Treasury Funding'
                };
            }
            const field = key === 'unclaimed' ? 'not_claimed_usd' : 'claimed_usd';
            return createGroup(
                key,
                group?.label || (key === 'unclaimed' ? 'Unclaimed' : 'Claimed'),
                Number(group?.value) || 0,
                group?.color || (key === 'unclaimed' ? '#fb7185' : '#34d399'),
                field,
                Number(group?.adaValue) || null
            );
        }).filter(group => group.value > 0)
        : [
            createGroup('claimed', 'Claimed', totalClaimed, '#34d399', 'claimed_usd'),
            createGroup('unclaimed', 'Unclaimed', totalUnclaimed, '#fb7185', 'not_claimed_usd'),
            {
                key: 'approved-governance',
                label: 'Approved Treasury',
                value: totalTreasury,
                color: '#fbbf24',
                currency: 'USD',
                actions: approvedGovernanceActions,
                adaValue: treasuryTotals.ada,
                rootTitle: 'Catalyst/Treasury Funding'
            }
        ].filter(group => group.value > 0);
    const total = Number(overviewPayload?.totals?.usd) > 0
        ? Number(overviewPayload.totals.usd)
        : groups.reduce((sum, group) => sum + (Number(group.value) || 0), 0);
    if (total <= 0) return null;

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = 'Catalyst/Treasury funding';

    const projectsLabel = document.createElement('span');
    projectsLabel.className = 'governance-card-detail';
    projectsLabel.textContent = `${projects.length.toLocaleString('en-US')} funded projects`;

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    layout.appendChild(createUniversalPieChart(groups, {
        labelFormatter: segment => (
            ((segment.end - segment.start) / 360) >= 0.03
                ? formatCatalystCurrencyAmount(segment.value, 'USD', true)
                : ''
        ),
        onSegmentClick: (segment, returnFocus) => {
            if (segment.key === 'approved-governance') {
                openApprovedGovernanceFundingOverlay(segment.actions || [], returnFocus);
                return;
            }
            openCatalystFundingProjectsOverlay(segment, returnFocus);
        },
        showSegmentSeparators: true
    }));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${formatCatalystCurrencyAmount(group.value, 'USD')} • ${formatPercentage((group.value / total) * 100)}`,
            color: group.color,
            onClick: event => {
                if (group.key === 'approved-governance') {
                    openApprovedGovernanceFundingOverlay(group.actions || [], event.currentTarget);
                    return;
                }
                openCatalystFundingProjectsOverlay(group, event.currentTarget);
            }
        }));
    });
    layout.appendChild(legend);
    section.append(title, projectsLabel, layout);
    return section;
}

function getCatalystFundingStatus(payload) {
    const cached = payload?.funding_status;
    const requested = Number(cached?.requested_usd);
    const claimed = Number(cached?.claimed_usd);
    const notClaimed = Number(cached?.not_claimed_usd);
    const rounds = (Array.isArray(cached?.rounds) ? cached.rounds : []).flatMap(round => {
        const roundRequested = Number(round?.requested_usd);
        const roundClaimed = Number(round?.claimed_usd);
        const roundNotClaimed = Number(round?.not_claimed_usd);
        const fundName = String(round?.fund_name || '').trim();
        if (
            !fundName
            || !Number.isFinite(roundRequested)
            || !Number.isFinite(roundClaimed)
            || !Number.isFinite(roundNotClaimed)
        ) return [];
        return [{
            fundName,
            projectCount: Number(round?.project_count) || 0,
            requested: roundRequested,
            claimed: roundClaimed,
            notClaimed: roundNotClaimed
        }];
    });
    const fundingProjects = getCatalystFundingProjects(payload);
    if (
        Number.isFinite(requested)
        && requested > 0
        && Number.isFinite(claimed)
        && Number.isFinite(notClaimed)
        && rounds.length
    ) {
        return {
            projectCount: Number(cached?.project_count) || 0,
            requested,
            claimed,
            notClaimed,
            rounds,
            projects: fundingProjects
        };
    }

    const projects = getCatalystBusinessProjects(payload).filter(project => (
        project.project_status === 'in_progress'
        && Number(project.amount_requested_usd) > 0
    ));
    if (!projects.length) return null;
    const fallbackRequested = projects.reduce(
        (sum, project) => sum + Number(project.amount_requested_usd || 0),
        0
    );
    const fallbackClaimed = projects.reduce(
        (sum, project) => sum + Math.min(
            Number(project.amount_received_usd || 0),
            Number(project.amount_requested_usd || 0)
        ),
        0
    );
    return {
        projectCount: projects.length,
        requested: fallbackRequested,
        claimed: fallbackClaimed,
        notClaimed: Math.max(fallbackRequested - fallbackClaimed, 0),
        rounds: [{
            fundName: 'All rounds',
            projectCount: projects.length,
            requested: fallbackRequested,
            claimed: fallbackClaimed,
            notClaimed: Math.max(fallbackRequested - fallbackClaimed, 0)
        }],
        projects: projects.map(project => ({
            id: project.id,
            title: project.title,
            business: project.business,
            fund_name: 'All rounds',
            currency: project.currency,
            amount_requested: project.amount_requested_ada,
            amount_received: project.amount_received_ada,
            requested_usd: project.amount_requested_usd,
            claimed_usd: project.amount_received_usd,
            not_claimed_usd: Math.max(
                Number(project.amount_requested_usd || 0)
                - Number(project.amount_received_usd || 0),
                0
            ),
            website: project.website,
            source_url: project.source_url
        }))
    };
}

function getCatalystFundingProjects(payload) {
    return (Array.isArray(payload?.funding_projects) ? payload.funding_projects : []).flatMap(project => {
        const id = String(project?.id || '').trim();
        const title = String(project?.title || '').trim();
        const fundName = String(project?.fund_name || '').trim();
        const requested = Number(project?.requested_usd);
        const claimed = Number(project?.claimed_usd);
        const notClaimed = Number(project?.not_claimed_usd);
        if (
            !id
            || !title
            || !fundName
            || !Number.isFinite(requested)
            || !Number.isFinite(claimed)
            || !Number.isFinite(notClaimed)
        ) return [];
        return [{
            id,
            title,
            business: resolveCatalystBusinessName(project?.business),
            fund_name: fundName,
            currency: project?.currency || null,
            amount_requested: project?.amount_requested,
            amount_received: project?.amount_received,
            submitters: Array.isArray(project?.submitters) ? project.submitters : [],
            requested_usd: requested,
            claimed_usd: claimed,
            not_claimed_usd: notClaimed,
            website: project?.website || null,
            source_url: project?.source_url || null
        }];
    });
}

async function openCatalystFundsOverlay(returnFocus = document.activeElement) {
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading Catalyst and Treasury funding...';
    panel.appendChild(loading);

    let funds = [];
    let proposals = [];
    let approvedGovernanceActions = [];
    let fundingChart = null;
    let renderedSignature = '';
    let directoryReady = false;
    const renderDirectory = normalizedQuery => {
        if (!directoryReady) return false;
        const teamQueries = getCatalystMultiSearchQueries(normalizedQuery);
        const teamMatches = teamQueries.length
            ? proposals.filter(proposal => matchesCatalystMultiSearch(
                getCatalystTeamSearchTerms(proposal),
                teamQueries
            ))
            : [];
        const showTeamMatches = teamMatches.length > 0;
        const visibleProposals = showTeamMatches ? teamMatches : proposals;
        const signature = showTeamMatches
            ? `team:${teamMatches.map(proposal => proposal.id).join('|')}`
            : 'funds';
        if (signature === renderedSignature) return showTeamMatches;
        renderedSignature = signature;
        panel.replaceChildren();
        if (showTeamMatches) {
            teamMatches.forEach(proposal => {
                panel.appendChild(createCatalystProposalCard(proposal));
            });
        } else {
            if (fundingChart) panel.appendChild(fundingChart);
            if (approvedGovernanceActions.length) {
                panel.appendChild(createApprovedGovernanceFundingCard(approvedGovernanceActions));
            }
            funds.forEach(fund => {
                panel.appendChild(createCatalystFundCard(fund));
            });
            if (!funds.length && !approvedGovernanceActions.length) {
                const empty = window.TDSPRuntime.createSmallText('No Catalyst or Treasury funding data is available yet.');
                panel.appendChild(empty);
            }
        }
        const totals = showTeamMatches
            ? getCatalystProposalUsdTotals(visibleProposals)
            : getCatalystTreasuryFundingOverlayTotals(funds, approvedGovernanceActions);
        updateGovernanceMenuHeaderMeta(
            'governance-catalyst-funds-overlay',
            formatCatalystTreasuryFundingHeader(totals),
            panel
        );
        return showTeamMatches;
    };

    createGovernanceMenuOverlay({
        id: 'governance-catalyst-funds-overlay',
        titleId: 'governance-catalyst-funds-title',
        titleText: 'Catalyst/Treasury Funding',
        closeLabel: 'Close Catalyst and Treasury funding',
        closeOverlay: closeCatalystFundsOverlay,
        bodyNodes: [panel],
        headerMeta: 'Loading...',
        returnFocus,
        rootTitle: 'Catalyst/Treasury Funding',
        defaultSort: 'fund-desc',
        searchPlaceholder: 'Search proposers or team members, separated by commas',
        onSearch: renderDirectory,
        botContext: createWebsiteSectionBotContext('Catalyst/Treasury Funding', {
            title: 'Catalyst/Treasury Funding',
            summary: 'Funded Catalyst proposals and approved Treasury governance actions'
        })
    });

    try {
        const [payload, proposalPayload, businessPayload, fundingOverviewPayload] = await Promise.all([
            catalystFundDirectoryState || loadCatalystFundDirectory(),
            catalystProposalDirectoryState || fetchCatalystProposalDirectoryPayload(),
            catalystBusinessState || fetchCatalystBusinessPayload().catch(() => null),
            fundingOverviewState || fetchFundingOverviewPayload().catch(() => null)
        ]);
        if (!panel.isConnected) return;
        catalystBusinessState = businessPayload;
        funds = normalizeCatalystFunds(payload);
        proposals = Array.isArray(proposalPayload?.proposals)
            ? proposalPayload.proposals
            : [];
        approvedGovernanceActions = getApprovedGovernanceFundingActions();
        const overlayTotals = getCatalystTreasuryFundingOverlayTotals(funds, approvedGovernanceActions);
        updateGovernanceOverlayBotContext(
            'governance-catalyst-funds-overlay',
            createWebsiteSectionBotContext('Catalyst/Treasury Funding', {
                title: 'Catalyst/Treasury Funding',
                count: overlayTotals.count,
                amount_usd: overlayTotals.claimed,
                amount_ada: overlayTotals.ada,
                root: 'Catalyst/Treasury Funding',
                summary: `${funds.length.toLocaleString('en-US')} funds • ${approvedGovernanceActions.length.toLocaleString('en-US')} approved treasury actions`
            }),
            panel
        );
        fundingChart = createCatalystProposalFundingOverview(
            funds,
            proposals,
            businessPayload,
            approvedGovernanceActions,
            fundingOverviewPayload
        );
        directoryReady = true;
        renderedSignature = '';
        renderDirectory('');
    } catch (loadError) {
        console.error('Catalyst funds could not be rendered', loadError);
        if (!panel.isConnected) return;
        panel.replaceChildren();
        const error = document.createElement('p');
        error.className = 'small-text';
        error.textContent = 'Catalyst funds could not be loaded.';
        panel.appendChild(error);
    }
}

function normalizeCatalystFunds(payload) {
    return (Array.isArray(payload?.funds) ? payload.funds : []).flatMap(fund => {
        const fundName = String(fund?.fund_name || '').trim();
        const proposalCount = Number(fund?.proposal_count);
        if (!fundName || !Number.isFinite(proposalCount)) return [];
        return [{
            fund_name: fundName,
            proposal_count: proposalCount,
            ada_proposal_count: Number(fund?.ada_proposal_count) || 0,
            funded_project_count: Number(fund?.funded_project_count) || 0,
            funding_currency: String(fund?.funding_currency || '').toUpperCase() || null,
            requested_amount: Number(fund?.requested_amount) || 0,
            claimed_amount: Number(fund?.claimed_amount) || 0,
            not_claimed_amount: Number(fund?.not_claimed_amount) || 0,
            requested_ada: Number(fund?.requested_ada) || 0,
            claimed_ada: Number(fund?.claimed_ada) || 0,
            not_claimed_ada: Number(fund?.not_claimed_ada) || 0,
            conversion_missing_count: Number(fund?.conversion_missing_count) || 0,
        }];
    }).sort((left, right) => (
        getCatalystFundNumber(right.fund_name) - getCatalystFundNumber(left.fund_name)
        || left.fund_name.localeCompare(right.fund_name, 'en-US')
    ));
}

function getCatalystTreasuryFundingOverlayTotals(funds, approvedGovernanceActions) {
    const catalystTotals = getCatalystFundTotals(funds);
    const treasuryTotals = getApprovedGovernanceFundingTotals(approvedGovernanceActions);
    return {
        count: catalystTotals.count + treasuryTotals.count,
        asked: catalystTotals.fundedUsd + treasuryTotals.usd,
        claimed: catalystTotals.claimedUsd + treasuryTotals.usd,
        received: catalystTotals.claimedUsd + treasuryTotals.usd,
        ada: catalystTotals.claimedAda + treasuryTotals.ada,
        usdPending: treasuryTotals.usdPending
    };
}

function formatCatalystTreasuryFundingHeader(totals) {
    const amount = hasNumericValue(totals?.claimed)
        ? totals.claimed
        : hasNumericValue(totals?.received)
            ? totals.received
            : totals?.asked;
    return formatCatalystCurrencyAmount(amount, 'USD', true);
}

function createApprovedGovernanceFundingCard(actions) {
    const totals = getApprovedGovernanceFundingTotals(actions);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'governance-card governance-menu-card';
    card.dataset.searchText = [
        'approved actions',
        'approved governance actions',
        ...actions.map(getProposalTitle)
    ].filter(Boolean).join(' ');
    card.dataset.sortName = 'Approved Governance Actions';
    card.dataset.sortAmount = String(totals.usd || 0);
    card.dataset.overlayPinRank = '0';
    window.TDSPRuntime?.bindMenuTrigger?.(card, event => {
        openApprovedGovernanceFundingOverlay(actions, event.currentTarget);
    }, {
        errorMessage: 'Approved governance actions could not be opened.'
    });

    const amount = createFundingRecipientAmountRow(
        totals.usd,
        totals.ada,
        totals.usdPending,
        { hidePendingUsd: true }
    );
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: 'Approved Governance Actions',
        primaryNode: amount,
        contextItems: [`${actions.length.toLocaleString('en-US')} actions`],
        detailItems: ['Approved actions; treasury asks counted in totals']
    });
    return card;
}

function openApprovedGovernanceFundingOverlay(actions, returnFocus) {
    const proposals = Array.isArray(actions) ? actions : getApprovedGovernanceFundingActions();
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, 'No approved treasury funding actions found.');
    const totals = getApprovedGovernanceFundingTotals(proposals);
    createGovernanceMenuOverlay({
        id: 'governance-approved-treasury-funding-overlay',
        titleId: 'governance-approved-treasury-funding-title',
        titleText: 'Approved Governance Actions',
        closeLabel: 'Close approved treasury actions',
        closeOverlay: closeApprovedGovernanceFundingOverlay,
        bodyNodes: [panel],
        headerMeta: formatCatalystTreasuryFundingHeader({
            claimed: totals.usd,
            ada: totals.ada
        }),
        returnFocus,
        rootTitle: 'Catalyst/Treasury Funding',
        defaultSort: 'ask-desc',
        botContext: createGovernanceActionGroupBotContext(
            'Approved Governance Actions',
            proposals,
            {
                status: 'approved',
                rootTitle: 'Catalyst/Treasury Funding'
            }
        )
    });
}

function closeApprovedGovernanceFundingOverlay() {
    removeGovernanceMenuOverlay('governance-approved-treasury-funding-overlay');
}

function createCatalystFundCard(fund) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'governance-card governance-menu-card';
    card.dataset.searchText = fund.fund_name;
    card.dataset.sortName = fund.fund_name;
    card.dataset.sortFund = String(getCatalystFundNumber(fund.fund_name));
    card.dataset.sortAmount = String(fund.requested_amount || 0);
    window.TDSPRuntime?.bindMenuTrigger?.(card, event => {
        openCatalystFundOverlay(fund, event.currentTarget);
    }, {
        datasetKey: 'fundBound',
        errorMessage: 'Catalyst fund could not be opened.'
    });

    const amount = createFundingRecipientAmountRow(
        fund.claimed_amount,
        fund.claimed_ada,
        false
    );
    const detailItems = [
        `Not Claimed ${formatCatalystFundAmount(fund, 'not_claimed', true)}`,
        Number(fund?.not_claimed_ada) > 0
            ? {
                text: `Not Claimed ${formatAdaAmount(fund.not_claimed_ada, true)}`,
                className: 'governance-card-detail funding-recipient-ada-value'
            }
            : null
    ].filter(Boolean);
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: fund.fund_name,
        primaryNode: amount,
        contextItems: [`${fund.proposal_count.toLocaleString('en-US')} proposals`],
        detailItems
    });
    return card;
}

async function openCatalystFundOverlay(fund, returnFocus) {
    const panel = document.createElement('div');
    panel.className = 'governance-detail-content';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = `Loading ${fund.fund_name} proposals...`;
    panel.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-catalyst-fund-overlay',
        titleId: 'governance-catalyst-fund-title',
        titleText: fund.fund_name,
        closeLabel: `Close ${fund.fund_name}`,
        closeOverlay: closeCatalystFundOverlay,
        bodyNodes: [panel],
        headerMeta: `${fund.proposal_count.toLocaleString('en-US')} proposals`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: 'Catalyst/Treasury Funding',
        enableSearch: false,
        botContext: createCatalystFundBotContext(fund)
    });

    try {
        const [directoryPayload, businessPayload] = await Promise.all([
            fetchJson(getCatalystProposalsApiUrl({ fundName: fund.fund_name })),
            catalystBusinessState || fetchCatalystBusinessPayload().catch(() => null)
        ]);
        if (!panel.isConnected) return;
        catalystBusinessState = businessPayload;
        panel.replaceChildren();

        const proposals = Array.isArray(directoryPayload?.proposals)
            ? directoryPayload.proposals
            : [];
        const fundingPayload = createCatalystFundFundingPayload(fund, businessPayload);
        let fundingChart = null;
        try {
            fundingChart = fund.funding_currency === 'ADA'
                ? createCatalystFundingStatusChart(fundingPayload)
                : createCatalystCurrencyFundingStatusChart(fund, proposals);
        } catch (error) {
            console.warn(`${fund.fund_name} funding chart could not be rendered`, error);
        }
        if (fundingChart) panel.appendChild(fundingChart);
        else panel.appendChild(createCatalystFundTotals(fund));

        const list = document.createElement('div');
        list.className = 'governance-list governance-action-group-list';
        const cards = document.createDocumentFragment();
        proposals.forEach(proposal => {
            cards.appendChild(createCatalystProposalCard(proposal));
        });
        list.appendChild(cards);
        if (!proposals.length) {
            const empty = document.createElement('p');
            empty.className = 'small-text';
            empty.textContent = `No proposals were found for ${fund.fund_name}.`;
            list.appendChild(empty);
        }
        if (proposals.length) installOverlaySearch(list, { defaultSort: 'name-asc' });
        panel.appendChild(list);
        updateGovernanceMenuHeaderMeta(
            'governance-catalyst-fund-overlay',
            `${proposals.length.toLocaleString('en-US')} proposals • Claimed ${formatCatalystFundAmount(fund, 'claimed', true)} • Not Claimed ${formatCatalystFundAmount(fund, 'not_claimed', true)}`,
            panel
        );
        updateGovernanceOverlayBotContext(
            'governance-catalyst-fund-overlay',
            {
                ...createCatalystFundBotContext(fund),
                count: proposals.length,
                proposal_count: proposals.length
            },
            panel
        );
    } catch (loadError) {
        console.error(`${fund.fund_name} proposals could not be rendered`, loadError);
        if (!panel.isConnected) return;
        panel.replaceChildren();
        const error = document.createElement('p');
        error.className = 'small-text';
        error.textContent = `${fund.fund_name} proposals could not be loaded.`;
        panel.appendChild(error);
    }
}

function createCatalystFundFundingPayload(fund, businessPayload) {
    const projects = getCatalystFundingProjects(businessPayload)
        .filter(project => project.fund_name === fund.fund_name);
    return {
        funding_status: {
            project_count: fund.funded_project_count,
            requested_lovelace: fund.requested_lovelace,
            claimed_lovelace: fund.claimed_lovelace,
            not_claimed_lovelace: fund.not_claimed_lovelace,
            rounds: [{
                fund_name: fund.fund_name,
                project_count: fund.funded_project_count,
                requested_lovelace: fund.requested_lovelace,
                claimed_lovelace: fund.claimed_lovelace,
                not_claimed_lovelace: fund.not_claimed_lovelace
            }]
        },
        funding_projects: projects
    };
}

function createCatalystFundTotals(fund) {
    const summary = document.createElement('div');
    summary.className = 'governance-vote-legend governance-catalyst-fund-totals';
    summary.append(
        createGovernanceStatBox({
            label: 'Claimed',
            detail: formatCatalystFundAmount(fund, 'claimed'),
            color: '#34d399'
        }),
        createGovernanceStatBox({
            label: 'Not Claimed',
            detail: formatCatalystFundAmount(fund, 'not_claimed'),
            color: '#fb7185'
        })
    );
    return summary;
}

function createCatalystCurrencyFundingStatusChart(fund, proposals = []) {
    const requested = Number(fund.requested_amount) || 0;
    if (!fund.funding_currency || requested <= 0) return null;
    const fundingProjects = (Array.isArray(proposals) ? proposals : []).flatMap(project => {
        const projectRequested = Number(project?.amount_requested_usd);
        if (
            project?.project_status !== 'in_progress'
            || !Number.isFinite(projectRequested)
            || projectRequested <= 0
        ) return [];
        const projectClaimed = Math.min(
            Math.max(Number(project?.amount_received_usd) || 0, 0),
            projectRequested
        );
        return [{
            ...project,
            requested_amount: projectRequested,
            claimed_amount: projectClaimed,
            not_claimed_amount: Math.max(projectRequested - projectClaimed, 0)
        }];
    });
    const groups = [
        {
            key: 'claimed',
            label: 'Claimed',
            value: Number(fund.claimed_amount) || 0,
            color: '#34d399',
            currency: fund.funding_currency,
            projects: fundingProjects.filter(project => project.claimed_amount > 0),
            amountField: 'claimed_amount',
            requestedField: 'requested_amount'
        },
        {
            key: 'not-claimed',
            label: 'Not Claimed',
            value: Number(fund.not_claimed_amount) || 0,
            color: '#fb7185',
            currency: fund.funding_currency,
            projects: fundingProjects.filter(project => project.not_claimed_amount > 0),
            amountField: 'not_claimed_amount',
            requestedField: 'requested_amount'
        }
    ].filter(group => group.value > 0);
    if (!groups.length) return null;

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = 'Catalyst funding status';

    const projects = document.createElement('span');
    projects.className = 'governance-card-detail';
    projects.textContent = `${fund.funded_project_count.toLocaleString('en-US')} in-progress projects`;

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    layout.appendChild(createUniversalPieChart(groups, {
        labelFormatter: segment => (
            ((segment.end - segment.start) / 360) >= 0.03
                ? formatCatalystCurrencyAmount(
                    segment.value,
                    fund.funding_currency,
                    true
                )
                : ''
        ),
        onSegmentClick: (segment, returnFocus) => (
            openCatalystFundingProjectsOverlay(segment, returnFocus)
        ),
        showSegmentSeparators: true
    }));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${formatCatalystCurrencyAmount(group.value, fund.funding_currency)} • ${formatPercentage((group.value / requested) * 100)}`,
            color: group.color,
            onClick: event => openCatalystFundingProjectsOverlay(group, event.currentTarget)
        }));
    });

    layout.appendChild(legend);
    section.append(title, projects, layout);
    return section;
}

function formatCatalystFundAmount(fund, kind, compact = false) {
    const amount = Number(fund?.[`${kind}_amount`]) || 0;
    return formatCatalystCurrencyAmount(amount, 'USD', compact);
}

function formatCatalystCurrencyAmount(value, currency, compact = false) {
    const normalizedCurrency = String(currency || '').trim().toUpperCase();
    if (!normalizedCurrency || normalizedCurrency === 'MIXED') return '--';
    if (normalizedCurrency === 'ADA') return formatAdaAmount(value, compact);
    const amount = Number(value) || 0;
    const options = {
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 2 : 0
    };

    try {
        return new Intl.NumberFormat('en-US', {
            ...options,
            style: 'currency',
            currency: normalizedCurrency
        }).format(amount);
    } catch {
        return `${new Intl.NumberFormat('en-US', options).format(amount)} ${normalizedCurrency}`;
    }
}

function formatCatalystUsdRate(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(Number(value) || 0);
}

function hasNumericValue(value) {
    return value !== null
        && value !== undefined
        && value !== ''
        && Number.isFinite(Number(value));
}

function formatAdaAmount(value, compact = false) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '₳ --';
    return `₳ ${new Intl.NumberFormat('en-US', {
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 2 : 6
    }).format(amount)}`;
}

function getCatalystMilestoneProgress(proposal) {
    const progress = proposal?.milestone_progress;
    if (progress && typeof progress === 'object') {
        const total = Math.max(0, Number(progress.total) || 0);
        const completed = Math.min(total, Math.max(0, Number(progress.completed) || 0));
        return total > 0 ? { completed, total } : null;
    }

    const milestones = proposal?.milestones;
    if (!milestones || typeof milestones !== 'object') return null;
    const items = Array.isArray(milestones.items) ? milestones.items : [];
    const completedFromItems = items.filter(item => (
        ['complete', 'completed', 'finished'].includes(
            String(item?.status || '').trim().toLowerCase()
        )
    )).length;
    const completed = Math.max(
        completedFromItems,
        Math.max(0, Number(milestones.complete) || 0)
    );
    const inProgress = Math.max(0, Number(milestones.in_progress) || 0);
    const total = Math.max(items.length, completed + inProgress);
    return total > 0 ? { completed: Math.min(completed, total), total } : null;
}

function appendCatalystMilestoneIndicator(container, proposal) {
    const progress = getCatalystMilestoneProgress(proposal);
    if (!progress) return;

    container.classList.add('has-catalyst-milestones');
    const indicator = document.createElement('span');
    indicator.className = 'catalyst-milestone-indicator';
    indicator.setAttribute(
        'aria-label',
        `${progress.completed} of ${progress.total} milestones finished`
    );

    const bar = document.createElement('span');
    bar.className = 'catalyst-milestone-bar';
    for (let index = 0; index < progress.total; index += 1) {
        const segment = document.createElement('span');
        segment.className = index < progress.completed
            ? 'catalyst-milestone-segment is-complete'
            : 'catalyst-milestone-segment is-unfinished';
        bar.appendChild(segment);
    }

    const count = document.createElement('strong');
    count.className = 'catalyst-milestone-count';
    count.textContent = `${progress.completed}/${progress.total}`;
    indicator.append(bar, count);
    container.appendChild(indicator);
}

function createCatalystProposalCard(proposal) {
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card';
    card.dataset.searchText = [
        proposal?.id,
        proposal?.title,
        proposal?.business,
        proposal?.project_status,
        proposal?.funding_status,
        ...getCatalystTeamSearchTerms(proposal)
    ].filter(Boolean).join(' ');
    card.dataset.searchTeamLabels = getCatalystTeamSearchTerms(proposal).join('\n');
    card.dataset.sortName = proposal?.title || '';
    card.dataset.sortAmount = String(proposal?.amount_requested_usd || '0');
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
        openCatalystProposalDetailOverlay(proposal, event.currentTarget);
    }, {
        datasetKey: 'proposalBound',
        errorMessage: 'Catalyst proposal could not be opened.'
    });

    const amount = createFundingRecipientAmountRow(
        proposal?.amount_requested_usd,
        String(proposal?.currency || '').toUpperCase() === 'ADA'
            ? proposal?.amount_requested
            : null,
        !hasNumericValue(proposal?.amount_requested_usd)
    );
    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: proposal?.title || 'Untitled Catalyst proposal',
        primaryNode: amount,
        contextItems: getCatalystTileContext(proposal),
        proposer: proposal?.business
            ? resolveCatalystBusinessName(proposal.business)
            : 'Unknown Catalyst proposer',
        detailItems: [
            `Received ${formatCatalystProposalAmount(proposal, 'received') || '--'}`
        ]
    });
    appendCatalystMilestoneIndicator(openButton, proposal);
    card.appendChild(openButton);
    appendProposalIdCopyButton(card, proposal?.id);
    return card;
}

function closeCatalystFundsOverlay() {
    removeGovernanceMenuOverlay('governance-catalyst-funds-overlay');
}

function closeCatalystFundOverlay() {
    removeGovernanceMenuOverlay('governance-catalyst-fund-overlay');
}

function openCatalystFundingProjectsOverlay(group, returnFocus) {
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    [...group.projects]
        .sort((left, right) => (
            getCatalystFundNumber(left?.fund_name) - getCatalystFundNumber(right?.fund_name)
            || String(left?.title || '').localeCompare(String(right?.title || ''), 'en-US')
        ))
        .forEach(project => {
            panel.appendChild(createCatalystFundingProjectCard(project, group));
        });

    createGovernanceMenuOverlay({
        id: 'governance-catalyst-funding-projects-overlay',
        titleId: 'governance-catalyst-funding-projects-title',
        titleText: group.label,
        closeLabel: `Close ${group.label} projects`,
        closeOverlay: closeCatalystFundingProjectsOverlay,
        bodyNodes: [panel],
        headerMeta: [
            `${group.projects.length.toLocaleString('en-US')} projects`,
            formatCatalystFundingAmount(group.value, group.currency, true),
            Number(group.adaValue) > 0 ? formatAdaAmount(group.adaValue, true) : null
        ].filter(Boolean).join(' • '),
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: group.rootTitle || 'Catalyst/Treasury Recipients',
        defaultSort: 'fund-asc',
        botContext: createWebsiteSectionBotContext('Catalyst', {
            title: group.label,
            count: group.projects.length,
            amount_usd: Number(group.value),
            amount_ada: Number(group.adaValue),
            root: group.rootTitle || 'Catalyst/Treasury Recipients',
            summary: `${group.projects.length.toLocaleString('en-US')} projects`
        })
    });
}

function getCatalystFundNumber(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function createCatalystFundingProjectCard(project, group) {
    const amountField = group.amountField;
    const requestedField = group.requestedField || 'requested_lovelace';
    const amount = Number(project?.[amountField]) || 0;
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card';
    card.dataset.searchText = [
        project.id,
        project.title,
        project.business,
        project.fund_name,
        ...getCatalystTeamSearchTerms(project)
    ].filter(Boolean).join(' ');
    card.dataset.searchTeamLabels = getCatalystTeamSearchTerms(project).join('\n');
    card.dataset.sortName = project.title;
    card.dataset.sortAmount = String(amount);
    card.dataset.sortFund = String(getCatalystFundNumber(project.fund_name));
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
        openCatalystProposalDetailOverlay(project, event.currentTarget);
    }, {
        errorMessage: 'Catalyst funding project could not be opened.'
    });

    const detailItems = [
        `Requested ${formatCatalystFundingAmount(project?.[requestedField], group.currency)}`
    ];
    if (String(project?.currency || '').toUpperCase() === 'ADA') {
        const requestedAda = Math.max(Number(project?.amount_requested) || 0, 0);
        const receivedAda = Math.min(
            Math.max(Number(project?.amount_received) || 0, 0),
            requestedAda
        );
        const isClaimed = group.key === 'claimed';
        detailItems.push({
            text: `${isClaimed ? 'Claimed' : 'Unclaimed'} ${formatAdaAmount(
                isClaimed
                    ? receivedAda
                    : Math.max(requestedAda - receivedAda, 0),
                true
            )}`,
            className: 'governance-card-detail funding-recipient-ada-value'
        });
    }
    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: project.title,
        primaryText: `${group.label} ${formatCatalystFundingAmount(amount, group.currency)}`,
        contextItems: [`${project.business} • ${project.fund_name}`],
        detailItems
    });
    appendCatalystMilestoneIndicator(openButton, project);
    card.appendChild(openButton);
    appendProposalIdCopyButton(card, project?.id);
    return card;
}

function formatCatalystFundingAmount(value, currency = 'ADA', compact = false) {
    return currency === 'ADA'
        ? (
            compact
                ? formatCompactAdaFromLovelace(value)
                : formatFullAdaFromLovelace(value)
        )
        : formatCatalystCurrencyAmount(value, currency, compact);
}

function closeCatalystFundingProjectsOverlay() {
    removeGovernanceMenuOverlay('governance-catalyst-funding-projects-overlay');
}

function createTreasuryBusinessCard(group) {
    const actionsCount = getTreasuryBusinessActions(group).length;
    const catalystCount = group.catalystProjects.length;
    const projectCount = actionsCount + catalystCount;
    const companyUrls = getTreasuryBusinessWebsiteUrls(group);
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card governance-business-card';
    const teamSearchLabels = [
        group.label,
        ...group.catalystProjects.flatMap(getCatalystTeamSearchTerms)
    ].filter(Boolean);
    card.dataset.searchText = [
        ...teamSearchLabels,
        ...group.withdrawals.flatMap(withdrawal => (
            Array.isArray(withdrawal?.proposers) ? withdrawal.proposers : []
        ))
    ].filter(Boolean).join(' ');
    card.dataset.searchTeamLabels = teamSearchLabels.join('\n');
    card.dataset.sortName = group.label;
    card.dataset.sortAmount = String(group.value);
    card.dataset.sortProjects = String(projectCount);

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
        openTreasuryBusinessActionsOverlay(group, event.currentTarget);
    }, {
        errorMessage: 'Funding recipient could not be opened.'
    });

    const amount = createFundingRecipientAmountRow(
        group.value,
        group.adaValue,
        group.usdPending
    );
    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: group.label,
        primaryNode: amount,
        detailItems: [
            `${projectCount.toLocaleString('en-US')} funded project${projectCount === 1 ? '' : 's'}`
        ].filter(Boolean)
    });
    card.appendChild(openButton);
    const companyLinks = createTreasuryBusinessWebsiteLinks(companyUrls);
    if (companyLinks) card.appendChild(companyLinks);
    const companyLogo = createTreasuryBusinessLogo(companyUrls, group.label);
    if (companyLogo) {
        card.classList.add('has-company-logo');
        card.appendChild(companyLogo);
    }
    return card;
}

function getTreasuryBusinessWebsiteUrls(group) {
    const mappedUrl = TREASURY_BUSINESS_WEBSITES[
        normalizeTreasuryBusinessName(group?.label)
    ];
    if (mappedUrl) return normalizeBusinessUrlList(mappedUrl);

    const normalizedLabel = normalizeBusinessDomainText(group?.label);
    const candidates = [
        ...(Array.isArray(group?.catalystProjects) ? group.catalystProjects : [])
    ]
        .map(project => project?.website)
        .map(value => String(value || '').trim())
        .filter(Boolean);
    const matchedUrl = candidates.find(url => {
        const domain = getRootDomainLabel(url);
        return domain
            && normalizedLabel
            && (
                normalizeBusinessDomainText(domain).includes(normalizedLabel)
                || normalizedLabel.includes(normalizeBusinessDomainText(domain))
            );
    });
    return normalizeBusinessUrlList(matchedUrl);
}

function normalizeBusinessUrlList(value) {
    return (Array.isArray(value) ? value : [value])
        .map(normalizeExternalUrl)
        .filter(Boolean);
}

function createTreasuryBusinessWebsiteLinks(urls) {
    const normalizedUrls = normalizeBusinessUrlList(urls);
    if (!normalizedUrls.length) return null;
    const list = document.createElement('span');
    list.className = 'governance-business-url-list';
    normalizedUrls.forEach(url => {
        const link = document.createElement('a');
        link.className = 'governance-card-detail governance-business-url';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = getRootDomainLabel(url) || url;
        link.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (typeof openExternalSiteWarning === 'function') {
                openExternalSiteWarning(url, event.currentTarget);
                return;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        });
        list.appendChild(link);
    });
    return list;
}

function createTreasuryBusinessLogo(urls, label) {
    const normalizedUrls = normalizeBusinessUrlList(urls);
    if (!normalizedUrls.length) return null;
    const logos = normalizedUrls.flatMap(url => {
        const logoData = getTreasuryBusinessLogoData(url, label);
        return logoData ? [logoData] : [];
    });
    if (!logos.length) return null;

    const frame = document.createElement('span');
    frame.className = `governance-business-logo-frame${logos.length > 1 ? ' governance-business-logo-frame--multi' : ''}`;
    frame.setAttribute('aria-hidden', 'true');
    frame.title = `${label || 'Company'} logo`;

    logos.forEach(({ logoUrl, domain, mappedLogo }) => {
        const logo = document.createElement('img');
        logo.className = 'governance-business-logo';
        logo.alt = '';
        logo.loading = 'lazy';
        logo.decoding = 'async';
        logo.src = logoUrl;
        logo.addEventListener('error', () => {
            if (mappedLogo) return;
            if (logo.dataset.fallbackLoaded === 'true') return;
            logo.dataset.fallbackLoaded = 'true';
            logo.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=96`;
        });
        frame.appendChild(logo);
    });

    return frame;
}

function getTreasuryBusinessLogoData(url, label) {
    const normalizedUrl = normalizeExternalUrl(url);
    if (!normalizedUrl) return null;
    const normalizedLabel = normalizeTreasuryBusinessName(label);
    let origin;
    let domain;
    try {
        const parsed = new URL(normalizedUrl);
        origin = parsed.origin;
        domain = parsed.hostname.replace(/^www\./i, '');
    } catch {
        return null;
    }
    if (!origin || !domain) return null;
    const mappedLogo = TREASURY_BUSINESS_LOGOS[normalizedLabel]
        || TREASURY_BUSINESS_LOGOS_BY_DOMAIN[domain];
    return {
        logoUrl: mappedLogo || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=96`,
        domain,
        mappedLogo
    };
}

function normalizeExternalUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    try {
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        if (!['https:', 'http:'].includes(url.protocol)) return null;
        return url.href;
    } catch {
        return null;
    }
}

function getRootDomainLabel(value) {
    const normalizedUrl = normalizeExternalUrl(value);
    if (!normalizedUrl) return '';
    try {
        const hostname = new URL(normalizedUrl).hostname.replace(/^www\./i, '');
        return hostname;
    } catch {
        return '';
    }
}

function normalizeBusinessDomainText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '')
        .replace(/labs?$/g, 'lab')
        .replace(/foundation$/g, '')
        .trim();
}

function createFundingRecipientAmountRow(usdValue, adaValue = null, usdPending = false, options = {}) {
    const row = document.createElement('span');
    row.className = 'governance-card-amount-row';

    if (!(usdPending && options.hidePendingUsd === true)) {
        const usdAmount = document.createElement('span');
        usdAmount.className = 'governance-card-detail governance-treasury-withdrawal-amount';
        usdAmount.textContent = usdPending
            ? 'USD updating'
            : formatCatalystCurrencyAmount(usdValue, 'USD');
        row.appendChild(usdAmount);
    }

    if (Number(adaValue) > 0) {
        const adaAmount = document.createElement('span');
        adaAmount.className = 'governance-card-detail funding-recipient-ada-value';
        adaAmount.textContent = formatAdaAmount(adaValue);
        row.appendChild(adaAmount);
    }
    return row;
}

function getTreasuryBusinessActions(group) {
    const actions = new Map();
    group.withdrawals.forEach((withdrawal, index) => {
        const key = withdrawal?.action_id || `withdrawal-${index}`;
        const existing = actions.get(key);
        if (existing) {
            existing.amount_lovelace = String(
                (Number(existing.amount_lovelace) || 0)
                + (Number(withdrawal?.amount_lovelace) || 0)
            );
            existing.amount_ada = (Number(existing.amount_ada) || 0)
                + (Number(withdrawal?.amount_ada) || 0);
            existing.amount_usd = (Number(existing.amount_usd) || 0)
                + (Number(withdrawal?.amount_usd) || 0);
            if (existing.stake_address !== withdrawal?.stake_address) {
                existing.stake_address = null;
            }
            return;
        }
        actions.set(key, { ...withdrawal });
    });
    return [...actions.values()].sort((left, right) => (
        Number(right?.enacted_epoch || 0) - Number(left?.enacted_epoch || 0)
        || (Number(right?.amount_usd) || 0) - (Number(left?.amount_usd) || 0)
    ));
}

function openTreasuryBusinessActionsOverlay(group, returnFocus) {
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    const actions = getTreasuryBusinessActions(group);
    actions.forEach(withdrawal => {
        panel.appendChild(createTreasuryWithdrawalCard(withdrawal));
    });
    group.catalystProjects.forEach(project => {
        panel.appendChild(createCatalystBusinessProjectCard(project));
    });
    const projectCount = actions.length + group.catalystProjects.length;

    createGovernanceMenuOverlay({
        id: 'governance-business-actions-overlay',
        titleId: 'governance-business-actions-title',
        titleText: group.label,
        closeLabel: `Close treasury actions for ${group.label}`,
        closeOverlay: closeTreasuryBusinessActionsOverlay,
        bodyNodes: [panel],
        headerMeta: `${projectCount.toLocaleString('en-US')} projects • ${formatCatalystCurrencyAmount(group.value, 'USD', true)}`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: 'Catalyst/Treasury Recipients',
        defaultSort: 'newest',
        botContext: createFundingRecipientBotContext(group)
    });
}

function createCatalystBusinessProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card';
    card.dataset.searchText = [
        project.id,
        project.title,
        project.fund_name,
        project.project_status,
        ...getCatalystTeamSearchTerms(project),
        'Catalyst'
    ].filter(Boolean).join(' ');
    card.dataset.searchTeamLabels = getCatalystTeamSearchTerms(project).join('\n');
    card.dataset.sortAmount = String(project.amount_received_usd || '0');
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
        openCatalystProposalDetailOverlay(project, event.currentTarget);
    }, {
        errorMessage: 'Catalyst project could not be opened.'
    });

    const amount = createFundingRecipientAmountRow(
        project.amount_received_usd,
        project.amount_received_ada,
        !hasNumericValue(project.amount_received_usd)
    );
    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: cleanGovernanceText(project.title || 'Untitled project'),
        primaryNode: amount,
        contextItems: getCatalystTileContext(project),
        proposer: project?.business
            ? resolveCatalystBusinessName(project.business)
            : 'Unknown Catalyst proposer'
    });
    appendCatalystMilestoneIndicator(openButton, project);
    card.appendChild(openButton);
    appendProposalIdCopyButton(card, project?.id);
    return card;
}

function appendProposalIdCopyButton(card, proposalId) {
    const id = String(proposalId || '').trim();
    if (!id) return;
    const copyButton = createGovernanceCopyButton(id, 'Catalyst proposal ID');
    copyButton.classList.add('governance-action-id-copy-button');
    card.appendChild(copyButton);
}

function getCatalystTileContext(project) {
    const rawStatus = project?.project_status || project?.funding_status;
    const normalizedStatus = String(rawStatus || '')
        .trim()
        .toLowerCase()
        .replaceAll('_', ' ');
    const status = (normalizedStatus === 'complete' ? 'completed' : normalizedStatus)
        .replace(/^\w/, character => character.toUpperCase());
    return [status, project?.fund_name].filter(Boolean);
}

function openCatalystProposalDetailOverlay(project, returnFocus) {
    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading Catalyst proposal...';
    content.appendChild(loading);

    const overlay = createGovernanceMenuOverlay({
        id: 'governance-catalyst-proposal-detail-overlay',
        titleId: 'governance-catalyst-proposal-detail-title',
        titleText: project?.title || 'Catalyst proposal',
        closeLabel: 'Close Catalyst proposal',
        closeOverlay: closeCatalystProposalDetailOverlay,
        bodyNodes: [content],
        headerMeta: [project?.fund_name, project?.project_status || project?.funding_status]
            .filter(Boolean)
            .join(' • '),
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: 'Catalyst/Treasury Recipients',
        botContext: createCatalystProposalBotContext(project)
    });

    loadCatalystProposalDetail(project)
        .then(detail => {
            if (!content.isConnected) return;
            renderCatalystProposalDetail(content, detail);
            overlay.title.textContent = detail.title || project.title;
            overlay.overlay.governanceBotContext = createCatalystProposalBotContext(detail);
            updateGovernanceMenuHeaderMeta(
                'governance-catalyst-proposal-detail-overlay',
                [detail.fund_name, detail.project_status || detail.funding_status]
                    .filter(Boolean)
                    .join(' • '),
                content
            );
        })
        .catch(() => {
            if (!content.isConnected) return;
            content.replaceChildren();
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Catalyst proposal details could not be loaded.';
            content.appendChild(message);
        });
}

function closeCatalystProposalDetailOverlay() {
    removeGovernanceMenuOverlay('governance-catalyst-proposal-detail-overlay');
}

function loadCatalystProposalDetail(project) {
    const proposalId = String(project?.id || '').trim();
    if (!proposalId) return Promise.reject(new Error('Catalyst proposal id is missing'));
    if (!catalystProposalDetailsCache.has(proposalId)) {
        const request = fetchJson(getCatalystProposalDetailApiUrl(proposalId), { cache: 'no-store' })
            .catch(error => {
                catalystProposalDetailsCache.delete(proposalId);
                throw error;
            });
        catalystProposalDetailsCache.set(proposalId, request);
    }
    return catalystProposalDetailsCache.get(proposalId);
}

function getCatalystDetailText(value) {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) {
        return value.map(getCatalystDetailText).filter(Boolean).join('\n\n');
    }
    if (value && typeof value === 'object') {
        return Object.entries(value)
            .map(([key, item]) => {
                const text = getCatalystDetailText(item);
                return text ? `${key.replaceAll('_', ' ')}: ${text}` : '';
            })
            .filter(Boolean)
            .join('\n\n');
    }
    return '';
}

function renderCatalystProposalDetail(container, proposal) {
    container.replaceChildren();
    container.appendChild(createCatalystProposalActionButtons(proposal));
    const votingChart = createCatalystVoteChartSection(proposal.voting);
    if (votingChart) container.appendChild(votingChart);
    addDetailRow(container, 'Proposal ID', proposal.id, {
        copyLabel: 'Catalyst proposal ID'
    });
    addDetailRow(
        container,
        'Proposer',
        proposal?.business ? resolveCatalystBusinessName(proposal.business) : null
    );
    addDetailRow(container, 'Fund', proposal.fund_name);
    addDetailRow(container, 'Category', proposal.challenge || proposal.horizon_group);
    addDetailRow(
        container,
        'Location',
        [proposal.country, proposal.continent].filter(Boolean).join(', ') || null
    );
    addDetailRow(container, 'Status', proposal.project_status || proposal.funding_status);
    addDetailRow(container, 'Requested', formatCatalystProposalAmount(proposal, 'requested'));
    addDetailRow(container, 'Received', formatCatalystProposalAmount(proposal, 'received'));
    if (Number.isFinite(Number(proposal.ada_usd_rate))) {
        addDetailRow(
            container,
            'Historical ADA/USD',
            `${formatCatalystUsdRate(proposal.ada_usd_rate)} on ${proposal.usd_conversion_date || 'date unavailable'}`
        );
    }
    if (Number.isFinite(Number(proposal.project_length))) {
        addDetailRow(container, 'Project length', `${proposal.project_length} months`);
    }
    if (proposal.team?.length) {
        addDetailRow(
            container,
            'Team',
            proposal.team.map(member => (
                member.role
                    ? `${normalizeCatalystTeamMemberDisplayName(member.name)} (${member.role})`
                    : normalizeCatalystTeamMemberDisplayName(member.name)
            )).join(', ')
        );
    }
    if (proposal.voting) {
        if (!votingChart) {
            addDetailRow(container, 'Votes cast', Number(proposal.voting.votes_cast || 0).toLocaleString('en-US'));
            addDetailRow(container, 'Voting result', proposal.voting.status);
            addDetailRow(container, 'Yes', formatCatalystOfficialMoney(proposal.voting.yes));
            addDetailRow(container, 'No', formatCatalystOfficialMoney(proposal.voting.no));
            addDetailRow(container, 'Abstain', formatCatalystOfficialMoney(proposal.voting.abstain));
        }
    }
    if (proposal.milestones) {
        const total = Number(proposal.milestones.complete || 0)
            + Number(proposal.milestones.in_progress || 0)
            + (proposal.milestones.items || []).filter(item => (
                !['complete', 'in progress'].includes(String(item?.status || '').toLowerCase())
            )).length;
        addDetailRow(
            container,
            'Milestones',
            `${Number(proposal.milestones.complete || 0)} complete`
                + ` • ${Number(proposal.milestones.in_progress || 0)} in progress`
                + (total ? ` • ${total} total` : '')
        );
        addMarkdownDetailSection(
            container,
            'Milestone details',
            (proposal.milestones.items || []).map(item => (
                `${item.number ? `${item.number}. ` : ''}${item.title || 'Milestone'}`
                + `${item.status ? ` — ${item.status}` : ''}`
                + `${item.delivery_date ? ` — ${item.delivery_date}` : ''}`
            )).join('\n')
        );
    }
    if (proposal.completion?.date) {
        addDetailRow(container, 'Completed', proposal.completion.date);
    }
    addMarkdownDetailSection(container, 'Problem', proposal.problem);
    addMarkdownDetailSection(container, 'Solution', proposal.solution);
    addMarkdownDetailSection(container, 'Experience', proposal.experience);
    addMarkdownDetailSection(container, 'Project details', getCatalystDetailText(proposal.project_details));
    addMarkdownDetailSection(container, 'Open source', proposal.opensource_description);

    const projectWebsite = proposal.website;
    const sourceUrl = proposal.source_url;
    if (projectWebsite || sourceUrl) {
        const actions = document.createElement('div');
        actions.className = 'governance-action-buttons';
        if (projectWebsite) {
            actions.appendChild(createGovernanceProposalActionButton(
                'Open project website',
                'governance-catalyst-source-button',
                event => openExternalSiteWarning(projectWebsite, event.currentTarget)
            ));
        }
        if (sourceUrl && sourceUrl !== projectWebsite) {
            actions.appendChild(createGovernanceProposalActionButton(
                'Open proposal source',
                'governance-catalyst-source-button',
                event => openExternalSiteWarning(sourceUrl, event.currentTarget)
            ));
        }
        container.appendChild(actions);
    }
}

function createCatalystVoteChartSection(voting) {
    if (!voting) return null;
    const voteItems = [
        { key: 'yes', label: 'Yes', color: '#34d399', money: voting.yes },
        { key: 'no', label: 'No', color: '#fb7185', money: voting.no },
        { key: 'abstain', label: 'Abstain', color: '#60a5fa', money: voting.abstain }
    ]
        .map(item => ({
            ...item,
            value: Number(item.money?.amount)
        }))
        .filter(item => Number.isFinite(item.value) && item.value > 0);
    const total = voteItems.reduce((sum, item) => sum + item.value, 0);
    if (!voteItems.length || total <= 0) return null;

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = 'Catalyst vote overview';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    layout.appendChild(createUniversalPieChart(voteItems, {
        labelFormatter: segment => formatPercentage((segment.value / total) * 100)
    }));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend governance-vote-legend--stacked';
    legend.appendChild(createGovernanceStatBox({
        label: 'Vote result',
        detail: [
            voting.status || null,
            `${Number(voting.votes_cast || 0).toLocaleString('en-US')} votes cast`
        ].filter(Boolean).join(' • '),
        color: '#94a3b8'
    }));
    voteItems.forEach(item => {
        legend.appendChild(createGovernanceStatBox({
            label: item.label,
            detail: [
                formatCatalystOfficialMoney(item.money),
                formatPercentage((item.value / total) * 100)
            ].filter(Boolean).join(' • '),
            color: item.color
        }));
    });

    layout.appendChild(legend);
    section.append(title, layout);
    return section;
}

function formatCatalystOfficialMoney(value) {
    const amount = Number(value?.amount);
    if (!Number.isFinite(amount)) return null;
    const currency = String(value?.currency || '').replace(/^\$/, '').toUpperCase();
    return currency === 'ADA'
        ? formatAdaAmount(amount)
        : formatCatalystCurrencyAmount(amount, currency || 'USD');
}

function formatCatalystProposalAmount(proposal, kind) {
    const amount = Number(proposal?.[`amount_${kind}_usd`]);
    if (!Number.isFinite(amount)) return null;
    return formatCatalystCurrencyAmount(amount, 'USD');
}

function closeBusinessOverlay() {
    removeGovernanceMenuOverlay('governance-business-overlay');
}

function closeTreasuryBusinessActionsOverlay() {
    removeGovernanceMenuOverlay('governance-business-actions-overlay');
}

async function createTreasuryHistoryChart(payload, withdrawals) {
    if (!withdrawals.length) return null;
    const ChartCtor = await window.TDSPCharts?.load?.().catch(error => {
        console.error(`Chart.js could not be loaded: ${error.message}`);
        return null;
    });
    if (typeof ChartCtor !== 'function') return null;

    const withdrawalsByEpoch = new Map();
    withdrawals.forEach(withdrawal => {
        const epoch = Number(withdrawal?.enacted_epoch);
        const amount = Number(withdrawal?.amount_lovelace);
        if (!Number.isFinite(epoch) || !Number.isFinite(amount) || amount <= 0) return;
        withdrawalsByEpoch.set(epoch, (withdrawalsByEpoch.get(epoch) || 0) + amount);
    });

    const withdrawalEpochs = [...withdrawalsByEpoch.keys()].sort((left, right) => left - right);
    const currentTreasury = getTreasuryLovelace(payload);
    if (!withdrawalEpochs.length || !Number.isFinite(currentTreasury)) return null;

    const treasuryByEpoch = new Map(
        (Array.isArray(payload?.treasury_history) ? payload.treasury_history : [])
            .map(item => [Number(item?.epoch_no), Number(item?.treasury)])
            .filter(([epoch, treasury]) => Number.isFinite(epoch) && Number.isFinite(treasury))
    );
    const historyEpochs = [...treasuryByEpoch.keys()];
    const payloadEpoch = getTreasuryEpoch(payload);
    const lastEpoch = Math.max(
        withdrawalEpochs[withdrawalEpochs.length - 1],
        Number.isFinite(payloadEpoch) ? payloadEpoch : withdrawalEpochs[0],
        historyEpochs.length ? Math.max(...historyEpochs) : withdrawalEpochs[0]
    );
    const firstEpoch = Math.max(withdrawalEpochs[0] - 1, lastEpoch - 49);
    const epochs = Array.from(
        { length: lastEpoch - firstEpoch + 1 },
        (_, index) => firstEpoch + index
    );
    const withdrawalAmounts = epochs.map(epoch => withdrawalsByEpoch.get(epoch) || 0);
    const treasuryIncomeAmounts = epochs.map((epoch, index) => {
        const epochTreasury = treasuryByEpoch.get(epoch);
        const previousTreasury = treasuryByEpoch.get(epoch - 1);
        if (!Number.isFinite(epochTreasury) || !Number.isFinite(previousTreasury)) return 0;
        return Math.max(0, epochTreasury - previousTreasury + withdrawalAmounts[index]);
    });
    let treasuryValues = epochs.map(epoch => treasuryByEpoch.get(epoch) ?? null);
    if (!treasuryValues.some(Number.isFinite)) {
        let reconstructedTreasury = currentTreasury
            + withdrawalAmounts.reduce((sum, amount) => sum + amount, 0);
        treasuryValues = withdrawalAmounts.map((amount, index) => {
            if (index > 0) reconstructedTreasury -= amount;
            return reconstructedTreasury;
        });
    }

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-treasury-history-chart';

    const title = document.createElement('strong');
    title.textContent = 'Treasury withdrawal history';
    section.appendChild(title);

    const chartFrame = document.createElement('div');
    chartFrame.className = 'governance-treasury-history-frame';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Treasury income, withdrawals and treasury value per epoch');
    canvas.setAttribute('role', 'img');
    canvas.tabIndex = 0;
    chartFrame.appendChild(canvas);
    section.appendChild(chartFrame);

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text').trim() || '#f8fafc';
    const mutedColor = styles.getPropertyValue('--muted').trim() || '#94a3b8';
    const lineColor = styles.getPropertyValue('--line').trim() || 'rgba(148, 163, 184, 0.25)';
    const rootFontSize = Number.parseFloat(styles.fontSize) || 16;
    const legendFontSize = rootFontSize * 0.9;
    const axisFontSize = rootFontSize * 0.82;
    const chartContext = canvas.getContext('2d');
    const withdrawalGradient = chartContext.createLinearGradient(0, 0, 0, 340);
    withdrawalGradient.addColorStop(0, 'rgba(251, 113, 133, 0.94)');
    withdrawalGradient.addColorStop(1, 'rgba(251, 113, 133, 0.34)');
    const incomeGradient = chartContext.createLinearGradient(0, 0, 0, 340);
    incomeGradient.addColorStop(0, 'rgba(94, 234, 212, 0.94)');
    incomeGradient.addColorStop(1, 'rgba(20, 184, 166, 0.3)');

    treasuryHistoryChart = new ChartCtor(canvas, {
        data: {
            labels: epochs.map(epoch => `Epoch ${epoch}`),
            datasets: [
                {
                    type: 'bar',
                    label: 'Withdrawals',
                    data: withdrawalAmounts,
                    yAxisID: 'withdrawals',
                    backgroundColor: withdrawalGradient,
                    borderColor: '#fb7185',
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
                    categoryPercentage: 0.72,
                    barPercentage: 0.88,
                    order: 2,
                    stack: 'treasuryFlows'
                },
                {
                    type: 'bar',
                    label: 'Treasury income',
                    data: treasuryIncomeAmounts,
                    yAxisID: 'withdrawals',
                    backgroundColor: incomeGradient,
                    borderColor: '#5eead4',
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
                    categoryPercentage: 0.72,
                    barPercentage: 0.88,
                    order: 2,
                    stack: 'treasuryFlows'
                },
                {
                    type: 'line',
                    label: 'Treasury value',
                    data: treasuryValues,
                    yAxisID: 'treasury',
                    borderColor: '#f6c667',
                    backgroundColor: '#f6c667',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHitRadius: 12,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#f6c667',
                    pointHoverBorderColor: textColor,
                    pointHoverBorderWidth: 2,
                    tension: 0.36,
                    cubicInterpolationMode: 'monotone',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 650,
                easing: 'easeOutQuart'
            },
            interaction: { mode: 'index', intersect: false },
            onClick: (event, elements) => {
                const withdrawalBar = elements.find(element => (
                    element.datasetIndex === 0
                    && (withdrawalsByEpoch.get(epochs[element.index]) || 0) > 0
                ));
                if (!withdrawalBar) return;
                const epoch = epochs[withdrawalBar.index];
                openTreasuryEpochActionsOverlay(epoch, withdrawals, canvas);
            },
            onHover: (event, elements) => {
                const target = event?.native?.target;
                if (!target?.style) return;
                target.style.cursor = elements.some(element => (
                    element.datasetIndex === 0
                    && (withdrawalsByEpoch.get(epochs[element.index]) || 0) > 0
                ))
                    ? 'pointer'
                    : 'default';
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 18,
                        font: { family: 'Poppins', size: legendFontSize, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 22, 0.96)',
                    titleColor: '#f4f7f4',
                    bodyColor: '#f4f7f4',
                    borderColor: 'rgba(255, 255, 255, 0.14)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: context => `${context.dataset.label}: ${formatWholeAdaFromLovelace(context.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: mutedColor,
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10,
                        font: { family: 'Poppins', size: axisFontSize }
                    },
                    grid: { display: false },
                    border: { display: false },
                    stacked: true
                },
                withdrawals: {
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        color: '#fb7185',
                        callback: value => formatCompactAdaFromLovelace(value),
                        font: { family: 'Poppins', size: axisFontSize }
                    },
                    grid: { color: lineColor, borderDash: [4, 5] },
                    border: { display: false },
                    stacked: true
                },
                treasury: {
                    position: 'right',
                    ticks: {
                        color: '#f6c667',
                        callback: value => formatCompactAdaFromLovelace(value),
                        font: { family: 'Poppins', size: axisFontSize }
                    },
                    grid: { drawOnChartArea: false },
                    border: { display: false }
                }
            }
        }
    });

    return section;
}

function openTreasuryEpochActionsOverlay(epoch, withdrawals, returnFocus) {
    const epochWithdrawals = withdrawals.filter(withdrawal => Number(withdrawal?.enacted_epoch) === epoch);
    const actionIds = [...new Set(epochWithdrawals.map(withdrawal => withdrawal?.action_id).filter(Boolean))];
    const dashboardProposals = getGovernanceProposalsFromDashboardPayload(governanceState || {});
    const proposalsById = new Map(dashboardProposals.map(proposal => [proposal.proposal_id, proposal]));
    const withdrawalsByActionId = new Map();
    epochWithdrawals.forEach(withdrawal => {
        if (withdrawal?.action_id && !withdrawalsByActionId.has(withdrawal.action_id)) {
            withdrawalsByActionId.set(withdrawal.action_id, withdrawal);
        }
    });

    const proposals = actionIds.map(actionId => getTreasuryGovernanceProposal(
        withdrawalsByActionId.get(actionId),
        epoch,
        proposalsById
    ));

    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, 'No governance actions found for this epoch.');

    createGovernanceMenuOverlay({
        id: 'governance-treasury-actions-overlay',
        titleId: 'governance-treasury-actions-title',
        titleText: `Treasury withdrawals - Epoch ${epoch}`,
        closeLabel: `Close treasury withdrawals for epoch ${epoch}`,
        closeOverlay: closeTreasuryEpochActionsOverlay,
        bodyNodes: [panel],
        headerMeta: `${proposals.length.toLocaleString('en-US')} actions`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        botContext: createGovernanceActionGroupBotContext(
            `Treasury withdrawals - Epoch ${epoch}`,
            proposals,
            {
                status: `Epoch ${epoch}`,
                rootTitle: 'Cardano Treasury'
            }
        )
    });
}

function closeTreasuryEpochActionsOverlay() {
    removeGovernanceMenuOverlay('governance-treasury-actions-overlay');
}

function getTreasuryGovernanceProposal(withdrawal, epoch = withdrawal?.enacted_epoch, proposalsById = null) {
    const actionId = withdrawal?.action_id;
    if (!actionId) return null;

    const proposal = proposalsById?.get(actionId)
        || getGovernanceProposalsFromDashboardPayload(governanceState || {})
            .find(item => item.proposal_id === actionId);
    if (proposal) {
        return {
            ...proposal,
            treasury_stake_address: withdrawal?.stake_address
                || proposal?.treasury_stake_address
                || null
        };
    }

    const normalized = normalizeGovernanceProposal({
        proposal_id: actionId,
        proposal_type: 'TreasuryWithdrawals',
        enacted_epoch: Number(epoch) || null,
        meta_json: { body: { title: withdrawal?.title || 'Conway treasury withdrawal' } }
    });
    normalized.treasury_stake_address = withdrawal?.stake_address || null;
    return normalized;
}

function getTreasuryWithdrawals(payload) {
    return (Array.isArray(payload?.treasury_withdrawals) ? payload.treasury_withdrawals : [])
        .map(withdrawal => ({
            action_id: withdrawal?.action_id || null,
            title: withdrawal?.title || 'Conway treasury withdrawal',
            proposer: withdrawal?.proposer || null,
            proposers: Array.isArray(withdrawal?.proposers) ? withdrawal.proposers : [],
            business: withdrawal?.business || null,
            enacted_epoch: Number(withdrawal?.enacted_epoch) || null,
            amount_lovelace: String(withdrawal?.amount_lovelace || '0'),
            amount_ada: Number.isFinite(Number(withdrawal?.amount_ada))
                ? Number(withdrawal.amount_ada)
                : Number(withdrawal?.amount_lovelace) / 1_000_000,
            amount_usd: Number.isFinite(Number(withdrawal?.amount_usd))
                ? Number(withdrawal.amount_usd)
                : null,
            usd_conversion_date: withdrawal?.usd_conversion_date || null,
            ada_usd_rate: Number.isFinite(Number(withdrawal?.ada_usd_rate))
                ? Number(withdrawal.ada_usd_rate)
                : null,
            stake_address: withdrawal?.stake_address || null
        }))
        .slice(0, 200);
}

function createTreasuryWithdrawalCard(withdrawal) {
    const proposal = getTreasuryGovernanceProposal(withdrawal);
    const card = document.createElement(proposal ? 'button' : 'div');
    card.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card';
    card.dataset.sortAmount = String(withdrawal?.amount_usd || '0');
    if (Number.isFinite(Number(withdrawal?.enacted_epoch))) {
        card.dataset.sortEpoch = String(Number(withdrawal.enacted_epoch));
    }
    if (proposal) {
        card.type = 'button';
        card.classList.add('governance-treasury-withdrawal-card--clickable');
        window.TDSPRuntime?.bindMenuTrigger?.(card, event => {
            openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
        }, {
            errorMessage: 'Treasury withdrawal could not be opened.'
        });
    }

    const amount = createFundingRecipientAmountRow(
        withdrawal?.amount_usd,
        withdrawal?.amount_ada,
        !hasNumericValue(withdrawal?.amount_usd)
    );
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: cleanGovernanceText(withdrawal?.title || 'Conway treasury withdrawal'),
        primaryNode: amount,
        contextItems: [`Enacted Epoch ${Number(withdrawal?.enacted_epoch) || '--'}`]
    });

    const address = String(withdrawal?.stake_address || '');
    if (address) {
        const administrator = getTreasuryWithdrawalAdministrator(withdrawal) || address;
        const administratorLine = document.createElement('span');
        administratorLine.className = 'governance-card-detail governance-drep-id-line';

        const administratorText = document.createElement('span');
        administratorText.className = 'governance-drep-id';
        administratorText.textContent = `Administrator: ${administrator}`;
        administratorLine.appendChild(administratorText);
        administratorLine.appendChild(createGovernanceCopyButton(
            administrator,
            'administrator'
        ));
        card.appendChild(administratorLine);
    }

    return card;
}

function getTreasuryLovelace(payload) {
    const value = payload?.treasury_lovelace
        ?? payload?.totals?.treasury
        ?? payload?.latest?.treasury
        ?? payload?.treasury;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : NaN;
}

function getTreasuryEpoch(payload) {
    const value = payload?.epoch_no ?? payload?.totals?.epoch_no ?? payload?.latest?.epoch_no;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
}

function getTreasuryIncomeLovelace(payload, epoch = getTreasuryEpoch(payload)) {
    if (!Number.isFinite(epoch)) return NaN;

    const treasuryByEpoch = new Map(
        (Array.isArray(payload?.treasury_history) ? payload.treasury_history : [])
            .map(item => [Number(item?.epoch_no), Number(item?.treasury)])
            .filter(([historyEpoch, treasury]) => Number.isFinite(historyEpoch) && Number.isFinite(treasury))
    );
    const currentTreasury = treasuryByEpoch.get(epoch);
    const previousTreasury = treasuryByEpoch.get(epoch - 1);
    if (!Number.isFinite(currentTreasury) || !Number.isFinite(previousTreasury)) return NaN;

    const withdrawals = getTreasuryWithdrawals(payload)
        .filter(withdrawal => withdrawal.enacted_epoch === epoch)
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount_lovelace), 0);
    return Math.max(0, currentTreasury - previousTreasury + withdrawals);
}

function getTreasuryHeaderAmount(payload) {
    const treasuryLovelace = getTreasuryLovelace(payload);
    return Number.isFinite(treasuryLovelace)
        ? formatWholeAdaFromLovelace(treasuryLovelace)
        : '₳ --';
}

function formatWholeAdaFromLovelace(value) {
    return window.TDSPRuntime.formatAdaFromLovelace(value, { fallback: '₳ --' });
}

function formatFullAdaFromLovelace(value) {
    return window.TDSPRuntime.formatAdaFromLovelace(value, {
        maximumFractionDigits: 6,
        fallback: ''
    });
}

function formatTreasuryTimestamp(value) {
    return window.TDSPRuntime.formatTimestamp(value, {
        fallback: '',
        locale: 'en-GB',
        formatOptions: {
            dateStyle: 'medium',
            timeStyle: 'short'
        }
    });
}

function setupTdspDrepStatsCards() {
    const cards = [
        document.getElementById('tdsp-drep-status-card'),
        document.getElementById('tdsp-drep-delegators-card'),
        document.getElementById('tdsp-drep-voted-card')
    ].filter(Boolean);

    if (!cards.length) return;

    cards.forEach(card => {
        const open = event => {
            loadTdspDrepStats()
                .then(stats => {
                    if (card.id === 'tdsp-drep-delegators-card') {
                        openTdspDrepDelegatorsOverlay(stats, event?.currentTarget || card);
                        return;
                    }
                    openDrepActionHistoryOverlay(stats.drep, event?.currentTarget || card);
                })
                .catch(error => {
                    console.error('DamionDutch DRep stats could not be opened.', error);
                });
        };
        bindGovernanceMenuTrigger(card, open);
        bindGovernanceEntityPreload(card, `drep:${TDSP_DREP_ID}`, () => loadDrepDetail({ id: TDSP_DREP_ID }));
    });

    loadTdspDrepStats()
        .then(renderTdspDrepStatsCards)
        .catch(() => renderTdspDrepStatsUnavailable());
}

async function loadTdspDrepStats() {
    if (!tdspDrepStatsPromise) {
        tdspDrepStatsPromise = Promise.all([
            fetchDrepInfoPayload().catch(() => null),
            loadDrepDirectory().catch(() => new Map()),
            loadDrepDetail({ id: TDSP_DREP_ID, name: TDSP_DREP_FALLBACK_NAME }).catch(() => null)
        ]).then(([infoPayload, directory, detailPayload]) => {
            const normalizedTarget = normalizeGovernanceIdentifier(TDSP_DREP_ID);
            const infoEntry = unwrapDrepEntries(infoPayload).find(entry =>
                getDrepEntryIdentifiers(entry).some(identifier => normalizeGovernanceIdentifier(identifier) === normalizedTarget)
            ) || null;
            const info = detailPayload?.info || infoEntry || {};
            const metadata = detailPayload?.metadata || infoEntry?.metadata || {};
            const name = extractDrepNameFromEntry(metadata)
                || extractDrepNameFromEntry(info)
                || directory?.get?.(normalizedTarget)
                || TDSP_DREP_FALLBACK_NAME;
            const votingPower = getDrepEntryVotingPower(info) || getDrepEntryVotingPower(infoEntry);
            const delegatorCount = Number(info?.live_delegator_count ?? infoEntry?.live_delegator_count);
            const voteStats = detailPayload?.vote_stats || {};
            const votedCount = Number(voteStats.voted_count ?? voteStats.vote_count);
            const drep = {
                id: TDSP_DREP_ID,
                searchIds: getDrepEntryIdentifiers(infoEntry || info).join(' '),
                name,
                votingPower,
                active: info?.active === true
            };

            const delegators = Array.isArray(detailPayload?.delegators) ? detailPayload.delegators : [];
            return {
                drep,
                delegators,
                delegatorCount: Number.isFinite(delegatorCount)
                    ? delegatorCount
                    : Number(detailPayload?.delegator_count) || (delegators.length || null),
                votedCount: Number.isFinite(votedCount) ? votedCount : null,
                voteStats,
                delegatorsUpdatedAt: detailPayload?.delegators_updated_at || null,
                delegatorsError: detailPayload?.delegators_error || null
            };
        }).catch(error => {
            tdspDrepStatsPromise = null;
            throw error;
        });
    }

    return tdspDrepStatsPromise;
}

function renderTdspDrepStatsCards(stats) {
    const status = stats.drep.active ? 'Active' : 'Inactive';
    window.TDSPRuntime.setText('tdsp-drep-status', status);
    window.TDSPRuntime.setText('tdsp-drep-delegators', stats.delegatorCount === null ? 'N/A' : stats.delegatorCount.toLocaleString('en-US'));
    window.TDSPRuntime.setText('tdsp-drep-delegation', window.TDSPRuntime.formatTileAdaFromLovelace(stats.drep.votingPower, { fixedFractionDigits: 2 }));
    window.TDSPRuntime.setText('tdsp-drep-voted', stats.votedCount === null ? 'N/A' : stats.votedCount.toLocaleString('en-US'));
}

function renderTdspDrepStatsUnavailable() {
    window.TDSPRuntime.setText('tdsp-drep-status', 'Unavailable');
    window.TDSPRuntime.setText('tdsp-drep-delegators', 'N/A');
    window.TDSPRuntime.setText('tdsp-drep-delegation', 'N/A');
    window.TDSPRuntime.setText('tdsp-drep-voted', 'N/A');
}

function openTdspDrepDelegatorsOverlay(stats, returnFocus = null) {
    createGovernanceMenuOverlay({
        id: 'tdsp-drep-delegators-overlay',
        titleId: 'tdsp-drep-delegators-title',
        titleText: `${stats.drep.name} Delegators`,
        closeLabel: `Close ${stats.drep.name} delegators`,
        closeOverlay: closeTdspDrepDelegatorsOverlay,
        bodyNodes: [createTdspDrepDelegatorsList(stats)],
        headerMeta: `${(stats.delegatorCount || 0).toLocaleString('en-US')} delegators`,
        returnFocus,
        botContext: createWebsiteSectionBotContext('DReps', {
            title: `${stats.drep.name} Delegators`,
            count: stats.delegatorCount || 0,
            amount_ada: Number(stats.drep.votingPower || 0) / 1_000_000,
            root: 'DRep Stats',
            summary: `${stats.drep.name} DRep delegators`
        })
    });
}

function closeTdspDrepDelegatorsOverlay() {
    removeGovernanceMenuOverlay('tdsp-drep-delegators-overlay');
}

function createTdspDrepDelegatorsList(stats) {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list';

    const delegators = Array.isArray(stats?.delegators) ? stats.delegators : [];
    if (!delegators.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = stats?.delegatorsError
            ? 'DRep delegator details could not be loaded from Koios yet.'
            : 'DRep delegator details are not available yet.';
        list.appendChild(message);
        return list;
    }

    [...delegators]
        .sort((left, right) => compareBigIntDescending(getDrepDelegatorAmount(left), getDrepDelegatorAmount(right)))
        .forEach((delegator, index) => list.appendChild(createTdspDrepDelegatorRow(delegator, index)));

    return list;
}

function createTdspDrepDelegatorRow(delegator, index) {
    const row = document.createElement('div');
    row.className = 'pool-delegator-row governance-menu-card';
    row.dataset.sortAmount = getDrepDelegatorAmount(delegator).toString();

    const content = document.createElement('div');
    content.className = 'pool-delegator-content';

    const adaHandle = String(delegator?.ada_handle || '').trim();
    const walletAddresses = window.TDSPRuntime.getDelegatorWalletAddresses(delegator);
    const walletAddress = walletAddresses[0] || '';
    const addressLine = document.createElement('div');
    addressLine.className = 'pool-delegator-address-line';

    const addressText = document.createElement('strong');
    addressText.className = `pool-delegator-address${adaHandle ? ' pool-delegator-handle' : ''}`;
    addressText.textContent = adaHandle || (walletAddress
        ? window.TDSPRuntime.shortenMiddle(walletAddress)
        : 'Wallet address unavailable');
    if (walletAddress) addressText.title = walletAddress;

    const amount = document.createElement('span');
    amount.className = 'pool-delegator-amount';
    amount.textContent = formatDrepDelegatorAda(getDrepDelegatorAmount(delegator));

    addressLine.appendChild(addressText);
    if (walletAddress) {
        const copy = document.createElement('button');
        copy.className = 'pool-delegator-copy-button';
        copy.type = 'button';
        copy.textContent = '⧉';
        copy.setAttribute('aria-label', `Copy DRep delegator wallet address ${index + 1}`);
        window.TDSPRuntime?.bindCopyButton?.(copy, walletAddress, { preventDefault: false });
        addressLine.appendChild(copy);
    }
    content.append(addressLine, amount);

    if (adaHandle && walletAddress) {
        const walletText = document.createElement('span');
        walletText.className = 'pool-delegator-wallet-address';
        walletText.textContent = window.TDSPRuntime.shortenMiddle(walletAddress);
        walletText.title = walletAddress;
        content.appendChild(walletText);
    }

    if (walletAddresses.length > 1) {
        const addressCount = document.createElement('span');
        addressCount.className = 'pool-delegator-epoch';
        addressCount.textContent = `${walletAddresses.length.toLocaleString('en-US')} linked wallet addresses`;
        content.appendChild(addressCount);
    }

    const epoch = Number(delegator?.active_epoch_no ?? delegator?.epoch_no);
    if (Number.isFinite(epoch)) {
        const epochText = document.createElement('span');
        epochText.className = 'pool-delegator-epoch';
        epochText.textContent = `Active epoch ${epoch.toLocaleString('en-US')}`;
        content.appendChild(epochText);
    }

    row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(adaHandle || walletAddress);
    row.dataset.searchText = window.TDSPRuntime.getDelegatorSearchText(delegator);
    row.appendChild(content);
    return row;
}

function getDrepDelegatorAmount(delegator) {
    return window.TDSPRuntime.getLovelaceAmount(delegator);
}

function compareBigIntDescending(left, right) {
    return left > right ? -1 : left < right ? 1 : 0;
}

function formatDrepDelegatorAda(lovelace) {
    return window.TDSPRuntime.formatLovelaceAmount(lovelace);
}

function openNclSummaryOverlay(returnFocus) {
    governanceNcl.openOverlay(returnFocus);
}

function closeNclSummaryOverlay() {
    governanceNcl.closeOverlay();
}

function getNclSummaryValues() {
    return governanceNcl.getValues();
}

function formatNclAdaAmount(value) {
    return governanceNcl.formatAdaAmount(value);
}

function updateNclSummaryCard(nclLimit, remaining) {
    governanceNcl.updateCard(nclLimit, remaining);
}

function updateNclEpochCountdown() {
    governanceNcl.updateEpochCountdown();
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
        rejected: document.getElementById('governance-rejected')
    };

    try {
        const dashboardPayload = await fetchGovernanceDashboardPayload();
        governanceState = dashboardPayload;
        applyDashboardNclSummary(dashboardPayload);
        const proposals = getGovernanceProposalsFromDashboardPayload(dashboardPayload);
        if (!proposals.length) {
            throw new Error('No governance proposals found in dashboard payload');
        }
        checkGovernanceNotifications(proposals);
        const grouped = groupGovernanceProposals(proposals);
        governanceGroupsState = grouped;

        renderGovernanceGroupIfPresent(groups.active, grouped.active, 'No active actions found.');
        renderGovernanceGroupIfPresent(groups.approved, grouped.approved, 'No approved actions found.');
        renderGovernanceGroupIfPresent(groups.rejected, grouped.rejected, 'No rejected actions found.');
        updateNclSummaryTile();
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
        rejected: document.getElementById('governance-rejected')
    };

    const dashboardPayload = await fetchGovernanceDashboardPayload().catch(() => null);
    if (!dashboardPayload) return;
    governanceState = dashboardPayload;
    applyDashboardNclSummary(dashboardPayload);
    updateEpochDisplayFromDashboardPayload(dashboardPayload);
    const proposals = getGovernanceProposalsFromDashboardPayload(dashboardPayload);
    checkGovernanceNotifications(proposals);
    const grouped = groupGovernanceProposals(proposals);
    const activeProposals = grouped.active;
    governanceGroupsState = grouped;
    updateNclSummaryTile();

    const nextSignature = getGovernanceGroupSignature(activeProposals);
    if (nextSignature === lastActiveRenderSignature) return;

    renderGovernanceGroupIfPresent(groups.active, grouped.active, 'No active actions found.');
    renderGovernanceGroupIfPresent(groups.approved, grouped.approved, 'No approved actions found.');
    renderGovernanceGroupIfPresent(groups.rejected, grouped.rejected, 'No rejected actions found.');
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

function schedulePostEpochGovernanceRefresh() {
    epochChangeRefreshStartedAtMs = Date.now();
    refreshActiveGovernanceGroup().catch(() => {});
    treasuryPromise = null;
    loadTreasuryData().catch(() => {});

    if (epochChangeRefreshTimer !== null) return;
    epochChangeRefreshTimer = window.setInterval(() => {
        if (Date.now() - epochChangeRefreshStartedAtMs > EPOCH_CHANGE_REFRESH_WINDOW_MS) {
            window.clearInterval(epochChangeRefreshTimer);
            epochChangeRefreshTimer = null;
            return;
        }
        if (document.visibilityState !== 'visible') return;
        refreshActiveGovernanceGroup().catch(() => {});
        treasuryPromise = null;
        loadTreasuryData().catch(() => {});
    }, EPOCH_CHANGE_REFRESH_INTERVAL_MS);
}

async function fetchGovernanceDashboardPayload() {
    const compactUrl = GOVERNANCE_IS_LOCAL_PREVIEW
        ? LOCAL_COMPACT_DASHBOARD_PROXY_PATH
        : COMPACT_DASHBOARD_API_URL;
    const fullUrl = GOVERNANCE_IS_LOCAL_PREVIEW
        ? LOCAL_DASHBOARD_PROXY_PATH
        : DASHBOARD_API_URL;

    try {
        return await fetchJson(compactUrl);
    } catch {
        return fetchJson(fullUrl);
    }
}

function checkGovernanceNotifications(proposals) {
    governanceNotifications.check(proposals);
}

function getProposalVotesApiUrl(proposalId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_VOTES_PROXY_PATH}?${params.toString()}`;
    }

    return `${PROPOSAL_VOTES_API_BASE_URL}/${encodeURIComponent(proposalId)}/votes`;
}

function getProposalDetailApiUrl(proposalId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_DETAIL_PROXY_PATH}?${params.toString()}`;
    }

    return `${PROPOSAL_DETAIL_API_BASE_URL}/${encodeURIComponent(proposalId)}`;
}

function getProposalSummaryApiUrl(proposalId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_SUMMARY_PROXY_PATH}?${params.toString()}`;
    }
    return `${PROPOSAL_SUMMARY_API_BASE_URL}/${encodeURIComponent(proposalId)}/summary`;
}

function getProposalDrepRationaleApiUrl(proposalId, drepId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ proposalId, drepId });
        return `${LOCAL_PROPOSAL_RATIONALE_PROXY_PATH}?${params.toString()}`;
    }

    return `${PROPOSAL_RATIONALE_API_BASE_URL}/${encodeURIComponent(proposalId)}/drep/${encodeURIComponent(drepId)}/rationale`;
}

function getCatalystProposalDetailApiUrl(proposalId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_CATALYST_PROPOSAL_DETAIL_PROXY_PATH}?${params.toString()}`;
    }
    return `${CATALYST_PROPOSAL_DETAIL_API_BASE_URL}/${encodeURIComponent(proposalId)}`;
}

function getCatalystProposalSummaryApiUrl(proposalId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_CATALYST_PROPOSAL_SUMMARY_PROXY_PATH}?${params.toString()}`;
    }
    return `${CATALYST_PROPOSAL_SUMMARY_API_BASE_URL}/${encodeURIComponent(proposalId)}/summary`;
}

function updateEpochDisplayFromDashboardPayload(payload) {
    governanceEpochClock.update();
}

function updateEpochCountdownFromMainnetClock() {
    governanceEpochClock.update();
}

function getClockEpochSnapshot(nowMs = Date.now()) {
    return governanceEpochClock.getSnapshot(nowMs);
}

function loadGovernanceEntityDetail(key, loader) {
    return window.TDSPRuntime?.loadDetail
        ? window.TDSPRuntime.loadDetail(key, loader)
        : Promise.resolve().then(loader);
}

function bindGovernanceEntityPreload(element, key, loader) {
    window.TDSPRuntime?.bindDetailPreload?.(element, key, loader);
}

function loadSpoDetail(spo) {
    const poolId = String(spo?.pool_id || '').trim().toLowerCase();
    return loadGovernanceEntityDetail(
        `spo:${poolId}`,
        () => fetchJson(getSpoDetailApiUrl(poolId), { cache: 'no-store' })
    );
}

function loadDrepDetail(drep) {
    const drepId = String(drep?.id || '').trim().toLowerCase();
    return loadGovernanceEntityDetail(
        `drep:${drepId}`,
        () => fetchJson(getDrepDetailApiUrl(drepId), { cache: 'no-store' })
    );
}

function loadCommitteeMemberDetail(member) {
    const memberId = String(member?.id || '').trim().toLowerCase();
    return loadGovernanceEntityDetail(
        `committee:${memberId}`,
        () => fetchJson(getCommitteeMemberApiUrl(memberId), { cache: 'no-store' })
    );
}

function getCommitteeInfoApiUrl() {
    return GOVERNANCE_IS_LOCAL_PREVIEW ? LOCAL_COMMITTEE_PROXY_PATH : COMMITTEE_INFO_API_URL;
}

function getCommitteeMemberApiUrl(memberId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ memberId });
        return `${LOCAL_COMMITTEE_MEMBER_PROXY_PATH}?${params.toString()}`;
    }
    return `${COMMITTEE_MEMBER_API_BASE_URL}/${encodeURIComponent(memberId)}`;
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
    normalized.proposal_index = coerceNullableNumber(
        proposal?.proposal_index ?? proposal?.proposalIndex ?? proposal?.tx_index ?? proposal?.action_index
    );
    normalized.proposal_type = proposal?.proposal_type || proposal?.type || proposal?.gov_action_type || 'Governance';
    normalized.effective_proposal_type = getEffectiveProposalType(normalized);
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

    if (rawStatus.includes('reject') || rawStatus.includes('drop')) {
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

    groups.active.push(...getActiveInfoActions(groups.info));
    groups.info = [];

    groups.active.sort((a, b) => {
        const aPercentage = normalizePercentageNumber(a?.votePercentages?.yes);
        const bPercentage = normalizePercentageNumber(b?.votePercentages?.yes);
        const aHasPercentage = Number.isFinite(aPercentage);
        const bHasPercentage = Number.isFinite(bPercentage);
        if (aHasPercentage !== bHasPercentage) return aHasPercentage ? -1 : 1;
        if (aHasPercentage && aPercentage !== bPercentage) return bPercentage - aPercentage;

        const aExpiration = a?.expiration === null || a?.expiration === undefined
            ? NaN
            : Number(a.expiration);
        const bExpiration = b?.expiration === null || b?.expiration === undefined
            ? NaN
            : Number(b.expiration);
        const aHasExpiration = Number.isFinite(aExpiration);
        const bHasExpiration = Number.isFinite(bExpiration);
        if (aHasExpiration !== bHasExpiration) return aHasExpiration ? -1 : 1;
        if (aHasExpiration && aExpiration !== bExpiration) return aExpiration - bExpiration;

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

function getEffectiveProposalType(proposal) {
    return proposal?.proposal_description?.tag
        || proposal?.proposal_type
        || proposal?.type
        || '';
}

function usesPoolVoting(proposal) {
    const proposalType = getEffectiveProposalType(proposal);
    return proposalType === 'HardForkInitiation'
        || proposalType === 'ParameterChange';
}

function getGovernanceStatus(proposal) {
    if (meetsGovernanceApprovalThreshold(proposal)) return 'approved';
    if (proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return 'rejected';
    if (proposal.ratified_epoch !== null || proposal.enacted_epoch !== null) return 'approved';
    if (getEffectiveProposalType(proposal) === 'InfoAction') return 'info';
    return 'active';
}

function meetsGovernanceApprovalThreshold(proposal) {
    const yes = Number(proposal?.votePercentages?.yes);
    if (!Number.isFinite(yes)) return false;
    if (!hasPassedExpirationGracePeriod(proposal)) return false;

    return yes >= getGovernanceApprovalThreshold(proposal);
}

function getGovernanceApprovalThreshold(proposal, source = proposal?.voteDisplay?.source) {
    if (source === 'pool') return 50;
    const proposalType = getEffectiveProposalType(proposal);
    return proposalType === 'InfoAction'
        ? GOVERNANCE_INFO_ACTION_ALERT_YES_THRESHOLD
        : GOVERNANCE_ACTION_ALERT_YES_THRESHOLD;
}

function hasPassedExpirationGracePeriod(proposal) {
    if (proposal?.expired_epoch !== null && proposal?.expired_epoch !== undefined) return true;

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

function renderGovernanceGroup(container, proposals, emptyMessage, options = {}) {
    container.textContent = '';

    if (!proposals.length) {
        const empty = document.createElement('p');
        empty.className = 'small-text';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    proposals.forEach(proposal => {
        container.appendChild(createGovernanceCard(proposal, options));
    });
}

function renderGovernanceGroupIfPresent(container, proposals, emptyMessage, options = {}) {
    if (!container) return;
    renderGovernanceGroup(container, proposals, emptyMessage, options);
}

function createGovernanceCard(proposal, options = {}) {
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card';
    card.dataset.proposalId = proposal.proposal_id;
    card.dataset.searchText = [
        proposal.proposal_id,
        proposal.proposal_tx_hash
    ].filter(Boolean).join(' ');
    const sortDate = Number(proposal?.block_time);
    const fallbackSortDate = Number(proposal?.proposed_epoch);
    const totalAsk = getProposalTotalAskLovelace(proposal);
    if (Number.isFinite(sortDate) && sortDate > 0) {
        card.dataset.sortDate = String(sortDate);
    } else if (Number.isFinite(fallbackSortDate)) {
        card.dataset.sortDate = String(fallbackSortDate);
    }
    if (Number.isFinite(totalAsk) && totalAsk > 0) {
        card.dataset.sortAsk = String(totalAsk);
    }
    if (options.enableVoteSort) {
        const voteSummary = proposal?.voteSummary || {};
        const yesVotes = Number(voteSummary.drep_yes_votes_cast);
        const noVotes = Number(voteSummary.drep_no_votes_cast);
        if (Number.isFinite(yesVotes)) card.dataset.sortYesVotes = String(yesVotes);
        if (Number.isFinite(noVotes)) card.dataset.sortNoVotes = String(noVotes);
    }
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    openButton.setAttribute('aria-label', `Open ${getProposalTitle(proposal)}`);
    const handleClick = options.onClick || (event => {
        openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
    });
    window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
        handleClick(event);
    }, {
        errorMessage: 'Governance action could not be opened.'
    });

    const metadataItems = getActiveGovernanceCardMetadata(proposal);
    const votes = document.createElement('span');
    if (!proposal.votePercentages) {
        votes.className = 'governance-votes vote-neutral';
        votes.textContent = 'Open for live votes';
    } else {
        votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source, proposal)}`;
        votes.textContent = formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source);
    }

    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: getProposalTitle(proposal),
        contextItems: [getExpirationText(proposal)],
        detailItems: metadataItems.map(item => `${item.label} ${item.value}`)
    });
    if (shouldShowVotePercentages(proposal)) openButton.appendChild(votes);
    card.appendChild(openButton);

    const copyActionIdButton = createGovernanceCopyButton(
        proposal.proposal_id,
        'governance action ID'
    );
    copyActionIdButton.classList.add('governance-action-id-copy-button');
    card.appendChild(copyActionIdButton);

    if (isGovernanceProposalOpenForVoting(proposal)) {
        card.appendChild(createGovernanceProposalActionButtons(proposal, {
            showSummary: false,
            showBot: false,
            showVote: false
        }));
    }

    return card;
}

function createGovernanceMenuOverlay(options) {
    const botContext = options.botContext === undefined
        ? createGovernanceOverlayBotContext(options)
        : options.botContext;
    return createUniversalOverlay({
        ...options,
        botContext,
        showBotButton: options.showBotButton !== false && Boolean(botContext),
        uniqueId: true
    });
}

function createGovernanceOverlayBotContext(options = {}) {
    if (options.id === 'constitution-assistant-overlay') return null;
    const title = String(options.titleText || options.rootTitle || 'this menu').trim();
    const source = [
        options.id,
        options.titleText,
        options.rootTitle,
        options.headerMeta
    ].filter(Boolean).join(' ').toLowerCase();

    let section = 'Gov Actions';
    let kind = 'site_section';
    if (source.includes('catalyst')) {
        section = 'Catalyst';
    } else if (source.includes('drep')) {
        section = 'DReps';
    } else if (source.includes('spo') || source.includes('stake pool')) {
        section = 'SPOs';
    } else if (source.includes('cc member') || source.includes('committee') || source.includes('constitutional')) {
        section = 'CC Members';
    } else if (source.includes('starch')) {
        section = 'Starch';
    } else if (source.includes('treasury')) {
        section = 'Treasury';
    }

    return {
        kind,
        section,
        title,
        menu: title,
        root: String(options.rootTitle || title).trim(),
        overlay_id: options.id || null,
        header: String(options.headerMeta || '').trim() || null,
        summary: [
            title,
            options.headerMeta
        ].filter(Boolean).join(' • ')
    };
}

function updateGovernanceMenuHeaderMeta(id, text, context = null) {
    const contextualOverlay = context?.closest?.('.governance-menu-overlay');
    const overlay = contextualOverlay?.dataset.governanceOverlayId === id
        ? contextualOverlay
        : getTopGovernanceMenuOverlay(id);
    const meta = overlay?.querySelector('[data-governance-menu-header-meta="true"]');
    if (meta) meta.textContent = text;
}

function removeGovernanceMenuOverlay(id) {
    const overlay = getTopGovernanceMenuOverlay(id);
    const returnFocus = overlay?.governanceReturnFocus;
    if (overlay) overlay.remove();
    syncGovernanceMenuOverlayAccessibility();
    if (returnFocus?.isConnected) returnFocus.focus();
}

function openGovernanceActionGroupOverlay(groupKey, titleText, emptyMessage, rootTitle = titleText) {
    const groupedProposals = governanceGroupsState?.[groupKey]
        || groupGovernanceProposals(getGovernanceProposalsFromDashboardPayload(governanceState || {}))[groupKey]
        || [];
    const proposals = groupedProposals;
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, emptyMessage, {
        enableVoteSort: groupKey === 'active'
    });

    createGovernanceMenuOverlay({
        id: 'governance-action-group-overlay',
        titleId: 'governance-action-group-title',
        titleText,
        closeLabel: `Close ${titleText}`,
        closeOverlay: closeGovernanceActionGroupOverlay,
        bodyNodes: [panel],
        headerMeta: `${proposals.length.toLocaleString('en-US')} actions`,
        rootTitle,
        botContext: createGovernanceActionGroupBotContext(titleText, proposals, {
            groupKey,
            rootTitle
        })
    });
}

function closeGovernanceActionGroupOverlay() {
    removeGovernanceMenuOverlay('governance-action-group-overlay');
}

function openGovernanceStatusActionsOverlay(titleText, proposals, returnFocus, statusText = '') {
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, 'No governance actions found.');

    createGovernanceMenuOverlay({
        id: 'governance-status-actions-overlay',
        titleId: 'governance-status-actions-title',
        titleText,
        closeLabel: `Close ${titleText}${statusText ? ` ${statusText}` : ''}`,
        closeOverlay: closeGovernanceStatusActionsOverlay,
        bodyNodes: [panel],
        headerMeta: `${statusText ? `${statusText} • ` : ''}${proposals.length.toLocaleString('en-US')} actions`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        botContext: createGovernanceActionGroupBotContext(titleText, proposals, {
            status: statusText,
            rootTitle: titleText
        })
    });
}

function closeGovernanceStatusActionsOverlay() {
    removeGovernanceMenuOverlay('governance-status-actions-overlay');
}

function updateNclSummaryTile() {
    governanceNcl.updateTile();
}

function applyDashboardNclSummary(payload) {
    governanceNcl.applyDashboardSummary(payload);
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
    const headerContext = document.createElement('div');
    headerContext.className = 'governance-action-header-context';

    const type = document.createElement('span');
    type.className = 'governance-type';
    type.textContent = window.TDSPRuntime.formatReadableLabel(getEffectiveProposalType(proposal), 'Governance');

    const meta = document.createElement('p');
    meta.className = 'governance-action-header-epoch';
    meta.textContent = getProposalMeta(proposal);
    headerContext.append(type, meta);

    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    content.appendChild(createGovernanceProposalActionButtons(proposal));
    const voteDetailsContainer = document.createElement('div');
    voteDetailsContainer.className = 'governance-vote-details';
    voteDetailsContainer.dataset.proposalId = proposal.proposal_id;
    addVoteDetailsState(voteDetailsContainer, 'Loading vote details...');
    content.appendChild(voteDetailsContainer);

    const proposalDetailsContainer = document.createElement('div');
    proposalDetailsContainer.className = 'governance-proposal-details';
    proposalDetailsContainer.dataset.proposalDetailsId = proposal.proposal_id;
    renderGovernanceProposalDetails(proposalDetailsContainer, proposal, {
        isLoading: proposal.metadata_compact === true
    });
    content.appendChild(proposalDetailsContainer);

    const overlayElements = createGovernanceMenuOverlay({
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
        returnFocus: options.returnFocus,
        showClose: options.showClose !== false,
        botContext: createGovernanceActionBotContext(proposal)
    });
    loadProposalVoteDetails(proposal, voteDetailsContainer).catch(() => {
        if (!voteDetailsContainer.isConnected) return;
        addVoteDetailsState(voteDetailsContainer, 'Vote details could not be loaded.');
    });

    if (proposal.metadata_compact === true) {
        loadProposalDetails(proposal)
            .then(detailProposal => {
                if (!proposalDetailsContainer.isConnected) return;
                renderGovernanceProposalDetails(proposalDetailsContainer, detailProposal);
                overlayElements.title.textContent = getProposalTitle(detailProposal);
            })
            .catch(() => {
                if (!proposalDetailsContainer.isConnected) return;
                renderGovernanceProposalDetails(proposalDetailsContainer, proposal, { hasError: true });
            });
    }
}

function createGovernanceProposalActionButtons(proposal, options = {}) {
    const actions = document.createElement('div');
    actions.className = 'governance-action-buttons';
    if (options.showSummary !== false) {
        actions.appendChild(createGovernanceProposalActionButton(
            'Summary',
            'governance-summary-button',
            (event) => openProposalSummaryOverlay(proposal, event.currentTarget)
        ));
    }
    if (options.showBot !== false) {
        actions.appendChild(createGovernanceProposalActionButton(
            'TDSPBot',
            'governance-tdspbot-button',
            (event) => openConstitutionAssistantOverlay(
                createGovernanceActionBotContext(proposal),
                event.currentTarget
            )
        ));
    }
    if (options.showVote !== false && isGovernanceProposalOpenForVoting(proposal)) {
        actions.appendChild(createGovernanceProposalActionButton(
            'Vote as DRep',
            'governance-detail-vote-button',
            (event) => openGovernanceVoteOverlay(proposal, event.currentTarget)
        ));
    }
    return actions;
}

function createCatalystProposalActionButtons(proposal) {
    const actions = document.createElement('div');
    actions.className = 'governance-action-buttons';
    actions.appendChild(createGovernanceProposalActionButton(
        'Summary',
        'governance-summary-button',
        event => openCatalystProposalSummaryOverlay(proposal, event.currentTarget)
    ));
    actions.appendChild(createGovernanceProposalActionButton(
        'TDSPBot',
        'governance-tdspbot-button',
        event => openConstitutionAssistantOverlay(
            createCatalystProposalBotContext(proposal),
            event.currentTarget
        )
    ));
    return actions;
}

function createGovernanceActionBotContext(proposal) {
    return {
        kind: 'governance_action',
        id: String(proposal?.proposal_id || '').trim(),
        title: getProposalTitle(proposal),
        proposal_type: getEffectiveProposalType(proposal) || null,
        status: getGovernanceStatus(proposal),
        proposed_epoch: proposal?.proposed_epoch ?? null,
        expiration_epoch: proposal?.expiration ?? null,
        enacted_epoch: proposal?.enacted_epoch ?? null,
        ratified_epoch: proposal?.ratified_epoch ?? null,
        requested_lovelace: getProposalTotalAskLovelace(proposal) || null
    };
}

function createGovernanceVoteBotContext(proposal, details = {}) {
    return {
        ...createGovernanceActionBotContext(proposal),
        kind: 'governance_vote',
        title: `Cast DRep vote: ${getProposalTitle(proposal)}`,
        vote_choice: details.voteKind || null,
        wallet: details.walletName || null,
        drep_id: details.drep?.dRepIDCip105 || null,
        drep_key_hash: details.drep?.publicKeyHash || null,
        current_vote: details.existingVote || null,
        drep_active: details.drepActive === true,
        summary: details.voteKind
            ? `Casting ${details.voteKind} as DRep`
            : 'Preparing DRep vote'
    };
}

function createCatalystProposalBotContext(proposal) {
    return {
        kind: 'catalyst_proposal',
        id: String(proposal?.id || '').trim(),
        title: proposal?.title || 'Catalyst proposal',
        proposer: proposal?.business || proposal?.ideascale_user || null,
        fund: proposal?.fund_name || null,
        status: proposal?.project_status || proposal?.funding_status || null,
        requested_usd: proposal?.amount_requested_usd ?? null,
        received_usd: proposal?.amount_received_usd ?? null
    };
}

function createCipBotContext(cip) {
    return {
        kind: 'cip',
        section: 'CIPs',
        id: String(cip?.id || '').trim(),
        title: cip?.title || 'Cardano Improvement Proposal',
        status: cip?.status || null,
        category: cip?.category || null,
        root: 'Cardano Improvement Proposals',
        summary: [
            cip?.id || null,
            cip?.status || null,
            cip?.abstract || cip?.motivation || null
        ].filter(Boolean).join(' • ')
    };
}

function createFundingRecipientBotContext(group) {
    const actions = getTreasuryBusinessActions(group);
    const catalystProjects = Array.isArray(group?.catalystProjects) ? group.catalystProjects : [];
    return {
        kind: 'funding_recipient',
        section: 'Catalyst/Treasury Recipients',
        recipient: group?.label || '',
        title: group?.label || 'Funding recipient',
        id: group?.key || group?.label || '',
        amount_usd: Number(group?.value) || null,
        amount_ada: Number(group?.adaValue) || null,
        treasury_withdrawals: actions.length,
        catalyst_projects: catalystProjects.length,
        funded_projects: actions.length + catalystProjects.length,
        websites: getTreasuryBusinessWebsiteUrls(group),
        summary: `${(actions.length + catalystProjects.length).toLocaleString('en-US')} funded projects`
    };
}

function createWebsiteSectionBotContext(section, details = {}) {
    return {
        kind: 'site_section',
        section,
        title: details.title || section,
        menu: details.menu || details.title || section,
        id: details.id || null,
        count: hasFiniteDetailNumber(details.count) ? Number(details.count) : null,
        amount_usd: hasFiniteDetailNumber(details.amount_usd) ? Number(details.amount_usd) : null,
        amount_ada: hasFiniteDetailNumber(details.amount_ada) ? Number(details.amount_ada) : null,
        status: details.status || null,
        root: details.root || section,
        summary: details.summary || null
    };
}

function hasFiniteDetailNumber(value) {
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function createGovernanceActionGroupBotContext(titleText, proposals = [], details = {}) {
    const actions = Array.isArray(proposals) ? proposals : [];
    return createWebsiteSectionBotContext('Gov Actions', {
        title: titleText,
        id: details.groupKey || details.status || null,
        count: actions.length,
        status: details.status || null,
        root: details.rootTitle || 'Cardano Governance',
        summary: [
            `${actions.length.toLocaleString('en-US')} governance actions`,
            details.status || null
        ].filter(Boolean).join(' • ')
    });
}

function createTreasuryBotContext(payload = treasuryState) {
    const withdrawals = getTreasuryWithdrawals(payload || {});
    return createWebsiteSectionBotContext('Treasury', {
        title: 'Cardano Treasury',
        count: withdrawals.length,
        amount_ada: Number(payload?.treasury_ada ?? payload?.treasury?.amount_ada),
        amount_usd: Number(payload?.treasury_usd ?? payload?.treasury?.amount_usd),
        summary: `${withdrawals.length.toLocaleString('en-US')} enacted withdrawals`
    });
}

function createTreasuryAdministratorBotContext(group) {
    return createWebsiteSectionBotContext('Treasury', {
        title: group?.label || 'Treasury administrator',
        id: group?.key || group?.label || null,
        count: Array.isArray(group?.withdrawals) ? group.withdrawals.length : 0,
        amount_usd: Number(group?.value),
        amount_ada: Number(group?.adaValue),
        root: 'Cardano Treasury',
        summary: `${(group?.withdrawals?.length || 0).toLocaleString('en-US')} withdrawals`
    });
}

function createCatalystFundBotContext(fund) {
    return createWebsiteSectionBotContext('Catalyst', {
        title: fund?.fund_name || 'Catalyst fund',
        id: fund?.fund_name || null,
        count: Number(fund?.proposal_count),
        amount_usd: Number(fund?.requested_amount),
        amount_ada: Number(fund?.requested_ada),
        root: 'Catalyst/Treasury Funding',
        summary: [
            `${Number(fund?.proposal_count || 0).toLocaleString('en-US')} proposals`,
            `claimed ${formatCatalystFundAmount(fund, 'claimed', true)}`,
            `not claimed ${formatCatalystFundAmount(fund, 'not_claimed', true)}`
        ].join(' • ')
    });
}

function createDrepBotContext(drep, details = {}) {
    return createWebsiteSectionBotContext('DReps', {
        title: drep?.name || details.title || 'DRep',
        id: drep?.id || details.id || null,
        count: details.count,
        amount_ada: Number(drep?.votingPower) / 1_000_000,
        status: drep?.active === true ? 'Active' : drep?.active === false ? 'Inactive' : details.status,
        root: 'DReps',
        summary: [
            drep?.active === true ? 'Active DRep' : drep?.active === false ? 'Inactive DRep' : null,
            Number.isFinite(Number(drep?.votingPower)) ? `Voting power ${formatCompactAdaFromLovelace(drep.votingPower)}` : null,
            Number.isFinite(Number(details.count)) ? `${Number(details.count).toLocaleString('en-US')} actions` : null
        ].filter(Boolean).join(' • ')
    });
}

function createSpoBotContext(spo, details = {}) {
    return createWebsiteSectionBotContext('SPOs', {
        title: getSpoDisplayName(spo || {}),
        id: spo?.pool_id || details.id || null,
        count: details.count,
        amount_ada: Number(spo?.delegated_lovelace) / 1_000_000,
        status: getSpoCloudHostingType(spo || {}) === 'cloud-spo' ? 'Cloud SPO' : 'SPO',
        root: 'SPOs',
        summary: [
            spo?.ticker ? `Ticker ${spo.ticker}` : null,
            Number.isFinite(Number(spo?.delegated_lovelace)) ? `Delegation ${formatCompactAdaFromLovelace(spo.delegated_lovelace)}` : null,
            Number.isFinite(Number(spo?.delegator_count)) ? `${Number(spo.delegator_count).toLocaleString('en-US')} delegators` : null,
            getSpoCloudServiceText(spo || {})
        ].filter(Boolean).join(' • ')
    });
}

function createCommitteeMemberBotContext(member, details = {}) {
    return createWebsiteSectionBotContext('CC Members', {
        title: member?.name || 'Constitutional Committee Member',
        id: member?.id || null,
        count: details.count,
        status: member?.status || null,
        root: 'CC Members',
        summary: [
            member?.expiresEpoch ? `expires epoch ${member.expiresEpoch}` : null,
            Number.isFinite(Number(details.count)) ? `${Number(details.count).toLocaleString('en-US')} actions` : null
        ].filter(Boolean).join(' • ')
    });
}

function updateGovernanceOverlayBotContext(id, context, contextElement = null) {
    const contextualOverlay = contextElement?.closest?.('.governance-menu-overlay');
    const overlay = contextualOverlay?.dataset.governanceOverlayId === id
        ? contextualOverlay
        : getTopGovernanceMenuOverlay(id);
    if (overlay && context) overlay.governanceBotContext = context;
}

function getConstitutionChatRequestContext(context) {
    if (!context || typeof context !== 'object') return null;
    return Object.fromEntries(Object.entries(context)
        .filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

function createGovernanceProposalActionButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `governance-vote-button governance-proposal-action-button ${className}`;
    button.textContent = label;
    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
    });
    return button;
}

function openProposalSummaryOverlay(proposal, returnFocus, options = {}) {
    openUniversalProposalSummaryOverlay({
        proposal,
        returnFocus,
        apiUrl: getProposalSummaryApiUrl(proposal?.proposal_id),
        headerMeta: window.TDSPRuntime.formatReadableLabel(getEffectiveProposalType(proposal), 'Governance'),
        rootTitle: getProposalTitle(proposal),
        showClose: options.showClose
    });
}

function openCatalystProposalSummaryOverlay(proposal, returnFocus) {
    openUniversalProposalSummaryOverlay({
        proposal,
        returnFocus,
        apiUrl: getCatalystProposalSummaryApiUrl(proposal?.id),
        headerMeta: [proposal?.fund_name, 'Project Catalyst'].filter(Boolean).join(' • '),
        rootTitle: proposal?.title || 'Catalyst proposal'
    });
}

function openUniversalProposalSummaryOverlay({
    proposal,
    returnFocus,
    apiUrl,
    headerMeta,
    rootTitle,
    showClose
}) {
    const content = document.createElement('div');
    content.className = 'governance-proposal-summary governance-menu-card';
    renderProposalSummaryMessage(content, 'Loading AI summary...');

    createGovernanceMenuOverlay({
        id: 'governance-proposal-summary-overlay',
        titleId: 'governance-proposal-summary-title',
        titleText: 'Proposal Summary',
        closeLabel: 'Close proposal summary',
        closeOverlay: closeProposalSummaryOverlay,
        bodyNodes: [content],
        headerMeta,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle,
        showClose,
        botContext: proposal?.proposal_id
            ? createGovernanceActionBotContext(proposal)
            : proposal?.id
                ? createCatalystProposalBotContext(proposal)
                : undefined
    });

    loadProposalSummary(apiUrl, content).catch(() => {
        if (!content.isConnected) return;
        renderProposalSummaryMessage(content, 'The AI summary could not be loaded.');
    });
}

function closeProposalSummaryOverlay() {
    removeGovernanceMenuOverlay('governance-proposal-summary-overlay');
}

async function loadProposalSummary(apiUrl, container, attempt = 0) {
    const payload = await fetchJson(apiUrl);
    if (!container.isConnected) return;

    if (payload?.status === 'pending') {
        renderProposalSummaryMessage(container, 'This summary is being generated by the local AI...');
        if (attempt < 24) {
            window.setTimeout(() => {
                if (!container.isConnected) return;
                loadProposalSummary(apiUrl, container, attempt + 1).catch(() => {});
            }, 5000);
        }
        return;
    }

    container.replaceChildren();
    const summarySections = [
        ['who_is_asking', 'Who is asking?'],
        ['amount_requested', 'How much are they asking?'],
        ['building_or_solving', 'What are they building or solving?'],
        ['approach', 'How will they do this?'],
        ['cardano_or_treasury_benefit', 'What will this bring Cardano and/or the Treasury?']
    ];
    if (payload?.sections && typeof payload.sections === 'object') {
        const summary = document.createElement('div');
        summary.className = 'governance-proposal-summary-sections';
        summarySections.forEach(([key, heading]) => {
            const section = document.createElement('section');
            section.className = 'governance-proposal-summary-section';
            const title = document.createElement('h3');
            title.textContent = heading;
            const text = document.createElement('p');
            text.textContent = payload.sections[key] || 'Not stated in the proposal.';
            section.append(title, text);
            summary.appendChild(section);
        });
        container.appendChild(summary);
    } else {
        const summary = document.createElement('p');
        summary.className = 'governance-proposal-summary-text';
        summary.textContent = payload?.summary || 'No summary is available.';
        container.appendChild(summary);
    }

    const warning = document.createElement('p');
    warning.className = 'small-text governance-proposal-summary-warning';
    warning.textContent = payload?.status === 'stale'
        ? '!! AI-generated summary based on an older proposal version. Verify it against the full proposal. !!'
        : '!! AI-generated summary. Verify important details against the full proposal before making decisions. !!';
    container.appendChild(warning);
}

function renderProposalSummaryMessage(container, message) {
    container.replaceChildren();
    const status = document.createElement('p');
    status.className = 'small-text';
    status.textContent = message;
    container.appendChild(status);
}

function renderGovernanceProposalDetails(container, proposal, options = {}) {
    container.textContent = '';
    addDetailRow(container, 'Action ID', proposal.proposal_id, {
        copyLabel: 'governance action ID'
    });
    getProposalTreasuryStakeAddresses(proposal).forEach((address, index) => {
        addDetailRow(
            container,
            index === 0 ? 'Stake address' : `Stake address ${index + 1}`,
            address,
            {
                copyLabel: 'treasury stake address',
                displayValue: window.TDSPRuntime.shortenMiddle(address)
            }
        );
    });
    addDetailRow(container, 'Transaction', proposal.proposal_tx_hash);

    const body = proposal.meta_json?.body || proposal.meta_json || {};
    addMarkdownDetailSection(container, 'Abstract', body.abstract);
    addMarkdownDetailSection(container, 'Motivation', body.motivation);
    addMarkdownDetailSection(container, 'Rationale', body.rationale);
    addEmbeddedGovernanceImages(container, proposal);

    if (options.isLoading || options.hasError) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = options.hasError
            ? 'Proposal details could not be loaded.'
            : 'Loading proposal details...';
        container.appendChild(message);
    }
}

function getProposalTreasuryStakeAddresses(proposal) {
    const proposalId = String(proposal?.proposal_id || '').trim();
    const addresses = [
        proposal?.treasury_stake_address,
        proposal?.stake_address,
        proposal?.withdrawal_stake_address
    ];
    if (proposalId && treasuryState) {
        getTreasuryWithdrawals(treasuryState)
            .filter(withdrawal => String(withdrawal?.action_id || '').trim() === proposalId)
            .forEach(withdrawal => addresses.push(withdrawal?.stake_address));
    }
    return [...new Set(addresses.map(address => String(address || '').trim()).filter(Boolean))];
}

async function loadProposalDetails(proposal) {
    const proposalId = proposal?.proposal_id;
    if (!proposalId) return proposal;
    if (!proposalDetailsCache.has(proposalId)) {
        const request = fetchJson(getProposalDetailApiUrl(proposalId))
            .then(payload => {
                const rawProposal = payload?.proposal || payload;
                const responseProposalId = rawProposal?.proposal_id
                    || rawProposal?.id
                    || rawProposal?.gov_action_id
                    || rawProposal?.action_id
                    || '';
                if (
                    !rawProposal
                    || String(responseProposalId).toLowerCase() !== String(proposalId).toLowerCase()
                ) {
                    throw new Error('Proposal detail response is invalid');
                }
                const normalized = normalizeGovernanceProposal(
                    rawProposal,
                    rawProposal?.voting_summary || rawProposal?.vote_summary || null,
                    rawProposal
                );
                return { ...proposal, ...normalized, metadata_compact: false };
            })
            .catch(error => {
                proposalDetailsCache.delete(proposalId);
                throw error;
            });
        proposalDetailsCache.set(proposalId, request);
    }
    return proposalDetailsCache.get(proposalId);
}

function closeGovernanceOverlay() {
    removeGovernanceMenuOverlay('governance-overlay');
}

function isGovernanceProposalOpenForVoting(proposal) {
    if (!proposal?.proposal_id) return false;
    if (
        proposal.ratified_epoch !== null
        || proposal.enacted_epoch !== null
        || proposal.expired_epoch !== null
        || proposal.dropped_epoch !== null
    ) return false;

    const expirationEpoch = Number(proposal.expiration);
    const currentEpoch = Number(getClockEpochSnapshot()?.epoch);
    return !Number.isFinite(expirationEpoch)
        || !Number.isFinite(currentEpoch)
        || currentEpoch <= expirationEpoch;
}

function loadGovernanceMesh() {
    if (!governanceMeshPromise) {
        governanceMeshPromise = import(GOVERNANCE_MESH_CDN_URL).catch(error => {
            governanceMeshPromise = null;
            throw error;
        });
    }
    return governanceMeshPromise;
}

function closeGovernanceVoteOverlay() {
    removeGovernanceMenuOverlay('governance-vote-overlay');
}

function openGovernanceVoteOverlay(proposal, returnFocus) {
    const content = document.createElement('div');
    content.className = 'governance-vote-flow';

    createGovernanceMenuOverlay({
        id: 'governance-vote-overlay',
        titleId: 'governance-vote-title',
        titleText: 'Cast DRep vote',
        closeLabel: 'Close DRep voting',
        closeOverlay: closeGovernanceVoteOverlay,
        bodyNodes: [content],
        headerMeta: getProposalMeta(proposal),
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: getProposalTitle(proposal),
        botContext: createGovernanceVoteBotContext(proposal)
    });

    renderGovernanceVoteChoice(content, proposal);
}

function renderGovernanceVoteChoice(container, proposal) {
    container.replaceChildren();

    const warning = document.createElement('div');
    warning.className = 'governance-vote-warning governance-menu-card';
    const warningTitle = document.createElement('strong');
    warningTitle.textContent = getProposalTitle(proposal);
    const actionIdLine = document.createElement('div');
    actionIdLine.className = 'governance-drep-id-line governance-vote-action-id-line';
    const actionId = document.createElement('span');
    actionId.className = 'governance-drep-id governance-vote-action-id';
    actionId.textContent = proposal.proposal_id;
    actionIdLine.append(actionId, createGovernanceCopyButton(proposal.proposal_id, 'governance action ID'));
    const warningText = document.createElement('p');
    warningText.textContent = 'Voting creates a Cardano Mainnet transaction and costs a network fee. Always verify the governance action, vote choice and fee in your wallet before signing.';
    warning.append(warningTitle, actionIdLine, warningText);

    const label = document.createElement('strong');
    label.textContent = 'Choose your vote';
    const choices = document.createElement('div');
    choices.className = 'governance-vote-choices';
    ['Yes', 'No', 'Abstain'].forEach(voteKind => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'governance-vote-choice';
        button.textContent = voteKind;
        button.addEventListener('click', () => renderGovernanceVoteWallets(container, proposal, voteKind));
        choices.appendChild(button);
    });

    container.append(warning, label, choices);
}

async function renderGovernanceVoteWallets(container, proposal, voteKind) {
    container.replaceChildren();
    updateGovernanceVoteBotContext(proposal, { voteKind }, container);
    appendGovernanceVoteStatus(container, `Selected vote: ${voteKind}. Detecting CIP-95 wallets...`);

    try {
        const { BrowserWallet } = await loadGovernanceMesh();
        if (!container.isConnected) return;
        const wallets = BrowserWallet.getInstalledWallets();
        container.replaceChildren();

        const selected = document.createElement('div');
        selected.className = 'governance-vote-selection governance-menu-card';
        selected.textContent = `${getProposalTitle(proposal)} - ${voteKind}`;
        container.appendChild(selected);

        if (!wallets.length) {
            appendGovernanceVoteStatus(container, 'No Cardano wallet extension detected. Install a CIP-30/CIP-95 wallet and reopen this dialog.', true);
            appendGovernanceVoteChangeButton(container, proposal);
            return;
        }

        const label = document.createElement('strong');
        label.textContent = 'Connect your DRep wallet';
        const list = document.createElement('div');
        list.className = 'wallet-list governance-vote-wallet-list';
        wallets.forEach(walletInfo => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wallet-option';
            const icon = document.createElement('img');
            icon.src = walletInfo.icon;
            icon.alt = '';
            icon.width = 28;
            icon.height = 28;
            const name = document.createElement('span');
            name.textContent = walletInfo.name;
            button.append(icon, name);
            button.addEventListener('click', () => prepareGovernanceVote(container, proposal, voteKind, walletInfo));
            list.appendChild(button);
        });
        container.append(label, list);
        appendGovernanceVoteChangeButton(container, proposal);
    } catch (error) {
        console.error('DRep wallet detection failed', error);
        if (!container.isConnected) return;
        container.replaceChildren();
        appendGovernanceVoteStatus(container, 'The wallet connector could not be loaded. No transaction was built.', true);
        appendGovernanceVoteChangeButton(container, proposal);
    }
}

function appendGovernanceVoteChangeButton(container, proposal) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'governance-vote-secondary';
    button.textContent = 'Change vote';
    button.addEventListener('click', () => renderGovernanceVoteChoice(container, proposal));
    container.appendChild(button);
}

function appendGovernanceVoteStatus(container, message, isError = false) {
    const status = document.createElement('p');
    status.className = `governance-vote-status${isError ? ' is-error' : ''}`;
    status.textContent = message;
    container.appendChild(status);
    return status;
}

async function prepareGovernanceVote(container, proposal, voteKind, walletInfo) {
    container.replaceChildren();
    const status = appendGovernanceVoteStatus(container, `Connecting to ${walletInfo.name} with CIP-95...`);

    try {
        const latestProposal = findCurrentGovernanceProposal(proposal.proposal_id) || proposal;
        if (!isGovernanceProposalOpenForVoting(latestProposal)) {
            throw new Error('This governance action is no longer open for voting.');
        }
        const actionRef = getGovernanceActionReference(latestProposal);
        const { BrowserWallet, MeshTxBuilder } = await loadGovernanceMesh();
        const wallet = await BrowserWallet.enable(walletInfo.id, [{ cip: 95 }]);
        const networkId = await wallet.getNetworkId();
        if (networkId !== 1) throw new Error('Switch your wallet to Cardano Mainnet.');

        const extensions = await wallet.getExtensions().catch(() => []);
        const drep = await wallet.getDRep();
        if (!extensions.includes(95) || !drep?.dRepIDCip105) {
            throw new Error('This wallet did not provide CIP-95 DRep access. No transaction was built.');
        }

        status.textContent = 'Verifying DRep registration...';
        const drepPayload = await fetchWalletDrepDetails(drep, { allowDetailLookup: false });
        const drepInfo = drepPayload?.info;
        if (!drepInfo || drepInfo.drep_status !== 'registered') {
            throw new Error('The connected wallet DRep is not in the cached registered DRep directory. No transaction was built. If this DRep was just registered, wait for the DRep cache refresh and try again.');
        }
        const drepName = extractDrepNameFromEntry(drepInfo) || extractDrepNameFromEntry(drepPayload?.metadata);

        status.textContent = 'Checking current vote cache...';
        const voteLookup = await fetchOptionalProposalVotesPayload(latestProposal.proposal_id, 8000);
        const existingVote = voteLookup.payload?.votes?.dreps
            ? findExistingDrepVote(voteLookup.payload, drep)
            : null;
        updateGovernanceVoteBotContext(latestProposal, {
            voteKind,
            walletName: walletInfo.name,
            drep,
            existingVote,
            drepName,
            drepActive: drepInfo.active === true
        }, container);
        renderGovernanceVoteReview(container, {
            proposal: latestProposal,
            voteKind,
            wallet,
            walletName: walletInfo.name,
            drep,
            actionRef,
            existingVote,
            voteLookupWarning: voteLookup.error
                ? 'Current on-chain vote could not be checked quickly. If you already voted, submitting may replace that vote and charge another network fee.'
                : '',
            drepName,
            drepActive: drepInfo.active === true,
            MeshTxBuilder
        });
    } catch (error) {
        console.error('DRep vote preparation failed', error);
        if (!container.isConnected) return;
        container.replaceChildren();
        appendGovernanceVoteStatus(container, error?.message || 'DRep voting could not be prepared. No transaction was built.', true);
        appendGovernanceVoteChangeButton(container, proposal);
    }
}

function updateGovernanceVoteBotContext(proposal, details = {}, contextElement = null) {
    const contextualOverlay = contextElement?.closest?.('.governance-menu-overlay');
    const overlay = contextualOverlay?.dataset.governanceOverlayId === 'governance-vote-overlay'
        ? contextualOverlay
        : getTopGovernanceMenuOverlay('governance-vote-overlay');
    if (overlay) {
        overlay.governanceBotContext = createGovernanceVoteBotContext(proposal, details);
    }
}

function findCurrentGovernanceProposal(proposalId) {
    if (!governanceGroupsState) return null;
    return Object.values(governanceGroupsState)
        .flat()
        .find(proposal => proposal?.proposal_id === proposalId) || null;
}

function getGovernanceActionReference(proposal) {
    const txHash = String(proposal?.proposal_tx_hash || '').toLowerCase();
    const txIndex = Number(proposal?.proposal_index);
    if (!/^[0-9a-f]{64}$/.test(txHash) || !Number.isInteger(txIndex) || txIndex < 0) {
        throw new Error('The governance action transaction reference is incomplete. No transaction was built.');
    }
    const decoded = decodeGovernanceActionId(proposal?.proposal_id);
    if (!decoded || decoded.txHash !== txHash || decoded.txIndex !== txIndex) {
        throw new Error('The governance action ID does not match its transaction reference. No transaction was built.');
    }
    return { txHash, txIndex };
}

function decodeGovernanceActionId(value) {
    const encoded = String(value || '').toLowerCase();
    const separator = encoded.lastIndexOf('1');
    if (!encoded.startsWith('gov_action1') || separator < 1) return null;

    const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const values = Array.from(encoded.slice(separator + 1), character => charset.indexOf(character));
    if (values.length < 7 || values.some(number => number < 0)) return null;
    const hrp = encoded.slice(0, separator);
    const expandedHrp = [
        ...Array.from(hrp, character => character.charCodeAt(0) >> 5),
        0,
        ...Array.from(hrp, character => character.charCodeAt(0) & 31)
    ];
    if (getBech32Polymod([...expandedHrp, ...values]) !== 1) return null;

    let accumulator = 0;
    let bitCount = 0;
    const bytes = [];
    for (const number of values.slice(0, -6)) {
        accumulator = ((accumulator << 5) | number) & 0xfff;
        bitCount += 5;
        while (bitCount >= 8) {
            bitCount -= 8;
            bytes.push((accumulator >> bitCount) & 0xff);
        }
    }
    if (bytes.length !== 33 || (bitCount > 0 && (accumulator & ((1 << bitCount) - 1)) !== 0)) return null;

    return {
        txHash: bytes.slice(0, 32).map(number => number.toString(16).padStart(2, '0')).join(''),
        txIndex: bytes[32]
    };
}

function getBech32Polymod(values) {
    const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let checksum = 1;
    values.forEach(value => {
        const top = checksum >>> 25;
        checksum = ((checksum & 0x1ffffff) << 5) ^ value;
        generators.forEach((generator, index) => {
            if ((top >>> index) & 1) checksum ^= generator;
        });
    });
    return checksum >>> 0;
}

function findExistingDrepVote(payload, drep) {
    const buckets = payload?.votes?.dreps;
    if (!buckets || typeof buckets !== 'object') return null;
    const drepIdentifiers = new Set(getWalletDrepIdentifiers(drep));

    for (const key of ['yes', 'no', 'abstain', 'unknown']) {
        const votes = Array.isArray(buckets[key]) ? buckets[key] : [];
        const match = votes.find(vote => [
            vote?.voter_id,
            vote?.drep_id,
            vote?.drep_id_bech32,
            vote?.voter_hex,
            vote?.hex,
            vote?.drep_hash,
            vote?.voter
        ].some(identifier => drepIdentifiers.has(normalizeGovernanceIdentifier(identifier))));
        if (match) return formatVoteChoice(match.vote || key);
    }
    return null;
}

function getWalletDrepIdentifiers(drep) {
    return [...new Set([
        drep?.publicKeyHash,
        drep?.dRepIDCip105
    ].map(normalizeGovernanceIdentifier).filter(Boolean))];
}

async function fetchWalletDrepDetails(drep, options = {}) {
    const cachedDirectoryPayload = await findWalletDrepInDirectory(drep).catch(() => null);
    if (cachedDirectoryPayload?.info) return cachedDirectoryPayload;
    if (options.allowDetailLookup === false) return null;

    const identifiers = getWalletDrepIdentifiers(drep);
    let fallbackPayload = null;
    let lastError = null;

    for (const identifier of identifiers) {
        try {
            const payload = await fetchJson(getDrepDetailApiUrl(identifier), { cache: 'no-store' });
            fallbackPayload ||= payload;
            if (payload?.info) return payload;
        } catch (error) {
            lastError = error;
        }
    }

    if (fallbackPayload) return fallbackPayload;
    if (lastError) throw lastError;
    return null;
}

async function findWalletDrepInDirectory(drep) {
    const identifiers = new Set();
    getWalletDrepIdentifiers(drep).forEach(identifier => {
        const normalized = normalizeGovernanceIdentifier(identifier);
        const shortened = shortenDrepIdentifier(normalized);
        if (normalized) identifiers.add(normalized);
        if (shortened) identifiers.add(shortened);
    });
    if (!identifiers.size) return null;

    const payload = await fetchDrepInfoPayload();
    const match = unwrapDrepEntries(payload).find(entry => {
        const entryIdentifiers = getDrepEntryIdentifiers(entry);
        return entryIdentifiers.some(identifier => {
            const normalized = normalizeGovernanceIdentifier(identifier);
            const shortened = shortenDrepIdentifier(normalized);
            return identifiers.has(normalized) || identifiers.has(shortened);
        });
    });
    if (!match) return null;

    const drepId = match.drep_id || match.drepId || drep?.dRepIDCip105 || match.id || '';
    const drepName = extractDrepNameFromEntry(match);
    return {
        drep_id: drepId,
        requested_drep_id: drep?.dRepIDCip105 || drep?.publicKeyHash || '',
        metadata: match.metadata || null,
        name: drepName || null,
        info: {
            ...match,
            name: drepName || match.name,
            drep_id: drepId,
            drep_status: match.drep_status || 'registered',
            active: match.active === true
        },
        source: 'drep_directory_cache'
    };
}

function renderGovernanceVoteReview(container, context) {
    container.replaceChildren();
    const review = document.createElement('div');
    review.className = 'governance-vote-review governance-menu-card';
    addDetailRow(review, 'Governance action', getProposalTitle(context.proposal));
    addDetailRow(review, 'Action ID', context.proposal.proposal_id);
    addDetailRow(review, 'DRep', context.drep.dRepIDCip105);
    addDetailRow(review, 'DRep status', context.drepActive ? 'Active' : 'Inactive');
    addDetailRow(review, 'Vote', context.voteKind);
    addDetailRow(review, 'Wallet', context.walletName);
    if (context.existingVote) addDetailRow(review, 'Current on-chain vote', context.existingVote);
    if (context.voteLookupWarning) addDetailRow(review, 'Current vote check', context.voteLookupWarning);
    review.appendChild(createGovernanceVoteReviewLinks(context));

    const isSameVote = context.existingVote === context.voteKind;
    let rationale = null;
    if (!isSameVote) {
        rationale = createGovernanceVoteRationaleFields(context);
        review.appendChild(rationale.wrapper);
    }

    const warning = document.createElement('p');
    warning.className = 'governance-vote-review-warning';
    warning.textContent = isSameVote
        ? `The cached on-chain data already shows a ${context.voteKind} vote from this DRep. No transaction will be built, avoiding another network fee.`
        : context.existingVote
        ? `Submitting will replace your current ${context.existingVote} vote and charge another network fee. Verify everything in your wallet before signing.`
        : 'Submitting creates a vote transaction and charges a network fee. Verify everything in your wallet before signing.';

    container.append(review, warning);
    if (!isSameVote) {
        const submit = document.createElement('button');
        submit.type = 'button';
        submit.className = 'governance-vote-submit';
        submit.textContent = `Continue with ${context.voteKind}`;
        submit.addEventListener('click', () => {
            let rationaleMetadata;
            try {
                rationaleMetadata = createGovernanceVoteRationaleMetadata(
                    context,
                    rationale?.nameInput.value,
                    rationale?.reasonInput.value
                );
            } catch (error) {
                appendGovernanceVoteStatus(container, error?.message || 'Vote rationale is invalid.', true);
                return;
            }
            submitGovernanceVote(container, { ...context, rationaleMetadata }, submit);
        });
        container.appendChild(submit);
    }
    appendGovernanceVoteChangeButton(container, context.proposal);
}

function createGovernanceVoteReviewLinks(context) {
    const actions = document.createElement('div');
    actions.className = 'governance-action-buttons governance-vote-review-links';
    actions.append(
        createGovernanceProposalActionButton(
            'Summary',
            'governance-summary-button',
            event => openProposalSummaryOverlay(context.proposal, event.currentTarget, { showClose: false })
        ),
        createGovernanceProposalActionButton(
            'Full gov action',
            'governance-full-action-button',
            event => openGovernanceOverlay(context.proposal, {
                returnFocus: event.currentTarget,
                showClose: false
            })
        )
    );
    return actions;
}

function createGovernanceVoteRationaleFields(context) {
    const wrapper = document.createElement('section');
    wrapper.className = 'governance-vote-rationale';
    const title = document.createElement('strong');
    title.textContent = 'On-chain rationale (optional)';
    const help = document.createElement('p');
    help.className = 'small-text governance-drep-registration-help';
    help.textContent = 'Your rationale can be up to 5000 characters and will be included as Cardano transaction metadata in this vote transaction. Long text is split into 64-byte chunks automatically.';

    const drepField = createDrepRegistrationField(
        'DRep key',
        'governance-vote-rationale-drep',
        '',
        context.drep.dRepIDCip105 || ''
    );
    drepField.input.readOnly = true;
    const nameField = createDrepRegistrationField(
        'Your name',
        'governance-vote-rationale-name',
        'Your public DRep name',
        context.drepName || ''
    );
    const reasonField = createDrepRegistrationTextArea(
        'Reason for this vote (English)',
        'governance-vote-rationale-reason',
        `I voted ${context.voteKind} because...`,
        ''
    );
    reasonField.input.maxLength = 5000;
    reasonField.input.rows = 6;

    const output = document.createElement('div');
    output.className = 'governance-vote-rationale-output';
    output.hidden = true;
    const assistantActions = document.createElement('div');
    assistantActions.className = 'governance-action-buttons governance-vote-rationale-actions';
    const improveButton = createGovernanceProposalActionButton(
        'TDSPBot improve rationale',
        'governance-tdspbot-button',
        () => improveGovernanceVoteRationale(context, {
            nameInput: nameField.input,
            reasonInput: reasonField.input,
            output
        })
    );
    assistantActions.appendChild(improveButton);

    wrapper.append(
        title,
        help,
        drepField.wrapper,
        nameField.wrapper,
        reasonField.wrapper,
        assistantActions,
        output
    );
    return {
        wrapper,
        nameInput: nameField.input,
        reasonInput: reasonField.input
    };
}

async function improveGovernanceVoteRationale(context, controls) {
    const name = cleanGovernanceText(String(controls.nameInput?.value || '').trim());
    const reason = cleanGovernanceText(String(controls.reasonInput?.value || '').trim());
    const output = controls.output;
    if (!output) return;
    output.hidden = false;
    output.replaceChildren();
    const status = document.createElement('p');
    status.className = 'small-text governance-vote-rationale-status';
    status.textContent = reason
        ? 'TDSPBot is improving your rationale...'
        : 'Add your reason or pointers first, then TDSPBot can improve it.';
    output.appendChild(status);
    if (!reason) return;

    try {
        const answer = await requestGovernanceVoteRationaleImprovement(context, name, reason);
        if (!output.isConnected) return;
        const improved = cleanGovernanceRationaleSuggestion(answer);
        output.replaceChildren();

        const label = document.createElement('strong');
        label.textContent = 'Improved rationale';
        const improvedField = createDrepRegistrationTextArea(
            'Improved rationale',
            'governance-vote-rationale-improved',
            '',
            improved
        );
        improvedField.wrapper.querySelector('label')?.remove();
        improvedField.input.rows = 7;
        improvedField.input.maxLength = 5000;

        const useButton = document.createElement('button');
        useButton.type = 'button';
        useButton.className = 'governance-vote-secondary';
        useButton.textContent = 'Use improved rationale';
        useButton.addEventListener('click', () => {
            controls.reasonInput.value = improvedField.input.value;
            controls.reasonInput.dispatchEvent(new Event('input', { bubbles: true }));
            status.textContent = 'Improved rationale copied into your original rationale field. Review it before continuing.';
            output.prepend(status);
        });

        const note = document.createElement('p');
        note.className = 'small-text governance-vote-rationale-status';
        note.textContent = 'Review this text carefully. It will only be used when you copy it into the original rationale field and continue.';

        output.append(label, improvedField.wrapper, useButton, note);
    } catch (error) {
        if (!output.isConnected) return;
        status.classList.add('is-error');
        status.textContent = error?.message || 'TDSPBot could not improve the rationale right now.';
    }
}

async function requestGovernanceVoteRationaleImprovement(context, name, reason) {
    const proposal = context.proposal || {};
    const question = [
        'Improve the selected DRep vote rationale in clear English.',
        'Treat the supplied original rationale as a hard instruction for the argument, emphasis, and conclusion.',
        'The original rationale may be written in any language; translate it to English by default.',
        'Write it in first person as my public DRep rationale explaining why I voted this way.',
        'The improved rationale must argue for the supplied vote choice, especially when the vote is No or Abstain.',
        'If the original text is only a proposal summary, turn it into a rationale explaining why that summary led to the supplied vote choice.',
        'Do not replace the user argument with a generic proposal summary.',
        'Keep the vote choice unchanged and return only the improved rationale text.'
    ].join('\n');
    const proposalContext = getGovernanceVoteRationaleProposalContext(proposal);
    const governanceContinuityNote = [
        'If relevant to this vote, clearly explain that without enough Constitutional Committee voting,',
        'Cardano governance can stall and governance actions can remain unconstitutional until either',
        'a second voting round reaches enough CC votes or the CC size is reduced to 3, which itself also requires a governance vote.'
    ].join(' ');

    const payload = await fetchJson(getConstitutionChatApiUrl(), {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            question,
            history: [],
            stream: false,
            context: {
                ...createGovernanceActionBotContext(proposal),
                task: 'improve_drep_vote_rationale',
                vote_choice: context.voteKind,
                drep_name: name || null,
                original_rationale: reason,
                proposal_context: proposalContext,
                rationale_instruction: [
                    'The original rationale is the source of truth for what the improved rationale must say.',
                    'Preserve every substantive point from the original rationale, including governance risk, consequences, timing, and required follow-up actions.',
                    'Accept original rationale input in any language and translate it to English by default.',
                    'Write the result in first person from the DRep perspective, focused on why this vote choice was made.',
                    `The rationale must clearly support a ${context.voteKind} vote. Do not write text that sounds like support for a different vote choice.`,
                    'For a No vote, frame proposal facts as concerns, objections, risks, missing separation, insufficient clarity, or reasons not to approve.',
                    'For an Abstain vote, frame proposal facts as reasons to withhold support or opposition.',
                    'If the original rationale is mostly a neutral proposal summary, infer the vote rationale from the selected vote choice and the concerns implied by that summary.',
                    'Fix spelling and grammar.',
                    'Make the rationale professional, readable, and suitable as public on-chain transaction metadata.',
                    'You may use proposal context only to improve accuracy and wording, not to override the original argument.',
                    'Do not add headings, bullets, or explanations.',
                    'Keep the improved text under 5000 characters.',
                    governanceContinuityNote
                ].join(' ')
            }
        })
    });
    const answer = String(payload.answer || '').trim();
    if (!answer) throw new Error('TDSPBot returned an empty rationale.');
    return answer;
}

function getGovernanceVoteRationaleProposalContext(proposal) {
    const body = proposal?.meta_json?.body || proposal?.metadata?.body || {};
    return [
        body.abstract,
        body.problem_statement,
        body.problem,
        body.motivation,
        body.rationale,
        body.solution,
        body.deliverables,
        proposal?.abstract,
        proposal?.rationale,
        proposal?.motivation,
        proposal?.summary
    ]
        .map(value => cleanGovernanceText(String(value || '').trim()))
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 5000)
        || 'No proposal body text is available in the current page data.';
}

function cleanGovernanceRationaleSuggestion(value) {
    const text = cleanGovernanceText(String(value || '')
        .replace(/^["“”]+|["“”]+$/g, '')
        .replace(/^improved rationale\s*:?\s*/i, '')
        .replace(/\n*if this answer was useful[\s\S]*$/i, '')
        .trim()
    );
    return appendAiImprovedRationaleMarker(text).slice(0, 5000);
}

function appendAiImprovedRationaleMarker(value) {
    const text = String(value || '').trim();
    const marker = '!! AI improved rationale !!';
    if (!text) return marker;
    if (text.toLowerCase().includes(marker.toLowerCase())) return text;
    return `${text}\n\n${marker}`;
}

function createGovernanceVoteRationaleMetadata(context, authorName, reason) {
    const cleanName = cleanGovernanceText(String(authorName || '').trim());
    const cleanReason = cleanGovernanceText(String(reason || '').trim());
    if (!cleanName && !cleanReason) return null;
    if (!cleanName) throw new Error('Enter your public DRep name or leave the rationale fields empty.');
    if (!cleanReason) throw new Error('Enter the reason for this vote in English or leave the rationale fields empty.');

    const proposal = context.proposal || {};
    const metadata = {
        app: 'TDSP',
        standard: 'CIP-1694 vote rationale',
        version: 1,
        created_at: new Date().toISOString(),
        voter_role: 'DRep',
        voter_name: cleanName,
        drep_id: context.drep.dRepIDCip105 || '',
        drep_key_hash: context.drep.publicKeyHash || '',
        vote: context.voteKind,
        previous_vote: context.existingVote || '',
        rationale: cleanReason,
        gov_action_id: proposal.proposal_id || '',
        gov_action_title: getProposalTitle(proposal),
        gov_action_type: window.TDSPRuntime.formatReadableLabel(getEffectiveProposalType(proposal), 'Governance'),
        gov_action_tx_hash: proposal.proposal_tx_hash || '',
        gov_action_tx_index: normalizeOnchainMetadataNumber(proposal.proposal_index)
    };

    return chunkGovernanceMetadataStrings(removeEmptyRationaleValues(metadata));
}

function normalizeOnchainMetadataNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    if (Number.isInteger(number) && Number.isSafeInteger(number)) return number;
    return String(value);
}

function normalizeNullableNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function truncateOnchainMetadataText(value, maxLength = 700) {
    const text = cleanGovernanceText(String(value || '').trim());
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trim()}…`;
}

function getGovernanceProposalRequestedAda(proposal) {
    const candidates = [
        proposal?.amount_ada,
        proposal?.requested_amount_ada,
        proposal?.total_amount_ada,
        proposal?.withdrawal_amount_ada
    ];
    const lovelaceCandidates = [
        proposal?.amount_lovelace,
        proposal?.requested_amount_lovelace,
        proposal?.total_amount_lovelace,
        proposal?.withdrawal_amount_lovelace
    ];

    const ada = candidates.map(Number).find(Number.isFinite);
    if (Number.isFinite(ada)) return ada;
    const lovelace = lovelaceCandidates.map(Number).find(Number.isFinite);
    return Number.isFinite(lovelace) ? lovelace / 1_000_000 : null;
}

function removeEmptyRationaleValues(value) {
    if (Array.isArray(value)) {
        return value
            .map(removeEmptyRationaleValues)
            .filter(item => item !== null && item !== undefined && item !== '');
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value)
            .map(([key, entry]) => [key, removeEmptyRationaleValues(entry)])
            .filter(([, entry]) => {
                if (entry === null || entry === undefined || entry === '') return false;
                if (Array.isArray(entry) && !entry.length) return false;
                return !(typeof entry === 'object' && !Array.isArray(entry) && !Object.keys(entry).length);
            }));
    }
    return value;
}

function chunkGovernanceMetadataStrings(value) {
    if (typeof value === 'string') return chunkUtf8String(value, 64);
    if (Array.isArray(value)) return value.map(chunkGovernanceMetadataStrings);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value)
            .map(([key, entry]) => [key, chunkGovernanceMetadataStrings(entry)]));
    }
    return value;
}

function chunkUtf8String(value, maxBytes) {
    const text = String(value || '');
    if (!text) return '';
    const chunks = [];
    let chunk = '';
    for (const character of text) {
        const next = `${chunk}${character}`;
        if (new TextEncoder().encode(next).length > maxBytes) {
            if (chunk) chunks.push(chunk);
            chunk = character;
        } else {
            chunk = next;
        }
    }
    if (chunk) chunks.push(chunk);
    return chunks.length <= 1 ? chunks[0] || '' : chunks;
}

async function submitGovernanceVote(container, context, submitButton) {
    submitButton.disabled = true;
    const status = appendGovernanceVoteStatus(container, 'Building the vote transaction...');

    try {
        const latestProposal = findCurrentGovernanceProposal(context.proposal.proposal_id) || context.proposal;
        if (!isGovernanceProposalOpenForVoting(latestProposal)) {
            throw new Error('This governance action is no longer open for voting.');
        }

        const utxos = await context.wallet.getUtxos();
        const changeAddress = await context.wallet.getChangeAddress();
        if (!utxos?.length || !changeAddress) throw new Error('No spendable wallet UTxO was found for the network fee.');

        const txBuilder = new context.MeshTxBuilder({ verbose: false });
        let voteTx = txBuilder
            .vote(
                { type: 'DRep', drepId: context.drep.dRepIDCip105 },
                context.actionRef,
                { voteKind: context.voteKind }
            );
        if (context.rationaleMetadata) {
            voteTx = voteTx.metadataValue(1694, context.rationaleMetadata);
        }
        const unsignedTx = await voteTx
            .selectUtxosFrom(utxos)
            .changeAddress(changeAddress)
            .complete();

        status.textContent = context.rationaleMetadata
            ? 'Check the governance action, vote, on-chain rationale metadata and fee in your wallet before signing.'
            : 'Check the governance action, vote and fee in your wallet before signing.';
        const signedTx = await context.wallet.signTx(unsignedTx, false);
        status.textContent = 'Submitting the signed vote transaction...';
        const txHash = await context.wallet.submitTx(signedTx);
        proposalVotesCache.delete(context.proposal.proposal_id);

        container.replaceChildren();
        const success = document.createElement('strong');
        success.className = 'governance-vote-success';
        success.textContent = `${context.voteKind} vote submitted.`;
        const link = document.createElement('a');
        link.href = `https://cardanoscan.io/transaction/${encodeURIComponent(txHash)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'View transaction on Cardanoscan';
        container.append(success, link);
    } catch (error) {
        console.error('DRep vote submission failed', error);
        status.textContent = `Vote failed: ${error?.info || error?.message || 'The wallet rejected the transaction.'}`;
        status.classList.add('is-error');
        submitButton.disabled = false;
    }
}

function addDetailRow(container, label, value, options = {}) {
    if (value === null || value === undefined || value === '') return;
    const cleanValue = cleanGovernanceText(String(value));
    if (!cleanValue) return;
    const displayValue = options.displayValue === undefined
        ? cleanValue
        : cleanGovernanceText(String(options.displayValue));

    const row = document.createElement('div');
    row.className = 'governance-detail-row';

    const key = document.createElement('strong');
    key.textContent = label;

    const text = document.createElement('span');
    appendRichText(text, displayValue);

    row.appendChild(key);
    row.appendChild(text);
    if (options.copyLabel) {
        row.classList.add('governance-detail-row--copyable');
        const copyButton = createGovernanceCopyButton(
            String(value),
            options.copyLabel
        );
        copyButton.classList.add('governance-detail-copy-button');
        row.appendChild(copyButton);
    }
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

async function fetchOptionalProposalVotesPayload(proposalId, timeoutMs = 8000) {
    try {
        const payload = await withTimeout(
            fetchProposalVotesPayload(proposalId),
            timeoutMs,
            `Current vote lookup timed out after ${timeoutMs}ms`
        );
        return { payload, error: null };
    } catch (error) {
        console.warn('Optional DRep current vote lookup failed', error);
        return { payload: null, error };
    }
}

function withTimeout(promise, timeoutMs, message) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
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

    votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source, proposal)}`;
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
        return window.TDSPRuntime.toFiniteNumber(value);
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
    const nonVoters = getDrepNonVoterGroups(payload, drepVotes);
    const drepBreakdown = getDrepStakeBreakdown(summary, nonVoters);

    if (drepBreakdown.length) {
        container.appendChild(createDrepVoteChartSection(drepBreakdown, drepVotes, proposal));
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
        returnFocus,
        botContext: createWebsiteSectionBotContext('SPOs', {
            title: `SPO ${item.label} votes`,
            count: votes.length,
            status: item.label,
            root: 'Gov Actions',
            summary: `${votes.length.toLocaleString('en-US')} SPO ${item.label} votes`
        })
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
    sortedVotes.forEach(vote => {
        const poolId = getSpoVoteIdentifier(vote);
        const row = document.createElement('div');
        row.className = 'governance-cc-member governance-menu-card';

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
        id.className = 'governance-card-detail governance-cc-member-meta governance-drep-id';
        id.textContent = poolId || 'Unknown pool';

        idLine.appendChild(id);
        if (poolId) idLine.appendChild(createGovernanceCopyButton(poolId, 'pool ID'));

        copy.append(name, choice);
        if (poolDetails.textContent) copy.appendChild(poolDetails);
        copy.appendChild(idLine);
        row.appendChild(copy);
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

function createDrepVoteChartSection(breakdown, drepVotes, proposal = null) {
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
        legend.appendChild(createVoteLegendItem(item, drepVotes, proposal));
    });

    layout.appendChild(legend);
    section.appendChild(layout);

    return section;
}

function createVotePieChart(breakdown) {
    return createUniversalPieChart(breakdown, {
        labelFormatter: segment => formatPercentage((segment.end - segment.start) / 360 * 100)
    });
}

function createVoteLegendItem(item, drepVotes, proposal = null) {
    const interactive = [
        'no', 'not-voted', 'not-a-drep-yet', 'not-active-drep',
        'abstain', 'always-abstain', 'always-no-confidence', 'yes'
    ].includes(item.key);
    const element = createGovernanceStatBox({
        label: item.label,
        detail: formatVoteLegendDetail(item, drepVotes),
        color: item.color,
        statusClass: item.key === 'not-voted' ? 'is-not-voted' : '',
        onClick: interactive ? event => openDrepVotesOverlay(item, drepVotes, event.currentTarget, proposal) : null
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
        window.TDSPRuntime?.bindMenuTrigger?.(element, onClick, {
            errorMessage: `${label} details could not be opened.`
        });
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
        Number.isFinite(item.count) ? `${item.count} ${item.countLabel || 'votes'}` : null,
        item.omitValue ? null : formatCompactAdaFromLovelace(item.displayValue ?? item.value),
        Number.isFinite(item.voteCountPercentage) ? formatPercentage(item.voteCountPercentage) : null,
        Number.isFinite(item.votePowerPercentage) ? formatPercentage(item.votePowerPercentage) : null,
        item.excludedFromPercentage ? 'not counted' : null
    ].filter(Boolean).join(' • ');
}

function renderDrepDetailsPanel(container, item, drepVotes, proposal = null) {
    container.textContent = '';
    container.hidden = false;
    container.dataset.activeGroup = item.key;

    if (['not-voted', 'not-a-drep-yet', 'not-active-drep'].includes(item.key)) {
        renderNoVotesList(container, item.votes || [], item.label, { proposal });
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
    renderNoVotesList(container, votes, item.label, { proposal });
}

function openDrepVotesOverlay(item, drepVotes, returnFocus, proposal = null) {
    const panel = document.createElement('div');
    panel.className = 'governance-no-votes governance-no-votes-expanded';
    renderDrepDetailsPanel(panel, item, drepVotes, proposal);

    createGovernanceMenuOverlay({
        id: 'governance-drep-overlay',
        titleId: 'governance-drep-title',
        titleText: item.label,
        closeLabel: 'Close DRep list',
        closeOverlay: closeDrepVotesOverlay,
        bodyNodes: [panel],
        headerMeta: `${Number.isFinite(Number(item.count)) ? Number(item.count).toLocaleString('en-US') : 0} entries`,
        overlayClass: 'governance-nested-overlay',
        returnFocus,
        botContext: createWebsiteSectionBotContext('DReps', {
            title: item.label,
            count: Number(item.count) || 0,
            amount_ada: Number(item.displayValue ?? item.value) / 1_000_000,
            status: item.label,
            root: 'Gov Actions',
            summary: `${Number(item.count) || 0} DRep entries`
        })
    });
}

function closeDrepVotesOverlay() {
    removeGovernanceMenuOverlay('governance-drep-overlay');
}

function openDrepDirectoryOverlay() {
    const becomeDrep = document.createElement('button');
    becomeDrep.type = 'button';
    becomeDrep.className = 'governance-become-drep-button';
    becomeDrep.textContent = 'Become a DRep';
    becomeDrep.setAttribute('aria-label', 'Register as a DRep');
    becomeDrep.addEventListener('click', event => openDrepRegistrationOverlay(event.currentTarget));

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
        bodyNodes: [becomeDrep, panel],
        headerMeta: 'Loading DReps…',
        botContext: createWebsiteSectionBotContext('DReps', {
            title: 'DReps',
            count: drepDirectoryState?.dreps?.length || drepDirectoryState?.count || null,
            amount_ada: Number(drepDirectoryState?.totalVotingPower || drepDirectoryState?.total_voting_power) / 1_000_000,
            summary: 'Registered DRep directory'
        })
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
    removeGovernanceMenuOverlay('governance-drep-directory-overlay');
}

function openSpoDirectoryOverlay() {
    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading SPO data...';
    panel.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-spo-directory-overlay',
        titleId: 'governance-spo-directory-title',
        titleText: 'SPOs',
        closeLabel: 'Close SPO directory',
        closeOverlay: closeSpoDirectoryOverlay,
        bodyNodes: [panel],
        defaultSort: 'amount-desc',
        headerMeta: spoDirectoryState
            ? `${spoDirectoryState.count.toLocaleString('en-US')} SPOs`
            : 'Loading SPOs...',
        botContext: createWebsiteSectionBotContext('SPOs', {
            title: 'SPOs',
            count: spoDirectoryState?.count || null,
            amount_ada: Number(spoDirectoryState?.total_delegated_lovelace) / 1_000_000,
            summary: 'Registered SPO directory'
        })
    });

    loadSpoDirectory().then(payload => {
        if (!panel.isConnected) return;
        renderSpoDirectory(panel, payload.spos);
        updateGovernanceMenuHeaderMeta(
            'governance-spo-directory-overlay',
            `${payload.count.toLocaleString('en-US')} SPOs`,
            panel
        );
        updateGovernanceOverlayBotContext(
            'governance-spo-directory-overlay',
            createWebsiteSectionBotContext('SPOs', {
                title: 'SPOs',
                count: payload.count,
                amount_ada: Number(payload.total_delegated_lovelace) / 1_000_000,
                summary: `${payload.count.toLocaleString('en-US')} registered SPOs`
            }),
            panel
        );
    }).catch(() => {
        if (!panel.isConnected) return;
        panel.replaceChildren();
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'SPO data could not be loaded.';
        panel.appendChild(message);
    });
}

function closeSpoDirectoryOverlay() {
    removeGovernanceMenuOverlay('governance-spo-directory-overlay');
}

function renderSpoNakamotoTile(nakamoto) {
    const consensus = Number(nakamoto?.consensus?.coefficient);
    const infrastructure = Number(nakamoto?.infrastructure?.coefficient);
    window.TDSPRuntime.setText(
        'spo-nakamoto-values',
        Number.isFinite(consensus) && Number.isFinite(infrastructure)
            ? `${consensus.toLocaleString('en-US')} / ${infrastructure.toLocaleString('en-US')}`
            : '-- / --'
    );
}

function createSpoNakamotoMetricSection(titleText, metric) {
    const section = document.createElement('section');
    section.className = 'governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = titleText;
    section.appendChild(title);

    if (titleText === 'Geographic NC') {
        const map = createSpoGeographicMap(metric);
        if (map) section.appendChild(map);
    }

    const summary = document.createElement('div');
    summary.className = 'governance-vote-legend governance-vote-legend--stacked';
    const coefficient = Number(metric?.coefficient);
    const available = metric?.available !== false && Number.isFinite(coefficient);
    const coverage = Number(metric?.coverage_stake_pct);
    summary.appendChild(createGovernanceStatBox({
        label: available
            ? `Nakamoto coefficient ${coefficient.toLocaleString('en-US')}`
            : 'Not available',
        detail: available
            ? `${coefficient.toLocaleString('en-US')} of ${Number(metric?.domain_count || 0).toLocaleString('en-US')} domains reach ${formatPercentage(Number(metric?.cumulative_stake_pct) || 0)} of stake`
            : [
                metric?.reason || 'This dimension is not available from the current SPO data.',
                Number.isFinite(coverage) && coverage > 0 ? `Known stake coverage ${formatPercentage(coverage)}` : ''
            ].filter(Boolean).join(' '),
        color: available ? '#5eead4' : '#fbbf24'
    }));
    section.appendChild(summary);

    const methodology = document.createElement('p');
    methodology.className = 'small-text';
    methodology.textContent = metric?.methodology || '';
    section.appendChild(methodology);

    const domains = Array.isArray(metric?.threshold_domains) ? metric.threshold_domains : [];
    if (domains.length) {
        const domainTitle = document.createElement('strong');
        domainTitle.textContent = 'Domains reaching the 50% threshold';
        section.appendChild(domainTitle);

        const list = document.createElement('div');
        list.className = 'governance-vote-legend governance-vote-legend--stacked';
        domains.forEach(domain => {
            list.appendChild(createGovernanceStatBox({
                label: domain.label || domain.id || 'Unknown domain',
                detail: `${formatCompactAdaFromLovelace(domain.stake_lovelace || 0)} • ${formatPercentage(Number(domain.stake_pct) || 0)} • ${Number(domain.pool_count || 0).toLocaleString('en-US')} SPOs`,
                color: domain.type === 'cloud_provider' ? '#f87171' : '#34d399',
                onClick: Array.isArray(domain?.pool_ids) && domain.pool_ids.length
                    ? event => openSpoOperatorGroupPools(domain, event.currentTarget)
                    : null
            }));
        });
        section.appendChild(list);
    }

    return section;
}

function createSpoGeographicMap(metric) {
    const rawPoints = (Array.isArray(metric?.map_points) ? metric.map_points : [])
        .filter(point => Number.isFinite(Number(point?.latitude)) && Number.isFinite(Number(point?.longitude)));
    const locationGroups = new Map();
    rawPoints.forEach(point => {
        const latitude = Math.max(-90, Math.min(90, Number(point.latitude)));
        const longitude = Math.max(-180, Math.min(180, Number(point.longitude)));
        const key = `${latitude.toFixed(6)}:${longitude.toFixed(6)}`;
        const existing = locationGroups.get(key) || {
            ...point,
            latitude,
            longitude,
            poolIds: new Set(),
            relay_count: 0,
            stake_lovelace: 0
        };
        (Array.isArray(point.pool_ids) ? point.pool_ids : [])
            .map(poolId => String(poolId || '').trim())
            .filter(Boolean)
            .forEach(poolId => existing.poolIds.add(poolId));
        existing.relay_count += Math.max(1, Number(point.relay_count) || 1);
        existing.stake_lovelace = Math.max(
            Number(existing.stake_lovelace) || 0,
            Number(point.stake_lovelace) || 0
        );
        locationGroups.set(key, existing);
    });
    const points = [...locationGroups.values()].map(point => {
        const poolIds = [...point.poolIds];
        const poolCount = poolIds.length || Number(point.pool_count) || 0;
        const members = getSpoGroupMembers({ pool_ids: poolIds });
        const groupedStakeLovelace = members.reduce(
            (sum, spo) => sum + (Number(spo?.delegated_lovelace) || 0),
            0
        );
        const { poolIds: unusedPoolIds, ...location } = point;
        return {
            ...location,
            pool_ids: poolIds,
            pool_count: poolCount,
            stake_lovelace: groupedStakeLovelace || Number(point.stake_lovelace) || 0,
            label: poolCount > 1
                ? `${poolCount.toLocaleString('en-US')} SPOs at this location`
                : point.label
        };
    });
    if (!points.length) return null;

    const figure = document.createElement('figure');
    figure.className = 'spo-geographic-map';
    figure.setAttribute('aria-label', `World map with ${points.length.toLocaleString('en-US')} unique SPO relay locations`);

    const map = document.createElement('div');
    map.className = 'spo-geographic-map__canvas';
    const viewport = document.createElement('div');
    viewport.className = 'spo-geographic-map__viewport';
    map.appendChild(viewport);
    const markerLayer = document.createElement('div');
    markerLayer.className = 'spo-geographic-map__markers';
    map.appendChild(markerLayer);
    const maxStake = Math.max(...points.map(point => Number(point?.stake_lovelace) || 0), 1);
    const markers = [];
    points.forEach(point => {
        const latitude = Math.max(-90, Math.min(90, Number(point.latitude)));
        const longitude = Math.max(-180, Math.min(180, Number(point.longitude)));
        const baseLeft = ((longitude + 180) / 360) * 100;
        const baseTop = ((90 - latitude) / 180) * 100;

        const marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'spo-geographic-map__marker';
        const containsTdsp = (Array.isArray(point.pool_ids) ? point.pool_ids : [])
            .some(poolId => String(poolId || '').trim().toLowerCase() === TDSP_POOL_ID);
        if (containsTdsp) marker.classList.add('spo-geographic-map__marker--tdsp');
        marker.style.left = `${baseLeft}%`;
        marker.style.top = `${baseTop}%`;
        const stakeRatio = Math.sqrt((Number(point.stake_lovelace) || 0) / maxStake);
        marker.style.setProperty('--marker-size', `${10 + Math.round(stakeRatio * 3) * 2}px`);
        const relayCount = Number(point.relay_count || 1);
        const locationLabel = [point.city, point.region, point.country || point.country_code]
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .filter((value, index, values) => values.indexOf(value) === index)
            .join(', ') || 'Unknown location';
        const detail = `${containsTdsp ? 'TDSP • ' : ''}${point.label || 'Relay'} • ${locationLabel} • ${formatCompactAdaFromLovelace(point.stake_lovelace || 0)} • ${relayCount.toLocaleString('en-US')} relay${relayCount === 1 ? '' : 's'} • ${Number(point.pool_count || 0).toLocaleString('en-US')} pool${Number(point.pool_count) === 1 ? '' : 's'}`;
        marker.title = detail;
        marker.setAttribute('aria-label', detail);
        window.TDSPRuntime?.bindMenuTrigger?.(marker, event => {
            const location = {
                label: locationLabel,
                pool_ids: Array.isArray(point.pool_ids) ? point.pool_ids : []
            };
            const members = getSpoGroupMembers(location);
            if (members.length === 1) {
                openSpoDetailOverlay(members[0], event.currentTarget);
                return;
            }
            openSpoOperatorGroupPools(location, event.currentTarget);
        }, { errorMessage: 'SPO location could not be opened.' });
        markerLayer.appendChild(marker);
        markers.push({
            element: marker,
            x: baseLeft / 100,
            y: baseTop / 100
        });
    });

    const controls = document.createElement('div');
    controls.className = 'spo-geographic-map__controls';
    const makeControl = (text, label, action) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'spo-geographic-map__control';
        button.textContent = text;
        button.title = label;
        button.setAttribute('aria-label', label);
        button.addEventListener('click', action);
        return button;
    };
    const view = { scale: 1, x: 0, y: 0 };
    const pointers = new Map();
    let dragStart = null;
    let pinchStart = null;
    const clampView = () => {
        const width = map.clientWidth || 1;
        const height = map.clientHeight || 1;
        const maxX = width * (view.scale - 1) / 2;
        const maxY = height * (view.scale - 1) / 2;
        view.x = Math.max(-maxX, Math.min(maxX, view.x));
        view.y = Math.max(-maxY, Math.min(maxY, view.y));
    };
    const renderView = () => {
        clampView();
        viewport.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
        const width = map.clientWidth || 1;
        const height = map.clientHeight || 1;
        const pixelRatio = window.devicePixelRatio || 1;
        const snapToDevicePixel = value => Math.round(value * pixelRatio) / pixelRatio;
        markers.forEach(marker => {
            const screenX = width / 2 + (marker.x * width - width / 2) * view.scale + view.x;
            const screenY = height / 2 + (marker.y * height - height / 2) * view.scale + view.y;
            marker.element.style.left = `${snapToDevicePixel(screenX)}px`;
            marker.element.style.top = `${snapToDevicePixel(screenY)}px`;
        });
        map.classList.toggle('is-zoomed', view.scale > 1);
    };
    const setScale = (nextScale, centerX = map.clientWidth / 2, centerY = map.clientHeight / 2) => {
        const previousScale = view.scale;
        const scale = Math.max(1, Math.min(16, nextScale));
        if (scale === previousScale) return;
        const mapX = centerX - map.clientWidth / 2;
        const mapY = centerY - map.clientHeight / 2;
        const ratio = scale / previousScale;
        view.x = mapX - (mapX - view.x) * ratio;
        view.y = mapY - (mapY - view.y) * ratio;
        view.scale = scale;
        renderView();
    };
    const resetView = () => {
        Object.assign(view, { scale: 1, x: 0, y: 0 });
        renderView();
    };
    controls.append(
        makeControl('+', 'Zoom in', () => setScale(view.scale * 1.4)),
        makeControl('−', 'Zoom out', () => setScale(view.scale / 1.4)),
        makeControl('↺', 'Reset map', resetView)
    );
    map.appendChild(controls);

    map.addEventListener('wheel', event => {
        event.preventDefault();
        const bounds = map.getBoundingClientRect();
        setScale(view.scale * (event.deltaY < 0 ? 1.22 : 1 / 1.22), event.clientX - bounds.left, event.clientY - bounds.top);
    }, { passive: false });
    map.addEventListener('pointerdown', event => {
        if (event.target.closest('.spo-geographic-map__marker, .spo-geographic-map__controls')) return;
        map.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 1) {
            dragStart = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y };
        } else if (pointers.size === 2) {
            const [first, second] = [...pointers.values()];
            pinchStart = {
                distance: Math.hypot(second.x - first.x, second.y - first.y),
                scale: view.scale
            };
        }
    });
    map.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2 && pinchStart) {
            const [first, second] = [...pointers.values()];
            const distance = Math.hypot(second.x - first.x, second.y - first.y);
            setScale(pinchStart.scale * distance / Math.max(1, pinchStart.distance));
        } else if (pointers.size === 1 && dragStart && view.scale > 1) {
            view.x = dragStart.viewX + event.clientX - dragStart.x;
            view.y = dragStart.viewY + event.clientY - dragStart.y;
            renderView();
        }
    });
    const releasePointer = event => {
        pointers.delete(event.pointerId);
        dragStart = null;
        pinchStart = null;
    };
    map.addEventListener('pointerup', releasePointer);
    map.addEventListener('pointercancel', releasePointer);
    const resizeObserver = new ResizeObserver(renderView);
    resizeObserver.observe(map);
    requestAnimationFrame(renderView);

    const caption = document.createElement('figcaption');
    caption.className = 'small-text';
    caption.textContent = `${points.length.toLocaleString('en-US')} unique relay locations from ${rawPoints.length.toLocaleString('en-US')} relay IP records. Zoom or drag the map; point size represents attributed active stake. Select a shared location to view all SPOs there. Map: Natural Earth, CC0.`;
    figure.append(map, caption);
    return figure;
}

function createSpoNakamotoMetricTile(titleText, metric) {
    const card = document.createElement('div');
    card.className = 'governance-spo-detail-stat governance-menu-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-label', `Open ${titleText}`);

    const coefficient = Number(metric?.coefficient);
    const available = metric?.available !== false && Number.isFinite(coefficient);
    const coverage = Number(metric?.coverage_stake_pct);
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: titleText,
        primaryText: available ? coefficient.toLocaleString('en-US') : 'Unavailable',
        primaryClassName: `pool-status-value ${available ? 'is-active' : 'is-warning'}`,
        detailItems: [
            available
                ? `${Number(metric?.domain_count || 0).toLocaleString('en-US')} measured domains`
                : (metric?.status === 'insufficient_coverage' ? 'Insufficient coverage' : 'Source data unavailable'),
            Number.isFinite(coverage) && coverage > 0
                ? `Stake coverage ${formatPercentage(coverage)}`
                : null
        ]
    });
    window.TDSPRuntime?.bindMenuTrigger?.(card, event => {
        openSpoNakamotoMetricOverlay(titleText, metric, event.currentTarget);
    }, {
        errorMessage: `${titleText} could not be opened.`
    });
    return card;
}

function openSpoNakamotoMetricOverlay(titleText, metric, returnFocus) {
    createGovernanceMenuOverlay({
        id: 'spo-nakamoto-metric-overlay',
        titleId: 'spo-nakamoto-metric-title',
        titleText,
        closeLabel: `Close ${titleText}`,
        closeOverlay: closeSpoNakamotoMetricOverlay,
        bodyNodes: [createSpoNakamotoMetricSection(titleText, metric)],
        headerMeta: metric?.available === false ? 'Unavailable' : '50% stake threshold',
        overlayClass: 'governance-action-detail-overlay',
        rootTitle: 'Cardano Decentralization',
        returnFocus,
        enableSearch: false,
        botContext: createWebsiteSectionBotContext('SPOs', {
            title: `${titleText} / Cardano Decentralization`,
            summary: metric?.methodology || metric?.reason || titleText
        })
    });
}

function closeSpoNakamotoMetricOverlay() {
    removeGovernanceMenuOverlay('spo-nakamoto-metric-overlay');
}

function getSpoGroupMembers(domain, spos = spoDirectoryState?.spos) {
    const ids = new Set(
        (Array.isArray(domain?.pool_ids) ? domain.pool_ids : [])
            .map(poolId => String(poolId || '').trim().toLowerCase())
            .filter(Boolean)
    );
    return (Array.isArray(spos) ? spos : [])
        .filter(spo => ids.has(String(spo?.pool_id || '').trim().toLowerCase()));
}

function openSpoOperatorGroupPools(domain, returnFocus) {
    const members = getSpoGroupMembers(domain);
    openSpoStatusListOverlay(
        `${domain?.label || 'Operator'} Pools`,
        members,
        returnFocus,
        { combineOperators: false }
    );
}

function renderSpoNakamotoPanel(panel, payload) {
    panel.replaceChildren();
    const nakamoto = payload?.nakamoto;
    if (!nakamoto?.consensus || !nakamoto?.infrastructure) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Nakamoto coefficient data is not available yet.';
        panel.appendChild(message);
        return;
    }

    const note = document.createElement('p');
    note.className = 'small-text';
    note.textContent = `50% stake threshold • ${nakamoto.stake_basis || 'cached SPO stake'}`;
    const missingMetric = (label) => ({
        available: false,
        reason: `${label} requires a refreshed version 2 SPO decentralization cache.`
    });
    const metrics = [
        ['Consensus NC', nakamoto.consensus],
        ['Relay Operator NC', nakamoto.relay_operator || missingMetric('Relay operator NC')],
        ['Hosting-provider NC', nakamoto.infrastructure],
        ['Geographic NC', nakamoto.geographic || missingMetric('Geographic NC')],
        ['Software/client NC', nakamoto.software || missingMetric('Software/client NC')]
    ];
    const grid = document.createElement('div');
    grid.className = 'governance-spo-detail-stats';
    metrics.forEach(([title, metric]) => {
        grid.appendChild(createSpoNakamotoMetricTile(title, metric));
    });
    panel.append(note, grid);
}

function openSpoNakamotoOverlay(returnFocus) {
    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading Nakamoto coefficients...';
    panel.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'spo-nakamoto-overlay',
        titleId: 'spo-nakamoto-title',
        titleText: 'Cardano Decentralization',
        closeLabel: 'Close Nakamoto coefficients',
        closeOverlay: closeSpoNakamotoOverlay,
        bodyNodes: [panel],
        headerMeta: '50% stake threshold',
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        enableSearch: false,
        botContext: createWebsiteSectionBotContext('SPOs', {
            title: 'Cardano Decentralization / Nakamoto Coefficients',
            count: spoDirectoryState?.count || null,
            amount_ada: Number(spoDirectoryState?.nakamoto?.total_stake_lovelace || 0) / 1_000_000,
            summary: 'Consensus, relay operator, hosting provider, geographic and software/client concentration'
        })
    });

    loadSpoDirectory()
        .then(payload => {
            if (panel.isConnected) renderSpoNakamotoPanel(panel, payload);
        })
        .catch(() => {
            if (!panel.isConnected) return;
            panel.replaceChildren();
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Nakamoto coefficient data could not be loaded.';
            panel.appendChild(message);
        });
}

function closeSpoNakamotoOverlay() {
    removeGovernanceMenuOverlay('spo-nakamoto-overlay');
}

function renderSpoDirectory(container, spos, options = {}) {
    container.replaceChildren();
    if (!spos.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No registered SPOs are available.';
        container.appendChild(message);
        return;
    }

    if (options.showChart !== false) {
        container.appendChild(createSpoActivityStatusChart(spos));
    }

    const entries = options.combineOperators === false
        ? spos.map(spo => ({ type: 'pool', spo }))
        : createSpoOperatorDirectoryEntries(spos);
    const orderedEntries = [...entries].sort((left, right) => {
        const leftMembers = left.type === 'group' ? left.members : [left.spo];
        const rightMembers = right.type === 'group' ? right.members : [right.spo];
        const leftPin = Math.min(...leftMembers.map(getSpoPinRank));
        const rightPin = Math.min(...rightMembers.map(getSpoPinRank));
        if (leftPin !== rightPin) return leftPin - rightPin;
        const leftStake = BigInt(String(left.type === 'group' ? left.domain.stake_lovelace : left.spo.delegated_lovelace || '0'));
        const rightStake = BigInt(String(right.type === 'group' ? right.domain.stake_lovelace : right.spo.delegated_lovelace || '0'));
        return rightStake > leftStake ? 1 : rightStake < leftStake ? -1 : 0;
    });
    const fragment = document.createDocumentFragment();
    orderedEntries.forEach(entry => {
        fragment.appendChild(entry.type === 'group'
            ? createSpoOperatorGroupCard(entry.domain, entry.members)
            : createSpoDirectoryCard(entry.spo));
    });
    container.appendChild(fragment);
}

function createSpoOperatorDirectoryEntries(spos) {
    const byId = new Map(
        spos.map(spo => [String(spo?.pool_id || '').trim().toLowerCase(), spo])
    );
    const claimedIds = new Set();
    const entries = [];
    const groups = Array.isArray(spoDirectoryState?.nakamoto?.consensus?.multi_pool_domains)
        ? spoDirectoryState.nakamoto.consensus.multi_pool_domains
        : [];
    groups.forEach(domain => {
        const members = getSpoGroupMembers(domain, spos);
        if (members.length < 2) return;
        members.forEach(spo => claimedIds.add(String(spo.pool_id || '').trim().toLowerCase()));
        entries.push({ type: 'group', domain, members });
    });
    byId.forEach((spo, poolId) => {
        if (!claimedIds.has(poolId)) entries.push({ type: 'pool', spo });
    });
    return entries;
}

function createSpoOperatorGroupCard(domain, members) {
    const totalDelegators = members.reduce((sum, spo) => sum + (Number(spo?.delegator_count) || 0), 0);
    const row = document.createElement('div');
    row.className = 'governance-card governance-menu-card governance-cc-member governance-cc-member-clickable governance-spo-directory-card';
    row.dataset.searchText = members.flatMap(spo => [
        spo?.name,
        spo?.ticker,
        spo?.pool_id,
        getSpoRelayAddressSummary(spo),
        getSpoRelaySearchText(spo)
    ]).filter(Boolean).join(' ');
    row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(domain?.label || 'Operator group');
    row.dataset.sortAmount = String(Number(domain?.stake_lovelace) || 0);
    row.dataset.sortDelegators = String(totalDelegators);
    const pinRank = Math.min(...members.map(getSpoPinRank));
    if (Number.isFinite(pinRank)) row.dataset.overlayPinRank = String(pinRank);
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute('aria-label', `Show ${domain?.label || 'operator'} combined stake pools`);
    window.TDSPRuntime?.appendUniversalTileContent?.(row, {
        title: domain?.label || 'SPO Operator',
        titleClassName: 'governance-title governance-cc-member-hash',
        primaryText: `Delegation: ${formatCompactAdaFromLovelace(domain?.stake_lovelace || 0)}`,
        primaryClassName: 'governance-card-detail governance-treasury-withdrawal-amount governance-cc-member-stats',
        detailItems: [
            { text: `${members.length.toLocaleString('en-US')} combined pools`, className: 'governance-card-detail governance-cc-member-meta' },
            { text: `Delegators: ${totalDelegators.toLocaleString('en-US')}`, className: 'governance-card-detail governance-cc-member-meta' }
        ]
    });
    bindGovernanceMenuTrigger(row, event => openSpoOperatorGroupPools(domain, event.currentTarget));
    return row;
}

function createSpoDirectoryCard(spo) {
    const relayAddressSummary = getSpoRelayAddressSummary(spo);
    const relaySearchText = getSpoRelaySearchText(spo);
    const row = document.createElement('div');
    row.className = 'governance-card governance-menu-card governance-cc-member governance-cc-member-clickable governance-spo-directory-card';
    row.dataset.searchText = [spo.name, spo.ticker, spo.pool_id, relayAddressSummary, relaySearchText]
        .filter(Boolean)
        .join(' ');
    row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(getSpoDisplayName(spo));
    row.dataset.sortAmount = String(Number(spo.delegated_lovelace) || 0);
    row.dataset.sortDelegators = String(Number(spo.delegator_count) || 0);
    row.dataset.sortSaturation = String(Number(spo.saturation_pct) || 0);
    row.dataset.sortStatus = spo.active === true ? '1' : spo.active === false ? '0' : '';
    const cloudHostingType = getSpoCloudHostingType(spo);
    const pinRank = getSpoPinRank(spo);
    if (Number.isFinite(pinRank)) row.dataset.overlayPinRank = String(pinRank);
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute('aria-label', `Show ${getSpoDisplayName(spo)} stake pool details`);

    const idLine = createSpoPoolIdLine(spo.pool_id);
    window.TDSPRuntime?.appendUniversalTileContent?.(row, {
        title: getSpoDisplayName(spo),
        titleClassName: 'governance-title governance-cc-member-hash',
        primaryText: `Delegation: ${formatCompactAdaFromLovelace(spo.delegated_lovelace)}`,
        primaryClassName: 'governance-card-detail governance-treasury-withdrawal-amount governance-cc-member-stats',
        detailItems: [
            {
                text: getSpoActivityLabel(spo),
                className: `governance-card-detail governance-cc-member-meta pool-status-value ${getSpoActivityClassName(spo)}`
            },
            {
                text: relayAddressSummary ? `Relays: ${relayAddressSummary}` : 'Relays: not advertised',
                className: 'governance-card-detail governance-cc-member-meta governance-spo-relay-summary'
            },
            { text: `Cloud Service: ${getSpoCloudServiceText(spo)}`, className: 'governance-card-detail governance-cc-member-meta' },
            { text: `Delegators: ${Number(spo.delegator_count || 0).toLocaleString('en-US')}`, className: 'governance-card-detail governance-cc-member-meta' },
            { text: `Saturation: ${window.TDSPRuntime.formatRatioPercentage(spo.saturation_pct, { fallback: '--' })}`, className: 'governance-card-detail governance-cc-member-meta' },
            idLine
        ]
    });
    row.appendChild(createSpoHostingIcon(cloudHostingType));
    bindGovernanceMenuTrigger(row, event => openSpoDetailOverlay(spo, event.currentTarget));
    bindGovernanceEntityPreload(
        row,
        `spo:${String(spo.pool_id || '').toLowerCase()}`,
        () => fetchJson(getSpoDetailApiUrl(spo.pool_id), { cache: 'no-store' })
    );
    return row;
}

async function getSpoDirectoryEntry(poolId) {
    const normalizedPoolId = String(poolId || '').trim().toLowerCase();
    if (!normalizedPoolId) return null;
    const directory = await loadSpoDirectory();
    return directory.spos.find(spo => String(spo?.pool_id || '').trim().toLowerCase() === normalizedPoolId) || null;
}

function getSpoPinRank(spo) {
    const poolId = String(spo?.pool_id || '').trim().toLowerCase();
    const ticker = String(spo?.ticker || '').trim().toUpperCase();
    return poolId === TDSP_POOL_ID || ticker === 'TDSP' ? 0 : Infinity;
}

function hasSpoAdvertisedRelays(spo) {
    return (Array.isArray(spo?.relays) && spo.relays.length > 0)
        || Number(spo?.relay_count) > 0;
}

function createSpoActivityStatusChart(spos) {
    const groupedSpos = spos.reduce((result, spo) => {
        const key = spo.active === true
            ? 'active'
            : !hasSpoAdvertisedRelays(spo)
                ? 'noRelays'
                : spo.active === false ? 'inactive' : 'unknown';
        result[key].push(spo);
        return result;
    }, { active: [], inactive: [], noRelays: [], unknown: [] });
    const groups = [
        { key: 'active', label: 'Active Relay', title: 'Active Relay', color: '#34d399', value: groupedSpos.active.length, spos: groupedSpos.active },
        { key: 'inactive', label: 'Passive Relay', title: 'SPOs with only passive relays', color: '#f87171', value: groupedSpos.inactive.length, spos: groupedSpos.inactive },
        { key: 'no-relays', label: 'Unknown Relay', title: 'SPOs with no on-chain relays advertised', color: '#fbbf24', value: groupedSpos.noRelays.length, spos: groupedSpos.noRelays },
        { key: 'unknown', label: 'Status unavailable', title: 'SPO status unavailable', color: '#94a3b8', value: groupedSpos.unknown.length, spos: groupedSpos.unknown }
    ].filter(group => group.value > 0);

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-drep-status-chart';

    const title = document.createElement('strong');
    title.textContent = 'SPO Status';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    const chart = createUniversalPieChart(groups, {
        labelFormatter: segment => formatPercentage((segment.value / spos.length) * 100),
        onSegmentClick: (segment, returnFocus) => openSpoStatusGroupOverlay(segment, returnFocus)
    });

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        const percentage = spos.length ? (group.value / spos.length) * 100 : 0;
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${group.value.toLocaleString('en-US')} SPOs • ${formatPercentage(percentage)}`,
            color: group.color,
            onClick: event => openSpoStatusGroupOverlay(group, event.currentTarget)
        }));
    });

    layout.append(chart, legend);
    section.append(title, layout);
    return section;
}

function openSpoStatusGroupOverlay(group, returnFocus) {
    if (group?.key === 'unknown' || group?.key === 'no-relays') {
        openSpoStatusListOverlay(group.title, group.spos, returnFocus);
        return;
    }

    openSpoHostingOverlay(group, returnFocus);
}

function createSpoCloudProviderChart(spos) {
    const groupsByService = new Map();
    spos.forEach(spo => {
        const providers = getSpoCloudProviders(spo);
        const key = providers.length === 0
            ? 'no-cloud'
            : providers.length === 1
                ? `provider:${providers[0].id}`
                : 'multiple-cloud';
        const label = providers.length === 0
            ? 'No cloud service'
            : providers.length === 1
                ? providers[0].name
                : 'Multiple cloud services';
        if (!groupsByService.has(key)) {
            groupsByService.set(key, { key, label, spos: [] });
        }
        groupsByService.get(key).spos.push(spo);
    });

    const cloudColors = ['#f87171', '#fb7185', '#f97316', '#ef4444', '#e879f9', '#a78bfa', '#fb923c'];
    let cloudColorIndex = 0;
    const groups = [...groupsByService.values()]
        .sort((left, right) => {
            if (left.key === 'no-cloud') return 1;
            if (right.key === 'no-cloud') return -1;
            return left.label.localeCompare(right.label);
        })
        .map(group => ({
            ...group,
            value: group.spos.length,
            color: group.key === 'no-cloud'
                ? '#34d399'
                : cloudColors[cloudColorIndex++ % cloudColors.length]
        }));

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-drep-status-chart';

    const title = document.createElement('strong');
    title.textContent = 'Cloud Service Usage';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    const chart = createUniversalPieChart(groups, {
        labelFormatter: segment => formatPercentage((segment.value / spos.length) * 100),
        onSegmentClick: (segment, returnFocus) => openSpoStatusListOverlay(
            `${segment.label} Active Relay SPOs`,
            segment.spos,
            returnFocus
        )
    });

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        const percentage = spos.length ? (group.value / spos.length) * 100 : 0;
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${group.value.toLocaleString('en-US')} SPOs - ${formatPercentage(percentage)}`,
            color: group.color,
            onClick: event => openSpoStatusListOverlay(
                `${group.label} Active Relay SPOs`,
                group.spos,
                event.currentTarget
            )
        }));
    });

    layout.append(chart, legend);
    section.append(title, layout);
    return section;
}

function openSpoHostingOverlay(statusGroup, returnFocus) {
    const spos = statusGroup.spos;
    const cloudSpos = spos.filter(spo => getSpoCloudHostingType(spo) === 'cloud-spo');
    const nonCloudSpos = spos.filter(spo => getSpoCloudHostingType(spo) !== 'cloud-spo');
    const groups = [
        {
            label: 'Cloud SPO',
            title: `${statusGroup.label} Cloud SPOs`,
            color: '#f87171',
            spos: cloudSpos,
            showCloudProviderChart: statusGroup.key === 'active'
        },
        { label: 'Non-cloud SPO', title: `${statusGroup.label} Non-cloud SPOs`, color: '#34d399', spos: nonCloudSpos }
    ];
    const panel = document.createElement('div');
    panel.className = 'governance-vote-legend governance-vote-legend--stacked';

    groups.forEach(group => {
        const percentage = spos.length ? (group.spos.length / spos.length) * 100 : 0;
        panel.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${group.spos.length.toLocaleString('en-US')} SPOs • ${formatPercentage(percentage)}`,
            color: group.color,
            onClick: event => openSpoStatusListOverlay(group.title, group.spos, event.currentTarget, {
                showCloudProviderChart: group.showCloudProviderChart === true
            })
        }));
    });

    createGovernanceMenuOverlay({
        id: 'governance-spo-hosting-overlay',
        titleId: 'governance-spo-hosting-title',
        titleText: statusGroup.label,
        closeLabel: `Close ${statusGroup.label} SPO hosting groups`,
        closeOverlay: closeSpoHostingOverlay,
        bodyNodes: [panel],
        headerMeta: `${spos.length.toLocaleString('en-US')} SPOs`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        botContext: createWebsiteSectionBotContext('SPOs', {
            title: statusGroup.label,
            count: spos.length,
            amount_ada: spos.reduce((sum, spo) => sum + (Number(spo.delegated_lovelace) || 0), 0) / 1_000_000,
            status: statusGroup.label,
            root: 'SPOs'
        })
    });
}

function closeSpoHostingOverlay() {
    removeGovernanceMenuOverlay('governance-spo-hosting-overlay');
}

function openSpoStatusListOverlay(titleText, spos, returnFocus, options = {}) {
    const totalDelegatedLovelace = spos.reduce(
        (sum, spo) => sum + (Number(spo?.delegated_lovelace) || 0),
        0
    );
    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    renderSpoDirectory(panel, spos, {
        showChart: false,
        combineOperators: options.combineOperators !== false
    });

    const bodyNodes = [];
    if (options.showCloudProviderChart && spos.length > 0) {
        bodyNodes.push(createSpoCloudProviderChart(spos));
    }
    bodyNodes.push(panel);

    createGovernanceMenuOverlay({
        id: 'governance-spo-status-overlay',
        titleId: 'governance-spo-status-title',
        titleText,
        closeLabel: `Close ${titleText}`,
        closeOverlay: closeSpoStatusListOverlay,
        bodyNodes,
        headerMeta: `${spos.length.toLocaleString('en-US')} SPOs • ${formatCompactAdaFromLovelace(totalDelegatedLovelace)}`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        defaultSort: 'amount-desc',
        searchPlaceholder: 'Search by pool, ticker, ID or relay address',
        botContext: createWebsiteSectionBotContext('SPOs', {
            title: titleText,
            count: spos.length,
            amount_ada: spos.reduce((sum, spo) => sum + (Number(spo.delegated_lovelace) || 0), 0) / 1_000_000,
            status: titleText,
            root: 'SPOs'
        })
    });
}

function closeSpoStatusListOverlay() {
    removeGovernanceMenuOverlay('governance-spo-status-overlay');
}

function getSpoActivityLabel(spo) {
    if (spo?.operator_group_active === true) return 'Active Relay via operator group';
    if (spo?.active === true) return 'Active Relay';
    if (!hasSpoAdvertisedRelays(spo)) return 'Unknown Relay';
    if (spo?.active !== false) return 'Status unavailable';
    const reasons = Array.isArray(spo?.inactive_reasons) ? spo.inactive_reasons : [];
    const labels = [];
    if (reasons.includes('pledge_not_met')) labels.push('pledge not met');
    if (reasons.includes('no_active_relay')) {
        return 'Passive Relay';
    }
    if (reasons.includes('not_registered')) labels.push('not registered');
    return labels.length ? `Inactive: ${labels.join(', ')}` : 'Inactive';
}

function getSpoActivityClassName(spo) {
    if (spo?.active === true) return 'is-active';
    if (!hasSpoAdvertisedRelays(spo)) return 'is-warning';
    if (spo?.active === false) return 'is-inactive';
    return '';
}

function getSpoCloudHostingType(spo) {
    if (spo?.cloud_hosting_type === 'cloud-spo' || spo?.cloud_hosting_type === 'spo') {
        return spo.cloud_hosting_type;
    }
    const relays = Array.isArray(spo?.relays) ? spo.relays : [];
    return relays.length > 0
        && relays.every(relay => SPO_CLOUD_PROVIDER_KEYS.has(firstNonEmptyText(relay?.provider?.id)))
        ? 'cloud-spo'
        : 'spo';
}

function createSpoHostingIcon(hostingType) {
    const isCloud = hostingType === 'cloud-spo';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.classList.add('governance-spo-hosting-icon');
    icon.classList.add(isCloud ? 'is-cloud' : 'is-hardware');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', isCloud ? 'Cloud SPO' : 'SPO hardware');

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = isCloud ? 'Cloud SPO' : 'SPO hardware';
    icon.appendChild(title);

    if (isCloud) {
        const cloud = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        cloud.setAttribute('d', 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z');
        icon.appendChild(cloud);
    } else {
        [
            ['rect', { x: '2', y: '2', width: '20', height: '8', rx: '2' }],
            ['rect', { x: '2', y: '14', width: '20', height: '8', rx: '2' }],
            ['path', { d: 'M6 6h.01' }],
            ['path', { d: 'M6 18h.01' }]
        ].forEach(([tag, attributes]) => {
            const part = document.createElementNS('http://www.w3.org/2000/svg', tag);
            Object.entries(attributes).forEach(([name, value]) => part.setAttribute(name, value));
            icon.appendChild(part);
        });
    }

    return icon;
}

function openSpoDetailOverlay(spo, returnFocus) {
    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading SPO details...';
    content.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-spo-detail-overlay',
        titleId: 'governance-spo-detail-title',
        titleText: getSpoDisplayName(spo),
        closeLabel: `Close ${getSpoDisplayName(spo)} details`,
        closeOverlay: closeSpoDetailOverlay,
        bodyNodes: [content],
        headerMeta: formatCompactAdaFromLovelace(spo.delegated_lovelace),
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: 'SPOs',
        botContext: createSpoBotContext(spo)
    });

    loadSpoDetail(spo)
        .then(payload => {
            if (!content.isConnected) return;
            const refreshedSpo = payload?.spo || spo;
            updateGovernanceOverlayBotContext('governance-spo-detail-overlay', createSpoBotContext(refreshedSpo), content);
            renderSpoDetails(content, refreshedSpo);
        })
        .catch(() => {
            if (!content.isConnected) return;
            content.replaceChildren();
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'SPO details could not be loaded.';
            content.appendChild(message);
        });
}

function closeSpoDetailOverlay() {
    removeGovernanceMenuOverlay('governance-spo-detail-overlay');
}

function renderSpoDetails(container, spo) {
    container.replaceChildren();
    container.appendChild(createSpoPoolIdLine(spo.pool_id));

    const stats = document.createElement('div');
    stats.className = 'governance-spo-detail-stats';
    [
        ['Delegators', Number(spo.delegator_count || 0).toLocaleString('en-US')],
        ['Delegation', formatFullAdaFromLovelace(spo.delegated_lovelace)],
        ['Saturation', window.TDSPRuntime.formatRatioPercentage(spo.saturation_pct, { fallback: '--' })],
        ['Cloud Service', getSpoCloudServiceText(spo)],
        ['Pledge', formatFullAdaFromLovelace(spo.pledge_lovelace)],
        ['Live pledge', formatFullAdaFromLovelace(spo.live_pledge_lovelace)],
        ['Fixed cost', formatFullAdaFromLovelace(spo.fixed_cost_lovelace)],
        ['Margin', window.TDSPRuntime.formatRatioPercentage(spo.margin, { scale: 100, fallback: '--' })]
    ].forEach(([label, value, statusClass]) => {
        const card = document.createElement('div');
        card.className = 'governance-spo-detail-stat governance-menu-card';
        window.TDSPRuntime?.appendUniversalTileContent?.(card, {
            title: label,
            primaryText: value || '--',
            primaryClassName: statusClass ? `pool-status-value ${statusClass}` : ''
        });
        stats.appendChild(card);
    });
    container.appendChild(stats);

    const relayTitle = document.createElement('strong');
    relayTitle.textContent = `Relay nodes (${Number(spo.relay_count || spo.relays?.length || 0).toLocaleString('en-US')})`;
    container.appendChild(relayTitle);

    const relayList = document.createElement('div');
    relayList.className = 'governance-spo-relay-list';
    const relays = Array.isArray(spo.relays) ? spo.relays : [];
    if (!relays.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No advertised relay nodes are available.';
        relayList.appendChild(message);
    } else {
        relays.forEach((relay, index) => {
            const card = document.createElement('div');
            card.className = 'governance-spo-relay governance-menu-card';
            const title = document.createElement('strong');
            title.textContent = `Relay ${index + 1}`;
            card.appendChild(title);
            if (typeof relay?.up === 'boolean') {
                const status = document.createElement('span');
                status.className = `pool-status-value ${relay.up ? 'is-active' : 'is-inactive'}`;
                status.textContent = relay.up
                    ? 'Active Relay'
                    : 'Passive Relay';
                card.appendChild(status);
            }
            const address = formatSpoRelayAddress(relay);
            if (address) {
                const addressLine = document.createElement('div');
                addressLine.className = 'governance-drep-id-line governance-spo-relay-address-line';
                const addressText = document.createElement('span');
                addressText.className = 'governance-cc-member-meta governance-drep-id';
                addressText.textContent = address;
                addressLine.append(addressText, createGovernanceCopyButton(address, `Relay ${index + 1} address`));
                card.appendChild(addressLine);
            }
            const location = formatSpoRelayLocation(relay);
            if (location) {
                const locationLine = document.createElement('span');
                locationLine.className = 'governance-spo-relay-location';
                locationLine.textContent = `Location: ${location}`;
                card.appendChild(locationLine);
            }
            const provider = relay?.provider || spo.cloud_provider;
            if (provider) {
                card.appendChild(createSpoProviderBadge(provider));
            } else {
                const provider = document.createElement('span');
                provider.textContent = 'Cloud provider not identified';
                card.appendChild(provider);
            }
            relayList.appendChild(card);
        });
    }
    container.appendChild(relayList);
}

function formatSpoRelayLocation(relay) {
    const locations = (Array.isArray(relay?.geolocation) ? relay.geolocation : [])
        .map(location => [location?.city, location?.region, location?.country || location?.country_code]
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .filter((value, index, values) => values.indexOf(value) === index)
            .join(', '))
        .filter(Boolean);
    if (locations.length) return [...new Set(locations)].join(' / ');

    const countries = (Array.isArray(relay?.whois) ? relay.whois : [])
        .map(entry => String(entry?.country || '').trim().toUpperCase())
        .filter(Boolean)
        .map(code => {
            try {
                return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
            } catch {
                return code;
            }
        });
    return [...new Set(countries)].join(' / ');
}

function getSpoRelayAddressSummary(spo) {
    return [...new Set(
        (Array.isArray(spo?.relays) ? spo.relays : [])
            .map(formatSpoRelayAddress)
            .filter(Boolean)
    )].join(', ');
}

function getSpoRelaySearchText(spo) {
    return (Array.isArray(spo?.relays) ? spo.relays : [])
        .flatMap(relay => [
            formatSpoRelayAddress(relay),
            relay?.host,
            relay?.hostname,
            relay?.dns,
            relay?.address,
            relay?.ipv4,
            relay?.ipv6
        ])
        .map(value => String(value || '').trim())
        .filter(Boolean)
        .join(' ');
}

function formatSpoRelayAddress(relay) {
    const host = String(relay?.host || '').trim();
    if (!host) return '';
    const formattedHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    const port = Number(relay?.port);
    return Number.isInteger(port) && port > 0 ? `${formattedHost}:${port}` : formattedHost;
}

function createSpoPoolIdLine(poolId) {
    const line = document.createElement('div');
    line.className = 'governance-drep-id-line';
    const id = document.createElement('span');
    id.className = 'governance-card-detail governance-cc-member-meta governance-drep-id';
    id.textContent = poolId || '--';
    line.append(id);
    if (poolId) line.appendChild(createGovernanceCopyButton(poolId, 'pool ID'));
    return line;
}

function createSpoProviderBadge(provider) {
    const badge = document.createElement('span');
    badge.className = 'governance-spo-provider';
    const name = document.createElement('span');
    name.textContent = `Cloud Service: ${provider?.name || 'Not identified'}`;
    badge.appendChild(name);
    badge.setAttribute('aria-label', name.textContent);
    return badge;
}

function getSpoDisplayName(spo) {
    const name = firstNonEmptyText(spo?.name, spo?.ticker, 'No Name');
    return name.split(/\s+-\s+/, 1)[0].trim() || name;
}

function getSpoCloudServiceText(spo) {
    const compactService = firstNonEmptyText(spo?.cloud_service);
    const providerNames = getSpoCloudProviders(spo).map(provider => provider.name);
    const service = compactService || (providerNames.length ? providerNames.join(', ') : '');
    if (!service) return 'Not identified';
    return getSpoCloudHostingType(spo) === 'cloud-spo'
        ? service
        : `${service} as backup`;
}

function getSpoCloudProviders(spo) {
    const providers = new Map();
    const addProvider = provider => {
        const id = firstNonEmptyText(provider?.id);
        const name = firstNonEmptyText(provider?.name);
        if (id && name) providers.set(id, { id, name });
    };

    addProvider(spo?.cloud_provider);
    (Array.isArray(spo?.relays) ? spo.relays : []).forEach(relay => addProvider(relay?.provider));
    (firstNonEmptyText(spo?.cloud_service) || '')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean)
        .forEach(name => {
            const exists = [...providers.values()]
                .some(provider => provider.name.toLowerCase() === name.toLowerCase());
            if (!exists) {
                providers.set(`compact:${name.toLowerCase()}`, {
                    id: `compact:${name.toLowerCase()}`,
                    name
                });
            }
        });
    return Array.from(providers.values());
}

async function loadSpoDirectory() {
    if (!spoDirectoryPromise) {
        spoDirectoryPromise = fetchJson(getSpoDirectoryApiUrl())
            .then(payload => {
                const spos = Array.isArray(payload?.spos) ? payload.spos : [];
                spoDirectoryState = {
                    ...payload,
                    count: Number.isFinite(Number(payload?.count)) ? Number(payload.count) : spos.length,
                    operatorCount: getSpoOperatorCount(payload, spos.length),
                    spos
                };
                window.TDSPRuntime.setText('gov-spo-count', spoDirectoryState.operatorCount.toLocaleString('en-US'));
                window.TDSPRuntime.setText(
                    'gov-spo-total-delegated',
                    `Delegated ${window.TDSPRuntime.formatTileAdaFromLovelace(spoDirectoryState.total_delegated_lovelace || 0)}`
                );
                renderSpoNakamotoTile(spoDirectoryState.nakamoto);
                return spoDirectoryState;
            })
            .catch(error => {
                spoDirectoryPromise = null;
                window.TDSPRuntime.setText('gov-spo-count', '--');
                window.TDSPRuntime.setText('gov-spo-total-delegated', 'Delegated ₳ --');
                renderSpoNakamotoTile(null);
                throw error;
            });
    }
    return spoDirectoryPromise;
}

function getSpoOperatorCount(payload, fallback = 0) {
    const count = Number(payload?.nakamoto?.consensus?.domain_count);
    if (Number.isInteger(count) && count >= 0) return count;
    const rawCount = Number(payload?.count);
    return Number.isInteger(rawCount) && rawCount >= 0 ? rawCount : fallback;
}

function getSpoDirectoryApiUrl() {
    return GOVERNANCE_IS_LOCAL_PREVIEW ? LOCAL_SPO_DIRECTORY_PROXY_PATH : SPO_DIRECTORY_API_URL;
}

function getSpoRescanStatusApiUrl() {
    return GOVERNANCE_IS_LOCAL_PREVIEW
        ? LOCAL_SPO_RESCAN_STATUS_PROXY_PATH
        : SPO_RESCAN_STATUS_API_URL;
}

function renderSpoRescanStatus(status) {
    const element = document.getElementById('gov-spo-scan-status');
    if (!element) return;
    const checking = status?.status === 'checking';
    element.hidden = !checking;
    if (!checking) {
        element.textContent = '';
        return;
    }
    const phase = status?.phase === 'relay_checks'
        ? 'relays'
        : status?.phase === 'pool_details'
            ? 'pool data'
            : 'pools';
    const completed = Number(status?.completed) || 0;
    const total = Number(status?.total) || 0;
    element.textContent = total > 0
        ? `Checking ${phase} ${completed.toLocaleString('en-US')}/${total.toLocaleString('en-US')}`
        : `Checking ${phase}...`;
}

async function pollSpoRescanStatus() {
    let nextDelay = 30000;
    try {
        const status = await fetchJson(getSpoRescanStatusApiUrl());
        renderSpoRescanStatus(status);
        nextDelay = status?.status === 'checking' ? 3000 : 30000;
    } catch {
        renderSpoRescanStatus(null);
    }
    window.setTimeout(pollSpoRescanStatus, nextDelay);
}

function getSpoDetailApiUrl(poolId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ poolId });
        return `${LOCAL_SPO_DETAIL_PROXY_PATH}?${params.toString()}`;
    }
    return `${SPO_DETAIL_API_BASE_URL}/${encodeURIComponent(poolId)}`;
}

function closeDrepRegistrationOverlay() {
    removeGovernanceMenuOverlay('governance-drep-registration-overlay');
}

function openDrepRegistrationOverlay(returnFocus) {
    const content = document.createElement('div');
    content.className = 'governance-vote-flow governance-drep-registration-flow';

    createGovernanceMenuOverlay({
        id: 'governance-drep-registration-overlay',
        titleId: 'governance-drep-registration-title',
        titleText: 'Become a DRep',
        closeLabel: 'Close DRep registration',
        closeOverlay: closeDrepRegistrationOverlay,
        bodyNodes: [content],
        headerMeta: 'Cardano Mainnet',
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: 'DReps',
        botContext: createWebsiteSectionBotContext('DReps', {
            title: 'Become a DRep',
            status: 'DRep registration',
            root: 'DReps',
            summary: 'Registering a DRep on Cardano Mainnet'
        })
    });

    renderDrepRegistrationForm(content);
}

function renderDrepRegistrationForm(container, values = {}) {
    container.replaceChildren();

    const warning = document.createElement('div');
    warning.className = 'governance-vote-warning governance-menu-card';
    const title = document.createElement('strong');
    title.textContent = 'On-chain DRep registration';
    const text = document.createElement('p');
    text.textContent = 'Registration currently requires a refundable ₳ 500 deposit plus a network fee. Verify both amounts in your wallet before signing.';
    warning.append(title, text);

    const form = document.createElement('form');
    form.className = 'governance-drep-registration-form';
    let profileValues = values.profile || {};
    let generatedMetadataHash = values.generatedHash || '';
    const urlField = createDrepRegistrationField(
        'Metadata URL (optional)',
        'drep-metadata-url',
        'https://example.com/drep.jsonld',
        values.url || ''
    );
    const hashField = createDrepRegistrationField(
        'Metadata hash (optional)',
        'drep-metadata-hash',
        '64 hexadecimal characters',
        values.hash || ''
    );
    const createMetadata = document.createElement('button');
    createMetadata.type = 'button';
    createMetadata.className = 'governance-vote-secondary governance-create-metadata-button';
    createMetadata.textContent = 'Create metadata file';
    const urlControls = document.createElement('div');
    urlControls.className = 'governance-drep-metadata-url-controls';
    urlField.input.replaceWith(urlControls);
    urlControls.append(urlField.input, createMetadata);
    createMetadata.addEventListener('click', () => {
        openDrepMetadataBuilderOverlay(profileValues, createMetadata, (nextProfile, hash) => {
            profileValues = nextProfile;
            generatedMetadataHash = hash;
            hashField.input.value = hash;
            removeDrepRegistrationFormStatus(form);
            appendGovernanceVoteStatus(form, 'Saved drep.jsonld and added its Blake2b-256 hash. Upload this exact file, then enter its public metadata URL.');
        });
    });
    const createHash = document.createElement('button');
    createHash.type = 'button';
    createHash.className = 'governance-vote-secondary governance-create-metadata-button';
    createHash.textContent = 'Create metadata hash';
    const hashControls = document.createElement('div');
    hashControls.className = 'governance-drep-metadata-url-controls';
    hashField.input.replaceWith(hashControls);
    hashControls.append(hashField.input, createHash);
    createHash.addEventListener('click', async () => {
        removeDrepRegistrationFormStatus(form);
        createHash.disabled = true;
        const originalText = createHash.textContent;
        createHash.textContent = 'Creating...';
        try {
            const metadataUrl = validateDrepMetadataUrl(urlField.input.value, { required: true });
            const fetchUrl = getDrepMetadataFetchUrl(metadataUrl, { refresh: true });
            if (!fetchUrl) throw new Error('This metadata URL is not supported. Use a public HTTPS or IPFS URL.');

            const documentData = await fetchJson(fetchUrl, { cache: 'no-store' });
            if (!documentData || typeof documentData !== 'object' || Array.isArray(documentData)) {
                throw new Error('The metadata URL did not return a JSON object.');
            }

            const { hashDrepAnchor } = await loadGovernanceMesh();
            const hash = hashDrepAnchor(documentData);
            hashField.input.value = hash;
            generatedMetadataHash = hash;
            appendGovernanceVoteStatus(form, 'Metadata URL loaded and its Blake2b-256 hash was added.');
        } catch (error) {
            appendGovernanceVoteStatus(form, error?.message || 'Metadata hash could not be created.', true);
        } finally {
            createHash.disabled = false;
            createHash.textContent = originalText;
        }
    });
    const help = document.createElement('p');
    help.className = 'small-text governance-drep-registration-help';
    help.textContent = 'Enter both metadata fields or leave both empty. Without metadata, your DRep can vote but may not appear by name in public directories.';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'governance-vote-submit';
    submit.textContent = 'Continue to wallet';
    form.append(
        urlField.wrapper,
        hashField.wrapper,
        help,
        submit
    );
    form.addEventListener('submit', event => {
        event.preventDefault();
        try {
            const metadata = validateDrepRegistrationMetadata(urlField.input.value, hashField.input.value);
            metadata.profile = profileValues;
            metadata.generatedHash = generatedMetadataHash;
            renderDrepRegistrationWallets(container, metadata);
        } catch (error) {
            removeDrepRegistrationFormStatus(form);
            appendGovernanceVoteStatus(form, error.message, true);
        }
    });

    const govTool = document.createElement('a');
    govTool.className = 'governance-vote-secondary governance-drep-govtool-link';
    govTool.href = 'https://gov.tools/';
    govTool.target = '_blank';
    govTool.rel = 'noopener noreferrer';
    govTool.textContent = 'Use GovTool instead';

    container.append(warning, form, govTool);
}

function closeDrepMetadataBuilderOverlay() {
    removeGovernanceMenuOverlay('governance-drep-metadata-overlay');
}

function openDrepMetadataBuilderOverlay(profile = {}, returnFocus, onCreated) {
    const content = document.createElement('div');
    content.className = 'governance-drep-metadata-builder';
    const form = document.createElement('form');
    form.className = 'governance-drep-registration-form';
    const nameField = createDrepRegistrationField('DRep name', 'drep-profile-name', 'Required for CIP-119 metadata', profile.givenName || '');
    const paymentField = createDrepRegistrationField('Payment address (optional)', 'drep-profile-payment', 'addr1...', profile.paymentAddress || '');
    const imageField = createDrepRegistrationField('Profile image URL (optional)', 'drep-profile-image', 'https://example.com/profile.png', profile.imageUrl || '');
    const imageHashField = createDrepRegistrationField('Image SHA-256 (optional)', 'drep-profile-image-hash', '64 hexadecimal characters', profile.imageHash || '');
    const objectivesField = createDrepRegistrationTextArea('Objectives (optional)', 'drep-profile-objectives', 'What do you want to achieve as a DRep?', profile.objectives || '');
    const motivationsField = createDrepRegistrationTextArea('Motivations (optional)', 'drep-profile-motivations', 'Why do you want to become a DRep?', profile.motivations || '');
    const qualificationsField = createDrepRegistrationTextArea('Qualifications (optional)', 'drep-profile-qualifications', 'Relevant experience and qualifications', profile.qualifications || '');
    const identityField = createDrepRegistrationField('Identity URL (optional)', 'drep-profile-identity', 'https://social.example/your-profile', profile.identityUrl || '');
    const linkLabelField = createDrepRegistrationField('Additional link label (optional)', 'drep-profile-link-label', 'Website, X, LinkedIn...', profile.linkLabel || '');
    const linkUrlField = createDrepRegistrationField('Additional link URL (optional)', 'drep-profile-link-url', 'https://example.com', profile.linkUrl || '');
    const doNotListField = createDrepRegistrationCheckbox('Do not list me in public DRep directories', 'drep-profile-do-not-list', profile.doNotList === true);
    const profileFields = {
        nameField,
        paymentField,
        imageField,
        imageHashField,
        objectivesField,
        motivationsField,
        qualificationsField,
        identityField,
        linkLabelField,
        linkUrlField,
        doNotListField
    };
    const help = document.createElement('p');
    help.className = 'small-text governance-drep-registration-help';
    help.textContent = 'Only DRep name is required by CIP-119. The name must not already exist in the DRep directory. The downloaded file must be uploaded unchanged before using its URL and hash.';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'governance-vote-submit';
    submit.textContent = 'Create and save drep.jsonld';
    form.append(
        nameField.wrapper,
        paymentField.wrapper,
        imageField.wrapper,
        imageHashField.wrapper,
        objectivesField.wrapper,
        motivationsField.wrapper,
        qualificationsField.wrapper,
        identityField.wrapper,
        linkLabelField.wrapper,
        linkUrlField.wrapper,
        doNotListField.wrapper,
        help,
        submit
    );
    form.addEventListener('submit', async event => {
        event.preventDefault();
        removeDrepRegistrationFormStatus(form);
        submit.disabled = true;
        try {
            const nextProfile = collectDrepMetadataProfile(profileFields, { requireName: true });
            submit.textContent = 'Checking name...';
            await assertDrepMetadataNameAvailable(nextProfile.givenName);
            submit.textContent = 'Creating file...';
            const documentData = createCip119MetadataDocument(nextProfile);
            const { hashDrepAnchor } = await loadGovernanceMesh();
            const hash = hashDrepAnchor(documentData);
            downloadDrepMetadataFile(documentData);
            closeDrepMetadataBuilderOverlay();
            onCreated(nextProfile, hash);
        } catch (error) {
            appendGovernanceVoteStatus(form, error?.message || 'Metadata file could not be created.', true);
            submit.disabled = false;
            submit.textContent = 'Create and save drep.jsonld';
        }
    });
    content.appendChild(form);

    createGovernanceMenuOverlay({
        id: 'governance-drep-metadata-overlay',
        titleId: 'governance-drep-metadata-title',
        titleText: 'Create DRep metadata',
        closeLabel: 'Close DRep metadata builder',
        closeOverlay: closeDrepMetadataBuilderOverlay,
        bodyNodes: [content],
        headerMeta: 'CIP-119',
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: 'DReps',
        botContext: createWebsiteSectionBotContext('DReps', {
            title: 'Create DRep metadata',
            status: 'CIP-119 metadata',
            root: 'DReps',
            summary: 'Building DRep metadata JSON-LD'
        })
    });
}

function createDrepRegistrationField(labelText, id, placeholder, value) {
    const wrapper = document.createElement('label');
    wrapper.className = 'governance-drep-registration-field';
    wrapper.htmlFor = id;
    const label = document.createElement('strong');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.id = id;
    input.name = id;
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value;
    input.autocomplete = 'off';
    input.spellcheck = false;
    wrapper.append(label, input);
    return { wrapper, input };
}

function createDrepRegistrationTextArea(labelText, id, placeholder, value) {
    const wrapper = document.createElement('label');
    wrapper.className = 'governance-drep-registration-field';
    wrapper.htmlFor = id;
    const label = document.createElement('strong');
    label.textContent = labelText;
    const input = document.createElement('textarea');
    input.id = id;
    input.name = id;
    input.placeholder = placeholder;
    input.value = value;
    input.maxLength = 1000;
    input.rows = 4;
    wrapper.append(label, input);
    return { wrapper, input };
}

function createDrepRegistrationCheckbox(labelText, id, checked) {
    const wrapper = document.createElement('label');
    wrapper.className = 'governance-drep-registration-checkbox';
    wrapper.htmlFor = id;
    const input = document.createElement('input');
    input.id = id;
    input.name = id;
    input.type = 'checkbox';
    input.checked = checked;
    const label = document.createElement('span');
    label.textContent = labelText;
    wrapper.append(input, label);
    return { wrapper, input };
}

function removeDrepRegistrationFormStatus(form) {
    form.querySelectorAll('.governance-vote-status').forEach(status => status.remove());
}

function collectDrepMetadataProfile(fields, options = {}) {
    const profile = {
        givenName: fields.nameField.input.value.trim(),
        paymentAddress: fields.paymentField.input.value.trim(),
        imageUrl: fields.imageField.input.value.trim(),
        imageHash: fields.imageHashField.input.value.trim().toLowerCase(),
        objectives: fields.objectivesField.input.value.trim(),
        motivations: fields.motivationsField.input.value.trim(),
        qualifications: fields.qualificationsField.input.value.trim(),
        identityUrl: fields.identityField.input.value.trim(),
        linkLabel: fields.linkLabelField.input.value.trim(),
        linkUrl: fields.linkUrlField.input.value.trim(),
        doNotList: fields.doNotListField.input.checked
    };
    if (options.requireName && !profile.givenName) throw new Error('DRep name is required to create CIP-119 metadata.');
    if (profile.givenName.length > 80) throw new Error('DRep name must be 80 characters or shorter.');
    ['objectives', 'motivations', 'qualifications'].forEach(key => {
        if (profile[key].length > 1000) throw new Error(`${key[0].toUpperCase()}${key.slice(1)} must be 1,000 characters or shorter.`);
    });
    if (profile.paymentAddress && !/^addr1[0-9a-z]{20,120}$/.test(profile.paymentAddress)) {
        throw new Error('Payment address must be a Cardano Mainnet addr1 address.');
    }
    validateOptionalUrlPair(profile.imageUrl, profile.imageHash, 'Profile image URL', 'image SHA-256');
    if (profile.imageHash && !/^[0-9a-f]{64}$/.test(profile.imageHash)) throw new Error('Image SHA-256 must contain exactly 64 hexadecimal characters.');
    validateOptionalHttpsUrl(profile.identityUrl, 'Identity URL');
    if (Boolean(profile.linkLabel) !== Boolean(profile.linkUrl)) throw new Error('Additional link label and URL must be provided together.');
    validateOptionalHttpsUrl(profile.linkUrl, 'Additional link URL');
    return profile;
}

async function assertDrepMetadataNameAvailable(name) {
    const normalizedName = normalizeDrepNameForComparison(name);
    if (!normalizedName) throw new Error('Enter a valid DRep name.');

    let payload;
    try {
        payload = await fetchDrepInfoPayload();
    } catch {
        throw new Error('The DRep directory could not be checked. Please try again before creating the metadata file.');
    }

    const existingNames = new Set(unwrapDrepEntries(payload)
        .map(extractDrepNameFromEntry)
        .filter(Boolean)
        .map(normalizeDrepNameForComparison));
    if (existingNames.has(normalizedName)) {
        throw new Error(`The DRep name "${name}" already exists. Choose a unique name.`);
    }
}

function normalizeDrepNameForComparison(value) {
    return String(value || '')
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase();
}

function validateOptionalUrlPair(url, hash, urlLabel, hashLabel) {
    if (Boolean(url) !== Boolean(hash)) throw new Error(`${urlLabel} and ${hashLabel} must be provided together.`);
    validateOptionalHttpsUrl(url, urlLabel);
}

function validateOptionalHttpsUrl(value, label) {
    if (!value) return;
    try {
        if (new URL(value).protocol !== 'https:') throw new Error();
    } catch {
        throw new Error(`${label} must be a valid HTTPS URL.`);
    }
}

function createCip119MetadataDocument(profile) {
    const body = { givenName: profile.givenName };
    if (profile.paymentAddress) body.paymentAddress = profile.paymentAddress;
    if (profile.imageUrl) {
        body.image = { '@type': 'ImageObject', contentUrl: profile.imageUrl, sha256: profile.imageHash };
    }
    if (profile.objectives) body.objectives = profile.objectives;
    if (profile.motivations) body.motivations = profile.motivations;
    if (profile.qualifications) body.qualifications = profile.qualifications;
    const references = [];
    if (profile.identityUrl) references.push({ '@type': 'Identity', label: 'Identity', uri: profile.identityUrl });
    if (profile.linkUrl) references.push({ '@type': 'Link', label: profile.linkLabel, uri: profile.linkUrl });
    if (references.length) body.references = references;
    if (profile.doNotList) body.doNotList = true;

    return {
        '@context': {
            CIP100: 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#',
            CIP119: 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0119/README.md#',
            hashAlgorithm: 'CIP100:hashAlgorithm',
            body: {
                '@id': 'CIP119:body',
                '@context': {
                    references: {
                        '@id': 'CIP119:references',
                        '@container': '@set',
                        '@context': {
                            GovernanceMetadata: 'CIP100:GovernanceMetadataReference',
                            Other: 'CIP100:OtherReference',
                            label: 'CIP100:reference-label',
                            uri: 'CIP100:reference-uri'
                        }
                    },
                    paymentAddress: 'CIP119:paymentAddress',
                    givenName: 'CIP119:givenName',
                    image: { '@id': 'CIP119:image', '@context': { ImageObject: 'https://schema.org/ImageObject' } },
                    objectives: 'CIP119:objectives',
                    motivations: 'CIP119:motivations',
                    qualifications: 'CIP119:qualifications',
                    doNotList: 'CIP119:doNotList'
                }
            }
        },
        hashAlgorithm: 'blake2b-256',
        body
    };
}

function downloadDrepMetadataFile(documentData) {
    const content = JSON.stringify(documentData, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/ld+json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drep.jsonld';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateDrepRegistrationMetadata(rawUrl, rawHash) {
    const url = String(rawUrl || '').trim();
    const hash = String(rawHash || '').trim().toLowerCase();
    if (!url && !hash) return { url: '', hash: '', anchor: undefined };
    if (!url || !hash) throw new Error('Metadata URL and metadata hash must be provided together.');
    if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error('Metadata hash must contain exactly 64 hexadecimal characters.');
    validateDrepMetadataUrl(url, { required: true });

    return {
        url,
        hash,
        anchor: { anchorUrl: url, anchorDataHash: hash }
    };
}

function validateDrepMetadataUrl(rawUrl, options = {}) {
    return validateGovernanceAnchorUrl(rawUrl, 'Metadata URL', options);
}

function validateGovernanceAnchorUrl(rawUrl, label = 'Anchor URL', options = {}) {
    const url = String(rawUrl || '').trim();
    if (!url) {
        if (options.required) throw new Error(`Enter the ${label.toLowerCase()} before creating its hash.`);
        return '';
    }
    if (new TextEncoder().encode(url).length > 128) throw new Error(`${label} must be 128 bytes or shorter.`);

    let protocol = '';
    try {
        protocol = new URL(url).protocol;
    } catch {
        throw new Error(`Enter a valid HTTPS or IPFS ${label.toLowerCase()}.`);
    }
    if (protocol !== 'https:' && protocol !== 'ipfs:') throw new Error(`${label} must use HTTPS or IPFS.`);
    return url;
}

async function renderDrepRegistrationWallets(container, metadata) {
    container.replaceChildren();
    appendGovernanceVoteStatus(container, 'Detecting CIP-95 wallets...');

    try {
        const { BrowserWallet } = await loadGovernanceMesh();
        if (!container.isConnected) return;
        const wallets = BrowserWallet.getInstalledWallets();
        container.replaceChildren();

        if (!wallets.length) {
            appendGovernanceVoteStatus(container, 'No CIP-95 Cardano wallet extension was detected. No transaction was built.', true);
            appendDrepRegistrationBackButton(container, metadata);
            return;
        }

        const label = document.createElement('strong');
        label.textContent = 'Connect the wallet that will control your DRep';
        const list = document.createElement('div');
        list.className = 'wallet-list governance-vote-wallet-list';
        wallets.forEach(walletInfo => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wallet-option';
            const icon = document.createElement('img');
            icon.src = walletInfo.icon;
            icon.alt = '';
            icon.width = 28;
            icon.height = 28;
            const name = document.createElement('span');
            name.textContent = walletInfo.name;
            button.append(icon, name);
            button.addEventListener('click', () => prepareDrepRegistration(container, metadata, walletInfo));
            list.appendChild(button);
        });
        container.append(label, list);
        appendDrepRegistrationBackButton(container, metadata);
    } catch (error) {
        console.error('DRep registration wallet detection failed', error);
        if (!container.isConnected) return;
        container.replaceChildren();
        appendGovernanceVoteStatus(container, 'The wallet connector could not be loaded. No transaction was built.', true);
        appendDrepRegistrationBackButton(container, metadata);
    }
}

function appendDrepRegistrationBackButton(container, metadata) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'governance-vote-secondary';
    button.textContent = 'Back to metadata';
    button.addEventListener('click', () => renderDrepRegistrationForm(container, metadata));
    container.appendChild(button);
}

async function prepareDrepRegistration(container, metadata, walletInfo) {
    container.replaceChildren();
    appendGovernanceVoteStatus(container, `Connecting to ${walletInfo.name} with CIP-95...`);

    try {
        const { BrowserWallet, MeshTxBuilder, DREP_DEPOSIT } = await loadGovernanceMesh();
        const wallet = await BrowserWallet.enable(walletInfo.id, [{ cip: 95 }]);
        if (await wallet.getNetworkId() !== 1) throw new Error('Switch your wallet to Cardano Mainnet.');
        const extensions = await wallet.getExtensions().catch(() => []);
        const drep = await wallet.getDRep();
        if (!extensions.includes(95) || !drep?.dRepIDCip105) {
            throw new Error('This wallet did not provide CIP-95 DRep access. No transaction was built.');
        }

        const drepPayload = await fetchWalletDrepDetails(drep);
        if (drepPayload?.info?.drep_status === 'registered') {
            throw new Error('This wallet is already registered as a DRep. No transaction was built.');
        }

        renderDrepRegistrationReview(container, {
            metadata,
            walletInfo,
            wallet,
            drep,
            MeshTxBuilder,
            deposit: String(DREP_DEPOSIT || '500000000')
        });
    } catch (error) {
        console.error('DRep registration preparation failed', error);
        if (!container.isConnected) return;
        container.replaceChildren();
        appendGovernanceVoteStatus(container, error?.message || 'DRep registration could not be prepared. No transaction was built.', true);
        appendDrepRegistrationBackButton(container, metadata);
    }
}

function renderDrepRegistrationReview(container, context) {
    container.replaceChildren();
    const review = document.createElement('div');
    review.className = 'governance-vote-review governance-menu-card';
    addDetailRow(review, 'DRep ID', context.drep.dRepIDCip105);
    addDetailRow(review, 'Wallet', context.walletInfo.name);
    addDetailRow(review, 'Refundable deposit', formatFullAdaFromLovelace(context.deposit));
    addDetailRow(review, 'Metadata URL', context.metadata.url || 'None');
    addDetailRow(review, 'Metadata hash', context.metadata.hash || 'None');

    const warning = document.createElement('p');
    warning.className = 'governance-vote-review-warning';
    warning.textContent = 'This registers the displayed DRep ID on Cardano Mainnet. Check the ₳ 500 deposit, network fee, DRep ID and metadata in your wallet before signing.';
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'governance-vote-submit';
    submit.textContent = 'Register as DRep';
    submit.addEventListener('click', () => submitDrepRegistration(container, context, submit));
    container.append(review, warning, submit);
    appendDrepRegistrationBackButton(container, context.metadata);
}

async function submitDrepRegistration(container, context, submitButton) {
    submitButton.disabled = true;
    const status = appendGovernanceVoteStatus(container, 'Building the DRep registration transaction...');

    try {
        const latest = await fetchWalletDrepDetails(context.drep);
        if (latest?.info?.drep_status === 'registered') {
            throw new Error('This DRep is already registered. No transaction was built.');
        }
        const utxos = await context.wallet.getUtxos();
        const changeAddress = await context.wallet.getChangeAddress();
        if (!utxos?.length || !changeAddress) throw new Error('No spendable wallet UTxO was found for the deposit and network fee.');

        const txBuilder = new context.MeshTxBuilder({ verbose: false });
        const unsignedTx = await txBuilder
            .drepRegistrationCertificate(context.drep.dRepIDCip105, context.metadata.anchor, context.deposit)
            .selectUtxosFrom(utxos)
            .changeAddress(changeAddress)
            .complete();

        status.textContent = 'Check the DRep ID, refundable deposit, metadata and fee in your wallet before signing.';
        const signedTx = await context.wallet.signTx(unsignedTx, false);
        status.textContent = 'Submitting the signed DRep registration...';
        const txHash = await context.wallet.submitTx(signedTx);

        container.replaceChildren();
        const success = document.createElement('strong');
        success.className = 'governance-vote-success';
        success.textContent = 'DRep registration submitted.';
        const idLine = document.createElement('div');
        idLine.className = 'governance-drep-id-line governance-vote-action-id-line';
        const id = document.createElement('span');
        id.className = 'governance-drep-id governance-vote-action-id';
        id.textContent = context.drep.dRepIDCip105;
        idLine.append(id, createGovernanceCopyButton(context.drep.dRepIDCip105, 'DRep ID'));
        const link = document.createElement('a');
        link.href = `https://cardanoscan.io/transaction/${encodeURIComponent(txHash)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'View transaction on Cardanoscan';
        container.append(success, idLine, link);
    } catch (error) {
        console.error('DRep registration submission failed', error);
        status.textContent = `Registration failed: ${error?.info || error?.message || 'The wallet rejected the transaction.'}`;
        status.classList.add('is-error');
        submitButton.disabled = false;
    }
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
            searchIds: identifiers.join(' '),
            name,
            votingPower: getDrepEntryVotingPower(entry),
            active: entry?.active === true
        });
    });

    const dreps = Array.from(uniqueDreps.values())
        .sort((left, right) =>
            getDrepPinRank(left) - getDrepPinRank(right)
            || right.votingPower - left.votingPower
            || left.name.localeCompare(right.name)
        );
    drepDirectoryState = {
        count: dreps.length,
        dreps,
        totalVotingPower: dreps.reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0)
    };
    updateGovernanceMenuHeaderMeta(
        'governance-drep-directory-overlay',
        `${dreps.length.toLocaleString('en-US')} DReps`,
        container
    );
    updateGovernanceOverlayBotContext(
        'governance-drep-directory-overlay',
        createWebsiteSectionBotContext('DReps', {
            title: 'DReps',
            count: dreps.length,
            amount_ada: dreps.reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0) / 1_000_000,
            summary: `${dreps.length.toLocaleString('en-US')} registered DReps`
        }),
        container
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
    dreps.forEach(drep => {
        const row = document.createElement('div');
        row.className = 'governance-card governance-menu-card governance-cc-member';
        row.dataset.searchText = `${drep.id || ''} ${drep.searchIds || ''}`.trim();
        row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(drep.name);
        row.dataset.sortPower = String(Number(drep.votingPower) || 0);
        row.dataset.sortStatus = drep.active ? '1' : '0';
        const pinRank = getDrepPinRank(drep);
        if (Number.isFinite(pinRank)) row.dataset.overlayPinRank = String(pinRank);

        row.classList.add(drep.active ? 'governance-drep-member--active' : 'governance-drep-member--inactive');

        const idLine = document.createElement('div');
        idLine.className = 'governance-drep-id-line';

        const id = document.createElement('span');
        id.className = 'governance-card-detail governance-cc-member-meta governance-drep-id';
        id.textContent = drep.id;

        const copyId = createGovernanceCopyButton(drep.id, 'DRep ID');
        idLine.appendChild(id);
        idLine.appendChild(copyId);

        window.TDSPRuntime?.appendUniversalTileContent?.(row, {
            title: drep.name,
            titleClassName: 'governance-title governance-cc-member-hash',
            primaryText: `Voting power: ${formatCompactAdaFromLovelace(drep.votingPower)}`,
            primaryClassName: 'governance-card-detail governance-treasury-withdrawal-amount governance-cc-member-stats',
            detailItems: [
                {
                    text: drep.active ? 'Active' : 'Inactive',
                    className: 'governance-card-detail governance-drep-member-status'
                },
                idLine
            ]
        });
        row.classList.add('governance-cc-member-clickable');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Show votes by ${drep.name}`);
        bindGovernanceMenuTrigger(row, event => openDrepActionHistoryOverlay(drep, event.currentTarget));
        bindGovernanceEntityPreload(
            row,
            `drep:${String(drep.id || '').toLowerCase()}`,
            () => fetchJson(getDrepDetailApiUrl(drep.id), { cache: 'no-store' })
        );
        fragment.appendChild(row);
    });
    container.appendChild(fragment);
}

function getDrepPinRank(drep) {
    const id = String(drep?.id || '').trim().toLowerCase();
    const name = window.TDSPRuntime.normalizeSearchText(drep?.name).replace(/\s+/g, '');
    return id === DAMION_DREP_ID || name === 'damiondutch' ? 0 : Infinity;
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

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-drep-status-chart';

    const title = document.createElement('strong');
    title.textContent = 'DRep Status';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    const chart = createUniversalPieChart(groups, {
        labelFormatter: segment => formatCompactAdaFromLovelace(segment.value)
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

async function openTopDrepPowerOverlay(returnFocus = document.activeElement) {
    const panel = document.createElement('div');
    panel.className = 'governance-drep-directory-list';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading top 10 DReps...';
    panel.appendChild(loading);

    createGovernanceMenuOverlay({
        id: 'governance-drep-top10-overlay',
        titleId: 'governance-drep-top10-title',
        titleText: 'Top 10 DReps',
        closeLabel: 'Close top 10 DReps',
        closeOverlay: closeTopDrepPowerOverlay,
        bodyNodes: [panel],
        headerMeta: 'Loading...',
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        defaultSort: 'power-desc',
        botContext: createWebsiteSectionBotContext('DReps', {
            title: 'Top 10 DReps',
            root: 'DReps',
            summary: 'Top 10 DReps by voting power'
        })
    });

    try {
        const [infoPayload, directory] = await Promise.all([
            fetchDrepInfoPayload(),
            loadDrepDirectory()
        ]);
        if (!panel.isConnected) return;

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
                searchIds: identifiers.join(' '),
                name,
                votingPower: getDrepEntryVotingPower(entry),
                active: entry?.active === true
            });
        });

        const topDreps = Array.from(uniqueDreps.values())
            .sort((left, right) =>
                (Number(right.votingPower) || 0) - (Number(left.votingPower) || 0)
                || left.name.localeCompare(right.name)
            )
            .slice(0, 10);
        const top10Power = topDreps.reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0);
        let renderedFreshVoteMatrix = false;
        renderTopDrepPowerList(panel, topDreps);
        updateGovernanceMenuHeaderMeta(
            'governance-drep-top10-overlay',
            `${window.TDSPRuntime.formatTileAdaFromLovelace(top10Power, { fixedFractionDigits: 2 })} voting power`,
            panel
        );
        fetchDrepCorrelationPayload()
            .then(payload => {
                topDrepCorrelationPayload = payload;
                if (panel.isConnected && !renderedFreshVoteMatrix) {
                    return fetchDrepVoteStatsPayload(topDreps).then(voteStatsPayload => {
                        if (!panel.isConnected || renderedFreshVoteMatrix || !voteStatsPayload) return;
                        renderTopDrepVoteMatrix(
                            panel,
                            topDreps,
                            topDreps.map(drep => createCachedDrepVoteDetailPayload(drep, voteStatsPayload))
                        );
                    });
                }
                return null;
            })
            .catch(error => {
                console.warn('Cached DRep correlation could not be loaded', error);
            });
        const refreshTopDrepVoteMatrix = () => {
            Promise.all(topDreps.map(drep => loadDrepDetail(drep).catch(error => ({ error }))))
                .then(detailPayloads => {
                    if (!panel.isConnected) return;
                    renderedFreshVoteMatrix = true;
                    renderTopDrepVoteMatrix(panel, topDreps, detailPayloads);
                })
                .catch(error => {
                    console.error('Top 10 DRep vote matrix could not be loaded', error);
                });
        };
        fetchDrepVoteStatsPayload(topDreps)
            .then(voteStatsPayload => {
                if (!panel.isConnected) return;
                if (voteStatsPayload && !renderedFreshVoteMatrix) {
                    renderTopDrepVoteMatrix(
                        panel,
                        topDreps,
                        topDreps.map(drep => createCachedDrepVoteDetailPayload(drep, voteStatsPayload))
                    );
                }
                if (isDrepVoteStatsPayloadStale(voteStatsPayload)) {
                    refreshTopDrepVoteMatrix();
                }
            })
            .catch(error => {
                console.warn('Cached DRep vote stats could not be loaded', error);
                refreshTopDrepVoteMatrix();
            });
        updateGovernanceOverlayBotContext(
            'governance-drep-top10-overlay',
            createWebsiteSectionBotContext('DReps', {
                title: 'Top 10 DReps',
                count: topDreps.length,
                amount_ada: top10Power / 1_000_000,
                root: 'DReps',
                summary: `Top 10 DReps represent ${window.TDSPRuntime.formatTileAdaFromLovelace(top10Power, { fixedFractionDigits: 2 })} voting power`
            }),
            panel
        );
        renderDrepSummaryStats({
            count: uniqueDreps.size,
            totalPower: Array.from(uniqueDreps.values()).reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0),
            activeCount: Array.from(uniqueDreps.values()).filter(drep => drep.active).length,
            inactiveCount: uniqueDreps.size - Array.from(uniqueDreps.values()).filter(drep => drep.active).length,
            top10Power
        });
    } catch (error) {
        console.error('Top 10 DReps could not be loaded', error);
        if (!panel.isConnected) return;
        panel.replaceChildren();
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Top 10 DRep data could not be loaded.';
        panel.appendChild(message);
    }
}

function closeTopDrepPowerOverlay() {
    removeGovernanceMenuOverlay('governance-drep-top10-overlay');
}

function isDrepVoteStatsPayloadStale(voteStatsPayload) {
    const updatedAt = Date.parse(String(
        voteStatsPayload?.updated_at
        || voteStatsPayload?.generated_at
        || voteStatsPayload?.created_at
        || ''
    ));
    return !Number.isFinite(updatedAt)
        || Date.now() - updatedAt > DREP_TOP10_BACKGROUND_REFRESH_MAX_AGE_MS;
}

function createCachedDrepVoteDetailPayload(drep, voteStatsPayload) {
    const statsByDrep = voteStatsPayload?.dreps && typeof voteStatsPayload.dreps === 'object'
        ? voteStatsPayload.dreps
        : {};
    const identifiers = getDrepEntryIdentifiers(drep).map(normalizeGovernanceIdentifier).filter(Boolean);
    const cachedId = identifiers.find(identifier => statsByDrep[identifier])
        || identifiers.map(shortenDrepIdentifier).find(identifier => statsByDrep[identifier]);
    const cachedStats = cachedId ? statsByDrep[cachedId] : null;

    return {
        drep_id: drep?.id || cachedId || identifiers[0] || '',
        info: {
            amount: drep?.votingPower,
            active: drep?.active === true
        },
        metadata: {
            meta_json: {
                body: {
                    givenName: drep?.name || cachedId || identifiers[0] || 'DRep'
                }
            }
        },
        vote_stats: {
            source: voteStatsPayload?.source || 'cache',
            updated_at: voteStatsPayload?.updated_at || null,
            cached_proposals: voteStatsPayload?.cached_proposals || 0,
            total_proposals: voteStatsPayload?.total_proposals || 0,
            ...(cachedStats && typeof cachedStats === 'object' ? cachedStats : {}),
            vote_count: Number(cachedStats?.vote_count) || 0,
            actions: Array.isArray(cachedStats?.actions) ? cachedStats.actions : []
        }
    };
}

function renderTopDrepPowerList(container, topDreps) {
    container.textContent = '';
    if (!topDreps.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No top DRep data available.';
        container.appendChild(message);
        return;
    }

    renderDrepDirectory(container, topDreps, { showChart: false });
    const intro = document.createElement('p');
    intro.className = 'small-text';
    intro.textContent = 'Vote sync is loading in the background.';
    container.prepend(intro);
}

function renderTopDrepVoteMatrix(container, dreps, detailPayloads) {
    container.textContent = '';
    const drepDetails = (Array.isArray(dreps) ? dreps : []).map((drep, index) => {
        const payload = detailPayloads?.[index] || {};
        const refreshed = payload?.error ? drep : mergeDrepDetail(drep, payload);
        const voteStats = payload?.vote_stats || {};
        const actionsById = new Map((Array.isArray(voteStats.actions) ? voteStats.actions : [])
            .map(action => [String(action?.proposal_id || ''), action]));
        return {
            ...refreshed,
            voteStats,
            actionsById,
            registrationTime: Number(voteStats.registration_time),
            eligibility: voteStats?.eligibility && typeof voteStats.eligibility === 'object'
                ? voteStats.eligibility
                : null
        };
    });

    if (!drepDetails.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No top DRep data available.';
        container.appendChild(message);
        return;
    }

    const intro = document.createElement('div');
    intro.className = 'governance-top-drep-vote-intro';
    intro.textContent = 'Each card shows how the top 10 DReps voted. The same-vote line groups DReps by vote choice.';
    container.appendChild(intro);

    const proposals = getGovernanceActionsForCommitteeOverview()
        .filter(proposal => !isGovernanceActionExcludedFromDrepStats(proposal))
        .sort((left, right) => (Number(right.block_time) || 0) - (Number(left.block_time) || 0));

    const correlationChart = createTopDrepVoteCorrelationChart(topDrepCorrelationPayload, drepDetails);
    if (correlationChart) container.appendChild(correlationChart);

    proposals.forEach(proposal => {
        const rows = drepDetails.map(drep => {
            const choice = getTopDrepVoteMatrixChoice(drep, proposal);
            return { drep, choice };
        });

        const card = document.createElement('div');
        card.className = 'governance-card governance-menu-card governance-top-drep-vote-card';
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.setAttribute('aria-label', `Open ${getProposalTitle(proposal)}`);
        bindGovernanceMenuTrigger(card, event => openGovernanceOverlay(proposal, { returnFocus: event.currentTarget }));
        card.dataset.searchText = [
            getProposalTitle(proposal),
            proposal?.proposal_id,
            ...rows.flatMap(row => [row.drep?.name, row.choice])
        ].filter(Boolean).join(' ');
        card.dataset.sortName = getProposalTitle(proposal);
        card.dataset.sortDate = String(Number(proposal?.block_time) || 0);

        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'governance-card-open governance-top-drep-vote-action';
        header.addEventListener('click', event => {
            event.stopPropagation();
            openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
        });
        window.TDSPRuntime?.appendUniversalTileContent?.(header, {
            title: getProposalTitle(proposal),
            titleClassName: 'governance-title',
            primaryText: window.TDSPRuntime.formatReadableLabel(getEffectiveProposalType(proposal), 'Governance'),
            detailItems: [getProposalMeta(proposal)]
        });
        card.appendChild(header);

        const sameLine = document.createElement('div');
        sameLine.className = 'governance-top-drep-same-line';
        sameLine.textContent = formatTopDrepSameVoteLine(rows);
        card.appendChild(sameLine);

        const grid = document.createElement('div');
        grid.className = 'governance-top-drep-vote-grid';
        rows.forEach(row => grid.appendChild(createTopDrepVoteChip(row.drep, row.choice)));
        card.appendChild(grid);
        container.appendChild(card);
    });

    if (proposals.length) installOverlaySearch(container.closest('.overlay-dialog-body'), {
        defaultSort: 'newest',
        searchPlaceholder: 'Search action, DRep name or vote choice'
    });
}


function createTopDrepVoteCorrelationChart(correlationPayload, drepDetails = []) {
    const stats = Array.isArray(correlationPayload?.correlations) ? correlationPayload.correlations : [];
    if (!stats.length) return null;
    const drepsById = new Map((Array.isArray(drepDetails) ? drepDetails : [])
        .flatMap(drep => getDrepEntryIdentifiers(drep).map(identifier => [normalizeGovernanceIdentifier(identifier), drep])));

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-top-drep-correlation-chart';

    const title = document.createElement('strong');
    title.textContent = 'Vote Sync';

    const list = document.createElement('div');
    list.className = 'governance-top-drep-correlation-list';

    stats.forEach(item => {
        const row = document.createElement('div');
        row.className = 'governance-top-drep-correlation-row';
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', 'Open DRep ' + (item.name || 'DRep'));
        const drep = drepsById.get(normalizeGovernanceIdentifier(item.drep_id)) || {
            id: item.drep_id,
            name: item.name,
            votingPower: item.voting_power
        };
        bindGovernanceMenuTrigger(row, event => openDrepActionHistoryOverlay(drep, event.currentTarget));
        row.dataset.searchText = [item.name, item.best_match_name].filter(Boolean).join(' ');

        const label = document.createElement('div');
        label.className = 'governance-top-drep-correlation-label';
        const name = document.createElement('strong');
        name.textContent = item.name || 'DRep';
        const detail = document.createElement('span');
        detail.textContent = item.best_match_name
            ? 'Most in sync with ' + item.best_match_name + ' - ' + formatPercentage(item.best_match_percent) + ' (' + Number(item.best_match_same || 0).toLocaleString('en-US') + '/' + Number(item.best_match_comparable || 0).toLocaleString('en-US') + ' shared votes)'
            : 'No shared explicit votes found';
        label.append(name, detail);

        const meter = document.createElement('div');
        meter.className = 'governance-top-drep-correlation-meter';
        const fill = document.createElement('span');
        fill.style.width = Math.max(0, Math.min(100, Number(item.best_match_percent) || 0)) + '%';
        meter.appendChild(fill);

        const value = document.createElement('strong');
        value.className = 'governance-top-drep-correlation-value';
        value.textContent = formatPercentage(item.best_match_percent);

        row.append(label, meter, value);
        list.appendChild(row);
    });

    section.append(title, list);
    return section;
}

function getTopDrepVoteMatrixChoice(drep, proposal) {
    const applicable = isGovernanceActionApplicableToDrep(
        proposal,
        drep?.registrationTime,
        drep?.eligibility
    );
    const action = drep?.actionsById?.get(String(proposal?.proposal_id || '')) || null;
    if (action) return formatVoteChoice(action?.vote || action?.vote_bucket);
    if (!applicable) return 'Not applicable';
    return isExpiredGovernanceActionForCommitteeStats(proposal) ? 'Not voted' : 'Not voted yet';
}

function formatTopDrepSameVoteLine(rows) {
    const counts = rows.reduce((totals, row) => {
        const key = row.choice || 'Unknown';
        totals.set(key, (totals.get(key) || 0) + 1);
        return totals;
    }, new Map());
    const order = ['Yes', 'No', 'Abstain', 'Not voted', 'Not voted yet', 'Not applicable', 'Unknown'];
    const parts = order
        .filter(key => counts.has(key))
        .map(key => `${key}: ${counts.get(key)}`);
    return parts.length ? parts.join(' • ') : 'No vote data';
}

function createTopDrepVoteChip(drep, choice) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `governance-top-drep-vote-chip ${getTopDrepVoteChoiceClass(choice)}`;
    chip.addEventListener('click', event => {
        event.stopPropagation();
        openDrepActionHistoryOverlay(drep, event.currentTarget);
    });

    const name = document.createElement('strong');
    name.textContent = drep?.name || 'DRep';
    const vote = document.createElement('span');
    vote.textContent = choice || 'Unknown';
    chip.append(name, vote);
    return chip;
}

function getTopDrepVoteChoiceClass(choice) {
    if (choice === 'Yes') return 'is-yes';
    if (choice === 'No' || choice === 'Not voted') return 'is-no';
    if (choice === 'Abstain') return 'is-abstain';
    if (choice === 'Not voted yet') return 'is-pending';
    if (choice === 'Not applicable') return 'is-muted';
    return 'is-unknown';
}

function openDrepStatusListOverlay(titleText, dreps, returnFocus) {
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
        returnFocus,
        botContext: createWebsiteSectionBotContext('DReps', {
            title: titleText,
            count: dreps.length,
            amount_ada: dreps.reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0) / 1_000_000,
            status: titleText,
            root: 'DReps'
        })
    });
}

function closeDrepStatusListOverlay() {
    removeGovernanceMenuOverlay('governance-drep-status-overlay');
}

function createGovernanceCopyButton(value, label) {
    return window.TDSPRuntime.createCopyButton(value, label, {
        className: 'pool-copy-icon-button governance-drep-copy-button',
        bindOptions: {
            preventDefault: false,
            copiedAriaLabel: `Copied ${label}`
        }
    });
}

function openDrepActionHistoryOverlay(drep, returnFocus = null) {
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
        headerMeta: formatDrepOverlayHeaderMeta(drep),
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        botContext: createDrepBotContext(drep)
    });

    let hasRendered = false;
    const renderPayload = (payload) => {
        if (!panel.isConnected) return;
        const refreshedDrep = mergeDrepDetail(drep, payload);
        Object.assign(drep, refreshedDrep);
        updateDrepDirectoryRow(returnFocus, refreshedDrep);
        const title = document.getElementById('governance-drep-actions-title');
        if (title) title.textContent = refreshedDrep.name;
        renderDrepActionHistory(panel, payload, refreshedDrep);
        hasRendered = true;
    };

    fetchDrepVoteStatsPayload([drep])
        .then(voteStatsPayload => {
            renderPayload(createCachedDrepVoteDetailPayload(drep, voteStatsPayload));
        })
        .catch(error => {
            console.warn('Cached DRep vote stats could not be loaded', error);
        });

    loadDrepDetail(drep)
        .then(renderPayload)
        .catch(() => {
            if (!panel.isConnected || hasRendered) return;
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

function formatDrepOverlayHeaderMeta(drep, actionCount = null) {
    const power = formatCompactAdaFromLovelace(Number(drep?.votingPower) || 0);
    const parts = [`Voting Power ${power}`];
    if (Number.isFinite(Number(actionCount))) {
        parts.push(`${Number(actionCount).toLocaleString('en-US')} actions`);
    }
    return parts.join(' • ');
}

function mergeDrepDetail(drep, payload) {
    const info = payload?.info || {};
    const metadata = payload?.metadata || {};
    const refreshedVotingPower = getDrepEntryVotingPower(info);
    const hasRefreshedVotingPower = [
        info?.amount,
        info?.voting_power,
        info?.vote_power,
        info?.stake,
        info?.lovelace
    ].some(value => value !== undefined && value !== null && value !== '');
    return {
        ...drep,
        id: firstNonEmptyText(payload?.drep_id, drep?.id),
        name: extractDrepNameFromEntry(metadata)
            || extractDrepNameFromEntry(info)
            || drep?.name
            || payload?.drep_id
            || 'DRep',
        votingPower: hasRefreshedVotingPower && Number.isFinite(refreshedVotingPower)
            ? refreshedVotingPower
            : Number(drep?.votingPower) || 0,
        active: typeof info?.active === 'boolean' ? info.active : Boolean(drep?.active)
    };
}

function updateDrepDirectoryRow(row, drep) {
    if (!(row instanceof HTMLElement)) return;
    const name = row.querySelector('.governance-cc-member-hash');
    const power = row.querySelector('.governance-cc-member-stats');
    const status = row.querySelector('.governance-drep-member-status');
    if (name) name.textContent = drep.name;
    if (power) power.textContent = `Voting power: ${formatCompactAdaFromLovelace(drep.votingPower)}`;
    if (status) status.textContent = drep.active ? 'Active' : 'Inactive';
    row.classList.toggle('governance-drep-member--active', drep.active);
    row.classList.toggle('governance-drep-member--inactive', !drep.active);
    row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(drep.name);
    row.dataset.sortPower = String(Number(drep.votingPower) || 0);
    row.dataset.sortStatus = drep.active ? '1' : '0';
    row.dataset.searchText = `${drep.id || ''} ${drep.name || ''}`.trim();
    row.setAttribute('aria-label', `Show votes by ${drep.name}`);
}

function renderDrepActionHistory(container, payload, drep) {
    if (!container.isConnected) return;
    container.textContent = '';
    const voteStats = payload?.vote_stats || {};
    const actionsById = new Map((Array.isArray(voteStats.actions) ? voteStats.actions : [])
        .map(action => [String(action?.proposal_id || ''), action]));
    const registrationTime = Number(voteStats.registration_time);
    const eligibility = voteStats?.eligibility && typeof voteStats.eligibility === 'object'
        ? voteStats.eligibility
        : null;
    const proposals = getGovernanceActionsForCommitteeOverview()
        .filter(proposal => !isGovernanceActionExcludedFromDrepStats(proposal));
    const rows = proposals
        .filter(proposal => isGovernanceActionApplicableToDrep(proposal, registrationTime, eligibility))
        .map(proposal => ({ action: actionsById.get(String(proposal.proposal_id || '')) || null, proposal }))
        .sort((left, right) => (Number(right.proposal.block_time) || 0) - (Number(left.proposal.block_time) || 0));
    updateGovernanceMenuHeaderMeta(
        'governance-drep-actions-overlay',
        formatDrepOverlayHeaderMeta(drep, rows.length),
        container
    );
    updateGovernanceOverlayBotContext(
        'governance-drep-actions-overlay',
        createDrepBotContext(drep, { count: rows.length }),
        container
    );
    const rowsByParticipation = rows.map(row => ({
        ...row,
        participation: classifyGovernanceParticipation(
            Boolean(row.action),
            isExpiredGovernanceActionForCommitteeStats(row.proposal)
        )
    }));
    const votedRows = rowsByParticipation.filter(row => row.participation === 'voted');
    const notVotedRows = rowsByParticipation.filter(row => row.participation === 'not_voted');
    const activeRows = rowsByParticipation.filter(row => row.participation === 'active_not_voted');
    const voted = votedRows.length;
    const notVoted = notVotedRows.length;
    const active = activeRows.length;
    const notVotedProposals = notVotedRows.map(row => row.proposal);
    const votedProposals = votedRows.map(row => row.proposal);
    const activeProposals = activeRows.map(row => row.proposal);
    const notApplicableProposals = proposals
        .filter(proposal => !isGovernanceActionApplicableToDrep(proposal, registrationTime, eligibility));
    const notApplicable = notApplicableProposals.length;

    container.appendChild(createDrepActionHistoryChart({
        drepName: drep?.name || 'DRep',
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
        const rationaleButton = createDrepVoteRationaleButton(action, {
            proposal,
            drepName: drep?.name,
            voteChoice
        });
        if (rationaleButton) card.appendChild(rationaleButton);
        container.appendChild(card);
    });
}

function isGovernanceActionApplicableToDrep(proposal, registrationTime, eligibility = null) {
    const proposalId = String(proposal?.proposal_id || '');
    if (eligibility && Object.prototype.hasOwnProperty.call(eligibility, proposalId)) {
        return eligibility[proposalId] === 'eligible';
    }
    if (!Number.isFinite(registrationTime)) return true;
    const registrationEpoch = Math.max(Math.floor(
        ((registrationTime * 1000) - CARDANO_MAINNET_EPOCH_ZERO_MS)
            / (EPOCH_DURATION_SECONDS * 1000)
    ), 0);
    const effectiveRegistrationEpoch = registrationEpoch + 1;
    const terminalEpochs = [
        proposal?.ratified_epoch,
        proposal?.enacted_epoch,
        proposal?.expired_epoch,
        proposal?.dropped_epoch,
        proposal?.expiration
    ]
        .filter(epoch => epoch !== null && epoch !== undefined && epoch !== '')
        .map(Number)
        .filter(Number.isFinite);
    if (terminalEpochs.some(epoch => epoch <= effectiveRegistrationEpoch)) return false;

    const blockTime = Number(proposal?.block_time);
    if (!Number.isFinite(blockTime) || blockTime >= registrationTime) return true;

    const expirationEpoch = Number(proposal?.expiration);
    return Number.isFinite(expirationEpoch) && expirationEpoch > effectiveRegistrationEpoch;
}

function isGovernanceActionExcludedFromDrepStats(proposal) {
    const proposalId = String(proposal?.proposal_id || '');
    return (proposal?.dropped_epoch !== null && proposal?.dropped_epoch !== undefined)
        || DREP_STATS_EXCLUDED_PROPOSAL_IDS.has(proposalId);
}

function classifyGovernanceParticipation(hasVote, isFinal) {
    if (hasVote) return 'voted';
    return isFinal ? 'not_voted' : 'active_not_voted';
}

function createDrepActionHistoryChart(stats) {
    const {
        drepName,
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
                drepName,
                activeProposals,
                event.currentTarget,
                'Active'
            )
        }],
        onVotedClick: event => openGovernanceStatusActionsOverlay(
            drepName,
            votedProposals,
            event.currentTarget,
            'Voted'
        ),
        onNotVotedClick: event => openGovernanceStatusActionsOverlay(
            drepName,
            notVotedProposals,
            event.currentTarget,
            'Not Voted'
        ),
        extraLegendItems: [{
            label: 'Not a DRep Yet',
            detail: `${notApplicable} actions`,
            color: '#94a3b8',
            onClick: event => openGovernanceStatusActionsOverlay(
                drepName,
                notApplicableProposals,
                event.currentTarget,
                'Not a DRep Yet'
            )
        }]
    });
    return container;
}

function openConstitutionalCommitteeOverlay() {
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
        headerMeta: `${members.length.toLocaleString('en-US')} members`,
        rootTitle: 'CC Members',
        botContext: createWebsiteSectionBotContext('CC Members', {
            title: 'CC Members',
            count: members.length,
            summary: `${members.length.toLocaleString('en-US')} Constitutional Committee members`
        })
    });
    fetchCommitteeInfoPayload()
        .then(payload => {
            if (!panel.isConnected) return;
            renderConstitutionalCommitteeQuorumChart(chartPanel, payload);
            const fetchedMembers = getConstitutionalCommitteeMembers(payload);
            updateGovernanceMenuHeaderMeta(
                'governance-cc-overlay',
                `${fetchedMembers.length.toLocaleString('en-US')} members`,
                panel
            );
            updateGovernanceOverlayBotContext(
                'governance-cc-overlay',
                createWebsiteSectionBotContext('CC Members', {
                    title: 'CC Members',
                    count: fetchedMembers.length,
                    summary: `${fetchedMembers.length.toLocaleString('en-US')} Constitutional Committee members`
                }),
                panel
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
        row.className = 'governance-card governance-menu-card governance-cc-member';
        row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(member.name || `CC Member ${index + 1}`);
        if (Number.isFinite(Number(member.expiresEpoch))) {
            row.dataset.sortEpoch = String(Number(member.expiresEpoch));
        }

        const stats = document.createElement('span');
        stats.className = 'governance-card-detail governance-treasury-withdrawal-amount governance-cc-member-stats';
        stats.dataset.ccMemberIndex = String(index);
        stats.textContent = 'Voting stats loading...';

        window.TDSPRuntime?.appendUniversalTileContent?.(row, {
            title: member.name || `CC Member ${index + 1}`,
            titleClassName: 'governance-title governance-cc-member-hash',
            primaryNode: stats,
            detailItems: [
                {
                    text: member.expiresEpoch ? `expires epoch ${member.expiresEpoch}` : '',
                    className: 'governance-card-detail governance-cc-member-meta'
                }
            ]
        });
        row.classList.add('governance-cc-member-clickable');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Show governance actions for ${member.name || `CC Member ${index + 1}`}`);
        bindGovernanceMenuTrigger(row, event => openConstitutionalCommitteeActionsOverlay(member, event.currentTarget));
        bindGovernanceEntityPreload(
            row,
            `committee:${String(member.id || '').toLowerCase()}`,
            () => fetchJson(getCommitteeMemberApiUrl(member.id), { cache: 'no-store' })
        );
        container.appendChild(row);
    });

    loadConstitutionalCommitteeMemberSummaryStats(enrichedMembers, container).catch(() => {
        container.querySelectorAll('.governance-cc-member-stats').forEach(element => {
            element.textContent = 'Voting stats unavailable';
        });
    });
}

function openConstitutionalCommitteeActionsOverlay(member, returnFocus = null) {
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
        headerMeta: `${getGovernanceActionsForCommitteeMember(member).length.toLocaleString('en-US')} actions`,
        returnFocus,
        botContext: createCommitteeMemberBotContext(member, {
            count: getGovernanceActionsForCommitteeMember(member).length
        })
    });

    const renderFallback = () => loadConstitutionalCommitteeActionVotes(member, panel).catch(() => {
        if (!panel.isConnected) return;
        panel.textContent = '';
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Governance action votes could not be loaded.';
        panel.appendChild(message);
    });

    const hasCachedActionStats = hasConstitutionalCommitteeBackendActionStats(member);
    if (hasCachedActionStats) {
        renderConstitutionalCommitteeBackendActionStats(member, panel);
    }

    loadCommitteeMemberDetail(member)
        .then(payload => {
            if (!panel.isConnected) return;
            const detailedMember = normalizeConstitutionalCommitteeMember(payload?.member);
            if (!detailedMember || !hasConstitutionalCommitteeBackendActionStats(detailedMember)) {
                return renderFallback();
            }
            renderConstitutionalCommitteeBackendActionStats({
                ...detailedMember,
                sinceEpoch: member.sinceEpoch
            }, panel);
        })
        .catch(() => {
            if (!hasCachedActionStats) renderFallback();
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
    const detailedMembers = await loadConstitutionalCommitteeMembersWithActionStats(members);
    if (!container.isConnected) return;

    if (detailedMembers.some(member => hasConstitutionalCommitteeBackendActionStats(member) || hasConstitutionalCommitteeBackendStats([member]))) {
        updateConstitutionalCommitteeMemberSummaryStats(
            container,
            detailedMembers.map(getConstitutionalCommitteeMemberSummaryStats)
        );
        return;
    }

    const proposals = getGovernanceActionsForCommitteeOverview()
        .filter(isConstitutionalCommitteeMemberVoteApplicable);
    const cacheKey = getConstitutionalCommitteeMemberStatsCacheKey(detailedMembers, proposals);

    if (!proposals.length) {
        updateConstitutionalCommitteeMemberSummaryStats(container, detailedMembers.map(member => {
            const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
            return {
                voted: 0,
                notVoted: 0,
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

    const statsPromise = calculateConstitutionalCommitteeMemberSummaryStats(detailedMembers, proposals);
    committeeMemberStatsCache.set(cacheKey, statsPromise);
    const stats = await statsPromise;
    committeeMemberStatsCache.set(cacheKey, stats);
    if (!container.isConnected) return;
    updateConstitutionalCommitteeMemberSummaryStats(container, stats);
}

async function loadConstitutionalCommitteeMembersWithActionStats(members) {
    const enrichedMembers = Array.isArray(members) ? members : [];
    const results = await Promise.allSettled(enrichedMembers.map(async member => {
        if (hasConstitutionalCommitteeBackendActionStats(member)) return member;
        const detail = await loadCommitteeMemberDetail(member);
        const normalized = normalizeConstitutionalCommitteeMember(detail?.member);
        if (!normalized) return member;
        return {
            ...member,
            ...normalized,
            sinceEpoch: pickFirstNumber(normalized.sinceEpoch, member.sinceEpoch),
            name: normalized.name || member.name,
            expiresEpoch: pickFirstNumber(normalized.expiresEpoch, member.expiresEpoch)
        };
    }));

    return results.map((result, index) => result.status === 'fulfilled' ? result.value : enrichedMembers[index]);
}

function getConstitutionalCommitteeMemberSummaryStats(member) {
    if (hasConstitutionalCommitteeBackendActionStats(member)) {
        return getConstitutionalCommitteeBackendMemberSummaryStats(member);
    }
    const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
    const voteStats = normalizeConstitutionalCommitteeTileStats(member.voteStats, proposalStats);
    return {
        voted: voteStats.voted,
        notVoted: voteStats.notVoted,
        total: voteStats.total,
        open: voteStats.active,
        notApplicable: proposalStats.notApplicable,
        all: proposalStats.total
    };
}

async function calculateConstitutionalCommitteeMemberSummaryStats(members, proposals) {
    const stats = members.map(member => {
        const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
        return {
            voted: 0,
            notVoted: 0,
            total: 0,
            open: 0,
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
                const hasVote = Boolean(
                    payload && findConstitutionalCommitteeVoteForMember(payload, member)
                );
                const participation = classifyGovernanceParticipation(
                    hasVote,
                    isExpiredGovernanceActionForCommitteeStats(proposal)
                );
                if (participation === 'voted') {
                    stats[memberIndex].voted += 1;
                    stats[memberIndex].total += 1;
                } else if (participation === 'not_voted') {
                    stats[memberIndex].notVoted += 1;
                    stats[memberIndex].total += 1;
                } else {
                    stats[memberIndex].open += 1;
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
        notVoted: 0,
        total: 0,
        open: 0,
        notApplicable: proposalStats.notApplicable,
        all: proposalStats.total
    };

    getGovernanceActionsForCommitteeMember(member)
        .filter(isConstitutionalCommitteeMemberVoteApplicable)
        .forEach(proposal => {
            const actionStats = actionStatsById.get(String(proposal.proposal_id || ''));
            if (!actionStats) return;
            const participation = classifyGovernanceParticipation(
                actionStats.voted === true,
                isExpiredGovernanceActionForCommitteeStats(proposal)
            );
            if (participation === 'voted') {
                stats.voted += 1;
                stats.total += 1;
            } else if (participation === 'not_voted') {
                stats.notVoted += 1;
                stats.total += 1;
            } else {
                stats.open += 1;
            }
        });

    return stats;
}

function normalizeConstitutionalCommitteeTileStats(voteStats, proposalStats = {}) {
    const voted = Math.max(0, Number(voteStats?.voted) || 0);
    const explicitNotVoted = Number(voteStats?.notVoted);
    const applicableClosed = Number(voteStats?.applicable);
    const rawTotal = Number(voteStats?.total);
    const explicitActive = Number(voteStats?.activeNotVoted ?? voteStats?.active);
    const active = Math.max(0, Number.isFinite(explicitActive) ? explicitActive : Number(proposalStats.open) || 0);
    let notVoted = 0;

    if (Number.isFinite(explicitNotVoted)) {
        notVoted = Math.max(0, explicitNotVoted);
    } else if (Number.isFinite(applicableClosed)) {
        notVoted = Math.max(0, applicableClosed - voted);
    } else if (Number.isFinite(rawTotal)) {
        notVoted = Math.max(0, rawTotal - active - voted);
    }

    return {
        voted,
        notVoted,
        total: voted + notVoted,
        active
    };
}

function updateConstitutionalCommitteeMemberSummaryStats(container, stats) {
    stats.forEach((item, index) => {
        const element = container.querySelector(`.governance-cc-member-stats[data-cc-member-index="${index}"]`);
        if (!element) return;

        const votedCount = Math.max(0, Number(item.voted) || 0);
        const explicitNotVoted = Number(item.notVoted);
        const notVotedCount = Number.isFinite(explicitNotVoted)
            ? Math.max(0, explicitNotVoted)
            : Math.max(0, (Number(item.total) || 0) - votedCount);
        const applicableClosedTotal = votedCount + notVotedCount;

        if (!applicableClosedTotal) {
            element.textContent = `Active ${Number(item.open) || 0} • Voted 0% • Not voted 0% • Not applicable ${Number(item.notApplicable) || 0}`;
            return;
        }

        const votedPct = (votedCount / applicableClosedTotal) * 100;
        const notVotedPct = (notVotedCount / applicableClosedTotal) * 100;
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
    const completedResults = results.filter(Boolean);
    updateGovernanceOverlayBotContext(
        'governance-cc-actions-overlay',
        createCommitteeMemberBotContext(member, { count: completedResults.length }),
        container
    );
    updateConstitutionalCommitteeVoteChart(container, completedResults, member);
}

function findConstitutionalCommitteeVoteForMember(payload, member) {
    const candidates = getConstitutionalCommitteeVoteCandidateIds(member);
    const committeeVotes = payload?.votes?.committee || {};

    for (const bucket of ['yes', 'no', 'abstain', 'unknown']) {
        const votes = Array.isArray(committeeVotes[bucket]) ? committeeVotes[bucket] : [];
        const vote = votes.find(item => {
            const voterIds = [item?.voter_id, item?.voter_hex, item?.cc_hot_id, item?.cc_hot_hex]
                .map(normalizeGovernanceIdentifier)
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
    ].map(normalizeGovernanceIdentifier).filter(Boolean));
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
    const memberName = member?.name || 'CC Member';
    const eligibleResults = results
        .filter(result => isConstitutionalCommitteeMemberVoteApplicable(result.proposal))
        .map(result => ({
            ...result,
            participation: classifyGovernanceParticipation(
                Boolean(result.vote),
                isExpiredGovernanceActionForCommitteeStats(result.proposal)
            )
        }));
    const votedResults = eligibleResults.filter(result => result.participation === 'voted');
    const notVotedResults = eligibleResults.filter(result => result.participation === 'not_voted');
    const activeResults = eligibleResults.filter(result => result.participation === 'active_not_voted');
    const voted = votedResults.length;
    const notVoted = notVotedResults.length;
    const total = voted + notVoted;
    const votedPct = total > 0 ? (voted / total) * 100 : 0;
    const notVotedPct = total > 0 ? (notVoted / total) * 100 : 0;
    const proposalStats = getConstitutionalCommitteeMemberProposalStats(member);
    const votedProposals = votedResults.map(result => result.proposal);
    const notVotedProposals = notVotedResults.map(result => result.proposal);
    const activeProposals = activeResults.map(result => result.proposal);
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
            detail: `${activeProposals.length} actions`,
            color: '#60a5fa',
            onClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
                memberName,
                activeProposals,
                event.currentTarget,
                'Active'
            )
        }],
        onVotedClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
            memberName,
            votedProposals,
            event.currentTarget,
            'Voted'
        ),
        onNotVotedClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
            memberName,
            notVotedProposals,
            event.currentTarget,
            'Not Voted'
        ),
        extraLegendItems: [
            {
                label: 'Not Applicable',
                detail: `${proposalStats.notApplicable} actions`,
                color: '#94a3b8',
                onClick: isLoading ? null : event => openGovernanceStatusActionsOverlay(
                    memberName,
                    notApplicableProposals,
                    event.currentTarget,
                    'Not Applicable'
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
    const { voted, notVoted, votedPct, notVotedPct } = stats;
    const isLoading = options.isLoading === true;

    const chart = document.createElement('section');
    chart.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = options.title || 'CC vote overview';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    const donut = createUniversalPieChart([
        { key: 'voted', label: 'Voted', color: '#34d399', value: voted },
        { key: 'not-voted', label: 'Not Voted', color: '#fb7185', value: notVoted }
    ], {
        isLoading,
        showLabels: !isLoading,
        labelFormatter: segment => formatPercentage((segment.end - segment.start) / 360 * 100)
    });

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
    const proposalType = getEffectiveProposalType(proposal);
    return proposalType !== 'NewCommittee'
        && proposalType !== 'UpdateCommittee';
}

function isConstitutionalCommitteeMemberVoteApplicable(proposal) {
    const proposalType = getEffectiveProposalType(proposal);
    return isConstitutionalCommitteeVoteApplicable(proposal)
        && proposalType !== 'InfoAction'
        && proposalType !== 'NoConfidence';
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

function renderNoVotesList(container, votes, headingLabel = 'DRep votes', context = {}) {
    const title = document.createElement('strong');
    title.textContent = `${headingLabel} (${votes.length})`;

    const list = document.createElement('div');
    list.className = 'governance-no-votes-list';

    const sortedVotes = [...votes].sort((left, right) => getDrepVotePowerValue(right) - getDrepVotePowerValue(left));

    sortedVotes.forEach(vote => {
        const { row, name } = createDrepVoteRow(vote, context);
        list.appendChild(row);

        resolveDrepDisplayName(vote, name, { skipDetailLookup: true }).catch(() => {});
    });

    container.appendChild(title);
    container.appendChild(list);
}

function createDrepVoteRow(vote, context = {}) {
    const row = document.createElement('div');
    row.className = 'governance-no-vote-row governance-menu-card';
    row.dataset.sortPower = String(getDrepVotePowerValue(vote));
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

    const rationaleButton = createDrepVoteRationaleButton(vote, {
        ...context,
        drepName: getDrepPrimaryDisplayName(vote),
        voteChoice: formatVoteChoice(vote?.vote || vote?.vote_bucket)
    });
    if (rationaleButton) row.appendChild(rationaleButton);

    const drep = getDrepFromVote(vote);
    if (drep.id) {
        row.classList.add('governance-cc-member-clickable');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Show votes by ${drep.name}`);
        bindGovernanceMenuTrigger(row, event => {
            drep.name = getDrepPrimaryDisplayName(vote);
            openDrepActionHistoryOverlay(drep, event.currentTarget);
        });
    }

    return { row, name };
}

function createDrepVoteRationaleButton(vote, context = {}) {
    if (!vote || !context?.proposal?.proposal_id && !vote?.proposal_id && !vote?.proposalId && !vote?.gov_action_id) return null;
    if (!getDrepVoteIdentifier(vote)) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'governance-vote-secondary governance-rationale-read-button';
    button.textContent = 'Rationale';
    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openDrepVoteRationaleOverlay(vote, event.currentTarget, context);
    });
    return button;
}

function openDrepVoteRationaleOverlay(vote, returnFocus, context = {}) {
    const rationale = getDrepVoteRationaleText(vote);
    const content = document.createElement('div');
    content.className = 'governance-menu-card governance-vote-rationale-display';
    const proposalId = context.proposal?.proposal_id || vote?.gov_action_id || vote?.proposal_id || vote?.proposalId || '';

    addDetailRow(content, 'DRep', context.drepName || getDrepPrimaryDisplayName(vote));
    addDetailRow(content, 'Vote', context.voteChoice || formatVoteChoice(vote?.vote || vote?.vote_bucket));
    addDetailRow(content, 'Governance action', context.proposal ? getProposalTitle(context.proposal) : '');
    addDetailRow(content, 'Action ID', proposalId);
    addDetailRow(content, 'Transaction', getDrepVoteRationaleTransactionId(vote));

    const title = document.createElement('strong');
    title.textContent = 'Rationale';
    const text = document.createElement('p');
    text.className = 'governance-proposal-summary-text';
    text.textContent = rationale || 'Loading vote rationale...';
    content.append(title, text);

    createGovernanceMenuOverlay({
        id: 'governance-vote-rationale-display-overlay',
        titleId: 'governance-vote-rationale-display-title',
        titleText: 'Vote rationale',
        closeLabel: 'Close vote rationale',
        closeOverlay: closeDrepVoteRationaleOverlay,
        bodyNodes: [content],
        headerMeta: context.proposal ? getProposalMeta(context.proposal) : '',
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        botContext: context.proposal
            ? createGovernanceActionBotContext(context.proposal)
            : {
                kind: 'drep_vote_rationale',
                title: 'Vote rationale',
                summary: rationale
            }
    });

    if (!rationale) {
        loadDrepVoteRationale(vote, {
            proposalId,
            drepId: getDrepVoteIdentifier(vote),
            text,
            content
        }).catch(() => {
            if (!text.isConnected) return;
            text.textContent = 'No on-chain rationale metadata found for this DRep vote.';
        });
    }
}

function closeDrepVoteRationaleOverlay() {
    removeGovernanceMenuOverlay('governance-vote-rationale-display-overlay');
}

function getDrepVoteRationaleTransactionId(vote) {
    return vote?.tx_hash
        || vote?.txHash
        || vote?.tx_id
        || vote?.txId
        || vote?.vote_tx_hash
        || vote?.transaction_id
        || vote?.transactionId
        || '';
}

async function loadDrepVoteRationale(vote, { proposalId, drepId, text, content }) {
    if (!proposalId || !drepId) throw new Error('Missing DRep vote rationale lookup data');
    const payload = await fetchJson(getProposalDrepRationaleApiUrl(proposalId, drepId), { cache: 'no-store' });
    if (!text.isConnected) return;

    if (payload?.vote) {
        const voteRows = Array.from(content.querySelectorAll('.governance-detail-row'));
        const hasVoteRow = voteRows.some(row => row.textContent.includes('Vote'));
        if (!hasVoteRow) addDetailRow(content, 'Vote', payload.vote);
    }
    if (payload?.vote_tx_hash && !getDrepVoteRationaleTransactionId(vote)) {
        addDetailRow(content, 'Transaction', payload.vote_tx_hash);
    }

    vote.vote_tx_hash = payload?.vote_tx_hash || vote.vote_tx_hash;
    vote.tx_metadata = payload?.metadata || vote.tx_metadata;
    vote.onchain_metadata = payload?.metadata || vote.onchain_metadata;
    vote.rationale = payload?.rationale || vote.rationale;

    const rationale = getDrepVoteRationaleText(vote);
    text.textContent = rationale || 'No on-chain rationale metadata found for this DRep vote.';
}

function getDrepVoteRationaleText(vote) {
    const directCandidates = [
        vote?.rationale,
        vote?.vote_rationale,
        vote?.voteRationale,
        vote?.rationale_text,
        vote?.rationaleText,
        vote?.reason,
        vote?.metadata?.rationale,
        vote?.tx_metadata?.rationale,
        vote?.auxiliary_data?.rationale,
        vote?.onchain_metadata?.rationale,
        vote?.on_chain_metadata?.rationale,
        vote?.metadata?.['1694']?.rationale,
        vote?.tx_metadata?.['1694']?.rationale,
        vote?.auxiliary_data?.['1694']?.rationale,
        vote?.onchain_metadata?.['1694']?.rationale,
        vote?.on_chain_metadata?.['1694']?.rationale
    ];

    for (const candidate of directCandidates) {
        const text = normalizeDrepVoteRationaleValue(candidate);
        if (text) return text;
    }

    for (const root of [
        vote?.metadata,
        vote?.tx_metadata,
        vote?.auxiliary_data,
        vote?.onchain_metadata,
        vote?.on_chain_metadata,
        vote?.meta_json
    ]) {
        const text = findDrepVoteRationaleInObject(root);
        if (text) return text;
    }

    return '';
}

function findDrepVoteRationaleInObject(value, depth = 0) {
    if (!value || depth > 4 || typeof value !== 'object') return '';
    if (Object.prototype.hasOwnProperty.call(value, 'rationale')) {
        const text = normalizeDrepVoteRationaleValue(value.rationale);
        if (text) return text;
    }

    const preferredKeys = ['1694', 'metadata', 'tx_metadata', 'auxiliary_data', 'json', 'body', 'data'];
    for (const key of preferredKeys) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
        const text = findDrepVoteRationaleInObject(value[key], depth + 1);
        if (text) return text;
    }

    for (const entry of Object.values(value)) {
        const text = findDrepVoteRationaleInObject(entry, depth + 1);
        if (text) return text;
    }
    return '';
}

function normalizeDrepVoteRationaleValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return cleanGovernanceText(value.trim());
    if (Array.isArray(value)) {
        if (value.every(entry => typeof entry === 'string')) {
            return cleanGovernanceText(value.join('').trim());
        }
        return cleanGovernanceText(value.map(normalizeDrepVoteRationaleValue).filter(Boolean).join('\n').trim());
    }
    if (typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, 'text')) return normalizeDrepVoteRationaleValue(value.text);
        if (Object.prototype.hasOwnProperty.call(value, 'value')) return normalizeDrepVoteRationaleValue(value.value);
    }
    return '';
}

function getDrepFromVote(vote) {
    const id = normalizeGovernanceIdentifier(getDrepVoteIdentifier(vote));
    return {
        id,
        name: getDrepPrimaryDisplayName(vote),
        votingPower: getDrepVotePowerValue(vote),
        active: vote?.active === true || vote?.is_active === true
    };
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

    return window.TDSPRuntime.toFiniteNumber(value);
}

async function resolveDrepNameFromApi(vote, options = {}) {
    const directName = vote?.resolvedDrepName || vote?.drep_name || vote?.drepName || vote?.name;
    if (directName) return directName;

    const lookupId = normalizeGovernanceIdentifier(
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
    const infoPayload = await fetchDrepInfoPayload().catch(() => null);
    const directory = new Map();
    if (infoPayload) addDrepDirectoryEntries(directory, infoPayload);

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
    const normalizedId = normalizeGovernanceIdentifier(drepId);
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
    governanceDrepUtils.addDirectoryEntries(directory, payload);
}

function unwrapDrepEntries(payload) {
    return governanceDrepUtils.unwrapEntries(payload);
}

function extractDrepNameFromEntry(entry) {
    return governanceDrepUtils.extractNameFromEntry(entry);
}

function getDrepEntryIdentifiers(entry) {
    return governanceDrepUtils.getEntryIdentifiers(entry);
}

function normalizeGovernanceIdentifier(value) {
    return governanceDrepUtils.normalizeIdentifier(value);
}

function shortenDrepIdentifier(value) {
    return governanceDrepUtils.shortenIdentifier(value);
}

async function fetchDrepMetadataName(url) {
    const fetchUrl = getDrepMetadataFetchUrl(url);
    if (!fetchUrl) throw new Error('Unsupported DRep metadata URL');

    const payload = await fetchJson(fetchUrl);
    return extractDrepMetadataName(payload);
}

function extractDrepMetadataName(payload) {
    return governanceDrepUtils.extractMetadataName(payload);
}

function firstNonEmptyText(...values) {
    return governanceDrepUtils.firstNonEmptyText(...values);
}

function extractTextValue(value) {
    return governanceDrepUtils.extractTextValue(value);
}

function normalizeMetadataUrl(url) {
    return governanceDrepUtils.normalizeMetadataUrl(url);
}

function getDrepInfoApiUrl() {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        return `${LOCAL_DREP_DIRECTORY_PROXY_PATH}?type=directory`;
    }
    return DREP_INFO_API_URL;
}

function getDrepDetailApiUrl(drepId) {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        const params = new URLSearchParams({ drepId });
        return `${LOCAL_DREP_DETAIL_PROXY_PATH}?${params.toString()}`;
    }
    return `${DREP_DETAIL_API_BASE_URL}/${encodeURIComponent(drepId)}`;
}

function getDrepVoteStatsIds(dreps = []) {
    return [...new Set((Array.isArray(dreps) ? dreps : [])
        .flatMap(drep => getDrepEntryIdentifiers(drep))
        .map(normalizeGovernanceIdentifier)
        .filter(Boolean))]
        .slice(0, 50);
}

function getDrepVoteStatsApiUrl(dreps = []) {
    const ids = getDrepVoteStatsIds(dreps);
    const params = ids.length ? `?ids=${encodeURIComponent(ids.join(','))}` : '';
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        return `${LOCAL_DREP_VOTE_STATS_PROXY_PATH}${params}`;
    }
    return `${DREP_VOTE_STATS_API_URL}${params}`;
}

async function fetchDrepVoteStatsPayload(dreps = []) {
    const ids = getDrepVoteStatsIds(dreps);
    const cacheKey = ids.length ? ids.join('|') : 'all';
    if (!drepVoteStatsPayloadPromises.has(cacheKey)) {
        const promise = fetchJson(getDrepVoteStatsApiUrl(dreps)).catch(error => {
            drepVoteStatsPayloadPromises.delete(cacheKey);
            throw error;
        });
        drepVoteStatsPayloadPromises.set(cacheKey, promise);
    }
    return drepVoteStatsPayloadPromises.get(cacheKey);
}

function getDrepCorrelationApiUrl() {
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        return LOCAL_DREP_CORRELATION_PROXY_PATH;
    }
    return DREP_CORRELATION_API_URL;
}

async function fetchDrepCorrelationPayload() {
    if (!drepCorrelationPayloadPromise) {
        drepCorrelationPayloadPromise = fetchJson(getDrepCorrelationApiUrl()).catch(error => {
            drepCorrelationPayloadPromise = null;
            throw error;
        });
    }
    return drepCorrelationPayloadPromise;
}

function getDrepMetadataFetchUrl(url, options = {}) {
    const normalizedUrl = normalizeMetadataUrl(url);
    if (!isAllowedBrowserMetadataUrl(normalizedUrl)) return '';

    const params = new URLSearchParams({ url: normalizedUrl });
    if (options.refresh) params.set('refresh', '1');
    if (GOVERNANCE_IS_LOCAL_PREVIEW) {
        return `${LOCAL_METADATA_PROXY_PATH}?${params.toString()}`;
    }
    return `${REMOTE_METADATA_API_URL}?${params.toString()}`;
}

function isAllowedBrowserMetadataUrl(url) {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function mapBreakdownKeyToVote(key) {
    return governanceVoteData.mapBreakdownKeyToVote(key);
}

function getDrepStakeBreakdown(summary, nonVoters = {}) {
    return governanceVoteData.getDrepStakeBreakdown(summary, nonVoters);
}

const governancePieChart = window.TDSPPieChart.create({ formatPercentage });

function getPieChartSegments(items) {
    return governancePieChart.getSegments(items);
}

function getDrepVotes(payload) {
    return governanceVoteData.getDrepVotes(payload);
}

function getSpoVotes(payload) {
    return governanceVoteData.getSpoVotes(payload);
}

function getDrepNonVoterGroups(payload, drepVotes) {
    return governanceVoteData.getDrepNonVoterGroups(payload, drepVotes);
}

function getDrepVoteIdentifierCandidates(vote) {
    return governanceVoteData.getDrepVoteIdentifierCandidates(vote);
}

function createUniversalPieChart(items, options = {}) {
    return governancePieChart.createChart(items, options);
}

const governanceRichText = window.TDSPGovernanceRichText.create({
    normalizeMetadataUrl,
    normalizeImageSource
});

function cleanGovernanceText(text) {
    return governanceRichText.cleanText(text);
}

function sanitizeGovernanceMarkdown(text) {
    return governanceRichText.sanitizeMarkdown(text);
}

function appendRichText(container, text) {
    governanceRichText.appendRichText(container, text);
}

function renderMarkdown(container, markdown) {
    governanceRichText.renderMarkdown(container, markdown);
}

function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function isRenderableImageUrl(url, keyHint = '') {
    if (isImageUrl(url)) return true;
    return /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i.test(keyHint);
}

function getProposalTitle(proposal) {
    return governanceProposalDisplay.getTitle(proposal);
}

function getProposalMeta(proposal) {
    return governanceProposalDisplay.getMeta(proposal);
}

function getExpirationText(proposal) {
    return governanceProposalDisplay.getExpirationText(proposal);
}

function getVoteColorClass(percentages, source = 'drep', proposal = null) {
    return governanceProposalDisplay.getVoteColorClass(percentages, source, proposal);
}

function formatVotePercentages(percentages, label = null, summary = null, source = null) {
    return governanceProposalDisplay.formatVotePercentages(percentages, label, summary, source);
}

function getGovernanceGroupSignature(proposals) {
    return governanceProposalDisplay.getGroupSignature(proposals);
}

async function updateGovernanceCounts(groups) {
    window.TDSPRuntime.setText('gov-active-count', window.TDSPRuntime.getCollectionLength(groups.active));
    window.TDSPRuntime.setText('gov-approved-count', window.TDSPRuntime.getCollectionLength(groups.approved));
    window.TDSPRuntime.setText('gov-rejected-count', window.TDSPRuntime.getCollectionLength(groups.rejected));
    window.TDSPRuntime.setText('gov-active-ask', formatGovernanceAskAmount(groups.active));
    window.TDSPRuntime.setText('gov-approved-ask', formatGovernanceAskAmount(groups.approved));
    window.TDSPRuntime.setText('gov-rejected-ask', formatGovernanceAskAmount(groups.rejected));
    updateCatalystTreasuryFundingSummary();
    window.TDSPRuntime.setText('gov-committee-count', window.TDSPRuntime.formatCount(
        getConstitutionalCommitteeMemberCount(governanceState, groups)
    ));
    fetchCommitteeInfoPayload()
        .then(payload => {
            window.TDSPRuntime.setText('gov-committee-count', window.TDSPRuntime.formatCount(
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
            window.TDSPRuntime.setText('gov-drep-count', '0');
            window.TDSPRuntime.setText('gov-drep-total-power', 'Voting Power ₳ 0');
        }
    }

    updateNclSummaryTile();
}

function getActiveInfoActions(proposals) {
    const clockEpoch = Number(getClockEpochSnapshot()?.epoch);

    return (Array.isArray(proposals) ? proposals : []).filter(proposal => {
        if (getEffectiveProposalType(proposal) !== 'InfoAction') return false;
        if (
            proposal?.ratified_epoch != null
            || proposal?.enacted_epoch != null
            || proposal?.expired_epoch != null
            || proposal?.dropped_epoch != null
        ) return false;

        const expirationEpoch = Number(proposal?.expiration);
        return !Number.isFinite(expirationEpoch)
            || !Number.isFinite(clockEpoch)
            || clockEpoch <= expirationEpoch;
    });
}

function getDashboardDrepStats(payload) {
    const summary = payload?.drep_summary || payload?.drepSummary;
    if (!summary) return null;

    const count = Number(summary.total_count ?? summary.totalCount ?? summary.count);
    const activeCount = Number(summary.active_count ?? summary.activeCount);
    const inactiveCount = Number(summary.inactive_count ?? summary.inactiveCount);
    const totalPower = Number(summary.total_voting_power ?? summary.totalVotingPower ?? summary.total_power);
    const top10Power = Number(summary.top10_voting_power ?? summary.top10VotingPower ?? summary.top_10_voting_power);
    if (![count, activeCount, inactiveCount, totalPower].every(Number.isFinite)) return null;
    return {
        count,
        activeCount,
        inactiveCount,
        totalPower,
        top10Power: Number.isFinite(top10Power) ? top10Power : null
    };
}

function renderDrepSummaryStats(stats) {
    window.TDSPRuntime.setText('gov-drep-count', stats.count.toLocaleString('en-US'));
    window.TDSPRuntime.setText('gov-drep-total-power', `Voting Power ${window.TDSPRuntime.formatTileAdaFromLovelace(stats.totalPower, { fixedFractionDigits: 2 })}`);
    renderDrepTop10PowerTile(stats);
    window.TDSPRuntime.setText('gov-drep-top10-count', 'Voting Power');
}

function renderDrepTop10PowerTile(stats) {
    const element = document.getElementById('gov-drep-top10-power');
    if (!element || !Number.isFinite(Number(stats?.top10Power))) return;

    element.replaceChildren(document.createTextNode(window.TDSPRuntime.formatTileAdaFromLovelace(stats.top10Power, { fixedFractionDigits: 2 })));
    const totalPower = Number(stats?.totalPower);
    const top10Power = Number(stats.top10Power);
    if (!Number.isFinite(totalPower) || totalPower <= 0) return;

    const percentage = document.createElement('span');
    percentage.className = 'governance-summary-inline-percent';
    percentage.textContent = formatPercentage((top10Power / totalPower) * 100);
    element.appendChild(percentage);
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
    window.TDSPRuntime.setText('gov-committee-voted', Number.isFinite(stats?.votedPct)
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
            : getCurrentConstitutionalCommitteeParticipation(
                members,
                proposal.proposal_id,
                proposal.voteSummary,
                payload?.action_stats
            );
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

function getCurrentConstitutionalCommitteeParticipation(members, proposalId, summary, compactActionStats = null) {
    const compactStats = Array.isArray(compactActionStats)
        ? compactActionStats.find(action => String(action?.proposal_id || '') === String(proposalId || ''))
        : null;
    if (compactStats && Number(compactStats.member_entries) === members.length) {
        return {
            votes: Number(compactStats.votes) || 0,
            members: members.length
        };
    }

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
        activeNotVoted: pickFirstNumber(
            stats.activeNotVoted,
            stats.active_not_voted,
            stats.active_not_voted_count
        ),
        active: pickFirstNumber(stats.active, stats.active_count),
        applicable: pickFirstNumber(stats.applicable, stats.applicable_count),
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

function formatGovernanceAskAmount(proposals) {
    const totalAsk = Array.isArray(proposals)
        ? proposals.reduce((sum, proposal) => sum + getProposalTotalAskLovelace(proposal), 0)
        : 0;

    return totalAsk
        ? window.TDSPRuntime.formatTileAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })
        : '₳ 0';
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
        inactiveCount: baseStats.inactiveCount,
        top10Power: baseStats.top10Power
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

    const top10Power = Array.from(uniqueDreps.values())
        .map(value => Number(value.votingPower) || 0)
        .sort((left, right) => right - left)
        .slice(0, 10)
        .reduce((sum, votingPower) => sum + votingPower, 0);

    return {
        count: uniqueDreps.size,
        totalPower,
        activeCount,
        inactiveCount: uniqueDreps.size - activeCount,
        top10Power
    };
}

function getDrepEntryVotingPower(entry) {
    const value = entry?.amount
        ?? entry?.voting_power
        ?? entry?.vote_power
        ?? entry?.stake
        ?? entry?.lovelace;

    return window.TDSPRuntime.toFiniteNumber(value);
}

function formatPercentage(value) {
    return window.TDSPRuntime.formatPercentageValue(value, { fallback: value });
}

window.TDSPSpoDirectory = Object.freeze({
    load: loadSpoDirectory,
    getByPoolId: getSpoDirectoryEntry,
    createCard: createSpoDirectoryCard
});
