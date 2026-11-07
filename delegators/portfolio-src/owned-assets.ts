import {assetSources} from './asset-source-registry.ts';
import {assetImageUrl} from './asset-image.ts';
import {compactBlock,expandBlock,CACHE_RECORDS_PER_PART} from './compact-storage.ts';

export type AssetChain='cardano'|'ethereum'|'solana'|'bitcoin';
export type OwnedAsset={id:string;chain:AssetChain;standard:string;name:string;symbol:string;raw:string;decimals:number|null;image:string|null;explorer:string|null};
export type AssetWallet={chain:Exclude<AssetChain,'cardano'>;address:string;name:string};
export type AssetAccount={chain:AssetWallet['chain'];address:string;checkedAt:number;assets:OwnedAsset[]};
export type OwnedAssetsData=Record<string,AssetAccount>;
export const accountKey=(wallet:Pick<AssetWallet,'chain'|'address'>)=>wallet.chain+':'+assetSources[wallet.chain].normalizeAddress(wallet.address);
export const validAssetWallet=(row:Pick<AssetWallet,'chain'|'address'>)=>Object.hasOwn(assetSources,row.chain)&&assetSources[row.chain].validAddress(row.address);
export const assetIsFt=(row:OwnedAsset)=>row.chain==='cardano'?['Native','FT'].includes(row.standard):assetSources[row.chain].ftStandards.includes(row.standard);
export const assetIsNft=(row:OwnedAsset)=>row.chain==='cardano'?row.standard==='NFT':assetSources[row.chain].nftStandards.includes(row.standard);
export function validOwnedAsset(value:unknown):value is OwnedAsset{
  const row=value as OwnedAsset;
  if(!row||typeof row.id!=='string'||row.id.length>350||!Object.hasOwn(assetSources,row.chain)||!row.id.startsWith(row.chain+':')||typeof row.standard!=='string'||row.standard.length>40||!['name','symbol'].every(key=>typeof row[key as 'name'|'symbol']==='string'&&row[key as 'name'|'symbol'].length<=200)||typeof row.raw!=='string'||!/^\d{1,100}$/.test(row.raw)||!(row.decimals===null||Number.isSafeInteger(row.decimals)&&row.decimals>=0&&row.decimals<=255))return false;
  if(!assetIsFt(row)&&!assetIsNft(row))return false;
  if(row.image!==null&&(!row.image||assetImageUrl(row.image)!==row.image))return false;
  try{if(row.explorer!==null){const url=new URL(row.explorer);if(url.protocol!=='https:'||url.username||url.password||!Object.values(assetSources).some(source=>source.explorerHosts.includes(url.hostname)))return false;}}catch{return false;}
  return true;
}
export function normalizeOwnedAsset(value:unknown):OwnedAsset|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const row={...value,image:assetImageUrl((value as {image?:unknown}).image)};
  return validOwnedAsset(row)?row:null;
}
export function assetQuantity(row:Pick<OwnedAsset,'raw'|'decimals'>){
  if(row.decimals===null)return row.raw;
  const value=BigInt(row.raw).toString().padStart(row.decimals+1,'0');
  const fraction=row.decimals?value.slice(-row.decimals).replace(/0+$/,''):'';
  return row.decimals?value.slice(0,-row.decimals)+(fraction?'.'+fraction:''):value;
}
export function mergeOwnedAssets(data:OwnedAssetsData,wallets:AssetWallet[]){
  const result=new Map<string,OwnedAsset&{wallets:string[];addresses:string[]}>();
  for(const wallet of new Map(wallets.map(wallet=>[accountKey(wallet),wallet])).values()){
    const account=data[accountKey(wallet)];if(!account||account.address!==wallet.address||account.chain!==wallet.chain)continue;
    for(const asset of account.assets){
      if(BigInt(asset.raw)===0n)continue;
      const row=result.get(asset.id);
      if(!row){result.set(asset.id,{...asset,wallets:[wallet.name],addresses:[wallet.address]});continue;}
      if(row.standard!==asset.standard||(row.decimals===null)!==(asset.decimals===null))throw new Error('Owned assets unavailable. Saved data is retained.');
      const scale=row.decimals===null?null:Math.max(row.decimals,asset.decimals!);
      row.raw=String(BigInt(row.raw)*10n**BigInt((scale??0)-(row.decimals??0))+BigInt(asset.raw)*10n**BigInt((scale??0)-(asset.decimals??0)));
      row.decimals=scale;row.wallets.push(wallet.name);row.addresses.push(wallet.address);
    }
  }
  return [...result.values()];
}
export function encodeOwnedAssets(key:string,data:OwnedAssetsData){
  const settings:Record<string,string>={},accounts:Record<string,unknown>={};
  for(const [id,{assets,...header}]of Object.entries(data)){
    const parts=Math.ceil(assets.length/CACHE_RECORDS_PER_PART);accounts[id]={...header,parts};
    for(let part=0;part<parts;part++)settings[`${key}::${id}:${part}`]=JSON.stringify(compactBlock(assets.slice(part*CACHE_RECORDS_PER_PART,(part+1)*CACHE_RECORDS_PER_PART)));
  }
  settings[key]=JSON.stringify({version:1,accounts});return settings;
}
export function readOwnedAssets(key:string,get:(key:string)=>string|null):OwnedAssetsData{
  const value=JSON.parse(get(key)||'null');if(value===null)return {};
  if(value.version!==1||!value.accounts||typeof value.accounts!=='object')throw new Error('Owned asset cache is incomplete. Saved data is retained.');
  const result:OwnedAssetsData={};
  for(const [id,header]of Object.entries(value.accounts) as [string,AssetAccount&{parts:number}][]){
    if(!validAssetWallet(header)||accountKey(header)!==id||!Number.isSafeInteger(header.checkedAt)||header.checkedAt<=0||!Number.isSafeInteger(header.parts)||header.parts<0)throw new Error('Owned asset cache is incomplete. Saved data is retained.');
    const assets:OwnedAsset[]=[];
    for(let part=0;part<header.parts;part++){
      const raw=get(`${key}::${id}:${part}`);if(raw===null)throw new Error('Owned asset cache is incomplete. Saved data is retained.');
      const rows=expandBlock(JSON.parse(raw));if(!Array.isArray(rows)||rows.length>CACHE_RECORDS_PER_PART||rows.some(row=>!validOwnedAsset(row)||row.chain!==header.chain))throw new Error('Owned asset cache is incomplete. Saved data is retained.');
      assets.push(...rows);
    }
    if(new Set(assets.map(row=>row.id)).size!==assets.length)throw new Error('Owned asset cache is incomplete. Saved data is retained.');
    result[id]={chain:header.chain,address:header.address,checkedAt:header.checkedAt,assets};
  }return result;
}
