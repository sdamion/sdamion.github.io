const baseUrl = 'https://api.starch.one';
const teams = {
    'B0ADAD': '50% Company',
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
    return response?.members?.slice(0, 200) || [];
}

async function getTeamBalance(teamId) {
    const response = await fetchJson(`${baseUrl}/teams/${teamId}/account`);
    return response?.balance ?? 0;
}

async function getWeeklyLeaderboard() {
    const response = await fetchJson(`${baseUrl}/leaderboard/week`);
    return response?.miners ?? [];
}

async function getMinerBalance(minerId) {
    const response = await fetchJson(`${baseUrl}/miners/${minerId}/account`);
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
        const [miners, leaderboardData] = await Promise.all([
            getMinersByTeam(selectedTeamId),
            getWeeklyLeaderboard()
        ]);

        if (!miners.length) {
            const teamBalance = await getTeamBalance(selectedTeamId);
            updateUI([], teamBalance, 0);
            return;
        }

        const leaderboardMap = new Map(
            leaderboardData.map(({ miner_id, rank, balance, blocks }) => 
                [miner_id, { rank, balance, blocks }]
            )
        );

        // Fetch balances in parallel for all miners
        const minerBalances = await Promise.all(miners.map(miner_id => getMinerBalance(miner_id)));

        // Process miner data
        const minersData = miners.map((miner_id, index) => ({
            miner_id,
            rank: leaderboardMap.get(miner_id)?.rank ?? 'N/A',
            balance: Number(minerBalances[index]) || 0,
            weeklyBlocks: leaderboardMap.get(miner_id)?.blocks ?? 0
        }));

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
    if (balanceDisplay) {
        let html = `Company Balance: ${formatBalance(teamBalance)}`;
        if (selectedTeamId === 'B0ADAD') {
            const giveawayBalance = teamBalance / 2;
            html += `<br>🎁 Giveaway Balance (50%): ${formatBalance(giveawayBalance)}`;
        }
        balanceDisplay.innerHTML = html;
    }    
    if (weeklyBlocksDisplay) weeklyBlocksDisplay.innerText = `Weekly Blocks: ${totalWeeklyBlocks}`;

    if (minerTableBody) {
        minerTableBody.innerHTML = minersData.map(({ miner_id, rank, balance, weeklyBlocks }, index) =>
            `<tr>
                <td>${index + 1}</td>
                <td><a href="https://starch.one/miner/${miner_id}" target="_blank" style="text-decoration: none; color: #007BFF;">${miner_id}</a></td>
                <td>${rank}</td>
                <td>${weeklyBlocks}</td>
                <td>${balance ? formatBalance(balance) : '0.000M'}</td>
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
                displayError("Invalid Team ID! Must be a 6-character HEX code.");
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
