import {useEffect,useState} from 'react';
import {Check,Copy} from 'lucide-react';
import {short} from './core';
import {validStakeAddress} from './member';
import {usePortfolioText} from './use-portfolio-text';
import type {AddressNetwork} from './CryptoAddressForm';

export function addressExplorer(network:AddressNetwork,address:string){
  const value=encodeURIComponent(address);
  return network==='ethereum'?`https://etherscan.io/address/${value}`:network==='solana'?`https://solscan.io/account/${value}`:network==='bitcoin'?`https://blockstream.info/address/${value}`:`https://cardanoscan.io/${validStakeAddress(address)?'stakekey':'address'}/${value}`;
}
export function AddressLink({network,address,onError}:{network:AddressNetwork;address:string;onError:(message:string)=>void}){
  const [copied,setCopied]=useState(false),t=usePortfolioText();
  useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),2000);return()=>clearTimeout(timer);},[copied]);
  return <span className="portfolio-address-link" translate="no">
    <a className="address" title={address} href={addressExplorer(network,address)} target="_blank" rel="noreferrer">{short(address)}</a>
    <button type="button" className="governance-vote-secondary" title={t(copied?'Copied.':'Copy address')} aria-label={t('Copy address')} onClick={()=>{
      void (async()=>{try{await navigator.clipboard.writeText(address);setCopied(true);onError('');}catch{onError('Could not copy address.');}})();
    }}>{copied?<Check size={14}/>:<Copy size={14}/>}</button>
  </span>;
}
