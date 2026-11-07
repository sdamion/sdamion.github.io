import {useState} from 'react';
import {ImageOff,ExternalLink,RefreshCw} from 'lucide-react';
import {AssetOverlay} from './AssetOverlay';
import {OrdinalNftTile} from './OrdinalNftTile';
import {TransactionPagination} from './TransactionPagination';
import {usePortfolioText} from './use-portfolio-text';
import {assetQuantity,type OwnedAsset} from './owned-assets';
import {assetIsFt,assetIsNft} from './owned-assets';
import {assetSources} from './asset-source-registry';
import {assetImageCandidates} from './asset-image';
import type {HistoricalNftRow} from './historical-nfts';
import {useArtworkLoading} from './use-artwork-loading';

export type OwnedAssetRow=OwnedAsset&{wallets:string[];ordinal?:HistoricalNftRow};
const chainLabel=(network:OwnedAsset['chain'])=>network==='cardano'?'Cardano':assetSources[network].label;
export function OwnedAssetsGallery({rows,busy,partial,errors,onRefresh,showTypeFilter=false}:{rows:OwnedAssetRow[];busy:boolean;partial:boolean;errors:{wallet:string;message:string}[];onRefresh:()=>void;showTypeFilter?:boolean}){
  const t=usePortfolioText(),[query,setQuery]=useState(''),[chain,setChain]=useState(''),[kind,setKind]=useState(''),[page,setPage]=useState(0);
  const filtered=rows.filter(row=>(!chain||row.chain===chain)&&(!kind||(kind==='fts'?assetIsFt(row):assetIsNft(row)))&&[row.id,row.name,row.symbol,row.standard,...row.wallets].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>a.chain.localeCompare(b.chain)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  const size=24,current=Math.min(page,Math.max(0,Math.ceil(filtered.length/size)-1)),visible=filtered.slice(current*size,(current+1)*size);
  const caption=(row:OwnedAssetRow)=><span className="portfolio-nft-caption" translate="no"><strong>{row.name}</strong><span>{t(chainLabel(row.chain))} · {t(row.standard)}</span><span>{t('Balance')}: {assetQuantity(row)} {row.decimals===null?t('raw units'):row.symbol}</span><span>{row.wallets.join(' · ')}</span></span>;
  return <>
    <div className="portfolio-owned-asset-controls">
      <input type="search" aria-label={t('Search owned assets')} placeholder={t('Asset name, ID or wallet name')} value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}}/>
      <label translate="no">{t('Network')}<select aria-label={t('Network')} value={chain} onChange={event=>{setChain(event.target.value);setPage(0);}}><option value="">{t('All networks')}</option>{(['cardano',...Object.keys(assetSources)] as OwnedAsset['chain'][]).map(network=><option key={network} value={network}>{t(chainLabel(network))}</option>)}</select></label>
      {showTypeFilter&&<label translate="no">{t('Asset type')}<select aria-label={t('Asset type')} value={kind} onChange={event=>{setKind(event.target.value);setPage(0);}}><option value="">{t('All assets')}</option><option value="fts">{t('FTs')}</option><option value="nfts">{t('NFTs')}</option></select></label>}
      <button type="button" className="governance-vote-secondary" aria-label={t('Refresh owned assets')} title={t('Refresh owned assets')} disabled={busy} onClick={onRefresh}><RefreshCw size={18} aria-hidden="true"/></button>
    </div>
    {busy&&<p role="status" translate="no">{t('Checking owned assets…')}</p>}
    {partial&&<p className="small muted" translate="no">{t('Partial asset coverage. Refresh to check every saved wallet.')}</p>}
    {errors.map((error,index)=><p key={index} role="alert" className="small-text error-text" translate="no">{error.wallet&&error.wallet+': '}{t(error.message)}</p>)}
    {filtered.length?<div className="portfolio-nft-collage portfolio-owned-asset-gallery">{visible.map(row=>row.ordinal?<OrdinalNftTile key={row.id} row={row.ordinal} caption={caption(row)}/>:<OwnedAssetCard key={row.id} row={row} caption={caption(row)}/>)}</div>:!busy&&<p className="empty" translate="no">{t('No matching owned assets.')}</p>}
    {filtered.length>size&&<TransactionPagination position="bottom" page={current} count={filtered.length} pageSize={size} onPage={setPage} ariaLabel="Owned asset pages"/>}
  </>;
}
function OwnedAssetCard({row,caption}:{row:OwnedAssetRow;caption:React.ReactNode}){
  const t=usePortfolioText(),[open,setOpen]=useState(false),[failed,setFailed]=useState<string[]>([]);
  const artwork=useArtworkLoading();
  const source=assetImageCandidates(row.id,[row.image]).find(url=>!failed.includes(url));
  const image=artwork.load&&source?<img className="portfolio-asset-image" src={source} alt={row.name} loading="eager" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>:<span className="portfolio-nft-placeholder"><ImageOff size={32} aria-hidden="true"/></span>;
  return <><div ref={artwork.ref} className="portfolio-nft-tile" data-owned-asset={row.id}>
    <button type="button" className="portfolio-image-preview-button" aria-label={t('View {name} details',{name:row.name})} onClick={()=>setOpen(true)}>{image}{caption}</button>
  </div>{open&&<AssetOverlay id="portfolio-owned-asset-overlay" name={row.name} literalTitle onClose={()=>setOpen(false)}>
    <p translate="no">{t(chainLabel(row.chain))} · {t(row.standard)}</p>
    {source&&<img className="portfolio-image-preview" src={source} alt={row.name} referrerPolicy="no-referrer" onError={()=>setFailed(previous=>[...previous,source])}/>}
    <p translate="no">{t('Balance')}: {assetQuantity(row)} {row.decimals===null?t('raw units'):row.symbol}</p><p translate="no">{row.wallets.join(' · ')}</p><p className="portfolio-owned-asset-id" translate="no">{row.id}</p>
    {row.explorer&&<a href={row.explorer} target="_blank" rel="noopener noreferrer" translate="no">{t('Open in explorer')} <ExternalLink size={14}/></a>}
  </AssetOverlay>}</>;
}
