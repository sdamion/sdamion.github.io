import {ordinalsData,type OrdinalsData} from './ordinals.ts';
import {compactBlock,expandBlock,CACHE_RECORDS_PER_PART} from './compact-storage.ts';

export function encodeOrdinalsSettings(key:string,data:OrdinalsData){
  const settings:Record<string,string>={},accounts:Record<string,unknown>={};
  function parts(name:string,rows:unknown[]){
    const count=Math.ceil(rows.length/CACHE_RECORDS_PER_PART);
    for(let part=0;part<count;part++)settings[`${key}::${name}:${part}`]=JSON.stringify(compactBlock(rows.slice(part*CACHE_RECORDS_PER_PART,(part+1)*CACHE_RECORDS_PER_PART)));
    return count;
  }
  for(const [address,{events,owned,...header}] of Object.entries(data.accounts))accounts[address]={...header,eventParts:parts(address+':events',events),ownedParts:parts(address+':owned',owned)};
  settings[key]=JSON.stringify({storageVersion:1,accounts,metadataParts:parts('metadata',Object.values(data.metadata))});return settings;
}
export function readOrdinalsSettings(key:string,get:(key:string)=>string|null):OrdinalsData{
  const value=JSON.parse(get(key)||'null');if(value?.storageVersion!==1)return ordinalsData(value);
  function rows(name:string,count:number){
    if(!Number.isSafeInteger(count)||count<0)throw new Error('Ordinals cache is incomplete. Saved history is retained.');
    const result:unknown[]=[];
    for(let part=0;part<count;part++){
      const raw=get(`${key}::${name}:${part}`);if(raw===null)throw new Error('Ordinals cache is incomplete. Saved history is retained.');
      const values=expandBlock(JSON.parse(raw));if(!Array.isArray(values)||values.length>CACHE_RECORDS_PER_PART)throw new Error('Ordinals cache is incomplete. Saved history is retained.');for(const row of values)result.push(row);
    }return result;
  }
  const accounts=Object.fromEntries(Object.entries(value.accounts).map(([address,row]:[string,any])=>[address,{tip:row.tip,checkedAt:row.checkedAt,...(row.historyComplete===undefined?{}:{historyComplete:row.historyComplete}),events:rows(address+':events',row.eventParts),owned:rows(address+':owned',row.ownedParts)}]));
  return ordinalsData({accounts,metadata:Object.fromEntries(rows('metadata',value.metadataParts).map((row:any)=>[row.id,row]))});
}
