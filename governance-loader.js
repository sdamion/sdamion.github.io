(function () {
    const GOVERNANCE_SCRIPT_SRC = 'governance.js?v=20260807-shared-proposal-type';
    const GOVERNANCE_TARGET_SELECTORS = [
        '#governance',
        '#drep',
        '#gov-spo-card',
        '#tdspbot-open',
        '#site-alerts-button'
    ];
    const GOVERNANCE_TRIGGER_SELECTORS = [
        'a[href="#governance"]',
        'a[href="#drep"]',
        '#gov-spo-card',
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
        loadGovernanceScript().catch(error => {
            console.error(`Governance data loader failed: ${error.message}`);
        });
    }

    window.TDSPRuntime.onReady(initGovernanceLoader);
}());
