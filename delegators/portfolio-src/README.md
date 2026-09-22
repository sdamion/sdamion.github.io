# Member portfolio

The members and admin dashboards load this React widget only after wallet authentication. Its first wallet comes from the authenticated `/api/portfolio/session` response, never a URL parameter or a fixed personal address. Stake wallets expand to all associated payment addresses, including empty/spent addresses. Extra wallets and IndexedDB snapshots are scoped to the verified member and wallet set.

The widget mounts inside the existing universal dashboard overlay and uses the website's shared stylesheet, tiles, tables and buttons. It has no Shadow DOM or separate stylesheet. The site's CSP, signing flow and wallet permissions are unchanged. Closing or locking the dashboard unmounts it and aborts pending requests.

## Build

Separate mint payments also link automatically when the single-asset mint receipt consumes every external output of exactly one tracked ADA-only payment. The matcher requires exact transaction hash and output index references, no owned inputs in the receipt, and the entire minted quantity returning to the portfolio. Returned ADA is subtracted. Ambiguous batches, duplicate payment use, unrelated transfers, and missing references remain unlinked. A refresh upgrades older cached receipts and outgoing payments once; confirmed manual allocations take precedence.

Transaction discovery and analysis run concurrently through `pipeline.ts`: one history-page worker queues deduplicated hashes and one detail worker analyses batches of up to 50. Counting reports unique transactions while analysis reports completed work; the final count, percentage and remaining-time estimate appear after discovery finishes. Detail batches are cached incrementally. Failure or cancellation stops both workers before the refresh finishes. Test this lifecycle with `node --experimental-strip-types pipeline.test.ts`.

Run `npm install` and `npm run build` in this directory. Commit the generated `../portfolio/app.js` with source changes. An existing compatible dependency installation may be passed to `node build.mjs /absolute/path/to/dependency-project`.

## Backend and rollout

Requires the `member-portfolio` endpoints in the existing **koios-proxy** repository. Deploy that backend update before publishing the website changes. Session tokens go only to TDSP's backend, not to Koios or pricing providers. The backend validates the session, allowlists read-only upstream operations, caps batch sizes and rate-limits requests.

Koios calls use the proxy's existing authenticated scheduler and provider cooldowns. If the set of linked payment addresses changes, cached transaction calculations are rebuilt against the new set before final cost calculations are shown.

For local testing, the normal `dev-server.mjs` forwards `/api/portfolio/*` to `TDSP_API_ORIGIN`. Set `PORTFOLIO_API_ORIGIN` to a locally running updated backend when the public backend has not yet been updated. Existing members sessions must be valid for the selected backend.

Portfolio prices use Coin Metrics daily ADA closes, Coinbase for recent gaps and Minswap current prices. P/L during history sync is explicitly provisional; full history is reconciled to UTxO balances before remaining-cost results become final. Unclaimed rewards and assets held by untracked scripts are excluded.

Mint receipts retain Koios `assets_minted` in cached transaction facts. Older receipts and outgoing payments are upgraded once on refresh without resetting the known transaction count. `mint-payments.ts` infers a purchase cost for a single received minted asset with fully owned inputs and a net ADA spend matching external outputs. Fees and own change are excluded. Ambiguous bundles and separate payments require a confirmed allocation under the asset's **Mint / purchase payment** control. Separate payments must be ADA-only outgoing transactions in the loaded history; allocations cannot exceed the payment or duplicate a receipt. Links are saved per member and wallet combination in this browser. FIFO acquisition costs use the payment day's USD price, never a current quote substituted for a missing historical price. Mint and confirmed payment costs are not reused as current-price estimates; gain/loss remains unknown without an independent valuation. Ordinary historical trade estimates remain supported. Test with `node --experimental-strip-types mint-payments.test.ts`.

While syncing, CEX sales without a reconciled running balance can use the weighted average of priced, loaded receipts preceding the sale. This provisional benchmark excludes sales with no earlier priced receipts and is not a verified realised result. Completion restores the strict chronological calculation. A fresh ADA quote can fill today's missing candle only, never an older transaction date.
