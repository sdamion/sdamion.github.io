(function () {
    function createCatalystChartsModule({
        createPieChart,
        createStatBox,
        formatCurrency,
        formatFundAmount,
        formatMoney,
        formatPercentage,
        getFundingProjects,
        getFundingStatus,
        onOpenFundingProjects
    }) {
        function createFundingStatusChart(payload) {
            const status = getFundingStatus(payload);
            if (!status || status.requested <= 0) return null;

            const groups = [
                {
                    key: 'claimed',
                    label: 'Claimed Funds',
                    value: status.claimed,
                    color: '#34d399',
                    currency: 'USD',
                    projects: status.projects.filter(project => (
                        Number(project.claimed_usd) > 0
                    )),
                    amountField: 'claimed_usd',
                    requestedField: 'requested_usd'
                },
                {
                    key: 'not-claimed',
                    label: 'Unclaimed Funds',
                    value: status.notClaimed,
                    color: '#fb7185',
                    currency: 'USD',
                    projects: status.projects.filter(project => (
                        Number(project.not_claimed_usd) > 0
                    )),
                    amountField: 'not_claimed_usd',
                    requestedField: 'requested_usd'
                }
            ].filter(group => group.value > 0);

            return createFundingChartSection({
                groups,
                requested: status.requested,
                projectCount: status.projectCount,
                projectLabel: 'in-progress projects',
                currency: 'USD'
            });
        }

        function createCurrencyFundingStatusChart(fund, proposals = []) {
            const requested = Number(fund.requested_amount) || 0;
            if (!fund.funding_currency || requested <= 0) return null;
            const fundingProjects = (Array.isArray(proposals) ? proposals : []).flatMap(project => {
                const projectRequested = Number(project?.amount_requested_usd);
                if (
                    project?.project_status !== 'in_progress'
                    || !Number.isFinite(projectRequested)
                    || projectRequested <= 0
                ) return [];
                const projectClaimed = Math.min(
                    Math.max(Number(project?.amount_received_usd) || 0, 0),
                    projectRequested
                );
                return [{
                    ...project,
                    requested_amount: projectRequested,
                    claimed_amount: projectClaimed,
                    not_claimed_amount: Math.max(projectRequested - projectClaimed, 0)
                }];
            });
            const groups = [
                {
                    key: 'claimed',
                    label: 'Claimed Funds',
                    value: Number(fund.claimed_amount) || 0,
                    color: '#34d399',
                    currency: fund.funding_currency,
                    projects: fundingProjects.filter(project => project.claimed_amount > 0),
                    amountField: 'claimed_amount',
                    requestedField: 'requested_amount'
                },
                {
                    key: 'not-claimed',
                    label: 'Unclaimed Funds',
                    value: Number(fund.not_claimed_amount) || 0,
                    color: '#fb7185',
                    currency: fund.funding_currency,
                    projects: fundingProjects.filter(project => project.not_claimed_amount > 0),
                    amountField: 'not_claimed_amount',
                    requestedField: 'requested_amount'
                }
            ].filter(group => group.value > 0);
            if (!groups.length) return null;

            return createFundingChartSection({
                groups,
                requested,
                projectCount: fund.funded_project_count,
                projectLabel: 'in-progress projects',
                currency: fund.funding_currency
            });
        }

        function createFundingChartSection({
            groups,
            requested,
            projectCount,
            projectLabel,
            currency
        }) {
            if (!Array.isArray(groups) || !groups.length) return null;
            const section = document.createElement('section');
            section.className = 'governance-vote-chart governance-chart-panel';

            const title = document.createElement('strong');
            title.textContent = 'Catalyst funding status';

            const projects = document.createElement('span');
            projects.className = 'governance-card-detail';
            projects.textContent = `${Number(projectCount || 0).toLocaleString('en-US')} ${projectLabel}`;

            const layout = document.createElement('div');
            layout.className = 'governance-vote-chart-layout';
            layout.appendChild(createPieChart(groups, {
                labelFormatter: segment => (
                    ((segment.end - segment.start) / 360) >= 0.03
                        ? formatCurrency(segment.value, currency, true)
                        : ''
                ),
                onSegmentClick: (segment, returnFocus) => (
                    onOpenFundingProjects(segment, returnFocus)
                ),
                showSegmentSeparators: true
            }));

            const legend = document.createElement('div');
            legend.className = 'governance-vote-legend';
            groups.forEach(group => {
                legend.appendChild(createStatBox({
                    label: group.label,
                    detail: `${formatCurrency(group.value, currency)} • ${formatPercentage((group.value / requested) * 100)}`,
                    color: group.color,
                    onClick: event => onOpenFundingProjects(group, event.currentTarget)
                }));
            });

            layout.appendChild(legend);
            section.append(title, projects, layout);
            return section;
        }

        function createFundFundingPayload(fund, businessPayload) {
            const projects = getFundingProjects(businessPayload)
                .filter(project => project.fund_name === fund.fund_name);
            return {
                funding_status: {
                    project_count: fund.funded_project_count,
                    requested_lovelace: fund.requested_lovelace,
                    claimed_lovelace: fund.claimed_lovelace,
                    not_claimed_lovelace: fund.not_claimed_lovelace,
                    rounds: [{
                        fund_name: fund.fund_name,
                        project_count: fund.funded_project_count,
                        requested_lovelace: fund.requested_lovelace,
                        claimed_lovelace: fund.claimed_lovelace,
                        not_claimed_lovelace: fund.not_claimed_lovelace
                    }]
                },
                funding_projects: projects
            };
        }

        function createFundTotals(fund) {
            const summary = document.createElement('div');
            summary.className = 'governance-vote-legend governance-catalyst-fund-totals';
            summary.append(
                createStatBox({
                    label: 'Claimed Funds',
                    detail: formatFundAmount(fund, 'claimed'),
                    color: '#34d399'
                }),
                createStatBox({
                    label: 'Unclaimed Funds',
                    detail: formatFundAmount(fund, 'not_claimed'),
                    color: '#fb7185'
                })
            );
            return summary;
        }

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
            createCurrencyFundingStatusChart,
            createFundFundingPayload,
            createFundTotals,
            createFundingStatusChart,
            createVoteChartSection
        });
    }

    window.TDSPCatalystCharts = Object.freeze({
        create: createCatalystChartsModule
    });
}());
