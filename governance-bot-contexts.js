(function () {
    function createBotContextsModule({
        formatCatalystFundAmount,
        formatCompactAda,
        getEffectiveProposalType,
        getGovernanceStatus,
        getProposalTitle,
        getProposalTotalAsk,
        getSpoCloudHostingType,
        getSpoCloudServiceText,
        getSpoDisplayName,
        getTreasuryBusinessActions,
        getTreasuryBusinessWebsiteUrls,
        getTreasuryWithdrawals
    }) {
        function createOverlayContext(options = {}) {
            if (options.id === 'constitution-assistant-overlay') return null;
            const title = String(options.titleText || options.rootTitle || 'this menu').trim();
            const source = [
                options.id,
                options.titleText,
                options.rootTitle,
                options.headerMeta
            ].filter(Boolean).join(' ').toLowerCase();

            let section = 'Gov Actions';
            let kind = 'site_section';
            if (source.includes('catalyst')) {
                section = 'Catalyst';
            } else if (source.includes('drep')) {
                section = 'DReps';
            } else if (source.includes('spo') || source.includes('stake pool')) {
                section = 'SPOs';
            } else if (source.includes('cc member') || source.includes('committee') || source.includes('constitutional')) {
                section = 'CC Members';
            } else if (source.includes('starch')) {
                section = 'Starch';
            } else if (source.includes('treasury')) {
                section = 'Treasury';
            }

            return {
                kind,
                section,
                title,
                menu: title,
                root: String(options.rootTitle || title).trim(),
                overlay_id: options.id || null,
                header: String(options.headerMeta || '').trim() || null,
                summary: [
                    title,
                    options.headerMeta
                ].filter(Boolean).join(' • ')
            };
        }

        function createGovernanceActionContext(proposal) {
            return {
                kind: 'governance_action',
                id: String(proposal?.proposal_id || '').trim(),
                title: getProposalTitle(proposal),
                proposal_type: getEffectiveProposalType(proposal) || null,
                status: getGovernanceStatus(proposal),
                proposed_epoch: proposal?.proposed_epoch ?? null,
                expiration_epoch: proposal?.expiration ?? null,
                enacted_epoch: proposal?.enacted_epoch ?? null,
                ratified_epoch: proposal?.ratified_epoch ?? null,
                requested_lovelace: getProposalTotalAsk(proposal) || null
            };
        }

        function createGovernanceVoteContext(proposal, details = {}) {
            return {
                ...createGovernanceActionContext(proposal),
                kind: 'governance_vote',
                title: `Cast DRep vote: ${getProposalTitle(proposal)}`,
                vote_choice: details.voteKind || null,
                wallet: details.walletName || null,
                drep_id: details.drep?.dRepIDCip105 || null,
                drep_key_hash: details.drep?.publicKeyHash || null,
                current_vote: details.existingVote || null,
                drep_active: details.drepActive === true,
                summary: details.voteKind
                    ? `Casting ${details.voteKind} as DRep`
                    : 'Preparing DRep vote'
            };
        }

        function createCatalystProposalContext(proposal) {
            return {
                kind: 'catalyst_proposal',
                id: String(proposal?.id || '').trim(),
                title: proposal?.title || 'Catalyst proposal',
                proposer: proposal?.business || proposal?.ideascale_user || null,
                fund: proposal?.fund_name || null,
                status: proposal?.project_status || proposal?.funding_status || null,
                requested_usd: proposal?.amount_requested_usd ?? null,
                received_usd: proposal?.amount_received_usd ?? null
            };
        }

        function createCipContext(cip) {
            return {
                kind: 'cip',
                section: 'CIPs',
                id: String(cip?.id || '').trim(),
                title: cip?.title || 'Cardano Improvement Proposal',
                status: cip?.status || null,
                category: cip?.category || null,
                root: 'Cardano Improvement Proposals',
                summary: [
                    cip?.id || null,
                    cip?.status || null,
                    cip?.abstract || cip?.motivation || null
                ].filter(Boolean).join(' • ')
            };
        }

        function createFundingRecipientContext(group) {
            const actions = getTreasuryBusinessActions(group);
            const catalystProjects = Array.isArray(group?.catalystProjects) ? group.catalystProjects : [];
            return {
                kind: 'funding_recipient',
                section: 'Catalyst/Treasury Recipients',
                recipient: group?.label || '',
                title: group?.label || 'Funding recipient',
                id: group?.key || group?.label || '',
                amount_usd: Number(group?.value) || null,
                amount_ada: Number(group?.adaValue) || null,
                treasury_withdrawals: actions.length,
                catalyst_projects: catalystProjects.length,
                funded_projects: actions.length + catalystProjects.length,
                websites: getTreasuryBusinessWebsiteUrls(group),
                summary: `${(actions.length + catalystProjects.length).toLocaleString('en-US')} funded projects`
            };
        }

        function createWebsiteSectionContext(section, details = {}) {
            return {
                kind: 'site_section',
                section,
                title: details.title || section,
                menu: details.menu || details.title || section,
                id: details.id || null,
                count: hasFiniteDetailNumber(details.count) ? Number(details.count) : null,
                amount_usd: hasFiniteDetailNumber(details.amount_usd) ? Number(details.amount_usd) : null,
                amount_ada: hasFiniteDetailNumber(details.amount_ada) ? Number(details.amount_ada) : null,
                status: details.status || null,
                root: details.root || section,
                summary: details.summary || null
            };
        }

        function createGovernanceActionGroupContext(titleText, proposals = [], details = {}) {
            const actions = Array.isArray(proposals) ? proposals : [];
            return createWebsiteSectionContext('Gov Actions', {
                title: titleText,
                id: details.groupKey || details.status || null,
                count: actions.length,
                status: details.status || null,
                root: details.rootTitle || 'Cardano Governance',
                summary: [
                    `${actions.length.toLocaleString('en-US')} governance actions`,
                    details.status || null
                ].filter(Boolean).join(' • ')
            });
        }

        function createTreasuryContext(payload = {}) {
            const withdrawals = getTreasuryWithdrawals(payload || {});
            return createWebsiteSectionContext('Treasury', {
                title: 'Cardano Treasury',
                count: withdrawals.length,
                amount_ada: Number(payload?.treasury_ada ?? payload?.treasury?.amount_ada),
                amount_usd: Number(payload?.treasury_usd ?? payload?.treasury?.amount_usd),
                summary: `${withdrawals.length.toLocaleString('en-US')} enacted withdrawals`
            });
        }

        function createTreasuryAdministratorContext(group) {
            return createWebsiteSectionContext('Treasury', {
                title: group?.label || 'Treasury administrator',
                id: group?.key || group?.label || null,
                count: Array.isArray(group?.withdrawals) ? group.withdrawals.length : 0,
                amount_usd: Number(group?.value),
                amount_ada: Number(group?.adaValue),
                root: 'Cardano Treasury',
                summary: `${(group?.withdrawals?.length || 0).toLocaleString('en-US')} withdrawals`
            });
        }

        function createCatalystFundContext(fund) {
            return createWebsiteSectionContext('Catalyst', {
                title: fund?.fund_name || 'Catalyst fund',
                id: fund?.fund_name || null,
                count: Number(fund?.proposal_count),
                amount_usd: Number(fund?.requested_amount),
                amount_ada: Number(fund?.requested_ada),
                root: 'Catalyst/Treasury Funding',
                summary: [
                    `${Number(fund?.proposal_count || 0).toLocaleString('en-US')} proposals`,
                    `claimed ${formatCatalystFundAmount(fund, 'claimed', true)}`,
                    `not claimed ${formatCatalystFundAmount(fund, 'not_claimed', true)}`
                ].join(' • ')
            });
        }

        function createDrepContext(drep, details = {}) {
            return createWebsiteSectionContext('DReps', {
                title: drep?.name || details.title || 'DRep',
                id: drep?.id || details.id || null,
                count: details.count,
                amount_ada: Number(drep?.votingPower) / 1_000_000,
                status: drep?.active === true ? 'Active' : drep?.active === false ? 'Inactive' : details.status,
                root: 'DReps',
                summary: [
                    drep?.active === true ? 'Active DRep' : drep?.active === false ? 'Inactive DRep' : null,
                    Number.isFinite(Number(drep?.votingPower)) ? `Voting power ${formatCompactAda(drep.votingPower)}` : null,
                    Number.isFinite(Number(details.count)) ? `${Number(details.count).toLocaleString('en-US')} actions` : null
                ].filter(Boolean).join(' • ')
            });
        }

        function createSpoContext(spo, details = {}) {
            return createWebsiteSectionContext('SPOs', {
                title: getSpoDisplayName(spo || {}),
                id: spo?.pool_id || details.id || null,
                count: details.count,
                amount_ada: Number(spo?.delegated_lovelace) / 1_000_000,
                status: getSpoCloudHostingType(spo || {}) === 'cloud-spo' ? 'Cloud SPO' : 'SPO',
                root: 'SPOs',
                summary: [
                    spo?.ticker ? `Ticker ${spo.ticker}` : null,
                    Number.isFinite(Number(spo?.delegated_lovelace)) ? `Delegation ${formatCompactAda(spo.delegated_lovelace)}` : null,
                    Number.isFinite(Number(spo?.delegator_count)) ? `${Number(spo.delegator_count).toLocaleString('en-US')} delegators` : null,
                    getSpoCloudServiceText(spo || {})
                ].filter(Boolean).join(' • ')
            });
        }

        function createCommitteeMemberContext(member, details = {}) {
            return createWebsiteSectionContext('CC Members', {
                title: member?.name || 'Constitutional Committee Member',
                id: member?.id || null,
                count: details.count,
                status: member?.status || null,
                root: 'CC Members',
                summary: [
                    member?.expiresEpoch ? `expires epoch ${member.expiresEpoch}` : null,
                    Number.isFinite(Number(details.count)) ? `${Number(details.count).toLocaleString('en-US')} actions` : null
                ].filter(Boolean).join(' • ')
            });
        }

        function getRequestContext(context) {
            if (!context || typeof context !== 'object') return null;
            return Object.fromEntries(Object.entries(context)
                .filter(([, value]) => value !== null && value !== undefined && value !== ''));
        }

        function hasFiniteDetailNumber(value) {
            return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
        }

        return Object.freeze({
            createCatalystFundContext,
            createCatalystProposalContext,
            createCipContext,
            createCommitteeMemberContext,
            createDrepContext,
            createFundingRecipientContext,
            createGovernanceActionContext,
            createGovernanceActionGroupContext,
            createGovernanceVoteContext,
            createOverlayContext,
            createSpoContext,
            createTreasuryAdministratorContext,
            createTreasuryContext,
            createWebsiteSectionContext,
            getRequestContext
        });
    }

    window.TDSPBotContexts = Object.freeze({
        create: createBotContextsModule
    });
}());
