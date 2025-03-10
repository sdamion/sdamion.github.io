// API URLs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd';
const GECKOTERMINAL_API_URL = 'https://api.geckoterminal.com/api/v2/simple/networks/cardano/token_price/3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e,5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147,6d06570ddd778ec7c0cca09d381eca194e90c8cffa7582879735dbde584552,b6a7467ea1deb012808ef4e87b5ff371e85f7142d7b356a40d9b42a0436f726e75636f70696173205b76696120436861696e506f72742e696f5d';

// Token IDs from GeckoTerminal
const TOKEN_IDS = {
    STRCH: "3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e",
    IAG: "5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147",
    XER: "6d06570ddd778ec7c0cca09d381eca194e90c8cffa7582879735dbde584552",
    COPI: "b6a7467ea1deb012808ef4e87b5ff371e85f7142d7b356a40d9b42a0436f726e75636f70696173205b76696120436861696e506f72742e696f5d"
};

// Fetch and display ADA, IAG, STRCH, XER, and COPI prices asynchronously
async function fetchPrices() {
    try {
        // Fetch both API sources in parallel
        const [coingeckoResponse, geckoterminalResponse] = await Promise.all([
            fetch(COINGECKO_API_URL),
            fetch(GECKOTERMINAL_API_URL)
        ]);

        if (!coingeckoResponse.ok) throw new Error(`CoinGecko HTTP Error: ${coingeckoResponse.status}`);
        if (!geckoterminalResponse.ok) throw new Error(`GeckoTerminal HTTP Error: ${geckoterminalResponse.status}`);

        const coingeckoData = await coingeckoResponse.json();
        const geckoterminalData = await geckoterminalResponse.json();

        // Extract ADA price
        const adaPrice = coingeckoData.cardano?.usd?.toFixed(2) || 'N/A';

        // Extract token prices from GeckoTerminal
        const tokenPrices = geckoterminalData?.data?.attributes?.token_prices || {};
        const iagPrice = parseFloat(tokenPrices[TOKEN_IDS.IAG])?.toFixed(6) || 'N/A';
        const strchPrice = parseFloat(tokenPrices[TOKEN_IDS.STRCH])?.toFixed(12) || 'N/A';
        const xerPrice = parseFloat(tokenPrices[TOKEN_IDS.XER])?.toFixed(6) || 'N/A';
        const copiPrice = parseFloat(tokenPrices[TOKEN_IDS.COPI])?.toFixed(6) || 'N/A';

        // Update UI
        document.getElementById('ada-price').textContent = `$${adaPrice}`;
        document.getElementById('iag-price').textContent = `$${iagPrice}`;
        document.getElementById('strch-price').textContent = `$${strchPrice}`;
        document.getElementById('xer-price').textContent = `$${xerPrice}`;
        document.getElementById('copi-price').textContent = `$${copiPrice}`;

    } catch (error) {
        console.error('Error fetching prices:', error);
        document.getElementById('ada-price').textContent = 'N/A';
        document.getElementById('iag-price').textContent = 'N/A';
        document.getElementById('strch-price').textContent = 'N/A';
        document.getElementById('xer-price').textContent = 'N/A';
        document.getElementById('copi-price').textContent = 'N/A';
    }
}

// Navigate to details page
function goToDetails() {
    window.location.href = "details.html";
}

// Fetch prices on page load and set up auto-update
document.addEventListener("DOMContentLoaded", () => {
    fetchPrices();
    setInterval(fetchPrices, 60000); // Auto-update every 60 seconds
});
