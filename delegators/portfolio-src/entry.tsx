import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from './App';
import {portfolioFetch,setSessionRole} from './transport';
import {validStakeAddress} from './member';
import {vaultUnlocked,flushVault,storageMode,switchStorage,deleteStoredCache} from './vault';
import type {SigningWallet,StorageMode} from './vault';
import {StorageChoice} from './StorageChoice';
import {AssetOverlay} from './AssetOverlay';
export {unlockPortfolio,vaultUnlocked} from './vault';
function MemberPortfolio({wallet,role}:{wallet:()=>SigningWallet|null;role:'delegator'|'admin'}){
  const [stake,setStake]=useState(''),[error,setError]=useState('Verifying your wallet session…');
  const [ready,setReady]=useState(false),[settings,setSettings]=useState(false),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
  useEffect(()=>{
    const control=new AbortController();
    const lock=()=>{control.abort();setStake('');setError('Your wallet session has ended. Close Portfolio and reconnect in the members area.');};
    window.addEventListener('tdsp:portfolio-session-expired',lock);
    portfolioFetch('/session',{signal:control.signal}).then(async r=>{
      if(!r.ok)throw new Error(r.status===404?'The TDSP backend needs the portfolio update before this tool can load.':'Connect your wallet in the members area first.');
      const data=await r.json() as {stake_address?:string};
      if(!data.stake_address||!validStakeAddress(data.stake_address))throw new Error('No mainnet stake address was returned for this member.');
      if(!control.signal.aborted){setStake(data.stake_address);setReady(vaultUnlocked(data.stake_address));setError('');}
    }).catch(e=>{if(!control.signal.aborted)setError(e.message);});
    return()=>{control.abort();window.removeEventListener('tdsp:portfolio-session-expired',lock);};
  },[]);
  async function apply(mode:StorageMode,copy:boolean){setBusy(true);setError('');try{await new Promise(resolve=>setTimeout(resolve,0));await switchStorage(mode,stake,wallet(),role,copy);setReady(true);setSettings(false);setVersion(value=>value+1);}catch(e){setError(e instanceof Error?e.message:'Storage change failed.');setReady(vaultUnlocked(stake));}finally{setBusy(false);}}
  async function remove(mode:StorageMode){setBusy(true);setError('');try{await new Promise(resolve=>setTimeout(resolve,0));await deleteStoredCache(mode,stake);setReady(vaultUnlocked(stake));setVersion(value=>value+1);setError(`${mode==='local'?'Local':'Remote'} cache deleted.`);}catch(e){setReady(vaultUnlocked(stake));setError(e instanceof Error?e.message:'Cache deletion failed.');}finally{setBusy(false);}}
  const choice=<StorageChoice stake={stake} active={ready} busy={busy} error={error} onApply={apply} onDelete={remove}/>;
  if(!stake)return <main className="member-portfolio"><div className="portfolio-body"><h1>Member portfolio</h1><p role="status">{error}</p></div></main>;
  return <><section className="member-portfolio"><div className="portfolio-body">{ready?<div className="section-heading"><span className="small muted">Storage: {storageMode()==='remote'?'Encrypted remote':'Local browser'}</span><button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>setSettings(true)}>Storage settings</button></div>:choice}</div></section>{ready&&!busy&&<Home key={`${stake}:${version}`} memberStake={stake}/>} {ready&&settings&&<AssetOverlay id="portfolio-storage-overlay" name="Portfolio storage" onClose={()=>{if(!busy)setSettings(false);}}>{choice}</AssetOverlay>}</>;
}
let portfolioInstance:{role:string;content:HTMLElement;destroy:()=>void}|null=null;
export function mountPortfolio(container:HTMLElement,{role='delegator',getWallet=()=>null}:{role?:'delegator'|'admin';getWallet?:()=>SigningWallet|null}={}){
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
    root.render(<MemberPortfolio wallet={getWallet} role={role}/>);
  }
  const instance=portfolioInstance;
  container.append(instance.content);
  // Closing the view must not abort its refresh or session keepalive.
  return ()=>{
    void flushVault().catch(()=>{});
    window.dispatchEvent(new Event('tdsp:portfolio-hidden'));
    instance.content.remove();
  };
}
