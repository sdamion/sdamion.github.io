import {addressNetworks,type NativeAddressNetwork} from './address-networks.ts';
import type {EthereumWallet} from './ethereum.ts';
import type {AddressListRow} from './AddressList';
import {isOutAddress} from './out-address.ts';
import {addressType,addressTypeChange,type AddressType} from './address-types.ts';

export type NativeAddressBook={
  network:NativeAddressNetwork;enabled:boolean;wallets:EthereumWallet[];exchanges:EthereumWallet[];
  saveWallets:(rows:EthereumWallet[])=>boolean;saveExchanges:(rows:EthereumWallet[])=>boolean;
  balance:(address:string)=>string|undefined;usd:number|null;
};

export function addNativeAddress(book:NativeAddressBook,counterparty:boolean,kind:'exchange'|'swap'|'dex',name:string,address:string){
  if(!book.enabled)return false;
  const config=addressNetworks[book.network];
  const swap=counterparty&&kind==='swap';
  if(swap&&!config.swap)return false;
  if(counterparty&&!swap&&book.wallets.some(row=>row.address===address&&row.group!=='swap'))throw new Error('Your own wallet cannot be added as a CEX address.');
  if([...book.wallets,...book.exchanges].some(row=>row.address===address))throw new Error('This address is already saved.');
  const rows=counterparty&&!swap?book.exchanges:book.wallets;
  if(config.limit!==null&&rows.length>=config.limit)throw new Error(book.network==='ethereum'?'A maximum of 20 Ethereum addresses can be added.':'Invalid Solana request.');
  const next=[...rows,{address,name,...(swap?{group:'swap' as const}:counterparty&&kind==='dex'?{dex:true}:{})}];
  return counterparty&&!swap?book.saveExchanges(next):book.saveWallets(next);
}

export function nativeAddressRows(book:NativeAddressBook,owned=false):AddressListRow[]{
  if(!book.enabled)return [];
  const config=addressNetworks[book.network];
  const rows=owned?book.wallets.filter(wallet=>wallet.group!=='swap'):[...book.exchanges,...book.wallets.filter(wallet=>wallet.group==='swap')];
  return rows.map(wallet=>{
    const swap=wallet.group==='swap',source=owned||swap?book.wallets:book.exchanges;
    const save=owned||swap?book.saveWallets:book.saveExchanges;
    const update=(changes:Partial<EthereumWallet>)=>save(source.map(row=>row.address===wallet.address?{...row,...changes}:row));
    return {id:`${book.network}:${owned?'own':swap?'Swap':'cex'}:${wallet.address}`,network:book.network,address:wallet.address,name:wallet.name,
      kind:owned?undefined:swap?'Swap':addressType(wallet).toUpperCase(),linked:wallet.swapAddresses,
      ...(owned?{balance:{raw:book.balance(wallet.address)??null,usd:book.usd,symbol:config.symbol,decimals:config.decimals,precision:config.precision}}:{}),
      ...(!owned&&!swap?{addressType:addressType(wallet),onType:(type:AddressType)=>update({...addressTypeChange(type),...(type==='min'||type==='svc'?{deposit:false}:{})}),out:isOutAddress(wallet),onOut:(out:boolean)=>update({out,miner:out?false:wallet.miner,...(out?{sourceType:undefined}:{})})}:{}),
      ...(!owned&&!swap&&!wallet.deposit?{miner:wallet.miner,onMining:(miner:boolean)=>update({miner,sourceType:miner?wallet.sourceType||'min':undefined,...(miner?{out:false}:{})})}:{}),
      ...(!owned&&!swap&&book.network==='ethereum'?{deposit:wallet.deposit,note:wallet.deposit?'Personal CEX deposits · balance and exchange sweeps excluded':undefined,onDeposit:(deposit:boolean)=>update({deposit,miner:deposit?false:wallet.miner,...(deposit?{sourceType:undefined}:{})})}:{}),
      onRename:name=>update({name}),onRemove:()=>save(source.filter(row=>row.address!==wallet.address))};
  });
}
