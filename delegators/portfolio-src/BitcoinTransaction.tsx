import {short} from './core';
import {TransactionLayout,TransactionDate} from './TransactionTable';
import {transactionCurrency,usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import {bitcoinAmount,bitcoinNet,bitcoinTransfer,type BitcoinWallet,type BitcoinTransaction as BtcTransaction} from './bitcoin';
import {usePortfolioText} from './use-portfolio-text';

export function BitcoinTransaction({tx,wallets,exchanges,history,adaHistory}:{tx:BtcTransaction;wallets:BitcoinWallet[];exchanges:BitcoinWallet[];history:Record<string,number>;adaHistory:Record<string,number>}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10),display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null),price=history[date]??null;
  const transfer=bitcoinTransfer(tx,wallets,exchanges),amount=bitcoinAmount(transfer?transfer.raw:String(bitcoinNet(tx,wallets))),own=new Set(wallets.map(w=>w.address));
  const reward=!!transfer&&'mined' in transfer;
  const fee=tx.inputs.every(row=>own.has(row.address))?bitcoinAmount(tx.feeRaw):tx.inputs.some(row=>own.has(row.address))?null:0;
  const format=(amount:number|null)=>display?formatPortfolioUsd(amount===null||price===null?null:amount*price,display):'—';
  const addresses=new Set([...tx.inputs,...tx.outputs].map(row=>row.address));
  return <TransactionLayout cells={[
    <><strong translate="no">{format(Math.abs(amount))}</strong><div translate="no" className="small muted">{(transfer?.side==='sell'&&!reward?-amount:amount).toLocaleString(undefined,{maximumFractionDigits:8})} BTC</div><div translate="no" className="small muted">{t(reward?'Mining / services receipt':transfer?transfer.side==='buy'?'BTC IN':'BTC OUT':'Bitcoin transfer')}</div><a translate="no" href={`https://blockstream.info/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)}</a></>,
    <span translate="no">{display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">BTC</div></span>,
    <span translate="no">{format(fee)}<div className="small muted">{fee===null?'—':fee.toLocaleString(undefined,{maximumFractionDigits:8})} BTC</div></span>,
    <>{[...wallets,...exchanges].filter(w=>addresses.has(w.address)).map(w=><div translate="no" key={w.address}>{w.name}</div>)}</>,
    <TransactionDate time={tx.time}/>
  ]}/>;
}
