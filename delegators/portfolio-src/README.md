# Member portfolio

## Private encrypted cache

Opening Portfolio offers local or remote storage; member sign-in itself does not request
a Portfolio signature. Storage settings use the existing universal overlay and allow
switching and separately confirmed local/remote deletion. Switching normally loads the
destination's own cache. An explicit checkbox copies the current data over the destination;
the source copy remains until the user deletes it. Changing storage stops the current
analysis before switching, then reloads the chosen cache and resumes normal refresh.

Phones and tablets may open Portfolio using encrypted remote storage with a compatible
wallet. The chooser defaults to remote and disables local storage on mobile devices.
Local opening is also guarded in the storage module. Desktop window width is not used.

Local storage uses member-scoped IndexedDB, does not upload a Portfolio cache, and does not
require another wallet approval. It is NOT wallet-encrypted: browser access can expose it.
The browser can remove expired local data only when the site next runs. Local cache settings
are not available across devices. Both modes still use backend public-data API requests.

Choosing remote storage requests a separate CIP-30/CIP-8 stake-key signature for Portfolio.
This is NOT the login challenge. Its signature never goes to the backend or browser storage.
The browser verifies the message, Ed25519 signature and stake-key hash, derives a
nonextractable AES-256-GCM key with HKDF-SHA256, and keeps it in memory until logout/reload.
The backend stores gzip-compressed encrypted chunks and an encrypted index, with a new
random nonce for each changed chunk/index. Wallets, CEX labels, price overrides, payment
links and the latest wallet-set snapshot remain encrypted. Existing local settings/current snapshot migrate after
unlock; legacy plaintext member caches are removed only after the encrypted save succeeds.

Only the authenticated session's resolved stake identity can access its vault. There is
no admin owner override or recovery key. Concurrent devices use revision checks: a stale
save fails instead of overwriting newer data. Writes run every 30 seconds when dirty, after
500 additional analysed transactions, at analysis completion and on closing Portfolio. Keep the page open until the
encrypted-save message; abrupt browser closure can lose unsaved changes.

Transaction history/facts use stable 30-day buckets. Only changed buckets are uploaded;
settings, balances and market data are in the encrypted index. The server publishes the
index atomically after storing all required chunks. Opaque chunk IDs reveal no addresses
or dates, although encrypted sizes and upload timing remain observable. Lost acknowledgements
retry the same commit ID. Only one upload runs at a time; pending changes schedule a trailing
checkpoint. Failed saves retry without stopping transaction analysis. The shared progress
bar measures bytes uploaded, stays below 100% until acknowledgement, and shows the number of
analysed transactions in the last confirmed checkpoint. Old whole-envelope caches are readable
and migrate on their next save. Deploy the checkpoint-capable backend before this frontend.
Replaced chunks are retained briefly for concurrent readers and cleaned on later writes or hourly pruning;
expiry/deletion removes the entire member cache, including retained chunks.

The seven-day retention clock starts/resets on an authenticated vault unlock/read or an
explicit activity request from trusted user interaction in Portfolio (at most hourly), NOT
background refresh writes. Expired vaults are inaccessible immediately and pruned on startup
and hourly. Exclude `data/portfolio-private` from backups, snapshots and request-body logging;
the application cannot erase external backup copies. Backend cache reads are not proof that
decryption succeeded. They establish authenticated activity only.

Wallet signature reproducibility must be tested with each supported wallet. Switching wallet
implementations may change signed COSE headers and therefore the derived key. If decryption
fails, no cache is overwritten; use the original signing wallet/account. No wallet/key recovery
means no recovery of the encrypted cache. Public blockchain data can still be fetched again.
Script/hardware stake accounts that cannot sign this message are not supported by this flow.

This protects stored cache contents, not against malicious website code, browser extensions,
or an administrator observing public transaction API requests while the portfolio is in use.
Never approve the private unlock message on a different website or disclose its signature.

Deploy **koios-proxy first**, then the website. The Dockerfile already copies all files under
`member-portfolio`, including `vault-store.mjs`. Configure Nginx Proxy Manager to permit
`client_max_body_size 32m;` for this API, with TLS. New authenticated GET/POST
`/api/portfolio/vault` stores envelopes in the existing persistent data volume. Other JSON
API routes retain their 8 KB request limit. The local development proxy supports the same route.

The members and admin dashboards load this React widget only after wallet authentication. Its first wallet comes from the authenticated `/api/portfolio/session` response, never a URL parameter or a fixed personal address. Stake wallets expand to all associated payment addresses, including empty/spent addresses. Extra wallets and IndexedDB snapshots are scoped to the verified member and wallet set.

The widget mounts inside the existing universal dashboard overlay and uses the website's shared stylesheet, tiles, tables and buttons. It has no Shadow DOM or separate stylesheet. Closing the view keeps ongoing refresh alive; logout destroys the instance and clears in-memory keys.

## Build

ADA's displayed average buy price is the ADA-weighted historical receipt-date price of all
incoming ADA, including amounts later spent or sold. Duplicate transactions and internal
transfers are excluded. Missing receipt prices make the average unavailable; incomplete
history is labelled partial. This is not an exchange execution price. Remaining cost and
unrealised gain/loss retain their existing proportional-cost calculation independently.

Separate mint payments also link automatically when the single-asset mint receipt consumes every external output of exactly one tracked ADA-only payment. The matcher requires exact transaction hash and output index references, no owned inputs in the receipt, and the entire minted quantity returning to the portfolio. Returned ADA is subtracted. Ambiguous batches, duplicate payment use, unrelated transfers, and missing references remain unlinked. A refresh upgrades older cached receipts and outgoing payments once; confirmed manual allocations take precedence.

Transaction discovery and analysis run concurrently through `pipeline.ts`: one history-page worker queues deduplicated hashes and one detail worker analyses batches of up to 50. Counting reports unique transactions while analysis reports completed work; the final count, percentage and remaining-time estimate appear after discovery finishes. Detail batches are cached incrementally. Failure or cancellation stops both workers before the refresh finishes. Test this lifecycle with `node --experimental-strip-types pipeline.test.ts`.

Run `npm install` and `npm run build` in this directory. Commit the generated `../portfolio/app.js` with source changes. An existing compatible dependency installation may be passed to `node build.mjs /absolute/path/to/dependency-project`.

## Backend and rollout

Cardano Wallets includes a **Swap** group for mainnet payment and Byron addresses. It uses the shared tile and overlay, existing member wallet settings, and the selected local/encrypted remote cache. Swap labels are excluded from exchange assignments and Combined Byron CEX discovery, but do not establish ownership. Ownership is matched automatically against the tracked wallet addresses resolved from the member/added stake keys and explicitly tracked payment wallets. Only their inputs/outputs affect portfolio amounts; shared service balances and unrelated transactions are not included. There is no ownership checkbox. Legacy ownership flags are discarded, and a versioned cache scope forces reclassification of previously overcounted transactions without changing saved manual prices/payment links. Adding a Swap address removes its saved exchange assignment; removing it does not automatically restore that assignment. Ownership changes reuse the existing incremental refresh/reclassification path. Regression tests: `swap-wallets.test.ts` and `tests/portfolio-swap-browser.mjs`.

Requires the `member-portfolio` endpoints in the existing **koios-proxy** repository. Deploy that backend update before publishing the website changes. Session tokens go only to TDSP's backend, not to Koios or pricing providers. The backend validates the session, allowlists read-only upstream operations, caps batch sizes and rate-limits requests.

Koios calls use the proxy's existing authenticated scheduler and provider cooldowns. Complete cached transactions are not periodically downloaded or analysed again, including the newest 20. Existing addresses check recent history and stop on saved history; newly linked addresses scan their own full history. Balances, linked addresses and market prices still refresh. Missing or outdated analysis is filled independently of history discovery.

Wallet changes reuse the same authenticated member's latest snapshot, without displaying old wallet totals as current. Unaffected facts remain intact. New analysis saves the minimal source inputs/outputs needed to reclassify transfers locally when ownership changes. Older caches without these details fetch only affected transactions once; source data is not backfilled for unaffected transactions. Removed-wallet-only records are discarded. Pending ownership scans are checkpointed so interrupted refreshes cannot silently reuse an incorrectly classified transfer. This applies to local and encrypted remote storage alike.

For local testing, the normal `dev-server.mjs` forwards `/api/portfolio/*` to `TDSP_API_ORIGIN`. Set `PORTFOLIO_API_ORIGIN` to a locally running updated backend when the public backend has not yet been updated. Existing members sessions must be valid for the selected backend.

Portfolio purchase costs use Coin Metrics daily ADA closes and Coinbase for recent gaps. Current values use manual USD overrides, Minswap quotes or Wayup NFT collection floors (cached in the backend for 15 minutes). Floors are listing estimates, not executable sale guarantees. With no usable quote, the user-defined fallback is 2 ADA total per asset row, converted at the current ADA/USD quote; it does not multiply by an unknown token quantity. Wayup only receives collection policy IDs, never member credentials or wallet addresses. P/L during history sync is explicitly provisional; full history is reconciled to UTxO balances before remaining-cost results become final. Unclaimed rewards and assets held by untracked scripts are excluded.

Refresh does not switch valuation algorithms: ADA always uses proportional remaining cost, and token FIFO runs after every batch. ADA history must reconcile to the current balance; token quantities must match holdings and cannot have an earlier unfunded disposal. Unreconciled or unpriced cost stays unknown, not projected from a receipt average. Cached market quotes survive refresh initialization. Identical facts, balances and prices produce identical amounts before and after completion; new data can still change the result. Regression coverage: `refresh-valuation.test.ts`.

Mint receipts retain Koios `assets_minted` in cached transaction facts. Older receipts and outgoing payments are upgraded once on refresh without resetting the known transaction count. `mint-payments.ts` infers a purchase cost for a single received minted asset with fully owned inputs and a net ADA spend matching external outputs. Fees and own change are excluded. Ambiguous bundles and separate payments require a confirmed allocation under the asset's **Mint / purchase payment** control. Separate payments must be ADA-only outgoing transactions in the loaded history; allocations cannot exceed the payment or duplicate a receipt. Links are saved per member and wallet combination in this browser. FIFO acquisition costs use the payment day's USD price, never a current quote substituted for a missing historical price. Mint and confirmed payment costs are not reused as current-price estimates; gain/loss remains unknown without an independent valuation. Historical buy and mint prices are used only for purchase cost, never for current value. Test with `node --experimental-strip-types mint-payments.test.ts`.

While syncing, CEX sales without a reconciled running balance can use the weighted average of priced, loaded receipts preceding the sale. This provisional benchmark excludes sales with no earlier priced receipts and is not a verified realised result. Completion restores the strict chronological calculation. A fresh ADA quote can fill today's missing candle only, never an older transaction date.
