import type {AddressNetwork} from './address-networks.ts';

export type DepositAddress={address:string;name:string;deposit?:boolean;miner?:boolean;group?:'swap'};
export type DepositIo={address:string;raw:string};
export type DepositReceipt={network:AddressNetwork;hash:string;time:number;raw:string;from:string[];to:string[]};

export function depositAddresses<T extends DepositAddress>(wallets:T[],exchanges:T[]):T[]{
  const saved=new Set(wallets.map(wallet=>wallet.address));
  return [...new Map(exchanges.filter(wallet=>wallet.deposit===true&&!wallet.miner&&wallet.group!=='swap'&&!saved.has(wallet.address)).map(wallet=>[wallet.address,wallet])).values()];
}
export function depositScanWallets<T extends DepositAddress>(wallets:T[],exchanges:T[]):T[]{
  return [...wallets.filter(wallet=>wallet.group!=='swap').map(wallet=>({...wallet,deposit:false})),...depositAddresses(wallets,exchanges)];
}
export function directDepositOutputs(inputs:DepositIo[],outputs:DepositIo[],wallets:DepositAddress[],exchanges:DepositAddress[]){
  const own=new Set(wallets.map(wallet=>wallet.address)),watched=new Set(depositAddresses(wallets,exchanges).map(wallet=>wallet.address));
  // A normal owned-wallet transfer already has its own classification. Never
  // add another receipt for it or for a CEX's self-transfer/change/sweep.
  if([...inputs,...outputs].some(row=>own.has(row.address))||inputs.some(row=>watched.has(row.address)&&BigInt(row.raw)>0n))return [];
  return outputs.filter(row=>watched.has(row.address)&&BigInt(row.raw)>0n);
}
export function depositReceipt(network:AddressNetwork,hash:string,time:number,inputs:DepositIo[],outputs:DepositIo[],wallets:DepositAddress[],exchanges:DepositAddress[]):DepositReceipt|null{
  const deposits=directDepositOutputs(inputs,outputs,wallets,exchanges);
  const from=[...new Set(inputs.filter(row=>row.address&&BigInt(row.raw)>0n).map(row=>row.address))];
  return deposits.length&&from.length?{network,hash,time,raw:String(deposits.reduce((sum,row)=>sum+BigInt(row.raw),0n)),from,to:[...new Set(deposits.map(row=>row.address))]}:null;
}
