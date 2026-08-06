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

    function initGovernanceLoader() {
        window.TDSPRuntime.bindIntentLoad(GOVERNANCE_TRIGGER_SELECTORS, loadGovernanceScript);
        window.TDSPRuntime.bindViewportLoad(GOVERNANCE_TARGET_SELECTORS, loadGovernanceScript, { rootMargin: '400px 0px' });
        scheduleIdleLoad();
    }

    window.TDSPRuntime.onReady(initGovernanceLoader);
}());
