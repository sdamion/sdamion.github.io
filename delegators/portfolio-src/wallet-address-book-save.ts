import type {Wallet} from './core.ts';
import type {CexAddress} from './cex.ts';
import {excludeInternalExchanges} from './swap-wallets.ts';

export function saveWalletAddressBooks(store:{setItems:(values:Record<string,string>)=>void},walletKey:string,cexKey:string,wallets:Wallet[],exchanges:CexAddress[],ownedAddresses:string[]):CexAddress[]{
  const cleaned=excludeInternalExchanges(exchanges,ownedAddresses);
  store.setItems({[walletKey]:JSON.stringify(wallets),[cexKey]:JSON.stringify(cleaned)});
  return cleaned;
}
