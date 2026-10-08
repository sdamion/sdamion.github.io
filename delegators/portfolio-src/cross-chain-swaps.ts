import type {Fact} from './core.ts';
import {isSwapTransaction} from './swap-wallets.ts';
import {historicalAdaPrice,lovelaceToAda} from './transaction-amounts.ts';
import {ethereumTransactions,weiToEth,type EthereumData,type EthereumWallet} from './ethereum.ts';

type Leg={id:string;time:number;usd:number;incoming:boolean};
const SWAP_WINDOW_SECONDS=60*60;
export type SwapPair={cardano:string;ethereum:string};
export function groupSwapRows<T extends {chain:'cardano'|'ethereum';tx:{tx_hash?:string;id?:string}}>(rows:T[],pairs:SwapPair[]){
  const byId=new Map(rows.map(row=>[row.chain==='cardano'?row.tx.tx_hash:row.tx.id,row]));
  const partners=new Map<string,string>();
  for(const pair of pairs){partners.set(pair.cardano,pair.ethereum);partners.set(pair.ethereum,pair.cardano);}
  const used=new Set<T>(),groups:T[][]=[];
  for(const row of rows){
    if(used.has(row))continue;
    used.add(row);
    const id=row.chain==='cardano'?row.tx.tx_hash:row.tx.id;
    const partner=byId.get(partners.get(id!)!);
    if(partner&&!used.has(partner)){
      used.add(partner);
      groups.push(row.chain==='cardano'?[row,partner]:[partner,row]);
    }else groups.push([row]);
  }
  return groups;
}
export function matchCrossChainSwaps(facts:Fact[],swapAddresses:Set<string>,data:EthereumData,wallets:EthereumWallet[],adaHistory:Record<string,number>,tolerance=0.05){
  const cardano=new Set<string>(),ethereum=new Set<string>(),pairs:SwapPair[]=[];
  const own=new Set(wallets.map(w=>w.address)),swaps=new Set(wallets.filter(w=>w.group==='swap').map(w=>w.address));
  if(!swapAddresses.size||!swaps.size||!Number.isFinite(tolerance)||tolerance<0||tolerance>0.1)return {cardano,ethereum,pairs};
  const adaLegs:Leg[]=[...new Map(facts.map(f=>[f.hash,f])).values()].flatMap(f=>{
    if(f.internal||!isSwapTransaction(f,swapAddresses)||Object.values(f.assets).some(raw=>BigInt(raw)!==0n))return [];
    const amount=lovelaceToAda(String(BigInt(f.adaRaw)+BigInt(f.feeRaw||'0'))),price=historicalAdaPrice(f.time,adaHistory);
    const usd=amount===null||price===null?null:Math.abs(amount)*price;
    return usd!==null&&Number.isFinite(usd)&&usd>0?[{id:f.hash,time:f.time,usd,incoming:amount!>0}]:[];
  }).sort((a,b)=>a.time-b.time);
  const ethLegs:Leg[]=ethereumTransactions(data,wallets).flatMap(tx=>{
    if(tx.failed||own.has(tx.from)&&own.has(tx.to)||!swaps.has(tx.from)&&!swaps.has(tx.to))return [];
    const price=data.history[new Date(tx.time*1000).toISOString().slice(0,10)],usd=weiToEth(tx.valueWei)*price;
    return Number.isFinite(usd)&&usd>0?[{id:tx.id,time:tx.time,usd,incoming:own.has(tx.to)}]:[];
  }).sort((a,b)=>a.time-b.time);
  const adaMatches=new Map<string,string[]>(),ethMatches=new Map<string,string[]>();
  const candidate=(matches:Map<string,string[]>,id:string,other:string)=>{
    const rows=matches.get(id)||[];
    if(rows.length<2)rows.push(other);
    matches.set(id,rows);
  };
  let start=0;
  for(const ada of adaLegs){
    while(start<ethLegs.length&&ethLegs[start].time<ada.time-SWAP_WINDOW_SECONDS)start++;
    for(let i=start;i<ethLegs.length&&ethLegs[i].time<=ada.time+SWAP_WINDOW_SECONDS;i++){
      const eth=ethLegs[i];
      if(ada.incoming===eth.incoming||Math.abs(ada.usd-eth.usd)/Math.max(ada.usd,eth.usd)>tolerance)continue;
      candidate(adaMatches,ada.id,eth.id);
      candidate(ethMatches,eth.id,ada.id);
    }
  }
  // Only unambiguous one-to-one pairs; never guess between similar nearby transfers.
  for(const [hash,ids] of adaMatches)if(ids.length===1&&ethMatches.get(ids[0])?.length===1){cardano.add(hash);ethereum.add(ids[0]);pairs.push({cardano:hash,ethereum:ids[0]});}
  return {cardano,ethereum,pairs};
}
