(function () {
    function translateText(value) {
        const text = String(value || '');
        return window.TDSPI18n?.translateText?.(text) || text;
    }

    function createDrepNclModule({
        formatNclAdaAmount,
        formatVoteChoice,
        getNclBalanceActions,
        getNclPeriod,
        getNclSpentActions,
        getNclValues,
        getProposalTotalAsk
    }) {
        function createSpendBar(drep) {
            const values = getSpendValues(drep);
            const available = Number.isFinite(values.limit) && values.limit > 0;
            const bar = window.TDSPRuntime.createSegmentedBar({
                className: 'drep-ncl-bar',
                trackClassName: 'drep-ncl-bar-track',
                fillClassName: 'drep-ncl-bar-fill',
                legendClassName: 'drep-ncl-bar-label',
                total: available ? Math.max(values.limit + values.pipeline, values.limit) : 1,
                legendText: available ? undefined : 'Current NCL unavailable',
                ariaLabel: available ? undefined : 'Current NCL unavailable',
                segments: [
                    { value: available ? values.spent : 0, label: `NCL Used ${formatNclAdaAmount(values.spent)}`, className: 'drep-ncl-bar-fill--spend', labelClassName: 'drep-ncl-label-item drep-ncl-label-item--used' },
                    { value: available ? values.left : 1, label: `NCL Available ${formatNclAdaAmount(values.left)}`, className: 'drep-ncl-bar-fill--left', labelClassName: 'drep-ncl-label-item drep-ncl-label-item--available' },
                    { value: available ? values.pipeline : 0, label: `Pipeline ${formatNclAdaAmount(values.pipeline)}`, className: 'drep-ncl-bar-fill--pipeline', labelClassName: 'drep-ncl-label-item drep-ncl-label-item--pipeline' }
                ]
            });
            if (!available) {
                bar.title = translateText('Current NCL unavailable');
                return bar;
            }
            bar.title = `${drep?.name || 'DRep'} voted Yes on ${formatNclAdaAmount(values.spent)} of treasury asks in the current NCL period. Current open/ratified NCL pipeline is ${formatNclAdaAmount(values.pipeline)}.`;
            return bar;
        }

        function getSortValue(drep) {
            return getSpendValues(drep).spent || 0;
        }

        function getSpendValues(drep) {
            const values = getNclValues();
            const limit = Number(values?.limit);
            const spent = getDrepYesSpend(drep);
            return {
                limit,
                spent,
                left: Number.isFinite(limit) ? Math.max(limit - spent, 0) : 0,
                pipeline: getPipelineAmount()
            };
        }

        function getDrepYesSpend(drep) {
            const actions = Array.isArray(drep?.voteStats?.actions) ? drep.voteStats.actions : [];
            if (!actions.length) return 0;

            const actionIds = new Set(actions
                .filter(action => formatVoteChoice(action?.vote || action?.vote_bucket) === 'Yes')
                .flatMap(getVoteStatsProposalIds)
                .filter(Boolean));
            if (!actionIds.size) return 0;

            return getCurrentTreasuryActions().reduce((total, proposal) => {
                if (!getProposalIdentifierCandidates(proposal).some(proposalId => actionIds.has(proposalId))) return total;
                return total + getProposalTotalAsk(proposal);
            }, 0);
        }

        function getVoteStatsProposalIds(action) {
            return [
                action?.proposal_id,
                action?.proposalId,
                action?.gov_action_id,
                action?.govActionId,
                action?.action_id,
                action?.id
            ].map(value => String(value || '').trim()).filter(Boolean);
        }

        function getCurrentTreasuryActions() {
            const period = getNclPeriod();
            if (!period) return [];
            const actions = [
                ...getNclSpentActions(),
                ...getNclBalanceActions()
            ];
            const seen = new Set();
            return actions.filter(action => {
                const id = getProposalIdentifierCandidates(action)[0];
                if (!id || seen.has(id) || !isProposalInNclPeriod(action, period)) return false;
                seen.add(id);
                return true;
            });
        }

        function getPipelineAmount() {
            const period = getNclPeriod();
            if (!period) return 0;
            return getNclBalanceActions().reduce((total, proposal) => {
                if (!isProposalInNclPeriod(proposal, period)) return total;
                return total + getProposalTotalAsk(proposal);
            }, 0);
        }

        function isProposalInNclPeriod(proposal, period) {
            const startEpoch = Number(period?.startEpoch);
            const endEpoch = Number(period?.endEpoch);
            if (!Number.isFinite(startEpoch) || !Number.isFinite(endEpoch)) return false;

            return [
                proposal?.enacted_epoch,
                proposal?.ratified_epoch,
                proposal?.proposed_epoch,
                proposal?.proposal_epoch,
                proposal?.epoch
            ].some(value => {
                const epoch = Number(value);
                return Number.isFinite(epoch) && epoch >= startEpoch && epoch <= endEpoch;
            });
        }

        function getProposalIdentifierCandidates(proposal) {
            return [
                proposal?.proposal_id,
                proposal?.proposalId,
                proposal?.gov_action_id,
                proposal?.govActionId,
                proposal?.action_id,
                proposal?.id
            ].map(value => String(value || '').trim()).filter(Boolean);
        }

        return Object.freeze({
            createSpendBar,
            getSortValue,
            getSpendValues
        });
    }

    window.TDSPDrepNcl = Object.freeze({
        create: createDrepNclModule
    });
}());
