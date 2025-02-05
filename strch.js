const API_BASE_URL = "https://api.starch.one";
const TEAM_ID = "B0ADAD"; // Replace with your actual team ID

async function fetchStats() {
    try {
        // Fetch team profile
        const teamProfileResponse = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/profile`);
        if (!teamProfileResponse.ok) throw new Error(`HTTP Error: ${teamProfileResponse.status}`);

        const teamProfile = await teamProfileResponse.json();
        document.getElementById("team-name").innerText = teamProfile.name || "Unknown Team";

        // Fetch team account
        const teamAccountResponse = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/account`);
        if (!teamAccountResponse.ok) throw new Error(`HTTP Error: ${teamAccountResponse.status}`);

        const teamAccount = await teamAccountResponse.json();
        document.getElementById("team-balance").innerText = teamAccount.balance || "N/A";

        // Fetch team members
        const membersResponse = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/members`);
        if (!membersResponse.ok) throw new Error(`HTTP Error: ${membersResponse.status}`);

        const membersData = await membersResponse.json();
        const membersArray = Array.isArray(membersData) ? membersData : membersData.members || [];

        const minersListElement = document.getElementById("miners-list");
        minersListElement.innerHTML = "<li>Loading miner data...</li>";

        // Fetch achievements, pending blocks, and miner account for each miner
        const minersWithDetails = await Promise.all(membersArray.map(async (miner_id) => {
            try {
                // Fetch achievements
                const achievementsResponse = await fetch(`${API_BASE_URL}/achievements/${miner_id}`);
                const achievements = achievementsResponse.ok ? await achievementsResponse.json() : [];

                // Fetch pending blocks
                const pendingBlocksResponse = await fetch(`${API_BASE_URL}/pending_blocks/${miner_id}`);
                const pendingBlocks = pendingBlocksResponse.ok ? await pendingBlocksResponse.json() : [];

                // Fetch miner account
                const minerAccountResponse = await fetch(`${API_BASE_URL}/miners/${miner_id}/account`);
                const minerAccount = minerAccountResponse.ok ? await minerAccountResponse.json() : {};

                return { miner_id, achievements, pendingBlocks, minerAccount };
            } catch (error) {
                console.error(`Failed to fetch details for miner ${miner_id}:`, error);
                return { miner_id, achievements: ["Error fetching achievements"], pendingBlocks: ["Error fetching blocks"], minerAccount: {} };
            }
        }));

        // Update the list with miner details
        minersListElement.innerHTML = minersWithDetails.map(({ miner_id, achievements, pendingBlocks, minerAccount }) => `
            <strong>Miner:</strong> ${miner_id} <br> 
            <strong>Balance:</strong> ${minerAccount.balance || "N/A"}<br>
            <strong>Pending Blocks:</strong> ${pendingBlocks.length > 0 ? pendingBlocks.join(", ") : "None"}<br>
        `).join("");

        // Update active miners count
        document.getElementById("last-updated").innerText = new Date().toLocaleTimeString();

    } catch (error) {
        console.error("Error fetching stats:", error);
        document.getElementById("active-miners").innerText = "Error";
        document.getElementById("miners-list").innerHTML = "<li>Error loading data</li>";
        document.getElementById("team-name").innerText = "Error Loading Team";
        document.getElementById("team-balance").innerText = "Error";
    }
}

// Fetch stats on page load and auto-update every 60 seconds
window.addEventListener("load", () => {
    fetchStats();
    setInterval(fetchStats, 60000);
});
