(function initializeDelegatorDashboardTemplates() {
    function createTemplate(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const root = template.content.firstElementChild;
        const connect = root.querySelector('[data-wallet-connect]');
        if (connect) {
            const { box } = window.TDSPRuntime.createWalletConnectBox({
                id: connect.id,
                prompt: 'Select Passkey to connect',
                content: [...connect.childNodes]
            });
            box.hidden = connect.hidden;
            connect.replaceWith(box);
        }
        markDashboardStaticText(root);
        window.TDSPI18n?.applyTranslations?.(root);
        return root;
    }

    function markDashboardStaticText(root) {
        if (!(root instanceof HTMLElement)) return;
        root.querySelectorAll('p, h1, h2, strong, span, button, label, legend, summary').forEach(element => {
            if (!(element instanceof HTMLElement)) return;
            if (element.closest('#raffle-wallet-list, #raffle-draws, #raffle-prizes-list, #raffle-exclusion-list, #raffle-admin-user-list, #raffle-lost-stake-list')) return;
            if (element.querySelector('input, textarea, code, img, span.governance-close-icon')) return;
            const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text) return;
            element.setAttribute('data-i18n-auto', '');
            element.setAttribute('data-i18n-auto-original', text);
        });
        root.querySelectorAll('input[placeholder], textarea[placeholder], button[aria-label]').forEach(element => {
            if (!(element instanceof HTMLElement)) return;
            const placeholder = element.getAttribute('placeholder');
            if (placeholder) element.setAttribute('data-i18n-placeholder-original', placeholder);
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) element.setAttribute('data-i18n-aria-label-original', ariaLabel);
        });
    }

    function createDelegatorsDashboardBody() {
        return createTemplate(`
            <div class="raffle-page raffle-embedded raffle-overlay-page">
                <main class="raffle-main">
                    <section data-wallet-connect id="raffle-access">
                        <div id="raffle-wallet-list" class="wallet-list raffle-wallet-list">
                            <button id="member-portfolio-public-open" type="button" class="wallet-option" aria-describedby="raffle-passkey-help"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="11" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg><span data-i18n-auto data-i18n-auto-original="Passkey">Passkey</span></button>
                        </div>
                        <p id="raffle-passkey-help" class="small muted">To create a passkey for your wallet Portfolio, connect your wallet first, then add a passkey in Portfolio storage settings.</p>
                    </section>

                    <section class="raffle-shell" id="raffle-protected" hidden>
                        <div class="raffle-title-row">
                            <div>
                                <p class="eyebrow">Verified TDSP delegator</p>
                                <h1>Dashboard</h1>
                            </div>
                            <button id="raffle-logout" class="governance-vote-secondary" type="button">Lock</button>
                        </div>
                        <div id="raffle-identity" class="governance-menu-card raffle-identity"></div>
                        <div class="tdsp-tile-grid">


                        </div>
                    </section>
                    <p id="raffle-status" class="wallet-status raffle-status" role="status" aria-live="polite" hidden></p>
                </main>


            </div>
        `);
    }

    function createAdminDashboardBody() {
        return createTemplate(`
            <div class="raffle-page raffle-embedded raffle-overlay-page">
                <main class="raffle-main">
                    <section class="raffle-shell" id="raffle-access">
                        <p class="eyebrow">Restricted</p>
                        <h1>Admin Area</h1>
                        <p>Connect the authorized Cardano wallet and sign the one-time access challenge. This does not create a transaction or cost ADA.</p>
                        <button id="raffle-connect" class="governance-vote-button" type="button">Connect Admin Wallet</button>
                        <div id="raffle-wallet-list" class="wallet-list raffle-wallet-list"></div>
                    </section>

                    <section class="raffle-shell" id="raffle-protected" hidden>
                        <div class="raffle-title-row">
                            <div>
                                <p class="eyebrow">Verified administrator</p>
                                <h1>Admin Area</h1>
                            </div>
                            <button id="raffle-logout" class="governance-vote-secondary" type="button">Lock</button>
                        </div>


                        <div class="tdsp-tile-grid">

                            <button class="governance-menu-card raffle-open-tile" id="raffle-admin-users-open" type="button">
                                <strong class="governance-card-title">Admin Users</strong>
                                <span class="governance-card-detail" id="raffle-dashboard-admin-count">1 admin</span>
                            </button>
                            <button class="governance-menu-card raffle-open-tile" id="website-status-open" type="button">
                                <strong class="governance-card-title">Website Status</strong>
                                <span class="governance-card-detail">Backend, API calls and caches</span>
                            </button>

                            <button class="governance-menu-card raffle-open-tile" id="member-portfolio-open" type="button">
                                <strong class="governance-card-title">Portfolio</strong>
                                <span class="governance-card-detail">Your stake wallet and portfolio</span>
                            </button>
                        </div>
                    </section>
                    <p id="raffle-status" class="wallet-status raffle-status" role="status" aria-live="polite" hidden></p>
                </main>

                <section class="raffle-admin-panel" data-raffle-view-panel="admins" hidden>
                                <form class="governance-menu-card raffle-form" id="raffle-admin-users-form">
                                    <h2 class="governance-card-title">Admin Users</h2>
                                    <p class="governance-card-detail">Add Cardano Mainnet payment or stake addresses that may open the Admin Area. At least one admin must remain.</p>
                                    <label for="raffle-admin-addresses">Admin addresses</label>
                                    <textarea id="raffle-admin-addresses" name="addresses" rows="5" spellcheck="false" autocomplete="off" placeholder="addr1... or stake1..."></textarea>
                                    <p class="governance-card-detail">Format: enter one complete Mainnet address per line. Comma-separated addresses are also accepted.</p>
                                    <p class="governance-card-detail" id="raffle-admin-users-count">1 admin</p>
                                    <div class="raffle-exclusion-list" id="raffle-admin-user-list"></div>
                                    <button class="governance-vote-secondary" type="submit">Add Admin Users</button>
                                    <p class="raffle-inline-status" id="raffle-admin-users-status" role="status" aria-live="polite"></p>
                                </form>
                            </section>
<section class="raffle-admin-panel" data-raffle-view-panel="portfolio_access" hidden>
                                <div id="portfolio-access-list" class="raffle-exclusion-list"></div>
                                <p id="portfolio-access-status" class="raffle-inline-status" role="status" aria-live="polite"></p>
                            </section>
            </div>
        `);
    }

    window.TDSPDelegatorDashboardTemplates = Object.freeze({
        createDelegatorsDashboardBody,
        createAdminDashboardBody
    });
}());
