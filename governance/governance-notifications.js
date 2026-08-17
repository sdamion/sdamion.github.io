(function () {
    function createGovernanceNotifications({
        actionThreshold = 67,
        getProposalTitle,
        getProposalType,
        infoActionThreshold = 50,
        storageKey = 'tdsp-governance-notification-state-v1'
    }) {
        function check(proposals) {
            if (!Array.isArray(proposals) || !proposals.length) return;

            const previousState = readState();
            const nextState = createState(proposals);
            writeState(nextState);
            if (!previousState) return;

            const previousIds = new Set(Array.isArray(previousState.proposalIds) ? previousState.proposalIds : []);
            const newProposals = proposals.filter(proposal => {
                const id = getProposalId(proposal);
                return id && !previousIds.has(id);
            });

            const previousCommitteeVotes = previousState.committeeVotes && typeof previousState.committeeVotes === 'object'
                ? previousState.committeeVotes
                : {};
            const previousThresholds = previousState.yesThresholds && typeof previousState.yesThresholds === 'object'
                ? previousState.yesThresholds
                : null;
            const committeeUpdates = proposals.filter(proposal => {
                const id = getProposalId(proposal);
                if (!id || !previousCommitteeVotes[id]) return false;
                const previous = previousCommitteeVotes[id];
                const next = nextState.committeeVotes[id];
                return next && next !== previous && getCommitteeVoteTotal(next) > getCommitteeVoteTotal(previous);
            });
            const thresholdUpdates = previousThresholds
                ? proposals.filter(proposal => {
                    const id = getProposalId(proposal);
                    if (!id || !previousThresholds[id]) return false;
                    const previous = previousThresholds[id];
                    const next = nextState.yesThresholds[id];
                    return next?.passed === true && previous?.passed !== true;
                })
                : [];

            const events = [];
            newProposals.slice(0, 5).forEach(proposal => {
                events.push({
                    type: 'new-action',
                    title: 'New governance action',
                    body: getProposalTitle(proposal),
                    proposal
                });
            });
            committeeUpdates.slice(0, 5).forEach(proposal => {
                events.push({
                    type: 'cc-vote',
                    title: 'CC member vote update',
                    body: getProposalTitle(proposal),
                    proposal
                });
            });
            thresholdUpdates.slice(0, 5).forEach(proposal => {
                const threshold = getThresholdInfo(proposal);
                const yesPct = formatPercentage(threshold?.yesPct);
                const thresholdPct = formatPercentage(threshold?.threshold);
                events.push({
                    type: 'yes-threshold',
                    title: 'Governance yes threshold reached',
                    body: `${getProposalTitle(proposal)} reached ${yesPct} Yes (${thresholdPct} threshold).`,
                    proposal
                });
            });
            if (!events.length) return;

            notify(events);
        }

        function createState(proposals) {
            const proposalIds = [];
            const committeeVotes = {};
            const yesThresholds = {};
            proposals.forEach(proposal => {
                const id = getProposalId(proposal);
                if (!id) return;
                proposalIds.push(id);
                committeeVotes[id] = getCommitteeVoteSignature(proposal);
                const threshold = getThresholdInfo(proposal);
                if (threshold) {
                    yesThresholds[id] = {
                        yesPct: threshold.yesPct,
                        threshold: threshold.threshold,
                        passed: threshold.passed
                    };
                }
            });
            return {
                proposalIds: Array.from(new Set(proposalIds)).sort(),
                committeeVotes,
                yesThresholds,
                updatedAt: Date.now()
            };
        }

        function readState() {
            try {
                const raw = localStorage.getItem(storageKey);
                return raw ? JSON.parse(raw) : null;
            } catch {
                return null;
            }
        }

        function writeState(state) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(state));
            } catch {}
        }

        function getProposalId(proposal) {
            return String(proposal?.proposal_id || proposal?.id || proposal?.gov_action_id || '').trim();
        }

        function getCommitteeVoteSignature(proposal) {
            const summary = proposal?.summary || proposal?.vote_summary || proposal?.voteSummary || {};
            const yes = getNumericVoteField(summary, [
                'committee_yes_votes_cast',
                'committee_yes_votes',
                'committeeYesVotesCast',
                'committeeYesVotes'
            ]);
            const no = getNumericVoteField(summary, [
                'committee_no_votes_cast',
                'committee_no_votes',
                'committeeNoVotesCast',
                'committeeNoVotes'
            ]);
            const abstain = getNumericVoteField(summary, [
                'committee_abstain_votes_cast',
                'committee_abstain_votes',
                'committeeAbstainVotesCast',
                'committeeAbstainVotes'
            ]);
            return `${yes}:${no}:${abstain}`;
        }

        function getNumericVoteField(source, keys) {
            for (const key of keys) {
                const value = Number(source?.[key]);
                if (Number.isFinite(value)) return value;
            }
            return 0;
        }

        function getCommitteeVoteTotal(signature) {
            return String(signature || '')
                .split(':')
                .reduce((sum, value) => sum + (Number(value) || 0), 0);
        }

        function getThresholdInfo(proposal) {
            if (!proposal || proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return null;
            const yesPct = Number(proposal?.votePercentages?.yes);
            if (!Number.isFinite(yesPct)) return null;
            const isInfoAction = String(getProposalType(proposal)).toLowerCase() === 'infoaction';
            const threshold = isInfoAction ? infoActionThreshold : actionThreshold;
            return {
                yesPct,
                threshold,
                passed: yesPct >= threshold
            };
        }

        function formatPercentage(value) {
            const number = Number(value);
            if (!Number.isFinite(number)) return '0%';
            return `${number.toLocaleString('en-US', {
                maximumFractionDigits: number % 1 === 0 ? 0 : 2
            })}%`;
        }

        function notify(events) {
            const title = events.length === 1 ? events[0].title : 'Governance updates';
            const body = events.length === 1
                ? events[0].body
                : `${events.length.toLocaleString('en-US')} governance updates on TDSP.`;
            if (window.TDSPAlerts?.send) {
                window.TDSPAlerts.send(title, body, 'tdsp-governance-updates', 'governance');
                return;
            }
            if (!('Notification' in window) || Notification.permission !== 'granted') return;
            new Notification(title, {
                body,
                tag: 'tdsp-governance-updates'
            });
        }

        return Object.freeze({
            check,
            createState,
            getCommitteeVoteSignature,
            getThresholdInfo
        });
    }

    window.TDSPGovernanceNotifications = Object.freeze({
        create: createGovernanceNotifications
    });
}());
