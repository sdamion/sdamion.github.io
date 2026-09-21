export const apiBase=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)?'/api/portfolio':'https://api.tdsp.online/api/portfolio';
let activeRole:'delegator'|'admin'='delegator';
export function setSessionRole(role:'delegator'|'admin'){activeRole=role;}
export function sessionToken(){return sessionStorage.getItem('tdsp-raffle-session-'+activeRole)||'';}
export async function portfolioFetch(path:string,options:RequestInit={}){
  const operation=path.split('/').pop();
  const response=await fetch(`${apiBase}/${operation}`,{...options,headers:{...options.headers,Authorization:`Bearer ${sessionToken()}`}});
  if(response.status===401||response.status===403)window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));
  return response;
}
