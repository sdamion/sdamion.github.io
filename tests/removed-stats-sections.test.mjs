import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('removed stats sections have no navigation or periodic refresh tasks',()=>{
  const html=read('index.html'),home=read('home/index.js');
  for(const id of ['pool','drep'])assert.doesNotMatch(html,new RegExp('(?:id|href)="#?'+id+'"'));
  for(const key of ['pool','mithril','leader-schedule'])assert.ok(!home.includes("{ key: '"+key+"'"));
  assert.match(home, /\{ key: 'starch-pools', callback: fetchStarchPoolStatus, interval: 300000, options: \{ selector: '#starch' \} \}/);
  for(const id of ['governance','starch','calendar'])assert.ok(html.includes('id="'+id+'"'));
  assert.ok(!JSON.parse(read('ai-knowledge.json')).entries.some(entry=>['spo','drep'].includes(entry.id)));
});
