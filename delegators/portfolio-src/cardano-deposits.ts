import type {Detail,Tx} from './core.ts';
import type {CexAddress} from './cex.ts';
import {validExchangeAddress} from './exchange-address.ts';
import {validAddress} from './core.ts';
import {resolveWalletGroups} from './member.ts';
import {createCardanoRequest} from './cardano-request.ts';
import {compactBlock,expandBlock,CACHE_RECORDS_PER_PART} from './compact-storage.ts';
import {depositAddresses,depositReceipt,type DepositAddress} from './deposit-tracking.ts';

export type CardanoDeposits={groups:Record<string,string[]>;details:Detail[];checkedAt:number;scope:string};
export const emptyCardanoDeposits=():CardanoDeposits=>({groups:{},details:[],checkedAt:0,scope:''});
const hash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const raw=(value:unknown):value is string=>typeof value==='string'&&/^\d{1,80}$/.test(value);
const validTime=(value:unknown):value is number=>Number.isSafeInteger(value)&&Number(value)>0&&Number(value)<8640000000000;
const fail=()=>new Error('Cardano CEX deposits unavailable. Saved data is retained.');
function validDetail(tx:Detail){
  const io=(values:Detail['inputs'])=>Array.isArray(values)&&values.length<=100000&&values.every(row=>row&&raw(row.value)&&typeof row.payment_addr?.bech32==='string'&&row.payment_addr.bech32.length>0&&row.payment_addr.bech32.length<=200);
  return !!tx&&hash(tx.tx_hash)&&validTime(tx.tx_timestamp)&&raw(tx.fee)&&io(tx.inputs)&&io(tx.outputs);
}
export const cardanoDepositScope=(targets:CexAddress[])=>depositAddresses([],targets).map(row=>row.address).sort().join('|');
export function cardanoDepositReceipts(data:CardanoDeposits,targets:CexAddress[],owned:string[],known:Set<string>){
  const watched=depositAddresses(owned.map(address=>({address,name:''})),targets);
  const aliases=watched.flatMap(target=>(data.groups[target.address]||[]).map(address=>({...target,address})));
  const wallets:DepositAddress[]=owned.map(address=>({address,name:''}));
  return [...new Map(data.details.map(tx=>[tx.tx_hash,tx])).values()].flatMap(tx=>{
    if(known.has(tx.tx_hash))return [];
    const io=(rows:Detail['inputs'])=>rows.map(row=>({address:row.payment_addr!.bech32!,raw:row.value}));
    const receipt=depositReceipt('cardano',tx.tx_hash,tx.tx_timestamp,io(tx.inputs),io(tx.outputs),wallets,aliases);
    return receipt?[receipt]:[];
  }).sort((a,b)=>b.time-a.time||a.hash.localeCompare(b.hash));
}
export async function scanCardanoDeposits(targets:CexAddress[],fetcher:(path:string,options:RequestInit)=>Promise<Response>,signal:AbortSignal):Promise<CardanoDeposits>{
  const watched=depositAddresses([],targets);if(watched.some(row=>!validExchangeAddress(row.address)))throw fail();
  const request=createCardanoRequest(fetcher),stakes=watched.filter(row=>row.address.startsWith('stake1')).map(row=>row.address);
  const accounts=stakes.length?await request<{stake_address:string;addresses:string[]}[]>('account_addresses',{_stake_addresses:stakes},signal):[];
  const groups=resolveWalletGroups(watched,accounts),addresses=[...new Set(Object.values(groups).flat())],history=new Map<string,Tx>();
  for(let offset=0;offset<addresses.length;offset+=20){
    const batch=addresses.slice(offset,offset+20),seen=new Set<string>();
    for(let start=0;;start+=1000){
      const page=await request<Tx[]>('address_txs',{_addresses:batch},signal,`${start}-${start+999}`);
      if(!Array.isArray(page)||page.length>1000||!page.every(tx=>hash(tx.tx_hash)&&validTime(tx.block_time)&&Number.isSafeInteger(tx.block_height)&&tx.block_height>=0))throw fail();
      for(const tx of page){if(seen.has(tx.tx_hash))throw fail();seen.add(tx.tx_hash);history.set(tx.tx_hash,tx);}
      if(page.length<1000)break;
    }
  }
  const hashes=[...history.keys()],details:Detail[]=[],related=new Set(addresses);
  for(let offset=0;offset<hashes.length;offset+=50){
    const batch=hashes.slice(offset,offset+50),values=await request<Detail[]>('tx_info',{_tx_hashes:batch,_inputs:true,_assets:false,_metadata:false,_withdrawals:false,_certs:false,_scripts:false,_bytecode:false},signal);
    const seen=new Set<string>();if(!Array.isArray(values))throw fail();
    for(const tx of values){
      if(!validDetail(tx)||!batch.includes(tx.tx_hash)||seen.has(tx.tx_hash)||![...tx.inputs,...tx.outputs].some(row=>related.has(row.payment_addr!.bech32!)))throw fail();
      seen.add(tx.tx_hash);details.push({tx_hash:tx.tx_hash,tx_timestamp:tx.tx_timestamp,fee:tx.fee,inputs:tx.inputs.map(row=>({value:row.value,payment_addr:{bech32:row.payment_addr!.bech32!}})),outputs:tx.outputs.map(row=>({value:row.value,payment_addr:{bech32:row.payment_addr!.bech32!}}))});
    }
    if(seen.size!==batch.length)throw fail();
  }
  signal.throwIfAborted();return {scope:cardanoDepositScope(watched),groups,details,checkedAt:Date.now()};
}
export function encodeCardanoDeposits(key:string,data:CardanoDeposits){
  const parts=Math.ceil(data.details.length/CACHE_RECORDS_PER_PART),settings:Record<string,string>={};
  settings[key]=JSON.stringify({scope:data.scope,groups:data.groups,checkedAt:data.checkedAt,parts});
  for(let part=0;part<parts;part++)settings[key+'::'+part]=JSON.stringify(compactBlock(data.details.slice(part*CACHE_RECORDS_PER_PART,(part+1)*CACHE_RECORDS_PER_PART)));
  return settings;
}
export function readCardanoDeposits(key:string,get:(key:string)=>string|null):CardanoDeposits{
  const value=JSON.parse(get(key)||'null');if(!value)return emptyCardanoDeposits();
  if(typeof value.scope!=='string'||!Number.isFinite(value.checkedAt)||value.checkedAt<=0||!Number.isSafeInteger(value.parts)||value.parts<0||!value.groups||typeof value.groups!=='object'||Array.isArray(value.groups))throw fail();
  for(const [address,group]of Object.entries(value.groups))if(!validExchangeAddress(address)||!Array.isArray(group)||!group.every(address=>validAddress(address)||validExchangeAddress(address)&&!address.startsWith('stake1')))throw fail();
  if(Object.keys(value.groups).sort().join('|')!==value.scope)throw fail();
  const details:Detail[]=[];
  for(let part=0;part<value.parts;part++){
    const raw=get(key+'::'+part);if(raw===null)throw fail();const rows=expandBlock(JSON.parse(raw));
    if(!Array.isArray(rows)||rows.length>CACHE_RECORDS_PER_PART||!rows.every(validDetail))throw fail();for(const row of rows)details.push(row);
  }
  return {scope:value.scope,checkedAt:value.checkedAt,groups:value.groups,details};
}
