import {short,type Fact,type Wallet} from './core.ts';
import {isSwapTransaction} from './swap-wallets.ts';
import {knownTransactionDexNames} from './known-dex-transactions.ts';

export function transactionWalletNames(fact:Fact|undefined,wallets:Wallet[]):string[]{
  if(!fact)return [];
  const names=fact.wallets.map(address=>{
    const matches=wallets.filter(wallet=>wallet.address===address&&wallet.group!=='swap');
    return matches.find(wallet=>wallet.label&&wallet.label!=='Member stake address')?.label||matches[0]?.label||short(address);
  });
  for(const wallet of wallets.filter(wallet=>wallet.group==='swap')){
    if(isSwapTransaction(fact,new Set([wallet.address])))names.push(wallet.label);
  }
  return [...new Set([...names,...knownTransactionDexNames(fact).map(name=>`DEX contract: ${name}`)])];
}
