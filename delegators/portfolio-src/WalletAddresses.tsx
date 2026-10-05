import {useState} from 'react';
import {ExternalLink,Trash2} from 'lucide-react';
import type {Wallet} from './core';
import type {Snapshot} from './cache';
import {short} from './core';
import {validStakeAddress,walletTransactionCount} from './member';
import {AssetOverlay} from './AssetOverlay';
import {Input,Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {usePortfolioText} from './use-portfolio-text';

const num=(value:number)=>value.toLocaleString('en-US',{maximumFractionDigits:6});
export function WalletCard({wallet:w,primary,snapshot,remove,busy,excluded,onExclude,onRename}:{wallet:Wallet;primary:boolean;snapshot:Snapshot|null;remove:()=>void;busy:boolean;excluded:Set<string>;onExclude:(address:string|string[],value:boolean)=>void;onRename?:(name:string)=>void}){
  const t=usePortfolioText();
  const [open,setOpen]=useState(false);
  const [hideExcluded,setHideExcluded]=useState(false);
  const [hideLowActivity,setHideLowActivity]=useState(true);
  const addresses=snapshot?.groups?.[w.address];
  const excludable=(addresses||[]).filter(address=>snapshot?.infos.some(info=>info.address===address));
  const runtime=(window as unknown as {TDSPRuntime:{filterMarkedRows:<T>(rows:T[],hide:boolean,marked:(row:T)=>boolean)=>T[]}}).TDSPRuntime;
  const facts=Object.values(snapshot?.facts||{});
  const visibleAddresses=runtime.filterMarkedRows(addresses||[],hideExcluded,address=>excluded.has(address))
    .filter(address=>!hideLowActivity||walletTransactionCount(facts,[address])>=10);
  const count=(linked:string[])=>walletTransactionCount(facts,linked).toLocaleString('en-US');
  const link=(address:string)=><a className="address" href={`https://cardanoscan.io/${validStakeAddress(address)?'stakekey':'address'}/${address}`} target="_blank" rel="noreferrer" title={address}>{short(address)} <ExternalLink size={12}/></a>;
  return <><TableRow><TableCell><button translate="no" type="button" className="governance-vote-secondary" disabled={!addresses} onClick={()=>setOpen(true)}>{w.label}</button></TableCell>
    <TableCell>{link(w.address)}</TableCell>
    <TableCell>{addresses?'₳ '+num(snapshot!.infos.filter(i=>addresses.includes(i.address)).reduce((total,i)=>total+Number(i.balance)/1e6,0)):'Loading balance…'}</TableCell>
    <TableCell>{addresses?count(addresses):'Loading…'}</TableCell>
    <TableCell><button type="button" className="governance-vote-secondary" disabled={!addresses} onClick={()=>setOpen(true)}>{addresses?.length??'—'} linked addresses</button></TableCell>
    <TableCell><button type="button" className="governance-vote-secondary" disabled={primary||busy} onClick={remove} aria-label={`Remove ${w.label} from portfolio`}><Trash2 size={16}/></button></TableCell>
  </TableRow>
  {open&&<AssetOverlay id="portfolio-wallet-addresses" name={w.label} literalTitle onClose={()=>setOpen(false)}>
    {onRename&&<label className="small">Wallet name<Input defaultValue={w.label} maxLength={60} onBlur={event=>{const name=event.target.value.trim();if(name&&name!==w.label)onRename(name);else event.target.value=w.label;}}/></label>}
    <p className="small muted">Excluded addresses retain their cached balances and transactions. Changes apply to the next refresh. Shared transactions may still update through another wallet address.</p>
    <div className="governance-action-buttons" role="group" aria-label="Exclude from refresh selection">
      <button type="button" className="governance-vote-secondary" title="Exclude all addresses with a cached balance, including hidden addresses" disabled={!excludable.some(address=>!excluded.has(address))} onClick={()=>onExclude(excludable,true)}>Select all</button>
      <button type="button" className="governance-vote-secondary" title="Enable refresh for all addresses in this wallet, including hidden addresses" disabled={!addresses?.some(address=>excluded.has(address))} onClick={()=>onExclude(addresses||[],false)}>Unselect all</button>
    </div>
    <label className="raffle-lost-stake-toggle"><input type="checkbox" checked={hideExcluded} onChange={event=>setHideExcluded(event.target.checked)}/><span>Hide excluded addresses</span></label>
    <label className="raffle-lost-stake-toggle"><input type="checkbox" checked={hideLowActivity} onChange={event=>setHideLowActivity(event.target.checked)}/><span>Hide addresses with fewer than 10 transactions</span></label>
    <p className="small muted">After complete analysis, addresses with fewer than 10 transactions are skipped during regular refreshes. Their saved balances and transactions remain yours. Use Rescan all wallets to check them again.</p>
    <p translate="no" className="small muted" role="status">{t('{shown} shown · {hidden} hidden',{shown:visibleAddresses.length,hidden:(addresses?.length||0)-visibleAddresses.length})}</p>
    <div className="history-table"><Table><TableHeader><TableRow>{['Wallet','Address','ADA','Transactions','Exclude from refresh'].map(title=><TableHead key={title}>{title}</TableHead>)}</TableRow></TableHeader><TableBody>
      {visibleAddresses.map(address=>{const info=snapshot?.infos.find(row=>row.address===address);return <TableRow key={address}>
        <TableCell translate="no">{w.label}</TableCell><TableCell>{link(address)}</TableCell><TableCell>{info?'₳ '+num(Number(info.balance)/1e6):'Unavailable'}</TableCell><TableCell>{count([address])}</TableCell>
        <TableCell><label title={!info&&!excluded.has(address)?'Waiting for the first cached balance':'Applies to the next refresh'}><input type="checkbox" aria-label={`Exclude ${address} from refresh`} checked={excluded.has(address)} disabled={!info&&!excluded.has(address)} onChange={event=>onExclude(address,event.target.checked)}/> Exclude</label></TableCell>
      </TableRow>;})}
    </TableBody></Table></div>
  </AssetOverlay>}</>;
}
