(function () {
    function createDrepStatusModule({
        createPieChart,
        createStatBox,
        formatAda,
        formatPercentage,
        onGroupClick
    }) {
        function createChart(dreps) {
            const groups = getStatusGroups(dreps);
            const totalPower = groups.reduce((sum, group) => sum + group.value, 0);

            const section = document.createElement('section');
            section.className = 'governance-vote-chart governance-chart-panel governance-drep-status-chart';

            const title = document.createElement('strong');
            title.textContent = 'DamionDutch';

            const layout = document.createElement('div');
            layout.className = 'governance-vote-chart-layout';

            const chart = createPieChart(groups, {
                labelFormatter: segment => formatAda(segment.value)
            });

            const legend = document.createElement('div');
            legend.className = 'governance-vote-legend';
            groups.forEach(group => {
                legend.appendChild(createLegendItem(group, totalPower));
            });

            layout.appendChild(chart);
            layout.appendChild(legend);
            section.appendChild(title);
            section.appendChild(layout);
            return section;
        }

        function getStatusGroups(dreps) {
            const activeDreps = dreps.filter(drep => drep.active);
            const inactiveDreps = dreps.filter(drep => !drep.active);
            return [
                {
                    key: 'active',
                    label: 'Active',
                    color: '#34d399',
                    dreps: activeDreps,
                    value: activeDreps.reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0)
                },
                {
                    key: 'inactive',
                    label: 'Inactive',
                    color: '#fb7185',
                    dreps: inactiveDreps,
                    value: inactiveDreps.reduce((sum, drep) => sum + (Number(drep.votingPower) || 0), 0)
                }
            ];
        }

        function createLegendItem(group, totalPower) {
            const percentage = totalPower > 0 ? (group.value / totalPower) * 100 : 0;
            return createStatBox({
                label: group.label,
                detail: `${group.dreps.length.toLocaleString('en-US')} DReps • ${formatAda(group.value)} • ${formatPercentage(percentage)}`,
                color: group.color,
                onClick: event => onGroupClick(
                    `${group.label} DReps`,
                    group.dreps,
                    event.currentTarget
                )
            });
        }

        return Object.freeze({
            createChart
        });
    }

    window.TDSPDrepStatus = Object.freeze({
        create: createDrepStatusModule
    });
}());
