(function () {
    function createNclModule({
        budgetEpochs = 101,
        budgetStartEpoch = 613,
        createMenuOverlay,
        createSectionBotContext,
        createStatBox,
        fallbackLimitLovelace = 350_000_000_000_000,
        formatCompactAda,
        getClockEpochSnapshot,
        getGovernanceProposals,
        getProposalAsk,
        getProposalStatus,
        getProposalType,
        getTreasuryWithdrawals,
        openActionsOverlay,
        removeMenuOverlay
    }) {
        let summary = null;
        let limitLovelace = fallbackLimitLovelace;

        function applyDashboardSummary(payload) {
            const nextSummary = payload?.ncl_summary
                || payload?.treasury?.ncl
                || payload?.summaries?.treasury?.ncl
                || null;
            summary = nextSummary;
            const limit = Number(nextSummary?.limit_lovelace);
            limitLovelace = Number.isFinite(limit) && limit > 0
                ? limit
                : fallbackLimitLovelace;
        }

        function getValues() {
            const fallbackLimit = getLimitLovelace();
            const fallbackSpent = getBudgetUsed();
            const fallbackBalance = Math.max(fallbackLimit - fallbackSpent, 0);
            const fallbackNet = fallbackBalance - getActiveTreasuryAskTotal();
            const finiteOrFallback = (value, fallback) => {
                const number = Number(value);
                return Number.isFinite(number) ? number : fallback;
            };

            return {
                limit: finiteOrFallback(summary?.limit_lovelace, fallbackLimit),
                spent: finiteOrFallback(summary?.spent_lovelace, fallbackSpent),
                balance: finiteOrFallback(summary?.remaining_lovelace, fallbackBalance),
                net: finiteOrFallback(summary?.projected_all_remaining_lovelace, fallbackNet)
            };
        }

        function getPeriod() {
            const startEpoch = Number(summary?.start_epoch);
            const endEpoch = Number(summary?.end_epoch);
            if (!Number.isFinite(startEpoch) || !Number.isFinite(endEpoch)) return null;
            return {
                startEpoch,
                endEpoch
            };
        }

        function getLimitLovelace() {
            return Number.isFinite(limitLovelace) && limitLovelace > 0
                ? limitLovelace
                : fallbackLimitLovelace;
        }

        function getBudgetUsed() {
            const withdrawals = getTreasuryWithdrawals();
            const yearEndEpoch = budgetStartEpoch + budgetEpochs;

            return withdrawals.reduce((total, withdrawal) => {
                const enactedEpoch = Number(withdrawal?.enacted_epoch);
                const amount = Number(withdrawal?.amount_lovelace);
                if (!Number.isFinite(enactedEpoch) || !Number.isFinite(amount)) return total;
                if (enactedEpoch < budgetStartEpoch || enactedEpoch >= yearEndEpoch) return total;
                return total + amount;
            }, 0);
        }

        function getActiveTreasuryAskTotal() {
            return getGovernanceProposals().reduce((total, proposal) => {
                if (getProposalType(proposal) !== 'TreasuryWithdrawals') return total;
                if (getProposalStatus(proposal) !== 'active') return total;
                return total + getProposalAsk(proposal);
            }, 0);
        }

        function getSpentActions() {
            const startEpoch = Number(summary?.start_epoch);
            const endEpoch = Number(summary?.end_epoch);
            if (!Number.isFinite(startEpoch) || !Number.isFinite(endEpoch)) return [];

            return getGovernanceProposals().filter(proposal => {
                if (getProposalType(proposal) !== 'TreasuryWithdrawals') return false;
                const enactedEpoch = Number(proposal?.enacted_epoch);
                return Number.isFinite(enactedEpoch)
                    && enactedEpoch >= startEpoch
                    && enactedEpoch <= endEpoch;
            });
        }

        function getBalanceActions() {
            return getGovernanceProposals().filter(proposal => {
                if (getProposalType(proposal) !== 'TreasuryWithdrawals') return false;
                if (proposal?.enacted_epoch != null || proposal?.expired_epoch != null || proposal?.dropped_epoch != null) {
                    return false;
                }
                return proposal?.ratified_epoch != null || getProposalStatus(proposal) === 'active';
            });
        }

        function openSpentActions(returnFocus) {
            const actions = getSpentActions();
            openActionsOverlay('NCL Spend', actions, returnFocus, 'Enacted');
        }

        function openBalanceActions(returnFocus) {
            const actions = getBalanceActions();
            const ratifiedCount = actions.filter(action => action?.ratified_epoch != null).length;
            const activeCount = actions.length - ratifiedCount;
            const status = [
                ratifiedCount ? `${ratifiedCount} ratified` : null,
                activeCount ? `${activeCount} active` : null
            ].filter(Boolean).join(' • ');
            openActionsOverlay('NCL Balance Actions', actions, returnFocus, status);
        }

        function formatAdaAmount(value) {
            const amount = Number(value);
            const prefix = amount < 0 ? '-' : '';
            return `${prefix}${formatCompactAda(Math.abs(amount), { fixedFractionDigits: 2 })}`;
        }

        function updateCard(nclLimit, remaining) {
            window.TDSPRuntime.setText(
                'gov-ncl-amount',
                formatCompactAda(nclLimit, { fixedFractionDigits: 2 })
            );
            window.TDSPRuntime.setText(
                'gov-ncl-balance',
                `Balance ${formatCompactAda(remaining, { fixedFractionDigits: 2 })}`
            );
            updateEpochCountdown();
        }

        function updateTile() {
            const values = getValues();
            updateCard(values.limit, values.balance);
        }

        function updateEpochCountdown() {
            const element = document.getElementById('gov-ncl-epochs-left');
            if (!element) return;

            const currentEpoch = Number(getClockEpochSnapshot()?.epoch);
            const endEpoch = Number(summary?.end_epoch);
            if (!Number.isFinite(currentEpoch) || !Number.isFinite(endEpoch)) {
                window.TDSPRuntime.setText('gov-ncl-epochs-left', 'Reset in -- epochs');
                element.removeAttribute('title');
                return;
            }

            const resetEpoch = Math.trunc(endEpoch) + 1;
            const epochsLeft = Math.max(resetEpoch - Math.trunc(currentEpoch), 0);
            window.TDSPRuntime.setText('gov-ncl-epochs-left', epochsLeft === 0
                ? 'Reset due'
                : `Reset in ${epochsLeft} epoch${epochsLeft === 1 ? '' : 's'}`);
            const title = `Next NCL period starts in epoch ${resetEpoch}`;
            element.title = window.TDSPI18n?.translateText?.(title) || title;
        }

        function openOverlay(returnFocus) {
            const values = getValues();
            const stats = document.createElement('div');
            stats.className = 'governance-vote-legend governance-ncl-stats';
            stats.append(
                createStatBox({
                    label: 'NCL',
                    detail: formatAdaAmount(values.limit),
                    color: '#5eead4'
                }),
                createStatBox({
                    label: 'Spend',
                    detail: formatAdaAmount(values.spent),
                    color: '#fb7185',
                    onClick: event => openSpentActions(event.currentTarget)
                }),
                createStatBox({
                    label: 'Balance',
                    detail: formatAdaAmount(values.balance),
                    color: '#34d399',
                    onClick: event => openBalanceActions(event.currentTarget)
                }),
                createStatBox({
                    label: 'Net (if all treasury actions are enacted)',
                    detail: formatAdaAmount(values.net),
                    color: values.net < 0 ? '#fb7185' : '#fbbf24'
                })
            );

            const startEpoch = Number(summary?.start_epoch);
            const endEpoch = Number(summary?.end_epoch);
            const epochRange = Number.isFinite(startEpoch) && Number.isFinite(endEpoch)
                ? `Epochs ${startEpoch}-${endEpoch}`
                : '';

            createMenuOverlay({
                id: 'governance-ncl-overlay',
                titleId: 'governance-ncl-title',
                titleText: 'Net Change Limit',
                closeLabel: 'Close Net Change Limit',
                closeOverlay,
                bodyNodes: [stats],
                headerMeta: epochRange,
                returnFocus,
                rootTitle: 'Cardano Governance',
                botContext: createSectionBotContext('Treasury', {
                    title: 'Net Change Limit',
                    id: summary?.action_id || 'ncl',
                    amount_ada: values.limit / 1_000_000,
                    status: summary?.applies_now === true ? 'applies now' : null,
                    root: 'Cardano Governance',
                    summary: [
                        `NCL ${formatAdaAmount(values.limit)}`,
                        `Spend ${formatAdaAmount(values.spent)}`,
                        `Balance ${formatAdaAmount(values.balance)}`,
                        `Net if all treasury actions are enacted ${formatAdaAmount(values.net)}`
                    ].join(' | ')
                })
            });
        }

        function closeOverlay() {
            removeMenuOverlay('governance-ncl-overlay');
        }

        return Object.freeze({
            applyDashboardSummary,
            closeOverlay,
            formatAdaAmount,
            getBalanceActions,
            getPeriod,
            getSpentActions,
            getValues,
            openOverlay,
            updateCard,
            updateEpochCountdown,
            updateTile
        });
    }

    window.TDSPNcl = Object.freeze({
        create: createNclModule
    });
}());
