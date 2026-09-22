import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';

type OverlayHost = Window & {
  createUniversalOverlay: (options: Record<string,unknown>)=>{overlay:HTMLElement};
  syncGovernanceMenuOverlayAccessibility?: ()=>void;
};

export function AssetOverlay({name,onClose,children}:{name:string;onClose:()=>void;children:ReactNode}){
  const [body,setBody]=useState<HTMLElement|null>(null);
  const closeRef=useRef(onClose);
  closeRef.current=onClose;
  useEffect(()=>{
    const host=window as unknown as OverlayHost;
    const content=document.createElement('div');
    content.className='member-portfolio-host';
    const returnFocus=document.activeElement as HTMLElement|null;
    const elements=host.createUniversalOverlay({
      id:'portfolio-asset-overlay',titleId:'portfolio-asset-title',titleText:name,
      closeLabel:'Close asset details',closeOverlay:()=>closeRef.current(),
      bodyNodes:[content],returnFocus,enableSearch:false,closeOnBackdrop:false,
      showClose:false,showBack:true
    });
    setBody(content);
    return ()=>{
      elements.overlay.remove();
      host.syncGovernanceMenuOverlayAccessibility?.();
      if(returnFocus?.isConnected)returnFocus.focus();
    };
  },[name]);
  return body?createPortal(children,body):null;
}
