async function fetchPrices() {
    try {
        // API Endpoints
        const minswapUrl = "https://api-mainnet.minswap.org/price";
        const coingeckoUrl = "https://api.coingecko.com/api/v3/simple/price?ids=iagon,cardano&vs_currencies=usd";

        // Fetch STRCH price from Minswap
        const minswapResponse = await fetch(minswapUrl);
        const minswapData = await minswapResponse.json();

        // STRCH Token Policy ID
        const starchPolicyId = "3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b39";

        // Find STRCH price in ADA
        let starchPriceADA = minswapData[starchPolicyId] ? parseFloat(minswapData[starchPolicyId].price) : null;

        // Fetch Iagon (IAG) & Cardano (ADA) prices from CoinGecko
        const coingeckoResponse = await fetch(coingeckoUrl);
        const coingeckoData = await coingeckoResponse.json();

        const iagonPriceUSD = coingeckoData.iagon?.usd || "N/A";
        const cardanoPriceUSD = coingeckoData.cardano?.usd || null;

        // Calculate Starch price in USD
        let starchPriceUSD = starchPriceADA && cardanoPriceUSD ? (starchPriceADA * cardanoPriceUSD).toFixed(6) : "N/A";

        // Update the webpage with fetched prices
        document.getElementById("iag-price").textContent = `Iagon (IAG) Price: $${iagonPriceUSD} USD`;
        document.getElementById("ada-price").textContent = `Cardano (ADA) Price: $${cardanoPriceUSD} USD`;
        document.getElementById("starch-ada").textContent = `Starch Token Price: ${starchPriceADA ? starchPriceADA.toFixed(6) : "N/A"} ADA`;
        document.getElementById("starch-usd").textContent = `Starch Token Price: $${starchPriceUSD} USD`;

    } catch (error) {
        console.error("Error fetching prices:", error);
        document.getElementById("iag-price").textContent = "Failed to fetch IAG price.";
        document.getElementById("ada-price").textContent = "Failed to fetch ADA price.";
        document.getElementById("starch-ada").textContent = "Failed to fetch Starch price.";
        document.getElementById("starch-usd").textContent = "Failed to fetch Starch price.";
    }
}

// Fetch prices when the page loads
fetchPrices();

// Refresh prices every 60 seconds
setInterval(fetchPrices, 60000);
