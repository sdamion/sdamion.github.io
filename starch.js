const STARCH_IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
const STARCH_API_BASE_URL = STARCH_IS_LOCAL_PREVIEW
    ? '/__starch_proxy__'
    : 'https://api.tdsp.online/api/starch';
const STARCH_DIRECTORY_URL = STARCH_IS_LOCAL_PREVIEW
    ? '/__starch_directory_proxy__'
    : 'https://api.tdsp.online/api/starch/directory/compact';
const TDSP_STARCH_COMPANY_ID = 'B0ADAD';

let starchDirectory = { miners: [], companies: [] };
let minerChartInstance = null;
let tdspStarchCompanyEnabled = null;
let tdspStarchMinerCount = null;

const formatBalance = balance =>
    `${new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format((Number(balance) || 0) / 1_000_000)}M`;

function isDefaultStarchCompanyName(name) {
    return /^starch company(?:\s*#?\d+)?$/i.test(String(name || '').trim());
}

function getStarchCompanyBaseName(name) {
    const value = String(name || 'No Name').trim() || 'No Name';
    if (isDefaultStarchCompanyName(value)) return value;
    return value.replace(/[\s#_-]+\d+\s*$/u, '').trim() || value;
}

function getStarchCompanyGroupKey(record) {
    const name = String(record?.name || 'No Name').trim() || 'No Name';
    if (isDefaultStarchCompanyName(name)) {
        return `default:${String(record?.id || '').trim().toUpperCase()}`;
    }
    return `name:${getStarchCompanyBaseName(name).toLocaleLowerCase('en-US').replace(/\s+/g, '')}`;
}

function getStarchCompanyIds(record) {
    const values = Array.isArray(record?.company_ids)
        ? record.company_ids
        : [record?.id];
    return [...new Set(values.map(value => String(value || '').trim().toUpperCase()).filter(Boolean))];
}

function consolidateStarchCompanies(companies) {
    const groups = new Map();
    (Array.isArray(companies) ? companies : []).forEach(company => {
        const key = getStarchCompanyGroupKey(company);
        const current = groups.get(key);
        if (!current) {
            groups.set(key, {
                ...company,
                company_ids: getStarchCompanyIds(company)
            });
            return;
        }

        const ids = [...new Set([...getStarchCompanyIds(current), ...getStarchCompanyIds(company)])];
        const preferredId = [...ids].sort((left, right) => (
            getStarchCompanyPinRank(left) - getStarchCompanyPinRank(right)
            || left.localeCompare(right)
        ))[0];
        groups.set(key, {
            ...current,
            id: preferredId,
            name: getStarchCompanyBaseName(current.name),
            company_ids: ids,
            balance: (Number(current.balance) || 0) + (Number(company?.balance) || 0),
            weekly_blocks: (Number(current.weekly_blocks) || 0) + (Number(company?.weekly_blocks) || 0),
            miner_count: (Number(current.miner_count) || 0) + (Number(company?.miner_count) || 0),
            stats_resolved: current.stats_resolved === true && company?.stats_resolved === true
        });
    });
    return Array.from(groups.values());
}

function getStarchSummaryUrl(teamId) {
    if (STARCH_IS_LOCAL_PREVIEW) {
        return `${STARCH_API_BASE_URL}?teamId=${encodeURIComponent(teamId)}`;
    }
    return `${STARCH_API_BASE_URL}/${encodeURIComponent(teamId)}`;
}

async function fetchStarchCompanySummary(companyId) {
    const response = await fetch(getStarchSummaryUrl(companyId), { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function loadStarchCompanySummary(companyId) {
    const normalizedId = String(companyId || '').trim().toUpperCase();
    const loader = () => fetchStarchCompanySummary(normalizedId);
    return window.TDSPRuntime?.loadDetail
        ? window.TDSPRuntime.loadDetail(`starch:${normalizedId}`, loader)
        : loader();
}

async function fetchStarchDirectory() {
    try {
        const response = await fetch(STARCH_DIRECTORY_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        starchDirectory = {
            miners: Array.isArray(payload?.miners) ? payload.miners : [],
            companies: consolidateStarchCompanies(payload?.companies)
        };
        updateStarchDirectoryTiles({
            ...payload,
            companies: starchDirectory.companies,
            company_count: starchDirectory.companies.length
        });
    } catch (error) {
        console.error(`Starch directory failed: ${error.message}`);
        if (!starchDirectory.miners.length && !starchDirectory.companies.length) {
            updateStarchDirectoryTiles(null);
        }
    }
}

async function fetchTdspStarchMinerCount() {
    try {
        const summary = await loadStarchCompanySummary(TDSP_STARCH_COMPANY_ID);
        tdspStarchMinerCount = Array.isArray(summary?.miners) ? summary.miners.length : null;
    } catch (error) {
        console.error(`Starch company ${TDSP_STARCH_COMPANY_ID} miner count failed: ${error.message}`);
    }
    renderTdspStarchPoolTile();
}

function renderTdspStarchPoolTile() {
    setStarchPoolCardStatus(
        tdspStarchCompanyEnabled === null
            ? 'N/A'
            : tdspStarchCompanyEnabled ? 'Active' : 'Inactive',
        tdspStarchCompanyEnabled
    );
    const minerLabel = document.getElementById('pool-starch-miner-label');
    if (minerLabel) {
        minerLabel.textContent = Number.isFinite(tdspStarchMinerCount)
            ? `${tdspStarchMinerCount.toLocaleString('en-US')} Starch Miners`
            : 'N/A Starch Miners';
    }
}

function updateStarchDirectoryTiles(payload) {
    const minerCount = document.getElementById('starchMinerCount');
    const minerStatus = document.getElementById('starchMinerStatus');
    const companyCount = document.getElementById('starchCompanyCount');
    if (minerCount) {
        minerCount.classList.remove('is-online');
        if (minerStatus) minerStatus.classList.remove('is-offline');

        const registeredCount = Number(payload?.miner_count);
        const onlineCount = Number(payload?.active_miner_count);
        const offlineCount = Number(payload?.inactive_miner_count);
        const activeCount = onlineCount;
        const hasMinerStatus = Number.isFinite(registeredCount) && Number.isFinite(onlineCount);
        if (hasMinerStatus) {
            const inactiveCount = Number.isFinite(offlineCount)
                ? offlineCount
                : Math.max(registeredCount - activeCount, 0);
            minerCount.textContent = registeredCount.toLocaleString('en-US');
            minerCount.classList.remove('is-online');
            if (minerStatus) {
                minerStatus.textContent = '';
                minerStatus.classList.remove('is-offline');
                minerStatus.classList.add('starch-miner-status-lines');
                const labelText = document.createElement('span');
                labelText.textContent = 'Miners';
                const offlineText = document.createElement('span');
                offlineText.className = 'starch-miner-offline-count';
                offlineText.textContent = `Offline ${inactiveCount.toLocaleString('en-US')}`;
                minerStatus.append(labelText, offlineText);
            }
        } else {
            minerCount.textContent = Number.isFinite(registeredCount)
                ? registeredCount.toLocaleString('en-US')
                : 'N/A';
            if (minerStatus) {
                minerStatus.classList.remove('starch-miner-status-lines');
                minerStatus.textContent = 'Miners';
            }
        }
    }
    if (companyCount) {
        const value = Number(payload?.company_count);
        companyCount.textContent = Number.isFinite(value) ? value.toLocaleString('en-US') : 'N/A';
    }

    if (typeof setStarchPoolCardStatus === 'function') {
        const companies = Array.isArray(payload?.companies) ? payload.companies : null;
        tdspStarchCompanyEnabled = companies
            ? companies.some(company => String(company?.id || '').trim().toUpperCase() === TDSP_STARCH_COMPANY_ID)
            : null;
        renderTdspStarchPoolTile();
    }
}

function bindStarchDirectoryTile(cardId, type, title) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const open = () => openStarchDirectoryOverlay(type, title, card);
    window.TDSPRuntime?.bindActivation?.(card, open);
}

function openStarchDirectoryOverlay(type, title, returnFocus) {
    const records = Array.isArray(starchDirectory[type]) ? starchDirectory[type] : [];
    const overlayId = `starch-${type}-overlay`;
    document.getElementById(overlayId)?.remove();
    createPoolMenuOverlay({
        id: overlayId,
        titleId: `starch-${type}-title`,
        titleText: title,
        headerMeta: `${records.length.toLocaleString('en-US')} ${title.toLowerCase()}`,
        closeLabel: `Close ${title}`,
        closeOverlay: () => closePoolMenuOverlay(overlayId),
        returnFocus,
        rootTitle: title,
        bodyNode: createStarchDirectoryList(records, type, title)
    });
}

function createStarchDirectoryList(records, type, label) {
    const list = document.createElement('div');
    list.className = 'governance-drep-directory-list';
    if (!records.length) {
        const message = window.TDSPRuntime.createSmallText(`${label} data is not available yet.`, { className: 'governance-empty' });
        list.appendChild(message);
        return list;
    }

    sortStarchDirectoryRecords(records, type).forEach(record => {
        list.appendChild(createStarchDirectoryCard(record, type));
    });
    return list;
}

function sortStarchDirectoryRecords(records, type) {
    const sorted = [...records];
    if (type !== 'companies') return sorted;

    return sorted.sort((left, right) => {
        const leftId = String(left?.id || '').toUpperCase();
        const rightId = String(right?.id || '').toUpperCase();
        const leftTdsp = getStarchCompanyRecordPinRank(left);
        const rightTdsp = getStarchCompanyRecordPinRank(right);
        if (Number.isFinite(leftTdsp) || Number.isFinite(rightTdsp)) {
            if (!Number.isFinite(leftTdsp)) return 1;
            if (!Number.isFinite(rightTdsp)) return -1;
            return leftTdsp - rightTdsp;
        }

        const totalOrder = (Number(right?.balance) || 0) - (Number(left?.balance) || 0)
            || (Number(right?.weekly_blocks) || 0) - (Number(left?.weekly_blocks) || 0)
            || (Number(right?.miner_count) || 0) - (Number(left?.miner_count) || 0);
        if (totalOrder) return totalOrder;

        const nameOrder = String(left?.name || 'No Name').localeCompare(
            String(right?.name || 'No Name'),
            'en',
            { sensitivity: 'base', numeric: true }
        );
        return nameOrder || leftId.localeCompare(rightId);
    });
}

function createStarchDirectoryCard(record, type) {
    const id = String(record?.id || '').trim();
    if (type === 'companies') {
        return createStarchCompanyDirectoryCard(record, id);
    }

    const row = document.createElement('div');
    row.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card starch-miner-card';
    row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(String(record?.name || 'No Name'));
    row.setAttribute('role', id ? 'link' : 'group');
    if (id) row.tabIndex = 0;
    row.setAttribute('aria-label', id ? `Open ${String(record?.name || 'No Name')} on Starch` : String(record?.name || 'No Name'));

    window.TDSPRuntime?.appendUniversalTileContent?.(row, {
        title: String(record?.name || 'No Name')
    });
    appendStarchDirectoryIdLine(row, id, 'Miner ID');

    if (type === 'miners' && id) {
        const open = () => {
            openExternalSiteWarning(`https://starch.one/miner/${encodeURIComponent(id)}`, row);
        };
        window.TDSPRuntime?.bindActivation?.(row, open);
    }

    return row;
}

function createStarchCompanyDirectoryCard(record, id) {
    const row = document.createElement('div');
    row.className = 'governance-card governance-menu-card governance-treasury-withdrawal-card starch-company-card';
    row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(String(record?.name || 'No Name'));
    if (record?.stats_resolved === true) {
        row.dataset.sortBalance = String(Number(record?.balance) || 0);
        row.dataset.sortBlocks = String(Number(record?.weekly_blocks) || 0);
        row.dataset.sortMiners = String(Number(record?.miner_count) || 0);
    }

    const companyIds = getStarchCompanyIds(record);
    const pinRank = getStarchCompanyRecordPinRank(record);
    if (Number.isFinite(pinRank)) row.dataset.overlayPinRank = String(pinRank);

    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute('aria-label', `Open ${String(record?.name || 'No Name')}`);

    window.TDSPRuntime?.appendUniversalTileContent?.(row, {
        title: String(record?.name || 'No Name'),
        primaryText: record?.stats_resolved === true
            ? `Balance ${formatBalance(record.balance)} STRCH`
            : 'Balance loading...',
        contextItems: [
            record?.stats_resolved === true
                ? `Weekly Blocks ${Number(record.weekly_blocks || 0).toLocaleString('en-US')}`
                : 'Weekly Blocks loading...',
            record?.stats_resolved === true
                ? `Amount of miners ${Number(record.miner_count || 0).toLocaleString('en-US')}`
                : 'Amount of miners loading...'
        ]
    });
    appendStarchDirectoryIdLine(
        row,
        companyIds.join(', '),
        companyIds.length > 1 ? 'Company IDs' : 'Company ID'
    );

    const open = () => openStarchCompanyOverlay(record, row);
    window.TDSPRuntime?.bindActivation?.(row, open);
    window.TDSPRuntime?.bindDetailPreload?.(
        row,
        `starch:${id.toUpperCase()}`,
        () => fetchStarchCompanySummary(id)
    );

    return row;
}

function appendStarchDirectoryIdLine(container, id, copyLabel) {
    const idLine = document.createElement('div');
    idLine.className = 'starch-directory-id-line';
    const idText = document.createElement('span');
    idText.textContent = id ? `ID ${id}` : 'ID N/A';
    idLine.append(idText);
    if (id) idLine.appendChild(createStarchCopyButton(id, copyLabel));
    container.appendChild(idLine);
}

function getStarchCompanyPinRank(companyId) {
    const tdspOrder = new Map([
        ['B0ADAD', 0],
        ['868C0C', 1]
    ]);
    return tdspOrder.get(String(companyId || '').trim().toUpperCase()) ?? Infinity;
}

function getStarchCompanyRecordPinRank(company) {
    return Math.min(...getStarchCompanyIds(company).map(getStarchCompanyPinRank), Infinity);
}

function openTdspStarchCompanyOverlay(returnFocus) {
    const company = starchDirectory.companies.find(record =>
        String(record?.id || '').trim().toUpperCase() === TDSP_STARCH_COMPANY_ID
    ) || {
        id: TDSP_STARCH_COMPANY_ID,
        name: 'TDSP 01'
    };
    openStarchCompanyOverlay(company, returnFocus, {
        activeMembers: true
    });
}

async function openStarchCompanyOverlay(company, returnFocus, options = {}) {
    closeStarchCompanyOverlay(false);
    const companyIds = getStarchCompanyIds(company);
    const companyId = companyIds[0] || '';
    const content = document.createElement('div');
    content.className = 'starch-company-detail';
    const loading = window.TDSPRuntime.createSmallText('Loading company miners...');
    content.appendChild(loading);

    createPoolMenuOverlay({
        id: 'starch-company-detail-overlay',
        titleId: 'starch-company-detail-title',
        titleText: String(options.titleText || company?.name || 'No Name'),
        headerMeta: companyIds.length > 1
            ? `${companyIds.length.toLocaleString('en-US')} Company IDs`
            : companyId,
        closeLabel: `Close ${String(company?.name || 'company')}`,
        closeOverlay: closeStarchCompanyOverlay,
        returnFocus,
        rootTitle: 'Companies',
        bodyNode: content
    });

    try {
        const summaries = await Promise.all(companyIds.map(loadStarchCompanySummary));
        const summary = mergeStarchCompanySummaries(summaries, companyIds);
        if (companyIds.includes(TDSP_STARCH_COMPANY_ID)) {
            tdspStarchMinerCount = Array.isArray(summary?.miners) ? summary.miners.length : null;
            renderTdspStarchPoolTile();
        }
        if (!document.getElementById('starch-company-detail-overlay')) return;
        await renderStarchCompanyDetail(content, company, summary, options);
    } catch (error) {
        console.error(`Starch company ${companyId} failed: ${error.message}`);
        if (!document.getElementById('starch-company-detail-overlay')) return;
        content.replaceChildren();
        const message = window.TDSPRuntime.createSmallText('Company miner data could not be loaded.', { className: 'governance-empty' });
        content.appendChild(message);
    }
}

function mergeStarchCompanySummaries(summaries, companyIds) {
    const minersById = new Map();
    let teamBalance = 0;
    let weeklyBlocks = 0;
    let updatedAt = null;
    let stale = false;

    summaries.forEach(summary => {
        teamBalance += Number(summary?.team_balance) || 0;
        weeklyBlocks += Number(summary?.weekly_blocks) || 0;
        stale ||= summary?.stale === true;
        const timestamp = Date.parse(summary?.updated_at || '');
        if (Number.isFinite(timestamp) && (!updatedAt || timestamp > Date.parse(updatedAt))) {
            updatedAt = summary.updated_at;
        }
        (Array.isArray(summary?.miners) ? summary.miners : []).forEach(miner => {
            const minerId = String(miner?.miner_id || '').trim();
            if (!minerId) return;
            const current = minersById.get(minerId);
            minersById.set(minerId, current ? {
                ...current,
                balance: (Number(current.balance) || 0) + (Number(miner?.balance) || 0),
                weekly_blocks: (Number(current.weekly_blocks) || 0) + (Number(miner?.weekly_blocks) || 0),
                rank: Math.min(
                    Number.isFinite(Number(current.rank)) ? Number(current.rank) : Infinity,
                    Number.isFinite(Number(miner?.rank)) ? Number(miner.rank) : Infinity
                )
            } : miner);
        });
    });

    return {
        team_id: companyIds.join(', '),
        team_balance: teamBalance,
        weekly_blocks: weeklyBlocks,
        miners: Array.from(minersById.values()),
        updated_at: updatedAt,
        stale
    };
}

function closeStarchCompanyOverlay(restoreFocus = true) {
    if (minerChartInstance) {
        minerChartInstance.destroy();
        minerChartInstance = null;
    }
    closePoolMenuOverlay('starch-company-detail-overlay', restoreFocus);
}

async function renderStarchCompanyDetail(content, company, summary, options = {}) {
    const miners = (Array.isArray(summary?.miners) ? summary.miners : [])
        .map(miner => ({
            miner_id: String(miner?.miner_id || ''),
            rank: Number.isFinite(Number(miner?.rank)) ? Number(miner.rank) : null,
            balance: Number(miner?.balance) || 0,
            weeklyBlocks: Number(miner?.weekly_blocks) || 0
        }))
        .sort((left, right) => (
            right.weeklyBlocks - left.weeklyBlocks
            || right.balance - left.balance
            || left.miner_id.localeCompare(right.miner_id)
        ));
    content.replaceChildren();

    const summaryTiles = document.createElement('div');
    summaryTiles.className = 'starch-summary starch-company-detail-summary';
    summaryTiles.append(
        createStarchStatTile(formatBalance(summary?.team_balance), 'Company Balance'),
        createStarchStatTile(Number(summary?.weekly_blocks || 0).toLocaleString('en-US'), 'Weekly Blocks'),
        createStarchStatTile(
            miners.length.toLocaleString('en-US'),
            options.activeMembers ? 'Active Miners' : 'Miners'
        )
    );

    const idLine = document.createElement('div');
    idLine.className = 'pool-id-line starch-company-id-line';
    const idLabel = document.createElement('span');
    idLabel.textContent = 'ID';
    const idValue = document.createElement('strong');
    const companyIds = getStarchCompanyIds(company);
    const companyIdText = companyIds.join(', ') || String(summary?.team_id || 'N/A');
    idValue.textContent = companyIdText;
    idLine.append(idLabel, idValue);
    if (companyIds.length) {
        idLine.appendChild(createStarchCopyButton(
            companyIdText,
            companyIds.length > 1 ? 'Company IDs' : 'Company ID'
        ));
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'starch-company-chart';

    const table = createStarchMinerTable(miners);
    const timestamp = document.createElement('p');
    timestamp.className = 'refresh-time small-text';
    timestamp.textContent = `Last Updated: ${formatStarchTimestamp(summary?.updated_at, summary?.stale === true)}`;

    content.append(summaryTiles, idLine, canvas, table, timestamp);
    await renderStarchCompanyChart(canvas, miners, String(company?.id || summary?.team_id || '000000'));
}

function createStarchStatTile(value, label) {
    const tile = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    tile.append(strong, span);
    return tile;
}

function createStarchMinerTable(miners) {
    const shell = document.createElement('div');
    shell.className = 'table-shell';
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['#', 'Miner', 'Rank', 'Blocks', '$STRCH'].forEach(label => {
        const th = document.createElement('th');
        th.textContent = label;
        headerRow.appendChild(th);
    });
    head.appendChild(headerRow);

    const body = document.createElement('tbody');
    miners.forEach((miner, index) => {
        const row = document.createElement('tr');
        const rankIndex = document.createElement('td');
        rankIndex.textContent = String(index + 1);
        const minerCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = `https://starch.one/miner/${encodeURIComponent(miner.miner_id)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'miner-link';
        link.textContent = miner.miner_id;
        minerCell.appendChild(link);
        const rank = document.createElement('td');
        rank.textContent = miner.rank == null ? 'N/A' : String(miner.rank);
        const blocks = document.createElement('td');
        blocks.textContent = String(miner.weeklyBlocks);
        const balance = document.createElement('td');
        balance.textContent = formatBalance(miner.balance);
        row.append(rankIndex, minerCell, rank, blocks, balance);
        body.appendChild(row);
    });

    table.append(head, body);
    shell.appendChild(table);
    return shell;
}

async function renderStarchCompanyChart(canvas, miners, companyId) {
    if (minerChartInstance) minerChartInstance.destroy();
    if (!miners.length) return;
    const ChartCtor = await window.TDSPCharts?.load?.().catch(error => {
        console.error(`Chart.js could not be loaded: ${error.message}`);
        return null;
    });
    if (typeof ChartCtor !== 'function' || !canvas?.isConnected) return;
    const context = canvas.getContext('2d');
    const color = /^[0-9A-F]{6}$/i.test(companyId) ? `#${companyId}` : '#0f766e';
    const hoverColor = window.TDSPRuntime.adjustHexColor(color, -20);
    const gradient = context.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, hoverColor);

    minerChartInstance = new ChartCtor(context, {
        type: 'bar',
        data: {
            labels: miners.map(miner => miner.miner_id),
            datasets: [{
                label: 'Mined Blocks (Week)',
                data: miners.map(miner => miner.weeklyBlocks),
                backgroundColor: gradient,
                borderColor: color,
                borderWidth: 2,
                borderRadius: 5,
                hoverBackgroundColor: hoverColor,
                hoverBorderColor: color,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function formatStarchTimestamp(value, stale) {
    const formatted = window.TDSPRuntime.formatTimestamp(value);
    return stale ? `${formatted} (cached)` : formatted;
}

function createStarchCopyButton(value, label) {
    return window.TDSPRuntime.createCopyButton(value, label, {
        className: 'pool-delegator-copy-button',
        title: false
    });
}

function initStarchUi() {
    if (window.TDSPStarchReady === true) return;
    window.TDSPStarchReady = true;
    bindStarchDirectoryTile('starch-miners-card', 'miners', 'Miners');
    bindStarchDirectoryTile('starch-companies-card', 'companies', 'Companies');
    fetchStarchDirectory();
    fetchTdspStarchMinerCount();
    setInterval(fetchStarchDirectory, 300000);
    setInterval(fetchTdspStarchMinerCount, 300000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarchUi, { once: true });
} else {
    initStarchUi();
}
