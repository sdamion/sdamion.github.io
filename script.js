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
            const tbody = table.querySelector("tbody"); // No thead needed

            // Clear previous table content
            tbody.innerHTML = "";

            function addRow(key, value) {
                // Exclude specific keys from being added
                const excludedKeys = ["code", "time", "msg", "pool_id", "name", "pool_id_hash", "position", "handles", "url", "img", "stats", "updated", "terms"];
                if (excludedKeys.includes(key.toLowerCase())) {
                    return;
                }

                const tr = document.createElement("tr");
                const tdKey = document.createElement("td");
                const tdValue = document.createElement("td");

                tdKey.textContent = key.replace(/_/g, " ").toUpperCase();

                // Special case: If key is "stake", "pledge", or "tax_fix", divide by 1 million
                if (["stake", "pledge", "tax_fix"].includes(key.toLowerCase()) && !isNaN(value)) {
                    value = (value / 1_000_000).toLocaleString() + " ADA";
                }

                if (typeof value === "object" && value !== null) {
                    // If value is an object, break it down into separate rows
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

            // Process each key-value pair from the JSON object
            Object.entries(data).forEach(([key, value]) => {
                addRow(key, value);
            });

            // Append Attribution Inside Table as a Row
            const trAttribution = document.createElement("tr");
            const tdAttribution = document.createElement("td");
            tdAttribution.setAttribute("colspan", "2"); // Make it span both columns
            tdAttribution.className = "attribution";
            tdAttribution.innerHTML = `
                <strong>Source:</strong> <a href="https://cexplorer.io" target="_blank">Cexplorer.io</a><br>
                <strong>Disclaimer:</strong> <a href="https://cexplorer.io/disclaimer" target="_blank">Cexplorer.io Disclaimer</a><br>
            `;

            trAttribution.appendChild(tdAttribution);
            tbody.appendChild(trAttribution); // Append attribution row inside the table
        })
        .catch(error => console.error("Error fetching the JSON data:", error));
});
