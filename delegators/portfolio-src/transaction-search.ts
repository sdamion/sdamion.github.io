import {assetName} from './core.ts';
import type {Fact,Market,Wallet} from './core.ts';

const normalize=(text:string)=>text.normalize('NFKC').toLowerCase().trim();
const compact=(text:string)=>normalize(text).replace(/[\s#_-]+/g,'');
export function matchesTransaction(query:string,hash:string,fact:Fact|undefined,markets:Record<string,Market>,wallets:Wallet[]):boolean{
  const term=normalize(query);
  if(!term)return true;
  if(normalize(hash).includes(term))return true;
  if((fact?.wallets||[]).some(address=>wallets.some(w=>w.address===address&&normalize(w.label).includes(term))))return true;
  return Object.keys(fact?.assets||{}).some(id=>{
    const names=[assetName(id),markets[id]?.ticker||''];
    return normalize(id).includes(term)||names.some(name=>normalize(name).includes(term)||(compact(term)!==''&&compact(name).includes(compact(term))));
  });
}
