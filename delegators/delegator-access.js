const MESH_CDN_URL = '../vendor/mesh.js?v=1.9.1-local-20261030';
const ADMIN_ADDRESS = 'addr1qy93p0cfydj548ayt6mh2z572ly4n4s9yaxwzrht2rzc3urjvlyhltxc0287yacjhg8syg4w3dyg3jal6ltksfuc483sel7r8c';
const ADMIN_STAKE_ADDRESS = 'stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';


let ROLE = document.body.dataset.raffleRole === 'admin' ? 'admin' : 'delegator';
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';
const IS_LOCAL = window.TDSPRuntime?.isLocalPreview === true;
const ENDPOINTS = IS_LOCAL ? {
    challenge: '/__raffle_auth_challenge_proxy__',
    verify: '/__raffle_auth_verify_proxy__',
    admin: '/__raffle_admin_proxy__',


    admins: '/__raffle_admin_users_proxy__',


    delegator: '/__raffle_delegator_proxy__'
} : {
    challenge: 'https://api.tdsp.online/api/raffle/auth/challenge',
    verify: 'https://api.tdsp.online/api/raffle/auth/verify',
    admin: 'https://api.tdsp.online/api/raffle/admin',


    admins: 'https://api.tdsp.online/api/raffle/admin/users',


    delegator: 'https://api.tdsp.online/api/raffle/delegator'
};
const ADMIN_SESSION_KEY = 'tdsp-raffle-session-admin';

let meshPromise = null;
let SESSION_KEY = `tdsp-raffle-session-${ROLE}`;
let sessionToken = sessionStorage.getItem(SESSION_KEY) || '';
const dashboardChildOverlays = new Map();
let closePortfolio = null;
let passkeyLoginPending = false;
let portfolioUnlockWallet = null;


let raffleAdminUsers = [];


const RAFFLE_ADMIN_VIEW_TITLES = Object.freeze({
    admins: 'Admin Users'
});


function t(text) {
    return window.TDSPI18n?.translateText?.(text) || text;
}

function setTranslatedText(element, text) {
    if (!(element instanceof HTMLElement)) return;
    const value = String(text || '');
    element.setAttribute('data-i18n-auto', '');
    element.setAttribute('data-i18n-auto-original', value);
    element.textContent = t(value);
}


function loadMesh() {
    if (!meshPromise) meshPromise = import(MESH_CDN_URL).catch(error => {
        meshPromise = null;
        throw error;
    });
    return meshPromise;
}

function setStatus(message, error = false) {
    const element = document.getElementById('raffle-status');
    if (!element) return;
    element.textContent = message ? t(message) : '';
    element.classList.toggle('is-error', error);
    element.hidden = !message;
}

async function requestJson(url, options = {}) {
    const headers = { accept: 'application/json', ...(options.headers || {}) };
    if (options.body) headers['content-type'] = 'application/json';
    const response = await fetch(url, { ...options, headers });
    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }
    if (!response.ok) {
        const error = new Error(payload?.error || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return payload;
}

function authorizedRequest(url, options = {}) {
    sessionToken = sessionStorage.getItem(SESSION_KEY) || '';
    return requestJson(url, {
        ...options,
        headers: { ...(options.headers || {}), authorization: `Bearer ${sessionToken}` }
    });
}

function shorten(value, head = 16, tail = 10) {
    const text = String(value || '');
    return text.length > head + tail + 3 ? `${text.slice(0, head)}...${text.slice(-tail)}` : text;
}

function getDelegatorIdentity(payload = {}) {
    const stakeAddress = String(payload.stake_address || payload.delegator?.stake_address || '').trim();
    return {
        identity: stakeAddress || String(payload.ada_handle || payload.handle || payload.delegator?.ada_handle || payload.delegator?.handle || '').trim(),
        short_identity: stakeAddress ? shorten(stakeAddress) : '',
        stake_address: stakeAddress
    };
}

function postEmbeddedDelegatorIdentity(payload = {}) {
    const detail = getDelegatorIdentity(payload);
    if (window.TDSPRaffleOverlayActive) {
        window.dispatchEvent(new CustomEvent('tdsp:delegator-dashboard-identity', { detail }));
        return;
    }
    if (!IS_EMBEDDED || window.parent === window) return;
    window.parent.postMessage({ type: 'tdsp:delegator-dashboard-identity', ...detail }, window.location.origin);
}


function createCopyButton(value, label) {
    return window.TDSPRuntime.createCopyButton(value, label, {
        className: 'pool-delegator-copy-button',
        ariaLabel: t(`Copy ${label}`),
        title: t(`Copy ${label}`),
        bindOptions: {
            copiedText: t('Copied'),
            resetMs: 1200
        }
    });
}

function addressLine(address, label = 'stake address') {
    const line = document.createElement('div');
    line.className = 'raffle-address-line';
    const text = document.createElement('code');
    const value = String(address || '').trim();
    if (window.TDSPRuntime?.createResponsiveIdentifier && value) {
        text.replaceChildren(window.TDSPRuntime.createResponsiveIdentifier(value));
    } else {
        text.textContent = value || shorten(address);
    }
    text.title = address;
    line.append(text, createCopyButton(address, label));
    return line;
}


function showAuthenticatedUi(authenticated) {
    if (!authenticated && !sessionStorage.getItem('tdsp-portfolio-session')) window.dispatchEvent(new CustomEvent('tdsp:portfolio-session-expired'));
    const access = document.getElementById('raffle-access');
    const protectedArea = document.getElementById('raffle-protected');
    if (access) access.hidden = authenticated;
    if (protectedArea) protectedArea.hidden = !authenticated;
}

function setRaffleAdminView(view = 'admins', { focus = true } = {}) {
    if (ROLE !== 'admin') return;
    const normalizedView = Object.hasOwn(RAFFLE_ADMIN_VIEW_TITLES, view) ? view : 'admins';
    closeDashboardChildOverlay('raffle-view');
    const content = document.querySelector(`[data-raffle-view-panel="${normalizedView}"]`);
    openDashboardChildOverlay('raffle-view',
        RAFFLE_ADMIN_VIEW_TITLES[normalizedView], content);
}

function closeDashboardChildOverlay(key) {
    dashboardChildOverlays.get(key)?.();
}

function openDashboardChildOverlay(key, title, content) {
    if (!content || dashboardChildOverlays.has(key)) return;
    const placeholder = document.createComment('dashboard panel');
    content.before(placeholder);
    const wasHidden = content.hidden;
    content.hidden = false;
    const wrapper = document.createElement('div');
    wrapper.className = 'raffle-page raffle-embedded raffle-overlay-page';
    wrapper.appendChild(content);
    const returnFocus = document.activeElement;
    const close = () => {
        placeholder.replaceWith(content);
        content.hidden = wasHidden;
        elements.overlay.remove();
        dashboardChildOverlays.delete(key);
        window.syncGovernanceMenuOverlayAccessibility?.();
        if (returnFocus?.isConnected) returnFocus.focus();
    };
    const elements = window.createUniversalOverlay({
        id: `dashboard-${key}-overlay`,
        titleId: `dashboard-${key}-title`,
        titleText: title,
        closeLabel: 'Close',
        closeOnBackdrop: false,
        closeOverlay: close,
        returnFocus,
        bodyNodes: [wrapper],
        enableSearch: false
    });
    dashboardChildOverlays.set(key, close);
}

function setRaffleOverlay(open, initialAdminView = 'admins') {
    if (open) {
        if (ROLE === 'admin') setRaffleAdminView(initialAdminView);
        return;
    }
    closeDashboardChildOverlay('raffle-view');
}


async function connectPortfolioPasskey() {
    if (passkeyLoginPending) return;
    passkeyLoginPending = true;
    const button = document.getElementById('member-portfolio-public-open');
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    setStatus('Waiting for your passkey…');
    try {
        const module = await import('./portfolio/app.js?v=20261125-unused-cleanup');
        await module.signInPortfolioWithPasskey();
        await restorePasskeyDashboard(module);
        setStatus('');
    } catch (error) {
        setStatus(error?.name === 'NotAllowedError' ? 'Passkey request cancelled or timed out. Please retry.' : error?.message || 'Sign-in failed.', true);
    } finally {
        passkeyLoginPending = false;
        if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
}

async function restorePasskeyDashboard(module) {
    const session = await module.getPortfolioDashboardSession();
    // A previous wallet's privileges must never carry over to a different passkey.
    sessionStorage.removeItem('tdsp-raffle-session-delegator');
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    portfolioUnlockWallet = null;
    sessionToken = '';
    if (session.role === 'admin') {
        sessionStorage.setItem(ADMIN_SESSION_KEY, session.token);
        window.dispatchEvent(new CustomEvent('tdsp:open-admin-dashboard'));
        return;
    }
    if (session.role === 'delegator') {
        sessionToken = session.token;
        sessionStorage.setItem('tdsp-raffle-session-delegator', sessionToken);
        await loadProtectedArea();
        return;
    }
    throw new Error('Portfolio is available to admins only.');
}

async function openMemberPortfolio() {
    if (closePortfolio) return;
    const container = document.createElement('div');
    container.className = 'member-portfolio-host';
    const refreshAction = document.createElement('span');
    refreshAction.id = 'portfolio-refresh-action';
    refreshAction.className = 'overlay-dialog-header-actions';
    const settingsAction = document.createElement('span');
    settingsAction.id = 'portfolio-settings-action';
    settingsAction.className = 'overlay-dialog-header-actions';
    const returnFocus = document.activeElement;
    let dispose = null;
    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true;
        dispose?.();
        elements.overlay.remove();
        closePortfolio = null;
        window.syncGovernanceMenuOverlayAccessibility?.();
        if (returnFocus?.isConnected) returnFocus.focus();
    };
    const elements = window.createUniversalOverlay({
        id: 'member-portfolio-overlay', titleId: 'member-portfolio-title', titleText: 'Portfolio',
        dialogClass: 'governance-dialog-wide governance-dialog-fit-content portfolio-dialog',
        closeLabel: 'Close portfolio', closeOverlay: close, returnFocus,
        closeOnBackdrop: false,
        bodyNodes: [container], enableSearch: false, extraActions: [refreshAction, settingsAction]
    });
    closePortfolio = close;
    container.textContent = t('Loading member portfolio…');
    try {
        const module = await import('./portfolio/app.js?v=20261125-unused-cleanup');
        if (closed) return;
        container.replaceChildren();
        dispose = module.mountPortfolio(container, { role: ROLE, connectWallet: () => { closePortfolio?.(); populateWallets().catch(error => setStatus(error.message, true)); }, getWallet: (reconnect, stake, linkAnother) => linkAnother ? reconnectPortfolioWallet(stake, true) : reconnect && !portfolioUnlockWallet ? reconnectPortfolioWallet(stake) : portfolioUnlockWallet });
    } catch (error) {
        if (!closed) container.textContent = t(error.message || 'Portfolio could not be loaded. Close and try again.');
    }
}


async function reconnectPortfolioWallet(stake, linkAnother = false) {
    const { BrowserWallet } = await loadMesh();
    const wallets = BrowserWallet.getInstalledWallets();
    if (!wallets.length) throw new Error(t('No CIP-30 Cardano wallet extension was detected.'));
    return new Promise((resolve, reject) => {
        const list = document.createElement('div');
        list.className = 'wallet-list';
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        const { box } = window.TDSPRuntime.createWalletConnectBox({ prompt: 'Select wallet and connect', content: [list, status] });
        let settled = false;
        const close = () => {
            settled = true;
            elements.overlay.remove();
            window.syncGovernanceMenuOverlayAccessibility?.();
        };
        const elements = window.createUniversalOverlay({
            id: 'portfolio-reconnect-overlay', titleId: 'portfolio-reconnect-title', titleText: linkAnother ? 'Link another wallet app' : 'Unlock Portfolio',
            bodyNodes: [box], enableSearch: false, showBack: true, closeOnBackdrop: false,
            closeOverlay: () => { close(); reject(new Error('Wallet connection cancelled.')); }
        });
        wallets.forEach(info => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wallet-option';
            if (info.icon) {
                const icon = document.createElement('img');
                icon.src = info.icon;
                icon.alt = '';
                icon.addEventListener('error', () => icon.remove(), { once: true });
                button.append(icon);
            }
            const label = document.createElement('span');
            label.textContent = info.name;
            button.append(label);
            button.addEventListener('click', async () => {
                list.querySelectorAll('button').forEach(item => { item.disabled = true; });
                status.textContent = '';
                try {
                    const wallet = await BrowserWallet.enable(info.id);
                    if (settled) return;
                    if (await wallet.getNetworkId() !== 1) throw new Error(t('Switch your wallet to Cardano Mainnet.'));
                    const rewards = await getWalletAddresses(wallet, 'getRewardAddresses');
                    if (!rewards.includes(stake)) throw new Error('Select the wallet account used to sign in to this dashboard.');
                    if (settled) return;
                    if (!linkAnother) portfolioUnlockWallet = wallet;
                    close();
                    resolve(wallet);
                } catch (error) {
                    if (settled) return;
                    status.textContent = error?.info || error.message;
                    list.querySelectorAll('button').forEach(item => { item.disabled = false; });
                }
            });
            list.append(button);
        });
    });
}

async function getWalletAddresses(wallet, method) {
    try {
        const result = await wallet[method]?.();
        return Array.isArray(result) ? result.map(value => String(value).toLowerCase()) : [];
    } catch {
        return [];
    }
}

async function authenticateAddress(wallet, address) {
    setStatus('Requesting a one-time wallet challenge...');
    const challenge = await requestJson(ENDPOINTS.challenge, {
        method: 'POST',
        body: JSON.stringify({ role: ROLE, address })
    });
    setStatus('Always check what you are signing. Verify the website and selected account in your wallet before approving. This request only verifies wallet ownership for dashboard access; it does not send funds or create a transaction or network fee. Cancel if the request differs from this or you are unsure.');
    const signed = await wallet.signData(challenge.payload, address);
    const session = await requestJson(ENDPOINTS.verify, {
        method: 'POST',
        body: JSON.stringify({
            challenge_id: challenge.challenge_id,
            address,
            signature: signed.signature,
            key: signed.key
        })
    });
    sessionToken = session.token;
    sessionStorage.setItem(SESSION_KEY, sessionToken);
    if (session.role === 'admin') sessionStorage.setItem(ADMIN_SESSION_KEY, sessionToken);
    window.dispatchEvent(new CustomEvent('tdsp:portfolio-session-expired'));
    portfolioUnlockWallet = wallet;
    setStatus('Wallet verified.');
    await loadProtectedArea();
}

function renderStakeAddressChoices(wallet, addresses) {
    const list = document.getElementById('raffle-wallet-list');
    list.replaceChildren();
    const intro = document.createElement('p');
    intro.className = 'governance-card-detail';
    setTranslatedText(intro, 'Choose the TDSP stake key you want to verify.');
    list.appendChild(intro);
    addresses.forEach(address => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wallet-option raffle-address-option';
        const label = document.createElement('span');
        label.textContent = shorten(address, 18, 12);
        button.appendChild(label);
        button.addEventListener('click', () => authenticateAddress(wallet, address).catch(error => {
            setStatus(error.message, true);
        }));
        list.appendChild(button);
    });
}

async function connectWallet(walletInfo) {
    const { BrowserWallet } = await loadMesh();
    setStatus(`Connecting to ${walletInfo.name}...`);
    const wallet = await BrowserWallet.enable(walletInfo.id);
    if (await wallet.getNetworkId() !== 1) throw new Error(t('Switch your wallet to Cardano Mainnet.'));

    if (ROLE === 'delegator') {
        const rewardAddresses = [...new Set(await getWalletAddresses(wallet, 'getRewardAddresses'))].filter(Boolean);
        if (!rewardAddresses.length) throw new Error(t('No Cardano stake key was found in this wallet.'));
        if (rewardAddresses.length === 1) {
            await authenticateAddress(wallet, rewardAddresses[0]);
            return;
        }
        renderStakeAddressChoices(wallet, rewardAddresses);
        setStatus('Select a stake key to continue.');
        return;
    }

    const [used, unused, rewards] = await Promise.all([
        getWalletAddresses(wallet, 'getUsedAddresses'),
        getWalletAddresses(wallet, 'getUnusedAddresses'),
        getWalletAddresses(wallet, 'getRewardAddresses')
    ]);
    let changeAddress = '';
    try {
        changeAddress = String(await wallet.getChangeAddress()).toLowerCase();
    } catch {
        changeAddress = '';
    }
    const addresses = new Set([...used, ...unused, changeAddress].filter(Boolean));
    if (addresses.has(ADMIN_ADDRESS)) {
        await authenticateAddress(wallet, ADMIN_ADDRESS);
        return;
    }
    if (rewards.includes(ADMIN_STAKE_ADDRESS)) {
        await authenticateAddress(wallet, ADMIN_STAKE_ADDRESS);
        return;
    }
    const candidates = [...new Set([...addresses, ...rewards])];
    let lastError = null;
    for (const candidate of candidates) {
        try {
            await authenticateAddress(wallet, candidate);
            return;
        } catch (error) {
            lastError = error;
        }
    }
    if (lastError?.message && lastError.message !== 'This wallet is not authorized for the Admin Area.') {
        throw lastError;
    }
    throw new Error(t('This wallet does not contain the authorized Admin Area credential.'));
}


async function populateWallets() {
    const list = document.getElementById('raffle-wallet-list');
    const passkey = document.getElementById('member-portfolio-public-open');
    list.replaceChildren(...(passkey ? [passkey] : []));
    setStatus('Detecting installed Cardano wallets...');
    const { BrowserWallet } = await loadMesh();
    if (!list.isConnected) return;
    const wallets = BrowserWallet.getInstalledWallets();
    const access = document.getElementById('raffle-access');
    if (access) access.hidden = false;
    const prompt = access?.querySelector('.wallet-connect-prompt');
    if (prompt) setTranslatedText(prompt, wallets.length ? 'Select Wallet or Passkey to connect' : 'Select Passkey to connect');
    wallets.forEach(walletInfo => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wallet-option';
        const icon = document.createElement('img');
        icon.src = walletInfo.icon;
        icon.alt = '';
        const label = document.createElement('span');
        label.textContent = walletInfo.name;
        button.append(icon, label);
        button.addEventListener('click', () => connectWallet(walletInfo).catch(error => {
            setStatus(error?.info || error.message || t('Wallet access failed.'), true);
        }));
        if (passkey) passkey.before(button);
        else list.appendChild(button);
    });
    setStatus('');
}


function renderAdmin(payload) {

    raffleAdminUsers = Array.isArray(payload.admin_users) ? payload.admin_users : [];
    renderAdminUsers(raffleAdminUsers);
}


function renderAdminUsers(adminUsers) {
    const users = Array.isArray(adminUsers) ? adminUsers : [];
    const list = document.getElementById('raffle-admin-user-list');
    const countText = `${users.length.toLocaleString('en-US')} admin${users.length === 1 ? '' : 's'}`;
    const dashboardCount = document.getElementById('raffle-dashboard-admin-count');
    if (dashboardCount) setTranslatedText(dashboardCount, countText);
    const count = document.getElementById('raffle-admin-users-count');
    if (count) setTranslatedText(count, countText);
    const input = document.getElementById('raffle-admin-addresses');
    if (input) input.value = '';
    if (!list) return;
    list.replaceChildren();
    if (!users.length) {
        const empty = document.createElement('p');
        empty.className = 'governance-card-detail';
        setTranslatedText(empty, 'No admin users are configured.');
        list.appendChild(empty);
        return;
    }
    users.forEach(user => {
        const row = document.createElement('div');
        row.className = 'governance-menu-card raffle-exclusion-item';
        const identity = document.createElement('div');
        identity.className = 'raffle-exclusion-identity';
        const name = document.createElement('strong');
        name.className = 'governance-card-title';
        setTranslatedText(name, user.type === 'stake' ? 'Stake admin' : 'Payment admin');
        const detail = document.createElement('span');
        detail.className = 'governance-card-detail';
        setTranslatedText(detail, user.stake_credential ? 'Stake credential verified' : 'Exact address only');
        identity.append(name, detail, addressLine(user.address, 'admin address'));

        const actions = document.createElement('div');
        actions.className = 'raffle-exclusion-actions';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'governance-vote-secondary raffle-exclusion-remove';
        setTranslatedText(remove, 'Remove');
        remove.disabled = users.length <= 1;
        remove.title = users.length <= 1 ? t('At least one admin user is required.') : '';
        remove.setAttribute('aria-label', t(`Remove ${shorten(user.address)} from Admin Area users`));
        remove.addEventListener('click', async () => {
            const status = document.getElementById('raffle-admin-users-status');
            if (raffleAdminUsers.length <= 1) {
                status.textContent = t('At least one admin user is required.');
                status.classList.add('is-error');
                return;
            }
            remove.disabled = true;
            const saved = await saveAdminUsers(
                raffleAdminUsers.filter(entry => entry.address !== user.address),
                status,
                'Removing admin user...'
            );
            if (!saved) remove.disabled = false;
        });
        actions.appendChild(remove);
        row.append(identity, actions);
        list.appendChild(row);
    });
}

async function saveAdminUsers(users, status, pendingMessage = 'Saving admin users...') {
    if (!status) return null;
    status.classList.remove('is-error');
    status.textContent = t(pendingMessage);
    try {
        await authorizedRequest(ENDPOINTS.admins, {
            method: 'POST',
            body: JSON.stringify({
                admin_users: users.map(user => ({ address: typeof user === 'string' ? user : user.address }))
            })
        });
        const payload = await authorizedRequest(ENDPOINTS.admin);
        renderAdmin(payload);
        const savedCount = Array.isArray(payload.admin_users) ? payload.admin_users.length : 0;
        setTranslatedText(status, `${savedCount.toLocaleString('en-US')} admin ${savedCount === 1 ? 'user' : 'users'} configured.`);
        return payload;
    } catch (error) {
        status.textContent = error?.message || t('The admin users could not be saved.');
        status.classList.add('is-error');
        return null;
    }
}

async function submitAdminUsers(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const status = document.getElementById('raffle-admin-users-status');
    const addresses = String(form.elements.addresses.value || '')
        .split(/[\r\n,]+/)
        .map(value => value.trim())
        .filter(Boolean);
    submit.disabled = true;
    try {
        const usersByAddress = new Map(raffleAdminUsers.map(user => [user.address, user]));
        addresses.forEach(address => usersByAddress.set(address.toLowerCase(), { address }));
        await saveAdminUsers([...usersByAddress.values()], status, 'Adding admin users...');
    } finally {
        submit.disabled = false;
    }
}


function renderDelegator(payload) {
    const label = document.querySelector('#raffle-protected .eyebrow');
    if (label) setTranslatedText(label, 'Verified TDSP delegator');
    const identity = document.getElementById('raffle-identity');
    if (IS_EMBEDDED || window.TDSPRaffleOverlayActive) {
        identity.replaceChildren();
        identity.hidden = true;
    } else {
        identity.hidden = false;
        identity.replaceChildren(document.createTextNode(`${t('Verified stake key')} `), addressLine(payload.stake_address));
    }
    postEmbeddedDelegatorIdentity(payload);
    if (payload.is_admin === true) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, sessionToken);
        if (window.TDSPRaffleOverlayActive) {
            window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent('tdsp:open-admin-dashboard'));
            }, 0);
            return;
        }
    }
}

async function loadProtectedArea() {
    const endpoint = ROLE === 'admin' ? ENDPOINTS.admin : ENDPOINTS.delegator;
    try {
        const payload = await authorizedRequest(endpoint);
        showAuthenticatedUi(true);
        document.body.classList.remove('raffle-auth-gate-pending');
        if (ROLE === 'admin') renderAdmin(payload);
        else renderDelegator(payload);
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            sessionToken = '';
            sessionStorage.removeItem(SESSION_KEY);
            showAuthenticatedUi(false);
        }
        throw error;
    }
}


async function logout() {
    if (sessionStorage.getItem('tdsp-portfolio-session')) {
        try {
            const module = await import('./portfolio/app.js?v=20261125-unused-cleanup');
            await module.signOutPortfolioAccount();
        } catch (error) {
            setStatus(error.message, true);
            return;
        }
    }
    portfolioUnlockWallet = null;
    closePortfolio?.();
    setRaffleOverlay(false);
    sessionToken = '';
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem('tdsp-raffle-session-delegator');
    showAuthenticatedUi(false);
    postEmbeddedDelegatorIdentity();
    setStatus('Wallet session closed.');
    if (ROLE === 'delegator') populateWallets().catch(error => setStatus(error.message, true));
}

function setRaffleRole(role) {
    ROLE = role === 'admin' ? 'admin' : 'delegator';
    SESSION_KEY = `tdsp-raffle-session-${ROLE}`;
    sessionToken = sessionStorage.getItem(SESSION_KEY) || '';
}

async function init(options = {}) {
    const overlayMode = options.overlay === true;
    setRaffleRole(options.role || ROLE);
    window.TDSPRaffleOverlayActive = overlayMode;
    if (IS_EMBEDDED) {
        document.body.classList.add('raffle-embedded');
        postEmbeddedDelegatorIdentity();
    } else if (!overlayMode && ROLE === 'delegator') {
        window.location.replace('index.html#pool');
        return;
    }
    if (!overlayMode && ROLE === 'admin' && !sessionToken) {
        window.location.replace('index.html#pool');
        return;
    }
    document.getElementById('raffle-connect')?.addEventListener('click', () => {
        populateWallets().catch(error => setStatus(error.message, true));
    });
    document.getElementById('raffle-logout')?.addEventListener('click', logout);


    document.getElementById('member-portfolio-open')?.addEventListener('click', openMemberPortfolio);
    document.getElementById('member-portfolio-public-open')?.addEventListener('click', connectPortfolioPasskey);
    document.getElementById('raffle-admin-users-open')?.addEventListener('click', () => setRaffleOverlay(true, 'admins'));

    document.getElementById('website-status-open')?.addEventListener('click', async () => {
        try {
            const { createWebsiteStatusPanel } = await import('./website-status.js?v=20261003-backend-storage');
            let panel = document.getElementById('website-status-panel');
            if (!panel) {
                panel = createWebsiteStatusPanel(() => authorizedRequest(IS_LOCAL
                    ? '/__website_status_proxy__'
                    : 'https://api.tdsp.online/api/raffle/admin/website-status', { cache: 'no-store' }));
                panel.id = 'website-status-panel';
                panel.hidden = true;
                document.getElementById('website-status-open').parentElement.after(panel);
            }
            openDashboardChildOverlay('website-status', 'Website Status', panel);
            panel.refresh();
        } catch (error) {
            setStatus(error.message, true);
        }
    });




    document.getElementById('raffle-admin-users-form')?.addEventListener('submit', submitAdminUsers);

    if (!sessionToken && sessionStorage.getItem('tdsp-portfolio-session') && ROLE === 'delegator') {
        try {
            const module = await import('./portfolio/app.js?v=20261125-unused-cleanup');
            await restorePasskeyDashboard(module);
            document.body.classList.remove('raffle-auth-gate-pending');
            return;
        } catch (error) {
            setStatus(error.message || 'Dashboard could not be loaded. Please try again.', true);
        }
    }
    if (sessionToken) {
        try {
            await loadProtectedArea();
            return;
        } catch (error) {
            if (sessionToken) {
                document.body.classList.remove('raffle-auth-gate-pending');
                showAuthenticatedUi(false);
                setStatus(error.message || 'Dashboard could not be loaded. Please try again.', true);
                if (ROLE === 'delegator') await populateWallets().catch(error => setStatus(error.message, true));
                return;
            }
            if (!overlayMode && ROLE === 'admin') {
                window.location.replace('index.html#pool');
                return;
            }
            setStatus('Your previous wallet session expired. Sign a new challenge to continue.');
        }
    }
    document.body.classList.remove('raffle-auth-gate-pending');
    showAuthenticatedUi(false);
    if (ROLE === 'delegator') await populateWallets().catch(error => setStatus(error.message, true));
}

window.TDSPDelegatorAccess = {
    closePortfolio() { closePortfolio?.(); },
    initOverlay(role) {
        return init({ role, overlay: true });
    }
};
window.TDSPRaffleAccess = window.TDSPDelegatorAccess;

if (document.body.classList.contains('raffle-page')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
}
