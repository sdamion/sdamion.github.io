import {ethereumTransactionCount,ethereumWallets} from './ethereum.ts';
import type {Snapshot} from './cache';
import {solanaData,solanaTransactions,nativeWallets} from './solana.ts';
import {readEthereumSettings} from './ethereum-storage.ts';

export function portfolioTransactionCounts(data:{settings:Record<string,string>;snapshot:{data:Snapshot}|null},stake:string){
  const read=(name:string):unknown=>{try{return JSON.parse(data.settings[name+stake]||'null');}catch{return null;}};
  let eth=0;
  try{eth=ethereumTransactionCount(readEthereumSettings('tdsp-member-ethereum-data:'+stake,key=>data.settings[key]??null),ethereumWallets(read('tdsp-member-ethereum-wallets:')));}catch{/* Incomplete storage is not reported as saved. */}
  const cardanoSaved=Object.keys(data.snapshot?.data.facts||{}).length;
  const sol=solanaTransactions(solanaData(read('tdsp-member-solana-data:')),nativeWallets(read('tdsp-member-solana-wallets:'))).length;
  return {saved:cardanoSaved+eth+sol,total:(data.snapshot?.data.txs.length||0)+eth+sol,cardanoSaved};
}
