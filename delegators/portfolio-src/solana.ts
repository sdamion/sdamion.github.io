import {base58} from '@scure/base';
import type {FiatTransfer} from './ethereum';
import {availableTotal} from './portfolio-totals.ts';

export type NativeWallet={address:string;name:string};
export type SolanaTransaction={hash:string;slot:number;time:number;payer:string;feeRaw:string;failed:boolean;transfers:{from:string;to:string;raw:string}[]};
export type SolanaData={accounts:Record<string,{raw:string;slot:number;checkpoint:string|null;transactions:SolanaTransaction[]}>;history:Record<string,number>;usd:number|null};
export const emptySolana=():SolanaData=>({accounts:{},history:{},usd:null});
export function validSolana(value:unknown,size=32):value is string{
  if(typeof value!=='string'||!value.length||value.length>90)return false;
  try{return base58.decode(value).length===size;}catch{return false;}
}
export const solAmount=(raw:string)=>Number(BigInt(raw))/1e9;
const raw=(value:unknown)=>typeof value==='string'&&/^\d{1,30}$/.test(value);
export function nativeWallets(value:unknown):NativeWallet[]{
  if(!Array.isArray(value))return [];
  return [...new Map(value.filter(row=>row&&validSolana(row.address)&&typeof row.name==='string'&&row.name.trim()).slice(0,20).map(row=>[row.address,{address:row.address,name:row.name.trim().slice(0,60)}])).values()];
}
export function validSolanaTransaction(value:unknown):value is SolanaTransaction{
  const row=value as SolanaTransaction;
  return !!row&&validSolana(row.hash,64)&&Number.isSafeInteger(row.slot)&&row.slot>=0&&Number.isSafeInteger(row.time)&&row.time>0&&row.time<8640000000000&&validSolana(row.payer)&&raw(row.feeRaw)&&typeof row.failed==='boolean'&&Array.isArray(row.transfers)&&row.transfers.length<=10000&&row.transfers.every(t=>validSolana(t.from)&&validSolana(t.to)&&raw(t.raw))&&(!row.failed||!row.transfers.length);
}
export function solanaData(value:unknown):SolanaData{
  const data=value as SolanaData,next=emptySolana();
  if(!data||!data.accounts||typeof data.accounts!=='object')return next;
  for(const [address,account] of Object.entries(data.accounts).slice(0,20))if(validSolana(address)&&account&&raw(account.raw)&&Number.isSafeInteger(account.slot)&&account.slot>=0&&(account.checkpoint===null||validSolana(account.checkpoint,64))&&Array.isArray(account.transactions)&&account.transactions.length<=100000&&account.transactions.every(validSolanaTransaction))next.accounts[address]=account;
  for(const [date,price] of Object.entries(data.history||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(price)&&price>0)next.history[date]=price;
  next.usd=Number.isFinite(data.usd)&&data.usd!>0?data.usd:null;return next;
}
export function solanaTransactions(data:SolanaData,wallets:NativeWallet[]){
  return [...new Map(wallets.flatMap(w=>data.accounts[w.address]?.transactions||[]).map(tx=>[tx.hash,tx])).values()].sort((a,b)=>b.slot-a.slot||a.hash.localeCompare(b.hash));
}
export function solanaTransfers(data:SolanaData,wallets:NativeWallet[],exchanges:NativeWallet[]):(FiatTransfer&{amount:number})[]{
  const own=new Set(wallets.map(w=>w.address)),cex=new Set(exchanges.map(w=>w.address));
  return solanaTransactions(data,wallets).flatMap(tx=>tx.transfers.flatMap((transfer,index)=>{
    if(tx.failed||own.has(transfer.from)&&own.has(transfer.to))return [];
    const side=own.has(transfer.to)&&cex.has(transfer.from)?'buy' as const:own.has(transfer.from)&&cex.has(transfer.to)?'sell' as const:null;
    if(!side)return [];
    const amount=solAmount(transfer.raw),price=data.history[new Date(tx.time*1000).toISOString().slice(0,10)];
    return [{hash:`sol:${tx.hash}:${index}`,time:tx.time,side,amount,usd:Number.isFinite(price)&&price>0?amount*price:null}];
  }));
}
export function solanaTotals(data:SolanaData,wallets:NativeWallet[]){
  const own=new Set(wallets.map(w=>w.address)),transactions=solanaTransactions(data,wallets);
  const value=availableTotal(wallets.map(w=>{const row=data.accounts[w.address];return row?row.raw==='0'?0:data.usd===null?null:solAmount(row.raw)*data.usd:null;}));
  const hasData=wallets.some(w=>data.accounts[w.address]);
  const fees=wallets.length&&!hasData?null:solAmount(String(transactions.reduce((sum,tx)=>sum+(own.has(tx.payer)?BigInt(tx.feeRaw):0n),0n)));
  return {...value,fees,feesPartial:wallets.some(w=>!data.accounts[w.address]),feeUsd:fees===0?0:fees!==null&&data.usd!==null?fees*data.usd:null};
}
