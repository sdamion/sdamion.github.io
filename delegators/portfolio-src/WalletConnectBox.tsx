import {useLayoutEffect,useRef,useMemo,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

export function WalletConnectBox({prompt,children}:{prompt:string;children:ReactNode}){
  const host=useRef<HTMLDivElement>(null);
  const content=useMemo(()=>document.createElement('div'),[]);
  useLayoutEffect(()=>{
    const runtime=(window as unknown as {TDSPRuntime:{createWalletConnectBox:(options:{prompt:string;content:HTMLElement[]})=>{box:HTMLElement}}}).TDSPRuntime;
    const {box}=runtime.createWalletConnectBox({prompt,content:[content]});
    host.current?.replaceChildren(box);
    return()=>box.remove();
  },[prompt,content]);
  return <div ref={host}>{createPortal(children,content)}</div>;
}
