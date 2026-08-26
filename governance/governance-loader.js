(function () {
    const GOVERNANCE_RICH_TEXT_SCRIPT_SRC = 'governance/governance-rich-text.js?v=20260818-continuation-lists';
    const GOVERNANCE_API_SCRIPT_SRC = 'governance/governance-api.js?v=20260827-summary-language';
    const GOVERNANCE_ASSISTANT_SCRIPT_SRC = 'governance/governance-assistant.js?v=20260827-translation-pending';
    const GOVERNANCE_FUNDING_DIRECTORY_SCRIPT_SRC = 'governance/governance-funding-directory.js?v=20260817-modular-funding-directory';
    const GOVERNANCE_BUSINESS_LINKS_SCRIPT_SRC = 'governance/governance-business-links.js?v=20260818-modular-business-links-domain';
    const GOVERNANCE_TREASURY_ADMINS_SCRIPT_SRC = 'governance/governance-treasury-admins.js?v=20260819-modular-treasury-admins';
    const GOVERNANCE_CATALYST_FORMAT_SCRIPT_SRC = 'governance/governance-catalyst-format.js?v=20260817-modular-catalyst-format-4';
    const GOVERNANCE_PIE_CHART_SCRIPT_SRC = 'governance/governance-pie-chart.js?v=20260819-not-voted-graph-language';
    const GOVERNANCE_CATALYST_CHARTS_SCRIPT_SRC = 'governance/governance-catalyst-charts.js?v=20260819-funding-labels';
    const GOVERNANCE_ACTION_BUTTONS_SCRIPT_SRC = 'governance/governance-action-buttons.js?v=20260817-modular-action-buttons';
    const GOVERNANCE_BOT_CONTEXTS_SCRIPT_SRC = 'governance/governance-bot-contexts.js?v=20260817-modular-bot-contexts';
    const GOVERNANCE_PROPOSAL_SUMMARY_SCRIPT_SRC = 'governance/governance-proposal-summary.js?v=20260827-summary-language';
    const GOVERNANCE_COPY_SCRIPT_SRC = 'governance/governance-copy.js?v=20260817-modular-copy';
    const GOVERNANCE_DETAIL_RENDERING_SCRIPT_SRC = 'governance/governance-detail-rendering.js?v=20260819-drep-overlay-language';
    const GOVERNANCE_CIPS_SCRIPT_SRC = 'governance/governance-cips.js?v=20260819-governance-overlay-language';
    const GOVERNANCE_NCL_SCRIPT_SRC = 'governance/governance-ncl.js?v=20260819-net-change-limit-title';
    const GOVERNANCE_NOTIFICATIONS_SCRIPT_SRC = 'governance/governance-notifications.js?v=20260817-modular-notifications';
    const GOVERNANCE_EPOCH_CLOCK_SCRIPT_SRC = 'governance/governance-epoch-clock.js?v=20260820-menu-alerts-epoch';
    const GOVERNANCE_VOTE_DATA_SCRIPT_SRC = 'governance/governance-vote-data.js?v=20260817-modular-vote-data';
    const GOVERNANCE_DREP_UTILS_SCRIPT_SRC = 'governance/governance-drep-utils.js?v=20260817-modular-drep-utils';
    const GOVERNANCE_DREP_VOTES_SCRIPT_SRC = 'governance/governance-drep-votes.js?v=20260826-rationale-cardanoscan-link';
    const GOVERNANCE_DREP_NCL_SCRIPT_SRC = 'governance/governance-drep-ncl.js?v=20260819-drep-overlay-language';
    const GOVERNANCE_DREP_STATUS_SCRIPT_SRC = 'governance/governance-drep-status.js?v=20260817-modular-drep-status';
    const GOVERNANCE_DREP_CORRELATION_SCRIPT_SRC = 'governance/governance-drep-correlation.js?v=20260819-drep-sync-language';
    const GOVERNANCE_DREP_TOP10_SCRIPT_SRC = 'governance/governance-drep-top10.js?v=20260819-drep-overlay-language';
    const GOVERNANCE_TDSP_DREP_SCRIPT_SRC = 'governance/governance-tdsp-drep.js?v=20260820-delegator-usd';
    const GOVERNANCE_PROPOSAL_DISPLAY_SCRIPT_SRC = 'governance/governance-proposal-display.js?v=20260817-modular-proposal-display';
    const GOVERNANCE_SCRIPT_SRC = 'governance/governance.js?v=20260826-language-refresh';
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
            window.TDSPRuntime.loadScript(GOVERNANCE_API_SCRIPT_SRC, {
                datasetName: 'governanceApi',
                selector: 'script[data-governance-api]',
                ready: () => window.TDSPGovernanceApi || null
            })
        )).then(() => (
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
            window.TDSPRuntime.loadScript(GOVERNANCE_BUSINESS_LINKS_SCRIPT_SRC, {
                datasetName: 'governanceBusinessLinks',
                selector: 'script[data-governance-business-links]',
                ready: () => window.TDSPBusinessLinks || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_TREASURY_ADMINS_SCRIPT_SRC, {
                datasetName: 'governanceTreasuryAdmins',
                selector: 'script[data-governance-treasury-admins]',
                ready: () => window.TDSPTreasuryAdmins || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_CATALYST_FORMAT_SCRIPT_SRC, {
                datasetName: 'governanceCatalystFormat',
                selector: 'script[data-governance-catalyst-format]',
                ready: () => window.TDSPCatalystFormat || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_PIE_CHART_SCRIPT_SRC, {
                datasetName: 'governancePieChart',
                selector: 'script[data-governance-pie-chart]',
                ready: () => window.TDSPPieChart || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_CATALYST_CHARTS_SCRIPT_SRC, {
                datasetName: 'governanceCatalystCharts',
                selector: 'script[data-governance-catalyst-charts]',
                ready: () => window.TDSPCatalystCharts || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_ACTION_BUTTONS_SCRIPT_SRC, {
                datasetName: 'governanceActionButtons',
                selector: 'script[data-governance-action-buttons]',
                ready: () => window.TDSPActionButtons || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_BOT_CONTEXTS_SCRIPT_SRC, {
                datasetName: 'governanceBotContexts',
                selector: 'script[data-governance-bot-contexts]',
                ready: () => window.TDSPBotContexts || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_PROPOSAL_SUMMARY_SCRIPT_SRC, {
                datasetName: 'governanceProposalSummary',
                selector: 'script[data-governance-proposal-summary]',
                ready: () => window.TDSPProposalSummary || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_COPY_SCRIPT_SRC, {
                datasetName: 'governanceCopy',
                selector: 'script[data-governance-copy]',
                ready: () => window.TDSPGovernanceCopy || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DETAIL_RENDERING_SCRIPT_SRC, {
                datasetName: 'governanceDetailRendering',
                selector: 'script[data-governance-detail-rendering]',
                ready: () => window.TDSPDetailRendering || null
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
            window.TDSPRuntime.loadScript(GOVERNANCE_VOTE_DATA_SCRIPT_SRC, {
                datasetName: 'governanceVoteData',
                selector: 'script[data-governance-vote-data]',
                ready: () => window.TDSPVoteData || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DREP_UTILS_SCRIPT_SRC, {
                datasetName: 'governanceDrepUtils',
                selector: 'script[data-governance-drep-utils]',
                ready: () => window.TDSPDrepUtils || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DREP_VOTES_SCRIPT_SRC, {
                datasetName: 'governanceDrepVotes',
                selector: 'script[data-governance-drep-votes]',
                ready: () => window.TDSPDrepVotes || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DREP_NCL_SCRIPT_SRC, {
                datasetName: 'governanceDrepNcl',
                selector: 'script[data-governance-drep-ncl]',
                ready: () => window.TDSPDrepNcl || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DREP_STATUS_SCRIPT_SRC, {
                datasetName: 'governanceDrepStatus',
                selector: 'script[data-governance-drep-status]',
                ready: () => window.TDSPDrepStatus || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DREP_CORRELATION_SCRIPT_SRC, {
                datasetName: 'governanceDrepCorrelation',
                selector: 'script[data-governance-drep-correlation]',
                ready: () => window.TDSPDrepCorrelation || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_DREP_TOP10_SCRIPT_SRC, {
                datasetName: 'governanceDrepTop10',
                selector: 'script[data-governance-drep-top10]',
                ready: () => window.TDSPDrepTop10 || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_TDSP_DREP_SCRIPT_SRC, {
                datasetName: 'governanceTdspDrep',
                selector: 'script[data-governance-tdsp-drep]',
                ready: () => window.TDSPTdspDrep || null
            })
        )).then(() => (
            window.TDSPRuntime.loadScript(GOVERNANCE_PROPOSAL_DISPLAY_SCRIPT_SRC, {
                datasetName: 'governanceProposalDisplay',
                selector: 'script[data-governance-proposal-display]',
                ready: () => window.TDSPProposalDisplay || null
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
