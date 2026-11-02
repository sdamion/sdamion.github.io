import type {Fact,Wallet} from './core.ts';

export type TransactionAddress={address:string;name?:string;out?:boolean};
export function walletFlowAddresses<T extends TransactionAddress>(from:T[],to:T[],isOwn:(row:T)=>boolean,incoming:boolean){
  const ownFrom=from.filter(isOwn),ownTo=to.filter(isOwn);
  const externalFrom=from.filter(row=>!isOwn(row)),externalTo=to.filter(row=>!isOwn(row));
  if(!ownFrom.length&&!ownTo.length)return {from:[],to:[]};
  if(incoming)return {from:uniqueTransactionAddresses(externalFrom.length?externalFrom:ownFrom),to:uniqueTransactionAddresses(ownTo)};
  return {from:uniqueTransactionAddresses(ownFrom),to:uniqueTransactionAddresses(externalTo.length?externalTo:ownTo)};
}
export function uniqueTransactionAddresses(rows:TransactionAddress[]){
  return [...new Map(rows.filter(row=>row.address).map(row=>[row.address,row])).values()];
}
export function cardanoTransactionAddresses(fact:Fact|undefined,wallets:Wallet[],exchanges:{address:string;name:string;direction:'From'|'To'}[]){
  if(!fact?.source)return {from:[],to:[]};
  const source=fact.source;
  const ownedWallets=wallets.filter(wallet=>wallet.group!=='swap');
  const resolved=new Map([...source.inputs,...source.outputs].flatMap(row=>{
    const wallet=ownedWallets.find(wallet=>wallet.address===row.payment_addr?.bech32||!!row.stake_addr&&wallet.address===row.stake_addr);
    return wallet&&row.payment_addr?.bech32?[[row.payment_addr.bech32,wallet] as const]:[];
  }));
  const rows=(direction:'From'|'To')=>{
    const addresses=(direction==='From'?source.inputs:source.outputs).map(row=>({address:row.payment_addr?.bech32||'',stakeAddress:row.stake_addr}));
    return addresses.map(row=>({address:row.address,owned:resolved.has(row.address)||ownedWallets.some(wallet=>wallet.address===row.address||!!row.stakeAddress&&wallet.address===row.stakeAddress),name:
      resolved.get(row.address)?.label||wallets.find(wallet=>wallet.address===row.address)?.label||
      wallets.find(wallet=>!!row.stakeAddress&&wallet.address===row.stakeAddress)?.label||
      exchanges.find(exchange=>exchange.direction===direction&&exchange.address===row.address)?.name}));
  };
  const from=rows('From'),to=rows('To');
  const flow=walletFlowAddresses(from,to,row=>!!row.owned,BigInt(fact.adaRaw||'0')>0n);
  const clean=(rows:TransactionAddress[])=>rows.map(({address,name})=>({address,name}));
  return {from:clean(flow.from),to:clean(flow.to)};
}
