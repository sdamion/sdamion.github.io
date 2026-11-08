import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesCexOverlayFilter} from './cex-overlay-filter.ts';
import type {AddressNetwork} from './address-networks.ts';

const filters:Record<AddressNetwork,{in:string;out:string}>={
  cardano:{in:'in',out:'out'},
  ethereum:{in:'eth-in',out:'eth-out'},
  robinhood:{in:'rh-in',out:'rh-out'},
  solana:{in:'sol-in',out:'sol-out'},
  bitcoin:{in:'btc-in',out:'btc-out'}
};

test('CEX overlay applies the same direction rules to every supported network',()=>{
  for(const [network,{in:incoming,out:outgoing}] of Object.entries(filters) as [AddressNetwork,{in:string;out:string}][]){
    assert.equal(matchesCexOverlayFilter(network,'all',[]),false,network);
    assert.equal(matchesCexOverlayFilter(network,incoming,[{side:'buy'}]),true,network);
    assert.equal(matchesCexOverlayFilter(network,outgoing,[{side:'buy'}]),false,network);
    assert.equal(matchesCexOverlayFilter(network,outgoing,[{side:'sell'}]),true,network);
    assert.equal(matchesCexOverlayFilter(network,incoming,[{side:'sell'}]),false,network);
    assert.equal(matchesCexOverlayFilter(network,incoming,[],true),true,network);
    assert.equal(matchesCexOverlayFilter(network,outgoing,[],true),false,network);
    assert.equal(matchesCexOverlayFilter(network,'other',[{side:'sell'}]),false,network);
  }
});

test('a mixed-direction transaction appears in both filters but is not counted twice',()=>{
  assert.equal(matchesCexOverlayFilter('solana','sol-in',[{side:'buy'},{side:'sell'}]),true);
  assert.equal(matchesCexOverlayFilter('solana','sol-out',[{side:'buy'},{side:'sell'}]),true);
  assert.equal(matchesCexOverlayFilter('ethereum','eth-in',[{side:'sell',mined:true}]),true);
  assert.equal(matchesCexOverlayFilter('ethereum','eth-out',[{side:'sell',mined:true}]),false);
});
