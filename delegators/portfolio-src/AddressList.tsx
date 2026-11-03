import {useState,type ReactNode} from 'react';
import {X} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {AddressNameField} from './AddressNameField';
import {AddressLink} from './AddressLink';
import {AddressActions} from './AddressActions';
import {RewardSourceCheckbox} from './RewardSourceCheckbox';
import {rewardSourceTitle} from './reward-sources';
import {usePortfolioText} from './use-portfolio-text';
import {addressNetworks,type AddressNetwork} from './address-networks';
import {usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import type {AddressType} from './address-types';

export type AddressListRow={id:string;network:AddressNetwork;address:string;name:string;kind?:string;personalType?:'dex'|'cex';onPersonalType?:(type:'dex'|'cex'|undefined)=>boolean;addressType?:AddressType;onType?:(type:AddressType)=>boolean;note?:ReactNode;balance?:{raw:string|null;usd:number|null;symbol:string;decimals:number;precision:number};linked?:string[];miner?:boolean;onMining?:(value:boolean)=>boolean;incoming?:boolean;onIn?:(value:boolean)=>boolean;out?:boolean;onOut?:(value:boolean)=>boolean;deposit?:boolean;onDeposit?:(value:boolean)=>boolean;onMakeOwn?:()=>boolean;onRename:(name:string)=>boolean;onRemove:()=>boolean;removeDisabled?:boolean;onView?:()=>void};
function AddressBalance({balance}:{balance:NonNullable<AddressListRow['balance']>}){
  const display=usePortfolioCurrency(),value=balance.raw===null?null:Number(BigInt(balance.raw))/10**balance.decimals;
  return <div className="small muted" translate="no"><span>{value===null?'—':value.toLocaleString('en-US',{maximumFractionDigits:balance.precision})} {balance.symbol}</span><div>{display?formatPortfolioUsd(value===null||balance.usd===null?null:value*balance.usd,display):'—'}</div></div>;
}
export function AddressList({rows,owned=false}:{rows:AddressListRow[];owned?:boolean}){
  const [editing,setEditing]=useState<string|null>(null),[error,setError]=useState(''),t=usePortfolioText();
  const showRoles=!owned||rows.some(row=>row.onIn||row.onOut);
  function save(action:()=>boolean){try{if(!action())throw new Error();setError('');return true;}catch{setError('Could not save the selection.');return false;}}
  return <section className="portfolio-section">
    {error&&<p role="alert" className="negative" translate="no">{t(error)}</p>}
    <Table variant="standard"><TableHeader><TableRow>{['Network',owned?'Name':'Exchange','Address',...(showRoles?['IN','OUT']:[]),rewardSourceTitle,'Actions'].map(label=><TableHead translate="no" key={label}>{t(label)}</TableHead>)}</TableRow></TableHeader><TableBody>
      {rows.map(row=><TableRow key={row.id} data-address-id={row.id}>
        <TableCell translate="no">{addressNetworks[row.network].name}</TableCell>
        <TableCell translate="no">{editing===row.id?<div className="portfolio-address-rename"><AddressNameField name={row.name} label={owned?'Wallet name':'Exchange name'} autoFocus onSave={name=>{if(!save(()=>row.onRename(name)))return false;setEditing(null);return true;}} onError={()=>setError('Could not save the selection.')}/><button type="button" className="governance-vote-secondary" title={t('Cancel')} aria-label={t('Cancel')} onClick={()=>setEditing(null)}><X size={14}/></button></div>:row.name}{row.kind&&<div className="small muted">{t(row.kind)}</div>}{row.note&&<div className="small muted">{typeof row.note==='string'?t(row.note):row.note}</div>}{row.balance&&<AddressBalance balance={row.balance}/>}</TableCell>
        <TableCell><AddressLink network={row.network} address={row.address} onError={setError}/>{!!row.linked?.length&&<details className="small muted"><summary translate="no">{t('Linked addresses')} ({row.linked.length})</summary>{row.linked.filter(address=>address!==row.address).map(address=><div key={address}><AddressLink network={row.network} address={address} onError={setError}/></div>)}</details>}</TableCell>
        {showRoles&&<TableCell>{row.onIn?<input type="checkbox" checked={row.incoming===true} aria-label={t('IN sender: {name}',{name:row.name})} onChange={event=>save(()=>row.onIn!(event.target.checked))}/>:<span translate="no">—</span>}</TableCell>}
        {showRoles&&<TableCell>{row.onOut?<input type="checkbox" checked={row.out===true} aria-label={t('OUT address: {name}',{name:row.name})} onChange={event=>save(()=>row.onOut!(event.target.checked))}/>:<span translate="no">—</span>}</TableCell>}
        <TableCell>{row.onMining?<RewardSourceCheckbox name={row.name} checked={row.miner===true} onChange={value=>save(()=>row.onMining!(value))}/>:<span translate="no">—</span>}</TableCell>
        <TableCell><AddressActions id={'address-actions-'+encodeURIComponent(row.id)} name={row.name} onView={row.onView} addressType={row.addressType} onType={row.onType?type=>{save(()=>row.onType!(type));}:undefined} onRename={()=>{setEditing(row.id);setError('');}} onRemove={()=>{if(save(row.onRemove)&&editing===row.id)setEditing(null);}} removeDisabled={row.removeDisabled} extra={[...(row.onPersonalType?[{label:'Mark as personal wallet',onSelect:()=>save(()=>row.onPersonalType!(undefined))},{label:'Mark as personal DEX wallet',onSelect:()=>save(()=>row.onPersonalType!('dex'))},{label:'Mark as personal CEX wallet',onSelect:()=>save(()=>row.onPersonalType!('cex'))}]:[]),...(row.onDeposit?[{label:row.deposit?'Stop tracking deposits':'Track deposits to this address',onSelect:()=>save(()=>row.onDeposit!(!row.deposit))}]:[]),...(row.onMakeOwn?[{label:'Move to My Wallets (include balance)',onSelect:()=>{if(window.confirm(t('This address will count toward your wallet balance. Only continue if you control it.')))save(row.onMakeOwn!);}}]:[])]}/></TableCell>
      </TableRow>)}
    </TableBody></Table>
    {!rows.length&&<p className="empty" translate="no">{t('No saved addresses.')}</p>}
  </section>;
}
