(function initializeSiteUpdates() {
    const INTERVAL_MS = 60000;
    const versionSelector = 'meta[name="tdsp-site-version"]';
    const assetSelector = 'script[src], link[rel="stylesheet"][href]';

    function signature(source) {
        const version = source.querySelector(versionSelector)?.getAttribute('content');
        if (!version) return null;
        return JSON.stringify([version, ...Array.from(source.querySelectorAll(assetSelector), element =>
            element.getAttribute('src') || element.getAttribute('href'))]);
    }

    // Capture the original head before lazy-loaded modules or translations change it.
    const initialSignature = signature(document.head);
    if (!initialSignature || !/^https?:$/.test(window.location.protocol)) return;
    const dirtyFields = new Set();
    let pendingSignature = null;
    let checking = false;
    let reloading = false;

    function isVisible(element) {
        return element.isConnected && !element.closest('[hidden]') && element.getClientRects().length > 0;
    }

    function canReload() {
        if (document.hidden) return false;
        const overlays = document.querySelectorAll('.governance-overlay, [role="dialog"], dialog[open]');
        if (Array.from(overlays).some(isVisible)) return false;
        for (const field of dirtyFields) {
            if (!field.isConnected) dirtyFields.delete(field);
            else if (String(field.value ?? field.textContent).trim()) return false;
        }
        return true;
    }

    function applyUpdate() {
        if (!pendingSignature || reloading || !canReload()) return;
        // A query token bypasses stale HTML while retaining the current section and parameters.
        const target = new URL(window.location.href);
        target.searchParams.set('__tdsp_version', String(Date.now()));
        reloading = true;
        window.location.replace(target.href);
    }

    async function check() {
        if (checking || reloading || document.hidden) return;
        checking = true;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        try {
            const target = new URL(window.location.href);
            target.hash = '';
            target.searchParams.set('__tdsp_version', String(Date.now()));
            const response = await fetch(target.href, { cache: 'no-store', signal: controller.signal });
            if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return;
            const source = new DOMParser().parseFromString(await response.text(), 'text/html');
            const latest = signature(source.head);
            if (!latest) return;
            pendingSignature = latest !== initialSignature ? latest : null;
            applyUpdate();
        } catch {
            // Offline or failed deployments must not interrupt the currently working page.
        } finally {
            window.clearTimeout(timeout);
            checking = false;
        }
    }

    document.addEventListener('input', event => {
        const field = event.target;
        if (field?.matches?.('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), [contenteditable="true"]')) {
            dirtyFields.add(field);
        }
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void check();
    });
    window.addEventListener('online', () => void check());
    window.setInterval(() => void check(), INTERVAL_MS);
    window.setInterval(applyUpdate, 2000);
}());
