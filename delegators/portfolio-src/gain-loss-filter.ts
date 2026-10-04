import type {Fact} from './core';
import {cexAdaTransfer,type CexAddress} from './cex.ts';

export function matchesGainLossTransfer(fact:Fact|undefined,entries:CexAddress[],filter:string):boolean{
  if(!fact)return false;
  const transfer=cexAdaTransfer(fact,entries);
  if(!transfer)return false;
  return filter==='all'||(filter==='in'&&transfer.side==='buy')||(filter==='out'&&transfer.side==='sell');
}
