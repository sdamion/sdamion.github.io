export function analysisProgress(busy:boolean,current:{done:number;total:number}|null,cachedDone:number,cachedTotal:number){
  const done=busy?(current?.done??0):cachedDone;
  const total=busy?(current?.total??0):cachedTotal;
  return {done,total,percent:total>0?done/total*100:0};
}

export function durationLabel(seconds:number):string {
  const value=Math.max(0,Math.ceil(seconds));
  return value<60?`${value}s`:`${Math.floor(value/60)}m ${value%60}s`;
}

export function remainingSeconds(start:number,now:number,done:number,total:number):number|null {
  if(done<=0||total<=0||now<=start)return null;
  return Math.max(0,(now-start)/1000/done*(total-done));
}

export function loadedDateRange(times:number[]):string {
  const valid=times.filter(t=>Number.isFinite(t)&&t>0);
  if(!valid.length)return 'No dated transactions loaded yet';
  const first=valid.reduce((a,b)=>Math.min(a,b));
  const last=valid.reduce((a,b)=>Math.max(a,b));
  const date=(t:number)=>new Date(t*1000).toLocaleDateString();
  return `${date(first)} – ${date(last)}`;
}
