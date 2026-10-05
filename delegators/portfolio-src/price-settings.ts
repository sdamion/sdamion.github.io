type Settings={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;keys:()=>string[]};
type Overrides=Record<string,{average?:string;price?:string;decimals?:string;excluded?:boolean;gainLossDisabled?:boolean}>;
export function loadPriceSettings(storage:Settings,stake:string,walletKey:string):Overrides{
  const key='tdsp-member-basis:'+stake;
  const saved=storage.getItem(key);
  if(saved!==null)return JSON.parse(saved);
  const current='tdsp-member-basis:'+walletKey;
  const legacy=storage.keys().filter(name=>name.startsWith(key+'::')&&name!==current).sort();
  const result:Overrides={};
  for(const name of [...legacy,current]){
    const raw=storage.getItem(name);
    if(!raw)continue;
    let values;try{values=JSON.parse(raw);}catch{continue;}
    if(!values||typeof values!=='object'||Array.isArray(values))continue;
    for(const [id,value] of Object.entries(values)){
      if(value&&typeof value==='object'&&!Array.isArray(value))result[id]={...result[id],...value};
    }
  }
  if(Object.keys(result).length)storage.setItem(key,JSON.stringify(result));
  return result;
}
