import {useEffect,useRef,useState} from 'react';
import {authRequest,authenticatePasskey} from './account-auth';

function hasCardanoWallet(){
  const cardano=(window as Window&{cardano?:Record<string,{enable?:unknown;name?:unknown;icon?:unknown;apiVersion?:unknown}>}).cardano;
  return Object.keys(cardano||{}).some(id=>{try{const wallet=cardano![id];return typeof wallet?.enable==='function'&&wallet.name!==undefined&&wallet.icon!==undefined&&wallet.apiVersion!==undefined;}catch{return false;}});
}

export function AccountLogin({onSignedIn,onWallet,walletConnected=false}:{onSignedIn:()=>void;onWallet?:()=>void;walletConnected?:boolean}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[config,setConfig]=useState({passkeys:false});
  const [walletAvailable,setWalletAvailable]=useState(hasCardanoWallet);
  const control=useRef(new AbortController());
  useEffect(()=>{const detect=()=>setWalletAvailable(hasCardanoWallet());window.addEventListener('focus',detect);window.addEventListener('tdsp:portfolio-shown',detect);return()=>{window.removeEventListener('focus',detect);window.removeEventListener('tdsp:portfolio-shown',detect);};},[]);
  useEffect(()=>{const current=control.current;authRequest('config',undefined,'',current.signal).then(setConfig).catch(()=>setError('Account login is unavailable.'));return()=>current.abort();},[]);
  async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(e){if(!control.current.signal.aborted)setError(e instanceof Error?(e.name==='NotAllowedError'?'Passkey request cancelled or timed out. Please retry.':e.name==='InvalidStateError'?'This passkey provider is already registered. Use your existing passkey or choose another provider.':e.message):'Sign-in failed.');}finally{if(!control.current.signal.aborted)setBusy(false);}}
  return <section className="member-portfolio"><div className="portfolio-body"><div className="portfolio-section">
    <h1>Portfolio</h1>
    <p>Track your wallets, assets and transactions across all Portfolio networks.</p>
    <div className="section-heading">
      <button type="button" className="governance-vote-primary" disabled={busy||!config.passkeys} onClick={()=>void run(async()=>{await authenticatePasskey('',undefined,control.current.signal);onSignedIn();})}>{busy?'Waiting for your passkey…':'Sign in with passkey'}</button>
      {onWallet&&walletAvailable&&<button type="button" className="governance-vote-secondary" disabled={busy} onClick={onWallet}>{walletConnected?'Open current wallet Portfolio':'Connect wallet'}</button>}
    </div>
    {walletConnected&&<p>Open your current wallet Portfolio and add a passkey after unlocking its cache.</p>}
    <p className="small muted">{walletConnected?'Use a passkey linked to your current Portfolio, or open the wallet Portfolio to add one.':'To create a passkey for your wallet Portfolio, connect your wallet first, then add a passkey in Portfolio storage settings.'}</p>
    {!config.passkeys&&!busy&&<p className="small muted">Passkey login becomes available when the server is configured.</p>}
    {error&&<p role="alert">{error}</p>}
  </div></div></section>;
}
