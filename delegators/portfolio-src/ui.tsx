import React from 'react';
import {createPortal} from 'react-dom';
import {usePortfolioCurrency,formatPortfolioUsd,formatPortfolioAda} from './portfolio-currency';
export function AdaUsdAmount({ada,usd}:{ada:number|null;usd:number|null}){
  const display=usePortfolioCurrency();
  const ref=React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(()=>{
    const host=ref.current;if(!host)return;
    host.replaceChildren((window as unknown as {TDSPRuntime:{createAdaUsdAmount:(ada:number|null,usd:number|null)=>HTMLElement}}).TDSPRuntime.createAdaUsdAmount(ada,usd));
  },[ada,usd,display]);
  return display?<span translate="no">{display.currency==='ADA'?formatPortfolioAda(ada,display):formatPortfolioUsd(usd,display)}</span>:<span ref={ref}/>;
}
export function MenuTile({title,value,onOpen,analysis,loading=false,loadingLabel='Initialising',children}:{title:string;value:string;onOpen:()=>void;loading?:boolean;loadingLabel?:string;analysis?:{done:number;total:number;counting:boolean;busy:boolean;status?:string};children?:React.ReactNode}){
  const ref=React.useRef<HTMLDivElement>(null);
  const footer=React.useMemo(()=>document.createElement('div'),[]);
  React.useLayoutEffect(()=>{
    const button=ref.current;if(!button)return;
    button.replaceChildren();
    (window as unknown as {TDSPRuntime:{appendUniversalTileContent:(node:HTMLElement,options:Record<string,unknown>)=>void}}).TDSPRuntime.appendUniversalTileContent(button,{title,primaryText:value});
    if(loading){
      const label=document.createElement('span');label.className='tdsp-bar-legend';
      label.textContent=loadingLabel;label.setAttribute('role','status');
      const progress=document.createElement('progress');
      progress.setAttribute('aria-label',loadingLabel);
      progress.style.width='100%';
      button.append(label,progress);
    }
    if(analysis){
      if(analysis.status){
        const activity=document.createElement('span');activity.className='tdsp-bar-legend';
        activity.textContent=analysis.status;activity.setAttribute('role','status');button.append(activity);
      }
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
    if(children)button.append(footer);
  },[title,value,loading,loadingLabel,analysis?.done,analysis?.total,analysis?.counting,analysis?.busy,analysis?.status,!!children,footer]);
  const interactive=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('button,a,input,select,textarea');
  return <div ref={ref} role="button" tabIndex={0} className="governance-card governance-menu-card" onClick={event=>{if(!interactive(event.target))onOpen();}} onKeyDown={event=>{if(!interactive(event.target)&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onOpen();}}} aria-label={`Open ${title}`} aria-busy={loading}>{children&&createPortal(children,footer)}</div>;
}
export const Input=(props:React.ComponentProps<'input'>)=><input {...props}/>;
const TableLabels=React.createContext<string[]>([]);
function headerText(node:React.ReactNode):string{
  return React.Children.toArray(node).map(child=>typeof child==='string'||typeof child==='number'?String(child):React.isValidElement<{children?:React.ReactNode}>(child)?headerText(child.props.children):'').join('');
}
function tableLabels(node:React.ReactNode):string[]{
  return React.Children.toArray(node).flatMap(child=>{
    if(!React.isValidElement<{children?:React.ReactNode}>(child))return [];
    return child.type===TableHead?[headerText(child.props.children)]:tableLabels(child.props.children);
  });
}
export const Table=({children,...props}:React.ComponentProps<'table'>)=><TableLabels.Provider value={tableLabels(children)}><div className="table-shell" data-slot="table-container"><table {...props}>{children}</table></div></TableLabels.Provider>;
export const TableHeader=(props:React.ComponentProps<'thead'>)=><thead {...props}/>;
export const TableBody=(props:React.ComponentProps<'tbody'>)=><tbody {...props}/>;
export function TableRow({children,...props}:React.ComponentProps<'tr'>){
  const labels=React.useContext(TableLabels);let column=0;
  return <tr {...props}>{React.Children.map(children,child=>{
    if(!React.isValidElement<React.ComponentProps<'td'>&{'data-label'?:string}>(child)||child.type!==TableCell)return child;
    const label=labels[column]||'';column+=child.props.colSpan||1;
    return React.cloneElement(child,{'data-label':label});
  })}</tr>;
}
export const TableHead=(props:React.ComponentProps<'th'>)=><th {...props}/>;
export const TableCell=(props:React.ComponentProps<'td'>)=><td {...props}/>;
export const Pagination=(props:React.ComponentProps<'nav'>)=><nav aria-label="pagination" {...props}/>;
export const PaginationContent=(props:React.ComponentProps<'ul'>)=><ul {...props} className="governance-action-buttons"/>;
export const PaginationItem=(props:React.ComponentProps<'li'>)=><li {...props}/>;
