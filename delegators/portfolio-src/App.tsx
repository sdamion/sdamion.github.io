"use client";

import {useEffect,useMemo,useRef,useState} from 'react';
import {ExternalLink,RefreshCw,Plus,Trash2,ArrowRightLeft} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Pagination,PaginationContent,PaginationItem} from '@/components/ui/pagination';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {analyse,assetName,combineHoldings,currentPrice,kindOf,remainingBasis,liveAdaBasis,short,tradeOf,units,validAddress} from '@/lib/portfolio';
import type {AddressInfo,Detail,Fact,Market,Tx,Wallet} from '@/lib/portfolio';
import {readCache,saveCache} from '@/lib/portfolio-cache';
import type {Snapshot} from '@/lib/portfolio-cache';

import {portfolioFetch} from './transport';
import {CexAddresses} from './CexAddresses';
import {normalizeCexAddresses,cexDestinations,cexSources,cexAdjustedFact,isCexTransaction} from './cex';
import type {CexAddress} from './cex';
import {durationLabel,remainingSeconds,analysisProgress} from './progress';
import {memberWallets,resolveWalletGroups,validWalletAddress,validStakeAddress,sameTrackedAddresses,walletTransactionCount} from './member';
const num=(n:number,max=6)=>n.toLocaleString('en-US',{maximumFractionDigits:max});
const usd=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Math.abs(n)>0&&Math.abs(n)<0.01?8:2});
const signed=(n:number)=>`${n>0?'+':''}${usd(n)}`;
const labels:Record<string,string>={all:'All',cex:'CEX',trade:'Trades',send:'Sends',receive:'Receives',internal:'Internal',mixed:'Mixed',other:'Other'};
type Overrides=Record<string,{average?:string;price?:string}>;
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
  const [page,setPage]=useState(0);
  const [liveQuote,setLiveQuote]=useState<{usd:number;at:string}|null>(null);
  const controller=useRef<AbortController|null>(null);
  const [refreshStarted,setRefreshStarted]=useState(0),[clock,setClock]=useState(0);
  const [analysis,setAnalysis]=useState<{started:number;done:number;total:number}|null>(null);
  const [counting,setCounting]=useState<number|null>(null);
  const key=memberStake+'::'+wallets.map(w=>w.address).sort().join('|');
  const overrideKey='tdsp-member-basis:'+key;

  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(SETTINGS)||'null');setWallets(memberWallets(memberStake,saved));}catch{setCacheNotice('Browser storage is unavailable; wallet settings may not persist.');}setReady(true);return()=>controller.current?.abort();},[]);
  useEffect(()=>{if(!ready)return;setSnapshot(null);setError('');try{setOverrides(JSON.parse(localStorage.getItem(overrideKey)||'{}'));}catch{setOverrides({});}void refresh();return()=>controller.current?.abort();/* wallet scope determines the cached portfolio */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,key]);
  useEffect(()=>setPage(0),[filter,query,key]);
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
    const started=Date.now();setRefreshStarted(started);setClock(started);setAnalysis(null);setCounting(null);
    setBusy(true);setError('');setNotice('');setStatus('Initialising wallets · loading saved data…');
    try{
      let cached:Snapshot|null=null;try{cached=await readCache(key);}catch{setCacheNotice('Local cache unavailable. Live data will still load.');}
      signal.throwIfAborted();if(cached)setSnapshot(cached);
      setStatus('Initialising wallets · finding linked addresses…');
      const stakes=wallets.map(w=>w.address).filter(validStakeAddress);
      const accounts:{stake_address:string;addresses:string[]}[]=[];
      for(let i=0;i<stakes.length;i+=40)accounts.push(...await request<{stake_address:string;addresses:string[]}[]>('account_addresses',{_stake_addresses:stakes.slice(i,i+40),_first_only:false,_empty:true},signal));
      const groups=resolveWalletGroups(wallets,accounts);
      const reusableFacts=sameTrackedAddresses(cached?.groups,groups)?cached?.facts||{}:{};
      const addresses=[...new Set(Object.values(groups).flat())];
      const addressBatches=Array.from({length:Math.ceil(addresses.length/40)},(_,i)=>addresses.slice(i*40,(i+1)*40));
      const loadInfos=async()=>{const all:AddressInfo[]=[];for(const [index,batch] of addressBatches.entries()){
        setStatus(`Initialising wallets · loading balances ${index+1} / ${addressBatches.length}`);
        all.push(...await request<AddressInfo[]>('address_info',{_addresses:batch},signal));
      }return all;};
      const infos=await loadInfos();signal.throwIfAborted();
      if(addresses.some(a=>!infos.some(i=>i.address===a)))throw new Error('Some wallet balances were not returned. The combined balance has not been replaced.');
      const holdings=combineHoldings(infos);
      const next:Snapshot={groups,infos,txs:cached?.txs||[],facts:reusableFacts,markets:{},adaUsd:cached?.adaUsd??null,history:cached?.history||{},updated:new Date().toISOString(),priceAt:cached?.priceAt??null,complete:false};
      for(const info of infos)for(const u of info.utxo_set||[])for(const a of u.asset_list||[]){const id=a.policy_id+a.asset_name;next.markets[id]={token_id:id,decimals:a.decimals};}
      setSnapshot({...next});
      setStatus('Balances updated · updating prices…');
      const quote=await portfolioFetch('/api/price',{signal}).then(async r=>r.ok?await r.json() as {cardano?:{usd:number}}:null).catch(()=>null);
      signal.throwIfAborted();
      const freshPrice=quote?.cardano?.usd??null;
      if(freshPrice!==null){next.adaUsd=freshPrice;next.priceAt=new Date().toISOString();setLiveQuote({usd:freshPrice,at:next.priceAt});}
      setSnapshot({...next});
      setStatus('Balances updated · loading historical prices…');
      const hist=await historicalPrices(signal);signal.throwIfAborted();
      if(hist?.prices?.length)next.history=Object.fromEntries(hist.prices.map(([t,p])=>[new Date(t).toISOString().slice(0,10),p]));
      const warnings:string[]=[];if(freshPrice===null)warnings.push('Current ADA/USD price unavailable.');if(!hist?.prices?.length)warnings.push('Historical ADA/USD refresh failed. Saved prices are retained; missing receipt prices will not be counted as zero.');
      const assetIds=holdings.filter(h=>h.id!=='lovelace').map(h=>h.id);
      for(let i=0;i<assetIds.length;i+=50){
        setStatus(`Balances updated · loading token prices ${Math.floor(i/50)+1} / ${Math.ceil(assetIds.length/50)}`);
        const r=await portfolioFetch('/api/markets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets:assetIds.slice(i,i+50)}),signal});
        if(!r.ok){warnings.push('Some token prices are unavailable. Unpriced assets are excluded from the subtotal.');break;}
        const data=await r.json() as {tokens:Market[]};for(const m of data.tokens)next.markets[m.token_id]={...m,decimals:m.decimals??next.markets[m.token_id]?.decimals};
      }
      signal.throwIfAborted();setSnapshot({...next});setNotice(warnings.join(' '));
      const persist=async()=>{try{await saveCache(key,next);}catch{setCacheNotice('The browser could not save the cache. Keep this page open or retry later.');}};
      await persist();const map=new Map<string,Tx>();const seenPages=new Set<string>();
      setCounting(0);
      for(const addressBatch of addressBatches)for(let offset=0;;offset+=1000){
        setStatus('Step 1 of 2 · Counting transactions before analysis…');
        const page=await request<Tx[]>('address_txs',{_addresses:addressBatch},signal,`${offset}-${offset+999}`);
        const pageKey=addressBatch.join(',')+':'+page.map(t=>t.tx_hash).join('|');for(const t of page)map.set(t.tx_hash,t);
        signal.throwIfAborted();setCounting(map.size);
        if(page.length===1000&&seenPages.has(pageKey))throw new Error('The indexer repeated a history page. Please refresh to complete the history.');
        seenPages.add(pageKey);if(page.length<1000)break;
      }
      next.txs=[...map.values()].sort((a,b)=>b.block_time-a.block_time||a.tx_hash.localeCompare(b.tx_hash));
      next.facts=Object.fromEntries(Object.entries(next.facts).filter(([hash])=>map.has(hash)));
      const missing=next.txs.filter((t,i)=>i<20||!next.facts[t.tx_hash]||!Array.isArray(next.facts[t.tx_hash].externalInputs));
      setSnapshot({...next});const owned=new Set(addresses);
      const analysisStarted=Date.now();
      const refreshedHashes=new Set<string>();
      setCounting(null);
      setAnalysis({started:analysisStarted,done:0,total:missing.length});
      for(let i=0;i<missing.length;i+=50){
        setStatus('Step 2 of 2 · Analysing transactions…');
        const batch=missing.slice(i,i+50);const details=await request<Detail[]>('tx_info',{_tx_hashes:batch.map(t=>t.tx_hash),_inputs:true,_assets:true,_metadata:false,_withdrawals:false,_certs:false,_scripts:false,_bytecode:false},signal);
        for(const d of details){
          if(!batch.some(tx=>tx.tx_hash===d.tx_hash))continue;
          next.facts[d.tx_hash]=analyse(d,owned);refreshedHashes.add(d.tx_hash);
        }
        signal.throwIfAborted();setSnapshot({...next,facts:{...next.facts}});await persist();
        setAnalysis({started:analysisStarted,done:refreshedHashes.size,total:missing.length});
      }
      next.complete=next.txs.every(t=>!!next.facts[t.tx_hash])&&missing.every(t=>refreshedHashes.has(t.tx_hash));await persist();signal.throwIfAborted();setSnapshot({...next});
      setStatus(next.complete?`Updated ${new Date(next.updated).toLocaleString()}`:'Some transactions are awaiting analysis. Refresh to retry.');
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Could not update this portfolio.');setStatus('Refresh incomplete · showing available data');}}
    finally{if(!signal.aborted){setClock(Date.now());setBusy(false);setCounting(null);}}
  }

  function saveWallets(next:Wallet[]){
    next=memberWallets(memberStake,next);controller.current?.abort();
    setBusy(true);setAnalysis(null);setCounting(null);setStatus('Initialising wallets…');
    const started=Date.now();setRefreshStarted(started);setClock(started);
    try{localStorage.setItem(SETTINGS,JSON.stringify(next));}catch{setCacheNotice('Wallet settings could not be saved in this browser.');}
    setWallets(next);
  }
  function saveCexAddresses(entries:CexAddress[]){
    try{localStorage.setItem(CEX_SETTINGS,JSON.stringify(entries));setCexAddresses(entries);return true;}
    catch{setCacheNotice('CEX addresses could not be saved in this browser.');return false;}
  }
  function addWallet(e:React.FormEvent){e.preventDefault();const a=address.trim().toLowerCase();if(!validWalletAddress(a)){setWalletError('Enter a valid mainnet stake address (stake1…) or payment address (addr1…).');return;}if(wallets.some(w=>w.address===a)){setWalletError('This address is already included.');return;}saveWallets([...wallets,{address:a,label:name.trim()||`Wallet ${wallets.length+1}`}]);setAddress('');setName('');setWalletError('');}
  function updateOverride(id:string,field:'average'|'price',value:string){if(value!==''&&parseAmount(value)===null)return;const next={...overrides,[id]:{...overrides[id],[field]:value}};setOverrides(next);try{localStorage.setItem(overrideKey,JSON.stringify(next));}catch{setCacheNotice('Your price entries could not be saved locally.');}}

  const holdings=useMemo(()=>snapshot?combineHoldings(snapshot.infos):[],[snapshot]);
  const classifiedFacts=useMemo(()=>Object.fromEntries(Object.entries(snapshot?.facts||{}).map(([hash,fact])=>[hash,cexAdjustedFact(fact,cexAddresses)])),[snapshot,cexAddresses]);
  const basis=useMemo(()=>snapshot?.complete?remainingBasis(Object.values(classifiedFacts),snapshot.history):{},[snapshot,classifiedFacts]);
  const adaLive=useMemo(()=>snapshot?liveAdaBasis(Object.values(classifiedFacts),snapshot.history,holdings.find(h=>h.id==='lovelace')?.raw||'0',snapshot.complete):null,[snapshot,holdings,classifiedFacts]);
  const rows=holdings.map(h=>{
    const m=snapshot?.markets[h.id],decimals=h.id==='lovelace'?6:m?.decimals;
    const qty=units(h.raw,decimals);const manualPrice=parseAmount(overrides[h.id]?.price);
    const price=manualPrice??currentPrice(h.id,snapshot?.markets||{},liveQuote?.usd??snapshot?.adaUsd??null);
    const value=qty!==null&&price!==null?qty*price:null;
    const avg=h.id==='lovelace'?null:parseAmount(overrides[h.id]?.average);const automatic=h.id==='lovelace'?adaLive:basis[h.id];
    const cost=qty!==null&&avg!==null?qty*avg:automatic?.raw===h.raw?automatic.usd:null;
    const pnl=value!==null&&cost!==null?value-cost:null;
    return {...h,name:m?.ticker||assetName(h.id),qty,price,value,cost,pnl,manualPrice,automatic:avg===null&&cost!==null};
  }).sort((a,b)=>a.id==='lovelace'?-1:b.id==='lovelace'?1:(b.value??-1)-(a.value??-1));
  const valued=rows.filter(r=>r.value!==null),covered=rows.filter(r=>r.pnl!==null);
  const subtotal=valued.reduce((s,r)=>s+(r.value||0),0),gain=covered.reduce((s,r)=>s+(r.pnl||0),0),costTotal=covered.reduce((s,r)=>s+(r.cost||0),0);
  const ada=Number(holdings.find(h=>h.id==='lovelace')?.raw||0)/1e6;
  const adaRow=rows.find(r=>r.id==='lovelace');
  const provisional=adaLive?.provisional&&adaRow?.pnl!==null&&adaRow?.pnl!==undefined;
  const adaBasisStatus=!snapshot?.complete?adaLive?.usd!==null&&adaLive?.usd!==undefined?`Provisional · ${num(adaLive.receiptCount,0)} priced receipts${adaLive.missingReceiptAda>0?' · some receipt prices missing':''}`:'Waiting for a priced ADA receipt…':!adaLive?.reconciled?'History / balance mismatch — refresh to reconcile':adaLive.usd===null?'Missing receipt prices':'Receipt-date weighted average';
  const displayWallets=wallets.flatMap(w=>(snapshot?.groups?.[w.address]||[w.address]).map(address=>({...w,address})));
  const fees=Object.values(snapshot?.facts||{}).reduce((s,f)=>s+Number(f.feeRaw||0)/1e6,0);
  const transactionTotal=snapshot?.txs.length||0;
  const analysedTotal=snapshot?.txs.filter(tx=>!!snapshot.facts[tx.tx_hash]).length||0;
  const progress=analysisProgress(busy,analysis,analysedTotal,transactionTotal);
  const eta=analysis?remainingSeconds(analysis.started,clock,analysis.done,analysis.total):null;
  const refreshTiming=refreshStarted?`${busy?'Elapsed':'Refresh duration'}: ${durationLabel((clock-refreshStarted)/1000)}${busy?(eta!==null?` · Estimated analysis remaining: ${durationLabel(eta)}`:' · Estimating remaining time…'):''}`:'';
  const shown=(snapshot?.txs||[]).filter(t=>{const f=classifiedFacts[t.tx_hash];return (filter==='all'||(filter==='cex'?isCexTransaction(f,cexAddresses):f&&kindOf(f)===filter))&&(!query||t.tx_hash.includes(query.toLowerCase().trim())||(f?.wallets||[]).some(a=>displayWallets.find(w=>w.address===a)?.label.toLowerCase().includes(query.toLowerCase())));});

  return <main className="member-portfolio"><header className="portfolio-header"><div><span className="ada-logo">₳</span><strong>TDSP</strong><span className="muted"> / Portfolio</span></div><button onClick={()=>void refresh()} disabled={busy||!ready} className="governance-vote-secondary"><RefreshCw size={16} className={busy?'animate-spin':''}/> Refresh</button></header>
    <div className="portfolio-body">
    <section className="portfolio-hero"><div className="eyebrow">{wallets.length} wallets · mainnet</div><h1>Your member portfolio</h1><p className="muted">Internal transfers keep your combined holdings unchanged, apart from fees.</p><div className="tdsp-tile-grid">
      <Metric label={valued.length===rows.length?'Combined current value':'Priced holdings subtotal'} value={snapshot&&valued.length?usd(subtotal):'—'} note={`${valued.length} of ${rows.length} assets priced · USD`}/>
      <Metric label="ADA across wallets" value={snapshot?num(ada)+' ₳':'—'} note="Unspent balance at your tracked addresses"/>
      <Metric label={provisional?'Unrealised gain / loss · estimate':'Unrealised gain / loss'} value={covered.length?(provisional?'≈ ':'')+signed(gain):snapshot?.complete?'Basis unavailable':'Calculating…'} note={covered.length?`${provisional?'Provisional · loaded receipts only · ':''}${covered.length} of ${rows.length} holdings${costTotal>0?' · '+num(gain/costTotal*100,2)+'%':''}`:adaBasisStatus} tone={covered.length?gain>=0?'positive':'negative':''}/>
      <Metric label="Network fees paid" value={snapshot?num(fees)+' ₳':'—'} note="Shared-input fees excluded"/>
    </div><p role="status" className="status-line">{status}{(liveQuote?.at||snapshot?.priceAt)?' · Price quote '+new Date((liveQuote?.at||snapshot?.priceAt)!).toLocaleTimeString()+' · refreshes every minute':''}</p><p className="small muted" role="timer">{refreshTiming}</p>{counting!==null?<div><p className="small muted" role="status">Counting transactions · {num(counting,0)} unique transactions found so far · total not yet known</p><progress aria-label="Counting transactions"/></div>:snapshot&&<div><p className="small muted" role="status">{busy&&!analysis?'Preparing refresh · 0%':`${num(progress.done,0)} / ${num(progress.total,0)} transactions analysed${busy?' this refresh':''} · ${num(progress.percent,1)}%`}</p><progress aria-label="Transactions analysed" aria-valuetext={`${progress.done} of ${progress.total} transactions analysed${busy?' this refresh':''}`} max={Math.max(1,progress.total)} value={progress.done}/></div>}</section>
    {error&&<p role="alert" className="message error">{error}</p>}{notice&&<p className="message">{notice}</p>}{cacheNotice&&<p role="status" className="message">{cacheNotice}</p>}
    <CexAddresses entries={cexAddresses} owned={Object.values(snapshot?.groups||{}).flat().concat(wallets.map(wallet=>wallet.address))} onChange={saveCexAddresses}/>
    {cexAddresses.length>0&&Object.values(snapshot?.facts||{}).some(fact=>!Array.isArray(fact.externalInputs))&&<p className="small muted">Refresh to load sender and recipient stake addresses for older cached transactions.</p>}

    <section className="portfolio-section"><div className="section-heading"><div><h2>Wallets in this portfolio</h2><p className="muted">Wallet 1 is your verified stake address, including all linked payment and change addresses. Add other stake addresses or payment addresses you own. Unclaimed rewards and assets locked in contracts are excluded.</p></div></div>
      {busy&&!analysis&&counting===null&&<div role="status"><p className="small muted">Initialising wallets before counting transactions…</p><progress aria-label="Initialising wallets"/></div>}
      <div className="tdsp-tile-grid">{wallets.map((w,i)=><WalletCard key={w.address} wallet={w} primary={i===0} snapshot={snapshot} remove={()=>saveWallets(wallets.filter(x=>x.address!==w.address))}/>)}</div>
      <form onSubmit={addWallet} className="wallet-form governance-drep-registration-form"><label>Wallet name<Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Savings" maxLength={60}/></label><label className="address-field">Stake or payment address<Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="stake1… or addr1…" aria-describedby="wallet-error" required/></label><button className="governance-vote-primary" type="submit"><Plus size={16}/>Add wallet</button></form><p id="wallet-error" role="status" className="negative">{walletError}</p>
      <p className="small muted">Wallets, prices you enter, and cached history are saved in this browser. Adding or removing a wallet recalculates the entire portfolio; average costs are saved separately for each wallet combination.</p>
    </section>

    <section className="portfolio-section"><div className="section-heading"><div><h2>Current holdings & performance</h2><p className="muted">ADA buy price is calculated automatically from receipt-date market prices across your tracked wallets. Gain / loss = current value − remaining cost.</p></div></div>
      <Table><TableHeader><TableRow>{['Asset','Balance','Current price · USD','Current value','Average buy · USD / unit','Unrealised gain / loss'].map(t=><TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.id}>
        <TableCell><strong title={r.id}>{r.name}</strong><div className="small muted" title={r.id}>{r.id==='lovelace'?'Cardano':short(r.id)}</div></TableCell>
        <TableCell>{r.qty===null?`${r.raw} raw units`:num(r.qty)}{r.qty===null&&<div className="small muted">Token decimals unavailable</div>}</TableCell>
        <TableCell>{r.price!==null?usd(r.price):'Unavailable'}<div className="small muted">{r.manualPrice!==null?'Your price':r.price!==null?'Market estimate':''}</div><details><summary className="small">Set current price</summary><Input aria-label={`Current USD price for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.price||''} onChange={e=>updateOverride(r.id,'price',e.target.value)} placeholder="Use market quote"/></details></TableCell>
        <TableCell>{r.value===null?'—':usd(r.value)}</TableCell>
        <TableCell>{r.id==='lovelace'?<><strong className={r.cost===null||!r.qty||r.cost<0?'negative':''}>{r.cost!==null&&r.qty?(adaLive?.provisional?'≈ $':'$')+num(r.cost/r.qty,6):'—'}</strong><div className="small muted">{adaBasisStatus}</div>{r.cost!==null&&<div className="small muted">{adaLive?.provisional?'Projected cost':'Remaining cost'}: {usd(r.cost)}</div>}</>:<><Input className="cost-input" aria-label={`Average buy price in USD for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.average||''} onChange={e=>updateOverride(r.id,'average',e.target.value)} placeholder={r.automatic&&r.qty?num((r.cost||0)/r.qty,8):'Enter cost'}/><div className="small muted">{r.automatic?'Estimated FIFO · inferred trades':parseAmount(overrides[r.id]?.average)!==null?'Your average cost':'Purchase cost unknown'}</div></>}</TableCell>
        <TableCell className={r.pnl===null?'muted':r.pnl>=0?'positive':'negative'}>{r.pnl===null?'—':(r.id==='lovelace'&&provisional?'≈ ':'')+signed(r.pnl)}{r.pnl!==null&&r.cost!==null&&r.cost>0&&<div className="small">{num(r.pnl/r.cost*100,2)}%{r.id==='lovelace'&&provisional?' · provisional':''}</div>}</TableCell>
      </TableRow>)}</TableBody></Table>{!rows.length&&<p className="empty">{busy?'Fetching balances…':'No unspent holdings at the tracked addresses.'}</p>}
      <p className="small muted table-note">During sync, the provisional ADA estimate applies the weighted average of loaded, priced external receipts to your current balance. It updates after each batch; missing receipt prices are excluded from this estimate, never treated as zero. It may change substantially as older transactions load. Once all history is available and matches the balance, the remaining-cost calculation includes proportional cost removed by sends, spends and fees. Internal transfers never reset the average. Daily closing prices approximate receipt-time prices; today’s price is provisional. This is your receipt-price benchmark, not an exchange execution price or tax calculation. Token costs use inferred FIFO trades or your entry. Performance excludes realised gains; current holdings already reflect fees.</p>
    </section>

    <section className="portfolio-section"><div className="section-heading"><div><h2>Combined transaction history <span className="muted">{num(snapshot?.txs.length||0,0)}</span></h2><p className="muted">Each transaction appears once, even when it touches multiple wallets.</p></div><Input aria-label="Search transactions or wallet names" placeholder="Transaction hash or wallet name" value={query} onChange={e=>setQuery(e.target.value)} className="search-input"/></div>
      <div className="filter-row">{Object.entries(labels).map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)} className={filter===id?'active':''}>{label}</button>)}</div>
      <div className="history-table"><Table><TableHeader><TableRow>{['Transaction / type','Date','Wallets','Portfolio change','ADA / trade price / fee'].map(t=><TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{shown.slice(page*100,(page+1)*100).map(t=><Transaction key={t.tx_hash} tx={t} fact={classifiedFacts[t.tx_hash]} wallets={displayWallets} markets={snapshot?.markets||{}} history={snapshot?.history||{}} cexAddresses={cexAddresses}/>)}</TableBody></Table></div>{!shown.length&&<p className="empty">{busy?'Loading transactions…':'No matching transactions.'}</p>}
      <Pagination className="mt-4"><PaginationContent><PaginationItem><button className="governance-vote-secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button></PaginationItem><PaginationItem><span className="small px-3">Page {page+1} / {Math.max(1,Math.ceil(shown.length/100))} · {num(shown.length,0)} transactions</span></PaginationItem><PaginationItem><button className="governance-vote-secondary" disabled={(page+1)*100>=shown.length} onClick={()=>setPage(p=>p+1)}>Next</button></PaginationItem></PaginationContent></Pagination>
      <p className="small muted table-note">Internal transfers require all inputs and outputs to belong to tracked addresses. Their net change is only the fee. Mixed transactions remain separate. Buy/sell labels are inferred from opposing ADA and token changes; multi-step DEX orders may need further reconciliation.</p>
    </section><footer>Balances: Koios · Token quotes: <a href="https://docs.minswap.org/developer/aggregator-api" target="_blank" rel="noreferrer">Minswap</a> · Daily ADA prices: <a href="https://docs.coinmetrics.io/network-data/network-data-overview/market/price" target="_blank" rel="noreferrer">Coin Metrics</a> · Recent gaps: Coinbase · USD</footer></div>
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
function Metric({label,value,note,tone=''}:{label:string;value:string;note:string;tone?:string}){return <div className="governance-menu-card"><strong className={`governance-card-title ${tone}`}>{value}</strong><div className="governance-card-detail">{label}</div><p className="small muted">{note}</p></div>;}
function Transaction({tx,fact,markets,wallets,history,cexAddresses}:{tx:Tx;fact?:Fact;markets:Record<string,Market>;wallets:Wallet[];history:Record<string,number>;cexAddresses:CexAddress[]}){
  const kind=fact?kindOf(fact):null,trade=fact?tradeOf(fact):null;
  const destinations=fact?cexDestinations(fact,cexAddresses):[];
  const sources=fact?cexSources(fact,cexAddresses):[];
  const quantity=trade?units(trade.raw,markets[trade.id]?.decimals??fact?.decimals?.[trade.id]):null;
  const daily=history[new Date(tx.block_time*1000).toISOString().slice(0,10)];
  return <TableRow><TableCell><a href={`https://cardanoscan.io/transaction/${tx.tx_hash}`} target="_blank" rel="noreferrer" className="address">{short(tx.tx_hash)} <ExternalLink size={12}/></a><div className={`tx-kind ${kind==='internal'?'internal':''} ${destinations.length&&fact?.feeRaw!==null?'positive':''}`}>{kind==='internal'&&<ArrowRightLeft size={14}/>} {destinations.length?(fact?.feeRaw===null?'CEX output · mixed inputs':'Sent to CEX'):sources.length?(kind==='receive'?'Received · CEX input':'CEX input · mixed transaction'):trade?`${trade.side==='buy'?'Buy':'Sell'} ${markets[trade.id]?.ticker||assetName(trade.id)} · inferred`:kind==='send'?'ADA / assets spent or sent':kind==='internal'?'Transfer between own wallets':kind?labels[kind]:'Awaiting analysis'}</div>{destinations.map((destination,i)=><div className="small muted" key={`${destination.address}:${i}`}>To: <a href={`https://cardanoscan.io/address/${destination.address}`} target="_blank" rel="noreferrer" title={destination.address}>{destination.name} · {short(destination.address)}</a> · ₳ {num(Number(destination.lovelace)/1e6)} · user label</div>)}{[...new Map(sources.map(source=>[source.address,source])).values()].map(source=><div className="small muted" key={`source:${source.address}`}>CEX source: <a href={`https://cardanoscan.io/address/${source.address}`} target="_blank" rel="noreferrer" title={source.address}>{source.name} · {short(source.address)}</a> · user label</div>)}</TableCell>
    <TableCell>{new Date(tx.block_time*1000).toLocaleDateString()}<div className="small muted">{new Date(tx.block_time*1000).toLocaleTimeString()}</div></TableCell>
    <TableCell>{[...new Set(fact?.wallets.map(a=>wallets.find(w=>w.address===a)?.label||short(a)))].map(label=><div key={label}>{label}</div>)}</TableCell>
    <TableCell>{fact?<><div className={BigInt(fact.adaRaw)>=0n?'positive':'negative'}>{BigInt(fact.adaRaw)>0n?'+':''}{num(Number(fact.adaRaw)/1e6)} ₳</div>{Object.entries(fact.assets).map(([id,raw])=>{const q=units(raw,markets[id]?.decimals??fact.decimals?.[id]);return <div className="small" key={id}>{BigInt(raw)>0n?'+':''}{q===null?raw+' raw':num(q)} {markets[id]?.ticker||assetName(id)}</div>;})}{fact.internal&&<div className="small muted">Internal transfer · fee only</div>}</>:'—'}</TableCell>
    <TableCell>{fact?.internal?<div className="small muted">Original ADA average preserved</div>:<><div>{daily?'≈ $'+num(daily,6)+' / ADA':'Historical ADA price unavailable'}</div><div className="small muted">{fact&&BigInt(fact.adaRaw)+BigInt(fact.feeRaw||0)>0n?'Receipt-price basis · ':''}Daily UTC market estimate</div></>}{trade&&<><div>{quantity?num(trade.ada/quantity,10)+' ₳ / token':num(trade.ada)+' ₳ consideration'}</div>{daily&&quantity?<div className="small muted">≈ {usd(trade.ada/quantity*daily)} / token · daily USD estimate</div>:<div className="small muted">{!daily?'Historical USD price unavailable':'Token decimals unavailable'}</div>}</>}{fact&&<div className="small muted">{fact.feeRaw!==null?'Fee: '+num(Number(fact.feeRaw)/1e6)+' ₳':'Network fee attribution unknown'}</div>}</TableCell>
  </TableRow>;
}
