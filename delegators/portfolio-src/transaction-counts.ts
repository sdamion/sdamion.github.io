import {ethereumData,ethereumTransactionCount,ethereumWallets} from './ethereum.ts';
import type {Snapshot} from './cache';
import {solanaData,solanaTransactions,nativeWallets} from './solana.ts';

export function portfolioTransactionCounts(data:{settings:Record<string,string>;snapshot:{data:Snapshot}|null},stake:string){
  const read=(name:string):unknown=>{try{return JSON.parse(data.settings[name+stake]||'null');}catch{return null;}};
  const eth=ethereumTransactionCount(ethereumData(read('tdsp-member-ethereum-data:'),Infinity),ethereumWallets(read('tdsp-member-ethereum-wallets:')));
  const cardanoSaved=Object.keys(data.snapshot?.data.facts||{}).length;
  const sol=solanaTransactions(solanaData(read('tdsp-member-solana-data:')),nativeWallets(read('tdsp-member-solana-wallets:'))).length;
  return {saved:cardanoSaved+eth+sol,total:(data.snapshot?.data.txs.length||0)+eth+sol,cardanoSaved};
}
