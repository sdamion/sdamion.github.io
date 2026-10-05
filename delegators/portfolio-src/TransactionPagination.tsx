import {Pagination,PaginationContent,PaginationItem} from './ui';
import {transactionPage} from './transaction-date';
import {ChevronLeft,ChevronRight,ChevronsLeft,ChevronsRight} from 'lucide-react';

export function TransactionPagination({page,count,onPage,position,pageSize=100}:{page:number;count:number;onPage:(page:number)=>void;position:'top'|'bottom';pageSize?:number}){
  const current=transactionPage(page,count,pageSize);
  return <Pagination className="portfolio-pagination" aria-label={`Transaction pages ${position}`}><PaginationContent>
    <PaginationItem><button type="button" className="governance-vote-secondary" aria-label="First page" title="First page" disabled={current.page===0} onClick={()=>onPage(0)}><ChevronsLeft size={18}/></button></PaginationItem>
    <PaginationItem><button type="button" className="governance-vote-secondary" aria-label="Previous page" title="Previous page" disabled={current.page===0} onClick={()=>onPage(current.page-1)}><ChevronLeft size={18}/></button></PaginationItem>
    <PaginationItem><span className="small" aria-live="polite">Page {current.page+1}/{current.pages}</span></PaginationItem>
    <PaginationItem><button type="button" className="governance-vote-secondary" aria-label="Next page" title="Next page" disabled={current.page===current.pages-1} onClick={()=>onPage(current.page+1)}><ChevronRight size={18}/></button></PaginationItem>
    <PaginationItem><button type="button" className="governance-vote-secondary" aria-label="Last page" title="Last page" disabled={current.page===current.pages-1} onClick={()=>onPage(current.pages-1)}><ChevronsRight size={18}/></button></PaginationItem>
  </PaginationContent></Pagination>;
}
