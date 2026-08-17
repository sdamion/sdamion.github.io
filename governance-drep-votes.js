(function () {
    function createDrepVotes({
        addDetailRow,
        cleanText,
        createBotContext,
        createMenuOverlay,
        fetchJson,
        formatVoteChoice,
        getDrepIdentifier,
        getDrepName,
        getProposalMeta,
        getProposalRationaleUrl,
        getProposalTitle,
        removeMenuOverlay
    }) {
        function createRationaleButton(vote, context = {}) {
            if (!vote || !context?.proposal?.proposal_id && !vote?.proposal_id && !vote?.proposalId && !vote?.gov_action_id) return null;
            if (!getDrepIdentifier(vote) && !context?.drepId) return null;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'governance-vote-secondary governance-rationale-read-button';
            button.textContent = 'Rationale';
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                openRationaleOverlay(vote, event.currentTarget, context);
            });
            return button;
        }

        function openRationaleOverlay(vote, returnFocus, context = {}) {
            const rationale = getRationaleText(vote);
            const content = document.createElement('div');
            content.className = 'governance-menu-card governance-vote-rationale-display';
            const proposalId = context.proposal?.proposal_id || vote?.gov_action_id || vote?.proposal_id || vote?.proposalId || '';

            addDetailRow(content, 'DRep', context.drepName || getDrepName(vote));
            addDetailRow(content, 'Vote', context.voteChoice || formatVoteChoice(vote?.vote || vote?.vote_bucket));
            addDetailRow(content, 'Governance action', context.proposal ? getProposalTitle(context.proposal) : '');
            addDetailRow(content, 'Action ID', proposalId);
            addDetailRow(content, 'Transaction', getTransactionId(vote));

            const title = document.createElement('strong');
            title.textContent = 'Rationale';
            const text = document.createElement('p');
            text.className = 'governance-proposal-summary-text';
            text.textContent = rationale || 'Loading vote rationale...';
            content.append(title, text);

            createMenuOverlay({
                id: 'governance-vote-rationale-display-overlay',
                titleId: 'governance-vote-rationale-display-title',
                titleText: 'Vote rationale',
                closeLabel: 'Close vote rationale',
                closeOverlay: closeRationaleOverlay,
                bodyNodes: [content],
                headerMeta: context.proposal ? getProposalMeta(context.proposal) : '',
                overlayClass: 'governance-action-detail-overlay',
                returnFocus,
                botContext: context.proposal
                    ? createBotContext(context.proposal)
                    : {
                        kind: 'drep_vote_rationale',
                        title: 'Vote rationale',
                        summary: rationale
                    }
            });

            if (!rationale) {
                loadRationale(vote, {
                    proposalId,
                    drepId: getDrepIdentifier(vote) || context.drepId,
                    text,
                    content
                }).catch(() => {
                    if (!text.isConnected) return;
                    text.textContent = 'Vote rationale could not be loaded from the API. The koios-proxy container may need the latest image or this vote has no on-chain rationale metadata.';
                });
            }
        }

        function closeRationaleOverlay() {
            removeMenuOverlay('governance-vote-rationale-display-overlay');
        }

        function getTransactionId(vote) {
            return vote?.tx_hash
                || vote?.txHash
                || vote?.tx_id
                || vote?.txId
                || vote?.vote_tx_hash
                || vote?.transaction_id
                || vote?.transactionId
                || '';
        }

        async function loadRationale(vote, { proposalId, drepId, text, content }) {
            if (!proposalId || !drepId) throw new Error('Missing DRep vote rationale lookup data');
            const payload = await fetchJson(getProposalRationaleUrl(proposalId, drepId), { cache: 'no-store' });
            if (!text.isConnected) return;

            if (payload?.vote) {
                const voteRows = Array.from(content.querySelectorAll('.governance-detail-row'));
                const hasVoteRow = voteRows.some(row => row.textContent.includes('Vote'));
                if (!hasVoteRow) addDetailRow(content, 'Vote', payload.vote);
            }
            if (payload?.vote_tx_hash && !getTransactionId(vote)) {
                addDetailRow(content, 'Transaction', payload.vote_tx_hash);
            }

            vote.vote_tx_hash = payload?.vote_tx_hash || vote.vote_tx_hash;
            vote.tx_metadata = payload?.metadata || vote.tx_metadata;
            vote.onchain_metadata = payload?.metadata || vote.onchain_metadata;
            vote.rationale = payload?.rationale || vote.rationale;

            const rationale = getRationaleText(vote);
            text.textContent = rationale || 'No on-chain rationale metadata found for this DRep vote.';
        }

        function getRationaleText(vote) {
            const directCandidates = [
                vote?.rationale,
                vote?.vote_rationale,
                vote?.voteRationale,
                vote?.rationale_text,
                vote?.rationaleText,
                vote?.reason,
                vote?.metadata?.rationale,
                vote?.tx_metadata?.rationale,
                vote?.auxiliary_data?.rationale,
                vote?.onchain_metadata?.rationale,
                vote?.on_chain_metadata?.rationale,
                vote?.metadata?.['1694']?.rationale,
                vote?.tx_metadata?.['1694']?.rationale,
                vote?.auxiliary_data?.['1694']?.rationale,
                vote?.onchain_metadata?.['1694']?.rationale,
                vote?.on_chain_metadata?.['1694']?.rationale
            ];

            for (const candidate of directCandidates) {
                const text = normalizeRationaleValue(candidate);
                if (text) return text;
            }

            for (const root of [
                vote?.metadata,
                vote?.tx_metadata,
                vote?.auxiliary_data,
                vote?.onchain_metadata,
                vote?.on_chain_metadata,
                vote?.meta_json
            ]) {
                const text = findRationaleInObject(root);
                if (text) return text;
            }

            return '';
        }

        function findRationaleInObject(value, depth = 0) {
            if (!value || depth > 4 || typeof value !== 'object') return '';
            if (Object.prototype.hasOwnProperty.call(value, 'rationale')) {
                const text = normalizeRationaleValue(value.rationale);
                if (text) return text;
            }

            const preferredKeys = ['1694', 'metadata', 'tx_metadata', 'auxiliary_data', 'json', 'body', 'data'];
            for (const key of preferredKeys) {
                if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
                const text = findRationaleInObject(value[key], depth + 1);
                if (text) return text;
            }

            for (const entry of Object.values(value)) {
                const text = findRationaleInObject(entry, depth + 1);
                if (text) return text;
            }
            return '';
        }

        function normalizeRationaleValue(value) {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return cleanText(value.trim());
            if (Array.isArray(value)) {
                if (value.every(entry => typeof entry === 'string')) {
                    return cleanText(value.join('').trim());
                }
                return cleanText(value.map(normalizeRationaleValue).filter(Boolean).join('\n').trim());
            }
            if (typeof value === 'object') {
                if (Object.prototype.hasOwnProperty.call(value, 'text')) return normalizeRationaleValue(value.text);
                if (Object.prototype.hasOwnProperty.call(value, 'value')) return normalizeRationaleValue(value.value);
            }
            return '';
        }

        return Object.freeze({
            createRationaleButton,
            getRationaleText,
            getTransactionId
        });
    }

    window.TDSPDrepVotes = Object.freeze({
        create: createDrepVotes
    });
}());
