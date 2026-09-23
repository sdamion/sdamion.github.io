import {useState} from 'react';
import {Plus,Trash2,ExternalLink} from 'lucide-react';
import {Input} from './ui';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {short} from './core';
import {validStakeAddress} from './member';
import {normalizeExchangeAddress,validExchangeAddress,validByronAddress} from './exchange-address';
import type {CexAddress} from './cex';

export function CexAddresses({entries,owned,onChange}:{entries:CexAddress[];owned:string[];onChange:(entries:CexAddress[])=>boolean}){
  const [name,setName]=useState(''),[address,setAddress]=useState(''),[error,setError]=useState('');
  return <section className="portfolio-section">
    <p className="small muted">Saved exchange addresses use your CEX rule: incoming ADA is a buy, outgoing ADA a sell. This does not decode DEX swaps. Saved in this browser.</p>
    <form className="wallet-form governance-drep-registration-form" onSubmit={event=>{
      event.preventDefault();const value=normalizeExchangeAddress(address);setError('');
      if(!validExchangeAddress(value)){setError('Enter a valid mainnet payment, stake or Byron address (addr1…, stake1…, DdzFF… or Ae2…).');return;}
      if(owned.includes(value)){setError('This address belongs to a wallet in your portfolio.');return;}
      if(entries.some(entry=>entry.address===value)){setError('This CEX address is already saved.');return;}
      if(onChange([...entries,{address:value,name:name.trim()}])){setName('');setAddress('');}
    }}>
      <label htmlFor="portfolio-cex-name">Exchange name<Input id="portfolio-cex-name" name="exchange_name" value={name} onChange={event=>setName(event.target.value)} maxLength={60} required pattern=".*\S.*" placeholder="Exchange name"/></label>
      <label className="address-field" htmlFor="portfolio-cex-address">Payment, stake or Byron address<Input id="portfolio-cex-address" name="exchange_address" value={address} onChange={event=>setAddress(event.target.value)} autoCapitalize="none" spellCheck={false} required placeholder="addr1…, stake1…, DdzFF… or Ae2…"/></label>
      <button className="governance-vote-primary" type="submit"><Plus size={16}/>Add CEX address</button>
    </form><p className="negative" role="status">{error}</p>
    <div className="history-table"><Table><TableHeader><TableRow><TableHead>Exchange</TableHead><TableHead>Address</TableHead><TableHead>Remove</TableHead></TableRow></TableHeader><TableBody>{entries.filter(entry=>!validByronAddress(entry.address)).map(entry=><TableRow key={entry.address}>
      <TableCell>{entry.name}</TableCell>
      <TableCell><a className="address" title={entry.address} href={`https://cardanoscan.io/${validStakeAddress(entry.address)?'stakekey':'address'}/${entry.address}`} target="_blank" rel="noreferrer">{short(entry.address)} <ExternalLink size={12}/></a></TableCell>
      <TableCell><button className="governance-vote-secondary" title={`Remove ${entry.name} address`} aria-label={`Remove ${entry.name} address`} onClick={()=>onChange(entries.filter(item=>item.address!==entry.address))}><Trash2 size={16}/></button></TableCell>
    </TableRow>)}</TableBody></Table></div>
  </section>;
}
