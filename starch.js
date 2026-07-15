const STARCH_IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const STARCH_API_BASE_URL = STARCH_IS_LOCAL_PREVIEW
    ? '/__starch_proxy__'
    : 'https://api.tdsp.online/api/starch';
const teams = {
    'B0ADAD': '50% Company',
    '868C0C': 'TDSP02',
    '1B83BB': 'StarchWhale'
};
let selectedTeamId = Object.keys(teams)[0];
let minerChartInstance = null;
const RETRY_LIMIT = 1;

// Fetch JSON with retry logic
async function fetchJson(url, attempts = 0) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`❌ Error fetching ${url}:`, error.message);
        if (attempts < RETRY_LIMIT) {
            console.log(`🔄 Retrying (${attempts + 1}/${RETRY_LIMIT})...`);
            return fetchJson(url, attempts + 1);
        }
        displayError(`Failed to load data from ${url}`);
        return null;
    }
}

function displayError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = '';
        const p = document.createElement('p');
        p.className = 'error-text';
        p.textContent = `❌ ${message}`;
        errorMessage.appendChild(p);
    }
}

function clearError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.textContent = '';
}

const formatBalance = (balance) => 
    new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(balance / 1_000_000) + 'M';

function getStarchSummaryUrl(teamId) {
    if (STARCH_IS_LOCAL_PREVIEW) {
        return `${STARCH_API_BASE_URL}?teamId=${encodeURIComponent(teamId)}`;
    }
    return `${STARCH_API_BASE_URL}/${encodeURIComponent(teamId)}`;
}

async function fetchMinerData() {
    try {
        const summary = await fetchJson(getStarchSummaryUrl(selectedTeamId));
        if (!summary) return;
        clearError();

        const minersData = (Array.isArray(summary.miners) ? summary.miners : []).map(miner => ({
            miner_id: miner.miner_id,
            rank: miner.rank ?? 'N/A',
            balance: Number(miner.balance) || 0,
            weeklyBlocks: Number(miner.weekly_blocks) || 0
        }));
        updateUI(
            minersData,
            Number(summary.team_balance) || 0,
            Number(summary.weekly_blocks) || 0
        );
        updateStarchTimestamp(summary.updated_at, summary.stale === true);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${selectedTeamId}:`, error);
        displayError("Unexpected error occurred while fetching miner data.");
    }
}

function updateStarchTimestamp(value, stale) {
    const element = document.getElementById('last-updated');
    if (!element) return;
    const date = value ? new Date(value) : null;
    const formatted = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Never';
    element.textContent = stale ? `${formatted} (cached)` : formatted;
}

function updateUI(minersData, teamBalance = 0, totalWeeklyBlocks = 0) {
    const teamNameElement = document.getElementById('teamName');
    const balanceDisplay = document.getElementById('teamBalance');
    const weeklyBlocksDisplay = document.getElementById('weeklyBlocks');
    const minerTableBody = document.getElementById('minerTableBody');

    if (teamNameElement) teamNameElement.innerText = teams[selectedTeamId] || selectedTeamId;
    if (balanceDisplay) balanceDisplay.textContent = formatBalance(teamBalance);
    if (weeklyBlocksDisplay) weeklyBlocksDisplay.textContent = String(totalWeeklyBlocks);

    if (minerTableBody) {
        while (minerTableBody.firstChild) minerTableBody.removeChild(minerTableBody.firstChild);
        minersData.forEach(({ miner_id, rank, balance, weeklyBlocks }, index) => {
            const tr = document.createElement('tr');
            const tdIndex = document.createElement('td'); tdIndex.textContent = String(index + 1);
            const tdLink = document.createElement('td');
            const a = document.createElement('a');
            a.href = `https://starch.one/miner/${miner_id}`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'miner-link';
            a.textContent = miner_id;
            tdLink.appendChild(a);
            const tdRank = document.createElement('td'); tdRank.textContent = String(rank);
            const tdWeekly = document.createElement('td'); tdWeekly.textContent = String(weeklyBlocks);
            const tdBalance = document.createElement('td'); tdBalance.textContent = balance ? formatBalance(balance) : '0.000M';

            tr.appendChild(tdIndex);
            tr.appendChild(tdLink);
            tr.appendChild(tdRank);
            tr.appendChild(tdWeekly);
            tr.appendChild(tdBalance);
            minerTableBody.appendChild(tr);
        });
    }

    renderChart(minersData);
}

function populateTeamSelector() {
    const teamSelector = document.getElementById('teamSelector');
    if (!teamSelector) return;

    teamSelector.replaceChildren();
    Object.entries(teams).forEach(([teamId, teamName]) => {
        const opt = document.createElement('option');
        opt.value = teamId;
        opt.textContent = `${teamName} (${teamId})`;
        teamSelector.appendChild(opt);
    });
    teamSelector.value = selectedTeamId;
    teamSelector.addEventListener('change', (event) => {
        selectedTeamId = event.target.value;
        fetchMinerData();
    });
}

function addCustomTeamInput() {
    const customTeamInput = document.getElementById('customTeamId');
    if (!customTeamInput) return;

    customTeamInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && customTeamInput.value.trim() !== '') {
            const customTeamId = customTeamInput.value.trim().toUpperCase();

            // Validate if it's a valid 6-character hex color code
            if (/^[0-9A-F]{6}$/i.test(customTeamId)) {
                selectedTeamId = customTeamId;
                fetchMinerData();
            } else {
                displayError("Invalid Company ID! Must be a 6-character HEX code.");
            }
        }
    });
}


function renderChart(minersData) {
    const canvas = document.getElementById('minerChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (minerChartInstance) minerChartInstance.destroy();

    if (!minersData.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = "center";
        ctx.fillText('No Data Available', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Extract color from team ID and generate hover color (darker shade)
    const baseColor = `#${selectedTeamId}`;
    const hoverColor = shadeColor(baseColor, -20); // Darken color by 20%

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, hoverColor);

    minerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: minersData.map(({ miner_id }) => miner_id),
            datasets: [{
                label: 'Mined Blocks (Week)',
                data: minersData.map(({ weeklyBlocks }) => weeklyBlocks),
                backgroundColor: gradient,
                borderColor: baseColor,
                borderWidth: 2,
                borderRadius: 5,
                hoverBackgroundColor: hoverColor,
                hoverBorderColor: baseColor,
                barThickness: 20
            }]
        },
        options: {
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutBounce'
            }
        }
    });
}

// Helper function to darken or lighten a hex color
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, R + percent * 2.55));
    G = Math.min(255, Math.max(0, G + percent * 2.55));
    B = Math.min(255, Math.max(0, B + percent * 2.55));

    return `rgb(${Math.round(R)}, ${Math.round(G)}, ${Math.round(B)})`;
}

document.addEventListener("DOMContentLoaded", () => {
    populateTeamSelector();
    addCustomTeamInput();
    fetchMinerData();
    setInterval(fetchMinerData, 120000);
});
