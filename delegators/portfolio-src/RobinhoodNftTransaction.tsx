import {ExternalLink} from 'lucide-react';
import {short} from './core';
import {TransactionDate,TransactionLayout} from './TransactionTable';
import {TransactionAddresses} from './TransactionAddresses';
import type {EthereumWallet} from './ethereum';
import type {RobinhoodNftTransfer} from './use-robinhood';

export function RobinhoodNftTransaction({transfer,wallets}:{transfer:RobinhoodNftTransfer;wallets:EthereumWallet[]}){
  const names=new Map(wallets.map(wallet=>[wallet.address,wallet.name]));
  const direction=names.has(transfer.to)?'IN':'OUT';
  return <TransactionLayout cells={[
    <><strong>{transfer.name}</strong><div className="small muted">Robinhood Chain · NFT {direction}</div><a translate="no" href={`https://robinhoodchain.blockscout.com/tx/${transfer.hash}`} target="_blank" rel="noreferrer">{short(transfer.hash)} <ExternalLink size={12}/></a></>,
    <span>—</span>,<span>—</span>,
    <TransactionAddresses network="robinhood" from={[{address:transfer.from,name:names.get(transfer.from)}]} to={[{address:transfer.to,name:names.get(transfer.to)}]}/>,
    <TransactionDate time={transfer.time}/>
  ]}/>;
}
