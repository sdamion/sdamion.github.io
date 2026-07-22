const IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const THEME_STORAGE_KEY = 'tdsp-theme';
const OVERLAY_SORT_STORAGE_KEY = 'tdsp-overlay-sort';
const PRICE_API_URL = IS_LOCAL_PREVIEW ? '/__prices_proxy__' : 'https://api.tdsp.online/api/prices';
const NEWS_API_URL = IS_LOCAL_PREVIEW ? '/__news_proxy__' : 'https://api.tdsp.online/api/news';
const POOL_API_URL = IS_LOCAL_PREVIEW ? '/__pool_proxy__' : 'https://api.tdsp.online/api/pool';
const MITHRIL_API_URL = IS_LOCAL_PREVIEW ? '/__mithril_proxy__' : 'https://api.tdsp.online/api/mithril';
const ICEBREAKER_API_URL = IS_LOCAL_PREVIEW ? '/__icebreaker_proxy__' : 'https://api.tdsp.online/api/icebreaker';
const STARCH_POOL_API_URL = IS_LOCAL_PREVIEW ? '/__starch_pools_proxy__' : 'https://api.tdsp.online/api/starch/pools';
const LEADER_SCHEDULE_API_URL = IS_LOCAL_PREVIEW ? '/__leader_schedule_proxy__' : 'https://api.tdsp.online/api/leader-schedule';
const STARCH_POOL_WEBSITES = Object.freeze({
    '4free': 'https://x.com/4FREE_stakepool',
    a3c: 'https://x.com/A3Cpool_Shawn',
    bone: 'https://x.com/bone_pool',
    drmz: 'https://x.com/drmz_web3',
    earn: 'https://x.com/earncoinpool',
    earncoin: 'https://x.com/earncoinpool',
    earncoinpool: 'https://x.com/earncoinpool',
    epc: 'https://x.com/earncoinpool',
    epoch: 'https://x.com/EPOCHpool',
    sagan: 'https://x.com/SaganPool',
    tdsp: 'https://x.com/DamionDutch',
    weed: 'https://x.com/CardanoWEED'
});
const notifiedRelayMaintenance = new Set();
let headerVisibilityObserver = null;
let poolDelegators = [];
let mithrilSigners = [];
let mithrilStatus = null;
let starchPools = [];
let starchPoolStatus = null;
let cryptoNewsItems = [];
let latestPricePayload = null;
let priceHistoryChart = null;
const PRICE_TILE_WINDOW_MS = 60 * 60 * 1000;
const PRICE_OVERLAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const PRICE_OVERLAY_BUCKET_MS = 5 * 60 * 1000;
const PRICE_CHART_INTERVALS = Object.freeze([
    { minutes: 5, label: '5 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 60, label: '1 hour' }
]);
const PRICE_TOKEN_CONFIG = Object.freeze({
    btc_usd: { elementId: 'btc-price', decimals: 0 },
    ada_usd: { elementId: 'ada-price', decimals: 3 },
    strch_usd: { elementId: 'strch-price', decimals: 12 },
    night_usd: { elementId: 'night-price', decimals: 4 }
});

function parsePriceValue(value) {
    return value === null || value === undefined || value === '' ? NaN : Number(value);
}

function formatUsdPrice(value, decimals) {
    const number = parsePriceValue(value);
    if (!Number.isFinite(number)) return 'N/A';
    return `$${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number)}`;
}

function getPriceTrendClass(samples) {
    if (!Array.isArray(samples) || samples.length < 2) return '';
    const first = Number(samples[0]?.value);
    const last = Number(samples.at(-1)?.value);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return '';
    return last >= first ? 'is-price-up' : 'is-price-down';
}

function renderPriceSparklines(history) {
    const cutoff = Date.now() - PRICE_TILE_WINDOW_MS;
    const entries = (Array.isArray(history) ? history : [])
        .map(entry => ({ ...entry, time: Date.parse(entry?.timestamp || '') }))
        .filter(entry => Number.isFinite(entry.time) && entry.time >= cutoff)
        .sort((left, right) => left.time - right.time);

    document.querySelectorAll('.price-sparkline').forEach(svg => {
        const key = svg.dataset.priceKey;
        const line = svg.querySelector('polyline');
        if (!key || !line) return;

        const samples = entries
            .map(entry => ({ time: entry.time, value: parsePriceValue(entry[key]) }))
            .filter(sample => Number.isFinite(sample.value));
        const trendClass = getPriceTrendClass(samples);
        const price = svg.closest('[data-price-key]')?.querySelector(':scope > strong');
        svg.classList.remove('is-price-up', 'is-price-down');
        price?.classList.remove('is-price-up', 'is-price-down');
        if (trendClass) {
            svg.classList.add(trendClass);
            price?.classList.add(trendClass);
        }
        if (!samples.length) {
            line.setAttribute('points', '');
            return;
        }

        const values = samples.map(sample => sample.value);
        const minimum = Math.min(...values);
        const maximum = Math.max(...values);
        const spread = maximum - minimum;
        const startTime = samples[0].time;
        const endTime = samples.at(-1).time;
        const timeSpan = Math.max(1, endTime - startTime);
        const points = samples.length === 1
            ? '0,18 100,18'
            : samples.map(sample => {
                const x = ((sample.time - startTime) / timeSpan) * 100;
                const y = spread === 0 ? 18 : 33 - (((sample.value - minimum) / spread) * 30);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(' ');
        line.setAttribute('points', points);
    });
}

// Fetch and display ADA, BTC, NIGHT, and STRCH prices asynchronously
async function fetchPrices() {
    try {
        const response = await fetch(PRICE_API_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Price API HTTP Error: ${response.status}`);
        const prices = await response.json();
        latestPricePayload = prices;
        Object.entries(PRICE_TOKEN_CONFIG).forEach(([key, config]) => {
            setText(config.elementId, formatUsdPrice(prices[key], config.decimals));
        });
        renderPriceSparklines(prices.history);
    } catch (error) {
        console.error('Price data could not be loaded', error);
        Object.values(PRICE_TOKEN_CONFIG).forEach(config => setText(config.elementId, 'N/A'));
        renderPriceSparklines([]);
    }
}

function getHistoryOhlcSamples(priceKey) {
    const cutoff = Date.now() - PRICE_OVERLAY_WINDOW_MS;
    const buckets = new Map();
    (Array.isArray(latestPricePayload?.history) ? latestPricePayload.history : []).forEach(entry => {
        const time = Date.parse(entry?.timestamp || '');
        const value = parsePriceValue(entry?.[priceKey]);
        if (!Number.isFinite(time) || time < cutoff || !Number.isFinite(value)) return;

        const bucketTime = Math.floor(time / PRICE_OVERLAY_BUCKET_MS) * PRICE_OVERLAY_BUCKET_MS;
        const candle = buckets.get(bucketTime);
        if (!candle) {
            buckets.set(bucketTime, {
                time: bucketTime,
                open: value,
                high: value,
                low: value,
                close: value,
                volume: 0,
                trades: 0
            });
            return;
        }
        candle.high = Math.max(candle.high, value);
        candle.low = Math.min(candle.low, value);
        candle.close = value;
    });
    const candles = Array.from(buckets.values()).sort((left, right) => left.time - right.time);
    candles.forEach((candle, index) => {
        if (index === 0) return;
        const previousClose = candles[index - 1].close;
        candle.open = previousClose;
        candle.high = Math.max(candle.high, previousClose);
        candle.low = Math.min(candle.low, previousClose);
    });
    return candles;
}

function aggregatePriceCandles(candles, intervalMinutes) {
    const intervalMs = Math.max(5, Number(intervalMinutes) || 5) * 60 * 1000;
    const buckets = new Map();

    candles.forEach(candle => {
        const bucketKey = Math.floor(candle.time / intervalMs) * intervalMs;
        const bucket = buckets.get(bucketKey);
        if (!bucket) {
            buckets.set(bucketKey, { ...candle, time: bucketKey });
            return;
        }
        bucket.high = Math.max(bucket.high, candle.high);
        bucket.low = Math.min(bucket.low, candle.low);
        bucket.close = candle.close;
        bucket.volume = (Number(bucket.volume) || 0) + (Number(candle.volume) || 0);
        bucket.trades = (Number(bucket.trades) || 0) + (Number(candle.trades) || 0);
    });

    return Array.from(buckets.values()).sort((left, right) => left.time - right.time);
}

function initPriceHistoryTiles() {
    document.querySelectorAll('.price-panel > [data-price-key]').forEach(tile => {
        if (tile.dataset.priceHistoryBound === 'true') return;
        const open = () => openPriceHistoryOverlay(tile);
        tile.dataset.priceHistoryBound = 'true';
        tile.addEventListener('click', open);
        tile.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            open();
        });
    });
}

function openPriceHistoryOverlay(tile) {
    closePriceHistoryOverlay(false);

    const key = tile?.dataset.priceKey || '';
    const ticker = tile?.dataset.priceTicker || 'Token';
    const priceConfig = PRICE_TOKEN_CONFIG[key] || { decimals: 4 };
    const tradingCandles = getHistoryOhlcSamples(key);
    const showTradingChart = tradingCandles.length > 1;
    const body = document.createElement('section');
    body.className = 'governance-chart-panel price-history-chart-panel';

    const current = document.createElement('strong');
    current.className = 'price-history-current';
    current.textContent = tile?.querySelector(':scope > strong')?.textContent || 'N/A';
    const trendSamples = tradingCandles.map(candle => ({ time: candle.time, value: candle.close }));
    const trendClass = getPriceTrendClass(trendSamples);
    if (trendClass) current.classList.add(trendClass);
    body.appendChild(current);

    let intervalSelector = null;
    if (showTradingChart) {
        intervalSelector = document.createElement('div');
        intervalSelector.className = 'price-history-intervals';
        intervalSelector.setAttribute('role', 'group');
        intervalSelector.setAttribute('aria-label', `${ticker} chart interval`);
        PRICE_CHART_INTERVALS.forEach(({ minutes, label }, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'price-history-interval';
            button.dataset.intervalMinutes = String(minutes);
            button.textContent = label;
            button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
            intervalSelector.appendChild(button);
        });
        body.appendChild(intervalSelector);
    }

    let canvas = null;
    if (showTradingChart) {
        const frame = document.createElement('div');
        frame.className = 'price-history-chart-frame';
        canvas = document.createElement('canvas');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `${ticker}/USD candlestick chart over the last 24 hours`);
        frame.appendChild(canvas);
        body.appendChild(frame);
    } else {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Price history is still being collected.';
        body.appendChild(message);
    }

    createPoolMenuOverlay({
        id: 'price-history-overlay',
        titleId: 'price-history-title',
        titleText: `${ticker} Price`,
        headerMeta: showTradingChart
            ? `24 hours · 5 min · ${tradingCandles.length.toLocaleString('en-US')} candles`
            : '24 hours · Price history unavailable',
        closeLabel: `Close ${ticker} price history`,
        closeOverlay: closePriceHistoryOverlay,
        returnFocus: tile,
        rootTitle: `${ticker} Price`,
        bodyNode: body
    });

    if (canvas) requestAnimationFrame(() => {
        const renderInterval = minutes => {
            const candles = aggregatePriceCandles(tradingCandles, minutes);
            renderPriceTradingChart(canvas, candles, ticker, minutes, priceConfig.decimals);
            const meta = document.querySelector('#price-history-overlay .governance-menu-header-meta');
            const option = PRICE_CHART_INTERVALS.find(item => item.minutes === minutes);
            if (meta) meta.textContent = `24 hours · ${option?.label || `${minutes} min`} · ${candles.length.toLocaleString('en-US')} candles`;
            intervalSelector?.querySelectorAll('.price-history-interval').forEach(button => {
                button.setAttribute('aria-pressed', String(Number(button.dataset.intervalMinutes) === minutes));
            });
        };

        intervalSelector?.addEventListener('click', event => {
            const button = event.target.closest('.price-history-interval');
            if (!button) return;
            renderInterval(Number(button.dataset.intervalMinutes));
        });
        renderInterval(5);
    });
}

function renderPriceTradingChart(canvas, candles, ticker, intervalMinutes = 5, decimals = 4) {
    if (typeof Chart !== 'function' || !canvas?.isConnected || candles.length < 2) return;
    if (priceHistoryChart) priceHistoryChart.destroy();

    const styles = getComputedStyle(document.documentElement);
    const mutedColor = styles.getPropertyValue('--muted').trim() || '#94a3b8';
    const lineColor = styles.getPropertyValue('--line').trim() || 'rgba(148, 163, 184, 0.25)';
    const risingColor = '#34d399';
    const fallingColor = '#f87171';
    const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
    const priceFormatter = value => {
        const number = Number(value);
        if (!Number.isFinite(number)) return 'N/A';
        return formatUsdPrice(number, decimals);
    };
    const lowest = Math.min(...candles.map(candle => candle.low));
    const highest = Math.max(...candles.map(candle => candle.high));
    const padding = Math.max(1e-12, (highest - lowest) * 0.05, Math.abs(highest) * 0.002);
    const intervalMs = Math.max(5, Number(intervalMinutes) || 5) * 60 * 1000;
    const trailingPointCount = Math.max(1, Math.ceil((60 * 60 * 1000) / intervalMs));
    const chartTimes = candles.map(candle => candle.time);
    const latestTime = chartTimes.at(-1);
    for (let index = 1; index <= trailingPointCount; index += 1) {
        chartTimes.push(latestTime + (index * intervalMs));
    }

    const candlestickPlugin = {
        id: `${String(ticker || 'token').toLowerCase()}-candlesticks`,
        afterDatasetsDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            const points = chart.getDatasetMeta(0).data;
            if (!chartArea || !scales?.y || !points.length) return;
            const candleWidth = Math.max(2, Math.min(7, (chartArea.width / chartTimes.length) * 0.72));
            ctx.save();
            ctx.beginPath();
            ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
            ctx.clip();
            candles.forEach((candle, index) => {
                const point = points[index];
                if (!point) return;
                const color = candle.close >= candle.open ? risingColor : fallingColor;
                const highY = scales.y.getPixelForValue(candle.high);
                const lowY = scales.y.getPixelForValue(candle.low);
                const openY = scales.y.getPixelForValue(candle.open);
                const closeY = scales.y.getPixelForValue(candle.close);
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(point.x, highY);
                ctx.lineTo(point.x, lowY);
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.fillRect(point.x - (candleWidth / 2), bodyTop, candleWidth, bodyHeight);
            });
            ctx.restore();
        }
    };

    priceHistoryChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: chartTimes.map(time => timeFormatter.format(time)),
            datasets: [{
                label: `${ticker}/USD`,
                data: [
                    ...candles.map(candle => candle.close),
                    ...Array(trailingPointCount).fill(null)
                ],
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                borderWidth: 0,
                pointRadius: 0,
                pointHitRadius: 8
            }]
        },
        plugins: [candlestickPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: contexts => contexts[0]?.label || '',
                        label: context => {
                            const candle = candles[context.dataIndex];
                            return [
                                `Open ${priceFormatter(candle.open)}`,
                                `High ${priceFormatter(candle.high)}`,
                                `Low ${priceFormatter(candle.low)}`,
                                `Close ${priceFormatter(candle.close)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: mutedColor, maxTicksLimit: 8, maxRotation: 0 },
                    grid: { color: lineColor }
                },
                y: {
                    min: lowest - padding,
                    max: highest + padding,
                    ticks: { color: mutedColor, callback: priceFormatter },
                    grid: { color: lineColor }
                }
            }
        }
    });
}

function closePriceHistoryOverlay(restoreFocus = true) {
    if (priceHistoryChart) {
        priceHistoryChart.destroy();
        priceHistoryChart = null;
    }
    closePoolMenuOverlay('price-history-overlay', restoreFocus);
}

function createNewsGroup(items, duplicate = false) {
    const group = document.createElement('div');
    group.className = 'crypto-news-group';
    if (duplicate) group.setAttribute('aria-hidden', 'true');

    items.forEach(item => {
        const url = getExternalHttpUrl(item?.url);
        const title = String(item?.title || '').trim();
        if (!url || !title) return;

        const link = document.createElement('a');
        link.className = 'crypto-news-item';
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const youtubeVideoId = getYouTubeVideoId(url.href);
        if (youtubeVideoId) {
            link.dataset.youtubeVideoId = youtubeVideoId;
            link.dataset.youtubeVideoTitle = title;
        }
        if (duplicate) link.tabIndex = -1;

        const source = document.createElement('strong');
        source.textContent = String(item?.source || 'Cardano News').trim();
        const headline = document.createElement('span');
        headline.textContent = title;
        link.append(source, document.createTextNode(' · '), headline);
        group.append(link);
    });

    return group;
}

function updateCryptoNewsTickerSpeed() {
    const track = document.getElementById('crypto-news-track');
    const group = track?.querySelector('.crypto-news-group:not([aria-hidden="true"])');
    if (!track || !group) return;

    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const pixelsPerSecond = isMobile ? 3000 : 1900;
    const minimumDuration = isMobile ? 6 : 8;
    const maximumDuration = isMobile ? 16 : 26;
    const durationSeconds = Math.max(minimumDuration, Math.min(maximumDuration, group.scrollWidth / pixelsPerSecond));
    track.style.setProperty('--crypto-news-duration', `${durationSeconds.toFixed(2)}s`);
}

async function fetchCryptoNews() {
    const track = document.getElementById('crypto-news-track');
    if (!track) return;

    try {
        const response = await fetch(NEWS_API_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`News API HTTP Error: ${response.status}`);
        const payload = await response.json();
        const currentYear = new Date().getUTCFullYear();
        const items = (Array.isArray(payload?.items) ? payload.items : [])
            .filter(item => {
                const publishedAt = Date.parse(item?.published_at || '');
                return Number.isFinite(publishedAt) && new Date(publishedAt).getUTCFullYear() === currentYear;
            })
            .slice(0, 60);
        if (!items.length) throw new Error('News API returned no Cardano headlines');

        cryptoNewsItems = items;
        track.replaceChildren(createNewsGroup(items), createNewsGroup(items, true));
        track.classList.add('is-scrolling');
        requestAnimationFrame(updateCryptoNewsTickerSpeed);
    } catch (error) {
        console.error('Crypto news could not be loaded', error);
        const message = document.createElement('span');
        message.className = 'crypto-news-message';
        message.textContent = 'Cardano news temporarily unavailable';
        track.replaceChildren(message);
        track.classList.remove('is-scrolling');
    }
}

// Fetch prices on page load and set up auto-update
// Initialize UI behaviors and price fetching when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initExternalLinkWarnings();
    initThemeToggle();
    initPoolCopyButtons();
    initPoolDelegatorsCard();
    initMithrilCard();
    initStarchPoolCard();
    initPriceHistoryTiles();
    initCryptoNewsTicker();
    fetchPrices();
    fetchCryptoNews();
    fetchPoolStatus();
    fetchMithrilStatus();
    fetchIcebreakerStatus();
    fetchStarchPoolStatus();
    fetchLeaderSchedule();
    setInterval(fetchPrices, 30000);
    setInterval(fetchCryptoNews, 300000);
    setInterval(fetchPoolStatus, 300000);
    setInterval(fetchMithrilStatus, 300000);
    setInterval(fetchIcebreakerStatus, 300000);
    setInterval(fetchStarchPoolStatus, 300000);
    setInterval(fetchLeaderSchedule, 300000);
    initUI();
});

function initCryptoNewsTicker() {
    const button = document.getElementById('crypto-news-open');
    if (!button || button.dataset.newsBound === 'true') return;
    button.dataset.newsBound = 'true';
    button.addEventListener('click', () => openCryptoNewsOverlay(button));
    window.addEventListener('resize', updateCryptoNewsTickerSpeed, { passive: true });
}

function openCryptoNewsOverlay(returnFocus = document.activeElement) {
    closeCryptoNewsOverlay(false);
    createPoolMenuOverlay({
        id: 'crypto-news-overlay',
        titleId: 'crypto-news-title',
        titleText: 'Crypto News',
        headerMeta: `${cryptoNewsItems.length.toLocaleString('en-US')} articles`,
        closeLabel: 'Close Crypto News',
        closeOverlay: closeCryptoNewsOverlay,
        returnFocus,
        rootTitle: 'Crypto News',
        bodyNode: createCryptoNewsList()
    });
}

function closeCryptoNewsOverlay(restoreFocus = true) {
    closePoolMenuOverlay('crypto-news-overlay', restoreFocus);
}

function createCryptoNewsList() {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list crypto-news-list';

    if (!cryptoNewsItems.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Crypto news is not available yet.';
        list.appendChild(message);
        return list;
    }

    cryptoNewsItems.forEach((item, index) => {
        const publishedAt = Date.parse(item?.published_at || '');
        const dateText = Number.isFinite(publishedAt)
            ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(publishedAt)
            : '';
        const row = createPoolOverlayRow({
            index,
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
                : openExternalSiteWarning(url.href, row);
            row.addEventListener('click', openArticle);
            row.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openArticle();
            });
        }
        list.appendChild(row);
    });

    return list;
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

function openYouTubeVideoOverlay(videoId, title, returnFocus = document.activeElement) {
    if (!/^[0-9A-Za-z_-]{11}$/.test(String(videoId || ''))) return;
    closeYouTubeVideoOverlay(false);

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

    const closeVideo = document.createElement('button');
    closeVideo.type = 'button';
    closeVideo.className = 'youtube-video-close';
    closeVideo.textContent = 'Close video';
    closeVideo.addEventListener('click', closeYouTubeVideoOverlay);
    panel.append(frame, closeVideo);

    createPoolMenuOverlay({
        id: 'youtube-video-overlay',
        titleId: 'youtube-video-title',
        titleText: String(title || 'YouTube Video'),
        headerMeta: 'YouTube',
        closeLabel: 'Close YouTube video',
        closeOverlay: closeYouTubeVideoOverlay,
        returnFocus,
        rootTitle: 'Crypto News',
        bodyNode: panel,
        showHeaderActions: false,
        closeOnBackdrop: false,
        closeOnEscape: !window.matchMedia('(max-width: 700px)').matches
    });
}

function closeYouTubeVideoOverlay(restoreFocus = true) {
    closePoolMenuOverlay('youtube-video-overlay', restoreFocus);
}

let pendingExternalUrl = '';
let externalLinkReturnFocus = null;

function getExternalHttpUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        return url.origin === window.location.origin ? null : url;
    } catch {
        return null;
    }
}

function initExternalLinkWarnings() {
    if (document.documentElement.dataset.externalLinksBound === 'true') return;
    document.documentElement.dataset.externalLinksBound = 'true';
    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link) return;
        const youtubeVideoId = link.dataset.youtubeVideoId;
        if (youtubeVideoId) {
            event.preventDefault();
            event.stopImmediatePropagation();
            openYouTubeVideoOverlay(youtubeVideoId, link.dataset.youtubeVideoTitle, link);
            return;
        }
        const url = getExternalHttpUrl(link.href);
        if (!url) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        openExternalSiteWarning(url.href, link);
    }, true);
}

function getExternalSiteWarning() {
    let overlay = document.getElementById('external-site-warning');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'external-site-warning';
    overlay.className = 'external-site-warning';
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');

    const dialog = document.createElement('article');
    dialog.className = 'external-site-warning-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'external-site-warning-title');
    dialog.setAttribute('aria-describedby', 'external-site-warning-message');

    const title = document.createElement('h2');
    title.id = 'external-site-warning-title';
    title.textContent = "You're opening an external site";

    const message = document.createElement('p');
    message.id = 'external-site-warning-message';
    message.textContent = 'This link will open in a new tab.';

    const host = document.createElement('strong');
    host.className = 'external-site-warning-host';
    host.dataset.externalSiteHost = 'true';

    const urlRow = document.createElement('div');
    urlRow.className = 'external-site-warning-url';

    const copyUrl = document.createElement('button');
    copyUrl.type = 'button';
    copyUrl.className = 'external-site-warning-copy';
    copyUrl.textContent = 'Copy';
    copyUrl.setAttribute('aria-label', 'Copy external URL');
    copyUrl.addEventListener('click', async () => {
        if (!pendingExternalUrl) return;
        try {
            await copyText(pendingExternalUrl);
            copyUrl.textContent = 'Copied';
        } catch {
            copyUrl.textContent = 'Copy failed';
        }
        setTimeout(() => {
            copyUrl.textContent = 'Copy';
        }, 1400);
    });
    urlRow.append(host, copyUrl);

    const actions = document.createElement('div');
    actions.className = 'external-site-warning-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'external-site-warning-cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', closeExternalSiteWarning);

    const proceed = document.createElement('button');
    proceed.type = 'button';
    proceed.className = 'external-site-warning-continue';
    proceed.textContent = 'Continue';
    proceed.addEventListener('click', () => {
        const url = pendingExternalUrl;
        closeExternalSiteWarning(false);
        if (!url) return;
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (opened) opened.opener = null;
    });

    actions.append(cancel, proceed);
    dialog.append(title, message, urlRow, actions);
    overlay.appendChild(dialog);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeExternalSiteWarning();
    });
    document.body.appendChild(overlay);
    return overlay;
}

function openExternalSiteWarning(value, returnFocus = document.activeElement) {
    const url = getExternalHttpUrl(value);
    if (!url) return false;

    const overlay = getExternalSiteWarning();
    const host = overlay.querySelector('[data-external-site-host]');
    const copy = overlay.querySelector('.external-site-warning-copy');
    if (host) host.textContent = url.href;
    if (copy) copy.textContent = 'Copy';
    pendingExternalUrl = url.href;
    externalLinkReturnFocus = returnFocus;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.querySelector('.external-site-warning-cancel')?.focus();
    return true;
}

function closeExternalSiteWarning(restoreFocus = true) {
    const overlay = document.getElementById('external-site-warning');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    pendingExternalUrl = '';
    if (restoreFocus && externalLinkReturnFocus?.isConnected) externalLinkReturnFocus.focus();
    externalLinkReturnFocus = null;
}

document.addEventListener('keydown', event => {
    const overlay = document.getElementById('external-site-warning');
    if (event.key === 'Escape' && overlay && !overlay.hidden) {
        event.preventDefault();
        closeExternalSiteWarning();
    }
});

document.addEventListener('tdsp:content-loaded', () => {
    initUI();
});

function initUI() {
    setupRevealOnScroll();
    setupHeaderVisibility();
}

async function fetchPoolStatus() {
    const summaryEl = document.getElementById('pool-summary');
    const relaysEl = document.getElementById('pool-relays');

    if (!summaryEl || !relaysEl) return;

    try {
        const response = await fetch(POOL_API_URL);
        if (!response.ok) throw new Error(`Pool API HTTP Error: ${response.status}`);
        renderPoolStatus(await response.json());
    } catch (error) {
        setRelayCardStatus(null, null);
        relaysEl.textContent = '';
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Pool data could not be loaded.';
        relaysEl.appendChild(message);
    }
}

async function fetchMithrilStatus() {
    try {
        const response = await fetch(MITHRIL_API_URL);
        if (!response.ok) throw new Error(`Mithril API HTTP Error: ${response.status}`);
        renderMithrilStatus(await response.json());
    } catch (error) {
        mithrilStatus = null;
        mithrilSigners = [];
        setMithrilCardStatus('N/A', null);
    }
}

function renderMithrilStatus(payload) {
    mithrilStatus = payload;
    mithrilSigners = Array.isArray(payload?.signers) ? [...payload.signers] : [];
    const active = payload?.tdsp?.active === true;
    setMithrilCardStatus(active ? 'Active' : 'Inactive', active);
}

function setMithrilCardStatus(label, active) {
    const status = document.getElementById('pool-mithril-status');
    if (!status) return;

    status.textContent = label;
    status.classList.toggle('is-active', active === true);
    status.classList.toggle('is-inactive', active === false);
}

async function fetchIcebreakerStatus() {
    try {
        const response = await fetch(ICEBREAKER_API_URL);
        if (!response.ok) throw new Error(`Icebreaker API HTTP Error: ${response.status}`);
        const payload = await response.json();
        const active = payload?.active;
        setIcebreakerCardStatus(active === true ? 'Active' : active === false ? 'Inactive' : 'N/A', active);
    } catch (error) {
        setIcebreakerCardStatus('N/A', null);
    }
}

function setIcebreakerCardStatus(label, active) {
    const status = document.getElementById('pool-icebreaker-status');
    if (!status) return;

    status.textContent = label;
    status.classList.toggle('is-active', active === true);
    status.classList.toggle('is-inactive', active === false);
}

async function fetchStarchPoolStatus() {
    try {
        const response = await fetch(STARCH_POOL_API_URL);
        if (!response.ok) throw new Error(`Starch pool API HTTP Error: ${response.status}`);
        renderStarchPoolStatus(await response.json());
    } catch (error) {
        starchPoolStatus = null;
        starchPools = [];
        setStarchPoolCardStatus('N/A', null);
    }
}

function renderStarchPoolStatus(payload) {
    starchPoolStatus = payload;
    starchPools = (Array.isArray(payload?.pools) ? payload.pools : [])
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
    const active = payload?.tdsp?.active === true || Number(payload?.tdsp?.status) === 1;
    setStarchPoolCardStatus(active ? 'Active' : 'Inactive', active);
}

function setStarchPoolCardStatus(label, active) {
    const status = document.getElementById('pool-starch-status');
    if (!status) return;

    status.textContent = label;
    status.classList.toggle('is-active', active === true);
    status.classList.toggle('is-inactive', active === false);
}

async function fetchLeaderSchedule() {
    const scheduleEl = document.getElementById('leader-schedule');
    if (!scheduleEl) return;

    try {
        const response = await fetch(LEADER_SCHEDULE_API_URL);
        if (!response.ok) throw new Error(`Leader schedule HTTP Error: ${response.status}`);
        renderLeaderSchedule(await response.json());
    } catch (error) {
        renderLeaderScheduleError();
    }
}

function renderLeaderSchedule(schedule) {
    const leadership = Array.isArray(schedule?.leadership) ? schedule.leadership : [];
    setText('leader-schedule-count', formatInteger(schedule?.slotCount ?? leadership.length));
    setText('leader-schedule-meta', `Possible blocks · Epoch ${formatInteger(schedule?.epoch)}`);
}

function renderLeaderScheduleError() {
    setText('leader-schedule-count', 'N/A');
    setText('leader-schedule-meta', 'Possible blocks · Epoch N/A');
}

function renderPoolStatus(pool) {
    poolDelegators = Array.isArray(pool?.delegators) ? [...pool.delegators] : [];
    setText('pool-delegators', formatInteger(pool?.delegator_count));
    setText('pool-live-stake', formatAdaFromLovelace(pool?.live_stake_lovelace));
    setText('pool-pledge', formatAdaFromLovelace(pool?.pledge_lovelace ?? pool?.raw?.pledge));
    setText('pool-margin', formatPoolMargin(pool?.margin ?? pool?.raw?.margin));
    setText('pool-fixed-cost', formatAdaFromLovelace(pool?.fixed_cost_lovelace ?? pool?.raw?.fixed_cost));
    setText('pool-id', pool?.pool_id || 'N/A');

    const relays = Array.isArray(pool?.relays) ? pool.relays : [];
    const upCount = relays.filter(relay => relay.up === true).length;
    setRelayCardStatus(relays.length ? upCount : null, relays.length || null);
    setText('pool-last-updated', formatTimestamp(pool?.updated_at));

    const relaysEl = document.getElementById('pool-relays');
    if (!relaysEl) return;

    relaysEl.textContent = '';
    if (!relays.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'No relay data available.';
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

function setRelayCardStatus(activeCount, relayCount) {
    const status = document.getElementById('pool-relays-up');
    const meta = document.getElementById('pool-relays-meta');
    if (!status || !meta) return;

    status.textContent = activeCount === null ? 'N/A' : activeCount > 0 ? 'Active' : 'Inactive';
    meta.textContent = activeCount === null || relayCount === null
        ? 'Relay N/A'
        : `Relay ${activeCount}/${relayCount}`;
    status.classList.toggle('is-active', activeCount !== null && activeCount >= 2);
    status.classList.toggle('is-warning', activeCount === 1);
    status.classList.toggle('is-inactive', activeCount === 0);
}

function initPoolDelegatorsCard() {
    const card = document.getElementById('pool-delegators-card');
    if (!card || card.dataset.delegatorsBound === 'true') return;

    card.dataset.delegatorsBound = 'true';
    card.addEventListener('click', openPoolDelegatorsOverlay);
    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openPoolDelegatorsOverlay();
    });
}

function openPoolDelegatorsOverlay() {
    closePoolDelegatorsOverlay(false);

    createPoolMenuOverlay({
        id: 'pool-delegators-overlay',
        titleId: 'pool-delegators-title',
        titleText: 'Pool Delegators',
        headerMeta: `${poolDelegators.length.toLocaleString('en-US')} delegators`,
        closeLabel: 'Close pool delegators',
        closeOverlay: closePoolDelegatorsOverlay,
        returnFocus: document.getElementById('pool-delegators-card'),
        rootTitle: 'Delegators',
        bodyNode: createPoolDelegatorsList()
    });
}

function closePoolDelegatorsOverlay(restoreFocus = true) {
    closePoolMenuOverlay('pool-delegators-overlay', restoreFocus);
}

function initMithrilCard() {
    const card = document.getElementById('pool-mithril-card');
    if (!card || card.dataset.mithrilBound === 'true') return;

    card.dataset.mithrilBound = 'true';
    card.addEventListener('click', openMithrilSignersOverlay);
    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openMithrilSignersOverlay();
    });
}

function openMithrilSignersOverlay() {
    closeMithrilSignersOverlay(false);

    const signingEpoch = Number(mithrilStatus?.signing_at_epoch);
    createPoolMenuOverlay({
        id: 'pool-mithril-overlay',
        titleId: 'pool-mithril-title',
        titleText: 'Active Mithril Signers',
        headerMeta: `${mithrilSigners.length.toLocaleString('en-US')} signers${Number.isFinite(signingEpoch) ? ` · Signing epoch ${signingEpoch.toLocaleString('en-US')}` : ''}`,
        closeLabel: 'Close active Mithril signers',
        closeOverlay: closeMithrilSignersOverlay,
        returnFocus: document.getElementById('pool-mithril-card'),
        rootTitle: 'Mithril',
        bodyNode: createMithrilSignersList()
    });
}

function closeMithrilSignersOverlay(restoreFocus = true) {
    closePoolMenuOverlay('pool-mithril-overlay', restoreFocus);
}

function initStarchPoolCard() {
    ['pool-starch-status-card', 'starch-pools-card'].forEach(cardId => {
        const card = document.getElementById(cardId);
        if (!card || card.dataset.starchPoolBound === 'true') return;

        const open = () => openStarchPoolsOverlay(card);
        card.dataset.starchPoolBound = 'true';
        card.addEventListener('click', open);
        card.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            open();
        });
    });
}

function openStarchPoolsOverlay(returnFocus = document.activeElement) {
    closeStarchPoolsOverlay(false);

    const epoch = Number(starchPoolStatus?.epoch);
    createPoolMenuOverlay({
        id: 'pool-starch-overlay',
        titleId: 'pool-starch-title',
        titleText: 'Starch Pools',
        headerMeta: `${starchPools.length.toLocaleString('en-US')} pools${Number.isFinite(epoch) ? ` · Epoch ${epoch.toLocaleString('en-US')}` : ''}`,
        closeLabel: 'Close Starch pools',
        closeOverlay: closeStarchPoolsOverlay,
        returnFocus,
        rootTitle: 'Starch Pools',
        bodyNode: createStarchPoolsList()
    });
}

function closeStarchPoolsOverlay(restoreFocus = true) {
    closePoolMenuOverlay('pool-starch-overlay', restoreFocus);
}

function createPoolMenuOverlay({
    id,
    titleId,
    titleText,
    headerMeta,
    closeLabel,
    closeOverlay,
    returnFocus,
    rootTitle,
    bodyNode,
    showHeaderActions = true,
    closeOnBackdrop = true,
    closeOnEscape = true
}) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'governance-overlay governance-menu-overlay governance-drep-overlay';
    overlay.style.zIndex = String(getNextPoolOverlayZIndex());
    overlay.governanceReturnFocus = returnFocus;
    overlay.governanceCloseOverlay = closeOverlay;
    overlay.governanceCloseOnEscape = closeOnEscape;
    overlay.addEventListener('click', event => {
        if (closeOnBackdrop && event.target === overlay) closeOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog governance-drep-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', titleId);

    const header = document.createElement('header');
    header.className = 'overlay-dialog-header';

    const headerCopy = document.createElement('div');
    headerCopy.className = 'overlay-dialog-header-copy';

    const title = document.createElement('h3');
    title.id = titleId;
    title.className = 'governance-drep-title';
    title.textContent = titleText;

    const meta = document.createElement('span');
    meta.className = 'governance-menu-header-meta';
    meta.textContent = headerMeta;

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.textContent = '<';
    close.setAttribute('aria-label', closeLabel);
    close.title = closeLabel;
    close.addEventListener('click', closeOverlay);

    const back = document.createElement('button');
    back.className = 'governance-back-to-root';
    back.type = 'button';
    back.textContent = '<<';
    back.setAttribute('aria-label', `Back to ${rootTitle || titleText}`);
    back.title = `Back to ${rootTitle || titleText}`;
    back.addEventListener('click', closeOverlay);

    const headerActions = document.createElement('div');
    headerActions.className = 'overlay-dialog-header-actions';
    headerActions.append(back, close);

    headerCopy.append(title, meta);
    header.appendChild(headerCopy);
    if (showHeaderActions) header.appendChild(headerActions);

    const body = document.createElement('div');
    body.className = 'overlay-dialog-body';
    body.appendChild(bodyNode);
    installOverlaySearch(body);

    dialog.append(header, body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    if (typeof syncGovernanceMenuOverlayAccessibility === 'function') {
        syncGovernanceMenuOverlayAccessibility();
    }
    close.focus();
}

function normalizeOverlaySearchText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase();
}

function getOverlaySearchCards(body) {
    return Array.from(body.querySelectorAll('.governance-menu-card'))
        .filter(card => !card.parentElement?.closest('.governance-menu-card'));
}

function getOverlaySortSignature(options) {
    return options.map(option => option.value).join('|');
}

function getStoredOverlaySort(options = []) {
    try {
        const stored = localStorage.getItem(OVERLAY_SORT_STORAGE_KEY) || '';
        if (!stored.startsWith('{')) return stored;
        const preferences = JSON.parse(stored);
        return preferences?.[getOverlaySortSignature(options)] || '';
    } catch {
        return '';
    }
}

function storeOverlaySort(options, value) {
    try {
        const stored = localStorage.getItem(OVERLAY_SORT_STORAGE_KEY) || '';
        let preferences = {};
        if (stored.startsWith('{')) {
            try {
                preferences = JSON.parse(stored) || {};
            } catch {}
        }
        preferences[getOverlaySortSignature(options)] = value;
        localStorage.setItem(OVERLAY_SORT_STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
}

const OVERLAY_SORT_DEFINITIONS = Object.freeze([
    { value: 'newest', label: 'Newest', key: 'sortDate', direction: -1, type: 'number' },
    { value: 'oldest', label: 'Oldest', key: 'sortDate', direction: 1, type: 'number' },
    { value: 'ask-desc', label: 'Most ask', key: 'sortAsk', direction: -1, type: 'number' },
    { value: 'ask-asc', label: 'Less ask', key: 'sortAsk', direction: 1, type: 'number' },
    { value: 'amount-desc', label: 'Highest amount', key: 'sortAmount', direction: -1, type: 'number' },
    { value: 'amount-asc', label: 'Lowest amount', key: 'sortAmount', direction: 1, type: 'number' },
    { value: 'power-desc', label: 'Most power', key: 'sortPower', direction: -1, type: 'number' },
    { value: 'power-asc', label: 'Least power', key: 'sortPower', direction: 1, type: 'number' },
    { value: 'delegators-desc', label: 'Most delegators', key: 'sortDelegators', direction: -1, type: 'number' },
    { value: 'delegators-asc', label: 'Least delegators', key: 'sortDelegators', direction: 1, type: 'number' },
    { value: 'full-cloud-first', label: 'Full cloud first', key: 'sortFullCloud', direction: -1, type: 'number' },
    { value: 'partial-cloud-first', label: 'Partial cloud first', key: 'sortPartialCloud', direction: -1, type: 'number' },
    { value: 'no-cloud-first', label: 'No cloud first', key: 'sortNoCloud', direction: -1, type: 'number' },
    { value: 'balance-desc', label: 'Highest balance', key: 'sortBalance', direction: -1, type: 'number' },
    { value: 'balance-asc', label: 'Lowest balance', key: 'sortBalance', direction: 1, type: 'number' },
    { value: 'blocks-desc', label: 'Most blocks', key: 'sortBlocks', direction: -1, type: 'number' },
    { value: 'blocks-asc', label: 'Least blocks', key: 'sortBlocks', direction: 1, type: 'number' },
    { value: 'epoch-desc', label: 'Latest epoch', key: 'sortEpoch', direction: -1, type: 'number' },
    { value: 'epoch-asc', label: 'Earliest epoch', key: 'sortEpoch', direction: 1, type: 'number' },
    { value: 'active-first', label: 'Active first', key: 'sortStatus', direction: -1, type: 'number' },
    { value: 'inactive-first', label: 'Inactive first', key: 'sortStatus', direction: 1, type: 'number' },
    { value: 'name-asc', label: 'Name A-Z', key: 'sortName', direction: 1, type: 'text' },
    { value: 'name-desc', label: 'Name Z-A', key: 'sortName', direction: -1, type: 'text' }
]);

function getOverlayCardSortName(card) {
    const preferred = card.querySelector([
        '.governance-title',
        '.crypto-news-list-title',
        '.pool-delegator-handle',
        '.governance-cc-member-hash',
        '.governance-no-vote-name'
    ].join(','));
    return normalizeOverlaySearchText(preferred?.textContent || card.textContent).trim();
}

function getRelevantOverlaySortOptions(cards) {
    cards.forEach(card => {
        if (!card.dataset.sortName) card.dataset.sortName = getOverlayCardSortName(card);
    });
    return OVERLAY_SORT_DEFINITIONS.filter(definition => {
        const values = new Set(cards
            .map(card => String(card.dataset[definition.key] || ''))
            .filter(Boolean));
        return values.size > 1;
    });
}

function getOverlayCardSortNumber(card, key) {
    const value = Number(card?.dataset?.[key]);
    return Number.isFinite(value) ? value : null;
}

function sortOverlayCards(body, cards, mode) {
    if (!cards.length) return;
    if (!Number.isFinite(body.overlaySortSequence)) body.overlaySortSequence = 0;

    cards.forEach(card => {
        if (card.dataset.overlaySortIndex !== undefined) return;
        card.dataset.overlaySortIndex = String(body.overlaySortSequence);
        body.overlaySortSequence += 1;
    });

    const cardsByParent = new Map();
    cards.forEach(card => {
        const siblings = cardsByParent.get(card.parentElement) || [];
        siblings.push(card);
        cardsByParent.set(card.parentElement, siblings);
    });

    const definition = OVERLAY_SORT_DEFINITIONS.find(item => item.value === mode);
    if (!definition) return;
    cardsByParent.forEach((siblings, parent) => {
        const sorted = [...siblings].sort((left, right) => {
            if (definition.type === 'text') {
                const result = String(left.dataset[definition.key] || '').localeCompare(
                    String(right.dataset[definition.key] || ''),
                    'en',
                    { sensitivity: 'base', numeric: true }
                );
                return result * definition.direction
                    || Number(left.dataset.overlaySortIndex) - Number(right.dataset.overlaySortIndex);
            }

            const leftValue = getOverlayCardSortNumber(left, definition.key);
            const rightValue = getOverlayCardSortNumber(right, definition.key);
            const leftHasValue = leftValue !== null;
            const rightHasValue = rightValue !== null;

            if (leftHasValue !== rightHasValue) return leftHasValue ? -1 : 1;
            if (leftHasValue && leftValue !== rightValue) return (leftValue - rightValue) * definition.direction;
            return Number(left.dataset.overlaySortIndex) - Number(right.dataset.overlaySortIndex);
        });

        if (siblings.every((card, index) => card === sorted[index])) return;
        sorted.forEach(card => parent.appendChild(card));
    });
}

function installOverlaySearch(body) {
    if (!body || body.querySelector(':scope > .overlay-search-bar')) return;

    const searchBar = document.createElement('div');
    searchBar.className = 'overlay-search-bar';
    searchBar.hidden = true;

    const input = document.createElement('input');
    input.className = 'overlay-search-input';
    input.type = 'search';
    input.placeholder = 'Search by name, ID, title or status';
    input.setAttribute('aria-label', 'Search this overlay');
    input.autocomplete = 'off';
    input.autocapitalize = 'none';
    input.spellcheck = false;

    const sort = document.createElement('select');
    sort.className = 'overlay-sort-select';
    sort.setAttribute('aria-label', 'Sort overlay results');
    const initialCards = getOverlaySearchCards(body);
    const sortOptions = getRelevantOverlaySortOptions(initialCards);
    sortOptions.forEach(({ value, label }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        sort.appendChild(option);
    });
    const storedSort = getStoredOverlaySort(sortOptions);
    sort.value = sortOptions.some(option => option.value === storedSort)
        ? storedSort
        : sortOptions[0]?.value || '';
    sort.hidden = sortOptions.length < 2;

    const count = document.createElement('span');
    count.className = 'overlay-search-count';
    count.setAttribute('aria-live', 'polite');

    const empty = document.createElement('p');
    empty.className = 'overlay-search-empty';
    empty.textContent = 'No matching results.';
    empty.hidden = true;

    searchBar.append(input, sort, count);
    body.prepend(searchBar, empty);

    const applySearch = () => {
        const cards = getOverlaySearchCards(body);
        const relevantOptions = getRelevantOverlaySortOptions(cards);
        const currentOptionValues = Array.from(sort.options, option => option.value).join('|');
        if (currentOptionValues !== getOverlaySortSignature(relevantOptions)) {
            const selected = sort.value || getStoredOverlaySort(relevantOptions);
            sort.replaceChildren(...relevantOptions.map(({ value, label }) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                return option;
            }));
            sort.value = relevantOptions.some(option => option.value === selected)
                ? selected
                : relevantOptions[0]?.value || '';
        }
        sort.hidden = relevantOptions.length < 2;
        sortOverlayCards(body, cards, sort.value);
        const terms = normalizeOverlaySearchText(input.value).trim().split(/\s+/).filter(Boolean);
        let visible = 0;

        cards.forEach(card => {
            const searchableText = normalizeOverlaySearchText(
                `${card.textContent || ''} ${card.dataset.searchText || ''}`
            );
            const matches = terms.every(term => searchableText.includes(term));
            card.hidden = !matches;
            if (matches) visible += 1;
        });

        searchBar.hidden = cards.length < 2;
        const countText = `${visible.toLocaleString('en-US')} / ${cards.length.toLocaleString('en-US')}`;
        if (count.textContent !== countText) count.textContent = countText;
        empty.hidden = cards.length < 2 || !terms.length || visible > 0;
    };

    input.addEventListener('input', applySearch);
    input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !input.value) return;
        event.preventDefault();
        event.stopPropagation();
        input.value = '';
        applySearch();
    });
    sort.addEventListener('change', () => {
        storeOverlaySort(getRelevantOverlaySortOptions(getOverlaySearchCards(body)), sort.value);
        applySearch();
    });

    let refreshQueued = false;
    const observer = new MutationObserver(() => {
        if (refreshQueued) return;
        refreshQueued = true;
        queueMicrotask(() => {
            refreshQueued = false;
            applySearch();
        });
    });
    observer.observe(body, { childList: true, subtree: true });
    body.overlaySearchObserver = observer;
    applySearch();
}

function getNextPoolOverlayZIndex() {
    const currentHighest = Array.from(document.querySelectorAll('.governance-menu-overlay'))
        .reduce((highest, overlay) => {
            const zIndex = Number.parseInt(getComputedStyle(overlay).zIndex, 10);
            return Number.isFinite(zIndex) ? Math.max(highest, zIndex) : highest;
        }, 3000);
    return currentHighest + 100;
}

function closePoolMenuOverlay(id, restoreFocus = true) {
    const overlay = document.getElementById(id);
    const returnFocus = overlay?.governanceReturnFocus;
    overlay?.remove();
    if (typeof syncGovernanceMenuOverlayAccessibility === 'function') {
        syncGovernanceMenuOverlayAccessibility();
    }
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
}

function createStarchPoolsList() {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list';

    if (!starchPools.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Starch pool data is not available yet.';
        list.appendChild(message);
        return list;
    }

    starchPools.forEach((pool, index) => {
        const row = createPoolOverlayRow({
            index,
            title: pool?.name || 'No Name',
            titleClassName: 'pool-delegator-handle',
            details: [String(pool?.ticker || '').toUpperCase() || 'N/A']
        });
        const poolName = String(pool?.name || pool?.ticker || 'Starch pool');
        const openWebsite = () => openExternalSiteWarning(getStarchPoolWebsite(pool), row);

        row.classList.add('starch-pool-link-card');
        row.tabIndex = 0;
        row.setAttribute('role', 'link');
        row.setAttribute('aria-label', `Open ${poolName} website`);
        row.addEventListener('click', openWebsite);
        row.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openWebsite();
        });
        list.appendChild(row);
    });

    return list;
}

function getStarchPoolWebsite(pool) {
    const suppliedWebsite = pool?.website || pool?.homepage || pool?.url;
    if (getExternalHttpUrl(suppliedWebsite)) return suppliedWebsite;

    const ticker = String(pool?.ticker || '').trim().toLowerCase();
    const normalizedName = String(pool?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedName.includes('earncoin')) return 'https://x.com/earncoinpool';
    return STARCH_POOL_WEBSITES[ticker] || 'https://starch.one/';
}

function createMithrilSignersList() {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list';

    if (!mithrilSigners.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Active Mithril signer data is not available yet.';
        list.appendChild(message);
        return list;
    }

    mithrilSigners.forEach((signer, index) => {
        const poolId = String(signer?.pool_id || '');
        const idLine = document.createElement('div');
        idLine.className = 'pool-delegator-address-line';

        const id = document.createElement('span');
        id.className = 'pool-delegator-address';
        id.textContent = poolId ? shortenStakeAddress(poolId) : 'Unknown pool';
        id.title = poolId;
        idLine.appendChild(id);

        if (poolId) {
            const copy = document.createElement('button');
            copy.className = 'pool-delegator-copy-button';
            copy.type = 'button';
            copy.textContent = '⧉';
            copy.setAttribute('aria-label', `Copy Mithril signer pool ID ${index + 1}`);
            copy.addEventListener('click', async () => {
                const original = copy.textContent;
                try {
                    await copyText(poolId);
                    copy.textContent = 'Copied';
                } catch (error) {
                    copy.textContent = 'Copy failed';
                }
                setTimeout(() => {
                    copy.textContent = original;
                }, 1400);
            });
            idLine.appendChild(copy);
        }

        const stake = document.createElement('span');
        stake.className = 'pool-delegator-amount';
        stake.textContent = formatDelegatorAda(getMithrilSignerStake(signer));

        const row = createPoolOverlayRow({
            index,
            title: signer?.display_name || signer?.name || 'No Name',
            titleClassName: 'pool-delegator-handle',
            details: [idLine, stake]
        });
        row.dataset.sortAmount = getMithrilSignerStake(signer).toString();
        list.appendChild(row);
    });

    return list;
}

function getMithrilSignerStake(signer) {
    try {
        return BigInt(String(signer?.stake_lovelace ?? '0'));
    } catch (error) {
        return 0n;
    }
}

function createPoolDelegatorsList() {
    const list = document.createElement('div');
    list.className = 'pool-delegator-list';

    if (!poolDelegators.length) {
        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'Delegator details are not available yet.';
        list.appendChild(message);
        return list;
    }

    const sortedDelegators = [...poolDelegators].sort((left, right) => {
        const leftAmount = getDelegatorAmount(left);
        const rightAmount = getDelegatorAmount(right);
        return rightAmount > leftAmount ? 1 : rightAmount < leftAmount ? -1 : 0;
    });

    sortedDelegators.forEach((delegator, index) => {
        const address = String(delegator?.stake_address || 'Unknown stake address');
        const adaHandle = String(delegator?.ada_handle || '').trim();
        const addressLine = document.createElement('div');
        addressLine.className = 'pool-delegator-address-line';

        const addressText = document.createElement('strong');
        addressText.className = `pool-delegator-address${adaHandle ? ' pool-delegator-handle' : ''}`;
        addressText.textContent = adaHandle || shortenStakeAddress(address);
        addressText.title = address;

        const copy = document.createElement('button');
        copy.className = 'pool-delegator-copy-button';
        copy.type = 'button';
        copy.textContent = '⧉';
        copy.dataset.copyValue = address;
        copy.setAttribute('aria-label', `Copy stake address ${index + 1}`);
        copy.addEventListener('click', async () => {
            const original = copy.textContent;
            const fullAddress = copy.dataset.copyValue;
            try {
                if (!fullAddress) throw new Error('Missing stake address');
                await copyText(fullAddress);
                copy.textContent = 'Copied';
            } catch (error) {
                copy.textContent = 'Copy failed';
            }
            setTimeout(() => {
                copy.textContent = original;
            }, 1400);
        });

        const amount = document.createElement('span');
        amount.className = 'pool-delegator-amount';
        amount.textContent = formatDelegatorAda(getDelegatorAmount(delegator));

        addressLine.append(addressText, copy);
        const details = [addressLine, amount];

        const epoch = Number(delegator?.active_epoch_no);
        if (Number.isFinite(epoch)) {
            const epochText = document.createElement('span');
            epochText.className = 'pool-delegator-epoch';
            epochText.textContent = `Active epoch ${epoch.toLocaleString('en-US')}`;
            details.push(epochText);
        }

        const row = createPoolOverlayRow({ index, details });
        row.dataset.sortName = normalizeOverlaySearchText(adaHandle || address);
        row.dataset.sortAmount = getDelegatorAmount(delegator).toString();
        if (Number.isFinite(epoch)) row.dataset.sortEpoch = String(epoch);
        list.appendChild(row);
    });

    return list;
}

function createPoolOverlayRow({ index, title = '', titleClassName = '', details = [] }) {
    const row = document.createElement('div');
    row.className = 'pool-delegator-row governance-menu-card';

    const rank = document.createElement('span');
    rank.className = 'pool-delegator-rank';
    rank.textContent = String(index + 1);

    const content = document.createElement('div');
    content.className = 'pool-delegator-content';

    if (title) {
        const titleElement = document.createElement('strong');
        titleElement.className = titleClassName || 'pool-delegator-address';
        titleElement.textContent = title;
        content.appendChild(titleElement);
    }

    details.forEach(detail => {
        if (!detail) return;
        if (detail instanceof Node) {
            content.appendChild(detail);
            return;
        }

        const text = document.createElement('span');
        text.className = 'pool-delegator-address';
        text.textContent = String(detail);
        content.appendChild(text);
    });

    row.append(rank, content);
    return row;
}

function getDelegatorAmount(delegator) {
    try {
        return BigInt(String(delegator?.amount_lovelace ?? delegator?.amount ?? '0'));
    } catch (error) {
        return 0n;
    }
}

function formatDelegatorAda(lovelace) {
    const wholeAda = lovelace / 1_000_000n;
    const fraction = lovelace % 1_000_000n;
    const value = `${wholeAda}.${fraction.toString().padStart(6, '0')}`;
    return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value))} ADA`;
}

function shortenStakeAddress(address) {
    if (address.length <= 34) return address;
    return `${address.slice(0, 20)}...${address.slice(-10)}`;
}

function initPoolCopyButtons() {
    document.querySelectorAll('[data-copy-target]').forEach(button => {
        button.addEventListener('click', async () => {
            const target = document.getElementById(button.dataset.copyTarget);
            const value = target?.textContent?.trim();
            if (!value || value === '...' || value === 'N/A') return;

            const originalLabel = button.textContent;
            const originalAriaLabel = button.getAttribute('aria-label') || '';
            try {
                await copyText(value);
                button.textContent = 'Copied';
                button.setAttribute('aria-label', `Copied ${value}`);
                setTimeout(() => {
                    button.textContent = originalLabel;
                    button.setAttribute('aria-label', originalAriaLabel);
                }, 1400);
            } catch (error) {
                button.textContent = 'Copy failed';
                setTimeout(() => {
                    button.textContent = originalLabel;
                }, 1400);
            }
        });
    });
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

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('en-US').format(number) : 'N/A';
}

function formatAdaFromLovelace(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'N/A';
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number / 1_000_000)} ADA`;
}

function formatPoolMargin(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'N/A';
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number * 100)}%`;
}

function formatTimestamp(value) {
    if (!value) return 'Never';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    applyStoredTheme();
    syncThemeToggle(toggle);

    toggle.addEventListener('click', () => {
        const currentTheme = getPreferredTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        syncThemeToggle(toggle);
    });
}

function applyStoredTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        document.documentElement.dataset.theme = storedTheme;
        return;
    }

    delete document.documentElement.dataset.theme;
}

function getPreferredTheme() {
    const explicitTheme = document.documentElement.dataset.theme;
    if (explicitTheme === 'light' || explicitTheme === 'dark') return explicitTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeToggle(toggle) {
    const nextTheme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
    toggle.dataset.nextTheme = nextTheme;
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
}

function setupRevealOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12, root: null, rootMargin: '0px 0px -10% 0px' });

    const targets = Array.from(document.querySelectorAll('.section, .hero-logo, h2, p'));
    targets.forEach(el => {
        if (el.dataset.revealObserved === 'true') return;
        el.dataset.revealObserved = 'true';
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Fallback: if observer didn't trigger within 1s, reveal everything so the page isn't stuck hidden
    setTimeout(() => {
        const stillHidden = targets.filter(t => !t.classList.contains('visible'));
        if (stillHidden.length) {
            stillHidden.forEach(t => t.classList.add('visible'));
        }
    }, 1000);
}

function setupHeaderVisibility() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!navLinks.length || !sections.length) return;

    if (headerVisibilityObserver) headerVisibilityObserver.disconnect();

    headerVisibilityObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
        });
    }, {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5]
    });

    sections.forEach(section => headerVisibilityObserver.observe(section));

    navLinks.forEach(link => {
        if (link.dataset.navBound === 'true') return;
        link.dataset.navBound = 'true';
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const firstLink = navLinks[0];
    if (firstLink) {
        firstLink.classList.add('active');
    }
}
