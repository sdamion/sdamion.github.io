(function () {
    const CHART_SCRIPT_SRC = 'chart.js?v=20260806-lazy-chart';
    let chartPromise = null;

    function loadChartJs() {
        if (typeof window.Chart === 'function') return Promise.resolve(window.Chart);
        if (chartPromise) return chartPromise;

        chartPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-tdsp-chart]');
            if (existing) {
                existing.addEventListener('load', () => resolve(window.Chart), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = CHART_SCRIPT_SRC;
            script.defer = true;
            script.dataset.tdspChart = 'true';
            script.addEventListener('load', () => resolve(window.Chart), { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });

        return chartPromise;
    }

    window.TDSPCharts = Object.freeze({ load: loadChartJs });
}());
