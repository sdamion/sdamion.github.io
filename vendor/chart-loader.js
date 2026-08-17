(function () {
    const CHART_SCRIPT_SRC = 'vendor/chart.js?v=20260806-lazy-chart';

    function loadChartJs() {
        return window.TDSPRuntime.loadScript(CHART_SCRIPT_SRC, {
            datasetName: 'tdspChart',
            selector: 'script[data-tdsp-chart]',
            ready: () => (typeof window.Chart === 'function' ? window.Chart : null)
        });
    }

    window.TDSPCharts = Object.freeze({ load: loadChartJs });
}());
