async function fetchStarchPrice() {
    try {
        const response = await fetch('https://minswap.org/tokens/3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e');
        const text = await response.text();

        // Create a DOM parser to parse the fetched HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Assuming the price is within a specific element, e.g., a span with a class 'price'
        const priceElement = doc.querySelector('.price'); // Adjust the selector based on the actual HTML structure

        if (priceElement) {
            const price = priceElement.textContent.trim();
            document.getElementById('starch-price').textContent = `Starch Token Price: ${price}`;
        } else {
            document.getElementById('starch-price').textContent = 'Price not found.';
        }
    } catch (error) {
        console.error('Error fetching Starch Token price:', error);
        document.getElementById('starch-price').textContent = 'Failed to fetch price.';
    }
}

// Fetch the price when the page loads
fetchStarchPrice();

// Optionally, refresh the price every 60 seconds
setInterval(fetchStarchPrice, 60000);
