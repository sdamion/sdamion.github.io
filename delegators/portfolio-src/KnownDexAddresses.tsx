import {useState} from 'react';
import {Copy,ExternalLink} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {short} from './core';
import {knownDexAddresses,knownDexIdentity} from './known-dex-addresses';
import {NamedTableGroups} from './TableGroupToggle';

export function KnownDexAddresses(){
  const [status,setStatus]=useState('');
  async function copy(address:string){
    try{await navigator.clipboard.writeText(address);setStatus('Copied.');}
    catch{setStatus('Could not copy.');}
  }
  return <section className="portfolio-section">
    <h2>Known DEX contracts</h2>
    <p className="small muted">Published contract references, not your wallets. These do not change balances, CEX totals or paid fees. Script hashes identify contracts, not payment addresses. This is not a complete DEX directory.</p>
    <div className="history-table"><Table><TableHeader><TableRow><TableHead>DEX</TableHead><TableHead>Address / script hash</TableHead><TableHead>Source</TableHead><TableHead>Copy</TableHead></TableRow></TableHeader><TableBody><NamedTableGroups rows={knownDexAddresses} nameOf={entry=>entry.name} columns={4} renderRow={entry=>{const identity=knownDexIdentity(entry);return <TableRow key={identity.value}>
      <TableCell>{entry.name}<div className="small muted">{entry.role}</div></TableCell>
      <TableCell><a className="address" title={identity.value} href={identity.url} target="_blank" rel="noreferrer">{short(identity.value)} <ExternalLink size={12}/></a><div className="small muted">{identity.label}</div></TableCell>
      <TableCell><a href={entry.source} target="_blank" rel="noreferrer">{entry.source.includes('StricaHQ')?'Contract registry':entry.source.includes('graphql')?'Official API':'Official source'} <ExternalLink size={12}/></a></TableCell>
      <TableCell><button type="button" className="governance-vote-secondary" title={`Copy ${entry.name} ${entry.role} ${identity.label}`} aria-label={`Copy ${entry.name} ${entry.role} ${identity.label}`} onClick={()=>void copy(identity.value)}><Copy size={16}/></button></TableCell>
    </TableRow>;}}/></TableBody></Table></div><p className="small muted" role="status">{status}</p>
  </section>;
}
