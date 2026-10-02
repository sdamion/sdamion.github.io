import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { request } from 'node:http';
import { server } from '../dev-server.mjs';

const outside = await mkdtemp(join(tmpdir(), 'tdsp-private-'));
const publicDir = await mkdtemp(new URL('../security-check-', import.meta.url).pathname);
try {
    await writeFile(join(outside, 'secret.json'), '{"private":true}');
    await symlink(join(outside, 'secret.json'), join(publicDir, 'image.json'));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const path of ['/.git/config', '/.env', '/package-lock.json', `/${publicDir.split('/').at(-1)}/image.json`]) {
        const response = await fetch(base + path);
        assert.equal(response.status, 403, path);
        await response.text();
    }
    for (const headers of [{ Host: 'attacker.example' }, { Origin: 'https://attacker.example' }]) {
        const status = await new Promise((resolve, reject) => {
            const req = request(base + '/', { headers }, res => {
                res.resume();res.on('end', () => resolve(res.statusCode));
            });
            req.on('error', reject);req.end();
        });
        assert.equal(status, 403, JSON.stringify(headers));
    }
    const response = await fetch(base + '/');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(await response.text(), /The Dutch Stake Pool/);
    console.log('Local preview HTTP security checks passed');
} finally {
    await new Promise(resolve => server.close(resolve));
    await rm(publicDir, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
}
