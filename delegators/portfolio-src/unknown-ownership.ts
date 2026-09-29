import type {Detail,Fact,Tx} from './core.ts';

export function unknownOwnership(txs:Tx[],facts:Record<string,Fact>,addresses:Set<string>):Tx[]{
  return [...new Map(txs.filter(tx=>!facts[tx.tx_hash]?.wallets.some(address=>addresses.has(address))).map(tx=>[tx.tx_hash,tx])).values()].sort((a,b)=>b.block_time-a.block_time);
}

export function verifyOwnership(detail:Detail,hash:string,address:string,owned:Set<string>):void{
  if(detail.tx_hash!==hash||!owned.has(address)||![...detail.inputs,...detail.outputs].some(io=>io.payment_addr?.bech32===address)){
    throw new Error('This transaction does not contain the selected tracked wallet address. No ownership or amounts were changed.');
  }
}
