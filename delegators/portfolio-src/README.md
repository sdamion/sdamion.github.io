# Member portfolio

## Shared CEX Deposit Tracking

All four supported networks expose Actions > Track deposits to this address on
saved CEX/DEX counterparties. This is an explicit opt-in for a personal deposit
address, not for an exchange's shared hot wallet. An OUT label alone does not
enable scanning. No additional owned wallet is required. Stop tracking deposits
hides external receipts and stops their address scans; settings remain member-scoped.

`deposit-tracking.ts` selects watched addresses and projects external receipts;
`DepositTransaction` renders their exact native amounts, shared address links,
sender-paid fees and external-receipt label consistently across chains. BTC/SOL
reuse their existing paginated, cancellable history and cache loaders, as ETH does.
Cardano uses a separate chunked encrypted `tdsp-member-cardano-deposits:` cache,
resolves stake aliases and only publishes complete scans. Automatic Cardano scans
reuse a complete result for ten minutes; Portfolio Refresh forces a new scan.

Shared senders can fund a watched deposit address without being saved themselves.
Transfers already represented by owned-wallet history are deduplicated. Exchange
sweeps/self-transfers and transfers between watched deposit addresses are hidden.
Balances, own-wallet counts, owned assets, paid fees, CEX valuations and P/L still
use owned wallets only. An external deposit has no verified owned-wallet cost
basis and never fabricates fiat proceeds or source ownership.

## Bitcoin CEX Connections

Saved My Wallets and DEX / CEX addresses use the shared address-list, OUT-role
and transaction-address modules. Bitcoin retains a UTXO-specific amount adapter:
`bitcoinTableTransfer` matches both wallet-to-CEX and CEX-to-wallet connections
for table filtering and row labels, including transactions with additional inputs.
Owned destinations, disabled OUT entries and mining/service sources do not become
CEX destinations. Ambiguous two-way connections are not assigned a direction.

As in Cardano's table adapter, mixed sources remain visible but have an unknown
CEX-attributed amount and are excluded from calculations. `bitcoinTransfer` remains
the strict financial classifier; balances, verified CEX totals, P/L and paid-fee
attribution are unchanged. The regular Transactions view retains the original
owned-wallet net, and no blockchain inputs, outputs or fees are rewritten.

## Combined owned assets

Assets > NFTs shows current-owned NFTs and Ordinals across supported chains.
Fungible tokens and native balances appear only in Assets > FTs.
Only explicitly owned wallets are scanned; CEX and Swap addresses are not holdings.
Historical NFTs remains a separate history view.

`use-owned-assets.ts` loads on demand and replaces an address snapshot only after
all its inventory pages succeed. Provider failures retain prior snapshots and are
shown per wallet; missing address scans are labelled partial. A ten-minute cache
avoids repeating provider calls; Refresh owned assets bypasses it. Member vault
settings use chunked `tdsp-member-owned-assets:` records with strict validation.
IDs include the chain, contract/mint and NFT instance; fungible balances are summed
with exact integer arithmetic across unique owned addresses. Names and amounts
remain literal across language changes.

Ethereum discovery uses the existing Blockscout queue/budget and requires
BLOCKSCOUT_API_KEY. Solana DAS uses HELIUS_API_KEY, ten credits per page and a
conservative two-per-second pace. Bitcoin token protocols share ORDISCAN_API_KEY
and its budget. Current Ordinals can load independently of BTC transaction history;
owned-only snapshots never claim that historical inscription activity is complete.
Unknown Rune divisibility is labelled raw units, never guessed. Unpriced token
inventory does not alter portfolio fiat values, trade basis, native balances or P/L.

The inventory covers assets indexed by those providers on the four supported
mainnets. Untracked wallets, staking/DeFi positions, bridges, other EVM networks
and other Bitcoin token protocols are not implicitly scanned. Provider indexing
may lag; this is not a promise that every possible asset protocol is covered.

## Bitcoin Ordinals

Historical NFTs merges Cardano NFTs with Ordinals discovered for owned BTC
addresses. `use-ordinals.ts` loads only when that gallery is opened. It reuses a
complete per-address scan for 24 hours while its BTC checkpoint is unchanged;
manual Refresh Bitcoin Ordinals bypasses that cache. Visible historical records
load missing metadata in batches of at most six. Provider failures keep saved
history, and page-limit exhaustion is reported rather than marked complete.

`ordinals.ts` matches confirmed activity and owner outputs against saved BTC
transactions. Creation time is not treated as a purchase/receipt time; stale
Ordinals checkpoints do not assert current ownership. Sent inscriptions remain
visible. Collections and IDs use a Bitcoin namespace so they cannot collide
with Cardano assets. Ordinal artwork has no estimated buy/sell price or NFT
valuation and never changes native BTC balances or financial totals.

`OrdinalNftTile` previews PNG/JPEG/GIF/WebP/AVIF through fixed Ordiscan content
URLs. Recursive HTML artwork uses a cross-origin iframe with only `allow-scripts`:
no same-origin access, parent navigation, popups, forms or device permissions.
Relative inscription dependencies resolve on Ordiscan, never on this site.
Tile frames are lazy-loaded and cannot intercept clicks or keyboard focus.
Unsupported types retain an external no-opener Ordiscan link. Metadata cannot
choose arbitrary frame URLs, and the parent CSP permits only Ordiscan's content path.
History and metadata use chunked, member-scoped encrypted vault settings.

Deploy the matching backend with ORDISCAN_API_KEY configured. The key stays on
the backend; the existing Bitcoin admin-only access policy remains in force.
See koios-proxy/member-portfolio/README-ordinals.md for provider budget settings.

## Shared Address List

The shared DEX / CEX add form includes an explicit OUT address checkbox for all
four networks. A standalone OUT counterparty needs no owned wallet to be saved;
it stays in the CEX list, outside owned balances and automatic holdings scans.
The saved OUT flag can also be changed in that list. Swap and My Wallets forms
do not expose or inherit this counterparty setting. Classifying transfers still
requires tracked own-wallet history; adding an OUT address alone does not scan
an exchange's full transaction history or assert ownership of its funds.

`AddressList` renders one cross-network saved-address table per ownership scope:
My Wallets and DEX / CEX & Swap. Network, name/exchange, address, mining/service
source and actions share the same implementation. `AddressLink` keeps explorer
links clickable and copies the complete case-preserved address, including learned
Swap addresses. `AddressActions` uses an unclipped, viewport-clamped menu with
keyboard navigation. Rename and remove delegate to existing storage callbacks;
metadata and ownership remain unchanged. Primary stake removal stays disabled.
View opens the existing Cardano linked-address and refresh-exclusion overlay.
Own-wallet and Swap rows do not expose counterparty source switches. Bitcoin
source switches now classify attributed income as mining/service receipts, not
CEX buys or sales, using the same separate native-summary convention as SOL.

## Bitcoin

Admins can select Bitcoin in the shared owned-wallet and CEX address forms.
`bitcoin.ts` validates mainnet Base58Check, Bech32 and Bech32m addresses. BTC
history uses the authenticated backend `/bitcoin` endpoint and Blockstream
Esplora; no wallet sessions are forwarded to that provider. Only explicitly
owned addresses are queried. Add all receiving and change addresses; xpubs,
Lightning, mempool transactions and automatic cross-chain swap pairing are not
included. CEX IN/OUT uses owned-wallet direction, exact counterparties and
conservative input attribution. Fees from mixed inputs remain unknown.

`use-bitcoin.ts` anchors all accounts at one confirmed block, reconciles complete
address histories with provider statistics, and reuses history only while its
saved anchor remains on the best chain. Reorgs trigger a complete address scan.
Failed or inconsistent scans retain the previous complete cache. BTC settings
and chunked transaction history use the member-scoped encrypted vault, including
its existing inactivity retention. BTC balances, fees and native CEX summaries
join the existing fiat totals without summing unrelated coin quantities.

Deploy the corresponding koios-proxy Bitcoin handler before using the frontend.
No provider API key or new package installation is needed.

## Address Forms

`CryptoAddressForm` shares `ServiceAddressForm` across owned wallets and saved
counterparties. Each section has one address input and an access-gated network
selector. The same saved counterparty identifies both IN and OUT; it never
becomes an owned balance. Cardano and Ethereum retain their Swap option, while
Solana supports native SOL counterparties only. `AddressNameField` provides the
shared inline name editor; renaming preserves addresses and source metadata.

## Cross-chain CEX summary

Native Ethereum and Solana wallets default to admin-only. Admins can grant each
chain independently to individual delegators in Portfolio access. The backend
checks current stored grants on every chain/price request; the UI reads session
capabilities on opening and once per minute. Disabling a grant retains encrypted
wallet data but stops the disabled hook. Cardano remains available to delegators.
Token prices and image metadata refresh in deduplicated 50-asset batches with at
most two requests in flight. Results are merged and saved sequentially; transient
failures returning within five seconds get one retry through sequential batches of
at most 25 assets, without
repeating successful peers. Other batches continue if a transient failure remains.
Timeouts, slow failures, authentication, quota and invalid-response errors stop
further requests instead of multiplying long waits. Cached
images remain reusable through the existing backend image cache.

Wallet history has no local total
request, transaction-count or history-page cutoff. Provider
quotas, request pacing, response validation and encrypted-cache byte-size limits
still apply. Repeated or empty provider pages claiming more data fail closed.
Completed Ethereum block windows are saved as encrypted, partitioned scan settings
in `ethereum-scan-storage.ts`, separate from completed accounts and financial totals.
Restarted scans reuse these windows per wallet, kind and provider. Completed accounts
record `finalizedBlock`; later scans start immediately after that saved boundary, not
a fixed 64-block overlap. The backend queries the public Ethereum mainnet RPC for
`eth_getBlockByNumber("finalized", false)` and shares its result for 30 seconds.
No wallet data is sent to that RPC. Missing finality keeps the last verified boundary
and updates only its unfinalized tail; legacy accounts use the conservative 64-block
overlap without recording new finality. Invalid or regressing finality stops the scan
without replacing saved data. Legacy accounts validate their former overlap once
before recording finality. Accepted prefixes of rejected windows reuse all finalized data while their last
block is fetched again. Scan settings are retired only after account history is saved.
`download-progress.ts` provides the shared ADA/ETH/SOL transaction progress helper.
It restores unique receipt identities before network requests, merges overlapping pages,
and replaces stale identities with the final validated history on completion. ETH scan
settings and SOL pending receipts contribute to visible progress, not financial totals.
The Transactions tile uses the same combined counts; unknown discovery totals stay
indeterminate instead of showing a misleading 100%. Per-chain labels retain the
saved receipt count as their visible baseline while checking for additional history.
Ethereum Swap addresses are counterparties, not owned accounts: only regular wallets
are scanned and contribute balances/fees, while their transactions retain Swap labels
and cross-chain pairing. Saved shared-address histories are excluded from totals.

`compact-storage.ts` provides shared lossless dictionary encoding for encrypted
ADA, ETH and SOL storage. Cardano time buckets and native-chain account history
are split into blocks of at most 10,000 records. Existing checkpoint formats remain
readable; upload retries compact already fetched native histories without API calls.
Hash deduplication is block-local, and distinct Ethereum traces remain distinct.

`NativeTransferSummary` shows ADA, ETH and SOL quantities separately. ADA IN/OUT
filters never include ETH or SOL legs. `portfolioTransferResult` combines all
classified CEX flows using transfer-day prices and adds the current value of all
included holdings. Coin quantities are never added across chains. Duplicate flows,
paired internal swaps and mining/service receipts are excluded from CEX flows.
Missing historical prices leave the full comparison unknown rather than zero.
The gain/loss result is OUT plus current holdings minus IN in the display
currency; the selected crypto amount converts that result at its current quote.
The graph remains a transfer-day crypto comparison. Mining/services contribute
through retained holdings or subsequent OUT payments, never a second historical
income addition. ADA IN/OUT remains native ADA regardless of the result unit.

## Mining / Services Sources

Counterparty lists share `RewardSourceCheckbox` and `reward-sources.ts` across
Cardano, Ethereum and native Solana. The existing boolean `miner` setting is kept
for cache compatibility. Marked receipts are reported separately from CEX flows;
own-wallet transfers are excluded. ADA, Cardano-token and ETH receipt basis uses
zero acquisition cost. SOL does not yet have a purchase-basis calculation.
SPL and ERC-20 tracking are not added by this setting.

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

Local storage uses member-scoped IndexedDB and AES-256-GCM encryption before saving.
It requires the private Portfolio wallet approval but does not upload a Portfolio cache.
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
checkpoint. Failed saves retry without stopping transaction analysis. Remote checkpoint
messages and upload progress are hidden in the Portfolio UI. Old whole-envelope caches are readable
and migrate on their next save. Deploy the checkpoint-capable backend before this frontend.
Replaced chunks are retained briefly for concurrent readers and cleaned on later writes or hourly pruning;
expiry/deletion removes the entire member cache, including retained chunks.

The 365-day retention clock starts/resets on an authenticated vault unlock/read or an
explicit activity request from trusted user interaction in Portfolio (at most hourly), NOT
background refresh writes. Expired vaults are inaccessible immediately and pruned on startup
and hourly. Exclude `data/portfolio-private` from backups, snapshots and request-body logging;
the application cannot erase external backup copies. Backend cache reads are not proof that
decryption succeeded. They establish authenticated activity only.

Wallet signature reproducibility must be tested with each supported wallet. Switching wallet
implementations may change signed COSE headers and therefore the derived wrapping key.
An older cache must first be unlocked with the original app. In Portfolio storage > Wallet apps,
Link another wallet app selects a compatible installed app for the same stake account and
verifies its private unlock signature locally. The first link migrates to a random AES-256-GCM
data key, re-encrypting every checkpoint chunk; wrapped copies preserve both apps' access.
Later links reuse the data key and encrypted chunks. Wrapped keys use random slot IDs/nonces
and stake/slot-bound authenticated encryption. All imported keys remain nonextractable;
temporary raw data-key buffers are zeroed. Only opaque encrypted wrappers reach the backend,
not signatures, unwrapped keys, app names or plaintext. Each cache location is linked separately.
At most 16 different wallet approvals can be linked. Compatible apps reproducing an existing
approval already work and do not create a duplicate slot. There is no unlink/revocation UI;
true revocation would require rotating the data key and re-encrypting every chunk.
The capability-advertising backend must be deployed first. Revision checks and atomic publication
preserve existing caches on conflicts. Unconfirmed uploads retain the pending checkpoint for
idempotent retry; only an acknowledged save updates the displayed linked-approval count.
Logout or a changed unlock generation cancels pending linking. Local IndexedDB aborts reject
instead of leaving migrations pending. If decryption fails, no cache is overwritten; use an
already linked app/account, or the original signing app for an unmigrated cache. No wallet/key recovery
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

Transaction discovery and analysis run concurrently through `pipeline.ts`: one history-page worker queues deduplicated hashes and one detail worker analyses batches of up to 25. Detail requests split on provider timeouts or oversized responses and retain the reduced batch size for subsequent requests. Growing snapshot copies and cache scheduling are limited to once per second, with a forced publication on completion or failure. Counting reports unique transactions while analysis reports completed work; the final count, percentage and remaining-time estimate appear after discovery finishes. Detail batches are cached incrementally. Failure or cancellation stops both workers before the refresh finishes. Test this lifecycle with `node --experimental-strip-types pipeline.test.ts`.

Run `npm install` and `npm run build` in this directory. Commit the generated `../portfolio/app.js` with source changes. An existing compatible dependency installation may be passed to `node build.mjs /absolute/path/to/dependency-project`.

## Backend and rollout

Swap also accepts mainnet stake addresses. Refresh batches them with existing `account_addresses` requests (`_first_only: false`, `_empty: true`) and validates complete results. Linked addresses are cached in `snapshot.swapGroups`, separate from owned `groups`, and excluded from CEX and Combined Byron selections. They never enter balance/history scans solely because of a Swap label. The overlay reports the linked exclusion count; removing the stake label removes its derived exclusions.

Cardano Wallets includes a **Swap** group for mainnet payment and Byron addresses. It uses the shared tile and overlay, existing member wallet settings, and the selected local/encrypted remote cache. Swap labels are excluded from exchange assignments and Combined Byron CEX discovery, but do not establish ownership. Ownership is matched automatically against the tracked wallet addresses resolved from the member/added stake keys and explicitly tracked payment wallets. Only their inputs/outputs affect portfolio amounts; shared service balances and unrelated transactions are not included. There is no ownership checkbox. Legacy ownership flags are discarded, and a versioned cache scope forces reclassification of previously overcounted transactions without changing saved manual prices/payment links. Adding a Swap address removes its saved exchange assignment; removing it does not automatically restore that assignment. Ownership changes reuse the existing incremental refresh/reclassification path. Regression tests: `swap-wallets.test.ts` and `tests/portfolio-swap-browser.mjs`.

Requires the `member-portfolio` endpoints in the existing **koios-proxy** repository. Deploy that backend update before publishing the website changes. Session tokens go only to TDSP's backend, not to Koios or pricing providers. The backend validates the session, allowlists read-only upstream operations, caps batch sizes and rate-limits requests.

Koios calls use the proxy's existing authenticated scheduler and provider cooldowns. Complete cached transactions are not periodically downloaded or analysed again, including the newest 20. Existing addresses check recent history and stop on saved history; newly linked addresses scan their own full history. Balances, linked addresses and market prices still refresh. Missing or outdated analysis is filled independently of history discovery.

Wallet changes reuse the same authenticated member's latest snapshot, without displaying old wallet totals as current. Unaffected facts remain intact. New analysis saves the minimal source inputs/outputs needed to reclassify transfers locally when ownership changes. Older caches without these details fetch only affected transactions once; source data is not backfilled for unaffected transactions. Removed-wallet-only records are discarded. Pending ownership scans are checkpointed so interrupted refreshes cannot silently reuse an incorrectly classified transfer. This applies to local and encrypted remote storage alike.

For local testing, the normal `dev-server.mjs` forwards `/api/portfolio/*` to `TDSP_API_ORIGIN`. Set `PORTFOLIO_API_ORIGIN` to a locally running updated backend when the public backend has not yet been updated. Existing members sessions must be valid for the selected backend.

Portfolio purchase costs use Coin Metrics daily ADA closes and Coinbase for recent gaps. Current values use manual USD overrides, Minswap quotes or Wayup NFT collection floors (cached in the backend for 15 minutes). Floors are listing estimates, not executable sale guarantees. With no usable quote, the user-defined fallback is 2 ADA total per asset row, converted at the current ADA/USD quote; it does not multiply by an unknown token quantity. Wayup only receives collection policy IDs, never member credentials or wallet addresses. P/L during history sync is explicitly provisional; full history is reconciled to UTxO balances before remaining-cost results become final. Unclaimed rewards and assets held by untracked scripts are excluded.

Refresh does not switch valuation algorithms: ADA always uses proportional remaining cost, and token FIFO runs after every batch. ADA history must reconcile to the current balance; token quantities must match holdings and cannot have an earlier unfunded disposal. Unreconciled or unpriced cost stays unknown, not projected from a receipt average. Cached market quotes survive refresh initialization. Identical facts, balances and prices produce identical amounts before and after completion; new data can still change the result. Regression coverage: `refresh-valuation.test.ts`.

Mint receipts retain Koios `assets_minted` in cached transaction facts. Older receipts and outgoing payments are upgraded once on refresh without resetting the known transaction count. `mint-payments.ts` infers a purchase cost for a single received minted asset with fully owned inputs and a net ADA spend matching external outputs. Fees and own change are excluded. Ambiguous bundles and separate payments require a confirmed allocation under the asset's **Mint / purchase payment** control. Separate payments must be ADA-only outgoing transactions in the loaded history; allocations cannot exceed the payment or duplicate a receipt. Links are saved per member and wallet combination in this browser. FIFO acquisition costs use the payment day's USD price, never a current quote substituted for a missing historical price. Mint and confirmed payment costs are not reused as current-price estimates; gain/loss remains unknown without an independent valuation. Historical buy and mint prices are used only for purchase cost, never for current value. Test with `node --experimental-strip-types mint-payments.test.ts`.

While syncing, CEX sales without a reconciled running balance can use the weighted average of priced, loaded receipts preceding the sale. This provisional benchmark excludes sales with no earlier priced receipts and is not a verified realised result. Completion restores the strict chronological calculation. A fresh ADA quote can fill today's missing candle only, never an older transaction date.
### Portfolio Translations

Portfolio uses the site's existing language loader and `locales/nl.toml`, `locales/ja.toml` and `locales/es.toml`. The shared message-to-key catalog is `shared/portfolio-i18n-keys.js`; named template parameters must match in every locale. Add new UI messages to that catalog and all three locale files. `shared/portfolio-i18n.js` translates individual text nodes and accessibility/table-label attributes without replacing React-owned elements or editing input values. Wallet names, asset names and monetary output are protected with `translate="no"`. Protected status text uses `usePortfolioText`; charts redraw on language changes.

Run `node --test tests/portfolio-language-catalog.test.mjs tests/portfolio-metric-i18n.test.mjs` from the repository root. The browser regression `tests/portfolio-language-coverage-browser.mjs` accepts the local Playwright module path and checks language switching during React progress updates, manual prices, selections and names. No wallet data or live API is required.

### Wallet Address Refresh Controls

My Wallets opens the shared overlay from the wallet name or linked-address count. Each linked address has a compact Wallet / Address / ADA / Transactions row and an Exclude from refresh checkbox. Exclusions are saved in the existing wallet settings through the selected local or encrypted remote vault. They skip address balance/history requests on subsequent refreshes, but retain ownership, cached balances and cached transactions. Shared transactions discovered through another active address can still update. Controls remain usable during refresh and apply to the next run. An address needs its first cached balance before exclusion; re-enabling is always allowed. Re-enabling scans skipped history and preserves that pending scan across interrupted refreshes.
# Admin Native Chains

ETH and native SOL require admin access or the existing per-member chain grant.
The authenticated backend also enforces those grants on inventory endpoints.
Solana uses Helius Free mainnet RPC through the backend HELIUS_API_KEY;
credentials never enter the frontend. Configure the backend container key
before using it. Native SOL CEX transfers use daily prices and join the
existing fiat/equivalent totals and chart; native coin quantities are never
added together. Fees appear on a separate SOL line. SPL tokens/NFTs appear in
the combined NFT inventory, but SOL token cost-basis estimates are not included.
Missing SOL purchase cost is unknown,
not zero. SOL settings and transactions use the existing member vault.
Interrupted SOL scans retain validated receipt batches in the same vault and
reuse them on the next refresh. Pending receipts do not enter balances, fees
or CEX totals until the wallet scan completes. Temporary upstream failures
have at most two retries; missing backend credentials still require configuration.
Native SOL transfers can pair with a saved Cardano Swap leg using the shared
60-minute/5-percent reciprocal-best matcher. SOL candidates require a single
external counterparty and direction; mixed flows, failed receipts, missing
daily prices and ambiguous candidates stay separate. Matched ADA/SOL legs
share one table row and are excluded from CEX totals/charts; fees are retained.

## User-Selected OUT Addresses

Live address management uses one CryptoAddressForm and AddressList across
ADA/ETH/SOL/BTC, also in the setup guide. address-networks.ts defines shared
network labels, display units and supported capabilities. native-addresses.ts
owns ETH/SOL/BTC add, row and mutation logic; cardano-addresses.ts adapts stake
groups, protected member wallets and linked-address details to the same row
model. AddressList owns balance display, names, links/copy, actions, OUT and
mining-source controls. App.tsx only connects these adapters to existing stores.
BTC offers the same DEX/CEX selector and retains DEX metadata on save/reopen.
Cardano retains explicit DEX/CEX metadata too; unlabeled legacy entries keep
their old combined label. These are user labels, not on-chain DEX decoding.
Permissions, storage keys, ownership boundaries, validation and existing
ETH/SOL capacity limits remain unchanged. BTC does not gain an artificial
address cap or unsupported Swap capabilities. Personal deposit tracking is
supported on all four networks through the shared opt-in control.

Counterparty action menus contain one Address type dropdown with DEX, CEX,
Mining and Service through address-types.ts. Mining and Service both use the existing
mining/service-receipt treatment but retain their distinct sourceType metadata
(`min` and `svc`) through all four settings normalizers. Legacy miner flags still behave as
before. Type changes retain names and exact addresses; owned and Swap entries
cannot be converted through this menu. Source selection disables OUT; choosing
DEX/CEX again does not automatically enable it. Source selection also stops
incompatible opt-in deposit scanning, without deleting its cached data.
Existing mining and OUT controls keep the selected type synchronized.

Transaction search accepts full or partial wallet addresses as well as names,
assets and transaction hashes. Cardano searches recorded owned addresses,
source payment/stake addresses and legacy external counterparties. Hidden or
collapsed address groups remain searchable; unrelated saved wallets do not
match transactions they never touched. ETH/SOL/BTC search their recorded
transaction addresses too. Both Transactions and CEX Transactions use this
search, retaining their date/type filters without editing blockchain data.

The shared counterparty address list exposes an OUT checkbox for ADA, ETH, SOL
and BTC. The persisted boolean is classification metadata, independent of the
address's name or exchange brand. Previously saved counterparties retain their
existing role until the user changes it. Disabled OUT addresses remain saved
and searchable but are excluded from CEX boundary transfer calculations.
Mining/service sources remain distinct from OUT destinations. Changing either
role never edits provider transaction amounts, addresses, dates, fees, hashes or
balances. Existing EUR/USD valuations remain market-price estimates, never proof
of a fiat conversion. There are no new manual fiat-value or cost-basis fields.

Bitcoin transaction rows show only wallet-paid fees in BTC and sats, not fees
paid by external senders. Mixed-input fee shares remain unknown. The paid-fee
tile includes only fees whose inputs all belong to tracked wallets. It retains
that known subtotal when another wallet is missing or mixed-input fees cannot
be attributed, marks it as partial, and never treats unknown fee shares as paid
zeros. No fee is apportioned speculatively or written back into chain data.

TransactionAddresses is the shared ADA/ETH/SOL/BTC From/To renderer, using
AddressLink for explorer links and clipboard controls. Named wallets show only
their literal name; unnamed addresses stay shortened. The copy icon always
copies the full original address, also available in the link tooltip. Rows
deduplicate within each direction. Each direction occupies one visible row;
multiple genuine addresses are collapsed behind an expandable address count.
All original explorer links and full-address copy controls remain in those
details. The same grouping applies to every chain, including BTC multi-input
transactions. UTXO incoming flows show external
inputs to owned outputs; outgoing flows show owned inputs to external outputs,
hiding change and co-inputs on the owned side. Self-transfers retain both owned
roles. Multiple genuine counterparties are not reduced to a guessed single
address. SOL includes only transfer edges touching owned wallets. Fee payers
are not added to the address list. Cardano uses cached source inputs/outputs;
legacy facts without source details do not invent address roles. Transaction
fee columns show wallet-paid fees only; unknown shares remain unknown. This
presentation layer does not rewrite transaction or cache data.

Owned-asset responses normalize optional artwork through assetImageUrl before
the strict inventory validator. Provider ipfs.io/dweb.link URLs use the same
canonical gateway as other artwork; unsafe optional images become null rather
than rejecting an otherwise valid wallet inventory. Asset IDs, exact raw
balances, decimals, names, chain and explorer targets are still validated
without financial coercion. Invalid financial/ownership data or incomplete
pages retain the previous complete per-wallet cache. Stored inventory remains
strictly canonical and uses the existing encrypted settings/chunk format.

Personal ETH deposit addresses can additionally opt into history tracking from
their action menu. Their public provider balance and full validated history are
retained unchanged, but their balances do not enter owned-wallet holdings.
Successful external deposits can be viewed without scanning a miningpool's
entire sending wallet. Exchange sweeps are hidden, overlapping transfers are
deduplicated, and own-wallet transfer performance is not increased by unrelated
external deposits. Exact ETH transfer amounts and fees are shown from raw wei.
