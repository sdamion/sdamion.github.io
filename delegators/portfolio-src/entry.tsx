import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from './App';
import {portfolioFetch,setSessionRole} from './transport';
import {validStakeAddress} from './member';
import {vaultUnlocked,flushVault,switchStorage,deleteStoredCache,savedStorage,storageMode,isPortfolioMobile} from './vault';
import {Cloud,HardDrive} from 'lucide-react';
import type {SigningWallet,StorageMode} from './vault';
import {StorageChoice} from './StorageChoice';
import {AssetOverlay} from './AssetOverlay';
import {WalletConnectBox} from './WalletConnectBox';
export {unlockPortfolio,vaultUnlocked} from './vault';
type WalletProvider=(reconnect?:boolean,stake?:string)=>SigningWallet|null|Promise<SigningWallet|null>;
function MemberPortfolio({wallet,role}:{wallet:WalletProvider;role:'delegator'|'admin'}){
  const [stake,setStake]=useState(''),[error,setError]=useState('Verifying your wallet session…');
  const [ready,setReady]=useState(false),[settings,setSettings]=useState(false),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
  const [preference,setPreference]=useState<StorageMode|null>(null);
  useEffect(()=>{
    const control=new AbortController();
    const lock=()=>{control.abort();setStake('');setError('Your wallet session has ended. Close Portfolio and reconnect in the members area.');};
    window.addEventListener('tdsp:portfolio-session-expired',lock);
    portfolioFetch('/session',{signal:control.signal}).then(async r=>{
      if(!r.ok)throw new Error(r.status===404?'The TDSP backend needs the portfolio update before this tool can load.':'Connect your wallet in the members area first.');
      const data=await r.json() as {stake_address?:string};
      if(!data.stake_address||!validStakeAddress(data.stake_address))throw new Error('No mainnet stake address was returned for this member.');
      if(control.signal.aborted)return;
      const member=data.stake_address;
      const saved=savedStorage(member);
      setStake(member);setPreference(saved);setError('');
      if(vaultUnlocked(member)){setReady(true);return;}
      if(saved&&(saved==='remote'||!isPortfolioMobile())){
        setBusy(true);
        try{await switchStorage(saved,member,await wallet(false,member),role,false);if(!control.signal.aborted)setReady(true);}
        catch(e){if(!control.signal.aborted)setError(e instanceof Error?e.message:'Could not open saved Portfolio storage.');}
        finally{if(!control.signal.aborted)setBusy(false);}
      }else if(saved)setSettings(true);
    }).catch(e=>{if(!control.signal.aborted)setError(e.message);});
    return()=>{control.abort();window.removeEventListener('tdsp:portfolio-session-expired',lock);};
  },[]);
  async function apply(mode:StorageMode,copy:boolean){setBusy(true);setError('');try{await new Promise(resolve=>setTimeout(resolve,0));await switchStorage(mode,stake,mode==='remote'?await wallet(true,stake):null,role,copy);setPreference(mode);setReady(true);setSettings(false);setVersion(value=>value+1);}catch(e){setError(e instanceof Error?e.message:'Storage change failed.');setReady(vaultUnlocked(stake));}finally{setBusy(false);}}
  async function remove(mode:StorageMode){setBusy(true);setError('');try{await new Promise(resolve=>setTimeout(resolve,0));await deleteStoredCache(mode,stake);setReady(vaultUnlocked(stake));setVersion(value=>value+1);setError(`${mode==='local'?'Local':'Remote'} cache deleted.`);}catch(e){setReady(vaultUnlocked(stake));setError(e instanceof Error?e.message:'Cache deletion failed.');}finally{setBusy(false);}}
  const choice=<StorageChoice stake={stake} active={ready} busy={busy} error={error} onApply={apply} onDelete={remove}/>;
  if(!stake)return <main className="member-portfolio"><div className="portfolio-body"><h1>Member portfolio</h1><p role="status">{error}</p></div></main>;
  const mode=ready?storageMode():preference;
  const modeLabel=mode==='remote'?'Encrypted remote':'Local browser';
  return <><section className="member-portfolio"><div className="portfolio-body">{ready||preference?<>
    <div className="section-heading"><button type="button" className="governance-vote-secondary" title="Change Portfolio storage" aria-label={`Portfolio storage: ${modeLabel}. Change storage`} disabled={busy} onClick={()=>setSettings(true)}>{mode==='remote'?<Cloud size={16}/>:<HardDrive size={16}/>} {modeLabel}{!ready?' · Locked':''}</button></div>
    {!ready&&!settings&&<WalletConnectBox prompt={mode==='remote'?'Review and approve the wallet message to unlock your encrypted Portfolio cache. This is separate from dashboard sign-in. Never share the signature. No transaction or network fee is created.':'Open your locally saved Portfolio cache.'}>{!(busy&&mode==='remote')&&<div role="status" aria-live="polite"><p>{busy?'Opening local Portfolio cache…':error||'Unlock Portfolio to continue.'}</p></div>}{!busy&&<button type="button" className="governance-vote-primary" onClick={()=>void apply(mode||'local',false)}>Unlock Portfolio</button>}</WalletConnectBox>}
  </>:choice}</div></section>{ready&&!busy&&<Home key={`${stake}:${version}`} memberStake={stake}/>} {(ready||preference)&&settings&&<AssetOverlay id="portfolio-storage-overlay" name="Portfolio storage" onClose={()=>{if(!busy)setSettings(false);}}>{choice}</AssetOverlay>}</>;
}
let portfolioInstance:{role:string;content:HTMLElement;destroy:()=>void}|null=null;
export function mountPortfolio(container:HTMLElement,{role='delegator',getWallet=()=>null}:{role?:'delegator'|'admin';getWallet?:WalletProvider}={}){
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
  window.dispatchEvent(new Event('tdsp:portfolio-shown'));
  // Closing the view must not abort its refresh or session keepalive.
  return ()=>{
    void flushVault().catch(()=>{});
    window.dispatchEvent(new Event('tdsp:portfolio-hidden'));
    instance.content.remove();
  };
}
