import assert from 'node:assert/strict';
import {assetImageUrl} from './asset-image.ts';
assert.equal(assetImageUrl('ipfs://bafyabc/image.png'),'https://ipfs.io/ipfs/bafyabc/image.png');
assert.equal(assetImageUrl(['ipfs://ipfs/','Qmabc']),'https://ipfs.io/ipfs/Qmabc');
assert.equal(assetImageUrl('https://asset-logos.minswap.org/token'),'https://asset-logos.minswap.org/token');
for(const input of ['',null,{},'javascript:alert(1)','http://example.com/image','https://user:secret@example.com/image'])assert.equal(assetImageUrl(input),null);
