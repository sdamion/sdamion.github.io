export function visibleHistory<T>(complete:T[],pending:T[],key:(row:T)=>string,include:(row:T)=>boolean,compare:(a:T,b:T)=>number):T[]{
  const rows=new Map<string,T>();
  for(const row of pending)if(include(row))rows.set(key(row),row);
  for(const row of complete)if(include(row))rows.set(key(row),row);
  return [...rows.values()].sort(compare);
}
