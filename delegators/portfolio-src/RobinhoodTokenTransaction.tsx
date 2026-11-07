import {ExternalLink} from 'lucide-react';
import {short} from './core';
import {TransactionDate,TransactionLayout} from './TransactionTable';
import {TransactionAddresses} from './TransactionAddresses';
import {assetQuantity} from './owned-assets';
import type {EthereumWallet} from './ethereum';
import type {RobinhoodTokenTransfer} from './use-robinhood';

export function RobinhoodTokenTransaction({transfer,wallets}:{transfer:RobinhoodTokenTransfer;wallets:EthereumWallet[]}){
  const names=new Map(wallets.map(wallet=>[wallet.address,wallet.name]));
  const direction=names.has(transfer.to)?'IN':'OUT';
  return <TransactionLayout cells={[
    <><strong translate="no">{assetQuantity(transfer)} {transfer.symbol}</strong><div className="small muted">Robinhood Chain · ERC-20 {direction}</div><a translate="no" href={`https://robinhoodchain.blockscout.com/tx/${transfer.hash}`} target="_blank" rel="noreferrer">{short(transfer.hash)} <ExternalLink size={12}/></a></>,
    <span translate="no">{transfer.name}</span>,
    <span>—</span>,
    <TransactionAddresses network="robinhood" from={[{address:transfer.from,name:names.get(transfer.from)}]} to={[{address:transfer.to,name:names.get(transfer.to)}]}/>,
    <TransactionDate time={transfer.time}/>
  ]}/>;
}
