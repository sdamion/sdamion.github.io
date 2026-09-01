const MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const ADMIN_ADDRESS = 'addr1qy93p0cfydj548ayt6mh2z572ly4n4s9yaxwzrht2rzc3urjvlyhltxc0287yacjhg8syg4w3dyg3jal6ltksfuc483sel7r8c';
const ADMIN_STAKE_ADDRESS = 'stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
const ADA_HANDLE_POLICY_ID = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const RAFFLE_METADATA_LABEL = 8675309;
const LOST_STAKE_MESSAGE_METADATA_LABEL = 8675310;
const LOST_STAKE_RENDER_BATCH_SIZE = 100;
const LOST_STAKE_MAX_ON_CHAIN_RECIPIENTS = 50;
const LOST_STAKE_MESSAGED_KEY = 'tdsp-lost-stake-messaged-addresses';
const LOST_STAKE_MESSAGE_OUTPUT_LOVELACE = '1000000';
const ADA_HANDLE_API_BASE_URL = 'https://api.handle.me';
let ROLE = document.body.dataset.raffleRole === 'admin' ? 'admin' : 'delegator';
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';
const IS_LOCAL = window.TDSPRuntime?.isLocalPreview === true;
const ENDPOINTS = IS_LOCAL ? {
    challenge: '/__raffle_auth_challenge_proxy__',
    verify: '/__raffle_auth_verify_proxy__',
    admin: '/__raffle_admin_proxy__',
    draw: '/__raffle_admin_draw_proxy__',
    exclusions: '/__raffle_admin_exclusions_proxy__',
    admins: '/__raffle_admin_users_proxy__',
    anchor: '/__raffle_admin_anchor_proxy__',
    delegator: '/__raffle_delegator_proxy__',
    prizes: '/__raffle_prizes_proxy__',
    lostStake: '/__raffle_admin_lost_stake_proxy__',
    chat: '/__constitution_chat_proxy__'
} : {
    challenge: 'https://api.tdsp.online/api/raffle/auth/challenge',
    verify: 'https://api.tdsp.online/api/raffle/auth/verify',
    admin: 'https://api.tdsp.online/api/raffle/admin',
    draw: 'https://api.tdsp.online/api/raffle/admin/draw',
    exclusions: 'https://api.tdsp.online/api/raffle/admin/exclusions',
    admins: 'https://api.tdsp.online/api/raffle/admin/users',
    anchor: 'https://api.tdsp.online/api/raffle/admin/anchor',
    delegator: 'https://api.tdsp.online/api/raffle/delegator',
    prizes: 'https://api.tdsp.online/api/raffle/prizes',
    lostStake: 'https://api.tdsp.online/api/raffle/admin/lost-stake',
    chat: 'https://api.tdsp.online/api/constitution/chat'
};
const ADMIN_SESSION_KEY = 'tdsp-raffle-session-admin';

let meshPromise = null;
let SESSION_KEY = `tdsp-raffle-session-${ROLE}`;
let sessionToken = sessionStorage.getItem(SESSION_KEY) || '';
let raffleOverlayReturnFocus = null;
let adminTransactionWallet = null;
let raffleAnchorSupported = false;
let raffleExclusionsSupported = false;
let raffleExclusionTogglesSupported = false;
let raffleStakeKeyExclusions = [];
let raffleAdminUsers = [];
let raffleAdminView = 'menu';
let raffleOverlayRootView = 'menu';
let lostStakePayload = null;
let lostStakeSortDescending = true;
let lostStakeVisibleCount = LOST_STAKE_RENDER_BATCH_SIZE;
const lostStakeSelectedAddresses = new Set();
const lostStakeMessagedAddresses = new Set(readLostStakeMessagedAddresses());

const RAFFLE_ADMIN_VIEW_TITLES = Object.freeze({
    menu: 'Raffles',
    draw: 'Draw',
    exclusions: 'Exclusion List',
    history: 'History',
    admins: 'Admin Users',
    lost_stake: 'Lost stake'
});

const RAFFLE_ANCHOR_UNAVAILABLE = 'On-chain proof is not available in the running Koios proxy yet. Pull the latest proxy image and restart the container, then reload this page.';
const RAFFLE_EXCLUSIONS_UNAVAILABLE = 'Stake key exclusions are not available in the running Koios proxy yet. Pull the latest proxy image and restart the container, then reload this page.';

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

function readLostStakeMessagedAddresses() {
    try {
        const value = JSON.parse(localStorage.getItem(LOST_STAKE_MESSAGED_KEY) || '[]');
        return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
    } catch {
        return [];
    }
}

function saveLostStakeMessagedAddresses() {
    try {
        localStorage.setItem(LOST_STAKE_MESSAGED_KEY, JSON.stringify([...lostStakeMessagedAddresses]));
    } catch {
        // The sent marker is only a UI convenience; the on-chain transaction remains the source of truth.
    }
}

function markLostStakeDelegatorsMessaged(delegators) {
    let changed = false;
    delegators.forEach(delegator => {
        const address = String(delegator?.stake_address || '').trim();
        if (!address || lostStakeMessagedAddresses.has(address)) return;
        lostStakeMessagedAddresses.add(address);
        changed = true;
    });
    if (changed) saveLostStakeMessagedAddresses();
}

function loadMesh() {
    if (!meshPromise) meshPromise = import(MESH_CDN_URL);
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
    if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload;
}

function authorizedRequest(url, options = {}) {
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

function formatAda(lovelace) {
    let value;
    try {
        value = Number(BigInt(String(lovelace || 0))) / 1_000_000;
    } catch {
        value = 0;
    }
    return `₳ ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
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

function splitMetadataText(value, maxBytes = 64) {
    const chunks = [];
    let chunk = '';
    for (const character of String(value || '')) {
        const next = `${chunk}${character}`;
        if (new TextEncoder().encode(next).length > maxBytes) {
            if (chunk) chunks.push(chunk);
            chunk = character;
        } else {
            chunk = next;
        }
    }
    if (chunk) chunks.push(chunk);
    return chunks.length <= 1 ? chunks[0] || '' : chunks;
}

function cleanMetadataValue(value) {
    if (Array.isArray(value)) return value.map(cleanMetadataValue).filter(item => item !== null && item !== undefined && item !== '');
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value)
            .map(([key, item]) => [key, cleanMetadataValue(item)])
            .filter(([, item]) => item !== null && item !== undefined && item !== ''));
    }
    return value;
}

function buildRaffleMetadata(draw) {
    const metadata = {
        app: 'TDSP',
        type: 'delegator_raffle_result',
        version: 1,
        raffle_id: draw.id,
        title: splitMetadataText(draw.title),
        published_at: draw.published_at,
        pool_id: draw.pool_id,
        winner_stake_address: splitMetadataText(draw.winner?.stake_address),
        winner_handle: splitMetadataText(draw.winner?.ada_handle),
        eligible_count: Number(draw.eligible_count),
        total_eligible_lovelace: String(draw.total_eligible_lovelace || '0'),
        snapshot_sha256: draw.snapshot_sha256,
        selection_entropy: draw.selection_entropy,
        selection_index: Number(draw.selection_index)
    };
    return Object.fromEntries(Object.entries(metadata).filter(([, value]) => (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (typeof value !== 'number' || Number.isFinite(value))
    )));
}

function buildLostStakeMessageMetadata(message, selectedDelegators) {
    const recipients = selectedDelegators.map(delegator => ({
        stake_address: splitMetadataText(delegator.stake_address),
        wallet_address: splitMetadataText(getLostStakePaymentAddress(delegator) || ''),
        ada_handle: splitMetadataText(delegator.ada_handle || ''),
        amount_lovelace: String(delegator.amount_lovelace || '0'),
        pools: (Array.isArray(delegator.pools) ? delegator.pools : []).slice(0, 3).map(pool => ({
            pool_id: splitMetadataText(pool.pool_id || ''),
            pool_name: splitMetadataText(pool.pool_name || pool.ticker || ''),
            retired_epoch: Number(pool.retired_epoch) || undefined
        }))
    }));
    return cleanMetadataValue({
        app: 'TDSP',
        type: 'lost_stake_message',
        version: 1,
        created_at: new Date().toISOString(),
        minimum_lovelace: String(lostStakePayload?.minimum_lovelace || '200000000'),
        recipient_count: recipients.length,
        total_selected_lovelace: selectedDelegators
            .reduce((sum, delegator) => sum + BigInt(String(delegator.amount_lovelace || '0')), 0n)
            .toString(),
        message: splitMetadataText(message, 64),
        recipients
    });
}

function getLostStakePaymentAddress(delegator) {
    const candidates = [
        delegator?.registered_payment_address,
        delegator?.wallet_address,
        delegator?.payment_address,
        ...(Array.isArray(delegator?.payment_addresses) ? delegator.payment_addresses : [])
    ];
    return candidates
        .map(address => String(address || '').trim())
        .find(address => /^addr1[0-9a-z]+$/i.test(address)) || '';
}

function getLostStakeAdaHandleTarget(delegator) {
    const handle = String(delegator?.ada_handle || '').trim();
    if (!handle) return '';
    const normalized = handle.startsWith('$') ? handle : `$${handle}`;
    return /^\$[0-9A-Za-z_.-]{1,64}$/.test(normalized) ? normalized : '';
}

function getLostStakePaymentTarget(delegator) {
    return getLostStakePaymentAddress(delegator) || getLostStakeAdaHandleTarget(delegator);
}

async function resolveAdaHandlePaymentAddress(handle) {
    const normalized = String(handle || '').trim().replace(/^\$/, '');
    if (!/^[0-9A-Za-z_.-]{1,64}$/.test(normalized)) return '';
    const response = await fetch(`${ADA_HANDLE_API_BASE_URL}/handles/${encodeURIComponent(normalized)}`, {
        headers: { accept: 'application/json' }
    });
    if (response.status === 404) return '';
    if (!response.ok) throw new Error(t(`ADA Handle lookup failed with HTTP ${response.status}.`));
    const payload = await response.json();
    const address = String(payload?.resolved_addresses?.ada || payload?.address || '').trim();
    return /^addr1[0-9a-z]+$/i.test(address) ? address : '';
}

async function resolveLostStakePaymentTarget(delegator) {
    const paymentAddress = getLostStakePaymentAddress(delegator);
    if (paymentAddress) return paymentAddress;
    const handle = getLostStakeAdaHandleTarget(delegator);
    if (!handle) return '';
    return resolveAdaHandlePaymentAddress(handle);
}

function getLostStakeDisplayIdentity(delegator) {
    const adaHandle = String(delegator?.ada_handle || '').trim();
    if (adaHandle) return { value: adaHandle, type: 'ada_handle', label: 'ADA handle' };
    const walletAddress = getLostStakePaymentAddress(delegator);
    if (walletAddress) return { value: walletAddress, type: 'wallet_address', label: 'Wallet address' };
    const stakeAddress = String(delegator?.stake_address || '').trim();
    return { value: stakeAddress || 'Stake key', type: 'stake_address', label: 'Stake key' };
}

function getLostStakeIdentitySortRank(delegator) {
    const type = getLostStakeDisplayIdentity(delegator).type;
    if (type === 'ada_handle' || type === 'wallet_address') return 0;
    return 2;
}

function getLostStakeVisibleMessageRecipients(selectedDelegators) {
    return Promise.all(selectedDelegators.map(async delegator => ({
        delegator,
        paymentTarget: await resolveLostStakePaymentTarget(delegator)
    }))).then(entries => entries.filter(entry => entry.paymentTarget));
}

function buildLostStakeWalletMessage(message, selectedDelegators) {
    const intro = `TDSP lost stake notice for ${selectedDelegators.length} stake key${selectedDelegators.length === 1 ? '' : 's'}.`;
    const chunks = splitMetadataText(`${intro} ${message}`, 64);
    return {
        msg: Array.isArray(chunks) ? chunks : [chunks].filter(Boolean)
    };
}

function cardanoscanTransactionLink(txHash) {
    const link = document.createElement('a');
    link.href = `https://cardanoscan.io/transaction/${encodeURIComponent(txHash)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    setTranslatedText(link, 'View transaction on Cardanoscan');
    return link;
}

function showAuthenticatedUi(authenticated) {
    const access = document.getElementById('raffle-access');
    const protectedArea = document.getElementById('raffle-protected');
    if (access) access.hidden = authenticated;
    if (protectedArea) protectedArea.hidden = !authenticated;
}

function setRaffleAdminView(view = 'menu', { focus = true } = {}) {
    if (ROLE !== 'admin') return;
    const normalizedView = Object.hasOwn(RAFFLE_ADMIN_VIEW_TITLES, view) ? view : 'menu';
    raffleAdminView = normalizedView;
    const menu = document.getElementById('raffle-admin-menu');
    if (menu) menu.hidden = normalizedView !== 'menu';
    document.querySelectorAll('[data-raffle-view-panel]').forEach(panel => {
        panel.hidden = panel.dataset.raffleViewPanel !== normalizedView;
    });

    const title = document.getElementById('raffle-overlay-title');
    if (title) setTranslatedText(title, RAFFLE_ADMIN_VIEW_TITLES[normalizedView]);
    const back = document.getElementById('raffle-overlay-back');
    if (back) back.hidden = false;

    if (normalizedView === 'lost_stake' && !lostStakePayload) {
        loadLostStake().catch(error => renderLostStakeError(error.message));
    }
    if (!focus) return;
    if (normalizedView === 'menu') document.querySelector('[data-raffle-view]')?.focus();
    else back?.focus();
}

function setRaffleOverlay(open, initialAdminView = 'menu') {
    const overlay = document.getElementById('raffle-overlay');
    if (!overlay) return;
    if (open) {
        raffleOverlayReturnFocus = document.activeElement;
        raffleOverlayRootView = initialAdminView;
        if (ROLE === 'admin') setRaffleAdminView(initialAdminView, { focus: false });
        overlay.hidden = false;
        document.body.classList.add('raffle-overlay-open');
        if (ROLE === 'admin' && initialAdminView !== 'menu') {
            document.getElementById('raffle-overlay-back')?.focus();
        } else {
            document.querySelector('[data-raffle-view]')?.focus();
        }
        return;
    }
    overlay.hidden = true;
    if (ROLE === 'admin') setRaffleAdminView('menu', { focus: false });
    raffleOverlayRootView = 'menu';
    document.body.classList.remove('raffle-overlay-open');
    raffleOverlayReturnFocus?.focus?.();
    raffleOverlayReturnFocus = null;
}

function setPrizeOverlay(open) {
    const overlay = document.getElementById('raffle-prizes-overlay');
    if (!overlay) return;
    if (open) {
        raffleOverlayReturnFocus = document.activeElement;
        overlay.hidden = false;
        document.body.classList.add('raffle-overlay-open');
        document.getElementById('raffle-prizes-close')?.focus();
        loadRafflePrizes().catch(error => renderRafflePrizesError(error.message));
        return;
    }
    overlay.hidden = true;
    document.body.classList.remove('raffle-overlay-open');
    raffleOverlayReturnFocus?.focus?.();
    raffleOverlayReturnFocus = null;
}

function formatPrizeLine(asset) {
    const amount = String(asset?.display_quantity || asset?.quantity || '0');
    const name = String(asset?.ticker || asset?.name || 'Token').trim();
    return `${amount} ${name}`.trim();
}

function isAdaPrizeAsset(asset) {
    const policyId = String(asset?.policy_id || '').trim();
    const assetId = String(asset?.asset_id || '').trim().toLowerCase();
    const ticker = String(asset?.ticker || '').trim().toUpperCase();
    const name = String(asset?.name || '').trim().toUpperCase();
    return !policyId
        || policyId.toLowerCase() === ADA_HANDLE_POLICY_ID
        || assetId === 'ada'
        || assetId === 'lovelace'
        || ticker === 'ADA'
        || name === 'ADA';
}

function resolvePrizeImageUrl(value) {
    const image = String(value || '').trim();
    if (!image) return '';
    if (/^(https?:|data:|blob:)/i.test(image)) return image;
    if (image.startsWith('/api/raffle/prize-image/')) {
        const file = image.split('/').pop() || '';
        if (IS_LOCAL || window.TDSPRuntime?.isLocalPreview === true) {
            return `/__raffle_prize_image_proxy__?file=${encodeURIComponent(file)}`;
        }
    }
    try {
        return new URL(image, ENDPOINTS.prizes).href;
    } catch {
        return image;
    }
}

function getPrizeImageSource(asset) {
    return asset?.image
        || asset?.image_url
        || asset?.logo
        || asset?.icon
        || asset?.metadata?.image
        || asset?.metadata?.logo
        || '';
}

function createPrizeCard(asset) {
    const card = document.createElement('article');
    card.className = 'governance-menu-card raffle-draw-card';
    const imageUrl = resolvePrizeImageUrl(getPrizeImageSource(asset));
    if (imageUrl) card.classList.add('has-prize-image');

    window.TDSPRuntime?.appendUniversalTileContent?.(card, {
        title: String(asset?.name || asset?.ticker || asset?.fingerprint || 'Token'),
        titleClassName: 'governance-card-title',
        detailItems: [{
            text: formatPrizeLine(asset),
            className: 'governance-card-detail'
        }],
        translate: setTranslatedText
    });

    if (asset?.asset_id) {
        const link = document.createElement('a');
        link.className = 'governance-card-detail raffle-prize-token-link';
        link.href = `https://cardanoscan.io/token/${encodeURIComponent(String(asset.asset_id))}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        setTranslatedText(link, 'View on Cardanoscan');
        card.appendChild(link);
    }

    if (imageUrl) {
        const image = document.createElement('img');
        image.className = 'raffle-prize-image';
        image.src = imageUrl;
        image.alt = `${String(asset?.name || asset?.ticker || 'Token')} logo`;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => {
            image.remove();
            card.classList.remove('has-prize-image');
        }, { once: true });
        card.appendChild(image);
    }

    return card;
}

function renderRafflePrizes(payload = {}) {
    const summary = document.getElementById('raffle-prizes-summary');
    const list = document.getElementById('raffle-prizes-list');
    const assets = (Array.isArray(payload.assets) ? payload.assets : []).filter(asset => !isAdaPrizeAsset(asset));
    if (summary) {
        setTranslatedText(summary, `${assets.length.toLocaleString('en-US')} token${assets.length === 1 ? '' : 's'}`);
    }
    if (!list) return;
    list.replaceChildren();
    if (!assets.length) {
        const empty = document.createElement('p');
        empty.className = 'governance-menu-card governance-card-detail raffle-draw-card raffle-empty';
        setTranslatedText(empty, 'No prize tokens are currently in the raffle wallet.');
        list.appendChild(empty);
        return;
    }
    assets.forEach(asset => list.appendChild(createPrizeCard(asset)));
}

function renderRafflePrizesError(message) {
    const summary = document.getElementById('raffle-prizes-summary');
    if (summary) setTranslatedText(summary, 'Prize wallet unavailable');
    const list = document.getElementById('raffle-prizes-list');
    if (!list) return;
    const error = document.createElement('p');
    error.className = 'governance-menu-card governance-card-detail raffle-draw-card raffle-empty';
    setTranslatedText(error, message || 'Prize wallet could not be loaded.');
    list.replaceChildren(error);
}

async function loadRafflePrizes() {
    const payload = await requestJson(ENDPOINTS.prizes);
    renderRafflePrizes(payload);
    return payload;
}

function getLostStakeDelegators() {
    return Array.isArray(lostStakePayload?.delegators) ? lostStakePayload.delegators : [];
}

function getSelectedLostStakeDelegators() {
    return getLostStakeDelegators().filter(delegator => lostStakeSelectedAddresses.has(delegator.stake_address));
}

function updateLostStakeSelectionStatus() {
    const status = document.getElementById('raffle-lost-stake-status');
    if (!status) return;
    const selected = getSelectedLostStakeDelegators();
    if (!selected.length) {
        status.textContent = '';
        status.classList.remove('is-error');
        return;
    }
    const total = selected.reduce((sum, delegator) => sum + BigInt(String(delegator.amount_lovelace || '0')), 0n);
    status.textContent = t(`${selected.length.toLocaleString('en-US')} selected · ${formatAda(total.toString())}`);
    status.classList.remove('is-error');
}

function createLostStakeDetailRow(label, value, copyLabel = null) {
    const row = document.createElement('div');
    row.className = 'raffle-lost-stake-detail-row';
    const labelNode = document.createElement('span');
    labelNode.className = 'governance-card-detail';
    setTranslatedText(labelNode, label);
    const valueNode = copyLabel
        ? addressLine(value, copyLabel)
        : document.createElement('strong');
    if (!copyLabel) {
        valueNode.className = 'governance-card-title';
        valueNode.textContent = value || '-';
    }
    row.append(labelNode, valueNode);
    return row;
}

function openLostStakeDelegatorDetail(delegator) {
    const list = document.getElementById('raffle-lost-stake-list');
    if (!list) return;
    const detail = document.createElement('article');
    detail.className = 'governance-menu-card raffle-lost-stake-detail';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'governance-vote-secondary';
    setTranslatedText(back, 'Back to list');
    back.addEventListener('click', () => renderLostStake(lostStakePayload));

    const title = document.createElement('strong');
    title.className = 'governance-card-title';
    title.textContent = getLostStakeDisplayIdentity(delegator).value;

    const pools = Array.isArray(delegator?.pools) ? delegator.pools : [];
    const poolList = document.createElement('div');
    poolList.className = 'raffle-lost-stake-pools';
    if (pools.length) {
        pools.forEach(pool => {
            const poolCard = document.createElement('div');
            poolCard.className = 'governance-menu-card raffle-lost-stake-pool';
            const poolName = document.createElement('strong');
            poolName.className = 'governance-card-title';
            poolName.textContent = pool.pool_name || pool.ticker || 'Retired pool';
            poolCard.append(
                poolName,
                createLostStakeDetailRow('Pool ID', pool.pool_id || '-', pool.pool_id ? 'pool ID' : null),
                createLostStakeDetailRow('Retired epoch', pool.retired_epoch ?? pool.retiring_epoch ?? '-'),
                createLostStakeDetailRow('Stake', formatAda(pool.amount_lovelace || delegator.amount_lovelace || '0'))
            );
            poolList.appendChild(poolCard);
        });
    } else {
        const emptyPools = document.createElement('p');
        emptyPools.className = 'governance-card-detail';
        setTranslatedText(emptyPools, 'No retired pool details are cached for this stake key.');
        poolList.appendChild(emptyPools);
    }

    detail.append(
        back,
        title,
        createLostStakeDetailRow('ADA handle', delegator.ada_handle || '-'),
        createLostStakeDetailRow('Stake', formatAda(delegator.amount_lovelace)),
        createLostStakeDetailRow('Wallet address', getLostStakePaymentAddress(delegator) || '-', getLostStakePaymentAddress(delegator) ? 'wallet address' : null),
        createLostStakeDetailRow('Message target', getLostStakePaymentTarget(delegator) || '-'),
        createLostStakeDetailRow('Stake key', delegator.stake_address, 'stake address'),
        poolList
    );
    list.replaceChildren(detail);
}

function createLostStakeDelegatorCard(delegator) {
    const card = document.createElement('article');
    card.tabIndex = 0;
    card.role = 'button';
    card.className = 'governance-menu-card raffle-lost-stake-row';
    card.addEventListener('click', () => openLostStakeDelegatorDetail(delegator));
    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openLostStakeDelegatorDetail(delegator);
    });
    const amount = document.createElement('strong');
    amount.className = 'raffle-lost-stake-amount';
    amount.textContent = formatAda(delegator.amount_lovelace);
    const identity = document.createElement('span');
    identity.className = 'raffle-lost-stake-identity';
    const identityInfo = getLostStakeDisplayIdentity(delegator);
    if (window.TDSPRuntime?.createResponsiveIdentifier && identityInfo.type !== 'ada_handle') {
        identity.replaceChildren(window.TDSPRuntime.createResponsiveIdentifier(identityInfo.value));
    } else {
        identity.textContent = identityInfo.value;
    }
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'raffle-lost-stake-select';
    checkbox.value = delegator.stake_address;
    checkbox.checked = lostStakeSelectedAddresses.has(delegator.stake_address);
    checkbox.setAttribute('data-lost-stake-select', '');
    checkbox.setAttribute('aria-label', t(`Select ${identityInfo.value}`));
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) lostStakeSelectedAddresses.add(delegator.stake_address);
        else lostStakeSelectedAddresses.delete(delegator.stake_address);
        updateLostStakeSelectionStatus();
    });
    checkbox.addEventListener('click', event => event.stopPropagation());
    const sent = document.createElement('span');
    sent.className = 'raffle-lost-stake-sent';
    sent.textContent = lostStakeMessagedAddresses.has(String(delegator.stake_address || '').trim()) ? '✉' : '';
    sent.title = t('On-chain message sent');
    sent.setAttribute('aria-label', sent.textContent ? t('On-chain message sent') : '');
    card.append(amount, identity, sent, checkbox);
    return card;
}

function renderLostStake(payload = lostStakePayload) {
    lostStakePayload = payload || {};
    const delegators = getLostStakeDelegators().slice().sort((left, right) => {
        const leftAmount = BigInt(String(left.amount_lovelace || '0'));
        const rightAmount = BigInt(String(right.amount_lovelace || '0'));
        const leftRank = getLostStakeIdentitySortRank(left);
        const rightRank = getLostStakeIdentitySortRank(right);
        if (leftRank !== rightRank) return leftRank - rightRank;
        if (rightAmount !== leftAmount) {
            const result = rightAmount > leftAmount ? 1 : -1;
            return lostStakeSortDescending ? result : -result;
        }
        return getLostStakeDisplayIdentity(left).value.localeCompare(getLostStakeDisplayIdentity(right).value);
    });
    const dashboardCount = document.getElementById('raffle-dashboard-lost-stake-count');
    const menuCount = document.getElementById('raffle-menu-lost-stake-count');
    const countText = `${delegators.length.toLocaleString('en-US')} stake keys over ${formatAda(lostStakePayload.minimum_lovelace || '200000000')}`;
    if (dashboardCount) setTranslatedText(dashboardCount, countText);
    if (menuCount) setTranslatedText(menuCount, countText);
    const summary = document.getElementById('raffle-lost-stake-summary');
    if (summary) {
        summary.textContent = `${delegators.length.toLocaleString('en-US')} stake keys · ${formatAda(lostStakePayload.total_lovelace || '0')} on retired pools`;
    }
    const sort = document.getElementById('raffle-lost-stake-sort');
    if (sort) setTranslatedText(sort, lostStakeSortDescending ? 'Sort: highest stake first' : 'Sort: lowest stake first');
    const list = document.getElementById('raffle-lost-stake-list');
    if (!list) return;
    list.replaceChildren();
    if (!delegators.length) {
        const empty = document.createElement('p');
        empty.className = 'governance-card-detail';
        setTranslatedText(empty, 'No lost stake over 200 ADA is cached yet.');
        list.appendChild(empty);
        return;
    }
    const visibleDelegators = delegators.slice(0, Math.max(LOST_STAKE_RENDER_BATCH_SIZE, lostStakeVisibleCount));
    const fragment = document.createDocumentFragment();
    visibleDelegators.forEach(delegator => fragment.appendChild(createLostStakeDelegatorCard(delegator)));
    list.appendChild(fragment);
    if (visibleDelegators.length < delegators.length) {
        const loadMore = document.createElement('button');
        loadMore.type = 'button';
        loadMore.className = 'governance-vote-secondary';
        setTranslatedText(loadMore, `Load ${Math.min(LOST_STAKE_RENDER_BATCH_SIZE, delegators.length - visibleDelegators.length).toLocaleString('en-US')} more`);
        loadMore.addEventListener('click', () => {
            lostStakeVisibleCount += LOST_STAKE_RENDER_BATCH_SIZE;
            renderLostStake(lostStakePayload);
        });
        list.appendChild(loadMore);
    }
    updateLostStakeSelectionStatus();
}

function renderLostStakeError(message) {
    const list = document.getElementById('raffle-lost-stake-list');
    if (!list) return;
    const error = document.createElement('p');
    error.className = 'governance-card-detail';
    setTranslatedText(error, message || 'Lost stake data could not be loaded.');
    list.replaceChildren(error);
}

async function loadLostStake() {
    let payload;
    try {
        payload = await authorizedRequest(ENDPOINTS.lostStake);
    } catch (error) {
        if (/HTTP 404/i.test(error?.message || '')) {
            throw new Error('Lost stake data route is not available in the running Koios proxy yet. Pull the latest proxy image, restart the container and restart the local test server, then reload this page.');
        }
        throw error;
    }
    lostStakeVisibleCount = LOST_STAKE_RENDER_BATCH_SIZE;
    renderLostStake(payload);
    return payload;
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
    setStatus('Review and sign the access challenge in your wallet. No transaction or fee is created.');
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
        const rewardAddresses = await getWalletAddresses(wallet, 'getRewardAddresses');
        if (!rewardAddresses.length) throw new Error(t('No Cardano stake key was found in this wallet.'));
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
        adminTransactionWallet = wallet;
        await authenticateAddress(wallet, ADMIN_ADDRESS);
        return;
    }
    if (rewards.includes(ADMIN_STAKE_ADDRESS)) {
        adminTransactionWallet = wallet;
        await authenticateAddress(wallet, ADMIN_STAKE_ADDRESS);
        return;
    }
    const candidates = [...new Set([...addresses, ...rewards])];
    let lastError = null;
    for (const candidate of candidates) {
        try {
            adminTransactionWallet = wallet;
            await authenticateAddress(wallet, candidate);
            return;
        } catch (error) {
            lastError = error;
        }
    }
    adminTransactionWallet = null;
    if (lastError?.message && lastError.message !== 'This wallet is not authorized for the Admin Area.') {
        throw lastError;
    }
    throw new Error(t('This wallet does not contain the authorized Admin Area credential.'));
}

async function walletHasAdminCredential(wallet) {
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
    return rewards.includes(ADMIN_STAKE_ADDRESS) || [...used, ...unused, changeAddress].includes(ADMIN_ADDRESS);
}

async function recordSubmittedRaffleProof(draw, txHash) {
    const payload = await authorizedRequest(ENDPOINTS.anchor, {
        method: 'POST',
        body: JSON.stringify({ draw_id: draw.id, tx_hash: txHash })
    });
    sessionStorage.removeItem(`tdsp-raffle-anchor-${draw.id}`);
    return payload.draw;
}

async function submitRaffleProofTransaction(draw, button, status) {
    if (!raffleAnchorSupported) {
        status.textContent = RAFFLE_ANCHOR_UNAVAILABLE;
        status.classList.add('is-error');
        return;
    }
    button.disabled = true;
    const pendingKey = `tdsp-raffle-anchor-${draw.id}`;
    try {
        const pendingHash = sessionStorage.getItem(pendingKey);
        if (pendingHash && /^[0-9a-f]{64}$/i.test(pendingHash)) {
            status.textContent = t('Recording the previously submitted transaction ID...');
            await recordSubmittedRaffleProof(draw, pendingHash);
        } else {
            if (!adminTransactionWallet) throw new Error(t('Choose the admin wallet first.'));
            status.textContent = t('Building the on-chain raffle proof transaction...');
            const utxos = await adminTransactionWallet.getUtxos();
            const changeAddress = await adminTransactionWallet.getChangeAddress();
            if (!utxos?.length || !changeAddress) throw new Error(t('No spendable wallet UTxO was found for the network fee.'));
            const { MeshTxBuilder } = await loadMesh();
            const unsignedTx = await new MeshTxBuilder({ verbose: false })
                .metadataValue(RAFFLE_METADATA_LABEL, buildRaffleMetadata(draw))
                .selectUtxosFrom(utxos)
                .changeAddress(changeAddress)
                .complete();
            status.textContent = t('Verify the raffle proof metadata and network fee in your wallet before signing.');
            const signedTx = await adminTransactionWallet.signTx(unsignedTx, false);
            status.textContent = t('Submitting the signed transaction...');
            const txHash = String(await adminTransactionWallet.submitTx(signedTx)).toLowerCase();
            if (!/^[0-9a-f]{64}$/.test(txHash)) throw new Error(t('The wallet returned an invalid transaction ID.'));
            sessionStorage.setItem(pendingKey, txHash);
            status.textContent = t('Transaction submitted. Recording its transaction ID with the raffle...');
            await recordSubmittedRaffleProof(draw, txHash);
        }
        setStatus('The raffle result now has an on-chain transaction proof.');
        renderAdmin(await authorizedRequest(ENDPOINTS.admin));
    } catch (error) {
        const message = error?.info || error?.message || t('The on-chain raffle proof could not be submitted.');
        status.textContent = message === 'HTTP 404'
            ? `${RAFFLE_ANCHOR_UNAVAILABLE} A submitted transaction ID is preserved in this browser and will be registered without creating another transaction.`
            : message;
        status.classList.add('is-error');
        button.disabled = false;
    }
}

async function chooseRaffleTransactionWallet(draw, button, status, choices) {
    choices.replaceChildren();
    button.disabled = true;
    try {
        const { BrowserWallet } = await loadMesh();
        const wallets = BrowserWallet.getInstalledWallets();
        if (!wallets.length) throw new Error(t('No CIP-30 Cardano wallet extension was detected.'));
        const intro = document.createElement('p');
        intro.className = 'governance-card-detail';
        setTranslatedText(intro, 'Choose the authorized wallet that will pay the Cardano network fee.');
        choices.appendChild(intro);
        wallets.forEach(walletInfo => {
            const walletButton = document.createElement('button');
            walletButton.type = 'button';
            walletButton.className = 'wallet-option';
            const icon = document.createElement('img');
            icon.src = walletInfo.icon;
            icon.alt = '';
            const label = document.createElement('span');
            label.textContent = walletInfo.name;
            walletButton.append(icon, label);
            walletButton.addEventListener('click', async () => {
                walletButton.disabled = true;
                try {
                    const wallet = await BrowserWallet.enable(walletInfo.id);
                    if (await wallet.getNetworkId() !== 1) throw new Error(t('Switch your wallet to Cardano Mainnet.'));
                    if (!await walletHasAdminCredential(wallet)) throw new Error(t('This wallet does not contain the authorized admin stake credential.'));
                    adminTransactionWallet = wallet;
                    choices.replaceChildren();
                    await submitRaffleProofTransaction(draw, button, status);
                } catch (error) {
                    status.textContent = error?.info || error?.message || t('Wallet connection failed.');
                    status.classList.add('is-error');
                    walletButton.disabled = false;
                    button.disabled = false;
                }
            });
            choices.appendChild(walletButton);
        });
    } catch (error) {
        status.textContent = error.message;
        status.classList.add('is-error');
        button.disabled = false;
    }
}

async function improveLostStakeMessage() {
    const status = document.getElementById('raffle-lost-stake-status');
    const message = document.getElementById('raffle-lost-stake-message');
    const improved = document.getElementById('raffle-lost-stake-improved-message');
    const button = document.getElementById('raffle-lost-stake-improve');
    if (!message || !improved || !status || !button) return;
    const originalMessage = String(message.value || '').trim();
    if (!originalMessage) {
        status.textContent = t('Enter a message first.');
        status.classList.add('is-error');
        return;
    }
    button.disabled = true;
    status.classList.remove('is-error');
    status.textContent = t('Ask AI is improving the message...');
    const selected = getSelectedLostStakeDelegators();
    try {
        const payload = await requestJson(ENDPOINTS.chat, {
            method: 'POST',
            body: JSON.stringify({
                question: 'Improve this lost stake message.',
                stream: false,
                context: {
                    kind: 'admin_lost_stake',
                    id: 'lost_stake_message',
                    task: 'improve_lost_stake_message',
                    original_message: originalMessage,
                    recipient_count: selected.length,
                    total_lovelace: selected.reduce((sum, delegator) => sum + BigInt(String(delegator.amount_lovelace || '0')), 0n).toString(),
                    minimum_lovelace: lostStakePayload?.minimum_lovelace || '200000000'
                }
            })
        });
        improved.value = String(payload.answer || '').trim();
        status.textContent = t('AI improved message ready. Review it before publishing on-chain.');
    } catch (error) {
        status.textContent = error?.message || t('Ask AI could not improve the message.');
        status.classList.add('is-error');
    } finally {
        button.disabled = false;
    }
}

async function publishLostStakeMessage(selected, message, submit, status) {
    status.textContent = t('Resolving wallet addresses and ADA Handles...');
    const visibleRecipients = await getLostStakeVisibleMessageRecipients(selected);
    if (!visibleRecipients.length) {
        throw new Error(t('No selected stake key has a known wallet address or ADA Handle. A wallet-visible transaction cannot be built.'));
    }
    if (visibleRecipients.length !== selected.length) {
        throw new Error(t(`${selected.length - visibleRecipients.length} selected stake key${selected.length - visibleRecipients.length === 1 ? '' : 's'} have no known wallet address or ADA Handle. Select only rows with wallet addresses or ADA Handles for a wallet-visible message.`));
    }
    status.textContent = t('Building the on-chain lost stake message transaction...');
    const utxos = await adminTransactionWallet.getUtxos();
    const changeAddress = await adminTransactionWallet.getChangeAddress();
    if (!utxos?.length || !changeAddress) throw new Error(t('No spendable wallet UTxO was found for the network fee.'));
    const { MeshTxBuilder } = await loadMesh();
    const txBuilder = new MeshTxBuilder({ verbose: false });
    visibleRecipients.forEach(({ paymentTarget }) => {
        txBuilder.txOut(paymentTarget, [{ unit: 'lovelace', quantity: LOST_STAKE_MESSAGE_OUTPUT_LOVELACE }]);
    });
    const unsignedTx = await txBuilder
        .metadataValue(674, buildLostStakeWalletMessage(message, selected))
        .metadataValue(LOST_STAKE_MESSAGE_METADATA_LABEL, buildLostStakeMessageMetadata(message, selected))
        .selectUtxosFrom(utxos)
        .changeAddress(changeAddress)
        .complete();
    status.textContent = t(`Verify the lost stake message, ${visibleRecipients.length.toLocaleString('en-US')} wallet output${visibleRecipients.length === 1 ? '' : 's'} and network fee in your wallet before signing.`);
    const signedTx = await adminTransactionWallet.signTx(unsignedTx, false);
    status.textContent = t('Submitting the signed transaction...');
    const txHash = String(await adminTransactionWallet.submitTx(signedTx)).toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(txHash)) throw new Error(t('The wallet returned an invalid transaction ID.'));
    markLostStakeDelegatorsMessaged(selected);
    renderLostStake(lostStakePayload);
    status.replaceChildren(document.createTextNode(t('Lost stake message published on-chain. ')), cardanoscanTransactionLink(txHash));
    if (submit) submit.disabled = false;
}

async function chooseLostStakeTransactionWallet(selected, message, submit, status) {
    let choices = document.getElementById('raffle-lost-stake-wallet-list');
    if (!choices) {
        choices = document.createElement('div');
        choices.id = 'raffle-lost-stake-wallet-list';
        choices.className = 'wallet-list raffle-wallet-list';
        status.after(choices);
    }
    choices.replaceChildren();
    status.textContent = t('Choose the wallet that will pay the Cardano network fee.');
    const { BrowserWallet } = await loadMesh();
    const wallets = BrowserWallet.getInstalledWallets();
    if (!wallets.length) throw new Error(t('No CIP-30 Cardano wallet extension was detected.'));
    wallets.forEach(walletInfo => {
        const walletButton = document.createElement('button');
        walletButton.type = 'button';
        walletButton.className = 'wallet-option';
        const icon = document.createElement('img');
        icon.src = walletInfo.icon;
        icon.alt = '';
        const label = document.createElement('span');
        label.textContent = walletInfo.name;
        walletButton.append(icon, label);
        walletButton.addEventListener('click', async () => {
            walletButton.disabled = true;
            status.classList.remove('is-error');
            try {
                const wallet = await BrowserWallet.enable(walletInfo.id);
                if (await wallet.getNetworkId() !== 1) throw new Error(t('Switch your wallet to Cardano Mainnet.'));
                adminTransactionWallet = wallet;
                choices.replaceChildren();
                await publishLostStakeMessage(selected, message, submit, status);
            } catch (error) {
                status.textContent = error?.info || error?.message || t('Wallet connection failed.');
                status.classList.add('is-error');
                walletButton.disabled = false;
                if (submit) submit.disabled = false;
            }
        });
        choices.appendChild(walletButton);
    });
}

async function submitLostStakeMessage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const status = document.getElementById('raffle-lost-stake-status');
    const selected = getSelectedLostStakeDelegators();
    const message = String(form.elements.improved_message.value || form.elements.message.value || '').trim();
    if (!selected.length) {
        status.textContent = t('Select at least one stake key first.');
        status.classList.add('is-error');
        return;
    }
    if (selected.length > LOST_STAKE_MAX_ON_CHAIN_RECIPIENTS) {
        status.textContent = t(`Select ${LOST_STAKE_MAX_ON_CHAIN_RECIPIENTS} stake keys or fewer per on-chain message transaction.`);
        status.classList.add('is-error');
        return;
    }
    if (!message) {
        status.textContent = t('Enter or improve a message before publishing.');
        status.classList.add('is-error');
        return;
    }
    submit.disabled = true;
    status.classList.remove('is-error');
    try {
        if (!adminTransactionWallet) {
            await chooseLostStakeTransactionWallet(selected, message, submit, status);
            return;
        }
        await publishLostStakeMessage(selected, message, submit, status);
    } catch (error) {
        status.textContent = error?.info || error?.message || t('The lost stake message could not be published on-chain.');
        status.classList.add('is-error');
        submit.disabled = false;
    }
}

async function populateWallets() {
    const list = document.getElementById('raffle-wallet-list');
    list.replaceChildren();
    setStatus('Detecting installed Cardano wallets...');
    const { BrowserWallet } = await loadMesh();
    const wallets = BrowserWallet.getInstalledWallets();
    if (!wallets.length) throw new Error(t('No CIP-30 Cardano wallet extension was detected.'));
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
        list.appendChild(button);
    });
    setStatus('Choose the wallet you want to verify.');
}

function createDrawCard(draw, viewerAddress = null) {
    const card = document.createElement('article');
    card.className = `governance-menu-card raffle-draw-card${draw.is_winner ? ' is-winner' : ''}`;
    card.dataset.raffleId = draw.id;
    const heading = document.createElement('h3');
    heading.className = 'governance-card-title';
    heading.textContent = draw.title || 'TDSP Delegator Raffle';
    const date = document.createElement('p');
    date.className = 'governance-card-detail';
    setTranslatedText(date, `Published ${formatDate(draw.published_at)}`);
    card.append(heading, date);

    if (draw.prize) {
        const prize = document.createElement('strong');
        prize.className = 'governance-card-detail raffle-prize';
        prize.textContent = draw.prize;
        card.appendChild(prize);
    }
    const winner = document.createElement('div');
    winner.className = 'raffle-winner';
    const winnerTitle = document.createElement('strong');
    winnerTitle.className = 'governance-card-title';
    setTranslatedText(winnerTitle, draw.is_winner ? 'You are the winner' : 'Winner');
    const winnerName = document.createElement('span');
    winnerName.className = 'governance-card-detail';
    const winnerWalletAddress = String(draw.winner?.wallet_address || '').trim();
    setTranslatedText(winnerName, draw.winner?.ada_handle || (ROLE === 'admin' ? 'Wallet address' : 'Stake key'));
    const winnerAddress = ROLE === 'admin'
        ? (winnerWalletAddress
            ? addressLine(winnerWalletAddress, 'wallet address')
            : document.createTextNode(t('Wallet address unavailable')))
        : addressLine(draw.winner?.stake_address || '', 'stake key');
    winner.append(winnerTitle, winnerName, winnerAddress);
    card.appendChild(winner);

    if (draw.notes) {
        const notes = document.createElement('p');
        notes.className = 'governance-card-detail';
        notes.textContent = draw.notes;
        card.appendChild(notes);
    }
    const proof = document.createElement('details');
    const summary = document.createElement('summary');
    setTranslatedText(summary, 'Draw proof');
    const proofText = document.createElement('p');
    proofText.className = 'governance-card-detail';
    setTranslatedText(proofText, `${draw.eligible_count.toLocaleString('en-US')} eligible delegators · index ${draw.selection_index}`);
    proof.append(summary, proofText, addressLine(draw.snapshot_sha256, 'snapshot hash'), addressLine(draw.selection_entropy, 'selection entropy'));
    if (draw.on_chain_tx_hash) {
        const onChain = document.createElement('div');
        onChain.className = 'raffle-on-chain-proof';
        const onChainTitle = document.createElement('strong');
        setTranslatedText(onChainTitle, 'On-chain proof');
        const label = document.createElement('p');
        label.className = 'governance-card-detail';
        setTranslatedText(label, `Metadata label ${draw.on_chain_metadata_label || RAFFLE_METADATA_LABEL}`);
        onChain.append(onChainTitle, label, addressLine(draw.on_chain_tx_hash, 'transaction ID'), cardanoscanTransactionLink(draw.on_chain_tx_hash));
        proof.appendChild(onChain);
    }
    card.appendChild(proof);
    if (ROLE === 'admin' && !draw.on_chain_tx_hash) {
        const onChainActions = document.createElement('div');
        onChainActions.className = 'raffle-on-chain-actions';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'governance-vote-button raffle-on-chain-button';
        setTranslatedText(button, 'Publish proof on-chain');
        button.disabled = !raffleAnchorSupported;
        const help = document.createElement('p');
        help.className = 'governance-card-detail';
        help.textContent = raffleAnchorSupported
            ? t('Creates a Cardano Mainnet transaction containing the draw proof and charges a network fee.')
            : RAFFLE_ANCHOR_UNAVAILABLE;
        const status = document.createElement('p');
        status.className = 'raffle-inline-status';
        status.setAttribute('role', 'status');
        const choices = document.createElement('div');
        choices.className = 'wallet-list raffle-wallet-list';
        button.addEventListener('click', () => {
            status.classList.remove('is-error');
            if (adminTransactionWallet || sessionStorage.getItem(`tdsp-raffle-anchor-${draw.id}`)) {
                submitRaffleProofTransaction(draw, button, status);
            } else {
                chooseRaffleTransactionWallet(draw, button, status, choices);
            }
        });
        onChainActions.append(button, help, status, choices);
        card.appendChild(onChainActions);
    }
    if (viewerAddress && draw.winner?.stake_address === viewerAddress) card.dataset.winner = 'true';
    return card;
}

function renderDraws(draws, viewerAddress = null) {
    const list = document.getElementById('raffle-draws');
    list.replaceChildren();
    if (!draws.length) {
        const empty = document.createElement('p');
        empty.className = 'governance-menu-card governance-card-detail raffle-draw-card raffle-empty';
        setTranslatedText(empty, 'No raffle results have been published yet.');
        list.appendChild(empty);
        return;
    }
    draws.forEach(draw => list.appendChild(createDrawCard(draw, viewerAddress)));
}

function renderAdmin(payload) {
    raffleAnchorSupported = payload.capabilities?.on_chain_proof === true;
    raffleExclusionsSupported = payload.capabilities?.stake_key_exclusions === true;
    raffleExclusionTogglesSupported = payload.capabilities?.stake_key_exclusion_toggles === true;
    const exclusions = Array.isArray(payload.excluded_stake_addresses) ? payload.excluded_stake_addresses : [];
    raffleStakeKeyExclusions = Array.isArray(payload.stake_key_exclusions)
        ? payload.stake_key_exclusions
        : (Array.isArray(payload.excluded_delegators)
            ? payload.excluded_delegators.map(entry => ({ ...entry, enabled: true }))
            : exclusions.map(stakeAddress => ({ stake_address: stakeAddress, enabled: true })));
    const exclusionsInput = document.getElementById('raffle-excluded-stake-keys');
    if (exclusionsInput) exclusionsInput.value = '';
    const exclusionsCount = document.getElementById('raffle-exclusions-count');
    if (exclusionsCount) {
        const includedCount = raffleStakeKeyExclusions.filter(entry => entry.enabled === false).length;
        setTranslatedText(exclusionsCount, `${exclusions.length.toLocaleString('en-US')} excluded · ${includedCount.toLocaleString('en-US')} included in raffles`);
    }
    const menuExclusionsCount = document.getElementById('raffle-menu-exclusion-count');
    if (menuExclusionsCount) {
        setTranslatedText(menuExclusionsCount, `${exclusions.length.toLocaleString('en-US')} excluded`);
    }
    renderExcludedStakeKeys(raffleStakeKeyExclusions);
    const exclusionsForm = document.getElementById('raffle-exclusions-form');
    const exclusionsSubmit = exclusionsForm?.querySelector('button[type="submit"]');
    if (exclusionsSubmit) exclusionsSubmit.disabled = !raffleExclusionsSupported;
    const exclusionsStatus = document.getElementById('raffle-exclusions-status');
    if (exclusionsStatus && !raffleExclusionsSupported) {
        exclusionsStatus.textContent = t(RAFFLE_EXCLUSIONS_UNAVAILABLE);
        exclusionsStatus.classList.add('is-error');
    }
    document.getElementById('raffle-eligible-count').textContent = Number(payload.pool?.eligible_count || 0).toLocaleString('en-US');
    document.getElementById('raffle-total-stake').textContent = formatAda(payload.pool?.total_eligible_lovelace);
    setTranslatedText(document.getElementById('raffle-snapshot-time'), payload.pool?.updated_at
        ? `Pool snapshot ${formatDate(payload.pool.updated_at)}`
        : 'Pool snapshot time unavailable');
    const draws = Array.isArray(payload.draws) ? payload.draws : [];
    const menuHistoryCount = document.getElementById('raffle-menu-history-count');
    if (menuHistoryCount) {
        setTranslatedText(menuHistoryCount, `${draws.length.toLocaleString('en-US')} published raffle${draws.length === 1 ? '' : 's'}`);
    }
    renderDraws(draws);
    raffleAdminUsers = Array.isArray(payload.admin_users) ? payload.admin_users : [];
    renderAdminUsers(raffleAdminUsers);
    if (lostStakePayload) renderLostStake(lostStakePayload);
}

function renderExcludedStakeKeys(excludedDelegators) {
    const list = document.getElementById('raffle-exclusion-list');
    if (!list) return;
    list.replaceChildren();
    if (!excludedDelegators.length) {
        const empty = document.createElement('p');
        empty.className = 'governance-card-detail';
        setTranslatedText(empty, 'No stake keys are excluded.');
        list.appendChild(empty);
        return;
    }
    excludedDelegators.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'governance-menu-card raffle-exclusion-item';
        const identity = document.createElement('div');
        identity.className = 'raffle-exclusion-identity';
        const name = document.createElement('strong');
        name.className = 'governance-card-title';
        setTranslatedText(name, entry.ada_handle || 'Stake key');
        const state = document.createElement('span');
        state.className = `governance-card-detail raffle-exclusion-state ${entry.enabled === false ? 'is-included' : 'is-excluded'}`;
        setTranslatedText(state, entry.enabled === false ? 'Included in raffle' : 'Excluded');
        identity.append(name, state, addressLine(entry.stake_address));
        const actions = document.createElement('div');
        actions.className = 'raffle-exclusion-actions';
        if (raffleExclusionTogglesSupported) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'governance-vote-secondary raffle-exclusion-toggle';
            setTranslatedText(toggle, entry.enabled === false ? 'Enable exclusion' : 'Disable exclusion');
            toggle.addEventListener('click', async () => {
                toggle.disabled = true;
                const status = document.getElementById('raffle-exclusions-status');
                const saved = await saveStakeKeyExclusionConfigs(
                    raffleStakeKeyExclusions.map(config => config.stake_address === entry.stake_address
                        ? { ...config, enabled: config.enabled === false }
                        : config),
                    status,
                    entry.enabled === false ? 'Excluding stake key...' : 'Including stake key in future raffles...'
                );
                if (!saved) toggle.disabled = false;
            });
            actions.appendChild(toggle);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'governance-vote-secondary raffle-exclusion-remove';
        setTranslatedText(remove, 'Remove');
        remove.setAttribute('aria-label', t(`Remove ${entry.ada_handle || shorten(entry.stake_address)} from raffle exclusions`));
        remove.addEventListener('click', async () => {
            remove.disabled = true;
            const status = document.getElementById('raffle-exclusions-status');
            const saved = await saveStakeKeyExclusionConfigs(
                raffleStakeKeyExclusions.filter(config => config.stake_address !== entry.stake_address),
                status,
                'Removing exclusion...'
            );
            if (!saved) remove.disabled = false;
        });
        actions.appendChild(remove);
        row.append(identity, actions);
        list.appendChild(row);
    });
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

async function saveStakeKeyExclusionConfigs(configs, status, pendingMessage = 'Saving exclusions...') {
    status.classList.remove('is-error');
    status.textContent = t(pendingMessage);
    try {
        await authorizedRequest(ENDPOINTS.exclusions, {
            method: 'POST',
            body: JSON.stringify({
                exclusions: configs.map(config => ({
                    stake_address: config.stake_address,
                    enabled: config.enabled !== false
                })),
                stake_addresses: configs.filter(config => config.enabled !== false).map(config => config.stake_address)
            })
        });
        const payload = await authorizedRequest(ENDPOINTS.admin);
        renderAdmin(payload);
        const savedCount = Array.isArray(payload.excluded_stake_addresses) ? payload.excluded_stake_addresses.length : 0;
        setTranslatedText(status, `${savedCount.toLocaleString('en-US')} stake ${savedCount === 1 ? 'key' : 'keys'} excluded from future draws.`);
        return payload;
    } catch (error) {
        status.textContent = error?.message || t('The exclusions could not be saved.');
        status.classList.add('is-error');
        return null;
    }
}

async function submitExclusions(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const status = document.getElementById('raffle-exclusions-status');
    const stakeAddresses = String(form.elements.stake_addresses.value || '')
        .split(/[\r\n,]+/)
        .map(value => value.trim())
        .filter(Boolean);
    if (!raffleExclusionsSupported) {
        status.textContent = t(RAFFLE_EXCLUSIONS_UNAVAILABLE);
        status.classList.add('is-error');
        return;
    }
    submit.disabled = true;
    try {
        const configsByAddress = new Map(raffleStakeKeyExclusions.map(config => [config.stake_address, config]));
        stakeAddresses.forEach(stakeAddress => {
            configsByAddress.set(stakeAddress, { stake_address: stakeAddress, enabled: true });
        });
        await saveStakeKeyExclusionConfigs([...configsByAddress.values()], status, 'Adding exclusions...');
    } finally {
        submit.disabled = false;
    }
}

function renderDelegator(payload) {
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
    renderDraws(payload.draws || [], payload.stake_address);
    loadRafflePrizes().catch(error => {
        const summary = document.getElementById('raffle-prizes-summary');
        if (summary) setTranslatedText(summary, 'Prize wallet unavailable');
        console.warn(`Raffle prize wallet could not be loaded: ${error.message}`);
    });
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
        sessionToken = '';
        sessionStorage.removeItem(SESSION_KEY);
        showAuthenticatedUi(false);
        throw error;
    }
}

async function submitDraw(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    const publishOnChain = form.elements.publish_mode?.value === 'on_chain';
    setStatus('Selecting and publishing a winner...');
    try {
        if (publishOnChain && !raffleAnchorSupported) throw new Error(RAFFLE_ANCHOR_UNAVAILABLE);
        const result = await authorizedRequest(ENDPOINTS.draw, {
            method: 'POST',
            body: JSON.stringify({
                title: form.elements.title.value,
                prize: form.elements.prize.value,
                notes: form.elements.notes.value
            })
        });
        form.reset();
        const payload = await authorizedRequest(ENDPOINTS.admin);
        renderAdmin(payload);
        if (!publishOnChain) {
            setStatus('The raffle result has been published on the website.');
            return;
        }
        setRaffleAdminView('history', { focus: false });
        setStatus('The raffle result has been published. Complete the wallet step to record its proof on Cardano.');
        const card = [...document.querySelectorAll('[data-raffle-id]')]
            .find(element => element.dataset.raffleId === result.draw?.id);
        const button = card?.querySelector('.raffle-on-chain-button');
        const status = card?.querySelector('.raffle-inline-status');
        const choices = card?.querySelector('.raffle-wallet-list');
        if (!button || !status || !choices) throw new Error(t('The published raffle could not be prepared for on-chain proof.'));
        if (adminTransactionWallet) await submitRaffleProofTransaction(result.draw, button, status);
        else await chooseRaffleTransactionWallet(result.draw, button, status, choices);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        submit.disabled = false;
    }
}

function logout() {
    setRaffleOverlay(false);
    sessionToken = '';
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showAuthenticatedUi(false);
    postEmbeddedDelegatorIdentity();
    document.getElementById('raffle-wallet-list').replaceChildren();
    setStatus('Wallet session closed.');
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
    document.getElementById('raffle-open')?.addEventListener('click', () => setRaffleOverlay(true));
    document.getElementById('raffle-prizes-open')?.addEventListener('click', () => setPrizeOverlay(true));
    document.getElementById('raffle-prizes-back')?.addEventListener('click', () => setPrizeOverlay(false));
    document.getElementById('raffle-prizes-close')?.addEventListener('click', () => setPrizeOverlay(false));
    document.getElementById('raffle-admin-users-open')?.addEventListener('click', () => setRaffleOverlay(true, 'admins'));
    document.getElementById('raffle-lost-stake-open')?.addEventListener('click', () => setRaffleOverlay(true, 'lost_stake'));
    document.getElementById('raffle-lost-stake-sort')?.addEventListener('click', () => {
        lostStakeSortDescending = !lostStakeSortDescending;
        lostStakeVisibleCount = LOST_STAKE_RENDER_BATCH_SIZE;
        renderLostStake(lostStakePayload);
    });
    document.getElementById('raffle-lost-stake-select-all')?.addEventListener('click', () => {
        getLostStakeDelegators().forEach(delegator => {
            if (delegator?.stake_address) lostStakeSelectedAddresses.add(delegator.stake_address);
        });
        renderLostStake(lostStakePayload);
    });
    document.getElementById('raffle-lost-stake-clear')?.addEventListener('click', () => {
        lostStakeSelectedAddresses.clear();
        renderLostStake(lostStakePayload);
    });
    document.getElementById('raffle-lost-stake-improve')?.addEventListener('click', improveLostStakeMessage);
    document.getElementById('raffle-overlay-back')?.addEventListener('click', () => {
        if (ROLE === 'admin' && raffleAdminView !== 'menu' && raffleOverlayRootView === 'menu') setRaffleAdminView('menu');
        else if (ROLE === 'admin') setRaffleOverlay(false);
        else setRaffleOverlay(false);
    });
    document.getElementById('raffle-overlay-close')?.addEventListener('click', () => setRaffleOverlay(false));
    document.querySelectorAll('[data-raffle-view]').forEach(tile => {
        tile.addEventListener('click', () => setRaffleAdminView(tile.dataset.raffleView));
    });
    document.getElementById('raffle-overlay')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) setRaffleOverlay(false);
    });
    document.getElementById('raffle-prizes-overlay')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) setPrizeOverlay(false);
    });
    document.getElementById('raffle-draw-form')?.addEventListener('submit', submitDraw);
    document.getElementById('raffle-exclusions-form')?.addEventListener('submit', submitExclusions);
    document.getElementById('raffle-admin-users-form')?.addEventListener('submit', submitAdminUsers);
    document.getElementById('raffle-lost-stake-message-form')?.addEventListener('submit', submitLostStakeMessage);
    if (sessionToken) {
        try {
            await loadProtectedArea();
            return;
        } catch {
            if (!overlayMode && ROLE === 'admin') {
                window.location.replace('index.html#pool');
                return;
            }
            setStatus('Your previous wallet session expired. Sign a new challenge to continue.');
        }
    }
    document.body.classList.remove('raffle-auth-gate-pending');
    showAuthenticatedUi(false);
}

window.TDSPDelegatorAccess = {
    initOverlay(role) {
        return init({ role, overlay: true });
    }
};
window.TDSPRaffleAccess = window.TDSPDelegatorAccess;

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('raffle-overlay')?.hidden) {
        setRaffleOverlay(false);
    }
    if (event.key === 'Escape' && !document.getElementById('raffle-prizes-overlay')?.hidden) {
        setPrizeOverlay(false);
    }
});

if (document.body.classList.contains('raffle-page')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
}
