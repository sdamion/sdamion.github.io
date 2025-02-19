const baseUrl = 'https://api.starch.one';
const teams = {
    'B0ADAD': 'TDSP01',
    '868C0C': 'TDSP02'
};
let selectedTeamId = Object.keys(teams)[0];
const CACHE_EXPIRATION = 2 * 60 * 1000; // 2 minutes
let minerChartInstance = null;

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`❌ Error fetching ${url}:`, error.message);
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

async function getMinerWeeklyLeaderboard(minerId) {
    const response = await fetchJson(`${baseUrl}/leaderboard/miners/${minerId}/week`);
    return response?.rank ?? 'N/A';
}

async function getMinerStats(minerId) {
    const account = await fetchJson(`${baseUrl}/miners/${minerId}/account`);
    return account 
        ? { 
            balance: account.balance,  
            minedBlocks: Math.floor(account.blocks) || 0,
        } 
        : { balance: 0, minedBlocks: 0 };
}

async function getTeamBalance(teamId) {
    const teamData = await fetchJson(`${baseUrl}/teams/${teamId}/account`);
    return teamData?.balance ?? 0;
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
        updateUI(cachedData, await getTeamBalance(selectedTeamId));
        return;
    }

    try {
        const miners = await getMinersByTeam(selectedTeamId);
        if (!miners.length) {
            updateUI([], await getTeamBalance(selectedTeamId));
            return;
        }

        // Fetch all miner data concurrently
        const minerDataPromises = miners.map(async ({ miner_id }) => {
            const [stats, rank] = await Promise.allSettled([
                getMinerStats(miner_id),
                getMinerWeeklyLeaderboard(miner_id)
            ]);

            return {
                miner_id,
                rank: rank.status === 'fulfilled' ? rank.value : 'N/A',
                minedBlocks: stats.status === 'fulfilled' ? stats.value.minedBlocks : 0,
                balance: stats.status === 'fulfilled' ? stats.value.balance : 0,
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
        saveCache(minersData);
        updateUI(minersData, teamBalance);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${selectedTeamId}:`, error);
        displayError("Unexpected error occurred while fetching miner data.");
    }
}

function updateUI(minersData, teamBalance = 0) {
    const teamNameElement = document.getElementById('teamName');
    const balanceDisplay = document.getElementById('teamBalance');
    const minerTableBody = document.getElementById('minerTableBody');

    if (teamNameElement) {
        teamNameElement.innerText = teams[selectedTeamId] || selectedTeamId;
    } else {
        console.error("🚨 Element with ID 'teamName' not found in the DOM.");
    }

    if (balanceDisplay) {
        balanceDisplay.innerText = `Team Balance: ${formatBalance(teamBalance)}`;
    } else {
        console.error("🚨 Element with ID 'teamBalance' not found in the DOM.");
    }

    if (minerTableBody) {
        minerTableBody.innerHTML = minersData.map(({ miner_id, rank, minedBlocks, balance }, index) =>
            `<tr>
                <td>${index + 1}</td>
                <td><a href="https://starch.one/miner/${miner_id}" target="_blank" style="text-decoration: none; color: #007BFF;">${miner_id}</a></td>
                <td>${rank}</td>
                <td>${minedBlocks}</td>
                <td>${formatBalance(balance)}</td>
            </tr>`
        ).join('');
    } else {
        console.error("🚨 Element with ID 'minerTableBody' not found in the DOM.");
    }

    renderChart(minersData);
}
function populateTeamSelector() {
    const teamSelector = document.getElementById('teamSelector');
    if (!teamSelector) {
        console.error("🚨 Element with ID 'teamSelector' not found in the DOM.");
        return;
    }

    teamSelector.innerHTML = Object.entries(teams).map(([teamId, teamName]) => 
        `<option value="${teamId}">${teamName} (${teamId})</option>`
    ).join('');

    // Set default selection
    teamSelector.value = selectedTeamId;

    // Trigger data fetch when selection changes
    teamSelector.addEventListener('change', (event) => {
        selectedTeamId = event.target.value;
        fetchMinerData();
    });
}

function renderChart(minersData) {
    const canvas = document.getElementById('minerChart');
    if (!canvas) {
        console.error('❌ Chart canvas not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (minerChartInstance) {
        minerChartInstance.destroy();
    }

    if (!minersData.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = "center";
        ctx.fillText('No Data Available', canvas.width / 2, canvas.height / 2);
        return;
    }

    const labels = minersData.map(({ miner_id }) => miner_id);
    const data = minersData.map(({ minedBlocks }) => minedBlocks);

    minerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Mined Blocks (24h)',
                data,
                backgroundColor: 'rgba(255, 215, 0, 0.8)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    precision: 0
                }
            }
        }
    });
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    populateTeamSelector(); // Load teams into the dropdown

    const customTeamId = document.getElementById('customTeamId');
    const refreshButton = document.getElementById('refreshButton');

    if (customTeamId) {
        customTeamId.addEventListener('input', (event) => {
            event.target.value = event.target.value.toUpperCase(); // Convert to uppercase
        });

        customTeamId.addEventListener('change', (event) => {
            selectedTeamId = event.target.value.toUpperCase(); // Ensure uppercase when selected
            fetchMinerData();
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', fetchMinerData);
    }

    fetchMinerData();
    setInterval(fetchMinerData, 120000);
});


