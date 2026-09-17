(function () {
    const IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
    const POOL_API_URL = IS_LOCAL_PREVIEW ? '/__pool_proxy__' : 'https://api.tdsp.online/api/pool';
    const MITHRIL_API_URL = IS_LOCAL_PREVIEW ? '/__mithril_proxy__' : 'https://api.tdsp.online/api/mithril';
    const ICEBREAKER_API_URL = IS_LOCAL_PREVIEW ? '/__icebreaker_proxy__' : 'https://api.tdsp.online/api/icebreaker';
    const STARCH_POOL_API_URL = IS_LOCAL_PREVIEW ? '/__starch_pools_proxy__' : 'https://api.tdsp.online/api/starch/pools';
    const LEADER_SCHEDULE_API_URL = IS_LOCAL_PREVIEW ? '/__leader_schedule_proxy__' : 'https://api.tdsp.online/api/leader-schedule';

    const notifiedRelayMaintenance = new Set();
    const delegatorSnapshots = new Map();

    function checkDelegatorNotifications(pool) {
        const id = String(pool?.pool_id || '').trim();
        if (!id || !Array.isArray(pool?.delegators)) return;
        const count = pool.delegator_count;
        if (count === null || count === undefined || count === '') return;
        const expected = Number(count);
        if (!Number.isSafeInteger(expected) || expected < 0) return;
        const members = new Map();
        for (const delegator of pool.delegators) {
            const address = String(delegator?.stake_address || '').trim();
            if (!address || members.has(address)) return;
            members.set(address, {
                label: String(delegator?.ada_handle || '').trim() || address,
                amount: delegator?.amount_lovelace
            });
        }
        // A failed or partial delegator fetch must never look like departures.
        if (members.size !== expected) return;
        const updatedAt = Date.parse(pool.updated_at);
        if (!Number.isFinite(updatedAt)) return;
        const previous = delegatorSnapshots.get(id);
        if (previous && updatedAt <= previous.updatedAt) return;
        delegatorSnapshots.set(id, { members, updatedAt });
        if (!previous) return;
        const joined = [...members].filter(([address]) => !previous.members.has(address));
        const left = [...previous.members].filter(([address]) => !members.has(address));
        const translate = text => window.TDSPI18n?.translateText?.(text) || text;
        for (const [changes, title, kind] of [
            [joined, 'New TDSP delegators', 'joined'],
            [left, 'Delegators left TDSP', 'left']
        ]) {
            if (!changes.length) continue;
            const labels = changes.slice(0, 3).map(([, member]) => {
                const amount = String(member.amount ?? '');
                if (kind !== 'joined' || !/^\d+$/.test(amount)) return member.label;
                return `${member.label} (${window.TDSPRuntime.formatLovelaceAmount(amount)})`;
            });
            const body = `${changes.length}: ${labels.join(', ')}${changes.length > 3 ? ' ...' : ''}`;
            try {
                window.TDSPAlerts?.send(translate(title), body,
                    `tdsp-delegators-${id}-${kind}`, 'delegators');
            } catch (error) {
                console.warn('Delegator notification could not be displayed', error);
            }
        }
    }
    const relayHealth = new Map();

    function checkRelayRecovery(pool) {
        for (const relay of Array.isArray(pool?.relays) ? pool.relays : []) {
            if (typeof relay.up !== 'boolean' || !relay.host) continue;
            const key = `${pool.pool_id}:${relay.host}:${relay.port || ''}`;
            const previous = relayHealth.get(key);
            relayHealth.set(key, relay.up);
            if (previous !== false || relay.up !== true) continue;
            const translate = text => window.TDSPI18n?.translateText?.(text) || text;
            try {
                window.TDSPAlerts?.send(translate('TDSP relay restored'),
                    `${relay.host}${relay.port ? `:${relay.port}` : ''}`,
                    `tdsp-relay-restored-${key}`, 'recovery');
            } catch (error) {
                console.warn('Relay recovery notification could not be displayed', error);
            }
        }
    }
    const observedBlockCounts = new Map();

    function checkBlockNotifications(pool) {
        const id = String(pool?.pool_id || '').trim();
        const rawCount = pool?.blocks_lifetime;
        if (!id || rawCount === null || rawCount === undefined || rawCount === '') return;
        const count = Number(rawCount);
        if (!Number.isSafeInteger(count) || count < 0) return;
        const previous = observedBlockCounts.get(id);
        const storageKey = `tdsp-block-notification-v1:${id}`;
        let stored = null;
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw !== null && /^\d+$/.test(raw)) stored = Number(raw);
        } catch {}
        // Keep a high-water mark so stale responses and other tabs cannot repeat alerts.
        const baseline = Math.max(previous ?? count, Number.isSafeInteger(stored) ? stored : (previous ?? count));
        const next = Math.max(baseline, count);
        observedBlockCounts.set(id, next);
        try { localStorage.setItem(storageKey, String(next)); } catch {}
        if (previous === undefined || count <= baseline) return;
        const translate = text => window.TDSPI18n?.translateText?.(text) || text;
        try {
            window.TDSPAlerts?.send(
                translate('TDSP produced a new block'),
                `${translate('New blocks')}: ${count - baseline} · ${translate('Lifetime Blocks')}: ${count}`,
                `tdsp-block-${id}-${count}`,
                'blocks'
            );
        } catch (error) {
            console.warn('Block notification could not be displayed', error);
        }
    }
    const state = {
        poolDelegators: [],
        mithrilSigners: [],
        mithrilStatus: null,
        starchPools: [],
        starchPoolStatus: null
    };

    function setResponsiveIdentifierText(id, value) {
        const element = document.getElementById(id);
        if (!element) return;
        const text = String(value || '').trim();
        if (element.dataset.identifierValue === text) return;
        element.dataset.identifierValue = text;
        element.textContent = text;
        if (window.TDSPRuntime?.createResponsiveIdentifier && text && text !== 'N/A') {
            element.replaceChildren(window.TDSPRuntime.createResponsiveIdentifier(text));
        }
    }

    function notifyRelayMaintenance(downRelays) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const newDownRelays = downRelays.filter(({ label, relay }) => {
            const id = `${label}:${relay.host || ''}:${relay.port || ''}`;
            if (notifiedRelayMaintenance.has(id)) return false;
            notifiedRelayMaintenance.add(id);
            return true;
        });
        if (!newDownRelays.length) return;

        new Notification('TDSP relay maintenance', {
            body: `${newDownRelays.map(item => item.label).join(', ')} down for maintenance.`,
            tag: 'tdsp-relay-maintenance'
        });
    }

    function setRelayCardStatus(activeCount, relayCount) {
        const status = document.getElementById('pool-relays-up');
        const meta = document.getElementById('pool-relays-meta');
        if (!status || !meta) return;

        window.TDSPRuntime.setText('pool-relays-up', activeCount === null ? 'N/A' : activeCount > 0 ? 'Active' : 'Inactive');
        window.TDSPRuntime.setText('pool-relays-meta', activeCount === null || relayCount === null
            ? 'Relay N/A'
            : `Relay ${activeCount}/${relayCount}`);
        window.TDSPRuntime.setStatusClasses(status, {
            active: activeCount !== null && activeCount >= 2,
            warning: activeCount === 1,
            inactive: activeCount === 0
        });
    }

    function setMithrilCardStatus(label, active) {
        const status = document.getElementById('pool-mithril-status');
        if (!status) return;

        window.TDSPRuntime.setText('pool-mithril-status', label);
        window.TDSPRuntime.setBinaryStatusClasses(status, active);
    }

    function setIcebreakerCardStatus(label, active) {
        const status = document.getElementById('pool-icebreaker-status');
        if (!status) return;

        window.TDSPRuntime.setText('pool-icebreaker-status', label);
        window.TDSPRuntime.setBinaryStatusClasses(status, active);
    }

    function renderMithrilStatus(payload) {
        state.mithrilStatus = payload;
        state.mithrilSigners = Array.isArray(payload?.signers) ? [...payload.signers] : [];
        const active = payload?.tdsp?.active === true;
        setMithrilCardStatus(active ? 'Active' : 'Inactive', active);
    }

    function renderStarchPoolStatus(payload) {
        state.starchPoolStatus = payload;
        state.starchPools = (Array.isArray(payload?.pools) ? payload.pools : [])
            .sort((left, right) => {
                const leftTicker = String(left?.ticker || '').toLowerCase();
                const rightTicker = String(right?.ticker || '').toLowerCase();
                if (leftTicker === 'tdsp') return -1;
                if (rightTicker === 'tdsp') return 1;
                return String(left?.name || leftTicker).localeCompare(
                    String(right?.name || rightTicker),
                    'en',
                    { sensitivity: 'base' }
                );
            });
        window.TDSPRuntime.setText('starch-pool-count', state.starchPools.length.toLocaleString('en-US'));
    }

    function setStarchPoolCardStatus(label, active) {
        const status = document.getElementById('pool-starch-status');
        if (!status) return;

        window.TDSPRuntime.setText('pool-starch-status', label);
        window.TDSPRuntime.setBinaryStatusClasses(status, active);
    }

    function renderLeaderSchedule(schedule) {
        const leadership = Array.isArray(schedule?.leadership) ? schedule.leadership : [];
        window.TDSPRuntime.setText('leader-schedule-count', window.TDSPRuntime.formatInteger(schedule?.slotCount ?? leadership.length));
        window.TDSPRuntime.setText('leader-schedule-meta', 'Possible Blocks Current Epoch');
    }

    function renderLeaderScheduleError() {
        window.TDSPRuntime.setText('leader-schedule-count', 'N/A');
        window.TDSPRuntime.setText('leader-schedule-meta', 'Possible Blocks Current Epoch');
    }

    function renderPoolStatus(pool) {
        checkDelegatorNotifications(pool);
        checkRelayRecovery(pool);
        checkBlockNotifications(pool);
        state.poolDelegators = Array.isArray(pool?.delegators) ? [...pool.delegators] : [];
        window.TDSPRuntime.setText('pool-delegators', window.TDSPRuntime.formatInteger(pool?.delegator_count));
        window.TDSPRuntime.setText('pool-lifetime-blocks', window.TDSPRuntime.formatInteger(pool?.blocks_lifetime ?? undefined));
        window.TDSPRuntime.setText('pool-live-stake', window.TDSPRuntime.formatAdaFromLovelace(pool?.live_stake_lovelace));
        window.TDSPRuntime.setText('pool-saturation', window.TDSPRuntime.formatRatioPercentage(pool?.saturation_pct ?? pool?.raw?.live_saturation, { smallValueFractionDigits: 3 }));
        window.TDSPRuntime.setText('pool-pledge', window.TDSPRuntime.formatAdaFromLovelace(pool?.pledge_lovelace ?? pool?.raw?.pledge));
        window.TDSPRuntime.setText('pool-margin', window.TDSPRuntime.formatRatioPercentage(pool?.margin ?? pool?.raw?.margin, { scale: 100 }));
        window.TDSPRuntime.setText('pool-fixed-cost', window.TDSPRuntime.formatAdaFromLovelace(pool?.fixed_cost_lovelace ?? pool?.raw?.fixed_cost));
        setResponsiveIdentifierText('pool-id', pool?.pool_id || 'N/A');

        const relays = Array.isArray(pool?.relays) ? pool.relays : [];
        const upCount = relays.filter(relay => relay.up === true).length;
        setRelayCardStatus(relays.length ? upCount : null, relays.length || null);
        window.TDSPRuntime.setText('pool-last-updated', window.TDSPRuntime.formatTimestamp(pool?.updated_at));

        const relaysEl = document.getElementById('pool-relays');
        if (!relaysEl) return;

        relaysEl.textContent = '';
        if (!relays.length) {
            const message = window.TDSPRuntime.createSmallText('No relay data available.');
            relaysEl.appendChild(message);
            return;
        }

        const downRelays = relays
            .map((relay, index) => ({ relay, label: `Relay ${index + 1}` }))
            .filter(item => item.relay.up !== true);

        if (downRelays.length) {
            const notice = document.createElement('p');
            notice.className = 'pool-maintenance-notice small-text';
            notice.textContent = `${downRelays.map(item => item.label).join(', ')} down for maintenance.`;
            relaysEl.appendChild(notice);
            if ('Notification' in window && Notification.permission === 'default') {
                const notificationButton = document.createElement('button');
                notificationButton.className = 'pool-notification-button';
                notificationButton.type = 'button';
                notificationButton.textContent = 'Enable relay notifications';
                notificationButton.addEventListener('click', async () => {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') notifyRelayMaintenance(downRelays);
                    notificationButton.remove();
                });
                relaysEl.appendChild(notificationButton);
            }
            notifyRelayMaintenance(downRelays);
        }
    }

    async function loadPool(options = {}) {
        const summaryEl = document.getElementById('pool-summary');
        const relaysEl = document.getElementById('pool-relays');

        if (!summaryEl || !relaysEl) return;

        try {
            renderPoolStatus(await window.TDSPRuntime.fetchJson(POOL_API_URL, options.force ? { cache: 'no-store' } : {}));
        } catch (error) {
            setRelayCardStatus(null, null);
            if (document.getElementById('pool-lifetime-blocks')?.textContent === '...') {
                window.TDSPRuntime.setText('pool-lifetime-blocks', 'N/A');
            }
            relaysEl.textContent = '';
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Pool data could not be loaded.';
            relaysEl.appendChild(message);
        }
    }

    async function loadMithril() {
        try {
            renderMithrilStatus(await window.TDSPRuntime.fetchJson(MITHRIL_API_URL));
        } catch (error) {
            state.mithrilStatus = null;
            state.mithrilSigners = [];
            setMithrilCardStatus('N/A', null);
        }
    }

    async function loadIcebreaker() {
        try {
            const payload = await window.TDSPRuntime.fetchJson(ICEBREAKER_API_URL);
            const active = payload?.active;
            setIcebreakerCardStatus(active === true ? 'Active' : active === false ? 'Inactive' : 'N/A', active);
        } catch (error) {
            setIcebreakerCardStatus('N/A', null);
        }
    }

    async function loadStarchPools() {
        try {
            renderStarchPoolStatus(await window.TDSPRuntime.fetchJson(STARCH_POOL_API_URL));
        } catch (error) {
            state.starchPoolStatus = null;
            state.starchPools = [];
            window.TDSPRuntime.setText('starch-pool-count', 'N/A');
        }
    }

    async function loadLeaderSchedule() {
        const scheduleEl = document.getElementById('leader-schedule');
        if (!scheduleEl) return;

        try {
            renderLeaderSchedule(await window.TDSPRuntime.fetchJson(LEADER_SCHEDULE_API_URL));
        } catch (error) {
            renderLeaderScheduleError();
        }
    }

    window.TDSPPoolStatus = Object.freeze({
        loadPool,
        loadMithril,
        loadIcebreaker,
        loadStarchPools,
        loadLeaderSchedule,
        setStarchPoolCardStatus,
        getState: () => ({
            poolDelegators: [...state.poolDelegators],
            mithrilSigners: [...state.mithrilSigners],
            mithrilStatus: state.mithrilStatus,
            starchPools: [...state.starchPools],
            starchPoolStatus: state.starchPoolStatus
        })
    });
})();
