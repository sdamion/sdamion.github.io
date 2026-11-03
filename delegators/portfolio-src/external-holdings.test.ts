import test from 'node:test';
import assert from 'node:assert/strict';
import {externalFtHoldings} from './external-holdings.ts';

test('non-ADA fungible balances remain exact and unpriced assets are not assigned zero value',()=>{
  const asset={id:'ethereum:erc20:token',chain:'ethereum' as const,standard:'ERC-20',name:'Token',symbol:'TOK',raw:'123456789',decimals:6,image:null,explorer:null,wallets:['Mine'],addresses:['0x'+'a'.repeat(40)]};
  const [missing]=externalFtHoldings([asset],{});
  assert.equal(missing.quantity,'123.456789');assert.equal(missing.value,null);assert.equal(missing.cost,null);
  const [priced]=externalFtHoldings([asset],{[asset.id]:{price:'2',average:'1',excluded:true}});
  assert.equal(priced.value,246.913578);assert.equal(priced.cost,123.456789);assert.equal(priced.pnl,123.456789);assert.equal(priced.excluded,true);
  assert.equal(asset.raw,'123456789');
  assert.deepEqual(externalFtHoldings([{...asset,standard:'ERC-721'}],{}),[]);
});
