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
import {memberWallets,resolveWalletGroups,validWalletAddress,validStakeAddress,sameTrackedAddresses} from './member';
const num=(n:number,max=6)=>n.toLocaleString('en-US',{maximumFractionDigits:max});
const usd=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Math.abs(n)>0&&Math.abs(n)<0.01?8:2});
const signed=(n:number)=>`${n>0?'+':''}${usd(n)}`;
const labels:Record<string,string>={all:'All',trade:'Trades',send:'Sends',receive:'Receives',internal:'Internal',mixed:'Mixed',other:'Other'};
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
  const [wallets,setWallets]=useState<Wallet[]>(()=>memberWallets(memberStake,[])),[ready,setReady]=useState(false);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('Starting…');
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[cacheNotice,setCacheNotice]=useState('');
  const [address,setAddress]=useState(''),[name,setName]=useState(''),[walletError,setWalletError]=useState('');
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[overrides,setOverrides]=useState<Overrides>({});
  const [page,setPage]=useState(0);
  const [liveQuote,setLiveQuote]=useState<{usd:number;at:string}|null>(null);
  const controller=useRef<AbortController|null>(null);
  const key=memberStake+'::'+wallets.map(w=>w.address).sort().join('|');
  const overrideKey='tdsp-member-basis:'+key;

  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(SETTINGS)||'null');setWallets(memberWallets(memberStake,saved));}catch{setCacheNotice('Browser storage is unavailable; wallet settings may not persist.');}setReady(true);return()=>controller.current?.abort();},[]);
  useEffect(()=>{if(!ready)return;setSnapshot(null);setError('');try{setOverrides(JSON.parse(localStorage.getItem(overrideKey)||'{}'));}catch{setOverrides({});}void refresh();return()=>controller.current?.abort();/* wallet scope determines the cached portfolio */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,key]);
  useEffect(()=>setPage(0),[filter,query,key]);
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
    setBusy(true);setError('');setNotice('');setStatus('Loading local cache…');
    try{
      let cached:Snapshot|null=null;try{cached=await readCache(key);}catch{setCacheNotice('Local cache unavailable. Live data will still load.');}
      signal.throwIfAborted();if(cached)setSnapshot(cached);
      setStatus('Updating balances and prices…');
      const stakes=wallets.map(w=>w.address).filter(validStakeAddress);
      const accounts:{stake_address:string;addresses:string[]}[]=[];
      for(let i=0;i<stakes.length;i+=40)accounts.push(...await request<{stake_address:string;addresses:string[]}[]>('account_addresses',{_stake_addresses:stakes.slice(i,i+40),_first_only:false,_empty:true},signal));
      const groups=resolveWalletGroups(wallets,accounts);
      const reusableFacts=sameTrackedAddresses(cached?.groups,groups)?cached?.facts||{}:{};
      const addresses=[...new Set(Object.values(groups).flat())];
      const addressBatches=Array.from({length:Math.ceil(addresses.length/40)},(_,i)=>addresses.slice(i*40,(i+1)*40));
      const loadInfos=async()=>{const all:AddressInfo[]=[];for(const batch of addressBatches)all.push(...await request<AddressInfo[]>('address_info',{_addresses:batch},signal));return all;};
      const [infos,quote,hist]=await Promise.all([
        loadInfos(),
        portfolioFetch('/api/price',{signal}).then(async r=>r.ok?await r.json() as {cardano?:{usd:number}}:null).catch(()=>null),
        historicalPrices(signal)
      ]);signal.throwIfAborted();
      if(addresses.some(a=>!infos.some(i=>i.address===a)))throw new Error('Some wallet balances were not returned. The combined balance has not been replaced.');
      const holdings=combineHoldings(infos);
      const freshPrice=quote?.cardano?.usd??null;
      if(freshPrice!==null)setLiveQuote({usd:freshPrice,at:new Date().toISOString()});
      const next:Snapshot={groups,infos,txs:cached?.txs||[],facts:reusableFacts,markets:{},adaUsd:freshPrice,history:cached?.history||{},updated:new Date().toISOString(),priceAt:freshPrice!==null?new Date().toISOString():null,complete:false};
      for(const info of infos)for(const u of info.utxo_set||[])for(const a of u.asset_list||[]){const id=a.policy_id+a.asset_name;next.markets[id]={token_id:id,decimals:a.decimals};}
      if(hist?.prices?.length)next.history=Object.fromEntries(hist.prices.map(([t,p])=>[new Date(t).toISOString().slice(0,10),p]));
      const warnings:string[]=[];if(freshPrice===null)warnings.push('Current ADA/USD price unavailable.');if(!hist?.prices?.length)warnings.push('Historical ADA/USD refresh failed. Saved prices are retained; missing receipt prices will not be counted as zero.');
      const assetIds=holdings.filter(h=>h.id!=='lovelace').map(h=>h.id);
      for(let i=0;i<assetIds.length;i+=50){
        const r=await portfolioFetch('/api/markets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets:assetIds.slice(i,i+50)}),signal});
        if(!r.ok){warnings.push('Some token prices are unavailable. Unpriced assets are excluded from the subtotal.');break;}
        const data=await r.json() as {tokens:Market[]};for(const m of data.tokens)next.markets[m.token_id]={...m,decimals:m.decimals??next.markets[m.token_id]?.decimals};
      }
      signal.throwIfAborted();setSnapshot({...next});setNotice(warnings.join(' '));
      const persist=async()=>{try{await saveCache(key,next);}catch{setCacheNotice('The browser could not save the cache. Keep this page open or retry later.');}};
      await persist();const map=new Map<string,Tx>();const seenPages=new Set<string>();
      for(const addressBatch of addressBatches)for(let offset=0;;offset+=1000){
        setStatus(`Loading transaction history · ${num(map.size,0)} found`);
        const page=await request<Tx[]>('address_txs',{_addresses:addressBatch},signal,`${offset}-${offset+999}`);
        const pageKey=addressBatch.join(',')+':'+page.map(t=>t.tx_hash).join('|');for(const t of page)map.set(t.tx_hash,t);
        if(page.length===1000&&seenPages.has(pageKey))throw new Error('The indexer repeated a history page. Please refresh to complete the history.');
        seenPages.add(pageKey);if(page.length<1000)break;
      }
      next.txs=[...map.values()].sort((a,b)=>b.block_time-a.block_time||a.tx_hash.localeCompare(b.tx_hash));
      next.facts=Object.fromEntries(Object.entries(next.facts).filter(([hash])=>map.has(hash)));
      const missing=next.txs.filter((t,i)=>i<20||!next.facts[t.tx_hash]);
      setSnapshot({...next});const owned=new Set(addresses);
      for(let i=0;i<missing.length;i+=50){
        setStatus(`Analysing ${num(Object.keys(next.facts).length,0)} / ${num(next.txs.length,0)} transactions`);
        const batch=missing.slice(i,i+50);const details=await request<Detail[]>('tx_info',{_tx_hashes:batch.map(t=>t.tx_hash),_inputs:true,_assets:true,_metadata:false,_withdrawals:false,_certs:false,_scripts:false,_bytecode:false},signal);
        for(const d of details)next.facts[d.tx_hash]=analyse(d,owned);
        signal.throwIfAborted();setSnapshot({...next,facts:{...next.facts}});await persist();
      }
      next.complete=next.txs.every(t=>!!next.facts[t.tx_hash]);await persist();signal.throwIfAborted();setSnapshot({...next});
      setStatus(next.complete?`Updated ${new Date(next.updated).toLocaleString()}`:'Some transactions are awaiting analysis. Refresh to retry.');
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Could not update this portfolio.');setStatus('Refresh incomplete · showing available data');}}
    finally{if(!signal.aborted)setBusy(false);}
  }

  function saveWallets(next:Wallet[]){next=memberWallets(memberStake,next);controller.current?.abort();try{localStorage.setItem(SETTINGS,JSON.stringify(next));}catch{setCacheNotice('Wallet settings could not be saved in this browser.');}setWallets(next);}
  function addWallet(e:React.FormEvent){e.preventDefault();const a=address.trim().toLowerCase();if(!validWalletAddress(a)){setWalletError('Enter a valid mainnet stake address (stake1…) or payment address (addr1…).');return;}if(wallets.some(w=>w.address===a)){setWalletError('This address is already included.');return;}saveWallets([...wallets,{address:a,label:name.trim()||`Wallet ${wallets.length+1}`}]);setAddress('');setName('');setWalletError('');}
  function updateOverride(id:string,field:'average'|'price',value:string){if(value!==''&&parseAmount(value)===null)return;const next={...overrides,[id]:{...overrides[id],[field]:value}};setOverrides(next);try{localStorage.setItem(overrideKey,JSON.stringify(next));}catch{setCacheNotice('Your price entries could not be saved locally.');}}

  const holdings=useMemo(()=>snapshot?combineHoldings(snapshot.infos):[],[snapshot]);
  const basis=useMemo(()=>snapshot?.complete?remainingBasis(Object.values(snapshot.facts),snapshot.history):{},[snapshot]);
  const adaLive=useMemo(()=>snapshot?liveAdaBasis(Object.values(snapshot.facts),snapshot.history,holdings.find(h=>h.id==='lovelace')?.raw||'0',snapshot.complete):null,[snapshot,holdings]);
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
  const shown=(snapshot?.txs||[]).filter(t=>{const f=snapshot?.facts[t.tx_hash];return (filter==='all'||f&&kindOf(f)===filter)&&(!query||t.tx_hash.includes(query.toLowerCase().trim())||(f?.wallets||[]).some(a=>displayWallets.find(w=>w.address===a)?.label.toLowerCase().includes(query.toLowerCase())));});

  return <main className="portfolio"><header className="portfolio-header"><div><span className="ada-logo">₳</span><strong>TDSP</strong><span className="muted"> / Portfolio</span></div><button onClick={()=>void refresh()} disabled={busy||!ready} className="action"><RefreshCw size={16} className={busy?'animate-spin':''}/> Refresh</button></header>
    <div className="portfolio-body"><section className="portfolio-hero"><div className="eyebrow">{wallets.length} wallets · mainnet</div><h1>Your member portfolio</h1><p className="muted">Internal transfers keep your combined holdings unchanged, apart from fees.</p><div className="metrics">
      <Metric label={valued.length===rows.length?'Combined current value':'Priced holdings subtotal'} value={snapshot&&valued.length?usd(subtotal):'—'} note={`${valued.length} of ${rows.length} assets priced · USD`}/>
      <Metric label="ADA across wallets" value={snapshot?num(ada)+' ₳':'—'} note="Unspent balance at your tracked addresses"/>
      <Metric label={provisional?'Unrealised gain / loss · estimate':'Unrealised gain / loss'} value={covered.length?(provisional?'≈ ':'')+signed(gain):snapshot?.complete?'Basis unavailable':'Calculating…'} note={covered.length?`${provisional?'Provisional · loaded receipts only · ':''}${covered.length} of ${rows.length} holdings${costTotal>0?' · '+num(gain/costTotal*100,2)+'%':''}`:adaBasisStatus} tone={covered.length?gain>=0?'positive':'negative':''}/>
      <Metric label="Network fees paid" value={snapshot?num(fees)+' ₳':'—'} note={`${Object.keys(snapshot?.facts||{}).length} / ${snapshot?.txs.length||0} transactions analysed · shared-input fees excluded`}/>
    </div><p role="status" className="status-line">{status}{(liveQuote?.at||snapshot?.priceAt)?' · Price quote '+new Date((liveQuote?.at||snapshot?.priceAt)!).toLocaleTimeString()+' · refreshes every minute':''}</p></section>
    {error&&<p role="alert" className="message error">{error}</p>}{notice&&<p className="message">{notice}</p>}{cacheNotice&&<p role="status" className="message">{cacheNotice}</p>}

    <section className="panel"><div className="section-heading"><div><h2>Wallets in this portfolio</h2><p className="muted">Wallet 1 is your verified stake address, including all linked payment and change addresses. Add other stake addresses or payment addresses you own. Unclaimed rewards and assets locked in contracts are excluded.</p></div></div>
      <div className="wallet-grid">{wallets.map((w,i)=><div className="wallet-card" key={w.address}><div className="wallet-title"><strong>{w.label}</strong><button className="icon-button" disabled={i===0} onClick={()=>saveWallets(wallets.filter(x=>x.address!==w.address))} aria-label={`Remove ${w.label} from portfolio`}><Trash2 size={16}/></button></div><a className="address" href={`https://cardanoscan.io/${validStakeAddress(w.address)?'stakekey':'address'}/${w.address}`} target="_blank" rel="noreferrer" title={w.address}>{short(w.address)} <ExternalLink size={12}/></a><div className="wallet-balance">{snapshot?.groups?.[w.address]?num(snapshot.infos.filter(i=>snapshot.groups?.[w.address]?.includes(i.address)).reduce((total,i)=>total+Number(i.balance)/1e6,0))+' ₳':'Loading balance…'}</div></div>)}</div>
      <form onSubmit={addWallet} className="wallet-form"><label>Wallet name<Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Savings" maxLength={60}/></label><label className="address-field">Stake or payment address<Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="stake1… or addr1…" aria-describedby="wallet-error" required/></label><button className="action primary" type="submit"><Plus size={16}/>Add wallet</button></form><p id="wallet-error" role="status" className="negative">{walletError}</p>
      <p className="small muted">Wallets, prices you enter, and cached history are saved in this browser. Adding or removing a wallet recalculates the entire portfolio; average costs are saved separately for each wallet combination.</p>
    </section>

    <section className="panel"><div className="section-heading"><div><h2>Current holdings & performance</h2><p className="muted">ADA buy price is calculated automatically from receipt-date market prices across your tracked wallets. Gain / loss = current value − remaining cost.</p></div></div>
      <Table><TableHeader><TableRow>{['Asset','Balance','Current price · USD','Current value','Average buy · USD / unit','Unrealised gain / loss'].map(t=><TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.id}>
        <TableCell><strong title={r.id}>{r.name}</strong><div className="small muted" title={r.id}>{r.id==='lovelace'?'Cardano':short(r.id)}</div></TableCell>
        <TableCell>{r.qty===null?`${r.raw} raw units`:num(r.qty)}{r.qty===null&&<div className="small muted">Token decimals unavailable</div>}</TableCell>
        <TableCell>{r.price!==null?usd(r.price):'Unavailable'}<div className="small muted">{r.manualPrice!==null?'Your price':r.price!==null?'Market estimate':''}</div><details><summary className="small">Set current price</summary><Input aria-label={`Current USD price for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.price||''} onChange={e=>updateOverride(r.id,'price',e.target.value)} placeholder="Use market quote"/></details></TableCell>
        <TableCell>{r.value===null?'—':usd(r.value)}</TableCell>
        <TableCell>{r.id==='lovelace'?<><strong>{r.cost!==null&&r.qty?(adaLive?.provisional?'≈ $':'$')+num(r.cost/r.qty,6):'—'}</strong><div className="small muted">{adaBasisStatus}</div>{r.cost!==null&&<div className="small muted">{adaLive?.provisional?'Projected cost':'Remaining cost'}: {usd(r.cost)}</div>}</>:<><Input className="cost-input" aria-label={`Average buy price in USD for ${r.name}`} type="number" min="0" step="any" value={overrides[r.id]?.average||''} onChange={e=>updateOverride(r.id,'average',e.target.value)} placeholder={r.automatic&&r.qty?num((r.cost||0)/r.qty,8):'Enter cost'}/><div className="small muted">{r.automatic?'Estimated FIFO · inferred trades':parseAmount(overrides[r.id]?.average)!==null?'Your average cost':'Purchase cost unknown'}</div></>}</TableCell>
        <TableCell className={r.pnl===null?'muted':r.pnl>=0?'positive':'negative'}>{r.pnl===null?'—':(r.id==='lovelace'&&provisional?'≈ ':'')+signed(r.pnl)}{r.pnl!==null&&r.cost!==null&&r.cost>0&&<div className="small">{num(r.pnl/r.cost*100,2)}%{r.id==='lovelace'&&provisional?' · provisional':''}</div>}</TableCell>
      </TableRow>)}</TableBody></Table>{!rows.length&&<p className="empty">{busy?'Fetching balances…':'No unspent holdings at the tracked addresses.'}</p>}
      <p className="small muted table-note">During sync, the provisional ADA estimate applies the weighted average of loaded, priced external receipts to your current balance. It updates after each batch; missing receipt prices are excluded from this estimate, never treated as zero. It may change substantially as older transactions load. Once all history is available and matches the balance, the remaining-cost calculation includes proportional cost removed by sends, spends and fees. Internal transfers never reset the average. Daily closing prices approximate receipt-time prices; today’s price is provisional. This is your receipt-price benchmark, not an exchange execution price or tax calculation. Token costs use inferred FIFO trades or your entry. Performance excludes realised gains; current holdings already reflect fees.</p>
    </section>

    <section className="panel"><div className="section-heading"><div><h2>Combined transaction history <span className="muted">{num(snapshot?.txs.length||0,0)}</span></h2><p className="muted">Each transaction appears once, even when it touches multiple wallets.</p></div><Input aria-label="Search transactions or wallet names" placeholder="Transaction hash or wallet name" value={query} onChange={e=>setQuery(e.target.value)} className="search-input"/></div>
      <div className="filter-row">{Object.entries(labels).map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)} className={filter===id?'active':''}>{label}</button>)}</div>
      <div className="history-table"><Table><TableHeader><TableRow>{['Transaction / type','Date','Wallets','Portfolio change','ADA / trade price / fee'].map(t=><TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{shown.slice(page*100,(page+1)*100).map(t=><Transaction key={t.tx_hash} tx={t} fact={snapshot?.facts[t.tx_hash]} wallets={displayWallets} markets={snapshot?.markets||{}} history={snapshot?.history||{}}/>)}</TableBody></Table></div>{!shown.length&&<p className="empty">{busy?'Loading transactions…':'No matching transactions.'}</p>}
      <Pagination className="mt-4"><PaginationContent><PaginationItem><button className="action" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button></PaginationItem><PaginationItem><span className="small px-3">Page {page+1} / {Math.max(1,Math.ceil(shown.length/100))} · {num(shown.length,0)} transactions</span></PaginationItem><PaginationItem><button className="action" disabled={(page+1)*100>=shown.length} onClick={()=>setPage(p=>p+1)}>Next</button></PaginationItem></PaginationContent></Pagination>
      <p className="small muted table-note">Internal transfers require all inputs and outputs to belong to tracked addresses. Their net change is only the fee. Mixed transactions remain separate. Buy/sell labels are inferred from opposing ADA and token changes; multi-step DEX orders may need further reconciliation.</p>
    </section><footer>Balances: Koios · Token quotes: <a href="https://docs.minswap.org/developer/aggregator-api" target="_blank" rel="noreferrer">Minswap</a> · Daily ADA prices: <a href="https://docs.coinmetrics.io/network-data/network-data-overview/market/price" target="_blank" rel="noreferrer">Coin Metrics</a> · Recent gaps: Coinbase · USD</footer></div>
  </main>;
}

function Metric({label,value,note,tone=''}:{label:string;value:string;note:string;tone?:string}){return <div className="metric"><div className="muted">{label}</div><strong className={tone}>{value}</strong><p className="small muted">{note}</p></div>;}
function Transaction({tx,fact,markets,wallets,history}:{tx:Tx;fact?:Fact;markets:Record<string,Market>;wallets:Wallet[];history:Record<string,number>}){
  const kind=fact?kindOf(fact):null,trade=fact?tradeOf(fact):null;
  const quantity=trade?units(trade.raw,markets[trade.id]?.decimals??fact?.decimals?.[trade.id]):null;
  const daily=history[new Date(tx.block_time*1000).toISOString().slice(0,10)];
  return <TableRow><TableCell><a href={`https://cardanoscan.io/transaction/${tx.tx_hash}`} target="_blank" rel="noreferrer" className="address">{short(tx.tx_hash)} <ExternalLink size={12}/></a><div className={`tx-kind ${kind==='internal'?'internal':''}`}>{kind==='internal'&&<ArrowRightLeft size={14}/>} {trade?`${trade.side==='buy'?'Buy':'Sell'} ${markets[trade.id]?.ticker||assetName(trade.id)} · inferred`:kind?labels[kind]:'Awaiting analysis'}</div></TableCell>
    <TableCell>{new Date(tx.block_time*1000).toLocaleDateString()}<div className="small muted">{new Date(tx.block_time*1000).toLocaleTimeString()}</div></TableCell>
    <TableCell>{[...new Set(fact?.wallets.map(a=>wallets.find(w=>w.address===a)?.label||short(a)))].map(label=><div key={label}>{label}</div>)}</TableCell>
    <TableCell>{fact?<><div className={BigInt(fact.adaRaw)>=0n?'positive':'negative'}>{BigInt(fact.adaRaw)>0n?'+':''}{num(Number(fact.adaRaw)/1e6)} ₳</div>{Object.entries(fact.assets).map(([id,raw])=>{const q=units(raw,markets[id]?.decimals??fact.decimals?.[id]);return <div className="small" key={id}>{BigInt(raw)>0n?'+':''}{q===null?raw+' raw':num(q)} {markets[id]?.ticker||assetName(id)}</div>;})}{fact.internal&&<div className="small muted">Internal transfer · fee only</div>}</>:'—'}</TableCell>
    <TableCell>{fact?.internal?<div className="small muted">Original ADA average preserved</div>:<><div>{daily?'≈ $'+num(daily,6)+' / ADA':'Historical ADA price unavailable'}</div><div className="small muted">{fact&&BigInt(fact.adaRaw)+BigInt(fact.feeRaw||0)>0n?'Receipt-price basis · ':''}Daily UTC market estimate</div></>}{trade&&<><div>{quantity?num(trade.ada/quantity,10)+' ₳ / token':num(trade.ada)+' ₳ consideration'}</div>{daily&&quantity?<div className="small muted">≈ {usd(trade.ada/quantity*daily)} / token · daily USD estimate</div>:<div className="small muted">{!daily?'Historical USD price unavailable':'Token decimals unavailable'}</div>}</>}{fact&&<div className="small muted">{fact.feeRaw!==null?'Fee: '+num(Number(fact.feeRaw)/1e6)+' ₳':'Network fee attribution unknown'}</div>}</TableCell>
  </TableRow>;
}
