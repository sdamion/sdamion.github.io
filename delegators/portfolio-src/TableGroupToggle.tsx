import {useState,type ReactNode} from 'react';
import {ChevronDown,ChevronRight} from 'lucide-react';
import {TableRow,TableCell} from './ui';
import {tableGroups} from './table-groups';

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

export function NamedTableGroups<T>({rows,nameOf,columns,renderRow}:{rows:T[];nameOf:(row:T)=>string;columns:number;renderRow:(row:T)=>ReactNode}){
  const {expanded,toggle}=useTableGroups();
  return tableGroups(rows,row=>nameOf(row).trim().toLowerCase()).flatMap(group=>{
    if(group.rows.length===1)return [renderRow(group.rows[0])];
    const name=nameOf(group.rows[0]).trim();
    return [<TableRow key={`name:${group.key}`}>
      <TableCell><TableGroupToggle expanded={expanded.has(group.key)} onToggle={()=>toggle(group.key)} title={name}><span translate="no">{name}</span></TableGroupToggle></TableCell>
      <TableCell translate="no">{group.rows.length}</TableCell>
      {columns>2&&<TableCell colSpan={columns-2}/>}
    </TableRow>,...(expanded.has(group.key)?group.rows.map(renderRow):[])];
  });
}
