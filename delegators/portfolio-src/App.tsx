"use client";

import {useEffect,useMemo,useRef,useState} from 'react';
import {ExternalLink,RefreshCw,Plus,Trash2,ArrowRightLeft} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Pagination,PaginationContent,PaginationItem} from '@/components/ui/pagination';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {analyse,assetName,combineHoldings,kindOf,remainingBasis,liveAdaBasis,short,tradeOf,units,validAddress} from '@/lib/portfolio';
import type {AddressInfo,Detail,Fact,Market,Tx,Wallet} from '@/lib/portfolio';
import {readCache,saveCache} from '@/lib/portfolio-cache';
import type {Snapshot} from '@/lib/portfolio-cache';

import {portfolioFetch} from './transport';
import {runPipeline} from './pipeline';
import {createHistoryIndex} from './history-index';
import {keepRefreshSessionAlive} from './refresh-session';
import {currentValuation} from './current-valuation';
import {valuationCoverage} from './valuation-coverage';
import {includedAssets} from './asset-exclusions';
import {averageBuy} from './average-buy';
import {assetImageCandidates} from './asset-image';
import {knownDecimals,tokenDecimals,holdingValue} from './valuation';
import {mintPayments,paymentBudget} from './mint-payments';
import type {PaymentLink} from './mint-payments';
import {PaymentLinks} from './PaymentLinks';
import {AssetOverlay} from './AssetOverlay';
import {MenuTile,AdaUsdAmount} from './ui';
import {matchesTransaction} from './transaction-search';
import {unrealisedStatus} from './metric-status';
import {CexAddresses} from './CexAddresses';
import {normalizeCexAddresses,cexDestinations,cexSources,cexAdjustedFact,isCexTransaction,cexAdaTransfer,cexAdaNetPosition,cexUsdNetPosition} from './cex';
import type {CexAddress} from './cex';
import {durationLabel,remainingSeconds,analysisProgress} from './progress';
import {memberWallets,resolveWalletGroups,validWalletAddress,validStakeAddress,sameTrackedAddresses,walletTransactionCount} from './member';
const num=(n:number,max=6)=>n.toLocaleString('en-US',{maximumFractionDigits:max});
const usd=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Math.abs(n)>0&&Math.abs(n)<0.01?8:2});
const signed=(n:number)=>usd(Math.abs(n));
const labels:Record<string,string>={all:'All',cex:'CEX',trade:'Trades',send:'Sends',receive:'Receives',internal:'Internal',mixed:'Mixed',other:'Other'};
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

async function request<T>(path:string,body:object,signal:AbortSignal,range?:string):Promise<T>{
  for(let attempt=0;attempt<3;attempt++){
    const r=await portfolioFetch('/api/cardano',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,body,range}),signal});
    if(r.ok)return r.json() as Promise<T>;
    if(![429,502,503,504].includes(r.status)||attempt===2)throw new Error(`Cardano indexer returned ${r.status}. Your last saved data is still available.`);
    await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));signal.throwIfAborted();
  }throw new Error('Indexer unavailable');
}

export default function Home({memberStake}:{memberStake:string}){
  const SETTINGS='tdsp-member-wallets-v1:'+memberStake;
  const CEX_SETTINGS='tdsp-member-cex-v1:'+memberStake;
  const [cexAddresses,setCexAddresses]=useState<CexAddress[]>(()=>{try{return normalizeCexAddresses(JSON.parse(localStorage.getItem(CEX_SETTINGS)||'[]'));}catch{return [];}});
  const [wallets,setWallets]=useState<Wallet[]>(()=>memberWallets(memberStake,[])),[ready,setReady]=useState(false);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('Starting…');
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[cacheNotice,setCacheNotice]=useState('');
  const [address,setAddress]=useState(''),[name,setName]=useState(''),[walletError,setWalletError]=useState('');
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[overrides,setOverrides]=useState<Overrides>({});
  const [paymentLinks,setPaymentLinks]=useState<PaymentLink[]>([]);
  const [missingCostsOnly,setMissingCostsOnly]=useState(false);
  const [selectedAsset,setSelectedAsset]=useState<string|null>(null);
  const [section,setSection]=useState<'wallets'|'exchanges'|'holdings'|'transactions'|null>(null);
  const [page,setPage]=useState(0);
  const [liveQuote,setLiveQuote]=useState<{usd:number;at:string}|null>(null);
  const controller=useRef<AbortController|null>(null);
  const [refreshStarted,setRefreshStarted]=useState(0),[clock,setClock]=useState(0);
  const [analysis,setAnalysis]=useState<{started:number;done:number;total:number}|null>(null);
  const [counting,setCounting]=useState<number|null>(null);
  const [counted,setCounted]=useState<number|null>(null);
  const key=memberStake+'::'+wallets.map(w=>w.address).sort().join('|');
  const overrideKey='tdsp-member-basis:'+key;
  const paymentKey='tdsp-member-payments:'+key;

  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(SETTINGS)||'null');setWallets(memberWallets(memberStake,saved));}catch{setCacheNotice('Browser storage is unavailable; wallet settings may not persist.');}setReady(true);return()=>controller.current?.abort();},[]);
  useEffect(()=>{if(!ready)return;setSnapshot(null);setError('');try{setOverrides(JSON.parse(localStorage.getItem(overrideKey)||'{}'));}catch{setOverrides({});}try{const links=JSON.parse(localStorage.getItem(paymentKey)||'[]');setPaymentLinks(Array.isArray(links)?links.filter(l=>l&&['assetId','receiptHash','paymentHash','lovelace'].every(k=>typeof l[k]==='string')):[]);}catch{setPaymentLinks([]);}void refresh();return()=>controller.current?.abort();/* wallet scope determines the cached portfolio */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,key]);
  useEffect(()=>setPage(0),[filter,query,key]);
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

  async function refresh(){
    controller.current?.abort();const control=new AbortController();controller.current=control;const signal=control.signal;
    const started=Date.now();setRefreshStarted(started);setClock(started);setAnalysis(null);setCounting(null);setCounted(null);
    setBusy(true);setError('');setNotice('');setStatus('Initialising wallets · loading saved data…');
    try{
      let cached:Snapshot|null=null;try{cached=await readCache(key);}catch{setCacheNotice('Local cache unavailable. Live data will still load.');}
      signal.throwIfAborted();if(cached)setSnapshot(cached);
      setStatus('Initialising wallets · finding linked addresses…');
      const stakes=wallets.map(w=>w.address).filter(validStakeAddress);
      const accounts:{stake_address:string;addresses:string[]}[]=[];
      for(let i=0;i<stakes.length;i+=40)accounts.push(...await request<{stake_address:string;addresses:string[]}[]>('account_addresses',{_stake_addresses:stakes.slice(i,i+40),_first_only:false,_empty:true},signal));
      const groups=resolveWalletGroups(wallets,accounts);
      const sameAddresses=sameTrackedAddresses(cached?.groups,groups);
      const reusableFacts=sameAddresses?cached?.facts||{}:{};
      const addresses=[...new Set(Object.values(groups).flat())];
      const addressBatches=Array.from({length:Math.ceil(addresses.length/40)},(_,i)=>addresses.slice(i*40,(i+1)*40));
      const loadInfos=async()=>{const all:AddressInfo[]=[];for(const [index,batch] of addressBatches.entries()){
        setStatus(`Initialising wallets · loading balances ${index+1} / ${addressBatches.length}`);
        all.push(...await request<AddressInfo[]>('address_info',{_addresses:batch},signal));
      }return all;};
      const infos=await loadInfos();signal.throwIfAborted();
      if(addresses.some(a=>!infos.some(i=>i.address===a)))throw new Error('Some wallet balances were not returned. The combined balance has not been replaced.');
      const holdings=combineHoldings(infos);
      const next:Snapshot={groups,infos,txs:sameAddresses?cached?.txs||[]:[],facts:reusableFacts,markets:{...(sameAddresses?cached?.markets:{})},adaUsd:cached?.adaUsd??null,history:cached?.history||{},updated:new Date().toISOString(),priceAt:cached?.priceAt??null,complete:false};
      for(const info of infos)for(const u of info.utxo_set||[])for(const a of u.asset_list||[]){const id=a.policy_id+a.asset_name;next.markets[id]={...next.markets[id],token_id:id,decimals:a.decimals??next.markets[id]?.decimals};}
      setSnapshot({...next});
      setStatus('Balances updated · updating prices…');
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
      for(let i=0;i<assetIds.length;i+=50){
        setStatus(`Balances updated · loading token prices ${Math.floor(i/50)+1} / ${Math.ceil(assetIds.length/50)}`);
        const r=await portfolioFetch('/api/markets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets:assetIds.slice(i,i+50)}),signal});
        if(!r.ok){warnings.push('Some token prices are unavailable. Unpriced assets are excluded from the subtotal.');break;}
        const data=await r.json() as {tokens:Market[];pricing_unavailable?:boolean};for(const m of data.tokens)next.markets[m.token_id]={...m,decimals:m.decimals??next.markets[m.token_id]?.decimals};
        if(data.pricing_unavailable)warnings.push('Token market prices unavailable; asset images and fallback valuations can still load.');
      }
      signal.throwIfAborted();setSnapshot({...next});setNotice(warnings.join(' '));
      const persist=async()=>{try{await saveCache(key,next);}catch{setCacheNotice('The browser could not save the cache. Keep this page open or retry later.');}};
      const incremental=sameAddresses&&cached?.complete===true&&next.txs.every(tx=>Array.isArray(next.facts[tx.tx_hash]?.externalInputs));
      const historyIndex=createHistoryIndex(next.txs,incremental);
      await persist();const seenPages=new Set<string>();
      const owned=new Set(addresses);
      const analysisStarted=Date.now();
      const refreshedHashes=new Set<string>();
      const scheduled=new Set<string>();
      const recent=new Map<string,Tx>();
      const updateAnalysis=()=>setAnalysis({started:analysisStarted,done:refreshedHashes.size,total:scheduled.size});
      setCounting(historyIndex.size);updateAnalysis();
      setStatus(incremental?'Checking for new transactions…':'Loading remaining transaction history…');
      await runPipeline<Tx>(async(enqueue,active)=>{
        // Upgrade receipts and outgoing payments once to retain their UTxO links.
        const legacy=next.txs.filter(tx=>{const f=next.facts[tx.tx_hash];return f&&((f.marketplaceVersion!==3&&Object.values(f.assets).some(raw=>BigInt(raw)>0n))||(f.inputRefs===undefined&&paymentBudget(f)!==null));});
        for(const tx of legacy)scheduled.add(tx.tx_hash);
        enqueue(legacy);updateAnalysis();
        for(const addressBatch of addressBatches)for(let offset=0;;offset+=1000){
          const page=await request<Tx[]>('address_txs',{_addresses:addressBatch},active,`${offset}-${offset+999}`);
          active.throwIfAborted();
          const pageKey=addressBatch.join(',')+':'+page.map(t=>t.tx_hash).join('|');
          if(page.length===1000&&seenPages.has(pageKey))throw new Error('The indexer repeated a history page. Please refresh to complete the history.');
          seenPages.add(pageKey);
          const pending:Tx[]=[];
          const {discovered,reachedSavedHistory}=historyIndex.add(page);
          for(const tx of discovered){
            recent.set(tx.tx_hash,tx);
            const fact=next.facts[tx.tx_hash];
            if((!fact||!Array.isArray(fact.externalInputs))&&!scheduled.has(tx.tx_hash)){scheduled.add(tx.tx_hash);pending.push(tx);}
          }
          // Refresh the newest 20 discovered transactions even when already cached.
          const newest=[...recent.values()].sort((a,b)=>b.block_time-a.block_time||a.tx_hash.localeCompare(b.tx_hash)).slice(0,20);
          recent.clear();for(const tx of newest){recent.set(tx.tx_hash,tx);if(!scheduled.has(tx.tx_hash)){scheduled.add(tx.tx_hash);pending.push(tx);}}
          next.txs=historyIndex.rows();
          setCounting(historyIndex.size);updateAnalysis();setSnapshot({...next,facts:{...next.facts}});
          enqueue(pending);
          if(page.length<1000||reachedSavedHistory)break;
        }
        active.throwIfAborted();setCounting(null);setCounted(historyIndex.size);
        setStatus(`Transaction check complete · ${num(historyIndex.size,0)} unique transactions · finishing analysis…`);
      },async(batch,active)=>{
        const details=await request<Detail[]>('tx_info',{_tx_hashes:batch.map(t=>t.tx_hash),_inputs:true,_assets:true,_metadata:false,_withdrawals:false,_certs:false,_scripts:false,_bytecode:false},active);
        active.throwIfAborted();
        for(const d of details){
          if(!batch.some(tx=>tx.tx_hash===d.tx_hash))continue;
          next.facts[d.tx_hash]=analyse(d,owned);refreshedHashes.add(d.tx_hash);
        }
        setSnapshot({...next,facts:{...next.facts}});updateAnalysis();
        await persist();active.throwIfAborted();
      },signal);
      const historyHashes=new Set(next.txs.map(tx=>tx.tx_hash));
      next.facts=Object.fromEntries(Object.entries(next.facts).filter(([hash])=>historyHashes.has(hash)));
      next.complete=next.txs.every(t=>!!next.facts[t.tx_hash])&&[...scheduled].every(hash=>refreshedHashes.has(hash));await persist();signal.throwIfAborted();setSnapshot({...next});
      setStatus(next.complete?`Updated ${new Date(next.updated).toLocaleString()}`:'Some transactions are awaiting analysis. Refresh to retry.');
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Could not update this portfolio.');setStatus('Refresh incomplete · showing available data');}}
    finally{if(!signal.aborted){setClock(Date.now());setBusy(false);setCounting(null);}}
  }

  function saveWallets(next:Wallet[]){
    next=memberWallets(memberStake,next);controller.current?.abort();
    setBusy(true);setAnalysis(null);setCounting(null);setCounted(null);setStatus('Initialising wallets…');
    const started=Date.now();setRefreshStarted(started);setClock(started);
    try{localStorage.setItem(SETTINGS,JSON.stringify(next));}catch{setCacheNotice('Wallet settings could not be saved in this browser.');}
    setWallets(next);
  }
  function saveCexAddresses(entries:CexAddress[]){
    try{localStorage.setItem(CEX_SETTINGS,JSON.stringify(entries));setCexAddresses(entries);return true;}
    catch{setCacheNotice('CEX addresses could not be saved in this browser.');return false;}
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
  async function refreshAssetPurchases(id:string){
    if(busy||!snapshot)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;
    const {signal}=control;
    setBusy(true);setError('');setStatus('Refreshing asset purchase data…');
    try{
      const hashes=Object.values(snapshot.facts).filter(f=>BigInt(f.assets[id]||'0')>0n).map(f=>f.hash);
      if(!hashes.length)throw new Error('No receipt is loaded for this asset. Refresh the wallet history first.');
      const owned=new Set(Object.values(snapshot.groups||{}).flat());
      if(!owned.size)throw new Error('Wallet addresses are unavailable. Refresh the wallet history first.');
      const next={...snapshot,facts:{...snapshot.facts},history:{...snapshot.history}};
      for(let i=0;i<hashes.length;i+=20){
        const batch=hashes.slice(i,i+20);
        const details=await request<Detail[]>('tx_info',{_tx_hashes:batch,_inputs:true,_assets:true,_metadata:false,_scripts:false,_bytecode:false},signal);
        signal.throwIfAborted();
        if(batch.some(hash=>!details.some(d=>d.tx_hash===hash)))throw new Error('Some purchase transactions were not returned. Saved data is retained.');
        for(const d of details)if(batch.includes(d.tx_hash)){
          if(d.marketplace_version!==3)throw new Error('Purchase decoding is unavailable or the backend needs an update. Saved data is retained; retry after updating koios-proxy.');
          next.facts[d.tx_hash]=analyse(d,owned);
        }
      }
      const hist=await historicalPrices(signal);signal.throwIfAborted();
      for(const [time,price] of hist?.prices||[])if(Number.isFinite(time)&&Number.isFinite(price)&&price>0)next.history[new Date(time).toISOString().slice(0,10)]=price;
      await saveCache(key,next);signal.throwIfAborted();setSnapshot(next);
      const result=mintPayments(Object.values(next.facts).map(f=>cexAdjustedFact(f,cexAddresses)),paymentLinks);
      const costs=Object.values(result.acquisitions).flatMap(a=>a[id]?[a[id]]:[]);
      setStatus(!costs.length?'Purchase data refreshed; no verified purchase allocation found. Check saved payment links.':costs.some(a=>!next.history[new Date(a.time*1000).toISOString().slice(0,10)])?'Purchase cost loaded in ADA; historical USD price is still unavailable.':'Asset purchase costs and historical prices refreshed.');
    }catch(e){if(!signal.aborted)setError(e instanceof Error?e.message:'Could not refresh asset purchase data.');}
    finally{if(controller.current===control)setBusy(false);}
  }
  const holdings=useMemo(()=>snapshot?combineHoldings(snapshot.infos):[],[snapshot]);
  const classifiedFacts=useMemo(()=>Object.fromEntries(Object.entries(snapshot?.facts||{}).map(([hash,fact])=>[hash,cexAdjustedFact(fact,cexAddresses)])),[snapshot,cexAddresses]);
  const assetDecimals=useMemo(()=>knownDecimals(snapshot?.infos||[],Object.values(classifiedFacts)),[snapshot,classifiedFacts]);
  const payments=useMemo(()=>mintPayments(Object.values(classifiedFacts),paymentLinks),[classifiedFacts,paymentLinks]);
  const cexPosition=useMemo(()=>cexAdaNetPosition(Object.values(classifiedFacts),cexAddresses,holdings.find(h=>h.id==='lovelace')?.raw||'0'),[classifiedFacts,cexAddresses,holdings]);
  const cexDollars=useMemo(()=>cexUsdNetPosition(Object.values(classifiedFacts),cexAddresses,holdings.find(h=>h.id==='lovelace')?.raw||'0',snapshot?.history||{},liveQuote?.usd??snapshot?.adaUsd??null),[classifiedFacts,cexAddresses,holdings,snapshot,liveQuote]);
  const basis=useMemo(()=>snapshot?remainingBasis(Object.values(classifiedFacts),snapshot.history,payments.acquisitions):{},[snapshot,classifiedFacts,payments]);
  const adaLive=useMemo(()=>snapshot?liveAdaBasis(Object.values(classifiedFacts),snapshot.history,holdings.find(h=>h.id==='lovelace')?.raw||'0',snapshot.complete):null,[snapshot,holdings,classifiedFacts]);
  const rows=holdings.map(h=>{
    const m=snapshot?.markets[h.id],automaticDecimals=tokenDecimals(m?.decimals)??assetDecimals[h.id];
    const decimals=h.id==='lovelace'?6:tokenDecimals(parseAmount(overrides[h.id]?.decimals))??automaticDecimals;
    const manualPrice=parseAmount(overrides[h.id]?.price);
    const quote=currentValuation(h.id,units(h.raw,decimals),manualPrice,m,liveQuote?.usd??snapshot?.adaUsd??null);
    const price=quote.price;
    const avg=h.id==='lovelace'?null:parseAmount(overrides[h.id]?.average);const automatic=h.id==='lovelace'?adaLive:basis[h.id];
    const {qty,cost}=holdingValue(h.raw,decimals,price,avg,automatic);
    const value=quote.value,pnl=value!==null&&cost!==null?value-cost:null;
    return {...h,name:m?.ticker||assetName(h.id),qty,price,value,cost,pnl,manualPrice,quote,automaticDecimals,automatic:avg===null&&cost!==null};
  }).sort((a,b)=>a.id==='lovelace'?-1:b.id==='lovelace'?1:(b.value??-1)-(a.value??-1));
  const included=includedAssets(rows,overrides),excludedCount=rows.length-included.length;
  const valued=included.filter(r=>r.value!==null),covered=included.filter(r=>r.pnl!==null);
  const coverage=valuationCoverage(included);
  const subtotal=valued.reduce((s,r)=>s+(r.value||0),0),gain=covered.reduce((s,r)=>s+(r.pnl||0),0),costTotal=covered.reduce((s,r)=>s+(r.cost||0),0);
  const ada=Number(holdings.find(h=>h.id==='lovelace')?.raw||0)/1e6;
  const adaRow=rows.find(r=>r.id==='lovelace');
  const provisional=!snapshot?.complete&&covered.length>0;
  const estimatedGains=covered.some(r=>r.quote.source==='wayup'||r.quote.source==='fallback');
  const adaBasisStatus=!adaLive?.reconciled?snapshot?.complete?'History / balance mismatch — refresh to reconcile':'Waiting for transaction history to reconcile with the wallet balance':adaLive.usd===null?'Missing receipt prices':snapshot?.complete?'Remaining cost · receipt-date prices':'Remaining cost · refresh in progress';
  const displayWallets=wallets.flatMap(w=>(snapshot?.groups?.[w.address]||[w.address]).map(address=>({...w,address})));
  const fees=Object.values(snapshot?.facts||{}).reduce((s,f)=>s+Number(f.feeRaw||0)/1e6,0);
  const loadedFacts=Object.keys(classifiedFacts).length;
  const hasHistoricalPrices=Object.values(snapshot?.history||{}).some(price=>Number.isFinite(price)&&price>0);
  const gainStatus=unrealisedStatus(loadedFacts,adaLive?.receiptCount||0,hasHistoricalPrices,adaRow?.price!=null,snapshot?.complete===true,adaLive?.reconciled===true);
  const transactionTotal=snapshot?.txs.length||0;
  const analysedTotal=snapshot?.txs.filter(tx=>!!snapshot.facts[tx.tx_hash]).length||0;
  const progress=analysisProgress(busy,analysis,analysedTotal,transactionTotal);
  const eta=analysis&&counted!==null?remainingSeconds(analysis.started,clock,analysis.done,analysis.total):null;
  const refreshTiming=refreshStarted?`${busy?'Elapsed':'Refresh duration'}: ${durationLabel((clock-refreshStarted)/1000)}${busy?(eta!==null?` · Estimated analysis remaining: ${durationLabel(eta)}`:' · Estimating remaining time…'):''}`:'';
  const shown=(snapshot?.txs||[]).filter(t=>{const f=classifiedFacts[t.tx_hash];return (filter==='all'||(filter==='cex'?isCexTransaction(f,cexAddresses):f&&kindOf(f)===filter))&&matchesTransaction(query,t.tx_hash,f,snapshot?.markets||{},displayWallets);});

  return <main className="member-portfolio"><div className="section-heading" aria-label="Portfolio refresh">
    <button onClick={()=>void refresh()} disabled={busy||!ready} className="governance-vote-secondary"><RefreshCw size={16} className={busy?'animate-spin':''}/> Refresh</button>
    <div className="portfolio-section">
      <p role="status" className="status-line">{status}</p>
      {busy&&<p className="small muted" role="timer">{refreshTiming}</p>}
      {counting!==null&&<div><p className="small muted" role="status">{num(counting,0)} unique transactions · checking for additional history</p><progress aria-label="Checking for additional transactions"/></div>}
      {busy&&snapshot&&<div><p className="small muted" role="status">{counting!==null?`${num(progress.done,0)} transactions analysed · counting continues`:!analysis?'Preparing refresh':`${num(progress.done,0)} / ${num(progress.total,0)} transactions analysed · ${num(progress.percent,1)}%`}</p><progress aria-label="Transactions analysed" aria-valuetext={counting!==null?`${progress.done} transactions analysed; counting continues`:`${progress.done} of ${progress.total} transactions analysed`} max={Math.max(1,progress.total)} value={counting!==null?undefined:progress.done}/></div>}
      {error&&<p role="alert" className="message error">{error}</p>}{notice&&<p className="message">{notice}</p>}{cacheNotice&&<p role="status" className="message">{cacheNotice}</p>}
    </div>
  </div>
    <div className="portfolio-body">
    <section className="portfolio-section"><div className="tdsp-tile-grid">
      <Metric label="ADA across wallets" value="—" amount={snapshot?{ada,usd:valued.length?subtotal:null}:undefined} note={`${valued.length} / ${included.length} assets valued${excludedCount?` · ${excludedCount} excluded`:''}`}/>
      <Metric label={coverage.partial?'Unrealised gain / loss · partial estimate':provisional||estimatedGains?'Unrealised gain / loss · estimate':'Unrealised gain / loss'} value={covered.length?(provisional||estimatedGains||coverage.partial?'≈ ':'')+signed(gain):gainStatus} note={`${coverage.covered} / ${coverage.total} costs matched${costTotal>0?' · '+num(gain/costTotal*100,2)+'%':''}${estimatedGains?' · Estimated values':''}`} tone={covered.length?gain>=0?'positive':'negative':''}/>
      <Metric label="Network fees paid" value={loadedFacts||snapshot?.complete?num(fees)+' ₳':'Waiting for transaction details'} note={`${snapshot?.complete?'':'Loaded history only · '}Shared-input fees excluded`}/>
      {cexAddresses.length>0&&<Metric label="ADA gain / loss · CEX + wallets" value="Waiting for wallet balances" amount={snapshot?{ada:Number(cexPosition.netRaw)/1e6,usd:cexDollars.usd}:undefined} note={`${snapshot?.complete?'':'Partial · '}Net flow, not trading profit${cexDollars.missingPrices?` · ${cexDollars.missingPrices} unpriced transfers`:''}`}/>}
    </div></section>
    <div className="tdsp-tile-grid">
      <MenuTile title="Wallet addresses" value={num(wallets.length,0)} onOpen={()=>setSection('wallets')}/>
      <MenuTile title="DEX / CEX addresses" value={num(cexAddresses.length,0)} onOpen={()=>setSection('exchanges')}/>
      <MenuTile title="Current holdings & performance" value={num(rows.length,0)} onOpen={()=>setSection('holdings')}/>
      <MenuTile title="Transactions" value={num(transactionTotal,0)} onOpen={()=>setSection('transactions')}/>
    </div>
    {section==='exchanges'&&<AssetOverlay id="portfolio-exchanges-overlay" name="DEX / CEX addresses" onClose={()=>setSection(null)}>
    <CexAddresses entries={cexAddresses} owned={Object.values(snapshot?.groups||{}).flat().concat(wallets.map(wallet=>wallet.address))} onChange={saveCexAddresses}/>
    <details><summary>Calculation details</summary><p className="small muted">Sent to CEX ₳ {num(Number(cexPosition.sentRaw)/1e6)} + In wallets ₳ {num(ada)} − Received from CEX ₳ {num(Number(cexPosition.receivedRaw)/1e6)}. USD uses transfer-day prices plus current wallet value, not exchange execution prices.</p></details>
    {cexAddresses.length>0&&Object.values(snapshot?.facts||{}).some(fact=>!Array.isArray(fact.externalInputs))&&<p className="small muted">Refresh to load sender and recipient stake addresses for older cached transactions.</p>}

    </AssetOverlay>}
    {section==='wallets'&&<AssetOverlay id="portfolio-wallets-overlay" name="Wallet addresses" onClose={()=>setSection(null)}>
    <section className="portfolio-section"><p className="small muted">Your member stake address includes its linked payment addresses. Add only wallets you own.</p>
      {busy&&!analysis&&counting===null&&<div role="status"><p className="small muted">Initialising wallets before counting transactions…</p><progress aria-label="Initialising wallets"/></div>}
      <div className="tdsp-tile-grid">{wallets.map((w,i)=><WalletCard key={w.address} wallet={w} primary={i===0} snapshot={snapshot} remove={()=>saveWallets(wallets.filter(x=>x.address!==w.address))}/>)}</div>
      <form onSubmit={addWallet} className="wallet-form governance-drep-registration-form"><label>Wallet name<Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Savings" maxLength={60}/></label><label className="address-field">Stake or payment address<Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="stake1… or addr1…" aria-describedby="wallet-error" required/></label><button className="governance-vote-primary" type="submit"><Plus size={16}/>Add wallet</button></form><p id="wallet-error" role="status" className="negative">{walletError}</p>
      <p className="small muted">Wallets, prices you enter, and cached history are saved in this browser. Adding or removing a wallet recalculates the entire portfolio; average costs are saved separately for each wallet combination.</p>
    </section>

    </AssetOverlay>}
    {section==='holdings'&&<AssetOverlay id="portfolio-holdings-overlay" name="Current holdings & performance" onClose={()=>setSection(null)}>
    <section className="portfolio-section">
      <label className="small"><input type="checkbox" checked={missingCostsOnly} onChange={e=>setMissingCostsOnly(e.target.checked)}/> Show holdings with missing purchase cost ({coverage.missingCost})</label>
      {payments.errors.length>0&&<p role="status" className="negative">Some saved payment links cannot be applied to the loaded history. Open the asset image to review its purchase payments.</p>}
      <Table><TableHeader><TableRow>{['Asset','Balance','Current price · USD','Current value','Average buy · USD / unit','Unrealised gain / loss'].map(t=><TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.filter(r=>!missingCostsOnly||(r.cost===null&&(r.id==='lovelace'||overrides[r.id]?.excluded!==true))).map(r=><TableRow key={r.id}>
        <TableCell><AssetImage id={r.id} name={r.name} market={snapshot?.markets[r.id]} onOpen={()=>setSelectedAsset(r.id)}/>{overrides[r.id]?.excluded&&r.id!=='lovelace'&&<div className="small muted">Excluded from calculations</div>}</TableCell>
        <TableCell>{r.qty===null?`${r.raw} raw units`:num(r.qty)}{r.id!=='lovelace'&&r.automaticDecimals==null&&<label className="small muted">Token decimals<Input aria-label={`Token decimals for ${r.name}`} type="number" min="0" max="30" step="1" value={overrides[r.id]?.decimals??''} onChange={e=>updateOverride(r.id,'decimals',e.target.value)} placeholder="Required to calculate value"/></label>}</TableCell>
        <TableCell>{r.quote.source==='fallback'?'2 ADA per asset row':r.price!==null?(r.quote.source==='wayup'?'≈ ':'')+usd(r.price):'Unavailable'}<div className="small muted">{r.quote.source==='manual'?'Your price':r.quote.source==='wayup'?<a href={`https://www.wayup.io/collection/${r.id.slice(0,56)}`} target="_blank" rel="noreferrer">Wayup collection floor · {num(r.quote.ada!)} ADA · estimate, not a sale guarantee</a>:r.quote.source==='fallback'?'User-defined fallback, not a market quote':r.price!==null?'Market estimate':''}</div><details><summary className="small">Set current price</summary><Input aria-label={`Current USD price for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.price||''} onChange={e=>updateOverride(r.id,'price',e.target.value)} placeholder="Use market quote"/></details></TableCell>
        <TableCell>{r.value===null?'—':usd(r.value)}</TableCell>
        <TableCell>{r.id==='lovelace'?<><strong className={r.cost===null||!r.qty||r.cost<0?'negative':''}>{r.cost!==null&&r.qty?(adaLive?.provisional?'≈ $':'$')+num(r.cost/r.qty,6):'—'}</strong><div className="small muted">{adaBasisStatus}</div>{r.cost!==null&&<div className="small muted">{'Remaining cost'}: {usd(r.cost)}</div>}</>:<><strong>{averageBuy(r.cost,r.qty)!==null?usd(averageBuy(r.cost,r.qty)!):'Unavailable'}</strong><div className="small muted">{r.cost!==null&&r.qty===null?'Token decimals required for per-unit price':r.automatic?'Estimated FIFO · trades / linked payments':parseAmount(overrides[r.id]?.average)!==null?'Your average cost':'Purchase cost or historical USD price missing'}</div><details><summary className="small">Set average buy price</summary><Input className="cost-input" aria-label={`Average buy price in USD for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.average||''} onChange={e=>updateOverride(r.id,'average',e.target.value)} placeholder="Use calculated purchase cost"/></details></>}</TableCell>
        <TableCell className={r.pnl===null?'muted':r.pnl>=0?'positive':'negative'}>{r.pnl===null?'—':(r.id==='lovelace'&&provisional?'≈ ':'')+signed(r.pnl)}{r.pnl===null&&r.value!==null&&<div className="small muted">Purchase cost required for gain / loss</div>}{r.pnl!==null&&r.cost!==null&&r.cost>0&&<div className="small">{num(r.pnl/r.cost*100,2)}%{r.id==='lovelace'&&provisional?' · provisional':''}</div>}</TableCell>
      </TableRow>)}</TableBody></Table>{!rows.length&&<p className="empty">{busy?'Fetching balances…':'No unspent holdings at the tracked addresses.'}</p>}
      <p className="small muted table-note">Remaining cost uses the same calculation during and after refresh. ADA history must reconcile with the wallet balance; token lots must match the current holding. Missing history or receipt prices are not treated as zero. Values update as new facts and prices arrive, not because refresh finishes. Sends, spends and fees remove proportional ADA cost; internal transfers never reset the average. Daily prices approximate receipt-time prices. This is your receipt-price benchmark, not an exchange execution price or tax calculation. Token costs use FIFO trades, linked mint payments or your entry. Performance excludes realised gains; current holdings already reflect fees.</p>
    </section>

    </AssetOverlay>}
    {section==='transactions'&&<AssetOverlay id="portfolio-transactions-overlay" name="Transactions" onClose={()=>setSection(null)}>
    <section className="portfolio-section"><div className="section-heading"><Input aria-label="Search asset names, transaction hashes or wallet names" placeholder="Asset name, transaction hash or wallet name" value={query} onChange={e=>{setQuery(e.target.value);setFilter('all');}} className="search-input"/></div>
      <div className="filter-row">{Object.entries(labels).map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)} className={filter===id?'active':''}>{label}</button>)}</div>
      <div className="history-table"><Table><TableHeader><TableRow>{['Transaction / type','Date','Wallets','Portfolio change','ADA / trade price / fee'].map(t=><TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{shown.slice(page*100,(page+1)*100).map(t=><Transaction key={t.tx_hash} tx={t} fact={classifiedFacts[t.tx_hash]} wallets={displayWallets} markets={snapshot?.markets||{}} history={snapshot?.history||{}} cexAddresses={cexAddresses}/>)}</TableBody></Table></div>{!shown.length&&<p className="empty">{busy?'Loading transactions…':'No matching transactions.'}</p>}
      <Pagination className="mt-4"><PaginationContent><PaginationItem><button className="governance-vote-secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button></PaginationItem><PaginationItem><span className="small px-3">Page {page+1} / {Math.max(1,Math.ceil(shown.length/100))} · {num(shown.length,0)} transactions</span></PaginationItem><PaginationItem><button className="governance-vote-secondary" disabled={(page+1)*100>=shown.length} onClick={()=>setPage(p=>p+1)}>Next</button></PaginationItem></PaginationContent></Pagination>
      <p className="small muted table-note">Internal transfers require all inputs and outputs to belong to tracked addresses. Their net change is only the fee. Mixed transactions remain separate. Buy/sell labels are inferred from opposing ADA and token changes; multi-step DEX orders may need further reconciliation.</p>
    </section></AssetOverlay>}</div>
    {selectedAsset&&rows.filter(r=>r.id===selectedAsset).map(r=><AssetOverlay key={r.id} name={r.name} onClose={()=>setSelectedAsset(null)}>
      <section className="portfolio-section">
        <AssetImage id={r.id} name={r.name} market={snapshot?.markets[r.id]}/>
        <p className="address">{r.id}</p>
        {r.id!=='lovelace'&&<><button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>void refreshAssetPurchases(r.id)}>Refresh purchase data</button><p className="small muted" role="status">{status}</p>{error&&<p role="alert" className="negative">{error}</p>}</>}
        {r.id!=='lovelace'&&<><label><input type="checkbox" checked={overrides[r.id]?.excluded===true} onChange={e=>excludeAsset(r.id,e.target.checked)}/> Exclude from calculations</label><p className="small muted">Excludes this asset's value, purchase cost and gain/loss from portfolio totals and coverage. Individual details stay visible. Actual ADA movements and network fees remain unchanged. Saved for this portfolio in this browser.</p></>}
        {r.id!=='lovelace'&&<a href={`https://cardanoscan.io/token/${r.id}`} target="_blank" rel="noreferrer">View asset on Cardanoscan <ExternalLink size={14}/></a>}
        <div className="tdsp-tile-grid">
          <Metric label="Balance" value={r.qty===null?`${r.raw} raw units`:num(r.qty)} note=""/>
          <Metric label="Current value" value={r.value===null?'Unavailable':usd(r.value)} note={r.quote.source==='fallback'?'2 ADA fallback estimate':r.quote.source==='wayup'?'Wayup collection floor estimate':r.quote.source==='manual'?'Your price':'Market estimate'}/>
          <Metric label="Remaining purchase cost" value={r.cost===null?'Unknown':usd(r.cost)} note=""/>
          <Metric label="Unrealised gain / loss" value={r.pnl===null?'Purchase cost required':signed(r.pnl)} note="" tone={r.pnl!==null&&r.pnl<0?'negative':''}/>
        </div>
      </section>
      {r.id!=='lovelace'&&<PaymentLinks id={r.id} facts={Object.values(classifiedFacts)} links={paymentLinks} acquisitions={payments.acquisitions} onSave={savePaymentLinks} loading={busy}/>}
    </AssetOverlay>)}
  </main>;
}

function WalletCard({wallet:w,primary,snapshot,remove}:{wallet:Wallet;primary:boolean;snapshot:Snapshot|null;remove:()=>void}){
  const addresses=snapshot?.groups?.[w.address];
  const facts=Object.values(snapshot?.facts||{});
  const countLabel=(linked:string[])=>`${num(walletTransactionCount(facts,linked),0)} transactions${snapshot?.complete?'':' · analysed so far'}`;
  return <div className="governance-menu-card"><div className="wallet-title"><strong className="governance-card-title">{w.label}</strong><button className="governance-vote-secondary" disabled={primary} onClick={remove} aria-label={`Remove ${w.label} from portfolio`}><Trash2 size={16}/></button></div>
    <a className="address" href={`https://cardanoscan.io/${validStakeAddress(w.address)?'stakekey':'address'}/${w.address}`} target="_blank" rel="noreferrer" title={w.address}>{short(w.address)} <ExternalLink size={12}/></a>
    <div className="governance-card-detail">{addresses?'₳ '+num(snapshot!.infos.filter(i=>addresses.includes(i.address)).reduce((total,i)=>total+Number(i.balance)/1e6,0)):'Loading balance…'}</div>
    <div className="small muted">{addresses?countLabel(addresses):'Loading transaction count…'}</div>
    {validStakeAddress(w.address)&&addresses&&<details className="portfolio-linked-addresses"><summary>{addresses.length} linked addresses · includes spent addresses</summary>{addresses.map(address=>{
      const info=snapshot!.infos.find(row=>row.address===address);
      return <div className="governance-detail-row" key={address}><a className="address" href={`https://cardanoscan.io/address/${address}`} target="_blank" rel="noreferrer" title={address}>{short(address)} <ExternalLink size={12}/></a><span>{info?'₳ '+num(Number(info.balance)/1e6):'Balance unavailable'}</span><span className="small muted">{countLabel([address])}</span></div>;
    })}</details>}
  </div>;
}
function AssetImage({id,name,market,onOpen}:{id:string;name:string;market?:Market;onOpen?:()=>void}){
  const [failed,setFailed]=useState<string[]>([]);
  const source=assetImageCandidates(id,[market?.cached_image,market?.wayup_image,market?.image,market?.image_url,market?.logo]).find(url=>!failed.includes(url));
  const image=source?<img className="portfolio-asset-image" src={source} alt={name} title={name} width={48} height={48} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>:null;
  const content=<>{image}<span className="portfolio-asset-name" title={id}>{name}</span></>;
  return onOpen?<button type="button" className="governance-vote-secondary portfolio-asset-button" onClick={onOpen} aria-label={`View ${name} details`}>{content}</button>:<div>{content}</div>;
}

function Metric({label,value,amount,note,tone=''}:{label:string;value:string;amount?:{ada:number;usd:number|null};note:string;tone?:string}){return <div className="governance-menu-card"><strong translate="no" className={`governance-card-title ${tone}`}>{amount?<AdaUsdAmount {...amount}/>:value}</strong><div className="governance-card-detail" data-i18n-auto-original={label}>{label}</div><p className="small muted">{note}</p></div>;}
function Transaction({tx,fact,markets,wallets,history,cexAddresses}:{tx:Tx;fact?:Fact;markets:Record<string,Market>;wallets:Wallet[];history:Record<string,number>;cexAddresses:CexAddress[]}){
  const kind=fact?kindOf(fact):null,trade=fact?tradeOf(fact):null;
  const destinations=fact?cexDestinations(fact,cexAddresses):[];
  const sources=fact?cexSources(fact,cexAddresses):[];
  const cexTrade=fact?cexAdaTransfer(fact,cexAddresses):null;
  const quantity=trade?units(trade.raw,markets[trade.id]?.decimals??fact?.decimals?.[trade.id]):null;
  const daily=history[new Date(tx.block_time*1000).toISOString().slice(0,10)];
  return <TableRow><TableCell><a href={`https://cardanoscan.io/transaction/${tx.tx_hash}`} target="_blank" rel="noreferrer" className="address">{short(tx.tx_hash)} <ExternalLink size={12}/></a><div className={`tx-kind ${kind==='internal'?'internal':''} ${destinations.length&&fact?.feeRaw!==null?'positive':''}`}>{kind==='internal'&&<ArrowRightLeft size={14}/>} {cexTrade?(cexTrade.side==='buy'?'ADA buy from CEX · your rule':'ADA sell to CEX · your rule'):destinations.length?(fact?.feeRaw===null?'CEX output · mixed inputs':'Sent to CEX'):sources.length?(kind==='receive'?'Received · CEX input':'CEX input · mixed transaction'):trade?`${trade.side==='buy'?'Buy':'Sell'} ${markets[trade.id]?.ticker||assetName(trade.id)} · inferred`:kind==='send'?'ADA / assets spent or sent':kind==='internal'?'Transfer between own wallets':kind?labels[kind]:'Awaiting analysis'}</div>{destinations.map((destination,i)=><div className="small muted" key={`${destination.address}:${i}`}>To: <a href={`https://cardanoscan.io/address/${destination.address}`} target="_blank" rel="noreferrer" title={destination.address}>{destination.name} · {short(destination.address)}</a> · ₳ {num(Number(destination.lovelace)/1e6)} · user label</div>)}{[...new Map(sources.map(source=>[source.address,source])).values()].map(source=><div className="small muted" key={`source:${source.address}`}>CEX source: <a href={`https://cardanoscan.io/address/${source.address}`} target="_blank" rel="noreferrer" title={source.address}>{source.name} · {short(source.address)}</a> · user label</div>)}</TableCell>
    <TableCell>{new Date(tx.block_time*1000).toLocaleDateString()}<div className="small muted">{new Date(tx.block_time*1000).toLocaleTimeString()}</div></TableCell>
    <TableCell>{[...new Set(fact?.wallets.map(a=>wallets.find(w=>w.address===a)?.label||short(a)))].map(label=><div key={label}>{label}</div>)}</TableCell>
    <TableCell>{fact?<><div className={BigInt(fact.adaRaw)>=0n?'positive':'negative'}>{BigInt(fact.adaRaw)>0n?'+':''}{num(Number(fact.adaRaw)/1e6)} ₳</div>{Object.entries(fact.assets).map(([id,raw])=>{const q=units(raw,markets[id]?.decimals??fact.decimals?.[id]);return <div className="small" key={id}>{BigInt(raw)>0n?'+':''}{q===null?raw+' raw':num(q)} {markets[id]?.ticker||assetName(id)}</div>;})}{fact.internal&&<div className="small muted">Internal transfer · fee only</div>}</>:'—'}</TableCell>
    <TableCell>{fact?.internal?<div className="small muted">Original ADA average preserved</div>:<><div>{daily?'≈ $'+num(daily,6)+' / ADA':'Historical ADA price unavailable'}</div><div className="small muted">{fact&&BigInt(fact.adaRaw)+BigInt(fact.feeRaw||0)>0n?'Receipt-price basis · ':''}Daily UTC market estimate</div></>}{trade&&<><div>{quantity?num(trade.ada/quantity,10)+' ₳ / token':num(trade.ada)+' ₳ consideration'}</div>{daily&&quantity?<div className="small muted">≈ {usd(trade.ada/quantity*daily)} / token · daily USD estimate</div>:<div className="small muted">{!daily?'Historical USD price unavailable':'Token decimals unavailable'}</div>}</>}{fact&&<div className="small muted">{fact.feeRaw!==null?'Fee: '+num(Number(fact.feeRaw)/1e6)+' ₳':'Network fee attribution unknown'}</div>}</TableCell>
  </TableRow>;
}
