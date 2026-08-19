(function () {
    const IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
    const POOL_API_URL = IS_LOCAL_PREVIEW ? '/__pool_proxy__' : 'https://api.tdsp.online/api/pool';
    const MITHRIL_API_URL = IS_LOCAL_PREVIEW ? '/__mithril_proxy__' : 'https://api.tdsp.online/api/mithril';
    const ICEBREAKER_API_URL = IS_LOCAL_PREVIEW ? '/__icebreaker_proxy__' : 'https://api.tdsp.online/api/icebreaker';
    const STARCH_POOL_API_URL = IS_LOCAL_PREVIEW ? '/__starch_pools_proxy__' : 'https://api.tdsp.online/api/starch/pools';
    const LEADER_SCHEDULE_API_URL = IS_LOCAL_PREVIEW ? '/__leader_schedule_proxy__' : 'https://api.tdsp.online/api/leader-schedule';

    const notifiedRelayMaintenance = new Set();
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
        window.TDSPRuntime.setText('leader-schedule-meta', `Possible blocks · Epoch ${window.TDSPRuntime.formatInteger(schedule?.epoch)}`);
    }

    function renderLeaderScheduleError() {
        window.TDSPRuntime.setText('leader-schedule-count', 'N/A');
        window.TDSPRuntime.setText('leader-schedule-meta', 'Possible blocks · Epoch N/A');
    }

    function renderPoolStatus(pool) {
        state.poolDelegators = Array.isArray(pool?.delegators) ? [...pool.delegators] : [];
        window.TDSPRuntime.setText('pool-delegators', window.TDSPRuntime.formatInteger(pool?.delegator_count));
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

    async function loadPool() {
        const summaryEl = document.getElementById('pool-summary');
        const relaysEl = document.getElementById('pool-relays');

        if (!summaryEl || !relaysEl) return;

        try {
            renderPoolStatus(await window.TDSPRuntime.fetchJson(POOL_API_URL));
        } catch (error) {
            setRelayCardStatus(null, null);
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
