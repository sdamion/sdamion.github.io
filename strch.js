const API_BASE_URL = "https://api.starch.one";
const TEAM_ID = "B0ADAD"; // Replace with your actual team ID

// General function to fetch data with error handling
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null; // Return null instead of breaking the whole function
    }
}

async function fetchStats() {
    try {
        console.log("Fetching team, circulating supply, and market cap data...");

        // Fetch team profile, account, circulating supply, and market cap in parallel
        const [teamProfile, teamAccount, circulatingSupply, marketCapData] = await Promise.all([
            fetchData(`${API_BASE_URL}/teams/${TEAM_ID}/profile`),
            fetchData(`${API_BASE_URL}/teams/${TEAM_ID}/account`),
            fetchData(`${API_BASE_URL}/assets/strch/circulating_supply`),
            fetchData(`${API_BASE_URL}/market/strch/prices`) // Fetch market cap data
        ]);

        // Update Team Name
        document.getElementById("team-name").innerText = teamProfile?.name || "Unknown Team";

        // Update Team Balance
        document.getElementById("team-balance").innerText = teamAccount?.balance 
            ? `${Number(teamAccount.balance).toLocaleString()} STRCH`
            : "N/A";

        // Update Circulating Supply
        console.log("Circulating Supply Response:", circulatingSupply);
        document.getElementById("circulating-supply").innerText = circulatingSupply?.strch
            ? `${Number(circulatingSupply.strch).toLocaleString()} STRCH`
            : "N/A";

        // Update Market Cap (from API directly)
        console.log("Market Cap Response:", marketCapData);
        document.getElementById("market-cap").innerText = marketCapData?.amount
            ? `${Number(marketCapData.amount).toLocaleString()} ADA`
            : "N/A";

        // Fetch Team Members
        console.log("Fetching miners...");
        const membersData = await fetchData(`${API_BASE_URL}/teams/${TEAM_ID}/members`);
        const membersArray = Array.isArray(membersData) ? membersData : membersData?.members || [];

        const minersListElement = document.getElementById("miners-list");
        minersListElement.innerHTML = "<li>Loading miner data...</li>";

        if (membersArray.length === 0) {
            minersListElement.innerHTML = "<li>No miners found.</li>";
            return;
        }

        // Fetch details for each miner
        const minersWithDetails = await Promise.all(membersArray.map(async (miner_id) => {
            const [pendingBlocks, minerAccount] = await Promise.all([
                fetchData(`${API_BASE_URL}/pending_blocks/${miner_id}`) || [],
                fetchData(`${API_BASE_URL}/miners/${miner_id}/account`) || {}
            ]);

            return { miner_id, pendingBlocks, minerAccount };
        }));

        // Update the UI with miner details
        minersListElement.innerHTML = minersWithDetails.map(({ miner_id, pendingBlocks, minerAccount }) => `
            <li>
                <strong>Miner:</strong> ${miner_id} <br> 
                <strong>Balance:</strong> ${minerAccount.balance ? Number(minerAccount.balance).toLocaleString() + " STRCH" : "N/A"}<br>
                <strong>Pending Blocks:</strong> ${pendingBlocks.length ? pendingBlocks.join(", ") : "None"}
            </li>
        `).join("");

        // Update last updated time
        document.getElementById("last-updated").innerText = `Last updated: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error("Error fetching stats:", error);
        document.getElementById("team-name").innerText = "Error Loading Team";
        document.getElementById("team-balance").innerText = "Error";
        document.getElementById("circulating-supply").innerText = "Error";
        document.getElementById("market-cap").innerText = "Error";
        document.getElementById("miners-list").innerHTML = "<li>Error loading data</li>";
    }
}

// Fetch stats on page load and auto-update every 60 seconds
window.addEventListener("load", () => {
    fetchStats();
    setInterval(fetchStats, 60000);
});