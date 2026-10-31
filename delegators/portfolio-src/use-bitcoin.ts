import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {bitcoinWallets,bitcoinHash,bitcoinNet,bitcoinTransactions,validBitcoinTransaction,emptyBitcoin,type BitcoinData,type BitcoinWallet,type BitcoinTransaction} from './bitcoin';
import {encodeBitcoinSettings,readBitcoinSettings} from './bitcoin-storage';
import {cachedTransactionProgress,emptyDownloadProgress,type DownloadProgress} from './download-progress';

export function useBitcoin(stake:string,enabled:boolean){
  const walletKey='tdsp-member-bitcoin-wallets:'+stake,cexKey='tdsp-member-bitcoin-cex:'+stake,dataKey='tdsp-member-bitcoin-data:'+stake;
  const [wallets,setWallets]=useState<BitcoinWallet[]>([]),[exchanges,setExchanges]=useState<BitcoinWallet[]>([]),[data,setData]=useState(emptyBitcoin),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [downloadProgress,setDownloadProgress]=useState<DownloadProgress>(emptyDownloadProgress),current=useRef(data),controller=useRef<AbortController|null>(null);
  const scope=wallets.map(w=>w.address).sort().join('|');
  useEffect(()=>{
    controller.current?.abort();setLoaded(false);setBusy(false);setError('');setDownloadProgress(emptyDownloadProgress());
    if(!enabled){setWallets([]);setExchanges([]);current.current=emptyBitcoin();setData(current.current);return;}
    try{
      setWallets(bitcoinWallets(JSON.parse(portfolioSettings.getItem(walletKey)||'[]')));setExchanges(bitcoinWallets(JSON.parse(portfolioSettings.getItem(cexKey)||'[]')));
      current.current=readBitcoinSettings(dataKey,key=>portfolioSettings.getItem(key));setData(current.current);setLoaded(true);
    }catch{setError('Bitcoin cache could not be opened.');}
    return()=>controller.current?.abort();
  },[enabled,stake]);
  const refresh=useCallback(async()=>{
    if(!enabled||!loaded||!wallets.length)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;const signal=control.signal;
    setBusy(true);setError('');
    async function request(body:object){
      const response=await portfolioFetch('/bitcoin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Bitcoin data unavailable. Saved data is retained.');return result;
    }
    try{
      const head=await request({action:'tip'}),tip=head.hash;
      if(!bitcoinHash(tip)||!Number.isSafeInteger(head.height)||head.height<0)throw new Error('Bitcoin data unavailable. Saved data is retained.');
      const next:BitcoinData={...current.current,accounts:{}};
      const reusable=new Map<string,boolean>(),downloaded=new Map<string,BitcoinTransaction>();
      setDownloadProgress(cachedTransactionProgress(bitcoinTransactions(current.current,wallets),tx=>tx.hash));
      for(const wallet of wallets){
        const stats=await request({action:'address',address:wallet.address});
        if(stats.address!==wallet.address||!Number.isSafeInteger(stats.count)||stats.count<0||typeof stats.raw!=='string'||!/^\d{1,16}$/.test(stats.raw))throw new Error('Bitcoin data unavailable. Saved data is retained.');
        const saved=current.current.accounts[wallet.address];
        let reuse=false;
        if(saved){
          if(!reusable.has(saved.tip)){
            const status=await request({action:'block-status',hash:saved.tip});
            if(typeof status.inBestChain!=='boolean')throw new Error('Bitcoin data unavailable. Saved data is retained.');
            reusable.set(saved.tip,status.inBestChain);
          }
          reuse=reusable.get(saved.tip)===true;
        }
        const rows=new Map<string,BitcoinTransaction>(),old=new Map((reuse?saved?.transactions||[]:[]).map(tx=>[tx.hash,tx]));
        let after:string|undefined,reached=false;
        for(;;){
          const page=await request({action:'history',address:wallet.address,...(after?{after}:{})});
          if(!Array.isArray(page.transactions)||!page.transactions.every(validBitcoinTransaction)||typeof page.more!=='boolean')throw new Error('Bitcoin data unavailable. Saved data is retained.');
          for(const tx of page.transactions as BitcoinTransaction[]){
            if(rows.has(tx.hash)||![...tx.inputs,...tx.outputs].some(row=>row.address===wallet.address))throw new Error('Bitcoin data unavailable. Saved data is retained.');
            rows.set(tx.hash,tx);downloaded.set(tx.hash,tx);
            if(old.has(tx.hash)){reached=true;break;}
          }
          setDownloadProgress(cachedTransactionProgress([...downloaded.values()],tx=>tx.hash));
          if(reached||!page.more)break;
          if(!page.transactions.length)throw new Error('Bitcoin data unavailable. Saved data is retained.');
          after=page.transactions.at(-1).hash;
        }
        if(reached)for(const [hash,tx] of old)if(!rows.has(hash))rows.set(hash,tx);
        const transactions=[...rows.values()];
        if(transactions.length!==stats.count||transactions.reduce((sum,tx)=>sum+bitcoinNet(tx,[wallet]),0n)!==BigInt(stats.raw))throw new Error('Bitcoin history changed during refresh. Retry.');
        const anchored=transactions.filter(tx=>tx.height<=head.height);
        next.accounts[wallet.address]={raw:String(anchored.reduce((sum,tx)=>sum+bitcoinNet(tx,[wallet]),0n)),tip,transactions:anchored};
      }
      if((await request({action:'block-status',hash:tip})).inBestChain!==true)throw new Error('Bitcoin history changed during refresh. Retry.');
      // Commit all owned addresses together, so shared transactions and balances stay coherent.
      const persist=async()=>{
        signal.throwIfAborted();const settings=encodeBitcoinSettings(dataKey,next);
        portfolioSettings.setItems(settings,portfolioSettings.keys().filter(key=>key.startsWith(dataKey+'::')&&!Object.hasOwn(settings,key)));
        await flushVault();signal.throwIfAborted();current.current=next;setData({...next});
      };
      await persist();setDownloadProgress(cachedTransactionProgress(bitcoinTransactions(next,wallets),tx=>tx.hash));
      const rates=await portfolioFetch('/historical-btc-prices',{signal});if(!rates.ok)throw new Error('Bitcoin prices unavailable.');
      const history=await rates.json();if(!Array.isArray(history.prices)||!history.prices.length)throw new Error('Bitcoin prices unavailable.');
      next.history={...next.history};
      for(const [time,price] of history.prices)if(Number.isFinite(time)&&Math.abs(time)<8640000000000000&&Number.isFinite(price)&&price>0)next.history[new Date(time).toISOString().slice(0,10)]=price;
      const quote=await portfolioFetch('/bitcoin-price',{signal});if(!quote.ok){await persist();throw new Error('Bitcoin prices unavailable.');}
      const {usd}=await quote.json();if(!Number.isFinite(usd)||usd<=0)throw new Error('Bitcoin prices unavailable.');next.usd=usd;await persist();
    }catch(reason){if(!signal.aborted){setError(reason instanceof Error?reason.message:'Bitcoin data unavailable. Saved data is retained.');setDownloadProgress(cachedTransactionProgress(bitcoinTransactions(current.current,wallets),tx=>tx.hash));}}
    finally{if(controller.current===control)setBusy(false);}
  },[enabled,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  function save(next:BitcoinWallet[],counterparty=false){
    if(!enabled)return false;const normalized=bitcoinWallets(next);
    if(normalized.length!==next.length){setError('Enter a valid Bitcoin mainnet address.');return false;}
    try{portfolioSettings.setItem(counterparty?cexKey:walletKey,JSON.stringify(normalized));(counterparty?setExchanges:setWallets)(normalized);return true;}catch{setError('Bitcoin settings could not be saved.');return false;}
  }
  return {wallets,exchanges:exchanges.filter(row=>!wallets.some(w=>w.address===row.address)),data,busy,error,downloadProgress,refresh,saveWallets:(next:BitcoinWallet[])=>save(next),saveExchanges:(next:BitcoinWallet[])=>save(next,true)};
}
