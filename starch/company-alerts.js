(function () {
    const STORAGE_KEY = 'tdsp-starch-company-alert-v1';
    const MAX_STATUS_AGE = 2 * 60 * 60 * 1000;
    let running = false;
    const translate = text => window.TDSPI18n?.translateText?.(text) || text;
    function read() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
    }
    function write(value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
    function setStatus(text) {
        const node = document.getElementById('starch-company-alert-status');
        if (node) {
            node.setAttribute('data-i18n-auto', '');
            node.setAttribute('data-i18n-auto-original', text);
            node.textContent = translate(text);
        }
    }
    function evaluate(payload, companyId, now = Date.now()) {
        const company = payload?.companies?.find(row => String(row.id).toUpperCase() === companyId);
        const timestamp = Date.parse(payload?.online_updated_at || '');
        if (!company || !Array.isArray(company.member_ids) || !company.member_ids.length
            || payload.online_block == null || !Number.isFinite(timestamp)
            || timestamp > now || now - timestamp > MAX_STATUS_AGE) return null;
        const miners = new Map((payload.miners || []).map(row => [String(row.id).toUpperCase(), row]));
        const members = [...new Set(company.member_ids.map(id => String(id).toUpperCase()))];
        const offline = members.filter(id => miners.get(id)?.online === false).sort();
        const unknown = members.some(id => typeof miners.get(id)?.online !== 'boolean');
        return { company, offline, unknown };
    }
    async function check() {
        const saved = read();
        const companyId = saved.companyId;
        if (running || !/^[A-F0-9]{6}$/.test(companyId || '') || !window.TDSPAlerts?.isEnabled('starchCompany')) return;
        running = true;
        try {
            const url = window.TDSPRuntime.isLocalPreview
                ? '/__starch_directory_proxy__' : 'https://api.tdsp.online/api/starch/directory/compact';
            const payload = await window.TDSPRuntime.fetchJson(url);
            if (read().companyId !== companyId || !window.TDSPAlerts?.isEnabled('starchCompany')) return;
            const status = evaluate(payload, companyId);
            if (!status || (status.unknown && !status.offline.length)) {
                setStatus('Company status is not available yet.');
                return;
            }
            setStatus(status.offline.length ? 'Company has offline miners.' : 'All company miners are online.');
            const previous = new Set(Array.isArray(saved.offlineIds) ? saved.offlineIds : []);
            const newOffline = status.offline.filter(id => !previous.has(id));
            if (newOffline.length) {
                if (!window.TDSPAlerts.canSend('starchCompany')) return;
                window.TDSPAlerts.send(
                    translate('Starch company: offline miners'),
                    `${status.company.name || companyId} (${companyId}) · ${translate('Offline')}: ${status.offline.length} · ${newOffline.slice(0, 8).join(', ')}${newOffline.length > 8 ? '…' : ''}`,
                    `tdsp-starch-company-${companyId}`, 'starchCompany'
                );
            }
            // Unknown status must not re-arm notifications for a previously offline miner.
            const offlineIds = status.unknown ? [...new Set([...previous, ...status.offline])] : status.offline;
            write({ companyId, offlineIds });
        } catch (error) {
            setStatus('Company status is not available yet.');
            console.warn('Starch company alert check failed:', error.message);
        } finally {
            running = false;
        }
    }
    function init() {
        const form = document.getElementById('starch-company-alert-form');
        const input = document.getElementById('starch-company-alert-id');
        if (!form || !input) return;
        input.value = read().companyId || '';
        form.addEventListener('submit', event => {
            event.preventDefault();
            const companyId = input.value.trim().toUpperCase();
            if (companyId && !/^[A-F0-9]{6}$/.test(companyId)) return;
            try {
                const previous = read();
                write({ companyId, offlineIds: previous.companyId === companyId ? previous.offlineIds : [] });
                input.value = companyId;
                setStatus(companyId ? 'Company alert saved.' : 'Company alert removed.');
                void check();
            } catch {
                setStatus('Company alert could not be saved.');
            }
        });
        document.getElementById('site-alert-starch-company')?.addEventListener('change', () => { void check(); });
        void check();
        setInterval(check, 60000);
    }
    window.TDSPStarchCompanyAlerts = Object.freeze({ check, evaluate });
    window.TDSPRuntime.onReady(init);
}());
