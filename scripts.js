// Fetch and display ADA and IAG prices asynchronously
async function fetchPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,cardano,iagon&vs_currencies=usd');
        const data = await response.json();

        const adaPrice = data.cardano.usd.toFixed(2);
        const iagPrice = data.iagon.usd.toFixed(2);

        document.getElementById('ada-price').textContent = `$${adaPrice}`;
        document.getElementById('iag-price').textContent = `$${iagPrice}`;
    } catch (error) {
        console.error('Error fetching prices:', error);
        document.getElementById('ada-price').textContent = 'N/A';
        document.getElementById('iag-price').textContent = 'N/A';
    }
}

// Navigate to details page
function goToDetails() {
    window.location.href = "details.html";
}

// Fetch prices on page load and set up auto-update
window.onload = () => {
    fetchPrices();

    // Auto-update prices every 60 seconds
    setInterval(fetchPrices, 60000);
};