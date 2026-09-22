import assert from 'node:assert/strict';
import {averageBuy} from './average-buy.ts';
assert.equal(averageBuy(20*1.05,1),21);
assert.equal(averageBuy(42,2),21);
assert.equal(averageBuy(0,1),0);
assert.equal(averageBuy(null,1),null);
assert.equal(averageBuy(20,null),null);
assert.equal(averageBuy(20,0),null);
console.log('Average buy displays known USD costs, including zero, independently from current price');
