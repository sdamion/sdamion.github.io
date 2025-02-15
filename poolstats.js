document.addEventListener("DOMContentLoaded", function () {
    const url = "https://js.cexplorer.io/api-static/pool/pool1ksye6zwlzaytspldngc3966aj79zkjvmkykydu2txay75c0krfp.json";

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const table = document.getElementById("data-table");
            const tbody = table.querySelector("tbody");

            // Clear previous table content
            tbody.innerHTML = "";

            function formatKeyName(key) {
                key = key.replace(/_/g, " ").toLowerCase();
                return key.charAt(0).toUpperCase() + key.slice(1);
            }

            function addRow(key, value) {
                // Excluded keys
                const excludedKeys = [
                    "code", "time", "msg", "pool_id", "name", "pool_id_hash", "position", "handles", "url", "img", "stats", "updated", "terms", "stake_active",
                    "est_epoch", "roa_short", "roa_lifetime", "luck_lifetime"
                ];
                if (excludedKeys.includes(key.toLowerCase())) {
                    return;
                }

                // Custom label mapping
                const keyMapping = {
                    "stake": "Total Stake",
                    "tax_ratio": "Margin (%)",
                    "tax_fix": "Fixed Cost"
                };

                const displayKey = keyMapping[key.toLowerCase()] || formatKeyName(key);

                const tr = document.createElement("tr");
                const tdKey = document.createElement("td");
                const tdValue = document.createElement("td");

                tdKey.innerHTML = `<strong>${displayKey}</strong>`; // Bold key text

                // Special case: Format ADA values
                if (["Total Stake", "Fixed Cost", "Pledge"].includes(displayKey) && !isNaN(value)) {
                    value = (value / 1_000_000).toLocaleString() + " ADA";
                }

                if (typeof value === "object" && value !== null) {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        addRow(subKey, subValue);
                    });
                    return;
                }

                // If value is a URL, create a clickable link
                if (typeof value === "string" && value.startsWith("http")) {
                    tdValue.innerHTML = `<a href="${value}" target="_blank">${value}</a>`;
                } 
                // If value is an image URL, display the image
                else if (typeof value === "string" && value.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
                    tdValue.innerHTML = `<img src="${value}" alt="Pool Image" style="max-width: 100px; border-radius: 10px;">`;
                } 
                else {
                    tdValue.textContent = value;
                }

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                tbody.appendChild(tr);
            }

            // Process each key-value pair from JSON
            Object.entries(data).forEach(([key, value]) => {
                addRow(key, value);
            });
        })
        .catch(error => console.error("Error fetching the JSON data:", error));
});
