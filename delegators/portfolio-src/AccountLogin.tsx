import {useEffect,useRef,useState} from 'react';
import {authRequest,registerPasskey,authenticatePasskey} from './account-auth';

export function AccountLogin({onSignedIn,onWallet,walletConnected=false}:{onSignedIn:()=>void;onWallet?:()=>void;walletConnected?:boolean}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[enrollment,setEnrollment]=useState<{token:string;credentialID:string}|null>(null),[config,setConfig]=useState({passkeys:false});
  const control=useRef(new AbortController());
  useEffect(()=>{const current=control.current;authRequest('config',undefined,'',current.signal).then(setConfig).catch(()=>setError('Account login is unavailable. You can still connect a wallet.'));return()=>current.abort();},[]);
  async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(e){if(!control.current.signal.aborted)setError(e instanceof Error?(e.name==='NotAllowedError'?'Passkey request cancelled or timed out. Please retry.':e.name==='InvalidStateError'?'This passkey provider is already registered. Use your existing passkey or choose another provider.':e.message):'Sign-in failed.');}finally{if(!control.current.signal.aborted)setBusy(false);}}
  return <section className="member-portfolio"><div className="portfolio-body"><div className="portfolio-section">
    <h1>Portfolio</h1>
    <p>Track your wallets, assets and transactions across all Portfolio networks.</p>
    <div className="section-heading">
      <button type="button" className="governance-vote-primary" disabled={busy||!config.passkeys} onClick={()=>void run(async()=>{await authenticatePasskey('',undefined,control.current.signal);onSignedIn();})}>{busy?'Waiting for your passkey…':'Sign in with passkey'}</button>
      {!walletConnected&&<button type="button" className="governance-vote-secondary" disabled={busy||!config.passkeys} onClick={()=>void run(async()=>{const created=enrollment||await registerPasskey('',control.current.signal);setEnrollment(created);await authenticatePasskey(created.token,created.credentialID,control.current.signal);onSignedIn();})}>{enrollment?'Continue with passkey':'Create passkey & open Portfolio'}</button>}
      {onWallet&&<button type="button" className="governance-vote-secondary" disabled={busy} onClick={onWallet}>{walletConnected?'Open current wallet Portfolio':'Connect wallet'}</button>}
    </div>
    {walletConnected&&<p>Open your current wallet Portfolio and add a passkey after unlocking its cache.</p>}
    <p className="small muted">{walletConnected?'Use a passkey linked to your current Portfolio, or open the wallet Portfolio to add one.':'Your passkey creates your account and encrypts Portfolio data in your browser. Keep access to your original synced passkey or a linked backup passkey. Wallet login remains available for your existing wallet Portfolio.'}</p>
    {!config.passkeys&&!busy&&<p className="small muted">Passkey login becomes available when the server is configured.</p>}
    {error&&<p role="alert">{error}</p>}
  </div></div></section>;
}
