import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings} from './vault';
import {emptyEthereum,ethereumData,ethereumWallets,validEthereumTransaction,type EthereumData,type EthereumTransaction,type EthereumWallet} from './ethereum';

export function useEthereum(stake:string,ready:boolean){
  const walletKey='tdsp-member-ethereum-wallets:'+stake,cexKey='tdsp-member-ethereum-cex:'+stake,dataKey='tdsp-member-ethereum-data:'+stake;
  const [wallets,setWallets]=useState<EthereumWallet[]>([]),[exchanges,setExchanges]=useState<EthereumWallet[]>([]),[data,setData]=useState<EthereumData>(emptyEthereum);
  const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const current=useRef(data),controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    if(!ready)return;
    try{
      setWallets(ethereumWallets(JSON.parse(portfolioSettings.getItem(walletKey)||'[]')));
      setExchanges(ethereumWallets(JSON.parse(portfolioSettings.getItem(cexKey)||'[]')));
      const saved=ethereumData(JSON.parse(portfolioSettings.getItem(dataKey)||'null'));current.current=saved;setData(saved);setLoaded(true);
    }catch{setError('Ethereum cache could not be opened.');}
    return()=>controller.current?.abort();
  },[ready,stake]);
  const scope=wallets.map(w=>w.address).sort().join('|');
  const refresh=useCallback(async()=>{
    if(!ready||!loaded||!wallets.length)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;
    const signal=control.signal;
    setBusy(true);setError('');setStatus('Checking Ethereum transactions…');
    async function request<T>(body:object):Promise<T>{
      const r=await portfolioFetch('/ethereum',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
      const result=await r.json();if(!r.ok)throw new Error(result.error||'Ethereum refresh failed. Saved data is retained.');return result;
    }
    try{
      const {block}=await request<{block:number}>({action:'head'});
      if(!Number.isSafeInteger(block)||block<0)throw new Error('Invalid Ethereum block response.');
      const next: EthereumData={...current.current,accounts:{},history:{...current.current.history}};
      for(const [index,wallet] of wallets.entries()){
        setStatus('Checking Ethereum transactions…');
        const previous=current.current.accounts[wallet.address];
        const startBlock=previous?Math.max(0,Math.min(previous.block,block)-64):0;
        const transactions=new Map((previous?.transactions||[]).filter(tx=>tx.block<startBlock).map(tx=>[tx.id,tx]));
        for(const kind of ['normal','internal'] as const){
          let complete=false;
          for(let page=1;page<=100;page++){
            const result=await request<{transactions:EthereumTransaction[];more:boolean}>({action:'history',address:wallet.address,kind,page,startBlock,endBlock:block});
            if(!Array.isArray(result.transactions)||!result.transactions.every(validEthereumTransaction)||typeof result.more!=='boolean')throw new Error('Invalid Ethereum history response.');
            for(const tx of result.transactions)transactions.set(tx.id,tx);
            if(transactions.size>100000)throw new Error('Ethereum history is too large. Saved data is retained.');
            if(!result.more){complete=true;break;}
          }
          if(!complete)throw new Error('Ethereum history is incomplete. Saved data is retained.');
        }
        const {balanceWei}=await request<{balanceWei:string}>({action:'balance',address:wallet.address});
        if(typeof balanceWei!=='string'||!/^\d{1,80}$/.test(balanceWei))throw new Error('Invalid Ethereum balance response.');
        next.accounts[wallet.address]={balanceWei,block,transactions:[...transactions.values()]};
        setStatus(`${index+1} / ${wallets.length}`);
      }
      // Commit complete history before quotes: a pricing outage must not trigger another full scan.
      next.updated=new Date().toISOString();signal.throwIfAborted();
      portfolioSettings.setItem(dataKey,JSON.stringify(next));current.current=next;setData(next);
      const history=await portfolioFetch('/historical-eth-prices',{signal});
      if(!history.ok)throw new Error('Historical Ethereum prices unavailable.');
      const rates=await history.json();
      if(!Array.isArray(rates.prices)||!rates.prices.length)throw new Error('Historical Ethereum prices unavailable.');
      const priced: EthereumData={...next,history:{...next.history}};
      for(const [time,price] of rates.prices)if(Number.isFinite(time)&&Number.isFinite(price)&&price>0)priced.history[new Date(time).toISOString().slice(0,10)]=price;
      const quote=await portfolioFetch('/ethereum-price',{signal});
      if(!quote.ok)throw new Error('Current Ethereum price unavailable.');
      const {usd}=await quote.json();
      if(typeof usd!=='number'||!Number.isFinite(usd)||usd<=0)throw new Error('Current Ethereum price unavailable.');
      priced.usd=usd;priced.updated=new Date().toISOString();signal.throwIfAborted();
      portfolioSettings.setItem(dataKey,JSON.stringify(priced));current.current=priced;setData(priced);setStatus('');
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Ethereum refresh failed. Saved data is retained.');setStatus('');}}
    finally{if(controller.current===control)setBusy(false);}
  },[ready,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  useEffect(()=>{
    if(!loaded||!wallets.length||busy)return;
    const control=new AbortController();let pending=false;
    const timer=setInterval(async()=>{
      if(pending)return;pending=true;
      try{
        const response=await portfolioFetch('/ethereum-price',{signal:control.signal});
        if(!response.ok)return;
        const {usd}=await response.json();
        if(control.signal.aborted||typeof usd!=='number'||!Number.isFinite(usd)||usd<=0)return;
        const next={...current.current,usd};
        current.current=next;setData(next);
      }catch{/* Retain the last successful quote. */}finally{pending=false;}
    },60000);
    return()=>{clearInterval(timer);control.abort();};
  },[loaded,scope,busy,stake]);
  function saveWallets(next:EthereumWallet[]){
    const normalized=ethereumWallets(next);
    try{portfolioSettings.setItem(walletKey,JSON.stringify(normalized));setWallets(normalized);return true;}
    catch{setError('Ethereum wallet settings could not be saved.');return false;}
  }
  function saveExchanges(next:EthereumWallet[]){
    try{const normalized=ethereumWallets(next);portfolioSettings.setItem(cexKey,JSON.stringify(normalized));setExchanges(normalized);return true;}
    catch{setError('Ethereum wallet settings could not be saved.');return false;}
  }
  return {wallets,exchanges:exchanges.filter(e=>!wallets.some(w=>w.address===e.address)),data,busy,error,status,refresh,saveWallets,saveExchanges};
}
