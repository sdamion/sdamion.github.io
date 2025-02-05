const API_BASE_URL = "https://api.starch.one";

async function fetchStats() {
    try {
        // Fetch active miners
        const minersResponse = await fetch(`${API_BASE_URL}/teams/B0ADAD/members`);
        if (!minersResponse.ok) throw new Error(`HTTP Error: ${minersResponse.status}`);

        const minersData = await minersResponse.json();
        console.log("API Response:", minersData); // Debugging

        // Check if the response is an array
        const membersArray = Array.isArray(minersData) ? minersData : minersData.members || [];

        if (!Array.isArray(membersArray)) {
            throw new Error("Unexpected API response format: Expected an array.");
        }

        document.getElementById("active-miners").innerText = membersArray.length;

        // Update last updated time
        document.getElementById("last-updated").innerText = new Date().toLocaleTimeString();
    } catch (error) {
        console.error("Error fetching stats:", error);
        document.getElementById("active-miners").innerText = "Error";
    }
}

// Fetch stats on page load and set up auto-update
window.onload = () => {
    fetchStats();
    setInterval(fetchStats, 60000); // Auto-update every 60 seconds
};
