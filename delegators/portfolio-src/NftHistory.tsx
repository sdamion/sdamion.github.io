import React,{useEffect,useRef,useState} from 'react';
import type {Market} from './core';
import {assetImageCandidates} from './asset-image';
import {nftHighlights,type NftEvent} from './nft-history';
import type {historicalNfts} from './historical-nfts';
import {usePortfolioText} from './use-portfolio-text';
import {TransactionPagination} from './TransactionPagination';
import {transactionPage} from './transaction-date';

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
export function NftTimeline({events}:{events:NftEvent[]}){
  const t=usePortfolioText(),[page,setPage]=useState(0),signature=events.map(event=>event.hash+event.id).join('|');
  const scrollRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setPage(0);},[signature]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=0;},[signature,page]);
  const current=transactionPage(page,events.length,12);
  return <section className="portfolio-nft-timeline"><h3 translate="no">{t('NFT transaction timeline')} ({events.length})</h3>
    <div ref={scrollRef} className="portfolio-nft-timeline-scroll" role="region" aria-label={t('NFT transaction timeline')} tabIndex={0}>
    {!events.length&&<p className="empty" translate="no">{t('No NFT transactions in loaded history.')}</p>}
    <ol>{events.slice(current.page*12,current.page*12+12).map(event=><li key={event.hash+':'+event.id}>
      <time dateTime={new Date(event.time*1000).toISOString()}>{new Date(event.time*1000).toISOString().replace('T',' ').slice(0,19)} UTC</time>
      <span className="portfolio-nft-event-kind" translate="no">{t(event.kind)}</span><strong translate="no">{event.name}</strong>
      <span translate="no">{event.raw} {t('NFTs')}{event.price!==null?` · ${event.price.toLocaleString(undefined,{maximumFractionDigits:6})} ADA`:''}</span>
      <a href={'https://cexplorer.io/tx/'+encodeURIComponent(event.hash)} target="_blank" rel="noopener noreferrer" translate="no">{t('Transaction')}</a>
    </li>)}</ol>
    </div>
    {events.length>12&&<TransactionPagination position="bottom" page={current.page} count={events.length} pageSize={12} onPage={setPage} ariaLabel="NFT transaction timeline"/>}
  </section>;
}
