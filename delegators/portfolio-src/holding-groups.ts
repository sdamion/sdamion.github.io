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
