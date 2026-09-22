import assert from 'node:assert/strict';
import {valuationCoverage} from './valuation-coverage.ts';
const rows=Array.from({length:78},(_,i)=>({value:10,cost:i<12?5:null,pnl:i<12?5:null}));
assert.deepEqual(valuationCoverage(rows),{total:78,valued:78,covered:12,missingCost:66,missingValue:0,partial:true,excludedValue:660});
assert.equal(valuationCoverage(rows.map(r=>({...r,cost:0,pnl:10}))).covered,78);
assert.equal(valuationCoverage([{value:null,cost:5,pnl:null}]).missingValue,1);
assert.equal(valuationCoverage([{value:10,cost:5,pnl:5}]).partial,false);
console.log('Current-value coverage is distinct from purchase-cost coverage');
