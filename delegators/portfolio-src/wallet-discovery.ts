import type {Wallet} from './core';
import type {Snapshot} from './cache';
import {validStakeAddress} from './member.ts';

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
