import {Input} from './ui';
import type {ReactNode} from 'react';

export const transactionFilters:Record<string,string>={all:'All',cex:'CEX',swap:'Swap',trade:'Trades',send:'Sends',receive:'Receives'};

export function TransactionFilters({id,query,onQuery,filter,onFilter,dateFrom,dateTo,onDates,options=transactionFilters,placeholder='Asset name, transaction hash or wallet name',pagination,showDates=true,children,ariaLabel='Transaction search options',searchLabel}:{
  id:string;query:string;onQuery:(value:string)=>void;filter:string;onFilter:(value:string)=>void;
  dateFrom:string;dateTo:string;onDates:(from:string,to:string)=>void;placeholder?:string;options?:Record<string,string>;pagination?:ReactNode;showDates?:boolean;children?:ReactNode;ariaLabel?:string;searchLabel?:string;
}){
  return <section className="portfolio-transaction-toolbar" aria-label={ariaLabel}>
    {showDates&&<div className="filter-row portfolio-transaction-dates">
      <label>From <Input type="date" name={`${id}-from`} value={dateFrom} max={dateTo||undefined} onChange={event=>onDates(event.target.value,dateTo)}/></label>
      <label>To <Input type="date" name={`${id}-to`} value={dateTo} min={dateFrom||undefined} onChange={event=>onDates(dateFrom,event.target.value)}/></label>
      {(dateFrom||dateTo)&&<button type="button" className="governance-vote-secondary" onClick={()=>onDates('','')}>Clear dates</button>}
    </div>}
    <Input name={`${id}-search`} aria-label={searchLabel||`Search ${placeholder.toLowerCase()}`} placeholder={placeholder} value={query} onChange={event=>onQuery(event.target.value)} className="search-input"/>
    {Object.keys(options).length>0&&<div className="filter-row portfolio-transaction-types">{Object.entries(options).map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>onFilter(value)} className={`governance-vote-secondary${filter===value?' active':''}`}>{label}</button>)}</div>}
    {children}
    {pagination}
  </section>;
}
