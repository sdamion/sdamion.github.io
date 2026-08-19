(function () {
    function createDrepCorrelationModule({
        bindOpen,
        formatPercentage,
        getIdentifiers,
        normalizeIdentifier,
        onOpenDrep
    }) {
        function setAutoTranslatedText(element, text) {
            if (!(element instanceof HTMLElement)) return;
            const value = String(text || '').replace(/\s+/g, ' ').trim();
            element.setAttribute('data-i18n-auto', '');
            element.setAttribute('data-i18n-auto-original', value);
            element.textContent = window.TDSPI18n?.translateText?.(value) || value;
        }

        function createChart(correlationPayload, drepDetails = []) {
            const stats = Array.isArray(correlationPayload?.correlations) ? correlationPayload.correlations : [];
            if (!stats.length) return null;
            const drepsById = new Map((Array.isArray(drepDetails) ? drepDetails : [])
                .flatMap(drep => getIdentifiers(drep).map(identifier => [normalizeIdentifier(identifier), drep])));

            const section = document.createElement('section');
            section.className = 'governance-vote-chart governance-chart-panel governance-top-drep-correlation-chart';

            const title = document.createElement('strong');
            setAutoTranslatedText(title, 'Vote Sync');

            const list = document.createElement('div');
            list.className = 'governance-top-drep-correlation-list';

            stats.forEach(item => {
                const row = document.createElement('div');
                row.className = 'governance-top-drep-correlation-row';
                row.setAttribute('role', 'button');
                row.tabIndex = 0;
                row.setAttribute('aria-label', 'Open DRep ' + (item.name || 'DRep'));
                const drep = drepsById.get(normalizeIdentifier(item.drep_id)) || {
                    id: item.drep_id,
                    name: item.name,
                    votingPower: item.voting_power
                };
                bindOpen(row, event => onOpenDrep(drep, event.currentTarget));
                row.dataset.searchText = [item.name, item.best_match_name].filter(Boolean).join(' ');

                const label = document.createElement('div');
                label.className = 'governance-top-drep-correlation-label';
                const name = document.createElement('strong');
                name.textContent = item.name || 'DRep';
                const detail = document.createElement('span');
                setAutoTranslatedText(detail, item.best_match_name
                    ? 'Most in sync with ' + item.best_match_name + ' - ' + formatPercentage(item.best_match_percent) + ' (' + Number(item.best_match_same || 0).toLocaleString('en-US') + '/' + Number(item.best_match_comparable || 0).toLocaleString('en-US') + ' shared votes)'
                    : 'No shared explicit votes found');
                label.append(name, detail);

                const meter = document.createElement('div');
                meter.className = 'governance-top-drep-correlation-meter';
                const fill = document.createElement('span');
                fill.style.width = Math.max(0, Math.min(100, Number(item.best_match_percent) || 0)) + '%';
                meter.appendChild(fill);

                const value = document.createElement('strong');
                value.className = 'governance-top-drep-correlation-value';
                value.textContent = formatPercentage(item.best_match_percent);

                row.append(label, meter, value);
                list.appendChild(row);
            });

            section.append(title, list);
            return section;
        }

        return Object.freeze({
            createChart
        });
    }

    window.TDSPDrepCorrelation = Object.freeze({
        create: createDrepCorrelationModule
    });
}());
