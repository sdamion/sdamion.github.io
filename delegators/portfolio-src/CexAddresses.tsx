import {useState} from 'react';
import {Plus,Trash2,ExternalLink} from 'lucide-react';
import {Input} from './ui';
import {short} from './core';
import {validWalletAddress,validStakeAddress} from './member';
import type {CexAddress} from './cex';

export function CexAddresses({entries,owned,onChange}:{entries:CexAddress[];owned:string[];onChange:(entries:CexAddress[])=>boolean}){
  const [name,setName]=useState(''),[address,setAddress]=useState(''),[error,setError]=useState('');
  return <section className="portfolio-section"><h2>CEX addresses</h2>
    <p className="small muted">Exchange payment or stake addresses for incoming and outgoing transfers. Labels are saved in this browser. Transfers do not establish a purchase or sale.</p>
    <form className="wallet-form governance-drep-registration-form" onSubmit={event=>{
      event.preventDefault();const value=address.trim().toLowerCase();setError('');
      if(!validWalletAddress(value)){setError('Enter a valid mainnet payment or stake address (addr1… or stake1…).');return;}
      if(owned.includes(value)){setError('This address belongs to a wallet in your portfolio.');return;}
      if(entries.some(entry=>entry.address===value)){setError('This CEX address is already saved.');return;}
      if(onChange([...entries,{address:value,name:name.trim()}])){setName('');setAddress('');}
    }}>
      <label htmlFor="portfolio-cex-name">Exchange name<Input id="portfolio-cex-name" name="exchange_name" value={name} onChange={event=>setName(event.target.value)} maxLength={60} required pattern=".*\S.*" placeholder="Exchange name"/></label>
      <label className="address-field" htmlFor="portfolio-cex-address">Payment or stake address<Input id="portfolio-cex-address" name="exchange_address" value={address} onChange={event=>setAddress(event.target.value)} required placeholder="addr1… or stake1…"/></label>
      <button className="governance-vote-primary" type="submit"><Plus size={16}/>Add CEX address</button>
    </form><p className="negative" role="status">{error}</p>
    <div className="tdsp-tile-grid">{entries.map(entry=><div className="governance-menu-card" key={entry.address}>
      <div className="wallet-title"><strong className="governance-card-title">{entry.name}</strong><button className="governance-vote-secondary" title={`Remove ${entry.name} address`} aria-label={`Remove ${entry.name} address`} onClick={()=>onChange(entries.filter(item=>item.address!==entry.address))}><Trash2 size={16}/></button></div>
      <a className="address" title={entry.address} href={`https://cardanoscan.io/${validStakeAddress(entry.address)?'stakekey':'address'}/${entry.address}`} target="_blank" rel="noreferrer">{short(entry.address)} <ExternalLink size={12}/></a>
    </div>)}</div>
  </section>;
}
