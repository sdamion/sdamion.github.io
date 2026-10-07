import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {AssetOverlay} from './AssetOverlay';

const steps=[
  ['Your member wallet','Your delegated stake key is included automatically. Its linked addresses, balances and transactions load in the background while you read this guide.'],
  ['Add your own wallets','Add a stake key or payment address you own to include its balances and transactions. A stake key includes its linked addresses. Your member stake key is already included.'],
  ['Add exchange addresses','Add known DEX / CEX payment addresses or stake keys to identify ADA transfers to and from exchanges. These use your buy/sell rule, not DEX trade decoding. Do not add your own wallets here.'],
  ['Add Swap addresses','Add your internal Swap payment addresses or stake keys so their transfers are excluded from DEX / CEX totals. Shared service balances are not counted as yours. All additional addresses are optional and can be changed later in Wallets.']
];
const keyFor=(stake:string)=>`tdsp-portfolio-setup-v1:${stake}`;
function completed(stake:string){try{return localStorage.getItem(keyFor(stake))==='done';}catch{return false;}}

export function PortfolioQuickstart({stake,status,wallets,exchanges,swap}:{stake:string;status:string;wallets?:ReactNode;exchanges?:ReactNode;swap?:ReactNode}){
  const anchor=useRef<HTMLSpanElement>(null);
  const dismissed=useRef(false);
  const [open,setOpen]=useState(false),[step,setStep]=useState(0),[,setLanguage]=useState(0);
  useEffect(()=>{
    const show=()=>{if(anchor.current?.isConnected&&!dismissed.current&&!completed(stake))setOpen(true);};
    const hide=()=>setOpen(false);
    const language=()=>setLanguage(value=>value+1);
    show();
    window.addEventListener('tdsp:portfolio-shown',show);
    window.addEventListener('tdsp:portfolio-hidden',hide);
    window.addEventListener('tdsp-language-change',language);
    return()=>{
      window.removeEventListener('tdsp:portfolio-shown',show);
      window.removeEventListener('tdsp:portfolio-hidden',hide);
      window.removeEventListener('tdsp-language-change',language);
    };
  },[stake]);
  const close=()=>{
    dismissed.current=true;setOpen(false);
    try{localStorage.setItem(keyFor(stake),'done');}catch{/* Keep dismissal for this session when storage is unavailable. */}
  };
  const t=(text:string)=>(window as unknown as {TDSPI18n?:{translateText:(value:string)=>string}}).TDSPI18n?.translateText(text)||text;
  return <><span ref={anchor} hidden/>{open&&<AssetOverlay id="portfolio-quickstart-overlay" name="Portfolio setup" onClose={close}>
    <section className="portfolio-section governance-markdown">
      <div translate="no">
      <p className="small muted" aria-live="polite">{step+1} / {steps.length}</p>
      <h2>{t(steps[step][0])}</h2>
      <p>{t(steps[step][1])}</p>
      </div>
      {step===1?wallets:step===2?exchanges:step===3?swap:null}
      <div translate="no">
      <p className="small muted" role="status">{t(status)}</p>
      <div className="section-heading">
        <button type="button" className="governance-vote-secondary" onClick={close}>{t('Skip setup')}</button>
        {step>0&&<button type="button" className="governance-vote-secondary" onClick={()=>setStep(value=>value-1)}>{t('Back')}</button>}
        <button type="button" className="governance-vote-primary" onClick={()=>step===steps.length-1?close():setStep(value=>value+1)}>{t(step===steps.length-1?'Open Portfolio':'Next')}</button>
      </div>
      </div>
    </section>
  </AssetOverlay>}</>;
}
