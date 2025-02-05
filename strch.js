const API_BASE_URL = "https://api.starch.one";

async function fetchStats() {
    try {
        const minersResponse = await fetch(`${API_BASE_URL}/teams/B0ADAD/members`);

        if (!minersResponse.ok) {
            throw new Error(`HTTP Error: ${minersResponse.status}`);
        }

        let minersData;
        try {
            minersData = await minersResponse.json();
        } catch (parseError) {
            throw new Error("Failed to parse JSON response from API.");
        }

        console.log("API Response:", minersData); // Debugging

        // Ensure the response is an array
        const membersArray = Array.isArray(minersData) ? minersData : (minersData.members && Array.isArray(minersData.members)) ? minersData.members : [];

        if (!Array.isArray(membersArray)) {
            throw new Error("Unexpected API response format: Expected an array.");
        }

        // Check if element exists before modifying it
        const activeMinersElement = document.getElementById("active-miners");
        const lastUpdatedElement = document.getElementById("last-updated");

        if (activeMinersElement) {
            activeMinersElement.innerText = membersArray.length;
        } else {
            console.warn("Element #active-miners not found in DOM.");
        }

        if (lastUpdatedElement) {
            lastUpdatedElement.innerText = new Date().toLocaleTimeString();
        } else {
            console.warn("Element #last-updated not found in DOM.");
        }

    } catch (error) {
        console.error("Error fetching stats:", error);
        const errorElement = document.getElementById("active-miners");
        if (errorElement) {
            errorElement.innerText = "Error";
        }
    }
}

// Fetch stats on page load and set up auto-update
window.addEventListener("load", () => {
    fetchStats();
    setInterval(fetchStats, 60000); // Auto-update every 60 seconds
});
