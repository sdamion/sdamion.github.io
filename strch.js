document.addEventListener("DOMContentLoaded", function() {
    const API_BASE_URL = "https://api.starch.one";
    let historyChart;

    async function fetchStats() {
        try {
            // Fetch active miners
            const minersResponse = await fetch(`${API_BASE_URL}/teams/B0ADAD/members`);
            const minersData = await minersResponse.json();
            const activeMiners = minersData?.filter(miner => miner.status === "active") || [];
            document.getElementById("active-miners").innerText = activeMiners.length;

            // Display active miners list
            const activeMinersList = document.getElementById("active-miners-list");
            activeMinersList.innerHTML = activeMiners.map(miner => `<li>${miner.name}</li>`).join("");

            // Fetch Starch (STRCH) Price
            const priceResponse = await fetch(`${API_BASE_URL}/market/strch/prices`);
            const priceData = await priceResponse.json();
            document.getElementById("starch-price").innerText = priceData?.price || "N/A";

            // Update last updated time
            document.getElementById("last-updated").innerText = new Date().toLocaleTimeString();
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Fetch data every 49 seconds (CSP-compliant)
    fetchStats();
    setInterval(fetchStats, 49 * 1000);
});