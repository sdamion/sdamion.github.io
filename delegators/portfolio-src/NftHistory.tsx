import React,{useState} from 'react';
import type {Market} from './core';
import {assetImageCandidates} from './asset-image';
import {nftHighlights,type NftEvent} from './nft-history';
import type {historicalNfts} from './historical-nfts';
import {usePortfolioText} from './use-portfolio-text';

export function NftHighlights({rows,events,markets,preview=false}:{rows:ReturnType<typeof historicalNfts>;events:NftEvent[];markets:Record<string,Market>;preview?:boolean}){
  const t=usePortfolioText(),{top,fastest}=nftHighlights(rows,events);
  return <div className="portfolio-nft-highlights" translate="no">
    {preview&&<div className="portfolio-nft-strip" aria-hidden="true">{rows.slice(0,3).map(row=><HistoryImage key={row.id} id={row.id} market={markets[row.id]}/>)}</div>}
    <div><span>{t('Top collection')}</span><strong>{top?.name||'—'}</strong>{top&&<small>{t('{count} NFTs',{count:String(top.count)})}</small>}</div>
    <div><span>{t('Fastest flip')}</span><strong>{fastest?.name||t('No confirmed buy-to-sell match')}</strong>{fastest&&<small>{t('{days}d {hours}h {minutes}m {seconds}s',{days:String(Math.floor(fastest.seconds/86400)),hours:String(Math.floor(fastest.seconds/3600)%24),minutes:String(Math.floor(fastest.seconds/60)%60),seconds:String(fastest.seconds%60)})}</small>}</div>
  </div>;
}
function HistoryImage({id,market}:{id:string;market?:Market}){
  const [failed,setFailed]=useState<string[]>([]);
  const source=assetImageCandidates(id,[market?.registry_logo,market?.cached_image,market?.wayup_image,market?.image,market?.image_url,market?.logo]).find(url=>!failed.includes(url));
  return source?<img src={source} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>:<span/>;
}
