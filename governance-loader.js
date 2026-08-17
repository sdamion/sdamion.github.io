(function () {
    const GOVERNANCE_RICH_TEXT_SCRIPT_SRC = 'governance-rich-text.js?v=20260817-modular-rich-text';
    const GOVERNANCE_ASSISTANT_SCRIPT_SRC = 'governance-assistant.js?v=20260817-modular-assistant';
    const GOVERNANCE_FUNDING_DIRECTORY_SCRIPT_SRC = 'governance-funding-directory.js?v=20260817-modular-funding-directory';
    const GOVERNANCE_PIE_CHART_SCRIPT_SRC = 'governance-pie-chart.js?v=20260817-modular-pie-chart';
    const GOVERNANCE_CIPS_SCRIPT_SRC = 'governance-cips.js?v=20260817-modular-cips';
    const GOVERNANCE_NCL_SCRIPT_SRC = 'governance-ncl.js?v=20260817-ncl-actions';
    const GOVERNANCE_NOTIFICATIONS_SCRIPT_SRC = 'governance-notifications.js?v=20260817-modular-notifications';
    const GOVERNANCE_EPOCH_CLOCK_SCRIPT_SRC = 'governance-epoch-clock.js?v=20260817-modular-epoch-clock';
    const GOVERNANCE_SCRIPT_SRC = 'governance.js?v=20260817-modular-epoch-clock';
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
    function loadGovernanceRichTextScript() {
        return window.TDSPRuntime.loadScript(GOVERNANCE_RICH_TEXT_SCRIPT_SRC, {
            datasetName: 'governanceRichText',
            selector: 'script[data-governance-rich-text]',
            ready: () => window.TDSPGovernanceRichText || null
        });
    }

    function loadGovernanceScript() {
        return loadGovernanceRichTextScript().then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_ASSISTANT_SCRIPT_SRC, {
                datasetName: 'governanceAssistant',
                selector: 'script[data-governance-assistant]',
                ready: () => window.TDSPGovernanceAssistant || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_FUNDING_DIRECTORY_SCRIPT_SRC, {
                datasetName: 'governanceFundingDirectory',
                selector: 'script[data-governance-funding-directory]',
                ready: () => window.TDSPFundingDirectory || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_PIE_CHART_SCRIPT_SRC, {
                datasetName: 'governancePieChart',
                selector: 'script[data-governance-pie-chart]',
                ready: () => window.TDSPPieChart || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_CIPS_SCRIPT_SRC, {
                datasetName: 'governanceCips',
                selector: 'script[data-governance-cips]',
                ready: () => window.TDSPCips || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_NCL_SCRIPT_SRC, {
                datasetName: 'governanceNcl',
                selector: 'script[data-governance-ncl]',
                ready: () => window.TDSPNcl || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_NOTIFICATIONS_SCRIPT_SRC, {
                datasetName: 'governanceNotifications',
                selector: 'script[data-governance-notifications]',
                ready: () => window.TDSPGovernanceNotifications || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_EPOCH_CLOCK_SCRIPT_SRC, {
                datasetName: 'governanceEpochClock',
                selector: 'script[data-governance-epoch-clock]',
                ready: () => window.TDSPEpochClock || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_SCRIPT_SRC, {
                datasetName: 'governanceMain',
                selector: 'script[data-governance-main]',
                ready: () => null
            })
        ));
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
