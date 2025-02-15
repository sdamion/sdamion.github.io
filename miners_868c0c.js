const baseUrl = 'https://api.starch.one';
const teamId = '868C0C';
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

// Display error messages in UI
function displayError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.innerHTML = `<p style="color: red;">❌ ${message}</p>`;
    }
}

// Fetch team balance (full precision)
async function getTeamBalance(teamId) {
    const response = await fetchJson(`${baseUrl}/teams/${teamId}/account`);
    return response ? response.balance : 0;
}

// Fetch miners from the team (limited to 50 to prevent API overload)
async function getMinersByTeam(teamId) {
    const response = await fetchJson(`${baseUrl}/teams/${teamId}/members`);
    return response?.members?.slice(0, 50).map(minerId => ({ miner_id: minerId })) || []; 
}

// Fetch weekly rank for a miner
async function getMinerWeeklyLeaderboard(minerId) {
    const response = await fetchJson(`${baseUrl}/leaderboard/miners/${minerId}/week`);
    return response?.rank ?? 'N/A';
}

// Fetch miner stats (full precision balance & mined blocks)
async function getMinerStats(minerId) {
    const account = await fetchJson(`${baseUrl}/miners/${minerId}/account`);
    return account 
        ? { 
            balance: account.balance,  
            minedBlocks: Math.floor(account.blocks) || 0 
        } 
        : { balance: 0, minedBlocks: 0 };
}

// Format balance in millions
const formatBalance = (balance) => 
    new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(balance / 1_000_000) + 'M';

// Fetch miner data and display it in the table
async function fetchMinerData() {
    const tableBody = document.querySelector('#minersTable tbody');
    const totalBalanceRow = document.getElementById('totalBalanceRow');
    tableBody.innerHTML = `<tr><td colspan="5">⏳ Loading...</td></tr>`;

    try {
        const miners = await getMinersByTeam(teamId);
        if (!miners.length) {
            console.warn(`⚠️ No miners found for team ${teamId}`);
            tableBody.innerHTML = `<tr><td colspan="5">🚫 No miners found for this team.</td></tr>`;
            totalBalanceRow.innerHTML = `<td colspan="5">🚫 No data available.</td>`;
            renderChart([]); // Render empty chart
            return;
        }

        tableBody.innerHTML = ''; // Clear loading state

        const minerDataPromises = miners.map(async ({ miner_id }) => {
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

        const minersData = await Promise.all(minerDataPromises);

// Sort by rank (ascending), treating "N/A" as the lowest rank
minersData.sort((a, b) => {
    const rankA = isNaN(a.rank) ? Infinity : Number(a.rank);
    const rankB = isNaN(b.rank) ? Infinity : Number(b.rank);
    return rankA - rankB;
});


        // Generate table rows with numbering
        const tableRows = minersData.map(({ miner_id, rank, minedBlocks, balance }, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><a href="https://starch.one/miner/${miner_id}" target="_blank" style="text-decoration: none; color: #007BFF;">${miner_id}</a></td>
                <td>${rank}</td>
                <td>${minedBlocks}</td>
                <td>${formatBalance(balance)}</td>
            </tr>
        `).join('');

        tableBody.innerHTML = tableRows || `<tr><td colspan="5">🚫 No miners found.</td></tr>`;

        // Calculate total miner balance (using full precision)
        const totalMinerBalance = minersData.reduce((sum, miner) => sum + miner.balance, 0);
        
        // Fetch team balance (full precision)
        const teamBalance = await getTeamBalance(teamId);

        // Calculate total balance (full precision)
        const totalBalance = totalMinerBalance + teamBalance;

        // Display formatted total balance
        totalBalanceRow.innerHTML = `
            <td colspan="4"><strong>Total</strong> (Miners + Company)<strong>:</strong></td>
            <td><strong>${formatBalance(totalBalance)}</strong></td>
        `;

        renderChart(minersData);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${teamId}:`, error);
        tableBody.innerHTML = `<tr><td colspan="5">❌ Error loading data.</td></tr>`;
        totalBalanceRow.innerHTML = `<td colspan="5">❌ Error calculating total balance.</td>`;
        displayError("Unexpected error occurred while fetching miner data.");
    }
}

// Render miner chart
function renderChart(minersData) {
    const canvas = document.getElementById('minerChart');
    if (!canvas) {
        console.error('❌ Chart canvas not found!');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Clear previous chart instance
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

// Event Listener for Refresh Button
document.getElementById('refreshButton')?.addEventListener('click', fetchMinerData);

// Initialize data fetch
fetchMinerData();
