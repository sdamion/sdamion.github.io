import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {RefreshCw} from 'lucide-react';

export function PortfolioRefresh({busy,disabled,onRefresh}:{busy:boolean;disabled:boolean;onRefresh:()=>void}){
  const [host,setHost]=useState<HTMLElement|null>(null);
  useEffect(()=>{
    const show=()=>setHost(document.getElementById('portfolio-refresh-action'));
    const hide=()=>setHost(null);
    show();
    window.addEventListener('tdsp:portfolio-shown',show);
    window.addEventListener('tdsp:portfolio-hidden',hide);
    return()=>{window.removeEventListener('tdsp:portfolio-shown',show);window.removeEventListener('tdsp:portfolio-hidden',hide);};
  },[]);
  return host?createPortal(<button type="button" className="governance-back-to-root" title="Refresh Portfolio" aria-label="Refresh Portfolio" aria-busy={busy} disabled={disabled} onClick={onRefresh}><RefreshCw size={18} aria-hidden="true" className={busy?'animate-spin':''}/></button>,host):null;
}
