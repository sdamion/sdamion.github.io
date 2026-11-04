import assert from 'node:assert/strict';
import {scanProviderPages} from './provider-scan.ts';

type Page={items:string[];more:boolean};
const controller=new AbortController();
const received:string[]=[];
await scanProviderPages<Page,string>({
  signal:controller.signal,error:'invalid page',
  fetchPage:async cursor=>cursor?{items:['b'],more:false}:{items:['a'],more:true},
  validPage:(value):value is Page=>!!value&&typeof value==='object'&&Array.isArray((value as Page).items)&&typeof (value as Page).more==='boolean',
  hasMore:value=>value.more,
  nextCursor:value=>value.items.at(-1)!,
  onPage:value=>{received.push(...value.items);}
});
assert.deepEqual(received,['a','b']);
await assert.rejects(scanProviderPages<Page,string>({
  signal:controller.signal,error:'invalid page',
  fetchPage:async()=>({items:['a'],more:true}),
  validPage:(value):value is Page=>!!value&&typeof value==='object'&&Array.isArray((value as Page).items),
  hasMore:value=>value.more,nextCursor:value=>value.items[0],onPage:()=>{}
}),/invalid page/,'repeated cursors cannot loop forever');
await assert.rejects(scanProviderPages<Page,string>({
  signal:controller.signal,error:'invalid page',
  fetchPage:async()=>({items:[],more:true}),
  validPage:(value):value is Page=>!!value&&typeof value==='object'&&Array.isArray((value as Page).items),
  hasMore:value=>value.more,nextCursor:value=>value.items[0],onPage:()=>{}
}),/invalid page/,'a page cannot claim more data without a cursor');
await assert.rejects(scanProviderPages<Page,string>({
  signal:controller.signal,error:'invalid page',maxPages:2,
  fetchPage:async(_cursor,page)=>({items:[String(page)],more:true}),
  validPage:(value):value is Page=>!!value&&typeof value==='object'&&Array.isArray((value as Page).items),
  hasMore:value=>value.more,nextCursor:value=>value.items[0],onPage:()=>{}
}),/invalid page/,'bounded scans reject incomplete histories');
controller.abort();
await assert.rejects(scanProviderPages<Page,string>({
  signal:controller.signal,error:'invalid page',fetchPage:async()=>({items:[],more:false}),
  validPage:(_value):_value is Page=>true,hasMore:()=>false,nextCursor:()=>'',onPage:()=>{}
}),/AbortError|aborted/i);
