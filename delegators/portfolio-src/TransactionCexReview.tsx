import {useState} from 'react';
import {TableRow,TableCell} from './ui';
import {manualCexFlow,type ManualCexCandidate} from './manual-cex';
import {usePortfolioText} from './use-portfolio-text';

export function TransactionCexReview({candidate,savedAddress,onChange}:{candidate:ManualCexCandidate;savedAddress?:string;onChange:(address:string|null)=>void}){
  const t=usePortfolioText();
  const [choice,setChoice]=useState(candidate.choices.find(row=>row.address===savedAddress)?.address||candidate.choices[0].address);
  const selected=candidate.choices.find(row=>row.address===choice)||candidate.choices[0];
  const flow=manualCexFlow(candidate,selected.address,null);
  const checked=!!savedAddress&&candidate.choices.some(row=>row.address===savedAddress);
  const symbol={cardano:'ADA',ethereum:'ETH',solana:'SOL',bitcoin:'BTC'}[candidate.network];
  return <TableRow className="portfolio-cex-review-row"><TableCell colSpan={5}><div className="portfolio-cex-review-content">
    <label className="portfolio-cex-review-control" title={t('Uses the selected wallet on-chain net amount and transfer-day market price, not an exchange execution price.')}><input type="checkbox" checked={checked} aria-label={t('Count transaction as CEX {direction}',{direction:`${symbol} ${flow?.side==='buy'?'IN':'OUT'}`})} onChange={event=>onChange(event.target.checked?selected.address:null)}/>
      <span>{t('Count as CEX transaction')}</span></label>
    {candidate.choices.length>1&&<select aria-label={t('Wallet for CEX review')} value={selected.address} onChange={event=>{setChoice(event.target.value);if(checked)onChange(event.target.value);}}>{candidate.choices.map(row=><option key={row.address} value={row.address}>{row.name} · {BigInt(row.raw)>0n?`${symbol} IN`:`${symbol} OUT`}</option>)}</select>}
    <span className="small muted" translate="no">{symbol} {flow?.side==='buy'?'IN':'OUT'} · {flow?.amount.toLocaleString(undefined,{maximumFractionDigits:candidate.decimals})} {symbol}</span>
    {checked&&<span className="small muted">{t('Manually counted from on-chain wallet movement')}</span>}
  </div></TableCell></TableRow>;
}
