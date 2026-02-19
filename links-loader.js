// links-loader.js
(function() {
    const nonce = (document.currentScript && document.currentScript.getAttribute('nonce')) || null;

    fetch('links.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('links-container').innerHTML = data;

            // Load links.js after HTML is injected
            const script = document.createElement('script');
            script.src = 'links.js';
            script.defer = true;
            if (nonce) script.setAttribute('nonce', nonce);
            document.body.appendChild(script);
        })
        .catch(error => console.error('Error loading links.html:', error));
})();
