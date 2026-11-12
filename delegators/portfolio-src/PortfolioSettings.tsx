import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Ellipsis} from 'lucide-react';
import {AssetOverlay} from './AssetOverlay';
import {usePortfolioText} from './use-portfolio-text';

export function PortfolioSettings({onChangeLogin}:{onChangeLogin:()=>Promise<void>}){
  const [host,setHost]=useState<HTMLElement|null>(null),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
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
    setBusy(true);setError('');
    try{await onChangeLogin();setOpen(false);}
    catch(e){setError(e instanceof Error?e.message:'Could not change login.');}
    finally{setBusy(false);}
  }
  const button=<button type="button" className="governance-back-to-root" title={t('Portfolio settings')} aria-label={t('Portfolio settings')} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?'portfolio-settings-overlay':undefined} onClick={()=>{setError('');setOpen(true);}}><Ellipsis size={18} aria-hidden="true"/></button>;
  return <>{host?createPortal(button,host):<div className="member-portfolio section-heading" style={{justifyContent:'flex-end'}}>{button}</div>}
    {open&&<AssetOverlay id="portfolio-settings-overlay" name="Portfolio settings" onClose={()=>{if(!busy)setOpen(false);}}><div className="portfolio-section"><button type="button" className="governance-vote-secondary" disabled={busy} onClick={()=>void changeLogin()}>{t('Change Portfolio login')}</button>{error&&<p role="alert">{error}</p>}</div></AssetOverlay>}
  </>;
}
