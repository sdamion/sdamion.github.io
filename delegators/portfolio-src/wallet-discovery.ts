import type {Wallet} from './core';
import type {Snapshot} from './cache';
import {validStakeAddress} from './member.ts';

// Only prune after complete analysis; an empty balance alone is not empty history.
export function pruneUnusedWalletAddresses(snapshot:Snapshot,wallets:Wallet[]):Snapshot{
  if(!snapshot.complete||!snapshot.groups||snapshot.txs.some(tx=>!snapshot.facts[tx.tx_hash]))return snapshot;
  const explicit=new Set(wallets.map(wallet=>wallet.address));
  const excluded=new Set([...(snapshot.excludedRefreshAddresses||[]),...wallets.flatMap(wallet=>wallet.excludedRefreshAddresses||[])]);
  const used=new Set(Object.values(snapshot.facts).flatMap(fact=>[
    ...fact.wallets,
    ...(fact.source?[...fact.source.inputs,...fact.source.outputs].map(io=>io.payment_addr?.bech32||''):[])
  ]));
  const checked=new Set(snapshot.historyCompleteAddresses||Object.values(snapshot.groups).flat());
  const empty=new Set(snapshot.infos.filter(info=>info.balance==='0'&&!(info.utxo_set||[]).length).map(info=>info.address));
  const removed=new Set<string>();
  const groups=Object.fromEntries(Object.entries(snapshot.groups).map(([stake,addresses])=>[stake,addresses.filter(address=>{
    const prune=validStakeAddress(stake)&&!explicit.has(address)&&!excluded.has(address)&&checked.has(address)&&empty.has(address)&&!used.has(address);
    if(prune)removed.add(address);
    return !prune;
  })]));
  if(!removed.size)return snapshot;
  return {...snapshot,groups,infos:snapshot.infos.filter(info=>!removed.has(info.address)),historyCompleteAddresses:[...checked].filter(address=>!removed.has(address))};
}

export function planWalletDiscovery(wallets:Wallet[],cached:Snapshot|null){
  const accounts:{stake_address:string;addresses:string[]}[]=[];
  const pending:string[]=[];
  const complete=new Set(cached?.historyCompleteAddresses||[]);
  for(const wallet of wallets){
    if(!validStakeAddress(wallet.address))continue;
    const addresses=(wallet.group==='swap'?cached?.swapGroups:cached?.groups)?.[wallet.address];
    const scanned=Array.isArray(addresses)&&(wallet.group==='swap'||cached?.complete||addresses.every(address=>complete.has(address)));
    if(scanned)accounts.push({stake_address:wallet.address,addresses:[...addresses]});
    else pending.push(wallet.address);
  }
  return {accounts,pending:[...new Set(pending)]};
}
