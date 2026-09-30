import {AssetOverlay} from './AssetOverlay';

export function PortfolioGuide({onClose}:{onClose:()=>void}){
  return <AssetOverlay id="portfolio-guide-overlay" name="Portfolio guide" onClose={onClose}>
    <div className="governance-markdown">
      <h2>Getting started</h2>
      <p>Your verified member stake address is included automatically. Portfolio finds its linked payment addresses, loads balances and analyses transactions. Open Cardano Wallets to add other wallets you own or manage exchange and Swap labels.</p>
      <h2>My Wallets and refresh exclusions</h2>
      <p>Click a wallet name or its linked-address count to see Wallet, Address, ADA and Transactions for each address. Address links open Cardanoscan. Transaction counts reflect the loaded, analysed history.</p>
      <p>Exclude from refresh skips that address's balance and history requests on the next refresh. Its cached balance, transactions and ownership stay in the portfolio. Shared transactions may still update through another active address. You can change the selection during a refresh without interrupting it. A first cached balance is required before exclusion.</p>
      <p>Hide excluded addresses only hides rows; it does not delete data. Turn it off to re-enable an address. Re-enabling checks history missed while paused. The Cardano Wallets tile shows active / total unique tracked payment addresses, not the number of stake accounts or exchange labels.</p>
      <p>Select all checks Exclude from refresh for all addresses in that wallet with a cached balance. Unselect all enables refresh for all its addresses again. Both buttons include hidden addresses and save the selection using your chosen Portfolio storage.</p>
      <h2>Refreshing and progress</h2>
      <p>Use the refresh icon in the header. Portfolio first resolves addresses and loads balances, then counts and analyses transactions together. The Transactions tile shows progress and remote-cache uploads. Values update as analysis arrives and can be incomplete until refresh finishes.</p>
      <p>Existing cached history is reused where possible. New addresses and missing analysis may require a longer scan. Closing a child overlay does not cancel refresh; keeping the website open allows it to continue. Excluded balances remain cached and can become outdated.</p>
      <p>Transaction loading and analysis are saved before token prices and images refresh. A token metadata failure leaves saved transactions available. The status indicates when transaction analysis has finished and token data is still loading.</p>
      <h2>Balances, values and performance</h2>
      <p>ADA across wallets shows the wallet ADA balance with its USD equivalent. Open it for current holdings and asset details. The coverage text indicates how many assets have a valuation.</p>
      <p>Unrealised gain / loss compares valued holdings with their matched remaining purchase cost. Missing history or purchase prices can make this a partial estimate. Mint and purchase costs are cost basis, not current prices. NFT floor prices and a 2 ADA fallback can be estimates, not achievable sale prices. Manual prices and exclusions can be managed in asset details.</p>
      <p>Network fees paid includes attributable fees from loaded transactions; shared-input fees that cannot be assigned reliably are excluded.</p>
      <p>ADA Gain/ loss uses ADA OUT to your labelled exchanges plus ADA still in tracked wallets minus ADA IN from those exchanges. Its USD estimate combines transfer-day prices with current wallet value, so ADA and USD can have different signs. It is not an exchange execution-price or tax calculation. Open the tile to inspect transfers and the timeline.</p>
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
      <p>Use the storage indicator to change storage or delete a cache. Local storage is desktop-only and stays in that browser; it is not wallet-encrypted. Clearing browser data can remove it.</p>
      <p>Encrypted remote storage also supports compatible mobile wallets. A separate wallet message approval unlocks it; no transaction or ADA fee is created. Data is encrypted in your browser before upload. Use the same stake account and a compatible wallet on another device. There is no admin recovery if you lose access.</p>
      <p>Inactive remote caches are deleted after seven days. Expired local data is removed on the next visit. Switching storage does not delete the other copy; review the copy and delete options carefully. Both modes still request public blockchain and price data from the backend. Encryption does not protect unlocked data from malicious browser extensions or website code.</p>
      <h2>Check before signing</h2>
      <p>Always review the wallet request and website domain. Portfolio access and cache unlock use message signatures, not payments. Reject unexpected transaction or transfer requests. Verify estimates against your wallet and on-chain records before relying on them.</p>
    </div>
  </AssetOverlay>;
}
