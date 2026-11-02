import {short} from './core';
import {TransactionLayout,TransactionDate} from './TransactionTable';
import {transactionCurrency,usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import {bitcoinAmount,bitcoinAmountText,bitcoinFee,bitcoinNet,bitcoinTransfer,type BitcoinWallet,type BitcoinTransaction as BtcTransaction} from './bitcoin';
import {usePortfolioText} from './use-portfolio-text';
import {TransactionAddresses} from './TransactionAddresses';
import {isOutAddress} from './out-address';

export function BitcoinTransaction({tx,wallets,exchanges,history,adaHistory}:{tx:BtcTransaction;wallets:BitcoinWallet[];exchanges:BitcoinWallet[];history:Record<string,number>;adaHistory:Record<string,number>}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10),display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null),price=history[date]??null;
  const transfer=bitcoinTransfer(tx,wallets,exchanges),amount=bitcoinAmount(transfer?transfer.raw:String(bitcoinNet(tx,wallets)));
  const reward=!!transfer&&'mined' in transfer;
  const fee=bitcoinFee(tx,wallets);
  const format=(amount:number|null)=>display?formatPortfolioUsd(amount===null||price===null?null:amount*price,display):'—';
  const addresses=(rows:BtcTransaction['inputs'])=>rows.map(({address})=>({address,name:[...wallets,...exchanges].find(wallet=>wallet.address===address)?.name,out:exchanges.some(wallet=>wallet.address===address&&isOutAddress(wallet))}));
  return <TransactionLayout cells={[
    <><strong translate="no">{format(Math.abs(amount))}</strong><div translate="no" className="small muted">{(transfer?.side==='sell'&&!reward?-amount:amount).toLocaleString(undefined,{maximumFractionDigits:8})} BTC</div><div translate="no" className="small muted">{t(reward?'Mining / services receipt':transfer?transfer.side==='buy'?'BTC IN':'BTC OUT':'Bitcoin transfer')}</div><a translate="no" href={`https://blockstream.info/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)}</a></>,
    <span translate="no">{display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">BTC</div></span>,
    <span translate="no">{format(bitcoinAmount(fee.totalRaw))}<div className="small muted">{bitcoinAmountText(fee.totalRaw)} BTC</div><div className="small muted">{BigInt(fee.totalRaw).toLocaleString()} sats</div><div className="small muted">{t(fee.payer==='own'?'Paid by your wallets':fee.payer==='external'?'Paid by sender':'Wallet share unknown')}</div></span>,
    <TransactionAddresses network="bitcoin" from={addresses(tx.inputs)} to={addresses(tx.outputs)}/>,
    <TransactionDate time={tx.time}/>
  ]}/>;
}
