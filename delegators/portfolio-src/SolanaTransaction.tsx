import {isRewardSource} from './reward-sources';
import {short} from './core';
import {TransactionLayout,TransactionDate} from './TransactionTable';
import {transactionCurrency,usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import {solAmount,type SolanaTransaction as SolTransaction,type NativeWallet} from './solana';
import {usePortfolioText} from './use-portfolio-text';
import {TransactionAddresses} from './TransactionAddresses';
import {isOutAddress} from './out-address';
import {solanaDeposit} from './solana';
import {DepositTransaction} from './DepositTransaction';
import {PartialHistoryNote} from './PartialHistoryNote';

export function SolanaTransaction({tx,wallets,exchanges,history,adaHistory,compact=false,partial=false}:{tx:SolTransaction;wallets:NativeWallet[];exchanges:NativeWallet[];history:Record<string,number>;adaHistory:Record<string,number>;compact?:boolean;partial?:boolean}){
  const t=usePortfolioText(),date=new Date(tx.time*1000).toISOString().slice(0,10),display=transactionCurrency(usePortfolioCurrency(),tx.time,adaHistory[date]??null),price=history[date]??null;
  const own=new Set(wallets.map(w=>w.address)),net=tx.transfers.reduce((sum,row)=>sum+(own.has(row.to)?BigInt(row.raw):0n)-(own.has(row.from)?BigInt(row.raw):0n),0n),amount=solAmount(String(net));
  const format=(amount:number)=>display?formatPortfolioUsd(amount===0?0:price===null?null:amount*price,display):'—';
  const addressRow=(address:string)=>({address,name:[...wallets,...exchanges].find(wallet=>wallet.address===address)?.name,out:exchanges.some(wallet=>wallet.address===address&&isOutAddress(wallet))});
  const transfers=tx.transfers.filter(row=>own.has(row.from)||own.has(row.to)),paidFee=own.has(tx.payer)?tx.feeRaw:'0';
  const deposit=solanaDeposit(tx,wallets,exchanges);
  if(deposit)return <DepositTransaction receipt={deposit} addresses={[...wallets,...exchanges]} history={history} adaHistory={adaHistory} feeRaw={paidFee} partial={partial}/>;
  return <TransactionLayout compact={compact} cells={[
    <><strong translate="no" className={amount<0?'positive':''}>{format(Math.abs(amount))}</strong><div translate="no" className="small muted">{amount.toLocaleString(undefined,{maximumFractionDigits:9})} SOL</div><div className="small muted">{tx.failed?t('Failed'):tx.transfers.some(row=>own.has(row.to)&&!own.has(row.from)&&BigInt(row.raw)>0n&&isRewardSource(row.from,exchanges))?t('Mining / services receipt'):t('Solana transfer')}</div><a translate="no" href={`https://solscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">{short(tx.hash)}</a>{partial&&<PartialHistoryNote excluded/>}</>,
    <span translate="no">{display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">SOL</div></span>,
    <span translate="no">{format(solAmount(paidFee))}<div className="small muted">{solAmount(paidFee).toLocaleString(undefined,{maximumFractionDigits:9})} SOL</div></span>,
    <TransactionAddresses network="solana" from={transfers.map(row=>addressRow(row.from))} to={transfers.map(row=>addressRow(row.to))}/>,
    <TransactionDate time={tx.time}/>
  ]}/>;
}
