import {useMemo,useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {Input, AdaUsdAmount} from './ui';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {Pagination,PaginationContent,PaginationItem} from '@/components/ui/pagination';
import {validByronAddress} from './exchange-address';
import {discoveredByronAddresses,saveByronSelection,byronGroupTransactions,groupByronAddresses} from './byron-exchanges';
import {cexAdaNetPosition,cexUsdNetPosition,isCexTransaction,cexAdaTransfer} from './cex';
import type {CexAddress} from './cex';
import type {Fact} from './core';
import {short} from './core';
import {AssetOverlay} from './AssetOverlay';

export function AddressTransactions({facts,address,addresses,entries,count}:{facts:Fact[];address:string;addresses?:string[];entries:CexAddress[];count:number}){
  const [open,setOpen]=useState(false);
  const rows=useMemo(()=>open||count===1?byronGroupTransactions(facts,addresses||[address],entries):[],[facts,address,addresses,entries,open,count]);
  if(count===0)return <span className="small muted">No loaded transactions</span>;
  if(count===1&&rows.length===1&&(!addresses||addresses.length===1)){
    const row=rows[0];
    return row.amountRaw===null?<span className="small muted">Mixed or unassigned sources</span>:<span title={row.sharedInputs?'Shared-input transaction total; counted once in Byron totals':undefined}>{row.side==='buy'?'IN':'OUT'} <AdaUsdAmount ada={Number(row.amountRaw)/1e6}/>{row.sharedInputs&&<span className="small muted"> · Shared transaction</span>}</span>;
  }
  return <><button type="button" className="governance-vote-secondary" onClick={()=>setOpen(true)}>View ADA amounts</button>{open&&<AssetOverlay id="portfolio-byron-amounts-overlay" name="Byron ADA amounts" onClose={()=>setOpen(false)}><section className="portfolio-section">{(addresses||[address]).map(item=><div key={item}><a className="address" href={`https://cardanoscan.io/address/${item}`} target="_blank" rel="noreferrer">{short(item)} <ExternalLink size={12}/></a></div>)}<div className="history-table"><Table><TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Date</TableHead><TableHead>ADA IN / OUT</TableHead><TableHead>Wallet change (after fees)</TableHead></TableRow></TableHeader><TableBody>{rows.map(row=><TableRow key={row.hash}>
    <TableCell><a href={`https://cardanoscan.io/transaction/${row.hash}`} target="_blank" rel="noreferrer" title={row.hash}>{short(row.hash)}</a></TableCell>
    <TableCell>{new Date(row.time*1000).toLocaleString()}</TableCell>
    <TableCell>{row.amountRaw===null?'Mixed or unassigned sources':<>{row.side==='buy'?'IN':'OUT'} <AdaUsdAmount ada={Number(row.amountRaw)/1e6}/>{row.sharedInputs&&<div className="small muted">Shared-input transaction total · counted once in Byron totals</div>}</>}</TableCell>
    <TableCell>{BigInt(row.walletChangeRaw)<0n?'OUT':'IN'} <AdaUsdAmount ada={Math.abs(Number(row.walletChangeRaw))/1e6}/></TableCell>
  </TableRow>)}</TableBody></Table>{!rows.length&&<p className="empty">No loaded transactions.</p>}</div></section></AssetOverlay>}</>;
}

export function ByronExchanges({facts,entries,owned,history,complete,onChange}:{facts:Record<string,Fact>;entries:CexAddress[];owned:string[];history:Record<string,number>;complete:boolean;onChange:(entries:CexAddress[])=>boolean}){
  const [choices,setChoices]=useState<Record<string,boolean>>({}),[name,setName]=useState('Byron CEX'),[query,setQuery]=useState(''),[page,setPage]=useState(0),[status,setStatus]=useState('');
  const all=useMemo(()=>Object.values(facts),[facts]);
  const [names,setNames]=useState<Record<string,string>>({});
  const savedNames=useMemo(()=>Object.fromEntries(entries.map(entry=>[entry.address,entry.name])),[entries]);
  const candidates=useMemo(()=>discoveredByronAddresses(all,owned,entries),[all,owned,entries]);
  const group=useMemo(()=>entries.filter(entry=>!owned.includes(entry.address)&&validByronAddress(entry.address)),[entries,owned]);
  const selected=new Set(candidates.filter(row=>choices[row.address]??true).map(row=>row.address));
  const pending=candidates.filter(row=>selected.has(row.address)&&!group.some(entry=>entry.address===row.address)).length;
  const totals=useMemo(()=>cexAdaNetPosition(all,group,'0'),[all,group]);
  const dollars=useMemo(()=>cexUsdNetPosition(all,group,'0',history,null),[all,group,history]);
  const unresolved=useMemo(()=>all.filter(fact=>isCexTransaction(fact,group)&&!cexAdaTransfer(fact,group)).length,[all,group]);
  const combined=useMemo(()=>groupByronAddresses(all,candidates),[all,candidates]);
  const filtered=combined.filter(row=>row.addresses.some(address=>`${address} ${names[address]??savedNames[address]??''}`.toLowerCase().includes(query.trim().toLowerCase())));
  const pages=Math.max(1,Math.ceil(filtered.length/25)),current=Math.min(page,pages-1);
  return <section className="portfolio-section" aria-label="Combined Byron CEX">
    <p className="small muted">Your internal wallets, including Swap, are excluded from this selection and its totals.</p>
    <div className="tdsp-tile-grid">
      <div className="governance-menu-card"><strong className="governance-card-title"><AdaUsdAmount ada={Number(totals.receivedRaw)/1e6} usd={dollars.boughtUsd}/></strong><span className="governance-card-detail">Byron ADA IN</span></div>
      <div className="governance-menu-card"><strong className="governance-card-title"><AdaUsdAmount ada={Number(totals.sentRaw)/1e6} usd={dollars.soldUsd}/></strong><span className="governance-card-detail">Byron ADA OUT</span></div>
    </div>
    <p className="small muted">{group.length} saved addresses · {complete?'Loaded history':'Partial history'} · Transfer-day USD{unresolved?` · ${unresolved} mixed transfers excluded`:''}{dollars.missingPrices?` · ${dollars.missingPrices} transfers missing USD prices`:''}</p>
    <p className="small muted">All discovered Byron addresses are selected by default. Deselect any that do not belong to a CEX, then save to update totals. Exchange ownership is not verified. Saved using your selected Portfolio storage; these addresses are not added to your wallet balances.</p>
    <form className="portfolio-section" onSubmit={event=>{event.preventDefault();const next=saveByronSelection(entries,candidates.map(row=>row.address),selected,name,owned,names);if(onChange(next)){setNames({});setStatus('Byron names and selection saved.');}else setStatus('Could not save the selection.');}}>
      <div className="wallet-form"><label htmlFor="portfolio-byron-name">Name for newly selected addresses<Input id="portfolio-byron-name" name="byron_exchange_name" maxLength={60} required pattern=".*\S.*" value={name} onChange={event=>setName(event.target.value)}/></label><label htmlFor="portfolio-byron-search">Search Byron addresses<Input id="portfolio-byron-search" name="byron_search" value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}}/></label></div>
      <div className="history-table portfolio-address-table"><Table><TableHeader><TableRow><TableHead>Byron addresses / CEX</TableHead><TableHead>Transactions</TableHead><TableHead>Last seen</TableHead><TableHead>ADA amounts</TableHead></TableRow></TableHeader><TableBody>{filtered.slice(current*25,(current+1)*25).map(row=><TableRow key={row.addresses[0]}>
        <TableCell>{row.addresses.length>1&&<div className="small muted">{row.addresses.length} addresses · shared transactions</div>}{row.addresses.map(address=><div key={address} className="portfolio-address-row">
          <Input name={`byron_name_${address}`} aria-label={`Wallet name for ${address}`} maxLength={60} placeholder="Wallet name" value={names[address]??savedNames[address]??''} onChange={event=>{const value=event.target.value;setNames(previous=>({...previous,[address]:value}));setStatus('');}}/>
          <a className="address" title={address} href={`https://cardanoscan.io/address/${address}`} target="_blank" rel="noreferrer"><span>{short(address)}</span><ExternalLink size={12}/></a>
          <label><input type="checkbox" name="byron_cex_selection" aria-label={`Include ${address} in Byron CEX`} checked={selected.has(address)} onChange={event=>{const checked=event.target.checked;setChoices(previous=>({...previous,[address]:checked}));setStatus('');}}/> CEX</label>{selected.has(address)&&!group.some(entry=>entry.address===address)&&<span className="small muted">Not saved</span>}
        </div>)}</TableCell>
        <TableCell>{row.transactions}</TableCell><TableCell>{row.lastSeen===null?'Not in loaded history':new Date(row.lastSeen*1000).toLocaleDateString()}</TableCell>
        <TableCell><AddressTransactions facts={all} address={row.addresses[0]} addresses={row.addresses} entries={group} count={row.transactions}/></TableCell>
      </TableRow>)}</TableBody></Table></div>
      {!filtered.length&&<p className="empty">{query?'No matching Byron addresses.':'No external Byron addresses found in loaded history yet.'}</p>}
      {pages>1&&<Pagination><PaginationContent><PaginationItem><button type="button" className="governance-vote-secondary" disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button></PaginationItem><PaginationItem><span className="small px-3">Page {current+1} / {pages}</span></PaginationItem><PaginationItem><button type="button" className="governance-vote-secondary" disabled={current===pages-1} onClick={()=>setPage(current+1)}>Next</button></PaginationItem></PaginationContent></Pagination>}
      <div className="section-heading"><button type="submit" className="governance-vote-primary">Save selection</button><span className="small muted">{selected.size} selected{pending?` · ${pending} not saved`:''}</span></div>
    </form>
    <p className="small muted" role="status">{status}</p>
  </section>;
}
