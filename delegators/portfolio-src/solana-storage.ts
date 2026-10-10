import {solanaData,type SolanaData} from './solana.ts';
import {compactBlock,expandBlock,CACHE_RECORDS_PER_PART} from './compact-storage.ts';

export function encodeSolanaSettings(key:string,data:SolanaData):Record<string,string>{
  if(Object.values(data.accounts).reduce((sum,row)=>sum+row.transactions.length,0)+(data.pending?.length||0)<=CACHE_RECORDS_PER_PART)return {[key]:JSON.stringify(data)};
  const settings:Record<string,string>={},accounts:Record<string,unknown>={};
  function parts(name:string,rows:unknown[]){
    const count=Math.ceil(rows.length/CACHE_RECORDS_PER_PART);
    for(let part=0;part<count;part++)settings[`${key}::${name}:${part}`]=JSON.stringify(compactBlock(rows.slice(part*CACHE_RECORDS_PER_PART,(part+1)*CACHE_RECORDS_PER_PART)));
    return count;
  }
  for(const [address,{transactions,...header}] of Object.entries(data.accounts))accounts[address]={...header,parts:parts(address,transactions)};
  const {pending,...header}=data;
  settings[key]=JSON.stringify({...header,accounts,storageVersion:1,...(pending?{pendingParts:parts('pending',pending)}:{})});
  return settings;
}
export function readSolanaSettings(key:string,get:(key:string)=>string|null):SolanaData{
  const value=JSON.parse(get(key)||'null');
  if(value?.storageVersion!==1)return solanaData(value);
  function records(name:string,count:number){
    if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid Solana cache index.');
    const result:unknown[]=[];
    for(let part=0;part<count;part++){
      const raw=get(`${key}::${name}:${part}`);
      if(raw===null)throw new Error('Solana cache is incomplete. Saved data is retained.');
      const rows=expandBlock(JSON.parse(raw));
      if(!Array.isArray(rows)||rows.length>CACHE_RECORDS_PER_PART)throw new Error('Invalid Solana cache part.');
      for(const row of rows)result.push(row);
    }
    return result;
  }
  const accounts=Object.fromEntries(Object.entries(value.accounts).map(([address,row]:[string,any])=>{
    const {parts,...header}=row;return [address,{...header,transactions:records(address,parts)}];
  }));
  return solanaData({...value,accounts,...(value.pendingParts!==undefined?{pending:records('pending',value.pendingParts)}:{})});
}
export function compactSolanaSettings(settings:Record<string,string>){
  const next={...settings};
  for(const [key,raw] of Object.entries(settings))if(/^tdsp-member-solana-data:[^:]+$/.test(key)){
    const value=JSON.parse(raw);
    if(value?.storageVersion!==1)Object.assign(next,encodeSolanaSettings(key,solanaData(value)));
  }
  return next;
}
