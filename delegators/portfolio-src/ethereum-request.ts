import {waitForRetry} from './retry-wait.ts';
export {waitForRetry as waitForEthereumRetry} from './retry-wait.ts';

export async function ethereumRequest<T>(send:()=>Promise<Response>,signal:AbortSignal,wait=waitForRetry):Promise<T>{
  for(let attempt=0;;attempt++){
    signal.throwIfAborted();
    const response=await send(),result=await response.json();
    signal.throwIfAborted();
    if(response.ok)return result;
    const error=Object.assign(new Error(result.error||'Ethereum refresh failed. Saved data is retained.'),{status:response.status,code:result.code});
    // Older backends have no error code. Only their explicit short-term rate limit is retryable.
    const limited=response.status===429&&(result.code==='upstream_rate_limit'||!result.code&&/^(Etherscan|Blockscout) rate limit reached\. Retry shortly\.$/.test(result.error||''));
    if(!limited||attempt>=2)throw error;
    const retryAfter=Number(result.retryAfter??response.headers.get('Retry-After'));
    const delay=Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:2000;
    if(delay>120000)throw error;
    await wait(Math.max(1000,delay),signal);
  }
}
