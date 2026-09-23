import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from './App';
import {portfolioFetch,setSessionRole} from './transport';
import {validStakeAddress} from './member';
function MemberPortfolio(){
  const [stake,setStake]=useState(''),[error,setError]=useState('Verifying your wallet session…');
  useEffect(()=>{
    const control=new AbortController();
    const lock=()=>{control.abort();setStake('');setError('Your wallet session has ended. Close Portfolio and reconnect in the members area.');};
    window.addEventListener('tdsp:portfolio-session-expired',lock);
    portfolioFetch('/session',{signal:control.signal}).then(async r=>{
      if(!r.ok)throw new Error(r.status===404?'The TDSP backend needs the portfolio update before this tool can load.':'Connect your wallet in the members area first.');
      const data=await r.json() as {stake_address?:string};
      if(!data.stake_address||!validStakeAddress(data.stake_address))throw new Error('No mainnet stake address was returned for this member.');
      if(!control.signal.aborted)setStake(data.stake_address);
    }).catch(e=>{if(!control.signal.aborted)setError(e.message);});
    return()=>{control.abort();window.removeEventListener('tdsp:portfolio-session-expired',lock);};
  },[]);
  return stake?<Home key={stake} memberStake={stake}/>:<main className="member-portfolio"><div className="portfolio-body"><h1>Member portfolio</h1><p role="status">{error}</p></div></main>;
}
let portfolioInstance:{role:string;content:HTMLElement;destroy:()=>void}|null=null;
export function mountPortfolio(container:HTMLElement,{role='delegator'}:{role?:'delegator'|'admin'}={}){
  if((window as unknown as {TDSPRuntime:{isMobileDevice:()=>boolean}}).TDSPRuntime.isMobileDevice()){
    container.textContent='Portfolio is available on desktop computers only.';
    return ()=>{container.replaceChildren();};
  }
  if(portfolioInstance&&portfolioInstance.role!==role)portfolioInstance.destroy();
  setSessionRole(role);
  if(!portfolioInstance){
    const content=document.createElement('div');
    const root=createRoot(content);
    const instance={role,content,destroy:()=>{
      window.removeEventListener('tdsp:portfolio-session-expired',instance.destroy);
      root.unmount();content.remove();
      if(portfolioInstance===instance)portfolioInstance=null;
    }};
    portfolioInstance=instance;
    window.addEventListener('tdsp:portfolio-session-expired',instance.destroy);
    root.render(<MemberPortfolio/>);
  }
  const instance=portfolioInstance;
  container.append(instance.content);
  // Closing the view must not abort its refresh or session keepalive.
  return ()=>{
    window.dispatchEvent(new Event('tdsp:portfolio-hidden'));
    instance.content.remove();
  };
}
