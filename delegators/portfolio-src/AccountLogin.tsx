import {useEffect,useRef,useState} from 'react';
import {authRequest,signInWithX,registerPasskey,authenticatePasskey} from './account-auth';

export function AccountLogin({onSignedIn,onWallet}:{onSignedIn:()=>void;onWallet?:()=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[setup,setSetup]=useState<any>(null),[config,setConfig]=useState({x:false,passkeys:false});
  const control=useRef(new AbortController());
  useEffect(()=>{const current=control.current;authRequest('config',undefined,'',current.signal).then(setConfig).catch(()=>setError('Account login is unavailable. You can still connect a wallet.'));return()=>current.abort();},[]);
  async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(e){if(!control.current.signal.aborted)setError(e instanceof Error?(e.name==='NotAllowedError'?'Passkey request cancelled or timed out. Please retry.':e.name==='InvalidStateError'?'This passkey provider is already registered. Use your existing passkey or choose another provider.':e.message):'Sign-in failed.');}finally{if(!control.current.signal.aborted)setBusy(false);}}
  return <section className="member-portfolio"><div className="portfolio-body"><div className="portfolio-section">
    <h1>Portfolio</h1>
    <p>Track your wallets, assets and transactions across all Portfolio networks.</p>
    {setup?<>
      <h2 translate="no">@{setup.username}</h2>
      <p>{setup.has_passkeys?'Use your existing passkey to unlock your encrypted Portfolio.':'Create a passkey to protect and unlock your Portfolio. You can then sign in directly with that passkey.'}</p>
      <button type="button" className="governance-vote-primary" disabled={busy} onClick={()=>void run(async()=>{const credential=setup.has_passkeys?undefined:await registerPasskey(setup.token,control.current.signal);if(credential)setSetup({...setup,has_passkeys:true});await authenticatePasskey(setup.token,credential,control.current.signal);onSignedIn();})}>{busy?'Waiting for your passkey…':setup.has_passkeys?'Continue with passkey':'Create passkey & open Portfolio'}</button>
      <button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>setSetup(null)}>Back</button>
    </>:<div className="section-heading">
      <button type="button" className="governance-vote-primary" disabled={busy||!config.x} onClick={()=>void run(async()=>setSetup(await signInWithX(control.current.signal)))}>{busy?'Signing in…':'Continue with X'}</button>
      <button type="button" className="governance-vote-secondary" disabled={busy||!config.passkeys} onClick={()=>void run(async()=>{await authenticatePasskey('',undefined,control.current.signal);onSignedIn();})}>Sign in with passkey</button>
      {onWallet&&<button type="button" className="governance-vote-secondary" disabled={busy} onClick={onWallet}>Connect wallet</button>}
    </div>}
    <p className="small muted">Your passkey encrypts Portfolio data in your browser. Keep access to the original synced passkey; X login alone cannot recover encrypted data. Wallet login remains available for your existing wallet Portfolio.</p>
    {!config.x&&!busy&&<p className="small muted">X login becomes available when the server is configured.</p>}
    {error&&<p role="alert">{error}</p>}
  </div></div></section>;
}
