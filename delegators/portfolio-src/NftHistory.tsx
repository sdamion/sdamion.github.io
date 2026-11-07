import React,{useState} from 'react';
import type {Market} from './core';
import {assetImageCandidates} from './asset-image';
import type {historicalNfts} from './historical-nfts';
import {ordinalImage} from './ordinals';

export function NftPreview({rows,markets}:{rows:ReturnType<typeof historicalNfts>;markets:Record<string,Market>}){
  return <div className="portfolio-nft-strip" aria-hidden="true">{rows.slice(0,3).map(row=><HistoryImage key={row.id} id={row.id} image={row.image} market={markets[row.id]} ordinal={row.ordinal}/>)}</div>;
}
function HistoryImage({id,image,market,ordinal}:{id:string;image?:string|null;market?:Market;ordinal?:ReturnType<typeof historicalNfts>[number]['ordinal']}){
  const [failed,setFailed]=useState<string[]>([]);
  const source=(ordinal?[ordinalImage(ordinal.id,ordinal.contentType)].filter((value):value is string=>!!value):assetImageCandidates(id,[image,market?.registry_logo,market?.cached_image,market?.wayup_image,market?.image,market?.image_url,market?.logo])).find(url=>!failed.includes(url));
  return source?<img src={source} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>:<span/>;
}
