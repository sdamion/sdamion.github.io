import {assetName} from './core.ts';
import type {Fact,Market,Wallet} from './core.ts';
import {knownTransactionDexNames} from './known-dex-transactions.ts';
import {transactionWalletNames} from './transaction-wallet-names.ts';
import {transactionExchangeWallets,type CexAddress} from './cex.ts';

const normalize=(text:string)=>text.normalize('NFKC').toLowerCase().trim();
const compact=(text:string)=>normalize(text).replace(/[\s#_-]+/g,'');
export function matchesSearchText(query:string,values:string[]):boolean{
  const term=normalize(query),compactTerm=compact(query);
  return !term||values.some(value=>normalize(value).includes(term)||!!compactTerm&&compact(value).includes(compactTerm));
}

export function matchesTransaction(query:string,hash:string,fact:Fact|undefined,markets:Record<string,Market>,wallets:Wallet[],exchanges:CexAddress[]=[]):boolean{
  const term=normalize(query);
  if(!term)return true;
  if(normalize(hash).includes(term))return true;
  if(knownTransactionDexNames(fact).some(name=>normalize(name).includes(term)))return true;
  const names=[...transactionWalletNames(fact,wallets),...wallets.filter(wallet=>wallet.group!=='swap'&&fact?.wallets.includes(wallet.address)).map(wallet=>wallet.label),...transactionExchangeWallets(fact,exchanges).map(wallet=>wallet.name)];
  if(matchesSearchText(query,names))return true;
  return Object.keys(fact?.assets||{}).some(id=>{
    const names=[assetName(id),markets[id]?.name||'',markets[id]?.ticker||''];
    return normalize(id).includes(term)||names.some(name=>normalize(name).includes(term)||(compact(term)!==''&&compact(name).includes(compact(term))));
  });
}
