import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('transaction pipeline and completed cache are saved before optional token metadata',()=>{
  const source=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
  const pipeline=source.indexOf('await runPipeline<Tx>');
  const complete=source.indexOf('next.complete=next.txs.every',pipeline);
  const persisted=source.indexOf('await persist()',complete);
  const metadata=source.indexOf("portfolioFetch('/api/markets'");
  assert.ok(pipeline>0&&complete>pipeline&&persisted>complete&&metadata>persisted);
  assert.match(source.slice(metadata,source.indexOf('await flushVault()',metadata)),/signal.throwIfAborted\(\);\s*warnings.push/);
});
