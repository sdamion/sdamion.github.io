import {useState} from 'react';
import type {Tx} from './core';
import {short} from './core';
import {AssetOverlay} from './AssetOverlay';
import {TransactionPagination} from './TransactionPagination';
import {TransactionLink,TransactionDate} from './TransactionTable';
import {transactionPage} from './transaction-date';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';

export function UnknownOwnership({txs,addresses,busy,onAssign,onClose}:{txs:Tx[];addresses:string[];busy:boolean;onAssign:(hash:string,address:string)=>Promise<void>;onClose:()=>void}){
  const [page,setPage]=useState(0),[selected,setSelected]=useState<Record<string,string>>({});
  const [pending,setPending]=useState(''),[error,setError]=useState('');
  const current=transactionPage(page,txs.length);
  async function assign(hash:string){
    setPending(hash);setError('');
    try{await onAssign(hash,selected[hash]);}catch(e){setError(e instanceof Error?e.message:'Assignment failed.');}finally{setPending('');}
  }
  return <AssetOverlay id="portfolio-unknown-overlay" name="Unknown ownership" onClose={onClose}>
    <p className="small muted">Cached transactions without a known wallet link. Select your address to verify and analyse the transaction. Only actual inputs and outputs determine amounts.</p>
    {busy&&<p className="small muted" role="status">Wait for the current refresh or verification to finish before assigning.</p>}
    {error&&<p className="negative" role="alert">{error}</p>}
    {!txs.length?<p>No transactions with unknown ownership.</p>:<>
      <TransactionPagination page={current.page} count={txs.length} onPage={setPage} position="top"/>
      <div className="history-table"><Table><TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Date</TableHead><TableHead>Wallet address</TableHead><TableHead>Assign</TableHead></TableRow></TableHeader><TableBody>
        {txs.slice(current.page*100,(current.page+1)*100).map(tx=><TableRow key={tx.tx_hash}>
          <TableCell><TransactionLink hash={tx.tx_hash}/></TableCell>
          <TableCell><TransactionDate time={tx.block_time}/></TableCell>
          <TableCell><select aria-label={`Wallet for ${tx.tx_hash}`} value={selected[tx.tx_hash]||''} disabled={busy||!!pending} onChange={e=>setSelected({...selected,[tx.tx_hash]:e.target.value})}><option value="">Select wallet address</option>{addresses.map(a=><option key={a} value={a}>{short(a)}</option>)}</select></TableCell>
          <TableCell><button type="button" className="governance-vote-secondary" disabled={busy||!!pending||!selected[tx.tx_hash]} onClick={()=>void assign(tx.tx_hash)}>{pending===tx.tx_hash?'Verifying…':'Assign'}</button></TableCell>
        </TableRow>)}
      </TableBody></Table></div>
      <TransactionPagination page={current.page} count={txs.length} onPage={setPage} position="bottom"/>
    </>}
  </AssetOverlay>;
}
