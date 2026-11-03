import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleHistory} from './visible-history.ts';

test('visible history shares complete-first deduplication and excludes unrelated pending rows',()=>{
  const pending=[{id:'a',time:2,source:'pending'},{id:'b',time:3,source:'pending'},{id:'z',time:4,source:'pending'}];
  const complete=[{id:'a',time:2,source:'complete'}];
  assert.deepEqual(visibleHistory(complete,pending,row=>row.id,row=>row.id!=='z',(a,b)=>b.time-a.time),[
    pending[1],complete[0]
  ]);
  assert.deepEqual(complete,[{id:'a',time:2,source:'complete'}]);
});
