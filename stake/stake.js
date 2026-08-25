(function () {
const POOL_ID = 'pool1zfd0gl76h3f0ammgp4gu0qvt99qcqkn5a895wv0q779d6p9dz5u';
const POOL_ID_HEX = '125af47fdabc52feef680d51c7818b2941805a74e9cb4731e0f78add';
const TARGET_POOL_IDS = new Set([POOL_ID, POOL_ID_HEX]);
const TDSP_DREP_ID = 'drep1yg5gkkyxwwr7d6qflf2qqp6drkp9432h6cvtmun0dqthusqlkz8hj';
const TDSP_DREP_NAME = 'DamionDutch';
const MESH_CDN_URL = 'https://esm.sh/@meshsdk/core@1.9.1?bundle-deps';
const IS_LOCAL_STAKE_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

let meshLibPromise = null;
function loadMeshLib() {
    if (!meshLibPromise) {
        meshLibPromise = import(MESH_CDN_URL);
    }
    return meshLibPromise;
}

function translateStakeText(text) {
    return window.TDSPI18n?.translateText?.(text) || text;
}

function setStakeAutoText(element, text) {
    if (!(element instanceof HTMLElement)) return;
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    element.setAttribute('data-i18n-auto', '');
    element.setAttribute('data-i18n-auto-original', value);
    element.textContent = translateStakeText(value);
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
    setStakeAutoText(statusEl, message || '');
    statusEl.hidden = !message;
}

function setDrepStatus(message) {
    const statusEl = document.getElementById('drep-wallet-status');
    if (!statusEl) return;
    setStakeAutoText(statusEl, message || '');
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

function bech32Polymod(values) {
    let chk = 1;
    values.forEach(value => {
        const top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ value;
        BECH32_GENERATOR.forEach((generator, index) => {
            if ((top >> index) & 1) chk ^= generator;
        });
    });
    return chk;
}

function bech32HrpExpand(hrp) {
    const high = [];
    const low = [];
    for (let index = 0; index < hrp.length; index++) {
        const code = hrp.charCodeAt(index);
        high.push(code >> 5);
        low.push(code & 31);
    }
    return [...high, 0, ...low];
}

function bech32Decode(value) {
    const bech = String(value || '').trim();
    if (!bech || bech !== bech.toLowerCase()) return null;
    const separator = bech.lastIndexOf('1');
    if (separator < 1 || separator + 7 > bech.length) return null;
    const hrp = bech.slice(0, separator);
    const data = [];
    for (const char of bech.slice(separator + 1)) {
        const digit = BECH32_ALPHABET.indexOf(char);
        if (digit < 0) return null;
        data.push(digit);
    }
    if (bech32Polymod([...bech32HrpExpand(hrp), ...data]) !== 1) return null;
    return { hrp, words: data.slice(0, -6) };
}

function bech32Encode(hrp, words) {
    const values = [...bech32HrpExpand(hrp), ...words];
    const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 1;
    const checksum = Array.from({ length: 6 }, (_, index) => (polymod >> (5 * (5 - index))) & 31);
    return `${hrp}1${[...words, ...checksum].map(value => BECH32_ALPHABET[value]).join('')}`;
}

function convertBits(data, fromBits, toBits, pad) {
    let value = 0;
    let bits = 0;
    const maxValue = (1 << toBits) - 1;
    const result = [];
    data.forEach(item => {
        if (item < 0 || (item >> fromBits)) throw new Error('Invalid bech32 data');
        value = (value << fromBits) | item;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            result.push((value >> bits) & maxValue);
        }
    });
    if (pad) {
        if (bits > 0) result.push((value << (toBits - bits)) & maxValue);
    } else if (bits >= fromBits || ((value << (toBits - bits)) & maxValue)) {
        throw new Error('Invalid bech32 padding');
    }
    return result;
}

function hexToBytes(value) {
    const hex = String(value || '').trim().toLowerCase();
    if (!/^(?:[0-9a-f]{2})+$/.test(hex)) return null;
    const bytes = [];
    for (let index = 0; index < hex.length; index += 2) {
        bytes.push(Number.parseInt(hex.slice(index, index + 2), 16));
    }
    return bytes;
}

function deriveRewardAddressFromBytes(bytes) {
    if (!Array.isArray(bytes) || !bytes.length) return '';
    const addressType = bytes[0] >> 4;
    const networkId = bytes[0] & 15;
    if (networkId !== 1) return '';

    if ((addressType === 14 || addressType === 15) && bytes.length >= 29) {
        const rewardWords = convertBits(bytes.slice(0, 29), 8, 5, true);
        return bech32Encode('stake', rewardWords);
    }
    if (addressType < 0 || addressType > 3 || bytes.length < 57) return '';

    const stakeCredential = bytes.slice(29, 57);
    const rewardHeader = (addressType === 2 || addressType === 3 ? 0xf0 : 0xe0) | networkId;
    const rewardWords = convertBits([rewardHeader, ...stakeCredential], 8, 5, true);
    return bech32Encode('stake', rewardWords);
}

function normalizeWalletAddressForExplorer(address) {
    const text = String(address || '').trim().toLowerCase();
    if (/^addr1[0-9a-z]{20,180}$/.test(text)) return text;
    const bytes = hexToBytes(text);
    if (!Array.isArray(bytes) || !bytes.length) return '';
    const networkId = bytes[0] & 15;
    const hrp = networkId === 1 ? 'addr' : 'addr_test';
    try {
        return bech32Encode(hrp, convertBits(bytes, 8, 5, true));
    } catch (error) {
        console.warn('Could not encode wallet address for explorer', error);
        return '';
    }
}

function deriveRewardAddressFromAddress(address) {
    const fromHex = deriveRewardAddressFromBytes(hexToBytes(address));
    if (/^stake1[0-9a-z]{20,120}$/i.test(fromHex)) return fromHex;

    const decoded = bech32Decode(address);
    if (!decoded) return '';
    if (decoded.hrp === 'stake' || decoded.hrp === 'stake_test') return String(address || '').trim().toLowerCase();
    if (decoded.hrp !== 'addr' && decoded.hrp !== 'addr_test') return '';

    let bytes;
    try {
        bytes = convertBits(decoded.words, 5, 8, false);
    } catch (error) {
        console.warn('Could not decode Cardano address bytes', error);
        return '';
    }
    return deriveRewardAddressFromBytes(bytes);
}

async function withTimeout(promise, timeoutMs, label) {
    let timeoutId;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
            })
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
}

async function getWalletAddressList(wallet, methodName) {
    if (!wallet || typeof wallet[methodName] !== 'function') return [];
    try {
        const addresses = await withTimeout(wallet[methodName](), 5000, methodName);
        return Array.isArray(addresses) ? addresses.filter(Boolean) : [];
    } catch (error) {
        console.warn(`Could not read wallet ${methodName}`, error);
        return [];
    }
}

function resolveWalletStakeAddress(walletAddresses, rewardAddresses, resolveRewardAddress) {
    const addressCandidates = Array.isArray(walletAddresses) ? walletAddresses.filter(Boolean) : [walletAddresses].filter(Boolean);
    for (const address of addressCandidates) {
        const fromDecodedAddress = deriveRewardAddressFromAddress(address);
        if (/^stake1[0-9a-z]{20,120}$/i.test(fromDecodedAddress)) return fromDecodedAddress;
    }

    const fromChangeAddress = (() => {
        const primaryAddress = addressCandidates[0];
        if (typeof resolveRewardAddress !== 'function' || !primaryAddress) return '';
        try {
            return String(resolveRewardAddress(primaryAddress) || '').trim();
        } catch (error) {
            console.warn('Could not resolve stake address from wallet address', error);
            return '';
        }
    })();
    if (/^stake1[0-9a-z]{20,120}$/i.test(fromChangeAddress)) return fromChangeAddress;

    const firstRewardAddress = String((Array.isArray(rewardAddresses) ? rewardAddresses[0] : '') || '').trim();
    const fromDecodedRewardAddress = deriveRewardAddressFromAddress(firstRewardAddress);
    if (/^stake1[0-9a-z]{20,120}$/i.test(fromDecodedRewardAddress)) {
        const rewardMatchesWallet = addressCandidates.some(address => deriveRewardAddressFromAddress(address) === fromDecodedRewardAddress);
        return rewardMatchesWallet ? fromDecodedRewardAddress : '';
    }
    return '';
}

function createStakeAddressEntries(walletAddresses, rewardAddresses, resolveRewardAddress) {
    const entries = [];
    const seen = new Set();
    const addressCandidates = Array.isArray(walletAddresses) ? walletAddresses.filter(Boolean) : [walletAddresses].filter(Boolean);

    addressCandidates.forEach(address => {
        let stakeAddress = deriveRewardAddressFromAddress(address);
        if (!/^stake1[0-9a-z]{20,120}$/i.test(stakeAddress) && typeof resolveRewardAddress === 'function') {
            try {
                stakeAddress = String(resolveRewardAddress(address) || '').trim();
            } catch (error) {
                console.warn('Could not resolve stake address from wallet address', error);
            }
        }

        stakeAddress = String(stakeAddress || '').trim().toLowerCase();
        if (!/^stake1[0-9a-z]{20,120}$/.test(stakeAddress) || seen.has(stakeAddress)) return;
        seen.add(stakeAddress);
        entries.push({
            stakeAddress,
            walletAddress: normalizeWalletAddressForExplorer(address),
            rawAddress: String(address || '').trim()
        });
    });

    if (!entries.length) {
        const firstRewardAddress = String((Array.isArray(rewardAddresses) ? rewardAddresses[0] : '') || '').trim();
        const stakeAddress = deriveRewardAddressFromAddress(firstRewardAddress) || firstRewardAddress;
        if (/^stake1[0-9a-z]{20,120}$/i.test(stakeAddress)) {
            entries.push({
                stakeAddress: stakeAddress.toLowerCase(),
                walletAddress: '',
                rawAddress: firstRewardAddress
            });
        }
    }

    return entries;
}

function renderStakeAddressChoices(entries, onSelect) {
    const listEl = document.getElementById('wallet-list');
    if (!listEl) return;
    listEl.replaceChildren();
    setStatus('Choose the wallet address you want to stake.');

    entries.forEach((entry, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wallet-option';
        const label = document.createElement('span');
        label.textContent = `${translateStakeText('Use address')} ${index + 1}`;
        const address = document.createElement('span');
        address.textContent = shortenStakeAddress(entry.walletAddress || entry.stakeAddress);
        button.append(label, address);
        button.addEventListener('click', () => onSelect(entry), { once: true });
        listEl.appendChild(button);
    });
}

function renderDrepStakeAddressChoices(entries, onSelect) {
    const listEl = document.getElementById('drep-wallet-list');
    if (!listEl) return;
    listEl.replaceChildren();
    setDrepStatus('Choose the wallet address you want to use.');

    entries.forEach((entry, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wallet-option';
        const label = document.createElement('span');
        label.textContent = `${translateStakeText('Use address')} ${index + 1}`;
        const address = document.createElement('span');
        address.textContent = shortenStakeAddress(entry.walletAddress || entry.stakeAddress);
        button.append(label, address);
        button.addEventListener('click', () => onSelect(entry), { once: true });
        listEl.appendChild(button);
    });
}

async function fetchStakeStatus(rewardAddress) {
    const query = `stakeAddress=${encodeURIComponent(rewardAddress)}&ts=${Date.now()}`;
    const url = IS_LOCAL_STAKE_PREVIEW
        ? `/__stake_status_proxy__?${query}`
        : `https://api.tdsp.online/api/stake-status/${encodeURIComponent(rewardAddress)}?ts=${Date.now()}`;
    const errors = [];

    for (let round = 1; round <= 1; round++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) throw new Error(`Stake status API returned ${response.status}`);
            const data = await response.json();
            return { active: data.active === true, poolId: data.pool_id || undefined, verified: true };
        } catch (error) {
            console.warn('Stake status request failed', error);
            errors.push(error);
        } finally {
            clearTimeout(timeout);
        }
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

function shortenStakeAddress(value) {
    const text = String(value || '').trim();
    return text.length > 24 ? `${text.slice(0, 14)}...${text.slice(-8)}` : text;
}

function renderAlreadyDelegatingStatus(walletAddress) {
    const statusEl = document.getElementById('wallet-status');
    if (!statusEl) return;
    const explorerAddress = normalizeWalletAddressForExplorer(walletAddress);
    statusEl.textContent = '';
    statusEl.hidden = false;

    const text = document.createElement('span');
    setStakeAutoText(text, 'This wallet is already delegating to The Dutch Stake Pool. Used address');
    statusEl.appendChild(text);

    if (!explorerAddress) return;
    statusEl.append(' ');
    const link = document.createElement('a');
    link.href = `https://cardanoscan.io/address/${explorerAddress}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = shortenStakeAddress(explorerAddress);
    statusEl.appendChild(link);
}

async function delegateWithWallet(walletId) {
    try {
        const { BrowserWallet, MeshTxBuilder, deserializePoolId, resolveRewardAddress } = await loadMeshLib();

        setStatus('Connecting to wallet...');
        const wallet = await BrowserWallet.enable(walletId);

        const networkId = await wallet.getNetworkId();
        if (networkId !== 1) {
            setStatus('Please switch your wallet to Cardano Mainnet and try again.');
            return;
        }

        setStatus('Checking current delegation status...');
        const [rewardAddresses, changeAddress, usedAddresses, unusedAddresses] = await Promise.all([
            withTimeout(wallet.getRewardAddresses(), 8000, 'getRewardAddresses'),
            withTimeout(wallet.getChangeAddress(), 8000, 'getChangeAddress'),
            getWalletAddressList(wallet, 'getUsedAddresses'),
            getWalletAddressList(wallet, 'getUnusedAddresses')
        ]);
        const walletAddressCandidates = [changeAddress, ...usedAddresses, ...unusedAddresses];
        const stakeEntries = createStakeAddressEntries(walletAddressCandidates, rewardAddresses, resolveRewardAddress);
        if (stakeEntries.length > 1) {
            renderStakeAddressChoices(stakeEntries, entry => {
                continueStakeDelegation({
                    wallet,
                    MeshTxBuilder,
                    deserializePoolId,
                    rewardAddress: entry.stakeAddress,
                    walletAddress: entry.walletAddress || entry.rawAddress,
                    changeAddress
                }).catch(error => {
                    console.error('Delegation failed', error);
                    const message = error && error.info ? error.info : (error && error.message) || 'Something went wrong.';
                    setStatus(`${translateStakeText('Delegation failed')}: ${message}`);
                });
            });
            return;
        }

        const rewardAddress = stakeEntries[0]?.stakeAddress || resolveWalletStakeAddress(
            walletAddressCandidates,
            rewardAddresses,
            resolveRewardAddress
        );
        if (!rewardAddress) {
            setStatus('No stake address was found in this wallet. No transaction was built.');
            return;
        }
        const walletAddress = stakeEntries[0]?.walletAddress || changeAddress || usedAddresses[0] || unusedAddresses[0];
        await continueStakeDelegation({
            wallet,
            MeshTxBuilder,
            deserializePoolId,
            rewardAddress,
            walletAddress,
            changeAddress
        });
    } catch (error) {
        console.error('Delegation failed', error);
        const message = error && error.info ? error.info : (error && error.message) || 'Something went wrong.';
        setStatus(`${translateStakeText('Delegation failed')}: ${message}`);
    }
}

async function continueStakeDelegation({ wallet, MeshTxBuilder, deserializePoolId, rewardAddress, walletAddress, changeAddress }) {
    const accountInfo = await fetchStakeStatus(rewardAddress);

    if (!accountInfo.verified) {
        setStatus('Could not verify current delegation status. No transaction was built, so no ADA will be spent. Please try again in a moment.');
        return;
    }

    if (accountInfo.active && isTargetPoolId(accountInfo.poolId)) {
        renderAlreadyDelegatingStatus(walletAddress || changeAddress);
        return;
    }

    if (accountInfo.active && !accountInfo.poolId) {
        setStatus('This wallet is already registered, but the current pool could not be confirmed. No transaction was built.');
        return;
    }

    setStatus('Building the delegation transaction...');
    const utxos = await wallet.getUtxos();
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
        setStakeAutoText(link, 'Delegation submitted! View on Cardanoscan');
        statusEl.appendChild(link);
    }
}

async function delegateDrepWithWallet(walletId) {
    try {
        const { BrowserWallet, MeshTxBuilder, resolveRewardAddress } = await loadMeshLib();

        setDrepStatus('Connecting to wallet...');
        const wallet = await BrowserWallet.enable(walletId);

        const networkId = await wallet.getNetworkId();
        if (networkId !== 1) {
            setDrepStatus('Please switch your wallet to Cardano Mainnet and try again.');
            return;
        }

        setDrepStatus('Preparing DRep voting delegation...');
        const [rewardAddresses, changeAddress, usedAddresses, unusedAddresses] = await Promise.all([
            withTimeout(wallet.getRewardAddresses(), 8000, 'getRewardAddresses'),
            withTimeout(wallet.getChangeAddress(), 8000, 'getChangeAddress'),
            getWalletAddressList(wallet, 'getUsedAddresses'),
            getWalletAddressList(wallet, 'getUnusedAddresses')
        ]);
        const walletAddressCandidates = [changeAddress, ...usedAddresses, ...unusedAddresses];
        const stakeEntries = createStakeAddressEntries(walletAddressCandidates, rewardAddresses, resolveRewardAddress);
        if (stakeEntries.length > 1) {
            renderDrepStakeAddressChoices(stakeEntries, entry => {
                continueDrepDelegation({
                    wallet,
                    MeshTxBuilder,
                    rewardAddress: entry.stakeAddress,
                    changeAddress
                }).catch(error => {
                    console.error('DRep delegation failed', error);
                    const message = error && error.info ? error.info : (error && error.message) || 'Something went wrong.';
                    setDrepStatus(`${translateStakeText('DRep delegation failed')}: ${message}`);
                });
            });
            return;
        }

        const rewardAddress = stakeEntries[0]?.stakeAddress || resolveWalletStakeAddress(
            walletAddressCandidates,
            rewardAddresses,
            resolveRewardAddress
        );
        if (!rewardAddress) {
            setDrepStatus('No stake address was found in this wallet. No transaction was built.');
            return;
        }
        await continueDrepDelegation({ wallet, MeshTxBuilder, rewardAddress, changeAddress });
    } catch (error) {
        console.error('DRep delegation failed', error);
        const message = error && error.info ? error.info : (error && error.message) || 'Something went wrong.';
        setDrepStatus(`${translateStakeText('DRep delegation failed')}: ${message}`);
    }
}

async function continueDrepDelegation({ wallet, MeshTxBuilder, rewardAddress, changeAddress }) {
    const utxos = await wallet.getUtxos();
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
        setStakeAutoText(link, 'DRep delegation submitted! View on Cardanoscan');
        statusEl.appendChild(link);
    }
}

function createDrepDelegationBodyNodes() {
    const warning = document.createElement('div');
    warning.id = 'drep-delegation-warning';
    warning.className = 'stake-warning';

    const title = document.createElement('strong');
    setStakeAutoText(title, 'Check before signing');
    const text = document.createElement('p');
    setStakeAutoText(text, `Always review the transaction in your wallet before approving. Confirm it delegates your Cardano voting power to ${TDSP_DREP_NAME} and does not include anything unexpected.`);
    const continueButton = document.createElement('button');
    continueButton.className = 'stake-continue-button';
    continueButton.type = 'button';
    continueButton.dataset.drepContinue = 'true';
    setStakeAutoText(continueButton, 'Continue');
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
        titleText: 'Stake to TDSP',
        closeLabel: 'Close Stake to TDSP',
        closeOverlay: closeStakeModal,
        returnFocus: event?.currentTarget || document.activeElement,
        rootTitle: 'Stake to TDSP',
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
}());
