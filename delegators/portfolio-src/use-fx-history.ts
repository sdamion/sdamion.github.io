import {useEffect,useState} from 'react';
import {portfolioFetch} from './transport';
import type {FxHistory} from './transfer-comparison';

export function useFxHistory(active:boolean){
  const [history,setHistory]=useState<FxHistory>({});
  const [status,setStatus]=useState('Loading historical exchange rates…');
  useEffect(()=>{
    if(!active)return;
    const controller=new AbortController();
    setStatus('Loading historical exchange rates…');
    void (async()=>{
      try{
        const response=await portfolioFetch('/historical-fx-prices',{signal:controller.signal});
        if(!response.ok)throw new Error('Exchange rates unavailable');
        const data=await response.json();
        if(!data.rates||typeof data.rates!=='object'||Array.isArray(data.rates))throw new Error('Invalid exchange rates');
        const rows:FxHistory={};
        for(const [date,value] of Object.entries(data.rates)){
          if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!value||typeof value!=='object')continue;
          for(const currency of ['EUR','JPY'] as const){
            const rate=(value as Record<string,unknown>)[currency];
            if(typeof rate==='number'&&Number.isFinite(rate)&&rate>0)(rows[date]??={})[currency]=rate;
          }
        }
        if(!Object.keys(rows).length)throw new Error('Empty exchange rates');
        if(!controller.signal.aborted){setHistory(rows);setStatus('');}
      }catch{if(!controller.signal.aborted)setStatus('Historical exchange rates unavailable');}
    })();
    return()=>controller.abort();
  },[active]);
  return {history,status};
}
