import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';

type OverlayHost = Window & {
  createUniversalOverlay: (options: Record<string,unknown>)=>{overlay:HTMLElement};
  syncGovernanceMenuOverlayAccessibility?: ()=>void;
};

export function AssetOverlay({name,onClose,children,id='portfolio-asset-overlay'}:{name:string;onClose:()=>void;children:ReactNode;id?:string}){
  const [body,setBody]=useState<HTMLElement|null>(null);
  const closeRef=useRef(onClose);
  closeRef.current=onClose;
  useEffect(()=>{
    const host=window as unknown as OverlayHost;
    const content=document.createElement('div');
    content.className='member-portfolio-host member-portfolio';
    const returnFocus=document.activeElement as HTMLElement|null;
    const elements=host.createUniversalOverlay({
      id,titleId:`${id}-title`,titleText:name,
      dialogClass:['portfolio-holdings-overlay','portfolio-transactions-overlay'].includes(id)?'governance-dialog-wide':'governance-drep-dialog',
      closeLabel:`Back from ${name}`,closeOverlay:()=>closeRef.current(),
      bodyNodes:[content],returnFocus,enableSearch:false,closeOnBackdrop:false,
      showClose:false,showBack:true
    });
    setBody(content);
    return ()=>{
      elements.overlay.remove();
      host.syncGovernanceMenuOverlayAccessibility?.();
      if(returnFocus?.isConnected)returnFocus.focus();
    };
  },[name,id]);
  return body?createPortal(children,body):null;
}
