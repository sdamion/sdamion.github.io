import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyCexFlow} from './cex-flow.ts';

test('one CEX direction rule handles verified and uncertain transfers',()=>{
  assert.deepEqual(classifyCexFlow({incomingMatched:true,incomingRaw:42n}),{side:'buy',raw:42n,verified:true});
  assert.deepEqual(classifyCexFlow({outgoingMatched:true,outgoingRaw:17n}),{side:'sell',raw:17n,verified:true});
  assert.deepEqual(classifyCexFlow({incomingMatched:true}),{side:'buy',raw:null,verified:false});
  assert.deepEqual(classifyCexFlow({outgoingMatched:true}),{side:'sell',raw:null,verified:false});
  assert.equal(classifyCexFlow({incomingMatched:true,outgoingMatched:true,incomingRaw:42n,outgoingRaw:17n}),null);
  assert.deepEqual(classifyCexFlow({incomingMatched:true,incomingRaw:0n}),{side:'buy',raw:null,verified:false});
  assert.equal(classifyCexFlow({}),null);
});
