import {test} from 'node:test';
import assert from 'node:assert/strict';
import {uniqueTileMessages} from './tile-messages.ts';

test('tile messages remove empty and duplicate text, retaining error severity and order',()=>{
  const messages=[{text:' Checking Ethereum transactions… '},{text:''},{text:'Checking Ethereum transactions…'},{text:'Provider unavailable'},{text:'Provider unavailable',error:true},{text:'Checking Solana transactions…'}];
  assert.deepEqual(uniqueTileMessages(messages),[
    {text:'Checking Ethereum transactions…',error:false},
    {text:'Provider unavailable',error:true},
    {text:'Checking Solana transactions…',error:false}
  ]);
  assert.equal(messages[0].text,' Checking Ethereum transactions… ','source state stays unchanged');
});
