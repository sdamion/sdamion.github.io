(function () {
    const STAKE_SCRIPT_SRC = 'stake.js?v=20260806-lazy-stake';
    const STAKE_TRIGGER_SELECTOR = '[data-stake-open]';
    let stakeScriptPromise = null;

    function loadStakeScript() {
        if (window.TDSPStakeReady === true) return Promise.resolve();
        if (stakeScriptPromise) return stakeScriptPromise;

        stakeScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-stake-main]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = STAKE_SCRIPT_SRC;
            script.defer = true;
            script.dataset.stakeMain = 'true';
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });

        return stakeScriptPromise;
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

        document.addEventListener('pointerdown', event => {
            if (event.target.closest(STAKE_TRIGGER_SELECTOR)) loadStakeScript();
        }, { passive: true });

        document.addEventListener('click', event => {
            const trigger = event.target.closest(STAKE_TRIGGER_SELECTOR);
            if (!trigger || window.TDSPStakeReady === true) return;
            event.preventDefault();
            event.stopPropagation();
            openStakeFromTrigger(trigger);
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStakeLoader, { once: true });
    } else {
        initStakeLoader();
    }
}());
