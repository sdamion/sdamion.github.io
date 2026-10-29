import {combineHoldings} from '@/lib/portfolio';
import type {AddressInfo,Detail,Market,Tx,Wallet} from '@/lib/portfolio';
import {readCache,readRefreshCache,saveCache} from '@/lib/portfolio-cache';
import type {Snapshot} from '@/lib/portfolio-cache';
import {createCardanoRequest} from './cardano-request';
import {mergeMarketQuote} from './current-valuation';
import {hasCounterpartyData,needsActiveFactRefresh,needsFactRefresh} from './fact-refresh';
import {createHistoryIndex} from './history-index';
import {resolveWalletGroups} from './member';
import {refreshMarketBatches} from './market-refresh';
import {runPipeline} from './pipeline';
import {analyseAndCache,planRefresh} from './refresh-plan';
import {resolveSwapGroups} from './swap-wallets';
import {portfolioFetch} from './transport';
import {flushVault} from './vault';
import {lowActivityWalletAddresses,planWalletDiscovery,pruneUnusedWalletAddresses} from './wallet-discovery';

const request=createCardanoRequest(portfolioFetch);
const ADDRESS_INFO_BATCH_SIZE=20;

type AnalysisProgress={started:number;done:number;total:number};
type LiveQuote={usd:number;at:string};

export type CardanoRefreshCallbacks={
  setSnapshot:(snapshot:Snapshot)=>void;
  setStatus:(status:string)=>void;
  setNotice:(notice:string)=>void;
  setCacheNotice:(notice:string)=>void;
  setInitialising:(initialising:boolean)=>void;
  setAnalysis:(progress:AnalysisProgress|null)=>void;
  setCounting:(count:number|null)=>void;
  setCounted:(count:number|null)=>void;
  setTransactionStatus:(status:string)=>void;
  setLiveQuote:(quote:LiveQuote)=>void;
};

export async function historicalPrices(signal:AbortSignal):Promise<{prices?:[number,number][]}|null>{
  for(let attempt=0;attempt<3;attempt++){
    try{const response=await portfolioFetch('/api/historical-prices',{signal,cache:'no-store'});if(response.ok)return await response.json();}catch{signal.throwIfAborted();}
    if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
    signal.throwIfAborted();
  }
  return null;
}

export async function refreshCardanoPortfolio({wallets,key,excludedRefresh,fullScan,signal,isCurrent,callbacks}:{
  wallets:Wallet[];
  key:string;
  excludedRefresh:Set<string>;
  fullScan:boolean;
  signal:AbortSignal;
  isCurrent:()=>boolean;
  callbacks:CardanoRefreshCallbacks;
}):Promise<void>{
  const {setSnapshot,setStatus,setNotice,setCacheNotice,setInitialising,setAnalysis,setCounting,setCounted,setTransactionStatus,setLiveQuote}=callbacks;
  const exclusions=fullScan?new Set<string>():new Set(excludedRefresh);
  async function walletRequest<T>(endpoint:string,body:Record<string,unknown>):Promise<T>{
    signal.throwIfAborted();
    setInitialising(true);
    try{return await request<T>(endpoint,body,signal);}
    finally{if(isCurrent())setInitialising(false);}
  }

  let cached:Snapshot|null=null;
  try{
    const exact=await readCache(key);
    cached=exact||await readRefreshCache(key);
    signal.throwIfAborted();
    if(exact)setSnapshot(exact);
  }catch{
    setCacheNotice('Portfolio cache is locked. Sign in and approve unlock again.');
    throw new Error('Portfolio cache is locked.');
  }
  if(cached&&!fullScan)cached=pruneUnusedWalletAddresses(cached,wallets);
  if(!fullScan)for(const address of lowActivityWalletAddresses(cached))exclusions.add(address);
  const {accounts,pending:stakes}=planWalletDiscovery(wallets,fullScan?null:cached);
  setStatus(stakes.length?'Initialising wallets · finding linked addresses…':'Using saved wallet addresses · checking balances and transactions…');
  for(let index=0;index<stakes.length;index+=40){
    setStatus(`Finding linked addresses · batch ${Math.floor(index/40)+1} of ${Math.ceil(stakes.length/40)}`);
    accounts.push(...await walletRequest<{stake_address:string;addresses:string[]}[]>('account_addresses',{_stake_addresses:stakes.slice(index,index+40),_first_only:false,_empty:true}));
  }
  const groups=resolveWalletGroups(wallets,accounts);
  const swapGroups=resolveSwapGroups(wallets,accounts);
  const plan=planRefresh(cached,groups,exclusions,fullScan);
  const addresses=[...new Set(Object.values(groups).flat())];
  const refreshAddresses=addresses.filter(address=>!exclusions.has(address));
  const addressBatches=Array.from({length:Math.ceil(refreshAddresses.length/ADDRESS_INFO_BATCH_SIZE)},(_,index)=>refreshAddresses.slice(index*ADDRESS_INFO_BATCH_SIZE,(index+1)*ADDRESS_INFO_BATCH_SIZE));
  const infos:AddressInfo[]=(cached?.infos||[]).filter(info=>addresses.includes(info.address)&&exclusions.has(info.address));
  for(const [index,batch] of addressBatches.entries()){
    setStatus(`Checking balances · batch ${index+1} of ${addressBatches.length}`);
    infos.push(...await walletRequest<AddressInfo[]>('address_info',{_addresses:batch}));
  }
  signal.throwIfAborted();
  if(addresses.some(address=>!infos.some(info=>info.address===address)))throw new Error('Some wallet balances were not returned. The combined balance has not been replaced.');

  const holdings=combineHoldings(infos);
  const next:Snapshot={groups,swapGroups,infos,txs:plan.txs,facts:plan.facts,markets:{...cached?.markets},adaUsd:cached?.adaUsd??null,history:cached?.history||{},updated:new Date().toISOString(),priceAt:cached?.priceAt??null,complete:false,pendingOwnershipAddresses:plan.pendingOwnershipAddresses};
  next.excludedRefreshAddresses=[...exclusions];
  next.historyCompleteAddresses=plan.historyCompleteAddresses;
  for(const info of infos)for(const utxo of info.utxo_set||[])for(const asset of utxo.asset_list||[]){
    const id=asset.policy_id+asset.asset_name;
    next.markets[id]={...next.markets[id],token_id:id,decimals:asset.decimals??next.markets[id]?.decimals};
  }
  setSnapshot({...next});
  setInitialising(false);
  setStatus('Balances updated · updating prices…');
  const quote=await portfolioFetch('/api/price',{signal}).then(async response=>response.ok?await response.json() as {cardano?:{usd:number}}:null).catch(()=>null);
  signal.throwIfAborted();
  const freshPrice=quote?.cardano?.usd??null;
  if(freshPrice!==null){next.adaUsd=freshPrice;next.priceAt=new Date().toISOString();setLiveQuote({usd:freshPrice,at:next.priceAt});}
  setSnapshot({...next});
  setStatus('Balances updated · loading historical prices…');
  const history=await historicalPrices(signal);
  signal.throwIfAborted();
  if(history?.prices?.length)next.history={...next.history,...Object.fromEntries(history.prices.filter(([time,price])=>Number.isFinite(time)&&Number.isFinite(price)&&price>0).map(([time,price])=>[new Date(time).toISOString().slice(0,10),price]))};
  const today=new Date().toISOString().slice(0,10);
  if(!next.history[today]&&freshPrice!==null&&freshPrice>0)next.history[today]=freshPrice;
  const warnings:string[]=[];
  if(freshPrice===null)warnings.push('Current ADA/USD price unavailable.');
  if(!history?.prices?.length)warnings.push('Historical ADA/USD refresh failed. Saved prices are retained; missing receipt prices will not be counted as zero.');
  const assetIds=holdings.filter(holding=>holding.id!=='lovelace').map(holding=>holding.id);
  signal.throwIfAborted();
  setSnapshot({...next});
  setNotice([...new Set(warnings)].join(' '));
  const persist=async()=>{try{await saveCache(key,next);}catch{setCacheNotice('Portfolio cache could not be updated. Keep this page open and check Storage settings.');}};
  const historyIndex=createHistoryIndex(next.txs,plan.batches.some(batch=>batch.incremental));
  await persist();
  const seenPages=new Set<string>();
  const owned=new Set(addresses);
  const analysisStarted=Date.now();
  const refreshedHashes=new Set<string>();
  const scheduled=new Set<string>();
  const completedHistory=new Set(plan.historyCompleteAddresses);
  const updateAnalysis=()=>setAnalysis({started:analysisStarted,done:refreshedHashes.size,total:scheduled.size});
  setCounting(historyIndex.size);
  updateAnalysis();
  setTransactionStatus('Checking Transactions');
  await runPipeline<Tx>(async(enqueue,active)=>{
    const activeAddresses=new Set(refreshAddresses);
    const legacy=next.txs.filter(transaction=>needsActiveFactRefresh(next.facts[transaction.tx_hash],activeAddresses));
    for(const transaction of legacy)scheduled.add(transaction.tx_hash);
    enqueue(legacy);
    updateAnalysis();
    for(const historyBatch of plan.batches)for(let offset=0;;offset+=1000){
      const addressBatch=historyBatch.addresses;
      const page=await request<Tx[]>('address_txs',{_addresses:addressBatch},active,`${offset}-${offset+999}`);
      active.throwIfAborted();
      const pageKey=addressBatch.join(',')+':'+page.map(transaction=>transaction.tx_hash).join('|');
      if(page.length===1000&&seenPages.has(pageKey))throw new Error('The indexer repeated a history page. Please refresh to complete the history.');
      seenPages.add(pageKey);
      const pending:Tx[]=[];
      const {reachedSavedHistory}=historyIndex.add(page,historyBatch.incremental);
      for(const transaction of page){
        if(historyBatch.newAddresses&&cached?.facts[transaction.tx_hash]&&!cached.facts[transaction.tx_hash].source&&!scheduled.has(transaction.tx_hash))delete next.facts[transaction.tx_hash];
        const fact=next.facts[transaction.tx_hash];
        if(needsFactRefresh(fact)&&!scheduled.has(transaction.tx_hash)){
          scheduled.add(transaction.tx_hash);
          pending.push(transaction);
        }
      }
      next.txs=historyIndex.rows();
      setCounting(historyIndex.size);
      updateAnalysis();
      setSnapshot({...next,facts:{...next.facts}});
      enqueue(pending);
      if(page.length<1000||reachedSavedHistory){
        addressBatch.forEach(address=>completedHistory.add(address));
        break;
      }
    }
    active.throwIfAborted();
    setCounting(null);
    setCounted(historyIndex.size);
    setTransactionStatus('Analysing Transactions');
  },async(batch,active)=>{
    const details=await request<Detail[]>('tx_info',{_tx_hashes:batch.map(transaction=>transaction.tx_hash),_inputs:true,_assets:true,_metadata:false,_withdrawals:false,_certs:false,_scripts:false,_bytecode:false},active);
    active.throwIfAborted();
    for(const detail of details){
      if(!batch.some(transaction=>transaction.tx_hash===detail.tx_hash))continue;
      next.facts[detail.tx_hash]=analyseAndCache(detail,owned);
      refreshedHashes.add(detail.tx_hash);
    }
    setSnapshot({...next,facts:{...next.facts}});
    updateAnalysis();
    await persist();
    active.throwIfAborted();
  },signal);
  setTransactionStatus('');
  if([...scheduled].every(hash=>refreshedHashes.has(hash))){
    next.historyCompleteAddresses=[...completedHistory];
    next.pendingOwnershipAddresses=next.pendingOwnershipAddresses?.filter(address=>!completedHistory.has(address));
  }
  next.txs=next.txs.filter(transaction=>!next.facts[transaction.tx_hash]||next.facts[transaction.tx_hash].wallets.some(address=>owned.has(address)));
  const historyHashes=new Set(next.txs.map(transaction=>transaction.tx_hash));
  next.facts=Object.fromEntries(Object.entries(next.facts).filter(([hash])=>historyHashes.has(hash)));
  next.complete=next.txs.every(transaction=>hasCounterpartyData(next.facts[transaction.tx_hash]))&&[...scheduled].every(hash=>refreshedHashes.has(hash));
  Object.assign(next,pruneUnusedWalletAddresses(next,wallets));
  await persist();
  signal.throwIfAborted();
  setSnapshot({...next});

  for(const id of new Set(Object.values(next.facts).flatMap(fact=>Object.keys(fact.assets)))){
    if(id!=='lovelace'&&!assetIds.includes(id))assetIds.push(id);
  }
  try{
    const complete=await refreshMarketBatches(assetIds,async batch=>{
      const response=await portfolioFetch('/api/markets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets:batch}),signal});
      if(!response.ok){
        console.warn('Portfolio token data request failed',{status:response.status,assets:batch.length});
        throw Object.assign(new Error('Token data unavailable'),{status:response.status});
      }
      const data=await response.json() as {tokens:Market[];pricing_unavailable?:boolean};
      if(!Array.isArray(data.tokens)||data.tokens.some(token=>!token||!batch.includes(token.token_id)))throw Object.assign(new Error('Invalid token data'),{code:'invalid_token_data'});
      return data;
    },async data=>{
      for(const market of data.tokens)next.markets[market.token_id]=mergeMarketQuote(next.markets[market.token_id],market);
      if(data.pricing_unavailable)warnings.push('Token market prices unavailable; asset images and fallback valuations can still load.');
      await persist();
      signal.throwIfAborted();
      setSnapshot({...next,markets:{...next.markets}});
    },(done,total)=>setStatus(`Transactions saved · updating token prices ${done} / ${total}`),signal);
    if(!complete)warnings.push('Token prices could not be refreshed. Saved data and transaction analysis are retained.');
  }catch{
    signal.throwIfAborted();
    warnings.push('Token prices could not be refreshed. Saved data and transaction analysis are retained.');
  }
  setNotice([...new Set(warnings)].join(' '));
  await flushVault().catch(()=>{});
  signal.throwIfAborted();
  setStatus(next.complete?'':'Some transactions are awaiting analysis. Refresh to retry.');
}
