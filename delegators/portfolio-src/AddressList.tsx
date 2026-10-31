import {useState,type ReactNode} from 'react';
import {X} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {AddressNameField} from './AddressNameField';
import {AddressLink} from './AddressLink';
import {AddressActions} from './AddressActions';
import {RewardSourceCheckbox} from './RewardSourceCheckbox';
import {rewardSourceTitle} from './reward-sources';
import {usePortfolioText} from './use-portfolio-text';
import type {AddressNetwork} from './CryptoAddressForm';

export type AddressListRow={id:string;network:AddressNetwork;address:string;name:string;kind?:string;note?:ReactNode;linked?:string[];miner?:boolean;onMining?:(value:boolean)=>boolean;onRename:(name:string)=>boolean;onRemove:()=>boolean;removeDisabled?:boolean;onView?:()=>void};
const networks={cardano:'Cardano',ethereum:'Ethereum',solana:'Solana',bitcoin:'Bitcoin'};
export function AddressList({rows,owned=false}:{rows:AddressListRow[];owned?:boolean}){
  const [editing,setEditing]=useState<string|null>(null),[error,setError]=useState(''),t=usePortfolioText();
  function save(action:()=>boolean){try{if(!action())throw new Error();setError('');return true;}catch{setError('Could not save the selection.');return false;}}
  return <section className="portfolio-section">
    {error&&<p role="alert" className="negative" translate="no">{t(error)}</p>}
    <Table variant="standard"><TableHeader><TableRow>{['Network',owned?'Name':'Exchange','Address',rewardSourceTitle,'Actions'].map(label=><TableHead translate="no" key={label}>{t(label)}</TableHead>)}</TableRow></TableHeader><TableBody>
      {rows.map(row=><TableRow key={row.id} data-address-id={row.id}>
        <TableCell translate="no">{networks[row.network]}</TableCell>
        <TableCell translate="no">{editing===row.id?<div className="portfolio-address-rename"><AddressNameField name={row.name} label={owned?'Wallet name':'Exchange name'} autoFocus onSave={name=>{if(!save(()=>row.onRename(name)))return false;setEditing(null);return true;}} onError={()=>setError('Could not save the selection.')}/><button type="button" className="governance-vote-secondary" title={t('Cancel')} aria-label={t('Cancel')} onClick={()=>setEditing(null)}><X size={14}/></button></div>:row.name}{row.kind&&<div className="small muted">{row.kind}</div>}{row.note&&<div className="small muted">{row.note}</div>}</TableCell>
        <TableCell><AddressLink network={row.network} address={row.address} onError={setError}/>{!!row.linked?.length&&<details className="small muted"><summary translate="no">{t('Linked addresses')} ({row.linked.length})</summary>{row.linked.filter(address=>address!==row.address).map(address=><div key={address}><AddressLink network={row.network} address={address} onError={setError}/></div>)}</details>}</TableCell>
        <TableCell>{row.onMining?<RewardSourceCheckbox name={row.name} checked={row.miner===true} onChange={value=>save(()=>row.onMining!(value))}/>:<span translate="no">—</span>}</TableCell>
        <TableCell><AddressActions id={'address-actions-'+encodeURIComponent(row.id)} name={row.name} onView={row.onView} onRename={()=>{setEditing(row.id);setError('');}} onRemove={()=>{if(save(row.onRemove)&&editing===row.id)setEditing(null);}} removeDisabled={row.removeDisabled}/></TableCell>
      </TableRow>)}
    </TableBody></Table>
    {!rows.length&&<p className="empty" translate="no">{t('No saved addresses.')}</p>}
  </section>;
}
