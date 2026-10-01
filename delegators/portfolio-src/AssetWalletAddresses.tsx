import {useEffect,useRef} from 'react';
import {short} from './core';

function Address({address}:{address:string}){
  const copy=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const runtime=(window as unknown as {TDSPRuntime:{createCopyButton:(value:string,label:string)=>HTMLButtonElement}}).TDSPRuntime;
    const button=runtime.createCopyButton(address,'wallet address');
    copy.current?.replaceChildren(button);
    return ()=>button.remove();
  },[address]);
  return <div className="small muted governance-action-buttons">
    <a className="address" href={`https://cardanoscan.io/address/${address}`} target="_blank" rel="noreferrer" title={address}>{short(address)}</a>
    <span ref={copy}/>
  </div>;
}

export function AssetWalletAddresses({addresses}:{addresses:string[]}){
  return <>{addresses.map(address=><Address key={address} address={address}/>)}</>;
}
