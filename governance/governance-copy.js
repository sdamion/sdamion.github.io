(function () {
    function createGovernanceCopyModule({ runtime }) {
        function createButton(value, label) {
            return runtime.createCopyButton(value, label, {
                className: 'pool-copy-icon-button governance-drep-copy-button',
                bindOptions: {
                    preventDefault: false,
                    copiedAriaLabel: `Copied ${label}`
                }
            });
        }

        function appendProposalIdButton(card, proposalId) {
            const id = String(proposalId || '').trim();
            if (!id) return;
            const copyButton = createButton(id, 'Catalyst proposal ID');
            copyButton.classList.add('governance-action-id-copy-button');
            card.appendChild(copyButton);
        }

        return Object.freeze({
            appendProposalIdButton,
            createButton
        });
    }

    window.TDSPGovernanceCopy = Object.freeze({
        create: createGovernanceCopyModule
    });
}());
