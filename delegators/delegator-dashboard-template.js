(function initializeDelegatorDashboardTemplates() {
    function createTemplate(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const root = template.content.firstElementChild;
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
                    <section class="raffle-shell" id="raffle-access">
                        <p class="eyebrow">TDSP Delegators</p>
                        <h1>Dashboard</h1>
                        <p>Sign a one-time wallet challenge with a stake key currently delegated to TDSP. This does not create a transaction or cost ADA.</p>
                        <button id="raffle-connect" class="governance-vote-button" type="button">Connect Delegator Wallet</button>
                        <div id="raffle-wallet-list" class="wallet-list raffle-wallet-list"></div>
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
                            <button class="governance-menu-card raffle-open-tile" id="raffle-open" type="button">
                                <strong class="governance-card-title">Raffles</strong>
                            </button>
                            <button class="governance-menu-card raffle-open-tile" id="raffle-prizes-open" type="button">
                                <strong class="governance-card-title">Prizes</strong>
                                <span class="governance-card-detail" id="raffle-prizes-summary">Raffle wallet tokens</span>
                            </button>
                        </div>
                    </section>
                    <p id="raffle-status" class="wallet-status raffle-status" role="status" aria-live="polite" hidden></p>
                </main>

                <div class="governance-overlay governance-menu-overlay raffle-overlay" id="raffle-overlay" role="dialog" aria-modal="true" aria-labelledby="raffle-overlay-title" hidden>
                    <section class="governance-dialog raffle-dialog">
                        <header class="overlay-dialog-header">
                            <div class="overlay-dialog-header-copy">
                                <p class="eyebrow">Delegators Area</p>
                                <h2 id="raffle-overlay-title">Raffles</h2>
                            </div>
                            <div class="overlay-dialog-header-actions">
                                <button class="governance-back-to-root" id="raffle-overlay-back" type="button" aria-label="Back to Dashboard">&lt;</button>
                                <button class="governance-close" id="raffle-overlay-close" type="button" aria-label="Close Raffles">
                                    <span class="governance-close-icon" aria-hidden="true"></span>
                                </button>
                            </div>
                        </header>
                        <div class="overlay-dialog-body raffle-overlay-body">
                            <div class="raffle-draws" id="raffle-draws"></div>
                        </div>
                    </section>
                </div>

                <div class="governance-overlay governance-menu-overlay raffle-overlay" id="raffle-prizes-overlay" role="dialog" aria-modal="true" aria-labelledby="raffle-prizes-title" hidden>
                    <section class="governance-dialog raffle-dialog">
                        <header class="overlay-dialog-header">
                            <div class="overlay-dialog-header-copy">
                                <p class="eyebrow">Delegators Area</p>
                                <h2 id="raffle-prizes-title">Prizes</h2>
                            </div>
                            <div class="overlay-dialog-header-actions">
                                <button class="governance-back-to-root" id="raffle-prizes-back" type="button" aria-label="Back to Dashboard">&lt;</button>
                                <button class="governance-close" id="raffle-prizes-close" type="button" aria-label="Close Prizes">
                                    <span class="governance-close-icon" aria-hidden="true"></span>
                                </button>
                            </div>
                        </header>
                        <div class="overlay-dialog-body raffle-overlay-body">
                            <div class="raffle-draws" id="raffle-prizes-list"></div>
                        </div>
                    </section>
                </div>
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

                        <div class="tdsp-tile-grid raffle-stats">
                            <div>
                                <strong id="raffle-eligible-count">0</strong>
                                <span>Eligible Delegators</span>
                            </div>
                            <div>
                                <strong id="raffle-total-stake">₳ 0</strong>
                                <span>Total Delegated</span>
                            </div>
                        </div>
                        <p class="governance-card-detail" id="raffle-snapshot-time">Pool snapshot unavailable</p>
                        <div class="tdsp-tile-grid">
                            <button class="governance-menu-card raffle-open-tile" id="raffle-open" type="button">
                                <strong class="governance-card-title">Raffles</strong>
                                <span class="governance-card-detail">Draw, publish and review raffle results</span>
                            </button>
                            <button class="governance-menu-card raffle-open-tile" id="raffle-admin-users-open" type="button">
                                <strong class="governance-card-title">Admin Users</strong>
                                <span class="governance-card-detail" id="raffle-dashboard-admin-count">1 admin</span>
                            </button>
                            <button class="governance-menu-card raffle-open-tile" id="raffle-lost-stake-open" type="button">
                                <strong class="governance-card-title">Lost stake</strong>
                                <span class="governance-card-detail" id="raffle-dashboard-lost-stake-count">Stake on retired pools</span>
                            </button>
                        </div>
                    </section>
                    <p id="raffle-status" class="wallet-status raffle-status" role="status" aria-live="polite" hidden></p>
                </main>

                <div class="governance-overlay governance-menu-overlay raffle-overlay" id="raffle-overlay" role="dialog" aria-modal="true" aria-labelledby="raffle-overlay-title" hidden>
                    <section class="governance-dialog raffle-dialog">
                        <header class="overlay-dialog-header">
                            <div class="overlay-dialog-header-copy">
                                <p class="eyebrow">Admin Area</p>
                                <h2 id="raffle-overlay-title">Raffles</h2>
                            </div>
                            <div class="overlay-dialog-header-actions">
                                <button class="governance-back-to-root" id="raffle-overlay-back" type="button" aria-label="Back to Raffles" hidden>&lt;</button>
                                <button class="governance-close" id="raffle-overlay-close" type="button" aria-label="Close Raffles">
                                    <span class="governance-close-icon" aria-hidden="true"></span>
                                </button>
                            </div>
                        </header>
                        <div class="overlay-dialog-body raffle-overlay-body">
                            <div class="tdsp-tile-grid" id="raffle-admin-menu">
                                <button class="governance-menu-card raffle-open-tile" type="button" data-raffle-view="draw">
                                    <strong class="governance-card-title">Draw</strong>
                                    <span class="governance-card-detail">Select and publish a raffle winner</span>
                                </button>
                                <button class="governance-menu-card raffle-open-tile" type="button" data-raffle-view="exclusions">
                                    <strong class="governance-card-title">Exclusion List</strong>
                                    <span class="governance-card-detail" id="raffle-menu-exclusion-count">0 excluded</span>
                                </button>
                                <button class="governance-menu-card raffle-open-tile" type="button" data-raffle-view="history">
                                    <strong class="governance-card-title">History</strong>
                                    <span class="governance-card-detail" id="raffle-menu-history-count">0 published raffles</span>
                                </button>
                            </div>

                            <section class="raffle-admin-panel" data-raffle-view-panel="draw" hidden>
                                <form class="governance-menu-card raffle-form" id="raffle-draw-form">
                                    <h2 class="governance-card-title">Draw and Publish</h2>
                                    <label for="raffle-title">Raffle title</label>
                                    <input id="raffle-title" name="title" maxlength="120" required>
                                    <label for="raffle-prize">Prize</label>
                                    <input id="raffle-prize" name="prize" maxlength="120" placeholder="For example: 100 ADA">
                                    <label for="raffle-notes">Public notes</label>
                                    <textarea id="raffle-notes" name="notes" maxlength="500" rows="4"></textarea>
                                    <label class="raffle-confirm" for="raffle-confirm">
                                        <input id="raffle-confirm" name="confirmation" type="checkbox" required>
                                        <span>Publish this auditable result to verified TDSP delegators.</span>
                                    </label>
                                    <fieldset class="raffle-publish-options">
                                        <legend>Publication method</legend>
                                        <label class="raffle-confirm" for="raffle-publish-website">
                                            <input id="raffle-publish-website" name="publish_mode" type="radio" value="website" checked>
                                            <span>Publish on the website only (no network fee).</span>
                                        </label>
                                        <label class="raffle-confirm" for="raffle-publish-on-chain">
                                            <input id="raffle-publish-on-chain" name="publish_mode" type="radio" value="on_chain">
                                            <span>Publish on the website and record proof on Cardano Mainnet (network fee required).</span>
                                        </label>
                                    </fieldset>
                                    <button class="governance-vote-button" type="submit">Draw and Publish Winner</button>
                                </form>
                            </section>

                            <section class="raffle-admin-panel" data-raffle-view-panel="exclusions" hidden>
                                <form class="governance-menu-card raffle-form" id="raffle-exclusions-form">
                                    <h2 class="governance-card-title">Excluded Stake Keys</h2>
                                    <p class="governance-card-detail">Add Cardano Mainnet stake addresses here. You can later disable an exclusion so the saved stake key participates in future raffles again.</p>
                                    <label for="raffle-excluded-stake-keys">Stake addresses</label>
                                    <textarea id="raffle-excluded-stake-keys" name="stake_addresses" rows="5" spellcheck="false" autocomplete="off" placeholder="stake1..."></textarea>
                                    <p class="governance-card-detail"><span>Format: enter one complete Mainnet stake address per line. Example:</span><br><code>stake1uxg7k2rzm28glx8decjmulsxrwwaxrn2t45mcvu5fyfscuc6z2mjz</code><br><code>stake1u...another complete stake address</code><br><span>Comma-separated addresses are also accepted.</span></p>
                                    <p class="governance-card-detail" id="raffle-exclusions-count">0 stake keys excluded</p>
                                    <div class="raffle-exclusion-list" id="raffle-exclusion-list"></div>
                                    <button class="governance-vote-secondary" type="submit">Add Exclusions</button>
                                    <p class="raffle-inline-status" id="raffle-exclusions-status" role="status" aria-live="polite"></p>
                                </form>
                            </section>

                            <section class="raffle-admin-panel" data-raffle-view-panel="history" hidden>
                                <div class="raffle-draws" id="raffle-draws"></div>
                            </section>

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

                            <section class="raffle-admin-panel" data-raffle-view-panel="lost_stake" hidden>
                                <div class="governance-menu-card raffle-form">
                                    <p class="governance-card-detail" id="raffle-lost-stake-summary">Stake keys with more than 200 ADA connected to retired pools.</p>
                                    <div class="raffle-exclusion-actions">
                                        <label class="raffle-lost-stake-sort-label" for="raffle-lost-stake-sort">Sort by</label>
                                        <select class="governance-vote-secondary raffle-lost-stake-sort" id="raffle-lost-stake-sort" name="lost_stake_sort">
                                            <option value="ada_desc">ADA high to low</option>
                                            <option value="ada_handle">ADA Handle</option>
                                            <option value="payment_address">Payment address</option>
                                            <option value="stake_key">Stake key</option>
                                        </select>
                                        <button class="governance-vote-secondary" id="raffle-lost-stake-select-all" type="button">Select all</button>
                                        <button class="governance-vote-secondary" id="raffle-lost-stake-clear" type="button">Clear selection</button>
                                        <label class="raffle-lost-stake-toggle">
                                            <input id="raffle-lost-stake-hide-messaged" name="hide_messaged" type="checkbox">
                                            <span>Hide messaged</span>
                                        </label>
                                    </div>
                                    <div class="raffle-exclusion-list" id="raffle-lost-stake-list"></div>
                                </div>
                                <form class="governance-menu-card raffle-form" id="raffle-lost-stake-message-form">
                                    <h2 class="governance-card-title">On-chain message</h2>
                                    <p class="governance-card-detail">Write a message for the selected stake keys. Ask AI can spell-check it and make it more appealing before you publish it on-chain.</p>
                                    <label for="raffle-lost-stake-message">Message</label>
                                    <textarea id="raffle-lost-stake-message" name="message" maxlength="5000" rows="7" placeholder="Hi, your ADA still appears connected to a retired stake pool. Please review your delegation and consider moving it to an active pool."></textarea>
                                    <label for="raffle-lost-stake-improved-message">AI improved message</label>
                                    <textarea id="raffle-lost-stake-improved-message" name="improved_message" maxlength="5000" rows="7"></textarea>
                                    <label for="raffle-lost-stake-manual-addresses">Manual wallet address</label>
                                    <textarea id="raffle-lost-stake-manual-addresses" name="manual_addresses" rows="3" placeholder="addr1..."></textarea>
                                    <p class="governance-card-detail">Optional: add one or more wallet addresses separated by commas or new lines.</p>
                                    <div class="raffle-exclusion-actions">
                                        <button class="governance-vote-secondary" id="raffle-lost-stake-improve" type="button">Ask AI to improve</button>
                                        <button class="governance-vote-button" type="submit">Publish message on-chain</button>
                                    </div>
                                    <p class="raffle-inline-status" id="raffle-lost-stake-status" role="status" aria-live="polite"></p>
                                    <div class="wallet-list raffle-wallet-list" id="raffle-lost-stake-wallet-list"></div>
                                </form>
                            </section>
                        </div>
                    </section>
                </div>
            </div>
        `);
    }

    window.TDSPDelegatorDashboardTemplates = Object.freeze({
        createDelegatorsDashboardBody,
        createAdminDashboardBody
    });
}());
