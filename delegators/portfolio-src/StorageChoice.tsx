import {useState} from 'react';
import {preferredStorage,storageMode,isPortfolioMobile} from './vault';
import type {StorageMode} from './vault';
import {CacheUploadProgress} from './CacheUploadProgress';

export function StorageChoice({stake,active,busy,error,onApply,onDelete}:{stake:string;active:boolean;busy:boolean;error:string;onApply:(mode:StorageMode,copy:boolean)=>void;onDelete:(mode:StorageMode)=>void}){
  const mobile=isPortfolioMobile();
  const [mode,setMode]=useState<StorageMode>(mobile?'remote':storageMode()||preferredStorage(stake)),[copy,setCopy]=useState(false),[deleting,setDeleting]=useState<StorageMode|null>(null);
  return <section className="portfolio-section">
    <h2>Portfolio storage</h2>
    <fieldset disabled={busy} className="portfolio-section"><legend>Where should Portfolio save your data?</legend>
      <label><input type="radio" name="portfolio-storage" value="local" disabled={mobile} checked={mode==='local'} onChange={()=>setMode('local')}/> Local browser · desktop only</label>
      <p className="small muted">Available on desktop computers, including small browser windows. Not available on phones or tablets. Saved only in this browser. No extra wallet approval or Portfolio cache upload. This copy is not wallet-encrypted; anyone with access to this browser may read it. It is unavailable on other devices and can be lost when browser data is cleared. Expired local data is removed on the next visit after seven days of inactivity.</p>
      <label><input type="radio" name="portfolio-storage" value="remote" checked={mode==='remote'} onChange={()=>setMode('remote')}/> Encrypted remote cache</label>
      <p className="small muted">Available on desktop, phones and tablets with a compatible wallet. Requires a separate wallet message approval, not a transaction or fee. Your browser encrypts data with AES-256-GCM before upload. The private signature and derived key never go to the backend. Sign in with the same stake account and compatible wallet to unlock it on another device. No admin recovery. The server deletes inactive caches after seven days; background refresh does not extend this.</p>
      <p className="small muted">Both modes still use the backend to fetch public blockchain and price data. Encryption protects the stored remote cache, not against malicious website code or browser extensions while unlocked.</p>
      {active&&<label><input type="checkbox" name="portfolio-copy-storage" checked={copy} onChange={event=>setCopy(event.target.checked)}/> Copy the currently loaded Portfolio to the selected location, replacing its existing cache.</label>}
      <p className="small muted">Without copying, the selected location loads its own saved data. Switching does not delete the other copy.</p>
      <button type="button" className="governance-vote-primary" onClick={()=>onApply(mode,copy)}>{busy?'Updating storage…':active?'Apply storage choice':'Open Portfolio'}</button>
      <div className="section-heading"><button type="button" className="governance-vote-secondary" onClick={()=>setDeleting('local')}>Delete local cache</button><button type="button" className="governance-vote-secondary" onClick={()=>setDeleting('remote')}>Delete remote cache</button></div>
      {deleting&&<div className="portfolio-section"><p>Delete the {deleting} Portfolio cache for this member? Saved wallets, exchange labels, manual prices and analysis in that copy will be removed. Blockchain transactions and the other storage location are not affected.</p><div className="section-heading"><button type="button" className="governance-vote-primary" onClick={()=>{onDelete(deleting);setDeleting(null);}}>Confirm deletion</button><button type="button" className="governance-vote-secondary" onClick={()=>setDeleting(null)}>Cancel</button></div></div>}
    </fieldset>
    {busy&&mode==='remote'&&<CacheUploadProgress/>}
    {error&&<p role="status">{error}</p>}
  </section>;
}
