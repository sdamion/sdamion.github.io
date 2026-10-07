import {ethereumData,ethereumTransactionCount,ethereumWallets} from './ethereum.ts';
import type {Snapshot} from './cache';

export function portfolioTransactionCounts(data:{settings:Record<string,string>;snapshot:{data:Snapshot}|null},stake:string){
  const read=(name:string):unknown=>{try{return JSON.parse(data.settings[name+stake]||'null');}catch{return null;}};
  const eth=ethereumTransactionCount(ethereumData(read('tdsp-member-ethereum-data:')),ethereumWallets(read('tdsp-member-ethereum-wallets:')));
  const cardanoSaved=Object.keys(data.snapshot?.data.facts||{}).length;
  return {saved:cardanoSaved+eth,total:(data.snapshot?.data.txs.length||0)+eth,cardanoSaved};
}
