import {base58,bech32,bech32m} from '@scure/base';
import {sha256} from '@noble/hashes/sha2.js';
import type {FiatTransfer} from './ethereum.ts';
import type {NativeWallet} from './solana.ts';
import {availableTotal} from './portfolio-totals.ts';

export type BitcoinWallet=NativeWallet;
export type BitcoinTransaction={hash:string;height:number;time:number;feeRaw:string;inputs:{address:string;raw:string}[];outputs:{address:string;raw:string}[]};
export type BitcoinAccount={raw:string;tip:string;transactions:BitcoinTransaction[]};
export type BitcoinData={accounts:Record<string,BitcoinAccount>;history:Record<string,number>;usd:number|null};
export const emptyBitcoin=():BitcoinData=>({accounts:{},history:{},usd:null});
export const bitcoinAmount=(raw:string)=>Number(BigInt(raw))/1e8;
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
    const address=normalizeBitcoinAddress(row.address);return [address,{address,name:row.name.trim().slice(0,60),...(row.miner===true?{miner:true}:{}),...(row.dex===true?{dex:true}:{})}];
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
export function bitcoinTransfer(tx:BitcoinTransaction,wallets:BitcoinWallet[],exchanges:BitcoinWallet[]){
  const own=new Set(wallets.map(w=>w.address)),cex=new Set(exchanges.filter(w=>!own.has(w.address)&&!w.miner).map(w=>w.address));
  const net=bitcoinNet(tx,wallets),externalInputs=tx.inputs.filter(row=>!own.has(row.address)&&BigInt(row.raw)>0n);
  const outgoing=tx.outputs.filter(row=>!own.has(row.address)&&cex.has(row.address)).reduce((sum,row)=>sum+BigInt(row.raw),0n);
  if(net>0n&&externalInputs.length&&externalInputs.every(row=>exchanges.some(source=>source.address===row.address&&source.miner===true))&&outgoing===0n)return {side:'sell' as const,raw:String(net),mined:true as const};
  if(tx.inputs.every(row=>own.has(row.address))&&outgoing>0n)return {side:'sell' as const,raw:String(outgoing)};
  if(net>0n&&externalInputs.length&&externalInputs.every(row=>cex.has(row.address))&&outgoing===0n)return {side:'buy' as const,raw:String(net)};
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
  const own=new Set(wallets.map(w=>w.address)),txs=bitcoinTransactions(data,wallets);
  const value=availableTotal(wallets.map(w=>{const row=data.accounts[w.address];return row?row.raw==='0'?0:data.usd===null?null:bitcoinAmount(row.raw)*data.usd:null;}));
  const mixed=txs.some(tx=>tx.inputs.some(row=>own.has(row.address))&&!tx.inputs.every(row=>own.has(row.address)));
  const fees=wallets.some(w=>!data.accounts[w.address])||mixed?null:bitcoinAmount(String(txs.reduce((sum,tx)=>sum+(tx.inputs.every(row=>own.has(row.address))?BigInt(tx.feeRaw):0n),0n)));
  return {...value,fees,feesPartial:fees===null,feeUsd:fees===0?0:fees!==null&&data.usd!==null?fees*data.usd:null};
}
