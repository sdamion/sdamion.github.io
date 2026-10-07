import {ExternalLink} from 'lucide-react';
import {TableRow,TableCell} from './ui';
import {short} from './core';
import {TransactionDate} from './TransactionTable';
import {formatPortfolioUsd,transactionCurrency,usePortfolioCurrency} from './portfolio-currency';
import {ethereumTransfer,weiToEth,type EthereumTransaction as EthTransaction,type EthereumWallet} from './ethereum';
import {usePortfolioText} from './use-portfolio-text';

export function EthereumTransaction({tx,wallets,exchanges,history,adaHistory}:{tx:EthTransaction;wallets:EthereumWallet[];exchanges:EthereumWallet[];history:Record<string,number>;adaHistory:Record<string,number>}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10);
  const display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null);
  const price=history[date]??null,transfer=ethereumTransfer(tx,wallets,exchanges);
  const own=wallets.filter(w=>w.address===tx.from||w.address===tx.to),cex=exchanges.filter(w=>w.address===tx.from||w.address===tx.to);
  const amount=weiToEth(tx.valueWei),fee=tx.feeWei===null?null:weiToEth(tx.feeWei);
  const format=(eth:number|null)=>display?formatPortfolioUsd(eth!==null&&price!==null?eth*price:null,display):'—';
  return <TableRow>
    <TableCell><strong translate="no" className={transfer?.side==='sell'?'positive':''}>{format(amount)}</strong><div translate="no" className="small muted">{amount.toLocaleString(undefined,{maximumFractionDigits:8})} ETH</div><div className="small muted">{tx.failed?t('Failed'):transfer?`ETH ${transfer.side==='buy'?'IN':'OUT'}`:own.length===2?t('Internal'):t('Ethereum transfer')}</div><a translate="no" href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)} <ExternalLink size={12}/></a></TableCell>
    <TableCell translate="no">{price!==null&&display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">ETH</div></TableCell>
    <TableCell translate="no">{tx.kind==='internal'?t('Fee belongs to parent transaction'):format(fee)}{fee!==null&&<div className="small muted">{fee.toLocaleString(undefined,{maximumFractionDigits:8})} ETH</div>}</TableCell>
    <TableCell>{[...own,...cex].map(w=><div key={w.address} translate="no"><a href={`https://etherscan.io/address/${w.address}`} target="_blank" rel="noreferrer" title={w.address}>{w.name}</a></div>)}</TableCell>
    <TableCell><TransactionDate time={tx.time}/></TableCell>
  </TableRow>;
}
