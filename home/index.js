const IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
const THEME_STORAGE_KEY = 'tdsp-theme';
const OVERLAY_SORT_STORAGE_KEY = 'tdsp-overlay-sort';
const SITE_ALERT_SETTINGS_STORAGE_KEY = 'tdsp-site-alert-settings-v1';
const NEWS_NOTIFICATION_STORAGE_KEY = 'tdsp-news-notification-state-v1';
const CARDANO_EVENT_NOTIFICATION_STORAGE_KEY = 'tdsp-cardano-event-notification-state-v1';
const NEWS_API_URL = IS_LOCAL_PREVIEW ? '/__news_proxy__' : 'https://api.tdsp.online/api/news';
const CARDANO_EVENTS_API_URL = IS_LOCAL_PREVIEW ? '/__events_proxy__' : 'https://api.tdsp.online/api/events';
const POOL_API_URL = IS_LOCAL_PREVIEW ? '/__pool_proxy__' : 'https://api.tdsp.online/api/pool';
const MITHRIL_API_URL = IS_LOCAL_PREVIEW ? '/__mithril_proxy__' : 'https://api.tdsp.online/api/mithril';
const ICEBREAKER_API_URL = IS_LOCAL_PREVIEW ? '/__icebreaker_proxy__' : 'https://api.tdsp.online/api/icebreaker';
const STARCH_POOL_API_URL = IS_LOCAL_PREVIEW ? '/__starch_pools_proxy__' : 'https://api.tdsp.online/api/starch/pools';
const LEADER_SCHEDULE_API_URL = IS_LOCAL_PREVIEW ? '/__leader_schedule_proxy__' : 'https://api.tdsp.online/api/leader-schedule';
const DATABASE_STATUS_API_URL = IS_LOCAL_PREVIEW ? '/__sqlite_status_proxy__' : 'https://api.tdsp.online/api/sqlite/status';
const notifiedRelayMaintenance = new Set();
const DEFAULT_SITE_ALERT_SETTINGS = Object.freeze({
    governance: true,
    news: true,
    events: true
});
let headerVisibilityObserver = null;
let poolDelegators = [];
let delegatorsDashboardMessageHandler = null;
let mithrilSigners = [];
let mithrilStatus = null;
let starchPools = [];
let starchPoolStatus = null;
let cryptoNewsItems = [];

function readSiteAlertSettings() {
    try {
        const raw = localStorage.getItem(SITE_ALERT_SETTINGS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            ...DEFAULT_SITE_ALERT_SETTINGS,
            ...Object.fromEntries(
                Object.keys(DEFAULT_SITE_ALERT_SETTINGS)
                    .map(key => [key, parsed[key] !== false])
            )
        };
    } catch {
        return { ...DEFAULT_SITE_ALERT_SETTINGS };
    }
}

function writeSiteAlertSettings(settings) {
    try {
        localStorage.setItem(SITE_ALERT_SETTINGS_STORAGE_KEY, JSON.stringify({
            ...DEFAULT_SITE_ALERT_SETTINGS,
            ...settings
        }));
    } catch {}
}

function getNotificationPermissionState() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

function isSiteAlertEnabled(topic) {
    const settings = readSiteAlertSettings();
    return settings[topic] !== false;
}

function canSendBrowserNotification(topic) {
    return getNotificationPermissionState() === 'granted' && isSiteAlertEnabled(topic);
}

function sendBrowserNotification(title, body, tag, topic) {
    if (!canSendBrowserNotification(topic)) return;
    new Notification(title, { body, tag });
}

function renderSiteAlertsMenu() {
    const button = document.getElementById('site-alerts-button');
    const permissionButton = document.getElementById('site-alert-permission');
    const status = document.getElementById('site-alert-status');
    if (!button || !permissionButton || !status) return;

    const settings = readSiteAlertSettings();
    document.querySelectorAll('[data-alert-topic]').forEach(input => {
        input.checked = settings[input.dataset.alertTopic] !== false;
    });

    button.classList.remove('is-enabled', 'is-blocked');
    const permission = getNotificationPermissionState();
    if (permission === 'granted') {
        button.classList.add('is-enabled');
        button.textContent = 'Alerts';
        permissionButton.textContent = 'Notifications enabled';
        permissionButton.disabled = true;
        status.textContent = 'Browser notifications active';
    } else if (permission === 'denied') {
        button.classList.add('is-blocked');
        button.textContent = 'Alerts';
        permissionButton.textContent = 'Blocked in browser';
        permissionButton.disabled = true;
        status.textContent = 'Allow notifications in browser settings';
    } else if (permission === 'unsupported') {
        button.classList.add('is-blocked');
        button.textContent = 'Alerts';
        permissionButton.textContent = 'Not supported';
        permissionButton.disabled = true;
        status.textContent = 'This browser does not support notifications';
    } else {
        button.textContent = 'Alerts';
        permissionButton.textContent = 'Enable notifications';
        permissionButton.disabled = false;
        status.textContent = 'Choose topics and enable notifications';
    }
}

function initSiteAlertsMenu() {
    const button = document.getElementById('site-alerts-button');
    const menu = document.getElementById('site-alerts-menu');
    const permissionButton = document.getElementById('site-alert-permission');
    if (!button || !menu || !permissionButton) return;

    const closeMenu = () => {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
    };
    const toggleMenu = () => {
        menu.hidden = !menu.hidden;
        button.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
        if (!menu.hidden) renderSiteAlertsMenu();
    };

    button.addEventListener('click', event => {
        event.stopPropagation();
        toggleMenu();
    });
    menu.addEventListener('click', event => event.stopPropagation());
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });

    document.querySelectorAll('[data-alert-topic]').forEach(input => {
        input.addEventListener('change', () => {
            const settings = readSiteAlertSettings();
            settings[input.dataset.alertTopic] = input.checked;
            writeSiteAlertSettings(settings);
            renderSiteAlertsMenu();
        });
    });

    permissionButton.addEventListener('click', async () => {
        if (!('Notification' in window) || Notification.permission !== 'default') return;
        await Notification.requestPermission().catch(() => {});
        renderSiteAlertsMenu();
        const settings = readSiteAlertSettings();
        const testTopic = Object.keys(DEFAULT_SITE_ALERT_SETTINGS).find(topic => settings[topic] !== false);
        if (!testTopic) return;
        sendBrowserNotification(
            'TDSP alerts enabled',
            'Your selected TDSP alerts are active.',
            'tdsp-site-alerts-enabled',
            testTopic
        );
    });

    renderSiteAlertsMenu();
    window.TDSPAlerts = {
        isEnabled: isSiteAlertEnabled,
        canSend: canSendBrowserNotification,
        send: sendBrowserNotification,
        render: renderSiteAlertsMenu
    };
}

async function fetchPrices(options = {}) {
    return window.TDSPPrices?.load?.(options);
}

function initPriceHistoryTiles() {
    window.TDSPPrices?.initHistoryTiles?.();
}

function createNewsGroup(items, duplicate = false) {
    const group = document.createElement('div');
    group.className = 'crypto-news-group';
    if (duplicate) group.setAttribute('aria-hidden', 'true');

    items.forEach(item => {
        const url = getExternalHttpUrl(item?.url);
        const title = String(item?.title || '').trim();
        if (!url || !title) return;

        const tickerItem = document.createElement('span');
        tickerItem.className = 'crypto-news-item';

        const source = document.createElement('strong');
        source.textContent = String(item?.source || 'Cardano News').trim();
        const headline = document.createElement('span');
        headline.textContent = title;
        tickerItem.append(source, document.createTextNode(' · '), headline);
        group.append(tickerItem);
    });

    return group;
}

function readNotificationState(storageKey) {
    try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeNotificationState(storageKey, state) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
}

function getNewsNotificationId(item) {
    return String(item?.url || `${item?.source || ''}:${item?.title || ''}:${item?.published_at || ''}`).trim();
}

function checkCryptoNewsNotifications(items) {
    if (!Array.isArray(items) || !items.length) return;
    const nextIds = Array.from(new Set(items.map(getNewsNotificationId).filter(Boolean))).sort();
    const previousState = readNotificationState(NEWS_NOTIFICATION_STORAGE_KEY);
    writeNotificationState(NEWS_NOTIFICATION_STORAGE_KEY, {
        itemIds: nextIds,
        updatedAt: Date.now()
    });
    if (!previousState) return;

    const previousIds = new Set(Array.isArray(previousState.itemIds) ? previousState.itemIds : []);
    const newItems = items.filter(item => {
        const id = getNewsNotificationId(item);
        return id && !previousIds.has(id);
    });
    if (!newItems.length) return;

    if (newItems.length === 1) {
        const item = newItems[0];
        sendBrowserNotification(
            'New Cardano news',
            `${String(item?.source || 'Cardano News').trim()}: ${String(item?.title || 'New article').trim()}`,
            'tdsp-cardano-news',
            'news'
        );
        return;
    }

    sendBrowserNotification(
        'New Cardano news',
        `${newItems.length.toLocaleString('en-US')} new Cardano news items are available.`,
        'tdsp-cardano-news',
        'news'
    );
}

function updateCryptoNewsTickerSpeed() {
    const track = document.getElementById('crypto-news-track');
    const group = track?.querySelector('.crypto-news-group:not([aria-hidden="true"])');
    if (!track || !group) return;

    const pixelsPerSecond = 72;
    const minimumDuration = 20;
    const distance = group.scrollWidth;
    const durationSeconds = Math.max(minimumDuration, distance / pixelsPerSecond);
    track.style.setProperty('--crypto-news-distance', `-${distance}px`);
    track.style.setProperty('--crypto-news-duration', `${durationSeconds.toFixed(2)}s`);
}

async function fetchCryptoNews() {
    const track = document.getElementById('crypto-news-track');
    if (!track) return;

    try {
        const payload = await window.TDSPRuntime.fetchJson(
            NEWS_API_URL,
            { cache: 'no-store' }
        );
        const currentYear = new Date().getUTCFullYear();
        const items = (Array.isArray(payload?.items) ? payload.items : [])
            .filter(item => {
                const publishedAt = Date.parse(item?.published_at || '');
                return Number.isFinite(publishedAt) && new Date(publishedAt).getUTCFullYear() === currentYear;
            })
            .sort((left, right) => (
                Date.parse(right?.published_at || '') - Date.parse(left?.published_at || '')
            ))
            .slice(0, 60);
        if (!items.length) throw new Error('News API returned no Cardano headlines');

        cryptoNewsItems = items;
        checkCryptoNewsNotifications(items);
        const tickerItems = items.slice(0, 20);
        track.replaceChildren(createNewsGroup(tickerItems), createNewsGroup(tickerItems, true));
        updateCryptoNewsTickerSpeed();
        track.classList.add('is-scrolling');
        document.fonts?.ready.then(updateCryptoNewsTickerSpeed).catch(() => {});
    } catch (error) {
        console.error('Crypto news could not be loaded', error);
        const message = window.TDSPRuntime.createSmallText('Cardano news temporarily unavailable', { tagName: 'span', className: 'crypto-news-message' });
        track.replaceChildren(message);
        track.classList.remove('is-scrolling');
    }
}

const periodicRefreshPromises = new Map();

function isRefreshTargetNearViewport(selector) {
    if (!selector) return true;
    const target = document.querySelector(selector);
    if (!target) return true;
    const margin = Math.max(window.innerHeight * 0.75, 600);
    const rect = target.getBoundingClientRect();
    return rect.top <= window.innerHeight + margin && rect.bottom >= -margin;
}

function shouldRunRefreshTask(options = {}) {
    if (document.hidden && options.force !== true && options.runWhenHidden !== true) return false;
    if (options.force === true) return true;
    return isRefreshTargetNearViewport(options.selector);
}

function runPeriodicRefresh(key, callback, options = {}) {
    if (!shouldRunRefreshTask(options)) return null;
    if (periodicRefreshPromises.has(key)) return periodicRefreshPromises.get(key);

    const promise = Promise.resolve()
        .then(callback)
        .catch(error => {
            console.error(`${key} refresh failed`, error);
            return null;
        })
        .finally(() => periodicRefreshPromises.delete(key));
    periodicRefreshPromises.set(key, promise);
    return promise;
}

function setPeriodicRefresh(key, callback, intervalMs, options = {}) {
    return window.setInterval(() => {
        runPeriodicRefresh(key, callback, options);
    }, intervalMs);
}

function refreshVisibleTasks(tasks) {
    tasks.forEach(task => {
        runPeriodicRefresh(task.key, task.callback, task.options || {});
    });
}

function installRefreshTaskObservers(tasks) {
    if (!('IntersectionObserver' in window)) {
        refreshVisibleTasks(tasks.map(task => ({ ...task, options: { ...task.options, force: true } })));
        return;
    }

    const observed = new Map();
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const selector = entry.target.dataset.refreshSelector;
            const matchingTasks = observed.get(selector) || [];
            matchingTasks.forEach(task => runPeriodicRefresh(task.key, task.callback, {
                ...task.options,
                force: true
            }));
        });
    }, { rootMargin: '700px 0px' });

    tasks.forEach(task => {
        const selector = task.options?.selector;
        if (!selector) return;
        if (!observed.has(selector)) {
            const target = document.querySelector(selector);
            if (!target) return;
            target.dataset.refreshSelector = selector;
            observed.set(selector, []);
            observer.observe(target);
        }
        observed.get(selector).push(task);
    });
}

async function fetchCardanoEvents() {
    return window.TDSPCardanoEvents?.fetchAndRender?.({
        apiUrl: CARDANO_EVENTS_API_URL,
        containerId: 'cardano-events',
        notificationStorageKey: CARDANO_EVENT_NOTIFICATION_STORAGE_KEY,
        readNotificationState,
        writeNotificationState,
        canSendBrowserNotification,
        sendBrowserNotification
    });
}

// Fetch prices on page load and set up auto-update
// Initialize UI behaviors and price fetching when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initFixedHeaderLayout();
    initExternalLinkWarnings();
    initSiteAlertsMenu();
    initThemeToggle();
    initResponsiveIdentifiers();
    initPoolCopyButtons();
    initPoolMenuCards();
    initPriceHistoryTiles();
    initCryptoNewsTicker();

    const refreshTasks = [
        { key: 'prices', callback: () => fetchPrices({ force: true }), interval: 30000 },
        { key: 'news', callback: fetchCryptoNews, interval: 300000 },
        { key: 'events', callback: fetchCardanoEvents, interval: 900000, options: { selector: '#calendar' } },
        { key: 'pool', callback: fetchPoolStatus, interval: 300000, options: { selector: '#pool' } },
        { key: 'mithril', callback: fetchMithrilStatus, interval: 300000, options: { selector: '#pool' } },
        { key: 'icebreaker', callback: fetchIcebreakerStatus, interval: 300000, options: { selector: '#pool' } },
        { key: 'starch-pools', callback: fetchStarchPoolStatus, interval: 300000, options: { selector: '#pool' } },
        { key: 'leader-schedule', callback: fetchLeaderSchedule, interval: 300000, options: { selector: '#pool' } },
        { key: 'database-status', callback: fetchDatabaseStatus, interval: 300000 }
    ];
    installRefreshTaskObservers(refreshTasks);
    refreshVisibleTasks(refreshTasks);
    refreshTasks.forEach(task => {
        setPeriodicRefresh(task.key, task.callback, task.interval, task.options);
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshVisibleTasks(refreshTasks);
    });
    initUI();
});

async function fetchDatabaseStatus() {
    const status = document.getElementById('database-status');
    const text = document.getElementById('database-status-text');
    if (!status || !text) return;

    try {
        const payload = await window.TDSPRuntime.fetchJson(
            DATABASE_STATUS_API_URL,
            { cache: 'no-store' }
        );
        const recordCount = Number(payload.ai_records);
        status.classList.remove('is-active', 'is-loading', 'is-down');

        if (payload.rebuilding) {
            status.classList.add('is-loading');
            text.textContent = 'DB syncing';
            return;
        }

        if (payload.enabled && Number.isFinite(recordCount) && recordCount > 0 && !payload.last_error) {
            status.classList.add('is-active');
            text.textContent = `DB ${recordCount.toLocaleString('en-US')}`;
            return;
        }

        status.classList.add('is-down');
        text.textContent = 'DB down';
    } catch (error) {
        console.error('Database status could not be loaded', error);
        status.classList.remove('is-active', 'is-loading');
        status.classList.add('is-down');
        text.textContent = 'DB down';
    }
}

function initFixedHeaderLayout() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const syncHeight = () => {
        const height = Math.ceil(header.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--site-header-height', `${height}px`);
    };
    syncHeight();
    window.addEventListener('resize', syncHeight, { passive: true });
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(syncHeight);
        observer.observe(header);
        header.siteHeaderResizeObserver = observer;
    }
}

function initCryptoNewsTicker() {
    const ticker = document.getElementById('crypto-news-ticker');
    if (!ticker || ticker.dataset.newsBound === 'true') return;
    window.TDSPRuntime?.bindMenuTrigger?.(ticker, () => openCryptoNewsOverlay(ticker), {
        datasetKey: 'newsBound',
        preventDefault: false,
        stopPropagation: false,
        focus: false,
        errorMessage: 'Crypto News could not be opened.'
    });
    window.addEventListener('resize', updateCryptoNewsTickerSpeed, { passive: true });
}

function openCryptoNewsOverlay(returnFocus = document.activeElement) {
    window.TDSPNewsOverlay?.openCryptoNewsOverlay?.(cryptoNewsItems, {
        returnFocus,
        closeCryptoNewsOverlay,
        openExternalSiteWarning
    });
}

function closeCryptoNewsOverlay(restoreFocus = true) {
    closePoolMenuOverlay('crypto-news-overlay', restoreFocus);
}

function closeYouTubeVideoOverlay(restoreFocus = true) {
    closePoolMenuOverlay('youtube-video-overlay', restoreFocus);
}

let pendingExternalUrl = '';
let externalLinkReturnFocus = null;

function getExternalHttpUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        return url.origin === window.location.origin ? null : url;
    } catch {
        return null;
    }
}

function initExternalLinkWarnings() {
    if (document.documentElement.dataset.externalLinksBound === 'true') return;
    document.documentElement.dataset.externalLinksBound = 'true';
    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link) return;
        const youtubeVideoId = link.dataset.youtubeVideoId;
        if (youtubeVideoId) {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.TDSPNewsOverlay?.openYouTubeVideoOverlay?.(youtubeVideoId, link.dataset.youtubeVideoTitle, link);
            return;
        }
        const url = getExternalHttpUrl(link.href);
        if (!url) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        openExternalSiteWarning(url.href, link);
    }, true);
}

function getExternalSiteWarning(returnFocus = document.activeElement) {
    let overlay = document.getElementById('external-site-warning');
    if (overlay) return overlay;

    const message = document.createElement('p');
    message.id = 'external-site-warning-message';
    message.textContent = 'This link will open in a new tab.';

    const host = document.createElement('strong');
    host.className = 'external-site-warning-host';
    host.dataset.externalSiteHost = 'true';

    const urlRow = document.createElement('div');
    urlRow.className = 'external-site-warning-url';

    const copyUrl = document.createElement('button');
    copyUrl.type = 'button';
    copyUrl.className = 'external-site-warning-copy';
    copyUrl.textContent = 'Copy';
    copyUrl.setAttribute('aria-label', 'Copy external URL');
    window.TDSPRuntime?.bindCopyButton?.(copyUrl, () => pendingExternalUrl);
    urlRow.append(host, copyUrl);

    const actions = document.createElement('div');
    actions.className = 'external-site-warning-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'external-site-warning-cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', closeExternalSiteWarning);

    const proceed = document.createElement('button');
    proceed.type = 'button';
    proceed.className = 'external-site-warning-continue';
    proceed.textContent = 'Continue';
    proceed.addEventListener('click', () => {
        const url = pendingExternalUrl;
        closeExternalSiteWarning(false);
        if (!url) return;
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (opened) opened.opener = null;
    });

    actions.append(cancel, proceed);
    const elements = createUniversalOverlay({
        id: 'external-site-warning',
        titleId: 'external-site-warning-title',
        titleText: "You're opening an external site",
        titleTag: 'h2',
        closeLabel: 'Close external site warning',
        closeOverlay: closeExternalSiteWarning,
        returnFocus,
        overlayClass: 'external-site-warning',
        dialogClass: 'external-site-warning-dialog',
        bodyNodes: [message, urlRow, actions],
        enableSearch: false
    });
    elements.body.classList.add('external-site-warning-body');
    elements.dialog.setAttribute('aria-describedby', 'external-site-warning-message');
    return elements.overlay;
}

function openExternalSiteWarning(value, returnFocus = document.activeElement) {
    const url = getExternalHttpUrl(value);
    if (!url) return false;

    pendingExternalUrl = url.href;
    externalLinkReturnFocus = returnFocus;
    const overlay = getExternalSiteWarning(returnFocus);
    const host = overlay.querySelector('[data-external-site-host]');
    const copy = overlay.querySelector('.external-site-warning-copy');
    if (host) host.textContent = url.href;
    if (copy) copy.textContent = 'Copy';
    return true;
}

function closeExternalSiteWarning(restoreFocus = true) {
    const overlay = document.getElementById('external-site-warning');
    if (!overlay) return;
    overlay.remove();
    syncGovernanceMenuOverlayAccessibility();
    pendingExternalUrl = '';
    if (restoreFocus && externalLinkReturnFocus?.isConnected) externalLinkReturnFocus.focus();
    externalLinkReturnFocus = null;
}

document.addEventListener('tdsp:content-loaded', () => {
    initUI();
});

function initUI() {
    setupRevealOnScroll();
    setupHeaderVisibility();
}

async function fetchPoolStatus() {
    const summaryEl = document.getElementById('pool-summary');
    const relaysEl = document.getElementById('pool-relays');

    if (!summaryEl || !relaysEl) return;

    try {
        renderPoolStatus(await window.TDSPRuntime.fetchJson(POOL_API_URL));
    } catch (error) {
        setRelayCardStatus(null, null);
        relaysEl.textContent = '';
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Pool data could not be loaded.';
        relaysEl.appendChild(message);
    }
}

async function fetchMithrilStatus() {
    try {
        renderMithrilStatus(await window.TDSPRuntime.fetchJson(MITHRIL_API_URL));
    } catch (error) {
        mithrilStatus = null;
        mithrilSigners = [];
        setMithrilCardStatus('N/A', null);
    }
}

function renderMithrilStatus(payload) {
    mithrilStatus = payload;
    mithrilSigners = Array.isArray(payload?.signers) ? [...payload.signers] : [];
    const active = payload?.tdsp?.active === true;
    setMithrilCardStatus(active ? 'Active' : 'Inactive', active);
}

function setMithrilCardStatus(label, active) {
    const status = document.getElementById('pool-mithril-status');
    if (!status) return;

    status.textContent = label;
    window.TDSPRuntime.setBinaryStatusClasses(status, active);
}

async function fetchIcebreakerStatus() {
    try {
        const payload = await window.TDSPRuntime.fetchJson(ICEBREAKER_API_URL);
        const active = payload?.active;
        setIcebreakerCardStatus(active === true ? 'Active' : active === false ? 'Inactive' : 'N/A', active);
    } catch (error) {
        setIcebreakerCardStatus('N/A', null);
    }
}

function setIcebreakerCardStatus(label, active) {
    const status = document.getElementById('pool-icebreaker-status');
    if (!status) return;

    status.textContent = label;
    window.TDSPRuntime.setBinaryStatusClasses(status, active);
}

async function fetchStarchPoolStatus() {
    try {
        renderStarchPoolStatus(await window.TDSPRuntime.fetchJson(STARCH_POOL_API_URL));
    } catch (error) {
        starchPoolStatus = null;
        starchPools = [];
        window.TDSPRuntime.setText('starch-pool-count', 'N/A');
    }
}

function renderStarchPoolStatus(payload) {
    starchPoolStatus = payload;
    starchPools = (Array.isArray(payload?.pools) ? payload.pools : [])
        .sort((left, right) => {
            const leftTicker = String(left?.ticker || '').toLowerCase();
            const rightTicker = String(right?.ticker || '').toLowerCase();
            if (leftTicker === 'tdsp') return -1;
            if (rightTicker === 'tdsp') return 1;
            return String(left?.name || leftTicker).localeCompare(
                String(right?.name || rightTicker),
                'en',
                { sensitivity: 'base' }
            );
        });
    window.TDSPRuntime.setText('starch-pool-count', starchPools.length.toLocaleString('en-US'));
}

function setStarchPoolCardStatus(label, active) {
    const status = document.getElementById('pool-starch-status');
    if (!status) return;

    status.textContent = label;
    window.TDSPRuntime.setBinaryStatusClasses(status, active);
}

async function fetchLeaderSchedule() {
    const scheduleEl = document.getElementById('leader-schedule');
    if (!scheduleEl) return;

    try {
        renderLeaderSchedule(await window.TDSPRuntime.fetchJson(LEADER_SCHEDULE_API_URL));
    } catch (error) {
        renderLeaderScheduleError();
    }
}

function renderLeaderSchedule(schedule) {
    const leadership = Array.isArray(schedule?.leadership) ? schedule.leadership : [];
    window.TDSPRuntime.setText('leader-schedule-count', window.TDSPRuntime.formatInteger(schedule?.slotCount ?? leadership.length));
    window.TDSPRuntime.setText('leader-schedule-meta', `Possible blocks · Epoch ${window.TDSPRuntime.formatInteger(schedule?.epoch)}`);
}

function renderLeaderScheduleError() {
    window.TDSPRuntime.setText('leader-schedule-count', 'N/A');
    window.TDSPRuntime.setText('leader-schedule-meta', 'Possible blocks · Epoch N/A');
}

function renderPoolStatus(pool) {
    poolDelegators = Array.isArray(pool?.delegators) ? [...pool.delegators] : [];
    window.TDSPRuntime.setText('pool-delegators', window.TDSPRuntime.formatInteger(pool?.delegator_count));
    window.TDSPRuntime.setText('pool-live-stake', window.TDSPRuntime.formatAdaFromLovelace(pool?.live_stake_lovelace));
    window.TDSPRuntime.setText('pool-saturation', window.TDSPRuntime.formatRatioPercentage(pool?.saturation_pct ?? pool?.raw?.live_saturation, { smallValueFractionDigits: 3 }));
    window.TDSPRuntime.setText('pool-pledge', window.TDSPRuntime.formatAdaFromLovelace(pool?.pledge_lovelace ?? pool?.raw?.pledge));
    window.TDSPRuntime.setText('pool-margin', window.TDSPRuntime.formatRatioPercentage(pool?.margin ?? pool?.raw?.margin, { scale: 100 }));
    window.TDSPRuntime.setText('pool-fixed-cost', window.TDSPRuntime.formatAdaFromLovelace(pool?.fixed_cost_lovelace ?? pool?.raw?.fixed_cost));
    setResponsiveIdentifierText('pool-id', pool?.pool_id || 'N/A');

    const relays = Array.isArray(pool?.relays) ? pool.relays : [];
    const upCount = relays.filter(relay => relay.up === true).length;
    setRelayCardStatus(relays.length ? upCount : null, relays.length || null);
    window.TDSPRuntime.setText('pool-last-updated', window.TDSPRuntime.formatTimestamp(pool?.updated_at));

    const relaysEl = document.getElementById('pool-relays');
    if (!relaysEl) return;

    relaysEl.textContent = '';
    if (!relays.length) {
        const message = window.TDSPRuntime.createSmallText('No relay data available.');
        relaysEl.appendChild(message);
        return;
    }

    const downRelays = relays
        .map((relay, index) => ({ relay, label: `Relay ${index + 1}` }))
        .filter(item => item.relay.up !== true);

    if (downRelays.length) {
        const notice = document.createElement('p');
        notice.className = 'pool-maintenance-notice small-text';
        notice.textContent = `${downRelays.map(item => item.label).join(', ')} down for maintenance.`;
        relaysEl.appendChild(notice);
        if ('Notification' in window && Notification.permission === 'default') {
            const notificationButton = document.createElement('button');
            notificationButton.className = 'pool-notification-button';
            notificationButton.type = 'button';
            notificationButton.textContent = 'Enable relay notifications';
            notificationButton.addEventListener('click', async () => {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') notifyRelayMaintenance(downRelays);
                notificationButton.remove();
            });
            relaysEl.appendChild(notificationButton);
        }
        notifyRelayMaintenance(downRelays);
    }

}

function setRelayCardStatus(activeCount, relayCount) {
    const status = document.getElementById('pool-relays-up');
    const meta = document.getElementById('pool-relays-meta');
    if (!status || !meta) return;

    status.textContent = activeCount === null ? 'N/A' : activeCount > 0 ? 'Active' : 'Inactive';
    meta.textContent = activeCount === null || relayCount === null
        ? 'Relay N/A'
        : `Relay ${activeCount}/${relayCount}`;
    window.TDSPRuntime.setStatusClasses(status, {
        active: activeCount !== null && activeCount >= 2,
        warning: activeCount === 1,
        inactive: activeCount === 0
    });
}

function initPoolMenuCards() {
    [
        ['pool-delegators-card', openPoolDelegatorsOverlay, 'delegatorsBound'],
        ['pool-mithril-card', openMithrilSignersOverlay, 'mithrilBound'],
        [
            'pool-starch-status-card',
            event => window.TDSPStarch?.load?.().then(() => window.openTdspStarchCompanyOverlay?.(event.currentTarget)),
            'starchPoolBound'
        ],
        ['starch-pools-card', event => openStarchPoolsOverlay(event.currentTarget), 'starchPoolBound']
    ].forEach(([id, openMenu, datasetKey]) => {
        window.TDSPRuntime?.bindMenuTrigger?.(document.getElementById(id), openMenu, {
            datasetKey,
            preventDefault: false,
            stopPropagation: false,
            focus: false,
            errorMessage: 'Pool menu could not be opened.'
        });
    });
}

function openPoolDelegatorsOverlay() {
    closePoolDelegatorsOverlay(false);
    const delegatorsPageButton = document.createElement('button');
    delegatorsPageButton.type = 'button';
    delegatorsPageButton.className = 'governance-overlay-action-button';
    delegatorsPageButton.textContent = 'Delegators Dashboard';
    delegatorsPageButton.setAttribute('aria-label', 'Open delegators dashboard');
    delegatorsPageButton.addEventListener('click', openDelegatorsDashboardOverlay);

    createPoolMenuOverlay({
        id: 'pool-delegators-overlay',
        titleId: 'pool-delegators-title',
        titleText: 'Pool Delegators',
        headerMeta: `${poolDelegators.length.toLocaleString('en-US')} delegators`,
        closeLabel: 'Close pool delegators',
        closeOverlay: closePoolDelegatorsOverlay,
        returnFocus: document.getElementById('pool-delegators-card'),
        rootTitle: 'Delegators',
        extraActions: [delegatorsPageButton],
        bodyNode: window.TDSPPoolDelegatorsList?.create?.(poolDelegators) || window.TDSPRuntime.createSmallText('Delegator details are not available yet.')
    });
}

function closePoolDelegatorsOverlay(restoreFocus = true) {
    closePoolMenuOverlay('pool-delegators-overlay', restoreFocus);
}

function getDelegatorDashboardTemplates() {
    return window.TDSPDelegatorDashboardTemplates || {};
}

function loadDelegatorAccessModule() {
    if (window.TDSPDelegatorAccess?.initOverlay) return Promise.resolve(window.TDSPDelegatorAccess);
    return window.TDSPRuntime.loadScript('delegators/delegator-access.js?v=20260818-local-prize-images', {
        datasetName: 'delegatorAccess',
        selector: 'script[data-delegator-access]',
        ready: () => window.TDSPDelegatorAccess?.initOverlay ? window.TDSPDelegatorAccess : null
    });
}

function openDelegatorsDashboardOverlay(event) {
    event?.preventDefault?.();
    if (getTopGovernanceMenuOverlay('delegators-dashboard-overlay')) return;

    const { createDelegatorsDashboardBody } = getDelegatorDashboardTemplates();
    if (!createDelegatorsDashboardBody) {
        console.error('Delegators dashboard template module is not loaded.');
        return;
    }
    const dashboardBody = createDelegatorsDashboardBody();

    const elements = createUniversalOverlay({
        id: 'delegators-dashboard-overlay',
        titleId: 'delegators-dashboard-title',
        titleText: 'Dashboard',
        headerMeta: 'TDSP Delegator',
        closeLabel: 'Close delegators dashboard',
        closeOverlay: closeDelegatorsDashboardOverlay,
        returnFocus: event?.currentTarget || document.activeElement,
        rootTitle: 'Delegators',
        overlayClass: 'delegators-dashboard-overlay',
        dialogClass: 'delegators-dashboard-dialog',
        bodyNodes: [dashboardBody],
        enableSearch: false
    });

    delegatorsDashboardMessageHandler = event => {
        const identity = String(event.detail?.identity || '').trim();
        const shortIdentity = String(event.detail?.short_identity || identity).trim();
        elements.meta.replaceChildren('TDSP Delegator');
        if (!identity) return;
        elements.meta.appendChild(document.createTextNode(' '));
        const full = document.createElement('span');
        full.className = 'delegators-dashboard-identity-full';
        full.textContent = identity;
        const short = document.createElement('span');
        short.className = 'delegators-dashboard-identity-short';
        short.textContent = shortIdentity;
        elements.meta.append(full, short);
    };
    window.addEventListener('tdsp:delegator-dashboard-identity', delegatorsDashboardMessageHandler);

    loadDelegatorAccessModule()
        .then(module => module.initOverlay('delegator'))
        .catch(error => {
            const status = dashboardBody.querySelector('#raffle-status');
            if (status) {
                status.textContent = error?.message || 'Delegator dashboard could not be loaded.';
                status.classList.add('is-error');
                status.hidden = false;
            }
        });
}

function closeDelegatorsDashboardOverlay() {
    if (delegatorsDashboardMessageHandler) {
        window.removeEventListener('tdsp:delegator-dashboard-identity', delegatorsDashboardMessageHandler);
        delegatorsDashboardMessageHandler = null;
    }
    window.TDSPRaffleOverlayActive = false;
    document.body.classList.remove('raffle-overlay-open');
    closePoolMenuOverlay('delegators-dashboard-overlay');
}

function openAdminDashboardOverlay(event) {
    event?.preventDefault?.();
    if (getTopGovernanceMenuOverlay('admin-dashboard-overlay')) return;
    closeDelegatorsDashboardOverlay(false);

    const { createAdminDashboardBody } = getDelegatorDashboardTemplates();
    if (!createAdminDashboardBody) {
        console.error('Admin dashboard template module is not loaded.');
        return;
    }
    const dashboardBody = createAdminDashboardBody();
    createUniversalOverlay({
        id: 'admin-dashboard-overlay',
        titleId: 'admin-dashboard-title',
        titleText: 'Admin Area',
        headerMeta: 'TDSP Admin',
        closeLabel: 'Close admin area',
        closeOverlay: closeAdminDashboardOverlay,
        returnFocus: event?.currentTarget || document.activeElement,
        rootTitle: 'Admin',
        overlayClass: 'delegators-dashboard-overlay',
        dialogClass: 'delegators-dashboard-dialog',
        bodyNodes: [dashboardBody],
        enableSearch: false
    });

    loadDelegatorAccessModule()
        .then(module => module.initOverlay('admin'))
        .catch(error => {
            const status = dashboardBody.querySelector('#raffle-status');
            if (status) {
                status.textContent = error?.message || 'Admin area could not be loaded.';
                status.classList.add('is-error');
                status.hidden = false;
            }
        });
}

function closeAdminDashboardOverlay(restoreFocus = true) {
    window.TDSPRaffleOverlayActive = false;
    document.body.classList.remove('raffle-overlay-open');
    closePoolMenuOverlay('admin-dashboard-overlay', restoreFocus);
}

window.addEventListener('tdsp:open-admin-dashboard', openAdminDashboardOverlay);

function openMithrilSignersOverlay() {
    closeMithrilSignersOverlay(false);

    const signingEpoch = Number(mithrilStatus?.signing_at_epoch);
    createPoolMenuOverlay({
        id: 'pool-mithril-overlay',
        titleId: 'pool-mithril-title',
        titleText: 'Active Mithril Signers',
        headerMeta: `${mithrilSigners.length.toLocaleString('en-US')} signers${Number.isFinite(signingEpoch) ? ` · Signing epoch ${signingEpoch.toLocaleString('en-US')}` : ''}`,
        closeLabel: 'Close active Mithril signers',
        closeOverlay: closeMithrilSignersOverlay,
        returnFocus: document.getElementById('pool-mithril-card'),
        rootTitle: 'Mithril',
        bodyNode: window.TDSPLinkedPoolLists?.createMithrilSignersList?.(mithrilSigners) || window.TDSPRuntime.createSmallText('Active Mithril signer data is not available yet.')
    });
}

function closeMithrilSignersOverlay(restoreFocus = true) {
    closePoolMenuOverlay('pool-mithril-overlay', restoreFocus);
}

function openStarchPoolsOverlay(returnFocus = document.activeElement) {
    closeStarchPoolsOverlay(false);

    const epoch = Number(starchPoolStatus?.epoch);
    createPoolMenuOverlay({
        id: 'pool-starch-overlay',
        titleId: 'pool-starch-title',
        titleText: 'Starch Pools',
        headerMeta: `${starchPools.length.toLocaleString('en-US')} pools${Number.isFinite(epoch) ? ` · Epoch ${epoch.toLocaleString('en-US')}` : ''}`,
        closeLabel: 'Close Starch pools',
        closeOverlay: closeStarchPoolsOverlay,
        returnFocus,
        rootTitle: 'Starch Pools',
        bodyNode: window.TDSPLinkedPoolLists?.createStarchPoolsList?.(starchPools, { openExternalSiteWarning }) || window.TDSPRuntime.createSmallText('Starch pool data is not available yet.')
    });
}

function closeStarchPoolsOverlay(restoreFocus = true) {
    closePoolMenuOverlay('pool-starch-overlay', restoreFocus);
}

let universalOverlaySequence = 0;
let overlayFieldSequence = 0;

function getTopGovernanceMenuOverlay(id = '') {
    const selector = id
        ? `.governance-menu-overlay[data-governance-overlay-id="${CSS.escape(id)}"]`
        : '.governance-menu-overlay';
    const overlays = Array.from(document.querySelectorAll(selector));
    return overlays.reduce((top, overlay) => {
        if (!top) return overlay;
        const overlayZIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10) || 0;
        const topZIndex = Number.parseInt(getComputedStyle(top).zIndex, 10) || 0;
        return overlayZIndex >= topZIndex ? overlay : top;
    }, null);
}

function getNextGovernanceOverlayZIndex() {
    const currentHighest = Array.from(document.querySelectorAll('.governance-menu-overlay'))
        .reduce((highest, overlay) => {
            const zIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10);
            return Number.isFinite(zIndex) ? Math.max(highest, zIndex) : highest;
        }, 3000);
    return currentHighest + 100;
}

function syncGovernanceMenuOverlayAccessibility() {
    const overlays = Array.from(document.querySelectorAll('.governance-menu-overlay'));
    let topOverlay = null;
    let topZIndex = Number.NEGATIVE_INFINITY;

    overlays.forEach(overlay => {
        const dialog = overlay.querySelector('.governance-dialog');
        if (dialog) dialog.setAttribute('aria-modal', 'false');
        const zIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10);
        if (Number.isFinite(zIndex) && zIndex >= topZIndex) {
            topOverlay = overlay;
            topZIndex = zIndex;
        }
    });

    const topDialog = topOverlay?.querySelector('.governance-dialog');
    if (topDialog) topDialog.setAttribute('aria-modal', 'true');
}

function setupUniversalOverlayKeyboard() {
    if (document.documentElement.dataset.universalOverlayKeyboardBound === 'true') return;
    document.documentElement.dataset.universalOverlayKeyboardBound = 'true';
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        const topOverlay = getTopGovernanceMenuOverlay();
        if (topOverlay?.governanceCloseOnEscape === false) return;
        if (typeof topOverlay?.governanceCloseOverlay === 'function') {
            topOverlay.governanceCloseOverlay();
        }
    });
}

function closeGovernanceOverlayStack(sourceOverlay) {
    const rootOverlay = sourceOverlay?.governanceRootOverlay || sourceOverlay;
    if (!rootOverlay?.isConnected) return;

    let topOverlay = getTopGovernanceMenuOverlay();
    while (topOverlay) {
        const closeOverlay = topOverlay.governanceCloseOverlay;
        if (typeof closeOverlay === 'function') closeOverlay();
        if (topOverlay.isConnected) topOverlay.remove();
        if (topOverlay === rootOverlay) break;
        topOverlay = getTopGovernanceMenuOverlay();
    }

    syncGovernanceMenuOverlayAccessibility();
}

function appendUniversalOverlayHeader(dialog, title, close, leadingNodes = [], meta = null, back = null, extraActions = []) {
    const header = document.createElement('header');
    header.className = 'overlay-dialog-header';
    const copy = document.createElement('div');
    copy.className = 'overlay-dialog-header-copy';
    leadingNodes.forEach(node => copy.appendChild(node));
    copy.appendChild(title);
    if (meta) copy.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'overlay-dialog-header-actions';
    extraActions.filter(Boolean).forEach(action => actions.appendChild(action));
    if (back) actions.appendChild(back);
    if (close) actions.appendChild(close);
    header.append(copy, actions);
    dialog.appendChild(header);
}

function createUniversalOverlay(options) {
    const {
        id,
        titleId,
        titleText,
        closeLabel,
        closeOverlay,
        bodyNodes = [],
        leadingNodes = [],
        overlayClass = 'governance-drep-overlay',
        dialogClass = 'governance-drep-dialog',
        titleTag = 'h3',
        headerMeta = '',
        returnFocus = document.activeElement,
        rootTitle = titleText,
        closeOnBackdrop = true,
        closeOnEscape = true,
        showClose = true,
        showBack = true,
        enableSearch = true,
        defaultSort = '',
        searchPlaceholder = 'Search by name, ID, title or status',
        onSearch = null,
        uniqueId = false,
        showBotButton = false,
        botContext = null,
        extraActions = []
    } = options;

    const previousTopOverlay = getTopGovernanceMenuOverlay();
    universalOverlaySequence += 1;
    const suffix = uniqueId ? `-${universalOverlaySequence}` : '';
    const overlay = document.createElement('div');
    overlay.id = `${id}${suffix}`;
    overlay.className = `governance-overlay governance-menu-overlay ${overlayClass}`.trim();
    overlay.dataset.governanceOverlayId = id;
    overlay.style.zIndex = String(getNextGovernanceOverlayZIndex());
    overlay.governanceReturnFocus = returnFocus;
    overlay.governanceCloseOverlay = closeOverlay;
    overlay.governanceCloseOnEscape = closeOnEscape;
    overlay.governanceRootOverlay = previousTopOverlay?.governanceRootOverlay || overlay;
    overlay.governanceRootTitle = previousTopOverlay?.governanceRootTitle || rootTitle;
    overlay.governanceBotContext = botContext;
    if (closeOnBackdrop) {
        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeOverlay();
        });
    }

    const dialog = document.createElement('article');
    dialog.className = `governance-dialog ${dialogClass}`.trim();
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', `${titleId}${suffix}`);

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', closeLabel);
    close.title = closeLabel;
    const closeIcon = document.createElement('span');
    closeIcon.className = 'governance-close-icon';
    closeIcon.setAttribute('aria-hidden', 'true');
    close.appendChild(closeIcon);
    close.addEventListener('click', () => closeGovernanceOverlayStack(overlay));

    const back = document.createElement('button');
    back.className = 'governance-back-to-root';
    back.type = 'button';
    back.textContent = '<';
    back.setAttribute('aria-label', 'Back one window');
    back.title = 'Back one window';
    back.addEventListener('click', closeOverlay);

    let botButton = null;
    if (showBotButton && botContext && typeof window.openConstitutionAssistantOverlay === 'function') {
        botButton = document.createElement('button');
        botButton.className = 'governance-overlay-bot-button';
        botButton.type = 'button';
        botButton.textContent = 'TDSPBot';
        botButton.setAttribute('aria-label', 'Ask TDSPBot about this menu');
        botButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            window.openConstitutionAssistantOverlay(overlay.governanceBotContext || botContext, botButton);
        });
    }

    const title = document.createElement(titleTag);
    title.id = `${titleId}${suffix}`;
    if (titleTag !== 'h2') title.className = 'governance-drep-title';
    title.textContent = titleText;

    const meta = document.createElement('span');
    meta.className = 'governance-menu-header-meta';
    meta.dataset.governanceMenuHeaderMeta = 'true';
    meta.textContent = headerMeta;

    const hasBackTarget = showBack !== false && (Boolean(previousTopOverlay) || showClose === false);
    appendUniversalOverlayHeader(
        dialog,
        title,
        showClose === false ? null : close,
        leadingNodes,
        meta,
        hasBackTarget ? back : null,
        [...extraActions, botButton]
    );
    const body = document.createElement('div');
    body.className = 'overlay-dialog-body';
    bodyNodes.forEach(node => body.appendChild(node));
    dialog.appendChild(body);
    if (enableSearch) installOverlaySearch(body, { defaultSort, searchPlaceholder, onSearch });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    setupUniversalOverlayKeyboard();
    syncGovernanceMenuOverlayAccessibility();
    (showClose === false ? back || botButton || dialog : close).focus();
    return { overlay, dialog, body, close, title, meta };
}

function createPoolMenuOverlay({
    id,
    titleId,
    titleText,
    headerMeta,
    closeLabel,
    closeOverlay,
    returnFocus,
    rootTitle,
    bodyNode,
    closeOnBackdrop = true,
    closeOnEscape = true,
    defaultSort = '',
    extraActions = []
}) {
    return createUniversalOverlay({
        id,
        titleId,
        titleText,
        headerMeta,
        closeLabel,
        closeOverlay,
        returnFocus,
        rootTitle,
        bodyNodes: [bodyNode],
        closeOnBackdrop,
        closeOnEscape,
        defaultSort,
        extraActions
    });
}

function getOverlaySearchCards(body) {
    return Array.from(body.querySelectorAll('.governance-menu-card'))
        .filter(card => !card.parentElement?.closest('.governance-menu-card'));
}

function getOverlaySortSignature(options) {
    return options.map(option => option.value).join('|');
}

function getStoredOverlaySort(options = []) {
    try {
        const stored = localStorage.getItem(OVERLAY_SORT_STORAGE_KEY) || '';
        if (!stored.startsWith('{')) return stored;
        const preferences = JSON.parse(stored);
        return preferences?.[getOverlaySortSignature(options)] || '';
    } catch {
        return '';
    }
}

function storeOverlaySort(options, value) {
    try {
        const stored = localStorage.getItem(OVERLAY_SORT_STORAGE_KEY) || '';
        let preferences = {};
        if (stored.startsWith('{')) {
            try {
                preferences = JSON.parse(stored) || {};
            } catch {}
        }
        preferences[getOverlaySortSignature(options)] = value;
        localStorage.setItem(OVERLAY_SORT_STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
}

const OVERLAY_SORT_DEFINITIONS = Object.freeze([
    { value: 'cip-asc', label: 'CIP number', key: 'sortCip', direction: 1, type: 'number' },
    { value: 'cip-desc', label: 'CIP number: Newest', key: 'sortCip', direction: -1, type: 'number' },
    { value: 'newest', label: 'Newest', key: 'sortDate', direction: -1, type: 'number' },
    { value: 'oldest', label: 'Oldest', key: 'sortDate', direction: 1, type: 'number' },
    { value: 'ask-desc', label: 'Most ask', key: 'sortAsk', direction: -1, type: 'number' },
    { value: 'ask-asc', label: 'Less ask', key: 'sortAsk', direction: 1, type: 'number' },
    { value: 'yes-votes-desc', label: 'Most Yes votes', key: 'sortYesVotes', direction: -1, type: 'number' },
    { value: 'no-votes-desc', label: 'Most No votes', key: 'sortNoVotes', direction: -1, type: 'number' },
    { value: 'amount-desc', label: 'Highest amount', key: 'sortAmount', direction: -1, type: 'number' },
    { value: 'amount-asc', label: 'Lowest amount', key: 'sortAmount', direction: 1, type: 'number' },
    { value: 'projects-desc', label: 'Most funded projects', key: 'sortProjects', direction: -1, type: 'number' },
    { value: 'projects-asc', label: 'Least funded projects', key: 'sortProjects', direction: 1, type: 'number' },
    { value: 'power-desc', label: 'Most power', key: 'sortPower', direction: -1, type: 'number' },
    { value: 'power-asc', label: 'Least power', key: 'sortPower', direction: 1, type: 'number' },
    { value: 'ncl-desc', label: 'Most DRep Yes NCL', key: 'sortNcl', direction: -1, type: 'number' },
    { value: 'ncl-asc', label: 'Least DRep Yes NCL', key: 'sortNcl', direction: 1, type: 'number' },
    { value: 'delegators-desc', label: 'Most delegators', key: 'sortDelegators', direction: -1, type: 'number' },
    { value: 'delegators-asc', label: 'Least delegators', key: 'sortDelegators', direction: 1, type: 'number' },
    { value: 'saturation-desc', label: 'Highest saturation', key: 'sortSaturation', direction: -1, type: 'number' },
    { value: 'saturation-asc', label: 'Lowest saturation', key: 'sortSaturation', direction: 1, type: 'number' },
    { value: 'balance-desc', label: 'Highest balance', key: 'sortBalance', direction: -1, type: 'number' },
    { value: 'balance-asc', label: 'Lowest balance', key: 'sortBalance', direction: 1, type: 'number' },
    { value: 'blocks-desc', label: 'Most blocks', key: 'sortBlocks', direction: -1, type: 'number' },
    { value: 'blocks-asc', label: 'Least blocks', key: 'sortBlocks', direction: 1, type: 'number' },
    { value: 'miners-desc', label: 'Most miners', key: 'sortMiners', direction: -1, type: 'number' },
    { value: 'miners-asc', label: 'Least miners', key: 'sortMiners', direction: 1, type: 'number' },
    { value: 'epoch-desc', label: 'Latest epoch', key: 'sortEpoch', direction: -1, type: 'number' },
    { value: 'epoch-asc', label: 'Earliest epoch', key: 'sortEpoch', direction: 1, type: 'number' },
    { value: 'fund-desc', label: 'Fund: Newest first', key: 'sortFund', direction: -1, type: 'number' },
    { value: 'fund-asc', label: 'Fund: Oldest first', key: 'sortFund', direction: 1, type: 'number' },
    { value: 'active-first', label: 'Active first', key: 'sortStatus', direction: -1, type: 'number' },
    { value: 'inactive-first', label: 'Inactive first', key: 'sortStatus', direction: 1, type: 'number' },
    { value: 'name-asc', label: 'Name A-Z', key: 'sortName', direction: 1, type: 'text' },
    { value: 'name-desc', label: 'Name Z-A', key: 'sortName', direction: -1, type: 'text' }
]);

function getOverlayCardSortName(card) {
    const preferred = card.querySelector([
        '.governance-title',
        '.crypto-news-list-title',
        '.pool-delegator-handle',
        '.governance-cc-member-hash',
        '.governance-no-vote-name'
    ].join(','));
    return window.TDSPRuntime.normalizeSearchText(preferred?.textContent || card.textContent).trim();
}

function getRelevantOverlaySortOptions(cards) {
    cards.forEach(card => {
        if (!card.dataset.sortName) card.dataset.sortName = getOverlayCardSortName(card);
    });
    return OVERLAY_SORT_DEFINITIONS.filter(definition => {
        const values = new Set(cards
            .map(card => String(card.dataset[definition.key] || ''))
            .filter(Boolean));
        return values.size > 1;
    });
}

function getOverlayCardSortNumber(card, key) {
    const value = Number(card?.dataset?.[key]);
    return Number.isFinite(value) ? value : null;
}

function sortOverlayCards(body, cards, mode) {
    if (!cards.length) return;
    if (!Number.isFinite(body.overlaySortSequence)) body.overlaySortSequence = 0;

    cards.forEach(card => {
        if (card.dataset.overlaySortIndex !== undefined) return;
        card.dataset.overlaySortIndex = String(body.overlaySortSequence);
        body.overlaySortSequence += 1;
    });

    const cardsByParent = new Map();
    cards.forEach(card => {
        const siblings = cardsByParent.get(card.parentElement) || [];
        siblings.push(card);
        cardsByParent.set(card.parentElement, siblings);
    });

    const definition = OVERLAY_SORT_DEFINITIONS.find(item => item.value === mode);
    if (!definition) return;
    cardsByParent.forEach((siblings, parent) => {
        const sorted = [...siblings].sort((left, right) => {
            const leftPinRank = Number(left.dataset.overlayPinRank);
            const rightPinRank = Number(right.dataset.overlayPinRank);
            const leftPinned = Number.isFinite(leftPinRank);
            const rightPinned = Number.isFinite(rightPinRank);
            if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
            if (leftPinned && leftPinRank !== rightPinRank) return leftPinRank - rightPinRank;

            if (definition.type === 'text') {
                const result = String(left.dataset[definition.key] || '').localeCompare(
                    String(right.dataset[definition.key] || ''),
                    'en',
                    { sensitivity: 'base', numeric: true }
                );
                return result * definition.direction
                    || Number(left.dataset.overlaySortIndex) - Number(right.dataset.overlaySortIndex);
            }

            const leftValue = getOverlayCardSortNumber(left, definition.key);
            const rightValue = getOverlayCardSortNumber(right, definition.key);
            const leftHasValue = leftValue !== null;
            const rightHasValue = rightValue !== null;

            if (leftHasValue !== rightHasValue) return leftHasValue ? -1 : 1;
            if (leftHasValue && leftValue !== rightValue) return (leftValue - rightValue) * definition.direction;
            return Number(left.dataset.overlaySortIndex) - Number(right.dataset.overlaySortIndex);
        });

        if (siblings.every((card, index) => card === sorted[index])) return;
        sorted.forEach(card => parent.appendChild(card));
    });
}

function installOverlaySearch(body, {
    defaultSort = '',
    searchPlaceholder = 'Search by name, ID, title or status',
    onSearch = null
} = {}) {
    if (!body || body.dataset.overlaySearchInstalled === 'true') return;
    const existingDialog = body.closest('.governance-dialog');
    if (existingDialog?.querySelector(':scope > .overlay-search-bar')) return;
    body.dataset.overlaySearchInstalled = 'true';

    const searchBar = document.createElement('div');
    searchBar.className = 'overlay-search-bar';
    searchBar.hidden = true;

    overlayFieldSequence += 1;
    const fieldScope = body.closest('[id]')?.id || `overlay-field-${overlayFieldSequence}`;
    const input = document.createElement('input');
    input.id = `${fieldScope}-search`;
    input.name = 'overlay_search';
    input.className = 'overlay-search-input';
    input.type = 'search';
    input.placeholder = searchPlaceholder;
    input.setAttribute('aria-label', 'Search this overlay');
    input.autocomplete = 'off';
    input.autocapitalize = 'none';
    input.spellcheck = false;

    const sort = document.createElement('select');
    sort.id = `${fieldScope}-sort`;
    sort.name = 'overlay_sort';
    sort.className = 'overlay-sort-select';
    sort.setAttribute('aria-label', 'Sort overlay results');
    const initialCards = getOverlaySearchCards(body);
    const sortOptions = getRelevantOverlaySortOptions(initialCards);
    sortOptions.forEach(({ value, label }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        sort.appendChild(option);
    });
    const storedSort = getStoredOverlaySort(sortOptions);
    sort.value = sortOptions.some(option => option.value === defaultSort)
        ? defaultSort
        : sortOptions.some(option => option.value === storedSort)
            ? storedSort
            : sortOptions[0]?.value || '';
    sort.hidden = sortOptions.length < 2;

    const count = document.createElement('span');
    count.className = 'overlay-search-count';
    count.setAttribute('aria-live', 'polite');

    const empty = document.createElement('p');
    empty.className = 'overlay-search-empty';
    empty.textContent = 'No matching results.';
    empty.hidden = true;

    searchBar.append(input, sort, count);
    body.prepend(empty);
    const placeSearchBar = () => {
        const dialog = body.closest('.governance-dialog');
        if (!dialog) {
            if (searchBar.parentNode !== body) body.prepend(searchBar);
            return;
        }
        const scrollBody = dialog.querySelector(':scope > .overlay-dialog-body');
        if (searchBar.parentNode !== dialog || searchBar.nextElementSibling !== scrollBody) {
            dialog.insertBefore(searchBar, scrollBody || null);
        }
    };
    placeSearchBar();
    queueMicrotask(placeSearchBar);

    const applySearch = () => {
        const normalizedQuery = window.TDSPRuntime.normalizeSearchText(input.value).trim();
        const searchHandled = typeof onSearch === 'function' && onSearch(normalizedQuery) === true;
        const cards = getOverlaySearchCards(body);
        const relevantOptions = getRelevantOverlaySortOptions(cards);
        const currentOptionValues = Array.from(sort.options, option => option.value).join('|');
        if (currentOptionValues !== getOverlaySortSignature(relevantOptions)) {
            const selected = sort.value || getStoredOverlaySort(relevantOptions);
            sort.replaceChildren(...relevantOptions.map(({ value, label }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                return option;
            }));
            sort.value = relevantOptions.some(option => option.value === selected)
                ? selected
                : relevantOptions[0]?.value || '';
        }
        sort.hidden = relevantOptions.length < 2;
        sortOverlayCards(body, cards, sort.value);
        const terms = normalizedQuery.split(/\s+/).filter(Boolean);
        const teamSearchActive = Boolean(normalizedQuery) && cards.some(card => (
            String(card.dataset.searchTeamLabels || '')
                .split('\n')
                .map(window.TDSPRuntime.normalizeSearchText)
                .some(label => label.trim().includes(normalizedQuery))
        ));
        let visible = 0;

        cards.forEach(card => {
            const searchableText = window.TDSPRuntime.normalizeSearchText(
                `${card.textContent || ''} ${card.dataset.searchText || ''}`
            );
            const teamLabels = String(card.dataset.searchTeamLabels || '')
                .split('\n')
                .map(window.TDSPRuntime.normalizeSearchText)
                .map(label => label.trim())
                .filter(Boolean);
            const matches = searchHandled
                || (
                    teamSearchActive
                        ? teamLabels.some(label => label.includes(normalizedQuery))
                        : terms.every(term => searchableText.includes(term))
                );
            card.hidden = !matches;
            if (matches) visible += 1;
        });

        searchBar.hidden = cards.length < 2;
        const countText = `${visible.toLocaleString('en-US')} / ${cards.length.toLocaleString('en-US')}`;
        if (count.textContent !== countText) count.textContent = countText;
        empty.hidden = cards.length < 2 || !terms.length || visible > 0;
    };

    input.addEventListener('input', applySearch);
    input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !input.value) return;
        event.preventDefault();
        event.stopPropagation();
        input.value = '';
        applySearch();
    });
    sort.addEventListener('change', () => {
        storeOverlaySort(getRelevantOverlaySortOptions(getOverlaySearchCards(body)), sort.value);
        applySearch();
    });

    let refreshQueued = false;
    const observer = new MutationObserver(() => {
        if (refreshQueued) return;
        refreshQueued = true;
        queueMicrotask(() => {
            refreshQueued = false;
            applySearch();
        });
    });
    observer.observe(body, { childList: true, subtree: true });
    body.overlaySearchObserver = observer;
    applySearch();
}

function closePoolMenuOverlay(id, restoreFocus = true) {
    const overlay = document.getElementById(id);
    const returnFocus = overlay?.governanceReturnFocus;
    overlay?.remove();
    syncGovernanceMenuOverlayAccessibility();
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
}

function createPoolOverlayRow({ title = '', titleClassName = '', details = [] }) {
    const row = document.createElement('div');
    row.className = 'pool-delegator-row governance-menu-card';

    const content = document.createElement('div');
    content.className = 'pool-delegator-content';

    if (title) {
        const titleElement = document.createElement('strong');
        titleElement.className = titleClassName || 'pool-delegator-address';
        titleElement.textContent = title;
        content.appendChild(titleElement);
    }

    details.forEach(detail => {
        if (!detail) return;
        if (detail instanceof Node) {
            content.appendChild(detail);
            return;
        }

        const text = document.createElement('span');
        text.className = 'pool-delegator-address';
        text.textContent = String(detail);
        content.appendChild(text);
    });

    row.appendChild(content);
    return row;
}

function shortenStakeAddress(address) {
    return window.TDSPRuntime.shortenMiddle(address);
}

function setResponsiveIdentifierText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    const text = String(value || '').trim();
    element.textContent = text;
    if (window.TDSPRuntime?.createResponsiveIdentifier && text && text !== 'N/A') {
        element.replaceChildren(window.TDSPRuntime.createResponsiveIdentifier(text));
    }
}

function initResponsiveIdentifiers() {
    ['pool-id', 'tdsp-drep-id'].forEach(id => {
        const element = document.getElementById(id);
        if (element) setResponsiveIdentifierText(id, element.textContent);
    });
}

function initPoolCopyButtons() {
    document.querySelectorAll('[data-copy-target]').forEach(button => {
        window.TDSPRuntime?.bindCopyButton?.(button, () => {
            const target = document.getElementById(button.dataset.copyTarget);
            const responsive = target?.querySelector?.('.tdsp-responsive-identifier');
            const value = responsive?.dataset.fullValue || target?.textContent?.trim();
            return value && value !== '...' && value !== 'N/A' ? value : '';
        }, { skipEmpty: true });
    });
}

function notifyRelayMaintenance(downRelays) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const newDownRelays = downRelays.filter(({ label, relay }) => {
        const id = `${label}:${relay.host || ''}:${relay.port || ''}`;
        if (notifiedRelayMaintenance.has(id)) return false;
        notifiedRelayMaintenance.add(id);
        return true;
    });
    if (!newDownRelays.length) return;

    new Notification('TDSP relay maintenance', {
        body: `${newDownRelays.map(item => item.label).join(', ')} down for maintenance.`,
        tag: 'tdsp-relay-maintenance'
    });
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle || toggle.dataset.themeBound === 'true') return;
    toggle.dataset.themeBound = 'true';

    applyStoredTheme();
    syncThemeToggle(toggle);

    toggle.addEventListener('click', () => {
        const currentTheme = getPreferredTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        syncThemeToggle(toggle);
    });
}

function applyStoredTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        document.documentElement.dataset.theme = storedTheme;
        return;
    }

    delete document.documentElement.dataset.theme;
}

function getPreferredTheme() {
    const explicitTheme = document.documentElement.dataset.theme;
    if (explicitTheme === 'light' || explicitTheme === 'dark') return explicitTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeToggle(toggle) {
    const currentTheme = getPreferredTheme();
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    toggle.dataset.currentTheme = currentTheme;
    toggle.dataset.nextTheme = nextTheme;
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
}

function setupRevealOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12, root: null, rootMargin: '0px 0px -10% 0px' });

    const targets = Array.from(document.querySelectorAll('.section, .hero-logo, h2, p'));
    targets.forEach(el => {
        if (el.dataset.revealObserved === 'true') return;
        el.dataset.revealObserved = 'true';
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Fallback: if observer didn't trigger within 1s, reveal everything so the page isn't stuck hidden
    setTimeout(() => {
        const stillHidden = targets.filter(t => !t.classList.contains('visible'));
        if (stillHidden.length) {
            stillHidden.forEach(t => t.classList.add('visible'));
        }
    }, 1000);
}

function setupHeaderVisibility() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!navLinks.length || !sections.length) return;

    if (headerVisibilityObserver) headerVisibilityObserver.disconnect();

    headerVisibilityObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
        });
    }, {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5]
    });

    sections.forEach(section => headerVisibilityObserver.observe(section));

    navLinks.forEach(link => {
        if (link.dataset.navBound === 'true') return;
        link.dataset.navBound = 'true';
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const firstLink = navLinks[0];
    if (firstLink) {
        firstLink.classList.add('active');
    }
}

window.getTopGovernanceMenuOverlay = getTopGovernanceMenuOverlay;
window.syncGovernanceMenuOverlayAccessibility = syncGovernanceMenuOverlayAccessibility;
window.createUniversalOverlay = createUniversalOverlay;
