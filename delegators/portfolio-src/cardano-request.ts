import {cardanoRequestContext} from './request-context.ts';

export function createCardanoRequest(fetcher:(path:string,options:RequestInit)=>Promise<Response>,wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms))){
  return async function request<T>(path:string,body:object,signal:AbortSignal,range?:string):Promise<T>{
    for(let attempt=0;attempt<3;attempt++){
      signal.throwIfAborted();
      let response:Response;
      let timedOut=false;
      try{
        response=await fetcher('/api/cardano',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,body,range}),signal});
      }catch(error){
        signal.throwIfAborted();
        if(!(error instanceof Error)||error.name!=='PortfolioTimeoutError')throw error;
        timedOut=true;
        response=new Response(null,{status:504});
      }
      if(response.ok)return response.json() as Promise<T>;
      const hashes=(body as {_tx_hashes?:string[]})._tx_hashes;
      if(path==='tx_info'&&hashes&&hashes.length>1&&[413,502,503,504].includes(response.status)){
        const middle=Math.ceil(hashes.length/2);
        const left=await request<unknown[]>(path,{...body,_tx_hashes:hashes.slice(0,middle)},signal);
        const right=await request<unknown[]>(path,{...body,_tx_hashes:hashes.slice(middle)},signal);
        return [...left,...right] as T;
      }
      if(![429,502,503,504].includes(response.status)||attempt===2)throw new Error(`Cardano ${cardanoRequestContext(path,body,range)} ${timedOut?'timed out after 75 seconds':`returned HTTP ${response.status}`} after ${attempt+1} attempt(s). Your last saved data is still available.`);
      await wait(1000*(attempt+1));
    }
    throw new Error('Indexer unavailable');
  };
}
