import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from './App';
import {portfolioFetch,setSessionRole,sessionToken} from './transport';
import {AccountLogin} from './AccountLogin';
import {PortfolioSettings} from './PortfolioSettings';
import {ACCOUNT_SESSION_KEY,clearAccountKey,hasAccountKey,signOutAccount,registerPasskey,authenticatePasskey,authRequest} from './account-auth';
import {isAccountOwner} from './identity';
import {validStakeAddress} from './member';
import {vaultUnlocked,lockVault,flushVault,switchStorage,deleteStoredCache,savedStorage,storageMode,isPortfolioMobile,linkPortfolioWallet,linkedWalletCount,walletLinkGeneration} from './vault';
import type {SigningWallet,StorageMode} from './vault';
import {StorageChoice} from './StorageChoice';
import {AssetOverlay} from './AssetOverlay';
import {WalletConnectBox} from './WalletConnectBox';
export {unlockPortfolio,vaultUnlocked} from './vault';
type WalletProvider=(reconnect?:boolean,stake?:string,linkAnother?:boolean)=>SigningWallet|null|Promise<SigningWallet|null>;
function MemberPortfolio({wallet,role,onChangeLogin}:{wallet:WalletProvider;role:'delegator'|'admin';onChangeLogin:()=>Promise<void>}){
  const account=!!sessionStorage.getItem(ACCOUNT_SESSION_KEY);
  const [stake,setStake]=useState(''),[error,setError]=useState('Verifying your Portfolio session…');
  const [ready,setReady]=useState(false),[settings,setSettings]=useState(false),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
  const [preference,setPreference]=useState<StorageMode|null>(null);
  const [portfolioAccess,setPortfolioAccess]=useState({cardano:true,ethereum:false,robinhood:false,solana:false,bitcoin:false});
  useEffect(()=>{
    const control=new AbortController();
    const lock=()=>{control.abort();setStake('');setError('Your wallet session has ended. Close Portfolio and reconnect in the members area.');};
    window.addEventListener('tdsp:portfolio-session-expired',lock);
    portfolioFetch('/session',{signal:control.signal}).then(async r=>{
      if(!r.ok)throw new Error(r.status===404?'The TDSP backend needs the portfolio update before this tool can load.':'Connect your wallet in the members area first.');
      const data=await r.json() as {member_id?:string;stake_address?:string;portfolio_access?:{cardano?:boolean;ethereum?:boolean;robinhood?:boolean;solana?:boolean;bitcoin?:boolean}};
      const member=data.member_id||data.stake_address;
      if(!member||!validStakeAddress(member)&&!isAccountOwner(member))throw new Error('No verified Portfolio identity was returned.');
      if(control.signal.aborted)return;
      setPortfolioAccess({cardano:data.portfolio_access?.cardano!==false,ethereum:data.portfolio_access?.ethereum===true,robinhood:data.portfolio_access?.robinhood===true,solana:data.portfolio_access?.solana===true,bitcoin:data.portfolio_access?.bitcoin===true});
      const saved=savedStorage(member);
      setStake(member);setPreference(saved);setError('');
      if(vaultUnlocked(member)){setReady(true);return;}
      if(saved&&(saved==='remote'||!isPortfolioMobile())){
        setBusy(true);
        try{await switchStorage(saved,member,account?null:await wallet(false,member),role,false);if(!control.signal.aborted)setReady(true);}
        catch(e){if(!control.signal.aborted)setError(e instanceof Error?e.message:'Could not open saved Portfolio storage.');}
        finally{if(!control.signal.aborted)setBusy(false);}
      }else if(saved)setSettings(true);
    }).catch(e=>{if(!control.signal.aborted)setError(e.message);});
    return()=>{control.abort();window.removeEventListener('tdsp:portfolio-session-expired',lock);};
  },[]);
  useEffect(()=>{
    if(!stake)return;
    const control=new AbortController();let pending=false;
    const timer=setInterval(async()=>{
      if(pending)return;pending=true;
      try{
        const response=await portfolioFetch('/session',{signal:control.signal});
        if(!response.ok)return;
        const data=await response.json();
        if(!control.signal.aborted&&(data.member_id||data.stake_address)===stake)setPortfolioAccess({cardano:data.portfolio_access?.cardano!==false,ethereum:data.portfolio_access?.ethereum===true,robinhood:data.portfolio_access?.robinhood===true,solana:data.portfolio_access?.solana===true,bitcoin:data.portfolio_access?.bitcoin===true});
      }catch{/* Backend authorization remains authoritative during transient failures. */}finally{pending=false;}
    },60000);
    return()=>{clearInterval(timer);control.abort();};
  },[stake]);
  async function apply(mode:StorageMode,copy:boolean){setBusy(true);setError('');try{await new Promise(resolve=>setTimeout(resolve,0));await switchStorage(mode,stake,account?null:await wallet(true,stake),role,copy);setPreference(mode);setReady(true);setSettings(false);setVersion(value=>value+1);}catch(e){setError(e instanceof Error?e.message:'Storage change failed.');setReady(vaultUnlocked(stake));}finally{setBusy(false);}}
  async function remove(mode:StorageMode){setBusy(true);setError('');try{await new Promise(resolve=>setTimeout(resolve,0));await deleteStoredCache(mode,stake);setReady(vaultUnlocked(stake));setVersion(value=>value+1);setError(`${mode==='local'?'Local':'Remote'} cache deleted.`);}catch(e){setReady(vaultUnlocked(stake));setError(e instanceof Error?e.message:'Cache deletion failed.');}finally{setBusy(false);}}
  async function linkWallet(){const generation=walletLinkGeneration();setBusy(true);setError('');try{const selected=await wallet(true,stake,true);if(!selected)throw new Error('Wallet connection cancelled.');const changed=await linkPortfolioWallet(selected,stake,generation);setError(changed?'Wallet app linked. It can now unlock this saved Portfolio.':'This wallet app can already unlock this Portfolio.');}catch(e){setError(e instanceof Error?e.message:'Wallet app link could not be confirmed. Keep this page open and retry saving.');}finally{setReady(vaultUnlocked(stake));setBusy(false);}}
  async function addPasskey(existing=false){
    const generation=walletLinkGeneration();setBusy(true);setError('');let proof:any;
    try{
      await flushVault();
      const token=sessionToken();
      const enrollment=existing?{token,credentialID:undefined}:await registerPasskey(token);
      proof=await authenticatePasskey(enrollment.token,enrollment.credentialID,undefined,{save:false});
      if(proof.member_id!==stake)throw new Error('Wrong Portfolio account.');
      await linkPortfolioWallet(null,stake,generation,proof.key);
      setError('Passkey linked to this storage location. Link it to your other storage location separately if you use both.');
    }catch(e){setError(e instanceof Error?e.message:'Passkey could not be linked.');}
    finally{if(proof?.token)void authRequest('logout',{},proof.token).catch(()=>{});setReady(vaultUnlocked(stake));setBusy(false);}
  }
  const choice=<><StorageChoice stake={stake} active={ready} busy={busy} error={error} onApply={apply} onDelete={remove} onLink={validStakeAddress(stake)?linkWallet:undefined} linkedApps={linkedWalletCount()} account={account}/>{ready&&<div className="portfolio-section"><p>Link a passkey to this Portfolio and its current encrypted cache. Your stake identity, wallets and saved analysis stay together.</p><div className="section-heading"><button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>void addPasskey()}>{account?'Add another passkey':'Add passkey to current Portfolio'}</button><button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>void addPasskey(true)}>Link existing Portfolio passkey</button></div></div>}</>;
  const mode=ready?storageMode():preference;
  const menu=<PortfolioSettings onChangeLogin={onChangeLogin} onStorage={stake&&(ready||preference)?()=>setSettings(true):undefined} mode={mode} locked={!ready} disabled={busy} onAddPasskey={ready&&!account?()=>{setSettings(true);void addPasskey();}:undefined}/>;
  if(!stake)return <>{menu}<main className="member-portfolio"><div className="portfolio-body"><h1>Member portfolio</h1><p role="status">{error}</p></div></main></>;
  const hasNetwork=role==='admin'||Object.values(portfolioAccess).some(Boolean);
  return <>{menu}{!ready&&<section className="member-portfolio"><div className="portfolio-body">{preference?<>
    {!ready&&!settings&&<WalletConnectBox prompt={account?'Open your encrypted Portfolio with the passkey you approved at sign-in.':'Review and approve the wallet message to unlock your encrypted Portfolio cache. This is separate from dashboard sign-in. Never share the signature. No transaction or network fee is created.'}>{!busy&&<div role="status" aria-live="polite"><p>{error||'Unlock Portfolio to continue.'}</p></div>}{!busy&&<button type="button" className="governance-vote-primary" onClick={()=>void apply(mode||'local',false)}>Unlock Portfolio</button>}</WalletConnectBox>}
    </>:choice}</div></section>}{ready&&!busy&&(hasNetwork?<Home key={`${stake}:${version}:${Object.values(portfolioAccess).join(':')}`} memberStake={stake} role={role} portfolioAccess={portfolioAccess}/>:<main className="member-portfolio"><div className="portfolio-body"><p role="status">No Portfolio networks are enabled for this account.</p></div></main>)} {(ready||preference)&&settings&&<AssetOverlay id="portfolio-storage-overlay" name="Portfolio storage" onClose={()=>{if(!busy)setSettings(false);}}>{choice}</AssetOverlay>}</>;
}
let portfolioInstance:{role:string;content:HTMLElement;destroy:()=>void}|null=null;
export async function signInPortfolioWithPasskey(){
  await flushVault();
  portfolioInstance?.destroy();
  lockVault();
  return authenticatePasskey();
}
function PortfolioGate({wallet,role,onWallet}:{wallet:WalletProvider;role:'delegator'|'admin';onWallet?:()=>void}){
  const [signedIn,setSignedIn]=useState(()=>!!sessionToken()&&(!sessionStorage.getItem(ACCOUNT_SESSION_KEY)||hasAccountKey()));
  useEffect(()=>{const lock=()=>{clearAccountKey();sessionStorage.removeItem(ACCOUNT_SESSION_KEY);setSignedIn(false);};const shown=()=>setSignedIn(!!sessionToken()&&(!sessionStorage.getItem(ACCOUNT_SESSION_KEY)||hasAccountKey()));window.addEventListener('tdsp:portfolio-session-expired',lock);window.addEventListener('tdsp:portfolio-shown',shown);return()=>{window.removeEventListener('tdsp:portfolio-session-expired',lock);window.removeEventListener('tdsp:portfolio-shown',shown);};},[]);
  function chooseWallet(){const token=sessionStorage.getItem(ACCOUNT_SESSION_KEY);clearAccountKey();sessionStorage.removeItem(ACCOUNT_SESSION_KEY);if(token)void authRequest('logout',{},token).catch(()=>{});if(sessionStorage.getItem('tdsp-raffle-session-'+role))setSignedIn(true);else onWallet?.();}
  if(!signedIn)return <AccountLogin walletConnected={!!sessionStorage.getItem('tdsp-raffle-session-'+role)} onSignedIn={()=>setSignedIn(true)} onWallet={onWallet||sessionStorage.getItem('tdsp-raffle-session-'+role)?chooseWallet:undefined}/>;
  const account=!!sessionStorage.getItem(ACCOUNT_SESSION_KEY);
  return <MemberPortfolio wallet={wallet} role={role} onChangeLogin={async()=>{await flushVault();if(account)await signOutAccount();else{lockVault();setSignedIn(false);}}}/>;
}
export function mountPortfolio(container:HTMLElement,{role='delegator',getWallet=()=>null,connectWallet}:{role?:'delegator'|'admin';getWallet?:WalletProvider;connectWallet?:()=>void}={}){
  if(portfolioInstance&&portfolioInstance.role!==role)portfolioInstance.destroy();
  setSessionRole(role);
  if(!portfolioInstance){
    const content=document.createElement('div');
    const root=createRoot(content);
    const instance={role,content,destroy:()=>{
      root.unmount();content.remove();
      if(portfolioInstance===instance)portfolioInstance=null;
    }};
    portfolioInstance=instance;
    root.render(<PortfolioGate wallet={getWallet} role={role} onWallet={connectWallet}/>);
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
