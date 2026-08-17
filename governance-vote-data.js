(function () {
    function createVoteData({
        getSpoVoteIdentifier,
        normalizeIdentifier,
        pickFirstNumber
    }) {
        function mapBreakdownKeyToVote(key) {
            if (key === 'yes') return 'yes';
            if (key === 'no') return 'no';
            if (key === 'abstain') return 'abstain';
            return null;
        }

        function getDrepStakeBreakdown(summary, nonVoters = {}) {
            if (!summary) return [];
            const notVotedDreps = nonVoters.notVoted || [];
            const notADrepYet = nonVoters.notADrepYet || [];
            const notActiveDreps = nonVoters.notActive || [];

            const yesVotePower = pickFirstNumber(
                summary.drep_yes_vote_power,
                summary.drep_active_yes_vote_power
            ) ?? 0;
            const noVotePowerTotal = pickFirstNumber(
                summary.drep_no_vote_power,
                summary.drep_active_no_vote_power
            ) ?? 0;
            const activeNoVotePower = pickFirstNumber(
                summary.drep_active_no_vote_power,
                summary.drep_no_vote_power
            ) ?? 0;
            const notVotedPower = Math.max(0, noVotePowerTotal - activeNoVotePower);
            const abstainVotePower = Number(summary.drep_active_abstain_vote_power) || 0;
            const yesVoteCount = Number(summary.drep_yes_votes_cast) || 0;
            const noVoteCount = Number(summary.drep_no_votes_cast) || 0;
            const abstainVoteCount = Number(summary.drep_abstain_votes_cast) || 0;

            const items = [
                {
                    key: 'yes',
                    label: 'Yes',
                    value: yesVotePower,
                    count: yesVoteCount,
                    color: '#34d399'
                },
                {
                    key: 'no',
                    label: 'No',
                    value: activeNoVotePower,
                    count: noVoteCount,
                    color: '#f87171'
                },
                {
                    key: 'not-voted',
                    label: 'Not voted',
                    value: notVotedPower,
                    count: notVotedDreps.length,
                    votes: notVotedDreps,
                    color: '#fb7185'
                },
                {
                    key: 'not-a-drep-yet',
                    label: 'Not a DRep Yet',
                    value: 0,
                    count: notADrepYet.length,
                    countLabel: 'DReps',
                    votes: notADrepYet,
                    color: '#94a3b8',
                    excludedFromPercentage: true,
                    omitValue: true
                },
                {
                    key: 'not-active-drep',
                    label: 'Not an Active DRep',
                    value: 0,
                    count: notActiveDreps.length,
                    countLabel: 'DReps',
                    votes: notActiveDreps,
                    color: '#64748b',
                    excludedFromPercentage: true,
                    omitValue: true
                },
                {
                    key: 'abstain',
                    label: 'Abstain',
                    value: 0,
                    displayValue: abstainVotePower,
                    count: abstainVoteCount,
                    color: '#60a5fa',
                    excludedFromPercentage: true
                }
            ];

            const representedPower = items.reduce((sum, item) => sum + item.value, 0);
            return items
                .filter(item => item.value > 0 || item.excludedFromPercentage && (item.count > 0 || Number(item.displayValue) > 0))
                .map(item => ({
                    ...item,
                    votePowerPercentage: representedPower > 0
                        ? (item.value / representedPower) * 100
                        : 0
                }));
        }

        function getDrepVotes(payload) {
            const dreps = payload?.votes?.dreps;
            if (Array.isArray(dreps)) return dreps;
            if (!dreps || typeof dreps !== 'object') return [];

            const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
                ? payload.drep_info
                : {};

            return ['yes', 'no', 'abstain', 'unknown'].flatMap(key => {
                const bucket = dreps[key];
                if (!Array.isArray(bucket)) return [];

                return bucket.map(vote => {
                    const info = drepInfo[vote?.voter_id]
                        || drepInfo[vote?.drep_id]
                        || drepInfo[vote?.voter_hex]
                        || drepInfo[vote?.hex]
                        || null;
                    if (!info) return vote;

                    return {
                        ...info,
                        ...vote,
                        amount: vote?.amount ?? info?.amount ?? '',
                        drep_id: vote?.drep_id || info?.drep_id || vote?.voter_id || '',
                        voter_hex: vote?.voter_hex || info?.hex || ''
                    };
                });
            });
        }

        function getSpoVotes(payload) {
            const spos = payload?.votes?.spos
                ?? payload?.votes?.spo
                ?? payload?.votes?.pools;
            const spoInfo = payload?.spo_info && typeof payload.spo_info === 'object'
                ? payload.spo_info
                : {};
            const enrichVote = vote => {
                const identifier = getSpoVoteIdentifier(vote);
                return {
                    ...(spoInfo[identifier] || {}),
                    ...vote
                };
            };

            if (Array.isArray(spos)) return spos.map(enrichVote);
            if (!spos || typeof spos !== 'object') return [];

            return ['yes', 'no', 'abstain', 'unknown'].flatMap(key => {
                const bucket = spos[key];
                if (!Array.isArray(bucket)) return [];
                return bucket.map(vote => enrichVote({
                    ...vote,
                    vote: vote?.vote || key
                }));
            });
        }

        function getDrepVoteIdentifierCandidates(vote) {
            return [
                vote?.voter_id,
                vote?.voterId,
                vote?.drep_id,
                vote?.drepId,
                vote?.voter_hex,
                vote?.hex,
                vote?.id
            ]
                .map(normalizeIdentifier)
                .filter(Boolean);
        }

        function getDrepNonVoterGroups(payload, drepVotes) {
            const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
                ? payload.drep_info
                : {};
            const eligibility = payload?.drep_eligibility && typeof payload.drep_eligibility === 'object'
                ? payload.drep_eligibility
                : {};
            const votedIds = new Set(drepVotes.flatMap(getDrepVoteIdentifierCandidates));

            const nonVoters = Object.entries(drepInfo)
                .filter(([identifier, info]) => !getDrepVoteIdentifierCandidates({ ...info, drep_id: identifier }).some(id => votedIds.has(id)))
                .map(([identifier, info]) => ({
                    ...info,
                    vote: 'Not voted',
                    eligibility_status: eligibility[identifier]?.status || 'unknown',
                    drep_id: info?.drep_id || identifier,
                    voter_id: info?.voter_id || info?.drep_id || identifier,
                    voter_hex: info?.voter_hex || info?.hex || ''
                }));
            return {
                notVoted: nonVoters.filter(drep => !['not_a_drep_yet', 'not_active'].includes(drep.eligibility_status)),
                notADrepYet: nonVoters.filter(drep => drep.eligibility_status === 'not_a_drep_yet'),
                notActive: nonVoters.filter(drep => drep.eligibility_status === 'not_active')
            };
        }

        return Object.freeze({
            getDrepNonVoterGroups,
            getDrepStakeBreakdown,
            getDrepVoteIdentifierCandidates,
            getDrepVotes,
            getSpoVotes,
            mapBreakdownKeyToVote
        });
    }

    window.TDSPVoteData = Object.freeze({
        create: createVoteData
    });
}());
