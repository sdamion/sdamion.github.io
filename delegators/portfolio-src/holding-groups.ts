export function policyCollections<T extends {id:string}>(rows:T[]):{policy:string;assets:T[]}[]{
  const groups=new Map<string,T[]>();
  for(const row of rows){
    if(!/^[a-f0-9]{56}(?:[a-f0-9]{2}){0,32}$/.test(row.id))continue;
    const policy=row.id.slice(0,56);
    const assets=groups.get(policy)||[];
    assets.push(row);
    groups.set(policy,assets);
  }
  return [...groups].filter(([,assets])=>assets.length>1).map(([policy,assets])=>({policy,assets}));
}

export function holdingTotal(rows:{value:number|null}[],complete:boolean):number|null{
  const priced=rows.filter(row=>row.value!==null);
  return priced.length?priced.reduce((sum,row)=>sum+(row.value??0),0):complete&&rows.length===0?0:null;
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
