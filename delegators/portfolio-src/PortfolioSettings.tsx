import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Cloud,Ellipsis,HardDrive} from 'lucide-react';
import type {StorageMode} from './vault';
import {AssetOverlay} from './AssetOverlay';
import {usePortfolioText} from './use-portfolio-text';

export function PortfolioSettings({onChangeLogin,onStorage,mode,locked=false,onAddPasskey,disabled=false}:{onChangeLogin:()=>Promise<void>;onStorage?:()=>void;mode?:StorageMode|null;locked?:boolean;onAddPasskey?:()=>void;disabled?:boolean}){
  const [host,setHost]=useState<HTMLElement|null>(null),[open,setOpen]=useState(false),[changingLogin,setChangingLogin]=useState(false),[error,setError]=useState('');
  const trigger=useRef<HTMLButtonElement>(null);
  const busy=changingLogin||disabled;
  const modeLabel=mode==='remote'?'Encrypted remote':'Local browser';
  const t=usePortfolioText();
  useEffect(()=>{
    const show=()=>setHost(document.getElementById('portfolio-settings-action'));
    const hide=()=>{setHost(null);setOpen(false);};
    show();
    window.addEventListener('tdsp:portfolio-shown',show);
    window.addEventListener('tdsp:portfolio-hidden',hide);
    return()=>{window.removeEventListener('tdsp:portfolio-shown',show);window.removeEventListener('tdsp:portfolio-hidden',hide);};
  },[]);
  async function changeLogin(){
    setChangingLogin(true);setError('');
    try{await onChangeLogin();setOpen(false);}
    catch(e){setError(e instanceof Error?e.message:'Could not change login.');}
    finally{setChangingLogin(false);}
  }
  function select(action:()=>void){setOpen(false);trigger.current?.focus();action();}
  const button=<button ref={trigger} type="button" className="governance-back-to-root" title={t('Portfolio settings')} aria-label={t('Portfolio settings')} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?'portfolio-settings-overlay':undefined} onClick={()=>{setError('');setOpen(true);}}><Ellipsis size={18} aria-hidden="true"/></button>;
  return <>{host?createPortal(button,host):<div className="member-portfolio section-heading" style={{justifyContent:'flex-end'}}>{button}</div>}
    {open&&<AssetOverlay id="portfolio-settings-overlay" name="Portfolio settings" onClose={()=>{if(!busy)setOpen(false);}}><div className="portfolio-section">
      {onStorage&&<button type="button" className="governance-vote-secondary" title={t('Change Portfolio storage')} aria-label={t(`Portfolio storage: ${modeLabel}. Change storage`)} disabled={busy} onClick={()=>select(onStorage)}>{mode==='remote'?<Cloud size={16}/>:<HardDrive size={16}/>} {t(modeLabel)}{locked?' · '+t('Locked'):''}</button>}
      {onAddPasskey&&<button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>select(onAddPasskey)}>{t('Add passkey to current Portfolio')}</button>}
      <button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>void changeLogin()}>{t('Change Portfolio login')}</button>{error&&<p role="alert">{error}</p>}
    </div></AssetOverlay>}
  </>;
}
