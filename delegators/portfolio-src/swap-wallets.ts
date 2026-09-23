import {validAddress} from './core.ts';
import type {Wallet,Fact} from './core.ts';
import {normalizeExchangeAddress,validByronAddress} from './exchange-address.ts';
import {validStakeAddress,resolveWalletGroups} from './member.ts';

export function addSwapWallet(wallets:Wallet[],value:string):Wallet[]{
  const address=normalizeExchangeAddress(value);
  if(!validAddress(address)&&!validStakeAddress(address)&&!validByronAddress(address))throw new Error('Enter a valid mainnet stake, payment or Byron address.');
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

export function resolveSwapGroups(wallets:Wallet[],accounts:{stake_address:string;addresses:string[]}[]){
  return resolveWalletGroups(wallets.filter(wallet=>wallet.group==='swap').map(wallet=>({address:wallet.address})),accounts);
}

export function swapAddressSet(wallets:Wallet[],groups:Record<string,string[]>={}){
  return new Set(trackedWalletAddresses(wallets.filter(wallet=>wallet.group==='swap'),groups));
}

export function isSwapTransaction(fact:Fact|undefined,addresses:Set<string>):boolean{
  if(!fact||!addresses.size)return false;
  if(fact.wallets.some(address=>addresses.has(address)))return true;
  if([...fact.externalInputs||[],...fact.externalOutputs||[]].some(row=>addresses.has(row.address)||!!row.stakeAddress&&addresses.has(row.stakeAddress)))return true;
  return [...fact.source?.inputs||[],...fact.source?.outputs||[]].some(row=>addresses.has(row.payment_addr?.bech32||'')||addresses.has(row.stake_addr||''));
}

export function exchangeExcludedAddresses(wallets:Wallet[],groups:Record<string,string[]>={},swapGroups:Record<string,string[]>={}){
  return [...new Set([...trackedWalletAddresses(wallets,groups),...wallets.filter(wallet=>wallet.group==='swap').flatMap(wallet=>swapGroups[wallet.address]||[])])];
}

export function excludeInternalExchanges<T extends {address:string}>(entries:T[],owned:string[]):T[]{
  const internal=new Set(owned);
  return entries.filter(entry=>!internal.has(entry.address));
}
