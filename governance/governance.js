const GOVERNANCE_IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
const governanceCardSnapshots = new WeakMap();
const DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard';
const COMPACT_DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard/compact';
const COMMITTEE_INFO_API_URL = 'https://api.tdsp.online/api/committee/directory';
const COMMITTEE_MEMBER_API_BASE_URL = 'https://api.tdsp.online/api/committee/member';
const PROPOSAL_VOTES_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_SUMMARY_API_BASE_URL = 'https://api.tdsp.online/api/proposal';


const REMOTE_METADATA_API_URL = 'https://api.tdsp.online/api/metadata';
const TREASURY_API_URL = 'https://api.tdsp.online/api/treasury';
const TREASURY_ADMINISTRATORS_API_URL = 'https://api.tdsp.online/api/treasury/administrators';
const CATALYST_BUSINESS_API_URL = 'https://api.tdsp.online/api/catalyst/businesses';
const FUNDING_RECIPIENTS_API_URL = 'https://api.tdsp.online/api/funding/recipients';
const FUNDING_OVERVIEW_API_URL = 'https://api.tdsp.online/api/funding/overview';
const CATALYST_PROPOSALS_API_URL = 'https://api.tdsp.online/api/catalyst/proposals';
const CATALYST_PILOT_2026_API_URL = 'https://api.tdsp.online/api/catalyst/pilot-2026';
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


const LOCAL_METADATA_PROXY_PATH = '/__metadata_proxy__';
const LOCAL_TREASURY_PROXY_PATH = '/__treasury_proxy__';
const LOCAL_TREASURY_ADMINISTRATORS_PROXY_PATH = '/__treasury_administrators_proxy__';
const LOCAL_CATALYST_BUSINESS_PROXY_PATH = '/__catalyst_business_proxy__';
const LOCAL_FUNDING_RECIPIENTS_PROXY_PATH = '/__funding_recipients_proxy__';
const LOCAL_FUNDING_OVERVIEW_PROXY_PATH = '/__funding_overview_proxy__';
const LOCAL_CATALYST_PROPOSALS_PROXY_PATH = '/__catalyst_proposals_proxy__';
const LOCAL_CATALYST_PILOT_2026_PROXY_PATH = '/__catalyst_pilot_2026_proxy__';
const LOCAL_CATALYST_PROPOSAL_DETAIL_PROXY_PATH = '/__catalyst_proposal_detail_proxy__';
const LOCAL_CATALYST_PROPOSAL_SUMMARY_PROXY_PATH = '/__catalyst_proposal_summary_proxy__';
const LOCAL_CIPS_PROXY_PATH = '/__cips_proxy__';
const LOCAL_CONSTITUTION_CHAT_PROXY_PATH = '/__constitution_chat_proxy__';
const LOCAL_CONSTITUTION_CHAT_FEEDBACK_PROXY_PATH = '/__constitution_chat_feedback_proxy__';
const LOCAL_CONSTITUTION_DOCUMENT_PROXY_PATH = '/__constitution_document_proxy__';

const ACTIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const EPOCH_CHANGE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EPOCH_CHANGE_REFRESH_WINDOW_MS = 60 * 60 * 1000;
const GOVERNANCE_NOTIFICATION_STORAGE_KEY = 'tdsp-governance-notification-state-v1';
const GOVERNANCE_ACTION_ALERT_YES_THRESHOLD = 67;
const GOVERNANCE_INFO_ACTION_ALERT_YES_THRESHOLD = 50;
const EPOCH_DURATION_SECONDS = 432000;
const CARDANO_MAINNET_EPOCH_ZERO_MS = Date.parse('2017-09-23T21:44:51Z');
const APPROVAL_GRACE_PERIOD_SECONDS = 300;

const treasuryAdmins = window.TDSPTreasuryAdmins || {};
const TREASURY_RECIPIENT_ADMINISTRATORS = treasuryAdmins.recipientAdministrators || Object.freeze({});
const SPO_CLOUD_PROVIDER_KEYS = new Set([
    'aws', 'azure', 'google-cloud', 'oracle-cloud', 'alibaba-cloud',
    'ibm-cloud', 'tencent-cloud', 'huawei-cloud', 'ovh', 'digitalocean',
    'netcup', 'hetzner', 'akamai', 'vultr', 'scaleway', 'contabo'
]);


let governanceRefreshTimer = null;
let dashboardRefreshPromise = null;
let dashboardRefreshedAt = 0;
let epochChangeRefreshTimer = null;
let epochChangeRefreshStartedAtMs = 0;
let governanceLanguageRefreshTimer = null;
let lastActiveRenderSignature = '';
let governanceState = null;
let governanceGroupsState = null;
let committeeInfoState = null;
const proposalVotesCache = new Map();
const proposalDetailsCache = new Map();
const committeeMemberStatsCache = new Map();


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
let catalystPilot2026Promise = null;
let catalystPilot2026State = null;
let cipDirectoryPromise = null;
let cipDirectoryState = null;
const catalystProposalDetailsCache = new Map();
let treasuryHistoryChart = null;


const fetchResponse = window.TDSPRuntime.fetchResponse;
const fetchJson = window.TDSPRuntime.fetchJson;
const formatCompactAdaFromLovelace = window.TDSPRuntime.formatCompactAdaFromLovelace;
const governanceApi = window.TDSPGovernanceApi.create({
    isLocalPreview: GOVERNANCE_IS_LOCAL_PREVIEW,
    endpoints: {
        dashboard: DASHBOARD_API_URL,
        compactDashboard: COMPACT_DASHBOARD_API_URL,
        committeeInfo: COMMITTEE_INFO_API_URL,
        committeeMemberBase: COMMITTEE_MEMBER_API_BASE_URL,
        proposalVotesBase: PROPOSAL_VOTES_API_BASE_URL,
        proposalDetailBase: PROPOSAL_DETAIL_API_BASE_URL,
        proposalSummaryBase: PROPOSAL_SUMMARY_API_BASE_URL,


        remoteMetadata: REMOTE_METADATA_API_URL,
        catalystProposals: CATALYST_PROPOSALS_API_URL,
        catalystPilot2026: CATALYST_PILOT_2026_API_URL,
        catalystProposalDetailBase: CATALYST_PROPOSAL_DETAIL_API_BASE_URL,
        catalystProposalSummaryBase: CATALYST_PROPOSAL_SUMMARY_API_BASE_URL,
        cips: CIPS_API_URL,
        localDashboard: LOCAL_DASHBOARD_PROXY_PATH,
        localCompactDashboard: LOCAL_COMPACT_DASHBOARD_PROXY_PATH,
        localCommittee: LOCAL_COMMITTEE_PROXY_PATH,
        localCommitteeMember: LOCAL_COMMITTEE_MEMBER_PROXY_PATH,
        localProposalVotes: LOCAL_PROPOSAL_VOTES_PROXY_PATH,
        localProposalDetail: LOCAL_PROPOSAL_DETAIL_PROXY_PATH,
        localProposalSummary: LOCAL_PROPOSAL_SUMMARY_PROXY_PATH,


        localMetadata: LOCAL_METADATA_PROXY_PATH,
        localCatalystProposals: LOCAL_CATALYST_PROPOSALS_PROXY_PATH,
        localCatalystPilot2026: LOCAL_CATALYST_PILOT_2026_PROXY_PATH,
        localCatalystProposalDetail: LOCAL_CATALYST_PROPOSAL_DETAIL_PROXY_PATH,
        localCatalystProposalSummary: LOCAL_CATALYST_PROPOSAL_SUMMARY_PROXY_PATH,
        localCips: LOCAL_CIPS_PROXY_PATH
    }
});
const bindGovernanceMenuTrigger = (element, openMenu) => window.TDSPRuntime.bindMenuTrigger(element, openMenu, {
    datasetKey: 'governanceMenuBound',
    errorMessage: 'Governance menu could not be opened.'
});
const governanceCopy = window.TDSPGovernanceCopy.create({
    runtime: window.TDSPRuntime
});
const governanceDetailRendering = window.TDSPDetailRendering.create({
    appendRichText,
    cleanText: cleanGovernanceText,
    createCopyButton: createGovernanceCopyButton,
    renderMarkdown,
    sanitizeMarkdown: sanitizeGovernanceMarkdown
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
const governanceDrepVotes = window.TDSPDrepVotes.create({
    addDetailRow,
    cleanText: cleanGovernanceText,
    createBotContext: createGovernanceActionBotContext,
    createMenuOverlay: createGovernanceMenuOverlay,
    fetchJson,
    formatVoteChoice,
    getDrepIdentifier: getDrepVoteIdentifier,
    getDrepName: getDrepPrimaryDisplayName,
    getProposalMeta,

    getProposalTitle,
    removeMenuOverlay: removeGovernanceMenuOverlay
});


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
    setupGovernanceLanguageRefresh();
    loadCurrentEpoch();
    const hasGovernanceDashboard = Boolean(document.getElementById('governance'));
    if (!hasGovernanceDashboard) return;

    ensureEpochCountdownCard();

    loadGovernanceActions();
    scheduleActiveRefresh();


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

function setupGovernanceLanguageRefresh() {
    if (window.TDSPGovernanceLanguageRefreshBound === true) return;
    window.TDSPGovernanceLanguageRefreshBound = true;
    window.addEventListener('tdsp-language-change', () => {
        window.clearTimeout(governanceLanguageRefreshTimer);
        governanceLanguageRefreshTimer = window.setTimeout(() => {
            proposalDetailsCache.clear();
            catalystProposalDetailsCache.clear();
            cipDirectoryPromise = null;
            catalystProposalDirectoryPromise = null;
            catalystFundDirectoryPromise = null;
            catalystBusinessPromise = null;
            fundingRecipientsPromise = null;
            fundingOverviewPromise = null;
            treasuryPromise = null;
            treasuryAdministratorsPromise = null;
            governanceState = null;
            governanceGroupsState = null;
            lastActiveRenderSignature = '';
            loadGovernanceActions().catch(() => {});
            loadCipDirectory().catch(() => {});
            loadCatalystFundDirectory().catch(() => {});
            loadTreasuryData().catch(() => {});
        }, 50);
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
        getRequestContext: getConstitutionChatRequestContext,
        renderMarkdown,
        sanitizeMarkdown: sanitizeGovernanceMarkdown
    });
    return governanceAssistant;
}

function openConstitutionAssistantOverlay(context = null, returnFocus = document.getElementById('tdspbot-open')) {
    return getGovernanceAssistant().open(context, returnFocus);
}


function openConstitutionDocumentOverlay() {
    return getGovernanceAssistant().openDocument();
}


function setupGovernanceMenuCards() {
    [
        ['gov-treasury-card', openTreasuryOverlay],
        ['gov-business-card', openBusinessOverlay],
        ['gov-catalyst-proposals-card', openCatalystFundsOverlay],
        ['gov-cips-card', openCipDirectoryOverlay],


        ['gov-committee-card', openConstitutionalCommitteeOverlay],


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
    updateTreasuryFlowTile(payload);
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

function fetchCatalystPilot2026Payload() {
    if (!catalystPilot2026Promise) {
        catalystPilot2026Promise = fetchJson(governanceApi.catalystPilot2026())
            .then(payload => {
                catalystPilot2026State = payload;
                return payload;
            })
            .catch(error => {
                catalystPilot2026Promise = null;
                throw error;
            });
    }
    return catalystPilot2026Promise;
}

function getCatalystProposalsApiUrl(options = {}) {
    return governanceApi.catalystProposals(options);
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
    return governanceApi.cips();
}

async function openCipDirectoryOverlay(returnFocus = document.activeElement) {
    return governanceCips.openDirectoryOverlay(returnFocus);
}


async function openTreasuryOverlay() {
    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    setGovernanceAutoTranslatedText(loading, 'Loading treasury data...');
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
        setGovernanceAutoTranslatedText(message, 'Treasury data could not be loaded.');
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
        setGovernanceAutoTranslatedText(empty, 'No enacted treasury withdrawals available.');
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
    setGovernanceAutoTranslatedText(title, 'Withdrawals by administrator');

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
    return governanceCatalystFormat.getProposalUsdTotals(proposals);
}

function getCatalystFundTotals(funds) {
    return governanceCatalystFormat.getFundTotals(funds);
}

function getApprovedGovernanceFundingActions() {
    const approved = Array.isArray(governanceGroupsState?.approved)
        ? governanceGroupsState.approved
        : [];
    return approved;
}

function getUnapprovedGovernanceFundingActions() {
    const active = Array.isArray(governanceGroupsState?.active)
        ? governanceGroupsState.active
        : [];
    return active.filter(proposal => getProposalTotalAskLovelace(proposal) > 0);
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

function getEstimatedTreasuryFundingUsd(proposal) {
    const directUsd = getApprovedTreasuryFundingUsd(proposal);
    if (Number.isFinite(directUsd) && directUsd > 0) return directUsd;

    const lovelace = getProposalTotalAskLovelace(proposal);
    if (!Number.isFinite(lovelace) || lovelace <= 0) return NaN;
    const ada = lovelace / 1_000_000;
    const price = getProposalAdaUsdPrice(proposal);
    return Number.isFinite(price) && price > 0 ? ada * price : NaN;
}

function getProposalAdaUsdPrice(proposal) {
    const proposalPrice = pickFirstNumber(
        proposal?.ada_usd_price,
        proposal?.ada_price_usd,
        proposal?.price_usd,
        proposal?.metadata?.ada_usd_price,
        proposal?.meta_json?.ada_usd_price,
        proposal?.treasury?.ada_usd_price,
        proposal?.funding?.ada_usd_price,
        proposal?.amounts?.ada_usd_price
    );
    if (Number.isFinite(proposalPrice) && proposalPrice > 0) return proposalPrice;

    const latestAdaPrice = Number(window.TDSPPrices?.getLatest?.()?.ada_usd);
    if (Number.isFinite(latestAdaPrice) && latestAdaPrice > 0) return latestAdaPrice;

    const visibleAdaPrice = Number(
        String(document.getElementById('ada-price')?.textContent || '')
            .replace(/[^0-9.]/g, '')
    );
    return Number.isFinite(visibleAdaPrice) && visibleAdaPrice > 0 ? visibleAdaPrice : NaN;
}

function getUnapprovedGovernanceFundingTotals(actions = getUnapprovedGovernanceFundingActions()) {
    const totals = actions.reduce((runningTotals, proposal) => {
        const lovelace = getProposalTotalAskLovelace(proposal);
        const ada = Number.isFinite(lovelace) ? lovelace / 1_000_000 : 0;
        const usd = getEstimatedTreasuryFundingUsd(proposal);
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
const governanceBusinessLinks = window.TDSPBusinessLinks.create({
    businessLogos: TREASURY_BUSINESS_LOGOS,
    businessLogosByDomain: TREASURY_BUSINESS_LOGOS_BY_DOMAIN,
    normalizeBusinessName: normalizeTreasuryBusinessName,
    openExternalWarning: openExternalSiteWarning
});
const governanceCatalystFormat = window.TDSPCatalystFormat.create({
    formatAdaAmount: formatCatalystAdaAmount,
    formatCompactAda: formatCompactAdaFromLovelace,
    formatFullAda: formatFullAdaFromLovelace
});
const governanceCatalystCharts = window.TDSPCatalystCharts.create({
    createPieChart: createUniversalPieChart,
    createStatBox: createGovernanceStatBox,
    formatCurrency: formatCatalystCurrencyAmount,
    formatFundAmount: formatCatalystFundAmount,
    formatMoney: value => governanceCatalystFormat.formatOfficialMoney(value),
    formatPercentage,
    getFundingProjects: getCatalystFundingProjects,
    getFundingStatus: getCatalystFundingStatus,
    onOpenFundingProjects: openCatalystFundingProjectsOverlay
});
const governanceActionButtons = window.TDSPActionButtons.create({
    createCatalystContext: createCatalystProposalBotContext,
    createGovernanceContext: createGovernanceActionBotContext,

    onAskBot: openConstitutionAssistantOverlay,
    onOpenCatalystSummary: openCatalystProposalSummaryOverlay,
    onOpenGovernanceSummary: openProposalSummaryOverlay,

});
const governanceBotContexts = window.TDSPBotContexts.create({
    formatCatalystFundAmount,
    formatCompactAda: formatCompactAdaFromLovelace,
    getEffectiveProposalType,
    getGovernanceStatus,
    getProposalTitle,
    getProposalTotalAsk: getProposalTotalAskLovelace,
    getSpoCloudHostingType,
    getSpoCloudServiceText,
    getSpoDisplayName,
    getTreasuryBusinessActions,
    getTreasuryBusinessWebsiteUrls,
    getTreasuryWithdrawals
});
const governanceProposalSummary = window.TDSPProposalSummary.create({
    createCatalystContext: createCatalystProposalBotContext,
    createGovernanceContext: createGovernanceActionBotContext,
    createOverlay: createGovernanceMenuOverlay,
    fetchJson,
    removeOverlay: removeGovernanceMenuOverlay
});

function normalizeCatalystTeamMemberDisplayName(value) {
    return fundingDirectory.normalizeTeamMemberDisplayName(value);
}

function normalizeTreasuryBusinessName(value) {
    return fundingDirectory.normalizeBusinessName(value);
}

function resolveTreasuryBusinessText(value) {
    return fundingDirectory.resolveBusinessText(value);
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
    setGovernanceAutoTranslatedText(loading, 'Loading Catalyst/Treasury recipients...');
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
            setGovernanceAutoTranslatedText(empty, 'No Catalyst/Treasury recipient data is available yet.');
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
        setGovernanceAutoTranslatedText(error, 'Funding recipient data could not be loaded.');
        panel.appendChild(error);
    }
}

function createCatalystFundingStatusChart(payload) {
    return governanceCatalystCharts.createFundingStatusChart(payload);
}

function createCatalystProposalFundingOverview(
    funds,
    proposals,
    businessPayload,
    approvedGovernanceActions = [],
    unapprovedGovernanceActions = [],
    overviewPayload = fundingOverviewState
) {
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
    const unapprovedTreasuryTotals = getUnapprovedGovernanceFundingTotals(unapprovedGovernanceActions);
    const totalUnapprovedTreasury = Number(unapprovedTreasuryTotals.usd) || 0;

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
            if (key === 'unapproved-governance') {
                return {
                    key,
                    label: group?.label || 'Unapproved Treasury',
                    value: Number(group?.value) || 0,
                    color: group?.color || '#fb923c',
                    currency: group?.currency || 'USD',
                    actions: unapprovedGovernanceActions,
                    adaValue: Number(group?.adaValue) || unapprovedTreasuryTotals.ada,
                    rootTitle: 'Catalyst/Treasury Funding'
                };
            }
            const field = key === 'unclaimed' ? 'not_claimed_usd' : 'claimed_usd';
            const label = key === 'unclaimed'
                ? 'Unclaimed Funds'
                : key === 'claimed'
                    ? 'Claimed Funds'
                    : group?.label;
            return createGroup(
                key,
                label || 'Claimed Funds',
                Number(group?.value) || 0,
                group?.color || (key === 'unclaimed' ? '#fb7185' : '#34d399'),
                field,
                Number(group?.adaValue) || null
            );
        }).filter(group => group.value > 0)
        : [
            createGroup('claimed', 'Claimed Funds', totalClaimed, '#34d399', 'claimed_usd'),
            createGroup('unclaimed', 'Unclaimed Funds', totalUnclaimed, '#fb7185', 'not_claimed_usd'),
            {
                key: 'approved-governance',
                label: 'Approved Treasury',
                value: totalTreasury,
                color: '#fbbf24',
                currency: 'USD',
                actions: approvedGovernanceActions,
                adaValue: treasuryTotals.ada,
                rootTitle: 'Catalyst/Treasury Funding'
            },
            {
                key: 'unapproved-governance',
                label: 'Unapproved Treasury',
                value: totalUnapprovedTreasury,
                color: '#fb923c',
                currency: 'USD',
                actions: unapprovedGovernanceActions,
                adaValue: unapprovedTreasuryTotals.ada,
                rootTitle: 'Catalyst/Treasury Funding'
            }
        ].filter(group => group.value > 0);
    if (
        totalUnapprovedTreasury > 0
        && !groups.some(group => group.key === 'unapproved-governance')
    ) {
        groups.push({
            key: 'unapproved-governance',
            label: 'Unapproved Treasury',
            value: totalUnapprovedTreasury,
            color: '#fb923c',
            currency: 'USD',
            actions: unapprovedGovernanceActions,
            adaValue: unapprovedTreasuryTotals.ada,
            rootTitle: 'Catalyst/Treasury Funding'
        });
    }
    const total = groups.reduce((sum, group) => sum + (Number(group.value) || 0), 0);
    if (total <= 0) return null;

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    setGovernanceAutoTranslatedText(title, 'Catalyst/Treasury funding');

    const projectsLabel = document.createElement('span');
    projectsLabel.className = 'governance-card-detail';
    setGovernanceAutoTranslatedText(projectsLabel, `${projects.length.toLocaleString('en-US')} funded projects`);

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
            if (segment.key === 'unapproved-governance') {
                openUnapprovedGovernanceFundingOverlay(segment.actions || [], returnFocus);
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
                if (group.key === 'unapproved-governance') {
                    openUnapprovedGovernanceFundingOverlay(group.actions || [], event.currentTarget);
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
    setGovernanceAutoTranslatedText(loading, 'Loading Catalyst and Treasury funding...');
    panel.appendChild(loading);

    let funds = [];
    let proposals = [];
    let pilotProposals = [];
    let pilotPayload = null;
    let pilotLoadError = '';
    let approvedGovernanceActions = [];
    let unapprovedGovernanceActions = [];
    let fundingChart = null;
    let renderedSignature = '';
    let directoryReady = false;
    const renderDirectory = normalizedQuery => {
        if (!directoryReady) return false;
        const teamQueries = getCatalystMultiSearchQueries(normalizedQuery);
        const allCatalystProposals = [...proposals, ...pilotProposals];
        const teamMatches = teamQueries.length
            ? allCatalystProposals.filter(proposal => matchesCatalystMultiSearch(
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
            if (approvedGovernanceActions.length || unapprovedGovernanceActions.length) {
                panel.appendChild(createGovernanceActionsFundingCard(
                    approvedGovernanceActions,
                    unapprovedGovernanceActions
                ));
            }
            if (pilotPayload?.proposal_count || pilotProposals.length) {
                panel.appendChild(createCatalystPilot2026Card(pilotPayload, pilotProposals));
            } else if (pilotLoadError) {
                panel.appendChild(createCatalystPilot2026UnavailableCard(pilotLoadError));
            }
            funds.forEach(fund => {
                panel.appendChild(createCatalystFundCard(fund));
            });
            if (!funds.length && !approvedGovernanceActions.length && !unapprovedGovernanceActions.length) {
                const empty = window.TDSPRuntime.createSmallText('No Catalyst or Treasury funding data is available yet.');
                setGovernanceAutoTranslatedText(empty, 'No Catalyst or Treasury funding data is available yet.');
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
        const [payload, proposalPayload, pilotDirectoryPayload, businessPayload, fundingOverviewPayload] = await Promise.all([
            catalystFundDirectoryState || loadCatalystFundDirectory(),
            catalystProposalDirectoryState || fetchCatalystProposalDirectoryPayload(),
            catalystPilot2026State || fetchCatalystPilot2026Payload().catch(error => ({
                __pilotError: error?.message || 'Catalyst Pilot 2026 could not be loaded.'
            })),
            catalystBusinessState || fetchCatalystBusinessPayload().catch(() => null),
            fundingOverviewState || fetchFundingOverviewPayload().catch(() => null)
        ]);
        if (!panel.isConnected) return;
        catalystBusinessState = businessPayload;
        funds = normalizeCatalystFunds(payload);
        proposals = Array.isArray(proposalPayload?.proposals)
            ? proposalPayload.proposals
            : [];
        if (pilotDirectoryPayload?.__pilotError) {
            pilotPayload = null;
            pilotProposals = [];
            pilotLoadError = pilotDirectoryPayload.__pilotError;
        } else {
            pilotPayload = pilotDirectoryPayload;
            pilotProposals = Array.isArray(pilotDirectoryPayload?.proposals)
                ? pilotDirectoryPayload.proposals
                : [];
            pilotLoadError = '';
        }
        approvedGovernanceActions = getApprovedGovernanceFundingActions();
        unapprovedGovernanceActions = getUnapprovedGovernanceFundingActions();
        const overlayTotals = getCatalystTreasuryFundingOverlayTotals(funds, approvedGovernanceActions);
        updateGovernanceOverlayBotContext(
            'governance-catalyst-funds-overlay',
            createWebsiteSectionBotContext('Catalyst/Treasury Funding', {
                title: 'Catalyst/Treasury Funding',
                count: overlayTotals.count,
                amount_usd: overlayTotals.claimed,
                amount_ada: overlayTotals.ada,
                root: 'Catalyst/Treasury Funding',
                summary: `${funds.length.toLocaleString('en-US')} funds • ${approvedGovernanceActions.length.toLocaleString('en-US')} approved treasury actions • ${unapprovedGovernanceActions.length.toLocaleString('en-US')} unapproved treasury actions`
            }),
            panel
        );
        fundingChart = createCatalystProposalFundingOverview(
            funds,
            proposals,
            businessPayload,
            approvedGovernanceActions,
            unapprovedGovernanceActions,
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
        setGovernanceAutoTranslatedText(error, 'Catalyst funds could not be loaded.');
        panel.appendChild(error);
    }
}

function normalizeCatalystFunds(payload) {
    return governanceCatalystFormat.normalizeFunds(payload);
}

function getCatalystTreasuryFundingOverlayTotals(funds, approvedGovernanceActions) {
    const treasuryTotals = getApprovedGovernanceFundingTotals(approvedGovernanceActions);
    return governanceCatalystFormat.getCombinedFundingTotals(funds, treasuryTotals);
}

function formatCatalystTreasuryFundingHeader(totals) {
    return governanceCatalystFormat.formatFundingHeader(totals);
}

function createGovernanceActionsFundingCard(approvedActions, unapprovedActions) {
    const approvedTotals = getApprovedGovernanceFundingTotals(approvedActions);
    const unapprovedTotals = getUnapprovedGovernanceFundingTotals(unapprovedActions);
    const actions = [
        ...(Array.isArray(approvedActions) ? approvedActions : []),
        ...(Array.isArray(unapprovedActions) ? unapprovedActions : [])
    ];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'governance-card governance-menu-card';
    card.dataset.searchText = [
        'governance actions',
        'approved actions',
        'approved governance actions',
        'unapproved treasury',
        'active treasury',
        'pending treasury',
        ...actions.map(getProposalTitle)
    ].filter(Boolean).join(' ');
    card.dataset.sortName = 'Governance Actions';
    card.dataset.sortAmount = String((approvedTotals.usd || 0) + (unapprovedTotals.usd || 0));
    card.dataset.overlayPinRank = '0';
    window.TDSPRuntime?.bindMenuTrigger?.(card, event => {
        openGovernanceActionsFundingOverlay(approvedActions, unapprovedActions, event.currentTarget);
    }, {
        errorMessage: 'Governance actions could not be opened.'
    });

    const approvedAmount = createCatalystFundAmountLine('', approvedTotals.usd, approvedTotals.ada, 'treasury');
    const unapprovedAmount = createCatalystFundAmountLine('', unapprovedTotals.usd, unapprovedTotals.ada, 'unapproved-treasury');
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: 'Governance Actions',
        primaryNode: approvedAmount,
        contextItems: [`${(approvedActions || []).length.toLocaleString('en-US')} approved actions`],
        detailItems: [
            unapprovedAmount,
            `${(unapprovedActions || []).length.toLocaleString('en-US')} unapproved actions`
        ]
    });
    return card;
}


function openGovernanceActionsFundingOverlay(approvedActions, unapprovedActions, returnFocus) {
    const approved = Array.isArray(approvedActions) ? approvedActions : getApprovedGovernanceFundingActions();
    const unapproved = Array.isArray(unapprovedActions) ? unapprovedActions : getUnapprovedGovernanceFundingActions();
    const proposals = [...approved, ...unapproved];
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, 'No treasury governance actions found.');
    const approvedTotals = getApprovedGovernanceFundingTotals(approved);
    const unapprovedTotals = getUnapprovedGovernanceFundingTotals(unapproved);
    createGovernanceMenuOverlay({
        id: 'governance-treasury-funding-actions-overlay',
        titleId: 'governance-treasury-funding-actions-title',
        titleText: 'Governance Actions',
        closeLabel: 'Close governance actions',
        closeOverlay: closeGovernanceActionsFundingOverlay,
        bodyNodes: [panel],
        headerMeta: `Approved ${formatCatalystCurrencyAmount(approvedTotals.usd, 'USD', true)} • Unapproved ${formatCatalystCurrencyAmount(unapprovedTotals.usd, 'USD', true)}`,
        returnFocus,
        rootTitle: 'Catalyst/Treasury Funding',
        defaultSort: 'ask-desc',
        botContext: createGovernanceActionGroupBotContext(
            'Governance Actions',
            proposals,
            {
                rootTitle: 'Catalyst/Treasury Funding'
            }
        )
    });
}

function closeGovernanceActionsFundingOverlay() {
    removeGovernanceMenuOverlay('governance-treasury-funding-actions-overlay');
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

function openUnapprovedGovernanceFundingOverlay(actions, returnFocus) {
    const proposals = Array.isArray(actions) ? actions : getUnapprovedGovernanceFundingActions();
    const panel = document.createElement('div');
    panel.className = 'governance-list governance-action-group-list';
    renderGovernanceGroup(panel, proposals, 'No unapproved treasury actions found.');
    const totals = getUnapprovedGovernanceFundingTotals(proposals);
    createGovernanceMenuOverlay({
        id: 'governance-unapproved-treasury-funding-overlay',
        titleId: 'governance-unapproved-treasury-funding-title',
        titleText: 'Unapproved Treasury',
        closeLabel: 'Close unapproved treasury actions',
        closeOverlay: closeUnapprovedGovernanceFundingOverlay,
        bodyNodes: [panel],
        headerMeta: formatCatalystTreasuryFundingHeader({
            claimed: totals.usd,
            ada: totals.ada
        }),
        returnFocus,
        rootTitle: 'Catalyst/Treasury Funding',
        defaultSort: 'ask-desc',
        botContext: createGovernanceActionGroupBotContext(
            'Unapproved Treasury',
            proposals,
            {
                status: 'active',
                rootTitle: 'Catalyst/Treasury Funding'
            }
        )
    });
}

function closeUnapprovedGovernanceFundingOverlay() {
    removeGovernanceMenuOverlay('governance-unapproved-treasury-funding-overlay');
}

function closeApprovedGovernanceFundingOverlay() {
    removeGovernanceMenuOverlay('governance-approved-treasury-funding-overlay');
}

function createCatalystFundAmountLine(label, usdValue, adaValue, tone = '') {
    if (adaValue != null && Number.isFinite(Number(adaValue))) {
        const amount = window.TDSPRuntime.createAdaUsdAmount(Number(adaValue), usdValue == null ? null : Number(usdValue));
        if (label) amount.prepend(document.createTextNode(`${label} `));
        return amount;
    }
    const row = document.createElement('span');
    row.className = 'governance-card-detail funding-recipient-amount-line';
    if (tone) row.classList.add(`funding-recipient-amount-line--${tone}`);

    const usd = document.createElement('strong');
    usd.className = 'funding-recipient-usd-value';
    usd.textContent = formatCatalystCurrencyAmount(usdValue, 'USD', true);

    if (label) row.append(document.createTextNode(`${label} `));
    row.appendChild(usd);
    if (Number(adaValue) > 0) {
        const ada = document.createElement('span');
        ada.className = 'governance-card-detail funding-recipient-ada-value';
        ada.textContent = formatCatalystAdaAmount(adaValue, true);
        row.append(document.createTextNode(' '), ada);
    }
    return row;
}

function createCatalystPilotAmountLine(adaValue) {
    const row = document.createElement('span');
    row.className = 'governance-card-detail funding-recipient-amount-line';
    const amount = document.createElement('strong');
    amount.className = 'funding-recipient-usd-value';
    amount.textContent = formatCatalystAdaAmount(adaValue, true);
    row.appendChild(amount);
    return row;
}

function createCatalystPilot2026Card(payload, proposals = []) {
    const campaign = payload?.campaign || {};
    const proposalCount = Number(payload?.proposal_count ?? proposals.length) || 0;
    const requestedAda = Number(payload?.requested_ada) || proposals.reduce(
        (sum, proposal) => sum + (Number(proposal?.amount_requested) || 0),
        0
    );
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'governance-card governance-menu-card';
    card.dataset.searchText = [
        'Catalyst Pilot',
        'Catalyst Pilot 2026',
        campaign.title,
        campaign.status,
        ...proposals.flatMap(proposal => [proposal?.title, proposal?.business, proposal?.tagline])
    ].filter(Boolean).join(' ');
    card.dataset.sortName = 'Pilot 2026';
    card.dataset.sortFund = '2026';
    card.dataset.sortAmount = String(requestedAda || 0);
    window.TDSPRuntime?.bindMenuTrigger?.(card, event => {
        openCatalystPilot2026Overlay(payload, proposals, event.currentTarget);
    }, {
        datasetKey: 'pilot2026Bound',
        errorMessage: 'Catalyst Pilot 2026 could not be opened.'
    });

    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: 'Catalyst Pilot 2026',
        primaryNode: createCatalystPilotAmountLine(requestedAda),
        contextItems: [`${proposalCount.toLocaleString('en-US')} proposals`],
        detailItems: [
            campaign.status ? `Status ${campaign.status}` : 'Current Catalyst pilot proposals'
        ]
    });
    return card;
}

function createCatalystPilot2026UnavailableCard(message) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'governance-card governance-menu-card';
    card.disabled = true;
    card.dataset.searchText = 'Catalyst Pilot 2026';
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: 'Catalyst Pilot 2026',
        primaryText: 'Unavailable',
        contextItems: ['Pilot 2026 data could not be loaded'],
        detailItems: [message]
    });
    return card;
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

    const claimedAmount = createCatalystFundAmountLine('', fund.claimed_amount, fund.claimed_ada, 'claimed');
    const unclaimedAmount = createCatalystFundAmountLine('', fund.not_claimed_amount, fund.not_claimed_ada, 'unclaimed');
    const detailItems = [
        unclaimedAmount
    ].filter(Boolean);
    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: fund.fund_name,
        primaryNode: claimedAmount,
        contextItems: [`${fund.proposal_count.toLocaleString('en-US')} proposals`],
        detailItems
    });
    return card;
}

function openCatalystPilot2026Overlay(payload, proposals, returnFocus) {
    const campaign = payload?.campaign || {};
    const list = document.createElement('div');
    list.className = 'governance-list governance-action-group-list';
    const proposalList = Array.isArray(proposals) ? proposals : [];
    proposalList.forEach(proposal => {
        list.appendChild(createCatalystProposalCard(proposal));
    });
    if (!proposalList.length) {
        const empty = window.TDSPRuntime.createSmallText('No Catalyst Pilot 2026 proposals are available yet.');
        list.appendChild(empty);
    }
    createGovernanceMenuOverlay({
        id: 'governance-catalyst-pilot-2026-overlay',
        titleId: 'governance-catalyst-pilot-2026-title',
        titleText: 'Catalyst Pilot 2026',
        closeLabel: 'Close Catalyst Pilot 2026',
        closeOverlay: closeCatalystPilot2026Overlay,
        bodyNodes: [list],
        headerMeta: `${proposalList.length.toLocaleString('en-US')} proposals • Requested ${formatCatalystAdaAmount(payload?.requested_ada, true)}`,
        returnFocus,
        rootTitle: 'Catalyst/Treasury Funding',
        defaultSort: 'name-asc',
        searchPlaceholder: 'Search proposers or team members, separated by commas',
        botContext: createWebsiteSectionBotContext('Catalyst Pilot 2026', {
            title: 'Catalyst Pilot 2026',
            count: proposalList.length,
            amount_ada: Number(payload?.requested_ada) || 0,
            summary: campaign.brief || 'Current Project Catalyst Pilot 2026 proposals'
        })
    });
}

function closeCatalystPilot2026Overlay() {
    removeGovernanceMenuOverlay('governance-catalyst-pilot-2026-overlay');
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
            `${proposals.length.toLocaleString('en-US')} proposals • Claimed Funds ${formatCatalystFundAmount(fund, 'claimed', true)} • Unclaimed Funds ${formatCatalystFundAmount(fund, 'not_claimed', true)}`,
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
    return governanceCatalystCharts.createFundFundingPayload(fund, businessPayload);
}

function createCatalystFundTotals(fund) {
    return governanceCatalystCharts.createFundTotals(fund);
}

function createCatalystCurrencyFundingStatusChart(fund, proposals = []) {
    return governanceCatalystCharts.createCurrencyFundingStatusChart(fund, proposals);
}

function formatCatalystFundAmount(fund, kind, compact = false) {
    return governanceCatalystFormat.formatFundAmount(fund, kind, compact);
}

function formatCatalystCurrencyAmount(value, currency, compact = false) {
    return governanceCatalystFormat.formatCurrencyAmount(value, currency, compact);
}

function formatCatalystUsdRate(value) {
    return governanceCatalystFormat.formatUsdRate(value);
}

function hasNumericValue(value) {
    return governanceCatalystFormat.hasNumericValue(value);
}

function formatAdaAmount(value, compact = false) {
    return governanceCatalystFormat.formatAdaAmount(value, compact);
}

function formatCatalystAdaAmount(value, compact = false) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '₳ --';
    return `₳ ${new Intl.NumberFormat('en-US', {
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 2 : 6
    }).format(amount)}`;
}


function appendCatalystMilestoneIndicator(container, proposal) {
    governanceCatalystFormat.appendMilestoneIndicator(container, proposal);
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
            formatCatalystProposalAmount(proposal, 'received') === null
                ? 'Received amount unavailable'
                : `Received ${formatCatalystProposalAmount(proposal, 'received')}`
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
    return governanceCatalystFormat.getFundNumber(value);
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
    return governanceCatalystFormat.formatFundingAmount(value, currency, compact);
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
    return governanceBusinessLinks.getWebsiteUrls(group, {
        mappedUrl,
        projectWebsites: [
            ...(Array.isArray(group?.catalystProjects) ? group.catalystProjects : [])
        ].map(project => project?.website)
    });
}

function createTreasuryBusinessWebsiteLinks(urls) {
    return governanceBusinessLinks.createWebsiteLinks(urls);
}

function createTreasuryBusinessLogo(urls, label) {
    return governanceBusinessLinks.createLogo(urls, label);
}

function createFundingRecipientAmountRow(usdValue, adaValue = null, usdPending = false, options = {}) {
    return governanceCatalystFormat.createFundingAmountRow(usdValue, adaValue, usdPending, options);
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
    governanceCopy.appendProposalIdButton(card, proposalId);
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
    addDetailRow(container, 'Received', formatCatalystProposalAmount(proposal, 'received') ?? 'Received amount unavailable');
    if (hasNumericValue(proposal.ada_usd_rate)) {
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
    return governanceCatalystCharts.createVoteChartSection(voting);
}

function formatCatalystOfficialMoney(value) {
    return governanceCatalystFormat.formatOfficialMoney(value);
}

function formatCatalystProposalAmount(proposal, kind) {
    return governanceCatalystFormat.formatProposalAmount(proposal, kind);
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
    const treasuryCandles = treasuryValues.map((close, index) => {
        const previousClose = index > 0 ? treasuryValues[index - 1] : close;
        if (!Number.isFinite(close) || !Number.isFinite(previousClose)) return null;
        return {
            open: previousClose,
            close,
            high: Math.max(previousClose, close),
            low: Math.min(previousClose, close)
        };
    });

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-treasury-history-chart';

    const title = document.createElement('strong');
    setGovernanceAutoTranslatedText(title, 'Treasury withdrawal history');
    section.appendChild(title);

    const chartFrame = document.createElement('div');
    chartFrame.className = 'governance-treasury-history-frame price-history-chart-frame is-tradingview';
    const canvas = document.createElement('canvas');
    canvas.setAttribute(
        'aria-label',
        window.TDSPI18n?.translateText?.('Treasury income, withdrawals and treasury value per epoch')
            || 'Treasury income, withdrawals and treasury value per epoch'
    );
    canvas.setAttribute('role', 'img');
    canvas.tabIndex = 0;
    chartFrame.appendChild(canvas);
    section.appendChild(chartFrame);

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text').trim() || '#f8fafc';
    const mutedColor = styles.getPropertyValue('--muted').trim() || '#94a3b8';
    const rootFontSize = Number.parseFloat(styles.fontSize) || 16;
    const axisFontSize = rootFontSize * 0.82;
    const isCompactTreasuryChart = window.matchMedia?.('(max-width: 600px)')?.matches;
    const treasuryXAxisMaxTicks = isCompactTreasuryChart ? 4 : 10;
    const tradingViewPlugin = {
        id: 'tdspTreasuryTradingViewStyle',
        beforeDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            ctx.save();
            ctx.fillStyle = 'rgba(7, 12, 11, 0.92)';
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
            ctx.restore();
        },
        afterDatasetsDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            const xScale = scales.x;
            const yScale = scales.treasury;
            if (!chartArea || !xScale || !yScale) return;
            const slotWidth = chartArea.width / Math.max(treasuryCandles.length, 1);
            const candleWidth = Math.max(4, Math.min(13, slotWidth * 0.46));

            ctx.save();
            treasuryCandles.forEach((candle, index) => {
                if (!candle) return;
                const x = xScale.getPixelForValue(index);
                const openY = yScale.getPixelForValue(candle.open);
                const closeY = yScale.getPixelForValue(candle.close);
                const highY = yScale.getPixelForValue(candle.high);
                const lowY = yScale.getPixelForValue(candle.low);
                if (![x, openY, closeY, highY, lowY].every(Number.isFinite)) return;

                const rising = candle.close >= candle.open;
                const color = rising ? '#34d399' : '#fb7185';
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
                const crispX = Math.round(x) + 0.5;

                ctx.strokeStyle = color;
                ctx.fillStyle = rising ? 'rgba(52, 211, 153, 0.78)' : 'rgba(251, 113, 133, 0.78)';
                ctx.lineWidth = 1.35;
                ctx.beginPath();
                ctx.moveTo(crispX, highY);
                ctx.lineTo(crispX, lowY);
                ctx.stroke();

                ctx.fillRect(
                    Math.round(x - candleWidth / 2),
                    Math.round(bodyTop),
                    Math.round(candleWidth),
                    Math.round(bodyHeight)
                );
                ctx.strokeRect(
                    Math.round(x - candleWidth / 2) + 0.5,
                    Math.round(bodyTop) + 0.5,
                    Math.max(Math.round(candleWidth) - 1, 1),
                    Math.max(Math.round(bodyHeight) - 1, 1)
                );
            });
            ctx.restore();
        },
        afterDraw(chart) {
            const active = chart.tooltip?.getActiveElements?.() || [];
            const point = active[0]?.element;
            const { ctx, chartArea } = chart;
            if (!point || !chartArea) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(point.x, chartArea.top);
            ctx.lineTo(point.x, chartArea.bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
            ctx.setLineDash([3, 5]);
            ctx.stroke();
            ctx.restore();
        }
    };

    treasuryHistoryChart = new ChartCtor(canvas, {
        plugins: [tradingViewPlugin],
        data: {
            labels: epochs.map(epoch => window.TDSPI18n?.translateText?.(`Epoch ${epoch}`) || `Epoch ${epoch}`),
            datasets: [
                {
                    type: 'line',
                    label: window.TDSPI18n?.translateText?.('Treasury candles') || 'Treasury candles',
                    data: treasuryValues,
                    yAxisID: 'treasury',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 0,
                    pointRadius: 0,
                    pointHitRadius: 12,
                    pointHoverRadius: 0,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 8, right: 8, bottom: 4, left: 4 }
            },
            animation: {
                duration: 650,
                easing: 'easeOutQuart'
            },
            interaction: { mode: 'index', intersect: false },
            onClick: (event, elements) => {
                const activeElement = elements[0];
                if (!activeElement || (withdrawalsByEpoch.get(epochs[activeElement.index]) || 0) <= 0) return;
                const epoch = epochs[activeElement.index];
                openTreasuryEpochActionsOverlay(epoch, withdrawals, canvas);
            },
            onHover: (event, elements) => {
                const target = event?.native?.target;
                if (!target?.style) return;
                const activeElement = elements[0];
                target.style.cursor = activeElement && (withdrawalsByEpoch.get(epochs[activeElement.index]) || 0) > 0
                    ? 'pointer'
                    : 'default';
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(8, 13, 12, 0.96)',
                    titleColor: '#f4f7f4',
                    bodyColor: '#f4f7f4',
                    borderColor: 'rgba(94, 234, 212, 0.28)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: context => {
                            const candle = treasuryCandles[context.dataIndex];
                            if (!candle) {
                                const treasuryLabel = window.TDSPI18n?.translateText?.('Treasury') || 'Treasury';
                                return `${treasuryLabel}: ${formatWholeAdaFromLovelace(context.raw)}`;
                            }
                            const openLabel = window.TDSPI18n?.translateText?.('Open') || 'Open';
                            const closeLabel = window.TDSPI18n?.translateText?.('Candle close') || 'Close';
                            return [
                                `${openLabel}: ${formatWholeAdaFromLovelace(candle.open)}`,
                                `${closeLabel}: ${formatWholeAdaFromLovelace(candle.close)}`
                            ];
                        }
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
                        maxTicksLimit: treasuryXAxisMaxTicks,
                        callback: value => {
                            const epoch = epochs[Number(value)];
                            if (!Number.isFinite(epoch)) return '';
                            if (isCompactTreasuryChart) return String(epoch);
                            return window.TDSPI18n?.translateText?.(`Epoch ${epoch}`) || `Epoch ${epoch}`;
                        },
                        font: { family: 'Poppins', size: axisFontSize }
                    },
                    grid: { display: false },
                    border: { display: false },
                    stacked: false
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
        setGovernanceAutoTranslatedText(administratorText, `Administrator: ${administrator}`);
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

function getTreasuryFlowTotals(payload, period = governanceNcl?.getPeriod?.()) {
    const periodStart = Number(period?.startEpoch);
    const periodEnd = Number(period?.endEpoch);
    const history = (Array.isArray(payload?.treasury_history) ? payload.treasury_history : [])
        .map(item => ({
            epoch: Number(item?.epoch_no),
            treasury: Number(item?.treasury)
        }))
        .filter(item => Number.isFinite(item.epoch) && Number.isFinite(item.treasury))
        .filter(item => !Number.isFinite(periodStart) || item.epoch >= periodStart - 1)
        .filter(item => !Number.isFinite(periodEnd) || item.epoch <= periodEnd)
        .sort((left, right) => left.epoch - right.epoch);
    if (history.length < 2) return null;

    const withdrawalsByEpoch = new Map();
    getTreasuryWithdrawals(payload).forEach(withdrawal => {
        const epoch = Number(withdrawal?.enacted_epoch);
        const amount = Number(withdrawal?.amount_lovelace);
        if (!Number.isFinite(epoch) || !Number.isFinite(amount) || amount <= 0) return;
        if (Number.isFinite(periodStart) && epoch < periodStart) return;
        if (Number.isFinite(periodEnd) && epoch > periodEnd) return;
        withdrawalsByEpoch.set(epoch, (withdrawalsByEpoch.get(epoch) || 0) + amount);
    });

    let totalIn = 0;
    let totalOut = 0;
    for (let index = 1; index < history.length; index += 1) {
        const current = history[index];
        const previous = history[index - 1];
        const withdrawal = withdrawalsByEpoch.get(current.epoch) || 0;
        const income = current.treasury - previous.treasury + withdrawal;
        if (Number.isFinite(income) && income > 0) totalIn += income;
        totalOut += withdrawal;
    }

    return {
        totalIn,
        totalOut,
        firstEpoch: Number.isFinite(periodStart) ? periodStart : history[0].epoch,
        lastEpoch: Number.isFinite(periodEnd) ? periodEnd : history[history.length - 1].epoch
    };
}

function updateTreasuryFlowTile(payload) {
    const flowContainer = document.getElementById('gov-treasury-flow');
    const nclContainer = document.getElementById('gov-treasury-ncl-flow');
    if (!flowContainer && !nclContainer) return;

    const totals = getTreasuryFlowTotals(payload);
    if (!totals || totals.totalIn + totals.totalOut <= 0) {
        flowContainer?.replaceChildren();
        nclContainer?.replaceChildren();
        flowContainer?.removeAttribute('title');
        nclContainer?.removeAttribute('title');
        return;
    }

    const nclValues = getNclSummaryValues();
    const limit = Math.max(0, Number(nclValues?.limit) || 0);
    const spent = Math.max(0, Number(nclValues?.spent) || 0);
    const left = Math.max(0, Number(nclValues?.balance) || 0);
    const flowBar = createTreasuryTileBar([
        {
            label: 'In',
            value: totals.totalIn,
            className: 'governance-vote-bar-fill--yes',
            labelClassName: 'governance-vote-label-item--yes'
        },
        {
            label: 'Out',
            value: totals.totalOut,
            className: 'governance-vote-bar-fill--no',
            labelClassName: 'governance-vote-label-item--no'
        }
    ], 'Treasury flow');
    const nclBar = createTreasuryTileBar([
        {
            label: 'NCL Out',
            value: spent,
            className: 'governance-vote-bar-fill--no',
            labelClassName: 'governance-vote-label-item--no'
        },
        {
            label: 'Left',
            value: left,
            className: 'treasury-flow-bar-fill--left',
            labelClassName: 'treasury-flow-label-item--left'
        }
    ], 'NCL out and left', limit || spent + left, [
        {
            label: 'Total',
            value: limit || spent + left,
            labelClassName: 'treasury-flow-label-item--total'
        }
    ]);
    flowContainer?.replaceChildren(...[flowBar].filter(Boolean));
    nclContainer?.replaceChildren(...[nclBar].filter(Boolean));
    if (flowContainer) flowContainer.title = `Treasury flow from epoch ${totals.firstEpoch} to ${totals.lastEpoch}`;
    if (nclContainer) nclContainer.title = `NCL out and left from epoch ${totals.firstEpoch} to ${totals.lastEpoch}`;
}

function createTreasuryTileBar(items, ariaPrefix, totalOverride = null, trailingItems = []) {
    const normalizedItems = items
        .map(item => ({
            ...item,
            value: Math.max(0, Number(item.value) || 0)
        }))
        .filter(item => item.value > 0);
    const total = Number.isFinite(Number(totalOverride)) && Number(totalOverride) > 0
        ? Number(totalOverride)
        : normalizedItems.reduce((sum, item) => sum + item.value, 0);
    if (!normalizedItems.length || total <= 0) return null;

    const labelFor = item => ({
        ...item,
        label: `${item.label} ${window.TDSPRuntime.formatTileAdaFromLovelace(item.value, { fixedFractionDigits: 2 })}`,
        labelClassName: `treasury-flow-label-item ${item.labelClassName || ''}`.trim()
    });
    return window.TDSPRuntime.createSegmentedBar({
        tagName: 'span',
        className: 'governance-vote-bar treasury-flow-bar-inner',
        total,
        segments: normalizedItems.map(labelFor),
        extraLabels: trailingItems.filter(item => Number(item.value) > 0).map(labelFor),
        ariaLabel: `${ariaPrefix}: ${normalizedItems.map(item => `${item.label} ${formatPercentage(Math.min(100, (item.value / total) * 100))}`).join(', ')}`
    });
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


function getNclSummaryValues() {
    return governanceNcl.getValues();
}


function updateNclEpochCountdown() {
    governanceNcl.updateEpochCountdown();
    governanceNcl.updateHeaderPeriod();
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

    // Each renderer preserves unchanged cards. Non-proposal totals can change
    // even when the active action list and its votes remain identical.
    const nextSignature = getGovernanceGroupSignature(activeProposals);
    renderGovernanceGroupIfPresent(groups.active, grouped.active, 'No active actions found.');
    renderGovernanceGroupIfPresent(groups.approved, grouped.approved, 'No approved actions found.');
    renderGovernanceGroupIfPresent(groups.rejected, grouped.rejected, 'No rejected actions found.');
    await updateGovernanceCounts(grouped);
    lastActiveRenderSignature = nextSignature;
}

function refreshDashboardTiles() {
    if (dashboardRefreshPromise) return dashboardRefreshPromise;


    committeeInfoPromise = null;
    treasuryPromise = null;
    treasuryAdministratorsPromise = null;
    catalystBusinessPromise = null;
    fundingRecipientsPromise = null;
    fundingOverviewPromise = null;
    catalystFundDirectoryPromise = null;
    catalystProposalDirectoryPromise = null;
    catalystPilot2026Promise = null;
    cipDirectoryPromise = null;


    dashboardRefreshPromise = Promise.allSettled([
        refreshActiveGovernanceGroup(),


        loadTreasuryData(),
        loadCatalystFundDirectory(),
        loadCipDirectory(),

    ]).then(results => {
        results.forEach(result => {
            if (result.status === 'rejected') console.warn('Dashboard tile refresh failed', result.reason);
        });
    }).finally(() => {
        dashboardRefreshedAt = Date.now();
        dashboardRefreshPromise = null;
    });
    return dashboardRefreshPromise;
}

function scheduleActiveRefresh() {
    if (governanceRefreshTimer !== null) return;

    governanceRefreshTimer = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        refreshDashboardTiles();
    }, ACTIVE_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - dashboardRefreshedAt >= 60000) {
            refreshDashboardTiles();
        }
    });
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
    try {
        return await fetchJson(governanceApi.compactDashboard());
    } catch {
        return fetchJson(governanceApi.dashboard());
    }
}

function checkGovernanceNotifications(proposals) {
    governanceNotifications.check(proposals);
}

function getProposalVotesApiUrl(proposalId) {
    return governanceApi.proposalVotes(proposalId);
}

function getProposalDetailApiUrl(proposalId) {
    return governanceApi.proposalDetail(proposalId);
}

function getProposalSummaryApiUrl(proposalId) {
    return governanceApi.proposalSummary(proposalId);
}


function getCatalystProposalDetailApiUrl(proposalId) {
    return governanceApi.catalystProposalDetail(proposalId);
}

function getCatalystProposalSummaryApiUrl(proposalId) {
    return governanceApi.catalystProposalSummary(proposalId);
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


function loadCommitteeMemberDetail(member) {
    const memberId = String(member?.id || '').trim().toLowerCase();
    return loadGovernanceEntityDetail(
        `committee:${memberId}`,
        () => fetchJson(getCommitteeMemberApiUrl(memberId), { cache: 'no-store' })
    );
}

function getCommitteeInfoApiUrl() {
    return governanceApi.committeeInfo();
}

function getCommitteeMemberApiUrl(memberId) {
    return governanceApi.committeeMember(memberId);
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
        || proposalType === 'ParameterChange'
        || proposalType === 'NewCommittee'
        || proposalType === 'UpdateCommittee'
        || proposalType === 'UpdateCommitteeThreshold'
        || proposalType === 'MotionNoConfidence'
        || proposalType === 'NoConfidence';
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


function renderGovernanceGroup(container, proposals, emptyMessage, options = {}) {
    if (!proposals.length) {
        if (container.dataset.emptyMessage === emptyMessage && container.children.length === 1) return;
        const empty = document.createElement('p');
        empty.className = 'small-text';
        empty.textContent = emptyMessage;
        container.replaceChildren(empty);
        container.dataset.emptyMessage = emptyMessage;
        return;
    }
    delete container.dataset.emptyMessage;
    const existing = new Map(Array.from(container.children)
        .filter(child => child.dataset.proposalId)
        .map(child => [child.dataset.proposalId, child]));
    const retained = new Set();
    let cursor = container.firstElementChild;
    proposals.forEach(proposal => {
        const signature = JSON.stringify([proposal, options, window.TDSPI18n?.getLanguage?.()]);
        let card = existing.get(proposal.proposal_id);
        if (!card || governanceCardSnapshots.get(card) !== signature) {
            const replacement = createGovernanceCard(proposal, options);
            governanceCardSnapshots.set(replacement, signature);
            if (card) {
                if (cursor === card) cursor = replacement;
                card.replaceWith(replacement);
            }
            card = replacement;
        }
        retained.add(card);
        if (card !== cursor) container.insertBefore(card, cursor);
        cursor = card.nextElementSibling;
    });
    Array.from(container.children).forEach(child => {
        if (!retained.has(child)) child.remove();
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
        setGovernanceAutoTranslatedText(votes, 'Open for live votes');
    } else {
        votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source, proposal)}`;
        setGovernanceAutoTranslatedText(votes, formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source));
    }

    window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
        title: getProposalTitle(proposal),
        contextItems: [getExpirationText(proposal)],
        detailItems: metadataItems.map(item => `${item.label} ${item.value}`)
    });
    const voteBars = createGovernanceVoteBars(proposal);
    if (voteBars) openButton.appendChild(voteBars);
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

function createGovernanceVoteBars(proposal) {
    const rows = [];
    const drepPercentages = getPercentagesFromSummary(proposal?.voteSummary, 'drep');
    if (drepPercentages) {
        rows.push({ label: 'DRep', percentages: drepPercentages });
    }
    if (usesPoolVoting(proposal)) {
        const poolPercentages = getPercentagesFromSummary(proposal?.voteSummary, 'pool');
        if (poolPercentages) {
            rows.push({ label: 'SPO', percentages: poolPercentages });
        }
    }
    if (!rows.length && proposal?.votePercentages) {
        rows.push({ label: proposal?.voteDisplay?.label || null, percentages: proposal.votePercentages });
    }
    if (!rows.length) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'governance-vote-bars';
    rows.forEach(row => {
        const bar = createGovernanceVoteBarSegment(row.percentages, row.label);
        if (bar) wrapper.appendChild(bar);
    });
    return wrapper.children.length ? wrapper : null;
}

function createGovernanceVoteBarSegment(percentages, labelText = null) {
    const yes = normalizePercentageNumber(percentages?.yes);
    const no = normalizePercentageNumber(percentages?.no);
    if (![yes, no].every(Number.isFinite)) return null;

    const total = yes + no;
    if (total <= 0) return null;

    const yesPct = (yes / total) * 100;
    const noPct = Math.max(0, 100 - yesPct);
    return window.TDSPRuntime.createSegmentedBar({
        total: 100,
        segments: [
            { value: yesPct, label: `${labelText ? `${labelText} ` : ''}Yes ${formatPercentage(yesPct)}`, className: 'governance-vote-bar-fill--yes', labelClassName: 'governance-vote-label-item governance-vote-label-item--yes' },
            { value: noPct, label: `No ${formatPercentage(noPct)}`, className: 'governance-vote-bar-fill--no', labelClassName: 'governance-vote-label-item governance-vote-label-item--no' }
        ],
        ariaLabel: `Yes ${formatPercentage(yesPct)}, No ${formatPercentage(noPct)}`
    });
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
    return governanceBotContexts.createOverlayContext(options);
}

function updateGovernanceMenuHeaderMeta(id, text, context = null) {
    const contextualOverlay = context?.closest?.('.governance-menu-overlay');
    const overlay = contextualOverlay?.dataset.governanceOverlayId === id
        ? contextualOverlay
        : getTopGovernanceMenuOverlay(id);
    const meta = overlay?.querySelector('[data-governance-menu-header-meta="true"]');
    if (meta) {
        meta.setAttribute('data-i18n-auto', '');
        meta.setAttribute('data-i18n-auto-original', text);
        meta.textContent = window.TDSPI18n?.translateText?.(text) || text;
    }
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
        headerMeta: getGovernanceActionGroupHeaderMeta(groupKey, proposals),
        rootTitle,
        botContext: createGovernanceActionGroupBotContext(titleText, proposals, {
            groupKey,
            rootTitle
        })
    });
}

function getGovernanceActionGroupHeaderMeta(groupKey, proposals) {
    const actionCount = `${proposals.length.toLocaleString('en-US')} actions`;
    if (groupKey !== 'active') return actionCount;

    const totalAsk = proposals.reduce((sum, proposal) => sum + getProposalTotalAskLovelace(proposal), 0);
    if (!Number.isFinite(totalAsk) || totalAsk <= 0) return actionCount;
    return `${actionCount} • Total ask ${formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })}`;
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
    if (treasuryState) updateTreasuryFlowTile(treasuryState);
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
    const parts = [getProposalMeta(proposal)].filter(Boolean);
    const totalAsk = getProposalTotalAskLovelace(proposal);
    if (Number.isFinite(totalAsk) && totalAsk > 0) {
        parts.push(`Total ask ${formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })}`);
    }
    return parts.join(' • ');
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
    setGovernanceAutoTranslatedText(
        type,
        window.TDSPRuntime.formatReadableLabel(getEffectiveProposalType(proposal), 'Governance')
    );

    headerContext.append(type);

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
    return governanceActionButtons.createGovernanceButtons(proposal, options);
}

function createCatalystProposalActionButtons(proposal) {
    return governanceActionButtons.createCatalystButtons(proposal);
}

function createGovernanceActionBotContext(proposal) {
    return governanceBotContexts.createGovernanceActionContext(proposal);
}


function createCatalystProposalBotContext(proposal) {
    return governanceBotContexts.createCatalystProposalContext(proposal);
}

function createCipBotContext(cip) {
    return governanceBotContexts.createCipContext(cip);
}

function createFundingRecipientBotContext(group) {
    return governanceBotContexts.createFundingRecipientContext(group);
}

function createWebsiteSectionBotContext(section, details = {}) {
    return governanceBotContexts.createWebsiteSectionContext(section, details);
}

function createGovernanceActionGroupBotContext(titleText, proposals = [], details = {}) {
    return governanceBotContexts.createGovernanceActionGroupContext(titleText, proposals, details);
}

function createTreasuryBotContext(payload = treasuryState) {
    return governanceBotContexts.createTreasuryContext(payload);
}

function createTreasuryAdministratorBotContext(group) {
    return governanceBotContexts.createTreasuryAdministratorContext(group);
}

function createCatalystFundBotContext(fund) {
    return governanceBotContexts.createCatalystFundContext(fund);
}


function createCommitteeMemberBotContext(member, details = {}) {
    return governanceBotContexts.createCommitteeMemberContext(member, details);
}

function updateGovernanceOverlayBotContext(id, context, contextElement = null) {
    const contextualOverlay = contextElement?.closest?.('.governance-menu-overlay');
    const overlay = contextualOverlay?.dataset.governanceOverlayId === id
        ? contextualOverlay
        : getTopGovernanceMenuOverlay(id);
    if (overlay && context) overlay.governanceBotContext = context;
}

function getConstitutionChatRequestContext(context) {
    return governanceBotContexts.getRequestContext(context);
}

function createGovernanceProposalActionButton(label, className, onClick) {
    return governanceActionButtons.createButton(label, className, onClick);
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
    governanceProposalSummary.open({
        proposal,
        returnFocus,
        apiUrl,
        headerMeta,
        rootTitle,
        showClose
    });
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


function addDetailRow(container, label, value, options = {}) {
    governanceDetailRendering.addDetailRow(container, label, value, options);
}

function addMarkdownDetailSection(container, label, value) {
    governanceDetailRendering.addMarkdownDetailSection(container, label, value);
}

function extractGovernanceImageCandidates(proposal) {
    return governanceRichText.extractImageCandidates([
        proposal?.meta_json,
        proposal?.meta_json?.body,
        proposal?.proposal_description
    ]);
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


function normalizeGovernanceImageSourceBase(value, keyHint = '') {
    if (!value) return '';

    const normalizedKeyHint = String(keyHint).toLowerCase();
    const rawValue = String(value);

    if (rawValue.startsWith('data:image/')) {
        return rawValue;
    }

    if (/^<svg[\s>]/i.test(rawValue)) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawValue)}`;
    }

    const normalizedUrl = normalizeMetadataUrl(rawValue);
    if (/^(https?:\/\/|ipfs:\/\/)/i.test(rawValue)) {
        const hasImageExtension = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(normalizedUrl);
        const hasImageHint = /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i.test(normalizedKeyHint);
        return hasImageExtension || hasImageHint ? normalizedUrl : '';
    }

    if (looksLikeBase64Image(rawValue, normalizedKeyHint)) {
        return `data:image/png;base64,${rawValue.replace(/\s+/g, '')}`;
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

    votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source, proposal)}`;
    setGovernanceAutoTranslatedText(votes, formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source));
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
        if (poolId && window.TDSPRuntime?.createResponsiveIdentifier) {
            id.appendChild(window.TDSPRuntime.createResponsiveIdentifier(poolId));
        } else {
            id.textContent = poolId || 'Unknown pool';
        }

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
    setGovernanceAutoTranslatedText(title, 'DRep vote overview');
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

function setGovernanceAutoTranslatedText(element, text) {
    return window.TDSPRuntime.setAutoTranslatedText(element, text);
}

function setGovernanceAutoTranslatedAriaLabel(element, text) {
    return window.TDSPRuntime.setAutoTranslatedAriaLabel(element, text);
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
    setGovernanceAutoTranslatedText(labelElement, label);

    const value = document.createElement('span');
    setGovernanceAutoTranslatedText(value, detail);

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
        setGovernanceAutoTranslatedText(title, item.label);

        const message = document.createElement('p');
        message.className = 'small-text';
        setGovernanceAutoTranslatedText(message, 'This API only provides stake totals for this bucket, not individual DRep IDs.');

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


function normalizeSpoProviderName(value) {
    const name = String(value || '').trim();
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ['aws', 'amazonaws', 'amazoneaws', 'amazonwebservices', 'amazonewebservices',
        'amazonwebservicesaws', 'amazon', 'amazoncom', 'amazoncominc'].includes(key)
        ? 'Amazon Web Services'
        : name;
}


function getSpoDisplayName(spo) {
    const name = firstNonEmptyText(spo?.name, spo?.ticker, 'No Name');
    return name.split(/\s+-\s+/, 1)[0].trim() || name;
}

function getSpoCloudServiceText(spo) {
    const compactService = (firstNonEmptyText(spo?.cloud_service) || '').split(',').map(normalizeSpoProviderName).filter(Boolean).join(', ');
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
        const name = normalizeSpoProviderName(provider?.id) === 'Amazon Web Services'
            ? 'Amazon Web Services' : normalizeSpoProviderName(provider?.name);
        const id = name === 'Amazon Web Services' ? 'aws' : firstNonEmptyText(provider?.id);
        if (id && name) providers.set(id, { id, name });
    };

    addProvider(spo?.cloud_provider);
    (Array.isArray(spo?.relays) ? spo.relays : []).forEach(relay => addProvider(relay?.provider));
    (firstNonEmptyText(spo?.cloud_service) || '')
        .split(',')
        .map(normalizeSpoProviderName)
        .filter(Boolean)
        .forEach(name => {
            const exists = [...providers.values()]
                .some(provider => provider.name.toLowerCase() === name.toLowerCase());
            if (!exists) {
                const id = name === 'Amazon Web Services' ? 'aws' : `compact:${name.toLowerCase()}`;
                providers.set(id, {
                    id,
                    name
                });
            }
        });
    return Array.from(providers.values());
}


function createGovernanceCopyButton(value, label) {
    return governanceCopy.createButton(value, label);
}


function classifyGovernanceParticipation(hasVote, isFinal) {
    if (hasVote) return 'voted';
    return isFinal ? 'not_voted' : 'active_not_voted';
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
        setGovernanceAutoTranslatedText(message, emptyMessage || 'Constitutional Committee members could not be loaded.');
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

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'governance-card-open';
        openButton.setAttribute('aria-label', `Show governance actions for ${member.name || `CC Member ${index + 1}`}`);

        const voteBar = createConstitutionalCommitteeMemberVoteBar(index);

        window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
            title: member.name || `CC Member ${index + 1}`,
            titleClassName: 'governance-title governance-cc-member-hash',
            contextItems: [
                member.expiresEpoch ? `expires epoch ${member.expiresEpoch}` : ''
            ],
            detailItems: [
                voteBar
            ]
        });
        row.classList.add('governance-cc-member-clickable');
        bindGovernanceMenuTrigger(openButton, event => openConstitutionalCommitteeActionsOverlay(member, event.currentTarget));
        bindGovernanceEntityPreload(
            openButton,
            `committee:${String(member.id || '').toLowerCase()}`,
            () => fetchJson(getCommitteeMemberApiUrl(member.id), { cache: 'no-store' })
        );
        row.appendChild(openButton);
        container.appendChild(row);
    });

    loadConstitutionalCommitteeMemberSummaryStats(enrichedMembers, container).catch(() => {
        container.querySelectorAll('.governance-cc-member-stats').forEach(element => {
            setGovernanceAutoTranslatedText(element, 'Voting stats unavailable');
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

function createConstitutionalCommitteeMemberVoteBar(index) {
    const bar = window.TDSPRuntime.createSegmentedBar({
        className: 'governance-vote-bar governance-cc-member-vote-bar is-empty',
        total: 100,
        ariaLabel: 'Voting stats loading',
        segments: [
            { value: 0, label: 'Voted 0%', className: 'governance-vote-bar-fill--yes', labelClassName: 'governance-vote-label-item governance-vote-label-item--yes' },
            { value: 0, label: 'Not voted 0%', className: 'governance-vote-bar-fill--no', labelClassName: 'governance-vote-label-item governance-vote-label-item--no' }
        ]
    });
    bar.dataset.ccMemberIndex = String(index);
    return bar;
}

function updateConstitutionalCommitteeMemberVoteBar(container, index, votedPct, notVotedPct, hasApplicableVotes) {
    const bar = container.querySelector(`.governance-cc-member-vote-bar[data-cc-member-index="${index}"]`);
    if (!bar) return;

    const normalizedVoted = hasApplicableVotes ? Math.max(0, Math.min(100, Number(votedPct) || 0)) : 0;
    const normalizedNotVoted = hasApplicableVotes ? Math.max(0, Math.min(100, Number(notVotedPct) || 0)) : 0;
    const votedLabelText = `Voted ${formatPercentage(normalizedVoted)}`;
    const notVotedLabelText = `Not voted ${formatPercentage(normalizedNotVoted)}`;

    const votedFill = bar.querySelector('.governance-vote-bar-fill--yes');
    const notVotedFill = bar.querySelector('.governance-vote-bar-fill--no');
    if (votedFill) votedFill.style.flexBasis = `${normalizedVoted}%`;
    if (notVotedFill) notVotedFill.style.flexBasis = `${normalizedNotVoted}%`;

    const votedLabel = bar.querySelector('.governance-vote-label-item--yes');
    const notVotedLabel = bar.querySelector('.governance-vote-label-item--no');
    if (votedLabel) setGovernanceAutoTranslatedText(votedLabel, votedLabelText);
    if (notVotedLabel) setGovernanceAutoTranslatedText(notVotedLabel, notVotedLabelText);

    setGovernanceAutoTranslatedAriaLabel(bar.querySelector('.governance-vote-bar-track'), `${votedLabelText}, ${notVotedLabelText}`);
    bar.classList.toggle('is-empty', !hasApplicableVotes);
}

function updateConstitutionalCommitteeMemberSummaryStats(container, stats) {
    stats.forEach((item, index) => {
        const votedCount = Math.max(0, Number(item.voted) || 0);
        const explicitNotVoted = Number(item.notVoted);
        const notVotedCount = Number.isFinite(explicitNotVoted)
            ? Math.max(0, explicitNotVoted)
            : Math.max(0, (Number(item.total) || 0) - votedCount);
        const applicableClosedTotal = votedCount + notVotedCount;

        if (!applicableClosedTotal) {
            updateConstitutionalCommitteeMemberVoteBar(container, index, 0, 0, false);
            return;
        }

        const votedPct = (votedCount / applicableClosedTotal) * 100;
        const notVotedPct = (notVotedCount / applicableClosedTotal) * 100;
        updateConstitutionalCommitteeMemberVoteBar(container, index, votedPct, notVotedPct, true);
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
    setGovernanceAutoTranslatedText(title, options.title || 'CC vote overview');

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

    const rationaleButton = governanceDrepVotes.createRationaleButton(vote, {
        ...context,
        drepName: getDrepPrimaryDisplayName(vote),
        voteChoice: formatVoteChoice(vote?.vote || vote?.vote_bucket)
    });
    if (rationaleButton) row.appendChild(rationaleButton);


    return { row, name };
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

async function resolveDrepNameFromApi(vote) {
    return vote?.resolvedDrepName || vote?.drep_name || vote?.drepName || vote?.name || null;
}


function normalizeGovernanceIdentifier(value) {
    return governanceDrepUtils.normalizeIdentifier(value);
}


function firstNonEmptyText(...values) {
    return governanceDrepUtils.firstNonEmptyText(...values);
}


function normalizeMetadataUrl(url) {
    return governanceDrepUtils.normalizeMetadataUrl(url);
}


function mapBreakdownKeyToVote(key) {
    return governanceVoteData.mapBreakdownKeyToVote(key);
}

function getDrepStakeBreakdown(summary, nonVoters = {}) {
    return governanceVoteData.getDrepStakeBreakdown(summary, nonVoters);
}

const governancePieChart = window.TDSPPieChart.create({ formatPercentage });


function getDrepVotes(payload) {
    return governanceVoteData.getDrepVotes(payload);
}

function getSpoVotes(payload) {
    return governanceVoteData.getSpoVotes(payload);
}

function getDrepNonVoterGroups(payload, drepVotes) {
    return governanceVoteData.getDrepNonVoterGroups(payload, drepVotes);
}


function createUniversalPieChart(items, options = {}) {
    return governancePieChart.createChart(items, options);
}

const governanceRichText = window.TDSPGovernanceRichText.create({
    normalizeMetadataUrl,
    normalizeImageSource: normalizeGovernanceImageSourceBase,
    looksLikeBase64Image
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


function formatPercentage(value) {
    return window.TDSPRuntime.formatPercentageValue(value, { fallback: value });
}
