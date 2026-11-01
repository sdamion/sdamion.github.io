import {useCallback,useEffect,useRef,useState} from 'react';
import {portfolioFetch} from './transport';
import {portfolioSettings,flushVault} from './vault';
import type {BitcoinData,BitcoinWallet} from './bitcoin';
import {emptyOrdinals,ordinalId,validOrdinalActivity,validOrdinalMetadata,type OrdinalsData,type OrdinalMetadata,type OrdinalActivity} from './ordinals';
import {encodeOrdinalsSettings,readOrdinalsSettings} from './ordinals-storage';

export function useOrdinals(stake:string,enabled:boolean,wallets:BitcoinWallet[],bitcoin:BitcoinData,active:boolean,visibleIds:string,currentOnly=false){
  const key='tdsp-member-bitcoin-ordinals:'+stake;
  const [data,setData]=useState(emptyOrdinals),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[metadataError,setMetadataError]=useState(''),[checked,setChecked]=useState(0);
  const current=useRef(data),controller=useRef<AbortController|null>(null),failedMetadata=useRef(new Set<string>());
  const scope=wallets.map(w=>w.address).sort().join('|'),tips=wallets.map(w=>bitcoin.accounts[w.address]?.tip||'').join('|');
  useEffect(()=>{
    controller.current?.abort();setBusy(false);setLoaded(false);setError('');setMetadataError('');failedMetadata.current.clear();current.current=emptyOrdinals();setData(current.current);
    if(!enabled)return;
    try{current.current=readOrdinalsSettings(key,name=>portfolioSettings.getItem(name));setData(current.current);setLoaded(true);}catch{setError('Ordinals cache is incomplete. Saved history is retained.');}
    return()=>controller.current?.abort();
  },[enabled,stake]);
  async function persist(value:OrdinalsData,signal:AbortSignal){
    signal.throwIfAborted();const settings=encodeOrdinalsSettings(key,value);
    portfolioSettings.setItems(settings,portfolioSettings.keys().filter(name=>name.startsWith(key+'::')&&!Object.hasOwn(settings,name)));
    await flushVault();signal.throwIfAborted();current.current=value;setData(value);
  }
  async function request(body:object,signal:AbortSignal){
    const response=await portfolioFetch('/bitcoin-ordinals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Ordinals data unavailable. Saved history is retained.');return result;
  }
  const refresh=useCallback(async(force=false)=>{
    if(!enabled||!loaded||!wallets.length)return;
    if(!currentOnly&&wallets.some(wallet=>!bitcoin.accounts[wallet.address])){setError('Refresh Bitcoin wallets before loading Ordinals.');return;}
    controller.current?.abort();const control=new AbortController();controller.current=control;const signal=control.signal;
    setBusy(true);setError('');setMetadataError('');setChecked(0);failedMetadata.current.clear();
    try{
      const next:OrdinalsData={accounts:{},metadata:{...current.current.metadata}};let count=0;
      for(const wallet of wallets){
        const saved=current.current.accounts[wallet.address],tip=bitcoin.accounts[wallet.address]?.tip||'0'.repeat(64);
        if(!force&&saved?.tip===tip&&(currentOnly||saved.historyComplete!==false)&&Date.now()-saved.checkedAt<(currentOnly?600000:86400000)){next.accounts[wallet.address]=saved;continue;}
        const owned:OrdinalMetadata[]=[],events:OrdinalActivity[]=currentOnly?[...saved?.events||[]]:[];
        for(const action of (currentOnly?['owned']:['owned','activity']) as ('owned'|'activity')[]){
          const seen=new Set<string>(),max=action==='owned'?1000:250;
          for(let page=1;;page++){
            if(page>max)throw new Error('Ordinals history exceeds the provider page limit. Saved history is retained.');
            const result=await request({action,address:wallet.address,page},signal);
            if(result.address!==wallet.address||!Array.isArray(result.rows)||typeof result.more!=='boolean'||result.more&&!result.rows.length)throw new Error('Ordinals data unavailable. Saved history is retained.');
            for(const row of result.rows){
              if(action==='owned'){
                if(!validOrdinalMetadata(row)||row.owner!==wallet.address||seen.has(row.id))throw new Error('Ordinals data unavailable. Saved history is retained.');
                seen.add(row.id);owned.push(row);next.metadata[row.id]=row;
              }else{
                if(!validOrdinalActivity(row))throw new Error('Ordinals data unavailable. Saved history is retained.');
                const id=`${row.id}:${row.hash}:${row.side}:${row.confirmed}`;if(seen.has(id))throw new Error('Ordinals data unavailable. Saved history is retained.');seen.add(id);events.push(row);
              }
              count++;
            }
            setChecked(count);if(!result.more)break;
          }
        }
        next.accounts[wallet.address]={tip,checkedAt:Date.now(),owned,events,historyComplete:!currentOnly};
      }
      // Replace only complete address scans; partial failures keep the prior cache.
      await persist({...next,metadata:{...current.current.metadata,...next.metadata}},signal);
    }catch(reason){if(!signal.aborted)setError(reason instanceof Error?reason.message:'Ordinals data unavailable. Saved history is retained.');}
    finally{if(controller.current===control)setBusy(false);}
  },[enabled,loaded,stake,scope,tips,currentOnly]);
  useEffect(()=>{if(active)void refresh();return()=>controller.current?.abort();},[active,refresh]);
  const missing=active&&!busy?visibleIds.split('|').map(value=>value.replace(/^bitcoin:ordinal:/,'')).filter(id=>ordinalId(id)&&!data.metadata[id]&&!failedMetadata.current.has(id)).slice(0,6).sort().join('|'):'';
  useEffect(()=>{
    if(!enabled||!loaded||!missing)return;
    const control=new AbortController();let additions:Record<string,OrdinalMetadata>={};
    void (async()=>{
      try{
        for(const id of missing.split('|')){
          const result=await request({action:'metadata',id},control.signal);
          if(!validOrdinalMetadata(result.metadata)||result.metadata.id!==id)throw new Error('Ordinals data unavailable. Saved history is retained.');
          additions[id]=result.metadata;
        }
        await persist({...current.current,metadata:{...current.current.metadata,...additions}},control.signal);setMetadataError('');
      }catch(reason){
        if(control.signal.aborted)return;for(const id of missing.split('|'))if(!additions[id])failedMetadata.current.add(id);
        setMetadataError(reason instanceof Error?reason.message:'Ordinals data unavailable. Saved history is retained.');
        if(Object.keys(additions).length)try{await persist({...current.current,metadata:{...current.current.metadata,...additions}},control.signal);}catch{/* Retain already saved metadata and the original failure. */}
      }
    })();return()=>control.abort();
  },[enabled,loaded,stake,missing]);
  return {data,busy,error:error||metadataError,checked,refresh};
}
