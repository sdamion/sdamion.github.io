import {base58,bech32,bech32m} from '@scure/base';
import {sha256} from '@noble/hashes/sha2.js';
import type {FiatTransfer} from './ethereum.ts';
import type {NativeWallet} from './solana.ts';
import {availableTotal} from './portfolio-totals.ts';
import {isOutAddress} from './out-address.ts';
import {sourceTypeFields} from './address-types.ts';
import {depositScanWallets,depositReceipt} from './deposit-tracking.ts';
import {visibleHistory} from './visible-history.ts';

export type BitcoinWallet=NativeWallet;
export type BitcoinTransaction={hash:string;height:number;time:number;feeRaw:string;inputs:{address:string;raw:string}[];outputs:{address:string;raw:string}[]};
export type BitcoinAccount={raw:string;tip:string;transactions:BitcoinTransaction[]};
export type BitcoinData={accounts:Record<string,BitcoinAccount>;pending?:BitcoinTransaction[];history:Record<string,number>;usd:number|null};
export const emptyBitcoin=():BitcoinData=>({accounts:{},history:{},usd:null});
export const bitcoinAmount=(raw:string)=>Number(BigInt(raw))/1e8;
export function bitcoinAmountText(value:string){const raw=BigInt(value).toString().padStart(9,'0'),fraction=raw.slice(-8).replace(/0+$/,'');return raw.slice(0,-8)+(fraction?'.'+fraction:'');}
export function bitcoinFee(tx:BitcoinTransaction,wallets:BitcoinWallet[]){
  const owned=new Set(wallets.map(wallet=>wallet.address)),all=tx.inputs.every(row=>owned.has(row.address)),some=tx.inputs.some(row=>owned.has(row.address));
  return {totalRaw:tx.feeRaw,paidRaw:all?tx.feeRaw:some?null:'0',payer:all?'own' as const:some?'mixed' as const:'external' as const};
}
export const bitcoinHash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const raw=(value:unknown):value is string=>typeof value==='string'&&/^\d{1,16}$/.test(value)&&BigInt(value)<=2100000000000000n;
export function normalizeBitcoinAddress(value:string){return /^bc1/i.test(value.trim())?value.trim().toLowerCase():value.trim();}
export function validBitcoinAddress(value:unknown):value is string{
  if(typeof value!=='string'||value.length>90)return false;
  try{
    if(/^bc1/i.test(value)){
      if(value!==value.toLowerCase()&&value!==value.toUpperCase())return false;
      for(const codec of [bech32,bech32m])try{
        const decoded=codec.decode(value as `${string}1${string}`),version=decoded.words[0],program=codec.fromWords(decoded.words.slice(1));
        if(decoded.prefix==='bc'&&version<=16&&program.length>=2&&program.length<=40&&(version===0?codec===bech32&&(program.length===20||program.length===32):codec===bech32m))return true;
      }catch{/* Try the checksum appropriate to the other witness version. */}
      return false;
    }
    const bytes=base58.decode(value);
    return bytes.length===25&&(bytes[0]===0||bytes[0]===5)&&sha256(sha256(bytes.slice(0,21))).slice(0,4).every((byte,index)=>byte===bytes[21+index]);
  }catch{return false;}
}
export function bitcoinWallets(value:unknown):BitcoinWallet[]{
  if(!Array.isArray(value))return [];
  return [...new Map(value.filter(row=>row&&validBitcoinAddress(row.address)&&typeof row.name==='string'&&row.name.trim()).map(row=>{
    const address=normalizeBitcoinAddress(row.address);return [address,{address,name:row.name.trim().slice(0,60),...(row.miner===true?{miner:true}:{}),...(row.dex===true?{dex:true}:{}),...sourceTypeFields(row),...(row.deposit===true?{deposit:true}:{}),...(typeof row.out==='boolean'?{out:row.out}:{})}];
  })).values()] as BitcoinWallet[];
}
export function validBitcoinTransaction(value:unknown):value is BitcoinTransaction{
  const tx=value as BitcoinTransaction;
  const entries=(rows:BitcoinTransaction['inputs'])=>Array.isArray(rows)&&rows.length>0&&rows.length<=100000&&rows.every(row=>row&&typeof row.address==='string'&&row.address.length<=100&&raw(row.raw));
  return !!tx&&bitcoinHash(tx.hash)&&Number.isSafeInteger(tx.height)&&tx.height>=0&&Number.isSafeInteger(tx.time)&&tx.time>0&&tx.time<8640000000000&&raw(tx.feeRaw)&&entries(tx.inputs)&&entries(tx.outputs);
}
export function bitcoinData(value:unknown):BitcoinData{
  const data=value as BitcoinData,next=emptyBitcoin();
  if(!data||typeof data.accounts!=='object'||!data.accounts)return next;
  for(const [address,account] of Object.entries(data.accounts))if(validBitcoinAddress(address)&&account&&raw(account.raw)&&bitcoinHash(account.tip)&&Array.isArray(account.transactions)&&account.transactions.every(validBitcoinTransaction))next.accounts[address]=account;
  if(Array.isArray(data.pending)&&data.pending.every(validBitcoinTransaction))next.pending=[...new Map(data.pending.map(tx=>[tx.hash,tx])).values()];
  for(const [date,price] of Object.entries(data.history||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(price)&&price>0)next.history[date]=price;
  next.usd=Number.isFinite(data.usd)&&data.usd!>0?data.usd:null;
  return next;
}
export function bitcoinTransactions(data:BitcoinData,wallets:BitcoinWallet[]){
  return [...new Map(wallets.flatMap(wallet=>data.accounts[wallet.address]?.transactions||[]).map(tx=>[tx.hash,tx])).values()].sort((a,b)=>b.height-a.height||a.hash.localeCompare(b.hash));
}
export function bitcoinNet(tx:BitcoinTransaction,wallets:BitcoinWallet[]){
  const own=new Set(wallets.map(w=>w.address));
  return tx.outputs.reduce((sum,row)=>sum+(own.has(row.address)?BigInt(row.raw):0n),0n)-tx.inputs.reduce((sum,row)=>sum+(own.has(row.address)?BigInt(row.raw):0n),0n);
}
export function bitcoinDeposit(tx:BitcoinTransaction,wallets:BitcoinWallet[],exchanges:BitcoinWallet[]){
  return depositReceipt('bitcoin',tx.hash,tx.time,tx.inputs,tx.outputs,wallets,exchanges);
}
export function visibleBitcoinTransactions(data:BitcoinData,wallets:BitcoinWallet[],exchanges:BitcoinWallet[]){
  const ownedAddresses=new Set(wallets.map(wallet=>wallet.address));
  const owned=new Set(bitcoinTransactions(data,wallets).map(tx=>tx.hash));
  const scanned=new Set(depositScanWallets(wallets,exchanges).map(wallet=>wallet.address));
  return visibleHistory(bitcoinTransactions(data,depositScanWallets(wallets,exchanges)),data.pending||[],tx=>tx.hash,
    tx=>[...tx.inputs,...tx.outputs].some(row=>scanned.has(row.address))&&(owned.has(tx.hash)||[...tx.inputs,...tx.outputs].some(row=>ownedAddresses.has(row.address))||!!bitcoinDeposit(tx,wallets,exchanges)),
    (a,b)=>b.height-a.height||a.hash.localeCompare(b.hash));
}
export function bitcoinTransfer(tx:BitcoinTransaction,wallets:BitcoinWallet[],exchanges:BitcoinWallet[]){
  const own=new Set(wallets.map(w=>w.address)),cex=new Set(exchanges.filter(w=>!own.has(w.address)&&isOutAddress(w)).map(w=>w.address));
  const net=bitcoinNet(tx,wallets),externalInputs=tx.inputs.filter(row=>!own.has(row.address)&&BigInt(row.raw)>0n);
  const outgoing=tx.outputs.filter(row=>!own.has(row.address)&&cex.has(row.address)).reduce((sum,row)=>sum+BigInt(row.raw),0n);
  if(net>0n&&externalInputs.length&&externalInputs.every(row=>exchanges.some(source=>source.address===row.address&&source.miner===true))&&outgoing===0n)return {side:'sell' as const,raw:String(net),mined:true as const};
  if(tx.inputs.every(row=>own.has(row.address))&&outgoing>0n)return {side:'sell' as const,raw:String(outgoing)};
  if(net>0n&&externalInputs.length&&externalInputs.every(row=>cex.has(row.address))&&outgoing===0n)return {side:'buy' as const,raw:String(net)};
  return null;
}
// Match saved address connections for display, without assigning shared UTXO
// amounts to a wallet. Financial totals continue to use bitcoinTransfer only.
export function bitcoinTableTransfer(tx:BitcoinTransaction,wallets:BitcoinWallet[],exchanges:BitcoinWallet[]){
  const verified=bitcoinTransfer(tx,wallets,exchanges);
  if(verified)return {...verified,verified:true};
  const own=new Set(wallets.map(wallet=>wallet.address));
  const cex=new Set(exchanges.filter(wallet=>!own.has(wallet.address)&&isOutAddress(wallet)).map(wallet=>wallet.address));
  const positive=(rows:BitcoinTransaction['inputs'],addresses:Set<string>)=>rows.some(row=>addresses.has(row.address)&&BigInt(row.raw)>0n);
  const outgoing=positive(tx.inputs,own)&&positive(tx.outputs,cex);
  const incoming=positive(tx.inputs,cex)&&positive(tx.outputs,own);
  if(outgoing&&!incoming)return {side:'sell' as const,raw:null,verified:false};
  if(incoming&&!outgoing)return {side:'buy' as const,raw:null,verified:false};
  return null;
}
export function bitcoinTransfers(data:BitcoinData,wallets:BitcoinWallet[],exchanges:BitcoinWallet[]):(FiatTransfer&{amount:number})[]{
  return bitcoinTransactions(data,wallets).flatMap(tx=>{
    const transfer=bitcoinTransfer(tx,wallets,exchanges);if(!transfer)return [];
    const amount=bitcoinAmount(transfer.raw),price=data.history[new Date(tx.time*1000).toISOString().slice(0,10)];
    return [{hash:'btc:'+tx.hash,time:tx.time,side:transfer.side,amount,...('mined' in transfer?{performance:false}:{}),usd:Number.isFinite(price)&&price>0?amount*price:null}];
  });
}
export function bitcoinTotals(data:BitcoinData,wallets:BitcoinWallet[]){
  const txs=bitcoinTransactions(data,wallets);
  const value=availableTotal(wallets.map(w=>{const row=data.accounts[w.address];return row?row.raw==='0'?0:data.usd===null?null:bitcoinAmount(row.raw)*data.usd:null;}));
  const attributed=txs.map(tx=>bitcoinFee(tx,wallets)),unattributedFees=attributed.filter(fee=>fee.paidRaw===null).length;
  const feesRaw=wallets.length&&wallets.every(wallet=>!data.accounts[wallet.address])?null:String(attributed.reduce((sum,fee)=>sum+BigInt(fee.paidRaw||'0'),0n));
  const fees=feesRaw===null?null:bitcoinAmount(feesRaw);
  return {...value,fees,feesRaw,unattributedFees,feesPartial:wallets.some(wallet=>!data.accounts[wallet.address])||unattributedFees>0,feeUsd:fees===0?0:fees!==null&&data.usd!==null?fees*data.usd:null};
}
