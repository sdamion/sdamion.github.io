import {ethereumTransactions,ownedEthereumWallets,weiToEth,type EthereumData,type EthereumWallet,type FiatTransfer} from './ethereum.ts';
import {fiatRate,type ComparisonCurrency,type FxHistory} from './transfer-comparison.ts';
import {performanceTransfers} from './portfolio-flows.ts';

export function availableTotal(values:(number|null)[]){
  const known=values.filter((value):value is number=>value!==null&&Number.isFinite(value));
  return {value:known.length?known.reduce((sum,value)=>sum+value,0):values.length?null:0,partial:known.length!==values.length};
}
export function networkFeeNotes(chains:{chain:string;historyComplete:boolean;feeUsd:number|null;feeKnown?:boolean}[],conversionReady=true):string[]{
  const notes=chains.flatMap(({chain,historyComplete,feeUsd,feeKnown=true})=>[
    ...(!historyComplete?[`Partial · ${chain}: transaction history incomplete`]:[]),
    ...(feeKnown&&feeUsd===null?[`Partial · ${chain}: fee price unavailable`]:[])
  ]);
  if(!conversionReady)notes.push('Partial · selected currency rate unavailable');
  return notes;
}
export function ethereumAvailableTotals(data:EthereumData,wallets:EthereumWallet[]){
  wallets=ownedEthereumWallets(wallets);
  const values=availableTotal(wallets.map(w=>{
    const account=data.accounts[w.address];if(!account)return null;
    const amount=weiToEth(account.balanceWei);return amount===0?0:data.usd===null?null:amount*data.usd;
  }));
  const owned=new Set(wallets.map(w=>w.address)),missing=wallets.some(w=>!data.accounts[w.address]);
  const transactions=ethereumTransactions(data,wallets);
  const raw=transactions.reduce((sum,tx)=>sum+(tx.kind==='normal'&&owned.has(tx.from)&&tx.feeWei!==null?BigInt(tx.feeWei):0n),0n);
  const fees=wallets.length&&wallets.every(w=>!data.accounts[w.address])?null:weiToEth(String(raw));
  const missingFee=transactions.some(tx=>tx.kind==='normal'&&owned.has(tx.from)&&tx.feeWei===null);
  return {value:values.value,partial:values.partial,fees,feesPartial:missing||missingFee,feeUsd:fees===0?0:fees!==null&&data.usd!==null?fees*data.usd:null};
}
export function availableCexResult(rows:FiatTransfer[],portfolioUsd:number|null,currency:ComparisonCurrency,currentAdaUsd:number|null,adaHistory:Record<string,number>,fx:FxHistory,time:number){
  if(portfolioUsd===null)return {value:null,partial:true};
  const rate=currency==='ADA'?currentAdaUsd!==null&&currentAdaUsd>0?1/currentAdaUsd:null:fiatRate(time,currency,fx);
  const transfers=availableTotal([...new Map(performanceTransfers(rows).map(row=>[row.hash,row])).values()].map(row=>{
    const dayRate=currency==='ADA'?rate:fiatRate(row.time,currency,fx);
    return row.usd!==null&&dayRate!==null?row.usd*dayRate*(row.side==='sell'?1:-1):null;
  }));
  const total=availableTotal([transfers.value,portfolioUsd!==null&&rate!==null?portfolioUsd*rate:null]);
  return {...total,partial:total.partial||transfers.partial};
}
