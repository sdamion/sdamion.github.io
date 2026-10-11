export async function refreshMarketBatches<T>(assets:string[],load:(batch:string[])=>Promise<T>,apply:(value:T)=>Promise<void>,progress:(done:number,total:number)=>void,signal:AbortSignal){
  const ids=[...new Set(assets)],batches:string[][]=[];
  for(let i=0;i<ids.length;i+=100)batches.push(ids.slice(i,i+100));
  let done=0;
  let complete=true;
  const terminal=(error:unknown)=>{
    const reason=error as {status?:number;code?:string;name?:string}|null;
    return reason?.code==='invalid_token_data'||reason?.name==='AbortError'||reason?.status!==undefined&&![408,413,500,502,503,504].includes(reason.status);
  };
  for(let i=0;i<batches.length;i+=2){
    signal.throwIfAborted();progress(done,batches.length);
    // Fetch two batches together, but publish and persist each result in order.
    const results=await Promise.allSettled(batches.slice(i,i+2).map(batch=>load(batch)));
    signal.throwIfAborted();
    let stop=false;
    for(const [index,result] of results.entries()){
      if(result.status==='rejected'){
        if(terminal(result.reason)){complete=false;stop=true;continue;}
        const batch=batches[i+index];
        // One bounded retry, split large requests into sequential 50-asset requests.
        for(let offset=0;offset<batch.length;offset+=50){
          signal.throwIfAborted();
          let value:T;
          try{value=await load(batch.slice(offset,offset+50));}
          catch(error){signal.throwIfAborted();complete=false;if(terminal(error)){stop=true;break;}continue;}
          signal.throwIfAborted();await apply(value);
        }
      }else{
        signal.throwIfAborted();await apply(result.value);
      }
      signal.throwIfAborted();progress(++done,batches.length);
    }
    if(stop)return false;
  }
  return complete;
}
