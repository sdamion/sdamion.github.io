import type {Market} from './core.ts';

type ImageState={token_id:string;state:string;cached_image?:string;retryAt?:number};
const cachedPath=/^\/api\/portfolio\/images\/[a-f0-9]{64}\.(png|jpg|gif|webp)$/;
export function applyCachedImages(markets:Record<string,Market>,images:Record<string,string>):Record<string,Market>{
  let next=markets;
  for(const [id,url] of Object.entries(images)){
    if(!markets[id]||!cachedPath.test(url)||markets[id].cached_image===url)continue;
    if(next===markets)next={...markets};
    next[id]={...markets[id],cached_image:url};
  }
  return next;
}

export async function watchImageCache(ids:string[],request:(ids:string[])=>Promise<{tokens:ImageState[]}>,publish:(images:Record<string,string>)=>void,signal:AbortSignal,wait:(ms:number)=>Promise<void>,now=Date.now){
  const pending=new Map(ids.map(id=>[id,0]));
  while(pending.size&&!signal.aborted){
    const due=[...pending].filter(([,at])=>at<=now()).map(([id])=>id);
    for(let offset=0;offset<due.length;offset+=100){
      signal.throwIfAborted();
      const batch=due.slice(offset,offset+100),allowed=new Set(batch);
      const result=await request(batch);signal.throwIfAborted();
      if(!Array.isArray(result.tokens))throw new Error('Invalid image cache status.');
      const images:Record<string,string>={};
      for(const row of result.tokens){
        if(!row||!allowed.has(row.token_id))continue;
        if(row.state==='cached'&&typeof row.cached_image==='string'&&cachedPath.test(row.cached_image)){
          images[row.token_id]=row.cached_image;pending.delete(row.token_id);
        }else if(row.state==='unavailable')pending.delete(row.token_id);
        else if(row.state==='deferred'&&typeof row.retryAt==='number'&&Number.isSafeInteger(row.retryAt)&&row.retryAt>now())pending.set(row.token_id,row.retryAt);
      }
      if(Object.keys(images).length)publish(images);
    }
    if(pending.size)await wait(Math.min(60000,Math.max(5000,Math.min(...pending.values())-now())));
  }
}
