import assert from 'node:assert/strict';
import {purchaseRefreshBatches} from './purchase-refresh.ts';

const ids=Array.from({length:138},(_,i)=>`asset${i}`);
const facts=ids.map((id,i)=>({hash:`tx${Math.floor(i/2)}`,assets:{[id]:'1'}}));
const batches=purchaseRefreshBatches([...facts,{hash:'out',assets:{asset0:'-1'}},{hash:'ada',assets:{lovelace:'1'}}],['lovelace',...ids]);
assert.equal(batches.flat().length,69);
assert.ok(batches.every(batch=>batch.length<=5));
assert.deepEqual(purchaseRefreshBatches(facts,['asset0']),[['tx0']]);
assert.deepEqual(purchaseRefreshBatches(facts,['missing']),[]);
assert.equal(facts.length,138);
console.log('PASS: 138 assets, deduplicated receipts, five-transaction batches, outgoing/ADA exclusion and individual refresh.');
