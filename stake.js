const POOL_ID = 'pool1zfd0gl76h3f0ammgp4gu0qvt99qcqkn5a895wv0q779d6p9dz5u';
const POOL_ID_HEX = '125af47fdabc52feef680d51c7818b2941805a74e9cb4731e0f78add';
const TARGET_POOL_IDS = new Set([POOL_ID, POOL_ID_HEX]);
const BLOCKFROST_MAINNET_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';
// Optional second data source to ride out Koios rate limits.
// A mainnet project id from blockfrost.io — free tier is fine. Leave empty to use Koios only.
const BLOCKFROST_PROJECT_ID = '';
const MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const STAKE_STATUS_API_BASE_URL = 'https://api.tdsp.online/api/account';
const LOCAL_STAKE_STATUS_PROXY_PATH = '/__account_info_proxy__';

let meshLibPromise = null;
function loadMeshLib() {
    if (!meshLibPromise) {
        meshLibPromise = import(MESH_CDN_URL);
    }
    return meshLibPromise;
}

function getModal() {
    return document.getElementById('stakenow');
}

function setWalletStep(step) {
    const warningEl = document.getElementById('stake-warning');
    const listEl = document.getElementById('wallet-list');
    const isWarning = step === 'warning';

    if (warningEl) warningEl.hidden = !isWarning;
    if (listEl) {
        listEl.hidden = isWarning;
        if (isWarning) listEl.replaceChildren();
    }
    if (isWarning) setStatus('');
}

function setStatus(message) {
    const statusEl = document.getElementById('wallet-status');
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.hidden = !message;
}

function renderWalletList(wallets) {
    const listEl = document.getElementById('wallet-list');
    if (!listEl) return;
    listEl.replaceChildren();

    if (!wallets.length) {
        setStatus('No Cardano wallet extension detected. Install a CIP-30 wallet (Eternl, Lace, Vespr...) and reopen this dialog.');
        return;
    }

    wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wallet-option';
        const icon = document.createElement('img');
        icon.src = wallet.icon;
        icon.alt = '';
        icon.width = 28;
        icon.height = 28;
        const label = document.createElement('span');
        label.textContent = wallet.name;
        button.append(icon, label);
        button.addEventListener('click', () => delegateWithWallet(wallet.id));
        listEl.appendChild(button);
    });
}

async function populateWalletList() {
    setStatus('Detecting installed wallets...');
    try {
        const { BrowserWallet } = await loadMeshLib();
        const wallets = BrowserWallet.getInstalledWallets();
        renderWalletList(wallets);
        if (wallets.length) setStatus('');
    } catch (error) {
        console.error('Failed to detect wallets', error);
        setStatus('Could not load the wallet connector. Please refresh and try again.');
    }
}

function shouldUseLocalStakeStatusProxy() {
    return ['127.0.0.1', 'localhost'].includes(window.location.hostname);
}

function getStakeStatusApiUrl(rewardAddress) {
    if (shouldUseLocalStakeStatusProxy()) {
        const params = new URLSearchParams({ rewardAddress });
        return `${LOCAL_STAKE_STATUS_PROXY_PATH}?${params.toString()}`;
    }

    return `${STAKE_STATUS_API_BASE_URL}/${encodeURIComponent(rewardAddress)}/info`;
}

async function fetchStakeStatusProxy(rewardAddress) {
    const response = await fetch(getStakeStatusApiUrl(rewardAddress));
    if (!response.ok) {
        throw new Error(`Stake status API returned ${response.status}`);
    }
    const data = await response.json();
    return { active: data.active === true, poolId: data.poolId || undefined };
}

async function fetchStakeStatusBlockfrost(rewardAddress) {
    const response = await fetch(`${BLOCKFROST_MAINNET_URL}/accounts/${rewardAddress}`, {
        headers: { project_id: BLOCKFROST_PROJECT_ID }
    });
    if (response.status === 404) {
        // Blockfrost 404 on accounts/ = stake address never seen on chain -> unregistered.
        return { active: false, poolId: undefined };
    }
    if (!response.ok) {
        throw new Error(`Blockfrost returned ${response.status}`);
    }
    const data = await response.json();
    return { active: data.active === true, poolId: data.pool_id || undefined };
}

async function fetchStakeStatus(rewardAddress) {
    const sources = [fetchStakeStatusProxy];
    if (BLOCKFROST_PROJECT_ID) sources.push(fetchStakeStatusBlockfrost);
    const errors = [];

    for (let round = 1; round <= 2; round++) {
        for (const source of sources) {
            try {
                return { ...(await source(rewardAddress)), verified: true };
            } catch (error) {
                console.warn('Stake status source failed', error);
                errors.push(error);
            }
        }
        if (round === 1) await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return {
        active: false,
        poolId: undefined,
        verified: false,
        detail: errors.map(error => error?.message).filter(Boolean).join('; ')
    };
}

function isTargetPoolId(poolId) {
    return TARGET_POOL_IDS.has(String(poolId || '').trim().toLowerCase());
}

async function delegateWithWallet(walletId) {
    try {
        const { BrowserWallet, MeshTxBuilder, KoiosProvider, deserializePoolId } = await loadMeshLib();

        setStatus('Connecting to wallet...');
        const wallet = await BrowserWallet.enable(walletId);

        const networkId = await wallet.getNetworkId();
        if (networkId !== 1) {
            setStatus('Please switch your wallet to Cardano Mainnet and try again.');
            return;
        }

        setStatus('Checking current delegation status...');
        // Network-name form without a token: sends no Authorization header, so it cannot
        // trip the CORS wildcard restriction. Tx building only needs a few public-tier calls.
        const provider = new KoiosProvider('api');
        const rewardAddresses = await wallet.getRewardAddresses();
        const rewardAddress = rewardAddresses[0];
        if (!rewardAddress) {
            setStatus('No stake address was found in this wallet. No transaction was built.');
            return;
        }
        const accountInfo = await fetchStakeStatus(rewardAddress);

        if (!accountInfo.verified) {
            setStatus('Could not verify current delegation status. No transaction was built, so no ADA will be spent. Please try again in a moment.');
            return;
        }

        if (accountInfo.active && isTargetPoolId(accountInfo.poolId)) {
            setStatus('This wallet is already delegating to The Dutch Stake Pool.');
            return;
        }

        if (accountInfo.active && !accountInfo.poolId) {
            setStatus('This wallet is already registered, but the current pool could not be confirmed. No transaction was built.');
            return;
        }

        setStatus('Building the delegation transaction...');
        const utxos = await wallet.getUtxos();
        const changeAddress = await wallet.getChangeAddress();
        const poolIdHash = deserializePoolId(POOL_ID);

        const txBuilder = new MeshTxBuilder({ fetcher: provider, submitter: provider, verbose: false });
        if (!accountInfo.active) {
            txBuilder.registerStakeCertificate(rewardAddress);
        }
        txBuilder.delegateStakeCertificate(rewardAddress, poolIdHash);

        const unsignedTx = await txBuilder
            .selectUtxosFrom(utxos)
            .changeAddress(changeAddress)
            .complete();

        setStatus('Please approve the transaction in your wallet...');
        const signedTx = await wallet.signTx(unsignedTx, false);

        setStatus('Submitting transaction...');
        const txHash = await wallet.submitTx(signedTx);

        const statusEl = document.getElementById('wallet-status');
        if (statusEl) {
            statusEl.textContent = '';
            const link = document.createElement('a');
            link.href = `https://cardanoscan.io/transaction/${txHash}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Delegation submitted! View on Cardanoscan';
            statusEl.appendChild(link);
        }
    } catch (error) {
        console.error('Delegation failed', error);
        const message = error && error.info ? error.info : (error && error.message) || 'Something went wrong.';
        setStatus(`Delegation failed: ${message}`);
    }
}

function openStakeModal(event) {
    if (event) event.preventDefault();
    const modal = getModal();
    if (!modal) return;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('tabindex', '-1');
    modal.focus();
    modal._triggerElement = event ? event.currentTarget : null;
    setWalletStep('warning');
}

function closeStakeModal() {
    const modal = getModal();
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    if (modal._triggerElement && typeof modal._triggerElement.focus === 'function') {
        modal._triggerElement.focus();
    }
    modal._triggerElement = null;
}

function bindStakeControls(root = document) {
    root.querySelectorAll('[data-stake-open]').forEach(button => {
        if (button.dataset.stakeBound === 'true') return;
        button.dataset.stakeBound = 'true';
        button.addEventListener('click', openStakeModal);
    });

    root.querySelectorAll('[data-stake-close]').forEach(button => {
        if (button.dataset.stakeBound === 'true') return;
        button.dataset.stakeBound = 'true';
        button.addEventListener('click', closeStakeModal);
    });

    root.querySelectorAll('[data-stake-continue]').forEach(button => {
        if (button.dataset.stakeBound === 'true') return;
        button.dataset.stakeBound = 'true';
        button.addEventListener('click', () => {
            setWalletStep('wallets');
            populateWalletList();
        });
    });
}

window.openStakeModal = openStakeModal;
window.closeStakeModal = closeStakeModal;

bindStakeControls();
document.addEventListener('DOMContentLoaded', () => bindStakeControls());
document.addEventListener('tdsp:content-loaded', () => bindStakeControls());

document.addEventListener('keydown', event => {
    const modal = getModal();
    if (modal && modal.style.display === 'block' && event.key === 'Escape') {
        closeStakeModal();
    }
});

window.addEventListener('click', event => {
    const modal = getModal();
    if (modal && event.target === modal) {
        closeStakeModal();
    }
});
