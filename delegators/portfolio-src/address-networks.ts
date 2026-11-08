export type AddressNetwork='cardano'|'ethereum'|'robinhood'|'solana'|'bitcoin';
export type NativeAddressNetwork=Exclude<AddressNetwork,'cardano'>;

export const addressNetworks={
  cardano:{name:'Cardano',symbol:'ADA',decimals:6,precision:6,swap:true,limit:null,placeholder:'addr1…, stake1…, DdzFF… or Ae2…'},
  ethereum:{name:'Ethereum',symbol:'ETH',decimals:18,precision:8,swap:true,limit:20,placeholder:'0x…'},
  robinhood:{name:'Robinhood Chain',symbol:'ETH',decimals:18,precision:8,swap:true,limit:20,placeholder:'0x…'},
  solana:{name:'Solana',symbol:'SOL',decimals:9,precision:9,swap:false,limit:20,placeholder:'Solana address'},
  bitcoin:{name:'Bitcoin',symbol:'BTC',decimals:8,precision:8,swap:false,limit:null,placeholder:'bc1…, 1… or 3…'}
} as const;
