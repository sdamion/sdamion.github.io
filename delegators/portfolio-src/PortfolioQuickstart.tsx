import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {AssetOverlay} from './AssetOverlay';

const steps=[
  ['Your member wallet','Your delegated stake key is included automatically. Its linked addresses, balances and transactions load in the background while you read this guide.'],
  ['Add your own wallets','In My Wallets, add addresses you control, including personal DEX or CEX wallets. Choose the wallet type; their on-chain balances and transactions count as yours. A stake key includes linked payment addresses. Never mark a shared exchange address as your wallet.'],
  ['Mark IN senders and OUT destinations','In DEX / CEX & Swap, save external addresses and mark each as an IN sender, OUT destination, or both. IN requires a transfer to one of your personal wallets. OUT requires a transfer from a personal wallet to an address you marked OUT, even when the sending wallet is your personal DEX/CEX wallet.'],
  ['Add Swap addresses','Keep Swap addresses separate from your personal wallets and IN/OUT counterparties. Internal transfers are excluded from exchange totals. You can change existing address roles later in Wallets; only move an exchange deposit to My Wallets if you control its balance.'],
  ['Review your results','Check Transactions and CEX Transactions after the scan. The same IN/OUT rules apply to ADA, BTC, ETH and SOL. Incomplete or ambiguous transfers stay unverified; blockchain amounts and fees are never changed. EUR/USD values are estimates, not proof of a fiat sale.']
];
const keyFor=(stake:string)=>`tdsp-portfolio-setup-v1:${stake}`;
function completed(stake:string){try{return localStorage.getItem(keyFor(stake))==='done';}catch{return false;}}

export function PortfolioQuickstart({stake,cardano=true,wallets,exchanges,swap}:{stake:string;cardano?:boolean;wallets?:ReactNode;exchanges?:ReactNode;swap?:ReactNode}){
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
  const shownSteps=cardano?steps:steps.slice(1),currentStep=Math.min(step,shownSteps.length-1),originalStep=cardano?currentStep:currentStep+1;
  return <><span ref={anchor} hidden/>{open&&<AssetOverlay id="portfolio-quickstart-overlay" name="Portfolio setup" onClose={close}>
    <section className="portfolio-section governance-markdown">
      <div translate="no">
      <p className="small muted" aria-live="polite">{currentStep+1} / {shownSteps.length}</p>
      <h2>{t(shownSteps[currentStep][0])}</h2>
      <p>{t(shownSteps[currentStep][1])}</p>
      </div>
      {originalStep===1?wallets:originalStep===2?exchanges:originalStep===3?swap:null}
      <div translate="no">
      <div className="section-heading">
        <button type="button" className="governance-vote-secondary" onClick={close}>{t('Skip setup')}</button>
        {step>0&&<button type="button" className="governance-vote-secondary" onClick={()=>setStep(value=>value-1)}>{t('Back')}</button>}
        <button type="button" className="governance-vote-primary" onClick={()=>currentStep===shownSteps.length-1?close():setStep(value=>value+1)}>{t(currentStep===shownSteps.length-1?'Open Portfolio':'Next')}</button>
      </div>
      </div>
    </section>
  </AssetOverlay>}</>;
}
