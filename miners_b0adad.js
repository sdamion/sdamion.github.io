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

// 🔹 Fetch Miner Data in Parallel (10 at a Time)
async function fetchMinerData() {
    const cachedData = loadCache();
    if (cachedData) {
        console.log("✅ Using cached data");
        updateUI(cachedData);
        return;
    }

    const tableBody = document.querySelector('#minersTable tbody');
    const totalBalanceRow = document.getElementById('totalBalanceRow');
    tableBody.innerHTML = `<tr><td colspan="5">⏳ Loading...</td></tr>`;

    try {
        const miners = await getMinersByTeam(teamId);
        if (!miners.length) {
            tableBody.innerHTML = `<tr><td colspan="5">🚫 No miners found for this team.</td></tr>`;
            totalBalanceRow.innerHTML = `<td colspan="5">🚫 No data available.</td>`;
            renderChart([]);
            return;
        }

        tableBody.innerHTML = '';

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

        saveCache(minersData);
        updateUI(minersData);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${teamId}:`, error);
        tableBody.innerHTML = `<tr><td colspan="5">❌ Error loading data.</td></tr>`;
        totalBalanceRow.innerHTML = `<td colspan="5">❌ Error calculating total balance.</td>`;
        displayError("Unexpected error occurred while fetching miner data.");
    }
}

function updateUI(minersData) {
    const tableBody = document.querySelector('#minersTable tbody');
    const totalBalanceRow = document.getElementById('totalBalanceRow');

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

    totalBalanceRow.innerHTML = `
        <td colspan="2"></td>
        <td></td>
        <td><strong>${totalMinedBlocks} Blocks</strong></td>
        <td><strong>${formatBalance(totalMinerBalance)} $STRCH</strong></td>
    `;

    renderChart(minersData);
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

// Fetch miner data initially
fetchMinerData();

// Auto refresh every 2 minutes
setInterval(fetchMinerData, 120000);
