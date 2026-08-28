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
        const RATIONALE_TRANSLATION_POLL_LIMIT = 60;
        const RATIONALE_TRANSLATION_POLL_MS = 5000;

        function createRationaleButton(vote, context = {}) {
            if (!vote || !context?.proposal?.proposal_id && !vote?.proposal_id && !vote?.proposalId && !vote?.gov_action_id) return null;
            if (!getDrepIdentifier(vote) && !context?.drepId) return null;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'governance-vote-secondary governance-rationale-read-button';
            setAutoTranslatedText(button, 'Rationale');
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
            appendTransactionLinkRow(content, getTransactionId(vote));

            const title = document.createElement('strong');
            setAutoTranslatedText(title, 'Rationale');
            const text = document.createElement('p');
            text.className = 'governance-proposal-summary-text';
            setAutoTranslatedText(text, rationale || 'Loading vote rationale...');
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
                    setAutoTranslatedText(text, 'Vote rationale could not be loaded from the API. The koios-proxy container may need the latest image or this vote has no on-chain rationale metadata.');
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

        function appendTransactionLinkRow(container, txHash) {
            const cleanHash = cleanText(String(txHash || ''));
            if (!container || !cleanHash) return;
            const existing = container.querySelector('[data-rationale-transaction-row="true"]');
            if (existing) existing.remove();

            const row = document.createElement('div');
            row.className = 'governance-detail-row';
            row.dataset.rationaleTransactionRow = 'true';

            const key = document.createElement('strong');
            setAutoTranslatedText(key, 'Transaction');

            const link = document.createElement('a');
            link.href = `https://cardanoscan.io/transaction/${encodeURIComponent(cleanHash)}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = shortenIdentifier(cleanHash);

            row.appendChild(key);
            row.appendChild(link);
            container.appendChild(row);
        }

        function shortenIdentifier(value) {
            const text = String(value || '').trim();
            return text.length > 28 ? `${text.slice(0, 14)}...${text.slice(-10)}` : text;
        }

        async function loadRationale(vote, { proposalId, drepId, text, content }) {
            if (!proposalId || !drepId) throw new Error('Missing DRep vote rationale lookup data');
            const payload = await fetchJson(getProposalRationaleUrl(proposalId, drepId), { cache: 'no-store' });
            if (!text.isConnected) return;

            applyLoadedRationalePayload(vote, payload, { content });
            const rationale = getRationaleText(vote);
            if (rationale) {
                setAutoTranslatedText(text, rationale);
            } else {
                setAutoTranslatedText(text, 'No on-chain rationale metadata found for this DRep vote.');
            }

            if (payload?._translation?.status === 'pending' && rationale) {
                setAutoTranslatedText(text, getRationaleTranslationPendingMessage());
                pollRationaleTranslation(vote, { proposalId, drepId, text, content }).catch(() => {});
            }
        }

        async function pollRationaleTranslation(vote, { proposalId, drepId, text, content }) {
            for (let attempt = 0; attempt < RATIONALE_TRANSLATION_POLL_LIMIT; attempt += 1) {
                await delay(RATIONALE_TRANSLATION_POLL_MS);
                if (!text.isConnected) return;
                const payload = await fetchJson(getProposalRationaleUrl(proposalId, drepId), { cache: 'no-store' });
                if (!text.isConnected) return;
                applyLoadedRationalePayload(vote, payload, { content });
                if (payload?._translation?.status === 'ready') {
                    const rationale = getRationaleText(vote);
                    setAutoTranslatedText(text, rationale || 'No on-chain rationale metadata found for this DRep vote.');
                    return;
                }
            }
        }

        function applyLoadedRationalePayload(vote, payload, { content }) {
            if (payload?.vote) {
                const voteRows = Array.from(content.querySelectorAll('.governance-detail-row'));
                const hasVoteRow = voteRows.some(row => row.textContent.includes('Vote'));
                if (!hasVoteRow) addDetailRow(content, 'Vote', payload.vote);
            }
            vote.vote_tx_hash = payload?.vote_tx_hash || vote.vote_tx_hash;
            appendTransactionLinkRow(content, getTransactionId(vote));
            vote.tx_metadata = payload?.metadata || vote.tx_metadata;
            vote.onchain_metadata = payload?.metadata || vote.onchain_metadata;
            vote.anchor_metadata = payload?.anchor_metadata || vote.anchor_metadata;
            vote.anchor_rationale = payload?.rationale_source === 'anchor' ? payload?.rationale || vote.anchor_rationale : vote.anchor_rationale;
            vote.rationale = payload?.rationale || vote.rationale;
            vote._translation = payload?._translation || vote._translation;
        }

        function delay(ms) {
            return new Promise(resolve => window.setTimeout(resolve, ms));
        }

        function getRationaleTranslationPendingMessage() {
            return 'Translating vote rationale to selected language...';
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

        function normalizeOnchainMetadataNumber(value) {
            if (value === null || value === undefined || value === '') return null;
            const number = Number(value);
            if (!Number.isFinite(number)) return null;
            if (Number.isInteger(number) && Number.isSafeInteger(number)) return number;
            return String(value);
        }

        function normalizeNullableNumber(value) {
            const number = Number(value);
            return Number.isFinite(number) ? number : null;
        }

        return Object.freeze({
            createRationaleButton,
            getRationaleText,
            getTransactionId,
            normalizeNullableNumber,
            normalizeOnchainMetadataNumber
        });
    }

    window.TDSPDrepVotes = Object.freeze({
        create: createDrepVotes
    });
}());
