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
    function loadGovernanceScript() {
        return window.TDSPRuntime.loadScript(GOVERNANCE_SCRIPT_SRC, {
            datasetName: 'governanceMain',
            selector: 'script[data-governance-main]',
            ready: () => (null ? true : null)
        });
    }

    function scheduleIdleLoad() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadGovernanceScript, { timeout: 8000 });
            return;
        }
        window.setTimeout(loadGovernanceScript, 6000);
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

    window.TDSPRuntime.onReady(initGovernanceLoader);
}());
