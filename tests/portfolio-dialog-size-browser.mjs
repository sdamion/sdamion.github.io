import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.argv[2]);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:950}});
 await page.setContent('<div class="governance-menu-overlay"><div class="governance-dialog governance-dialog-wide portfolio-dialog"><header>Portfolio</header><div id="content" class="member-portfolio"><section class="portfolio-storage-choice">Storage choice</section></div></div></div>');
 await page.addStyleTag({content:await readFile('shared/styles.css','utf8')});
 const dialog=page.locator('.portfolio-dialog');
 let box=await dialog.boundingBox();
 assert.ok(box.width<=520&&box.height<300,'Storage uses a compact content-sized dialog');
 await page.locator('#content').evaluate(node=>node.innerHTML='<main class="member-portfolio"><div style="height:300px">Dashboard</div></main>');
 box=await dialog.boundingBox();
 assert.ok(box.width>1000&&box.height<450,'Dashboard expands without fixed viewport height');
 await page.locator('#content').evaluate(node=>node.innerHTML='<div style="height:1600px">Transactions</div>');
 box=await dialog.boundingBox();
 assert.ok(box.height<=902,'Large content is viewport bounded');
 await page.locator('#content').evaluate(node=>node.innerHTML='<section class="portfolio-storage-choice">Storage choice</section>');
 box=await dialog.boundingBox();
 assert.ok(box.width<=520&&box.height<300,'Returning to storage shrinks the dialog');
 await page.setViewportSize({width:390,height:844});
 box=await dialog.boundingBox();
 assert.ok(Math.abs(box.width-390)<2&&Math.abs(box.height-844)<2,'Mobile stays full screen');
 console.log('PASS: compact storage, dynamic dashboard height, viewport limit, restore and mobile full screen');
}finally{await browser.close();}
