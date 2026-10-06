import {useState,type ReactNode} from 'react';
import {ChevronDown,ChevronRight} from 'lucide-react';

export function useTableGroups(){
  const [expanded,setExpanded]=useState<Set<string>>(()=>new Set());
  function toggle(key:string){setExpanded(previous=>{
    const next=new Set(previous);
    if(next.has(key))next.delete(key);else next.add(key);
    return next;
  });}
  return {expanded,toggle,reset:()=>setExpanded(new Set())};
}

export function TableGroupToggle({expanded,onToggle,title,children}:{expanded:boolean;onToggle:()=>void;title:string;children:ReactNode}){
  const Icon=expanded?ChevronDown:ChevronRight;
  return <button type="button" className="governance-vote-secondary portfolio-asset-button" aria-expanded={expanded} title={title} onClick={onToggle}><Icon size={16} aria-hidden="true"/>{children}</button>;
}
