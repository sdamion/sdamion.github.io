// Bound growing snapshot copies and checkpoint scheduling, while always flushing on exit.
export function createRefreshPublisher(publish:()=>Promise<void>,now=Date.now,interval=1000){
  let last=-Infinity;
  return async(force=false)=>{
    const time=now();
    if(!force&&time-last<interval)return;
    last=time;
    await publish();
  };
}
