import {AdaUsdAmount} from './ui';
import {TransactionRow} from './TransactionTable';
import {cexAdaTransfer,transactionExchangeWallets,type CexAddress} from './cex';
import {type Fact,type Tx,type Wallet} from './core';
import {AssetWalletAddresses} from './AssetWalletAddresses';
import {transactionWalletNames} from './transaction-wallet-names';
import {transactionAmounts} from './transaction-amounts';

export function GainLossTransaction({tx,fact,wallets,entries,history}:{tx:Tx;fact:Fact;wallets:Wallet[];entries:CexAddress[];history:Record<string,number>}){
  const transfer=cexAdaTransfer(fact,entries);
  if(!transfer)return null;
  const incoming=transfer.side==='buy';
  const amount=transactionAmounts(transfer.raw,fact.time,history,fact.feeRaw);
  const exchanges=transactionExchangeWallets(fact,entries).filter(wallet=>wallet.direction===(incoming?'From':'To'));
  return <TransactionRow hash={tx.tx_hash} time={tx.block_time} price={amount.price} feeRaw={fact.feeRaw}
    kind={<span className={incoming?'negative':'positive'}>{incoming?'ADA IN':'ADA OUT'}</span>}
    amount={<strong className={`portfolio-transfer-amount ${incoming?'negative':'positive'}`}><AdaUsdAmount ada={amount.ada} usd={amount.usd}/></strong>}
    wallets={<><strong>{[...new Set(exchanges.map(exchange=>exchange.name))].join(' · ')}</strong><div className="small muted">{transactionWalletNames(fact,wallets).join(' · ')}</div><AssetWalletAddresses compact addresses={[...new Set(exchanges.map(exchange=>exchange.address))]} names={[...new Set(exchanges.map(exchange=>exchange.name))]}/></>}
  />;
}
