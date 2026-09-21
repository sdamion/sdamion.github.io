import assert from 'node:assert/strict';
import {durationLabel,remainingSeconds,loadedDateRange} from './progress.ts';

assert.equal(durationLabel(61.1),'1m 2s');
assert.equal(durationLabel(-1),'0s');
assert.equal(remainingSeconds(1000,11000,0,100),null);
assert.equal(remainingSeconds(1000,11000,50,100),10);
assert.equal(remainingSeconds(1000,11000,100,100),0);
assert.equal(loadedDateRange([NaN,0]),'No dated transactions loaded yet');
assert.equal(loadedDateRange([1704240000,1704067200]),`${new Date(1704067200000).toLocaleDateString()} – ${new Date(1704240000000).toLocaleDateString()}`);
