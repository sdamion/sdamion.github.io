(function () {
    const GOVERNANCE_SCRIPT_SRC = 'governance.js?v=20260807-lovelace-format';
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

    function initGovernanceLoader() {
        window.TDSPRuntime.bindIntentLoad(GOVERNANCE_TRIGGER_SELECTORS, loadGovernanceScript);
        window.TDSPRuntime.bindViewportLoad(GOVERNANCE_TARGET_SELECTORS, loadGovernanceScript, { rootMargin: '400px 0px' });
        window.TDSPRuntime.scheduleIdle(loadGovernanceScript, { timeout: 8000 });
    }

    window.TDSPRuntime.onReady(initGovernanceLoader);
}());
