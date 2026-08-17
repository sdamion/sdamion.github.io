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
            getFundNumber,
            getMilestoneProgress,
            hasNumericValue
        });
    }

    window.TDSPCatalystFormat = Object.freeze({
        create: createCatalystFormatModule
    });
}());
