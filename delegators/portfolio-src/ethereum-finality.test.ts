import assert from 'node:assert/strict';
import {ethereumScanStart} from './ethereum-finality.ts';
import {ethereumData,type EthereumAccount} from './ethereum.ts';
import {encodeEthereumSettings,readEthereumSettings} from './ethereum-storage.ts';
const account:EthereumAccount={balanceWei:'0',block:200,finalizedBlock:170,transactions:[]};
assert.equal(ethereumScanStart(account,240,220),171,'new finalization does not skip previously unverified recent blocks');
assert.equal(ethereumScanStart(account,200,170),171,'unchanged head rereads only the nonfinalized tail');
assert.equal(ethereumScanStart({...account,finalizedBlock:200},200,200),201,'a fully finalized unchanged history makes no history request');
assert.equal(ethereumScanStart({...account,finalizedBlock:undefined},200,170),136,'legacy caches validate their former overlap once');
assert.equal(ethereumScanStart(undefined,200,170),0);
for(const finalized of [null,undefined]){
  assert.equal(ethereumScanStart(account,200,finalized),171,'missing finality reuses only the previously verified boundary');
  assert.equal(ethereumScanStart({...account,finalizedBlock:undefined},200,finalized),136,'legacy caches retain conservative overlap without inventing finality');
  assert.equal(ethereumScanStart(undefined,200,finalized),0,'first scan still loads all history');
}
for(const finalized of [-1,201,1.5,169])assert.throws(()=>ethereumScanStart(account,200,finalized));
assert.throws(()=>ethereumScanStart(account,160,null),'head cannot regress behind saved finality');
const address='0x'+'a'.repeat(40);
const data={accounts:{[address]:account},history:{},usd:null,updated:null};
const settings=encodeEthereumSettings('cache',data);
assert.equal(readEthereumSettings('cache',key=>settings[key]).accounts[address].finalizedBlock,170,'finality survives encrypted-cache serialization');
assert.equal(Object.keys(ethereumData({...data,accounts:{[address]:{...account,finalizedBlock:201}}}).accounts).length,0,'invalid finality is not trusted');
