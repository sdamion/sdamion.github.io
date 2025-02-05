document.addEventListener("DOMContentLoaded", function () {
    const baseUrl = "https://api.starch.one";

    async function fetchStarchPrice() {
        try {
            const response = await fetch(`${baseUrl}/market/strch/prices`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            document.getElementById("starch-price").innerText = `Starch Price: $${data.current_price}`;
        } catch (error) {
            console.error("Error fetching starch price:", error);
            document.getElementById("starch-price").innerText = "Failed to load Starch price.";
        }
    }

    async function fetchTeams() {
        try {
            const response = await fetch(`${baseUrl}/teams`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            const teamsTable = document.getElementById("teams-table");

            teamsTable.innerHTML = data.map(team => `
                <tr>
                    <td>${team.name}</td>
                    <td>${team.color_id}</td>
                    <td>${team.members_count}</td>
                </tr>
            `).join("");

            document.getElementById("loading-text").style.display = "none";
        } catch (error) {
            console.error("Error fetching teams:", error);
            document.getElementById("teams-table").innerHTML = "<tr><td colspan='3'>Failed to load teams.</td></tr>";
        }
    }

    async function fetchData() {
        await Promise.all([fetchStarchPrice(), fetchTeams()]);
    }

    fetchData();
});