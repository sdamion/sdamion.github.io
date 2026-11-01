import {bitcoinHash,validBitcoinAddress,type BitcoinData,type BitcoinWallet} from './bitcoin.ts';
import type {HistoricalNftRow} from './historical-nfts.ts';

export type OrdinalMetadata={id:string;number:number;contentType:string;owner:string;ownerOutput:string;created:number;genesisAddress:string;name:string;collection:string|null};
export type OrdinalActivity={id:string;hash:string;side:'receive'|'send';confirmed:boolean;time:number|null};
export type OrdinalAccount={tip:string;checkedAt:number;owned:OrdinalMetadata[];events:OrdinalActivity[];historyComplete?:boolean};
export type OrdinalsData={accounts:Record<string,OrdinalAccount>;metadata:Record<string,OrdinalMetadata>};
export const emptyOrdinals=():OrdinalsData=>({accounts:{},metadata:{}});
export const ordinalId=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}i(?:0|[1-9][0-9]{0,9})$/.test(value);
const timestamp=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0&&value<8640000000000;
export function validOrdinalMetadata(value:unknown):value is OrdinalMetadata{
  const row=value as OrdinalMetadata;
  return !!row&&ordinalId(row.id)&&Number.isSafeInteger(row.number)&&typeof row.contentType==='string'&&row.contentType.length<=200&&typeof row.owner==='string'&&row.owner.length<=100&&typeof row.ownerOutput==='string'&&/^[a-f0-9]{64}:\d{1,10}$/.test(row.ownerOutput)&&timestamp(row.created)&&typeof row.genesisAddress==='string'&&row.genesisAddress.length<=100&&typeof row.name==='string'&&row.name.length<=120&&(row.collection===null||typeof row.collection==='string'&&row.collection.length<=120);
}
export function validOrdinalActivity(value:unknown):value is OrdinalActivity{
  const row=value as OrdinalActivity;
  return !!row&&ordinalId(row.id)&&bitcoinHash(row.hash)&&['receive','send'].includes(row.side)&&typeof row.confirmed==='boolean'&&(row.confirmed?timestamp(row.time):row.time===null);
}
export function ordinalsData(value:unknown):OrdinalsData{
  if(value===null)return emptyOrdinals();const data=value as OrdinalsData;
  if(!data||!data.accounts||!data.metadata||typeof data.accounts!=='object'||typeof data.metadata!=='object')throw new Error('Ordinals cache is incomplete. Saved history is retained.');
  for(const [address,account] of Object.entries(data.accounts))if(!validBitcoinAddress(address)||!account||!bitcoinHash(account.tip)||!Number.isSafeInteger(account.checkedAt)||account.checkedAt<=0||!Array.isArray(account.owned)||!account.owned.every(validOrdinalMetadata)||!Array.isArray(account.events)||!account.events.every(validOrdinalActivity))throw new Error('Ordinals cache is incomplete. Saved history is retained.');
  for(const [id,metadata] of Object.entries(data.metadata))if(!validOrdinalMetadata(metadata)||id!==metadata.id)throw new Error('Ordinals cache is incomplete. Saved history is retained.');
  for(const account of Object.values(data.accounts))if(account.historyComplete!==undefined&&typeof account.historyComplete!=='boolean')throw new Error('Ordinals cache is incomplete. Saved history is retained.');
  return data;
}
export function ordinalImage(id:string,contentType:string|null){
  return ordinalId(id)&&['image/png','image/jpeg','image/gif','image/webp','image/avif'].includes(contentType||'')?`https://ordiscan.com/content/${id}`:null;
}
export function ordinalFrame(id:string,contentType:string|null){
  return ordinalId(id)&&contentType==='text/html'?`https://ordiscan.com/content/${id}`:null;
}
export function ordinalHistory(data:OrdinalsData,bitcoin:BitcoinData,wallets:BitcoinWallet[]){
  const records=new Map<string,{firstReceived:number|null;wallets:Set<string>;owned:Set<string>}>();
  function record(id:string){let row=records.get(id);if(!row){row={firstReceived:null,wallets:new Set(),owned:new Set()};records.set(id,row);}return row;}
  for(const wallet of wallets){
    const account=data.accounts[wallet.address],btc=bitcoin.accounts[wallet.address];if(!account||!btc)continue;
    const transactions=new Map(btc.transactions.map(tx=>[tx.hash,tx]));
    for(const event of account.events){
      const tx=transactions.get(event.hash);if(!event.confirmed||!tx)continue;
      if(!(event.side==='receive'?tx.outputs:tx.inputs).some(row=>row.address===wallet.address&&BigInt(row.raw)>0n))continue;
      const row=record(event.id);row.wallets.add(wallet.name);
      if(event.side==='receive')row.firstReceived=Math.min(row.firstReceived??Infinity,tx.time);
    }
    for(const info of account.owned){
      const metadata=data.metadata[info.id]||info,[hash,index]=metadata.ownerOutput.split(':'),tx=transactions.get(hash);
      if(metadata.owner!==wallet.address||!tx||tx.outputs[Number(index)]?.address!==wallet.address||BigInt(tx.outputs[Number(index)].raw)<=0n)continue;
      const row=record(info.id);row.wallets.add(wallet.name);
      const laterSend=account.events.some(event=>event.id===info.id&&event.confirmed&&event.side==='send'&&(transactions.get(event.hash)?.height??-1)>tx.height);
      if(!laterSend&&account.tip===btc.tip)row.owned.add(wallet.name);
      const genesis=transactions.get(info.id.slice(0,64));
      if(metadata.genesisAddress===wallet.address&&genesis)row.firstReceived=Math.min(row.firstReceived??Infinity,genesis.time);
    }
  }
  const rows:HistoricalNftRow[]=[...records].map(([id,row])=>{
    const metadata=data.metadata[id];
    return {id:'bitcoin:ordinal:'+id,name:metadata?.name||'Ordinal '+id.slice(0,8)+'…'+id.slice(-6),raw:row.owned.size?'1':'0',firstReceived:row.firstReceived,ordinal:{id,number:metadata?.number??null,contentType:metadata?.contentType??null,collection:metadata?.collection??null,ownedWallets:[...row.owned]}};
  }).sort((a,b)=>(b.firstReceived??0)-(a.firstReceived??0)||a.id.localeCompare(b.id));
  return {rows,wallets:Object.fromEntries([...records].map(([id,row])=>['bitcoin:ordinal:'+id,[...row.wallets]]))};
}
