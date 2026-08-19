(function initializeTdspI18n() {
    const LANGUAGE_STORAGE_KEY = 'tdsp-language';
    const DEFAULT_LANGUAGE = 'en';
    const DUTCH_LANGUAGE = 'nl';
    const DUTCH_TOML_URL = 'locales/nl.toml?v=20260819-dutch-all-tile-titles';
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
        '.raffle-open-tile strong',
        'button[data-i18n-auto]'
    ].join(',');
    const AUTO_TRANSLATION_KEYS = new Map([
        ['Active Mithril Signers', 'active_mithril_signers'],
        ['Admin Area', 'admin_area'],
        ['Admin Users', 'admin_users'],
        ['Active Relay', 'active_relay'],
        ['Approved Governance Actions', 'approved_governance_actions'],
        ['Become a DRep', 'become_drep'],
        ['Cardano Constitution', 'cardano_constitution'],
        ['Cardano Decentralization', 'cardano_decentralization'],
        ['Cardano Events', 'cardano_events'],
        ['Cardano Governance', 'cardano_governance'],
        ['Cardano Improvement Proposals', 'cardano_improvement_proposals'],
        ['Cardano Treasury', 'cardano_treasury'],
        ['Catalyst funding status', 'catalyst_funding_status'],
        ['Catalyst vote overview', 'catalyst_vote_overview'],
        ['Catalyst proposal', 'catalyst_proposal'],
        ['Catalyst/Treasury Funding', 'catalyst_treasury_funding'],
        ['Catalyst/Treasury Funding Claimed', 'catalyst_treasury_funding_claimed'],
        ['Catalyst/Treasury Recipients', 'catalyst_treasury_recipients'],
        ['CC Members', 'cc_members'],
        ['Companies', 'companies'],
        ['Constitution', 'constitution'],
        ['Constitutional Committee Members', 'constitutional_committee_members'],
        ['Crypto News', 'crypto_news'],
        ['DRep profile', 'drep_profile'],
        ['DRep vote overview', 'drep_vote_overview'],
        ['DReps', 'dreps'],
        ['Dashboard', 'dashboard'],
        ['Delegation', 'delegation'],
        ['Delegators', 'delegators'],
        ['Delegators Dashboard', 'delegators_dashboard'],
        ['Draw', 'draw'],
        ['Draw and Publish', 'draw_and_publish'],
        ['Eligible Delegators', 'eligible_delegators'],
        ['Events', 'events'],
        ['Excluded Stake Keys', 'excluded_stake_keys'],
        ['Exclusion List', 'exclusion_list'],
        ['External links', 'external_links'],
        ['Fixed cost', 'fixed_cost'],
        ['Governance Actions', 'governance_actions'],
        ['History', 'history'],
        ['Live stake', 'live_stake'],
        ['Margin', 'margin'],
        ['Miners', 'miners'],
        ['NCL', 'ncl'],
        ['Net Change Limit', 'net_change_limit'],
        ['On-chain DRep registration', 'onchain_drep_registration'],
        ['Passive Relay', 'passive_relay'],
        ['Pool Delegators', 'pool_delegators'],
        ['Pool ID', 'pool_id'],
        ['Pledge', 'pledge'],
        ['Prices', 'prizes'],
        ['Proposal Summary', 'proposal_summary'],
        ['Raffles', 'raffles'],
        ['Read', 'read'],
        ['Realfi SPO', 'realfi_spo'],
        ['Rejected Actions', 'rejected_actions'],
        ['SPO Status', 'spo_status'],
        ['SPO status unavailable', 'spo_status_unavailable'],
        ['SPO vote overview', 'spo_vote_overview'],
        ['SPOs with no on-chain relays advertised', 'spos_no_advertised_relays'],
        ['SPOs with only passive relays', 'spos_passive_relays'],
        ['SPOs', 'spos'],
        ['Status unavailable', 'status_unavailable'],
        ['Saturation', 'saturation'],
        ['Starch Pools', 'starch_pools'],
        ['Starch Stats', 'starch_stats'],
        ['Top 10 DReps', 'top_10_dreps'],
        ['Total Delegated', 'total_delegated'],
        ['Treasury withdrawal history', 'treasury_withdrawal_history'],
        ['Unapproved Treasury', 'unapproved_treasury'],
        ['Unknown Relay', 'unknown_relay'],
        ['Vote Sync', 'vote_sync'],
        ['Vote rationale', 'vote_rationale'],
        ['Voting Power', 'voting_power'],
        ['Voting Stats', 'voting_stats'],
        ['Withdrawals by administrator', 'withdrawals_by_administrator']
    ]);
    let translations = {};
    let activeLanguage = DEFAULT_LANGUAGE;
    let dutchLoadPromise = null;

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

        const fundMatch = normalized.match(/^Fund\s+(\d+)$/i);
        if (fundMatch) return `Fonds ${fundMatch[1]}`;

        const priceMatch = normalized.match(/^([A-Z0-9]+)\s+Price$/);
        if (priceMatch) return `${priceMatch[1]} prijs`;

        const eventsMatch = normalized.match(/^(.+)\s+Events$/);
        if (eventsMatch && translations.events) return `${eventsMatch[1]} ${translations.events.toLowerCase()}`;

        const treasuryEpochMatch = normalized.match(/^Treasury withdrawals\s+-\s+Epoch\s+(.+)$/i);
        if (treasuryEpochMatch) return `Treasury withdrawals - Epoch ${treasuryEpochMatch[1]}`;

        return '';
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

    function applyTranslations(root = document) {
        root.querySelectorAll?.(`[${TRANSLATION_ATTR}]`).forEach(translateElement);
        root.querySelectorAll?.(AUTO_TRANSLATION_SELECTOR).forEach(translateAutoElement);
        if (root instanceof HTMLElement) {
            if (root.hasAttribute(TRANSLATION_ATTR)) translateElement(root);
            if (root.matches?.(AUTO_TRANSLATION_SELECTOR)) translateAutoElement(root);
        }
        document.documentElement.lang = activeLanguage;
        syncLanguageToggle();
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
            entries.forEach(entry => {
                entry.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.hasAttribute(TRANSLATION_ATTR)) translateElement(node);
                    applyTranslations(node);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
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
