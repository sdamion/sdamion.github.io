import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runPipeline} from './pipeline.ts';

test('analysis starts before counting completes and drains all batches',async()=>{
  let started!:()=>void;
  const analysing=new Promise<void>(resolve=>{started=resolve;});
  let counted=false;
  const batches:number[][]=[];
  await runPipeline<number>(async enqueue=>{
    enqueue([1,2,3]);
    await analysing;
    enqueue([4,5]);counted=true;
  },async batch=>{
    if(!batches.length){assert.equal(counted,false);started();}
    batches.push(batch);
  },new AbortController().signal,2);
  assert.deepEqual(batches.flat(),[1,2,3,4,5]);
  assert.ok(batches.every(batch=>batch.length<=2));
});

test('analysis failure cancels an outstanding counting request',async()=>{
  let stopped=false;
  await assert.rejects(runPipeline<number>(async(enqueue,signal)=>{
    enqueue([1]);
    await new Promise<void>((resolve,reject)=>{
      signal.addEventListener('abort',()=>{stopped=true;reject(signal.reason);},{once:true});
    });
  },async()=>{throw new Error('detail failure');},new AbortController().signal),/detail failure/);
  assert.equal(stopped,true);
});

test('counting failure wakes and stops an idle analyser',async()=>{
  await assert.rejects(runPipeline<number>(async()=>{throw new Error('page failure');},async()=>{
    assert.fail('no work should run');
  },new AbortController().signal),/page failure/);
});

test('empty history finishes without analysis',async()=>{
  await runPipeline<number>(async()=>{},async()=>{assert.fail('empty history');},new AbortController().signal);
});

test('cancelling a refresh aborts both workers before returning',async()=>{
  const controller=new AbortController();let active=0;
  const pending=async(signal:AbortSignal)=>{
    active++;
    try{await new Promise<void>((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}
    finally{active--;}
  };
  const run=runPipeline<number>(async(enqueue,signal)=>{enqueue([1]);await pending(signal);},async(items,signal)=>{
    const wait=pending(signal);controller.abort();await wait;
  },controller.signal);
  await assert.rejects(run);assert.equal(active,0);
});
