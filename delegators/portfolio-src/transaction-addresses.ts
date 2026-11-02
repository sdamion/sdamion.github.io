import type {Fact,Wallet} from './core.ts';

export type TransactionAddress={address:string;name?:string;out?:boolean};
export function uniqueTransactionAddresses(rows:TransactionAddress[]){
  return [...new Map(rows.filter(row=>row.address).map(row=>[row.address,row])).values()];
}
export function cardanoTransactionAddresses(fact:Fact|undefined,wallets:Wallet[],exchanges:{address:string;name:string;direction:'From'|'To'}[]){
  const rows=(direction:'From'|'To'):TransactionAddress[]=>{
    const source=fact?.source;
    const addresses=source?(direction==='From'?source.inputs:source.outputs).map(row=>({address:row.payment_addr?.bech32||'',stakeAddress:row.stake_addr})):
      direction==='From'?fact?.externalInputs||[]:fact?.externalOutputs||[];
    return uniqueTransactionAddresses(addresses.map(row=>({address:row.address,name:
      wallets.find(wallet=>wallet.address===row.address)?.label||
      wallets.find(wallet=>!!row.stakeAddress&&wallet.address===row.stakeAddress)?.label||
      exchanges.find(exchange=>exchange.direction===direction&&exchange.address===row.address)?.name})));
  };
  return {from:rows('From'),to:rows('To')};
}
