const baseUrl = 'https://api.starch.one';
const teamId = 'B0ADAD';
const CACHE_KEY = 'B0ADAD';
const CACHE_EXPIRATION = 2 * 60 * 1000; // 2 minutes
const CONCURRENT_LIMIT = 10; // Fetch 10 miners at a time
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
    return response?.rank ?? 'N/Blk(W)';
}

async function getMinerStats(minerId) {
    const account = await fetchJson(`${baseUrl}/miners/${minerId}/account`);
    return account 
        ? { 
            balance: account.balance,  
            minedBlocks: Math.floor(account.blocks) || 0 
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
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRATION) {
            return data;
        }
    }
    return null;
}

function saveCache(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
}

async function fetchMinerData() {
    const cachedData = loadCache();
    if (cachedData) {
        console.log("✅ Using cached data");
        updateUI(cachedData, await getTeamBalance(teamId));
        return;
    }

    try {
        const miners = await getMinersByTeam(teamId);
        if (!miners.length) {
            updateUI([], await getTeamBalance(teamId));
            return;
        }

        let minersData = [];
        for (let i = 0; i < miners.length; i += CONCURRENT_LIMIT) {
            const batch = miners.slice(i, i + CONCURRENT_LIMIT);
            
            const minerDataPromises = batch.map(async ({ miner_id }) => {
                const [stats, rank] = await Promise.allSettled([
                    getMinerStats(miner_id),
                    getMinerWeeklyLeaderboard(miner_id)
                ]);

                return {
                    miner_id,
                    rank: rank.status === 'fulfilled' ? rank.value : 'N/A',
                    minedBlocks: stats.status === 'fulfilled' ? stats.value.minedBlocks : 0,
                    balance: stats.status === 'fulfilled' ? stats.value.balance : 0
                };
            });

            const batchResults = await Promise.all(minerDataPromises);
            minersData.push(...batchResults);
        }

        minersData.sort((a, b) => {
            const rankA = isNaN(a.rank) ? Infinity : Number(a.rank);
            const rankB = isNaN(b.rank) ? Infinity : Number(b.rank);
            return rankA - rankB;
        });

        const teamBalance = await getTeamBalance(teamId);
        saveCache(minersData);
        updateUI(minersData, teamBalance);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${teamId}:`, error);
        displayError("Unexpected error occurred while fetching miner data.");
    }
}

function updateUI(minersData, teamBalance = 0) {
    const tableBody = document.querySelector('#minersTable tbody');
    const totalBalanceRow = document.getElementById('totalBalanceRow');
    const chartCanvas = document.getElementById('minerChart');
    
    if (!chartCanvas) {
        console.error('Chart element not found');
        return;
    }

    const tableRows = minersData.map(({ miner_id, rank, minedBlocks, balance }, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><a href="https://starch.one/miner/${miner_id}" target="_blank" style="text-decoration: none; color: #007BFF;">${miner_id}</a></td>
            <td>${rank}</td>
            <td>${minedBlocks > 0 ? minedBlocks : '0'}</td>
            <td>${formatBalance(balance)}</td>
        </tr>
    `).join('');

    tableBody.innerHTML = tableRows || `<tr><td colspan="5">🚫 No miners found.</td></tr>`;

    const totalMinerBalance = minersData.reduce((sum, miner) => sum + miner.balance, 0);
    const totalMinedBlocks = minersData.reduce((sum, miner) => sum + miner.minedBlocks, 0);
    const totalBalance = totalMinerBalance + teamBalance;

    totalBalanceRow.innerHTML = `
        <td colspan="2"></td>
        <td></td>
        <td><strong>${totalMinedBlocks} Blocks</strong></td>
        <td><strong>${formatBalance(totalBalance)} $STRCH</strong></td>
    `;

    renderChart(minersData)
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

document.getElementById('refreshButton')?.addEventListener('click', fetchMinerData);

fetchMinerData();

setInterval(fetchMinerData, 120000);
