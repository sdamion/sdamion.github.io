(function () {
    const GOVERNANCE_SCRIPT_SRC = 'governance.js?v=20260806-funding-overview-cache';
    const GOVERNANCE_TARGET_SELECTORS = [
        '#governance',
        '#drep',
        '#tdspbot-open',
        '#site-alerts-button'
    ];
    const GOVERNANCE_TRIGGER_SELECTORS = [
        'a[href="#governance"]',
        'a[href="#drep"]',
        '#tdspbot-open',
        '#site-alerts-button'
    ];
    let governanceScriptPromise = null;

    function loadGovernanceScript() {
        if (governanceScriptPromise) return governanceScriptPromise;

        governanceScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-governance-main]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = GOVERNANCE_SCRIPT_SRC;
            script.defer = true;
            script.dataset.governanceMain = 'true';
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });

        return governanceScriptPromise;
    }

    function scheduleIdleLoad() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadGovernanceScript, { timeout: 2500 });
            return;
        }
        window.setTimeout(loadGovernanceScript, 1200);
    }

    function installInteractionTriggers() {
        document.addEventListener('pointerdown', event => {
            if (event.target.closest(GOVERNANCE_TRIGGER_SELECTORS.join(','))) {
                loadGovernanceScript();
            }
        }, { passive: true });

        document.addEventListener('focusin', event => {
            if (event.target.closest(GOVERNANCE_TRIGGER_SELECTORS.join(','))) {
                loadGovernanceScript();
            }
        });
    }

    function installViewportTrigger() {
        if (!('IntersectionObserver' in window)) return;

        const targets = GOVERNANCE_TARGET_SELECTORS
            .map(selector => document.querySelector(selector))
            .filter(Boolean);
        if (!targets.length) return;

        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            loadGovernanceScript();
        }, { rootMargin: '400px 0px' });

        targets.forEach(target => observer.observe(target));
    }

    function initGovernanceLoader() {
        installInteractionTriggers();
        installViewportTrigger();
        scheduleIdleLoad();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGovernanceLoader, { once: true });
    } else {
        initGovernanceLoader();
    }
}());
