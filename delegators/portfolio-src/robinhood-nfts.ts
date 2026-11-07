import type {EthereumWallet} from './ethereum';
import type {HistoricalNftRow} from './historical-nfts';
import type {RobinhoodNftTransfer} from './use-robinhood';

export function robinhoodHistoricalNfts(history:Record<string,RobinhoodNftTransfer[]>,wallets:EthereumWallet[]):HistoricalNftRow[]{
  const rows=new Map<string,HistoricalNftRow>();
  for(const wallet of wallets){
    if(wallet.group==='swap')continue;
    for(const transfer of history[wallet.address]||[]){
      const previous=rows.get(transfer.id);
      const received=transfer.to===wallet.address?transfer.time:null;
      rows.set(transfer.id,{id:transfer.id,name:transfer.name||previous?.name||transfer.id,raw:'0',chain:'robinhood',
        firstReceived:received===null?previous?.firstReceived??null:Math.min(previous?.firstReceived??Infinity,received),
        image:transfer.image||previous?.image||null,wallets:[...new Set([...(previous?.wallets||[]),wallet.name])]});
    }
  }
  return [...rows.values()].sort((a,b)=>(b.firstReceived??0)-(a.firstReceived??0)||a.id.localeCompare(b.id));
}
