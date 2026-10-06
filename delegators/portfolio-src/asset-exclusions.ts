// Keep ledger ADA accounting intact; exclusions affect token portfolio metrics.
export function includedAssets<T extends {id:string}>(rows:T[],settings:Record<string,{excluded?:boolean}>):T[]{
  return rows.filter(row=>row.id==='lovelace'||settings[row.id]?.excluded!==true);
}
