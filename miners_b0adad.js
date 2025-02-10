const baseUrl = 'https://api.starch.one';
const teamId = 'B0ADAD'; // Fetching miners from this team
let minerChartInstance = null; // Store chart instance to clear before re-rendering

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`❌ Error fetching ${url}:`, error.message);
        return null;
    }
}

// Fetch miners from a team
async function getMinersByTeam(teamId) {
    const response = await fetchJson(`${baseUrl}/teams/${teamId}/members`);
    return response?.members ? response.members.map(minerId => ({ miner_id: minerId })) : [];
}

// Fetch weekly leaderboard rank for a miner
async function getMinerWeeklyLeaderboard(minerId) {
    const response = await fetchJson(`${baseUrl}/leaderboard/miners/${minerId}/week`);
    console.log(`🔎 Weekly Rank API Response for ${minerId}:`, response);
    return response?.rank ?? 'N/A';
}

// Fetch balance and mined blocks for a miner
async function getMinerStats(minerId) {
    const account = await fetchJson(`${baseUrl}/miners/${minerId}/account`);
    return account
        ? { balance: Math.floor(account.balance), minedBlocks: Math.floor(account.blocks) || 0 }
        : { balance: 0, minedBlocks: 0 };
}

// Render miner data in the table
async function fetchMinerData() {
    const tableBody = document.querySelector('#minersTable tbody');
    tableBody.innerHTML = `<tr><td colspan="4">⏳ Loading...</td></tr>`;

    try {
        const miners = await getMinersByTeam(teamId);
        if (!miners.length) {
            console.warn(`⚠️ No miners found for team ${teamId}`);
            tableBody.innerHTML = `<tr><td colspan="4">🚫 No miners found for this team.</td></tr>`;
            return;
        }

        tableBody.innerHTML = ''; // Clear loading state

        const minerData = {};

        // Fetch miner data concurrently
        const minerDataPromises = miners.map(async ({ miner_id }) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${miner_id}</td>
                <td>⏳</td>
                <td>⏳</td>
                <td>⏳</td>
            `;
            tableBody.appendChild(row);

            const [stats, rank] = await Promise.allSettled([
                getMinerStats(miner_id),
                getMinerWeeklyLeaderboard(miner_id)
            ]);

            const minedBlocks = stats.status === 'fulfilled' ? stats.value.minedBlocks : 0;
            const balance = stats.status === 'fulfilled' ? Math.floor(stats.value.balance) : 0;

            row.innerHTML = `
                <td>${miner_id}</td>
                <td>${rank.status === 'fulfilled' ? rank.value : 'N/A'}</td>
                <td>${minedBlocks}</td>
                <td>${balance}</td>
            `;

            minerData[miner_id] = { blocks: minedBlocks };
        });

        await Promise.all(minerDataPromises); // Wait for all miner data to load

        // Sort miner data by mined blocks in descending order
        const sortedMinerData = Object.entries(minerData)
            .sort(([, a], [, b]) => b.blocks - a.blocks)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

        renderChart(sortedMinerData);
    } catch (error) {
        console.error(`🚨 Error processing data for team ${teamId}:`, error);
        tableBody.innerHTML = `<tr><td colspan="4">❌ Error loading data.</td></tr>`;
    }
}

function renderChart(minerData) {
    const canvas = document.getElementById('minerChart');
    if (!canvas) {
        console.error('❌ Chart canvas not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    const labels = Object.keys(minerData);
    const data = Object.values(minerData).map(miner => miner.blocks);

    // Destroy existing chart before creating a new one
    if (minerChartInstance) {
        minerChartInstance.destroy();
    }

    minerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mined Blocks Over 24 Hours',
                data: data,
                backgroundColor: 'rgba(255, 215, 0, 0.8)', // Gold color
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    precision: 0 // Ensure only whole numbers are displayed
                }
            }
        }
    });
}

// Fetch and display miner data
fetchMinerData();
