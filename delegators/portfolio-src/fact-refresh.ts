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

export function needsActiveFactRefresh(fact:Fact|undefined,active:Set<string>):boolean{
  // Unknown cached transactions are discovered through active address history,
  // not globally queued where they might belong only to excluded addresses.
  return !!fact&&fact.wallets.some(address=>active.has(address))&&needsFactRefresh(fact);
}
