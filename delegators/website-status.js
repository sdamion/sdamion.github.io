export function createWebsiteStatusPanel(request) {
    const panel = document.createElement('section');
    let samples = [];
    let storageOverlay = null;
    let storageBody = null;
    const translate = text => window.TDSPI18n?.translateText?.(text) || text;
    const node = (tag, text, className = '') => {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = translate(String(text));
        return element;
    };
    const refresh = node('button', 'Refresh', 'overlay-action-button');
    refresh.type = 'button';
    const status = node('p', '', 'governance-card-detail');
    status.setAttribute('role', 'status');
    const grid = node('div', '', 'tdsp-tile-grid tdsp-tile-grid--three tdsp-tile-grid--mobile-stack');
    panel.append(refresh, status, grid);
    const date = value => value ? new Date(value).toLocaleString() : translate('Unavailable');
    const number = value => Number.isFinite(value) ? value.toLocaleString() : translate('Unavailable');
    const card = (title, value, details, tone = '') => {
        const tile = node('div', '', 'governance-menu-card');
        const content = node('div', '');
        const primary = node('strong', value, 'governance-treasury-withdrawal-amount');
        if (tone) primary.dataset.amountTone = tone;
        window.TDSPRuntime.appendUniversalTileContent(content, {
            title,
            primaryNode: primary,
            detailItems: details
        });
        tile.append(content);
        grid.append(tile);
        return content;
    };
    const bar = (parent, good, bad, label, waiting = 0, free = 0) => {
        if (!Number.isFinite(good) || !Number.isFinite(bad) || good + bad + waiting + free <= 0) return;
        const track = node('div', '', 'governance-vote-bar-track');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', label);
        for (const [amount, type] of [[good, 'yes'], [waiting, 'waiting'], [bad, 'no'], [free, 'free']]) {
            const fill = node('span', '', `governance-vote-bar-fill governance-vote-bar-fill--${type}`);
            fill.style.flexBasis = `${amount / (good + bad + waiting + free) * 100}%`;
            if (type === 'free') fill.style.background = 'var(--line)';
            track.append(fill);
        }
        parent.append(track, node('span', label, 'tdsp-bar-legend'));
    };
    const graph = (title, key, unit) => {
        const points = samples.filter(sample => Number.isFinite(sample[key]));
        const values = points.map(sample => sample[key]);
        const current = values.at(-1);
        const content = card(title, `${number(current)} ${unit}`, [
            `${translate('Samples')}: ${points.length}`,
            `${translate('From')}: ${date(points[0]?.time)}`,
            'Backend history · last 24 hours · 1 minute intervals'
        ]);
        if (values.length < 2) {
            content.append(node('span', 'Waiting for next sample', 'governance-card-detail'));
            return;
        }
        const maximum = Math.max(1, ...values);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 90');
        svg.setAttribute('class', 'tdsp-monitor-chart');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `${translate(title)}: 0 - ${number(maximum)} ${unit}. ${translate('Latest')}: ${number(current)} ${unit}`);
        const line = document.createElementNS(svg.namespaceURI, 'polyline');
        const duration = Math.max(1, points.at(-1).time - points[0].time);
        line.setAttribute('points', values.map((value, i) => `${5 + (points[i].time - points[0].time) * 290 / duration},${80 - value / maximum * 70}`).join(' '));
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', 'currentColor');
        line.setAttribute('stroke-width', '2');
        svg.append(line);
        content.append(svg, node('span', `0 - ${number(maximum)} ${unit} · ${date(points.at(-1).time)}`, 'tdsp-bar-legend'));
    };
    const ada = value => value === null || value === undefined ? translate('Unavailable')
        : `₳ ${(Number(BigInt(value)) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
    const bytes = value => {
        if (!Number.isFinite(value)) return translate('Unavailable');
        const unit = value >= 1e9 ? 'GB' : value >= 1e6 ? 'MB' : value >= 1e3 ? 'KB' : 'B';
        const divisor = {GB:1e9, MB:1e6, KB:1e3, B:1}[unit];
        return `${(value / divisor).toLocaleString(undefined, {maximumFractionDigits:2})} ${unit}`;
    };
    const renderStorage = storage => {
        if (!storageBody) return;
        storageBody.replaceChildren(node('p', 'One encrypted cache per member. Wallet IDs are anonymous; Portfolio contents remain private.', 'governance-card-detail'));
        if (!Array.isArray(storage.wallets)) { storageBody.append(node('p', 'Unavailable')); return; }
        for (const wallet of storage.wallets) {
            const row = node('div', '', 'governance-menu-card');
            window.TDSPRuntime.appendUniversalTileContent(row, {
                title: `${translate('Wallet')} ${wallet.wallet_id.slice(0, 12)}`,
                primaryText: bytes(wallet.size_bytes),
                detailItems: [`${translate('Updated')}: ${date(wallet.updated_at_ms)}`]
            });
            row.title = wallet.wallet_id;
            storageBody.append(row);
        }
        if (!storage.wallets.length) storageBody.append(node('p', 'No remote Portfolio caches.'));
    };
    panel.refresh = async () => {
        if (refresh.disabled) return;
        refresh.disabled = true;
        status.textContent = translate('Loading...');
        const started = performance.now();
        try {
            const data = await request();
            if (!panel.isConnected) return;
            samples = Array.isArray(data.history?.samples)
                ? data.history.samples.filter(sample => Number.isFinite(sample?.time)).sort((a, b) => a.time - b.time) : [];
            grid.replaceChildren();
            const monitoring = data.monitoring;
            if (monitoring) {
                const waiting = monitoring.checks.filter(check => check.status === 'waiting').length;
                const critical = monitoring.total - monitoring.healthy - waiting;
                const pool = monitoring.pool;
                const poolCritical = !['healthy', 'waiting'].includes(pool.status);
                const overview = card('Data checks', `${monitoring.healthy} / ${monitoring.total}`, [
                    `${translate('Needs attention')}: ${monitoring.attention}`,
                    `${translate('Last checked')}: ${date(monitoring.sampled_at_ms)}`,
                    'Cached data checks; no additional Koios requests'
                ], critical || poolCritical ? 'negative' : waiting || pool.status === 'waiting' ? 'warning' : 'positive');
                bar(overview, monitoring.healthy, critical, `${translate('Fresh caches')}: ${monitoring.healthy} · ${translate('Waiting on data')}: ${waiting} · ${translate('Needs attention')}: ${critical}`, waiting);
                card('Live stake verification', pool.status === 'healthy' ? 'Verified' : pool.status === 'waiting' ? 'Waiting on data' : pool.status === 'stale' ? 'Data stale' : 'Needs attention', [
                    `${translate('Live stake')}: ${ada(pool.live_stake_lovelace)}`,
                    `${translate('Delegator total')}: ${ada(pool.delegator_sum_lovelace)}`,
                    `${translate('Difference')}: ${ada(pool.difference_lovelace)}`,
                    `${translate('Delegators')}: ${number(pool.delegators)}`,
                    `${translate('Last checked')}: ${date(pool.checked_at)}`,
                    ...pool.issues.map(translate)
                ], pool.status === 'healthy' ? 'positive' : pool.status === 'waiting' ? 'warning' : 'negative');
            }
            card('Website', location.host, [
                `${translate('Secure connection')}: ${window.isSecureContext ? translate('Yes') : translate('No')}`,
                `${translate('Language')}: ${document.documentElement.lang || 'en'}`,
                `${translate('Response time')}: ${Math.round(performance.now() - started)} ms`
            ]);
            const backend = data.backend || {};
            const storage = data.portfolio_storage || {status:'unavailable'};
            const tone = {healthy:'positive', warning:'warning', critical:'negative'}[storage.status];
            const storageCard = card('Remote Portfolio storage', `${bytes(storage.used_bytes)} / ${bytes(storage.limit_bytes ?? 1e10)}`, [
                `${translate('Wallets')}: ${number(storage.wallets?.length)}`,
                'Green <70% · Orange 70–90% · Red ≥90%',
                `${translate('Last checked')}: ${date(storage.measured_at)}`
            ], tone);
            if (Number.isFinite(storage.used_bytes)) {
                const used = Math.min(storage.used_bytes, storage.limit_bytes);
                bar(storageCard, tone === 'positive' ? used : 0, tone === 'negative' ? used : 0,
                    `${number(Math.round(storage.usage_percent * 10) / 10)}%`, tone === 'warning' ? used : 0, Math.max(0, storage.limit_bytes - used));
                const tile = storageCard.parentElement;
                tile.setAttribute('role', 'button'); tile.tabIndex = 0;
                tile.setAttribute('aria-label', translate('Remote Portfolio storage'));
                window.TDSPRuntime.bindActionTrigger(tile, () => {
                    if (storageOverlay?.isConnected) return;
                    storageBody = node('section', '', 'governance-list');
                    renderStorage(storage);
                    const close = () => { storageOverlay?.remove(); storageOverlay = storageBody = null; window.syncGovernanceMenuOverlayAccessibility?.(); if (tile.isConnected) tile.focus(); };
                    storageOverlay = window.createUniversalOverlay({id:'website-portfolio-storage-overlay', titleId:'website-portfolio-storage-title',
                        titleText:'Remote Portfolio storage', dialogClass:'governance-drep-dialog', bodyNodes:[storageBody],
                        enableSearch:false, showBack:true, showClose:false, closeOnBackdrop:false, closeOverlay:close, returnFocus:tile}).overlay;
                });
            }
            renderStorage(storage);
            card('Backend', 'Connected', [
                `${translate('Uptime')}: ${number(Math.floor(backend.uptime_seconds / 60))} min`,
                `Node: ${backend.node_version || '-'}`,
                `RAM: ${number(Math.round(backend.memory_rss_bytes / 1048576))} MB`,
                `Heap: ${number(Math.round(backend.heap_used_bytes / 1048576))} MB`,
                `${translate('Background refresh')}: ${backend.background_refresh_enabled ? translate('Enabled') : translate('Disabled')}`
            ]);
            for (const [name, provider] of Object.entries(data.providers || {})) {
                const blocked = provider.blocked_until > Date.now();
                const providerCard = card(name, number(provider.queued), [
                    blocked ? 'Waiting to retry' : 'No active cooldown',
                    `${translate('Queued / in progress')}: ${number(provider.queued)}`,
                    `${translate('Succeeded')}: ${number(provider.succeeded)}`,
                    `${translate('Failed')}: ${number(provider.failed)}`,
                    `${translate('Last completed')}: ${date(provider.last_completed_at)}`,
                    `${translate('Last failure')}: ${date(provider.last_failure_at)}`,
                    ...(blocked ? [`${translate('Retry after')}: ${date(provider.blocked_until)}`] : [])
                ]);
                bar(providerCard, provider.succeeded, provider.failed,
                    `${translate('Succeeded')}: ${number(provider.succeeded)} · ${translate('Failed')}: ${number(provider.failed)}`);
            }
            graph('Backend check duration', 'check_ms', 'ms');
            graph('Backend memory', 'memory_mb', 'MB');
            card('Ask AI', data.ai?.available ? 'Available' : 'Unavailable', data.ai?.running_models || []);
            const cache = data.cache || {};
            card('Cache', cache.has_error ? 'Error' : cache.rebuilding ? 'Updating' : cache.enabled ? 'Enabled' : 'Disabled', [
                `${translate('Cache files')}: ${number(cache.cache_files)}`,
                `${translate('AI records')}: ${number(cache.ai_records)}`,
                `${translate('Last rebuild')}: ${date(cache.last_rebuild_at)}`
            ]);
            for (const check of monitoring?.checks || []) {
                const label = { healthy: 'Fresh', waiting: 'Waiting on data', stale: 'Data stale', missing: 'Missing', unknown: 'Unknown', error: 'Refresh failed' }[check.status];
                card(check.name, label, [
                    `${translate('Missed intervals')}: ${number(check.missed_intervals)}`,
                    `${translate('Age')}: ${check.age_ms === null ? '-' : number(Math.max(0, Math.round(check.age_ms / 60000)))} min`,
                    `${translate('Refresh interval')}: ${number(check.interval_ms / 60000)} min`,
                    `${translate('Updated')}: ${date(check.updated_at)}`
                ], check.status === 'healthy' ? 'positive' : check.status === 'waiting' ? 'warning' : 'negative');
            }
            status.textContent = `${translate('Updated')}: ${date(data.checked_at)}. ${translate('API counters since backend restart; queue status is not an upstream health check.')}`;
            if (data.history?.persistence_error) status.textContent += ` ${translate('Monitoring history could not be saved.')}`;
        } catch (error) {
            status.textContent = `${translate('Website status could not be loaded.')} ${error.message}. ${translate('Previously displayed data may be outdated.')}`;
        } finally {
            refresh.disabled = false;
        }
    };
    refresh.addEventListener('click', panel.refresh);
    const timer = setInterval(() => {
        if (!panel.isConnected) { clearInterval(timer); return; }
        if (document.visibilityState === 'visible' && panel.getClientRects().length && !panel.hidden) panel.refresh();
    }, 30000);
    return panel;
}
