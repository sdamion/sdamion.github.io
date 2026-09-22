import React from 'react';
export function AdaUsdAmount({ada,usd}:{ada:number|null;usd:number|null}){
  const ref=React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(()=>{
    const host=ref.current;if(!host)return;
    host.replaceChildren((window as unknown as {TDSPRuntime:{createAdaUsdAmount:(ada:number|null,usd:number|null)=>HTMLElement}}).TDSPRuntime.createAdaUsdAmount(ada,usd));
  },[ada,usd]);
  return <span ref={ref}/>;
}
export function MenuTile({title,value,onOpen,analysis,loading=false}:{title:string;value:string;onOpen:()=>void;loading?:boolean;analysis?:{done:number;total:number;counting:boolean;busy:boolean}}){
  const ref=React.useRef<HTMLButtonElement>(null);
  React.useLayoutEffect(()=>{
    const button=ref.current;if(!button)return;
    button.replaceChildren();
    (window as unknown as {TDSPRuntime:{appendUniversalTileContent:(node:HTMLElement,options:Record<string,unknown>)=>void}}).TDSPRuntime.appendUniversalTileContent(button,{title,primaryText:value});
    if(loading){
      const progress=document.createElement('progress');
      progress.setAttribute('aria-label','Initialising');
      progress.style.width='100%';
      button.append(progress);
    }
    if(analysis){
      const {done,total,counting,busy}=analysis;
      const percent=total>0?Math.min(100,done/total*100):0;
      const label=document.createElement('span');label.className='tdsp-bar-legend';
      label.textContent=counting?`${done.toLocaleString()} analysed · counting transactions…`:`${done.toLocaleString()} of ${total.toLocaleString()} ${busy?'analysing':'analysed'}`;
      const row=document.createElement('span');row.className='section-heading';row.style.width='100%';
      const track=document.createElement('span');track.className='governance-vote-bar-track';track.style.flex='1';
      track.setAttribute('role','progressbar');track.setAttribute('aria-label','Transactions analysed');
      track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
      track.setAttribute('aria-valuetext',label.textContent);
      if(!counting)track.setAttribute('aria-valuenow',String(percent));
      const fill=document.createElement('span');fill.className='governance-vote-bar-fill governance-vote-bar-fill--yes';fill.style.flexBasis=`${counting?0:percent}%`;track.append(fill);
      const percentage=document.createElement('span');percentage.className='tdsp-bar-legend';percentage.textContent=counting?'…':`${percent.toLocaleString(undefined,{maximumFractionDigits:1})}%`;
      row.append(track,percentage);button.append(label,row);
    }
  },[title,value,loading,analysis?.done,analysis?.total,analysis?.counting,analysis?.busy]);
  return <button ref={ref} type="button" className="governance-card governance-menu-card" onClick={onOpen} aria-label={`Open ${title}`} aria-busy={loading}/>;
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
