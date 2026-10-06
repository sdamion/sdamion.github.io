import assert from 'node:assert/strict';
import {includedAssets} from './asset-exclusions.ts';

const rows=[{id:'lovelace',value:100,cost:80},{id:'bundle-a',value:20,cost:5},{id:'bundle-b',value:30,cost:40}];
const settings={'bundle-a':{excluded:true},lovelace:{excluded:true}};
const included=includedAssets(rows,JSON.parse(JSON.stringify(settings)));
assert.deepEqual(included.map(r=>r.id),['lovelace','bundle-b']);
assert.equal(included.reduce((n,r)=>n+r.value,0),130);
assert.equal(included.reduce((n,r)=>n+r.cost,0),120);
assert.equal(included.reduce((n,r)=>n+r.value-r.cost,0),10);
assert.equal(rows.length,3);
assert.deepEqual(includedAssets(rows,{'bundle-a':{excluded:false}}),rows);
assert.deepEqual(includedAssets(rows,{}),rows);
console.log('Asset exclusions preserve ledger ADA, original rows and re-inclusion');
