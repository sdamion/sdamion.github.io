(function () {
    function createCatalystFormatModule({
        formatAdaAmount,
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

        return Object.freeze({
            formatCurrencyAmount,
            formatFundAmount,
            formatFundingAmount,
            formatOfficialMoney,
            formatProposalAmount,
            formatUsdRate
        });
    }

    window.TDSPCatalystFormat = Object.freeze({
        create: createCatalystFormatModule
    });
}());
