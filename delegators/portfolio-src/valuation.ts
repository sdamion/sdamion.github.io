import type {AddressInfo,Fact} from './core.ts';

export function tokenDecimals(value:unknown):number|null {
  return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=30?value:null;
}

export function knownDecimals(infos:AddressInfo[],facts:Fact[]) {
  const result:Record<string,number>={};
  const add=(id:string,value:unknown)=>{const n=tokenDecimals(value);if(n!==null)result[id]=n;};
  for(const fact of [...facts].sort((a,b)=>a.time-b.time))for(const [id,n] of Object.entries(fact.decimals||{}))add(id,n);
  for(const info of infos)for(const utxo of info.utxo_set||[])for(const asset of utxo.asset_list||[])add(asset.policy_id+asset.asset_name,asset.decimals);
  return result;
}

export function holdingValue(raw:string,decimals:number|null|undefined,price:number|null,average:number|null,automatic?:{raw:string;usd:number|null}|null) {
  const qty=tokenDecimals(decimals)===null?null:Number(raw)/10**decimals!;
  const value=qty!==null&&price!==null?qty*price:null;
  const cost=qty!==null&&average!==null?qty*average:automatic?.raw===raw?automatic.usd:null;
  const pnl=value!==null&&cost!==null?value-cost:null;
  return {qty,value,cost,pnl};
}
