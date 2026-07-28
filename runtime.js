(function initializeTdspRuntime() {
    const DETAIL_CACHE_TTL_MS = 2 * 60 * 1000;
    const detailCache = new Map();
    const preloadObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                preloadObserver.unobserve(entry.target);
                entry.target.__tdspPreloadDetail?.();
            });
        }, { rootMargin: '160px 0px' })
        : null;

    function isLocalPreviewHostname(hostname) {
        const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
        if (!host) return false;
        if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
        if (host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host)) return true;
        if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true;
        if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) return true;

        const private172 = host.match(/^172\.(\d{1,2})(?:\.\d{1,3}){2}$/);
        return Boolean(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
    }

    function loadDetail(key, loader, options = {}) {
        const cacheKey = String(key || '').trim();
        if (!cacheKey || typeof loader !== 'function') {
            return Promise.reject(new Error('A detail cache key and loader are required'));
        }

        const current = detailCache.get(cacheKey);
        const ttlMs = Number(options.ttlMs) > 0 ? Number(options.ttlMs) : DETAIL_CACHE_TTL_MS;
        if (
            options.force !== true
            && current
            && Date.now() - current.loadedAt < ttlMs
        ) {
            return current.promise;
        }

        const promise = Promise.resolve()
            .then(loader)
            .then(value => {
                detailCache.set(cacheKey, {
                    loadedAt: Date.now(),
                    promise: Promise.resolve(value)
                });
                return value;
            })
            .catch(error => {
                if (detailCache.get(cacheKey)?.promise === promise) detailCache.delete(cacheKey);
                throw error;
            });
        detailCache.set(cacheKey, { loadedAt: Date.now(), promise });
        return promise;
    }

    function bindDetailPreload(element, key, loader) {
        if (!(element instanceof HTMLElement)) return;
        const preload = () => {
            loadDetail(key, loader).catch(() => {});
        };
        element.__tdspPreloadDetail = preload;
        element.addEventListener('pointerenter', preload, { passive: true });
        element.addEventListener('focusin', preload);
        element.addEventListener('touchstart', preload, { passive: true });
        preloadObserver?.observe(element);
    }

    window.TDSPRuntime = Object.freeze({
        detailCacheTtlMs: DETAIL_CACHE_TTL_MS,
        isLocalPreview: isLocalPreviewHostname(window.location.hostname),
        isLocalPreviewHostname,
        loadDetail,
        bindDetailPreload
    });
}());
