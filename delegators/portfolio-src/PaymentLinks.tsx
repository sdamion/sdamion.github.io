import {useState} from 'react';
import {Input} from './ui';
import {short} from './core';
import type {Fact,Acquisitions} from './core';
import {adaToLovelace,mintPayments,paymentBudget} from './mint-payments';
import type {PaymentLink} from './mint-payments';

export function PaymentLinks({id,facts,links,acquisitions,onSave}:{id:string;facts:Fact[];links:PaymentLink[];acquisitions:Acquisitions;onSave:(links:PaymentLink[])=>void}){
  const [receipt,setReceipt]=useState(''),[payment,setPayment]=useState(''),[amount,setAmount]=useState(''),[error,setError]=useState('');
  const [open,setOpen]=useState(false);
  const receipts=open?facts.filter(f=>!f.internal&&BigInt(f.assets[id]||0)>0n).sort((a,b)=>b.time-a.time):[];
  const label=(f:Fact)=>new Date(f.time*1000).toLocaleDateString()+' · '+short(f.hash);
  const existing=Object.entries(acquisitions).filter(([,assets])=>!!assets[id]);
  return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary className="small">Mint / purchase payment</summary>{open&&<>
    {existing.map(([hash,assets])=><p className="small" key={hash}><a href={`https://cardanoscan.io/transaction/${assets[id].paymentHash}`} target="_blank" rel="noreferrer">{assets[id].source==='mint'?'Inferred mint payment':'Confirmed payment'}: {assets[id].ada.toLocaleString()} ADA</a> · fees excluded{assets[id].source==='confirmed'&&<button type="button" className="governance-vote-secondary" onClick={()=>onSave(links.filter(l=>l.receiptHash!==hash||l.assetId!==id))}>Remove link</button>}</p>)}
    {links.filter(l=>l.assetId===id&&!acquisitions[l.receiptHash]?.[id]).map((link,index)=><p className="small" key={index}>Saved link pending validation: {short(link.paymentHash)} <button type="button" className="governance-vote-secondary" onClick={()=>onSave(links.filter(l=>l!==link))}>Remove link</button></p>)}
    <label className="small">Asset receipt<select aria-label="Asset receipt transaction" value={receipt} onChange={e=>{setReceipt(e.target.value);setPayment('');}}><option value="">Select transaction</option>{receipts.map(f=><option key={f.hash} value={f.hash}>{label(f)} · {f.assets[id]} raw units</option>)}</select></label>
    <label className="small">ADA payment transaction hash<Input value={payment} onChange={e=>setPayment(e.target.value)} placeholder="64-character transaction hash"/></label>
    <label className="small">ADA allocated to this receipt<Input type="number" min="0" step="0.000001" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Excluding fees and returned ADA"/></label>
    <p className="small muted">Confirm the payment belongs to this asset. For bundles, enter only this asset's share. A separate payment must be an ADA-only outgoing transaction in your loaded history.</p>
    <button type="button" className="governance-vote-secondary" onClick={()=>{
      const lovelace=adaToLovelace(amount),hash=payment.trim().toLowerCase();
      if(!receipt||!lovelace||!facts.some(f=>f.hash===hash&&paymentBudget(f)!==null)){setError('Select a receipt and a loaded outgoing payment, then enter the allocated ADA amount.');return;}
      const next=[...links.filter(l=>l.assetId!==id||l.receiptHash!==receipt),{assetId:id,receiptHash:receipt,paymentHash:hash,lovelace}];
      const result=mintPayments(facts,next);if(result.errors.length){setError(result.errors[0]);return;}
      onSave(next);setError('');setAmount('');
    }}>Confirm payment link</button>
    {error&&<p role="alert" className="negative">{error}</p>}
  </>}</details>;
}
