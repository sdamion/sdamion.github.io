const API_BASE_URL = "https://api.starch.one";
const TEAMS = ["B0ADAD", "868C0C"];

// Utility function to safely update UI elements
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.innerText = value;
}

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

async function fetchStats() {
    try {
        console.log("Fetching team data...");

        for (const teamID of TEAMS) {
            const [teamProfile, teamAccount, membersData] = await Promise.all([
                fetchData(`${API_BASE_URL}/teams/${teamID}/profile`),
                fetchData(`${API_BASE_URL}/teams/${teamID}/account`),
                fetchData(`${API_BASE_URL}/teams/${teamID}/members`)
            ]);

            updateElement(`team-name-${teamID}`, teamProfile?.name || "Unknown Team");
            updateElement(`team-balance-${teamID}`, teamAccount?.balance
                ? `${Number(teamAccount.balance).toLocaleString()} STRCH`
                : "0"
            );

            console.log(`Fetching miner data for Team ${teamID}...`);
            const membersArray = Array.isArray(membersData) ? membersData : membersData?.members || [];
            let minerBalances = 0, totalPendingBlocks = 0, totalMinedBlocks = 0, totalOnlineMiners = 0;

            if (membersArray.length > 0) {
                const minerDataPromises = membersArray.map(async (miner_id) => {
                    const [minerAccount, pendingBlocks, attendanceData] = await Promise.all([
                        fetchData(`${API_BASE_URL}/miners/${miner_id}/account`),
                        fetchData(`${API_BASE_URL}/pending_blocks/${miner_id}`),
                        fetchData(`${API_BASE_URL}/miners/${miner_id}/attendance`) // Get online status
                    ]);

                    minerBalances += minerAccount?.balance ? Number(minerAccount.balance) : 0;
                    totalMinedBlocks += minerAccount?.blocks ? Number(minerAccount.blocks) : 0;
                    totalPendingBlocks += pendingBlocks?.length || 0;

                    if (attendanceData?.status === "online") totalOnlineMiners++; // Count online miners
                });

                await Promise.all(minerDataPromises);
            }

            // Update UI with miner data
            updateElement(`total-miners-${teamID}`, membersArray.length.toString());
            updateElement(`total-miner-balance-${teamID}`, `${minerBalances.toLocaleString()} STRCH`);
            updateElement(`total-pending-blocks-${teamID}`, totalPendingBlocks.toString());
            updateElement(`total-mined-blocks-${teamID}`, totalMinedBlocks.toLocaleString());
            updateElement(`total-online-miners-${teamID}`, `${totalOnlineMiners} / ${membersArray.length}`); // Display Online Miners
        }

        updateElement("last-updated", `Last updated: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
        console.error("Error fetching stats:", error);
        for (const teamID of TEAMS) {
            ["team-name", "team-balance", "total-miners", "total-miner-balance", "total-pending-blocks", "total-mined-blocks", "total-online-miners"].forEach(idSuffix =>
                updateElement(`${idSuffix}-${teamID}`, "Error")
            );
        }
    }
}

// Fetch stats on page load and auto-update every 60 seconds
window.addEventListener("load", () => {
    fetchStats();
    setInterval(fetchStats, 60000);
});
