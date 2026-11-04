import {validEthereumAddress} from './ethereum.ts';
import {validSolana} from './solana.ts';
import {validBitcoinAddress} from './bitcoin.ts';
import type {AssetWallet} from './owned-assets.ts';

type AssetSource={
  endpoint:string;
  kinds:readonly string[];
  pagination:'cursor'|'page';
  validAddress:(address:string)=>boolean;
  normalizeAddress:(address:string)=>string;
  explorerHosts:readonly string[];
};
export const assetSources:Record<AssetWallet['chain'],AssetSource>={
  ethereum:{endpoint:'/ethereum',kinds:['tokens','nfts'],pagination:'cursor',validAddress:validEthereumAddress,normalizeAddress:address=>address.toLowerCase(),explorerHosts:['eth.blockscout.com']},
  solana:{endpoint:'/solana',kinds:['assets'],pagination:'page',validAddress:validSolana,normalizeAddress:address=>address,explorerHosts:['solscan.io']},
  bitcoin:{endpoint:'/bitcoin-ordinals',kinds:['runes','brc20'],pagination:'page',validAddress:validBitcoinAddress,normalizeAddress:address=>address,explorerHosts:['ordiscan.com']}
};
