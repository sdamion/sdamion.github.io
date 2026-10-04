import type {ReactNode} from 'react';
import {ExternalLink} from 'lucide-react';
import {short} from './core';
import {lovelaceToAda} from './transaction-amounts';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell,AdaUsdAmount} from './ui';
import {AssetWalletAddresses} from './AssetWalletAddresses';

export function TransactionAmount({ada,usd,tone}:{ada:number|null;usd:number|null;tone?:'positive'|'negative'}){
  return ada===null?<>—</>:<strong className={`portfolio-transfer-amount ${tone??(ada>=0?'positive':'negative')}`}><AdaUsdAmount ada={ada} usd={usd}/></strong>;
}

export function TransactionWallets({labels,exchanges}:{labels:string[];exchanges:{name:string;address:string}[]}){
  const names=[...new Set(exchanges.map(exchange=>exchange.name))];
  return <>{names.length>0&&<strong>{names.join(' · ')}</strong>}<div className="small muted"><TransactionWalletLabels labels={labels}/></div>{exchanges.length>0&&<AssetWalletAddresses compact addresses={[...new Set(exchanges.map(exchange=>exchange.address))]} names={names}/>}</>;
}

export function TransactionLink({hash}:{hash:string}){
  return <a href={`https://cardanoscan.io/transaction/${hash}`} target="_blank" rel="noreferrer" title={hash}>{short(hash)} <ExternalLink size={12}/></a>;
}

export function TransactionDate({time}:{time:number}){
  const date=new Date(time*1000);
  return <>{date.toLocaleDateString()}<div className="small muted">{date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></>;
}

export function TransactionTable({children}:{children:ReactNode}){
  return <div className="history-table"><Table><TableHeader><TableRow>{['ADA Amount','USD/ADA Price','Fee','Wallets','Date'].map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{children}</TableBody></Table></div>;
}

export function TransactionWalletLabels({labels,inline=false}:{labels:string[];inline?:boolean}){
  return <>{labels.map((label,index)=><span key={label} style={inline?undefined:{display:'block'}}>{inline&&index>0?' · ':''}<span className={label.startsWith('DEX contract: ')?'portfolio-dex-label':undefined}>{label}</span></span>)}</>;
}

export function TransactionRow({hash,time,amount,kind,price,feeRaw,wallets,details,priceDetails}:{hash:string;time:number;amount:ReactNode;kind?:ReactNode;price?:number|null;feeRaw?:string|null;wallets:ReactNode;details?:ReactNode;priceDetails?:ReactNode}){
  return <TableRow className="portfolio-transfer-row">
    <TableCell>{amount}{kind&&<div className="small muted">{kind}</div>}<div className="small"><TransactionLink hash={hash}/></div>{details}</TableCell>
    <TableCell>{price!=null&&price>0?'≈ $'+price.toLocaleString('en-US',{maximumFractionDigits:6}):'Unavailable'}{priceDetails}</TableCell>
    <TableCell title="Total on-chain transaction fee; not necessarily paid by your wallet">{feeRaw!=null?'₳ '+lovelaceToAda(feeRaw)!.toLocaleString('en-US',{maximumFractionDigits:6}):'Unavailable'}</TableCell>
    <TableCell>{wallets}</TableCell>
    <TableCell><TransactionDate time={time}/></TableCell>
  </TableRow>;
}
