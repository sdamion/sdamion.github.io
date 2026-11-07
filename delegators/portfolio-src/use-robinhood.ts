import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {emptyEthereum,ethereumData,ethereumScanWallets,type EthereumData,type EthereumTransaction,type EthereumWallet} from './ethereum';
import {encodeEthereumSettings,readEthereumSettings} from './ethereum-storage';
import {scanProviderPages} from './provider-scan';
import {cachedTransactionProgress,emptyDownloadProgress} from './download-progress';
import {assetImageUrl} from './asset-image';

export type RobinhoodNftTransfer={id:string;hash:string;logIndex:number;from:string;to:string;time:number;name:string;image:string|null};
export type RobinhoodTokenTransfer={id:string;hash:string;logIndex:number;from:string;to:string;time:number;name:string;symbol:string;raw:string;decimals:number};
type TransactionPage={cursor:unknown;transactions:EthereumTransaction[]};
type NftPage={cursor:unknown;transfers:RobinhoodNftTransfer[]};
type TokenPage={cursor:unknown;transfers:RobinhoodTokenTransfer[]};
const address=/^0x[0-9a-f]{40}$/;
const hash=/^0x[0-9a-f]{64}$/;

async function request(body:object,signal:AbortSignal){
  const response=await portfolioFetch('/robinhood',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
  const value=await response.json();
  if(!response.ok)throw new Error(value.error||'Robinhood Chain unavailable. Saved data is retained.');
  return value;
}

function validTransfer(value:unknown):value is RobinhoodNftTransfer{
  const row=value as RobinhoodNftTransfer;
  return !!row&&typeof row.id==='string'&&/^robinhood:4663:0x[0-9a-f]{40}:\d+$/.test(row.id)&&hash.test(row.hash)&&
    Number.isSafeInteger(row.logIndex)&&row.logIndex>=0&&address.test(row.from)&&address.test(row.to)&&
    Number.isSafeInteger(row.time)&&row.time>0&&typeof row.name==='string'&&row.name.length<=200&&
    (row.image===null||assetImageUrl(row.image)===row.image);
}
function validTokenTransfer(value:unknown):value is RobinhoodTokenTransfer{
  const row=value as RobinhoodTokenTransfer;
  return !!row&&/^robinhood:4663:0x[0-9a-f]{40}$/.test(row.id)&&hash.test(row.hash)&&Number.isSafeInteger(row.logIndex)&&row.logIndex>=0&&
    address.test(row.from)&&address.test(row.to)&&Number.isSafeInteger(row.time)&&row.time>0&&typeof row.name==='string'&&row.name.length<=200&&
    typeof row.symbol==='string'&&row.symbol.length<=80&&/^\d{1,100}$/.test(row.raw)&&Number.isSafeInteger(row.decimals)&&row.decimals>=0&&row.decimals<=255;
}

export function useRobinhood(stake:string,enabled:boolean,wallets:EthereumWallet[],exchanges:EthereumWallet[]){
  const key='tdsp-member-robinhood-data:'+stake,nftKey='tdsp-member-robinhood-nft-history:'+stake,tokenKey='tdsp-member-robinhood-token-history:'+stake;
  const [data,setData]=useState<EthereumData>(emptyEthereum),[nftHistory,setNftHistory]=useState<Record<string,RobinhoodNftTransfer[]>>({});
  const [tokenHistory,setTokenHistory]=useState<Record<string,RobinhoodTokenTransfer[]>>({});
  const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const current=useRef(data),currentNfts=useRef(nftHistory),currentTokens=useRef(tokenHistory),control=useRef<AbortController|null>(null);
  const tracked=ethereumScanWallets(wallets,exchanges);
  const scope=tracked.map(wallet=>wallet.address+':'+Boolean(wallet.deposit)).sort().join('|');
  useEffect(()=>{
    control.current?.abort();setLoaded(false);setBusy(false);setError('');current.current=emptyEthereum();setData(current.current);currentNfts.current={};setNftHistory({});currentTokens.current={};setTokenHistory({});
    if(enabled)try{
      current.current=readEthereumSettings(key,name=>portfolioSettings.getItem(name),new Set(tracked.map(wallet=>wallet.address)));
      setData(current.current);
      const saved=JSON.parse(portfolioSettings.getItem(nftKey)||'{}');
      if(!saved||typeof saved!=='object'||Array.isArray(saved)||Object.entries(saved).some(([wallet,rows])=>!address.test(wallet)||!Array.isArray(rows)||rows.length>100000||rows.some(row=>!validTransfer(row))))throw new Error('Invalid NFT history.');
      currentNfts.current=saved;setNftHistory(saved);
      const savedTokens=JSON.parse(portfolioSettings.getItem(tokenKey)||'{}');
      if(!savedTokens||typeof savedTokens!=='object'||Array.isArray(savedTokens)||Object.entries(savedTokens).some(([wallet,rows])=>!address.test(wallet)||!Array.isArray(rows)||rows.length>100000||rows.some(row=>!validTokenTransfer(row))))throw new Error('Invalid token history.');
      currentTokens.current=savedTokens;setTokenHistory(savedTokens);setLoaded(true);
    }catch{setError('Robinhood cache could not be opened. Saved data is retained.');}
    return()=>control.current?.abort();
  },[enabled,stake,scope]);
  const refresh=useCallback(async()=>{
    if(!enabled||!loaded||!tracked.length)return;
    control.current?.abort();const controller=new AbortController();control.current=controller;const {signal}=controller;
    setBusy(true);setError('');setStatus('Checking Robinhood Chain transactions…');
    try{
      const next:EthereumData={...current.current,accounts:{...current.current.accounts},history:{...current.current.history}};
      const nftNext={...currentNfts.current};
      const tokenNext={...currentTokens.current};
      for(const [index,wallet] of tracked.entries()){
        const transactions:EthereumTransaction[]=[];
        await scanProviderPages<TransactionPage,unknown>({signal,maxPages:2000,error:'Robinhood transaction scan incomplete. Saved data is retained.',
          fetchPage:cursor=>request({action:'history',address:wallet.address,cursor:cursor??null},signal),
          validPage:(value):value is TransactionPage=>!!value&&typeof value==='object'&&Array.isArray((value as {transactions?:unknown}).transactions)&&((value as {cursor?:unknown}).cursor===null||typeof (value as {cursor?:unknown}).cursor==='object'),
          hasMore:value=>value.cursor!==null,nextCursor:value=>value.cursor,
          onPage:value=>{transactions.push(...value.transactions);}
        });
        const balance=await request({action:'balance',address:wallet.address},signal);
        if(typeof balance.balanceWei!=='string'||!/^\d{1,80}$/.test(balance.balanceWei)||!Number.isSafeInteger(balance.block))throw new Error('Invalid Robinhood balance.');
        next.accounts[wallet.address]={balanceWei:balance.balanceWei,block:balance.block,transactions:wallet.deposit?transactions.filter(tx=>!tx.failed&&tx.to===wallet.address&&BigInt(tx.valueWei)>0n):transactions,provider:'blockscout'};
        const transfers:RobinhoodNftTransfer[]=[];
        if(!wallet.deposit&&wallet.group!=='swap')await scanProviderPages<NftPage,unknown>({signal,maxPages:2000,error:'Robinhood NFT history incomplete. Saved data is retained.',
          fetchPage:cursor=>request({action:'nft-history',address:wallet.address,cursor:cursor??null},signal),
          validPage:(value):value is NftPage=>!!value&&typeof value==='object'&&Array.isArray((value as {transfers?:unknown}).transfers)&&((value as {cursor?:unknown}).cursor===null||typeof (value as {cursor?:unknown}).cursor==='object'),
          hasMore:value=>value.cursor!==null,nextCursor:value=>value.cursor,
          onPage:value=>{for(const row of value.transfers){if(!validTransfer(row))throw new Error('Invalid Robinhood NFT history.');transfers.push(row);}}
        });
        if(!wallet.deposit&&wallet.group!=='swap')nftNext[wallet.address]=transfers;
        const tokens:RobinhoodTokenTransfer[]=[];
        await scanProviderPages<TokenPage,unknown>({signal,maxPages:2000,error:'Robinhood token history incomplete. Saved data is retained.',
          fetchPage:cursor=>request({action:'token-history',address:wallet.address,cursor:cursor??null},signal),
          validPage:(value):value is TokenPage=>!!value&&typeof value==='object'&&Array.isArray((value as {transfers?:unknown}).transfers)&&((value as {cursor?:unknown}).cursor===null||typeof (value as {cursor?:unknown}).cursor==='object'),
          hasMore:value=>value.cursor!==null,nextCursor:value=>value.cursor,
          onPage:value=>{for(const row of value.transfers){if(!validTokenTransfer(row))throw new Error('Invalid Robinhood token history.');tokens.push(row);}}
        });
        tokenNext[wallet.address]=wallet.deposit?tokens.filter(row=>row.to===wallet.address):tokens;
        setStatus(`${index+1} / ${tracked.length}`);
      }
      const [history,quote]=await Promise.all([portfolioFetch('/historical-robinhood-eth-prices',{signal}),portfolioFetch('/robinhood-price',{signal})]);
      if(!history.ok||!quote.ok)throw new Error('Robinhood ETH prices unavailable. Saved data is retained.');
      const rates=await history.json(),price=await quote.json();
      if(!Array.isArray(rates.prices)||typeof price.usd!=='number'||!Number.isFinite(price.usd)||price.usd<=0)throw new Error('Invalid Robinhood ETH prices.');
      for(const [time,usd] of rates.prices)if(Number.isFinite(time)&&Number.isFinite(usd)&&usd>0)next.history[new Date(time).toISOString().slice(0,10)]=usd;
      next.usd=price.usd;next.updated=new Date().toISOString();
      const checked=ethereumData(next);
      if(Object.keys(checked.accounts).length!==Object.keys(next.accounts).length)throw new Error('Invalid Robinhood transactions. Saved data is retained.');
      const settings=encodeEthereumSettings(key,checked);
      portfolioSettings.setItems({...settings,[nftKey]:JSON.stringify(nftNext),[tokenKey]:JSON.stringify(tokenNext)},portfolioSettings.keys().filter(name=>name.startsWith(key+'::')&&!Object.hasOwn(settings,name)));
      await flushVault();signal.throwIfAborted();current.current=checked;currentNfts.current=nftNext;currentTokens.current=tokenNext;setData(checked);setNftHistory(nftNext);setTokenHistory(tokenNext);setStatus('');
    }catch(e){if(!signal.aborted){setError(e instanceof Error?e.message:'Robinhood scan failed. Saved data is retained.');setStatus('');}}
    finally{if(control.current===controller)setBusy(false);}
  },[enabled,loaded,scope,stake]);
  useEffect(()=>{void refresh();return()=>control.current?.abort();},[refresh]);
  return {data:enabled?data:emptyEthereum(),nftHistory:enabled?nftHistory:{},tokenHistory:enabled?tokenHistory:{},busy:enabled&&busy,error:enabled?error:'',status:enabled?status:'',refresh,downloadProgress:enabled?cachedTransactionProgress(tracked.flatMap(wallet=>data.accounts[wallet.address]?.transactions||[]),tx=>tx.id):emptyDownloadProgress()};
}
