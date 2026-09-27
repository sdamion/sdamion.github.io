export function createWebsiteStatusPanel(request) {
    const panel = document.createElement('section');
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
    const grid = node('div', '', 'tdsp-tile-grid');
    panel.append(refresh, status, grid);
    const date = value => value ? new Date(value).toLocaleString() : translate('Unavailable');
    const number = value => Number.isFinite(value) ? value.toLocaleString() : translate('Unavailable');
    const card = (title, value, details) => {
        const tile = node('section', '', 'governance-menu-card');
        const content = node('div', '');
        content.append(node('strong', title, 'governance-card-title'), node('p', value, 'governance-card-detail'));
        details.forEach(text => content.append(node('p', text, 'governance-card-detail')));
        tile.append(content);
        grid.append(tile);
    };
    panel.refresh = async () => {
        if (refresh.disabled) return;
        refresh.disabled = true;
        status.textContent = translate('Loading...');
        const started = performance.now();
        try {
            const data = await request();
            if (!panel.isConnected) return;
            grid.replaceChildren();
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
                card(name, blocked ? 'Waiting to retry' : 'No active cooldown', [
                    `${translate('Queued / in progress')}: ${number(provider.queued)}`,
                    `${translate('Succeeded')}: ${number(provider.succeeded)}`,
                    `${translate('Failed')}: ${number(provider.failed)}`,
                    `${translate('Last completed')}: ${date(provider.last_completed_at)}`,
                    `${translate('Last failure')}: ${date(provider.last_failure_at)}`,
                    ...(blocked ? [`${translate('Retry after')}: ${date(provider.blocked_until)}`] : [])
                ]);
            }
            card('Ask AI', data.ai?.available ? 'Available' : 'Unavailable', data.ai?.running_models || []);
            const cache = data.cache || {};
            card('Cache', cache.has_error ? 'Error' : cache.rebuilding ? 'Updating' : cache.enabled ? 'Enabled' : 'Disabled', [
                `${translate('Cache files')}: ${number(cache.cache_files)}`,
                `${translate('AI records')}: ${number(cache.ai_records)}`,
                `${translate('Last rebuild')}: ${date(cache.last_rebuild_at)}`
            ]);
            card('Refresh intervals', 'Configured intervals', Object.entries(data.refresh_intervals_ms || {})
                .map(([name, ms]) => `${name.replaceAll('_', ' ')}: ${number(ms / 60000)} min`));
            status.textContent = `${translate('Updated')}: ${date(data.checked_at)}. ${translate('API counters since backend restart; queue status is not an upstream health check.')}`;
        } catch (error) {
            status.textContent = `${translate('Website status could not be loaded.')} ${error.message}. ${translate('Previously displayed data may be outdated.')}`;
        } finally {
            refresh.disabled = false;
        }
    };
    refresh.addEventListener('click', panel.refresh);
    return panel;
}
