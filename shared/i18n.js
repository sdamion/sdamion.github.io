(function initializeTdspI18n() {
    const LANGUAGE_STORAGE_KEY = 'tdsp-language';
    const DEFAULT_LANGUAGE = 'en';
    const LANGUAGE_CONFIG = Object.freeze({
        en: { label: 'English', flag: '🇺🇸' },
        nl: { label: 'Nederlands', flag: '🇳🇱', url: 'locales/nl.toml?v=20260819-japanese-dynamic-labels' },
        ja: { label: '日本語', flag: '🇯🇵', url: 'locales/ja.toml?v=20260819-japanese-dynamic-labels' }
    });
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
        '.governance-vote-label-item',
        '.governance-vote-secondary',
        '.governance-votes',
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
        ['Active Governance Actions', 'active_governance_actions'],
        ['Abstain', 'abstain'],
        ['Approved Treasury', 'approved_treasury'],
        ['Approved Governance Actions', 'approved_governance_actions'],
        ['Ask AI about this menu', 'ask_tdspbot_about_menu'],
        ['Ask AI improve rationale', 'ask_ai_improve_rationale'],
        ['Ask AI returned an empty rationale.', 'ask_ai_empty_rationale'],
        ['Ask AI did not finish loading in time.', 'ask_ai_load_timeout'],
        ['Ask AI could not be opened.', 'ask_ai_could_not_open'],
        ['Ask about available governance, DReps, SPOs, Starch, Treasury, or the Constitution.', 'ask_tdspbot_empty'],
        ['AI-generated answer. Verify proposal details and constitutional references before making decisions.', 'ai_generated_verify_details'],
        ['Answer feedback could not be saved.', 'answer_feedback_not_saved'],
        ['Answer loaded from saved website data.', 'answer_loaded_saved_data'],
        ['Answer saved.', 'answer_saved'],
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
        ['Candle close', 'candle_close'],
        ['Cancel', 'cancel'],
        ['Catalyst funding status', 'catalyst_funding_status'],
        ['Catalyst vote overview', 'catalyst_vote_overview'],
        ['Catalyst proposal', 'catalyst_proposal'],
        ['Catalyst proposal context', 'catalyst_proposal_context'],
        ['Catalyst/Treasury Funding', 'catalyst_treasury_funding'],
        ['Catalyst/Treasury funding', 'catalyst_treasury_funding'],
        ['Catalyst/Treasury Funding Claimed', 'catalyst_treasury_funding_claimed'],
        ['Catalyst/Treasury Recipients', 'catalyst_treasury_recipients'],
        ['Catalyst/Treasury recipient context', 'catalyst_treasury_recipient_context'],
        ['CC Members', 'cc_members'],
        ['Change vote', 'change_vote'],
        ['Check before signing', 'check_before_signing'],
        ['Balance', 'balance_label'],
        ['Choose topics and enable notifications', 'choose_topics_enable_notifications'],
        ['Choose your vote', 'choose_your_vote'],
        ['Claimed Funds', 'claimed_funds'],
        ['Close', 'close'],
        ['Close DRep directory', 'close_drep_directory'],
        ['Close DRep list', 'close_drep_list'],
        ['Close DRep metadata builder', 'close_drep_metadata_builder'],
        ['Close DRep registration', 'close_drep_registration'],
        ['Close DRep voting', 'close_drep_voting'],
        ['Close governance action', 'close_governance_action'],
        ['Close top 10 DReps', 'close_top_10_dreps'],
        ['Close vote rationale', 'close_vote_rationale'],
        ['Close Net Change Limit', 'close_net_change_limit'],
        ['Close CIPs', 'close_cips'],
        ['Close Constitution', 'close_constitution'],
        ['Close Constitution assistant', 'close_constitution_assistant'],
        ['Close Catalyst and Treasury funding', 'close_catalyst_treasury_funding'],
        ['Close Catalyst/Treasury recipients', 'close_catalyst_treasury_recipients'],
        ['Close Constitutional Committee members', 'close_constitutional_committee_members'],
        ['Close Constitutional Committee voting overview', 'close_constitutional_committee_voting_overview'],
        ['Close approved treasury actions', 'close_approved_treasury_actions'],
        ['Close unapproved treasury actions', 'close_unapproved_treasury_actions'],
        ['CIP number', 'cip_number'],
        ['CIP number: Newest', 'cip_number_newest'],
        ['CIP ID', 'cip_id'],
        ['CIP website', 'cip_website'],
        ['CIP context', 'cip_context'],
        ['CIPs', 'cips'],
        ['CIPs could not be loaded.', 'cips_could_not_be_loaded'],
        ['Click to read the CIP explanation.', 'click_read_cip_explanation'],
        ['Constitutional Committee members could not be loaded.', 'constitutional_committee_members_could_not_load'],
        ['Cloud Service Usage', 'cloud_service_usage'],
        ['Companies', 'companies'],
        ['Company Balance', 'company_balance'],
        ['Company ID', 'company_id'],
        ['Company IDs', 'company_ids'],
        ['Company miner data could not be loaded.', 'company_miner_data_load_failed'],
        ['Connect Admin Wallet', 'connect_admin_wallet'],
        ['Connect Delegator Wallet', 'connect_delegator_wallet'],
        ['Connect your DRep wallet', 'connect_drep_wallet'],
        ['Connecting to wallet...', 'connecting_wallet'],
        ['Checking current delegation status...', 'checking_delegation_status'],
        ['Checking current vote cache...', 'checking_current_vote_cache'],
        ['Building the delegation transaction...', 'building_delegation_transaction'],
        ['Close Nakamoto coefficients', 'close_nakamoto'],
        ['Close Stake to TDSP', 'close_stake_to_tdsp'],
        ['Continue Chat', 'continue_chat'],
        ['Continue with conversation history', 'continue_with_history'],
        ['Continue to wallet', 'continue_to_wallet'],
        ['Consensus NC', 'consensus_nc'],
        ['Constitution', 'constitution'],
        ['Constitutional Committee Members', 'constitutional_committee_members'],
        ['Consulting the Constitution...', 'consulting_constitution'],
        ['context', 'context'],
        ['Connect the wallet that will control your DRep', 'connect_drep_control_wallet'],
        ['Copy', 'copy'],
        ['Copy external URL', 'copy_external_url'],
        ['Copied', 'copied'],
        ['Could not load the wallet connector. Please refresh and try again.', 'wallet_connector_load_failed'],
        ['Could not verify current delegation status. No transaction was built, so no ADA will be spent. Please try again in a moment.', 'delegation_status_verify_failed'],
        ['Cast DRep vote', 'cast_drep_vote'],
        ['Create DRep metadata', 'create_drep_metadata'],
        ['Create and save drep.jsonld', 'create_save_drep_jsonld'],
        ['Create metadata file', 'create_metadata_file'],
        ['Create metadata hash', 'create_metadata_hash'],
        ['Creating...', 'creating'],
        ['Creating file...', 'creating_file'],
        ['Crypto News', 'crypto_news'],
        ['DRep profile', 'drep_profile'],
        ['DRep profile details could not be loaded.', 'drep_profile_details_could_not_be_loaded'],
        ['DRep data could not be loaded.', 'drep_data_could_not_be_loaded'],
        ['DRep ID', 'drep_id'],
        ['DRep key', 'drep_key'],
        ['DRep info', 'drep_info'],
        ['DRep name', 'drep_name'],
        ['DRep name is required to create CIP-119 metadata.', 'drep_name_required'],
        ['DRep not voted', 'drep_not_voted'],
        ['DRep not voted yet', 'drep_not_voted_yet'],
        ['DRep registration', 'drep_registration'],
        ['DRep registration submitted.', 'drep_registration_submitted'],
        ['DRep votes could not be loaded.', 'drep_votes_could_not_be_loaded'],
        ['DRep vote overview', 'drep_vote_overview'],
        ['DRep vote context', 'drep_vote_context'],
        ['DRep votes', 'drep_votes'],
        ['DReps', 'dreps'],
        ['DRep Delegation', 'drep_delegation'],
        ['DRep delegation failed', 'drep_delegation_failed'],
        ['DRep delegation submitted! View on Cardanoscan', 'drep_delegation_submitted_cardanoscan'],
        ['Dashboard', 'dashboard'],
        ['Delegation failed', 'delegation_failed'],
        ['Delegation submitted! View on Cardanoscan', 'delegation_submitted_cardanoscan'],
        ['Delegation', 'delegation'],
        ['Delegators', 'delegators'],
        ['Delegators Dashboard', 'delegators_dashboard'],
        ['Detecting installed wallets...', 'detecting_installed_wallets'],
        ['Domains reaching the 51% threshold', 'domains_threshold'],
        ['Draw', 'draw'],
        ['Draw and Publish', 'draw_and_publish'],
        ['Draw and Publish Winner', 'draw_publish_winner'],
        ['Draw proof', 'draw_proof'],
        ['Earliest epoch', 'earliest_epoch'],
        ['Eligible Delegators', 'eligible_delegators'],
        ['Each card shows how the top 10 DReps voted. The same-vote line groups DReps by vote choice.', 'top_drep_vote_matrix_intro'],
        ['Events', 'events'],
        ['events', 'events'],
        ['Date unavailable', 'date_unavailable'],
        ['to', 'to'],
        ['Cardano event', 'cardano_event'],
        ['Cardano Event', 'cardano_event'],
        ['Cardano event starting', 'cardano_event_starting'],
        ['A Cardano event is starting now.', 'cardano_event_now'],
        ['Open event', 'open_event'],
        ['event', 'event'],
        ['Event details', 'event_details'],
        ['Cardano community calendar', 'cardano_community_calendar'],
        ['Official Cardano events', 'official_cardano_events'],
        ['Show events from', 'show_events_from'],
        ['events could not be opened.', 'events_could_not_open'],
        ['Open', 'open'],
        ['poster', 'poster'],
        ['Date', 'date'],
        ['Location', 'location'],
        ['Organizer', 'organizer'],
        ['More information is available on the event website.', 'more_event_info_website'],
        ['Cardano event could not be opened.', 'cardano_event_could_not_open'],
        ['Close Cardano event', 'close_cardano_event'],
        ['Upcoming Cardano events are temporarily unavailable.', 'upcoming_cardano_events_unavailable'],
        ['Excluded Stake Keys', 'excluded_stake_keys'],
        ['Exclusion List', 'exclusion_list'],
        ['External links', 'external_links'],
        ['Fixed cost', 'fixed_cost'],
        ['51% stake threshold', 'fifty_one_percent_stake_threshold'],
        ['Funding recipient', 'funding_recipient'],
        ['Funding recipient data could not be loaded.', 'funding_recipient_data_could_not_load'],
        ['Fund: Newest first', 'fund_newest_first'],
        ['Fund: Oldest first', 'fund_oldest_first'],
        ['Generating answer...', 'generating_answer'],
        ['Governance', 'governance'],
        ['Governance Actions', 'governance_actions'],
        ['Governance action context', 'governance_action_context'],
        ['Governance assistant', 'governance_assistant'],
        ['Rejected Governance Actions', 'rejected_governance_actions'],
        ['Governance yes threshold reached', 'governance_yes_threshold_reached'],
        ['High', 'high'],
        ['Highest amount', 'highest_amount'],
        ['Highest saturation', 'highest_saturation'],
        ['History', 'history'],
        ['Geographic NC', 'geographic_nc'],
        ['Hosting-provider NC', 'hosting_provider_nc'],
        ['If this answer was useful, consider ', 'stake_prompt_prefix'],
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
        ['Loading Constitutional Committee members...', 'loading_constitutional_committee_members'],
        ['Loading Constitution...', 'loading_constitution'],
        ['Loading DRep data...', 'loading_drep_data'],
        ['Loading DRep info...', 'loading_drep_info'],
        ['Loading DRep votes...', 'loading_drep_votes'],
        ['Loading DReps…', 'loading_dreps'],
        ['Loading vote rationale...', 'loading_vote_rationale'],
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
        ['Metadata URL', 'metadata_url'],
        ['Metadata URL (optional)', 'metadata_url_optional'],
        ['Metadata hash', 'metadata_hash'],
        ['Metadata hash (optional)', 'metadata_hash_optional'],
        ['Metadata URL and metadata hash must be provided together.', 'metadata_url_hash_together'],
        ['Metadata hash must contain exactly 64 hexadecimal characters.', 'metadata_hash_64_hex'],
        ['Metadata hash could not be created.', 'metadata_hash_could_not_be_created'],
        ['Metadata URL loaded and its Blake2b-256 hash was added.', 'metadata_url_hash_added'],
        ['Miners', 'miners'],
        ['Miner', 'miner'],
        ['Rank', 'rank'],
        ['Blocks', 'blocks'],
        ['Active Miners', 'active_miners'],
        ['Amount of miners', 'amount_of_miners'],
        ['Balance loading...', 'balance_loading'],
        ['Weekly Blocks loading...', 'weekly_blocks_loading'],
        ['Amount of miners loading...', 'amount_of_miners_loading'],
        ['Mined Blocks (Week)', 'mined_blocks_week'],
        ['Last Updated:', 'last_updated'],
        ['Loading company miners...', 'loading_company_miners'],
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
        ['NCL Spend', 'ncl_spend'],
        ['NCL Balance Actions', 'ncl_balance_actions'],
        ['NCL Used', 'ncl_used'],
        ['NCL Available', 'ncl_available'],
        ['Net Change Limit', 'net_change_limit'],
        ['Net (if all treasury actions are enacted)', 'net_if_all_treasury_actions_enacted'],
        ['New Chat', 'new_chat'],
        ['Ask a new question without conversation history', 'ask_new_without_history'],
        ['New governance action', 'new_governance_action'],
        ['No DRep data available.', 'no_drep_data_available'],
        ['No admin users are configured.', 'no_admin_users_configured'],
        ['No applicable governance actions found for this DRep.', 'no_applicable_governance_actions'],
        ['No advertised relay nodes are available.', 'no_advertised_relays'],
        ['No matching results.', 'no_matching_results'],
        ['No Name', 'no_name'],
        ['No prize tokens are currently in the raffle wallet.', 'no_prize_tokens'],
        ['No raffle results have been published yet.', 'no_raffle_results'],
        ['No registered SPOs are available.', 'no_registered_spos'],
        ['No stake address was found in this wallet. No transaction was built.', 'no_stake_address_wallet'],
        ['No stake keys are excluded.', 'no_stake_keys_excluded'],
        ['No top DRep data available.', 'no_top_drep_data'],
        ['No vote data', 'no_vote_data'],
        ['No shared explicit votes found', 'no_shared_explicit_votes'],
        ['No on-chain rationale metadata found for this DRep vote.', 'no_onchain_rationale_metadata_found'],
        ['No Cardano wallet extension detected. Install a CIP-30 wallet (Eternl, Lace, Vespr...) and reopen this dialog.', 'no_cardano_wallet_detected'],
        ['No Cardano wallet extension detected. Install a CIP-30/CIP-95 wallet and reopen this dialog.', 'no_cip30_cip95_wallet_detected'],
        ['No CIP-95 Cardano wallet extension was detected. No transaction was built.', 'no_cip95_wallet_detected'],
        ['No spendable wallet UTxO was found for the deposit and network fee.', 'no_spendable_wallet_utxo'],
        ['Not available', 'not_available'],
        ['Not identified', 'not_identified'],
        ['Not a DRep Yet', 'not_a_drep_yet'],
        ['Not Applicable', 'not_applicable'],
        ['Not applicable', 'not_applicable'],
        ['Not Voted', 'not_voted'],
        ['Not voted', 'not_voted'],
        ['Not voted yet', 'not_voted_yet'],
        ['Not supported', 'not_supported'],
        ['Notifications enabled', 'notifications_enabled'],
        ['Newest', 'newest'],
        ['Oldest', 'oldest'],
        ['Offline', 'offline'],
        ['On-chain DRep registration', 'onchain_drep_registration'],
        ['Payment address (optional)', 'payment_address_optional'],
        ['On-chain proof', 'onchain_proof'],
        ['On-chain rationale (optional)', 'onchain_rationale_optional'],
        ['Open', 'open'],
        ['Open for live votes', 'open_for_live_votes'],
        ['Passive Relay', 'passive_relay'],
        ['Please approve the DRep delegation transaction in your wallet...', 'approve_drep_delegation_wallet'],
        ['Please approve the transaction in your wallet...', 'approve_transaction_wallet'],
        ['Please switch your wallet to Cardano Mainnet and try again.', 'switch_wallet_mainnet'],
        ['Preparing DRep voting delegation...', 'preparing_drep_delegation'],
        ['Pool Delegators', 'pool_delegators'],
        ['Pool snapshot unavailable', 'pool_snapshot_unavailable'],
        ['Pool ID', 'pool_id'],
        ['Pipeline', 'pipeline'],
        ['Pledge', 'pledge'],
        ['Possible Blocks Current Epoch', 'possible_blocks_current_epoch'],
        ['Prices', 'prizes'],
        ['Price history is still being collected.', 'price_history_collecting'],
        ['Price history unavailable', 'price_history_unavailable'],
        ['Proposal Summary', 'proposal_summary'],
        ['Profile image URL (optional)', 'profile_image_url_optional'],
        ['Image SHA-256 (optional)', 'image_sha256_optional'],
        ['Objectives (optional)', 'objectives_optional'],
        ['Motivations (optional)', 'motivations_optional'],
        ['Qualifications (optional)', 'qualifications_optional'],
        ['Identity URL (optional)', 'identity_url_optional'],
        ['Additional link label (optional)', 'additional_link_label_optional'],
        ['Additional link URL (optional)', 'additional_link_url_optional'],
        ['Do not list me in public DRep directories', 'do_not_list_public_drep_directories'],
        ['Proposer', 'proposer'],
        ['Publish proof on-chain', 'publish_proof_onchain'],
        ['Question about Cardano governance', 'question_cardano_governance'],
        ['Reason for this vote (English)', 'reason_for_vote_english'],
        ['Raffles', 'raffles'],
        ['Raffle wallet tokens', 'raffle_wallet_tokens'],
        ['Read', 'read'],
        ['Realfi SPO', 'realfi_spo'],
        ['RealFi Docs is an external website. DYOR before clicking external links inside this embedded page.', 'realfi_docs_external_notice'],
        ['RealFi Docs only allows embedding from HTTPS websites. Test this overlay on the production HTTPS site.', 'realfi_docs_https_only'],
        ['Rejected Actions', 'rejected_actions'],
        ['Register as DRep', 'register_as_drep'],
        ['Registering a DRep on Cardano Mainnet', 'registering_drep_mainnet'],
        ['Registration currently requires a refundable ₳ 500 deposit plus a network fee. Verify both amounts in your wallet before signing.', 'drep_registration_deposit_warning'],
        ['Registered DRep directory', 'registered_drep_directory'],
        ['Required for CIP-119 metadata', 'required_cip119_metadata'],
        ['What do you want to achieve as a DRep?', 'what_achieve_drep'],
        ['Why do you want to become a DRep?', 'why_become_drep'],
        ['Relevant experience and qualifications', 'relevant_experience_qualifications'],
        ['Website, X, LinkedIn...', 'website_x_linkedin'],
        ['Your public DRep name', 'your_public_drep_name'],
        ['Relay Operator NC', 'relay_operator_nc'],
        ['Relay operator NC', 'relay_operator_nc'],
        ['Remove', 'remove'],
        ['Reset in', 'reset_in'],
        ['Reset due', 'reset_due'],
        ['Software/client NC', 'software_client_nc'],
        ['SPO Operator', 'spo_operator'],
        ['SPO Status', 'spo_status'],
        ['Active Relay via operator group', 'active_relay_operator_group'],
        ['SPO details could not be loaded.', 'spo_details_could_not_load'],
        ['SPO hardware', 'spo_hardware'],
        ['SPO status unavailable', 'spo_status_unavailable'],
        ['SPO vote overview', 'spo_vote_overview'],
        ['Cloud SPO', 'cloud_spo'],
        ['Non-cloud SPO', 'non_cloud_spo'],
        ['No cloud service', 'no_cloud_service'],
        ['Multiple cloud services', 'multiple_cloud_services'],
        ['Cloud provider not identified', 'cloud_provider_not_identified'],
        ['Nakamoto coefficient data is not available yet.', 'nakamoto_data_unavailable'],
        ['Nakamoto coefficient data could not be loaded.', 'nakamoto_data_could_not_load'],
        ['Source data unavailable', 'source_data_unavailable'],
        ['Insufficient coverage', 'insufficient_coverage'],
        ['cached SPO stake', 'cached_spo_stake'],
        ['SPOs with no on-chain relays advertised', 'spos_no_advertised_relays'],
        ['SPOs with only passive relays', 'spos_passive_relays'],
        ['SPOs', 'spos'],
        ['Stake to TDSP', 'stake_to_tdsp'],
        ['staking to TDSP', 'staking_to_tdsp'],
        ['Search by name, ID, title or status', 'search_by_name_id_title_status'],
        ['Search by CIP number, title, status or text', 'search_by_cip'],
        ['Search by pool, ticker, ID or relay address', 'search_by_pool'],
        ['Search action, DRep name or vote choice', 'search_action_drep_vote'],
        ['Search proposers or team members, separated by commas', 'search_proposers_team_members'],
        ['Search Cardano data or ask about the Constitution', 'search_cardano_data'],
        ['Search this overlay', 'search_this_overlay'],
        ['Select and publish a raffle winner', 'select_publish_raffle_winner'],
        ['Saved drep.jsonld and added its Blake2b-256 hash. Upload this exact file, then enter its public metadata URL.', 'saved_drep_jsonld_hash_added'],
        ['Saved for review.', 'saved_for_review'],
        ['Source:', 'source'],
        ['Spend', 'spend'],
        ['Status unavailable', 'status_unavailable'],
        ['Submitting transaction...', 'submitting_transaction'],
        ['Saturation', 'saturation'],
        ['Starch Pools', 'starch_pools'],
        ['Starch pool data is not available yet.', 'starch_pool_data_unavailable'],
        ['Starch Stats', 'starch_stats'],
        ['Summary', 'summary'],
        ['Ask AI', 'tdspbot'],
        ['Ask AI is improving your rationale...', 'tdspbot_improving_rationale'],
        ['Add your reason or pointers first, then Ask AI can improve it.', 'add_reason_first_improve_rationale'],
        ['Improved rationale copied into your original rationale field. Review it before continuing.', 'improved_rationale_copied'],
        ['Review this text carefully. It will only be used when you copy it into the original rationale field and continue.', 'review_improved_rationale_note'],
        ['Ask AI could not improve the rationale right now.', 'tdspbot_improve_rationale_failed'],
        ['The wallet connector could not be loaded. No transaction was built.', 'wallet_connector_no_transaction'],
        ['Thank you for your feedback.', 'thank_feedback'],
        ['The Constitution assistant returned an empty answer.', 'constitution_assistant_empty_answer'],
        ['The Constitution assistant is temporarily unavailable.', 'constitution_assistant_unavailable'],
        ['The Constitution document is empty.', 'constitution_document_empty'],
        ['The Cardano Constitution could not be loaded.', 'cardano_constitution_could_not_load'],
        ['This API only provides stake totals for this bucket, not individual DRep IDs.', 'drep_bucket_stake_totals_only'],
        ['This DRep is already registered. No transaction was built.', 'drep_already_registered'],
        ['The metadata URL did not return a JSON object.', 'metadata_url_not_json_object'],
        ['This link will open in a new tab.', 'external_link_new_tab'],
        ['This wallet is already delegating to The Dutch Stake Pool.', 'already_delegating_tdsp'],
        ['This wallet is already registered as a DRep. No transaction was built.', 'wallet_already_registered_drep'],
        ['This wallet did not provide CIP-95 DRep access. No transaction was built.', 'wallet_no_cip95_drep_access'],
        ['This registers the displayed DRep ID on Cardano Mainnet. Check the ₳ 500 deposit, network fee, DRep ID and metadata in your wallet before signing.', 'drep_registration_review_warning'],
        ['This wallet is already registered, but the current pool could not be confirmed. No transaction was built.', 'already_registered_pool_unconfirmed'],
        ['This dimension is not available from the current SPO data.', 'spo_dimension_unavailable'],
        ['Consensus, relay operator, hosting provider, geographic and software/client concentration', 'nakamoto_summary'],
        ['Links in this chart are provided by TradingView. DYOR before opening external links.', 'tradingview_link_warning'],
        ['Top 10 DReps', 'top_10_dreps'],
        ['Top 10 DRep data could not be loaded.', 'top_10_drep_data_could_not_be_loaded'],
        ['Top 10 DReps by voting power', 'top_10_dreps_by_voting_power'],
        ['Total Delegated', 'total_delegated'],
        ['Total ask', 'total_ask'],
        ['Total Ask', 'total_ask'],
        ['Treasury withdrawal history', 'treasury_withdrawal_history'],
        ['Treasury income, withdrawals and treasury value per epoch', 'treasury_chart_aria'],
        ['Treasury candles', 'treasury_candles'],
        ['Treasury Withdrawals', 'treasury_withdrawals'],
        ['Treasury', 'treasury'],
        ['Treasury withdrawal could not be opened.', 'treasury_withdrawal_could_not_open'],
        ['Unclaimed Funds', 'unclaimed_funds'],
        ['Unapproved', 'unapproved'],
        ['Unapproved Treasury', 'unapproved_treasury'],
        ['Unavailable', 'unavailable'],
        ['Updated', 'updated'],
        ['Unknown Relay', 'unknown_relay'],
        ['Use GovTool instead', 'use_govtool_instead'],
        ['Use improved rationale', 'use_improved_rationale'],
        ['Verified administrator', 'verified_administrator'],
        ['Verified TDSP delegator', 'verified_tdsp_delegator'],
        ['Verifying DRep registration...', 'verifying_drep_registration'],
        ['Verify the raffle proof metadata and network fee in your wallet before signing.', 'verify_raffle_proof'],
        ['View event', 'view_event'],
        ['View transaction on Cardanoscan', 'view_transaction_cardanoscan'],
        ['Vote as DRep', 'vote_as_drep'],
        ['Vote Sync', 'vote_sync'],
        ['Vote rationale', 'vote_rationale'],
        ['Vote rationale could not be loaded from the API. The koios-proxy container may need the latest image or this vote has no on-chain rationale metadata.', 'vote_rationale_api_load_failed'],
        ['Vote sync is loading in the background.', 'vote_sync_background'],
        ['Voted', 'voted'],
        ['Vote', 'vote'],
        ['Website context', 'website_context'],
        ['Yes', 'yes'],
        ['You', 'you'],
        ['No', 'no'],
        ['Governance action', 'governance_action'],
        ['Action ID', 'action_id'],
        ['Abstract', 'abstract'],
        ['Authors', 'authors'],
        ['Category', 'category'],
        ['Created', 'created'],
        ['Full CIP text', 'full_cip_text'],
        ['Motivation', 'motivation'],
        ['No CIPs are available yet.', 'no_cips_available'],
        ['No enacted treasury withdrawals available.', 'no_enacted_treasury_withdrawals'],
        ['No Catalyst/Treasury recipient data is available yet.', 'no_catalyst_treasury_recipients'],
        ['No Catalyst or Treasury funding data is available yet.', 'no_catalyst_treasury_funding'],
        ['No governance actions found.', 'no_governance_actions_found'],
        ['No approved treasury funding actions found.', 'no_approved_treasury_funding_actions'],
        ['No unapproved treasury actions found.', 'no_unapproved_treasury_actions'],
        ['No treasury governance actions found.', 'no_treasury_governance_actions'],
        ['Source', 'source'],
        ['Status', 'status'],
        ['Treasury data could not be loaded.', 'treasury_data_could_not_load'],
        ['Catalyst funds could not be loaded.', 'catalyst_funds_could_not_load'],
        ['Transaction', 'transaction'],
        ['Wallet', 'wallet'],
        ['Your name', 'your_name'],
        ['Refundable deposit', 'refundable_deposit'],
        ['Rationale', 'rationale'],
        ['None', 'none'],
        ['Your rationale can be up to 5000 characters and will be included as Cardano transaction metadata in this vote transaction. Long text is split into 64-byte chunks automatically.', 'rationale_5000_metadata_help'],
        ['Voting Power', 'voting_power'],
        ['Voting stats loading...', 'voting_stats_loading'],
        ['Voting stats unavailable', 'voting_stats_unavailable'],
        ['Voting Stats', 'voting_stats'],
        ['Was this the answer you were looking for?', 'was_answer_helpful'],
        ['Weekly Blocks', 'weekly_blocks'],
        ['Withdrawals by administrator', 'withdrawals_by_administrator']
    ]);
    let activeLanguage = DEFAULT_LANGUAGE;
    let translations = {};
    const translationLoadPromises = new Map();
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
        return LANGUAGE_CONFIG[stored] ? stored : DEFAULT_LANGUAGE;
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
        if (activeLanguage !== DEFAULT_LANGUAGE && translations[key]) {
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

        const genericVotingPowerMatch = normalized.match(/^Voting Power\s+(.+)$/i);
        if (genericVotingPowerMatch && translations.voting_power) {
            return `${translations.voting_power} ${genericVotingPowerMatch[1]}`;
        }

        const genericVotingPowerColonMatch = normalized.match(/^Voting power:\s*(.+)$/i);
        if (genericVotingPowerColonMatch && translations.voting_power) {
            return `${translations.voting_power}: ${genericVotingPowerColonMatch[1]}`;
        }

        const genericOfflineMatch = normalized.match(/^Offline\s+(.+)$/i);
        if (genericOfflineMatch && translations.offline) {
            return `${translations.offline} ${genericOfflineMatch[1]}`;
        }

        if (activeLanguage === 'ja') {
            const approvedUnapprovedMatch = normalized.match(/^Approved\s+(.+?)\s+•\s+Unapproved\s+(.+)$/i);
            if (approvedUnapprovedMatch) return `承認済み ${approvedUnapprovedMatch[1]} • 未承認 ${approvedUnapprovedMatch[2]}`;

            const fundMatch = normalized.match(/^Fund\s+(\d+)$/i);
            if (fundMatch) return `ファンド ${fundMatch[1]}`;

            const priceMatch = normalized.match(/^([A-Z0-9]+)\s+Price$/);
            if (priceMatch) return `${priceMatch[1]}価格`;

            const makeDrepMatch = normalized.match(/^Make\s+(.+)\s+your DRep$/i);
            if (makeDrepMatch) return `${makeDrepMatch[1]}をあなたのDRepにする`;

            const closeDrepDelegationMatch = normalized.match(/^Close\s+(.+)\s+DRep delegation$/i);
            if (closeDrepDelegationMatch) return `${closeDrepDelegationMatch[1]}のDRep委任を閉じる`;

            const drepWarningMatch = normalized.match(/^Always review the transaction in your wallet before approving\.\s+Confirm it delegates your Cardano voting power to\s+(.+)\s+and does not include anything unexpected\.$/i);
            if (drepWarningMatch) {
                return `承認する前に必ずウォレット内の取引を確認してください。Cardanoの投票力が${drepWarningMatch[1]}へ委任され、予期しない内容が含まれていないことを確認してください。`;
            }

            const activeEpochMatch = normalized.match(/^Active epoch\s+(.+)$/i);
            if (activeEpochMatch) return `アクティブエポック ${activeEpochMatch[1]}`;

            const daysMatch = normalized.match(/^(\d+)\s+days?$/i);
            if (daysMatch) return `${daysMatch[1]}日`;

            const hourMatch = normalized.match(/^(\d+)\s+hours?$/i);
            if (hourMatch) return `${hourMatch[1]}時間`;

            const resetInMatch = normalized.match(/^Reset in\s+(.+)$/i);
            if (resetInMatch) return `リセットまで ${getAutoTranslationValue(resetInMatch[1]) || resetInMatch[1]}`;

            const epochCountMatch = normalized.match(/^(.+)\s+epochs$/i);
            if (epochCountMatch) return `${epochCountMatch[1]}エポック`;

            const actionsCountMatch = normalized.match(/^(\d[\d,]*)\s+actions$/i);
            if (actionsCountMatch) return `${actionsCountMatch[1]}アクション`;

            const actionCountWithTotalAskMatch = normalized.match(/^(\d[\d,]*)\s+actions\s+•\s+Total ask\s+(.+)$/i);
            if (actionCountWithTotalAskMatch) return `${actionCountWithTotalAskMatch[1]}アクション • ${translations.total_ask || '総要求額'} ${actionCountWithTotalAskMatch[2]}`;

            const approvedActionsCountMatch = normalized.match(/^(\d[\d,]*)\s+approved actions$/i);
            if (approvedActionsCountMatch) return `${approvedActionsCountMatch[1]}承認済みアクション`;

            const unapprovedActionsCountMatch = normalized.match(/^(\d[\d,]*)\s+unapproved actions$/i);
            if (unapprovedActionsCountMatch) return `${unapprovedActionsCountMatch[1]}未承認アクション`;

            const proposalsCountMatch = normalized.match(/^(\d[\d,]*)\s+proposals$/i);
            if (proposalsCountMatch) return `${proposalsCountMatch[1]}提案`;

            const projectsCountMatch = normalized.match(/^(\d[\d,]*)\s+projects$/i);
            if (projectsCountMatch) return `${projectsCountMatch[1]}プロジェクト`;

            const fundedProjectsCountMatch = normalized.match(/^(\d[\d,]*)\s+funded projects$/i);
            if (fundedProjectsCountMatch) return `${fundedProjectsCountMatch[1]}資金提供済みプロジェクト`;

            const membersCountMatch = normalized.match(/^(\d[\d,]*)\s+members$/i);
            if (membersCountMatch) return `${membersCountMatch[1]}メンバー`;

            const applicableNotApplicableMatch = normalized.match(/^(\d[\d,]*)\s+applicable\s+\/\s+(\d[\d,]*)\s+not\s+applicable$/i);
            if (applicableNotApplicableMatch) return `${applicableNotApplicableMatch[1]}対象 / ${applicableNotApplicableMatch[2]}対象外`;

            const totalActionsMatch = normalized.match(/^(\d[\d,]*)\s+total actions$/i);
            if (totalActionsMatch) return `合計${totalActionsMatch[1]}アクション`;

            const closePriceMatch = normalized.match(/^Close\s+([A-Z0-9]+)\s+price history$/i);
            if (closePriceMatch) return `${closePriceMatch[1]}価格履歴を閉じる`;

            const closeAnyMatch = normalized.match(/^Close\s+(.+)$/i);
            if (closeAnyMatch) return `${getAutoTranslationValue(closeAnyMatch[1]) || closeAnyMatch[1]}を閉じる`;

            const closeNakamotoMetricMatch = normalized.match(/^Close\s+(.+\s+NC)$/i);
            if (closeNakamotoMetricMatch) return `${getAutoTranslationValue(closeNakamotoMetricMatch[1]) || closeNakamotoMetricMatch[1]}を閉じる`;

            const openNakamotoMetricMatch = normalized.match(/^Open\s+(.+\s+NC)$/i);
            if (openNakamotoMetricMatch) return `${getAutoTranslationValue(openNakamotoMetricMatch[1]) || openNakamotoMetricMatch[1]}を開く`;

            const candlesMatch = normalized.match(/^(\d[\d,]*)\s+candles$/i);
            if (candlesMatch) return `${candlesMatch[1]}本のローソク足`;

            const proposalEpochMetaMatch = normalized.match(/^Epoch\s+(.+?)\s+-\s+expires\s+(.+?)(?:\s+•\s+Total ask\s+(.+))?$/i);
            if (proposalEpochMetaMatch) {
                const base = `エポック ${proposalEpochMetaMatch[1]} - 期限 ${proposalEpochMetaMatch[2]}`;
                return proposalEpochMetaMatch[3]
                    ? `${base} • ${translations.total_ask || '総要求額'} ${proposalEpochMetaMatch[3]}`
                    : base;
            }

            const epochLabelMatch = normalized.match(/^Epoch\s+(.+)$/i);
            if (epochLabelMatch) return `エポック ${epochLabelMatch[1]}`;

            const delegatedMatch = normalized.match(/^Delegated\s+(.+)$/i);
            if (delegatedMatch) return `委任済み ${delegatedMatch[1]}`;

            const epochsRangeMatch = normalized.match(/^Epochs\s+(.+)$/i);
            if (epochsRangeMatch) return `エポック ${epochsRangeMatch[1]}`;

            const delegationMatch = normalized.match(/^Delegation:\s*(.+)$/i);
            if (delegationMatch) return `委任: ${delegationMatch[1]}`;

            const delegatorsMatch = normalized.match(/^Delegators:\s*(.+)$/i);
            if (delegatorsMatch) return `委任者: ${delegatorsMatch[1]}`;

            const saturationMatch = normalized.match(/^Saturation:\s*(.+)$/i);
            if (saturationMatch) return `飽和度: ${saturationMatch[1]}`;

            const relaysMatch = normalized.match(/^Relays:\s*(.+)$/i);
            if (relaysMatch) return `リレー: ${relaysMatch[1] === 'not advertised' ? '未公開' : relaysMatch[1]}`;

            const cloudServiceMatch = normalized.match(/^Cloud Service:\s*(.+)$/i);
            if (cloudServiceMatch) return `クラウドサービス: ${getAutoTranslationValue(cloudServiceMatch[1]) || cloudServiceMatch[1]}`;

            const activeRelaySposMatch = normalized.match(/^(.+)\s+Active Relay SPOs$/i);
            if (activeRelaySposMatch) return `${getAutoTranslationValue(activeRelaySposMatch[1]) || activeRelaySposMatch[1]} アクティブリレーSPO`;

            const drepGroupMatch = normalized.match(/^(.+)\s+DReps$/i);
            if (drepGroupMatch) return `${getAutoTranslationValue(drepGroupMatch[1]) || drepGroupMatch[1]} DRep`;

            const cloudSposMatch = normalized.match(/^(.+)\s+Cloud SPOs$/i);
            if (cloudSposMatch) return `${getAutoTranslationValue(cloudSposMatch[1]) || cloudSposMatch[1]} クラウドSPO`;

            const nonCloudSposMatch = normalized.match(/^(.+)\s+Non-cloud SPOs$/i);
            if (nonCloudSposMatch) return `${getAutoTranslationValue(nonCloudSposMatch[1]) || nonCloudSposMatch[1]} 非クラウドSPO`;

            const locationMatch = normalized.match(/^Location:\s*(.+)$/i);
            if (locationMatch) return `場所: ${locationMatch[1]}`;

            const relayNodesMatch = normalized.match(/^Relay nodes\s+\((.+)\)$/i);
            if (relayNodesMatch) return `リレーノード（${relayNodesMatch[1]}）`;

            const nakamotoMatch = normalized.match(/^Nakamoto coefficient\s+(.+)$/i);
            if (nakamotoMatch) return `ナカモト係数 ${nakamotoMatch[1]}`;

            const domainsReachMatch = normalized.match(/^(.+)\s+of\s+(.+)\s+domains reach\s+(.+)\s+of stake$/i);
            if (domainsReachMatch) return `${domainsReachMatch[2]}ドメイン中${domainsReachMatch[1]}がステークの${domainsReachMatch[3]}に到達`;

            const measuredDomainsMatch = normalized.match(/^(\d[\d,]*)\s+measured domains$/i);
            if (measuredDomainsMatch) return `${measuredDomainsMatch[1]}測定済みドメイン`;

            const combinedPoolsMatch = normalized.match(/^(\d[\d,]*)\s+combined pools$/i);
            if (combinedPoolsMatch) return `${combinedPoolsMatch[1]}統合プール`;

            const stakeCoverageMatch = normalized.match(/^Stake coverage\s+(.+)$/i);
            if (stakeCoverageMatch) return `ステークカバレッジ ${stakeCoverageMatch[1]}`;

            const knownStakeCoverageMatch = normalized.match(/^Known stake coverage\s+(.+)$/i);
            if (knownStakeCoverageMatch) return `既知ステークカバレッジ ${knownStakeCoverageMatch[1]}`;

            const fiftyOneThresholdMatch = normalized.match(/^51%\s+stake threshold$/i);
            if (fiftyOneThresholdMatch) return '51%ステークしきい値';

            const domainsThresholdMatch = normalized.match(/^Domains reaching the\s+(.+?)\s+threshold$/i);
            if (domainsThresholdMatch) return `${domainsThresholdMatch[1]}しきい値に到達するドメイン`;

            const unavailableReasonMatch = normalized.match(/^(.+)\s+requires a refreshed version 2 SPO decentralization cache\.$/i);
            if (unavailableReasonMatch) return `${getAutoTranslationValue(unavailableReasonMatch[1]) || unavailableReasonMatch[1]}には更新済みのバージョン2 SPO分散化キャッシュが必要です。`;

            const relayOperatorMethodologyMatch = normalized.match(/^Minimum inferred relay operators whose combined stake reaches\s+(.+?)\.\s+Pools are grouped by a strict-majority relay operator identity derived from structured full hostnames or their relay base domain; pools without a majority remain separate\.$/i);
            if (relayOperatorMethodologyMatch) return `合計ステークが${relayOperatorMethodologyMatch[1]}に達する最小の推定リレーオペレーター数。プールは構造化された完全ホスト名またはリレー基底ドメインから推定される厳格多数のリレーオペレーターIDでグループ化され、過半数がないプールは別扱いです。`;

            const consensusMethodologyMatch = normalized.match(/^Minimum SPO operators whose combined active stake reaches\s+(.+?)\.\s+Pools are grouped by normalized operator identity and known aliases\.$/i);
            if (consensusMethodologyMatch) return `合計アクティブステークが${consensusMethodologyMatch[1]}に達する最小のSPOオペレーター数。プールは正規化されたオペレーターIDと既知の別名でグループ化されます。`;

            const consensusPoolIdMethodologyMatch = normalized.match(/^Minimum inferred SPO operators whose combined stake reaches\s+(.+?)\.\s+Pool IDs are combined when their normalized pool names match or a strict majority of their relays share the same inferred relay operator identity\.$/i);
            if (consensusPoolIdMethodologyMatch) return `合計ステークが${consensusPoolIdMethodologyMatch[1]}に達する最小の推定SPOオペレーター数。正規化されたプール名が一致する場合、またはリレーの厳格多数が同じ推定リレーオペレーターIDを共有する場合にプールIDを統合します。`;

            const hostingMethodologyMatch = normalized.match(/^Minimum hosting providers whose combined measured stake reaches\s+(.+?)\.\s+Only pools with classified relay hosting data are included\.$/i);
            if (hostingMethodologyMatch) return `測定済み合計ステークが${hostingMethodologyMatch[1]}に達する最小のホスティングプロバイダー数。分類済みリレーホスティングデータを持つプールのみ含まれます。`;

            const hostingFailureDomainMethodologyMatch = normalized.match(/^Minimum hosting failure domains whose combined stake reaches\s+(.+?)\.\s+Pools whose relays all use one identified provider share that provider domain; mixed, unknown, and non-cloud pools remain separate domains\.$/i);
            if (hostingFailureDomainMethodologyMatch) return `合計ステークが${hostingFailureDomainMethodologyMatch[1]}に達する最小のホスティング障害ドメイン数。すべてのリレーが同一の識別済みプロバイダーを使うプールは同じプロバイダードメインを共有し、混在・不明・非クラウドのプールは別ドメインとして扱います。`;

            const geographicMethodologyMatch = normalized.match(/^Minimum countries whose combined measured relay stake reaches\s+(.+?)\.\s+Only relay IPs with resolved geographic data are included\.$/i);
            if (geographicMethodologyMatch) return `測定済みリレーステークの合計が${geographicMethodologyMatch[1]}に達する最小の国数。地理データが解決済みのリレーIPのみ含まれます。`;

            const relayHostingCountriesMethodologyMatch = normalized.match(/^Minimum relay-hosting countries whose combined attributed stake reaches\s+(.+?)\s+of identified stake\.\s+A pool's stake is divided equally across its known relay countries; IP geolocation is preferred and RDAP is used as a fallback\.$/i);
            if (relayHostingCountriesMethodologyMatch) return `特定済みステークの${relayHostingCountriesMethodologyMatch[1]}に達する最小のリレーホスティング国数。プールのステークは既知のリレー所在国に均等配分され、IPジオロケーションを優先しRDAPをフォールバックに使います。`;

            const softwareReasonMatch = normalized.match(/^Cardano pool registration and relay discovery do not publish a trustworthy node implementation or client identity\.$/i);
            if (softwareReasonMatch) return 'Cardanoのプール登録とリレー検出では、信頼できるノード実装またはクライアントIDは公開されません。';

            const softwareMethodologyMatch = normalized.match(/^Minimum independently maintained Cardano node implementations needed to reach\s+(.+?)\s+of stake\.$/i);
            if (softwareMethodologyMatch) return `ステークの${softwareMethodologyMatch[1]}に到達するために必要な、独立して保守されるCardanoノード実装の最小数。`;

            const uniqueRelayLocationsMatch = normalized.match(/^(\d[\d,]*)\s+unique relay locations from\s+(\d[\d,]*)\s+relay IP records\.\s+Zoom or drag the map; point size represents attributed active stake\.\s+Select a shared location to view all SPOs there\.\s+Map:\s+Natural Earth,\s+CC0\.$/i);
            if (uniqueRelayLocationsMatch) return `${uniqueRelayLocationsMatch[2]}件のリレーIP記録から${uniqueRelayLocationsMatch[1]}箇所の一意なリレー所在地。地図をズームまたはドラッグできます。点の大きさは割当アクティブステークを表します。共有所在地を選択すると、その場所のすべてのSPOを表示します。地図: Natural Earth, CC0。`;

            const worldMapMatch = normalized.match(/^World map with\s+(\d[\d,]*)\s+unique SPO relay locations$/i);
            if (worldMapMatch) return `${worldMapMatch[1]}箇所の一意なSPOリレー所在地を示す世界地図`;

            const spoCountMatch = normalized.match(/^(\d[\d,]*)\s+SPOs$/i);
            if (spoCountMatch) return `${spoCountMatch[1]} SPO`;

            const expiresEpochMatch = normalized.match(/^Expires epoch\s+(.+)$/i);
            if (expiresEpochMatch) return `期限エポック ${expiresEpochMatch[1]}`;

            const enactedEpochMatch = normalized.match(/^Enacted Epoch\s+(.+)$/i);
            if (enactedEpochMatch) return `実行エポック ${enactedEpochMatch[1]}`;

            const expiredEpochMatch = normalized.match(/^Expired epoch\s+(.+)$/i);
            if (expiredEpochMatch) return `期限切れエポック ${expiredEpochMatch[1]}`;

            const droppedEpochMatch = normalized.match(/^Dropped epoch\s+(.+)$/i);
            if (droppedEpochMatch) return `ドロップエポック ${droppedEpochMatch[1]}`;

            const noExpirationMatch = normalized.match(/^No expiration data$/i);
            if (noExpirationMatch) return '期限データなし';

            const totalAskMatch = normalized.match(/^Total ask\s+(.+)$/i);
            if (totalAskMatch) return `${translations.total_ask || '総要求額'} ${totalAskMatch[1]}`;

            const yesValueMatch = normalized.match(/^Yes\s+(.+)$/i);
            if (yesValueMatch) return `${translations.yes || '賛成'} ${yesValueMatch[1]}`;

            const noNotVotedValueMatch = normalized.match(/^No\s+-\s+Not Voted\s+(.+)$/i);
            if (noNotVotedValueMatch) return `${translations.no || '反対'} - ${translations.not_voted || '未投票'} ${noNotVotedValueMatch[1]}`;

            const noValueMatch = normalized.match(/^No\s+(.+)$/i);
            if (noValueMatch) return `${translations.no || '反対'} ${noValueMatch[1]}`;

            const abstainValueMatch = normalized.match(/^Abstain\s+(.+)$/i);
            if (abstainValueMatch) return `${translations.abstain || '棄権'} ${abstainValueMatch[1]}`;

            const drepVotedMatch = normalized.match(/^DRep voted\s+(.+)$/i);
            if (drepVotedMatch) return `DRep投票 ${getAutoTranslationValue(drepVotedMatch[1]) || drepVotedMatch[1]}`;

            const mostInSyncMatch = normalized.match(/^Most in sync with\s+(.+?)\s+-\s+(.+?)\s+\((.+?)\/(.+?)\s+shared votes\)$/i);
            if (mostInSyncMatch) return `${mostInSyncMatch[1]}と最も同期 - ${mostInSyncMatch[2]}（共有投票 ${mostInSyncMatch[3]}/${mostInSyncMatch[4]}）`;

            const nclUsedMatch = normalized.match(/^NCL Used\s+(.+)$/i);
            if (nclUsedMatch) return `NCL使用済み ${nclUsedMatch[1]}`;

            const nclAvailableMatch = normalized.match(/^NCL Available\s+(.+)$/i);
            if (nclAvailableMatch) return `NCL利用可能 ${nclAvailableMatch[1]}`;

            const pipelineMatch = normalized.match(/^Pipeline\s+(.+)$/i);
            if (pipelineMatch) return `パイプライン ${pipelineMatch[1]}`;

            const drepNameExistsMatch = normalized.match(/^The DRep name "(.+)" already exists\. Choose a unique name\.$/i);
            if (drepNameExistsMatch) return `DRep名「${drepNameExistsMatch[1]}」はすでに存在します。一意の名前を選んでください。`;

            const drepLengthMatch = normalized.match(/^DRep name must be\s+(\d+)\s+characters or shorter\.$/i);
            if (drepLengthMatch) return `DRep名は${drepLengthMatch[1]}文字以内である必要があります。`;

            const textLengthMatch = normalized.match(/^(.+)\s+must be\s+(.+)\s+characters or shorter\.$/i);
            if (textLengthMatch) return `${getAutoTranslationValue(textLengthMatch[1]) || textLengthMatch[1]}は${textLengthMatch[2]}文字以内である必要があります。`;

            const urlHashTogetherMatch = normalized.match(/^(.+)\s+and\s+(.+)\s+must be provided together\.$/i);
            if (urlHashTogetherMatch) return `${getAutoTranslationValue(urlHashTogetherMatch[1]) || urlHashTogetherMatch[1]}と${getAutoTranslationValue(urlHashTogetherMatch[2]) || urlHashTogetherMatch[2]}は一緒に入力する必要があります。`;

            const validHttpsMatch = normalized.match(/^(.+)\s+must be a valid HTTPS URL\.$/i);
            if (validHttpsMatch) return `${getAutoTranslationValue(validHttpsMatch[1]) || validHttpsMatch[1]}は有効なHTTPS URLである必要があります。`;

            const validMetadataUrlMatch = normalized.match(/^Enter a valid HTTPS or IPFS\s+(.+)\.$/i);
            if (validMetadataUrlMatch) return `有効なHTTPSまたはIPFSの${validMetadataUrlMatch[1]}を入力してください。`;

            const metadataBeforeHashMatch = normalized.match(/^Enter the\s+(.+)\s+before creating its hash\.$/i);
            if (metadataBeforeHashMatch) return `ハッシュを作成する前に${metadataBeforeHashMatch[1]}を入力してください。`;

            const bytesMatch = normalized.match(/^(.+)\s+must be\s+(\d+)\s+bytes or shorter\.$/i);
            if (bytesMatch) return `${getAutoTranslationValue(bytesMatch[1]) || bytesMatch[1]}は${bytesMatch[2]}バイト以内である必要があります。`;

            const urlProtocolMatch = normalized.match(/^(.+)\s+must use HTTPS or IPFS\.$/i);
            if (urlProtocolMatch) return `${getAutoTranslationValue(urlProtocolMatch[1]) || urlProtocolMatch[1]}はHTTPSまたはIPFSを使用する必要があります。`;

            const registrationFailedMatch = normalized.match(/^Registration failed:\s*(.+)$/i);
            if (registrationFailedMatch) return `登録に失敗しました: ${registrationFailedMatch[1]}`;

            const offlineMatch = normalized.match(/^Offline\s+(.+)$/i);
            if (offlineMatch) return `オフライン ${offlineMatch[1]}`;

            const treasuryEpochValueMatch = normalized.match(/^Treasury Epoch\s+(.+)$/i);
            if (treasuryEpochValueMatch) return `財務庫エポック ${treasuryEpochValueMatch[1]}`;

            const incomeMatch = normalized.match(/^Income\s+(.+)$/i);
            if (incomeMatch) return `収入 ${incomeMatch[1]}`;

            const nclBalanceMatch = normalized.match(/^NCL Balance\s+(.+)$/i);
            if (nclBalanceMatch) return `NCL残高 ${nclBalanceMatch[1]}`;

            const spendMatch = normalized.match(/^Spend\s+(.+)$/i);
            if (spendMatch) return `支出 ${spendMatch[1]}`;

            const balanceMatch = normalized.match(/^Balance\s+(.+)$/i);
            if (balanceMatch) return `残高 ${balanceMatch[1]}`;

            const netTreasuryMatch = normalized.match(/^Net \(if all treasury actions are enacted\)\s+(.+)$/i);
            if (netTreasuryMatch) return `純額（すべての財務庫アクションが実行された場合） ${netTreasuryMatch[1]}`;

            const ratifiedMatch = normalized.match(/^(\d[\d,]*)\s+ratified$/i);
            if (ratifiedMatch) return `${ratifiedMatch[1]}批准済み`;

            const activeCountMatch = normalized.match(/^(\d[\d,]*)\s+active$/i);
            if (activeCountMatch) return `${activeCountMatch[1]}アクティブ`;

            const activePrefixCountMatch = normalized.match(/^Active\s+(\d[\d,]*)$/i);
            if (activePrefixCountMatch) return `アクティブ ${activePrefixCountMatch[1]}`;

            const administratorMatch = normalized.match(/^Administrator:\s*(.+)$/i);
            if (administratorMatch) return `管理者: ${administratorMatch[1]}`;

            const weeklyBlocksMatch = normalized.match(/^Weekly Blocks\s+(.+)$/i);
            if (weeklyBlocksMatch) return `週間ブロック ${weeklyBlocksMatch[1]}`;

            const amountOfMinersMatch = normalized.match(/^Amount of miners\s+(.+)$/i);
            if (amountOfMinersMatch) return `マイナー数 ${amountOfMinersMatch[1]}`;

            const lastUpdatedMatch = normalized.match(/^Last Updated:\s+(.+)$/i);
            if (lastUpdatedMatch) return `${translations.last_updated || '最終更新:'} ${lastUpdatedMatch[1]}`;

            const companyIdsMatch = normalized.match(/^(\d[\d,]*)\s+Company IDs$/i);
            if (companyIdsMatch) return `${companyIdsMatch[1]}企業ID`;

            const nextNclPeriodMatch = normalized.match(/^Next NCL period starts in epoch\s+(.+)$/i);
            if (nextNclPeriodMatch) return `次のNCL期間はエポック${nextNclPeriodMatch[1]}に開始`;

            const askedReceivedUpdatingMatch = normalized.match(/^Asked\/received USD updating$/i);
            if (askedReceivedUpdatingMatch) return '要求/受領USDを更新中';

            const askedReceivedMatch = normalized.match(/^Asked\s+(.+?)\s+•\s+Received\s+(.+)$/i);
            if (askedReceivedMatch) return `要求 ${askedReceivedMatch[1]} • 受領 ${askedReceivedMatch[2]}`;

            const cipsCountMatch = normalized.match(/^(\d[\d,]*)\s+CIPs$/i);
            if (cipsCountMatch) return `${cipsCountMatch[1]} CIPs`;

            const relayMatch = normalized.match(/^Relay\s+(.+)$/i);
            if (relayMatch) return `リレー ${relayMatch[1]}`;

            const starchMinersMatch = normalized.match(/^(.+)\s+Starch Miners$/i);
            if (starchMinersMatch) return `${starchMinersMatch[1]} Starchマイナー`;

            const proposerMatch = normalized.match(/^Proposer:\s*(.+)$/i);
            if (proposerMatch && translations.proposer) return `${translations.proposer}: ${proposerMatch[1]}`;

            const claimedFundsMatch = normalized.match(/^Claimed Funds\s+(.+)$/i);
            if (claimedFundsMatch && translations.claimed_funds) return `${translations.claimed_funds} ${claimedFundsMatch[1]}`;

            const unclaimedFundsMatch = normalized.match(/^Unclaimed Funds\s+(.+)$/i);
            if (unclaimedFundsMatch && translations.unclaimed_funds) return `${translations.unclaimed_funds} ${unclaimedFundsMatch[1]}`;

            const claimedMatch = normalized.match(/^Claimed\s+(.+)$/i);
            if (claimedMatch) return `請求済み ${claimedMatch[1]}`;

            const notClaimedMatch = normalized.match(/^Not Claimed\s+(.+)$/i);
            if (notClaimedMatch) return `未請求 ${notClaimedMatch[1]}`;

            const unclaimedMatch = normalized.match(/^Unclaimed\s+(.+)$/i);
            if (unclaimedMatch) return `未請求 ${unclaimedMatch[1]}`;

            const votedMatch = normalized.match(/^Voted\s+(.+)$/i);
            if (votedMatch) return `投票済み ${votedMatch[1]}`;

            const notVotedMatch = normalized.match(/^Not\s+voted\s+(.+)$/i);
            if (notVotedMatch) return `未投票 ${notVotedMatch[1]}`;

            const notApplicableMatch = normalized.match(/^Not\s+applicable\s+(.+)$/i);
            if (notApplicableMatch) return `対象外 ${notApplicableMatch[1]}`;

            const eventsMatch = normalized.match(/^(.+)\s+Events$/);
            if (eventsMatch && translations.events) return `${eventsMatch[1]}${translations.events}`;

            const treasuryEpochMatch = normalized.match(/^Treasury withdrawals\s+-\s+Epoch\s+(.+)$/i);
            if (treasuryEpochMatch) return `財務庫出金 - エポック ${treasuryEpochMatch[1]}`;

            const withdrawalsWithAmountMatch = normalized.match(/^(\d[\d,]*)\s+withdrawals?\s+•\s+(.+)$/i);
            if (withdrawalsWithAmountMatch) return `${withdrawalsWithAmountMatch[1]}出金 • ${withdrawalsWithAmountMatch[2]}`;

            const withdrawalsCountMatch = normalized.match(/^(\d[\d,]*)\s+withdrawals?$/i);
            if (withdrawalsCountMatch) return `${withdrawalsCountMatch[1]}出金`;

            const loadingMatch = normalized.match(/^Loading\s+(.+?)(\.\.\.)?$/i);
            if (loadingMatch) return `${getAutoTranslationValue(loadingMatch[1]) || loadingMatch[1]}を読み込み中...`;

            const countMatch = normalized.match(/^(\d+)\s+(admin|excluded|published raffles|proposals|projects|actions|entries|members|signers|delegators|pools|articles|DReps|stake keys excluded)$/i);
            if (countMatch) return `${countMatch[1]} ${translateCountLabel(countMatch[2])}`;
        }

        if (activeLanguage !== 'nl') {
            if (normalized.includes(' • ')) {
                const translatedParts = normalized
                    .split(' • ')
                    .map(part => getAutoTranslationValue(part) || part);
                return translatedParts.some((part, index) => part !== normalized.split(' • ')[index])
                    ? translatedParts.join(' • ')
                    : '';
            }
            if (normalized.includes(' · ')) {
                const translatedParts = normalized
                    .split(' · ')
                    .map(part => getAutoTranslationValue(part) || part);
                return translatedParts.some((part, index) => part !== normalized.split(' · ')[index])
                    ? translatedParts.join(' · ')
                    : '';
            }
            return '';
        }

        const approvedUnapprovedMatch = normalized.match(/^Approved\s+(.+?)\s+•\s+Unapproved\s+(.+)$/i);
        if (approvedUnapprovedMatch) return `Goedgekeurd ${approvedUnapprovedMatch[1]} • Niet goedgekeurd ${approvedUnapprovedMatch[2]}`;

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

        const makeDrepMatch = normalized.match(/^Make\s+(.+)\s+your DRep$/i);
        if (makeDrepMatch) return `Maak ${makeDrepMatch[1]} je DRep`;

        const closeDrepDelegationMatch = normalized.match(/^Close\s+(.+)\s+DRep delegation$/i);
        if (closeDrepDelegationMatch) return `Sluit ${closeDrepDelegationMatch[1]} DRep-delegatie`;

        const drepWarningMatch = normalized.match(/^Always review the transaction in your wallet before approving\.\s+Confirm it delegates your Cardano voting power to\s+(.+)\s+and does not include anything unexpected\.$/i);
        if (drepWarningMatch) {
            return `Controleer de transactie altijd in je wallet voordat je goedkeurt. Bevestig dat deze je Cardano stemkracht aan ${drepWarningMatch[1]} delegeert en niets onverwachts bevat.`;
        }

        const activeEpochMatch = normalized.match(/^Active epoch\s+(.+)$/i);
        if (activeEpochMatch) return `Actieve epoch ${activeEpochMatch[1]}`;

        const daysMatch = normalized.match(/^(\d+)\s+days?$/i);
        if (daysMatch) return daysMatch[1] === '1' ? '1 dag' : `${daysMatch[1]} dagen`;

        const hourMatch = normalized.match(/^(\d+)\s+hours?$/i);
        if (hourMatch) return `${hourMatch[1]} uur`;

        const epochCountMatch = normalized.match(/^(.+)\s+epochs$/i);
        if (epochCountMatch) return `${epochCountMatch[1]} epochs`;

        const actionsCountMatch = normalized.match(/^(\d[\d,]*)\s+actions$/i);
        if (actionsCountMatch) return `${actionsCountMatch[1]} acties`;

        const actionCountWithTotalAskMatch = normalized.match(/^(\d[\d,]*)\s+actions\s+•\s+Total ask\s+(.+)$/i);
        if (actionCountWithTotalAskMatch) return `${actionCountWithTotalAskMatch[1]} acties • ${translations.total_ask || 'Totaal gevraagd'} ${actionCountWithTotalAskMatch[2]}`;

        const approvedActionsCountMatch = normalized.match(/^(\d[\d,]*)\s+approved actions$/i);
        if (approvedActionsCountMatch) return `${approvedActionsCountMatch[1]} goedgekeurde acties`;

        const unapprovedActionsCountMatch = normalized.match(/^(\d[\d,]*)\s+unapproved actions$/i);
        if (unapprovedActionsCountMatch) return `${unapprovedActionsCountMatch[1]} niet-goedgekeurde acties`;

        const proposalsCountMatch = normalized.match(/^(\d[\d,]*)\s+proposals$/i);
        if (proposalsCountMatch) return `${proposalsCountMatch[1]} voorstellen`;

        const projectsCountMatch = normalized.match(/^(\d[\d,]*)\s+projects$/i);
        if (projectsCountMatch) return `${projectsCountMatch[1]} projecten`;

        const fundedProjectsCountMatch = normalized.match(/^(\d[\d,]*)\s+funded projects$/i);
        if (fundedProjectsCountMatch) return `${fundedProjectsCountMatch[1]} gefinancierde projecten`;

        const membersCountMatch = normalized.match(/^(\d[\d,]*)\s+members$/i);
        if (membersCountMatch) return `${membersCountMatch[1]} leden`;

        const applicableNotApplicableMatch = normalized.match(/^(\d[\d,]*)\s+applicable\s+\/\s+(\d[\d,]*)\s+not\s+applicable$/i);
        if (applicableNotApplicableMatch) {
            return `${applicableNotApplicableMatch[1]} van toepassing / ${applicableNotApplicableMatch[2]} niet van toepassing`;
        }

        const totalActionsMatch = normalized.match(/^(\d[\d,]*)\s+total actions$/i);
        if (totalActionsMatch) return `${totalActionsMatch[1]} acties totaal`;

        const closePriceMatch = normalized.match(/^Close\s+([A-Z0-9]+)\s+price history$/i);
        if (closePriceMatch) return `Sluit ${closePriceMatch[1]} prijsgeschiedenis`;

        const closeAnyMatch = normalized.match(/^Close\s+(.+)$/i);
        if (closeAnyMatch) return `Sluit ${getAutoTranslationValue(closeAnyMatch[1]) || closeAnyMatch[1]}`;

        const closeNakamotoMetricMatch = normalized.match(/^Close\s+(.+\s+NC)$/i);
        if (closeNakamotoMetricMatch) return `Sluit ${getAutoTranslationValue(closeNakamotoMetricMatch[1]) || closeNakamotoMetricMatch[1]}`;

        const openNakamotoMetricMatch = normalized.match(/^Open\s+(.+\s+NC)$/i);
        if (openNakamotoMetricMatch) return `Open ${getAutoTranslationValue(openNakamotoMetricMatch[1]) || openNakamotoMetricMatch[1]}`;

        const candlesMatch = normalized.match(/^(\d[\d,]*)\s+candles$/i);
        if (candlesMatch) return `${candlesMatch[1]} candles`;

        const proposalEpochMetaMatch = normalized.match(/^Epoch\s+(.+?)\s+-\s+expires\s+(.+?)(?:\s+•\s+Total ask\s+(.+))?$/i);
        if (proposalEpochMetaMatch) {
            const base = `Epoch ${proposalEpochMetaMatch[1]} - verloopt ${proposalEpochMetaMatch[2]}`;
            return proposalEpochMetaMatch[3]
                ? `${base} • ${translations.total_ask || 'Totaal gevraagd'} ${proposalEpochMetaMatch[3]}`
                : base;
        }

        const epochLabelMatch = normalized.match(/^Epoch\s+(.+)$/i);
        if (epochLabelMatch) return `Epoch ${epochLabelMatch[1]}`;

        const delegatedMatch = normalized.match(/^Delegated\s+(.+)$/i);
        if (delegatedMatch) return `Gedelegeerd ${delegatedMatch[1]}`;

        const epochsRangeMatch = normalized.match(/^Epochs\s+(.+)$/i);
        if (epochsRangeMatch) return `Epochs ${epochsRangeMatch[1]}`;

        const delegationMatch = normalized.match(/^Delegation:\s*(.+)$/i);
        if (delegationMatch) return `Delegatie: ${delegationMatch[1]}`;

        const delegatorsMatch = normalized.match(/^Delegators:\s*(.+)$/i);
        if (delegatorsMatch) return `Delegatoren: ${delegatorsMatch[1]}`;

        const saturationMatch = normalized.match(/^Saturation:\s*(.+)$/i);
        if (saturationMatch) return `Saturatie: ${saturationMatch[1]}`;

        const relaysMatch = normalized.match(/^Relays:\s*(.+)$/i);
        if (relaysMatch) return `Relays: ${relaysMatch[1] === 'not advertised' ? 'niet geadverteerd' : relaysMatch[1]}`;

        const cloudServiceMatch = normalized.match(/^Cloud Service:\s*(.+)$/i);
        if (cloudServiceMatch) return `Cloudservice: ${getAutoTranslationValue(cloudServiceMatch[1]) || cloudServiceMatch[1]}`;

        const activeRelaySposMatch = normalized.match(/^(.+)\s+Active Relay SPOs$/i);
        if (activeRelaySposMatch) return `${getAutoTranslationValue(activeRelaySposMatch[1]) || activeRelaySposMatch[1]} actieve relay SPOs`;

        const drepGroupMatch = normalized.match(/^(.+)\s+DReps$/i);
        if (drepGroupMatch) return `${getAutoTranslationValue(drepGroupMatch[1]) || drepGroupMatch[1]} DReps`;

        const cloudSposMatch = normalized.match(/^(.+)\s+Cloud SPOs$/i);
        if (cloudSposMatch) return `${getAutoTranslationValue(cloudSposMatch[1]) || cloudSposMatch[1]} cloud-SPOs`;

        const nonCloudSposMatch = normalized.match(/^(.+)\s+Non-cloud SPOs$/i);
        if (nonCloudSposMatch) return `${getAutoTranslationValue(nonCloudSposMatch[1]) || nonCloudSposMatch[1]} niet-cloud-SPOs`;

        const locationMatch = normalized.match(/^Location:\s*(.+)$/i);
        if (locationMatch) return `Locatie: ${locationMatch[1]}`;

        const relayNodesMatch = normalized.match(/^Relay nodes\s+\((.+)\)$/i);
        if (relayNodesMatch) return `Relay nodes (${relayNodesMatch[1]})`;

        const nakamotoMatch = normalized.match(/^Nakamoto coefficient\s+(.+)$/i);
        if (nakamotoMatch) return `Nakamoto-coëfficiënt ${nakamotoMatch[1]}`;

        const domainsReachMatch = normalized.match(/^(.+)\s+of\s+(.+)\s+domains reach\s+(.+)\s+of stake$/i);
        if (domainsReachMatch) return `${domainsReachMatch[1]} van ${domainsReachMatch[2]} domeinen halen ${domainsReachMatch[3]} van stake`;

        const measuredDomainsMatch = normalized.match(/^(\d[\d,]*)\s+measured domains$/i);
        if (measuredDomainsMatch) return `${measuredDomainsMatch[1]} gemeten domeinen`;

        const combinedPoolsMatch = normalized.match(/^(\d[\d,]*)\s+combined pools$/i);
        if (combinedPoolsMatch) return `${combinedPoolsMatch[1]} gecombineerde pools`;

        const stakeCoverageMatch = normalized.match(/^Stake coverage\s+(.+)$/i);
        if (stakeCoverageMatch) return `Stake-dekking ${stakeCoverageMatch[1]}`;

        const knownStakeCoverageMatch = normalized.match(/^Known stake coverage\s+(.+)$/i);
        if (knownStakeCoverageMatch) return `Bekende stake-dekking ${knownStakeCoverageMatch[1]}`;

        const fiftyOneThresholdMatch = normalized.match(/^51%\s+stake threshold$/i);
        if (fiftyOneThresholdMatch) return '51% stake-drempel';

        const domainsThresholdMatch = normalized.match(/^Domains reaching the\s+(.+?)\s+threshold$/i);
        if (domainsThresholdMatch) return `Domeinen die de ${domainsThresholdMatch[1]} drempel halen`;

        const unavailableReasonMatch = normalized.match(/^(.+)\s+requires a refreshed version 2 SPO decentralization cache\.$/i);
        if (unavailableReasonMatch) return `${getAutoTranslationValue(unavailableReasonMatch[1]) || unavailableReasonMatch[1]} vereist een vernieuwde versie 2 SPO-decentralisatiecache.`;

        const relayOperatorMethodologyMatch = normalized.match(/^Minimum inferred relay operators whose combined stake reaches\s+(.+?)\.\s+Pools are grouped by a strict-majority relay operator identity derived from structured full hostnames or their relay base domain; pools without a majority remain separate\.$/i);
        if (relayOperatorMethodologyMatch) {
            return `Minimum aantal afgeleide relay-operators waarvan de gecombineerde stake ${relayOperatorMethodologyMatch[1]} bereikt. Pools worden gegroepeerd op een strict-majority relay-operatoridentiteit, afgeleid uit gestructureerde volledige hostnamen of hun relay-basisdomein; pools zonder meerderheid blijven apart.`;
        }

        const consensusMethodologyMatch = normalized.match(/^Minimum SPO operators whose combined active stake reaches\s+(.+?)\.\s+Pools are grouped by normalized operator identity and known aliases\.$/i);
        if (consensusMethodologyMatch) {
            return `Minimum aantal SPO-operators waarvan de gecombineerde actieve stake ${consensusMethodologyMatch[1]} bereikt. Pools worden gegroepeerd op genormaliseerde operatoridentiteit en bekende aliassen.`;
        }

        const consensusPoolIdMethodologyMatch = normalized.match(/^Minimum inferred SPO operators whose combined stake reaches\s+(.+?)\.\s+Pool IDs are combined when their normalized pool names match or a strict majority of their relays share the same inferred relay operator identity\.$/i);
        if (consensusPoolIdMethodologyMatch) {
            return `Minimum aantal afgeleide SPO-operators waarvan de gecombineerde stake ${consensusPoolIdMethodologyMatch[1]} bereikt. Pool-ID's worden gecombineerd wanneer hun genormaliseerde poolnamen overeenkomen of wanneer een strict majority van hun relays dezelfde afgeleide relay-operatoridentiteit deelt.`;
        }

        const hostingMethodologyMatch = normalized.match(/^Minimum hosting providers whose combined measured stake reaches\s+(.+?)\.\s+Only pools with classified relay hosting data are included\.$/i);
        if (hostingMethodologyMatch) {
            return `Minimum aantal hostingproviders waarvan de gecombineerde gemeten stake ${hostingMethodologyMatch[1]} bereikt. Alleen pools met geclassificeerde relay-hostingdata worden meegenomen.`;
        }

        const hostingFailureDomainMethodologyMatch = normalized.match(/^Minimum hosting failure domains whose combined stake reaches\s+(.+?)\.\s+Pools whose relays all use one identified provider share that provider domain; mixed, unknown, and non-cloud pools remain separate domains\.$/i);
        if (hostingFailureDomainMethodologyMatch) {
            return `Minimum aantal hosting-failure-domains waarvan de gecombineerde stake ${hostingFailureDomainMethodologyMatch[1]} bereikt. Pools waarvan alle relays één geïdentificeerde provider gebruiken delen dat provider-domein; gemengde, onbekende en niet-cloud pools blijven aparte domeinen.`;
        }

        const geographicMethodologyMatch = normalized.match(/^Minimum countries whose combined measured relay stake reaches\s+(.+?)\.\s+Only relay IPs with resolved geographic data are included\.$/i);
        if (geographicMethodologyMatch) {
            return `Minimum aantal landen waarvan de gecombineerde gemeten relay-stake ${geographicMethodologyMatch[1]} bereikt. Alleen relay-IP's met opgeloste geografische data worden meegenomen.`;
        }

        const relayHostingCountriesMethodologyMatch = normalized.match(/^Minimum relay-hosting countries whose combined attributed stake reaches\s+(.+?)\s+of identified stake\.\s+A pool's stake is divided equally across its known relay countries; IP geolocation is preferred and RDAP is used as a fallback\.$/i);
        if (relayHostingCountriesMethodologyMatch) {
            return `Minimum aantal relay-hostinglanden waarvan de gecombineerde toegerekende stake ${relayHostingCountriesMethodologyMatch[1]} van de geïdentificeerde stake bereikt. De stake van een pool wordt gelijk verdeeld over de bekende relay-landen; IP-geolocatie heeft voorkeur en RDAP wordt als fallback gebruikt.`;
        }

        const softwareReasonMatch = normalized.match(/^Cardano pool registration and relay discovery do not publish a trustworthy node implementation or client identity\.$/i);
        if (softwareReasonMatch) {
            return 'Cardano-poolregistratie en relay-discovery publiceren geen betrouwbare node-implementatie of client-identiteit.';
        }

        const softwareMethodologyMatch = normalized.match(/^Minimum independently maintained Cardano node implementations needed to reach\s+(.+?)\s+of stake\.$/i);
        if (softwareMethodologyMatch) {
            return `Minimum aantal onafhankelijk onderhouden Cardano-node-implementaties dat nodig is om ${softwareMethodologyMatch[1]} van stake te bereiken.`;
        }

        const uniqueRelayLocationsMatch = normalized.match(/^(\d[\d,]*)\s+unique relay locations from\s+(\d[\d,]*)\s+relay IP records\.\s+Zoom or drag the map; point size represents attributed active stake\.\s+Select a shared location to view all SPOs there\.\s+Map:\s+Natural Earth,\s+CC0\.$/i);
        if (uniqueRelayLocationsMatch) {
            return `${uniqueRelayLocationsMatch[1]} unieke relay-locaties uit ${uniqueRelayLocationsMatch[2]} relay-IP-records. Zoom of sleep de kaart; puntgrootte staat voor toegerekende actieve stake. Selecteer een gedeelde locatie om alle SPOs daar te bekijken. Kaart: Natural Earth, CC0.`;
        }

        const worldMapMatch = normalized.match(/^World map with\s+(\d[\d,]*)\s+unique SPO relay locations$/i);
        if (worldMapMatch) return `Wereldkaart met ${worldMapMatch[1]} unieke SPO-relaylocaties`;

        const spoCountMatch = normalized.match(/^(\d[\d,]*)\s+SPOs$/i);
        if (spoCountMatch) return `${spoCountMatch[1]} SPOs`;

        const votingPowerMatch = normalized.match(/^Voting Power\s+(.+)$/i);
        if (votingPowerMatch) return `Stemkracht ${votingPowerMatch[1]}`;

        const votingPowerColonMatch = normalized.match(/^Voting power:\s*(.+)$/i);
        if (votingPowerColonMatch) return `Stemkracht: ${votingPowerColonMatch[1]}`;

        const expiresEpochMatch = normalized.match(/^Expires epoch\s+(.+)$/i);
        if (expiresEpochMatch) return `Verloopt epoch ${expiresEpochMatch[1]}`;

        const enactedEpochMatch = normalized.match(/^Enacted Epoch\s+(.+)$/i);
        if (enactedEpochMatch) return `Uitgevoerd epoch ${enactedEpochMatch[1]}`;

        const expiredEpochMatch = normalized.match(/^Expired epoch\s+(.+)$/i);
        if (expiredEpochMatch) return `Verlopen epoch ${expiredEpochMatch[1]}`;

        const droppedEpochMatch = normalized.match(/^Dropped epoch\s+(.+)$/i);
        if (droppedEpochMatch) return `Gedropt epoch ${droppedEpochMatch[1]}`;

        const noExpirationMatch = normalized.match(/^No expiration data$/i);
        if (noExpirationMatch) return 'Geen verloopdata';

        const totalAskMatch = normalized.match(/^Total ask\s+(.+)$/i);
        if (totalAskMatch) return `${translations.total_ask || 'Totaal gevraagd'} ${totalAskMatch[1]}`;

        const yesValueMatch = normalized.match(/^Yes\s+(.+)$/i);
        if (yesValueMatch) return `${translations.yes || 'Ja'} ${yesValueMatch[1]}`;

        const noNotVotedValueMatch = normalized.match(/^No\s+-\s+Not Voted\s+(.+)$/i);
        if (noNotVotedValueMatch) return `${translations.no || 'Nee'} - ${translations.not_voted || 'Niet gestemd'} ${noNotVotedValueMatch[1]}`;

        const noValueMatch = normalized.match(/^No\s+(.+)$/i);
        if (noValueMatch) return `${translations.no || 'Nee'} ${noValueMatch[1]}`;

        const abstainValueMatch = normalized.match(/^Abstain\s+(.+)$/i);
        if (abstainValueMatch) return `${translations.abstain || 'Onthouden'} ${abstainValueMatch[1]}`;

        const drepVotedMatch = normalized.match(/^DRep voted\s+(.+)$/i);
        if (drepVotedMatch) return `DRep stemde ${getAutoTranslationValue(drepVotedMatch[1]) || drepVotedMatch[1]}`;

        const mostInSyncMatch = normalized.match(/^Most in sync with\s+(.+?)\s+-\s+(.+?)\s+\((.+?)\/(.+?)\s+shared votes\)$/i);
        if (mostInSyncMatch) {
            return `Meest synchroon met ${mostInSyncMatch[1]} - ${mostInSyncMatch[2]} (${mostInSyncMatch[3]}/${mostInSyncMatch[4]} gedeelde stemmen)`;
        }

        const nclUsedMatch = normalized.match(/^NCL Used\s+(.+)$/i);
        if (nclUsedMatch) return `NCL gebruikt ${nclUsedMatch[1]}`;

        const nclAvailableMatch = normalized.match(/^NCL Available\s+(.+)$/i);
        if (nclAvailableMatch) return `NCL beschikbaar ${nclAvailableMatch[1]}`;

        const pipelineMatch = normalized.match(/^Pipeline\s+(.+)$/i);
        if (pipelineMatch) return `Pipeline ${pipelineMatch[1]}`;

        const drepNameExistsMatch = normalized.match(/^The DRep name "(.+)" already exists\. Choose a unique name\.$/i);
        if (drepNameExistsMatch) return `De DRep-naam "${drepNameExistsMatch[1]}" bestaat al. Kies een unieke naam.`;

        const drepLengthMatch = normalized.match(/^DRep name must be\s+(\d+)\s+characters or shorter\.$/i);
        if (drepLengthMatch) return `DRep-naam mag maximaal ${drepLengthMatch[1]} tekens zijn.`;

        const textLengthMatch = normalized.match(/^(.+)\s+must be\s+(.+)\s+characters or shorter\.$/i);
        if (textLengthMatch) return `${getAutoTranslationValue(textLengthMatch[1]) || textLengthMatch[1]} mag maximaal ${textLengthMatch[2]} tekens zijn.`;

        const urlHashTogetherMatch = normalized.match(/^(.+)\s+and\s+(.+)\s+must be provided together\.$/i);
        if (urlHashTogetherMatch) return `${getAutoTranslationValue(urlHashTogetherMatch[1]) || urlHashTogetherMatch[1]} en ${getAutoTranslationValue(urlHashTogetherMatch[2]) || urlHashTogetherMatch[2]} moeten samen worden ingevuld.`;

        const validHttpsMatch = normalized.match(/^(.+)\s+must be a valid HTTPS URL\.$/i);
        if (validHttpsMatch) return `${getAutoTranslationValue(validHttpsMatch[1]) || validHttpsMatch[1]} moet een geldige HTTPS-URL zijn.`;

        const validMetadataUrlMatch = normalized.match(/^Enter a valid HTTPS or IPFS\s+(.+)\.$/i);
        if (validMetadataUrlMatch) return `Voer een geldige HTTPS- of IPFS-${validMetadataUrlMatch[1]} in.`;

        const metadataBeforeHashMatch = normalized.match(/^Enter the\s+(.+)\s+before creating its hash\.$/i);
        if (metadataBeforeHashMatch) return `Vul de ${metadataBeforeHashMatch[1]} in voordat je de hash maakt.`;

        const bytesMatch = normalized.match(/^(.+)\s+must be\s+(\d+)\s+bytes or shorter\.$/i);
        if (bytesMatch) return `${getAutoTranslationValue(bytesMatch[1]) || bytesMatch[1]} mag maximaal ${bytesMatch[2]} bytes zijn.`;

        const urlProtocolMatch = normalized.match(/^(.+)\s+must use HTTPS or IPFS\.$/i);
        if (urlProtocolMatch) return `${getAutoTranslationValue(urlProtocolMatch[1]) || urlProtocolMatch[1]} moet HTTPS of IPFS gebruiken.`;

        const registrationFailedMatch = normalized.match(/^Registration failed:\s*(.+)$/i);
        if (registrationFailedMatch) return `Registratie mislukt: ${registrationFailedMatch[1]}`;

        const offlineMatch = normalized.match(/^Offline\s+(.+)$/i);
        if (offlineMatch) return `Niet online ${offlineMatch[1]}`;

        const treasuryEpochValueMatch = normalized.match(/^Treasury Epoch\s+(.+)$/i);
        if (treasuryEpochValueMatch) return `Treasury epoch ${treasuryEpochValueMatch[1]}`;

        const incomeMatch = normalized.match(/^Income\s+(.+)$/i);
        if (incomeMatch) return `Inkomen ${incomeMatch[1]}`;

        const nclBalanceMatch = normalized.match(/^NCL Balance\s+(.+)$/i);
        if (nclBalanceMatch) return `NCL balans ${nclBalanceMatch[1]}`;

        const spendMatch = normalized.match(/^Spend\s+(.+)$/i);
        if (spendMatch) return `Uitgaven ${spendMatch[1]}`;

        const balanceMatch = normalized.match(/^Balance\s+(.+)$/i);
        if (balanceMatch) return `Balans ${balanceMatch[1]}`;

        const netTreasuryMatch = normalized.match(/^Net \(if all treasury actions are enacted\)\s+(.+)$/i);
        if (netTreasuryMatch) return `Netto (als alle treasury-acties worden uitgevoerd) ${netTreasuryMatch[1]}`;

        const ratifiedMatch = normalized.match(/^(\d[\d,]*)\s+ratified$/i);
        if (ratifiedMatch) return `${ratifiedMatch[1]} geratificeerd`;

        const activeCountMatch = normalized.match(/^(\d[\d,]*)\s+active$/i);
        if (activeCountMatch) return `${activeCountMatch[1]} actief`;

        const activePrefixCountMatch = normalized.match(/^Active\s+(\d[\d,]*)$/i);
        if (activePrefixCountMatch) return `Actief ${activePrefixCountMatch[1]}`;

        const administratorMatch = normalized.match(/^Administrator:\s*(.+)$/i);
        if (administratorMatch) return `Administrator: ${administratorMatch[1]}`;

        const weeklyBlocksMatch = normalized.match(/^Weekly Blocks\s+(.+)$/i);
        if (weeklyBlocksMatch) return `Wekelijkse blocks ${weeklyBlocksMatch[1]}`;

        const amountOfMinersMatch = normalized.match(/^Amount of miners\s+(.+)$/i);
        if (amountOfMinersMatch) return `Aantal miners ${amountOfMinersMatch[1]}`;

        const lastUpdatedMatch = normalized.match(/^Last Updated:\s+(.+)$/i);
        if (lastUpdatedMatch) return `${translations.last_updated || 'Laatst bijgewerkt:'} ${lastUpdatedMatch[1]}`;

        const companyIdsMatch = normalized.match(/^(\d[\d,]*)\s+Company IDs$/i);
        if (companyIdsMatch) return `${companyIdsMatch[1]} bedrijfs-ID's`;

        const resetInMatch = normalized.match(/^Reset in\s+(.+)$/i);
        if (resetInMatch) return `Reset over ${resetInMatch[1]}`;

        const nextNclPeriodMatch = normalized.match(/^Next NCL period starts in epoch\s+(.+)$/i);
        if (nextNclPeriodMatch) return `Volgende NCL-periode start in epoch ${nextNclPeriodMatch[1]}`;

        const askedReceivedUpdatingMatch = normalized.match(/^Asked\/received USD updating$/i);
        if (askedReceivedUpdatingMatch) return 'Aangevraagd/ontvangen USD wordt bijgewerkt';

        const askedReceivedMatch = normalized.match(/^Asked\s+(.+?)\s+•\s+Received\s+(.+)$/i);
        if (askedReceivedMatch) return `Aangevraagd ${askedReceivedMatch[1]} • Ontvangen ${askedReceivedMatch[2]}`;

        const cipsCountMatch = normalized.match(/^(\d[\d,]*)\s+CIPs$/i);
        if (cipsCountMatch) return `${cipsCountMatch[1]} CIPs`;

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

        const notVotedMatch = normalized.match(/^Not\s+voted\s+(.+)$/i);
        if (notVotedMatch) return `Niet gestemd ${notVotedMatch[1]}`;

        const notApplicableMatch = normalized.match(/^Not\s+applicable\s+(.+)$/i);
        if (notApplicableMatch) return `Niet van toepassing ${notApplicableMatch[1]}`;

        const eventsMatch = normalized.match(/^(.+)\s+Events$/);
        if (eventsMatch && translations.events) return `${eventsMatch[1]} ${translations.events.toLowerCase()}`;

        const treasuryEpochMatch = normalized.match(/^Treasury withdrawals\s+-\s+Epoch\s+(.+)$/i);
        if (treasuryEpochMatch) return `Treasury-opnames - Epoch ${treasuryEpochMatch[1]}`;

        const withdrawalsWithAmountMatch = normalized.match(/^(\d[\d,]*)\s+withdrawals?\s+•\s+(.+)$/i);
        if (withdrawalsWithAmountMatch) {
            const count = withdrawalsWithAmountMatch[1];
            const label = count === '1' ? 'opname' : 'opnames';
            return `${count} ${label} • ${withdrawalsWithAmountMatch[2]}`;
        }

        const withdrawalsCountMatch = normalized.match(/^(\d[\d,]*)\s+withdrawals?$/i);
        if (withdrawalsCountMatch) {
            const count = withdrawalsCountMatch[1];
            const label = count === '1' ? 'opname' : 'opnames';
            return `${count} ${label}`;
        }

        const loadingMatch = normalized.match(/^Loading\s+(.+?)(\.\.\.)?$/i);
        if (loadingMatch) {
            return `${loadingMatch[1]} laden...`;
        }

        const countMatch = normalized.match(/^(\d+)\s+(admin|excluded|published raffles|proposals|projects|actions|entries|members|signers|delegators|pools|articles|DReps|stake keys excluded)$/i);
        if (countMatch) return `${countMatch[1]} ${translateCountLabel(countMatch[2])}`;

        return '';
    }

    function translateCountLabel(label) {
        const normalized = String(label || '').toLowerCase();
        if (activeLanguage === 'ja') {
            if (normalized === 'admin') return '管理者';
            if (normalized === 'excluded') return '除外';
            if (normalized === 'published raffles') return '公開済みラッフル';
            if (normalized === 'proposals') return '提案';
            if (normalized === 'projects') return 'プロジェクト';
            if (normalized === 'actions') return 'アクション';
            if (normalized === 'entries') return '項目';
            if (normalized === 'members') return 'メンバー';
            if (normalized === 'signers') return '署名者';
            if (normalized === 'delegators') return '委任者';
            if (normalized === 'pools') return 'プール';
            if (normalized === 'articles') return '記事';
            if (normalized === 'dreps') return 'DRep';
            if (normalized === 'stake keys excluded') return '除外ステークキー';
            return label;
        }
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
        if (normalized === 'dreps') return 'DReps';
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
        const translated = activeLanguage !== DEFAULT_LANGUAGE ? getAutoTranslationValue(original) : '';
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
        const translated = activeLanguage !== DEFAULT_LANGUAGE ? getAutoTranslationValue(original) : '';
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

    async function loadLanguageTranslations(language) {
        const config = LANGUAGE_CONFIG[language];
        if (!config?.url) {
            translations = {};
            return;
        }
        if (!translationLoadPromises.has(language)) {
            translationLoadPromises.set(language, fetch(config.url)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(parseTomlStrings));
        }
        translations = await translationLoadPromises.get(language);
    }

    async function setLanguage(language) {
        activeLanguage = LANGUAGE_CONFIG[language] ? language : DEFAULT_LANGUAGE;
        localStorage.setItem(LANGUAGE_STORAGE_KEY, activeLanguage);
        await loadLanguageTranslations(activeLanguage);
        applyTranslations();
        window.dispatchEvent(new CustomEvent('tdsp-language-change', {
            detail: { language: activeLanguage }
        }));
    }

    function syncLanguageToggle() {
        document.querySelectorAll?.('[data-language-option]').forEach(button => {
            if (!(button instanceof HTMLButtonElement)) return;
            const language = button.dataset.languageOption || DEFAULT_LANGUAGE;
            const isActive = language === activeLanguage;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }

    function initLanguageToggle() {
        document.querySelectorAll?.('[data-language-option]').forEach(button => {
            if (!(button instanceof HTMLButtonElement) || button.dataset.languageBound === 'true') return;
            button.dataset.languageBound = 'true';
            button.addEventListener('click', () => {
                setLanguage(button.dataset.languageOption || DEFAULT_LANGUAGE)
                    .catch(error => console.error('Language switch failed.', error));
            });
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
        const ready = loadLanguageTranslations(activeLanguage);
        ready
            .then(() => {
                applyTranslations();
                observeDynamicTranslations();
            })
            .catch(error => {
                console.error('Language file could not be loaded.', error);
                activeLanguage = DEFAULT_LANGUAGE;
                translations = {};
                applyTranslations();
            });
    }

    window.TDSPI18n = Object.freeze({
        applyTranslations,
        getLanguage: () => activeLanguage,
        setLanguage,
        translateText: (text) => {
            const translated = activeLanguage !== DEFAULT_LANGUAGE ? getAutoTranslationValue(text) : '';
            return translated || text;
        }
    });

    window.TDSPRuntime?.onReady ? window.TDSPRuntime.onReady(init) : document.addEventListener('DOMContentLoaded', init, { once: true });
}());
