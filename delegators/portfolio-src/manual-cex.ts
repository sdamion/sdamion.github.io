import type {Fact,Wallet} from './core.ts';
import type {BitcoinTransaction,BitcoinWallet} from './bitcoin.ts';
import {bitcoinNet} from './bitcoin.ts';
import type {EthereumTransaction,EthereumWallet,FiatTransfer} from './ethereum.ts';
import type {SolanaTransaction,NativeWallet} from './solana.ts';

export type CexNetwork='cardano'|'ethereum'|'robinhood'|'solana'|'bitcoin';
export type ManualCexChoice={address:string;name:string;raw:string};
export type ManualCexCandidate={network:CexNetwork;hash:string;time:number;decimals:number;choices:ManualCexChoice[]};
export type ManualCexDecisions=Record<string,string>;
export type ManualCexFlow=FiatTransfer&{network:CexNetwork;amount:number;address:string};
export const manualCexKey=(network:CexNetwork,hash:string)=>`${network}:${hash}`;

export function readManualCexDecisions(value:unknown):ManualCexDecisions{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([key,address])=>/^(cardano|ethereum|robinhood|solana|bitcoin):[a-zA-Z0-9:_-]{1,100}$/.test(key)&&typeof address==='string'&&address.length>0&&address.length<=128).slice(0,20000)) as ManualCexDecisions;
}

function choices<T extends {address:string;name:string;personalType?:'dex'|'cex'}>(wallets:T[],amount:(wallet:T)=>bigint):ManualCexChoice[]{
  return wallets.filter(wallet=>wallet.personalType!=null).concat(wallets.filter(wallet=>wallet.personalType==null)).map(wallet=>({address:wallet.address,name:wallet.name,raw:String(amount(wallet))})).filter(choice=>choice.raw!=='0');
}

export function cardanoCexCandidate(fact:Fact,wallets:Wallet[],groups:Record<string,string[]>={}):ManualCexCandidate|null{
  const source=fact.source;
  if(!source){
    if(fact.internal||fact.wallets.length!==1)return null;
    const address=fact.wallets[0],wallet=wallets.find(row=>row.address===address);
    const net=BigInt(fact.adaRaw)+BigInt(fact.feeRaw||'0');
    return net===0n?null:{network:'cardano',hash:fact.hash,time:fact.time,decimals:6,choices:[{address,name:wallet?.label||address,raw:String(net)}]};
  }
  const result=choices(wallets.filter(wallet=>wallet.group!=='swap').map(wallet=>({...wallet,name:wallet.label})),wallet=>{
    const addresses=new Set([wallet.address,...groups[wallet.address]||[]]);
    const received=source.outputs.reduce((sum,row)=>sum+(addresses.has(row.payment_addr?.bech32||'')?BigInt(row.value):0n),0n);
    const spent=source.inputs.reduce((sum,row)=>sum+(addresses.has(row.payment_addr?.bech32||'')?BigInt(row.value):0n),0n);
    const net=received-spent;
    return net<0n&&source.inputs.length>0&&source.inputs.every(row=>addresses.has(row.payment_addr?.bech32||''))?net+BigInt(source.fee):net;
  });
  return result.length?{network:'cardano',hash:fact.hash,time:fact.time,decimals:6,choices:result}:null;
}

export function ethereumCexCandidate(tx:EthereumTransaction,wallets:EthereumWallet[],network:'ethereum'|'robinhood'='ethereum'):ManualCexCandidate|null{
  if(tx.failed||BigInt(tx.valueWei)===0n)return null;
  const result=choices(wallets.filter(wallet=>wallet.group!=='swap'&&(wallet.address===tx.from||wallet.address===tx.to)),wallet=>wallet.address===tx.from&&wallet.address===tx.to?0n:wallet.address===tx.to?BigInt(tx.valueWei):-BigInt(tx.valueWei));
  return result.length?{network,hash:tx.id,time:tx.time,decimals:18,choices:result}:null;
}

export function solanaCexCandidate(tx:SolanaTransaction,wallets:NativeWallet[]):ManualCexCandidate|null{
  if(tx.failed)return null;
  const involved=new Set(tx.transfers.flatMap(row=>[row.from,row.to]));
  const result=choices(wallets.filter(wallet=>involved.has(wallet.address)),wallet=>tx.transfers.reduce((sum,row)=>sum+(row.to===wallet.address?BigInt(row.raw):0n)-(row.from===wallet.address?BigInt(row.raw):0n),0n));
  return result.length?{network:'solana',hash:tx.hash,time:tx.time,decimals:9,choices:result}:null;
}

export function bitcoinCexCandidate(tx:BitcoinTransaction,wallets:BitcoinWallet[]):ManualCexCandidate|null{
  const involved=new Set([...tx.inputs,...tx.outputs].map(row=>row.address));
  const result=choices(wallets.filter(wallet=>involved.has(wallet.address)),wallet=>{
    const net=bitcoinNet(tx,[wallet]);
    return net<0n&&tx.inputs.every(row=>row.address===wallet.address)?net+BigInt(tx.feeRaw):net;
  });
  return result.length?{network:'bitcoin',hash:tx.hash,time:tx.time,decimals:8,choices:result}:null;
}

export function manualCexFlow(candidate:ManualCexCandidate,selectedAddress:string|undefined,price:number|null,automatic=false):ManualCexFlow|null{
  if(automatic||!selectedAddress)return null;
  const choice=candidate.choices.find(row=>row.address===selectedAddress);
  if(!choice)return null;
  const raw=BigInt(choice.raw),amount=Number(raw<0n?-raw:raw)/10**candidate.decimals;
  if(!Number.isFinite(amount)||amount<=0)return null;
  return {network:candidate.network,hash:candidate.network==='bitcoin'?`btc:${candidate.hash}`:candidate.network==='solana'?`sol:${candidate.hash}:manual`:candidate.network==='robinhood'?`rh:${candidate.hash}`:candidate.hash,time:candidate.time,side:raw>0n?'buy':'sell',amount,address:selectedAddress,usd:price!==null&&Number.isFinite(price)&&price>0?amount*price:null};
}
