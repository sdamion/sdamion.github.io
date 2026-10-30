import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRefreshPublisher} from './refresh-publisher.ts';

test('frequent analysis batches publish at most once per second and flush the final state',async()=>{
  let time=0,value=0;const snapshots:number[]=[];
  const publish=createRefreshPublisher(async()=>{snapshots.push(value);},()=>time);
  for(value=0;value<100;value++){await publish();time+=10;}
  assert.deepEqual(snapshots,[0]);
  await publish(true);assert.deepEqual(snapshots,[0,100]);
  time=2000;value=101;await publish();assert.deepEqual(snapshots,[0,100,101]);
});

test('a forced publication is available even after a worker fails',async()=>{
  let cached=0,value=1;
  const publish=createRefreshPublisher(async()=>{cached=value;},()=>0);
  await publish();value=2;
  try{throw new Error('provider failed');}catch{}finally{await publish(true);}
  assert.equal(cached,2);
});
