(function () {
    function createCatalystChartsModule({
        createPieChart,
        createStatBox,
        formatMoney,
        formatPercentage
    }) {
        function createVoteChartSection(voting) {
            if (!voting) return null;
            const voteItems = [
                { key: 'yes', label: 'Yes', color: '#34d399', money: voting.yes },
                { key: 'no', label: 'No', color: '#fb7185', money: voting.no },
                { key: 'abstain', label: 'Abstain', color: '#60a5fa', money: voting.abstain }
            ]
                .map(item => ({
                    ...item,
                    value: Number(item.money?.amount)
                }))
                .filter(item => Number.isFinite(item.value) && item.value > 0);
            const total = voteItems.reduce((sum, item) => sum + item.value, 0);
            if (!voteItems.length || total <= 0) return null;

            const section = document.createElement('section');
            section.className = 'governance-vote-chart governance-chart-panel';

            const title = document.createElement('strong');
            title.textContent = 'Catalyst vote overview';

            const layout = document.createElement('div');
            layout.className = 'governance-vote-chart-layout';
            layout.appendChild(createPieChart(voteItems, {
                labelFormatter: segment => formatPercentage((segment.value / total) * 100)
            }));

            const legend = document.createElement('div');
            legend.className = 'governance-vote-legend governance-vote-legend--stacked';
            legend.appendChild(createStatBox({
                label: 'Vote result',
                detail: [
                    voting.status || null,
                    `${Number(voting.votes_cast || 0).toLocaleString('en-US')} votes cast`
                ].filter(Boolean).join(' • '),
                color: '#94a3b8'
            }));
            voteItems.forEach(item => {
                legend.appendChild(createStatBox({
                    label: item.label,
                    detail: [
                        formatMoney(item.money),
                        formatPercentage((item.value / total) * 100)
                    ].filter(Boolean).join(' • '),
                    color: item.color
                }));
            });

            layout.appendChild(legend);
            section.append(title, layout);
            return section;
        }

        return Object.freeze({
            createVoteChartSection
        });
    }

    window.TDSPCatalystCharts = Object.freeze({
        create: createCatalystChartsModule
    });
}());
