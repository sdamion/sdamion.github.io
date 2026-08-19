(function initializePoolDelegatorsList() {
    function getDelegatorAmount(delegator) {
        return window.TDSPRuntime.getLovelaceAmount(delegator, ['amount_lovelace', 'amount']);
    }

    function formatDelegatorAda(lovelace) {
        return window.TDSPRuntime.formatLovelaceAmount(lovelace);
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

    function createPoolDelegatorsList(poolDelegators = []) {
        const list = document.createElement('div');
        list.className = 'pool-delegator-list';

        if (!poolDelegators.length) {
            const message = window.TDSPRuntime.createSmallText('Delegator details are not available yet.');
            list.appendChild(message);
            return list;
        }

        const sortedDelegators = [...poolDelegators].sort((left, right) => {
            const leftAmount = getDelegatorAmount(left);
            const rightAmount = getDelegatorAmount(right);
            return rightAmount > leftAmount ? 1 : rightAmount < leftAmount ? -1 : 0;
        });

        sortedDelegators.forEach((delegator, index) => {
            const adaHandle = String(delegator?.ada_handle || '').trim();
            const walletAddresses = window.TDSPRuntime.getDelegatorWalletAddresses(delegator);
            const walletAddress = walletAddresses[0] || '';
            const addressLine = document.createElement('div');
            addressLine.className = 'pool-delegator-address-line';

            const addressText = document.createElement('strong');
            addressText.className = `pool-delegator-address${adaHandle ? ' pool-delegator-handle' : ''}`;
            if (adaHandle || !walletAddress || !window.TDSPRuntime?.createResponsiveIdentifier) {
                addressText.textContent = adaHandle || walletAddress || 'Wallet address unavailable';
            } else {
                addressText.appendChild(window.TDSPRuntime.createResponsiveIdentifier(walletAddress));
            }
            if (walletAddress) addressText.title = walletAddress;

            const amount = document.createElement('span');
            amount.className = 'pool-delegator-amount';
            amount.textContent = formatDelegatorAda(getDelegatorAmount(delegator));

            addressLine.appendChild(addressText);
            if (walletAddress) {
                const copy = document.createElement('button');
                copy.className = 'pool-delegator-copy-button';
                copy.type = 'button';
                copy.textContent = '⧉';
                copy.dataset.copyValue = walletAddress;
                copy.setAttribute('aria-label', `Copy wallet address ${index + 1}`);
                window.TDSPRuntime?.bindCopyButton?.(copy, button => button.dataset.copyValue, { preventDefault: false, stopPropagation: false });
                addressLine.appendChild(copy);
            }
            const details = [addressLine, amount];

            if (adaHandle && walletAddress) {
                const walletText = document.createElement('span');
                walletText.className = 'pool-delegator-wallet-address';
                if (window.TDSPRuntime?.createResponsiveIdentifier) {
                    walletText.appendChild(window.TDSPRuntime.createResponsiveIdentifier(walletAddress));
                } else {
                    walletText.textContent = walletAddress;
                }
                walletText.title = walletAddress;
                details.push(walletText);
            }

            if (walletAddresses.length > 1) {
                const addressCount = document.createElement('span');
                addressCount.className = 'pool-delegator-epoch';
                addressCount.textContent = `${walletAddresses.length.toLocaleString('en-US')} linked wallet addresses`;
                details.push(addressCount);
            }

            const epoch = Number(delegator?.active_epoch_no);
            if (Number.isFinite(epoch)) {
                const epochText = document.createElement('span');
                epochText.className = 'pool-delegator-epoch';
                const epochLabel = `Active epoch ${epoch.toLocaleString('en-US')}`;
                epochText.setAttribute('data-i18n-auto', '');
                epochText.setAttribute('data-i18n-auto-original', epochLabel);
                epochText.textContent = window.TDSPI18n?.translateText?.(epochLabel) || epochLabel;
                details.push(epochText);
            }

            const row = createPoolOverlayRow({ details });
            row.dataset.sortName = window.TDSPRuntime.normalizeSearchText(adaHandle || walletAddress);
            row.dataset.searchText = window.TDSPRuntime.getDelegatorSearchText(delegator);
            row.dataset.sortAmount = getDelegatorAmount(delegator).toString();
            if (Number.isFinite(epoch)) row.dataset.sortEpoch = String(epoch);
            list.appendChild(row);
        });

        return list;
    }

    window.TDSPPoolDelegatorsList = Object.freeze({
        create: createPoolDelegatorsList
    });
}());
