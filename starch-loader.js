(function () {
    const STARCH_SCRIPT_SRC = 'starch.js?v=20260806-lazy-starch';
    const STARCH_TARGET_SELECTORS = [
        '#starch',
        '#pool-starch-status-card'
    ];
    const STARCH_TRIGGER_SELECTORS = [
        'a[href="#starch"]',
        '#starch-companies-card',
        '#starch-miners-card',
        '#pool-starch-status-card'
    ];
    function loadStarchScript() {
        return window.TDSPRuntime.loadScript(STARCH_SCRIPT_SRC, {
            datasetName: 'starchMain',
            selector: 'script[data-starch-main]',
            ready: () => (window.TDSPStarchReady === true ? true : null)
        });
    }

    function activateStarchTarget(target) {
        if (!target || window.TDSPStarchReady === true) return false;
        if (!target.closest('#starch-companies-card,#starch-miners-card,#pool-starch-status-card')) return false;

        loadStarchScript().then(() => {
            if (target.closest('#starch-companies-card')) {
                window.openStarchDirectoryOverlay?.('companies', 'Companies', target.closest('#starch-companies-card'));
            } else if (target.closest('#starch-miners-card')) {
                window.openStarchDirectoryOverlay?.('miners', 'Miners', target.closest('#starch-miners-card'));
            } else if (target.closest('#pool-starch-status-card')) {
                window.openTdspStarchCompanyOverlay?.(target.closest('#pool-starch-status-card'));
            }
        }).catch(error => console.error(`Starch UI could not be loaded: ${error.message}`));
        return true;
    }

    function installInteractionTriggers() {
        window.TDSPRuntime.bindIntentLoad(STARCH_TRIGGER_SELECTORS, loadStarchScript, { events: ['pointerdown'] });

        document.addEventListener('click', event => {
            if (!activateStarchTarget(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);

        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            if (!activateStarchTarget(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);
    }

    function initStarchLoader() {
        window.TDSPStarch = Object.freeze({ load: loadStarchScript });
        installInteractionTriggers();
        window.TDSPRuntime.bindViewportLoad(STARCH_TARGET_SELECTORS, loadStarchScript, { rootMargin: '500px 0px' });
    }

    window.TDSPRuntime.onReady(initStarchLoader);
}());
