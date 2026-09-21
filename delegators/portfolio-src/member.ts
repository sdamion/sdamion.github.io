import {validAddress} from './core.ts';
export function validStakeAddress(s:string){
  if(!/^stake1[023456789acdefghjklmnpqrstuvwxyz]{53}$/.test(s))return false;
  const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l',hrp='stake';
  const values=[...hrp].map(c=>c.charCodeAt(0)>>5).concat([0],[...hrp].map(c=>c.charCodeAt(0)&31),[...s.slice(6)].map(c=>alphabet.indexOf(c)));
  let chk=1;const gen=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];
  for(const v of values){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=gen[i];}
  const first=(alphabet.indexOf(s[6])<<3)|(alphabet.indexOf(s[7])>>2);
  return chk===1&&(first===0xe1||first===0xf1);
}
export const validWalletAddress=(s:string)=>validAddress(s)||validStakeAddress(s);
export function sameTrackedAddresses(previous:Record<string,string[]>|undefined,current:Record<string,string[]>){
  if(!previous)return false;
  const flatten=(groups:Record<string,string[]>)=>[...new Set(Object.values(groups).flat())].sort();
  return JSON.stringify(flatten(previous))===JSON.stringify(flatten(current));
}
export function memberWallets(stake:string,saved:unknown){
  if(!validStakeAddress(stake))throw new Error('A verified mainnet stake address is required.');
  const extras=Array.isArray(saved)?saved.filter(w=>w&&typeof w.address==='string'&&validWalletAddress(w.address)&&w.address!==stake&&typeof w.label==='string'):[];
  return [{address:stake,label:'Wallet 1 · Member stake address'},...[...new Map(extras.map(w=>[w.address,w])).values()]];
}
export function resolveWalletGroups(wallets:{address:string}[],accounts:{stake_address:string;addresses:string[]}[]){
  const groups:Record<string,string[]>={};
  for(const wallet of wallets){
    if(validStakeAddress(wallet.address)){
      const rows=accounts.filter(a=>a.stake_address===wallet.address);
      if(!rows.length||rows.some(row=>!Array.isArray(row.addresses)||row.addresses.some(a=>!validAddress(a))))throw new Error('Linked addresses were not returned completely. Saved balances are retained.');
      groups[wallet.address]=[...new Set(rows.flatMap(row=>row.addresses))];
    }else if(validAddress(wallet.address))groups[wallet.address]=[wallet.address];
    else throw new Error('Invalid wallet address.');
  }
  return groups;
}
