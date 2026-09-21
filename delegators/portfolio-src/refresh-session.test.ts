import {test} from 'node:test';
import assert from 'node:assert/strict';
import {keepRefreshSessionAlive} from './refresh-session.ts';
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));

test('renews immediately and periodically until refresh stops',async()=>{
  let tick=()=>{};let calls=0;let stopped=false;let signal:AbortSignal|undefined;
  const stop=keepRefreshSessionAlive(async s=>{signal=s;calls++;},fn=>{tick=fn;return ()=>{stopped=true;};});
  assert.equal(calls,1);await flush();tick();await flush();assert.equal(calls,2);
  stop();assert.equal(stopped,true);assert.equal(signal?.aborted,true);
  tick();await flush();assert.equal(calls,2);
});

test('a long request does not overlap and cleanup aborts it',async()=>{
  let tick=()=>{};let calls=0;let aborted=false;
  const stop=keepRefreshSessionAlive(signal=>{
    calls++;
    return new Promise<void>((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true}));
  },fn=>{tick=fn;return ()=>{};});
  tick();tick();assert.equal(calls,1);
  stop();await flush();assert.equal(aborted,true);
});

test('transient failure retries on the next tick',async()=>{
  let tick=()=>{};let calls=0;
  const stop=keepRefreshSessionAlive(async()=>{calls++;if(calls===1)throw new Error('offline');},fn=>{tick=fn;return ()=>{};});
  await flush();tick();await flush();assert.equal(calls,2);stop();
});
