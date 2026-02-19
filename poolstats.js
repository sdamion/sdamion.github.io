document.addEventListener("DOMContentLoaded", function () {
    const poolInfoUrl = "https://www.tdsp.online/api/adastat/pool-info";
    const epochInfoUrl = "https://www.tdsp.online/api/adastat/epoch-info";

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
        const strong = document.createElement('strong');
        strong.textContent = label;
        tdKey.appendChild(strong);

        if (typeof value === "string" && value.startsWith("http")) {
            if (value.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
                const img = document.createElement('img');
                img.src = value;
                img.alt = 'Image';
                img.style.maxWidth = '100px';
                img.style.borderRadius = '10px';
                tdValue.appendChild(img);
            } else {
                const a = document.createElement('a');
                a.href = value;
                a.target = '_blank';
                a.textContent = value;
                tdValue.appendChild(a);
            }
        } else if (typeof value === "boolean") {
            tdValue.textContent = value ? "Yes" : "No";
        } else if (typeof value === "string" && value.includes("<span")) {
            // Parse small trusted HTML fragments safely
            const parser = new DOMParser();
            const frag = parser.parseFromString(value, 'text/html');
            Array.from(frag.body.childNodes).forEach(n => tdValue.appendChild(n));
        } else {
            tdValue.textContent = value;
        }

        tr.appendChild(tdKey);
        tr.appendChild(tdValue);
        tbody.appendChild(tr);
    }

    function fetchData() {
        Promise.all([
            fetch(poolInfoUrl),
            fetch(epochInfoUrl)
        ])
        .then(async ([poolResponse, epochResponse]) => {
            if (!poolResponse.ok || !epochResponse.ok) {
                throw new Error(`HTTP error! Status: Pool ${poolResponse.status}, Epoch ${epochResponse.status}`);
            }

            const poolJson = await poolResponse.json();
            const epochJson = await epochResponse.json();

            const table = document.getElementById("data-table");
            const tbody = table.querySelector("tbody");
            // Clear tbody safely without using innerHTML
            while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

            addRow(tbody, "Epoch", epochJson.data.epoch_no);
            addRow(tbody, "Ticker", poolJson.data.ticker);
            addRow(tbody, "Active Stake", formatAda(poolJson.data.active_stake));
            addRow(tbody, "Live Stake", formatAda(poolJson.data.live_stake));
            addRow(tbody, "Owner Stake", formatAda(poolJson.data.owner_stake));
            addRow(tbody, "Pledge", formatAda(poolJson.data.pledge));
            addRow(tbody, "Fixed Cost", formatAda(poolJson.data.fixed_cost));
            addRow(tbody, "Margin (%)", (parseFloat(poolJson.data.margin) * 100).toFixed(2) + " %");
            addRow(tbody, "Delegators", poolJson.data.delegator);
            addRow(tbody, "Mithril Certified", poolJson.data.mithril);

            if (Array.isArray(poolJson.data.relays)) {
                poolJson.data.relays.forEach((relay, index) => {
                    const status = relay.status.toLowerCase();
                    let displayLabel = relay.status;

                    if (status === "offline") {
                        displayLabel = "maintenance";
                    }

                    const coloredStatus = `<span style="font-weight: bold; color: ${status === "online" ? "green" : "orange"};">${displayLabel}</span>`;
                    addRow(tbody, `Relay ${index + 1}`, coloredStatus);
                });
            }
        })
        .catch(error => console.error("Error fetching the JSON data:", error));
    }

    function fetchPerformanceData() {
        console.log("Performance data fetch stub.");
    }

    fetchData();
    fetchPerformanceData();

    setInterval(() => {
        fetchData();
        fetchPerformanceData();
    }, 1 * 60 * 60 * 1000);
});