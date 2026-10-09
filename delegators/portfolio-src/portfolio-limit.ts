import {waitForRetry} from './retry-wait.ts';

export async function requestWithPortfolioLimit(send:()=>Promise<Response>,signal:AbortSignal,wait=waitForRetry):Promise<Response>{
  for(let attempt=0;;attempt++){
    signal.throwIfAborted();
    const response=await send();signal.throwIfAborted();
    if(response.status!==429||attempt>=2)return response;
    let error;try{error=await response.clone().json();}catch{return response;}
    if(error?.code!=='portfolio_rate_limit')return response;
    const seconds=Number(response.headers.get('Retry-After')||error.retryAfter);
    if(!Number.isFinite(seconds)||seconds<=0||seconds>60)return response;
    await response.body?.cancel();
    await wait(Math.max(1000,seconds*1000),signal);
  }
}
