import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../shared/runtime.js',import.meta.url),'utf8');
const context=vm.createContext({Intl});
vm.runInContext(source.slice(source.indexOf('    function formatAdaUsdAmount('),source.indexOf('    function createAdaUsdAmount(')),context);
const format=(ada,usd)=>JSON.parse(JSON.stringify(context.formatAdaUsdAmount(ada,usd)));
test('shared ADA/USD pairs use absolute values and independent signed colours',()=>{
  assert.deepEqual(format(53811.587507,22791.61),{ada:'₳ 53,811.587507',usd:'≈ $22,791.61',adaTone:'positive',usdTone:'positive'});
  assert.deepEqual(format(-53811.587507,-22791.61),{ada:'₳ 53,811.587507',usd:'≈ $22,791.61',adaTone:'negative',usdTone:'negative'});
  assert.equal(format(10,-2).usdTone,'negative');
  assert.equal(format(-10,2).usdTone,'positive');
});
test('zero and unavailable values are not invented or treated as losses',()=>{
  assert.deepEqual(format(0,0),{ada:'₳ 0',usd:'≈ $0.00',adaTone:'',usdTone:''});
  assert.equal(format(10,null).usd,'');
  assert.equal(format(NaN,Infinity).ada,'—');
});
