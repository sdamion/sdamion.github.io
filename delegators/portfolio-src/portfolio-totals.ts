import {ethereumTransactions,weiToEth,type EthereumData,type EthereumWallet,type FiatTransfer} from './ethereum.ts';
import {fiatRate,type ComparisonCurrency,type FxHistory} from './transfer-comparison.ts';
import {performanceTransfers} from './portfolio-flows.ts';

export function availableTotal(values:(number|null)[]){
  const known=values.filter((value):value is number=>value!==null&&Number.isFinite(value));
  return {value:known.length?known.reduce((sum,value)=>sum+value,0):values.length?null:0,partial:known.length!==values.length};
}
export function ethereumAvailableTotals(data:EthereumData,wallets:EthereumWallet[]){
  const values=availableTotal(wallets.map(w=>{
    const account=data.accounts[w.address];if(!account)return null;
    const amount=weiToEth(account.balanceWei);return amount===0?0:data.usd===null?null:amount*data.usd;
  }));
  const owned=new Set(wallets.map(w=>w.address)),missing=wallets.some(w=>!data.accounts[w.address]);
  const transactions=ethereumTransactions(data,wallets);
  const raw=transactions.reduce((sum,tx)=>sum+(tx.kind==='normal'&&owned.has(tx.from)&&tx.feeWei!==null?BigInt(tx.feeWei):0n),0n);
  const fees=wallets.length&&wallets.every(w=>!data.accounts[w.address])?null:weiToEth(String(raw));
  return {value:values.value,partial:values.partial,fees,feesPartial:missing,feeUsd:fees===0?0:fees!==null&&data.usd!==null?fees*data.usd:null};
}
export function availableCexResult(rows:FiatTransfer[],portfolioUsd:number|null,currency:ComparisonCurrency,currentAdaUsd:number|null,adaHistory:Record<string,number>,fx:FxHistory,time:number){
  if(portfolioUsd===null)return {value:null,partial:true};
  const rate=currency==='ADA'?currentAdaUsd!==null&&currentAdaUsd>0?1/currentAdaUsd:null:fiatRate(time,currency,fx);
  const transfers=availableTotal([...new Map(performanceTransfers(rows).map(row=>[row.hash,row])).values()].map(row=>{
    const ada=adaHistory[new Date(row.time*1000).toISOString().slice(0,10)];
    const dayRate=currency==='ADA'?Number.isFinite(ada)&&ada>0?1/ada:null:fiatRate(row.time,currency,fx);
    return row.usd!==null&&dayRate!==null?row.usd*dayRate*(row.side==='sell'?1:-1):null;
  }));
  const total=availableTotal([transfers.value,portfolioUsd!==null&&rate!==null?portfolioUsd*rate:null]);
  return {...total,partial:total.partial||transfers.partial};
}
