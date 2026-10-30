import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Portfolio releases invalidate the dashboard and outer script cache together',()=>{
  const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const bundle=read('delegators/delegator-access.js').match(/import\('\.\/portfolio\/app\.js\?v=([^']+)'\)/)?.[1];
  const dashboard=read('home/index.js').match(/loadScript\('delegators\/delegator-access\.js\?v=([^']+)'/)?.[1];
  const home=read('index.html').match(/src="home\/index\.js\?v=([^"]+)"/)?.[1];
  assert.ok(bundle,'Portfolio import has a release version');
  assert.equal(dashboard,bundle,'dashboard loader must invalidate its cached access script');
  assert.equal(home,bundle,'entry page must invalidate its cached dashboard loader');
});
