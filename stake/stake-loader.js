(function () {
    const MAIN_HELPERS_SCRIPT_SRC = 'home/index.js?v=20260818-raffle-prizes';
    const STAKE_SCRIPT_SRC = 'stake/stake.js?v=20260818-raffle-overlay-module';
    const STAKE_TRIGGER_SELECTOR = '[data-stake-open], [data-drep-open]';
    function loadMainHelpers() {
        return window.TDSPRuntime.loadScript(MAIN_HELPERS_SCRIPT_SRC, {
            datasetName: 'stakeMainHelpers',
            selector: 'script[data-site-main-helpers], script[src^="home/index.js"]',
            ready: () => (
                typeof window.createUniversalOverlay === 'function'
                && typeof window.getTopGovernanceMenuOverlay === 'function'
            ) ? true : null
        });
    }

    function loadStakeScript() {
        return loadMainHelpers().then(() => (
            window.TDSPRuntime.loadScript(STAKE_SCRIPT_SRC, {
                datasetName: 'stakeMain',
                selector: 'script[data-stake-main]',
                ready: () => (window.TDSPStakeReady === true ? true : null)
            })
        ));
    }

    function openStakeFromTrigger(trigger) {
        loadStakeScript().then(() => {
            const open = trigger?.matches?.('[data-drep-open]')
                ? window.openDrepDelegationModal
                : window.openStakeModal;
            if (typeof open !== 'function') return;
            open({
                preventDefault() {},
                currentTarget: trigger
            });
        }).catch(error => console.error(`Stake UI could not be loaded: ${error.message}`));
    }

    function initStakeLoader() {
        window.TDSPStake = Object.freeze({ load: loadStakeScript });

        window.TDSPRuntime.bindIntentLoad(STAKE_TRIGGER_SELECTOR, loadStakeScript, { events: ['pointerdown'] });

        document.addEventListener('click', event => {
            const trigger = window.TDSPRuntime.closestTarget(event.target, STAKE_TRIGGER_SELECTOR);
            if (!trigger || window.TDSPStakeReady === true) return;
            event.preventDefault();
            event.stopPropagation();
            openStakeFromTrigger(trigger);
        }, true);
    }

    window.TDSPRuntime.onReady(initStakeLoader);
}());
