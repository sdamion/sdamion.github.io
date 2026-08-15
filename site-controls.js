(function initializeSiteControls() {
    const THEME_STORAGE_KEY = 'tdsp-theme';
    const EPOCH_DURATION_MS = 432000 * 1000;
    const CARDANO_MAINNET_EPOCH_ZERO_MS = Date.parse('2017-09-23T21:44:51Z');
    const MAIN_SCRIPT_SRC = 'index.js?v=20260813-static-overlay-search';
    const GOVERNANCE_SCRIPT_SRC = 'governance.js?v=20260815-shared-site-controls';
    let epochTimer = null;

    function getPreferredTheme() {
        const explicitTheme = document.documentElement.dataset.theme;
        if (explicitTheme === 'light' || explicitTheme === 'dark') return explicitTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function syncThemeToggle(toggle) {
        if (!toggle) return;
        const nextTheme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
        toggle.dataset.nextTheme = nextTheme;
        toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    }

    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle || toggle.dataset.themeBound === 'true') return;
        toggle.dataset.themeBound = 'true';
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
            document.documentElement.dataset.theme = storedTheme;
        }
        syncThemeToggle(toggle);
        toggle.addEventListener('click', () => {
            const nextTheme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            document.documentElement.dataset.theme = nextTheme;
            syncThemeToggle(toggle);
        });
    }

    function formatEpochCountdown(totalSeconds) {
        const seconds = Math.max(Math.floor(totalSeconds), 0);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;
        return [hours, minutes, remainder].map(value => String(value).padStart(2, '0')).join(':');
    }

    function updateEpochClock() {
        const element = document.getElementById('menu-epoch');
        if (!element) return;
        const elapsed = Math.max(Date.now() - CARDANO_MAINNET_EPOCH_ZERO_MS, 0);
        const epoch = Math.floor(elapsed / EPOCH_DURATION_MS);
        const endsAt = CARDANO_MAINNET_EPOCH_ZERO_MS + ((epoch + 1) * EPOCH_DURATION_MS);
        const remainingSeconds = Math.max(Math.ceil((endsAt - Date.now()) / 1000), 0);
        element.textContent = `Epoch ${epoch} ${formatEpochCountdown(remainingSeconds)} left`;
    }

    function startEpochClock() {
        updateEpochClock();
        if (epochTimer !== null || !document.getElementById('menu-epoch')) return;
        epochTimer = window.setInterval(updateEpochClock, 1000);
    }

    function syncHeaderHeight() {
        const header = document.getElementById('site-header');
        if (!header || header.dataset.heightBound === 'true') return;
        header.dataset.heightBound = 'true';
        const sync = () => {
            document.documentElement.style.setProperty(
                '--site-header-height',
                `${Math.ceil(header.getBoundingClientRect().height)}px`
            );
        };
        sync();
        window.addEventListener('resize', sync, { passive: true });
        if ('ResizeObserver' in window) new ResizeObserver(sync).observe(header);
    }

    function loadMainHelpers() {
        return window.TDSPRuntime.loadScript(MAIN_SCRIPT_SRC, {
            datasetName: 'siteMainHelpers',
            selector: 'script[data-site-main-helpers], script[src^="index.js"]',
            ready: () => typeof window.createUniversalOverlay === 'function'
        });
    }

    async function openTdspBot(button) {
        button.disabled = true;
        try {
            await loadMainHelpers();
            await window.TDSPRuntime.loadScript(GOVERNANCE_SCRIPT_SRC, {
                datasetName: 'governanceMain',
                selector: 'script[data-governance-main], script[src^="governance.js"]',
                ready: () => typeof window.openConstitutionAssistantOverlay === 'function'
            });
            window.openConstitutionAssistantOverlay(null, button);
        } catch (error) {
            console.error('TDSPBot could not be opened.', error);
        } finally {
            button.disabled = false;
        }
    }

    function initExternalLinkWarnings() {
        if (!document.body.classList.contains('raffle-page')) return;
        document.addEventListener('click', async event => {
            const link = event.target.closest?.('a[href]');
            if (!link) return;
            let url;
            try {
                url = new URL(link.href, window.location.href);
            } catch {
                return;
            }
            if (!['http:', 'https:'].includes(url.protocol) || url.origin === window.location.origin) return;
            event.preventDefault();
            try {
                await loadMainHelpers();
                window.openExternalSiteWarning(url.href, link);
            } catch (error) {
                console.error('External link warning could not be opened.', error);
            }
        }, true);
    }

    function initTdspBot() {
        if (!document.body.classList.contains('raffle-page')) return;
        const button = document.getElementById('tdspbot-open');
        if (!button || button.dataset.siteBotBound === 'true') return;
        button.dataset.siteBotBound = 'true';
        button.addEventListener('click', () => openTdspBot(button));
    }

    function init() {
        initThemeToggle();
        startEpochClock();
        syncHeaderHeight();
        initTdspBot();
        initExternalLinkWarnings();
    }

    window.TDSPSiteControls = Object.freeze({
        init,
        initThemeToggle,
        startEpochClock,
        syncThemeToggle
    });
    window.TDSPRuntime.onReady(init);
}());
