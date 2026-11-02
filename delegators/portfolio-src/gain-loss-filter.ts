import type {Fact} from './core';
import {cexTableTransfer,type CexAddress} from './cex.ts';
import {matchesCexOverlayFilter} from './cex-overlay-filter.ts';

export function matchesGainLossTransfer(fact:Fact|undefined,entries:CexAddress[],filter:string):boolean{
  if(!fact)return false;
  const transfer=cexTableTransfer(fact,entries);
  if(!transfer)return false;
  return matchesCexOverlayFilter('cardano',filter,[transfer]);
}
