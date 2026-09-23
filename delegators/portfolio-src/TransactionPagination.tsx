import {Pagination,PaginationContent,PaginationItem} from './ui';
import {transactionPage} from './transaction-date';

export function TransactionPagination({page,count,onPage,position}:{page:number;count:number;onPage:(page:number)=>void;position:'top'|'bottom'}){
  const current=transactionPage(page,count);
  return <Pagination aria-label={`Transaction pages ${position}`}><PaginationContent>
    <PaginationItem><button type="button" className="governance-vote-secondary" disabled={current.page===0} onClick={()=>onPage(0)}>First</button></PaginationItem>
    <PaginationItem><button type="button" className="governance-vote-secondary" disabled={current.page===0} onClick={()=>onPage(current.page-1)}>Previous</button></PaginationItem>
    <PaginationItem><span className="small">Page {current.page+1} / {current.pages} · {count.toLocaleString()} transactions</span></PaginationItem>
    <PaginationItem><button type="button" className="governance-vote-secondary" disabled={current.page===current.pages-1} onClick={()=>onPage(current.page+1)}>Next</button></PaginationItem>
    <PaginationItem><button type="button" className="governance-vote-secondary" disabled={current.page===current.pages-1} onClick={()=>onPage(current.pages-1)}>Last</button></PaginationItem>
  </PaginationContent></Pagination>;
}
