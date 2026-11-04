import assert from 'node:assert/strict';
import {test} from 'node:test';
import {bitcoinCexCandidate,ethereumCexCandidate,solanaCexCandidate,cardanoCexCandidate,manualCexFlow,manualCexKey,readManualCexDecisions} from './manual-cex.ts';
import type {Fact} from './core.ts';

test('a mixed-input Bitcoin transaction can be reviewed from either saved wallet without changing chain data',()=>{
  const sender='3NRqmZ6pRPGUUsp2XK4dwo68G1UoR21Jky',destination='1N5D2vfM7wSagfzbdCbEuDXUsyGJMrLUxK';
  const tx={hash:'c4ce313f2b4ba8eff8cf1c77fde090e9ab11d9595eccebc5fd512938566c8e64',height:655289,time:1604445086,feeRaw:'66752',inputs:[{address:sender,raw:'10104651'},{address:'34J9crSscqrEAgQ7MtXexQHpgaa3f9Za1r',raw:'111205'}],outputs:[{address:destination,raw:'10149104'}]};
  const before=structuredClone(tx),candidate=bitcoinCexCandidate(tx,[{address:sender,name:'Personal'},{address:destination,name:'CEX',personalType:'cex'}])!;
  assert.equal(candidate.choices[0].address,destination,'personal CEX address is preferred when several owned addresses are present');
  const flow=manualCexFlow(candidate,destination,100000)!;
  assert.deepEqual({...flow,usd:Math.round(flow.usd!*1000)/1000},{network:'bitcoin',hash:'btc:'+tx.hash,time:tx.time,side:'buy',amount:0.10149104,address:destination,usd:10149.104});
  assert.equal(manualCexFlow(candidate,sender,null)?.side,'sell');
  assert.equal(manualCexFlow(candidate,'unknown',100000),null);
  assert.equal(manualCexFlow(candidate,destination,100000,true),null,'an automatic CEX transfer is never counted twice');
  assert.deepEqual(tx,before);
});

test('the same explicit choice resolves ADA, ETH and SOL directions from native on-chain amounts',()=>{
  const ada:Fact={hash:'ada',time:1,adaRaw:'-102000000',feeRaw:'2000000',internal:false,assets:{},decimals:{},wallets:['stake'],swapCandidate:false};
  assert.deepEqual(manualCexFlow(cardanoCexCandidate(ada,[{address:'stake',label:'ADA wallet'}])!,'stake',0.5)?.amount,100);
  const eth=ethereumCexCandidate({id:'eth:normal',hash:'eth',kind:'normal',block:1,time:1,from:'0x1',to:'0x2',valueWei:'2000000000000000000',feeWei:'1',failed:false},[{address:'0x1',name:'From'},{address:'0x2',name:'To'}])!;
  assert.equal(manualCexFlow(eth,'0x1',2000)?.side,'sell');
  assert.equal(manualCexFlow(eth,'0x2',2000)?.side,'buy');
  const sol=solanaCexCandidate({hash:'sol',slot:1,time:1,payer:'A',feeRaw:'1',failed:false,transfers:[{from:'A',to:'B',raw:'1000000000'}]},[{address:'A',name:'From'},{address:'B',name:'To'}])!;
  assert.equal(manualCexFlow(sol,'A',100)?.side,'sell');
  assert.equal(manualCexFlow(sol,'B',100)?.side,'buy');
});

test('Cardano uses the same per-wallet choice for multi-address and internal transfers',()=>{
  const fact:Fact={hash:'internal-ada',time:2,adaRaw:'-2000000',feeRaw:'2000000',internal:true,assets:{},decimals:{},wallets:['own-child','cex-child'],swapCandidate:false,source:{tx_hash:'internal-ada',tx_timestamp:2,fee:'2000000',inputs:[{payment_addr:{bech32:'own-child'},value:'102000000'}],outputs:[{payment_addr:{bech32:'cex-child'},value:'100000000'}]}};
  const candidate=cardanoCexCandidate(fact,[{address:'own-root',label:'Personal'},{address:'cex-root',label:'Personal CEX',personalType:'cex'}],{'own-root':['own-child'],'cex-root':['cex-child']})!;
  assert.equal(candidate.choices[0].address,'cex-root');
  assert.deepEqual(candidate.choices.map(row=>[row.address,row.raw]),[['cex-root','100000000'],['own-root','-100000000']]);
  assert.equal(manualCexFlow(candidate,'cex-root',0.5)?.side,'buy');
  assert.equal(manualCexFlow(candidate,'own-root',0.5)?.side,'sell');
});

test('review settings accept only scoped transaction keys and addresses',()=>{
  const key=manualCexKey('bitcoin','abc');
  assert.deepEqual(readManualCexDecisions({[key]:'wallet','other:abc':'wallet','bitcoin:bad space':'wallet','bitcoin:x':'', 'solana:tx':4}),{[key]:'wallet'});
});
