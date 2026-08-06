(function () {
    const STARCH_SCRIPT_SRC = 'starch.js?v=20260806-lazy-starch';
    const STARCH_TARGET_SELECTORS = [
        '#starch',
        '#pool-starch-status-card'
    ];
    const STARCH_TRIGGER_SELECTORS = [
        'a[href="#starch"]',
        '#starch-companies-card',
        '#starch-miners-card',
        '#pool-starch-status-card'
    ];
    let starchScriptPromise = null;

    function loadStarchScript() {
        if (window.TDSPStarchReady === true) return Promise.resolve();
        if (starchScriptPromise) return starchScriptPromise;

        starchScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-starch-main]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = STARCH_SCRIPT_SRC;
            script.defer = true;
            script.dataset.starchMain = 'true';
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });

        return starchScriptPromise;
    }

    function activateStarchTarget(target) {
        if (!target || window.TDSPStarchReady === true) return false;
        if (!target.closest('#starch-companies-card,#starch-miners-card,#pool-starch-status-card')) return false;

        loadStarchScript().then(() => {
            if (target.closest('#starch-companies-card')) {
                window.openStarchDirectoryOverlay?.('companies', 'Companies', target.closest('#starch-companies-card'));
            } else if (target.closest('#starch-miners-card')) {
                window.openStarchDirectoryOverlay?.('miners', 'Miners', target.closest('#starch-miners-card'));
            } else if (target.closest('#pool-starch-status-card')) {
                window.openTdspStarchCompanyOverlay?.(target.closest('#pool-starch-status-card'));
            }
        }).catch(error => console.error(`Starch UI could not be loaded: ${error.message}`));
        return true;
    }

    function installInteractionTriggers() {
        document.addEventListener('pointerdown', event => {
            if (event.target.closest(STARCH_TRIGGER_SELECTORS.join(','))) loadStarchScript();
        }, { passive: true });

        document.addEventListener('click', event => {
            if (!activateStarchTarget(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);

        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (!activateStarchTarget(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);
    }

    function installViewportTrigger() {
        if (!('IntersectionObserver' in window)) return;
        const targets = STARCH_TARGET_SELECTORS
            .map(selector => document.querySelector(selector))
            .filter(Boolean);
        if (!targets.length) return;

        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            loadStarchScript();
        }, { rootMargin: '500px 0px' });

        targets.forEach(target => observer.observe(target));
    }

    function initStarchLoader() {
        window.TDSPStarch = Object.freeze({ load: loadStarchScript });
        installInteractionTriggers();
        installViewportTrigger();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStarchLoader, { once: true });
    } else {
        initStarchLoader();
    }
}());
