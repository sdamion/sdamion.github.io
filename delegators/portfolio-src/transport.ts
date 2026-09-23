export const apiBase=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)?'/api/portfolio':'https://api.tdsp.online/api/portfolio';
import {acceptRenewedSession} from './session';
let activeRole:'delegator'|'admin'='delegator';
export function setSessionRole(role:'delegator'|'admin'){activeRole=role;}
export function sessionToken(){return sessionStorage.getItem('tdsp-raffle-session-'+activeRole)||'';}
export async function portfolioUpload(body:string,signal:AbortSignal,progress:(loaded:number,total:number)=>void,retryRenewed=true):Promise<Response>{
  signal.throwIfAborted();
  const sentToken=sessionToken();
  const response=await new Promise<Response>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    const abort=()=>xhr.abort();
    const finish=()=>signal.removeEventListener('abort',abort);
    xhr.open('POST',`${apiBase}/vault`);xhr.timeout=75000;
    xhr.setRequestHeader('Authorization',`Bearer ${sentToken}`);xhr.setRequestHeader('Content-Type','application/json');
    xhr.upload.onprogress=event=>{if(event.lengthComputable)progress(event.loaded,event.total);};
    xhr.onerror=()=>{finish();reject(new Error('Cache upload failed. Retrying while this page stays open.'));};
    xhr.ontimeout=()=>{finish();reject(new Error('Cache upload timed out. Retrying while this page stays open.'));};
    xhr.onabort=()=>{finish();reject(new DOMException('Upload cancelled','AbortError'));};
    xhr.onload=()=>{finish();resolve(new Response(xhr.responseText,{status:xhr.status,headers:{'X-TDSP-Session':xhr.getResponseHeader('X-TDSP-Session')||''}}));};
    signal.addEventListener('abort',abort,{once:true});xhr.send(body);
  });
  if(response.status===401||response.status===403){
    if(retryRenewed&&sessionToken()&&sessionToken()!==sentToken)return portfolioUpload(body,signal,progress,false);
    window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));
  }else acceptRenewedSession(sessionStorage,sentToken,response.headers.get('X-TDSP-Session'));
  return response;
}
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
