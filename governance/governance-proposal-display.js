(function () {
    function createProposalDisplay({
        formatPercentage,
        getApprovalThreshold,
        getEffectiveProposalType,
        getGovernanceStatus
    }) {
        function getTitle(proposal) {
            return proposal?.meta_json?.body?.title
                || proposal?.meta_json?.title
                || `${window.TDSPRuntime.formatReadableLabel(getEffectiveProposalType(proposal), 'Governance')} governance action`;
        }

        function getMeta(proposal) {
            const parts = [`Epoch ${proposal?.proposed_epoch}`];
            if (proposal?.expiration !== null) parts.push(`expires ${proposal.expiration}`);
            if (proposal?.enacted_epoch !== null) parts.push(`enacted ${proposal.enacted_epoch}`);
            if (proposal?.ratified_epoch !== null) parts.push(`ratified ${proposal.ratified_epoch}`);
            if (proposal?.expired_epoch !== null) parts.push(`expired ${proposal.expired_epoch}`);
            if (proposal?.dropped_epoch !== null) parts.push(`dropped ${proposal.dropped_epoch}`);
            return parts.join(' - ');
        }

        function getExpirationText(proposal) {
            if (proposal?.expired_epoch !== null) return `Expired epoch ${proposal.expired_epoch}`;
            if (proposal?.dropped_epoch !== null) return `Dropped epoch ${proposal.dropped_epoch}`;
            if (proposal?.expiration !== null) return `Expires epoch ${proposal.expiration}`;
            return 'No expiration data';
        }

        function getVoteColorClass(percentages, source = 'drep', proposal = null) {
            const yes = Number(percentages?.yes);
            if (!Number.isFinite(yes)) return 'vote-neutral';

            const threshold = getApprovalThreshold(proposal, source);
            if (yes >= threshold) return 'vote-green';
            if (yes >= threshold / 2) return 'vote-orange';
            return 'vote-red';
        }

        function formatVotePercentages(percentages) {
            if (!percentages) return '';

            return [
                `Yes ${formatPercentage(percentages.yes)}`,
                `No - Not Voted ${formatPercentage(percentages.no)}`
            ].join(' | ');
        }

        function getGroupSignature(proposals) {
            return JSON.stringify(proposals.map(proposal => ({
                proposal_id: proposal.proposal_id,
                status: getGovernanceStatus(proposal),
                expiration: proposal.expiration,
                ratified_epoch: proposal.ratified_epoch,
                enacted_epoch: proposal.enacted_epoch,
                expired_epoch: proposal.expired_epoch,
                dropped_epoch: proposal.dropped_epoch,
                voteDisplay: proposal.voteDisplay,
                votePercentages: proposal.votePercentages
            })));
        }

        return Object.freeze({
            formatVotePercentages,
            getExpirationText,
            getGroupSignature,
            getMeta,
            getTitle,
            getVoteColorClass
        });
    }

    window.TDSPProposalDisplay = Object.freeze({
        create: createProposalDisplay
    });
}());
