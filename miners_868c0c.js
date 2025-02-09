const baseUrl = 'https://api.starch.one';
const teamId = '868C0C'; // Fetching miners from this team

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
        ? { balance: account.balance, minedBlocks: account.blocks || 0 }
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

        // Fetch miner data concurrently
        const minerDataPromises = miners.map(async ({ miner_id }) => {
            // Show a temporary loading row for each miner
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

            // Update row with actual data
            row.innerHTML = `
                <td>${miner_id}</td>
                <td>${rank.status === 'fulfilled' ? rank.value : '0'}</td>
                <td>${stats.status === 'fulfilled' ? stats.value.minedBlocks : '0'}</td>
                <td>${stats.status === 'fulfilled' ? `${stats.value.balance}` : '0'}</td>
            `;
        });

        await Promise.all(minerDataPromises); // Wait for all miner data to load

    } catch (error) {
        console.error(`🚨 Error processing data for team ${teamId}:`, error);
        tableBody.innerHTML = `<tr><td colspan="4">❌ Error loading data.</td></tr>`;
    }
}

// Fetch and display miner data
fetchMinerData();
