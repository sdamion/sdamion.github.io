(function () {
    function createCipDirectory({
        addDetailRow,
        addMarkdownDetailSection,
        cleanText,
        createBotContext,
        createCopyButton,
        createMenuOverlay,
        createSectionBotContext,
        getState,
        loadDirectory,
        removeMenuOverlay,
        updateMenuBotContext,
        updateMenuHeaderMeta
    }) {
        function setAutoTranslatedText(element, text) {
            if (!(element instanceof HTMLElement)) return;
            const value = String(text || '').replace(/\s+/g, ' ').trim();
            element.setAttribute('data-i18n-auto', '');
            element.setAttribute('data-i18n-auto-original', value);
            element.textContent = window.TDSPI18n?.translateText?.(value) || value;
        }

        async function openDirectoryOverlay(returnFocus = document.activeElement) {
            const panel = document.createElement('div');
            panel.className = 'governance-list governance-action-group-list';
            const loading = document.createElement('p');
            loading.className = 'small-text';
            setAutoTranslatedText(loading, 'Loading CIPs...');
            panel.appendChild(loading);

            const currentState = getState();
            createMenuOverlay({
                id: 'governance-cips-overlay',
                titleId: 'governance-cips-title',
                titleText: 'Cardano Improvement Proposals',
                closeLabel: 'Close CIPs',
                closeOverlay: closeDirectoryOverlay,
                bodyNodes: [panel],
                headerMeta: currentState
                    ? `${(currentState.cips || []).length.toLocaleString('en-US')} CIPs`
                    : 'Loading...',
                returnFocus,
                rootTitle: window.TDSPI18n?.translateText?.('Cardano Governance') || 'Cardano Governance',
                defaultSort: 'cip-asc',
                searchPlaceholder: 'Search by CIP number, title, status or text',
                botContext: createSectionBotContext('CIPs', {
                    title: 'Cardano Improvement Proposals',
                    count: Array.isArray(currentState?.cips) ? currentState.cips.length : null,
                    summary: 'Cardano Improvement Proposals cached from the official CIP repository'
                })
            });

            try {
                const payload = getState() || await loadDirectory();
                if (!panel.isConnected) return;
                const cips = normalizeDirectory(payload);
                panel.replaceChildren();
                cips.forEach(cip => panel.appendChild(createCard(cip)));
                if (!cips.length) {
                    const empty = window.TDSPRuntime.createSmallText('No CIPs are available yet.');
                    setAutoTranslatedText(empty, 'No CIPs are available yet.');
                    panel.appendChild(empty);
                }
                updateMenuHeaderMeta(
                    'governance-cips-overlay',
                    `${cips.length.toLocaleString('en-US')} CIPs`,
                    panel
                );
                updateMenuBotContext(
                    'governance-cips-overlay',
                    createSectionBotContext('CIPs', {
                        title: 'Cardano Improvement Proposals',
                        count: cips.length,
                        summary: 'Cardano Improvement Proposals cached from the official CIP repository'
                    }),
                    panel
                );
            } catch (error) {
                console.error('CIPs could not be rendered', error);
                if (!panel.isConnected) return;
                panel.replaceChildren();
                const message = document.createElement('p');
                message.className = 'small-text';
                setAutoTranslatedText(message, 'CIPs could not be loaded.');
                panel.appendChild(message);
            }
        }

        function closeDirectoryOverlay() {
            removeMenuOverlay('governance-cips-overlay');
        }

        function normalizeDirectory(payload) {
            return (Array.isArray(payload?.cips) ? payload.cips : [])
                .map(cip => ({
                    ...cip,
                    id: String(cip?.id || '').trim(),
                    title: cleanText(cip?.title || 'Untitled CIP'),
                    status: cleanText(cip?.status || 'Unknown'),
                    category: cleanText(cip?.category || ''),
                    authors: Array.isArray(cip?.authors) ? cip.authors.filter(Boolean) : [],
                    abstract: cleanText(cip?.abstract || ''),
                    motivation: cleanText(cip?.motivation || ''),
                    created_at: cleanText(cip?.created_at || ''),
                    source_url: String(cip?.source_url || '').trim(),
                    website_url: String(cip?.website_url || '').trim(),
                    markdown: String(cip?.markdown || '').trim(),
                    number: Number(cip?.number)
                }))
                .filter(cip => cip.id)
                .sort((left, right) => (
                    (Number.isFinite(left.number) ? left.number : Number.MAX_SAFE_INTEGER)
                    - (Number.isFinite(right.number) ? right.number : Number.MAX_SAFE_INTEGER)
                ));
        }

        function createCard(cip) {
            const card = document.createElement('div');
            card.className = 'governance-card governance-menu-card';
            card.dataset.searchText = [
                cip.id,
                `cip ${cip.number}`,
                `cip${cip.number}`,
                cip.title,
                cip.status,
                cip.category,
                cip.authors.join(' '),
                cip.abstract,
                cip.motivation
            ].filter(Boolean).join(' ');
            card.dataset.sortName = cip.id;
            card.dataset.sortCip = String(Number.isFinite(cip.number) ? cip.number : Number.MAX_SAFE_INTEGER);

            const openButton = document.createElement('button');
            openButton.type = 'button';
            openButton.className = 'governance-card-open';
            window.TDSPRuntime?.bindMenuTrigger?.(openButton, event => {
                openDetailOverlay(cip, event.currentTarget);
            }, {
                datasetKey: 'cipBound',
                errorMessage: 'CIP details could not be opened.'
            });

            window.TDSPRuntime?.appendUniversalTileContent?.(openButton, {
                title: `${cip.id}: ${cip.title}`,
                primaryText: cip.status,
                contextItems: [cip.category, cip.authors.length ? cip.authors.join(', ') : null],
                detailItems: [cip.abstract || cip.motivation || 'Click to read the CIP explanation.']
            });
            card.appendChild(openButton);

            const copyButton = createCopyButton(cip.id, 'CIP ID');
            copyButton.classList.add('governance-action-id-copy-button');
            card.appendChild(copyButton);
            return card;
        }

        function openDetailOverlay(cip, returnFocus) {
            const content = document.createElement('div');
            content.className = 'governance-detail-content';
            addDetailRow(content, 'CIP ID', cip.id, { copyLabel: 'CIP ID' });
            addDetailRow(content, 'Status', cip.status);
            addDetailRow(content, 'Category', cip.category);
            addDetailRow(content, 'Authors', cip.authors.join(', '));
            addDetailRow(content, 'Created', cip.created_at);
            addDetailRow(content, 'CIP website', cip.website_url);
            addDetailRow(content, 'Source', cip.source_url);
            addMarkdownDetailSection(content, 'Abstract', cip.abstract);
            addMarkdownDetailSection(content, 'Motivation', cip.motivation);
            addMarkdownDetailSection(content, 'Full CIP text', cip.markdown);

            createMenuOverlay({
                id: 'governance-cip-detail-overlay',
                titleId: 'governance-cip-detail-title',
                titleText: `${cip.id}: ${cip.title}`,
                closeLabel: `Close ${cip.id}`,
                closeOverlay: closeDetailOverlay,
                bodyNodes: [content],
                headerMeta: cip.status,
                overlayClass: 'governance-action-detail-overlay',
                returnFocus,
                rootTitle: window.TDSPI18n?.translateText?.('Cardano Improvement Proposals') || 'Cardano Improvement Proposals',
                enableSearch: false,
                botContext: createBotContext(cip)
            });
        }

        function closeDetailOverlay() {
            removeMenuOverlay('governance-cip-detail-overlay');
        }

        return Object.freeze({
            closeDetailOverlay,
            closeDirectoryOverlay,
            openDetailOverlay,
            openDirectoryOverlay
        });
    }

    window.TDSPCips = Object.freeze({
        create: createCipDirectory
    });
}());
