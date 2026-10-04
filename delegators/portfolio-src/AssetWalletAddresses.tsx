import {useEffect,useRef,useState} from 'react';
import {short} from './core';
import {AssetOverlay} from './AssetOverlay';

function Address({address}:{address:string}){
  const copy=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const runtime=(window as unknown as {TDSPRuntime:{createCopyButton:(value:string,label:string)=>HTMLButtonElement}}).TDSPRuntime;
    const button=runtime.createCopyButton(address,'wallet address');
    copy.current?.replaceChildren(button);
    return ()=>button.remove();
  },[address]);
  return <div className="small muted portfolio-asset-address-row">
    <a className="address" href={`https://cardanoscan.io/address/${address}`} target="_blank" rel="noreferrer" title={address}>{short(address)}</a>
    <span ref={copy}/>
  </div>;
}

export function AssetWalletAddresses({addresses,compact=false,names=[]}:{addresses:string[];compact?:boolean;names?:string[]}){
  const [open,setOpen]=useState(false);
  if(compact)return <>{addresses.length>0&&<button type="button" className="governance-vote-secondary" onClick={()=>setOpen(true)}>{addresses.length} {addresses.length===1?'wallet address':'wallet addresses'}</button>}{open&&<AssetOverlay id="portfolio-asset-wallets-overlay" name="Wallet addresses" onClose={()=>setOpen(false)}><p className="small muted">{names.join(' · ')}</p>{addresses.map(address=><Address key={address} address={address}/>)}</AssetOverlay>}</>;
  return <>{addresses.map(address=><Address key={address} address={address}/>)}</>;
}
