import {useMemo,useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {Pagination,PaginationContent,PaginationItem} from '@/components/ui/pagination';
import {AdaUsdAmount} from './ui';
import {cexTimeline} from './cex';
import type {CexAddress} from './cex';
import {short} from './core';
import type {Fact} from './core';

export function CexTimeline({facts,entries,history,busy}:{facts:Record<string,Fact>;entries:CexAddress[];history:Record<string,number>;busy:boolean}){
  const rows=useMemo(()=>cexTimeline(Object.values(facts),entries,history),[facts,entries,history]);
  const [page,setPage]=useState(0);
  const pages=Math.max(1,Math.ceil(rows.length/25)),current=Math.min(page,pages-1);
  return <section className="portfolio-section" aria-label="Bought and sold timeline">
    <h3 className="governance-card-title">Bought and sold timeline</h3>
    <div className="history-table"><Table><TableHeader><TableRow>
      <TableHead>Date / time</TableHead><TableHead>Bought</TableHead><TableHead>Sold</TableHead><TableHead>Transaction</TableHead>
    </TableRow></TableHeader><TableBody>{rows.slice(current*25,(current+1)*25).map(row=><TableRow key={row.hash}>
      <TableCell><time dateTime={new Date(row.time*1000).toISOString()}>{new Date(row.time*1000).toLocaleDateString()}<span className="small muted"> {new Date(row.time*1000).toLocaleTimeString()}</span></time></TableCell>
      {(['buy','sell'] as const).map(side=><TableCell key={side}>{row.side===side?<><AdaUsdAmount ada={row.ada} usd={row.usd}/>{row.usd===null&&<div className="small muted">Historical USD unavailable</div>}</>:'—'}</TableCell>)}
      <TableCell><a href={`https://cardanoscan.io/transaction/${row.hash}`} target="_blank" rel="noreferrer" title={row.hash} className="address">{short(row.hash)} <ExternalLink size={12}/></a></TableCell>
    </TableRow>)}</TableBody></Table></div>
    {!rows.length&&<p className="empty">{busy?'Loading CEX transfers…':'No classified CEX transfers.'}</p>}
    {rows.length>25&&<Pagination><PaginationContent><PaginationItem><button className="governance-vote-secondary" disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button></PaginationItem><PaginationItem><span className="small px-3">Page {current+1} / {pages}</span></PaginationItem><PaginationItem><button className="governance-vote-secondary" disabled={current===pages-1} onClick={()=>setPage(current+1)}>Next</button></PaginationItem></PaginationContent></Pagination>}
    <p className="small muted">Newest first · Local time · Transfer-day USD estimates · Classified transfers only</p>
  </section>;
}
