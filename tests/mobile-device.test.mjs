import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../shared/runtime.js',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('    function isMobileDevice('),source.indexOf('    function formatAdaUsdAmount(')),context);
test('device detection blocks phones and tablets without using window size',()=>{
  for(const device of [{userAgent:'iPhone'},{userAgent:'Android Tablet'},{userAgent:'iPad'},{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5},{userAgent:'',userAgentData:{mobile:true}}])assert.equal(context.isMobileDevice(device),true);
  for(const device of [{userAgent:'Windows NT',maxTouchPoints:10},{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:0},{userAgent:'Linux x86_64',userAgentData:{mobile:false}}])assert.equal(context.isMobileDevice(device),false);
  assert.doesNotMatch(source.slice(source.indexOf('    function isMobileDevice('),source.indexOf('    function formatAdaUsdAmount(')),/innerWidth|matchMedia|screen\./);
});
