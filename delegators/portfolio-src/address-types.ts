export type AddressType='dex'|'cex'|'min'|'svc';
export type SourceType='min'|'svc';
type Classification={dex?:boolean;miner?:boolean;sourceType?:SourceType};
export const addressTypes=[
  {value:'dex',label:'DEX'},
  {value:'cex',label:'CEX'},
  {value:'min',label:'MIN · Mining'},
  {value:'svc',label:'SVC · Services'}
] as const;
export function addressType(row:Classification):AddressType{
  return row.miner?row.sourceType==='svc'?'svc':'min':row.dex?'dex':'cex';
}
export function addressTypeChange(type:AddressType){
  return type==='min'||type==='svc'?{dex:false,miner:true,sourceType:type,out:false}:{dex:type==='dex',miner:false,sourceType:undefined};
}
export function sourceTypeFields(row:{miner?:unknown;sourceType?:unknown}):{sourceType?:SourceType}{
  return row.miner===true&&(row.sourceType==='min'||row.sourceType==='svc')?{sourceType:row.sourceType}:{};
}
