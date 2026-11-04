import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {normalizeCexAddresses,cexAdaTransfer,cexTimeline,cexUsdNetPosition,isCexTransaction} from '../delegators/portfolio-src/cex.ts';
import {matchesGainLossTransfer} from '../delegators/portfolio-src/gain-loss-filter.ts';
import {cardanoCexCandidate,manualCexFlow} from '../delegators/portfolio-src/manual-cex.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(new URL('../delegators/portfolio-src/package.json',import.meta.url));
const {build}=require('esbuild');
const compiled=await build({absWorkingDir:root,entryPoints:['delegators/portfolio-src/cardano-refresh.ts'],bundle:true,write:false,format:'esm',platform:'node',
  alias:{'@/lib/portfolio':root+'delegators/portfolio-src/core.ts','@/lib/portfolio-cache':root+'delegators/portfolio-src/cache.ts'},
  plugins:[{name:'isolated-cex-flow',setup(build){
    build.onLoad({filter:/\/cache\.ts$/},()=>({contents:`export async function readCache(){return globalThis.cexFlowFixture.cached;} export const readRefreshCache=readCache; export async function saveCache(key,data){globalThis.cexFlowFixture.cached=structuredClone(data);globalThis.cexFlowFixture.saves++;}`,loader:'js'}));
    build.onLoad({filter:/\/transport\.ts$/},()=>({contents:'export const portfolioFetch=(...args)=>globalThis.cexFlowFixture.fetch(...args);',loader:'js'}));
    build.onLoad({filter:/\/vault\.ts$/},()=>({contents:'export async function flushVault(){}',loader:'js'}));
  }}]});
const {refreshCardanoPortfolio}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('saved CEX address survives discovery, analysis, cache roundtrip and both direction filters',async()=>{
  const stake='stake1uxythldc4nmx45tvnwsqu4h5pyjd94udytm6f0tgnr44vecjd8vel';
  const owned='addr1qx305ezuv38ltzrk6kqspakj55l4mv7zmzzauypv530guyygh07m3t8kdtgkexaqpet0gzfy6ttc6ghh5j7k3x8t2ens7pgdc0';
  const exchange='addr1q99u68080mhnj34s78e5f2jwgarl342aj70jkleffze93k4l7csm4qlkawkyf9j34kh7sljq8d0mqn8kjypxrs38g78qqvfkfn';
  const time=1700000000,day=new Date(time*1000).toISOString().slice(0,10);
  const io=(address,value)=>({payment_addr:{bech32:address},value,stake_addr:null,asset_list:[]});
  // Controlled transfers, not a claim that these events occurred on-chain.
  const details=[
    {tx_hash:'1'.repeat(64),tx_timestamp:time,fee:'200000',marketplace_version:3,inputs:[io(exchange,'100200000')],outputs:[io(owned,'100000000')]},
    {tx_hash:'2'.repeat(64),tx_timestamp:time+1,fee:'200000',marketplace_version:3,inputs:[io(owned,'100000000')],outputs:[io(exchange,'40000000'),io(owned,'59800000')]},
    {tx_hash:'3'.repeat(64),tx_timestamp:time+2,fee:'200000',marketplace_version:3,inputs:[io('unlisted-counterparty','2200000')],outputs:[io(owned,'2000000')]}
  ];
  const transactions=details.map(row=>({tx_hash:row.tx_hash,block_time:row.tx_timestamp,block_height:1}));
  const requests=[];
  globalThis.cexFlowFixture={cached:null,saves:0,fetch:async(path,options={})=>{
    if(path==='/api/price')return Response.json({cardano:{usd:1}});
    if(path==='/api/historical-prices')return Response.json({prices:[[Date.parse(day),1]]});
    assert.equal(path,'/api/cardano');
    const request=JSON.parse(options.body);requests.push(request);
    if(request.path==='account_addresses')return Response.json([{stake_address:stake,addresses:[owned]}]);
    if(request.path==='address_info')return Response.json([{address:owned,balance:'61800000',utxo_set:[]}]);
    if(request.path==='address_txs')return Response.json(transactions);
    assert.equal(request.path,'tx_info');assert.equal(request.body._inputs,true);
    return Response.json(details.filter(row=>request.body._tx_hashes.includes(row.tx_hash)));
  }};
  let shown;
  const callbacks=Object.fromEntries(['setStatus','setNotice','setCacheNotice','setInitialising','setAnalysis','setCounting','setCounted','setTransactionStatus','setLiveQuote'].map(name=>[name,()=>{}]));
  try{
    await refreshCardanoPortfolio({wallets:[{address:stake,label:'Owned wallet'}],key:stake+'::test',excludedRefresh:new Set(),fullScan:false,signal:new AbortController().signal,isCurrent:()=>true,callbacks:{...callbacks,setSnapshot:value=>{shown=value;}}});
    const saved=JSON.parse(JSON.stringify([{address:exchange,name:'Saved CEX'}]));
    const entries=normalizeCexAddresses(saved);
    const facts=Object.values(globalThis.cexFlowFixture.cached.facts);
    assert.equal(shown.complete,true);assert.equal(shown.txs.length,3);assert.equal(facts.length,3);
    assert.ok(globalThis.cexFlowFixture.saves>0);
    assert.deepEqual(cexAdaTransfer(facts.find(row=>row.hash===details[0].tx_hash),entries),{side:'buy',raw:100000000n});
    assert.deepEqual(cexAdaTransfer(facts.find(row=>row.hash===details[1].tx_hash),entries),{side:'sell',raw:40000000n});
    assert.equal(facts.filter(row=>isCexTransaction(row,entries)).length,2,'main CEX filter retains IN and OUT');
    for(const [filter,count] of [['all',2],['in',1],['out',1]])assert.equal(facts.filter(row=>matchesGainLossTransfer(row,entries,filter)).length,count);
    assert.equal(cexTimeline(facts,entries,{[day]:1}).length,2);
    const unclassified=facts.find(row=>row.hash===details[2].tx_hash);
    const candidate=cardanoCexCandidate(unclassified,[{address:stake,label:'Owned wallet'}],shown.groups);
    assert.equal(candidate.choices[0].address,stake,'stake-root wallet remains selectable after address discovery');
    assert.deepEqual(manualCexFlow(candidate,stake,1),{network:'cardano',hash:details[2].tx_hash,time:time+2,side:'buy',amount:2,address:stake,usd:2});
    assert.equal(manualCexFlow(candidate,stake,1,true),null,'automatic CEX rows cannot be counted twice');
    const totals=cexUsdNetPosition(facts,entries,'61800000',{[day]:1},1);
    assert.equal(totals.boughtUsd,100);assert.equal(totals.soldUsd,40);
    assert.ok(requests.filter(row=>row.path==='address_txs').every(row=>row.body._addresses.includes(owned)&&!row.body._addresses.includes(exchange)),'exchange-wide funds never become owned history');
    assert.deepEqual(saved,[{address:exchange,name:'Saved CEX'}]);
  }finally{delete globalThis.cexFlowFixture;}
});
