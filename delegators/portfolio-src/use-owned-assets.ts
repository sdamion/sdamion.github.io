import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import {accountKey,encodeOwnedAssets,readOwnedAssets,validAssetWallet,type AssetWallet,type OwnedAssetsData} from './owned-assets';
import {scanOwnedAssets} from './owned-asset-scan';

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
          const assets=await scanOwnedAssets(wallet,signal,async(endpoint,body)=>{
            const response=await portfolioFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
            const result=await response.json();
            if(!response.ok)throw new Error(result.error||'Owned assets unavailable. Saved data is retained.');
            return result;
          });
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
