import assert from 'node:assert/strict';
import {hasCounterpartyData,needsFactRefresh} from './fact-refresh.ts';
import {analyse} from './core.ts';
import {cexAdaNetPosition} from './cex.ts';

const detail={tx_hash:'receipt',tx_timestamp:1,fee:'200000',marketplace_version:3,inputs:[{value:'100200000',payment_addr:{bech32:'cex-payment'},stake_addr:'cex-stake',asset_list:[]}],outputs:[{value:'100000000',payment_addr:{bech32:'my-wallet'},asset_list:[]}]};
const fresh=analyse(detail,new Set(['my-wallet']));
const old={...fresh,counterpartyVersion:undefined,externalInputs:[{address:'cex-payment',lovelace:'100200000'}]};
assert.equal(needsFactRefresh(old),true);
assert.equal(hasCounterpartyData(old),false);
assert.equal(needsFactRefresh({...old,counterpartyVersion:1}),true);
assert.equal(needsFactRefresh(undefined),true);
assert.equal(needsFactRefresh(fresh),false);
const entries=[{address:'cex-stake',name:'Exchange'}];
assert.equal(cexAdaNetPosition([old],entries,'100000000').receivedRaw,'0');
assert.equal(cexAdaNetPosition([fresh],entries,'100000000').receivedRaw,'100000000');
assert.equal(cexAdaNetPosition([fresh,fresh],entries,'100000000').receivedRaw,'100000000');
console.log('Legacy CEX metadata is rechecked; stake-address matching restores receipts without double counting');
