import type {Fact} from './core.ts';
import {paymentBudget} from './mint-payments.ts';

export function hasCounterpartyData(fact:Fact|undefined):boolean{
  return !!fact&&fact.counterpartyVersion===1&&Array.isArray(fact.externalInputs)&&Array.isArray(fact.externalOutputs)
    &&[...fact.externalInputs,...fact.externalOutputs].every(row=>Object.hasOwn(row,'stakeAddress'));
}

export function needsFactRefresh(fact:Fact|undefined):boolean{
  return !hasCounterpartyData(fact)||!!fact&&(
    (fact.marketplaceVersion!==3&&Object.values(fact.assets).some(raw=>BigInt(raw)>0n))||
    (fact.inputRefs===undefined&&paymentBudget(fact)!==null));
}
