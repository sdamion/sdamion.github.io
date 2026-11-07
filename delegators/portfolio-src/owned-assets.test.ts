import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetIsFt,assetIsNft,assetQuantity,mergeOwnedAssets,validOwnedAsset,normalizeOwnedAsset,encodeOwnedAssets,readOwnedAssets,accountKey,type OwnedAsset,type AssetWallet} from './owned-assets.ts';
import {encodeOrdinalsSettings,readOrdinalsSettings} from './ordinals-storage.ts';
const wallet:AssetWallet={chain:'ethereum',address:'0x'+'1'.repeat(40),name:'ETH wallet'},second={...wallet,address:'0x'+'2'.repeat(40),name:'Second'};
const asset:OwnedAsset={id:'ethereum:1:0x'+'3'.repeat(40),chain:'ethereum',standard:'ERC-20',name:'Token',symbol:'TOK',raw:'123456789012345678901234567890',decimals:18,image:null,explorer:null};
test('owned balances remain exact, distinguish networks and NFT instances, and aggregate each owned address once',()=>{
 assert.equal(assetQuantity(asset),'123456789012.34567890123456789');assert.equal(assetQuantity({raw:'1000000',decimals:6}),'1');assert.equal(assetQuantity({raw:'1',decimals:9}),'0.000000001');
 const account=(wallet:AssetWallet,assets:OwnedAsset[])=>({chain:wallet.chain,address:wallet.address,checkedAt:123,assets});
 const data={[accountKey(wallet)]:account(wallet,[asset]),[accountKey(second)]:account(second,[asset])};
 const merged=mergeOwnedAssets(data,[wallet,wallet,second]);assert.equal(merged.length,1);assert.equal(merged[0].raw,String(BigInt(asset.raw)*2n));assert.equal(merged[0].wallets.length,2);
 assert.equal(mergeOwnedAssets(data,[]).length,0);assert.equal(mergeOwnedAssets(data,[second])[0].raw,asset.raw);
});
test('owned inventory is losslessly chunked and fails closed on missing parts or unsafe metadata',()=>{
 assert.equal(validOwnedAsset(asset),true);assert.equal(validOwnedAsset({...asset,image:'javascript:alert(1)'}),false);assert.equal(validOwnedAsset({...asset,explorer:'https://evil.example/'}),false);
 const assets=Array.from({length:2501},(_,id)=>({...asset,id:asset.id+':'+id}));
 const data={[accountKey(wallet)]:{chain:wallet.chain,address:wallet.address,checkedAt:123,assets}},key='tdsp-member-owned-assets:member';
 const settings=encodeOwnedAssets(key,data);assert.deepEqual(readOwnedAssets(key,name=>settings[name]??null),data);
 assert.throws(()=>readOwnedAssets(key,name=>name.endsWith(':0')?null:settings[name]??null));
});
test('decimal Bitcoin token balances from different wallets aggregate without rounding or an invented denomination',()=>{
 const btc:AssetWallet={chain:'bitcoin',address:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT',name:'BTC'},other={...btc,address:'1BitcoinEaterAddressDontSendf59kuE'};
 const row={...asset,id:'bitcoin:brc20:ordi',chain:'bitcoin' as const,standard:'BRC-20',raw:'12345',decimals:2};
 const data={[accountKey(btc)]:{chain:btc.chain,address:btc.address,checkedAt:1,assets:[row]},[accountKey(other)]:{chain:other.chain,address:other.address,checkedAt:1,assets:[{...row,raw:'1',decimals:0}]}};
 assert.equal(assetQuantity(mergeOwnedAssets(data,[btc,other])[0]),'124.45');
 assert.equal(assetQuantity({raw:'12345',decimals:null}),'12345');
});
test('an owned-only Ordinal cache retains its incomplete-history marker across encrypted storage chunks',()=>{
 const address='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',key='tdsp-member-bitcoin-ordinals:member';
 const data={accounts:{[address]:{tip:'0'.repeat(64),checkedAt:123,owned:[],events:[],historyComplete:false}},metadata:{}};
 const settings=encodeOrdinalsSettings(key,data);assert.deepEqual(readOrdinalsSettings(key,name=>settings[name]??null),data);
});
test('ETH and SOL provider artwork is normalized without rejecting ownership or changing exact quantities',()=>{
  for(const chain of ['ethereum','solana'] as const)for(const gateway of ['ipfs.io','dweb.link']){
    const row={...asset,chain,id:chain+':fixture',standard:chain==='ethereum'?'ERC-20':'SPL',image:`https://${gateway}/ipfs/QmExample/art.png`},before=JSON.stringify(row);
    assert.equal(validOwnedAsset(row),false,'the strict cache validator expects canonical artwork');
    const normalized=normalizeOwnedAsset(row)!;assert.equal(normalized.image,'https://gateway.pinata.cloud/ipfs/QmExample/art.png');assert.equal(validOwnedAsset(normalized),true);
    assert.deepEqual({...normalized,image:row.image},row);assert.equal(normalized.raw,asset.raw);assert.equal(JSON.stringify(row),before);
    const wallet:AssetWallet={chain,address:chain==='ethereum'?'0x'+'1'.repeat(40):'11111111111111111111111111111111',name:'Wallet'},data={[accountKey(wallet)]:{chain,address:wallet.address,checkedAt:1,assets:[normalized]}},key='tdsp-member-owned-assets:test';
    const settings=encodeOwnedAssets(key,data);assert.deepEqual(readOwnedAssets(key,name=>settings[name]??null),data);
  }
});
test('registered chain standards classify FTs and NFTs without treating unknown types as NFTs',()=>{
  for(const [chain,ft,nft]of [['ethereum','ERC-20','ERC-721'],['solana','SPL','Compressed NFT'],['bitcoin','Rune','Ordinal']] as const){
    const row={...asset,chain,id:chain+':fixture'};
    assert.equal(assetIsFt({...row,standard:ft}),true);
    assert.equal(assetIsNft({...row,standard:nft}),true);
    assert.equal(validOwnedAsset({...row,standard:'unknown'}),false);
  }
});
test('optional unsafe artwork cannot break an inventory; malformed balances, IDs and explorer targets still fail closed',()=>{
  for(const image of ['javascript:alert(1)','http://example.com/art.png','https://user:secret@example.com/art.png'])assert.equal(normalizeOwnedAsset({...asset,image})?.image,null);
  for(const patch of [{raw:'1.5'},{raw:123},{chain:'unknown'},{id:'wrong-network:asset'},{explorer:'https://evil.example/'},{decimals:999}])assert.equal(normalizeOwnedAsset({...asset,...patch}),null);
  assert.equal(normalizeOwnedAsset(null),null);
});
