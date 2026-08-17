(function () {
    function createCatalystFormatModule({
        formatAdaAmount: formatAdaValue,
        formatCompactAda,
        formatFullAda
    }) {
        function formatFundAmount(fund, kind, compact = false) {
            const amount = Number(fund?.[`${kind}_amount`]) || 0;
            return formatCurrencyAmount(amount, 'USD', compact);
        }

        function formatCurrencyAmount(value, currency, compact = false) {
            const normalizedCurrency = String(currency || '').trim().toUpperCase();
            if (!normalizedCurrency || normalizedCurrency === 'MIXED') return '--';
            if (normalizedCurrency === 'ADA') return formatAdaAmount(value, compact);
            const amount = Number(value) || 0;
            const options = {
                notation: compact ? 'compact' : 'standard',
                maximumFractionDigits: compact ? 2 : 0
            };

            try {
                return new Intl.NumberFormat('en-US', {
                    ...options,
                    style: 'currency',
                    currency: normalizedCurrency
                }).format(amount);
            } catch {
                return `${new Intl.NumberFormat('en-US', options).format(amount)} ${normalizedCurrency}`;
            }
        }

        function formatUsdRate(value) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            }).format(Number(value) || 0);
        }

        function hasNumericValue(value) {
            return value !== null
                && value !== undefined
                && value !== ''
                && Number.isFinite(Number(value));
        }

        function formatAdaAmount(value, compact = false) {
            return formatAdaValue(value, compact);
        }

        function formatFundingAmount(value, currency = 'ADA', compact = false) {
            return currency === 'ADA'
                ? (
                    compact
                        ? formatCompactAda(value)
                        : formatFullAda(value)
                )
                : formatCurrencyAmount(value, currency, compact);
        }

        function formatOfficialMoney(value) {
            const amount = Number(value?.amount);
            if (!Number.isFinite(amount)) return null;
            const currency = String(value?.currency || '').replace(/^\$/, '').toUpperCase();
            return currency === 'ADA'
                ? formatAdaAmount(amount)
                : formatCurrencyAmount(amount, currency || 'USD');
        }

        function formatProposalAmount(proposal, kind) {
            const amount = Number(proposal?.[`amount_${kind}_usd`]);
            if (!Number.isFinite(amount)) return null;
            return formatCurrencyAmount(amount, 'USD');
        }

        function getFundNumber(value) {
            const match = String(value || '').match(/\d+/);
            return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
        }

        function getMilestoneProgress(proposal) {
            const progress = proposal?.milestone_progress;
            if (progress && typeof progress === 'object') {
                const total = Math.max(0, Number(progress.total) || 0);
                const completed = Math.min(total, Math.max(0, Number(progress.completed) || 0));
                return total > 0 ? { completed, total } : null;
            }

            const milestones = proposal?.milestones;
            if (!milestones || typeof milestones !== 'object') return null;
            const items = Array.isArray(milestones.items) ? milestones.items : [];
            const completedFromItems = items.filter(item => (
                ['complete', 'completed', 'finished'].includes(
                    String(item?.status || '').trim().toLowerCase()
                )
            )).length;
            const completed = Math.max(
                completedFromItems,
                Math.max(0, Number(milestones.complete) || 0)
            );
            const inProgress = Math.max(0, Number(milestones.in_progress) || 0);
            const total = Math.max(items.length, completed + inProgress);
            return total > 0 ? { completed: Math.min(completed, total), total } : null;
        }

        function appendMilestoneIndicator(container, proposal) {
            const progress = getMilestoneProgress(proposal);
            if (!progress) return;

            container.classList.add('has-catalyst-milestones');
            const indicator = document.createElement('span');
            indicator.className = 'catalyst-milestone-indicator';
            indicator.setAttribute(
                'aria-label',
                `${progress.completed} of ${progress.total} milestones finished`
            );

            const bar = document.createElement('span');
            bar.className = 'catalyst-milestone-bar';
            for (let index = 0; index < progress.total; index += 1) {
                const segment = document.createElement('span');
                segment.className = index < progress.completed
                    ? 'catalyst-milestone-segment is-complete'
                    : 'catalyst-milestone-segment is-unfinished';
                bar.appendChild(segment);
            }

            const count = document.createElement('strong');
            count.className = 'catalyst-milestone-count';
            count.textContent = `${progress.completed}/${progress.total}`;
            indicator.append(bar, count);
            container.appendChild(indicator);
        }

        function createFundingAmountRow(usdValue, adaValue = null, usdPending = false, options = {}) {
            const row = document.createElement('span');
            row.className = 'governance-card-amount-row';

            if (!(usdPending && options.hidePendingUsd === true)) {
                const usdAmount = document.createElement('span');
                usdAmount.className = 'governance-card-detail governance-treasury-withdrawal-amount';
                usdAmount.textContent = usdPending
                    ? 'USD updating'
                    : formatCurrencyAmount(usdValue, 'USD');
                row.appendChild(usdAmount);
            }

            if (Number(adaValue) > 0) {
                const adaAmount = document.createElement('span');
                adaAmount.className = 'governance-card-detail funding-recipient-ada-value';
                adaAmount.textContent = formatAdaAmount(adaValue);
                row.appendChild(adaAmount);
            }
            return row;
        }

        function getProposalUsdTotals(proposals) {
            return (Array.isArray(proposals) ? proposals : []).reduce((totals, proposal) => ({
                asked: totals.asked + (Number(proposal?.amount_requested_usd) || 0),
                received: totals.received + (Number(proposal?.amount_received_usd) || 0)
            }), { asked: 0, received: 0 });
        }

        function getFundTotals(funds) {
            return (Array.isArray(funds) ? funds : []).reduce((totals, fund) => ({
                count: totals.count + (Number(fund?.proposal_count) || 0),
                fundedUsd: totals.fundedUsd + (Number(fund?.requested_amount) || 0),
                claimedUsd: totals.claimedUsd + (Number(fund?.claimed_amount) || 0),
                fundedAda: totals.fundedAda + (Number(fund?.requested_ada) || 0),
                claimedAda: totals.claimedAda + (Number(fund?.claimed_ada) || 0)
            }), {
                count: 0,
                fundedUsd: 0,
                claimedUsd: 0,
                fundedAda: 0,
                claimedAda: 0
            });
        }

        function normalizeFunds(payload) {
            return (Array.isArray(payload?.funds) ? payload.funds : []).flatMap(fund => {
                const fundName = String(fund?.fund_name || '').trim();
                const proposalCount = Number(fund?.proposal_count);
                if (!fundName || !Number.isFinite(proposalCount)) return [];
                return [{
                    fund_name: fundName,
                    proposal_count: proposalCount,
                    ada_proposal_count: Number(fund?.ada_proposal_count) || 0,
                    funded_project_count: Number(fund?.funded_project_count) || 0,
                    funding_currency: String(fund?.funding_currency || '').toUpperCase() || null,
                    requested_amount: Number(fund?.requested_amount) || 0,
                    claimed_amount: Number(fund?.claimed_amount) || 0,
                    not_claimed_amount: Number(fund?.not_claimed_amount) || 0,
                    requested_ada: Number(fund?.requested_ada) || 0,
                    claimed_ada: Number(fund?.claimed_ada) || 0,
                    not_claimed_ada: Number(fund?.not_claimed_ada) || 0,
                    conversion_missing_count: Number(fund?.conversion_missing_count) || 0
                }];
            }).sort((left, right) => (
                getFundNumber(right.fund_name) - getFundNumber(left.fund_name)
                || left.fund_name.localeCompare(right.fund_name, 'en-US')
            ));
        }

        function getCombinedFundingTotals(funds, treasuryTotals = {}) {
            const catalystTotals = getFundTotals(funds);
            return {
                count: catalystTotals.count + (Number(treasuryTotals.count) || 0),
                asked: catalystTotals.fundedUsd + (Number(treasuryTotals.usd) || 0),
                claimed: catalystTotals.claimedUsd + (Number(treasuryTotals.usd) || 0),
                received: catalystTotals.claimedUsd + (Number(treasuryTotals.usd) || 0),
                ada: catalystTotals.claimedAda + (Number(treasuryTotals.ada) || 0),
                usdPending: treasuryTotals.usdPending === true
            };
        }

        function formatFundingHeader(totals) {
            const amount = hasNumericValue(totals?.claimed)
                ? totals.claimed
                : hasNumericValue(totals?.received)
                    ? totals.received
                    : totals?.asked;
            return formatCurrencyAmount(amount, 'USD', true);
        }

        return Object.freeze({
            appendMilestoneIndicator,
            createFundingAmountRow,
            formatAdaAmount,
            formatCurrencyAmount,
            formatFundAmount,
            formatFundingAmount,
            formatOfficialMoney,
            formatProposalAmount,
            formatUsdRate,
            formatFundingHeader,
            getCombinedFundingTotals,
            getFundNumber,
            getFundTotals,
            getMilestoneProgress,
            getProposalUsdTotals,
            hasNumericValue,
            normalizeFunds
        });
    }

    window.TDSPCatalystFormat = Object.freeze({
        create: createCatalystFormatModule
    });
}());
