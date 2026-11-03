import type {Wallet} from './core.ts';
import type {Snapshot} from './cache.ts';
import type {CexAddress} from './cex.ts';
import type {AddressListRow} from './AddressList';
import {validByronAddress} from './exchange-address.ts';
import {isOutAddress,isInAddress} from './out-address.ts';
import {addressType,addressTypeLabel,addressTypeChange,type AddressType} from './address-types.ts';

export type CardanoAddressBook={
  wallets:Wallet[];exchanges:CexAddress[];snapshot:Snapshot|null;memberStake:string;busy:boolean;usd:number|null;
  saveWallets:(rows:Wallet[])=>boolean;saveExchanges:(rows:CexAddress[])=>boolean;onView:(address:string)=>void;
};

export function cardanoAddressRows(book:CardanoAddressBook,owned=false):AddressListRow[]{
  if(owned)return book.wallets.filter(wallet=>wallet.group!=='swap').map(wallet=>{
    const addresses=book.snapshot?.groups?.[wallet.address];
    return {id:'cardano:own:'+wallet.address,network:'cardano' as const,address:wallet.address,name:wallet.label,kind:wallet.personalType==='dex'?'Personal DEX wallet':wallet.personalType==='cex'?'Personal CEX wallet':undefined,
      ...(wallet.address!==book.memberStake?{personalType:wallet.personalType,onPersonalType:(personalType:'dex'|'cex'|undefined)=>book.saveWallets(book.wallets.map(row=>row.address===wallet.address?{...row,personalType}:row))}:{}),
      ...(addresses?{balance:{raw:String((book.snapshot?.infos||[]).filter(info=>addresses.includes(info.address)).reduce((sum,info)=>sum+BigInt(info.balance),0n)),usd:book.usd,symbol:'ADA',decimals:6,precision:6},onView:()=>book.onView(wallet.address)}:{note:'Loading balance…'}),
      onRename:label=>book.saveWallets(book.wallets.map(row=>row.address===wallet.address?{...row,label}:row)),
      onRemove:()=>book.saveWallets(book.wallets.filter(row=>row.address!==wallet.address)),removeDisabled:wallet.address===book.memberStake||book.busy};
  });
  return [...book.exchanges.map(entry=>({id:'cardano:cex:'+entry.address,network:'cardano' as const,address:entry.address,name:entry.name,kind:entry.miner||entry.dex!==undefined?addressTypeLabel(entry):validByronAddress(entry.address)?'Byron CEX':'DEX / CEX',miner:entry.miner,
    addressType:addressType(entry),onType:(type:AddressType)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,...addressTypeChange(type),...(type==='min'||type==='svc'?{deposit:false}:{})}:row)),
    out:isOutAddress(entry),onOut:(out:boolean)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,out,miner:out?false:row.miner,...(out?{sourceType:undefined}:{})}:row)),
    incoming:isInAddress(entry),onIn:(incoming:boolean)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,in:incoming,miner:incoming?false:row.miner,...(incoming?{sourceType:undefined}:{})}:row)),
    ...(!entry.deposit?{onMining:(miner:boolean)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,miner,sourceType:miner?row.sourceType||'min':undefined,...(miner?{out:false}:{})}:row))}:{}),
    deposit:entry.deposit,note:entry.deposit?'Personal CEX deposits · balance and exchange sweeps excluded':undefined,onDeposit:(deposit:boolean)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,deposit,miner:deposit?false:row.miner,...(deposit?{sourceType:undefined}:{})}:row)),
    ...(!validByronAddress(entry.address)&&!entry.miner?{onMakeOwn:()=>book.saveWallets([...book.wallets,{address:entry.address,label:entry.name,personalType:entry.dex?'dex':'cex'}])}:{}),
    onRename:(name:string)=>book.saveExchanges(book.exchanges.map(row=>row.address===entry.address?{...row,name}:row)),onRemove:()=>book.saveExchanges(book.exchanges.filter(row=>row.address!==entry.address))
  })),...book.wallets.filter(wallet=>wallet.group==='swap').map(wallet=>({id:'cardano:swap:'+wallet.address,network:'cardano' as const,address:wallet.address,name:wallet.label,kind:'Swap',linked:wallet.swapAddresses,
    onRename:(label:string)=>book.saveWallets(book.wallets.map(row=>row.address===wallet.address?{...row,label}:row)),onRemove:()=>book.saveWallets(book.wallets.filter(row=>row.address!==wallet.address))
  }))];
}
