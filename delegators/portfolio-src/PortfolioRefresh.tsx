import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {RefreshCw,Info,ChevronDown} from 'lucide-react';
import {PortfolioGuide} from './PortfolioGuide';
import type {ReactNode} from 'react';
import {usePortfolioText} from './use-portfolio-text';

export function PortfolioRefresh({busy,disabled,onRefresh,currencyControl}:{busy:boolean;disabled:boolean;onRefresh:()=>void;currencyControl?:ReactNode}){
  const t=usePortfolioText();
  const syncLabel=t(busy?'Portfolio syncing':'Portfolio not syncing');
  const [host,setHost]=useState<HTMLElement|null>(null);
  const [guide,setGuide]=useState(false);
  useEffect(()=>{
    const show=()=>setHost(document.getElementById('portfolio-refresh-action'));
    const hide=()=>{setHost(null);setGuide(false);};
    show();
    window.addEventListener('tdsp:portfolio-shown',show);
    window.addEventListener('tdsp:portfolio-hidden',hide);
    return()=>{window.removeEventListener('tdsp:portfolio-shown',show);window.removeEventListener('tdsp:portfolio-hidden',hide);};
  },[]);
  return <>{host&&createPortal(<>{currencyControl&&<span className="portfolio-currency-select">{currencyControl}<ChevronDown size={16} aria-hidden="true"/></span>}<button type="button" className="governance-back-to-root" title="Portfolio guide" aria-label="Portfolio guide" onClick={()=>setGuide(true)}><Info size={18} aria-hidden="true"/></button><button type="button" translate="no" className={`governance-back-to-root portfolio-sync-button${busy?' is-syncing':''}`} title={syncLabel} aria-label={`${syncLabel}. ${t('Refresh Portfolio')}`} aria-busy={busy} disabled={disabled} onClick={onRefresh}><RefreshCw size={18} aria-hidden="true"/></button></>,host)}{guide&&<PortfolioGuide onClose={()=>setGuide(false)}/>}</>;
}
