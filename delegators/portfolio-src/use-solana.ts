import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {emptySolana,solanaData,nativeWallets,validSolana,validSolanaTransaction,type SolanaData,type SolanaTransaction,type NativeWallet} from './solana';

export function useSolana(stake:string,enabled:boolean){
  const walletKey='tdsp-member-solana-wallets:'+stake,cexKey='tdsp-member-solana-cex:'+stake,dataKey='tdsp-member-solana-data:'+stake;
  const [wallets,setWallets]=useState<NativeWallet[]>([]),[exchanges,setExchanges]=useState<NativeWallet[]>([]),[data,setData]=useState(emptySolana),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const current=useRef(data),controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    setLoaded(false);controller.current?.abort();setError('');setBusy(false);
    if(!enabled){setWallets([]);setExchanges([]);const empty=emptySolana();current.current=empty;setData(empty);return;}
    try{setWallets(nativeWallets(JSON.parse(portfolioSettings.getItem(walletKey)||'[]')));setExchanges(nativeWallets(JSON.parse(portfolioSettings.getItem(cexKey)||'[]')));const saved=solanaData(JSON.parse(portfolioSettings.getItem(dataKey)||'null'));current.current=saved;setData(saved);setLoaded(true);}catch{setError('Solana cache could not be opened.');}
    return()=>controller.current?.abort();
  },[enabled,stake]);
  const scope=wallets.map(w=>w.address).sort().join('|');
  const refresh=useCallback(async()=>{
    if(!enabled||!loaded||!wallets.length)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;const signal=control.signal;
    setBusy(true);setError('');
    async function request(body:object){
      for(let attempt=0;attempt<3;attempt++){
        const r=await portfolioFetch('/solana',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});const result=await r.json();
        if(r.ok)return result;
        if(r.status!==429||attempt===2)throw new Error(result.error||'Solana data unavailable. Saved data is retained.');
        await new Promise<void>((resolve,reject)=>{
          const abort=()=>{clearTimeout(timer);reject(signal.reason);};
          const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},60000);
          signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
        });
      }
    }
    async function persist(next:SolanaData,quote=false){signal.throwIfAborted();const saved={...next,usd:quote?next.usd:current.current.usd};portfolioSettings.setItem(dataKey,JSON.stringify(saved));current.current=saved;setData(saved);await flushVault();signal.throwIfAborted();}
    try{
      const known=new Map(solanaTransactionsForCache(current.current).map(tx=>[tx.hash,tx]));
      const next:SolanaData={...current.current,accounts:Object.fromEntries(wallets.flatMap(w=>current.current.accounts[w.address]?[[w.address,current.current.accounts[w.address]]]:[])),history:{...current.current.history}};
      for(const wallet of wallets){
        const saved=current.current.accounts[wallet.address],rows=new Map((saved?.transactions||[]).map(tx=>[tx.hash,tx]));
        let before:string|undefined,checkpoint=saved?.checkpoint||null,complete=false;
        const seen=new Set<string>();
        for(let page=0;page<100;page++){
          const result=await request({action:'signatures',address:wallet.address,...(before?{before}:{}),...(saved?.checkpoint?{until:saved.checkpoint}:{})});
          if(!Array.isArray(result.signatures)||!result.signatures.every((value:unknown)=>validSolana(value,64))||typeof result.more!=='boolean')throw new Error('Solana data unavailable. Saved data is retained.');
          if(page===0&&result.signatures.length)checkpoint=result.signatures[0];
          for(const hash of result.signatures){
            if(seen.has(hash))throw new Error('Solana data unavailable. Saved data is retained.');seen.add(hash);
            let tx=known.get(hash);
            if(!tx){const response=await request({action:'transaction',address:wallet.address,signature:hash});if(!validSolanaTransaction(response.transaction)||response.transaction.hash!==hash)throw new Error('Solana data unavailable. Saved data is retained.');tx=response.transaction;known.set(hash,tx);}
            rows.set(hash,tx);if(rows.size>100000)throw new Error('Solana history is incomplete. Saved data is retained.');
          }
          if(!result.more){complete=true;break;}
          if(!result.signatures.length)throw new Error('Solana data unavailable. Saved data is retained.');before=result.signatures.at(-1);
        }
        if(!complete)throw new Error('Solana history is incomplete. Saved data is retained.');
        const balance=await request({action:'balance',address:wallet.address});
        if(typeof balance.raw!=='string'||!/^\d{1,30}$/.test(balance.raw)||!Number.isSafeInteger(balance.slot)||balance.slot<0)throw new Error('Solana data unavailable. Saved data is retained.');
        next.accounts[wallet.address]={raw:balance.raw,slot:balance.slot,checkpoint,transactions:[...rows.values()]};
        await persist({...next,accounts:{...next.accounts}});
      }
      const history=await portfolioFetch('/historical-sol-prices',{signal});if(!history.ok)throw new Error('Solana prices unavailable.');const rates=await history.json();
      if(!Array.isArray(rates.prices)||!rates.prices.length)throw new Error('Solana prices unavailable.');
      for(const [time,price] of rates.prices)if(Number.isFinite(time)&&Number.isFinite(price)&&price>0)next.history[new Date(time).toISOString().slice(0,10)]=price;
      await persist({...next,history:{...next.history}});
      const quote=await portfolioFetch('/solana-price',{signal});if(!quote.ok)throw new Error('Solana prices unavailable.');const {usd}=await quote.json();if(!Number.isFinite(usd)||usd<=0)throw new Error('Solana prices unavailable.');
      await persist({...next,usd},true);
    }catch(e){if(!signal.aborted)setError(e instanceof Error?e.message:'Solana data unavailable. Saved data is retained.');}
    finally{if(controller.current===control)setBusy(false);}
  },[enabled,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  useEffect(()=>{
    if(!enabled||!loaded||!wallets.length)return;
    const control=new AbortController();let pending=false;
    const timer=setInterval(async()=>{
      if(pending)return;pending=true;
      try{const response=await portfolioFetch('/solana-price',{signal:control.signal});if(!response.ok)return;const {usd}=await response.json();if(control.signal.aborted||!Number.isFinite(usd)||usd<=0)return;const next={...current.current,usd};portfolioSettings.setItem(dataKey,JSON.stringify(next));current.current=next;setData(next);}catch{/* Keep the last successful quote. */}finally{pending=false;}
    },60000);
    return()=>{clearInterval(timer);control.abort();};
  },[enabled,loaded,scope,stake]);
  function save(next:NativeWallet[],exchangesOnly=false){
    if(!enabled)return false;
    const normalized=nativeWallets(next);if(normalized.length!==next.length){setError('Invalid Solana request.');return false;}
    try{portfolioSettings.setItem(exchangesOnly?cexKey:walletKey,JSON.stringify(normalized));(exchangesOnly?setExchanges:setWallets)(normalized);return true;}catch{setError('Solana settings could not be saved.');return false;}
  }
  return {wallets:enabled?wallets:[],exchanges:enabled?exchanges.filter(e=>!wallets.some(w=>w.address===e.address)):[],data:enabled?data:emptySolana(),busy:enabled&&busy,error:enabled?error:'',refresh,saveWallets:(next:NativeWallet[])=>save(next),saveExchanges:(next:NativeWallet[])=>save(next,true)};
}
function solanaTransactionsForCache(data:SolanaData){return Object.values(data.accounts).flatMap(account=>account.transactions);}
