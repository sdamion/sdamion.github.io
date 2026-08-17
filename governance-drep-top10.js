(function () {
    function createDrepTop10Module({
        bindOpen,
        formatVoteChoice,
        isApplicable,
        isClosed,
        onOpenDrep
    }) {
        function getVoteMatrixChoice(drep, proposal) {
            const applicable = isApplicable(
                proposal,
                drep?.registrationTime,
                drep?.eligibility
            );
            const action = drep?.actionsById?.get(String(proposal?.proposal_id || '')) || null;
            if (action) return formatVoteChoice(action?.vote || action?.vote_bucket);
            if (!applicable) return 'Not applicable';
            return isClosed(proposal) ? 'Not voted' : 'Not voted yet';
        }

        function formatSameVoteLine(rows) {
            const counts = rows.reduce((totals, row) => {
                const key = row.choice || 'Unknown';
                totals.set(key, (totals.get(key) || 0) + 1);
                return totals;
            }, new Map());
            const order = ['Yes', 'No', 'Abstain', 'Not voted', 'Not voted yet', 'Not applicable', 'Unknown'];
            const parts = order
                .filter(key => counts.has(key))
                .map(key => `${key}: ${counts.get(key)}`);
            return parts.length ? parts.join(' • ') : 'No vote data';
        }

        function createVoteChip(drep, choice) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `governance-top-drep-vote-chip ${getVoteChoiceClass(choice)}`;
            bindOpen(chip, event => onOpenDrep(drep, event.currentTarget));

            const name = document.createElement('strong');
            name.textContent = drep?.name || 'DRep';
            const vote = document.createElement('span');
            vote.textContent = choice || 'Unknown';
            chip.append(name, vote);
            return chip;
        }

        function getVoteChoiceClass(choice) {
            if (choice === 'Yes') return 'is-yes';
            if (choice === 'No' || choice === 'Not voted') return 'is-no';
            if (choice === 'Abstain') return 'is-abstain';
            if (choice === 'Not voted yet') return 'is-pending';
            if (choice === 'Not applicable') return 'is-muted';
            return 'is-unknown';
        }

        return Object.freeze({
            createVoteChip,
            formatSameVoteLine,
            getVoteMatrixChoice
        });
    }

    window.TDSPDrepTop10 = Object.freeze({
        create: createDrepTop10Module
    });
}());
