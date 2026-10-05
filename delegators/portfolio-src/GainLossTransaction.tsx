import {TransactionRow,TransactionAmount,TransactionWallets} from './TransactionTable';
import {cexAdaTransfer,transactionExchangeWallets,type CexAddress} from './cex';
import {type Fact,type Tx,type Wallet} from './core';
import {transactionWalletNames} from './transaction-wallet-names';
import {transactionAmounts,transactionNetworkFee} from './transaction-amounts';

export function GainLossTransaction({tx,fact,wallets,entries,history}:{tx:Tx;fact:Fact;wallets:Wallet[];entries:CexAddress[];history:Record<string,number>}){
  const transfer=cexAdaTransfer(fact,entries);
  if(!transfer)return null;
  const incoming=transfer.side==='buy';
  const amount=transactionAmounts(transfer.raw,fact.time,history,fact.feeRaw);
  const exchanges=transactionExchangeWallets(fact,entries).filter(wallet=>wallet.direction===(incoming?'From':'To'));
  return <TransactionRow hash={tx.tx_hash} time={tx.block_time} price={amount.price} feeRaw={transactionNetworkFee(fact)}
    kind={incoming?'ADA IN':'ADA OUT'}
    amount={<TransactionAmount ada={amount.ada} usd={amount.usd} tone={incoming?'negative':'positive'}/>}
    wallets={<TransactionWallets labels={transactionWalletNames(fact,wallets)} exchanges={exchanges}/>}
  />;
}
