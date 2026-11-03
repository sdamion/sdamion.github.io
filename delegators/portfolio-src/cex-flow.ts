export type CexFlow={side:'buy'|'sell';raw:bigint|null;verified:boolean};

export function classifyCexFlow({incomingMatched=false,outgoingMatched=false,incomingRaw=null,outgoingRaw=null}:{
  incomingMatched?:boolean;outgoingMatched?:boolean;incomingRaw?:bigint|null;outgoingRaw?:bigint|null;
}):CexFlow|null{
  if(incomingMatched&&outgoingMatched)return null;
  if(incomingRaw!==null&&incomingRaw>0n&&incomingMatched)return {side:'buy',raw:incomingRaw,verified:true};
  if(outgoingRaw!==null&&outgoingRaw>0n&&outgoingMatched)return {side:'sell',raw:outgoingRaw,verified:true};
  if(incomingMatched)return {side:'buy',raw:null,verified:false};
  if(outgoingMatched)return {side:'sell',raw:null,verified:false};
  return null;
}
