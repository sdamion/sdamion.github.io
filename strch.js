const baseUrl = 'https://api.starch.one';
const teams = {
    'B0ADAD': 'TDSP01',
    '868C0C': 'TDSP02',
    '1B83BB': 'StarchWhale'
};
let selectedTeamId = Object.keys(teams)[0];
const CACHE_EXPIRATION = 2 * 60 * 1000; // 2 minutes
let minerChartInstance = null;
const RETRY_LIMIT = 3;

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
        errorMessage.innerHTML = `<p style="color: red;">❌ ${message}</p>`;
    }
}

async function getMinersByTeam(teamId) {
    const response = await fetchJson(`${baseUrl}/teams/${teamId}/members`);
    return response?.members?.slice(0, 100).map(minerId => ({ miner_id: minerId })) || [];
}

async function getMinerStats(minerId) {
    const response = await fetchJson(`${baseUrl}/miners/${minerId}/account`);
    return response ? { balance: response.balance } : { balance: 0 };
}

async function getMinerWeeklyData(minerId) {
    const response = await fetchJson(`${baseUrl}/leaderboard/miners/${minerId}/week`);
    return response ? { rank: response.rank ?? 'N/A', blocks: response.blocks ?? 0 } : { rank: 'N/A', blocks: 0 };
}

async function getTeamBalance(teamId) {
    const response = await fetchJson(`${baseUrl}/teams/${teamId}/account`);
    return response?.balance ?? 0;
}

const formatBalance = (balance) => 
    new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(balance / 1_000_000) + 'M';

function loadCache() {
    const cachedData = localStorage.getItem(selectedTeamId);
    if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRATION) {
            return data;
        }
    }
    return null;
}

function saveCache(data) {
    localStorage.setItem(selectedTeamId, JSON.stringify({ timestamp: Date.now(), data }));
}

async function fetchMinerData() {
    const cachedData = loadCache();
    if (cachedData) {
        console.log("✅ Using cached data");
        const teamBalance = await getTeamBalance(selectedTeamId);
        const totalWeeklyBlocks = cachedData.reduce((sum, miner) => sum + miner.weeklyBlocks, 0);
        updateUI(cachedData, teamBalance, totalWeeklyBlocks);
        return;
    }

    try {
        const miners = await getMinersByTeam(selectedTeamId);
        if (!miners.length) {
            const teamBalance = await getTeamBalance(selectedTeamId);
            updateUI([], teamBalance, 0);
            return;
        }

        // Fetch all miner data concurrently
        const minerDataPromises = miners.map(async ({ miner_id }) => {
            const [stats, weeklyData] = await Promise.allSettled([
                getMinerStats(miner_id),
                getMinerWeeklyData(miner_id)
            ]);

            return {
                miner_id,
                rank: weeklyData.status === 'fulfilled' ? weeklyData.value.rank : 'N/A',
                balance: stats.status === 'fulfilled' ? stats.value.balance : 0,
                weeklyBlocks: weeklyData.status === 'fulfilled' ? weeklyData.value.blocks : 0
            };
        });

        const minersData = await Promise.all(minerDataPromises);

        // Sort by rank (lowest first)
        minersData.sort((a, b) => {
            const rankA = isNaN(a.rank) ? Infinity : Number(a.rank);
            const rankB = isNaN(b.rank) ? Infinity : Number(b.rank);
            return rankA - rankB;
        });

        const teamBalance = await getTeamBalance(selectedTeamId);
        const totalWeeklyBlocks = minersData.reduce((sum, miner) => sum + miner.weeklyBlocks, 0);

        saveCache(minersData);
        updateUI(minersData, teamBalance, totalWeeklyBlocks);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${selectedTeamId}:`, error);
        displayError("Unexpected error occurred while fetching miner data.");
    }
}

function updateUI(minersData, teamBalance = 0, totalWeeklyBlocks = 0) {
    const teamNameElement = document.getElementById('teamName');
    const balanceDisplay = document.getElementById('teamBalance');
    const weeklyBlocksDisplay = document.getElementById('weeklyBlocks');
    const minerTableBody = document.getElementById('minerTableBody');

    if (teamNameElement) teamNameElement.innerText = teams[selectedTeamId] || selectedTeamId;
    if (balanceDisplay) balanceDisplay.innerText = `Team Balance: ${formatBalance(teamBalance)}`;
    if (weeklyBlocksDisplay) weeklyBlocksDisplay.innerText = `Weekly Blocks: ${totalWeeklyBlocks}`;

    if (minerTableBody) {
        minerTableBody.innerHTML = minersData.map(({ miner_id, rank, balance, weeklyBlocks }, index) =>
            `<tr>
                <td>${index + 1}</td>
                <td><a href="https://starch.one/miner/${miner_id}" target="_blank" style="text-decoration: none; color: #007BFF;">${miner_id}</a></td>
                <td>${rank}</td>
                <td>${weeklyBlocks}</td>
                <td>${formatBalance(balance)}</td>
            </tr>`
        ).join('');
    }

    renderChart(minersData);
}

function populateTeamSelector() {
    const teamSelector = document.getElementById('teamSelector');
    if (!teamSelector) return;

    teamSelector.innerHTML = Object.entries(teams).map(([teamId, teamName]) => 
        `<option value="${teamId}">${teamName} (${teamId})</option>`
    ).join('');

    teamSelector.value = selectedTeamId;
    teamSelector.addEventListener('change', (event) => {
        selectedTeamId = event.target.value;
        fetchMinerData();
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

    minerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: minersData.map(({ miner_id }) => miner_id),
            datasets: [{
                label: 'Mined Blocks (24h)',
                data: minersData.map(({ weeklyBlocks }) => weeklyBlocks),
                backgroundColor: 'rgba(255, 215, 0, 0.8)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 1
            }]
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    populateTeamSelector();
    fetchMinerData();
    setInterval(fetchMinerData, 120000);
});
