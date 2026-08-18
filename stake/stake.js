const POOL_ID = 'pool1zfd0gl76h3f0ammgp4gu0qvt99qcqkn5a895wv0q779d6p9dz5u';
const POOL_ID_HEX = '125af47fdabc52feef680d51c7818b2941805a74e9cb4731e0f78add';
const TARGET_POOL_IDS = new Set([POOL_ID, POOL_ID_HEX]);
const TDSP_DREP_ID = 'drep1yg5gkkyxwwr7d6qflf2qqp6drkp9432h6cvtmun0dqthusqlkz8hj';
const TDSP_DREP_NAME = 'DamionDutch';
const MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const IS_LOCAL_STAKE_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;

let meshLibPromise = null;
function loadMeshLib() {
    if (!meshLibPromise) {
        meshLibPromise = import(MESH_CDN_URL);
    }
    return meshLibPromise;
}

function getModal() {
    return getTopGovernanceMenuOverlay('stake-now-overlay');
}

function getDrepDelegationModal() {
    return getTopGovernanceMenuOverlay('drep-delegation-overlay');
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

function setDrepWalletStep(step) {
    const warningEl = document.getElementById('drep-delegation-warning');
    const listEl = document.getElementById('drep-wallet-list');
    const isWarning = step === 'warning';

    if (warningEl) warningEl.hidden = !isWarning;
    if (listEl) {
        listEl.hidden = isWarning;
        if (isWarning) listEl.replaceChildren();
    }
    if (isWarning) setDrepStatus('');
}

function setStatus(message) {
    const statusEl = document.getElementById('wallet-status');
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.hidden = !message;
}

function setDrepStatus(message) {
    const statusEl = document.getElementById('drep-wallet-status');
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

function renderDrepWalletList(wallets) {
    const listEl = document.getElementById('drep-wallet-list');
    if (!listEl) return;
    listEl.replaceChildren();

    if (!wallets.length) {
        setDrepStatus('No Cardano wallet extension detected. Install a CIP-30 wallet (Eternl, Lace, Vespr...) and reopen this dialog.');
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
        button.addEventListener('click', () => delegateDrepWithWallet(wallet.id));
        listEl.appendChild(button);
    });
}

async function populateDrepWalletList() {
    setDrepStatus('Detecting installed wallets...');
    try {
        const { BrowserWallet } = await loadMeshLib();
        const wallets = BrowserWallet.getInstalledWallets();
        renderDrepWalletList(wallets);
        if (wallets.length) setDrepStatus('');
    } catch (error) {
        console.error('Failed to detect wallets', error);
        setDrepStatus('Could not load the wallet connector. Please refresh and try again.');
    }
}

async function fetchStakeStatus(rewardAddress) {
    const url = IS_LOCAL_STAKE_PREVIEW
        ? `/__stake_status_proxy__?stakeAddress=${encodeURIComponent(rewardAddress)}`
        : `https://api.tdsp.online/api/stake-status/${encodeURIComponent(rewardAddress)}`;
    const errors = [];

    for (let round = 1; round <= 2; round++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Stake status API returned ${response.status}`);
            const data = await response.json();
            return { active: data.active === true, poolId: data.pool_id || undefined, verified: true };
        } catch (error) {
            console.warn('Stake status request failed', error);
            errors.push(error);
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
        const { BrowserWallet, MeshTxBuilder, deserializePoolId } = await loadMeshLib();

        setStatus('Connecting to wallet...');
        const wallet = await BrowserWallet.enable(walletId);

        const networkId = await wallet.getNetworkId();
        if (networkId !== 1) {
            setStatus('Please switch your wallet to Cardano Mainnet and try again.');
            return;
        }

        setStatus('Checking current delegation status...');
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

        const txBuilder = new MeshTxBuilder({ verbose: false });
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

async function delegateDrepWithWallet(walletId) {
    try {
        const { BrowserWallet, MeshTxBuilder } = await loadMeshLib();

        setDrepStatus('Connecting to wallet...');
        const wallet = await BrowserWallet.enable(walletId);

        const networkId = await wallet.getNetworkId();
        if (networkId !== 1) {
            setDrepStatus('Please switch your wallet to Cardano Mainnet and try again.');
            return;
        }

        setDrepStatus('Preparing DRep voting delegation...');
        const rewardAddresses = await wallet.getRewardAddresses();
        const rewardAddress = rewardAddresses[0];
        if (!rewardAddress) {
            setDrepStatus('No stake address was found in this wallet. No transaction was built.');
            return;
        }

        const utxos = await wallet.getUtxos();
        const changeAddress = await wallet.getChangeAddress();
        const txBuilder = new MeshTxBuilder({ verbose: false });

        const unsignedTx = await txBuilder
            .voteDelegationCertificate({ dRepId: TDSP_DREP_ID }, rewardAddress)
            .selectUtxosFrom(utxos)
            .changeAddress(changeAddress)
            .complete();

        setDrepStatus('Please approve the DRep delegation transaction in your wallet...');
        const signedTx = await wallet.signTx(unsignedTx, false);

        setDrepStatus('Submitting transaction...');
        const txHash = await wallet.submitTx(signedTx);

        const statusEl = document.getElementById('drep-wallet-status');
        if (statusEl) {
            statusEl.textContent = '';
            const link = document.createElement('a');
            link.href = `https://cardanoscan.io/transaction/${txHash}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'DRep delegation submitted! View on Cardanoscan';
            statusEl.appendChild(link);
        }
    } catch (error) {
        console.error('DRep delegation failed', error);
        const message = error && error.info ? error.info : (error && error.message) || 'Something went wrong.';
        setDrepStatus(`DRep delegation failed: ${message}`);
    }
}

function createDrepDelegationBodyNodes() {
    const warning = document.createElement('div');
    warning.id = 'drep-delegation-warning';
    warning.className = 'stake-warning';

    const title = document.createElement('strong');
    title.textContent = 'Check before signing';
    const text = document.createElement('p');
    text.textContent = `Always review the transaction in your wallet before approving. Confirm it delegates your Cardano voting power to ${TDSP_DREP_NAME} and does not include anything unexpected.`;
    const continueButton = document.createElement('button');
    continueButton.className = 'stake-continue-button';
    continueButton.type = 'button';
    continueButton.dataset.drepContinue = 'true';
    continueButton.textContent = 'Continue';
    warning.append(title, text, continueButton);

    const list = document.createElement('div');
    list.id = 'drep-wallet-list';
    list.className = 'wallet-list';

    const status = document.createElement('p');
    status.id = 'drep-wallet-status';
    status.className = 'wallet-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    return [warning, list, status];
}

function openStakeModal(event) {
    if (event) event.preventDefault();
    if (getModal()) return;
    const template = document.getElementById('stakenow');
    if (!(template instanceof HTMLTemplateElement)) return;
    const content = template.content.cloneNode(true);
    const bodyNodes = Array.from(content.children);
    const elements = createUniversalOverlay({
        id: 'stake-now-overlay',
        titleId: 'stake-now-title',
        titleText: 'Stake Now',
        closeLabel: 'Close Stake Now',
        closeOverlay: closeStakeModal,
        returnFocus: event?.currentTarget || document.activeElement,
        rootTitle: 'Stake Now',
        overlayClass: 'stake-overlay',
        dialogClass: 'wallet-modal-content',
        bodyNodes,
        enableSearch: false
    });
    const modal = elements.overlay;
    elements.body.classList.add('wallet-dialog-body');
    modal._triggerElement = event ? event.currentTarget : null;
    bindStakeControls(modal);
    setWalletStep('warning');
}

function openDrepDelegationModal(event) {
    if (event) event.preventDefault();
    if (getDrepDelegationModal()) return;
    const elements = createUniversalOverlay({
        id: 'drep-delegation-overlay',
        titleId: 'drep-delegation-title',
        titleText: `Make ${TDSP_DREP_NAME} your DRep`,
        closeLabel: `Close ${TDSP_DREP_NAME} DRep delegation`,
        closeOverlay: closeDrepDelegationModal,
        returnFocus: event?.currentTarget || document.activeElement,
        rootTitle: 'DRep Delegation',
        overlayClass: 'stake-overlay',
        dialogClass: 'wallet-modal-content',
        bodyNodes: createDrepDelegationBodyNodes(),
        enableSearch: false
    });
    const modal = elements.overlay;
    elements.body.classList.add('wallet-dialog-body');
    modal._triggerElement = event ? event.currentTarget : null;
    bindStakeControls(modal);
    setDrepWalletStep('warning');
}

function closeStakeModal() {
    const modal = getModal();
    if (!modal) return;
    modal.remove();
    syncGovernanceMenuOverlayAccessibility();
    if (modal._triggerElement && typeof modal._triggerElement.focus === 'function') {
        modal._triggerElement.focus();
    }
    modal._triggerElement = null;
}

function closeDrepDelegationModal() {
    const modal = getDrepDelegationModal();
    if (!modal) return;
    modal.remove();
    syncGovernanceMenuOverlayAccessibility();
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

    root.querySelectorAll('[data-stake-continue]').forEach(button => {
        if (button.dataset.stakeBound === 'true') return;
        button.dataset.stakeBound = 'true';
        button.addEventListener('click', () => {
            setWalletStep('wallets');
            populateWalletList();
        });
    });

    root.querySelectorAll('[data-drep-open]').forEach(button => {
        if (button.dataset.drepBound === 'true') return;
        button.dataset.drepBound = 'true';
        button.addEventListener('click', openDrepDelegationModal);
    });

    root.querySelectorAll('[data-drep-continue]').forEach(button => {
        if (button.dataset.drepBound === 'true') return;
        button.dataset.drepBound = 'true';
        button.addEventListener('click', () => {
            setDrepWalletStep('wallets');
            populateDrepWalletList();
        });
    });
}

function initStakeUi() {
    bindStakeControls();
    window.TDSPStakeReady = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStakeUi, { once: true });
} else {
    initStakeUi();
}
document.addEventListener('tdsp:content-loaded', () => bindStakeControls());
window.openStakeModal = openStakeModal;
window.openDrepDelegationModal = openDrepDelegationModal;
