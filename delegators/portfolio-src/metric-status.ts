export function unrealisedStatus(facts:number,receipts:number,hasHistory:boolean,hasQuote:boolean,complete:boolean,reconciled:boolean){
  if(!facts)return 'Waiting for transaction details';
  if(!hasQuote)return 'Current price unavailable';
  if(!hasHistory)return 'Historical prices unavailable';
  if(complete&&!reconciled)return 'History / balance mismatch';
  if(!receipts)return 'Waiting for priced receipts';
  return 'Cost basis unavailable';
}

export function cexStatus(facts:number,hasHistory:boolean,boughtRaw:string,soldRaw:string,metadataComplete:boolean,complete:boolean){
  if(!facts)return 'Waiting for transaction details';
  if(!metadataComplete)return 'Waiting for counterparty details';
  if(BigInt(soldRaw)===0n)return complete?'No matched CEX sales':'No CEX sales loaded yet';
  if(!hasHistory)return 'Historical prices unavailable';
  if(BigInt(boughtRaw)===0n)return 'Waiting for purchase history';
  return complete?'Sale cost basis / price unavailable':'Waiting for earlier receipts / prices';
}
