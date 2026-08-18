(function () {
    function createTdspDrepModule({
        createBotContext,
        createOverlay,
        removeOverlay,
        runtime
    }) {
        function renderCards(stats) {
            const status = stats.drep.active ? 'Active' : 'Inactive';
            runtime.setText('tdsp-drep-status', status);
            runtime.setText('tdsp-drep-delegators', stats.delegatorCount === null ? 'N/A' : stats.delegatorCount.toLocaleString('en-US'));
            runtime.setText('tdsp-drep-delegation', runtime.formatTileAdaFromLovelace(stats.drep.votingPower, { fixedFractionDigits: 2 }));
            runtime.setText('tdsp-drep-voted', stats.votedCount === null ? 'N/A' : stats.votedCount.toLocaleString('en-US'));
        }

        function renderUnavailable() {
            runtime.setText('tdsp-drep-status', 'Unavailable');
            runtime.setText('tdsp-drep-delegators', 'N/A');
            runtime.setText('tdsp-drep-delegation', 'N/A');
            runtime.setText('tdsp-drep-voted', 'N/A');
        }

        function openDelegatorsOverlay(stats, returnFocus = null) {
            createOverlay({
                id: 'tdsp-drep-delegators-overlay',
                titleId: 'tdsp-drep-delegators-title',
                titleText: `${stats.drep.name} Delegators`,
                closeLabel: `Close ${stats.drep.name} delegators`,
                closeOverlay: closeDelegatorsOverlay,
                bodyNodes: [createDelegatorsList(stats)],
                headerMeta: `${(stats.delegatorCount || 0).toLocaleString('en-US')} delegators`,
                returnFocus,
                botContext: createBotContext('DReps', {
                    title: `${stats.drep.name} Delegators`,
                    count: stats.delegatorCount || 0,
                    amount_ada: Number(stats.drep.votingPower || 0) / 1_000_000,
                    root: 'DRep Stats',
                    summary: `${stats.drep.name} DRep delegators`
                })
            });
        }

        function closeDelegatorsOverlay() {
            removeOverlay('tdsp-drep-delegators-overlay');
        }

        function createDelegatorsList(stats) {
            const list = document.createElement('div');
            list.className = 'pool-delegator-list';

            const delegators = Array.isArray(stats?.delegators) ? stats.delegators : [];
            if (!delegators.length) {
                const message = document.createElement('p');
                message.className = 'small-text';
                message.textContent = stats?.delegatorsError
                    ? 'DRep delegator details could not be loaded from Koios yet.'
                    : 'DRep delegator details are not available yet.';
                list.appendChild(message);
                return list;
            }

            [...delegators]
                .sort((left, right) => compareBigIntDescending(getDelegatorAmount(left), getDelegatorAmount(right)))
                .forEach((delegator, index) => list.appendChild(createDelegatorRow(delegator, index)));

            return list;
        }

        function createDelegatorRow(delegator, index) {
            const row = document.createElement('div');
            row.className = 'pool-delegator-row governance-menu-card';
            row.dataset.sortAmount = getDelegatorAmount(delegator).toString();

            const content = document.createElement('div');
            content.className = 'pool-delegator-content';

            const adaHandle = String(delegator?.ada_handle || '').trim();
            const walletAddresses = runtime.getDelegatorWalletAddresses(delegator);
            const walletAddress = walletAddresses[0] || '';
            const addressLine = document.createElement('div');
            addressLine.className = 'pool-delegator-address-line';

            const addressText = document.createElement('strong');
            addressText.className = `pool-delegator-address${adaHandle ? ' pool-delegator-handle' : ''}`;
            if (adaHandle || !walletAddress || !runtime.createResponsiveIdentifier) {
                addressText.textContent = adaHandle || walletAddress || 'Wallet address unavailable';
            } else {
                addressText.appendChild(runtime.createResponsiveIdentifier(walletAddress));
            }
            if (walletAddress) addressText.title = walletAddress;

            const amount = document.createElement('span');
            amount.className = 'pool-delegator-amount';
            amount.textContent = runtime.formatLovelaceAmount(getDelegatorAmount(delegator));

            addressLine.appendChild(addressText);
            if (walletAddress) {
                const copy = document.createElement('button');
                copy.className = 'pool-delegator-copy-button';
                copy.type = 'button';
                copy.textContent = '⧉';
                copy.setAttribute('aria-label', `Copy DRep delegator wallet address ${index + 1}`);
                runtime?.bindCopyButton?.(copy, walletAddress, { preventDefault: false });
                addressLine.appendChild(copy);
            }
            content.append(addressLine, amount);

            if (adaHandle && walletAddress) {
                const walletText = document.createElement('span');
                walletText.className = 'pool-delegator-wallet-address';
                if (runtime.createResponsiveIdentifier) {
                    walletText.appendChild(runtime.createResponsiveIdentifier(walletAddress));
                } else {
                    walletText.textContent = walletAddress;
                }
                walletText.title = walletAddress;
                content.appendChild(walletText);
            }

            if (walletAddresses.length > 1) {
                const addressCount = document.createElement('span');
                addressCount.className = 'pool-delegator-epoch';
                addressCount.textContent = `${walletAddresses.length.toLocaleString('en-US')} linked wallet addresses`;
                content.appendChild(addressCount);
            }

            const epoch = Number(delegator?.active_epoch_no ?? delegator?.epoch_no);
            if (Number.isFinite(epoch)) {
                const epochText = document.createElement('span');
                epochText.className = 'pool-delegator-epoch';
                epochText.textContent = `Active epoch ${epoch.toLocaleString('en-US')}`;
                content.appendChild(epochText);
            }

            row.dataset.sortName = runtime.normalizeSearchText(adaHandle || walletAddress);
            row.dataset.searchText = runtime.getDelegatorSearchText(delegator);
            row.appendChild(content);
            return row;
        }

        function getDelegatorAmount(delegator) {
            return runtime.getLovelaceAmount(delegator);
        }

        function compareBigIntDescending(left, right) {
            return left > right ? -1 : left < right ? 1 : 0;
        }

        return Object.freeze({
            closeDelegatorsOverlay,
            openDelegatorsOverlay,
            renderCards,
            renderUnavailable
        });
    }

    window.TDSPTdspDrep = Object.freeze({
        create: createTdspDrepModule
    });
}());
