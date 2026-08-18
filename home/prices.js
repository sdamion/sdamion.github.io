(function () {
    const IS_LOCAL_PREVIEW = window.TDSPRuntime?.isLocalPreview === true;
    const PRICE_API_URL = IS_LOCAL_PREVIEW ? '/__prices_proxy__' : 'https://api.tdsp.online/api/prices';
    const PRICE_CHART_WINDOW_LABEL = '7 days';
    const PRICE_CHART_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
    const PRICE_TILE_WINDOW_MS = PRICE_CHART_WINDOW_MS;
    const PRICE_OVERLAY_WINDOW_MS = PRICE_CHART_WINDOW_MS;
    const PRICE_OVERLAY_BUCKET_MS = 5 * 60 * 1000;
    const PRICE_CHART_INTERVALS = Object.freeze([
        { minutes: 5, label: '5 min' },
        { minutes: 10, label: '10 min' },
        { minutes: 60, label: '1 hour' },
        { minutes: 1440, label: '1 day' }
    ]);
    const PRICE_TRADINGVIEW_SYMBOLS = Object.freeze({
        btc_usd: 'COINBASE:BTCUSD',
        ada_usd: 'COINBASE:ADAUSD',
        night_usd: 'KRAKEN:NIGHTUSD'
    });
    const PRICE_TOKEN_CONFIG = Object.freeze({
        btc_usd: { elementId: 'btc-price', decimals: 0 },
        ada_usd: { elementId: 'ada-price', decimals: 3 },
        strch_usd: { elementId: 'strch-price', decimals: 12 },
        night_usd: { elementId: 'night-price', decimals: 4 }
    });

    let latestPricePayload = null;
    let priceFetchPromise = null;
    let priceHistoryChart = null;

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

    async function fetchPrices(options = {}) {
        if (document.hidden && latestPricePayload && options.force !== true) return latestPricePayload;
        if (priceFetchPromise) return priceFetchPromise;

        priceFetchPromise = (async () => {
            try {
                const prices = await window.TDSPRuntime.fetchJson(
                    PRICE_API_URL,
                    { cache: 'no-store' }
                );
                latestPricePayload = prices;
                Object.entries(PRICE_TOKEN_CONFIG).forEach(([key, config]) => {
                    window.TDSPRuntime.setText(
                        config.elementId,
                        `${config.prefix || ''}${formatUsdPrice(prices[key], config.decimals)}`
                    );
                });
                renderPriceSparklines(prices.history);
                return prices;
            } catch (error) {
                console.error('Price data could not be loaded', error);
                Object.values(PRICE_TOKEN_CONFIG).forEach(config => window.TDSPRuntime.setText(config.elementId, 'N/A'));
                renderPriceSparklines([]);
                return null;
            } finally {
                priceFetchPromise = null;
            }
        })();

        return priceFetchPromise;
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

    function getTradingViewInterval(intervalMinutes) {
        const minutes = Number(intervalMinutes);
        if (minutes >= 1440) return 'D';
        return String(Math.max(1, minutes || 5));
    }

    function renderTradingViewPriceChart(container, symbol, ticker, intervalMinutes = 5) {
        if (!container?.isConnected || !symbol) return;

        container.textContent = '';
        const settings = {
            autosize: true,
            symbol,
            interval: getTradingViewInterval(intervalMinutes),
            timezone: 'Europe/Amsterdam',
            theme: 'dark',
            style: '1',
            locale: 'en',
            backgroundColor: '#0b1714',
            gridColor: 'rgba(148, 163, 184, 0.16)',
            allow_symbol_change: false,
            calendar: false,
            details: false,
            hide_side_toolbar: true,
            hide_top_toolbar: false,
            hide_legend: false,
            hide_volume: false,
            save_image: false,
            support_host: 'https://www.tradingview.com'
        };
        const widgetUrl = new URL('https://s.tradingview.com/embed-widget/advanced-chart/');
        widgetUrl.searchParams.set('locale', settings.locale);
        widgetUrl.hash = encodeURIComponent(JSON.stringify(settings));

        const frame = document.createElement('iframe');
        frame.className = 'tradingview-widget-frame';
        frame.src = widgetUrl.toString();
        frame.title = `${ticker}/USD TradingView chart`;
        frame.lang = settings.locale;
        frame.loading = 'lazy';
        frame.setAttribute('scrolling', 'no');
        frame.setAttribute('frameborder', '0');
        frame.setAttribute('allowtransparency', 'true');
        container.append(frame);
        container.setAttribute('aria-label', `${ticker}/USD TradingView chart`);
    }

    function initPriceHistoryTiles() {
        document.querySelectorAll('.price-panel > [data-price-key]').forEach(tile => {
            window.TDSPRuntime?.bindMenuTrigger?.(tile, () => openPriceHistoryOverlay(tile), {
                datasetKey: 'priceHistoryBound',
                preventDefault: false,
                stopPropagation: false,
                focus: false,
                errorMessage: 'Price chart could not be opened.'
            });
        });
    }

    function openPriceHistoryOverlay(tile) {
        closePriceHistoryOverlay(false);

        const key = tile?.dataset.priceKey || '';
        const ticker = tile?.dataset.priceTicker || 'Token';
        const priceConfig = PRICE_TOKEN_CONFIG[key] || { decimals: 4 };
        const tradingViewSymbol = PRICE_TRADINGVIEW_SYMBOLS[key];
        const tradingCandles = getHistoryOhlcSamples(key);
        const showTradingChart = Boolean(tradingViewSymbol) || tradingCandles.length > 1;
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
        if (showTradingChart && !tradingViewSymbol) {
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
        let tradingViewFrame = null;
        if (tradingViewSymbol) {
            const warning = document.createElement('p');
            warning.className = 'tradingview-link-warning';
            warning.textContent = 'Links in this chart are provided by TradingView. DYOR before opening external links.';
            body.appendChild(warning);
        }
        if (showTradingChart) {
            const frame = document.createElement('div');
            frame.className = 'price-history-chart-frame';
            if (tradingViewSymbol) {
                frame.classList.add('is-tradingview');
                tradingViewFrame = frame;
            } else {
                frame.classList.add('is-tradingview');
                canvas = document.createElement('canvas');
                canvas.setAttribute('role', 'img');
                canvas.setAttribute('aria-label', `${ticker}/USD candlestick chart over the last ${PRICE_CHART_WINDOW_LABEL}`);
                frame.appendChild(canvas);
            }
            body.appendChild(frame);
        } else {
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Price history is still being collected.';
            body.appendChild(message);
        }

        window.createPoolMenuOverlay?.({
            id: 'price-history-overlay',
            titleId: 'price-history-title',
            titleText: `${ticker} Price`,
            headerMeta: showTradingChart
                ? `${PRICE_CHART_WINDOW_LABEL} · ${tradingViewSymbol ? 'TradingView' : `5 min · ${tradingCandles.length.toLocaleString('en-US')} candles`}`
                : `${PRICE_CHART_WINDOW_LABEL} · Price history unavailable`,
            closeLabel: `Close ${ticker} price history`,
            closeOverlay: closePriceHistoryOverlay,
            returnFocus: tile,
            rootTitle: `${ticker} Price`,
            bodyNode: body
        });

        if (canvas || tradingViewFrame) requestAnimationFrame(() => {
            const renderInterval = async minutes => {
                const candles = tradingViewFrame ? [] : aggregatePriceCandles(tradingCandles, minutes);
                if (tradingViewFrame) {
                    renderTradingViewPriceChart(tradingViewFrame, tradingViewSymbol, ticker, minutes);
                } else {
                    await renderPriceTradingChart(canvas, candles, ticker, minutes, priceConfig.decimals);
                }
                const meta = document.querySelector('#price-history-overlay .governance-menu-header-meta');
                const option = PRICE_CHART_INTERVALS.find(item => item.minutes === minutes);
                if (meta) {
                    const sourceLabel = tradingViewFrame
                        ? 'TradingView'
                        : `${candles.length.toLocaleString('en-US')} candles`;
                    meta.textContent = `${PRICE_CHART_WINDOW_LABEL} · ${option?.label || `${minutes} min`} · ${sourceLabel}`;
                }
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

    async function renderPriceTradingChart(canvas, candles, ticker, intervalMinutes = 5, decimals = 4) {
        if (!canvas?.isConnected || candles.length < 2) return;
        const ChartCtor = await window.TDSPCharts?.load?.().catch(error => {
            console.error(`Chart.js could not be loaded: ${error.message}`);
            return null;
        });
        if (typeof ChartCtor !== 'function' || !canvas.isConnected) return;
        if (priceHistoryChart) priceHistoryChart.destroy();

        const styles = getComputedStyle(document.documentElement);
        const mutedColor = styles.getPropertyValue('--muted').trim() || '#94a3b8';
        const risingColor = '#34d399';
        const fallingColor = '#fb7185';
        const tickTimeFormatter = new Intl.DateTimeFormat('en-GB', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const tooltipTimeFormatter = new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const priceFormatter = value => {
            const number = Number(value);
            if (!Number.isFinite(number)) return 'N/A';
            return formatUsdPrice(number, decimals);
        };
        const lowest = Math.min(...candles.map(candle => candle.low));
        const highest = Math.max(...candles.map(candle => candle.high));
        const padding = Math.max(1e-12, (highest - lowest) * 0.05, Math.abs(highest) * 0.002);
        const intervalMs = Math.max(5, Number(intervalMinutes) || 5) * 60 * 1000;
        const chartEnd = Math.max(Date.now(), candles.at(-1)?.time || Date.now());
        const chartStart = chartEnd - PRICE_OVERLAY_WINDOW_MS;

        const candlestickPlugin = {
            id: `${String(ticker || 'token').toLowerCase()}-candlesticks`,
            beforeDraw(chart) {
                const { ctx, chartArea } = chart;
                if (!chartArea) return;
                ctx.save();
                ctx.fillStyle = 'rgba(7, 12, 11, 0.92)';
                ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
                ctx.restore();
            },
            afterDatasetsDraw(chart) {
                const { ctx, chartArea, scales } = chart;
                const points = chart.getDatasetMeta(0).data;
                if (!chartArea || !scales?.x || !scales?.y || !points.length) return;
                const intervalWidth = Math.abs(
                    scales.x.getPixelForValue(chartStart + intervalMs) - scales.x.getPixelForValue(chartStart)
                );
                const candleWidth = Math.max(4, Math.min(13, intervalWidth * 0.46));
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
                    if (![point.x, highY, lowY, openY, closeY].every(Number.isFinite)) return;
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.max(2, Math.abs(closeY - openY));
                    const crispX = Math.round(point.x) + 0.5;
                    ctx.strokeStyle = color;
                    ctx.fillStyle = candle.close >= candle.open
                        ? 'rgba(52, 211, 153, 0.78)'
                        : 'rgba(251, 113, 133, 0.78)';
                    ctx.lineWidth = 1.35;
                    ctx.beginPath();
                    ctx.moveTo(crispX, highY);
                    ctx.lineTo(crispX, lowY);
                    ctx.stroke();
                    ctx.fillRect(
                        Math.round(point.x - candleWidth / 2),
                        Math.round(bodyTop),
                        Math.round(candleWidth),
                        Math.round(bodyHeight)
                    );
                    ctx.strokeRect(
                        Math.round(point.x - candleWidth / 2) + 0.5,
                        Math.round(bodyTop) + 0.5,
                        Math.max(Math.round(candleWidth) - 1, 1),
                        Math.max(Math.round(bodyHeight) - 1, 1)
                    );
                });
                ctx.restore();
            },
            afterDraw(chart) {
                const active = chart.tooltip?.getActiveElements?.() || [];
                const point = active[0]?.element;
                const { ctx, chartArea } = chart;
                if (!point || !chartArea) return;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(point.x, chartArea.top);
                ctx.lineTo(point.x, chartArea.bottom);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
                ctx.setLineDash([3, 5]);
                ctx.stroke();
                ctx.restore();
            }
        };

        priceHistoryChart = new ChartCtor(canvas, {
            type: 'line',
            data: {
                datasets: [{
                    label: `${ticker}/USD`,
                    data: candles.map(candle => ({ x: candle.time, y: candle.close })),
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
                        backgroundColor: 'rgba(8, 13, 12, 0.96)',
                        titleColor: '#f4f7f4',
                        bodyColor: '#f4f7f4',
                        borderColor: 'rgba(94, 234, 212, 0.28)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: contexts => {
                                const time = Number(contexts[0]?.parsed?.x);
                                return Number.isFinite(time) ? tooltipTimeFormatter.format(time) : '';
                            },
                            label: context => {
                                const candle = candles[context.dataIndex];
                                if (!candle) return '';
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
                        type: 'linear',
                        min: chartStart,
                        max: chartEnd,
                        ticks: {
                            color: mutedColor,
                            maxTicksLimit: 7,
                            maxRotation: 0,
                            callback: value => tickTimeFormatter.format(Number(value))
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.12)', borderDash: [2, 4] },
                        border: { display: false }
                    },
                    y: {
                        min: lowest - padding,
                        max: highest + padding,
                        ticks: { color: mutedColor, callback: priceFormatter },
                        grid: { color: 'rgba(148, 163, 184, 0.12)', borderDash: [2, 4] },
                        border: { display: false }
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
        window.closePoolMenuOverlay?.('price-history-overlay', restoreFocus);
    }

    window.TDSPPrices = Object.freeze({
        load: fetchPrices,
        initHistoryTiles: initPriceHistoryTiles,
        getLatest: () => latestPricePayload
    });
})();
