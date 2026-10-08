import type {Fact} from './core.ts';
import {isSwapTransaction} from './swap-wallets.ts';
import {historicalAdaPrice,lovelaceToAda} from './transaction-amounts.ts';
import {ethereumTransactions,ethereumSwapDirection,weiToEth,type EthereumData,type EthereumWallet} from './ethereum.ts';

type Leg={id:string;time:number;usd:number;incoming:boolean;chain:'cardano'|'ethereum';scope:string[]};
const SWAP_WINDOW_SECONDS=60*60;
export type SwapPair={cardano:string;ethereum:string}|{cardano:string;cardanoReturn:string};
export function groupSwapRows<T extends {chain:'cardano'|'ethereum';tx:{tx_hash?:string;id?:string}}>(rows:T[],pairs:SwapPair[]){
  const byId=new Map(rows.map(row=>[row.chain==='cardano'?row.tx.tx_hash:row.tx.id,row]));
  const partners=new Map<string,string>();
  for(const pair of pairs){const other='ethereum' in pair?pair.ethereum:pair.cardanoReturn;partners.set(pair.cardano,other);partners.set(other,pair.cardano);}
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
  if(!swapAddresses.size||!Number.isFinite(tolerance)||tolerance<0||tolerance>0.1)return {cardano,ethereum,pairs};
  const adaLegs:Leg[]=[...new Map(facts.map(f=>[f.hash,f])).values()].flatMap(f=>{
    if(f.internal||!isSwapTransaction(f,swapAddresses)||Object.values(f.assets).some(raw=>BigInt(raw)!==0n))return [];
    const amount=lovelaceToAda(String(BigInt(f.adaRaw)+BigInt(f.feeRaw||'0'))),price=historicalAdaPrice(f.time,adaHistory);
    const usd=amount===null||price===null?null:Math.abs(amount)*price;
    const scope=[...new Set([...f.wallets,...[...f.externalInputs||[],...f.externalOutputs||[]].flatMap(row=>[row.address,row.stakeAddress||'']),...[...f.source?.inputs||[],...f.source?.outputs||[]].flatMap(row=>[row.payment_addr?.bech32||'',row.stake_addr||''])].filter(address=>swapAddresses.has(address)))];
    return usd!==null&&Number.isFinite(usd)&&usd>0?[{id:f.hash,time:f.time,usd,incoming:amount!>0,chain:'cardano' as const,scope}]:[];
  }).sort((a,b)=>a.time-b.time);
  const ethLegs:Leg[]=ethereumTransactions(data,wallets).flatMap(tx=>{
    const incoming=ethereumSwapDirection(tx,wallets);
    if(incoming===null)return [];
    const price=data.history[new Date(tx.time*1000).toISOString().slice(0,10)],usd=weiToEth(tx.valueWei)*price;
    return Number.isFinite(usd)&&usd>0?[{id:tx.id,time:tx.time,usd,incoming,chain:'ethereum' as const,scope:[]}]:[];
  }).sort((a,b)=>a.time-b.time);
  const matches=new Map<string,string[]>();
  const candidate=(matches:Map<string,string[]>,id:string,other:string)=>{
    const rows=matches.get(id)||[];
    if(rows.length<2)rows.push(other);
    matches.set(id,rows);
  };
  const legs=[...adaLegs,...ethLegs].sort((a,b)=>a.time-b.time),byId=new Map(legs.map(leg=>[leg.id,leg]));
  for(let i=0;i<legs.length;i++){
    const first=legs[i];
    for(let j=i+1;j<legs.length&&legs[j].time<=first.time+SWAP_WINDOW_SECONDS;j++){
      const second=legs[j];
      if(first.chain===second.chain&&(first.chain!=='cardano'||!first.scope.some(address=>second.scope.includes(address))))continue;
      if(first.incoming===second.incoming||Math.abs(first.usd-second.usd)/Math.max(first.usd,second.usd)>tolerance)continue;
      candidate(matches,first.id,second.id);
      candidate(matches,second.id,first.id);
    }
  }
  // Only unambiguous one-to-one pairs; never guess between similar nearby transfers.
  const used=new Set<string>();
  for(const [id,ids] of matches)if(!used.has(id)&&ids.length===1&&matches.get(ids[0])?.length===1){
    const first=byId.get(id)!,second=byId.get(ids[0])!;
    used.add(id);used.add(ids[0]);
    for(const leg of [first,second])(leg.chain==='cardano'?cardano:ethereum).add(leg.id);
    if(first.chain===second.chain)pairs.push({cardano:first.id,cardanoReturn:second.id});
    else pairs.push({cardano:(first.chain==='cardano'?first:second).id,ethereum:(first.chain==='ethereum'?first:second).id});
  }
  return {cardano,ethereum,pairs};
}
