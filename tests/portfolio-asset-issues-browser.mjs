import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';

const source=path.resolve('delegators/portfolio-src'),require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild'),{chromium}=await import(process.argv[2]||'playwright');
const bundle=await build({stdin:{resolveDir:source,loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {AssetIssues} from './AssetIssues';
function Fixture(){
  const [settings,setSettings]=useState({}),[included,setIncluded]=useState(false);
  window.settings=settings;window.included=included;
  return <AssetIssues issues={[
    {id:'cardano:token',name:'Test Token',network:'ADA',missingPrice:true,missingCost:true,missingDecimals:true,excluded:false,details:true},
    {id:'bitcoin:native',name:'Bitcoin',network:'BTC',missingPrice:true,missingCost:false,missingDecimals:false,editablePrice:false,excluded:!included,details:false}
  ]} settings={settings} scanIncomplete missingTransfers={2} busy={false}
    onSetting={(id,field,value)=>setSettings(previous=>({...previous,[id]:{...previous[id],[field]:value}}))}
    onDetails={id=>{window.action='details:'+id;}} onAddresses={()=>{window.action='addresses';}} onTransactions={()=>{window.action='transactions';}} onFlows={()=>{window.action='flows';}}
    onInclude={id=>{window.action='include:'+id;setIncluded(true);}} onRefresh={()=>{window.action='refresh';}}/>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1100,height:800}});
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<div id="app"></div>'}));
  await page.goto('http://127.0.0.1:8996/');
  await page.evaluate(()=>{window.TDSPI18n={translateText:text=>text};});
  await page.addScriptTag({content:bundle.outputFiles[0].text,type:'module'});
  const token=page.locator('tr[data-asset-issue="cardano:token"]');
  await token.waitFor();
  assert.match(await token.innerText(),/Token decimals.*Current price.*Purchase cost/);
  const menu=token.getByRole('combobox',{name:'Actions for Test Token'});
  await menu.selectOption('price');
  await token.getByRole('spinbutton',{name:'Current USD price for Test Token'}).fill('1.5');
  assert.equal(await page.evaluate(()=>window.settings['cardano:token'].price),'1.5');
  await menu.selectOption('average');
  await token.getByRole('spinbutton',{name:'Average buy price in USD for Test Token'}).fill('0.7');
  assert.equal(await page.evaluate(()=>window.settings['cardano:token'].average),'0.7');
  await menu.selectOption('decimals');
  await token.getByRole('spinbutton',{name:'Token decimals for Test Token'}).fill('6');
  assert.equal(await page.evaluate(()=>window.settings['cardano:token'].decimals),'6');
  await menu.selectOption('addresses');
  assert.equal(await page.evaluate(()=>window.action),'addresses');
  await menu.selectOption('flows');
  assert.equal(await page.evaluate(()=>window.action),'flows');
  await menu.selectOption('details');
  assert.equal(await page.evaluate(()=>window.action),'details:cardano:token');
  const bitcoin=page.locator('tr[data-asset-issue="bitcoin:native"]');
  const btcMenu=bitcoin.getByRole('combobox',{name:'Actions for Bitcoin'});
  assert.equal(await btcMenu.locator('option[value="price"]').count(),0,'native quote cannot be edited here');
  await btcMenu.selectOption('include');
  assert.equal(await page.evaluate(()=>window.included),true);
  await page.getByRole('button',{name:'Refresh owned assets'}).click();
  assert.equal(await page.evaluate(()=>window.action),'refresh');
  console.log('PASS: asset issue actions edit only local settings, route IN/OUT review, and keep native quotes read-only.');
}finally{await browser.close();}
