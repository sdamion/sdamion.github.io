// page-loader.js
(function(){
    const nonce = (document.currentScript && document.currentScript.getAttribute('nonce')) || null;

    const pages = [
        { file: 'about.html', containerId: 'about-page-container' },
        { file: 'poolstats.html', containerId: 'poolstats-page-container' },
        { file: 'starch.html', containerId: 'starch-page-container' },
        { file: 'miner.html', containerId: 'miner-page-container' },
        { file: 'links.html', containerId: 'links-page-container' }
    ];

    async function loadPageInto(file, containerId) {
        try {
            const res = await fetch(file, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            const container = document.getElementById(containerId);
            if (!container) return;

            // Prefer the main element's children (avoid header/footer duplicates)
            const main = doc.querySelector('main') || doc.querySelector('.container') || doc.body;
            Array.from(main.childNodes).forEach(node => {
                // Skip scripts (we load external scripts separately)
                if (node.nodeName.toLowerCase() === 'script') return;
                // Skip duplicate global sections if present
                if (node.nodeType === 1) { // element
                    const el = /** @type {Element} */ (node);
                    if (el.matches && (el.matches('header') || el.matches('footer') || el.matches('.site-header') || el.matches('.site-footer') || el.matches('.links') || el.matches('nav'))) return;
                }
                container.appendChild(document.importNode(node, true));
            });

            // Load external scripts found in fetched doc (safe: only external src)
            Array.from(doc.querySelectorAll('script[src]')).forEach(s => {
                const script = document.createElement('script');
                script.src = s.getAttribute('src');
                script.defer = true;
                if (nonce) script.setAttribute('nonce', nonce);
                document.body.appendChild(script);
            });
        } catch (err) {
            console.error('Error loading', file, err);
            const container = document.getElementById(containerId);
            if (container) container.textContent = 'Failed to load content.';
        }
    }

    // Load pages in sequence (non-blocking)
    pages.forEach(p => loadPageInto(p.file, p.containerId));
})();
