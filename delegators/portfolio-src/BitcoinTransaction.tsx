import {short} from './core';
import {TransactionLayout,TransactionDate} from './TransactionTable';
import {transactionCurrency,usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import {bitcoinAmount,bitcoinAmountText,bitcoinFee,bitcoinNet,bitcoinTableTransfer,type BitcoinWallet,type BitcoinTransaction as BtcTransaction} from './bitcoin';
import {usePortfolioText} from './use-portfolio-text';
import {TransactionAddresses} from './TransactionAddresses';
import {isOutAddress} from './out-address';
import {walletFlowAddresses} from './transaction-addresses';
import {bitcoinDeposit} from './bitcoin';
import {DepositTransaction} from './DepositTransaction';
import {PartialHistoryNote} from './PartialHistoryNote';

export function BitcoinTransaction({tx,wallets,exchanges,history,adaHistory,cexOnly=false,partial=false}:{tx:BtcTransaction;wallets:BitcoinWallet[];exchanges:BitcoinWallet[];history:Record<string,number>;adaHistory:Record<string,number>;cexOnly?:boolean;partial?:boolean}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10),display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null),price=history[date]??null;
  const transfer=bitcoinTableTransfer(tx,wallets,exchanges),amount=cexOnly&&transfer?.raw===null?null:bitcoinAmount(transfer?.raw??String(bitcoinNet(tx,wallets)));
  const reward=!!transfer&&'mined' in transfer;
  const fee=bitcoinFee(tx,wallets);
  const format=(amount:number|null)=>display?formatPortfolioUsd(amount===null||price===null?null:amount*price,display):'—';
  const addresses=(rows:BtcTransaction['inputs'])=>rows.map(({address})=>({address,name:[...wallets,...exchanges].find(wallet=>wallet.address===address)?.name,out:exchanges.some(wallet=>wallet.address===address&&isOutAddress(wallet))}));
  const flow=walletFlowAddresses(addresses(tx.inputs),addresses(tx.outputs),row=>wallets.some(wallet=>wallet.address===row.address),bitcoinNet(tx,wallets)>0n);
  const deposit=bitcoinDeposit(tx,wallets,exchanges);
  if(deposit)return <DepositTransaction receipt={deposit} addresses={[...wallets,...exchanges]} history={history} adaHistory={adaHistory} partial={partial}/>;
  return <TransactionLayout cells={[
    <><strong translate="no">{format(amount===null?null:Math.abs(amount))}</strong><div translate="no" className="small muted">{amount===null?'—':(transfer?.side==='sell'&&!reward&&transfer.raw!==null?-amount:amount).toLocaleString(undefined,{maximumFractionDigits:8})} BTC</div><div translate="no" className="small muted">{t(reward?'Mining / services receipt':transfer?transfer.side==='buy'?'BTC IN':'BTC OUT':'Bitcoin transfer')}</div><a translate="no" href={`https://blockstream.info/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)}</a>{partial&&<PartialHistoryNote excluded/>}{transfer&&!transfer.verified&&<><div className="small muted" translate="no">{t('Mixed or unassigned sources')}</div>{!partial&&<div className="small muted" translate="no">{t('Excluded from calculations')}</div>}</>}</>,
    <span translate="no">{display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">BTC</div></span>,
    <span translate="no">{format(fee.paidRaw===null?null:bitcoinAmount(fee.paidRaw))}<div className="small muted">{fee.paidRaw===null?'—':bitcoinAmountText(fee.paidRaw)} BTC</div>{fee.paidRaw!==null&&<div className="small muted">{BigInt(fee.paidRaw).toLocaleString()} sats</div>}{fee.paidRaw===null&&<div className="small muted">{t('Wallet share unknown')}</div>}</span>,
    <TransactionAddresses network="bitcoin" {...flow}/>,
    <TransactionDate time={tx.time}/>
  ]}/>;
}
