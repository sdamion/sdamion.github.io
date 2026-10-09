import assert from 'node:assert/strict';
import {gainTransfers} from './portfolio-flows.ts';
import {portfolioTransferResult} from './transfer-comparison.ts';
import {availableCexResult} from './portfolio-totals.ts';

const time=Date.UTC(2026,9,9)/1000;
const flows=[{hash:'deposit',time,side:'buy' as const,usd:100}];
const receipts=[
  {hash:'ada',time,side:'sell' as const,usd:10,performance:false},
  {hash:'eth',time,side:'sell' as const,usd:50,performance:false},
  {hash:'sol',time,side:'sell' as const,usd:20,performance:false},
  {hash:'token',time,side:'sell' as const,usd:5,performance:false}
];
const gain=gainTransfers(flows,receipts);
assert.deepEqual(portfolioTransferResult(gain,180,{}, {}, {}, {},'ADA','USD',time,0.25,100),{amount:660,fiat:165});
assert.deepEqual(portfolioTransferResult(gain,180,{}, {}, {}, {},'ETH','USD',time,0.25,100),{amount:1.65,fiat:165});
assert.deepEqual(portfolioTransferResult(gain,180,{}, {}, {}, {},'SOL','USD',time,0.25,100,{},50),{amount:3.3,fiat:165});
assert.deepEqual(availableCexResult(gain,180,'USD',0.25,{}, {},time),{value:165,partial:false});
assert.deepEqual(availableCexResult(gain,180,'ADA',0.25,{}, {},time),{value:660,partial:false});
assert.equal(receipts[0].performance,false,'gain calculation must not change receipt classification');
assert.equal(flows.length,1,'CEX IN/OUT remains unchanged');
assert.deepEqual(availableCexResult(gainTransfers(flows,[...receipts,{hash:'unknown',time,side:'sell',usd:null}]),180,'USD',0.25,{}, {},time),{value:165,partial:true});
