import {useState} from 'react';
import {ExternalLink,Trash2} from 'lucide-react';
import type {Wallet} from './core';
import type {Snapshot} from './cache';
import {short} from './core';
import {validStakeAddress,walletTransactionCount} from './member';
import {AssetOverlay} from './AssetOverlay';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';

const num=(value:number)=>value.toLocaleString('en-US',{maximumFractionDigits:6});
export function WalletCard({wallet:w,primary,snapshot,remove,busy,excluded,onExclude}:{wallet:Wallet;primary:boolean;snapshot:Snapshot|null;remove:()=>void;busy:boolean;excluded:Set<string>;onExclude:(address:string,value:boolean)=>void}){
  const [open,setOpen]=useState(false);
  const addresses=snapshot?.groups?.[w.address];
  const facts=Object.values(snapshot?.facts||{});
  const count=(linked:string[])=>walletTransactionCount(facts,linked).toLocaleString('en-US');
  const link=(address:string)=><a className="address" href={`https://cardanoscan.io/${validStakeAddress(address)?'stakekey':'address'}/${address}`} target="_blank" rel="noreferrer" title={address}>{short(address)} <ExternalLink size={12}/></a>;
  return <><TableRow><TableCell><button type="button" className="governance-vote-secondary" disabled={!addresses} onClick={()=>setOpen(true)}>{w.label}</button></TableCell>
    <TableCell>{link(w.address)}</TableCell>
    <TableCell>{addresses?'₳ '+num(snapshot!.infos.filter(i=>addresses.includes(i.address)).reduce((total,i)=>total+Number(i.balance)/1e6,0)):'Loading balance…'}</TableCell>
    <TableCell>{addresses?count(addresses):'Loading…'}</TableCell>
    <TableCell><button type="button" className="governance-vote-secondary" disabled={!addresses} onClick={()=>setOpen(true)}>{addresses?.length??'—'} linked addresses</button></TableCell>
    <TableCell><button type="button" className="governance-vote-secondary" disabled={primary||busy} onClick={remove} aria-label={`Remove ${w.label} from portfolio`}><Trash2 size={16}/></button></TableCell>
  </TableRow>
  {open&&<AssetOverlay id="portfolio-wallet-addresses" name={w.label} onClose={()=>setOpen(false)}>
    <p className="small muted">Excluded addresses retain their cached balances and transactions. Changes apply to the next refresh. Shared transactions may still update through another wallet address.</p>
    <div className="history-table"><Table><TableHeader><TableRow>{['Wallet','Address','ADA','Transactions','Exclude from refresh'].map(title=><TableHead key={title}>{title}</TableHead>)}</TableRow></TableHeader><TableBody>
      {(addresses||[]).map(address=>{const info=snapshot?.infos.find(row=>row.address===address);return <TableRow key={address}>
        <TableCell>{w.label}</TableCell><TableCell>{link(address)}</TableCell><TableCell>{info?'₳ '+num(Number(info.balance)/1e6):'Unavailable'}</TableCell><TableCell>{count([address])}</TableCell>
        <TableCell><label title={!info&&!excluded.has(address)?'Waiting for the first cached balance':'Applies to the next refresh'}><input type="checkbox" aria-label={`Exclude ${address} from refresh`} checked={excluded.has(address)} disabled={!info&&!excluded.has(address)} onChange={event=>onExclude(address,event.target.checked)}/> Exclude</label></TableCell>
      </TableRow>;})}
    </TableBody></Table></div>
  </AssetOverlay>}</>;
}
