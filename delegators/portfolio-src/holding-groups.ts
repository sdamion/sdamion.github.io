import {tableGroups} from './table-groups.ts';

export function policyCollections<T extends {id:string}>(rows:T[]):{policy:string;assets:T[]}[]{
  return tableGroups(rows,row=>/^[a-f0-9]{56}(?:[a-f0-9]{2}){0,32}$/.test(row.id)?row.id.slice(0,56):null,2)
    .map(({key,rows})=>({policy:key,assets:rows}));
}

export function holdingTotal(rows:{value:number|null}[],complete:boolean):number|null{
  const priced=rows.filter(row=>row.value!==null);
  return priced.length?priced.reduce((sum,row)=>sum+(row.value??0),0):complete&&rows.length===0?0:null;
}

export function collectionName(name:string):string{
  return name.replace(/[\s#_-]*\d+\s*$/,'').trim()||name;
}

function readableName(name:string):boolean{
  return !!name.trim()&&!/[\u0000-\u001f\u007f]/.test(name)&&!/^asset1[0-9a-z]+$/i.test(name)&&!/^[a-f0-9]{12,}(?:[.\u2026]+[a-f0-9]+)?$/i.test(name.trim());
}

export function collectionRepresentative<T extends {id:string;name:string}>(assets:T[]):{asset:T;name:string|null}|null{
  let chosen:{asset:T;name:string|null}|null=null;
  for(const asset of assets){
    let name=readableName(asset.name)?collectionName(asset.name):null;
    if(!name){
      let hex=asset.id.slice(56);
      if(/^(000643b0|000de140|0014df10|001bc280)/.test(hex))hex=hex.slice(8);
      try{
        const decoded=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(hex.match(/../g)||[],byte=>parseInt(byte,16)));
        if(readableName(decoded))name=collectionName(decoded);
      }catch{}
    }
    if(!chosen||(name!==null&&chosen.name===null)||((name!==null)===(chosen.name!==null)&&asset.id<chosen.asset.id))chosen={asset,name};
  }
  return chosen;
}

export function policyTableRows<T extends {id:string}>(rows:T[],expanded:ReadonlySet<string>,include:(row:T)=>boolean=()=>true):({asset:T}|{policy:string;assets:T[]})[]{
  const groups=new Map(policyCollections(rows).map(group=>[group.policy,group]));
  const seen=new Set<string>();
  const entries:({asset:T}|{policy:string;assets:T[]})[]=[];
  for(const row of rows){
    const group=groups.get(row.id.slice(0,56));
    if(!group){if(include(row))entries.push({asset:row});continue;}
    if(seen.has(group.policy))continue;
    seen.add(group.policy);
    const assets=group.assets.filter(include);
    if(!assets.length)continue;
    entries.push(group);
    if(expanded.has(group.policy))entries.push(...assets.map(asset=>({asset})));
  }
  return entries;
}
