const MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const ADMIN_ADDRESS = 'addr1qy93p0cfydj548ayt6mh2z572ly4n4s9yaxwzrht2rzc3urjvlyhltxc0287yacjhg8syg4w3dyg3jal6ltksfuc483sel7r8c';
const ADMIN_STAKE_ADDRESS = 'stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
const RAFFLE_METADATA_LABEL = 8675309;
const ROLE = document.body.dataset.raffleRole === 'admin' ? 'admin' : 'delegator';
const IS_LOCAL = window.TDSPRuntime?.isLocalPreview === true;
const ENDPOINTS = IS_LOCAL ? {
    challenge: '/__raffle_auth_challenge_proxy__',
    verify: '/__raffle_auth_verify_proxy__',
    admin: '/__raffle_admin_proxy__',
    draw: '/__raffle_admin_draw_proxy__',
    exclusions: '/__raffle_admin_exclusions_proxy__',
    anchor: '/__raffle_admin_anchor_proxy__',
    delegator: '/__raffle_delegator_proxy__'
} : {
    challenge: 'https://api.tdsp.online/api/raffle/auth/challenge',
    verify: 'https://api.tdsp.online/api/raffle/auth/verify',
    admin: 'https://api.tdsp.online/api/raffle/admin',
    draw: 'https://api.tdsp.online/api/raffle/admin/draw',
    exclusions: 'https://api.tdsp.online/api/raffle/admin/exclusions',
    anchor: 'https://api.tdsp.online/api/raffle/admin/anchor',
    delegator: 'https://api.tdsp.online/api/raffle/delegator'
};
const SESSION_KEY = `tdsp-raffle-session-${ROLE}`;
const ADMIN_SESSION_KEY = 'tdsp-raffle-session-admin';

let meshPromise = null;
let sessionToken = sessionStorage.getItem(SESSION_KEY) || '';
let raffleOverlayReturnFocus = null;
let adminTransactionWallet = null;
let raffleAnchorSupported = false;
let raffleExclusionsSupported = false;

const RAFFLE_ANCHOR_UNAVAILABLE = 'On-chain proof is not available in the running Koios proxy yet. Pull the latest proxy image and restart the container, then reload this page.';
const RAFFLE_EXCLUSIONS_UNAVAILABLE = 'Stake key exclusions are not available in the running Koios proxy yet. Pull the latest proxy image and restart the container, then reload this page.';

function loadMesh() {
    if (!meshPromise) meshPromise = import(MESH_CDN_URL);
    return meshPromise;
}

function setStatus(message, error = false) {
    const element = document.getElementById('raffle-status');
    if (!element) return;
    element.textContent = message || '';
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
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'raffle-copy';
    button.textContent = '⧉';
    button.setAttribute('aria-label', `Copy ${label}`);
    button.title = `Copy ${label}`;
    button.addEventListener('click', async () => {
        await navigator.clipboard.writeText(String(value || ''));
        button.textContent = 'Copied';
        window.setTimeout(() => { button.textContent = '⧉'; }, 1200);
    });
    return button;
}

function addressLine(address, label = 'stake address') {
    const line = document.createElement('div');
    line.className = 'raffle-address-line';
    const text = document.createElement('code');
    text.textContent = shorten(address);
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

function cardanoscanTransactionLink(txHash) {
    const link = document.createElement('a');
    link.href = `https://cardanoscan.io/transaction/${encodeURIComponent(txHash)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View transaction on Cardanoscan';
    return link;
}

function showAuthenticatedUi(authenticated) {
    const access = document.getElementById('raffle-access');
    const protectedArea = document.getElementById('raffle-protected');
    if (access) access.hidden = authenticated;
    if (protectedArea) protectedArea.hidden = !authenticated;
}

function setRaffleOverlay(open) {
    const overlay = document.getElementById('raffle-overlay');
    if (!overlay) return;
    if (open) {
        raffleOverlayReturnFocus = document.activeElement;
        overlay.hidden = false;
        document.body.classList.add('raffle-overlay-open');
        document.getElementById('raffle-overlay-close')?.focus();
        return;
    }
    overlay.hidden = true;
    document.body.classList.remove('raffle-overlay-open');
    raffleOverlayReturnFocus?.focus?.();
    raffleOverlayReturnFocus = null;
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
    intro.className = 'small-text';
    intro.textContent = 'Choose the TDSP stake key you want to verify.';
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
    if (await wallet.getNetworkId() !== 1) throw new Error('Switch your wallet to Cardano Mainnet.');

    if (ROLE === 'delegator') {
        const rewardAddresses = await getWalletAddresses(wallet, 'getRewardAddresses');
        if (!rewardAddresses.length) throw new Error('No Cardano stake key was found in this wallet.');
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
    throw new Error('This wallet does not contain the authorized Admin Area credential.');
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
            status.textContent = 'Recording the previously submitted transaction ID...';
            await recordSubmittedRaffleProof(draw, pendingHash);
        } else {
            if (!adminTransactionWallet) throw new Error('Choose the admin wallet first.');
            status.textContent = 'Building the on-chain raffle proof transaction...';
            const utxos = await adminTransactionWallet.getUtxos();
            const changeAddress = await adminTransactionWallet.getChangeAddress();
            if (!utxos?.length || !changeAddress) throw new Error('No spendable wallet UTxO was found for the network fee.');
            const { MeshTxBuilder } = await loadMesh();
            const unsignedTx = await new MeshTxBuilder({ verbose: false })
                .metadataValue(RAFFLE_METADATA_LABEL, buildRaffleMetadata(draw))
                .selectUtxosFrom(utxos)
                .changeAddress(changeAddress)
                .complete();
            status.textContent = 'Verify the raffle proof metadata and network fee in your wallet before signing.';
            const signedTx = await adminTransactionWallet.signTx(unsignedTx, false);
            status.textContent = 'Submitting the signed transaction...';
            const txHash = String(await adminTransactionWallet.submitTx(signedTx)).toLowerCase();
            if (!/^[0-9a-f]{64}$/.test(txHash)) throw new Error('The wallet returned an invalid transaction ID.');
            sessionStorage.setItem(pendingKey, txHash);
            status.textContent = 'Transaction submitted. Recording its transaction ID with the raffle...';
            await recordSubmittedRaffleProof(draw, txHash);
        }
        setStatus('The raffle result now has an on-chain transaction proof.');
        renderAdmin(await authorizedRequest(ENDPOINTS.admin));
    } catch (error) {
        const message = error?.info || error?.message || 'The on-chain raffle proof could not be submitted.';
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
        if (!wallets.length) throw new Error('No CIP-30 Cardano wallet extension was detected.');
        const intro = document.createElement('p');
        intro.className = 'small-text';
        intro.textContent = 'Choose the authorized wallet that will pay the Cardano network fee.';
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
                    if (await wallet.getNetworkId() !== 1) throw new Error('Switch your wallet to Cardano Mainnet.');
                    if (!await walletHasAdminCredential(wallet)) throw new Error('This wallet does not contain the authorized admin stake credential.');
                    adminTransactionWallet = wallet;
                    choices.replaceChildren();
                    await submitRaffleProofTransaction(draw, button, status);
                } catch (error) {
                    status.textContent = error?.info || error?.message || 'Wallet connection failed.';
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

async function populateWallets() {
    const list = document.getElementById('raffle-wallet-list');
    list.replaceChildren();
    setStatus('Detecting installed Cardano wallets...');
    const { BrowserWallet } = await loadMesh();
    const wallets = BrowserWallet.getInstalledWallets();
    if (!wallets.length) throw new Error('No CIP-30 Cardano wallet extension was detected.');
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
            setStatus(error?.info || error.message || 'Wallet access failed.', true);
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
    heading.textContent = draw.title || 'TDSP Delegator Raffle';
    const date = document.createElement('p');
    date.className = 'small-text';
    date.textContent = `Published ${formatDate(draw.published_at)}`;
    card.append(heading, date);

    if (draw.prize) {
        const prize = document.createElement('strong');
        prize.className = 'raffle-prize';
        prize.textContent = draw.prize;
        card.appendChild(prize);
    }
    const winner = document.createElement('div');
    winner.className = 'raffle-winner';
    const winnerTitle = document.createElement('strong');
    winnerTitle.textContent = draw.is_winner ? 'You are the winner' : 'Winner';
    const winnerName = document.createElement('span');
    winnerName.textContent = draw.winner?.ada_handle || 'Stake key';
    winner.append(winnerTitle, winnerName, addressLine(draw.winner?.stake_address || ''));
    card.appendChild(winner);

    if (draw.notes) {
        const notes = document.createElement('p');
        notes.textContent = draw.notes;
        card.appendChild(notes);
    }
    const proof = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Draw proof';
    const proofText = document.createElement('p');
    proofText.className = 'small-text';
    proofText.textContent = `${draw.eligible_count.toLocaleString('en-US')} eligible delegators · index ${draw.selection_index}`;
    proof.append(summary, proofText, addressLine(draw.snapshot_sha256, 'snapshot hash'), addressLine(draw.selection_entropy, 'selection entropy'));
    if (draw.on_chain_tx_hash) {
        const onChain = document.createElement('div');
        onChain.className = 'raffle-on-chain-proof';
        const onChainTitle = document.createElement('strong');
        onChainTitle.textContent = 'On-chain proof';
        const label = document.createElement('p');
        label.className = 'small-text';
        label.textContent = `Metadata label ${draw.on_chain_metadata_label || RAFFLE_METADATA_LABEL}`;
        onChain.append(onChainTitle, label, addressLine(draw.on_chain_tx_hash, 'transaction ID'), cardanoscanTransactionLink(draw.on_chain_tx_hash));
        proof.appendChild(onChain);
    }
    card.appendChild(proof);
    if (ROLE === 'admin' && !draw.on_chain_tx_hash) {
        const onChainActions = document.createElement('div');
        onChainActions.className = 'raffle-on-chain-actions';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'raffle-primary raffle-on-chain-button';
        button.textContent = 'Publish proof on-chain';
        button.disabled = !raffleAnchorSupported;
        const help = document.createElement('p');
        help.className = 'small-text';
        help.textContent = raffleAnchorSupported
            ? 'Creates a Cardano Mainnet transaction containing the draw proof and charges a network fee.'
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
        empty.className = 'governance-menu-card raffle-empty';
        empty.textContent = 'No raffle results have been published yet.';
        list.appendChild(empty);
        return;
    }
    draws.forEach(draw => list.appendChild(createDrawCard(draw, viewerAddress)));
}

function renderAdmin(payload) {
    raffleAnchorSupported = payload.capabilities?.on_chain_proof === true;
    raffleExclusionsSupported = payload.capabilities?.stake_key_exclusions === true;
    const exclusions = Array.isArray(payload.excluded_stake_addresses) ? payload.excluded_stake_addresses : [];
    const exclusionsInput = document.getElementById('raffle-excluded-stake-keys');
    if (exclusionsInput) exclusionsInput.value = exclusions.join('\n');
    const exclusionsCount = document.getElementById('raffle-exclusions-count');
    if (exclusionsCount) exclusionsCount.textContent = `${exclusions.length.toLocaleString('en-US')} stake ${exclusions.length === 1 ? 'key' : 'keys'} excluded`;
    const exclusionsForm = document.getElementById('raffle-exclusions-form');
    const exclusionsSubmit = exclusionsForm?.querySelector('button[type="submit"]');
    if (exclusionsSubmit) exclusionsSubmit.disabled = !raffleExclusionsSupported;
    const exclusionsStatus = document.getElementById('raffle-exclusions-status');
    if (exclusionsStatus && !raffleExclusionsSupported) {
        exclusionsStatus.textContent = RAFFLE_EXCLUSIONS_UNAVAILABLE;
        exclusionsStatus.classList.add('is-error');
    }
    document.getElementById('raffle-eligible-count').textContent = Number(payload.pool?.eligible_count || 0).toLocaleString('en-US');
    document.getElementById('raffle-total-stake').textContent = formatAda(payload.pool?.total_eligible_lovelace);
    document.getElementById('raffle-snapshot-time').textContent = payload.pool?.updated_at
        ? `Pool snapshot ${formatDate(payload.pool.updated_at)}`
        : 'Pool snapshot time unavailable';
    renderDraws(payload.draws || []);
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
        status.textContent = RAFFLE_EXCLUSIONS_UNAVAILABLE;
        status.classList.add('is-error');
        return;
    }
    submit.disabled = true;
    status.classList.remove('is-error');
    status.textContent = 'Saving exclusions...';
    try {
        await authorizedRequest(ENDPOINTS.exclusions, {
            method: 'POST',
            body: JSON.stringify({ stake_addresses: stakeAddresses })
        });
        const payload = await authorizedRequest(ENDPOINTS.admin);
        renderAdmin(payload);
        const savedCount = Array.isArray(payload.excluded_stake_addresses) ? payload.excluded_stake_addresses.length : 0;
        status.textContent = `${savedCount.toLocaleString('en-US')} stake ${savedCount === 1 ? 'key' : 'keys'} excluded from future draws.`;
    } catch (error) {
        status.textContent = error?.message || 'The exclusions could not be saved.';
        status.classList.add('is-error');
    } finally {
        submit.disabled = false;
    }
}

function renderDelegator(payload) {
    const identity = document.getElementById('raffle-identity');
    identity.replaceChildren(document.createTextNode('Verified stake key '), addressLine(payload.stake_address));
    const adminLink = document.getElementById('raffle-admin-link');
    if (adminLink) adminLink.hidden = payload.is_admin !== true;
    if (payload.is_admin === true) sessionStorage.setItem(ADMIN_SESSION_KEY, sessionToken);
    renderDraws(payload.draws || [], payload.stake_address);
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
        setStatus('The raffle result has been published. Complete the wallet step to record its proof on Cardano.');
        const card = [...document.querySelectorAll('[data-raffle-id]')]
            .find(element => element.dataset.raffleId === result.draw?.id);
        const button = card?.querySelector('.raffle-on-chain-button');
        const status = card?.querySelector('.raffle-inline-status');
        const choices = card?.querySelector('.raffle-wallet-list');
        if (!button || !status || !choices) throw new Error('The published raffle could not be prepared for on-chain proof.');
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
    document.getElementById('raffle-wallet-list').replaceChildren();
    setStatus('Wallet session closed.');
}

async function init() {
    if (ROLE === 'admin' && !sessionToken) {
        window.location.replace('delegators.html');
        return;
    }
    document.getElementById('raffle-connect')?.addEventListener('click', () => {
        populateWallets().catch(error => setStatus(error.message, true));
    });
    document.getElementById('raffle-logout')?.addEventListener('click', logout);
    document.getElementById('raffle-open')?.addEventListener('click', () => setRaffleOverlay(true));
    document.getElementById('raffle-overlay-close')?.addEventListener('click', () => setRaffleOverlay(false));
    document.getElementById('raffle-overlay')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) setRaffleOverlay(false);
    });
    document.getElementById('raffle-draw-form')?.addEventListener('submit', submitDraw);
    document.getElementById('raffle-exclusions-form')?.addEventListener('submit', submitExclusions);
    if (sessionToken) {
        try {
            await loadProtectedArea();
            return;
        } catch {
            if (ROLE === 'admin') {
                window.location.replace('delegators.html');
                return;
            }
            setStatus('Your previous wallet session expired. Sign a new challenge to continue.');
        }
    }
    document.body.classList.remove('raffle-auth-gate-pending');
    showAuthenticatedUi(false);
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('raffle-overlay')?.hidden) {
        setRaffleOverlay(false);
    }
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
