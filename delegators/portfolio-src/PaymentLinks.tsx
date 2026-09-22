import {useState} from 'react';
import {Input} from './ui';
import {short} from './core';
import type {Fact,Acquisitions} from './core';
import {adaToLovelace,mintPayments,paymentBudget} from './mint-payments';
import type {PaymentLink} from './mint-payments';

export function PaymentLinks({id,facts,links,acquisitions,onSave,loading=false}:{id:string;facts:Fact[];links:PaymentLink[];acquisitions:Acquisitions;onSave:(links:PaymentLink[])=>void;loading?:boolean}){
  const [receipt,setReceipt]=useState(''),[payment,setPayment]=useState(''),[amount,setAmount]=useState(''),[error,setError]=useState('');
  const [open,setOpen]=useState(false);
  const receipts=open?facts.filter(f=>!f.internal&&BigInt(f.assets[id]||0)>0n).sort((a,b)=>b.time-a.time):[];
  const label=(f:Fact)=>new Date(f.time*1000).toLocaleDateString()+' · '+short(f.hash);
  const existing=Object.entries(acquisitions).filter(([,assets])=>!!assets[id]);
  const unmatched=receipts.filter(f=>!acquisitions[f.hash]?.[id]);
  const selectedReceipt=receipt||(receipts.length===1?receipts[0].hash:'');
  const allocated=adaToLovelace(amount);
  const paymentFact=facts.find(f=>f.hash===payment.trim().toLowerCase());
  const canConfirm=!!selectedReceipt&&allocated!==null&&BigInt(allocated)>0n&&!!paymentFact&&paymentBudget(paymentFact)!==null;
  return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary className="small">Mint / purchase payment</summary>{open&&<>
    {existing.map(([hash,assets])=><p className="small" key={hash}><a href={`https://cardanoscan.io/transaction/${assets[id].paymentHash}`} target="_blank" rel="noreferrer">{assets[id].source==='linked-mint'?'Automatically linked mint payment':assets[id].source==='mint'?'Inferred mint payment':'Confirmed payment'}: {assets[id].ada.toLocaleString()} ADA</a> · fees excluded{assets[id].source==='confirmed'&&<button type="button" className="governance-vote-secondary" onClick={()=>onSave(links.filter(l=>l.receiptHash!==hash||l.assetId!==id))}>Remove link</button>}</p>)}
    <p role="status" className="small muted">{loading?'Automatic payment matching updates as transaction details load.':unmatched.length||!existing.length?'No reliable automatic payment link was found for some receipts in the loaded history. Unknown costs remain excluded; payments are not guessed.':'Payments linked automatically or previously confirmed. No selection is needed.'}</p>
    {existing.length>0&&<p className="small muted">Linked mint payments are purchase costs, not current prices. Gain / loss needs a separate market price or a current price you enter.</p>}
    {links.filter(l=>l.assetId===id&&!acquisitions[l.receiptHash]?.[id]).map((link,index)=><p className="small" key={index}>Saved link pending validation: {short(link.paymentHash)} <button type="button" className="governance-vote-secondary" onClick={()=>onSave(links.filter(l=>l!==link))}>Remove link</button></p>)}
    <details><summary className="small">Optional: manually link or override a payment</summary>
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
    </details>
  </>}</details>;
}
