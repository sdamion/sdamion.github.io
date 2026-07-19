const STARCH_IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const STARCH_API_BASE_URL = STARCH_IS_LOCAL_PREVIEW
    ? '/__starch_proxy__'
    : 'https://api.tdsp.online/api/starch';
const STARCH_DIRECTORY_URL = STARCH_IS_LOCAL_PREVIEW
    ? '/__starch_directory_proxy__'
    : 'https://api.tdsp.online/api/starch/directory';

let starchDirectory = { miners: [], companies: [] };
let minerChartInstance = null;

const formatBalance = balance =>
    `${new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format((Number(balance) || 0) / 1_000_000)}M`;

function getStarchSummaryUrl(teamId) {
    if (STARCH_IS_LOCAL_PREVIEW) {
        return `${STARCH_API_BASE_URL}?teamId=${encodeURIComponent(teamId)}`;
    }
    return `${STARCH_API_BASE_URL}/${encodeURIComponent(teamId)}`;
}

async function fetchStarchDirectory() {
    try {
        const response = await fetch(STARCH_DIRECTORY_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        starchDirectory = {
            miners: Array.isArray(payload?.miners) ? payload.miners : [],
            companies: Array.isArray(payload?.companies) ? payload.companies : []
        };
        updateStarchDirectoryTiles(payload);
    } catch (error) {
        console.error(`Starch directory failed: ${error.message}`);
        if (!starchDirectory.miners.length && !starchDirectory.companies.length) {
            updateStarchDirectoryTiles(null);
        }
    }
}

function updateStarchDirectoryTiles(payload) {
    const minerCount = document.getElementById('starchMinerCount');
    const companyCount = document.getElementById('starchCompanyCount');
    if (minerCount) {
        const value = Number(payload?.miner_count);
        minerCount.textContent = Number.isFinite(value) ? value.toLocaleString('en-US') : 'N/A';
    }
    if (companyCount) {
        const value = Number(payload?.company_count);
        companyCount.textContent = Number.isFinite(value) ? value.toLocaleString('en-US') : 'N/A';
    }
}

function bindStarchDirectoryTile(cardId, type, title) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const open = () => openStarchDirectoryOverlay(type, title, card);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
    });
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
        const message = document.createElement('p');
        message.className = 'governance-empty';
        message.textContent = `${label} data is not available yet.`;
        list.appendChild(message);
        return list;
    }

    sortStarchDirectoryRecords(records, type).forEach((record, index) => {
        list.appendChild(createStarchDirectoryCard(record, index, type, label));
    });
    return list;
}

function sortStarchDirectoryRecords(records, type) {
    const sorted = [...records];
    if (type !== 'companies') return sorted;

    const tdspOrder = new Map([
        ['B0ADAD', 0],
        ['868C0C', 1]
    ]);
    return sorted.sort((left, right) => {
        const leftId = String(left?.id || '').toUpperCase();
        const rightId = String(right?.id || '').toUpperCase();
        const leftTdsp = tdspOrder.get(leftId);
        const rightTdsp = tdspOrder.get(rightId);
        if (leftTdsp != null || rightTdsp != null) {
            if (leftTdsp == null) return 1;
            if (rightTdsp == null) return -1;
            return leftTdsp - rightTdsp;
        }

        const leftHasBalance = Number(left?.balance) > 0;
        const rightHasBalance = Number(right?.balance) > 0;
        if (leftHasBalance !== rightHasBalance) return leftHasBalance ? -1 : 1;

        const nameOrder = String(left?.name || 'No Name').localeCompare(
            String(right?.name || 'No Name'),
            'en',
            { sensitivity: 'base', numeric: true }
        );
        return nameOrder || leftId.localeCompare(rightId);
    });
}

function createStarchDirectoryCard(record, index, type, label) {
    const id = String(record?.id || '').trim();
    const row = document.createElement('div');
    row.className = 'pool-delegator-row governance-menu-card';

    const rank = document.createElement('span');
    rank.className = 'pool-delegator-rank';
    rank.textContent = String(index + 1);

    const content = document.createElement('div');
    content.className = 'pool-delegator-content';
    const name = document.createElement('strong');
    name.className = 'pool-delegator-handle';
    name.textContent = String(record?.name || 'No Name');
    content.appendChild(name);

    if (type === 'companies') {
        row.classList.add('starch-company-card');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Open ${name.textContent}`);
        content.appendChild(createStarchCompanyStats(record));
        const open = () => openStarchCompanyOverlay(record, row);
        row.addEventListener('click', open);
        row.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            open();
        });
    } else if (type === 'miners' && id) {
        row.classList.add('starch-miner-card');
        row.setAttribute('role', 'link');
        row.tabIndex = 0;
        row.setAttribute('aria-label', `Open ${name.textContent} on Starch`);
        const open = () => {
            openExternalSiteWarning(`https://starch.one/miner/${encodeURIComponent(id)}`, row);
        };
        row.addEventListener('click', open);
        row.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            open();
        });
    }

    const idLine = document.createElement('div');
    idLine.className = 'starch-directory-id-line';
    const idText = document.createElement('span');
    idText.textContent = id || 'N/A';
    idLine.append(idText);
    if (id) {
        const singularLabel = type === 'companies' ? 'Company' : 'Miner';
        idLine.appendChild(createStarchCopyButton(id, `${singularLabel} ID`));
    }
    content.appendChild(idLine);

    row.append(rank, content);
    return row;
}

function createStarchCompanyStats(company) {
    const stats = document.createElement('div');
    stats.className = 'starch-company-stats';
    const balance = document.createElement('span');
    const blocks = document.createElement('span');
    if (company?.stats_resolved === true) {
        balance.textContent = `Balance ${formatBalance(company.balance)} STRCH`;
        blocks.textContent = `Weekly Blocks ${Number(company.weekly_blocks || 0).toLocaleString('en-US')}`;
    } else {
        balance.textContent = 'Balance loading...';
        blocks.textContent = 'Weekly Blocks loading...';
    }
    stats.append(balance, blocks);
    return stats;
}

async function openStarchCompanyOverlay(company, returnFocus) {
    closeStarchCompanyOverlay(false);
    const companyId = String(company?.id || '').trim().toUpperCase();
    const content = document.createElement('div');
    content.className = 'starch-company-detail';
    const loading = document.createElement('p');
    loading.className = 'small-text';
    loading.textContent = 'Loading company miners...';
    content.appendChild(loading);

    createPoolMenuOverlay({
        id: 'starch-company-detail-overlay',
        titleId: 'starch-company-detail-title',
        titleText: String(company?.name || 'No Name'),
        headerMeta: companyId,
        closeLabel: `Close ${String(company?.name || 'company')}`,
        closeOverlay: closeStarchCompanyOverlay,
        returnFocus,
        rootTitle: 'Companies',
        bodyNode: content
    });

    try {
        const response = await fetch(getStarchSummaryUrl(companyId));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const summary = await response.json();
        if (!document.getElementById('starch-company-detail-overlay')) return;
        renderStarchCompanyDetail(content, company, summary);
    } catch (error) {
        console.error(`Starch company ${companyId} failed: ${error.message}`);
        if (!document.getElementById('starch-company-detail-overlay')) return;
        content.replaceChildren();
        const message = document.createElement('p');
        message.className = 'governance-empty';
        message.textContent = 'Company miner data could not be loaded.';
        content.appendChild(message);
    }
}

function closeStarchCompanyOverlay(restoreFocus = true) {
    if (minerChartInstance) {
        minerChartInstance.destroy();
        minerChartInstance = null;
    }
    closePoolMenuOverlay('starch-company-detail-overlay', restoreFocus);
}

function renderStarchCompanyDetail(content, company, summary) {
    const miners = (Array.isArray(summary?.miners) ? summary.miners : []).map(miner => ({
        miner_id: String(miner?.miner_id || ''),
        rank: Number.isFinite(Number(miner?.rank)) ? Number(miner.rank) : null,
        balance: Number(miner?.balance) || 0,
        weeklyBlocks: Number(miner?.weekly_blocks) || 0
    }));
    content.replaceChildren();

    const summaryTiles = document.createElement('div');
    summaryTiles.className = 'starch-summary starch-company-detail-summary';
    summaryTiles.append(
        createStarchStatTile(formatBalance(summary?.team_balance), 'Company Balance'),
        createStarchStatTile(Number(summary?.weekly_blocks || 0).toLocaleString('en-US'), 'Weekly Blocks'),
        createStarchStatTile(miners.length.toLocaleString('en-US'), 'Miners')
    );

    const idLine = document.createElement('div');
    idLine.className = 'pool-id-line starch-company-id-line';
    const idLabel = document.createElement('span');
    idLabel.textContent = 'Company ID';
    const idValue = document.createElement('strong');
    idValue.textContent = String(company?.id || summary?.team_id || 'N/A');
    idLine.append(idLabel, idValue);
    if (company?.id) idLine.appendChild(createStarchCopyButton(company.id, 'Company ID'));

    const canvas = document.createElement('canvas');
    canvas.className = 'starch-company-chart';

    const table = createStarchMinerTable(miners);
    const timestamp = document.createElement('p');
    timestamp.className = 'refresh-time small-text';
    timestamp.textContent = `Last Updated: ${formatStarchTimestamp(summary?.updated_at, summary?.stale === true)}`;

    content.append(summaryTiles, idLine, canvas, table, timestamp);
    renderStarchCompanyChart(canvas, miners, String(company?.id || summary?.team_id || '000000'));
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

function renderStarchCompanyChart(canvas, miners, companyId) {
    if (minerChartInstance) minerChartInstance.destroy();
    const context = canvas.getContext('2d');
    if (!miners.length) return;
    const color = /^[0-9A-F]{6}$/i.test(companyId) ? `#${companyId}` : '#0f766e';
    const hoverColor = shadeColor(color, -20);
    const gradient = context.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, hoverColor);

    minerChartInstance = new Chart(context, {
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
    const date = value ? new Date(value) : null;
    const formatted = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Never';
    return stale ? `${formatted} (cached)` : formatted;
}

function createStarchCopyButton(value, label) {
    const button = document.createElement('button');
    button.className = 'pool-delegator-copy-button';
    button.type = 'button';
    button.textContent = '⧉';
    button.setAttribute('aria-label', `Copy ${label}`);
    button.addEventListener('keydown', event => event.stopPropagation());
    button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        const original = button.textContent;
        try {
            await copyStarchText(value);
            button.textContent = 'Copied';
        } catch {
            button.textContent = 'Copy failed';
        }
        setTimeout(() => { button.textContent = original; }, 1400);
    });
    return button;
}

async function copyStarchText(value) {
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

function shadeColor(color, percent) {
    let red = parseInt(color.substring(1, 3), 16);
    let green = parseInt(color.substring(3, 5), 16);
    let blue = parseInt(color.substring(5, 7), 16);
    red = Math.min(255, Math.max(0, red + percent * 2.55));
    green = Math.min(255, Math.max(0, green + percent * 2.55));
    blue = Math.min(255, Math.max(0, blue + percent * 2.55));
    return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
}

document.addEventListener('DOMContentLoaded', () => {
    bindStarchDirectoryTile('starch-miners-card', 'miners', 'Miners');
    bindStarchDirectoryTile('starch-companies-card', 'companies', 'Companies');
    fetchStarchDirectory();
    setInterval(fetchStarchDirectory, 300000);
});
