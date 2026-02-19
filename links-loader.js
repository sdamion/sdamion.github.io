// links-loader.js
(function() {
    const nonce = (document.currentScript && document.currentScript.getAttribute('nonce')) || null;

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

            // Load links.js after HTML is injected
            const script = document.createElement('script');
            script.src = 'links.js';
            script.defer = true;
            if (nonce) script.setAttribute('nonce', nonce);
            document.body.appendChild(script);
        })
        .catch(error => console.error('Error loading links.html:', error));
})();
