document.addEventListener("DOMContentLoaded", function () {
    const poolInfoUrl = "https://www.tdsp.online/api/adastat/pool-info";

    function formatKeyName(key) {
        key = key.replace(/_/g, " ").toLowerCase();
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function formatAda(value) {
        return (value / 1_000_000).toLocaleString() + " ADA";
    }

    function addRow(tbody, label, value) {
        const tr = document.createElement("tr");
        const tdKey = document.createElement("td");
        const tdValue = document.createElement("td");

        tdKey.innerHTML = `<strong>${label}</strong>`;

        if (typeof value === "string" && value.startsWith("http")) {
            if (value.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
                tdValue.innerHTML = `<img src="${value}" alt="Image" style="max-width: 100px; border-radius: 10px;">`;
            } else {
                tdValue.innerHTML = `<a href="${value}" target="_blank">${value}</a>`;
            }
        } else if (typeof value === "boolean") {
            tdValue.textContent = value ? "Yes" : "No";
        } else {
            tdValue.textContent = value;
        }

        tr.appendChild(tdKey);
        tr.appendChild(tdValue);
        tbody.appendChild(tr);
    }

    function fetchData() {
        fetch(poolInfoUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(json => {
                const data = json.data;
                const table = document.getElementById("data-table");
                const tbody = table.querySelector("tbody");
                tbody.innerHTML = ""; // Clear previous data

                // Selected fields
                addRow(tbody, "Ticker", data.ticker);
                addRow(tbody, "Active Stake", formatAda(data.active_stake));
                addRow(tbody, "Live Stake", formatAda(data.live_stake));
                addRow(tbody, "Owner Stake", formatAda(data.owner_stake));
                addRow(tbody, "Pledge", formatAda(data.pledge));
                addRow(tbody, "Fixed Cost", formatAda(data.fixed_cost));
                addRow(tbody, "Margin (%)", (parseFloat(data.margin) * 100).toFixed(2) + " %");
                addRow(tbody, "Delegators", data.delegator);
                addRow(tbody, "Mithril Certified", data.mithril);

                // Relays
                if (Array.isArray(data.relays)) {
                    data.relays.forEach((relay, index) => {
                        const relayInfo = `${relay.status}`;
                        addRow(tbody, `Relay ${index + 1}`, relayInfo);
                    });
                }
            })
            .catch(error => console.error("Error fetching the JSON data:", error));
    }

    // Optional: if you have performance data
    function fetchPerformanceData() {
        // Placeholder for additional data fetching
        // Add similar fetch logic here if needed
        console.log("Performance data fetch stub.");
    }

    // Initial fetch
    fetchData();
    fetchPerformanceData();

    // Auto-refresh every 12 hours
    setInterval(() => {
        fetchData();
        fetchPerformanceData();
    }, 12 * 60 * 60 * 1000);
});