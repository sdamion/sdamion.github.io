import {useState} from 'react';
import type {ReactNode} from 'react';
import {MenuTile} from './ui';
import {AssetOverlay} from './AssetOverlay';

export function WalletMenu({wallets,exchanges,byron,swap,counts}:{wallets:ReactNode;exchanges:ReactNode;byron:ReactNode;swap:ReactNode;counts:{wallets:number;exchanges:number;byron:number}}){
  const [section,setSection]=useState<'wallets'|'exchanges'|'byron'|null>(null);
  const sections={
    wallets:{title:'My Wallets',content:wallets},
    exchanges:{title:'DEX / CEX',content:exchanges},
    byron:{title:'Byron DEX / CEX',content:byron}
  };
  return <>
    <div className="tdsp-tile-grid">
      <MenuTile title={sections.wallets.title} value={String(counts.wallets)} onOpen={()=>setSection('wallets')}/>
      <MenuTile title={sections.exchanges.title} value={String(counts.exchanges)} onOpen={()=>setSection('exchanges')}/>
      <MenuTile title={sections.byron.title} value={String(counts.byron)} onOpen={()=>setSection('byron')}/>
      {swap}
    </div>
    {section&&<AssetOverlay id={`portfolio-wallet-menu-${section}`} name={sections[section].title} onClose={()=>setSection(null)}>{sections[section].content}</AssetOverlay>}
  </>;
}
