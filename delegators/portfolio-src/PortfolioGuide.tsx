import {AssetOverlay} from './AssetOverlay';

export function PortfolioGuide({onClose}:{onClose:()=>void}){
  return <AssetOverlay id="portfolio-guide-overlay" name="Portfolio guide" onClose={onClose}>
    <div className="governance-markdown">
      <h2>Getting started</h2>
      <p>Your verified member stake address is included automatically. Portfolio finds its linked payment addresses, loads balances and analyses transactions. Open Cardano Wallets to add other wallets you own or manage exchange and Swap labels.</p>
      <h2>My Wallets and refresh exclusions</h2>
      <p>Cardano Wallets counts only active, fully analysed addresses with at least 10 transactions. My Wallets counts wallets containing those addresses. Hidden and excluded addresses do not count on these tiles; their ADA balances, transaction ownership and gain/loss calculations are unchanged.</p>
      <p>Linked addresses with fewer than 10 loaded transactions are hidden by default. Turn off this filter to show them. Once fully analysed, these addresses are also skipped during regular refreshes. Their saved balances, history and ownership are retained, so transactions are not marked unknown. Use Rescan all wallets to check them again; showing hidden addresses alone does not restart scanning.</p>
      <p>Click a wallet name or its linked-address count to see Wallet, Address, ADA and Transactions for each address. Address links open Cardanoscan. Transaction counts reflect the loaded, analysed history.</p>
      <p>Exclude from refresh skips that address's balance and history requests on the next refresh. Its cached balance, transactions and ownership stay in the portfolio. Shared transactions may still update through another active address. You can change the selection during a refresh without interrupting it. A first cached balance is required before exclusion.</p>
      <p>Hide excluded addresses only hides rows; it does not delete data. Turn it off to re-enable an address. Re-enabling checks history missed while paused. The Cardano Wallets tile shows active / total unique tracked payment addresses, not the number of stake accounts or exchange labels.</p>
      <p>Select all checks Exclude from refresh for all addresses in that wallet with a cached balance. Unselect all enables refresh for all its addresses again. Both buttons include hidden addresses and save the selection using your chosen Portfolio storage.</p>
      <h2>Refreshing and progress</h2>
      <p>Use the refresh icon in the header. Portfolio first resolves addresses and loads balances, then counts and analyses transactions together. The Transactions tile shows progress and remote-cache uploads. Values update as analysis arrives and can be incomplete until refresh finishes.</p>
      <p>Existing cached history is reused where possible. New addresses and missing analysis may require a longer scan. Closing a child overlay does not cancel refresh; keeping the website open allows it to continue. Excluded balances remain cached and can become outdated.</p>
      <p>Once a wallet has been fully scanned, refresh reuses its saved address list and checks balances and new transactions without rediscovering its addresses. Newly added wallets are scanned separately. New payment addresses created under an existing stake key are not discovered automatically; add those addresses through My Wallets to track them.</p>
      <p>After complete analysis, linked addresses with no transactions, balance or assets are removed from the saved wallet list and skipped on future refreshes. Excluded or incomplete addresses are kept. This does not change your on-chain stake key. If a removed address later receives funds, add it through My Wallets to track it again.</p>
      <p>Rescan all wallets in Cardano Wallets rediscovers all linked addresses and checks their full history, including previously removed or excluded addresses. Exclusions are ignored for this scan only. Saved transaction details are reused, and empty linked addresses are removed again after complete analysis.</p>
      <p>Transaction loading and analysis are saved before token prices and images refresh. A token metadata failure leaves saved transactions available. The status indicates when transaction analysis has finished and token data is still loading.</p>
      <h2>Balances, values and performance</h2>
      <p>Assets Across Wallets shows the current value of ADA and priced assets, in USD and its current ADA equivalent. Open it for holdings, wallet names and asset details. Unpriced assets are not included in the subtotal.</p>
      <p>Asset details compare current value with purchase cost. Mint and purchase costs are not current prices. NFT floor prices and the 2 ADA fallback are estimates, not guaranteed sale prices. Manual prices and exclusions can be managed in asset details.</p>
      <p>Network fees paid includes attributable fees from loaded transactions; shared-input fees that cannot be assigned reliably are excluded.</p>
      <p>ADA Gains/Loss is ADA OUT plus current Assets Across Wallets minus ADA IN. Wallet ADA and assets use current values, not purchase costs. USD transfers use transfer-day prices; the ADA equivalent of assets uses the current ADA price. Unpriced assets are excluded, so the result can be partial. This is not a tax calculation.</p>
      <h2>DEX / CEX, Byron and Swap</h2>
      <p>DEX / CEX labels identify exchange counterparties in both directions. They are your labels, not verified exchange ownership, and do not add those address balances to your portfolio.</p>
      <p>Review the discovered addresses in Byron DEX / CEX. Deselect addresses that are not exchanges. Shared transactions are counted once; View shows the underlying transactions and addresses.</p>
      <p>Swap identifies internal/service addresses that must be excluded from CEX classification. A Swap label does not establish ownership of the whole service wallet. Amounts are matched to your tracked wallet addresses so unrelated recipients are not counted as yours.</p>
      <h2>Transactions and assets</h2>
      <p>Open Transactions to search by asset name, transaction hash or address. Use the available type and date filters and pagination to inspect history. Cardanoscan links let you verify transactions independently. Asset images open their detail overlay, including available purchase data and manual adjustments.</p>
      <h2>Unknown ownership</h2>
      <p>The Unknown ownership tile lists cached transactions without a known link to your tracked wallet addresses. Missing analysis does not necessarily mean the transaction belongs to someone else.</p>
      <p>Open the tile, select a tracked wallet address and press Assign. Portfolio loads the transaction details and checks that the address appears in its inputs or outputs. Only verified transaction data determines your ownership and amounts; a selection cannot make unrelated funds yours. Add a wallet you own through Cardano Wallets first if its address is not listed.</p>
      <p>Wait until any refresh or verification finishes before assigning. Successful assignments are saved using your selected Portfolio storage and removed from the unknown list. A failed check leaves ownership and amounts unchanged. Use the Cardanoscan link to inspect the transaction.</p>
      <h2>Local and encrypted remote storage</h2>
      <p>Local data is encrypted with AES-256-GCM before saving in this browser. A separate wallet message approval unlocks it; no transaction, fee or cache upload. Use the same wallet app and stake account. There is no recovery without wallet access. Expired data is removed on the next visit after seven days of inactivity.</p>
      <p>Encrypted remote storage also supports compatible mobile wallets. A separate wallet message approval unlocks it; no transaction or ADA fee is created. Data is encrypted in your browser before upload. Use the same stake account and a compatible wallet on another device. There is no admin recovery if you lose access.</p>
      <p>Inactive remote caches are deleted after seven days. Expired local data is removed on the next visit. Switching storage does not delete the other copy; review the copy and delete options carefully. Both modes still request public blockchain and price data from the backend. Encryption does not protect unlocked data from malicious browser extensions or website code.</p>
      <h2>Check before signing</h2>
      <p>Always review the wallet request and website domain. Portfolio access and cache unlock use message signatures, not payments. Reject unexpected transaction or transfer requests. Verify estimates against your wallet and on-chain records before relying on them.</p>
    </div>
  </AssetOverlay>;
}
