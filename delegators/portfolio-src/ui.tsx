import React from 'react';
export function MenuTile({title,value,onOpen}:{title:string;value:string;onOpen:()=>void}){
  const ref=React.useRef<HTMLButtonElement>(null);
  React.useLayoutEffect(()=>{
    const button=ref.current;if(!button)return;
    button.replaceChildren();
    (window as unknown as {TDSPRuntime:{appendUniversalTileContent:(node:HTMLElement,options:Record<string,unknown>)=>void}}).TDSPRuntime.appendUniversalTileContent(button,{title,primaryText:value});
  },[title,value]);
  return <button ref={ref} type="button" className="governance-card governance-menu-card" onClick={onOpen} aria-label={`Open ${title}`}/>;
}
export const Input=(props:React.ComponentProps<'input'>)=><input {...props}/>;
export const Table=(props:React.ComponentProps<'table'>)=><div className="table-shell" data-slot="table-container"><table {...props}/></div>;
export const TableHeader=(props:React.ComponentProps<'thead'>)=><thead {...props}/>;
export const TableBody=(props:React.ComponentProps<'tbody'>)=><tbody {...props}/>;
export const TableRow=(props:React.ComponentProps<'tr'>)=><tr {...props}/>;
export const TableHead=(props:React.ComponentProps<'th'>)=><th {...props}/>;
export const TableCell=(props:React.ComponentProps<'td'>)=><td {...props}/>;
export const Pagination=(props:React.ComponentProps<'nav'>)=><nav aria-label="pagination" {...props}/>;
export const PaginationContent=(props:React.ComponentProps<'ul'>)=><ul {...props} className="governance-action-buttons"/>;
export const PaginationItem=(props:React.ComponentProps<'li'>)=><li {...props}/>;
