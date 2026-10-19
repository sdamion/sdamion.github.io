import React,{useState} from 'react';
import type {Market} from './core';
import {assetImageCandidates} from './asset-image';
import type {historicalNfts} from './historical-nfts';

export function NftPreview({rows,markets}:{rows:ReturnType<typeof historicalNfts>;markets:Record<string,Market>}){
  return <div className="portfolio-nft-strip" aria-hidden="true">{rows.slice(0,3).map(row=><HistoryImage key={row.id} id={row.id} market={markets[row.id]}/>)}</div>;
}
function HistoryImage({id,market}:{id:string;market?:Market}){
  const [failed,setFailed]=useState<string[]>([]);
  const source=assetImageCandidates(id,[market?.registry_logo,market?.cached_image,market?.wayup_image,market?.image,market?.image_url,market?.logo]).find(url=>!failed.includes(url));
  return source?<img src={source} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>:<span/>;
}
