import {useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Ellipsis,Eye,Pencil,Trash2} from 'lucide-react';
import {usePortfolioText} from './use-portfolio-text';

export function AddressActions({id,name,onRename,onRemove,onView,removeDisabled=false}:{id:string;name:string;onRename:()=>void;onRemove:()=>void;onView?:()=>void;removeDisabled?:boolean}){
  const [open,setOpen]=useState(false),[position,setPosition]=useState({left:0,top:0}),button=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null),t=usePortfolioText();
  const hasView=!!onView;
  useLayoutEffect(()=>{
    if(!open)return;
    const trigger=button.current!;
    const place=()=>{
      const rect=trigger.getBoundingClientRect(),size=menu.current?.getBoundingClientRect();if(!size)return;
      const left=Math.max(8,Math.min(rect.right-size.width,window.innerWidth-size.width-8)),top=Math.max(8,Math.min(rect.bottom+4,window.innerHeight-size.height-8));
      setPosition(previous=>previous.left===left&&previous.top===top?previous:{left,top});
    };
    place();
    menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const close=()=>setOpen(false);
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!menu.current?.contains(event.target)&&!trigger.contains(event.target))close();};
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();trigger.focus();}
      if(event.key==='Tab')close();
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)&&menu.current?.contains(document.activeElement)){
        event.preventDefault();const items=[...menu.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],index=items.indexOf(document.activeElement as HTMLButtonElement);
        items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
      }
    };
    const scroll=(event:Event)=>{if(!(event.target instanceof Node)||!menu.current?.contains(event.target))place();};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key,true);window.addEventListener('resize',place);document.addEventListener('scroll',scroll,true);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',place);document.removeEventListener('scroll',scroll,true);};
  },[open,hasView]);
  function run(action:()=>void){setOpen(false);button.current?.focus();action();}
  return <><button ref={button} type="button" className="governance-vote-secondary" title={t('Address actions')} aria-label={t('Actions for {name}',{name})} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(value=>!value)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);}}}><Ellipsis size={16}/></button>
    {open&&createPortal(<div ref={menu} id={id} role="menu" aria-label={t('Actions for {name}',{name})} className="portfolio-address-actions-menu" style={position} translate="no">
      {onView&&<button type="button" role="menuitem" className="governance-vote-secondary" onClick={()=>run(onView)}><Eye size={16}/>{t('View')}</button>}
      <button type="button" role="menuitem" className="governance-vote-secondary" onClick={()=>run(onRename)}><Pencil size={16}/>{t('Rename')}</button>
      <button type="button" role="menuitem" className="governance-vote-secondary" disabled={removeDisabled} onClick={()=>run(onRemove)}><Trash2 size={16}/>{t('Remove')}</button>
    </div>,button.current?.closest('.governance-dialog')||document.body)}
  </>;
}
