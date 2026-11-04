export type PageScan<Page,Cursor>={
  signal:AbortSignal;
  fetchPage:(cursor:Cursor|undefined,page:number)=>Promise<unknown>;
  validPage:(value:unknown)=>value is Page;
  hasMore:(value:Page)=>boolean;
  nextCursor:(value:Page,page:number)=>Cursor;
  onPage:(value:Page,page:number)=>Promise<boolean|void>|boolean|void;
  error:string;
  maxPages?:number;
};

// A page is published only after the provider response and cursor are validated.
export async function scanProviderPages<Page,Cursor>(scan:PageScan<Page,Cursor>):Promise<void>{
  const seen=new Set<string>();
  let cursor:Cursor|undefined;
  for(let page=0;page<(scan.maxPages??100000);page++){
    scan.signal.throwIfAborted();
    const value=await scan.fetchPage(cursor,page);
    scan.signal.throwIfAborted();
    if(!scan.validPage(value))throw new Error(scan.error);
    const more=scan.hasMore(value);
    let next:Cursor|undefined;
    if(more){
      next=scan.nextCursor(value,page);
      const key=JSON.stringify(next);
      if(key===undefined||seen.has(key))throw new Error(scan.error);
      seen.add(key);
    }
    const stop=await scan.onPage(value,page);
    scan.signal.throwIfAborted();
    if(stop||!more)return;
    cursor=next;
  }
  throw new Error(scan.error);
}
