import {ExternalLink} from 'lucide-react';
import {AdaUsdAmount,TableRow,TableCell} from './ui';
import {cexAdaTransfer,transactionExchangeWallets,type CexAddress} from './cex';
import {short,type Fact,type Tx,type Wallet} from './core';
import {AssetWalletAddresses} from './AssetWalletAddresses';
import {transactionWalletNames} from './transaction-wallet-names';

export function GainLossTransaction({tx,fact,wallets,entries,history}:{tx:Tx;fact:Fact;wallets:Wallet[];entries:CexAddress[];history:Record<string,number>}){
  const transfer=cexAdaTransfer(fact,entries);
  if(!transfer)return null;
  const incoming=transfer.side==='buy';
  const date=new Date(tx.block_time*1000);
  const price=history[date.toISOString().slice(0,10)];
  const ada=Number(transfer.raw)/1e6;
  const exchanges=transactionExchangeWallets(fact,entries).filter(wallet=>wallet.direction===(incoming?'From':'To'));
  return <TableRow className="portfolio-transfer-row">
    <TableCell><strong className={incoming?'negative':'positive'}>{incoming?'ADA IN':'ADA OUT'}</strong><div className="small"><a href={`https://cardanoscan.io/transaction/${tx.tx_hash}`} target="_blank" rel="noreferrer" title={tx.tx_hash}>{short(tx.tx_hash)} <ExternalLink size={12}/></a></div></TableCell>
    <TableCell>{date.toLocaleDateString()}<div className="small muted">{date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></TableCell>
    <TableCell><strong>{[...new Set(exchanges.map(exchange=>exchange.name))].join(' · ')}</strong><div className="small muted">{transactionWalletNames(fact,wallets).join(' · ')}</div><AssetWalletAddresses compact addresses={[...new Set(exchanges.map(exchange=>exchange.address))]} names={[...new Set(exchanges.map(exchange=>exchange.name))]}/></TableCell>
    <TableCell><strong className={`portfolio-transfer-amount ${incoming?'negative':'positive'}`}><AdaUsdAmount ada={ada} usd={price>0?ada*price:null}/></strong></TableCell>
    <TableCell><span>{price>0?`$${price.toLocaleString('en-US',{maximumFractionDigits:6})} / ADA`:'Price unavailable'}</span><div className="small muted">{fact.feeRaw===null?'Fee unavailable':`Fee: ₳ ${(Number(fact.feeRaw)/1e6).toLocaleString('en-US',{maximumFractionDigits:6})}`}</div></TableCell>
  </TableRow>;
}
