import assert from 'node:assert/strict';
import {analyse,remainingBasis,tradeOf} from './core.ts';
import {adaToLovelace,mintPayments,paymentBudget} from './mint-payments.ts';
import {transactionPrices} from './transaction-prices.ts';
import type {Detail} from './core.ts';

const policy='a'.repeat(56),id=policy+'01';
const asset={policy_id:policy,asset_name:'01',quantity:'2',decimals:0};
const detail:Detail={tx_hash:'mint',tx_timestamp:1704067200,fee:'200000',inputs:[{payment_addr:{bech32:'own'},value:'100000000',asset_list:[]}],outputs:[{payment_addr:{bech32:'own'},value:'89800000',asset_list:[asset]},{payment_addr:{bech32:'shop'},value:'10000000',asset_list:[]}],assets_minted:[asset]};
const fact=analyse(detail,new Set(['own']));
const history={'2024-01-01':0.5,'2024-01-02':1};
assert.deepEqual(fact.minted,{[id]:'2'});
assert.equal(paymentBudget(fact),10000000n);
assert.equal(tradeOf(fact),null);
let result=mintPayments([fact],[]);
assert.equal(result.acquisitions.mint[id].ada,10);
assert.equal(remainingBasis([fact],history,result.acquisitions)[id].usd,5);
assert.equal(transactionPrices([fact],{},history,result.acquisitions)[id].usd,2.5);
assert.equal(transactionPrices([fact],{[id]:{token_id:id,price_by_usd:99}},history,result.acquisitions)[id].source,'mint');
assert.equal(transactionPrices([fact],{}, {},result.acquisitions)[id],undefined);
assert.equal(paymentBudget({...fact,feeRaw:null}),null);
assert.equal(paymentBudget({...fact,adaRaw:'-12200000'}),null); // deposit is not mint cost
assert.equal(paymentBudget({...fact,swapCandidate:false}),null); // CEX exclusion
assert.deepEqual(mintPayments([{...fact,minted:{[id]:'1'}}],[]).acquisitions,{});
assert.deepEqual(mintPayments([{...fact,assets:{[id]:'2',other:'1'}}],[]).acquisitions,{});
assert.deepEqual(mintPayments([{...fact,adaRaw:'-200000',externalOutputs:[]}],[]).acquisitions,{});
const transferred=analyse({...detail,assets_minted:[]},new Set(['own']));
assert.deepEqual(mintPayments([transferred],[]).acquisitions,{});
const burned=analyse({...detail,assets_minted:[{...asset,quantity:'-2'}]},new Set(['own']));
assert.deepEqual(burned.minted,{});
const batch={...fact,assets:{[id]:'2',other:'1'},minted:{[id]:'2',other:'1'}};
const links=[{assetId:id,receiptHash:'mint',paymentHash:'mint',lovelace:'6000000'},{assetId:'other',receiptHash:'mint',paymentHash:'mint',lovelace:'4000000'}];
result=mintPayments([batch],links);
assert.equal(result.errors.length,0);
assert.equal(result.acquisitions.mint[id].ada,6);
assert.equal(result.acquisitions.mint.other.ada,4);
assert.equal(mintPayments([batch],[...links,{...links[1],assetId:'third'}]).errors.length,1);
assert.equal(mintPayments([batch],[links[0],{...links[1],lovelace:'5000000'}]).errors.length,1);
assert.equal(mintPayments([batch],[links[0],links[0]]).errors.length,1);
const payment={...fact,hash:'payment',assets:{},minted:{}};
const receipt={...fact,hash:'receipt',time:1704153600,adaRaw:'2000000',feeRaw:null,externalOutputs:[],swapCandidate:true};
result=mintPayments([payment,receipt],[{assetId:id,receiptHash:'receipt',paymentHash:'payment',lovelace:'10000000'}]);
assert.equal(result.errors.length,0);
assert.equal(remainingBasis([payment,receipt],history,result.acquisitions)[id].usd,5); // payment date, not receipt date
assert.equal(transactionPrices([payment,receipt],{},history,result.acquisitions)[id].hash,'payment');
assert.equal(mintPayments([fact,receipt],[{assetId:id,receiptHash:'receipt',paymentHash:'mint',lovelace:'10000000'}]).errors.length,1); // no double use of a different acquisition
const sale={...fact,hash:'sale',time:1704153600,assets:{[id]:'-1'},minted:{},adaRaw:'19800000'};
assert.deepEqual(remainingBasis([fact,sale],history,mintPayments([fact],[]).acquisitions)[id],{raw:'1',usd:2.5});
assert.equal(adaToLovelace('12.345678'),'12345678');
for(const invalid of ['-1','1e3','1.1234567','bad',''])assert.equal(adaToLovelace(invalid),null);
console.log('Mint payment linking tests passed');

const linkedPayment={...payment,externalOutputs:[{address:'shop',lovelace:'10000000',txHash:'payment',txIndex:1}],inputRefs:['funding:0'],ownedInputCount:1};
const referenced=analyse({...detail,inputs:[{...detail.inputs[0],tx_hash:'funding',tx_index:0}],outputs:detail.outputs.map((o,i)=>({...o,tx_hash:'mint',tx_index:i}))},new Set(['own']));
assert.deepEqual(referenced.inputRefs,['funding:0']);
assert.equal(referenced.externalOutputs?.[0].txIndex,1);
assert.equal(referenced.externalOutputs?.[0].txHash,'mint');
assert.equal(referenced.ownedInputCount,1);
const linkedReceipt={...receipt,inputRefs:['payment:1'],ownedInputCount:0};
result=mintPayments([linkedPayment,linkedReceipt],[]);
assert.equal(result.acquisitions.receipt[id].ada,8); // 10 paid, 2 returned
assert.equal(result.acquisitions.receipt[id].source,'linked-mint');
assert.equal(result.acquisitions.receipt[id].paymentHash,'payment');
assert.equal(remainingBasis([linkedPayment,linkedReceipt],history,result.acquisitions)[id].usd,4);
assert.equal(transactionPrices([linkedPayment,linkedReceipt],{},history,result.acquisitions)[id].usd,2);
assert.deepEqual(mintPayments([linkedPayment,{...linkedReceipt,inputRefs:['payment:0']}],[]).acquisitions,{});
assert.deepEqual(mintPayments([linkedPayment,{...linkedReceipt,ownedInputCount:1}],[]).acquisitions,{});
assert.deepEqual(mintPayments([linkedPayment,{...linkedReceipt,adaRaw:'10000000'}],[]).acquisitions,{});
assert.deepEqual(mintPayments([linkedPayment,{...linkedReceipt,minted:{[id]:'3'}}],[]).acquisitions,{});
assert.deepEqual(mintPayments([linkedPayment,linkedReceipt,{...linkedReceipt,hash:'second'}],[]).acquisitions,{});
const otherPayment={...linkedPayment,hash:'other',externalOutputs:[{address:'shop',lovelace:'10000000',txHash:'other',txIndex:1}]};
assert.deepEqual(mintPayments([linkedPayment,otherPayment,{...linkedReceipt,inputRefs:['payment:1','other:1']}],[]).acquisitions,{});
result=mintPayments([linkedPayment,linkedReceipt],[{assetId:id,receiptHash:'receipt',paymentHash:'payment',lovelace:'6000000'}]);
assert.equal(result.acquisitions.receipt[id].ada,6);
assert.equal(result.acquisitions.receipt[id].source,'confirmed');
