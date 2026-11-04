import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {bitcoinWallets,bitcoinHash,bitcoinNet,bitcoinTransactions,validBitcoinTransaction,emptyBitcoin,type BitcoinAccount,type BitcoinData,type BitcoinWallet,type BitcoinTransaction} from './bitcoin';
import {encodeBitcoinSettings,readBitcoinSettings} from './bitcoin-storage';
import {cachedTransactionProgress,createTransactionProgress,emptyDownloadProgress,type DownloadProgress} from './download-progress';
import {depositScanWallets} from './deposit-tracking';
import {scanProviderPages} from './provider-scan';

function cachedBitcoinRows(data:BitcoinData,wallets:BitcoinWallet[]){
  const addresses=new Set(wallets.map(wallet=>wallet.address));
  return [...bitcoinTransactions(data,wallets),...(data.pending||[]).filter(tx=>[...tx.inputs,...tx.outputs].some(row=>addresses.has(row.address)))];
}

export function useBitcoin(stake:string,enabled:boolean){
  const walletKey='tdsp-member-bitcoin-wallets:'+stake,cexKey='tdsp-member-bitcoin-cex:'+stake,dataKey='tdsp-member-bitcoin-data:'+stake;
  const [wallets,setWallets]=useState<BitcoinWallet[]>([]),[exchanges,setExchanges]=useState<BitcoinWallet[]>([]),[data,setData]=useState(emptyBitcoin),[loadedStake,setLoadedStake]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [downloadProgress,setDownloadProgress]=useState<DownloadProgress>(emptyDownloadProgress),current=useRef(data),controller=useRef<AbortController|null>(null);
  const loaded=loadedStake===stake;
  const scanWallets=depositScanWallets(wallets,exchanges),scope=scanWallets.map(w=>w.address+':'+(w.deposit?'deposit':'own')).sort().join('|');
  useEffect(()=>{
    controller.current?.abort();setLoadedStake(null);setBusy(false);setError('');setDownloadProgress(emptyDownloadProgress());
    if(!enabled){setWallets([]);setExchanges([]);current.current=emptyBitcoin();setData(current.current);return;}
    try{
      const savedWallets=bitcoinWallets(JSON.parse(portfolioSettings.getItem(walletKey)||'[]'));
      const savedExchanges=bitcoinWallets(JSON.parse(portfolioSettings.getItem(cexKey)||'[]'));
      current.current=readBitcoinSettings(dataKey,key=>portfolioSettings.getItem(key));
      setWallets(savedWallets);setExchanges(savedExchanges);setData(current.current);
      setDownloadProgress(cachedTransactionProgress(cachedBitcoinRows(current.current,depositScanWallets(savedWallets,savedExchanges)),tx=>tx.hash));
      setLoadedStake(stake);
    }catch{setError('Bitcoin cache could not be opened.');}
    return()=>controller.current?.abort();
  },[enabled,stake]);
  const refresh=useCallback(async()=>{
    if(!enabled||!loaded||!scanWallets.length)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;const signal=control.signal;
    setBusy(true);setError('');
    async function request(body:object){
      const response=await portfolioFetch('/bitcoin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Bitcoin data unavailable. Saved data is retained.');return result;
    }
    const next:BitcoinData={...current.current,accounts:{...current.current.accounts}},pending=new Map((current.current.pending||[]).map(tx=>[tx.hash,tx])),staged=new Map<string,BitcoinAccount>();
    let pendingDirty=false;
    const newPending=new Set<string>();
    const publishPending=()=>{
      signal.throwIfAborted();
      const completed=new Set(Object.values(next.accounts).flatMap(account=>account.transactions.map(tx=>tx.hash)));
      next.pending=[...pending.values()].filter(tx=>!completed.has(tx.hash));
      setData({...next,accounts:{...next.accounts}});
    };
    const persist=async()=>{
      signal.throwIfAborted();publishPending();const settings=encodeBitcoinSettings(dataKey,next);
      portfolioSettings.setItems(settings,portfolioSettings.keys().filter(key=>key.startsWith(dataKey+'::')&&!Object.hasOwn(settings,key)));
      await flushVault();signal.throwIfAborted();current.current={...next,accounts:{...next.accounts}};setData(current.current);
    };
    try{
      const head=await request({action:'tip'}),tip=head.hash;
      if(!bitcoinHash(tip)||!Number.isSafeInteger(head.height)||head.height<0)throw new Error('Bitcoin data unavailable. Saved data is retained.');
      const reusable=new Map<string,boolean>();
      const saved=cachedBitcoinRows(current.current,scanWallets);
      const progress=createTransactionProgress(saved,tx=>tx.hash);
      setDownloadProgress(cachedTransactionProgress(saved,tx=>tx.hash));
      for(const wallet of scanWallets){
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
        let reached=false;
        await scanProviderPages<{transactions:BitcoinTransaction[];more:boolean},string>({
          signal,error:'Bitcoin data unavailable. Saved data is retained.',
          fetchPage:after=>request({action:'history',address:wallet.address,...(after?{after}:{})}),
          validPage:(value):value is {transactions:BitcoinTransaction[];more:boolean}=>{
            const page=value as {transactions?:unknown;more?:unknown};
            return !!page&&Array.isArray(page.transactions)&&page.transactions.every(validBitcoinTransaction)&&typeof page.more==='boolean';
          },
          hasMore:page=>page.more,
          nextCursor:page=>{if(!page.transactions.length)throw new Error('Bitcoin data unavailable. Saved data is retained.');return page.transactions.at(-1)!.hash;},
          onPage:page=>{
            for(const tx of page.transactions){
              if(rows.has(tx.hash)||![...tx.inputs,...tx.outputs].some(row=>row.address===wallet.address))throw new Error('Bitcoin data unavailable. Saved data is retained.');
              rows.set(tx.hash,tx);if(tx.height<=head.height){if(!pending.has(tx.hash)){pendingDirty=true;newPending.add(tx.hash);}pending.set(tx.hash,tx);}
              if(old.has(tx.hash)){reached=true;break;}
            }
            publishPending();setDownloadProgress(progress.add(rows.values()));
            return reached;
          }
        });
        if(reached)for(const [hash,tx] of old)if(!rows.has(hash))rows.set(hash,tx);
        const transactions=[...rows.values()];
        if(transactions.length!==stats.count||transactions.reduce((sum,tx)=>sum+bitcoinNet(tx,[wallet]),0n)!==BigInt(stats.raw))throw new Error('Bitcoin history changed during refresh. Retry.');
        const anchored=transactions.filter(tx=>tx.height<=head.height);
        staged.set(wallet.address,{raw:String(anchored.reduce((sum,tx)=>sum+bitcoinNet(tx,[wallet]),0n)),tip,transactions:anchored});
      }
      if((await request({action:'block-status',hash:tip})).inBestChain!==true){
        for(const hash of newPending)pending.delete(hash);
        pendingDirty=false;setData(current.current);
        throw new Error('Bitcoin history changed during refresh. Retry.');
      }
      for(const [address,account] of staged)next.accounts[address]=account;
      pending.clear();
      await persist();setDownloadProgress(progress.complete(bitcoinTransactions(next,scanWallets)));
      const rates=await portfolioFetch('/historical-btc-prices',{signal});if(!rates.ok)throw new Error('Bitcoin prices unavailable.');
      const history=await rates.json();if(!Array.isArray(history.prices)||!history.prices.length)throw new Error('Bitcoin prices unavailable.');
      next.history={...next.history};
      for(const [time,price] of history.prices)if(Number.isFinite(time)&&Math.abs(time)<8640000000000000&&Number.isFinite(price)&&price>0)next.history[new Date(time).toISOString().slice(0,10)]=price;
      const quote=await portfolioFetch('/bitcoin-price',{signal});if(!quote.ok){await persist();throw new Error('Bitcoin prices unavailable.');}
      const {usd}=await quote.json();if(!Number.isFinite(usd)||usd<=0)throw new Error('Bitcoin prices unavailable.');next.usd=usd;await persist();
    }catch(reason){if(!signal.aborted){
      if(pendingDirty)try{await persist();}catch{/* Preserve the original fetch error and last saved history. */}
      setError(reason instanceof Error?reason.message:'Bitcoin data unavailable. Saved data is retained.');
      setDownloadProgress(cachedTransactionProgress(cachedBitcoinRows(current.current,scanWallets),tx=>tx.hash));
    }}
    finally{if(controller.current===control)setBusy(false);}
  },[enabled,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  function save(next:BitcoinWallet[],counterparty=false){
    if(!enabled||!loaded)return false;const normalized=bitcoinWallets(next);
    if(normalized.length!==next.length){setError('Enter a valid Bitcoin mainnet address.');return false;}
    try{portfolioSettings.setItem(counterparty?cexKey:walletKey,JSON.stringify(normalized));(counterparty?setExchanges:setWallets)(normalized);return true;}catch{setError('Bitcoin settings could not be saved.');return false;}
  }
  return {wallets:enabled&&loaded?wallets:[],exchanges:enabled&&loaded?exchanges.filter(row=>!wallets.some(w=>w.address===row.address)):[],data:enabled&&loaded?data:emptyBitcoin(),busy:enabled&&loaded&&busy,error:enabled?error:'',downloadProgress:enabled&&loaded?downloadProgress:emptyDownloadProgress(),refresh,saveWallets:(next:BitcoinWallet[])=>save(next),saveExchanges:(next:BitcoinWallet[])=>save(next,true)};
}
