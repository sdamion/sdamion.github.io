(function initializeLinkedPoolLists() {
    const STARCH_POOL_WEBSITES = Object.freeze({
        '4free': 'https://x.com/4FREE_stakepool',
        a3c: 'https://x.com/A3Cpool_Shawn',
        bone: 'https://x.com/bone_pool',
        drmz: 'https://x.com/drmz_web3',
        earn: 'https://x.com/earncoinpool',
        earncoin: 'https://x.com/earncoinpool',
        earncoinpool: 'https://x.com/earncoinpool',
        epc: 'https://x.com/earncoinpool',
        epoch: 'https://x.com/EPOCHpool',
        sagan: 'https://x.com/SaganPool',
        tdsp: 'https://x.com/DamionDutch',
        weed: 'https://x.com/CardanoWEED'
    });


    function getExternalHttpUrl(value) {
        const url = String(value || '').trim();
        return /^https?:\/\//i.test(url) ? url : '';
    }

    function getStarchPoolWebsite(pool) {
        const suppliedWebsite = pool?.website || pool?.homepage || pool?.url;
        if (getExternalHttpUrl(suppliedWebsite)) return suppliedWebsite;

        const ticker = String(pool?.ticker || '').trim().toLowerCase();
        const normalizedName = String(pool?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedName.includes('earncoin')) return 'https://x.com/earncoinpool';
        return STARCH_POOL_WEBSITES[ticker] || 'https://starch.one/';
    }

    function createStarchPoolFallbackCard(pool, { openExternalSiteWarning } = {}) {
        const row = window.TDSPRuntime.createUniversalOverlayRow({
            title: pool?.name || 'No Name',
            titleClassName: 'pool-delegator-handle',
            details: [String(pool?.ticker || '').toUpperCase() || 'N/A']
        });
        const poolName = String(pool?.name || pool?.ticker || 'Starch pool');
        const openWebsite = () => openExternalSiteWarning?.(getStarchPoolWebsite(pool), row);

        row.classList.add('starch-pool-link-card');
        row.tabIndex = 0;
        row.setAttribute('role', 'link');
        row.setAttribute('aria-label', `Open ${poolName} website`);
        window.TDSPRuntime?.bindActionTrigger?.(row, openWebsite, {
            datasetKey: 'websiteBound',
            errorMessage: 'Starch pool website could not be opened.'
        });
        return row;
    }


    function createStarchPoolsList(starchPools = [], options = {}) {
        const list = document.createElement('div');
        list.className = 'pool-delegator-list governance-drep-directory-list';

        if (!starchPools.length) {
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Starch pool data is not available yet.';
            list.appendChild(message);
            return list;
        }

        const pools = [...starchPools];
        pools.forEach(pool => list.appendChild(createStarchPoolFallbackCard(pool, options)));


        return list;
    }

    function getMithrilSignerStake(signer) {
        return window.TDSPRuntime.getLovelaceAmount(signer, ['stake_lovelace']);
    }

    function createMithrilSignerFallbackCard(signer, index) {
        const poolId = String(signer?.pool_id || '');
        const idLine = document.createElement('div');
        idLine.className = 'pool-delegator-address-line';

        const id = document.createElement('span');
        id.className = 'pool-delegator-address';
        if (poolId && window.TDSPRuntime?.createResponsiveIdentifier) {
            id.appendChild(window.TDSPRuntime.createResponsiveIdentifier(poolId));
        } else {
            id.textContent = poolId || 'Unknown pool';
        }
        id.title = poolId;
        idLine.appendChild(id);

        if (poolId) {
            const copy = window.TDSPRuntime.createCopyButton(poolId, `Mithril signer pool ID ${index + 1}`, {
                className: 'pool-delegator-copy-button',
                bindOptions: { preventDefault: false, stopPropagation: false }
            });
            idLine.appendChild(copy);
        }

        const stake = document.createElement('span');
        stake.className = 'pool-delegator-amount';
        stake.textContent = window.TDSPRuntime.formatLovelaceAmount(getMithrilSignerStake(signer));

        const row = window.TDSPRuntime.createUniversalOverlayRow({
            title: signer?.display_name || signer?.name || 'No Name',
            titleClassName: 'pool-delegator-handle',
            details: [idLine, stake]
        });
        row.dataset.sortAmount = getMithrilSignerStake(signer).toString();
        return row;
    }


    function createMithrilSignersList(mithrilSigners = []) {
        const list = document.createElement('div');
        list.className = 'pool-delegator-list governance-drep-directory-list';

        if (!mithrilSigners.length) {
            const message = window.TDSPRuntime.createSmallText('Active Mithril signer data is not available yet.');
            list.appendChild(message);
            return list;
        }

        const signers = [...mithrilSigners];
        signers.forEach((signer, index) => list.appendChild(createMithrilSignerFallbackCard(signer, index)));


        return list;
    }

    window.TDSPLinkedPoolLists = Object.freeze({
        createStarchPoolsList,
        createMithrilSignersList
    });
}());
