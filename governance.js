const DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard';
const COMPACT_DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard/compact';
const COMMITTEE_INFO_API_URL = 'https://api.tdsp.online/api/committee';
const PROPOSAL_VOTES_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const PROPOSAL_SUMMARY_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const DREP_METADATA_API_URL = 'https://api.tdsp.online/api/dreps/metadata';
const DREP_INFO_API_URL = 'https://api.tdsp.online/api/dreps/info';
const DREP_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/drep';
const SPO_DIRECTORY_API_URL = 'https://api.tdsp.online/api/spos';
const REMOTE_METADATA_API_URL = 'https://api.tdsp.online/api/metadata';
const TREASURY_API_URL = 'https://api.tdsp.online/api/treasury';
const CONSTITUTION_CHAT_API_URL = 'https://api.tdsp.online/api/constitution/chat';
const LOCAL_DASHBOARD_PROXY_PATH = '/__dashboard_proxy__';
const LOCAL_COMPACT_DASHBOARD_PROXY_PATH = '/__dashboard_compact_proxy__';
const LOCAL_COMMITTEE_PROXY_PATH = '/__committee_proxy__';
const LOCAL_PROPOSAL_VOTES_PROXY_PATH = '/__proposal_votes_proxy__';
const LOCAL_PROPOSAL_DETAIL_PROXY_PATH = '/__proposal_detail_proxy__';
const LOCAL_PROPOSAL_SUMMARY_PROXY_PATH = '/__proposal_summary_proxy__';
const LOCAL_DREP_DIRECTORY_PROXY_PATH = '/__drep_directory_proxy__';
const LOCAL_DREP_DETAIL_PROXY_PATH = '/__drep_detail_proxy__';
const LOCAL_SPO_DIRECTORY_PROXY_PATH = '/__spo_directory_proxy__';
const LOCAL_METADATA_PROXY_PATH = '/__metadata_proxy__';
const LOCAL_TREASURY_PROXY_PATH = '/__treasury_proxy__';
const LOCAL_CONSTITUTION_CHAT_PROXY_PATH = '/__constitution_chat_proxy__';
const GOVERNANCE_MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const ACTIVE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const EPOCH_DURATION_SECONDS = 432000;
const CARDANO_MAINNET_EPOCH_ZERO_MS = Date.parse('2017-09-23T21:44:51Z');
const APPROVAL_GRACE_PERIOD_SECONDS = 300;
const TREASURY_NET_CHANGE_LIMIT_ADA = 350_000_000;
const TREASURY_NET_CHANGE_LIMIT_LOVELACE = TREASURY_NET_CHANGE_LIMIT_ADA * 1_000_000;
const TREASURY_BUDGET_YEAR_START_EPOCH = 604;
const TREASURY_BUDGET_YEAR_EPOCHS = 73;
const TREASURY_RECIPIENT_ADMINISTRATORS = Object.freeze({
    stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr: 'Intersect Treasury Reserve Smart Contract',
    stake17x3n2krrld46qms4f4hzqqxzjgaf59u3fecvl6eh8scmaacjqmvjw: 'Harmonic Laboratories',
    stake1790c5a0h3qwkxquehkdg746ccaa3hdfzgp7ckx6wzdpp7lq6ysdg0: 'Blink Labs',
    stake17x2x5cv4nlwptph8kxvnyw93pp2sp54dk54dpfp2ax7fkggaj3ty4: 'Stablecoin DeFi Liquidity Interim Committee',
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
    stake178ndhlcfy30t38z0tql64fpg8ply93r37xrgvdagfpsz5nsttyvhp: 'Amaru 2026 contingency multisig'
});
const TREASURY_ADMINISTRATOR_COLORS = Object.freeze([
    '#34d399', '#60a5fa', '#fbbf24', '#fb7185', '#2dd4bf',
    '#f97316', '#a78bfa', '#22c55e', '#38bdf8', '#eab308',
    '#f43f5e', '#14b8a6', '#818cf8', '#84cc16', '#f59e0b'
]);
const SPO_CLOUD_PROVIDER_KEYS = new Set([
    'aws', 'azure', 'google-cloud', 'oracle-cloud', 'alibaba-cloud',
    'ibm-cloud', 'tencent-cloud', 'huawei-cloud', 'ovh', 'digitalocean',
    'hetzner', 'akamai', 'vultr', 'scaleway', 'contabo'
]);
let governanceRefreshTimer = null;
let epochCountdownTimer = null;
let epochEndsAtMs = null;
let currentEpochNumber = null;
let lastActiveRenderSignature = '';
let governanceState = null;
let governanceGroupsState = null;
let committeeInfoState = null;
let governanceOverlaySequence = 0;
const proposalVotesCache = new Map();
const proposalDetailsCache = new Map();
const committeeMemberStatsCache = new Map();
const drepMetadataCache = new Map();
let drepDirectoryPromise = null;
let drepInfoPromise = null;
let drepStatsPromise = null;
let spoDirectoryPromise = null;
let spoDirectoryState = null;
let committeeInfoPromise = null;
let treasuryPromise = null;
let treasuryState = null;
let treasuryHistoryChart = null;
let governanceMeshPromise = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    setupConstitutionChat();
    setupGovernanceMenuKeyboard();
    removeDrepPowerSplitCard();
    ensureEpochCountdownCard();
    setupGovernanceSummaryActionCards();
    setupConstitutionalCommitteeCard();
    setupDrepDirectoryCard();
    setupSpoDirectoryCard();
    setupTreasuryCard();
    loadCurrentEpoch();
    loadGovernanceActions();
    loadDrepDirectory().catch(() => {});
    loadSpoDirectory().catch(() => {});
    loadTreasuryData().catch(() => {});
}

function setupConstitutionChat() {
    const form = document.getElementById('constitution-chat-form');
    const input = document.getElementById('constitution-chat-question');
    const messages = document.getElementById('constitution-chat-messages');
    const submit = document.getElementById('constitution-chat-submit');
    const status = document.getElementById('constitution-chat-status');
    if (!form || !input || !messages || !submit || !status) return;

    const resizeInput = () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
    };
    input.addEventListener('input', resizeInput);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const question = input.value.replace(/\s+/g, ' ').trim();
        if (!question || submit.disabled) return;

        const empty = messages.querySelector('.constitution-chat-empty');
        if (empty) empty.remove();
        appendConstitutionChatMessage(messages, question, 'question');
        input.value = '';
        resizeInput();
        submit.disabled = true;
        input.disabled = true;
        status.textContent = 'Consulting the Constitution...';

        try {
            const response = await fetch(getConstitutionChatApiUrl(), {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ question })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error || `Constitution assistant returned ${response.status}`);
            }
            appendConstitutionChatMessage(messages, payload.answer, 'answer');
            status.textContent = payload.cached ? 'Answer loaded from the secure cache.' : '';
        } catch (error) {
            appendConstitutionChatMessage(
                messages,
                error instanceof Error
                    ? error.message
                    : 'The Constitution assistant is temporarily unavailable.',
                'error'
            );
            status.textContent = '';
        } finally {
            submit.disabled = false;
            input.disabled = false;
            input.focus();
        }
    });
}

function getConstitutionChatApiUrl() {
    return shouldUseLocalDashboardProxy()
        ? LOCAL_CONSTITUTION_CHAT_PROXY_PATH
        : CONSTITUTION_CHAT_API_URL;
}

function appendConstitutionChatMessage(container, text, type) {
    const message = document.createElement('div');
    message.className = `constitution-chat-message constitution-chat-message-${type}`;
    const label = document.createElement('strong');
    label.textContent = type === 'question' ? 'You' : type === 'answer' ? 'Governance assistant' : 'Unavailable';
    const body = document.createElement('p');
    body.textContent = String(text || '');
    message.append(label, body);
    container.appendChild(message);

    while (container.children.length > 20) {
        container.firstElementChild?.remove();
    }
    container.scrollTop = container.scrollHeight;
}

function setupTreasuryCard() {
    const card = document.getElementById('gov-treasury-card');
    bindGovernanceMenuTrigger(card, openTreasuryOverlay);
}

async function loadTreasuryData() {
    const payload = await fetchTreasuryPayload();
    treasuryState = payload;
    const treasuryLovelace = getTreasuryLovelace(payload);
    if (!Number.isFinite(treasuryLovelace)) throw new Error('Treasury amount is unavailable');

    setText('gov-treasury-amount', formatCompactAdaFromLovelace(treasuryLovelace, { fixedFractionDigits: 2 }));
    const latestIncome = getTreasuryIncomeLovelace(payload);
    const latestEpoch = getTreasuryEpoch(payload);
    setText('gov-treasury-epoch', `Treasury Epoch ${latestEpoch ?? '--'}`);
    setText(
        'gov-treasury-income',
        Number.isFinite(latestIncome)
            ? `Income ${formatCompactAdaFromLovelace(latestIncome, { fixedFractionDigits: 2 })}`
            : 'Income -- ADA'
    );
}

function fetchTreasuryPayload() {
    if (!treasuryPromise) {
        const url = shouldUseLocalDashboardProxy() ? LOCAL_TREASURY_PROXY_PATH : TREASURY_API_URL;
        treasuryPromise = fetchJson(url).catch(error => {
            treasuryPromise = null;
            throw error;
        });
    }
    return treasuryPromise;
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
        headerMeta: treasuryState ? getTreasuryHeaderAmount(treasuryState) : 'Loading...'
    });

    try {
        const payload = treasuryState || await fetchTreasuryPayload();
        treasuryState = payload;
        if (!content.isConnected) return;
        renderTreasuryDetails(content, payload);
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

function renderTreasuryDetails(container, payload) {
    container.textContent = '';
    addDetailRow(container, 'Updated', formatTreasuryTimestamp(payload?.updated_at));

    const treasuryWithdrawals = getTreasuryWithdrawals(payload);
    const chart = createTreasuryHistoryChart(payload, treasuryWithdrawals);
    if (chart) container.appendChild(chart);

    if (!treasuryWithdrawals.length) {
        const empty = document.createElement('p');
        empty.className = 'small-text';
        empty.textContent = 'No enacted treasury withdrawals available.';
        container.appendChild(empty);
        return;
    }

    container.appendChild(createTreasuryAdministratorChart(treasuryWithdrawals));
}

function createTreasuryAdministratorChart(withdrawals) {
    const groups = getTreasuryAdministratorGroups(withdrawals);
    const total = groups.reduce((sum, group) => sum + group.value, 0);
    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel';

    const title = document.createElement('strong');
    title.textContent = 'Withdrawals by administrator';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    layout.appendChild(createUniversalPieChart(groups, {
        labelFormatter: segment => (
            ((segment.end - segment.start) / 360) >= 0.02
                ? formatCompactAdaFromLovelace(segment.value)
                : ''
        ),
        onSegmentClick: (segment, returnFocus) => openTreasuryAdministratorWithdrawalsOverlay(segment, returnFocus)
    }));

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        const percentage = total > 0 ? (group.value / total) * 100 : 0;
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${group.withdrawals.length.toLocaleString('en-US')} withdrawals • ${formatCompactAdaFromLovelace(group.value)} • ${formatPercentage(percentage)}`,
            color: group.color,
            onClick: event => openTreasuryAdministratorWithdrawalsOverlay(group, event.currentTarget)
        }));
    });

    layout.appendChild(legend);
    section.appendChild(title);
    section.appendChild(layout);
    return section;
}

function getTreasuryAdministratorGroups(withdrawals) {
    const groups = new Map();
    withdrawals.forEach(withdrawal => {
        const address = String(withdrawal?.stake_address || '');
        const recipientAdministrator = TREASURY_RECIPIENT_ADMINISTRATORS[address] || 'Unknown administrator';
        const administrator = recipientAdministrator.startsWith('Amaru')
            ? 'Amaru'
            : recipientAdministrator;
        const group = groups.get(administrator) || {
            key: administrator,
            label: administrator,
            value: 0,
            withdrawals: []
        };
        group.value += Number(withdrawal?.amount_lovelace) || 0;
        group.withdrawals.push(withdrawal);
        groups.set(administrator, group);
    });

    return [...groups.values()]
        .sort((left, right) => right.value - left.value)
        .map((group, index) => ({
            ...group,
            color: TREASURY_ADMINISTRATOR_COLORS[index % TREASURY_ADMINISTRATOR_COLORS.length]
        }));
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
        headerMeta: `${group.withdrawals.length.toLocaleString('en-US')} withdrawals • ${formatCompactAdaFromLovelace(group.value)}`,
        overlayClass: 'governance-action-detail-overlay',
        returnFocus
    });
}

function closeTreasuryAdministratorWithdrawalsOverlay() {
    removeGovernanceMenuOverlay('governance-treasury-administrator-overlay');
}

function createTreasuryHistoryChart(payload, withdrawals) {
    if (typeof Chart !== 'function' || !withdrawals.length) return null;

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

    treasuryHistoryChart = new Chart(canvas, {
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
        returnFocus
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
    if (proposal) return proposal;

    return normalizeGovernanceProposal({
        proposal_id: actionId,
        proposal_type: 'TreasuryWithdrawals',
        enacted_epoch: Number(epoch) || null,
        meta_json: { body: { title: withdrawal?.title || 'Conway treasury withdrawal' } }
    });
}

function getTreasuryWithdrawals(payload) {
    return (Array.isArray(payload?.treasury_withdrawals) ? payload.treasury_withdrawals : [])
        .map(withdrawal => ({
            action_id: withdrawal?.action_id || null,
            title: withdrawal?.title || 'Conway treasury withdrawal',
            enacted_epoch: Number(withdrawal?.enacted_epoch) || null,
            amount_lovelace: String(withdrawal?.amount_lovelace || '0'),
            stake_address: withdrawal?.stake_address || null
        }))
        .slice(0, 200);
}

function createTreasuryWithdrawalCard(withdrawal) {
    const proposal = getTreasuryGovernanceProposal(withdrawal);
    const card = document.createElement(proposal ? 'button' : 'div');
    card.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card';
    card.dataset.sortAmount = String(withdrawal?.amount_lovelace || '0');
    if (Number.isFinite(Number(withdrawal?.enacted_epoch))) {
        card.dataset.sortEpoch = String(Number(withdrawal.enacted_epoch));
    }
    if (proposal) {
        card.type = 'button';
        card.classList.add('governance-treasury-withdrawal-card--clickable');
        card.addEventListener('click', event => {
            event.stopPropagation();
            openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
        });
    }

    const title = document.createElement('strong');
    title.className = 'governance-title';
    title.textContent = cleanGovernanceText(withdrawal?.title || 'Conway treasury withdrawal');
    card.appendChild(title);

    const amount = document.createElement('span');
    amount.className = 'governance-card-detail governance-treasury-withdrawal-amount';
    amount.textContent = formatFullAdaFromLovelace(withdrawal?.amount_lovelace);
    card.appendChild(amount);

    const epoch = document.createElement('span');
    epoch.className = 'governance-card-detail';
    epoch.textContent = `Enacted epoch ${Number(withdrawal?.enacted_epoch) || '--'}`;
    card.appendChild(epoch);

    const address = String(withdrawal?.stake_address || '');
    if (address) {
        const administrator = TREASURY_RECIPIENT_ADMINISTRATORS[address];
        if (administrator) {
            const administratorLine = document.createElement('span');
            administratorLine.className = 'governance-card-detail';
            administratorLine.textContent = `Administrator: ${administrator}`;
            card.appendChild(administratorLine);
        }

        const addressLine = document.createElement('span');
        addressLine.className = 'governance-card-detail governance-drep-id-line';

        const addressText = document.createElement('span');
        addressText.className = 'governance-drep-id';
        addressText.textContent = shortenGovernanceAddress(address);
        addressLine.appendChild(addressText);
        addressLine.appendChild(createGovernanceCopyButton(address, 'recipient address'));
        card.appendChild(addressLine);
    }

    return card;
}

function shortenGovernanceAddress(address) {
    const value = String(address || '').trim();
    if (value.length <= 34) return value;
    return `${value.slice(0, 20)}...${value.slice(-10)}`;
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
        : '-- ADA';
}

function formatWholeAdaFromLovelace(value) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return '-- ADA';
    return `${(lovelace / 1_000_000).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })} ADA`;
}

function formatFullAdaFromLovelace(value) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return '';
    return `${(lovelace / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 6 })} ADA`;
}

function formatTreasuryTimestamp(value) {
    const timestamp = Date.parse(value || '');
    if (!Number.isFinite(timestamp)) return '';
    return new Date(timestamp).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function setupGovernanceMenuKeyboard() {
    document.removeEventListener('keydown', handleGovernanceMenuEscape);
    document.addEventListener('keydown', handleGovernanceMenuEscape);
}

function handleGovernanceMenuEscape(event) {
    if (event.key !== 'Escape') return;
    const overlays = document.querySelectorAll('.governance-menu-overlay');
    const topOverlay = overlays[overlays.length - 1];
    if (topOverlay?.governanceCloseOnEscape === false) return;
    if (typeof topOverlay?.governanceCloseOverlay === 'function') {
        topOverlay.governanceCloseOverlay();
    }
}

function setupDrepDirectoryCard() {
    const card = document.getElementById('gov-drep-card');
    bindGovernanceMenuTrigger(card, openDrepDirectoryOverlay);
}

function setupSpoDirectoryCard() {
    const card = document.getElementById('gov-spo-card');
    bindGovernanceMenuTrigger(card, openSpoDirectoryOverlay);
}

function setupConstitutionalCommitteeCard() {
    const card = document.getElementById('gov-committee-card');
    bindGovernanceMenuTrigger(card, openConstitutionalCommitteeOverlay);
}

function setupGovernanceSummaryActionCards() {
    [
        { id: 'gov-active-card', groupKey: 'active', title: 'Active Governance Actions', tileTitle: 'Governance Actions', emptyMessage: 'No active actions found.' },
        { id: 'gov-approved-card', groupKey: 'approved', title: 'Approved Governance Actions', tileTitle: 'Approved Actions', emptyMessage: 'No approved actions found.' },
        { id: 'gov-rejected-card', groupKey: 'rejected', title: 'Rejected Governance Actions', tileTitle: 'Rejected Actions', emptyMessage: 'No rejected actions found.' },
        { id: 'gov-info-card', groupKey: 'info', title: 'Active Info Actions', tileTitle: 'Info Actions', emptyMessage: 'No active info actions found.' }
    ].forEach(config => {
        const card = document.getElementById(config.id);
        const open = () => openGovernanceActionGroupOverlay(
            config.groupKey,
            config.title,
            config.emptyMessage,
            config.tileTitle
        );
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
    const compactUrl = shouldUseLocalDashboardProxy()
        ? LOCAL_COMPACT_DASHBOARD_PROXY_PATH
        : COMPACT_DASHBOARD_API_URL;
    const fullUrl = shouldUseLocalDashboardProxy()
        ? LOCAL_DASHBOARD_PROXY_PATH
        : DASHBOARD_API_URL;

    try {
        return await fetchJson(compactUrl);
    } catch {
        return fetchJson(fullUrl);
    }
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

function getProposalDetailApiUrl(proposalId) {
    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_DETAIL_PROXY_PATH}?${params.toString()}`;
    }

    return `${PROPOSAL_DETAIL_API_BASE_URL}/${encodeURIComponent(proposalId)}`;
}

function getProposalSummaryApiUrl(proposalId) {
    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_SUMMARY_PROXY_PATH}?${params.toString()}`;
    }
    return `${PROPOSAL_SUMMARY_API_BASE_URL}/${encodeURIComponent(proposalId)}/summary`;
}

function updateEpochDisplayFromDashboardPayload(payload) {
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
    normalized.proposal_index = coerceNullableNumber(
        proposal?.proposal_index ?? proposal?.proposalIndex ?? proposal?.tx_index ?? proposal?.action_index
    );
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

function usesPoolVoting(proposal) {
    return proposal?.proposal_type === 'HardForkInitiation'
        || proposal?.proposal_type === 'ParameterChange';
}

function getGovernanceStatus(proposal) {
    if (meetsGovernanceApprovalThreshold(proposal)) return 'approved';
    if (proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return 'rejected';
    if (proposal.ratified_epoch !== null || proposal.enacted_epoch !== null) return 'approved';
    if (proposal?.proposal_type === 'InfoAction') return 'info';
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
    const card = document.createElement('div');
    card.className = 'governance-card governance-menu-card';
    card.dataset.proposalId = proposal.proposal_id;
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
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'governance-card-open';
    openButton.setAttribute('aria-label', `Open ${getProposalTitle(proposal)}`);
    const handleClick = options.onClick || (event => {
        openGovernanceOverlay(proposal, { returnFocus: event.currentTarget });
    });
    openButton.addEventListener('click', event => {
        event.stopPropagation();
        handleClick(event);
    });

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

    openButton.appendChild(title);
    openButton.appendChild(expiration);
    metadataItems.forEach(item => {
        const detail = document.createElement('span');
        detail.className = 'governance-card-detail';
        detail.textContent = `${item.label} ${item.value}`;
        openButton.appendChild(detail);
    });
    if (shouldShowVotePercentages(proposal)) openButton.appendChild(votes);
    card.appendChild(openButton);

    if (isGovernanceProposalOpenForVoting(proposal)) {
        card.appendChild(createGovernanceProposalActionButtons(proposal));
    }

    return card;
}

function appendGovernanceDialogHeader(dialog, title, close, leadingNodes = [], meta = null, back = null) {
    const header = document.createElement('header');
    header.className = 'overlay-dialog-header';

    const copy = document.createElement('div');
    copy.className = 'overlay-dialog-header-copy';
    leadingNodes.forEach(node => copy.appendChild(node));
    copy.appendChild(title);
    if (meta) copy.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'overlay-dialog-header-actions';
    if (back) actions.appendChild(back);
    actions.appendChild(close);

    header.appendChild(copy);
    header.appendChild(actions);
    dialog.appendChild(header);
}

function appendGovernanceDialogBody(dialog, ...nodes) {
    const body = document.createElement('div');
    body.className = 'overlay-dialog-body';
    nodes.forEach(node => body.appendChild(node));
    dialog.appendChild(body);
    return body;
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
        returnFocus = document.activeElement,
        rootTitle = titleText
    } = options;

    const previousTopOverlay = getTopGovernanceMenuOverlay();
    governanceOverlaySequence += 1;
    const instanceId = `${id}-${governanceOverlaySequence}`;
    const overlay = document.createElement('div');
    overlay.className = `governance-overlay governance-menu-overlay ${overlayClass}`.trim();
    overlay.id = instanceId;
    overlay.dataset.governanceOverlayId = id;
    overlay.style.zIndex = String(getNextGovernanceOverlayZIndex());
    overlay.governanceReturnFocus = returnFocus;
    overlay.governanceCloseOverlay = closeOverlay;
    overlay.governanceRootOverlay = previousTopOverlay?.governanceRootOverlay || overlay;
    overlay.governanceRootTitle = previousTopOverlay?.governanceRootTitle || rootTitle;
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = `governance-dialog ${dialogClass}`.trim();
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', `${titleId}-${governanceOverlaySequence}`);

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', closeLabel);
    close.title = closeLabel;
    close.textContent = '<';
    close.addEventListener('click', closeOverlay);

    const back = document.createElement('button');
    back.className = 'governance-back-to-root';
    back.type = 'button';
    back.textContent = '<<';
    back.setAttribute('aria-label', `Back to ${overlay.governanceRootTitle}`);
    back.title = `Back to ${overlay.governanceRootTitle}`;
    back.addEventListener('click', () => returnToGovernanceRootOverlay(overlay));

    const title = document.createElement(titleTag);
    title.id = `${titleId}-${governanceOverlaySequence}`;
    if (titleTag !== 'h2') title.className = 'governance-drep-title';
    title.textContent = titleText;

    const meta = document.createElement('span');
    meta.className = 'governance-menu-header-meta';
    meta.dataset.governanceMenuHeaderMeta = 'true';
    meta.textContent = headerMeta;

    appendGovernanceDialogHeader(dialog, title, close, leadingNodes, meta, back);
    const body = appendGovernanceDialogBody(dialog, ...bodyNodes);
    installOverlaySearch(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    syncGovernanceMenuOverlayAccessibility();
    close.focus();

    return { overlay, dialog, close, title, meta };
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

function getTopGovernanceMenuOverlay(id = '') {
    const selector = id
        ? `.governance-menu-overlay[data-governance-overlay-id="${CSS.escape(id)}"]`
        : '.governance-menu-overlay';
    const overlays = Array.from(document.querySelectorAll(selector));
    return overlays.reduce((top, overlay) => {
        if (!top) return overlay;
        const overlayZIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10) || 0;
        const topZIndex = Number.parseInt(getComputedStyle(top).zIndex, 10) || 0;
        return overlayZIndex >= topZIndex ? overlay : top;
    }, null);
}

function returnToGovernanceRootOverlay(sourceOverlay) {
    const rootOverlay = sourceOverlay?.governanceRootOverlay;
    if (!rootOverlay?.isConnected) return;

    if (sourceOverlay === rootOverlay) {
        const closeRootOverlay = rootOverlay.governanceCloseOverlay;
        if (typeof closeRootOverlay === 'function') closeRootOverlay();
        if (rootOverlay.isConnected) rootOverlay.remove();
        syncGovernanceMenuOverlayAccessibility();
        return;
    }

    let topOverlay = getTopGovernanceMenuOverlay();
    while (topOverlay && topOverlay !== rootOverlay) {
        const closeOverlay = topOverlay.governanceCloseOverlay;
        if (typeof closeOverlay === 'function') closeOverlay();
        if (topOverlay.isConnected) topOverlay.remove();
        topOverlay = getTopGovernanceMenuOverlay();
    }

    syncGovernanceMenuOverlayAccessibility();
    const rootClose = rootOverlay.querySelector('.governance-close');
    if (rootClose) rootClose.focus();
}

function getNextGovernanceOverlayZIndex() {
    const currentHighest = Array.from(document.querySelectorAll('.governance-menu-overlay'))
        .reduce((highest, overlay) => {
            const zIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10);
            return Number.isFinite(zIndex) ? Math.max(highest, zIndex) : highest;
        }, 3000);
    return currentHighest + 100;
}

function syncGovernanceMenuOverlayAccessibility() {
    const overlays = Array.from(document.querySelectorAll('.governance-menu-overlay'));
    let topOverlay = null;
    let topZIndex = Number.NEGATIVE_INFINITY;

    overlays.forEach(overlay => {
        const dialog = overlay.querySelector('.governance-dialog');
        if (dialog) dialog.setAttribute('aria-modal', 'false');
        const zIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10);
        if (Number.isFinite(zIndex) && zIndex >= topZIndex) {
            topOverlay = overlay;
            topZIndex = zIndex;
        }
    });

    const topDialog = topOverlay?.querySelector('.governance-dialog');
    if (topDialog) topDialog.setAttribute('aria-modal', 'true');
}

function openGovernanceActionGroupOverlay(groupKey, titleText, emptyMessage, rootTitle = titleText) {
    const groupedProposals = governanceGroupsState?.[groupKey]
        || groupGovernanceProposals(getGovernanceProposalsFromDashboardPayload(governanceState || {}))[groupKey]
        || [];
    const proposals = groupKey === 'info'
        ? getActiveInfoActions(groupedProposals)
        : groupedProposals;
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
        headerMeta: `${proposals.length.toLocaleString('en-US')} actions`,
        rootTitle
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
        returnFocus
    });
}

function closeGovernanceStatusActionsOverlay() {
    removeGovernanceMenuOverlay('governance-status-actions-overlay');
}

function updateTreasuryBudgetBar() {
    const usedThisYear = getTreasuryBudgetUsedThisYear();
    const remaining = Math.max(TREASURY_NET_CHANGE_LIMIT_LOVELACE - usedThisYear, 0);
    const activeAskTotal = getActiveTreasuryProposalAskTotal();
    const afterTotalSpend = remaining - activeAskTotal;

    setBudgetBarItem('gov-budget-limit', 'NCL', formatCompactAdaFromLovelace(TREASURY_NET_CHANGE_LIMIT_LOVELACE, { fixedFractionDigits: 2 }));
    setBudgetBarItem('gov-budget-used', 'Spend', formatCompactAdaFromLovelace(usedThisYear, { fixedFractionDigits: 2 }));
    setBudgetBarItem(
        'gov-budget-remaining',
        'Balance',
        formatCompactAdaFromLovelace(remaining, { fixedFractionDigits: 2 }),
        false,
        getBudgetAmountTone(remaining)
    );
    setBudgetBarItem(
        'gov-budget-after-spend',
        'Net',
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
        returnFocus: options.returnFocus
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

function createGovernanceProposalActionButtons(proposal) {
    const actions = document.createElement('div');
    actions.className = 'governance-action-buttons';
    actions.appendChild(createGovernanceProposalActionButton(
        'Summary',
        'governance-summary-button',
        (event) => openProposalSummaryOverlay(proposal, event.currentTarget)
    ));
    if (isGovernanceProposalOpenForVoting(proposal)) {
        actions.appendChild(createGovernanceProposalActionButton(
            'Vote as DRep',
            'governance-detail-vote-button',
            (event) => openGovernanceVoteOverlay(proposal, event.currentTarget)
        ));
    }
    return actions;
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

function openProposalSummaryOverlay(proposal, returnFocus) {
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
        headerMeta: formatProposalType(proposal?.proposal_type),
        overlayClass: 'governance-action-detail-overlay',
        returnFocus,
        rootTitle: getProposalTitle(proposal)
    });

    loadProposalSummary(proposal, content).catch(() => {
        if (!content.isConnected) return;
        renderProposalSummaryMessage(content, 'The AI summary could not be loaded.');
    });
}

function closeProposalSummaryOverlay() {
    removeGovernanceMenuOverlay('governance-proposal-summary-overlay');
}

async function loadProposalSummary(proposal, container, attempt = 0) {
    const payload = await fetchJson(getProposalSummaryApiUrl(proposal?.proposal_id));
    if (!container.isConnected) return;

    if (payload?.status === 'pending') {
        renderProposalSummaryMessage(container, 'This summary is being generated by the local AI...');
        if (attempt < 24) {
            window.setTimeout(() => {
                if (!container.isConnected) return;
                loadProposalSummary(proposal, container, attempt + 1).catch(() => {});
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
    addDetailRow(container, 'Action ID', proposal.proposal_id);
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
        rootTitle: getProposalTitle(proposal)
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
        if (!extensions.includes(95) || !drep?.dRepIDCip105 || !drep?.publicKeyHash) {
            throw new Error('This wallet did not provide CIP-95 DRep access. No transaction was built.');
        }

        status.textContent = 'Verifying DRep registration and current vote...';
        const [drepPayload, votesPayload] = await Promise.all([
            fetchJson(getDrepDetailApiUrl(drep.dRepIDCip105)),
            fetchProposalVotesPayload(latestProposal.proposal_id)
        ]);
        const drepInfo = drepPayload?.info;
        if (!drepInfo || drepInfo.drep_status !== 'registered') {
            throw new Error('The connected wallet does not represent a registered DRep in the cached Koios data. No transaction was built.');
        }
        if (!votesPayload?.votes?.dreps) {
            throw new Error('The current DRep votes could not be verified. No transaction was built.');
        }

        const existingVote = findExistingDrepVote(votesPayload, drep);
        renderGovernanceVoteReview(container, {
            proposal: latestProposal,
            voteKind,
            wallet,
            walletName: walletInfo.name,
            drep,
            actionRef,
            existingVote,
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
    const drepId = String(drep?.dRepIDCip105 || '').toLowerCase();
    const drepHash = String(drep?.publicKeyHash || '').toLowerCase();

    for (const key of ['yes', 'no', 'abstain', 'unknown']) {
        const votes = Array.isArray(buckets[key]) ? buckets[key] : [];
        const match = votes.find(vote => (
            String(vote?.voter_id || vote?.drep_id || '').toLowerCase() === drepId
            || String(vote?.voter_hex || vote?.hex || '').toLowerCase() === drepHash
        ));
        if (match) return formatVoteChoice(match.vote || key);
    }
    return null;
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

    const warning = document.createElement('p');
    warning.className = 'governance-vote-review-warning';
    const isSameVote = context.existingVote === context.voteKind;
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
        submit.addEventListener('click', () => submitGovernanceVote(container, context, submit));
        container.appendChild(submit);
    }
    appendGovernanceVoteChangeButton(container, context.proposal);
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
        const unsignedTx = await txBuilder
            .vote(
                { type: 'DRep', drepId: context.drep.dRepIDCip105 },
                context.actionRef,
                { voteKind: context.voteKind }
            )
            .selectUtxosFrom(utxos)
            .changeAddress(changeAddress)
            .complete();

        status.textContent = 'Check the governance action, vote and fee in your wallet before signing.';
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
    return createUniversalPieChart(breakdown, {
        labelFormatter: segment => formatPercentage((segment.end - segment.start) / 360 * 100)
    });
}

function createVoteLegendItem(item, drepVotes) {
    const interactive = ['no', 'not-voted', 'abstain', 'always-abstain', 'always-no-confidence', 'yes'].includes(item.key);
    const element = createGovernanceStatBox({
        label: item.label,
        detail: formatVoteLegendDetail(item, drepVotes),
        color: item.color,
        statusClass: item.key === 'not-voted' ? 'is-not-voted' : '',
        onClick: interactive ? event => openDrepVotesOverlay(item, drepVotes, event.currentTarget) : null
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

function openDrepVotesOverlay(item, drepVotes, returnFocus) {
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
        overlayClass: 'governance-nested-overlay',
        returnFocus
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
        headerMeta: spoDirectoryState
            ? `${spoDirectoryState.count.toLocaleString('en-US')} SPOs`
            : 'Loading SPOs...'
    });

    loadSpoDirectory().then(payload => {
        if (!panel.isConnected) return;
        renderSpoDirectory(panel, payload.spos);
        updateGovernanceMenuHeaderMeta(
            'governance-spo-directory-overlay',
            `${payload.count.toLocaleString('en-US')} SPOs`,
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

function renderSpoDirectory(container, spos) {
    container.replaceChildren();
    if (!spos.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No registered SPOs are available.';
        container.appendChild(message);
        return;
    }

    container.appendChild(createSpoCloudStatusChart(spos, container));

    const fragment = document.createDocumentFragment();
    spos.forEach((spo, index) => {
        const row = document.createElement('div');
        row.className = 'governance-cc-member governance-menu-card governance-cc-member-clickable governance-spo-directory-card';
        row.dataset.searchText = `${spo.name || ''} ${spo.ticker || ''} ${spo.pool_id || ''}`.trim();
        row.dataset.sortName = normalizeOverlaySearchText(getSpoDisplayName(spo));
        row.dataset.sortAmount = String(Number(spo.delegated_lovelace) || 0);
        row.dataset.sortDelegators = String(Number(spo.delegator_count) || 0);
        const cloudHostingType = getSpoCloudHostingType(spo);
        row.dataset.sortCloudSpo = cloudHostingType === 'cloud-spo' ? '1' : '0';
        row.dataset.sortSpo = cloudHostingType === 'spo' ? '1' : '0';
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Show ${getSpoDisplayName(spo)} stake pool details`);

        const number = document.createElement('strong');
        number.textContent = String(index + 1);

        const copy = document.createElement('div');
        copy.className = 'governance-drep-member-copy';
        const name = document.createElement('span');
        name.className = 'governance-cc-member-hash';
        name.textContent = getSpoDisplayName(spo);

        const cloudService = document.createElement('span');
        cloudService.className = 'governance-cc-member-meta';
        cloudService.textContent = `Cloud Service: ${getSpoCloudServiceText(spo)}`;

        const delegated = document.createElement('span');
        delegated.className = 'governance-cc-member-stats';
        delegated.textContent = `Delegation: ${formatCompactAdaFromLovelace(spo.delegated_lovelace)}`;

        const delegators = document.createElement('span');
        delegators.className = 'governance-cc-member-meta';
        delegators.textContent = `Delegators: ${Number(spo.delegator_count || 0).toLocaleString('en-US')}`;

        const idLine = createSpoPoolIdLine(spo.pool_id);
        copy.append(name, cloudService, delegated, delegators, idLine);
        row.append(number, copy, createSpoHostingIcon(cloudHostingType));
        bindGovernanceMenuTrigger(row, event => openSpoDetailOverlay(spo, event.currentTarget));
        fragment.appendChild(row);
    });
    container.appendChild(fragment);
}

function createSpoCloudStatusChart(spos, directory) {
    const counts = spos.reduce((result, spo) => {
        result[getSpoCloudHostingType(spo)] += 1;
        return result;
    }, { 'cloud-spo': 0, spo: 0 });
    const groups = [
        { key: 'cloud-spo', label: 'Cloud SPO', color: '#f87171', value: counts['cloud-spo'] },
        { key: 'spo', label: 'SPO', color: '#34d399', value: counts.spo }
    ];

    const section = document.createElement('section');
    section.className = 'governance-vote-chart governance-chart-panel governance-drep-status-chart';

    const title = document.createElement('strong');
    title.textContent = 'SPO Hosting';

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';
    const chart = createUniversalPieChart(groups, {
        labelFormatter: segment => formatPercentage((segment.value / spos.length) * 100)
    });

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';
    groups.forEach(group => {
        const percentage = spos.length ? (group.value / spos.length) * 100 : 0;
        legend.appendChild(createGovernanceStatBox({
            label: group.label,
            detail: `${group.value.toLocaleString('en-US')} SPOs • ${formatPercentage(percentage)}`,
            color: group.color,
            onClick: () => applySpoCloudSort(directory, `${group.key}-first`)
        }));
    });

    layout.append(chart, legend);
    section.append(title, layout);
    return section;
}

function applySpoCloudSort(directory, mode) {
    const body = directory?.closest('.overlay-dialog-body');
    if (!body) return;

    const cards = getOverlaySearchCards(body);
    sortOverlayCards(body, cards, mode);

    const sort = body.querySelector('.overlay-sort-select');
    if (!sort || !Array.from(sort.options).some(option => option.value === mode)) return;
    sort.value = mode;
    sort.dispatchEvent(new Event('change', { bubbles: true }));
}

function getSpoCloudHostingType(spo) {
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
    renderSpoDetails(content, spo);

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
        rootTitle: 'SPOs'
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
        ['Cloud Service', getSpoCloudServiceText(spo)],
        ['Pledge', formatFullAdaFromLovelace(spo.pledge_lovelace)],
        ['Fixed cost', formatFullAdaFromLovelace(spo.fixed_cost_lovelace)],
        ['Margin', formatSpoMargin(spo.margin)]
    ].forEach(([label, value]) => {
        const card = document.createElement('div');
        card.className = 'governance-spo-detail-stat governance-menu-card';
        const title = document.createElement('strong');
        title.textContent = label;
        const detail = document.createElement('span');
        detail.textContent = value || '--';
        card.append(title, detail);
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
    id.className = 'governance-cc-member-meta governance-drep-id';
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
    const ticker = firstNonEmptyText(spo?.ticker);
    return ticker && ticker.toLowerCase() !== name.toLowerCase() ? `${name} - ${ticker}` : name;
}

function getSpoCloudServiceText(spo) {
    const providerNames = getSpoCloudProviders(spo).map(provider => provider.name);
    return providerNames.length ? providerNames.join(', ') : 'Not identified';
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
    return Array.from(providers.values());
}

function formatSpoMargin(value) {
    const margin = Number(value);
    return Number.isFinite(margin) ? formatPercentage(margin * 100) : '--';
}

async function loadSpoDirectory() {
    if (!spoDirectoryPromise) {
        spoDirectoryPromise = fetchJson(getSpoDirectoryApiUrl())
            .then(payload => {
                const spos = Array.isArray(payload?.spos) ? payload.spos : [];
                spoDirectoryState = {
                    ...payload,
                    count: Number.isFinite(Number(payload?.count)) ? Number(payload.count) : spos.length,
                    spos
                };
                setText('gov-spo-count', spoDirectoryState.count.toLocaleString('en-US'));
                setText(
                    'gov-spo-total-delegated',
                    `Delegated ${formatCompactAdaFromLovelace(spoDirectoryState.total_delegated_lovelace || 0)}`
                );
                return spoDirectoryState;
            })
            .catch(error => {
                spoDirectoryPromise = null;
                setText('gov-spo-count', '--');
                setText('gov-spo-total-delegated', 'Delegated -- ADA');
                throw error;
            });
    }
    return spoDirectoryPromise;
}

function getSpoDirectoryApiUrl() {
    return shouldUseLocalDashboardProxy() ? LOCAL_SPO_DIRECTORY_PROXY_PATH : SPO_DIRECTORY_API_URL;
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
        rootTitle: 'DReps'
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
    text.textContent = 'Registration currently requires a refundable 500 ADA deposit plus a network fee. Verify both amounts in your wallet before signing.';
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

            const response = await fetch(fetchUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Metadata URL could not be loaded (HTTP ${response.status}).`);
            const documentData = await response.json();
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
        rootTitle: 'DReps'
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

    let payloads;
    try {
        payloads = await Promise.all([
            fetchJson(getDrepMetadataApiUrl()),
            fetchDrepInfoPayload()
        ]);
    } catch {
        throw new Error('The DRep directory could not be checked. Please try again before creating the metadata file.');
    }

    const existingNames = new Set(payloads
        .flatMap(unwrapDrepEntries)
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
    const url = String(rawUrl || '').trim();
    if (!url) {
        if (options.required) throw new Error('Enter the metadata URL before creating its hash.');
        return '';
    }
    if (new TextEncoder().encode(url).length > 128) throw new Error('Metadata URL must be 128 bytes or shorter.');

    let protocol = '';
    try {
        protocol = new URL(url).protocol;
    } catch {
        throw new Error('Enter a valid HTTPS or IPFS metadata URL.');
    }
    if (protocol !== 'https:' && protocol !== 'ipfs:') throw new Error('Metadata URL must use HTTPS or IPFS.');
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

        const drepPayload = await fetchJson(getDrepDetailApiUrl(drep.dRepIDCip105));
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
    warning.textContent = 'This registers the displayed DRep ID on Cardano Mainnet. Check the 500 ADA deposit, network fee, DRep ID and metadata in your wallet before signing.';
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
        const latest = await fetchJson(getDrepDetailApiUrl(context.drep.dRepIDCip105));
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
        .sort((left, right) => right.votingPower - left.votingPower || left.name.localeCompare(right.name));
    updateGovernanceMenuHeaderMeta(
        'governance-drep-directory-overlay',
        `${dreps.length.toLocaleString('en-US')} DReps`,
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
    dreps.forEach((drep, index) => {
        const row = document.createElement('div');
        row.className = 'governance-cc-member governance-menu-card';
        row.dataset.searchText = `${drep.id || ''} ${drep.searchIds || ''}`.trim();
        row.dataset.sortName = normalizeOverlaySearchText(drep.name);
        row.dataset.sortPower = String(Number(drep.votingPower) || 0);
        row.dataset.sortStatus = drep.active ? '1' : '0';

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
        bindGovernanceMenuTrigger(row, event => openDrepActionHistoryOverlay(drep, event.currentTarget));
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
        headerMeta: 'Loading actions…',
        overlayClass: 'governance-action-detail-overlay',
        returnFocus
    });

    fetchJson(getDrepDetailApiUrl(drep.id))
        .then(payload => renderDrepActionHistory(panel, payload, drep))
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

function renderDrepActionHistory(container, payload, drep) {
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
        `${rows.length.toLocaleString('en-US')} actions`,
        container
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
            label: 'Not Applicable',
            detail: `${notApplicable} actions`,
            color: '#94a3b8',
            onClick: event => openGovernanceStatusActionsOverlay(
                drepName,
                notApplicableProposals,
                event.currentTarget,
                'Not Applicable'
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
        rootTitle: 'CC Members'
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
        row.className = 'governance-cc-member governance-menu-card';
        row.dataset.sortName = normalizeOverlaySearchText(member.name || `CC Member ${index + 1}`);
        if (Number.isFinite(Number(member.expiresEpoch))) {
            row.dataset.sortEpoch = String(Number(member.expiresEpoch));
        }

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
        bindGovernanceMenuTrigger(row, event => openConstitutionalCommitteeActionsOverlay(member, event.currentTarget));
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
        returnFocus
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
    const memberName = member?.name || 'CC Member';
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

function renderNoVotesList(container, votes, headingLabel = 'DRep votes') {
    const title = document.createElement('strong');
    title.textContent = `${headingLabel} (${votes.length})`;

    const list = document.createElement('div');
    list.className = 'governance-no-votes-list';

    const sortedVotes = [...votes].sort((left, right) => getDrepVotePowerValue(right) - getDrepVotePowerValue(left));

    sortedVotes.forEach(vote => {
        const { row, name } = createDrepVoteRow(vote);
        list.appendChild(row);

        resolveDrepDisplayName(vote, name, { skipDetailLookup: true }).catch(() => {});
    });

    container.appendChild(title);
    container.appendChild(list);
}

function createDrepVoteRow(vote) {
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

function getDrepFromVote(vote) {
    const id = normalizeDrepIdentifier(getDrepVoteIdentifier(vote));
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

function getDrepMetadataFetchUrl(url, options = {}) {
    const normalizedUrl = normalizeMetadataUrl(url);
    if (!isAllowedBrowserMetadataUrl(normalizedUrl)) return '';

    const params = new URLSearchParams({ url: normalizedUrl });
    if (options.refresh) params.set('refresh', '1');
    if (shouldUseLocalDashboardProxy()) {
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

function createUniversalPieChart(items, options = {}) {
    const chart = document.createElement('div');
    chart.className = 'governance-pie-chart';
    const segments = getPieChartSegments(items);
    chart.appendChild(createPieChartSvg(segments, chart, options));

    if (options.showLabels !== false) {
        segments.forEach(segment => {
            const label = createPieAmountLabel(segment, options.labelFormatter);
            if (label) chart.appendChild(label);
        });
    }

    return chart;
}

function createPieChartSvg(segments, chart, options = {}) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.classList.add('governance-pie-chart-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Interactive pie chart');

    const track = document.createElementNS(namespace, 'circle');
    track.classList.add('governance-pie-chart-track');
    track.setAttribute('cx', '50');
    track.setAttribute('cy', '50');
    track.setAttribute('r', '43');
    svg.appendChild(track);

    if (options.isLoading === true || !segments.length) return svg;

    const circumference = 2 * Math.PI * 43;
    segments.forEach((segment, index) => {
        const span = segment.end - segment.start;
        const interactiveSegment = createPieChartSector(segment, namespace);
        interactiveSegment.classList.add('governance-pie-chart-sector');
        interactiveSegment.style.fill = segment.color;
        interactiveSegment.setAttribute('tabindex', '0');
        const isClickable = typeof options.onSegmentClick === 'function';
        interactiveSegment.setAttribute('role', isClickable ? 'button' : 'img');
        interactiveSegment.setAttribute(
            'aria-label',
            `${segment.label || `Segment ${index + 1}`}: ${formatPercentage(span / 360 * 100)}${isClickable ? ', open details' : ''}`
        );
        if (isClickable) {
            interactiveSegment.classList.add('is-clickable');
            interactiveSegment.addEventListener('click', event => {
                options.onSegmentClick(segment, event.currentTarget);
            });
            interactiveSegment.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                options.onSegmentClick(segment, event.currentTarget);
            });
        }

        const arc = document.createElementNS(namespace, 'circle');
        arc.classList.add('governance-pie-chart-arc');
        arc.setAttribute('cx', '50');
        arc.setAttribute('cy', '50');
        arc.setAttribute('r', '43');
        arc.setAttribute('transform', 'rotate(-90 50 50)');
        arc.style.stroke = segment.color;
        arc.style.color = segment.color;
        arc.style.strokeDasharray = `${circumference * span / 360} ${circumference}`;
        arc.style.strokeDashoffset = `${-circumference * segment.start / 360}`;

        const showSegment = () => {
            chart.classList.add('is-segment-active');
            interactiveSegment.classList.add('is-active');
            arc.classList.add('is-active');
        };
        const hideSegment = () => {
            chart.classList.remove('is-segment-active');
            interactiveSegment.classList.remove('is-active');
            arc.classList.remove('is-active');
        };
        interactiveSegment.addEventListener('mouseenter', showSegment);
        interactiveSegment.addEventListener('mouseleave', hideSegment);
        interactiveSegment.addEventListener('focus', showSegment);
        interactiveSegment.addEventListener('blur', hideSegment);

        svg.append(interactiveSegment, arc);
    });

    return svg;
}

function createPieChartSector(segment, namespace) {
    const span = Math.min(359.999, segment.end - segment.start);
    const start = getPieChartPoint(segment.start, 47);
    const end = getPieChartPoint(segment.start + span, 47);
    const sector = document.createElementNS(namespace, 'path');
    sector.setAttribute(
        'd',
        `M 50 50 L ${start.x} ${start.y} A 47 47 0 ${span > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`
    );
    return sector;
}

function getPieChartPoint(angle, radius) {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
        x: 50 + Math.cos(radians) * radius,
        y: 50 + Math.sin(radians) * radius
    };
}

function createPieAmountLabel(segment, formatter = null) {
    if (!segment.value) return null;

    const text = typeof formatter === 'function'
        ? formatter(segment)
        : formatPercentage((segment.end - segment.start) / 360 * 100);
    if (!text) return null;

    const label = document.createElement('span');
    label.className = 'governance-pie-label';
    label.textContent = text;

    const radians = ((segment.mid - 90) * Math.PI) / 180;
    positionPieLabel(label, radians, segment.end - segment.start);
    return label;
}

function positionPieLabel(label, radians, segmentDegrees) {
    const radius = segmentDegrees < 18 ? 38 : 32;
    const x = Math.min(88, Math.max(12, 50 + (Math.cos(radians) * radius)));
    const y = Math.min(88, Math.max(12, 50 + (Math.sin(radians) * radius)));

    label.style.left = `${x}%`;
    label.style.top = `${y}%`;
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
    setText('gov-info-count', getCollectionLength(getActiveInfoActions(groups.info)));
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

function getActiveInfoActions(proposals) {
    const clockEpoch = Number(getClockEpochSnapshot()?.epoch);

    return (Array.isArray(proposals) ? proposals : []).filter(proposal => {
        if (proposal?.proposal_type !== 'InfoAction') return false;
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
