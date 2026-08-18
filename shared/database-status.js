(function () {
    const IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
    const DATABASE_STATUS_API_URL = IS_LOCAL_PREVIEW ? '/__sqlite_status_proxy__' : 'https://api.tdsp.online/api/sqlite/status';

    async function load() {
        const status = document.getElementById('database-status');
        const text = document.getElementById('database-status-text');
        if (!status || !text) return;

        try {
            const payload = await window.TDSPRuntime.fetchJson(
                DATABASE_STATUS_API_URL,
                { cache: 'no-store' }
            );
            const recordCount = Number(payload.ai_records);
            status.classList.remove('is-active', 'is-loading', 'is-down');

            if (payload.rebuilding) {
                status.classList.add('is-loading');
                text.textContent = 'DB syncing';
                return;
            }

            if (payload.enabled && Number.isFinite(recordCount) && recordCount > 0 && !payload.last_error) {
                status.classList.add('is-active');
                text.textContent = `DB ${recordCount.toLocaleString('en-US')}`;
                return;
            }

            status.classList.add('is-down');
            text.textContent = 'DB down';
        } catch (error) {
            console.error('Database status could not be loaded', error);
            status.classList.remove('is-active', 'is-loading');
            status.classList.add('is-down');
            text.textContent = 'DB down';
        }
    }

    window.TDSPDatabaseStatus = Object.freeze({
        load
    });
}());
