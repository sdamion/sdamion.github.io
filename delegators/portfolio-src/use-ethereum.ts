import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {emptyEthereum,ethereumData,ethereumWallets,validEthereumTransaction,type EthereumData,type EthereumTransaction,type EthereumWallet,type EthereumProvider} from './ethereum';

export function useEthereum(stake:string,ready:boolean){
  const walletKey='tdsp-member-ethereum-wallets:'+stake,cexKey='tdsp-member-ethereum-cex:'+stake,dataKey='tdsp-member-ethereum-data:'+stake;
  const [wallets,setWallets]=useState<EthereumWallet[]>([]),[exchanges,setExchanges]=useState<EthereumWallet[]>([]),[data,setData]=useState<EthereumData>(emptyEthereum);
  const [loadedStake,setLoadedStake]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const loaded=loadedStake===stake;
  const current=useRef(data),controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    if(!ready){setLoadedStake(null);return;}
    try{
      setWallets(ethereumWallets(JSON.parse(portfolioSettings.getItem(walletKey)||'[]')));
      setExchanges(ethereumWallets(JSON.parse(portfolioSettings.getItem(cexKey)||'[]')));
      const saved=ethereumData(JSON.parse(portfolioSettings.getItem(dataKey)||'null'));current.current=saved;setData(saved);setLoadedStake(stake);
    }catch{setError('Ethereum cache could not be opened.');}
    return()=>controller.current?.abort();
  },[ready,stake]);
  const scope=wallets.map(w=>w.address).sort().join('|');
  const refresh=useCallback(async()=>{
    if(!ready||!loaded||!wallets.length)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;
    const signal=control.signal;
    setBusy(true);setError('');setStatus('Checking Ethereum transactions…');
    let provider:EthereumProvider|undefined;
    const completedRanges=new Map<string,EthereumTransaction[]>();
    async function request<T>(body:object):Promise<T>{
      const r=await portfolioFetch('/ethereum',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,...(provider?{provider}:{})}),signal});
      const result=await r.json();if(!r.ok)throw Object.assign(new Error(result.error||'Ethereum refresh failed. Saved data is retained.'),{status:r.status,code:result.code==='indexing_incomplete'?'indexing_incomplete':undefined});
      if(result.provider!==undefined){
        if(!['etherscan','blockscout'].includes(result.provider)||provider&&provider!==result.provider)throw new Error('Invalid Ethereum provider response.');
        provider=result.provider;
      }
      return result;
    }
    async function scan(){
      const {block}=await request<{block:number}>({action:'head'});
      if(!Number.isSafeInteger(block)||block<0)throw new Error('Invalid Ethereum block response.');
      const next: EthereumData={...current.current,accounts:Object.fromEntries(wallets.flatMap(wallet=>current.current.accounts[wallet.address]?[[wallet.address,current.current.accounts[wallet.address]]]:[])),history:{...current.current.history}};
      const changingProvider=wallets.some(w=>{
        const account=current.current.accounts[w.address];
        return account&&(account.provider||'etherscan')!==(provider||'etherscan');
      });
      async function persist(value:EthereumData,quote=false){
        signal.throwIfAborted();
        const saved={...value,usd:quote?value.usd:current.current.usd,accounts:{...value.accounts},history:{...value.history},updated:new Date().toISOString()};
        portfolioSettings.setItem(dataKey,JSON.stringify(saved));current.current=saved;setData(saved);
        await flushVault();signal.throwIfAborted();
      }
      for(const [index,wallet] of wallets.entries()){
        setStatus('Checking Ethereum transactions…');
        const cached=current.current.accounts[wallet.address];
        // Complete older block ranges remain valid when the provider changes.
        const previous=cached;
        const startBlock=previous?Math.max(0,Math.min(previous.block,block)-64):0;
        const transactions=new Map((previous?.transactions||[]).filter(tx=>tx.block<startBlock).map(tx=>[tx.id,tx]));
        for(const kind of ['normal','internal'] as const){
          const rangeKey=`${wallet.address}:${kind}:${startBlock}:${block}`;
          const reused=completedRanges.get(rangeKey);
          if(reused){for(const tx of reused)transactions.set(tx.id,tx);continue;}
          const fetched:EthereumTransaction[]=[];
          let complete=false;
          for(let page=1;page<=100;page++){
            const result=await request<{transactions:EthereumTransaction[];more:boolean}>({action:'history',address:wallet.address,kind,page,startBlock,endBlock:block});
            if(!Array.isArray(result.transactions)||!result.transactions.every(validEthereumTransaction)||typeof result.more!=='boolean')throw new Error('Invalid Ethereum history response.');
            for(const tx of result.transactions){transactions.set(tx.id,tx);fetched.push(tx);}
            if(transactions.size>100000)throw new Error('Ethereum history is too large. Saved data is retained.');
            if(!result.more){complete=true;break;}
          }
          if(!complete)throw new Error('Ethereum history is incomplete. Saved data is retained.');
          completedRanges.set(rangeKey,fetched);
        }
        const {balanceWei}=await request<{balanceWei:string}>({action:'balance',address:wallet.address});
        if(typeof balanceWei!=='string'||!/^\d{1,80}$/.test(balanceWei))throw new Error('Invalid Ethereum balance response.');
        next.accounts[wallet.address]={balanceWei,block,transactions:[...transactions.values()],provider:provider||'etherscan'};
        // Publish provider changes only after every wallet range is complete.
        if(!changingProvider)await persist(next);
        setStatus(`${index+1} / ${wallets.length}`);
      }
      if(changingProvider)await persist(next);
      const history=await portfolioFetch('/historical-eth-prices',{signal});
      if(!history.ok)throw new Error('Historical Ethereum prices unavailable.');
      const rates=await history.json();
      if(!Array.isArray(rates.prices)||!rates.prices.length)throw new Error('Historical Ethereum prices unavailable.');
      const priced: EthereumData={...next,history:{...next.history}};
      for(const [time,price] of rates.prices)if(Number.isFinite(time)&&Number.isFinite(price)&&price>0)priced.history[new Date(time).toISOString().slice(0,10)]=price;
      // CEX transfer values need historical prices, independently of the current holding quote.
      await persist(priced);
      const quote=await portfolioFetch('/ethereum-price',{signal});
      if(!quote.ok)throw new Error('Current Ethereum price unavailable.');
      const {usd}=await quote.json();
      if(typeof usd!=='number'||!Number.isFinite(usd)||usd<=0)throw new Error('Current Ethereum price unavailable.');
      priced.usd=usd;await persist(priced,true);setStatus('');
    }
    try{
      try {await scan();}
      catch(e){
        if(signal.aborted)throw e;
        let failure=e;
        if(provider!=='blockscout'&&(e as {status?:number}).status===429){
          provider='blockscout';
          try{await scan();return;}catch(fallback){if(signal.aborted)throw fallback;failure=fallback;}
        }
        // Retry missing ranges; partial Blockscout pages never enter the cache.
        if(provider==='blockscout'&&(failure as {code?:string}).code==='indexing_incomplete'){
          provider='etherscan';
          try{await scan();return;}catch(recovery){if(signal.aborted)throw recovery;}
        }
        throw failure;
      }
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Ethereum refresh failed. Saved data is retained.');setStatus('');}}
    finally{if(controller.current===control)setBusy(false);}
  },[ready,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  useEffect(()=>{
    if(!ready||!loaded||!wallets.length)return;
    const control=new AbortController();let pending=false;
    const updateQuote=async()=>{
      if(pending)return;pending=true;
      try{
        const response=await portfolioFetch('/ethereum-price',{signal:control.signal});
        if(!response.ok)return;
        const {usd}=await response.json();
        if(control.signal.aborted||typeof usd!=='number'||!Number.isFinite(usd)||usd<=0)return;
        const next={...current.current,usd};
        portfolioSettings.setItem(dataKey,JSON.stringify(next));
        current.current=next;setData(next);
      }catch{/* Retain the last successful quote. */}finally{pending=false;}
    };
    void updateQuote();
    const timer=setInterval(()=>void updateQuote(),60000);
    return()=>{clearInterval(timer);control.abort();};
  },[ready,loaded,scope,stake]);
  function saveWallets(next:EthereumWallet[]){
    const normalized=ethereumWallets(next);
    if(next.length>20){setError('A maximum of 20 Ethereum addresses can be added.');return false;}
    try{portfolioSettings.setItem(walletKey,JSON.stringify(normalized));setWallets(normalized);return true;}
    catch{setError('Ethereum wallet settings could not be saved.');return false;}
  }
  function saveExchanges(next:EthereumWallet[]){
    try{const normalized=ethereumWallets(next);portfolioSettings.setItem(cexKey,JSON.stringify(normalized));setExchanges(normalized);return true;}
    catch{setError('Ethereum wallet settings could not be saved.');return false;}
  }
  return {wallets,exchanges:exchanges.filter(e=>!wallets.some(w=>w.address===e.address)),data,busy,error,status,refresh,saveWallets,saveExchanges};
}
