import {useEffect,useState} from 'react';
import {portfolioFetch} from './transport';

export function useBtcHistory(active:boolean){
  const [history,setHistory]=useState<Record<string,number>>({});
  const [status,setStatus]=useState('Loading historical BTC prices…');
  useEffect(()=>{
    if(!active)return;
    const controller=new AbortController();
    setStatus('Loading historical BTC prices…');
    void (async()=>{
      try{
        const response=await portfolioFetch('/historical-btc-prices',{signal:controller.signal});
        if(!response.ok)throw new Error('BTC history unavailable');
        const data=await response.json();
        if(!Array.isArray(data.prices))throw new Error('Invalid BTC history');
        const rows:Record<string,number>={};
        for(const row of data.prices){
          if(!Array.isArray(row)||!Number.isFinite(row[0])||!Number.isFinite(row[1])||row[1]<=0)continue;
          const date=new Date(row[0]);
          if(Number.isFinite(date.getTime()))rows[date.toISOString().slice(0,10)]=row[1];
        }
        if(!Object.keys(rows).length)throw new Error('Empty BTC history');
        if(!controller.signal.aborted){setHistory(rows);setStatus('');}
      }catch{if(!controller.signal.aborted)setStatus('Historical BTC prices unavailable');}
    })();
    return()=>controller.abort();
  },[active]);
  return {history,status};
}
