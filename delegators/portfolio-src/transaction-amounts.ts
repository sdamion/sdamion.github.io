// Keep aggregation in lovelace; convert only for prices and display.
export function lovelaceToAda(raw:string|bigint|null|undefined):number|null{
  return raw==null?null:Number(BigInt(raw))/1e6;
}

export function adaUsdValue(ada:number|null,price:number|null|undefined):number|null{
  if(ada===null)return null;
  if(ada===0)return 0;
  return price!=null&&Number.isFinite(price)&&price>0?ada*price:null;
}

export function historicalAdaPrice(time:number,history:Record<string,number>):number|null{
  const price=history[new Date(time*1000).toISOString().slice(0,10)];
  return Number.isFinite(price)&&price>0?price:null;
}

export function transactionAmounts(raw:string|bigint|null|undefined,time:number,history:Record<string,number>,feeRaw?:string|null){
  const ada=lovelaceToAda(raw),price=historicalAdaPrice(time,history),feeAda=lovelaceToAda(feeRaw);
  return {ada,price,usd:adaUsdValue(ada,price),feeAda,feeUsd:adaUsdValue(feeAda,price)};
}
