export type ReceiptEvent={receivedRaw:bigint;spentRaw:bigint;costUsd:number|null};

// A shared receipt-price benchmark: zero-cost receipts add units, not purchase cost.
export function receiptBasis(events:ReceiptEvent[],balanceRaw:bigint,decimals:number){
  if(balanceRaw<0n||!Number.isInteger(decimals)||decimals<0||decimals>255)return {reconciled:false,usd:null,average:null};
  let raw=0n,cost:number|null=0,valid=true;
  for(const event of events){
    if(event.receivedRaw<0n||event.spentRaw<0n){valid=false;continue;}
    raw+=event.receivedRaw;
    if(event.receivedRaw>0n)cost=cost===null||event.costUsd===null||!Number.isFinite(event.costUsd)||event.costUsd<0?null:cost+event.costUsd;
    if(event.spentRaw>raw){valid=false;raw=0n;cost=null;continue;}
    if(event.spentRaw){
      const remaining=raw-event.spentRaw;
      cost=remaining===0n?0:cost===null?null:cost*Number(remaining)/Number(raw);
      raw=remaining;
    }
  }
  const reconciled=valid&&raw===balanceRaw;
  const usd=reconciled&&cost!==null&&Number.isFinite(cost)?cost:null;
  const quantity=Number(balanceRaw)/10**decimals;
  return {reconciled,usd,average:usd!==null&&Number.isFinite(quantity)&&quantity>0?usd/quantity:null};
}
