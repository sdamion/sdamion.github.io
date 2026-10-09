import type {ReactNode} from 'react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {formatPortfolioAmount,usePortfolioCurrency} from './portfolio-currency';
import type {ComparisonCurrency} from './transfer-comparison';
import {usePortfolioText} from './use-portfolio-text';

export function NativeTransferSummary({symbol,totals,currency,className,proceeds}:{symbol:'ADA'|'ETH'|'SOL';totals:{incoming:number|null;outgoing:number|null;inFiat:number|null;outFiat:number|null};currency:ComparisonCurrency;className?:string;proceeds?:{amount:number|null;value:number|null;details?:ReactNode}}){
  const display=usePortfolioCurrency(),t=usePortfolioText();
  const decimals={ADA:6,ETH:8,SOL:9}[symbol];
  return <Table variant="comparison" className={className}>
    <TableHeader><TableRow><TableHead translate="no">{symbol} IN</TableHead><TableHead translate="no">{symbol} OUT</TableHead></TableRow></TableHeader>
    <TableBody><TableRow>{[{amount:totals.incoming,value:totals.inFiat},{amount:totals.outgoing,value:totals.outFiat}].map((total,index)=><TableCell key={index}>
      <strong translate="no" className={`portfolio-transfer-amount ${index?'positive':''}`}><span className="pool-delegator-amount">
        <span>{total.amount===null?'—':total.amount.toLocaleString(display?.locale,{maximumFractionDigits:decimals})} {symbol}</span>
        {!(symbol==='ADA'&&currency==='ADA')&&<span className="pool-delegator-usd">≈ {display?formatPortfolioAmount(total.value,{...display,currency}):'—'}</span>}
      </span></strong>
    </TableCell>)}</TableRow>
      {proceeds&&<TableRow><TableCell>{t('Mining / services proceeds')}</TableCell><TableCell translate="no">
        <span>{proceeds.amount===null?'—':proceeds.amount.toLocaleString(display?.locale,{maximumFractionDigits:decimals})} {symbol}</span>
        {!(symbol==='ADA'&&currency==='ADA')&&<div className="small muted">≈ {display?formatPortfolioAmount(proceeds.value,{...display,currency}):'—'}</div>}
        {proceeds.details}
      </TableCell></TableRow>}
    </TableBody>
  </Table>;
}
