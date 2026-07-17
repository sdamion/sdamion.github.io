// API URLs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=cardano,bitcoin&vs_currencies=usd';
const GECKOTERMINAL_API_URL = 'https://api.geckoterminal.com/api/v2/simple/networks/cardano/token_price/3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e,6d06570ddd778ec7c0cca09d381eca194e90c8cffa7582879735dbde584552,b6a7467ea1deb012808ef4e87b5ff371e85f7142d7b356a40d9b42a0436f726e75636f70696173205b76696120436861696e506f72742e696f5d';

// Token IDs from GeckoTerminal
const TOKEN_IDS = {
    STRCH: "3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e",
};

const IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const THEME_STORAGE_KEY = 'tdsp-theme';
const COINGECKO_PRICE_URL = IS_LOCAL_PREVIEW ? '/__coingecko_price_proxy__' : COINGECKO_API_URL;
const GECKOTERMINAL_PRICE_URL = IS_LOCAL_PREVIEW ? '/__geckoterminal_price_proxy__' : GECKOTERMINAL_API_URL;
const POOL_API_URL = IS_LOCAL_PREVIEW ? '/__pool_proxy__' : 'https://api.tdsp.online/api/pool';
const MITHRIL_API_URL = IS_LOCAL_PREVIEW ? '/__mithril_proxy__' : 'https://api.tdsp.online/api/mithril';
const ICEBREAKER_API_URL = IS_LOCAL_PREVIEW ? '/__icebreaker_proxy__' : 'https://api.tdsp.online/api/icebreaker';
const LEADER_SCHEDULE_API_URL = IS_LOCAL_PREVIEW ? '/__leader_schedule_proxy__' : 'https://api.tdsp.online/api/leader-schedule';
const notifiedRelayMaintenance = new Set();
let headerVisibilityObserver = null;
let poolDelegators = [];
let mithrilSigners = [];
let mithrilStatus = null;

// Fetch and display ADA, BTC, and STRCH prices asynchronously
async function fetchPrices() {
    const adaEl = document.getElementById('ada-price');
    const btcEl = document.getElementById('btc-price');
    const strchEl = document.getElementById('strch-price');

    const [coingeckoResult, geckoterminalResult] = await Promise.allSettled([
        fetch(COINGECKO_PRICE_URL).then(response => {
            if (!response.ok) throw new Error(`CoinGecko HTTP Error: ${response.status}`);
            return response.json();
        }),
        fetch(GECKOTERMINAL_PRICE_URL).then(response => {
            if (!response.ok) throw new Error(`GeckoTerminal HTTP Error: ${response.status}`);
            return response.json();
        })
    ]);

    if (coingeckoResult.status === 'fulfilled') {
        const adaPrice = coingeckoResult.value.cardano?.usd?.toFixed(3);
        const btcPrice = coingeckoResult.value.bitcoin?.usd;
        if (adaEl) adaEl.textContent = adaPrice ? `$${adaPrice}` : 'N/A';
        if (btcEl) {
            btcEl.textContent = Number.isFinite(btcPrice)
                ? `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(btcPrice)}`
                : 'N/A';
        }
    } else {
        if (adaEl) adaEl.textContent = 'N/A';
        if (btcEl) btcEl.textContent = 'N/A';
    }

    if (geckoterminalResult.status === 'fulfilled') {
        const tokenPrices = geckoterminalResult.value?.data?.attributes?.token_prices || {};
        const strchPrice = parseFloat(tokenPrices[TOKEN_IDS.STRCH]);
        if (strchEl) strchEl.textContent = Number.isFinite(strchPrice) ? `$${strchPrice.toFixed(12)}` : 'N/A';
    } else {
        if (strchEl) strchEl.textContent = 'N/A';
    }
}

// Navigate to details page
function goToDetails() {
    window.location.href = "details.html";
}

// Fetch prices on page load and set up auto-update
// Initialize UI behaviors and price fetching when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initPoolCopyButtons();
    initPoolDelegatorsCard();
    initMithrilCard();
    fetchPrices();
    fetchPoolStatus();
    fetchMithrilStatus();
    fetchIcebreakerStatus();
    fetchLeaderSchedule();
    setInterval(fetchPrices, 60000); // Auto-update every 60 seconds
    setInterval(fetchPoolStatus, 300000);
    setInterval(fetchMithrilStatus, 300000);
    setInterval(fetchIcebreakerStatus, 300000);
    setInterval(fetchLeaderSchedule, 300000);
    initUI();
});

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
        const response = await fetch(POOL_API_URL);
        if (!response.ok) throw new Error(`Pool API HTTP Error: ${response.status}`);
        renderPoolStatus(await response.json());
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
        const response = await fetch(MITHRIL_API_URL);
        if (!response.ok) throw new Error(`Mithril API HTTP Error: ${response.status}`);
        renderMithrilStatus(await response.json());
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
    status.classList.toggle('is-active', active === true);
    status.classList.toggle('is-inactive', active === false);
}

async function fetchIcebreakerStatus() {
    try {
        const response = await fetch(ICEBREAKER_API_URL);
        if (!response.ok) throw new Error(`Icebreaker API HTTP Error: ${response.status}`);
        const payload = await response.json();
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
    status.classList.toggle('is-active', active === true);
    status.classList.toggle('is-inactive', active === false);
}

async function fetchLeaderSchedule() {
    const scheduleEl = document.getElementById('leader-schedule');
    if (!scheduleEl) return;

    try {
        const response = await fetch(LEADER_SCHEDULE_API_URL);
        if (!response.ok) throw new Error(`Leader schedule HTTP Error: ${response.status}`);
        renderLeaderSchedule(await response.json());
    } catch (error) {
        renderLeaderScheduleError();
    }
}

function renderLeaderSchedule(schedule) {
    const leadership = Array.isArray(schedule?.leadership) ? schedule.leadership : [];
    setText('leader-schedule-count', formatInteger(schedule?.slotCount ?? leadership.length));
    setText('leader-schedule-meta', `Possible blocks · Epoch ${formatInteger(schedule?.epoch)}`);
}

function renderLeaderScheduleError() {
    setText('leader-schedule-count', 'N/A');
    setText('leader-schedule-meta', 'Possible blocks · Epoch N/A');
}

function renderPoolStatus(pool) {
    poolDelegators = Array.isArray(pool?.delegators) ? [...pool.delegators] : [];
    setText('pool-delegators', formatInteger(pool?.delegator_count));
    setText('pool-live-stake', formatAdaFromLovelace(pool?.live_stake_lovelace));
    setText('pool-id', pool?.pool_id || 'N/A');

    const relays = Array.isArray(pool?.relays) ? pool.relays : [];
    const upCount = relays.filter(relay => relay.up === true).length;
    setRelayCardStatus(relays.length ? upCount : null, relays.length || null);
    setText('pool-last-updated', formatTimestamp(pool?.updated_at));

    const relaysEl = document.getElementById('pool-relays');
    if (!relaysEl) return;

    relaysEl.textContent = '';
    if (!relays.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No relay data available.';
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
    status.classList.toggle('is-active', activeCount !== null && activeCount >= 2);
    status.classList.toggle('is-warning', activeCount === 1);
    status.classList.toggle('is-inactive', activeCount === 0);
}

function initPoolDelegatorsCard() {
    const card = document.getElementById('pool-delegators-card');
    if (!card || card.dataset.delegatorsBound === 'true') return;

    card.dataset.delegatorsBound = 'true';
    card.addEventListener('click', openPoolDelegatorsOverlay);
    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openPoolDelegatorsOverlay();
    });
}

function openPoolDelegatorsOverlay() {
    closePoolDelegatorsOverlay(false);

    const returnFocus = document.getElementById('pool-delegators-card');
    const overlay = document.createElement('div');
    overlay.id = 'pool-delegators-overlay';
    overlay.className = 'governance-overlay governance-menu-overlay governance-drep-overlay';
    overlay.governanceReturnFocus = returnFocus;
    overlay.governanceCloseOverlay = closePoolDelegatorsOverlay;
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closePoolDelegatorsOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog governance-drep-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'pool-delegators-title');

    const header = document.createElement('header');
    header.className = 'overlay-dialog-header';

    const headerCopy = document.createElement('div');
    headerCopy.className = 'overlay-dialog-header-copy';

    const title = document.createElement('h3');
    title.id = 'pool-delegators-title';
    title.className = 'governance-drep-title';
    title.textContent = 'Pool Delegators';

    const meta = document.createElement('span');
    meta.className = 'governance-menu-header-meta';
    meta.textContent = `${poolDelegators.length.toLocaleString('en-US')} delegators`;

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close pool delegators');
    close.addEventListener('click', closePoolDelegatorsOverlay);

    headerCopy.append(title, meta);
    header.append(headerCopy, close);

    const body = document.createElement('div');
    body.className = 'overlay-dialog-body';
    body.appendChild(createPoolDelegatorsList());

    dialog.append(header, body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    close.focus();
}

function closePoolDelegatorsOverlay(restoreFocus = true) {
    const overlay = document.getElementById('pool-delegators-overlay');
    const returnFocus = overlay?.governanceReturnFocus;
    overlay?.remove();
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
}

function initMithrilCard() {
    const card = document.getElementById('pool-mithril-card');
    if (!card || card.dataset.mithrilBound === 'true') return;

    card.dataset.mithrilBound = 'true';
    card.addEventListener('click', openMithrilSignersOverlay);
    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openMithrilSignersOverlay();
    });
}

function openMithrilSignersOverlay() {
    closeMithrilSignersOverlay(false);

    const returnFocus = document.getElementById('pool-mithril-card');
    const overlay = document.createElement('div');
    overlay.id = 'pool-mithril-overlay';
    overlay.className = 'governance-overlay governance-menu-overlay governance-drep-overlay';
    overlay.governanceReturnFocus = returnFocus;
    overlay.governanceCloseOverlay = closeMithrilSignersOverlay;
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeMithrilSignersOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog governance-drep-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'pool-mithril-title');

    const header = document.createElement('header');
    header.className = 'overlay-dialog-header';

    const headerCopy = document.createElement('div');
    headerCopy.className = 'overlay-dialog-header-copy';

    const title = document.createElement('h3');
    title.id = 'pool-mithril-title';
    title.className = 'governance-drep-title';
    title.textContent = 'Active Mithril Signers';

    const meta = document.createElement('span');
    meta.className = 'governance-menu-header-meta';
    const signingEpoch = Number(mithrilStatus?.signing_at_epoch);
    meta.textContent = `${mithrilSigners.length.toLocaleString('en-US')} signers${Number.isFinite(signingEpoch) ? ` · Signing epoch ${signingEpoch.toLocaleString('en-US')}` : ''}`;

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close active Mithril signers');
    close.addEventListener('click', closeMithrilSignersOverlay);

    headerCopy.append(title, meta);
    header.append(headerCopy, close);

    const body = document.createElement('div');
    body.className = 'overlay-dialog-body';
    body.appendChild(createMithrilSignersList());

    dialog.append(header, body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    close.focus();
}

function closeMithrilSignersOverlay(restoreFocus = true) {
    const overlay = document.getElementById('pool-mithril-overlay');
    const returnFocus = overlay?.governanceReturnFocus;
    overlay?.remove();
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
}

function createMithrilSignersList() {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list';

    if (!mithrilSigners.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Active Mithril signer data is not available yet.';
        list.appendChild(message);
        return list;
    }

    mithrilSigners.forEach((signer, index) => {
        const poolId = String(signer?.pool_id || '');
        const row = document.createElement('div');
        row.className = 'pool-delegator-row governance-menu-card';

        const rank = document.createElement('span');
        rank.className = 'pool-delegator-rank';
        rank.textContent = String(index + 1);

        const content = document.createElement('div');
        content.className = 'pool-delegator-content';

        const name = document.createElement('strong');
        name.className = 'pool-delegator-handle';
        name.textContent = signer?.display_name || signer?.name || 'No Name';

        const idLine = document.createElement('div');
        idLine.className = 'pool-delegator-address-line';

        const id = document.createElement('span');
        id.className = 'pool-delegator-address';
        id.textContent = poolId ? shortenStakeAddress(poolId) : 'Unknown pool';
        id.title = poolId;
        idLine.appendChild(id);

        if (poolId) {
            const copy = document.createElement('button');
            copy.className = 'pool-delegator-copy-button';
            copy.type = 'button';
            copy.textContent = '⧉';
            copy.setAttribute('aria-label', `Copy Mithril signer pool ID ${index + 1}`);
            copy.addEventListener('click', async () => {
                const original = copy.textContent;
                try {
                    await copyText(poolId);
                    copy.textContent = 'Copied';
                } catch (error) {
                    copy.textContent = 'Copy failed';
                }
                setTimeout(() => {
                    copy.textContent = original;
                }, 1400);
            });
            idLine.appendChild(copy);
        }

        const stake = document.createElement('span');
        stake.className = 'pool-delegator-amount';
        stake.textContent = formatDelegatorAda(getMithrilSignerStake(signer));

        content.append(name, idLine, stake);
        row.append(rank, content);
        list.appendChild(row);
    });

    return list;
}

function getMithrilSignerStake(signer) {
    try {
        return BigInt(String(signer?.stake_lovelace ?? '0'));
    } catch (error) {
        return 0n;
    }
}

function createPoolDelegatorsList() {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list';

    if (!poolDelegators.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Delegator details are not available yet.';
        list.appendChild(message);
        return list;
    }

    const sortedDelegators = [...poolDelegators].sort((left, right) => {
        const leftAmount = getDelegatorAmount(left);
        const rightAmount = getDelegatorAmount(right);
        return rightAmount > leftAmount ? 1 : rightAmount < leftAmount ? -1 : 0;
    });

    sortedDelegators.forEach((delegator, index) => {
        const address = String(delegator?.stake_address || 'Unknown stake address');
        const adaHandle = String(delegator?.ada_handle || '').trim();
        const row = document.createElement('div');
        row.className = 'pool-delegator-row governance-menu-card';

        const rank = document.createElement('span');
        rank.className = 'pool-delegator-rank';
        rank.textContent = String(index + 1);

        const content = document.createElement('div');
        content.className = 'pool-delegator-content';

        const addressLine = document.createElement('div');
        addressLine.className = 'pool-delegator-address-line';

        const addressText = document.createElement('strong');
        addressText.className = `pool-delegator-address${adaHandle ? ' pool-delegator-handle' : ''}`;
        addressText.textContent = adaHandle || shortenStakeAddress(address);
        addressText.title = address;

        const copy = document.createElement('button');
        copy.className = 'pool-delegator-copy-button';
        copy.type = 'button';
        copy.textContent = '⧉';
        copy.dataset.copyValue = address;
        copy.setAttribute('aria-label', `Copy stake address ${index + 1}`);
        copy.addEventListener('click', async () => {
            const original = copy.textContent;
            const fullAddress = copy.dataset.copyValue;
            try {
                if (!fullAddress) throw new Error('Missing stake address');
                await copyText(fullAddress);
                copy.textContent = 'Copied';
            } catch (error) {
                copy.textContent = 'Copy failed';
            }
            setTimeout(() => {
                copy.textContent = original;
            }, 1400);
        });

        const amount = document.createElement('span');
        amount.className = 'pool-delegator-amount';
        amount.textContent = formatDelegatorAda(getDelegatorAmount(delegator));

        addressLine.append(addressText, copy);
        content.append(addressLine, amount);

        const epoch = Number(delegator?.active_epoch_no);
        if (Number.isFinite(epoch)) {
            const epochText = document.createElement('span');
            epochText.className = 'pool-delegator-epoch';
            epochText.textContent = `Active epoch ${epoch.toLocaleString('en-US')}`;
            content.appendChild(epochText);
        }

        row.append(rank, content);
        list.appendChild(row);
    });

    return list;
}

function getDelegatorAmount(delegator) {
    try {
        return BigInt(String(delegator?.amount_lovelace ?? delegator?.amount ?? '0'));
    } catch (error) {
        return 0n;
    }
}

function formatDelegatorAda(lovelace) {
    const wholeAda = lovelace / 1_000_000n;
    const fraction = lovelace % 1_000_000n;
    const value = `${wholeAda}.${fraction.toString().padStart(6, '0')}`;
    return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value))} ADA`;
}

function shortenStakeAddress(address) {
    if (address.length <= 34) return address;
    return `${address.slice(0, 20)}...${address.slice(-10)}`;
}

function initPoolCopyButtons() {
    document.querySelectorAll('[data-copy-target]').forEach(button => {
        button.addEventListener('click', async () => {
            const target = document.getElementById(button.dataset.copyTarget);
            const value = target?.textContent?.trim();
            if (!value || value === '...' || value === 'N/A') return;

            const originalLabel = button.textContent;
            const originalAriaLabel = button.getAttribute('aria-label') || '';
            try {
                await copyText(value);
                button.textContent = 'Copied';
                button.setAttribute('aria-label', `Copied ${value}`);
                setTimeout(() => {
                    button.textContent = originalLabel;
                    button.setAttribute('aria-label', originalAriaLabel);
                }, 1400);
            } catch (error) {
                button.textContent = 'Copy failed';
                setTimeout(() => {
                    button.textContent = originalLabel;
                }, 1400);
            }
        });
    });
}

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
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

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('en-US').format(number) : 'N/A';
}

function formatAdaFromLovelace(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'N/A';
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number / 1_000_000)} ADA`;
}

function formatTimestamp(value) {
    if (!value) return 'Never';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

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
    const nextTheme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
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

    const targets = Array.from(document.querySelectorAll('.section, .hero-logo, .link-grid, h2, p'));
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
