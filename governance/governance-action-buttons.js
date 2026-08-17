(function () {
    function createActionButtonsModule({
        createCatalystContext,
        createGovernanceContext,
        isGovernanceOpenForVoting,
        onAskBot,
        onOpenCatalystSummary,
        onOpenGovernanceSummary,
        onOpenVote
    }) {
        function createGovernanceButtons(proposal, options = {}) {
            const actions = createButtonGroup();
            if (options.showSummary !== false) {
                actions.appendChild(createButton(
                    'Summary',
                    'governance-summary-button',
                    event => onOpenGovernanceSummary(proposal, event.currentTarget)
                ));
            }
            if (options.showBot !== false) {
                actions.appendChild(createButton(
                    'TDSPBot',
                    'governance-tdspbot-button',
                    event => onAskBot(createGovernanceContext(proposal), event.currentTarget)
                ));
            }
            if (options.showVote !== false && isGovernanceOpenForVoting(proposal)) {
                actions.appendChild(createButton(
                    'Vote as DRep',
                    'governance-detail-vote-button',
                    event => onOpenVote(proposal, event.currentTarget)
                ));
            }
            return actions;
        }

        function createCatalystButtons(proposal) {
            const actions = createButtonGroup();
            actions.appendChild(createButton(
                'Summary',
                'governance-summary-button',
                event => onOpenCatalystSummary(proposal, event.currentTarget)
            ));
            actions.appendChild(createButton(
                'TDSPBot',
                'governance-tdspbot-button',
                event => onAskBot(createCatalystContext(proposal), event.currentTarget)
            ));
            return actions;
        }

        function createButtonGroup(extraClass = '') {
            const actions = document.createElement('div');
            actions.className = `governance-action-buttons${extraClass ? ` ${extraClass}` : ''}`;
            return actions;
        }

        function createButton(label, className, onClick) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `governance-vote-button governance-proposal-action-button ${className}`;
            button.textContent = label;
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                onClick(event);
            });
            return button;
        }

        return Object.freeze({
            createButton,
            createButtonGroup,
            createCatalystButtons,
            createGovernanceButtons
        });
    }

    window.TDSPActionButtons = Object.freeze({
        create: createActionButtonsModule
    });
}());
