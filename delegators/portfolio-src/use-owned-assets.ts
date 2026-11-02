import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {accountKey,encodeOwnedAssets,readOwnedAssets,normalizeOwnedAsset,validAssetWallet,type AssetWallet,type OwnedAsset,type OwnedAssetsData} from './owned-assets';

export function useOwnedAssets(stake:string,enabled:boolean,active:boolean,wallets:AssetWallet[]){
  const key='tdsp-member-owned-assets:'+stake;
  const [data,setData]=useState<OwnedAssetsData>({}),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[errors,setErrors]=useState<{wallet:string;message:string}[]>([]);
  const current=useRef(data),control=useRef<AbortController|null>(null),targets=useRef(wallets);targets.current=wallets;
  const scope=[...new Set(wallets.map(accountKey))].sort().join('|');
  useEffect(()=>{
    control.current?.abort();setBusy(false);setLoaded(false);setErrors([]);current.current={};setData({});
    if(enabled)try{current.current=readOwnedAssets(key,name=>portfolioSettings.getItem(name));setData(current.current);setLoaded(true);}catch{setErrors([{wallet:'',message:'Owned asset cache is incomplete. Saved data is retained.'}]);}
    return()=>control.current?.abort();
  },[stake,enabled]);
  const refresh=useCallback(async(force=false)=>{
    if(!enabled||!loaded)return;
    control.current?.abort();const controller=new AbortController();control.current=controller;const {signal}=controller;
    setBusy(true);setErrors([]);
    const errors:{wallet:string;message:string}[]=[];
    try{
      for(const wallet of new Map(targets.current.map(wallet=>[accountKey(wallet),wallet])).values()){
        if(!validAssetWallet(wallet))continue;
        const id=accountKey(wallet),saved=current.current[id];
        if(!force&&saved&&Date.now()-saved.checkedAt<600000)continue;
        try{
          const assets:OwnedAsset[]=[],seen=new Set<string>();
          const kinds=wallet.chain==='ethereum'?['tokens','nfts']:wallet.chain==='bitcoin'?['runes','brc20']:['assets'];
          for(const kind of kinds){
            let cursor:unknown=null;const cursors=new Set<string>();
            for(let page=1;;page++){
              if(page>1000)throw new Error('Owned asset scan is incomplete. Saved data is retained.');
              signal.throwIfAborted();
              const response=await portfolioFetch('/'+(wallet.chain==='bitcoin'?'bitcoin-ordinals':wallet.chain),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:wallet.chain==='bitcoin'?kind:'assets',address:wallet.address,...(wallet.chain==='ethereum'?{kind,cursor}:{page})}),signal});
              const result=await response.json();if(!response.ok)throw new Error(result.error||'Owned assets unavailable. Saved data is retained.');
              if(result.address!==wallet.address||!Array.isArray(result.assets))throw new Error('Owned assets unavailable. Saved data is retained.');
              for(const value of result.assets){
                const row=normalizeOwnedAsset(value);
                if(!row||row.chain!==wallet.chain)throw new Error('Owned assets unavailable. Saved data is retained.');
                if(seen.has(row.id))throw new Error('Owned asset scan is incomplete. Saved data is retained.');seen.add(row.id);assets.push(row);
              }
              if(wallet.chain==='ethereum'){
                if(result.cursor===null)break;
                if(!result.cursor||typeof result.cursor!=='object')throw new Error('Owned asset scan is incomplete. Saved data is retained.');
                const next=JSON.stringify(result.cursor);if(cursors.has(next))throw new Error('Owned asset scan is incomplete. Saved data is retained.');cursors.add(next);cursor=result.cursor;
              }else{if(typeof result.more!=='boolean')throw new Error('Owned asset scan is incomplete. Saved data is retained.');if(!result.more)break;}
            }
          }
          signal.throwIfAborted();
          const next={...current.current,[id]:{chain:wallet.chain,address:wallet.address,checkedAt:Date.now(),assets}};
          const settings=encodeOwnedAssets(key,next);
          portfolioSettings.setItems(settings,portfolioSettings.keys().filter(name=>name.startsWith(key+'::')&&!Object.hasOwn(settings,name)));
          await flushVault();signal.throwIfAborted();current.current=next;setData(next);
        }catch(error){if(signal.aborted)throw error;errors.push({wallet:wallet.name,message:error instanceof Error?error.message:'Owned assets unavailable. Saved data is retained.'});setErrors([...errors]);}
      }
    }finally{if(control.current===controller)setBusy(false);}
  },[enabled,loaded,stake,scope]);
  useEffect(()=>{if(active)void refresh().catch(()=>{});return()=>control.current?.abort();},[active,refresh]);
  const incomplete=wallets.some(wallet=>!data[accountKey(wallet)]);
  return {data,busy,errors,incomplete,refresh};
}
