import {addressNetworks,type NativeAddressNetwork} from './address-networks.ts';
import type {EthereumWallet} from './ethereum.ts';
import type {AddressListRow} from './AddressList';
import {isOutAddress,isInAddress} from './out-address.ts';
import {addressType,addressTypeLabel,addressTypeChange,type AddressType} from './address-types.ts';

export type NativeAddressBook={
  network:NativeAddressNetwork;label?:string;explorerNetwork?:NativeAddressNetwork|'robinhood';enabled:boolean;wallets:EthereumWallet[];exchanges:EthereumWallet[];
  saveWallets:(rows:EthereumWallet[])=>boolean;saveExchanges:(rows:EthereumWallet[])=>boolean;
  balance:(address:string)=>string|undefined;usd:number|null;
  additionalBalance?:{balance:(address:string)=>string|undefined;usd:number|null;symbol:string};
};

export function addNativeAddress(book:NativeAddressBook,counterparty:boolean,kind:'exchange'|'swap'|'dex',name:string,address:string,out?:boolean,incoming?:boolean,personalType?:'dex'|'cex'){
  if(!book.enabled)return false;
  const config=addressNetworks[book.network];
  const swap=counterparty&&kind==='swap';
  if(swap&&!config.swap)return false;
  if(counterparty&&!swap&&book.wallets.some(row=>row.address===address&&row.group!=='swap'))throw new Error('Your own wallet cannot be added as a CEX address.');
  if([...book.wallets,...book.exchanges].some(row=>row.address===address))throw new Error('This address is already saved.');
  const rows=counterparty&&!swap?book.exchanges:book.wallets;
  if(config.limit!==null&&rows.length>=config.limit)throw new Error(book.network==='ethereum'?'A maximum of 20 Ethereum addresses can be added.':'Invalid Solana request.');
  const next=[...rows,{address,name,...(swap?{group:'swap' as const}:counterparty&&kind==='dex'?{dex:true}:{}),...(!counterparty&&personalType?{personalType}:{}),...(counterparty&&!swap&&typeof out==='boolean'?{out}:{}),...(counterparty&&!swap&&typeof incoming==='boolean'?{in:incoming}:{})}];
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
    return {id:`${book.network}:${owned?'own':swap?'Swap':'cex'}:${wallet.address}`,network:book.network,networkLabel:book.label,explorerNetwork:book.explorerNetwork,address:wallet.address,name:wallet.name,
      kind:owned?wallet.personalType==='dex'?'Personal DEX wallet':wallet.personalType==='cex'?'Personal CEX wallet':undefined:swap?'Swap':addressTypeLabel(wallet),linked:wallet.swapAddresses,
      ...(owned?{personalType:wallet.personalType,onPersonalType:(personalType:'dex'|'cex'|undefined)=>update({personalType})}:{}),
      ...(owned?{balance:{raw:book.balance(wallet.address)??null,usd:book.usd,symbol:config.symbol,decimals:config.decimals,precision:config.precision}}:{}),
      ...(owned&&book.additionalBalance?{additionalBalance:{raw:book.additionalBalance.balance(wallet.address)??null,usd:book.additionalBalance.usd,symbol:book.additionalBalance.symbol,decimals:config.decimals,precision:config.precision}}:{}),
      ...(!owned&&!swap?{addressType:addressType(wallet),onType:(type:AddressType)=>update({...addressTypeChange(type),...(type==='min'||type==='svc'?{deposit:false}:{})}),out:isOutAddress(wallet),onOut:(out:boolean)=>update({out,miner:out?false:wallet.miner,...(out?{sourceType:undefined}:{})}),incoming:isInAddress(wallet),onIn:(incoming:boolean)=>update({in:incoming,miner:incoming?false:wallet.miner,...(incoming?{sourceType:undefined}:{})})}:{}),
      ...(!owned&&!swap&&!wallet.deposit?{miner:wallet.miner,onMining:(miner:boolean)=>update({miner,sourceType:miner?wallet.sourceType||'min':undefined,...(miner?{out:false}:{})})}:{}),
      ...(!owned&&!swap?{deposit:wallet.deposit,note:wallet.deposit?'Personal CEX deposits · balance and exchange sweeps excluded':undefined,onDeposit:(deposit:boolean)=>update({deposit,miner:deposit?false:wallet.miner,...(deposit?{sourceType:undefined}:{})})}:{}),
      ...(!owned&&!swap&&!wallet.miner?{onMakeOwn:()=>{
        const next=book.wallets.concat({address:wallet.address,name:wallet.name,personalType:wallet.dex?'dex':'cex'});
        if(!book.saveExchanges(book.exchanges.filter(row=>row.address!==wallet.address)))return false;
        if(book.saveWallets(next))return true;
        book.saveExchanges(book.exchanges);
        return false;
      }}:{}),
      onRename:name=>update({name}),onRemove:()=>save(source.filter(row=>row.address!==wallet.address))};
  });
}
