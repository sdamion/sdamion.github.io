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
        return null;
    }
}

// Function to format balance with 3 decimals and "M"
function formatBalance(balance) {
    return balance ? `${(Number(balance) / 1_000_000).toFixed(3)}M` : "0M";
}

async function fetchStats() {
    try {
        console.log("Fetching team data...");
        let totalTeamBalance = 0;
        let totalCompanyBlocks = 0; // New variable to track company-wide blocks

        for (const teamID of TEAMS) {
            const [teamProfile, teamAccount, membersData] = await Promise.all([
                fetchData(`${API_BASE_URL}/teams/${teamID}/profile`),
                fetchData(`${API_BASE_URL}/teams/${teamID}/account`),
                fetchData(`${API_BASE_URL}/teams/${teamID}/members`)
            ]);

            const teamBalance = teamAccount?.balance ? Number(teamAccount.balance) : 0;
            totalTeamBalance += teamBalance;

            document.getElementById(`team-name-${teamID}`).innerText = teamProfile?.name || "Unknown Team";
            document.getElementById(`team-balance-${teamID}`).innerText = formatBalance(teamBalance);

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

                document.getElementById(`total-miners-${teamID}`).innerText = membersArray.length;
                document.getElementById(`total-miner-balance-${teamID}`).innerText = formatBalance(minerBalances);
                document.getElementById(`total-pending-blocks-${teamID}`).innerText = totalPendingBlocks;
                document.getElementById(`total-mined-blocks-${teamID}`).innerText = `${Number(totalMinedBlocks).toLocaleString()}`;
            } else {
                document.getElementById(`total-miners-${teamID}`).innerText = "0";
                document.getElementById(`total-miner-balance-${teamID}`).innerText = "0M";
                document.getElementById(`total-pending-blocks-${teamID}`).innerText = "0";
                document.getElementById(`total-mined-blocks-${teamID}`).innerText = "0";
            }

            // Add team mined blocks to total company blocks
            totalCompanyBlocks += totalMinedBlocks;
        }

        document.getElementById("total-teams-balance").innerText = formatBalance(totalTeamBalance);
        document.getElementById("total-company-blocks").innerText = `${Number(totalCompanyBlocks).toLocaleString()}`;

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
        document.getElementById("total-teams-balance").innerText = "Error";
        document.getElementById("total-company-blocks").innerText = "Error";
    }
}

// Fetch stats on page load and auto-update every 60 seconds
window.addEventListener("load", () => {
    fetchStats();
    setInterval(fetchStats, 60000);
});
