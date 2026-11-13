import type {Fact} from './core';
import type {EthereumData,EthereumWallet} from './ethereum';
import type {SolanaData,NativeWallet} from './solana';
import type {BitcoinData,BitcoinWallet} from './bitcoin';
import type {HistoricalNftRow} from './historical-nfts';
import type {RobinhoodTokenTransfer} from './use-robinhood';

type DatedAsset={id:string;name:string;firstReceived?:number|null};
export type AssetDates=Record<string,number>;
export const validAssetDate=(time:unknown):time is number=>typeof time==='number'&&Number.isFinite(time)&&time>0&&Number.isFinite(new Date(time*1000).getTime());
export function compareAssetDates(a:DatedAsset,b:DatedAsset,dates:AssetDates={}){
  const left=a.firstReceived??dates[a.id],right=b.firstReceived??dates[b.id];
  return (validAssetDate(right)?right:0)-(validAssetDate(left)?left:0)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
}
export function sortAssetsByDate<T extends DatedAsset>(rows:T[],dates:AssetDates={}){return [...rows].sort((a,b)=>compareAssetDates(a,b,dates));}

// Use receipt timestamps from loaded history; inventory check times are not acquisitions.
export function assetReceiptDates({facts=[],nfts=[],ethereum,robinhood,solana,bitcoin}:{facts?:Fact[];nfts?:HistoricalNftRow[];ethereum?:{data:EthereumData;wallets:EthereumWallet[]};robinhood?:{data:EthereumData;wallets:EthereumWallet[];tokens?:Record<string,RobinhoodTokenTransfer[]>};solana?:{data:SolanaData;wallets:NativeWallet[]};bitcoin?:{data:BitcoinData;wallets:BitcoinWallet[]}}):AssetDates{
  const dates:AssetDates={};
  const record=(id:string,time:number|null)=>{if(validAssetDate(time))dates[id]=Math.min(dates[id]??Infinity,time);};
  for(const fact of facts){
    if(fact.internal)continue;
    if(BigInt(fact.adaRaw)>0n)record('cardano:lovelace',fact.time);
    for(const [id,raw] of Object.entries(fact.assets))if(BigInt(raw)>0n)record('cardano:'+id,fact.time);
  }
  for(const nft of nfts)record(nft.chain&&nft.chain!=='cardano'||nft.id.startsWith('bitcoin:')?nft.id:'cardano:'+nft.id,nft.firstReceived);
  for(const [chain,source] of [['ethereum',ethereum],['robinhood',robinhood]] as const){
    if(!source)continue;
    const wallets=source.wallets.filter(wallet=>wallet.group!=='swap'),own=new Set(wallets.map(wallet=>wallet.address.toLowerCase()));
    for(const wallet of wallets)for(const tx of source.data.accounts[wallet.address]?.transactions||[]){
      if(!tx.failed&&tx.block>0&&own.has(tx.to.toLowerCase())&&!own.has(tx.from.toLowerCase())&&BigInt(tx.valueWei)>0n)record(chain+':native',tx.time);
    }
  }
  if(robinhood){
    const wallets=robinhood.wallets.filter(wallet=>wallet.group!=='swap'),own=new Set(wallets.map(wallet=>wallet.address.toLowerCase()));
    for(const wallet of wallets)for(const tx of robinhood.tokens?.[wallet.address]||[]){
      if(own.has(tx.to.toLowerCase())&&!own.has(tx.from.toLowerCase())&&BigInt(tx.raw)>0n)record(tx.id,tx.time);
    }
  }
  if(solana){
    const own=new Set(solana.wallets.map(wallet=>wallet.address));
    for(const wallet of solana.wallets)for(const tx of solana.data.accounts[wallet.address]?.transactions||[]){
      if(!tx.failed&&tx.slot>0&&tx.transfers.some(row=>own.has(row.to)&&!own.has(row.from)&&BigInt(row.raw)>0n))record('solana:native',tx.time);
    }
  }
  if(bitcoin){
    const own=new Set(bitcoin.wallets.map(wallet=>wallet.address));
    for(const wallet of bitcoin.wallets)for(const tx of bitcoin.data.accounts[wallet.address]?.transactions||[]){
      const incoming=tx.outputs.reduce((sum,row)=>sum+(own.has(row.address)?BigInt(row.raw):0n),0n),outgoing=tx.inputs.reduce((sum,row)=>sum+(own.has(row.address)?BigInt(row.raw):0n),0n);
      if(tx.height>0&&incoming>outgoing)record('bitcoin:native',tx.time);
    }
  }
  return dates;
}
