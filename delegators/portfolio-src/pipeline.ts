// Keep discovery and analysis concurrent, with only one request per worker.
export async function runPipeline<T>(
  produce:(enqueue:(items:T[])=>void,signal:AbortSignal)=>Promise<void>,
  consume:(items:T[],signal:AbortSignal)=>Promise<void>,
  signal:AbortSignal,
  batchSize=50
):Promise<void> {
  const control=new AbortController();
  const active=AbortSignal.any([signal,control.signal]);
  const queue:T[]=[];
  let finished=false;
  let wake:(()=>void)|undefined;
  let failure:unknown;
  let failed=false;
  const notify=()=>{wake?.();wake=undefined;};
  const guard=async(work:()=>Promise<void>)=>{
    try{await work();}catch(error){if(!failed){failed=true;failure=error;}control.abort();}
    finally{notify();}
  };
  active.addEventListener('abort',notify);
  try{
    await Promise.all([
      guard(async()=>{
        try{await produce(items=>{active.throwIfAborted();queue.push(...items);notify();},active);}
        finally{finished=true;notify();}
      }),
      guard(async()=>{
        while(true){
          active.throwIfAborted();
          if(queue.length){await consume(queue.splice(0,batchSize),active);continue;}
          if(finished)return;
          await new Promise<void>(resolve=>{wake=resolve;});
        }
      })
    ]);
    if(failed)throw failure;
    active.throwIfAborted();
  }finally{active.removeEventListener('abort',notify);}
}
