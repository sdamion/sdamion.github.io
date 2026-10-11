export async function refreshMarketBatches<T>(assets:string[],load:(batch:string[])=>Promise<T>,apply:(value:T)=>Promise<void>,progress:(done:number,total:number)=>void,signal:AbortSignal){
  const ids=[...new Set(assets)],batches:string[][]=[];
  for(let i=0;i<ids.length;i+=100)batches.push(ids.slice(i,i+100));
  let done=0;
  for(let i=0;i<batches.length;i+=2){
    signal.throwIfAborted();progress(done,batches.length);
    // Fetch two batches together, but publish and persist each result in order.
    const results=await Promise.allSettled(batches.slice(i,i+2).map(batch=>load(batch)));
    signal.throwIfAborted();
    let failed=false;
    for(const result of results){
      if(result.status==='rejected'){failed=true;continue;}
      signal.throwIfAborted();await apply(result.value);
      signal.throwIfAborted();progress(++done,batches.length);
    }
    if(failed)return false;
  }
  return true;
}
