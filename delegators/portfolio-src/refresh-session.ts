export function keepRefreshSessionAlive(
  renew:(signal:AbortSignal)=>Promise<unknown>,
  schedule:(tick:()=>void)=>()=>void=tick=>{
    const timer=setInterval(tick,60000);
    return ()=>clearInterval(timer);
  }
){
  const control=new AbortController();
  let pending=false;
  const tick=async()=>{
    if(pending||control.signal.aborted)return;
    pending=true;
    try{await renew(control.signal);}
    catch{/* Retry transient failures on the next tick; transport handles invalid sessions. */}
    finally{pending=false;}
  };
  const stop=schedule(()=>{void tick();});
  void tick();
  return ()=>{control.abort();stop();};
}
