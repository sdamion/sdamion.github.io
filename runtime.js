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
        if (host === 'localhost' || host.endsWith('.localhost')) return true;
        if (host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host)) return true;
        if (/^192\.168\.(?:1|4)\.\d{1,3}$/.test(host)) return true;
        return false;
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

    function loadScript(src, options = {}) {
        const scriptSrc = String(src || '').trim();
        if (!scriptSrc) {
            return Promise.reject(new Error('A script source is required'));
        }

        if (typeof options.ready === 'function') {
            const readyValue = options.ready();
            if (readyValue) return Promise.resolve(readyValue);
        }

        const cacheKey = `script:${scriptSrc}`;
        const current = detailCache.get(cacheKey);
        if (current) return current.promise;

        const selector = options.selector || (options.datasetKey ? `script[data-${options.datasetKey}]` : `script[src=\"${scriptSrc}\"]`);
        const promise = new Promise((resolve, reject) => {
            const resolveLoaded = script => {
                if (script instanceof HTMLElement) script.dataset.tdspLoaded = 'true';
                resolve(typeof options.ready === 'function' ? options.ready() : undefined);
            };
            const existing = document.querySelector(selector);
            if (existing) {
                if (existing.dataset.tdspLoaded === 'true') {
                    resolveLoaded(existing);
                    return;
                }
                existing.addEventListener('load', () => resolveLoaded(existing), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = scriptSrc;
            script.defer = options.defer !== false;
            if (options.datasetName) script.dataset[options.datasetName] = 'true';
            script.addEventListener('load', () => resolveLoaded(script), { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        }).catch(error => {
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

    function normalizeSelectorList(selectors) {
        return Array.isArray(selectors) ? selectors.filter(Boolean) : [selectors].filter(Boolean);
    }

    function closestTarget(target, selector) {
        if (!selector) return null;
        const element = target instanceof Element ? target : target?.parentElement;
        return element?.closest?.(selector) || null;
    }

    function bindActivation(element, handler) {
        if (!(element instanceof Element) || typeof handler !== 'function') return;
        element.addEventListener('click', event => handler(event));
        element.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            handler(event);
        });
    }

    function bindIntentLoad(selectors, loader, options = {}) {
        const selectorList = normalizeSelectorList(selectors);
        if (!selectorList.length || typeof loader !== 'function') return;
        const selector = selectorList.join(',');
        const events = Array.isArray(options.events) && options.events.length ? options.events : ['pointerdown', 'focusin'];

        events.forEach(eventName => {
            document.addEventListener(eventName, event => {
                if (closestTarget(event.target, selector)) loader();
            }, eventName === 'focusin' ? undefined : { passive: true });
        });
    }

    function bindViewportLoad(selectors, loader, options = {}) {
        const selectorList = normalizeSelectorList(selectors);
        if (!selectorList.length || typeof loader !== 'function' || !('IntersectionObserver' in window)) return;

        const targets = selectorList
            .map(selector => document.querySelector(selector))
            .filter(Boolean);
        if (!targets.length) return;

        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            loader();
        }, { rootMargin: options.rootMargin || '400px 0px' });

        targets.forEach(target => observer.observe(target));
    }

    function scheduleIdle(callback, options = {}) {
        if (typeof callback !== 'function') return;
        const timeout = Number(options.timeout) > 0 ? Number(options.timeout) : 6000;
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback, { timeout });
            return;
        }
        window.setTimeout(callback, timeout);
    }

    function onReady(callback) {
        if (typeof callback !== 'function') return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
            return;
        }
        callback();
    }

    function setStatusClasses(element, states = {}) {
        if (!element) return;
        element.classList.toggle('is-active', states.active === true);
        element.classList.toggle('is-warning', states.warning === true);
        element.classList.toggle('is-inactive', states.inactive === true);
    }

    function setBinaryStatusClasses(element, active) {
        setStatusClasses(element, {
            active: active === true,
            inactive: active === false
        });
    }

    function formatInteger(value, fallback = 'N/A') {
        const number = Number(value);
        return Number.isFinite(number) ? new Intl.NumberFormat('en-US').format(number) : fallback;
    }

    function parseLovelaceBigInt(value) {
        try {
            return BigInt(String(value ?? '0'));
        } catch {
            return null;
        }
    }

    function formatLovelaceAmount(value, options = {}) {
        const lovelace = parseLovelaceBigInt(value);
        if (lovelace === null) return options.fallback || 'N/A';

        const decimals = Number.isInteger(options.fractionDigits) ? options.fractionDigits : 2;
        const wholeAda = lovelace / 1_000_000n;
        const fraction = lovelace % 1_000_000n;
        const numericValue = `${wholeAda}.${fraction.toString().padStart(6, '0')}`;
        return `₳ ${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(Number(numericValue))}`;
    }

    function getLovelaceAmount(record, keys = ['amount_lovelace', 'amount', 'lovelace']) {
        const source = keys.map(key => record?.[key]).find(value => value !== undefined && value !== null && value !== '');
        return parseLovelaceBigInt(source) ?? 0n;
    }

    function formatAdaFromLovelace(value, options = {}) {
        const number = Number(value);
        if (!Number.isFinite(number)) return options.fallback || 'N/A';
        const maximumFractionDigits = Number.isInteger(options.maximumFractionDigits) ? options.maximumFractionDigits : 0;
        return `₳ ${new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(number / 1_000_000)}`;
    }

    function formatPercentageValue(value, options = {}) {
        const number = Number(value);
        if (!Number.isFinite(number)) return options.fallback || 'N/A';
        return `${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: Number.isInteger(options.minimumFractionDigits) ? options.minimumFractionDigits : 0,
            maximumFractionDigits: Number.isInteger(options.maximumFractionDigits) ? options.maximumFractionDigits : 2
        }).format(number)}%`;
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    }

    async function copyText(value) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return;
        }

        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
    }

    function bindCopyButton(button, value, options = {}) {
        if (!(button instanceof HTMLElement)) return;
        button.addEventListener('keydown', event => event.stopPropagation());
        button.addEventListener('click', async event => {
            if (options.preventDefault !== false) event.preventDefault();
            if (options.stopPropagation !== false) event.stopPropagation();

            const originalLabel = button.textContent;
            const originalAriaLabel = button.getAttribute('aria-label') || '';
            const copyValue = typeof value === 'function' ? value(button, event) : value;

            try {
                if (!copyValue) {
                    if (options.skipEmpty === true) return;
                    throw new Error('Missing copy value');
                }
                await copyText(copyValue);
                button.textContent = options.copiedText || 'Copied';
                if (options.copiedAriaLabel) {
                    button.setAttribute('aria-label', options.copiedAriaLabel);
                } else if (originalAriaLabel) {
                    button.setAttribute('aria-label', originalAriaLabel.replace(/^Copy\b/, 'Copied'));
                }
            } catch {
                button.textContent = options.errorText || 'Copy failed';
            }

            window.setTimeout(() => {
                button.textContent = originalLabel;
                if (originalAriaLabel) button.setAttribute('aria-label', originalAriaLabel);
            }, Number(options.resetMs) > 0 ? Number(options.resetMs) : 1400);
        });
    }

    function cleanTileText(value) {
        return String(value || '').replace(/\n{3,}/g, '\n\n').trim();
    }

    function shortenMiddle(value, options = {}) {
        const text = String(value || '').trim();
        const front = Number.isInteger(options.front) ? options.front : 20;
        const back = Number.isInteger(options.back) ? options.back : 10;
        const minLength = Number.isInteger(options.minLength) ? options.minLength : front + back + 4;
        if (text.length <= minLength) return text;
        return `${text.slice(0, front)}...${text.slice(-back)}`;
    }

    function createSmallText(text, options = {}) {
        const element = document.createElement(options.tagName || 'p');
        element.className = options.className || 'small-text';
        element.textContent = String(text || '');
        return element;
    }

    function appendUniversalTileContent(container, options = {}) {
        if (!(container instanceof HTMLElement)) return;

        const title = document.createElement('strong');
        title.className = options.titleClassName || 'governance-title';
        title.textContent = cleanTileText(options.title || 'Untitled');
        container.appendChild(title);

        if (options.primaryNode instanceof Node) {
            container.appendChild(options.primaryNode);
        } else if (options.primaryText) {
            const primary = document.createElement('span');
            primary.className = options.primaryClassName || 'governance-card-detail governance-treasury-withdrawal-amount';
            primary.textContent = cleanTileText(options.primaryText);
            container.appendChild(primary);
        }

        const context = (options.contextItems || []).filter(Boolean).join(' • ');
        if (context) {
            const contextLine = document.createElement('span');
            contextLine.className = 'governance-card-detail governance-funding-card-context';
            contextLine.textContent = cleanTileText(context);
            container.appendChild(contextLine);
        }

        if (options.proposer) {
            const proposer = document.createElement('span');
            proposer.className = 'governance-card-detail governance-funding-card-proposer';
            proposer.textContent = `Proposer: ${cleanTileText(options.proposer)}`;
            container.appendChild(proposer);
        }

        (options.detailItems || []).filter(Boolean).forEach(item => {
            if (item instanceof Node) {
                container.appendChild(item);
                return;
            }
            const detailText = cleanTileText(item?.text || item);
            if (!detailText) return;
            const detail = document.createElement('span');
            detail.className = item?.className || 'governance-card-detail';
            detail.textContent = detailText;
            container.appendChild(detail);
        });
    }

    window.TDSPRuntime = Object.freeze({
        detailCacheTtlMs: DETAIL_CACHE_TTL_MS,
        isLocalPreview: isLocalPreviewHostname(window.location.hostname),
        isLocalPreviewHostname,
        loadDetail,
        loadScript,
        bindDetailPreload,
        closestTarget,
        bindActivation,
        bindIntentLoad,
        bindViewportLoad,
        scheduleIdle,
        onReady,
        setStatusClasses,
        setBinaryStatusClasses,
        formatInteger,
        formatLovelaceAmount,
        getLovelaceAmount,
        formatAdaFromLovelace,
        formatPercentageValue,
        setText,
        copyText,
        bindCopyButton,
        createSmallText,
        shortenMiddle,
        appendUniversalTileContent
    });
}());
