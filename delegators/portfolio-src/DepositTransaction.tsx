import {addressNetworks} from './address-networks';
import {short} from './core';
import {TransactionLayout,TransactionDate} from './TransactionTable';
import {TransactionAddresses} from './TransactionAddresses';
import {usePortfolioText} from './use-portfolio-text';
import {transactionCurrency,usePortfolioCurrency,formatPortfolioUsd} from './portfolio-currency';
import type {DepositReceipt,DepositAddress} from './deposit-tracking';

export function DepositTransaction({receipt,addresses,history,adaHistory,feeRaw='0'}:{receipt:DepositReceipt;addresses:DepositAddress[];history:Record<string,number>;adaHistory:Record<string,number>;feeRaw?:string}){
  const t=usePortfolioText(),config=addressNetworks[receipt.network],date=new Date(receipt.time*1000).toISOString().slice(0,10);
  const display=transactionCurrency(usePortfolioCurrency(),receipt.time,adaHistory[date]??null),price=history[date]??null;
  const digits=receipt.raw.padStart(config.decimals+1,'0'),fraction=digits.slice(-config.decimals).replace(/0+$/,'');
  const amountText=digits.slice(0,-config.decimals)+(fraction?'.'+fraction:''),amount=Number(BigInt(receipt.raw))/10**config.decimals;
  const feeDigits=feeRaw.padStart(config.decimals+1,'0'),feeFraction=feeDigits.slice(-config.decimals).replace(/0+$/,''),feeText=feeDigits.slice(0,-config.decimals)+(feeFraction?'.'+feeFraction:'');
  const fee=Number(BigInt(feeRaw))/10**config.decimals;
  const explorer=receipt.network==='cardano'?'https://cardanoscan.io/transaction/':receipt.network==='ethereum'?'https://etherscan.io/tx/':receipt.network==='solana'?'https://solscan.io/tx/':'https://blockstream.info/tx/';
  const names=(values:string[])=>values.map(address=>({address,name:addresses.find(row=>row.address===address)?.name}));
  return <TransactionLayout cells={[
    <><strong translate="no">{display?formatPortfolioUsd(price===null?null:amount*price,display):'—'}</strong><div translate="no" className="small muted">{amountText} {config.symbol}</div><div className="small muted" translate="no">{t('Direct CEX deposit')}</div><a translate="no" href={explorer+receipt.hash} target="_blank" rel="noreferrer">{short(receipt.hash)}</a></>,
    <span translate="no">{display?formatPortfolioUsd(price,display,6):'—'}<div className="small muted">{config.symbol}</div></span>,
    <span translate="no">{display?formatPortfolioUsd(fee===0?0:price===null?null:fee*price,display):'—'}<div className="small muted">{feeText} {config.symbol}</div></span>,
    <><TransactionAddresses network={receipt.network} from={names(receipt.from)} to={names(receipt.to)}/><div className="small muted" translate="no">{t('External receipt · not an owned-wallet transfer')}</div></>,
    <TransactionDate time={receipt.time}/>
  ]}/>;
}
