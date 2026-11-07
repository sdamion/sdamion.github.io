import {useState} from 'react';
import type {ReactNode} from 'react';
import {MenuTile} from './ui';
import {AssetOverlay} from './AssetOverlay';

export function WalletMenu({wallets,exchanges,counts,startSection=null}:{wallets:ReactNode;exchanges:ReactNode;counts:{wallets:number;exchanges:number;swap:number};startSection?:'wallets'|'exchanges'|null}){
  const [section,setSection]=useState<'wallets'|'exchanges'|null>(startSection);
  const sections={
    wallets:{title:'My Wallets',content:wallets},
    exchanges:{title:'DEX / CEX & Swap',content:exchanges}
  };
  return <>
    <div className="tdsp-tile-grid">
      <MenuTile title={sections.wallets.title} info="Lists your own wallets, including personal exchange deposit wallets and their balances." value={String(counts.wallets)} onOpen={()=>setSection('wallets')}/>
      <MenuTile title={sections.exchanges.title} info="Lists exchange and swap counterparties used to classify transfers, without treating shared balances as yours." value={String(counts.exchanges+counts.swap)} onOpen={()=>setSection('exchanges')}/>
    </div>
    {section&&<AssetOverlay id={`portfolio-wallet-menu-${section}`} name={sections[section].title} onClose={()=>setSection(null)}>{sections[section].content}</AssetOverlay>}
  </>;
}
