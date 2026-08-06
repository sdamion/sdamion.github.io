(function () {
    const STAKE_SCRIPT_SRC = 'stake.js?v=20260806-lazy-stake';
    const STAKE_TRIGGER_SELECTOR = '[data-stake-open]';
    function loadStakeScript() {
        return window.TDSPRuntime.loadScript(STAKE_SCRIPT_SRC, {
            datasetName: 'stakeMain',
            selector: 'script[data-stake-main]',
            ready: () => (window.TDSPStakeReady === true ? true : null)
        });
    }

    function openStakeFromTrigger(trigger) {
        loadStakeScript().then(() => {
            if (typeof window.openStakeModal !== 'function') return;
            window.openStakeModal({
                preventDefault() {},
                currentTarget: trigger
            });
        }).catch(error => console.error(`Stake UI could not be loaded: ${error.message}`));
    }

    function initStakeLoader() {
        window.TDSPStake = Object.freeze({ load: loadStakeScript });

        window.TDSPRuntime.bindIntentLoad(STAKE_TRIGGER_SELECTOR, loadStakeScript, { events: ['pointerdown'] });

        document.addEventListener('click', event => {
            const trigger = event.target.closest(STAKE_TRIGGER_SELECTOR);
            if (!trigger || window.TDSPStakeReady === true) return;
            event.preventDefault();
            event.stopPropagation();
            openStakeFromTrigger(trigger);
        }, true);
    }

    window.TDSPRuntime.onReady(initStakeLoader);
}());
