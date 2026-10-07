import type {ReactNode} from 'react';
import {ExternalLink} from 'lucide-react';
import {short} from './core';
import {lovelaceToAda} from './transaction-amounts';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell,AdaUsdAmount} from './ui';
import {AssetWalletAddresses} from './AssetWalletAddresses';
import {PortfolioCurrencyContext,usePortfolioCurrency,transactionCurrency,formatPortfolioUsd,formatPortfolioAda,formatAdaNumber} from './portfolio-currency';
import {usePortfolioText} from './use-portfolio-text';

export function TransactionAmount({ada,usd,tone,time}:{ada:number|null;usd:number|null;tone?:'positive'|'negative'|'';time?:number}){
  const context=usePortfolioCurrency();
  const display=time===undefined?context:transactionCurrency(context,time);
  return ada===null?<>—</>:<strong translate="no" className={`portfolio-transfer-amount ${tone??(ada>=0?'positive':'negative')}`}>{display?display.currency==='ADA'?formatPortfolioAda(Math.abs(ada),display):formatPortfolioUsd(usd===null?null:Math.abs(usd),display):<AdaUsdAmount ada={ada} usd={usd}/>}</strong>;
}

export function TransactionWallets({labels,exchanges}:{labels:string[];exchanges:{name:string;address:string}[]}){
  const names=[...new Set(exchanges.map(exchange=>exchange.name))];
  return <>{names.length>0&&<strong translate="no">{names.join(' · ')}</strong>}<div className="small muted"><TransactionWalletLabels labels={labels}/></div>{exchanges.length>0&&<AssetWalletAddresses compact addresses={[...new Set(exchanges.map(exchange=>exchange.address))]} names={names}/>}</>;
}

export function TransactionLink({hash}:{hash:string}){
  return <a href={`https://cardanoscan.io/transaction/${hash}`} target="_blank" rel="noreferrer" title={hash}>{short(hash)} <ExternalLink size={12}/></a>;
}

export function TransactionDate({time}:{time:number}){
  const date=new Date(time*1000);
  return <>{date.toLocaleDateString()}<div className="small muted">{date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></>;
}

export function TransactionTable({children,multiAsset=false}:{children:ReactNode;multiAsset?:boolean}){
  const display=usePortfolioCurrency(),t=usePortfolioText();
  return <div className="history-table"><Table><TableHeader><TableRow>{[multiAsset?'Amount':'ADA Amount',multiAsset?'Unit price':'USD/ADA Price','Fee','Wallets','Date'].map(label=><TableHead key={label} translate="no">{display?t(label).replace(label==='ADA Amount'?'ADA':'USD',display.currency):t(label)}</TableHead>)}</TableRow></TableHeader><TableBody>{children}</TableBody></Table></div>;
}

export function TransactionWalletLabels({labels,inline=false}:{labels:string[];inline?:boolean}){
  return <>{labels.map((label,index)=><span key={label} style={inline?undefined:{display:'block'}}>{inline&&index>0?' · ':''}<span translate={label.startsWith('DEX contract: ')?undefined:'no'} className={label.startsWith('DEX contract: ')?'portfolio-dex-label':undefined}>{label}</span></span>)}</>;
}

export function TransactionRow({hash,time,amount,kind,price,feeRaw,wallets,details,priceDetails}:{hash:string;time:number;amount:ReactNode;kind?:ReactNode;price?:number|null;feeRaw?:string|null;wallets:ReactNode;details?:ReactNode;priceDetails?:ReactNode}){
  const display=transactionCurrency(usePortfolioCurrency(),time,price??null);
  return <PortfolioCurrencyContext.Provider value={display}><TableRow className="portfolio-transfer-row">
    <TableCell>{amount}{kind&&<div className="small muted">{kind}</div>}<div className="small"><TransactionLink hash={hash}/></div>{details}</TableCell>
    <TableCell>{price!=null&&price>0?display?'≈ '+formatPortfolioUsd(price,display,6):'≈ $'+price.toLocaleString('en-US',{maximumFractionDigits:6}):'Unavailable'}{priceDetails}</TableCell>
    <TableCell title="Total on-chain transaction fee; not necessarily paid by your wallet">{feeRaw!=null?display?formatPortfolioAda(lovelaceToAda(feeRaw),display,price??null):'₳ '+formatAdaNumber(lovelaceToAda(feeRaw)!):'Unavailable'}</TableCell>
    <TableCell>{wallets}</TableCell>
    <TableCell><TransactionDate time={time}/></TableCell>
  </TableRow></PortfolioCurrencyContext.Provider>;
}
