export async function refreshMarketBatches<T>(assets:string[],load:(batch:string[])=>Promise<T>,apply:(value:T)=>Promise<void>,progress:(done:number,total:number)=>void,signal:AbortSignal,now=Date.now){
  const ids=[...new Set(assets)],batches:string[][]=[];
  for(let i=0;i<ids.length;i+=50)batches.push(ids.slice(i,i+50));
  let done=0;
  let complete=true;
  const terminal=(error:unknown)=>{
    const reason=error as {status?:number;code?:string;name?:string}|null;
    return reason?.code==='invalid_token_data'||['AbortError','TimeoutError','PortfolioTimeoutError'].includes(reason?.name||'')||reason?.status!==undefined&&![413,500,502,503].includes(reason.status);
  };
  for(let i=0;i<batches.length;i+=2){
    signal.throwIfAborted();progress(done,batches.length);
    // Fetch two batches together, but publish and persist each result in order.
    const elapsed:number[]=[];
    const results=await Promise.allSettled(batches.slice(i,i+2).map(async(batch,index)=>{
      const started=now();try{return await load(batch);}finally{elapsed[index]=now()-started;}
    }));
    signal.throwIfAborted();
    let stop=false;
    for(const [index,result] of results.entries()){
      if(result.status==='rejected'){
        if(terminal(result.reason)||elapsed[index]>5000){complete=false;stop=true;continue;}
        const batch=batches[i+index];
        // Only fast failures retry; slow optional providers must not multiply the wait.
        for(let offset=0;offset<batch.length;offset+=25){
          signal.throwIfAborted();
          let value:T;
          const started=now();
          try{value=await load(batch.slice(offset,offset+25));}
          catch(error){signal.throwIfAborted();complete=false;if(terminal(error)||now()-started>5000){stop=true;break;}continue;}
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
