type Row={value:number|null;cost:number|null;pnl:number|null};
export function valuationCoverage(rows:Row[]){
  const valued=rows.filter(r=>r.value!==null);
  const covered=rows.filter(r=>r.value!==null&&r.cost!==null&&r.pnl!==null);
  const missingCost=rows.filter(r=>r.cost===null);
  return {total:rows.length,valued:valued.length,covered:covered.length,missingCost:missingCost.length,
    missingValue:rows.filter(r=>r.value===null).length,partial:covered.length<rows.length,
    excludedValue:valued.filter(r=>r.cost===null).reduce((sum,r)=>sum+r.value!,0)};
}
