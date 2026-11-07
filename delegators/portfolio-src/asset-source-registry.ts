import {validEthereumAddress} from './ethereum.ts';
import {validSolana} from './solana.ts';
import {validBitcoinAddress} from './bitcoin.ts';
import type {AssetWallet} from './owned-assets.ts';

type AssetSource={
  label:string;
  endpoint:string;
  kinds:readonly string[];
  ftStandards:readonly string[];
  nftStandards:readonly string[];
  pagination:'cursor'|'page';
  validAddress:(address:string)=>boolean;
  normalizeAddress:(address:string)=>string;
  explorerHosts:readonly string[];
};
export const assetSources:Record<AssetWallet['chain'],AssetSource>={
  ethereum:{label:'Ethereum',endpoint:'/ethereum',kinds:['tokens','nfts'],ftStandards:['Native','FT','ERC-20'],nftStandards:['NFT','ERC-721','ERC-1155','ERC-404'],pagination:'cursor',validAddress:validEthereumAddress,normalizeAddress:address=>address.toLowerCase(),explorerHosts:['eth.blockscout.com']},
  solana:{label:'Solana',endpoint:'/solana',kinds:['assets'],ftStandards:['Native','FT','SPL'],nftStandards:['NFT','V1_NFT','V2_NFT','ProgrammableNFT','MplCoreAsset','IdentityNFT','Compressed NFT'],pagination:'page',validAddress:validSolana,normalizeAddress:address=>address,explorerHosts:['solscan.io']},
  bitcoin:{label:'Bitcoin',endpoint:'/bitcoin-ordinals',kinds:['runes','brc20'],ftStandards:['Native','FT','Rune','BRC-20'],nftStandards:['NFT','Ordinal'],pagination:'page',validAddress:validBitcoinAddress,normalizeAddress:address=>address,explorerHosts:['ordiscan.com']}
};
