import {useState,type ReactNode} from 'react';
import {ImageOff,ExternalLink} from 'lucide-react';
import {AssetOverlay} from './AssetOverlay';
import {ordinalImage,ordinalFrame} from './ordinals';
import type {HistoricalNftRow} from './historical-nfts';
import {usePortfolioText} from './use-portfolio-text';
import {useArtworkLoading} from './use-artwork-loading';

export function OrdinalNftTile({row,caption}:{row:HistoricalNftRow;caption:ReactNode}){
  const [open,setOpen]=useState(false),[failed,setFailed]=useState(false),t=usePortfolioText(),ordinal=row.ordinal;
  const artwork=useArtworkLoading();
  if(!ordinal)return null;
  const source=failed?null:ordinalImage(ordinal.id,ordinal.contentType);
  const frame=ordinalFrame(ordinal.id,ordinal.contentType);
  // Recursive artwork needs scripts, but never the site's origin, storage or navigation privileges.
  const recursivePreview=(preview=false)=><iframe className={preview?'portfolio-ordinal-preview':'portfolio-ordinal-frame'} src={frame!} title={row.name} sandbox="allow-scripts" referrerPolicy="no-referrer" loading="eager" tabIndex={preview?0:-1} allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; clipboard-read 'none'; clipboard-write 'none'; usb 'none'; fullscreen 'none'"/>;
  return <><div ref={artwork.ref} className="portfolio-nft-tile" data-inscription={ordinal.id}>
    <button type="button" className="portfolio-image-preview-button" aria-label={t('View {name} details',{name:row.name})} onClick={()=>setOpen(true)}>
      {artwork.load&&source?<img className="portfolio-asset-image" src={source} alt={row.name} title={row.name} loading="eager" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:artwork.load&&frame?recursivePreview():<span className="portfolio-nft-placeholder"><ImageOff size={32} aria-hidden="true"/></span>}{caption}
    </button>
    {!!ordinal.ownedWallets.length&&<span className="portfolio-nft-owned" translate="no"><strong>{t('Owned')}</strong><span title={ordinal.ownedWallets.join(', ')}>{ordinal.ownedWallets.join(', ')}</span></span>}
  </div>
  {open&&<AssetOverlay id="portfolio-ordinal-preview-overlay" name={row.name} literalTitle onClose={()=>setOpen(false)}>
    <p translate="no">Bitcoin Ordinals · {ordinal.number===null?ordinal.id:'#'+ordinal.number} · {ordinal.contentType||'—'}</p>
    {source?<img className="portfolio-image-preview" src={source} alt={row.name} translate="no" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:frame?recursivePreview(true):<p translate="no">{t('Preview unavailable for this inscription type.')}</p>}
    <a href={`https://ordiscan.com/inscription/${ordinal.id}`} target="_blank" rel="noopener noreferrer" translate="no">{t('Open inscription in Ordiscan')} <ExternalLink size={14}/></a>
    <p className="small muted" translate="no">{t('Ordinal purchase/sale prices and valuations are not estimated.')}</p>
  </AssetOverlay>}</>;
}
