export function withinTransactionDates(timestamp:number,from:string,to:string){
  if(!from&&!to)return true;
  const date=new Date(timestamp*1000);
  if(!Number.isFinite(date.getTime()))return false;
  const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return (!from||day>=from)&&(!to||day<=to);
}
export function transactionPage(page:number,count:number){
  const pages=Math.max(1,Math.ceil(count/100));
  return {page:Math.max(0,Math.min(page,pages-1)),pages};
}
