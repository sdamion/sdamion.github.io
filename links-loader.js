// links-loader.js
(function() {
    fetch('links.html')
        .then(response => response.text())
        .then(data => {
            // Parse fetched HTML and append safely to container (avoid innerHTML)
            const container = document.getElementById('links-container');
            if (container) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                // Move children into the container
                Array.from(doc.body.childNodes).forEach(node => container.appendChild(node));
            }

            const script = document.createElement('script');
            script.src = 'stake.js';
            script.defer = true;
            document.body.appendChild(script);
        })
        .catch(error => console.error('Error loading links.html:', error));
})();
