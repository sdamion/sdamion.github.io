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
            const thead = table.querySelector("thead");
            const tbody = table.querySelector("tbody");

            // Clear previous table content
            thead.innerHTML = "<tr><th>Key</th><th>Value</th></tr>";
            tbody.innerHTML = "";

            function formatValue(value) {
                if (typeof value === "object" && value !== null) {
                    return Object.entries(value).map(([key, val]) => 
                        `<strong>${key.replace(/_/g, " ").toUpperCase()}</strong>: ${val}`
                    ).join("<br>");
                }
                return value;
            }

            Object.entries(data).forEach(([key, value]) => {
                const tr = document.createElement("tr");
                const tdKey = document.createElement("td");
                const tdValue = document.createElement("td");

                tdKey.textContent = key.replace(/_/g, " ").toUpperCase();
                tdValue.innerHTML = formatValue(value);

                // If the value is a URL, make it a clickable link
                if (typeof value === "string" && value.startsWith("http")) {
                    tdValue.innerHTML = `<a href="${value}" target="_blank">${value}</a>`;
                }

                // If the value is an image, display it
                if (typeof value === "string" && value.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
                    tdValue.innerHTML = `<img src="${value}" alt="Pool Image" style="max-width: 100px; border-radius: 10px;">`;
                }

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error("Error fetching the JSON data:", error));
});