import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('only the admin dashboard offers Portfolio and user access grants are absent',()=>{
  const source=readFileSync(new URL('../delegators/delegator-dashboard-template.js',import.meta.url),'utf8');
  assert.equal((source.match(/id="member-portfolio-open"/g)||[]).length,1);
  assert.ok(!source.includes('Wallet transactions, average ADA cost and gain / loss'));
  assert.ok(!source.includes('id="portfolio-access-open"'));
  assert.ok(source.includes('Your stake wallet and portfolio'));
});
