import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStaticPath } from '../dev-server.mjs';

test('local preview serves website assets but not repository internals', () => {
    for (const asset of ['/', '/index.html', '/shared/runtime.js', '/locales/nl.toml', '/favicon.png', '/delegators/portfolio/app.js']) {
        assert.ok(getStaticPath(asset), asset);
    }
    for (const asset of ['/.git/config', '/%2egit/config', '/.env', '/shared/.env.json', '/package-lock.json', '/node_modules/react/index.js', '/tests/tile-refresh.test.mjs', '/delegators/portfolio-src/App.tsx', '/dev-server.mjs', '/../index.html', '/%2e%2e/index.html', '/shared%5c..%5c.git/config', '/favicon.png%00', '/%zz']) {
        assert.equal(getStaticPath(asset), null, asset);
    }
});
