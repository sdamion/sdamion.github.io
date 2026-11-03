import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {emptyEthereum,ethereumWallets,ethereumScanWallets,type EthereumData,type EthereumTransaction,type EthereumWallet,type EthereumProvider} from './ethereum';
import {ethereumHistory,type EthereumHistoryCheckpoints} from './ethereum-history';
import {ethereumRequest} from './ethereum-request';
import {encodeEthereumSettings,readEthereumSettings} from './ethereum-storage';
import {cachedTransactionProgress,createTransactionProgress,emptyDownloadProgress,type DownloadProgress} from './download-progress';
import {encodeEthereumScanCheckpoint,readEthereumScanCheckpoints} from './ethereum-scan-storage';
import {ethereumScanStart} from './ethereum-finality';

export function useEthereum(stake:string,ready:boolean){
  const walletKey='tdsp-member-ethereum-wallets:'+stake,cexKey='tdsp-member-ethereum-cex:'+stake,dataKey='tdsp-member-ethereum-data:'+stake;
  const scanKey=dataKey+'::scan';
  const [wallets,setWallets]=useState<EthereumWallet[]>([]),[exchanges,setExchanges]=useState<EthereumWallet[]>([]),[data,setData]=useState<EthereumData>(emptyEthereum);
  const [pending,setPending]=useState<EthereumTransaction[]>([]),pendingRef=useRef(new Map<string,EthereumTransaction>());
  const [loadedStake,setLoadedStake]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const loaded=loadedStake===stake;
  const trackedWallets=ethereumScanWallets(wallets,exchanges);
  const relevant=(wallet:EthereumWallet,rows:EthereumTransaction[])=>wallet.deposit?rows.filter(tx=>!tx.failed&&tx.to===wallet.address&&BigInt(tx.valueWei)>0n):rows;
  const [downloadProgress,setDownloadProgress]=useState<DownloadProgress>(emptyDownloadProgress);
  function saveData(value:EthereumData){
    const settings=encodeEthereumSettings(dataKey,value);
    if(Object.keys(settings).length===1&&!portfolioSettings.getItem(dataKey)?.includes('"storageVersion":')){
      portfolioSettings.setItem(dataKey,settings[dataKey]);return;
    }
    portfolioSettings.setItems(settings,portfolioSettings.keys().filter(key=>key.startsWith(dataKey+'::')&&!key.startsWith(scanKey+'::')&&!Object.hasOwn(settings,key)));
  }
  const current=useRef(data),controller=useRef<AbortController|null>(null);
  const historyCheckpoints=useRef(new Map<string,EthereumHistoryCheckpoints>());
  useEffect(()=>{
    pendingRef.current.clear();setPending([]);
    if(!ready){controller.current?.abort();setLoadedStake(null);setWallets([]);setExchanges([]);const empty=emptyEthereum();current.current=empty;setData(empty);setBusy(false);setError('');setStatus('');return;}
    try{
      const savedWallets=ethereumWallets(JSON.parse(portfolioSettings.getItem(walletKey)||'[]'));
      setWallets(savedWallets);
      const savedExchanges=ethereumWallets(JSON.parse(portfolioSettings.getItem(cexKey)||'[]'));setExchanges(savedExchanges);
      const saved=readEthereumSettings(dataKey,key=>portfolioSettings.getItem(key),new Set(ethereumScanWallets(savedWallets,savedExchanges).map(wallet=>wallet.address)));current.current=saved;setData(saved);setLoadedStake(stake);
    }catch{setError('Ethereum cache could not be opened.');}
    return()=>controller.current?.abort();
  },[ready,stake]);
  const scope=trackedWallets.map(w=>w.address+':'+(w.deposit?'deposit':'owned')).sort().join('|');
  function savedTransactions(){
    const addresses=new Set(trackedWallets.map(wallet=>wallet.address));
    const rows=trackedWallets.flatMap(wallet=>relevant(wallet,current.current.accounts[wallet.address]?.transactions||[]));
    for(const [scope,ranges] of historyCheckpoints.current){
      if(!addresses.has(scope.split(':')[0]))continue;
      const wallet=trackedWallets.find(wallet=>wallet.address===scope.split(':')[0])!;
      for(const range of ranges.values())for(const tx of relevant(wallet,range.transactions))rows.push(tx);
    }
    return rows;
  }
  useEffect(()=>{
    historyCheckpoints.current.clear();
    if(ready)try{
      historyCheckpoints.current=readEthereumScanCheckpoints(scanKey,portfolioSettings.keys(),key=>portfolioSettings.getItem(key));
      const addresses=new Set(trackedWallets.map(wallet=>wallet.address));
      const completed=new Set(Object.values(current.current.accounts).flatMap(account=>account.transactions.map(tx=>tx.id)));
      pendingRef.current=new Map([...historyCheckpoints.current].filter(([scope])=>addresses.has(scope.split(':')[0])).flatMap(([,ranges])=>[...ranges.values()].flatMap(range=>range.transactions)).filter(tx=>!completed.has(tx.id)).map(tx=>[tx.id,tx]));
      setPending([...pendingRef.current.values()]);
    }catch{setError('Ethereum scan checkpoint could not be opened. Saved data is retained.');}
    setDownloadProgress(ready&&loaded&&trackedWallets.length?cachedTransactionProgress(savedTransactions(),tx=>tx.id):emptyDownloadProgress());
  },[ready,loaded,stake,scope]);
  const refresh=useCallback(async()=>{
    if(!ready||!loaded||!trackedWallets.length)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;
    const signal=control.signal;
    const saved=savedTransactions();
    const progress=createTransactionProgress(saved,tx=>tx.id);
    const completedIds=new Set(Object.values(current.current.accounts).flatMap(account=>account.transactions.map(tx=>tx.id)));
    setDownloadProgress(cachedTransactionProgress(saved,tx=>tx.id));
    function countTransactions(transactions:EthereumTransaction[]){
      signal.throwIfAborted();
      for(const tx of transactions)if(!completedIds.has(tx.id))pendingRef.current.set(tx.id,tx);
      setPending([...pendingRef.current.values()]);
      setDownloadProgress(progress.add(transactions));
    }
    setBusy(true);setError('');setStatus('Checking Ethereum transactions…');
    let provider:EthereumProvider|undefined;
    const completedRanges=new Map<string,EthereumTransaction[]>();
    async function request<T>(body:object):Promise<T>{
      const result=await ethereumRequest<any>(()=>portfolioFetch('/ethereum',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,...(provider?{provider}:{})}),signal}),signal);
      if(result.provider!==undefined){
        if(!['etherscan','blockscout'].includes(result.provider)||provider&&provider!==result.provider)throw new Error('Invalid Ethereum provider response.');
        provider=result.provider;
      }
      return result;
    }
    async function scan(){
      const {block,finalizedBlock}=await request<{block:number;finalizedBlock?:number|null}>({action:'head',finality:true});
      ethereumScanStart(undefined,block,finalizedBlock);
      const next: EthereumData={...current.current,accounts:Object.fromEntries(trackedWallets.flatMap(wallet=>current.current.accounts[wallet.address]?[[wallet.address,current.current.accounts[wallet.address]]]:[])),history:{...current.current.history}};
      const changingProvider=trackedWallets.some(w=>{
        const account=current.current.accounts[w.address];
        return account&&(account.provider||'etherscan')!==(provider||'etherscan');
      });
      async function persist(value:EthereumData,quote=false){
        signal.throwIfAborted();
        const saved={...value,usd:quote?value.usd:current.current.usd,accounts:{...value.accounts},history:{...value.history},updated:new Date().toISOString()};
        saveData(saved);current.current=saved;setData(saved);
        for(const account of Object.values(saved.accounts))for(const tx of account.transactions){completedIds.add(tx.id);pendingRef.current.delete(tx.id);}
        setPending([...pendingRef.current.values()]);
        await flushVault();signal.throwIfAborted();
      }
      for(const [index,wallet] of trackedWallets.entries()){
        setStatus('Checking Ethereum transactions…');
        const cached=current.current.accounts[wallet.address];
        // Complete older block ranges remain valid when the provider changes.
        const previous=cached;
        const startBlock=ethereumScanStart(previous,block,finalizedBlock);
        const transactions=new Map((previous?.transactions||[]).filter(tx=>tx.block<startBlock).map(tx=>[tx.id,tx]));
        for(const kind of ['normal','internal'] as const){
          if(startBlock>block)continue;
          const rangeKey=`${wallet.address}:${kind}:${startBlock}:${block}`;
          const reused=completedRanges.get(rangeKey);
          if(reused){for(const tx of reused)transactions.set(tx.id,tx);continue;}
          const checkpointKey=`${wallet.address}:${kind}:${provider||'etherscan'}:${startBlock}`;
          let checkpoints=historyCheckpoints.current.get(checkpointKey);
          if(!checkpoints){checkpoints=new Map();historyCheckpoints.current.set(checkpointKey,checkpoints);}
          // Missing RPC finality must never promote an unverified block to a durable prefix.
          const safeBlock=finalizedBlock??previous?.finalizedBlock??-1;
          for(const [key,range] of checkpoints)if(range.endBlock>safeBlock){
            checkpoints.delete(key);
            if(range.startBlock<=safeBlock)checkpoints.set(`${range.startBlock}:${safeBlock}`,{...range,endBlock:safeBlock,transactions:range.transactions.filter(tx=>tx.block<=safeBlock)});
          }
          const fetched=await ethereumHistory({startBlock,endBlock:block},range=>request({action:'history',address:wallet.address,kind,...range}),checkpoints,Infinity,Infinity,rows=>countTransactions(relevant(wallet,rows)),async range=>{
            signal.throwIfAborted();
            // Only finalized ranges can be reused after a restart.
            const endBlock=Math.min(range.endBlock,safeBlock);
            if(endBlock<range.startBlock)return;
            const values=encodeEthereumScanCheckpoint(scanKey,checkpointKey,{...range,endBlock,transactions:range.transactions.filter(tx=>tx.block<=endBlock)});
            const partPrefix=`${scanKey}::${checkpointKey}::${range.startBlock}::`;
            portfolioSettings.setItems(values,portfolioSettings.keys().filter(key=>key.startsWith(partPrefix)&&!Object.hasOwn(values,key)));
            await flushVault();signal.throwIfAborted();
          });
          for(const tx of fetched)transactions.set(tx.id,tx);
          completedRanges.set(rangeKey,fetched);
        }
        const {balanceWei}=await request<{balanceWei:string}>({action:'balance',address:wallet.address});
        if(typeof balanceWei!=='string'||!/^\d{1,80}$/.test(balanceWei))throw new Error('Invalid Ethereum balance response.');
        next.accounts[wallet.address]={balanceWei,block,finalizedBlock:finalizedBlock??previous?.finalizedBlock,transactions:[...transactions.values()],provider:provider||'etherscan'};
        if(index===trackedWallets.length-1){
          setDownloadProgress(progress.complete(trackedWallets.flatMap(wallet=>relevant(wallet,next.accounts[wallet.address]?.transactions||[]))));
        }
        // Publish provider changes only after every wallet range is complete.
        if(!changingProvider){
          await persist(next);
          portfolioSettings.setItems({},portfolioSettings.keys().filter(key=>key.startsWith(scanKey+'::'+wallet.address+':')));
          for(const key of historyCheckpoints.current.keys())if(key.startsWith(wallet.address+':'))historyCheckpoints.current.delete(key);
        }
        setStatus(`${index+1} / ${trackedWallets.length}`);
      }
      if(changingProvider){await persist(next);portfolioSettings.setItems({},portfolioSettings.keys().filter(key=>trackedWallets.some(wallet=>key.startsWith(scanKey+'::'+wallet.address+':'))));historyCheckpoints.current.clear();}
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
        if(provider!=='blockscout'&&(e as {status?:number}).status===429&&(e as {code?:string}).code!=='portfolio_rate_limit'){
          provider='blockscout';
          try{await scan();return;}catch(fallback){if(signal.aborted)throw fallback;failure=fallback;}
        }
        // Retry missing ranges; partial Blockscout pages never enter the cache.
        if(provider==='blockscout'&&(failure as {code?:string}).code==='indexing_incomplete'){
          provider='etherscan';
          try{await scan();return;}catch(recovery){if(signal.aborted)throw recovery;failure=recovery;}
        }
        throw failure;
      }
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Ethereum refresh failed. Saved data is retained.');setStatus('');}}
    finally{if(controller.current===control)setBusy(false);}
  },[ready,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  useEffect(()=>{
    if(!ready||!loaded||!trackedWallets.length)return;
    const control=new AbortController();let pending=false;
    const updateQuote=async()=>{
      if(pending)return;pending=true;
      try{
        const response=await portfolioFetch('/ethereum-price',{signal:control.signal});
        if(!response.ok)return;
        const {usd}=await response.json();
        if(control.signal.aborted||typeof usd!=='number'||!Number.isFinite(usd)||usd<=0)return;
        const next={...current.current,usd};
        saveData(next);
        current.current=next;setData(next);
      }catch{/* Retain the last successful quote. */}finally{pending=false;}
    };
    void updateQuote();
    const timer=setInterval(()=>void updateQuote(),60000);
    return()=>{clearInterval(timer);control.abort();};
  },[ready,loaded,scope,stake]);
  function saveWallets(next:EthereumWallet[]){
    if(!ready)return false;
    const normalized=ethereumWallets(next);
    if(next.length>20){setError('A maximum of 20 Ethereum addresses can be added.');return false;}
    try{portfolioSettings.setItem(walletKey,JSON.stringify(normalized));setWallets(normalized);return true;}
    catch{setError('Ethereum wallet settings could not be saved.');return false;}
  }
  function saveExchanges(next:EthereumWallet[]){
    if(!ready)return false;
    try{const normalized=ethereumWallets(next);portfolioSettings.setItem(cexKey,JSON.stringify(normalized));setExchanges(normalized);return true;}
    catch{setError('Ethereum wallet settings could not be saved.');return false;}
  }
  return {wallets:ready?wallets.filter(wallet=>wallet.group!=='swap'):[],allWallets:ready?wallets:[],swapWallets:ready?wallets.filter(wallet=>wallet.group==='swap'):[],exchanges:ready?exchanges.filter(e=>!wallets.some(w=>w.address===e.address)):[],data:ready?data:emptyEthereum(),pending:ready&&loaded?pending:[],loaded:ready&&loaded,busy:ready&&busy,error:ready?error:'',status:ready?status:'',downloadProgress:ready?downloadProgress:emptyDownloadProgress(),refresh,saveWallets,saveExchanges};
}
