import {validAddress,type Fact,type Wallet} from './core.ts';
import {validByronAddress} from './byron-address.ts';
import {ethereumTransactions,type EthereumData,type EthereumWallet} from './ethereum.ts';
import type {SwapPair} from './cross-chain-swaps.ts';

function add<T extends {address:string;swapAddresses?:string[]}>(wallet:T,addresses:string[]):T{
  const links=[...new Set([...wallet.swapAddresses||[],...addresses])].filter(address=>address!==wallet.address).slice(0,200);
  return links.length===(wallet.swapAddresses||[]).length?wallet:{...wallet,swapAddresses:links};
}

// Store counterparties as service metadata, never as newly owned/scanned wallets.
export function learnMatchedSwapAddresses(pairs:SwapPair[],facts:Fact[],cardano:Wallet[],groups:Record<string,string[]>,owned:Set<string>,data:EthereumData,ethereum:EthereumWallet[]){
  let nextCardano=cardano,nextEthereum=ethereum;
  const byHash=new Map(facts.map(fact=>[fact.hash,fact])),byId=new Map(ethereumTransactions(data,ethereum).map(tx=>[tx.id,tx]));
  for(const pair of pairs){
    const hashes='cardanoReturn' in pair?[pair.cardano,pair.cardanoReturn]:[pair.cardano];
    for(const hash of hashes){
      const fact=byHash.get(hash);if(!fact)continue;
      const rows=BigInt(fact.adaRaw)+BigInt(fact.feeRaw||'0')<0n?fact.externalOutputs||[]:fact.externalInputs||[];
      const addresses=[...new Set(rows.map(row=>row.address).filter(address=>(validAddress(address)||validByronAddress(address))&&!owned.has(address)))];
      if(addresses.length!==1)continue;
      const roots=nextCardano.filter(wallet=>wallet.group==='swap'&&rows.some(row=>row.address===wallet.address||row.stakeAddress===wallet.address||groups[wallet.address]?.includes(row.address)||wallet.swapAddresses?.includes(row.address)));
      if(roots.length===1){const updated=add(roots[0],addresses);if(updated!==roots[0])nextCardano=nextCardano.map(wallet=>wallet===roots[0]?updated:wallet);}
    }
    if('ethereum' in pair){
      const tx=byId.get(pair.ethereum);if(!tx)continue;
      const roots=nextEthereum.filter(wallet=>wallet.group==='swap'&&[tx.from,tx.to].some(address=>address===wallet.address||wallet.swapAddresses?.includes(address)));
      if(roots.length!==1)continue;
      const regular=new Set(nextEthereum.filter(wallet=>wallet.group!=='swap').map(wallet=>wallet.address));
      const addresses=[tx.from,tx.to].filter(address=>address&&address!==roots[0].address&&!regular.has(address));
      if(addresses.length===1){const updated=add(roots[0],addresses);if(updated!==roots[0])nextEthereum=nextEthereum.map(wallet=>wallet===roots[0]?updated:wallet);}
    }
  }
  return {cardano:nextCardano,ethereum:nextEthereum};
}
