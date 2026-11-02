import type {Wallet} from './core.ts';
import type {Snapshot} from './cache.ts';
import type {CexAddress} from './cex.ts';
import type {AddressListRow} from './AddressList';
import {validByronAddress} from './exchange-address.ts';
import {isOutAddress} from './out-address.ts';
import {addressType,addressTypeChange,type AddressType} from './address-types.ts';

export type CardanoAddressBook={
  wallets:Wallet[];exchanges:CexAddress[];snapshot:Snapshot|null;memberStake:string;busy:boolean;usd:number|null;
  saveWallets:(rows:Wallet[])=>boolean;saveExchanges:(rows:CexAddress[])=>boolean;onView:(address:string)=>void;
};

export function cardanoAddressRows(book:CardanoAddressBook,owned=false):AddressListRow[]{
  if(owned)return book.wallets.filter(wallet=>wallet.group!=='swap').map(wallet=>{
    const addresses=book.snapshot?.groups?.[wallet.address];
    return {id:'cardano:own:'+wallet.address,network:'cardano' as const,address:wallet.address,name:wallet.label,
      ...(addresses?{balance:{raw:String((book.snapshot?.infos||[]).filter(info=>addresses.includes(info.address)).reduce((sum,info)=>sum+BigInt(info.balance),0n)),usd:book.usd,symbol:'ADA',decimals:6,precision:6},onView:()=>book.onView(wallet.address)}:{note:'Loading balance…'}),
      onRename:label=>book.saveWallets(book.wallets.map(row=>row.address===wallet.address?{...row,label}:row)),
      onRemove:()=>book.saveWallets(book.wallets.filter(row=>row.address!==wallet.address)),removeDisabled:wallet.address===book.memberStake||book.busy};
  });
  return [...book.exchanges.map(entry=>({id:'cardano:cex:'+entry.address,network:'cardano' as const,address:entry.address,name:entry.name,kind:entry.miner||entry.dex!==undefined?addressType(entry).toUpperCase():validByronAddress(entry.address)?'Byron CEX':'DEX / CEX',miner:entry.miner,
    addressType:addressType(entry),onType:(type:AddressType)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,...addressTypeChange(type)}:row)),
    out:isOutAddress(entry),onOut:(out:boolean)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,out,miner:out?false:row.miner,...(out?{sourceType:undefined}:{})}:row)),
    onMining:(miner:boolean)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,miner,sourceType:miner?row.sourceType||'min':undefined,...(miner?{out:false}:{})}:row)),
    onRename:(name:string)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,name}:row)),onRemove:()=>book.saveExchanges(book.exchanges.filter(row=>row.address!==entry.address))
  })),...book.wallets.filter(wallet=>wallet.group==='swap').map(wallet=>({id:'cardano:swap:'+wallet.address,network:'cardano' as const,address:wallet.address,name:wallet.label,kind:'Swap',linked:wallet.swapAddresses,
    onRename:(label:string)=>book.saveWallets(book.wallets.map(row=>row.address===wallet.address?{...row,label}:row)),onRemove:()=>book.saveWallets(book.wallets.filter(row=>row.address!==wallet.address))
  }))];
}
