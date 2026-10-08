import {short} from './core';
import {TransactionLayout,TransactionDate} from './TransactionTable';
import {transactionCurrency,usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import {solAmount,type SolanaTransaction as SolTransaction,type NativeWallet} from './solana';
import {usePortfolioText} from './use-portfolio-text';

export function SolanaTransaction({tx,wallets,exchanges,history,adaHistory}:{tx:SolTransaction;wallets:NativeWallet[];exchanges:NativeWallet[];history:Record<string,number>;adaHistory:Record<string,number>}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10),display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null),price=history[date]??null;
  const own=new Set(wallets.map(w=>w.address)),net=tx.transfers.reduce((sum,row)=>sum+(own.has(row.to)?BigInt(row.raw):0n)-(own.has(row.from)?BigInt(row.raw):0n),0n),amount=solAmount(String(net));
  const format=(amount:number)=>display?formatPortfolioUsd(price===null?null:amount*price,display):'—';
  const addresses=new Set([tx.payer,...tx.transfers.flatMap(row=>[row.from,row.to])]);
  return <TransactionLayout cells={[
    <><strong translate="no" className={amount<0?'positive':''}>{format(Math.abs(amount))}</strong><div translate="no" className="small muted">{amount.toLocaleString(undefined,{maximumFractionDigits:9})} SOL</div><div className="small muted">{tx.failed?t('Failed'):t('Solana transfer')}</div><a translate="no" href={`https://solscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)}</a></>,
    <span translate="no">{display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">SOL</div></span>,
    <span translate="no">{format(solAmount(tx.feeRaw))}<div className="small muted">{solAmount(tx.feeRaw).toLocaleString(undefined,{maximumFractionDigits:9})} SOL</div></span>,
    <>{[...wallets,...exchanges].filter(w=>addresses.has(w.address)).map(w=><div translate="no" key={w.address}>{w.name}</div>)}</>,
    <TransactionDate time={tx.time}/>
  ]}/>;
}
