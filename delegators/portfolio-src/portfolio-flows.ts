// Receipts such as mining remain visible, but are not proceeds from an asset sale.
export function performanceTransfers<T extends {performance?:boolean}>(rows:T[]):T[]{
  return rows.filter(row=>row.performance!==false);
}
