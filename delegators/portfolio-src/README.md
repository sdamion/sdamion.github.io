# Member portfolio

The members and admin dashboards load this React widget only after wallet authentication. Its first wallet comes from the authenticated `/api/portfolio/session` response, never a URL parameter or a fixed personal address. Stake wallets expand to all associated payment addresses, including empty/spent addresses. Extra wallets and IndexedDB snapshots are scoped to the verified member and wallet set.

The widget mounts in a Shadow DOM inside the existing dashboard overlay. Its CSS is isolated; the site's CSP, signing flow and wallet permissions are unchanged. Closing or locking the dashboard unmounts it and aborts pending requests.

## Build

Run `npm install` and `npm run build` in this directory. Commit the generated `../portfolio/app.js` and `../portfolio/styles.css` with source changes. An existing compatible dependency installation may be passed to `node build.mjs /absolute/path/to/dependency-project`.

## Backend and rollout

Requires the `member-portfolio` endpoints in the existing **koios-proxy** repository. Deploy that backend update before publishing the website changes. Session tokens go only to TDSP's backend, not to Koios or pricing providers. The backend validates the session, allowlists read-only upstream operations, caps batch sizes and rate-limits requests.

Koios calls use the proxy's existing authenticated scheduler and provider cooldowns. If the set of linked payment addresses changes, cached transaction calculations are rebuilt against the new set before final cost calculations are shown.

For local testing, the normal `dev-server.mjs` forwards `/api/portfolio/*` to `TDSP_API_ORIGIN`. Set `PORTFOLIO_API_ORIGIN` to a locally running updated backend when the public backend has not yet been updated. Existing members sessions must be valid for the selected backend.

Portfolio prices use Coin Metrics daily ADA closes, Coinbase for recent gaps and Minswap current prices. P/L during history sync is explicitly provisional; full history is reconciled to UTxO balances before remaining-cost results become final. Unclaimed rewards and assets held by untracked scripts are excluded.
