// --- API URLs ---
const IAGON_NODE_URL = 'https://www.tdsp.online/api/resource/6738f8cddce9fe405732f092';
const IAGON_PERFORMANCE_URL = `${IAGON_NODE_URL}/performance/history`;
const GECKOTERMINAL_IAG_URL = 'https://api.geckoterminal.com/api/v2/simple/networks/cardano/token_price/5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147';

// --- Globals to compute USD rewards ---
let currentRewards = null;
let currentIAGPrice = null;

function updateRewardUSD() {
    if (currentRewards !== null && currentIAGPrice !== null) {
        const usdValue = (currentRewards * currentIAGPrice).toFixed(2);
        const el = document.getElementById("reward-usd");
        if (el) el.textContent = `$${usdValue}`;
    }
}

async function fetchData() {
    try {
        const response = await fetch(IAGON_NODE_URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        // --- Basic Node Info ---
        const nameEl = document.getElementById("name");
        if (nameEl && data.name) nameEl.textContent = data.name;

        const statusEl = document.getElementById("status-text");
        if (statusEl) {
            const isOnline = data.runtime_details?.active_status;
            statusEl.innerHTML = isOnline
                ? '<span class="online">Online</span>'
                : '<span class="offline">Offline</span>';
        }

        const locationEl = document.getElementById("location");
        if (locationEl && data.location_details?.country) {
            locationEl.textContent = data.location_details.country;
        }

        // --- Storage Stats ---
        const storage = data.storage_details;
        if (storage) {
            const totalTB = (storage.storage_capacity ?? 0) / 1000;
            const committedTB = (storage.committed_storage_in_bytes ?? 0) / (1000 ** 4);
            const usedGB = (storage.storage_consumed_in_bytes ?? 0) / (1000 ** 3);
            const availableGB = (storage.storage_available_in_bytes ?? 0) / (1000 ** 3);
            const availableToStakeTB = (totalTB - committedTB);

            const setText = (id, value, unit) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value.toFixed(2) + ` ${unit}`;
            };

            setText("total-storage", totalTB, "TB");
            setText("committed-storage", committedTB, "TB");
            setText("used-storage", usedGB, "GB");
            setText("storage-available", availableGB, "GB");
            setText("available-to-stake", availableToStakeTB, "TB");
        }

        // --- Rewards & Staking ---
        const rewards = data.reward_details?.accumulated_reward?.quantity ?? 0;
        const fees = data.reward_details?.accumulated_fee?.quantity ?? 0;
        const staked = data.stake_details?.staked_amount?.quantity ?? 0;

        const stakedEl = document.getElementById("staked");
        if (stakedEl) stakedEl.textContent = (staked / 1e6).toFixed(2) + " IAG";

        const rewardsEl = document.getElementById("rewards");
        if (rewardsEl) rewardsEl.textContent = (rewards / 1e6).toFixed(2) + " IAG";

        const feesEl = document.getElementById("fees");
        if (feesEl) feesEl.textContent = (fees / 1e6).toFixed(6) + " ADA";

        currentRewards = rewards / 1e6;
        updateRewardUSD();

    } catch (error) {
        console.error("Error fetching node data:", error);
        const statusEl = document.getElementById("status-text");
        if (statusEl) statusEl.textContent = "Error Loading Data";
    }
}

// --- Fetch IAGON Performance History ---
async function fetchPerformanceData() {
    try {
        const response = await fetch(IAGON_PERFORMANCE_URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const performanceData = await response.json();
        if (!performanceData.success) throw new Error("Invalid performance history response");

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 8);

        const lastWeekData = performanceData.data
            .filter(entry => new Date(entry.date) >= sevenDaysAgo)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const dates = lastWeekData.map(entry =>
            new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        const scores = lastWeekData.map(entry => entry.score);

        updateChart(dates, scores);

    } catch (error) {
        console.error("Error fetching performance history:", error);
    }
}

// --- Update Performance Chart ---
function updateChart(dates, scores) {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const barColors = scores.map(() => {
        const gradient = ctx.createLinearGradient(30, 30, 30, 200);
        gradient.addColorStop(0, 'rgba(34, 167, 240, 0.7)');
        gradient.addColorStop(1, 'rgba(155, 89, 182, 0.7)');
        return gradient;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Performance Score',
                data: scores,
                backgroundColor: barColors,
                borderWidth: 0,
                borderRadius: 5,
                hoverBorderColor: 'black',
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...scores, 80) + 5
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutBounce'
            }
        }
    });
}

// --- Fetch IAG Token Price from GeckoTerminal ---
async function fetchIAGPrice() {
    try {
        const response = await fetch(GECKOTERMINAL_IAG_URL);
        if (!response.ok) throw new Error(`GeckoTerminal HTTP Error: ${response.status}`);

        const data = await response.json();
        const priceStr = data?.data?.attributes?.token_prices?.["5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147"];
        const iagPrice = parseFloat(priceStr)?.toFixed(6) || 'N/A';

        const el = document.getElementById("iag-price");
        if (el) el.textContent = `$${iagPrice}`;

        currentIAGPrice = parseFloat(priceStr);
        updateRewardUSD();

    } catch (error) {
        console.error("Error fetching IAG price:", error);
        const el = document.getElementById("iag-price");
        if (el) el.textContent = "N/A";
    }
}

// --- Initial Data Fetch ---
fetchData();
fetchPerformanceData();
fetchIAGPrice();

// --- Auto-refresh every hour ---
setInterval(() => {
    fetchData();
    fetchPerformanceData();
    fetchIAGPrice();
}, 1 * 60 * 60 * 1000);
