import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const context={window:{}};
vm.runInNewContext(read('shared/portfolio-i18n-keys.js'),context);
vm.runInNewContext(read('shared/portfolio-i18n.js'),context);
const entries=context.window.TDSPPortfolioTranslationKeys;
const parameters=value=>[...value.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();

test('Portfolio locale catalogs have unique keys and matching template parameters',()=>{
 assert.equal(new Set(entries.map(([source])=>source)).size,entries.length);
 assert.equal(new Set(entries.map(([,key])=>key)).size,entries.length);
 for(const language of ['nl','ja','es']){
  const lines=read(`locales/${language}.toml`).split('\n');
  const strings=new Map();
  for(const line of lines){
   const match=line.match(/^(portfolio_text_\w+)\s*=\s*(".*")\s*$/);
   if(!match)continue;
   assert.ok(!strings.has(match[1]),`duplicate ${language}/${match[1]}`);
   strings.set(match[1],JSON.parse(match[2]));
  }
  assert.equal(strings.size,entries.length);
  for(const [source,key] of entries){
   assert.ok(strings.get(key),`missing ${language}/${key}`);
   assert.deepEqual(parameters(strings.get(key)),parameters(source),`parameters ${language}/${key}`);
  }
 }
});

test('Every Portfolio guide paragraph is present in the shared catalog',()=>{
 const sources=new Set(entries.map(([source])=>source));
 for(const match of read('delegators/portfolio-src/PortfolioGuide.tsx').matchAll(/<p>(.*?)<\/p>/g)){
  assert.ok(sources.has(match[1]),match[1]);
 }
});

test('Ethereum provider and universal timeout errors translate in every Portfolio language',()=>{
 const messages=[
  'Etherscan daily API limit reached. Saved Ethereum data is retained; retry later.',
  'Etherscan usage counter unavailable. Saved Ethereum data is retained.',
  'Ethereum history did not match the requested wallet.',
  'Portfolio ethereum request timed out after 75 seconds. Your cached data is retained; please retry.',
  'Portfolio historical-eth-prices request timed out after 75 seconds. Your cached data is retained; please retry.'
 ];
 for(const language of ['nl','ja','es']){
  const dictionary=Object.fromEntries(read(`locales/${language}.toml`).split('\n').flatMap(line=>{
   const match=line.match(/^(portfolio_text_\w+)\s*=\s*(".*")\s*$/);
   return match?[[match[1],JSON.parse(match[2])]]:[];
  }));
  for(const message of messages){
   const translated=context.window.TDSPPortfolioI18n.translate(message,dictionary);
   assert.ok(translated,`${language}: ${message}`);
   assert.notEqual(translated,message);
   if(message.includes('historical-eth-prices'))assert.ok(translated.includes('historical-eth-prices'));
  }
 }
});
