export function createWebsiteStatusPanel(request) {
    const panel = document.createElement('section');
    let samples = [];
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
    const bar = (parent, good, bad, label) => {
        if (!Number.isFinite(good) || !Number.isFinite(bad) || good + bad <= 0) return;
        const track = node('div', '', 'governance-vote-bar-track');
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', label);
        for (const [amount, type] of [[good, 'yes'], [bad, 'no']]) {
            const fill = node('span', '', `governance-vote-bar-fill governance-vote-bar-fill--${type}`);
            fill.style.flexBasis = `${amount / (good + bad) * 100}%`;
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
                const overview = card('Data checks', `${monitoring.healthy} / ${monitoring.total}`, [
                    `${translate('Needs attention')}: ${monitoring.attention}`,
                    `${translate('Last checked')}: ${date(monitoring.sampled_at_ms)}`,
                    'Cached data checks; no additional Koios requests'
                ], monitoring.attention ? 'negative' : 'positive');
                bar(overview, monitoring.healthy, monitoring.total - monitoring.healthy, `${translate('Fresh caches')}: ${monitoring.healthy} / ${monitoring.total}`);
                const pool = monitoring.pool;
                card('Live stake verification', pool.status === 'healthy' ? 'Verified' : 'Needs attention', [
                    `${translate('Live stake')}: ${ada(pool.live_stake_lovelace)}`,
                    `${translate('Delegator total')}: ${ada(pool.delegator_sum_lovelace)}`,
                    `${translate('Difference')}: ${ada(pool.difference_lovelace)}`,
                    `${translate('Delegators')}: ${number(pool.delegators)}`,
                    `${translate('Last checked')}: ${date(pool.checked_at)}`,
                    ...pool.issues.map(translate)
                ], pool.status === 'healthy' ? 'positive' : 'negative');
            }
            card('Website', location.host, [
                `${translate('Secure connection')}: ${window.isSecureContext ? translate('Yes') : translate('No')}`,
                `${translate('Language')}: ${document.documentElement.lang || 'en'}`,
                `${translate('Response time')}: ${Math.round(performance.now() - started)} ms`
            ]);
            const backend = data.backend || {};
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
                const label = { healthy: 'Fresh', stale: 'Stale', missing: 'Missing', unknown: 'Unknown', error: 'Refresh failed' }[check.status];
                card(check.name, label, [
                    `${translate('Age')}: ${check.age_ms === null ? '-' : number(Math.max(0, Math.round(check.age_ms / 60000)))} min`,
                    `${translate('Refresh interval')}: ${number(check.interval_ms / 60000)} min`,
                    `${translate('Updated')}: ${date(check.updated_at)}`
                ], check.status === 'healthy' ? 'positive' : 'negative');
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
