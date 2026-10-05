import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('delegators/portfolio-src');
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild');
const {chromium}=await import(process.argv[2]);
const bundle=await build({stdin:{contents:`
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {TransactionFilters} from './TransactionFilters';
import {TransactionPagination} from './TransactionPagination';
function Fixture(){
 const [page,setPage]=useState(0),[query,setQuery]=useState(''),[filter,setFilter]=useState('all');
 const [dates,setDates]=useState(['','']);
 return <><TransactionFilters id="fixture" query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} dateFrom={dates[0]} dateTo={dates[1]} onDates={(from,to)=>setDates([from,to])} options={{all:'All',in:'ADA IN',out:'ADA OUT'}} pagination={<TransactionPagination page={page} count={201} onPage={setPage} position="top"/>}/>
 <TransactionPagination page={page} count={201} onPage={setPage} position="bottom"/>
 <TransactionPagination page={0} count={26} pageSize={25} onPage={()=>{}} position="bottom"/>
 <TransactionPagination page={0} count={0} onPage={()=>{}} position="bottom"/>
 <output>{query}|{filter}|{dates.join('|')}</output></>;
}
createRoot(document.getElementById('app')).render(<Fixture/>);
`,loader:'tsx',resolveDir:source},bundle:true,write:false,format:'esm',jsx:'automatic'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent('<div id="app" class="member-portfolio"></div>');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 await page.addScriptTag({type:'module',content:bundle.outputFiles[0].text});
 const toolbar=page.getByRole('region',{name:'Transaction search options'});
 const top=toolbar.getByRole('navigation');
 await top.getByText('Page 1/3',{exact:true}).waitFor();
 const positions=await toolbar.locator(':scope > *').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().top));
 assert.ok(Math.max(...positions)-Math.min(...positions)<3,'dates, search, filters and pagination align on one desktop row');
 assert.equal(await top.getByRole('button',{name:'First page',exact:true}).isDisabled(),true);
 await top.getByRole('button',{name:'Next page',exact:true}).click();
 await top.getByText('Page 2/3',{exact:true}).waitFor();
 await top.getByRole('button',{name:'Last page',exact:true}).click();
 await top.getByText('Page 3/3',{exact:true}).waitFor();
 assert.equal(await top.getByRole('button',{name:'Next page',exact:true}).isDisabled(),true);
 await top.getByRole('button',{name:'Previous page',exact:true}).click();
 await top.getByText('Page 2/3',{exact:true}).waitFor();
 await top.getByRole('button',{name:'First page',exact:true}).click();
 await top.getByText('Page 1/3',{exact:true}).waitFor();
 assert.equal(await page.getByText('Page 1/2',{exact:true}).count(),1,'Byron uses the same pager with 25 rows');
 const empty=page.getByRole('navigation').last();
 assert.equal(await empty.getByText('Page 1/1',{exact:true}).count(),1);
 assert.equal(await empty.locator('button:disabled').count(),4);
 await toolbar.locator('input[type="date"]').first().fill('2024-01-01');
 await toolbar.locator('input[type="date"]').last().fill('2024-12-31');
 await toolbar.getByRole('button',{name:'Clear dates'}).click();
 await toolbar.locator('.search-input').fill('ADA');
 await toolbar.getByRole('button',{name:'ADA OUT',exact:true}).click();
 assert.equal(await page.locator('output').innerText(),'ADA|out||');
 await page.screenshot({path:'/tmp/portfolio-toolbar-desktop.png',fullPage:true});
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile toolbar has no horizontal scrolling');
   assert.ok(await top.locator('ul').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'pager fits on one line');
 }
 await page.screenshot({path:'/tmp/portfolio-toolbar-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: shared compact pager, boundaries, Byron page size, functional controls and responsive toolbar.');
}finally{await browser.close();}
