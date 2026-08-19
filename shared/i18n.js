(function initializeTdspI18n() {
    const LANGUAGE_STORAGE_KEY = 'tdsp-language';
    const DEFAULT_LANGUAGE = 'en';
    const DUTCH_LANGUAGE = 'nl';
    const DUTCH_TOML_URL = 'locales/nl.toml?v=20260819-dutch-governance-tiles';
    const TRANSLATION_ATTR = 'data-i18n';
    const TRANSLATION_ORIGINAL_ATTR = 'data-i18n-original';
    const AUTO_TRANSLATION_ORIGINAL_ATTR = 'data-i18n-auto-original';
    const AUTO_TRANSLATION_SELECTOR = [
        '.governance-menu-card > span',
        '.governance-title',
        '.governance-card-title',
        '.governance-drep-title',
        '.governance-overlay-title',
        '.pool-provider-label-text',
        '.governance-summary-subvalue',
        '.governance-card-detail',
        '.small-text',
        '.refresh-time',
        '.governance-vote-button',
        '.governance-vote-secondary',
        '.governance-proposal-action-button',
        '.governance-type',
        '.governance-menu-header-meta',
        '.governance-chart-title',
        '.overlay-dialog-header h2',
        '.governance-dialog h2',
        '.governance-dialog h3',
        '.governance-menu-overlay h2',
        '.raffle-open-tile strong',
        '[data-i18n-auto]',
        'button[data-i18n-auto]',
        'h2.governance-card-title'
    ].join(',');
    const AUTO_TRANSLATION_KEYS = new Map([
        ['Active Mithril Signers', 'active_mithril_signers'],
        ['Active', 'active'],
        ['Active first', 'active_first'],
        ['Active Relay Cloud SPOs', 'active_relay_cloud_spos'],
        ['Active Relay Non-cloud SPOs', 'active_relay_non_cloud_spos'],
        ['Admin Area', 'admin_area'],
        ['Admin Users', 'admin_users'],
        ['Add Admin Users', 'add_admin_users'],
        ['Add Exclusions', 'add_exclusions'],
        ['Active Relay', 'active_relay'],
        ['Approved Governance Actions', 'approved_governance_actions'],
        ['Ask TDSPBot about this menu', 'ask_tdspbot_about_menu'],
        ['Ask about available governance, DReps, SPOs, Starch, Treasury, or the Constitution.', 'ask_tdspbot_empty'],
        ['Back one window', 'back_one_window'],
        ['Back to metadata', 'back_to_metadata'],
        ['Become a DRep', 'become_drep'],
        ['Browser notifications active', 'browser_notifications_active'],
        ['CC member vote update', 'cc_member_vote_update'],
        ['CC Member not voted yet', 'cc_member_not_voted_yet'],
        ['CC not voted', 'cc_not_voted'],
        ['CC vote cache pending', 'cc_vote_cache_pending'],
        ['CC vote data unavailable', 'cc_vote_data_unavailable'],
        ['CC vote not applicable', 'cc_vote_not_applicable'],
        ['Cardano Constitution', 'cardano_constitution'],
        ['Cardano Decentralization', 'cardano_decentralization'],
        ['Cardano Decentralization / Nakamoto Coefficients', 'cardano_decentralization_nakamoto'],
        ['Cardano Events', 'cardano_events'],
        ['Cardano Governance', 'cardano_governance'],
        ['Cardano Improvement Proposals', 'cardano_improvement_proposals'],
        ['Cardano Mainnet', 'cardano_mainnet'],
        ['Cardano Treasury', 'cardano_treasury'],
        ['Cancel', 'cancel'],
        ['Catalyst funding status', 'catalyst_funding_status'],
        ['Catalyst vote overview', 'catalyst_vote_overview'],
        ['Catalyst proposal', 'catalyst_proposal'],
        ['Catalyst/Treasury Funding', 'catalyst_treasury_funding'],
        ['Catalyst/Treasury Funding Claimed', 'catalyst_treasury_funding_claimed'],
        ['Catalyst/Treasury Recipients', 'catalyst_treasury_recipients'],
        ['CC Members', 'cc_members'],
        ['Change vote', 'change_vote'],
        ['Choose topics and enable notifications', 'choose_topics_enable_notifications'],
        ['Choose your vote', 'choose_your_vote'],
        ['Claimed Funds', 'claimed_funds'],
        ['Close', 'close'],
        ['CIP number', 'cip_number'],
        ['CIP number: Newest', 'cip_number_newest'],
        ['Cloud Service Usage', 'cloud_service_usage'],
        ['Companies', 'companies'],
        ['Company Balance', 'company_balance'],
        ['Connect Admin Wallet', 'connect_admin_wallet'],
        ['Connect Delegator Wallet', 'connect_delegator_wallet'],
        ['Connect your DRep wallet', 'connect_drep_wallet'],
        ['Continue Chat', 'continue_chat'],
        ['Continue to wallet', 'continue_to_wallet'],
        ['Constitution', 'constitution'],
        ['Constitutional Committee Members', 'constitutional_committee_members'],
        ['Consulting the Constitution...', 'consulting_constitution'],
        ['Copy', 'copy'],
        ['Copy external URL', 'copy_external_url'],
        ['Copied', 'copied'],
        ['Cast DRep vote', 'cast_drep_vote'],
        ['Create DRep metadata', 'create_drep_metadata'],
        ['Create and save drep.jsonld', 'create_save_drep_jsonld'],
        ['Create metadata file', 'create_metadata_file'],
        ['Create metadata hash', 'create_metadata_hash'],
        ['Creating...', 'creating'],
        ['Creating file...', 'creating_file'],
        ['Crypto News', 'crypto_news'],
        ['DRep profile', 'drep_profile'],
        ['DRep vote overview', 'drep_vote_overview'],
        ['DRep votes', 'drep_votes'],
        ['DReps', 'dreps'],
        ['Dashboard', 'dashboard'],
        ['Delegation', 'delegation'],
        ['Delegators', 'delegators'],
        ['Delegators Dashboard', 'delegators_dashboard'],
        ['Domains reaching the 51% threshold', 'domains_threshold'],
        ['Draw', 'draw'],
        ['Draw and Publish', 'draw_and_publish'],
        ['Draw and Publish Winner', 'draw_publish_winner'],
        ['Draw proof', 'draw_proof'],
        ['Earliest epoch', 'earliest_epoch'],
        ['Eligible Delegators', 'eligible_delegators'],
        ['Events', 'events'],
        ['Excluded Stake Keys', 'excluded_stake_keys'],
        ['Exclusion List', 'exclusion_list'],
        ['External links', 'external_links'],
        ['Fixed cost', 'fixed_cost'],
        ['51% stake threshold', 'fifty_one_percent_stake_threshold'],
        ['Funding recipient', 'funding_recipient'],
        ['Fund: Newest first', 'fund_newest_first'],
        ['Fund: Oldest first', 'fund_oldest_first'],
        ['Generating answer...', 'generating_answer'],
        ['Governance Actions', 'governance_actions'],
        ['Governance yes threshold reached', 'governance_yes_threshold_reached'],
        ['High', 'high'],
        ['Highest amount', 'highest_amount'],
        ['History', 'history'],
        ['Improved rationale', 'improved_rationale'],
        ['Inactive', 'inactive'],
        ['Inactive first', 'inactive_first'],
        ['Latest epoch', 'latest_epoch'],
        ['Least blocks', 'least_blocks'],
        ['Least delegators', 'least_delegators'],
        ['Least DRep Yes NCL', 'least_drep_yes_ncl'],
        ['Least funded projects', 'least_funded_projects'],
        ['Least miners', 'least_miners'],
        ['Least power', 'least_power'],
        ['Less ask', 'less_ask'],
        ['Loading...', 'loading'],
        ['Loading CIPs...', 'loading_cips'],
        ['Loading Catalyst and Treasury funding...', 'loading_catalyst_treasury_funding'],
        ['Loading Catalyst proposal...', 'loading_catalyst_proposal'],
        ['Loading Catalyst/Treasury recipients...', 'loading_catalyst_treasury_recipients'],
        ['Loading Constitution...', 'loading_constitution'],
        ['Loading DRep data...', 'loading_drep_data'],
        ['Loading DRep info...', 'loading_drep_info'],
        ['Loading DRep votes...', 'loading_drep_votes'],
        ['Loading Nakamoto coefficients...', 'loading_nakamoto'],
        ['Loading SPO data...', 'loading_spo_data'],
        ['Loading SPO details...', 'loading_spo_details'],
        ['Loading top 10 DReps...', 'loading_top_dreps'],
        ['Loading treasury data...', 'loading_treasury_data'],
        ['Lock', 'lock'],
        ['Live stake', 'live_stake'],
        ['Low', 'low'],
        ['Lowest amount', 'lowest_amount'],
        ['Lowest balance', 'lowest_balance'],
        ['Lowest saturation', 'lowest_saturation'],
        ['Margin', 'margin'],
        ['Miners', 'miners'],
        ['Most ask', 'most_ask'],
        ['Most blocks', 'most_blocks'],
        ['Most delegators', 'most_delegators'],
        ['Most DRep Yes NCL', 'most_drep_yes_ncl'],
        ['Most funded projects', 'most_funded_projects'],
        ['Most miners', 'most_miners'],
        ['Most No votes', 'most_no_votes'],
        ['Most power', 'most_power'],
        ['Most Yes votes', 'most_yes_votes'],
        ['Name A-Z', 'name_az'],
        ['Name Z-A', 'name_za'],
        ['Nakamoto Coefficient', 'nakamoto_coefficient'],
        ['NCL', 'ncl'],
        ['Net Change Limit', 'net_change_limit'],
        ['New Chat', 'new_chat'],
        ['New governance action', 'new_governance_action'],
        ['No DRep data available.', 'no_drep_data_available'],
        ['No admin users are configured.', 'no_admin_users_configured'],
        ['No applicable governance actions found for this DRep.', 'no_applicable_governance_actions'],
        ['No advertised relay nodes are available.', 'no_advertised_relays'],
        ['No matching results.', 'no_matching_results'],
        ['No prize tokens are currently in the raffle wallet.', 'no_prize_tokens'],
        ['No raffle results have been published yet.', 'no_raffle_results'],
        ['No registered SPOs are available.', 'no_registered_spos'],
        ['No stake keys are excluded.', 'no_stake_keys_excluded'],
        ['No top DRep data available.', 'no_top_drep_data'],
        ['Not supported', 'not_supported'],
        ['Notifications enabled', 'notifications_enabled'],
        ['Newest', 'newest'],
        ['Oldest', 'oldest'],
        ['On-chain DRep registration', 'onchain_drep_registration'],
        ['On-chain proof', 'onchain_proof'],
        ['On-chain rationale (optional)', 'onchain_rationale_optional'],
        ['Open', 'open'],
        ['Open for live votes', 'open_for_live_votes'],
        ['Passive Relay', 'passive_relay'],
        ['Pool Delegators', 'pool_delegators'],
        ['Pool snapshot unavailable', 'pool_snapshot_unavailable'],
        ['Pool ID', 'pool_id'],
        ['Pledge', 'pledge'],
        ['Possible Blocks Current Epoch', 'possible_blocks_current_epoch'],
        ['Prices', 'prizes'],
        ['Price history is still being collected.', 'price_history_collecting'],
        ['Price history unavailable', 'price_history_unavailable'],
        ['Proposal Summary', 'proposal_summary'],
        ['Proposer', 'proposer'],
        ['Publish proof on-chain', 'publish_proof_onchain'],
        ['Question about Cardano governance', 'question_cardano_governance'],
        ['Raffles', 'raffles'],
        ['Raffle wallet tokens', 'raffle_wallet_tokens'],
        ['Read', 'read'],
        ['Realfi SPO', 'realfi_spo'],
        ['RealFi Docs is an external website. DYOR before clicking external links inside this embedded page.', 'realfi_docs_external_notice'],
        ['RealFi Docs only allows embedding from HTTPS websites. Test this overlay on the production HTTPS site.', 'realfi_docs_https_only'],
        ['Rejected Actions', 'rejected_actions'],
        ['Register as DRep', 'register_as_drep'],
        ['Remove', 'remove'],
        ['Reset in', 'reset_in'],
        ['Reset due', 'reset_due'],
        ['SPO Operator', 'spo_operator'],
        ['SPO Status', 'spo_status'],
        ['SPO status unavailable', 'spo_status_unavailable'],
        ['SPO vote overview', 'spo_vote_overview'],
        ['SPOs with no on-chain relays advertised', 'spos_no_advertised_relays'],
        ['SPOs with only passive relays', 'spos_passive_relays'],
        ['SPOs', 'spos'],
        ['Search by name, ID, title or status', 'search_by_name_id_title_status'],
        ['Search by CIP number, title, status or text', 'search_by_cip'],
        ['Search by pool, ticker, ID or relay address', 'search_by_pool'],
        ['Search action, DRep name or vote choice', 'search_action_drep_vote'],
        ['Search proposers or team members, separated by commas', 'search_proposers_team_members'],
        ['Search Cardano data or ask about the Constitution', 'search_cardano_data'],
        ['Search this overlay', 'search_this_overlay'],
        ['Select and publish a raffle winner', 'select_publish_raffle_winner'],
        ['Source:', 'source'],
        ['Status unavailable', 'status_unavailable'],
        ['Saturation', 'saturation'],
        ['Starch Pools', 'starch_pools'],
        ['Starch pool data is not available yet.', 'starch_pool_data_unavailable'],
        ['Starch Stats', 'starch_stats'],
        ['Summary', 'summary'],
        ['TDSPBot', 'tdspbot'],
        ['This link will open in a new tab.', 'external_link_new_tab'],
        ['Links in this chart are provided by TradingView. DYOR before opening external links.', 'tradingview_link_warning'],
        ['Top 10 DReps', 'top_10_dreps'],
        ['Total Delegated', 'total_delegated'],
        ['Treasury withdrawal history', 'treasury_withdrawal_history'],
        ['Unclaimed Funds', 'unclaimed_funds'],
        ['Unapproved Treasury', 'unapproved_treasury'],
        ['Unknown Relay', 'unknown_relay'],
        ['Use GovTool instead', 'use_govtool_instead'],
        ['Use improved rationale', 'use_improved_rationale'],
        ['Verified administrator', 'verified_administrator'],
        ['Verified TDSP delegator', 'verified_tdsp_delegator'],
        ['Verify the raffle proof metadata and network fee in your wallet before signing.', 'verify_raffle_proof'],
        ['View event', 'view_event'],
        ['View transaction on Cardanoscan', 'view_transaction_cardanoscan'],
        ['Vote as DRep', 'vote_as_drep'],
        ['Vote Sync', 'vote_sync'],
        ['Vote rationale', 'vote_rationale'],
        ['Voting Power', 'voting_power'],
        ['Voting stats loading...', 'voting_stats_loading'],
        ['Voting stats unavailable', 'voting_stats_unavailable'],
        ['Voting Stats', 'voting_stats'],
        ['Was this the answer you were looking for?', 'was_answer_helpful'],
        ['Weekly Blocks', 'weekly_blocks'],
        ['Withdrawals by administrator', 'withdrawals_by_administrator']
    ]);
    let translations = {};
    let activeLanguage = DEFAULT_LANGUAGE;
    let dutchLoadPromise = null;
    let isTranslating = false;

    function parseTomlStrings(source) {
        const values = {};
        let inStrings = false;
        String(source || '').split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const section = trimmed.match(/^\[([^\]]+)]$/);
            if (section) {
                inStrings = section[1] === 'strings';
                return;
            }
            if (!inStrings) return;
            const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*"(.*)"$/);
            if (!match) return;
            values[match[1]] = match[2]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\\\/g, '\\');
        });
        return values;
    }

    function getStoredLanguage() {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return stored === DUTCH_LANGUAGE ? DUTCH_LANGUAGE : DEFAULT_LANGUAGE;
    }

    function rememberOriginal(element) {
        if (!(element instanceof HTMLElement)) return;
        if (!element.hasAttribute(TRANSLATION_ORIGINAL_ATTR)) {
            element.setAttribute(TRANSLATION_ORIGINAL_ATTR, element.textContent || '');
        }
    }

    function translateElement(element) {
        if (!(element instanceof HTMLElement)) return;
        const key = element.getAttribute(TRANSLATION_ATTR);
        if (!key) return;
        rememberOriginal(element);
        if (activeLanguage === DUTCH_LANGUAGE && translations[key]) {
            element.textContent = translations[key];
            return;
        }
        element.textContent = element.getAttribute(TRANSLATION_ORIGINAL_ATTR) || '';
    }

    function getAutoTranslationKey(text) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        return AUTO_TRANSLATION_KEYS.get(normalized) || '';
    }

    function getAutoTranslationValue(text) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        const key = AUTO_TRANSLATION_KEYS.get(normalized);
        if (key && translations[key]) return translations[key];

        if (normalized.includes(' • ')) {
            return normalized
                .split(' • ')
                .map(part => getAutoTranslationValue(part) || part)
                .join(' • ');
        }

        if (normalized.includes(' · ')) {
            return normalized
                .split(' · ')
                .map(part => getAutoTranslationValue(part) || part)
                .join(' · ');
        }

        const fundMatch = normalized.match(/^Fund\s+(\d+)$/i);
        if (fundMatch) return `Fonds ${fundMatch[1]}`;

        const priceMatch = normalized.match(/^([A-Z0-9]+)\s+Price$/);
        if (priceMatch) return `${priceMatch[1]} prijs`;

        const activeEpochMatch = normalized.match(/^Active epoch\s+(.+)$/i);
        if (activeEpochMatch) return `Actieve epoch ${activeEpochMatch[1]}`;

        const daysMatch = normalized.match(/^(\d+)\s+days?$/i);
        if (daysMatch) return daysMatch[1] === '1' ? '1 dag' : `${daysMatch[1]} dagen`;

        const hourMatch = normalized.match(/^(\d+)\s+hours?$/i);
        if (hourMatch) return `${hourMatch[1]} uur`;

        const closePriceMatch = normalized.match(/^Close\s+([A-Z0-9]+)\s+price history$/i);
        if (closePriceMatch) return `Sluit ${closePriceMatch[1]} prijsgeschiedenis`;

        const candlesMatch = normalized.match(/^(\d[\d,]*)\s+candles$/i);
        if (candlesMatch) return `${candlesMatch[1]} candles`;

        const delegatedMatch = normalized.match(/^Delegated\s+(.+)$/i);
        if (delegatedMatch) return `Gedelegeerd ${delegatedMatch[1]}`;

        const votingPowerMatch = normalized.match(/^Voting Power\s+(.+)$/i);
        if (votingPowerMatch) return `Stemkracht ${votingPowerMatch[1]}`;

        const offlineMatch = normalized.match(/^Offline\s+(.+)$/i);
        if (offlineMatch) return `Offline ${offlineMatch[1]}`;

        const treasuryEpochValueMatch = normalized.match(/^Treasury Epoch\s+(.+)$/i);
        if (treasuryEpochValueMatch) return `Treasury epoch ${treasuryEpochValueMatch[1]}`;

        const incomeMatch = normalized.match(/^Income\s+(.+)$/i);
        if (incomeMatch) return `Inkomen ${incomeMatch[1]}`;

        const nclBalanceMatch = normalized.match(/^NCL Balance\s+(.+)$/i);
        if (nclBalanceMatch) return `NCL balans ${nclBalanceMatch[1]}`;

        const balanceMatch = normalized.match(/^Balance\s+(.+)$/i);
        if (balanceMatch) return `Balans ${balanceMatch[1]}`;

        const resetInMatch = normalized.match(/^Reset in\s+(.+)$/i);
        if (resetInMatch) return `Reset over ${resetInMatch[1]}`;

        const relayMatch = normalized.match(/^Relay\s+(.+)$/i);
        if (relayMatch) return `Relay ${relayMatch[1]}`;

        const starchMinersMatch = normalized.match(/^(.+)\s+Starch Miners$/i);
        if (starchMinersMatch) return `${starchMinersMatch[1]} Starch miners`;

        const proposerMatch = normalized.match(/^Proposer:\s*(.+)$/i);
        if (proposerMatch && translations.proposer) return `${translations.proposer}: ${proposerMatch[1]}`;

        const claimedFundsMatch = normalized.match(/^Claimed Funds\s+(.+)$/i);
        if (claimedFundsMatch && translations.claimed_funds) return `${translations.claimed_funds} ${claimedFundsMatch[1]}`;

        const unclaimedFundsMatch = normalized.match(/^Unclaimed Funds\s+(.+)$/i);
        if (unclaimedFundsMatch && translations.unclaimed_funds) return `${translations.unclaimed_funds} ${unclaimedFundsMatch[1]}`;

        const claimedMatch = normalized.match(/^Claimed\s+(.+)$/i);
        if (claimedMatch) return `Geclaimd ${claimedMatch[1]}`;

        const notClaimedMatch = normalized.match(/^Not Claimed\s+(.+)$/i);
        if (notClaimedMatch) return `Ongeclaimd ${notClaimedMatch[1]}`;

        const unclaimedMatch = normalized.match(/^Unclaimed\s+(.+)$/i);
        if (unclaimedMatch) return `Ongeclaimd ${unclaimedMatch[1]}`;

        const votedMatch = normalized.match(/^Voted\s+(.+)$/i);
        if (votedMatch) return `Gestemd ${votedMatch[1]}`;

        const notVotedMatch = normalized.match(/^Not voted\s+(.+)$/i);
        if (notVotedMatch) return `Niet gestemd ${notVotedMatch[1]}`;

        const eventsMatch = normalized.match(/^(.+)\s+Events$/);
        if (eventsMatch && translations.events) return `${eventsMatch[1]} ${translations.events.toLowerCase()}`;

        const treasuryEpochMatch = normalized.match(/^Treasury withdrawals\s+-\s+Epoch\s+(.+)$/i);
        if (treasuryEpochMatch) return `Treasury withdrawals - Epoch ${treasuryEpochMatch[1]}`;

        const loadingMatch = normalized.match(/^Loading\s+(.+?)(\.\.\.)?$/i);
        if (loadingMatch) {
            return `${loadingMatch[1]} laden...`;
        }

        const countMatch = normalized.match(/^(\d+)\s+(admin|excluded|published raffles|proposals|projects|actions|entries|members|signers|delegators|pools|articles|stake keys excluded)$/i);
        if (countMatch) return `${countMatch[1]} ${translateCountLabel(countMatch[2])}`;

        return '';
    }

    function translateCountLabel(label) {
        const normalized = String(label || '').toLowerCase();
        if (normalized === 'admin') return 'admin';
        if (normalized === 'excluded') return 'uitgesloten';
        if (normalized === 'published raffles') return 'gepubliceerde raffles';
        if (normalized === 'proposals') return 'voorstellen';
        if (normalized === 'projects') return 'projecten';
        if (normalized === 'actions') return 'acties';
        if (normalized === 'entries') return 'items';
        if (normalized === 'members') return 'leden';
        if (normalized === 'signers') return 'signers';
        if (normalized === 'delegators') return 'delegatoren';
        if (normalized === 'pools') return 'pools';
        if (normalized === 'articles') return 'artikelen';
        if (normalized === 'stake keys excluded') return 'stake keys uitgesloten';
        return label;
    }

    function translateAutoElement(element) {
        if (!(element instanceof HTMLElement)) return;
        if (element.hasAttribute(TRANSLATION_ATTR)) return;
        if (element.children.length > 0) return;

        if (!element.hasAttribute(AUTO_TRANSLATION_ORIGINAL_ATTR)) {
            element.setAttribute(AUTO_TRANSLATION_ORIGINAL_ATTR, element.textContent || '');
        }

        const original = element.getAttribute(AUTO_TRANSLATION_ORIGINAL_ATTR) || '';
        const translated = activeLanguage === DUTCH_LANGUAGE ? getAutoTranslationValue(original) : '';
        if (translated) {
            element.textContent = translated;
            return;
        }
        element.textContent = original;
    }

    function translatePlaceholderElement(element) {
        if (!(element instanceof HTMLElement)) return;
        const original = element.getAttribute('data-i18n-placeholder-original') || element.getAttribute('placeholder') || '';
        if (!original) return;
        element.setAttribute('data-i18n-placeholder-original', original);
        const translated = activeLanguage === DUTCH_LANGUAGE ? getAutoTranslationValue(original) : '';
        element.setAttribute('placeholder', translated || original);
    }

    function applyTranslations(root = document) {
        if (isTranslating) return;
        isTranslating = true;
        try {
            root.querySelectorAll?.(`[${TRANSLATION_ATTR}]`).forEach(translateElement);
            root.querySelectorAll?.(AUTO_TRANSLATION_SELECTOR).forEach(translateAutoElement);
            root.querySelectorAll?.('[data-i18n-placeholder-original]').forEach(translatePlaceholderElement);
            if (root instanceof HTMLElement) {
                if (root.hasAttribute(TRANSLATION_ATTR)) translateElement(root);
                if (root.matches?.(AUTO_TRANSLATION_SELECTOR)) translateAutoElement(root);
                if (root.hasAttribute('data-i18n-placeholder-original')) translatePlaceholderElement(root);
            }
            document.documentElement.lang = activeLanguage;
            syncLanguageToggle();
        } finally {
            isTranslating = false;
        }
    }

    async function loadDutchTranslations() {
        if (!dutchLoadPromise) {
            dutchLoadPromise = fetch(DUTCH_TOML_URL)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(parseTomlStrings);
        }
        translations = await dutchLoadPromise;
    }

    async function setLanguage(language) {
        activeLanguage = language === DUTCH_LANGUAGE ? DUTCH_LANGUAGE : DEFAULT_LANGUAGE;
        localStorage.setItem(LANGUAGE_STORAGE_KEY, activeLanguage);
        if (activeLanguage === DUTCH_LANGUAGE) {
            await loadDutchTranslations();
        }
        applyTranslations();
        window.dispatchEvent(new CustomEvent('tdsp-language-change', {
            detail: { language: activeLanguage }
        }));
    }

    function syncLanguageToggle() {
        const toggle = document.getElementById('language-toggle');
        if (!toggle) return;
        const isDutch = activeLanguage === DUTCH_LANGUAGE;
        toggle.textContent = isDutch ? 'EN' : 'NL';
        toggle.setAttribute('aria-label', isDutch ? 'Switch site language to English' : 'Zet de site in het Nederlands');
        toggle.dataset.currentLanguage = activeLanguage;
    }

    function initLanguageToggle() {
        const toggle = document.getElementById('language-toggle');
        if (!toggle || toggle.dataset.languageBound === 'true') return;
        toggle.dataset.languageBound = 'true';
        toggle.addEventListener('click', () => {
            setLanguage(activeLanguage === DUTCH_LANGUAGE ? DEFAULT_LANGUAGE : DUTCH_LANGUAGE)
                .catch(error => console.error('Language switch failed.', error));
        });
    }

    function observeDynamicTranslations() {
        if (!('MutationObserver' in window)) return;
        const observer = new MutationObserver(entries => {
            if (isTranslating) return;
            entries.forEach(entry => {
                if (entry.type === 'characterData') {
                    const parent = entry.target?.parentElement;
                    if (parent?.matches?.(AUTO_TRANSLATION_SELECTOR) && !parent.hasAttribute(TRANSLATION_ATTR)) {
                        parent.removeAttribute(AUTO_TRANSLATION_ORIGINAL_ATTR);
                        translateAutoElement(parent);
                    }
                    return;
                }
                entry.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.hasAttribute(TRANSLATION_ATTR)) translateElement(node);
                    applyTranslations(node);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function init() {
        activeLanguage = getStoredLanguage();
        initLanguageToggle();
        const ready = activeLanguage === DUTCH_LANGUAGE ? loadDutchTranslations() : Promise.resolve();
        ready
            .then(() => {
                applyTranslations();
                observeDynamicTranslations();
            })
            .catch(error => {
                console.error('Dutch language file could not be loaded.', error);
                activeLanguage = DEFAULT_LANGUAGE;
                applyTranslations();
            });
    }

    window.TDSPI18n = Object.freeze({
        applyTranslations,
        getLanguage: () => activeLanguage,
        setLanguage,
        translateText: (text) => {
            const translated = activeLanguage === DUTCH_LANGUAGE ? getAutoTranslationValue(text) : '';
            return translated || text;
        }
    });

    window.TDSPRuntime?.onReady ? window.TDSPRuntime.onReady(init) : document.addEventListener('DOMContentLoaded', init, { once: true });
}());
