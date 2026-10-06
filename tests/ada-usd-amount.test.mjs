import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../shared/runtime.js',import.meta.url),'utf8');
const context=vm.createContext({Intl});
vm.runInContext(source.slice(source.indexOf('    function formatAdaNumber('),source.indexOf('    function createAdaUsdAmount(')),context);
const format=(ada,usd)=>JSON.parse(JSON.stringify(context.formatAdaUsdAmount(ada,usd)));
test('shared ADA/USD pairs use absolute values and independent signed colours',()=>{
  assert.deepEqual(format(53811.587507,22791.61),{ada:'₳ 53,812',usd:'≈ $22,791.61',adaTone:'positive',usdTone:'positive'});
  assert.deepEqual(format(-53811.587507,-22791.61),{ada:'₳ 53,812',usd:'≈ $22,791.61',adaTone:'negative',usdTone:'negative'});
  assert.equal(format(10,-2).usdTone,'negative');
  assert.equal(format(-10,2).usdTone,'positive');
});
test('ADA at least one has no decimals and smaller amounts have at most two',()=>{
  assert.equal(format(1.234567,null).ada,'₳ 1');
  assert.equal(format(10,null).ada,'₳ 10');
  assert.equal(format(-1.999999,null).ada,'₳ 2');
  assert.equal(format(0.123456,null).ada,'₳ 0.12');
  assert.equal(format(0.000001,null).ada,'₳ 0');
  assert.equal(format(-0.123456,null).ada,'₳ 0.12');
  assert.equal(format(1,null).ada,'₳ 1');
});
test('zero and unavailable values are not invented or treated as losses',()=>{
  assert.deepEqual(format(0,0),{ada:'₳ 0',usd:'≈ $0.00',adaTone:'',usdTone:''});
  assert.equal(format(10,null).usd,'');
  assert.equal(format(NaN,Infinity).ada,'—');
});
