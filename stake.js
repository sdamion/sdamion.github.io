const POOL_ID = 'pool1zfd0gl76h3f0ammgp4gu0qvt99qcqkn5a895wv0q779d6p9dz5u';
const KOIOS_MAINNET_URL = 'https://api.koios.rest/api/v1';
// Free-tier bearer token from koios.rest (10x the public rate limit). Leave empty for public tier.
const KOIOS_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyIjoic3Rha2UxdXh5dGhsZGM0bm14NDV0dm53c3F1NGg1cHlqZDk0dWR5dG02ZjB0Z25yNDR2ZWNqZDh2ZWwiLCJleHAiOjE4MTQ1NTE0NjksInRpZXIiOjEsInByb2pJRCI6Ind3dy50aGVkdXRjaHN0YWtlcG9vbC5jb20ifQ.kERzawinm9Ja2GzRztbTfbN4JPAJp8zV27GzgXnzMuE';
const BLOCKFROST_MAINNET_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';
// Optional second data source to ride out Koios rate limits.
// A mainnet project id from blockfrost.io — free tier is fine. Leave empty to use Koios only.
const BLOCKFROST_PROJECT_ID = '';
const MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';

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

function setStatus(message) {
    const statusEl = document.getElementById('wallet-status');
    if (statusEl) statusEl.textContent = message || '';
}

function renderWalletList(wallets) {
    const listEl = document.getElementById('wallet-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!wallets.length) {
        setStatus('No Cardano wallet extension detected. Install a CIP-30 wallet (Eternl, Lace, Nami, Typhon, Flint, Yoroi, Vespr...) and reopen this dialog.');
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

async function fetchStakeStatusKoios(rewardAddress, useToken) {
    // Koios answers CORS preflights with Access-Control-Allow-Headers: *, which per the
    // Fetch spec does not cover Authorization. Chrome still tolerates it (with a warning),
    // so the tokened call is attempted first and the public tier is the spec-safe fallback.
    const headers = { 'Content-Type': 'application/json' };
    if (useToken && KOIOS_API_TOKEN) headers.Authorization = `Bearer ${KOIOS_API_TOKEN}`;
    const response = await fetch(`${KOIOS_MAINNET_URL}/account_info`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ _stake_addresses: [rewardAddress] })
    });
    if (!response.ok) {
        throw new Error(`Koios returned ${response.status}`);
    }
    const rows = await response.json();
    if (!rows.length) {
        // No on-chain history at all for this stake address -> genuinely unregistered.
        return { active: false, poolId: undefined };
    }
    return { active: rows[0].status === 'registered', poolId: rows[0].delegated_pool };
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
    const sources = [];
    if (KOIOS_API_TOKEN) sources.push(addr => fetchStakeStatusKoios(addr, true));
    sources.push(addr => fetchStakeStatusKoios(addr, false));
    if (BLOCKFROST_PROJECT_ID) sources.push(fetchStakeStatusBlockfrost);

    for (let round = 1; round <= 2; round++) {
        for (const source of sources) {
            try {
                return await source(rewardAddress);
            } catch (error) {
                console.warn('Stake status source failed', error);
            }
        }
        if (round === 1) await new Promise(resolve => setTimeout(resolve, 1500));
    }
    throw new Error('Could not verify stake registration status. The network may be busy — please wait a moment and try again.');
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
        const accountInfo = await fetchStakeStatus(rewardAddress);

        if (accountInfo.active && accountInfo.poolId === POOL_ID) {
            setStatus('This wallet is already delegating to The Dutch Stake Pool.');
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
    populateWalletList();
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

window.openStakeModal = openStakeModal;
window.closeStakeModal = closeStakeModal;

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
