import assert from 'node:assert/strict';
import {memberWallets,validStakeAddress,resolveWalletGroups,sameTrackedAddresses} from './member.ts';
import {analyse,liveAdaBasis} from './core.ts';
const stake='stake1u9ex0jtl4nv84rlzwuft5rczy2hgkjygewla04mgy7v2nccx4p4yr';
// Synthetic addresses, never a member's personal wallet history.
function fixtureAddress(seed:number){
  const chars='qpzry9x8gf2tvdw0s3jn54khce6mua7l',hrp='addr',bytes=[1,...Array(56).fill(seed)],words:number[]=[];
  let acc=0,bits=0;for(const byte of bytes){acc=(acc<<8)|byte;bits+=8;while(bits>=5){bits-=5;words.push((acc>>>bits)&31);}}if(bits)words.push((acc<<(5-bits))&31);
  const data=[...hrp].map(c=>c.charCodeAt(0)>>5).concat([0],[...hrp].map(c=>c.charCodeAt(0)&31),words,Array(6).fill(0));
  let chk=1;const gen=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];for(const v of data){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=gen[i];}chk^=1;
  return hrp+'1'+words.concat(Array.from({length:6},(_,i)=>(chk>>>(5*(5-i)))&31)).map(v=>chars[v]).join('');
}
const a=fixtureAddress(1),b=fixtureAddress(2);
assert.equal(sameTrackedAddresses({wallet:[a]},{wallet:[a,b]}),false);
assert.equal(sameTrackedAddresses({wallet:[a,b]},{wallet:[b,a],extra:[a]}),true);
assert.equal(sameTrackedAddresses(undefined,{wallet:[a]}),false);
assert.equal(validStakeAddress(stake),true);assert.equal(validStakeAddress(stake.slice(0,-1)+'x'),false);
const wallets=memberWallets(stake,[{address:b,label:'Savings'},{address:stake,label:'Modified'},{address:b,label:'Savings'}]);
assert.equal(wallets[0].address,stake);assert.equal(wallets[0].label,'Wallet 1 · Member stake address');assert.equal(wallets.length,2);
assert.deepEqual(memberWallets(stake,null),[{address:stake,label:'Wallet 1 · Member stake address'}]);
const groups=resolveWalletGroups(wallets,[{stake_address:stake,addresses:[a,b]}]);
assert.deepEqual(resolveWalletGroups([{address:stake}],[{stake_address:stake,addresses:[a]},{stake_address:stake,addresses:[b,a]}])[stake],[a,b]);
const owned=new Set(Object.values(groups).flat());assert.equal(owned.size,2);
assert.throws(()=>resolveWalletGroups(wallets,[]),/completely/);
const io=(address:string,value:string)=>({payment_addr:{bech32:address},value});
const f=analyse({tx_hash:'internal',tx_timestamp:1,fee:'200000',inputs:[io(a,'10000000')],outputs:[io(b,'9800000')]},owned);
assert.equal(f.internal,true);assert.equal(f.adaRaw,'-200000');assert.equal(liveAdaBasis([f],{},'9800000',false).receiptCount,0);
console.log('PASS: verified primary stake wallet, settings isolation, address resolution, overlap deduplication and internal-transfer basis.');
