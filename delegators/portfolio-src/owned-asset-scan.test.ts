import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scanOwnedAssets} from './owned-asset-scan.ts';
import type {AssetWallet,OwnedAsset} from './owned-assets.ts';

const signal=new AbortController().signal;
const asset=(chain:OwnedAsset['chain'],id:string):OwnedAsset=>({id:`${chain}:${id}`,chain,standard:'FT',name:id,symbol:id,raw:'1',decimals:0,image:null,explorer:null});
test('each source uses the same validated scan and its own pagination adapter',async()=>{
  const eth:AssetWallet={chain:'ethereum',address:'0x'+'1'.repeat(40),name:'ETH'};
  const ethCalls:object[]=[];
  const ethereum=await scanOwnedAssets(eth,signal,async(endpoint,body)=>{
    assert.equal(endpoint,'/ethereum');ethCalls.push(body);
    const request=body as {kind:string;cursor:unknown};
    return {address:eth.address,assets:request.kind==='tokens'?[asset('ethereum',request.cursor?'second':'first')]:[asset('ethereum','nft')],cursor:request.kind==='tokens'&&!request.cursor?{next:'2'}:null};
  });
  assert.equal(ethereum.length,3);assert.equal(ethCalls.length,3);
  assert.deepEqual((ethCalls[1] as {cursor:unknown}).cursor,{next:'2'});
  const btc:AssetWallet={chain:'bitcoin',address:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT',name:'BTC'};
  const btcCalls:object[]=[];
  const bitcoin=await scanOwnedAssets(btc,signal,async(endpoint,body)=>{
    assert.equal(endpoint,'/bitcoin-ordinals');btcCalls.push(body);
    const request=body as {action:string;page:number};
    return {address:btc.address,assets:[asset('bitcoin',request.action+request.page)],more:request.action==='runes'&&request.page===1};
  });
  assert.equal(bitcoin.length,3);assert.deepEqual(btcCalls.map(call=>(call as {page:number}).page),[1,2,1]);
});
test('invalid ownership and repeated provider cursors cannot return a partial inventory',async()=>{
  const wallet:AssetWallet={chain:'ethereum',address:'0x'+'1'.repeat(40),name:'ETH'};
  await assert.rejects(scanOwnedAssets(wallet,signal,async()=>({address:wallet.address,assets:[asset('bitcoin','wrong')],cursor:null})),/Owned assets unavailable/);
  await assert.rejects(scanOwnedAssets(wallet,signal,async()=>({address:wallet.address,assets:[],cursor:{next:'same'}})),/incomplete/);
});
