import {Input} from './ui';

export const transactionFilters:Record<string,string>={all:'All',cex:'CEX',trade:'Trades',send:'Sends',receive:'Receives',internal:'Internal',mixed:'Mixed',other:'Other'};

export function TransactionFilters({id,query,onQuery,filter,onFilter,dateFrom,dateTo,onDates,placeholder='Asset name, transaction hash or wallet name'}:{
  id:string;query:string;onQuery:(value:string)=>void;filter:string;onFilter:(value:string)=>void;
  dateFrom:string;dateTo:string;onDates:(from:string,to:string)=>void;placeholder?:string;
}){
  return <section className="portfolio-section" aria-label="Transaction search options">
    <div className="filter-row">
      <label>From <Input type="date" name={`${id}-from`} value={dateFrom} max={dateTo||undefined} onChange={event=>onDates(event.target.value,dateTo)}/></label>
      <label>To <Input type="date" name={`${id}-to`} value={dateTo} min={dateFrom||undefined} onChange={event=>onDates(dateFrom,event.target.value)}/></label>
      {(dateFrom||dateTo)&&<button type="button" className="governance-vote-secondary" onClick={()=>onDates('','')}>Clear dates</button>}
    </div>
    <div className="section-heading"><Input name={`${id}-search`} aria-label={`Search ${placeholder.toLowerCase()}`} placeholder={placeholder} value={query} onChange={event=>onQuery(event.target.value)} className="search-input"/></div>
    <div className="filter-row">{Object.entries(transactionFilters).map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>onFilter(value)} className={filter===value?'active':''}>{label}</button>)}</div>
  </section>;
}
