import {analyse,type Detail,type Fact,type Tx} from './core.ts';
import type {Snapshot} from './cache';

// Retain the inputs needed to reclassify ownership without another tx_info request.
export function analyseAndCache(detail:Detail,owned:Set<string>):Fact{
  const io=(rows:Detail['inputs'])=>rows.map(({value,payment_addr,stake_addr,asset_list,tx_hash,tx_index})=>({value,payment_addr,stake_addr,asset_list,tx_hash,tx_index}));
  const source:Detail={tx_hash:detail.tx_hash,tx_timestamp:detail.tx_timestamp,fee:detail.fee,inputs:io(detail.inputs),outputs:io(detail.outputs),assets_minted:detail.assets_minted,marketplace_version:detail.marketplace_version,marketplace_purchases:detail.marketplace_purchases};
  return {...analyse(source,owned),source};
}
export function planRefresh(cached:Snapshot|null,groups:Record<string,string[]>){
  const owned=new Set(Object.values(groups).flat()),previous=new Set(Object.values(cached?.groups||{}).flat());
  const added=new Set([...owned].filter(address=>!previous.has(address)||cached?.pendingOwnershipAddresses?.includes(address)));
  const removed=new Set([...previous].filter(address=>!owned.has(address)));
  const changed=new Set([...added,...removed]);
  const facts:Record<string,Fact>={};
  const txs:Tx[]=[];
  for(const tx of cached?.txs||[]){
    const fact=cached?.facts[tx.tx_hash];
    if(removed.size&&fact){
      const touched=fact.source?[...fact.source.inputs,...fact.source.outputs].map(io=>io.payment_addr?.bech32||''):fact.wallets;
      if(!touched.some(address=>owned.has(address)))continue;
    }
    txs.push(tx);
    if(!fact)continue;
    if(!cached?.groups)continue;
    if(fact.source){
      const affected=[...fact.source.inputs,...fact.source.outputs].some(io=>changed.has(io.payment_addr?.bech32||''));
      facts[tx.tx_hash]=affected?analyseAndCache(fact.source,owned):fact;
    }else{
      const affected=fact.wallets.some(address=>removed.has(address))||[...fact.externalInputs||[],...fact.externalOutputs||[]].some(row=>added.has(row.address));
      if(!affected)facts[tx.tx_hash]=fact;
    }
  }
  const batches:{addresses:string[];incremental:boolean;newAddresses:boolean}[]=[];
  for(const fresh of [false,true]){
    const addresses=[...owned].filter(address=>added.has(address)===fresh);
    for(let i=0;i<addresses.length;i+=40)batches.push({addresses:addresses.slice(i,i+40),incremental:!fresh&&!!cached?.groups&&cached.complete,newAddresses:fresh});
  }
  return {facts,txs,batches,owned,pendingOwnershipAddresses:[...added]};
}
