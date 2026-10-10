export type DownloadProgress={downloaded:number;total:number|null};
export const emptyDownloadProgress=():DownloadProgress=>({downloaded:0,total:null});
// Chain adapters supply stable identities; partial receipts never become financial totals.
export function createTransactionProgress<T>(rows:Iterable<T>,identity:(row:T)=>string){
  const ids=new Set<string>();
  let total:number|null=null;
  const add=(rows:Iterable<T>)=>{for(const row of rows)ids.add(identity(row));};
  add(rows);
  return {
    add(rows:Iterable<T>){add(rows);total=null;return this.snapshot();},
    complete(rows:Iterable<T>){ids.clear();add(rows);total=ids.size;return this.snapshot();},
    snapshot():DownloadProgress{return {downloaded:ids.size,total};}
  };
}
export function transactionProgress<T>(rows:Iterable<T>,identity:(row:T)=>string,total:number|null):DownloadProgress{
  const progress=createTransactionProgress(rows,identity).snapshot();
  return {...progress,total:total===null?null:Math.max(progress.downloaded,total)};
}
export function combinedTransactionProgress(chains:DownloadProgress[]):DownloadProgress{
  return {downloaded:chains.reduce((sum,chain)=>sum+chain.downloaded,0),total:chains.some(chain=>chain.total===null)?null:chains.reduce((sum,chain)=>sum+chain.total!,0)};
}
export function downloadProgressValues(progress:DownloadProgress){
  return {done:progress.downloaded.toLocaleString('en-US'),total:progress.total===null?'?':progress.total.toLocaleString('en-US')};
}
