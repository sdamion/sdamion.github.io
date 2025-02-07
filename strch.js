const API_BASE_URL = "https://api.starch.one";
const TEAMS = ["B0ADAD", "868C0C"]; // Two teams

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
        console.log("Fetching team data...");

        // Fetch and display data for each team
        for (const teamID of TEAMS) {
            const [teamProfile, teamAccount, membersData] = await Promise.all([
                fetchData(`${API_BASE_URL}/teams/${teamID}/profile`),
                fetchData(`${API_BASE_URL}/teams/${teamID}/account`),
                fetchData(`${API_BASE_URL}/teams/${teamID}/members`)
            ]);

            // Update Team Name & Balance
            document.getElementById(`team-name-${teamID}`).innerText = teamProfile?.name || "Unknown Team";
            document.getElementById(`team-balance-${teamID}`).innerText = teamAccount?.balance
                ? `${Number(teamAccount.balance).toLocaleString()} STRCH`
                : "0";

            // Handle Miner Data
            console.log(`Fetching individual miner data for Team ${teamID}...`);
            const membersArray = Array.isArray(membersData) ? membersData : membersData?.members || [];
            let minerBalances = 0;
            let totalPendingBlocks = 0;
            let totalMinedBlocks = 0;

            if (membersArray.length > 0) {
                const minerDetails = await Promise.all(membersArray.map(async (miner_id) => {
                    const minerAccount = await fetchData(`${API_BASE_URL}/miners/${miner_id}/account`) || {};

                    minerBalances += minerAccount.balance ? Number(minerAccount.balance) : 0;
                    totalMinedBlocks += minerAccount.blocks ? Number(minerAccount.blocks) : 0;

                    const pendingBlocks = await fetchData(`${API_BASE_URL}/pending_blocks/${miner_id}`) || [];
                    totalPendingBlocks += pendingBlocks.length || 0;

                    return { miner_id, pendingBlocks, minerAccount };
                }));

                // Update UI with miner data
                document.getElementById(`total-miners-${teamID}`).innerText = membersArray.length;
                document.getElementById(`total-miner-balance-${teamID}`).innerText = `${Number(minerBalances).toLocaleString()} STRCH`;
                document.getElementById(`total-pending-blocks-${teamID}`).innerText = totalPendingBlocks;
                document.getElementById(`total-mined-blocks-${teamID}`).innerText = `${Number(totalMinedBlocks).toLocaleString()}`;
            } else {
                document.getElementById(`total-miners-${teamID}`).innerText = "0";
                document.getElementById(`total-miner-balance-${teamID}`).innerText = "0";
                document.getElementById(`total-pending-blocks-${teamID}`).innerText = "0";
                document.getElementById(`total-mined-blocks-${teamID}`).innerText = "0";
            }
        }

        // Update last updated time
        document.getElementById("last-updated").innerText = `Last updated: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error("Error fetching stats:", error);
        for (const teamID of TEAMS) {
            document.getElementById(`team-name-${teamID}`).innerText = "Error Loading Team";
            document.getElementById(`team-balance-${teamID}`).innerText = "Error";
            document.getElementById(`total-miners-${teamID}`).innerText = "Error";
            document.getElementById(`total-miner-balance-${teamID}`).innerText = "Error";
            document.getElementById(`total-pending-blocks-${teamID}`).innerText = "Error";
            document.getElementById(`total-mined-blocks-${teamID}`).innerText = "Error";
        }
    }
}

// Fetch stats on page load and auto-update every 60 seconds
window.addEventListener("load", () => {
    fetchStats();
    setInterval(fetchStats, 60000);
});
