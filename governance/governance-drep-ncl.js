(function () {
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
            const bar = document.createElement('div');
            bar.className = 'drep-ncl-bar';

            const track = document.createElement('div');
            track.className = 'drep-ncl-bar-track';
            track.setAttribute('aria-hidden', 'true');

            const spendFill = document.createElement('span');
            spendFill.className = 'drep-ncl-bar-fill drep-ncl-bar-fill--spend';
            const leftFill = document.createElement('span');
            leftFill.className = 'drep-ncl-bar-fill drep-ncl-bar-fill--left';
            track.append(spendFill, leftFill);

            const label = document.createElement('span');
            label.className = 'governance-card-detail drep-ncl-bar-label';

            const values = getSpendValues(drep);
            if (!Number.isFinite(values.limit) || values.limit <= 0) {
                spendFill.style.flexBasis = '0%';
                leftFill.style.flexBasis = '100%';
                label.textContent = 'Current NCL unavailable';
                bar.append(track, label);
                return bar;
            }

            const spentPercent = Math.min(Math.max((values.spent / values.limit) * 100, 0), 100);
            spendFill.style.flexBasis = `${spentPercent}%`;
            leftFill.style.flexBasis = `${Math.max(100 - spentPercent, 0)}%`;
            label.textContent = [
                `DRep Yes NCL ${formatNclAdaAmount(values.spent)}`,
                `NCL Available ${formatNclAdaAmount(values.left)}`,
                values.pipeline > 0 ? `Pipeline ${formatNclAdaAmount(values.pipeline)}` : null
            ].filter(Boolean).join(' • ');
            bar.title = `${drep?.name || 'DRep'} voted Yes on ${formatNclAdaAmount(values.spent)} of treasury asks in the current NCL period. Current open/ratified NCL pipeline is ${formatNclAdaAmount(values.pipeline)}.`;
            bar.append(track, label);
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
