// Published mainnet addresses and registered validator identities. Shared contracts are
// never evidence of portfolio ownership or permission to apply the CEX rule.
const source='https://github.com/minswap/sdk/blob/main/src/types/constants.ts';
type KnownDex={name:string;role:string;source:string}&({address:string;scriptHash?:never}|{scriptHash:string;address?:never});
export const knownDexAddresses:readonly KnownDex[]=[
  {name:'Minswap V1',role:'Order contract',address:'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70',source},
  {name:'Minswap Stableswap · DJED / iUSD',role:'Order contract',address:'addr1w9xy6edqv9hkptwzewns75ehq53nk8t73je7np5vmj3emps698n9g',source},
  {name:'Minswap Stableswap · USDC / DJED',role:'Order contract',address:'addr1w93d8cuht3hvqt2qqfjqgyek3gk5d6ss2j93e5sh505m0ng8cmze2',source},
  {name:'Minswap Stableswap · USDM / iUSD',role:'Order contract',address:'addr1wxtv9k2lcum5pmcc4wu44a5tufulszahz84knff87wcawycez9lug',source},
  {name:'Minswap Stableswap · DJED / USDM',role:'Order contract',address:'addr1wxr9ppdymqgw6g0hvaaa7wc6j0smwh730ujx6lczgdynehsguav8d',source},
  {name:'MuesliSwap V1.1',role:'Orderbook contract',address:'addr1wy2mjh76em44qurn5x73nzqrxua7ataasftql0u2h6g88lc3gtgpz',source:'https://github.com/MuesliSwapTeam/muesliswap-cardano-contracts/blob/main/order_validator_v1.1.addr'},
  {name:'MuesliSwap V4',role:'Orderbook contract',scriptHash:'00fb107bfbd51b3a5638867d3688e986ba38ff34fb738f5bd42b20d5',source:'https://github.com/StricaHQ/cardano-contracts-registry/blob/master/projects/muesliswap.json'},
  {name:'SundaeSwap V1',role:'Escrow contract',scriptHash:'ba158766c1bae60e2117ee8987621441fac66a5e0fb9c7aca58cf20a',source:'https://api.sundae.fi/graphql'},
  {name:'SundaeSwap V3',role:'Order contract',scriptHash:'fa6a58bbe2d0ff05534431c8e2f0ef2cbdc1602a8456e4b13c8f3077',source:'https://api.sundae.fi/graphql'},
  {name:'SundaeSwap V4',role:'Order contract',scriptHash:'07eb2fb09d9dd6603870ce6f84c8f8506249152173ddf0c77f1f07ec',source:'https://api.sundae.fi/graphql'},
  {name:'SundaeSwap Stableswap',role:'Order contract',scriptHash:'6ab62945d0d8d6288e243b3b6437ff9c099a38e088288f5a6b7c5e8b',source:'https://api.sundae.fi/graphql'},
  {name:'DexHunter',role:'Stop-loss contract V1 · aggregator',scriptHash:'6ec4acc3fbbd570ada625f24902777cec5d7a349fa0f3c7ba87b0cff',source:'https://github.com/StricaHQ/cardano-contracts-registry/blob/master/projects/dexhunter.json'},
  {name:'CSwap',role:'Order contract V1',scriptHash:'da5b47aed3955c9132ee087796fa3b58a1ba6173fa31a7bc29e56d4e',source:'https://github.com/StricaHQ/cardano-contracts-registry/blob/master/projects/cswap.json'},
  {name:'CSwap',role:'Pool contract V1',scriptHash:'ed97e0a1394724bb7cb94f20acf627abc253694c92b88bf8fb4b7f6f',source:'https://github.com/StricaHQ/cardano-contracts-registry/blob/master/projects/cswap.json'},
];

export function knownDexIdentity(entry:KnownDex){
  const value=entry.address??entry.scriptHash;
  return {value,label:entry.address?'address':'script hash',url:`https://cardanoscan.io/${entry.address?'address':'script'}/${value}`};
}
