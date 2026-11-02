import type {AddressNetwork} from './address-networks.ts';

export type CexOverlayTransfer={side:'buy'|'sell';mined?:boolean};

const networkFilter:Record<AddressNetwork,{in:string;out:string}>={
  cardano:{in:'in',out:'out'},
  ethereum:{in:'eth-in',out:'eth-out'},
  solana:{in:'sol-in',out:'sol-out'},
  bitcoin:{in:'btc-in',out:'btc-out'}
};

export function matchesCexOverlayFilter(network:AddressNetwork,filter:string,transfers:readonly CexOverlayTransfer[],deposit=false):boolean{
  const incoming=deposit||transfers.some(row=>row.side==='buy'||row.mined===true);
  const outgoing=transfers.some(row=>row.side==='sell'&&row.mined!==true);
  if(!incoming&&!outgoing)return false;
  return filter==='all'||filter===networkFilter[network].in&&incoming||filter===networkFilter[network].out&&outgoing;
}
