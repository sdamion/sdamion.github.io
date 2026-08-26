(function () {
    function getExternalHttpUrl(value) {
        try {
            const url = new URL(value, window.location.href);
            if (!['http:', 'https:'].includes(url.protocol)) return null;
            return url.origin === window.location.origin ? null : url;
        } catch {
            return null;
        }
    }

    function getYouTubeVideoId(value) {
        try {
            const url = new URL(value);
            const host = url.hostname.toLowerCase().replace(/^www\./, '');
            let videoId = '';
            if (host === 'youtu.be') {
                videoId = url.pathname.split('/').filter(Boolean)[0] || '';
            } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
                if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
                else if (/^\/(?:shorts|live|embed)\//.test(url.pathname)) {
                    videoId = url.pathname.split('/').filter(Boolean)[1] || '';
                }
            }
            return /^[0-9A-Za-z_-]{11}$/.test(videoId) ? videoId : '';
        } catch {
            return '';
        }
    }

    function createCryptoNewsList(items = [], options = {}) {
        const list = document.createElement('div');
        list.className = 'pool-delegator-list crypto-news-list';

        if (!items.length) {
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Crypto news is not available yet.';
            list.appendChild(message);
            return list;
        }

        items.forEach(item => {
            const publishedAt = Date.parse(item?.published_at || '');
            const dateText = Number.isFinite(publishedAt)
                ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(publishedAt)
                : '';
            const row = window.TDSPRuntime.createUniversalOverlayRow({
                title: String(item?.title || 'Untitled Cardano news'),
                titleClassName: 'crypto-news-list-title',
                details: [
                    [String(item?.source || 'Cardano News'), dateText].filter(Boolean).join(' · ')
                ]
            });
            const url = getExternalHttpUrl(item?.url);
            const youtubeVideoId = getYouTubeVideoId(item?.url);
            if (Number.isFinite(publishedAt)) row.dataset.sortDate = String(publishedAt);
            if (url) {
                row.tabIndex = 0;
                row.setAttribute('role', 'link');
                row.setAttribute('aria-label', youtubeVideoId
                    ? `Play YouTube video: ${item.title}`
                    : `Open news article: ${item.title}`);
                const openArticle = () => youtubeVideoId
                    ? openYouTubeVideoOverlay(youtubeVideoId, item.title, row)
                    : options.openExternalSiteWarning?.(url.href, row);
                window.TDSPRuntime?.bindActionTrigger?.(row, openArticle, {
                    datasetKey: 'articleBound',
                    errorMessage: 'News item could not be opened.'
                });
            }
            list.appendChild(row);
        });

        return list;
    }

    function openCryptoNewsOverlay(items = [], options = {}) {
        options.closeCryptoNewsOverlay?.(false);
        window.createPoolMenuOverlay?.({
            id: 'crypto-news-overlay',
            titleId: 'crypto-news-title',
            titleText: 'Crypto News',
            headerMeta: `${items.length.toLocaleString('en-US')} articles`,
            closeLabel: 'Close Crypto News',
            closeOverlay: options.closeCryptoNewsOverlay,
            returnFocus: options.returnFocus || document.activeElement,
            rootTitle: 'Crypto News',
            bodyNode: createCryptoNewsList(items, {
                openExternalSiteWarning: options.openExternalSiteWarning
            })
        });
    }

    function openYouTubeVideoOverlay(videoId, title, returnFocus = document.activeElement) {
        if (!/^[0-9A-Za-z_-]{11}$/.test(String(videoId || ''))) return;
        window.closeYouTubeVideoOverlay?.(false);

        const panel = document.createElement('section');
        panel.className = 'youtube-video-panel';
        const frame = document.createElement('div');
        frame.className = 'youtube-video-frame';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
        iframe.title = String(title || 'YouTube video');
        iframe.loading = 'eager';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        frame.appendChild(iframe);

        panel.appendChild(frame);

        window.createPoolMenuOverlay?.({
            id: 'youtube-video-overlay',
            titleId: 'youtube-video-title',
            titleText: String(title || 'YouTube Video'),
            headerMeta: 'YouTube',
            closeLabel: 'Close YouTube video',
            closeOverlay: window.closeYouTubeVideoOverlay,
            returnFocus,
            rootTitle: 'Crypto News',
            bodyNode: panel,
            closeOnBackdrop: false,
            closeOnEscape: !window.matchMedia('(max-width: 700px)').matches
        });
    }

    window.TDSPNewsOverlay = Object.freeze({
        getYouTubeVideoId,
        openCryptoNewsOverlay,
        openYouTubeVideoOverlay
    });
})();
