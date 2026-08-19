(function () {
    function translateText(value) {
        const text = String(value || '');
        return window.TDSPI18n?.translateText?.(text) || text;
    }

    function setAutoTranslatedText(element, value) {
        if (!(element instanceof HTMLElement)) return;
        const text = String(value || '');
        element.setAttribute('data-i18n-auto', '');
        element.setAttribute('data-i18n-auto-original', text);
        element.textContent = translateText(text);
    }

    function createDrepTop10Module({
        bindOpen,
        formatVoteChoice,
        getIdentifiers,
        isApplicable,
        isClosed,
        normalizeIdentifier,
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
                .map(key => `${translateText(key)}: ${counts.get(key)}`);
            return parts.length ? parts.join(' • ') : translateText('No vote data');
        }

        function createVoteChip(drep, choice) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `governance-top-drep-vote-chip ${getVoteChoiceClass(choice)}`;
            bindOpen(chip, event => {
                event.stopPropagation();
                onOpenDrep(drep, event.currentTarget);
            });

            const name = document.createElement('strong');
            name.textContent = drep?.name || 'DRep';
            const vote = document.createElement('span');
            setAutoTranslatedText(vote, choice || 'Unknown');
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

        function isVoteStatsPayloadStale(voteStatsPayload, maxAgeMs) {
            const updatedAt = Date.parse(String(
                voteStatsPayload?.updated_at
                || voteStatsPayload?.generated_at
                || voteStatsPayload?.created_at
                || ''
            ));
            return !Number.isFinite(updatedAt) || Date.now() - updatedAt > maxAgeMs;
        }

        function createCachedVoteDetailPayload(drep, voteStatsPayload) {
            const statsByDrep = voteStatsPayload?.dreps && typeof voteStatsPayload.dreps === 'object'
                ? voteStatsPayload.dreps
                : {};
            const identifiers = (typeof getIdentifiers === 'function' ? getIdentifiers(drep) : [])
                .map(normalizeIdentifier)
                .filter(Boolean);
            const cachedId = identifiers.find(identifier => statsByDrep[identifier])
                || identifiers.map(shortenDrepIdentifier).find(identifier => statsByDrep[identifier]);
            const cachedStats = cachedId ? statsByDrep[cachedId] : null;

            return {
                drep_id: drep?.id || cachedId || identifiers[0] || '',
                info: {
                    amount: drep?.votingPower,
                    active: drep?.active === true
                },
                metadata: {
                    meta_json: {
                        body: {
                            givenName: drep?.name || cachedId || identifiers[0] || 'DRep'
                        }
                    }
                },
                vote_stats: {
                    source: voteStatsPayload?.source || 'cache',
                    updated_at: voteStatsPayload?.updated_at || null,
                    cached_proposals: voteStatsPayload?.cached_proposals || 0,
                    total_proposals: voteStatsPayload?.total_proposals || 0,
                    ...(cachedStats && typeof cachedStats === 'object' ? cachedStats : {}),
                    vote_count: Number(cachedStats?.vote_count) || 0,
                    actions: Array.isArray(cachedStats?.actions) ? cachedStats.actions : []
                }
            };
        }

        function shortenDrepIdentifier(value) {
            const text = String(value || '');
            if (text.length <= 24) return text;
            return `${text.slice(0, 14)}...${text.slice(-8)}`;
        }

        return Object.freeze({
            createCachedVoteDetailPayload,
            createVoteChip,
            formatSameVoteLine,
            getVoteMatrixChoice,
            isVoteStatsPayloadStale
        });
    }

    window.TDSPDrepTop10 = Object.freeze({
        create: createDrepTop10Module
    });
}());
