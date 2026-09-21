export const apiBase=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)?'/api/portfolio':'https://api.tdsp.online/api/portfolio';
import {acceptRenewedSession} from './session';
let activeRole:'delegator'|'admin'='delegator';
export function setSessionRole(role:'delegator'|'admin'){activeRole=role;}
export function sessionToken(){return sessionStorage.getItem('tdsp-raffle-session-'+activeRole)||'';}
export async function portfolioFetch(path:string,options:RequestInit={},retryRenewed=true):Promise<Response>{
  const operation=path.split('/').pop();
  const timeout=new AbortController();
  const timer=setTimeout(()=>timeout.abort(),75000);
  const signal=options.signal?AbortSignal.any([options.signal,timeout.signal]):timeout.signal;
  const sentToken=sessionToken();
  try{
    const response=await fetch(`${apiBase}/${operation}`,{...options,cache:'no-store',signal,headers:{...options.headers,Authorization:`Bearer ${sentToken}`}});
    signal.throwIfAborted();
    if(response.status===401||response.status===403){
      if(retryRenewed&&sessionToken()&&sessionToken()!==sentToken){
        await response.body?.cancel();clearTimeout(timer);
        return portfolioFetch(path,options,false);
      }
      window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));
    }else{
      acceptRenewedSession(sessionStorage,sentToken,response.headers.get('X-TDSP-Session'));
    }
    // Keep the deadline active while reading the JSON body, not just its headers.
    const body=await response.arrayBuffer();
    return new Response(response.status===204?null:body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }catch(error){
    if(timeout.signal.aborted&&!options.signal?.aborted)throw new Error(`Portfolio ${operation} request timed out after 75 seconds. Your cached data is retained; please retry.`);
    throw error;
  }finally{clearTimeout(timer);}
}
