// Receipts such as mining remain visible, but are not proceeds from an asset sale.
export function performanceTransfers<T extends {performance?:boolean}>(rows:T[]):T[]{
  return rows.filter(row=>row.performance!==false);
}

export function gainTransfers<T extends {hash:string;performance?:boolean}>(rows:T[],receipts:T[]):T[]{
  return [...performanceTransfers(rows),...receipts.map(row=>({...row,hash:'proceeds:'+row.hash,performance:true}))];
}
