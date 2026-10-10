import {ethereumTransactionCount,ethereumWallets} from './ethereum.ts';
import type {Snapshot} from './cache';
import {solanaTransactions,nativeWallets} from './solana.ts';
import {readEthereumSettings} from './ethereum-storage.ts';
import {readSolanaSettings} from './solana-storage.ts';

export function portfolioTransactionCounts(data:{settings:Record<string,string>;snapshot:{data:Snapshot}|null},stake:string){
  const read=(name:string):unknown=>{try{return JSON.parse(data.settings[name+stake]||'null');}catch{return null;}};
  let eth=0;
  try{eth=ethereumTransactionCount(readEthereumSettings('tdsp-member-ethereum-data:'+stake,key=>data.settings[key]??null),ethereumWallets(read('tdsp-member-ethereum-wallets:')));}catch{/* Incomplete storage is not reported as saved. */}
  const cardanoSaved=Object.keys(data.snapshot?.data.facts||{}).length;
  let sol=0;
  try{sol=solanaTransactions(readSolanaSettings('tdsp-member-solana-data:'+stake,key=>data.settings[key]??null),nativeWallets(read('tdsp-member-solana-wallets:'))).length;}catch{/* Incomplete storage is not reported as saved. */}
  return {saved:cardanoSaved+eth+sol,total:(data.snapshot?.data.txs.length||0)+eth+sol,cardanoSaved};
}
