import {validAddress} from './core.ts';
import type {Wallet} from './core.ts';
import {normalizeExchangeAddress,validByronAddress} from './exchange-address.ts';

export function addSwapWallet(wallets:Wallet[],value:string):Wallet[]{
  const address=normalizeExchangeAddress(value);
  if(!validAddress(address)&&!validByronAddress(address))throw new Error('Enter a valid mainnet payment address (addr1) or Byron address.');
  if(wallets.some(wallet=>wallet.address===address))throw new Error('This address is already included in your wallets.');
  return [...wallets,{address,label:'Swap',group:'swap'}];
}

export function swapOwnershipScope(wallets:Wallet[]){
  const swaps=wallets.filter(wallet=>wallet.group==='swap');
  return swaps.length?'::swap-verified-ownership-v3':'';
}

export function trackedWalletAddresses(wallets:Wallet[],groups:Record<string,string[]>={}){
  return [...new Set(wallets.flatMap(wallet=>[wallet.address,...(groups[wallet.address]||[])]))];
}

export function excludeInternalExchanges<T extends {address:string}>(entries:T[],owned:string[]):T[]{
  const internal=new Set(owned);
  return entries.filter(entry=>!internal.has(entry.address));
}
