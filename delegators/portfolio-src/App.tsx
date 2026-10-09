"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ExternalLink,Plus,Trash2} from 'lucide-react';
import {PortfolioRefresh} from './PortfolioRefresh';
import {usePortfolioText} from './use-portfolio-text';
import {AssetWalletAddresses} from './AssetWalletAddresses';
import {createCardanoRequest} from './cardano-request';
import {planWalletDiscovery,pruneUnusedWalletAddresses,lowActivityWalletAddresses,activeAnalysedWalletGroups} from './wallet-discovery';
import {Input} from '@/components/ui/input';
import {TransactionFilters,transactionFilters as labels} from './TransactionFilters';
import {TransactionPagination} from './TransactionPagination';
import {withinTransactionDates,transactionPage} from './transaction-date';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {assetName,combineHoldings,holdingWalletNames,holdingWalletAddresses,kindOf,remainingBasis,liveAdaBasis,short,tradeOf,units,validAddress} from '@/lib/portfolio';
import type {AddressInfo,Detail,Fact,Market,Tx,Wallet} from '@/lib/portfolio';
import {readCache,readRefreshCache,saveCache} from '@/lib/portfolio-cache';
import {planRefresh,analyseAndCache} from './refresh-plan';
import {transactionWalletNames} from './transaction-wallet-names';
import {purchaseRefreshBatches} from './purchase-refresh';
import type {Snapshot} from '@/lib/portfolio-cache';

import {portfolioFetch} from './transport';
import {runPipeline} from './pipeline';
import {createHistoryIndex} from './history-index';
import {hasCounterpartyData,needsFactRefresh,needsActiveFactRefresh} from './fact-refresh';
import {keepRefreshSessionAlive} from './refresh-session';
import {currentValuation,mergeMarketQuote} from './current-valuation';
import {includedAssets} from './asset-exclusions';
import {policyTableRows,holdingTotal,holdingGroupTotals,collectionRepresentative} from './holding-groups';
import {TableGroupToggle,useTableGroups} from './TableGroupToggle';
import {valuationCoverage} from './valuation-coverage';
import {averageBuy,purchaseAverages} from './average-buy';
import {assetImageCandidates} from './asset-image';
import {applyCachedImages,watchImageCache} from './image-cache-status';
import {waitForRetry} from './retry-wait';
import {knownDecimals,tokenDecimals,holdingValue,holdingDecimals,estimatedPurchaseBasis} from './valuation';
import {mintPayments,paymentBudget} from './mint-payments';
import type {PaymentLink} from './mint-payments';
import {PaymentLinks} from './PaymentLinks';
import {AssetOverlay} from './AssetOverlay';
import {MenuTile,AdaUsdAmount,PortfolioMessage} from './ui';
import {portfolioSettings as localStorage,flushVault,storageMode} from './vault';
import {CacheUploadProgress} from './CacheUploadProgress';
import {CexTimeline} from './CexTimeline';
import {useBtcHistory} from './use-btc-history';
import {useEthereum} from './use-ethereum';
import {useSolana} from './use-solana';
import {SolanaWallets} from './SolanaWallets';
import {SolanaTransaction} from './SolanaTransaction';
import {solanaTransactions,solanaTransfers,solanaTotals,solAmount} from './solana';
import {EthereumWallets} from './EthereumWallets';
import {EthereumTransaction} from './EthereumTransaction';
import {ethereumTransactions,ethereumTransactionCount,ethereumTransfers,ethereumTransfer,ethereumValue,weiToEth} from './ethereum';
import {matchCrossChainSwaps,groupSwapRows} from './cross-chain-swaps';
import {learnMatchedSwapAddresses} from './matched-swap-addresses';
import {availableTotal,ethereumAvailableTotals,availableCexResult,networkFeeNotes} from './portfolio-totals';
import {performanceTransfers,gainTransfers} from './portfolio-flows';
import {ethereumReceiptBasis} from './ethereum-basis';
import {useFxHistory} from './use-fx-history';
import {nativeTransferTotals,portfolioTransferResult,fiatRate,comparisonResultLabel} from './transfer-comparison';
import type {ComparisonCrypto,ComparisonFiat} from './transfer-comparison';
import {ComparisonAmount} from './ComparisonAmount';
import {PortfolioCurrencyContext,formatPortfolioUsd,formatPortfolioAda,formatPortfolioAmount} from './portfolio-currency';
import {matchesGainLossTransfer} from './gain-loss-filter';
import {GainLossTransaction} from './GainLossTransaction';
import {TransactionTable,TransactionRow,TransactionAmount,TransactionWallets,TransactionPair} from './TransactionTable';
import {transactionAmounts,transactionNetworkFee,portfolioFeeTotal} from './transaction-amounts';
import {loadPriceSettings} from './price-settings';
import {NativeTransferSummary} from './NativeTransferSummary';
import {matchesTransaction,matchesSearchText} from './transaction-search';
import {CexAddresses} from './CexAddresses';
import {ByronExchanges} from './ByronExchanges';
import {SwapWallets} from './SwapWallets';
import {PortfolioQuickstart} from './PortfolioQuickstart';
import {WalletMenu} from './WalletMenu';
import {WalletCard} from './WalletAddresses';
import {refreshExcludedAddresses,walletRefreshCounts} from './member';
import {validByronAddress} from './byron-address';
import {exchangeExcludedAddresses,resolveSwapGroups,excludeInternalExchanges,swapOwnershipScope,swapAddressSet,isSwapTransaction} from './swap-wallets';
import {normalizeCexAddresses,cexAdjustedFact,isCexTransaction,isCardanoReward,cexAdaTransfer,cexUsdNetPosition,cexTimeline,transactionExchangeWallets} from './cex';
import type {CexAddress} from './cex';
import {durationLabel,remainingSeconds,analysisProgress} from './progress';
import {memberWallets,resolveWalletGroups,validWalletAddress,validStakeAddress,walletTransactionCount} from './member';
const num=(n:number,max=6)=>n.toLocaleString('en-US',{maximumFractionDigits:max});
type Overrides=Record<string,{average?:string;price?:string;decimals?:string;excluded?:boolean}>;
function parseAmount(s?:string):number|null {if(!s?.trim())return null;const n=Number(s);return Number.isFinite(n)&&n>=0?n:null;}

async function historicalPrices(signal:AbortSignal):Promise<{prices?:[number,number][]}|null>{
  for(let attempt=0;attempt<3;attempt++){
    try{const r=await portfolioFetch('/api/historical-prices',{signal,cache:'no-store'});if(r.ok)return await r.json();}catch{signal.throwIfAborted();}
    if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
    signal.throwIfAborted();
  }
  return null;
}

const request=createCardanoRequest(portfolioFetch);

export default function Home({memberStake,role='delegator',portfolioAccess}:{memberStake:string;role?:'delegator'|'admin';portfolioAccess?:{ethereum:boolean;solana:boolean}}){
  const t=usePortfolioText();
  const SETTINGS='tdsp-member-wallets-v1:'+memberStake;
  const CEX_SETTINGS='tdsp-member-cex-v1:'+memberStake;
  const [savedCexAddresses,setCexAddresses]=useState<CexAddress[]>(()=>{try{return normalizeCexAddresses(JSON.parse(localStorage.getItem(CEX_SETTINGS)||'[]'));}catch{return [];}});
  const [wallets,setWallets]=useState<Wallet[]>(()=>memberWallets(memberStake,[])),[ready,setReady]=useState(false);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('Starting…');
  const [initialising,setInitialising]=useState(false);
  const [purchaseProgress,setPurchaseProgress]=useState<{done:number;total:number}|null>(null);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[cacheNotice,setCacheNotice]=useState('');
  const [address,setAddress]=useState(''),[name,setName]=useState(''),[walletError,setWalletError]=useState('');
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[overrides,setOverrides]=useState<Overrides>({});
  const [paymentLinks,setPaymentLinks]=useState<PaymentLink[]>([]);
  const [missingCostsOnly,setMissingCostsOnly]=useState(false);
  const [selectedAsset,setSelectedAsset]=useState<string|null>(null);
  const [section,setSection]=useState<'wallets'|'holdings'|'transactions'|'gain-loss'|null>(null);
  const isAdmin=role==='admin';
  const canEthereum=isAdmin||portfolioAccess?.ethereum===true,canSolana=isAdmin||portfolioAccess?.solana===true;
  const ethereum=useEthereum(memberStake,ready&&canEthereum);
  const solana=useSolana(memberStake,ready&&canSolana);
  const solTransactions=useMemo(()=>solanaTransactions(solana.data,solana.wallets),[solana.data,solana.wallets]);
  const rawSolTransfers=useMemo(()=>solanaTransfers(solana.data,solana.wallets,solana.exchanges),[solana.data,solana.wallets,solana.exchanges]);
  const ethTransactions=useMemo(()=>ethereumTransactions(ethereum.data,ethereum.wallets),[ethereum.data,ethereum.wallets]);
  const rawEthTransfers=useMemo(()=>ethereumTransfers(ethereum.data,ethereum.wallets,ethereum.exchanges),[ethereum.data,ethereum.wallets,ethereum.exchanges]);
  const [holdingsGroup,setHoldingsGroup]=useState<'FTs'|'NFTs'|null>(null);
  const {expanded:expandedPolicies,toggle:togglePolicy,reset:resetPolicies}=useTableGroups();
  const btc=useBtcHistory(section==='gain-loss');
  const [comparisonCrypto,setComparisonCrypto]=useState<ComparisonCrypto>('ADA');
  useEffect(()=>{
    if(comparisonCrypto==='ETH'&&!canEthereum||comparisonCrypto==='SOL'&&!canSolana)setComparisonCrypto('ADA');
  },[comparisonCrypto,canEthereum,canSolana]);
  const [holdingsCurrency,setHoldingsCurrency]=useState<'ADA'|ComparisonFiat>('USD');
  const comparisonFiat=holdingsCurrency;
  const fx=useFxHistory(holdingsCurrency==='EUR'||holdingsCurrency==='JPY');
  const [page,setPage]=useState(0);
  const [dateFrom,setDateFrom]=useState(''),[dateTo,setDateTo]=useState('');
  const [liveQuote,setLiveQuote]=useState<{usd:number;at:string}|null>(null);
  const controller=useRef<AbortController|null>(null);
  const [refreshStarted,setRefreshStarted]=useState(0),[clock,setClock]=useState(0);
  const [analysis,setAnalysis]=useState<{started:number;done:number;total:number}|null>(null);
  const [counting,setCounting]=useState<number|null>(null);
  const [transactionStatus,setTransactionStatus]=useState('');
  const [counted,setCounted]=useState<number|null>(null);
  const walletKey=memberStake+'::'+wallets.map(w=>w.address).sort().join('|');
  const key=walletKey+swapOwnershipScope(wallets);
  const excludedRefresh=useMemo(()=>refreshExcludedAddresses(wallets),[wallets]);
  const activeWalletGroups=useMemo(()=>activeAnalysedWalletGroups(snapshot,excludedRefresh),[snapshot,excludedRefresh]);
  const refreshCounts=walletRefreshCounts(activeWalletGroups,new Set());
  const trackedAddresses=useMemo(()=>new Set(Object.values(snapshot?.groups||{}).flat()),[snapshot?.groups]);
  const ownedAddresses=useMemo(()=>exchangeExcludedAddresses(wallets,snapshot?.groups,snapshot?.swapGroups),[wallets,snapshot?.groups,snapshot?.swapGroups]);
  const swapAddresses=useMemo(()=>swapAddressSet(wallets,snapshot?.swapGroups),[wallets,snapshot?.swapGroups]);
  const cexAddresses=useMemo(()=>excludeInternalExchanges(savedCexAddresses,ownedAddresses),[savedCexAddresses,ownedAddresses]);
  const overrideKey='tdsp-member-basis:'+memberStake;
  const paymentKey='tdsp-member-payments:'+walletKey;
  useEffect(()=>{const changed=(event:Event)=>setCacheNotice((event as CustomEvent<string>).detail);window.addEventListener('tdsp:portfolio-cache-notice',changed);return()=>window.removeEventListener('tdsp:portfolio-cache-notice',changed);},[]);

  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(SETTINGS)||'null');setWallets(memberWallets(memberStake,saved));}catch{setCacheNotice('Browser storage is unavailable; wallet settings may not persist.');}setReady(true);return()=>controller.current?.abort();},[]);
  useEffect(()=>{if(!ready)return;setSnapshot(null);setError('');try{setOverrides(loadPriceSettings(localStorage,memberStake,walletKey));}catch{setOverrides({});}try{const links=JSON.parse(localStorage.getItem(paymentKey)||'[]');setPaymentLinks(Array.isArray(links)?links.filter(l=>l&&['assetId','receiptHash','paymentHash','lovelace'].every(k=>typeof l[k]==='string')):[]);}catch{setPaymentLinks([]);}void refresh();return()=>controller.current?.abort();/* wallet scope determines the cached portfolio */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,key]);
  useEffect(()=>setPage(0),[filter,query,key,dateFrom,dateTo]);
  useEffect(()=>{
    const hide=()=>{setSelectedAsset(null);setSection(null);};
    window.addEventListener('tdsp:portfolio-hidden',hide);
    return()=>window.removeEventListener('tdsp:portfolio-hidden',hide);
  },[]);
  useEffect(()=>{
    if(!busy||!ready)return;
    return keepRefreshSessionAlive(signal=>portfolioFetch('/session',{signal}));
  },[busy,ready]);
  useEffect(()=>{
    if(!busy)return;
    const timer=setInterval(()=>setClock(Date.now()),1000);
    return()=>clearInterval(timer);
  },[busy]);
  useEffect(()=>{
    if(!ready)return;
    const control=new AbortController();let pending=false;
    const timer=setInterval(async()=>{
      if(pending)return;pending=true;
      try{const r=await portfolioFetch('/api/price',{signal:control.signal,cache:'no-store'});if(r.ok){const q=await r.json() as {cardano?:{usd?:number}};const price=q.cardano?.usd;if(typeof price==='number'&&Number.isFinite(price)&&price>0&&!control.signal.aborted)setLiveQuote({usd:price,at:new Date().toISOString()});}}catch{/* Preserve the last quote and its timestamp on transient failures. */}finally{pending=false;}
    },60000);
    return()=>{clearInterval(timer);control.abort();};
  },[ready]);

  async function refresh(fullScan=false){
    const exclusions=fullScan?new Set<string>():new Set(excludedRefresh);
    controller.current?.abort();const control=new AbortController();controller.current=control;const signal=control.signal;
    const started=Date.now();setRefreshStarted(started);setClock(started);setAnalysis(null);setCounting(null);setCounted(null);setTransactionStatus('');
    setBusy(true);setInitialising(false);setError('');setNotice('');setStatus('Loading saved portfolio data…');
    async function walletRequest<T>(endpoint:string,body:Record<string,unknown>):Promise<T>{
      signal.throwIfAborted();
      setInitialising(true);
      try{return await request<T>(endpoint,body,signal);}
      finally{if(controller.current===control)setInitialising(false);}
    }
    try{
      let cached:Snapshot|null=null;try{const exact=await readCache(key);cached=exact||await readRefreshCache(key);signal.throwIfAborted();if(exact)setSnapshot(exact);}catch{setCacheNotice('Portfolio cache is locked. Sign in and approve unlock again.');throw new Error('Portfolio cache is locked.');}
      if(cached&&!fullScan)cached=pruneUnusedWalletAddresses(cached,wallets);
      if(!fullScan)for(const address of lowActivityWalletAddresses(cached))exclusions.add(address);
      const {accounts,pending:stakes}=planWalletDiscovery(wallets,fullScan?null:cached);
      setStatus(stakes.length?'Initialising wallets · finding linked addresses…':'Using saved wallet addresses · checking balances and transactions…');
      for(let i=0;i<stakes.length;i+=40){
        setStatus(`Finding linked addresses · batch ${Math.floor(i/40)+1} of ${Math.ceil(stakes.length/40)}`);
        accounts.push(...await walletRequest<{stake_address:string;addresses:string[]}[]>('account_addresses',{_stake_addresses:stakes.slice(i,i+40),_first_only:false,_empty:true}));
      }
      const groups=resolveWalletGroups(wallets,accounts);
      const swapGroups=resolveSwapGroups(wallets,accounts);
      const plan=planRefresh(cached,groups,exclusions,fullScan);
      const addresses=[...new Set(Object.values(groups).flat())];
      const refreshAddresses=addresses.filter(address=>!exclusions.has(address));
      const addressBatches=Array.from({length:Math.ceil(refreshAddresses.length/40)},(_,i)=>refreshAddresses.slice(i*40,(i+1)*40));
      const loadInfos=async()=>{const all:AddressInfo[]=(cached?.infos||[]).filter(info=>addresses.includes(info.address)&&exclusions.has(info.address));for(const [index,batch] of addressBatches.entries()){
        setStatus(`Checking balances · batch ${index+1} of ${addressBatches.length}`);
        all.push(...await walletRequest<AddressInfo[]>('address_info',{_addresses:batch}));
      }return all;};
      const infos=await loadInfos();signal.throwIfAborted();
      if(addresses.some(a=>!infos.some(i=>i.address===a)))throw new Error('Some wallet balances were not returned. The combined balance has not been replaced.');
      const holdings=combineHoldings(infos);
      const next:Snapshot={groups,swapGroups,infos,txs:plan.txs,facts:plan.facts,markets:{...cached?.markets},adaUsd:cached?.adaUsd??null,history:cached?.history||{},updated:new Date().toISOString(),priceAt:cached?.priceAt??null,complete:false,pendingOwnershipAddresses:plan.pendingOwnershipAddresses};
      next.excludedRefreshAddresses=[...exclusions];
      next.historyCompleteAddresses=plan.historyCompleteAddresses;
      for(const info of infos)for(const u of info.utxo_set||[])for(const a of u.asset_list||[]){const id=a.policy_id+a.asset_name;next.markets[id]={...next.markets[id],token_id:id,decimals:a.decimals??next.markets[id]?.decimals};}
      setSnapshot({...next});
      setInitialising(false);setStatus('Balances updated · updating prices…');
      const quote=await portfolioFetch('/api/price',{signal}).then(async r=>r.ok?await r.json() as {cardano?:{usd:number}}:null).catch(()=>null);
      signal.throwIfAborted();
      const freshPrice=quote?.cardano?.usd??null;
      if(freshPrice!==null){next.adaUsd=freshPrice;next.priceAt=new Date().toISOString();setLiveQuote({usd:freshPrice,at:next.priceAt});}
      setSnapshot({...next});
      setStatus('Balances updated · loading historical prices…');
      const hist=await historicalPrices(signal);signal.throwIfAborted();
      if(hist?.prices?.length)next.history={...next.history,...Object.fromEntries(hist.prices.filter(([t,p])=>Number.isFinite(t)&&Number.isFinite(p)&&p>0).map(([t,p])=>[new Date(t).toISOString().slice(0,10),p]))};
      // Today's closing candle may not exist yet; only today's receipts can use
      // the fresh quote provisionally. Never backfill older dates with it.
      const today=new Date().toISOString().slice(0,10);
      if(!next.history[today]&&freshPrice!==null&&freshPrice>0)next.history[today]=freshPrice;
      const warnings:string[]=[];if(freshPrice===null)warnings.push('Current ADA/USD price unavailable.');if(!hist?.prices?.length)warnings.push('Historical ADA/USD refresh failed. Saved prices are retained; missing receipt prices will not be counted as zero.');
      const assetIds=holdings.filter(h=>h.id!=='lovelace').map(h=>h.id);
      signal.throwIfAborted();setSnapshot({...next});setNotice(warnings.join(' '));
      const persist=async()=>{try{await saveCache(key,next);}catch{setCacheNotice('Portfolio cache could not be updated. Keep this page open and check Storage settings.');}};
      const incremental=plan.batches.some(batch=>batch.incremental);
      const historyIndex=createHistoryIndex(next.txs,incremental);
      await persist();const seenPages=new Set<string>();
      const owned=new Set(addresses);
      const analysisStarted=Date.now();
      const refreshedHashes=new Set<string>();
      const scheduled=new Set<string>();
      const completedHistory=new Set(plan.historyCompleteAddresses);
      const updateAnalysis=()=>setAnalysis({started:analysisStarted,done:refreshedHashes.size,total:scheduled.size});
      setCounting(historyIndex.size);updateAnalysis();
      setTransactionStatus('Checking Transactions');
      await runPipeline<Tx>(async(enqueue,active)=>{
        // Upgrade receipts and outgoing payments once to retain their UTxO links.
        const activeAddresses=new Set(refreshAddresses);
        const legacy=next.txs.filter(tx=>needsActiveFactRefresh(next.facts[tx.tx_hash],activeAddresses));
        for(const tx of legacy)scheduled.add(tx.tx_hash);
        enqueue(legacy);updateAnalysis();
        for(const historyBatch of plan.batches)for(let offset=0;;offset+=1000){
          const addressBatch=historyBatch.addresses;
          const page=await request<Tx[]>('address_txs',{_addresses:addressBatch},active,`${offset}-${offset+999}`);
          active.throwIfAborted();
          const pageKey=addressBatch.join(',')+':'+page.map(t=>t.tx_hash).join('|');
          if(page.length===1000&&seenPages.has(pageKey))throw new Error('The indexer repeated a history page. Please refresh to complete the history.');
          seenPages.add(pageKey);
          const pending:Tx[]=[];
          const {reachedSavedHistory}=historyIndex.add(page,historyBatch.incremental);
          for(const tx of page){
            // Old derived-only caches cannot reclassify an overlap with a newly owned address.
            if(historyBatch.newAddresses&&cached?.facts[tx.tx_hash]&&!cached.facts[tx.tx_hash].source&&!scheduled.has(tx.tx_hash))delete next.facts[tx.tx_hash];
            const fact=next.facts[tx.tx_hash];
            if(needsFactRefresh(fact)&&!scheduled.has(tx.tx_hash)){scheduled.add(tx.tx_hash);pending.push(tx);}
          }
          next.txs=historyIndex.rows();
          setCounting(historyIndex.size);updateAnalysis();setSnapshot({...next,facts:{...next.facts}});
          enqueue(pending);
          if(page.length<1000||reachedSavedHistory){
            addressBatch.forEach(address=>completedHistory.add(address));
            break;
          }
        }
        active.throwIfAborted();setCounting(null);setCounted(historyIndex.size);
        setTransactionStatus('Analysing Transactions');
      },async(batch,active)=>{
        const details=await request<Detail[]>('tx_info',{_tx_hashes:batch.map(t=>t.tx_hash),_inputs:true,_assets:true,_metadata:false,_withdrawals:false,_certs:false,_scripts:false,_bytecode:false},active);
        active.throwIfAborted();
        for(const d of details){
          if(!batch.some(tx=>tx.tx_hash===d.tx_hash))continue;
          next.facts[d.tx_hash]=analyseAndCache(d,owned);refreshedHashes.add(d.tx_hash);
        }
        setSnapshot({...next,facts:{...next.facts}});updateAnalysis();
        await persist();active.throwIfAborted();
      },signal);
      setTransactionStatus('');
      if([...scheduled].every(hash=>refreshedHashes.has(hash))){
        next.historyCompleteAddresses=[...completedHistory];
        next.pendingOwnershipAddresses=next.pendingOwnershipAddresses?.filter(address=>!completedHistory.has(address));
      }
      next.txs=next.txs.filter(tx=>!next.facts[tx.tx_hash]||next.facts[tx.tx_hash].wallets.some(address=>owned.has(address)));
      const historyHashes=new Set(next.txs.map(tx=>tx.tx_hash));
      next.facts=Object.fromEntries(Object.entries(next.facts).filter(([hash])=>historyHashes.has(hash)));
      next.complete=next.txs.every(t=>hasCounterpartyData(next.facts[t.tx_hash]))&&[...scheduled].every(hash=>refreshedHashes.has(hash));
      Object.assign(next,pruneUnusedWalletAddresses(next,wallets));
      await persist();signal.throwIfAborted();setSnapshot({...next});
      // Optional metadata must not prevent transaction discovery or saving analysis.
      for(const id of new Set(Object.values(next.facts).flatMap(fact=>Object.keys(fact.assets)))){
        if(id!=='lovelace'&&!assetIds.includes(id))assetIds.push(id);
      }
      for(let i=0;i<assetIds.length;i+=50){
        setStatus(`Transactions saved · loading token prices and images ${Math.floor(i/50)+1} / ${Math.ceil(assetIds.length/50)}`);
        try{
          const r=await portfolioFetch('/api/markets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets:assetIds.slice(i,i+50)}),signal});
          if(!r.ok)throw new Error('Token data unavailable');
          const data=await r.json() as {tokens:Market[];pricing_unavailable?:boolean};
          if(!Array.isArray(data.tokens))throw new Error('Invalid token data');
          for(const m of data.tokens)next.markets[m.token_id]=mergeMarketQuote(next.markets[m.token_id],m);
          if(data.pricing_unavailable)warnings.push('Token market prices unavailable; asset images and fallback valuations can still load.');
          await persist();signal.throwIfAborted();setSnapshot({...next,markets:{...next.markets}});
        }catch{
          signal.throwIfAborted();
          warnings.push('Token prices or images could not be refreshed. Saved data and transaction analysis are retained.');
          break;
        }
      }
      setNotice(warnings.join(' '));
      await flushVault().catch(()=>{});signal.throwIfAborted();
      setStatus(next.complete?`Updated ${new Date(next.updated).toLocaleString()}`:'Some transactions are awaiting analysis. Refresh to retry.');
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Could not update this portfolio.');setStatus('Refresh incomplete · showing available data');setTransactionStatus(current=>current?'Transaction refresh incomplete · cached data retained':'');}}
    finally{if(!signal.aborted){setClock(Date.now());setBusy(false);setInitialising(false);setCounting(null);}}
  }

  function setRefreshExcluded(selection:string|string[],value:boolean){
    const selected=Array.isArray(selection)?selection:[selection];
    const next=wallets.map(wallet=>{
      const exclusions=new Set(wallet.excludedRefreshAddresses||[]);
      for(const address of selected){
        if(value&&(snapshot?.groups?.[wallet.address]||[]).includes(address)&&snapshot?.infos.some(info=>info.address===address))exclusions.add(address);
        if(!value)exclusions.delete(address);
      }
      return {...wallet,excludedRefreshAddresses:[...exclusions]};
    });
    try{localStorage.setItem(SETTINGS,JSON.stringify(next));setWallets(next);}
    catch{setCacheNotice('Wallet settings could not be saved to the selected cache.');}
  }
  function saveWallets(next:Wallet[]){
    const namesOnly=next.length===wallets.length&&next.every((wallet,index)=>JSON.stringify({...wallet,label:undefined})===JSON.stringify({...wallets[index],label:undefined}));
    if(namesOnly){
      try{localStorage.setItem(SETTINGS,JSON.stringify(next));setWallets(next);return true;}
      catch{setCacheNotice('Wallet settings could not be saved to the selected cache.');return false;}
    }
    const cleaned=excludeInternalExchanges(savedCexAddresses,exchangeExcludedAddresses(next,snapshot?.groups,snapshot?.swapGroups));
    if(!saveCexAddresses(cleaned))return false;
    next=memberWallets(memberStake,next);controller.current?.abort();
    setBusy(true);setInitialising(false);setAnalysis(null);setCounting(null);setCounted(null);setTransactionStatus('');setStatus('Preparing wallet refresh…');
    const started=Date.now();setRefreshStarted(started);setClock(started);
    try{localStorage.setItem(SETTINGS,JSON.stringify(next));}catch{setCacheNotice('Wallet settings could not be saved to the selected cache.');}
    setWallets(next);
    return true;
  }
  function saveCexAddresses(entries:CexAddress[]){
    entries=excludeInternalExchanges(entries,ownedAddresses);
    try{localStorage.setItem(CEX_SETTINGS,JSON.stringify(entries));setCexAddresses(entries);return true;}
    catch{setCacheNotice('CEX addresses could not be saved to the selected cache.');return false;}
  }
  function addWallet(e:React.FormEvent){e.preventDefault();const a=address.trim().toLowerCase();if(!validWalletAddress(a)){setWalletError('Enter a valid mainnet stake address (stake1…) or payment address (addr1…).');return;}if(wallets.some(w=>w.address===a)){setWalletError('This address is already included.');return;}saveWallets([...wallets,{address:a,label:name.trim()||`Wallet ${wallets.length+1}`}]);setAddress('');setName('');setWalletError('');}
  function updateOverride(id:string,field:'average'|'price'|'decimals',value:string){if(value!==''&&(parseAmount(value)===null||(field==='decimals'&&tokenDecimals(Number(value))===null)))return;const next={...overrides,[id]:{...overrides[id],[field]:value}};setOverrides(next);try{localStorage.setItem(overrideKey,JSON.stringify(next));}catch{setCacheNotice('Your price entries could not be saved locally.');}}
  function savePaymentLinks(links:PaymentLink[]){setPaymentLinks(links);try{localStorage.setItem(paymentKey,JSON.stringify(links));}catch{setCacheNotice('Your payment links could not be saved locally.');}}

  function excludeAsset(id:string,excluded:boolean){
    if(id==='lovelace')return;
    const next={...overrides,[id]:{...overrides[id],excluded}};
    setOverrides(next);
    try{localStorage.setItem(overrideKey,JSON.stringify(next));}catch{setCacheNotice('Your asset exclusions could not be saved locally.');}
  }
  async function refreshAssetPurchases(id?:string){
    if(busy||!snapshot)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;
    const {signal}=control;
    setBusy(true);setError('');setPurchaseProgress(null);setStatus('Refreshing asset purchase data…');
    try{
      const ids=id?[id]:combineHoldings(snapshot.infos).map(h=>h.id).filter(id=>id!=='lovelace');
      const batches=purchaseRefreshBatches(Object.values(snapshot.facts),ids);
      const total=batches.reduce((sum,batch)=>sum+batch.length,0);
      if(!total)throw new Error('No asset receipts are loaded. Refresh the wallet history first.');
      setPurchaseProgress({done:0,total});
      const owned=new Set(Object.values(snapshot.groups||{}).flat());
      if(!owned.size)throw new Error('Wallet addresses are unavailable. Refresh the wallet history first.');
      let next={...snapshot,facts:{...snapshot.facts},history:{...snapshot.history}};
      let done=0;
      for(const batch of batches){
        setStatus(`Checking purchase transactions ${done} / ${total} · ${ids.length} assets`);
        const details=await request<Detail[]>('tx_info',{_tx_hashes:batch,_inputs:true,_assets:true,_metadata:false,_scripts:false,_bytecode:false},signal);
        signal.throwIfAborted();
        if(batch.some(hash=>!details.some(d=>d.tx_hash===hash)))throw new Error('Some purchase transactions were not returned. Saved data is retained.');
        const updated={...next.facts};
        for(const d of details)if(batch.includes(d.tx_hash)){
          if(d.marketplace_version!==3)throw new Error('Purchase decoding is unavailable or the backend needs an update. Saved data is retained; retry after updating koios-proxy.');
          updated[d.tx_hash]=analyseAndCache(d,owned);
        }
        next={...next,facts:updated};
        await saveCache(key,next);signal.throwIfAborted();setSnapshot(next);
        done+=batch.length;setPurchaseProgress({done,total});
      }
      setStatus('Refreshing historical USD prices…');
      const hist=await historicalPrices(signal);signal.throwIfAborted();
      next={...next,history:{...next.history}};
      for(const [time,price] of hist?.prices||[])if(Number.isFinite(time)&&Number.isFinite(price)&&price>0)next.history[new Date(time).toISOString().slice(0,10)]=price;
      await saveCache(key,next);signal.throwIfAborted();setSnapshot(next);
      const result=mintPayments(Object.values(next.facts).map(f=>cexAdjustedFact(f,cexAddresses)),paymentLinks);
      const costs=Object.values(result.acquisitions).flatMap(a=>ids.flatMap(asset=>a[asset]?[a[asset]]:[]));
      const matched=ids.filter(asset=>Object.values(result.acquisitions).some(a=>a[asset])).length;
      setStatus(`${matched} / ${ids.length} assets have verified purchase allocations. ${costs.some(a=>!next.history[new Date(a.time*1000).toISOString().slice(0,10)])?'Some historical USD prices are unavailable. ':''}Manual prices preserved. Assets without a match need receipt history or a saved payment link.`);
    }catch(e){if(!signal.aborted)setError(e instanceof Error?e.message:'Could not refresh asset purchase data.');}
    finally{if(controller.current===control)setBusy(false);}
  }
  const holdings=useMemo(()=>snapshot?combineHoldings(snapshot.infos):[],[snapshot]);
  const missingImageIds=[...new Set([...holdings.map(h=>h.id),...(selectedAsset?[selectedAsset]:[])])].filter(id=>/^[a-f0-9]{56}(?:[a-f0-9]{2}){0,32}$/.test(id)&&!snapshot?.markets[id]?.registry_logo&&!snapshot?.markets[id]?.cached_image).sort().join('|');
  useEffect(()=>{
    if(!ready||busy||!missingImageIds)return;
    const control=new AbortController(),signal=control.signal;
    void watchImageCache(missingImageIds.split('|'),async assets=>{
      const response=await portfolioFetch('/image-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets}),signal});
      if(!response.ok)throw new Error('Image cache status unavailable.');
      return response.json();
    },images=>setSnapshot(previous=>{
      if(!previous||signal.aborted)return previous;
      const markets=applyCachedImages(previous.markets,images);
      return markets===previous.markets?previous:{...previous,markets};
    }),signal,ms=>waitForRetry(ms,signal)).catch(()=>{/* Image availability never interrupts portfolio analysis. */});
    return()=>control.abort();
  },[ready,busy,key,missingImageIds]);
  const assetWallets=useMemo(()=>snapshot?holdingWalletNames(snapshot.infos,wallets,snapshot.groups):{},[snapshot,wallets]);
  const assetAddresses=useMemo(()=>snapshot?holdingWalletAddresses(snapshot.infos):{},[snapshot]);
  const classifiedFacts=useMemo(()=>Object.fromEntries(Object.entries(snapshot?.facts||{}).map(([hash,fact])=>[hash,cexAdjustedFact(fact,cexAddresses)])),[snapshot,cexAddresses]);
  const savedSwapGroups=useMemo(()=>Object.fromEntries(wallets.filter(wallet=>wallet.group==='swap').map(wallet=>[wallet.address,[...snapshot?.swapGroups?.[wallet.address]||[],...wallet.swapAddresses||[]]])),[wallets,snapshot?.swapGroups]);
  const crossChainSwaps=useMemo(()=>matchCrossChainSwaps(Object.values(classifiedFacts),swapAddresses,ethereum.data,ethereum.wallets,snapshot?.history||{},0.05,savedSwapGroups,{data:solana.data,wallets:solana.wallets}),[classifiedFacts,swapAddresses,ethereum.data,ethereum.wallets,snapshot?.history,savedSwapGroups,solana.data,solana.wallets]);
  useEffect(()=>{
    if(!ready||!ethereum.loaded)return;
    const owned=new Set(Object.values(snapshot?.groups||{}).flat());
    for(const wallet of wallets.filter(wallet=>wallet.group!=='swap'))owned.add(wallet.address);
    const learned=learnMatchedSwapAddresses(crossChainSwaps.pairs,Object.values(classifiedFacts),wallets,snapshot?.swapGroups||{},owned,ethereum.data,ethereum.wallets);
    try{
      if(learned.cardano!==wallets){localStorage.setItem(SETTINGS,JSON.stringify(learned.cardano));setWallets(learned.cardano);}
      if(learned.ethereum!==ethereum.wallets)ethereum.saveWallets(learned.ethereum);
    }catch{setCacheNotice('Wallet settings could not be saved to the selected cache.');}
  },[ready,ethereum.loaded,crossChainSwaps,classifiedFacts,wallets,snapshot?.groups,snapshot?.swapGroups,ethereum.data,ethereum.wallets]);
  const cexFacts=useMemo(()=>Object.fromEntries(Object.entries(classifiedFacts).filter(([hash])=>!crossChainSwaps.cardano.has(hash))),[classifiedFacts,crossChainSwaps]);
  const ethTransfers=useMemo(()=>rawEthTransfers.filter(row=>!crossChainSwaps.ethereum.has(row.hash)),[rawEthTransfers,crossChainSwaps]);
  const solTransfers=useMemo(()=>performanceTransfers(rawSolTransfers).filter(row=>!crossChainSwaps.solana.has(row.hash.split(':')[1])),[rawSolTransfers,crossChainSwaps]);
  const solTransfersByHash=useMemo(()=>{
    const rows=new Map<string,typeof solTransfers>();
    for(const row of solTransfers){const hash=row.hash.split(':')[1],group=rows.get(hash)||[];group.push(row);rows.set(hash,group);}return rows;
  },[solTransfers]);
  const assetDecimals=useMemo(()=>knownDecimals(snapshot?.infos||[],Object.values(classifiedFacts)),[snapshot,classifiedFacts]);
  const payments=useMemo(()=>mintPayments(Object.values(classifiedFacts),paymentLinks),[classifiedFacts,paymentLinks]);
  const cexDollars=useMemo(()=>cexUsdNetPosition(Object.values(cexFacts),cexAddresses,holdings.find(h=>h.id==='lovelace')?.raw||'0',snapshot?.history||{},liveQuote?.usd??snapshot?.adaUsd??null),[cexFacts,cexAddresses,holdings,snapshot,liveQuote]);
  const ethHistoryReady=ethereum.wallets.every(w=>!!ethereum.data.accounts[w.address]);
  const ethHistoryAvailable=!ethereum.wallets.length||ethereum.wallets.some(w=>!!ethereum.data.accounts[w.address]);
  const ethCexTotals=useMemo(()=>ethHistoryAvailable?nativeTransferTotals(performanceTransfers(ethTransfers),snapshot?.history||{},fx.history,comparisonFiat):{incoming:null,outgoing:null,inFiat:null,outFiat:null},[ethHistoryAvailable,ethTransfers,snapshot,fx.history,comparisonFiat]);
  const miningTotals=useMemo(()=>ethHistoryAvailable?nativeTransferTotals(rawEthTransfers.filter(row=>row.performance===false),snapshot?.history||{},fx.history,comparisonFiat):{outgoing:null,outFiat:null},[ethHistoryAvailable,rawEthTransfers,snapshot,fx.history,comparisonFiat]);
  const ethBasis=useMemo(()=>ethereumReceiptBasis(ethereum.data,ethereum.wallets,ethereum.exchanges),[ethereum.data,ethereum.wallets,ethereum.exchanges]);
  const adaTransfers=useMemo(()=>cexTimeline(Object.values(cexFacts),cexAddresses,snapshot?.history||{}),[cexFacts,cexAddresses,snapshot?.history]);
  const adaCexTotals=snapshot?nativeTransferTotals(adaTransfers.map(row=>({...row,amount:row.ada})),snapshot.history,fx.history,comparisonFiat):{incoming:null,outgoing:null,inFiat:null,outFiat:null};
  const cexFlows=useMemo(()=>[...adaTransfers,...performanceTransfers(ethTransfers),...solTransfers],[adaTransfers,ethTransfers,solTransfers]);
  const solHistoryReady=solana.wallets.every(w=>!!solana.data.accounts[w.address]);
  const solCexTotals=solana.wallets.length&&!solana.wallets.some(w=>solana.data.accounts[w.address])?{incoming:null,outgoing:null,inFiat:null,outFiat:null}:nativeTransferTotals(solTransfers,snapshot?.history||{},fx.history,comparisonFiat);
  const cardanoReward=useCallback((fact:Fact)=>isCardanoReward(fact,cexAddresses),[cexAddresses]);
  const basis=useMemo(()=>snapshot?remainingBasis(Object.values(classifiedFacts),snapshot.history,payments.acquisitions,cardanoReward):{},[snapshot,classifiedFacts,payments,cardanoReward]);
  const purchases=useMemo(()=>purchaseAverages(Object.values(classifiedFacts),snapshot?.history||{},payments.acquisitions,cardanoReward),[classifiedFacts,snapshot,payments,cardanoReward]);
  const adaLive=useMemo(()=>snapshot?liveAdaBasis(Object.values(classifiedFacts),snapshot.history,holdings.find(h=>h.id==='lovelace')?.raw||'0',snapshot.complete,cardanoReward):null,[snapshot,holdings,classifiedFacts,cardanoReward]);
  const serviceReceipts=Object.values(classifiedFacts).filter(cardanoReward);
  const serviceAdaTransfers=serviceReceipts.map(fact=>{
    const raw=String(BigInt(fact.adaRaw)+BigInt(fact.feeRaw||'0'));
    const amounts=transactionAmounts(raw,fact.time,snapshot?.history||{});
    return {hash:fact.hash,time:fact.time,side:'sell' as const,amount:amounts.ada!,usd:amounts.usd};
  });
  const serviceAdaTotals=nativeTransferTotals(serviceAdaTransfers,snapshot?.history||{},fx.history,comparisonFiat);
  const serviceAssets=new Map<string,bigint>();
  for(const fact of serviceReceipts)for(const [id,raw] of Object.entries(fact.assets))if(BigInt(raw)>0n)serviceAssets.set(id,(serviceAssets.get(id)||0n)+BigInt(raw));
  const solServiceTotals=nativeTransferTotals(rawSolTransfers.filter(row=>row.performance===false),snapshot?.history||{},fx.history,comparisonFiat);
  const rows=holdings.map(h=>{
    const m=snapshot?.markets[h.id],automaticDecimals=holdingDecimals(m,assetDecimals[h.id]);
    const decimals=h.id==='lovelace'?6:tokenDecimals(parseAmount(overrides[h.id]?.decimals))??automaticDecimals;
    const manualPrice=parseAmount(overrides[h.id]?.price);
    const quote=currentValuation(h.id,units(h.raw,decimals),manualPrice,m,liveQuote?.usd??snapshot?.adaUsd??null);
    const price=quote.price;
    const avg=h.id==='lovelace'?null:parseAmount(overrides[h.id]?.average);const automatic=h.id==='lovelace'?adaLive:basis[h.id];
    const purchase=purchases[h.id];
    const estimated=h.id!=='lovelace'&&avg===null&&!(automatic?.raw===h.raw&&automatic.usd!==null)?estimatedPurchaseBasis(h.raw,purchase):null;
    const {qty,cost}=holdingValue(h.raw,decimals,price,avg,estimated??automatic);
    const value=quote.value,pnl=value!==null&&cost!==null?value-cost:null;
    const buyAverage=avg??(purchase?averageBuy(purchase.usd,units(String(purchase.raw),decimals)):null);
    return {...h,name:m?.name||m?.ticker||assetName(h.id),qty,price,value,cost,pnl,buyAverage,estimatedPurchaseCost:!!estimated,manualPrice,quote,automaticDecimals,automatic:avg===null&&cost!==null};
  }).sort((a,b)=>a.id==='lovelace'?-1:b.id==='lovelace'?1:(b.value??-1)-(a.value??-1));
  const included=includedAssets(rows,overrides),excludedCount=rows.length-included.length;
  const assetGroup=(id:string)=>id!=='lovelace'&&snapshot?.markets[id]?.is_nft===true?'NFTs':'FTs';
  const groupRows=holdingsGroup?rows.filter(row=>assetGroup(row.id)===holdingsGroup):rows;
  const holdingEntries=policyTableRows(groupRows,expandedPolicies,r=>!missingCostsOnly||(r.cost===null&&(r.id==='lovelace'||overrides[r.id]?.excluded!==true)));
  const groupIncluded=includedAssets(groupRows,overrides);
  const valued=included.filter(r=>r.value!==null),covered=included.filter(r=>r.pnl!==null);
  const ada=Number(holdings.find(h=>h.id==='lovelace')?.raw||0)/1e6;
  const currentAdaUsd=liveQuote?.usd??snapshot?.adaUsd??null;
  const ethExcluded=overrides['ethereum:1:native']?.excluded===true;
  const ethValue=ethereumValue(ethereum.data,ethereum.wallets);
  const ethAvailable=ethereumAvailableTotals(ethereum.data,ethereum.wallets);
  const solExcluded=overrides['solana:mainnet:native']?.excluded===true;
  const solAvailable=solanaTotals(solana.data,solana.wallets);
  const nativeCount=Number(ethereum.wallets.length>0)+Number(solana.wallets.length>0);
  const availableAssets=availableTotal([holdingTotal(included,snapshot?.complete===true),...(!ethExcluded&&ethereum.wallets.length?[ethAvailable.value]:[]),...(!solExcluded&&solana.wallets.length?[solAvailable.value]:[])]);
  const portfolioUsd=availableAssets.value;
  const portfolioPartial=availableAssets.partial||included.some(row=>row.value===null)||!ethExcluded&&ethAvailable.partial||!solExcluded&&solAvailable.partial;
  const portfolioAda=portfolioUsd!==null&&currentAdaUsd!==null&&currentAdaUsd>0?portfolioUsd/currentAdaUsd:null;
  const holdingsRate=holdingsCurrency==='ADA'?null:fiatRate(Date.now()/1000,holdingsCurrency,fx.history);
  const holdingsValue=holdingsCurrency==='ADA'?portfolioAda:portfolioUsd!==null&&holdingsRate!==null?portfolioUsd*holdingsRate:null;
  const holdingsLocale=(window as unknown as {TDSPI18n?:{getLanguage:()=>string}}).TDSPI18n?.getLanguage()||'en';
  const currencyDisplay={currency:holdingsCurrency,rate:holdingsRate,adaUsd:currentAdaUsd,locale:holdingsLocale,fxHistory:fx.history};
  const usd=(value:number)=>formatPortfolioUsd(value,currencyDisplay);
  const signed=(value:number)=>usd(Math.abs(value));
  const holdingsDisplay=formatPortfolioUsd(portfolioUsd,currencyDisplay);
  const serviceTokenTransfers=[...serviceAssets].map(([id,raw])=>{
    const market=snapshot?.markets[id];
    const decimals=tokenDecimals(parseAmount(overrides[id]?.decimals))??holdingDecimals(market,assetDecimals[id]);
    const quote=currentValuation(id,units(String(raw),decimals),parseAmount(overrides[id]?.price),market,currentAdaUsd);
    return {hash:'service-token:'+id,time:Date.now()/1000,side:'sell' as const,usd:quote.value};
  });
  const gainFlows=gainTransfers(cexFlows,[...serviceAdaTransfers,...rawEthTransfers.filter(row=>row.performance===false),...rawSolTransfers.filter(row=>row.performance===false),...serviceTokenTransfers]);
  const availableCex=availableCexResult(gainFlows,portfolioUsd,holdingsCurrency,currentAdaUsd,snapshot?.history||{},fx.history,Date.now()/1000);
  const tileGain=availableCex.value;
  const tileGainDisplay=(tileGain!==null&&tileGain<0?'− ':'')+formatPortfolioAmount(tileGain===null?null:Math.abs(tileGain),currencyDisplay);
  const comparisonResult=portfolioTransferResult(gainFlows,portfolioUsd,snapshot?.history||{},btc.history,ethereum.data.history,fx.history,comparisonCrypto,comparisonFiat,Date.now()/1000,currentAdaUsd,ethereum.data.usd,solana.data.history,solana.data.usd);
  const provisional=!snapshot?.complete&&covered.length>0;
  const adaBasisStatus=!adaLive?.reconciled?snapshot?.complete?'History / balance mismatch — refresh to reconcile':'Waiting for transaction history to reconcile with the wallet balance':adaLive.usd===null?'Missing receipt prices':snapshot?.complete?'Remaining cost · receipt-date prices':'Remaining cost · refresh in progress';
  const displayWallets=wallets.flatMap(w=>(w.group==='swap'?[...new Set([w.address,...snapshot?.swapGroups?.[w.address]||[],...w.swapAddresses||[]])]:snapshot?.groups?.[w.address]||[w.address]).map(address=>({...w,address})));
  const fees=useMemo(()=>portfolioFeeTotal(Object.values(snapshot?.facts||{}),trackedAddresses,swapAddresses),[snapshot,trackedAddresses,swapAddresses]);
  const loadedFacts=Object.keys(classifiedFacts).length;
  const transactionTotal=snapshot?.txs.length||0;
  const allTransactionTotal=transactionTotal+ethereumTransactionCount(ethereum.data,ethereum.wallets)+solTransactions.length;
  const ethFees=ethAvailable.fees;
  const availableFees=availableTotal([currentAdaUsd!==null?fees*currentAdaUsd:null,...(ethereum.wallets.length?[ethAvailable.feeUsd]:[]),...(solana.wallets.length?[solAvailable.feeUsd]:[])]);
  const feeUsd=availableFees.value;
  const feeNotes=networkFeeNotes([
    {chain:'Cardano',historyComplete:snapshot?.complete===true,feeUsd:currentAdaUsd!==null?fees*currentAdaUsd:null},
    ...(ethereum.wallets.length?[{chain:'ETH',historyComplete:!ethAvailable.feesPartial,feeUsd:ethAvailable.feeUsd,feeKnown:ethAvailable.fees!==null}]:[]),
    ...(solana.wallets.length?[{chain:'SOL',historyComplete:!solAvailable.feesPartial,feeUsd:solAvailable.feeUsd,feeKnown:solAvailable.fees!==null}]:[])
  ],holdingsCurrency==='ADA'?currentAdaUsd!==null&&currentAdaUsd>0:holdingsRate!==null);
  const partialNote='Partial · waiting for remaining wallet data or prices';
  const cexPending=snapshot?.txs.filter(tx=>!hasCounterpartyData(snapshot.facts[tx.tx_hash])).length||0;
  const cexUnresolved=Object.values(cexFacts).filter(f=>isCexTransaction(f,cexAddresses)&&!cexAdaTransfer(f,cexAddresses)).length;
  const analysedTotal=snapshot?.txs.filter(tx=>!!snapshot.facts[tx.tx_hash]).length||0;
  const progress=analysisProgress(busy,analysis,analysedTotal,transactionTotal);
  const eta=analysis&&counted!==null?remainingSeconds(analysis.started,clock,analysis.done,analysis.total):null;
  const refreshTiming=refreshStarted?`${busy?'Elapsed':'Refresh duration'}: ${durationLabel((clock-refreshStarted)/1000)}${busy?(eta!==null?` · Estimated analysis remaining: ${durationLabel(eta)}`:' · Estimating remaining time…'):''}`:'';
  const cardanoShown=(snapshot?.txs||[]).filter(t=>{const f=classifiedFacts[t.tx_hash],internalSwap=crossChainSwaps.cardano.has(t.tx_hash);return withinTransactionDates(t.block_time,dateFrom,dateTo)&&(section==='gain-loss'?!internalSwap&&matchesGainLossTransfer(f,cexAddresses,filter):(filter==='all'||(filter==='swap'?isSwapTransaction(f,swapAddresses):filter==='cex'?!internalSwap&&isCexTransaction(f,cexAddresses):internalSwap?filter==='internal':f&&kindOf(f)===filter)))&&matchesTransaction(query,t.tx_hash,f,snapshot?.markets||{},displayWallets,cexAddresses);});
  const ethereumShown=ethTransactions.filter(tx=>{
    const internalSwap=crossChainSwaps.ethereum.has(tx.id),transfer=internalSwap?null:ethereumTransfer(tx,ethereum.wallets,ethereum.exchanges),own=new Set(ethereum.wallets.map(w=>w.address));
    const kind=internalSwap||own.has(tx.from)&&own.has(tx.to)?'internal':own.has(tx.from)?'send':'receive';
    const swap=ethereum.wallets.some(w=>w.group==='swap'&&[w.address,...w.swapAddresses||[]].some(address=>address===tx.from||address===tx.to));
    const matches=section==='gain-loss'?!!transfer&&(filter==='all'||filter===(transfer.side==='buy'?'eth-in':'eth-out')):filter==='all'||filter===kind||filter==='cex'&&!!transfer||filter==='swap'&&swap;
    const names=[...ethereum.wallets,...ethereum.exchanges].filter(w=>[w.address,...('swapAddresses' in w?w.swapAddresses||[]:[])].some(address=>address===tx.from||address===tx.to)).map(w=>w.name);
    return matches&&withinTransactionDates(tx.time,dateFrom,dateTo)&&matchesSearchText(query,[tx.hash,tx.from,tx.to,'ETH',...names]);
  });
  const solShown=solTransactions.filter(tx=>{
    if(!withinTransactionDates(tx.time,dateFrom,dateTo))return false;
    const internalSwap=crossChainSwaps.solana.has(tx.hash);
    const transfers=solTransfersByHash.get(tx.hash)||[];
    if(section==='gain-loss'&&!transfers.length)return false;
    const own=new Set(solana.wallets.map(w=>w.address));
    const incoming=tx.transfers.some(row=>own.has(row.to)&&!own.has(row.from));
    const outgoing=tx.transfers.some(row=>own.has(row.from)&&!own.has(row.to));
    if(section==='gain-loss'){
      if(filter==='sol-in'&&!transfers.some(row=>row.side==='buy'))return false;
      if(filter==='sol-out'&&!transfers.some(row=>row.side==='sell'))return false;
      if(!['all','sol-in','sol-out'].includes(filter))return false;
    }else if(filter!=='all'&&!(filter==='swap'&&internalSwap)&&!(filter==='internal'&&internalSwap)&&!(filter==='cex'&&transfers.length)&&!(filter==='receive'&&incoming)&&!(filter==='send'&&outgoing))return false;
    const addresses=new Set([tx.payer,...tx.transfers.flatMap(row=>[row.from,row.to])]);
    const text=[tx.hash,'SOL',...[...solana.wallets,...solana.exchanges].filter(w=>addresses.has(w.address)).map(w=>w.name),...addresses];
    return matchesSearchText(query,text);
  });
  const shown=groupSwapRows([...cardanoShown.map(tx=>({chain:'cardano' as const,time:tx.block_time,tx})),...ethereumShown.map(tx=>({chain:'ethereum' as const,time:tx.time,tx})),...solShown.map(tx=>({chain:'solana' as const,time:tx.time,tx}))].sort((a,b)=>b.time-a.time),crossChainSwaps.pairs);
  const visibleEthIds=new Set(ethereumShown.map(tx=>tx.id));
  const visibleSolIds=new Set(solShown.map(tx=>tx.hash));
  const currentPage=transactionPage(page,shown.length).page;
  useEffect(()=>{if(page!==currentPage)setPage(currentPage);},[page,currentPage]);

  const walletForm=<>
    <form onSubmit={addWallet} className="wallet-form governance-drep-registration-form"><label>Wallet name<Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Savings" maxLength={60}/></label><label className="address-field">Stake or payment address<Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="stake1… or addr1…" aria-describedby="wallet-error" required/></label><button className="governance-vote-primary" type="submit"><Plus size={16}/>Add wallet</button></form><p id="wallet-error" role="status" className="negative">{walletError}</p>
  </>;
  const exchangeForm=<CexAddresses entries={cexAddresses} owned={ownedAddresses} onChange={saveCexAddresses}/>;
  const swapForm=<SwapWallets inline wallets={wallets} groups={snapshot?.swapGroups} onChange={saveWallets}/>;
  const ethSwapWallets=ethereum.wallets.filter(w=>w.group==='swap'),ethOwnWallets=ethereum.wallets.filter(w=>w.group!=='swap');
  return <PortfolioCurrencyContext.Provider value={currencyDisplay}><main className="member-portfolio"><PortfolioQuickstart stake={memberStake} status={status} wallets={walletForm} exchanges={exchangeForm} swap={swapForm}/><div className="portfolio-body"><div className="section-heading" aria-label="Portfolio refresh">
    <PortfolioRefresh onRefresh={()=>{void refresh();void ethereum.refresh();void solana.refresh();}} disabled={busy||ethereum.busy||solana.busy||!ready} busy={busy||ethereum.busy||solana.busy} currencyControl={<select className="governance-vote-secondary" aria-label={t('Comparison currency')} value={holdingsCurrency} onChange={event=>setHoldingsCurrency(event.target.value as 'ADA'|ComparisonFiat)}><option value="ADA">ADA</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="JPY">JPY (¥)</option></select>}/>
    <div className="portfolio-section">
      {!initialising&&!(busy&&analysis)&&<p role="status" className="status-line">{status}</p>}
      {error&&<PortfolioMessage error>{error}</PortfolioMessage>}{notice&&<PortfolioMessage>{notice}</PortfolioMessage>}
      {ethereum.error&&<PortfolioMessage translate="no" error>{t(ethereum.error)}</PortfolioMessage>}
      {ethereum.busy&&<p translate="no" role="status" className="status-line">{t(ethereum.status)}</p>}
      {solana.error&&<PortfolioMessage translate="no" error>{t(solana.error)}</PortfolioMessage>}
      {solana.busy&&<p translate="no" role="status" className="status-line">{t('Checking Solana transactions…')}</p>}
    </div>
  </div>
    <section className="portfolio-section"><div className="tdsp-tile-grid">
      <MenuTile title="Wallets" value={refreshCounts?`${num(refreshCounts.active+ethereum.wallets.length+solana.wallets.length,0)} / ${num(refreshCounts.total+ethereum.wallets.length+solana.wallets.length,0)} active`:initialising?'Initialising':'— / — active'} loading={initialising} loadingLabel={status} onOpen={()=>setSection('wallets')}/>
      <MenuTile title="Transactions" value={snapshot?num(allTransactionTotal,0):'—'} analysis={snapshot?{done:progress.done+allTransactionTotal-transactionTotal,total:progress.total+allTransactionTotal-transactionTotal,counting:counting!==null,busy:busy||ethereum.busy||solana.busy,status:transactionStatus}:undefined} onOpen={()=>{setQuery('');setFilter('all');setPage(0);setSection('transactions');}}>
        {storageMode()==='remote'?<CacheUploadProgress onRetry={()=>void flushVault().catch(()=>{})}/>:cacheNotice&&<p role="status" className="tdsp-bar-legend">{cacheNotice}</p>}
      </MenuTile>
      <MenuTile title="Assets" value={holdingsDisplay} onOpen={()=>{resetPolicies();setHoldingsGroup(null);setSection('holdings');}}>
        {portfolioPartial&&<p translate="no" className="small muted" role="status">{t(partialNote)}</p>}
        <p className="small muted">{t('{done} / {total} assets valued',{done:valued.length+(ethereum.wallets.length&&!ethExcluded&&ethValue!==null?1:0)+(solana.wallets.length&&!solExcluded&&solAvailable.value!==null?1:0),total:included.length+(ethereum.wallets.length&&!ethExcluded?1:0)+(solana.wallets.length&&!solExcluded?1:0)})}{excludedCount+(ethereum.wallets.length&&ethExcluded?1:0)+(solana.wallets.length&&solExcluded?1:0)?' · '+t('{count} excluded',{count:excludedCount+(ethereum.wallets.length&&ethExcluded?1:0)+(solana.wallets.length&&solExcluded?1:0)}):''}</p>
        {(holdingsCurrency==='EUR'||holdingsCurrency==='JPY')&&holdingsValue===null&&<p className="small muted" role="status">{t(fx.status||'Historical exchange rates unavailable')}</p>}
      </MenuTile>
      <Metric label="Network fees paid" value={loadedFacts||snapshot?.complete?nativeCount?formatPortfolioUsd(feeUsd,currencyDisplay):formatPortfolioAda(fees,currencyDisplay):'Waiting for transaction details'}>
        {ethereum.wallets.length>0&&<><span translate="no" className="small">Cardano: {loadedFacts||snapshot?.complete?formatPortfolioAda(fees,currencyDisplay):'—'}</span><span translate="no" className="small">ETH: {ethFees===null?'—':`${ethFees.toLocaleString(undefined,{maximumFractionDigits:8})} ETH`} · {formatPortfolioUsd(ethAvailable.feeUsd,currencyDisplay)}</span></>}
        {solana.wallets.length>0&&<span translate="no" className="small">SOL: {solAvailable.fees===null?'—':`${solAvailable.fees.toLocaleString(undefined,{maximumFractionDigits:9})} SOL`} · {formatPortfolioUsd(solAvailable.feeUsd,currencyDisplay)}</span>}
        {feeNotes.map(note=><span key={note} translate="no" className="small muted" role="status">{t(note)}</span>)}
      </Metric>
      {(cexAddresses.length>0||ethereum.exchanges.length>0||solana.exchanges.length>0)&&<Metric label="CEX Transactions" openLabel="CEX Transactions" note={portfolioPartial||availableCex.partial||!ethHistoryReady||!solHistoryReady?partialNote:undefined} value={snapshot?tileGainDisplay:'Waiting for wallet balances'} tone={tileGain===null?'':tileGain<0?'negative':'positive'} onOpen={()=>{setQuery('');setFilter('all');setPage(0);setSection('gain-loss');}}/>}
    </div></section>
    {section==='wallets'&&<AssetOverlay id="portfolio-wallets-overlay" name="Wallets" onClose={()=>setSection(null)}>
    <div className="portfolio-section">
      <button type="button" className="governance-vote-secondary" disabled={busy||!ready} onClick={()=>void refresh(true)}>Rescan all wallets</button>
      <p className="small muted">Rediscover linked addresses and check full transaction history, including excluded addresses for this scan only. Saved transaction details are reused.</p>
      {busy&&<p className="small muted" role="status">{transactionStatus||status}</p>}
      {error&&<p role="alert" className="small-text error-text">{error}</p>}
    </div>
    <WalletMenu counts={{wallets:wallets.filter(wallet=>wallet.group!=='swap'&&(activeWalletGroups?.[wallet.address]?.length||0)>0).length+ethOwnWallets.length+solana.wallets.length,exchanges:cexAddresses.filter(entry=>!validByronAddress(entry.address)).length+ethereum.exchanges.length+solana.exchanges.length,byron:cexAddresses.filter(entry=>validByronAddress(entry.address)).length,swap:wallets.filter(wallet=>wallet.group==='swap').length+ethSwapWallets.length}}
    wallets={<section className="portfolio-section"><p className="small muted">Your member stake address includes its linked payment addresses. Add only wallets you own.</p>
      <div className="history-table"><Table><TableHeader><TableRow><TableHead>Wallet</TableHead><TableHead>Address</TableHead><TableHead>{holdingsCurrency}</TableHead><TableHead>Transactions</TableHead><TableHead>Linked addresses</TableHead><TableHead>Remove</TableHead></TableRow></TableHeader><TableBody>{wallets.filter(wallet=>wallet.group!=='swap').map((w,i)=><WalletCard key={w.address} wallet={w} onRename={label=>saveWallets(wallets.map(wallet=>wallet.address===w.address?{...wallet,label}:wallet))} primary={i===0} snapshot={snapshot} busy={busy} excluded={excludedRefresh} onExclude={setRefreshExcluded} remove={()=>saveWallets(wallets.filter(x=>x.address!==w.address))}/>)}</TableBody></Table></div>
      {walletForm}
      <p className="small muted">Wallets, entered prices and history use your selected encrypted storage. Manual prices and average costs are saved per asset for your member account and retained when wallets change.</p>
      {ethereum.exchanges.length>0&&!ethereum.wallets.length&&<p translate="no" role="status" className="message">{t('Add your own Ethereum wallet to scan ETH CEX transfers. CEX addresses are counterparties, not your holdings; shared exchange balances are never counted as yours.')}</p>}
      {canEthereum&&<><button type="button" className="governance-vote-secondary" disabled={ethereum.busy||!ready||!ethereum.wallets.length} onClick={()=>void ethereum.refresh()}>{t('Refresh Ethereum wallets')}</button>
      <EthereumWallets wallets={ethOwnWallets} data={ethereum.data} owned={ethSwapWallets} onChange={next=>ethereum.saveWallets([...next,...ethSwapWallets])}/>
      </>}{canSolana&&<>
      <button type="button" className="governance-vote-secondary" disabled={solana.busy||!solana.wallets.length} onClick={()=>void solana.refresh()}>{t('Refresh Solana wallets')}</button>
      <SolanaWallets wallets={solana.wallets} data={solana.data} owned={solana.exchanges} onChange={solana.saveWallets}/></>}
    </section>}
    exchanges={<section className="portfolio-section">
      <CexAddresses entries={cexAddresses} owned={ownedAddresses} onChange={saveCexAddresses} swap={{wallets,groups:snapshot?.swapGroups,onChange:saveWallets}}/>
      {canEthereum&&<><EthereumWallets wallets={ethereum.exchanges} data={ethereum.data} exchanges owned={ethereum.wallets} onChange={ethereum.saveExchanges}/>
      <EthereumWallets wallets={ethSwapWallets} data={ethereum.data} swap owned={ethOwnWallets} onChange={next=>ethereum.saveWallets([...ethOwnWallets,...next])}/>
      </>}{canSolana&&<>
      <SolanaWallets wallets={solana.exchanges} data={solana.data} exchanges owned={solana.wallets} onChange={solana.saveExchanges}/></>}
      {cexAddresses.length>0&&Object.values(snapshot?.facts||{}).some(fact=>!Array.isArray(fact.externalInputs))&&<p className="small muted">Refresh to load sender and recipient stake addresses for older cached transactions.</p>}
    </section>}
    byron={<ByronExchanges facts={cexFacts} entries={cexAddresses} owned={ownedAddresses} wallets={displayWallets} history={snapshot?.history||{}} markets={snapshot?.markets||{}} complete={snapshot?.complete===true} onChange={saveCexAddresses}/>}/>
    </AssetOverlay>}
    {section==='holdings'&&<AssetOverlay id="portfolio-holdings-overlay" name={holdingsGroup||'Assets'} onClose={()=>holdingsGroup?setHoldingsGroup(null):setSection(null)}>
    <section className="portfolio-section">
      {!holdingsGroup&&<div className="tdsp-tile-grid">{(['FTs','NFTs'] as const).map(group=>{
        const assets=rows.filter(row=>assetGroup(row.id)===group),active=includedAssets(assets,overrides),priced=active.filter(row=>row.value!==null);
        const total=availableTotal([holdingTotal(active,snapshot?.complete===true),...(group==='FTs'&&!ethExcluded&&ethereum.wallets.length?[ethAvailable.value]:[]),...(group==='FTs'&&!solExcluded&&solana.wallets.length?[solAvailable.value]:[])]).value;
        const ethCount=group==='FTs'&&ethereum.wallets.length?1:0;
        const solCount=group==='FTs'&&solana.wallets.length?1:0;
        return <MenuTile key={group} title={group} value={formatPortfolioUsd(total,currencyDisplay)} onOpen={()=>setHoldingsGroup(group)}><p className="small muted">{t('{done} / {total} assets valued',{done:priced.length+(ethCount&&!ethExcluded&&ethValue!==null?1:0)+(solCount&&!solExcluded&&solAvailable.value!==null?1:0),total:active.length+(ethCount&&!ethExcluded?1:0)+(solCount&&!solExcluded?1:0)})}{assets.length-active.length+(ethCount&&ethExcluded?1:0)+(solCount&&solExcluded?1:0)?' · '+t('{count} excluded',{count:assets.length-active.length+(ethCount&&ethExcluded?1:0)+(solCount&&solExcluded?1:0)}):''}</p></MenuTile>;
      })}</div>}
      {holdingsGroup&&<>
      <button type="button" className="governance-vote-secondary" disabled={busy||!snapshot} onClick={()=>void refreshAssetPurchases()}>Refresh all purchase data</button>
      {purchaseProgress&&<div aria-live="polite"><p className="small muted" role="status">{status}</p><div className="section-heading"><span className="governance-vote-bar-track" style={{flex:1}} role="progressbar" aria-label="Purchase transactions checked" aria-valuemin={0} aria-valuemax={purchaseProgress.total} aria-valuenow={purchaseProgress.done}><span className="governance-vote-bar-fill governance-vote-bar-fill--yes" style={{flexBasis:`${purchaseProgress.done/purchaseProgress.total*100}%`}}/></span><span className="tdsp-bar-legend">{purchaseProgress.done} / {purchaseProgress.total}</span></div></div>}
      {error&&<p role="alert" className="small-text error-text">{error}</p>}
      <label className="small"><input type="checkbox" checked={missingCostsOnly} onChange={e=>setMissingCostsOnly(e.target.checked)}/> Show holdings with missing purchase cost ({valuationCoverage(groupIncluded).missingCost})</label>
      {payments.errors.length>0&&<p role="status" className="negative">Some saved payment links cannot be applied to the loaded history. Open the asset image to review its purchase payments.</p>}
      {(groupRows.length>0||holdingsGroup==='FTs'&&nativeCount>0)&&<Table className="portfolio-holdings-table"><TableHeader><TableRow>{['Asset','Balance','Price · USD','Value · USD','Average buy · USD','Gain / loss','Exclude'].map(label=><TableHead translate="no" key={label}>{t(label).replace('USD',holdingsCurrency)}</TableHead>)}</TableRow></TableHeader><TableBody>
      {holdingsGroup==='FTs'&&solana.wallets.length>0&&<TableRow>
        <TableCell><button type="button" className="governance-vote-secondary" onClick={()=>setSection('wallets')}>Solana · SOL</button></TableCell>
        <TableCell translate="no">{solHistoryReady?num(solana.wallets.reduce((sum,w)=>sum+solAmount(solana.data.accounts[w.address].raw),0),9):'—'}</TableCell>
        <TableCell translate="no">{formatPortfolioUsd(solana.data.usd,currencyDisplay)}</TableCell><TableCell translate="no">{formatPortfolioUsd(solAvailable.value,currencyDisplay)}</TableCell>
        <TableCell translate="no">—</TableCell><TableCell translate="no">—</TableCell>
        <TableCell><AssetExclusionToggle compact name="Solana" excluded={solExcluded} onChange={excluded=>excludeAsset('solana:mainnet:native',excluded)}/></TableCell>
      </TableRow>}
      {holdingsGroup==='FTs'&&ethereum.wallets.length>0&&<TableRow>
        <TableCell><button type="button" className="governance-vote-secondary" onClick={()=>setSection('wallets')}>Ethereum · ETH</button></TableCell>
        <TableCell translate="no">{ethereum.wallets.every(w=>ethereum.data.accounts[w.address])?num(ethereum.wallets.reduce((sum,w)=>sum+weiToEth(ethereum.data.accounts[w.address].balanceWei),0)):'—'}</TableCell>
        <TableCell translate="no">{formatPortfolioUsd(ethereum.data.usd,currencyDisplay)}</TableCell>
        <TableCell translate="no">{formatPortfolioUsd(ethValue,currencyDisplay)}</TableCell>
        <TableCell translate="no">{formatPortfolioUsd(ethBasis.average,currencyDisplay)}<div className="small muted">{t(!ethBasis.reconciled?'Waiting for transaction history to reconcile with the wallet balance':ethBasis.usd===null?'Missing receipt prices':'Mining adds ETH with zero purchase cost. Daily prices estimate known purchases.')}</div></TableCell><TableCell translate="no">{formatPortfolioUsd(ethValue!==null&&ethBasis.usd!==null?ethValue-ethBasis.usd:null,currencyDisplay)}</TableCell>
        <TableCell><AssetExclusionToggle compact name="Ethereum" excluded={ethExcluded} onChange={excluded=>excludeAsset('ethereum:1:native',excluded)}/></TableCell>
      </TableRow>}
      {holdingEntries.map(entry=>{
        if('policy' in entry){
          const active=includedAssets(entry.assets,overrides),priced=active.filter(row=>row.value!==null),expanded=expandedPolicies.has(entry.policy);
          const total=holdingTotal(active,snapshot?.complete===true);
          const totals=holdingGroupTotals(active);
          const representative=collectionRepresentative(entry.assets)!,name=representative.name??t('Collection');
          return <TableRow key={`policy:${entry.policy}`} className="portfolio-policy-row">
            <TableCell><TableGroupToggle expanded={expanded} title={name} onToggle={()=>togglePolicy(entry.policy)}><AssetImage compact hideIdentifier id={representative.asset.id} name={name} market={snapshot?.markets[representative.asset.id]}/></TableGroupToggle></TableCell>
            <TableCell><span translate="no">{totals.quantity===null?'—':num(totals.quantity)}</span><div translate="no" className="small muted">{t('{count} assets',{count:entry.assets.length})} · {t('{done} / {total} assets valued',{done:priced.length,total:active.length})}</div></TableCell>
            <TableCell translate="no">{formatPortfolioUsd(totals.price,currencyDisplay)}</TableCell><TableCell translate="no">{formatPortfolioUsd(total,currencyDisplay)}{holdingsCurrency!=='ADA'&&<div className="small muted">{formatPortfolioUsd(total,{...currencyDisplay,currency:'ADA'})}</div>}</TableCell>
            <TableCell translate="no">{formatPortfolioUsd(totals.buyAverage,currencyDisplay)}</TableCell>
            <TableCell translate="no" className={totals.pnl===null?'muted':totals.pnl>=0?'positive':'negative'}>{formatPortfolioUsd(totals.pnl===null?null:Math.abs(totals.pnl),currencyDisplay)}</TableCell>
            <TableCell translate="no">{t('{count} excluded',{count:entry.assets.length-active.length})}</TableCell>
          </TableRow>;
        }
        const r=entry.asset;
        return <TableRow key={`asset:${r.id}`}>
        <TableCell><AssetImage id={r.id} name={r.name} market={snapshot?.markets[r.id]} onOpen={()=>setSelectedAsset(r.id)}/></TableCell>
        <TableCell>{r.qty===null?`${r.raw} raw units`:num(r.qty)}{r.id!=='lovelace'&&r.automaticDecimals==null&&<label className="small muted">Token decimals<Input aria-label={`Token decimals for ${r.name}`} type="number" min="0" max="30" step="1" value={overrides[r.id]?.decimals??''} onChange={e=>updateOverride(r.id,'decimals',e.target.value)} placeholder="Required to calculate value"/></label>}</TableCell>
        <TableCell>{r.price!==null?(r.quote.source==='wayup'||r.quote.source==='fallback'?'≈ ':'')+usd(r.price):'Unavailable'}{r.quote.source!=='wayup'&&<div className="small muted">{r.quote.source==='manual'?'Your price':r.quote.source==='fallback'?'User-defined fallback, not a market quote':r.price!==null?'Market estimate':''}</div>}<details><summary translate="no" className="small">{t('Set current price')} (USD)</summary><Input aria-label={`Current USD price for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.price||''} onChange={e=>updateOverride(r.id,'price',e.target.value)} placeholder="Use market quote"/></details></TableCell>
        <TableCell>{r.value===null?'—':usd(r.value)}</TableCell>
        <TableCell>{r.id==='lovelace'?<><strong>{adaLive?.averageReceiptUsd!=null?(adaLive.provisional?'≈ ':'')+formatPortfolioUsd(adaLive.averageReceiptUsd,currencyDisplay,6):'—'}</strong><div className="small muted">All incoming ADA · weighted receipt-date prices{adaLive?.provisional?' · Partial history':''}</div>{!!adaLive?.missingReceiptAda&&<div className="small muted">Historical prices missing for {num(adaLive.missingReceiptAda)} ADA</div>}{r.cost!==null?<div className="small muted">Remaining cost for gain/loss: {usd(r.cost)}</div>:<div className="small muted">{adaBasisStatus}</div>}</>:<><strong>{r.buyAverage!==null?usd(r.buyAverage):'Unavailable'}</strong><div className="small muted">{parseAmount(overrides[r.id]?.average)!==null?'Your average cost':r.buyAverage!==null?'Known purchases · weighted historical USD cost':r.qty===null?'Token decimals required for per-unit price':'Purchase cost or historical USD price missing'}</div><details><summary translate="no" className="small">{t('Set average buy price')} (USD)</summary><Input className="cost-input" aria-label={`Average buy price in USD for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.average||''} onChange={e=>updateOverride(r.id,'average',e.target.value)} placeholder="Use calculated purchase cost"/></details></>}</TableCell>
        <TableCell className={overrides[r.id]?.excluded||r.pnl===null?'muted':r.pnl>=0?'positive':'negative'}>{r.pnl===null?'—':((r.id==='lovelace'&&provisional)||r.estimatedPurchaseCost?'≈ ':'')+signed(r.pnl)}{r.estimatedPurchaseCost&&<div className="small muted">Known purchase average · estimated cost</div>}{r.pnl===null&&r.value!==null&&<div className="small muted">Purchase cost required for gain / loss</div>}{r.pnl!==null&&r.cost!==null&&r.cost>0&&<div className="small">{num(r.pnl/r.cost*100,2)}%{r.id==='lovelace'&&provisional?' · provisional':''}</div>}</TableCell>
        <TableCell>{r.id!=='lovelace'&&<AssetExclusionToggle compact name={r.name} excluded={overrides[r.id]?.excluded===true} onChange={excluded=>excludeAsset(r.id,excluded)}/>}</TableCell>
      </TableRow>;})}</TableBody></Table>}{!groupRows.length&&!(holdingsGroup==='FTs'&&nativeCount)&&<p className="empty">{busy?'Fetching balances…':'No unspent holdings at the tracked addresses.'}</p>}
      <p className="small muted table-note">Remaining cost uses the same calculation during and after refresh. ADA history must reconcile with the wallet balance; token lots must match the current holding. Missing history or receipt prices are not treated as zero. Values update as new facts and prices arrive, not because refresh finishes. Sends, spends and fees remove proportional ADA cost; internal transfers never reset the average. Daily prices approximate receipt-time prices. This is your receipt-price benchmark, not an exchange execution price or tax calculation. Token costs use FIFO trades, linked mint payments or your entry. Performance excludes realised gains; current holdings already reflect fees.</p>
      </>}
    </section>

    </AssetOverlay>}
    {(section==='transactions'||section==='gain-loss')&&<PortfolioCurrencyContext.Provider value={currencyDisplay}><AssetOverlay id={section==='gain-loss'?'portfolio-gain-loss-overlay':'portfolio-transactions-overlay'} name={section==='gain-loss'?'CEX Transactions':'Transactions'} onClose={()=>setSection(null)}>
    {section==='gain-loss'&&<>
    <div className="portfolio-comparison-controls">
      <label className="small">{t('Crypto')}<select aria-label={t('Comparison cryptocurrency')} value={comparisonCrypto} onChange={event=>setComparisonCrypto(event.target.value as ComparisonCrypto)}><option value="ADA">ADA</option><option value="BTC">BTC</option>{canEthereum&&<option value="ETH">ETH</option>}{canSolana&&<option value="SOL">SOL</option>}</select></label>
    </div>
    <div className="tdsp-chart-overview portfolio-gain-overview">
    <CexTimeline facts={Object.fromEntries(cardanoShown.map(tx=>[tx.tx_hash,classifiedFacts[tx.tx_hash]]))} entries={cexAddresses} history={snapshot?.history||{}} btcHistory={btc.history} ethHistory={ethereum.data.history} solHistory={solana.data.history} fxHistory={fx.history} crypto={comparisonCrypto} currency={comparisonFiat} busy={busy||ethereum.busy||solana.busy} dateFrom={dateFrom} dateTo={dateTo} additional={[...performanceTransfers(ethTransfers).filter(row=>visibleEthIds.has(row.hash)),...solTransfers.filter(row=>visibleSolIds.has(row.hash.split(':')[1]))]}/>
    <section className="portfolio-section tdsp-chart-summary portfolio-gain-summary" aria-label="ADA Gains/Loss breakdown">
      {(!ethHistoryReady||!solHistoryReady||portfolioPartial||availableCex.partial)&&<p translate="no" className="small muted" role="status">{t(partialNote)}</p>}
      {(dateFrom||dateTo||query||filter!=='all')&&<p className="small muted">Gain/loss totals cover all loaded history and current wallet balances. Filters apply to the transfer graph and transaction list below.</p>}
      {ethereum.exchanges.length>0&&!ethereum.wallets.length&&<p translate="no" role="status" className="message">{t('Add your own Ethereum wallet to scan ETH CEX transfers. CEX addresses are counterparties, not your holdings; shared exchange balances are never counted as yours.')} <button type="button" className="governance-vote-secondary" onClick={()=>setSection('wallets')}>{t('Wallets')}</button></p>}
      {nativeCount>0&&<p translate="no" className="small muted">{t('Combined CEX totals use transfer-day prices, not summed coin quantities.')}</p>}
      {snapshot&&<NativeTransferSummary symbol="ADA" totals={adaCexTotals} currency={comparisonFiat} className="portfolio-gain-comparison" proceeds={serviceReceipts.length?{amount:serviceAdaTotals.outgoing,value:serviceAdaTotals.outFiat,details:[...serviceAssets].map(([id,raw])=><div key={id} className="small"><AssetImage id={id} name={snapshot.markets[id]?.name||assetName(id)} market={snapshot.markets[id]} compact/> {units(String(raw),assetDecimals[id])===null?String(raw)+' raw':num(units(String(raw),assetDecimals[id])!,8)}</div>)}:undefined}/>}
      {ethereum.wallets.length>0&&<NativeTransferSummary symbol="ETH" totals={ethCexTotals} currency={comparisonFiat} className="portfolio-eth-comparison" proceeds={ethereum.exchanges.some(w=>w.miner)?{amount:miningTotals.outgoing,value:miningTotals.outFiat}:undefined}/>}
      {solana.wallets.length>0&&<NativeTransferSummary symbol="SOL" totals={solCexTotals} currency={comparisonFiat} className="portfolio-sol-comparison" proceeds={rawSolTransfers.some(row=>row.performance===false)?{amount:solServiceTotals.outgoing,value:solServiceTotals.outFiat}:undefined}/>}
      <div className="portfolio-gain-result">
        <span translate="no" className="governance-card-detail">{t(comparisonResultLabel(comparisonResult.amount,comparisonCrypto),{crypto:comparisonCrypto})}</span>
        <strong className="governance-card-title">{snapshot?<ComparisonAmount amount={comparisonResult.amount} value={comparisonResult.fiat} crypto={comparisonCrypto} currency={comparisonFiat}/>: 'Waiting for wallet balances'}</strong>
      </div>
      {snapshot&&comparisonCrypto==='BTC'&&<p className="small muted" role="status">{btc.status||'BTC equivalents use transfer-day ADA/USD and BTC/USD prices, not actual Bitcoin purchases.'}</p>}
      {(comparisonFiat==='EUR'||comparisonFiat==='JPY')&&<p className="small muted" role="status">{fx.status||'Historical FX rates use the latest available business day; wallet value uses the current rate.'}</p>}
      <p className="small muted">{snapshot?.complete&&!cexPending&&!cexUnresolved?'':'Partial · '}Transfer-day prices plus current wallet value; not exchange execution prices.{cexPending?` ${num(cexPending,0)} transactions need CEX address checks.`:''}{cexUnresolved?` ${num(cexUnresolved,0)} mixed CEX transactions excluded.`:''}{cexDollars.missingPrices?` ${cexDollars.missingPrices} transfers have no historical USD price.`:''}</p>
    </section></div></>}
    <TransactionFilters id={section} options={section==='gain-loss'?{all:'All',in:'ADA IN',out:'ADA OUT',...(ethereum.wallets.length?{'eth-in':'ETH IN','eth-out':'ETH OUT'}:{}),...(solana.wallets.length?{'sol-in':'SOL IN','sol-out':'SOL OUT'}:{})}:undefined} query={query} onQuery={value=>{setQuery(value);setFilter('all');}} filter={filter} onFilter={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDates={(from,to)=>{setDateFrom(from);setDateTo(to);}} pagination={<TransactionPagination position="top" page={currentPage} count={shown.length} onPage={setPage}/>}/>
    <section className="portfolio-section">
      <TransactionTable multiAsset={nativeCount>0}>{shown.slice(currentPage*100,(currentPage+1)*100).map(group=>{
        const compact=group.length===2;
        const children=group.map(row=>row.chain==='solana'?<SolanaTransaction key={row.tx.hash} compact={compact} internalSwap={crossChainSwaps.solana.has(row.tx.hash)} tx={row.tx} wallets={solana.wallets} exchanges={solana.exchanges} history={solana.data.history} adaHistory={snapshot?.history||{}}/>:row.chain==='ethereum'?<EthereumTransaction key={row.tx.id} compact={compact} tx={row.tx} internalSwap={crossChainSwaps.ethereum.has(row.tx.id)} wallets={ethereum.wallets} exchanges={ethereum.exchanges} history={ethereum.data.history} adaHistory={snapshot?.history||{}}/>:section==='gain-loss'?<GainLossTransaction key={row.tx.tx_hash} tx={row.tx} fact={classifiedFacts[row.tx.tx_hash]} wallets={displayWallets} entries={cexAddresses} history={snapshot?.history||{}}/>:<Transaction key={row.tx.tx_hash} compact={compact} tx={row.tx} internalSwap={crossChainSwaps.cardano.has(row.tx.tx_hash)} fact={classifiedFacts[row.tx.tx_hash]} wallets={displayWallets} markets={snapshot?.markets||{}} history={snapshot?.history||{}} cexAddresses={cexAddresses} swapAddresses={swapAddresses}/>);
        return compact?<TransactionPair crossChain={group.some(row=>row.chain!=='cardano')} symbols={group.some(row=>row.chain==='solana')?'ADA / SOL':'ADA / ETH'} key={group[0].chain==='cardano'?group[0].tx.tx_hash:group[0].chain==='ethereum'?group[0].tx.id:group[0].tx.hash}>{children}</TransactionPair>:children;
      })}</TransactionTable>{!shown.length&&<p className="empty">{busy?'Loading transactions…':'No matching transactions.'}</p>}
      <TransactionPagination position="bottom" page={currentPage} count={shown.length} onPage={setPage}/>
      {section==='gain-loss'?<p className="small muted table-note">USD amounts use daily UTC transfer-date prices. The Fee column shows the total on-chain fee; paid-fee totals include only fees attributable to your wallet.</p>:<p className="small muted table-note">Internal transfers require all inputs and outputs to belong to tracked addresses. Their net change is only the fee. Mixed transactions remain separate. Buy/sell labels are inferred from opposing ADA and token changes; multi-step DEX orders may need further reconciliation.</p>}
    </section></AssetOverlay></PortfolioCurrencyContext.Provider>}
    {busy&&<p className="small muted" role="timer">{refreshTiming}</p>}
    </div>
    {selectedAsset&&rows.filter(r=>r.id===selectedAsset).map(r=><AssetOverlay key={r.id} name={r.name} literalTitle onClose={()=>setSelectedAsset(null)}>
      <section className="portfolio-section">
        <AssetImage id={r.id} name={r.name} market={snapshot?.markets[r.id]}/>
        <p className="small muted">{assetWallets[r.id]?.join(' · ')}</p>
        <AssetWalletAddresses addresses={assetAddresses[r.id]||[]}/>
        <p className="address">{r.id}</p>
        {r.id!=='lovelace'&&<><button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>void refreshAssetPurchases(r.id)}>Refresh purchase data</button><p className="small muted" role="status">{status}</p>{error&&<p role="alert" className="small-text error-text">{error}</p>}</>}
        {r.id!=='lovelace'&&<><AssetExclusionToggle name={r.name} excluded={overrides[r.id]?.excluded===true} onChange={excluded=>excludeAsset(r.id,excluded)}/><p className="small muted">Excludes this asset's value, purchase cost and gain/loss from portfolio totals and coverage. Individual details stay visible. Actual ADA movements and network fees remain unchanged. Saved for this portfolio in this browser.</p></>}
        {r.id!=='lovelace'&&<a href={`https://cardanoscan.io/token/${r.id}`} target="_blank" rel="noreferrer">View asset on Cardanoscan <ExternalLink size={14}/></a>}
        <div className="tdsp-tile-grid">
          <Metric label="Balance" value={r.qty===null?`${r.raw} raw units`:num(r.qty)} note=""/>
          <Metric label="Current value" value={r.value===null?'Unavailable':usd(r.value)} note={r.quote.source==='fallback'?'2 ADA fallback estimate':r.quote.source==='wayup'?(r.quote.stale?'Last known Wayup floor · stale estimate':'Wayup collection floor estimate'):r.quote.source==='manual'?'Your price':'Market estimate'}/>
          <Metric label="Remaining purchase cost" value={r.cost===null?'Unknown':usd(r.cost)} note={r.estimatedPurchaseCost?'Estimate from known purchase average; return transfer cost unverified':''}/>
          <Metric label="Assets Gains/Loss" value={r.pnl===null?'Purchase cost required':signed(r.pnl)} tone={overrides[r.id]?.excluded?'muted':r.pnl!==null&&r.pnl<0?'negative':''}/>
        </div>
      </section>
      {r.id!=='lovelace'&&<PaymentLinks id={r.id} facts={Object.values(classifiedFacts)} links={paymentLinks} acquisitions={payments.acquisitions} history={snapshot?.history} onSave={savePaymentLinks} loading={busy}/>}
    </AssetOverlay>)}
  </main></PortfolioCurrencyContext.Provider>;
}

function AssetExclusionToggle({name,excluded,onChange,compact=false}:{name:string;excluded:boolean;onChange:(excluded:boolean)=>void;compact?:boolean}){
  const t=usePortfolioText();
  return <label className="small muted"><input type="checkbox" checked={excluded} aria-label={t('Exclude {name} from Assets Across Wallets',{name})} onChange={event=>onChange(event.target.checked)}/>{!compact&&t('Exclude from Assets Across Wallets')}</label>;
}

function AssetImage({id,name,market,onOpen,compact=false,hideIdentifier=false}:{id:string;name:string;market?:Market;onOpen?:()=>void;compact?:boolean;hideIdentifier?:boolean}){
  const [failed,setFailed]=useState<string[]>([]);
  const source=assetImageCandidates(id,[market?.registry_logo,market?.cached_image,market?.wayup_image,market?.image,market?.image_url,market?.logo]).find(url=>!failed.includes(url));
  const image=source?<img className="portfolio-asset-image" src={source} alt={name} title={name} width={48} height={48} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>:null;
  const content=<>{image}<span className="portfolio-asset-name" title={hideIdentifier?name:id}>{name}</span></>;
  return onOpen?<button type="button" className="governance-vote-secondary portfolio-asset-button" onClick={onOpen} aria-label={`View ${name} details`}>{content}</button>:<div className={compact?'portfolio-token-inline':undefined}>{content}</div>;
}

function Metric({label,value,amount,note,tone='',onOpen,openLabel=label,children}:{label:string;value:string;amount?:{ada:number|null;usd:number|null};note?:string;tone?:string;onOpen?:()=>void;openLabel?:string;children?:React.ReactNode}){
  const t=usePortfolioText();
  const Tag=onOpen?'button':'div';
  return <Tag type={onOpen?'button':undefined} onClick={onOpen} aria-label={onOpen?`Open ${openLabel}`:undefined} className="governance-menu-card"><strong translate="no" className={`governance-card-title ${tone}`}>{amount?<PortfolioCurrencyContext.Provider value={null}><AdaUsdAmount {...amount}/></PortfolioCurrencyContext.Provider>:t(value)}</strong><span className="governance-card-detail" data-i18n-auto-original={label}>{label}</span>{children}{note&&<span className="small muted">{t(note)}</span>}</Tag>;
}
function Transaction({tx,fact,markets,wallets,history,cexAddresses,swapAddresses,internalSwap=false,compact=false}:{tx:Tx;fact?:Fact;markets:Record<string,Market>;wallets:Wallet[];history:Record<string,number>;cexAddresses:CexAddress[];swapAddresses:Set<string>;internalSwap?:boolean;compact?:boolean}){
  const kind=fact?kindOf(fact):null,trade=fact?tradeOf(fact):null;
  const exchangeWallets=transactionExchangeWallets(fact,cexAddresses);
  const cexTrade=fact&&!internalSwap?cexAdaTransfer(fact,cexAddresses):null;
  const quantity=trade?units(trade.raw,markets[trade.id]?.decimals??fact?.decimals?.[trade.id]):null;
  const amount=transactionAmounts(fact?.adaRaw,fact?.time??tx.block_time,history,fact?.feeRaw);
  return <TransactionRow compact={compact} hash={tx.tx_hash} time={tx.block_time} price={amount.price} feeRaw={transactionNetworkFee(fact)}
    amount={<><TransactionAmount ada={amount.ada} usd={amount.usd} tone={cexTrade?(cexTrade.side==='buy'?'negative':'positive'):undefined}/>{compact&&amount.ada!==null&&<div translate="no" className="small muted">{num(Math.abs(amount.ada),6)} ADA</div>}</>}
    kind={compact?(amount.ada!==null&&amount.ada>0?'ADA IN':'ADA OUT'):fact&&isCardanoReward(fact,cexAddresses)?'Mining / services receipt':internalSwap?'Internal cross-chain swap':isSwapTransaction(fact,swapAddresses)?'Swap':cexTrade?(cexTrade.side==='buy'?'ADA IN':'ADA OUT'):kind==='internal'?'Internal transfer · fee only':kind?labels[kind]:'Awaiting analysis'}
    details={fact&&Object.entries(fact.assets).map(([id,raw])=>{const q=units(raw,markets[id]?.decimals??fact.decimals?.[id]);return <div className="small" key={id}>{BigInt(raw)>0n?'+':''}{q===null?raw+' raw':num(q)} <AssetImage id={id} name={markets[id]?.name||markets[id]?.ticker||assetName(id)} market={markets[id]} compact/></div>;})}
    priceDetails={trade&&<div className="small muted">{quantity?num(trade.ada/quantity,10)+' ₳ / token':num(trade.ada)+' ₳ consideration'}</div>}
    wallets={<TransactionWallets labels={transactionWalletNames(fact,wallets)} exchanges={exchangeWallets}/>}
  />;
}
