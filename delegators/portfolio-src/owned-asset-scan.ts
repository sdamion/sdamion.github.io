import {scanProviderPages} from './provider-scan.ts';
import {normalizeOwnedAsset,type AssetWallet,type OwnedAsset} from './owned-assets.ts';
import {assetSources} from './asset-source-registry.ts';

type AssetPage={address:string;assets:unknown[];more?:boolean;cursor?:unknown};
const unavailable='Owned assets unavailable. Saved data is retained.';
const incomplete='Owned asset scan is incomplete. Saved data is retained.';

export async function scanOwnedAssets(wallet:AssetWallet,signal:AbortSignal,request:(endpoint:string,body:object)=>Promise<unknown>):Promise<OwnedAsset[]>{
  const source=assetSources[wallet.chain],assets:OwnedAsset[]=[],seenAssets=new Set<string>();
  for(const kind of source.kinds){
    await scanProviderPages<AssetPage,unknown>({
      signal,maxPages:1000,error:incomplete,
      fetchPage:(cursor,page)=>request(source.endpoint,{action:wallet.chain==='bitcoin'?kind:'assets',address:wallet.address,...(source.pagination==='cursor'?{kind,cursor:cursor??null}:{page:page+1})}),
      validPage:(value):value is AssetPage=>{
        if(!value||typeof value!=='object')return false;
        const row=value as AssetPage;
        return row.address===wallet.address&&Array.isArray(row.assets)
          &&(source.pagination==='cursor'?row.cursor===null||!!row.cursor&&typeof row.cursor==='object'&&!Array.isArray(row.cursor):typeof row.more==='boolean');
      },
      hasMore:value=>source.pagination==='cursor'?value.cursor!==null:value.more===true,
      nextCursor:(value,page)=>source.pagination==='cursor'?value.cursor:page+2,
      onPage:value=>{
        for(const item of value.assets){
          const row=normalizeOwnedAsset(item);
          if(!row||row.chain!==wallet.chain)throw new Error(unavailable);
          if(seenAssets.has(row.id))throw new Error(incomplete);
          seenAssets.add(row.id);assets.push(row);
        }
      }
    });
  }
  return assets;
}
