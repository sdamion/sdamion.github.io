import {ExternalLink} from 'lucide-react';
import {short} from './core';
import {TransactionDate,TransactionLayout} from './TransactionTable';
import {formatPortfolioUsd,transactionCurrency,usePortfolioCurrency} from './portfolio-currency';
import {ethereumTransfer,ethereumSwapDirection,directEthereumDeposit,weiToEth,weiToEthText,type EthereumTransaction as EthTransaction,type EthereumWallet} from './ethereum';
import {usePortfolioText} from './use-portfolio-text';
import {isOutAddress} from './out-address';

export function EthereumTransaction({tx,wallets,exchanges,history,adaHistory,internalSwap=false,compact=false}:{tx:EthTransaction;wallets:EthereumWallet[];exchanges:EthereumWallet[];history:Record<string,number>;adaHistory:Record<string,number>;internalSwap?:boolean;compact?:boolean}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10);
  const display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null);
  const price=history[date]??null,transfer=internalSwap?null:ethereumTransfer(tx,wallets,exchanges);
  const own=wallets.filter(w=>w.address===tx.from||w.address===tx.to),cex=exchanges.filter(w=>w.address===tx.from||w.address===tx.to);
  const amount=weiToEth(tx.valueWei),fee=tx.feeWei===null?null:weiToEth(tx.feeWei);
  const format=(eth:number|null)=>display?formatPortfolioUsd(eth!==null&&price!==null?eth*price:null,display):'—';
  const incoming=ethereumSwapDirection(tx,wallets)??wallets.some(w=>w.address===tx.to);
  const deposit=directEthereumDeposit(tx,wallets,exchanges);
  const label=compact?`ETH ${incoming?'IN':'OUT'}`:tx.failed?t('Failed'):internalSwap?t('Internal cross-chain swap'):deposit?t('Direct CEX deposit'):transfer?`ETH ${transfer.side==='buy'||'mined' in transfer?'IN':'OUT'}`:own.filter(wallet=>wallet.group!=='swap').length===2?t('Internal'):t('Ethereum transfer');
  return <TransactionLayout compact={compact} cells={[
    <><strong translate="no" className={transfer?.side==='sell'?'positive':''}>{format(amount)}</strong><div translate="no" className="small muted">{weiToEthText(tx.valueWei)} ETH</div><div className="small muted">{label}</div>{transfer&&'mined' in transfer&&<div className="small muted">{t('Mining / services receipt')}</div>}<a translate="no" href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)} <ExternalLink size={12}/></a></>,
    <span translate="no">{price!==null&&display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">ETH</div></span>,
    <span translate="no">{tx.kind==='internal'?t('Fee belongs to parent transaction'):format(fee)}{tx.feeWei!==null&&<div className="small muted">{weiToEthText(tx.feeWei)} ETH</div>}</span>,
    <>{[...new Set([tx.from,tx.to].filter(Boolean))].map(address=>{const wallet=[...own,...cex].find(wallet=>wallet.address===address);return <div key={address} translate="no">{t(address===tx.from?'From':'To')}: <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer" title={address}>{wallet?.name||short(address)}</a>{cex.some(entry=>entry.address===address&&isOutAddress(entry))&&<span className="small muted"> · {t('OUT address')}</span>}</div>;})}{deposit&&<div className="small muted">{t('External receipt · not an owned-wallet transfer')}</div>}</>,
    <TransactionDate time={tx.time}/>
  ]}/>;
}
