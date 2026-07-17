(function () {
    async function loadGovernanceSection() {
        const container = document.getElementById('governance-container');
        if (!container) return;

        try {
            const response = await fetch('governance.html?v=20260714-header-counts', { credentials: 'same-origin' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const section = doc.querySelector('#governance');
            if (!section) throw new Error('Missing governance section');

            const loadedSection = document.importNode(section, true);
            container.replaceWith(loadedSection);
            loadGovernanceScript();
            document.dispatchEvent(new CustomEvent('tdsp:content-loaded'));
            if (window.location.hash === '#governance') {
                requestAnimationFrame(() => loadedSection.scrollIntoView());
            }
        } catch (error) {
            container.textContent = 'Governance content could not be loaded.';
        }
    }

    function loadGovernanceScript() {
        const script = document.createElement('script');
        script.src = 'governance.js?v=20260717-spo-details';
        script.defer = true;
        document.body.appendChild(script);
    }

    document.addEventListener('DOMContentLoaded', loadGovernanceSection);
})();
