import {useState} from 'react';
import {Input} from './ui';
import {short} from './core';
import type {Fact,Acquisitions} from './core';
import {adaToLovelace,mintPayments,paymentBudget} from './mint-payments';
import type {PaymentLink} from './mint-payments';
import {assetTransactions} from './asset-transactions';
import {usePortfolioText} from './use-portfolio-text';
import {usePortfolioCurrency,formatPortfolioUsd,formatAdaNumber} from './portfolio-currency';

export function PaymentLinks({id,facts,links,acquisitions,history={},onSave,loading=false}:{id:string;facts:Fact[];links:PaymentLink[];acquisitions:Acquisitions;history?:Record<string,number>;onSave:(links:PaymentLink[])=>void;loading?:boolean}){
  const t=usePortfolioText();
  const display=usePortfolioCurrency();
  const [receipt,setReceipt]=useState(''),[payment,setPayment]=useState(''),[amount,setAmount]=useState(''),[error,setError]=useState('');
  const [editing,setEditing]=useState(false);
  const receipts=facts.filter(f=>!f.internal&&BigInt(f.assets[id]||0)>0n).sort((a,b)=>b.time-a.time);
  const label=(f:Fact)=>new Date(f.time*1000).toLocaleDateString()+' · '+short(f.hash);
  const existing=Object.entries(acquisitions).filter(([,assets])=>!!assets[id]);
  const transactions=assetTransactions(id,facts,acquisitions,history);
  const unmatched=transactions.filter(f=>BigInt(f.raw)>0n&&!f.costKnown);
  const known=transactions.filter(f=>f.costKnown);
  const selectedReceipt=receipt||(receipts.length===1?receipts[0].hash:'');
  const allocated=adaToLovelace(amount);
  const paymentFact=facts.find(f=>f.hash===payment.trim().toLowerCase());
  const canConfirm=!!selectedReceipt&&allocated!==null&&BigInt(allocated)>0n&&!!paymentFact&&paymentBudget(paymentFact)!==null;
  return <section className="portfolio-section"><h3>Asset transactions & purchase payments</h3>
    <p translate="no" className="small muted">{t('{transactions} loaded asset transactions · {known} receipts with purchase costs · {unmatched} receipts without matched costs',{transactions:transactions.length,known:known.length,unmatched:unmatched.length})}</p>
    {transactions.map(tx=><div className="governance-detail-row" key={tx.hash}>
      <a translate="no" href={`https://cardanoscan.io/transaction/${tx.hash}`} target="_blank" rel="noreferrer">{new Date(tx.time*1000).toLocaleDateString()} · {t(tx.kind)} · {short(tx.hash)}</a>
      <span translate="no" className="small">{t('{count} raw asset units',{count:tx.raw})}</span>
      {tx.costAda!==null?<span translate="no" className="small">{t('Purchase cost: ₳ {amount}',{amount:formatAdaNumber(tx.costAda)})}</span>:BigInt(tx.raw)>0n&&<span className="small muted">Purchase cost not linked</span>}
      {tx.costAda!==null&&<span translate="no" className="small muted">{tx.costUsd!==null?t('Historical purchase cost: {amount}',{amount:display?formatPortfolioUsd(tx.costUsd,display):tx.costUsd.toLocaleString(undefined,{style:'currency',currency:'USD'})}):t('Historical ADA/USD price missing for {date}. Refresh purchase data to retry.',{date:new Date(tx.costTime*1000).toISOString().slice(0,10)})}</span>}
      {tx.paymentHash&&tx.paymentHash!==tx.hash&&<a translate="no" className="small" href={`https://cardanoscan.io/transaction/${tx.paymentHash}`} target="_blank" rel="noreferrer">{t('Payment: {hash}',{hash:short(tx.paymentHash)})}</a>}
    </div>)}
    {existing.map(([hash,assets])=><p className="small" key={hash}><a href={`https://cardanoscan.io/transaction/${assets[id].paymentHash}`} target="_blank" rel="noreferrer">{assets[id].source==='allocated-bundle'?'Allocated bundle cost · equal share':assets[id].source==='marketplace'?'Decoded marketplace purchase':assets[id].source==='linked-mint'?'Automatically linked mint payment':assets[id].source==='linked-purchase'?'Inferred linked purchase payment':assets[id].source==='mint'?'Inferred mint payment':'Confirmed payment'}: {assets[id].ada.toLocaleString()} ADA</a> · network fees excluded{assets[id].source==='confirmed'&&<button type="button" className="governance-vote-secondary" onClick={()=>onSave(links.filter(l=>l.receiptHash!==hash||l.assetId!==id))}>Remove link</button>}</p>)}
    <p role="status" className="small muted">{loading?'Automatic payment matching updates as transaction details load.':unmatched.length?'Some loaded receipts have no reliable purchase cost. Unknown costs remain excluded; payments are not guessed.':known.length?'Purchase costs linked automatically or previously confirmed. No selection is needed.':'No purchase receipts are present in the loaded history for this asset.'}</p>
    {existing.length>0&&<p className="small muted">Linked mint payments are purchase costs, not current prices. Gain / loss needs a separate market price or a current price you enter.</p>}
    {links.filter(l=>l.assetId===id&&!acquisitions[l.receiptHash]?.[id]).map((link,index)=><p className="small" key={index}>Saved link pending validation: {short(link.paymentHash)} <button type="button" className="governance-vote-secondary" onClick={()=>onSave(links.filter(l=>l!==link))}>Remove link</button></p>)}
    <button type="button" className="governance-vote-secondary" aria-expanded={editing} onClick={()=>setEditing(!editing)}>{editing?'Hide payment editor':'Manually link or override a payment'}</button>
    {editing&&<div>
    <label className="small">Asset receipt<select aria-label="Asset receipt transaction" value={selectedReceipt} onChange={e=>{setReceipt(e.target.value);setPayment('');setError('');}}><option value="">Select transaction</option>{receipts.map(f=><option key={f.hash} value={f.hash}>{label(f)} · {f.assets[id]} raw units</option>)}</select></label>
    <label className="small">ADA payment transaction hash<Input value={payment} onChange={e=>setPayment(e.target.value)} placeholder="64-character transaction hash"/></label>
    <label className="small">ADA allocated to this receipt<Input type="number" min="0" step="0.000001" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Excluding fees and returned ADA"/></label>
    <p className="small muted">Confirm the payment belongs to this asset. For bundles, enter only this asset's share. A separate payment must be an ADA-only outgoing transaction in your loaded history.</p>
    <button type="button" className="governance-vote-secondary" disabled={!canConfirm} onClick={()=>{
      const lovelace=adaToLovelace(amount),hash=payment.trim().toLowerCase();
      if(!canConfirm||!lovelace)return;
      const next=[...links.filter(l=>l.assetId!==id||l.receiptHash!==selectedReceipt),{assetId:id,receiptHash:selectedReceipt,paymentHash:hash,lovelace}];
      const result=mintPayments(facts,next);if(result.errors.length){setError(result.errors[0]);return;}
      onSave(next);setError('');setAmount('');
    }}>Confirm payment link</button>
    {error&&<p role="alert" className="negative">{error}</p>}
    </div>}
  </section>;
}
